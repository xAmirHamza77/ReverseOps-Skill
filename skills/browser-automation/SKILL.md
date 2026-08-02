---
name: browser-automation
description: |
  Unified automation entry point. Covers browser automation (Playwright) and Windows desktop application automation (OpenReverse).
  Browser scenarios: open web pages, click, fill forms, scrape, take screenshots, automated logins, pentest page interactions.
  Desktop scenarios: operate GUI tools such as IDA/x64dbg, Windows UI Automation, vision-driven interaction, desktop application network packet capture.
  Trigger keywords: browser automation, desktop automation, open web page, form filling, scraping, screenshots, automated login, Playwright, agent-browser, headless, OpenReverse, UIA, CUA, desktop operations, Windows automation.
---

# Automation Operations (Desktop & Browser Automation)

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Confirm whether the current task falls within the scope of this skill
2. `NOW`: Read `../tool-index.md` to verify tool availability and actual paths
3. `NEXT`: When a tool is missing, invoke the bootstrap; do not guess paths
4. `ACT`: Go to the first step of the "Workflows" section and execute it; do not stop at the confirmation stage

## Scope

Use this skill when the task falls into one of the following scenarios:

### Browser scenarios (Playwright / agent-browser)
- Open a web page and operate page elements (click, fill forms, submit)
- Scrape page content or take screenshots
- Automate login flows
- Interact with web pages during penetration testing (submit payloads, trigger XSS)
- Automated handling of captcha pages
- Batch form submission

### Desktop application scenarios (OpenReverse)
- Operate Windows desktop applications (IDA Pro, x64dbg, Wireshark, etc.)
- Vision-driven interaction (CUA mode)
- Structured UI operations (UIA mode)
- Network traffic observation of desktop applications (built-in mitmproxy)
- Automating the GUI of reversing tools
- Black-box testing of desktop software

### Division of labor with other tools

| Scenario | What to use |
|------|--------|
| Operate web pages (inside a browser) | **Playwright / agent-browser** |
| Operate desktop applications (Windows GUI) | **OpenReverse** |
| Packet capture analysis, HTTP request capture | anything-analyzer or OpenReverse network lane |
| JS breakpoints, hooks, CDP debugging | jshookmcp |
| Locate signing algorithms, reproduce with environment emulation | js-reverse |

Simple rule of thumb:
- Target is a web page → Playwright
- Target is a Windows desktop application → OpenReverse
- Both are needed → use them together

---

## Part 1: Browser automation (Playwright / agent-browser)

### Core workflow

```bash
# 1. Open the page
agent-browser open <url>

# 2. Get interactive elements (returns @e1, @e2... references)
agent-browser snapshot -i

# 3. Operate elements using the references
agent-browser click @e1
agent-browser fill @e2 "text"

# 4. Close when done
agent-browser close
```

### Command reference

```bash
# Navigation
agent-browser open <url>
agent-browser close

# Page snapshots
agent-browser snapshot        # Full accessibility tree
agent-browser snapshot -i     # Interactive elements only (recommended)

# Interactions
agent-browser click @e1
agent-browser fill @e2 "text"
agent-browser type @e2 "text"
agent-browser press Enter
agent-browser scroll down 500

# Retrieve information
agent-browser get text @e1
agent-browser get title
agent-browser get url

# Waiting
agent-browser wait @e1
agent-browser wait 2000
agent-browser wait --load networkidle
```

### Notes
- You MUST run `agent-browser close`, otherwise the process leaks
- Take a snapshot before operating; do not guess element references
- After submitting a form, use `wait --load networkidle` to wait for the page to stabilize

---

## Part 2: Desktop application automation (OpenReverse)

### Overview

