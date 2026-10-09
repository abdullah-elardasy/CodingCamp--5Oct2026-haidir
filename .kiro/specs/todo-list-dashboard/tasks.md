# Implementation Plan: To-Do List Dashboard

## Overview

Build a fully client-side, single-page dashboard as static files (`index.html`, `css/style.css`, `js/app.js`). The implementation follows the module pattern defined in the design — five `const`-assigned object literals (`StorageManager`, `GreetingWidget`, `FocusTimerWidget`, `TodoListWidget`, `QuickLinksWidget`) wired together on `DOMContentLoaded`. No ES modules (`import`/`export`). Property-based tests use fast-check loaded via CDN in a separate `test.html`.

## Tasks

- [x] 1. Scaffold project structure and HTML shell
  - [x] 1.1 Create `index.html` with the full HTML document structure
    - Write `<!DOCTYPE html>`, `<html lang="en">`, `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, and `<title>Dashboard</title>`
    - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
    - Add `<div id="error-banner" hidden></div>` as the first child of `<body>`
    - Add `<main class="dashboard-grid">` containing four `<section>` elements with ids `greeting-widget`, `focus-timer-widget`, `todo-list-widget`, `quick-links-widget` — each with class `widget` and an `<h2>` heading
    - Add `<script src="js/app.js"></script>` at the bottom of `<body>` (before `</body>`)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create `css/style.css` with base reset and grid layout
    - Add `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
    - Implement `.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }`
    - Add `@media (max-width: 639px) { .dashboard-grid { grid-template-columns: 1fr; } }` for single-column collapse
    - Style `.widget { border: 1px solid #ccc; border-radius: 8px; padding: 16px; background: #fff; }` (distinct container)
    - Set four distinct `font-size` values for `#greeting-widget h2`, `#focus-timer-widget h2`, `#todo-list-widget h2`, `#quick-links-widget h2` (e.g., 1.6rem, 1.4rem, 1.3rem, 1.2rem)
    - _Requirements: 1.2, 1.4, 1.5_

  - [x] 1.3 Create `js/app.js` with module scaffolding and `DOMContentLoaded` bootstrap
    - Define five empty `const` object literals at the top level: `const StorageManager = {};`, `const GreetingWidget = {};`, `const FocusTimerWidget = {};`, `const TodoListWidget = {};`, `const QuickLinksWidget = {};`
    - Add `document.addEventListener('DOMContentLoaded', function() { ... })` that calls each widget's `init()` with its container element: `GreetingWidget.init(document.getElementById('greeting-widget'))`, etc.
    - Wrap each `init()` call in a try/catch that calls `StorageManager._showError('Widget failed to initialise: ' + e.message)` on error
    - _Requirements: 1.3, 9.1, 9.4_

- [x] 2. Implement StorageManager
  - [x] 2.1 Implement `StorageManager` read, write, parse, and error-display methods
    - Add `KEYS: { TASKS: 'tld_tasks', LINKS: 'tld_links' }` to the `StorageManager` object
    - Implement `_parse(json, fallback)`: call `JSON.parse(json)` inside try/catch; return the parsed value on success, `fallback` on any `SyntaxError` or if `json` is `null`/`undefined`
    - Implement `_showError(message)`: get `document.getElementById('error-banner')`; set its `textContent` to `message`; remove the `hidden` attribute; the banner must remain visible until page reload
    - Implement `readTasks()`: wrap `localStorage.getItem(KEYS.TASKS)` in try/catch for `SecurityError`; pass the result to `_parse(value, [])` and return it; call `_showError('Persistence unavailable: your data will not be saved this session.')` on caught error and return `[]`
    - Implement `readLinks()`: same pattern using `KEYS.LINKS`
    - Implement `writeTasks(tasks)`: wrap `localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks))` in try/catch; return `true` on success; on any error call `_showError('Could not save your change: storage is full.')` and return `false`
    - Implement `writeLinks(links)`: same pattern using `KEYS.LINKS`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 8.1, 8.2, 8.4_

  - [ ]* 2.2 Write property-based test for `StorageManager` task round-trip (Property 9)
    - In `test.html`, define `TaskArbitrary` using `fc.record({ id: fc.string({ minLength: 1 }), text: fc.string({ minLength: 1, maxLength: 500 }), completed: fc.boolean(), createdAt: fc.integer({ min: 0 }) })`
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 9: Task persistence round-trip`
    - Use `fc.assert(fc.property(fc.array(TaskArbitrary), function(tasks) { StorageManager.writeTasks(tasks); return JSON.stringify(StorageManager.readTasks()) === JSON.stringify(tasks); }), { numRuns: 100 })`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.3 Write property-based test for `StorageManager` link round-trip (Property 10)
    - Define `LinkArbitrary` using `fc.record({ id: fc.string({ minLength: 1 }), label: fc.string({ minLength: 1, maxLength: 50 }), url: fc.oneof(fc.string().map(s => 'https://' + s), fc.string().map(s => 'http://' + s)), createdAt: fc.integer({ min: 0 }) })`
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 10: Link persistence round-trip`
    - Use `fc.assert(fc.property(fc.array(LinkArbitrary), function(links) { StorageManager.writeLinks(links); return JSON.stringify(StorageManager.readLinks()) === JSON.stringify(links); }), { numRuns: 100 })`
    - _Requirements: 8.1, 8.2_

