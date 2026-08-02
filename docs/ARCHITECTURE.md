# System Architecture Diagrams

## Complete Behavior Chain Flowchart

```mermaid
flowchart TD
    Start([User proposes security / reverse engineering task]) --> Detect{Trigger keyword matched?}
    Detect -->|Yes| ReadRouting[Read SKILL.md + routing.md]
    Detect -->|No| Normal([Normal conversation])
    
    ReadRouting --> RouteMatch{Routing matrix matched?}
    RouteMatch -->|No match| ProposeNew[Propose adding new skill<br/>per CONTRIBUTING.md]
    RouteMatch -->|Match| CheckJournal[Check field-journal<br/>for similar experience]
    
    CheckJournal --> CheckTools[Read tool-index.md<br/>confirm tool status]
    CheckTools --> ToolOK{Tool available?}
    
    ToolOK -->|Missing| Bootstrap[Invoke bootstrap-reverse.ps1<br/>auto-install]
    ToolOK -->|Available| Execute[Enter skill workflow]
    
    Bootstrap --> BootOK{Installation succeeded?}
    BootOK -->|Success| Execute
    BootOK -->|Failure| Guide[Output structured guidance<br/>wait for manual fix]
    Guide --> UserConfirm([User confirms installation])
    UserConfirm --> Execute
    
    Execute --> TaskDone{Task completed?}
    TaskDone -->|No| Execute
    TaskDone -->|Yes| GenReport[Invoke docs-generator<br/>generate report + diagrams]
    
    GenReport --> WriteJournal[Write back field-journal<br/>consolidate experience]
    WriteJournal --> UpdateIndex[Update index/routing/manifest]
    UpdateIndex --> Output([Output final result])
```

## Skills Module Relationship Diagram

```mermaid
flowchart LR
    subgraph Routing Layer
        SKILL[SKILL.md<br/>Master control entry point]
        Routing[routing.md<br/>Routing matrix]
    end

    subgraph Reverse Analysis
        APK[apk-reverse<br/>APK reverse engineering]
        IDA[ida-reverse<br/>IDA Pro]
        R2[radare2<br/>CLI analysis]
        RE[reverse-engineering<br/>General methodology]
        BinDiff[binary-diff<br/>Symbol migration]
        PatchDiff[patch-diff-exploit<br/>N-day weaponization]
    end

    subgraph Exploitation
        Pwn[pwn-chain<br/>RE→exploit]
        Firmware[firmware-pentest<br/>Full firmware chain]
    end

    subgraph Penetration Testing
        Pentest[pentest-tools<br/>Toolchain + loop framework]
        SrcHunter[src-hunter<br/>19 playbooks]
        EDR[edr-bypass-re<br/>EDR bypass]
    end

    subgraph Web/Browser
        JS[js-reverse<br/>JS signature reverse engineering]
        Browser[browser-automation<br/>Playwright + OpenReverse]
    end

    subgraph Infrastructure
        Bootstrap[bootstrap-reverse.ps1<br/>On-demand bootstrap]
        Discovery[ToolDiscovery.ps1<br/>Tool discovery]
        ToolIndex[tool-index<br/>Status index]
    end

    subgraph Output Layer
        Docs[docs-generator<br/>Report generation]
        Diagram[diagram-generator<br/>Diagram generation]
        Journal[field-journal<br/>Automated evolution]
    end

    subgraph External
        CTF[CTF-Sandbox<br/>40+ sub-skills]
    end

    SKILL --> Routing
    Routing --> APK & IDA & R2 & RE & BinDiff & PatchDiff
    Routing --> Pentest & JS & Browser & Pwn & Firmware & EDR
    Routing --> CTF

    Pentest --> SrcHunter
    APK -->|.so dispatch| IDA
    APK -->|.so dispatch| R2
    PatchDiff -->|Write PoC| Pwn
    Firmware -->|Find crash| Pwn
    Pwn -->|Integrate| Pentest
    EDR -->|Delivery phase| Pentest
    JS -->|Browser operations| Browser
    
    Bootstrap --> Discovery --> ToolIndex
    
    APK & IDA & R2 & Pentest & JS -->|Task complete| Docs
    Docs --> Diagram
    Docs --> Journal
```

## Bootstrap Process

```mermaid
flowchart TD
    Need[Detected missing tool] --> ReadManifest[Read bootstrap-manifest.json]
    ReadManifest --> Kind{Installation type?}
    
    Kind -->|github-release-zip| GH[Download ZIP from GitHub Release<br/>and extract]
    Kind -->|pip-package| Pip[pip install]
    Kind -->|npm-mcp| NPM[npx start + register MCP]
    Kind -->|npm-global| Global[npm install -g<br/>+ postInstall]
    Kind -->|winget-package| Winget[winget install]
    Kind -->|local-http-mcp| HTTP[Register URL + start service]
    
    GH & Pip & NPM & Global & Winget & HTTP --> Verify{Verify available?}
    Verify -->|Success| AddPath[Add to PATH<br/>refresh tool-index]
    Verify -->|Failure| Manual[Output manual installation guide]
    
    AddPath --> Continue([Continue executing task])
    Manual --> Wait([Wait for user confirmation])
```

