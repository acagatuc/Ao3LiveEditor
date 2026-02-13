# Ao3 Live HTML & CSS Editor - Tutorial

Welcome to the **Ao3 Live HTML & CSS Editor**! This tool lets you edit HTML and CSS in real time, preview your work instantly, and experiment with AO3-style workskins safely.

This tutorial will walk you through the **key features**, **button functions**, the underlying **Vue architecture**, and **next steps** for extending the project.

---

## 🚀 Try It Live

👉 https://acagatuc.github.io/Ao3LiveEditor/

This is a live, in-browser HTML & CSS editor inspired by AO3’s workskin system.
No data is stored. Everything runs locally in your browser.

⚠️ This app does not upload or store your work.
All content stays on your machine in local storage (think cache).

---

## ✨ Key Features

1. **Sanitization**
   - User HTML is sanitized using a whitelist approach.
   - Only AO3 safe tags and attributes are allowed (Find a list on Ao3's website [here](https://archiveofourown.org/faq/formatting-content-on-ao3-with-html?language_id=en#canihtml)).
   - Prevents injection of scripts or unsafe content while preserving layout fidelity.

2. **Scroll State Sync**
   - Editor and preview scroll together when controlled from the editor window.
   - Implemented with reactive `editorScrollRatio` and `previewScrollRatio` in a shared Vue state file.
   - Prevents desynchronization when scrolling large content.

3. **Instantaneous Preview**
   - Updates the preview `<iframe>` immediately on edits.
   - The iframe uses `srcdoc` to render HTML + CSS safely.
   - Debounce is implemented to maintain performance for long documents.

4. **Link Safety**
   - `<a>` tags remain in the preview but are disabled to avoid accidental navigation.
   - A tooltip in the preview footer informs users: “Links disabled in preview”.
   - A 'not-allowed' cursor is displayed when hovering over links in the `<iframe>`

---

## 🚀 Button Functions

The editor includes several toolbar and panel buttons. Here’s what they do:

### Export

- Exports your current document (HTML or CSS depending on the tab) as a `.txt` file.
- Uses the browser `Blob` API for local download — **no server or backend is involved**.

### Format CSS

- Formats the CSS in your editor using the Prettier formatter.
- Button is placed below the CSS textarea, aligned to the right, and only visible when on the CSS tab.

### Hide Creator Style

- Mimics AO3’s “Hide Creator Style” feature.
- Strips all CSS but keeps HTML intact.
- Toggleable via a button above the preview.
- Helps ensure your story is readable even with heavy styling (as per AO3 instructions).

### HTML / CSS Tabs

- Switch between editing HTML and CSS with Vuetify `<v-tabs>`.
- Live preview updates automatically as you type.

### Tutorial / Reference Button

- Toolbar button with `mdi-open-in-new` icon.
- Opens a new tab linking to: [https://www.w3schools.com/html/](https://www.w3schools.com/html/)
- Example usage: a button in the toolbar that opens the link safely in a new window.

---

## 🧩 Vue & Layout Notes

- **Vue 3 + Composition API** powers the editor.
- **Vuetify** is used for styling, tabs, buttons, toolbars, and tooltips.
- **Components**:
  - `EditorInput.vue` — the HTML/CSS editor with tabs and format buttons.
  - `PreviewFrame.vue` — the live preview iframe.
  - `SplitPanel.vue` — resizable horizontal split layout.
  - `AppToolbar.vue` — main toolbar.

- **Reactive state** includes:
  - Scroll positions
  - Tab selection
  - Hide-style toggle

- Layout ensures the **editor and preview always fill the viewport**, and textareas expand as content grows.

---

## 💾 Data Handling & Privacy

- All edits and previews run entirely in the **user’s browser**.
- **No backend** — nothing is saved or uploaded anywhere (if you want to check this, feel free to check the network tab in browser tools. Word of warning: if your HTML contains images, those will appear under the network tab since you're technically 'GET'ting those 😉).
- Local export is via the browser’s file download mechanism.
- Safe for AO3 content and personal testing.

---

## 🛠 Additional Notes

- Two-way scroll sync is implemented using reactive refs to prevent feedback loops.
- CSS formatting uses `vuetify`.
- HTML formatting uses a whitelist sanitizer based on AO3 sanitizer list.
- `iframe`

---

## 🔮 Next Steps

### 1. **Custom Workskins / Themes**

- Allow users to create, save, and switch between custom CSS “workskins.”
- Preview different font families, sizes, colors, and spacing to simulate AO3 styling.
- Consider adding a theme picker dropdown in the toolbar.

### 2. **Electron Desktop App**

- Wrap the Vue + Vite editor in **Electron** to produce `.exe` or `.dmg` versions.
- Benefits:
  - Offline access
  - Local file system integration for opening and saving multiple stories
  - Optional auto-update functionality

- Could use **Vue 3 + Electron + Vite** template to simplify setup.

### 3. **HTML Autoformatting / Cleanup**

- Enhance HTML formatting to:
  - Remove extra whitespace and indentation
  - Preserve only valid tags
  - Keep `<br>` and `<span>` spacing intact

- Optional: provide a **“tidy HTML” button** alongside CSS formatting.
- I am personally unsure this will ever work but we'll see.

### 4. **Advanced Scroll Sync & Multi-Editor Support**

- Extend scroll synchronization to handle multiple open story tabs.
- Implement optional independent scrolling for users who prefer it.
- Add a visual scroll indicator for better alignment between editor and preview.

### 5. **Enhanced Toolbar Features**

- Add buttons for:
  - Copy to clipboard
  - Open in external editor
  - Quick insert of common AO3 HTML snippets

- Tooltips explaining each button’s effect for better UX.

### 6. **User-Centered Enhancements**

- Provide a **story template library** for new users.
- Include **tutorial prompts** for new writers about safe CSS and formatting.
- Consider saving **local presets** for favorite workskins or common story structures.

### 7. **Optional Cloud Sync / GitHub Integration**

- If desired, allow optional GitHub Gists or repo syncing for personal stories.
- **Always ensure user control**, since the core app currently saves everything **locally only**.

---

## 🏁 Conclusion

Thank you for exploring the **Ao3 Live HTML & CSS Editor**! I hope this tool helps you experiment safely with AO3-style stories and HTML/CSS formatting.

Feel free to **try out all the features**, give feedback, or suggest improvements — your input is greatly appreciated. Enjoy writing and designing your fanfic content!
