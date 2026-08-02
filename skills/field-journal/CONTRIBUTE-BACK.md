# Community evolution: contributing experience back to the main repository

## How the mechanism works

Each time you finish a project and generate a field-journal entry, the AI will ask:

```
✅ Experience recorded to field-journal/

📤 Contribute this experience to the community main repository?
- Data has been anonymized per template requirements (domains/IPs/tokens/PII replaced)
- Only new files under field-journal/ will be submitted
- Your private files (tool-index, scope, findings, etc.) will NOT be submitted
- After contributing, other users can also reuse your experience

Reply "yes" to submit, "no" to skip.
```

## Contribution flow

```text
1. AI generates a field-journal entry (already anonymized)
2. AI asks the user whether to contribute
3. User agrees → AI performs:
   a. Verify anonymization is complete (double-check: no real domains/IPs/tokens)
   b. Check for duplicates against existing entries in the main repo (reads only _index.md, ~200 tokens)
   c. If not a duplicate → create a PR to the main repository
   d. PR title format: [field-journal] YYYY-MM-DD scenario type - keywords
4. GitHub Actions auto-review:
   - ✓ Only field-journal/*.md modified
   - ✓ No prompt-injection markers
   - ✓ No un-anonymized API keys/tokens
   - ✓ No executable code
   - ✓ File size < 50KB
5. Review passes → auto-merge (no manual action needed from repo maintainers)
6. Review fails → automated comment explains the reason; the PR stays open pending fixes
```

### Security safeguards

| Threat | Defense |
|--------|---------|
| Modifying non-journal files | Actions checks a changed-files whitelist |
| Prompt injection | Regex detection of markers like "ignore previous"/"you are now" |
| Malicious code in disguise | Detects `#!/`, `import`, `exec(`, `eval(`, etc. |
| Un-anonymized tokens | Regex detection of AWS key/npm token/GitHub token patterns |
| Junk data | 50KB per-file cap |
| Spam PR floods | GitHub's built-in rate limit + optional CODEOWNERS review |

## Technical implementation

### Method 1: GitHub CLI (recommended)

```bash
# 1. Fork the main repo (if not forked yet)
gh repo fork &lt;your-GitHub-username&gt;/&lt;repo-name&gt; --clone=false

# 2. Create a contribution branch locally
git checkout -b contribute/journal-YYYY-MM-DD-keyword

# 3. Add only field-journal files
git add skills/field-journal/YYYY-MM-DD_*.md
git add skills/field-journal/_index.md

# 4. Commit
git commit -m "[field-journal] scenario type: keyword summary"

# 5. Push to the fork
git push origin contribute/journal-YYYY-MM-DD-keyword

# 6. Create the PR
gh pr create --repo &lt;your-GitHub-username&gt;/&lt;repo-name&gt; \
  --title "[field-journal] YYYY-MM-DD scenario type - keywords" \
  --body "## Contribution\n- Scenario: xxx\n- Keywords: xxx\n- Anonymization confirmed: ✓\n\n## Data-safety statement\nThis entry has been anonymized per the template and contains no real target information."
```

### Method 2: Direct push (if the user has write access to the main repo)

```bash
git checkout -b contribute/journal-YYYY-MM-DD-keyword
git add skills/field-journal/YYYY-MM-DD_*.md
git add skills/field-journal/_index.md
git commit -m "[field-journal] scenario type: keyword summary"
git push origin contribute/journal-YYYY-MM-DD-keyword
gh pr create --repo &lt;your-GitHub-username&gt;/&lt;repo-name&gt; \
  --title "[field-journal] YYYY-MM-DD scenario type - keywords" \
  --body "Anonymization confirmed: ✓"
```

## Deduplication rules (low token cost)

Before submitting, the AI **only needs to read `_index.md`** for dedup — it does not need to read the full content of every journal entry.

### Dedup flow

```text
1. Read the main repo's field-journal/_index.md (usually just a few dozen lines)
2. Extract this entry's: scenario classification + keyword list
3. Search _index.md for existing entries under the same scenario
4. Keyword matching:
   - Overlap ≥ 3 keywords → treat as duplicate, do not submit
   - Overlap of 1-2 keywords → likely a variant, OK to submit
   - No overlap → brand-new scenario, submit directly
```

### Why this is sufficient

- `_index.md` format is fixed: `- [date] short name — keywords: k1, k2, k3`
- One line per entry; 100 entries are only 100 lines
- The AI only does string matching, no need to understand full content
- Token cost: reading _index.md ≈ 200-500 tokens (vs reading all journals ≈ 10000+ tokens)

### If _index.md is unavailable

If the main repo's _index.md cannot be fetched (network issues etc.), submit directly and let the main-repo maintainers deduplicate manually.

## Files allowed in a PR

**Whitelist** (only these files may appear in a PR):
- `skills/field-journal/YYYY-MM-DD_*.md` (new experience entries)
- `skills/field-journal/_index.md` (index update)

**Blacklist** (must NEVER appear in a PR):
- `tool-index.*` (contains the user's local paths)
- `pentest-tools/templates/scope.md` (contains target info)
- `pentest-tools/templates/findings.md` (contains vulnerability details)
- `pentest-tools/templates/progress.md` (contains operation records)
- `.claude/` (user configuration)
- `.kiro/` (user configuration)
- Any `.env`, `*.key`, `*.pem` files

## Second anonymization check

Before submitting, the AI must scan the files to be committed and confirm they do NOT contain:

- [ ] Real domains (other than `example.com`/`target.example.com`)
- [ ] Real IPs (other than `10.x.x.x`/`192.168.x.x`)
- [ ] Raw tokens/cookies/API keys
- [ ] Raw phone numbers/emails/usernames
- [ ] Company/product names (if it was an SRC target)

If any of these is found un-anonymized, stop the submission and prompt the user to fix it.

## Value to you

- Your contributed experience helps other users avoid the same pitfalls
- The richer the main repo's field-journal, the smarter every user's AI becomes
- Your contribution is preserved in _index.md (anonymous — only scenario and keywords)