- [x] 3. Implement GreetingWidget
  - [x] 3.1 Implement all `GreetingWidget` methods and clock interval
    - Implement `_getGreeting(hour)`: return `'Good Morning'` when `hour >= 5 && hour <= 11`; `'Good Afternoon'` when `hour >= 12 && hour <= 17`; `'Good Evening'` when `hour >= 18 && hour <= 21`; `'Good Night'` for all other values (22–23, 0–4)
    - Implement `_formatTime(date)`: extract `date.getHours()` and `date.getMinutes()`; return `String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')`
    - Implement `_formatDate(date)`: return a string of the form `"Weekday, Month Day"` (e.g., `"Wednesday, October 8"`) using `date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })` — strip any leading zero from the day number
    - Implement `_render()`: read `new Date()` once; write `_formatTime(now)` to an element with id `greeting-time` (create in `init`); write `_formatDate(now)` to `greeting-date`; write `_getGreeting(now.getHours())` to `greeting-text`
    - Implement `init(containerEl)`: create and append child elements `<p id="greeting-time">`, `<p id="greeting-date">`, `<p id="greeting-text">` inside `containerEl`; call `_render()` immediately; store the interval id from `setInterval(this._render.bind(this), 60000)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 3.2 Write property-based test for `_getGreeting` (Property 1)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 1: Greeting correctness for all hours`
    - Use `fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), function(hour) { var validGreetings = ['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night']; var result = GreetingWidget._getGreeting(hour); return validGreetings.indexOf(result) !== -1; }), { numRuns: 100 })`
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.3 Write property-based test for `_formatTime` (Property 2)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 2: Time formatting always produces valid HH:MM`
    - Use `fc.assert(fc.property(fc.date(), function(date) { var result = GreetingWidget._formatTime(date); return /^\d{2}:\d{2}$/.test(result); }), { numRuns: 100 })`
    - _Requirements: 2.1_

- [x] 4. Implement FocusTimerWidget
  - [x] 4.1 Implement `FocusTimerWidget` state machine, tick, format, and render
    - Add internal state properties to the object: `_state: 'idle'`, `_remainingSeconds: 1500`, `_intervalId: null`
    - Implement `_formatTime(seconds)`: compute `Math.floor(seconds / 60)` for minutes and `seconds % 60` for remainder; return both zero-padded to 2 digits joined by `:`
    - Implement `_tick()`: decrement `_remainingSeconds` by 1; clamp to 0 using `Math.max(0, ...)`; call `_render()`; if `_remainingSeconds === 0`, call `clearInterval(_intervalId)`, set `_intervalId = null`, set `_state = 'idle'`, call `_render()` (end-of-session state)
    - Implement `_start()`: if `_state === 'running'` return immediately (no-op); set `_state = 'running'`; start `setInterval(this._tick.bind(this), 1000)` and store in `_intervalId`; call `_render()`
    - Implement `_stop()`: call `clearInterval(_intervalId)`; set `_intervalId = null`; set `_state = 'stopped'`; call `_render()`
    - Implement `_reset()`: call `clearInterval(_intervalId)`; set `_intervalId = null`; set `_remainingSeconds = 1500`; set `_state = 'idle'`; call `_render()`
    - Implement `_render()`: update `#timer-display` text to `_formatTime(_remainingSeconds)`; set Start button `disabled` attribute when `_state === 'running'`; remove `disabled` when not running; set Stop button `disabled` when `_state !== 'running'`; apply CSS class `btn-disabled` to disabled buttons and remove it from enabled buttons; show `#timer-end-indicator` element (remove `hidden`) when `_state === 'idle'` and `_remainingSeconds === 0`, otherwise add `hidden`
    - Implement `init(containerEl)`: create and append `<p id="timer-display">`, `<button id="timer-start">Start</button>`, `<button id="timer-stop">Stop</button>`, `<button id="timer-reset">Reset</button>`, and `<p id="timer-end-indicator" hidden>Session complete!</p>` inside `containerEl`; bind click handlers: Start → `_start()`, Stop → `_stop()`, Reset → `_reset()`; call `_render()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.2 Write property-based test for `FocusTimerWidget._formatTime` (Property 3)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 3: Timer countdown format always produces valid MM:SS`
    - Use `fc.assert(fc.property(fc.integer({ min: 0, max: 1500 }), function(seconds) { var result = FocusTimerWidget._formatTime(seconds); if (!/^\d{2}:\d{2}$/.test(result)) return false; var parts = result.split(':'); var m = parseInt(parts[0], 10); var s = parseInt(parts[1], 10); return m === Math.floor(seconds / 60) && s === seconds % 60; }), { numRuns: 100 })`
    - _Requirements: 3.1_

