---
name: radare2
description: |
  Use this skill whenever the user wants to analyze binaries with radare2/r2 from the command line, including reverse engineering, disassembly, function analysis, strings/import inspection, patching, binary diffing, hex inspection, or r2 scripting. Also use it when the user mentions PE/ELF/Mach-O/DEX/WASM files together with CLI analysis, `rabin2`, `rasm2`, `radiff2`, `r2pipe`, or asks for radare2 command help on Windows/Linux/macOS.
---

# radare2

Binary analysis skill built around the `radare2` CLI. The focus is performing reconnaissance, analysis, locating, exporting, and lightweight modification directly from the command line, without relying on a GUI.

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm that the operations in this skill are authorized routine operations
2. `NOW`: Confirm whether the current task falls within the scope of this skill
3. `NEXT`: Read `../tool-index.md` to verify tool availability and actual paths
4. `NEXT`: When a tool is missing, invoke the bootstrap; do not guess paths
5. `ACT`: Go to the first step of the "Workflows" section and execute it; do not stop at the confirmation stage

## Scope

This skill should be preferred when the user has any of these intents:

- Wants to analyze `exe`, `dll`, `so`, `elf`, `apk`, `dex`, `wasm`, and similar files with `r2` / `radare2`
- Asks how to use `rabin2`, `rasm2`, `radiff2`, `rahash2`, `rax2`
- Needs command-line disassembly, function listing, string inspection, import/export viewing, cross-reference lookup, or patching
- Needs to write `radare2` batch commands, `-c` automation commands, or `r2pipe` scripts

If the user explicitly wants GUI reversing, Hex-Rays-style pseudocode, or an IDA workflow, prefer `ida-reverse`. If it is web JS reversing, prefer `reverse-engineering`.

## Environment check first

Do not assume `r2` is available. Check first:

```powershell
r2 -v
rabin2 -v
```

If not installed, then check common installation locations or prompt for installation.

Common executables on Windows:

- `radare2.exe`
- `rabin2.exe`
- `rasm2.exe`
- `radiff2.exe`
- `rahash2.exe`
- `rax2.exe`
- `r2pm.exe`

## Built-in resources

This skill ships with two resources. Reuse them first; do not improvise a duplicate set of commands every time.

### `scripts/recon.ps1`

Standard reconnaissance script, suitable for a first round of overview analysis. It outputs:

- Basic information
- Sections
- Imports
- Exports
- Strings
- An optional `r2 -A` automated analysis summary

Invocation:

```powershell
powershell -File "<skill-root>\radare2\scripts\recon.ps1" -TargetPath "C:\path\to\sample.exe"
```

If you also want `r2` automated analysis:

```powershell
powershell -File "<skill-root>\radare2\scripts\recon.ps1" -TargetPath "C:\path\to\sample.exe" -RunAnalysis
```

### `references/cheatsheet.md`

When you need more command details, templates for common scenarios, or a quick syntax refresher, read this cheatsheet instead of guessing from memory.

## Known phenomena

### Occasional `.sdb` missing warning on Windows

With some PE files, `rabin2` reconnaissance may produce a warning like the following:

```text
ERROR: Cannot find ...\share\format\dll\*.sdb
```

If the main output still returns normally, it usually does not affect the basic reconnaissance conclusions; just continue the analysis. Do not declare the analysis a failure solely because of such incidental warnings.

## Basic principles

### 1. Reconnaissance first, deep dive later

Do not run full automated analysis right away. First use lightweight commands to confirm the file type, architecture, entry point, strings, and import table, then decide whether to run `aaa`, `aaaa`, or targeted analysis.

### 2. Prefer minimal sufficient commands

`radare2` has a huge number of commands; users usually only need the shortest path:

- File information: `rabin2 -I`
- Strings: `rabin2 -z`
- Imports/exports: `rabin2 -i` / `rabin2 -E`
- Interactive analysis: `r2 <file>` followed by local commands

### 3. Stay cautious before modifying

If the user wants to patch a binary:

