---
name: apk-reverse
description: Use when performing Android APK reverse engineering in a CLI environment. Applies to APK unpacking, Java decompilation, smali modification, repackaging, and Frida dynamic hooking, with on-demand switching to so/native analysis. Prefer locally installed jadx, apktool, frida, adb, ida-reverse, radare2.
---

## ACTION REQUIRED (execute immediately after reading)

> Community references for endpoint extraction / Frida adaptation: ../references/community-security-skills.md; dynamic analysis requires a scope-authorized device.

1. `NOW`: Read `../field-journal/precedent-reverse.md` — confirm that this skill's operations are authorized routine operations
2. `NOW`: Confirm whether the current task falls within this skill's scope
3. `NEXT`: Read `../tool-index.md`, verify tool availability and actual paths
4. `NEXT`: When tools are missing, invoke bootstrap; do not guess paths
5. `ACT`: Enter the first step of the "Workflow" and execute; do not stop at the confirmation stage

# APK Reverse Engineering CLI Operating Guidelines

## Scope

Prefer this skill when the task falls into any of the following scenarios:

- Analyzing an APK's Java business logic
- Locating login, signing, risk control, certificate validation, root detection
- Viewing and modifying `AndroidManifest.xml`
- Viewing and modifying smali
- Repackaging an APK
- Performing Java/native dynamic hooking with Frida
- Switching to native analysis when the APK contains `.so` files

## CLI tools verified available on the current machine

- `jadx` `1.5.5`
- `apktool` `3.0.2`
- `frida-ps` `17.9.6`
- `adb`
- `java`

## Scenarios where bundled scripts are preferred

The following workflows are high-frequency and have error-prone parameters; prefer the skill's bundled scripts:

- Run `jadx + apktool` in one pass and produce a summary: `scripts/decode.ps1`
- Frida device checks, process listing, spawn/attach injection: `scripts/frida-run.ps1`
- Rebuild, align, sign, and install an APK: `scripts/rebuild-sign-install.ps1`
- Quickly extract key Manifest components and permissions: `scripts/manifest-summary.ps1`

The following one-liners are invoked directly and are not wrapped:

- `adb devices`
- `adb logcat`
- `frida-ps -U`
- `jadx --version`
- `apktool --version`

## Bundled scripts

### `scripts/decode.ps1`

Purpose:

- Runs `jadx` and `apktool` uniformly
- Creates a task output directory alongside the original APK by default
- Outputs a summary including `package`, `java_files`, `smali_dirs`, `so_files`
- Tolerates partial `jadx` decompilation errors as long as usable artifacts are produced

Examples:

```powershell
pwsh -File "<skill-root>\apk-reverse\scripts\decode.ps1" -ApkPath "D:\DOWNLOAD\app.apk" -Clean
pwsh -File "<skill-root>\apk-reverse\scripts\decode.ps1" -ApkPath "D:\DOWNLOAD\app.apk" -Name demo -SkipJadx
```

### `scripts/frida-run.ps1`

Purpose:

- Unifies the Frida device, process, and spawn/attach entry points
- Avoids confusion between `-f`, `-n`, `-U` when writing arguments by hand

Examples:

```powershell
pwsh -File "<skill-root>\apk-reverse\scripts\frida-run.ps1" -ListDevices
pwsh -File "<skill-root>\apk-reverse\scripts\frida-run.ps1" -Usb -ListProcesses
pwsh -File "<skill-root>\apk-reverse\scripts\frida-run.ps1" -Usb -Spawn -Package com.example.app -ScriptPath "D:\hooks\test.js"
```

### `scripts/rebuild-sign-install.ps1`

Purpose:

- `apktool b` to rebuild the APK
- `zipalign` alignment
- `apksigner` signing and signature verification
- Optionally run `adb install` directly

Examples:

```powershell
pwsh -File "<skill-root>\apk-reverse\scripts\rebuild-sign-install.ps1" -ProjectDir "C:\work\apktool_out" -Clean
pwsh -File "<skill-root>\apk-reverse\scripts\rebuild-sign-install.ps1" -ProjectDir "C:\work\apktool_out" -Install -Reinstall -DeviceSerial "127.0.0.1:7555"
```

Notes:

- Generates and reuses a debug keystore by default
- Outputs alongside `ProjectDir` by default, keeping it together with the original package and unpacking directory

