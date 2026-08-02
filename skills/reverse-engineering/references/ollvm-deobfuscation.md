# OLLVM Deobfuscation / Obfuscator-LLVM Deobfuscation

> OLLVM deobfuscation workflow for APK .so, ELF binaries, and control flow flattening scenarios.
> Tool and variant information based on 2026 community active project research.
> Applications: Android NDK hardening, CTF reverse engineering, packed .so analysis, commercial obfuscator counter-measures.

---

## 0. Quick Decision: Which tool should I use?

Match your environment and target obfuscation type directly using this matrix:

| Your Situation | Primary Tool | Alternative | Description |
|---------|---------|------|------|
| IDA Pro 7.5-7.7 + Hex-Rays, want one-click deflattening | **obpo-plugin** | d810-ng | obpo uses microcode + data flow + concolic execution for maximum effectiveness; cloud plugin (requires internet connection, core is closed-source) |
| IDA Pro (any recent version), want local all-in-one deobfuscation | **d810-ng** | Original D-810 | Local, open-source, integrated with Z3, supports multiple OLLVM/Tigress/Hodur/Approov variants |
| Have Binary Ninja | **ollvm-breaker** | — | Targeted for Android .so real-world samples (e.g. libvdog hardened samples) |
| No IDA/BN, pure script, targeting x86/x64 | **ollvm-unflattener** (Miasm) | angr deflat | Based on Miasm symbolic execution, BFS multi-layered processing |
| Pure Python symbolic execution, CTF scenarios | **angr** Deobfuscator | Triton | No GUI dependency, scriptable |
| Target is ARM64 .so, no IDA | **deollvm** (Unicorn) | angr | Unicorn-based ARM64 deflattener |
| Encountering BR obfuscation (indirect branches) | **DeObfBR** | Set data section to read-only | Goron/Arkari style BR obfuscation can be easily countered by marking data section read-only |
| Encountering Tigress obfuscation | d810-ng `UnflattenerSwitchCase`/`UnflattenerTigressIndirect` | — | d810-ng built-in Tigress-specific unflattener |

> **Core Recommendation:** Prioritize using **d810-ng** (local, actively maintained, broad variant coverage). When cloud services are available, **obpo-plugin** yields the best results. If both fail, fall back to **angr/Miasm** symbolic execution for custom handling.

---

## 1. Modern OLLVM Variant Ecosystem (2026 Community Survey)

OLLVM is no longer just the original 2017 repository. Below are currently active obfuscator forks. **You MUST identify which variant the target uses before deobfuscation**, as counter-measures differ significantly across variants:

### 1.1 Obfuscator Fork Lineage

| Variant | Base LLVM | New Features vs Original OLLVM | Counter-Measure Key Points |
|------|----------|----------------------|---------|
| **Obfuscator** (Original) | 3.3~4.0 | sub + bcf + fla (three basic passes) | All standard tools can process this |
| **Hikari** | 6~8 | Anti Class Dump, Function Call Obfuscate, Function Wrapper, Indirect Branching, Split BB, String Encryption | Must decrypt strings first + remediate indirect jumps |
| **Hikari-LLVM15** | 15~19 | + Anti Debugging, Anti Hook, Constant Encryption | Closed-source; Constant Encryption increases static analysis difficulty |
| **goron** | 7~10 | Indirect Branch/Call/GlobalVariable | ⚠️ Goron-style indirect obfuscation can be easily countered by setting data sections to read-only |
| **Arkari** (komimoe/Hikari) | 14~latest | Based on goron, actively maintained | Same as goron, read-only data sections partially counter this |
| **Pluto** | 14 | MBA Obfuscation, Random CF, Split BB, **Trap Angr** (specifically targets angr) | ⚠️ Trap Angr pass breaks angr symbolic execution; switch tools or bypass the trap |
| **Polaris** (formerly Pluto) | 16 | Alias Access, Indirect Branch/Call, String Encryption, Merge Function, Linear MBA, Dirty Bytes Insertion, Function Splitting, Junk Insertion | Combines Hikari+Pluto, most complex, requires multi-layered processing |
| **O-MVLL** | open-obfuscator | Python driver pass manager; Anti Hooking, Arithmetic (MBA), BB Duplicate, CF Breaking, Function Outline, Indirect Branch/Call, Opaque Constants | Common in modern Android hardening, easily customized via Python config |
| **amice** (Rust) | Rust implementation | Full suite + VM Flatten, Instruction Virtualization, Delayed Offset Loading, Parameter Aggregation | Includes virtualization; requires VM handler recovery rather than standard deflattener |
| **VMP Series** (SmallVmp/VMPilot/xVMP/VMPacker) | — | Instruction Virtualization | **Outside OLLVM scope**; requires VM reverse engineering, refer to VM-specific tools |

