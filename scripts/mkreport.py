#!/usr/bin/env python3
"""ReverseOps report exporter.

Aggregates machine-readable findings and markdown pentest reports into a single
data bundle consumed by the ReverseOps panel (panel/).

Inputs (all optional, everything is best-effort):
  - JSON findings:  <case>/findings/*.json under --cases-root (default: work/)
                    and findings/*.json at the repo root.
                    Validated against skills/reporting/finding-schema.json (loosely).
  - Markdown reports: --reports-dir (default: reports/, gitignored in this repo).
                    Chinese and English severity keywords are both recognised.

Output (default: panel/data/data.js):
  window.REVERSEOPS_DATA = { ...findings, stats, reports... };
  A sibling data.json with the same payload is written for tooling.

Data never leaves the machine unless you commit it -- reports/ and work/ are
gitignored; panel/data/data.js is gitignored too, so regenerate it per machine:

    python3 scripts/mkreport.py                 # repo-local defaults
    python3 scripts/mkreport.py --out /tmp/x.js # custom path
"""
import argparse
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

SEVERITIES = ["critical", "high", "medium", "low", "info"]

_SEV_MAP = {
    "critical": "critical", "极危": "critical", "致命": "critical", "严重": "critical", "fatal": "critical", "crit": "critical",
    "high risk": "high", "high": "high", "高危": "high", "高": "high",
    "medium risk": "medium", "中危": "medium", "中": "medium", "medium": "medium", "moderate": "medium", "med": "medium",
    "low risk": "low", "低危": "low", "低": "low", "low": "low",
    "info": "info", "提示": "info", "信息": "info", "hint": "info", "informational": "info", "note": "info",
}

# head like: "## Vulnerability 1: Login rate limit bypass (XFF Header Trust)" or "## Finding 2: Reflected XSS"
_FINDING_HEAD = re.compile(
    r"^#{2,3}\s*(?:vulnerability|缺陷|问题|vuln(?:erability)?|finding|issue)\s*[#0-9]*\s*[：:\-–]?\s*(?P<title>.+)$",
    re.IGNORECASE,
)
_SEV_INLINE = re.compile(
    r"(?:risk等级|severity|risk(?:\s*level)?|评级|等级)\s*[：:]\s*(?:\*\*)?"
    r"(?P<sev>critical|high risk|medium risk|low risk|info|critical|high|medium|moderate|low|informational|info|fatal|crit|med|note|hint|极危|致命|严重|高危|高|中危|中|低危|低|提示|信息)",
    re.IGNORECASE,
)
_META_TARGET = re.compile(r"^(?:[-*]\s*)?(?:target|目标)\s*[：:]\s*`?(?P<v>.+?)`?\s*$", re.IGNORECASE)
_META_DATE = re.compile(r"^(?:[-*]\s*)?(?:testing date|testing日期|日期|date)\s*[：:]\s*(?P<v>\d{4}-\d{2}-\d{2})", re.IGNORECASE)
_CWE = re.compile(r"\bCWE-\d+\b")
_ATTACK = re.compile(r"\bT\d{4}(?:\.\d{3})?\b")


def norm_severity(token):
    return _SEV_MAP.get((token or "").strip().lower()) or _SEV_MAP.get((token or "").strip()) or "info"


def slugify(text, fallback="case"):
    s = re.sub(r"[^a-z0-9一-鿿]+", "-", text.lower()).strip("-")
    return s or fallback


# ---------------------------------------------------------------- JSON findings

def load_json_findings(paths, warnings):
    findings = []
    for path in sorted(paths):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception as exc:  # noqa: BLE001 - report and continue
            warnings.append("{}: unreadable JSON ({})".format(path, exc))
            continue
        items = data if isinstance(data, list) else [data]
        for i, item in enumerate(items):
            if not isinstance(item, dict) or not item.get("title"):
                warnings.append("{}[{}]: missing title, skipped".format(path, i))
                continue
            f = dict(item)
            f["severity"] = norm_severity(str(f.get("severity", "")))
            f.setdefault("status", "open")
            f.setdefault("source", "json")
            f.setdefault("origin", os.path.relpath(path))
            if not f.get("id"):
                f["id"] = "{}-{:03d}".format(f["severity"][:3].upper(), len(findings) + 1)
            findings.append(f)
    return findings


