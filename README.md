# TaskFlow — Modern Production-Ready To-Do App

A clean, responsive, and accessible To-Do List web application built with vanilla HTML5, CSS3, and modern JavaScript (ES6+). Designed to deliver a delightful user experience with zero external dependencies, robust `localStorage` persistence, light/dark theming, full keyboard accessibility, and instant static deployment readiness.

![TaskFlow Preview](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-blue?style=for-the-badge)
![HTML5 / CSS3 / ES6+](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20ES6+-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## Table of Contents
1. [Overview & Screenshots](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [How to Run Locally](#how-to-run-locally)
6. [How `localStorage` Works](#how-localstorage-works)
7. [Error Handling & Edge Cases](#error-handling--edge-cases)
8. [Testing & Verification](#testing--verification)
9. [Deployment Guide](#deployment-guide)
10. [Future Improvements](#future-improvements)

---

## Overview

TaskFlow is engineered to feel like a complete, finished consumer software product rather than a typical beginner tutorial project. It provides:
- **Instant Productivity:** Quickly capture thoughts and todos with priority tags and real-time validation.
- **Dynamic Theming:** Seamless switching between Light, Dark, and System modes with persistent memory.
- **Visual Progress:** Dynamic progress bar showing your completion rate at a glance.
- **Safety & Undo:** Deleting tasks or clearing completed items features an instant **Undo** toast to prevent accidental loss.

---

## Features

### 📋 Task Management
* **Add Tasks:** Create tasks with custom priority badges (`High`, `Normal`, `Low`).
* **In-Place Editing:** Double-click any task title or click the edit icon (✎) to update on the fly (`Enter` commits, `Escape` cancels).
* **Completion Toggle:** Smooth SVG checkmark transition with strikethrough styling.
* **Delete with Undo:** Remove individual tasks with a toast banner offering an instant **Undo** button.
* **Batch Clear:** One-click removal of all completed tasks (with Undo support).

### 🔍 Filtering, Searching & Metrics
* **State Filters:** Instant switching between **All**, **Active**, and **Completed** tasks with live count badges.
* **Instant Search:** Real-time client-side search filtering tasks as you type, with a 1-click clear button.
* **Progress Tracking:** Interactive progress bar and percentage calculator reflecting your completion rate.
* **Smart Empty States:** Context-specific illustrations and tips for empty lists, search results, or zero completed items.

### 🎨 UI, UX & Accessibility
* **100% Responsive:** Fluid mobile-first styling optimized from 320px smartphones to 4K displays.
* **Light / Dark Themes:** High-contrast color tokens adhering to WCAG AA contrast standards.
* **Keyboard-First:** Full keyboard navigation support (`Tab`, `Enter`, `Escape`, visible `:focus-visible` rings).
* **Accessible Semantics:** Proper ARIA labels, live regions (`aria-live="polite"`), and screen-reader announcements.

---

## Technologies Used

* **HTML5:** Semantic architecture (`<header>`, `<main>`, `<section>`, `<form>`, `<label>`, ARIA attributes).
* **CSS3:** Modern CSS variables, Flexbox, Grid, CSS animations (`slideDown`, `shake`, `toastIn`), responsive media queries.
* **JavaScript (ES6+):** Pure vanilla JavaScript without external frameworks or heavy libraries.
* **Browser Web Storage API:** Reliable local persistence via `window.localStorage`.

---

## Project Structure

```text
ANTIGRAVITYY/
├── index.html        # Main semantic markup and accessible application shell
├── style.css         # Design system tokens, light/dark themes, responsive layout
├── script.js         # Core application state, storage management, CRUD, DOM rendering
├── AGENTS.md         # Developer guidelines, architecture specs, and agent instructions
├── README.md         # Comprehensive project documentation and guides
└── test/
    └── app.test.js   # Automated integration and edge-case test suite
```

---

## How to Run Locally

Because TaskFlow is a pure static web application, no compilation or build steps are required.

### Option 1: Direct File Open
Simply double-click `index.html` or open it directly in any modern browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Option 2: Using a Local HTTP Server (Recommended)
Using a lightweight local server ensures full standard web environment parity:

**Using Node.js (`npx serve`):**
```bash
npx serve .
```

**Using Python 3:**
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

**Using VS Code Live Server:**
Right-click `index.html` and choose **"Open with Live Server"**.

---

## How `localStorage` Works

TaskFlow persists all task data and theme preferences client-side in the browser's `localStorage`:

1. **Storage Keys:**
   * `todo_app_tasks_v2`: Serialized JSON array of task objects.
   * `todo_app_theme_v2`: Active theme choice (`'light'`, `'dark'`, or `'system'`).
   * `todo_app_initialized_v2`: First-run flag used to initialize friendly sample tasks.

2. **Data Structure:**
   ```json
   [
     {
       "id": "task-1727618400000-abc1234",
       "text": "Complete quarterly project review",
       "completed": false,
       "priority": "high",
       "createdAt": "2026-09-29T14:00:00.000Z"
     }
   ]
   ```

3. **Resilience & Sanitization:**
   * Every read operation runs through a `try / catch` wrapper.
   * Objects undergo strict schema validation (checks types of `id`, `text`, `completed`, and defaults missing fields).
   * If corrupt or invalid data is detected in `localStorage`, TaskFlow safely recovers to an empty state rather than crashing.
   * Prevents XSS attacks by sanitizing and inserting user text through safe DOM nodes (`textContent`).

---

## Error Handling & Edge Cases

* **Empty Submissions:** Input shaking animation with clear error feedback if submitting empty or whitespace-only tasks.
* **Character Limit:** Input bounded to 200 characters with a live character counter (`0/200`). Long words break cleanly without layout overflow.
* **Corrupted Storage:** Gracefully recovers if localStorage contains invalid JSON or manipulated keys.
* **Quota Restrictions:** Detects private browsing quota exceptions and alerts the user cleanly via toast notifications.

---

## Testing & Verification

TaskFlow includes an automated integration test suite running in Node.js verifying all 16 core requirements:

```bash
npm test
```

### Verified Test Cases:
1. ✅ Page loads successfully without errors.
2. ✅ User can add tasks with custom priority.
3. ✅ Empty and whitespace-only submissions are rejected.
4. ✅ User can complete a task (updates status and UI).
5. ✅ User can uncomplete a task (restores active state).
6. ✅ User can edit an existing task inline (`Enter` saves, `Escape` cancels).
7. ✅ User can delete a task.
8. ✅ Single delete and batch clear support instant **Undo**.
9. ✅ "All" filter displays all items.
10. ✅ "Active" filter displays only incomplete tasks.
11. ✅ "Completed" filter displays only completed tasks.
12. ✅ "Clear completed" removes all finished tasks.
13. ✅ Task counter and progress percentage update accurately.
14. ✅ Tasks survive page reload via `localStorage`.
15. ✅ Contextual empty states display appropriately.
16. ✅ Responsive design and theme switching function properly.

---

## Deployment Guide

TaskFlow is static and requires **no build step**. Deploy anywhere in seconds:

### Deploying to GitHub Pages
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete TaskFlow to-do application"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Navigate to your repository's **Settings > Pages**.
3. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### Deploying to Vercel
1. Run `npx vercel` in the project root:
   ```bash
   npx vercel
   ```
2. Accept the defaults (Framework: Other, Build Command: None, Output: `./`).
3. Vercel provides a live production URL instantly.

### Deploying to Netlify
1. Drag and drop the project folder directly into [Netlify Drop](https://app.netlify.com/drop).
2. Or use the Netlify CLI:
   ```bash
   npx netlify deploy --prod --dir=.
   ```

---

## Future Improvements

* [ ] Drag-and-drop task reordering.
* [ ] Custom user categories / tags.
* [ ] Due date countdown badges and browser desktop notifications.
* [ ] Optional cloud sync via WebDAV or Supabase.

---

## License
MIT License. Free for personal, commercial, and educational use.
