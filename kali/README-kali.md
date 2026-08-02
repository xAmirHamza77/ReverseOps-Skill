# Cybersecurity Skills Router — Kali Linux Edition

> This directory is the optimization and adaptation layer for Kali Linux 2026.1, specifically tuned for Kali 2026.1 (kernel 6.18) released in March 2026.
> The core knowledge base (skills/, CTF-Sandbox/) is shared with the Windows edition; the Kali-specific README and Bash entry points must cover the Windows core capability names while additionally providing Kali-native tool/MCP capabilities.
> The root-level [README-kali.md](../README-kali.md) is only a short redirect — **this file is authoritative**.

---

## AI: Execute Immediately After Reading

```text
1. Detect the package root (the repository root containing skills/ and kali/)
2. Read kali/RULES-kali.md → global injection and tool scan
3. bash kali/scripts/refresh-tool-index.sh
4. Shared operation chain with the main package:
   - skills/MASTER-ROUTING.md (or pwsh skills/scripts/master-route.ps1)
   - skills/scripts/case-init.ps1 → work/<case>/scope.md
   - ACT against targets only after auth.status=granted + network_profile
   - skills/ops/ (evidence chain / roles / timeline / IDENTITY)
5. Report the configuration result to the user
```

For general Agent bootstrap, see the repository-root [README_AI.md](../README_AI.md) (read this file when Kali is detected).

---

## 0. Relationship to the Windows Edition (Capability Name Alignment)

```text
<project root>/
├── skills/                    # Shared: SKILL, routing, MASTER-ROUTING, ops, scripts, field-journal
├── CTF-Sandbox/  # Shared: 40+ CTF sub-skills
├── kali/                      # ← You are here
│   ├── scripts/
│   │   ├── bootstrap-reverse.sh
│   │   ├── refresh-tool-index.sh
│   │   ├── bootstrap-manifest.json
│   │   └── lib/
│   │       └── tool-discovery.sh
│   ├── RULES-kali.md
│   └── README-kali.md
├── RULES.md                   # Windows edition rules
└── Readme.md                  # Windows edition documentation
```


### 0.1 Alignment Principles

The Kali-specific entry is not a plain copy of the Windows README; it is **the same set of core capability names + additional Kali capabilities**:

- Windows: `skills/scripts/bootstrap-reverse.ps1`
- Kali: `kali/scripts/bootstrap-reverse.sh`
- Generic Linux/macOS: `skills/scripts/bootstrap-reverse.sh`

JEB Pro is a commercial tool licensed and installed by the user; Reqable MCP uses the officially pinned `reqable-mcp-server` version but still requires the Reqable desktop client to be installed separately.

Kali scripts should cover the core capability names from the Windows manifest, such as `jadx`, `apktool`, `frida`, `jshookmcp`, `anything-analyzer`, `idapro`, `r2`, `adb`, `ghidra-mcp`, `seclists`, `burpsuite-mcp`, `nmap`, `pentestswarm`; they may additionally support Kali-native tools such as `mcp-kali-server`, `metasploitmcp`, `hexstrike-ai`, `sstimap`, `xsstrike`, `netexec`, and others.

**Shared parts** (no changes needed):
- All `SKILL.md`, `routing.md`, `MASTER-ROUTING.md`
- `skills/ops/` operation contracts (scope / evidence chain / roles / timeline)
- All `references/` knowledge bases
- `field-journal/` self-evolution mechanism
- All of `CTF-Sandbox/`
- `docs-generator/`, `diagram-generator/`
- `skills/scripts/case-init.ps1`, `master-route.ps1` (callable via pwsh)

**Kali-specific parts**:
- All scripts are bash (`.sh`)
- Package management goes through `apt`
- Linux-style path conventions (`/opt/`, `~/tools/`, `/usr/bin/`)
- Many tools are preinstalled on Kali, so bootstrap logic is greatly simplified

---

## 1. Kali's Natural Advantages

The following tools are **ready out of the box** in Kali 2026.1 (no bootstrap needed):

### Classic Preinstalled Tools

