'use strict';

// レア画面強制点火カタログ(バグ捜索体制③)のシナリオ定義。
// 設計: docs/rare-screen-ignition-catalog-design-v0.1.md
//
// 各シナリオの形:
//   fixture.seed      — headless進行のシード(fixtureファイル名にも入る)
//   fixture.until(G)  — この条件の週の頭で進行を止めてfixture化する
//   fixture.maxWeeks  — headless進行の上限週(既定600=約11季。十数季かかるシナリオ用)
//   fixture.engineer(G) — 停止後の状態加工(省略可)。正規セーブとして成立する形だけを作る
//   fixture.assert(G) — fixtureとして成立している前提の検査。失敗文字列の配列を返す
//   walk              — 実UI走破の設定。seasonsは既定終了条件(開始季+seasonsの第1週)で使う
//   until(snapshot)   — 既定終了条件を差し替える場合のみ(snapshotはdetectors.summarizeSnapshotの形)
//   ignition[]        — 点火マーカー。required:trueが1つでも未観測ならIGNITION_MISFIRE
//   tour              — 走破後の画面ツアー(P6-18)。`{ steps:[{label,selector,expectScreen?,probe?,required?}],
//                       jaExposureScreens?:[画面id] }`。ランダム走がナビタブを踏まない設計のため
//                       到達できない「自由閲覧画面の奥」を決定論クリック列で開く。
//                       jaExposureScreens は **ENモードのときだけ** その画面のJA露出0を失敗条件にする
//   tourAssert(probes, lang) — tourの各stopのprobe結果を検査。失敗文字列の配列を返す(=不発検出)
//   finalProbe        — 走破終了後にページで1回evaluateする式(文字列)。Gの事後状態検証用
//   finalAssert(probe) — finalProbeの結果を検査。失敗文字列の配列を返す

const overlayHit = (snapshot, token) =>
  (snapshot.overlays || []).some(entry => String(entry).includes(token));

// ── R3共通: 挑戦系の前提状態づくり ──
// engineer はfixture生成プロセス(headless-simがEngine等をグローバルへロード済み)で走る。
// 実在の最も熱いクロス団体ペアを使い、rivalryだけ92へ底上げ(computeHeatはrivalry92なら
// bondに関係なく90超え)してから、processWeeklyが作るのと同じ形のpendingThisWeekを直接置く。
function _hottestCrossOrgPair(G) {
  const players = (G.roster || []).filter(f => !f.isRental && !f.injury && !f.forcedRest);
  let best = null;
  for (const self of players) {
    for (const [orgId, org] of Object.entries(G.aiOrgs || {})) {
      if (!org || org.disbanded || !Array.isArray(org.roster)) continue;
      for (const other of org.roster) {
        if (!other || other.id == null || other.injury) continue;
        const key = Engine.relationships._key(self.id, other.id);
        const rel = (G.relationships || {})[key];
        if (!rel) continue;
        const heat = Engine.challengeRequest.computeHeat(rel.rivalry, rel.bond);
        if (!best || heat > best.heat) best = { self, other, orgId, key, rel, heat };
      }
    }
  }
  return best;
}

function _engineerChallengePending(G, inverse) {
  let s = Engine.challengeRequest.ensureInit(G);
  const pair = _hottestCrossOrgPair(s);
  if (!pair) throw new Error('クロス団体の関係値ペアが1つも無い(シーズンが浅すぎる)。fixtureの停止週を後ろへ');
  const rel = { ...pair.rel, rivalry: Math.max(pair.rel.rivalry || 0, 92) };
  s = { ...s, relationships: { ...s.relationships, [pair.key]: rel } };
  const heat = Engine.challengeRequest.computeHeat(rel.rivalry, rel.bond);
  const pending = inverse
    ? (() => {
      const org = s.aiOrgs[pair.orgId];
      const mates = org.roster
        .filter(f => f && f.id !== pair.other.id && !f.injury && f.status !== 'retired')
        .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
        .slice(0, 2)
        .map(f => f.id);
      if (mates.length < 2) throw new Error(`${pair.orgId} の随行2名が揃わない。別シードで生成し直すこと`);
      return {
        _inverse: true,
        selfId: pair.other.id, otherId: pair.self.id, otherOrgId: 'player',
        requesterOrgId: pair.orgId,
        heat, rivalry: rel.rivalry, bond: rel.bond,
        issuedSeason: s.season, issuedWeek: s.week,
        memberIds: [pair.other.id, ...mates],
      };
    })()
    : {
      selfId: pair.self.id, otherId: pair.other.id, otherOrgId: pair.orgId,
      heat, rivalry: rel.rivalry, bond: rel.bond,
      issuedSeason: s.season, issuedWeek: s.week,
    };
  return { ...s, challengeRequest: { ...s.challengeRequest, pendingThisWeek: pending } };
}

function _assertChallengePending(G) {
  const fails = [];
  if (!G.challengeRequest || !G.challengeRequest.pendingThisWeek) fails.push('pendingThisWeek が置けていない');
  return fails;
}

// ── R4: 統一王座「こちらの番」の前提づくり ──
// aiHolderCycles=3 + challengePeriodKeyクリアで、次のtickWeekのprocessQuarterが
// エンジン自身の手で _pendingUnifiedPlayerTurn+通知を発行する(payloadを手作りしない)
function _engineerUnifiedPlayerTurn(G) {
  if (!G.unifiedTitle || !G.unifiedTitle.championId) throw new Error('統一王座が未創設(S4天頂戦を通過していない)。fixtureの停止週を確認');
  if (G.unifiedTitle.orgId === 'player') throw new Error('プレイヤーが統一王者のため挑戦サイクルを作れない。別シードで生成し直すこと');
  let s = { ...G };
  for (const k of ['_pendingUnifiedIncomingMatch', '_pendingUnifiedAIMatch', '_pendingUnifiedAwayMatch', '_pendingUnifiedPlayerTurn', '_pendingUnifiedNotification']) {
    if (s[k] !== undefined) { const { [k]: _, ...rest } = s; s = rest; }
  }
  return { ...s, unifiedTitle: { ...s.unifiedTitle, aiHolderCycles: 3, challengePeriodKey: null } };
}

