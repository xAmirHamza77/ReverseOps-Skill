---
name: js-reverse
description: Use when doing front-end JavaScript reverse engineering with js-reverse-mcp; suited for signature-chain location, page observation and forensics, runtime sampling, local environment-patching reproduction, and evidence-based output. Prefers the js-reverse_* tools available in the current environment; when a stronger browser/CDP/Hook surface is needed, coordinate with jshookmcp.
---

# MCP Front-End JS Reverse Engineering Work Guidelines

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm that this skill's operations are authorized routine operations
2. `NOW`: Confirm whether the current task falls within this skill's scope
3. `NEXT`: Read `../tool-index.md` and verify tool availability and actual paths
4. `NEXT`: If a tool is missing, invoke bootstrap; do not guess paths
5. `ACT`: Enter the first step of the "Workflow" and execute; do not stall in the confirmation state

## Scope

Prefer this skill when the task involves any of the following:

- Locating API signatures, encrypted parameters, or risk-control fields
- Observing page request chains and script origins
- Capturing function arguments and return values at runtime
- Tracing the trigger point of an XHR/Fetch/WebSocket
- Bringing page evidence back to Node for local reproduction and environment patching

If the target is a binary, APK, PE, ELF, DLL, or SO, use `ida-reverse`, `radare2`, or `reverse-engineering` instead.

## Default Tool Mapping for the Current Environment

This skill does not assume bare tool names exist; it binds by default to the `js-reverse_*` tools available in the current client environment.

If the current task explicitly mentions `jshookmcp`, `JS hook`, `CDP`, browser breakpoints, network interception, SourceMap, or AST deobfuscation, still go through this skill — only switch the underlying MCP surface to `jshookmcp`; do not treat it as a new top-level entry point.

Prerequisite: `jshookmcp` is not a local bare-command tool but an MCP server that must first be downloaded/registered/enabled. The related tool surface is only actually callable after it is connected and enabled in the Claude MCP configuration.

Common mapping:

- `list_scripts` -> `js-reverse_list_scripts`
- `get_script_source` -> `js-reverse_get_script_source`
- `search_in_sources` -> `js-reverse_search_in_sources`
- `break_on_xhr` -> `js-reverse_break_on_xhr`
- `evaluate_script` -> `js-reverse_evaluate_script`
- `get_paused_info` -> `js-reverse_get_paused_info`
- `set_breakpoint_on_text` -> `js-reverse_set_breakpoint_on_text`
- `list_network_requests` -> `js-reverse_list_network_requests`
- `get_request_initiator` -> `js-reverse_get_request_initiator`
- `get_websocket_messages` -> `js-reverse_get_websocket_messages`
- `take_screenshot` -> `js-reverse_take_screenshot`
- `new_page` -> `js-reverse_new_page`
- `navigate_page` -> `js-reverse_navigate_page`
- `select_page` -> `js-reverse_select_page`
- `select_frame` -> `js-reverse_select_frame`
- `pause/resume` -> `js-reverse_pause_or_resume`

If the tool name prefix changes in the future, update this section first; do not guess ad hoc at execution time.

### Positioning of jshookmcp

- Role: an enhanced execution surface for `js-reverse`, not an independent controller
- Suited for: browser automation, CDP debugging, JS Hook, network interception, SourceMap reconstruction, AST-assisted understanding
- Invocation prerequisite: first download and register `@jshookmcp/jshook` into the MCP client configuration, then ensure the server is enabled
- Recommended entry: still execute according to `Observe → Capture → Rebuild`, but prefer jshookmcp's browser and Hook capabilities during the `Observe/Capture` stages
- Relationship with anything-analyzer: both can do browser/network-side forensics; anything-analyzer leans toward packet capture and HTTP analysis, while jshookmcp leans toward the JS runtime, CDP, Hook, and source-code understanding

## Core Principles

- `Observe-first`
- `Hook-preferred`
- `Breakpoint-last`
- `Rebuild-oriented`
- `Evidence-first`

Observe the page first, then sample minimally, then patch the environment locally; do not skip forensics and guess the environment directly.

## Five-Stage Workflow

### 1. Observe

Goal: first confirm the target request, related scripts, and candidate functions; do not guess the environment.

Default actions:

- Use `js-reverse_new_page` or `js-reverse_navigate_page` to open the target page
- Use `js-reverse_list_network_requests` to find the target request
- Use `js-reverse_get_request_initiator` to trace back the call origin
- Use `js-reverse_list_scripts` and `js-reverse_search_in_sources` to narrow the script scope

