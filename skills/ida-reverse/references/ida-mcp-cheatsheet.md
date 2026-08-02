# IDA Pro MCP Tool Cheat Sheet

> 72 MCP tools organized by function, with common parameters and typical usage.
> Server name: `idapro`, tool prefix: `idapro_*`, runs in HTTP mode.

---

## Startup and Session Management

### Starting the server

```powershell
# Start the MCP HTTP server (background, silent)
powershell -File "scripts/start.ps1"
# Output of OK:72 indicates readiness

# Open the target file (bypasses schema validation)
powershell -File "scripts/open.ps1" -Path "C:\target.exe"
# Output: OK:filename:session_id

# Add a timeout for large files / GUI programs
powershell -File "scripts/open.ps1" -Path "C:\big.exe" -TimeoutSeconds 600

# Skip auto-analysis (fast open)
powershell -File "scripts/open.ps1" -Path "C:\huge.sys" -NoAutoAnalysis
```

### Session tools

| Tool | Purpose | Example |
|------|---------|---------|
| `idapro_idalib_list()` | List all sessions | — |
| `idapro_idalib_current()` | Currently bound session | — |
| `idapro_idalib_switch(session_id)` | Switch sessions | When comparing multiple files |
| `idapro_idalib_close(session_id)` | Close a session | Free resources |
| `idapro_idalib_save(path)` | Save the database | Save analysis progress |
| `idapro_idalib_health(session_id)` | Check worker status | Troubleshoot hangs |
| `idapro_server_health()` | Server health check | — |
| `idapro_server_warmup()` | Warm up subsystems | Before first use |

---

## Step 1: Global Overview

### survey_binary — Quick overview

```
idapro_survey_binary(detail_level="minimal")
```

Returns:
- Architecture (x86/x64/ARM/MIPS)
- Entry point
- Total function count
- String statistics
- Segment information
- Import categories (crypto/network/file IO/registry)
- Hot functions with high xref counts

**detail_level options**:
- `"minimal"` — Quick overview (recommended first choice)
- `"standard"` — Includes more detail
- `"full"` — Complete information

### Function list

```
# List all functions (paginated)
idapro_list_funcs(queries=[{"offset": 0, "limit": 50}])

# Filter by name
idapro_list_funcs(queries=[{"filter": "crypt", "offset": 0, "limit": 20}])
idapro_list_funcs(queries=[{"filter": "main", "offset": 0, "limit": 10}])
```

### Unified query

```
# Query imported functions
idapro_entity_query(kind="imports", filter="Create")

# Query strings
idapro_entity_query(kind="strings", filter="http")

# Query all named symbols
idapro_entity_query(kind="names", filter="")
```

---

## Decompilation and Disassembly

### Decompilation (pseudocode)

```
# By function name
idapro_decompile(addr="main")
idapro_decompile(addr="sub_140001000")

# By address
idapro_decompile(addr="0x140001000")
```

### Disassembly

```
# Default instruction count
idapro_disasm(addr="main")

# Specify instruction count
idapro_disasm(addr="0x401000", max_instructions=100)
```

### Comprehensive analysis (recommended)

```
# Get everything in one call: pseudocode + strings + constants + callers + callees + basic blocks
idapro_analyze_function(addr="main", include_asm=false)

# Include assembly
idapro_analyze_function(addr="sub_401000", include_asm=true)
```

### Function profiles

```
# Batch-fetch function metrics (size, block count, xref count)
idapro_func_profile(queries=["main", "sub_401000", "sub_402000"])
```

---

## Cross-References and Call Graphs

### What references the target

```
# See who calls a function
idapro_xrefs_to(addrs=["sub_401000"])

# See who references a string/data
idapro_xrefs_to(addrs=["0x404000"])

# Batch query
idapro_xrefs_to(addrs=["CreateFileW", "ReadFile", "WriteFile"])
```

### Advanced xref query

```
# Specify direction and type
idapro_xref_query(addr="0x401000", direction="to")    # who references me
idapro_xref_query(addr="0x401000", direction="from")  # what I reference
```

### Callee list

```
idapro_callees(addrs=["main"])
```

### Call graph