# ---------------------------------------------------------------- markdown reports

def parse_markdown_report(path):
    """Split a markdown report into report meta + extracted findings (heuristic)."""
    with open(path, "r", encoding="utf-8-sig") as fh:  # utf-8-sig: tolerate BOM
        text = fh.read()
    lines = text.splitlines()

    meta = {"title": None, "target": None, "date": None}
    for line in lines[:60]:
        if meta["title"] is None and line.startswith("# "):
            meta["title"] = line[2:].strip()
        m = _META_TARGET.match(line)
        if m and meta["target"] is None:
            meta["target"] = m.group("v")
        m = _META_DATE.match(line)
        if m and meta["date"] is None:
            meta["date"] = m.group("v")

    # fallback date from filename prefix 2026-05-26_xxx.md
    if meta["date"] is None:
        m = re.match(r"(\d{4}-\d{2}-\d{2})", os.path.basename(path))
        if m:
            meta["date"] = m.group(1)
    if meta["title"] is None:
        meta["title"] = os.path.splitext(os.path.basename(path))[0]

    # slice the document into finding sections
    sections = []
    cur = None
    for line in lines:
        m = _FINDING_HEAD.match(line)
        if m:
            cur = {"title": m.group("title").strip(), "body": []}
            sections.append(cur)
        elif cur is not None:
            cur["body"].append(line)

    findings = []
    for idx, sec in enumerate(sections, 1):
        body = "\n".join(sec["body"])
        sev = "info"
        m = _SEV_INLINE.search(body) or _SEV_INLINE.search(sec["title"])
        if m:
            sev = norm_severity(m.group("sev"))
        poc = None
        m = re.search(r"```(?:bash|sh|http|python|js)?\n(.*?)```", body, re.DOTALL)
        if m:
            poc = m.group(1).strip()
        remediation = None
        m = re.search(r"(?:remediationrecommended|Remediation|Mitigation)[:：]?\s*\n((?:\s*(?:[-*\d+.]|>)[^\n]*\n?)+)", body, re.IGNORECASE)
        if m:
            remediation = m.group(1).strip()
        findings.append({
            "id": None,  # assigned after severity known
            "title": sec["title"],
            "severity": sev,
            "status": "open",
            "category": guess_category(sec["title"] + " " + body[:400]),
            "cwe": (_CWE.search(body) or [None])[0] if _CWE.search(body) else None,
            "attack": sorted(set(_ATTACK.findall(body))),
            "target": {"host": meta["target"]} if meta["target"] else None,
            "poc": poc,
            "remediation": remediation,
            "discovered": meta["date"],
            "report": os.path.relpath(path),
            "source": "markdown",
        })
    for idx, f in enumerate(findings, 1):
        f["id"] = "{}-{:03d}".format(f["severity"][:3].upper(), idx)
    return meta, findings


_CATEGORY_HINTS = [
    (r"限速|rate.?limit|brute|brute force|429", "rate-limit"),
    (r"unauthenticated|unauthorized|unauth|broken.?access|idor|privilege escalation", "access-control"),
    (r"info(暴露|泄露)|disclosure|leak|敏感|sensitive", "info-disclosure"),
    (r"injection|inject|sqli|xss|ssti|command", "injection"),
    (r"authentication|登录|auth|jwt|session|token|login", "auth"),
    (r"crypto|encryption|password|cipher|password|cryptography", "crypto"),
    (r"upload|upload|path|path.?traversal|file|file", "file-handling"),
    (r"configuration|config|misconfig|header", "configuration"),
    (r"ssrf|redirect|url", "ssrf-redirect"),
]


def guess_category(text):
    low = text.lower()
    for pat, cat in _CATEGORY_HINTS:
        if re.search(pat, low):
            return cat
    return "other"


# ---------------------------------------------------------------- aggregation

