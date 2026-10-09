// To-Do List Dashboard — js/app.js
// All application logic lives in this single file.
// Five module objects are defined as const-assigned object literals;
// no ES module import/export syntax is used so the file works under file:// URLs.

// ---------------------------------------------------------------------------
// StorageManager — handles all localStorage reads and writes
// ---------------------------------------------------------------------------
const StorageManager = {
  KEYS: {
    TASKS: 'tld_tasks',
    LINKS: 'tld_links',
    NAME:  'tld_name',
    THEME: 'tld_theme'
  },

  // Internal: wraps JSON.parse; returns fallback on error or null/undefined input
  _parse: function (json, fallback) {
    if (json === null || json === undefined) return fallback;
    try {
      return JSON.parse(json);
    } catch (e) {
      return fallback;
    }
  },

  // Internal: shows a persistent error banner at the top of the page
  _showError: function (message) {
    var banner = document.getElementById('error-banner');
    if (banner) {
      banner.textContent = message;
      banner.removeAttribute('hidden');
    }
  },

  // Returns Task[] — falls back to [] if localStorage is unavailable or corrupt
  readTasks: function () {
    try {
      var value = localStorage.getItem(this.KEYS.TASKS);
      return this._parse(value, []);
    } catch (e) {
      this._showError('Persistence unavailable: your data will not be saved this session.');
      return [];
    }
  },

  // Returns Link[] — falls back to []
  readLinks: function () {
    try {
      var value = localStorage.getItem(this.KEYS.LINKS);
      return this._parse(value, []);
    } catch (e) {
      this._showError('Persistence unavailable: your data will not be saved this session.');
      return [];
    }
  },

  // Serialises tasks to JSON; returns true on success, false on quota/access error
  writeTasks: function (tasks) {
    try {
      localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (e) {
      this._showError('Could not save your change: storage is full.');
      return false;
    }
  },

  // Serialises links to JSON; returns true on success, false on error
  writeLinks: function (links) {
    try {
      localStorage.setItem(this.KEYS.LINKS, JSON.stringify(links));
      return true;
    } catch (e) {
      this._showError('Could not save your change: storage is full.');
      return false;
    }
  },

  // Returns plain string name or '' if not set
  readName: function () {
    try {
      return localStorage.getItem(this.KEYS.NAME) || '';
    } catch (e) {
      return '';
    }
  },

  // Saves name string (no parse needed)
  writeName: function (name) {
    try {
      localStorage.setItem(this.KEYS.NAME, name);
    } catch (e) {
      // Non-critical — silently ignore
    }
  },

  // Returns 'light' or 'dark'
  readTheme: function () {
    try {
      return localStorage.getItem(this.KEYS.THEME) || 'light';
    } catch (e) {
      return 'light';
    }
  },

  // Saves theme string
  writeTheme: function (theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (e) {
      // Non-critical — silently ignore
    }
  }
};

// ---------------------------------------------------------------------------
// GreetingWidget — current time, date, and time-of-day greeting
// ---------------------------------------------------------------------------
const GreetingWidget = {
  _name: '',
  _intervalId: null,

  // Returns the appropriate greeting string for a given hour (0–23)
  _getGreeting: function (hour) {
    if (hour >= 5 && hour <= 11)  return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 21) return 'Good Evening';
    return 'Good Night';
  },

  // Returns zero-padded HH:MM string for a Date object
  _formatTime: function (date) {
    var h = date.getHours();
    var m = date.getMinutes();
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  },

  // Returns "Weekday, Month Day" (e.g. "Wednesday, October 8")
  _formatDate: function (date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month:   'long',
      day:     'numeric'
    });
  },

  // Writes time, date, and greeting text to the DOM
  _render: function () {
    var now  = new Date();
    var timeEl = document.getElementById('greeting-time');
    var dateEl = document.getElementById('greeting-date');
    var textEl = document.getElementById('greeting-text');

    if (timeEl) timeEl.textContent = this._formatTime(now);
    if (dateEl) dateEl.textContent = this._formatDate(now);
    if (textEl) {
      var greeting = this._getGreeting(now.getHours());
      textEl.textContent = greeting + (this._name ? ', ' + this._name : '') + '!';
    }
  },

  // Initialises the widget: injects DOM, loads name, starts clock interval
  init: function (containerEl) {
    // Time display
    var timeEl = document.createElement('p');
    timeEl.id = 'greeting-time';
    containerEl.appendChild(timeEl);

    // Date display
    var dateEl = document.createElement('p');
    dateEl.id = 'greeting-date';
    containerEl.appendChild(dateEl);

    // Greeting text
    var textEl = document.createElement('p');
    textEl.id = 'greeting-text';
    containerEl.appendChild(textEl);

    // Name input row
    var nameRow = document.createElement('div');
    nameRow.className = 'greeting-name-row';

    var nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'greeting-name-input');
    nameLabel.textContent = 'Your name:';

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id   = 'greeting-name-input';
    nameInput.placeholder = 'Enter your name';
    nameInput.maxLength   = 50;
    nameInput.className   = 'greeting-name-input';

    var saveBtn = document.createElement('button');
    saveBtn.id        = 'greeting-name-save';
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn btn-primary btn-sm';

    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    nameRow.appendChild(saveBtn);
    containerEl.appendChild(nameRow);

    // Load persisted name
    this._name = StorageManager.readName();
    nameInput.value = this._name;

    // Wire Save button
    var self = this;
    function saveName() {
      var trimmed = nameInput.value.trim();
      StorageManager.writeName(trimmed);
      self._name = trimmed;
      self._render();
    }
    saveBtn.addEventListener('click', saveName);
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') saveName();
    });

    // Initial render and clock
    this._render();
    this._intervalId = setInterval(this._render.bind(this), 60000);
  }
};

