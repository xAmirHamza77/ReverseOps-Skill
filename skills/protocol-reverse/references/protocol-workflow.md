# Protocol reverse cheatsheet

> Applies to: `protocol-reverse` skill · 2026-07-18

## Common layout patterns

| Pattern | Characteristics | Tips |
|------|------|------|
| Fixed header + body | First 2/4 bytes are the length | Watch whether the header length is included |
| Magic number | Fixed `0xDEAD`, etc. | Helps stream resynchronization |
| TLV | Repeated type-length-value | The type enumeration is the message dictionary |
| Protobuf | Field numbers as varints | `protoc --decode_raw` |
| Encrypted frames | High entropy, no plaintext URLs | Look for nonce/IV neighborhoods first |

## Minimal Python skeleton

```python
import struct
def parse_frame(buf: bytes):
    magic, length, msg_type = struct.unpack_from(">IHI", buf, 0)
    body = buf[10:10+length]
    return {"magic": magic, "type": msg_type, "body": body}
```

## Extract TCP payloads from PCAP

```bash
tshark -r cap.pcap -Y "tcp.port==4433" -T fields -e tcp.payload | head
```
