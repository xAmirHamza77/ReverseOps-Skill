---
name: docs-generator
description: |
  Creates task-oriented technical documentation with progressive disclosure. Use when writing READMEs, API docs, architecture docs, or markdown documentation.
  Also use this skill at the END of any completed reverse engineering, penetration testing, CTF, or security analysis task to generate a formal report in the user's project directory.
  Trigger keywords: "write a report", "write documentation", "produce a report", writeup, technical documentation, report, documentation.
---

# Technical Documentation

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Confirm whether the current task falls within this skill's scope
2. `NOW`: Read `../tool-index.md` to verify tool availability and actual paths
3. `NEXT`: If a tool is missing, invoke bootstrap — do not guess paths
4. `ACT`: Enter the first step of the "Workflow" and execute — do not stop at the confirmation stage

For writing style, tone, and voice guidance, use `Skill(ce:writer)` with **The Engineer** persona.

## Security / Reverse Engineering Task Documentation Output

After a reverse engineering / penetration testing / CTF / security analysis task is completed, this skill is responsible for generating formal technical documentation in the **user's project directory**.

### Trigger timing

1. A reverse engineering task is complete and core conclusions have been produced (algorithm recovery, signature cracking, bypass solution, etc.)
2. A penetration test is complete and vulnerabilities have been discovered and verified
3. A CTF challenge is solved and the flag has been captured
4. The user explicitly asks to "write a report/document/writeup"

### Template selection

| Task type | Template to use |
|-----------|-----------------|
| APK/binary/so reverse engineering | `references/security-report-templates.md` → Reverse Engineering Report |
| Penetration testing / vulnerability discovery | `references/security-report-templates.md` → Penetration Test Report |
| CTF solve | `references/security-report-templates.md` → CTF Writeup |
| JS/Web signature reverse engineering | `references/security-report-templates.md` → Signature Reverse Engineering Report |
| General technical documentation | `references/templates.md` → README / API docs |

### Output conventions

- **Output location**: the user's current project directory (not the skill package directory)
- **Filename format**: `YYYY-MM-DD_[type]-[target-short-name]-report.md`
- **If the project has a `docs/` directory**: prefer placing the report under `docs/`
- **Encoding**: UTF-8
- **Language**: follow the language of the user's conversation (Chinese conversation → Chinese report, English conversation → English report)

### Quality requirements

- All code blocks must be directly runnable or have clear context
- No placeholders/TODOs
- Key findings must be backed by evidence
- Reproduction steps must allow a third party to independently reproduce the result
- Sensitive information (real tokens, passwords, internal URLs) must be replaced with placeholders
- **MUST** include the Evidence → Finding → Path chain (see `../ops/evidence-finding-path.md` and template §0)
- **SHOULD** reference the case `scope.md` / `timeline.md` (`../scripts/case-init.ps1`)

### Diagram integration

When generating a report, call the `diagram-generator` skill at appropriate points to produce visual diagrams:

| Report type | Suggested diagrams | Diagram type |
|-------------|--------------------|--------------|
| Reverse engineering report | Function call graph, data flow diagram | Mermaid flowchart / sequenceDiagram |
| Penetration test report | Attack path diagram, network topology | Mermaid flowchart / Graphviz |
| CTF Writeup | Solution approach flowchart | Mermaid flowchart |
| JS signature reverse engineering report | Request chain sequence diagram, algorithm flowchart | Mermaid sequenceDiagram / flowchart |

Embed diagrams as Mermaid code blocks in the report markdown so they render directly on GitHub/GitLab.

---

## Core Principles

### 1. Progressive Disclosure

Reveal information in layers:

| Layer | Content | User Question |
|-------|---------|---------------|
| 1 | One-sentence description | What is it? |
| 2 | Quick start code block | How do I use it? |
| 3 | Full API reference | What are my options? |
| 4 | Architecture deep dive | How does it work? |

**Warnings, breaking changes, and prerequisites go at the TOP.**

### 2. Task-Oriented Writing

```markdown
<!-- Bad: Feature-oriented -->
## AuthService Class
The AuthService class provides authentication methods...

<!-- Good: Task-oriented -->
## Authenticating Users
To authenticate a user, call login() with credentials:
```

### 3. Show, Don't Tell

Every concept needs a concrete example.

## Formatting Standards

- **Sentence case headings**: "Getting started" not "Getting Started"
- **Max 3 heading levels**: Deeper means split the doc
- **Always specify language** in code blocks
- **Relative paths** for internal links
- **Tables** for structured data with 3+ attributes

## Quality Checklist

- [ ] Code examples tested and runnable
- [ ] No placeholder text or TODOs
- [ ] Matches actual code behavior
- [ ] Scannable without reading everything
- [ ] Reader knows what to do next

## Anti-Patterns

| Problem | Fix |
|---------|-----|
| Wall of text | Break up with headings, bullets, code, tables |
| Buried critical info | Warnings/breaking changes at TOP |
| Missing error docs | Always document what can go wrong |

## Templates

For README, API endpoint, and file organization templates, see [references/templates.md](references/templates.md).

## Related Skills

- `Skill(ce:writer)` - Writing style, tone, and voice (load The Engineer persona)
- `Skill(ce:visualizing-with-mermaid)` - Architecture and flow diagrams


---

## On-Demand Bootstrap

This skill depends on no external tools — it is pure text generation. No bootstrap needed.

If diagrams need to be rendered and embedded in the report, the `diagram-generator/` skill will be called.

---

## Routing Context

**Upstream entry**: all security/reverse engineering skills automatically invoke this skill after task completion
**Trigger methods**:
- Automatic: executed as step 9 of the behavior chain after task completion
- Manual: user says "write a report", "produce documentation", "writeup"

**Peer modules**:
- `apk-reverse/` — generates a reverse engineering report after APK analysis completes
- `ida-reverse/` — generates a reverse engineering report after binary analysis completes
- `radare2/` — generates a reverse engineering report after CLI analysis completes
- `js-reverse/` — generates a signature report after JS signature reverse engineering completes
- `reverse-engineering/` — generates a reverse engineering report after general reversing completes
- `field-journal/` — report content also serves as the data source for the evolution log

**Security report templates**: `references/security-report-templates.md`
**General documentation templates**: `references/templates.md`


## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than just reading it)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Does the report contain Evidence / Finding / Path (ops contract)?
- [ ] Did I complete and write back the Checklist items required by RULES?