| Tool | Kali Package | Status |
|------|----------|------|
| nmap | nmap | Preinstalled |
| sqlmap | sqlmap | Preinstalled |
| hashcat | hashcat | Preinstalled |
| john | john | Preinstalled |
| hydra | hydra | Preinstalled |
| metasploit | metasploit-framework | Preinstalled |
| gobuster | gobuster | Preinstalled |
| ffuf | ffuf | Preinstalled |
| radare2 | radare2 | Preinstalled |
| binwalk | binwalk | Preinstalled |
| frida | python3-frida-tools | Preinstalled or pip |
| burpsuite | burpsuite | Preinstalled |
| wireshark | wireshark | Preinstalled |
| nikto | nikto | Preinstalled |
| wfuzz | wfuzz | Preinstalled |
| impacket | impacket-scripts | Preinstalled |
| netexec | netexec | Preinstalled |
| responder | responder | Preinstalled |
| aircrack-ng | aircrack-ng | Preinstalled |
| bloodhound | bloodhound | Available via apt |
| ghidra | ghidra | Available via apt |

### New Tools in Kali 2026.1 (March 2026)

| Tool | Package | Purpose |
|------|------|------|
| AdaptixC2 | adaptixc2 | Post-exploitation and adversary simulation framework |
| Atomic-Operator | atomic-operator | Cross-platform Atomic Red Team test execution |
| Fluxion | fluxion | WiFi security auditing and social engineering |
| GEF | gef | Modern GDB enhancement debugging framework |
| MetasploitMCP | metasploitmcp | MCP Server interface for Metasploit |
| SSTImap | sstimap | Automatic detection and exploitation of server-side template injection |
| WPProbe | wpprobe | Fast WordPress plugin enumeration |
| XSStrike | xsstrike | Advanced XSS scanner |

### New Tools in Kali 2025.4 (December 2025)

| Tool | Package | Purpose |
|------|------|------|
| evil-winrm-py | evil-winrm-py | Python WinRM remote command execution |
| hexstrike-ai | hexstrike-ai | AI MCP security automation platform (150+ tools) |
| bpf-linker | bpf-linker | BPF static linker |

### Kali-Native MCP Tools (Key Optimization)

| Tool | Package | Purpose | Install |
|------|------|------|------|
| mcp-kali-server | mcp-kali-server | Official Kali MCP; AI calls terminal tools directly | `apt install mcp-kali-server` |
| MetasploitMCP | metasploitmcp | Metasploit MCP interface | `apt install metasploitmcp` |
| HexStrike AI | hexstrike-ai | 150+ security tool MCP automation | `apt install hexstrike-ai` |

> **This is the Kali edition's biggest advantage over the Windows edition**: all three MCP tools install directly via apt — no manual GitHub/npm/Docker configuration.

This means `bootstrap-reverse.sh` does far less work on Kali than its Windows counterpart.

---

## 2. Quick Start

### 2.0 One-Shot Initialization (Recommended for Fresh Systems)

```bash
# Fresh Kali 2026.1 system, one-shot setup (requires root)
sudo bash kali/scripts/quick-setup.sh

# Skip system update (slow network)
sudo bash kali/scripts/quick-setup.sh --skip-update

# Minimal install (skip AD/internal-network tools)
sudo bash kali/scripts/quick-setup.sh --minimal
```

This script automatically performs: system update → install new 2026.1 tools → configure native MCPs → install reverse tools → refresh index → output report.

### 2.1 First-Time Setup

```bash
# 1. Enter the project root
cd /path/to/cybersecurity-skills-router

# 2. Make the scripts executable
chmod +x kali/scripts/*.sh kali/scripts/lib/*.sh

# 3. Refresh the tool index (detect local tool status)
bash kali/scripts/refresh-tool-index.sh

# 4. Review the result
cat skills/tool-index.md
```

### 2.2 One-Shot Setup of Kali-Native MCPs (Strongly Recommended)

```bash
# Install the official Kali MCP trio
bash kali/scripts/bootstrap-reverse.sh mcp-kali-server metasploitmcp hexstrike-ai

# After installation, MCP config is automatically written to ~/.claude/mcp.json
# If using Kiro, manually copy it to ~/.kiro/settings/mcp.json
```

### 2.3 Install the New 2026.1 Tools

```bash
# Install all new tools in one shot
bash kali/scripts/bootstrap-reverse.sh adaptixc2 atomic-operator sstimap xsstrike wpprobe fluxion gef

# AD / internal-network pentest suite
bash kali/scripts/bootstrap-reverse.sh coercer evil-winrm-py netexec responder bloodhound certipy
```

### 2.4 Install Missing Tools

```bash
# Install a single tool
bash kali/scripts/bootstrap-reverse.sh jadx

# Install multiple tools
bash kali/scripts/bootstrap-reverse.sh jadx apktool frida jshookmcp

# Install and start services
bash kali/scripts/bootstrap-reverse.sh idapro --start-services
```

