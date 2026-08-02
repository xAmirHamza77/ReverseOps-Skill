# ReverseOps panel

Self-contained, dependency-free dashboard for pentest findings — dark UI, SVG
charts, zero network calls. Open it, it draws.

## Quick start

```bash
# from the repo root — regenerate data from reports/*.md + work/*/findings/*.json
python3 scripts/mkreport.py

# then either just open the file…
open panel/index.html            # macOS  (file:// works, data is loaded via <script>)

# …or serve it
python3 panel/serve.py           # http://127.0.0.1:8377
```

If no `data/data.js` exists yet, the panel falls back to the bundled
**sample dataset** and shows a `DEMO DATA` badge.

## What you get

- **KPI row** — totals, critical/high counts, open findings, weighted **risk index** (0–100)
- **Charts** — findings timeline (cumulative view), severity donut, status donut,
  category / case / ATT&CK-technique bar charts
- **Findings table** — search + severity chips + status filter; click a row for the
  PoC, evidence chain, remediation, CWE/OWASP/ATT&CK tags
- **Reports** — every parsed source report with its finding count

## Data flow

```
reports/*.md  ──┐                         ┌──  panel/data/data.js   (gitignored)
                ├─ scripts/mkreport.py ──►│
work/*/findings/*.json ─┘                 └──  panel/data/data.json (for tooling)
```

- JSON findings follow `skills/reporting/finding-schema.json` (one file per finding).
- Markdown reports are parsed heuristically (`## vulnerability N：` / `## Finding N:` headings
  + inline severity lines — see `skills/reporting/templates/report.md`).
- **Privacy**: `reports/`, `work/` and `panel/data/data.js` are gitignored. The only
  dataset that ships with the repo is the fictional sample. Redact before exporting
  outside the engagement machine.
