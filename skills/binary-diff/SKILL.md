---
name: binary-diff
description: |
  Cross-version symbol migration and binary diffing. Use this when you have symbols/reverse engineering results from an old version and need to quickly migrate them to a new version.
  Applicable scenarios: kernel missing PDB with derivation from old-version symbols, batch-migrating function names after a program update, quickly locating new offsets after an application update.
  Core method: use an LLM for structured differential comparison with programmatic input/output — extremely low cost (200 functions ~1 yuan).
  Trigger keywords: symbol migration, bindiff, cross-version, missing PDB, function offset migration, symbol migration, binary diff, version comparison.
---

# Cross-Version Symbol Migration (Binary Diff)

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm that this skill's operations are authorized routine operations
2. `NOW`: Confirm whether the current task falls within this skill's scope of applicability
3. `NEXT`: Read `../tool-index.md` to verify tool availability and actual paths
4. `NEXT`: If tools are missing, invoke bootstrap; do not guess paths
5. `ACT`: Enter the first step of the "Workflow" and execute; do not stall in the confirmation state

## Scope of Applicability

Use this skill when the task falls into one of the following scenarios:

1. **Kernel/driver missing PDB** — You have symbols for an old ntoskrnl.exe, the new PDB has been pulled by Microsoft, and you need to derive new-version non-exported function addresses from old-version symbols
2. **Symbol migration after a program update** — You previously reverse engineered a program, the program was updated, and instead of reversing it all over again, you want to batch-migrate the old results
3. **Protection mechanism update** — The old version has complete reverse engineering results, and you need to quickly locate the new offsets of the same functions
4. **Any binary comparison scenario involving "old version with symbols + new version without symbols"**

### Division of labor with other skills

| Scenario | What to use |
|----------|-------------|
| Reverse engineering a binary from scratch | `ida-reverse/` or `radare2/` |
| Have old-version results, migrate to new version | **This skill** |
| Comparing two completely different binaries | BinDiff / Diaphora (traditional tools) |

### Core advantages

Compared with traditional approaches:

| Approach | Cost for 200 functions | Time | Accuracy |
|----------|------------------------|------|----------|
| Manual comparison with two IDA windows open | Free but draining | Several hours | High |
| BinDiff automatic matching | Free | Fast | Medium (fails with large structural changes) |
| Fully delegated to an Agent (CC/Codex) | 50-100 yuan | Slow | High |
| **This skill (LLM batch comparison)** | **~1 yuan** | **~10 sec/function** | **High** |

## Core Principle

```text
Old-version function (with symbols)   New-version same function (no symbols)
    ↓                              ↓
Export disassembly + pseudocode    Export disassembly + pseudocode
    ↓                              ↓
    └──────── LLM structured comparison ────────┘
                    ↓
         Output YAML (symbol mapping table)
                    ↓
         Programmatic parsing → batch apply to the new IDB
```

Key points:
- The prompt is a fixed template, populated programmatically
- Input/output formats are fixed and parsed programmatically
- The LLM is only responsible for the single step of "look at two pieces of code and find the correspondence"
- Time cost and token cost are extremely low

## Prompt Template

### Standard comparison prompt

```text
I have disassembly outputs and procedure code of the same function.

This is the function for reference:

**Disassembly for Reference**
```c
{disasm_for_reference}
```

**Procedure code for Reference**
```c
{procedure_for_reference}
```

This is the function you need to reverse-engineering:

**Disassembly to reverse-engineering**
```c
{disasm_code}
```

**Procedure code to reverse-engineering**
```c
{procedure}
```

What you need to do is to collect all references to "{symbol_name_list}" in the function you need to reverse-engineering and output those references as YAML.

Example:
```yaml
found_vcall: # This is for indirect call to virtual function or virtual function pointer fetching.
  - insn_va: '0x180777700' # Always be the instruction with displacement offset
    insn_disasm: call [rax+68h] # Always be the instruction with displacement offset
    vfunc_offset: '0x68'
    func_name: ILoopMode_OnLoopActivate
  - insn_va: '0x180777778' # Always be the instruction with displacement offset
    insn_disasm: mov rax, [rax+80h] # Always be the instruction with displacement offset
    vfunc_offset: '0x80'
    func_name: INetworkMessages_GetNetworkGroupCount

