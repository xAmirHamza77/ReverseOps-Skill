---
name: ghidra-reverse
description: Use for free/open reverse engineering with Ghidra (headless or GUI), including decompile, cross-refs, and optional Ghidra MCP workflows when IDA is unavailable.
---

# Ghidra Reverse Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md`
2. `NOW`: Confirm that **Ghidra** is needed (no IDA / open-source preference / batch headless)
3. `NEXT`: Read `../tool-index.md` for the ghidra / ghidra-mcp paths
4. `NEXT`: If a tool is missing → bootstrap `ghidra-mcp` (if supported by the manifest) or install Ghidra following the manual steps
5. `ACT`: Import the sample → run auto-analysis → export decompilation of key functions

## Applicable scenarios

- Primary reversing entry point when no IDA license is available
- Batch headless analysis / decompilation in CI
- Automation with Ghidra scripts (Java/Python Jython/PyGhidra)
- Integration with `binary-diff` / `patch-diff-exploit` via ghidriff

## Division of labor with IDA

| Requirement | Preferred |
|------|------|
| Existing IDA MCP for deep analysis | `ida-reverse/` |
| Open source / batch / teaching | **This skill** |
| CLI-only quick reconnaissance | `radare2/` |

## Workflow

### 1. Project and auto-analysis

```text
□ Create a new Project → Import the file → Analyze (default analyzers)
□ Record the language/compiler identification results and the base address
□ Mark the entry point, export table, and string xrefs
```

### 2. Key functions

```text
□ Trace back from strings / imported APIs
□ Reconstruct the algorithm in the Decompile window
□ Rename functions/variables; write Plate comments
□ Hand off to Frida/GDB when dynamic analysis is needed (dynamic section of reverse-engineering)
```

### 3. Headless (batch)

```bash
# Example: the analyzeHeadless path varies by installation; MUST be taken from tool-index
analyzeHeadless /path/to/project Proj -import sample.bin -postScript ExportDecomp.py
```

### 4. MCP (if configured)

```text
□ Confirm the ghidra MCP port (commonly 8765; tool-index is authoritative)
□ Pull decompilation / xrefs through MCP tools; never guess the port
```

## Toolchain

| Tool | Purpose | Bootstrap |
|------|------|------|
| Ghidra | Main decompilation tool | Manual release / package manager |
| ghidra-mcp | AI bridge | bootstrap capability name `ghidra-mcp` |
| ghidriff | Patch diffing | See `patch-diff-exploit` |

## References

- `references/ghidra-cheatsheet.md`
- `../ida-reverse/` `../radare2/` `../binary-diff/`

## Routing context

**Upstream**: MASTER R22  
**Downstream**: Dynamic verification → Frida/GDB; exploitation → `pwn-chain`  
**Peer**: `ida-reverse` (commercial deep analysis)

## Task completion self-check

- [ ] Am I working from real Ghidra/tool-index paths?
- [ ] Did I annotate function addresses and renames?
- [ ] Are there reproducible steps?
- [ ] Checklist / journal?
