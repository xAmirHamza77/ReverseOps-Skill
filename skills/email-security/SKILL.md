---
name: email-security
description: Use for authorized email security review including phishing analysis, header authentication (SPF/DKIM/DMARC), BEC patterns, and mailbox token abuse research.
---

# Email Security & Phishing Analysis

## ACTION REQUIRED (Execute immediately after reading)

1. `NOW`: Confirm authorization (analyzing sample emails / tenant configuration review)
2. `NOW`: Do not re-deliver malicious samples to real users
3. `ACT`: Header authentication → Content/URL → Attachment sandbox → Tenant control plane recommendations

## Use Cases

- Phishing email disassembly and IOC extraction
- SPF/DKIM/DMARC configuration assessment
- BEC (Business Email Compromise) fraud patterns
- OAuth app phishing / Mailbox token abuse (integrated with LLM/cloud identity)
- Security awareness exercise design (authorized)

## Workflow

```text
[ ] Complete raw header: Received chain, From/Return-Path consistency
[ ] SPF/DKIM/DMARC alignment results
[ ] URL sandbox and static attachment analysis (integrated with malware-analysis)
[ ] Brand impersonation and reply-to address discrepancies
[ ] Tenant: Anti-phishing policy, external tagging, MFA, OAuth app consent
```

## Toolchain

| Tool | Purpose |
|------|------|
| Email client "View Source" | Headers |
| dig/nslookup | SPF/DMARC records |
| urlscan / sandbox | Links and attachments |
| Tenant Admin Center | Policies |

## References

- `references/email-auth-checklist.md`
- `../malware-analysis/` `../attack-chain/` (phishing phase) `../windows-ad/` (token)

## Routing Context

**Upstream**: MASTER R36  
**MUST NOT**: Send test phishing emails in bulk to unauthorized third-party domains

## Task Completion Checklist

- [ ] Are header authentication conclusions complete?
- [ ] Are IOCs detect-ready (integrated with threat-hunting)?
- [ ] Checklist complete?