found_call: # This is for direct call to non-virtual regular function.
  - insn_va: '0x180888800'
    insn_disasm: call sub_180999900
    func_name: CLoopMode_RegisterEventMapInternal
  - insn_va: '0x180888880'
    insn_disasm: call sub_180555500
    func_name: CLoopMode_SetSystemState

found_funcptr: # This is for non-virtual regular function pointer.
  - insn_va: '0x180666600' # Must load/reference the function pointer target address
    insn_disasm: lea rdx, sub_15BC910 # Must load/reference the function pointer target address
    funcptr_name: CLoopMode_OnClientPollNetworking

found_gv: # This is for reference to global variable.
  - insn_va: '0x180444400'
    insn_disasm: mov rcx, cs:qword_180666600 # Must load/reference the global variable
    gv_name: g_pNetworkMessages
  - insn_va: '0x180333300'
    insn_disasm: lea rax, unk_180222200 # Must load/reference the global variable
    gv_name: s_EventManager

found_struct_offset: # This is for reference to struct offset. NOTE THAT virtual function pointer should not be here! virtual function pointer should ALWAYS be in found_vcall !
  - insn_va: '0x1801BA12A' # Always be the instruction with displacement offset
    insn_disasm: mov rcx, [r14+58h] # Always be the instruction with displacement offset
    offset: '0x58'
    size: 8
    struct_name: CResourceService
    member_name: m_pEntitySystem
```

If nothing found, output an empty YAML. DO NOT output anything other than the desired YAML. DO NOT collect unrelated symbols.
```

### Variable descriptions

| Variable | Source | Description |
|----------|--------|-------------|
| `{disasm_for_reference}` | Old-version IDA export | Disassembly with symbols |
| `{procedure_for_reference}` | Old-version IDA export | Pseudocode with symbols |
| `{disasm_code}` | New-version IDA export | Disassembly without symbols |
| `{procedure}` | New-version IDA export | Pseudocode without symbols |
| `{symbol_name_list}` | Extracted from old version | List of symbols to locate in the new version |

## Workflow

### Complete process

```text
Step 1: Prepare data
  - Load the old-version binary into IDA (with PDB/symbols)
  - Load the new-version binary into IDA (no symbols)
  - Find anchor functions that are identical in both versions (exported functions, string references, etc.)

Step 2: Batch export
  - From the old version, export: the anchor functions' disassembly + pseudocode (with symbol names)
  - From the new version, export: the same anchor functions' disassembly + pseudocode (without symbol names)

Step 3: LLM comparison
  - Populate the prompt template with data
  - Call the LLM API (recommended: deepseek is cheap at scale; switch to gpt for very large functions)
  - Parse the returned YAML

Step 4: Apply results
  - Batch-apply the symbol mappings from the YAML to the new IDB
  - Use idapro_rename or an IDAPython script for batch renaming

Step 5: Iterate
  - The functions migrated in the first round become new anchors
  - Enter these functions and continue comparing their internal calls
  - Repeat until all target functions are covered
```

### Anchor selection strategy

| Anchor type | Reliability | Description |
|-------------|-------------|-------------|
| Exported functions | Highest | Names unchanged, addresses may change |
| String references | High | String content unchanged, reference locations may change |
| Constants/magic numbers | Medium | Characteristic values unchanged |
| Code patterns | Medium | Similar function structure, but all addresses changed |

### Batch processing recommendations

- Compare 1 function at a time (avoid context explosion)
- Medium functions (<200 lines): use deepseek
- Very large functions (>500 lines): switch to gpt-4o or claude
- Concurrent calls to increase speed (10-20 concurrent)
- Cache results to avoid duplicate calls

## Output Format

### The 5 symbol types in YAML output

