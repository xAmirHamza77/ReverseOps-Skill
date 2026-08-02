# Community Security Skill Ecosystem Comparison (2026-07)

> Source retrieval date: **2026-07-17**  
> Purpose: let ReverseOps **know what exists out there**, borrow as needed, and **not** merge external mega-repos wholesale into this package.  
> This package's identity: routing + tool bootstrap + evidence/scope contracts + field-journal (see `ops/IDENTITY.md`).

## 1. High-Value External Repositories (learn from them; don't install blindly)

| Repository | Scale / Positioning | Value to this package | Risks |
|------------|--------------------|-----------------------|-------|
| [trailofbits/skills](https://github.com/trailofbits/skills) | ToB security research Claude plugin marketplace | Quality benchmark for audit / vulnerability analysis / RE plugins | Requires installation via the ToB marketplace; do not trust non-curated copies by default |
| [trailofbits/skills-curated](https://github.com/trailofbits/skills-curated) | Audited plugin list | Takes priority over arbitrary community skills | Same as above |
| [Orizon-eu/claude-code-pentest](https://github.com/Orizon-eu/claude-code-pentest) | 6 pentest lifecycle skills + pure Python scripts | The recon → exploit → report pipeline is comparable to our `attack-chain` + `pentest-tools` | Authorization boundaries need self-checking; scripts need sandboxing |
| [trilwu/secskills](https://github.com/trilwu/secskills) | 16 skills + 6 expert subagents | Multi-role division comparable to `ops/role-map.md` | Plugin form, unlike this package's monorepo |
| [Masriyan/Claude-Code-CyberSecurity-Skill](https://github.com/Masriyan/Claude-Code-CyberSecurity-Skill) | ~15–19 domain skills (incl. RE/OT/CSOC) | Domain coverage checklist | Less depth than this package's single-domain skills |
| [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) | **800+** skills · ATT&CK/NIST mapping | **Framework mapping** and domain catalog are worth referencing; not suitable as a wholesale dependency | Too large; enormous maintenance and poisoning surface |
| [Eyadkelleh/awesome-skills-security](https://github.com/Eyadkelleh/awesome-claude-skills-security) | SecLists packaged as agent skills | Entry point for dictionaries/payloads | Overlaps with the seclists bootstrap |
| [securityfortech/awesome-security-skills](https://github.com/securityfortech/awesome-security-skills) | Curated list of security skills | Index for discovering new skills | List-type resource; each entry needs individual audit |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | 1000+ cross-vendor skill index | Discover official/community skills | Not security-specific |
| [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | PR security review GitHub Action | Comparable to our docs/report-side "change audit" scenarios | CI product, not an RE router |
| [agentskills.io](https://agentskills.io) | Open standard for Agent Skills | Alignment on frontmatter/directory conventions | The standard itself has no offensive/defensive content |

### 1.1 Second-Round Retrieval Additions (re-searched 2026-07-17)

| Repository / Resource | Positioning | Where it lands in this package |
|-----------------------|-------------|--------------------------------|
| [trailofbits/skills](https://github.com/trailofbits/skills) plugins: `audit-context-building` `differential-review` `semgrep-rule-creator` `sharp-edges` `dwarf-expert` `burpsuite-project-parser` | Audit context, differential security review, dangerous APIs, DWARF, Burp project parsing | Compare against `ida-reverse`/`docs-generator`/audit workflows; do **not** merge wholesale |
| [HexRaysSA/ida-claude-code-plugins](https://github.com/HexRaysSA/ida-claude-code-plugins) | Official IDA Claude plugins (incl. domain automation, marked unsafe) | Comparison for the `ida-reverse` MCP path; unsafe plugins are disabled by default |
| [P4nda0s/ReverseOpss](https://github.com/P4nda0s/ReverseOpss) | IDA-NO-MCP: export decompilation first, then analyze; rev-frida/dex-dump/u3d | Complements "offline export when MCP is unavailable" |
| [2389-research/binary-re](https://github.com/2389-research/binary-re) | triage → static (r2/Ghidra) → dynamic (QEMU/GDB/Frida) → synthesis | `reverse-engineering` phase gates in `re-agent-workflow.md` |
| [incogbyte/android-reverse-engineering-claude-skill](https://github.com/incogbyte/android-reverse-engineering-claude-skill) | APK unpacking, endpoint extraction, adaptive Frida bypass | Compare against `apk-reverse`; dynamic scripts need scope |
| [OwenPawl/cerberus-re-skill](https://github.com/OwenPawl/cerberus-re-skill) | Apple-oriented Ghidra+LLDB+Frida three-loop | Reference for the macOS/iOS dynamic loop |
| [ljagiello/ctf-skills](https://github.com/ljagiello/ctf-skills) | CTF reverse/pwn; tools installed on demand | Compare against CTF-Sandbox + `pwn-chain` |
| [shuvonsec/claude-bug-bounty](https://github.com/shuvonsec/claude-bug-bounty) | /recon → /hunt → /validate → /report | Compare against `recon-pipeline.md` + scope gate |
| [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) | Web payloads + Prompt Injection chapter | Prefer `pentest-tools/payloads`; LLM topics see `llm-security` |
| [HackTricks](https://hacktricks.wiki/) | Pentest methodology + **AI/MCP abuse** | See the MCP section in skill-supply-chain |
| [appsecsanta AI pentesting agents 2026](https://appsecsanta.com/research/ai-pentesting-agents-2026) | Architectural taxonomy of 39+ open-source AI pentest agents | Multiple agents ≠ mandatory; we use role-map |
| Snyk evaluation "more skills ≠ better" | Skill stacking can degrade audit quality | Reinforces the "deep skills + routing" strategy |

## 2. Security Standards and Threats (2025–2026)

| Source | Key points | Where it lands in this package |
|--------|-----------|--------------------------------|
| [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) | Malicious skills, supply chain, permission abuse, memory poisoning, etc. | `ops/skill-supply-chain.md` |
| [Anthropic Agent Skills engineering post](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | Install only from trusted sources; audit scripts and dependencies | Same as above + bootstrap forbids guessing paths |
| ClawHavoc and other poisoning campaigns (documented in AST10) | Bulk malicious skills in registries | One-click installs from unknown registries into this package are forbidden |

## 3. What This Package Already Has vs. External "Broad" Coverage

| Area | ReverseOps | Why we don't merge external repos wholesale |
|------|---------------|----------------------------------------------|
| APK/JS/IDA/r2/firmware/pwn | **Deep** skills + scripts | Preserve depth and tool-index binding |
| Pentest / attack chains / SRC | pentest-tools + attack-chain + src-hunter | Orizon-style repos can serve as methodology comparisons |
| LLM/Agent security | llm-security | AST10 strengthens the security of skills themselves |
| Evidence/scope/roles | **ops/** (signature feature) | Most skill packages have no case contract |
| OT/ICS / pure GRC / fraud F3 | No dedicated skill | On routing miss → propose adding a skill or use external links; don't force it in |
| 800+ micro-skills | Not replicated | MASTER routing + domain skills replace fragmentation |

## 4. Borrowing Rules (MUST)

```text
1. Do not git-submodule an entire 800+ skill library as a runtime dependency
2. When borrowing: extract "phases/checklists/command patterns" into this package's references or existing skills
3. External scripts: inspect dependencies and network behavior in an isolated environment first, then consider bootstrap-manifest
4. New scenarios: add a skill via CONTRIBUTING, and update routing + RULES keywords
5. Annotate source URL + retrieval date (this file's format)
6. Before installing/merging, go through the ops/skill-supply-chain.md checklist
7. At runtime, load only MASTER-ROUTING's PRIMARY (+ necessary secondary) skills to avoid skill-stacking overload
```

## 4.1 Borrowed Artifacts Already Crystallized in This Package (not external dependencies)

| Artifact | Path |
|----------|------|
| RE four-phase model | `reverse-engineering/references/re-agent-workflow.md` |
| Authorized recon | `pentest-tools/references/recon-pipeline.md` |
| Attack chain gates | `attack-chain/references/lifecycle-checklist.md` |
| Skill supply chain | `ops/skill-supply-chain.md` |
| Domain coverage | `references/domain-coverage-map.md` |

## 5. Suggested Priorities (Future Iterations)

| Priority | Action |
|----------|--------|
| P0 done | ops contracts, MASTER routing, skill supply-chain security docs |
| P1 | Compare against Orizon/ToB and add pentest phase checklists to attack-chain references |
| P2 | Optional "external-link skill whitelist" configuration, not part of the default path |