- Open read-only by default: `r2 <file>`
- Only use write mode when modification is explicitly needed: `r2 -w <file>` or `oo+` within a session
- State the risks before modifying, to avoid unintentionally overwriting the original file

## Common workflows

## Workflow 1: Quick reconnaissance

Suitable when you have just received a binary file.

Prefer running the built-in script directly:

```powershell
powershell -File "<skill-root>\radare2\scripts\recon.ps1" -TargetPath "sample.exe"
```

If you only need the minimal manual commands, use:

```powershell
rabin2 -I sample.exe
rabin2 -z sample.exe
rabin2 -i sample.exe
rabin2 -E sample.exe
```

Points of focus:

- File format, bitness, architecture, platform
- Entry point address
- Suspicious strings: URLs, paths, error messages, registry keys, command-line arguments
- Imported functions: network, file, crypto, process injection, registry operations

## Workflow 2: Interactive function analysis

```powershell
r2 sample.exe
```

Common commands once inside:

```text
aaa          # Run standard automated analysis
afl          # List functions
iz           # List strings
iS           # List sections
is           # List symbols
s entry0     # Seek to the entry point
pdf          # Disassemble the current function
VV           # Enter visual mode (if the terminal supports it)
q            # Quit
```

Notes:

- Prefer `aaa` by default; do not start with the heavier `aaaa`
- If the sample is very large or analysis is slow, you can analyze only around the entry point and then expand manually

## Workflow 3: Locating main / key logic

```text
afl~main
afl~sym.
iz~http
iz~error
axt <addr>
```

Approach:

- Start from `main`, the entry point, and string references
- Use `axt` to find who references a given string or address
- After finding a reference site, run `s <addr>` then `pdf`

## Workflow 4: Hex and memory viewing

```text
px 64        # Hex dump 64 bytes from the current address
pd 20        # Disassemble 20 instructions
psz          # Read the string at the current address
pxa          # Friendlier hex view
```

## Workflow 5: Binary patching

Use only when the user explicitly asks to modify the file:

```powershell
r2 -w sample.exe
```

For example, once inside:

```text
s 0x401000
wa nop
wa jmp 0x401050
wq
```

Common write operations:

- `wa <asm>`: write assembly
- `wx <hex>`: write raw bytes
- `wq`: write and quit

It is best to back up the original file before modifying. If the user has not mentioned a backup, remind them at least once.

## Workflow 6: Non-interactive automation

Suitable for one-shot output of results:

```powershell
r2 -A -q -c "afl;iz;ii;q" sample.exe
```

Common parameters:

- `-A`: run automated analysis at startup
- `-q`: quiet mode
- `-c`: execute a command string

If there are many commands, prefer organizing them into a readable order rather than stuffing them into an unmaintainable oversized string.

It is even better to first establish a baseline with the built-in reconnaissance script, then decide whether custom commands are needed.

## Common sub-tools

### `rabin2`

Suitable for static information extraction:

```powershell
rabin2 -I sample.exe   # Basic information
rabin2 -S sample.exe   # Sections
rabin2 -s sample.exe   # Symbols
rabin2 -i sample.exe   # Imports
rabin2 -E sample.exe   # Exports
rabin2 -z sample.exe   # Strings
rabin2 -zz sample.exe  # More detailed strings
```

### `rasm2`

Suitable for quick assembly/disassembly:

```powershell
rasm2 -d "9090"
rasm2 -a x86 -b 64 "xor eax, eax"
```

### `radiff2`

Suitable for comparing two binaries:

```powershell
radiff2 old.exe new.exe
radiff2 -C old.exe new.exe
```

### `rahash2`

Suitable for computing hashes:

```powershell
rahash2 -a md5 sample.exe
rahash2 -a sha256 sample.exe
```

### `rax2`

Suitable for base and encoding conversions:

```powershell
rax2 0x401000
rax2 4198400
rax2 -s hello
```

## Recommended analysis order

When facing an unknown sample, work in this order:

