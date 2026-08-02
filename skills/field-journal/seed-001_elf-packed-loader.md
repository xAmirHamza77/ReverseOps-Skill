# [Seed] ELF Self-Extracting Loader Reverse Engineering

## Scenario Classification
Binary Analysis

## Target Overview
Analyze an ARM64 ELF self-extracting loader disguised as a .sh script, reversing its decompression algorithm and payload injection process.

## Full Execution Chain

1. Use `file` command to confirm actual file type (ELF, not shell script)
2. Use `readelf -l` to view program headers → Found 3rd PHDR deliberately corrupted (padded with 0x0a)
3. Use `rabin2 -I` to obtain architecture (AArch64), entrypoint, and compiler information
4. Load into IDA/Ghidra → Analyze starting from entrypoint
5. Identified LZSS decompression loop (bitstream operations + sliding window copy-back)
6. Identified mmap → decompress → mprotect → jump injection process
7. Rewrote decompiler in Python to dump the payload
8. Analyzed payload contents (contained /proc/self/exe references, indicating a process injector)

## Lessons Learned & Pitfalls

| Problem | Cause | Solution | Time Spent |
|---------|-------|----------|------------|
| readelf error parsing file | 3rd PHDR deliberately padded with 0x0a | Ignore corrupted PHDR, examine only first 2 LOAD segments | 10min |
| IDA decompilation unreadable | Intensive ARM64 bitwise operations, Hex-Rays optimization poor | Switch to disassembly view for manual analysis | 30min |
| Decompressor Python implementation output error | pop_bit refill path return value wrong (adcs vs adds) | Compare carefully with assembly, refill returns bit31 of newly loaded word | 2h |
| Uncertain payload entrypoint offset | Meaning of entry_offset field in data table unclear | Traced `br mmap_base + 0x14` in loader function, confirmed entrypoint at +0x14 | 20min |

## Toolchain Findings

- `file` command is step one; never trust file extensions
- `rabin2 -I` is more fault-tolerant than `readelf` (can handle corrupted PHDRs)
- For ARM64 bit-manipulation intensive code, assembly view is better than decompilers
- Python struct module + custom decompressor script is the standard approach for analyzing custom compression

## Critical Code / Commands

```bash
# Confirm file type
file LinYuDriverLoader4.9.sh
# ELF 64-bit LSB executable, ARM aarch64

# View program headers
readelf -l binary 2>/dev/null | head -20

# Extract compressed data
dd if=binary bs=1 skip=$((0xa6a24)) count=1981 of=compressed.bin

# Calculate file offset
# vaddr 0x3d66bc → file_offset = 0x3d66bc - 0x330000 = 0xa66bc
```

```python
# LZSS Decompressor Core (Simplified)
def decompress(data):
    shift_reg = 0x80000000
    # ... Bitstream read + literal/match branch
```

## Recommendations for Improvement

- `elf-analysis.md` should include more signatures for "custom compression algorithm identification"
- ARM64 syscall tables should include cache maintenance instructions (dc cvau / ic ivau) descriptions
- Recommended to add a generic methodology for "How to rewrite assembly algorithms in Python"

## Reusable Patterns & Script Snippets

**Standard Pattern for Self-Extracting ELF Identification**:
```text
Entrypoint → Small initialization → Call decompression function → mmap(RW) → Decompress to mmap region → mprotect(RX) → Jump
```

**Generic Pattern for ARM64 Bitstream Reading**:
```text
lsl w4, w4, #1    # Shift left (extract MSB into carry)
cbz w4, refill    # If empty, load new 32-bit word from input
```

## Evolution Actions
- [x] Updated sub-skill documentation (Added to elf-analysis.md)
- [ ] No routing matrix update needed
- [ ] No bootstrap-manifest update needed

## Environment Info
- OS: Linux/Android ARM64 target
- Tool versions: IDA Pro / Ghidra + radare2
- Target platform: Android ARM64 (AArch64)

## Sanitisation Requirements
This entry is seed data based on public technical patterns and involves no real targets.

---
<!-- [Evolution Stats] Total Projects Completed: 1 | New Patterns Added: 2 | Toolchain Issues Fixed: 0 -->
<!-- [Community Contribution] Seed data, no PR needed -->
