# Red Team Sharp* Tool Analysis & Tool Installation Matrix & dnSpy MCP

## Red Team Sharp* Tool Analysis

Red team tools are heavily written in C# (the Sharp* family), so reversing them is a common scenario: understanding detection logic, modifying signatures, extracting embedded configs.

### Common Sharp* Tools Quick Reference

| Tool | Function | Reversing Focus |
|------|------|-----------|
| **Rubeus** | Kerberos attacks (AS-REP roast / Kerberoast / S4U / pass-the-ticket) | Rubeus has a fixed project structure; find the `Interop.*` P/Invoke sections for native calls |
| **SharpHound** | BloodHound data collector | LDAP query logic, the set of collected attributes |
| **SharpShell / SharpWS** | Remote execution, lateral movement | WMI / WinRM calls, command obfuscation |
| **Seatbelt** | Information gathering | Inventory of collected items, decision logic |
| **SharpRoast** | Kerberoasting | Ticket request/parsing |
| **Inveigh / SharpSploit** | MITM / general exploitation frameworks | Reflective loading, API call chains |

### General Analysis Approach

```text
1. Open in dnSpyEx (usually not obfuscated, though a few teams add ConfuserEx)
2. Look at Program.Main or the entry command dispatch (Rubeus uses a switch(command) structure)
3. Find the implementation class/method of the target command
4. Examine the P/Invoke sections (Interop.* namespace) — native API calls live here
5. Extract embedded resources (some tools embed configs/templates)
6. If signature modification is needed (EDR evasion): change command strings, API calls, string constants
```

### Rubeus Structure Example

Rubeus uses command dispatch, one class per subcommand. To find the Kerberoasting logic:

```text
Entry: Rubeus.CommandLineParser → parses args
Dispatch: switch(command) → "kerberoast" → executes Ask.TGS(...)
P/Invoke: Rubeus.Interop.Lsa* / Native.cs → native Kerberos API
Key: LsaCallAuthenticationPackage (KERB_RETRIEVE_TKT_REQUEST)
```

Signature modification (evasion): change the command string `"kerberoast"` to a custom name, change the `Rubeus` banner strings, change the P/Invoke call order.

### Embedded Config Extraction

Many loaders/tools embed C2, keys, and certificates encrypted in resources or fields:

```powershell
# View Resources (resource tree) in dnSpyEx
# Or from the command line
powershell -c "[System.Reflection.Assembly]::LoadFile('target.exe').GetManifestResourceNames()"
# Once a resource is found, right-click → extract / Save in dnSpyEx
```

Configs decrypted at runtime → dynamically break at the decryption method's return point and dump the plaintext (see `common-workflow.md`).

---

## Tool Installation Matrix

### Windows (preferred; dnSpyEx is a GUI)

```powershell
# Option A: Chocolatey
choco install dnspy ilspy de4dot detect-it-easy

# Option B: manual release download (recommended, version-controlled)
# dnSpyEx:    https://github.com/dnSpyEx/dnSpy/releases
# de4dot:     https://github.com/de4dot/de4dot/releases
# ILSpy:      https://github.com/icsharpcode/ILSpy/releases
# DIE:        https://github.com/horsicq/Detect-It-Easy/releases
# dnlib:      dotnet add package dnlib  (NuGet)
```

### Linux / macOS (no dnSpyEx GUI; use CLI)

```bash
# ILSpy CLI decompilation
dotnet tool install -g ilspycmd
ilspycmd target.exe -p -o outdir/         # decompile to a directory

# de4dot is cross-platform (requires mono or dotnet)
# Download the de4dot .dll artifacts from releases and run them with dotnet
dotnet de4dot.dll target.exe -o target-clean.exe

# dnlib (scripted, requires dotnet SDK)
dotnet new console -o dnclean && cd dnclean
dotnet add package dnlib

# DIE CLI (diec)
# Linux: install from https://github.com/horsicq/Detect-It-Easy
diec target.exe
```

