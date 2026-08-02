# RE Agent Workflow Gates (Static↔Dynamic)

> Inspiration: binary-re stage partitioning, community RE skills (Frida/r2/Ghidra/IDA loop), Cerberus three-head ring (static/dynamic/instrumentation)  
> Date: 2026-07-17  
> Applies to: `reverse-engineering/`, `ida-reverse/`, `radare2/`, and handoff with the cre role

## 0. Startup

```text
□ scope.md: offline sample path or authorized device/target host
□ tool-index: actual paths for file/strings/r2/ida/frida etc.
□ role: cre (ops/role-map)
```

## 1. Triage (5–15 minutes)

```text
□ file / DIE / entropy / packer signatures
□ strings / rabin2 -z quick finds
□ architecture/linking/whether .NET/Go/Rust/packed
□ Output: E-triage + hypothesis list (do not draw conclusions prematurely)
```

## 2. Static

| Tool | When |
|------|------|
| radare2 / rabin2 | Quick functions/imports/strings |
| IDA / Ghidra (MCP or headless) | Deep dive, cross-references, types |
| jadx / dnSpy | Android / .NET |
| OLLVM docs | Suspected control-flow flattening |

```text
□ Locate key functions (crypto/checks/network/licensing)
□ Record addresses/symbols → Evidence
□ One path blocked → switch tools (IDA↔r2↔Ghidra)
```

**Without MCP**: export decompiled text and analyze it (cf. P4nda0s ReverseOpss / IDA-NO-MCP approach), still write the Evidence path.

## 3. Dynamic

```text
□ Frida / gdb / emulator: verify static hypotheses
□ Anti-debug / anti-Frida → reverse-engineering/anti-analysis
□ Android: generate root detection / SSL pinning bypass scripts as needed, **only on authorized devices**
□ Crash logs drive the next round of hooks (adaptive loop)
```

## 4. Synthesis

```text
□ Finding: algorithm/check logic/exploitable point
□ Path: callflow or solve steps attached to E-*
□ Report docs-generator + optional diagrams
□ field-journal sanitized
```

## 5. Differences from "Heap RE Skill Plugins"

- This package uses **stage gates + tool-index**; it does not enable Hex-Rays-style "unsafe fully automatic execution" plugins by default  
- Dynamic instrumentation defaults to **offline/lab** network_profile  
