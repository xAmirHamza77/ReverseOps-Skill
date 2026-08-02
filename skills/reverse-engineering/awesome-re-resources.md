# Reverse Engineering Reference Resources

> Curated from multiple awesome lists, sorted by practical usefulness. AI can consult these resources for methodology and tool guidance during reverse analysis.

---

## General Resource Collections

| Project | Stars | Coverage | Link |
|------|-------|------|------|
| **awesome-reversing** (tylerha97) | 3k+ | RE tools/books/courses/exercises | https://github.com/tylerha97/awesome-reversing |
| **awesome-reverse-engineering** (alphaSeclab) | 4k+ | 3500+ tools + 2300 articles, all platforms | https://github.com/alphaSeclab/awesome-reverse-engineering |
| **Reverse-Engineering** (mytechnotalent) | 10k+ | Free tutorials: x86/x64/ARM/AVR/RISC-V | https://github.com/mytechnotalent/Reverse-Engineering |
| **awesome-malware-analysis** (rshipp) | 12k+ | Malware analysis tools/resources | https://github.com/rshipp/awesome-malware-analysis |
| **reversingBits** | — | RE/binary analysis cheatsheet collection | https://github.com/mohitmishra786/reversingBits |
| **awesome-arm-exploitation** | — | ARM exploitation resources (videos/articles/books) | https://github.com/HenryHoggard/awesome-arm-exploitation |
| **Binary-Analysis-Automation** | — | Automated binary analysis (ML/scripts/static/dynamic) | https://github.com/user1342/Awesome-Binary-Analysis-Automation |

---

## ELF / Linux Reversing

| Resource | Description | Link |
|------|------|------|
| **libelfmaster** | Secure ELF parsing library (forensics/malware reconstruction) | https://github.com/elfmaster/libelfmaster |
| **ELF Specification** | Official ELF format documentation | https://refspecs.linuxfoundation.org/elf/elf.pdf |
| **Linux Internals** | /proc filesystem, memory layout, syscalls | https://0xax.gitbooks.io/linux-insides/ |
| **Compiler Explorer** | See online what C/C++/Rust/Go compiles into as assembly | https://godbolt.org/ |

---

## ARM / AArch64

| Resource | Description | Link |
|------|------|------|
| **ARM Official Architecture Manuals** | Complete instruction set reference | https://developer.arm.com/documentation |
| **Azeria Labs** | ARM assembly/exploitation tutorials (best intro) | https://azeria-labs.com/writing-arm-assembly-part-1/ |
| **ARM64 syscall table** | Linux AArch64 syscall numbers | https://arm64.syscall.sh/ |
| **QEMU user-mode emulation** | Analyze ARM binaries without real hardware | `qemu-aarch64 -strace ./binary` |

---

## Malware Analysis

| Resource | Description | Link |
|------|------|------|
| **YARA** | Malware signature-matching rules | https://github.com/VirusTotal/yara |
| **Volatility 3** | Memory forensics framework | https://github.com/volatilityfoundation/volatility3 |
| **FLOSS** | Automatically extracts obfuscated strings | https://github.com/mandiant/flare-floss |
| **Detect It Easy (DiE)** | File type/packer/compiler identification | https://github.com/horsicq/Detect-It-Easy |
| **PE-bear** | PE file analyzer | https://github.com/hasherezade/pe-bear |
| **Capa** | Automatically identifies binary capabilities (network/file/crypto etc.) | https://github.com/mandiant/capa |
| **Unpacker** | Generic unpacking framework | https://github.com/malwaretech/UnpackerFramework |

---

## Dynamic Analysis / Sandboxes

| Resource | Description | Link |
|------|------|------|
| **Frida** | Cross-platform dynamic instrumentation | https://frida.re/ |
| **strace** | Linux syscall tracing | Built into the OS |
| **ltrace** | Library call tracing | Built into the OS |
| **QEMU** | User-mode/system-mode emulation | https://www.qemu.org/ |
| **Unicorn** | Programmable CPU emulation framework | https://www.unicorn-engine.org/ |
| **Qiling** | High-level binary emulation framework | https://qiling.io/ |
| **angr** | Symbolic execution + binary analysis | https://angr.io/ |
| **Triton** | Dynamic binary analysis framework | https://triton-library.github.io/ |

