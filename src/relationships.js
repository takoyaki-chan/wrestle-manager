// ╔══════════════════════════════════════════════════════════╗
// ║  RELATIONSHIPS — 人間関係・スナップショット・対戦記録        ║
// ║  Pure logic layer — no DOM references                     ║
// ╚══════════════════════════════════════════════════════════╝

// 逓減倍率テーブル（spec §2.3）
// 同一ペア×同一イベント種別の累積回数に応じて効果が減衰する
const DIMINISHING_TABLE = [1.00, 0.70, 0.45, 0.25, 0.15];

// 逓減カウンター減衰閾値: 12週間イベント未発生でcount-1
const COUNTER_DECAY_WEEKS = 12;

// 親密度ラベル（spec §1.2）
const BOND_LABELS = [
  { max: 19, label: '嫌悪・侮蔑' },
  { max: 39, label: '苦手・不信' },
  { max: 59, label: '普通' },
  { max: 79, label: '好意・信頼' },
  { max: 100, label: '深い絆・盟友' },
];

// 競争意識ラベル（spec §1.3）
const RIVALRY_LABELS = [
  { max: 19, label: '眼中にない' },
  { max: 39, label: '少し意識' },
  { max: 59, label: '明確にライバル視' },
  { max: 79, label: '因縁レベル' },
  { max: 100, label: '宿命のライバル' },
];

// ── 性格×アーキタイプ 相性マトリクス ──
//
// 【補正値の根拠（3点チェック）】
//
// ①スケール文脈: bond 0〜100、デフォルト50の世界。
//   性格相性で±3〜±6程度は「初対面の印象差」として自然。
//   bond 50±6 = 44〜56、帯域でいえば「普通」の範囲内に収まる。
//   極端な相性（delinquent×ojousama = -6）でもガウス散らしσ=2.5で
//   最悪ケース50-6-7.5=36.5、まだ「苦手・不信」帯域の上端。
//   初期値だけで「嫌悪」帯域(0-19)には落ちない設計。
//
// ②他の補正との相対比較:
//   同団体ボーナス +3〜+8、OVR近接rivalry +2〜+6と同スケール。
//   バックストーリー初期関係（bond 70-80）のほうが圧倒的に大きい。
//   性格相性は「緩やかな傾向」を生む程度で、決定的ではない。
//
// ③プレイ体験:
//   σ=2.5のガウス散らしにより、同じ性格ペアでも個体差が出る。
//   「bold同士は大体仲良くなりやすいが、例外もいる」を再現。
//   相性の影響はPhase 2以降の試合イベント（±5〜±15）と比べて小さく、
//   プレイ中に「なんとなく仲良い/ギスギスしてる」と感じる程度。

// personality bond補正マトリクス（A→B方向、対称なので[A][B]=[B][A]）
// 正=波長が合う、負=ストレス
const PERSONALITY_BOND_MATRIX = {
  // 同性格ボーナス: 似た者同士で+2〜+3
  _same: 2,
  // 特別な組み合わせ（対称ペアで記述、両方向に適用）
  _pairs: {
    'earnest×earnest': 4,      // 努力を認め合う → 同性格+2に追加で+2
    'bold×quiet': -3,          // テンションの差がストレス
    'earnest×easygoing': -3,   // 真面目と適当の衝突
    'emotional×quiet': -2,     // 熱量の差
    'bold×bold': 3,            // 負けず嫌い同士、衝突もあるが活気がある
    'easygoing×easygoing': 3,  // ゆるい空気で居心地が良い
  }
};

// archetype bond補正マトリクス
const ARCHETYPE_BOND_MATRIX = {
  _same: 1,  // 同アーキタイプは微プラス
  _pairs: {
    'delinquent×ojousama': -6,  // 世界観の根本的な衝突
    'delinquent×polite': -4,    // 礼儀正しさと粗野さの衝突
    'cool×emotional': -3,       // coolアーキ×emotionalパーソナリティと同方向（補強）
    'seductive×earnest': -2,    // 色気路線と実直さの温度差
    'ojousama×ojousama': 3,     // 育ちの良さで通じ合う
    'delinquent×delinquent': 2, // 不良同士のシンパシー
    'cool×cool': 2,             // 互いの距離感を尊重
    'polite×ojousama': 3,       // 礼儀正しさが噛み合う
    'composed×cool': 2,         // 落ち着き同士で距離感を尊重
    'composed×polite': 2,       // 穏やかさが噛み合う
    'composed×delinquent': -3,  // 鷹揚さと粗野さの温度差
    'composed×composed': 1,     // 同アーキよりは控えめ
  }
};

// personality rivalry補正（spec §5.2）
const PERSONALITY_RIVALRY_BONUS = {
  _pairs: {
    'bold×bold': 3,       // 負けず嫌い同士は張り合う
    'earnest×earnest': 2, // 努力家同士も意識する
    'quiet×quiet': -2,    // 張り合わない
  }
};

