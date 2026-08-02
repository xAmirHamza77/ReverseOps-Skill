---
name: protocol-reverse
description: Use for authorized reverse engineering of custom binary protocols, Protobuf/gRPC, WebSocket frames, and PCAP-driven protocol recovery.
---

# Protocol Reverse Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm authorization and routine-operation boundaries
2. `NOW`: Confirm whether the task is **protocol/traffic/serialization format** reversing (pure Web parameter signing → go to `js-reverse/`)
3. `NOW`: If target network interaction is involved → run `../scripts/case-init.ps1` to complete the scope; ACT against the target is forbidden unless `auth` is granted
4. `NEXT`: Read `../tool-index.md`; bootstrap missing tools (tshark/wireshark etc. may require manual installation)
5. `ACT`: Enter workflow Phase 1 and produce a frame layout or message dictionary draft

## Applicable scenarios

- Custom TCP/UDP binary protocols
- Protobuf / gRPC / FlatBuffers / MessagePack
- WebSocket / MQTT / private RPC
- Recovering fields and state machines from PCAP / PCAPNG
- Client-server checksums, sequence numbers, encrypted frame headers

## When not to use this skill

| Situation | Where to go |
|------|------|
| Only HTTP parameter signing / JS encryption | `js-reverse/` |
| Only TLS certificate issues | `pentest-tools/` or browser proxy |
| Deep dive into an in-firmware protocol stack + emulation | `firmware-pentest/` first, then return to this skill |

## Workflow

### Phase 1 — Collection and triage

```text
□ Obtain samples: PCAP / proxy export / client logs / binaries
□ Mark direction: C→S / S→C; whether there is handshake, heartbeat, reconnect
□ Fixed header? Magic number? Length field? TLV? Fixed size?
□ Compression (zlib/gzip/lz4) or encryption (AES/ChaCha within the frame)?
□ tshark -r cap.pcap -T fields -e frame.number -e ip.src -e tcp.payload
```

### Phase 2 — Frame layout recovery

```text
□ Align multiple messages of the same type; find invariant bytes / auto-incrementing sequence numbers
□ Length field: big-endian/little-endian, including header/not including header
□ Checksums: position of CRC16/32, checksum, HMAC
□ Draw the state machine: Connect → Auth → Ready → Request/Response → Close
□ Tools: Wireshark custom dissector draft / ImHex / 010 Editor template / Kaitai Struct
```

### Phase 3 — Serialization and encryption

```text
□ Protobuf: .proto recovery (blackboxprotobuf / pbtk / protoc --decode_raw)
□ gRPC: HTTP/2 headers + protobuf body
□ Encryption: find key derivation (client so/dll/JS) → jointly with ida-reverse / js-reverse / apk-reverse
□ Replay: only within the authorized scope; start with harmless fields before sensitive operations
```

### Phase 4 — Deliverables

```text
MUST produce:
- Message type table (name / opcode / fields)
- At least 1 reproducible decoding command or script
- Evidence: raw hex excerpts + decoded results (desensitized)
```

## Toolchain

| Tool | Required | Purpose | Bootstrap |
|------|------|------|------|
| tshark / Wireshark | Strongly recommended | PCAP parsing | Manual / winget |
| Python3 | Yes | Decoding scripts | System |
| blackboxprotobuf | Optional | Unknown protobuf | pip |
| ImHex / 010 | Optional | Structure templates | Manual |
| IDA / r2 / Ghidra | As needed | Client serialization functions | See the corresponding skill |

## References

- `references/protocol-workflow.md` — frame layout and Protobuf quick reference
- Related: `../ida-reverse/` `../js-reverse/` `../firmware-pentest/` `../pentest-tools/`

## Routing context

**Upstream**: `MASTER-ROUTING` R21 · `routing.md`  
**Downstream**: Client algorithm needed → `ida-reverse`/`js-reverse`; replay exploitation → `pentest-tools`/`api-security`  
**Peer**: `malware-analysis` (C2 protocols), `digital-forensics` (traffic forensics)

## Task completion self-check

- [ ] Did I recover the message layout or state machine (rather than just pasting hex)?
- [ ] Is there a reproducible decoding command?
- [ ] Did I follow the scope / desensitization requirements?
- [ ] Did I write back to the field-journal / report Checklist?
