---
name: threat-hunting
description: Use for blue-team threat hunting, detection engineering with Sigma/YARA, SIEM query design, and incident detection validation.
---

# Threat Hunting & Detection Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Confirm blue-team/hunting authorization and data-source scope (SIEM, EDR exports)
2. `NOW`: Define a clear hypothesis before querying data; avoid blindly chasing alerts
3. `NEXT`: Tools and data-access methods
4. `ACT`: Hypothesis → query → validate → codify into rules

## Applicable Scenarios

- Threat hunting (hypothesis-driven)
- Sigma / YARA detection engineering
- Alert tuning, false-positive analysis
- With `malware-analysis/`: sample-side IOCs → this skill turns them into deployed detections
- With `digital-forensics/`: case artifacts → lateral hunting

## Workflow

### 1. Build the Hypothesis

```text
Example: attackers are using living-off-the-land techniques for lateral movement
→ Data sources: Sysmon 1/3/10, Windows Security 4624/4648
→ Success criteria: anomalous parent processes or rare account logon sources found
```

### 2. Query & Stack

```text
□ Baseline: normal admin activity windows and hosts
□ Anomalies: new services, encoded PowerShell, unusual outbound traffic
□ Correlation: same account logging into many hosts in a short window
```

### 3. Codify into Rules

```yaml
# For the Sigma skeleton see malware-analysis; this skill emphasizes:
# - False-positive surface
# - Data-source field mapping
# - Response playbook linkage
```

### 4. Validation

```text
□ Atomic tests (Atomic Red Team) only in an authorized lab
□ Replay historical logs to validate recall
```

## Toolchain

| Tool | Purpose |
|------|---------|
| Sigma CLI / sigmac | Rule conversion |
| YARA | Files/memory |
| SIEM (ELK/Splunk, etc.) | Queries |
| osquery | Endpoint hunting |
| Atomic Red Team | Detection validation (lab) |

## References

- `references/hunting-loop.md`
- `../malware-analysis/references/yara-sigma-rules.md`
- `../digital-forensics/`

## Routing Context

**Upstream**: MASTER R27  
**Downstream**: confirmed intrusion → forensics; malicious samples → malware-analysis  
**MUST NOT**: run attack simulation in production without authorization

## Task Completion Checklist

- [ ] Is there a clear hypothesis and conclusion?
- [ ] Do rules document their false-positive surface and data sources?
- [ ] Checklist?