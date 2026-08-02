# EDR Hook Survey Quick Reference

> For authorized Red Team / adversarial emulation / internal product testing ONLY. Strictly forbidden for unauthorized targets.

This document summarizes monitoring points of major EDR/AV solutions in user space and kernel space, helping Red Teams quickly identify target detection vectors during the reconnaissance phase.

## 1. Mainstream EDR Fingerprints and Hook Patterns

| Vendor / Product | User-mode Components | Kernel Drivers | Main Monitoring Surfaces |
|------------|-----------|---------|-----------|
| CrowdStrike Falcon | `CSFalconService.exe`, `CSAgent.sys` injected into target process | `CSAgent.sys`, `CSBoot.sys` | Heavy kernel callbacks + ETW-TI; fewer user-mode hooks (cloud-based detection) |
| Microsoft Defender for Endpoint (MDE) | `MsMpEng.exe`, `MpClient.dll` | `WdFilter.sys`, `WdBoot.sys`, `WdNisDrv.sys` | Comprehensive AMSI + ETW-TI + ntdll inline hooks + kernel callbacks |
| SentinelOne | `SentinelAgent.exe`, `SentinelHelperService.exe` | `SentinelMonitor.sys`, `SentinelDeviceControl.sys` | Heavy ntdll user-mode hooks + kernel callbacks + proprietary ETW provider |
| Elastic Defend (formerly Endpoint Security) | `elastic-endpoint.exe` | `elastic-endpoint-driver.sys` | Primarily ETW + minimal ntdll hooks, integrated with Elastic Agent telemetry upload |
| ESET | `ekrn.exe`, `eamsi.dll` | `eamonm.sys`, `epfwwfp.sys` | Extensive user-mode hooks (NtCreateFile / NtOpenProcess, etc.) |
| Sophos Intercept X | `SophosFileScanner.exe`, `SophosNtpService.exe` | `SophosED.sys`, `hmpalert.sys` | ntdll hooks + HMPA memory protection + kernel callbacks |
| Kaspersky | `avp.exe`, `klif.sys` | `klif.sys`, `klhk.sys` | Heavy user-mode hooks + proprietary KLIF minifilter + network filter drivers |
| Trend Micro Apex One | `TmListen.exe`, `TmCCSF.dll` | `tmcomm.sys`, `tmactmon.sys` | User-mode hooks + behavioral monitoring drivers |
| Carbon Black | `RepMgr.exe`, `RepWAV.exe` | `ParityDriver.sys` | Kernel callbacks + ETW focused |

### Quick Fingerprint Script

```powershell
$edrSigs = @{
    'CSAgent'           = 'CrowdStrike Falcon'
    'SentinelAgent'     = 'SentinelOne'
    'elastic-endpoint'  = 'Elastic Defend'
    'ekrn'              = 'ESET'
    'MsMpEng'           = 'Microsoft Defender'
    'SophosFileScanner' = 'Sophos Intercept X'
    'avp'               = 'Kaspersky'
    'TmListen'          = 'Trend Micro Apex One'
    'cb'                = 'Carbon Black'
}

Get-Process | ForEach-Object {
    foreach ($k in $edrSigs.Keys) {
        if ($_.ProcessName -match $k) {
            "[+] $($edrSigs[$k]) detected: $($_.ProcessName) (PID $($_.Id))"
        }
    }
}

Get-ChildItem 'C:\Windows\System32\drivers\*.sys' |
    Where-Object { $_.Name -match 'CSAgent|Sentinel|elastic|eam|WdFilter|Sophos|klif|tmcomm|Parity' } |
    Select-Object Name, VersionInfo
```

## 2. Key User-mode ntdll Hook Functions

ntdll.dll exports almost guaranteed to be hooked by EDRs (grouped by ATT&CK behavior):

