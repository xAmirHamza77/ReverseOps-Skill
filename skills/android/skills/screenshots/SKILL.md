---
name: screenshots
description: Advanced UI analysis and interaction through pixel-level reasoning to solve complex interaction problems, locate hard-to-find elements, verify visual states, and debug layout/rendering issues. Use as needed after UI Mapper inspection when advanced reasoning or non-standard views are required.
---

# Screenshots Skill (advanced mode)

> **Version**: 2.0 (Single-file mode) | **Backend**: Resolution-agnostic, uses pure pixel coordinates (pixels) | **Focus**: Advanced reasoning and problem solving

## CRITICAL: Microscope model (not primary analysis)

This skill is a **microscope, not a primary analysis tool**. It is Powerful for deep analysis, but Expensive (slow, high token usage). It Supports UI Mapper (the primary inspection tool).

**Key Principles:**
- **Less is More.** Use it SPARINGLY, NOT by default.
- **Flat Architecture.** Analyze in a single pass; NO recursive decomposition.
- **UI has no recursive structure.** Do not invent hierarchy where none exists.
- **Element Count Match.** MUST match the pixel/reference image as closely as possible.
- **Fail Fast.** If inspection fails after 1 retry, STOP and show the error.
- **No Features.** Do not document features/behaviors; ONLY report what you can SEE.
- **Debug-First.** Focus on malformed inputs, pollution, and state mismatches.
- **Advanced Analysis.** Here for complex analysis, not your FIRST analysis attempt.
- **Evidence Based.** Do not guess/hallucinate; base everything on observable evidence.
- **Pixel-Perfect ROI.** Validate element sizes through actual screenshot regions, NOT via uamappings alone (accuracy gate).

---

## CRITICAL: Data freshness (non-negotiable)

- Inventory Data MUST be < 30 seconds old. If `since_capture` > 30s, RE-CAPTURE.
- Screenshots MUST be from the CURRENT session (after the last capture/screenshot command).
- NEVER reuse uamappings across contextual changes (app switch, navigate, resize, session change).
- Changing target app invalidates prior inventory data (target_mismatch).
- After device capture, ALWAYS wait 300–500ms before screenshot ROI processing.
- NEVER assume the UI is static; verify with a fresh capture if unsure.
- If the map is Stale, RE-CAPTURE (fresh screenshot + `uiauto inventory + map`) before proceeding.

---

## CRITICAL: Screenshot performance (keep files small)

- NEVER use Full Full-Screen Screenshots — wasteful and unnecessary.
- ALWAYS use Region Capture (ROI) — capture only the region of interest.
- ROI Validation: Capture → Compare. MUST be high-confidence; retry if not.
- Save all screenshots to: `screenshots/[app-name]-[feature]/` (NEVER the bundle root).
- Filename Pattern: `[NNN]-[slug]-[focus].png` (e.g., `001-search-entry-input.png`).
- Sequential numbering is scoped per screenshot folder (each new folder starts at 001).
- Slug: Matches the folder slug (e.g., `search-entry`, `app-tab-bar`).
- Focus: Describes the ROI of the image (e.g., `toolbar`, `dialog`, `list`).
- If saving fails, halt with an ERROR (screenshot unsalvageable).

---

## When to use which tool

**Use UI Mapper** for standard inspection (fast and efficient).

**Use Screenshots** for these hard problems:

| Use screenshots when: | Example |
|------------------------------|---------------------------------------------------|
| Elements are hard to find | Element not identified by uamappings/automation |
| Complex interactions needed | Multi-step, context menus, drag-and-drop |
| Visual state validation | Element state (enabled/disabled, checked, colors) |
| Layout/rendering debugging | **O**verlaps, alignment, cut-off text, resizing |
| Non-standard views | Canvas, OpenGL, custom-drawn, games |
| Pixel-level precision required | Bounds off by even one pixel |
| Understanding visual structure | Component layout and relationships |

---

## System instructions: what you are allowed to do

You have Permission to Pause/Wait/Inspect during interactions for review of the updated uamappings and flatmap to keep the interaction context in focus.

**Form factors**: Desktop, Mobile, Smart TV share the same XML structure (device-agnostic).

**Supported actions and gestures:**

- **Basic gestures**