## Penetration Testing Loop

```mermaid
flowchart TD
    Init[Initialization: Determine target/scope/tool] --> Loop

    subgraph Loop[Core Loop]
        Align[1. Re-align target] --> Review[2. Review known findings]
        Review --> Decide[3. Decide next operation]
        Decide --> Risk{4. Risk gate}
        Risk -->|Low/Med/High| Exec[5. Execute operation]
        Risk -->|Critical| Ask[Request user approval]
        Ask -->|Approved| Exec
        Exec --> Record[6. Record result]
        Record --> Check{7. Self-check}
        Check -->|Continue| Align
        Check -->|Complete| Done
    end

    Done[8. Completion check] --> Report([Generate final report])
```

## Auto-Evolution Mechanism

```mermaid
flowchart LR
    Task([Task completed]) --> WriteLog[Write field-journal<br/>Pitfalls + solutions + code]
    WriteLog --> UpdateIdx[Update _index.md<br/>categorize by scenario]
    UpdateIdx --> CheckUpdate{System update required?}
    
    CheckUpdate -->|Routing missing| FixRoute[Update routing.md]
    CheckUpdate -->|Tool changes| FixTool[Refresh tool-index]
    CheckUpdate -->|New tool| FixManifest[Update bootstrap-manifest]
    CheckUpdate -->|No update needed| Done([Done])
    
    FixRoute & FixTool & FixManifest --> Done

    NewTask([Next similar task]) --> ReadIdx[Read _index.md]
    ReadIdx --> Reuse[Reuse existing experience<br/>avoid repeated pitfalls]
```

## Multi-Platform Architecture

```mermaid
flowchart TD
    subgraph Shared Layer["Shared Layer (Platform-Independent)"]
        Skills[skills/<br/>SKILL.md + routing.md + references]
        CTF[CTF-Sandbox/<br/>40+ sub-skills]
        Journal[field-journal/<br/>Consolidated experience]
        Docs[docs-generator + diagram-generator]
    end

    subgraph Windows["Windows Platform Layer"]
        WinScripts[skills/scripts/*.ps1<br/>PowerShell scripts]
        WinManifest[bootstrap-manifest.json<br/>winget + GitHub ZIP]
        WinRules[RULES.md<br/>Windows rules]
    end

    subgraph Kali["Kali Linux Platform Layer"]
        KaliScripts[kali/scripts/*.sh<br/>Bash scripts]
        KaliManifest[kali/scripts/bootstrap-manifest.json<br/>apt + pip + GitHub tar]
        KaliRules[kali/RULES-kali.md<br/>Kali rules]
    end

    Skills --> WinScripts & KaliScripts
    CTF --> WinScripts & KaliScripts
    Journal --> WinScripts & KaliScripts

    WinScripts --> WinManifest
    KaliScripts --> KaliManifest

    WinRules --> Skills
    KaliRules --> Skills
```

### Platform Selection Logic

| Environment | Rules File Used | Scripts Used | Package Management |
|------|--------------|-----------|--------|
| Windows | `RULES.md` | `skills/scripts/*.ps1` | winget / GitHub Release ZIP |
| Kali Linux | `kali/RULES-kali.md` | `kali/scripts/*.sh` | apt / pip / npm / GitHub tar.gz |

### Kali Edition Features

- **Many tools pre-installed**: nmap, sqlmap, hashcat, hydra, metasploit, radare2, binwalk, burpsuite, etc. require no bootstrap
- **Unified apt management**: No winget needed, no manual ZIP extraction needed
- **Native bash**: Scripts are concise with no PowerShell dependencies
- **Standard paths**: `/usr/bin/`, `/opt/`, `~/tools/`, no drive letters or whitespace issues

## File Reading Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant AI as AI Client
    participant R as RULES.md / RULES-kali.md
    participant SK as SKILL.md
    participant RT as routing.md
    participant TI as tool-index.md
    participant FJ as field-journal
    participant SUB as Sub-skill
    participant BS as Bootstrap
    participant DOC as docs-generator

    U->>AI: Propose security task
    AI->>R: Read routing rules
    AI->>SK: Read master control entry point
    AI->>RT: Match routing
    AI->>FJ: Check similar experience
    AI->>TI: Confirm tool status
    alt Tool missing
        AI->>BS: Auto-install (.ps1 or .sh)
        BS-->>AI: Result
    end
    AI->>SUB: Enter workflow
    AI-->>U: Task result
    AI->>DOC: Generate report
    AI->>FJ: Write back experience
    AI-->>U: Complete
```
