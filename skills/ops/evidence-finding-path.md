# Evidence → Finding → Path evidence chain

> Inspired by the Z3r0 Evidence Plane, implemented as a **Markdown field contract**.
> ReverseOps signature: bound to `docs-generator` report templates, `field-journal` anonymized write-back, and reproducible commands.

## 1. Evidence (immutable observation)

Each piece of evidence is its own paragraph or table row:

```markdown
### E-{nnn}
- title:
- observed_at:
- source_type: command | screenshot | file | log | memory | network | manual
- source_ref: {path or command id}
- content_hash: {sha256 of artifact if file, else n/a}
- repro_command: |
    {exact command}
- raw_excerpt: |
    {anonymized excerpt}
- linked_workitem: WI-{nnn} | n/a
- supersedes: E-{nnn} | none
```

**MUST**: a Finding references at least 1 Evidence item; `repro_command` must be runnable by a third party or note the offline limitation.

**CLI helper** (writes `work/<case>/evidence/E-*.md`):

```powershell
powershell -File skills/scripts/append-evidence.ps1 -CaseRoot work/<case> `
  -Id E-001 -Title "..." -ReproCommand "..." -Severity info -Status observed
```

## 2. Finding (security/reverse-engineering conclusion)

```markdown
### F-{nnn}
- title:
- severity: critical | high | medium | low | info | n/a_re
- category: vuln | misconfig | design | reverse_algo | bypass | other
- status: candidate | validated | false_positive | accepted_risk
- evidence_ids: [E-001, E-002]
- location: {file:line | addr | url | class.method}
- impact:
- confidence: high | medium | low
- repro_steps:
  1.
  2.
- remediation: {or n/a for pure RE}
- optional_attack: {ATT&CK ID or empty}
```

**MUST**: `evidence_ids` must be non-empty; when `status=validated`, confidence must not be low (unless residual risk is noted).

## 3. Path (attack path / call path / solution path)

Uniformly called **Path**, interpreted per task type:

| Task | Path meaning |
|------|--------------|
| Pentest / attack chain | Attack path steps |
| Reverse engineering | Key call/data-flow steps |
| CTF | Solution steps |

```markdown
### P-{nnn}
- title:
- path_type: attack | callflow | solve
- start:
- goal:
- steps:
  1. action: — evidence: E-xxx — finding: F-xxx | none
  2. action: — evidence: E-xxx — finding: F-yyy | none
- residual_risks:
```

**MUST**: every step can link to Evidence; if a terminal Finding of an attack path claims "access/data obtained", it must have validated evidence.

## 4. Placement in reports

A `docs-generator` security report **MUST** contain:

1. Scope summary (linked to the case `scope.md`)
2. Evidence table or section
3. Findings list (with evidence_ids)
4. At least 1 Path (attack/call/solve)
5. Timeline summary (full text optionally linked to `timeline.md`)

See the **Evidence Chain** section in `docs-generator/references/security-report-templates.md`.

## 5. field-journal hook

When writing back to the journal, you **SHOULD** excerpt:

- Up to 3 key Evidence ids + commands
- 1 core Finding
- A one-line reusable Path pattern

Full sensitive content lives only in the user project report; the journal **MUST** be anonymized (`anonymization.md`).

## 6. Differences from Z3r0 (signature)

| Z3r0 | ReverseOps |
|------|----------------|
| PG immutable rows + API | Markdown files + hash fields |
| UI review queue | Report + next-step menu + journal |
| Deep ATT&CK binding | Optional tags, no forced UI |
