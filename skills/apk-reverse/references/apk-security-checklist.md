# APK Security Testing Cheatsheet

> Based on the OWASP MASTG (Mobile Application Security Testing Guide).
> Covers six dimensions: static analysis, dynamic analysis, network communication, data storage, authentication & authorization, and code protection.

---

## Static Analysis Checklist

### Manifest audit

```text
□ android:debuggable="true" → debuggable (should never appear in production)
□ android:allowBackup="true" → data can be extracted via backup
□ Components with android:exported="true" → exposed Activity/Service/Receiver/Provider
□ Custom permission protectionLevel → whether it is normal (should be signature)
□ scheme in intent-filter → whether a custom deeplink can be hijacked
□ android:usesCleartextTraffic="true" → cleartext HTTP allowed
□ minSdkVersion too low → may lack security features
```

### Code audit key points

```text
□ Hardcoded keys/Tokens (search "key", "secret", "password", "api_key")
□ Insecure randomness (java.util.Random instead of SecureRandom)
□ Insecure crypto (ECB mode, DES, MD5 used for passwords)
□ WebView configuration (setJavaScriptEnabled + addJavascriptInterface = RCE risk)
□ SQL injection (rawQuery concatenating user input)
□ Path traversal (ContentProvider openFile not validating paths)
□ Log leakage (Log.d/Log.i outputting sensitive info)
□ Clipboard leakage (ClipboardManager storing sensitive data)
□ Implicit Intent leakage (sendBroadcast without specifying a package name)
```

### Third-party library audit

```text
□ Outdated OkHttp/Retrofit versions (known vulnerabilities)
□ Outdated WebView kernel
□ SDKs with known vulnerabilities (check CVEs)
□ Ad SDK data collection scope
□ Push SDK configuration (whether tokens leak)
```

---

## Dynamic Analysis Checklist

### Frida hook priority targets

| Target | Hook point | Purpose |
|------|---------|------|
| Login authentication | `LoginActivity.login()` | Observe credential handling |
| Signature generation | `*Sign*`, `*sign*`, `*encrypt*` | Recover the signing algorithm |
| SSL Pinning | `CertificatePinner.check` | Bypass traffic capture blocking |
| Root detection | `*root*`, `*su*`, `*magisk*` | Bypass detection |
| Crypto operations | `javax.crypto.Cipher` | Extract key/IV |
| Token storage | `SharedPreferences.getString` | Observe token reads/writes |
| Network requests | `OkHttpClient.newCall` | Observe request construction |

### Common Frida one-liners

```bash
# Trace all crypto operations
frida-trace -U -f com.target.app -j '*Cipher*!*'

# Trace all HTTP requests
frida-trace -U -f com.target.app -j '*OkHttp*!*'

# Trace SharedPreferences reads/writes
frida-trace -U -f com.target.app -j '*SharedPreferences*!*'

# Trace all native function calls
frida-trace -U -f com.target.app -i 'Java_*'
```

### Objection quick commands

```bash
# Connect
objection -g com.target.app explore

# Common commands
android hooking list activities
android hooking list services
android sslpinning disable
android root disable
android clipboard monitor
env                              # view app directories
sqlite connect <db_path>         # connect to a database
```

---

## Network Communication Security

### Traffic capture setup

```text
Method 1: System proxy + Burp/mitmproxy
- Set WiFi proxy → Burp listening address
- Install the CA certificate on the device
- Android 7+ requires network_security_config or a Frida bypass

Method 2: VPN mode (recommended)
- Use HttpCanary / Packet Capture
- No root needed, no proxy configuration needed
- But cannot decrypt SSL-Pinned traffic

Method 3: Frida + r2frida
- Intercept network calls directly inside the process
- Not constrained by proxy/VPN
```

### Checklist items