### 1.2 Critical Identification Clues

- **Trap Angr** (Pluto/Polaris): If angr crashes or suffers path explosion, suspect the target uses the Trap Angr pass → Switch to d810-ng or Unicorn dynamic methods.
- **Goron/Arkari Indirect Jumps**: If the dispatcher uses indirect jumps (`BR x8` instead of `switch`), try setting the relevant data sections to read-only first; indirect jump targets often become statically solvable.
- **Constant Encryption** (Hikari-LLVM15/Polaris/O-MVLL): Constants are decrypted at runtime, making them invisible statically → Use Unicorn to dynamically execute decryption stubs.
- **VM Flatten** (amice): Control flow becomes a VM dispatch loop; **do NOT treat as standard fla**; identify the VM handler table first.

---

## 2. OLLVM Obfuscation Type Detection

Identification characteristics of OLLVM's three core passes:

### 2.1 Control Flow Flattening (CFF / `fla`)

**IDA View Characteristics:**
- Function entry point jumps to a central dispatcher block
- Main logic split into multiple basic blocks, each jumping back to the dispatcher at the end
- Dispatcher uses a **state variable** to determine the next basic block to execute
- Large `switch` structure where cases have no logical flow relationship

```
Original:             OLLVM flattened:
  block_A               entry -> dispatcher
  block_B                 ↓
  block_C              state_machine:
                         switch(state):
                           0 → block_A
                           1 → block_B
                           2 → block_C
```

**Variant Forms (Multiple Dispatchers Identified by d810-ng):**
- O-LLVM: switch / if-chain + state variable
- Tigress: `m_jtbl` (switch-case) or `m_ijmp` (indirect jump, requires `goto_table_info` configuration)
- Hodur (PlugX): Nested `while(1)` state machine, `jnz state, #CONST`, **no switch dispatcher**
- Approov: `while(v8 != C)`, state constants concentrated in `0xF6000–0xF6FFF`

### 2.2 Bogus Control Flow (BCF / `bcf`)

- Unreachable fake branches inserted between real branches
- Fake branches protected by **opaque predicates** (conditions that are always true/false, but static analysis cannot directly prove)
- Large volume of dead code inflates function size

```c
// Classic opaque predicate: x*(x+1) is always even, compiler cannot prove it statically
if (x * (x + 1) % 2 == 0) {
    // Real logic
} else {
    // Unreachable dead code
}
```

### 2.3 Instruction Substitution (`sub`) → MBA

- Simple arithmetic/bitwise operations replaced with equivalent complex expressions (MBA, Mixed Boolean-Arithmetic)

```
a + b  →  (a ^ b) + 2*(a & b)
a ^ b  →  (a | b) - (a & b)
a - b  →  a + (~b) + 1
```

### 2.4 Quick Classification Table

| Obfuscation Type | IDA Characteristics | Primary Counter-Measures |
|---------|---------|------------|
| fla (Flattening) | Huge switch + dispatcher | obpo / d810-ng / deflat |
| bcf (Bogus Control Flow) | Unreachable branches + dead code | d810-ng opaque predicate removal / symbolic execution |
| sub/MBA | Complex arithmetic expressions | d810-ng MBA simplifier / SiMBA (Z3) |
| fla + bcf + sub | All applied, massive code inflation | **Layered deobfuscation (bcf first, then fla, then sub)** |

---

