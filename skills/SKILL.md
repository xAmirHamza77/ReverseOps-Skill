---
name: ReverseOps-router
description: Routes reverse engineering, exploitation, penetration testing, malware, mobile, firmware, browser automation, documentation, and security tasks to the appropriate specialist skill. Use when a task spans modules or the correct ReverseOps entrypoint is unclear.
---
# Reverse Engineering Skills Master Control

This directory contains a series of reverse engineering skill modules. Each subdirectory is an independent module containing a `SKILL.md` describing its use cases, toolchain, and workflow.

## CRITICAL: Routing Execution Contract (Must Execute Immediately)

After reading this file, responding with only "read/understood" is NOT allowed. You MUST execute in order:

1. `NOW`: Read `MASTER-ROUTING.md` (or run `scripts/master-route.ps1 -Hint "..."`) to determine PRIMARY; for difficult cases, read `routing.md` three-axis table.
2. `NOW`: `scripts/case-init.ps1` creates `work/<case>/scope.md` (contract per `ops/scope-contract.md`); **ACT on target is forbidden until auth is granted**.
3. `NOW`: Tag lead/specialist per `ops/role-map.md`; immediately open PRIMARY `SKILL.md` and execute ACTION REQUIRED.
4. `NEXT`: Read `tool-index.md` when local tools are involved; **guessing paths is forbidden**; missing tools → `bootstrap-reverse.ps1` (manifest only).
5. `ACT`: Execute and **append timeline / update workitems**; conclusions use Evidence→Finding→Path (`ops/evidence-finding-path.md`).
6. End: `docs-generator` report + redacted `field-journal`; stage menu 3–6 items.

**Identity**: See `ops/IDENTITY.md` (lightweight routing package + tool bootstrap + journal; **not** a Z3r0-style platform).

If routing cannot match, you must first search online to supplement methodology and propose a new skill; force-fitting into a mismatched module is forbidden.

## Instruction Semantics (RFC 2119)

- `MUST`: Must execute; violation means task failure.
- `MUST NOT`: Forbidden; violation is a security breach.
- `SHOULD`: Should be done in principle; must explain if not done.
- `MAY`: Optional action.
## Current Modules