```text
□ Whether HTTPS is used (all API calls)
□ Whether SSL Pinning (certificate pinning) is present
□ Whether certificate validation is correct (does not accept self-signed certs)
□ Whether Certificate Transparency (CT) checks exist
□ Whether API keys are transmitted in plaintext in requests
□ Whether tokens have an expiry mechanism
□ Whether request signing prevents tampering
□ Whether replay attack protection exists (nonce/timestamp)
□ Whether WebSocket is encrypted
□ Whether sensitive data appears in URL parameters (gets logged)
```

---

## Data Storage Security

### Locations to check

| Location | Risk | Check command |
|------|------|---------|
| SharedPreferences | Token/password stored in plaintext | `adb shell cat /data/data/pkg/shared_prefs/*.xml` |
| SQLite databases | Unencrypted sensitive data | `adb pull /data/data/pkg/databases/` |
| External storage | Readable by any app | `adb shell ls /sdcard/Android/data/pkg/` |
| App logs | Debugging info leakage | `adb logcat \| grep pkg` |
| Backup files | allowBackup=true | `adb backup -f backup.ab pkg` |
| Keyboard cache | Input history | Check whether `inputType` is `textPassword` |
| Screenshot protection | Sensitive screens can be captured | Check `FLAG_SECURE` |

### Encrypted storage options comparison

| Option | Security | Notes |
|------|--------|------|
| SharedPreferences plaintext | ❌ | Readable directly after root |
| EncryptedSharedPreferences | ✓ | AndroidX Security library |
| SQLCipher | ✓ | Encrypted SQLite |
| Android Keystore | ✓✓ | Hardware-level key protection |
| Custom AES encryption | ⚠️ | Depends on key management |

---

## Authentication and Authorization

### Common vulnerabilities

| Vulnerability | Test method |
|------|---------|
| Weak password policy | Try 123456, password, etc. |
| No lockout mechanism | Brute-force the login endpoint |
| Tokens don't expire | Replay an old token after logout |
| Privilege escalation (IDOR) | Modify user_id in requests |
| SMS code brute-forceable | 4/6-digit codes with no rate limit |
| OAuth misconfiguration | redirect_uri can be tampered with |
| Biometric auth bypass | Hook BiometricPrompt |
| Device binding bypass | Modify device_id |

### Test payloads

```bash
# Privilege escalation (IDOR) test
curl -H "Authorization: Bearer USER_A_TOKEN" \
     "https://api.target.com/users/USER_B_ID/profile"

# Token replay
# 1. Log in normally to obtain a token
# 2. Log out
# 3. Request with the old token → should return 401

# SMS code brute-force
for code in $(seq 0000 9999); do
    curl -X POST "https://api.target.com/verify" \
         -d "phone=13800138000&code=$code"
done
```

---

## Code Protection Assessment

| Protection measure | Detection method | Bypass difficulty |
|---------|---------|---------|
| ProGuard obfuscation | Check in jadx whether class names are a/b/c | Low (just renaming) |
| String encryption | Find the decrypt function, hook to get plaintext | Medium |
| Anti-debugging | Try to attach a debugger | Medium (bypassable with Frida) |
| Root detection | Run on a rooted device | Medium (generic script bypass) |
| Emulator detection | Run on an emulator | Low-Medium |
| Integrity checking | Install after modifying the APK | Medium (patch the check function) |
| Packer/hardening shell | Inspect entry classes and .so files | Medium-High (requires unpacking) |
| Native protection | Core logic in .so | High (requires IDA analysis) |
| VMP virtualization | Code executed through a VM | Very high |

---

## Quick Test Workflow (30 minutes)

```text
1. [5min] Unpack + Manifest audit
   apktool d app.apk
   Check debuggable/allowBackup/exported/cleartext

2. [10min] Quick code audit
   jadx -d out app.apk
   Search: password, key, secret, token, http://

3. [5min] Network testing
   Configure proxy → operate the APP → check for cleartext/weak crypto

4. [5min] Storage checks
   adb shell → check shared_prefs and databases

5. [5min] Dynamic verification
   Frida hook key functions → confirm findings
```