| Action | Android | iOS | Desktop |
| ------------------------------ | ------------------ | ----------------- | ------------------ |
| **Tap/Click** | `tap {x} {y}` | `tap {x} {y}` | `click {x} {y}` |
| **Long Press/Right-click** | `long_press {x} {y} [ms]` | `long_press {x} {y}` | `rightclick {x} {y}` |
| **Double Tap/Double-click** | `2 × tap` | `2 × tap` | `doubleclick {x} {y}` |
| **Type** | `type "text" {x} {y}` | `type "text" {x} {y}` | `type "text" {x} {y}` |

- **Scrolling and navigation**

| Action | Android | iOS | Desktop |
| --------------------------- | -------------------- | ---------------------- | -------------------- |
| **Scroll** | `swipe {x1} {y1} {x2} {y2} [ms]` | `scroll {x} {y} [distance]` | `scroll {x} {y} [up/down] [clicks]` |
| **Horizontal swipe** | `swipe {x1} {y1} {x2} {y2}` | `swipe {x1} {y1} {x2} {y2}` | `drag {x1} {y1} {x2} {y2}` |

- **Mouse-specific (Desktop only)**

| Action | Description |
| ------------------------------- | --------------------------------------- |
| `move {x} {y}` | Move the cursor to `{x} {y}` without clicking |
| `drag {x} {y} {to_x} {to_y}` | Click-and-drag from `{x} {y}` to `{to_x} {to_y}` |
| `rightclick {x} {y}` | Context menus (macOS `rightclick`, Windows `rclick`) |
| `doubleclick {x} {y}` | Double left-click (Desktop) |

- **Other platform-specific actions**

| Action | Description |
| ---------------------------------------------- | ---------------------------------- |
| `keyevent <KEY>` | Android: back, home, recent apps, etc. |
| `press_key "KEY"` | Windows: press a specific key |
| `launch <bundle-id>` | Launch an app |
| `hide` | Hide (macOS only) |

- **Gestures (Advanced)** — Multi-touch on Mobile

| Gesture | Platform | Description |
| -------------------------------- | -------- | ----------------------------------- |
| `pinch {x} {y} [scale] [steps]` | Mobile | Zoom in/out at `{x} {y}` |
| `rotate {x} {y} [rotation] [steps]` | Mobile | Rotate at `{x} {y}` (degrees) |
| `drag_and_drop {x1} {y1} {x2} {y2} [ms]` | Mobile | Press, hold, and move coordinates |

---

## Core workflow (5 steps)

Use cases (troubleshooting, exploration, validation) share the same workflow:

### Step 1: check if this skill is actually needed (decision gate)

Before diving into pixels, ask one question:

> **"Did UI Mapper give me enough info to proceed?"**

- **YES** → Stop here. Use UI Mapper (it is 10x faster).
- **NO** → Continue, and read `references/microscope-later.md` to understand when to step back.

### Step 2: identify exact screen/bounds (discovery)

**NEVER guess positions. Derive coordinates from uamappings data.**

1. Capture at the system level (NOT uamappings): `uiauto capture --output-dir ./shots/`
2. Extract the screen/bounds of the target element:
   - Look for `<window>` or bounds data in the initial XML.
   - Note the full screen position from the FILE header (Screenshot: `path`).
3. You may need the actual Pixel coordinates later for ROI/pixel validation.

### Step 3: record success and failure states (evidence)

Automated verification returns JSON (`success: true/false`). You MUST map this to the VISUAL state.