| Type | Meaning | Key fields |
|------|---------|------------|
| `found_vcall` | Virtual function call (indirect call) | `vfunc_offset`, `func_name` |
| `found_call` | Direct function call | `insn_va`, `func_name` |
| `found_funcptr` | Function pointer reference | `insn_va`, `funcptr_name` |
| `found_gv` | Global variable reference | `insn_va`, `gv_name` |
| `found_struct_offset` | Struct offset reference | `offset`, `struct_name`, `member_name` |

### Application actions after parsing

```text
found_call → idapro_rename(addr=call_target, name=func_name)
found_vcall → idapro_set_comments(addr=insn_va, comment="vcall: {func_name} @ +{offset}")
found_funcptr → idapro_rename(addr=funcptr_target, name=funcptr_name)
found_gv → idapro_rename(addr=gv_addr, name=gv_name)
found_struct_offset → idapro_set_comments(addr=insn_va, comment="{struct_name}.{member_name}")
```

## Typical Scenario Examples

### Scenario 1: ntoskrnl.exe missing PDB

```text
Available: ntoskrnl.exe 10.0.26100.2000 + complete PDB
Target: ntoskrnl.exe 10.0.26100.2605 (PDB pulled)
Requirement: locate the new address of PspSetCreateProcessNotifyRoutine

Steps:
1. Load both versions into IDA
2. Find the exported function PsSetCreateProcessNotifyRoutine (present in both versions)
3. In the old version, it calls PspSetCreateProcessNotifyRoutine (with symbol)
4. In the new version, it calls sub_140822108 (no symbol)
5. The LLM immediately sees: sub_140822108 = PspSetCreateProcessNotifyRoutine
6. Batch apply
```

### Scenario 2: Migration after an application update

```text
Available: complete reverse engineering results for target.exe v1.0 (200+ functions named)
Target: target.exe v1.1 (all symbols lost)
Requirement: batch-migrate 200 function names

Steps:
1. Export disassembly + pseudocode of all named functions from the old version
2. Find corresponding anchors in the new version via exported functions/strings
3. Batch-call the LLM for comparison
4. Parse the YAML and batch rename
5. Iterate deeper
```

## LLM Selection Recommendations

| Model | Suitable for | Cost | Speed |
|-------|--------------|------|-------|
| DeepSeek V3 | Small/medium functions (<200 lines), batch processing | Extremely low | Fast |
| GPT-4o | Very large functions, complex control flow | Medium | Fast |
| Claude Sonnet | Medium/large functions requiring reasoning | Medium | Fast |
| Claude Opus | Extremely complex functions requiring deep understanding | High | Slow |

Recommended strategy: default to DeepSeek; automatically upgrade when hitting context limits or inaccurate results.

## Precautions

- **Do not dump the entire binary to the LLM** — Compare only one function at a time
- **Anchors must be reliable** — If the anchor itself is matched wrong, everything downstream is wasted
- **Results need manual spot-checking** — LLMs are not 100% accurate; verify key symbols
- **Cache intermediate results** — Avoid wasting tokens on duplicate calls
- **Mind the context limit** — Very large functions (>1000 lines of disassembly) need to be split or use a large-context model

---

## On-Demand Bootstrap

### Tool dependencies

| Tool | Purpose | Auto-installable |
|------|---------|------------------|
| IDA Pro | Export disassembly/pseudocode | ✗ (commercial software) |
| Python | Script execution, API calls | ✓ |
| PyYAML | Parse YAML returned by the LLM | ✓ (pip install pyyaml) |
| LLM API | Perform comparison | API key required |

### Notes

The core of this skill does not depend on heavy tool installations; it mainly relies on:
- IDA Pro already available (managed via the `ida-reverse/` skill)
- Python + requests/httpx (to call the API)
- An LLM API endpoint

---

## Routing Context

**Upstream entry**: `skills/SKILL.md` (master control), `routing.md`
**Trigger condition**: You have old-version symbols/reverse engineering results that need migrating to a new version
**Downstream exits**:
- Need to open binaries first → `ida-reverse/`
- Need quick reconnaissance to confirm version differences → `radare2/`

**Sibling related modules**: `ida-reverse/` (both data export and symbol application go through IDA)


## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than only reading)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
