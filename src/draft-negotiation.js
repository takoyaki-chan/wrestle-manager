// ══════════════════════════════════════════════════════════════════════════════
//  Draft Negotiation Engine — draft-negotiation-spec-v1.0
//  セリ（オークション）方式のスカウト交渉システム
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

// ────────────────────── §4 定数 ──────────────────────

// §4.1 複利価格倍率
const DRAFT_BID_MUL = {
  standard: 1.10,   // 標準
  aggressive: 1.25,  // 強気
};

// §4.7 強気時のCPU降り率ブースト
const DRAFT_AGGRESSIVE_BOOST = {
  baseDropMul: 3.0,
  sensMul: 1.5,
};

// §4.5 タイプ分布 (A=純粋確率, B=隠しキャップ, C=動的キャップ)
const DRAFT_TYPE_DIST = ['A', 'B', 'C'];

// §4.5 タイプB/C 隠しキャップ範囲 (assessedValue の倍率) — 🔧調整済み
const DRAFT_HIDDEN_CAP_RANGE = { min: 2.5, max: 8.0 };

// §4.6 タイプC 強気時キャップ上昇 (assessedValue の %)
const DRAFT_TYPE_C_CAP_BOOST = 0.50;

// §4.8 マーク別パラメータ倍率 (§5.3 性格値にこの倍率をかける)
// §4.8 のマーク別値を◎基準比で算出:
//   基礎降り率: ◎3%=1.0, ○10%=3.33, △28%=9.33
//   感応度:     ◎10=1.0,  ○18=1.80,  △30=3.00
const DRAFT_MARK_MUL_BASE = {
  honmei: 1.0,    // ◎
  taikou: 3.33,   // ○
  osae:   9.33,   // △
};
const DRAFT_MARK_MUL_SENS = {
  honmei: 1.0,    // ◎
  taikou: 1.80,   // ○
  osae:   3.00,   // △
};

// ────────────────────── §5 定数 ──────────────────────

// §5.2 ティア別参加率テーブル (クリア前)
const DRAFT_PARTICIPATION = {
  normal: {
    org_s: { superElite: 0.95, elite: 0.90, promising: 0.80, raw: 0.30, material: 0.05 },
    org_a: { superElite: 0.75, elite: 0.70, promising: 0.60, raw: 0.50, material: 0.15 },
    org_b: { superElite: 0.35, elite: 0.30, promising: 0.50, raw: 0.60, material: 0.25 },
  },
  // §5.7 クリア後
  elevated: {
    org_s: { superElite: 0.98, elite: 0.95, promising: 0.85, raw: 0.40, material: 0.10 },
    org_a: { superElite: 0.85, elite: 0.80, promising: 0.70, raw: 0.55, material: 0.25 },
    org_b: { superElite: 0.55, elite: 0.50, promising: 0.65, raw: 0.65, material: 0.30 },
  },
};

// §5.3 性格別降り率 (クリア前) — 🔧 spec初期値から試遊調整済み
const DRAFT_ORG_PERSONALITY = {
  normal: {
    org_s: { baseDrop: 0.005, sens: 4.5 },  // 王者の自信
    org_a: { baseDrop: 0.014, sens: 7.5 },  // エモーショナル
    org_b: { baseDrop: 0.028, sens: 12 },   // 現実的
  },
  // §5.7 クリア後
  elevated: {
    org_s: { baseDrop: 0.003, sens: 3 },
    org_a: { baseDrop: 0.008, sens: 5.5 },
    org_b: { baseDrop: 0.018, sens: 8 },
  },
};

// §5.4 若さボーナス
const DRAFT_YOUTH_BONUS = {
  16: 1.30, 17: 1.25, 18: 1.20, 19: 1.18, 20: 1.13,
  21: 1.05, 22: 1.00, 23: 0.90, 24: 0.80, 25: 0.70,
};
const DRAFT_YOUTH_BONUS_DEFAULT = 0.60; // 26歳以上

// §5.5 ロスター充足度補正 (参加率の倍率)
const DRAFT_ROSTER_FILL_MUL = [
  { gap: 0, mul: 0.5 },   // 理想達成済み
  { gap: -2, mul: 1.0 },  // 理想 -1〜-2名
  { gap: -4, mul: 1.3 },  // 理想 -3〜-4名
  { gap: -99, mul: 1.6 }, // 理想 -5名以下
];