def build_payload(findings, reports_meta):
    stats = {
        "by_severity": {s: 0 for s in SEVERITIES},
        "by_status": {},
        "by_category": {},
        "by_case": {},
        "timeline": {},
        "attack_techniques": {},
        "generated": date.today().isoformat(),
        "total": len(findings),
    }
    sev_count, st_count, cat_count, case_count = Counter(), Counter(), Counter(), Counter()
    timeline, attack = Counter(), Counter()
    for f in findings:
        sev_count[f["severity"]] += 1
        st_count[f.get("status", "open")] += 1
        cat_count[f.get("category") or "other"] += 1
        case_count[f.get("case") or (f.get("target") or {}).get("host") or f.get("report") or "unscoped"] += 1
        d = f.get("discovered")
        if d:
            timeline[d] += 1
        for t in f.get("attack") or []:
            attack[t] += 1
    for i, s in enumerate(SEVERITIES):
        stats["by_severity"][s] = sev_count.get(s, 0)
    stats["by_status"] = dict(st_count.most_common())
    stats["by_category"] = dict(cat_count.most_common())
    stats["by_case"] = dict(case_count.most_common())
    stats["timeline"] = {d: timeline[d] for d in sorted(timeline)}
    stats["attack_techniques"] = dict(attack.most_common())
    # weighted risk index: crit=10 high=7 med=4 low=1 info=0.2, 0..100 of max
    weights = {"critical": 10, "high": 7, "medium": 4, "low": 1, "info": 0.2}
    open_findings = [f for f in findings if f.get("status") not in ("fixed", "false-positive")]
    score = sum(weights.get(f["severity"], 0) for f in open_findings)
    stats["risk_index"] = round(min(100.0, score * 100.0 / max(10.0, len(open_findings) * 10.0)), 1)
    return {
        "generator": "mkreport.py (ReverseOps)",
        "generated": stats["generated"],
        "reports": reports_meta,
        "findings": findings,
        "stats": stats,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="ReverseOps findings -> panel data bundle")
    ap.add_argument("--cases-root", default="work", help="root holding <case>/findings/*.json")
    ap.add_argument("--findings-dir", action="append", default=[], help="extra dir with *.json findings")
    ap.add_argument("--reports-dir", default="reports", help="dir with markdown reports")
    ap.add_argument("--include", action="append", default=[], help="extra explicit file to include")
    ap.add_argument("--out", default=os.path.join("panel", "data", "data.js"), help="output .js path")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    warnings = []
    json_paths = []
    json_paths += glob.glob(os.path.join(args.cases_root, "*", "findings", "*.json"))
    json_paths += glob.glob(os.path.join("findings", "*.json"))
    for d in args.findings_dir:
        json_paths += glob.glob(os.path.join(d, "*.json"))
    md_paths = sorted(glob.glob(os.path.join(args.reports_dir, "*.md")))
    for extra in args.include:
        (json_paths if extra.endswith(".json") else md_paths).append(extra)

    findings = load_json_findings(json_paths, warnings)

    reports_meta = []
    for path in md_paths:
        try:
            meta, found = parse_markdown_report(path)
        except Exception as exc:  # noqa: BLE001
            warnings.append("{}: parse failed ({})".format(path, exc))
            continue
        reports_meta.append({
            "file": os.path.relpath(path),
            "title": meta["title"],
            "target": meta["target"],
            "date": meta["date"],
            "findings": len(found),
            "case": meta["target"] or slugify(meta["title"]),
        })
        for f in found:
            f.setdefault("case", meta["target"] or slugify(meta["title"]))
        findings.extend(found)

    payload = build_payload(findings, reports_meta)

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    blob = json.dumps(payload, ensure_ascii=False, indent=2)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generated by scripts/mkreport.py -- do not edit (regenerate instead).\n")
        fh.write("window.REVERSEOPS_DATA = " + blob + ";\n")
    with open(os.path.splitext(args.out)[0] + ".json", "w", encoding="utf-8") as fh:
        fh.write(blob)

    if not args.quiet:
        sev = payload["stats"]["by_severity"]
        print("ReverseOps export: {} findings (C:{} H:{} M:{} L:{} I:{}) from {} report(s), {} json file(s) -> {}".format(
            len(findings), sev["critical"], sev["high"], sev["medium"], sev["low"], sev["info"],
            len(reports_meta), len(json_paths), args.out))
    for w in warnings:
        print("warn: " + w, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