1. `rabin2 -I` to see the format, architecture, entry point
2. `rabin2 -z` to see strings
3. `rabin2 -i` to see imported functions
4. If interactive analysis is needed, enter `r2`
5. Run `aaa` first, then `afl` / `iz` / `pdf`
6. Gradually locate key functions via string references, import calls, and the entry-point flow

The advantage of this order is low noise, allowing you to establish a sense of direction as quickly as possible.

## Windows notes

- When paths contain spaces, commands must be quoted correctly
- If the current terminal cannot find `r2`, the `PATH` may have just been updated; open a new terminal and try again
- Some samples require administrator privileges to read, but do not proactively elevate privileges by default unless the user explicitly needs it
- Before dynamically debugging a suspicious sample, confirm the user's intent first to avoid mistakes

## Output style

When the user wants you to actually analyze the file rather than just provide commands:

- First provide a reconnaissance results summary
- Then list key evidence: strings, imports, functions, addresses
- Finally provide next-step suggestions or continue with deeper analysis

Do not just list commands without explaining why they are being used.

## Typical request examples

### Example 1: Analyze an exe

User: `Help me see what this exe does; radare2 is fine`

Handling approach:

1. First use `rabin2 -I/-z/-i`
2. Decide whether entering `r2` is needed
3. Use `aaa`, `afl`, `pdf` to dig into the entry point and key string references

### Example 2: Find where a string is used

User: `Which function triggers this error string`

Handling approach:

1. Use `iz~keyword` to find the string address
2. Use `axt <addr>` to find references
3. Jump to the reference site with `s <addr>`, then `pdf`

### Example 3: Change a jump

User: `Change this jne to je`

Handling approach:

1. First confirm the target address
2. Clearly state that you are entering write mode
3. Use `wa je <target>` or directly `wx`
4. Disassemble again after the modification to verify

## Practices to avoid

- Do not treat `radare2` as a tool with only the single `aaa` command
- Do not open user files in write mode without stating the risks
- Do not draw conclusions before doing basic reconnaissance
- Do not misdirect web JS reversing to this skill; that belongs to `reverse-engineering`

## References

- Command cheatsheet: `references/cheatsheet.md`
- Standard reconnaissance script: `scripts/recon.ps1`

---

## Routing context

**Upstream entry**: `skills/SKILL.md` (master control), `routing.md`
**Upstream alternative**: `ida-reverse/` (upgrade to IDA when decompilation/pseudocode is needed)
**Downstream exits**:
- Dynamic analysis needed → `reverse-engineering/tools-dynamic.md` (Frida/GDB)
- Deep decompilation needed → `ida-reverse/`
- After PAT finds interesting strings and cross-referencing is needed → `ida-reverse/` (IDA's xrefs are more powerful)

**Peer related modules**: `ida-reverse/` (complementary: r2 recon is fast, IDA decompiles deep)

---

## On-Demand Bootstrap

This skill's entry scripts are integrated with the unified bootstrap system. When radare2 is missing, the scripts will not fail outright; they will automatically attempt installation instead.

### Automation capability boundaries

| Tool | Auto-installable | Install method | Notes |
|------|-----------|---------|------|
| r2 | ✓ | GitHub Release ZIP (w64) | Automatically downloaded and extracted to `%USERPROFILE%\Tools\radare2\` |
| rabin2 | ✓ | Same as above (included in the radare2 release package) | — |
| rasm2 | ✓ | Same as above | — |
| radiff2 | ✓ | Same as above | — |
| rahash2 | ✓ | Same as above | — |
| rax2 | ✓ | Same as above | — |

### Bootstrap trigger points

- `scripts/recon.ps1`: automatically invokes `bootstrap-reverse.ps1` when `rabin2` or `r2` is missing

### When bootstrap fails

If automatic installation fails (no network connectivity, GitHub API rate limiting, etc.), the script raises a clear error with a manual installation link.

Manual installation: download `radare2-*-w64.zip` from https://github.com/radareorg/radare2/releases, extract it to `%USERPROFILE%\Tools\radare2\`, and ensure the `bin\` directory is on the PATH.


## Task completion self-check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than just reading it)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