// ── R5: 派閥開戦(F02_IGNITE)の前提づくり ──
// カードの自動組込みは存在しない(裁定: 枠は社長が決める)ため、発火予約
// factionPendingIgnite と「リーダー対決入りの予約済みカード」を両方fixtureへ置く。
// hostilityはF02「煽る」実装と同じ帯(+55)を両方向へ入れて表示の説得力を保つ
function _engineerFactionIgnite(G) {
  const roster = G.roster || [];
  const healthyLeader = f => roster.find(c => c.id === f.leaderId && !c.injury && !c.isRental && !c.forcedRest && (c.condition ?? 80) >= 40);
  const pairs = (G.factions || [])
    .filter(f => f && f.leaderId != null && Array.isArray(f.memberIds))
    .map(f => ({ faction: f, leader: healthyLeader(f) }))
    .filter(x => x.leader);
  if (pairs.length < 2) throw new Error('リーダー健在の派閥が2つ無い。fixtureの停止週を後ろへ/別シードで生成し直すこと');
  const [A, B] = pairs;
  let s = Engine.factions.applyHostilityChange(G, A.faction.id, B.faction.id, 55);
  s = Engine.factions.applyHostilityChange(s, B.faction.id, A.faction.id, 55);
  const now = Engine.util.absWeek(s.season, s.week);
  // カードの予約保存は不可: ロードが showPrep→manage 正規化+startShowPrepがカードを
  // リセットするため(app.js)、リーダー対決は走破側(makeBoost)が実際に編成して組む
  return {
    ...s,
    factionPendingIgnite: {
      factionAId: A.faction.id, factionBId: B.faction.id,
      leaderAId: A.leader.id, leaderBId: B.leader.id,
      factionAName: A.faction.name, factionBName: B.faction.name,
      scheduledFromWeek: now,
      expireWeek: now + 4,
    },
  };
}

// R5走破: スロット0にリーダー対決を実際に組む誘導。
// _spOpenPicker(0,side)→_spSelectFighter(0,side,leaderId)の実クリックで編成し、
// 両者が収まるまで興行開催を封じる
function _makeFactionIgniteBoost(fixture) {
  const pi = fixture.factionPendingIgnite || {};
  const nameOf = id => ((fixture.roster || []).find(c => c.id === id) || {}).name || '';
  const leaderA = { id: pi.leaderAId, name: nameOf(pi.leaderAId) };
  const leaderB = { id: pi.leaderBId, name: nameOf(pi.leaderBId) };
  const rowRegex = (side, id) => new RegExp(`_spSelectFighter\\(0,\\s*'${side}',\\s*${id}\\)`);
  const openRegex = side => new RegExp(`_spOpenPicker\\(0,\\s*'${side}'\\)`);
  return (candidate, all) => {
    const openL = all.find(c => openRegex('left').test(c.onclick));
    const openR = all.find(c => openRegex('right').test(c.onclick));
    if (!openL && !openR) return null; // 編成画面以外は通常スコア
    const rowA = all.find(c => rowRegex('left', leaderA.id).test(c.onclick));
    const rowB = all.find(c => rowRegex('right', leaderB.id).test(c.onclick));
    const leftDone = !!(openL && leaderA.name && openL.text.includes(leaderA.name));
    const rightDone = !!(openR && leaderB.name && openR.text.includes(leaderB.name));
    if (!leftDone && rowA) return candidate.index === rowA.index ? 9992 : null;
    if (leftDone && !rightDone && rowB) return candidate.index === rowB.index ? 9992 : null;
    if (!leftDone) return openL && candidate.index === openL.index ? 9991 : (/興行開催|おまかせ|おすすめ|OVR順|集客力順|全クリア/.test(candidate.text) ? -Infinity : null);
    if (!rightDone) return openR && candidate.index === openR.index ? 9991 : (/興行開催|おまかせ|おすすめ|OVR順|集客力順|全クリア/.test(candidate.text) ? -Infinity : null);
    // 両リーダー配置済み: 自動編成系でカードを壊さない(開催はデフォルトの9600で進む)
    return /おまかせ|おすすめ|OVR順|集客力順|全クリア/.test(candidate.text) ? -Infinity : null;
  };
}

// ── R12(P6-18): 年代記/序章の画面ツアー ──
// `.chron-wrap` の中身を1停車点ぶんまとめて読み出す probe。
//   - present … 年代記ブロックが描画されているか(不発検出の主判定)
//   - 各枠のテキスト … 章題/副題/ハイライト/章末/カード。空なら不発
//   - jaLeaves … 可視リーフ要素のうち日本語文字を含むもの(ENモードのゼロゲート)
// 走査範囲を `.chron-wrap` に絞ってあるので、同じ画面の他パネル(サブタブバー等)は数えない。
const CHRONICLE_PROBE = `(() => {
  const wrap = document.querySelector('.chron-wrap');
  if (!wrap) return { present: false };
  const norm = el => (el.textContent || '').replace(/\\s+/g, ' ').trim();
  const q = sel => Array.from(wrap.querySelectorAll(sel)).map(norm).filter(Boolean);
  const jaPattern = /[\\u3040-\\u30FF\\u3400-\\u9FFF\\uF900-\\uFAFF]/;
  const visible = el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };
  const jaLeaves = Array.from(wrap.querySelectorAll('*'))
    .filter(el => el.children.length === 0 && visible(el) && jaPattern.test(el.textContent || ''))
    .map(el => ({
      selector: el.id ? ('#' + el.id) : (el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\\s+/).slice(0, 2).join('.')),
      text: norm(el).slice(0, 60),
    }));
  return {
    present: true,
    eyebrow: q('.chron-eyebrow')[0] || '',
    title: q('.chron-title')[0] || '',
    period: q('.chron-period')[0] || '',
    subheadOrg: q('.chron-subhead-org')[0] || '',
    reporterQuote: q('.chron-prologue-quote')[0] || '',
    highlights: q('.chron-highlight-text'),
    closing: q('.chron-closing-line')[0] || '',
    aceQuotes: q('.chron-ace-quote'),
    narratives: q('.chron-ace-narrative').concat(q('.chron-gen-narrative')),
    aceMeta: q('.chron-ace-meta-val').concat(q('.chron-dual-meta-val')),
    eraStatKeys: q('.chron-era-stat-key'),
    eraStatVals: q('.chron-era-stat-val'),
    genMeta: q('.chron-gen-meta'),
    rivalRecords: q('.chron-rival-record'),
    prologueCards: q('.chron-prologue-name'),
    navLabels: q('.chron-nav-btn'),
    jaLeaves,
  };
})()`;

// 章タブ(タイムラインの tick / ラベル)は `setDbChronicleIdx(n)` の onclick で一意に取れる。
// 章数はセーブ依存なので、3章目までを必須・以降を任意にする(fixture.assert が3章以上を保証する)
const chronicleStop = (index, required) => ({
  label: index === 0 ? '序章' : `第${index}章`,
  selector: `[onclick="setDbChronicleIdx(${index})"]`,
  expectScreen: 'screen-database',
  probe: CHRONICLE_PROBE,
  ...(required === false ? { required: false } : {}),
});