```
# Start from main, depth 3
idapro_callgraph(roots=["main"], max_depth=3)

# Multiple starting points
idapro_callgraph(roots=["sub_401000", "sub_402000"], max_depth=2)
```

### Data flow tracing

```
# Backward trace: where does this value come from
idapro_trace_data_flow(addr="0x401050", direction="backward", max_depth=5)

# Forward trace: where does this value flow to
idapro_trace_data_flow(addr="0x401050", direction="forward", max_depth=5)
```

---

## Search

### String search (regex)

```
# Search for URLs
idapro_find_regex(pattern="https?://", limit=20)

# Search for file paths
idapro_find_regex(pattern="C:\\\\", limit=20)

# Search for error messages
idapro_find_regex(pattern="error|fail|invalid", limit=30)

# Search for key/password-related strings
idapro_find_regex(pattern="key|password|secret|token", limit=20)
```

### Disassembly text search

```
# Search within the disassembly listing
idapro_search_text(pattern="call    sub_")
idapro_search_text(pattern="xor     eax, eax")
```

### Byte pattern search

```
# Exact bytes
idapro_find_bytes(patterns=["48 8B 05"], limit=10)

# With wildcards
idapro_find_bytes(patterns=["48 89 ?? 24 ??"], limit=10)

# Multiple patterns
idapro_find_bytes(patterns=["CC CC CC CC", "90 90 90 90"], limit=5)
```

### Advanced search

```
# Search for immediates
idapro_find(type="immediate", targets=["0xDEADBEEF"])

# Search for string references
idapro_find(type="string", targets=["password"])
```

---

## Memory and Data Reading

### Read raw bytes

```
idapro_get_bytes(addrs=[{"addr": "0x401000", "size": 64}])
```

### Read strings

```
idapro_get_string(addrs=["0x404000", "0x404100"])
```

### Read integers

```
idapro_get_int(queries=[{"addr": "0x405000", "size": 4}])
```

### Read global variables

```
idapro_get_global_value(queries=["g_flag", "g_key_size"])
```

### Read structs

```
idapro_read_struct(queries=[{"addr": "0x405000", "type": "HEADER"}])
```

### Search structs

```
idapro_search_structs(filter="FILE")
```

---

## Modification Operations

### Adding comments

```
# Single comment
idapro_set_comments(items=[{"addr": "0x401000", "comment": "decryption function entry"}])

# Batch comments
idapro_set_comments(items=[
    {"addr": "0x401000", "comment": "XOR decryption loop"},
    {"addr": "0x401050", "comment": "key initialization"},
    {"addr": "0x4010A0", "comment": "result validation"}
])

# Append comments (does not overwrite existing ones)
idapro_append_comments(items=[{"addr": "0x401000", "comment": "note: key length 16"}])
```

### Renaming

```
# Rename functions
idapro_rename(batch={"func": [
    {"addr": "sub_401000", "name": "decrypt_payload"},
    {"addr": "sub_402000", "name": "verify_license"}
]})

# Rename global variables
idapro_rename(batch={"global": [
    {"addr": "0x405000", "name": "g_encryption_key"}
]})

# Rename local variables
idapro_rename(batch={"local": [
    {"func": "decrypt_payload", "old": "v1", "name": "plaintext_buf"}
]})
```

### Patch assembly

```
# NOP out detection code
idapro_patch_asm(items=[{"addr": "0x401050", "asm": "nop"}])

# Modify a jump
idapro_patch_asm(items=[{"addr": "0x401060", "asm": "jmp 0x401080"}])

# Force return true
idapro_patch_asm(items=[
    {"addr": "0x401000", "asm": "mov eax, 1"},
    {"addr": "0x401005", "asm": "ret"}
])
```

### Patch bytes

```
# Write bytes directly
idapro_patch(patches=[{"addr": "0x401050", "bytes": "9090909090"}])
```

---

## Type System

### Declaring structs

```
idapro_declare_type(decls=[{
    "name": "PacketHeader",
    "decl": "struct PacketHeader { uint32_t magic; uint16_t type; uint16_t length; uint8_t data[0]; };"
}])
```

### Applying types

