# Optional sandbox tool profiles (compared against bootstrap-manifest)

> The Z3r0 default image ships a very complete tool set; ReverseOps **does not bundle an image**. Use this table as a "coverage comparison" plus optional Docker suggestions.

## Capabilities ReverseOps can bootstrap automatically

Source: `skills/scripts/bootstrap-manifest.json` (the file is authoritative):

| Capability | Typical scenario |
|------------|------------------|
| jadx / apktool / adb / frida / frida-ps | Android |
| r2 / rabin2 | Binary CLI |
| idalib-mcp / idapro | IDA MCP |
| jeb-pro | Commercial Android / ARM decompiler (manual licensed install) |
| jshookmcp / reqable-mcp / anything-analyzer / agent-browser | Web/JS/packet capture/browser |
| ghidra-mcp | Ghidra |
| nmap / seclists / proxycat / burpsuite-mcp / pentestswarm | Pentest |
| binwalk / pwntools / yara | Firmware/pwn/malware |

```powershell
powershell -File skills\scripts\bootstrap-reverse.ps1 -Capability @('jadx','nmap','yara') -StartServices
powershell -File skills\scripts\refresh-tool-index.ps1
```

## Common in the Z3r0 sandbox but NOT auto-installed by this package's manifest

| Tool | ReverseOps policy |
|------|----------------------|
| subfinder / amass / httpx / ffuf / nuclei / sqlmap | Documented install / Kali scripts / external MCP; **do not pretend bootstrap already provides them** |
| Ghidra GUI full | ghidra-mcp capability + manual plugin steps |
| gdb / pwndbg | Manual per platform docs; pwntools is bootstrap-able |
| hydra / hashcat | Manual or Kali |
| JEB Pro | User installs manually after obtaining a license; any third-party MCP bridge must pass a supply-chain review first |
| Reqable desktop client | User installs manually; `reqable-mcp` only registers the official pinned-version MCP runtime |
| SecLists | seclists capability |

## Recommended "lightweight Docker ops" profiles (optional, not a dependency)

Only when the user **themselves** has Docker and an authorized lab:

```text
Minimal: nmap + nuclei + sqlmap containers or a pentestMCP-like image
Mobile:  jadx + apktool + frida on the host
Reverse: host IDA/r2 + tool-index
```

**MUST NOT** require the user to install Z3r0 to use ReverseOps.

## network_profile interaction

Scans run inside the sandbox are still bound by the case `scope.md`'s `network_profile`:

- `offline` → spinning up outward-scanning containers is not recommended
- `authorized_target_only` → containers may only hit in_scope targets