// ── R13(P7-34): 新聞4面(年間MVPレース)の画面ツアー ──
// 4面はナビ巡回にも自然走破にも出てこない「自由閲覧画面(新聞)のさらに奥」——1面の
// 目次「MVPレース詳細 ▶」/MVP小窓「詳細 ▶」のどちらかを踏まないと出ない一覧・
// カードUIで、`_npFeatureOn` のような外側ゲートも無いため通常のnav巡回では素通りする。
// P7-23(`_npMvpI18n`の自己検証型fail-open)は実UIで一度も検査されていなかった
// (docs/worklog.md P7-23エントリの発見事項)ため、tourで強制到達させる。
//
// 1停車目(新聞を開く)の probe で `_npMvpI18n` を計測用ラッパーへ差し替える
// (window.__mvpFallback に理由付きで記録)。差し替えても分岐ロジックは完全に同じなので
// 表示内容には影響しない(=JA出力は不変)。2停車目(4面を開く)で実際にラップされた
// 関数が呼ばれ、フォールバック有無が記録される。
// P7-39: 実装(ui-render.js `_npMvpI18n`)の分岐をそのまま写す。不一致(regen-mismatch)は
// 引き続き記録するが、`WM_I18N.lang === 'en'` のときは実装と同じく保存値を捨てて
// `regen(dict)` を返す(旧セーブでもENでは現行プールの文が出る、というP7-39の本題)。
const MVP_INSTRUMENT_PROBE = `(() => {
  if (window.__mvpFallback) return { alreadyPatched: true };
  window.__mvpFallback = [];
  const orig = window._npMvpI18n;
  if (typeof orig !== 'function') return { patched: false, reason: '_npMvpI18n が見つからない' };
  window._npMvpI18n = function(saved, regen) {
    if (!saved || typeof saved !== 'string') return saved || '';
    if (typeof Engine === 'undefined' || !Engine.mvpRace) {
      window.__mvpFallback.push({ reason: 'no-engine', saved: saved.slice(0, 40) });
      return saved;
    }
    try {
      const bare = regen();
      const matches = bare === saved;
      if (!matches) {
        window.__mvpFallback.push({ reason: 'regen-mismatch', lang: window.WM_I18N.lang, saved: saved.slice(0, 40) });
        if (window.WM_I18N.lang !== 'en') return saved;
      }
      const out = regen(window.WM_I18N.t);
      if (typeof out !== 'string' || !out) {
        window.__mvpFallback.push({ reason: 'empty-dict-result', saved: saved.slice(0, 40) });
        return saved;
      }
      return out;
    } catch (e) {
      window.__mvpFallback.push({ reason: 'exception:' + String(e), saved: saved.slice(0, 40) });
      return saved;
    }
  };
  return { patched: true };
})()`;

// `#newspaperContent` の中身だけを読み出すprobe(CHRONICLE_PROBEの `.chron-wrap` 限定と同じ
// 思想 — 1面時点の残存要素やナビchromeを巻き込まない)。4面到達後にだけ使う
const MVPRACE_PROBE = `(() => {
  const root = document.getElementById('newspaperContent');
  if (!root) return { present: false };
  const norm = el => (el.textContent || '').replace(/\\s+/g, ' ').trim();
  const q = sel => Array.from(root.querySelectorAll(sel)).map(norm).filter(Boolean);
  const jaPattern = /[\\u3040-\\u30FF\\u3400-\\u9FFF\\uF900-\\uFAFF]/;
  const visible = el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };
  const jaLeaves = Array.from(root.querySelectorAll('*'))
    .filter(el => el.children.length === 0 && visible(el) && jaPattern.test(el.textContent || ''))
    .map(el => ({
      selector: el.id ? ('#' + el.id) : (el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\\s+/).slice(0, 2).join('.')),
      text: norm(el).slice(0, 60),
    }));
  return {
    present: !!root.querySelector('.np-mvprace-list'),
    headline: q('.np-page-headline')[0] || '',
    lead: q('.np-page-lead')[0] || '',
    kuroda: q('.np-kuroda-text')[0] || '',
    rank1Narrative: q('.np-mvprace-narrative')[0] || '',
    minorNarratives: q('.np-mvprace-minor-narrative'),
    listFlavors: q('.np-mvprace-list-flavor'),
    listRowCount: root.querySelectorAll('.np-mvprace-list-row--rich').length,
    rank1Name: q('.np-mvprace-name')[0] || '',
    jaLeaves,
  };
})()`;

// ── R14(P7-41): 対抗戦・挑戦状(死蔵セリフ WAR_DECLINE_DIALOGUE)の前提づくり ──
// checkRivalryWarは週10/22/34限定+抽選+隣接ランクという複合条件で自然発火が非常に稀。
// 他のB3系igniteと同じ発想で、複雑な発生条件は再現せずpendingEventへ直接
// type:'war'を置いて「挑戦状モーダルが出た状態」だけをfixture化する。
function _engineerWarChallengePending(G) {
  const rankings = G.rankings || [];
  const pIdx = rankings.findIndex(r => r.orgId === 'player');
  if (pIdx < 0) throw new Error('プレイヤー団体のランキングが見つからない。fixtureの停止週を変えて生成し直すこと');
  const adjacent = [];
  if (pIdx > 0) adjacent.push(rankings[pIdx - 1]);
  if (pIdx < rankings.length - 1) adjacent.push(rankings[pIdx + 1]);
  const opponent = adjacent.find(r => r && Engine.rival.getOrgInfo(G.aiOrgs, r.orgId));
  if (!opponent) throw new Error('隣接ランクのAI団体が見つからない。別シード/停止週で生成し直すこと');
  const aiOrg = Engine.rival.getOrgInfo(G.aiOrgs, opponent.orgId);
  const availableCount = Math.min(
    Engine.event.getWarEntryCandidates(G).length,
    Engine.event.getWarOpponentCandidates(G, aiOrg.orgId).length
  );
  if (availableCount < 3) throw new Error('対抗戦を組める人数(3人)が揃わない。別シード/停止週で生成し直すこと');
  const matchCount = availableCount >= 5 ? 5 : 3;
  // weekPhase:'event' も一緒に置く(checkRivalryWar発火時の本番と同じ形。ui-render.jsの
  // イベント表示分岐はweekPhaseで見ており、pendingEventだけでは挑戦状画面に入らない)
  return {
    ...G,
    pendingEvent: { type: 'war', opponentOrgId: aiOrg.orgId, opponentName: aiOrg.name, matchCount },
    weekPhase: 'event',
    warThisSeason: true,
    lastWarSeason: G.season,
  };
}