| Function | Monitored Behavior | ATT&CK |
|------|-----------|--------|
| `NtCreateThreadEx` | Remote thread injection, QueueUserAPC injection | T1055.002 / T1055.004 |
| `NtAllocateVirtualMemory` | Shellcode RWX memory allocation | T1055 |
| `NtAllocateVirtualMemoryEx` | Cross-process memory allocation (Win10+ API) | T1055 |
| `NtProtectVirtualMemory` | Modify page permissions RW→RX | T1055 |
| `NtWriteVirtualMemory` | Cross-process shellcode write | T1055.012 |
| `NtMapViewOfSection` | Section-based injection (Process Doppelganging / Ghosting) | T1055.013 |
| `NtCreateSection` | Paired with MapViewOfSection | T1055.013 |
| `NtOpenProcess` | Open target process to obtain handle | T1057 |
| `NtQueueApcThread` / `NtQueueApcThreadEx` | APC injection | T1055.004 |
| `NtCreateProcess` / `NtCreateProcessEx` / `NtCreateUserProcess` | Child process creation (incl. PPID spoofing) | T1106 |
| `NtSetContextThread` | Modify thread context (thread execution hijacking) | T1055.003 |
| `NtResumeThread` | Resume thread post-injection | T1055 |
| `NtQuerySystemInformation` | Enumerate processes / drivers / handles | T1057 / T1082 |
| `NtAdjustPrivilegesToken` | Privilege escalation to acquire SeDebugPrivilege, etc. | T1134 |
| `NtLoadDriver` | Load kernel driver (BYOVD) | T1543.003 |

### Verify Hook Presence

```powershell
# Simple: Diff disassembly between disk ntdll and current process ntdll
# 1. Obtain disk ntdll
copy C:\Windows\System32\ntdll.dll C:\temp\ntdll_clean.dll

# 2. Attach to any process in WinDbg, export current ntdll .text section
# .writemem c:\temp\ntdll_live.bin ntdll!.text L?<size>

# 3. Disassemble NtAllocateVirtualMemory in IDA / radare2, expected standard prologue:
#    mov r10, rcx
#    mov eax, <SSN>
#    test byte ptr [...]
#    jne ...
#    syscall
#    ret
# If the first instruction is jmp <address>, it is hooked
```

## 3. Kernel Callback Monitoring Points

Common kernel callbacks registered by EDRs (can be unregistered via the BYOVD path in `attack-chain`, but at high risk/cost):

| API | Registration Trigger | Defender Purpose |
|-----|--------------|-----------|
| `PsSetCreateProcessNotifyRoutineEx` | Process creation / termination | Intercept suspicious child processes |
| `PsSetCreateThreadNotifyRoutine` | Thread creation / termination | Detect remote thread injection |
| `PsSetLoadImageNotifyRoutine` | DLL / EXE loaded into any process | Module integrity / intercept unsigned modules |
| `CmRegisterCallback` / `CmRegisterCallbackEx` | Registry operations | Persistence detection |
| `ObRegisterCallbacks` | `OpenProcess` / `OpenThread` handle requests | Prevent LSASS handle acquisition (T1003.001) |
| `MmRegisterPhysicalMemoryCallback` | Physical memory mapping | Prevent DMA / memory forensics |
| `IoRegisterFsRegistrationChange` | File system registration | Minifilter coordination |
| `KeRegisterNmiCallback` | NMI (rarely used by EDRs) | Anomaly monitoring |
| `EtwRegister` (kernel side) | Kernel ETW telemetry reporting | Coexists with ETW-TI |

### Enumerate Registered Callbacks via WinDbg

```text
0: kd> dx -r1 nt!PspCreateProcessNotifyRoutine
0: kd> dx -r1 nt!PspCreateThreadNotifyRoutine
0: kd> dx -r1 nt!PspLoadImageNotifyRoutine

0: kd> !object \Callback
0: kd> !object \Callback\ProcessObject
```

Alternatively, use GUI tools like PCHunter / DRVHV to inspect callback lists.

## 4. Static Hook Table Dump (IDA + WinDbg Procedure)

### Procedure A: Single Process Comparison

```text
1. Find a process injected with EDR user-mode components (any running process)
2. windbg attach (-pn target.exe)
3. lm m ntdll  → Get module base address
4. .writemem c:\temp\ntdll_live.bin ntdll+0x0 L?<image size>
5. Copy C:\Windows\System32\ntdll.dll to c:\temp\ntdll_disk.dll
6. Load both files in IDA, navigate to NtAllocateVirtualMemory:
     - disk: Standard prologue
     - live: First instruction jmp <0x7FFE000000xx>
7. Follow the jmp target address — that is the EDR trampoline, dump it
8. Inspect the trampoline to determine which DLL it targets and confirm the EDR module name
```

