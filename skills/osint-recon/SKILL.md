---
name: osint-recon
description: |
  Passive reconnaissance and attack-surface mapping. Subdomain enumeration, certificate transparency,
  historical snapshots, fingerprinting and third-party asset discovery — passive/semi-passive methods first,
  zero target contact until the gate allows it.
  Trigger keywords: OSINT, passive recon, attack surface, subdomain enum, cert transparency, favicon hash, Wayback, GitHub dork, asset mapping, 被动info收集, attack surface.
---

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: confirm scope.md exists with `auth.status=granted` (passive recon still needs scope — the mapping
   output drives later ACT legality; see `../ops/scope-contract.md`)
2. `NOW`: record `network_profile` in scope; during the passive phase only third-party data sources may be
   queried (crt.sh / Wayback / DNS / CA logs) — no direct contact with the target
3. `NEXT`: read `../tool-index.md` for real paths of subfinder / amass / httpx / naabu; if missing, go through
   the bootstrap manifest
4. `ACT`: run the pipeline below; append every batch to the timeline + Evidence (`../scripts/append-evidence.ps1`)
5. `ACT`: land the asset inventory in `work/<case>/attack-surface.md`, then hand off to `pentest-tools/`
   (active scanning) or `reporting/` (dashboard + report)

# osint-recon — passive recon & attack-surface mapping

## Principles

- **Passive first**: subdomains, certificates, snapshots, buckets, favicons — all from third-party sources,
  target sees nothing
- **Fully reproducible**: every asset records its source and fetch time; everything enters the Evidence chain
- **Produce decision material only**: asset list + priority + hypotheses. No "I ran every tool" noise.

## Pipeline (in order — later stages consume earlier output)

### 1. Root asset confirmation

| Action | Tools / sources | Output |
|--------|-----------------|--------|
| WHOIS / ASN / netblock owner | `whois`, bgp.he.net, RDAP | org + ASN + CIDR list |
| Root domains & brand variants | cert CN/SAN, search engines, trademarks | root domains |

### 2. Subdomain enumeration (passive)

```bash
subfinder -d target.com -all -silent -o subs.txt
amass enum -passive -d target.com -o amass.txt
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u
```

Dedupe and merge → `subs.all.txt`. **Resolve only, do not probe.**

### 3. History & exposure

| Source | What to look for |
|--------|------------------|
| Wayback Machine CDX | endpoints that are down but not decommissioned, legacy parameters, backup paths |
| GitHub / GitLab code search | leaked tokens, internal hostnames, CI configs (dork on the in-scope org name) |
| Certificate transparency logs | naming patterns for staging / dev / vpn |
| Public buckets / storage | `s3://<brand>-*` name guessing + public indexes (HEAD/GET public objects only) |

### 4. Fingerprinting (semi-passive, low-rate direct contact)

```bash
httpx -l subs.all.txt -title -tech-detect -status-code -rate-limit 30 -o live.txt
```

- favicon mmh3 hash → Shodan/FOFA lookup for sibling infrastructure
- TLS cert fingerprint clustering → group assets sharing certs

### 5. Attack-surface convergence

Produce `work/<case>/attack-surface.md`:

```text
# Attack Surface — target.com
## Tier 1 (high value / directly reachable)
- staging.target.com (200, "Admin", tech: nginx+laravel) — hypothesis: weak-auth admin panel
## Tier 2
- ...
## Exclusions (out of scope — ACT forbidden)
- *.cdn-target.com — owned by the CDN vendor
```

**Exclusions must be written out explicitly** — this is part of the scope gate and stops later skills
from wandering outside authorization.

## Handoff

| Next step | Goes to |
|-----------|---------|
| Active scanning / vuln verification | `pentest-tools/`, `exploit-validation/` |
| Cloud / container assets deep dive | `cloud-k8s/` |
| Charts, reports, panel | `reporting/` + `scripts/mkreport.py` |

## Anti-patterns

- Running full-port `nmap` during the passive phase — that's ACT; pass the scope gate first
- Enumeration results not written to the timeline — no way to reconstruct "what was known when"
- Mixing out-of-scope assets into the inventory — one line of sloppiness is an unauthorized test
