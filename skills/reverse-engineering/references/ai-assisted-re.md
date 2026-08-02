# AI-Assisted Reverse Engineering

> LLM-driven decompilation / multi-agent verification / neural semantic recovery
> The biggest paradigm shift of 2025-2026

## Core Tools and Models

### LLM4Decompile
- The first open-source framework applying LLMs to binary→source decompilation
- Supports multiple architectures: x86/ARM/MIPS
- Input: assembly code → Output: C source code
- Training data: millions of source-assembly pairs

### Decaf (2026)
- **Compiler-feedback verification**: compile the LLM-generated source → compare against the original binary
- Result: decompilation rate 26% → 83.9% (ExeBench Real -O2)
- Key insight: the feedback loop is more effective than a larger model

### Constraint-Guided Multi-Agent (2026)
- Three-level verification pipeline:
  1. Syntactic correctness (parsing)
  2. Compilability (GCC)
  3. Behavioral equivalence (LLM-generated test cases)
- 84-97% re-executable rate at only $0.03-0.05 per run

### REMEND (2026)
- Specialization: extracting mathematical equations from binaries
- 89.8-92.4% accuracy (across 3 ISAs × 3 optimization levels × 2 languages)
- Speed: 0.132s/function, only 12M parameters

### Glaurung
- Open-source Ghidra alternative, Rust core + Python bindings
- **AI-native architecture**: LLM agents embedded in every analysis layer
- Evidence artifacts: plain/rich/JSON/JSONL multi-format output for LLM consumption
- Supports: ELF/PE/Mach-O, x86/ARM/RISC-V, IOC detection, entropy analysis

## Workflow: AI-Enhanced Binary Analysis

### 1. LLM-Assisted Rapid Reconnaissance

```text
□ strings extraction → LLM semantic classification (URLs/keys/paths/protocols)
□ Import table analysis → LLM infers functionality (crypto=OpenSSL? network=libcurl?)
□ Disassembly fragments → LLM recognizes patterns (cipher algorithms, anti-debug, VM detection)
□ Error messages → LLM infers context ("Invalid license" → licensing logic location)
```

### 2. Neural Decompilation

```bash
# LLM4Decompile
python llm4decompile.py --binary target.so --arch arm64 --output target.c

# Verify the result (recompile + compare)
gcc -O2 -o target_recompiled target.c -fPIC -shared
# → verify output behavioral equivalence
```

### 3. Multi-Agent Verification

```text
Agent 1 (syntax): check whether the generated C code parses
  ↓ failure → feed error messages back to the LLM for retry
Agent 2 (compilation): GCC compile → check warnings/errors
  ↓ failure → feed compile errors back to the LLM
Agent 3 (behavior): LLM generates inputs → run original and recompiled versions → compare outputs
  ↓ mismatch → feed the difference back to the LLM → iterate fixes
```

### 4. LLM-Assisted Static Analysis

```text
□ Function renaming: input decompiled pseudocode → LLM suggests semantic names
□ Type recovery: analyze context → LLM infers struct/class definitions
□ Algorithm identification: assembly fragments → LLM identifies cipher algorithms (AES/TEA/RC4/custom)
□ Protocol reversing: network packet sequences → LLM infers protocol format
□ Comment generation: decompiled code → LLM generates Chinese/English comments
```

### 5. macOS/iOS Private Framework Reversing (MOTIF)

```text
Problem: macOS private frameworks have no documentation and lack type information
Approach: LLM analyzes usage patterns → infers method signatures and parameter types
Result: ObjC signature recovery 15% → 86% (vs static analysis)
```

## LLM Prompt Templates

### Function Semantic Analysis

```
You are a reverse engineering expert. Analyze this decompiled function:

[pseudocode]

1. What does this function do? (one sentence)
2. Suggest a meaningful function name.
3. What are the input parameters and their likely types?
4. What is the return value?
5. What external APIs/functions does it depend on?
6. Any security-relevant operations (crypto, auth, network, file I/O)?
```

### Algorithm Identification

```
Analyze this assembly/disassembly for cryptographic operations:

[assembly code]

1. Is this a known cryptographic algorithm? (AES/DES/RC4/TEA/ChaCha20/custom?)
2. Identify the key schedule and round structure.
3. What is the key size?
4. Are there any hardcoded constants that identify the algorithm?
```

### Protocol Format Inference

```
Given this network packet sequence, infer the protocol structure:

[hex dump]

1. Identify magic bytes and length fields.
2. Propose a struct definition for the packet header.
3. What field(s) appear to be checksums/CRCs?
4. Is this a known protocol or custom?
```

## Tool Selection

| Scenario | Recommended Tool | Cost |
|------|---------|------|
| Quick decompilation | LLM4Decompile | Free (local GPU) |
| High-precision decompilation | Constraint-Guided Multi-Agent | ~$0.05/binary |
| Mathematical function extraction | REMEND | Free |
| All-platform RE | Glaurung (Rust) | Free, open source |
| LLM interaction | Claude API / GPT-4 / DeepSeek | ~$0.01-0.10/call |

## Limitations

- **Complex control flow**: virtualized/obfuscated code remains difficult (control-flow flattening, VMProtect)
- **Indirect calls**: vtables and function pointers are hard to recover
- **Inlined functions**: boundaries blur after compiler inlining
- **Floating-point operations**: semantic recovery of vectorized instructions needs improvement
- **Context window**: large functions (>1000 lines) exceed LLM context limits

Source: Decaf (2026), REMEND (2026), Constraint-Guided Multi-Agent Decompilation (2026), LLM4Decompile, Glaurung