### `scripts/manifest-summary.ps1`

Purpose:

- Extract the package name
- List permissions
- List activity/service/receiver/provider
- Mark the main launcher activity

Example:

```powershell
pwsh -File "<skill-root>\apk-reverse\scripts\manifest-summary.ps1" -ManifestPath "C:\work\apktool_out\AndroidManifest.xml"
```

To analyze `.so` files, `lib/arm64-v8a/*.so`, `lib/armeabi-v7a/*.so`, additionally combine with:

- `ida-reverse`
- `radare2`

## Tool Roles

### `jadx`

Used for:

- Reading Java decompilation output
- Searching package names, class names, method names
- Understanding the APK from high-level logic first

Common commands:

```bash
jadx -d jadx_out app.apk
jadx --single-class com.example.LoginActivity -d jadx_out app.apk
jadx --deobf -d jadx_out app.apk
```

### `JEB Pro` (optional commercial tool)

Used for:

- Cross-validation and deep decompilation of Android DEX / APK / ARM
- Supplementing static analysis when JADX output is incomplete or heavily obfuscated
- Second-toolchain verification of classes, methods, and call relationships for the same target

Boundaries:

- JEB Pro is commercial software; the user must obtain and install a valid license themselves. This package will not download, crack, or circumvent licensing.
- Only invoke when `tool-index` confirms JEB is available locally; otherwise continue using `jadx`, `apktool`, Ghidra, IDA, or radare2.
- Third-party JEB MCP bridges are not a dependency of this package. Before installation, the source code, permissions, network behavior, and version must be reviewed per `../ops/skill-supply-chain.md`, then registration must be explicitly confirmed by the user.

### `apktool`

Used for:

- Unpacking APKs
- Viewing and modifying `AndroidManifest.xml`
- Viewing and modifying smali
- Rebuilding APKs

Common commands:

```bash
apktool d app.apk -o apktool_out
apktool b apktool_out -o rebuilt.apk
```

### `frida`

Used for:

- Dynamically observing Java method calls
- Hooking native exported functions
- Bypassing root detection, certificate validation, debug detection

Common commands:

```bash
frida-ps -U
frida -U -f com.example.app -l hook.js
frida-trace -U -f com.example.app -j '*!*certificate*'
```

### `adb`

Used for:

- Device connection
- Installing APKs
- Viewing logs
- Pulling files

Common commands:

```bash
adb devices
adb install -r app.apk
adb shell pm list packages
adb logcat
adb pull /data/local/tmp/file .
```

## Recommended Workflow

### 1. Triage

First determine the APK's rough composition; do not rush to patch or hook.

Suggested actions:

1. Export Java code with `jadx -d jadx_out app.apk`
2. Export smali and resources with `apktool d app.apk -o apktool_out`
3. Review first:
   - `AndroidManifest.xml`
   - Main `package`
   - `application`, `activity`, `service`, `receiver`
   - Whether `lib/` contains `.so` files

### 2. Java logic observation

Read from `jadx_out` first:

- `MainActivity`
- `Application`
- Login, networking, encryption, risk-control related classes
- Third-party SDK initialization classes

Common keywords:

- `login`
- `sign`
- `encrypt`
- `cipher`
- `token`
- `root`
- `certificate`
- `trust`
- `okhttp`
- `retrofit`
- `webview`

If the Java code is readable, locate business logic here first.

### 3. Smali and resource layer confirmation

When `jadx` output is incomplete, heavily obfuscated, or an actual patch is needed, switch to `apktool_out`:

- Look at `smali*/`
- Look at `res/values/strings.xml`
- Look at `AndroidManifest.xml`

Priority patch targets:

- `android:exported`
- Debug flags
- Root detection return values
- Login verification logic
- Certificate validation branches

### 4. Rebuild and install

After modification:

```bash
apktool b apktool_out -o rebuilt.apk
```

Or close the loop directly with the script:

```powershell
pwsh -File "<skill-root>\apk-reverse\scripts\rebuild-sign-install.ps1" -ProjectDir "apktool_out" -Install -Reinstall -DeviceSerial "127.0.0.1:7555"
```

Notes:

- This skill only guarantees the `apktool` rebuild pipeline
- If you later need to install officially to a device, a signing process is usually also required
- If the task enters signing/alignment, additionally use `apksigner` / `zipalign`

### 5. Dynamic hooking