---

## Deobfuscation / Unpacking

| Resource | Description | Link |
|------|------|------|
| **UPX** | The most common packer; unpack with `upx -d` | https://upx.github.io/ |
| **unipacker** | Generic PE unpacker | https://github.com/unipacker/unipacker |
| **de4dot** | .NET deobfuscator | https://github.com/de4dot/de4dot |
| **JADX** | Android DEX deobfuscation | https://github.com/skylot/jadx |
| **JEB** | Commercial Android/ARM decompiler | https://www.pnfsoftware.com/ |
| **Miasm** | RE framework (IR/symbolic execution/deobfuscation) | https://github.com/cea-sec/miasm |
| **OLLVM deobfuscation** | Countering control-flow flattening/bogus control flow | Recover via angr/Triton symbolic execution |

---

## Online Analysis Platforms

| Platform | Description | Link |
|------|------|------|
| **VirusTotal** | Multi-engine scanning + behavior analysis | https://www.virustotal.com/ |
| **Joe Sandbox** | Automated malware analysis | https://www.joesandbox.com/ |
| **ANY.RUN** | Interactive online sandbox | https://any.run/ |
| **Hybrid Analysis** | Free malware analysis | https://www.hybrid-analysis.com/ |
| **Compiler Explorer** | Inspect compiler output | https://godbolt.org/ |
| **Dogbolt** | Multi-decompiler comparison (IDA/Ghidra/Binary Ninja) | https://dogbolt.org/ |

---

## Learning Paths

### Beginner (0-3 months)

1. [Reverse Engineering for Beginners](https://beginners.re/) — Free ebook
2. [Azeria Labs ARM Tutorials](https://azeria-labs.com/) — ARM assembly fundamentals
3. [Nightmare](https://guyinatuxedo.github.io/) — CTF reverse/pwn tutorials
4. [crackmes.one](https://crackmes.one/) — RE practice problems

### Intermediate (3-12 months)

1. [Practical Binary Analysis](https://practicalbinaryanalysis.com/) — Hands-on binary analysis
2. [The IDA Pro Book](https://nostarch.com/idapro2.htm) — In-depth IDA usage
3. [Malware Unicorn RE101](https://malwareunicorn.org/workshops/re101.html) — Malware reversing
4. [pwnable.kr](http://pwnable.kr/) / [pwnable.tw](https://pwnable.tw/) — Pwn practice

### Advanced

1. [Modern Binary Exploitation](https://github.com/RPISEC/MBE) — RPI course
2. [How to Hack Like a Ghost](https://nostarch.com/how-hack-ghost) — Advanced penetration testing
3. [Windows Internals](https://docs.microsoft.com/en-us/sysinternals/) — Windows kernel
4. Hands-on: analyze real malware samples (MalwareBazaar)

---

## Cheatsheets

| Cheatsheet | Link |
|--------|------|
| x86/x64 instruction reference | https://www.felixcloutier.com/x86/ |
| ARM64 instruction reference | https://developer.arm.com/documentation/ddi0602/latest |
| Linux syscall table (x64) | https://blog.rchapman.org/posts/Linux_System_Call_Table_for_x86_64/ |
| Linux syscall table (ARM64) | https://arm64.syscall.sh/ |
| GDB cheatsheet | https://darkdust.net/files/GDB%20Cheat%20Sheet.pdf |
| radare2 cheatsheet | This package: `radare2/references/cheatsheet.md` |
| IDA hotkeys | https://hex-rays.com/products/ida/support/freefiles/IDA_Pro_Shortcuts.pdf |
| Ghidra shortcuts | Built into Ghidra: Help → Keyboard Shortcuts |
