# Kali Linux Entry Point (Short Jump)

> **For detailed descriptions, refer to [kali/README-kali.md](kali/README-kali.md).**  
> This file serves only as a Kali shortcut entry point at the repository root to avoid duplicate maintenance with the content in `kali/`.

## AI: Execute Immediately After Reading

```text
1. Detect package root directory (directory containing README.md / skills/)
2. Read kali/README-kali.md → then read kali/RULES-kali.md and execute
3. bash kali/scripts/refresh-tool-index.sh
4. Task routing is shared with Windows: skills/MASTER-ROUTING.md, skills/ops/ (scope gate)
5. Report configuration result to user
```

## Human: 30-Second Quick Start

```bash
cd /path/to/ReverseOps
bash kali/scripts/refresh-tool-index.sh
# Detailed bootstrap / MCP details see kali/README-kali.md
```

## Relationship to Main Package

| Content | Location |
|------|------|
| Shared skill / routing / ops | `skills/`, `RULES.md` |
| Kali scripts and manifest | `kali/scripts/` |
| Full Kali documentation | **[kali/README-kali.md](kali/README-kali.md)** |

For general AI bootstrap, see [README_AI.md](README_AI.md) (switch to this directory's documentation when selecting the Kali branch).