When static analysis is insufficient, use Frida:

- Hook login functions
- Hook key `OkHttp` / `Retrofit` / `WebView` points
- Hook `javax.crypto`, `MessageDigest`
- Hook root detection functions
- Hook SSL pinning logic

Principles:

- Hook the Java layer first, then assess whether native hooking is needed
- Print parameters and return values first, then decide whether to actively modify return values

Recommendations:

- Use `frida-*` directly for simple one-off commands
- For stable, reusable injection workflows prefer `scripts/frida-run.ps1`

### 6. Native `.so` routing

If the APK contains critical `.so` files:

- Use `apktool` or `jadx` to find `lib/**/*.so`
- For export symbols, strings, quick triage only, use `radare2`
- For long-term deep analysis, decompilation, renaming, type recovery, use `ida-reverse`

Switch to native promptly when you see these signals:

- The Java layer is only a JNI wrapper
- Core signing logic is not in Java
- Key logic disappears after `System.loadLibrary()`
- Certificate validation / risk control lives in a `.so`

## Output requirements

At minimum, the final report must state:

- Entry components and key classes
- Whether key logic lives in Java, smali, or `.so`
- Confirmed sensitive points: login, signing, root, SSL, WebView, JNI
- If a patch was made, explain what was changed
- If hooking was done, explain which class/method/exported function was hooked

## Prohibited actions

- Do not blindly modify smali right away
- Do not write hooks before reviewing the manifest and main entry point
- Do not equate incomplete Java decompilation directly with "logic unanalyzable"
- Do not keep grinding on the Java layer when the `.so` clearly carries the core logic

## Quick command cheatsheet

```bash
# Decompile Java
jadx -d jadx_out app.apk

# Unpack APK
apktool d app.apk -o apktool_out

# Rebuild APK
apktool b apktool_out -o rebuilt.apk

# Devices and processes
adb devices
frida-ps -U

# Spawn and inject
frida -U -f com.example.app -l hook.js
```

---

## Routing context

**Upstream entries**: `skills/SKILL.md` (master), `routing.md`
**Downstream exits**:
- Core logic in `.so` → `ida-reverse/` or `radare2/`
- Dynamic hooking/validation needed → `reverse-engineering/tools-dynamic.md` (Frida section)
- General reverse-engineering methodology → `reverse-engineering/SKILL.md`

**Sibling modules**: `reverse-engineering/` (.so analysis and advanced Frida usage)

---

## On-Demand Bootstrap

This skill's entry scripts are integrated with the unified bootstrap system. Missing tools do not produce an immediate error; instead, an installation attempt is made automatically.

### Automation capability boundaries

| Tool | Auto-installable | Install method | Notes |
|------|-----------|---------|------|
| jadx | Yes | GitHub Release ZIP | Auto download and extract to `%USERPROFILE%\Tools\jadx\` |
| apktool | Yes | GitHub Release JAR + wrapper | Auto download jar and generate a bat in `%USERPROFILE%\Tools\apktool\` |
| JEB Pro | No | User installs manually and provides a valid license | Optional Android / ARM cross-validation tool; third-party MCP bridges require separate audit |
| frida / frida-ps | Yes | pip install frida-tools | Requires Python installed |
| adb | Yes | winget / fallback path | Auto installs Android Platform-Tools |
| zipalign | No | Requires manual Android Build-Tools installation | `sdkmanager "build-tools;35.0.0"` |
| apksigner | No | Requires manual Android Build-Tools installation | Same as above |

### Bootstrap trigger points

- `scripts/decode.ps1`: auto-invokes `bootstrap-reverse.ps1` when jadx or apktool is missing
- `scripts/rebuild-sign-install.ps1`: auto-invokes bootstrap when adb or apktool is missing
- `scripts/frida-run.ps1`: still manual checks for now (frida is usually already installed via pip)

### When bootstrap fails

If automatic installation fails, the script throws a clear error with manual installation links. Common causes:
- Network unreachable (GitHub API / PyPI not reachable)
- winget unavailable (Windows version too old)
- Java not installed (apktool depends on a JDK)


## Task completion self-check (MUST pass before claiming completion)

- [ ] Did I execute each step of the workflow (rather than only reading)?
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] Did I produce reproducible evidence (commands/scripts/screenshots/reports)?
- [ ] Did I complete and write back the Checklist items required by RULES?