- [x] 5. Implement TodoListWidget
  - [x] 5.1 Implement `TodoListWidget` CRUD methods
    - Add `_tasks: []` and `_editingId: null` as internal state properties on the object
    - Implement `_generateId()`: return `(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).slice(2)`
    - Implement `_addTask(text)`: call `text.trim()`; return without mutation if trimmed is `''` or `trimmed.length > 500`; push `{ id: _generateId(), text: trimmed, completed: false, createdAt: Date.now() }` to `_tasks`; call `StorageManager.writeTasks(_tasks)`; call `_render()`
    - Implement `_toggleComplete(taskId)`: find task by `id === taskId`; flip its `completed` boolean; call `StorageManager.writeTasks(_tasks)`; call `_render()`
    - Implement `_beginEdit(taskId)`: set `_editingId = taskId`; call `_render()`
    - Implement `_saveEdit(taskId, newText)`: call `newText.trim()`; if trimmed is empty/whitespace-only, set `_editingId = null` and call `_render()` without mutating `text`; otherwise update the matching task's `text` to `trimmed`; set `_editingId = null`; call `StorageManager.writeTasks(_tasks)`; call `_render()`
    - Implement `_cancelEdit(taskId)`: set `_editingId = null`; call `_render()`
    - Implement `_deleteTask(taskId)`: set `_tasks = _tasks.filter(t => t.id !== taskId)`; call `StorageManager.writeTasks(_tasks)`; call `_render()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13_

  - [x] 5.2 Implement `TodoListWidget._render()` and `init()`
    - Implement `_render()`: select the task list container element (e.g., `#todo-task-list`); set its `innerHTML = ''`; for each task in `_tasks`: if `task.id === _editingId`, render `<li>` containing a pre-populated `<input type="text">` with the task's current text, a Save `<button>`, and a Cancel `<button>` with click handlers calling `_saveEdit` and `_cancelEdit`; bind the Enter key on the edit input to call `_saveEdit`; otherwise render `<li>` with `<input type="checkbox">` (checked if `completed`), a `<span>` with class `task-text` (add class `task-complete` if `completed`), an Edit `<button>`, and a Delete `<button>`; bind checkbox change → `_toggleComplete`, Edit → `_beginEdit`, Delete → `_deleteTask`
    - Implement `init(containerEl)`: load `_tasks` from `StorageManager.readTasks()`; create and append `<input id="todo-input" type="text" maxlength="500">`, `<button id="todo-add">Add</button>`, and `<ul id="todo-task-list">` inside `containerEl`; bind Add button click → extract input value → call `_addTask(value)` → clear input field; bind Enter key on `#todo-input` to the same logic; call `_render()`
    - _Requirements: 5.1, 5.3, 5.4, 5.6, 5.8, 5.14, 6.5_

  - [ ]* 5.3 Write property-based test for non-empty task addition (Property 4)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 4: Non-empty task addition grows the list by exactly one`
    - Use `fc.assert(fc.property(fc.array(TaskArbitrary), fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim() !== ''), function(initial, text) { TodoListWidget._tasks = initial.slice(); var before = TodoListWidget._tasks.length; TodoListWidget._addTask(text); return TodoListWidget._tasks.length === before + 1 && TodoListWidget._tasks[TodoListWidget._tasks.length - 1].text === text.trim(); }), { numRuns: 100 })`
    - _Requirements: 5.2_

  - [ ]* 5.4 Write property-based test for whitespace rejection on `_addTask` (Property 5)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 5: Whitespace-only or empty input is silently rejected`
    - Use `fc.assert(fc.property(fc.array(TaskArbitrary), fc.stringOf(fc.constantFrom(' ', '\t', '\n')), function(initial, wsText) { TodoListWidget._tasks = initial.slice(); var snapshot = JSON.stringify(TodoListWidget._tasks); TodoListWidget._addTask(wsText); return JSON.stringify(TodoListWidget._tasks) === snapshot; }), { numRuns: 100 })`
    - _Requirements: 5.3_

  - [ ]* 5.5 Write property-based test for whitespace rejection on `_saveEdit` (Property 6)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 6: Whitespace-only save edit preserves original task text`
    - Use `fc.assert(fc.property(TaskArbitrary, fc.stringOf(fc.constantFrom(' ', '\t', '\n')), function(task, wsText) { TodoListWidget._tasks = [Object.assign({}, task)]; var original = task.text; TodoListWidget._saveEdit(task.id, wsText); return TodoListWidget._tasks[0].text === original; }), { numRuns: 100 })`
    - _Requirements: 5.10_

  - [ ]* 5.6 Write property-based test for completion toggle round-trip (Property 7)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 7: Task completion toggle is a boolean flip`
    - Use `fc.assert(fc.property(TaskArbitrary, function(task) { TodoListWidget._tasks = [Object.assign({}, task)]; var original = TodoListWidget._tasks[0].completed; TodoListWidget._toggleComplete(task.id); var flipped = TodoListWidget._tasks[0].completed; TodoListWidget._toggleComplete(task.id); var restored = TodoListWidget._tasks[0].completed; return flipped === !original && restored === original; }), { numRuns: 100 })`
    - _Requirements: 5.5_

  - [ ]* 5.7 Write property-based test for `_deleteTask` targeting and preservation (Property 8)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 8: Delete removes exactly the targeted item; others are preserved`
    - Use `fc.assert(fc.property(fc.array(TaskArbitrary, { minLength: 1 }), fc.integer({ min: 0, max: 99 }), function(tasks, idx) { var deduped = tasks.filter((t, i, a) => a.findIndex(x => x.id === t.id) === i); if (deduped.length === 0) return true; var i = idx % deduped.length; var target = deduped[i]; TodoListWidget._tasks = deduped.map(t => Object.assign({}, t)); TodoListWidget._deleteTask(target.id); var remaining = TodoListWidget._tasks; if (remaining.length !== deduped.length - 1) return false; if (remaining.some(t => t.id === target.id)) return false; var others = deduped.filter(t => t.id !== target.id); return JSON.stringify(remaining) === JSON.stringify(others); }), { numRuns: 100 })`
    - _Requirements: 5.12, 5.13_

- [x] 6. Implement QuickLinksWidget
  - [x] 6.1 Implement `QuickLinksWidget` CRUD methods
    - Add `_links: []` as an internal state property on the object
    - Implement `_generateId()`: same pattern as `TodoListWidget._generateId()`
    - Implement `_normaliseUrl(url)`: if `url` already starts with `'http://'` or `'https://'` return `url` unchanged; otherwise return `'https://' + url`
    - Implement `_addLink(label, url)`: trim both arguments; if `label.trim() === ''` show error message "Label is required" in `#quick-links-error` and return; if `url.trim() === ''` show "URL is required" and return; if `_links.length >= 20` return without mutation (form is already disabled by `_render`); if `label.length > 50` show "Label must be 50 characters or fewer" and return; if `url.length > 2048` show "URL must be 2048 characters or fewer" and return; push `{ id: _generateId(), label: label.trim(), url: _normaliseUrl(url.trim()), createdAt: Date.now() }` to `_links`; call `StorageManager.writeLinks(_links)`; call `_render()`
    - Implement `_deleteLink(linkId)`: set `_links = _links.filter(l => l.id !== linkId)`; call `StorageManager.writeLinks(_links)`; call `_render()`
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 6.2 Implement `QuickLinksWidget._render()` and `init()`
    - Implement `_render()`: select `#quick-links-list` and set `innerHTML = ''`; for each link in `_links`, create a `<div>` containing an `<a>` element with `href=link.url`, `target="_blank"`, `rel="noopener noreferrer"` showing `link.label`, and a Delete `<button>` whose click handler calls `_deleteLink(link.id)`; append to the list; if `_links.length >= 20` set the add form inputs and button `disabled = true` and show `#quick-links-max` element (remove `hidden`); otherwise remove `disabled` and add `hidden` to `#quick-links-max`
    - Implement `init(containerEl)`: load `_links` from `StorageManager.readLinks()`; create and append `<input id="quick-links-label" type="text" maxlength="50">`, `<input id="quick-links-url" type="text" maxlength="2048">`, `<button id="quick-links-add">Add</button>`, `<p id="quick-links-error" hidden></p>`, `<p id="quick-links-max" hidden>Maximum of 20 links reached.</p>`, and `<div id="quick-links-list">` inside `containerEl`; bind Add button click → extract label and url values → call `_addLink(label, url)` → clear inputs on success; call `_render()`
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.8, 8.3, 8.4_

  - [ ]* 6.3 Write property-based test for `_normaliseUrl` (Property 11)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 11: URL normalisation always returns http(s):// prefix`
    - Use `fc.assert(fc.property(fc.string({ minLength: 1 }), function(url) { var result = QuickLinksWidget._normaliseUrl(url); if (!/^https?:\/\//.test(result)) return false; if (/^https?:\/\//.test(url)) return result === url; return result === 'https://' + url; }), { numRuns: 100 })`
    - _Requirements: 7.7_

  - [ ]* 6.4 Write property-based test for blank label/URL rejection on `_addLink` (Property 12)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 12: Adding a link with blank label or blank URL is rejected`
    - Use `fc.assert(fc.property(fc.array(LinkArbitrary), fc.stringOf(fc.constantFrom(' ', '\t', '\n')), fc.stringOf(fc.constantFrom(' ', '\t', '\n')), function(initial, wsLabel, wsUrl) { QuickLinksWidget._links = initial.slice(); var snapshot = JSON.stringify(QuickLinksWidget._links); QuickLinksWidget._addLink(wsLabel, wsUrl); return JSON.stringify(QuickLinksWidget._links) === snapshot; }), { numRuns: 100 })`
    - _Requirements: 7.6_

  - [ ]* 6.5 Write property-based test for `_deleteLink` targeting and preservation (Property 8, links)
    - Write a QUnit test tagged `// Feature: todo-list-dashboard, Property 8 (links): Delete removes exactly the targeted item; others are preserved`
    - Use the same structural pattern as task 5.7 but with `LinkArbitrary`, `QuickLinksWidget._links`, and `QuickLinksWidget._deleteLink(target.id)`
    - _Requirements: 7.4, 7.5_

