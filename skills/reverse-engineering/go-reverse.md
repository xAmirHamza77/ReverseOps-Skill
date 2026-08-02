# Go Binary Reversing Guide

> Go-compiled binaries present unique challenges: static linking produces huge files, tens of thousands of functions, a special string format, and difficult symbol recovery after stripping.
> This document covers the toolchain, recovery techniques, and practical workflows.

---

## Recognizing Go Binaries

Quick ways to determine whether a binary was compiled by Go:

```bash
# String signatures
strings binary | grep -E "runtime\.|go\.buildid|GOROOT"

# rabin2 reconnaissance
rabin2 -z binary | grep -i "runtime"

# Abnormally large file size (statically linked runtime)
# Typical Hello World: C ~20KB, Go ~2MB
```

Common traits:
- Numerous functions with the `runtime.` prefix
- Contains a `go.buildid` section
- Contains `GOROOT` and `GOPATH` path strings
- 5000-50000+ functions (includes the entire runtime and standard library)

---

## Core Toolchain

### Symbol Recovery

| Tool | Purpose | Link |
|------|------|------|
| **GoReSym** | From Mandiant; parses Go symbol info (pclntab/moduledata) | https://github.com/mandiant/GoReSym |
| **GoResolver** | From Volexity; automatically deobfuscates Garble binaries via CFG similarity | https://github.com/volexity/GoResolver |
| **redress** | Analyzes stripped Go binaries, recovers types/interfaces/package structure | https://github.com/goretk/redress |
| **GoStringUngarbler** | From Google; specifically recovers Garble-obfuscated strings | https://github.com/mandiant/GoStringUngarbler |

### IDA Plugins

| Tool | Purpose | Link |
|------|------|------|
| **go_parser** | IDA plugin; parses moduledata/pclntab/type info | https://github.com/0xjiayu/go_parser |
| **IDAGolangHelper** | IDA script collection; parses Go type info | https://github.com/sibears/IDAGolangHelper |
| **AlphaGolang** | SentinelLabs IDAPython script collection | https://github.com/SentineLabs/AlphaGolang |
| **IDA 9.2+ native support** | Hex-Rays official Go decompilation improvements | https://hex-rays.com/blog/stop-guessing-and-start-going |

### Ghidra Plugins

| Tool | Purpose | Link |
|------|------|------|
| **Ghidra + GoReSym output** | Export symbols with GoReSym, then import into Ghidra | Used together |
| **golang_loader_assist** | Ghidra Go loader assist | Community script |

### Standalone Analysis Tools

| Tool | Purpose | Link |
|------|------|------|
| **gore** | Go reverse engineering library (underlies redress) | https://github.com/goretk/gore |
| **garble** | Go obfuscation tool (understand it to counter it) | https://github.com/burrowers/garble |

---

## Key Structures in Go Binaries

### pclntab (PC Line Table)

The most important structure in a Go binary, containing:
- All function name and address mappings
- Source file paths
- Line number information
- Stack frame sizes

Even when symbols are stripped, pclntab usually remains (the Go runtime depends on it).

```text
How to locate it:
1. Search for magic bytes: 0xFFFFFFF0 (Go 1.16+) or 0xFFFFFFFB (Go 1.18+)
2. Use GoReSym to locate it automatically
3. Use the go_parser IDA plugin to parse it automatically
```

### moduledata

Contains:
- pclntab pointers
- Type information tables
- itab (interface tables)
- Global variable information

### String Format

Go strings are not C-style null-terminated; they are `(pointer, length)` structures:

```text
C string:   "hello\0"
Go string:  struct { ptr *byte; len int } → ptr points to "hello" (no \0)
```

Because of this, IDA/Ghidra's default string recognition misses many Go strings.

**Solutions**:
- Use `go_parser` to automatically identify Go strings
- Use GoReSym to export the string list
- Manually: find `runtime.stringtable` or locate via cross-references

---

## Practical Workflows

### Scenario 1: Unstripped Go Binary

