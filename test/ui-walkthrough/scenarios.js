'use strict';

// レア画面強制点火カタログ(バグ捜索体制③)のシナリオ定義。
// 設計: docs/rare-screen-ignition-catalog-design-v0.1.md
//
// 各シナリオの形:
//   fixture.seed      — headless進行のシード(fixtureファイル名にも入る)
//   fixture.until(G)  — この条件の週の頭で進行を止めてfixture化する
//   fixture.engineer(G) — 停止後の状態加工(省略可)。正規セーブとして成立する形だけを作る
//   fixture.assert(G) — fixtureとして成立している前提の検査。失敗文字列の配列を返す
//   walk              — 実UI走破の設定。seasonsは既定終了条件(開始季+seasonsの第1週)で使う
//   until(snapshot)   — 既定終了条件を差し替える場合のみ(snapshotはdetectors.summarizeSnapshotの形)
//   ignition[]        — 点火マーカー。required:trueが1つでも未観測ならIGNITION_MISFIRE
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

module.exports = {
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
