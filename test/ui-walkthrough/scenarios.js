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
//   fixture.engineerSave(save) — toSaveState の後のセーブの加工(省略可)。toSaveState が落とす一時キー
//                       (_pendingFactionEvent / _pendingLargeEvent)を置き直す(_moveIgniteTransients)。
//                       失敗文字列の配列を返す
//   walk              — 実UI走破の設定。seasonsは既定終了条件(開始季+seasonsの第1週)で使う
//   until(snapshot)   — 既定終了条件を差し替える場合のみ(snapshotはdetectors.summarizeSnapshotの形)
//   makeUntil(fixture) — until を fixture の実データ(開始週など)から作る場合(untilより優先)。
//                       停止週を探索で決めるシナリオ用(_untilWeeksAfterFixture)
//   boost / makeBoost(fixture) — 走破の候補スコアの差し替え(makeBoostはfixtureの実データ依存版)
//   ignition[]        — 点火マーカー。required:trueが1つでも未観測ならIGNITION_MISFIRE
//   tour              — 走破後の画面ツアー(P6-18)。`{ steps:[{label,selector,expectScreen?,probe?,required?}],
//                       jaExposureScreens?:[画面id] }`。ランダム走がナビタブを踏まない設計のため
//                       到達できない「自由閲覧画面の奥」を決定論クリック列で開く。
//                       jaExposureScreens は **ENモードのときだけ** その画面のJA露出0を失敗条件にする
//   tourAssert(probes, lang) — tourの各stopのprobe結果を検査。失敗文字列の配列を返す(=不発検出)
//   finalProbe        — 走破終了後にページで1回evaluateする式(文字列)。Gの事後状態検証用
//   finalAssert(probe, lang, stepProbes, fixture) — finalProbeの結果を検査。失敗文字列の配列を返す
//   stepProbe         — 手ごとに1回 evaluate する式(読取り専用)。結果は finalAssert の stepProbes
//                       ({ step, action, value } の配列。step 0 = 最初の手の前)。清算の前後の検算に使う
//   hold              — { when(snapshot), ms, maxSteps, frameClick?, frameReady? }。when が真の間は
//                       クリックせず時計を進める(観戦 iframe の再生待ち。WATCH_HOLD)
//   knownConsole      — 報告済みの既知の不具合の警告(正規表現の配列)。D1 にせず件数だけレポートに出す

const { toSaveState } = require('./fixtures/headless-sim');

const overlayHit = (snapshot, token) =>
  (snapshot.overlays || []).some(entry => String(entry).includes(token));

// 走破の終了条件を「fixtureの開始週から n 週後の週頭」にする(makeUntil)。fixtureの停止週を
// 探索で決めるシナリオ(incoming-challenge / faction-ignite)は開始週が固定でないため、
// 終了条件を絶対週で書けない
const _untilWeeksAfterFixture = n => fixture => s => !!(s.state && (
  s.state.season > fixture.season
  || (s.state.season === fixture.season && !s.state.offSeason && s.state.week >= fixture.week + n)));

// ── R3共通: 挑戦系の前提状態づくり ──
// engineer はfixture生成プロセス(headless-simがEngine等をグローバルへロード済み)で走る。
// 実在のクロス団体ペアを熱の高い順に試し(_pickChallenge)、rivalryだけ92へ底上げ(computeHeatはrivalry92なら
// bondに関係なく90超え)してから、processWeeklyが作るのと同じ形のpendingThisWeekを直接置く。
// 候補の順は熱の高い順(同じ熱は走査順=以前の「最も熱い1組」の先着と同じ)
function _crossOrgPairsByHeat(G) {
  const players = (G.roster || []).filter(f => !f.isRental && !f.injury && !f.forcedRest);
  const pairs = [];
  for (const self of players) {
    for (const [orgId, org] of Object.entries(G.aiOrgs || {})) {
      if (!org || org.disbanded || !Array.isArray(org.roster)) continue;
      for (const other of org.roster) {
        if (!other || other.id == null || other.injury) continue;
        const key = Engine.relationships._key(self.id, other.id);
        const rel = (G.relationships || {})[key];
        if (!rel) continue;
        const heat = Engine.challengeRequest.computeHeat(rel.rivalry, rel.bond);
        pairs.push({ self, other, orgId, key, rel, heat, order: pairs.length });
      }
    }
  }
  return pairs.sort((a, b) => (b.heat - a.heat) || (a.order - b.order));
}

function _placeChallengePending(G, pair, inverse) {
  let s = G;
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

// ── R3a/R3b: 直訴(自団体発)・果たし状(相手発)の停止週と組の選び方 ──
// fixture は週の頭で止まるので、置いた直訴・果たし状が実UIに出るのは最初の週送りの後になる。
// 週送りの間には他団体の試合・練習があり、そこで他団体の側の選手が怪我をすると、受けた後の
// 最初の通常興行で予約が「出場メンバーが揃わない」で解除され(遠征は黙って取り消され自団体の興行へ)、
// 3試合シリーズも2拍の結果画面も来ない(2026-09-26 seed42: S2W6 に置いた組の他団体の選手(根岸)が
// W6 の他団体の試合で中傷→W7 に受けて W8 に解除。away-challenge・incoming-challenge とも)。
// そこで停止週を「非興行週で、翌週が通常興行」に取り、その週の処理(実UIの週を処理と同じ
// tickWeek→advanceWeek)を試走して、
//   ・週次のモーダル枠を大型イベント/派閥イベントに取られず、翌週の頭に直訴・果たし状が出る
//   ・受ければ翌週の興行で6人とも出られる(=予約がその週の遠征・興行で消化される)
// 組だけを使う。試走の状態は捨てる(fixture に書くのは停止週の状態+直訴・果たし状だけ)
const INCOMING_PAIR_TRIES = 20;
const _crHealthy = f => !!(f && !f.injury && !f.forcedRest && !f.suspended);

// 停止週: S2 の W6 以降で「非興行週・翌週が通常興行」。最初の操作が「週を処理」になり、
// その週の週送りの直後に出る決断画面(果たし状・挑戦状・派閥イベント)を翌週の興行で清算する形
function _isPlainStopWeek(G) {
  if (G.offSeason || G.season !== 2) return false;
  return G.week >= 6
    && !Engine.util.isShowWeek(G.week)
    && Engine.util.isRegularShowWeek(G.week + 1);
}

// 停止週の週送り(実UIの「週を処理」と同じ tickWeek→advanceWeek)を試走する。transients は
// セーブに置き直す一時キー(engineerSave で置くのと同じもの)。試走の状態は捨てる
function _dryRunWeek(s, transients) {
  const opts = { lang: 'ja', dict: (typeof WM_I18N !== 'undefined' && WM_I18N.t) ? WM_I18N.t : undefined };
  const save = Object.assign(toSaveState(s, 'dry-run'), transients || {});
  const tick = Engine.tickWeek(save, opts).state;
  const next = Engine.advanceWeek(tick, opts).state;
  return { tick, next };
}

// 試走の翌週が「普通の通常興行の週」か。対抗戦の申し入れ(advanceWeek が W10/22/34 に weekPhase 'event'
// で立てる)が入ると、決断画面の枠がそちらに取られて派閥イベント等が次の週へ回る(2026-09-26 に F08 で実測)
function _nextWeekBlocker(next) {
  if (next.offSeason || !Engine.challengeRequest.isEligibleHomeShow(next)) return '翌週が通常興行ではない';
  if (next.weekPhase !== 'manage' || next.pendingEvent) return `翌週の頭に別の決断が入る(weekPhase=${next.weekPhase}${next.pendingEvent ? ` pendingEvent=${next.pendingEvent.type}` : ''})`;
  return null;
}

// toSaveState は一時キー(_pendingFactionEvent / _pendingLargeEvent)を落とすので、engineer は
// 置きたい一時キーをこの箱に入れて返し、engineerSave(_moveIgniteTransients)がセーブへ移す
const IGNITE_TRANSIENTS = '__igniteTransients';
function _moveIgniteTransients(save) {
  const transients = save[IGNITE_TRANSIENTS];
  delete save[IGNITE_TRANSIENTS];
  if (!transients) return [`${IGNITE_TRANSIENTS} が無い(engineer が一時キーを置いていない)`];
  Object.assign(save, transients);
  return [];
}

function _challengeDryRun(s) {
  const { tick, next } = _dryRunWeek(s);
  if (tick._pendingLargeEvent) return '大型イベントが週次のモーダル枠を取る';
  if (tick._pendingFactionEvent) return '派閥イベントが週次のモーダル枠を取る';
  const blocked = _nextWeekBlocker(next);
  if (blocked) return blocked;
  if (!next.challengeRequest || !next.challengeRequest.pendingThisWeek) return '直訴・果たし状が週送りで取り下げられた';
  const card = Engine.challengeRequest.buildMatchCard(next);
  if (!card) return '受けてもカードが組めない';
  if (![...card.teamA, ...card.teamB].every(_crHealthy)) return '発起人か相手が翌週の興行に出られない';
  return null;
}

// inverse=true: 果たし状(相手発) / false: 直訴(自団体発)
function _pickChallenge(G, inverse) {
  const s = Engine.challengeRequest.ensureInit(G);
  const reasons = [];
  for (const pair of _crossOrgPairsByHeat(s).slice(0, INCOMING_PAIR_TRIES)) {
    let placed;
    try { placed = _placeChallengePending(s, pair, inverse); } catch (error) { reasons.push(error.message); continue; }
    const reason = _challengeDryRun(placed);
    if (!reason) return { state: placed, reasons };
    reasons.push(`${pair.self.name}×${pair.other.name}: ${reason}`);
  }
  return { state: null, reasons };
}

// 停止週の探索つきの fixture(直訴・果たし状)
const _challengeFixture = inverse => ({
  seed: 42,
  // S2 の「非興行週で翌週が通常興行」の週のうち、試走で直訴・果たし状が翌週の興行まで生き残る
  // 組が見つかる最初の週(seed42 では W7)
  until: G => {
    if (G.season > 2) throw new Error('S2 のうちに直訴・果たし状を置ける週が見つからない(試走で全部の組が落ちた)。別シードで生成し直すこと');
    return _isPlainStopWeek(G) && !!_pickChallenge(G, inverse).state;
  },
  engineer: G => {
    const picked = _pickChallenge(G, inverse);
    if (!picked.state) throw new Error(`直訴・果たし状を置ける組が無い: ${picked.reasons.join(' / ')}`);
    return picked.state;
  },
  assert: G => {
    const fails = _assertChallengePending(G);
    const p = G.challengeRequest && G.challengeRequest.pendingThisWeek;
    if (p && !!p._inverse !== inverse) fails.push(`pendingThisWeek の向きが違う(_inverse=${!!p._inverse})`);
    if (Engine.util.isShowWeek(G.week)) fails.push(`停止週 W${G.week} が興行週(直訴・果たし状は週を処理した後に出る前提)`);
    return fails;
  },
});

// 観戦の走破: 興行は1試合ずつ進める。指定した番号の試合は「🎬 試合を観る」、ほかは「スキップ」(1試合)を押し、
// 観戦 iframe の再生が終わる(MATCH_RESULT → App.receiveBattleResult → _afterMatchSettle)まで hold で待つ。
// 「残り全試合をスキップ」と観戦の中断ボタンは押さない(全試合スキップは観戦を飛ばしてしまう)
const _watchMatchBoost = indexes => candidate => {
  const onclick = candidate.onclick || '';
  const watch = /App\.watchMatch\((\d+)\)/.exec(onclick);
  if (watch) return indexes.includes(Number(watch[1])) ? 9990 : -Infinity;
  const skip = /App\.skipMatch\((\d+)\)/.exec(onclick);
  if (skip) return indexes.includes(Number(skip[1])) ? -Infinity : 9985;
  if (/App\.(?:skipAllMatches|escapeBattle)\(\)/.test(onclick)) return -Infinity;
  return null;
};
// 観戦した試合の後の「敗者の心」(試合後のフレーバー。showPostMatchFlavorPopups)が出たことを数える。
// 1.8秒で閉じるので手の後の読取り(2.2秒後)では見えない。手ごとの読取りのついでに #mdlCCard を見張り、
// 中身に .post-match-flavor が入るたびに window.__wmFlavorSeen へ控える(画面の G には触らない)。
// 2026-09-26 以前は試合一覧の殻(showResultOverlay)の後ろに積まれて一度も出ず、保険のタイマーの警告
// ([WM] postMatchFlavor safety net fired)を既知扱いにしていた。いまは警告が出れば D1 で落ちる
// 試合前の「✨ 初対決」(.pre-match-flavor。2026-09-26 裁定「判定を直して出す」)も同じ見張りで window.__wmPreFlavorSeen へ控える
const WATCH_FLAVOR_OBSERVER = `(() => {
  if (window.__wmFlavorObserver) return;
  const card = document.getElementById('mdlCCard');
  if (!card || typeof MutationObserver !== 'function') return;
  window.__wmFlavorSeen = window.__wmFlavorSeen || [];
  window.__wmPreFlavorSeen = window.__wmPreFlavorSeen || [];
  window.__wmFlavorObserver = new MutationObserver(() => {
    [['.post-match-flavor', window.__wmFlavorSeen], ['.pre-match-flavor', window.__wmPreFlavorSeen]].forEach(([sel, list]) => {
      const body = card.querySelector(sel);
      if (!body || body.__wmSeen) return;
      body.__wmSeen = true;
      list.push((body.textContent || '').replace(/\\s+/g, ' ').trim());
    });
  });
  window.__wmFlavorObserver.observe(card, { childList: true });
})()`;
// 手ごとの読取り(probe)に見張りを足し、読んだ値に flavorSeen(出た敗者の心の文面)と preFlavorSeen(出た初対決の文面)を添える。
// probe が null なら null のまま
const _withFlavorObserver = probe => `(() => {
  ${WATCH_FLAVOR_OBSERVER};
  const value = ${probe};
  return value === null ? null : { ...value, flavorSeen: (window.__wmFlavorSeen || []).slice(), preFlavorSeen: (window.__wmPreFlavorSeen || []).slice() };
})()`;
function _assertFlavorSeen(steps) {
  const values = (steps || []).map(entry => entry.value).filter(v => v && !v.probeError && Array.isArray(v.flavorSeen));
  const seen = values.length ? values[values.length - 1].flavorSeen : [];
  const pre = values.length && Array.isArray(values[values.length - 1].preFlavorSeen) ? values[values.length - 1].preFlavorSeen : [];
  console.log(`敗者の心: ${seen.length}回 ${JSON.stringify(seen)} / 初対決: ${pre.length}枚 ${JSON.stringify(pre)}`);
  return seen.length > 0 ? [] : ['観戦した試合の後に「敗者の心」(.post-match-flavor)が一度も出ていない'];
}

// 観戦 iframe(シングル battle-engine.html)は1コマずつ「次の攻防」(#nBtn)で進み、決着のコマはフォール等の
// 「決めろ!」ボタン(#finishBtn.show)を押してカウントが進み、勝敗の演出の後の「試合終了」(#eBtn.visible)で
// 親へ MATCH_RESULT を送る。待ちの間はこの順に、見えていて押せるものを1つ押して進める(押すたびに1手)
const WATCH_HOLD = {
  when: s => (s.overlays || []).some(o => String(o).startsWith('battleOverlay')),
  ms: 10000,
  maxSteps: 60,
  frameClick: { url: /battle-engine\.html/, selectors: ['#eBtn.visible', '#finishBtn.show', '#nBtn'] },
  frameReady: { iframeSelector: '#battleIframe', onclick: /App\.watchMatch\(/ },
};

// ── 挑戦状(B3)→次の通常興行のメイン ──
// 大型イベントの抽選は稀(seed42 は S2〜S4 で B3 が1回・天頂戦の前の週)なので、停止週の頭に
// 「その週の週送りで挑戦状が立った」形を作る: エンジンの generateLargeEvent を B3 が出るまで
// 乱数を替えて呼び、processManage(management.js「大型イベント (B1〜B4): セリフ付きで格納」)と
// 同じ組み立てでセリフと文面を付けて _pendingLargeEvent に置く。試走で、その週の週送りが
// 挑戦状を上書きせず翌週が通常興行であることを確かめる
function _buildB3LargeEvent(G) {
  // generateLargeEvent の CD(大型4週・B3専用16週)だけ外した写しで作る(セーブ側の CD は触らない)
  const s = { ...G, lastLargeEventWeek: 0, lastB3ChallengeWeek: 0 };
  const roster = (s.roster || []).filter(f => !f.injury && !f.isRental);
  const dict = (typeof WM_I18N !== 'undefined' && WM_I18N.t) ? WM_I18N.t : undefined;
  for (let k = 0; k < 400; k += 1) {
    const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB3E1, k));
    const raw = Engine.eventSystem.generateLargeEvent(rng, s, roster);
    if (!raw || raw.type !== 'B3') continue;
    const dialogue = Engine.eventSystem.getLargeEventDialogue(rng, raw, s.roster);
    const vars = {
      name: raw.name || '', name1: raw.name1 || '', name2: raw.name2 || '',
      orgName: raw.orgName || '', outletName: raw.outletName || '',
      subType: raw.subType || '', activityType: raw.activityType || '',
    };
    const textData = Engine.eventSystem.pickText(rng, raw.type, vars, dict);
    return { ...raw, ...textData, dialogue, dialogue2: '' };
  }
  return null;
}

