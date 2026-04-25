# Architecture Overview

This document describes the overall architecture of **Live HTML & CSS Editor**, explaining how the same core application runs as a web app and as a native desktop executable using Electron.

The architecture is intentionally simple, modular, and offline-first.

---

## High-Level Overview

The project is built around a single principle:

> **One frontend application, multiple runtimes.**

The core editor logic lives entirely in the Vue frontend. Different environments (browser or desktop) merely *host* that frontend.

```
┌──────────────┐
│   Vue App    │  ← Editor, Preview, State, Persistence
└───────┬──────┘
        │
 ┌──────┴────────┐
 │   Runtime     │
 │───────────────│
 │ Browser       │ → Web App / PWA
 │ Electron      │ → Desktop Executable
 └───────────────┘
```

---

## Core Layers

### 1. Presentation Layer (Vue Components)

Responsible for rendering UI and handling user interaction.

**Key components:**

* `Editor.vue` — text input for HTML and CSS
* `Preview.vue` — sandboxed iframe rendering
* `SplitLayout.vue` — layout and resizing logic

This layer contains **no platform-specific code**.

---

### 2. State & Logic Layer

Handles:

* editor content state
* preview generation
* persistence

Uses Vue’s reactivity system to:

* track HTML and CSS changes
* regenerate iframe `srcdoc`
* trigger saves

This layer is platform-agnostic and reused everywhere.

---

### 3. Persistence Layer

Abstracts how projects are saved.

Supported strategies:

* `localStorage` (default)
* `IndexedDB` (for larger projects)
* cloud storage (web app only)

The editor does not assume a backend exists.

---

## Preview Rendering Model

The preview system uses a sandboxed `<iframe>`:

* HTML and CSS are merged into a single document
* CSS is injected inside `<style>` tags
* Content is written via the `srcdoc` attribute

Benefits:

* instant updates
* isolation from editor styles
* no build or transpilation step

---

## Runtime Environments

### Web Runtime

* Served via Vite during development
* Static assets in production
* Optional backend for authentication and cloud sync

Limitations:

* restricted filesystem access
* browser sandboxing

---

### Electron Runtime

Electron wraps the Vue app in a Chromium shell.

Responsibilities of Electron:

* window management
* native menus
* file open/save dialogs
* application lifecycle

The Vue app is loaded as a static build.

**Important:** Electron does not contain editor logic.

---

## Security Considerations

* Preview iframe is sandboxed
* No Node.js access from rendered HTML
* Electron context isolation enabled
* No remote code execution

User-generated HTML and CSS never escape the sandbox.

---

## Extensibility Points

The architecture supports future expansion:

* plugin system (editor-side only)
* theme / skin registry
* export pipelines (HTML, ZIP)
* alternate runtimes (Tauri, PWA)

Because logic is frontend-only, new runtimes require minimal effort.

---

## Design Philosophy

* **Offline first** — functionality never depends on connectivity
* **Frontend driven** — logic lives where users interact
* **Runtime agnostic** — platforms are wrappers, not dependencies
* **Minimal abstraction** — no unnecessary layers

This keeps the project understandable, hackable, and future-proof.
