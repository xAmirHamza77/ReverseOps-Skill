# 2026-06-29 burp-mcp Full Testing and Fixes

## Scenario Classification
BurpSuite Extension Development / Testing

## Target Overview
Performed full runtime availability testing on the burp-mcp extension (Burp Suite Professional MCP Full Control, 63 tools), identifying and fixing 3 bugs + 1 bridge layer race condition.

## Full Execution Chain

1. Static Verification: Checked Java dispatch table / getToolList() / bridge buildToolDefinitions 63-tool consistency across all three locations
2. Compilation: build.bat automated fat-jar packaging (JDK 21, montoya-api 2025.5, gson 2.11.0, nanohttpd 2.3.1)
3. Loading: Loaded extension into Burp Suite Professional 2026.4.2, confirmed [MCP] Server started
4. Runtime Testing: Invoked 127.0.0.1:9876 directly via Node http client across 5 batches:
   - Batch 1: 30 read-only/encoding-decoding/query tools (zero side-effects)
   - Batch 2: Network transmission tools (send_request / repeater / intruder, target scanme.nmap.org)
   - Batch 3: Intruder 7 variants (attack/async/wordlist/pitchfork/cluster_bomb/battering_ram/with_options, small-scope enumeration)
   - Batch 4: Scope/configuration/rule/handler/add_issue/compare
   - Batch 5: crawl + proxy_clear
5. Identified and fixed 3 bugs, regression testing passed

## Lessons Learned & Pitfalls

| Problem | Cause | Solution | Time Spent |
|---------|-------|----------|------------|
| `scan()` request_count stays 0 | AuditConfiguration does not accept seed URLs; code missed calling addRequest | Parsed host/port/path from URL, constructed GET HttpRequest to feed activeAudit.addRequest() | 2h (incl. verification) |
| `send_to_intruder()` throws HttpRequest must have an HttpService | Using HttpRequest.httpRequest(raw) lacks service overload | Added buildRequestWithService(): Regex-parsed host/port/https from Host header → HttpService, overloaded with httpRequest(HttpService, raw) | 20min |
| `set_upstream_proxy()` missing parameter NullPointer NPE | params.get("proxy_host") returned null → .getAsString() NPE | Added null check: Return clear error if (!params.has("proxy_host")) | 5min |
| mcp-bridge.js API async race condition: 4 fast requests lose 4th response | process.exit(0) kills pending HTTP requests on stdin close | Added pending counter + stdinClosed flag → Exit only after all requests complete | 1h (incl. mock testing) |
| curl HTTP_CODE=000 cannot probe port | curl blocked by local sandbox | Switched to Node http module for probing | 5min |
| Montoya API Audit package path misguessed | Inferred Audit was under scanner package based on online javadoc | Decompiled real montoya-api-2025.5.jar with javap to confirm it resides under scanner.audit package | 30min |
| File encoding issue causes Edit tool match failure | UTF-8 with BOM Chinese content displayed encoding mismatch in terminal | Switched to Python for replacement, specifying utf-8-sig | 10min |

## Toolchain Findings

- montoya-api 2025.5 Audit resides under `burp.api.montoya.scanner.audit.Audit` (not scanner.Audit)
- AuditConfiguration factory method does not accept seed URLs; seed must be fed via Audit.addRequest(HttpRequest)
- HttpRequest.httpRequest(raw) without service overload is sufficient for Repeater, but Intruder requires attaching HttpService
- Intruder.sendToIntruder(HttpRequest) requires request to have an attached service
- api.burpSuite().version() methods major()/minor()/build() removed in 2025.5 (deprecation → removal); replace with buildNumber()/edition()/toString()
- send_request calls http.sendRequest(), bypassing proxy history
- Local curl blocked by sandbox, Node http required for probing
- IDA MCP port is not fixed at 13337 (increments across instances), whereas Burp MCP port is configurable via system property/env with fixed default

## Critical Code / Commands

### Full Testing Script Pattern
```javascript
const http = require('http');
function call(tool, params={}, timeoutMs=30000) {
  return new Promise((resolve) => {
    const body = JSON.stringify({tool, params});
    const req = http.request({hostname:'127.0.0.1',port:9876,path:'/',method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, (res)=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d));}catch(e){resolve({__raw:d.slice(0,200)});} });
    });
    req.on('error', e => resolve({__err: e.message}));
    req.on('timeout', () => { req.destroy(); resolve({__timeout:true}); });
    req.setTimeout(timeoutMs);
    req.write(body); req.end();
  });
}
```