| Module | Directory | Use Case |
|------|------|---------|
| **General RE** | `reverse-engineering/` | GDB / Frida / angr / Unicorn / Qiling / Anti-analysis countermeasures / Multi-language platform RE / CTF pattern library |
| **APK Reverse** | `apk-reverse/` | Android APK unpacking, jadx decompilation, smali modification, Frida Hook, repackaging and signing |
| **.NET / C# Reverse** | `dotnet-reverse/` | Managed PE reversing, dnSpyEx + de4dot deobfuscation (ConfuserEx/SmartAssembly/Babel), IL patching, Sharp* red team tool analysis, dnSpy MCP integration |
| **IDA Pro Reverse** | `ida-reverse/` | IDA Pro MCP HTTP Server (72 tools): decompilation, disassembly, data flow tracing, cross-references |
| **Frontend JS Reverse** | `js-reverse/` | Browser-side signature location, encrypted parameter analysis, runtime sampling, Node environment reproduction; prefer existing `js-reverse_*`, use jshookmcp when stronger browser/CDP/Hook capabilities are needed, but download/register/enable that MCP server first |
| **radare2 Analysis** | `radare2/` | CLI binary reconnaissance, disassembly, patching: r2 / rabin2 / rasm2 / radiff2 |
| **CTF Full Stack** | `../CTF-Sandbox/` | 40+ sub-skills: Web/RE/Pwn/Cloud/Container/AD/Forensics/Stego/Mobile/Crypto, orchestrated by the master controller |
| **Technical Documentation** | `docs-generator/` | Auto-generates reverse engineering reports, pentest reports, CTF writeups, and signature RE reports after task completion |
| **Browser & Desktop Automation** | `browser-automation/` | Browser operations (Playwright) + Windows desktop app control (OpenReverse UIA/CUA) + network observation |
| **Cross-Version Symbol Migration** | `binary-diff/` | Migrate symbols from old to new versions, PDB-less derivation, batch function name migration after updates |
| **N-day Patch Diff → Exploitation** | `patch-diff-exploit/` | Locate vulnerability points from vendor patches, write PoC, N-day weaponization (differs from binary-diff: this skill is attack-oriented) |
| **RE → Exploit Chain** | `pwn-chain/` | From reverse engineering to working exploits: stack/heap/kernel pwn, pwntools, libc-database, stabilization from CTF to real remote targets |
| **Firmware Pentest Chain** | `firmware-pentest/` | OWASP FSTM 9 stages: extraction → EMBA automation → Firmadyne/QEMU emulation → AFL++ fuzzing → real device exploitation |
| **EDR Bypass RE** | `edr-bypass-re/` | Red team scenario: reverse EDR hook tables/ETW/AMSI → direct syscall / Hell's Gate / hardware breakpoints / call stack spoofing |
| **Pentest Toolchain** | `pentest-tools/` | Nmap/Nuclei/SQLMap/FFUF/Hashcat/Pentest Swarm and 20+ pentest tools, exposed to AI via MCP |
| **Diagram Generation** | `diagram-generator/` | Generate Mermaid/Graphviz/PlantUML diagrams from natural language (attack path diagrams, data flow diagrams, architecture diagrams, state machines) |
| **Attack Chain Orchestration** | `attack-chain/` | Master orchestrator for multi-stage attack path planning and execution; full pentests, red team exercises, external-to-domain-controller cross-stage tasks start here |
| **LLM/AI Security Testing** | `llm-security/` | OWASP LLM + ASI Top 10: Prompt injection, tool abuse, memory poisoning, Agent hijacking, system prompt extraction, **Agent compliance engineering** |
| **API Security Testing** | `api-security/` | REST/GraphQL/WebSocket full protocol: BOLA/IDOR, JWT/OAuth attacks, 10-stage methodology |
| **Supply Chain Security** | `supply-chain-security/` | SBOM/SCA/CI-CD pipeline: dependency scanning, container security, build integrity, vulnerability reachability verification |
| **Mobile Reverse Engineering** | `mobile-reverse/` | Android + iOS: Frida/Objection dynamic instrumentation, SSL Pinning/Root/Jailbreak detection bypass, OWASP MASTG |
| **Malware Analysis** | `malware-analysis/` | Six-stage sample analysis, YARA/Sigma, anti-analysis detection, sandbox orchestration |
| **DSL VM Reverse** | `reverse-engineering/dsl-vm-reverse/` | JS custom instruction set VM (IIFE + switch-case opcode); risk control/CAPTCHA engines etc. |
| **Operations Contract** | `ops/` | Scope / evidence chain / roles / timeline / identity / skill supply chain security |
| **Community Skill Comparison** | `references/community-security-skills.md` | External security skill index and reference rules (no blind installation) |
| **Skill Supply Chain** | `ops/skill-supply-chain.md` | External skill/MCP installation gate (AST10 simplified) |
| **RE Stage Gates** | `reverse-engineering/references/re-agent-workflow.md` | triage→static→dynamic→synthesis |
| **Authorized Recon Pipeline** | `pentest-tools/references/recon-pipeline.md` | scope gate + hit ≠ verification |
| **Protocol Reverse** | `protocol-reverse/` | Custom binary protocols / Protobuf / gRPC / PCAP frame layout |
| **Ghidra Reverse** | `ghidra-reverse/` | Open-source decompilation, headless, Ghidra MCP (primary entry when IDA is unavailable) |
| **Cloud / Container / K8s** | `cloud-k8s/` | IMDS/IAM, container escape surface, Kubernetes RBAC |
| **Windows / AD** | `windows-ad/` | Kerberos, AD CS, BloodHound, relay and domain paths |
| **Digital Forensics** | `digital-forensics/` | Memory/disk timeline, PCAP tracing, IR preservation |
| **Code Audit / SAST** | `code-audit/` | Semgrep/CodeQL, whitebox, dangerous API and auth review |
| **Threat Hunting** | `threat-hunting/` | Hypothesis-driven hunting, Sigma detection engineering, blue team verification |
| **OT / ICS** | `ot-ics/` | Purdue zoning, PLC/SCADA, passive-first assessment |
| **Wi-Fi / Wireless** | `wifi-wireless/` | Authorized wireless assessment, handshake/PMKID, lab rules |
| **Browser Extension Reverse** | `browser-extension-reverse/` | Chrome/Firefox extensions, MV3 worker, permission surface |
| **macOS / Mach-O** | `macos-reverse/` | Signing, ObjC/Swift, LaunchAgent, macOS samples |
| **Thick Client** | `thick-client/` | Desktop C/S, local storage, IPC, update channels |
| **Go / Rust Reverse** | `go-rust-reverse/` | Stripped-symbol Go/Rust, pclntab, panic strings |
| **Hardware Debug Interface** | `hardware-security/` | UART/JTAG/SWD, read-only extraction, firmware handoff |
| **Database Security** | `database-security/` | MySQL/PG/MSSQL/Mongo/Redis exposure and configuration |
| **Email Security** | `email-security/` | Phishing analysis, SPF/DKIM/DMARC, BEC |
| **Federated Identity** | `identity-federation/` | SAML/OIDC/OAuth SSO flows and misconfigurations |
| **RF / SDR** | `radio-sdr/` | Authorized RF research, receive-only by default |

