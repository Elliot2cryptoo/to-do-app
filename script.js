/**
 * TaskFlow — Modern Production-Ready To-Do List Application
 * Pure Vanilla JavaScript (ES6+) with Zero Runtime Dependencies
 */

'use strict';

(function () {
  // ==========================================================================
  // 1. Constants & Storage Keys
  // ==========================================================================
  const STORAGE_KEYS = {
    TASKS: 'todo_app_tasks_v2',
    THEME: 'todo_app_theme_v2',
    INITIALIZED: 'todo_app_initialized_v2'
  };

  const DEFAULT_TASKS = [
    {
      id: 'task-init-1',
      text: 'Explore TaskFlow features ✨',
      completed: false,
      priority: 'high',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'task-init-2',
      text: 'Double-click or press ✎ to edit this task',
      completed: false,
      priority: 'medium',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'task-init-3',
      text: 'Mark this task as completed! 🎉',
      completed: true,
      priority: 'low',
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ];

  // SVG Icons for empty states
  const ICONS = {
    allEmpty: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    activeEmpty: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>`,
    completedEmpty: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    searchEmpty: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`
  };

  // ==========================================================================
  // 2. Application State
  // ==========================================================================
  const state = {
    tasks: [],
    currentFilter: 'all', // 'all' | 'active' | 'completed'
    searchQuery: '',
    editingTaskId: null,
    undoStack: []
  };

  // ==========================================================================
  // 3. DOM Element References
  // ==========================================================================
  const DOM = {
    html: document.documentElement,
    currentDate: document.getElementById('current-date'),
    themeToggle: document.getElementById('theme-toggle'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    progressBarContainer: document.getElementById('progress-bar-container'),
    progressPercent: document.getElementById('progress-percent'),
    todoForm: document.getElementById('todo-form'),
    taskInput: document.getElementById('task-input'),
    charCounter: document.getElementById('char-counter'),
    prioritySelect: document.getElementById('priority-select'),
    inputFeedback: document.getElementById('input-feedback'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('empty-state'),
    emptyIcon: document.getElementById('empty-icon'),
    emptyTitle: document.getElementById('empty-title'),
    emptyDesc: document.getElementById('empty-desc'),
    activeCountText: document.getElementById('active-tasks-count'),
    clearCompletedBtn: document.getElementById('clear-completed-btn'),
    clearCount: document.getElementById('clear-count'),
    countAll: document.getElementById('count-all'),
    countActive: document.getElementById('count-active'),
    countCompleted: document.getElementById('count-completed'),
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // 4. Utility Functions
  // ==========================================================================
  /**
   * Generates a collision-resistant unique ID
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Sanitizes string to prevent XSS injection
   */
  function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  /**
   * Format relative or concise date
   */
  function formatTaskDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24 && date.getDate() === now.getDate()) return `${diffHrs}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  /**
   * Show non-intrusive toast notification with optional Undo callback
   */
  function showToast(message, actionLabel = null, onAction = null) {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (actionLabel && typeof onAction === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = actionLabel;
      actionBtn.addEventListener('click', () => {
        onAction();
        dismissToast(toast);
      });
      toast.appendChild(actionBtn);
    }

    DOM.toastContainer.appendChild(toast);

    const autoTimer = setTimeout(() => {
      dismissToast(toast);
    }, 4500);

    function dismissToast(el) {
      clearTimeout(autoTimer);
      el.classList.add('toast-exit');
      el.addEventListener('animationend', () => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    }
  }

  // ==========================================================================
  // 5. Storage & State Management
  // ==========================================================================
  /**
   * Loads and validates tasks from localStorage
   */
  function loadTasks() {
    try {
      const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);

      if (!isInitialized && !stored) {
        // First run: provide friendly default onboarding tasks
        state.tasks = [...DEFAULT_TASKS];
        saveTasks();
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        return;
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate structure of each task
          state.tasks = parsed.filter(item => {
            return (
              item &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              typeof item.text === 'string' &&
              typeof item.completed === 'boolean'
            );
          }).map(item => ({
            id: item.id,
            text: item.text.trim(),
            completed: Boolean(item.completed),
            priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
            createdAt: item.createdAt || new Date().toISOString()
          }));
          return;
        }
      }

      state.tasks = [];
    } catch (err) {
      console.warn('TaskFlow: localStorage is inaccessible or corrupted. Resetting clean state.', err);
      state.tasks = [];
    }
  }

  /**
   * Persists tasks array to localStorage
   */
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    } catch (err) {
      console.error('TaskFlow: Failed to save tasks to localStorage.', err);
      showToast('Storage quota exceeded or private mode enabled');
    }
  }

  // ==========================================================================
  // 6. Task Operations (CRUD)
  // ==========================================================================
  /**
   * Adds a new task
   */
  function addTask(title, priority = 'medium') {
    const trimmed = title ? title.trim() : '';
    if (!trimmed) {
      displayInputError('Task title cannot be empty.');
      return false;
    }

    if (trimmed.length > 200) {
      displayInputError('Task exceeds 200 character limit.');
      return false;
    }

    const newTask = {
      id: generateId(),
      text: trimmed,
      completed: false,
      priority: priority,
      createdAt: new Date().toISOString()
    };

    state.tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateTaskCount();
    showToast('Task added');
    return true;
  }

  /**
   * Edits the text of an existing task
   */
  function editTask(id, newText) {
    const trimmed = newText ? newText.trim() : '';
    if (!trimmed) {
      showToast('Task title cannot be empty');
      return false;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) return false;

    task.text = trimmed;
    saveTasks();
    state.editingTaskId = null;
    renderTasks();
    showToast('Task updated');
    return true;
  }

  /**
   * Toggles task completion state
   */
  function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateTaskCount();
  }

  /**
   * Deletes a single task with an Undo option
   */
  function deleteTask(id) {
    const taskIndex = state.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const [deletedTask] = state.tasks.splice(taskIndex, 1);
    saveTasks();
    renderTasks();
    updateTaskCount();

    // Show undo toast
    showToast(`Deleted "${deletedTask.text.slice(0, 24)}${deletedTask.text.length > 24 ? '...' : ''}"`, 'Undo', () => {
      state.tasks.splice(taskIndex, 0, deletedTask);
      saveTasks();
      renderTasks();
      updateTaskCount();
    });
  }

  /**
   * Clears all completed tasks with an Undo option
   */
  function clearCompleted() {
    const completedTasks = state.tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    const activeTasks = state.tasks.filter(t => !t.completed);
    const count = completedTasks.length;

    state.tasks = activeTasks;
    saveTasks();
    renderTasks();
    updateTaskCount();

    showToast(`Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}`, 'Undo', () => {
      state.tasks = [...state.tasks, ...completedTasks];
      saveTasks();
      renderTasks();
      updateTaskCount();
    });
  }

  // ==========================================================================
  // 7. Filtering & Counting
  // ==========================================================================
  /**
   * Sets current filter ('all' | 'active' | 'completed')
   */
  function setFilter(filterType) {
    if (!['all', 'active', 'completed'].includes(filterType)) return;
    state.currentFilter = filterType;

    DOM.filterBtns.forEach(btn => {
      const isActive = btn.dataset.filter === filterType;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    renderTasks();
  }

  /**
   * Computes filtered and searched tasks
   */
  function getFilteredTasks() {
    return state.tasks.filter(task => {
      // Status filter
      if (state.currentFilter === 'active' && task.completed) return false;
      if (state.currentFilter === 'completed' && !task.completed) return false;

      // Search query
      if (state.searchQuery) {
        return task.text.toLowerCase().includes(state.searchQuery.toLowerCase());
      }
      return true;
    });
  }

  /**
   * Updates task statistics, counters, and progress bar
   */
  function updateTaskCount() {
    const totalCount = state.tasks.length;
    const completedCount = state.tasks.filter(t => t.completed).length;
    const activeCount = totalCount - completedCount;

    // Badges on filter buttons
    if (DOM.countAll) DOM.countAll.textContent = totalCount;
    if (DOM.countActive) DOM.countActive.textContent = activeCount;
    if (DOM.countCompleted) DOM.countCompleted.textContent = completedCount;

    // Active tasks text
    if (DOM.activeCountText) {
      DOM.activeCountText.innerHTML = `<strong>${activeCount}</strong> ${activeCount === 1 ? 'task' : 'tasks'} remaining`;
    }

    // Clear completed button state
    if (DOM.clearCompletedBtn) {
      DOM.clearCompletedBtn.disabled = completedCount === 0;
      if (DOM.clearCount) DOM.clearCount.textContent = completedCount;
    }

    // Progress bar calculation
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    if (DOM.progressBarFill) {
      DOM.progressBarFill.style.width = `${percentage}%`;
    }
    if (DOM.progressBarContainer) {
      DOM.progressBarContainer.setAttribute('aria-valuenow', percentage);
    }
    if (DOM.progressPercent) {
      DOM.progressPercent.textContent = `${percentage}%`;
    }
  }

  // ==========================================================================
  // 8. DOM Rendering
  // ==========================================================================
  /**
   * Renders the task list and empty state
   */
  function renderTasks() {
    const filteredTasks = getFilteredTasks();
    DOM.taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
      DOM.taskList.classList.add('hidden');
      DOM.emptyState.classList.remove('hidden');
      renderEmptyState();
      return;
    }

    DOM.taskList.classList.remove('hidden');
    DOM.emptyState.classList.add('hidden');

    filteredTasks.forEach(task => {
      const li = createTaskElement(task);
      DOM.taskList.appendChild(li);
    });
  }

  /**
   * Creates an individual task DOM element
   */
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${state.editingTaskId === task.id ? 'editing' : ''}`;
    li.dataset.id = task.id;

    // Left Section: Checkbox + Content
    const taskLeft = document.createElement('div');
    taskLeft.className = 'task-left';

    // Checkbox container
    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'checkbox-container';
    checkboxLabel.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);

    const checkboxInput = document.createElement('input');
    checkboxInput.type = 'checkbox';
    checkboxInput.className = 'task-checkbox-input';
    checkboxInput.checked = task.completed;
    checkboxInput.addEventListener('change', () => toggleTask(task.id));

    const customCheckbox = document.createElement('span');
    customCheckbox.className = 'custom-checkbox';
    customCheckbox.setAttribute('aria-hidden', 'true');
    customCheckbox.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    checkboxLabel.appendChild(checkboxInput);
    checkboxLabel.appendChild(customCheckbox);
    taskLeft.appendChild(checkboxLabel);

    // Details: Title + Meta
    const details = document.createElement('div');
    details.className = 'task-details';

    const textRow = document.createElement('div');
    textRow.className = 'task-text-row';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.text;
    titleSpan.title = 'Double-click to edit';
    titleSpan.addEventListener('dblclick', () => startEditingTask(task.id, li));

    textRow.appendChild(titleSpan);

    // Priority tag
    if (task.priority) {
      const priorityTag = document.createElement('span');
      priorityTag.className = `priority-tag ${task.priority}`;
      priorityTag.textContent = task.priority;
      textRow.appendChild(priorityTag);
    }

    details.appendChild(textRow);

    // Meta (timestamp)
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = formatTaskDate(task.createdAt);
    details.appendChild(meta);

    taskLeft.appendChild(details);

    // In-place edit input wrapper
    const editWrapper = document.createElement('div');
    editWrapper.className = 'edit-input-wrapper';

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = task.text;
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit task title');

    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn btn-primary btn-sm';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => commitEditingTask(task.id, editInput.value));

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary btn-sm';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', cancelEditingTask);

    editActions.appendChild(saveBtn);
    editActions.appendChild(cancelBtn);

    editWrapper.appendChild(editInput);
    editWrapper.appendChild(editActions);

    taskLeft.appendChild(editWrapper);
    li.appendChild(taskLeft);

    // Right Section: Action Buttons
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn edit-btn';
    editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
    editBtn.title = 'Edit task';
    editBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', () => startEditingTask(task.id, li));

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    deleteBtn.title = 'Delete task';
    deleteBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    deleteBtn.addEventListener('click', () => {
      li.classList.add('removing');
      li.addEventListener('animationend', () => deleteTask(task.id), { once: true });
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);

    // Edit keyboard controls
    editInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEditingTask(task.id, editInput.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditingTask();
      }
    });

    return li;
  }

  /**
   * Enters in-place task edit mode
   */
  function startEditingTask(id, liElement) {
    state.editingTaskId = id;
    renderTasks();
    const activeLi = DOM.taskList.querySelector(`[data-id="${id}"]`);
    if (activeLi) {
      const input = activeLi.querySelector('.edit-input');
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  /**
   * Commits task text edits
   */
  function commitEditingTask(id, text) {
    if (editTask(id, text)) {
      state.editingTaskId = null;
    }
  }

  /**
   * Cancels in-place task edit
   */
  function cancelEditingTask() {
    state.editingTaskId = null;
    renderTasks();
  }

  /**
   * Renders dynamic empty state depending on current filter and search
   */
  function renderEmptyState() {
    if (state.searchQuery) {
      DOM.emptyIcon.innerHTML = ICONS.searchEmpty;
      DOM.emptyTitle.textContent = 'No matching tasks';
      DOM.emptyDesc.textContent = `No tasks matched your search for "${state.searchQuery}".`;
    } else if (state.currentFilter === 'active') {
      DOM.emptyIcon.innerHTML = ICONS.activeEmpty;
      DOM.emptyTitle.textContent = 'All caught up!';
      DOM.emptyDesc.textContent = 'No active tasks remaining. You are in great shape!';
    } else if (state.currentFilter === 'completed') {
      DOM.emptyIcon.innerHTML = ICONS.completedEmpty;
      DOM.emptyTitle.textContent = 'No completed tasks yet';
      DOM.emptyDesc.textContent = 'Complete some of your tasks to see them tracked here.';
    } else {
      DOM.emptyIcon.innerHTML = ICONS.allEmpty;
      DOM.emptyTitle.textContent = 'Your to-do list is empty';
      DOM.emptyDesc.textContent = 'Add your first task above to start taking control of your day.';
    }
  }

  /**
   * Displays validation error under the input field
   */
  function displayInputError(msg) {
    if (!DOM.inputFeedback || !DOM.taskInput) return;
    DOM.inputFeedback.textContent = msg;
    DOM.inputFeedback.classList.add('visible');
    DOM.taskInput.classList.add('shake');

    setTimeout(() => {
      DOM.taskInput.classList.remove('shake');
    }, 450);

    setTimeout(() => {
      DOM.inputFeedback.classList.remove('visible');
    }, 3500);
  }

  // ==========================================================================
  // 9. Theme Management
  // ==========================================================================
  function initTheme() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        DOM.html.setAttribute('data-theme', savedTheme);
      } else {
        DOM.html.setAttribute('data-theme', 'system');
      }
    } catch {
      DOM.html.setAttribute('data-theme', 'system');
    }
  }

  function toggleTheme() {
    const currentAttr = DOM.html.getAttribute('data-theme');
    let nextTheme = 'dark';

    if (currentAttr === 'dark') {
      nextTheme = 'light';
    } else if (currentAttr === 'light') {
      nextTheme = 'dark';
    } else {
      // If currently 'system', toggle opposite to media query
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      nextTheme = isSystemDark ? 'light' : 'dark';
    }

    DOM.html.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    } catch {
      // Storage unavailable, ignore
    }
  }

  // ==========================================================================
  // 10. Date Display
  // ==========================================================================
  function updateCurrentDate() {
    if (!DOM.currentDate) return;
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    DOM.currentDate.textContent = now.toLocaleDateString(undefined, options);
  }

  // ==========================================================================
  // 11. Event Listeners Setup
  // ==========================================================================
  function bindEvents() {
    // Form submission
    DOM.todoForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = DOM.taskInput.value;
      const priority = DOM.prioritySelect.value;

      if (addTask(title, priority)) {
        DOM.taskInput.value = '';
        DOM.charCounter.textContent = '0/200';
        DOM.prioritySelect.value = 'medium';
        DOM.taskInput.focus();
      }
    });

    // Character counter
    DOM.taskInput.addEventListener('input', () => {
      const len = DOM.taskInput.value.length;
      DOM.charCounter.textContent = `${len}/200`;
    });

    // Filter tabs
    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
      });
    });

    // Search input
    DOM.searchInput.addEventListener('input', () => {
      state.searchQuery = DOM.searchInput.value.trim();
      DOM.clearSearchBtn.classList.toggle('hidden', state.searchQuery.length === 0);
      renderTasks();
    });

    // Clear search button
    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      DOM.clearSearchBtn.classList.add('hidden');
      DOM.searchInput.focus();
      renderTasks();
    });

    // Clear completed button
    DOM.clearCompletedBtn.addEventListener('click', clearCompleted);

    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
      // Escape clears search if focused
      if (e.key === 'Escape' && document.activeElement === DOM.searchInput) {
        DOM.searchInput.value = '';
        state.searchQuery = '';
        DOM.clearSearchBtn.classList.add('hidden');
        renderTasks();
      }
    });
  }

  // ==========================================================================
  // 12. App Initialization
  // ==========================================================================
  function initApp() {
    initTheme();
    updateCurrentDate();
    loadTasks();
    renderTasks();
    updateTaskCount();
    bindEvents();
  }

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
