# Security / Reverse Engineering / Penetration Testing Documentation Templates

This file provides documentation templates for security projects such as reverse engineering, penetration testing, and vulnerability analysis. After a task is completed, the AI should create a new document in the user's project directory following the corresponding template.

---

## 0. Evidence Chain (MUST be included in all security reports)

> Full contract: `skills/ops/evidence-finding-path.md`  
> Case directory: `work/<case>/` (`case-init.ps1`)

The report body **MUST** contain the following sections (they may be merged into "Key Findings", but the fields must not be omitted):

### 0.1 Scope Summary
- Link to `scope.md`: `auth` / `in_scope` / `network_profile`
- No scope → do not claim the task is complete

### 0.2 Evidence
At least 1 entry, fields: `E-id` / `source_ref` / `repro_command` / `content_hash|n/a`

### 0.3 Findings
Each entry: `F-id` / `severity|n/a_re` / `evidence_ids` / `confidence` / `location` / `status`

### 0.4 Path
At least 1 `P-id`: `path_type=attack|callflow|solve`; steps may reference E/F entries

### 0.5 Timeline Summary
Link to `timeline.md` or embed 3–10 key appended records

---

## 1. Reverse Engineering Report Template

```markdown
# [Target Name] Reverse Analysis Report

> Analysis date: YYYY-MM-DD
> Analyst: [AI / human]
> Toolchain: [jadx / IDA / radare2 / Frida / ...]

## 1. Target Overview

| Attribute | Value |
|-----------|-------|
| Filename | |
| File type | APK / ELF / PE / Mach-O / ... |
| Size | |
| MD5 | |
| SHA256 | |
| Package name / entry point | |

## 2. Analysis Objectives

<!-- The core questions this reversing effort must answer -->

## 3. Static Analysis

### 3.1 Basic Information
<!-- Architecture, compiler, protection mechanisms, string characteristics -->

### 3.2 Key Functions/Classes
<!-- List the located key logic, with code snippets -->

### 3.3 Encryption/Signing Algorithms
<!-- If encryption is involved, describe the algorithm, key source, and parameter construction -->

## 4. Dynamic Analysis

### 4.1 Hook Records
<!-- Frida / Xposed / other hook targets and results -->

### 4.2 Runtime Behavior
<!-- Network requests, file operations, process behavior -->

## 5. Key Findings

<!-- List key conclusions with numbering -->

1. ...
2. ...
3. ...

## 6. Reproduction Steps

<!-- Allow others to reproduce your analysis results -->

```bash
# Key commands
```

## 7. Open Issues

<!-- Points not fully resolved -->

## 8. Attachments

<!-- Hook scripts, decryption code, screenshots, etc. -->
```

---

## 2. Penetration Test Report Template

```markdown
# [Target] Penetration Test Report

> Test date: YYYY-MM-DD
> Test scope: [URL / IP / application name]
> Authorization status: [Authorized / CTF / learning environment]

## 1. Executive Summary

<!-- One-paragraph summary: what was tested, what was found, risk level -->

## 2. Test Scope

| Item | Details |
|------|---------|
| Target | |
| Test type | Black box / gray box / white box |
| Test period | |
| Tools | |

## 3. Findings Summary

| # | Vulnerability | Risk level | Status |
|---|---------------|------------|--------|
| 1 | | High/Medium/Low/Info | Verified/Pending confirmation |

## 4. Vulnerability Details

### 4.1 [Vulnerability Name]

**Risk level**: High / Medium / Low

**Description**:

**Impact**:

**Reproduction steps**:

1. ...
2. ...
3. ...

**Evidence**:

```
<!-- Request/response/screenshot/payload -->
```

**Remediation**:

## 5. Attack Path

<!-- If a full attack chain exists, draw the path -->

```
Entry point → Recon → Exploitation → Privilege escalation → Objective achieved
```

## 6. Tools and Environment

| Tool | Version | Purpose |
|------|---------|---------|
| | | |

## 7. Remediation Summary

| Priority | Recommendation |
|----------|----------------|
| P0 | |
| P1 | |
| P2 | |

## 8. Appendix

<!-- Full payloads, scripts, configuration files, etc. -->
```

---

## 3. CTF Writeup Template

```markdown
# [Contest Name] - [Challenge Name] Writeup

> Category: Web / Reverse / Pwn / Crypto / Misc / Forensics
> Difficulty: Easy / Medium / Hard
> Points: N pts
> Solve time:

## Challenge Description

<!-- Original challenge description -->

## Solution Approach

### Step 1: Reconnaissance
<!-- What was observed -->

### Step 2: Vulnerability / Entry Point
<!-- What the key point was -->

### Step 3: Exploitation
<!-- How it was exploited -->

## Key Code / Payload

```python
# exploit code
```

## Flag

```
flag{...}
```

## Pitfalls Encountered

<!-- Wrong turns taken along the way -->

## Knowledge Points

<!-- Knowledge points involved in this challenge, for later review -->
```

---

## 4. JS/Web Signature Reverse Engineering Report Template

```markdown
# [Site/Application] Signature Parameter Reverse Engineering Report

> Analysis date: YYYY-MM-DD
> Target endpoint: [URL]
> Signature field: [field name]

## 1. Target Request

```http
POST /api/xxx HTTP/1.1
Host: example.com

param1=xxx&sign=<target field>
```

## 2. Location Process

### 2.1 Breakpoint / Hook Method
<!-- How the signature generation location was found -->

### 2.2 Call Stack
<!-- Key call chain -->

## 3. Algorithm Recovery

### 3.1 Algorithm Type
<!-- HMAC-SHA256 / AES / custom / ... -->

### 3.2 Parameter Construction
<!-- Which fields participate in signing, ordering rules, delimiters -->

### 3.3 Key Source
<!-- Hardcoded / returned by an API / derived from timestamp / ... -->

## 4. Local Reproduction Code

```javascript
// Node.js reproduction
```

## 5. Verification Results

<!-- Compare the signature generated by the reproduction code against the actual request -->

## 6. Anti-Scraping / Risk Control Considerations

<!-- Rate limiting, device fingerprinting, environment detection, etc. -->
```

---

## 5. Documentation Output Conventions

### Output location

- Documents are output to the **user's current project directory** by default (not the skill package directory)
- Filename format: `YYYY-MM-DD_[type]-[target-short-name]-report.md`
- If the user's project has a `docs/` directory, prefer placing the document under `docs/`

### Output timing

The AI automatically invokes this skill to generate documentation at the following times:

1. A reverse engineering task is complete and core conclusions have been produced
2. A penetration test is complete and vulnerabilities have been discovered and verified
3. A CTF challenge is solved and the flag has been captured
4. The user explicitly asks to "write a report/document"

### Quality requirements

- All code blocks must be directly runnable or have clear context
- No placeholders/TODOs (if a section is genuinely incomplete, mark it "to be supplemented" and explain why)
- Key findings must be backed by evidence (command output, screenshot descriptions, code snippets)
- Reproduction steps must allow a third party to independently reproduce the result