// ---------------------------------------------------------------------------
// FocusTimerWidget — 25-minute countdown with Start / Stop / Reset
// ---------------------------------------------------------------------------
const FocusTimerWidget = {
  _state:            'idle', // 'idle' | 'running' | 'stopped'
  _remainingSeconds: 1500,   // 25 * 60
  _intervalId:       null,

  // Returns zero-padded MM:SS string for a seconds value
  _formatTime: function (seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },

  // Called every second while running
  _tick: function () {
    this._remainingSeconds = Math.max(0, this._remainingSeconds - 1);
    this._render();
    if (this._remainingSeconds === 0) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._state = 'idle';
      this._render(); // re-render to show end indicator
    }
  },

  // Transitions to 'running' and starts the interval
  _start: function () {
    if (this._state === 'running') return;
    this._state = 'running';
    this._intervalId = setInterval(this._tick.bind(this), 1000);
    this._render();
  },

  // Transitions to 'stopped' and clears the interval
  _stop: function () {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state = 'stopped';
    this._render();
  },

  // Resets to 25:00 idle
  _reset: function () {
    clearInterval(this._intervalId);
    this._intervalId      = null;
    this._remainingSeconds = 1500;
    this._state           = 'idle';
    this._render();
  },

  // Updates display and button states from current _state
  _render: function () {
    var display   = document.getElementById('timer-display');
    var startBtn  = document.getElementById('timer-start');
    var stopBtn   = document.getElementById('timer-stop');
    var endMsg    = document.getElementById('timer-end-indicator');

    if (display) {
      display.textContent = this._formatTime(this._remainingSeconds);
    }

    if (startBtn) {
      var startDisabled = this._state === 'running';
      startBtn.disabled = startDisabled;
      if (startDisabled) {
        startBtn.classList.add('btn-disabled');
      } else {
        startBtn.classList.remove('btn-disabled');
      }
    }

    if (stopBtn) {
      var stopDisabled = this._state !== 'running';
      stopBtn.disabled = stopDisabled;
      if (stopDisabled) {
        stopBtn.classList.add('btn-disabled');
      } else {
        stopBtn.classList.remove('btn-disabled');
      }
    }

    if (endMsg) {
      if (this._state === 'idle' && this._remainingSeconds === 0) {
        endMsg.removeAttribute('hidden');
      } else {
        endMsg.setAttribute('hidden', '');
      }
    }
  },

  // Initialises the widget: injects DOM and wires buttons
  init: function (containerEl) {
    // Timer display
    var display = document.createElement('p');
    display.id          = 'timer-display';
    display.textContent = '25:00';
    containerEl.appendChild(display);

    // Controls row
    var controls = document.createElement('div');
    controls.className = 'timer-controls';

    var startBtn = document.createElement('button');
    startBtn.id        = 'timer-start';
    startBtn.textContent = 'Start';
    startBtn.className = 'btn btn-primary';

    var stopBtn = document.createElement('button');
    stopBtn.id        = 'timer-stop';
    stopBtn.textContent = 'Stop';
    stopBtn.className = 'btn btn-secondary';

    var resetBtn = document.createElement('button');
    resetBtn.id        = 'timer-reset';
    resetBtn.textContent = 'Reset';
    resetBtn.className = 'btn btn-secondary';

    controls.appendChild(startBtn);
    controls.appendChild(stopBtn);
    controls.appendChild(resetBtn);
    containerEl.appendChild(controls);

    // End-of-session indicator
    var endMsg = document.createElement('p');
    endMsg.id          = 'timer-end-indicator';
    endMsg.textContent = '🎉 Session complete! Take a break.';
    endMsg.setAttribute('hidden', '');
    containerEl.appendChild(endMsg);

    // Wire click handlers
    startBtn.addEventListener('click',  this._start.bind(this));
    stopBtn.addEventListener('click',   this._stop.bind(this));
    resetBtn.addEventListener('click',  this._reset.bind(this));

    this._render();
  }
};

