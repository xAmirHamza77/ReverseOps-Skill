---
name: mobile-reverse
description: Use for authorized Android or iOS application reverse engineering and security testing, including APK or IPA analysis, runtime instrumentation, SSL pinning, and platform protection checks.
---
# Mobile Reverse Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm this skill's operations are authorized routine operations
2. `NOW`: Confirm whether the current task falls within this skill's scope
3. `NEXT`: Read `../tool-index.md` to verify tool availability and actual paths
4. `NEXT`: If a tool is missing, call bootstrap; do not guess paths
5. `ACT`: Enter step one of the "Workflow" and execute; do not stall in a confirmation state

> Unified Android + iOS reverse engineering methodology
> Frida / Objection / OWASP MSTG / SSL Pinning Bypass

## Applicable Scenarios

- Android APK reverse engineering and security testing
- iOS IPA reverse engineering and security testing
- Mobile application runtime dynamic instrumentation
- SSL Pinning / root detection / jailbreak detection bypass
- Mobile encryption algorithm extraction (AES/RSA/HMAC keys)
- Mobile application penetration testing (OWASP MASTG)
- Application testing in non-root/jailbroken environments

## Four-Phase Workflow

### Phase 1: Information Gathering

```text
Android:
□ APK acquisition (Google Play / APKMirror / adb pull)
□ Manifest analysis: permissions, exported components, Intent Filters, backup flag
□ androguard: androguard analyze APK → components/permissions/signature
□ APKLeaks: hardcoded API Key / Token / Secret scanning
□ Packer detection: whether packed (360/Tencent/Bangcle/ijiami)

iOS:
□ IPA acquisition (App Store / ipatool / Apple Configurator)
□ Decrypt App Store binaries: frida-ios-dump / Clutch
□ Info.plist analysis: ATS configuration, URL Schemes, Queries Schemes
□ class-dump: export ObjC class structure
□ Protection detection: whether Swift/ObjC obfuscation is used
```

### Phase 2: Static Analysis

```text
Cross-platform:
□ JADX-GUI: APK → Java source (Android)
□ Ghidra / Hopper: .so / Mach-O decompilation
□ radare2 / Cutter: CLI quick reconnaissance

Android-specific:
□ apktool d app.apk → smali code + resources
□ dex2jar: DEX → JAR → JD-GUI
□ smali/baksmali: Dalvik bytecode modification

iOS-specific:
□ class-dump: export ObjC headers
□ Swift symbol recovery: swift-demangle
□ dsymutil: debug symbol extraction
□ otool -L: view dynamic library dependencies
□ jtool2: Mach-O analysis
```

### Phase 3: Dynamic Analysis

```text
Frida — general dynamic instrumentation:
□ frida-ps -U: list device processes
□ frida-trace -U -i "open*" com.app: trace function calls
□ Custom Hook scripts: modify arguments/return values, call private methods

Objection — Frida enhancement layer (no scripting required):
□ objection -g "com.app" explore
□ android root disable / ios jailbreak disable
□ android sslpinning disable / ios sslpinning disable
□ android keystore list / ios keychain dump
□ env / ls / sqlite connect

Frida Gadget (no root/jailbreak required):
□ Inject frida-gadget.so / FridaGadget.dylib into APK/IPA
□ Re-sign → install → hook without device privileges
□ objection patchapk --source app.apk (fully automated)
```

### Phase 4: Network Analysis

```text
□ Burp Suite: intercept HTTP/HTTPS, modify requests/responses
□ mitmproxy: scripted proxy (Python API)
□ Wireshark: PCAP capture analysis
□ Certificate installation: Android user certificate → system certificate (Magisk + MoveCert)
□ SSL Pinning bypass: Frida/Objection/Xposed/SSL Kill Switch 2
□ WebSocket / gRPC traffic analysis
```

## Common Bypass Quick Reference

### SSL Pinning

```bash
# Objection (simplest)
objection -g "com.app" explore
android sslpinning disable

# Frida universal script
frida -U -l ssl_pinning_bypass.js -f com.app

# Xposed (Android)
TrustMeAlready module → globally disable certificate validation
```

### Root / Jailbreak Detection

```bash
# Objection
android root disable
ios jailbreak disable

# Frida custom (multi-layer detection)
Java.perform(function() {
    var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
    RootBeer.isRooted.implementation = function() { return false; };
    // Additional bypasses: Magisk su detection, frida-server detection, /proc/self/maps detection
});
```

### Anti-Debugging

```bash
# Android
frida -U -l anti_debug_bypass.js -f com.app
# Bypass: ptrace(TracerPid), /proc/self/status, isDebuggerConnected()

# iOS
# Bypass: PT_DENY_ATTACH, sysctl CTL_KERN/KERN_PROC/KERN_PROC_PID
frida -U -l ios_anti_debug.js -f com.app
```

## Mobile Cryptography Extraction

```javascript
// Android — Hook Cipher.getInstance to obtain keys + algorithms
Java.perform(function() {
    var Cipher = Java.use("javax.crypto.Cipher");
    Cipher.getInstance.overload('java.lang.String').implementation = function(algo) {
        console.log("[Cipher] Algorithm: " + algo);
        return this.getInstance(algo);
    };
    Cipher.init.overload('int', 'java.security.Key').implementation = function(mode, key) {
        console.log("[Cipher] Key: " + bytesToHex(key.getEncoded()));
        return this.init(mode, key);
    };
});

// iOS — Hook CCCrypt
Interceptor.attach(Module.findExportByName("libcommonCrypto.dylib", "CCCrypt"), {
    onEnter: function(args) {
        console.log("CCCrypt op: " + args[0] + " alg: " + args[1]);
        console.log("Key: " + hexdump(args[3], { length: args[4].toInt32() }));
    }
});
```

## Toolchain

| Tool | Platform | Purpose |
|------|:--:|------|
| JADX-GUI | A | Java decompilation |
| apktool | A | APK unpack/rebuild |
| Ghidra | A+I | Multi-architecture decompilation |
| Hopper | I | iOS-specific disassembly |
| Frida | A+I | Dynamic instrumentation |
| Objection | A+I | Frida REPL enhancement |
| MobSF | A+I | Automated SAST+DAST |
| class-dump | I | ObjC class export |
| frida-ios-dump | I | IPA decryption |
| jtool2 | I | Mach-O analysis |
| Burp Suite | A+I | HTTP interception |
| mitmproxy | A+I | Scripted proxy |

> A=Android, I=iOS

## References

- `references/frida-objection-deep.md` — Frida + Objection in-depth usage
- `references/ios-reverse-guide.md` — iOS reverse engineering deep dive
- `references/anti-detection-bypass.md` — Root/jailbreak/anti-debug/SSL Pinning bypass


## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than only reading it)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
