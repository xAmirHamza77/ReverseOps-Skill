# .NET Reverse Engineering General Workflow

Complete workflow details, IL patch reliability, string decryptor extraction, state machine identification, and dnlib scripting.

## Complete Workflow (End-to-End)

```text
1. Identify  → Confirm it is a managed .NET program (not native)
2. Detect    → DIE / de4dot --detect to identify the obfuscator
3. Deobf     → de4dot deobfuscation (preserve the original sample)
4. Static    → dnSpyEx: use the C# view to locate, the IL view for key logic
5. Dynamic   → dnSpyEx debugger: break at key methods, inspect runtime plaintext
6. Patch     → Modify with the IL editor, Save Module
```

Artifacts from each step must be written to disk: original sample `target.exe` → deobfuscated `target-clean.exe` → patched `target-patched.exe`.

## IL Patch vs C# Patch Reliability

**Core conclusion: use the IL editor for critical modifications, not the C# editor.**

| Dimension | C# Editor (Edit Method C#) | IL Editor (Edit IL) |
|------|---------------------------|---------------------|
| Compilation failure risk | High (missing references, syntax, lambda rewrite failures) | Almost zero |
| Information fidelity | Compiler regenerates IL, which may differ from the original | Replaced as-is, instruction by instruction |
| Applicable to | Changing a string, changing a constant, simple logic | Changing checks, removing validation, changing control flow |
| async/await/state machines | Frequently fails to compile or is distorted | Directly modify state machine fields — reliable |

dnSpyEx's C# decompiler is based on read-only decompilation plus attempted recompilation; recompiling compiler-generated code (state machines, closures, `yield`) fails very easily. The IL editor edits instruction by instruction — what you see is what you get.

### Typical IL Patch Patterns

```text
Change a check (if (check) → always true):
  Original: call bool Foo::Check()
      brfalse.s SKIP
  Patched:  ldc.i4.1            ; push true
      brfalse.s SKIP      ; now never branches, SKIP never executes
  Or more directly:
      ldc.i4.1
      ret                 ; the method directly returns true

Change a check (if (check) → always false):
  ldc.i4.0
  ret

Remove an entire validation block:
  Nop everything out, or change to ret + correct return value

Change a string constant:
  Changing strings in the C# editor is usually OK (ldstr swaps the token directly), but if the string is in resources/encrypted, you must modify the decryption logic

Change a numeric constant:
  Change the operand of ldarg / ldc instructions directly
```

## State Machine Identification (async/await / yield)

C# `async/await` and `IEnumerator` yield compile into **state machines**: the compiler generates a nested class whose `MoveNext()` uses a `state` field with switch dispatch. dnSpyEx's C# view reconstructs it as async, but decompilation may be lossy; the IL view of `MoveNext` is the most accurate.

```text
The MoveNext structure of async/await:
  switch(this.<>1__state) {
    case 0: ... logic before the await; this.<>1__state = 1; await MoveNext;
    case 1: ... logic after the await;
  }

To patch async logic: modify the state transitions in MoveNext or the checks in a specific case.
Patching async with the C# editor almost always fails → IL is required.
```

## String Decryptor Extraction

See `obfuscators.md` for details. Below is additional material on batch string decryption via dnlib scripting:

```csharp
// dnlib script: scan all string decryptor calls, resolve them at runtime, and write back
// Usage: dotnet script decrypt.csproj target.exe 0x06000012
using System;
using System.Reflection;
using dnlib.DotNet;
using dnlib.DotNet.Writer;
using dnlib.DotNet.Emit;

var module = ModuleDefMD.Load(args[0]);
var decryptorToken = uint.Parse(args[1], System.Globalization.NumberStyles.HexNumber);

// Find the decrypt method and invoke it via reflection (requires loading the assembly into an AppDomain)
// Iterate all methods, replacing call Decryptor(token) with ldstr "decrypted result"
foreach (var type in module.GetTypes())
    foreach (var method in type.Methods)
    {
        if (!method.HasBody) continue;
        var instrs = method.Body.Instructions;
        for (int i = 0; i < instrs.Count; i++)
        {
            // Identify the decryptor call pattern, invoke the decryptor to get the plaintext, replace with ldstr
            // (The boilerplate for invoking the decryptor via reflection is omitted here; the idea: load the original assembly →
            //   get plaintext via MethodInfo.Invoke → instrs[i] = OpCodes.Ldstr + operand=plaintext)
        }
    }

var opts = new ModuleWriterOptions(module);
module.Write("target-decrypted.exe", opts);
```

dnlib is the de facto standard for .NET metadata programming — de4dot itself is built on it. It is the first choice when writing custom deobfuscation scripts.

## Dynamic Debugging Key Points

The dnSpyEx debugger is far friendlier to .NET programs than native:

- **Breakpoint at method entry**: right-click the method → Add Breakpoint
- **Inspect object values**: once paused, the Locals / Watch windows directly show object fields and string contents
- **Memory writes**: you can directly modify runtime variable values (Edit Value)
- **Exception breakpoints**: Debug → Exceptions, check the exception types to break on — obfuscators often use exception-driven control flow; breaking on exceptions reveals the real path

### Exception-Driven Control Flow

Some obfuscators put normal logic inside `try` and use `throw` + `catch` for branching. Statically the IL looks like exception handling, but it is actually control flow:

```text
try { throw new CustomException(0x42); }
catch (CustomException e) {
    switch(e.Code) {
        case 0x42: real logic A; break;
        case 0x43: real logic B; break;
    }
}
```

Set an exception breakpoint (on `CustomException`) and trace the `Code` value flow — much faster than grinding through IL.

## Module Initializer (Module .cctor)

A .NET module's static constructor (the `.cctor` of `<module>`) executes first when the assembly loads; obfuscators often place anti-tamper / decryption initialization here. Analysis order:

```text
1. First check <module>.cctor (Module .cctor) — decryption/anti-debug initialization
2. Then check Program.Main / Startup
3. If anti-tamper is in .cctor → patch .cctor first, then unpack
```

## General Pattern for Extracting Config / C2 / Keys

Red team tools and loaders often embed encrypted configs in resources or fields, decrypting them at runtime:

```text
Location workflow:
1. Check strings for plaintext URLs/IPs (usually none after obfuscation)
2. Find byte[] fields + decryption methods (AES/XOR)
3. Dynamically break at the decryption method's return point and dump the decrypted plaintext
4. Common: AES-256-CBC with Key==IV (Codegate 2013 pattern, see the .NET section of reverse-engineering/tools.md)
```

Refer to `references/sharp-tools.md` for the specific config structures of red team tools.

## Boundary with reverse-engineering

- **IL2CPP / NativeAOT** → compiled to native, no CLR metadata → use `reverse-engineering/` (IDA/r2); this skill only does identification
- **Managed .NET** (standard C# exe/dll, Mono/Unity managed layer, Xamarin) → this skill
- **Hybrid (native loader + .NET payload)** → the loader part goes to `reverse-engineering/`; after dumping the .NET payload, switch to this skill

## Artifact Checklist for Disk Output

Recommended outputs for each .NET reversing task:
- `target-original.exe` (original sample, untouched)
- `target-clean.exe` (after de4dot unpacking)
- `notes.md` (identified obfuscator, decryptor tokens, key method addresses, config/C2/keys)
- `target-patched.exe` (after patching, if needed)
- `il-diff.txt` (IL comparison before/after patching, if a patch was made)
