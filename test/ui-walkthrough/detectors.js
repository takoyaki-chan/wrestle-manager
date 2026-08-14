'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RAW_VALUE_PATTERN = /undefined|NaN|\[object\s|\bnull\b/gi;
const INTERNAL_TOKEN_PATTERN = /\b(?:morale|orgPop|weekPhase|condition)\b/g;

function stableHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeName(value) {
  return String(value || 'issue').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'issue';
}

async function readPageSnapshot(page) {
  return page.evaluate(() => {
    const visible = element => {
      if (!(element instanceof Element)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
        && rect.width > 0 && rect.height > 0;
    };
    const text = Array.from(document.querySelectorAll('body *'))
      .filter(element => visible(element) && element.children.length === 0)
      .map(element => element.textContent || '')
      .join('\n');
    const overlays = Array.from(document.querySelectorAll('[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer'))
      .filter(visible)
      .map(element => {
        let label = element.id || element.className;
        // 汎用モーダル枠は枠idだけでは中身を識別できない(例: 統一王座「こちらの番」は
        // mdlAOverlayに載るため、点火マーカーが枠の中身を観測できなかった — 2026-08-14 R4)。
        // カード直下2階層のクラス列を連結し、中身をマーカーから識別可能にする
        if (/^(mdlAOverlay|mdlBOverlay|mdlCOverlay|mdlDOverlay|notifModalOverlay)$/.test(element.id || '')) {
          const inner = Array.from(element.querySelectorAll(':scope > *, :scope > * > *'))
            .slice(0, 12)
            .map(node => (typeof node.className === 'string' ? node.className : ''))
            .filter(Boolean)
            .join(' ');
          if (inner) label = `${label}:${inner}`;
        }
        return label;
      })
      .map(value => String(value).replace(/\s+/g, '.'))
      .sort();
    // #titleScreen は .screen ではなく .title-screen で、表示中は下の .screen に全面で
    // 重なる(下は非表示にならない)。可視ならタイトルを最優先で採る
    const titleScreen = document.getElementById('titleScreen');
    const activeScreen = (titleScreen && visible(titleScreen))
      ? titleScreen
      : Array.from(document.querySelectorAll('.screen')).find(visible);
    // ポップアップ直列化キューの観測プローブ(2026-08-14 キュー飢餓調査で追加)。
    // _popupQueue/_isPopupActive はメインワールドのグローバルレキシカルなので直接読める。
    // didProgress の比較対象には含めない(キュー残量の変化を「前進」と誤認させない)
    let popup = null;
    try {
      popup = {
        queueLength: (typeof _popupQueue !== 'undefined' && Array.isArray(_popupQueue)) ? _popupQueue.length : null,
        active: (typeof _isPopupActive === 'function') ? !!_isPopupActive() : null,
      };
    } catch (_error) {}
    let state = null;
    try {
      if (typeof G !== 'undefined' && G) {
        state = {
          season: G.season,
          week: G.week,
          weekPhase: G.weekPhase,
          offSeason: !!G.offSeason,
          offWeek: G.offWeek || 0,
          showCardValid: Array.isArray(G.showCard)
            ? G.showCard.filter(match => match && (match.matchType === 'tag'
              ? match.teamA?.fighter1 > 0 && match.teamB?.fighter1 > 0
              : match.left > 0 && match.right > 0)).length
            : 0,
          pendingAwards: !!G.pendingAwards,
        };
      }
    } catch (_error) {}
    const domShape = `${document.body?.childElementCount || 0}|${document.querySelectorAll('*').length}|${text}`;
    return {
      activeScreen: activeScreen?.id || null,
      domShape,
      overlays,
      popup,
      state,
      text,
      title: document.title,
      url: location.href,
    };
  });
}

function summarizeSnapshot(snapshot) {
  return {
    activeScreen: snapshot.activeScreen,
    domHash: stableHash(snapshot.domShape),
    overlays: snapshot.overlays,
    popup: snapshot.popup,
    state: snapshot.state,
    textHash: stableHash(snapshot.text),
    title: snapshot.title,
    url: snapshot.url,
  };
}

function didProgress(before, after) {
  if (!before || !after) return true;
  return before.domHash !== after.domHash
    || before.textHash !== after.textHash
    || before.activeScreen !== after.activeScreen
    || JSON.stringify(before.overlays) !== JSON.stringify(after.overlays)
    || JSON.stringify(before.state) !== JSON.stringify(after.state)
    || before.url !== after.url;
}

class WalkthroughDetectors {
  constructor(options = {}) {
    this.stackTimeoutMs = options.stackTimeoutMs || 5000;
    this.watchdogMs = options.watchdogMs || 90000;
    this.issues = [];
    this.consoleEntries = [];
    this.lastProgressAt = Date.now();
    this.lastProgressKey = null;
    this._seenIssueKeys = new Set();
  }

  attach(page) {
    page.on('pageerror', error => {
      this.record('D1_EXCEPTION', error.message, { stack: error.stack || String(error) });
    });
    page.on('console', message => {
      const entry = { type: message.type(), text: message.text() };
      this.consoleEntries.push(entry);
      if (entry.type === 'error' || (entry.type === 'warning' && entry.text.includes('[WM Debug]'))) {
        this.record('D1_CONSOLE', entry.text, entry);
      }
    });
  }

  record(type, message, details = {}) {
    const issue = { type, message: compactText(message), details };
    const key = `${type}|${issue.message}|${stableHash(JSON.stringify(details))}`;
    if (this._seenIssueKeys.has(key)) return issue;
    this._seenIssueKeys.add(key);
    this.issues.push(issue);
    return issue;
  }

  async snapshot(page) {
    return summarizeSnapshot(await readPageSnapshot(page));
  }

  async beginMutationWatch(page) {
    const handle = await page.evaluateHandle(() => {
      const tracker = { mutated: false };
      const observer = new MutationObserver(() => { tracker.mutated = true; });
      observer.observe(document.documentElement, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      tracker.stop = () => observer.disconnect();
      return tracker;
    });
    return {
      dispose: async () => {
        await page.evaluate(tracker => tracker.stop(), handle).catch(() => {});
        await handle.dispose().catch(() => {});
      },
      hasMutated: () => page.evaluate(tracker => tracker.mutated, handle),
    };
  }

  async scanText(page) {
    const snapshot = await readPageSnapshot(page);
    const lines = snapshot.text.split(/\r?\n/).map(compactText).filter(Boolean);
    const matches = [];
    for (const line of lines) {
      for (const raw of line.matchAll(RAW_VALUE_PATTERN)) {
        matches.push({ kind: 'raw-value', token: raw[0], context: line.slice(0, 240) });
      }
      for (const internal of line.matchAll(INTERNAL_TOKEN_PATTERN)) {
        matches.push({ kind: 'internal-token', token: internal[0], context: line.slice(0, 240) });
      }
    }
    for (const match of matches) {
      this.record('D3_TEXT', `${match.token} exposed in visible text`, match);
    }
    return matches;
  }

  noteProgress(snapshot, now = Date.now()) {
    const state = snapshot?.state;
    if (!state) return;
    const key = `${state.season}|${state.week}|${state.offSeason}|${state.offWeek}`;
    if (this.lastProgressKey === null || key !== this.lastProgressKey) {
      this.lastProgressKey = key;
      this.lastProgressAt = now;
    }
  }

  checkWatchdog(snapshot, now = Date.now()) {
    this.noteProgress(snapshot, now);
    const stalledForMs = now - this.lastProgressAt;
    if (stalledForMs < this.watchdogMs) return null;
    return this.record('D5_WATCHDOG', `week did not advance for ${stalledForMs}ms`, {
      stalledForMs,
      state: snapshot?.state || null,
    });
  }

  async waitForProgress(page, before, options = {}) {
    const mutationWatch = options.mutationWatch || null;
    const timeoutMs = options.timeoutMs || this.stackTimeoutMs;
    const pollMs = Math.min(options.pollMs || 100, timeoutMs);
    const deadline = Date.now() + timeoutMs;
    let after = before;
    do {
      await page.waitForTimeout(pollMs);
      after = await this.snapshot(page);
      const mutated = mutationWatch ? await mutationWatch.hasMutated().catch(() => false) : false;
      if (mutated || didProgress(before, after)) {
        this.noteProgress(after);
        return { progressed: true, after };
      }
    } while (Date.now() < deadline);
    return { progressed: false, after };
  }

  async detectStack(page, before, action, retryActions = [], mutationWatch = null) {
    const first = await this.waitForProgress(page, before, { mutationWatch });
    await mutationWatch?.dispose();
    if (first.progressed) return first;

    let after = first.after;
    for (const retry of retryActions) {
      const retryWatch = await this.beginMutationWatch(page);
      await retry().catch(() => {});
      const result = await this.waitForProgress(page, after, { mutationWatch: retryWatch });
      await retryWatch.dispose();
      after = result.after;
      if (result.progressed) return { ...result, recoveredByRetry: true };
    }

    const issue = this.record('D2_FREEZE', `no observable progress after clicking ${action}`, {
      action,
      before,
      after,
      retriedButtons: retryActions.length,
    });
    return { progressed: false, after, issue };
  }
}

async function writeFailureArtifacts(options) {
  const {
    actionLog,
    artifactRoot,
    consoleEntries,
    issue,
    page,
    reproductionCommand,
    state,
    step,
  } = options;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = path.join(artifactRoot, `${stamp}-${sanitizeName(issue.type)}`);
  fs.mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, 'screenshot.png'), fullPage: true }).catch(() => {});
  fs.writeFileSync(path.join(directory, 'actions.json'), `${JSON.stringify(actionLog, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(directory, 'state.json'), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(directory, 'console.json'), `${JSON.stringify(consoleEntries, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(directory, 'README.txt'), [
    `${issue.type}: ${issue.message}`,
    `step: ${step}`,
    `reproduce: ${reproductionCommand}`,
    '',
  ].join('\n'), 'utf8');
  return directory;
}

module.exports = {
  WalkthroughDetectors,
  didProgress,
  readPageSnapshot,
  stableHash,
  summarizeSnapshot,
  writeFailureArtifacts,
};
