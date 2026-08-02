# Frida Bypass Kit — Generic Android Security Bypass Framework

> Source: [FridaBypassKit](https://github.com/okankurtuluss/FridaBypassKit) (2025)
> Applicable scenario: when dynamic APK analysis requires bypassing root detection, SSL pinning, emulator detection, or anti-debugging

## Overview

FridaBypassKit is a Frida script integrating four major bypass capabilities. It requires no per-app customization and works out of the box.

## The Four Bypass Capabilities

### 1. Root detection bypass

- Hook `File.exists()` to hide the su binary
- Intercept `Runtime.exec()` root check calls
- Hide root-related packages (Magisk, SuperSU, etc.) from PackageManager
- Modify system properties to make the device appear unrooted

### 2. SSL Pinning bypass

- Hook `TrustManagerImpl.verifyChain()`
- Hook `TrustManagerImpl.checkTrustedRecursive()`
- Bypass certificate chain validation
- Return an empty certificate chain to avoid verification
- Compatible with OkHttp, Retrofit, and custom implementations

### 3. Emulator detection bypass

- Forge TelephonyManager return values
- Return fake phone numbers and carrier names
- Modify Build properties

### 4. Anti-debugging bypass

- Hook `Debug.isDebuggerConnected()`
- Block debugger detection
- Bypass anti-debugging checks

## Usage

```bash
# Prerequisites
pip install frida-tools
adb push frida-server /data/local/tmp/
adb shell chmod 755 /data/local/tmp/frida-server
adb shell su -c /data/local/tmp/frida-server &

# Inject into the target APP
frida -U -f com.example.app -l FridaBypassKit.js
```

## Other recommended Frida bypass scripts

| Project | Highlights | Link |
|------|------|------|
| httptoolkit/frida-interception-and-unpinning | Directly MitM all HTTPS traffic | [GitHub](https://github.com/httptoolkit/frida-interception-and-unpinning) |
| 0xCD4/SSL-bypass | Generic non-customized SSL bypass | [GitHub](https://github.com/0xCD4/SSL-bypass) |
| incogbyte/ssl-bypass gist | Bypass common SSL pinning methods | [Gist](https://gist.github.com/incogbyte/1e0e2f38b5602e72b1380f21ba04b15e) |
| Zero3141/Frida-OkHttp-Bypass | Specifically targets OkHttp CertificatePinner | [GitHub](https://github.com/Zero3141/Frida-OkHttp-Bypass) |

## Integration with this package

Use within the `apk-reverse` workflow when the following situations occur:

1. The APP detects root and refuses to run → enable Root Detection Bypass
2. HTTPS requests aren't visible in plaintext during capture → enable SSL Pinning Bypass
3. The APP detects an emulator and refuses to run → enable Emulator Detection Bypass
4. The APP crashes after attaching Frida → enable Debug Detection Bypass

Recommended combination: run the full FridaBypassKit first, then make targeted adjustments.
