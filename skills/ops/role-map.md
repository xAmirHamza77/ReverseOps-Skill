# Specialist role → Skill mapping (no multi-agent server)

> Role codes are inspired by the Z3r0 specialist team; the **implementation** is ReverseOps routing and a handoff protocol, not process orchestration.

## Role table

| Code | Name (localizable) | Responsibilities | PRIMARY / tool skills |
|------|--------------------|------------------|------------------------|
| **lead** | Lead / commander | Break down tasks, set scope, stage gates, consolidate reports | `attack-chain/` or the current PRIMARY hub; wrap-up → `docs-generator/` |
| **cie** | Intelligence collection | Asset discovery, attack surface, relationships | `pentest-tools/` (recon); browser → `browser-automation/`; cloud → `cloud-k8s/` |
| **cpe** | Pentest validation | Scanning, exploit validation, impact confirmation | `pentest-tools/`; API → `api-security/`; AD → `windows-ad/`; wireless → `wifi-wireless/`; databases → `database-security/`; SSO → `identity-federation/`; OT → `ot-ics/` |
| **cre** | Reverse analysis | Binary/firmware/mobile/front-end logic | `ida-reverse/` `ghidra-reverse/` `radare2/` `apk-reverse/` `mobile-reverse/` `macos-reverse/` `js-reverse/` `browser-extension-reverse/` `dotnet-reverse/` `go-rust-reverse/` `firmware-pentest/` `hardware-security/` `malware-analysis/` `protocol-reverse/` `thick-client/` `reverse-engineering/` |
| **cae** | Code audit | Source/dependencies/supply chain | `code-audit/` + `supply-chain-security/` |
| **cbe** | Blue team/forensics | Hunting, detection, IR artifacts | `threat-hunting/` `digital-forensics/` |
| **cce** | Cryptography | Algorithms/protocols/key misuse | General crypto: `reverse-engineering` pattern docs; on-chain/standalone packages stay out of core |
| **llm** | AI security | Prompt/Agent | `llm-security/` |
| **doc** | Documentation officer | Reports/writeups/diagrams | `docs-generator/` + `diagram-generator/` |

## Lead mandatory protocol

```text
1. Output PRIMARY (master-route) + lead_role=lead
2. Write scope.md (ops/scope-contract)
3. Assign specialist_roles[] and handoff conditions
4. At end of each phase: update timeline + workitems; decide continue/switch role/produce report
5. Forbidden: skip scope and let cpe scan production directly
```

## Handoff rules

| From → To | Trigger | Deliverable |
|-----------|---------|-------------|
| lead → cie | Asset surface needed | scope + known domains/IPs |
| cie → cpe | Live surfaces/services exist | assets list + ports/URLs |
| cpe → cre | Reverse validation / client logic needed | sample path + suspicious points |
| cre → cpe | Protocol/keys/checks recovered | algorithm description + reproduction commands |
| any → doc | Phase or task complete | Evidence/Finding/Path draft |
| any → lead | Blocked / out of authority / path change | timeline note + blocked reason |

## How a single agent uses this (signature feature)

No need to actually spin up 6 agents:

```text
Within the same session:
  [lead] plan
  [cie] run recon skills
  [cpe] switch to pentest-tools
  …
Prefix outputs with role tags for timeline retrieval:
  [cpe] nuclei high findings → E-003
```

## Relationship to master-route

- `master-route` determines the **PRIMARY skill**
- `role-map` determines **who owns the current phase** (can be written into scope.md)
- For multi-phase tasks the PRIMARY is often `attack-chain/`, with lead dispatching onward

## MUST NOT

- Do not assume a Z3r0 session API exists
- Do not launch extra scans of unauthorized targets for a role
