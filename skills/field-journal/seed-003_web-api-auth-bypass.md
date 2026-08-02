# [Seed] Web API unauthorized access + IDOR

## Scenario classification
Pentest

## Target overview
Black-box testing of a web application's REST API; discovered unauthorized access and IDOR vulnerabilities.

## Full execution chain

1. Recon: Nmap scan → discovers port 443 running Nginx + a backend API
2. Content discovery: FFUF brute-force → discovers the `/api/v1/` path
3. API enumeration: visiting `/api/v1/docs` → finds exposed Swagger documentation
4. Authentication analysis: register two test accounts A and B
5. IDOR test: access account B's resources with account A's token → succeeds (horizontal privilege escalation)
6. Unauthorized-access test: remove the Authorization header → some endpoints still return data (unauthorized access)
7. Impact validation: confirm arbitrary users' personal info can be read (name, email, phone number)
8. Evidence collection: save request/response screenshots, anonymize, and compile the report

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| FFUF blocked by WAF | Request rate too high, triggered rate limiting | Lower the rate `-rate 10`, add `-H "User-Agent: Mozilla/5.0..."` | 10min |
| Swagger docs 404 | Path is not standard /swagger | Try `/api/v1/docs`, `/api-docs`, `/openapi.json` | 5min |
| Unsure whether the IDOR test succeeded | Returned data has no obvious user identifier | Compare the two accounts' responses, find the user_id field difference | 15min |
| Report rejected by the SRC | Submitted only screenshots, no full reproduction steps | Add curl commands + complete request/response | 20min |

## Toolchain findings

- FFUF is faster than Gobuster, but the rate must be controlled to avoid being banned
- Exposed Swagger/OpenAPI docs are the fastest way to enumerate an API
- IDOR testing must use two of your own accounts against each other — do not touch other people's data
- SRC reports must include reproducible curl commands, not just screenshots

## Key code/commands

```bash
# Content discovery
ffuf -u https://target.example.com/api/v1/FUZZ -w /path/to/SecLists/Discovery/Web-Content/api/api-endpoints.txt -rate 10

# IDOR test
# Access account B's resource with account A's token
curl -H "Authorization: Bearer <token_A>" https://target.example.com/api/v1/users/USER_B_ID

# Unauthorized-access test
curl https://target.example.com/api/v1/users/USER_B_ID
# If it returns 200 + data → unauthorized access
```

## Improvement suggestions for this package

- pentest-tools should add a dedicated "API penetration testing" checklist
- src-hunter's IDOR playbook is useful, but lacks guidance on "how to determine IDOR impact scope"

## Reusable patterns/script snippets

**Three-step API unauthorized-access test**:
```text
1. Normal request (with token) → record the normal response
2. Remove the token → check whether data is still returned (unauthorized)
3. Swap in another user's token → check whether access succeeds (privilege escalation)
```

**Quick IDOR validation**:
```text
1. Register two accounts A and B
2. Get A's resource ID and B's resource ID
3. Request B's resource ID with A's token
4. If B's data is returned → IDOR confirmed
```

## Evolution actions
- [ ] No routing matrix update needed
- [ ] No bootstrap-manifest update needed
- [ ] No sub-skill doc update needed

## Environment info
- OS: Windows (local) → target Linux server
- Tool versions: FFUF 2.x, curl, Burp Suite
- Target platform: Web API (REST, JSON)

## Anonymization requirements
This entry is seed data, written from public technical patterns; no real targets involved.

---
<!-- [Evolution stats] Package cumulative completed projects: 3 | New patterns added: 2 | Toolchain issues fixed: 0 -->
<!-- [Community contribution] Seed data, no PR needed -->
