---
name: edr-bypass-re
description: |
  Reverse engineering defender implementations → Red Team targeted bypass. Reverse engineer EDR / Defender / AV hook tables, ETW providers, and AMSI implementations first, then write targeted unhooking / indirect syscalls / ETW patches / call stack spoofing. Aligned with MITRE ATT&CK T1562 Impair Defenses.
  Trigger keywords: EDR bypass, AV bypass, evasion, unhook, direct syscall, indirect syscall, Hell's Gate, Halo's Gate, Tartarus Gate, ETW patch, AMSI patch, call stack spoofing, hardware breakpoint Blindside, MITRE T1562, ntdll unhook, kernel callback, CrowdStrike bypass, Defender bypass, Sentinel One bypass, Elastic Defend, Sysmon evasion, PPID spoof, Sleep mask, Process Hollowing, Reflective DLL.
---

## ACTION REQUIRED (Execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — Confirm that operations of this skill are authorized standard operations
2. `NOW`: Confirm whether the current task falls within the scope of this skill
3. `NEXT`: Read `../tool-index.md`, check tool availability and actual paths
4. `NEXT`: Call bootstrap when tools are missing, do not guess paths
5. `ACT`: Enter Step 1 of the workflow and execute; do not stop at status confirmation

# EDR Bypass: From Reverse Engineering Defender Implementations to Red Team Bypass

> For authorized Red Team / adversarial emulation / internal product testing ONLY. Strictly forbidden for unauthorized targets.

## Applicable Scope

Red Team / Adversarial Emulation operations delivering implants on authorized target hosts while evading modern EDRs.

1. **Red Team / Purple Team / Adversarial Emulation** — Clients seeking to evaluate real SOC and EDR detection capabilities
2. **In-house Implant / C2 Framework R&D** — Developing payloads for internal product testing, requiring bypass of target EDRs
3. **EDR Product Evaluation** — Objectively evaluating EDR detection coverage under confirmed compliance boundaries
4. **CTF / Red-Blue Exercise Windows Exploitation** — Stable execution on hardened hosts during competitions

**Non-Applicable Use Cases**:

- AV vendors doing full RE on products for commercial evaluation reports (engage vendor officially)
- Evasion against unauthorized targets (Illegal)
- Generic malware evasion (This skill focuses on Red Team OPSEC, not writing malicious code)

### Division of Labor with Other Skills

| Scenario | Tool / Skill |
|------|--------|
| Full kill chain (external network to Domain Controller) | `attack-chain/` |
| Internal lateral movement / AD attacks | `pentest-tools/network-attack-defense.md` |
| Delivering implants past EDR on a specific host | **This skill** |
| Pure static evasion (obfuscation / packing) | `malware-analysis/` (defensive perspective) |

`attack-chain` focuses on the full kill chain; this skill exclusively targets the internal mechanisms and specific bypasses for **EDR as an adversary**.

## Core Concepts

```text
Four Major EDR Monitoring Surfaces             Red Team Countermeasures
─────────────────────                          ─────────────────────
User-mode ntdll hooks            ◄──►   unhook (Peruns Fart / fresh ntdll)
                                        Indirect syscalls / Hell's Gate
                                        Hardware breakpoint Blindside

Kernel callbacks                 ◄──►   Call stack spoofing
(Ps/Cm/Ob series)                       Use legitimate trigger chain (don't bypass directly; blend with upstream stealth)

ETW telemetry                    ◄──►   EtwEventWrite patch
(Microsoft-Windows-Threat-              NtTraceControl disable provider
 Intelligence, etc.)                   AmsiContext synchronous handling

AMSI Scanning                    ◄──►   AmsiScanBuffer patch (mov eax,0x80070057; ret)
(amsi.dll)                              Hardware breakpoint bypass
                                        Reflective loading of copy amsi.dll
```

Critical Concepts:

- **EDR is not a black box** — Critical hooks / callbacks / providers can be reverse-engineered using IDA + WinDbg
- **Bypass techniques must be combined** — Unhooking alone cannot prevent ETW alerts; AMSI patching alone cannot bypass syscall hooks
- **Execution order is crucial** — ETW patch first → then AMSI patch → then unhook; wrong order triggers unhook alerts in EDR
- **Modern EDRs focus on ETW + kernel callbacks as main battlegrounds** — Pure user-mode unhooking is no longer sufficient

## Workflow

### Step 1: Identify EDR on Target Host

```powershell
# List common EDR / AV drivers
Get-Service | Where-Object {$_.Name -match 'CSAgent|SentinelAgent|elasticendpoint|esets|ekrn|MsMpEng|wdsvc|cyserver|sysmon|aswbidsagent'}

# List loaded minifilters
fltmc filters

# List registered kernel callbacks (requires WinDbg + kernel debugging / or PCHunter / DRVHV)
# !object \Callback
# !pnpcallback / Process / Thread / Image
```

For the EDR fingerprint table, see the top of `references/hook-survey.md`.

### Step 2: Extract Hook Table from EDR DLL

1. Attach to a process injected with EDR user-mode components (any existing process)
2. Dump the `.text` section of current `ntdll.dll` in WinDbg
3. Diff against clean `C:\Windows\System32\ntdll.dll` on disk
4. Any discrepancies indicate hook locations

