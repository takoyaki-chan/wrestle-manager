'use strict';

// K-1 経路差分テストの三者比較(基準 G0 / エンジン経路 / 実プレイ経路)。
//
// 出力する差分レコード:
//   { path, pattern, kind, base, eng, app }
//     path    : 'roster[#101].promoStack' のような具体的な場所
//     pattern : 'roster[*].promoStack' のように ID やペアキーを * に畳んだもの(許容リストの照合単位)
//     kind    : 'engOnly'  = エンジンだけが基準から変えた(実プレイ側は基準のまま)
//               'appOnly'  = 実プレイだけが基準から変えた(エンジン側は基準のまま)
//               'both'     = 両方が基準から変え、結果が食い違う
//
// 「どちらか片方だけが変えた」は処理の有無の強い証拠になる。'both' は式・入力・乱数消費の
// どれかが違う(どれかは乱数ストリームの計数と許容リストの注記で切り分ける)。

const EPS = 1e-9;

// 巨大・表示専用の塊は中身を掘らず「要約」で比べる
const SUMMARY_KEYS = new Set([
  'gameLog', 'debugLog', 'weekLogFeed', 'currentNewspaper', 'weeklyNewspaper', 'newspaperArchive',
  '_industryNewsEvents', '_newsEvents', 'industryNews', 'financeHistory', 'fundsHistory',
]);
// 選手オブジェクトの中で、要素単位に掘らず要約で比べる配列
const FIGHTER_ARRAY_SUMMARY = new Set([
  'growthLog', 'recentMatches', 'careerHistory',
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= EPS;
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function idKeyedArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const seen = new Set();
  for (const item of arr) {
    if (!isPlainObject(item) || item.id == null) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
  }
  return true;
}

// 数字だけ/ペアの形のキーは * に畳む(relationships '12>34'、rivalries '12-34'、h2h、
// relationshipCounters '12>34:match:normal'、_rivalryPopupSeen 'bitter:12-34' など)
function patternKey(key) {
  if (/^-?\d+$/.test(key)) return '*';
  if (/\d+\s*[>|:_-]\s*\d+/.test(key)) return '*';
  return key;
}

function summarizeArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const types = {};
  for (const item of arr) {
    const t = isPlainObject(item) ? (item.type || item.kind || 'object') : typeof item;
    types[t] = (types[t] || 0) + 1;
  }
  return { length: arr.length, types };
}

function summarizeValue(value) {
  if (Array.isArray(value)) return summarizeArray(value);
  if (isPlainObject(value)) return { keys: Object.keys(value).length, bytes: JSON.stringify(value).length };
  return value;
}

// lastShowResults の各試合結果は選手オブジェクトを丸ごと抱えているので、比較に効く欄だけに射影する
function projectMatchResult(r) {
  if (!isPlainObject(r)) return r;
  const pick = {};
  const keys = [
    'matchType', 'winner', 'mq', 'turns', 'finType', 'finMove', 'externalMQBonus', 'trustMQPenalty',
    'isTitleMatch', 'fanExpectMatch', 'freshnessBonus', 'freshnessLabel', 'rivalryResolved',
    'rivalryResolutionType', 'rivalryResolutionValue', 'isLastRunMatch', 'lastRunFighterId',
    'hpLeft', 'hpRight', 'mqInventory', '_stale', 'chemA', 'chemB', 'winAttribution',
  ];
  for (const key of keys) if (r[key] !== undefined) pick[key] = r[key];
  // mqInventory.path は「どの経路で確定したか」の名札('Engine.executeShow' / 'App._finalizeShowImpl')で、
  // 経路が2本ある限り必ず違う。中身の比較の邪魔になるので外す
  if (isPlainObject(pick.mqInventory)) {
    const { path: _path, ...inventory } = pick.mqInventory;
    pick.mqInventory = inventory;
  }
  if (r.left && r.left.id != null) pick.leftId = r.left.id;
  if (r.right && r.right.id != null) pick.rightId = r.right.id;
  if (r.rivalryBonus) pick.rivalryBonus = { tier: r.rivalryBonus.tier, rivalry: r.rivalryBonus.rivalry, label: r.rivalryBonus.label };
  if (r.perFighter) pick.perFighterIds = Object.keys(r.perFighter).map(Number).sort((a, b) => a - b);
  return pick;
}

function normalizeState(state) {
  if (!state) return state;
  const out = { ...state };
  if (Array.isArray(out.lastShowResults)) out.lastShowResults = out.lastShowResults.map(projectMatchResult);
  return out;
}

function classify(baseV, engV, appV) {
  const engChanged = !deepEqual(baseV, engV);
  const appChanged = !deepEqual(baseV, appV);
  if (engChanged && !appChanged) return 'engOnly';
  if (!engChanged && appChanged) return 'appOnly';
  return 'both';
}

