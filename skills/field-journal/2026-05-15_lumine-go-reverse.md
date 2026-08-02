---
name: lumine-reverse-2026-05-15
description: Full reverse engineering recovery of Go 1.24.5 TLS fragmentation proxy lumine v0.9.1, including source code reconstruction of 7 packages
metadata:
  type: project
---

# lumine v0.9.1 — Go TLS Fragmentation Proxy Reverse Engineering

**Date**: 2026-05-15
**Target**: `lumine_v0.9.1_windows_amd64.exe` (PE32+, Go 1.24.5, 11.6 MB)
**Original Report**: `REVERSE_REPORT.md`

## Background

User requested restoring the binary back into readable Go source code. The target is a TLS anti-DPI proxy tool, with technique originating from Python [TlsFragment](https://github.com/maoist2009/TlsFragment).

## Process

1. **Toolchain Setup**: Python + Capstone disassembly, GoReSym symbol table recovery (1944 Go functions, 269 belonging to the project)
2. **Package Structure Identification**: Inferred 12 packages from GoReSym's `package.function` naming conventions
3. **Type Recovery**: Inferred JSON deserialization types from `config.json`, restored fields in combination with function references
4. **Source Code Reconstruction**: Authored readable Go code package by package, preserving logic rather than line-by-line decompilation
5. **Subpackage Completion**: dial (outbound binding), errors (error types), format (string utilities)

## Critical Findings

- Core anti-DPI mechanism: TLS record fragmentation + noise injection + wait for ACK + OOB + Fake TTL
- Policy engine: Domain Trie + IP Trie → Policy match
- Dependency `go-freelru` (LRU cache) for DNS/TTL caching
- Source repository `github.com/moi-si/lumine` returns 404, relying entirely on binary recovery

## Tools

| Tool | Purpose | Version |
|---|---|---|
| GoReSym | Go symbol recovery | v1.7.1 (Mandiant) |
| Capstone | Disassembly engine | latest |
| pefile | PE structure parsing | latest |

## Lessons Learned & Pitfalls

1. **Python3 Path Issue**: WindowsApps stub python3 does not support pip install capstone; explicit full CPython path required
2. **GoReSym Subprocess Path**: `~` does not automatically expand; requires `os.path.expanduser()`
3. **Tab/Space Mixing**: Automatically generated Python decompilation scripts had mixed tabs/spaces, causing Go source formatting errors; v3 resolved entirely with spaces
4. **Vendor-less GoReSym**: For Go 1.24.5 binaries lacking vendor symbols, GoReSym can still extract function names, but parameters and local variables cannot be recovered
5. **String Noise**: Large volumes of Go standard library string constants mixed in, requiring careful package-level filtering

## Artifacts

- `REVERSE_REPORT.md` — Complete reverse analysis report
- `reconstructed_src_v3/` — 7 Go source files, core engine + 3 subpackages
