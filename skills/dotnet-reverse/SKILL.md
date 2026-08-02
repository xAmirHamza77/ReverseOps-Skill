---
name: dotnet-reverse
description: .NET / C# binary reverse engineering. Use when the target is a .NET assembly (CLR in the PE header, managed .exe/.dll programs), C# build artifacts (including NativeAOT), red team Sharp* tools (Rubeus / SharpHound, etc.), .NET obfuscated programs (ConfuserEx / SmartAssembly / Babel / Eazfuscator), or .NET loaders / info-stealers / packed malware. Prefer dnSpyEx + de4dot; when direct AI operation is needed, integrate with dnSpy MCP. Not for pure native binaries (use reverse-engineering / ida-reverse instead).
license: MIT
compatibility: Requires a filesystem-based code agent or CLI with shell access, Windows host preferred (dnSpyEx is a Windows GUI); on Linux/macOS, use ILSpy/de4dot CLI + mono/dotnet runtime.
allowed-tools: Bash Read Write Edit Glob Grep Task WebFetch WebSearch
metadata:
  user-invocable: "false"
---

# .NET / C# Reverse Engineering Standard Operating Procedure

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Use DIE/`file`/CLR header to confirm the target is managed .NET (otherwise SWITCH to `ida-reverse/` / `reverse-engineering/`)
2. `NOW`: If obfuscation is suspected → run `de4dot` first to unpack, produce `*-clean.exe`, and preserve the original sample
3. `NEXT`: Static analysis with dnSpyEx (or dnSpy MCP / `ilspycmd`): browse C# + use the **IL view** for key decision logic
4. `ACT`: Debug dynamically when plaintext/C2 is needed; when logic changes are needed, prefer **IL patching** over C# recompilation
5. At the end of each phase, give the user a 3–6 item next-step menu (including report export)

## Scope

Prefer this skill when the task involves:

- Identifying and reversing .NET / C# compiled artifacts (managed PE / .exe / .dll)
- Analyzing red team Sharp* toolchains (Rubeus, SharpHound, SharpShell, etc.)
- Deobfuscating ConfuserEx / SmartAssembly / Babel / Eazfuscator / .NET Reactor and similar protectors
- Reversing the decryption and C2 logic of .NET loaders / info-stealers / RATs
- Patching C# programs (modifying checks, constants, keygen)
- Analyzing the pre-IL2CPP Mono/Unity managed layer (note: after IL2CPP compilation it is native; use `reverse-engineering/` + seed-014)

If the target is a pure native binary (compiled C/C++/Go/Rust, no CLR), use `reverse-engineering/`, `ida-reverse/`, or `radare2/` instead.

## Core Principles

- **Identify before acting**: Confirm it is a managed .NET program first (CLR in the PE header + `#~` / `#Strings` streams + mscoree `_CorExeMain`), then decide to use dnSpy instead of IDA
- **IL over C#**: dnSpyEx's C# decompiler can lose/distort information (compiler-generated state machines, async/await, yield); key decision logic and patches must be done in the **IL editor**. The C# view is only for quick browsing
- **de4dot first**: When an obfuscator is encountered, run `de4dot` first before static analysis; otherwise strings/control flow are all garbage
- **MCP integration**: If a dnSpy MCP (`dnspy_*` tools) is registered in the environment, prefer the MCP interface for decompilation / IL inspection to avoid switching back and forth to the GUI
- **Evidence-based output**: Deobfuscated artifacts, extracted configs/C2/keys, and patch diffs must all be written to disk

## Toolchain Mapping

| Capability | First Choice | Notes |
|------|------|------|
| Decompile + debug + patch | **dnSpyEx** | The flagship; the only GUI with an IL editor. Old dnSpy is unmaintained — use the Ex branch |
| Lightweight CLI / headless decompilation | **ILSpy** (`ilspycmd`) | Suitable for batch, scripted, Linux/macOS workflows |
| Deobfuscation | **de4dot** | Default solution for mainstream protectors: the full ConfuserEx family, SmartAssembly, etc. |
| Obfuscator identification | **Detect It Easy (DIE)** / **file** | Identify the protector type first, then decide de4dot parameters |
| Programmatic IL manipulation | **dnlib** | Write C# scripts for batch metadata editing / string decryptors |
| Direct AI operation | **dnSpy MCP** | Tool interfaces such as `dnspy_decompile` / `dnspy_inspect_il` |

> Prerequisite: Install dnSpyEx + de4dot on the Windows host (choco or releases); on Linux/macOS use `ilspycmd` + `dotnet runtime`. See the installation matrix in `references/sharp-tools.md`.

## Six-Phase Workflow

### 1. Identify (.NET detection)

Confirm the target is a managed program; do not analyze a native PE as .NET:

```powershell
# Windows
file target.exe                       # "PE32 executable ... for MS Windows" is not enough
# Key: check for the CLR
powershell -c "[System.Reflection.AssemblyName]::GetAssemblyName('target.exe')"
# or
Drag it straight into dnSpyEx — if it opens, it's managed

# General
strings target.exe | grep -iE "mscoree|_CorExeMain|mscorlib|System\\."
```

**.NET identification markers:**
- PE header `Data Directory[14]` (CLR Runtime Header) is non-zero
- `mscoree.dll` import / `_CorExeMain` entry point
- `#~`, `#Strings`, `#US`, `#GUID`, `#Blob` metadata streams
- `mscorlib` / `System.Private.CoreLib` strings

**NativeAOT exception:** Compiled to native, no CLR header, but has `System.Private.CoreLib` strings and restructured type metadata — these go to `reverse-engineering/` (IDA/r2); this skill only provides identification hints.

