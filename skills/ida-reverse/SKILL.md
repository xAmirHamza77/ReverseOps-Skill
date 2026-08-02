---
name: ida-reverse
description: |
  IDA Pro reverse engineering assistance skill. Be sure to use this skill whenever the user mentions reverse engineering, decompilation, analyzing binary/PE/ELF/APK/DLL/SO files, cracking, finding passwords, vulnerability analysis, malware analysis, or firmware analysis, or needs to analyze exe/dll/so/elf/macho/sys files and similar.

  Ensure to use this skill when the user wants to analyze any binary file, regardless of whether they explicitly mention "IDA" or "reverse engineering". This includes requests like "take a look at this exe", "analyze this dll", "help me crack this", "find the password", "how do I register this software", etc.

  Use the bundled scripts (scripts/start.ps1, scripts/open.ps1) for deterministic server management and file opening — do NOT write ad-hoc PowerShell commands for these operations.
---

# IDA Pro Reverse Engineering Skill

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm that this skill's operations are authorized routine operations
2. `NOW`: Confirm whether the current task falls within this skill's scope of applicability
3. `NEXT`: Read `../tool-index.md` to verify tool availability and actual paths
4. `NEXT`: If tools are missing, invoke bootstrap; do not guess paths
5. `ACT`: Enter the first step of the "Workflow" and execute; do not stall in the confirmation state

## Known Issues and Lessons Learned (must read)

### Pitfalls encountered

1. **`idalib_open` cannot be called directly through the MCP of certain code AI clients**
   - The MCP client of certain code AI clients has a BUG in its output schema validation for `idalib_open`
   - Error: `Structured content does not match the tool's output schema`
   - **Solution**: Use the `scripts/open.ps1` script to call the HTTP API directly, bypassing the MCP validation layer
   - Once the file is opened, the database is bound to the shared context, and all other `idapro_*` tools can be used directly

2. **Files under `C:\Windows\System32\` cannot be opened due to permissions**
   - idalib cannot directly read files in the System32 directory
   - **Solution**: `open.ps1` automatically detects this and copies the file to a `temporary directory` before opening

3. **Server startup command blocks the conversation**
   - After `idalib-mcp` starts, it continuously outputs INFO logs to the console
   - **Solution**: Use `scripts/start.ps1` (starts silently in the background with `-WindowStyle Hidden`)
   - The script waits until the service is ready, then exits automatically without blocking the conversation

4. **MCP server names cannot contain hyphens**
   - Previously `ida-pro-mcp` was used as the server name, which could cause tool registration issues
   - **Current configuration**: server name `idapro`, tool prefix `idapro_*`

5. **Remote HTTP vs Local Stdio**
   - `type:"local"` (stdio) mode: `idalib_open` has the same schema validation problem
   - `type:"remote"` (HTTP) mode: you can open the file directly with the script first, then use the MCP tools
   - **Current approach**: Remote HTTP mode

6. **PR #389 fixed some of the schema issues**
   - Author mrexodia merged a fix in PR #389 following issue #388
   - It fixed the structuredContent schema in HTTP mode, but client-side validation in certain code AI clients still has issues
   - The latest `main` branch version is installed

7. **idalib timeouts leave orphaned worker processes holding lock files**
   - After the first `open.ps1` times out, idalib's python worker subprocess becomes an orphan and keeps holding onto `.id0`/`.id1`/`.nam`
   - Any subsequent tool, or manually dragging the file into the IDA GUI, reports "insufficient permissions"
   - **Solution**: `start.ps1` now uses `taskkill /F /T` to kill the process tree, leaving no orphans
   - **Fallback**: `open.ps1` has automatic degradation — when it detects that the old database is locked, it automatically copies the file to Temp with a GUID prefix

8. **Opening with auto-analysis looks like it has hung**
   - `idalib_open(run_auto_analysis=true)` may not return a response for a long time, but the backend is actually still opening and analyzing
   - What the user previously saw was "PowerShell producing no output", which is easily misjudged as a hung script
   - **Current solution**: `open.ps1` adds `-TimeoutSeconds` and switches to a background request + foreground polling + periodic progress output
   - When polling finds the session is ready, it returns early with `OK:filename:session_id`; on timeout it returns `ERR:open_timeout_xxs`

### Workflow principles

| Step | What to do | What to use |
|------|------------|-------------|
| 1 | Ensure the HTTP server is running | `scripts/start.ps1` (no arguments) |
| 2 | Open the target binary file | `scripts/open.ps1 -Path "xxx.exe"` |
| 3 | Use all 72 MCP tools | Call the `idapro_*` tools directly |
| 4 | Analysis complete | Tools become available automatically |

## Script Resources

### start.ps1 — Start the MCP HTTP server

Path: `scripts/start.ps1`

- Kills the old process tree with `taskkill /F /T` (cleans up worker subprocesses as well) → starts `idalib-mcp` in the background → waits for readiness (up to 15 seconds)
- Outputs `OK:72` on success, `ERR:timeout` on failure
- The server runs in the background and does not block the conversation

**Usage**:
```
powershell -File "<skill-root>\ida-reverse\scripts\start.ps1"
```

### open.ps1 — Open a binary file

Path: `scripts/open.ps1`

- Calls `idalib_open` directly via the HTTP API, bypassing MCP schema validation
- Automatically detects System32 paths and copies the file to a temporary directory
- Automatically cleans up old database files with the same name (`.id0`/`.id1`/`.nam`/`.til`/`.i64`)
- Automatic degradation when the old database is locked: copies to Temp with a GUID prefix and opens without erroring
- Runs the open request in the background to avoid the script becoming unresponsive during long synchronous waits
- Supports `-TimeoutSeconds`; on timeout returns `ERR:open_timeout_xxs` instead of hanging forever
- Outputs `INFO:opening:elapsed/timeout-seconds` every 10 seconds so you can tell analysis is still in progress
- Outputs `OK:filename:session_id` on success, with a `(temp copy)` marker when degraded
- Automatically retries with a Temp copy on failure

**Usage**:
```
powershell -File "<skill-root>\ida-reverse\scripts\open.ps1" -Path "C:\path\to\file.exe"
```

**Optional parameters**:
```
# Specify a SessionId
powershell -File "scripts\open.ps1" -Path "file.exe" -SessionId "my_session"