// ---------------------------------------------------------------------------
// TodoListWidget — task CRUD with completion state and persistence
// ---------------------------------------------------------------------------
const TodoListWidget = {
  _tasks:     [],
  _editingId: null,

  // Generates a collision-resistant id
  _generateId: function () {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).slice(2);
  },

  // Shows the duplicate warning message for 2 seconds then hides it
  _showDuplicateMsg: function () {
    var msg = document.getElementById('todo-duplicate-msg');
    if (!msg) return;
    msg.textContent = '⚠️ Task already exists!';
    msg.removeAttribute('hidden');
    setTimeout(function () {
      msg.setAttribute('hidden', '');
    }, 2000);
  },

  // Validates and adds a new task
  _addTask: function (text) {
    var trimmed = text.trim();
    if (trimmed === '' || trimmed.length > 500) return;

    // Duplicate check (case-insensitive)
    var lc = trimmed.toLowerCase();
    if (this._tasks.some(function (t) { return t.text.toLowerCase() === lc; })) {
      this._showDuplicateMsg();
      return;
    }

    this._tasks.push({
      id:        this._generateId(),
      text:      trimmed,
      completed: false,
      createdAt: Date.now()
    });
    StorageManager.writeTasks(this._tasks);
    this._render();
  },

  // Flips the completed state of a task
  _toggleComplete: function (taskId) {
    var task = this._tasks.find(function (t) { return t.id === taskId; });
    if (task) {
      task.completed = !task.completed;
      StorageManager.writeTasks(this._tasks);
      this._render();
    }
  },

  // Enters edit mode for a task
  _beginEdit: function (taskId) {
    this._editingId = taskId;
    this._render();
  },

  // Saves the edited text (discards if whitespace-only)
  _saveEdit: function (taskId, newText) {
    var trimmed = newText.trim();
    if (trimmed === '') {
      this._editingId = null;
      this._render();
      return;
    }
    var task = this._tasks.find(function (t) { return t.id === taskId; });
    if (task) {
      task.text = trimmed;
      StorageManager.writeTasks(this._tasks);
    }
    this._editingId = null;
    this._render();
  },

  // Exits edit mode without saving
  _cancelEdit: function () {
    this._editingId = null;
    this._render();
  },

  // Removes a task by id
  _deleteTask: function (taskId) {
    this._tasks = this._tasks.filter(function (t) { return t.id !== taskId; });
    StorageManager.writeTasks(this._tasks);
    this._render();
  },

  // Rebuilds the task list DOM from _tasks
  _render: function () {
    var list = document.getElementById('todo-task-list');
    if (!list) return;
    list.innerHTML = '';

    var self = this;

    this._tasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item';

      if (task.id === self._editingId) {
        // ---- Edit row ----
        var editInput = document.createElement('input');
        editInput.type      = 'text';
        editInput.value     = task.text;
        editInput.maxLength = 500;
        editInput.className = 'task-edit-input';
        editInput.setAttribute('aria-label', 'Edit task text');

        var saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className   = 'btn btn-primary btn-sm';
        saveBtn.addEventListener('click', function () {
          self._saveEdit(task.id, editInput.value);
        });

        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className   = 'btn btn-secondary btn-sm';
        cancelBtn.addEventListener('click', function () {
          self._cancelEdit();
        });

        editInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter')  self._saveEdit(task.id, editInput.value);
          if (e.key === 'Escape') self._cancelEdit();
        });

        var actions = document.createElement('div');
        actions.className = 'task-actions';
        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);

        li.appendChild(editInput);
        li.appendChild(actions);

        // Auto-focus the edit input
        setTimeout(function () { editInput.focus(); }, 0);

      } else {
        // ---- Normal row ----
        var checkbox = document.createElement('input');
        checkbox.type      = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked   = task.completed;
        checkbox.setAttribute('aria-label', 'Mark task complete');
        checkbox.addEventListener('change', function () {
          self._toggleComplete(task.id);
        });

        var span = document.createElement('span');
        span.className   = 'task-text' + (task.completed ? ' task-complete' : '');
        span.textContent = task.text;

        var editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.className   = 'btn btn-secondary btn-sm';
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.addEventListener('click', function () {
          self._beginEdit(task.id);
        });

        var deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.className   = 'btn btn-danger btn-sm';
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.addEventListener('click', function () {
          self._deleteTask(task.id);
        });

        var actions = document.createElement('div');
        actions.className = 'task-actions';
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);
      }

      list.appendChild(li);
    });
  },

  // Initialises the widget: injects DOM, loads tasks, wires inputs
  init: function (containerEl) {
    // Input row
    var inputRow = document.createElement('div');
    inputRow.className = 'todo-input-row';

    var todoInput = document.createElement('input');
    todoInput.type        = 'text';
    todoInput.id          = 'todo-input';
    todoInput.maxLength   = 500;
    todoInput.placeholder = 'Add a new task…';
    todoInput.setAttribute('aria-label', 'New task text');

    var addBtn = document.createElement('button');
    addBtn.id          = 'todo-add';
    addBtn.textContent = 'Add Task';
    addBtn.className   = 'btn btn-primary';

    inputRow.appendChild(todoInput);
    inputRow.appendChild(addBtn);
    containerEl.appendChild(inputRow);

    // Duplicate message
    var dupMsg = document.createElement('p');
    dupMsg.id = 'todo-duplicate-msg';
    dupMsg.setAttribute('hidden', '');
    containerEl.appendChild(dupMsg);

    // Task list
    var taskList = document.createElement('ul');
    taskList.id = 'todo-task-list';
    containerEl.appendChild(taskList);

    // Load persisted tasks
    this._tasks = StorageManager.readTasks();

    // Wire Add button and Enter key
    var self = this;
    function doAdd() {
      self._addTask(todoInput.value);
      todoInput.value = '';
      todoInput.focus();
    }
    addBtn.addEventListener('click', doAdd);
    todoInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doAdd();
    });

    this._render();
  }
};

