# 2026-07-14 Android ARM64 Self-Extracting Executable Source Recovery

## Scenario Classification

Binary Analysis / Android ARM64 / Self-Extracting Shell / Control Flow Flattening

## Target Overview

Performed read-only source code recovery on a user-owned local `.sh` delivery package, extracting multi-layer compressed payloads, analyzing ARM64 main binary and protective libraries, and recovering business text and high-level pseudo-source code without executing the target.

## Full Execution Chain

1. Performed read-only manifest, size, magic byte, and SHA-256 triage on the input directory without reading or recording plaintext credentials.
2. Identified the first layer as "Shell preamble + bzip2 trailing stream", pinpointing exact offsets via valid stream testing on `BZh`.
3. Saved preamble, compressed stream, and decompressed payload into an isolated artifact directory without executing payloads.
4. Identified the second layer as `__ARCHIVE_BELOW__` self-extracting script, safely unpacking tar.gz while rejecting absolute paths, `..`, symlinks, and device nodes.
5. Extracted Android AArch64 PIE main binary and AArch64 shared libraries; generated ELF headers, sections, symbols, imports, strings, and entrypoint disassembly using pyelftools/Capstone.
6. The protective library preserved readable C++ symbols; exported pseudo-code per function, confirming `/proc` scanning, `TracerPid`, three-stage process termination, and background thread behaviors.
7. Main function `main` symbol length significantly exceeded normal CFG recognition length, confirming indirect jump control flow flattening.
8. Statically solved jump table: `target = table_entry + fixed_delta`, enumerating all unique genuine basic blocks.
9. Scanned for isomorphic string decryptors, recognizing a "first N bytes cyclic XOR key + next M bytes ciphertext" layout.
10. Executed AArch64 constant propagation on each genuine basic block, resolving target and `x1` data sources for indirect decryptor calls to batch-recover business text.
11. Delivered full disassembly, function-by-function pseudo-code, high-level semantic source code, Mermaid flowcharts, and formal report.
12. Recalculated initial input hashes, confirming complete consistency before and after analysis.

## Lessons Learned & Pitfalls

| Problem | Cause | Solution | Time Spent |
|---|---|---|---|
| PowerShell running bootstrap intercepted by execution policy | System prohibited script execution | Used single `powershell.exe -ExecutionPolicy Bypass -File ...` without altering permanent policy | Low |
| radare2 bootstrap returned GitHub API 403 | API rate-limited / rejected, but releases page accessible | Retrieved official assets and SHA-256 from `releases/latest` 302 and `expanded_assets/<tag>`, uncompressed after verification | Medium |
| winget Rizin silent/user scope installation failed to land | Installer scope mismatch | Ceased retries after two failures, reverted to verified radare2 official ZIP | Low |
| `r2pm -U` hung indefinitely on git clone | Network speed / recursive repos | Terminated optional plugin path, continued with `pdc` + Capstone custom recovery | High |
| radare2 recognized only front part CFG for `main` | Indirect BR jump table caused normal analysis to stop at dispatcher | Enumerated genuine blocks per jump table formula, independent of default CFG | Medium |
| Direct string scanning revealed few paths | Text used independent cyclic XOR per string | Extracted key/output lengths from decryptor instructions, statically replayed algorithm | Medium |

## Toolchain Findings

- Python 3.13 standard library is sufficient for safely handling bzip2 and tar.gz; `tarfile.extractall` is less secure than per-member verification before writing out.
- pyelftools recovers ELF/DYNSYM/RELA; Capstone is suitable for ARM64 constant propagation and dedicated decryptor recognition.
- radare2 6.1.8 `pdc` is effective for un-obfuscated protective library functions, but provides only partial pseudo-code for indirect BR flattened main functions.
- GitHub API 403 does not mean official release page assets are inaccessible; release pages provide tags, asset names, and SHA-256 hashes.

## Critical Code / Commands

```python
# Generic cyclic XOR text layout
key = blob[:key_length]
encrypted = blob[key_length:key_length + output_length]
plain = bytes(value ^ key[index % key_length]
              for index, value in enumerate(encrypted))
```

```python
# Static solving for indirect jump tables
targets = {
    (entry + fixed_delta) & 0xFFFFFFFFFFFFFFFF
    for entry in jump_table_entries
}
```

```powershell
# Read-only retrieval of latest tag on API 403
curl.exe -sS -I '<official-release-url>/radareorg/radare2/releases/latest'
```

## Recommendations for Improvement

- Add `.sh` self-extracting pseudo-binary target type to routing to prevent misjudging as pure Shell review.
- Windows GitHub Release bootstrap should fall back to releases page / expanded_assets upon API 403, enforcing SHA-256 checksums.
- Add "ARM64 Jump Table + Cyclic XOR" generic recovery script template as a low-dependency fallback when IDA is absent.
- When tool calls exceed foreground window timeout, session ID MUST be retained and polled to avoid losing running downloads or export tasks.

## Reusable Patterns & Script Snippets

1. Scan for valid compression streams first rather than looking only for magic bytes; test full decompression in memory for each candidate offset.
2. Self-extracting archives should always be safely written out per-member, never executed directly, never trusting member paths.
3. When symbol table declared function length is far greater than CFG recognized length, prioritize inspecting BR/BLR indirect tables.
4. Isomorphic decryptors can be batch-identified via `add x16,x1,#key_len`, `cmp w16,#output_len`, `ldrb/eor/strb` instruction combinations.
5. Performing local constant propagation on flattened blocks is usually sufficient to recover indirect function targets and string source addresses without full prior de-flattening.

## Evolution Actions

- [x] Updated routing matrix
- [x] Updated tool-index
- [ ] Updated bootstrap-manifest
- [ ] Updated sub-skill documentation
- [x] Added pitfall records
- [ ] No update required

## Environment Info

- OS: Windows
- Tool Versions: Python 3.13; radare2 6.1.8; pyelftools; Capstone
- Target Platform/Version: Android ARM64, NDK r17 / Clang 6.0.2

## Sanitisation Checklist

- Recorded no software names, author names, real domains, real API endpoints, credentials, fixed signature material, business package names, or local user paths.
- Attached no sample files or sample hashes.
- Retained only public tool names, versions, and generic algorithm patterns.

## Index Synchronization

Added record to "Binary / Firmware / CTF" category in `_index.md` and updated statistics.

---
<!-- [Evolution Stats] Total Projects Completed: 8 | New Patterns Added: 2 | Toolchain Remediations: 1 -->
<!-- [Community Contribution] Ask user if they wish to submit PR to main repo upon completion. Process detailed in CONTRIBUTE-BACK.md -->