# Skip auto-analysis (recommended for large files)
powershell -File "scripts\open.ps1" -Path "large.exe" -NoAutoAnalysis

# Set a timeout to avoid long periods without a response when auto-analysis is enabled
powershell -File "scripts\open.ps1" -Path "file.exe" -TimeoutSeconds 600
```

**Output conventions**:
```
# Analysis in progress (printed every 10 seconds)
INFO:opening:11/600s

# Opened successfully
OK:sample.exe:abcd1234

# Opened successfully, but degraded to a Temp copy due to lock files
OK:1234abcd-sample.exe:abcd1234 (temp copy)

# Timeout limit reached
ERR:open_timeout_600s
```

**Measured results**:
- `Snipaste.exe` with auto-analysis took about `324s` to return success in testing — this is "analysis taking a long time", not "script deadlock"
- Therefore, when dealing with GUI programs or more complex samples, explicitly setting `-TimeoutSeconds 600` is recommended

## Core Tool List

### Survey analysis (first step)
- `idapro_survey_binary(detail_level="minimal")` — Quick overview: function count, strings, segments, entry point, import categories (crypto/network/file IO)
- `idapro_list_funcs(queries)` — List functions (paginated, filter by name)
- `idapro_list_globals(queries)` — List global variables
- `idapro_entity_query(kind, filter)` — Unified query: functions/globals/imports/strings/names

### Decompilation and disassembly
- `idapro_decompile(addr)` — Decompile to pseudocode
- `idapro_disasm(addr, max_instructions=N)` — Disassemble
- `idapro_analyze_function(addr, include_asm=false)` — Comprehensive analysis (pseudocode + strings + constants + callers + callees + blocks)
- `idapro_func_profile(queries)` — Function summary metrics

### Cross-references and data flow
- `idapro_xrefs_to(addrs)` — Find what references a target address
- `idapro_xref_query(addr, direction)` — Advanced xref query (direction/type filtering)
- `idapro_callees(addrs)` — List of subfunctions
- `idapro_callgraph(roots, max_depth)` — Call graph
- `idapro_trace_data_flow(addr, direction, max_depth)` — Data flow tracing (forward/backward)

### Search
- `idapro_find_regex(pattern, limit)` — Regex string search
- `idapro_search_text(pattern)` — Search text in the disassembly listing
- `idapro_find_bytes(patterns, limit)` — Byte pattern search (supports ?? wildcards)
- `idapro_find(type, targets)` — Advanced search (immediates/strings/references)

### Memory and data
- `idapro_get_bytes(addrs)` — Read raw bytes
- `idapro_get_string(addrs)` — Read strings
- `idapro_get_int(queries)` — Read integer values
- `idapro_get_global_value(queries)` — Read global variable values
- `idapro_read_struct(queries)` — Read struct field values
- `idapro_search_structs(filter)` — Search structs

### Modification operations
- `idapro_set_comments(items)` — Add comments (synced in both directions between disassembly and decompilation)
- `idapro_append_comments(items)` — Append comments
- `idapro_rename(batch)` — Batch rename (functions/globals/locals/stack variables)
- `idapro_patch_asm(items)` — Patch assembly instructions
- `idapro_patch(patches)` — Patch bytes
- `idapro_define_func(items)` — Define a function
- `idapro_undefine(items)` — Undefine
- `idapro_define_code(items)` — Convert bytes to code

### Type system
- `idapro_declare_type(decls)` — Declare C structs/enums/unions
- `idapro_set_type(edits)` — Apply types to functions/globals/locals
- `idapro_infer_types(addrs)` — Infer types
- `idapro_type_query(queries)` — Query declared types
- `idapro_type_inspect(queries)` — View type details

### Stack frames
- `idapro_stack_frame(addrs)` — View stack frame variables
- `idapro_declare_stack(items)` — Declare stack variables
- `idapro_delete_stack(items)` — Delete stack variables

### Signatures
- `idapro_make_signature(addrs)` — Generate a unique byte signature for an address
- `idapro_make_signature_for_function(addrs)` — Generate a signature for a function
- `idapro_find_xref_signatures(addrs)` — Generate signatures for code referencing an address

### Debugger (requires ?ext=dbg)
- `idapro_open_file(file_path)` — Open a file in a GUI IDA instance
- Debugger tools are hidden by default and can be enabled via the URL parameter `?ext=dbg`

### Session management
- `idapro_idalib_open(input_path)` — ⚠️ Has a schema validation BUG; use the `open.ps1` script instead
- `idapro_idalib_list()` — List all sessions
- `idapro_idalib_current()` — The session bound to the current context
- `idapro_idalib_switch(session_id)` — Switch to another session
- `idapro_idalib_close(session_id)` — Close a session
- `idapro_idalib_save(path)` — Save the database
- `idapro_idalib_health(session_id)` — Check worker health status

### Miscellaneous
- `idapro_int_convert(inputs)` — Base conversion (**must use this; do not do base conversions yourself!**)
- `idapro_export_funcs(addrs, format)` — Export functions (json/c_header/prototypes)
- `idapro_py_eval(code)` — Execute Python in the IDA context
- `idapro_server_health()` — Server health check
- `idapro_server_warmup()` — Warm up subsystems (string cache, Hex-Rays, etc.)

## Complete Reverse Engineering Workflow

### Step 1: Start the server
Ensure the HTTP service is running in the background.
```
powershell -File "scripts/start.ps1"
```
Output of `OK:72` indicates readiness.

### Step 2: Open the file
```
powershell -File "scripts/open.ps1" -Path "C:\TARGET.exe" -TimeoutSeconds 600
```
Output of `OK:filename:session_id` indicates success (a trailing `(temp copy)` means it automatically degraded to a temporary copy).
If analysis takes a long time, `INFO:opening:...` is printed periodically; if the timeout is reached, `ERR:open_timeout_xxs` is printed.

### Step 3: Global overview
```
idapro_survey_binary(detail_level="minimal")
```
Pay attention to:
- Architecture (x86/x64/ARM)
- Entry point (main/WinMain/DllMain)
- Interesting strings (URLs, paths, error messages)
- Import categories (crypto functions? network APIs? file operations?)
- Hot functions (functions with high xref counts are usually key logic)

### Step 4: Dive into key functions
```
idapro_analyze_function(addr="key_function_name")
```
or:
```
idapro_decompile(addr="function_name")
idapro_disasm(addr="function_name", max_instructions=50)
```

### Step 5: Data flow and cross-references
```
idapro_xrefs_to(addrs="key_address/string")
idapro_callgraph(roots=["key_function"], max_depth=3)
idapro_trace_data_flow(addr="key_address", direction="backward", max_depth=5)
```

### Step 6: Record and refine
```
idapro_set_comments(items=[{"addr": "0x140001000", "comment": "your understanding"}])
idapro_rename(batch={"func": [{"addr": "function_address", "name": "meaningful_name"}]})
```

### Step 7: Output the report
After analysis is complete, generate a `report.md` documenting findings and steps.

## Prompt Engineering Guidelines

1. **Do not do base conversions manually** — Any time you need to convert numbers, use `idapro_int_convert`
2. **Survey first, then go deep** — Look at the overview before targeted analysis
3. **Keep adding comments and renaming** — Continuously update function and variable names during analysis to improve the accuracy of subsequent analysis
4. **Follow cross-references** — When you find interesting data/strings, use `xrefs_to` to see what references them
5. **When you encounter obfuscated code** — Do preprocessing first: string decryption, import hash resolution, control-flow flattening removal, etc.
6. **C++ STL code** — Use FLIRT/Lumina to identify library functions before analyzing business logic
7. **Do not brute force** — Derive the solution from the disassembly, using simple Python to assist with calculations
8. **When you hit "No database bound"** — No binary file has been opened yet; run `open.ps1` first
9. **When you hit "Failed to open database"** — The old database file is probably locked; `open.ps1` automatically degrades to a Temp copy (output contains the `(temp copy)` marker)
10. **When opening GUI/complex samples with auto-analysis** — Add `-TimeoutSeconds 600` by default; do not misjudge a long stretch of `INFO:opening:...` as a hung script

---

## Routing Context

**Upstream entry**: `skills/SKILL.md` (master control), `routing.md`
**Upstream alternatives**: `radare2/` (if you do not want to start IDA, you can do quick reconnaissance with r2 first)
**Downstream exits**:
- Need Frida dynamic verification → `reverse-engineering/tools-dynamic.md`
- Need symbolic execution/angr → `reverse-engineering/tools-dynamic.md`
- Need general reverse engineering methodology → `reverse-engineering/SKILL.md`

**Sibling related modules**: `radare2/` (alternative when IDA is unavailable)

---

## On-Demand Bootstrap

This skill's entry scripts are integrated into the unified bootstrap system.

### Automation capability boundaries

| Tool | Auto-installable | Install method | Notes |
|------|------------------|----------------|-------|
| idalib-mcp | ✓ | pip install (from GitHub) | Automatically installed when missing by `start.ps1` |
| IDA Pro itself | ✗ | Commercial software, manual install required | Set the `IDADIR` environment variable to the install directory |

### Installation steps (verified)

```cmd
# 1. Set the IDA path (replace with your actual IDA install directory)
setx IDADIR "<your IDA install directory>"

# 2. Install ida-pro-mcp from GitHub (the ida-mcp on PyPI is a different project — do not install the wrong one!)
pip install git+https://github.com/mrexodia/ida-pro-mcp.git

# 3. Install the IDA plugin (choose Streamable HTTP + Global + select all clients)
ida-pro-mcp --install

# 4. Restart IDA Pro and open the target file
# The plugin automatically listens on 127.0.0.1:13337

# 5. Verify
ida-pro-mcp --config
```

> ⚠️ **Note**: The `ida-mcp` package on PyPI (author jtsylve) is a different project and is not what we need.
> You must install `mrexodia/ida-pro-mcp` from GitHub.

### Bootstrap trigger points

- `scripts/start.ps1`: automatically invokes `bootstrap-reverse.ps1` when `idalib-mcp` is missing
- MCP registration: bootstrap automatically writes `idapro` into the Claude MCP configuration

### Prerequisites

- IDA Pro is installed and the `IDADIR` environment variable is set (or the default path in the script is correct)
- Python is installed (idalib-mcp depends on Python)


## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than only reading)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