### Procedure B: Automated Hook Table Generation

Use `HookHunter` or a custom script:

```powershell
# pseudo workflow, see scripts mentioned in references
$disk = Get-Content C:\Windows\System32\ntdll.dll -Encoding Byte
$live = # Acquire via OpenProcess + ReadProcessMemory
# Compare the first 16 bytes of each export in the .text section
```

## 5. Automated Detection via pe-sieve

`pe-sieve` is the primary choice for EDR hook reconnaissance and implant self-inspection:

```powershell
# Basic scan
pe-sieve64.exe /pid 1234

# Recommended combination (includes shellcode and hook detection)
pe-sieve64.exe /pid 1234 /shellc 3 /modules 3 /imp 3 /data 3 /dir hooks_dump

# Critical parameters:
#   /shellc N    Shellcode scan level (0-3)
#   /modules N   Module integrity check (0-3)
#   /imp N       IAT hook check
#   /data N      Data section scan
#   /dir <path>  Dump output directory
```

Output generates `*.tag` files under `hooks_dump/<pid>.<name>/` listing hooked addresses:

```text
modified_modules.tag Example:
71f10000;ntdll.dll
71f1a3b0;hook;jmp_far
71f1c020;hook;jmp_near
```

Can be directly fed into IDA to jump to corresponding RVAs for analysis.

### Embedding pe-sieve in Implant (Self-Inspection)

In real operations, `pe-sieve` is often compiled as a library (`libpe-sieve`) for initial self-inspection upon implant start: if ntdll is hooked, trigger the unhook procedure; if it detects unexpected hooks, be cautious as it might be running inside a sandbox.

## 6. Dynamic Observation via API Monitor v2

API Monitor v2 (Rohitab) is suitable for observing when and where EDRs insert hooks in a lab environment:

```text
1. Start API Monitor v2 (Administrator)
2. Select in API Filter:
     - NT Native API → Memory Management
     - NT Native API → Process and Thread
     - Windows Defender / AMSI (if visible)
3. Monitor New Process → Select implant test sample
4. Observe:
     - NtAllocateVirtualMemory call order
     - Whether calls are routed through EDR DLLs
5. Inspect the Modules tab to see which EDR DLLs are injected via LoadLibrary
```

## 7. Common EDR User-Mode DLL Reference

| DLL | Vendor | Remarks |
|-----|------|------|
| `umppc*.dll` | Microsoft Defender | MpClient userland |
| `mpoav.dll` | Microsoft Defender | AMSI provider |
| `aswAMSI.dll` | Avast | AMSI provider |
| `eamsi.dll` | ESET | AMSI provider |
| `IDPMServiceClient.dll` | Sophos | HMPA injection |
| `klsihk64.dll` | Kaspersky | Injected into target process |
| `CrowdStrike.Sensor.dll` | CrowdStrike | Legacy version; newer versions rely primarily on kernel |
| `SentinelInjection64.dll` | SentinelOne | User-mode injection |
| `TmUmEvt64.dll` | Trend Micro | Behavioral monitoring |

After identifying the target EDR, determine which DLL to reverse engineer for hook table extraction.

## Reference Links

- pe-sieve: <https://github.com/hasherezade/pe-sieve>
- HollowsHunter: <https://github.com/hasherezade/hollows_hunter>
- API Monitor v2: <http://www.rohitab.com/apimonitor>
- MITRE ATT&CK T1562: <https://attack.mitre.org/techniques/T1562/>
- MITRE ATT&CK T1055: <https://attack.mitre.org/techniques/T1055/>
- ired.team EDR notes: <https://www.ired.team/offensive-security/defense-evasion>

## Routing Feedback

Upon completing the hook survey, return to Step 3 of `SKILL.md` to select bypass technique combinations, then execute according to `references/unhook-techniques.md` and `references/telemetry-blinding.md`.
