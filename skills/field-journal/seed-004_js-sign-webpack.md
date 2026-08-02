# [Seed] JS signature reversing (Webpack + AES + timestamp)

## Scenario classification
JS signing

## Target overview
Reproduce the `sign` parameter generation algorithm of a web application's API locally.

## Full execution chain

1. Capture traffic in the browser → find POST requests carrying `sign` and `timestamp` parameters
2. Search the JS source for "sign" → locate it inside a webpack-bundled chunk file
3. Set a breakpoint where sign is assigned → hit it, inspect the call stack
4. Walk the call stack → find the signing function (inside some webpack module)
5. Analyze the signing logic: `sign = HmacSHA256(sorted_params + timestamp, secret_key)`
6. Key source: hard-coded inside another webpack module
7. Reproduce locally in Node.js → generated sign matches the browser's
8. Validate: send a request with the reproduced sign → normal data returned

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Too many search results for "sign" | Variable names minified after webpack bundling | Search for `sign=` instead, or find the request in the network panel and trace back via initiator | 15min |
| Breakpoint hits but code is unreadable | Webpack minification + variable-name obfuscation | Use Chrome's Pretty Print; use SourceMap if available | 10min |
| Local reproduction mismatches | Parameter ordering wrong | Carefully read the sort logic in source (keys sorted alphabetically + special-character handling) | 30min |
| timestamp precision wrong | Server uses seconds, I used milliseconds | `Math.floor(Date.now() / 1000)` | 5min |
| Can't find the key | Key lives in another chunk file, imported via require | console.log the key variable at the breakpoint | 10min |

## Toolchain findings

- Chrome DevTools' initiator column locates the signing function faster than searching source
- For webpack-bundled code, Pretty Print + breakpoints beats reading raw
- With a SourceMap (.map file), the original code can be restored directly
- Node.js's `crypto` module can reproduce most signing algorithms

## Key code/commands

```javascript
// Node.js reproduction
const crypto = require('crypto');

function generateSign(params, timestamp, secretKey) {
    // 1. Sort parameters by key alphabetically
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    // 2. Append the timestamp
    const message = sorted + '&timestamp=' + timestamp;
    // 3. HMAC-SHA256
    return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
}

const params = { user_id: '123', action: 'query' };
const timestamp = Math.floor(Date.now() / 1000);
const secretKey = 'hardcoded_key_from_webpack';
console.log(generateSign(params, timestamp, secretKey));
```

## Improvement suggestions for this package

- js-reverse's env-patching.md should add "how to handle cross-chunk dependencies in webpack"
- Suggest adding a quick-reference for "common signing algorithm identification" (HMAC-SHA256 vs MD5 vs custom)

## Reusable patterns/script snippets

**Standard JS signature reversing flow**:
```text
1. Capture traffic to find the signed request
2. Use initiator/call stack to locate the signing function
3. Analyze the signing logic (param sorting + concatenation + crypto)
4. Find the key source (hard-coded / API-returned / time-derived)
5. Reproduce in Node.js
6. Compare and validate
```

**Common signing patterns**:
```text
- HmacSHA256(sorted_params, key) → most common
- MD5(params + salt + timestamp) → older systems
- AES(JSON.stringify(params), key) → encryption rather than a signature
- RSA sign → rare, usually financial
```

## Evolution actions
- [ ] No routing matrix update needed
- [ ] No bootstrap-manifest update needed
- [ ] No sub-skill doc update needed

## Environment info
- OS: Windows
- Tool versions: Chrome DevTools, Node.js 20+
- Target platform: Web (Webpack-bundled SPA)

## Anonymization requirements
This entry is seed data, written from public technical patterns; no real targets involved.

---
<!-- [Evolution stats] Package cumulative completed projects: 4 | New patterns added: 2 | Toolchain issues fixed: 0 -->
<!-- [Community contribution] Seed data, no PR needed -->
