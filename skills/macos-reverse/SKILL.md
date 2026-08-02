---
name: macos-reverse
description: Use for authorized macOS and Mach-O reverse engineering including codesign, Objective-C/Swift recovery, endpoint security surfaces, and Apple platform malware analysis.
---

# macOS / Mach-O Reverse Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md`
2. `NOW`: Confirm the target is macOS/Mach-O/App bundle (iOS IPA → `mobile-reverse/`)
3. `NEXT`: tool-index; jtool2/lldb, etc.
4. `ACT`: Signature and load information → static → dynamic (lldb/Frida)

## Applicable scenarios

- Mach-O executables / dylibs / frameworks
- .app bundles, LaunchAgent/Daemon
- Objective-C / Swift symbols and runtime
- Notarization/signing, Hardened Runtime, TCC-related behavior analysis
- macOS malware static/dynamic analysis (jointly with malware-analysis)

## Workflow

### 1. Package and signature

```bash
file target
codesign -dv --verbose=4 target
spctl -a -vv target 2>&1
otool -L target
```

### 2. Static

```text
□ class-dump / swift-demangle / Hopper / Ghidra / IDA
□ Strings and XPC service names, TCC-sensitive APIs
□ LC_LOAD_dylib dependencies and rpaths
```

### 3. Dynamic

```text
□ lldb / Frida
□ Observe with fs_usage / log stream
□ Network: jointly with protocol-reverse or a proxy
```

## Toolchain

| Tool | Purpose |
|------|------|
| otool / nm / codesign | Built into the system |
| Hopper / Ghidra / IDA | Decompilation |
| class-dump / dsdump | ObjC |
| Frida / lldb | Dynamic |
| jtool2 | Mach-O |

## References

- `references/macho-triage.md`
- `../mobile-reverse/` (iOS) `../ghidra-reverse/` `../malware-analysis/`

## Routing context

**Upstream**: MASTER R31  
**Downstream**: iOS → mobile-reverse; general samples → malware-analysis

## Task completion self-check

- [ ] Did I record the signature/Hardened Runtime status?
- [ ] Are there address-level/symbol-level conclusions?
- [ ] Checklist?
