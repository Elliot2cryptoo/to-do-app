/**
 * TaskFlow Test Suite
 * Automated integration & unit tests using Node.js built-in test runner and JSDOM
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rawHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
// Remove script tag from html so JSDOM doesn't attempt network fetch
const htmlContent = rawHtml.replace('<script src="script.js"></script>', '');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf-8');

function setupTestEnvironment(initialLocalStorage = {}) {
  const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    url: 'https://taskflow.local/'
  });

  const { window } = dom;

  // Mock localStorage
  const storage = { ...initialLocalStorage };
  const storageMock = {
    getItem: (key) => (key in storage ? storage[key] : null),
    setItem: (key, val) => { storage[key] = String(val); },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };
  Object.defineProperty(window, 'localStorage', { value: storageMock, writable: true });

  // Mock matchMedia
  window.matchMedia = window.matchMedia || function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {}
    };
  };

  // Run script.js in the window context
  window.eval(scriptContent);

  // Trigger DOMContentLoaded so initApp runs
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  return { window, document: window.document, storage };
}

test('1. Initial page load & elements initialization', () => {
  const { document } = setupTestEnvironment();
  assert.ok(document.getElementById('main-content'), 'Main content should exist');
  assert.ok(document.getElementById('task-input'), 'Task input should exist');
  assert.ok(document.getElementById('add-btn'), 'Add button should exist');
  assert.ok(document.getElementById('task-list'), 'Task list should exist');

  const items = document.querySelectorAll('.task-item');
  assert.equal(items.length, 3, 'Initial 3 onboarding tasks should be rendered on first run');
});

test('2. User can add a valid task with priority', () => {
  const { document } = setupTestEnvironment();
  const input = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const form = document.getElementById('todo-form');

  input.value = 'Buy groceries for dinner';
  prioritySelect.value = 'high';

  form.dispatchEvent(new document.defaultView.Event('submit', { cancelable: true }));

  const items = document.querySelectorAll('.task-item');
  const titles = Array.from(items).map(el => el.querySelector('.task-title').textContent);
  assert.ok(titles.includes('Buy groceries for dinner'), 'New task should be in the DOM list');

  const firstItem = items[0];
  assert.equal(firstItem.querySelector('.task-title').textContent, 'Buy groceries for dinner');
  assert.equal(firstItem.querySelector('.priority-tag').textContent, 'high');
});

test('3. User cannot add an empty or whitespace-only task', () => {
  const { document } = setupTestEnvironment();
  const initialCount = document.querySelectorAll('.task-item').length;
  const input = document.getElementById('task-input');
  const form = document.getElementById('todo-form');
  const feedback = document.getElementById('input-feedback');

  // Empty string
  input.value = '';
  form.dispatchEvent(new document.defaultView.Event('submit', { cancelable: true }));
  assert.equal(document.querySelectorAll('.task-item').length, initialCount, 'Empty task must not be added');
  assert.ok(feedback.textContent.includes('empty'), 'Feedback should indicate empty error');

  // Whitespace only
  input.value = '     ';
  form.dispatchEvent(new document.defaultView.Event('submit', { cancelable: true }));
  assert.equal(document.querySelectorAll('.task-item').length, initialCount, 'Whitespace task must not be added');
});

test('4 & 5. User can complete and uncomplete a task', () => {
  const { document } = setupTestEnvironment();
  const firstItem = document.querySelector('.task-item');
  const checkbox = firstItem.querySelector('.task-checkbox-input');
  const initialChecked = checkbox.checked;

  // Toggle state
  checkbox.click();
  const updatedItem = document.querySelector(`[data-id="${firstItem.dataset.id}"]`);
  assert.equal(updatedItem.querySelector('.task-checkbox-input').checked, !initialChecked, 'Checkbox should toggle state');

  if (!initialChecked) {
    assert.ok(updatedItem.classList.contains('completed'), 'Task item should have completed class');
  }

  // Toggle back
  const newCheckbox = updatedItem.querySelector('.task-checkbox-input');
  newCheckbox.click();
  const restoredItem = document.querySelector(`[data-id="${firstItem.dataset.id}"]`);
  assert.equal(restoredItem.querySelector('.task-checkbox-input').checked, initialChecked, 'Checkbox should revert state');
});

test('6. User can edit an existing task', () => {
  const { document } = setupTestEnvironment();
  const firstItem = document.querySelector('.task-item');
  const id = firstItem.dataset.id;
  const editBtn = firstItem.querySelector('.edit-btn');

  // Trigger edit mode
  editBtn.click();

  const editingItem = document.querySelector(`[data-id="${id}"]`);
  assert.ok(editingItem.classList.contains('editing'), 'Task item should enter editing mode');

  const editInput = editingItem.querySelector('.edit-input');
  assert.ok(editInput, 'Edit input should be visible in editing mode');

  editInput.value = 'Updated Task Title via Test';
  const saveBtn = editingItem.querySelector('.edit-actions .btn-primary');
  saveBtn.click();

  const savedItem = document.querySelector(`[data-id="${id}"]`);
  assert.ok(!savedItem.classList.contains('editing'), 'Task item should leave editing mode after save');
  assert.equal(savedItem.querySelector('.task-title').textContent, 'Updated Task Title via Test');
});

test('7. User can delete a task', () => {
  const { document } = setupTestEnvironment();
  const initialItems = document.querySelectorAll('.task-item');
  const initialCount = initialItems.length;
  const firstItem = initialItems[0];
  const targetId = firstItem.dataset.id;

  const deleteBtn = firstItem.querySelector('.delete-btn');
  deleteBtn.click();

  // Emulate animation end
  firstItem.dispatchEvent(new document.defaultView.Event('animationend'));

  const remaining = document.querySelectorAll(`.task-item[data-id="${targetId}"]`);
  assert.equal(remaining.length, 0, 'Target task should be removed from DOM');
  assert.equal(document.querySelectorAll('.task-item').length, initialCount - 1);
});

test('8, 9, 10. Filter buttons (All, Active, Completed) function correctly', () => {
  const { document } = setupTestEnvironment();
  const filterAll = document.getElementById('filter-all');
  const filterActive = document.getElementById('filter-active');
  const filterCompleted = document.getElementById('filter-completed');

  // Active filter
  filterActive.click();
  assert.ok(filterActive.classList.contains('active'), 'Active filter button should be active');
  const activeItems = document.querySelectorAll('.task-item');
  activeItems.forEach(item => {
    assert.ok(!item.classList.contains('completed'), 'Only active items should be shown');
  });

  // Completed filter
  filterCompleted.click();
  assert.ok(filterCompleted.classList.contains('active'), 'Completed filter button should be active');
  const completedItems = document.querySelectorAll('.task-item');
  completedItems.forEach(item => {
    assert.ok(item.classList.contains('completed'), 'Only completed items should be shown');
  });

  // All filter
  filterAll.click();
  assert.ok(filterAll.classList.contains('active'), 'All filter button should be active');
  const allItems = document.querySelectorAll('.task-item');
  assert.equal(allItems.length, activeItems.length + completedItems.length);
});

test('11. Clear completed removes all completed tasks', () => {
  const { document } = setupTestEnvironment();
  const clearBtn = document.getElementById('clear-completed-btn');

  // In default tasks, 1 task is completed
  assert.equal(clearBtn.disabled, false, 'Clear completed button should be enabled');

  clearBtn.click();

  const remainingCompleted = document.querySelectorAll('.task-item.completed');
  assert.equal(remainingCompleted.length, 0, 'No completed tasks should remain');
  assert.equal(clearBtn.disabled, true, 'Clear completed button should be disabled when none remain');
});

test('12. Task counter and progress bar update accurately', () => {
  const { document } = setupTestEnvironment();
  const activeCountEl = document.getElementById('active-tasks-count');
  const countActiveBadge = document.getElementById('count-active');
  const progressPercent = document.getElementById('progress-percent');

  const activeItems = document.querySelectorAll('.task-item:not(.completed)');
  assert.ok(activeCountEl.textContent.includes(String(activeItems.length)), 'Active count text should match active count');
  assert.equal(countActiveBadge.textContent, String(activeItems.length), 'Active badge should match');
  assert.ok(progressPercent.textContent.endsWith('%'), 'Progress should be a percentage');
});

test('13. Persistence across page reloads via localStorage', () => {
  const customTasks = [
    { id: 'persisted-1', text: 'Persistent Task 1', completed: false, priority: 'high', createdAt: new Date().toISOString() },
    { id: 'persisted-2', text: 'Persistent Task 2', completed: true, priority: 'low', createdAt: new Date().toISOString() }
  ];

  const storageMock = {
    'todo_app_tasks_v2': JSON.stringify(customTasks),
    'todo_app_initialized_v2': 'true'
  };

  const { document } = setupTestEnvironment(storageMock);
  const items = document.querySelectorAll('.task-item');
  assert.equal(items.length, 2, 'Should render exactly the 2 persisted tasks');

  const titles = Array.from(items).map(el => el.querySelector('.task-title').textContent);
  assert.deepEqual(titles, ['Persistent Task 1', 'Persistent Task 2']);
});

test('14. Corrupted localStorage recovery', () => {
  const corruptedStorage = {
    'todo_app_tasks_v2': '{invalid JSON!!@#}',
    'todo_app_initialized_v2': 'true'
  };

  const { document } = setupTestEnvironment(corruptedStorage);
  const emptyState = document.getElementById('empty-state');
  assert.ok(!emptyState.classList.contains('hidden'), 'Empty state should show on clean recovered list');
});

test('15. Search input filters items in real time', () => {
  const { document } = setupTestEnvironment();
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  // Search for unique keyword from onboarding task: "Explore"
  searchInput.value = 'explore';
  searchInput.dispatchEvent(new document.defaultView.Event('input'));

  const filteredItems = document.querySelectorAll('.task-item');
  assert.equal(filteredItems.length, 1, 'Only the task matching "explore" should show');
  assert.ok(!clearSearchBtn.classList.contains('hidden'), 'Clear search button should be visible');

  // Clear search
  clearSearchBtn.click();
  assert.ok(document.querySelectorAll('.task-item').length > 1, 'All tasks should return after clearing search');
});

test('16. Theme switcher updates data-theme attribute', () => {
  const { document } = setupTestEnvironment();
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');

  const initialTheme = html.getAttribute('data-theme');
  themeToggle.click();
  const newTheme = html.getAttribute('data-theme');

  assert.notEqual(initialTheme, newTheme, 'Theme attribute should change on click');
});
