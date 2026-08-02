---
name: windows-ad
description: Use for authorized Active Directory and Windows identity attacks including Kerberos, AD CS, BloodHound paths, NTLM relay, and domain privilege escalation research.
---

# Windows / Active Directory Security

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-pentest.md`
2. `NOW`: **Domain/AD testing requires an explicitly defined authorized scope** (including DCs, and whether poisoning/relay is permitted)
3. `NOW`: case-init; document network_profile and prohibited actions clearly
4. `NEXT`: tool-index (impacket/certipy/bloodhound etc. are often manual installs)
5. `ACT`: Start from identity enumeration and BloodHound graphs; do not begin with destructive exploitation

## Applicable Scenarios

- Domain penetration, Kerberoasting, AS-REP roasting, delegation
- AD CS certificate attacks (ESC1–ESC8, etc.)
- BloodHound / SharpHound attack paths
- NTLM Relay / Coercer forced authentication
- Local privilege escalation to domain paths (e.g., Potato exploits as stepping stones)

## Relationship with attack-chain

- **Multi-stage chain from external network to domain controller** → PRIMARY may remain `attack-chain/`; this skill serves as the **AD specialist**
- **Already inside the domain, focused on identity** → PRIMARY = this skill

## Workflow

### 1. Enumeration

```bash
# Examples: Impacket / built-in (require credentials and authorization)
nxc smb <range> -u user -p pass
bloodhound-python -d domain.local -u user -p pass -c All -ns <DC>
```

### 2. Common Paths (graph first, exploit second)

```text
□ Kerberoast / AS-REP → offline cracking
□ ACL abuse (GenericAll/WriteDacl)
□ Delegation (unconstrained/constrained/resource-based)
□ AD CS template misconfiguration → Certipy
□ Relay: LLMNR/NBT-NS + ntlmrelayx (confirm authorization)
```

### 3. Credentials & Lateral Movement

```text
□ secretsdump / lsassy / mimikatz (strict authorization and cleanup)
□ PtH / PtT / golden ticket only within an authorized red-team scope
□ Write Evidence at every step; wait for user confirmation on high-risk actions
```

## Toolchain

| Tool | Purpose |
|------|---------|
| BloodHound / SharpHound | Attack path graphing |
| Certipy | AD CS |
| Impacket / NetExec | Lateral movement and enumeration |
| Rubeus / Mimikatz | Tickets and credentials (authorized) |
| Coercer / Responder | Forced authentication / poisoning |

## References

- `references/ad-attack-paths.md`
- `../pentest-tools/references/network-attack-defense.md`
- `../attack-chain/`
- seeds: `field-journal/seed-005_ad-certipy-esc1.md` `seed-007_ntlm-relay-coercer.md` `seed-013_kerberoasting-spn.md`

## Routing Context

**Upstream**: MASTER R24  
**Downstream**: reporting `docs-generator`; for EDR research `edr-bypass-re`  
**MUST NOT**: DCSync / golden ticket against production without authorization

## Task Completion Checklist

- [ ] Was enumeration/graphing done before exploitation?
- [ ] Were reproducible commands recorded and sanitized?
- [ ] Were scope prohibitions respected?
- [ ] Checklist?