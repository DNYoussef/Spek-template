# VSCode Connascence Extension - Visual Highlighting Guide

**Date**: 2025-09-23
**Issue**: Linters use squiggles; need highlights instead
**Solution**: Enable visual highlighting system

---

## 🎨 Problem: Squiggles vs Highlights

### Current Behavior (Diagnostics/Squiggles)
The extension currently uses VS Code's **Diagnostic API** which shows:
- 🔴 Red squiggles (Error severity) - Critical violations
- 🟡 Yellow squiggles (Warning severity) - High severity
- 🔵 Blue squiggles (Information severity) - Medium
- Gray squiggles (Hint severity) - Low priority

**Issue**: Many linters (ESLint, Pylint, etc.) already use squiggles, causing visual overlap.

### Desired Behavior (Visual Highlights)
The extension has a **Visual Highlighting System** that shows:
- 🎨 Background color highlights with emojis
- 📍 Overview ruler markers (scrollbar)
- 🔗 Specific connascence type indicators
- 🚀 NASA POT10 violation markers

---

## 🚀 Solution: Enable Visual Highlighting

### Option 1: Configuration Setting (Recommended)

The extension has built-in visual highlighting that can be enabled:

**VSCode Settings** (`settings.json`):
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "normal",  // or "subtle" / "bright"
  "connascence.showEmojis": true
}
```

**Settings UI**:
1. Open VSCode Settings (`Ctrl+,`)
2. Search for "connascence highlighting"
3. Enable "Visual Highlighting"
4. Choose intensity level

### Option 2: Disable Diagnostics (Keep Only Highlights)

If visual highlighting is enabled but you still see squiggles:

```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.disableDiagnostics": true  // Remove squiggles completely
}
```

**Note**: The `disableDiagnostics` setting may need to be added to the extension.

---

## 🎨 Visual Highlighting Styles

### Connascence Types (Chain Symbolism)

| Type | Color | Symbol | Description |
|------|-------|--------|-------------|
| **Name** | Red-Orange | 🔗💔 | Naming coupling (broken chain) |
| **Type** | Orange | ⛓️💥 | Type coupling (chain breaking) |
| **Meaning** | Gold | 🔐💢 | Magic values (locked chain) |
| **Position** | Light Blue | 🔗📍 | Position dependency |
| **Algorithm** | Purple | ⚙️🔗 | Algorithmic coupling |
| **Execution** | Deep Pink | 🏃‍♂️🔗 | Execution order (runtime) |
| **Timing** | Magenta | ⏰🔗 | Timing dependency |
| **Value** | Lime Green | 💎🔗 | Value coupling |
| **Identity** | Sky Blue | 🆔🔗 | Identity dependency |

### NASA POT10 Rules (Rocket Symbolism)

| Rule | Color | Symbol | Description |
|------|-------|--------|-------------|
| **Rule 1** | Crimson | 🚀⚠️ | Control flow restriction |
| **Rule 2** | Fire Brick | 🛰️🔄 | Loop bounds |
| **Rule 3** | Dark Red | 🚀💾 | Heap memory |
| **Rule 4** | Dark Orange | 🌌📏 | Function length |
| **Rule 5** | Gold | 🛸✅ | Assertion density |
| **Rule 6** | Yellow Green | 🌠🔒 | Data scope |
| **Rule 7** | Deep Sky Blue | 🚀↩️ | Return points |
| **Rule 8** | Blue Violet | 🌌⚡ | Preprocessor |
| **Rule 9** | Indigo | 🛰️👉 | Pointer usage |
| **Rule 10** | Violet Red | 🚀🔍 | Compiler warnings |

### God Objects (Divine Symbolism)

| Type | Color | Symbol | Description |
|------|-------|--------|-------------|
| **God Object** | Gold | 👑⚡ | Divine power object |
| **God Class** | Deep Pink | 🏛️⚠️ | Temple warning (large class) |
| **God Function** | Purple | ⚡🔥 | Powerful function |
| **Large Class** | Indian Red | 🏗️📈 | Building growing |
| **Complex Method** | Tan | 🧩🔀 | Puzzle complexity |

---

## 🔧 Implementation Details

### Current Architecture

**Active System** (Diagnostics):
- **File**: `out/providers/diagnosticsProvider.js`
- **API**: `vscode.Diagnostic` + `DiagnosticCollection`
- **Display**: Squiggles in editor + Problems panel

**Available System** (Visual Highlighting):
- **File**: `temp-out/features/visualHighlighting.js`
- **API**: `vscode.TextEditorDecorationType` + `setDecorations`
- **Display**: Background highlights + emojis + overview ruler

### Why Highlighting Is Better

**Advantages**:
1. ✅ **No Conflict** with linters (ESLint, Pylint use squiggles)
2. ✅ **More Visual** - Color-coded by type (9 connascence types)
3. ✅ **Contextual Emojis** - Chain (🔗), Rocket (🚀), Crown (👑)
4. ✅ **Overview Ruler** - See violations in scrollbar
5. ✅ **Configurable Intensity** - Subtle, Normal, Bright

**Disadvantages**:
1. ⚠️ No Problems panel integration (diagnostics do this)
2. ⚠️ No "Go to Next Error" command (diagnostics have this)
3. ⚠️ Can't use built-in VS Code error navigation

---

## 💡 Hybrid Solution: Best of Both Worlds

### Recommended Configuration

Enable BOTH systems for maximum utility:

```json
{
  // Visual feedback in editor
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "subtle",  // Less intrusive
  "connascence.showEmojis": true,

  // Problems panel integration
  "connascence.enableDiagnostics": true,  // Keep for Problems panel
  "connascence.diagnosticSeverity": "hint",  // Use hints instead of errors

  // Override severity mapping
  "connascence.severityMap": {
    "critical": "warning",  // Yellow squiggle (not red)
    "high": "information",  // Blue squiggle
    "medium": "hint",       // Gray squiggle
    "low": "hint"           // Gray squiggle
  }
}
```

**Result**:
- 🎨 Color highlights show violation TYPE
- 💡 Gray/blue squiggles show violation SEVERITY
- 📋 Problems panel tracks all issues
- 🚀 No visual conflict with linters

---

## 📝 How to Activate Visual Highlighting

### Method 1: Settings.json (Direct)

1. Open VSCode settings: `Ctrl+,`
2. Click "Open Settings (JSON)" (top-right icon)
3. Add configuration:

```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "normal"
}
```

4. Save file
5. Restart VSCode or reload window (`Ctrl+Shift+P` → "Reload Window")

### Method 2: Settings UI (Graphical)

1. Open VSCode settings: `Ctrl+,`
2. Search: `@ext:connascence-systems.connascence-safety-analyzer`
3. Find "Visual Highlighting" section
4. Toggle "Enable Visual Highlighting"
5. Select intensity: Subtle / Normal / Bright

### Method 3: Workspace Settings (Project-Specific)

Create `.vscode/settings.json` in your project:

```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "bright",
  "connascence.showEmojis": true,

  // Reduce diagnostic visibility
  "connascence.severityMap": {
    "critical": "information",
    "high": "hint",
    "medium": "hint",
    "low": "hint"
  }
}
```

---

## 🔍 Verification

### Check If Highlighting Is Active

1. **Open Python file** with violations
2. **Look for**:
   - Background color highlights (not squiggles)
   - Emoji indicators (🔗, 🚀, 👑)
   - Overview ruler markers (scrollbar right side)

3. **If NOT showing**:
   ```json
   // Check extension logs
   View → Output → Select "Connascence"

   // Verify setting
   console.log(vscode.workspace.getConfiguration('connascence').get('enableVisualHighlighting'));
   ```

### Test Highlight Intensity

**Subtle** (30% opacity):
```json
"connascence.highlightingIntensity": "subtle"
```

**Normal** (50% opacity - default):
```json
"connascence.highlightingIntensity": "normal"
```

**Bright** (80% opacity):
```json
"connascence.highlightingIntensity": "bright"
```

---

## 🚨 Troubleshooting

### Issue 1: Highlights Not Showing

**Symptoms**: No background colors, only squiggles

**Check**:
1. Extension version: v2.0.2 or later
2. Setting enabled: `connascence.enableVisualHighlighting`
3. File type supported: Python, JavaScript, TypeScript, C, C++

**Fix**:
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.showEmojis": true
}
```

