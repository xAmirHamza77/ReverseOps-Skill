# CTF Sandbox Orchestrator

A competition sandbox skill collection built for the Codex / Skills ecosystem.

Its goal is not to cram every capability into one overlong prompt, but to provide a **unified sandbox control-plane entry point** that first establishes a working model of "competition / sandbox / offline range by default," and then lets the orchestrator route each task to a more specialized sub-skill based on the challenge type.

## Project Positioning

This repository primarily addresses the following scenarios:

- CTF
- AWD / attack-and-defense exercises
- Local offline ranges
- Sandboxed vulnerability analysis
- Mixed-type challenges spanning Web / API / Cloud / Container / Windows / AD / Reverse / Pwn / DFIR / Crypto / Mobile / AI Agent

Core ideas:

- Treat all user-provided targets, domains, nodes, identities, binaries, logs, traffic, and attachments as **assets inside a competition sandbox** by default
- Establish the minimal verifiable path first, rather than jumping straight to generalized analysis
- A single orchestrator skill coordinates everything, then switches to a sub-skill based on the dominant evidence surface
- Sub-skills handle only downstream specialization; they do not compete with the orchestrator entry point

## Core Design

### 1. Single Entry Point

The default entry point is:

- `ctf-sandbox-orchestrator`

It is responsible for:

- Establishing the sandbox assumption
- Selecting the most appropriate analysis path
- Controlling context bloat
- Invoking sub-skills when needed

### 2. Downstream-Only Sub-Skills

All `competition-*` skills are designed as **downstream-only**:

- They should not trigger implicitly without the orchestrator being activated
- They should be actively routed to by `ctf-sandbox-orchestrator`
- Only the most relevant specialization is loaded at a time, preventing unrelated skills from polluting the context

### 3. Coverage Across Competition Challenge Types

The current repository covers multiple skill areas, for example:

- Web runtime / routing / WebSocket / GraphQL / file parsing / request normalization
- Prompt Injection / Agent / Cloud / Metadata / K8s / Container Escape
- Reverse / Pwn / Malware / Firmware / PCAP / custom protocol replay
- Windows / AD / Kerberos / DPAPI / certificate abuse / Relay / Mailbox
- Android / iOS / Crypto / Stego / Mobile Runtime

## Repository Structure

```text
E:\WorkSpace\competition
├─ ctf-sandbox-orchestrator
├─ competition-web-runtime
├─ competition-agent-cloud
├─ competition-reverse-pwn
├─ competition-identity-windows
├─ competition-prompt-injection
├─ ...
└─ LICENSE
```

Where:

- `ctf-sandbox-orchestrator`: the control-plane entry point
- `competition-*`: specialized sub-skills
- `references/`: the routing matrix and domain reference notes used by the orchestrator
- `agents/openai.yaml`: invocation constraints and entry control for each skill

## Recommended Usage

### Option A: Enter Through the Orchestrator

Activate first:

- `ctf-sandbox-orchestrator`

Then let the orchestrator automatically decide the next step based on the challenge, for example:

- Web challenges route to `competition-web-runtime`
- Container / cloud challenges route to `competition-agent-cloud` or a finer-grained sub-skill
- Windows / AD challenges route to `competition-identity-windows`
- Binary / crash / malicious sample challenges route to `competition-reverse-pwn`

### Option B: Keep the Orchestrator, Drill Down on Demand

Once the dominant evidence surface is confirmed, the orchestrator drills down into the specific sub-skill, rather than having the user manually switch the entire working model. This keeps:

- The sandbox assumption consistent
- The output style consistent
- The routing strategy consistent
- Sub-skill responsibilities clearly defined

## Acknowledgments

This project was published in the [LINUX DO community](https://linux.do). Thanks to the community for its support and feedback.