function _pickB3Challenge(G) {
  const event = _buildB3LargeEvent(G);
  if (!event) return { state: null, reason: 'generateLargeEvent が B3 を返さない(順位の隣の団体が無い等)' };
  const { tick, next } = _dryRunWeek(G, { _pendingLargeEvent: event });
  const kept = tick._pendingLargeEvent;
  if (!kept || kept.type !== 'B3' || !kept.challenger || kept.challenger.id !== event.challenger.id) {
    return { state: null, reason: 'その週の週送りで別の大型イベントが立ち、挑戦状が上書きされる' };
  }
  const blocked = _nextWeekBlocker(next);
  if (blocked) return { state: null, reason: blocked };
  if (!(next.roster || []).some(f => !f.isRental && _crHealthy(f))) return { state: null, reason: '翌週に出られる代表がいない' };
  return { state: { ...G, [IGNITE_TRANSIENTS]: { _pendingLargeEvent: event } }, reason: null };
}

// 挑戦状の試合で挑戦者(ゲスト)が怪我をすると所属団体の本物の選手の体調が NaN になっていた件は 2026-09-26 に修正
// (返却は Engine.challengeRequest.mergeReturningGuest で「興行で起きたこと」だけを本物へ反映する)。
// 以前はここで NaN の警告を既知扱いにしていた。いまは警告0で通り、下の stepProbe が本物の選手の値を検算する

// 挑戦状の決断画面: 受けて立つ(data-choice="0")を選び、断る(同じトレイの"1")は封じる
const _b3AcceptBoost = (candidate, all) => {
  const inB3Tray = /mdl-a-decision-card/.test(candidate.className)
    && all.some(c => c.dataChoice === '0' && /mdl-a-decision-card danger-accent/.test(c.className));
  if (!inB3Tray) return null;
  if (candidate.dataChoice === '0') return 9990;
  if (candidate.dataChoice === '1') return -Infinity;
  return null;
};

// 挑戦状の予約・清算を手ごとに読む。window.__wmIgniteB3 は読取りの控え(画面の G ではない)
const B3_STEP_PROBE = `(() => {
  if (typeof G === 'undefined' || !G) return null;
  const memo = window.__wmIgniteB3 = window.__wmIgniteB3 || {};
  const booking = G._pendingIncomingB3Match || null;
  if (booking) { memo.fighterId = booking.fighterId; memo.challengerId = booking.challenger && booking.challenger.id; memo.orgId = booking.orgId; }
  const rec = (memo.fighterId != null && memo.challengerId != null && Engine.h2h && Engine.h2h.getRecord)
    ? Engine.h2h.getRecord(G, memo.fighterId, memo.challengerId) : null;
  const sp = (typeof App !== 'undefined' && App._showPreview) || null;
  const main = sp && sp.validMatches && sp.validMatches[0];
  // 挑戦者の所属団体にいる本物の選手(返却で壊れていないか。2026-09-26 の修正の検算)
  const org = memo.orgId != null && G.aiOrgs ? G.aiOrgs[memo.orgId] : null;
  const real = org && memo.challengerId != null ? (org.roster || []).find(f => f.id === memo.challengerId) : null;
  const markers = ['isB3ChallengeGuest', '_b3GuestOrgId', 'isCRGuest', '_crGuestOrgId', 'isAwayChallengeGuest', 'isUnifiedTitleGuest', '_unifiedGuestOrgId'];
  // 興行中の挑戦者のゲスト(2026-09-26 裁定: 開催の時点の本物から作る = 体調・年齢を持ち、同じ時点の本物と同じ値)
  const guest = memo.challengerId != null ? (G.roster || []).find(f => f.id === memo.challengerId && f.isB3ChallengeGuest) : null;
  // 挑戦状の試合(メイン)が始まる前に、2人が初めて当たるか(「✨ 初対決」が出るべきか。app.js の判定と同じ記録を見る)
  if (sp && main && main._b3ChallengeMatch && Array.isArray(sp.results) && sp.results[0] === null && memo.firstMeet == null) {
    const pairIs = e => e && ((Number(e.leftId) === main.left && Number(e.rightId) === main.right) || (Number(e.leftId) === main.right && Number(e.rightId) === main.left));
    const h2hRec = Engine.h2h.getRecord(G, main.left, main.right);
    memo.firstMeet = !(G.matchupLog || []).some(pairIs) && !(h2hRec && h2hRec.matches > 0);
    const nameOf = id => ((G.roster || []).find(f => f.id === id) || {}).name || null;
    memo.pairNames = [nameOf(main.left), nameOf(main.right)];
  }
  return {
    season: G.season, week: G.week, phase: G.weekPhase, totalShows: G.totalShows,
    booked: !!booking, fighterId: memo.fighterId == null ? null : memo.fighterId,
    challengerId: memo.challengerId == null ? null : memo.challengerId,
    mainIsB3: !!(main && main._b3ChallengeMatch),
    challengerInRoster: memo.challengerId != null && (G.roster || []).some(f => f.id === memo.challengerId),
    h2hMatches: rec ? (rec.matches || 0) : 0,
    h2hLast: rec && rec.lastMatch ? [rec.lastMatch.season, rec.lastMatch.week] : null,
    lastB3ChallengeWeek: G.lastB3ChallengeWeek || 0,
    real: real ? {
      condition: typeof real.condition === 'number' ? (Number.isFinite(real.condition) ? real.condition : 'NaN') : String(real.condition),
      careerBestMQ: real.careerBestMQ == null ? null : real.careerBestMQ,
      injury: real.injury ? real.injury.type : null,
      recentMatches: (real.recentMatches || []).length,
      markers: markers.filter(k => k in real),
    } : null,
    guest: guest ? {
      condition: typeof guest.condition === 'number' && Number.isFinite(guest.condition) ? guest.condition : String(guest.condition),
      age: guest.age == null ? null : guest.age,
      sameAsReal: !!real && ['condition', 'age', 'pw', 'sp', 'te', 'st', 'mn', 'popularity', 'careerBestMQ'].every(k => guest[k] === real[k]),
    } : null,
    firstMeet: memo.firstMeet == null ? null : memo.firstMeet,
    pairNames: memo.pairNames || null,
  };
})()`;