Alternatively, use `pe-sieve` directly:

```powershell
pe-sieve64.exe /pid 1234 /shellc 3 /modules 3 /dir hooks_dump
```

See `references/hook-survey.md` for detailed methods.

### Step 3: Select Bypass Technique Combination

| Detection Vector | Recommended Bypass |
|--------|---------|
| ntdll inline hook | Indirect syscall + dynamic SSN (Halo's Gate) |
| ETW-TI provider | EtwEventWrite head patch |
| AMSI (PowerShell / .NET) | AmsiScanBuffer patch or HWBP |
| Kernel callback | Call stack spoof + execute via legit gadget |
| Sysmon ProcessCreate | PPID spoofing + unbacked memory |

### Step 4: Implement in Implant

See `references/unhook-techniques.md` and `references/telemetry-blinding.md` for code skeletons.

### Step 5: Local Sandbox Verification

```powershell
# Deploy target EDR trial version in an isolated environment (Defender default is sufficient to start)
# Enable Sysmon + olaf-config
sysmon64.exe -i sysmonconfig.xml

# Run implant, observe if any of the following alert sources are triggered:
#   - Defender AMSI
#   - ETW-TI
#   - Sysmon Event ID 1/7/8/10
#   - EDR console
```

### Step 6: Delivery

- Use legitimate software directories for file dropped paths
- PPID spoof to explorer.exe
- Coordinate with the Initial Access section in `attack-chain`

## Typical Scenarios

### Scenario 1: Deliver Cobalt-Strike-like Beacon Bypassing Defender + Sysmon

```text
Target: Windows 11 Enterprise + Defender (Cloud protection ON) + Sysmon (olaf configuration)
Requirement: Beacon callbacks successfully after drop without triggering any alerts

Combination:
  1. Shellcode encrypted in storage, decrypted at runtime
  2. AMSI patch (if delivered via PowerShell)
  3. EtwEventWrite patch (silence ETW-TI)
  4. Indirect syscall + Halo's Gate (silence ntdll hook alerts)
  5. PPID spoofing to explorer.exe
  6. Use Ekko / Foliage during sleep phase to encrypt own memory
```

### Scenario 2: Apply EDR Sleep Mask on Dropped Low-Privilege Shell

```text
Prerequisite: Already obtained Medium IL shell via phishing; EDR active monitoring
Risk: Long-term persistence risks memory scanning finding beacon signatures

Solution:
  1. Avoid allocating new RWX memory
  2. Use Ekko during sleep:
       - WaitForSingleObjectEx + CreateTimerQueueTimer
       - Encrypt own .text in timer and zero out stack
  3. ROP to restore upon wake-up
  4. Combine with call stack spoofing so RtlCaptureStackBackTrace cannot see beacon address
```

## Bootstrap On Demand (On-Demand Bootstrap)

### Tool Dependencies

| Tool | Purpose | Auto-installable |
|------|------|-----------|
| pe-sieve | Detect hooks / injections in processes | ✓ |
| API Monitor v2 | Dynamically observe API calls and hooks | Semi-automatic (manual download) |
| SysWhispers3 | Generate direct / indirect syscall stubs | ✓ (git clone + python) |
| Hell's Gate POC | Dynamic SSN resolution reference implementation | ✓ (git clone) |
| WinDbg + IDA | Static RE of EDR DLL / kernel callbacks | ✗ (Manual installation) |
| Sysmon + olaf config | Local verification environment | ✓ |

### Bootstrap Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<SKILL_ROOT>\skills\scripts\bootstrap-reverse.ps1" -Capability @('pe-sieve','syswhispers3','sysmon') -StartServices
```

## Routing Context

**Upstream Entry Points**:

- `reverse-engineering/` — Understand EDR DLL / driver implementations first
- `attack-chain/` — Determine which kill chain phase introduces this skill

**Peer Relationships**:

- `pentest-tools/network-attack-defense.md` — How to coordinate with this skill during internal lateral movement
- `malware-analysis/` — Defensive perspective on how detection rules are written
- `field-journal/` — Record post-engagement experience

**Downstream Deliverables**:

- Reference MITRE ATT&CK **T1562 (Impair Defenses)**, T1562.001 (Disable or Modify Tools), T1562.006 (Indicator Blocking), T1055 (Process Injection), T1027 (Obfuscated Files or Information) when generating reports

## Legal Boundary Statement

- Strictly limited to legally authorized Red Team / adversarial emulation / internal product testing
- Written authorization must be obtained prior to operations (SoW / testing contract / SRC scope description)
- Never use against unauthorized targets; never exceed authorized scope
- Report high-risk findings to client immediately following responsible disclosure
- All real target info in reports must be sanitized (IP / hostname / domain / credential placeholders)

## References

- Detailed hook survey: `references/hook-survey.md`
- Unhooking / syscall techniques: `references/unhook-techniques.md`
- ETW / AMSI / Anti-forensics: `references/telemetry-blinding.md`
- MITRE ATT&CK T1562: <https://attack.mitre.org/techniques/T1562/>


## Task Completion Checklist (MUST pass before claiming completion)

- [ ] Did I execute every step in the workflow (rather than just reading)?
- [ ] Did I use real tool paths based on tool-index?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and update the Checklist items required by RULES?