```text
1. GoReSym -t -d -p binary > symbols.json
   → Export all function names, types, source file paths
2. Load into IDA/Ghidra
3. Import GoReSym symbol information
4. Filter out runtime.* and standard-library functions; focus on user code
5. Start analysis from main.main
```

### Scenario 2: Stripped Go Binary

```text
1. GoReSym -t -d -p binary > symbols.json
   → Even when stripped, pclntab usually survives
2. If GoReSym fails → use redress
   redress -src binary    # Recover source file paths
   redress -pkg binary    # Recover package structure
   redress -type binary   # Recover type information
3. Load into IDA + go_parser plugin
4. Run go_parser for automatic recovery
5. Start from the recovered main.main
```

### Scenario 3: Garble-Obfuscated Go Binary

```text
Garble will:
- Randomize function names (main.main → main.a3f2b1c)
- Encrypt strings
- Remove file path information
- Obfuscate package names

Countermeasures:
1. GoResolver (CFG signature matching)
   → Recovers standard-library function names via control-flow graph similarity
2. GoStringUngarbler (string decryption)
   → Automatically identifies Garble's string-encryption pattern and decrypts
3. Dynamic analysis (Frida/dlv)
   → Hook runtime functions to observe actual behavior
4. Comparative analysis
   → Compile a Hello World with the same Go version and binary-diff the runtime portion
```

### Scenario 4: CGo Hybrid Compilation

```text
1. Identify CGo boundaries (_cgo_* functions)
2. Recover the Go part with go_parser
3. Analyze the C part with regular IDA analysis
4. Focus on bridge functions like _cgo_topofstack and crosscall2
```

---

## Common Commands Quick Reference

```bash
# GoReSym: export symbols
GoReSym -t -d -p binary > symbols.json
GoReSym -t -d -p binary -o ida_script.py  # Generate an IDA script

# redress: analyze stripped binaries
redress -src binary          # Source file paths
redress -pkg binary          # Package structure
redress -type binary         # Type information
redress -interface binary    # Interface information
redress -filepath binary     # Full file paths

# GoResolver: deobfuscate Garble
GoResolver -binary binary -output resolved.json

# GoStringUngarbler: decrypt Garble strings
GoStringUngarbler -i binary -o deobfuscated_binary

# Quickly determine the Go version
strings binary | grep "go1\."
GoReSym -p binary | grep "Version"
```

---

## Go Analysis Workflow in IDA

```text
1. Load the binary (select the correct architecture)
2. Wait for auto-analysis to finish
3. Run the go_parser plugin:
   - File → Script File → go_parser.py
   - or Edit → Plugins → Go Parser
4. The plugin automatically:
   - Parses pclntab
   - Recovers function names
   - Marks Go strings
   - Parses type information
5. Filter the view:
   - Hide runtime.* functions
   - Focus on main.* and third-party packages
6. Start reversing from main.main
```

---

## Common Pitfalls

| Pitfall | Description | Solution |
|------|------|------|
| Too many functions to review | Go static linking yields 5000-50000 functions | Filter by package name; only look at main.* and business packages |
| Incomplete string recognition | Go strings are not null-terminated | Recover with go_parser or GoReSym |
| Hard-to-read decompilation | Go's defer/goroutine/interface complicate pseudocode | IDA 9.2+ has improvements, or use dynamic analysis as an aid |
| Garble obfuscation | Function names/strings all randomized | GoResolver + GoStringUngarbler |
| Version differences | pclntab format differs across Go versions | GoReSym supports Go 1.2-1.23+ |
| CGo boundary | Go and C code mixed | Identify _cgo_* functions as the dividing line |

---

## Interoperating with Other Skills

| Need | Use |
|------|--------|
| Deep IDA analysis of Go binaries | `ida-reverse/` + go_parser plugin |
| Ghidra analysis (free) | Ghidra + GoReSym symbol import |
| Quick reconnaissance | `radare2/` — view strings with `rabin2 -z` |
| Dynamic hooking | Frida (hook runtime functions) or dlv (native Go debugger) |
| Cross-version comparison | `binary-diff/` — migrate symbols from an older version to a newer one |
| Garble deobfuscation | GoResolver + GoStringUngarbler |
