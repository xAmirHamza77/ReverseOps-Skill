# Pentest / Attack-Chain Lifecycle Checklist

> Aligns community pentest skill packages (e.g., the Orizon claude-code-pentest six-stage model) with this package's `attack-chain` + `ops` integration.
> Inspiration: public Claude pentest lifecycle skills (researched 2026-07); **commands and authorization follow this package's scope**.
> Date: 2026-07-17

## Before Use

- [ ] `case-init` completed, `auth.status=granted`
- [ ] `network_profile` — do not misuse unrestricted against production
- [ ] `lead` has assigned specialist_roles (`ops/role-map.md`)

## Phase Gates

| Phase | Role | Skill in this package | Completion criteria |
|------|------|------------|----------|
| 0 Scope | lead | ops/scope-contract | ready_for_act |
| 1 Recon | cie | pentest-tools | assets list + timeline |
| 2 Enum/Vuln | cpe | pentest-tools / api-security | candidate F-* drafts |
| 3 Validate | cpe | pentest-tools | E-* + validated Finding |
| 4 Post-ex (if authorized) | cpe/lead | second half of attack-chain | stays within out_of_scope |
| 5 RE assist | cre | ida/apk/js/... | only when client/binary work is needed |
| 6 Report | doc | docs-generator | Evidence→Finding→Path |
| 7 Journal | lead | field-journal | sanitized |

## Differences from "give it a domain and auto-pwn everything" skills (distinguishing features)

| Common in external automation packages | ReverseOps |
|------------------|---------------|
| Scans any domain by default | Requires a scoped asset list |
| Weak evidence goes straight into the report | Mandatory E/F/P chain |
| Single session, no roles | role-map handoffs |
| No tool index | tool-index + bootstrap |

## At least one timeline entry per phase

See `ops/timeline-workitem.md` for the format.
