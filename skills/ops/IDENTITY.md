# ReverseOps identity manifesto (relative to Z3r0)

> This file fixes **who we are**. We absorb Z3r0's ideas on evidence/scope/division of labor/timelines, but we do **not** turn this into a Z3r0 platform.

## We are

| Dimension | ReverseOps |
|-----------|----------------|
| Form | **A skill routing package** — methodology + tool self-bootstrap for any AI client (Claude/Cursor/Codex…) |
| Entry point | `RULES.md` → `MASTER-ROUTING` / `master-route.ps1` → sub-skills |
| Source of tool truth | `tool-index.md` + `bootstrap-manifest.json` (local paths, never guessed) |
| Evolution | `field-journal/` anonymized experience write-back |
| Deliverables | Markdown reports + `work/<case>/` local ops directory (gitignored) |
| Deployment | `git clone` and go; no mandatory PG/UI/Docker pool |

## We are not

| Z3r0 has | ReverseOps **deliberately does not** |
|----------|------------------------------------------|
| React ops console | ❌ |
| FastAPI control plane + WebSocket sessions | ❌ |
| PostgreSQL evidence store | ❌ |
| LightRAG service | ❌ |
| Docker host pool / noVNC control agent | ❌ (may **document** optional sandbox profiles) |
| Multi-agent process runtime | ❌ (only **role→skill mapping + handoff protocol**) |

## What we learn from Z3r0 (scaled-down implementation)

| Idea | ReverseOps form |
|------|-------------------|
| Authorization and project boundaries | `ops/scope-contract.md` → per-case `scope.md` |
| Evidence→Finding→Path | `ops/evidence-finding-path.md` + report templates |
| Specialist division of labor | `ops/role-map.md` (Lead/cie/cpe/cre…→ skill) |
| Replayability | `work/<case>/timeline.md` append-only writes |
| WorkItem/coverage | `workitems.md` + coverage checkboxes |
| Well-stocked sandbox tools | `ops/sandbox-profile.md` vs bootstrap-manifest |
| Egress control | `network_profile` field (offline/lab/authorized) |

## Signature features (must be preserved)

1. **Three-axis routing + PRIMARY fast path** (target type / intent / toolchain)
2. **On-demand tool bootstrap**, across Windows/Kali/Linux/macOS
3. **MCP-friendly** (IDA/Burp/jshook/anything-analyzer)
4. **field-journal anonymized evolution**
5. **Compliance engineering**: ACTION REQUIRED / completion self-check / no fake stops

## A healthy relationship with Z3r0

```text
Z3r0 = red team operating system / team collaboration platform
ReverseOps = the agent's security-work router + instruction manual

Possible future: mount this package's skill content into Z3r0 sandbox-local skills
Today: works fully standalone with zero dependency on a Z3r0 install
```

## Relationship to the "800+ community micro-skills"

- **Do not** submodule mega skill libraries (poisoning surface and maintenance cost; see `skill-supply-chain.md`)
- **Do** maintain `references/community-security-skills.md` as an index and set of borrowing rules
- **Do** use `domain-coverage-map.md` to demonstrate: deep skills + routing > piles of fragmented skills
- External skill installs: AST10 mindset + trust only curated sources (e.g. Trail of Bits curated)
