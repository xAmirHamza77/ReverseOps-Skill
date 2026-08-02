---
name: browser-extension-reverse
description: Use for authorized reverse engineering of browser extensions (Chrome/Firefox) including manifest analysis, background workers, and extension-based credential or traffic logic recovery.
---

# Browser Extension Reverse Engineering

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-reverse.md`
2. `NOW`: Confirm the target is a **browser extension** (crx/xpi/extracted directory), not ordinary web page JS (for the latter → `js-reverse/`)
3. `NEXT`: Extract the extension; read the manifest
4. `ACT`: Permission surface → background scripts → network/storage hooks

## Applicable Scenarios

- Chrome/Edge MV2/MV3 extension analysis
- Firefox extensions
- Malicious extension IOCs, supply-chain extension poisoning investigations
- Recovering signature/encryption/proxy logic implemented by extensions

## Workflow

### 1. Package

```text
□ Extract the crx / pull the extension directory from the profile
□ manifest.json: permissions, host_permissions, background, content_scripts
□ Assess excessive permissions (<all_urls>, webRequest, debugger)
```

### 2. Logic

```text
□ service_worker / background entry points
□ content_script injection points and worlds (isolated)
□ chrome.storage / IndexedDB keys
□ Same as `js-reverse`: observe network traffic and message passing (runtime.sendMessage)
```

### 3. Dynamic Analysis

```text
□ Load the extracted directory in developer mode
□ Check for errors at chrome://extensions
□ Attach DevTools to the service worker
□ If needed, Frida/browser CDP (jshookmcp)
```

## Toolchain

| Tool | Purpose |
|------|---------|
| unzip/jq | manifest |
| Chrome DevTools | Worker debugging |
| js-reverse toolchain | Deep JS analysis |
| YARA | Malicious extension rules |

## References

- `references/extension-analysis.md`
- Extension-recovery-related entries in field-journal
- `../js-reverse/` `../malware-analysis/`

## Routing Context

**Upstream**: MASTER R30  
**Downstream**: heavily obfuscated JS → `js-reverse`; poisoning investigation → supply-chain / malware

## Task Completion Checklist

- [ ] Were the permission surface and entry scripts listed?
- [ ] Were key data flows recovered?
- [ ] Checklist?