# [Date] [Project short name]

## Scenario classification
<!-- APK reversing / JS signing / binary analysis / pentest / CTF / packet capture analysis / other -->

## Target overview
<!-- One sentence describing what was done -->

## Scope summary (anonymized)
<!-- auth.basis / network_profile.mode / in_scope types (do NOT write real domains/IPs) -->
- auth_basis:
- network_profile:
- asset_types: []

## Roles
<!-- lead / cie / cpe / cre / … see skills/ops/role-map.md -->
- lead_role: lead
- specialists: []

## Full execution chain
<!-- Complete steps from receiving the target to producing results, including detours taken -->

1. ...
2. ...
3. ...

## Evidence chain summary (anonymized)
<!-- Up to 3 entries: E-id + command pattern + conclusion type; full evidence stays in the user project -->
| E-id | source_type | Reusable command pattern | Linked Finding |
|------|-------------|--------------------------|----------------|
| E-001 | | | F-001 |

## Finding / Path summary
- top_finding:
- path_type: attack | callflow | solve
- path_one_liner:

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| ... | ... | ... | ... |

## Toolchain findings
<!-- Which tools were used, which worked well, which had issues, version compatibility problems -->

## Key code/commands

```
<!-- Paste the key commands, hook scripts, decryption logic actually used -->
```

## Improvement suggestions for this package
<!-- Was routing accurate? Is bootstrap missing anything? Do docs need supplementing? Should new tools be added to the manifest? -->

## Reusable patterns/script snippets
<!-- If you produced reusable hook scripts, decryption logic, or bypass techniques, paste them here -->

## Evolution actions
<!-- Which updates were actually performed with this write-back -->
- [ ] Updated routing matrix
- [ ] Updated tool-index
- [ ] Updated bootstrap-manifest
- [ ] Updated sub-skill docs
- [ ] Added pitfalls record
- [ ] No update needed

## Environment info
<!-- Record the key environment at the time -->
- OS:
- Tool versions:
- Target platform/version:

## Anonymization requirements

> **This file may sync to a remote with the repository and MUST be anonymized. Full spec in [`anonymization.md`](anonymization.md) (placeholder master table + auto-detection script).**

- Target domains/IPs: replace with `{target_domain}` / `{target_ip}` (see `anonymization.md` for details)
- Real URL paths: keep the structure, replace the domain
- Tokens/Cookies/passwords/JWT/API keys: use `{token}` / `{password}` / `{api_key}` placeholders
- Usernames/phone numbers/emails: use `{username}` / `{phone}` / `{user_email}` placeholders
- Internal IPs/ports: keep the first two octets of internal ranges (`10.0.x.x`)
- Vulnerability payloads: technical content may be kept, but replace target-identifying parameters (e.g. `?id={user_id}`)

Before committing, run the regex sweep against the **Field-Journal mandatory checklist** at the end of `anonymization.md`.

If this is a private repo and confirmed it will never go public, the above limits may be relaxed, but anonymization is still recommended.

## Index sync (final step before committing)

After writing this journal entry, you MUST sync `_index.md`:

1. Add a line (with date and keywords) under the matching section in "By scenario"
2. Append this filename under the matching technique in "High-frequency success patterns (by technique)"
3. Append this filename under the matching entity in "Entity inverted index (by target traits)"
4. Update the totals and "last updated" date in "Cumulative statistics"

---
<!-- [Evolution stats] Package cumulative completed projects: N | New patterns added: X | Toolchain issues fixed: Y -->
<!-- [Community contribution] After completion, ask the user whether to PR to the main repository. See CONTRIBUTE-BACK.md -->