Engine.relationships = {

  // ══════════════════════════════════════════════════════════
  //  逓減倍率の取得（spec §2.3）
  // ══════════════════════════════════════════════════════════
  getDiminishingMultiplier(count) {
    if (count <= 0) return 1.0;
    if (count >= DIMINISHING_TABLE.length) return DIMINISHING_TABLE[DIMINISHING_TABLE.length - 1];
    return DIMINISHING_TABLE[count - 1];
  },

  // ══════════════════════════════════════════════════════════
  //  キー生成ヘルパー
  // ══════════════════════════════════════════════════════════
  _key(idA, idB) { return `${idA}>${idB}`; },
  _counterKey(idA, idB, eventType, stage) { return `${idA}>${idB}:${eventType}:${stage}`; },

  // ══════════════════════════════════════════════════════════
  //  ガウス散らし（Box-Muller変換）
  // ══════════════════════════════════════════════════════════
  _gaussian(rng, sigma) {
    const u1 = Math.max(1e-10, Engine.rng.float(rng));
    const u2 = Engine.rng.float(rng);
    return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  },

  // ══════════════════════════════════════════════════════════
  //  相性軸ヘルパー (relationship-affinity-spec-v1.0 §2.2 / §4.1)
  //  キャラ固有の 360° 軸 (affinityAxis) のペア距離計算と bond 標的算出
  // ══════════════════════════════════════════════════════════
  _affinity: {
    distance(axisA, axisB) {
      if (typeof axisA !== 'number' || typeof axisB !== 'number') return 90; // 中立フォールバック
      const diff = Math.abs(axisA - axisB);
      return Math.min(diff, 360 - diff);
    },
    target(distance) {
      // bond-rebalance v2.3: レンジ拡張 (40〜60 → 30〜70)
      return 50 + 20 * Math.cos(distance * Math.PI / 180);
    },
  },

  _getAxisBounds(axis) {
    if (axis === 'bond') return { min: 0, max: 100 };
    return { min: 0, max: 100 };
  },

  _roundAxisValue(value) {
    const numeric = Number.isFinite(value) ? value : 0;
    return Math.round((numeric + Number.EPSILON) * 10) / 10;
  },

  _rollAxisValue(rng, min, max) {
    const scaledMin = Math.round(Math.min(min, max) * 10);
    const scaledMax = Math.round(Math.max(min, max) * 10);
    return Engine.rng.int(rng, scaledMin, scaledMax) / 10;
  },

  _clampAxisValue(value, axis) {
    const bounds = this._getAxisBounds(axis);
    const clamped = Engine.util.clamp(value, bounds.min, bounds.max);
    return this._roundAxisValue(clamped);
  },

  _getPositiveGainScale(axis, current) {
    if (axis === 'bond') {
      // bond-rebalance v2.3: 高bond帯の上昇逓減を緩和（80+到達を可能に）
      if (current >= 90) return 0.20;
      if (current >= 75) return 0.40;
      if (current >= 60) return 0.60;
      if (current >= 40) return 0.8;
      if (current >= 20) return 0.9;
      return 1.0;
    }
    if (current >= 95) return 0.08;
    if (current >= 90) return 0.12;
    if (current >= 80) return 0.22;
    if (current >= 70) return 0.35;
    if (current >= 60) return 0.5;
    if (current >= 40) return 0.7;
    return 1.0;
  },

  _applyAxisDelta(current, delta, axis) {
    const adjusted = delta > 0
      ? delta * this._getPositiveGainScale(axis, current)
      : delta;
    return this._clampAxisValue(current + adjusted, axis);
  },

  getBondBand(bond) {
    const b = bond != null ? bond : 50;
    if (b >= 85) return 'devoted';
    if (b >= 70) return 'close';
    if (b >= 50) return 'neutral';
    if (b >= 30) return 'strained';
    if (b >= 10) return 'hostile';
    return 'toxic';
  },

  isPositiveBond(bond) {
    return bond >= 60;
  },

  isNegativeBond(bond) {
    return bond < 50;
  },

  // ══════════════════════════════════════════════════════════
  //  性格/アーキタイプ相性ルックアップ
  // ══════════════════════════════════════════════════════════
  _getPersonalityBondAdj(pA, pB) {
    if (pA === pB) {
      const specialKey = `${pA}×${pB}`;
      return PERSONALITY_BOND_MATRIX._pairs[specialKey] ?? PERSONALITY_BOND_MATRIX._same;
    }
    const key1 = `${pA}×${pB}`;
    const key2 = `${pB}×${pA}`;
    return PERSONALITY_BOND_MATRIX._pairs[key1] ?? PERSONALITY_BOND_MATRIX._pairs[key2] ?? 0;
  },

  _getArchetypeBondAdj(aA, aB) {
    if (aA === aB && aA !== 'normal') {
      const specialKey = `${aA}×${aB}`;
      return ARCHETYPE_BOND_MATRIX._pairs[specialKey] ?? ARCHETYPE_BOND_MATRIX._same;
    }
    if (aA === 'normal' || aB === 'normal') return 0; // normalは中性
    const key1 = `${aA}×${aB}`;
    const key2 = `${aB}×${aA}`;
    return ARCHETYPE_BOND_MATRIX._pairs[key1] ?? ARCHETYPE_BOND_MATRIX._pairs[key2] ?? 0;
  },

  _getPersonalityRivalryAdj(pA, pB) {
    const key1 = `${pA}×${pB}`;
    const key2 = `${pB}×${pA}`;
    return PERSONALITY_RIVALRY_BONUS._pairs[key1] ?? PERSONALITY_RIVALRY_BONUS._pairs[key2] ?? 0;
  },

  // ══════════════════════════════════════════════════════════
  //  initialize: ドラフト完了後に全ペアの初期値を一括生成
  //  spec §5 + phase1-claude-code-instruction §実装2
  // ══════════════════════════════════════════════════════════
  initialize(state) {
    const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE1A));
    const relationships = {};

    // ── 相性軸初期化 (relationship-affinity-spec-v1.0 §3.1, 2パス) ──
    // パスA: 'auto' / 未指定キャラに 0-359 のランダム軸を割り当て
    // パスB: { pairedWith, maxOffsetDeg } 指定キャラはパートナー軸 ±maxOffset の範囲で抽選
    const affRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE90));
    const affRosters = [
      state.roster || [],
      ...Object.values(state.aiOrgs || {}).map(o => o.roster || []),
      state.freeAgents || [],
    ];
    // パスA
    for (const roster of affRosters) {
      for (const c of roster) {
        if (typeof c.affinityAxis !== 'object' || c.affinityAxis === null) {
          c.affinityAxis = Math.floor(Engine.rng.float(affRng) * 360);
        }
      }
    }
    // パスB
    const allCharIndex = new Map();
    for (const roster of affRosters) {
      for (const c of roster) allCharIndex.set(c.id, c);
    }
    for (const roster of affRosters) {
      for (const c of roster) {
        if (typeof c.affinityAxis !== 'object' || c.affinityAxis === null || !c.affinityAxis.pairedWith) continue;
        const partner = allCharIndex.get(c.affinityAxis.pairedWith);
        if (!partner || typeof partner.affinityAxis !== 'number') {
          console.warn(`[affinity] partner ${c.affinityAxis.pairedWith} not resolved for ${c.id}, falling back to random`);
          c.affinityAxis = Math.floor(Engine.rng.float(affRng) * 360);
          continue;
        }
        const maxOffset = c.affinityAxis.maxOffsetDeg || 30;
        const offset = Math.floor((Engine.rng.float(affRng) * 2 - 1) * maxOffset);
        c.affinityAxis = ((partner.affinityAxis + offset) % 360 + 360) % 360;
      }
    }

    // 全キャラを収集（プレイヤーロスター + AI団体 + FA + レンタル）
    const allChars = [];
    (state.roster || []).forEach(c => allChars.push({ id: c.id, orgId: 'player', personality: c.personality || 'normal', archetype: c.archetype || 'normal', ovr: Engine.util.ov(c) }));
    Object.entries(state.aiOrgs || {}).forEach(([orgId, org]) => {
      (org.roster || []).forEach(c => allChars.push({ id: c.id, orgId, personality: c.personality || 'normal', archetype: c.archetype || 'normal', ovr: Engine.util.ov(c) }));
    });
    (state.freeAgents || []).forEach(c => allChars.push({ id: c.id, orgId: null, personality: c.personality || 'normal', archetype: c.archetype || 'normal', ovr: Engine.util.ov(c) }));

    // Step 1: ベース値 — 全ペア bond=50, rivalry=0
    for (let i = 0; i < allChars.length; i++) {
      for (let j = 0; j < allChars.length; j++) {
        if (i === j) continue;
        const a = allChars[i], b = allChars[j];
        const key = this._key(a.id, b.id);
        relationships[key] = { bond: 50, rivalry: 0 };
      }
    }

    // Step 2: 同団体ボーナス — 同じ団体に所属するペアは bond +3〜+8
    for (let i = 0; i < allChars.length; i++) {
      for (let j = 0; j < allChars.length; j++) {
        if (i === j) continue;
        const a = allChars[i], b = allChars[j];
        if (a.orgId && a.orgId === b.orgId) {
          const key = this._key(a.id, b.id);
          relationships[key].bond += this._rollAxisValue(rng, 3, 8); // +3〜+8
        }
      }
    }

    // Step 3: OVR近接ボーナス — OVR差5以内のペアは rivalry +2〜+6
    for (let i = 0; i < allChars.length; i++) {
      for (let j = 0; j < allChars.length; j++) {
        if (i === j) continue;
        const a = allChars[i], b = allChars[j];
        if (Math.abs(a.ovr - b.ovr) <= 5) {
          const key = this._key(a.id, b.id);
          relationships[key].rivalry += this._rollAxisValue(rng, 2, 6); // +2〜+6
        }
      }
    }

    // Step 4: 性格・アーキタイプ相性補正 + ガウス散らし（σ=2.5）
    for (let i = 0; i < allChars.length; i++) {
      for (let j = 0; j < allChars.length; j++) {
        if (i === j) continue;
        const a = allChars[i], b = allChars[j];
        const key = this._key(a.id, b.id);
        // bond補正
        const pBond = this._getPersonalityBondAdj(a.personality, b.personality);
        const aBond = this._getArchetypeBondAdj(a.archetype, b.archetype);
        relationships[key].bond += pBond + aBond + this._gaussian(rng, 2.5);
        // rivalry補正
        const pRivalry = this._getPersonalityRivalryAdj(a.personality, b.personality);
        relationships[key].rivalry += pRivalry + this._gaussian(rng, 1.5);
      }
    }

    // Step 5: バックストーリー初期関係 — 同団体内から2〜4組をランダム生成
    const backstoryCount = 2 + Engine.rng.int(rng, 0, 2); // 2〜4組
    const backstoryTypes = ['同期入団', '元タッグパートナー', '過去の遺恨'];
    const usedPairs = new Set();

    // 団体ごとにグループ化（orgId !== null のキャラのみ）
    const orgGroups = {};
    allChars.forEach(c => {
      if (!c.orgId) return;
      if (!orgGroups[c.orgId]) orgGroups[c.orgId] = [];
      orgGroups[c.orgId].push(c);
    });
    const orgKeys = Object.keys(orgGroups).filter(k => orgGroups[k].length >= 2);

    for (let b = 0; b < backstoryCount && orgKeys.length > 0; b++) {
      const orgId = Engine.rng.pick(rng, orgKeys);
      const members = orgGroups[orgId];
      // ランダムにペアを選出（重複回避、最大10回試行）
      let pairFound = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const idxA = Engine.rng.int(rng, 0, members.length - 1);
        let idxB = Engine.rng.int(rng, 0, members.length - 2);
        if (idxB >= idxA) idxB++;
        const a = members[idxA], bChar = members[idxB];
        const pairKey = `${Math.min(a.id, bChar.id)}_${Math.max(a.id, bChar.id)}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);
        pairFound = true;

        const bsType = backstoryTypes[b % backstoryTypes.length];
        const keyAB = this._key(a.id, bChar.id);
        const keyBA = this._key(bChar.id, a.id);

        if (bsType === '同期入団') {
          // bond高め: 70〜80（双方向）
          relationships[keyAB].bond = this._rollAxisValue(rng, 70, 80);
          relationships[keyBA].bond = this._rollAxisValue(rng, 70, 80);
        } else if (bsType === '元タッグパートナー') {
          // bond高め: 65〜75 + rivalry中程度: 20〜30（双方向）
          relationships[keyAB].bond = this._rollAxisValue(rng, 65, 75);
          relationships[keyBA].bond = this._rollAxisValue(rng, 65, 75);
          relationships[keyAB].rivalry = this._rollAxisValue(rng, 20, 30);
          relationships[keyBA].rivalry = this._rollAxisValue(rng, 20, 30);
        } else {
          // 過去の遺恨: bond低め: 20〜30 + rivalry高め: 40〜55（双方向）
          relationships[keyAB].bond = this._rollAxisValue(rng, 20, 30);
          relationships[keyBA].bond = this._rollAxisValue(rng, 20, 30);
          relationships[keyAB].rivalry = this._rollAxisValue(rng, 40, 55);
          relationships[keyBA].rivalry = this._rollAxisValue(rng, 40, 55);
        }
        break;
      }
    }

    // Step 6: 全値クランプ
    Object.keys(relationships).forEach(key => {
      relationships[key].bond = this._clampAxisValue(relationships[key].bond, 'bond');
      relationships[key].rivalry = this._clampAxisValue(relationships[key].rivalry, 'rivalry');
    });

    return { ...state, relationships, relationshipCounters: {} };
  },

  // ══════════════════════════════════════════════════════════
  //  affinityAxis マイグレーション (relationship-affinity-spec-v1.0 §3.2)
  //  既存セーブの全キャラ（roster / aiOrgs / freeAgents / retired）に
  //  ランダム軸を後付けする。設計ペアは新規ゲーム限定なので等価ランダム置換。
  // ══════════════════════════════════════════════════════════
  migrateAffinityAxisV1(state) {
    if (state._migrated_affinity_v1) return state;
    const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 0, 0xBE90));
    const fixOne = (c) => {
      if (typeof c.affinityAxis !== 'number') {
        c.affinityAxis = Math.floor(Engine.rng.float(rng) * 360);
      }
    };
    (state.roster || []).forEach(fixOne);
    Object.values(state.aiOrgs || {}).forEach(org => (org.roster || []).forEach(fixOne));
    (state.freeAgents || []).forEach(fixOne);
    (state.retiredFighters || []).forEach(fixOne);
    (state.dormantPool || []).forEach(fixOne);
    return { ...state, _migrated_affinity_v1: true };
  },

  // ══════════════════════════════════════════════════════════
  //  isInContact: 接触状態判定
  //  同団体 OR 直近4週以内に対戦（2興行以内）
  // ══════════════════════════════════════════════════════════
  isInContact(state, charIdA, charIdB) {
    // 1. 同団体チェック
    const orgA = this._getCharOrgId(state, charIdA);
    const orgB = this._getCharOrgId(state, charIdB);
    if (orgA && orgB && orgA === orgB) return true;

    // 2. 直近4週以内の対戦チェック（matchupLog: 2興行=4週間）
    const recentThreshold = (state.totalShows || 0) - 1; // 直近2興行
    const log = state.matchupLog || [];
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i];
      if ((e.showCount || 0) < recentThreshold) break; // 古いエントリに到達
      if ((e.leftId === charIdA && e.rightId === charIdB) ||
          (e.leftId === charIdB && e.rightId === charIdA)) {
        return true;
      }
    }

    // AI団体のmatchupLogもチェック
    const aiOrgs = state.aiOrgs || {};
    for (const orgId of Object.keys(aiOrgs)) {
      const orgLog = aiOrgs[orgId].matchupLog || [];
      // AI団体のshowCountはorg固有なので、直近の数エントリだけチェック
      // AI側は1興行/週なので、4週=直近4エントリ程度
      const startIdx = Math.max(0, orgLog.length - 4);
      for (let i = orgLog.length - 1; i >= startIdx; i--) {
        const e = orgLog[i];
        if ((e.leftId === charIdA && e.rightId === charIdB) ||
            (e.leftId === charIdB && e.rightId === charIdA)) {
          return true;
        }
      }
    }

    return false;
  },

  // キャラの所属団体IDを取得するヘルパー
  _getCharOrgId(state, charId) {
    if ((state.roster || []).some(c => c.id === charId)) return 'player';
    for (const [orgId, org] of Object.entries(state.aiOrgs || {})) {
      if ((org.roster || []).some(c => c.id === charId)) return orgId;
    }
    return null; // FA or 不明
  },

  // ══════════════════════════════════════════════════════════
  //  processWeeklyDecay: 毎週の自然減衰/凍結処理
  //  spec §2.1 + phase1-claude-code-instruction §実装4
  //  tickWeek内で呼び出す
  // ══════════════════════════════════════════════════════════
  processWeeklyDecay(state, rng) {
    Engine.relationships.flags._ensureInit(state);
    const rels = state.relationships;
    if (!rels || Object.keys(rels).length === 0) return state;

    // ── パフォーマンス最適化: ルックアップテーブル事前構築 ──
    // charId→orgId マップ（毎回scanを避ける）
    const charOrgMap = new Map();
    (state.roster || []).forEach(c => charOrgMap.set(c.id, 'player'));
    Object.entries(state.aiOrgs || {}).forEach(([orgId, org]) => {
      (org.roster || []).forEach(c => charOrgMap.set(c.id, orgId));
    });

    // 直近4週以内の対戦ペアセット（双方向）
    const recentMatchPairs = new Set();
    const recentThreshold = (state.totalShows || 0) - 1;
    const log = state.matchupLog || [];
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i];
      if ((e.showCount || 0) < recentThreshold) break;
      recentMatchPairs.add(`${e.leftId}>${e.rightId}`);
      recentMatchPairs.add(`${e.rightId}>${e.leftId}`);
    }
    // AI団体のmatchupLogもチェック（直近4エントリ）
    Object.values(state.aiOrgs || {}).forEach(org => {
      const orgLog = org.matchupLog || [];
      const startIdx = Math.max(0, orgLog.length - 4);
      for (let i = orgLog.length - 1; i >= startIdx; i--) {
        const e = orgLog[i];
        recentMatchPairs.add(`${e.leftId}>${e.rightId}`);
        recentMatchPairs.add(`${e.rightId}>${e.leftId}`);
      }
    });

    // Phase 4 G-04/G-05: OVR差チェック用マップ
    const charOvrMap = new Map();
    (state.roster || []).forEach(c => charOvrMap.set(c.id, Engine.util.ov(c)));
    Object.values(state.aiOrgs || {}).forEach(org => {
      (org.roster || []).forEach(c => charOvrMap.set(c.id, Engine.util.ov(c)));
    });

    // Phase 4: 性格/年齢/スタイル情報マップ
    const charInfoMap = new Map();
    (state.roster || []).forEach(c => charInfoMap.set(c.id, {
      personality: c.personality || 'normal',
      archetype: c.archetype || 'normal',
      age: c.age || 20,
      style: c.style || 'Allround',
      affinityAxis: c.affinityAxis,
    }));
    Object.values(state.aiOrgs || {}).forEach(org => {
      (org.roster || []).forEach(c => charInfoMap.set(c.id, {
        personality: c.personality || 'normal',
        archetype: c.archetype || 'normal',
        age: c.age || 20,
        style: c.style || 'Allround',
      }));
    });

    // Phase 4: 団体ごとのOVR上位5位IDセット（タイトル圏判定用）
    const orgTopRankMap = new Map();
    const playerSorted = [...(state.roster || [])].filter(c => !c.injury).sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a));
    orgTopRankMap.set('player', new Set(playerSorted.slice(0, 5).map(c => c.id)));
    Object.entries(state.aiOrgs || {}).forEach(([orgId, org]) => {
      const sorted = [...(org.roster || [])].filter(c => !c.injury).sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a));
      orgTopRankMap.set(orgId, new Set(sorted.slice(0, 5).map(c => c.id)));
    });

    const newRels = {};
    const absWeek = Engine.util.absWeek(state.season, state.week);

    // 全エントリ走査
    for (const key of Object.keys(rels)) {
      const r = rels[key];
      // §2.3: 引退者を含むペアは凍結（decay対象外）
      if (r.frozen) { newRels[key] = r; continue; }
      let bond = r.bond;
      let rivalry = r.rivalry;

      // キーからIDペアを取得: "idA>idB"
      const sepIdx = key.indexOf('>');
      const idA = parseInt(key.substring(0, sepIdx), 10);
      const idB = parseInt(key.substring(sepIdx + 1), 10);

      // 接触判定（事前構築マップ使用）
      const orgA = charOrgMap.get(idA);
      const orgB = charOrgMap.get(idB);
      const sameOrg = orgA && orgB && orgA === orgB;
      const inContact = sameOrg || recentMatchPairs.has(key);

      if (inContact) {
        // affinity-spec v1.0 §5.1: bondPull 半減 + 加速項撤廃 + 相性軸による標的シフト
        const infoForA = charInfoMap.get(idA);
        const infoForB = charInfoMap.get(idB);
        const axisA = (infoForA && typeof infoForA.affinityAxis === 'number') ? infoForA.affinityAxis : null;
        const axisB = (infoForB && typeof infoForB.affinityAxis === 'number') ? infoForB.affinityAxis : null;
        const dist = Engine.relationships._affinity.distance(axisA, axisB);
        const target = Engine.relationships._affinity.target(dist);
        // bond-rebalance v2.3: target拡張(30〜70)に伴い引力をさらに弱める (0.08〜0.14 → 0.03〜0.06)
        const bondPull = 0.03 + Engine.rng.float(rng) * 0.03;
        if (bond > target) {
          bond -= bondPull;
        } else if (bond < target) {
          bond += bondPull;
        }

        let rivalryDecay = 0.28 + Engine.rng.float(rng) * 0.22;
        if (rivalry >= 85) rivalryDecay += 0.45;
        else if (rivalry >= 70) rivalryDecay += 0.25;
        else if (rivalry >= 50) rivalryDecay += 0.12;
        rivalry -= rivalryDecay;
      } else {
        let rivalryDecay = 0.16;
        if (rivalry >= 85) rivalryDecay += 0.45;
        else if (rivalry >= 70) rivalryDecay += 0.28;
        else if (rivalry >= 50) rivalryDecay += 0.14;
        else if (rivalry >= 30) rivalryDecay += 0.06;
        // §4.1: knownRival なら減衰を1/3に
        if (r.knownRival) rivalryDecay *= (1 / 3);
        rivalry -= rivalryDecay;
        // §4.3: 「意識している」マイクロイベント（knownRival + 4週に1回 + rivalry60未満）
        if (r.knownRival && absWeek % 4 === 0 && rivalry < 60) {
          rivalry += 0.3 + Engine.rng.float(rng) * 0.2;
        }
      }

      // 同団体所属ボーナス（spec §3.2 O-01）
      // bond-rebalance v2.3: 天井を 60 → 70 に引き上げ（同団体長期で自然に bond70 へ）
      if (sameOrg && bond < 68) {
        const orgBondGain = 0.06 + Engine.rng.float(rng) * 0.08;
        const ceiling = bond < 58 ? 1.0 : Math.max(0, (68 - bond) / 10);
        bond = this._applyAxisDelta(bond, orgBondGain * ceiling, 'bond');
      }

      // Phase 4 B: 性格不一致の週次摩擦
      // 条件: 同団体 かつ 性格+アーキタイプ相性 <= -3
      if (sameOrg) {
        const infoA = charInfoMap.get(idA);
        const infoB = charInfoMap.get(idB);
        if (infoA && infoB) {
          const pAdj = Engine.relationships._getPersonalityBondAdj(infoA.personality, infoB.personality);
          const aAdj = Engine.relationships._getArchetypeBondAdj(infoA.archetype, infoB.archetype);
          if (pAdj + aAdj <= -3) {
            bond -= 0.20;  // 相性の悪い同団体ペアは週次でじわじわ冷える
          }
        }
      }

      // Phase 4 C: 世代近接ボーナス（同団体 + 年齢差3以内）
      // 同団体ボーナスの60天井とは別枠。接触中の自然減衰と合わせて65程度が実質天井
      if (sameOrg) {
        const infoA = charInfoMap.get(idA);
        const infoB = charInfoMap.get(idB);
        if (infoA && infoB && bond < 60 && Math.abs(infoA.age - infoB.age) <= 3) {
          bond = this._applyAxisDelta(bond, 0.08, 'bond');  // 同世代補正は中立帯までに限定
        }
      }

      // Phase 4: G-04/G-05 OVR差による週次rivalry変動 + 試合外競争意識
      const ovrA = charOvrMap.get(idA);
      const ovrB = charOvrMap.get(idB);
      if (ovrA !== undefined && ovrB !== undefined) {
        const ovrDiff = Math.abs(ovrA - ovrB);
        if (ovrDiff >= 10 && rivalry >= 20 && ovrA > ovrB) {
          // G-04: 高い側→低い側 rivalry -2~-4/週（据え置き）
          rivalry -= 2 + Engine.rng.float(rng) * 2;
        } else if (ovrDiff <= 5 && absWeek % 4 === 0) {
          // G-05: OVR近接 rivalry +2~+4 (4週に1回、基本値微減)
          if (rivalry >= 10) {
            rivalry = this._applyAxisDelta(rivalry, 2 + Engine.rng.float(rng) * 2, 'rivalry');
          }

          // Phase 4 D-1: 同スタイル上乗せ（OVR差5以内 + 同スタイル + 同団体）
          if (sameOrg) {
            const infoA = charInfoMap.get(idA);
            const infoB = charInfoMap.get(idB);
            if (infoA && infoB && infoA.style === infoB.style && infoA.style !== 'Allround') {
              rivalry = this._applyAxisDelta(rivalry, 1 + Engine.rng.float(rng), 'rivalry'); // same-style position battle
            }
            const pAdj = Engine.relationships._getPersonalityBondAdj(infoA?.personality, infoB?.personality);
            const aAdj = Engine.relationships._getArchetypeBondAdj(infoA?.archetype, infoB?.archetype);
            if (bond < 45 && (pAdj + aAdj) <= -3) {
              rivalry = this._applyAxisDelta(rivalry, 0.8 + Engine.rng.float(rng) * 0.8, 'rivalry');
            }
          }
        }

        // Phase 4 D-2: タイトル圏の競争意識（同団体 + 双方OVR上位5位 + 4週に1回）
        if (sameOrg && absWeek % 4 === 0) {
          const orgId = orgA; // orgA === orgB（sameOrg判定済み）
          const topSet = orgTopRankMap.get(orgId);
          if (topSet && topSet.has(idA) && topSet.has(idB)) {
            rivalry = this._applyAxisDelta(rivalry, 0.5 + Engine.rng.float(rng) * 0.5, 'rivalry'); // +0.5~+1.0
          }
        }
      }

      // §4.1: knownRival フラグ管理（rivalry40+で付与、10未満で解除）
      let knownRival = r.knownRival || false;
      const clampedRivalry = this._clampAxisValue(rivalry, 'rivalry');
      if (clampedRivalry >= 40) knownRival = true;
      if (clampedRivalry < 10) knownRival = false;
      newRels[key] = {
        bond: this._clampAxisValue(bond, 'bond'),
        rivalry: clampedRivalry,
        ...(knownRival ? { knownRival: true } : {}),
      };
    }

    // N-03: Babyface×Heel 週次衝突（同団体内, 12%/ペア/週）
    // 埋もれがちな対立の供給源を少し強化
    const n03Rng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 42, absWeek, 0xBE6A));
    const n03ModalEnqueues = [];
    const processRoleClash = (orgRoster) => {
      if (!orgRoster || orgRoster.length === 0) return;
      const bfIds = orgRoster.filter(c => c.role === 'Babyface' && !c.injury).map(c => c.id);
      const heelIds = orgRoster.filter(c => c.role === 'Heel' && !c.injury).map(c => c.id);
      if (bfIds.length === 0 || heelIds.length === 0) return;
      for (const bfId of bfIds) {
        for (const heelId of heelIds) {
          if (Engine.rng.float(n03Rng) >= 0.12) continue;
          const bondDelta = -(6 + Engine.rng.float(n03Rng) * 4); // -6〜-10
          const rivalryDelta = 4 + Engine.rng.float(n03Rng) * 4; // +4〜+8
          const keyAB = this._key(bfId, heelId);
          const keyBA = this._key(heelId, bfId);
          const rAB = newRels[keyAB] || { bond: 50, rivalry: 0 };
          const rBA = newRels[keyBA] || { bond: 50, rivalry: 0 };
          newRels[keyAB] = { ...rAB, bond: this._clampAxisValue(rAB.bond + bondDelta, 'bond'), rivalry: this._clampAxisValue(rAB.rivalry + rivalryDelta, 'rivalry') };
          newRels[keyBA] = { ...rBA, bond: this._clampAxisValue(rBA.bond + bondDelta, 'bond'), rivalry: this._clampAxisValue(rBA.rivalry + rivalryDelta, 'rivalry') };
          n03ModalEnqueues.push({
            fromId: bfId,
            toId: heelId,
            bondDelta,
            rivalryDelta,
            cooldownKey: `modal:M19:${Engine.relationships.flags._pairKey(bfId, heelId)}`,
          });
        }
      }
    };
    processRoleClash(state.roster || []);
    Object.values(state.aiOrgs || {}).forEach(org => processRoleClash(org.roster || []));

    // ═══ N-07: 価値観の決裂（bond-rebalance v2.3） ═══
    // 同団体 + 性格相性+アーキタイプ相性 ≤ -3 + bond < 35 のペアが
    // 双方向 bond -8〜-12 / rivalry +3〜+6 で決定的に冷える。
    // per-pair 1回限り (r.valueRift フラグ)、per-org シーズン1回限り
    const n07Rng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 42, absWeek, 0xF7A1));
    const valueRiftByOrg = { ...(state.valueRiftSeasonByOrg || {}) };
    const n07ModalEnqueues = []; // 後で outState に対して enqueue
    const tryValueRift = (orgRoster, orgKey) => {
      if (valueRiftByOrg[orgKey] === state.season) return;
      if (!orgRoster || orgRoster.length < 2) return;
      const candidates = [];
      for (let i = 0; i < orgRoster.length; i++) {
        for (let j = i + 1; j < orgRoster.length; j++) {
          const a = orgRoster[i], b = orgRoster[j];
          if (!a || !b || a.injury || b.injury) continue;
          const keyAB = `${a.id}>${b.id}`;
          const keyBA = `${b.id}>${a.id}`;
          const rAB = newRels[keyAB];
          const rBA = newRels[keyBA];
          if (!rAB || !rBA) continue;
          if (rAB.valueRift || rBA.valueRift) continue;
          if (rAB.bond >= 35 || rBA.bond >= 35) continue;
          const pAdj = Engine.relationships._getPersonalityBondAdj(a.personality, b.personality);
          const aAdj = Engine.relationships._getArchetypeBondAdj(a.archetype, b.archetype);
          if (pAdj + aAdj > -3) continue;
          candidates.push({ a, b, keyAB, keyBA });
        }
      }
      if (candidates.length === 0) return;
      const pick = candidates[Math.floor(Engine.rng.float(n07Rng) * candidates.length)];
      const bondDelta = -(12 + Engine.rng.float(n07Rng) * 6);
      const rivalryDelta = 5 + Engine.rng.float(n07Rng) * 4;
      for (const k of [pick.keyAB, pick.keyBA]) {
        const r = newRels[k];
        newRels[k] = {
          ...r,
          bond: this._clampAxisValue(r.bond + bondDelta, 'bond'),
          rivalry: this._clampAxisValue(r.rivalry + rivalryDelta, 'rivalry'),
          valueRift: true,
        };
      }
      valueRiftByOrg[orgKey] = state.season;
      n07ModalEnqueues.push({ fromId: pick.a.id, toId: pick.b.id });
    };
    tryValueRift(state.roster || [], 'player');
    Object.entries(state.aiOrgs || {}).forEach(([oid, org]) => tryValueRift(org.roster || [], oid));

    // 逓減カウンター減衰
    const counters = { ...(state.relationshipCounters || {}) };
    const keysToDelete = [];
    for (const cKey of Object.keys(counters)) {
      const c = counters[cKey];
      if (absWeek - c.lastWeek >= COUNTER_DECAY_WEEKS) {
        c.count--;
        c.lastWeek = absWeek;
        if (c.count <= 0) {
          keysToDelete.push(cKey);
        } else {
          counters[cKey] = { ...c };
        }
      }
    }
    keysToDelete.forEach(k => delete counters[k]);

    let outState = { ...state, relationships: newRels, relationshipCounters: counters, valueRiftSeasonByOrg: valueRiftByOrg };

    // N-07 のモーダル enqueue
    for (const m of n07ModalEnqueues) {
      if (Engine.relationships.flags && Engine.relationships.flags._enqueueModal) {
        outState = Engine.relationships.flags._enqueueModal(outState, 'M-18', m);
      }
    }
    for (const m of n03ModalEnqueues) {
      if (Engine.relationships.flags && Engine.relationships.flags._enqueueModalWithCooldown) {
        outState = Engine.relationships.flags._enqueueModalWithCooldown(
          outState,
          'M-19',
          { fromId: m.fromId, toId: m.toId, bondDelta: m.bondDelta, rivalryDelta: m.rivalryDelta },
          m.cooldownKey,
          26
        );
      }
    }

    // relationship-flags-spec-v1.0 §2.3: F-3 師弟候補処理
    outState = Engine.relationships.flags.processMasterCandidates(outState);

    // §2.6: F-6 憧れ消滅判定（引退・幻滅は週次でも再評価）
    outState = Engine.relationships.flags.checkAdmireDissolution(outState);

    // §2.7: F-7 嫉妬の引退検出 + 風化判定
    outState = Engine.relationships.flags.checkEnvyDissolution(outState);
    outState = Engine.relationships.flags.processEnvyAging(outState);

    return outState;
  },

  processWeeklyStoryEvents(state, rng) {
    if (!state.relationships || !state.roster) return { state, events: [] };

    let relationships = { ...state.relationships };
    let roster = (state.roster || []).map(f => {
      const clean = { ...f };
      delete clean._relationshipGrowthMult;
      delete clean._relationshipInjuryMult;
      delete clean._warningTrustDebuff;
      delete clean._isolationDebuff;
      return clean;
    });
    let rivalries = { ...(state.rivalries || {}) };
    let orgPop = state.orgPop || 0;
    let lockerRoomMorale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    const events = [];
    const activeRoster = roster.filter(f => !f.injury && !f.isRental);
    const rosterIndex = new Map(roster.map((f, idx) => [f.id, idx]));
    const participated = new Set();
    (state.lastShowResults || []).forEach(r => {
      if (r.matchType === 'tag') { Object.keys(r.perFighter).forEach(id => participated.add(Number(id))); }
      else { participated.add(r.left.id); participated.add(r.right.id); }
    });

    const updateFighter = (fighterId, updater) => {
      const idx = rosterIndex.get(fighterId);
      if (idx == null) return;
      roster[idx] = updater(roster[idx]);
    };
    const applyTrustDelta = (fighterId, rawDelta) => {
      updateFighter(fighterId, fighter => {
        const oldTrust = fighter.trust != null ? fighter.trust : 50;
        const adjusted = rawDelta * Engine.trust.trustSensitivity(oldTrust);
        return { ...fighter, trust: Engine.util.clamp(oldTrust + adjusted, 0, 100) };
      });
    };
    const applyConditionDelta = (fighterId, delta) => {
      updateFighter(fighterId, fighter => ({ ...fighter, condition: Engine.util.clamp((fighter.condition || 70) + delta, 0, 100) }));
    };
    const markGrowthPressure = (fighterId, growthMult, injuryMult) => {
      updateFighter(fighterId, fighter => ({
        ...fighter,
        _relationshipGrowthMult: Math.max(fighter._relationshipGrowthMult || 1.0, growthMult),
        _relationshipInjuryMult: Math.max(fighter._relationshipInjuryMult || 1.0, injuryMult),
      }));
    };

    let moralePenaltyRaw = 0;
    const pairEventNames = [];
    const hostilePairNames = []; // M1: 敵対ペア名追跡
    let hostilePairCount = 0; // bond-rivalry plan P-4: 同団体内 bond ≤ 30 ペア集計
    // bond-rivalry plan P-6: W-1（憎い敵ゾーン）累計発火カウント
    if (!state.w1FireCount) state.w1FireCount = {};

    // ティッカーテキストヘルパー: テンプレートプールからランダムピック＋名前差し込み
    const _pick = (pool, nameA, nameB) => {
      const tpl = pool[Engine.rng.int(rng, 0, pool.length - 1)];
      return tpl.replace(/\{nameA\}/g, nameA).replace(/\{nameB\}/g, nameB).replace(/\{name\}/g, nameA);
    };

    for (let i = 0; i < activeRoster.length; i++) {
      for (let j = i + 1; j < activeRoster.length; j++) {
        const left = activeRoster[i];
        const right = activeRoster[j];
        const keyAB = `${left.id}>${right.id}`;
        const keyBA = `${right.id}>${left.id}`;
        const relAB = state.relationships[keyAB] || { bond: 50, rivalry: 0 };
        const relBA = state.relationships[keyBA] || { bond: 50, rivalry: 0 };
        const pairState = Engine.title.getRivalryPairState({ ...state, roster, rivalries }, left.id, right.id);

        // ── 親友ゾーン（bond70+, rivalry40未満）──
        if (pairState.minBond >= 70 && pairState.maxRivalry < 40) {
          if (participated.has(left.id) && participated.has(right.id)) {
            const recover = pairState.minBond >= 85 ? 2 : 1;
            applyConditionDelta(left.id, recover);
            applyConditionDelta(right.id, recover);
          }
          if (left.slump) {
            updateFighter(left.id, fighter => ({ ...fighter, slump: { ...fighter.slump, recoveryMomentum: (fighter.slump.recoveryMomentum || 0) + 3 } }));
          }
          if (right.slump) {
            updateFighter(right.id, fighter => ({ ...fighter, slump: { ...fighter.slump, recoveryMomentum: (fighter.slump.recoveryMomentum || 0) + 3 } }));
          }
        }

        // bond-rivalry plan P-4: 同団体内 bond ≤ 30 ペア集計
        if (Math.min(relAB.bond, relBA.bond) <= 30) {
          hostilePairCount++;
        }

        // ── 憎い敵ゾーン（rivalry40+, bond40未満）──
        if (pairState.minRivalry >= 40 && Math.max(relAB.bond, relBA.bond) < 40) {
          moralePenaltyRaw += 0.7;
          hostilePairNames.push([left.name, right.name]); // M1
          markGrowthPressure(left.id, 1.2, 1.15);
          markGrowthPressure(right.id, 1.2, 1.15);
          // bond-rivalry plan P-6: W-1 累計発火カウント
          const w1Key = `${Math.min(left.id, right.id)}_${Math.max(left.id, right.id)}`;
          state.w1FireCount[w1Key] = (state.w1FireCount[w1Key] || 0) + 1;
          if (Engine.rng.float(rng) < 0.05) {
            const clashBonus = 1 + Engine.rng.int(rng, 0, 1);
            const clashDamage = 2 + Engine.rng.int(rng, 0, 1);
            const pairKey = Engine.title.getRivalryKey(left.id, right.id);
            rivalries[pairKey] = { ...(rivalries[pairKey] || {}), pendingClashBonus: Math.max((rivalries[pairKey]?.pendingClashBonus || 0), clashBonus) };
            applyConditionDelta(left.id, -clashDamage);
            applyConditionDelta(right.id, -clashDamage);
            applyTrustDelta(left.id, -0.4);
            applyTrustDelta(right.id, -0.4);
            pairEventNames.push(_pick(WEEKLY_STORY_TICKER.clash, left.name, right.name));
          }
        }

        // ── 好敵手的ゾーン（rivalry40+, bond50+）──
        if (pairState.minRivalry >= 40 && pairState.minBond >= 50) {
          markGrowthPressure(left.id, 1.1, 1.0);
          markGrowthPressure(right.id, 1.1, 1.0);
        }

        // ── 片思い（A→B bond70+ / B→A bond40以下, 差30+）──
        if (relAB.bond >= 70 && relBA.bond <= 40 && (relAB.bond - relBA.bond) >= 30) {
          applyTrustDelta(left.id, -0.3);
        }
        if (relBA.bond >= 70 && relAB.bond <= 40 && (relBA.bond - relAB.bond) >= 30) {
          applyTrustDelta(right.id, -0.3);
        }

        // ── 一方的な敵意（A→B rivalry50+ bond30以下 / B→A rivalry20以下）──
        if (relAB.rivalry >= 50 && relAB.bond <= 30 && relBA.rivalry < 20) {
          applyTrustDelta(left.id, -0.4);
          markGrowthPressure(left.id, 1.15, 1.15);
          if (Engine.rng.float(rng) < 0.035) {
            applyConditionDelta(left.id, -2);
            const boosted = { ...(relationships[keyBA] || { bond: 50, rivalry: 0 }) };
            boosted.rivalry = this._clampAxisValue((boosted.rivalry || 0) + 2, 'rivalry');
            relationships[keyBA] = boosted;
          }
        }
        if (relBA.rivalry >= 50 && relBA.bond <= 30 && relAB.rivalry < 20) {
          applyTrustDelta(right.id, -0.4);
          markGrowthPressure(right.id, 1.15, 1.15);
          if (Engine.rng.float(rng) < 0.035) {
            applyConditionDelta(right.id, -2);
            const boosted = { ...(relationships[keyAB] || { bond: 50, rivalry: 0 }) };
            boosted.rivalry = this._clampAxisValue((boosted.rivalry || 0) + 2, 'rivalry');
            relationships[keyAB] = boosted;
          }
        }

        // ── 完全断絶（Cold Severance）: bond ≤ 10 ∧ rivalry < 30 ──
        // bond-rivalry plan 2026-04-29 P-8: 無関心の極地、月1回程度 trust −0.5
        // 方向別判定: left→right と right→left を独立に見る
        if (relAB.bond <= 10 && relAB.rivalry < 30 && Engine.rng.float(rng) < 0.25) {
          applyTrustDelta(left.id, -0.5);
        }
        if (relBA.bond <= 10 && relBA.rivalry < 30 && Engine.rng.float(rng) < 0.25) {
          applyTrustDelta(right.id, -0.5);
        }

        // ── クロス非対称 覚醒イベント（A:高riv低bond / B:低riv高bond → Bキレ）──
        // bond-rivalry plan 2026-04-29: キャラ生涯1回キャップ（_awakened フラグ）
        if (relAB.rivalry >= 50 && relAB.bond <= 30 && relBA.rivalry < 20 && relBA.bond >= 60 && !right._awakened) {
          if (Engine.rng.float(rng) < 0.015) {
            // 覚醒: B→A rivalry大幅上昇, bond低下
            const awakeRiv = 15 + Engine.rng.int(rng, 0, 5);
            const awakeBondDrop = -(10 + Engine.rng.int(rng, 0, 5));
            const boostedBA = { ...(relationships[keyBA] || { bond: 50, rivalry: 0 }) };
            boostedBA.rivalry = this._clampAxisValue((boostedBA.rivalry || 0) + awakeRiv, 'rivalry');
            boostedBA.bond = this._clampAxisValue((boostedBA.bond || 50) + awakeBondDrop, 'bond');
            relationships[keyBA] = boostedBA;
            updateFighter(right.id, fighter => ({ ...fighter, _awakened: true }));
            // right=B(覚醒する側)のpersonality×archetypeでセリフ選出
            const awPool1 = getDialoguePool(WEEKLY_STORY_TICKER.awakening, right);
            const awTpl1 = awPool1[Engine.rng.int(rng, 0, awPool1.length - 1)];
            events.push(`[awakening] ${awTpl1.replace(/\{nameA\}/g, left.name).replace(/\{nameB\}/g, right.name)}`);
          }
        }
        if (relBA.rivalry >= 50 && relBA.bond <= 30 && relAB.rivalry < 20 && relAB.bond >= 60 && !left._awakened) {
          if (Engine.rng.float(rng) < 0.015) {
            const awakeRiv = 15 + Engine.rng.int(rng, 0, 5);
            const awakeBondDrop = -(10 + Engine.rng.int(rng, 0, 5));
            const boostedAB = { ...(relationships[keyAB] || { bond: 50, rivalry: 0 }) };
            boostedAB.rivalry = this._clampAxisValue((boostedAB.rivalry || 0) + awakeRiv, 'rivalry');
            boostedAB.bond = this._clampAxisValue((boostedAB.bond || 50) + awakeBondDrop, 'bond');
            relationships[keyAB] = boostedAB;
            updateFighter(left.id, fighter => ({ ...fighter, _awakened: true }));
            // left=B(覚醒する側)のpersonality×archetypeでセリフ選出
            const awPool2 = getDialoguePool(WEEKLY_STORY_TICKER.awakening, left);
            const awTpl2 = awPool2[Engine.rng.int(rng, 0, awPool2.length - 1)];
            events.push(`[awakening] ${awTpl2.replace(/\{nameA\}/g, right.name).replace(/\{nameB\}/g, left.name)}`);
          }
        }
      }
    }

    // ── trust警告帯ティッカー（trust 40-49）──
    roster = roster.map(f => {
      const trust = f.trust != null ? f.trust : 50;
      if (trust >= 40 && trust <= 49) return { ...f, _warningTrustDebuff: true };
      return f;
    });
    const warningNames = roster.filter(f => {
      const trust = f.trust != null ? f.trust : 50;
      return trust >= 40 && trust <= 49;
    }).slice(0, 2).map(f => f.name);
    warningNames.forEach(name => events.push(`[trust-warning] ${_pick(WEEKLY_STORY_TICKER.trustWarning, name, '')}`));

    // ── 憎い敵ゾーンのモラルペナルティ ──
    const moraleDelta = -Math.min(3, moralePenaltyRaw);
    if (moraleDelta < 0) {
      lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + moraleDelta, 0, 100);
      // M1: ペア名を含むティッカーテキスト
      const pairHint = hostilePairNames.length > 0
        ? `（${hostilePairNames.slice(0, 2).map(p => `${p[0]}と${p[1]}`).join('、')}）`
        : '';
      events.push(`[hostile-pairs] ロッカールームの空気が重い${pairHint}`);
    }

    // bond-rivalry plan P-4: ロッカー荒廃モーダル（同団体 bond≤30 ペアが3組以上）
    // 1シーズン1回（13週クールダウン）
    if (hostilePairCount >= 3) {
      const absWeek = Engine.util.absWeek(state.season, state.week);
      const lastCrisis = state._lockerCrisisWeek || -999999;
      if (absWeek - lastCrisis >= 13) {
        state._lockerCrisisWeek = absWeek;
        lockerRoomMorale = Engine.util.clamp(lockerRoomMorale - 2, 0, 100);
        orgPop = Engine.util.clamp(orgPop - 1, 0, 100);
        if (Engine.relationships.flags && Engine.relationships.flags._enqueueModal) {
          Engine.relationships.flags._enqueueModal(state, 'M-24', {
            hostileCount: hostilePairCount,
            pairs: hostilePairNames.slice(0, 3),
            season: state.season, week: state.week,
          });
        }
        events.push(`[locker-crisis] ロッカールームに不穏な空気が広がっている（険悪ペア${hostilePairCount}組）`);
        // 業界ニュース: ロッカー荒廃を新聞に
        if (Engine.industryNews) {
          state = Engine.industryNews.push(state, {
            type: 'lockerRoomCrisis',
            characterId: null,
            data: { org: state.orgName || 'プレイヤー団体', count: hostilePairCount },
          });
        }
      }
      // TODO: 5組以上 → 派閥スピンオフ（faction-system 未実装のため保留）
    }

    // bond-rivalry plan P-4: 嫌悪伝染（emotional 系の選手が親友の嫌悪を引き継ぐ、月1回）
    {
      const absWeek = Engine.util.absWeek(state.season, state.week);
      if (!state._contagionLastWeek) state._contagionLastWeek = {};
      activeRoster.forEach(carrier => {
        if (carrier.personality !== 'emotional') return;
        if (Engine.rng.float(rng) >= 0.25) return; // 月1回程度
        // carrier の親友（bond ≥ 60）を検索
        const friendIds = [];
        Object.keys(relationships).forEach(key => {
          if (!key.startsWith(`${carrier.id}>`)) return;
          if ((relationships[key].bond || 0) >= 60) {
            friendIds.push(parseInt(key.split('>')[1]));
          }
        });
        if (friendIds.length === 0) return;
        const friendId = friendIds[Engine.rng.int(rng, 0, friendIds.length - 1)];
        // friend が誰かを bond ≤ 15 で嫌っているか
        const enemyIds = [];
        Object.keys(relationships).forEach(key => {
          if (!key.startsWith(`${friendId}>`)) return;
          const targetId = parseInt(key.split('>')[1]);
          if (targetId === carrier.id) return; // 自分には伝染しない
          if ((relationships[key].bond != null ? relationships[key].bond : 50) <= 15) {
            enemyIds.push(targetId);
          }
        });
        if (enemyIds.length === 0) return;
        const enemyId = enemyIds[Engine.rng.int(rng, 0, enemyIds.length - 1)];
        // クールダウン: 4週/(carrier, enemy)ペア
        const ckey = `${carrier.id}>${enemyId}`;
        if ((absWeek - (state._contagionLastWeek[ckey] || -999999)) < 4) return;
        state._contagionLastWeek[ckey] = absWeek;
        // carrier→enemy bond -1〜-2
        const drop = -(1 + Engine.rng.int(rng, 0, 1));
        const cur = relationships[ckey] || { bond: 50, rivalry: 0 };
        const next = { ...cur, bond: this._clampAxisValue((cur.bond != null ? cur.bond : 50) + drop, 'bond') };
        relationships[ckey] = next;
        const enemyName = (activeRoster.find(f => f.id === enemyId) || {}).name || '';
        const friendName = (activeRoster.find(f => f.id === friendId) || {}).name || '';
        if (enemyName && friendName) {
          events.push(`[contagion] ${carrier.name}は${friendName}が${enemyName}を嫌うのを見て、自分も心が冷えていくのを感じた`);
        }
      });
    }
    if (pairEventNames.length > 0) {
      pairEventNames.slice(0, 2).forEach(text => events.push(`[rivalry-clash] ${text}`));
    }

    // ── T4-T7: trust不満系ティッカー（_grievanceFlagsが立っている選手） ──
    const grievanceTickers = [];
    roster.forEach(f => {
      if (!f._grievanceFlags) return;
      const gf = f._grievanceFlags;
      if (gf.G1) grievanceTickers.push(`[grievance] ${f.name}が給料への不満を漏らしているようだ`);
      if (gf.G2) {
        const juniorName = gf.G2_juniorId ? (roster.find(r => r.id === gf.G2_juniorId) || {}).name : null;
        grievanceTickers.push(`[grievance] ${f.name}が後輩${juniorName ? '（' + juniorName + '）' : ''}の待遇に不満を感じている`);
      }
      if (gf.G3) grievanceTickers.push(`[grievance] ${f.name}がタイトル挑戦の機会を求めているようだ`);
      if (gf.G4) grievanceTickers.push(`[grievance] ${f.name}が出場機会の少なさに不満を抱えている`);
    });
    // 過多にならないよう最大2件
    grievanceTickers.slice(0, 2).forEach(t => events.push(t));

    return {
      state: { ...state, roster, rivalries, relationships, orgPop, lockerRoomMorale },
      events,
    };
  },

  // ══════════════════════════════════════════════════════════
  //  デバッグ用ヘルパー
  // ══════════════════════════════════════════════════════════

  // inspect: 2キャラ間の関係を詳細表示
  inspect(state, charIdA, charIdB) {
    const rels = state.relationships || {};
    const keyAB = this._key(charIdA, charIdB);
    const keyBA = this._key(charIdB, charIdA);
    const rAB = rels[keyAB] || { bond: 50, rivalry: 0 };
    const rBA = rels[keyBA] || { bond: 50, rivalry: 0 };

    const getLabel = (val, table) => {
      for (const entry of table) {
        if (val <= entry.max) return entry.label;
      }
      return table[table.length - 1].label;
    };

    return {
      [`${charIdA}→${charIdB}`]: { bond: this._roundAxisValue(rAB.bond), rivalry: this._roundAxisValue(rAB.rivalry) },
      [`${charIdB}→${charIdA}`]: { bond: this._roundAxisValue(rBA.bond), rivalry: this._roundAxisValue(rBA.rivalry) },
      contact: this.isInContact(state, charIdA, charIdB),
      [`label${charIdA}to${charIdB}`]: { bond: getLabel(rAB.bond, BOND_LABELS), rivalry: getLabel(rAB.rivalry, RIVALRY_LABELS) },
      [`label${charIdB}to${charIdA}`]: { bond: getLabel(rBA.bond, BOND_LABELS), rivalry: getLabel(rBA.rivalry, RIVALRY_LABELS) },
    };
  },

  // topRelations: 指定キャラのbondまたはrivalry上位n人を返す
  topRelations(state, charId, axis, n) {
    const rels = state.relationships || {};
    const results = [];
    const prefix = `${charId}>`;
    for (const key of Object.keys(rels)) {
      if (!key.startsWith(prefix)) continue;
      const targetId = parseInt(key.split('>')[1], 10);
      results.push({ targetId, value: rels[key][axis] || 0 });
    }
    results.sort((a, b) => b.value - a.value);
    const top = results.slice(0, n || 5);
    // 名前解決
    const allChars = typeof ALL_CHARS !== 'undefined' ? ALL_CHARS : [];
    return top.map(r => {
      const c = allChars.find(ch => ch.id === r.targetId);
      return { id: r.targetId, name: c ? c.name : `ID:${r.targetId}`, [axis]: this._roundAxisValue(r.value) };
    });
  },

  // stats: 全体の統計情報
  stats(state) {
    const rels = state.relationships || {};
    const bonds = [];
    const rivalries = [];
    for (const key of Object.keys(rels)) {
      bonds.push(rels[key].bond);
      rivalries.push(rels[key].rivalry);
    }
    if (bonds.length === 0) return { count: 0 };

    const calcStats = (arr) => {
      arr.sort((a, b) => a - b);
      const n = arr.length;
      const mean = arr.reduce((s, v) => s + v, 0) / n;
      const median = n % 2 === 0 ? (arr[n / 2 - 1] + arr[n / 2]) / 2 : arr[Math.floor(n / 2)];
      const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
      const sd = Math.sqrt(variance);
      // 帯域別分布
      const bands = {};
      const labels = arr === bonds ? BOND_LABELS : RIVALRY_LABELS;
      let prevMax = -1;
      for (const l of labels) {
        const count = arr.filter(v => v > prevMax && v <= l.max).length;
        bands[l.label] = `${(count / n * 100).toFixed(1)}%`;
        prevMax = l.max;
      }
      return {
        mean: this._roundAxisValue(mean),
        median: this._roundAxisValue(median),
        sd: this._roundAxisValue(sd),
        bands
      };
    };

    return {
      count: bonds.length,
      bond: calcStats(bonds),
      rivalry: calcStats([...rivalries]),
      counterCount: Object.keys(state.relationshipCounters || {}).length
    };
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 3: 多対一ヘルパー (spec §3.2)
  //  団体運営イベント用。逓減なし（1回きり）
  // ══════════════════════════════════════════════════════════

  /** sourceId → 各targetId へ bondDelta/rivalryDelta を適用 */
  applyToRoster(state, sourceId, targetIds, bondDelta, rivalryDelta, rng) {
    if (!state.relationships || !targetIds || targetIds.length === 0) return state;
    const rels = { ...state.relationships };
    for (const tid of targetIds) {
      if (tid === sourceId) continue;
      const key = this._key(sourceId, tid);
      const r = { ...(rels[key] || { bond: 50, rivalry: 0 }) };
      const bondRoll = bondDelta.min + Engine.rng.float(rng) * (bondDelta.max - bondDelta.min);
      r.bond = this._applyAxisDelta(r.bond, bondRoll, 'bond');
      const rivalryRoll = rivalryDelta.min + Engine.rng.float(rng) * (rivalryDelta.max - rivalryDelta.min);
      r.rivalry = this._applyAxisDelta(r.rivalry, rivalryRoll, 'rivalry');
      rels[key] = r;
    }
    return { ...state, relationships: rels };
  },

  /** 各sourceId → targetId へ bondDelta/rivalryDelta を適用 */
  applyFromRoster(state, sourceIds, targetId, bondDelta, rivalryDelta, rng) {
    if (!state.relationships || !sourceIds || sourceIds.length === 0) return state;
    const rels = { ...state.relationships };
    for (const sid of sourceIds) {
      if (sid === targetId) continue;
      const key = this._key(sid, targetId);
      const r = { ...(rels[key] || { bond: 50, rivalry: 0 }) };
      const bondRoll = bondDelta.min + Engine.rng.float(rng) * (bondDelta.max - bondDelta.min);
      r.bond = this._applyAxisDelta(r.bond, bondRoll, 'bond');
      const rivalryRoll = rivalryDelta.min + Engine.rng.float(rng) * (rivalryDelta.max - rivalryDelta.min);
      r.rivalry = this._applyAxisDelta(r.rivalry, rivalryRoll, 'rivalry');
      rels[key] = r;
    }
    return { ...state, relationships: rels };
  },

  // ══════════════════════════════════════════════════════════
  //  契約離脱・裏切りイベント (relationship-spec v2.2 §5.2 / A-1〜A-4)
  //  契約決裂で AI 団体に移籍する選手 → 残留メンバーが受ける関係値変動
  //  A-1 ベース必発火 + A-2 エース / A-3 宿敵団体 / A-4 王者 のサーチャージを加算
  // ══════════════════════════════════════════════════════════

  /** 直近 weeksBack 週以内に対抗戦/PPV/サミット履歴があるか (orgWar.lastResult を参照) */
  _recentlyClashedWith(state, orgIdA, orgIdB, weeksBack) {
    if (!state.orgWarRecord || !Engine.orgWar) return false;
    const rec = Engine.orgWar.get(state, orgIdA, orgIdB);
    const last = rec && rec.lastResult;
    if (!last || last.season == null || last.week == null) return false;
    const lastAbs = Engine.util.absWeek(last.season, last.week);
    const nowAbs  = Engine.util.absWeek(state.season, state.week);
    return (nowAbs - lastAbs) <= weeksBack && (nowAbs - lastAbs) >= 0;
  },

  /**
   * A-1〜A-4: 契約交渉決裂による AI 団体移籍（裏切り）
   *   戻り値: { state, beltCarried, summary }
   *   - state: 関係値・士気・orgPop 反映後の state
   *   - beltCarried: A-4 発火時に 50% で true（タイトル移動処理は Phase 2）
   *   - summary: { bondDelta, rivalryDelta, morDelta, orgPopDelta, isAce, isRivalOrg, isChampion }
   */
  applyContractDepartureBetrayal(state, departingId, toOrgId, rng) {
    Engine.relationships.flags._ensureInit(state);
    if (!state.relationships) return { state, beltCarried: false, summary: null };
    const roster = state.roster || [];
    const departing = roster.find(c => c.id === departingId);

    // ── A-2 判定: ロスター内 OVR 最高 = エース ──
    let aceId = null, aceOvr = -1;
    for (const c of roster) {
      if (c.isRental) continue;
      const ov = Engine.util.ov(c);
      if (ov > aceOvr) { aceOvr = ov; aceId = c.id; }
    }
    const isAce = (aceId === departingId);

    // ── A-3 判定: 直近 24 週で対抗戦/PPV 実績がある相手団体か ──
    const isRivalOrg = this._recentlyClashedWith(state, 'player', toOrgId, 24);

    // ── A-4 判定: 現王者か ──
    const isChampion = !!(state.titles && state.titles.world && state.titles.world.championId === departingId);

    const roll = (mn, mx) => mn + Math.floor(Engine.rng.float(rng) * (mx - mn + 1));

    // ── A-1 ベース ──
    let bondDelta    = -roll(18, 30);   // -30〜-18
    let rivalryDelta =  roll(12, 23);   // +12〜+23
    let morDelta = 0;
    let orgPopDelta = 0;

    // ── A-2 エースサーチャージ ──
    if (isAce) {
      bondDelta    -= roll(5, 8);
      rivalryDelta += roll(6, 8);
      morDelta     -= roll(8, 12);
    }

    // ── A-3 宿敵団体サーチャージ ──
    if (isRivalOrg) {
      bondDelta    -= roll(8, 9);
      rivalryDelta += roll(11, 15);
    }

    // ── A-4 チャンピオンサーチャージ ──
    let beltCarried = false;
    if (isChampion) {
      bondDelta    -= 15;
      rivalryDelta += roll(18, 23);
      orgPopDelta  -= roll(3, 5);
      morDelta     -= roll(10, 15);

      // ── ベルト持ち出し 50% (Phase 1 ではフラグのみ。タイトル移動は Phase 2) ──
      const beltRng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 0, 0xBE73, state.season, departingId));
      if (Engine.rng.float(beltRng) < 0.5) {
        beltCarried = true;
        rivalryDelta += roll(8, 15);  // 持ち出し屈辱サーチャージ
      }
    }

    // ── キャップ ──
    bondDelta    = Math.max(bondDelta, -45);
    rivalryDelta = Math.min(rivalryDelta, 45);

    // ── 残留選手全員に同 delta 適用（min/max を同値で渡す → 各人に同じ値が当たる） ──
    const remainingIds = roster
      .filter(c => c.id !== departingId && !c.injury && !c.isRental)
      .map(c => c.id);
    let s = this.applyFromRoster(
      state, remainingIds, departingId,
      { min: bondDelta, max: bondDelta },
      { min: rivalryDelta, max: rivalryDelta },
      rng
    );

    // ── ロッカールーム士気 ──
    if (morDelta !== 0) {
      const newMorale = Engine.util.clamp((s.lockerRoomMorale || 50) + morDelta, 0, 100);
      s = { ...s, lockerRoomMorale: newMorale };
    }

    // ── orgPop（負方向は applyOrgPopChange で素通し） ──
    if (orgPopDelta < 0 && Engine.orgPop) {
      const popDelta = Engine.orgPop.applyOrgPopChange(orgPopDelta, s.orgPop || 0, null);
      s = { ...s, orgPop: Engine.util.clamp((s.orgPop || 0) + popDelta, 0, 100) };
    }

    // ── F-1 裏切り者フラグ付与 (relationship-flags-spec-v1.0 §2.1) ──
    // 仕様書: 残留者 = 怪我/レンタル/休場ではないロスター全員
    // 既存の remainingIds (line 1157) は !injury && !isRental のみ。forcedRest を追加して再フィルタ
    const betrayerByIds = remainingIds.filter(id => {
      const c = roster.find(rc => rc.id === id);
      return c && !c.forcedRest;
    });
    if (betrayerByIds.length > 0) {
      s = Engine.relationships.flags.applyBetrayer(s, departingId, betrayerByIds);
    }

    return {
      state: s,
      beltCarried,
      summary: {
        departingId, departingName: departing ? departing.name : '',
        toOrgId,
        bondDelta, rivalryDelta, morDelta, orgPopDelta,
        isAce, isRivalOrg, isChampion, beltCarried,
      },
    };
  },

  // ══════════════════════════════════════════════════════════
  //  解雇遺恨システム (firing-grudge-spec-v0.1)
  //  - 解雇者 → 残留組 への片方向ネガティブ更新（性格バイアス + 関係性ティア別）
  //  - 団体への遺恨は fighter.grudge フラグで個別保持
  //  - decay は季節境界で逓減
  // ══════════════════════════════════════════════════════════

  /** 解雇された選手の状況から intensity (0〜100) を算出 */
  computeFiringGrudgeIntensity(firedFighter, state) {
    if (!firedFighter) return 0;
    const pop = Math.max(0, Math.min(100, firedFighter.popularity || 0));
    const age = firedFighter.age || 25;
    const isChamp = !!(state && state.titles && state.titles.world && state.titles.world.championId === firedFighter.id);
    // 在籍年数: orgJoinWeek があれば現在週との差から計算（1シーズン=20週前提の概算）
    let yearsInOrg = 0;
    if (firedFighter.orgJoinWeek != null && state) {
      const nowAbs = (state.season - 1) * 20 + (state.week || 1);
      yearsInOrg = Math.max(0, Math.floor((nowAbs - firedFighter.orgJoinWeek) / 20));
    }
    // タイトル経験: career history から titleWin / belt 関連を概算カウント
    let titleHistoryCount = 0;
    if (Array.isArray(firedFighter.history)) {
      for (const ev of firedFighter.history) {
        if (!ev || typeof ev.type !== 'string') continue;
        if (ev.type === 'titleWin' || ev.type === 'titleDefense' || ev.type === 'beltCarry') {
          titleHistoryCount++;
        }
      }
    }
    let intensity = 40
      + (pop / 100) * 25
      + titleHistoryCount * 5
      + (age < 23 ? 10 : 0)
      + (yearsInOrg >= 3 ? 10 : 0)
      + (isChamp ? 15 : 0);
    return Math.max(0, Math.min(100, Math.round(intensity)));
  },

  /** 解雇者の性格による Δ バイアス補正 (bondMul, rivalryMul) */
  _firingPersonalityBias(personality) {
    switch (personality) {
      case 'hot':         return { bondMul: 1.0, rivalryMul: 1.25 };
      case 'composed':    return { bondMul: 0.75, rivalryMul: 0.75 };
      case 'proud':       return { bondMul: 1.15, rivalryMul: 1.0 };
      case 'quiet':       return { bondMul: 1.15, rivalryMul: 1.0 };
      case 'emotional':   return { bondMul: 1.3, rivalryMul: 0.85 };
      case 'seductive':   return { bondMul: 1.0, rivalryMul: 1.0 };
      case 'competitive': return { bondMul: 1.0, rivalryMul: 1.2 };
      // 既存性格名（bold/earnest/easygoing/normal）のフォールバック
      case 'bold':        return { bondMul: 1.0, rivalryMul: 1.2 };
      case 'earnest':     return { bondMul: 1.15, rivalryMul: 1.0 };
      case 'easygoing':   return { bondMul: 0.85, rivalryMul: 0.85 };
      default:            return { bondMul: 1.0, rivalryMul: 1.0 };
    }
  },

  /**
   * 解雇イベントの関係性更新と grudge 付与。
   * @param state {GameState}
   * @param firedFighter {Fighter} roster から除外する直前のオブジェクト（career addEvent 後で OK）
   * @param rng
   * @returns { state, grudge, summary }  state は更新後、grudge は firedFighter に付与すべきオブジェクト
   */
  applyFiringGrudge(state, firedFighter, rng, opts) {
    if (!firedFighter) return { state, grudge: null, summary: null };
    const firedId = firedFighter.id;
    const vsOrgId = (opts && opts.vsOrgId) || firedFighter.orgId || 'player';
    const intensity = this.computeFiringGrudgeIntensity(firedFighter, state);
    const grudge = {
      vsOrgId,
      reason: 'fired',
      issuedSeason: state.season,
      issuedWeek: state.week,
      intensity,
      decayUntilSeason: state.season + 3
    };

    if (!state.relationships) {
      return { state, grudge, summary: { firedId, intensity, perTarget: [] } };
    }

    const bias = this._firingPersonalityBias(firedFighter.personality);
    const roster = vsOrgId === 'player'
      ? (state.roster || [])
      : ((state.aiOrgs && state.aiOrgs[vsOrgId] && state.aiOrgs[vsOrgId].roster) || []);
    const colleagues = roster.filter(c => c.id !== firedId && !c.isRental);
    const rels = { ...state.relationships };
    const perTarget = [];

    for (const col of colleagues) {
      const key = this._key(firedId, col.id);
      const r = { ...(rels[key] || { bond: 50, rivalry: 0 }) };
      const curBond = r.bond, curRivalry = r.rivalry;

      // ── ティア判定 ──
      // 親友 (元 bond ≥ 70) > 元ライバル (元 rivalry ≥ 40) > 一般
      let bondMin, bondMax, rivalryMin, rivalryMax, tier;
      if (curBond >= 70) {
        bondMin = -35; bondMax = -25; rivalryMin = 8;  rivalryMax = 12; tier = 'closeBetrayed';
      } else if (curRivalry >= 40) {
        bondMin = -10; bondMax = -5;  rivalryMin = 20; rivalryMax = 28; tier = 'oldRival';
      } else {
        bondMin = -18; bondMax = -10; rivalryMin = 12; rivalryMax = 18; tier = 'general';
      }

      const rollUniform = (mn, mx) => mn + Engine.rng.float(rng) * (mx - mn);
      let bondDelta    = rollUniform(bondMin, bondMax) * bias.bondMul;
      let rivalryDelta = rollUniform(rivalryMin, rivalryMax) * bias.rivalryMul;

      // サーチャージ規約に準拠
      bondDelta    = Math.max(bondDelta, -45);
      rivalryDelta = Math.min(rivalryDelta, 45);

      r.bond    = this._applyAxisDelta(r.bond, bondDelta, 'bond');
      r.rivalry = this._applyAxisDelta(r.rivalry, rivalryDelta, 'rivalry');
      rels[key] = r;
      perTarget.push({ targetId: col.id, tier, bondDelta, rivalryDelta });
    }

    return {
      state: { ...state, relationships: rels },
      grudge,
      summary: { firedId, intensity, perTarget }
    };
  },

  /** シーズン境界で grudge.intensity を逓減。decayUntilSeason 超過から ×0.85、≤5 で削除 */
  decayGrudges(state) {
    const decayList = (arr) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map(f => {
        if (!f || !f.grudge) return f;
        const g = f.grudge;
        if (state.season < (g.decayUntilSeason || 0)) return f;
        const next = Math.round(g.intensity * 0.85);
        if (next <= 5) {
          const { grudge, ...rest } = f;
          return rest;
        }
        return { ...f, grudge: { ...g, intensity: next } };
      });
    };
    let s = { ...state };
    s.roster = decayList(s.roster);
    s.freeAgents = decayList(s.freeAgents);
    if (s.aiOrgs) {
      const newAi = {};
      for (const [orgId, org] of Object.entries(s.aiOrgs)) {
        newAi[orgId] = { ...org, roster: decayList(org.roster) };
      }
      s.aiOrgs = newAi;
    }
    if (Array.isArray(s.dormantPool)) s.dormantPool = decayList(s.dormantPool);
    if (Array.isArray(s.retiredFighters)) s.retiredFighters = decayList(s.retiredFighters);
    return s;
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 4: ケア・成長・大型イベントの関係値反映ヘルパー
  // ══════════════════════════════════════════════════════════

  /** C-03: 全ペア間で bondDelta/rivalryDelta を双方向に適用（camp/party用） */
  applyAllPairs(state, charIds, bondDelta, rivalryDelta, rng) {
    if (!state.relationships || !charIds || charIds.length < 2) return state;
    const rels = { ...state.relationships };
    for (let i = 0; i < charIds.length; i++) {
      for (let j = i + 1; j < charIds.length; j++) {
        const idA = charIds[i], idB = charIds[j];
        const keyAB = this._key(idA, idB);
        const rAB = { ...(rels[keyAB] || { bond: 50, rivalry: 0 }) };
        const bondRollAB = bondDelta.min + Engine.rng.float(rng) * (bondDelta.max - bondDelta.min);
        rAB.bond = this._applyAxisDelta(rAB.bond, bondRollAB, 'bond');
        const rivalryRollAB = rivalryDelta.min + Engine.rng.float(rng) * (rivalryDelta.max - rivalryDelta.min);
        rAB.rivalry = this._applyAxisDelta(rAB.rivalry, rivalryRollAB, 'rivalry');
        rels[keyAB] = rAB;
        const keyBA = this._key(idB, idA);
        const rBA = { ...(rels[keyBA] || { bond: 50, rivalry: 0 }) };
        const bondRollBA = bondDelta.min + Engine.rng.float(rng) * (bondDelta.max - bondDelta.min);
        rBA.bond = this._applyAxisDelta(rBA.bond, bondRollBA, 'bond');
        const rivalryRollBA = rivalryDelta.min + Engine.rng.float(rng) * (rivalryDelta.max - rivalryDelta.min);
        rBA.rivalry = this._applyAxisDelta(rBA.rivalry, rivalryRollBA, 'rivalry');
        rels[keyBA] = rBA;
      }
    }
    return { ...state, relationships: rels };
  },

  /** C-04/C-05/C-06/C-10: 興行コンテキストの関係値反映 */
  applyShowContextEffects(state, validMatches, results, preShowLosingStreaks, rng) {
    if (!state.relationships) return state;
    let s = state;
    const roster = s.roster || [];
    const rosterIds = roster.filter(c => !c.isRental).map(c => c.id);
    const matchParticipantIds = new Set(results.flatMap(r =>
      r.matchType === 'tag' ? Object.keys(r.perFighter).map(Number) : [r.left.id, r.right.id]
    ));

    // C-04: タイトルマッチ不出場の嫉妬
    const titleMatches = validMatches.filter(m => m.isTitle);
    if (titleMatches.length > 0) {
      const titleFighterIds = new Set();
      titleMatches.forEach(m => { if (m.left > 0) titleFighterIds.add(m.left); if (m.right > 0) titleFighterIds.add(m.right); });
      const jealousIds = rosterIds.filter(id => !titleFighterIds.has(id) && !(roster.find(c => c.id === id) || {}).injury);
      const titleIds = [...titleFighterIds];
      for (const jId of jealousIds) {
        s = Engine.relationships.applyToRoster(s, jId, titleIds, { min: -3, max: -1 }, { min: 2, max: 5 }, rng);
      }
      // N-01: ポジション競合の嫉妬（OVR差5以内 + 同スタイル + 16週クールダウン）
      // bond-rebalance v2.3: タイトル戦不出場者は元々多いので発火を絞る。
      //   - per-pair 16週クールダウン (state.n01CooldownWeeks に lastFireWeek を保存)
      //   - 発火条件は据置（OVR差≤5 + 同スタイル）。値域も据置 (-5〜-3)
      const absWeekN01 = Engine.util.absWeek(state.season, state.week);
      const n01Cooldown = { ...(s.n01CooldownWeeks || {}) };
      for (const jId of jealousIds) {
        const nonTitleChar = roster.find(c => c.id === jId);
        if (!nonTitleChar) continue;
        for (const tId of titleIds) {
          const titleChar = roster.find(c => c.id === tId);
          if (!titleChar) continue;
          if (Math.abs(Engine.util.ov(nonTitleChar) - Engine.util.ov(titleChar)) <= 5 && nonTitleChar.style === titleChar.style) {
            const ckey = `${jId}>${tId}`;
            const lastFire = n01Cooldown[ckey];
            if (typeof lastFire === 'number' && (absWeekN01 - lastFire) < 16) continue;
            s = Engine.relationships.applyToRoster(s, jId, [tId], { min: -5, max: -3 }, { min: 3, max: 5 }, rng);
            n01Cooldown[ckey] = absWeekN01;
          }
        }
      }
      // クールダウン記録を state にマージ（古いエントリは48週で破棄してメモリ節約）
      for (const ck of Object.keys(n01Cooldown)) {
        if (absWeekN01 - n01Cooldown[ck] > 48) delete n01Cooldown[ck];
      }
      s = { ...s, n01CooldownWeeks: n01Cooldown };
    }

    // C-05/C-06: 連敗中選手の起用/不起用
    if (preShowLosingStreaks) {
      for (const [fId, streak] of preShowLosingStreaks) {
        if (streak < 3) continue;
        const f = roster.find(c => c.id === fId);
        if (!f || f.injury || f.isRental) continue;
        if (matchParticipantIds.has(fId)) {
          // C-05: 起用し続ける → 該当選手→団体全体 bond +2~+3
          s = Engine.relationships.applyToRoster(s, fId, rosterIds, { min: 2, max: 3 }, { min: 0, max: 0 }, rng);
        } else {
          // C-06: 干す → 該当選手→団体全体 bond -3~-5
          s = Engine.relationships.applyToRoster(s, fId, rosterIds, { min: -5, max: -3 }, { min: 0, max: 0 }, rng);
        }
      }
    }

    // C-10: メイン/前座の格差
    if (results.length >= 2) {
      const mainIdx = results.length - 1;
      const mainR = results[mainIdx];
      const mainIds = new Set(
        mainR.matchType === 'tag' ? Object.keys(mainR.perFighter).map(Number) : [mainR.left.id, mainR.right.id]
      );
      const undercardIds = [];
      for (let i = 0; i < mainIdx; i++) {
        const ri = results[i];
        const ids = ri.matchType === 'tag' ? Object.keys(ri.perFighter).map(Number) : [ri.left.id, ri.right.id];
        ids.forEach(id => { if (!mainIds.has(id)) undercardIds.push(id); });
      }
      const mainArr = [...mainIds];
      for (const uId of undercardIds) {
        s = Engine.relationships.applyToRoster(s, uId, mainArr, { min: -2, max: -1 }, { min: 1, max: 3 }, rng);
      }
    }

    // ═══ N-06: 共闘ペアの裏切り選択（bond-rebalance v2.3） ═══
    // bond≥60 の同団体ペアで、片方がタイトル戦・片方が前座という編成のとき、
    // 前座側→タイトル側に bond -12〜-18 / rivalry +5〜+10、25%発火、per-pair 24週クールダウン
    if (titleMatches.length > 0) {
      const titleFighterIdsArr = [];
      titleMatches.forEach(m => { if (m.left > 0) titleFighterIdsArr.push(m.left); if (m.right > 0) titleFighterIdsArr.push(m.right); });
      const titleSet = new Set(titleFighterIdsArr);
      // 前座 = 興行に出場 + タイトル戦に出ていない + ロスター内
      const undercardIdsN06 = [];
      for (const r of results) {
        const ids = r.matchType === 'tag' ? Object.keys(r.perFighter).map(Number) : [r.left.id, r.right.id];
        for (const id of ids) {
          if (!titleSet.has(id) && rosterIds.includes(id)) undercardIdsN06.push(id);
        }
      }
      const absWeekN06 = Engine.util.absWeek(state.season, state.week);
      const n06Cooldown = { ...(s.n06CooldownWeeks || {}) };
      for (const uId of undercardIdsN06) {
        for (const tId of titleFighterIdsArr) {
          if (uId === tId) continue;
          const relKey = `${uId}>${tId}`;
          const rel = (s.relationships || {})[relKey];
          if (!rel || rel.bond < 60) continue;
          const ckey = `${uId}>${tId}`;
          const lastFire = n06Cooldown[ckey];
          if (typeof lastFire === 'number' && (absWeekN06 - lastFire) < 24) continue;
          if (Engine.rng.float(rng) >= 0.25) continue;
          s = Engine.relationships.applyToRoster(s, uId, [tId], { min: -18, max: -12 }, { min: 5, max: 10 }, rng);
          n06Cooldown[ckey] = absWeekN06;
          if (Engine.relationships.flags && Engine.relationships.flags._enqueueModal) {
            Engine.relationships.flags._enqueueModal(s, 'M-17', { fromId: uId, toId: tId });
          }
        }
      }
      // メモリ節約: 72週超のエントリは破棄
      for (const ck of Object.keys(n06Cooldown)) {
        if (absWeekN06 - n06Cooldown[ck] > 72) delete n06Cooldown[ck];
      }
      s = { ...s, n06CooldownWeeks: n06Cooldown };
    }

    return s;
  },

  /** G-01: ブレイクスルー達成 — OVR差5以内の全キャラ→本人 rivalry +3~+5
   *  N-02: 成長格差の嫉妬 — 同団体+年齢差3以内+OVR低い側→本人 bond -2~-4, rivalry +3~+5 */
  applyBreakthroughEffect(state, fighterId, rng) {
    if (!state.relationships) return state;
    const allChars = [...(state.roster || []), ...Object.values(state.aiOrgs || {}).flatMap(o => o.roster || [])];
    const fighter = allChars.find(c => c.id === fighterId);
    if (!fighter) return state;
    const selfOvr = Engine.util.ov(fighter);
    // G-01: OVR差5以内の全キャラ→本人 rivalry +3~+5
    const closeIds = allChars.filter(c => c.id !== fighterId && Math.abs(Engine.util.ov(c) - selfOvr) <= 5).map(c => c.id);
    let s = state;
    if (closeIds.length > 0) {
      s = Engine.relationships.applyFromRoster(s, closeIds, fighterId, { min: 0, max: 0 }, { min: 3, max: 5 }, rng);
    }
    // N-02: 同団体の同世代(年齢差3以内)でOVRが低い側→本人 bond -2~-4, rivalry +3~+5
    const getOrgRoster = (fId) => {
      if ((state.roster || []).some(c => c.id === fId)) return state.roster || [];
      for (const org of Object.values(state.aiOrgs || {})) {
        if ((org.roster || []).some(c => c.id === fId)) return org.roster || [];
      }
      return [];
    };
    const orgRoster = getOrgRoster(fighterId);
    const sameOrgLowerOvr = orgRoster.filter(c =>
      c.id !== fighterId &&
      Math.abs((c.age || 20) - (fighter.age || 20)) <= 3 &&
      Engine.util.ov(c) < selfOvr
    );
    if (sameOrgLowerOvr.length > 0) {
      s = Engine.relationships.applyFromRoster(s, sameOrgLowerOvr.map(c => c.id), fighterId, { min: -4, max: -2 }, { min: 3, max: 5 }, rng);
    }
    return s;
  },

  /** G-03/G-06: スランプ・モチベ喪失 — bond60+→心配, rivalry30+→興味低下 */
  applySympathyEffect(state, fighterId, bondRange, rng) {
    if (!state.relationships) return state;
    const rels = state.relationships;
    const newRels = { ...rels };
    for (const key of Object.keys(rels)) {
      const sepIdx = key.indexOf('>');
      const targetId = parseInt(key.substring(sepIdx + 1), 10);
      if (targetId !== fighterId) continue;
      const r = { ...rels[key] };
      if (this.isPositiveBond(r.bond)) {
        const bondRoll = bondRange.min + Engine.rng.float(rng) * (bondRange.max - bondRange.min);
        r.bond = this._applyAxisDelta(r.bond, bondRoll, 'bond');
      }
      if (r.rivalry >= 30) {
        r.rivalry = Math.max(0, r.rivalry - (3 + Engine.rng.float(rng) * 2));
      }
      newRels[key] = r;
    }
    return { ...state, relationships: newRels };
  },

  /** N-05: スランプの八つ当たり — スランプ突入時、bond最高(50+)の同団体相手に八つ当たり */
  applySlumpLashout(state, fighterId, rng) {
    if (!state.relationships) return state;
    const rels = state.relationships;
    const getOrgRoster = (fId) => {
      if ((state.roster || []).some(c => c.id === fId)) return (state.roster || []).filter(c => !c.injury && c.id !== fId);
      for (const org of Object.values(state.aiOrgs || {})) {
        if ((org.roster || []).some(c => c.id === fId)) return (org.roster || []).filter(c => !c.injury && c.id !== fId);
      }
      return [];
    };
    const orgRoster = getOrgRoster(fighterId);
    let maxBond = 50; // 50未満なら不発
    let targetId = null;
    for (const c of orgRoster) {
      const key = this._key(fighterId, c.id);
      const r = rels[key];
      if (r && r.bond > maxBond) { maxBond = r.bond; targetId = c.id; }
    }
    if (!targetId) return state;
    // bond-rebalance v2.3: スランプ突入は稀なので発火時は鮮烈に (-4〜-7 → -7〜-12)
    // スランプ者→相手: bond -7~-12, rivalry ±0
    let s = this.applyToRoster(state, fighterId, [targetId], { min: -12, max: -7 }, { min: 0, max: 0 }, rng);
    // 相手→スランプ者: bond -1~-3, rivalry ±0 (据置)
    s = this.applyFromRoster(s, [targetId], fighterId, { min: -3, max: -1 }, { min: 0, max: 0 }, rng);
    // bond-rebalance v2.3: M-16 スランプ八つ当たりポップアップ enqueue
    if (Engine.relationships.flags && Engine.relationships.flags._enqueueModal) {
      s = Engine.relationships.flags._enqueueModal(s, 'M-16', { fromId: fighterId, toId: targetId });
    }
    return s;
  },

  /** N-04: 人気逆転 — 同団体で若手(年齢差5+)の人気が先輩を初めて超えた瞬間（1回限り） */
  applyPopOvertakeEffects(state, rng) {
    if (!state.relationships) return state;
    const triggered = state.popOvertakeTriggered || {};
    const newTriggered = { ...triggered };
    let s = state;
    const allChars = [...(state.roster || []), ...Object.values(state.aiOrgs || {}).flatMap(o => o.roster || [])];
    const getOrgId = (charId) => {
      if ((state.roster || []).some(c => c.id === charId)) return 'player';
      for (const [oid, org] of Object.entries(state.aiOrgs || {})) {
        if ((org.roster || []).some(c => c.id === charId)) return oid;
      }
      return null;
    };
    for (let i = 0; i < allChars.length; i++) {
      const senior = allChars[i];
      for (let j = 0; j < allChars.length; j++) {
        if (i === j) continue;
        const junior = allChars[j];
        if (((senior.age || 20) - (junior.age || 20)) < 5) continue;
        if (getOrgId(senior.id) !== getOrgId(junior.id)) continue;
        const pairKey = `${senior.id}>${junior.id}`;
        if (newTriggered[pairKey]) continue;
        if ((junior.popularity || 0) > (senior.popularity || 0)) {
          s = this.applyToRoster(s, senior.id, [junior.id], { min: -5, max: -3 }, { min: 2, max: 4 }, rng);
          newTriggered[pairKey] = true;
        }
      }
    }
    return { ...s, popOvertakeTriggered: newTriggered };
  },

  /** §2.3: 引退時の関係値凍結 — 引退者を含む全ペアを凍結（decay対象外） */
  freezeRelationships(state, retiredFighterId) {
    if (!state.relationships) return state;
    const rels = state.relationships;
    const newRels = {};
    for (const key of Object.keys(rels)) {
      const r = rels[key];
      const sepIdx = key.indexOf('>');
      const idA = parseInt(key.substring(0, sepIdx), 10);
      const idB = parseInt(key.substring(sepIdx + 1), 10);
      if (idA === retiredFighterId || idB === retiredFighterId) {
        newRels[key] = { ...r, frozen: true };
      } else {
        newRels[key] = r;
      }
    }
    return { ...state, relationships: newRels };
  },

  /** G-07: モチベ喪失自動引退 — bond60+→本人 bond -5~-8 */
  applyAutoRetireEffect(state, fighterId, rng) {
    if (!state.relationships) return state;
    const rels = state.relationships;
    const newRels = { ...rels };
    for (const key of Object.keys(rels)) {
      const sepIdx = key.indexOf('>');
      const targetId = parseInt(key.substring(sepIdx + 1), 10);
      if (targetId !== fighterId) continue;
      const r = { ...rels[key] };
      if (this.isPositiveBond(r.bond)) {
        r.bond = this._clampAxisValue(r.bond - (5 + Engine.rng.float(rng) * 3), 'bond');
      }
      newRels[key] = r;
    }
    return { ...state, relationships: newRels };
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 3: 再接触イベント (spec §2.2)
  //  凍結されていた関係が再接触時に発火
  // ══════════════════════════════════════════════════════════
  checkRecontact(state, newCharId, rosterIds, previousState = state) {
    if (!state.relationships) return [];
    const events = [];
    const previousRelationships = previousState.relationships || {};
    for (const rid of rosterIds) {
      if (rid === newCharId) continue;
      const keyAB = this._key(newCharId, rid);
      const keyBA = this._key(rid, newCharId);
      if (!previousRelationships[keyAB] && !previousRelationships[keyBA]) continue;
      const rAB = state.relationships[keyAB];
      const rBA = state.relationships[keyBA];
      if (!rAB && !rBA) continue;
      const bondValues = [rAB?.bond, rBA?.bond].filter(v => v != null);
      const rivalryValues = [rAB?.rivalry, rBA?.rivalry].filter(v => v != null);
      if (bondValues.length === 0) continue;
      const bondMax = Math.max(...bondValues);
      const bondMin = Math.min(...bondValues);
      const rivalryMax = rivalryValues.length > 0 ? Math.max(...rivalryValues) : 0;

      if (this.getBondBand(bondMax) === 'devoted') {
        events.push({ type: 'reunion', charA: newCharId, charB: rid, effect: { conditionBonus: 5 + Math.floor(Math.random() * 6) } });
      }
      if (bondMin <= 10) {
        events.push({
          type: 'vendetta',
          charA: newCharId,
          charB: rid,
          effect: {
            moralePenalty: -(5 + Math.floor(Math.random() * 4)),
            rivalryBonus: 4 + Math.floor(Math.random() * 3),
            bondPenalty: -(2 + Math.floor(Math.random() * 2)),
          },
        });
      } else if (bondMin < 50) {
        events.push({ type: 'grudge', charA: newCharId, charB: rid, effect: { moralePenalty: -(2 + Math.floor(Math.random() * 4)) } });
      }
      if (rivalryMax >= 60) {
        events.push({ type: 'unfinished', charA: newCharId, charB: rid, effect: {} });
      }
    }
    return events;
  },

  /** 再接触イベントの効果を適用 */
  applyRecontactEvents(state, events) {
    let s = { ...state };
    const log = [...(s.gameLog || [])];
    const rels = { ...(s.relationships || {}) };
    const getName = (id) => {
      const c = (s.roster || []).find(r => r.id === id);
      return c ? c.name : id;
    };
    for (const ev of events) {
      if (ev.type === 'reunion') {
        // ???condition +5?+10
        s = { ...s, roster: s.roster.map(c => {
          if (c.id === ev.charA || c.id === ev.charB) {
            return { ...c, condition: Math.min(100, (c.condition || 80) + ev.effect.conditionBonus) };
          }
          return c;
        })};
        log.push(`?? ${getName(ev.charA)}?${getName(ev.charB)}???? ????????????????`);
      } else if (ev.type === 'grudge') {
        // lockerRoomMorale -2?-5
        s = { ...s, lockerRoomMorale: Math.max(0, (s.lockerRoomMorale || 50) + ev.effect.moralePenalty) };
        log.push(`?? ${getName(ev.charA)}?${getName(ev.charB)}?????????????????????????????`);
      } else if (ev.type === 'vendetta') {
        s = { ...s, lockerRoomMorale: Math.max(0, (s.lockerRoomMorale || 50) + ev.effect.moralePenalty) };
        const keyAB = this._key(ev.charA, ev.charB);
        const keyBA = this._key(ev.charB, ev.charA);
        const rAB = { ...(rels[keyAB] || { bond: 50, rivalry: 0 }) };
        const rBA = { ...(rels[keyBA] || { bond: 50, rivalry: 0 }) };
        rAB.bond = this._clampAxisValue(rAB.bond + ev.effect.bondPenalty, 'bond');
        rBA.bond = this._clampAxisValue(rBA.bond + ev.effect.bondPenalty, 'bond');
        rAB.rivalry = this._clampAxisValue(rAB.rivalry + ev.effect.rivalryBonus, 'rivalry');
        rBA.rivalry = this._clampAxisValue(rBA.rivalry + ev.effect.rivalryBonus, 'rivalry');
        rels[keyAB] = rAB;
        rels[keyBA] = rBA;
        log.push(`?? ${getName(ev.charA)}?${getName(ev.charB)}?????????????????????????`);
      } else if (ev.type === 'unfinished') {
        log.push(`?? ${getName(ev.charA)}?${getName(ev.charB)}????????????????`);
      }
    }
    return { ...s, relationships: rels, gameLog: log };
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 2: 試合結果の関係値反映 (spec §2.3, §3.1)
  //  1試合ごとに複数イベントが重複適用される
  // ══════════════════════════════════════════════════════════
  applyMatchResult(state, charIdA, charIdB, context, rng) {
    Engine.relationships.flags._ensureInit(state);
    // context: {
    //   mq, winner: 'win'|'lose'|'draw' (from A's perspective),
    //   hpA: {final,max}, hpB: {final,max}, turns,
    //   stage: 'normal'|'ppv'|'title',
    //   isTitleMatch, rivalryResolved,
    //   injuredId, isCareerBestA, isCareerBestB,
    //   losingStreakA, losingStreakB,
    //   isProveModeA, isProveModeB,
    //   isCrossOrg  // 他団体戦フラグ（PPV/B3/War）
    // }
    if (!state.relationships) return state;

    const rels = { ...state.relationships };
    const counters = { ...(state.relationshipCounters || {}) };
    const absWeek = Engine.util.absWeek(state.season, state.week);

    const keyAB = this._key(charIdA, charIdB);
    const keyBA = this._key(charIdB, charIdA);
    const rAB = { ...(rels[keyAB] || { bond: 50, rivalry: 0 }) };
    const rBA = { ...(rels[keyBA] || { bond: 50, rivalry: 0 }) };

    const aWon = context.winner === 'win';
    const bWon = context.winner === 'lose';
    const isDraw = context.winner === 'draw';
    const isCrossOrg = !!context.isCrossOrg;
    const getOrgId = (fighterId) => {
      if ((state.roster || []).some(c => c.id === fighterId)) return 'player';
      for (const [orgId, org] of Object.entries(state.aiOrgs || {})) {
        if ((org.roster || []).some(c => c.id === fighterId)) return orgId;
      }
      return null;
    };
    const orgIdA = getOrgId(charIdA);
    const orgIdB = getOrgId(charIdB);
    const sameOrgMatch = !isCrossOrg && orgIdA && orgIdA === orgIdB;

    // 他団体戦キャップ用: 初期rivalry記録
    const rivalryStartAB = rAB.rivalry;
    const rivalryStartBA = rBA.rivalry;
    const CROSS_ORG_RIVALRY_CAP = 35; // 1試合あたりのrivalry増加上限

    // ── ヘルパー: レンジ内ランダム値（整数レンジはint、小数レンジは10倍スケール） ──
    const roll = (min, max) => {
      if (min === max) return this._roundAxisValue(min);
      return this._rollAxisValue(rng, min, max);
    };

    // ── ヘルパー: イベント適用（1方向分） ──
    const apply = (dir, eventType, stage, bondMin, bondMax, rivalryMin, rivalryMax, diminish, opts = {}) => {
      const idFrom = dir === 'AB' ? charIdA : charIdB;
      const idTo = dir === 'AB' ? charIdB : charIdA;
      const rel = dir === 'AB' ? rAB : rBA;

      let mult = 1.0;
      if (diminish) {
        const cKey = this._counterKey(idFrom, idTo, eventType, stage);
        const counter = counters[cKey] || { count: 0, lastWeek: 0 };
        mult = this.getDiminishingMultiplier(counter.count);
        counters[cKey] = { count: counter.count + 1, lastWeek: absWeek };
      }

      // 他団体戦: rivalry×2.0ブースト、bond負方向×1.5（§4.4.3）
      const rivalryMult = isCrossOrg ? 2.0 : 1.0;
      const rawBondDelta = roll(bondMin, bondMax) * mult;
      const crossOrgBondMult = (isCrossOrg && rawBondDelta < 0 && !opts.skipCrossOrgBondMult) ? 1.5 : 1.0;
      const sameOrgBondMult = (sameOrgMatch && rawBondDelta > 0 && !opts.skipSameOrgBondMult) ? 0.85 : 1.0;
      const bondMult = crossOrgBondMult * sameOrgBondMult;

      rel.bond = this._applyAxisDelta(rel.bond, rawBondDelta * bondMult, 'bond');
      rel.rivalry = this._applyAxisDelta(rel.rivalry, roll(rivalryMin, rivalryMax) * mult * rivalryMult, 'rivalry');
    };

    // ── §4.4.2 クロスOrg基本Bond税: 両方向に bond -2〜-5 を加算 ──
    if (isCrossOrg) {
      const taxRng = Engine.rng.create(Engine.rng.derive(
        state.rngSeed, state.season || 1, state.week || 1,
        charIdA, charIdB, 0xBE2D));
      const taxAB = -(2 + Engine.rng.float(taxRng) * 3); // -2〜-5
      const taxBA = -(2 + Engine.rng.float(taxRng) * 3);
      rAB.bond = this._applyAxisDelta(rAB.bond, taxAB, 'bond');
      rBA.bond = this._applyAxisDelta(rBA.bond, taxBA, 'bond');
    }

    // ═══ M-01: ベースライン（勝敗非対称 v2.0） ═══
    if (isDraw) {
      apply('AB', 'match', context.stage, 0, 0, 0.5, 1.0, true);
      apply('BA', 'match', context.stage, 0, 0, 0.5, 1.0, true);
    } else {
      const winDir = aWon ? 'AB' : 'BA';
      const loseDir = aWon ? 'BA' : 'AB';
      apply(winDir, 'match', context.stage, 0, 0, 0.1, 0.5, true);  // 勝者→敗者
      apply(loseDir, 'match', context.stage, 0, 0, 0.8, 2.0, true); // 敗者→勝者
    }

    // ═══ M-02 / M-03 判定（排他） ═══
    let isCloseMatch = false;
    let isSquash = false;

    if (!isDraw) {
      const loserHP = aWon ? context.hpB : context.hpA;
      const winnerHP = aWon ? context.hpA : context.hpB;
      const loserRatio = loserHP.final / loserHP.max;
      const winnerRatio = winnerHP.final / winnerHP.max;

      // M-02: 僅差の好勝負（敗者がギリギリ粘った or 勝者もボロボロ）
      if (loserRatio >= 0.15 || winnerRatio <= 0.30) {
        isCloseMatch = true;
      }
      // M-03: 圧勝（M-02と排他。短期決着 or 圧倒的HP差）
      if (!isCloseMatch && (context.turns <= 5 || (loserHP.final <= 0 && winnerRatio >= 0.70))) {
        isSquash = true;
      }
    }

    // ═══ M-02: 僅差の好勝負（v2.0: bond抑制） ═══
    if (isCloseMatch) {
      apply('AB', 'closeMatch', context.stage, 0, 1, 5, 8, true);
      apply('BA', 'closeMatch', context.stage, 0, 1, 5, 8, true);
    }

    // ═══ M-03a/b: 圧勝（非対称） ═══
    if (isSquash) {
      if (aWon) {
        apply('AB', 'squash', context.stage, 0, 0, -5, -3, true);    // 勝者→敗者: 興味を失う
        apply('BA', 'squashed', context.stage, -4, -2, 5, 10, true); // 敗者→勝者: 悔しさで意識
      } else {
        apply('BA', 'squash', context.stage, 0, 0, -5, -3, true);
        apply('AB', 'squashed', context.stage, -4, -2, 5, 10, true);
      }
    }

    // ═══ M-04 / M-CO1: 名勝負（MQ80+） ═══
    if (context.mq >= 80) {
      if (isCrossOrg) {
        // M-CO1 好敵手認定: bond +6〜+10（§4.4.3 乗数対象外）、逓減キー独立
        apply('AB', 'famousMatch:cross-org', context.stage, 6, 10, 8, 12, true, { skipCrossOrgBondMult: true });
        apply('BA', 'famousMatch:cross-org', context.stage, 6, 10, 8, 12, true, { skipCrossOrgBondMult: true });
      } else {
        apply('AB', 'greatMatch', context.stage, 3, 6, 8, 12, true);
        apply('BA', 'greatMatch', context.stage, 3, 6, 8, 12, true);
      }
    }

    // ═══ M-05: PPV/GRAND FINAL ═══
    if (context.stage === 'ppv') {
      apply('AB', 'ppvMatch', 'ppv', 0, 0, 10, 15, true);
      apply('BA', 'ppvMatch', 'ppv', 0, 0, 10, 15, true);
    }

    // ═══ M-06改: タイトルマッチ（勝敗非対称 v2.0） ═══
    if (context.isTitleMatch && !isDraw) {
      const winDir = aWon ? 'AB' : 'BA';
      const loseDir = aWon ? 'BA' : 'AB';
      if (context.isChampionA !== undefined || context.isChampionB !== undefined) {
        const champWon = (context.isChampionA && aWon) || (context.isChampionB && bWon);
        if (champWon) {
          // 防衛成功: 王者→挑戦者 +4〜+7, 挑戦者→王者 +10〜+15
          apply(winDir, 'titleMatch', context.stage, 0, 0, 4, 7, true);
          apply(loseDir, 'titleMatch', context.stage, 0, 0, 10, 15, true);
        } else {
          // 王座奪取: 新王者→前王者 +5〜+8, 前王者→新王者 +12〜+18
          apply(winDir, 'titleMatch', context.stage, 0, 0, 5, 8, true);
          apply(loseDir, 'titleMatch', context.stage, 0, 0, 12, 18, true);
        }
      } else {
        // 王者情報がない場合は汎用（勝者 +4〜+7, 敗者 +10〜+15）
        apply(winDir, 'titleMatch', context.stage, 0, 0, 4, 7, true);
        apply(loseDir, 'titleMatch', context.stage, 0, 0, 10, 15, true);
      }
    }

    // ═══ M-14: 宿命の決着（rivalry80+ AND bond60+ AND mq75+ → rivalry 0〜5にリセット）
    if (rAB.rivalry >= 80 && rAB.bond >= 60 && rBA.rivalry >= 80 && rBA.bond >= 60 && context.mq >= 75) {
      const m14Reset = Engine.rng.float(rng) * 5;
      rAB.rivalry = this._clampAxisValue(m14Reset, 'rivalry');
      rBA.rivalry = this._clampAxisValue(m14Reset, 'rivalry');
      apply('AB', 'destinySettled', context.stage, 5, 10, 0, 0, false);
      apply('BA', 'destinySettled', context.stage, 5, 10, 0, 0, false);
      context._destinySettled = true;
    }

    // ═══ M-10 / M-CO2: 因縁決着 → rivalryリセット（0〜10）（M-14不成立時のみ）
    if (context.rivalryResolved && !context._destinySettled) {
      const m10Reset = Engine.rng.float(rng) * 10;
      rAB.rivalry = this._clampAxisValue(m10Reset, 'rivalry');
      rBA.rivalry = this._clampAxisValue(m10Reset, 'rivalry');
      if (isCrossOrg) {
        // M-CO2 抗争和解: bond +12〜+20（§4.4.3 乗数対象外）
        apply('AB', 'rivalryResolutionCross', context.stage, 12, 20, 0, 0, false, { skipCrossOrgBondMult: true });
        apply('BA', 'rivalryResolutionCross', context.stage, 12, 20, 0, 0, false, { skipCrossOrgBondMult: true });
      } else {
        apply('AB', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
        apply('BA', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
      }
    }

    // ═══ M-11: 怪我 ═══
    if (context.injuredId && !isDraw) {
      const winnerId = aWon ? charIdA : charIdB;
      // 加害者 = 勝者（勝者が被害者の場合は敗者を加害者とみなす）
      const injurerIsA = context.injuredId === charIdA ? false : true;
      // ↑ injuredIdがAなら被害者はA→加害者はB→injurerIsA=false
      //   injuredIdがBなら被害者はB→加害者はA→injurerIsA=true
      // ただし勝者が被害者の場合は逆転
      const actualInjurerIsA = context.injuredId !== winnerId
        ? (aWon)   // 通常: 勝者が加害者
        : (!aWon); // 勝者=被害者 → 敗者が加害者

      const injurerDir = actualInjurerIsA ? 'AB' : 'BA';
      const victimDir  = actualInjurerIsA ? 'BA' : 'AB';

      if (isSquash) {
        // 圧勝時: 加害者→被害者 bond-1~-3 rivalry±0, 被害者→加害者 bond-1~-3 rivalry+2~+5
        apply(injurerDir, 'injury', context.stage, -3, -1, 0, 0, true);
        apply(victimDir,  'injury', context.stage, -3, -1, 2, 5, true);
      } else if (context.mq >= 80) {
        // 名勝負時: 加害者→被害者 bond-1~-3, 被害者→加害者 ±0（名勝負なら恨みは少ない）
        apply(injurerDir, 'injury', context.stage, -3, -1, 0, 0, true);
        apply(victimDir,  'injury', context.stage, 0, 0, 0, 0, true);
      } else {
        // それ以外: 加害者→被害者 bond-1~-3, 被害者→加害者 bond-1 rivalry+1~+3
        apply(injurerDir, 'injury', context.stage, -3, -1, 0, 0, true);
        apply(victimDir,  'injury', context.stage, -1, -1, 1, 3, true);
      }
    }

    // ═══ M-12: 連敗ストリーク（3+） ═══
    if (bWon && (context.losingStreakA || 0) >= 3) {
      apply('AB', 'losingStreak', 'any', 0, 0, 2, 4, true);
    }
    if (aWon && (context.losingStreakB || 0) >= 3) {
      apply('BA', 'losingStreak', 'any', 0, 0, 2, 4, true);
    }

    // ═══ Phase 5: 認知イベント（片側因縁時の試合結果効果） ═══
    if (!isDraw && state.rivalries) {
      const rivalryKey = Engine.title.getRivalryKey(charIdA, charIdB);
      const rivalEntry = state.rivalries[rivalryKey];
      if (rivalEntry && rivalEntry.oneSided) {
        const aggressorIsA = rivalEntry.oneSided === charIdA;
        const aggressorWon = aggressorIsA ? aWon : bWon;
        // 攻撃側が勝利 or 僅差 → 被攻撃側が攻撃側を認知（rivalry大ブースト）
        if (aggressorWon || isCloseMatch) {
          if (aggressorIsA) {
            // B→A rivalry +8~+12（「この相手、手強い…」認知ブースト）
            apply('BA', 'recognition', context.stage, 0, 0, 8, 12, false);
          } else {
            apply('AB', 'recognition', context.stage, 0, 0, 8, 12, false);
          }
        }
        // 攻撃側が大敗（MQ差15以上は判定できないのでMQ50未満 & squashで代用）→ 攻撃側のrivalry/bond低下
        if (!aggressorWon && isSquash) {
          if (aggressorIsA) {
            // A→B rivalry -5~-8, bond -3~-5
            rAB.rivalry += roll(-8, -5);
            rAB.bond += roll(-5, -3);
          } else {
            rBA.rivalry += roll(-8, -5);
            rBA.bond += roll(-5, -3);
          }
        }
      }
    }

    // ═══ M-13: キャリアベストMQ更新（逓減なし） ═══
    if (context.isCareerBestA) {
      apply('AB', 'careerBest', context.stage, 2, 3, 3, 5, false);
      apply('BA', 'careerBest', context.stage, 2, 3, 3, 5, false);
    }
    if (context.isCareerBestB) {
      apply('AB', 'careerBest', context.stage, 2, 3, 3, 5, false);
      apply('BA', 'careerBest', context.stage, 2, 3, 3, 5, false);
    }

    // ═══ G-08: prove mode中の試合 ═══
    if (context.isProveModeA) {
      // 対戦相手B → prove mode選手A: bond +1~+3, rivalry +2~+4
      apply('BA', 'proveMode', context.stage, 1, 3, 2, 4, false);
    }
    if (context.isProveModeB) {
      // 対戦相手A → prove mode選手B: bond +1~+3, rivalry +2~+4
      apply('AB', 'proveMode', context.stage, 1, 3, 2, 4, false);
    }

    // ═══ M-15: 番狂わせ（OVR差10+の格下勝利、M-03と排他） ═══
    let m15UpsetEvent = null; // { winnerId, loserId } — 関数末尾で modal enqueue
    if (!isDraw && !isSquash) {
      const ovrA = context.ovrA || 0;
      const ovrB = context.ovrB || 0;
      const ovrDiff = Math.abs(ovrA - ovrB);
      if (ovrDiff >= 10) {
        const underdogIsA = ovrA < ovrB;
        const underdogWon = (underdogIsA && aWon) || (!underdogIsA && bWon);
        if (underdogWon) {
          m15UpsetEvent = {
            winnerId: aWon ? charIdA : charIdB,
            loserId: aWon ? charIdB : charIdA,
          };
          const winDir = aWon ? 'AB' : 'BA';
          const loseDir = aWon ? 'BA' : 'AB';
          // bond-rebalance v2.3: 逆恨みのbondダメージ強化 (-4〜-2 → -7〜-4)
          apply(winDir, 'upset', context.stage, 0, 0, 3, 5, true);        // 格下→格上
          apply(loseDir, 'upset', context.stage, -7, -4, 4, 7, true);     // 格上→格下（逆恨み）
        }
      }
    }

    // ═══ M-16: 対戦成績蓄積（h2hベースの連敗判定） ═══
    if (!isDraw && state.h2h) {
      const winnerId = aWon ? charIdA : charIdB;
      const loserId = aWon ? charIdB : charIdA;
      const winDir = aWon ? 'AB' : 'BA';
      const loseDir = aWon ? 'BA' : 'AB';

      // 敗者の対勝者への連敗数をh2hから計算
      const loserRec = Engine.h2h.getRecordFor(state, loserId, winnerId);
      const loserConsecLosses = loserRec ? loserRec.losses - loserRec.wins : 0;
      // 3連敗+相当: losses - wins >= 3 を簡易判定（厳密にはmatchupLogだが、h2hで近似）
      if (loserRec && loserRec.losses >= 3 && loserConsecLosses >= 3) {
        apply(loseDir, 'h2hFrustration', context.stage, -3, -1, 3, 5, false);
      }

      // 勝者が以前この相手に大きく負け越していた場合 → 連敗ストップ
      const winnerRec = Engine.h2h.getRecordFor(state, winnerId, loserId);
      const winnerPrevDeficit = winnerRec ? winnerRec.losses - winnerRec.wins : 0;
      if (winnerRec && winnerRec.losses >= 3 && winnerPrevDeficit >= 2) {
        // 今回勝ったので deficit が 2以上→以前は3以上だった
        apply(winDir, 'h2hBreakthrough', context.stage, 2, 4, -4, -2, false);
      }
    }

    // ═══ M-17: 凡戦ペナルティ（MQ40未満） ═══
    // bond-rebalance v2.3: 敗者側のbondダメージ微増 (-4〜-2 → -5〜-3)
    if (context.mq < 40) {
      if (isDraw) {
        apply('AB', 'boringMatch', context.stage, -2, -1, 0, 0, true);
        apply('BA', 'boringMatch', context.stage, -2, -1, 0, 0, true);
      } else {
        const winDir = aWon ? 'AB' : 'BA';
        const loseDir = aWon ? 'BA' : 'AB';
        apply(winDir, 'boringMatch', context.stage, -2, -1, 0, 0, true);
        apply(loseDir, 'boringMatch', context.stage, -5, -3, 0, 0, true);
      }
    }

    // ═══ B-3: 元同僚 vs 元同僚 初対戦（離脱後初接触のみ、逓減なし、cross-org乗数対象外） ═══
    if (Engine.orgTimeline && Engine.orgTimeline.checkFirstMeetSinceDeparture(state, charIdA, charIdB)) {
      apply('AB', 'firstMeetExColleague', context.stage, -3, -1, 6, 10, false, { skipCrossOrgBondMult: true });
      apply('BA', 'firstMeetExColleague', context.stage, -3, -1, 6, 10, false, { skipCrossOrgBondMult: true });
    }

    // ── 他団体戦キャップ: 1試合あたりのrivalry増加を+35に制限 ──
    if (isCrossOrg) {
      const deltaAB = rAB.rivalry - rivalryStartAB;
      if (deltaAB > CROSS_ORG_RIVALRY_CAP) rAB.rivalry = rivalryStartAB + CROSS_ORG_RIVALRY_CAP;
      const deltaBA = rBA.rivalry - rivalryStartBA;
      if (deltaBA > CROSS_ORG_RIVALRY_CAP) rBA.rivalry = rivalryStartBA + CROSS_ORG_RIVALRY_CAP;
    }

    // ── knownRival自動付与: MQ65+ OR 僅差の好勝負 → decay 1/3で持続 ──
    if (context.mq >= 65 || isCloseMatch) {
      if (!rAB.knownRival) rAB.knownRival = true;
      if (!rBA.knownRival) rBA.knownRival = true;
    }

    // ── 全値クランプ ──
    rAB.bond = this._clampAxisValue(rAB.bond, 'bond');
    rAB.rivalry = this._clampAxisValue(rAB.rivalry, 'rivalry');
    rBA.bond = this._clampAxisValue(rBA.bond, 'bond');
    rBA.rivalry = this._clampAxisValue(rBA.rivalry, 'rivalry');

    rels[keyAB] = rAB;
    rels[keyBA] = rBA;

    let newState = { ...state, relationships: rels, relationshipCounters: counters };

    // ── F-5 ライバル同期昇格チェック (relationship-flags-spec-v1.0 §2.5) ──
    newState = Engine.relationships.flags.applyRivalCohort(newState, charIdA, charIdB);

    // ── F-6 憧れ抽選: 名勝負 (M-04 / M-CO1, mq>=80) 直後 ──
    if (context.mq >= 80) {
      newState = Engine.relationships.flags.processAdmireCandidates(newState, charIdA, charIdB, context);
    }

    // ── F-6 消滅判定: OVR 追い抜き / bond<30 はここでも更新後にチェック ──
    newState = Engine.relationships.flags.checkAdmireDissolution(newState);

    // ── F-7 嫉妬撃破判定: 勝者が敗者を OVR で上回っていれば envy 解消 (M-6) ──
    {
      let victorId = null, loserId = null;
      if (aWon) { victorId = charIdA; loserId = charIdB; }
      else if (bWon) { victorId = charIdB; loserId = charIdA; }
      if (victorId != null) {
        newState = Engine.relationships.flags.checkEnvyDissolution(newState, victorId, loserId);
      }
    }

    // ── F-7 嫉妬抽選: タイトルマッチ or PPV 後、勝者 (B 候補) について発火 ──
    if (context.isTitleMatch || context.stage === 'ppv') {
      let triggerB = null;
      if (aWon) triggerB = charIdA;
      else if (bWon) triggerB = charIdB;
      if (triggerB != null) {
        const triggerKind = context.isTitleMatch ? 'title' : 'ppv';
        newState = Engine.relationships.flags.processEnvyCandidates(newState, triggerB, triggerKind);
      }
    }

    // ── bond-rebalance v2.3: M-15 番狂わせ逆恨みポップアップ enqueue ──
    if (m15UpsetEvent && Engine.relationships.flags && Engine.relationships.flags._enqueueModal) {
      newState = Engine.relationships.flags._enqueueModal(newState, 'M-15', {
        fromId: m15UpsetEvent.loserId,
        toId: m15UpsetEvent.winnerId,
      });
    }

    return newState;
  },

  // ═══════════════════════════════════════════════════════════════
  //  applyTagMatchResult — タッグマッチ結果の関係値反映
  //  対戦相手4組 + チームメイト2組の bond/rivalry を更新
  // ═══════════════════════════════════════════════════════════════
  applyTagMatchResult(state, teamAIds, teamBIds, tagResult, rng) {
    if (!state.relationships) return state;
    const rels = { ...state.relationships };
    const counters = { ...(state.relationshipCounters || {}) };
    const absWeek = Engine.util.absWeek(state.season || 1, state.week || 1);
    const roll = (min, max) => min + Engine.rng.float(rng) * (max - min);

    const _apply = (idFrom, idTo, bondDelta, rivalryDelta) => {
      const k = `${idFrom}>${idTo}`;
      const r = { ...(rels[k] || { bond: 50, rivalry: 0 }) };
      r.bond = this._applyAxisDelta(r.bond, bondDelta, 'bond');
      r.rivalry = this._applyAxisDelta(r.rivalry, rivalryDelta, 'rivalry');
      r.bond = this._clampAxisValue(r.bond, 'bond');
      r.rivalry = this._clampAxisValue(r.rivalry, 'rivalry');
      rels[k] = r;
    };

    const mq = tagResult.mq || 50;
    const isPinFinish = tagResult.winAttribution && tagResult.winAttribution.pinnedBy && tagResult.winAttribution.pinnedWho;
    const pinnedBy = isPinFinish ? tagResult.winAttribution.pinnedBy : null;
    const pinnedWho = isPinFinish ? tagResult.winAttribution.pinnedWho : null;
    const SC = TAG_REL_SCALE;

    // ── A. 対戦相手ペア（4組） ──
    for (const aId of teamAIds) {
      for (const bId of teamBIds) {
        // このペアがフォール決着ペアか
        const isPinPair = (aId === pinnedBy && bId === pinnedWho) || (bId === pinnedBy && aId === pinnedWho);
        const scale = isPinPair ? SC.pinPairScale : SC.opponentScale;

        // 逓減カウンター
        const cKey = this._counterKey(aId, bId, 'tagMatch', 'tag');
        const counter = counters[cKey] || { count: 0, lastWeek: 0 };
        const dimMult = this.getDiminishingMultiplier(counter.count);
        counters[cKey] = { count: counter.count + 1, lastWeek: absWeek };

        // 基本rivalry（全ペア）
        const baseRivalry = roll(0.15, 0.75) * scale * dimMult;
        _apply(aId, bId, 0, baseRivalry);
        _apply(bId, aId, 0, baseRivalry);

        // MQ80+: bond/rivalry両方増
        if (mq >= 80) {
          const bondG = roll(1.5, 3) * scale * dimMult;
          const rivG = roll(4, 6) * scale * dimMult;
          _apply(aId, bId, bondG, rivG);
          _apply(bId, aId, bondG, rivG);
        }
        // MQ<40: bond減
        if (mq < 40) {
          const bondL = roll(-1, 0) * scale * dimMult;
          _apply(aId, bId, bondL, 0);
          _apply(bId, aId, bondL, 0);
        }
        // フォール決着ペア: 追加rivalry
        if (isPinPair) {
          const pinRiv = roll(1, 3) * dimMult;
          _apply(pinnedWho, pinnedBy, 0, pinRiv);  // 負けた側→勝った側
        }
      }
    }

    // ── B. チームメイトペア（2組） ──
    const teams = [
      { ids: teamAIds, isWinner: tagResult.winner === 'teamA' },
      { ids: teamBIds, isWinner: tagResult.winner === 'teamB' },
    ];

    for (const team of teams) {
      const [id1, id2] = team.ids;
      // 勝敗ベース
      if (tagResult.winner !== 'draw') {
        const ev = team.isWinner ? SC.teamWin : SC.teamLoss;
        const bondD = roll(ev.bond[0], ev.bond[1]);
        const rivD = ev.rivalry ? roll(ev.rivalry[0], ev.rivalry[1]) : 0;
        _apply(id1, id2, bondD, rivD);
        _apply(id2, id1, bondD, rivD);
      }
    }

    // ドラマイベント
    for (const d of (tagResult.dramaSummary || [])) {
      if (d.type === 'cutinSave') {
        const ev = SC.cutinSave;
        _apply(d.saved, d.by, roll(ev.bond[0], ev.bond[1]), 0);  // 救われた→救った
        _apply(d.by, d.saved, roll(ev.bond[0] * 0.5, ev.bond[1] * 0.5), 0);  // 救った→救われた
      } else if (d.type === 'betrayal') {
        const ev = SC.betrayal;
        _apply(d.victim, d.by, roll(ev.bond[0], ev.bond[1]), roll(ev.rivalry[0], ev.rivalry[1]));
        _apply(d.by, d.victim, roll(ev.bond[0] * 0.3, ev.bond[1] * 0.3), 0);
      } else if (d.type === 'friendlyFire') {
        const ev = SC.friendlyFire;
        _apply(d.victim, d.victim, 0, 0); // noop guard
        // victim取得: friendlyFireのvictimはエプロン側
        // team判定してパートナーを特定
        const ffTeamIds = d.team === 'A' ? teamBIds : teamAIds; // ffは防御側チームに発生
        const partnerId = ffTeamIds.find(id => id !== d.victim);
        if (partnerId) {
          _apply(d.victim, partnerId, roll(ev.bond[0], ev.bond[1]), 0);
        }
      } else if (d.type === 'hotTag') {
        const ev = SC.hotTag;
        const htTeamIds = d.team === 'A' ? teamAIds : teamBIds;
        _apply(htTeamIds[0], htTeamIds[1], roll(ev.bond[0], ev.bond[1]), 0);
        _apply(htTeamIds[1], htTeamIds[0], roll(ev.bond[0], ev.bond[1]), 0);
      } else if (d.type === 'doubleTeam' && Array.isArray(d.by) && d.by.length === 2) {
        const ev = SC.doubleTeam;
        _apply(d.by[0], d.by[1], roll(ev.bond[0], ev.bond[1]), 0);
        _apply(d.by[1], d.by[0], roll(ev.bond[0], ev.bond[1]), 0);
      }
    }

    return { ...state, relationships: rels, relationshipCounters: counters };
  },

  // ══════════════════════════════════════════════════════════════════════════════
  //  Flags サブシステム (relationship-flags-spec-v1.0)
  //  数値層・称号層に続く第3層「事件ベースのフラグ」
  //  実装は Phase 1〜7 で段階的に追加。Phase 1 = 基盤のみ
  // ══════════════════════════════════════════════════════════════════════════════
  flags: {

    // ── 性格×アーキタイプ 許し度ベーススコア (spec §3.3 / §3.4) ──
    // §3.3 だけでは shy が定義されていないため quiet 同等 -1 とする
    PERSONALITY_FORGIVENESS_BASE: {
      earnest: 1, easygoing: 3, emotional: -2, bold: 0,
      quiet: -1, normal: 0, shy: -1,
    },
    // §3.4 archetype 'earnest' は実コードに存在せず 'composed' を +1 にマップ
    // 'emotional'(archetype) も実コードに無く、personality 側 emotional で吸収
    ARCHETYPE_FORGIVENESS_BASE: {
      polite: 2, ojousama: 1, composed: 1, seductive: 0,
      normal: 0, cool: -2, delinquent: -3,
    },

    // ── 共通ユーティリティ ──
    // 注: flags/flagLockouts/flagCounters は state 直下に置く。
    // state.relationships は pair-key namespace (例 "1>2") で
    // processWeeklyDecay 等が rebuild するため、混在すると失われる
    _ensureInit(state) {
      if (!state.relationshipFlags) state.relationshipFlags = {
        betrayer: [], returner: [], master: [], cohort: [],
        rivalCohort: [], admire: [], envy: [],
      };
      if (!state.relationshipFlagLockouts) state.relationshipFlagLockouts = {};
      if (!state.relationshipFlagCounters) state.relationshipFlagCounters = {};
      if (!state.relationshipHistory) state.relationshipHistory = { betrayalRecord: [] };
      else if (!state.relationshipHistory.betrayalRecord) state.relationshipHistory.betrayalRecord = [];
      if (!state._modalQueue) state._modalQueue = [];
      return state;
    },

    _enqueueModal(state, type, payload) {
      if (!state._modalQueue) state._modalQueue = [];
      state._modalQueue.push({ type, payload, season: state.season, week: state.week });
      return state;
    },

    _enqueueModalWithCooldown(state, type, payload, cooldownKey, cooldownWeeks) {
      Engine.relationships.flags._ensureInit(state);
      if (!cooldownKey) return this._enqueueModal(state, type, payload);
      const absWeek = Engine.util.absWeek(state.season, state.week);
      const counters = state.relationshipFlagCounters || {};
      const entry = counters[cooldownKey];
      const lastWeek = typeof entry === 'number' ? entry : (entry && entry.lastWeek != null ? entry.lastWeek : -999999);
      if ((cooldownWeeks || 0) > 0 && (absWeek - lastWeek) < cooldownWeeks) return state;
      counters[cooldownKey] = { lastWeek: absWeek };
      state.relationshipFlagCounters = counters;
      return this._enqueueModal(state, type, payload);
    },

    // ペアキー: smaller-larger 順 (spec §5.2 default)
    _pairKey(idA, idB) {
      const a = Math.min(idA, idB);
      const b = Math.max(idA, idB);
      return `${a}>${b}`;
    },

    // ロックアウト確認
    isLockedOut(state, kind, idA, idB) {
      const lo = state.relationshipFlagLockouts;
      if (!lo) return false;
      // master は masterId>discipleId、admire/envy は fromId>toId 順
      return lo[`${kind}:${idA}>${idB}`] === true;
    },

    // ── キャパシティクエリ ──
    hasAdmire(state, fromId) {
      const list = state.relationshipFlags?.admire || [];
      return list.some(e => e.fromId === fromId);
    },
    hasEnvy(state, fromId) {
      const list = state.relationshipFlags?.envy || [];
      return list.some(e => e.fromId === fromId);
    },
    hasRivalCohort(state, charId) {
      const list = state.relationshipFlags?.rivalCohort || [];
      return list.some(e => e.idA === charId || e.idB === charId);
    },

    // ══════════════════════════════════════════════════════════
    //  F-4 同期 (cohort) — spec §2.4
    //  同週入団ペアに自動付与。専用モーダルなし。
    //  既存 O-14 同期入団の数値変動はそのまま維持
    // ══════════════════════════════════════════════════════════
    applyCohort(state, newFighters) {
      Engine.relationships.flags._ensureInit(state);
      if (!Array.isArray(newFighters) || newFighters.length < 2) return state;
      const flags = state.relationshipFlags;
      for (let i = 0; i < newFighters.length; i++) {
        for (let j = i + 1; j < newFighters.length; j++) {
          const a = newFighters[i].id;
          const b = newFighters[j].id;
          if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue;
          const idA = Math.min(a, b);
          const idB = Math.max(a, b);
          if (flags.cohort.some(e => e.idA === idA && e.idB === idB)) continue;
          flags.cohort.push({
            idA, idB,
            cohortSeason: state.season,
            cohortWeek: state.week,
          });
        }
      }
      return state;
    },

    // ══════════════════════════════════════════════════════════
    //  F-5 ライバル同期 (rivalCohort) — spec §2.5
    //  同期フラグ保有 + 双方 rivalry≥60 + 両者キャパ空き
    //  applyMatchResult 直後に呼ばれる
    // ══════════════════════════════════════════════════════════
    applyRivalCohort(state, idA, idB) {
      Engine.relationships.flags._ensureInit(state);
      if (idA === idB) return state;
      const flags = state.relationshipFlags;

      const pairA = Math.min(idA, idB);
      const pairB = Math.max(idA, idB);

      // 同期フラグ確認
      const isCohort = flags.cohort.some(e => e.idA === pairA && e.idB === pairB);
      if (!isCohort) return state;

      // 既に rivalCohort 確立済みなら何もしない
      if (flags.rivalCohort.some(e => e.idA === pairA && e.idB === pairB)) return state;

      // rivalry 60+ 双方向チェック
      const rels = state.relationships;
      const rivalryAB = rels[`${idA}>${idB}`]?.rivalry ?? 0;
      const rivalryBA = rels[`${idB}>${idA}`]?.rivalry ?? 0;
      if (rivalryAB < 60 || rivalryBA < 60) return state;

      // 両者ライバル同期未保有確認 (spec §2.5: 1人につき1組)
      if (Engine.relationships.flags.hasRivalCohort(state, idA)) return state;
      if (Engine.relationships.flags.hasRivalCohort(state, idB)) return state;

      flags.rivalCohort.push({
        idA: pairA,
        idB: pairB,
        establishedSeason: state.season,
        establishedWeek: state.week,
      });

      Engine.relationships.flags._enqueueModal(state, 'M-14', {
        idA, idB,
        season: state.season, week: state.week,
      });

      return state;
    },

    // ══════════════════════════════════════════════════════════
    //  F-1 裏切り者 (betrayer) — spec §2.1
    //  applyContractDepartureBetrayal の最後で呼ぶ
    //  残留者全員から離脱者へ向けてフラグを貼る (1対多)
    // ══════════════════════════════════════════════════════════
    applyBetrayer(state, departerId, byIds) {
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      // 既存エントリがあれば byIds をマージ
      const existing = flags.betrayer.find(e => e.targetId === departerId);
      if (existing) {
        const merged = new Set([...(existing.byIds || []), ...byIds]);
        existing.byIds = [...merged];
      } else {
        flags.betrayer.push({
          targetId: departerId,
          byIds: [...byIds],
          issuedSeason: state.season,
          issuedWeek: state.week,
        });
      }
      Engine.relationships.flags._enqueueModal(state, 'M-1', {
        departerId, byIds: [...byIds],
      });
      return state;
    },

    // ══════════════════════════════════════════════════════════
    //  F-2 出戻り判定ヘルパー — spec §7-2
    // ══════════════════════════════════════════════════════════
    _isReturning(fighter) {
      const tl = fighter?.orgTimeline;
      if (!Array.isArray(tl) || tl.length === 0) return false;
      const playerEntries = tl.filter(e => e?.orgId === 'player');
      if (playerEntries.length === 0) return false;
      // 直近の player 離脱以降に他組織エントリがあるか
      let lastPlayerExit = null;
      for (let i = playerEntries.length - 1; i >= 0; i--) {
        const e = playerEntries[i];
        if (e.toSeason != null) {
          lastPlayerExit = Engine.util.absWeek(e.toSeason, e.toWeek || 1);
          break;
        }
      }
      if (lastPlayerExit == null) return false; // まだ player 在籍中履歴のみ
      const otherAfter = tl.some(e =>
        e.orgId && e.orgId !== 'player' && e.orgId !== 'fa' &&
        e.fromSeason != null &&
        Engine.util.absWeek(e.fromSeason, e.fromWeek || 1) >= lastPlayerExit
      );
      return otherAfter;
    },

    // ══════════════════════════════════════════════════════════
    //  F-2 出戻り (returner) — spec §2.2 + §3 個別反応
    //  Engine.orgTimeline.transfer 内で targetOrgId === 'player' の時に呼ばれる
    // ══════════════════════════════════════════════════════════
    applyReturner(state, fighter) {
      Engine.relationships.flags._ensureInit(state);
      if (!Engine.relationships.flags._isReturning(fighter)) return state;

      const flags = state.relationshipFlags;
      const tl = fighter.orgTimeline || [];
      const playerEntries = tl.filter(e => e.orgId === 'player' && e.toSeason != null);
      const lastExit = playerEntries[playerEntries.length - 1];
      if (!lastExit) return state;

      flags.returner.push({
        fighterId: fighter.id,
        leftSeason: lastExit.toSeason,
        leftWeek: lastExit.toWeek || 1,
        returnedSeason: state.season,
        returnedWeek: state.week,
      });

      // §3 出戻り個別反応フロー
      state = Engine.relationships.flags._applyReturnerForgivenessFlow(state, fighter);
      return state;
    },

    // ══════════════════════════════════════════════════════════
    //  許し度スコア計算 — spec §3.2
    // ══════════════════════════════════════════════════════════
    _calcForgivenessScore(state, remaining, returner) {
      const FF = Engine.relationships.flags;
      const pBase = FF.PERSONALITY_FORGIVENESS_BASE[remaining.personality] ?? 0;
      const aBase = FF.ARCHETYPE_FORGIVENESS_BASE[remaining.archetype] ?? 0;
      const rels = state.relationships || {};
      const bond = rels[`${remaining.id}>${returner.id}`]?.bond ?? 50;
      const rivalry = rels[`${remaining.id}>${returner.id}`]?.rivalry ?? 0;
      return pBase + aBase + (bond - 50) / 5 - rivalry / 10;
    },

    // ══════════════════════════════════════════════════════════
    //  出戻り個別反応フロー — spec §3.1〜§3.8
    // ══════════════════════════════════════════════════════════
    _applyReturnerForgivenessFlow(state, returner) {
      const flags = state.relationshipFlags;
      const idx = flags.betrayer.findIndex(e => e.targetId === returner.id);
      if (idx < 0) return state; // 裏切り者扱いされていなかった出戻り
      const entry = flags.betrayer[idx];

      const reactions = [];
      const rels = { ...(state.relationships || {}) };
      for (const byId of entry.byIds) {
        const remaining = (state.roster || []).find(c => c.id === byId);
        if (!remaining) continue; // 既に離脱・引退している
        const score = Engine.relationships.flags._calcForgivenessScore(state, remaining, returner);
        const forgiven = score >= 0;
        reactions.push({ byId, forgiven, score: Math.round(score * 10) / 10 });
        if (!forgiven) {
          // §3.5 許さない: bond -10 / rivalry +10
          const key = `${byId}>${returner.id}`;
          const r = rels[key] || { bond: 50, rivalry: 0 };
          rels[key] = {
            ...r,
            bond: Math.max(0, (r.bond ?? 50) - 10),
            rivalry: Math.min(100, (r.rivalry ?? 0) + 10),
          };
        }
      }

      // §3.7 履歴転記
      state.relationshipHistory.betrayalRecord.push({
        departerId: returner.id,
        leftSeason: entry.issuedSeason,
        leftWeek: entry.issuedWeek,
        returnedSeason: state.season,
        returnedWeek: state.week,
        betrayedBy: [...entry.byIds],
        forgiven: reactions.filter(r => r.forgiven).map(r => r.byId),
        notForgiven: reactions.filter(r => !r.forgiven).map(r => r.byId),
      });

      // §3.8 betrayer エントリ削除
      flags.betrayer.splice(idx, 1);

      // M-12 enqueue
      Engine.relationships.flags._enqueueModal(state, 'M-12', {
        returnerId: returner.id,
        reactions,
      });

      return { ...state, relationships: rels };
    },

    // ══════════════════════════════════════════════════════════
    //  F-3 師弟 (master) — spec §2.3
    //  条件 12 週連続維持 → 40% 抽選 1 回 → 確定 or 永久ロックアウト
    //  processWeeklyDecay 末尾で呼ばれる
    // ══════════════════════════════════════════════════════════
    _checkMasterConditions(state, masterId, discipleId) {
      const master = (state.roster || []).find(c => c.id === masterId);
      const disciple = (state.roster || []).find(c => c.id === discipleId);
      if (!master || !disciple) return false;
      // 同団体は roster に両者いる時点で満たす
      // 師匠在籍 ≥ 156週
      const absNow = Engine.util.absWeek(state.season, state.week);
      const masterJoin = master.orgJoinWeek ?? absNow;
      if (absNow - masterJoin < 156) return false;
      // bond 双方向
      const rels = state.relationships || {};
      if ((rels[`${discipleId}>${masterId}`]?.bond ?? 0) < 70) return false;
      if ((rels[`${masterId}>${discipleId}`]?.bond ?? 0) < 55) return false;
      // OVR 差 ≥ 15
      if (Engine.util.ov(master) < Engine.util.ov(disciple) + 15) return false;
      // 同スタイル
      if (!master.style || master.style !== disciple.style) return false;
      return true;
    },

    processMasterCandidates(state) {
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      const counters = state.relationshipFlagCounters;
      const lockouts = state.relationshipFlagLockouts;
      const roster = state.roster || [];
      const absNow = Engine.util.absWeek(state.season, state.week);

      // 候補ペア = roster 直積、ovr 差で師弟方向決定
      // ロスター人数 8〜16 程度なので O(n^2) は許容
      for (let i = 0; i < roster.length; i++) {
        for (let j = 0; j < roster.length; j++) {
          if (i === j) continue;
          const master = roster[i];
          const disciple = roster[j];
          // 既に同方向の master フラグがあればスキップ
          if (flags.master.some(e => e.masterId === master.id && e.discipleId === disciple.id)) continue;
          // ロックアウト
          if (lockouts[`master:${master.id}>${disciple.id}`]) continue;
          // 条件チェック
          const ok = Engine.relationships.flags._checkMasterConditions(state, master.id, disciple.id);
          const ckey = `masterCandidate:${master.id}>${disciple.id}`;
          if (!ok) {
            // 条件崩れ: カウンタリセット
            if (counters[ckey]) delete counters[ckey];
            continue;
          }
          // 維持週カウンタを +1
          const cur = counters[ckey] || { weeks: 0, lastUpdateAbsWeek: 0 };
          // 同じ週で二重カウントしない保険
          if (cur.lastUpdateAbsWeek === absNow) continue;
          cur.weeks += 1;
          cur.lastUpdateAbsWeek = absNow;
          counters[ckey] = cur;

          // 12 週到達 → 40% 抽選
          if (cur.weeks >= 12) {
            const rng = Engine.rng.create(
              Engine.rng.derive(state.rngSeed || 1, 0xBE83, master.id, disciple.id)
            );
            if (Engine.rng.float(rng) < 0.40) {
              flags.master.push({
                masterId: master.id,
                discipleId: disciple.id,
                establishedSeason: state.season,
                establishedWeek: state.week,
              });
              Engine.relationships.flags._enqueueModal(state, 'M-13', {
                masterId: master.id, discipleId: disciple.id,
              });
            } else {
              // 永久ロックアウト
              lockouts[`master:${master.id}>${disciple.id}`] = true;
            }
            delete counters[ckey];
          }
        }
      }
      return state;
    },

    applyMaster: null, // 互換のため残す（直接付与経路は無い）

    // ══════════════════════════════════════════════════════════
    //  F-6 憧れ (admire) — spec §2.6
    //  4段ゲート: 状況 / キャパ / 契機（名勝負） / 抽選30%
    //  抽選は最大3回。3回目で外したら永久ロックアウト
    // ══════════════════════════════════════════════════════════
    _admireGate1Status(state, A, B) {
      // 同団体（roster に両方いる時点で OK。ここでは双方 player roster 想定）
      if (A.id === B.id) return false;
      // bond[A→B] ≥ 60
      const bondAB = state.relationships?.[`${A.id}>${B.id}`]?.bond ?? 0;
      if (bondAB < 60) return false;
      // OVR/タイトル: B が A より OVR +10以上 OR B にタイトル保持経験あり
      const ovrA = Engine.util.ov(A);
      const ovrB = Engine.util.ov(B);
      const ovrPass = ovrB >= ovrA + 10;
      let titlePass = false;
      const titles = state.titles || {};
      for (const t of Object.values(titles)) {
        if (!t) continue;
        if (t.championId === B.id) { titlePass = true; break; }
        // championLog に履歴
        if (Array.isArray(t.championLog) && t.championLog.some(h => h && h.id === B.id)) {
          titlePass = true; break;
        }
      }
      if (!ovrPass && !titlePass) return false;
      // 経験年数: A の在籍年数 < B の在籍年数
      const absNow = Engine.util.absWeek(state.season, state.week);
      const aTen = absNow - (A.orgJoinWeek ?? absNow);
      const bTen = absNow - (B.orgJoinWeek ?? absNow);
      if (aTen >= bTen) return false;
      return true;
    },

    processAdmireCandidates(state, fighterAId, fighterBId, matchContext) {
      // matchContext.mq >= 80 が呼び出し条件 (M-04 / M-CO1)
      if (!matchContext || matchContext.mq < 80) return state;
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      const counters = state.relationshipFlagCounters;
      const lockouts = state.relationshipFlagLockouts;

      // 名勝負参加者を B 候補として両方走査
      const matchParticipants = [fighterAId, fighterBId];
      const roster = state.roster || [];

      for (const targetId of matchParticipants) {
        const B = roster.find(c => c.id === targetId);
        if (!B) continue; // クロスオーグマッチで AI 側選手は対象外
        for (const A of roster) {
          if (A.id === B.id) continue;
          // ゲート1
          if (!Engine.relationships.flags._admireGate1Status(state, A, B)) continue;
          // ゲート2: A はキャパ空き
          if (Engine.relationships.flags.hasAdmire(state, A.id)) continue;
          // ロックアウト確認
          if (lockouts[`admire:${A.id}>${B.id}`]) continue;
          // 既存重複防止
          if (flags.admire.some(e => e.fromId === A.id && e.toId === B.id)) continue;

          // ゲート4: 抽選 30%
          const drawKey = `admireDraws:${A.id}>${B.id}`;
          const drawCount = counters[drawKey] ?? 0;
          const rng = Engine.rng.create(
            Engine.rng.derive(state.rngSeed || 1, 0xBE80, A.id, B.id, drawCount)
          );
          if (Engine.rng.float(rng) < 0.30) {
            flags.admire.push({
              fromId: A.id, toId: B.id,
              issuedSeason: state.season,
              issuedWeek: state.week,
            });
            Engine.relationships.flags._enqueueModal(state, 'M-2', {
              fromId: A.id, toId: B.id,
            });
            delete counters[drawKey];
          } else {
            counters[drawKey] = drawCount + 1;
            if (counters[drawKey] >= 3) {
              lockouts[`admire:${A.id}>${B.id}`] = true;
              delete counters[drawKey];
            }
          }
        }
      }
      return state;
    },

    // ══════════════════════════════════════════════════════════
    //  F-6 消滅判定 — spec §2.6
    //  達成（OVR追い抜き）/ 喪失（B引退）/ 幻滅（bond<30）
    // ══════════════════════════════════════════════════════════
    checkAdmireDissolution(state) {
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      if (!flags.admire || flags.admire.length === 0) return state;
      const findAny = (id) => {
        const r = (state.roster || []).find(c => c.id === id);
        if (r) return { fighter: r, retired: false };
        if (state.aiOrgs) {
          for (const org of Object.values(state.aiOrgs)) {
            const f = (org.roster || []).find(c => c.id === id);
            if (f) return { fighter: f, retired: false };
          }
        }
        const fa = (state.freeAgents || []).find(c => c.id === id);
        if (fa) return { fighter: fa, retired: false };
        // retired 判定
        const retiredIds = state.retiredIds || [];
        if (retiredIds.includes(id)) return { fighter: null, retired: true };
        const retF = (state.retiredFighters || []).find(f => f && f.id === id);
        if (retF) return { fighter: retF, retired: true };
        return { fighter: null, retired: false };
      };

      const kept = [];
      for (const entry of flags.admire) {
        const { fromId, toId } = entry;
        const aInfo = findAny(fromId);
        const bInfo = findAny(toId);
        if (!aInfo.fighter && !aInfo.retired) { kept.push(entry); continue; }
        // A 引退: 憧れ自体が消滅（ログのみ、モーダル不要）
        if (aInfo.retired) continue;
        // B 引退 → 喪失
        if (bInfo.retired) {
          Engine.relationships.flags._enqueueModal(state, 'M-4', { fromId, toId });
          continue;
        }
        if (!bInfo.fighter) { kept.push(entry); continue; }
        // 達成: A の OVR > B の OVR
        if (Engine.util.ov(aInfo.fighter) > Engine.util.ov(bInfo.fighter)) {
          Engine.relationships.flags._enqueueModal(state, 'M-3', { fromId, toId });
          continue;
        }
        // 幻滅: bond[A→B] < 30
        const bond = state.relationships?.[`${fromId}>${toId}`]?.bond ?? 50;
        if (bond < 30) {
          Engine.relationships.flags._enqueueModal(state, 'M-5', { fromId, toId });
          continue;
        }
        kept.push(entry);
      }
      flags.admire = kept;
      return state;
    },

    applyAdmire: null, // 直接付与経路なし

    // ══════════════════════════════════════════════════════════
    //  F-7 嫉妬 (envy) — spec §2.7 + §7-1
    //  4段ゲート: 状況6条件AND / キャパ / 契機 / 抽選40%
    //  抽選 1 回限り、外したら即永久ロックアウト
    //  風化: 1-2-3年経過時に 20% で消滅
    // ══════════════════════════════════════════════════════════

    // §7-1 簡易実装: 直近12週で B が「目立つ実績」あるか
    _hasRecentLimelight(state, B) {
      const absNow = Engine.util.absWeek(state.season, state.week);
      const cutoff = absNow - 12;
      // タイトル現役 OR 過去12週内に championLog 入り
      const titles = state.titles || {};
      for (const t of Object.values(titles)) {
        if (!t) continue;
        if (t.championId === B.id && (t.wonWeek ?? 0) >= cutoff) return true;
        if (Array.isArray(t.championLog)) {
          if (t.championLog.some(h => h && h.id === B.id && (h.absWeek ?? h.wonWeek ?? 0) >= cutoff)) {
            return true;
          }
        }
      }
      // h2h history で名勝負 (mq≥80) 出場
      const h2h = state.h2h || {};
      for (const key of Object.keys(h2h)) {
        const [aS, bS] = key.split('>').map(Number);
        if (aS !== B.id && bS !== B.id) continue;
        const hist = h2h[key]?.history || [];
        for (const m of hist) {
          if (!m || (m.mq ?? 0) < 80) continue;
          const aw = Engine.util.absWeek(m.s || 1, m.w || 1);
          if (aw >= cutoff) return true;
        }
      }
      return false;
    },

    // §7-1 簡易実装: 直近12週で A が「干されている／伸び悩み」
    _isRecentlySidelined(state, A) {
      const absNow = Engine.util.absWeek(state.season, state.week);
      const cutoff = absNow - 12;
      // 出場数: h2h history で A の試合数を集計
      const h2h = state.h2h || {};
      let aMatches = 0;
      let teamMatches = 0;
      for (const key of Object.keys(h2h)) {
        const [aS, bS] = key.split('>').map(Number);
        const hist = h2h[key]?.history || [];
        for (const m of hist) {
          if (!m) continue;
          const aw = Engine.util.absWeek(m.s || 1, m.w || 1);
          if (aw < cutoff) continue;
          teamMatches++;
          if (aS === A.id || bS === A.id) aMatches++;
        }
      }
      const rosterSize = (state.roster || []).length || 1;
      const expected = teamMatches > 0 ? (teamMatches * 2) / rosterSize : 0;
      if (expected > 0 && aMatches < expected * 0.5) return true;
      // popularity 12週前比 -3 以上
      if (Array.isArray(A.popHistory)) {
        const old = A.popHistory.find(p => p && (p.absWeek ?? 0) <= cutoff);
        const cur = A.popularity ?? A.pop ?? 0;
        if (old && (old.value ?? 0) - cur >= 3) return true;
      }
      return false;
    },

    _envyGate1Status(state, A, B) {
      if (A.id === B.id) return false;
      // 関係: 同団体 OR 過去同団体 OR 同期
      const sameOrg = (state.roster || []).some(c => c.id === A.id) &&
                     (state.roster || []).some(c => c.id === B.id);
      const isCohort = (state.relationshipFlags?.cohort || []).some(e => {
        const small = Math.min(A.id, B.id);
        const big = Math.max(A.id, B.id);
        return e.idA === small && e.idB === big;
      });
      // 過去同団体: orgTimeline で player 重複
      let pastSameOrg = false;
      if (Array.isArray(A.orgTimeline) && Array.isArray(B.orgTimeline)) {
        const aPlayer = A.orgTimeline.some(e => e?.orgId === 'player');
        const bPlayer = B.orgTimeline.some(e => e?.orgId === 'player');
        if (aPlayer && bPlayer) pastSameOrg = true;
      }
      if (!sameOrg && !pastSameOrg && !isCohort) return false;

      // rivalry[A→B] ≥ 30
      const rivalryAB = state.relationships?.[`${A.id}>${B.id}`]?.rivalry ?? 0;
      if (rivalryAB < 30) return false;

      // OVR 差: B が A より +5 以上
      if (Engine.util.ov(B) < Engine.util.ov(A) + 5) return false;

      // 人気差: B が A より +20 以上
      const popA = A.popularity ?? A.pop ?? 0;
      const popB = B.popularity ?? B.pop ?? 0;
      if (popB < popA + 20) return false;

      // B 直近実績
      if (!Engine.relationships.flags._hasRecentLimelight(state, B)) return false;

      // A 直近不調
      if (!Engine.relationships.flags._isRecentlySidelined(state, A)) return false;

      return true;
    },

    // 契機: B のタイトル獲得・防衛 / B の PPV メイン出場
    // 呼び出し側は B の試合直後に呼ぶ
    processEnvyCandidates(state, fighterBId, trigger) {
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      const lockouts = state.relationshipFlagLockouts;
      const B = (state.roster || []).find(c => c.id === fighterBId);
      if (!B) return state;

      for (const A of (state.roster || [])) {
        if (A.id === B.id) continue;
        // ロックアウト
        if (lockouts[`envy:${A.id}>${B.id}`]) continue;
        // キャパ空き
        if (Engine.relationships.flags.hasEnvy(state, A.id)) continue;
        // ゲート1 状況条件
        if (!Engine.relationships.flags._envyGate1Status(state, A, B)) continue;
        // 既存重複防止
        if (flags.envy.some(e => e.fromId === A.id && e.toId === B.id)) continue;

        // ゲート4: 1回限り抽選 40%
        const rng = Engine.rng.create(
          Engine.rng.derive(state.rngSeed || 1, 0xBE81, A.id, B.id)
        );
        if (Engine.rng.float(rng) < 0.40) {
          flags.envy.push({
            fromId: A.id, toId: B.id,
            issuedSeason: state.season,
            issuedWeek: state.week,
            issuedAbsWeek: Engine.util.absWeek(state.season, state.week),
          });
          Engine.relationships.flags._enqueueModal(state, 'M-11', {
            fromId: A.id, toId: B.id, trigger: trigger || null,
          });
        } else {
          // 即ロックアウト
          lockouts[`envy:${A.id}>${B.id}`] = true;
        }
      }
      return state;
    },

    // 風化: 1-2-3年経過時に 20% 確率で消滅
    processEnvyAging(state) {
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      if (!flags.envy || flags.envy.length === 0) return state;
      const absNow = Engine.util.absWeek(state.season, state.week);
      const rng = Engine.rng.create(
        Engine.rng.derive(state.rngSeed || 1, 0xBE82, state.season, state.week)
      );
      const kept = [];
      for (const entry of flags.envy) {
        const elapsed = absNow - (entry.issuedAbsWeek ?? 0);
        if (elapsed === 52 || elapsed === 104 || elapsed === 156) {
          if (Engine.rng.float(rng) < 0.20) {
            const modalKey = elapsed === 52 ? 'M-8' : elapsed === 104 ? 'M-9' : 'M-10';
            Engine.relationships.flags._enqueueModal(state, modalKey, {
              fromId: entry.fromId, toId: entry.toId,
            });
            continue;
          }
        }
        kept.push(entry);
      }
      flags.envy = kept;
      return state;
    },

    // 消滅判定: B 引退（宙吊り M-7）/ A が B を OVR で上回って勝利（撃破 M-6）
    // 撃破は applyMatchResult 内、引退は processWeeklyDecay 内で呼ぶ
    checkEnvyDissolution(state, victorId, loserId) {
      Engine.relationships.flags._ensureInit(state);
      const flags = state.relationshipFlags;
      if (!flags.envy || flags.envy.length === 0) return state;

      // 撃破判定: victorId === entry.fromId, loserId === entry.toId, ovr 上回り
      if (victorId != null && loserId != null) {
        const victor = (state.roster || []).find(c => c.id === victorId)
                    || Object.values(state.aiOrgs || {}).flatMap(o => o.roster || []).find(c => c.id === victorId);
        const loser = (state.roster || []).find(c => c.id === loserId)
                    || Object.values(state.aiOrgs || {}).flatMap(o => o.roster || []).find(c => c.id === loserId);
        if (victor && loser && Engine.util.ov(victor) > Engine.util.ov(loser)) {
          const idx = flags.envy.findIndex(e => e.fromId === victorId && e.toId === loserId);
          if (idx >= 0) {
            Engine.relationships.flags._enqueueModal(state, 'M-6', {
              fromId: victorId, toId: loserId,
            });
            flags.envy.splice(idx, 1);
          }
        }
      }

      // 引退判定: B が引退 (retiredIds)
      const retiredIds = new Set(state.retiredIds || []);
      const kept = [];
      for (const entry of flags.envy) {
        if (retiredIds.has(entry.toId)) {
          Engine.relationships.flags._enqueueModal(state, 'M-7', {
            fromId: entry.fromId, toId: entry.toId,
          });
          continue;
        }
        kept.push(entry);
      }
      flags.envy = kept;
      return state;
    },

    applyEnvy: null,
  },

};

// ══════════════════════════════════════════════════════════════════════════════
//  Engine.challengeRequest — 選手発信 挑戦試合打診イベント
//  challenge-request-spec-v0.1.md
//  Phase 1: heat 計算 / 候補抽選 / GameState 構造 / CDガード
// ══════════════════════════════════════════════════════════════════════════════
Engine.challengeRequest = {

  /** GameState の challengeRequest フィールドを保証 */
  ensureInit(state) {
    if (!state.challengeRequest) {
      return {
        ...state,
        challengeRequest: {
          pendingThisWeek: null,
          acceptedThisSeason: 0,
          perOrgThisSeason: {},
          cdByFighter: {},
          cdByPair: {}
        }
      };
    }
    return state;
  },

  /** heat = rivalry + max(0, 50-bond)*0.8 + max(0, bond-75)*0.6 + (rivalry≥70 ? +10 : 0) */
  computeHeat(rivalry, bond) {
    const r = rivalry || 0;
    const b = bond != null ? bond : 50;
    return r
      + Math.max(0, 50 - b) * 0.8
      + Math.max(0, b - 75) * 0.6
      + (r >= 70 ? 10 : 0);
  },

  /** ペアキー（"selfId>otherId"、関係性 _key と独立。CD 用） */
  _pairKey(selfId, otherId) { return `${selfId}>${otherId}`; },

  /** 発火条件チェック（前提条件 §1.2） */
  _passesPrereq(state, self, other, otherOrgId) {
    if (!self || !other) return false;
    if (self.injury || self.forcedRest || self.suspended) return false;
    if (self.isRental) return false;
    if (other.injury || other.forcedRest) return false;
    // 相手団体 disbanded チェック
    const otherOrg = state.aiOrgs && state.aiOrgs[otherOrgId];
    if (!otherOrg || otherOrg.disbanded) return false;
    // 直近8週以内の対戦実績なし（h2h.lastMatch を参照）
    const rec = Engine.h2h && Engine.h2h.getRecord ? Engine.h2h.getRecord(state, self.id, other.id) : null;
    if (rec && rec.lastMatch && rec.lastMatch.season != null && rec.lastMatch.week != null) {
      const lastAbs = (rec.lastMatch.season - 1) * 20 + rec.lastMatch.week;
      const nowAbs = (state.season - 1) * 20 + (state.week || 1);
      if ((nowAbs - lastAbs) < 8) return false;
    }
    return true;
  },

  /** CD ガードチェック */
  _passesCD(state, self, other) {
    const cr = state.challengeRequest;
    if (!cr) return true;
    const nowAbs = (state.season - 1) * 20 + (state.week || 1);
    const fCD = cr.cdByFighter[self.id];
    if (fCD != null && (nowAbs - fCD) < 24) return false;
    const pCD = cr.cdByPair[this._pairKey(self.id, other.id)];
    if (pCD != null) {
      // NO 選択時は 52、それ以外は 36 で延長されている前提（cdByPair に格納された値の意味は週数差）
      if ((nowAbs - pCD.lastWeek) < pCD.coolWeeks) return false;
    }
    return true;
  },

  /** クォータチェック */
  _passesQuota(state, otherOrgId) {
    const cr = state.challengeRequest;
    if (!cr) return true;
    if (cr.acceptedThisSeason >= 2) return false;
    if ((cr.perOrgThisSeason[otherOrgId] || 0) >= 1) return false;
    return true;
  },

  /** 4週サイクル抽選トリガー判定（シーズン第3週以降、4週ごと） */
  _isSamplingWeek(state) {
    const w = state.week || 0;
    return w >= 3 && (w - 3) % 4 === 0;
  },

  /**
   * 週次主処理。pendingThisWeek を立てる（UI 側でモーダル表示）。
   * 既に pendingThisWeek がある（前週の打診が未解決）場合は何もしない。
   */
  processWeekly(state, rng) {
    let s = this.ensureInit(state);
    if (s.challengeRequest.pendingThisWeek) return s;
    if (!this._isSamplingWeek(s)) return s;
    if ((s.orgPop || 0) < 15) return s;
    if (!s.relationships) return s;

    // 候補収集: 自団体選手 → 各他団体選手
    const candidates = [];
    const playerRoster = (s.roster || []).filter(f => !f.isRental);
    const aiOrgs = s.aiOrgs || {};

    for (const self of playerRoster) {
      for (const [orgId, org] of Object.entries(aiOrgs)) {
        if (!org || org.disbanded || !Array.isArray(org.roster)) continue;
        if (!this._passesQuota(s, orgId)) continue;
        for (const other of org.roster) {
          if (!other || other.id == null) continue;
          const key = Engine.relationships._key(self.id, other.id);
          const rel = s.relationships[key];
          if (!rel) continue;
          let heat = this.computeHeat(rel.rivalry, rel.bond);
          // firing-grudge-spec-v0.1 Phase 3: 出戻りケース（player team に在籍する grudge 保持者）の heat バイアス
          if (self.grudge && self.grudge.intensity > 0 && self.grudge.vsOrgId === orgId) {
            heat += self.grudge.intensity * 0.3;
          }
          if (heat < 90) continue;
          if (!this._passesPrereq(s, self, other, orgId)) continue;
          if (!this._passesCD(s, self, other)) continue;
          candidates.push({
            selfId: self.id, otherId: other.id, otherOrgId: orgId,
            heat, rivalry: rel.rivalry, bond: rel.bond
          });
        }
      }
    }

    // firing-grudge-spec-v0.1 Phase 3b: 逆方向（AI org の grudge 保持者 → player team）
    // grudge.vsOrgId === 'player' & intensity > 0 のキャラのみが打診者になり得る。
    for (const [orgId, org] of Object.entries(aiOrgs)) {
      if (!org || org.disbanded || !Array.isArray(org.roster)) continue;
      // クォータは「打診者の所属org（=ここでは AI org）」基準で 1/シーズン
      if (!this._passesQuota(s, orgId)) continue;
      for (const fired of org.roster) {
        if (!fired || fired.id == null) continue;
        const g = fired.grudge;
        if (!g || g.vsOrgId !== 'player' || !g.intensity || g.intensity <= 0) continue;
        for (const target of playerRoster) {
          const key = Engine.relationships._key(fired.id, target.id);
          const rel = s.relationships[key];
          if (!rel) continue;
          let heat = this.computeHeat(rel.rivalry, rel.bond) + g.intensity * 0.3;
          if (heat < 90) continue;
          // 前提条件: 打診者(fired)が injury/forcedRest/suspended ではない、target も同様、player団体 not disbanded(常true)
          if (fired.injury || fired.forcedRest || fired.suspended) continue;
          if (target.injury || target.forcedRest) continue;
          // 直近8週以内の対戦実績なし
          const rec = Engine.h2h && Engine.h2h.getRecord ? Engine.h2h.getRecord(s, fired.id, target.id) : null;
          if (rec && rec.lastMatch && rec.lastMatch.season != null && rec.lastMatch.week != null) {
            const lastAbs = (rec.lastMatch.season - 1) * 20 + rec.lastMatch.week;
            const nowAbs = (s.season - 1) * 20 + (s.week || 1);
            if ((nowAbs - lastAbs) < 8) continue;
          }
          // CD（pair / fighter）は同方向で参照（fired→target）
          if (!this._passesCD(s, fired, target)) continue;
          candidates.push({
            _inverse: true,
            selfId: fired.id, otherId: target.id, otherOrgId: 'player',
            requesterOrgId: orgId,
            heat, rivalry: rel.rivalry, bond: rel.bond
          });
        }
      }
    }

    if (candidates.length === 0) return s;

    // heat 最上位の 1 組のみを採用
    candidates.sort((a, b) => b.heat - a.heat);
    const picked = candidates[0];

    const pending = {
      selfId: picked.selfId,
      otherId: picked.otherId,
      otherOrgId: picked.otherOrgId,
      heat: picked.heat,
      rivalry: picked.rivalry,
      bond: picked.bond,
      issuedSeason: s.season,
      issuedWeek: s.week
    };
    if (picked._inverse) {
      pending._inverse = true;
      pending.requesterOrgId = picked.requesterOrgId;
    }
    return {
      ...s,
      challengeRequest: {
        ...s.challengeRequest,
        pendingThisWeek: pending
      }
    };
  },

  /** YES 確定: クォータ・CD を更新し、pendingThisWeek をクリア */
  acceptPending(state) {
    let s = this.ensureInit(state);
    const p = s.challengeRequest.pendingThisWeek;
    if (!p) return s;
    const nowAbs = (s.season - 1) * 20 + (s.week || 1);
    const cr = { ...s.challengeRequest };
    cr.acceptedThisSeason = (cr.acceptedThisSeason || 0) + 1;
    // クォータキー: forward は相手AI org、inverse は requester AI org（どちらも「player ↔ AI org」のペア対戦カウントとして対称）
    const quotaOrgKey = p._inverse ? p.requesterOrgId : p.otherOrgId;
    cr.perOrgThisSeason = { ...cr.perOrgThisSeason, [quotaOrgKey]: (cr.perOrgThisSeason[quotaOrgKey] || 0) + 1 };
    cr.cdByFighter = { ...cr.cdByFighter, [p.selfId]: nowAbs };
    cr.cdByPair = { ...cr.cdByPair, [this._pairKey(p.selfId, p.otherId)]: { lastWeek: nowAbs, coolWeeks: 36 } };
    cr.pendingThisWeek = null;
    return { ...s, challengeRequest: cr };
  },

  /** NO 確定: CD を 52 週で記録し、pendingThisWeek をクリア */
  rejectPending(state) {
    let s = this.ensureInit(state);
    const p = s.challengeRequest.pendingThisWeek;
    if (!p) return s;
    const nowAbs = (s.season - 1) * 20 + (s.week || 1);
    const cr = { ...s.challengeRequest };
    cr.cdByFighter = { ...cr.cdByFighter, [p.selfId]: nowAbs };
    cr.cdByPair = { ...cr.cdByPair, [this._pairKey(p.selfId, p.otherId)]: { lastWeek: nowAbs, coolWeeks: 52 } };
    cr.pendingThisWeek = null;
    return { ...s, challengeRequest: cr };
  },

  /** 打診者セリフ抽出（属性(style) × 性格 × タイプ で分岐）
   *  60% で style-flavored を採用、40% で性格-base にフォールバック。未定義セルも base へ。 */
  pickRequesterLine(requester, bond, rng) {
    if (!requester) return null;
    const personality = requester.personality || 'normal';
    const style = requester.style || null;
    const type = (bond != null && bond < 50) ? 'hostile' : 'respectful';

    const _pickFromBase = () => {
      if (typeof CHALLENGE_REQUEST_LINES === 'undefined') return null;
      const byPers = CHALLENGE_REQUEST_LINES[personality] || CHALLENGE_REQUEST_LINES.normal;
      if (!byPers) return null;
      const arr = byPers[type] || byPers.respectful || byPers.hostile;
      if (!arr || arr.length === 0) return null;
      const idx = rng ? Engine.rng.int(rng, 0, arr.length - 1) : 0;
      return arr[idx];
    };

    // style-flavored を優先抽選（60%）
    if (style && typeof CHALLENGE_REQUEST_LINES_STYLE !== 'undefined') {
      const useStyle = rng ? Engine.rng.int(rng, 0, 99) < 60 : true;
      if (useStyle) {
        const byStyle = CHALLENGE_REQUEST_LINES_STYLE[style];
        const byPers = byStyle && (byStyle[personality] || byStyle.normal);
        const arr = byPers && (byPers[type] || byPers.respectful || byPers.hostile);
        if (arr && arr.length > 0) {
          const idx = rng ? Engine.rng.int(rng, 0, arr.length - 1) : 0;
          return arr[idx];
        }
      }
    }
    return _pickFromBase();
  },

  /** 社長視点の関係性フレーバー1行（数値を出さない） */
  pickFlavorLine(rivalry, bond, requesterName, otherName) {
    const pure = bond < 50 && rivalry >= 60;       // 純粋憎悪
    const respect = bond >= 75;                     // 好敵手
    const r = requesterName || '○○', o = otherName || '△△';
    if (pure) {
      const opts = [
        `${r}の中で、何かが煮詰まっている`,
        `${r}は${o}の名前を出すたびに目つきが変わる`,
        `${r}の溜めたものは、リングでしか出せない`
      ];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    if (respect) {
      const opts = [
        `${r}は${o}との次の一戦を待ち続けている`,
        `${r}の中で${o}は、特別な位置にいる`,
        `${r}が${o}の試合映像を何度も見返しているらしい`
      ];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    const opts = [
      `${r}は${o}に強い思いを抱いている`,
      `${r}の中で、${o}との決着が宿題になっている`,
      `${r}は${o}を意識しすぎている節がある`
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  },

  /** シーズン境界でクォータをリセット */
  resetSeasonalQuota(state) {
    if (!state.challengeRequest) return state;
    return {
      ...state,
      challengeRequest: {
        ...state.challengeRequest,
        acceptedThisSeason: 0,
        perOrgThisSeason: {}
      }
    };
  },

  // ── Phase 3: 試合カード生成・解決 ──

  /** 打診者+味方2 vs 相手+相手陣2 の3シングル連戦カードを生成。
   *  forward: 打診者=player roster / 相手=AI org roster
   *  inverse: 打診者=AI org roster (grudge保持者) / 相手=player roster
   *  teamA は常に「打診者陣」、teamB は常に「相手陣」。
   *  isInverse / requesterOrgId / opponentOrgId をカードに保持し、result 適用側で書き戻し方向を決定する。
   *  足りなければ null を返す。 */
  buildMatchCard(state) {
    const cr = state.challengeRequest;
    if (!cr || !cr.pendingThisWeek) return null;
    const p = cr.pendingThisWeek;
    const isInverse = !!p._inverse;

    const _healthy = f => f && !f.injury && !f.forcedRest && !f.suspended && !f.isRental;
    const _bond = (a, b) => {
      const k = `${Math.min(a, b)}>${Math.max(a, b)}`;
      return ((state.relationships || {})[k] || {}).bond || 50;
    };
    const _ov = f => Engine.util && Engine.util.ov ? Engine.util.ov(f)
      : Math.round(((f.pw || 0) + (f.sp || 0) + (f.te || 0) + (f.st || 0) + (f.mn || 0)) / 5);

    let requester, opponent, requesterOrgRoster, opponentOrgRoster, requesterOrgId, opponentOrgId, requesterOrgName, opponentOrgName;
    if (isInverse) {
      const reqOrg = (state.aiOrgs || {})[p.requesterOrgId];
      if (!reqOrg || !Array.isArray(reqOrg.roster)) return null;
      requester = reqOrg.roster.find(f => f.id === p.selfId);
      opponent = (state.roster || []).find(f => f.id === p.otherId);
      if (!requester || !opponent) return null;
      requesterOrgRoster = reqOrg.roster;
      opponentOrgRoster = state.roster || [];
      requesterOrgId = p.requesterOrgId;
      opponentOrgId = 'player';
      requesterOrgName = reqOrg.name || (state.rivalOrgNames && state.rivalOrgNames[p.requesterOrgId]) || p.requesterOrgId;
      opponentOrgName = state.orgName || 'プレイヤー団体';
    } else {
      requester = (state.roster || []).find(f => f.id === p.selfId);
      const otherOrg = (state.aiOrgs || {})[p.otherOrgId];
      if (!requester || !otherOrg || !Array.isArray(otherOrg.roster)) return null;
      opponent = otherOrg.roster.find(f => f.id === p.otherId);
      if (!opponent) return null;
      requesterOrgRoster = state.roster || [];
      opponentOrgRoster = otherOrg.roster;
      requesterOrgId = 'player';
      opponentOrgId = p.otherOrgId;
      requesterOrgName = state.orgName || 'プレイヤー団体';
      opponentOrgName = otherOrg.name || (state.rivalOrgNames && state.rivalOrgNames[p.otherOrgId]) || p.otherOrgId;
    }

    // 打診者陣 味方2名
    const reqMates = requesterOrgRoster
      .filter(f => f.id !== requester.id && _healthy(f) && (isInverse ? true : !f.isRental))
      .sort((a, b) => {
        const d = _bond(b.id, requester.id) - _bond(a.id, requester.id);
        return d !== 0 ? d : _ov(b) - _ov(a);
      });
    if (reqMates.length < 2) return null;

    // 相手陣 2名
    const oppMates = opponentOrgRoster
      .filter(f => f.id !== opponent.id && _healthy(f) && (isInverse ? !f.isRental : true))
      .sort((a, b) => _ov(b) - _ov(a));
    if (oppMates.length < 2) return null;

    return {
      isInverse,
      requesterId: requester.id,
      opponentId: opponent.id,
      requesterOrgId,
      opponentOrgId,
      requesterOrgName,
      opponentOrgName,
      // 後方互換: forward 既存呼出が参照する otherOrgId / otherOrgName
      otherOrgId: opponentOrgId,
      otherOrgName: opponentOrgName,
      teamA: [requester, reqMates[0], reqMates[1]],
      teamB: [opponent, oppMates[0], oppMates[1]],
    };
  },

  /** 3シングル連戦をシミュレート。state は変更しない。
   *  returns { matches: [{fighterA, fighterB, winner, mq, finMove}], winsA, winsB, teamWin: 'A'|'B'|'draw' } */
  resolveMatchCard(card, rng) {
    const matches = [];
    for (let i = 0; i < 3; i++) {
      const fA = card.teamA[i];
      const fB = card.teamB[i];
      const res = Engine.battle.simulateMatch(fA, fB, rng, 1);
      matches.push({
        fighterA: fA,
        fighterB: fB,
        winner: res.winner,
        mq: res.mq,
        finType: res.finType,
        finMove: res.finMove,
      });
    }
    const winsA = matches.filter(m => m.winner === 'left').length;
    const winsB = matches.filter(m => m.winner === 'right').length;
    let teamWin = 'draw';
    if (winsA > winsB) teamWin = 'A';
    else if (winsB > winsA) teamWin = 'B';
    return { matches, winsA, winsB, teamWin };
  }

};

// ══════════════════════════════════════════════════════════════════════════════
//  Engine.snapshot — スナップショット通知システム
//  snapshot-engine-instruction.md
// ══════════════════════════════════════════════════════════════════════════════
Engine.snapshot = {

  // ═══ メイン生成関数 ═══
  generate(rng, state) {
    // 1. 候補収集
    const candidates = this._collectCandidates(rng, state);

    // 2. クールダウン除外（R3はクールダウン無視）
    const filtered = candidates.filter(c =>
      c.source === 'R3' || !this._isOnCooldown(c, state)
    );

    // 3. embedded（枠外確定）と slot（通常枠）を分離
    const embedded = filtered.filter(c => c.type === 'embedded');
    const slotCandidates = filtered.filter(c => c.type !== 'embedded');

    // 4. 通常枠の抽選（最大2件、R3は必ず含む）
    const slotSelected = this._weightedSample(rng, slotCandidates, 2);

    // 5. テキスト生成
    const allSelected = [...embedded, ...slotSelected];
    const snapshots = allSelected.map(c => this._buildSnapshotText(rng, c, state));

    // 6. クールダウン更新（embedded以外の slotSelected のみ対象）
    const newCooldowns = this._updateCooldowns(slotSelected, state);

    // 7. フラグクリア（全選手）
    const cleanedRoster = state.roster.map(f => {
      const { _grievanceFlags, _relationshipFlags, _departureBondImpact,
              _snapshotBonusSources, ...clean } = f;
      return clean;
    });

    const newState = {
      ...state,
      roster: cleanedRoster,
      _snapshotCooldowns: newCooldowns,
    };

    // 因縁解消フラグクリア
    delete newState._rivalryResolvedThisWeek;

    return { snapshots, state: newState };
  },

  // ═══ 候補収集 ═══
  _collectCandidates(rng, state) {
    const candidates = [];
    const roster = state.roster;
    const relationships = state.relationships || {};

    const seenR1Pairs = new Set();

    roster.forEach(f => {
      if (f.injury || f.isRental) return;

      // ── G系: _grievanceFlags ──
      const gf = f._grievanceFlags;
      if (gf) {
        if (gf.G1 && Engine.rng.float(rng) < 0.03) {
          candidates.push({ source: 'G1', weight: 2, fighterId: f.id, type: 'slot' });
        }
        if (gf.G2 && Engine.rng.float(rng) < 0.03) {
          candidates.push({ source: 'G2', weight: 3, fighterId: f.id, fighter2Id: gf.G2_juniorId || null, type: 'slot' });
        }
        if (gf.G3 && Engine.rng.float(rng) < 0.04) {
          candidates.push({ source: 'G3', weight: 4, fighterId: f.id, type: 'slot' });
        }
        if (gf.G4 && Engine.rng.float(rng) < 0.02) {
          candidates.push({ source: 'G4', weight: 1, fighterId: f.id, type: 'slot' });
        }
      }

      // ── R系: _relationshipFlags ──
      const rf = f._relationshipFlags;
      if (rf) {
        if (rf.R2 && Engine.rng.float(rng) < 0.03) {
          candidates.push({ source: 'R2', weight: 4, fighterId: f.id, type: 'slot' });
        }
        if (rf.R4 && Engine.rng.float(rng) < 0.12) {
          candidates.push({ source: 'R4', weight: 3, fighterId: f.id, fighter2Id: rf.R4, type: 'slot' });
        }
        if (rf.R5 && Engine.rng.float(rng) < 0.12) {
          candidates.push({ source: 'R5', weight: 3, fighterId: f.id, fighter2Id: rf.R5, type: 'slot' });
        }
        if (rf.R1) {
          rf.R1.forEach(oppId => {
            const pairKey = Math.min(f.id, oppId) + '_' + Math.max(f.id, oppId);
            if (!seenR1Pairs.has(pairKey) && Engine.rng.float(rng) < 0.05) {
              candidates.push({ source: 'R1', weight: 3, fighterId: f.id, fighter2Id: oppId, type: 'slot' });
              seenR1Pairs.add(pairKey);
            }
          });
        }
      }

      // ── R3: 仲良し退団（100%発火、rng判定なし） ──
      const dbi = f._departureBondImpact;
      if (dbi && Engine.relationships.isPositiveBond(dbi.bond)) {
        candidates.push({
          source: 'R3', weight: 10, fighterId: f.id, fighter2Id: dbi.departedId,
          bond: dbi.bond, departedName: dbi.departedName, reason: dbi.reason,
          type: 'slot',
        });
      }

      // ── ブレイクスルー / careerBestMQ / 対抗戦勝利: _snapshotBonusSources ──
      const sbs = f._snapshotBonusSources;
      if (sbs) {
        sbs.forEach(source => {
          if (source === 'breakthrough') {
            candidates.push({ source: 'breakthrough', fighterId: f.id, type: 'embedded' });
          }
          if (source === 'careerBestMQ' && Engine.rng.float(rng) < 0.08) {
            candidates.push({ source: 'careerBestMQ', weight: 2, fighterId: f.id, type: 'slot' });
          }
          if (source === 'warVictory') {
            candidates.push({ source: 'warVictory', fighterId: f.id, type: 'embedded' });
          }
        });
      }
    });

    // ── Phase 4系: リアルタイム走査（フックフラグなし） ──
    const playerRoster = roster.filter(f => !f.injury && !f.isRental);
    const seenPhasePairs = new Set();

    for (let i = 0; i < playerRoster.length; i++) {
      for (let j = i + 1; j < playerRoster.length; j++) {
        const a = playerRoster[i];
        const b = playerRoster[j];
        const pairKey = Math.min(a.id, b.id) + '_' + Math.max(a.id, b.id);
        if (seenPhasePairs.has(pairKey)) continue;
        seenPhasePairs.add(pairKey);

        // 性格不一致: personalityCompatibility が -3以下
        if (typeof Engine.relationships.personalityCompatibility === 'function') {
          const compat = Engine.relationships.personalityCompatibility(a, b);
          if (compat <= -3 && Engine.rng.float(rng) < 0.02) {
            candidates.push({ source: 'friction', weight: 2, fighterId: a.id, fighter2Id: b.id, type: 'slot' });
          }
        }

        // 世代近接: 年齢差3以内
        const ageDiff = Math.abs((a.age || 20) - (b.age || 20));
        if (ageDiff <= 3 && Engine.rng.float(rng) < 0.02) {
          candidates.push({ source: 'generation', weight: 2, fighterId: a.id, fighter2Id: b.id, type: 'slot' });
        }
      }
    }

    // 因縁解消: state._rivalryResolvedThisWeek
    if (state._rivalryResolvedThisWeek) {
      state._rivalryResolvedThisWeek.forEach(pair => {
        if (Engine.rng.float(rng) < 0.30) {
          candidates.push({
            source: 'rivalryResolved', weight: 5,
            fighterId: pair.fighterId, fighter2Id: pair.fighter2Id,
            type: 'slot',
          });
        }
      });
    }

    return candidates;
  },

  // ═══ クールダウン判定 ═══
  _isOnCooldown(candidate, state) {
    const key = this._cooldownKey(candidate);
    const cooldowns = state._snapshotCooldowns || {};
    const lastWeek = cooldowns[key];
    if (lastWeek == null) return false;
    const currentAbsWeek = Engine.util.absWeek(state.season, state.week);
    return (currentAbsWeek - lastWeek) < 6;
  },

  _cooldownKey(candidate) {
    if (candidate.fighter2Id != null) {
      const min = Math.min(candidate.fighterId, candidate.fighter2Id);
      const max = Math.max(candidate.fighterId, candidate.fighter2Id);
      return `pair_${min}_${max}`;
    }
    return `fighter_${candidate.fighterId}`;
  },

  // ═══ 重み付き抽選（非復元抽出） ═══
  _weightedSample(rng, candidates, maxCount) {
    if (candidates.length === 0) return [];

    const guaranteed = candidates.filter(c => c.source === 'R3');
    const rest = candidates.filter(c => c.source !== 'R3');

    if (guaranteed.length >= maxCount) {
      return guaranteed.slice(0, maxCount);
    }

    const result = [...guaranteed];
    let remainingSlots = maxCount - result.length;
    let pool = [...rest];

    while (remainingSlots > 0 && pool.length > 0) {
      const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
      if (totalWeight <= 0) break;

      let roll = Engine.rng.float(rng) * totalWeight;
      let selectedIdx = 0;
      for (let i = 0; i < pool.length; i++) {
        roll -= pool[i].weight;
        if (roll <= 0) { selectedIdx = i; break; }
      }

      result.push(pool[selectedIdx]);
      pool.splice(selectedIdx, 1);
      remainingSlots--;
    }

    return result;
  },

  // ═══ クールダウン更新 ═══
  _updateCooldowns(selected, state) {
    const currentAbsWeek = Engine.util.absWeek(state.season, state.week);
    const cooldowns = { ...(state._snapshotCooldowns || {}) };

    selected.forEach(c => {
      const key = this._cooldownKey(c);
      cooldowns[key] = currentAbsWeek;
    });

    // 24週以上前のエントリを削除（state肥大防止）
    Object.keys(cooldowns).forEach(key => {
      if (currentAbsWeek - cooldowns[key] > 24) {
        delete cooldowns[key];
      }
    });

    return cooldowns;
  },

  // ═══ テキスト生成 ═══
  _buildSnapshotText(rng, candidate, state) {
    const { source, fighterId, fighter2Id } = candidate;
    const fighter = state.roster.find(f => f.id === fighterId);
    const name = fighter ? fighter.name : '???';

    let name2 = null;
    if (fighter2Id != null) {
      const f2 = state.roster.find(f => f.id === fighter2Id);
      name2 = f2 ? f2.name : (candidate.departedName || '???');
    }

    // ── R3 特殊分岐 ──
    if (source === 'R3') {
      if (Engine.relationships.getBondBand(candidate.bond) === 'devoted') {
        // タイプD: モーダル
        const line = this._resolveVoice(rng, SNAPSHOT_TEXTS.R3.modal, fighter);
        const text = this._expandTemplate(line, name, name2);
        return {
          text, source, fighterId, fighter2Id,
          modalType: 'R3',
          departedName: candidate.departedName,
          reason: candidate.reason,
        };
      } else {
        // タイプA: ログのみ
        const line = this._pickRandom(rng, SNAPSHOT_TEXTS.R3.scene);
        return { text: this._expandTemplate(line, name, name2), source, fighterId, fighter2Id };
      }
    }

    // ── embedded タイプ ──
    if (candidate.type === 'embedded') {
      if (source === 'breakthrough') {
        const line = this._resolveVoice(rng, SNAPSHOT_TEXTS.breakthrough.voice, fighter);
        return { text: `${name}\u3000${line}`, source, fighterId, embedded: true };
      }
      if (source === 'warVictory') {
        const data = SNAPSHOT_TEXTS.warVictory;
        if (Engine.rng.float(rng) < 0.5 && data.scene && data.scene.length > 0) {
          const line = this._pickRandom(rng, data.scene);
          return { text: this._expandTemplate(line, name, name2), source, fighterId, embedded: true };
        } else {
          const line = this._resolveVoice(rng, data.voice, fighter);
          return { text: `${name}\u3000${line}`, source, fighterId, embedded: true };
        }
      }
    }

    // ── 通常タイプ選択 ──
    const data = SNAPSHOT_TEXTS[source];
    if (!data) {
      return { text: '', source, fighterId, fighter2Id };
    }

    const selectedType = this._selectType(rng, source, data);

    if (selectedType === 'C') {
      const line = this._pickRandom(rng, data.staff);
      return { text: this._expandTemplate(line, name, name2), source, fighterId, fighter2Id };
    }

    if (selectedType === 'B') {
      const line = this._resolveVoice(rng, data.voice, fighter);
      const expanded = this._expandTemplate(line, name, name2);
      return { text: `${name}\u3000${expanded}`, source, fighterId, fighter2Id };
    }

    // タイプA（デフォルト）
    const line = this._pickRandom(rng, data.scene);
    return { text: this._expandTemplate(line, name, name2), source, fighterId, fighter2Id };
  },

  // ═══ タイプ選択 ═══
  _selectType(rng, source, data) {
    const hasVoice = data.voice && Object.keys(data.voice).length > 0;
    const hasStaff = data.staff && data.staff.length > 0;
    const roll = Engine.rng.float(rng);

    if (hasStaff) {
      if (roll < 0.60) return 'A';
      if (roll < 0.90) return 'C';
      return hasVoice ? 'B' : 'A';
    }

    if (hasVoice) {
      if (roll < 0.60) return 'A';
      return 'B';
    }

    return 'A';
  },

  // ═══ personality × archetype セリフ解決 ═══
  _resolveVoice(rng, voiceData, fighter) {
    if (!voiceData) return '…';

    const v = fighter?.voice;
    if (v && voiceData._voice?.[v]) {
      const vc = voiceData._voice[v];
      return vc[Engine.rng.int(rng, 0, vc.length - 1)];
    }

    const personality = (fighter && fighter.personality) || 'normal';
    const archetype = (fighter && fighter.archetype) || 'normal';

    const personalityBlock = voiceData[personality] || voiceData.normal;
    if (!personalityBlock) return '…';

    const candidates =
      personalityBlock[archetype] ||
      personalityBlock._default ||
      (voiceData.normal && voiceData.normal._default);

    if (!candidates || candidates.length === 0) return '…';

    return candidates[Engine.rng.int(rng, 0, candidates.length - 1)];
  },

  // ═══ ヘルパー ═══

  _expandTemplate(template, name, name2) {
    let s = template.replace(/\{name\}/g, name);
    if (name2) s = s.replace(/\{name2\}/g, name2);
    return s;
  },

  _pickRandom(rng, arr) {
    if (!arr || arr.length === 0) return '…';
    return arr[Engine.rng.int(rng, 0, arr.length - 1)];
  },

}; // Engine.snapshot 終わり

// ── 性格相性ヘルパー（Engine.snapshot._collectCandidates から使用）──
Engine.relationships.personalityCompatibility = function(a, b) {
  const pAdj = Engine.relationships._getPersonalityBondAdj(
    a.personality || 'normal', b.personality || 'normal'
  );
  const aAdj = Engine.relationships._getArchetypeBondAdj(
    a.archetype || 'normal', b.archetype || 'normal'
  );
  return pAdj + aAdj;
};

// ── Engine.h2h: ペア別対戦履歴 ──────────────────────────
Engine.h2h = {
  getKey(id1, id2) {
    const a = Math.min(id1, id2), b = Math.max(id1, id2);
    return `${a}>${b}`;
  },
  getRecord(state, id1, id2) {
    const key = this.getKey(id1, id2);
    return (state.h2h || {})[key] || null;
  },
  /** 特定のファイターから見た勝敗を返す */
  getRecordFor(state, selfId, opponentId) {
    const rec = this.getRecord(state, selfId, opponentId);
    if (!rec) return null;
    const isA = selfId < opponentId;
    return {
      matches: rec.matches,
      wins: isA ? rec.winsA : rec.winsB,
      losses: isA ? rec.winsB : rec.winsA,
      draws: rec.draws,
      bestMQ: rec.bestMQ,
      lastMatch: rec.lastMatch,
      hadTitleMatch: rec.hadTitleMatch,
      hadPPV: rec.hadPPV,
    };
  },
  /** 試合結果からh2hを更新し、新しいh2hオブジェクトを返す。
   * meta: { betrayal, factionWar, lockerStress, reclaim } を history entry にフラグとして残す。 */
  update(h2h, leftId, rightId, winner, mq, isTitleMatch, isPPV, season, week, stage = 'show', leftOrg, rightOrg, meta = null) {
    const a = Math.min(leftId, rightId), b = Math.max(leftId, rightId);
    const key = `${a}>${b}`;
    const newH2h = { ...(h2h || {}) };
    const entry = { ...(newH2h[key] || { matches: 0, winsA: 0, winsB: 0, draws: 0, bestMQ: 0, hadTitleMatch: false, hadPPV: false, history: [] }) };
    entry.matches += 1;
    let winSide = 'd';
    if (winner === 'draw') entry.draws += 1;
    else {
      const winnerId = winner === 'left' ? leftId : rightId;
      if (winnerId === a) { entry.winsA += 1; winSide = 'A'; }
      else { entry.winsB += 1; winSide = 'B'; }
    }
    entry.bestMQ = Math.max(entry.bestMQ, mq || 0);
    entry.lastMatch = { season, week };
    if (isTitleMatch) entry.hadTitleMatch = true;
    if (isPPV) entry.hadPPV = true;
    // history 追加 (最大50件)
    const histEntry = { s: season, w: week, st: stage, win: winSide, mq: mq || 0 };
    if (isTitleMatch) histEntry.t = 1;
    if (isPPV) histEntry.p = 1;
    // 試合当時の所属団体キー（leftId/rightId のうち小さい側を oA、大きい側を oB に対応付け）
    const orgForA = leftId === a ? leftOrg : rightOrg;
    const orgForB = leftId === a ? rightOrg : leftOrg;
    if (orgForA) histEntry.oA = orgForA;
    if (orgForB) histEntry.oB = orgForB;
    // ── Phase 2-A: イベント metadata フラグ ──
    if (meta) {
      if (meta.betrayal) histEntry.bt = 1;        // B-3 元同僚 離脱後初対面
      if (meta.factionWar) histEntry.fc = 1;      // 派閥抗争中
      if (meta.lockerStress) histEntry.lc = 1;    // ロッカー荒廃中
      if (meta.reclaim) histEntry.rc = 1;         // 奪還挑戦試合
    }
    const newHistory = [...(entry.history || []), histEntry];
    if (newHistory.length > 50) newHistory.shift();
    entry.history = newHistory;
    newH2h[key] = entry;
    return newH2h;
  },
};

// ── recentMatches ヘルパー: 直近5戦FIFO ──────────
/** rosterの対象2選手にrecentMatchesエントリを追加し、新rosterを返す */
Engine.pushRecentMatch = function(roster, leftId, rightId, winner, season, week) {
  const result = (side, id) => winner === 'draw' ? 'draw' : (winner === side ? 'win' : 'loss');
  return roster.map(c => {
    if (c.id !== leftId && c.id !== rightId) return c;
    const isLeft = c.id === leftId;
    const opponentId = isLeft ? rightId : leftId;
    const res = isLeft ? result('left', c.id) : result('right', c.id);
    const rm = [...(c.recentMatches || []), { opponentId, result: res, season, week }];
    if (rm.length > 5) rm.shift();
    return { ...c, recentMatches: rm };
  });
};

// ── Engine.orgTimeline: ファイター所属団体履歴 ──────────
Engine.orgTimeline = {
  absWeek(season, week) {
    return Math.max(1, Engine.util.absWeek(season, week));
  },
  /** 履歴の連続重複を圧縮し、開始時点を保持する */
  normalize(timeline = []) {
    const normalized = [];
    timeline.forEach(entry => {
      if (!entry || !entry.orgId) return;
      const clean = {
        ...entry,
        fromSeason: entry.fromSeason || 1,
        fromWeek: entry.fromWeek || 1,
      };
      const last = normalized[normalized.length - 1];
      if (last && last.orgId === clean.orgId) {
        if (clean.toSeason != null) {
          last.toSeason = clean.toSeason;
          last.toWeek = clean.toWeek || 1;
        } else {
          delete last.toSeason;
          delete last.toWeek;
        }
        return;
      }
      normalized.push(clean);
    });
    return normalized;
  },
  getCurrentEntry(fighter, orgId) {
    const timeline = this.normalize(fighter?.orgTimeline || []);
    return [...timeline].reverse().find(e => e.orgId === orgId && !e.toSeason)
      || [...timeline].reverse().find(e => e.orgId === orgId)
      || null;
  },
  getJoinAbsWeek(fighter, orgId, currentSeason, currentWeek) {
    const currentAbsWeek = this.absWeek(currentSeason, currentWeek);
    if ((fighter?.orgId || fighter?._orgId) === orgId && typeof fighter?.orgJoinWeek === 'number' && fighter.orgJoinWeek > 0) {
      return Math.min(fighter.orgJoinWeek, currentAbsWeek);
    }
    const entry = this.getCurrentEntry(fighter, orgId);
    if (entry) return this.absWeek(entry.fromSeason, entry.fromWeek);
    return currentAbsWeek;
  },
  getTenureYears(fighter, currentSeason, currentWeek, orgId = 'player') {
    const currentAbsWeek = this.absWeek(currentSeason, currentWeek);
    const joinAbsWeek = this.getJoinAbsWeek(fighter, orgId, currentSeason, currentWeek);
    return Math.max(1, Math.floor(Math.max(0, currentAbsWeek - joinAbsWeek) / 48) + 1);
  },
  syncCurrentEntry(fighter, orgId, currentSeason, currentWeek) {
    if (!fighter || !orgId) return fighter;
    const timeline = this.normalize(fighter.orgTimeline || []);
    const joinAbsWeek = this.getJoinAbsWeek(fighter, orgId, currentSeason, currentWeek);
    const joinSeason = Math.max(1, Math.floor((joinAbsWeek - 1) / 48) + 1);
    const joinWeek = ((joinAbsWeek - 1) % 48) + 1;
    const currentIdx = timeline.findIndex(e => e.orgId === orgId && !e.toSeason);

    if (currentIdx >= 0) {
      timeline[currentIdx] = { ...timeline[currentIdx], fromSeason: joinSeason, fromWeek: joinWeek };
      return { ...fighter, orgTimeline: this.normalize(timeline) };
    }

    if (timeline.length > 0) {
      const lastIdx = timeline.length - 1;
      const last = timeline[lastIdx];
      if (!last.toSeason && last.orgId !== orgId) {
        timeline[lastIdx] = { ...last, toSeason: joinSeason, toWeek: joinWeek };
      }
    }
    timeline.push({ orgId, fromSeason: joinSeason, fromWeek: joinWeek });
    return { ...fighter, orgTimeline: this.normalize(timeline) };
  },
  /** 所属変更を記録（ファイターの新コピーを返す） */
  transfer(fighter, newOrgId, season, week) {
    const timeline = this.normalize(fighter.orgTimeline || []);
    const last = timeline[timeline.length - 1];
    if (last && last.orgId === newOrgId && !last.toSeason) {
      return { ...fighter, orgTimeline: timeline };
    }
    if (last && !last.toSeason) {
      timeline[timeline.length - 1] = { ...last, toSeason: season, toWeek: week };
    }
    timeline.push({ orgId: newOrgId, fromSeason: season, fromWeek: week });
    return { ...fighter, orgTimeline: this.normalize(timeline) };
  },
  /** state からID指定で fighter オブジェクトを引く（roster/aiOrgs/freeAgents/retiredFighters 横断） */
  _findFighter(state, id) {
    if (!state) return null;
    const found = (state.roster || []).find(c => c.id === id);
    if (found) return found;
    if (state.aiOrgs) {
      for (const org of Object.values(state.aiOrgs)) {
        const f = (org.roster || []).find(c => c.id === id);
        if (f) return f;
      }
    }
    const fa = (state.freeAgents || []).find(c => c.id === id);
    if (fa) return fa;
    const ret = (state.retiredFighters || []).find(c => c.id === id);
    return ret || null;
  },

  /**
   * B-3: 2人が「離脱以降の初対戦」かを判定
   *   1) wereColleagues == true（過去同団体だった）
   *   2) h2h.history を見て、最も新しい「同団体離脱週」より後の対戦が存在しない（=本試合が初）
   *   現在同団体ペアは false（離脱が起きていない）
   */
  checkFirstMeetSinceDeparture(state, idA, idB) {
    const fA = this._findFighter(state, idA);
    const fB = this._findFighter(state, idB);
    if (!fA || !fB) return false;
    if (!this.wereColleagues(fA, fB)) return false;

    const tlA = fA.orgTimeline || [];
    const tlB = fB.orgTimeline || [];
    let lastSharedEnd = 0;
    for (const a of tlA) {
      if (!a || !a.orgId || a.orgId === 'fa') continue;
      for (const b of tlB) {
        if (!b || b.orgId !== a.orgId) continue;
        const aStart = this.absWeek(a.fromSeason, a.fromWeek || 1);
        const aEnd = a.toSeason ? this.absWeek(a.toSeason, a.toWeek || 1) : 999999;
        const bStart = this.absWeek(b.fromSeason, b.fromWeek || 1);
        const bEnd = b.toSeason ? this.absWeek(b.toSeason, b.toWeek || 1) : 999999;
        if (aStart < bEnd && bStart < aEnd) {
          const overlapEnd = Math.min(aEnd, bEnd);
          if (overlapEnd < 999999 && overlapEnd > lastSharedEnd) lastSharedEnd = overlapEnd;
        }
      }
    }
    if (lastSharedEnd === 0) return false; // 離脱イベントなし

    const h2h = state.h2h || {};
    const lo = Math.min(idA, idB), hi = Math.max(idA, idB);
    const entry = h2h[`${lo}>${hi}`];
    if (!entry || !entry.history || entry.history.length === 0) return true;
    for (const m of entry.history) {
      const mAbs = this.absWeek(m.s, m.w);
      if (mAbs > lastSharedEnd) return false; // 離脱以降にすでに対戦あり
    }
    return true;
  },

  /** 2人が同時期に同じ団体にいたかを判定（現在同団体は除外） */
  wereColleagues(fighterA, fighterB) {
    const tlA = fighterA?.orgTimeline || [];
    const tlB = fighterB?.orgTimeline || [];
    if (tlA.length === 0 || tlB.length === 0) return false;
    const currentOrgA = !tlA[tlA.length - 1].toSeason ? tlA[tlA.length - 1].orgId : null;
    const currentOrgB = !tlB[tlB.length - 1].toSeason ? tlB[tlB.length - 1].orgId : null;
    for (const a of tlA) {
      for (const b of tlB) {
        if (a.orgId !== b.orgId) continue;
        if (a.orgId === 'fa') continue;
        // 現在同じ団体の組み合わせはスキップ
        if (a.orgId === currentOrgA && a.orgId === currentOrgB && !a.toSeason && !b.toSeason) continue;
        const aStart = a.fromSeason * 100 + (a.fromWeek || 1);
        const aEnd = a.toSeason ? a.toSeason * 100 + (a.toWeek || 1) : 99999;
        const bStart = b.fromSeason * 100 + (b.fromWeek || 1);
        const bEnd = b.toSeason ? b.toSeason * 100 + (b.toWeek || 1) : 99999;
        if (aStart < bEnd && bStart < aEnd) return true;
      }
    }
    return false;
  },
};

// ══════════════════════════════════════════════════════════
//  Engine.glimpse — P4/P5/P6 Glimpse（心の垣間見え）システム
// ══════════════════════════════════════════════════════════
Engine.glimpse = {
  // ── ヘルパー: AI団体全選手をフラット配列で返す ──
  _getAllAIChars(state) {
    const chars = [];
    if (state.aiOrgs) {
      Object.values(state.aiOrgs).forEach(org => {
        (org.roster || []).forEach(f => chars.push(f));
      });
    }
    return chars;
  },

  // ── ヘルパー: 最もaxis値が高いペアを探す ──
  _findBestRelPair(fighterId, state, axis, threshold) {
    const rels = state.relationships || {};
    let best = null;
    Object.keys(rels).forEach(key => {
      if (!key.startsWith(`${fighterId}>`)) return;
      const val = rels[key][axis] || 0;
      if (val >= threshold) {
        if (!best || val > best.value) {
          best = { targetId: parseInt(key.split('>')[1]), value: val };
        }
      }
    });
    return best;
  },

  // ── ヘルパー: 重み付きサンプリング ──
  _weightedSample(rng, pool, max, usedFighters) {
    const result = [];
    const remaining = [...pool];
    for (let i = 0; i < max && remaining.length > 0; i++) {
      const totalWeight = remaining.reduce((sum, c) => sum + c.weight, 0);
      if (totalWeight <= 0) break;
      let roll = Engine.rng.float(rng) * totalWeight;
      let picked = null;
      for (let j = 0; j < remaining.length; j++) {
        roll -= remaining[j].weight;
        if (roll <= 0) { picked = j; break; }
      }
      if (picked === null) picked = remaining.length - 1;
      const item = remaining.splice(picked, 1)[0];
      result.push(item);
      usedFighters.add(item.fighterId);
      // 同一選手の残り候補を除去
      for (let j = remaining.length - 1; j >= 0; j--) {
        if (remaining[j].fighterId === item.fighterId) remaining.splice(j, 1);
      }
    }
    return result;
  },

  // ══════════════════════════════════════════════════════════
  //  P4: A層 Glimpse — 重要イベント（bond/rivalry/trust閾値跨ぎ）
  // ══════════════════════════════════════════════════════════
  checkALayer(state, rng) {
    const glimpses = [];
    const roster = state.roster || [];
    const relationships = state.relationships || {};
    const cooldowns = { ...(state._glimpseACooldowns || {}) };
    const absWeek = Engine.util.absWeek(state.season, state.week);

    // 初週初期化: prevスナップショットが無ければ現在値で作成（初回は何も発火しない）
    let prevSnap = state._glimpseAPrevValues;
    if (!prevSnap) {
      prevSnap = {};
      Object.entries(relationships).forEach(([key, rel]) => {
        prevSnap[key] = { bond: rel.bond, rivalry: rel.rivalry };
      });
    }
    let prevTrustSnap = state._glimpseAPrevTrust;
    if (!prevTrustSnap) {
      prevTrustSnap = {};
      roster.forEach(f => { prevTrustSnap[f.id] = f.trust || 50; });
    }

    const newSnap = {};
    const allAIChars = this._getAllAIChars(state);

    // ── bond / rivalry 閾値チェック ──
    // プレイヤーロスター選手(speaker)から全キャラ(target)への関係を調べる
    for (let i = 0; i < roster.length; i++) {
      const speaker = roster[i];
      if (speaker.injury) continue;
      const speakerId = speaker.id;

      // 全キャラIDを集める（ロスター＋AI）
      const allTargetIds = [];
      roster.forEach(f => { if (f.id !== speakerId) allTargetIds.push(f.id); });
      allAIChars.forEach(f => allTargetIds.push(f.id));

      for (let j = 0; j < allTargetIds.length; j++) {
        const targetId = allTargetIds[j];
        const key = Engine.relationships._key(speakerId, targetId);
        const rel = relationships[key];
        if (!rel) continue;

        const prev = prevSnap[key] || {};
        const prevBond = prev.bond;
        const prevRivalry = prev.rivalry;
        const curBond = rel.bond;
        const curRivalry = rel.rivalry;

        GLIMPSE_A_THRESHOLDS.forEach(th => {
          if (th.axis === 'trust') return;
          const prevVal = th.axis === 'bond' ? prevBond : prevRivalry;
          const curVal = th.axis === 'bond' ? curBond : curRivalry;
          if (prevVal === undefined) return;

          let crossed = false;
          if (th.dir === 'up' && prevVal < th.value && curVal >= th.value) crossed = true;
          if (th.dir === 'down' && prevVal >= th.value + 1 && curVal <= th.value) crossed = true;
          if (!crossed) return;

          const cdKey = `${th.id}_${speakerId}_${targetId}`;
          if (cooldowns[cdKey] && absWeek - cooldowns[cdKey] < th.cooldown) return;
          if (Engine.rng.float(rng) >= th.rate) return;

          cooldowns[cdKey] = absWeek;
          const target = roster.find(f => f.id === targetId) || allAIChars.find(f => f.id === targetId);
          if (!target) return;

          const line = pickDialogueLine(GLIMPSE_A_LINES[th.id], speaker);
          glimpses.push({
            layer: 'A', type: th.id, tone: th.tone, label: th.label,
            speakerId, speakerName: speaker.name,
            targetId, targetName: target.name,
            dialogue: line, axis: th.axis, value: curVal,
          });
        });

        newSnap[key] = { bond: curBond, rivalry: curRivalry };
      }
    }

    // ── trust 閾値チェック ──
    roster.forEach(f => {
      if (f.injury || f.isRental) return;
      const prevTrust = prevTrustSnap[f.id];
      const curTrust = f.trust || 50;
      if (prevTrust === undefined) return;

      GLIMPSE_A_THRESHOLDS.forEach(th => {
        if (th.axis !== 'trust') return;
        let crossed = false;
        if (th.dir === 'down' && prevTrust >= th.value && curTrust < th.value) crossed = true;
        if (th.dir === 'up' && prevTrust < th.value && curTrust >= th.value) crossed = true;
        if (!crossed) return;

        const cdKey = `trust_${th.id}_${f.id}`;
        if (cooldowns[cdKey] && absWeek - cooldowns[cdKey] < th.cooldown) return;
        if (Engine.rng.float(rng) >= th.rate) return;

        cooldowns[cdKey] = absWeek;
        const line = pickDialogueLine(GLIMPSE_A_LINES[th.id], f);
        glimpses.push({
          layer: 'A', type: th.id, tone: th.tone, label: th.label,
          speakerId: f.id, speakerName: f.name,
          targetId: null, targetName: null,
          dialogue: line, axis: 'trust', value: curTrust,
        });
      });
    });

    // 新しいスナップショットを記録
    const newPrevTrust = {};
    roster.forEach(f => { newPrevTrust[f.id] = f.trust || 50; });

    const newState = {
      ...state,
      _glimpseACooldowns: cooldowns,
      _glimpseAPrevValues: newSnap,
      _glimpseAPrevTrust: newPrevTrust,
    };

    return { glimpses, state: newState };
  },

  // ══════════════════════════════════════════════════════════
  //  P5+P6: B層 Glimpse — 日常の垣間見え
  // ══════════════════════════════════════════════════════════
  checkBLayer(state, rng) {
    const glimpses = [];
    const roster = (state.roster || []).filter(f => !f.isRental);
    const cooldowns = { ...(state._glimpseBCooldowns || {}) };
    const absWeek = Engine.util.absWeek(state.season, state.week);
    const candidates = [];
    const allAIChars = this._getAllAIChars(state);

    // ── P5: 絶好調終了（guaranteed） ──
    (state._pendingHotStreakEnds || []).forEach(fighterId => {
      const f = roster.find(c => c.id === fighterId);
      if (!f) return;
      const line = pickDialogueLine(GLIMPSE_HOTSTREAK_END_LINES, f);
      candidates.push({ type: 'hotstreak_end', weight: 10, fighterId: f.id,
        fighterName: f.name, dialogue: line, tone: 'calm', label: '絶好調の終わり', guaranteed: true });
    });

    // ── GL-01〜GL-10 ──
    roster.forEach(f => {
      const cdKey = `B_${f.id}`;
      if (cooldowns[cdKey] && absWeek - cooldowns[cdKey] < 4) return; // 4週クールダウン

      // GL-01: 試合後の感情（今週試合に出場）
      if (f._weekAction === 'match' || f._weekAction === 'show') {
        if (Engine.rng.float(rng) < 0.15) {
          const matchResult = f._lastMatchResult || {};
          let subType = 'win';
          if (matchResult.won === false) subType = (matchResult.mq || 0) >= 70 ? 'goodLoss' : 'loss';
          else if (matchResult.won === true && (matchResult.mq || 0) >= 70) subType = 'greatWin';
          const lineObj = GLIMPSE_B_LINES['GL-01'][subType];
          if (lineObj) {
            candidates.push({ type: 'GL-01', subType, weight: 3, fighterId: f.id,
              fighterName: f.name, dialogue: pickDialogueLine(lineObj, f),
              tone: subType === 'loss' ? 'negative' : 'positive', label: '試合後の感情' });
          }
        }
      }

      // GL-02: 練習中のひとこと（練習中の非負傷選手）
      // bond-rivalry plan P-7: rivalry≥50 ∧ bond≤30 の相手がいれば hostile フレーズ優先
      if (!f.injury && (f._weekAction === 'practice' || f._weekAction === 'intensive')) {
        if (Engine.rng.float(rng) < 0.08) {
          const hostileRel = this._findBestRelPair(f.id, state, 'rivalry', 50);
          const hostileBondVal = hostileRel
            ? ((state.relationships[`${f.id}>${hostileRel.targetId}`] || {}).bond != null
                ? state.relationships[`${f.id}>${hostileRel.targetId}`].bond : 50)
            : 100;
          const isHostile = !!hostileRel && hostileBondVal <= 30;
          const gl02Pool = isHostile && GLIMPSE_B_LINES['GL-02-hostile']
            ? GLIMPSE_B_LINES['GL-02-hostile'] : GLIMPSE_B_LINES['GL-02'];
          candidates.push({ type: 'GL-02', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(gl02Pool, f),
            tone: isHostile ? 'negative' : 'calm',
            label: isHostile ? '練習中の敵意' : '練習中のひとこと' });
        }
      }

      // GL-03: 信頼度の揺れ（trust変動±3以上）
      const prevTrust = (state._glimpseAPrevTrust || {})[f.id] || 50;
      const trustDelta = (f.trust || 50) - prevTrust;
      if (Math.abs(trustDelta) >= 3) {
        if (Engine.rng.float(rng) < 0.10) {
          const sub = trustDelta > 0 ? 'up' : 'down';
          candidates.push({ type: 'GL-03', subType: sub, weight: 3, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-03'][sub], f),
            tone: sub === 'up' ? 'positive' : 'negative', label: '信頼の揺れ' });
        }
      }

      // GL-04: 仲間への想い（bond 50+のペアが存在）
      if (state.relationships) {
        const bestBondPair = this._findBestRelPair(f.id, state, 'bond', 50);
        if (bestBondPair) {
          if (Engine.rng.float(rng) < 0.08) {
            const target = roster.find(c => c.id === bestBondPair.targetId) || allAIChars.find(c => c.id === bestBondPair.targetId);
            candidates.push({ type: 'GL-04', weight: 2, fighterId: f.id,
              fighterName: f.name, fighter2Id: bestBondPair.targetId,
              fighter2Name: target ? target.name : '???',
              dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-04'], f),
              tone: 'positive', label: '仲間への想い' });
          }
        }
      }

      // GL-05: ライバルへの意識（rivalry 30+のペアが存在）
      if (state.relationships) {
        const bestRivalPair = this._findBestRelPair(f.id, state, 'rivalry', 30);
        if (bestRivalPair) {
          if (Engine.rng.float(rng) < 0.10) {
            const target = roster.find(c => c.id === bestRivalPair.targetId) || allAIChars.find(c => c.id === bestRivalPair.targetId);
            candidates.push({ type: 'GL-05', weight: 3, fighterId: f.id,
              fighterName: f.name, fighter2Id: bestRivalPair.targetId,
              fighter2Name: target ? target.name : '???',
              dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-05'], f),
              tone: 'dramatic', label: 'ライバルへの意識' });
          }
        }
      }

      // GL-06: 不出場の鬱憤（興行に出場できなかった選手）
      if (!f.injury && f._weekAction !== 'match' && f._weekAction !== 'show'
          && Engine.util.isShowWeek(state.week)) {
        if (Engine.rng.float(rng) < 0.12) {
          candidates.push({ type: 'GL-06', weight: 3, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-06'], f),
            tone: 'negative', label: '不出場の鬱憤' });
        }
      }

      // GL-07: コンディション不良（condition < 40）
      if ((f.condition || 100) < 40 && !f.injury) {
        if (Engine.rng.float(rng) < 0.10) {
          candidates.push({ type: 'GL-07', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-07'], f),
            tone: 'negative', label: 'コンディション不良' });
        }
      }

      // GL-08: 連敗のストレス（losingStreak >= 2）
      if ((f.losingStreak || 0) >= 2) {
        if (Engine.rng.float(rng) < 0.15) {
          candidates.push({ type: 'GL-08', weight: 4, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-08'], f),
            tone: 'negative', label: '連敗のストレス' });
        }
      }

      // GL-09: 連勝の自信（winStreak >= 3）
      if ((f.winStreak || 0) >= 3) {
        if (Engine.rng.float(rng) < 0.12) {
          candidates.push({ type: 'GL-09', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-09'], f),
            tone: 'positive', label: '連勝の自信' });
        }
      }

      // GL-10: 怪我中の焦り（負傷中）
      if (f.injury) {
        if (Engine.rng.float(rng) < 0.08) {
          candidates.push({ type: 'GL-10', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-10'], f),
            tone: 'negative', label: '怪我中の焦り' });
        }
      }

      // bond-rivalry plan 2026-04-29 P-2: 中間嫌悪帯（coldness）
      // bond ≤ 25 ∧ rivalry < 30 のペアに対して「冷淡」スナップショット
      // 月1回上限（4週クールダウン kept by 既存 cdKey "B_${f.id}"）
      if (state.relationships) {
        const rels = state.relationships;
        const coldCandidates = [];
        Object.keys(rels).forEach(key => {
          if (!key.startsWith(`${f.id}>`)) return;
          const rel = rels[key];
          const bond = rel.bond != null ? rel.bond : 50;
          const rivalry = rel.rivalry || 0;
          if (bond <= 25 && rivalry < 30) {
            const targetId = parseInt(key.split('>')[1]);
            coldCandidates.push({ targetId, bond });
          }
        });
        if (coldCandidates.length > 0 && Engine.rng.float(rng) < 0.06) {
          coldCandidates.sort((a, b) => a.bond - b.bond);
          const pick = coldCandidates[0];
          const target = roster.find(c => c.id === pick.targetId) || allAIChars.find(c => c.id === pick.targetId);
          if (target) {
            candidates.push({ type: 'GL-11', weight: 2, fighterId: f.id,
              fighterName: f.name, fighter2Id: pick.targetId, fighter2Name: target.name,
              dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-11'], f),
              tone: 'negative', label: '冷たい距離' });
          }
        }
      }
    });

    // bond-rivalry plan 2026-04-29 P-9: ナレーション型グリンプス
    // bond ≤ 15 ペアが同興行に出場した週、月1回程度発火
    // 第三者視点ナレーション（{nameA}/{nameB} 置換）
    const narrationParticipated = new Set();
    (state.lastShowResults || []).forEach(r => {
      if (r.matchType === 'tag') { Object.keys(r.perFighter || {}).forEach(id => narrationParticipated.add(Number(id))); }
      else if (r.left && r.right) { narrationParticipated.add(r.left.id); narrationParticipated.add(r.right.id); }
    });
    if (state.relationships && narrationParticipated.size >= 2) {
      const narrationPairs = [];
      const seen = new Set();
      const participatedIds = Array.from(narrationParticipated);
      for (let i = 0; i < participatedIds.length; i++) {
        for (let j = i + 1; j < participatedIds.length; j++) {
          const idA = participatedIds[i];
          const idB = participatedIds[j];
          const pairKey = idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
          if (seen.has(pairKey)) continue;
          seen.add(pairKey);
          const relAB = state.relationships[`${idA}>${idB}`];
          const relBA = state.relationships[`${idB}>${idA}`];
          if (!relAB || !relBA) continue;
          const minBond = Math.min(relAB.bond != null ? relAB.bond : 50, relBA.bond != null ? relBA.bond : 50);
          if (minBond <= 15) {
            narrationPairs.push({ idA, idB, minBond });
          }
        }
      }
      if (narrationPairs.length > 0 && Engine.rng.float(rng) < 0.25) {
        narrationPairs.sort((a, b) => a.minBond - b.minBond);
        const pick = narrationPairs[0];
        const fA = roster.find(c => c.id === pick.idA) || allAIChars.find(c => c.id === pick.idA);
        const fB = roster.find(c => c.id === pick.idB) || allAIChars.find(c => c.id === pick.idB);
        if (fA && fB) {
          const pool = (GLIMPSE_B_LINES['GL-12'] && GLIMPSE_B_LINES['GL-12']._narration) || [];
          if (pool.length > 0) {
            const tpl = pool[Engine.rng.int(rng, 0, pool.length - 1)];
            const text = tpl.replace(/\{nameA\}/g, fA.name).replace(/\{nameB\}/g, fB.name);
            candidates.push({ type: 'GL-12', weight: 1, fighterId: fA.id,
              fighterName: fA.name, fighter2Id: fB.id, fighter2Name: fB.name,
              dialogue: text, tone: 'narration', label: '第三者の証言' });
          }
        }
      }
    }

    // ── 抽選: guaranteed は確定、残りから重み付き最大2件 ──
    const guaranteed = candidates.filter(c => c.guaranteed);
    const pool = candidates.filter(c => !c.guaranteed);

    // 同一選手は1週1件まで（guaranteedを除く）
    const usedFighters = new Set(guaranteed.map(g => g.fighterId));
    const filteredPool = pool.filter(c => !usedFighters.has(c.fighterId));

    const maxSlots = 2;
    const selected = this._weightedSample(rng, filteredPool, maxSlots, usedFighters);

    const allSelected = [...guaranteed, ...selected];

    // クールダウン更新（guaranteed含む）
    allSelected.forEach(g => {
      if (!g.guaranteed) cooldowns[`B_${g.fighterId}`] = absWeek;
    });

    // glimpse オブジェクト構築
    allSelected.forEach(g => {
      glimpses.push({
        layer: 'B', type: g.type, subType: g.subType || null,
        tone: g.tone, label: g.label,
        speakerId: g.fighterId, speakerName: g.fighterName,
        targetId: g.fighter2Id || null, targetName: g.fighter2Name || null,
        dialogue: g.dialogue,
      });
    });

    // state更新
    const newState = {
      ...state,
      _glimpseBCooldowns: cooldowns,
    };
    // transient フラグクリア
    delete newState._pendingHotStreakEnds;

    return { glimpses, state: newState };
  },
};


