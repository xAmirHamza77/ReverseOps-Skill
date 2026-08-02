# iOS Reverse Engineering Deep Dive

## IPA Acquisition and Decryption

```bash
# Download from the App Store
ipatool search "Target App"
ipatool purchase -b com.target.app
ipatool download -b com.target.app -o app.ipa

# Extract an installed app from the device
# Jailbroken device
scp root@device:/private/var/containers/Bundle/Application/*/Target.app .

# Decryption (App Store binaries are encrypted FAT format)
# frida-ios-dump (recommended)
python3 dump.py com.target.app -o decrypted.ipa

# Clutch
Clutch -i  # list installed apps
Clutch -d 1  # decrypt the first one

# dumpdecrypted
DYLD_INSERT_LIBRARIES=dumpdecrypted.dylib /path/to/App
```

## Mach-O Analysis

```bash
# Basic information
otool -l TargetBinary | grep crypt    # encryption status
otool -L TargetBinary                 # dynamic library dependencies
otool -hv TargetBinary                # header information
jtool2 --pages TargetBinary           # memory page information

# Thin a Fat Binary
lipo -info TargetBinary
lipo TargetBinary -thin arm64 -output TargetBinary_arm64

# Symbol analysis
nm -g TargetBinary                    # exported symbols
nm -a TargetBinary                    # all symbols
swift-demangle <mangled_name>         # Swift symbol demangling

# class-dump
class-dump -H TargetBinary -o headers/
# Exports ObjC classes and method declarations to the headers/ directory
```

## Objective-C Runtime Analysis

```text
Message passing mechanism:
objc_msgSend(id self, SEL op, ...)  →  dynamic method dispatch
  ↓
Runtime lookup:
1. Class method list cache
2. Class method list
3. Walk up the superclass chain
4. +resolveInstanceMethod / +resolveClassMethod
5. forwardingTargetForSelector
6. methodSignatureForSelector + forwardInvocation
```

### Frida ObjC Hook

```javascript
// Hook instance methods
var hook = ObjC.classes.ClassName["- instanceMethod:"];
Interceptor.attach(hook.implementation, {
    onEnter: function(args) {
        // args[0] = self, args[1] = selector, args[2+] = method args
        console.log("self: " + new ObjC.Object(args[0]));
        console.log("arg: " + args[2].toInt32());
    }
});

// Hook class methods
var hook = ObjC.classes.ClassName["+ classMethod:"];
Interceptor.attach(hook.implementation, { ... });

// Call ObjC methods
var NSString = ObjC.classes.NSString;
var str = NSString.stringWithString_("test");
console.log(str.UTF8String());
```

## Swift Reversing

```text
Swift name mangling:
$s10ModuleName5ClassC6method3argSi_tF
  │ │         │     │ │      │  │   └─ parameter type
  │ │         │     │ │      │  └───── return type  
  │ │         │     │ │      └──────── parameter name
  │ │         │     │ └─────────────── method name
  │ │         │     └──────────────── class name (length + name)
  │ │         └────────────────────── module name
  │ └──────────────────────────────── identifier marker
  └────────────────────────────────── global marker

Tools: swift-demangle, Hopper (automatic demangling)
```

## Jailbreak Detection Bypass

```text
Detection method categories:

1. Filesystem checks:
   □ /Applications/Cydia.app
   □ /var/lib/apt/
   □ /bin/bash
   □ /usr/sbin/sshd
   → Hook NSFileManager.fileExistsAtPath:

2. Sandbox escape detection:
   □ Whether fork() succeeds (forbidden inside the sandbox)
   □ system() calls
   → Hook fork → return -1

3. Dyld injection detection:
   □ _dyld_get_image_count > threshold
   → Cap the return value to a plausible range

4. Scheme detection:
   □ cydia:// URL scheme
   → Hook UIApplication.canOpenURL:

5. sysctl detection:
   □ CTL_KERN/KERN_PROC/KERN_PROC_PID → kinfo_proc
   → Hook sysctl → clear the P_TRACED bit in p_flag
```

### Frida Unified Bypass Script

```javascript
// File detection bypass
var NSFileManager = ObjC.classes.NSFileManager;
var defaultManager = NSFileManager.defaultManager();
Interceptor.attach(defaultManager["- fileExistsAtPath:"].implementation, {
    onLeave: function(retval) {
        var path = ObjC.Object(args[2]).toString();
        if (path.includes("Cydia") || path.includes("apt") || 
            path.includes("sshd") || path.includes("bash")) {
            retval.replace(0); // false
        }
    }
});

// fork bypass
Interceptor.replace(Module.findExportByName(null, "fork"), 
    new NativeCallback(function() { return -1; }, 'int', []));

// dyld bypass
var _dyld_get_image_count = Module.findExportByName(null, "_dyld_get_image_count");
Interceptor.attach(_dyld_get_image_count, {
    onLeave: function(retval) {
        if (retval.toInt32() > 200) retval.replace(200);
    }
});
```

## Key Protection Bypass Checklist

| Protection | iOS Bypass Method |
|------|-------------|
| App Store encryption | frida-ios-dump / Clutch |
| SSL Pinning | Objection `ios sslpinning disable` / SSL Kill Switch 2 |
| Jailbreak detection | Objection `ios jailbreak disable` / custom Frida hooks |
| Anti-debugging (PT_DENY_ATTACH) | Frida injection after launch / debugserver |
| Integrity checks | Hook MAC checks / code signature validation |
| Anti-injection | Modify Mach-O to remove the __RESTRICT segment |
| Swift obfuscation | swift-demangle + LLM-assisted semantic recovery |
| Screenshot protection | Hook UIScreen.mainScreen.snapshotViewAfterScreenUpdates |

Source: OWASP MSTG, frida-ios-dump, The iPhone Wiki