module.exports = {
  chronicle: {
    description: '年代記/序章の点火: 十数季進めたセーブ(序章=進行中+確定章6本)から、実UIでデータベース→年代記タブ→序章/各章/再構築を巡回し、章題・副題・ハイライト・章末・エース/同期カード・外敵・通算タイルの表示を検査する(ENでは日本語残り0をゲートにする)',
    fixture: {
      seed: 42,
      // 章の確定には十数季かかる(エースが引退して数年経つまで status は in_progress)。
      // 既定の maxWeeks=600(約11季)では届かないので上限を引き上げる
      maxWeeks: 1400,
      until: G => G.season === 18 && G.week === 3 && !G.offSeason,
      // 実UIも読み込み時にマイグレーション経由で章を作り直す(app.js の
      // _migrated_chronicle_status_v2 / _prime_v3)。ここで作るのは fixture.assert が
      // 「3章以上ある」ことを生成時点で確かめるため
      engineer: G => Engine.chronicle.buildChapters(G, { forceRebuild: true }),
      assert: G => {
        const fails = [];
        const chapters = (((G.chronicle || {}).chaptersCache || {}).chapters || []);
        const confirmed = chapters.filter(c => c.status === 'confirmed');
        if (confirmed.length < 3) fails.push(`確定章が${confirmed.length}本しかない(3本以上必要)。停止シーズンを後ろへ/別シードで生成し直すこと`);
        if (!G.prologue || !Array.isArray(G.prologue.founderIds) || G.prologue.founderIds.length === 0) {
          fails.push('序章(G.prologue)が作られていない');
        }
        if (G.prologue && G.prologue.status === 'empty') fails.push('序章の status が empty(年代記画面に出ない)');
        return fails;
      },
    },
    // 走破は「序章ハイライトの発火(App.checkPrologueHighlights は実UI側にしか無い)」と
    // 週次の正常進行を確かめるための数週ぶんだけ。画面ツアーが本題なので手数は絞る
    walk: { seasons: 1, maxSteps: 60 },
    until: s => !!(s.state && !s.state.offSeason && s.state.season === 18 && s.state.week >= 6),
    // 画面ツアーの observe が同じマーカー列を通るので、年代記画面(データベース)へ
    // 実際に到達したことは通常の点火マーカーとして出す。中身の不発検出は tourAssert
    ignition: [
      { name: 'chronicle-screen', required: true, match: s => s.activeScreen === 'screen-database' },
    ],
    tour: {
      jaExposureScreens: ['screen-database'],
      steps: [
        { label: 'データベース', selector: `.nav-btn[onclick^="showScreen('database'"]`, expectScreen: 'screen-database' },
        { label: '年代記タブ', selector: '.db-subtab-btn[onclick="setDbSubTab(6)"]', expectScreen: 'screen-database', probe: CHRONICLE_PROBE },
        chronicleStop(0),
        chronicleStop(1),
        chronicleStop(2),
        chronicleStop(3),
        chronicleStop(4, false),
        chronicleStop(5, false),
        chronicleStop(6, false),
        // 再構築ボタン(年代記を作り直して再描画する唯一の導線)
        { label: '年代記を再構築', selector: '.chron-rebuild-btn', expectScreen: 'screen-database', probe: CHRONICLE_PROBE },
      ],
    },
    tourAssert: (probes, lang) => {
      const fails = [];
      const stops = Object.entries(probes);
      if (stops.length === 0) return ['画面ツアーのprobeが1つも取れていない'];
      let sawPrologue = false;
      let sawChapter = false;
      let sawHighlight = false;
      let sawClosing = false;
      let sawAceCard = false;
      let sawEraStats = false;
      for (const [label, p] of stops) {
        if (!p || p.probeError) { fails.push(`${label}: probe失敗 ${p && p.probeError}`); continue; }
        if (!p.present) { fails.push(`${label}: .chron-wrap が描画されていない(不発)`); continue; }
        if (!p.title) fails.push(`${label}: 章題(.chron-title)が空`);
        if (!p.period) fails.push(`${label}: 期間(.chron-period)が空`);
        if (!p.subheadOrg) fails.push(`${label}: 団体名(.chron-subhead-org)が空`);
        if (p.reporterQuote) sawPrologue = true;
        if (p.aceQuotes && p.aceQuotes.length > 0) { sawChapter = true; sawAceCard = true; }
        if (p.highlights && p.highlights.length > 0) sawHighlight = true;
        if (p.closing) sawClosing = true;
        if (p.eraStatVals && p.eraStatVals.length > 0) sawEraStats = true;
        if (lang === 'en' && p.jaLeaves && p.jaLeaves.length > 0) {
          const head = p.jaLeaves.slice(0, 8).map(x => `${x.selector}:"${x.text}"`).join(' / ');
          fails.push(`${label}: ENなのに年代記の中に日本語が${p.jaLeaves.length}件残っている — ${head}`);
        }
      }
      if (!sawPrologue) fails.push('序章の「記者の見立て」を一度も観測していない(序章ブロックが出ていない)');
      if (!sawChapter) fails.push('確定章のエース欄(記者の目)を一度も観測していない');
      if (!sawHighlight) fails.push('ハイライト行を一度も観測していない');
      if (!sawClosing) fails.push('章末を一度も観測していない');
      if (!sawAceCard) fails.push('エースカードを一度も観測していない');
      if (!sawEraStats) fails.push('通算タイル(この時代の通算)を一度も観測していない');
      return fails;
    },
    finalProbe: `(() => {
      const chapters = (((typeof G !== 'undefined' && G.chronicle) || {}).chaptersCache || {}).chapters || [];
      const prologue = (typeof G !== 'undefined' && G.prologue) || null;
      return {
        chapters: chapters.length,
        confirmed: chapters.filter(c => c.status === 'confirmed').length,
        titleParts: chapters.filter(c => Array.isArray(c.titleParts) && c.titleParts.length).length,
        competitiveValue: chapters.filter(c => c.eraStats && c.eraStats.competitiveRecord && c.eraStats.competitiveRecord.value).length,
        prologueStatus: prologue ? prologue.status : null,
        prologueHighlights: prologue ? (prologue.highlights || []).length : 0,
        prologueParted: prologue ? (prologue.highlights || []).filter(h => Array.isArray(h.textParts) && h.textParts.length).length : 0,
      };
    })()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe) return ['finalProbeが取れていない'];
      if (probe.confirmed < 3) fails.push(`確定章が${probe.confirmed}本(3本以上を期待)`);
      if (probe.titleParts !== probe.chapters) fails.push(`titleParts を持たない章がある (${probe.titleParts}/${probe.chapters})`);
      if (probe.competitiveValue !== probe.chapters) fails.push(`competitiveRecord.value を持たない章がある (${probe.competitiveValue}/${probe.chapters})`);
      if (probe.prologueHighlights < 2) fails.push(`序章ハイライトが${probe.prologueHighlights}件(実UIの発火が起きていない)`);
      if (probe.prologueParted !== probe.prologueHighlights) {
        fails.push(`textParts を持たない序章ハイライトがある (${probe.prologueParted}/${probe.prologueHighlights})`);
      }
      return fails;
    },
  },

  'newspaper-mvprace': {
    description: '新聞4面(年間MVPレース)の点火: S1W3の平常セーブから実UIで新聞→1面の「MVPレース詳細 ▶」→4面へ到達し、見出し/リード/黒田寸評/TOP3寸評/4位以下一覧の表示と、_npMvpI18n(P7-23)の再生成一致(フォールバック0)・EN時のJA露出ゼロを検査する',
    fixture: {
      seed: 42,
      // mvpRace は「通常週確定の毎週末」に再集計される(week1終了時点で初めて埋まる)ので、
      // 週の頭で止めるfixtureはW2以降でないと空になる。4位以下の一覧行(rankings.length>3)も
      // 検査したいので、参加者数が安定するW3まで進める(engineer不要 — 通常進行で足りる)
      until: G => G.season === 1 && G.week === 3 && !G.offSeason,
      engineer: null,
      assert: G => {
        const fails = [];
        const rankings = (G.mvpRace && G.mvpRace.rankings) || [];
        if (rankings.length < 4) fails.push(`mvpRace.rankings が${rankings.length}件(4件以上必要 — 4位以下の一覧行を検査するため)`);
        if (!G.weeklyNewspaper || G.weeklyNewspaper.layout !== 'v3') fails.push('weeklyNewspaper.layout が v3 でない(旧レイアウトは4面リンクを持たない)');
        return fails;
      },
    },
    // 材料はfixture停止時点で既に揃っている(週を跨ぐ必要が無い)ので歩数はほぼ使わない —
    // untilを「状態が読めた最初の一手」に置き、画面ツアーへ即座に進む
    walk: { seasons: 1, maxSteps: 5 },
    until: s => !!(s.state),
    ignition: [
      // 4面固有のマーカーではない(新聞は自然nav巡回でも開くため)。中身の不発検出は
      // tourAssert が担う — chronicleと同じ役割分担
      { name: 'newspaper-screen', required: true, match: s => s.activeScreen === 'screen-newspaper' },
    ],
    tour: {
      steps: [
        {
          label: '新聞を開く',
          selector: `.nav-btn[onclick^="showScreen('newspaper'"]`,
          expectScreen: 'screen-newspaper',
          probe: MVP_INSTRUMENT_PROBE,
        },
        {
          label: '4面 MVPレース詳細',
          selector: `[onclick*="setNewspaperSubPage(4)"]`,
          expectScreen: 'screen-newspaper',
          probe: MVPRACE_PROBE,
        },
      ],
    },
    tourAssert: (probes, lang) => {
      const fails = [];
      const instrument = probes['新聞を開く'];
      if (!instrument || instrument.probeError) fails.push(`計測フックの設置に失敗: ${instrument && instrument.probeError}`);
      else if (instrument.patched === false) fails.push(`_npMvpI18n の計測フックを仕込めなかった: ${instrument.reason}`);
      const p = probes['4面 MVPレース詳細'];
      if (!p || p.probeError) { fails.push(`4面: probe失敗 ${p && p.probeError}`); return fails; }
      if (!p.present) { fails.push('4面: .np-mvprace-list が描画されていない(不発)'); return fails; }
      if (!p.headline) fails.push('4面: 見出し(.np-page-headline)が空');
      if (!p.lead) fails.push('4面: リード(.np-page-lead)が空');
      if (!p.kuroda) fails.push('4面: 黒田寸評(.np-kuroda-text)が空');
      if (!p.rank1Name) fails.push('4面: 1位選手名(.np-mvprace-name)が空');
      if (!p.rank1Narrative) fails.push('4面: 1位の寸評(.np-mvprace-narrative)が空');
      if (!p.minorNarratives || p.minorNarratives.length < 2) {
        fails.push(`4面: 2・3位の寸評(.np-mvprace-minor-narrative)が${p.minorNarratives ? p.minorNarratives.length : 0}件(2件必要)`);
      }
      if (!p.listRowCount || p.listRowCount < 1) fails.push('4位以下の一覧行(.np-mvprace-list-row--rich)が1件も無い');
      if (lang === 'en' && p.jaLeaves && p.jaLeaves.length > 0) {
        const head = p.jaLeaves.slice(0, 10).map(x => `${x.selector}:"${x.text}"`).join(' / ');
        fails.push(`4面: ENなのに日本語が${p.jaLeaves.length}件残っている — ${head}`);
      }
      return fails;
    },
    // window.__mvpFallback は MVP_INSTRUMENT_PROBE が仕込んだ計測器。フォールバックは
    // 「保存値≠再生成」(§18-1)の発生件数 — 新品fixtureでは0が期待(タスク仕様どおり)
    finalProbe: `(() => ({
      mvpFallback: (typeof window !== 'undefined' && window.__mvpFallback) ? window.__mvpFallback : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.mvpFallback == null) {
        fails.push('計測器(window.__mvpFallback)が見つからない — MVP_INSTRUMENT_PROBEが刺さっていない');
      } else if (probe.mvpFallback.length > 0) {
        const head = probe.mvpFallback.slice(0, 5).map(x => `${x.reason}:"${x.saved}"`).join(' / ');
        fails.push(`_npMvpI18n のフォールバックが${probe.mvpFallback.length}件発生(新品fixtureでは0が期待) — ${head}`);
      }
      return fails;
    },
  },

  // ── P7-39: 旧セーブ(P7-23以前=現行プールに存在しない完成文を持つ)の4面点火 ──
  // Keisuke裁定 B-3=③: 「言語がENのときだけ、保存値を捨てて現行プールで作り直す」。
  // newspaper-mvprace と同じ土台のセーブ(S1W3)を使い、fixture.engineer で保存済み5文字列
  // (見出し/リード/黒田寸評/TOP3寸評/4位以下タグライン)を現行プールに存在しない文面へ
  // 差し替えて「旧プールで焼かれた完成文」を模擬する(実物の旧セーブ2本
  // test/ui-walkthrough/fixtures/legacy-saves/{prerefix_S12W45,v1.25_S3W11}.jsonは
  // save-regression棚の実データ検査用に取っておき、ここでは現行fixture生成パイプライン
  // 〈headless-sim→validateGameState〉に載る形で「不一致」を機械的に作る)。
  'newspaper-mvprace-legacy': {
    description: '新聞4面(年間MVPレース)の旧セーブ点火(P7-39): newspaper-mvpraceと同じ土台のセーブの保存済み5文字列を現行プールに存在しない文面へ差し替え、「旧プールで焼かれた完成文」を模擬する。ENでは_npMvpI18n(P7-39裁定B-3)が現行プールで作り直した文を表示してJA露出0・差し替え前文言の残存0になること、JAでは差し替えた保存値がそのまま1バイト不変で出ることを検査する',
    fixture: {
      seed: 42,
      until: G => G.season === 1 && G.week === 3 && !G.offSeason,
      engineer: G => {
        const race = G.mvpRace;
        if (!race || !Array.isArray(race.rankings)) return G;
        const MARK = '旧プール文言(P7-39点火fixture・現行プールには存在しない)';
        const rankings = race.rankings.map((r, i) => (
          i < 3
            ? { ...r, narrative: `${MARK}・寸評#${i}` }
            : { ...r, tagline: `${MARK}・タグライン#${i}` }
        ));
        return {
          ...G,
          mvpRace: {
            ...race,
            rankings,
            pageHeadline: `${MARK}・見出し`,
            pageLead: `${MARK}・リード`,
            kurodaComment: `${MARK}・黒田寸評`,
          },
        };
      },
      assert: G => {
        const fails = [];
        const race = G.mvpRace;
        const rankings = (race && race.rankings) || [];
        if (rankings.length < 4) fails.push(`mvpRace.rankings が${rankings.length}件(4件以上必要 — 4位以下の一覧行を検査するため)`);
        if (!G.weeklyNewspaper || G.weeklyNewspaper.layout !== 'v3') fails.push('weeklyNewspaper.layout が v3 でない(旧レイアウトは4面リンクを持たない)');
        // 差し替えた5文字列が「現行プールの再生成結果と偶然一致していない」ことを機械確認する。
        // 一致してしまうと _npMvpI18n のフォールバック条件(regen()!==saved)を踏めず、
        // 旧セーブを模擬できていないfixtureになる
        const mismatch = (label, saved, regenerated) => {
          if (saved === regenerated) fails.push(`${label}: 差し替え文が現行プールの再生成結果と一致してしまった(旧セーブを模擬できていない) — MARK文言を変えること`);
        };
        if (race) {
          mismatch('pageHeadline', race.pageHeadline, Engine.mvpRace.generatePageHeadline(race.rankings, G));
          mismatch('pageLead', race.pageLead, Engine.mvpRace.generatePageLead(race.rankings, G));
          mismatch('kurodaComment', race.kurodaComment, Engine.mvpRace.generateKurodaComment(race.rankings, G));
          rankings.slice(0, 3).forEach((r, i) => mismatch(`rankings[${i}].narrative`, r.narrative, Engine.mvpRace.generateNarrative(r, G)));
          rankings.slice(3).forEach((r, i) => mismatch(`rankings[${i + 3}].tagline`, r.tagline, Engine.mvpRace.generateTagline(r, G)));
        }
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 5 },
    until: s => !!(s.state),
    ignition: [
      { name: 'newspaper-screen', required: true, match: s => s.activeScreen === 'screen-newspaper' },
    ],
    tour: {
      steps: [
        {
          label: '新聞を開く',
          selector: `.nav-btn[onclick^="showScreen('newspaper'"]`,
          expectScreen: 'screen-newspaper',
          probe: MVP_INSTRUMENT_PROBE,
        },
        {
          label: '4面 MVPレース詳細',
          selector: `[onclick*="setNewspaperSubPage(4)"]`,
          expectScreen: 'screen-newspaper',
          probe: MVPRACE_PROBE,
        },
      ],
    },
    tourAssert: (probes, lang) => {
      const fails = [];
      const instrument = probes['新聞を開く'];
      if (!instrument || instrument.probeError) fails.push(`計測フックの設置に失敗: ${instrument && instrument.probeError}`);
      else if (instrument.patched === false) fails.push(`_npMvpI18n の計測フックを仕込めなかった: ${instrument.reason}`);
      const p = probes['4面 MVPレース詳細'];
      if (!p || p.probeError) { fails.push(`4面: probe失敗 ${p && p.probeError}`); return fails; }
      if (!p.present) { fails.push('4面: .np-mvprace-list が描画されていない(不発)'); return fails; }
      if (!p.headline) fails.push('4面: 見出し(.np-page-headline)が空');
      if (!p.lead) fails.push('4面: リード(.np-page-lead)が空');
      if (!p.kuroda) fails.push('4面: 黒田寸評(.np-kuroda-text)が空');
      if (!p.rank1Name) fails.push('4面: 1位選手名(.np-mvprace-name)が空');
      if (!p.rank1Narrative) fails.push('4面: 1位の寸評(.np-mvprace-narrative)が空');
      if (lang === 'en') {
        // ENでは「旧プール文言(P7-39点火fixture」という差し替え前のマーカーが1文字も
        // 残ってはいけない(=保存値を捨てて現行プールで作り直された証拠)
        const surfaces = [p.headline, p.lead, p.kuroda, p.rank1Narrative, ...(p.minorNarratives || []), ...(p.listFlavors || [])];
        if (surfaces.some(s => /旧プール文言/.test(s))) {
          fails.push('4面: ENなのに差し替え前の旧プール文言(fixtureのMARK)が残っている(表示時再生成が働いていない)');
        }
        if (p.jaLeaves && p.jaLeaves.length > 0) {
          const head = p.jaLeaves.slice(0, 10).map(x => `${x.selector}:"${x.text}"`).join(' / ');
          fails.push(`4面: ENなのに日本語が${p.jaLeaves.length}件残っている — ${head}`);
        }
      } else {
        // JA(既定)では保存値(=差し替えた旧文)がそのまま1バイト不変で出ること
        // (セーブは一切触っていないことの確認 — 言語をJAへ戻せば旧文のまま、が裁定の骨子)
        if (!/旧プール文言/.test(p.headline)) fails.push('4面: JAなのに差し替えた保存値(見出し)が表示されていない');
        if (!/旧プール文言/.test(p.lead)) fails.push('4面: JAなのに差し替えた保存値(リード)が表示されていない');
        if (!/旧プール文言/.test(p.kuroda)) fails.push('4面: JAなのに差し替えた保存値(黒田寸評)が表示されていない');
        if (!/旧プール文言/.test(p.rank1Narrative)) fails.push('4面: JAなのに差し替えた保存値(1位寸評)が表示されていない');
      }
      return fails;
    },
    // window.__mvpFallback は MVP_INSTRUMENT_PROBE が仕込んだ計測器。このfixtureは
    // 保存値を意図的に現行プールと不一致にしてあるので、newspaper-mvpraceとは逆に
    // フォールバック(regen-mismatch)が1件以上発生することを期待する
    finalProbe: `(() => ({
      mvpFallback: (typeof window !== 'undefined' && window.__mvpFallback) ? window.__mvpFallback : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.mvpFallback == null) {
        fails.push('計測器(window.__mvpFallback)が見つからない — MVP_INSTRUMENT_PROBEが刺さっていない');
      } else if (probe.mvpFallback.length === 0) {
        fails.push('_npMvpI18n のフォールバック(regen-mismatch)が0件(差し替えた旧文が現行プールと一致してしまっている=fixtureが機能していない)');
      }
      return fails;
    },
  },

  tenchosen: {
    description: '天頂戦の通年点火: S4W41開始→W42ミニイベント→W43エントリー→W48開催(15試合)→優勝演出→初代統一王座戴冠→季末→S5W1',
    fixture: {
      seed: 42,
      until: G => G.season === 4 && G.week === 41 && !G.offSeason,
      engineer: null,
      assert: G => {
        const fails = [];
        if (!G.ppvUnlocked) fails.push('ppvUnlocked=false — 天頂戦がTV観戦モードになり点火対象の画面を通らない。別シードで生成し直すこと');
        if (G.season % 4 !== 0) fails.push(`season=${G.season} は天頂戦開催年(4の倍数)ではない`);
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 900 },
    ignition: [
      // 試合結果モーダル(.emr-layer.is-tenchosen)。走破ドライバは「全試合スキップ」を
      // 優先するため通常は出ない=optional(観戦経路を通ったときだけ光る)
      { name: 'tenchosen-match-result', required: false, match: s => overlayHit(s, 'is-tenchosen') },
      // 初代統一王座の戴冠式(task-89)。優勝発表(.tcwn-wrap全画面タップ面)の直後にしか
      // 出ないため、これが点けば優勝発表→戴冠の本流を通った証明になる
      { name: 'unified-coronation', required: true, match: s => overlayHit(s, 'unified-coronation-overlay') },
    ],
    // 注意: G.ppvTournament はシーズン跨ぎで整理されるため、走破終了時点(S5W1)の
    // 恒久的な証跡は統一王座(初代=天頂戦優勝者に授与)で見る
    finalProbe: `(() => ({
      season: (typeof G !== 'undefined' && G) ? G.season : null,
      unifiedChampionId: (typeof G !== 'undefined' && G.unifiedTitle) ? G.unifiedTitle.championId : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.unifiedChampionId == null) fails.push('統一王座(unifiedTitle.championId)が戴冠されていない=天頂戦が完走していない');
      return fails;
    },
  },

  'away-challenge': {
    description: '果たし状(自団体発・CH-1直訴)の通し点火: 直訴モーダル(同行2名選択)→YES→sendoff→遠征予約→バス移動→敵地興行(task-95リスタイル)→2拍リザルト(B1/B2)',
    fixture: {
      seed: 42,
      until: G => G.season === 2 && G.week === 6 && !G.offSeason,
      engineer: G => _engineerChallengePending(G, false),
      assert: _assertChallengePending,
    },
    walk: { seasons: 1, maxSteps: 160 },
    until: s => !!(s.state && !s.state.offSeason && (s.state.season > 2 || s.state.week >= 9)),
    // 直訴モーダルは同行2名を選ぶまでYESが無効。未選択の同行候補を最優先し、
    // NOは(このモーダル内に限り)封じる — 点火が目的のため
    boost: (candidate, all) => {
      const isParty = /crq-party-cand/.test(candidate.className);
      const isSelected = /(?:^| )sel(?: |$)/.test(candidate.className);
      const selectedCount = all.filter(c => /crq-party-cand/.test(c.className) && /(?:^| )sel(?: |$)/.test(c.className)).length;
      if (isParty) {
        if (isSelected) return -Infinity;
        return selectedCount < 2 ? 9985 : -Infinity;
      }
      if (candidate.dataChoice === 'NO' && all.some(c => /crq-party-cand/.test(c.className))) return -Infinity;
      return null;
    },
    ignition: [
      { name: 'petition-modal', required: true, match: s => overlayHit(s, 'challengeRequestOverlay') },
      { name: 'away-travel', required: true, match: s => overlayHit(s, 'travelSceneOverlay') },
      { name: 'away-result-two-beat', required: true, match: s => overlayHit(s, 'challengeRequestResultOverlay') },
    ],
    finalProbe: `(() => ({
      used: (typeof G !== 'undefined' && G._awayChallengeUsedIds) ? G._awayChallengeUsedIds : null,
      bookingLeft: !!(typeof G !== 'undefined' && G._pendingAwayChallengeMatch),
      accepted: (typeof G !== 'undefined' && G.challengeRequest) ? (G.challengeRequest.acceptedThisSeason || 0) : 0,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.accepted < 1) fails.push('直訴が受理されていない(acceptedThisSeason=0)');
      if (!probe || !probe.used) fails.push('遠征が消化されていない(_awayChallengeUsedIds なし)');
      if (probe && probe.bookingLeft) fails.push('遠征予約が残留している(消化に失敗)');
      return fails;
    },
  },

  'incoming-challenge': {
    description: '果たし状(相手発・task-87迎撃画面)の通し点火: 黒Stage果たし状→受けて立つ→迎撃予約→次の自団体興行で3試合シリーズ消化',
    fixture: {
      seed: 42,
      until: G => G.season === 2 && G.week === 6 && !G.offSeason,
      engineer: G => _engineerChallengePending(G, true),
      assert: _assertChallengePending,
    },
    walk: { seasons: 1, maxSteps: 160 },
    until: s => !!(s.state && !s.state.offSeason && (s.state.season > 2 || s.state.week >= 9)),
    ignition: [
      // 果たし状の到着画面(task-87の黒Stage)。id無しで .hostile-arrival-overlay クラスのみ
      { name: 'incoming-gauntlet', required: true, match: s => overlayHit(s, 'hostile-arrival-overlay') },
      // シリーズ決着の結果画面(task-95の2拍・inverse変種)
      { name: 'incoming-result-two-beat', required: true, match: s => overlayHit(s, 'challengeRequestResultOverlay') },
    ],
    finalProbe: `(() => ({
      bookingLeft: !!(typeof G !== 'undefined' && G._pendingIncomingChallengeMatch),
      accepted: (typeof G !== 'undefined' && G.challengeRequest) ? (G.challengeRequest.acceptedThisSeason || 0) : 0,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.accepted < 1) fails.push('果たし状が受理されていない(acceptedThisSeason=0)');
      if (probe && probe.bookingLeft) fails.push('迎撃予約が残留している(シリーズが消化されていない)');
      return fails;
    },
  },

  'unified-player-turn': {
    description: '統一王座「こちらの番」の点火: AI王者3周期→playerTurn通知→挑戦者選出→統一王座遠征→王座戦(奪取なら戴冠式)',
    fixture: {
      seed: 42,
      until: G => G.season === 5 && G.week === 2 && !G.offSeason,
      engineer: _engineerUnifiedPlayerTurn,
      assert: G => {
        const fails = [];
        if (!G.unifiedTitle || G.unifiedTitle.aiHolderCycles !== 3) fails.push('aiHolderCycles=3 が置けていない');
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 300 },
    // 週次モーダル枠は大型/派閥/直訴と早い者勝ちで、混雑週はplayerTurnが翌週へ回る。
    // 通知は失効(四半期末)まで再提示されるため、観測窓は広めに取る
    until: s => !!(s.state && !s.state.offSeason && (s.state.season > 5 || s.state.week >= 10)),
    // 「見送る」系で挑戦権を捨てさせない
    boost: candidate => (/見送る|見送り|辞退|保留|今回は挑まない/.test(candidate.text) ? -Infinity : null),
    ignition: [
      // 挑戦者選出(task-89の「こちらの番」)。unified-challenge系クラス
      { name: 'player-turn-office', required: true, match: s => overlayHit(s, 'unified') || (s.overlays || []).some(o => /unified/.test(String(o))) },
      // 統一王座遠征の移動演出
      { name: 'unified-away-travel', required: true, match: s => overlayHit(s, 'travelSceneOverlay') },
    ],
    finalProbe: `(() => ({
      playerTurnLeft: !!(typeof G !== 'undefined' && G._pendingUnifiedPlayerTurn),
      awayLeft: !!(typeof G !== 'undefined' && G._pendingUnifiedAwayMatch),
      offered: !!(typeof G !== 'undefined' && G.unifiedTitle && (G.unifiedTitle.history || []).some(e => e && e.type === 'playerTurnOffered')),
      historyTail: (typeof G !== 'undefined' && G.unifiedTitle) ? (G.unifiedTitle.history || []).slice(-3).map(e => e && e.type) : [],
      holderOrg: (typeof G !== 'undefined' && G.unifiedTitle) ? G.unifiedTitle.orgId : null,
      blockers: (typeof G !== 'undefined') ? {
        cr: !!(G.challengeRequest && G.challengeRequest.pendingThisWeek),
        large: !!G._pendingLargeEvent,
        faction: !!G._pendingFactionEvent,
        notification: (G._pendingUnifiedNotification && G._pendingUnifiedNotification.type) || null,
      } : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || !probe.offered) fails.push('playerTurnOffered が履歴に無い(こちらの番が発行されていない)');
      if (probe && probe.playerTurnLeft) fails.push('_pendingUnifiedPlayerTurn が残留(挑戦者を送っていない)');
      if (probe && probe.awayLeft) fails.push('_pendingUnifiedAwayMatch が残留(遠征が消化されていない)');
      return fails;
    },
  },

  'faction-ignite': {
    description: '派閥開戦(F02_IGNITE・task-86セレモニー)の点火: 発火予約+リーダー対決入り予約カード→興行開催→開戦セレモニー→結果→hostility反映',
    fixture: {
      seed: 42,
      until: G => G.season === 2 && G.week === 6 && !G.offSeason,
      engineer: _engineerFactionIgnite,
      assert: G => {
        const fails = [];
        if (!G.factionPendingIgnite) fails.push('factionPendingIgnite が置けていない');
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 120 },
    makeBoost: _makeFactionIgniteBoost,
    // 開戦モーダルは興行後のポップアップキュー経由で翌週頭に出ることがあるため、W9まで見る
    until: s => !!(s.state && !s.state.offSeason && (s.state.season > 2 || s.state.week >= 9)),
    ignition: [
      // 開戦セレモニー(task-86)。overlayはid=fevtF02IOverlayで載る
      { name: 'ignite-ceremony', required: true, match: s => overlayHit(s, 'fevtF02I') },
    ],
    // 注意: factionTimelineは生成セーブに存在しないことがあり(applyF02IgniteResultは
    // Array.isArrayガード付きで黙ってスキップ)、適用の証跡は発火予約の消費で見る
    finalProbe: `(() => ({
      pendingLeft: !!(typeof G !== 'undefined' && G.factionPendingIgnite),
      maxHostility: (typeof G !== 'undefined' && G.factionHostility)
        ? Math.max(0, ...Object.values(G.factionHostility).map(Number).filter(Number.isFinite)) : 0,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (probe && probe.pendingLeft) fails.push('factionPendingIgnite が残留している(発火予約が消費されていない)');
      if (!probe || probe.maxHostility < 60) fails.push(`hostilityが開戦後の水準に達していない(max=${probe && probe.maxHostility})`);
      return fails;
    },
  },

  'war-decline': {
    description: '対抗戦・挑戦状(死蔵セリフ配線P7-41)の点火: 挑戦状モーダルで辞退を選び、相手エースの反応の一幕(WAR_DECLINE_DIALOGUE)→決断トレイ非表示→TAPで閉じてskipEvent',
    fixture: {
      seed: 42,
      until: G => G.season === 2 && G.week === 6 && !G.offSeason,
      engineer: _engineerWarChallengePending,
      assert: G => {
        const fails = [];
        if (!G.pendingEvent || G.pendingEvent.type !== 'war') fails.push('pendingEvent(war)が置けていない');
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 40 },
    until: s => !!(s.state && (s.state.season > 2 || s.state.week >= 7)),
    // 挑戦状モーダルでは常に「辞退」を選ばせる(死蔵セリフの表示点を点けるのが目的)。
    // 反応の一幕は決断トレイを持たない(data-war-choiceが無い)ため、以降は通常スコアへ委ねる
    // ("TAP TO CONTINUE"の文字列一致=score10000で.mdl-a-war-decline-surfaceが最優先になる)
    boost: candidate => {
      if (candidate.dataChoice === 'decline') return 9990;
      if (candidate.dataChoice === 'accept') return -Infinity;
      return null;
    },
    ignition: [
      { name: 'war-decline-reaction', required: true, match: s => overlayHit(s, 'mdl-a-war-decline-surface') },
    ],
    finalProbe: `(() => ({
      pendingEventLeft: !!(typeof G !== 'undefined' && G.pendingEvent && G.pendingEvent.type === 'war'),
      declinedCount: (typeof G !== 'undefined' && Array.isArray(G.gameLog))
        ? G.gameLog.filter(e => e && e.type === 'war_challenge_declined').length : -1,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe) { fails.push('finalProbeが取得できない'); return fails; }
      if (probe.pendingEventLeft) fails.push('pendingEvent(war)が残留している(辞退が消化されていない)');
      if (probe.declinedCount !== 1) fails.push(`war_challenge_declined の記録件数が1件ではない(実測${probe.declinedCount}件=二重起動または未発火の疑い)`);
      return fails;
    },
  },

  gameover: {
    description: 'ゲームオーバー点火: 資金-1600でS1中盤から開始→危機突入バナー→即死判定→解散セレモニー→GAME OVER画面',
    fixture: {
      seed: 42,
      until: G => G.season === 1 && G.week === 5 && !G.offSeason,
      // 実プレイでも興行赤字等でtick前に資金が負になる状態は起こりうる。
      // -1600は「次のtickで危機突入→その次のtickで即死(-1500以下)」の2週コース
      engineer: G => ({ ...G, funds: -1600 }),
      assert: G => {
        const fails = [];
        if (G.funds > -1500) fails.push(`funds=${G.funds} では即死ライン(-1500)に届かない`);
        if (G.crisisActive) fails.push('crisisActive が既に立っている(突入バナーの点火を兼ねるため未突入で始めたい)');
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 80 },
    // 正経路: gameover→解散セレモニー(awardsOverlay流用の5スライド)→タイトル画面。
    // #gameoverOverlay は表彰式DOM欠落時のフォールバック専用(ui-common.js 15981)で正経路では出ない
    until: s => s.activeScreen === 'titleScreen' && s.state && s.state.weekPhase === 'gameover',
    ignition: [
      // 解散セレモニー(showGameOverCeremony)。年末表彰と同じawardsOverlayを使うため
      // weekPhase=gameover との合わせ技で判定する
      { name: 'gameover-ceremony', required: true, match: s => overlayHit(s, 'awardsOverlay') && s.state && s.state.weekPhase === 'gameover' },
      // セレモニー後にタイトルへ帰着する(進行が死んでいない)
      { name: 'gameover-back-to-title', required: true, match: s => s.activeScreen === 'titleScreen' && s.state && s.state.weekPhase === 'gameover' },
    ],
    finalProbe: `(() => ({
      weekPhase: (typeof G !== 'undefined' && G) ? G.weekPhase : null,
      reason: (typeof G !== 'undefined' && G) ? (G.gameOverReason || null) : null,
    }))()`,
    finalAssert: probe => {
      const fails = [];
      if (!probe || probe.weekPhase !== 'gameover') fails.push(`weekPhase=${probe && probe.weekPhase} — gameoverに到達していない`);
      return fails;
    },
  },
};