function _assertB3Resolved(steps) {
  const fails = [];
  const values = steps.map(entry => entry.value).filter(Boolean);
  const booked = values.find(v => v.booked);
  if (!booked) { fails.push('挑戦状が予約されていない(_pendingIncomingB3Match が一度も立たない)'); return fails; }
  const showIdx = values.findIndex(v => v.mainIsB3);
  if (showIdx < 0) fails.push('次の興行のメインに挑戦状の試合が組まれていない');
  const before = values.find(v => v.booked);
  const last = values[values.length - 1];
  if (last.booked) fails.push('挑戦状の予約が残っている(興行で清算されていない)');
  if (last.challengerInRoster) fails.push('挑戦者(ゲスト)が自団体のロスターに残っている');
  console.log(`B3: 代表 ${last.fighterId} vs 挑戦者 ${last.challengerId} / 対戦成績 ${before.h2hMatches}→${last.h2hMatches}(最後 ${JSON.stringify(last.h2hLast)}) / lastB3ChallengeWeek ${last.lastB3ChallengeWeek} / ゲストの残り ${last.challengerInRoster}`);
  // 挑戦状の試合は isCRMatch なので共通の対戦成績(recordShowH2h)は飛ばし、hooks.afterWriteback が1回だけ記録する
  if (last.h2hMatches !== before.h2hMatches + 1) fails.push(`代表と挑戦者の対戦成績が1試合分増えていない(${before.h2hMatches}→${last.h2hMatches})`);
  if (!(last.lastB3ChallengeWeek > 0)) fails.push('lastB3ChallengeWeek が記録されていない');
  // 所属団体の本物の選手: 興行の前(予約中)と返却の後(2026-09-26 の修正)
  const realBefore = before.real;
  const realAfter = last.real;
  console.log(`B3 本物の選手: 体調 ${realBefore && realBefore.condition}→${realAfter && realAfter.condition} / 自己最高評価 ${realBefore && realBefore.careerBestMQ}→${realAfter && realAfter.careerBestMQ} / 怪我 ${realAfter && realAfter.injury} / 直近戦績 ${realBefore && realBefore.recentMatches}→${realAfter && realAfter.recentMatches} / 一時印 ${realAfter ? JSON.stringify(realAfter.markers) : '-'}`);
  if (!realAfter) fails.push('挑戦者が所属団体のロスターにいない');
  else {
    if (typeof realAfter.condition !== 'number') fails.push(`返却後の本物の体調が不正値(${realAfter.condition})`);
    if (realAfter.markers.length > 0) fails.push(`返却後の本物に一時印が残っている(${realAfter.markers.join(', ')})`);
    if (realBefore && realBefore.careerBestMQ != null && !(realAfter.careerBestMQ >= realBefore.careerBestMQ)) {
      fails.push(`返却で本物の自己最高評価が下がった(${realBefore.careerBestMQ}→${realAfter.careerBestMQ})`);
    }
    if (realBefore && realAfter.recentMatches < Math.min(5, realBefore.recentMatches + 1)) {
      fails.push(`返却で本物の直近戦績が減った(${realBefore.recentMatches}→${realAfter.recentMatches})`);
    }
  }
  // 興行中のゲスト(2026-09-26 裁定: 挑戦状が届いた時点の写しではなく、開催の時点の本物から作る)
  const guestSeen = values.find(v => v.guest);
  console.log(`B3 興行中のゲスト: ${guestSeen ? `体調 ${guestSeen.guest.condition} / 年齢 ${guestSeen.guest.age} / 同じ時点の本物と同じ ${guestSeen.guest.sameAsReal}` : '読めない'} / 返却後の怪我 ${realAfter && realAfter.injury}`);
  if (!guestSeen) fails.push('興行中の挑戦者のゲストが読めない');
  else {
    if (typeof guestSeen.guest.condition !== 'number' || typeof guestSeen.guest.age !== 'number') {
      fails.push(`ゲストが本物から作られていない(体調 ${guestSeen.guest.condition} / 年齢 ${guestSeen.guest.age})`);
    }
    if (!guestSeen.guest.sameAsReal) fails.push('ゲストの値が同じ時点の所属団体の本物と違う(届いた時点の写しのまま?)');
  }
  return fails;
}

// 挑戦状の試合(メイン)の前の「✨ 初対決」: 観戦を選んだとき、2人が初めて当たるなら2人とも出て、当たったことがあれば出ない。
// スキップ(全試合スキップ)では出ない(2026-09-26 裁定「判定を直して出す」。観戦した試合の前だけ=敗者の心と対)。
// 1.8秒で閉じるので手ごとの見張り(_withFlavorObserver)で数える
function _assertB3FirstMeet(steps, { watched = true } = {}) {
  const values = (steps || []).map(entry => entry.value).filter(v => v && !v.probeError);
  const judged = values.find(v => v.firstMeet != null);
  const last = values.filter(v => Array.isArray(v.preFlavorSeen)).pop();
  const seen = last ? last.preFlavorSeen : [];
  if (!judged) return ['挑戦状の試合の前に2人が初めて当たるかを読めていない'];
  const names = judged.pairNames || [];
  const ofPair = seen.filter(text => names.some(n => n && text.includes(n)));
  console.log(`初対決: 挑戦状の2人 ${JSON.stringify(names)} は ${judged.firstMeet ? '初めて当たる' : '当たったことがある'}・${watched ? '観戦' : 'スキップ'} / 2人の初対決 ${ofPair.length}枚 / 興行中の初対決 ${seen.length}枚 ${JSON.stringify(seen)}`);
  if (!watched) return seen.length > 0 ? ['観戦していない興行で「✨ 初対決」を出した(スキップは省略の意思表示)'] : [];
  if (judged.firstMeet && ofPair.length !== 2) return [`初めて当たる2人の「✨ 初対決」が ${ofPair.length} 枚(2枚のはず)`];
  if (!judged.firstMeet && ofPair.length > 0) return ['当たったことのある2人に「✨ 初対決」を出した'];
  return [];
}

// ── 派閥の予約(F07 メイン推薦 / Common-1 / F08 直接対決)──
// 派閥イベントは持ち越し中なら週送りでも新しい抽選をせずそのまま画面に出る(tickWeek の
// 「_pendingFactionEvent があれば何もしない」)。停止週の頭に、エンジンの判定関数が作った
// payload の _pendingFactionEvent を置き、試走で週送りが大型イベントに枠を取られないことを確かめる
const FACTION_KIND = {
  F07: {
    eventId: 'F07',
    // F07 はチーム・派閥ごとの CD と、incidentType の抽選がある。判定は CD を外した写しで行い
    // (セーブ側の CD は触らない)、DEMAND_MAIN が出るまで乱数を替える
    build(G) {
      const s = {
        ...G,
        _f07TeamCooldownUntil: 0,
        factions: (G.factions || []).map(f => ({ ...f, _f07RecentIncidents: [], _f07DemandQuietUntil: 0, _f07DemandMoneyQuietUntil: 0, _f07PostRebukeQuietUntil: 0 })),
      };
      for (let k = 0; k < 400; k += 1) {
        const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xF07D, k));
        const payload = Engine.factions.checkF07Conditions(s, rng);
        if (payload.eligible && payload.incidentType === 'DEMAND_MAIN') return { state: G, payload };
      }
      return { state: null, reason: 'F07 DEMAND_MAIN の候補派閥が無い(リーダーの信頼が60未満など)' };
    },
  },
  COMMON_1: {
    eventId: 'COMMON_1',
    // 派閥内の因縁(rivalry≥40)の2人が要る。無ければ派閥の先頭2人の因縁を60にする(セーブにも入れる)。
    // CD は写しで外す
    build(G) {
      let base = G;
      const hasPair = (G.factions || []).some(f => {
        const ids = (f.memberIds || []).filter(id => (G.roster || []).some(c => c.id === id));
        return ids.some((a, i) => ids.slice(i + 1).some(b => Math.max(
          ((G.relationships || {})[`${a}>${b}`] || {}).rivalry || 0,
          ((G.relationships || {})[`${b}>${a}`] || {}).rivalry || 0) >= 40));
      });
      if (!hasPair) {
        const fac = (G.factions || []).find(f => (f.memberIds || []).filter(id => (G.roster || []).some(c => c.id === id)).length >= 2);
        if (!fac) return { state: null, reason: '2人以上いる派閥が無い' };
        const [a, b] = fac.memberIds.filter(id => (G.roster || []).some(c => c.id === id));
        const rels = { ...(G.relationships || {}) };
        for (const key of [`${a}>${b}`, `${b}>${a}`]) {
          if (!rels[key]) return { state: null, reason: `関係値 ${key} が無い` };
          rels[key] = { ...rels[key], rivalry: Math.max(rels[key].rivalry || 0, 60) };
        }
        base = { ...G, relationships: rels };
      }
      const s = {
        ...base,
        _commonEventTeamCooldownUntil: 0,
        factions: (base.factions || []).map(f => ({ ...f, _commonEventLastWeek: 0, _commonEventCooldowns: {} })),
      };
      const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xC0B0));
      const payload = Engine.factions.checkCommon1Conditions(s, rng);
      if (!payload.eligible) return { state: null, reason: 'Common-1 の判定が通らない' };
      return { state: base, payload };
    },
  },
  F08: {
    eventId: 'F08',
    // F08 は抗争中(inHostility)の2派閥で片方向の対立度80以上。F02③(決着)は両方向60以上で
    // 必ず立ち、そのときは F08 の試合後の画面が出ない(決着の演出が優先)。直接対決の清算で
    // 敗れた側→勝った側の対立度が最大 +16(F08 の1.5倍×2)上がるので、逆方向は20に抑える
    // リーダーの怪我は停止週では問わない(試合は翌週。翌週に出られるかは試走で確かめる)
    build(G) {
      const pairs = (G.factions || [])
        .filter(f => f && f.leaderId != null && Array.isArray(f.memberIds))
        .map(f => ({ faction: f, leader: (G.roster || []).find(c => c.id === f.leaderId && !c.isRental) }))
        .filter(x => x.leader);
      if (pairs.length < 2) return { state: null, reason: 'リーダーのいる派閥が2つ無い' };
      const [A, B] = pairs;
      const host = (from, to) => Number(((G.factionHostility || {})[`${from}>${to}`]) || 0);
      let s = { ...G, factions: (G.factions || []).map(f => (f.id === A.faction.id || f.id === B.faction.id) ? { ...f, inHostility: true } : f) };
      s = Engine.factions.applyHostilityChange(s, A.faction.id, B.faction.id, 85 - host(A.faction.id, B.faction.id));
      if (host(B.faction.id, A.faction.id) > 20) {
        s = Engine.factions.applyHostilityChange(s, B.faction.id, A.faction.id, 20 - host(B.faction.id, A.faction.id));
      }
      const payload = Engine.factions.checkF08Conditions(s);
      if (!payload.eligible) return { state: null, reason: 'F08 の判定が通らない' };
      return { state: s, payload };
    },
  },
};

function _pickFactionBooking(G, kind) {
  const spec = FACTION_KIND[kind];
  const built = spec.build(G);
  if (!built.state) return { state: null, reason: built.reason };
  const pending = { eventId: spec.eventId, payload: built.payload };
  const { tick, next } = _dryRunWeek(built.state, { _pendingFactionEvent: pending });
  if (tick._pendingLargeEvent) return { state: null, reason: '大型イベントが週次のモーダル枠を取る(派閥イベントは翌週へ)' };
  if (!tick._pendingFactionEvent || tick._pendingFactionEvent.eventId !== spec.eventId) return { state: null, reason: '週送りで派閥イベントが消える' };
  const blocked = _nextWeekBlocker(next);
  if (blocked) return { state: null, reason: blocked };
  const ids = kind === 'COMMON_1' ? [built.payload.fighterAId, built.payload.fighterBId]
    : kind === 'F08' ? [built.payload.leaderAId, built.payload.leaderBId] : [];
  if (!ids.every(id => _crHealthy((next.roster || []).find(c => c.id === id)))) return { state: null, reason: '対決の2人が翌週の興行に出られない' };
  return { state: { ...built.state, [IGNITE_TRANSIENTS]: { _pendingFactionEvent: pending } }, reason: null };
}

