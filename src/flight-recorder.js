(function () {
  'use strict';

  try {
    const STORAGE_KEY = 'wm_flight';
    const AUTOSAVE_KEY = 'wrestle_manager_autosave';
    const SAVE_PREFIX = 'wrestle_manager_save_';
    const MAX_ERRORS = 30;
    const MAX_ACTIONS = 100;
    const MAX_STORAGE_BYTES = 150 * 1024;
    const MAX_AUTOSAVE_BYTES = 1024 * 1024;
    const sessionStartedAt = Date.now();

    let flushTimer = null;
    let badge = null;
    let panel = null;
    let styleNode = null;
    let statusNode = null;

    function asString(value) {
      try {
        return String(value == null ? '' : value);
      } catch (_) {
        return '[unprintable]';
      }
    }

    function limited(value, max) {
      try {
        return asString(value).slice(0, max);
      } catch (_) {
        return '';
      }
    }

    function utf8Bytes(value) {
      try {
        const text = asString(value);
        let bytes = 0;
        for (let index = 0; index < text.length; index += 1) {
          const code = text.charCodeAt(index);
          if (code < 0x80) bytes += 1;
          else if (code < 0x800) bytes += 2;
          else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
            const next = text.charCodeAt(index + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
              bytes += 4;
              index += 1;
            } else bytes += 3;
          } else bytes += 3;
        }
        return bytes;
      } catch (_) {
        return 0;
      }
    }

    function numberOr(value, fallback) {
      try {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
      } catch (_) {
        return fallback;
      }
    }

    function filenameOnly(source) {
      try {
        const clean = asString(source).split(/[?#]/)[0];
        return limited(clean.split(/[\\/]/).pop() || '', 240);
      } catch (_) {
        return '';
      }
    }

    function sanitizeError(entry) {
      try {
        return {
          t: numberOr(entry && entry.t, Date.now()),
          type: limited(entry && entry.type, 40),
          msg: limited(entry && entry.msg, 2000),
          src: filenameOnly(entry && entry.src),
          line: numberOr(entry && entry.line, 0),
          col: numberOr(entry && entry.col, 0),
          stack: limited(entry && entry.stack, 2000),
          count: Math.max(1, numberOr(entry && entry.count, 1)),
        };
      } catch (_) {
        return null;
      }
    }

    function sanitizeClasses(value) {
      try {
        const classes = Array.isArray(value) ? value : [];
        return classes.slice(0, 3).map(function (name) {
          return limited(name, 500);
        });
      } catch (_) {
        return [];
      }
    }

    function sanitizeAction(entry) {
      try {
        if (!entry || entry.kind === 'boundary') {
          return {
            t: numberOr(entry && entry.t, Date.now()),
            kind: 'boundary',
            session: Math.max(1, numberOr(entry && entry.session, 1)),
          };
        }
        return {
          t: Math.max(0, numberOr(entry.t, 0)),
          kind: 'click',
          tag: limited(entry.tag, 40),
          id: limited(entry.id, 1000),
          cls: sanitizeClasses(entry.cls),
          text: limited(entry.text, 40),
        };
      } catch (_) {
        return null;
      }
    }

    function emptyState() {
      return { v: 1, session: 0, errors: [], actions: [] };
    }

    function loadState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw);
        const errors = Array.isArray(parsed.errors)
          ? parsed.errors.map(sanitizeError).filter(Boolean).slice(-MAX_ERRORS)
          : [];
        const actions = Array.isArray(parsed.actions)
          ? parsed.actions.map(sanitizeAction).filter(Boolean).slice(-MAX_ACTIONS)
          : [];
        return {
          v: 1,
          session: Math.max(0, numberOr(parsed.session, 0)),
          errors: errors,
          actions: actions,
        };
      } catch (_) {
        return emptyState();
      }
    }

    let state = loadState();

    function enforceRingLimits() {
      try {
        if (state.errors.length > MAX_ERRORS) state.errors = state.errors.slice(-MAX_ERRORS);
        if (state.actions.length > MAX_ACTIONS) state.actions = state.actions.slice(-MAX_ACTIONS);
      } catch (_) {}
    }

    function serializedWithinLimit() {
      try {
        enforceRingLimits();
        let serialized = JSON.stringify(state);
        while (utf8Bytes(serialized) > MAX_STORAGE_BYTES) {
          if (state.actions.length > 0) state.actions.shift();
          else if (state.errors.length > 0) state.errors.shift();
          else break;
          serialized = JSON.stringify(state);
        }
        return serialized;
      } catch (_) {
        return '';
      }
    }

    function persist() {
      try {
        let serialized = serializedWithinLimit();
        if (!serialized) return;
        let attempts = state.actions.length + state.errors.length + 1;
        while (attempts > 0) {
          try {
            window.localStorage.setItem(STORAGE_KEY, serialized);
            return;
          } catch (_) {
            if (state.actions.length > 0) state.actions.shift();
            else if (state.errors.length > 0) state.errors.shift();
            else return;
            serialized = serializedWithinLimit();
            attempts -= 1;
          }
        }
      } catch (_) {}
    }

    function schedulePersist() {
      try {
        if (flushTimer !== null) return;
        flushTimer = window.setTimeout(function () {
          try {
            flushTimer = null;
            persist();
          } catch (_) {}
        }, 2000);
      } catch (_) {}
    }

    function removeNode(node) {
      try {
        if (!node) return;
        if (typeof node.remove === 'function') node.remove();
        else if (node.parentNode) node.parentNode.removeChild(node);
      } catch (_) {}
    }

    function removeInterface() {
      try {
        removeNode(panel);
        removeNode(badge);
        removeNode(styleNode);
        panel = null;
        badge = null;
        styleNode = null;
        statusNode = null;
      } catch (_) {}
    }

    function showStatus(message) {
      try {
        if (!statusNode) return;
        statusNode.textContent = message;
        window.setTimeout(function () {
          try {
            if (statusNode && statusNode.textContent === message) statusNode.textContent = '';
          } catch (_) {}
        }, 2000);
      } catch (_) {}
    }

    function classNames(element) {
      try {
        if (element.classList) {
          return Array.prototype.slice.call(element.classList, 0, 3).map(function (name) {
            return limited(name, 500);
          });
        }
        const raw = typeof element.className === 'string'
          ? element.className
          : (element.className && element.className.baseVal) || '';
        return asString(raw).trim().split(/\s+/).filter(Boolean).slice(0, 3).map(function (name) {
          return limited(name, 500);
        });
      } catch (_) {
        return [];
      }
    }

    function isVisible(element) {
      try {
        if (!element || element.hidden) return false;
        const computed = typeof window.getComputedStyle === 'function'
          ? window.getComputedStyle(element)
          : element.style;
        if (!computed) return true;
        return computed.display !== 'none'
          && computed.visibility !== 'hidden'
          && computed.visibility !== 'collapse'
          && computed.opacity !== '0';
      } catch (_) {
        return false;
      }
    }

    function layerLabel(element) {
      try {
        const tag = limited(asString(element.tagName).toLowerCase(), 40) || 'element';
        const id = element.id ? '#' + limited(element.id, 200) : '';
        const classes = classNames(element).map(function (name) { return '.' + name; }).join('');
        return tag + id + classes;
      } catch (_) {
        return '';
      }
    }

    function collectOpenLayers() {
      try {
        const result = [];
        const children = document.body && document.body.children ? document.body.children : [];
        for (let index = 0; index < children.length && result.length < 50; index += 1) {
          const element = children[index];
          if (element === badge || element === panel || !isVisible(element)) continue;
          const label = layerLabel(element);
          if (label) result.push(label);
        }
        return result;
      } catch (_) {
        return [];
      }
    }

    function storageKeys() {
      try {
        const result = [];
        const length = numberOr(window.localStorage.length, 0);
        for (let index = 0; index < length; index += 1) {
          const key = window.localStorage.key(index);
          if (typeof key === 'string') result.push(key);
        }
        return result;
      } catch (_) {
        return [];
      }
    }

    function collectSaves() {
      try {
        const slots = storageKeys().filter(function (key) {
          return key.indexOf(SAVE_PREFIX) === 0;
        }).sort().map(function (key) {
          let raw = '';
          try { raw = window.localStorage.getItem(key) || ''; } catch (_) {}
          return { key: key, bytes: utf8Bytes(raw) };
        });
        let rawAutosave = null;
        try { rawAutosave = window.localStorage.getItem(AUTOSAVE_KEY); } catch (_) {}
        const autosave = typeof rawAutosave !== 'string'
          ? null
          : (utf8Bytes(rawAutosave) > MAX_AUTOSAVE_BYTES ? 'omitted' : rawAutosave);
        return { slots: slots, autosave: autosave };
      } catch (_) {
        return { slots: [], autosave: null };
      }
    }

    function extractContext(rawAutosave) {
      try {
        if (typeof rawAutosave !== 'string' || !rawAutosave) return null;
        let json = rawAutosave;
        if (rawAutosave.indexOf('WM_LZ|') === 0 || rawAutosave.indexOf('WM_LZ\u0000') === 0) {
          if (!window.LZString || typeof window.LZString.decompressFromUTF16 !== 'function') return null;
          json = window.LZString.decompressFromUTF16(rawAutosave.slice(6));
        }
        if (!json) return null;
        const parsed = JSON.parse(json);
        const season = Number(parsed && parsed.season);
        const week = Number(parsed && parsed.week);
        if (!Number.isFinite(season) || !Number.isFinite(week)) return null;
        return { season: season, week: week };
      } catch (_) {
        return null;
      }
    }

    function exportErrors() {
      try {
        return state.errors.map(function (entry) {
          return {
            t: entry.t,
            type: entry.type,
            msg: entry.msg,
            src: entry.src,
            line: entry.line,
            col: entry.col,
            stack: entry.stack,
            count: entry.count,
          };
        });
      } catch (_) {
        return [];
      }
    }

    function exportActions() {
      try {
        return state.actions.map(function (entry) {
          if (entry.kind === 'boundary') {
            return { t: entry.t, kind: 'boundary', session: entry.session };
          }
          return {
            t: entry.t,
            kind: 'click',
            tag: entry.tag,
            id: entry.id,
            cls: entry.cls.slice(0, 3),
            text: entry.text,
          };
        });
      } catch (_) {
        return [];
      }
    }

    function isoNow() {
      try {
        return new Date(Date.now()).toISOString();
      } catch (_) {
        return '';
      }
    }

    function buildBundle() {
      try {
        persist();
        const saves = collectSaves();
        return {
          v: 1,
          exportedAt: isoNow(),
          userAgent: limited(window.navigator && window.navigator.userAgent, 1000),
          viewport: numberOr(window.innerWidth, 0) + 'x' + numberOr(window.innerHeight, 0),
          errors: exportErrors(),
          actions: exportActions(),
          openLayers: collectOpenLayers(),
          saves: saves,
          context: extractContext(saves.autosave === 'omitted' ? null : saves.autosave),
        };
      } catch (_) {
        return {
          v: 1,
          exportedAt: isoNow(),
          userAgent: '',
          viewport: '0x0',
          errors: [],
          actions: [],
          openLayers: [],
          saves: { slots: [], autosave: null },
          context: null,
        };
      }
    }

    function reportText() {
      try {
        return JSON.stringify(buildBundle(), null, 2);
      } catch (_) {
        return '{}';
      }
    }

    function fallbackCopy(text) {
      let textarea = null;
      try {
        textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        return document.execCommand('copy') === true;
      } catch (_) {
        return false;
      } finally {
        removeNode(textarea);
      }
    }

    function copyReport() {
      try {
        const text = reportText();
        const clipboard = window.navigator && window.navigator.clipboard;
        if (clipboard && typeof clipboard.writeText === 'function') {
          try {
            const pending = clipboard.writeText(text);
            if (pending && typeof pending.then === 'function') {
              pending.then(function () {
                try { showStatus('コピーしました'); } catch (_) {}
              }).catch(function () {
                try { if (fallbackCopy(text)) showStatus('コピーしました'); } catch (_) {}
              });
              return;
            }
            showStatus('コピーしました');
            return;
          } catch (_) {}
        }
        if (fallbackCopy(text)) showStatus('コピーしました');
      } catch (_) {}
    }

    function saveReport() {
      try {
        const blob = new Blob([reportText()], { type: 'application/json;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'wm_bugreport_' + isoNow().slice(0, 10) + '.json';
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        removeNode(anchor);
        window.setTimeout(function () {
          try { window.URL.revokeObjectURL(url); } catch (_) {}
        }, 0);
      } catch (_) {}
    }

    function clearRecords() {
      try {
        if (!window.confirm('記録を消去しますか?')) return;
        if (flushTimer !== null) {
          try { window.clearTimeout(flushTimer); } catch (_) {}
          flushTimer = null;
        }
        state = { v: 1, session: state.session, errors: [], actions: [] };
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        removeInterface();
      } catch (_) {}
    }

    function makeButton(label, handler) {
      try {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', function () {
          try { handler(); } catch (_) {}
        });
        return button;
      } catch (_) {
        return null;
      }
    }

    function ensurePanel() {
      try {
        if (panel) return panel;
        panel = document.createElement('section');
        panel.id = 'wmFlightPanel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'wmFlightHeading');
        panel.hidden = true;

        const heading = document.createElement('h2');
        heading.id = 'wmFlightHeading';
        heading.textContent = '不具合の記録';
        const body = document.createElement('p');
        body.textContent = '直前のプレイで不具合が記録されました。「記録をコピー」または「ファイルで保存」で書き出して、報告に添えてください。ゲームはそのまま続けられます。';
        const controls = document.createElement('div');
        controls.id = 'wmFlightControls';
        const buttons = [
          makeButton('記録をコピー', copyReport),
          makeButton('ファイルで保存', saveReport),
          makeButton('記録を消去', clearRecords),
          makeButton('閉じる', function () { if (panel) panel.hidden = true; }),
        ];
        buttons.forEach(function (button) { if (button) controls.appendChild(button); });
        statusNode = document.createElement('div');
        statusNode.id = 'wmFlightStatus';
        statusNode.setAttribute('role', 'status');
        statusNode.setAttribute('aria-live', 'polite');
        panel.appendChild(heading);
        panel.appendChild(body);
        panel.appendChild(controls);
        panel.appendChild(statusNode);
        document.body.appendChild(panel);
        return panel;
      } catch (_) {
        panel = null;
        statusNode = null;
        return null;
      }
    }

    function ensureInterface() {
      try {
        if (state.errors.length === 0 || !document.body) return;
        if (!styleNode) {
          styleNode = document.createElement('style');
          styleNode.id = 'wmFlightStyle';
          styleNode.textContent = [
            '#wmFlightBadge{position:fixed;left:var(--space-sm,8px);bottom:var(--space-sm,8px);z-index:99999;width:24px;height:24px;padding:0;border:1px solid var(--gold,#d4a843);border-radius:var(--radius-sm,4px);background:var(--bg-dark,#1a1a1a);color:var(--gold-light,#f0d078);font:700 15px/22px var(--font-body,system-ui,sans-serif);cursor:pointer;box-shadow:0 2px 8px var(--wm-flight-shadow,rgba(0,0,0,.35))}',
            '#wmFlightBadge:focus-visible,#wmFlightPanel button:focus-visible{outline:2px solid var(--gold-light,#f0d078);outline-offset:2px}',
            '#wmFlightPanel{box-sizing:border-box;position:fixed;left:var(--space-sm,8px);bottom:40px;z-index:99999;width:min(340px,calc(100vw - 16px));max-height:calc(100vh - 56px);overflow:auto;padding:var(--space-lg,16px);border:1px solid var(--gold,#d4a843);border-radius:var(--radius-lg,10px);background:var(--bg-dark,#1a1a1a);color:var(--text-main,#e8e6e0);font-family:var(--font-body,system-ui,sans-serif);box-shadow:0 8px 24px var(--wm-flight-shadow,rgba(0,0,0,.5))}',
            '#wmFlightPanel[hidden]{display:none}',
            '#wmFlightPanel h2{margin:0 0 var(--space-md,12px);color:var(--gold-light,#f0d078);font-size:18px;line-height:1.4}',
            '#wmFlightPanel p{margin:0 0 var(--space-lg,16px);font-size:13px;line-height:1.7}',
            '#wmFlightControls{display:flex;flex-wrap:wrap;gap:var(--space-sm,8px)}',
            '#wmFlightPanel button{padding:var(--space-sm,8px) var(--space-md,12px);border:1px solid var(--gold,#d4a843);border-radius:var(--radius-sm,4px);background:var(--panel-bg,#181614);color:var(--text-main,#e8e6e0);font:700 11px/1.4 var(--font-body,system-ui,sans-serif);cursor:pointer}',
            '#wmFlightPanel button:hover{background:var(--card-bg,#12110e);color:var(--gold-light,#f0d078)}',
            '#wmFlightStatus{min-height:1.4em;margin-top:var(--space-sm,8px);color:var(--gold-light,#f0d078);font-size:11px}',
          ].join('');
          (document.head || document.documentElement).appendChild(styleNode);
        }
        if (!badge) {
          badge = document.createElement('button');
          badge.id = 'wmFlightBadge';
          badge.type = 'button';
          badge.textContent = '⚠';
          badge.title = '不具合の記録';
          badge.setAttribute('aria-label', '不具合の記録');
          badge.addEventListener('click', function () {
            try {
              const currentPanel = ensurePanel();
              if (currentPanel) currentPanel.hidden = false;
            } catch (_) {}
          });
          document.body.appendChild(badge);
        }
      } catch (_) {}
    }

    function showInterfaceWhenReady() {
      try {
        if (state.errors.length === 0) return;
        if (document.body) ensureInterface();
        else document.addEventListener('DOMContentLoaded', function () {
          try { ensureInterface(); } catch (_) {}
        }, { once: true });
      } catch (_) {}
    }

    function recordError(entry) {
      try {
        const normalized = sanitizeError(entry);
        if (!normalized) return;
        const previous = state.errors[state.errors.length - 1];
        if (previous && previous.msg === normalized.msg) {
          previous.count = Math.max(1, numberOr(previous.count, 1)) + 1;
          previous.t = normalized.t;
        } else {
          state.errors.push(normalized);
          if (state.errors.length > MAX_ERRORS) state.errors.shift();
        }
        persist();
        showInterfaceWhenReady();
      } catch (_) {}
    }

    function joinedArguments(args, max) {
      try {
        return limited(args.map(asString).join(' '), max);
      } catch (_) {
        return '';
      }
    }

    function wrapConsole(method, shouldRecord) {
      try {
        const original = window.console && window.console[method];
        if (typeof original !== 'function') return;
        window.console[method] = function () {
          const args = Array.prototype.slice.call(arguments);
          let result;
          try { result = original.apply(this, args); } catch (_) {}
          try {
            const message = joinedArguments(args, 1000);
            if (shouldRecord(message)) {
              recordError({
                t: Date.now(), type: 'console.' + method, msg: message,
                src: '', line: 0, col: 0, stack: '', count: 1,
              });
            }
          } catch (_) {}
          return result;
        };
      } catch (_) {}
    }

    function recordClick(event) {
      try {
        const target = event && event.target;
        if (!target || !target.tagName) return;
        state.actions.push({
          t: Math.max(0, Date.now() - sessionStartedAt),
          kind: 'click',
          tag: limited(asString(target.tagName).toLowerCase(), 40),
          id: limited(target.id, 1000),
          cls: classNames(target),
          text: limited(asString(target.textContent).trim(), 40),
        });
        if (state.actions.length > MAX_ACTIONS) state.actions.shift();
        schedulePersist();
      } catch (_) {}
    }

    function installHandlers() {
      try {
        const previousOnError = window.onerror;
        window.onerror = function (message, source, line, col, error) {
          try {
            if (typeof previousOnError === 'function') previousOnError.apply(this, arguments);
          } catch (_) {}
          try {
            recordError({
              t: Date.now(),
              type: 'error',
              msg: limited(message, 2000),
              src: filenameOnly(source),
              line: numberOr(line, 0),
              col: numberOr(col, 0),
              stack: limited(error && error.stack, 2000),
              count: 1,
            });
          } catch (_) {}
          return false;
        };
      } catch (_) {}

      try {
        window.addEventListener('unhandledrejection', function (event) {
          try {
            const reason = event && event.reason;
            recordError({
              t: Date.now(), type: 'unhandledrejection', msg: limited(reason, 2000),
              src: '', line: 0, col: 0, stack: limited(reason && reason.stack, 2000), count: 1,
            });
          } catch (_) {}
        });
      } catch (_) {}

      try {
        document.addEventListener('click', function (event) {
          try { recordClick(event); } catch (_) {}
        }, true);
      } catch (_) {}

      try {
        window.addEventListener('pagehide', function () {
          try { persist(); } catch (_) {}
        });
      } catch (_) {}

      try {
        document.addEventListener('keydown', function (event) {
          try {
            if (event && event.key === 'Escape' && panel) panel.hidden = true;
          } catch (_) {}
        });
      } catch (_) {}

      wrapConsole('error', function () { return true; });
      wrapConsole('warn', function (message) {
        try {
          return message.indexOf('[WM Debug]') === 0 || message.indexOf('[WM]') === 0;
        } catch (_) {
          return false;
        }
      });
    }

    state.session += 1;
    state.actions.push({ t: Date.now(), kind: 'boundary', session: state.session });
    if (state.actions.length > MAX_ACTIONS) state.actions.shift();
    persist();
    installHandlers();
    showInterfaceWhenReady();

    try {
      window.__wmFlightRecorder = {
        exportBundle: function () {
          try { return buildBundle(); } catch (_) { return null; }
        },
        flush: function () {
          try { persist(); } catch (_) {}
        },
      };
    } catch (_) {}
  } catch (_) {}
})();
