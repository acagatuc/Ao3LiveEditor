# Migration Guide: Vanilla JS → Vue → Electron

This document outlines a step-by-step migration path that evolves the original vanilla JavaScript editor into a structured Vue application, and finally into a fully executable desktop app using Electron.

The goal is to **avoid rewrites**, keep the app functional at every stage, and preserve its lightweight, offline-first nature.

---

## Phase 1: Stabilize the Vanilla JavaScript Version

Before introducing Vue, make sure the existing project is well-organized:

* Extract editor logic into reusable functions
* Separate responsibilities:

  * editor input handling
  * preview rendering
* Avoid global variables
* Ensure the app works fully offline

**Outcome:** logic that can be reused inside Vue components with minimal changes.

---

## Phase 2: Introduce Vue (Web App Only)

1. Create a new Vue project (Vite recommended)
2. Move the editor `<textarea>` into `Editor.vue`
3. Move the preview `<iframe>` into `Preview.vue`
4. Replace DOM querying with reactive state:

```js
const html = ref('')
const css = ref('')
```

5. Watch for changes and regenerate the iframe `srcdoc`

At this stage:

* The app behaves exactly like the vanilla version
* Only the internal structure has changed

---

## Phase 3: Componentize the Application

Break the app into focused components:

* `Editor.vue` → handles text input only
* `Preview.vue` → handles iframe rendering only
* `SplitLayout.vue` → manages layout and resizing

This improves:

* readability
* maintainability
* feature extensibility

---

## Phase 4: Add Local Persistence

Persist editor state locally:

* `localStorage` for simple setups
* `IndexedDB` for larger projects

Restore state on load so users never lose work.

At this point, the app feels complete even without Electron.

---

## Phase 5: Wrap the App with Electron

1. Add Electron as a development dependency
2. Create a minimal `electron/main.js`
3. Point Electron to the Vue build output
4. Enable optional desktop features:

   * native menus
   * file open/save dialogs
   * system shortcuts

**No editor logic changes are required.**

You now have a true desktop application.

---

## Phase 6 (Optional): Add Backend Features

For the hosted web version only:

* User authentication
* Cloud-saved projects
* Cross-device sync

The desktop app can remain:

* fully offline
* local-only
* privacy-first

---

## Guiding Principle

> The editor should always work, regardless of platform or connectivity.

Vue and Electron are tools for **portability**, not dependency bloat.
