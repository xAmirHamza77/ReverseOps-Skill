# [Seed] Unity IL2CPP game reversing → restore metadata + modify logic

## Scenario classification
Game security / mobile reversing

## Target overview
A Unity-built Android game (IL2CPP mode): in-app purchases or core algorithms are written in C# but compiled to native. Restore method names, locate key logic, and modify it via patching or hooking.

## Full execution chain

1. Unpack the APK, confirm it's IL2CPP
   ```bash
   unzip target.apk -d apk
   ls apk/lib/arm64-v8a/        # seeing libil2cpp.so means IL2CPP
   ls apk/assets/bin/Data/Managed/Metadata/
   # key file: global-metadata.dat
   ```
2. Restore metadata with **Il2CppDumper**
   ```bash
   Il2CppDumper libil2cpp.so global-metadata.dat output/
   # outputs: DummyDll/ + script.json + il2cpp.h + dump.cs
   ```
3. Run IDA's IL2CPP script (`ida_with_struct.py`)
   - Load libil2cpp.so → File → Script File → choose ida_with_struct.py → choose script.json
   - IDA now shows C# method names, signatures, strings
4. Search dump.cs for business keywords (`AddCoin` / `OnPurchase` / `Verify` / `IsVip` / `CheckSign`)
5. Take the key methods' offsets → jump to them in IDA for disassembly / decompilation
6. Choose a modification approach:
   - **Static patch**: edit the check in IDA directly to `mov w0, #1; ret`
   - **Dynamic hook**: Frida attaching to il2cpp methods (via Frida-Il2CppBridge)
7. Repack and verify / inject and verify

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Il2CppDumper reports unsupported metadata version | Newer Unity changed the metadata format | Upgrade Il2CppDumper / use Il2CppInspectorRedux instead | 30min |
| global-metadata.dat is encrypted | AntiCheatToolkit / custom encryption in use | Find the decryption function at game init (usually near il2cpp_init) → dump after mmap with Frida | 2h |
| Method names in dump.cs but IDA doesn't match | script.json and the .so are inconsistent | Must use artifacts from the same dump; clear cache when switching IDA | 20min |
| Frida hook of an IL2CPP method errors | IL2CPP methods aren't standard Java/ObjC; method offset must be computed | Use the frida-il2cpp-bridge library, not a hand-rolled Interceptor.attach | 1h |
| Game crashes after patching | File-hash check or anti-tamper | Find and patch the hash-check logic too, or hook without modifying files | 2h |
| Crash on launch after repacking | apksigner v2 signature can't survive byte changes then re-signing | Delete META-INF + apktool b + apksigner sign in sequence | 30min |

## Toolchain findings

- **Il2CppDumper**: old but still the default choice
- **Il2CppInspectorRedux**: more modern, supports new Unity versions, outputs plugin scripts for IDA / Ghidra / Binary Ninja
- **frida-il2cpp-bridge** is the de facto standard for hooking IL2CPP — vastly stronger than bare Frida
- **DnSpy** / **dnSpyEx** for viewing DummyDll (the dumped pseudo .NET assembly)
- **UnityCheat** family of helper tools (leaving the GameGuardian family aside)

## Key code/commands

frida-il2cpp-bridge hook example:

```typescript
// hook.ts
import "frida-il2cpp-bridge";

Il2Cpp.perform(() => {
    const Assembly = Il2Cpp.domain.assembly("Assembly-CSharp").image;

    // hook static method
    const PlayerData = Assembly.class("PlayerData");
    PlayerData.method("AddCoin").implementation = function (n: number) {
        console.log("[+] AddCoin called with:", n);
        return this.method("AddCoin").invoke(99999); // change to 99999
    };

    // hook instance method
    const Purchase = Assembly.class("Purchase");
    Purchase.method("VerifyReceipt").implementation = function () {
        console.log("[+] VerifyReceipt → always true");
        return true;
    };
});
```

```bash
# Compile + inject
npm install frida-il2cpp-bridge
frida-compile hook.ts -o hook.js
frida -U -f com.target.game -l hook.js --no-pause
```

IDA static patch:

```text
1. Open libil2cpp.so, run il2cpp_load_metadata.py
2. Jump to the offset of IsPurchaseValid from dump.cs
3. Change the function prologue to MOV W0, #1; RET (ARM64)
4. Apply Patches → Save → replace into the APK → re-sign
```

## Improvement suggestions for this package

- `reverse-engineering/SKILL.md` already covers Unity but lacks a complete IL2CPP **end-to-end workflow** example
- `reverse-engineering/references/il2cpp-cheatsheet.md` as a standalone doc: dump tool comparison, frida-bridge templates, encrypted-metadata handling
- Add frida-il2cpp-bridge to the bootstrap manifest

## Reusable patterns/script snippets

**Standard IL2CPP flow**:

```text
1. Confirm IL2CPP (check for libil2cpp.so under lib/abi)
2. Find the metadata (assets/bin/Data/Managed/Metadata/global-metadata.dat, possibly encrypted)
3. Restore with Il2CppDumper / Inspector
4. IDA + script to bring back metadata info
5. Search dump.cs for business keywords
6. Choose patch vs hook
7. Verify (launch + real scenario)
```

**Handling encrypted metadata**:

```text
1. Hook fopen/open-family syscalls with Frida to see who reads global-metadata.dat
2. Dump the decrypted metadata from memory after mmap/read
3. Feed the dumped memory to Il2CppDumper as metadata
```

## Evolution actions
- [ ] Add a complete il2cpp chapter to reverse-engineering/references
- [ ] Add frida-il2cpp-bridge / Il2CppInspectorRedux to the bootstrap-manifest
- [x] Routing matrix already includes Unity / IL2CPP

## Environment info
- Windows / macOS (for running Il2CppDumper); target device Android arm64
- IDA Pro 7.7+ or Ghidra 11+
- frida-tools 16.x, frida-il2cpp-bridge 0.9+
- Unity versions: 2019.x - 2022.x (metadata format differs slightly across versions)

## Anonymization requirements
This entry is seed data, written from public technical patterns; no real games involved. Package name `com.target.game` is a placeholder.