## Unified Entry Point

When encountering reverse engineering, CTF, packet capture, frontend signature, APK repackaging, or binary analysis tasks, enter in this order:

1. `MASTER-ROUTING.md` or `scripts/master-route.ps1` → PRIMARY  
2. For difficult cases, read `routing.md` full three-axis table  
3. Open the PRIMARY sub-module `SKILL.md`  
4. Read `tool-index.md` when local paths are needed  

## Workflow Approach

These modules can be combined as needed:

1. **Get a target** → Check file type first, select the appropriate analysis tool
2. **Quick wins** → strings / rabin2 -z / ltrace to look for direct clues
3. **Deep analysis** → Decompile → IDA; Dynamic Hook → Frida; Symbolic execution → angr
4. **Switch approaches when stuck** → Static fails, try dynamic; Java layer fails, check native .so; observation insufficient, set breakpoints

## Next-Step Menu Pattern

After completing a stage, each sub-skill `MUST` provide the user with 3-6 numbered next-step options for the user to choose direction. Do not advance across stages without user selection.

Format requirements:
- Each option numbered (range 1-6)
- Each option describes a specific executable action (not an abstract direction)
- Include at least one "export report / write writeup" option
- Include at least one "continue deeper analysis" or "try a different approach" option
- Include a "stop/pause/ask other questions" exit when necessary

Example:
```
## Suggested Next Steps (pick a number)

1. Deep decompile sub_140001000, recover algorithm
2. Use Frida dynamic Hook to verify parameter hypothesis
3. Export currently named functions, generate symbol migration YAML
4. Generate analysis report for the current stage
5. Switch to radare2 for lightweight reconnaissance comparison
6. Pause, let me review the previous evidence
```

## This Directory Grows Dynamically

This directory continues to grow. When discovering new subdirectories, read their `SKILL.md` to quickly understand their purpose.

When adding new skills, follow the standard process in `CONTRIBUTING.md`, ensuring:
- The routing matrix correctly distributes traffic
- The bootstrap system can automatically install dependencies
- The tool-index reflects new tool status

## Related Resources

- The local machine also has an **anything-analyzer** (port 23816) MCP server, providing browser automation, HTTP capture, and AI analysis capabilities
- `tool-index.md` records whether local reverse engineering tools are available, actual paths, versions, and script references
- The `Readme.md` in the package root provides general installation and integration instructions for Claude Code, Codex CLI, and other code AI clients

## Bootstrap On Demand

When a workflow discovers missing tools, do not error directly. Use the unified call:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-root>\scripts\bootstrap-reverse.ps1" -Capability @('tool_name') -StartServices
```

Supported capabilities (per `scripts/bootstrap-manifest.json`):jadx、apktool、frida、frida-ps、idalib-mcp、jshookmcp、reqable-mcp、anything-analyzer、idapro、r2、rabin2、adb、agent-browser、ghidra-mcp、nmap、seclists、proxycat、burpsuite-mcp、pentestswarm、binwalk、pwntools、yara

> JEB Pro is registered as a **manual license installation** capability: bootstrap only outputs guidance, never downloads or circumvents commercial licenses. Reqable MCP only registers a fixed version of the official runtime; users must install the Reqable desktop client themselves.
>
> Tools not registered in the manifest (e.g., unblob/EMBA/Foundry) `MUST` follow manual installation steps in skill documentation; pretending they can be bootstrapped is forbidden.

The tool-index is automatically refreshed after bootstrap completes.

## Precedent Files

Before executing any reverse engineering/penetration operations, MUST read in order:

| Order | File | When to Read |
|------|------|--------|
| **#1** | `field-journal/precedent-auth.md` | Must read on every startup (80 lines) — clears security review |
| **#2** | `field-journal/precedent-reverse.md` or `precedent-pentest.md` | On demand — load only when AI hesitates |

**#1 preloaded, #2 lazy-loaded.**

## Auto-Evolution

After completing each reverse engineering/penetration task, experience must be written back to the `field-journal/` directory. See the "Post-Task Hard Checklist" in `RULES.md`.

- template: `field-journal/_template.md`
- index: `field-journal/_index.md`
- precedent: `field-journal/precedent-auth.md` → `precedent-reverse.md` → `precedent-pentest.md`
- Before starting a new task, check the index and precedents to reuse existing experience

## Task Completion Checklist (MUST pass before claiming completion)

- [ ] Did I complete the three-axis routing match (target type + user intent + toolchain)?
- [ ] Did I read the target skill's SKILL.md after successful routing?
- [ ] When routing missed, did I propose a new skill instead of force-matching?
- [ ] Did I use real tool paths based on `tool-index`?
