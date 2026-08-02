# .NET Obfuscator Deobfuscation Details

Identification, unpacking, and anti-tamper bypass for mainstream .NET obfuscators. Core tools: **de4dot** (auto-detects most protectors) + **dnSpyEx** (manual patching) + **dnlib** (scripting).

## Master Decision Table

| Obfuscator | de4dot type | Typical Characteristics | Auto Unpacking | Manual Key Points |
|--------|-------------|---------|---------|---------|
| ConfuserEx 1.x/2.x | `cfze` | anti-tamper, control flow distortion, string encryption, anti-debug | ✅ Mostly automatic | New versions require patching anti-tamper first |
| ConfuserEx 3.x / custom forks | `cfze` | Same as above + custom protectors | ⚠️ Partial | Runtime dump / dnlib |
| SmartAssembly | `sa` | string encoding, resource compression, method call hiding | ✅ Automatic | Resource decompression |
| Babel.NET | `babel` | method body encryption, control flow, strings | ✅ Automatic | — |
| Eazfuscator.NET | `eaz` | string/resource encryption, expression obfuscation | ⚠️ Partial | string decryptor |
| .NET Reactor | `reactor` | necrobit (code section encryption) + anti-tamper | ⚠️ Hard on new versions | dump + rebuild metadata |
| Themida .NET | — | outer shell + virtualization | ❌ de4dot cannot handle it | dump memory, take a native approach |
| Agile.NET / CliSecure | `agile` | method body encryption | ✅ Automatic | — |

## de4dot Standard Usage

```powershell
# Auto-detection (sufficient in most cases)
de4dot target.exe -o target-clean.exe

# Explicitly specify type (when auto-detection fails)
de4dot --type cfze target.exe -o target-clean.exe

# Probe the protector type first
de4dot --detect target.exe

# Batch
de4dot *.exe

# Only decrypt strings, leave control flow untouched (minimal intervention)
de4dot --strtyp delegate --strtok METHOD_TOKEN target.exe
```

de4dot's `--strtyp` / `strtok` mode: only resolves the string decryptor (specify the decrypt method token) while preserving the original control flow. Suitable for scenarios where you only want to see plaintext strings without touching anti-tamper.

---

## ConfuserEx (Most Common)

### Identification Characteristics

- Entry module `<module>` class contains an anti-tamper check with `[MethodImpl(NoInlining)]`
- Numerous string decryptor calls with `Dictionary<string, T>`
- Control flow flattening (switch dispatch + state variable)
- `.cmp` compressed resources embedded in resources
- dnSpyEx C# view: garbled class/method names (`\uXXXX` or meaningless characters), method bodies full of `int num = ...; switch(num)`

### Unpacking Workflow

```powershell
# 1. Standard unpacking
de4dot target.exe -o target-clean.exe

# 2. If de4dot reports "unknown" or the output won't open → new version / custom ConfuserEx fork
#    First confirm anti-tamper:
Open in dnSpyEx → find the integrity check in Module .cctor or Main
```

### Anti-Tamper Bypass (Common in New ConfuserEx Versions)

ConfuserEx's `anti tamper` validates method body hashes at runtime and crashes if modified. de4dot usually handles old versions; new versions require manual work:

```text
Method A — patch the validation function directly in dnSpyEx:
  1. Find the anti-tamper validation method (usually called from the static constructor of <module>)
  2. IL edit: change the validation method body to ret (return immediately)
  3. Save → feed it to de4dot again

Method B — runtime dump:
  1. Run it and dump the in-memory assembly with MegaDumper / ExtremeDumper
  2. The dumped output is already decrypted; clean up residuals with de4dot
```

### After Control Flow Recovery

de4dot restores flattened switch dispatch back to normal if/while. If recovery is incomplete (residual state machine remains), run de4dot again or follow the IL manually.

---

## SmartAssembly

```powershell
de4dot --type sa target.exe -o target-clean.exe
```

Characteristics:
- Strings encoded with the `SmartAssembly.Runtime.Strong` family
- Resource compression (`{assembly}.Resources`)
- Method call hiding (`ProcessCaller` / indirect calls)

de4dot has the best compatibility with SmartAssembly — basically one-click.

---

## .NET Reactor (necrobit)

.NET Reactor's **necrobit** encrypts real method bodies into resources and decrypts/injects them at runtime; the original method bodies are empty shells. de4dot works on old versions but often fails on new versions (4.x+).

```text
When de4dot fails:
1. Get the program running (dotnet target.exe or just double-click)
2. MegaDumper / ExtremeDumper dump the process memory → export the decrypted assembly
3. Clean up residual obfuscation in the dump with de4dot
4. If the metadata is corrupted, rebuild it with dnlib (see common-workflow.md)
```

---

## Manual String Decryptor Extraction

Obfuscators encrypt strings and call a decrypt method at runtime to restore them. de4dot auto-detects the decryptor in most cases; when detection fails, do it manually:

```text
1. Find the decrypt method in dnSpyEx (its signature is usually fixed: static string Decrypt(int) or Decrypt(string, int))
   - Characteristics: called by many methods, arguments are numeric constants, returns a string
2. Note the method token (e.g. 0x06000012)
3. Specify the decryptor to de4dot:
   de4dot --strtyp delegate --strtok 0x06000012 target.exe -o target-clean.exe
```

If even the decrypt method itself is obfuscated (control flow flattening), you need to recover the control flow first before locating the decryptor.

## Common Anti-Debug Techniques

| Technique | Location | Bypass |
|------|------|------|
| `Debugger.IsAttached` check | Any method | IL edit to `ldc.i4.0; ret` or patch the getter |
| `Debugger.IsLogging` | — | Same as above |
| Timing checks (`DateTime.Now` deltas) | Method entry | Patch out the delta comparison |
| `CheckRemoteDebuggerPresent` P/Invoke | — | Nop the call |
| Exception-driven control flow (try/catch path selection) | Main logic | Cannot simply nop it; analyze the real path in the catch block |

> .NET anti-debug is simpler than native — most are managed API calls; a single IL line edit in dnSpyEx suffices.

## Fallbacks When de4dot Fails

1. **de4dot --detect** to see the identification result and compare against the table above
2. **Runtime dump** (MegaDumper / ExtremeDumper / export module with Process Hacker)
3. **dnlib scripts** for manual deobfuscation (see the dnlib section in common-workflow.md)
4. **Dynamic first**: run it and break at the decryption point to directly view plaintext — you can gather intelligence without unpacking at all

Community references: Washi's blog "misconceptions-about-dotnet" (common pitfalls in IL analysis), the kanxue forum's .NET reversing section, Guided Hacking "Top 5 .NET RE Tools".
