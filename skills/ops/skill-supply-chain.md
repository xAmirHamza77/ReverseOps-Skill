# Agent Skill supply-chain security (signature of this package)

> Sources synthesized: OWASP Agentic Skills Top 10 (AST10), Anthropic Agent Skills security guidance, public poisoning incidents (e.g. ClawHavoc, see the AST10 timeline)
> Retrieval date: 2026-07-17
> Applies: whenever installing/writing/merging **any** skill, MCP, or bootstrap script

Static audit of this package's **executable script surface** (backdoors / database wipes / piped execution): [`docs/PACKAGE-SECURITY-AUDIT.md`](../../docs/PACKAGE-SECURITY-AUDIT.md).

## 1. Why ReverseOps governs this separately

This package will:

- Instruct the AI to **execute commands and bootstrap downloads**
- Touch local and network resources via MCP
- Write to field-journal / reports

A malicious skill can cause: credential theft, persistent planted prompts, supply-chain backdoors.
We use **documented gates + a tool source of truth**, rather than building yet another skill app store.

## 2. Threat mapping (condensed AST10 thinking)

| Risk class | Manifestation | This package's control |
|------------|---------------|------------------------|
| Malicious/poisoned skill | Induces exfil, writes memory/backdoors | Trust only this repo + external sources with the user's written authorization; read the SKILL.md and scripts of external sources manually first |
| Excessive permissions | Indiscriminate `curl \| bash`, whole-disk reads | bootstrap is limited to manifest capabilities; scope `network_profile` |
| Dependency poisoning | Malicious pip/npm packages | Prefer official releases; record versions in tool-index |
| Blind MCP trust | Unaudited MCP servers | tool-index registration status + port probing; remote MCPs are not trusted by default |
| Poisoned MCP/CLI auto-execution | A repo's `.env` changing `CODEX_HOME` etc. so a malicious MCP executes at startup (HackTricks / CVE-style cases) | Do not trust default MCP configs inside repos; check env and the MCP list before starting the agent |
| Prompt injection into a skill | Hidden instructions buried in SKILL body text | Review diffs; "execution instructions hidden in HTML comments" are forbidden without the user |
| Scope drift | A skill induces wider scanning / "auto-pwn a whole domain" | ops/scope-contract: out_of_scope + auth; no in_scope means no wild scanning |
| Skill-stacking overload | Mounting too many skills at once actually increases missed reports (per public evaluations) | Load only PRIMARY + necessary secondaries (MASTER-ROUTING) |

## 3. MUST checklist for installing external skills

```text
□ Source: official org / audited list (e.g. ToB curated) / user-owned
□ Read all of SKILL.md + scripts/* + package dependencies
□ No mysterious outbound connections, no default steps reading ~/.ssh / browser stores
□ On conflict with this package's routing: this package's MASTER-ROUTING + scope prevails
□ Do not copy into the monorepo except via CONTRIBUTING and anonymization
□ Update skills/references/community-security-skills.md recording source and date
```

## 4. Boundaries with bootstrap / MCP

| Action | Allowed | Forbidden |
|--------|---------|-----------|
| `bootstrap-reverse.ps1 -Capability X` | X ∈ bootstrap-manifest.json | Arbitrary new names without changing the manifest |
| Registering an MCP | User confirmation + tool-index refresh | Silently writing a global MCP pointing to an unknown URL |
| Running a one-click community Python pentest | Authorized lab + after reading the source | Directly against production targets + unknown scripts |

## 5. Authors/contributors of this package

- New skills: CONTRIBUTING + ACTION REQUIRED + completion self-check
- Quoting community content: annotate URL + date (this file / community-security-skills.md)
- Suspicious behavior found: stop execution, tell the user, do not automatically "try to bypass"

## 6. Quick self-check (before merging any external material)

```powershell
# List the script extensions about to be introduced
Get-ChildItem -Recurse -Include *.ps1,*.sh,*.py,*.js | Select-Object FullName
# Coarse search for dangerous patterns (manual review, not exhaustive)
# Run in the external directory: Select-String -Pattern 'Invoke-WebRequest|curl .\||wget .\||~/.ssh|exfil'
```

## 7. Related

- Identity: `IDENTITY.md`
- External catalog: `../references/community-security-skills.md`
- Authorization: `scope-contract.md` + `field-journal/precedent-auth.md`