[OpenReverse](https://github.com/zhexulong/openreverse) is a desktop interaction and evidence collection framework for AI agents. It supports:
- **UIA mode**: Windows UI Automation, structured desktop control operations
- **CUA mode**: vision-driven interaction (Computer Use Agent), suitable for complex GUIs
- **Network observation**: built-in mitmproxy proxy + local capture

### Choosing an interaction mode

| Mode | Suitable for | Underlying technology |
|------|---------|------|
| UIA | The target application has standard Windows controls (buttons, text boxes, lists) | Windows UI Automation API |
| CUA | The target application has a complex or non-standard UI (IDA's disassembly view, custom-rendered interfaces) | Vision recognition + mouse/keyboard |

### Network observation modes

| Mode | Suitable for |
|------|---------|
| Proxy Lane | The target application can be configured to use a proxy (recommended) |
| Local Lane | The target application cannot go through a proxy; local capture is required |

### Installation and configuration

```bash
# 1. Clone the project
git clone https://github.com/zhexulong/openreverse.git
cd openreverse

# 2. Install dependencies
npm install

# 3. Connect an agent host (Claude Code / Codex / Zed)
npm run init:agents -- --target=all /path/to/project

# 4. Install the CUA runtime (if vision-driven mode is needed)
npm run install:cua-runtime
npm run doctor:cua-runtime

# 5. Install network observation dependencies (if packet capture is needed)
npm run install:mitmproxy
npm run doctor:network
```

### Common combinations

| Requirement | Configuration |
|------|------|
| Only operate desktop applications | UIA or CUA, no network lane |
| Operate desktop applications + packet capture | UIA/CUA + proxy lane |
| Operate desktop applications + local capture | UIA/CUA + local lane |

### Reversing scenario examples

```text
Scenario: Automate IDA Pro for batch analysis

1. Open IDA Pro with OpenReverse CUA mode
2. Automatically load the target binary
3. Wait for analysis to complete
4. Export the function list through UI operations
5. Simultaneously observe IDA's network behavior (e.g., Lumina requests) with the network lane
```

```text
Scenario: Automate x64dbg debugging

1. Start x64dbg with OpenReverse UIA mode
2. Load the target program
3. Set breakpoints
4. Run and observe register/memory changes
5. Take screenshots to preserve evidence
```

---

## On-Demand Bootstrap

### Automation capability boundaries

| Tool | Auto-installable | Install method | Notes |
|------|-----------|---------|------|
| Playwright | ✓ | npm + npx playwright install | Browser automation engine |
| agent-browser CLI | ✓ | npm install -g agent-browser | Browser operation CLI |
| Node.js | ✓ | winget | Prerequisite dependency |
| OpenReverse | ✗ | Manual clone + npm install | Experimental stage, heavy dependencies |
| mitmproxy | ✗ | Manual installation | OpenReverse network observation dependency |

### Bootstrap triggers

- Playwright missing for browser operations → automatic bootstrap
- OpenReverse needed for desktop operations → guide the user through manual installation (provide complete steps)

### OpenReverse manual installation guidance

If the AI detects that desktop application automation is needed but OpenReverse is not installed:

```markdown
⚠️ **OpenReverse is required for desktop application automation**

**Installation steps**:
1. `git clone https://github.com/zhexulong/openreverse.git`
2. `cd openreverse && npm install`
3. `npm run init:agents -- --target=all <your project path>`
4. If vision mode is needed: `npm run install:cua-runtime`
5. If network observation is needed: `npm run install:mitmproxy`

**Verification**: `npm run doctor:cua-runtime` and `npm run doctor:network`
```

---

## Routing context

**Upstream entry**: `skills/SKILL.md` (master control), `routing.md`
**Applicable scenarios**: Any task that requires automating browser or desktop application operations
**Downstream exits**:
- Captured requests need analysis → `anything-analyzer` or `js-reverse`
- JS debugging/hooking needed → `jshookmcp`
- Signing algorithm needs recovery → `js-reverse`
- The desktop application is a reversing tool → `ida-reverse/`

**Peer related modules**: `js-reverse` (JS analysis may be needed after browser operations), `ida-reverse` (OpenReverse can automate IDA GUI operations)


## Task completion self-check (MUST pass before claiming completion)

- [ ] Did I execute every step of the workflow (rather than just reading it)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