```
# Set a prototype on a function
idapro_set_type(edits=[{
    "addr": "sub_401000",
    "type": "int __fastcall decrypt(void *buf, int size, const char *key)"
}])

# Set a type on a global variable
idapro_set_type(edits=[{
    "addr": "0x405000",
    "type": "PacketHeader"
}])
```

### Inferring types

```
idapro_infer_types(addrs=["sub_401000", "sub_402000"])
```

### Querying/viewing types

```
idapro_type_query(queries=["Packet"])
idapro_type_inspect(queries=["PacketHeader"])
```

---

## Stack Frame Analysis

```
# View function stack frames
idapro_stack_frame(addrs=["main", "sub_401000"])

# Declare stack variables
idapro_declare_stack(items=[{
    "func": "sub_401000",
    "offset": -0x20,
    "name": "local_buf",
    "type": "char [32]"
}])
```

---

## Signature Generation

```
# Generate a unique byte signature for an address
idapro_make_signature(addrs=["0x401000"])

# Generate a signature for an entire function
idapro_make_signature_for_function(addrs=["decrypt_payload"])

# Generate signatures for code referencing an address
idapro_find_xref_signatures(addrs=["0x405000"])
```

---

## Base Conversion

```
# Hexadecimal → decimal
idapro_int_convert(inputs=["0x401000"])

# Decimal → hexadecimal
idapro_int_convert(inputs=["4198400"])

# Batch conversion
idapro_int_convert(inputs=["0xDEAD", "0xBEEF", "12345"])
```

> ⚠️ **Always use this tool for base conversions — never do them yourself!**

---

## Export and Scripting

### Exporting functions

```
# JSON format
idapro_export_funcs(addrs=["main", "sub_401000"], format="json")

# C header file
idapro_export_funcs(addrs=["main", "sub_401000"], format="c_header")

# Function prototypes
idapro_export_funcs(addrs=["main", "sub_401000"], format="prototypes")
```

### Executing Python scripts

```
# Execute Python in the IDA context
idapro_py_eval(code="import idautils; print(list(idautils.Functions())[:10])")

# Get segment information
idapro_py_eval(code="import idc; print(idc.get_segm_name(0x401000))")

# Batch operations
idapro_py_eval(code="import ida_funcs; f=ida_funcs.get_func(0x401000); print(f.size())")
```

---

## Typical Analysis Workflows

### Malware analysis

```text
1. survey_binary → look at imports (network APIs? crypto? registry?)
2. find_regex("http|socket|connect") → find network-related strings
3. xrefs_to(network string addresses) → find referencing functions
4. decompile(referencing functions) → examine communication logic
5. trace_data_flow(crypto parameters, "backward") → trace the key's origin
6. set_comments + rename → annotate findings
```

### Registration check cracking

```text
1. find_regex("serial|license|register|valid") → find validation-related strings
2. xrefs_to(validation strings) → locate the validation function
3. analyze_function(validation function) → understand the logic
4. callgraph(validation function, 2) → examine the call chain
5. patch_asm(conditional jump address, "jmp always_pass") → patch
```

### CTF reversing

```text
1. survey_binary → confirm architecture and entry point
2. decompile("main") → examine the main logic
3. find_regex("flag|correct|wrong") → find the decision point
4. trace_data_flow(decision point, "backward") → trace the input transformation
5. Use Python to assist calculations/decryption → obtain the flag
```

### Vulnerability analysis

```text
1. entity_query(kind="imports", filter="strcpy|sprintf|gets") → find dangerous functions
2. xrefs_to(dangerous functions) → find call sites
3. analyze_function(function containing the call site) → examine context
4. stack_frame(function) → confirm buffer sizes
5. trace_data_flow(dangerous parameter, "backward") → confirm user controllability
```

---

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "No database bound" | No file opened | Run `open.ps1` |
| "Failed to open database" | Old database locked | `open.ps1` automatically degrades to Temp |
| Schema validation failure | MCP client BUG | Use `open.ps1` instead of `idalib_open` |
| Tool timeout | Large file analysis in progress | Add `-TimeoutSeconds 600` |
| "ERR:timeout" (start.ps1) | Server failed to start | Check Python/idalib-mcp installation |
| Base conversion error | Manual calculation error | Use `idapro_int_convert` |
| Function name not found | Name not exact | Search first with `list_funcs` + filter |