### 2. Detect (obfuscator detection)

```powershell
# DIE quick identification
diec target.exe                        # Detect It Easy CLI
# Or drag into dnSpyEx and check for large numbers of garbled class names / distorted control flow
```

Common obfuscators → unpacking strategy (details in `references/obfuscators.md`):

| Obfuscator | Characteristics | de4dot Handling |
|--------|------|------------|
| ConfuserEx (1.0.0 / 2.x) | `<module>` anti-tamper, control flow distortion, string encryption | `de4dot target.exe` usually auto-detected |
| SmartAssembly | `circular`/`string encoding`, resource compression | `de4dot target.exe` |
| Babel.NET | Method body encryption, control flow | `de4dot target.exe` |
| Eazfuscator.NET | String/resource encryption | `de4dot`; some versions require manual work |
| .NET Reactor | anti-tamper + necrobit | `de4dot`; newer versions may fail and require manual work |

### 3. Deobfuscate

```powershell
# de4dot auto-detects most protectors by default
de4dot target.exe -o target-clean.exe

# Specify type (when auto-detection fails)
de4dot --type cfze target.exe          # ConfuserEx
de4dot --type sa target.exe            # SmartAssembly

# Multi-layer obfuscation / de4dot reports unknown
de4dot --detect target.exe             # see what it identifies
# May need to patch anti-tamper first, then run de4dot (see references/obfuscators.md)
```

Output: `target-clean.exe`; use it for all subsequent analysis. **Keep the original sample** for comparison.

### 4. Static Analyze

Load the unpacked sample in dnSpyEx:

- **C# view**: Quickly browse class structures, method signatures, strings (for locating)
- **IL view**: Key decision logic, encryption logic, and state machines must be viewed in IL (right-click → Edit IL or IL view)
- Find the entry point: `Main` / `Startup` / module initializer (`Module .cctor`)
- Find key logic: search for `flag`, `password`, `verify`, `check`, `encrypt`, `http`, `Config`

```text
Locate a string → find references → find the method using it → view decision logic in the IL view
```

### 5. Dynamic (dynamic debugging)

dnSpyEx debugger: attach to a process / start debugging, set breakpoints at key methods, and observe at runtime:
- Decrypted plaintext strings (many obfuscators decrypt strings only at runtime)
- C2 addresses, config decryption results
- Exception-driven control flow (anti-debug commonly uses `try/catch` to hide the real path)

> .NET dynamic debugging is far friendlier than native — you can directly see object values and string contents. Prefer dynamic over grinding through static analysis.

### 6. Patch (modify as needed)

```text
dnSpyEx → right-click method → Edit Method (C#) or Edit IL
  - Change a check: ldc.i4.0 → ldc.i4.1 (false→true)
  - Change a constant: edit the string/number directly
  - Remove validation: nop out the entire block
File → Save Module → replace the original file
```

**IL patch reliability > C# patch**: C# recompilation may fail (missing references, syntax issues); IL editing is almost never lossy. See `references/common-workflow.md` for details.

## Trigger Scenario Routing

Enter this skill when the user says things like:
- "Reverse a .NET / C# binary" / "decompile a C# program"
- "dnSpy analysis" / "dnSpyEx patch"
- "ConfuserEx / SmartAssembly / Babel deobfuscation / unpacking"
- "Sharp* tool analysis" (Rubeus / SharpHound / SharpShell)
- ".NET malware / loader / info-stealer reversing"
- "C# program patch / keygen / modify a check"

## When to Switch Out

- IL2CPP-compiled Unity games → `reverse-engineering/` + `seed-014_unity-il2cpp-reverse.md` (IL2CPP is native; dnSpy does not apply)
- NativeAOT artifacts → `reverse-engineering/` (same as above, native)
- Pure native PE (no CLR) → `reverse-engineering/` / `ida-reverse/`
- Need batch migration of symbols/functions to another version → `binary-diff/`
- Need to draw attack paths / call chain diagrams → `diagram-generator/`

## Routing Context

**Upstream entries**: `skills/SKILL.md` (master), `routing.md`
**Downstream exits**:
- IL2CPP / NativeAOT (native) → `reverse-engineering/`
- Deep native .so/.dll segment analysis → `ida-reverse/` / `radare2/`
- Need AI to directly operate dnSpy → register and integrate dnSpy MCP (see `references/sharp-tools.md`)

**Peer related modules**:
- `reverse-engineering/languages-compiled.md` (.NET intro points to this module)
- `apk-reverse/` (Xamarin/MAUI Android reversing can switch back to this module for the C# layer)

## Reference Documents

- [references/obfuscators.md](references/obfuscators.md) — Detailed ConfuserEx / SmartAssembly / Babel / Eazfuscator / .NET Reactor deobfuscation + anti-tamper bypass
- [references/common-workflow.md](references/common-workflow.md) — Complete workflow, IL patch reliability, string decryptor extraction, state machine identification
- [references/sharp-tools.md](references/sharp-tools.md) — Red team Sharp* tool analysis, tool installation matrix, dnSpy MCP integration, community resource index

## Task Completion Self-Check

- [ ] Have I confirmed CLR / managed identity (or already SWITCHED out of this skill)?
- [ ] For obfuscated samples, did I run de4dot / equivalent unpacking before deep analysis?
- [ ] Was key logic verified in the IL view (rather than relying only on C# pseudocode)?
- [ ] Are artifacts (clean sample / config / patch diff) written to disk and reproducible?
- [ ] Did I provide a next-step menu or report output?
