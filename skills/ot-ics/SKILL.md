---
name: ot-ics
description: Use for authorized OT/ICS security assessment covering Purdue model zoning, PLC/SCADA exposure, industrial protocol discovery, and safe passive-first evaluation.
---

# OT / ICS Security

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-pentest.md` — **mis-operation in ICS environments can cause physical harm**
2. `NOW`: The written authorization must state clearly: site, network segments, and whether active scanning/writing registers is permitted
3. `NOW`: case-init; default to **passive-first**; no writes to PLCs before `ready_for_act`
4. `NEXT`: tool-index; most ICS tools require manual setup and an isolated lab network
5. `ACT`: Asset and zone identification → attack surface → read-only verification

## Applicable Scenarios

- ICS/SCADA/DCS security assessment (authorized)
- Purdue model zoning and cross-zone channels
- Exposure of Modbus/DNP3/S7/EtherNet/IP and similar protocols
- Engineering workstations, HMIs, historians, jump hosts
- IT/OT convergence boundaries (firewall rules, data diodes)

## Safety Ground Rules (MUST)

```text
MUST NOT, unless explicitly permitted:
- Write coils/registers on PLCs
- Run high-rate scans across production OT networks
- disrupt paths related to safety instrumented systems (SIS)
Prefer: read-only identification, traffic mirroring, offline firmware/configuration analysis
```

## Workflow

### Phase 1 — Zones & Assets

```text
□ Purdue L0–L5 sketch: field devices → control → supervision → site DMZ → enterprise
□ Asset inventory: PLC/RTU/HMI/engineering station/historian/jump host
□ Protocol and port baseline (authorized segments only)
```

### Phase 2 — Passive & Read-Only

```text
□ SPAN/mirrored PCAP → protocol-reverse / Wireshark ICS dissectors
□ Offline audit of configurations and project files (TIA/RSLogix exports, etc.)
□ Record default passwords and cleartext protocols (Modbus has no authentication) as Findings; do not write or change values
```

### Phase 3 — Restricted Active (Only When Authorized)

```text
□ Low-rate identification during maintenance windows
□ Prefer read-only function codes
□ Evidence at every step; stop immediately and notify if anything abnormal occurs
```

### Phase 4 — Firmware/Patch Surface

```text
□ Controller firmware versions → CVE mapping (never blindly flash firmware)
□ Combine with firmware-pentest for offline image analysis
```

## Toolchain

| Tool | Purpose | Notes |
|------|---------|-------|
| Wireshark ICS dissectors | Passive parsing | Mirrored traffic |
| Nmap NSE (restricted) | Identification | Rate and time-window limits |
| Claroty/Nozomi, etc. | Asset discovery | Commercial/on-site |
| PLC vendor engineering software | Configuration audit | Offline preferred |
| binwalk / Ghidra | Firmware | Offline |

## References

- `references/ot-safe-assessment.md`
- `../firmware-pentest/` `../protocol-reverse/` `../network` via pentest-tools

## Routing Context

**Upstream**: MASTER R28  
**Downstream**: deep firmware analysis `firmware-pentest`; protocols `protocol-reverse`; IT lateral movement `windows-ad`/`attack-chain`  
**Peer**: do not run generic web scanners with default parameters against OT

## Task Completion Checklist

- [ ] Did you default to passive/read-only and record authorization boundaries?
- [ ] Did you avoid write operations on control loops (unless explicitly permitted)?
- [ ] Do Findings include physical/process impact descriptions?
- [ ] Checklist / journal?