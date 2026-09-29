# AGENTS.md — Development Guidelines & Specification

## 1. Project Goal
The goal of this project is to build a production-grade, highly polished, responsive **To-Do List Web Application** using modern vanilla web technologies (HTML5, CSS3, ES6+ JavaScript) and browser `localStorage`. 

The application is designed to feel like a complete, finished consumer product rather than a simple tutorial exercise. It provides intuitive task management, responsive design across mobile/tablet/desktop, robust error handling, accessible keyboard navigation, dark/light theme switching, and instant local persistence.

---

## 2. Technology Stack
* **Markup:** Semantic HTML5 (`<main>`, `<header>`, `<section>`, `<form>`, accessible ARIA attributes).
* **Styles:** Modern CSS3 (CSS Custom Properties for dynamic theming, Flexbox, Grid, CSS transitions/animations, media queries).
* **Scripting:** Modular vanilla JavaScript (ES6+), object/functional separation, zero external runtime dependencies.
* **Storage:** Browser `localStorage` with JSON serialization and resilient parsing/validation.
* **Hosting / Deployment Target:** Static site host (GitHub Pages, Netlify, Vercel) with zero build steps required.

---

## 3. Project Structure
The repository follows a clean, single-page static architecture:

```text
/ (Project Root)
├── index.html        # Main semantic markup, application shell, and SVGs/icons
├── style.css         # Design system tokens, typography, layout, themes, animations
├── script.js         # Core application logic, state management, storage, DOM rendering
├── AGENTS.md         # Architecture, developer guidelines, and AI operating manual
└── README.md         # User documentation, setup guide, feature list, deployment guide
```

*Note: No bundlers (Webpack/Vite) or package dependencies are required for runtime execution, keeping deployment friction-free and loading times near instantaneous.*

---

## 4. Features & Requirements

### Task Management
* **Create Task:** Add tasks with title, optional category/priority tag, and due date.
* **Edit Task:** In-place editing of task title with `Enter` to commit and `Escape` to cancel.
* **Toggle Status:** Mark tasks as completed or revert back to active with visual strikethrough and status change.
* **Delete Task:** Remove individual tasks with a confirmation or quick undo toast notification.
* **Clear Completed:** Batch delete all completed tasks in one click with safety confirmation.

### Filtering & Organization
* **Filter Tabs:** View "All", "Active", or "Completed" tasks with visual indicators on the active tab.
* **Search / Quick Filter:** Instant client-side filtering as the user types in a search box.
* **Task Counter:** Live count of active items remaining and total items.

### Persistence & Data Integrity
* Automatic state sync to `localStorage` key `todo_app_tasks_v1`.
* Theme preference persisted to `todo_app_theme_v1`.
* Robust validation on parse: Gracefully handles corrupted JSON, nulls, missing IDs, or unexpected object formats without breaking the page.
* XSS mitigation: All user input is safely sanitized using text nodes or safe escaping before DOM insertion.

### UI/UX & Theming
* Modern aesthetic inspired by contemporary productivity apps (Linear, Things 3).
* Full Light & Dark theme support with smooth transitions and system preference detection (`prefers-color-scheme`).
* Empty-state illustrations and contextual helper messages (e.g., "No tasks found", "No completed tasks yet").
* Tactile button states (active, hover, focus-visible) and micro-interactions.

---

## 5. Coding Conventions

### JavaScript (ES6+)
* Use strict mode or ES modules patterns.
* Structure code into discrete, pure, or single-responsibility functions:
  - `loadTasks()`, `saveTasks()`
  - `addTask()`, `editTask()`, `deleteTask()`, `toggleTask()`
  - `filterTasks()`, `renderTasks()`, `updateTaskCount()`
  - `initApp()`, `bindEvents()`
* Avoid global state pollution: encapsulate state in a managed store object or module closure.
* Maintain unique IDs using `crypto.randomUUID()` with fallback to timestamp-random string for older browser engines.
* Handle string inputs safely: `.trim()`, prevent empty submissions or whitespace-only items.
* Never use `innerHTML` directly with unsanitized user inputs; prefer `textContent`, `createElement`, or sanitized DOM nodes.

