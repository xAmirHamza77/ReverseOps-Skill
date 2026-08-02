---
name: go-rust-reverse
description: Use for reverse engineering stripped Go and Rust binaries including runtime recognition, pclntab/moduel data recovery, panic strings, and idiomatic decompilation recovery.
---

# Go / Rust Binary Reverse Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md`
2. `NOW`: Confirm the sample is a Go/Rust build artifact (`file` / strings / runtime characteristics)
3. `NEXT`: Check whether GoReSym / related plugins are available
4. `ACT`: Runtime identification → symbol/metadata recovery → business logic

## Applicable scenarios

- Stripped Go malware/tools
- Rust release binaries, panic-string-driven analysis
- Language-specific methods complementary to general IDA/Ghidra workflows

## Workflow

### Go

```text
□ Identify go.buildid, leftover runtime symbols, pclntab
□ Restore function names with GoReSym / redress / IDA Go plugins
□ Pay attention to how interface, slice, and string structures appear in decompilation
□ Networking/crypto library paths: crypto/* net/http
```

### Rust

```text
□ Panic strings, rust_begin_unwind, crate path hints
□ Code bloat caused by generic instantiation; locate string xrefs first
□ Async/tokio state machines need to be understood together with cross-references
```

### Dynamic

```text
□ Frida is still usable; watch out for Go stacks and scheduling
□ Prefer log- and config-string-driven breakpoints
```

## Toolchain

| Tool | Purpose |
|------|------|
| GoReSym | Go metadata |
| IDA/Ghidra + Go/Rust plugins | Decompilation |
| radare2 | Quick strings |
| strings / rabin2 | Triage |

## References

- `references/go-rust-notes.md`
- `../reverse-engineering/go-reverse.md` `../ida-reverse/` `../ghidra-reverse/`
- seed: `field-journal/seed-002_go-malware-stripped.md`

## Routing context

**Upstream**: MASTER R33  
**Downstream**: Malicious sample workflow `malware-analysis`; general RE `reverse-engineering`

## Task completion self-check

- [ ] Did I restore key function names or an equivalent mapping?
- [ ] Did I annotate the language runtime evidence?
- [ ] Checklist?
