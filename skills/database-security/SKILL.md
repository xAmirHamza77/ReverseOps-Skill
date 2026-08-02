---
name: database-security
description: Use for authorized database security assessment covering PostgreSQL/MySQL/MSSQL/Mongo/Redis exposure, authz, UDF/command paths, and misconfiguration review.
---

# Database Security Assessment

## ACTION REQUIRED (Execute immediately after reading)

1. `NOW`: Read precedent-pentest; **destructive statements on production databases are prohibited** unless explicitly permitted
2. `NOW`: The scope must clearly state instances, account permissions, and whether write/delete is allowed
3. `NEXT`: Client tool paths
4. `ACT`: Exposure surface → Authentication → Authorization → Configuration → Exploit chain validation (safe)

## Applicable Scenarios

- Database unauthorized/weak password/incorrect binding to 0.0.0.0
- Excessive permissions, dangerous features (xp_cmdshell, COPY PROGRAM, UDF)
- Lateral movement: From application account to DBA
- NoSQL injection and Redis file writing, etc. (authorized environments)

## Workflow

```text
□ Network exposure and TLS
□ Account roles and grantees
□ Sensitive table access control
□ Dangerous configurations: file_priv, xp_cmdshell, load_file
□ Are audit logs enabled?
□ Backup and snapshot permissions
```

## Toolchain

| Tool | Purpose |
|------|------|
| Official CLIs | Connection and enumeration |
| sqlmap | Injection validation (authorized) |
| nuclei | Known exposure templates |
| Cloud RDS console audit | Configuration |

## References

- `references/db-misconfig-checklist.md`
- `../pentest-tools/` `../cloud-k8s/`

## Routing Context

**Upstream**: MASTER R35  
**Downstream**: Gaining OS command → attack-chain; Cloud managed → cloud-k8s

## Task Completion Self-Check

- [ ] Was unauthorized write/delete avoided?
- [ ] Were configuration issues and exploitable chains differentiated?
- [ ] Checklist completed?