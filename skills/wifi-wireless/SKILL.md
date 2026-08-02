---
name: wifi-wireless
description: Use for authorized wireless security assessment including Wi-Fi capture, WPA handshake analysis, rogue AP detection research, and lab-only deauth testing.
---

# Wi-Fi / Wireless Security

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read precedent-pentest; **wireless attacks carry high legal risk** — written authorization and a defined physical scope are mandatory
2. `NOW`: The scope must specify target SSID/BSSID/site; scanning neighboring networks is prohibited
3. `NEXT`: Verify adapter monitor-mode capability
4. `ACT`: Recon → capture → analysis (lab-first)

## Applicable Scenarios

- Authorized Wi-Fi security assessment
- WPA/WPA2 handshake capture and offline assessment
- Rogue AP / phishing hotspot detection research
- Enterprise wireless isolation and captive-portal security

## Workflow

```text
□ iwconfig / airmon-ng to enter monitor mode (in a lawful environment)
□ airodump-ng to lock onto the target BSSID channel
□ Handshake or PMKID capture (target only)
□ hashcat/aircrack to offline-assess password policy
□ Report: encryption types, isolation, portal bypass, recommendations
```

## Toolchain

| Tool | Purpose |
|------|---------|
| aircrack-ng suite | Capture/assessment |
| hcxdumptool / hcxtools | PMKID |
| hashcat | Password assessment |
| Wireshark | Management-frame analysis |

## References

- `references/wireless-lab-rules.md`
- `../pentest-tools/` `../attack-chain/` (proximity-access chapter)

## Routing Context

**Upstream**: MASTER R29  
**MUST NOT**: unauthorized deauth attacks; operating against non-client networks

## Task Completion Checklist

- [ ] Was the target BSSID strictly locked?
- [ ] Does the report include hardening recommendations?
- [ ] Checklist?