- [x] 7. CSS widget-specific styles and interactive states
  - [x] 7.1 Add CSS styles for `GreetingWidget` and `FocusTimerWidget`
    - Style `#greeting-time` with a large font (e.g., `font-size: 2.5rem; font-weight: 700`)
    - Style `#greeting-text` with a medium font (e.g., `font-size: 1.25rem`)
    - Style `#timer-display` with `font-size: 3rem; font-variant-numeric: tabular-nums; font-family: monospace` for steady non-shifting layout
    - Add `.btn-disabled, button[disabled] { opacity: 0.4; cursor: not-allowed; pointer-events: none; }`
    - Style `#timer-end-indicator` with `color: #c0392b; font-weight: bold` to make the end-of-session indicator visually prominent
    - _Requirements: 3.4, 3.5, 3.6, 4.6_

  - [x] 7.2 Add CSS styles for `TodoListWidget` and `QuickLinksWidget`
    - Add `.task-complete { text-decoration: line-through; color: #999; }` for completed task strikethrough
    - Style `#todo-task-list li { display: flex; align-items: center; gap: 8px; padding: 4px 0; }`
    - Style edit-mode input to be visually distinct from the add input (e.g., `border-color: #2980b9`)
    - Style Quick Links `<a>` elements as button-like: `display: inline-block; padding: 6px 12px; background: #2980b9; color: #fff; text-decoration: none; border-radius: 4px;`
    - Ensure all `<button>` and `<a>` interactive controls have `min-height: 44px; min-width: 44px` for touch accessibility
    - _Requirements: 5.6, 7.2, 7.3, 9.2_

  - [x] 7.3 Add CSS styles for `#error-banner` and Quick Links error/max messages
    - Style `#error-banner:not([hidden]) { display: block; background: #e74c3c; color: #fff; padding: 10px 16px; font-weight: bold; }`
    - Style `#quick-links-error:not([hidden]) { color: #c0392b; font-size: 0.875rem; margin-top: 4px; }`
    - Style `#quick-links-max:not([hidden]) { color: #7f8c8d; font-style: italic; }`
    - _Requirements: 6.6, 6.7, 7.6, 7.8, 8.4_