### .NET Runtime Prerequisites

```bash
# Linux
sudo apt install dotnet-runtime-8.0        # or 6.0/7.0 depending on the target
# macOS
brew install --cask dotnet-sdk
```

> dnSpyEx (with IL editor + debugger) is Windows GUI only. .NET reversing on Linux/macOS can only use `ilspycmd` for decompilation + `dnlib` script patching; there is no equivalent interactive debugging GUI. Prefer Windows when patching is needed.

---

## dnSpy MCP Integration

Several community dnSpy MCP projects already exist, exposing dnSpy's decompilation/IL inspection as MCP tools that AI can call directly — fully aligned with ReverseOps's MCP philosophy.

### Mainstream dnSpy MCP Projects

| Project | Characteristics | Integration |
|------|------|------|
| **soufianetahiri/dnspy-mcp** | Core MCP Server, exposes decompile, IL inspection, and other tools | Claude Code / Cursor |
| **AgentSmithers/DnSpy-MCPserver-Extension** | Runs as a dnSpyEx extension, deep GUI integration | Loaded inside dnSpyEx |
| **malwarecakefactory/dnspy-mcp-extension** | 33 tools covering the full triage → deobfuscation pipeline | Full-pipeline automation |

### Registering in the Claude MCP Configuration

After installing the dnSpyEx extension per the corresponding project's README, register it in `~/.claude/mcp.json` (the exact command/args should follow the project's README):

```json
{
  "mcpServers": {
    "dnspy": {
      "command": "dotnet",
      "args": ["path/to/dnspy-mcp.dll"]
    }
  }
}
```

Once registered, this skill's AI integration path: user says "analyze this .NET" → routed to `dotnet-reverse/` → prefer calling the `dnspy_decompile` / `dnspy_inspect_il` tool interfaces → fall back to the GUI if that fails.

> dnSpy MCP is not a built-in bootstrap capability of ReverseOps; users must manually install the extension and register it per the project's README. It could be considered for inclusion in `bootstrap-manifest.json` later.

---

## Community Resource Index

### Highly Recommended

- **Washi's blog** — .NET reversing master: https://blog.washi.dev/posts/misconceptions-about-dotnet/
  - Core point: **Do not over-rely on dnSpy's C# decompiler; get familiar with the IL editor** (consistent with this project's IL-first principle)
- **dnSpyEx** — actively maintained fork of dnSpy: https://github.com/dnSpyEx/dnSpy
- **de4dot** — .NET deobfuscation: https://github.com/de4dot/de4dot
- **dnlib** — metadata programming: https://github.com/dnlib/dnlib

### Practical Tutorials

- Medium article "De-obfuscating and reversing a .NET/C# spyware" — hands-on dnSpy + de4dot info-stealer deobfuscation
- YouTube video "dnSpy Patch .NET EXEs & DLLs" — step-by-step patching + keygen
- kanxue forum .NET reversing section — searching for ".net reversing" / "dnSpy" / "ConfuserEx" yields many practical posts, Nuitka reversing, and AV evasion discussions
- Guided Hacking "Top 5 .NET Reverse Engineering Tools" — dnSpy still ranks first
- StackExchange / Reverse Engineering — advanced questions such as `DynamicMethod` debugging

### Existing .NET Resources in This Repository (cross-references)

- `reverse-engineering/tools.md` `.NET Analysis` section — dnSpy/ILSpy tool quick reference + the Codegate 2013 two-stage XOR+AES-CBC pattern
- `reverse-engineering/field-notes.md` `.NET` section — tool quick notes
- `reverse-engineering/awesome-re-resources.md` — de4dot included
- `field-journal/seed-014_unity-il2cpp-reverse.md` — Unity IL2CPP (native side, complementary to the .NET managed layer)

In-depth .NET reversing content is consolidated into this module; `reverse-engineering/` only retains quick-reference indexes.