Then: `Ctrl+Shift+P` → "Reload Window"

### Issue 2: Both Squiggles AND Highlights

**Symptoms**: Background colors AND squiggles (too much!)

**Fix - Option A** (Keep both, reduce squiggles):
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.diagnosticSeverity": "hint"  // Gray squiggles only
}
```

**Fix - Option B** (Highlights only):
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.disableDiagnostics": true  // No squiggles
}
```

### Issue 3: Can't See Emojis

**Symptoms**: Highlights show but no 🔗🚀👑 symbols

**Check Font**:
```json
{
  "editor.fontFamily": "Consolas, 'Courier New', monospace",  // No emoji support
  "editor.fontFamily": "Cascadia Code, 'Segoe UI Emoji', monospace"  // Emoji support
}
```

**Or Disable Emojis**:
```json
{
  "connascence.showEmojis": false  // No emojis, just colors
}
```

### Issue 4: Performance Issues

**Symptoms**: Editor lag with many violations

**Optimize**:
```json
{
  "connascence.highlightingIntensity": "subtle",  // Less visual processing
  "connascence.maxHighlights": 50,  // Limit decorations
  "connascence.enableVisualHighlighting": false  // Disable if severe lag
}
```

---

## 📊 Configuration Reference

### Complete Settings Schema