## 3. Detailed Tool Breakdown (Active Community Projects)

### 3.1 obpo-plugin — Most Effective, Cloud Plugin

> [obpo-project/obpo-plugin](https://github.com/obpo-project/obpo-plugin) · 629⭐ · Active 2026-06

Hex-Rays **microcode**-based pseudocode optimizer using **data flow tracking + program slicing + concolic execution** to reconstruct flattened control flow. Widely considered one of the most effective tools in the community.

**Key Features:**
- Operates at the microcode layer, directly optimizing decompilation output (not modifying ASM)
- Supports IDA 7.5.0 / 7.6.0 / 7.7.0 + Hex-Rays
- Architectures: ARM, ARM64, x86, x86_64, PowerPC, PowerPC64, MIPS (7.6/7.5)
- **Cloud plugin**: Target function bytes uploaded to obpo-server for processing (core is closed-source, plugin frontend is open-source)
- Server self-funded, 600s timeout, **multi-threading or malicious calls prohibited**

**Installation and Usage:**
```text
1. Download obpo_plugin.py and obpoplugin directory
2. Copy to IDA plugins path
3. Restart IDA, open target binary
4. Locate dispatcher block in CFG (typically looks like assets/dispatchblock.png in repository)
5. Right-click → OBPO → Mark and process function
6. After processing, refresh the decompiler
7. Mark additional dispatcher blocks iteratively as decompilation updates (for nested fla)
```

**Use Cases and Limitations:**
- ✅ Excellent results on standard and nested fla
- ⚠️ Requires internet connection; exercise caution with sensitive samples (unreleased vulnerabilities, commercial secrets) as binary code is uploaded
- ⚠️ Server may experience downtime; dependent on maintainer
- ❌ Cannot solve all obfuscations (explicitly stated by author)

### 3.2 d810-ng — Preferred Local All-in-One Solution

> [w00tzenheimer/d810-ng](https://github.com/w00tzenheimer/d810-ng) · 223⭐ · Updated 2026-06-26

Modern maintained/refactored version of D-810 (Next Generation). Runs locally, open-source, integrated with **Z3 SMT** solver, broadest variant coverage.

**Core Capabilities (from d810-ng README):**

*Instruction-Level Optimizations:*
| Category | Description |
|------|------|
| MBA simplification | `(a+b)-2*(a&b) => a^b`, Z3-verified DSL rules |
| Hacker's Delight | Bitwise equivalences (from Hacker's Delight book) |
| O-LLVM patterns | Obfuscator-LLVM specific MBA patterns |
| Constant folding | 22 constant folding rules |
| Predicate simplification | Opaque predicate removal (setz/setnz/lnot/smod) |
| Z3 rules | SMT solver fallback when template matching fails |
| Hodur-specific | PlugX (Hodur) malware MBA patterns |

*Control Flow Unflatters (by Target Obfuscation):*
| Unflattener | Target | Description |
|------------|------|------|
| `Unflattener` | O-LLVM | Standard switch/if-chain + state variable |
| `UnflattenerSwitchCase` | Tigress | Tigress switch-case dispatch (`m_jtbl`) |
| `UnflattenerTigressIndirect` | Tigress | Tigress indirect jump (`m_ijmp`), requires `goto_table_info` config |
| `HodurUnflattener` | Hodur (PlugX) | Nested `while(1)` + `jnz state, #CONST`, no switch |
| `BadWhileLoop` | Approov | `while(v8 != C)`, state constants at `0xF6000–0xF6FFF` |
| `UnflattenerFakeJump` | Generic | Removes always-true / always-false conditional jumps |
| `SingleIterationLoopUnflattener` | Residual | Cleans up single-iteration loops where `INIT == CHECK` and `UPDATE != CHECK` |
| `UnflattenControlFlowRule` (Experimental) | Generic | Path emulation-based CFG unflattener |

**Installation and Usage:**
```text
1. Clone d810-ng
2. Install dependencies (including Z3)
3. Copy to IDA plugins directory
4. Press Ctrl-Shift-D in IDA to load plugin
5. Select rule sets in GUI
6. Apply to target function
```

**Why Choose d810-ng over Original D-810:**
- Original D-810 is largely unmaintained
- d810-ng includes CI testing, refactored code, and dedicated unflatteners for Tigress/Hodur/Approov
- Integrated Z3 falls back to SMT solving when pattern matching fails, increasing success rate

### 3.3 ollvm-unflattener — Miasm Symbolic Execution, Pure Script

> [cdong1012/ollvm-unflattener](https://github.com/cdong1012/ollvm-unflattener) · 265⭐ · Active 2026-06

Based on **Miasm** symbolic execution engine, independent of IDA/BN, pure Python CLI.

**Features:**
- Uses Miasm symbolic execution to reconstruct original control flow (unlike MODeflattener's purely static approach)
- **BFS Multi-layered Processing**: Automatically follows target function calls for recursive deobfuscation
- Supports Windows/Linux x86/x64
- Outputs a new deobfuscated binary

**Installation and Usage:**
```bash
git clone https://github.com/cdong1012/ollvm-unflattener.git
cd ollvm-unflattener
pip install -r requirements.txt   # miasm, graphviz, keystone-engine

# Basic usage
python unflattener -i <input.bin> -o <output.bin> -t <function_addr> -a
# -a: Automatically follow calls for multi-layered processing
```

**Use Cases:** No IDA available, targeting x86/x64, requiring automated batch processing.

### 3.4 ollvm-breaker — Binary Ninja Practical

> [amimo/ollvm-breaker](https://github.com/amimo/ollvm-breaker) · 441⭐

Uses **Binary Ninja** for deflattening. Repository includes Android hardened sample `libvdog.so` as a test case, remediating functions such as `JNI_OnLoad`, `crazy::GetPackageName`, and `prevent_attach_one`.

**Use Cases:** Binary Ninja users, real-world Android .so analysis.

### 3.5 deollvm — ARM64 Unicorn

> [GeT1t/deollvm](https://github.com/GeT1t/deollvm) · 34⭐ · 2026-04

Unicorn-based ARM64 OLLVM deflattener. Alternative for processing ARM64 .so files without IDA.

### 3.6 DeObfBR — Specialized BR Obfuscation

> [Mrack/DeObfBR](https://github.com/Mrack/DeObfBR) · 96⭐ · 2026-06-25

Specifically designed to remove **BR obfuscation** (indirect branch obfuscation, Goron/Arkari style).

**⚠️ Quick Counter-Measure Trick (from awesome-ollvm):** Goron/Arkari-style indirect branch obfuscation can often be countered simply by **setting data sections to read-only** — indirect jump targets often depend on writable data sections at runtime, and making them read-only renders them statically solvable.

### 3.7 angr — Symbolic Execution General Framework

```python
import angr

proj = angr.Project("target.so", auto_load_libs=False)
cfg = proj.analyses.CFGFast()
func = proj.kb.functions[0x12345]

# Built-in Deobfuscator
deob = proj.analyses.Deobfuscator(func=func)
deob.normalize()
```

**⚠️ Trap Angr pass in Pluto/Polaris:** These variants specifically include traps designed to defeat angr symbolic execution. If angr experiences path explosion or unexpected failure, suspect Trap Angr → Switch to d810-ng or Unicorn dynamic methods.

---

## 4. Complete Deobfuscation Workflows (by Scenario)

### 4.1 General Decision Tree

```
Target Binary
  ↓
1. Identify OLLVM Variant (see Section 1.2 clues)
  ├── Original OLLVM / Hikari / O-MVLL  → Standard fla/bcf/sub
  ├── Pluto / Polaris                → Beware of Trap Angr; avoid angr
  ├── Goron / Arkari                 → Try read-only data sections first, then handle BR
  ├── Tigress                        → d810-ng Tigress unflattener
  ├── Hodur (PlugX)                  → d810-ng HodurUnflattener
  └── amice (with VM)                → Not pure fla; requires VM handler recovery
  ↓
2. Select Tool (see Section 0 matrix)
  ├── IDA + Internet + Non-sensitive → obpo-plugin
  ├── IDA + Local                    → d810-ng
  ├── Binary Ninja                   → ollvm-breaker
  ├── No GUI + x86/x64               → ollvm-unflattener (Miasm)
  ├── No GUI + ARM64                 → deollvm (Unicorn) / angr
  └── Pure Symbolic Execution / CTF  → angr
  ↓
3. Layered Deobfuscation (Order is critical)
  a) Remove Opaque Predicates (bcf)  → d810-ng opaque predicate removal
  b) Deflat Control Flow (fla)       → unflattener
  c) Simplify MBA (sub)              → d810-ng MBA simplifier / SiMBA
  ↓
4. Verification
  ├── Function size significantly reduced?
  ├── CFG transformed from star/radial to linear/tree layout?
  └── Frida hook on critical functions verifies logical correctness?
```

### 4.2 Android NDK .so Deobfuscation Guide

Android NDK-compiled .so files hardened with OLLVM represent the most common scenario in APK reverse engineering.

**Step 1 — Extract .so:**
```bash
adb pull /data/app/~~/lib/arm64/libnative.so
# Or extract directly from APK: unzip target.apk -d out/ ; find out -name "*.so"
```

**Step 2 — Identify OLLVM Variant:**
```bash
readelf -a libnative.so | grep -E "Size|text"   # .text unusually large but few functions → high probability of OLLVM
# Open in IDA to inspect function characteristics:
#   Huge switch → fla
#   Unreachable branches → bcf
#   Complex arithmetic → sub/MBA
#   Indirect jump BR x8 → Goron/Arkari, try read-only data sections
#   while(1) + jnz state → Hodur, use d810-ng HodurUnflattener
```

**Step 3 — Deobfuscate (Layered):**
```
a) bcf: d810-ng opaque predicate removal  (or obpo automatic processing)
b) fla: d810-ng Unflattener / obpo-plugin / deollvm (ARM64)
c) sub: d810-ng MBA simplifier
```

**Step 4 — Frida Dynamic Verification:**
```javascript
// Trace OLLVM state variable to assist deflattener in identifying state variable addresses
const target = Module.findBaseAddress("libnative.so");
console.log("[+] libnative.so @", target);

// Hook at dispatcher entry point to observe state transition sequence
Interceptor.attach(target.add(0x1234), {  // dispatcher offset
    onEnter(args) {
        // Read state variable (determine register/stack location from decompilation)
        console.log("[state]", this.context.x8);  // Assuming state is in x8
    }
});
```

### 4.3 Fast Deobfuscation in CTF Scenarios

CTFs are time-sensitive; prioritize the fastest path:

```python
#!/usr/bin/env python3
"""CTF OLLVM quick deflat with angr"""
import angr

proj = angr.Project("challenge", auto_load_libs=False)
cfg = proj.analyses.CFGFast()

# Find largest functions (most likely to be obfuscated)
funcs = sorted(cfg.functions.values(), key=lambda f: f.size, reverse=True)[:5]
for func in funcs:
    print(f"[*] {func.name} @ {hex(func.addr)} size={hex(func.size)}")
    try:
        deob = proj.analyses.Deobfuscator(func=func)
        deob.normalize()
        print(f"    [+] deobfuscated")
    except Exception as e:
        print(f"    [-] failed: {e}")
        # angr failure → Suspect Trap Angr → Switch to d810-ng / Unicorn
```

---

## 5. MBA Expression Simplification

### 5.1 Common OLLVM MBA Patterns

```python
# These equivalences are simplification targets for expressions generated by OLLVM's sub pass
"(a | b) + (a & b)"        # → a + b
"(a | b) - (a & b)"        # → a ^ b
"(a ^ b) + 2*(a & b)"      # → a + b
"(a | b) & ~(a & b)"       # → a ^ b
"~(~a & ~b)"               # → a | b (De Morgan)
```

### 5.2 Tool Selection

| Tool | Approach | Use Cases |
|------|------|------|
| **d810-ng MBA simplifier** | In-IDA batch, Z3 verified | Top choice, integrated into decompilation process |
| **SiMBA** (`pip install simba-simplifier`) | CLI / Library | Pure expression simplification, batch processing |
| **Arybo** | Symbolic bit-vectors | Large volumes of MBA expressions |
| **Z3 Direct Solver** | SMT | Most generic, fallback when pattern matching fails |

```python
# SiMBA Example
from simba import simplify_mba
exprs = ["(a | b) + (a & b)", "(a ^ b) + 2*(a & b)"]
for e in exprs:
    print(f"{e}  →  {simplify_mba(e)}")
```

---

## 6. Complete Deobfuscation Example Script

```bash
#!/bin/bash
# OLLVM deobfuscation pipeline (2026 community tools)
# Applicable to standard OLLVM / Hikari / O-MVLL hardened ELF/.so

BINARY=$1

echo "[*] Stage 0: Basic analysis and variant identification"
file $BINARY
readelf -h $BINARY 2>/dev/null | head -5
echo "    → Confirm variant in IDA (refer to Section 1)"

echo "[*] Stage 1: d810-ng local deobfuscation (preferred)"
echo "    IDA → Press Ctrl-Shift-D to load d810-ng"
echo "    Select: MBA + Opaque predicate + Unflattener"
echo "    Apply to target functions"
echo "    Save IDB"

echo "[*] Stage 2: obpo-plugin (if d810-ng is insufficient and internet is available)"
echo "    IDA → Right-click dispatcher → OBPO → Mark and process"
echo "    ⚠️ Do not use on sensitive samples (binary uploaded to cloud)"

echo "[*] Stage 3: Alternative without IDA (x86/x64)"
echo "    python unflattener -i $BINARY -o deobf.bin -t <func_addr> -a"

echo "[*] Stage 4: Alternative for ARM64 .so without IDA"
echo "    deollvm (Unicorn) or angr Deobfuscator"

echo "[+] Done. Re-analyze and verify in IDA."
```

---

## 7. Common Pitfalls (Community Practical Summary)

| Issue | Cause | Solution |
|------|------|---------|
| angr path explosion / unexpected crash | Pluto/Polaris **Trap Angr** pass | Switch to d810-ng or Unicorn dynamic methods |
| obpo-plugin connection failed | Server self-funded, possible downtime | Switch to local d810-ng; open issue on obpo repo |
| Goron/Arkari indirect jump deflattener failure | Dispatcher uses BR x8 instead of switch | Set data section to read-only first, then use DeObfBR |
| Functions remain messy after d810-ng | Custom OLLVM pass parameters/seeds | Use symbolic execution to remove opaque predicates first, then unflatten |
| Nested fla (multi-layer flattening) not fully cleaned in one pass | obpo/d810-ng cleans one layer per run | **Iterative processing**: Mark newly appearing dispatchers each pass |
| deflat error on ARM64 .so | Legacy deflat scripts only support x86 | Use d810-ng / obpo (ARM64 supported) / deollvm |
| Hikari strings invisible | String Encryption pass | Use Unicorn to emulate decryption stubs, dump decrypted strings |
| deflat completely ineffective on amice target | Contains VM Flatten / Instruction Virtualization | **Not standard OLLVM fla**; requires VM handler recovery (refer to VM reverse engineering) |
| Hodur (PlugX) sample has no switch dispatcher | Nested while(1) + jnz state | Use d810-ng **HodurUnflattener**, do not use standard Unflattener |
| Approov sample state constants show no pattern | Constants concentrated in 0xF6000–0xF6FFF | Use d810-ng **BadWhileLoop** unflattener |
| Accidental obpo use on sensitive sample | Binary uploaded to cloud service | For confidential/unreleased vulnerability samples, **use local tools only** (d810-ng/angr) |
| Frida hook on OLLVM function freezes | State variable modified causing infinite loop | Add conditional breakpoint at dispatcher entry point to cap execution count |

---

## 8. Tool Quick Reference (2026 Community Activity)

| Tool | Platform | Method | Stars | Last Updated | Open Source | Notes |
|------|------|------|---------|---------|------|------|
| **obpo-plugin** | IDA | microcode+concolic (cloud) | 629 | 2026-06 | Plugin open / Core closed | Most effective, requires internet |
| **ollvm-breaker** | Binary Ninja | BN API | 441 | 2026-06 | ✅ | Android .so practical |
| **ollvm-unflattener** | CLI | Miasm symbolic execution | 265 | 2026-06 | ✅ | x86/x64, BFS multi-layer |
| **d810-ng** | IDA | microcode+Z3 | 223 | 2026-06 | ✅ | **Top local choice**, broad variant coverage |
| **DeObfBR** | — | BR obfuscation specialized | 96 | 2026-06 | ✅ | Goron/Arkari indirect branches |
| **IDA_Ollvm-unflattener** | IDA | Miasm plugin version | 90 | 2026-04 | ✅ | IDA plugin wrapper for ollvm-unflattener |
| **deollvm** | CLI | Unicorn | 34 | 2026-04 | ✅ | ARM64 specialized |
| **angr** | CLI | symbolic execution | — | Active | ✅ | Generic, countered by Trap Angr |
| **SiMBA** | CLI/Lib | MBA simplification | — | — | ✅ | Expression simplification |
| **Triton** | CLI | Symbolic execution + taint | — | Active | ✅ | Dynamic symbolic execution |

---

## 9. References & Links

**Obfuscators (for understanding counter-targets):**
- [obfuscator-llvm/obfuscator](https://github.com/obfuscator-llvm/obfuscator) — Original OLLVM
- [HikariObfuscator/Hikari](https://github.com/HikariObfuscator/Hikari) — Hikari
- [komimoe/Hikari](https://github.com/komimoe/Hikari) — Arkari (based on goron, LLVM 14+)
- [amimo/goron](https://github.com/amimo/goron) — goron
- [bluesadi/Pluto](https://github.com/bluesadi/Pluto) — Pluto
- [za233/Polaris-Obfuscator](https://github.com/za233/Polaris-Obfuscator) — Polaris (formerly Pluto)
- [open-obfuscator/o-mvll](https://github.com/open-obfuscator/o-mvll) — O-MVLL
- [fuqiuluo/amice](https://github.com/fuqiuluo/amice) — Rust implementation OLLVM passes
- [lich4/awesome-ollvm](https://github.com/lich4/awesome-ollvm) — **Variant Ecosystem Overview (Highly Recommended Read)**

**Deobfuscation Tools:**
- [obpo-project/obpo-plugin](https://github.com/obpo-project/obpo-plugin) — Most Effective Cloud Plugin
- [w00tzenheimer/d810-ng](https://github.com/w00tzenheimer/d810-ng) — Top Local Choice
- [cdong1012/ollvm-unflattener](https://github.com/cdong1012/ollvm-unflattener) — Miasm Pure Script
- [amimo/ollvm-breaker](https://github.com/amimo/ollvm-breaker) — Binary Ninja
- [GeT1t/deollvm](https://github.com/GeT1t/deollvm) — ARM64 Unicorn
- [Mrack/DeObfBR](https://github.com/Mrack/DeObfBR) — BR Obfuscation Specialized
- [maskelihileci/IDA_Ollvm-unflattener](https://github.com/maskelihileci/IDA_Ollvm-unflattener) — IDA Plugin Version
- [angr](https://angr.io/) — Symbolic Execution Framework
- [SiMBA](https://github.com/tech-srl/simba) — MBA Simplification

**Academic / Blogs:**
- [Quarkslab: Deobfuscation: Recovering an OLLVM-protected program](https://blog.quarkslab.com/deobfuscation-recovering-an-ollvm-protected-program.html) — Classic Deflattening Principles
- [MODeflattener](https://github.com/mrT4ntr4/MODeflattener) — Static Deflattener (Comparison for ollvm-unflattener)

> Related Documentation: [[anti-analysis.md]] (Anti-Debugging / Anti-Analysis Overview), [[tools-advanced.md]] (Advanced Tool Suite), [[elf-analysis.md]] (ELF File Analysis), [[ai-assisted-re.md]] (AI-Assisted Reverse Engineering)
