# Modern Web Range Friction → Skill Hardening

> Date: 2026-07-18  
> Scenario: Legitimate Public Cyber Range (PortSwigger scanner-eval / OWASP Juice Shop demo class)  
> Sanitisation: No real production domain exploitation details

## Conclusion (For Next Agent)

**Not fully exploited ≠ Skill package invalid.** MUST deliver: Surface map, Sink list, Latch reasons, Evidence (observed|validated).  
Failures must be recorded in timeline and fed back into playbook.

## Lessons Learned & Pitfalls

| Pitfall | Symptom | Remediation / Discipline |
|---------|---------|---------------------------|
| case-init authorization corrupted | Status becomes strange string after `-AuthGranted` | Allowed values only: pending/granted/denied/unknown; use `PSBoundParameters` to check AuthStatus |
| lab_only not ready | ready_for_act false when network=lab_only | lab_only + granted + assets → ready |
| Windows curl `[]` | `bad range in position` | **MUST** use `curl.exe --globoff` |
| append-evidence special characters | RawExcerpt containing quotes/XML throws error | Block indentation + strip control characters |
| Public demo 503 | Juice Shop Heroku down | Switch to local Docker or other authorized targets; do not linger |
| DOM XSS false positive | innerHTML sink flagged as validated | Requires HTTP 200 non-numeric body to exploit; otherwise mark as observed |
| agent-browser ref expired | Click failure | Re-snapshot after page DOM changes |

## Reusable Patterns

1. Surface → Sink → Chain (See `pentest-tools/references/client-side-lab-playbook.md`)  
2. Inventory class `innerHTML = fetchBody`: Prove sink first, then search for HTTP 200 non-numeric response  
3. Dual verification via static rg sink search + agent-browser eval  

## Toolchain

- case-init / case-guard / append-evidence / smoke  
- agent-browser (CDP)  
- curl --globoff  

## Environment

- Windows + PowerShell 5.1  
- Docker Desktop daemon potentially not ready  