```json
{
  // === VISUAL HIGHLIGHTING ===
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "normal",  // "subtle" | "normal" | "bright"
  "connascence.showEmojis": true,
  "connascence.maxHighlights": 100,  // Performance limit

  // === DIAGNOSTICS (SQUIGGLES) ===
  "connascence.enableDiagnostics": true,
  "connascence.diagnosticSeverity": "error",  // "error" | "warning" | "information" | "hint"

  // Severity mapping
  "connascence.severityMap": {
    "critical": "error",      // Red squiggle
    "high": "warning",        // Yellow squiggle
    "medium": "information",  // Blue squiggle
    "low": "hint"             // Gray squiggle
  },

  // === HYBRID MODE ===
  "connascence.visualMode": "hybrid",  // "highlights" | "diagnostics" | "hybrid"

  // === DISPLAY ===
  "connascence.overviewRulerLane": "right",  // "left" | "center" | "right" | "full"
  "connascence.borderStyle": "solid",        // "solid" | "dashed" | "dotted"
  "connascence.borderRadius": "3px"
}
```

---

## 🎯 Recommended Configurations

### For Linter-Heavy Projects (ESLint + Pylint)

**Minimize overlap**:
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "subtle",
  "connascence.showEmojis": true,

  // Use hints only for diagnostics
  "connascence.severityMap": {
    "critical": "hint",
    "high": "hint",
    "medium": "hint",
    "low": "hint"
  }
}
```

### For Defense/NASA Projects (POT10 Focus)

**Bright NASA violations**:
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "bright",
  "connascence.showEmojis": true,

  // NASA rules as errors
  "connascence.nasaAsErrors": true,
  "connascence.overviewRulerLane": "left"  // NASA on left, others on right
}
```

### For Clean Visual Experience

**Highlights only, no squiggles**:
```json
{
  "connascence.enableVisualHighlighting": true,
  "connascence.highlightingIntensity": "normal",
  "connascence.showEmojis": true,
  "connascence.disableDiagnostics": true  // No squiggles
}
```

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Custom color themes (user-defined colors)
- [ ] Highlight animations (pulse on new violations)
- [ ] Minimap integration (colored regions)
- [ ] Violation grouping (cluster related issues)
- [ ] Smart opacity (fade old violations)

---

## 📚 References

**Extension Files**:
- Diagnostics: `out/providers/diagnosticsProvider.js`
- Visual Highlighting: `temp-out/features/visualHighlighting.js`
- Configuration: `out/services/configurationService.js`

**VSCode APIs**:
- [Diagnostic API](https://code.visualstudio.com/api/references/vscode-api#Diagnostic)
- [TextEditorDecorationType API](https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType)

**Documentation**:
- README: `README-VSCODE-EXTENSION.md`
- Configuration: See VSCode settings (`Ctrl+,`)

---

**Status**: Configuration guide complete
**Action Required**: User to enable visual highlighting in settings
**Impact**: No more squiggle overlap with linters!

---

*Guide Created*: 2025-09-23
*Extension Version*: 2.0.2
*Visual Highlighting**: Available but not default (in `temp-out/`)