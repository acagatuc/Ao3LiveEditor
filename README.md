## 🚀 Try It Live

👉 https://your-demo-url-here

This is a live, in-browser HTML & CSS editor inspired by AO3’s workskin system.
No data is stored. Everything runs locally in your browser.

⚠️ This app does not upload or store your work.
All content stays on your machine in local storage (think cache).

# Live HTML & CSS Editor

A cross-platform live editor that lets users write HTML and CSS and see the rendered result instantly.
Built with **Vue.js** for structure and **Electron** for true desktop execution — all while remaining lightweight and dependency-minimal.

This project runs as:

* 🌐 a web app
* 🖥️ a downloadable desktop app (`.exe`, `.dmg`, `.AppImage`)
* 📡 an optional cloud-enabled app with user accounts

---

## ✨ Features

* 📄 **Live Preview** — HTML and CSS update in real time as you type
* 🎨 **Work Skin Support** — Tune and preview CSS skins instantly
* 🖥️ **Split Layout** — Editor on the left, preview on the right
* 🧠 **Framework-Powered, Still Simple** — Vue for clarity, no UI bloat
* 💾 **Offline First** — Works fully offline, saves locally
* 🏃 **Executable Desktop App** — Runs as a native app via Electron
* ☁️ **Optional Accounts** — Cloud saves and sync (web version only)

---

## 🚀 Getting Started (Web Version)

### Install dependencies

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Open the app in your browser at:

```
http://localhost:5173
```

---

## 🖥️ Desktop App (Electron)

### Run in Electron (development)

```bash
npm run electron:dev
```

### Build desktop executables

```bash
npm run electron:build
```

This produces native apps for:

* Windows (`.exe`)
* macOS (`.dmg`)
* Linux (`.AppImage`)

---

## 🛠️ How It Works

* The editor is built as a Vue app using controlled, reactive state
* HTML and CSS are combined and injected into an `<iframe>`
* The iframe is updated using `srcdoc` for instant rendering
* Electron wraps the Vue app in a Chromium shell for desktop use
* All editing logic is frontend-only and works offline

---

## 📁 Project Structure

```text
live-html-css-editor/
│
├── app/                    # Vue frontend
│   ├── components/
│   │   ├── Editor.vue
│   │   ├── Preview.vue
│   │   └── SplitLayout.vue
│   └── main.js
│
├── electron/               # Electron main process
│   └── main.js
│
├── public/
├── index.html
└── README.md
```

---

## 🌐 Web App vs Desktop App

| Feature            | Web          | Desktop      |
| ------------------ | ------------ | ------------ |
| Live preview       | ✅            | ✅            |
| Offline use        | ⚠️ (limited) | ✅            |
| File system access | ❌            | ✅            |
| User accounts      | ✅            | ❌ (optional) |
| Executable app     | ❌            | ✅            |

---

## 🔮 Future Enhancements

* User authentication and cloud storage
* Project export as standalone HTML files
* Theme / skin marketplace
* Plugin system for editor extensions

---

## 🧠 Design Philosophy

> The editor should work even if the internet disappears.

Frameworks are used for **clarity and portability**, not complexity.
