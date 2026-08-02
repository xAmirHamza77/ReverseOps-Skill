# [Seed] iOS jailbreak detection bypass + traffic capture

## Scenario classification
iOS reversing / mobile security testing

## Target overview
An iOS app crashes on launch or shows "abnormal environment" on jailbroken devices. Jailbreak detection must be bypassed before its HTTP requests can be analyzed further.

## Full execution chain

1. Prepare the jailbroken device (Dopamine / palera1n / unc0ver) → install frida-server (Cydia repo `build.frida.re`)
2. Sideload the IPA onto the device, install with AppSync Unified → launch and confirm `frida-ps -U` works
3. Launch the app → crashes or pops "abnormal environment"
4. Use `frida-trace -U -i 'open' -i 'stat' -i 'access' -i 'fork' com.target.app` to observe detection calls
5. Common hits: probing `/Applications/Cydia.app`, `/private/var/lib/apt`, `/usr/sbin/sshd`, whether `fork()` succeeds, `/etc/apt`
6. One-liner bypass with objection: `objection --gadget com.target.app explore -s "ios jailbreak disable"`
7. After successful launch, capture traffic by hooking NSURLSession with frida, or with mitmproxy + a system certificate

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| App still crashes after objection bypass | App uses both SSL Pinning and jailbreak detection | Enable `ios sslpinning disable` together with `ios jailbreak disable` | 15min |
| App checks before startup; hooks are too late | Jailbreak detection runs in `+load` or `__attribute__((constructor))` | Use `-f` spawn mode + `frida-trace --aux 'spawn=1'` | 20min |
| App hangs after hooking stat | Hooking stat also affects some system calls | Only hook stat triggered by code inside the app bundle (filter by caller) | 30min |
| App still detects after frida-server starts | App checks port 27042 and the frida string | Rename `frida-server` + change the default port (`-l 0.0.0.0:1234`); connect from the client with `-H ip:1234` | 25min |
| Still SSL errors after installing the mitmproxy cert | On iOS 14+, system certificates need another toggle in Settings → General → About → Certificate Trust Settings | After installing the cert, enable it in the trust settings | 10min |

## Toolchain findings

- **objection** is the Swiss army knife of iOS security testing, with built-in jailbreak / sslpin / clipboard / keychain dump modules
- **r2frida** attaches radare2 to frida, letting you disassemble at runtime and modify registers — much stronger than pure frida
- **Hopper / IDA** to decompile iOS binaries (iOS Mach-O works with IDA 7+ or Ghidra)
- **dumpdecrypted** is obsolete; use **frida-ios-dump** to unpack

## Key code/commands

Generic jailbreak-detection hook template:

```javascript
// Intercept NSFileManager fileExistsAtPath checks for jailbreak paths
var NSFileManager = ObjC.classes.NSFileManager;
Interceptor.attach(NSFileManager['- fileExistsAtPath:'].implementation, {
    onEnter: function (args) {
        var path = ObjC.Object(args[2]).toString();
        var jbPaths = [
            '/Applications/Cydia.app',
            '/Library/MobileSubstrate/MobileSubstrate.dylib',
            '/bin/bash', '/usr/sbin/sshd',
            '/etc/apt', '/private/var/lib/apt/'
        ];
        if (jbPaths.indexOf(path) !== -1) {
            this.shouldFake = true;
            console.log('[+] Hide JB path: ' + path);
        }
    },
    onLeave: function (retval) {
        if (this.shouldFake) retval.replace(0);
    }
});

// Intercept fork() — succeeds on jailbroken devices, returns -1 on stock
var fork = Module.findExportByName(null, 'fork');
Interceptor.replace(fork, new NativeCallback(function () {
    return -1;
}, 'int', []));
```

One-command dump (for uploading to decompilers like jadx):

```bash
frida-ios-dump -l com.target.app
# Outputs Payload/TargetApp.app + decrypted Mach-O
```

## Improvement suggestions for this package

- Add a new sub-skill `ios-reverse/` (parallel to `apk-reverse/`) covering: unpacking, jailbreak-detection bypass, SSL Pin, Keychain dump, frida-ios-dump, `+load` timing
- The existing `apk-reverse/` should not carry iOS content, to avoid confusion

## Reusable patterns/script snippets

**iOS security testing quick reference**:

```text
1. Prepare the jailbreak (Dopamine for 16.x / palera1n for older)
2. frida-ios-dump to decrypt
3. otool / class-dump to view class hierarchy
4. Start an objection console
5. ios jailbreak disable
6. ios sslpinning disable
7. mitmproxy capture (system cert + trust settings — both needed)
8. Once key logic is located, dig deeper statically with IDA / Hopper
```

## Evolution actions
- [ ] **Suggest adding an ios-ReverseOps** (the current routing matrix routes iOS through reverse-engineering/platforms.md, which is not granular enough)
- [ ] Add frida-ios-dump to the bootstrap manifest
- [ ] Add an "iOS Security Testing Checklist" to references/

## Environment info
- Jailbroken device: iPhone X (iOS 16.5) + Dopamine 1.1.7
- Host: macOS 13+ / Kali (mitmproxy + frida-tools)
- frida-server-ios: 16.x

## Anonymization requirements
This entry is seed data, written from public technical patterns; no real targets involved. Bundle ID `com.target.app` is a placeholder.