// §5.6 マーク閾値 (執着/assessed 比率)
const DRAFT_MARK_THRESHOLDS = {
  honmei: 1.5,   // ≥ 1.5倍 → ◎
  taikou: 1.0,   // 1.0〜1.5倍 → ○
  // < 1.0 → △
};

// §5.6 表示ノイズ確率
const DRAFT_MARK_NOISE = { accurate: 0.80, stronger: 0.10, weaker: 0.10 };

// §6 EMPRESS安全網
const DRAFT_EMPRESS_SAFETY = {
  orgId: 'org_s',
  tcOvrThreshold: 110,
  targetEliteCount: 6,
  maxPerSeason: 2,
  reinforceWindow: 15,
};

// ────────────────────── ヘルパー ──────────────────────

function _getYouthBonus(age) {
  return DRAFT_YOUTH_BONUS[age] || DRAFT_YOUTH_BONUS_DEFAULT;
}

function _getRosterFillMul(currentSize, idealSize) {
  const gap = currentSize - idealSize;
  if (gap >= 0) return 0.5;
  if (gap >= -2) return 1.0;
  if (gap >= -4) return 1.3;
  return 1.6;
}

function _getMarkFromRatio(ratio) {
  if (ratio >= DRAFT_MARK_THRESHOLDS.honmei) return 'honmei';
  if (ratio >= DRAFT_MARK_THRESHOLDS.taikou) return 'taikou';
  return 'osae';
}

function _applyMarkNoise(mark, rng) {
  const r = Engine.rng.float(rng);
  const marks = ['honmei', 'taikou', 'osae'];
  const idx = marks.indexOf(mark);
  if (r < DRAFT_MARK_NOISE.accurate) return mark;
  if (r < DRAFT_MARK_NOISE.accurate + DRAFT_MARK_NOISE.stronger) {
    return marks[Math.max(0, idx - 1)]; // 1段強い
  }
  return marks[Math.min(marks.length - 1, idx + 1)]; // 1段弱い
}

// ────────────────────── エンジン本体 ──────────────────────

