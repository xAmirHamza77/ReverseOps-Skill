---
name: api-security
description: Use for authorized security assessment of REST, GraphQL, WebSocket, or SOAP APIs, including discovery, authentication, authorization, rate-limit, and CI/CD testing.
---
# API Security Testing

## ACTION REQUIRED (Execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-pentest.md` — Confirm that the operation of this skill is an authorized routine operation
2. `NOW`: Confirm if the current task hits the applicable scope of this skill
3. `NEXT`: Read `../tool-index.md`, verify tool availability and actual paths
4. `NEXT`: Call bootstrap when tools are missing, do not guess paths
5. `ACT`: Enter the first step of "Workflow" and execute, do not stop at the confirmation state

> Covers REST / GraphQL / WebSocket / SOAP full protocols
> 10-phase methodology, from discovery to CI/CD integration

## Applicable Scenarios

- REST API security testing (OpenAPI/Swagger driven or blind testing)
- GraphQL security auditing (Introspection, Batch Queries, Alias Overloading)
- WebSocket security testing
- JWT / OAuth 2.0 authentication testing
- BOLA/IDOR/BFLA authorization vulnerability detection
- API rate limit bypass and DoS testing

## 10-Phase Testing Workflow

### Phase 1: API Discovery and Reconnaissance

```text
Active Discovery:
□ Vespasian: Headless browser crawling → Automatically generate OpenAPI 3.0 / GraphQL SDL specifications
□ Entropy --discover: Extract endpoints from robots.txt + JS files
□ Kiterunner / ffuf: Fuzz undocumented endpoint paths
□ Check common paths: /swagger.json, /openapi.json, /graphql, /api-docs

GraphQL Introspection (Three-level attempt):
  1. Standard introspection query
  2. Minified query (Bypass WAF full block)
  3. Query only __schema { types { name } } (Minimal probing)
```

### Phase 2: Authentication Testing

```text
JWT Analysis (jwt_tool / Burp):
□ alg:none attack: Modify header to "alg":"none", clear signature
□ Key confusion: RS256 public key → HS256 symmetric key
□ Weak HMAC key brute force: jwt_tool -C -d wordlist.txt
□ Expiration/Claim tampering: Modify exp/iat/sub/role claims
□ kid injection: ../../etc/passwd → HMAC signature bypass

OAuth 2.0:
□ redirect_uri manipulation → Authorization code leakage
□ CSRF via missing state parameter
□ Token leakage in Referer header
□ Missing PKCE detection

GraphQL Authentication:
□ mutation bypassing authentication via GET request (CSRF)
□ Batch query authentication bypass
```

### Phase 3: Authorization Testing (BOLA/IDOR/BFLA)

```text
BOLA (Broken Object Level Authorization):
□ Iterate numeric IDs: /user/1 → /user/2 → /user/3
□ Iterate UUIDs
□ Iterate usernames/emails
□ Burp Autorize: Dual session replay comparison

BFLA (Broken Function Level Authorization):
□ Regular user executing admin APIs
□ HTTP method switching: GET → PUT → PATCH → DELETE
□ API version downgrading: /v2/admin → /v1/admin
□ Mass assignment injection: {"users": [1,2,3]} → {"users": [1,2,3,admin_id]}

Tools: Burp Autorize, AuthMatrix, Entropy (malicious_insider persona)
```

### Phase 4: GraphQL Specific

```text
Introspection leakage → Information exposure detection
Alias overloading → 100+ aliases DoS
Batch querying → 10+ concurrent queries DoS
Field duplication → __typename × 500
Directive overloading → Recursive @skip/@include
Circular querying → Deeply nested introspection recursion
Field suggestions → Error message information leakage
GraphiQL/Playground exposure → IDE public risk
GET mutations → CSRF risk
Tracing/Debug mode → Metadata leakage

Tools: FireTail, Escape DAST, api.sh (Phases 1-3)
```

### Phase 5: REST Input Validation

```text
□ HTTP method switching: GET→POST→PUT→DELETE→OPTIONS→PATCH
□ Content-Type tampering: JSON→XML→multipart
□ NoSQL injection: {"username": {"$gt": ""}}
□ SSRF via URL parameters: webhook URL/avatar URL/import URL
□ XXE in XML endpoints
□ Parameter pollution: /api?role=user&role=admin
□ Mass assignment: Add is_admin: true to request body
```

### Phase 6: Business Logic and Differential Testing

```text
□ Entropy compare: diff v1 vs v2 API → Status code changes/field deletions/latency regressions
□ Multi-role workflow testing: admin/user/readonly permissions matrix
□ Coupon/points/price manipulation
□ Race conditions: Concurrent requests testing TOCTOU
```

### Phase 7: WebSocket Testing

```text
□ Endpoint discovery
□ Message injection (Inject payload, prototype pollution)
□ Oversized message handling
□ Type confusion
□ Cross-Site WebSocket Hijacking (CSWH)
```

### Phase 8: Rate Limiting and DoS

```text
□ Rate limit bypass via headers: X-Forwarded-For, X-Real-IP
□ Path variations: /api/ → /api → /Api/ → /API/
□ Slowloris low bandwidth exhaustion
□ GraphQL batch query deep nesting DoS
□ IP rotation testing (ProxyCat proxy pool)
```

### Phase 9: Data Exposure

```text
□ Excessive data exposure: Compare API response vs UI display
□ Pagination enumeration: ?page=1&limit=10000
□ Error message information leakage: Stack traces/internal paths/SQL errors
□ GraphQL nested traversal accessing unauthorized data
□ OpenAPI specification exposing sensitive endpoints
```

### Phase 10: CI/CD Integration

```text
□ Entropy --ci --watch: Automatically rerun when spec changes
□ Escape DAST: Automatically block builds based on severity thresholds
□ Persist findings for regression testing
□ StackHawk (Developer-first, ZAP core)
```

## Toolchain

| Tool | Purpose | Acquisition |
|------|------|------|
| Vespasian | Traffic → OpenAPI/GraphQL spec | GitHub: praetorian-inc/vespasian |
| Entropy | LLM generated attack scenarios, 5 personas | GitHub: arjinexe/entropy-chaos |
| Escape DAST | Business logic security testing | escape.tech |
| api.sh | 8-phase full protocol attack pipeline | GitHub: Sharon-Needles/api |
| FireTail | GraphQL 12 specific tests | firetail.ai |
| jwt_tool | Comprehensive JWT testing | GitHub: ticarpi/jwt_tool |
| Burp Autorize | Dual session authorization comparison | Burp BApp Store |

## References

- `references/rest-graphql-testing.md` — REST + GraphQL deep testing
- `references/jwt-oauth-testing.md` — JWT + OAuth security testing


## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step in the workflow (rather than just reading)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