function pushRecord(out, path, pattern, baseV, engV, appV, summarize) {
  const kind = classify(baseV, engV, appV);
  out.push({
    path, pattern, kind,
    base: summarize ? summarizeValue(baseV) : baseV,
    eng: summarize ? summarizeValue(engV) : engV,
    app: summarize ? summarizeValue(appV) : appV,
  });
}

function walk(baseV, engV, appV, path, pattern, out, depth, ctx) {
  if (deepEqual(engV, appV)) return;
  const lastSeg = pattern.split('.').pop();

  // 要約で比べる塊
  if (depth === 1 && SUMMARY_KEYS.has(path)) {
    pushRecord(out, path, pattern, baseV, engV, appV, true);
    return;
  }
  if (ctx.inFighter && FIGHTER_ARRAY_SUMMARY.has(lastSeg)) {
    pushRecord(out, path, pattern, baseV, engV, appV, true);
    return;
  }

  // ID つき配列(roster, retiredFighters, freeAgents, aiOrgs.*.roster など)は ID で突き合わせる
  if ((idKeyedArray(engV) || idKeyedArray(appV) || idKeyedArray(baseV))
      && (engV == null || Array.isArray(engV)) && (appV == null || Array.isArray(appV))) {
    const byId = (arr) => new Map((Array.isArray(arr) ? arr : []).map(item => [item.id, item]));
    const b = byId(baseV), e = byId(engV), a = byId(appV);
    const ids = new Set([...e.keys(), ...a.keys()]);
    for (const id of ids) {
      const ev = e.get(id), av = a.get(id), bv = b.get(id);
      const childPath = `${path}[#${id}]`;
      const childPattern = `${pattern}[*]`;
      if (ev === undefined || av === undefined) {
        // 片方にしかいない(引退・退団・ゲストの残留など)
        out.push({
          path: childPath, pattern: `${childPattern}(presence)`,
          kind: classify(bv === undefined ? 'absent' : 'present', ev === undefined ? 'absent' : 'present', av === undefined ? 'absent' : 'present'),
          base: bv === undefined ? 'absent' : 'present',
          eng: ev === undefined ? 'absent' : 'present',
          app: av === undefined ? 'absent' : 'present',
        });
        continue;
      }
      walk(bv, ev, av, childPath, childPattern, out, depth + 1, { ...ctx, inFighter: true });
    }
    return;
  }

  if (isPlainObject(engV) && isPlainObject(appV)) {
    const keys = new Set([...Object.keys(engV), ...Object.keys(appV)]);
    for (const key of keys) {
      const childPath = depth === 0 ? key : `${path}.${key}`;
      const childPattern = depth === 0 ? key : `${pattern}.${patternKey(key)}`;
      walk(isPlainObject(baseV) ? baseV[key] : undefined, engV[key], appV[key], childPath, childPattern, out, depth + 1, ctx);
    }
    return;
  }

  // lastShowResults のような ID なし配列は、長さが同じなら要素ごと、違えば要約
  if (Array.isArray(engV) && Array.isArray(appV) && engV.length === appV.length && engV.length <= 40
      && engV.every(isPlainObject)) {
    for (let i = 0; i < engV.length; i++) {
      walk(Array.isArray(baseV) ? baseV[i] : undefined, engV[i], appV[i], `${path}[${i}]`, `${pattern}[*]`, out, depth + 1, ctx);
    }
    return;
  }
  const summarize = Array.isArray(engV) || Array.isArray(appV) || isPlainObject(engV) || isPlainObject(appV);
  pushRecord(out, path, pattern, baseV, engV, appV, summarize && JSON.stringify([engV, appV]).length > 400);
}

function diffStates(base, eng, app) {
  const out = [];
  walk(normalizeState(base), normalizeState(eng), normalizeState(app), '', '', out, 0, { inFighter: false });
  return out;
}

// 2者比較(同じ経路の前後など)。kind は 'changed' のみ
function diffTwo(before, after) {
  const out = [];
  walk(normalizeState(before), normalizeState(before), normalizeState(after), '', '', out, 0, { inFighter: false });
  return out.map(r => ({ ...r, kind: 'changed' }));
}

function aggregate(records) {
  const map = new Map();
  for (const r of records) {
    let g = map.get(r.pattern);
    if (!g) {
      g = { pattern: r.pattern, count: 0, kinds: {}, examples: [], maxAbsDelta: 0 };
      map.set(r.pattern, g);
    }
    g.count++;
    g.kinds[r.kind] = (g.kinds[r.kind] || 0) + 1;
    if (g.examples.length < 3) g.examples.push(r);
    if (typeof r.eng === 'number' && typeof r.app === 'number') {
      g.maxAbsDelta = Math.max(g.maxAbsDelta, Math.abs(r.eng - r.app));
    }
  }
  return [...map.values()].sort((a, b) => a.pattern.localeCompare(b.pattern));
}

function short(value, max = 90) {
  let text;
  try { text = JSON.stringify(value); } catch (_e) { text = String(value); }
  if (text === undefined) text = 'undefined';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

module.exports = { diffStates, diffTwo, aggregate, deepEqual, short, projectMatchResult };