### CSS
* Centralize color tokens, spacing scales, border radii, and shadows in `:root` and `[data-theme="dark"]` custom properties.
* Follow modern mobile-first or fluid layout conventions.
* Keep class naming descriptive and semantic (BEM or utility-hybrid, e.g., `.todo-item`, `.todo-item--completed`, `.filter-btn.is-active`).
* Use hardware-accelerated transitions (`transform`, `opacity`) for smooth 60fps animations.

### HTML
* Semantic tags: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`.
* Always pair form inputs with `<label>` (using `.sr-only` if visually hidden).
* Add explicit `type="button"` or `type="submit"` on all `<button>` elements.
* Set appropriate `aria-label`, `aria-pressed`, `aria-checked`, and `role` tags.

---

## 6. UI/UX Requirements
* **Responsiveness:** Flawless rendering across viewport widths from 320px (compact mobile) to 2560px (4K monitors).
* **Typography:** Clean, legible sans-serif font stack (`system-ui`, `-apple-system`, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif).
* **Feedback:** Visual feedback on interactions (subtle check animation, delete transition, toast notification for actions).
* **Keyboard Navigation:** 
  - Complete navigation achievable via `Tab` / `Shift+Tab`.
  - `Enter` submits new task or saves edit.
  - `Escape` cancels edit mode.
  - Focus outlines are prominent, elegant, and WCAG AA compliant.

---

## 7. Testing Requirements
Before releasing or marking any task done, the application must pass verification for:
1. **Initial Load:** Page renders cleanly without DOM errors or missing assets.
2. **Task Creation:** Adding valid tasks works; whitespace-only and empty entries are rejected with friendly validation feedback.
3. **Completion Toggle:** Checkbox marks task complete and moves it visually; unchecking restores active state.
4. **Inline Editing:** Double-click or edit button opens edit mode; `Enter` saves; `Escape` discards; empty edits do not blank out tasks.
5. **Deletion:** Single delete works; clear completed removes only completed tasks.
6. **Filtering:** "All", "Active", "Completed" buttons filter accurately and preserve counter accuracy.
7. **Storage Persistence:** Reloading the page or modifying data in another tab/reopen preserves state.
8. **Corrupted Data Resilience:** Injecting invalid data into `localStorage` triggers recovery to a clean state without throwing unhandled exceptions.
9. **Accessibility & Contrast:** Focus rings are visible; color contrast passes WCAG AA; screen readers can interpret states.
10. **Automated Verification:** Automated test script (e.g. Node-based DOM/logic suite or automated browser runner) verifies all logic paths.

---

## 8. Deployment Requirements
* The codebase must remain 100% static: `index.html` at the root, referencing relative `./style.css` and `./script.js`.
* Ready out-of-the-box for GitHub Pages, Vercel, and Netlify with no build step required (`build command: none`, `publish directory: .`).
* Provide a clear deployment guide in `README.md`.

---

## 9. Definition of Done
The project is complete when:
- [x] `AGENTS.md` is created and followed strictly.
- [ ] Semantic `index.html`, responsive `style.css`, and modular `script.js` are fully implemented.
- [ ] All required functional features (CRUD, filter, counters, clear completed) are operational.
- [ ] Theme switching (Dark/Light mode) is implemented with saved preferences.
- [ ] Edge cases (long strings, whitespace, corrupted storage, rapid clicks) are handled.
- [ ] Complete automated and manual test pass is executed and verified.
- [ ] `README.md` is comprehensive and includes project documentation and deployment instructions.
- [ ] Code is formatted, clean, and free of console errors or warnings.

---

## 10. Rules for Future AI Agents Working on This Project
1. **Preserve Simplicity:** Do not introduce heavy runtime frameworks (React, Vue, Tailwind CLI, etc.) unless specifically requested by the user. The project's strength is pure vanilla web standards.
2. **No Regression:** When modifying features, run all functional tests to ensure existing behaviors remain intact.
3. **XSS & Security First:** Always escape user-generated content when injecting into the DOM.
4. **Accessible by Default:** Every new interactive element must have a label, focus state, and keyboard support.
5. **Always Update Documentation:** If a feature or data schema is modified, update `AGENTS.md` and `README.md` accordingly.