### 2.5 Make Your AI Client Auto-Route

Tell your AI client to read `kali/RULES-kali.md` — it will complete global injection automatically.

---

## 3. Path Conventions

| Purpose | Kali Path |
|------|----------|
| Tool install directory | `~/tools/` or `/opt/` |
| jadx | `/opt/jadx/` or `~/tools/jadx/` |
| apktool | `/usr/local/bin/apktool` (apt) or `~/tools/apktool/` |
| Ghidra | `/opt/ghidra/` or `~/tools/ghidra/` |
| IDA Pro | `/opt/idapro/` (if you have the Linux edition) |
| Android SDK | `~/Android/Sdk/` |
| SecLists | `/usr/share/seclists/` (apt) or `~/tools/SecLists/` |
| Node.js | `/usr/bin/node` (apt/nvm) |
| Python | `/usr/bin/python3` (system default) |
| MCP config | `~/.claude/mcp.json` or `~/.kiro/settings/mcp.json` |

---

## 4. Differences from the Windows Edition

| Dimension | Windows Edition | Kali Edition |
|------|-----------|---------|
| Script language | PowerShell (.ps1) | Bash (.sh) |
| Package management | winget / GitHub Release ZIP | apt / pip / npm / GitHub Release tar.gz |
| Path separator | `\` | `/` |
| Environment variables | `%USERPROFILE%` | `$HOME` |
| Preinstalled tools | Almost none | Many security tools preinstalled |
| IDA startup | `start.ps1` | Manually start the Linux edition of IDA; the script only registers/checks MCP unless you added your own launcher |
| MCP config path | `%USERPROFILE%\.claude\mcp.json` | `~/.claude/mcp.json` |
| Port probing | `TcpClient` | `nc -z` or `ss` |

---

## 5. Verification Checklist

```bash
# ─── Basic commands ───
java -version
python3 --version
pip3 --version
node -v
npx -v

# ─── Reverse tools ───
jadx --version
apktool --version
adb version
frida --version
r2 -v
gdb --version          # GEF auto-loads

# ─── Pentest tools (Kali preinstalled) ───
nmap --version
sqlmap --version
hashcat --version
hydra -h | head -1
msfconsole --version
gobuster version
ffuf -V
nuclei -version

# ─── Kali 2026.1 new tools ───
sstimap -h 2>&1 | head -3
xsstrike -h 2>&1 | head -3
wpprobe --help 2>&1 | head -3
coercer -h 2>&1 | head -3
evil-winrm-py -h 2>&1 | head -3

# ─── AD / internal-network tools ───
netexec --help 2>&1 | head -3
responder -h 2>&1 | head -3
certipy --version 2>&1 | head -1

# ─── Kali-native MCPs ───
which kali-server-mcp && echo "mcp-kali-server OK"
which metasploitmcp && echo "metasploitmcp OK"
which hexstrike-ai && echo "hexstrike-ai OK"

# ─── Refresh tool index ───
bash kali/scripts/refresh-tool-index.sh

# ─── Check MCP services (if configured) ───
nc -z 127.0.0.1 5000 && echo "mcp-kali-server OK" || echo "mcp-kali-server offline"
nc -z 127.0.0.1 8085 && echo "metasploitmcp OK" || echo "metasploitmcp offline"
nc -z 127.0.0.1 13337 && echo "IDA MCP OK" || echo "IDA MCP offline"
nc -z 127.0.0.1 23816 && echo "anything-analyzer OK" || echo "anything-analyzer offline"
```

---

## 6. FAQ

### Q: What if Kali's built-in radare2 version is too old?

```bash
# Install the latest version from official sources
bash kali/scripts/bootstrap-reverse.sh r2
# The Kali edition prefers apt install/top-up of radare2 by default; if you need the latest version, switch to GitHub/source per the platform docs
```

### Q: I use Parrot OS / BlackArch. Does this work?

Yes. The scripts detect whether commands exist; they are not tied to a specific distribution. Only the `apt`-based auto-install may need to be changed to `pacman` (BlackArch).

### Q: How do I configure IDA Pro Linux edition?

Install IDA to `/opt/idapro/`, then modify the `startScript` path for `idapro` in `kali/scripts/bootstrap-manifest.json`.

### Q: I want to use this system on both Windows and Kali

No problem. The `skills/` directory is synced via Git, and `field-journal/` experience is shared across both sides. Only the execution scripts differ: Windows uses `skills/scripts/*.ps1`, Kali uses `kali/scripts/*.sh`.