Engine.draftNegotiation = {

  // ── §5.2 + §5.4 + §5.5: 各団体の各候補への関心を決定 ──
  // returns: { orgId, participating, obsessionScore, mark, displayMark, type, hiddenCap }
  assignInterest(candidate, orgId, state, rng) {
    const leagueElevated = state.leagueElevated || false;
    const tier = candidate.assessedTier || 'material';

    // 参加率テーブル
    const table = leagueElevated ? DRAFT_PARTICIPATION.elevated : DRAFT_PARTICIPATION.normal;
    const orgRates = table[orgId];
    if (!orgRates) return { orgId, participating: false };
    let baseRate = orgRates[tier] || 0.05;

    // §5.5 ロスター充足度補正
    const aiData = (state.aiOrgs || {})[orgId];
    const idealRoster = (AI_SCOUT_CFG[
      orgId === 'org_s' ? 'S' : orgId === 'org_a' ? 'A' : 'B'
    ] || {}).idealRoster || 13;
    const currentSize = aiData ? (aiData.roster || []).length : idealRoster;
    const fillMul = _getRosterFillMul(currentSize, idealRoster);
    baseRate = Math.min(1.0, baseRate * fillMul);

    // 参加判定
    if (Engine.rng.float(rng) >= baseRate) {
      return { orgId, participating: false };
    }

    // §5.4 執着スコア
    const age = candidate.age || 18;
    const youthBonus = _getYouthBonus(age);
    const randomBre = 0.85 + Engine.rng.float(rng) * 0.50; // 0.85〜1.35 (中央1.10)
    const assessedValue = candidate.assessedValue || 100;
    const obsessionScore = assessedValue * youthBonus * randomBre;

    // §5.6 マーク
    const ratio = obsessionScore / assessedValue;
    const mark = _getMarkFromRatio(ratio);
    const displayMark = _applyMarkNoise(mark, rng);

    // §4.5 タイプ A/B/C
    const typeIdx = Engine.rng.int(rng, 0, 2);
    const type = DRAFT_TYPE_DIST[typeIdx];

    // 隠しキャップ (タイプB/Cのみ)
    let hiddenCap = null;
    if (type === 'B' || type === 'C') {
      const capMul = DRAFT_HIDDEN_CAP_RANGE.min +
        Engine.rng.float(rng) * (DRAFT_HIDDEN_CAP_RANGE.max - DRAFT_HIDDEN_CAP_RANGE.min);
      hiddenCap = assessedValue * capMul;
    }

    return {
      orgId,
      participating: true,
      obsessionScore,
      mark,          // 実際の挙動を決めるマーク
      displayMark,   // プレイヤーに表示するマーク（ノイズ入り）
      type,
      hiddenCap,
      dropped: false,
    };
  },

  // ── §4.4 + §4.7: CPU団体の降り判定 ──
  // returns: true = 降りる
  runDropCheck(interest, currentBid, isPlayerAggressive, leagueElevated, rng) {
    if (interest.dropped) return true;

    const orgId = interest.orgId;
    const personality = leagueElevated
      ? DRAFT_ORG_PERSONALITY.elevated
      : DRAFT_ORG_PERSONALITY.normal;
    const p = personality[orgId] || personality.org_b;

    // §4.8 + §5.3: マーク別倍率 × 性格パラメータ
    const baseMul = DRAFT_MARK_MUL_BASE[interest.mark] || DRAFT_MARK_MUL_BASE.osae;
    const sensMul = DRAFT_MARK_MUL_SENS[interest.mark] || DRAFT_MARK_MUL_SENS.osae;
    let baseDrop = p.baseDrop * baseMul;
    let sens = p.sens * sensMul;

    // §4.7: 強気ブースト
    if (isPlayerAggressive) {
      baseDrop *= DRAFT_AGGRESSIVE_BOOST.baseDropMul;
      sens *= DRAFT_AGGRESSIVE_BOOST.sensMul;
    }

    // §4.4: 降り確率（sens は /100 で適用: sens=10 → 10% per 100% excess）
    // §4.10 の検証: △強気1発で ~95%, ○強気1発で ~37% に合致
    const priceRatio = currentBid / interest.obsessionScore;
    const dropProb = Math.max(0, baseDrop + (sens / 100) * Math.max(0, priceRatio - 1));

    // タイプB/C: 隠しキャップ到達で確定降り
    if ((interest.type === 'B' || interest.type === 'C') && interest.hiddenCap !== null) {
      if (currentBid >= interest.hiddenCap) return true;
    }

    return Engine.rng.float(rng) < dropProb;
  },

  // ── §4.6: タイプC 強気時キャップ上昇 ──
  applyTypeCBoost(interest, assessedValue) {
    if (interest.type !== 'C' || interest.dropped || interest.hiddenCap === null) return;
    interest.hiddenCap += assessedValue * DRAFT_TYPE_C_CAP_BOOST;
  },

  // ── §7.3 ヒートゲージ ──
  getHeatInfo(currentBid, obsessionScore) {
    if (!obsessionScore || obsessionScore <= 0) return { label: 'COMPOSED', labelJp: '余裕', cls: 'composed', pct: 10 };
    const ratio = currentBid / obsessionScore;
    if (ratio < 0.7)  return { label: 'COMPOSED',  labelJp: '余裕',           cls: 'composed',  pct: Math.round(ratio / 0.7 * 40) };
    if (ratio < 1.0)  return { label: 'STEADY',    labelJp: 'まだ余裕あり',   cls: 'steady',    pct: 40 + Math.round((ratio - 0.7) / 0.3 * 20) };
    if (ratio < 1.5)  return { label: 'HEATED',    labelJp: '熱が入っている', cls: 'heated',    pct: 60 + Math.round((ratio - 1.0) / 0.5 * 18) };
    if (ratio < 2.5)  return { label: 'STRAINED',  labelJp: 'そろそろ限界',   cls: 'strained',  pct: 78 + Math.round((ratio - 1.5) / 1.0 * 15) };
    return              { label: 'DESPERATE', labelJp: 'もはや意地',     cls: 'desperate', pct: Math.min(100, 93 + Math.round((ratio - 2.5) * 3)) };
  },

  // ── §7.4 ナレーション ──
  NARRATION: {
    fighting: {
      org_s: ['EMPRESS GRAND、引く気配なし', 'EMPRESS、王者の貫禄で粘る'],
      org_a: ['NOVA IMPACT、ヒートアップ', 'NOVA、勝負に出た'],
      org_b: ['CRESCENT RISE、まさかの執念', 'CRESCENT、地方の意地を見せる'],
    },
    dropped: {
      org_s: ['EMPRESS GRAND、ここで撤退。王者にも見切り時はある', 'EMPRESS、苦渋の判断で離脱'],
      org_a: ['NOVA IMPACT、無念の撤退', 'NOVA、ここは引くしかなかった'],
      org_b: ['CRESCENT RISE、現実的な判断で離脱', 'CRESCENT、深追いせず撤退'],
    },
    playerWin: {
      solo: ['契約成立。静かに迎え入れる'],
      vs1: ['一騎打ちを制した', '激しい交渉を勝ち抜いた'],
      multi: ['複数団体との争奪戦を勝ち抜いた！', '激戦の末、獲得に成功！'],
    },
    playerLost: ['他団体に持っていかれた。次の機会を待とう', '残念…他団体の執念が上回った'],
    flowThrough: ['全団体が手を引いた。この選手はフリー市場へ'],
    roundStart: [
      '交渉卓に緊張が走る',
      '各団体の代表が表情を引き締める',
      '金額が上がるごとに空気が重くなる',
      '交渉は佳境を迎えている',
    ],
  },

  pickNarration(type, context, rng) {
    const pool = type === 'fighting' ? Engine.draftNegotiation.NARRATION.fighting[context.orgId] || []
      : type === 'dropped' ? Engine.draftNegotiation.NARRATION.dropped[context.orgId] || []
      : type === 'playerWin' ? (context.defeatedCount === 0 ? Engine.draftNegotiation.NARRATION.playerWin.solo
        : context.defeatedCount === 1 ? Engine.draftNegotiation.NARRATION.playerWin.vs1
        : Engine.draftNegotiation.NARRATION.playerWin.multi)
      : type === 'playerLost' ? Engine.draftNegotiation.NARRATION.playerLost
      : type === 'flowThrough' ? Engine.draftNegotiation.NARRATION.flowThrough
      : Engine.draftNegotiation.NARRATION.roundStart;
    if (!pool || pool.length === 0) return '';
    return pool[Engine.rng.int(rng, 0, pool.length - 1)];
  },

  // ── 1ラウンドだけ進める（UI用） ──
  // negState: { currentBid, interests, playerIn, round, log, finished, winner, assessedValue, narration, droppedThisRound }
  stepRound(negState, playerAction, state, rng) {
    const ns = { ...negState, droppedThisRound: [], narration: '' };
    const assessedValue = ns.assessedValue;
    const leagueElevated = state.leagueElevated || false;
    ns.round++;

    // プレイヤーアクション
    if (playerAction === 'drop') {
      ns.playerIn = false;
      ns.log.push(`R${ns.round}: プレイヤー降り (${ns.currentBid}万)`);
    }
    const isAggressive = playerAction === 'aggressive';

    // §4.6 タイプC
    if (isAggressive) {
      for (const interest of ns.interests) {
        if (!interest.dropped && interest.participating) {
          Engine.draftNegotiation.applyTypeCBoost(interest, assessedValue);
        }
      }
    }

    // CPU降り判定
    for (const interest of ns.interests) {
      if (interest.dropped || !interest.participating) continue;
      if (Engine.draftNegotiation.runDropCheck(interest, ns.currentBid, isAggressive, leagueElevated, rng)) {
        interest.dropped = true;
        interest._droppedAtRound = ns.round;
        ns.droppedThisRound.push(interest.orgId);
        ns.log.push(`R${ns.round}: ${interest.orgId} 離脱 (${ns.currentBid}万)`);
      }
    }

    // ナレーション生成
    const narRng = Engine.rng.create(Engine.rng.derive(rng._state || 0, ns.round, 0xAA));
    if (ns.droppedThisRound.length > 0) {
      ns.narration = Engine.draftNegotiation.pickNarration('dropped', { orgId: ns.droppedThisRound[0] }, narRng);
    } else {
      const stillFighting = ns.interests.filter(i => i.participating && !i.dropped);
      if (stillFighting.length > 0) {
        const hottest = stillFighting.reduce((a, b) => {
          const ra = ns.currentBid / (a.obsessionScore || 1);
          const rb = ns.currentBid / (b.obsessionScore || 1);
          return ra > rb ? a : b;
        });
        ns.narration = Engine.draftNegotiation.pickNarration('fighting', { orgId: hottest.orgId }, narRng);
      } else {
        ns.narration = Engine.draftNegotiation.pickNarration('roundStart', {}, narRng);
      }
    }

    // 決着判定
    const stillActive = ns.interests.filter(i => i.participating && !i.dropped);
    const totalActive = stillActive.length + (ns.playerIn ? 1 : 0);

    if (totalActive <= 1) {
      ns.finished = true;
      if (ns.playerIn) {
        ns.winner = 'player';
        const defeatedCount = ns.interests.filter(i => i.participating).length;
        ns.narration = Engine.draftNegotiation.pickNarration('playerWin', { defeatedCount }, narRng);
      } else if (stillActive.length === 1) {
        ns.winner = stillActive[0].orgId;
        ns.narration = Engine.draftNegotiation.pickNarration('playerLost', {}, narRng);
      } else {
        ns.winner = null;
        ns.narration = Engine.draftNegotiation.pickNarration('flowThrough', {}, narRng);
      }
      ns.finalBid = ns.currentBid;
      return ns;
    }
    if (totalActive === 0) {
      ns.finished = true;
      ns.winner = null;
      ns.finalBid = 0;
      ns.narration = Engine.draftNegotiation.pickNarration('flowThrough', {}, narRng);
      return ns;
    }

    // 価格上昇
    const mul = isAggressive ? DRAFT_BID_MUL.aggressive : DRAFT_BID_MUL.standard;
    ns.currentBid = Math.round(ns.currentBid * mul);

    // 安全弁
    if (ns.round >= 30) {
      ns.finished = true;
      ns.winner = ns.playerIn ? 'player' : (stillActive.length > 0 ? stillActive[0].orgId : null);
      ns.finalBid = ns.currentBid;
    }

    return ns;
  },

  // ── ネゴ状態の初期化（1候補用） ──
  initNegState(candidate, interests) {
    return {
      candidateId: candidate.id,
      assessedValue: candidate.assessedValue || 100,
      currentBid: candidate.assessedValue || 100,
      interests: interests.map(i => ({ ...i })),
      playerIn: true,
      round: 0,
      log: [],
      finished: false,
      winner: null,
      finalBid: 0,
      narration: '',
      droppedThisRound: [],
    };
  },

  // ── 1候補の交渉全体を実行 ──
  // playerActionFn: (round, currentBid, interests) => 'aggressive' | 'standard' | 'drop'
  // returns: { winner: orgId|'player'|null, finalBid, rounds, log[] }
  runNegotiation(candidate, interests, playerActionFn, state, rng) {
    const assessedValue = candidate.assessedValue || 100;
    let currentBid = assessedValue;
    const leagueElevated = state.leagueElevated || false;
    const log = [];
    const maxRounds = 30; // 安全弁

    // プレイヤーが関心なし = 不参加なら即AI解決
    let playerIn = true;
    const activeOrgs = interests.filter(i => i.participating && !i.dropped);

    if (activeOrgs.length === 0 && playerIn) {
      // 単独指名: 即取得
      return { winner: 'player', finalBid: assessedValue, rounds: 0, log: ['単独指名で契約成立'] };
    }

    for (let round = 1; round <= maxRounds; round++) {
      // プレイヤーのアクション
      let playerAction = 'standard';
      if (playerIn) {
        playerAction = playerActionFn(round, currentBid, interests);
      }
      if (playerAction === 'drop') {
        playerIn = false;
        log.push(`R${round}: プレイヤー降り (${currentBid}万)`);
      }

      const isAggressive = playerAction === 'aggressive';

      // §4.6: タイプC強気ブースト（プレイヤーが強気のときのみ）
      if (isAggressive) {
        for (const interest of interests) {
          if (!interest.dropped && interest.participating) {
            Engine.draftNegotiation.applyTypeCBoost(interest, assessedValue);
          }
        }
      }

      // CPU降り判定
      for (const interest of interests) {
        if (interest.dropped || !interest.participating) continue;
        const drops = Engine.draftNegotiation.runDropCheck(
          interest, currentBid, isAggressive, leagueElevated, rng
        );
        if (drops) {
          interest.dropped = true;
          log.push(`R${round}: ${interest.orgId} 離脱 (${currentBid}万)`);
        }
      }

      // 残りの参加者を確認
      const stillActive = interests.filter(i => i.participating && !i.dropped);
      const totalActive = stillActive.length + (playerIn ? 1 : 0);

      // 1者しかいない → 落札
      if (totalActive <= 1) {
        if (playerIn) {
          return { winner: 'player', finalBid: currentBid, rounds: round, log };
        }
        if (stillActive.length === 1) {
          return { winner: stillActive[0].orgId, finalBid: currentBid, rounds: round, log };
        }
        // 全員降りた → 流札
        return { winner: null, finalBid: 0, rounds: round, log };
      }

      // 0者 → 流札 (プレイヤーも降り+全CPU降り)
      if (totalActive === 0) {
        return { winner: null, finalBid: 0, rounds: round, log };
      }

      // 価格上昇 (§4.1)
      const mul = isAggressive ? DRAFT_BID_MUL.aggressive : DRAFT_BID_MUL.standard;
      currentBid = Math.round(currentBid * mul);
    }

    // maxRounds到達 → 最後に残っていた者が落札
    const stillActive = interests.filter(i => i.participating && !i.dropped);
    if (playerIn) return { winner: 'player', finalBid: currentBid, rounds: maxRounds, log };
    if (stillActive.length > 0) return { winner: stillActive[0].orgId, finalBid: currentBid, rounds: maxRounds, log };
    return { winner: null, finalBid: 0, rounds: maxRounds, log };
  },

  // ── ドラフト全体のオーケストレーション ──
  // candidates: generateScoutReport の結果
  // playerActionFn: (candidateId, round, currentBid, interests) => 'aggressive'|'standard'|'drop'
  // returns: { results: [{candidate, winner, finalBid, interests}], empressReinforceEvents: [], flowLog: [] }
  runFullDraft(candidates, state, playerActionFn, rng) {
    const results = [];
    const flowLog = [];

    // assessedValue 高い順にソート
    const sorted = [...candidates].sort((a, b) => (b.assessedValue || 0) - (a.assessedValue || 0));

    // 各AI団体の獲得カウント追跡
    const orgAcquired = { org_s: 0, org_a: 0, org_b: 0 };
    // プレイヤー獲得上限は呼び出し側で管理

    for (const candidate of sorted) {
      // 各団体の関心を決定
      const interests = [];
      for (const orgId of ['org_s', 'org_a', 'org_b']) {
        const interestRng = Engine.rng.create(Engine.rng.derive(
          rng._state || 0, candidate.id, orgId.charCodeAt(4), 0xDFA1
        ));
        const interest = Engine.draftNegotiation.assignInterest(candidate, orgId, state, interestRng);
        interests.push(interest);
      }

      // 交渉実行
      const negRng = Engine.rng.create(Engine.rng.derive(
        rng._state || 0, candidate.id, 0xDFA2
      ));
      const playerFn = (round, currentBid, ints) => playerActionFn(candidate.id, round, currentBid, ints);
      const result = Engine.draftNegotiation.runNegotiation(
        candidate, interests, playerFn, state, negRng
      );

      // AI団体が落札した場合、獲得カウント更新
      if (result.winner && result.winner !== 'player' && result.winner !== null) {
        orgAcquired[result.winner] = (orgAcquired[result.winner] || 0) + 1;
      }

      results.push({
        candidate,
        winner: result.winner,
        finalBid: result.finalBid,
        rounds: result.rounds,
        interests,
        log: result.log,
      });

      flowLog.push(`${candidate.name}(${candidate.assessedTier}): ${result.winner || '流札'} ${result.finalBid}万 R${result.rounds}`);
    }

    // §6 EMPRESS安全網
    const empressEvents = Engine.draftNegotiation.empressReinforce(state, rng);

    return { results, empressReinforceEvents: empressEvents, flowLog, orgAcquired };
  },

  // ── §6 EMPRESS安全網 ──
  empressReinforce(state, rng) {
    const events = [];
    const cfg = DRAFT_EMPRESS_SAFETY;
    const sOrgId = cfg.orgId;
    const sOrg = RIVAL_ORGS.find(o => o.id === sOrgId);
    if (!sOrg) return events;
    const aiData = (state.aiOrgs || {})[sOrgId];
    if (!aiData) return events;

    const roster = aiData.roster || [];
    const eliteCount = roster.filter(f => Engine.rival.trainCapOVR(f) >= cfg.tcOvrThreshold).length;

    if (eliteCount >= cfg.targetEliteCount) return events;

    let dormantEntries = [...(state.dormantPool || [])];
    const occupied = new Set();
    Object.values(state.aiOrgs || {}).forEach(a => (a.roster || []).forEach(f => occupied.add(f.id)));
    (state.roster || []).forEach(f => occupied.add(f.id));
    (state.freeAgents || []).forEach(f => occupied.add(f.id));

    let iterations = 0;
    while (eliteCount + iterations < cfg.targetEliteCount && iterations < cfg.maxPerSeason) {
      iterations++;
      const eligible = dormantEntries.filter(e => !occupied.has(e.id));
      if (eligible.length === 0) break;
      const window = eligible.slice(0, cfg.reinforceWindow);

      const sorted = window.map(e => {
        const template = ALL_CHARS.find(c => c.id === e.id);
        if (!template) return null;
        const potTotal = (template.pot.pw || 0) + (template.pot.sp || 0) + (template.pot.te || 0) + (template.pot.st || 0) + (template.pot.mn || 0);
        return { id: e.id, potTotal, template };
      }).filter(Boolean).sort((a, b) => b.potTotal - a.potTotal);

      const candidate = sorted[0];
      if (!candidate) break;

      const testRng = Engine.rng.create(Engine.rng.derive(rng._state || 0, candidate.id, 0xE11F));
      const testFighter = Engine.rival.makeAIFighter(candidate.template, testRng, sOrgId, 17 + Engine.rng.int(rng, 0, 2), [0.75, 0.80]);
      if (Engine.rival.trainCapOVR(testFighter) < cfg.tcOvrThreshold) break;

      const recruitRng = Engine.rng.create(Engine.rng.derive(rng._state || 0, candidate.id, 0xE120, iterations));
      const newFighter = Engine.rival.makeAIFighter(candidate.template, recruitRng, sOrgId, 17 + Engine.rng.int(rng, 0, 2), [0.75, 0.80]);
      occupied.add(candidate.id);
      dormantEntries = dormantEntries.filter(e => e.id !== candidate.id);

      events.push({
        type: 'empressReinforce',
        fighter: newFighter,
        template: candidate.template,
        dormantIdRemoved: candidate.id,
      });
    }

    return events;
  },

  // ── 検証用: auto-simでセリ結果を集計 ──
  // spec §4.9: ◎ honmei 対手がいる場合の勝率で評価
  runValidation(seasons, seed) {
    const totalSeasons = seasons || 100;
    const baseSeed = seed || 42;
    const stats = {
      totalNegotiations: 0,
      playerWins: 0, contested: 0,
      // ◎ honmei 対手の数別
      honmei1_win: 0, honmei1_n: 0,  // 1団体が◎
      honmei2_win: 0, honmei2_n: 0,  // 2団体が◎
      honmei3_win: 0, honmei3_n: 0,  // 3団体が◎
      // 全般
      aiWins: { org_s: 0, org_a: 0, org_b: 0 },
      flowThrough: 0,
      totalRounds: 0,
      totalBidRatio: 0,
      contestedBids: 0,
    };

    // §4.9 "プレイヤー本気": 標準で粘り、価格が基準の3.5倍を超えたら降りる
    // candidateId→assessedValue のルックアップ用マップ
    const assessedMap = {};
    const seriousPlayerFn = (candidateId, round, currentBid, interests) => {
      const assessed = assessedMap[candidateId] || 100;
      if (currentBid > assessed * 3.5) return 'drop';
      return 'standard';
    };

    for (let s = 0; s < totalSeasons; s++) {
      const seasonSeed = baseSeed + s * 7919;
      const rng = Engine.rng.create(seasonSeed);

      const mockState = {
        aiOrgs: {
          org_s: { roster: Array(14).fill(null).map((_, i) => ({ id: 9000 + i })) },
          org_a: { roster: Array(11).fill(null).map((_, i) => ({ id: 9100 + i })) },
          org_b: { roster: Array(8).fill(null).map((_, i) => ({ id: 9200 + i })) },
        },
        leagueElevated: false,
        dormantPool: [],
        roster: [],
        freeAgents: [],
      };

      // ダミー候補 (§2.2 分布に近い)
      const candidates = [];
      const tierDist = [
        { tier: 'superElite', count: 1, av: 2000 },
        { tier: 'elite', count: 2, av: 900 },
        { tier: 'promising', count: 4, av: 350 },
        { tier: 'raw', count: 5, av: 150 },
        { tier: 'material', count: 4, av: 80 },
      ];
      let cid = 1;
      for (const td of tierDist) {
        for (let i = 0; i < td.count; i++) {
          const variance = 0.8 + Engine.rng.float(rng) * 0.4;
          const av = Math.round(td.av * variance);
          const id = cid++;
          candidates.push({
            id,
            name: `候補${id}`,
            assessedTier: td.tier,
            assessedValue: av,
            age: 16 + Engine.rng.int(rng, 0, 6),
          });
          assessedMap[id] = av;
        }
      }

      const draftResult = Engine.draftNegotiation.runFullDraft(
        candidates, mockState, seriousPlayerFn, rng
      );

      for (const r of draftResult.results) {
        stats.totalNegotiations++;
        const participating = r.interests.filter(i => i.participating);
        const honmeiCount = participating.filter(i => i.mark === 'honmei').length;
        stats.totalRounds += r.rounds;

        if (participating.length > 0) {
          stats.contested++;
          if (r.finalBid > 0 && r.candidate.assessedValue > 0) {
            stats.totalBidRatio += r.finalBid / r.candidate.assessedValue;
            stats.contestedBids++;
          }
        }

        const isPlayerWin = r.winner === 'player';
        if (isPlayerWin) stats.playerWins++;
        if (r.winner === null) stats.flowThrough++;
        else if (r.winner !== 'player') stats.aiWins[r.winner] = (stats.aiWins[r.winner] || 0) + 1;

        // §4.9 基準: ◎ honmei の数で分類 (競合ありの場合のみ)
        if (participating.length > 0) {
          if (honmeiCount >= 1) { stats.honmei1_n++; if (isPlayerWin) stats.honmei1_win++; }
          if (honmeiCount >= 2) { stats.honmei2_n++; if (isPlayerWin) stats.honmei2_win++; }
          if (honmeiCount >= 3) { stats.honmei3_n++; if (isPlayerWin) stats.honmei3_win++; }
        }
      }
    }

    const n = stats.totalNegotiations || 1;
    const pct = (num, den) => den ? (num / den * 100).toFixed(1) + '%' : 'N/A';
    return {
      seasons: totalSeasons,
      totalNegotiations: stats.totalNegotiations,
      contested: stats.contested,
      playerWinRate_overall: pct(stats.playerWins, n),
      playerWinRate_contested: pct(stats.playerWins - (n - stats.contested), stats.contested),
      // §4.9 target values
      'vs_1honmei (target 55-65%)': pct(stats.honmei1_win, stats.honmei1_n) + ` (n=${stats.honmei1_n})`,
      'vs_2honmei (target 30-40%)': pct(stats.honmei2_win, stats.honmei2_n) + ` (n=${stats.honmei2_n})`,
      'vs_3honmei (target 15-20%)': pct(stats.honmei3_win, stats.honmei3_n) + ` (n=${stats.honmei3_n})`,
      aiWins: stats.aiWins,
      flowThrough: stats.flowThrough,
      avgRounds_contested: (stats.totalRounds / Math.max(1, stats.contested)).toFixed(1),
      avgBidRatio: (stats.totalBidRatio / Math.max(1, stats.contestedBids)).toFixed(2),
    };
  },
};
