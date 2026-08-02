# Timeline + WorkItem / Coverage

> A replayable operations record (Z3r0's timeline idea) + coverage checklists (the WorkItem idea).
> Everything lives under **`work/<case>/`** (gitignored by the repo), not in the skill package body.

## Directory conventions

```text
work/<case>/
  scope.md           # contract (ops/scope-contract.md)
  timeline.md        # append-only; never rewrite history entries
  workitems.md       # work items and coverage
  evidence/          # raw artifacts (screenshots, pcaps, logs)
  notes/
  report/            # final report draft or copy
```

Initialization:

```powershell
powershell -File skills\scripts\case-init.ps1 -Hint "full pentest" -CaseName "acme-2026"
```

## timeline.md format

Each record is **append-only**:

```markdown
## {ISO-8601} | {role} | {phase}
- action:
- command_or_ref:
- result_summary:
- artifacts: []      # relative paths under this case
- evidence_ids: []   # E-xxx when promoted
- next:
```

**MUST NOT** delete or rewrite existing `##` time blocks (make corrections with a new entry + `corrects: {timestamp}`).

## workitems.md template

```markdown
# Work Items

| ID | title | role | targets | surface | status | evidence | notes |
|----|-------|------|---------|---------|--------|----------|-------|
| WI-001 | Port scan edge | cie | {ip} | network | done | E-001 | |
| WI-002 | Auth bypass check | cpe | /api/login | web | blocked | | need creds |

status: pending | in_progress | blocked | done | cancelled

## Coverage
- [ ] Recon complete for in_scope assets
- [ ] Critical/High candidates triaged
- [ ] Validated findings have Evidence
- [ ] Path documented (attack/call/solve)
- [ ] Timeline continuous (no silent gaps >1 major phase)
- [ ] Report exported via docs-generator
- [ ] field-journal written (anonymized)
```

## attack-chain / pentest hooks

| Skill | MUST |
|-------|------|
| `attack-chain/` | Create a case directory for multi-phase tasks; update workitems + timeline at the end of each phase |
| `pentest-tools/` | At least 1 timeline entry per tool batch run; findings → Evidence drafts |
| Other RE skills | Timeline recommended; complete the Evidence chain at minimum before producing a report |

## Signature properties

- Agent-friendly plain text, diff/review friendly
- Cross-referenceable with tool-index command paths
- No dependence on WebSocket live streaming; paste the timeline into the report when needed
