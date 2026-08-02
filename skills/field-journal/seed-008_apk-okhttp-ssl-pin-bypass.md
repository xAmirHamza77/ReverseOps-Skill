# [Seed] APK Frida bypass of OkHttp SSL Pinning

## Scenario classification
APK reversing / mobile security testing

## Target overview
For an Android app using OkHttp with a custom CertificatePinner, dynamically bypass certificate validation with Frida so Burp can capture plaintext traffic.

## Full execution chain

1. Set up Frida + frida-server, launch the target app, confirm the process name
   ```bash
   adb shell "ps -A | grep com.target.app"
   frida-ps -U | grep target
   ```
2. Try capturing with Burp → certificate error, confirming pinning is enabled
3. Decompile the APK with jadx → search for `CertificatePinner` or `checkServerTrusted`
4. Determine whether it's OkHttp's built-in `CertificatePinner` or a custom `X509TrustManager`
5. Write a Frida script hooking the key validation points
6. Inject with Frida: `frida -U -f com.target.app -l bypass.js --no-pause`
7. Capture again → Burp can now see plaintext HTTPS

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Frida fails with `unable to connect to remote frida-server` | server not started or port taken | `adb forward tcp:27042 tcp:27042` + start the server | 10min |
| Hook does not take effect | App starts too fast; Frida injects too late | Use `-f` spawn mode with `--no-pause` | 15min |
| Some requests still SSL-error after hooking | App uses both OkHttp and native HttpsURLConnection | Also hook `X509TrustManager.checkServerTrusted` and `HostnameVerifier.verify` | 20min |
| Anti-detection: app exits after detecting Frida | App self-checks the frida-server port / `/data/local/tmp/re.frida.server` | Switch to frida-gadget (inject the .so into the APK) or magisk + zygisk-frida | 30min+ |
| Class names unfound after ProGuard | Class names become short names like `a.b.c` | In jadx use `Find Usages` to trace who instantiates OkHttpClient.Builder | 25min |

## Toolchain findings

- **objection**'s built-in `android sslpinning disable` solves 80% of cases with one command — no need to hand-write Frida scripts
- **frida-multiple-unpinning** (GitHub: WithSecureLabs) covers OkHttp 3/4, Retrofit, HttpsURLConnection, Conscrypt, Cordova — an all-in-one script
- The **MEDUSA** framework ships with various Android bypass modules and is quicker to pick up than bare Frida

## Key code/commands

Minimal working OkHttp pin-bypass script:

```javascript
Java.perform(function () {
    // 1. OkHttp 3/4 built-in CertificatePinner
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function (host, peers) {
            console.log('[+] OkHttp CertificatePinner.check bypassed: ' + host);
            return;
        };
    } catch (e) {}

    // 2. Custom X509TrustManager.checkServerTrusted
    try {
        var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        TrustManagerImpl.verifyChain.implementation = function (untrusted, holdHost, host, clientAuth, ocspData, tlsSctData) {
            console.log('[+] TrustManagerImpl.verifyChain bypassed: ' + host);
            return untrusted;
        };
    } catch (e) {}

    // 3. HostnameVerifier always passes
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    // complete using objection's built-in template...
});
```

One-command option (recommended):

```bash
objection --gadget com.target.app explore -s "android sslpinning disable"
```

## Improvement suggestions for this package

- `apk-reverse/references/` should have a dedicated `ssl-pinning-bypass.md` consolidating the four mainstream cases into a quick reference: OkHttp 3/4, Conscrypt, custom TrustManager, Flutter (boringssl)
- Add `objection` (pip package) to the bootstrap manifest

## Reusable patterns/script snippets

**Generic bypass flow**:

```text
1. Capture traffic → see which error class it is (CertPin / Hostname / TrustManager)
2. Search key classes in jadx (CertificatePinner / X509TrustManager / HostnameVerifier)
3. Prefer objection's one-liner → then frida-multiple-unpinning → then hand-written
4. If anti-Frida detection exists → switch to frida-gadget or zygisk
5. Handle Flutter apps separately (hook ssl_verify_peer_cert in libflutter.so)
```

## Evolution actions
- [x] Routing matrix already covers this (apk-reverse + Frida)
- [x] frida status in tool-index checked
- [ ] Suggest adding the ssl-pinning-bypass.md quick reference

## Environment info
- Kali / Windows + adb + frida-tools 16.x
- Target Android: 8-14 (TrustManagerImpl path differs across versions)
- Injection method: USB debugging + frida-server / or zygisk-frida for stealth

## Anonymization requirements
This entry is seed data, written from public technical patterns; no real targets involved. Package name `com.target.app` is a placeholder.