// 派閥の予約の清算を手ごとに読む。信頼・帳簿の「派閥」・感度は全員分(12人)、ほかは予約の中身
const FACTION_STEP_PROBE = `(() => {
  if (typeof G === 'undefined' || !G) return null;
  const sp = (typeof App !== 'undefined' && App._showPreview) || null;
  const main = sp && sp.validMatches && sp.validMatches[0];
  const mainIds = !main ? [] : (main.matchType === 'tag'
    ? [main.teamA && main.teamA.fighter1, main.teamA && main.teamA.fighter2, main.teamB && main.teamB.fighter1, main.teamB && main.teamB.fighter2].filter(Boolean)
    : [main.left, main.right].filter(Boolean));
  const trust = {};
  for (const c of (G.roster || [])) {
    const t = c.trust != null ? c.trust : 50;
    trust[c.id] = [t, (c.trustStrain && c.trustStrain.faction) || 0, Engine.trust.trustSensitivity(t), Engine.util.ov(c)];
  }
  const r0 = (G.lastShowResults || [])[0] || null;
  const mainWinner = r0 && r0.left && r0.right ? (r0.winner === 'left' ? r0.left.id : (r0.winner === 'right' ? r0.right.id : null)) : null;
  const rel = (a, b) => { const r = (G.relationships || {})[a + '>' + b]; return r ? r.rivalry : null; };
  const pend = G._pendingFactionEvent || null;
  // 予約が消えた後も同じ2人の因縁を読めるよう、読取りの控えを window に置く(画面の G ではない)
  const memo = window.__wmIgniteFaction = window.__wmIgniteFaction || {};
  if (G.bookedCommon1) memo.c1 = [G.bookedCommon1.fighterAId, G.bookedCommon1.fighterBId];
  if (G._pendingF08Directive) memo.f08 = [G._pendingF08Directive.leaderAId, G._pendingF08Directive.leaderBId];
  return {
    season: G.season, week: G.week, phase: G.weekPhase, totalShows: G.totalShows,
    pendingEvent: pend ? pend.eventId : null,
    f07: G._pendingF07Directive || null,
    f08: G._pendingF08Directive || null,
    c1: G.bookedCommon1 ? [G.bookedCommon1.fighterAId, G.bookedCommon1.fighterBId] : null,
    mainIds,
    mainWinner,
    c1Rivalry: memo.c1 ? [rel(memo.c1[0], memo.c1[1]), rel(memo.c1[1], memo.c1[0])] : null,
    f08Rivalry: memo.f08 ? [rel(memo.f08[0], memo.f08[1]), rel(memo.f08[1], memo.f08[0])] : null,
    shown: {
      c1Result: !!document.getElementById('c1rCloseBtn'),
      f08Post: !!document.getElementById('fevtF08PostOverlay'),
    },
    factions: (G.factions || []).map(f => ({ id: f.id, leaderId: f.leaderId, memberIds: f.memberIds, momentum: f.momentum })),
    hostility: G.factionHostility || {},
    trust,
  };
})()`;

// 興行の清算の前後: 同じ週のうちに totalShows が増えた最初の手が清算(Engine.show.beginShow/finalize)を
// 含む手、その直前の手が清算前。清算の間に信頼を動かすのは派閥の予約と引退・退団の影響だけ。
// 同じ週に限るのは、最初の読取り(タイトル画面・セーブの読み込み前の G)を清算と取り違えないため
function _findFinalizeWindow(steps) {
  const values = steps.map(entry => entry.value);
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1];
    const cur = values[i];
    if (!prev || !cur || prev.probeError || cur.probeError) continue;
    if (prev.season !== cur.season || prev.week !== cur.week) continue;
    if (Number.isFinite(prev.totalShows) && cur.totalShows > prev.totalShows) return { pre: prev, post: cur, index: i };
  }
  return null;
}

const _near = (a, b) => Math.abs(a - b) < 1e-6;
const _clampTrust = v => Math.max(0, Math.min(100, v));
const _fmt = v => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);

// 清算の窓(pre/post)で、派閥の関数 _applyTrustToMembers が1回だけ動かした形を確かめる:
// 信頼 = clamp(前 + rawDelta × 感度(前))、帳簿の「派閥」は減った分だけ増える
function _checkTrustApplied(fails, pre, post, id, rawDelta, label) {
  const [t0, s0, sens] = pre.trust[id] || [];
  const [t1, s1] = post.trust[id] || [];
  if (t0 == null || t1 == null) { fails.push(`${label}(${id})の信頼が読めない`); return; }
  const want = _clampTrust(t0 + rawDelta * sens);
  const wantStrain = s0 + Math.max(0, t0 - want);
  console.log(`  ${label}(${id}): 信頼 ${_fmt(t0)}→${_fmt(t1)} (期待 ${_fmt(want)} = ${rawDelta}×感度${sens}) / 帳簿「派閥」 ${_fmt(s0)}→${_fmt(s1)}`);
  if (!_near(t1, want)) fails.push(`${label}(${id})の信頼 ${_fmt(t0)}→${_fmt(t1)}(期待 ${_fmt(want)})`);
  if (!_near(s1, wantStrain)) fails.push(`${label}(${id})の帳簿「派閥」 ${_fmt(s0)}→${_fmt(s1)}(期待 ${_fmt(wantStrain)})`);
}

function _stepValues(steps) {
  return (steps || []).map(entry => entry.value).filter(v => v && !v.probeError);
}

// F07 メイン推薦(DEMAND_MAIN): 興行ごとに、メインに派閥の選手がいれば派閥全員の信頼 +1、
// いなければリーダーの信頼 −2(感度つき)。残り興行数が1つ減る(app.js _finalizeHookFactionBookings)
function _assertF07Main(probe, lang, steps) {
  const fails = [];
  const values = _stepValues(steps);
  if (!values.some(v => v.f07 && v.f07.type === 'DEMAND_MAIN')) return ['F07 メイン推薦の方針(_pendingF07Directive)が一度も立たない'];
  const win = _findFinalizeWindow(steps);
  if (!win) return ['興行の清算(totalShows の増加)を観測できない'];
  const { pre, post } = win;
  if (!pre.f07) return ['清算の直前に F07 の方針が無い'];
  const fac = (pre.factions || []).find(f => f.id === pre.f07.factionId);
  if (!fac) return ['F07 の派閥が清算の直前に無い'];
  const fulfilled = (pre.mainIds || []).some(id => fac.memberIds.includes(id));
  console.log(`F07: メイン ${JSON.stringify(pre.mainIds)} / 派閥 ${JSON.stringify(fac.memberIds)} → ${fulfilled ? '推薦どおり(全員 +1)' : '推薦外(リーダー −2)'}`);
  if (fulfilled) fac.memberIds.forEach(id => _checkTrustApplied(fails, pre, post, id, 1, '派閥の選手'));
  else _checkTrustApplied(fails, pre, post, fac.leaderId, -2, 'リーダー');
  const r0 = pre.f07.remainingShows;
  const r1 = post.f07 ? post.f07.remainingShows : 0;
  console.log(`F07: 残り興行数 ${r0}→${r1}`);
  if (r1 !== r0 - 1) fails.push(`F07 の残り興行数 ${r0}→${r1}(1つ減るはず)`);
  return fails;
}

// Common-1: 予約の2人がカードで当たれば清算。勝者の信頼 +3〜5・敗者 −1〜3(感度つき。敗者がリーダーなら
// 下克上で追撃)、2人の因縁 −30〜50、予約は消える。結果の画面(c1rCloseBtn)が出る
function _assertCommon1(probe, lang, steps) {
  const fails = [];
  const values = _stepValues(steps);
  if (!values.some(v => v.c1)) return ['Common-1 の予約(bookedCommon1)が一度も立たない'];
  const win = _findFinalizeWindow(steps);
  if (!win) return ['興行の清算(totalShows の増加)を観測できない'];
  const { pre, post } = win;
  if (!pre.c1) return ['清算の直前に Common-1 の予約が無い'];
  if (post.c1) fails.push('清算の後も Common-1 の予約が残っている(カードで当たっていない?)');
  const [a, b] = pre.c1;
  const delta = id => post.trust[id][0] - pre.trust[id][0];
  const winner = delta(a) > 0 ? a : (delta(b) > 0 ? b : null);
  if (winner == null) {
    fails.push(`2人とも信頼が上がっていない(${a}: ${_fmt(delta(a))} / ${b}: ${_fmt(delta(b))})`);
  } else {
    const loser = winner === a ? b : a;
    const raw = delta(winner) / pre.trust[winner][2];
    console.log(`Common-1: 勝者 ${winner} 信頼 ${_fmt(pre.trust[winner][0])}→${_fmt(post.trust[winner][0])}(素点 ${_fmt(raw)}) / 敗者 ${loser} 信頼 ${_fmt(pre.trust[loser][0])}→${_fmt(post.trust[loser][0])} 帳簿「派閥」 ${_fmt(pre.trust[loser][1])}→${_fmt(post.trust[loser][1])}`);
    if (post.trust[winner][0] < 100 && ![3, 4, 5].some(n => _near(raw, n))) fails.push(`勝者の信頼の素点 ${_fmt(raw)}(3〜5のはず)`);
    const dl = delta(loser);
    if (!(dl < 0)) fails.push(`敗者の信頼が下がっていない(${_fmt(dl)})`);
    if (!_near(post.trust[loser][1] - pre.trust[loser][1], -dl)) fails.push('敗者の帳簿「派閥」が信頼の減り分だけ増えていない');
  }
  if (pre.c1Rivalry && post.c1Rivalry) {
    console.log(`Common-1: 2人の因縁 ${JSON.stringify(pre.c1Rivalry.map(_fmt))}→${JSON.stringify(post.c1Rivalry.map(_fmt))}`);
    if (!(post.c1Rivalry[0] < pre.c1Rivalry[0] && post.c1Rivalry[1] < pre.c1Rivalry[1])) fails.push('2人の因縁が下がっていない');
  }
  if (!values.some(v => v.shown && v.shown.c1Result)) fails.push('Common-1 の結果の画面(c1rCloseBtn)が出ていない');
  return fails;
}