### buildRequestWithService (Core Fix)
```java
private HttpRequest buildRequestWithService(String rawRequest) {
    java.util.regex.Matcher m = java.util.regex.Pattern.compile(
            "(?im)^Host:\\s*([^:\r\n]+)(?::(\\d+))?\\s*$").matcher(rawRequest);
    if (!m.find()) return HttpRequest.httpRequest(rawRequest);
    String host = m.group(1).trim();
    boolean isHttps = rawRequest.contains("https://") || rawRequest.contains(":443");
    int port = m.group(2) != null ? Integer.parseInt(m.group(2))
              : (isHttps ? 443 : 80);
    HttpService svc = HttpService.httpService(host, port, isHttps);
    return HttpRequest.httpRequest(svc, rawRequest);
}
```

### Bridge Layer Race Condition Fix (mcp-bridge.js)
```javascript
let pending = 0;
let stdinClosed = false;
rl.on('line', async (line) => { ... pending++; ... finally { pending--; if (stdinClosed && pending === 0) process.exit(0); } });
rl.on('close', () => { stdinClosed = true; if (pending === 0) process.exit(0); });
```

### scan() Seed Fix
```java
// Construct GET seed request from URL and feed to audit
java.net.URL u = new java.net.URL(url);
String host = u.getHost();
boolean isHttps = "https".equalsIgnoreCase(u.getProtocol());
int port = u.getPort() > 0 ? u.getPort() : (isHttps ? 443 : 80);
String path = (u.getPath() == null || u.getPath().isEmpty()) ? "/" : u.getPath();
String pathQuery = u.getQuery() != null ? path + "?" + u.getQuery() : path;
HttpService svc = HttpService.httpService(host, port, isHttps);
HttpRequest seedReq = HttpRequest.httpRequest(svc,
    "GET " + pathQuery + " HTTP/1.1\r\nHost: " + host + "\r\nConnection: close\r\n\r\n");
activeAudit.addRequest(seedReq);
```

## Recommendations for Improvement

- Routing matrix already covers BurpSuite MCP, no changes needed
- `burpsuite-mcp-guide.md` appended with Changelog (3 fixes + bridge layer + full verification results)
- Tool table updated with Scanner (added mode parameter to scan) and Intruder (send_to_intruder Host header requirement)
- No new bootstrap entry required (compilation script build.bat is self-contained)
- IDA MCP port is non-fixed; recommended to note in MCP service management table

## Reusable Patterns & Script Snippets

- 63-tool availability testing script pattern (see critical code above). Applicable for regression testing of any HTTP-based MCP extension.
- buildRequestWithService pattern: Parses HttpService from Host header. Applicable across all Montoya API scenarios requiring HttpRequest + HttpService construction from raw requests.

## Evolution Actions
- [x] Updated routing matrix (Already covered, no changes needed)
- [ ] Updated tool-index (Uses .template, no changes needed)
- [ ] Updated bootstrap-manifest (No new tools)
- [x] Updated sub-skill documentation (appended Changelog to burpsuite-mcp-guide.md)
- [x] Added pitfall record (this entry)
- [ ] No update required

## Environment Info
- OS: Windows 11 Pro for Workstations 10.0.26200
- Tool Versions: JDK 21.0.11+10 / Burp Suite Professional 2026.4.2 (20260402000047704)
- Target Platform: montoya-api 2025.5 / gson 2.11.0 / nanohttpd 2.3.1
- Testing Target: scanme.nmap.org (Authorized testing site)

## Sanitisation Requirements
Testing target is public testing site scanme.nmap.org, no sanitisation needed. Contains no real private domains/IPs/Tokens/usernames.

## Index Synchronization (Final Step Before Submission)

After completing this log, `_index.md` must be synchronously updated:

1. Add a line to the corresponding subsection under "Categorized by Scenario" (including date, keywords)
2. Update the counter and "Last Updated" date under "Cumulative Statistics"

---
<!-- [Evolution Stats] Total Projects Completed: 7 | New Patterns Added: 2 (buildRequestWithService + bridge counter) | Toolchain Remediations: 4 -->
<!-- [Community Contribution] Ask user if they wish to submit PR to main repo upon completion. Process detailed in CONTRIBUTE-BACK.md -->
