---
name: code-audit
description: Use for authorized source-code security review and SAST workflows including Semgrep, CodeQL patterns, dangerous API hunting, and fix verification.
---

# Source Code Security Audit

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-pentest.md` or the code audit authorization
2. `NOW`: Confirm you have **source code/repository access** (source-less binaries → switch to an RE skill)
3. `NOW`: Identify the language stack and scope (directory/service/PR diff)
4. `NEXT`: tool-index; semgrep, etc.
5. `ACT`: Threat-model sketch → automated scanning → manual verification

## Applicable Scenarios

- White-box audits, PR/differential security review
- SAST with Semgrep / CodeQL / Bandit / gosec, etc.
- Dangerous APIs, injection points, missing authorization, crypto misuse
- Division of work with `supply-chain-security/`: this skill focuses on **first-party code logic**; supply-chain focuses on dependencies and pipelines

## Workflow

### 1. Scope & Threat Model

```text
□ Trust boundaries: user input, files, deserialization, SSRF, auth middleware
□ High-value assets: authentication, payments, admin panels, key handling
```

### 2. Automated Scanning

```bash
semgrep --config auto .
# or a project ruleset
semgrep --config p/owasp-top-ten .
```

### 3. Manual Verification (MUST)

```text
□ Every SAST hit: reachable? exploitable? false positive?
□ Authorization: IDOR/privilege bypass, missing checks, broken multi-tenant isolation
□ Injection: SQL/command/template/LDAP
□ Crypto: hardcoded keys, ECB, custom crypto
```

### 4. Deliverables

```text
Finding: location + data flow + PoC + remediation advice
Optional ATT&CK / CWE identifiers
```

## Toolchain

| Tool | Language/Scenario |
|------|-------------------|
| Semgrep | Multi-language quick rules |
| CodeQL | Deep dataflow (GitHub) |
| Bandit | Python |
| gosec / staticcheck | Go |
| SpotBugs / FindSecBugs | Java |

## References

- `references/sast-review-checklist.md`
- `../supply-chain-security/` `../api-security/` `../llm-security/` (Agent code)

## Routing Context

**Upstream**: MASTER R26  
**Role**: `ops/role-map.md` cae  
**Downstream**: dependency vulnerabilities → supply-chain; runtime validation → pentest-tools

## Task Completion Checklist

- [ ] Was manual verification performed instead of just pasting scanner output?
- [ ] Do findings include remediation advice?
- [ ] Was the work limited to the authorized repository scope?
- [ ] Checklist?