// F08 直接対決をメインに: 次の興行の先頭に両リーダーが組まれ(_f08Locked)、試合後に敗れた派閥の末端の
// 信頼 −2〜4(感度つき)・両リーダーの因縁 +30〜40(両方向)と試合後の画面(fevtF08PostOverlay)。方針は興行後に消える
function _assertF08(probe, lang, steps) {
  const fails = [];
  const values = _stepValues(steps);
  if (!values.some(v => v.f08)) return ['F08 の直接対決の方針(_pendingF08Directive)が一度も立たない'];
  const win = _findFinalizeWindow(steps);
  if (!win) return ['興行の清算(totalShows の増加)を観測できない'];
  const { pre, post } = win;
  if (!pre.f08) return ['清算の直前に F08 の方針が無い'];
  if (post.f08) fails.push('清算の後も F08 の方針が残っている');
  const d = pre.f08;
  if (!(pre.mainIds.includes(d.leaderAId) && pre.mainIds.includes(d.leaderBId))) fails.push(`メインが両リーダーではない(${JSON.stringify(pre.mainIds)})`);
  // 敗れた派閥の末端(リーダーと幹部=リーダーを除く OVR 上位2人 以外。Engine.factions.isExecutive)の信頼が
  // 同じ素点(−2〜−4 のどれか1つ)×感度で下がり、帳簿の「派閥」が同じだけ増える。末端がいない(3人以下の派閥)なら信頼は動かない
  const winnerId = post.mainWinner;
  const loserLeader = winnerId === d.leaderAId ? d.leaderBId : (winnerId === d.leaderBId ? d.leaderAId : null);
  if (loserLeader == null) {
    fails.push(`メインの勝者が両リーダーのどちらでもない(${winnerId})`);
  } else {
    const fac = (pre.factions || []).find(f => f.leaderId === loserLeader) || { memberIds: [] };
    const nonLeaders = fac.memberIds.filter(id => id !== fac.leaderId && pre.trust[id]);
    const execs = new Set([...nonLeaders].sort((x, y) => pre.trust[y][3] - pre.trust[x][3]).slice(0, 2));
    const tails = nonLeaders.filter(id => !execs.has(id));
    console.log(`F08: 勝者 ${winnerId} / 敗れた派閥 ${fac.id} ${JSON.stringify(fac.memberIds)} 末端 ${JSON.stringify(tails)}`);
    const raws = [];
    for (const id of tails) {
      const raw = (post.trust[id][0] - pre.trust[id][0]) / pre.trust[id][2];
      raws.push(raw);
      console.log(`  末端 ${id}: 信頼 ${_fmt(pre.trust[id][0])}→${_fmt(post.trust[id][0])}(素点 ${_fmt(raw)}) 帳簿「派閥」 ${_fmt(pre.trust[id][1])}→${_fmt(post.trust[id][1])}`);
      if (post.trust[id][0] > 0 && ![-2, -3, -4].some(n => _near(raw, n))) fails.push(`敗れた派閥の末端 ${id} の信頼の素点 ${_fmt(raw)}(−2〜−4のはず)`);
      if (!_near(post.trust[id][1] - pre.trust[id][1], pre.trust[id][0] - post.trust[id][0])) fails.push(`末端 ${id} の帳簿「派閥」が信頼の減り分だけ増えていない`);
    }
    if (raws.length > 1 && !raws.every(r => _near(r, raws[0]))) fails.push(`末端の素点がそろっていない(${raws.map(_fmt).join(',')})`);
    for (const id of [...execs, fac.leaderId]) {
      if (pre.trust[id] && post.trust[id] && !_near(pre.trust[id][0], post.trust[id][0])) fails.push(`敗れた派閥のリーダー・幹部 ${id} の信頼が動いた`);
    }
  }
  const hk = (x, y) => `${x}>${y}`;
  console.log(`F08: 対立度 ${_fmt(pre.hostility[hk(d.factionAId, d.factionBId)])}/${_fmt(pre.hostility[hk(d.factionBId, d.factionAId)])} → ${_fmt(post.hostility[hk(d.factionAId, d.factionBId)])}/${_fmt(post.hostility[hk(d.factionBId, d.factionAId)])}`);
  // 両リーダーの因縁(rivalry)は両方向とも +30〜40(F08 の清算。2026-09-26 まで関係値を `a|b` で引いていて効いていなかった)。
  // 試合そのものの関係値の変化と、試合後の画面の「敗者リーダー→勝者リーダー +8〜12」も同じ清算の窓に入るので、
  // 下限の +30 を両方向で見る(修正前の seed42 は +11.2 / +25.0 だった)
  if (!pre.f08Rivalry || !post.f08Rivalry || pre.f08Rivalry.some(v => v == null) || post.f08Rivalry.some(v => v == null)) {
    fails.push('両リーダーの因縁(関係値 a>b / b>a)が読めない');
  } else {
    const deltas = post.f08Rivalry.map((v, i) => v - pre.f08Rivalry[i]);
    console.log(`F08: 両リーダーの因縁 ${JSON.stringify(pre.f08Rivalry.map(_fmt))}→${JSON.stringify(post.f08Rivalry.map(_fmt))}(${deltas.map(v => (v >= 0 ? '+' : '') + _fmt(v)).join(' / ')})`);
    deltas.forEach((v, i) => {
      if (post.f08Rivalry[i] < 100 && v < 30) fails.push(`両リーダーの因縁(${i === 0 ? 'A→B' : 'B→A'})が +${_fmt(v)} しか深まっていない(F08 の +30〜40 が効いていない)`);
    });
  }
  if (!values.some(v => v.shown && v.shown.f08Post)) fails.push('F08 の試合後の画面(fevtF08PostOverlay)が出ていない');
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
function _healthyLeaderFactions(G) {
  const roster = G.roster || [];
  const healthyLeader = f => roster.find(c => c.id === f.leaderId && !c.injury && !c.isRental && !c.forcedRest && (c.condition ?? 80) >= 40);
  return (G.factions || [])
    .filter(f => f && f.leaderId != null && Array.isArray(f.memberIds))
    .map(f => ({ faction: f, leader: healthyLeader(f) }))
    .filter(x => x.leader);
}

// 停止週: S2以降の W6〜W30 の通常興行週で、リーダー健在の派閥が2つそろう最初の週。
// 以前は「S2W6」固定+シード固定で、派閥の顔ぶれがエンジンの変更で動くたびに
// 「リーダー健在の派閥が2つ無い」で fixture が作れなくなっていた(seed42→7 に替えた P7-59 の後、
// 2026-09-26 には seed7 が S2 を通して派閥1つ・seed42 が W6 で2つ、と入れ替わった)。
// 週を探すので、シードの軌道が多少動いても次の該当週で作れる
const FACTION_IGNITE_LAST_SEASON = 4;
function _isFactionIgniteStopWeek(G) {
  if (G.offSeason || G.season < 2) return false;
  if (G.season > FACTION_IGNITE_LAST_SEASON) {
    throw new Error(`S2〜S${FACTION_IGNITE_LAST_SEASON} にリーダー健在の派閥が2つそろう通常興行週が無い。別シードで生成し直すこと`);
  }
  return G.week >= 6 && G.week <= 30
    && Engine.util.isRegularShowWeek(G.week)
    && _healthyLeaderFactions(G).length >= 2;
}

function _engineerFactionIgnite(G) {
  const pairs = _healthyLeaderFactions(G);
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
  return _makePairBookingBoost(pi.leaderAId, pi.leaderBId);
}

// スロット0に左 leftId・右 rightId を実クリックで組む誘導(派閥開戦のリーダー対決・Common-1 の予約で共用)
function _makePairBookingBoost(leftId, rightId) {
  const leaderA = { id: leftId };
  const leaderB = { id: rightId };
  const rowRegex = (side, id) => new RegExp(`_spSelectFighter\\(0,\\s*'${side}',\\s*${id}\\)`);
  const openRegex = side => new RegExp(`_spOpenPicker\\(0,\\s*'${side}'\\)`);
  return (candidate, all) => {
    const openL = all.find(c => openRegex('left').test(c.onclick));
    const openR = all.find(c => openRegex('right').test(c.onclick));
    if (!openL && !openR) return null; // 編成画面以外は通常スコア
    const rowA = all.find(c => rowRegex('left', leaderA.id).test(c.onclick));
    const rowB = all.find(c => rowRegex('right', leaderB.id).test(c.onclick));
    // P7-51: 表示名(WM_I18N.pn()でEN化される)ではなく _spFighterInfo が付与する
    // data-sp-fighter-id(driver.jsのspFighterId)で判定する(言語非依存)。
    // 既存のdata-fighter-id/actionScore 8250(「この選手を選ぶ」汎用ピッカー規約)とは
    // 別名にしてあるため、一般走破(test:ui:walkthrough)のスコアリングには波及しない。
    // openL/openRは空スロットではその属性を持たない(_spFighterInfoのempty分岐には
    // data-sp-fighter-idが無い)ためString('')の不一致で自然にfalseになる
    const leftDone = !!(openL && String(openL.spFighterId) === String(leaderA.id));
    const rightDone = !!(openR && String(openR.spFighterId) === String(leaderB.id));
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

// ── P7-58: 新聞1面(topStory/subStories+自団体興行結果)の画面ツアーprobe ──
// `#newspaperContent` 全体を読み、jaExposureScreens ゲート(run.js)が自動でJA露出0を
// 検査するのでここではjaLeavesは持たない — present/textLength(不発検出)と、
// バックナンバー送りが実際に効いたかの目印(np-archive-latestボタンの出現)だけを見る。
const NEWSPAPER_PAGE1_PROBE = `(() => {
  const root = document.getElementById('newspaperContent');
  if (!root) return { present: false };
  const norm = el => (el.textContent || '').replace(/\\s+/g, ' ').trim();
  const paper = root.querySelector('.np-paper');
  return {
    present: !!paper,
    text: norm(root).slice(0, 400),
    textLength: norm(root).length,
    hasOlderBtn: !!root.querySelector('[data-walk-role="np-archive-older"]'),
    hasLatestResetBtn: !!root.querySelector('[data-walk-role="np-archive-latest"]'),
    // 2026-09-26 第5回 問11: newspaper-lang-switch が最新号へ差し込む派閥抗争の決着の記事(factionRivalryDecided)の目印。
    // text は先頭400字しか持たないので、紙面全体で見る
    factionDecidedJa: /の派閥抗争に決着——|」が抗争を制す——/.test(norm(root)),
    factionDecidedEn: /feud settled — | take the feud — /.test(norm(root)),
    // 2026-09-26: 次回展望の欄(黒田コラムの直上。興行の記事が載る号だけ)。行数と見出しと本文
    previewLines: root.querySelectorAll('.np-v3-preview li').length,
    previewTitle: (() => { const el = root.querySelector('.np-v3-preview-ttl'); return el ? norm(el) : ''; })(),
    previewText: (() => { const el = root.querySelector('.np-v3-preview-list'); return el ? norm(el) : ''; })(),
    previewAboveKuroda: (() => {
      const pv = root.querySelector('.np-v3-preview'); const ku = root.querySelector('.np-v3-kuroda');
      return !!(pv && ku && (pv.compareDocumentPosition(ku) & Node.DOCUMENT_POSITION_FOLLOWING));
    })(),
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

// ── R15(P7-47): 開幕導線(タイトル→新規ゲーム→団体名入力→旗揚げ序章4幕→
// 旗揚げドラフト→設立挨拶→第1週)の点火 ──
// 他の全シナリオは`weekPhase:'manage'`(ドラフト完了済み)のオートセーブから始まるため、
// 開幕導線そのものはUI自動走破②(walk)もigniteのどのシナリオも構造的に踏めない穴だった
// (P7-31発見4)。このシナリオだけは前提fixtureを使わず(fixture:null)、真っさらな
// localStorageからタイトル画面を開く。団体名入力(テキスト入力)はクリックだけのwalk/tour
// 機構では表現できないため、run.jsに`preSteps`(click/fillの決定論的な手続き)を追加した。
const OPENING_FLOW_ORG_NAME = { en: 'Ember', ja: '紅蓮' };

function _openingFlowPreSteps(lang) {
  const orgName = OPENING_FLOW_ORG_NAME[lang] || OPENING_FLOW_ORG_NAME.ja;
  return [
    { label: 'NEW GAME', selector: '.title-btn.primary[onclick="App.titleNewGame()"]', type: 'click' },
    { label: '団体名入力', selector: '#orgSetupNameInput', type: 'fill', value: orgName },
    { label: '団体アイコン選択', selector: '#orgIconGrid img[data-idx="3"]', type: 'click' },
    { label: '旗揚げする', selector: '[onclick="App.confirmOrgSetup()"]', type: 'click' },
    // 難易度ピッカーは両方を一度は触ってから既定(通常=hard)へ戻す(ラジオ切替の経路も検査対象にする)
    { label: '難易度: 補助金モードへ切替', selector: '#diffOptNormal', type: 'click' },
    { label: '難易度: 通常モードへ戻す', selector: '#diffOptHard', type: 'click' },
    { label: 'ゲーム開始', selector: '[onclick="App.confirmDifficulty()"]', type: 'click' },
  ];
}

// 旗揚げドラフト画面の誘導。候補カード(.draft-fc.cand)は強み/課題/コーチ寸評/契約金まで
// 含めた説明文が優に100字を超えるため、driver.jsのlistCandidatesが持つ「記事本文のような
// 無差別onclick divを弾く100字フィルタ」(P7-22)にそのまま引っかかり候補にすら挙がらない
// (他の全画面はbutton/data-choice/data-fighter-id経由でこのフィルタを素通りしていたため、
// このタスクで初めて表面化した穴)。ui-render.js側に data-walk-role="draft-pick" を1つだけ
// 追加してisStructuredPicker扱いにし(属性の追加は表示テキストに影響しない —
// node test/ja-golden.js 完全一致で確認済み)、このboostが個体を明示的にスコアリングする。
// disabled(資金不足)/選択済みは常に-Infinity(nullを返してWALK_ROLE_SCORESの既定へ
// フォールスルーさせない — 既定には'draft-pick'を登録していないため無関係だが、
// 将来登録されても誤ってヒットしないよう明示する)。
function _openingFlowDraftBoost(candidate, all) {
  if (candidate.walkRole === 'draft-pick') {
    const isPickable = /App\.toggleDraftPick\(\d+\)/.test(candidate.onclick || '');
    const alreadyPicked = /(?:^| )picked(?: |$)/.test(candidate.className || '');
    if (!isPickable || alreadyPicked) return -Infinity;
    // 決定的に選ぶ: 契約金(見立て評価額)の安い順(同額はDOM順)。開始資金5000万に対し
    // 最低2名は120万以下の安価候補が保証されている(§3.6)ので、資金不足に陥らない
    const feeOf = c => {
      const m = /(?:契約金:|Signing fee:)\s*([\d,]+)/.exec(c.searchText || c.text || '');
      return m ? Number(m[1].replace(/,/g, '')) : Infinity;
    };
    const pickable = all
      .filter(c => c.walkRole === 'draft-pick'
        && /App\.toggleDraftPick\(\d+\)/.test(c.onclick || '')
        && !/(?:^| )picked(?: |$)/.test(c.className || ''))
      .sort((a, b) => feeOf(a) - feeOf(b) || a.index - b.index);
    const rank = pickable.findIndex(c => c.index === candidate.index);
    return rank >= 0 ? 9990 - rank : -Infinity;
  }
  if (/App\.completeDraft\(\)/.test(candidate.onclick || '')) return 9985;
  return null; // 序章4幕・設立挨拶・週1到達は既定スコアに委ねる("CLICK TO CONTINUE"=10000等)
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

  // ── P7-58: 新聞1〜3面の言語切替点火 ──
  // headless-simはapp.js(UI層)を読み込まないため、見出し・本文のテンプレ(App._NEWSPAPER_HEADLINES/
  // ARTICLES)を使った自団体興行結果の記事は自然生成のfixtureには現れない(K-1 第2段 2026-09-26 から、
  // エンジンの Engine.show.buildShowNewspaperData が組む記事は自然に載るが、テンプレが無いので既定の見出し
  // 「定期興行開催」+サブ見出しの形)。engineerでテンプレ由来の形の記事(headlineTpl/headlineVars・bodyTpl/bodyVars・
  // bodyDerive[finishLabel]付き)を最新号と直近バックナンバー1件へ直接差し込み、
  // 自然発生する業界ニュース各型・既定の見出しの自団体の記事(生成時にheadlineTpl/bodyTplを併記済み)と合わせて
  // 「JAで発行された号をENで開く」を検査する。
  'newspaper-lang-switch': {
    description: '新聞1面の言語切替点火(P7-58): JAで進めた業界ニュース各種の自然発生セーブに、Math.random()経由(App._generateNewspaperTexts)の自団体興行結果1件をengineerで最新号+バックナンバー1件へ注入し、実UIでEN表示に切り替えて最新号+バックナンバー3件を巡回、日本語露出0(jaExposureScreens)を検査する。JAでは注入した記事の見出し/本文が1バイト不変で出ることを確認する',
    fixture: {
      seed: 42,
      // 週8まで進めれば新聞は7号分バックナンバーが溜まる(assertで3号以上を要求)
      until: G => G.season === 1 && G.week === 8 && !G.offSeason,
      engineer: G => {
        const wp = G.weeklyNewspaper;
        const archive = G.newspaperArchive || [];
        if (!wp) throw new Error('weeklyNewspaperが無い。停止週を後ろへずらして生成し直すこと');
        const winner = (G.roster || [])[0];
        const loser = (G.roster || [])[1];
        if (!winner || !loser) throw new Error('自団体ロスターが2名未満。別シード/停止週で生成し直すこと');
        // App._NEWSPAPER_HEADLINES.normal[0] / _NEWSPAPER_ARTICLES.normal[1] を手で
        // 展開した形(headless-simはkuroda-text.js/app.jsを読み込まないため、実関数は
        // 呼べない)。テンプレ文字列はi18n/template-ledger.json(app.js:_NEWSPAPER_HEADLINES/
        // _NEWSPAPER_ARTICLES)に実在し、英訳済み(node test/i18n-build-template-dict.jsで確認済み)。
        const finType = 'フォール', finMove = 'ストンピング';
        const finishLabel = `${finMove} → 3カウント`; // Engine.formatFinish(finType, finMove, false)と同じ組み立て
        const headlineTpl = '{winnerName}がメインイベントを制す';
        const headlineVars = { winnerName: winner.name };
        const bodyTpl = '{winnerName}がメインの大舞台で堂々たる勝利を飾った。{loserName}も要所で見せ場を作ったが、最終的には{winnerName}の{finishLabel}に沈んだ。{attendanceToLocaleString}人の観客が見守った{turns}ターンの一戦。';
        const bodyVars = { winnerName: winner.name, loserName: loser.name, finishLabel, attendanceToLocaleString: '3,200', turns: 14 };
        const bodyDerive = [{ key: 'finishLabel', kind: 'formatFinish', finType, finMove, fallback: finishLabel }];
        const stampSuffixJa = '定期興行';
        const situation = `第${G.season}年度・第${Math.max(1, G.week - 1)}週 ${stampSuffixJa}`;
        const headline = headlineVars.winnerName + 'がメインイベントを制す';
        const body = `${winner.name}がメインの大舞台で堂々たる勝利を飾った。${loser.name}も要所で見せ場を作ったが、最終的には${winner.name}の${finishLabel}に沈んだ。3,200人の観客が見守った14ターンの一戦。`;
        const playerShowStory = {
          type: 'playerShowNormal', priority: 150,
          headline, headlineTpl, headlineVars, headlineDerive: null,
          body, bodyTpl, bodyVars, bodyDerive,
          characterId: winner.id, situation, situationSuffixJa: stampSuffixJa,
        };
        const playerShowData = {
          headline, subheadline: '', article: body,
          headlineTpl, headlineVars, headlineDerive: null,
          articleTpl: bodyTpl, articleVars: bodyVars, articleDerive: bodyDerive,
          winner: { id: winner.id, name: winner.name }, loser: { id: loser.id, name: loser.name },
          left: { id: winner.id, name: winner.name }, right: { id: loser.id, name: loser.name },
          isDraw: false, isTag: false, finishLabel, finType, finMove, turns: 14, mq: 62,
          // matchLabel: null はApp._buildShowResultNewspaperDataの現行実装と同じ形
          // (シングルのメインは表示側の`d.matchLabel || WM_I18N.t('メインイベント')`
          // フォールバックへ委ねる。§P7-58で「メインイベント」の生成時焼き込みを撤去した)。
          matchLabel: null, attendance: 3200,
        };
        // 2026-09-26 第5回 問11: 派閥抗争の決着の記事(factionRivalryDecided)を最新号のサブ記事の先頭へ。
        // 記事は本物の経路で組む(決着の知らせ → 業界ニュースのキュー → Engine.newspaper.generate)。
        // 一言は原文で積まれ、表示時に言語別に組み直される(EN では一言・派閥名・団体名まで英語になること)
        const leadA = (G.roster || [])[2];
        const leadB = (G.roster || [])[3];
        if (!leadA || !leadB) throw new Error('自団体ロスターが4名未満。別シード/停止週で生成し直すこと');
        const facName = c => `${c.surname || c.name}派`;
        const notice = Engine.factions.buildRivalryResolutionNotice(
          { ...G, factions: [
            { id: 1, name: facName(leadA), leaderId: leadA.id, memberIds: [leadA.id] },
            { id: 2, name: facName(leadB), leaderId: leadB.id, memberIds: [leadB.id] },
          ] },
          { resolved: true, reason: 'POINTS', winnerFactionId: 1, loserFactionId: 2 },
          Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season, G.week, 0xFA2A)));
        if (!notice.news) throw new Error('派閥抗争の決着の記事が組めない(buildRivalryResolutionNotice)');
        const factionPaper = Engine.newspaper.generate({ ...G, _industryNewsEvents: [notice.news] },
          Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season, G.week, 0x5EED)));
        const factionStory = [factionPaper.topStory, ...(factionPaper.subStories || [])]
          .find(st => st && st.type === 'factionRivalryDecided');
        if (!factionStory) throw new Error('派閥抗争の決着の記事が紙面に載らない(Engine.newspaper.generate)');
        const newWp = { ...wp, topStory: playerShowStory, playerShowData, subStories: [factionStory, ...(wp.subStories || [])] };
        const newArchive = archive.length
          ? [{ ...archive[0], topStory: playerShowStory, playerShowData }, ...archive.slice(1)]
          : archive;
        return { ...G, weeklyNewspaper: newWp, newspaperArchive: newArchive };
      },
      assert: G => {
        const fails = [];
        if (!G.weeklyNewspaper || G.weeklyNewspaper.layout !== 'v3') fails.push('weeklyNewspaper.layout が v3 でない(旧レイアウトは検査対象外)');
        if (!G.weeklyNewspaper.topStory || G.weeklyNewspaper.topStory.type !== 'playerShowNormal') {
          fails.push('engineerの差し込みが効いていない(weeklyNewspaper.topStory)');
        }
        if (!(G.weeklyNewspaper.subStories || []).some(st => st && st.type === 'factionRivalryDecided')) {
          fails.push('engineerの差し込みが効いていない(weeklyNewspaper.subStories の factionRivalryDecided)');
        }
        const archive = G.newspaperArchive || [];
        if (archive.length < 3) fails.push(`newspaperArchiveが${archive.length}件(3件以上必要 — バックナンバー巡回を検査するため)`);
        if (!archive[0] || archive[0].topStory?.type !== 'playerShowNormal') {
          fails.push('engineerの差し込みが効いていない(newspaperArchive[0].topStory)');
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
      // ENモードのときだけ、この画面ツアーで踏んだ全ての停車点(最新号+バックナンバー3件)の
      // 可視要素をJA露出0のゲートにする(run.js)。JAモードでは情報集計のみ。
      jaExposureScreens: ['screen-newspaper'],
      steps: [
        { label: '新聞を開く(最新号)', selector: `.nav-btn[onclick^="showScreen('newspaper'"]`, expectScreen: 'screen-newspaper', probe: NEWSPAPER_PAGE1_PROBE },
        { label: 'バックナンバー1(engineerの差し込み号)', selector: '[data-walk-role="np-archive-older"]', expectScreen: 'screen-newspaper', probe: NEWSPAPER_PAGE1_PROBE },
        { label: 'バックナンバー2', selector: '[data-walk-role="np-archive-older"]', expectScreen: 'screen-newspaper', probe: NEWSPAPER_PAGE1_PROBE },
        { label: 'バックナンバー3', selector: '[data-walk-role="np-archive-older"]', expectScreen: 'screen-newspaper', probe: NEWSPAPER_PAGE1_PROBE },
      ],
    },
    tourAssert: (probes, lang) => {
      const fails = [];
      const stops = Object.entries(probes);
      if (stops.length === 0) return ['画面ツアーのprobeが1つも取れていない'];
      for (const [label, p] of stops) {
        if (!p || p.probeError) { fails.push(`${label}: probe失敗 ${p && p.probeError}`); continue; }
        if (!p.present) { fails.push(`${label}: .np-paper が描画されていない(不発)`); continue; }
        if (!p.textLength || p.textLength < 50) fails.push(`${label}: 紙面のテキストが${p.textLength || 0}字しかない(不発の疑い)`);
      }
      // 最新号: 派閥抗争の決着の記事(engineerの差し込み)が出ていること。JAでは原文、ENでは訳文
      const latest = probes['新聞を開く(最新号)'];
      if (latest && !latest.probeError && latest.present) {
        if (lang === 'en') {
          if (!latest.factionDecidedEn) fails.push('最新号: 派閥抗争の決着の記事のEN見出し(feud settled / take the feud)が出ていない');
          if (latest.factionDecidedJa) fails.push('最新号: ENなのに派閥抗争の決着の記事のJA見出しが残っている');
        } else if (!latest.factionDecidedJa) {
          fails.push('最新号: 派閥抗争の決着の記事(の派閥抗争に決着 / が抗争を制す)が出ていない');
        }
      }
      // 2026-09-26: 次回展望の欄。engineer が詳報(playerShowData)を差し込んだ最新号とバックナンバー1は
      // 興行の記事が載る号なので欄が出る(材料は号に焼かれた buildPreview)。JA では見出し「次回展望」、
      // EN では見出し「Looking Ahead」で本文に日本語が残らない(紙面全体の JA 露出ゲートとは別に、欄だけでも見る)
      const jaChar = /[぀-ヿ㐀-鿿豈-﫿]/;
      for (const label of ['新聞を開く(最新号)', 'バックナンバー1(engineerの差し込み号)']) {
        const p = probes[label];
        if (!p || p.probeError || !p.present) continue;
        console.log(`  preview: ${label} lines=${p.previewLines} title="${p.previewTitle}" | ${String(p.previewText || '').slice(0, 120)}`);
        if (!p.previewLines) { fails.push(`${label}: 次回展望の欄が出ていない(興行の記事が載る号)`); continue; }
        if (!p.previewAboveKuroda) fails.push(`${label}: 次回展望が黒田コラムの直上に無い`);
        if (lang === 'en') {
          if (p.previewTitle !== 'Looking Ahead') fails.push(`${label}: 次回展望の見出しが英語になっていない(${p.previewTitle})`);
          if (jaChar.test(p.previewText)) fails.push(`${label}: 次回展望の本文に日本語が残っている(${p.previewText.slice(0, 80)})`);
        } else if (p.previewTitle !== '次回展望') {
          fails.push(`${label}: 次回展望の見出しが出ていない(${p.previewTitle})`);
        }
      }
      const backnumber1 = probes['バックナンバー1(engineerの差し込み号)'];
      if (backnumber1 && !backnumber1.probeError) {
        if (!backnumber1.hasLatestResetBtn) fails.push('バックナンバー1: 最新号ボタンが出ていない(バックナンバー送りが効いていない)');
        // engineerが差し込んだplayerShowNormal記事(見出し「がメインイベントを制す」を含む)が
        // 実際に一面へ出ていること。JAでは原文のまま、ENでは訳文(takes the main event)が出る
        const hasJaMarker = /メインイベントを制す/.test(backnumber1.text || '');
        const hasEnMarker = /takes the main event/.test(backnumber1.text || '');
        if (lang === 'en') {
          if (!hasEnMarker) fails.push('バックナンバー1: EN訳文(takes the main event)が一面に出ていない(headlineTplの表示時再生成が働いていない)');
          if (hasJaMarker) fails.push('バックナンバー1: ENなのにJA原文(メインイベントを制す)が残っている');
        } else if (!hasJaMarker) {
          fails.push('バックナンバー1: JAなのに原文(メインイベントを制す)が出ていない');
        }
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
    // 停止週の探し方は incoming-challenge と同じ(_challengeFixture)。以前の「S2W6 固定」では
    // 相手(他団体)の選手が W6 の他団体の試合で怪我をし、W8 の遠征が黙って取り消されていた(2026-09-26)
    fixture: _challengeFixture(false),
    walk: { seasons: 1, maxSteps: 160 },
    // 停止週(非興行)を処理→翌週の頭に直訴→同行2名→その週に遠征→2拍の結果→自団体の興行。
    // 停止週の2週後の頭で止める(その週に自然に届く次の直訴を受けると、新しい遠征予約が残って見えるため)
    makeUntil: _untilWeeksAfterFixture(2),
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
    // 停止週は _challengeFixture で探す(seed42 では S2W7)。以前の「S2W6 固定」は発起人が W6 の
    // 他団体の試合で怪我をし、W8 の興行で予約が解除されて2拍の結果画面が不発だった(2026-09-26)
    fixture: _challengeFixture(true),
    walk: { seasons: 1, maxSteps: 160 },
    // 停止週(非興行)を処理→翌週の頭に果たし状→受けて立つ→その週の興行でシリーズ→2拍の結果。
    // 余裕を1週みて、停止週の3週後の頭で止める
    makeUntil: _untilWeeksAfterFixture(3),
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

  // incoming-challenge の観戦版(2026-09-26 K-1 第3段の確認)。同じ停止週・同じ果たし状で、
  // 3試合シリーズ(上位3枠=試合番号0〜2)を「🎬 試合を観る」で最後まで観戦してから残りをスキップする。
  // 観戦は MATCH_RESULT → _afterMatchSettle の経路(スキップの経路とは別)を通って Engine.show.finalize に入る
  'incoming-challenge-watch': {
    description: '果たし状(相手発)の観戦版: 受けて立つ→次の自団体興行で3試合シリーズを観戦(iframe を最後まで)→2拍の結果',
    fixture: _challengeFixture(true),
    walk: { seasons: 1, maxSteps: 200 },
    makeUntil: _untilWeeksAfterFixture(3),
    boost: _watchMatchBoost([0, 1, 2]),
    hold: WATCH_HOLD,
    stepProbe: _withFlavorObserver('({})'),
    ignition: [
      { name: 'incoming-gauntlet', required: true, match: s => overlayHit(s, 'hostile-arrival-overlay') },
      { name: 'watch-iframe', required: true, match: s => overlayHit(s, 'battleOverlay') },
      { name: 'incoming-result-two-beat', required: true, match: s => overlayHit(s, 'challengeRequestResultOverlay') },
    ],
    finalProbe: `(() => ({
      bookingLeft: !!(typeof G !== 'undefined' && G._pendingIncomingChallengeMatch),
      accepted: (typeof G !== 'undefined' && G.challengeRequest) ? (G.challengeRequest.acceptedThisSeason || 0) : 0,
      guestsLeft: (typeof G !== 'undefined') ? (G.roster || []).filter(f => f.isCRGuest).length : -1,
    }))()`,
    finalAssert: (probe, lang, steps) => {
      const fails = [];
      if (!probe || probe.accepted < 1) fails.push('果たし状が受理されていない(acceptedThisSeason=0)');
      if (probe && probe.bookingLeft) fails.push('迎撃予約が残留している(シリーズが消化されていない)');
      if (probe && probe.guestsLeft !== 0) fails.push(`シリーズのゲストが自団体のロスターに残っている(${probe.guestsLeft})`);
      fails.push(..._assertFlavorSeen(steps));
      return fails;
    },
  },

  // 出す直前の見直し(2026-09-26): 大型イベント・派閥イベントとぶつかって持ち越している間に発起人が怪我をした果たし状。
  // incoming-challenge と同じ停止週・同じ果たし状を置き、発起人(他団体の選手)だけ6週の怪我にする(持ち越した週に
  // 怪我をしたのと同じ形)。週を処理した後に果たし状が出ず(App.handleChallengeRequest / processWeek の
  // dropUnplayablePending で取り下げ)、受けて予約→次の興行で解除、にならないことを見る。
  // 変更前は果たし状が出て、受けると次の興行で「出場条件が整わないため予約を解除」のトーストが出ていた
  'incoming-challenge-injured': {
    description: '果たし状の発起人が持ち越しの間に怪我: 週を処理しても果たし状が出ず、取り下げられ、予約も解除のトーストも無い',
    fixture: {
      ..._challengeFixture(true),
      engineer: G => {
        const picked = _pickChallenge(G, true);
        if (!picked.state) throw new Error(`果たし状を置ける組が無い: ${picked.reasons.join(' / ')}`);
        const s = picked.state;
        const p = s.challengeRequest.pendingThisWeek;
        const injury = { type: '中程度の負傷', weeksLeft: 6, totalWeeks: 6, severity: 'mid', color: '#f39c12' };
        const org = s.aiOrgs[p.requesterOrgId];
        return {
          ...s,
          aiOrgs: { ...s.aiOrgs, [p.requesterOrgId]: { ...org, roster: org.roster.map(f => (f.id === p.selfId ? { ...f, injury } : f)) } },
        };
      },
      assert: G => {
        const fails = _assertChallengePending(G);
        const p = G.challengeRequest && G.challengeRequest.pendingThisWeek;
        const req = p && ((G.aiOrgs[p.requesterOrgId] || {}).roster || []).find(f => f.id === p.selfId);
        if (!req || !req.injury) fails.push('果たし状の発起人が怪我をしていない');
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 120 },
    // 停止週を処理→翌週(通常興行)→その次の週の頭で止める。発起人は6週の怪我なので、この間に同じ組が抽選し直されることは無い
    makeUntil: _untilWeeksAfterFixture(2),
    // 置いた果たし状(停止週に発行)を key で追う。W8 は直訴の抽選週なので、取り下げた後に別の組の直訴が新しく届くことはある(それは正常)
    stepProbe: `(() => {
      if (typeof G === 'undefined' || !G) return { loaded: false };
      const p = G.challengeRequest && G.challengeRequest.pendingThisWeek;
      const key = p ? (p._inverse ? 'inv:' : 'fwd:') + p.selfId + '>' + p.otherId + '@S' + p.issuedSeason + 'W' + p.issuedWeek : null;
      const b = G._pendingIncomingChallengeMatch;
      return {
        loaded: true, week: G.week, key,
        gauntlet: !!document.querySelector('.hostile-arrival-overlay'),
        booking: b ? 'inv:' + b.requesterId + '>' + b.opponentId : null,
      };
    })()`,
    ignition: [],
    finalProbe: `(() => {
      const p = typeof G !== 'undefined' && G.challengeRequest && G.challengeRequest.pendingThisWeek;
      return {
        key: p ? (p._inverse ? 'inv:' : 'fwd:') + p.selfId + '>' + p.otherId + '@S' + p.issuedSeason + 'W' + p.issuedWeek : null,
        booking: !!(typeof G !== 'undefined' && G._pendingIncomingChallengeMatch),
        accepted: (typeof G !== 'undefined' && G.challengeRequest) ? (G.challengeRequest.acceptedThisSeason || 0) : 0,
        week: (typeof G !== 'undefined') ? G.week : null,
      };
    })()`,
    finalAssert: (probe, lang, steps, fixture) => {
      const fails = [];
      const fp = fixture && fixture.challengeRequest && fixture.challengeRequest.pendingThisWeek;
      if (!fp) return ['fixture に果たし状が置けていない'];
      const placedKey = `inv:${fp.selfId}>${fp.otherId}@S${fp.issuedSeason}W${fp.issuedWeek}`;
      const values = (steps || []).map(e => e.value).filter(v => v && !v.probeError && v.loaded);
      const withPlaced = values.filter(v => v.key === placedKey);
      const seen = withPlaced.filter(v => v.gauntlet).length;
      const booked = values.filter(v => v.booking === `inv:${fp.selfId}>${fp.otherId}`).length;
      console.log(`果たし状(怪我の発起人 ${placedKey}): 残っていた手 ${withPlaced.length} / 出た手 ${seen} / 予約のあった手 ${booked} / 終わり ${JSON.stringify(probe)}`);
      if (seen > 0) fails.push(`怪我をした発起人の果たし状が画面に出た(${seen}手)`);
      if (booked > 0 || (probe && probe.booking)) fails.push('怪我をした発起人の果たし状が予約された(次の興行で解除される)');
      if (!probe || probe.key === placedKey) fails.push('出せない果たし状が取り下げられずに残っている');
      if (probe && probe.accepted > 0) fails.push(`果たし状を受けた扱いになっている(acceptedThisSeason=${probe.accepted})`);
      if (probe && probe.week != null && probe.week <= fixture.week) fails.push('停止週を処理していない(週が進んでいない)');
      return fails;
    },
  },

  // 挑戦状(B3)を受けて「次の通常興行のメインイベント」に組み、その興行で清算する(K-1 第3段の hooks.afterWriteback)。
  // 停止週の週送りで挑戦状が立った形を合成(_pickB3Challenge)。スキップ版と観戦版
  'b3-challenge': {
    description: '挑戦状(B3): 週を処理→挑戦状→受けて立つ→代表を選ぶ→次の通常興行のメインに固定→全試合スキップ→対戦成績・ゲスト返却',
    fixture: {
      seed: 42,
      until: G => {
        if (G.season > 2) throw new Error('S2 のうちに挑戦状を置ける週が見つからない');
        return _isPlainStopWeek(G) && !!_pickB3Challenge(G).state;
      },
      engineer: G => {
        const picked = _pickB3Challenge(G);
        if (!picked.state) throw new Error(`挑戦状を置けない: ${picked.reason}`);
        return picked.state;
      },
      engineerSave: _moveIgniteTransients,
      assert: G => (G[IGNITE_TRANSIENTS] && G[IGNITE_TRANSIENTS]._pendingLargeEvent ? [] : ['挑戦状(_pendingLargeEvent B3)が置けていない']),
    },
    walk: { seasons: 1, maxSteps: 160 },
    makeUntil: _untilWeeksAfterFixture(3),
    boost: _b3AcceptBoost,
    // 試合前の「✨ 初対決」は観戦を選んだ試合の前だけ。スキップ版では出ないことを見張りで確かめる
    stepProbe: _withFlavorObserver(B3_STEP_PROBE),
    ignition: [
      // 決断トレイつきの暗い A 型は直訴(CH-1)とも同じ形なので、受けた証跡は stepProbe(予約)で見る
      { name: 'b3-offer', required: false, match: s => (s.overlays || []).some(o => /mdlAOverlay:.*mdl-a-decision-tray/.test(String(o)) && /danger/.test(String(o))) },
      { name: 'b3-pick', required: true, match: s => overlayHit(s, 'mdl-a-candidate-stage') },
    ],
    finalProbe: `(() => ({ booked: !!(typeof G !== 'undefined' && G._pendingIncomingB3Match) }))()`,
    finalAssert: (probe, lang, steps) => [..._assertB3Resolved(steps), ..._assertB3FirstMeet(steps, { watched: false })],
  },

  'b3-challenge-watch': {
    description: '挑戦状(B3)の観戦版: 受けて立つ→次の通常興行のメイン(試合番号0)を観戦(iframe を最後まで)→残りをスキップ',
    fixture: {
      seed: 42,
      until: G => {
        if (G.season > 2) throw new Error('S2 のうちに挑戦状を置ける週が見つからない');
        return _isPlainStopWeek(G) && !!_pickB3Challenge(G).state;
      },
      engineer: G => {
        const picked = _pickB3Challenge(G);
        if (!picked.state) throw new Error(`挑戦状を置けない: ${picked.reason}`);
        return picked.state;
      },
      engineerSave: _moveIgniteTransients,
      assert: G => (G[IGNITE_TRANSIENTS] && G[IGNITE_TRANSIENTS]._pendingLargeEvent ? [] : ['挑戦状(_pendingLargeEvent B3)が置けていない']),
    },
    walk: { seasons: 1, maxSteps: 200 },
    makeUntil: _untilWeeksAfterFixture(3),
    boost: (candidate, all) => {
      const accept = _b3AcceptBoost(candidate, all);
      return accept != null ? accept : _watchMatchBoost([0])(candidate, all);
    },
    hold: WATCH_HOLD,
    stepProbe: _withFlavorObserver(B3_STEP_PROBE),
    ignition: [
      { name: 'b3-offer', required: false, match: s => (s.overlays || []).some(o => /mdlAOverlay:.*mdl-a-decision-tray/.test(String(o)) && /danger/.test(String(o))) },
      { name: 'b3-pick', required: true, match: s => overlayHit(s, 'mdl-a-candidate-stage') },
      { name: 'watch-iframe', required: true, match: s => overlayHit(s, 'battleOverlay') },
    ],
    finalProbe: `(() => ({ booked: !!(typeof G !== 'undefined' && G._pendingIncomingB3Match) }))()`,
    finalAssert: (probe, lang, steps) => [..._assertB3Resolved(steps), ..._assertFlavorSeen(steps), ..._assertB3FirstMeet(steps)],
  },

  // 派閥の予約の清算(K-1 第3段 3-3・§7 X05 で信頼・人気が効くようになった処理)。停止週の週送りの後に
  // 派閥イベントが出る形を合成し(_pickFactionBooking)、社長の選択 A → 翌週の通常興行で清算 →
  // 清算の前後(stepProbe)で信頼・帳簿の「派閥」・予約の消化を検算する
  'faction-f07-main': {
    description: '派閥 F07 メイン推薦: 週を処理→メインカード相談→A(推す)→翌週の興行で清算(メインに派閥の選手なし=リーダー −2 / あり=全員 +1)→残り興行数',
    fixture: {
      seed: 42,
      until: G => {
        if (G.season > 2) throw new Error('S2 のうちに F07 を置ける週が見つからない');
        return _isPlainStopWeek(G) && !!_pickFactionBooking(G, 'F07').state;
      },
      engineer: G => {
        const picked = _pickFactionBooking(G, 'F07');
        if (!picked.state) throw new Error(`F07 を置けない: ${picked.reason}`);
        return picked.state;
      },
      engineerSave: _moveIgniteTransients,
    },
    walk: { seasons: 1, maxSteps: 160 },
    makeUntil: _untilWeeksAfterFixture(3),
    stepProbe: FACTION_STEP_PROBE,
    ignition: [
      { name: 'f07-modal', required: true, match: s => overlayHit(s, 'fevtF07Overlay') },
    ],
    finalProbe: `(() => ({ f07: (typeof G !== 'undefined' && G._pendingF07Directive) || null }))()`,
    finalAssert: (probe, lang, steps) => _assertF07Main(probe, lang, steps),
  },

  'faction-common1': {
    description: '派閥 Common-1: 週を処理→派閥内の対決→A(興行で決着)→翌週のカードに2人を組む→清算(勝者の信頼+・敗者の信頼−・因縁−)→結果の画面',
    fixture: {
      seed: 42,
      until: G => {
        if (G.season > 2) throw new Error('S2 のうちに Common-1 を置ける週が見つからない');
        return _isPlainStopWeek(G) && !!_pickFactionBooking(G, 'COMMON_1').state;
      },
      engineer: G => {
        const picked = _pickFactionBooking(G, 'COMMON_1');
        if (!picked.state) throw new Error(`Common-1 を置けない: ${picked.reason}`);
        return picked.state;
      },
      engineerSave: _moveIgniteTransients,
    },
    walk: { seasons: 1, maxSteps: 160 },
    makeUntil: _untilWeeksAfterFixture(3),
    // 予約の2人をスロット0に組む(枠は問わない仕様。組まないと清算されず次の興行へ繰り越される)
    makeBoost: fixture => {
      const p = (fixture._pendingFactionEvent && fixture._pendingFactionEvent.payload) || {};
      return _makePairBookingBoost(p.fighterAId, p.fighterBId);
    },
    stepProbe: FACTION_STEP_PROBE,
    ignition: [
      { name: 'common1-modal', required: true, match: s => overlayHit(s, 'fevtCommon1Overlay') },
    ],
    finalProbe: `(() => ({ booked: !!(typeof G !== 'undefined' && G.bookedCommon1) }))()`,
    finalAssert: (probe, lang, steps) => _assertCommon1(probe, lang, steps),
  },

  'faction-f08': {
    description: '派閥 F08: 週を処理→対立ヒートアップ→A(直接対決をメインに)→翌週の興行の先頭に両リーダー→清算(敗れた派閥の末端の信頼−)→試合後の画面',
    fixture: {
      seed: 42,
      until: G => {
        if (G.season > 2) throw new Error('S2 のうちに F08 を置ける週が見つからない');
        return _isPlainStopWeek(G) && !!_pickFactionBooking(G, 'F08').state;
      },
      engineer: G => {
        const picked = _pickFactionBooking(G, 'F08');
        if (!picked.state) throw new Error(`F08 を置けない: ${picked.reason}`);
        return picked.state;
      },
      engineerSave: _moveIgniteTransients,
    },
    walk: { seasons: 1, maxSteps: 160 },
    makeUntil: _untilWeeksAfterFixture(3),
    stepProbe: FACTION_STEP_PROBE,
    ignition: [
      { name: 'f08-modal', required: true, match: s => overlayHit(s, 'fevtF08Overlay') },
      { name: 'f08-aftermath', required: true, match: s => overlayHit(s, 'fevtF08PostOverlay') },
    ],
    finalProbe: `(() => ({ f08: (typeof G !== 'undefined' && G._pendingF08Directive) || null }))()`,
    finalAssert: (probe, lang, steps) => _assertF08(probe, lang, steps),
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
      // 停止週は _isFactionIgniteStopWeek で探す(seed42 では S2W6)。P7-59 の seed7 は
      // 2026-09-26 時点で S2 を通して派閥が1つしか無く、固定週では作れなくなっていた
      seed: 42,
      until: _isFactionIgniteStopWeek,
      engineer: _engineerFactionIgnite,
      assert: G => {
        const fails = [];
        if (!G.factionPendingIgnite) fails.push('factionPendingIgnite が置けていない');
        if (!Engine.util.isRegularShowWeek(G.week)) fails.push(`停止週 W${G.week} が通常興行週ではない(最初の操作でリーダー対決を組む前提)`);
        return fails;
      },
    },
    walk: { seasons: 1, maxSteps: 120 },
    makeBoost: _makeFactionIgniteBoost,
    // 開戦モーダルは興行後のポップアップキュー経由で翌週頭に出ることがあるため、停止週の3週後の頭まで見る
    makeUntil: _untilWeeksAfterFixture(3),
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

  'opening-flow': {
    description: '開幕導線の点火(P7-47): fixtureを使わず真っさらなタイトル画面から新規ゲーム→団体名入力(JA/EN別の固定名)→難易度選択→旗揚げ序章4幕(TAP)→旗揚げドラフト(固定2名+安価3名を決定的に選択)→設立挨拶→第1週の今週タブ到達までを実UIで通す。既存の全シナリオがweekPhase:manage(ドラフト完了済み)のオートセーブから始まるため誰も踏んでいなかった穴(P7-31発見4)',
    // このシナリオだけ前提セーブを使わない — run.jsがlocalStorageへ何も書かず素のタイトル画面から始める
    fixture: null,
    // 走破ドライバの決定論(tie-break PRNG)用のシード。ゲーム内部のcreateInitialStateの
    // rngSeedはpage.clock固定時刻由来のDate.now()で決まる(fixtureのseedとは無関係)
    seed: 42,
    // タイトル→難易度確定までの手続き型導線。lang => [{label,selector,type:'click'|'fill',value?}]
    preSteps: _openingFlowPreSteps,
    walk: { seasons: 1, maxSteps: 80 },
    boost: _openingFlowDraftBoost,
    until: s => !!(s.state && s.state.weekPhase === 'manage' && s.state.season === 1 && s.state.week === 1
      && !s.state.offSeason && (!s.overlays || s.overlays.length === 0)),
    ignition: [
      { name: 'title-screen', required: true, match: s => s.activeScreen === 'titleScreen' },
      { name: 'org-setup-screen', required: true, match: s => s.activeScreen === 'orgSetupScreen' },
      { name: 'difficulty-screen', required: true, match: s => s.activeScreen === 'difficultyScreen' },
      { name: 'opening-overlay', required: true, match: s => overlayHit(s, 'opening-overlay') },
      { name: 'draft-screen', required: true, match: s => !!(s.state && s.state.weekPhase === 'draft') },
      { name: 'founding-greeting', required: true, match: s => overlayHit(s, 'completion-overlay') },
      {
        name: 'week1-reached',
        required: true,
        match: s => !!(s.state && s.state.weekPhase === 'manage' && s.state.season === 1 && s.state.week === 1
          && (!s.overlays || s.overlays.length === 0)),
      },
    ],
    // EN専用: 開幕導線の全段を通じて日本語露出0(言語トグルの「日本語」ラベルだけは仕様上の
    // 例外 — index.htmlのコメントどおり意図的に翻訳しない)。記号(○×△等)はJAPANESE_CHAR_PATTERN
    // の対象外(CJK統合漢字/かな以外)なので許容リストに含める必要が無い
    jaExposureAllowText: ['日本語'],
    finalProbe: `(() => ({
      weekPhase: (typeof G !== 'undefined' && G) ? G.weekPhase : null,
      season: (typeof G !== 'undefined' && G) ? G.season : null,
      week: (typeof G !== 'undefined' && G) ? G.week : null,
      orgName: (typeof G !== 'undefined' && G) ? G.orgName : null,
      rosterCount: (typeof G !== 'undefined' && G && Array.isArray(G.roster)) ? G.roster.length : 0,
      draftComplete: (typeof G !== 'undefined' && G) ? !!G.draftComplete : false,
      prologueFounders: (typeof G !== 'undefined' && G && G.prologue && Array.isArray(G.prologue.founderIds)) ? G.prologue.founderIds.length : 0,
    }))()`,
    finalAssert: (probe, lang) => {
      const fails = [];
      if (!probe) return ['finalProbeが取れていない'];
      const expectedOrgName = OPENING_FLOW_ORG_NAME[lang] || OPENING_FLOW_ORG_NAME.ja;
      if (probe.weekPhase !== 'manage') fails.push(`weekPhase=${probe.weekPhase}(manageを期待)`);
      if (probe.season !== 1 || probe.week !== 1) fails.push(`season/week=${probe.season}/${probe.week}(1/1を期待)`);
      if (probe.rosterCount !== 5) fails.push(`roster数=${probe.rosterCount}(5名=固定2+選択3を期待)`);
      if (!probe.draftComplete) fails.push('draftComplete=falseのまま(ドラフト完了フラグが立っていない)');
      if (probe.orgName !== expectedOrgName) fails.push(`orgName="${probe.orgName}"(期待="${expectedOrgName}" — 団体名入力が反映されていない)`);
      if (probe.prologueFounders < 5) fails.push(`序章founderIds=${probe.prologueFounders}件(5名を期待 — Engine.prologue.createが走っていない)`);
      return fails;
    },
  },
};

// 停止週の探し方の診断用(列挙されない。シナリオ一覧には出ない)
Object.defineProperty(module.exports, '__test', {
  enumerable: false,
  value: { _isPlainStopWeek, _pickChallenge, _pickB3Challenge, _pickFactionBooking, _isFactionIgniteStopWeek },
});