| CANONICAL | Visual (Color) | Visual (Form) | Visual (Opacity) | Note |
| --------------- | ------------------- | -------------- | ---------------- | ---- |
| `disabled` | Gray (#9E9E9E) | Faded icon | ~40—60% | Cannot click |
| `read-only` | Light gray | Static text | 100% | May show a caret |
| `processing` | Blue/Orange | Spinner/Progress | Animated | Busy |
| `failed` | Red/Yellow | Icon | Highlighted | Action required |
| `pending` | Neutral | Dashed border | ~80% | Waiting for input |

**ALWAYS capture evidence of BAD, ERROR, MALFORMED, or DEVIATING states FIRST before continuing.**

---

### Step 4: analyze and interact (pixel-level interaction)

- **Flat description**: What you see (visuals, bounds, hierarchy).
- **High-confidence ROI for interaction**:
  No blind coordinate guessing. Determine target coordinates 100% from uamappings (min 5 targets).
- **Validate bounds** (zero margin):
  Check that click bounds are correct. ALWAYS click the center (50% point).
- **Zoom via cropping**: Use ROI screenshots of relevant regions instead of full-site work.
- **Bug/challenge**: Address what you SEE (not what you Think). Fix before continuing.
- **Cross-validation**: Compare XML semantic data (`<clickable>`, `<edit-text>`) against pixel evidence.

**Click validation:**

- ALWAYS Click the Center of the target element.
- Check if the Click landed (visual change or uiauto event).
- If Click Failed → Adjust accuracy (bounds validation), NEVER click randomly elsewhere.
- Max 2 attempts; if it still fails → STOP and assume the environment is Broken.

---

### Step 5: cleanup, lints, and finish

- Keep your Screenshots/Summary in the current folder (`./screenshots/[app-name]-[feature]/`).
- Fill in the Reporting Template (see File Pointers below).
- Do not guess; document only What you have Seen.

---

## Handling failure (self-correction)

### Common failure modes

| Symptom | Cause | Fix |
| ------------------------- | ------------------- | --------------------------- |
| Capture returns empty XML | System/UI permission | Check accessibility permissions |
| Element not in tree | Rendering/Shadow DOM | Use screenshots ROI directly |
| Bounds look wrong | Scaling factor (Retina/Display) | Check `uamappings` for the ratio |
| Interaction timeout | Animation running | Increase wait to 500ms before clicking |

### Debugging flow (Fail Fast)

1. WAS the step successful (JSON return); if False, WHY.
2. WHAT evidence can you gather: fresh capture, new uamappings, ROI screenshots.
3. WHOSE fault is it — application or environment?
4. WHERE in the tree is the failure?
5. WHEN did it fail (timing/context)?
6. HOW do we fix it (re-capture, wait, ROI)?

---

## Analysis checklist (self-validation)

- [ ] Did you read `references/microscope-later.md`?
- [ ] Did you enforce Data Freshness (<30s)?
- [ ] Did you verify the uamappings (Internal Review)?
- [ ] Did you record failure states (Evidence collection)?
- [ ] Did you use flat analysis (NO recursive decomposition)?
- [ ] Did you click at 100% confidence (ALWAYS center)?
- [ ] Did you minimize file artifacts (ROI instead of full screen)?
- [ ] Did you stay in character (Microscope supporting UI Mapper)?

---

## Visual element descriptions (flat analysis)

```text
[Component Name] - [VISUAL STATE] - [INTERACTION]

[Specific visual details - what you literally see]

Text content: "[Exact visible text]"

Colors (if relevant):
- Background: #RRGGBB or name (gray, blue)
- Text: color/weight
- Border/shadow: if present

Dimensions/Spacing:
- Width x Height: element bounds
- Spacing: gaps to neighbors, alignment

Visual indicators:
- Icons: name/description
- Shadows: elevated/floating appearance
- Borders: rounded corners, outline thickness

Interaction states (if visible):
- Default: normal appearance
- Hover: color/underline changes (desktop only)
- Active/Pressed: highlighted appearance
- Disabled: grayed out, cursor not-allowed
```

---

## Reporting template

- **Investigation goal:** [What was I looking for?]
- **Screenshot ID:** [Filename/Sequence #]
- **Findings:** [Structure, Elements, Micro-interactions]
- **Data quality:** [Confidence percentage]
- **Conclusion:** [Is the Goal reached?]

## Example analysis output

```text
[Example Analysis] — [short title]

WHAT I ANALYZED:
- Target: [component name and type]
- Platform: [iOS/Android/Desktop]
- Method: [screenshot analysis, bounds validation, etc.]

STRUCTURE:
- Layout: [flat visual layout]
- Hierarchy: [parent-child relationships]

INTERACTIONS:
- Touch targets: [okay/constraints]
- Gestures: [tap, scroll, etc.]

FINDINGS & ISSUES:
- [Component A]: [finding]
- [Component B]: [finding]

TARGETS FOR INTERACTION (with coordinates):
- [Element 1]: ({x}, {y}) width x height - [action]
- [Element 2]: ({x}, {y}) width x height - [action]

CONCLUSION:
[Key finding or main insight from this analysis]
```

---

---

## Platform-specific reference guide (CRITICAL: read only per issue)

This file does NOT load platform-specific reference files by default (to minimize context). You MUST consult the correct reference for your task to avoid repeated attempts.

### When to read a reference

| Your task | Reference |
|--------------------------|---------------------------------------------|
| Element not found | `troubleshooting.md` |
| Interaction failed | `troubleshooting.md` |
| Performance/timeout | `troubleshooting.md` |
| Looking for coordinates | `bounds.md` |
| Drag-and-drop/swipe | `element-types.md` |
| Platform-specific behavior | `interactions/{platform}.md` |
| Efficiency/cost questions | `efficiency.md` |

### Critical issue patterns

**Element not found?**
→ Read: `references/troubleshooting.md` (element type patterns) + `references/bounds.md` (validation)
**Actions failing?**
→ Read: `references/troubleshooting.md` (type mapping matrix) + `interactions/{platform}.md`
**Multiple apps open?**
→ Verify: `uiauto focus` first, target the CORRECT app.
**Fullscreen game/canvas?**
→ Read: `references/element-types.md` (canvas regions, OpenGL) + `references/troubleshooting.md`

---

## Quick start by issue

| Issue | Action |
| ----------------------- | --------------------------------------------------------------------- |
| **Element not found** | Read `troubleshooting.md` (element type patterns) |
| **Click/typing failed** | Read `troubleshooting.md` (type mapping) + `interactions/{platform}.md` |
| **Performance/timeout** | Read `troubleshooting.md` (validation) + `efficiency.md` |
| **Multiple apps open** | Verify: `uiauto focus --target [app-name]` first |
| **Fullscreen game?** | Read `element-types.md` (canvas regions) + `troubleshooting.md` |
| **Non-standard UI?** | Read `element-types.md` (custom views, video, WebView) + `troubleshooting.md` |

---

## Element classification guide

### Navigation (structural)

**Role**: Present for orientation or accessing content on other screens (less important).

| Element | Type | Signals |
|-----------------|------------------|------------------------------------------------|
| Button | **navigation** | Top-left, back-arrow icon |
| Tab | **navigation** | Fixed at bottom, tab role, links to other screens |
| Link | **navigation** | Colored text, "`→`" icon, changes screen |
| Sidebar item | **navigation** | Left on desktop, navigation role |

### Controls (primary action)

**Role**: Things the user **taps** to get something done.

| Element | Type | Signals |
|-------------|-------------|--------------------------|
| Button | **control** | high z-order, prominent |
| Input field | **control** | edit text, placeholder |
| Slider | **control** | thumb/gutter, selectable |
| Toggle | **control** | on/off state |
| FAB | **control** | Floating Action Button |

### Content (information)

**Role**: Content the user consumes (read, watch, listen).

| Element | Type | Signals |
|---------------------------------|-----------|-------------------------------|
| Textview | **content** | role=text, not clickable |
| Image | **content** | Visual, not a button |
| Header | **content** | Semantic header |
| List item | **content** | In list, between other items |
| Label/description | **content** | role=text |

### Decorations (ambient)

**Role**: Visual only, no interaction.

| Element | Type | Signals |
|----------------|---------------|-----------------------------|
| Spacer/divider | **decorations** | Empty, role=separator |
| Section bg | **decorations** | Background color only |
| Decorator icon | **decorations** | Purely aesthetic |
| Padding | **decorations** | Absolutely no padding |

### Functional elements (CRITICAL: below containers)

**Role**: Container with **meaning** that affects interaction.

| Element | Type | Signals |
|--------------------|--------------|-------------------------|
| Modal overlay | **functional** | dimming behind, z-index |
| Search bar | **functional** | Search input in nav |
| Progress tracker | **functional** | Visual progress over steps |
| Active tab | **functional** | Visual difference vs other tabs |
| Toolbar | **functional** | Fixed top, tools for current |

---

## Anchors: only for interactions (not all elements)

**Anchors** are reference points for actions/interactions (tap, click, etc.).

### When you need an anchor

✅ **Interactive** (needs an anchor): Button, SearchField, Tab, InputField
❌ **Visual** (no anchor): Background, Image, Label-only, Spacer

### How to make an anchor (device-agnostic)

```text
SELECT: [element role or type]
WHERE: [property = value, scope = parent]
```

**Examples:**

- iOS Tab: `SELECT: AXButton WHERE: label = "Search" IN scope = TabBar`
- Android Button: `SELECT: button WHERE: text LIKE '%Save%'`
- Desktop Search: `SELECT: AXTextField WHERE: placeholder CONTAINS 'Search'`

---

## Role mapping across platforms

| Role | iOS (SwiftUI/UIKit) | Android (Compose) | Desktop (Win/Mac) |
| ------------------- | ------------------------------- | ----------------------------- | ------------------------ |
| **button** | AXButton | button | Button / AXButton |
| **text field** | AXTextField / AXSecureTextField | edit-text | TextField / Edit |
| **static text** | AXStaticText | text-view | Text / AXStaticText |
| **image** | AXImage | image-view | Image / AXImage |
| **link** | AXLink | text-view (clickable) | Hyperlink |
| **checkbox** | AXCheckBox | check-box | CheckBox |
| **radio button** | AXRadioButton | radio-button | Radio |
| **slider** | AXSlider | seek-bar | Slider |
| **switch/toggle** | AXSwitch / AXToggle | switch | Toggle / AXSwitch |
| **progress bar** | AXProgressIndicator | progress-bar | ProgressBar |
| **tab** | AXTabBar / AXTabGroup | tab | Tab / TabItem |
| **list** | AXTable | recycler-view | List / ListBox |
| **menu** | AXMenu | menu | Menu / ContextMenu |
| **heading** | AXHeading | text-view (large) | Text (styled) |

---

## Element interaction mapping

| Android node type | Interaction type | Available actions |
| ------------------- | ---------------- | --------------------------- |
| `text-view` | content (read) | N/A (read-only) |
| `edit-text` | control | tap (focus), type text, long-press |
| `button` | control | tap, long-press (if enabled) |
| `image-button` | control | tap, long-press |
| `check-box` | control | tap (toggle) |
| `switch` | control | tap (toggle) |
| `seek-bar` | control | tap, swipe (adjust) |

---

## Bounds precision (CRITICAL for accurate interaction)

**Golden rule:** Bounds are **admicrosikropisch** (limits, not suggestions).

- Element correctly defined: `<x>D` bounds, not your interpretation.
- Deviation of even one pixel can make clicks worthless (Android tap = 64px target minimum).

**Why bounds matter:**

- **Interaction accuracy**: Tap at (100, 200) succeeds if the element is large and this is safe; for a small button (24 x 24px), a one-pixel error wastes the tap.
- **State detection**: `enabled="false"` elements are NOT clickable even if they look clickable. Bounds + state = safe interaction.
- **Zooming/magnification**: Magnifier mode (Android, accessibility service, computational zoom) is NOT a solution; the user's view is not your screenshot data.

**Common format:**

```text
<x> y <width> height
[123] 456 [789 x] 90
↑ X-coordinate (px from left)
↑ Y-coordinate (px from top)
↑ Width (pixels)
↑ Height (pixels)
```

---

## Element count match requirement

**CRITICAL:** Your element count MUST match the screenshot as closely as possible.

- Count every **meaningful interactive** element (not controls).
- If you see 8 buttons, list 8 buttons (not 7, not 9).
- If some are disabled or off-screen, note it ("8 buttons, 1 disabled").
- Empty containers/spacers: add them as decorations but not counted.
- Use Report: count: (e.g., "Found 5 buttons matching description")

---

## Failure modes & debugging

**"Element not found" in uamappings?**

1. Check **element count match** — are you looking for too many/few?
2. Is it a **content** element? Non-interactive items (spacers) may be filtered.
3. Is it a **custom view** (OpenGL, Canvas)? Use screenshots and manual bounding boxes.
4. Is the UI **below the fold**? Scroll to reveal it.

**"Wrong platform behavior" (desktop feels like mobile)?**

1. Check platform in the uamappings header.
2. Forms behave differently (desktop = mouse/keyboard, mobile = touch).

**"Interaction timeout/animation"?**

1. Wait 500—1000ms before scrolling again.
2. Use explicit `uiauto wait 500` commands.
3. Or capture screenshot + uamappings immediately.

**"Cannot find the search bar"?**

1. Search bars are often **functional elements** (not just controls).
2. They may be in navigation/toolbars (not in the main container).
3. Check the uamappings: they may appear as `edit-text` + `search` hint.

```text
[Error Handling]
- Element not found → Retry up to 1 time → STOP and report [ERROR]
- Bounds mismatch → Re-capture; use ROI screenshots to confirm actual bounds
- Multiple targets → Try to focus on one app, or local context if needed
```

---

## Core anti-hallucination guard: "What do you see, not what you expect"

**Rule:** Describing what you CANNOT SEE is a [HALLUCINATION].

- Do not add features, tooltips, or menus that are not visible.
- Describe tint colors, contrast, weights — any pixel you see.
- Use VISUAL evidence colors: `"Dark Blue (#0B3D91)"`, not just "blue".

---

## Role in the skill system

You are a **lens tool**, not the analysis tool.

**Relationship to other skills:**

- **ui-mapper**: Standard inspector (fast). Use it FIRST for overview.
- **interaction**: Uses your anchor results to perform actions.
- **agent-orchestrator**: Invokes you (the advanced) when needed.

**Here is where you fit:**

```text
Task → UI Mapper (overview) → Screenshots (deep dive if needed) → Interaction (act)
         ↓                       ↓
    (fast, 47% token)         (slow, zoom)
```

---

## Platform-specific considerations (selective)

**iOS:** Prefers UIKit patterns; check SF Symbols (system icons); text placeholder in AXTextField.
**Android:** Wide variation by manufacturer; check Intent actions (`android.intent.action.VIEW`), gestures like swipe-to-refresh.
**Desktop:** Menu bar, window chrome, draggable regions, keyboard shortcuts (Cmd/, Ctrl+), mouse hover states, scroll wheel.

---

## Efficient operations (last guidance)

| Operation | When | Token cost |
| ----------------------- | ----------------------------- | ------ |
| **Capture screen** | When map is stale (>30s) | ~400 |
| **Region capture (ROI)** | Most analysis (recommended) | ~800 |
| **Full screenshot** | Only for small screens | ~2000+ |
| **Bounds validation** | Verification needed | ~200 |
| **Element search** | One element or tree | ~300 |

**Token efficiency goals:**

- FAST: < 800 tokens per analysis cycle
- Acceptable: < 1500 tokens
- Do NOT exceed this max: > 2000 tokens (warn against repeated heavy captures)

---

## Critical confidence signals

| Signal | Confidence | Action |
| ----------------------------- | ----------- | ------------------------------------- |
| **Visible text** matches hint | 95% | Proceed: element is the intended one |
| **Role matches expected** | 90% | Consider bounds size |
| **Interactive** | 85% | Verify bounds match the action type |
| **Attributes correct** (disabled?) | 100% | Stop: element NOT usable for the action |

---

## Final rule

**If you cannot see it, you cannot click it.**
**If you cannot measure it (pixels), do not attach precision to it.**
**If you cannot verify it, do not assume it.**

---

This skill is the final authority when you need **pixel-perfect clarity**.

---

## File pointers

| Reference file | When to read |
| -------------------------------------| ---------------------------------------------------- |
| `references/microscope-later.md` | [MUST] First-time usage — read before first analysis |
| `references/troubleshooting.md` | Elements not found / interaction failed |
| `references/bounds.md` | Coordinates / bounds questions |
| `references/element-types.md` | Element classification / role mapping questions |
| `references/efficiency.md` | Token cost/efficiency validation |
| `interactions/{platform}.md` | Platform-specific behavior (ios/android/windows/macos) |
| `references/flatmap-structure.md` | Flat analysis UI structure / composite patterns |
| `references/debugging-flow.md` | Failure modes / self-correction |

**Rule:** Read `microscope-later.md` first, check platform interactions as needed.

---

## Version & accuracy

**Version**: 2.0 (Single-file mode)
**Backend**: uamappings + ROI pixel validation (accuracy > 95%)
**Scale**: Resolution-agnostic via flat structural paths
**Last updated**: [Current date]

**Accuracy gate**: All bounds come from actual pixels + uamappings verification, NOT from uamappings alone.

[IMPACT:ACTIVE:ImpactAnalysis/active]
