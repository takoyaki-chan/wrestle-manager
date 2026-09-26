'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4「生きた記録」の検査側の物差し(test/k4-rebirth-clean-test.js / test/k4-lives-probe.js)
//
//  設計書 docs/fun-audit-v0.1/k4-separate-lives-design.md §3-A の19の保存先(+実装時に見つけた
//  2つ)に、ある選手IDへの参照がいくつ残っているかを保存先ごとに数える。
//  src の Engine.life.closeLiveRecords の表を写さず、キーの形から独立に読む
//  (同じ表を使うと、表の漏れを検査が見逃すため)。
// ══════════════════════════════════════════════════════════════════════════════

const toNum = s => { const n = Number(s); return Number.isFinite(n) ? n : null; };
const pairBy = (str, sep) => {
  const i = String(str).indexOf(sep);
  if (i <= 0) return [];
  return [toNum(str.slice(0, i)), toNum(str.slice(i + sep.length))];
};
const countKeys = (obj, pred) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 0;
  let n = 0;
  Object.keys(obj).forEach(k => { if (pred(k)) n += 1; });
  return n;
};
const arrowPairHas = (k, id) => pairBy(k, '>').includes(id);
// 関係フラグの項目: 名前が ...Id / idA / idB の欄が一致、または ...Ids 配列に含まれる
const itemHasId = (item, id) => {
  if (!item || typeof item !== 'object') return false;
  return Object.keys(item).some(k => {
    const v = item[k];
    if ((/Id$/.test(k) || /^id[AB12]?$/.test(k)) && toNum(v) === id) return true;
    if (/Ids$/.test(k) && Array.isArray(v) && v.some(x => toNum(x) === id)) return true;
    return false;
  });
};
// Glimpse A 層のキー: `${閾値id}_${話し手}_${相手}` / `trust_${閾値id}_${選手}`(閾値idにも _ が入る)
const glimpseKeyHas = (k, id) => {
  const t = String(k).split('_');
  if (t[0] === 'trust') return toNum(t[t.length - 1]) === id;
  return toNum(t[t.length - 1]) === id || toNum(t[t.length - 2]) === id;
};
const matchupHas = (e, id) => !!e && (toNum(e.leftId) === id || toNum(e.rightId) === id);
const coachAssignRefs = (ca, id) => {
  if (!ca || typeof ca !== 'object') return 0;
  let n = 0;
  Object.values(ca).forEach(list => { if (Array.isArray(list)) list.forEach(x => { if (toNum(x) === id) n += 1; }); });
  return n;
};

// [名前, (state, id) => 参照数]
const LIVE_STORES = [
  ['relationships', (s, id) => countKeys(s.relationships, k => arrowPairHas(k, id))],
  ['relationshipCounters', (s, id) => countKeys(s.relationshipCounters, k => arrowPairHas(String(k).split(':')[0], id))],
  ['relationshipFlags', (s, id) => {
    let n = 0;
    Object.values(s.relationshipFlags || {}).forEach(arr => {
      if (Array.isArray(arr)) arr.forEach(it => { if (itemHasId(it, id)) n += 1; });
    });
    return n;
  }],
  ['relationshipFlagLockouts', (s, id) => countKeys(s.relationshipFlagLockouts, k => arrowPairHas(String(k).split(':').pop(), id))],
  ['relationshipFlagCounters', (s, id) => countKeys(s.relationshipFlagCounters, k => arrowPairHas(String(k).split(':').pop(), id))],
  ['givenNameCalls', (s, id) => countKeys(s.givenNameCalls, k => arrowPairHas(k, id))],
  ['rivalries', (s, id) => countKeys(s.rivalries, k => pairBy(k, '-').includes(id))],
  ['h2h', (s, id) => countKeys(s.h2h, k => arrowPairHas(k, id))],
  ['matchupLog', (s, id) => (Array.isArray(s.matchupLog) ? s.matchupLog.filter(e => matchupHas(e, id)).length : 0)],
  ['aiOrgs.matchupLog', (s, id) => Object.values(s.aiOrgs || {}).reduce((n, o) =>
    n + (o && Array.isArray(o.matchupLog) ? o.matchupLog.filter(e => matchupHas(e, id)).length : 0), 0)],
  ['tagExp', (s, id) => countKeys(s.tagExp, k => arrowPairHas(k, id))],
  ['popOvertakeTriggered', (s, id) => countKeys(s.popOvertakeTriggered, k => arrowPairHas(k, id))],
  ['w1FireCount', (s, id) => countKeys(s.w1FireCount, k => pairBy(k, '_').includes(id))],
  ['_contagionLastWeek', (s, id) => countKeys(s._contagionLastWeek, k => arrowPairHas(k, id))],
  ['n06CooldownWeeks', (s, id) => countKeys(s.n06CooldownWeeks, k => arrowPairHas(k, id))],
  ['_glimpseAPrevValues', (s, id) => countKeys(s._glimpseAPrevValues, k => arrowPairHas(k, id))],
  ['_snapshotCooldowns', (s, id) => countKeys(s._snapshotCooldowns, k => String(k).split('_').slice(1).map(toNum).includes(id))],
  ['newsSeen', (s, id) => ['injury', 'streak', 'org', 'retired', 'followUp']
    .reduce((n, sub) => n + countKeys((s.newsSeen || {})[sub], k => toNum(k) === id), 0)],
  ['coachAssign', (s, id) => coachAssignRefs(s.coachAssign, id)
    + Object.values(s.aiOrgs || {}).reduce((n, o) => n + coachAssignRefs(o && o.coachAssign, id), 0)],
  // 実装時に見つけた追加の保存先(設計書の19に無い。閾値の発火済み印は時間で消えない)
  ['_glimpseAFired', (s, id) => countKeys(s._glimpseAFired, k => glimpseKeyHas(k, id))],
  ['_glimpseACooldowns', (s, id) => countKeys(s._glimpseACooldowns, k => glimpseKeyHas(k, id))],
];

/** 各保存先に残る参照数 { 保存先名: n }(0件の保存先は省く) */
function findLiveRefs(state, id) {
  const out = {};
  const nid = toNum(id);
  if (!state || nid == null) return out;
  LIVE_STORES.forEach(([name, fn]) => {
    const n = fn(state, nid);
    if (n > 0) out[name] = n;
  });
  return out;
}

const DESIGN_STORE_NAMES = LIVE_STORES.slice(0, 19).map(([name]) => name);

module.exports = { LIVE_STORES, DESIGN_STORE_NAMES, findLiveRefs, itemHasId, glimpseKeyHas };
