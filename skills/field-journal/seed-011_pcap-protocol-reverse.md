# [Seed] PCAP custom binary protocol reversing

## Scenario classification
Packet capture analysis / protocol reversing

## Target overview
An IoT device/desktop client speaks a custom TCP binary protocol (not HTTP). Given a captured PCAP, reconstruct the frame structure, field semantics, and encryption layer (if any), then write a local client/server to reproduce it.

## Full execution chain

1. Open the PCAP in Wireshark; do basic statistics first
   - `Statistics → Conversations` for IP/port pairs
   - `Statistics → I/O Graphs` for data cadence
2. Find the real application-layer streams (strip standard layers like TLS)
3. On a TCP stream → `Follow → TCP Stream` → switch to RAW mode → export
4. Binary-level observation: are the first few bytes of each frame a fixed magic / length field?
   ```bash
   xxd dump.bin | head -20
   ```
5. Look for patterns in hex: fixed header, length, TLV, CRC
6. Write a Python parser (struct + scapy) and decode frame by frame
7. In parallel, decompile the binary to cross-check protocol fields (inspect the structs around send/recv in IDA / Ghidra)
8. Verify: run your own client, send one frame → server responds consistently

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Wireshark doesn't recognize the protocol, shows only "Data" | Private protocol, no dissector | Write a Wireshark Lua dissector, or analyze offline in Python | 30min |
| Looks random; every frame differs | There is a compression or encryption layer | Entropy analysis (`ent dump.bin`) to judge whether encrypted; look for nonce/IV fields | 1h |
| Length field math doesn't work out | Length may be little-endian / big-endian / include or exclude itself | Collect frames of different lengths and solve the equations | 40min |
| TLS captured but can't decrypt | Client doesn't emit an SSLKEYLOGFILE | Hook at the client process layer (Frida on ssl_read/ssl_write) to grab plaintext | 1.5h |
| Data correct but server doesn't respond | Protocol carries an incrementing seq/nonce; replays are rejected | Figure out the seq computation (usually a hash of the previous frame or an incrementing counter) | 50min |

## Toolchain findings

- **Wireshark Lua Dissector**: under 100 lines turns a private protocol into Wireshark visualization
- **scapy**: subclass `Packet` and you have a Python parser
- **Kaitai Struct**: describe the protocol in YAML, generate parsers for multiple languages (Python/Java/C++/JS) — great for long-term reuse
- **NetworkMiner** beats Wireshark for after-the-fact forensics (auto file reassembly, credential detection)
- **ent / binwalk -E** for entropy; >7.5 almost certainly means encryption

## Key code/commands

scapy custom protocol example (TLV):

```python
from scapy.all import *

class MyMsg(Packet):
    name = "MyProto"
    fields_desc = [
        StrFixedLenField("magic", b"\xab\xcd", 2),
        ByteField("version", 1),
        ByteField("type", 0),
        LenField("length", None, fmt="H"),     # H = uint16 BE
        XIntField("seq", 0),
        StrLenField("payload", "", length_from=lambda p: p.length - 8),
        XShortField("crc", 0),
    ]

# Parse the PCAP
pkts = rdpcap('dump.pcap')
for p in pkts:
    if TCP in p and p[TCP].dport == 9527 and p.payload:
        msg = MyMsg(bytes(p[TCP].payload))
        msg.show()
```

Kaitai Struct YAML (first choice for long-term projects):

```yaml
# myproto.ksy
meta:
  id: myproto
  endian: be
seq:
  - id: magic
    contents: [0xab, 0xcd]
  - id: version
    type: u1
  - id: type
    type: u1
  - id: length
    type: u2
  - id: seq_no
    type: u4
  - id: payload
    size: length - 8
  - id: crc
    type: u2
```

Entropy analysis:

```bash
binwalk -E dump.bin             # entropy graph
ent dump.bin                    # numeric value
```

## Improvement suggestions for this package

- Add a "custom protocol reversing, 4-step method" section to `reverse-engineering/platforms.md`
- Add a new `reverse-engineering/references/kaitai-cheatsheet.md` quick reference
- Add scapy (pip) and binwalk to the bootstrap manifest

## Reusable patterns/script snippets

**Custom protocol reversing, 4-step method**:

```text
1. Look at cadence (I/O graph + Conversations to find session boundaries)
2. Find frame boundaries (magic / length / terminator)
3. Split fields (fixed header, length, payload, checksum)
4. Verify encryption (entropy + find nonce + reverse the send function in the binary)
```

**Small trick for finding the frame length**:

Export all PSH packets of a stream → look at each TCP segment's total length, and test whether a length field (try offsets i, i+1, i+2) predicts the segment length.

## Evolution actions
- [ ] Add a protocol reversing section to reverse-engineering/platforms.md
- [ ] Add scapy / binwalk to the bootstrap-manifest
- [ ] Add a Kaitai Struct quick reference

## Environment info
- Kali / Ubuntu, Wireshark 4.x, Python 3.10+, scapy 2.5
- Target protocol: custom TCP binary (with TLV / length prefix)
- Encryption layer: case-dependent (AES-CTR / ChaCha20 are common)

## Anonymization requirements
This entry is seed data, written from public protocol-reversing methodology; no real products involved.