// ---------------------------------------------------------------------------
// QuickLinksWidget — user-defined website shortcut buttons
// ---------------------------------------------------------------------------
const QuickLinksWidget = {
  _links: [],

  // Generates a collision-resistant id
  _generateId: function () {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).slice(2);
  },

  // Ensures the URL starts with http:// or https://
  _normaliseUrl: function (url) {
    if (/^https?:\/\//i.test(url)) return url;
    return 'https://' + url;
  },

  // Shows an error in #quick-links-error
  _showLinkError: function (message) {
    var el = document.getElementById('quick-links-error');
    if (el) {
      el.textContent = message;
      el.removeAttribute('hidden');
    }
  },

  // Clears the error in #quick-links-error
  _clearLinkError: function () {
    var el = document.getElementById('quick-links-error');
    if (el) {
      el.textContent = '';
      el.setAttribute('hidden', '');
    }
  },

  // Validates and adds a new link
  _addLink: function (label, url) {
    this._clearLinkError();
    var trimLabel = label.trim();
    var trimUrl   = url.trim();

    if (trimLabel === '') {
      this._showLinkError('Label is required.');
      return;
    }
    if (trimUrl === '') {
      this._showLinkError('URL is required.');
      return;
    }
    if (trimLabel.length > 50) {
      this._showLinkError('Label must be 50 characters or fewer.');
      return;
    }
    if (trimUrl.length > 2048) {
      this._showLinkError('URL must be 2048 characters or fewer.');
      return;
    }
    if (this._links.length >= 20) return; // form already disabled by _render

    this._links.push({
      id:        this._generateId(),
      label:     trimLabel,
      url:       this._normaliseUrl(trimUrl),
      createdAt: Date.now()
    });
    StorageManager.writeLinks(this._links);
    this._render();
  },

  // Removes a link by id
  _deleteLink: function (linkId) {
    this._links = this._links.filter(function (l) { return l.id !== linkId; });
    StorageManager.writeLinks(this._links);
    this._render();
  },

  // Rebuilds the links panel DOM from _links
  _render: function () {
    var listEl    = document.getElementById('quick-links-list');
    var maxMsg    = document.getElementById('quick-links-max');
    var labelInput = document.getElementById('quick-links-label');
    var urlInput   = document.getElementById('quick-links-url');
    var addBtn     = document.getElementById('quick-links-add');

    if (!listEl) return;
    listEl.innerHTML = '';

    var self = this;

    this._links.forEach(function (link) {
      var item = document.createElement('div');
      item.className = 'link-item';

      var a = document.createElement('a');
      a.href             = link.url;
      a.target           = '_blank';
      a.rel              = 'noopener noreferrer';
      a.textContent      = link.label;

      var delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.className   = 'link-delete-btn';
      delBtn.setAttribute('aria-label', 'Remove link ' + link.label);
      delBtn.addEventListener('click', function () {
        self._deleteLink(link.id);
      });

      item.appendChild(a);
      item.appendChild(delBtn);
      listEl.appendChild(item);
    });

    // Max-links guard
    if (this._links.length >= 20) {
      if (maxMsg)    maxMsg.removeAttribute('hidden');
      if (labelInput) labelInput.disabled = true;
      if (urlInput)   urlInput.disabled   = true;
      if (addBtn)     addBtn.disabled      = true;
    } else {
      if (maxMsg)    maxMsg.setAttribute('hidden', '');
      if (labelInput) labelInput.disabled = false;
      if (urlInput)   urlInput.disabled   = false;
      if (addBtn)     addBtn.disabled      = false;
    }
  },

  // Initialises the widget: injects DOM, loads links, wires inputs
  init: function (containerEl) {
    // Input row
    var inputRow = document.createElement('div');
    inputRow.className = 'links-input-row';

    var labelInput = document.createElement('input');
    labelInput.type        = 'text';
    labelInput.id          = 'quick-links-label';
    labelInput.maxLength   = 50;
    labelInput.placeholder = 'Label';
    labelInput.setAttribute('aria-label', 'Link label');

    var urlInput = document.createElement('input');
    urlInput.type        = 'text';
    urlInput.id          = 'quick-links-url';
    urlInput.maxLength   = 2048;
    urlInput.placeholder = 'https://...';
    urlInput.setAttribute('aria-label', 'Link URL');

    var addBtn = document.createElement('button');
    addBtn.id          = 'quick-links-add';
    addBtn.textContent = 'Add Link';
    addBtn.className   = 'btn btn-primary';

    inputRow.appendChild(labelInput);
    inputRow.appendChild(urlInput);
    inputRow.appendChild(addBtn);
    containerEl.appendChild(inputRow);

    // Error message
    var errorMsg = document.createElement('p');
    errorMsg.id = 'quick-links-error';
    errorMsg.setAttribute('hidden', '');
    containerEl.appendChild(errorMsg);

    // Max-links message
    var maxMsg = document.createElement('p');
    maxMsg.id          = 'quick-links-max';
    maxMsg.textContent = 'Maximum 20 links reached.';
    maxMsg.setAttribute('hidden', '');
    containerEl.appendChild(maxMsg);

    // Links list
    var linksList = document.createElement('div');
    linksList.id = 'quick-links-list';
    containerEl.appendChild(linksList);

    // Load persisted links
    this._links = StorageManager.readLinks();

    // Wire Add button and Enter key on URL input
    var self = this;
    function doAdd() {
      self._addLink(labelInput.value, urlInput.value);
      // Clear inputs only if the link was actually added (no error shown)
      var errorEl = document.getElementById('quick-links-error');
      if (errorEl && errorEl.hasAttribute('hidden')) {
        labelInput.value = '';
        urlInput.value   = '';
        labelInput.focus();
      }
    }
    addBtn.addEventListener('click', doAdd);
    urlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doAdd();
    });

    this._render();
  }
};

