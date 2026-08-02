// ReverseOps sample dataset (fictional) — fallback when panel/data/data.js has not
// been generated yet. Never overwrites real data loaded before it.
// Regenerate real data with: python3 scripts/mkreport.py
(function () {
  if (window.REVERSEOPS_DATA) return;
  window.REVERSEOPS_DATA_IS_SAMPLE = true;
  window.REVERSEOPS_DATA = {
    generator: "mkreport.py (ReverseOps) — SAMPLE",
    generated: "2026-08-03",
    reports: [
      { file: "reports/2026-07-14_demo-corp-external.md", title: "Penetration test: demo-corp external perimeter", target: "demo-corp.example", date: "2026-07-14", findings: 4 },
      { file: "reports/2026-07-28_demo-corp-api.md", title: "API security review: demo-corp billing API", target: "api.demo-corp.example", date: "2026-07-28", findings: 3 }
    ],
    findings: [
      {
        id: "CRI-001", title: "SQL injection in legacy /search endpoint (auth bypass to DBA)", case: "demo-corp.example",
        severity: "critical", cvss: 9.8, status: "confirmed", category: "injection", cwe: "CWE-89",
        owasp: "A03:2021 Injection", attack: ["T1190"],
        target: { host: "demo-corp.example", url: "https://demo-corp.example/legacy/search?q=" },
        evidence: [
          { kind: "request", ref: "evidence/cri-001-req.txt", note: "q=test' UNION SELECT user(),@@version-- -" },
          { kind: "response", ref: "evidence/cri-001-resp.txt", note: "200, banner in page body" }
        ],
        poc: "curl -sG 'https://demo-corp.example/legacy/search' --data-urlencode \"q=test' UNION SELECT user(),@@version-- -\" | grep -o 'db@.*'",
        remediation: "Parameterize the query; kill the legacy endpoint after the /v2 cutover; add WAF rule as interim.",
        discovered: "2026-07-14", report: "reports/2026-07-14_demo-corp-external.md", source: "markdown"
      },
      {
        id: "HIG-001", title: "Rate-limit bypass on login via X-Forwarded-For spoofing", case: "demo-corp.example",
        severity: "high", cvss: 7.4, status: "confirmed", category: "rate-limit", cwe: "CWE-307",
        owasp: "A07:2021 Identification and Authentication Failures", attack: ["T1110.001"],
        target: { host: "demo-corp.example", url: "https://demo-corp.example/api/login" },
        evidence: [
          { kind: "request", ref: "evidence/hig-001-req.txt", note: "429 without XFF" },
          { kind: "response", ref: "evidence/hig-001-resp.txt", note: "200 with rotated XFF" }
        ],
        poc: "for i in $(seq 1 999); do curl -s -o /dev/null -w '%{http_code}\\n' -H \"X-Forwarded-For: 10.0.0.$((i%250+1))\" -X POST https://demo-corp.example/api/login -d @creds.json; done",
        remediation: "Trust XFF only at the edge (real_ip + proxy whitelist); rate-limit on account + device fingerprint.",
        discovered: "2026-07-14", report: "reports/2026-07-14_demo-corp-external.md", source: "markdown"
      },
      {
        id: "HIG-002", title: "Unauthenticated GraphQL introspection + persisted query list", case: "api.demo-corp.example",
        severity: "high", cvss: 7.5, status: "fixed", category: "info-disclosure", cwe: "CWE-200",
        owasp: "API8:2023 Security Misconfiguration", attack: ["T1592"],
        target: { host: "api.demo-corp.example", url: "https://api.demo-corp.example/graphql" },
        evidence: [{ kind: "response", ref: "evidence/hig-002.json", note: "full schema dump, 214 types" }],
        poc: "curl -s https://api.demo-corp.example/graphql -d '{\"query\":\"{__schema{types{name}}}\"}' -H 'content-type: application/json'",
        remediation: "Introspection off in production; allow-list persisted operations only.",
        discovered: "2026-07-28", report: "reports/2026-07-28_demo-corp-api.md", source: "markdown"
      },
      {
        id: "MED-001", title: "JWT accepts alg=none on partner SSO callback", case: "api.demo-corp.example",
        severity: "medium", cvss: 6.5, status: "confirmed", category: "auth", cwe: "CWE-347",
        owasp: "A02:2021 Cryptographic Failures", attack: ["T1550"],
        target: { host: "api.demo-corp.example", url: "https://api.demo-corp.example/sso/callback" },
        evidence: [{ kind: "request", ref: "evidence/med-001.txt", note: "alg:none token accepted, 302 to dashboard" }],
        poc: "jwt-tool <token> -X a -pc alg -pv none",
        remediation: "Pin expected algorithms server-side; reject tokens whose alg is not the configured allow-list member.",
        discovered: "2026-07-28", report: "reports/2026-07-28_demo-corp-api.md", source: "markdown"
      },
      {
        id: "MED-002", title: "Verbose stack traces on malformed JSON bodies", case: "demo-corp.example",
        severity: "medium", status: "open", category: "info-disclosure", cwe: "CWE-209",
        target: { host: "demo-corp.example" },
        poc: "curl -s -X POST https://demo-corp.example/legacy/search -H 'content-type: application/json' -d '{'",
        remediation: "Uniform error handler; log details server-side only.",
        discovered: "2026-07-14", report: "reports/2026-07-14_demo-corp-external.md", source: "markdown"
      },
      {
        id: "MED-003", title: "Missing rate limiting on password reset (user enumeration)", case: "api.demo-corp.example",
        severity: "medium", status: "open", category: "rate-limit", cwe: "CWE-307",
        target: { host: "api.demo-corp.example", url: "https://api.demo-corp.example/reset" },
        poc: "ffuf -u https://api.demo-corp.example/reset -d 'email=FUZZ@demo-corp.example' -w users.txt -mc 200,404",
        remediation: "Uniform 200 for reset; per-IP + per-account throttles.",
        discovered: "2026-07-28", report: "reports/2026-07-28_demo-corp-api.md", source: "markdown"
      },
      {
        id: "LOW-001", title: "Missing security headers (CSP, HSTS, X-Frame-Options) on legacy vhost", case: "demo-corp.example",
        severity: "low", status: "open", category: "configuration", cwe: "CWE-693",
        target: { host: "legacy.demo-corp.example" },
        poc: "curl -sI https://legacy.demo-corp.example | grep -Ei 'content-security|strict-transport|x-frame' || echo missing",
        remediation: "Add headers at the vhost; enroll in HSTS preload after TLS audit.",
        discovered: "2026-07-14", report: "reports/2026-07-14_demo-corp-external.md", source: "markdown"
      },
      {
        id: "INF-001", title: "Directory listing exposes marketing asset bucket (no sensitive files)", case: "demo-corp.example",
        severity: "info", status: "false-positive", category: "configuration",
        target: { host: "assets.demo-corp.example" },
        poc: "curl -s https://assets.demo-corp.example/?list-type=2",
        remediation: "Optional: disable listing for tidiness.",
        discovered: "2026-07-14", report: "reports/2026-07-14_demo-corp-external.md", source: "markdown"
      }
    ],
    stats: {
      by_severity: { critical: 1, high: 2, medium: 3, low: 1, info: 1 },
      by_status: { confirmed: 3, open: 3, fixed: 1, "false-positive": 1 },
      by_category: { "rate-limit": 2, configuration: 2, "info-disclosure": 2, injection: 1, auth: 1 },
      by_case: { "demo-corp.example": 5, "api.demo-corp.example": 3 },
      timeline: { "2026-07-14": 5, "2026-07-28": 3 },
      attack_techniques: { "T1190": 1, "T1110.001": 1, "T1592": 1, "T1550": 1 },
      generated: "2026-08-03",
      total: 8,
      risk_index: 58.3
    }
  };
})();
