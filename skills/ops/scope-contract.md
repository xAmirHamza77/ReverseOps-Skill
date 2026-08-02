# Universal Scope Contract (hard gate at task start)

> **MUST**: before **ACT** on any security/reverse-engineering/pentest task, land a `scope.md` in the user's project or under `work/<case>/`.
> No scope → reading docs/routing only; active scanning, hooking, or exploitation of targets is **forbidden**.
> The template may be copied; keep field names as English keys so scripts can validate them.

## How to initialize

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File skills\scripts\case-init.ps1 -Hint "<one-line task description>" -CaseName "my-case"
# Produces: work/<case>/scope.md etc.
```

## Full scope.md template

```markdown
# Case Scope

## meta
- case_id: {YYYYMMDD-short}
- created: {ISO-8601}
- operator: {name or local}
- primary_skill: {from master-route}
- lead_role: lead   # see ops/role-map.md
- specialist_roles: []  # e.g. cie, cpe, cre

## auth
- status: granted | pending | denied
- basis: written_contract | bug_bounty_scope | ctf_public | own_system | lab_only
- evidence_of_auth: {ticket/path or "CTF public" or "owner-operated"}
- MUST NOT proceed if status != granted

## in_scope
- assets: []          # hosts, domains, APK paths, binaries, URLs
- surfaces: []        # web, mobile, binary, network, api
- activities: []      # recon, reverse, exploit_validate, report

## out_of_scope
- assets: []
- activities: []      # e.g. DoS, phishing real users, data exfil

## network_profile
- mode: offline | lab_only | authorized_target_only | unrestricted_lab
- notes: |
    offline = no outbound packets (pure static/local samples)
    lab_only = lab/VM IPs only
    authorized_target_only = in_scope assets only
- MUST NOT use unrestricted against production without written auth

## deliverables
- report: true
- field_journal: true
- diagrams: true
- timeline: true

## constraints
- timebox: {}
- stealth: low | medium | high
- data_handling: anonymize | no_user_pii

## signoff
- ready_for_act: false
- checklist:
  - [ ] auth.status = granted
  - [ ] in_scope.assets non-empty OR offline sample path set
  - [ ] network_profile.mode chosen
  - [ ] out_of_scope reviewed
```

## Routing hooks (the AI MUST execute these)

```text
RULES / MASTER-ROUTING / SKILL:
  1) master-route → PRIMARY
  2) case-init or hand-written scope.md
  3) auth not granted → STOP; only allowed to supplement authorization material
  4) ready_for_act = true → open PRIMARY SKILL.md → ACT
```

## network_profile quick reference

| mode | Allowed | Forbidden |
|------|---------|-----------|
| `offline` | Static analysis, local files, simulation | Any outbound connections, public RPC |
| `lab_only` | Lab/CTF target subnets | Production/unauthorized IPs |
| `authorized_target_only` | in_scope list | Assets outside the list |
| `unrestricted_lab` | Isolated lab network (written) | Internet production |

## Signature properties

- Pure Markdown, **no database**
- Orthogonal to `tool-index` / bootstrap: scope governs "may we attack", tool-index governs "what we attack with"