// ---------------------------------------------------------------------------
// Bootstrap — wire everything together once the DOM is ready
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  // Top-level guard: catches any uncaught error during bootstrap
  try {

    // -- Theme toggle (Extra Challenge 3) ------------------------------------
    var savedTheme = StorageManager.readTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);

    var themeBtn = document.getElementById('theme-toggle');

    function updateThemeBtn(theme) {
      if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      }
    }
    updateThemeBtn(savedTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        StorageManager.writeTheme(next);
        updateThemeBtn(next);
      });
    }

    // -- GreetingWidget -----------------------------------------------------
    try {
      var greetingEl = document.getElementById('greeting-widget');
      if (!greetingEl) {
        StorageManager._showError('Widget failed to initialise: #greeting-widget element not found.');
      } else {
        GreetingWidget.init(greetingEl);
      }
    } catch (e) {
      StorageManager._showError('Widget failed to initialise: ' + e.message);
    }

    // -- FocusTimerWidget ---------------------------------------------------
    try {
      var timerEl = document.getElementById('focus-timer-widget');
      if (!timerEl) {
        StorageManager._showError('Widget failed to initialise: #focus-timer-widget element not found.');
      } else {
        FocusTimerWidget.init(timerEl);
      }
    } catch (e) {
      StorageManager._showError('Widget failed to initialise: ' + e.message);
    }

    // -- TodoListWidget -----------------------------------------------------
    try {
      var todoEl = document.getElementById('todo-list-widget');
      if (!todoEl) {
        StorageManager._showError('Widget failed to initialise: #todo-list-widget element not found.');
      } else {
        TodoListWidget.init(todoEl);
      }
    } catch (e) {
      StorageManager._showError('Widget failed to initialise: ' + e.message);
    }

    // -- QuickLinksWidget ---------------------------------------------------
    try {
      var quickLinksEl = document.getElementById('quick-links-widget');
      if (!quickLinksEl) {
        StorageManager._showError('Widget failed to initialise: #quick-links-widget element not found.');
      } else {
        QuickLinksWidget.init(quickLinksEl);
      }
    } catch (e) {
      StorageManager._showError('Widget failed to initialise: ' + e.message);
    }

  } catch (e) {
    // Last-resort handler: StorageManager itself may not be usable yet,
    // so fall back to direct DOM manipulation for the error banner.
    var banner = document.getElementById('error-banner');
    if (banner) {
      banner.textContent = 'Dashboard failed to initialise: ' + e.message;
      banner.removeAttribute('hidden');
    }
  }
});
