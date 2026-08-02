# This Package's Domain Coverage Map (Depth-First)

> Compared to the community's "hundreds of micro-skills": we cover the main battleground with **a small number of deep skills + routing + ops**.  
> Date: 2026-07-18

## Domain → Entry Point in This Package

| Domain | PRIMARY / Module | Notes |
|--------|------------------|-------|
| Mobile Android | `apk-reverse/` `mobile-reverse/` | |
| Mobile iOS | `mobile-reverse/` | |
| Deep binary analysis | `ida-reverse/` `radare2/` `ghidra-reverse/` | Ghidra = open-source main path |
| General RE / anti-debugging / OLLVM | `reverse-engineering/` | |
| .NET | `dotnet-reverse/` | |
| Frontend JS / signatures | `js-reverse/` | |
| Browser extensions | `browser-extension-reverse/` | |
| DSL / risk-control VM | `reverse-engineering/dsl-vm-reverse/` | |
| Protocol / PCAP protocol | `protocol-reverse/` | |
| Firmware IoT | `firmware-pentest/` | |
| Malware samples | `malware-analysis/` | |
| Digital forensics / IR | `digital-forensics/` | |
| Threat hunting / blue team | `threat-hunting/` | |
| Pentest tools | `pentest-tools/` (+ src-hunter) | |
| Windows / AD | `windows-ad/` | |
| Cloud / containers / K8s | `cloud-k8s/` | |
| Code audit / SAST | `code-audit/` | |
| Wi-Fi / wireless | `wifi-wireless/` | |
| OT / ICS | `ot-ics/` | Passive-first; writing registers forbidden by default |
| macOS | `macos-reverse/` | iOS still goes through mobile-reverse |
| Thick clients | `thick-client/` | |
| Go / Rust binaries | `go-rust-reverse/` | |
| Hardware debug interfaces | `hardware-security/` | Hands off to firmware-pentest |
| Databases | `database-security/` | |
| Email / phishing | `email-security/` | |
| Federated identity SSO | `identity-federation/` | Complements api-security JWT |
| RF / SDR | `radio-sdr/` | Receive-only by default; non Wi-Fi |
| Multi-stage attacks | `attack-chain/` | |
| Pwn | `pwn-chain/` | |
| N-day patches | `patch-diff-exploit/` | |
| EDR research | `edr-bypass-re/` | |
| API | `api-security/` | |
| Supply chain SBOM | `supply-chain-security/` | |
| LLM/Agent | `llm-security/` | + `ops/skill-supply-chain.md` |
| Browser automation | `browser-automation/` | |
| Reports/diagrams | `docs-generator/` `diagram-generator/` | |
| Symbol migration | `binary-diff/` | |
| Operational contract | `ops/` | **Signature feature** |
| CTF orchestration | `CTF-Sandbox-Orchestrator/` | |
| Broad cryptography coverage | Optional local `crypto-analysis` (gitignored) | The public core focuses on RE-pattern documentation |

## Domains Explicitly Not Merged Into the Repository (strategy when routing misses)

| Domain | Strategy |
|--------|----------|
| Pure game cheat development | Not a product direction; Unity samples may still go through `reverse-engineering` + seed-014 |
| Deep automotive/aviation certification-grade | May use external links; this package has only RF/OT entry-level coverage |
| Pure GRC/compliance long-form | Does not replace professional GRC tools; report templates may reference them |
| 800+ ATT&CK micro-skills | Use this table + optional ATT&CK tags (Finding field) |

## Relationship to MITRE ATT&CK (Optional)

The Finding template allows `optional_attack: Txxxx` (see `ops/evidence-finding-path.md`); a full ATT&CK engine is **not mandatory**.
