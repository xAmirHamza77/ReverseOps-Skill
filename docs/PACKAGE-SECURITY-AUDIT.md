# ReverseOps Package Security Audit (Executable Surface)

> Date: 2026-07-18  
> Scope: `skills/**/scripts`, `skills/scripts`, `kali/scripts`, `burp-mcp-full` executable scripts and bootstrap manifest  
> **Excluded**: `src-hunter` / payloader and other **educational payload documentation** (their DROP/injection examples are methodology, not automated execution)

## Conclusion (Executive Summary)

| Severity Level | Determination |
|------|------|
| **Backdoors / Intentional DB Deletion / Disk Formatting** | **Not Found** |
| **Pipe Download & Execute (curl\|sh / IEX DownloadString)** | **Not Found** |
| **Hardcoded Cloud Keys / Private Keys** | **Not Found** (`sk-` / `BEGIN RSA` in documentation are detection examples) |
| **Supply Chain Residual Risk** | **Partially Hardened (Medium/Low → Low)**: Pinned `@latest`; GitHub downloads support **manifest SHA256 + API digest** |

**Overall Rating: No implant-style backdoors or "one-click DB wipe" logic found in the executable skill script surface; dangerous deletes are restricted to tool reinstall temporary directories / case output directories.**

### 2026-07-18 Hardening (This Commit)

| Item | Action |
|----|------|
| jshookmcp | `@latest` → `@0.3.4` |
| pentestswarm | `@latest` / docker `:latest` → `@v0.1.0` / `:v0.1.0` |
| jadx | Pin `v1.5.6` + `assetSha256` |
| apktool | Pin `v3.0.2` + `assetSha256` |
| bootstrap PS/sh | Download verifies `Assert-DownloadedFileIntegrity` / `verify_sha256`; priorities manifest hash, fallback to GitHub `digest`; failure deletes file and aborts |
| Releases without pinned hash | Still installable, but **WARN** and print actual sha256 |

## Audit Methodology

Perform search across executable extensions (`.ps1` / `.sh` / `.py` / `.js` / `.java`):

- `Invoke-Expression` / `IEX` / `FromBase64String` / `DownloadString`
- `curl|bash` / `wget|sh` pipeline execution
- `DROP DATABASE|TABLE`, `rm -rf /`, `Remove-Item ... C:\Windows`
- Reverse shell patterns (`/dev/tcp` abuse, `TcpClient` backconnect)
- Hidden window launching (reviewed for purpose)

Second pass: Manual review of `bootstrap-reverse.ps1/.sh` download and delete paths, `mcp-bridge.js`, diagramming/cryptographic Python scripts.

## Finding Details

### 1. Delete Operations (All Are Expected Cleanup, Not Database Wiping)

| Location | Behavior | Risk |
|------|------|------|
| `bootstrap-reverse.ps1` `Expand-ArchiveIntoDirectory` | Delete target installation directory before reinstalling; delete `%TEMP%\reverse-bootstrap-*` | Tool installation paths only, not user business databases |
| `bootstrap-reverse.ps1` anything-analyzer | On failure, `Remove-Item node_modules` then `pnpm install` | Restricted to cloned tool repositories |
| `apk-reverse/scripts/decode.*` | Clean up task output directories jadx/apktool out | Restricted to task root |
| `case-init.ps1` | Clean up temporary directories | Temporary |
| `bootstrap-reverse.sh` | Similar temp / installation target cleanup | Same as above |

**Not Found**: Executable logic targeting `C:\`, system directories, or `DROP`/`TRUNCATE` on arbitrary database connection strings.

### 2. Network Behavior (Tool Bootstrap, Not C2)

| Location | Behavior | Description |
|------|------|------|
| `bootstrap-reverse.ps1` | Pull releases from `api.github.com`; download zip/jar via `Invoke-WebRequest` | Repository names come from **manifest whitelist** |
| `bootstrap-reverse.sh` | `curl` / `git clone` / `pipx` / `npm` | Same as above |
| `mcp-bridge.js` | HTTP only to `127.0.0.1:9876` → Burp | Local loopback |
| `ToolDiscovery.ps1` | Probe `http://host:port/mcp` | Health check |
| `kali/.../tool-discovery.sh` | `(echo >/dev/tcp/$host/$port)` | **Port probing**, NOT reverse shell |

### 3. Hidden Windows

| Location | Purpose |
|------|------|
| `bootstrap-reverse.ps1` `Start-Process ... -WindowStyle Hidden` | Background start `pnpm dev` (anything-analyzer) |
| `ida-reverse/scripts/start.ps1` | Start IDA-related processes (must run in background) |

Belongs to service startup pattern; no hidden downloading of malicious payloads found.

### 4. "Dangerous Wording" in Documentation / Payloads (Not Automatically Executed)

`pentest-tools/src-hunter`, `attack-chain`, and other **Markdown/JSON educational materials** contain SQL injection, `DROP` examples, and log clearing **red team methodologies**.  
These **will NOT be automatically executed by bootstrap or master-route**; execution depends on AI/human invoking under an **authorized scope**.

For related constraints, see: `ops/scope-contract.md`, `ops/skill-supply-chain.md`, `field-journal/precedent-*.md`.

### 5. Supply Chain Residual Risks (Recommended Future Hardening, Not Confirmed Backdoors)

| Item | Risk | Recommendation |
|----|------|------|
| `@jshookmcp/jshook@0.3.4`, `pentestswarm@v0.1.0` in `bootstrap-manifest.json` | Tag drift / supply chain poisoning surface | Pin version numbers + checksum hashes |
| GitHub release zip **lacks SHA256 checksum** | Difficult to detect timely if release is replaced | Add `assetSha256` to manifest and verify hash during bootstrap |
| Default sources for `npm install -g` / `pip` | Inherent risk in dependency ecosystem | Install manifest capabilities only; use private registry / locking in production |

## Executable Script Manifest (Audit Baseline)

```
skills/scripts/*.ps1|*.sh + lib/ToolDiscovery.ps1
skills/apk-reverse/scripts/*
skills/radare2/scripts/*
skills/ida-reverse/scripts/*
skills/browser-automation/scripts/*
skills/diagram-generator/scripts/*.py
kali/scripts/*
burp-mcp-full/mcp-bridge.js (+ Java extension source)
```

## Recommended Continuous Checks

```powershell
# Quick health check for executable surface (Example)
rg -n "Invoke-Expression|FromBase64String|DownloadString|rm -rf /|DROP DATABASE" skills/scripts skills/*/scripts kali/scripts burp-mcp-full -g "*.ps1" -g "*.sh" -g "*.py" -g "*.js"
```

Newly added **executable scripts** for skills should re-run this manifest before merging; pure Markdown methodology changes are not mandatory.

## Sign-Off

- Audit Execution: Repository local static scanning + manual review of critical paths  
- Result: No backdoors / no automated database wiping; supply chain hardening listed as future improvement items  