- [x] 8. Integration wiring and cross-browser compatibility
  - [x] 8.1 Verify and harden `DOMContentLoaded` bootstrap in `js/app.js`
    - Confirm all five module objects (`StorageManager`, `GreetingWidget`, `FocusTimerWidget`, `TodoListWidget`, `QuickLinksWidget`) are defined before the `DOMContentLoaded` callback
    - Confirm each widget container element exists (`document.getElementById(...)` returns non-null) before calling `init()` — add a guard that calls `StorageManager._showError(...)` with a descriptive message if the element is missing
    - Add a `try/catch` around the entire `DOMContentLoaded` body that calls `StorageManager._showError('Dashboard failed to initialise: ' + e.message)` if an uncaught error occurs
    - _Requirements: 1.1, 9.1, 9.4_

  - [x] 8.2 Add cross-browser and `file://` compatibility guards
    - Search `js/app.js` for any `import` or `export` statement and remove it (the file must be zero ES-module syntax)
    - Confirm `_generateId()` in both `TodoListWidget` and `QuickLinksWidget` uses the `crypto.randomUUID` guard with `Date.now()` fallback
    - Confirm that all `window.open` calls are replaced with `<a target="_blank" rel="noopener noreferrer">` anchor elements (or that `window.open(url, '_blank', 'noopener,noreferrer')` is used where `<a>` is not feasible) — Quick Links already uses `<a>` in `_render()`; verify the third argument is present for any remaining `window.open` calls
    - Wrap `localStorage` access in `StorageManager` in try/catch to handle the `SecurityError` Firefox throws for `file://` origins with certain privacy settings (already covered in task 2.1; confirm the guard is in place)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9. Property-based test harness
  - [x] 9.1 Create `test.html` with QUnit and fast-check loaded from CDN
    - Write `test.html` with `<!DOCTYPE html>`, `<html lang="en">`, charset and viewport meta tags
    - Add `<link rel="stylesheet" href="https://code.jquery.com/qunit/qunit-2.22.0.css">` in `<head>`
    - Add `<script src="https://code.jquery.com/qunit/qunit-2.22.0.js"></script>` and `<script src="https://cdn.jsdelivr.net/npm/fast-check@3/lib/bundle/fast-check.min.js"></script>` before app scripts
    - Add `<div id="qunit"></div>` and `<div id="qunit-fixture"></div>` for QUnit rendering
    - Add a mock `localStorage` shim in a `<script>` block that stores data in a plain object — reassign `window.localStorage` before loading `app.js` so that `StorageManager` calls use the shim
    - Include `<script src="js/app.js"></script>` after the shim
    - Define `TaskArbitrary` and `LinkArbitrary` fast-check arbitraries (matching the shapes in tasks 2.2 and 2.3) in the test script block
    - _Requirements: (test infrastructure)_

  - [ ]* 9.2 Implement all 12 property-based tests in `test.html`
    - Write one `QUnit.test(...)` call per property (Properties 1–12), each tagged with `// Feature: todo-list-dashboard, Property N: <text>`
    - Call `fc.assert(fc.property(...), { numRuns: 100 })` inside each QUnit test body
    - Group tests logically: StorageManager tests (Properties 9, 10), GreetingWidget (1, 2), FocusTimerWidget (3), TodoListWidget (4, 5, 6, 7, 8-tasks), QuickLinksWidget (8-links, 11, 12)
    - Reference each property's corresponding sub-task from tasks 2.2, 2.3, 3.2, 3.3, 4.2, 5.3–5.7, 6.3–6.5 for the implementation details
    - _Requirements: (all 12 design correctness properties)_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- All JS must be in `js/app.js` using `const`-assigned object literals — no `import`/`export`, no classes unless needed
- Property tests in `test.html` require internet access for CDN resources (QUnit and fast-check); a local copy can be substituted by downloading the scripts
- The `#error-banner` must stay visible permanently once shown — no auto-dismiss
- All `localStorage` key names are namespaced with `tld_` prefix to avoid collisions on shared `file://` origins
- Task 9.1 must be completed before any `*`-marked property test sub-tasks can run

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.2", "5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "6.2", "6.3", "6.4", "6.5", "7.2", "7.3"] },
    { "id": 5, "tasks": ["8.1", "8.2", "9.2"] }
  ]
}
```