Required outputs:

- Target request URL or signature
- initiator clues
- Suspicious script URLs
- Initial task record

### 2. Capture

Goal: perform minimal-intrusion sampling on the target request to obtain parameter samples, call order, and runtime evidence.

Rules:

- Prefer `js-reverse_break_on_xhr`
- Prefer `js-reverse_evaluate_script` for lightweight runtime observation
- After a hit, check `js-reverse_get_paused_info` first
- Use `js-reverse_set_breakpoint_on_text` only when necessary

### 3. Rebuild

Goal: turn page evidence into locally iterable Node reproduction material.

Rules:

- Local environment patching must be based on page-observation evidence
- No speculative patching of `window/document/navigator/crypto/storage`
- Record only one minimal causal patch decision at a time

### 4. Patch

Goal: drive environment patching by errors and first divergence until the local script stably produces the target parameter.

Rules:

- Identify what is missing first, then patch it
- Make only one minimal patch decision at a time
- Retest immediately after each patch
- Write every patch into the task record

### 5. DeepDive

Goal: after local reproduction works, perform deobfuscation, control-flow restoration, and business-logic extraction.

Rules:

- If the current task only needs to output a signature, this stage can be downgraded
- If the algorithm chain will be reused long term, this stage is mandatory

## Execution Requirements

- All important steps must be written into the local task artifact
- If you cannot explain why a certain tool is being called, do not call it
- Prefer the ready-made MCP capabilities of `js-reverse_*` or jshookmcp for direct forensics; do not write scripts to recreate capabilities first
- On failure, fall back per `references/fallbacks.md`
- Output follows `references/output-contract.md`

## Required References

- Automation entry: `references/automation-entry.md`
- Parameter defaults: `references/tool-defaults.md`
- Task input template: `references/task-input-template.md`
- MCP-specific task orchestration: `references/mcp-task-template.md`
- Task artifacts: `references/task-artifacts.md`
- Local reproduction: `references/local-rebuild.md`
- Environment patching: `references/env-patching.md`
- Node reproduction: `references/node-env-rebuild.md`
- Instrumentation: `references/instrumentation.md`
- AST deobfuscation: `references/ast-deobfuscation.md`
- Fallbacks: `references/fallbacks.md`
- Output contract: `references/output-contract.md`

---

## Routing Context

**Upstream entry**: `skills/SKILL.md` (master control), `routing.md`
**Upstream alternatives**:
- The browser tools of anything-analyzer MCP (port 23816) can serve as a substitute or supplement
- jshookmcp can serve as a stronger browser/CDP/Hook/Network/SourceMap/AST execution surface
- `reverse-engineering/SKILL.md` (if the target is not front-end JS)

**Downstream exits**:
- Need environment patching → `references/env-patching.md`
- Need local reproduction → `references/local-rebuild.md` / `references/node-env-rebuild.md`
- Need deobfuscation → `references/ast-deobfuscation.md`
- Fall back when stuck → `references/fallbacks.md`

**Peer related modules**: anything-analyzer MCP (browser automation and HTTP capture capabilities are complementary)

---

## On-Demand Bootstrap

The MCP capabilities this skill depends on can be registered automatically via the unified bootstrap system.

### Automation Capability Boundaries

| Capability | Auto-registrable | Method | Notes |
|------|-----------|------|------|
| jshookmcp | ✓ | npm-mcp (started via npx) | Automatically written into the Claude MCP configuration |
| anything-analyzer | ✓ | local-http-mcp | Automatic registration + can auto-start the service |
| Node.js | ✓ | winget install | Runtime dependency |

### Bootstrap Method

```powershell
# Register jshookmcp into the MCP configuration
powershell -File "<skill-root>\scripts\bootstrap-reverse.ps1" -Capability @('jshookmcp')

# Register and start anything-analyzer
powershell -File "<skill-root>\scripts\bootstrap-reverse.ps1" -Capability @('anything-analyzer') -StartServices
```

### Notes

- After `jshookmcp` is registered, the MCP server must still be **enabled** in the AI client before it can be called
- `anything-analyzer` requires pnpm and the project source code; bootstrap will automatically clone and install dependencies
- If Node.js is not installed, bootstrap will first install Node.js 22 via winget

<br><br>## Task Completion Self-Check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than just reading it)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
