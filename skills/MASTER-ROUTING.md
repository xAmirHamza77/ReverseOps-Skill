# ReverseOps PRIMARY fast path

> Kept in sync with `scripts/master-route.ps1`.

## Execution contract

```text
1. Route first, act second
2. Output the PRIMARY path + a one-line justification
3. case-init / scope.md (ops/scope-contract) — no ACT on target until auth is granted
4. Assign lead + specialist roles (ops/role-map)
5. Immediately open the PRIMARY SKILL.md → ACTION REQUIRED
6. Trust only tool-index for tool paths; if missing, bootstrap (manifest capabilities only)
7. Append to timeline / workitems as you go; conclusions go through Evidence → Finding → Path
8. No match → read the full routing.md table or propose a new skill
```

```powershell
powershell -File skills\scripts\master-route.ps1 -Hint "<user task>"
# writes work/master-route-<ts>/route-scope.md by default
powershell -File skills\scripts\case-init.ps1 -Hint "<user task>" -CaseName "my-case"
# one-shot ACT-ready (auth + target + network profile):
powershell -File skills\scripts\case-init.ps1 -Hint "<task>" -CaseName "my-case" -AuthGranted -TargetUrl "https://target/" -NetworkProfile authorized_target_only
# smoke test: verify + script parse + routing matrix (incl. CJK hints)
powershell -File skills\scripts\smoke.ps1
# light scope gate before ACT (exit 2 if not ready; -Force only warns)
powershell -File skills\scripts\case-guard.ps1 -CaseRoot work\my-case
# append Evidence
powershell -File skills\scripts\append-evidence.ps1 -CaseRoot work\my-case -Id E-001 -Title "..." -ReproCommand "..."
```

## Ops contracts

| Doc | Purpose |
|------|------|
| `ops/IDENTITY.md` | we are a router package, not a Z3r0 platform |
| `ops/scope-contract.md` | startup gate |
| `ops/evidence-finding-path.md` | evidence chain |
| `ops/role-map.md` | role → skill |
| `ops/timeline-workitem.md` | timeline & coverage |
| `ops/sandbox-profile.md` | tool mapping |
| `ops/skill-supply-chain.md` | safety latch for installing external skills/MCP |
| `references/community-security-skills.md` | community skill ecosystem (borrow ideas, don't vendor) |
| `reverse-engineering/references/re-agent-workflow.md` | RE: triage → static → dynamic → synthesis |
| `pentest-tools/references/recon-pipeline.md` | authorized recon pipeline + evidence gate |

## Priority (high → low)

| ID | Condition | PRIMARY |
|----|-----------|---------|
| **R1** | APK / smali / jadx / apktool | `apk-reverse/` |
| **R2** | IPA / iOS / Objection / MobSF / mobile | `mobile-reverse/` |
| **R3** | JS signature / frontend encryption / jshook / CDP | `js-reverse/` |
| **R4** | DSL VM / fireye / custom opcode VM | `reverse-engineering/dsl-vm-reverse/` |
| **R5** | .NET / dnSpy / de4dot / ConfuserEx | `dotnet-reverse/` |
| **R9** | malware sample / YARA / sandbox | `malware-analysis/` |
| **R6** | IDA / decompile / deep disassembly | `ida-reverse/` |
| **R7** | radare2 / r2 | `radare2/` |
| **R8** | firmware / binwalk / IoT / EMBA | `firmware-pentest/` |
| **R10** | attack chain / red team / lateral movement / full pentest | `attack-chain/` |
| **R11** | Nmap / Nuclei / SQLMap / SRC / pentest tools | `pentest-tools/` |
| **R42** | OSINT / passive recon / attack-surface mapping / subdomains | `osint-recon/` |
| **R43** | finding validation / false-positive triage / PoC repro / retest | `exploit-validation/` |
| **R44** | report export / dashboard / findings JSON / panel | `reporting/` |
| **R12** | API / GraphQL / BOLA / JWT attacks | `api-security/` |
| **R13** | SBOM / Trivy / supply chain | `supply-chain-security/` |
| **R14** | LLM / prompt injection / agent security | `llm-security/` |
| **R15** | bindiff / symbol migration / PDB | `binary-diff/` |
| **R16** | N-day / patch diffing | `patch-diff-exploit/` |
| **R17** | pwn / ROP / heap-stack exploitation | `pwn-chain/` |
| **R18** | EDR / evasion / syscalls | `edr-bypass-re/` |
| **R19** | browser / desktop automation | `browser-automation/` |
| **R20** | reports / writeups | `docs-generator/` |
| **R39** | diagrams / Mermaid / Graphviz / PlantUML / architecture | `diagram-generator/` |
| **R21** | protocol / Protobuf / PCAP protocol | `protocol-reverse/` |
| **R22** | Ghidra / open-source decompilation | `ghidra-reverse/` |
| **R23** | cloud / containers / K8s | `cloud-k8s/` |
| **R24** | Windows / AD / Kerberos / AD CS | `windows-ad/` |
| **R25** | forensics / memory dumps / timelines | `digital-forensics/` |
| **R26** | code audit / SAST / Semgrep | `code-audit/` |
| **R27** | threat hunting / detection engineering / blue team | `threat-hunting/` |
| **R28** | OT / ICS / industrial control | `ot-ics/` |
| **R29** | Wi-Fi / wireless pentest | `wifi-wireless/` |
| **R30** | browser extension reverse engineering | `browser-extension-reverse/` |
| **R31** | macOS / Mach-O | `macos-reverse/` |
| **R32** | thick-client security | `thick-client/` |
| **R33** | Go / Rust binaries | `go-rust-reverse/` |
| **R34** | hardware debug ports / UART / JTAG | `hardware-security/` |
| **R35** | database security | `database-security/` |
| **R36** | email / phishing analysis | `email-security/` |
| **R37** | federated identity SAML / OIDC | `identity-federation/` |
| **R38** | RF / SDR research | `radio-sdr/` |
| **R0** | generic RE / anti-debug / OLLVM / unknown binary | `reverse-engineering/` |

If no strong keyword matches → PRIMARY=`R0` and prompt the user to open `routing.md`.

## Boundary

| Task | Handled by |
|------|------|
| Pure multi-type CTF orchestration | `../CTF-Sandbox/` |

## Read order

```text
RULES.md → MASTER-ROUTING.md → PRIMARY SKILL.md
  → (optional) routing.md three-axis / field-journal
  → tool-index.md → bootstrap → ACT
```
