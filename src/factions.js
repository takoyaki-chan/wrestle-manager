// ╔══════════════════════════════════════════════════════════╗
// ║  FACTIONS — 派閥システム (spec: faction-system-spec-v0.1) ║
// ║  Pure logic layer — no DOM references                     ║
// ╚══════════════════════════════════════════════════════════╝

Engine.factions = {
  // ── ヘルパー ────────────────────────────────────────────────
  _hostKey(fromId, toId) { return `${fromId}>${toId}`; },

  _getBond(state, fromId, toId) {
    if (!state.relationships) return 50;
    const rec = state.relationships[`${fromId}>${toId}`];
    return rec ? rec.bond : 50;
  },

  _getRivalry(state, fromId, toId) {
    if (!state.relationships) return 0;
    const rec = state.relationships[`${fromId}>${toId}`];
    return rec ? rec.rivalry : 0;
  },

  _avgBond(state, fromId, toIds) {
    if (!toIds.length) return 0;
    let sum = 0;
    for (const toId of toIds) sum += this._getBond(state, fromId, toId);
    return sum / toIds.length;
  },

  getFactionByFighterId(state, fighterId) {
    if (!state.factions) return null;
    for (const f of state.factions) {
      if (f.memberIds.includes(fighterId)) return f;
    }
    return null;
  },

  isLeader(state, fighterId) {
    const f = this.getFactionByFighterId(state, fighterId);
    return !!(f && f.leaderId === fighterId);
  },

  isExecutive(state, fighterId) {
    const f = this.getFactionByFighterId(state, fighterId);
    if (!f) return false;
    if (f.leaderId === fighterId) return false;
    // 幹部 = リーダー除く OVR 上位2名
    const ovrMap = new Map();
    (state.roster || []).forEach(c => ovrMap.set(c.id, Engine.util.ov(c)));
    const members = f.memberIds
      .filter(id => id !== f.leaderId)
      .sort((a, b) => (ovrMap.get(b) || 0) - (ovrMap.get(a) || 0));
    return members.slice(0, 2).includes(fighterId);
  },

  isLeaderOrExecutive(state, fighterId) {
    return this.isLeader(state, fighterId) || this.isExecutive(state, fighterId);
  },

  // ── §1.3 フレーバー変換 ─────────────────────────────────────
  getMomentumLabel(momentum) {
    if (momentum >= 60) return '隆盛';
    if (momentum >= 30) return '上昇';
    if (momentum >= -29) return '平常';
    if (momentum >= -59) return '陰り';
    return '衰退';
  },

  getHostilityLabel(hostility) {
    if (hostility >= 80) return '血みどろ';
    if (hostility >= 60) return '泥沼';
    if (hostility >= 40) return '抗争';
    if (hostility >= 20) return '小競り合い';
    return '冷え込み';
  },

  getSolidarityLabel(faction, state) {
    if (!faction || !state) return '平穏';
    const leaderId = faction.leaderId;
    const others = faction.memberIds.filter(id => id !== leaderId);
    if (!others.length) return '平穏';
    const avg = this._avgBond(state, leaderId, others);
    if (avg >= 70) return '強固';
    if (avg >= 50) return '安定';
    if (avg >= 40) return '揺らぎ';
    return '崩壊寸前';
  },

  // ── §2.1 忠誠型発生条件 ─────────────────────────────────────
  checkLoyalFormationConditions(state, options = {}) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const roster = (state.roster || []).filter(c => !c.isRental);
    if (roster.length <= cfg.minRosterSize) return { eligible: false };
    const maxExistingFactions = options.maxExistingFactions != null ? options.maxExistingFactions : 0;
    if (factions.length > maxExistingFactions) return { eligible: false };

    const requireUnassigned = !!options.requireUnassigned;
    const assigned = new Set();
    if (requireUnassigned) factions.forEach(f => f.memberIds.forEach(id => assigned.add(id)));
    const candidatePool = requireUnassigned ? roster.filter(c => !assigned.has(c.id)) : roster;
    if (candidatePool.length < cfg.loyalMinFollowers + 1) return { eligible: false };

    const sorted = [...candidatePool].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const top3 = sorted.slice(0, 3);

    for (const cand of top3) {
      const followers = candidatePool
        .filter(c => c.id !== cand.id)
        .filter(c => this._getBond(state, c.id, cand.id) >= cfg.loyalBondThreshold);
      if (followers.length >= cfg.loyalMinFollowers) {
        const pickedFollowers = followers
          .sort((a, b) => {
            const bondDiff = this._getBond(state, b.id, cand.id) - this._getBond(state, a.id, cand.id);
            if (bondDiff !== 0) return bondDiff;
            return Engine.util.ov(b) - Engine.util.ov(a);
          })
          .slice(0, cfg.loyalMaxFollowers);
        return {
          eligible: true,
          leaderId: cand.id,
          leaderName: cand.name,
          followerIds: pickedFollowers.map(c => c.id),
          existingFactionCount: factions.length,
        };
      }
    }
    return { eligible: false };
  },

  // ── §2.1 F02 派閥抗争勃発条件（既存派閥2つの間での対立宣言）──
  // 旧: 無派閥ロスターから2クラスタを同時発生させる「対立型結成」
  // 新: 既存の2派閥間で平均 rivalry が閾値超、かつどちらも未抗争
  checkRivalrousFormationConditions(state) {
    const cfg = FACTION_CONFIG;
    const factions = (state.factions || []);
    if (factions.length < 2) return { eligible: false };

    // 未抗争ペアのみ対象（活動休止中の派閥は除外）
    const pool = factions.filter(f => !f.inHostility && f.status !== 'hiatus');
    if (pool.length < 2) return { eligible: false };

    let bestPair = null, bestAvg = -1;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const A = pool[i], B = pool[j];
        let sum = 0, count = 0;
        for (const a of A.memberIds) for (const b of B.memberIds) {
          sum += this._getRivalry(state, a, b);
          sum += this._getRivalry(state, b, a);
          count += 2;
        }
        const avg = count ? sum / count : 0;
        if (avg >= cfg.rivalrousRivalryThreshold && avg > bestAvg) {
          bestAvg = avg;
          bestPair = { A, B };
        }
      }
    }
    if (!bestPair) return { eligible: false };

    return {
      eligible: true,
      factionAId: bestPair.A.id,
      factionBId: bestPair.B.id,
      leaderAId: bestPair.A.leaderId,
      leaderBId: bestPair.B.leaderId,
      avgRivalry: bestAvg,
    };
  },

  // 派閥が抗争中か判定（type==='rivalrous' は legacy、新規は inHostility フラグ）
  _isHostile(f) {
    return !!(f && (f.type === 'rivalrous' || f.inHostility === true));
  },
  _getFactionFlavor(faction) {
    return faction?.flavor || 'bond_first';
  },
  _getFlavorJoinMult(faction) {
    const flavor = this._getFactionFlavor(faction);
    // v0.2 アーキタイプ拡張: 6 種それぞれに加入率係数を設定
    // meritocratic は希少さを保ち、heel/face/combat は属性適合度の影響を別途加算する想定（Phase B）
    const joinMult = {
      bond_first: 1.15,    // BOND: 横の絆で受け入れやすい
      meritocratic: 0.85,  // MERIT: 選別主義で加入しにくい
      authoritarian: 0.95, // AUTHORITY: リーダー認知が必要、やや厳しめ
      heel: 1.00,          // HEEL: 属性で別途バイアス
      face: 1.05,          // FACE: 看板派閥として歓迎ムード
      combat: 1.00,        // COMBAT: 強さテストで別途バイアス
      neutral: 1.0,        // legacy
    };
    return joinMult[flavor] !== undefined ? joinMult[flavor] : 1.0;
  },
  _scoreFactionFlavor(state, leader, members, rng) {
    const sample = members.length > 0 ? members : [leader];
    const cfg = FACTION_CONFIG;
    const leaderWeight = 0.65;
    const memberWeight = 0.25;
    const noiseWeight = 0.10;
    const noise = () => Engine.rng.float(rng) * noiseWeight;

    // 共通指標: OVR
    const leaderOvr = Engine.util.ov(leader);
    const ovrs = sample.map(f => Engine.util.ov(f));
    const avgOvr = ovrs.reduce((s, v) => s + v, 0) / ovrs.length;
    const leaderOvrScore = Math.max(0, Math.min(1, (leaderOvr - 68) / 18));
    const groupOvrScore = Math.max(0, Math.min(1, (avgOvr - 68) / 18));

    // OVR 分散（MERIT 判定用: 分散が小さい = 似た強さの集団）
    const ovrVariance = ovrs.reduce((s, v) => s + (v - avgOvr) ** 2, 0) / ovrs.length;
    const ovrStdDev = Math.sqrt(ovrVariance);
    // stddev <= 4 で高スコア、>= 12 でゼロ
    const ovrTightnessScore = Math.max(0, Math.min(1, (12 - ovrStdDev) / 8));

    // 共通指標: bond
    let bondPairCount = 0;
    let bondPairSum = 0;
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const a = sample[i].id;
        const b = sample[j].id;
        bondPairSum += this._getBond(state, a, b);
        bondPairSum += this._getBond(state, b, a);
        bondPairCount += 2;
      }
    }
    const avgBond = bondPairCount > 0 ? (bondPairSum / bondPairCount) : 60;
    const followerIds = members.filter(f => f.id !== leader.id).map(f => f.id);
    const leaderBondScore = followerIds.length > 0 ? Math.max(0, Math.min(1, (this._avgBond(state, leader.id, followerIds) - 60) / 25)) : 0;
    const groupBondScore = Math.max(0, Math.min(1, (avgBond - 60) / 25));

    // role 集計（HEEL / FACE バイアス）
    let heelCount = 0, faceCount = 0;
    for (const f of sample) {
      if (f.role === 'Heel') heelCount++;
      else if (f.role === 'Babyface') faceCount++;
    }
    const heelRatio = heelCount / sample.length;
    const faceRatio = faceCount / sample.length;

    // 性格 archetype 集計（COMBAT バイアス: fiery/flippant/bold が多いと闘争志向）
    let combatPersonalityCount = 0;
    for (const f of sample) {
      const a = f.archetype || '';
      const p = f.personality || '';
      if (a === 'fiery' || a === 'flippant' || p === 'bold') combatPersonalityCount++;
    }
    const combatPersonalityRatio = combatPersonalityCount / sample.length;

    // AUTHORITY バイアス: リーダー方向 bond が突出 + リーダー OVR が高い（非対称な集中）
    const bondAsymmetry = Math.max(0, leaderBondScore - groupBondScore * 0.5);

    return {
      // 既存系統（互換維持）
      bond_first: leaderBondScore * leaderWeight + groupBondScore * memberWeight + noise(),
      meritocratic: (ovrTightnessScore * 0.50 + leaderOvrScore * 0.35 + groupOvrScore * 0.15 + noise()) * (cfg.meritocraticFlavorScoreMult || 1),
      // 新規 4 アーキタイプ（v0.2）
      authoritarian: bondAsymmetry * leaderWeight + leaderOvrScore * memberWeight + noise(),
      // HEEL/FACE は対象 role が 1 名以上いないと意味がないので、ratio==0 のときは強く減点
      heel: heelRatio * 0.85 + (heelRatio > 0 ? 0.05 : -0.6) + noise(),
      face: faceRatio * 0.85 + (faceRatio > 0 ? 0.05 : -0.6) + noise(),
      combat: combatPersonalityRatio * 0.70 + leaderOvrScore * 0.20 + noise(),
    };
  },
  _decideFactionFlavor(state, leaderId, memberIds, rng, options = {}) {
    const roster = state.roster || [];
    const leader = roster.find(c => c.id === leaderId);
    if (!leader) return 'bond_first';
    const members = [...new Set(memberIds)].map(id => roster.find(c => c.id === id)).filter(Boolean);
    const scores = this._scoreFactionFlavor(state, leader, members, rng);
    const excluded = new Set(options.excludeFlavors || []);
    const candidates = Object.entries(scores).filter(([flavor]) => !excluded.has(flavor));
    if (!candidates.length) return 'bond_first';
    // v0.2: 拮抗時の優先順位（spec §4.2）— 属性が明確な方を優先
    // HEEL / FACE > MERIT > COMBAT > AUTHORITY > BOND
    const priority = ['heel', 'face', 'meritocratic', 'combat', 'authoritarian', 'bond_first'];
    candidates.sort((a, b) => {
      const diff = b[1] - a[1];
      if (Math.abs(diff) < 0.05) {
        // スコア拮抗時は priority で決定
        return priority.indexOf(a[0]) - priority.indexOf(b[0]);
      }
      return diff;
    });
    return candidates[0][0];
  },


  // ── 派閥生成 ──────────────────────────────────────────────
  createFaction(state, leaderId, memberIds, options = {}) {
    const roster = state.roster || [];
    const leader = roster.find(c => c.id === leaderId);
    if (!leader) return state;
    const type = options.type || 'loyal';
    const existingIds = new Set((state.factions || []).map(f => f.id));
    let nextId = 1;
    while (existingIds.has(nextId)) nextId++;
    const flavorRng = Engine.rng.create(Engine.rng.derive(
      state.rngSeed || 1,
      state.season || 1,
      state.week || 1,
      leaderId,
      nextId,
      0xFA7E
    ));
    const excludeFlavors = [...(options.excludeFlavors || [])];
    if ((state.factions || []).length === 0 && !options.allowInitialMeritocratic) excludeFlavors.push('meritocratic');
    const flavor = options.flavor || this._decideFactionFlavor(state, leaderId, memberIds, flavorRng, { excludeFlavors });

    const faction = {
      id: nextId,
      name: `${leader.name}組`,
      leaderId,
      memberIds: [...new Set(memberIds)],
      flavor,
      type,
      status: 'active', // 'active' | 'hiatus' | 'dissolved'
      authoritativeTag: !!options.authoritativeTag,
      dictatorTag: !!options.dictatorTag,
      // v0.2 アーキタイプタグ（spec §7.1）。flavor と整合
      bondTag: !!options.bondTag,
      meritTag: !!options.meritTag,
      heelTag: !!options.heelTag,
      faceTag: !!options.faceTag,
      combatTag: !!options.combatTag,
      momentum: 0,
      createdSeason: state.season,
      createdWeek: state.week,
      lastLeaderChangeSeason: state.season,
      lastLeaderChangeWeek: state.week,
    };

    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] ${type === 'loyal' ? 'Loyal' : 'Rivalrous'} faction formed: ${leader.name}組 (members: ${faction.memberIds.length})`);
    }

    return { ...state, factions: [...(state.factions || []), faction] };
  },

  // ── §4.2 対立度変動 ──────────────────────────────────────
  applyHostilityChange(state, fromFactionId, toFactionId, delta) {
    if (fromFactionId === toFactionId) return state;
    const key = this._hostKey(fromFactionId, toFactionId);
    const cur = (state.factionHostility || {})[key] || 0;
    const next = Engine.util.clamp(cur + delta, 0, 100);
    const newHost = { ...(state.factionHostility || {}) };
    if (next === 0) delete newHost[key];
    else newHost[key] = next;
    return { ...state, factionHostility: newHost };
  },

  // ── §5.2 勢い変動 ────────────────────────────────────────
  applyMomentumChange(state, factionId, delta) {
    const factions = (state.factions || []).map(f => {
      if (f.id !== factionId) return f;
      if (!this._isHostile(f)) return f; // §5.3 抗争中派閥のみ勢いを持つ
      return { ...f, momentum: Engine.util.clamp(f.momentum + delta, -100, 100) };
    });
    return { ...state, factions };
  },

  // ── §4.2 週次対立度減衰 ───────────────────────────────────
  processWeeklyHostilityDecay(state) {
    const cfg = FACTION_CONFIG;
    const host = state.factionHostility || {};
    if (Object.keys(host).length === 0) return state;
    const factions = state.factions || [];
    const factionMap = new Map(factions.map(f => [f.id, f]));
    const newHost = {};

    for (const [key, val] of Object.entries(host)) {
      const [fromStr, toStr] = key.split('>');
      const fromId = Number(fromStr), toId = Number(toStr);
      const from = factionMap.get(fromId);
      const to = factionMap.get(toId);
      if (!from || !to) continue; // 消滅済み派閥の対立度は捨てる

      let delta = cfg.hostilityDecayPerWeek;
      // 両派閥メンバー間の平均bondが高いと追加減衰
      let bondSum = 0, bondCount = 0;
      for (const a of from.memberIds) for (const b of to.memberIds) {
        bondSum += this._getBond(state, a, b);
        bondCount++;
      }
      const avgBond = bondCount ? bondSum / bondCount : 0;
      if (avgBond > cfg.hostilityHighBondThreshold) delta += cfg.hostilityHighBondExtraDecay;

      const next = Engine.util.clamp(val + delta, 0, 100);
      if (next > 0) newHost[key] = next;
    }

    // 対立度が全て 0 になった派閥は inHostility フラグをクリア（抗争終了）
    let newFactions = state.factions || [];
    if (newFactions.length > 0) {
      const stillHostile = new Set();
      for (const key of Object.keys(newHost)) {
        const [fromStr, toStr] = key.split('>');
        stillHostile.add(Number(fromStr));
        stillHostile.add(Number(toStr));
      }
      newFactions = newFactions.map(f => {
        if (f.inHostility && !stillHostile.has(f.id)) {
          if (typeof console !== 'undefined') {
            console.log(`[WM Faction] ${f.name} hostility cooled down`);
          }
          return { ...f, inHostility: false, momentum: 0 };
        }
        return f;
      });
    }
    return { ...state, factions: newFactions, factionHostility: newHost };
  },

  // ── §5.2 週次勢い減衰 ─────────────────────────────────────
  processWeeklyMomentumDecay(state) {
    const cfg = FACTION_CONFIG;
    const factions = (state.factions || []).map(f => {
      if (!this._isHostile(f)) return { ...f, momentum: 0 };
      const m = f.momentum;
      if (m === 0) return f;
      const step = cfg.momentumDecayPerWeek; // 1.0
      let next;
      if (m > 0) next = Math.max(0, m - step);
      else next = Math.min(0, m + step);
      return { ...f, momentum: next };
    });
    return { ...state, factions };
  },

  // ── Phase 3d §9 派閥構造が関係性に波及する週次処理 ────
  // 効果1: 派閥内結束 bond +0.15 / 効果2: 抗争越境敵意 rivalry +0.3
  // 効果3: 寝返り磁力 rivalry +0.5 / 効果4: 権威化の下向き圧 bond +0.1（リーダー→メンバー一方向）
  // 効果5: 独裁化の亀裂 rivalry +0.2
  processFactionInfluenceOnRelationships(state, rng) {
    let s = state;
    if (!s.factions || s.factions.length === 0) return s;
    if (!s.relationships) return s;
    const cfg = FACTION_CONFIG;
    const activeFactions = (s.factions || []).filter(f => f.status !== 'hiatus');
    const assigned = new Set();
    activeFactions.forEach(f => f.memberIds.forEach(id => assigned.add(id)));
    const neutralIds = (s.roster || [])
      .filter(c => !c.isRental && !assigned.has(c.id))
      .map(c => c.id);
    for (const f of activeFactions) {
      // 効果1: 同派閥メンバー全ペアに bond +0.15
      if (f.memberIds.length >= 2) {
        s = this._applyBondBetweenMembers(s, f.memberIds, cfg.sameFactionBondGain);
      }
      // 効果4: authoritativeTag ならリーダー → メンバー一方向 bond +0.1
      if (f.authoritativeTag && f.leaderId != null) {
        for (const mid of f.memberIds) {
          if (mid === f.leaderId) continue;
          s = this._applyBondDirected(s, f.leaderId, mid, cfg.factionLeaderBondGainAuthoritative);
        }
      }
      // 効果5: dictatorTag なら同派閥メンバー全ペアに rivalry +0.2
      if (f.dictatorTag && f.memberIds.length >= 2) {
        s = this._applyRivalryBetweenMembers(s, f.memberIds, cfg.dictatorInFactionRivalryGain);
      }
      if (neutralIds.length > 0) {
        s = this._applyBondBetweenGroups(s, f.memberIds, neutralIds, cfg.factionNeutralBondDecay);
      }
    }
    for (let i = 0; i < activeFactions.length; i++) {
      for (let j = i + 1; j < activeFactions.length; j++) {
        const fA = activeFactions[i];
        const fB = activeFactions[j];
        const hAB = (s.factionHostility || {})[this._hostKey(fA.id, fB.id)] || 0;
        const hBA = (s.factionHostility || {})[this._hostKey(fB.id, fA.id)] || 0;
        const avgHostility = (hAB + hBA) / 2;
        let bondDelta = cfg.factionCrossBondDecay;
        if (avgHostility >= cfg.factionCrossBondHostilityHighThreshold) {
          bondDelta += cfg.factionCrossBondHostilityHighExtra;
        } else if (avgHostility >= cfg.factionCrossBondHostilityMidThreshold) {
          bondDelta += cfg.factionCrossBondHostilityMidExtra;
        }
        s = this._applyBondBetweenGroups(s, fA.memberIds, fB.memberIds, bondDelta);
      }
    }
    // 効果2/3: 抗争中派閥ペア処理
    const hostilePairs = this._collectHostilePairs(s);
    for (const [fA, fB] of hostilePairs) {
      // 効果2: 敵対派閥メンバー間に rivalry +0.3（双方向）
      for (const a of fA.memberIds) {
        for (const b of fB.memberIds) {
          s = this._applyRivalryDirected(s, a, b, 0.3);
          s = this._applyRivalryDirected(s, b, a, 0.3);
        }
      }
      // 効果3: 敵対派閥メンバーとの bond 平均 60+ な選手は敵リーダー方向 rivalry +0.5
      s = this._applyTurncoatMagnetism(s, fA, fB);
      s = this._applyTurncoatMagnetism(s, fB, fA);
    }
    return s;
  },

  _applyBondBetweenGroups(state, groupAIds, groupBIds, delta) {
    if (!Array.isArray(groupAIds) || !Array.isArray(groupBIds)) return state;
    if (groupAIds.length === 0 || groupBIds.length === 0 || delta === 0) return state;
    let s = state;
    for (const a of groupAIds) {
      for (const b of groupBIds) {
        if (a === b) continue;
        s = this._applyBondDirected(s, a, b, delta);
        s = this._applyBondDirected(s, b, a, delta);
      }
    }
    return s;
  },

  _collectHostilePairs(state) {
    const host = state.factionHostility || {};
    const factionMap = new Map((state.factions || []).map(f => [f.id, f]));
    const seen = new Set();
    const pairs = [];
    for (const key of Object.keys(host)) {
      if ((host[key] || 0) <= 0) continue;
      const [fromStr, toStr] = key.split('>');
      const from = Number(fromStr);
      const to = Number(toStr);
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      const pairKey = `${lo}>${hi}`;
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      const fA = factionMap.get(from);
      const fB = factionMap.get(to);
      if (!fA || !fB) continue;
      pairs.push([fA, fB]);
    }
    return pairs;
  },

  _applyTurncoatMagnetism(state, fromFaction, toFaction) {
    if (toFaction.leaderId == null) return state;
    if (!toFaction.memberIds || !toFaction.memberIds.length) return state;
    let s = state;
    for (const mid of fromFaction.memberIds) {
      const avgBond = this._avgBond(s, mid, toFaction.memberIds);
      if (avgBond >= 60) {
        s = this._applyRivalryDirected(s, mid, toFaction.leaderId, 0.5);
      }
    }
    return s;
  },

  // ── §2.2 §2.3 メンバー変動 ──────────────────────────────
  processWeeklyMemberChanges(state, rng) {
    const cfg = FACTION_CONFIG;
    let s = state;
    if (!s.factions || s.factions.length === 0) return s;

    const rosterIds = new Set((s.roster || []).filter(c => !c.isRental).map(c => c.id));
    const assigned = new Set();
    s.factions.forEach(f => f.memberIds.forEach(id => assigned.add(id)));

    // ── 加入判定（v0.3: 1週1人・最高bond候補のみ判定・連続式確率） ──
    const newFactions = s.factions.map(f => ({ ...f, flavor: this._getFactionFlavor(f), memberIds: [...f.memberIds] }));
    const joinNotices = []; // Common-3: 自動加入通知キュー

    for (const f of newFactions) {
      // 単独派閥はサイズ上限で凍結
      if (newFactions.length === 1 && f.memberIds.length >= cfg.soloFactionFreezeSize) continue;

      // 未加入候補の中からbond平均が最も高い1人を選ぶ
      let bestCandId = null;
      let bestBond = -Infinity;
      for (const candId of [...rosterIds]) {
        if (assigned.has(candId) || f.memberIds.includes(candId)) continue;
        const avg = this._avgBond(s, candId, f.memberIds);
        if (avg >= cfg.joinBondThreshold && avg > bestBond) {
          bestBond = avg;
          bestCandId = candId;
        }
      }
      if (bestCandId === null) continue;

      // 確率: ((bond - 60) / 40) × joinMaxRate × momentum補正 × サイズ逓減
      const baseRate = ((bestBond - 60) / 40) * cfg.joinMaxRate;
      const momentumMult = Math.max(0.3, Math.min(2.0, 1 + (f.momentum || 0) * cfg.joinMomentumScale));
      const overDecay = Math.max(0, f.memberIds.length - cfg.joinSizeDecayStart);
      const sizeMult = Math.max(0, 1 - overDecay * cfg.joinSizeDecayRate);
      const flavorJoinMult = this._getFlavorJoinMult(f);
      const soloFactionMult = newFactions.length === 1 ? (cfg.soloFactionJoinRateMult || 1) : 1;
      const rate = Math.min(baseRate * momentumMult * sizeMult * flavorJoinMult * soloFactionMult, 0.95);

      if (Engine.rng.float(rng) < rate) {
        f.memberIds.push(bestCandId);
        assigned.add(bestCandId);
        const name = (s.roster || []).find(c => c.id === bestCandId)?.name || `#${bestCandId}`;
        if (typeof console !== 'undefined') console.log(`[WM Faction] ${name} joined ${f.name}`);
        // Common-3: 加入通知キューに積む
        joinNotices.push({
          factionId: f.id,
          factionName: f.name,
          leaderId: f.leaderId,
          archetypeId: f.archetypeId || null,
          newcomerId: bestCandId,
          newcomerName: name,
        });
      }
    }

    // ── 離脱判定 ──
    const trustUpdates = new Map(); // fighterId -> cumulative trust delta (raw, pre-sensitivity)
    for (const f of newFactions) {
      const leaderId = f.leaderId;
      const toRemove = [];
      for (const memberId of f.memberIds) {
        if (memberId === leaderId) continue;
        const bondToLeader = this._getBond(s, memberId, leaderId);
        if (bondToLeader >= cfg.leaveBondThreshold) continue;
        let rate = cfg.leaveRate;
        if (this._isHostile(f)) {
          if (f.momentum < -60) rate *= cfg.leaveMomentumVeryLowMult;
          else if (f.momentum < -30) rate *= cfg.leaveMomentumLowMult;
        }
        if (Engine.rng.float(rng) < rate) {
          toRemove.push(memberId);
        }
      }
      for (const rid of toRemove) {
        f.memberIds = f.memberIds.filter(id => id !== rid);
        const name = (s.roster || []).find(c => c.id === rid)?.name || `#${rid}`;
        if (typeof console !== 'undefined') console.log(`[WM Faction] ${name} left ${f.name}`);
      }
      // §2.3 勢い -60未満: 全メンバーに trust -0.3
      if (this._isHostile(f) && f.momentum < -60) {
        for (const memberId of f.memberIds) {
          trustUpdates.set(memberId, (trustUpdates.get(memberId) || 0) + cfg.leaveMomentumTrustDecay);
        }
      }
    }

    // trust 変動適用
    if (trustUpdates.size > 0 && Array.isArray(s.roster)) {
      const newRoster = s.roster.map(c => {
        const d = trustUpdates.get(c.id);
        if (d == null) return c;
        const oldT = c.trust != null ? c.trust : 50;
        const sensitivity = (Engine.trust && Engine.trust.trustSensitivity) ? Engine.trust.trustSensitivity(oldT) : 1;
        return { ...c, trust: Engine.util.clamp(oldT + d * sensitivity, 0, 100) };
      });
      s = { ...s, roster: newRoster };
    }

    let nextState = { ...s, factions: newFactions };
    if (joinNotices.length) {
      nextState = {
        ...nextState,
        _pendingFactionJoinNotices: [...((s._pendingFactionJoinNotices) || []), ...joinNotices],
      };
    }
    return nextState;
  },

  // ── §2.4 §2.6 消滅・解散 ────────────────────────────────
  checkDissolutionConditions(state) {
    const cfg = FACTION_CONFIG;
    let s = state;
    if (!s.factions || s.factions.length === 0) return s;

    const rosterSize = (s.roster || []).filter(c => !c.isRental).length;

    // §2.6 解散判定（単一派閥がロスター80%超）
    for (const f of s.factions) {
      if (rosterSize > 0 && f.memberIds.length / rosterSize >= cfg.dissolveRatioThreshold) {
        if (typeof console !== 'undefined') {
          console.log(`[WM Faction] Faction system dissolved (${f.name} dominated ${f.memberIds.length}/${rosterSize} of roster)`);
        }
        return { ...s, factions: [], factionHostility: {}, factionEventCooldowns: {} };
      }
    }

    // §2.4 メンバー3人未満で消滅
    const survivors = [];
    const removed = [];
    for (const f of s.factions) {
      if (f.memberIds.length < cfg.minFactionSize) removed.push(f);
      else survivors.push(f);
    }

    if (removed.length === 0) return s;

    // 消滅の影響: 対立派閥に勢い -3〜-5（ここでは簡易固定 -4）
    let newFactions = survivors;
    for (const dead of removed) {
      if (typeof console !== 'undefined') {
        console.log(`[WM Faction] ${dead.name} dissolved (members: ${dead.memberIds.length})`);
      }
      newFactions = newFactions.map(f => {
        if (!this._isHostile(f)) return f;
        return { ...f, momentum: Engine.util.clamp(f.momentum - 4, -100, 100) };
      });
    }

    // 対立度エントリから消滅派閥を参照するものを削除
    const survivorIds = new Set(newFactions.map(f => f.id));
    const newHost = {};
    for (const [key, val] of Object.entries(s.factionHostility || {})) {
      const [fromStr, toStr] = key.split('>');
      if (survivorIds.has(Number(fromStr)) && survivorIds.has(Number(toStr))) newHost[key] = val;
    }

    return { ...s, factions: newFactions, factionHostility: newHost };
  },

  // ── §2.5 §9.3 リーダー喪失・後継判定 ────────────────────
  handleLeaderLoss(state, factionId, rng) {
    const cfg = FACTION_CONFIG;
    let s = state;
    const faction = (s.factions || []).find(f => f.id === factionId);
    if (!faction) return s;

    const roster = s.roster || [];
    const oldLeader = (s.retiredFighters || []).find(c => c.id === faction.leaderId)
      || (s.freeAgents || []).find(c => c.id === faction.leaderId)
      || { id: faction.leaderId, name: '前リーダー' };
    // リーダーの引退/退団後 roster にはいないので、OVR は最後の既知値を探す
    const oldLeaderOvr = oldLeader.pw ? Engine.util.ov(oldLeader) : 75;

    // 候補 = 残メンバー（リーダー除く、rosterに残っている者）
    const remaining = faction.memberIds
      .filter(id => id !== faction.leaderId)
      .map(id => roster.find(c => c.id === id))
      .filter(Boolean);

    if (remaining.length === 0) {
      // 候補なし → 解散
      return this._dissolveFaction(s, factionId, 'leader_lost_no_successor');
    }

    remaining.sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const successor = remaining[0];
    const successorOvr = Engine.util.ov(successor);
    const ratio = oldLeaderOvr > 0 ? successorOvr / oldLeaderOvr : 1;

    if (ratio < cfg.successionOvrRatioPartial) {
      // 解散
      return this._dissolveFaction(s, factionId, 'leader_lost_low_ratio');
    }

    const isShock = ratio < cfg.successionOvrRatioFull
      && Engine.rng.float(rng) < cfg.successionShockProbability;

    // 派閥情報を更新
    const newFactions = s.factions.map(f => {
      if (f.id !== factionId) return f;
      const newMemberIds = f.memberIds.filter(id => id !== faction.leaderId);
      return {
        ...f,
        name: `${successor.name}組`,
        leaderId: successor.id,
        memberIds: newMemberIds,
        lastLeaderChangeSeason: s.season,
        lastLeaderChangeWeek: s.week,
      };
    });
    s = { ...s, factions: newFactions };

    // 対立度を ×0.7
    const newHost = {};
    for (const [key, val] of Object.entries(s.factionHostility || {})) {
      const [fromStr, toStr] = key.split('>');
      if (Number(fromStr) === factionId || Number(toStr) === factionId) {
        const next = Engine.util.clamp(val * cfg.hostilityLeaderChangeMultiplier, 0, 100);
        if (next > 0) newHost[key] = next;
      } else {
        newHost[key] = val;
      }
    }
    s = { ...s, factionHostility: newHost };

    // trust 変動
    const memberIds = newFactions.find(f => f.id === factionId).memberIds;
    const trustDelta = isShock
      ? -(8 + Math.floor(Engine.rng.float(rng) * 5))  // -8〜-12
      : -(3 + Math.floor(Engine.rng.float(rng) * 4)); // -3〜-6
    s = this._applyTrustToMembers(s, memberIds, trustDelta);

    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] Leader succession: ${faction.name} → ${successor.name}組 (ratio=${ratio.toFixed(2)}, ${isShock ? 'shock' : 'normal'})`);
    }

    // 動揺時: 対立派閥の勢い +15〜+25
    if (isShock) {
      const bump = 15 + Math.floor(Engine.rng.float(rng) * 11);
      const rival = (s.factions || []).find(f => f.id !== factionId && this._isHostile(f));
      if (rival) s = this.applyMomentumChange(s, rival.id, bump);
    }

    return s;
  },

  _dissolveFaction(state, factionId, reason) {
    let s = state;
    const dead = (s.factions || []).find(f => f.id === factionId);
    if (!dead) return s;
    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] ${dead.name} dissolved (${reason})`);
    }
    // 元メンバー trust -5〜-8 (簡易固定 -6)
    s = this._applyTrustToMembers(s, dead.memberIds, -6);
    // 効果6: 消滅余波 — 元メンバー全ペアに bond -5〜-10（1 派閥 1 回ロール）
    if (dead.memberIds.length >= 2 && s.relationships) {
      const seed = Engine.rng.derive(s.rngSeed || 0, s.season || 0, s.week || 0, 0xFA1A);
      const rng = Engine.rng.create(seed ^ factionId);
      const bondDelta = -(5 + Engine.rng.float(rng) * 5);
      s = this._applyBondBetweenMembers(s, dead.memberIds, bondDelta);
    }
    // 対立派閥の勢い -3〜-5
    const newFactions = s.factions
      .filter(f => f.id !== factionId)
      .map(f => this._isHostile(f) ? { ...f, momentum: Engine.util.clamp(f.momentum - 4, -100, 100) } : f);
    // 対立度エントリクリーンアップ
    const survivorIds = new Set(newFactions.map(f => f.id));
    const newHost = {};
    for (const [key, val] of Object.entries(s.factionHostility || {})) {
      const [fromStr, toStr] = key.split('>');
      if (survivorIds.has(Number(fromStr)) && survivorIds.has(Number(toStr))) newHost[key] = val;
    }
    return { ...s, factions: newFactions, factionHostility: newHost };
  },

  _applyTrustToMembers(state, memberIds, rawDelta) {
    if (!Array.isArray(state.roster) || !memberIds.length) return state;
    const idSet = new Set(memberIds);
    const newRoster = state.roster.map(c => {
      if (!idSet.has(c.id)) return c;
      const oldT = c.trust != null ? c.trust : 50;
      const sensitivity = (Engine.trust && Engine.trust.trustSensitivity) ? Engine.trust.trustSensitivity(oldT) : 1;
      return { ...c, trust: Engine.util.clamp(oldT + rawDelta * sensitivity, 0, 100) };
    });
    return { ...state, roster: newRoster };
  },

  // ── F03フック: 週次でロスター不在リーダー・メンバーを検出 ──
  reconcileRoster(state, rng) {
    let s = state;
    if (!s.factions || s.factions.length === 0) return s;

    const rosterIds = new Set((s.roster || []).map(c => c.id));

    // 1) リーダー喪失を先に処理
    while (true) {
      const factionWithLostLeader = (s.factions || []).find(f => !rosterIds.has(f.leaderId));
      if (!factionWithLostLeader) break;
      s = this.handleLeaderLoss(s, factionWithLostLeader.id, rng);
    }

    // 2) 通常メンバー（リーダー以外）でロスター不在 → memberIds から除外
    const newFactions = (s.factions || []).map(f => {
      const filtered = f.memberIds.filter(id => id === f.leaderId || rosterIds.has(id));
      if (filtered.length === f.memberIds.length) return f;
      return { ...f, memberIds: filtered };
    });
    s = { ...s, factions: newFactions };

    // 3) 複数派閥所属の修復（防御的 dedupe）
    //    1 選手 = 1 派閥が原則。過去の古いコードやエッジケースで重複が残っていたら、
    //    先着派閥を優先して後続派閥の memberIds から除外する。リーダーは常に優先。
    s = this._dedupeFactionMembers(s);

    return s;
  },

  // ── 重複所属修復: 1 fighterId が複数 memberIds に入っていたら先着派閥に寄せる ──
  _dedupeFactionMembers(state) {
    if (!state.factions || state.factions.length < 2) return state;
    const claimed = new Map(); // fighterId -> factionId（先着）
    // リーダーを先に予約（リーダー権は絶対に守る）
    for (const f of state.factions) {
      if (f.leaderId != null) claimed.set(f.leaderId, f.id);
    }
    let changed = false;
    const newFactions = state.factions.map(f => {
      const filtered = f.memberIds.filter(id => {
        if (id === f.leaderId) return true;
        const owner = claimed.get(id);
        if (owner === undefined) { claimed.set(id, f.id); return true; }
        if (owner === f.id) return true;
        if (typeof console !== 'undefined') {
          console.warn(`[WM Faction] dedupe: fighter#${id} was in faction#${owner} and faction#${f.id} — keeping in f${owner}`);
        }
        changed = true;
        return false;
      });
      return filtered.length === f.memberIds.length ? f : { ...f, memberIds: filtered };
    });
    if (!changed) return state;
    return { ...state, factions: newFactions };
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 3a: F01/F02/F03 演出イベント API
  //  spec §8（発動制御）§9.1-§9.3（イベントカタログ）
  // ══════════════════════════════════════════════════════════

  // ── 絶対週カウント（クールダウン比較用）──
  _absWeek(state) {
    return Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
  },

  // ── §9.3 F03 分岐判定（純粋関数、state 変更なし）──
  // return: { branch:'succession'|'turmoil'|'dissolution', successorId?, successorName?, oldLeaderId, oldLeaderName, oldLeaderOvr, successorOvr, ratio }
  resolveF03Branch(state, factionId, rng) {
    const cfg = FACTION_CONFIG;
    const faction = (state.factions || []).find(f => f.id === factionId);
    if (!faction) return { branch: 'dissolution', oldLeaderId: null, oldLeaderName: '???' };

    const roster = state.roster || [];
    const oldLeaderInRoster = roster.find(c => c.id === faction.leaderId);
    // リーダーがロスター外 or injury長期
    const oldLeaderSource = oldLeaderInRoster
      || (state.retiredFighters || []).find(c => c.id === faction.leaderId)
      || (state.freeAgents || []).find(c => c.id === faction.leaderId)
      || null;
    const oldLeaderName = oldLeaderSource ? oldLeaderSource.name : '前リーダー';
    const oldLeaderOvr = oldLeaderSource && oldLeaderSource.pw ? Engine.util.ov(oldLeaderSource) : 75;

    // 残メンバーは roster にいる非リーダー
    const remaining = faction.memberIds
      .filter(id => id !== faction.leaderId)
      .map(id => roster.find(c => c.id === id))
      .filter(Boolean);

    if (remaining.length === 0) {
      return {
        branch: 'dissolution',
        oldLeaderId: faction.leaderId, oldLeaderName, oldLeaderOvr,
        successorId: null, successorName: null, successorOvr: 0, ratio: 0,
      };
    }

    remaining.sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const successor = remaining[0];
    const successorOvr = Engine.util.ov(successor);
    const ratio = oldLeaderOvr > 0 ? successorOvr / oldLeaderOvr : 1;

    if (ratio < cfg.successionOvrRatioPartial) {
      return {
        branch: 'dissolution',
        oldLeaderId: faction.leaderId, oldLeaderName, oldLeaderOvr,
        successorId: successor.id, successorName: successor.name, successorOvr, ratio,
      };
    }
    const isShock = ratio < cfg.successionOvrRatioFull
      && Engine.rng.float(rng) < cfg.successionShockProbability;
    return {
      branch: isShock ? 'turmoil' : 'succession',
      oldLeaderId: faction.leaderId, oldLeaderName, oldLeaderOvr,
      successorId: successor.id, successorName: successor.name, successorOvr, ratio,
    };
  },

  // ── §9.3 フック: リーダー喪失検出（roster 外）──
  // return: { factionId, reason:'departure'|'retirement' } | null
  // ※ 長期重傷は F05H（活動休止）へ分離。本関数は roster 不在のみ検知する
  detectLeaderLoss(state) {
    if (!state.factions || state.factions.length === 0) return null;
    const roster = state.roster || [];
    const rosterMap = new Map(roster.map(c => [c.id, c]));
    const retiredIds = new Set((state.retiredFighters || []).map(c => c.id));

    for (const f of state.factions) {
      if (f.status === 'dissolved') continue;
      const leader = rosterMap.get(f.leaderId);
      if (!leader) {
        // リーダーがロスター不在（引退 or 退団）
        const reason = retiredIds.has(f.leaderId) ? 'retirement' : 'departure';
        return { factionId: f.id, reason };
      }
    }
    return null;
  },

  // ── §9.10 F05H フック: 活動休止トリガー検出 ────────────────
  // リーダーが 8週以上の長期離脱（怪我）状態に入った active 派閥を検知
  // return: { factionId, estimatedWeeks } | null
  detectHiatusTrigger(state) {
    if (!state.factions || state.factions.length === 0) return null;
    const roster = state.roster || [];
    const rosterMap = new Map(roster.map(c => [c.id, c]));
    for (const f of state.factions) {
      if (f.status !== 'active') continue;
      const leader = rosterMap.get(f.leaderId);
      if (!leader) continue;
      const weeksLeft = (leader.injury && leader.injury.weeksLeft) || 0;
      if (weeksLeft >= 8) {
        return { factionId: f.id, estimatedWeeks: weeksLeft };
      }
    }
    return null;
  },

  // ── §9.10 F05H フック: 活動休止の自動復帰検出（通知なし・ログのみ）──
  // hiatus 派閥のリーダーが復帰可能（怪我回復）な状態になったら status を active に戻す
  applyHiatusRecovery(state) {
    if (!state.factions || state.factions.length === 0) return state;
    const roster = state.roster || [];
    const rosterMap = new Map(roster.map(c => [c.id, c]));
    let changed = false;
    const newFactions = state.factions.map(f => {
      if (f.status !== 'hiatus') return f;
      const leader = rosterMap.get(f.leaderId);
      if (!leader) return f; // 不在なら F03 経路に委ねる
      const weeksLeft = (leader.injury && leader.injury.weeksLeft) || 0;
      if (weeksLeft === 0) {
        changed = true;
        if (typeof console !== 'undefined') {
          console.log(`[WM Faction] ${f.name} resumed activity (leader ${leader.name} recovered)`);
        }
        return { ...f, status: 'active' };
      }
      return f;
    });
    return changed ? { ...state, factions: newFactions } : state;
  },

  // ── §9.10 F05H 適用（status='hiatus' へ遷移、通知のみ）──
  applyF05HResult(state, payload) {
    const factionId = payload && payload.factionId;
    if (factionId == null) return { state, resultText: '' };
    const faction = (state.factions || []).find(f => f.id === factionId);
    if (!faction) return { state, resultText: '' };
    const newFactions = state.factions.map(f => {
      if (f.id !== factionId) return f;
      return { ...f, status: 'hiatus', inHostility: false, momentum: 0 };
    });
    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] ${faction.name} entered hiatus (leader absent ${payload.estimatedWeeks || 8}w+)`);
    }
    return {
      state: { ...state, factions: newFactions },
      resultText: `派閥「${faction.name}」は旗を畳み、活動を一時休止した。`,
    };
  },

  // ── §9.11 F02③ 決着: 試合結果フック ───────────────────────
  // matchContext: { winnerId, loserId, isDraw, matchTier? }
  // return: { state, pendingEvent? }  pendingEvent は caller が _pendingFactionEvent に積む
  // 条件: 両者が別派閥のリーダー、両派閥とも inHostility=true、両方向 hostility >= 60、ドローでない
  rollResolutionAfterMatch(state, matchContext) {
    if (!state || !matchContext) return { state };
    const { winnerId, loserId, isDraw } = matchContext;
    if (isDraw) return { state };
    if (winnerId == null || loserId == null) return { state };
    const factions = state.factions || [];
    const facW = factions.find(f => f.leaderId === winnerId);
    const facL = factions.find(f => f.leaderId === loserId);
    if (!facW || !facL) return { state };
    if (facW.id === facL.id) return { state };
    if (!this._isHostile(facW) || !this._isHostile(facL)) return { state };
    const hWL = (state.factionHostility || {})[this._hostKey(facW.id, facL.id)] || 0;
    const hLW = (state.factionHostility || {})[this._hostKey(facL.id, facW.id)] || 0;
    if (hWL < 60 || hLW < 60) return { state };

    const pendingEvent = {
      eventId: 'F02_RESOLUTION',
      payload: {
        winnerId, loserId,
        winnerFactionId: facW.id, loserFactionId: facL.id,
        winnerFactionName: facW.name, loserFactionName: facL.name,
      },
    };
    return { state, pendingEvent };
  },

  // ── §9.11 F02③ 決着 結果適用（UI "続ける" で実効）──
  applyF02ResolutionResult(state, payload, rng) {
    const cfg = FACTION_CONFIG;
    if (!payload) return { state, resultText: '' };
    const { winnerId, loserId, winnerFactionId, loserFactionId } = payload;
    let s = state;
    const factions = s.factions || [];
    const facW = factions.find(f => f.id === winnerFactionId);
    const facL = factions.find(f => f.id === loserFactionId);
    if (!facW || !facL) return { state: s, resultText: '' };

    const floatR = (lo, hi) => lo + Math.floor(Engine.rng.float(rng) * (hi - lo + 1));

    // 勢い: 勝者 +18〜25 / 敗者 -22〜-25
    s = this.applyMomentumChange(s, facW.id, floatR(18, 25));
    s = this.applyMomentumChange(s, facL.id, -floatR(22, 25));

    // リーダー信頼 (勝者 +6〜8, 敗者 -3〜-5)
    s = this._applyTrustToMembers(s, [winnerId], floatR(6, 8));
    s = this._applyTrustToMembers(s, [loserId], -floatR(3, 5));

    // 求心力 = members→leader bond（勝者 +5〜8 / 敗者 -6〜-9）
    const wMembers = facW.memberIds.filter(id => id !== facW.leaderId);
    const lMembers = facL.memberIds.filter(id => id !== facL.leaderId);
    const wBond = floatR(5, 8);
    const lBond = -floatR(6, 9);
    for (const mid of wMembers) s = this._applyBondDirected(s, mid, facW.leaderId, wBond);
    for (const mid of lMembers) s = this._applyBondDirected(s, mid, facL.leaderId, lBond);

    // 両派閥間 hostility -40 (完全解消せず、決着後の冷静として残す)
    s = this.applyHostilityChange(s, facW.id, facL.id, -40);
    s = this.applyHostilityChange(s, facL.id, facW.id, -40);

    // 敗者派閥の下位 2〜3 名に trust ペナルティ (離脱リスク = trust 下押し)
    const roster = s.roster || [];
    const ovrMap = new Map();
    roster.forEach(c => ovrMap.set(c.id, Engine.util.ov(c)));
    const bottomMembers = facL.memberIds
      .filter(id => id !== facL.leaderId)
      .map(id => ({ id, ovr: ovrMap.get(id) || 0 }))
      .sort((a, b) => a.ovr - b.ovr)
      .slice(0, 2 + Math.floor(Engine.rng.float(rng) * 2)) // 2〜3 名
      .map(x => x.id);
    if (bottomMembers.length > 0) {
      s = this._applyTrustToMembers(s, bottomMembers, -floatR(4, 6));
    }

    // factionTimeline に RESOLVED エントリ追記
    if (Array.isArray(s.factionTimeline)) {
      s = {
        ...s,
        factionTimeline: [
          ...s.factionTimeline,
          {
            type: 'F02_RESOLVED',
            season: s.season, week: s.week,
            winnerFactionId, loserFactionId,
            winnerId, loserId,
          },
        ],
      };
    }

    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] F02 resolved: ${facW.name} (winner) vs ${facL.name} (loser)`);
    }

    return {
      state: s,
      resultText: `「${facW.name}」が「${facL.name}」を下した。リング上で、ようやく決着がついた。`,
    };
  },

  // ── §8 週次イベント抽選（F03 > F05H > F08 > F04 > F05 > F07 > F06 > F02 > F01 の優先順）──
  // return: { eventId:'F01'|'F02'|'F03'|'F04'|'F05'|'F05H'|'F06'|'F07'|'F08'|null, payload }
  pickWeeklyEvent(state, rng) {
    const cfg = FACTION_CONFIG;

    // 1) F03（最優先、即時発動 100%）
    const leaderLoss = this.detectLeaderLoss(state);
    if (leaderLoss) {
      const branch = this.resolveF03Branch(state, leaderLoss.factionId, rng);
      const faction = state.factions.find(f => f.id === leaderLoss.factionId);
      return {
        eventId: 'F03',
        payload: {
          factionId: leaderLoss.factionId,
          factionName: faction ? faction.name : '派閥',
          reason: leaderLoss.reason,
          ...branch,
        },
      };
    }

    // 1.5) F05H（活動休止: リーダー長期離脱 8週以上、即時発動 100%）
    const hiatusTrig = this.detectHiatusTrigger(state);
    if (hiatusTrig) {
      const fac = state.factions.find(f => f.id === hiatusTrig.factionId);
      const leader = (state.roster || []).find(c => c.id === (fac ? fac.leaderId : -1));
      return {
        eventId: 'F05H',
        payload: {
          factionId: hiatusTrig.factionId,
          factionName: fac ? fac.name : '派閥',
          leaderId: fac ? fac.leaderId : null,
          leaderName: leader ? leader.name : '???',
          estimatedWeeks: hiatusTrig.estimatedWeeks,
        },
      };
    }

    // 1.7) F02_ENDLESS（無限抗争: 両方向hostility平均≥55 が52週継続、即時発動 100%）
    const endlessTrig = this.checkF02EndlessCondition(state);
    if (endlessTrig.eligible) {
      return { eventId: 'F02_ENDLESS', payload: endlessTrig };
    }

    // 1.8) F02_PEACE（仲裁による沈静化、watch 条件到達で即時発動 100%）
    const peaceCheck = this.checkF02PeaceConditions(state);
    if (peaceCheck.eligible) {
      return { eventId: 'F02_PEACE', payload: peaceCheck.payload };
    }

    // 2) F08（対立ヒートアップ、確率 50%）
    const f08 = this.checkF08Conditions(state);
    if (f08.eligible && Engine.rng.float(rng) < cfg.eventProbability.F08) {
      return { eventId: 'F08', payload: f08 };
    }

    // 3) F04（寝返り、確率 30%）
    const f04 = this.checkF04Conditions(state);
    if (f04.eligible && Engine.rng.float(rng) < cfg.eventProbability.F04) {
      return { eventId: 'F04', payload: f04 };
    }

    // 4) F05（派閥内亀裂、確率 40%）
    const f05 = this.checkF05Conditions(state);
    if (f05.eligible && Engine.rng.float(rng) < cfg.eventProbability.F05) {
      return { eventId: 'F05', payload: f05 };
    }

    // 5) F07（派閥動向、v0.4 共通フレーム化: チーム全体 12 週 CD で総量抑制）
    const f07 = this.checkF07Conditions(state, rng);
    if (f07.eligible) {
      return { eventId: 'F07', payload: f07 };
    }

    // 6) F06（和解の兆し、確率 50%）
    const f06 = this.checkF06Conditions(state);
    if (f06.eligible && Engine.rng.float(rng) < cfg.eventProbability.F06) {
      return { eventId: 'F06', payload: f06 };
    }

    // 7) F02（派閥抗争勃発、確率 80%）
    const rivCheck = this.checkRivalrousFormationConditions(state);
    if (rivCheck.eligible) {
      if (Engine.rng.float(rng) < cfg.eventProbability.F02) {
        const roster = state.roster || [];
        const factions = state.factions || [];
        const factionA = factions.find(f => f.id === rivCheck.factionAId);
        const factionB = factions.find(f => f.id === rivCheck.factionBId);
        const leaderA = roster.find(c => c.id === rivCheck.leaderAId);
        const leaderB = roster.find(c => c.id === rivCheck.leaderBId);
        return {
          eventId: 'F02',
          payload: {
            factionAId: rivCheck.factionAId,
            factionBId: rivCheck.factionBId,
            factionAName: factionA ? factionA.name : '派閥A',
            factionBName: factionB ? factionB.name : '派閥B',
            leaderAId: rivCheck.leaderAId,
            leaderBId: rivCheck.leaderBId,
            leaderAName: leaderA ? leaderA.name : '???',
            leaderBName: leaderB ? leaderB.name : '???',
            avgCrossRivalry: rivCheck.avgRivalry,
          },
        };
      }
    }

    // 8) F01（忠誠型結成、確率 60%、拒否クールダウン対応）
    // v0.2: アーキタイプ判定（6種）を payload に含める
    const archetypeRngFor = (leaderId) => Engine.rng.create(Engine.rng.derive(
      state.rngSeed || 1, state.season || 1, state.week || 1, leaderId, 0xA12E
    ));
    const loyalCheck = this.checkLoyalFormationConditions(state, { maxExistingFactions: 0 });
    if (loyalCheck.eligible) {
      const cdUntil = (state.factionEventCooldowns || {}).F01_rejected_until || 0;
      const now = this._absWeek(state);
      if (now >= cdUntil && Engine.rng.float(rng) < cfg.eventProbability.F01) {
        const memberIds = [loyalCheck.leaderId, ...loyalCheck.followerIds];
        // 初回派閥は meritocratic を抑制（既存挙動）
        const exclude = (state.factions || []).length === 0 ? ['meritocratic'] : [];
        const archetype = this._decideFactionFlavor(state, loyalCheck.leaderId, memberIds, archetypeRngFor(loyalCheck.leaderId), { excludeFlavors: exclude });
        return {
          eventId: 'F01',
          payload: {
            leaderId: loyalCheck.leaderId,
            leaderName: loyalCheck.leaderName,
            followerIds: loyalCheck.followerIds,
            archetype, // v0.2 NEW
          },
        };
      }
    }

    const secondLoyalCheck = this.checkLoyalFormationConditions(state, {
      maxExistingFactions: cfg.secondFactionMaxExistingFactions || 1,
      requireUnassigned: true,
    });
    if (secondLoyalCheck.eligible && secondLoyalCheck.existingFactionCount === 1) {
      const cdUntil = (state.factionEventCooldowns || {}).F01_rejected_until || 0;
      const now = this._absWeek(state);
      if (now >= cdUntil && Engine.rng.float(rng) < (cfg.secondFactionProbability || cfg.eventProbability.F01)) {
        const memberIds = [secondLoyalCheck.leaderId, ...secondLoyalCheck.followerIds];
        const archetype = this._decideFactionFlavor(state, secondLoyalCheck.leaderId, memberIds, archetypeRngFor(secondLoyalCheck.leaderId), {});
        return {
          eventId: 'F01',
          payload: {
            leaderId: secondLoyalCheck.leaderId,
            leaderName: secondLoyalCheck.leaderName,
            followerIds: secondLoyalCheck.followerIds,
            archetype, // v0.2 NEW
          },
        };
      }
    }

    return { eventId: null };
  },

  // ── §9.1 F01 選択肢効果適用 ──
  // choiceId: 'A'=権威化 / 'B'=拒否 / 'C'=静観
  applyF01Choice(state, payload, choiceId, rng) {
    const { leaderId, leaderName, followerIds, archetype } = payload;
    let s = state;
    const members = [leaderId, ...followerIds];
    // v0.2: payload.archetype が無ければ後方互換で authoritarian にフォールバック（旧挙動）
    const arch = archetype || 'authoritarian';

    if (choiceId === 'A') {
      // v0.2: アーキタイプ別の効果テーブル（spec §5.2）
      // すべて派閥成立、リーダー trust +5〜+8、flavor=arch、対応タグ付与
      const tagOpts = this._archetypeToTagOptions(arch);
      s = this.createFaction(s, leaderId, members, { type: 'loyal', flavor: arch, ...tagOpts });
      const rawTrust = 5 + Math.floor(Engine.rng.float(rng) * 4); // 5〜8（共通）
      s = this._applyTrustToMembers(s, [leaderId], rawTrust);
      // bond / 士気の効果はアーキタイプで分岐
      const moraleEffect = this._archetypeF01Effect(arch, rng);
      if (moraleEffect.bondDelta !== 0) {
        s = this._applyBondBetweenMembers(s, members, moraleEffect.bondDelta);
      }
      if (moraleEffect.moraleDelta !== 0) {
        s = this._applyLockerRoomMorale(s, moraleEffect.moraleDelta);
      }
      const archLabel = this._archetypeLabel(arch);
      return { state: s, resultText: `${leaderName}を中心に派閥「${leaderName}組」が旗揚げされた（${archLabel}）。` };
    }
    if (choiceId === 'B') {
      // 派閥不成立 + リーダー trust -5〜-8 + フォロワー→リーダー bond -5〜-8 + 士気 +1〜+3 + クールダウン12週
      const rawTrust = -(5 + Math.floor(Engine.rng.float(rng) * 4));
      s = this._applyTrustToMembers(s, [leaderId], rawTrust);
      const bondDelta = -(5 + Math.floor(Engine.rng.float(rng) * 4));
      for (const fId of followerIds) s = this._applyBondDirected(s, fId, leaderId, bondDelta);
      const moraleBonus = 1 + Math.floor(Engine.rng.float(rng) * 3); // +1〜+3
      s = this._applyLockerRoomMorale(s, moraleBonus);
      const cooldownWeeks = 12;
      const now = this._absWeek(s);
      s = {
        ...s,
        factionEventCooldowns: {
          ...(s.factionEventCooldowns || {}),
          F01_rejected_until: now + cooldownWeeks,
        },
      };
      return { state: s, resultText: `${leaderName}に釘を刺した。派閥結成の動きは一旦沈静化した。` };
    }
    // 'C' 静観 — 派閥成立だがアーキタイプ専用タグなし（flavor のみ記録）
    s = this.createFaction(s, leaderId, members, { type: 'loyal', flavor: arch });
    return { state: s, resultText: `${leaderName}を中心とした集まりを静かに見守ることにした。` };
  },

  // v0.2: アーキタイプ → createFaction options のタグ変換
  _archetypeToTagOptions(arch) {
    switch (arch) {
      case 'authoritarian': return { authoritativeTag: true };
      case 'bond_first':    return { bondTag: true };
      case 'meritocratic':  return { meritTag: true };
      case 'heel':          return { heelTag: true };
      case 'face':          return { faceTag: true };
      case 'combat':        return { combatTag: true };
      default:              return {};
    }
  },

  // v0.2: F01 A 選択時の bond/士気増減（spec §5.2）
  _archetypeF01Effect(arch, rng) {
    const r = (lo, hi) => lo + Math.floor(Engine.rng.float(rng) * (hi - lo + 1));
    switch (arch) {
      case 'authoritarian': return { bondDelta: r(3, 5),  moraleDelta: -r(2, 4) };
      case 'bond_first':    return { bondDelta: r(5, 8),  moraleDelta:  r(1, 2) };
      case 'meritocratic':  return { bondDelta: r(2, 3),  moraleDelta: -r(1, 2) };
      case 'heel':          return { bondDelta: r(3, 4),  moraleDelta:  0       };
      case 'face':          return { bondDelta: r(3, 4),  moraleDelta:  r(1, 2) };
      case 'combat':        return { bondDelta: r(3, 4),  moraleDelta: -r(1, 2) };
      default:              return { bondDelta: r(3, 5),  moraleDelta: -r(2, 4) };
    }
  },

  _archetypeLabel(arch) {
    const map = {
      authoritarian: '権威型', bond_first: '結束型', meritocratic: '実力主義',
      heel: 'ヒール派閥', face: '正統派', combat: '武闘派', neutral: '自然型',
    };
    return map[arch] || '結束型';
  },

  // ── §9.2 F02 選択肢効果適用（派閥抗争の勃発、v4 3択版）──
  // choiceId: 'A'=煽る / 'B'=仲裁 / 'C'=介入しない
  // 既存の2派閥に inHostility フラグを立て、対立度・勢いを注入する。
  // 'A'=煽る は F02① ignite（次興行でのメインカード化）へ繋がる pending を登録し、
  // 'B'=仲裁 は F02② peace watch を登録する（§2-1 ignite/peace は Step 3/4 で参照）
  applyF02Choice(state, payload, choiceId, rng) {
    const { factionAId, factionBId, leaderAId, leaderBId, leaderAName, leaderBName, factionAName, factionBName, avgCrossRivalry } = payload;
    let s = state;

    // 両派閥に inHostility フラグを立てる（全ケースで抗争状態に入る）
    const markHostile = (st) => ({
      ...st,
      factions: (st.factions || []).map(f => {
        if (f.id === factionAId || f.id === factionBId) {
          return { ...f, inHostility: true };
        }
        return f;
      }),
    });
    s = markHostile(s);

    const A = s.factions.find(f => f.id === factionAId);
    const B = s.factions.find(f => f.id === factionBId);
    if (!A || !B) return { state: s, resultText: '' };

    if (choiceId === 'A') {
      // 煽る: 抗争を公式戦に仕立てる。両方向 hostility を強めに注入し、両派閥の勢いをブースト、
      //        ロッカールーム士気は -3〜-5（社長が火に油を注いだ代償）。
      //        factionPendingIgnite を立て、次週以降のメイン自動組込み検出に使う（Step 3 で消費）。
      const h1 = 55 + Math.floor(Engine.rng.float(rng) * 16);      // 55〜70
      const h2 = 55 + Math.floor(Engine.rng.float(rng) * 16);      // 55〜70
      s = this.applyHostilityChange(s, A.id, B.id, h1);
      s = this.applyHostilityChange(s, B.id, A.id, h2);
      const mA = 10 + Math.floor(Engine.rng.float(rng) * 11);      // +10〜+20
      const mB = 10 + Math.floor(Engine.rng.float(rng) * 11);
      s = this.applyMomentumChange(s, A.id, mA);
      s = this.applyMomentumChange(s, B.id, mB);
      const moralePen = -(3 + Math.floor(Engine.rng.float(rng) * 3)); // -3〜-5
      s = this._applyLockerRoomMorale(s, moralePen);
      // 発火予約（Step 3 で消費する）。期限は 4 週（興行が挟まれなければ失効）
      const now = this._absWeek(s);
      s = {
        ...s,
        factionPendingIgnite: {
          factionAId: A.id, factionBId: B.id,
          leaderAId, leaderBId,
          factionAName: factionAName || A.name, factionBName: factionBName || B.name,
          scheduledFromWeek: now,
          expireWeek: now + 4,
        },
      };
      return {
        state: s,
        resultText: `${leaderAName}と${leaderBName}の争いをリングに持ち込む方針を取った。観客はこの火種を見逃さないだろう。`,
      };
    }
    if (choiceId === 'B') {
      // 仲裁: 両リーダーを呼び出して矛を収めさせる。対立度は低めに残し、仲裁労で両者に一時的な不満、勢いは 0 リセット。
      //        f02MediationWatches に登録し、8〜12週以内に hostility 減衰＋士気維持なら F02② peace 発火（Step 4 で消費）。
      const t1 = -(3 + Math.floor(Engine.rng.float(rng) * 3));
      const t2 = -(3 + Math.floor(Engine.rng.float(rng) * 3));
      s = this._applyTrustToMembers(s, [leaderAId], t1);
      s = this._applyTrustToMembers(s, [leaderBId], t2);
      const h1 = 30 + Math.floor(Engine.rng.float(rng) * 16);  // 30〜45
      const h2 = 30 + Math.floor(Engine.rng.float(rng) * 16);
      s = this.applyHostilityChange(s, A.id, B.id, h1);
      s = this.applyHostilityChange(s, B.id, A.id, h2);
      // 勢いは 0 リセット（両派閥）
      s = this.applyMomentumChange(s, A.id, -A.momentum);
      s = this.applyMomentumChange(s, B.id, -B.momentum);
      // peace watch 登録
      const now = this._absWeek(s);
      const hABBase = (s.factionHostility || {})[this._hostKey(A.id, B.id)] || 0;
      const hBABase = (s.factionHostility || {})[this._hostKey(B.id, A.id)] || 0;
      const watches = Array.isArray(s.f02MediationWatches) ? s.f02MediationWatches.slice() : [];
      // 同ペアの重複は排除
      const pairKey = this._sortedPairKey(A.id, B.id);
      const filtered = watches.filter(w => this._sortedPairKey(w.factionAId, w.factionBId) !== pairKey);
      filtered.push({
        factionAId: A.id, factionBId: B.id,
        leaderAId, leaderBId,
        factionAName: factionAName || A.name, factionBName: factionBName || B.name,
        baseHostilityAB: hABBase, baseHostilityBA: hBABase,
        startWeek: now,
        deadlineWeek: now + 12,
      });
      s = { ...s, f02MediationWatches: filtered };
      return { state: s, resultText: `両者を呼び出し、団体のために筋を通させた。火種は残ったが、空気はひとまず収まった。` };
    }
    // 'C' 介入しない: 対立度は平均 rivalry を継承、勢いは 0、trust 変動なし
    const inherit = Math.max(0, Math.min(100, Math.round(avgCrossRivalry || 0)));
    if (inherit > 0) {
      s = this.applyHostilityChange(s, A.id, B.id, inherit);
      s = this.applyHostilityChange(s, B.id, A.id, inherit);
    }
    return { state: s, resultText: `二つの派閥が睨み合う状況を、社長は静かに見届けた。` };
  },

  // ── §9.3 F03 結果適用（branch 事前決定済み）──
  applyF03Result(state, payload, rng) {
    const { factionId, branch, successorId, oldLeaderName } = payload;
    let s = state;
    const faction = (s.factions || []).find(f => f.id === factionId);
    if (!faction) return { state: s, resultText: '' };

    if (branch === 'dissolution') {
      s = this._dissolveFaction(s, factionId, 'F03_low_ratio');
      return { state: s, resultText: `派閥「${faction.name}」は、${oldLeaderName}の喪失とともに求心力を失い、消滅した。` };
    }

    // succession / turmoil 共通の更新
    const roster = s.roster || [];
    const successor = roster.find(c => c.id === successorId);
    if (!successor) {
      // 念のためフォールバック
      s = this._dissolveFaction(s, factionId, 'F03_no_successor');
      return { state: s, resultText: `派閥「${faction.name}」は後継を得られず消滅した。` };
    }

    const newFactions = s.factions.map(f => {
      if (f.id !== factionId) return f;
      const newMemberIds = f.memberIds.filter(id => id !== faction.leaderId);
      return {
        ...f,
        name: `${successor.name}組`,
        leaderId: successor.id,
        memberIds: newMemberIds,
        lastLeaderChangeSeason: s.season,
        lastLeaderChangeWeek: s.week,
      };
    });
    s = { ...s, factions: newFactions };

    // 対立度 ×0.7
    const cfg = FACTION_CONFIG;
    const newHost = {};
    for (const [key, val] of Object.entries(s.factionHostility || {})) {
      const [fromStr, toStr] = key.split('>');
      if (Number(fromStr) === factionId || Number(toStr) === factionId) {
        const next = Engine.util.clamp(val * cfg.hostilityLeaderChangeMultiplier, 0, 100);
        if (next > 0) newHost[key] = next;
      } else {
        newHost[key] = val;
      }
    }
    s = { ...s, factionHostility: newHost };

    const remainingIds = newFactions.find(f => f.id === factionId).memberIds;

    if (branch === 'succession') {
      // trust -3〜-6
      const d = -(3 + Math.floor(Engine.rng.float(rng) * 4));
      s = this._applyTrustToMembers(s, remainingIds, d);
      // 後継者→旧リーダー bond +3〜+5（relationships 上で引き継ぎ形）
      const bondDelta = 3 + Math.floor(Engine.rng.float(rng) * 3);
      s = this._applyBondDirected(s, successorId, payload.oldLeaderId, bondDelta);
      return {
        state: s,
        resultText: `派閥は${successor.name}を新たな中心に据えて継承された。動揺はあるが、歯車は回り続ける。`,
      };
    }
    // turmoil
    const d = -(8 + Math.floor(Engine.rng.float(rng) * 5)); // -8〜-12
    s = this._applyTrustToMembers(s, remainingIds, d);
    // メンバー間 bond -5〜-10
    const bondDelta = -(5 + Math.floor(Engine.rng.float(rng) * 6));
    s = this._applyBondBetweenMembers(s, remainingIds, bondDelta);
    // 後継候補→旧リーダー bond +10〜+15（残像の美化）
    const idol = 10 + Math.floor(Engine.rng.float(rng) * 6);
    s = this._applyBondDirected(s, successorId, payload.oldLeaderId, idol);
    // 対立派閥の勢い +15〜+25
    const bump = 15 + Math.floor(Engine.rng.float(rng) * 11);
    const rival = (s.factions || []).find(f => f.id !== factionId && this._isHostile(f));
    if (rival) s = this.applyMomentumChange(s, rival.id, bump);
    return {
      state: s,
      resultText: `${successor.name}は後を継いだが、派閥内の動揺は深く、一度大きく揺らいだ。`,
    };
  },

  // ── auto-sim ランダム選択ヘルパー ──
  pickRandomChoice(eventId, rng) {
    if (eventId === 'F01') {
      const choices = ['A', 'B', 'C'];
      return choices[Math.floor(Engine.rng.float(rng) * choices.length)];
    }
    if (eventId === 'F02') {
      const choices = ['A', 'B', 'C', 'D'];
      return choices[Math.floor(Engine.rng.float(rng) * choices.length)];
    }
    if (eventId === 'F04' || eventId === 'F05' || eventId === 'F06' || eventId === 'F07' || eventId === 'F08') {
      const choices = ['A', 'B', 'C'];
      return choices[Math.floor(Engine.rng.float(rng) * choices.length)];
    }
    return 'OK'; // F03 は選択肢なし
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 3b: F04-F08 検出 + 適用
  // ══════════════════════════════════════════════════════════

  _sortedPairKey(idA, idB) {
    return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  },

  _f04Key(targetId, toFactionId) { return `F04:${targetId}:${toFactionId}`; },
  _f05Key(factionId) { return `F05:${factionId}`; },
  _f06Key(fAId, fBId) { return `F06:${this._sortedPairKey(fAId, fBId)}`; },
  _f07Key(factionId) { return `F07:${factionId}`; },
  _f08Key(fAId, fBId) { return `F08:${this._sortedPairKey(fAId, fBId)}`; },

  _isCooldownReady(state, key, cooldownWeeks) {
    const cd = (state.factionEventCooldowns || {})[key];
    if (!cd || typeof cd.lastTriggeredWeek !== 'number') return true;
    return this._absWeek(state) - cd.lastTriggeredWeek >= cooldownWeeks;
  },

  _markCooldown(state, key) {
    return {
      ...state,
      factionEventCooldowns: {
        ...(state.factionEventCooldowns || {}),
        [key]: { lastTriggeredWeek: this._absWeek(state) },
      },
    };
  },

  // ── §9.4 F04 寝返り候補検出 ──
  // 「敵対派閥メンバーとのbond平均70+」かつ「自派閥リーダーへのbond40-」
  // return: { eligible, targetId, targetName, fromFactionId, toFactionId, fromFactionName, toFactionName, fromLeaderId, toLeaderId } | { eligible:false }
  checkF04Conditions(state) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const hostilePairs = [];
    for (let i = 0; i < factions.length; i++) {
      for (let j = 0; j < factions.length; j++) {
        if (i === j) continue;
        const A = factions[i], B = factions[j];
        if (!this._isHostile(A) || !this._isHostile(B)) continue;
        const hAB = (state.factionHostility || {})[this._hostKey(A.id, B.id)] || 0;
        const hBA = (state.factionHostility || {})[this._hostKey(B.id, A.id)] || 0;
        if ((hAB + hBA) / 2 < 40) continue; // 実効的に抗争度がある組だけ
        hostilePairs.push({ from: A, to: B });
      }
    }
    if (!hostilePairs.length) return { eligible: false };

    let best = null;
    let bestScore = -Infinity;
    for (const { from, to } of hostilePairs) {
      const bondToLeader = (memberId) => this._getBond(state, memberId, from.leaderId);
      for (const memberId of from.memberIds) {
        if (memberId === from.leaderId) continue;
        const leaderBond = bondToLeader(memberId);
        if (leaderBond >= cfg.f04BondLeaderMaxThreshold) continue;
        const avgAlly = this._avgBond(state, memberId, to.memberIds);
        if (avgAlly < cfg.f04BondAllyThreshold) continue;
        // クールダウン
        const key = this._f04Key(memberId, to.id);
        if (!this._isCooldownReady(state, key, cfg.eventCooldown.F04)) continue;
        const score = avgAlly - leaderBond;
        if (score > bestScore) {
          bestScore = score;
          best = { memberId, from, to, leaderBond, avgAlly };
        }
      }
    }
    if (!best) return { eligible: false };

    const roster = state.roster || [];
    const target = roster.find(c => c.id === best.memberId);
    return {
      eligible: true,
      targetId: best.memberId,
      targetName: target ? target.name : '???',
      fromFactionId: best.from.id,
      toFactionId: best.to.id,
      fromFactionName: best.from.name,
      toFactionName: best.to.name,
      fromLeaderId: best.from.leaderId,
      toLeaderId: best.to.leaderId,
    };
  },

  // ── §9.5 F05 派閥内亀裂 ──
  // 「忠誠型派閥・メンバー5+・リーダー bond<35の不満分子2+・不満分子相互 bond 60+」
  checkF05Conditions(state) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const roster = state.roster || [];

    let best = null;
    for (const f of factions) {
      if (this._isHostile(f)) continue; // 忠誠型のみ
      if (f.status === 'hiatus') continue; // 活動休止派閥は除外
      if (f.memberIds.length < cfg.f05MinFactionSize) continue;
      const key = this._f05Key(f.id);
      if (!this._isCooldownReady(state, key, cfg.eventCooldown.F05)) continue;

      // 不満分子: リーダー以外、リーダーへの bond が閾値未満
      const dissidents = f.memberIds
        .filter(id => id !== f.leaderId)
        .filter(id => this._getBond(state, id, f.leaderId) < cfg.f05DissidentBondMaxThreshold);
      if (dissidents.length < cfg.f05DissidentMinCount) continue;

      // 不満分子同士の bond が閾値以上のペアがあるか → ペア参加者を集める
      const clique = new Set();
      for (let i = 0; i < dissidents.length; i++) {
        for (let j = i + 1; j < dissidents.length; j++) {
          const b1 = this._getBond(state, dissidents[i], dissidents[j]);
          const b2 = this._getBond(state, dissidents[j], dissidents[i]);
          if ((b1 + b2) / 2 >= cfg.f05DissidentCliqueBondThreshold) {
            clique.add(dissidents[i]);
            clique.add(dissidents[j]);
          }
        }
      }
      if (clique.size < cfg.f05DissidentMinCount) continue;

      const cliqueIds = [...clique];
      // 首謀者 = clique 内 OVR 最上位
      cliqueIds.sort((a, b) => {
        const ca = roster.find(c => c.id === a);
        const cb = roster.find(c => c.id === b);
        return (cb ? Engine.util.ov(cb) : 0) - (ca ? Engine.util.ov(ca) : 0);
      });
      const ringleaderId = cliqueIds[0];
      best = { faction: f, dissidentIds: cliqueIds, ringleaderId };
      break; // 1件ずつ
    }
    if (!best) return { eligible: false };

    const leader = roster.find(c => c.id === best.faction.leaderId);
    const ringleader = roster.find(c => c.id === best.ringleaderId);
    return {
      eligible: true,
      factionId: best.faction.id,
      factionName: best.faction.name,
      leaderId: best.faction.leaderId,
      leaderName: leader ? leader.name : '???',
      dissidentIds: best.dissidentIds,
      ringleaderId: best.ringleaderId,
      ringleaderName: ringleader ? ringleader.name : '???',
    };
  },

  // ── §9.6 F06 和解の兆し ──
  // 「抗争中派閥・両方向対立度平均<25・8週継続」
  // G.factionReconciliationStreak に週カウントを貯める
  checkF06Conditions(state) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const streaks = state.factionReconciliationStreak || {};

    let best = null;
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const A = factions[i], B = factions[j];
        if (!this._isHostile(A) || !this._isHostile(B)) continue;
        const hAB = (state.factionHostility || {})[this._hostKey(A.id, B.id)] || 0;
        const hBA = (state.factionHostility || {})[this._hostKey(B.id, A.id)] || 0;
        const avg = (hAB + hBA) / 2;
        if (avg >= cfg.f06HostilityMaxAverage) continue;

        const pairKey = this._sortedPairKey(A.id, B.id);
        const streak = streaks[pairKey] || 0;
        if (streak < cfg.f06StreakWeeks) continue;

        const cdKey = this._f06Key(A.id, B.id);
        if (!this._isCooldownReady(state, cdKey, cfg.eventCooldown.F06)) continue;

        if (!best || streak > best.streak) best = { A, B, streak };
      }
    }
    if (!best) return { eligible: false };
    return {
      eligible: true,
      factionAId: best.A.id,
      factionBId: best.B.id,
      factionAName: best.A.name,
      factionBName: best.B.name,
      leaderAId: best.A.leaderId,
      leaderBId: best.B.leaderId,
    };
  },

  // ── §9.6 streak 更新（週次で呼び出す）──
  updateF06Streaks(state) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const streaks = { ...(state.factionReconciliationStreak || {}) };
    const validKeys = new Set();
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const A = factions[i], B = factions[j];
        if (!this._isHostile(A) || !this._isHostile(B)) continue;
        const hAB = (state.factionHostility || {})[this._hostKey(A.id, B.id)] || 0;
        const hBA = (state.factionHostility || {})[this._hostKey(B.id, A.id)] || 0;
        const avg = (hAB + hBA) / 2;
        const pairKey = this._sortedPairKey(A.id, B.id);
        if (avg < cfg.f06HostilityMaxAverage) {
          streaks[pairKey] = (streaks[pairKey] || 0) + 1;
          validKeys.add(pairKey);
        } else {
          if (streaks[pairKey]) delete streaks[pairKey];
        }
      }
    }
    // 抗争解消した派閥ペアのキーは消す
    for (const key of Object.keys(streaks)) {
      if (!validKeys.has(key)) delete streaks[key];
    }
    return { ...state, factionReconciliationStreak: streaks };
  },

  // ── §9.11 F02④ endless streak 更新（週次、両方向hostility平均≥55を連続カウント） ──
  updateF02EndlessStreaks(state) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const streaks = { ...(state.factionEndlessStreak || {}) };
    const validKeys = new Set();
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const A = factions[i], B = factions[j];
        if (!this._isHostile(A) || !this._isHostile(B)) continue;
        const hAB = (state.factionHostility || {})[this._hostKey(A.id, B.id)] || 0;
        const hBA = (state.factionHostility || {})[this._hostKey(B.id, A.id)] || 0;
        const avg = (hAB + hBA) / 2;
        const pairKey = this._sortedPairKey(A.id, B.id);
        if (avg >= cfg.f02EndlessHostilityMinAverage) {
          streaks[pairKey] = (streaks[pairKey] || 0) + 1;
          validKeys.add(pairKey);
        } else {
          if (streaks[pairKey]) delete streaks[pairKey];
        }
      }
    }
    for (const key of Object.keys(streaks)) {
      if (!validKeys.has(key)) delete streaks[key];
    }
    return { ...state, factionEndlessStreak: streaks };
  },

  // ── §9.11 F02④ endless 発火条件チェック ──
  _f02EndlessKey(fAId, fBId) { return `F02E:${this._sortedPairKey(fAId, fBId)}`; },
  checkF02EndlessCondition(state) {
    const cfg = FACTION_CONFIG;
    const streaks = state.factionEndlessStreak || {};
    const factions = state.factions || [];
    const roster = state.roster || [];
    for (const [pairKey, weekCount] of Object.entries(streaks)) {
      if (weekCount < cfg.f02EndlessStreakWeeks) continue;
      const [idAStr, idBStr] = pairKey.split('|');
      const idA = Number(idAStr), idB = Number(idBStr);
      const facA = factions.find(f => f.id === idA);
      const facB = factions.find(f => f.id === idB);
      if (!facA || !facB) continue;
      if (!this._isHostile(facA) || !this._isHostile(facB)) continue;
      const cdKey = this._f02EndlessKey(idA, idB);
      if (!this._isCooldownReady(state, cdKey, cfg.f02EndlessCooldown)) continue;
      const leaderA = roster.find(c => c.id === facA.leaderId);
      const leaderB = roster.find(c => c.id === facB.leaderId);
      return {
        eligible: true,
        factionAId: idA, factionBId: idB,
        factionAName: facA.name, factionBName: facB.name,
        leaderAId: facA.leaderId, leaderBId: facB.leaderId,
        leaderAName: leaderA ? leaderA.name : '???',
        leaderBName: leaderB ? leaderB.name : '???',
        weeksContinued: weekCount,
      };
    }
    return { eligible: false };
  },

  // ── §9.11 F02④ endless 結果適用（UI "続ける" で実効）──
  applyF02EndlessResult(state, payload, rng) {
    if (!payload) return { state, resultText: '' };
    const { factionAId, factionBId, factionAName, factionBName } = payload;
    let s = state;
    const factions = s.factions || [];
    const facA = factions.find(f => f.id === factionAId);
    const facB = factions.find(f => f.id === factionBId);
    if (!facA || !facB) return { state: s, resultText: '' };

    // CD マーク
    s = this._markCooldown(s, this._f02EndlessKey(factionAId, factionBId));

    // 両派閥メンバーに mentalCoeff -0.02（cap あり）
    const affectedIds = new Set([...facA.memberIds, ...facB.memberIds]);
    const roster = (s.roster || []).map(c => {
      if (!affectedIds.has(c.id)) return c;
      const cur = typeof c.mentalCoeff === 'number' ? c.mentalCoeff : 1.0;
      const next = Math.max(0.85, cur - 0.02);
      return { ...c, mentalCoeff: next };
    });
    s = { ...s, roster };

    // factionTimeline に ENDLESS エントリ追記
    if (Array.isArray(s.factionTimeline)) {
      s = {
        ...s,
        factionTimeline: [
          ...s.factionTimeline,
          {
            type: 'F02_ENDLESS',
            season: s.season, week: s.week,
            factionAId, factionBId,
            weeksContinued: payload.weeksContinued,
          },
        ],
      };
    }

    // streak カウンタリセット（次の52週を再カウント）
    if (s.factionEndlessStreak) {
      const updated = { ...s.factionEndlessStreak };
      delete updated[this._sortedPairKey(factionAId, factionBId)];
      s = { ...s, factionEndlessStreak: updated };
    }

    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] F02 endless triggered: ${factionAName} vs ${factionBName} (${payload.weeksContinued}週)`);
    }

    return {
      state: s,
      resultText: `「${factionAName}」と「${factionBName}」の抗争は、もはや決着の気配すら見せない。終わらない戦いが、団体の空気を重くしていく。`,
    };
  },

  // ── §9.11 F02① ignite 検出: 興行カードに両リーダーの試合が組まれているか ──
  // 返り値: { eligible: true, payload } | { eligible: false }
  checkF02IgniteTrigger(state, showCard) {
    const pi = state.factionPendingIgnite;
    if (!pi) return { eligible: false };
    if (!Array.isArray(showCard) || showCard.length === 0) return { eligible: false };
    const { leaderAId, leaderBId } = pi;
    // showCard には left/right (シングル) と teamA/teamB (タッグ) が混在。ここではシングルのみ判定。
    const hit = showCard.some(m => {
      if (!m || m.matchType === 'tag') return false;
      return (m.left === leaderAId && m.right === leaderBId) ||
             (m.left === leaderBId && m.right === leaderAId);
    });
    if (!hit) return { eligible: false };
    const factions = state.factions || [];
    const roster = state.roster || [];
    const facA = factions.find(f => f.id === pi.factionAId);
    const facB = factions.find(f => f.id === pi.factionBId);
    if (!facA || !facB) return { eligible: false };
    const hAB = (state.factionHostility || {})[this._hostKey(facA.id, facB.id)] || 0;
    const hBA = (state.factionHostility || {})[this._hostKey(facB.id, facA.id)] || 0;
    const membersA = facA.memberIds.map(id => (roster.find(c => c.id === id) || {}).name).filter(Boolean);
    const membersB = facB.memberIds.map(id => (roster.find(c => c.id === id) || {}).name).filter(Boolean);
    return {
      eligible: true,
      payload: {
        factionAId: facA.id, factionBId: facB.id,
        leaderAId, leaderBId,
        leaderAName: (roster.find(c => c.id === leaderAId) || {}).name || '???',
        leaderBName: (roster.find(c => c.id === leaderBId) || {}).name || '???',
        factionAName: facA.name, factionBName: facB.name,
        hostilityA: hAB, hostilityB: hBA,
        membersA, membersB,
      },
    };
  },

  // ── §9.11 F02① ignite 結果適用（UI "続ける" で実効）──
  applyF02IgniteResult(state, payload, rng) {
    if (!payload) return { state, resultText: '' };
    const { factionAId, factionBId, factionAName, factionBName } = payload;
    let s = state;
    const factions = s.factions || [];
    const facA = factions.find(f => f.id === factionAId);
    const facB = factions.find(f => f.id === factionBId);
    if (!facA || !facB) return { state: s, resultText: '' };

    // hostility +12 両方向（火種が公式戦になって悪化）
    s = this.applyHostilityChange(s, facA.id, facB.id, 12);
    s = this.applyHostilityChange(s, facB.id, facA.id, 12);

    // factionTimeline に IGNITE エントリ追記
    if (Array.isArray(s.factionTimeline)) {
      s = {
        ...s,
        factionTimeline: [
          ...s.factionTimeline,
          {
            type: 'F02_IGNITE',
            season: s.season, week: s.week,
            factionAId, factionBId,
          },
        ],
      };
    }

    // 発火予約を消費（どちらのケースでも1回限り）
    const { factionPendingIgnite: _, ...rest } = s;
    s = rest;

    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] F02 ignite fired: ${factionAName} vs ${factionBName}`);
    }

    return {
      state: s,
      resultText: `${factionAName}と${factionBName}の火種は、ついにリングで燃え上がる。`,
    };
  },

  // ── §9.11 F02② peace 期限切れ watch を一掃（management.js パイプライン用） ──
  sweepF02PeaceWatches(state) {
    const watches = Array.isArray(state.f02MediationWatches) ? state.f02MediationWatches : [];
    if (watches.length === 0) return state;
    const now = this._absWeek(state);
    const kept = watches.filter(w => !(typeof w.deadlineWeek === 'number' && now > w.deadlineWeek));
    if (kept.length === watches.length) return state;
    return { ...state, f02MediationWatches: kept };
  },

  // ── §9.11 F02② peace 発火条件チェック（pickWeeklyEvent 用、純粋関数） ──
  // 条件: hostility 両方向とも base から -20 以上減衰 + state.lockerRoomMorale >= 55
  // 返り値: { eligible: bool, payload? }
  checkF02PeaceConditions(state) {
    const watches = Array.isArray(state.f02MediationWatches) ? state.f02MediationWatches : [];
    if (watches.length === 0) return { eligible: false };
    const morale = typeof state.lockerRoomMorale === 'number' ? state.lockerRoomMorale : 60;
    if (morale < 55) return { eligible: false };
    const factions = state.factions || [];
    const roster = state.roster || [];
    for (const w of watches) {
      const facA = factions.find(f => f.id === w.factionAId);
      const facB = factions.find(f => f.id === w.factionBId);
      if (!facA || !facB) continue;
      const hAB = (state.factionHostility || {})[this._hostKey(facA.id, facB.id)] || 0;
      const hBA = (state.factionHostility || {})[this._hostKey(facB.id, facA.id)] || 0;
      const dropAB = w.baseHostilityAB - hAB;
      const dropBA = w.baseHostilityBA - hBA;
      if (dropAB >= 20 && dropBA >= 20) {
        return {
          eligible: true,
          payload: {
            factionAId: facA.id, factionBId: facB.id,
            leaderAId: w.leaderAId, leaderBId: w.leaderBId,
            leaderAName: (roster.find(c => c.id === w.leaderAId) || {}).name || '???',
            leaderBName: (roster.find(c => c.id === w.leaderBId) || {}).name || '???',
            factionAName: facA.name, factionBName: facB.name,
          },
        };
      }
    }
    return { eligible: false };
  },

  // ── §9.11 F02② peace 結果適用（UI "続ける" で実効）──
  applyF02PeaceResult(state, payload, rng) {
    if (!payload) return { state, resultText: '' };
    const { factionAId, factionBId, leaderAId, leaderBId, factionAName, factionBName } = payload;
    let s = state;
    const factions = s.factions || [];
    const facA = factions.find(f => f.id === factionAId);
    const facB = factions.find(f => f.id === factionBId);
    if (!facA || !facB) return { state: s, resultText: '' };

    // hostility -40 両方向
    s = this.applyHostilityChange(s, facA.id, facB.id, -40);
    s = this.applyHostilityChange(s, facB.id, facA.id, -40);
    // momentum = 0 リセット
    s = this.applyMomentumChange(s, facA.id, -facA.momentum);
    s = this.applyMomentumChange(s, facB.id, -facB.momentum);
    // inHostility を解除（冷戦終結）
    s = {
      ...s,
      factions: (s.factions || []).map(f => {
        if (f.id === factionAId || f.id === factionBId) return { ...f, inHostility: false };
        return f;
      }),
    };
    // 両リーダー間 bond +3
    if (leaderAId != null && leaderBId != null) {
      s = this._applyBondDirected(s, leaderAId, leaderBId, 3);
      s = this._applyBondDirected(s, leaderBId, leaderAId, 3);
    }

    // 対応する watch を削除
    if (Array.isArray(s.f02MediationWatches)) {
      const pairKey = this._sortedPairKey(factionAId, factionBId);
      const kept = s.f02MediationWatches.filter(w => this._sortedPairKey(w.factionAId, w.factionBId) !== pairKey);
      s = { ...s, f02MediationWatches: kept };
    }

    if (Array.isArray(s.factionTimeline)) {
      s = {
        ...s,
        factionTimeline: [
          ...s.factionTimeline,
          {
            type: 'F02_PEACE',
            season: s.season, week: s.week,
            factionAId, factionBId,
          },
        ],
      };
    }

    if (typeof console !== 'undefined') {
      console.log(`[WM Faction] F02 peace fired: ${factionAName} vs ${factionBName}`);
    }

    return {
      state: s,
      resultText: `${factionAName}と${factionBName}の対立は、社長の仲裁によって沈静化した。まだ完全な和解ではないが、互いに矛を収める段階に入った。`,
    };
  },

  // ── §9.11 F02① ignite 期限切れ: 4週経過しても興行が挟まれなければ失効 ──
  expireF02PendingIgnite(state) {
    const pi = state.factionPendingIgnite;
    if (!pi) return state;
    const now = this._absWeek(state);
    if (typeof pi.expireWeek === 'number' && now > pi.expireWeek) {
      const { factionPendingIgnite: _, ...rest } = state;
      if (typeof console !== 'undefined') {
        console.log(`[WM Faction] F02 pending ignite expired (${pi.factionAName} vs ${pi.factionBName})`);
      }
      return rest;
    }
    return state;
  },

  // ── §9.7 F07 派閥動向（v0.4 共通フレーム化）──
  // チーム全体 12 週 CD + 派閥個別 36 週 CD + テンションスコア重み付き抽選 + アーキタイプ × incidentType マトリクス
  checkF07Conditions(state, rng) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const roster = state.roster || [];
    const now = this._absWeek(state);

    // チーム全体 CD（12 週）
    const teamUntil = state._f07TeamCooldownUntil || 0;
    if (now < teamUntil) return { eligible: false };

    // 候補派閥抽出
    const candidates = [];
    for (const f of factions) {
      if (!f.archetypeId) continue;
      const leader = roster.find(c => c.id === f.leaderId);
      if (!leader) continue;
      const leaderTrust = leader.trust != null ? leader.trust : 50;
      if (leaderTrust < cfg.f07TrustMinThreshold) continue;
      // 派閥個別 CD（36 週）
      const recents = f._f07RecentIncidents || [];
      const lastWeek = recents.length ? recents[recents.length - 1].week : -Infinity;
      if (now - lastWeek < cfg.f07FactionCooldown) continue;
      // B 4 回累積後の post-rebuke quiet（24 週）
      const postRebukeUntil = f._f07PostRebukeQuietUntil || 0;
      if (now < postRebukeUntil) continue;

      const bias = (cfg.f07ArchetypeBias[f.archetypeId] != null) ? cfg.f07ArchetypeBias[f.archetypeId] : 0;
      const weeksSince = (lastWeek === -Infinity) ? 200 : (now - lastWeek);
      const tensionScore = Math.max(1, leaderTrust * 0.3 + weeksSince * 0.5 + bias);
      candidates.push({ faction: f, leader, tensionScore });
    }

    if (!candidates.length) return { eligible: false };

    // テンションスコア重み付き抽選
    const totalScore = candidates.reduce((s, c) => s + c.tensionScore, 0);
    let pick = Engine.rng.float(rng) * totalScore;
    let chosen = candidates[0];
    for (const c of candidates) {
      pick -= c.tensionScore;
      if (pick <= 0) { chosen = c; break; }
    }

    const faction = chosen.faction;
    const leader = chosen.leader;
    const recents = faction._f07RecentIncidents || [];
    const recentTypes = recents.slice(-cfg.f07RecentIncidentKeep).map(r => r.incidentType);
    const demandQuietUntil = faction._f07DemandQuietUntil || 0;
    const demandMoneyQuietUntil = faction._f07DemandMoneyQuietUntil || 0;

    // incidentType 抽選（マトリクスから連続出現禁止 + サブ CD を除外）
    const matrix = cfg.f07IncidentMatrix[faction.archetypeId] || {};
    const entries = Object.entries(matrix).filter(([type, _]) => {
      if (recentTypes.includes(type)) return false;
      if (type.startsWith('DEMAND_') && now < demandQuietUntil) return false;
      if (type === 'DEMAND_MONEY' && now < demandMoneyQuietUntil) return false;
      return true;
    });
    if (!entries.length) return { eligible: false };
    const matrixTotal = entries.reduce((s, [_, w]) => s + w, 0);
    let mp = Engine.rng.float(rng) * matrixTotal;
    let incidentType = entries[0][0];
    for (const [type, w] of entries) {
      mp -= w;
      if (mp <= 0) { incidentType = type; break; }
    }

    const modalShape = incidentType.startsWith('INCIDENT_') ? 'choice2' : 'choice3';

    // incidentPayload: 簡易版対象選定
    const incidentPayload = this._selectF07IncidentPayload(state, faction, incidentType, rng);

    return {
      eligible: true,
      factionId: faction.id,
      factionName: faction.name,
      leaderId: faction.leaderId,
      leaderName: leader.name,
      archetypeId: faction.archetypeId,
      incidentType,
      incidentPayload,
      modalShape,
    };
  },

  // ── F07 v0.4 incidentPayload 簡易対象選定 ──
  _selectF07IncidentPayload(state, faction, incidentType, rng) {
    const roster = state.roster || [];
    const memberSet = new Set(faction.memberIds);
    const nonMembers = roster.filter(c => !memberSet.has(c.id));
    const rels = state.relationships || {};
    const leaderId = faction.leaderId;

    const pickRivalryHigh = () => {
      if (!nonMembers.length) return null;
      const scored = nonMembers.map(c => {
        const rec = rels[`${leaderId}>${c.id}`];
        const r = rec ? (rec.rivalry || 0) : 0;
        return { c, score: r + Engine.rng.float(rng) * 20 };
      }).sort((a, b) => b.score - a.score);
      return scored[0] ? scored[0].c : null;
    };

    if (incidentType === 'OBSERVE_RIVAL_HEAT' || incidentType === 'INCIDENT_BOUNDARY') {
      const t = pickRivalryHigh();
      return t ? { targetId: t.id, targetName: t.name } : {};
    }
    if (incidentType === 'OBSERVE_INTERNAL_RANK') {
      // 派閥内 OVR 上位 2 名（リーダー除く）
      const members = faction.memberIds
        .filter(id => id !== leaderId)
        .map(id => roster.find(c => c.id === id))
        .filter(Boolean)
        .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
        .slice(0, 2);
      return {
        targetIds: members.map(c => c.id),
        targetNames: members.map(c => c.name),
      };
    }
    if (incidentType === 'OBSERVE_FAN_PRESSURE') {
      // リーダー本人
      return { targetId: leaderId };
    }
    if (incidentType === 'OBSERVE_TRAINING_HARD') {
      // 派閥メンバー全員（リーダー除く）
      const ids = faction.memberIds.filter(id => id !== leaderId);
      return { targetIds: ids };
    }
    return {};
  },

  // F07 v0.4: 直近 incidentType 履歴 + チーム CD + 派閥 CD を更新
  _markF07Trigger(state, factionId, incidentType) {
    const cfg = FACTION_CONFIG;
    const now = this._absWeek(state);
    const newTeamCD = now + cfg.f07TeamCooldown;
    const updatedFactions = (state.factions || []).map(f => {
      if (f.id !== factionId) return f;
      const recents = (f._f07RecentIncidents || []).slice();
      recents.push({ incidentType, week: now });
      const trimmed = recents.slice(-Math.max(cfg.f07RecentIncidentKeep, 4));
      const next = { ...f, _f07RecentIncidents: trimmed };
      if (incidentType.startsWith('DEMAND_')) {
        next._f07DemandQuietUntil = now + cfg.f07DemandSubCooldown;
      }
      if (incidentType === 'DEMAND_MONEY') {
        next._f07DemandMoneyQuietUntil = now + cfg.f07DemandMoneyCooldown;
      }
      return next;
    });
    // 旧来のキー単位 CD も互換維持で marker は残す
    let s = { ...state, factions: updatedFactions, _f07TeamCooldownUntil: newTeamCD };
    s = this._markCooldown(s, this._f07Key(factionId));
    return s;
  },

  // ── §9.8 F08 対立ヒートアップ ──
  // 「抗争中派閥・片方向 hostility 80+」
  checkF08Conditions(state) {
    const cfg = FACTION_CONFIG;
    const factions = state.factions || [];
    const roster = state.roster || [];
    let best = null;
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const A = factions[i], B = factions[j];
        if (!this._isHostile(A) || !this._isHostile(B)) continue;
        const hAB = (state.factionHostility || {})[this._hostKey(A.id, B.id)] || 0;
        const hBA = (state.factionHostility || {})[this._hostKey(B.id, A.id)] || 0;
        const peak = Math.max(hAB, hBA);
        if (peak < cfg.f08HostilityMinThreshold) continue;
        const cdKey = this._f08Key(A.id, B.id);
        if (!this._isCooldownReady(state, cdKey, cfg.eventCooldown.F08)) continue;
        // リーダーが両方 roster にいること
        const lA = roster.find(c => c.id === A.leaderId);
        const lB = roster.find(c => c.id === B.leaderId);
        if (!lA || !lB) continue;
        if (!best || peak > best.peak) best = { A, B, peak, lA, lB };
      }
    }
    if (!best) return { eligible: false };
    return {
      eligible: true,
      factionAId: best.A.id,
      factionBId: best.B.id,
      factionAName: best.A.name,
      factionBName: best.B.name,
      leaderAId: best.A.leaderId,
      leaderBId: best.B.leaderId,
      leaderAName: best.lA.name,
      leaderBName: best.lB.name,
      hostilityPeak: Math.round(best.peak),
    };
  },

  // ══════════════════════════════════════════════════════════
  //  Phase 3b: F04-F08 適用関数
  // ══════════════════════════════════════════════════════════

  // ── §9.4 F04 寝返り 選択適用 ──
  // A: 放置（転籍）/ B: 面談 / C: 告げ口
  applyF04Choice(state, payload, choiceId, rng) {
    const { targetId, targetName, fromFactionId, toFactionId, fromLeaderId, fromFactionName, toFactionName } = payload;
    let s = state;
    const cdKey = this._f04Key(targetId, toFactionId);
    s = this._markCooldown(s, cdKey);

    if (choiceId === 'A') {
      // 対象選手を敵対派閥へ転籍
      s = {
        ...s,
        factions: (s.factions || []).map(f => {
          if (f.id === fromFactionId) return { ...f, memberIds: f.memberIds.filter(id => id !== targetId) };
          if (f.id === toFactionId && !f.memberIds.includes(targetId)) return { ...f, memberIds: [...f.memberIds, targetId] };
          return f;
        }),
      };
      // 元派閥メンバー trust -3〜-6
      const fromFaction = (s.factions || []).find(f => f.id === fromFactionId);
      if (fromFaction) {
        const d = -(3 + Math.floor(Engine.rng.float(rng) * 4));
        s = this._applyTrustToMembers(s, fromFaction.memberIds, d);
      }
      // 勢い変動
      const fromBump = -(15 + Math.floor(Engine.rng.float(rng) * 11));
      const toBump = 15 + Math.floor(Engine.rng.float(rng) * 11);
      s = this.applyMomentumChange(s, fromFactionId, fromBump);
      s = this.applyMomentumChange(s, toFactionId, toBump);
      // 対立度（元派閥→敵対派閥）+15〜+20
      const hostBump = 15 + Math.floor(Engine.rng.float(rng) * 6);
      s = this.applyHostilityChange(s, fromFactionId, toFactionId, hostBump);
      if (typeof console !== 'undefined') console.log(`[WM Faction] F04 defection: ${targetName} ${fromFactionName} → ${toFactionName}`);
      return { state: s, resultText: `${targetName}は${toFactionName}へ移っていった。${fromFactionName}の空気は凍りついている。` };
    }
    if (choiceId === 'B') {
      // 対象 trust +5、一時回避（12週後再判定）
      s = this._applyTrustToMembers(s, [targetId], 5);
      return { state: s, resultText: `${targetName}との面談で、迷いは一旦収まった。` };
    }
    // 'C' 告げ口
    s = this._applyTrustToMembers(s, [targetId], -(5 + Math.floor(Engine.rng.float(rng) * 4)));
    // 対象→リーダー rivalry +10〜+15
    if (s.relationships) {
      const key = `${targetId}>${fromLeaderId}`;
      const rec = s.relationships[key];
      if (rec) {
        const d = 10 + Math.floor(Engine.rng.float(rng) * 6);
        const newRec = { ...rec, rivalry: Engine.util.clamp(rec.rivalry + d, 0, 100) };
        s = { ...s, relationships: { ...s.relationships, [key]: newRec } };
      }
    }
    // 派閥内に火種（tensionTag を立てる: F05 検出確率を上げる指標）
    s = {
      ...s,
      factions: (s.factions || []).map(f => f.id === fromFactionId ? { ...f, tensionTag: true } : f),
    };
    return { state: s, resultText: `${targetName}の動きはリーダーの知るところとなった。${fromFactionName}の内側に、新たな火種が燻る。` };
  },

  // ── §9.5 F05 派閥内亀裂 選択適用 ──
  // A: 助言（60%で回避）/ B: 分裂（即時） / C: 静観（70%で自然分裂）
  // v2 改訂: 社長は派閥の内紛に介入しない（特定派閥の肩を持つ＝他派閥の信頼を損なう）。
  // UI 側は選択肢なしの「見守る」1 ボタンのみ。ここでは choiceId を無視し、
  // 旧 'C 静観' の挙動（70% 自然分裂 / 30% 据え置き）を単一パスとして適用する。
  applyF05Choice(state, payload, choiceId, rng) {
    const { factionId, factionName, dissidentIds, ringleaderId, ringleaderName } = payload;
    let s = state;
    const cdKey = this._f05Key(factionId);
    s = this._markCooldown(s, cdKey);

    const roster = s.roster || [];
    if (Engine.rng.float(rng) < 0.70) {
      // 自然分裂
      s = {
        ...s,
        factions: (s.factions || []).map(f => f.id === factionId
          ? { ...f, memberIds: f.memberIds.filter(id => !dissidentIds.includes(id)) }
          : f),
      };
      const ringleader = roster.find(c => c.id === ringleaderId);
      if (ringleader) s = this.createFaction(s, ringleaderId, dissidentIds, { type: 'loyal' });
      if (typeof console !== 'undefined') console.log(`[WM Faction] F05 split (natural): ${factionName} → ${ringleaderName}組 (${dissidentIds.length} members)`);
      return { state: s, resultText: `見守るうち、${factionName}は自然に割れた。${ringleaderName}が旗を掲げる。` };
    }
    return { state: s, resultText: `${factionName}の亀裂は、とりあえず破裂には至らなかった。` };
  },

  // ── §9.6 F06 和解の兆し 選択適用（v2 改訂：2択）──
  // A: そっと結束を後押しする（コストなし、敵対度 -15〜-25、両リーダー trust +3〜+5、bond +3〜+5）
  // B: 何もしない（介入なし、自然減衰に任せる）
  // 旧 C「煽る」は廃止。旧 A の「和解興行コスト100万」も廃止。
  applyF06Choice(state, payload, choiceId, rng) {
    const { factionAId, factionBId, factionAName, factionBName } = payload;
    let s = state;
    const cdKey = this._f06Key(factionAId, factionBId);
    s = this._markCooldown(s, cdKey);

    if (choiceId === 'A') {
      const d = -(15 + Math.floor(Engine.rng.float(rng) * 11));
      s = this.applyHostilityChange(s, factionAId, factionBId, d);
      s = this.applyHostilityChange(s, factionBId, factionAId, d);
      // 派閥間 bond +3〜+5
      const A = (s.factions || []).find(f => f.id === factionAId);
      const B = (s.factions || []).find(f => f.id === factionBId);
      if (A && B && s.relationships) {
        const bd = 3 + Math.floor(Engine.rng.float(rng) * 3);
        let rels = { ...s.relationships };
        for (const a of A.memberIds) for (const b of B.memberIds) {
          const kAB = `${a}>${b}`, kBA = `${b}>${a}`;
          if (rels[kAB]) rels[kAB] = { ...rels[kAB], bond: Engine.util.clamp(rels[kAB].bond + bd, 0, 100) };
          if (rels[kBA]) rels[kBA] = { ...rels[kBA], bond: Engine.util.clamp(rels[kBA].bond + bd, 0, 100) };
        }
        s = { ...s, relationships: rels };
      }
      // 両リーダー trust +3〜+5
      const payloadLeaderA = payload.leaderAId, payloadLeaderB = payload.leaderBId;
      const tA = 3 + Math.floor(Engine.rng.float(rng) * 3);
      const tB = 3 + Math.floor(Engine.rng.float(rng) * 3);
      if (payloadLeaderA) s = this._applyTrustToMembers(s, [payloadLeaderA], tA);
      if (payloadLeaderB) s = this._applyTrustToMembers(s, [payloadLeaderB], tB);
      return { state: s, resultText: `強ばっていた視線が、静かにほどけた。${factionAName}と${factionBName}は、距離を取り戻し始めている。` };
    }
    // 'B' 何もしない（介入なし・自然減衰は外部 tick に任せる）
    return { state: s, resultText: `社長は手を出さなかった。和解の兆しは、時間に委ねられた。` };
  },

  // ── §9.7 F07 派閥動向 選択適用（v0.4 共通フレーム化）──
  // incidentType × choice で分岐。impactSummary を返り値に含めて結果モーダル新シグネチャに連携
  applyF07Choice(state, payload, choiceId, rng) {
    const { factionId, factionName, leaderId, leaderName, archetypeId, incidentType, incidentPayload } = payload;
    const cfg = FACTION_CONFIG;
    const ri = (lo, hi) => lo + Math.floor(Engine.rng.float(rng) * (hi - lo + 1));

    let s = state;
    // チーム CD + 派閥 CD + 直近履歴を更新
    s = this._markF07Trigger(s, factionId, incidentType || 'LEGACY');

    const roster = s.roster || [];
    const faction = (s.factions || []).find(f => f.id === factionId);
    if (!faction) return { state: s, resultText: '', impactSummary: [] };

    // 互換: incidentType 未設定の場合は旧 3 択挙動（DEMAND_ABSTRACT 相当）にマッピング
    const itype = incidentType || 'DEMAND_ABSTRACT';

    const nonMemberIds = () => roster.filter(c => !faction.memberIds.includes(c.id)).map(c => c.id);
    const memberIds = () => faction.memberIds.slice();
    const memberIdsExLeader = () => faction.memberIds.filter(id => id !== leaderId);

    // rebukeCount を進める共通処理（4 累積で AUTHORITY のみ authoritativeTag 剥がし + 24 週 quiet）
    const advanceRebuke = (st) => {
      let inner = st;
      inner = {
        ...inner,
        factions: inner.factions.map(f => {
          if (f.id !== factionId) return f;
          const newCount = (f.f07RebukeCount || 0) + 1;
          if (newCount >= cfg.f07RebukeMaxCount) {
            if (typeof console !== 'undefined') console.log(`[WM Faction] F07 rebuke threshold reached: ${factionName} (archetype=${f.archetypeId})`);
            const next = { ...f, f07RebukeCount: 0 };
            if (f.archetypeId === 'AUTHORITY') next.authoritativeTag = false;
            next._f07PostRebukeQuietUntil = this._absWeek(inner) + cfg.f07PostRebukeQuiet;
            return next;
          }
          return { ...f, f07RebukeCount: newCount };
        }),
      };
      return inner;
    };

    const impactSummary = [];
    let resultText = '';

    // ─── 要求型 ───────────────────────────────────────
    if (itype === 'DEMAND_MAIN') {
      if (choiceId === 'A') {
        // 派閥メンバー trust +3〜+5、メインカード提案フラグ立て（Phase C で消化）
        const d = ri(3, 5);
        s = this._applyTrustToMembers(s, memberIds(), d);
        s = { ...s, _pendingF07Directive: { factionId, type: 'DEMAND_MAIN', expiresAfterShows: 1 } };
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: `+${d}` });
        impactSummary.push({ label: '次回興行メイン提案', delta: `${factionName} 推奨枠` });
        resultText = `${leaderName}の声を受け止め、次の興行のメインカードに${factionName}を推す方針を伝えた。`;
      } else if (choiceId === 'B') {
        // 黙認: リーダー trust -3〜-5、非メンバー trust +2
        const d = -ri(3, 5);
        s = this._applyTrustToMembers(s, [leaderId], d);
        s = this._applyTrustToMembers(s, nonMemberIds(), 2);
        impactSummary.push({ label: `${leaderName} trust`, delta: `${d}` });
        impactSummary.push({ label: '派閥外 trust', delta: '+2' });
        resultText = `${leaderName}の要求は受け流した。${factionName}の中に、薄い不満が漂う。`;
      } else {
        // C 別ルートで応える: 個別ケア
        s = this._applyTrustToMembers(s, [leaderId], -1);
        s = this._applyTrustToMembers(s, memberIdsExLeader(), 2);
        s = advanceRebuke(s);
        impactSummary.push({ label: `${leaderName} trust`, delta: '-1' });
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: '+2' });
        resultText = `${leaderName}の要求そのものには応じず、${factionName}のメンバー一人一人に目を配った。`;
      }
    } else if (itype === 'DEMAND_MONEY') {
      // Phase D まで給与改定は実装せず、trust 変動 + スタブ表記のみ
      if (choiceId === 'A') {
        const d = ri(3, 5);
        s = this._applyTrustToMembers(s, memberIds(), d);
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: `+${d}` });
        impactSummary.push({ label: '給与改定', delta: '次オフ契約交渉で +10% 反映予定' });
        resultText = `${leaderName}と給与の話を交わし、次のオフに反映することを約束した。`;
      } else if (choiceId === 'B') {
        const d = -ri(3, 4);
        s = this._applyTrustToMembers(s, [leaderId], d);
        impactSummary.push({ label: `${leaderName} trust`, delta: `${d}` });
        resultText = `${leaderName}の待遇相談は受け流した。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], -1);
        s = this._applyTrustToMembers(s, memberIdsExLeader(), 1);
        s = advanceRebuke(s);
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: '+1' });
        resultText = `給与の話には触れず、${factionName}のメンバーへの個別ケアで応えた。`;
      }
    } else if (itype === 'DEMAND_ABSTRACT') {
      // 旧 v2.1 と同等。AUTHORITY 限定で dictatorTag 付与
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], 5);
        const dn = -ri(3, 6);
        s = this._applyTrustToMembers(s, nonMemberIds(), dn);
        s = this._applyLockerRoomMorale(s, -ri(3, 5));
        if (faction.archetypeId === 'AUTHORITY') {
          s = { ...s, factions: s.factions.map(f => f.id === factionId ? { ...f, dictatorTag: true } : f) };
          impactSummary.push({ label: `${factionName}`, delta: 'dictatorTag 付与' });
        }
        impactSummary.push({ label: `${leaderName} trust`, delta: '+5' });
        impactSummary.push({ label: '派閥外 trust', delta: `${dn}` });
        resultText = `${leaderName}の権威を認めた。${factionName}の外にいる者たちは、一歩引いて見ている。`;
      } else if (choiceId === 'B') {
        const dl = -ri(8, 12);
        s = this._applyTrustToMembers(s, [leaderId], dl);
        s = this._applyTrustToMembers(s, nonMemberIds(), ri(2, 3));
        s = advanceRebuke(s);
        impactSummary.push({ label: `${leaderName} trust`, delta: `${dl}` });
        resultText = `${leaderName}に正面から釘を刺した。一瞬の沈黙、それから硬い返事。`;
      } else {
        // C 別幹部
        const altExec = memberIdsExLeader()
          .map(id => roster.find(c => c.id === id))
          .filter(Boolean)
          .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
        s = this._applyTrustToMembers(s, [leaderId], -ri(5, 8));
        if (altExec) s = this._applyTrustToMembers(s, [altExec.id], ri(5, 8));
        s = {
          ...s,
          factions: s.factions.map(f => f.id === factionId ? { ...f, authoritativeTag: false, tensionTag: true, f07RebukeCount: 0 } : f),
        };
        impactSummary.push({ label: `${leaderName} trust`, delta: '−' });
        if (altExec) impactSummary.push({ label: `${altExec.name} trust`, delta: '+' });
        resultText = `${leaderName}ではなく別の幹部を重用した。${factionName}の中に、新たな対立軸がくすぶっている。`;
      }
    } else if (itype === 'DEMAND_RECOGNITION') {
      if (choiceId === 'A') {
        const d = ri(3, 5);
        s = this._applyTrustToMembers(s, memberIds(), d);
        s = this._applyLockerRoomMorale(s, ri(1, 2));
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: `+${d}` });
        impactSummary.push({ label: 'ロッカー士気', delta: '+1〜2' });
        resultText = `${factionName}の貢献を、興行の場で言葉にして認めた。`;
      } else if (choiceId === 'B') {
        s = this._applyTrustToMembers(s, [leaderId], -ri(2, 4));
        impactSummary.push({ label: `${leaderName} trust`, delta: '−' });
        resultText = `${leaderName}の評価要求は受け流した。`;
      } else {
        s = advanceRebuke(s);
        s = this._applyTrustToMembers(s, memberIdsExLeader(), 1);
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: '+1' });
        resultText = `表立った評価ではなく、個別の声かけで応えた。`;
      }
    }
    // ─── 観察型 ───────────────────────────────────────
    else if (itype === 'OBSERVE_RIVAL_HEAT') {
      const tName = (incidentPayload && incidentPayload.targetName) || '派閥外の選手';
      const tId = incidentPayload && incidentPayload.targetId;
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -3);
        if (tId) s = this._applyTrustToMembers(s, [tId], 5);
        impactSummary.push({ label: `${leaderName} trust`, delta: '-3' });
        impactSummary.push({ label: `${tName} trust`, delta: '+5' });
        resultText = `${leaderName}に直接話をつけた。${tName}は救われた表情を見せた。`;
      } else if (choiceId === 'B') {
        s = this._applyTrustToMembers(s, [leaderId], 2);
        if (tId) s = this._applyTrustToMembers(s, [tId], -5);
        s = this._applyLockerRoomMorale(s, -3);
        impactSummary.push({ label: `${tName} trust`, delta: '-5' });
        impactSummary.push({ label: 'ロッカー士気', delta: '-3' });
        resultText = `黙認した。${tName}は言葉を呑み込んだ。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], -1);
        if (tId) s = this._applyTrustToMembers(s, [tId], 3);
        s = advanceRebuke(s);
        impactSummary.push({ label: `${tName} trust`, delta: '+3' });
        resultText = `${leaderName}本人ではなく、${tName}の側に静かに声をかけた。`;
      }
    } else if (itype === 'OBSERVE_ABSENCE') {
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -5);
        s = this._applyTrustToMembers(s, memberIdsExLeader(), -2);
        s = this._applyLockerRoomMorale(s, 3);
        impactSummary.push({ label: `${leaderName} trust`, delta: '-5' });
        impactSummary.push({ label: 'ロッカー士気', delta: '+3' });
        resultText = `${leaderName}に練習出席を求めた。${factionName}内には緊張が走った。`;
      } else if (choiceId === 'B') {
        s = this._applyTrustToMembers(s, [leaderId], 3);
        s = this._applyLockerRoomMorale(s, -4);
        impactSummary.push({ label: 'ロッカー士気', delta: '-4' });
        resultText = `黙認した。${factionName}の自由は守られたが、道場の空気は淀んだ。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], -2);
        s = this._applyTrustToMembers(s, nonMemberIds().slice(0, 4), 1);
        s = advanceRebuke(s);
        impactSummary.push({ label: 'コーチ経由ケア', delta: '実施' });
        resultText = `コーチを介して${leaderName}の状態を確かめ、派閥外への目配りも忘れなかった。`;
      }
    } else if (itype === 'OBSERVE_INTERNAL_RANK') {
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -2);
        const targets = (incidentPayload && incidentPayload.targetIds) || memberIdsExLeader().slice(0, 2);
        s = this._applyTrustToMembers(s, targets, 3);
        impactSummary.push({ label: '中位メンバー trust', delta: '+3' });
        resultText = `${factionName}の格付け争いに介入した。`;
      } else if (choiceId === 'B') {
        s = this._applyTrustToMembers(s, [leaderId], 1);
        s = this._applyLockerRoomMorale(s, -2);
        impactSummary.push({ label: 'ロッカー士気', delta: '-2' });
        resultText = `${factionName}内の格付け争いはそのまま続いている。`;
      } else {
        s = advanceRebuke(s);
        impactSummary.push({ label: `${factionName} 結束`, delta: '微増' });
        resultText = `表立った介入はせず、個別に話を聞いた。`;
      }
    } else if (itype === 'OBSERVE_FAN_PRESSURE') {
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -2);
        // condition 回復は character.condition に直接当てる
        const newRoster = (s.roster || []).map(c => c.id === leaderId
          ? { ...c, condition: Engine.util.clamp((c.condition || 50) + 5, 0, 100) }
          : c);
        s = { ...s, roster: newRoster };
        impactSummary.push({ label: `${leaderName} condition`, delta: '+5' });
        resultText = `${leaderName}を一度休ませる判断をした。`;
      } else if (choiceId === 'B') {
        s = this._applyTrustToMembers(s, [leaderId], 2);
        const newRoster = (s.roster || []).map(c => c.id === leaderId
          ? { ...c, condition: Engine.util.clamp((c.condition || 50) - 3, 0, 100) }
          : c);
        s = { ...s, roster: newRoster };
        impactSummary.push({ label: `${leaderName} condition`, delta: '-3' });
        resultText = `${leaderName}に任せた。プレッシャーは肩にのしかかったまま。`;
      } else {
        const newRoster = (s.roster || []).map(c => c.id === leaderId
          ? { ...c, condition: Engine.util.clamp((c.condition || 50) + 3, 0, 100) }
          : c);
        s = { ...s, roster: newRoster };
        s = advanceRebuke(s);
        impactSummary.push({ label: `${leaderName} condition`, delta: '+3' });
        resultText = `直接の指示ではなく、コーチ経由で${leaderName}を支えた。`;
      }
    } else if (itype === 'OBSERVE_TRAINING_HARD') {
      const targets = (incidentPayload && incidentPayload.targetIds) || memberIdsExLeader();
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -3);
        const newRoster = (s.roster || []).map(c => targets.includes(c.id)
          ? { ...c, condition: Engine.util.clamp((c.condition || 50) + 3, 0, 100) }
          : c);
        s = { ...s, roster: newRoster };
        s = this.applyMomentumChange(s, factionId, -2);
        impactSummary.push({ label: `${factionName} condition`, delta: '+3' });
        impactSummary.push({ label: `${factionName} 勢い`, delta: '-2' });
        resultText = `${leaderName}の追い込みを止めた。${factionName}は一息ついた。`;
      } else if (choiceId === 'B') {
        s = this._applyTrustToMembers(s, [leaderId], 2);
        s = this.applyMomentumChange(s, factionId, 3);
        impactSummary.push({ label: `${factionName} 勢い`, delta: '+3' });
        impactSummary.push({ label: '怪我リスク', delta: '上昇' });
        resultText = `${leaderName}の追い込み練習を黙認した。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], -1);
        s = advanceRebuke(s);
        impactSummary.push({ label: 'コーチ経由調整', delta: '実施' });
        resultText = `${leaderName}に直接は触れず、コーチを介して練習量を整えた。`;
      }
    }
    // ─── インシデント型（2 択）─────────────────────────
    else if (itype === 'INCIDENT_BOUNDARY') {
      const tName = (incidentPayload && incidentPayload.targetName) || '派閥外の選手';
      const tId = incidentPayload && incidentPayload.targetId;
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -2);
        if (tId) s = this._applyTrustToMembers(s, [tId], 3);
        s = advanceRebuke(s);
        impactSummary.push({ label: `${tName} trust`, delta: '+3' });
        resultText = `${leaderName}に静かに注意した。${tName}の表情がわずかに緩んだ。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], 1);
        s = this._applyTrustToMembers(s, memberIds(), 2);
        if (tId) s = this._applyTrustToMembers(s, [tId], -3);
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: '+2' });
        impactSummary.push({ label: `${tName} trust`, delta: '-3' });
        resultText = `流した。${factionName}の壁はそのまま残っている。`;
      }
    } else if (itype === 'INCIDENT_BONDING') {
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -1);
        s = this._applyTrustToMembers(s, memberIds(), -1);
        s = this._applyTrustToMembers(s, nonMemberIds(), 2);
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: '-1' });
        impactSummary.push({ label: '派閥外 trust', delta: '+2' });
        resultText = `${factionName}内の固まりを軽くたしなめた。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], 2);
        s = this._applyTrustToMembers(s, memberIds(), 3);
        s = this._applyTrustToMembers(s, nonMemberIds(), -2);
        impactSummary.push({ label: `${factionName} メンバー trust`, delta: '+3' });
        impactSummary.push({ label: '派閥外 trust', delta: '-2' });
        resultText = `${factionName}の結束を見守った。輪の外には少し距離が残った。`;
      }
    } else if (itype === 'INCIDENT_HEEL_PROVOKE') {
      if (choiceId === 'A') {
        s = this._applyTrustToMembers(s, [leaderId], -3);
        s = advanceRebuke(s);
        impactSummary.push({ label: `${leaderName} trust`, delta: '-3' });
        impactSummary.push({ label: '次回興行集客', delta: '一時微減' });
        resultText = `${leaderName}の挑発行為に注意した。`;
      } else {
        s = this._applyTrustToMembers(s, [leaderId], 1);
        impactSummary.push({ label: '次回興行集客', delta: '一時+' });
        resultText = `${leaderName}の挑発を黙って眺めた。客席はざわつきながらも食いついている。`;
      }
    } else {
      // 未対応 incidentType フォールバック
      resultText = `${leaderName}との一件は、社長の判断で収まった。`;
    }

    return { state: s, resultText, impactSummary };
  },

  // ── §9.8 F08 対立ヒートアップ 選択適用（v2 改訂）──
  // A: 直接対決をメインに組む（CD 24 週を立てる）
  // B: 仲裁する（敵対度 80 超では条件未達、UI 側で disabled。到達してもここでは何もしない）
  // C: 煽らず、組まず（熱は持続・CD は立てない → 再判定継続）
  applyF08Choice(state, payload, choiceId, rng) {
    const { factionAId, factionBId, factionAName, factionBName, leaderAId, leaderBId } = payload;
    let s = state;

    if (choiceId === 'A') {
      // CD を立てる
      s = this._markCooldown(s, this._f08Key(factionAId, factionBId));
      // 直接対決 directive を立てる（次興行カード編成で参照）
      s = {
        ...s,
        _pendingF08Directive: {
          factionAId, factionBId,
          leaderAId, leaderBId,
          triggeredSeason: s.season,
          triggeredWeek: s.week,
        },
      };
      if (typeof console !== 'undefined') console.log(`[WM Faction] F08 directive set: ${factionAName} vs ${factionBName}`);
      return { state: s, resultText: `${factionAName}と${factionBName}、両リーダーの直接対決を次興行のメインに据えると決めた。` };
    }
    if (choiceId === 'B') {
      // UI 側で disabled のはずだが、安全弁として no-op（CD も立てない）
      return { state: s, resultText: '' };
    }
    // 'C' 煽らず、組まず — CD を立てずに次週以降も再判定
    return { state: s, resultText: `社長は、この熱に直接触れなかった。煽りもせず、組みもせず。火はしばらく燻り続ける。` };
  },


  // ── relationships 操作ヘルパー ──
  _applyBondDirected(state, fromId, toId, delta) {
    if (!state.relationships) return state;
    const key = `${fromId}>${toId}`;
    const rec = state.relationships[key];
    if (!rec) return state;
    const newRec = { ...rec, bond: Engine.util.clamp(rec.bond + delta, 0, 100) };
    return { ...state, relationships: { ...state.relationships, [key]: newRec } };
  },

  _applyBondBetweenMembers(state, memberIds, delta) {
    if (!state.relationships || memberIds.length < 2) return state;
    let newRels = { ...state.relationships };
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = 0; j < memberIds.length; j++) {
        if (i === j) continue;
        const key = `${memberIds[i]}>${memberIds[j]}`;
        const rec = newRels[key];
        if (!rec) continue;
        newRels[key] = { ...rec, bond: Engine.util.clamp(rec.bond + delta, 0, 100) };
      }
    }
    return { ...state, relationships: newRels };
  },

  _applyRivalryDirected(state, fromId, toId, delta) {
    if (!state.relationships) return state;
    const key = `${fromId}>${toId}`;
    const rec = state.relationships[key];
    if (!rec) return state;
    const newRec = { ...rec, rivalry: Engine.util.clamp((rec.rivalry || 0) + delta, 0, 100) };
    return { ...state, relationships: { ...state.relationships, [key]: newRec } };
  },

  _applyRivalryBetweenMembers(state, memberIds, delta) {
    if (!state.relationships || memberIds.length < 2) return state;
    let newRels = { ...state.relationships };
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = 0; j < memberIds.length; j++) {
        if (i === j) continue;
        const key = `${memberIds[i]}>${memberIds[j]}`;
        const rec = newRels[key];
        if (!rec) continue;
        newRels[key] = { ...rec, rivalry: Engine.util.clamp((rec.rivalry || 0) + delta, 0, 100) };
      }
    }
    return { ...state, relationships: newRels };
  },

  _applyLockerRoomMorale(state, delta) {
    const cur = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    return { ...state, lockerRoomMorale: Engine.util.clamp(cur + delta, 0, 100) };
  },

  // ── §11 セリフ fallback ヘルパー ──
  // table: { personality: { archetype: [lines...] } }
  // fighter: { personality, archetype } を受け取り、normal fallback で最低1行を返す
  getFactionLine(table, fighter, rng) {
    if (!table || !fighter) return '';
    const p = fighter.personality || 'normal';
    const a = fighter.archetype || 'normal';
    const byPersona = table[p] || table.normal || {};
    const byArch = byPersona[a] || byPersona.normal || table.normal?.normal || [];
    if (!byArch.length) return '';
    const idx = rng ? Math.floor(Engine.rng.float(rng) * byArch.length) : 0;
    return byArch[idx];
  },

  // ── §6.1 派閥抗争マッチ判定 ──────────────────────────────
  isFactionFeudMatch(state, fighterIdA, fighterIdB) {
    const fA = this.getFactionByFighterId(state, fighterIdA);
    const fB = this.getFactionByFighterId(state, fighterIdB);
    if (!fA || !fB) return false;
    if (fA.id === fB.id) return false;
    if (!this.isLeaderOrExecutive(state, fighterIdA)) return false;
    if (!this.isLeaderOrExecutive(state, fighterIdB)) return false;
    const hAB = (state.factionHostility || {})[this._hostKey(fA.id, fB.id)] || 0;
    const hBA = (state.factionHostility || {})[this._hostKey(fB.id, fA.id)] || 0;
    const avg = (hAB + hBA) / 2;
    return avg >= 40;
  },

  // ── §6.2 派閥抗争集客加算 ───────────────────────────────
  calcFactionFeudAppeal(state, fighterIdA, fighterIdB, options = {}) {
    const cfg = FACTION_CONFIG;
    const fA = this.getFactionByFighterId(state, fighterIdA);
    const fB = this.getFactionByFighterId(state, fighterIdB);
    if (!fA || !fB || fA.id === fB.id) return 0;
    const hAB = (state.factionHostility || {})[this._hostKey(fA.id, fB.id)] || 0;
    const hBA = (state.factionHostility || {})[this._hostKey(fB.id, fA.id)] || 0;
    const avg = (hAB + hBA) / 2;

    let base = 0;
    if (avg >= 80) base = cfg.factionAppealHigh;
    else if (avg >= 60) base = cfg.factionAppealMid;
    else if (avg >= 40) base = cfg.factionAppealLow;

    if (options.f08) {
      const [lo, hi] = cfg.f08AppealBase;
      let f08 = (lo + hi) / 2;
      if (options.isTitle) f08 *= cfg.f08TitleMultiplier;
      base += f08;
    }
    return base;
  },

  // ── §4.2 §5.2 試合結果反映 ──────────────────────────────
  // opts.variationMultiplier: 勢い/対立度の変動幅を倍化（F08 直接対決で 1.5 倍）
  applyMatchResult(state, fighterIdA, fighterIdB, result, rng, opts = {}) {
    let s = state;
    if (!s.factions || s.factions.length === 0) return s;
    const fA = this.getFactionByFighterId(s, fighterIdA);
    const fB = this.getFactionByFighterId(s, fighterIdB);
    if (!fA || !fB || fA.id === fB.id) return s;
    const aIsExec = this.isLeaderOrExecutive(s, fighterIdA);
    const bIsExec = this.isLeaderOrExecutive(s, fighterIdB);
    if (!aIsExec || !bIsExec) return s;

    const aIsLeader = this.isLeader(s, fighterIdA);
    const bIsLeader = this.isLeader(s, fighterIdB);
    const cfg = FACTION_CONFIG;
    const mult = (opts && typeof opts.variationMultiplier === 'number') ? opts.variationMultiplier : 1;

    // 勝者/敗者判定（result.winner: 'A'|'B'|'draw'）
    const winner = result && result.winner;
    if (winner !== 'A' && winner !== 'B') return s;

    const winnerFaction = winner === 'A' ? fA : fB;
    const loserFaction = winner === 'A' ? fB : fA;
    const isLeaderMatch = aIsLeader && bIsLeader;

    // 勢い変動
    const [mlo, mhi] = isLeaderMatch ? cfg.momentumLeaderBonus : cfg.momentumSeniorBonus;
    const bumpRaw = mlo + Math.floor(Engine.rng.float(rng) * (mhi - mlo + 1));
    const bump = Math.round(bumpRaw * mult);
    s = this.applyMomentumChange(s, winnerFaction.id, bump);
    s = this.applyMomentumChange(s, loserFaction.id, -bump);

    // 対立度変動: 敗者派閥 → 勝者派閥 +3〜+5
    const hostBumpRaw = 3 + Math.floor(Engine.rng.float(rng) * 3);
    const hostBump = Math.round(hostBumpRaw * mult);
    s = this.applyHostilityChange(s, loserFaction.id, winnerFaction.id, hostBump);
    if (isLeaderMatch) {
      s = this.applyHostilityChange(s, loserFaction.id, winnerFaction.id, hostBump);
    }

    return s;
  },

  // ── §9.8.1 Phase 3e セリフ抽選（hostility帯/HP帯分岐版） ──
  // table 構造: { personality: { archetype: { high/mid/low or hp_high/hp_mid/hp_low: [...] } } }
  _getF08LineByBand(table, fighter, band, rng) {
    if (!table || !fighter || !band) return '';
    const p = fighter.personality || 'normal';
    const a = fighter.archetype || 'normal';
    const byPersona = table[p] || table.normal || {};
    let byArch = byPersona[a];
    if (!byArch || !byArch[band] || !byArch[band].length) {
      byArch = byPersona.normal;
    }
    if (!byArch) {
      const np = table.normal || {};
      byArch = np[a] || np.normal;
    }
    if (!byArch) return '';
    let lines = byArch[band];
    if (!lines || !lines.length) {
      // 帯フォールバック: high → mid → low、hp_high → hp_mid → hp_low
      const fallbackOrder = (band === 'high' || band === 'mid' || band === 'low')
        ? ['high', 'mid', 'low']
        : ['hp_high', 'hp_mid', 'hp_low'];
      for (const b of fallbackOrder) {
        if (byArch[b] && byArch[b].length) { lines = byArch[b]; break; }
      }
    }
    if (!lines || !lines.length) return '';
    const idx = rng ? Math.floor(Engine.rng.float(rng) * lines.length) : 0;
    return lines[idx] || '';
  },

  // hostility 平均から温度帯を返す
  _hostilityBand(hostilityAvg) {
    if (hostilityAvg >= 80) return 'high';
    if (hostilityAvg >= 60) return 'mid';
    return 'low';
  },

  // ── §9.8.1 Phase 3e 試合前モーダル用データ ──
  // matchSlot: { left, right, _f08Locked } showCard 上のスロット
  getF08PreMatchData(state, matchSlot) {
    if (!state || !matchSlot) return null;
    const roster = state.roster || [];
    const leaderA = roster.find(c => c.id === matchSlot.left);
    const leaderB = roster.find(c => c.id === matchSlot.right);
    if (!leaderA || !leaderB) return null;
    const facA = this.getFactionByFighterId(state, leaderA.id);
    const facB = this.getFactionByFighterId(state, leaderB.id);
    if (!facA || !facB || facA.id === facB.id) return null;

    const host = state.factionHostility || {};
    const hAB = host[this._hostKey(facA.id, facB.id)] || 0;
    const hBA = host[this._hostKey(facB.id, facA.id)] || 0;
    const avg = (hAB + hBA) / 2;
    const band = this._hostilityBand(avg);

    const tableA = (typeof FACTION_F08_PRE_MATCH_LINES_A !== 'undefined') ? FACTION_F08_PRE_MATCH_LINES_A : null;
    const tableB = (typeof FACTION_F08_PRE_MATCH_LINES_B !== 'undefined') ? FACTION_F08_PRE_MATCH_LINES_B : null;
    const seed = state.rngSeed || 1;
    const rngA = Engine.rng.create(Engine.rng.derive(seed, state.season || 0, state.week || 0, 0xFA83));
    const rngB = Engine.rng.create(Engine.rng.derive(seed, state.season || 0, state.week || 0, 0xFA84));
    const lineA = tableA ? this._getF08LineByBand(tableA, leaderA, band, rngA) : '';
    const lineB = tableB ? this._getF08LineByBand(tableB, leaderB, band, rngB) : '';

    return {
      factionA: { id: facA.id, name: facA.name, leaderId: leaderA.id, leaderName: leaderA.name, leaderOvr: Engine.util.ov(leaderA) },
      factionB: { id: facB.id, name: facB.name, leaderId: leaderB.id, leaderName: leaderB.name, leaderOvr: Engine.util.ov(leaderB) },
      hostilityAvg: Math.round(avg),
      hostilityBand: band,
      lineA: lineA,
      lineB: lineB,
      narration: `${facA.name}と${facB.name}――その夜、両派閥のリーダーが直接拳を交える。`,
    };
  },

  // ── §9.8.1 Phase 3e 試合後モーダル用データ ──
  // matchResult: { winnerId, loserId, winnerHpPct, loserHpPct }
  getF08AftermathData(state, matchResult) {
    if (!state || !matchResult || !matchResult.winnerId || !matchResult.loserId) return null;
    const roster = state.roster || [];
    const winner = roster.find(c => c.id === matchResult.winnerId);
    const loser = roster.find(c => c.id === matchResult.loserId);
    if (!winner || !loser) return null;
    const facW = this.getFactionByFighterId(state, winner.id);
    const facL = this.getFactionByFighterId(state, loser.id);
    if (!facW || !facL || facW.id === facL.id) return null;

    const loserHp = (typeof matchResult.loserHpPct === 'number') ? matchResult.loserHpPct : 1.0;
    const hpBand = loserHp >= 0.66 ? 'hp_high' : (loserHp >= 0.34 ? 'hp_mid' : 'hp_low');

    const tableW = (typeof FACTION_F08_POST_MATCH_WINNER_LINES !== 'undefined') ? FACTION_F08_POST_MATCH_WINNER_LINES : null;
    const tableL = (typeof FACTION_F08_POST_MATCH_LOSER_LINES !== 'undefined') ? FACTION_F08_POST_MATCH_LOSER_LINES : null;

    // 勝者の温度帯は hostility 平均から
    const host = state.factionHostility || {};
    const hWL = host[this._hostKey(facW.id, facL.id)] || 0;
    const hLW = host[this._hostKey(facL.id, facW.id)] || 0;
    const winnerBand = this._hostilityBand((hWL + hLW) / 2);

    const seed = state.rngSeed || 1;
    const rngW = Engine.rng.create(Engine.rng.derive(seed, state.season || 0, state.week || 0, 0xFA85));
    const rngL = Engine.rng.create(Engine.rng.derive(seed, state.season || 0, state.week || 0, 0xFA86));
    const winnerLine = tableW ? this._getF08LineByBand(tableW, winner, winnerBand, rngW) : '';
    const loserLine  = tableL ? this._getF08LineByBand(tableL, loser, hpBand, rngL) : '';

    // 派閥状態に応じた結びナレーション
    const lMomentum = (facL.momentum != null) ? facL.momentum : 0;
    let narrationClose;
    if (lMomentum <= -40) {
      narrationClose = `${facL.name}は深い傷を負い、夜の闇に消えていった。再起できるかは、誰にも分からない。`;
    } else if (lMomentum <= -10) {
      narrationClose = `${facL.name}の威信は揺らぎ、メンバーの足並みは乱れ始めている。`;
    } else {
      narrationClose = `${facL.name}は今夜の屈辱を抱えたまま、リングを去った。火種は、まだ消えない。`;
    }

    return {
      winner: { id: winner.id, name: winner.name, factionName: facW.name, factionId: facW.id },
      loser:  { id: loser.id,  name: loser.name,  factionName: facL.name, factionId: facL.id, hpBand },
      winnerLine: winnerLine,
      loserLine:  loserLine,
      narrationOpen: `決着。${facW.name}が${facL.name}を下した――しかし、戦いは終わらない。`,
      narrationClose: narrationClose,
    };
  },

  // ── §9.8.1 Phase 3e 試合結果による派閥関係追加変動 ──
  // 既存 applyMatchResult(×1.5) に加えて発火。F02③ resolution 同時発火時は no-op。
  applyF08PostMatchExtraEffects(state, matchResult, isF02ResolutionFiring) {
    if (!state || !matchResult || !matchResult.winnerId || !matchResult.loserId) return state;
    if (isF02ResolutionFiring) return state; // F02③優先、重複加算しない
    const facW = this.getFactionByFighterId(state, matchResult.winnerId);
    const facL = this.getFactionByFighterId(state, matchResult.loserId);
    if (!facW || !facL || facW.id === facL.id) return state;

    let s = state;
    const seed = s.rngSeed || 1;
    const rng = Engine.rng.create(Engine.rng.derive(seed, s.season || 0, s.week || 0, 0xFA87));
    const floatR = (lo, hi) => lo + Math.floor(Engine.rng.float(rng) * (hi - lo + 1));

    // 1) 敗者派閥末端メンバー（リーダー・幹部以外）trust -2〜-4
    const tailIds = (facL.memberIds || []).filter(id => !this.isLeaderOrExecutive(s, id));
    if (tailIds.length) {
      s = this._applyTrustToMembers(s, tailIds, -floatR(2, 4));
    }

    // 2) 敗者派閥リーダー → 勝者派閥リーダー rivalry +8〜+12
    if (facL.leaderId && facW.leaderId) {
      s = this._applyRivalryDirected(s, facL.leaderId, facW.leaderId, floatR(8, 12));
    }

    // 3) 勝者派閥メンバー → 勝者リーダー bond +2〜+4
    const wMembers = (facW.memberIds || []).filter(id => id !== facW.leaderId);
    for (const mid of wMembers) {
      s = this._applyBondDirected(s, mid, facW.leaderId, floatR(2, 4));
    }

    return s;
  },

  // ── §9.8 F08 ディレクティブ判定（試合がF08直接対決に該当するか）──
  isF08DirectiveMatch(state, fighterIdA, fighterIdB) {
    const d = state && state._pendingF08Directive;
    if (!d) return false;
    return (d.leaderAId === fighterIdA && d.leaderBId === fighterIdB)
        || (d.leaderAId === fighterIdB && d.leaderBId === fighterIdA);
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  Phase B: 抗争ポイント制 + F09 派閥対抗戦                   ║
  // ║  spec: faction-rivalry-points-spec-v0.1 v0.3              ║
  // ╚══════════════════════════════════════════════════════════╝

  _pairKey(fid1, fid2) {
    const a = Math.min(fid1, fid2);
    const b = Math.max(fid1, fid2);
    return `${a}-${b}`;
  },

  _ensureRivalryPointsEntry(state, factionAId, factionBId) {
    if (!state.factionRivalryPoints) state.factionRivalryPoints = {};
    const key = this._pairKey(factionAId, factionBId);
    if (!state.factionRivalryPoints[key]) {
      const a = Math.min(factionAId, factionBId);
      const b = Math.max(factionAId, factionBId);
      state.factionRivalryPoints[key] = {
        factionAId: a,
        factionBId: b,
        pointsA: 0,
        pointsB: 0,
        startedSeason: state.season,
        startedWeek: state.week,
        lastUpdatedSeason: state.season,
        lastUpdatedWeek: state.week,
        naturalCalmStreak: 0,
      };
    }
    return state.factionRivalryPoints[key];
  },

  // §2 試合ベース・ポイント加点
  // matchCtx: { fighterIdA, fighterIdB, winner: 'A'|'B'|'draw', isMain, isTitle, isTag, isF09 }
  accrueRivalryPointsFromMatch(state, matchCtx) {
    if (!state || !matchCtx) return state;
    if (!state.factions || state.factions.length === 0) return state;
    if (matchCtx.winner !== 'A' && matchCtx.winner !== 'B') return state;
    const fA = this.getFactionByFighterId(state, matchCtx.fighterIdA);
    const fB = this.getFactionByFighterId(state, matchCtx.fighterIdB);
    if (!fA || !fB || fA.id === fB.id) return state;
    // リーダー幹部級でなければ加点しない（F09 中も同様、ただし F09 は OVR上位5名で組まれているため自然と該当する）
    const aRank = this._getFactionMatchRank(state, fA, matchCtx.fighterIdA);
    const bRank = this._getFactionMatchRank(state, fB, matchCtx.fighterIdB);
    if (aRank == null || bRank == null) return state;
    // 「低い方を採用」: rank 値が大きい方（fillerが大）を採用してランク確定
    const rankIdx = Math.max(aRank.idx, bRank.idx);
    const cfg = FACTION_CONFIG;
    const RANK_KEYS = ['top', 'second', 'third', 'filler'];
    const rankKey = RANK_KEYS[Math.min(rankIdx, RANK_KEYS.length - 1)];
    const base = cfg.pointsByRank[rankKey] || 0;
    if (base <= 0) return state;

    // 補正（加算式）
    let mult = 1.0;
    if (matchCtx.isMain) mult += cfg.pointsMainEventBonus;
    if (matchCtx.isTitle) mult += cfg.pointsTitleBonus;
    if (matchCtx.isTag) mult += cfg.pointsTagBonus;
    // 下剋上: 勝者 OVR が敗者 OVR より pointsUpsetOvrDiff 以上低い
    const winnerId = matchCtx.winner === 'A' ? matchCtx.fighterIdA : matchCtx.fighterIdB;
    const loserId  = matchCtx.winner === 'A' ? matchCtx.fighterIdB : matchCtx.fighterIdA;
    const winnerC = (state.roster || []).find(c => c.id === winnerId);
    const loserC  = (state.roster || []).find(c => c.id === loserId);
    if (winnerC && loserC) {
      const wOvr = Engine.util.ov(winnerC);
      const lOvr = Engine.util.ov(loserC);
      if (lOvr - wOvr >= cfg.pointsUpsetOvrDiff) mult += cfg.pointsUpsetBonus;
    }
    if (mult < cfg.pointsMultMin) mult = cfg.pointsMultMin;

    let pt = Math.round(base * mult);
    if (matchCtx.isF09) pt = Math.round(pt * cfg.f09PointsMult);
    if (pt <= 0) return state;

    const winnerFaction = matchCtx.winner === 'A' ? fA : fB;
    const entry = this._ensureRivalryPointsEntry(state, fA.id, fB.id);

    // 週次キャップ（F09 は無視）
    if (!matchCtx.isF09) {
      const weeklyKey = `${state.season}-${state.week}-${this._pairKey(fA.id, fB.id)}`;
      if (!state._rivalryPointsWeekly) state._rivalryPointsWeekly = {};
      const used = state._rivalryPointsWeekly[weeklyKey] || 0;
      const remain = Math.max(0, cfg.pointsWeeklyCapPerPair - used);
      if (remain <= 0) return state;
      pt = Math.min(pt, remain);
      state._rivalryPointsWeekly[weeklyKey] = used + pt;
    }

    if (winnerFaction.id === entry.factionAId) entry.pointsA += pt;
    else entry.pointsB += pt;
    entry.lastUpdatedSeason = state.season;
    entry.lastUpdatedWeek = state.week;
    return state;
  },

  // 自派閥内 OVR 順位（リーダー=0, 幹部1位=1, 2位=2, 末端=3）
  _getFactionMatchRank(state, faction, fighterId) {
    if (!faction || !faction.memberIds.includes(fighterId)) return null;
    if (faction.leaderId === fighterId) return { idx: 0 };
    const ovrMap = new Map();
    (state.roster || []).forEach(c => ovrMap.set(c.id, Engine.util.ov(c)));
    const sorted = faction.memberIds
      .filter(id => id !== faction.leaderId)
      .sort((a, b) => (ovrMap.get(b) || 0) - (ovrMap.get(a) || 0));
    const pos = sorted.indexOf(fighterId);
    if (pos < 0) return null;
    if (pos === 0) return { idx: 1 };  // 2番手
    if (pos === 1) return { idx: 2 };  // 3番手
    return { idx: 3 };                  // filler
  },

  // §4 決着判定（毎週・finalizeShow直後にも）
  // 戻り値: 決着が発生した場合 { resolved: true, reason, winnerFactionId, loserFactionId }、無ければ null
  checkRivalryResolution(state, rng) {
    if (!state || !state.factionRivalryPoints) return null;
    const cfg = FACTION_CONFIG;
    const keys = Object.keys(state.factionRivalryPoints);
    for (const key of keys) {
      const e = state.factionRivalryPoints[key];
      if (!e) continue;
      const fA = (state.factions || []).find(f => f.id === e.factionAId);
      const fB = (state.factions || []).find(f => f.id === e.factionBId);

      // §4.1 先取100（最優先）
      if (e.pointsA >= cfg.pointsResolutionThreshold || e.pointsB >= cfg.pointsResolutionThreshold) {
        const winId = e.pointsA >= e.pointsB ? e.factionAId : e.factionBId;
        const losId = winId === e.factionAId ? e.factionBId : e.factionAId;
        // 勝者敗者派閥が両方存命のときのみフル適用
        if (fA && fB) {
          this.applyRivalryVictory(state, winId, losId, 'POINTS', rng);
        } else {
          delete state.factionRivalryPoints[key];
        }
        return { resolved: true, reason: 'POINTS', winnerFactionId: winId, loserFactionId: losId };
      }

      // §4.2 派閥消滅
      if (!fA || !fB) {
        const survivorId = fA ? fA.id : (fB ? fB.id : null);
        const goneId = fA ? e.factionBId : e.factionAId;
        if (survivorId != null) {
          this.applyHostilityChange(state, survivorId, goneId, cfg.victoryHostilityDecay);
        }
        if (Array.isArray(state.factionTimeline) && survivorId != null) {
          state.factionTimeline = [...state.factionTimeline, {
            type: 'RIVALRY_CLOSED',
            season: state.season, week: state.week,
            survivorFactionId: survivorId, goneFactionId: goneId,
            reason: 'CONSOLATION',
          }];
        }
        delete state.factionRivalryPoints[key];
        return { resolved: true, reason: 'CONSOLATION', winnerFactionId: null, loserFactionId: null };
      }

      // §4.3 40週経過
      const startAbs = (e.startedSeason - 1) * 52 + e.startedWeek;
      const nowAbs = (state.season - 1) * 52 + state.week;
      if (nowAbs - startAbs >= cfg.pointsForceCloseWeeks) {
        // F06 強制発火フラグを立てる（モーダル処理は management.js 側で拾う）
        state._pendingForceCloseRivalry = {
          pairKey: key,
          factionAId: e.factionAId,
          factionBId: e.factionBId,
        };
        return { resolved: false, reason: 'FORCE_CLOSE_PENDING' };
      }

      // §4.4 自然沈静化
      const hostAB = (state.factionHostility || {})[this._hostKey(e.factionAId, e.factionBId)] || 0;
      const hostBA = (state.factionHostility || {})[this._hostKey(e.factionBId, e.factionAId)] || 0;
      if (hostAB < cfg.pointsNaturalCalmHostilityMax && hostBA < cfg.pointsNaturalCalmHostilityMax) {
        e.naturalCalmStreak = (e.naturalCalmStreak || 0) + 1;
        if (e.naturalCalmStreak >= cfg.pointsNaturalCalmWeeks) {
          if (Array.isArray(state.factionTimeline)) {
            state.factionTimeline = [...state.factionTimeline, {
              type: 'RIVALRY_CLOSED',
              season: state.season, week: state.week,
              factionAId: e.factionAId, factionBId: e.factionBId,
              reason: 'CALM',
            }];
          }
          delete state.factionRivalryPoints[key];
          return { resolved: true, reason: 'CALM', winnerFactionId: null, loserFactionId: null };
        }
      } else {
        e.naturalCalmStreak = 0;
      }
    }
    return null;
  },

  // §5 勝者敗者効果適用
  applyRivalryVictory(state, winnerFactionId, loserFactionId, reason, rng) {
    const cfg = FACTION_CONFIG;
    const winF = (state.factions || []).find(f => f.id === winnerFactionId);
    const losF = (state.factions || []).find(f => f.id === loserFactionId);
    if (!winF || !losF) return state;

    if (reason === 'POINTS') {
      // 勝者
      this.applyMomentumChange(state, winF.id, cfg.victoryWinnerMomentum);
      this._applyTrustToMembers(state, winF.memberIds, cfg.victoryWinnerTrust);
      const others = winF.memberIds.filter(id => id !== winF.leaderId);
      for (const mid of others) this._applyBondDirected(state, mid, winF.leaderId, cfg.victoryBondGainToLeader);
      state._factionAppealBoost = state._factionAppealBoost || {};
      state._factionAppealBoost[winF.id] = {
        startSeason: state.season, startWeek: state.week,
        weeks: cfg.victoryAppealBoostWeeks,
      };
      // 敗者
      this.applyMomentumChange(state, losF.id, cfg.victoryLoserMomentum);
      this._applyTrustToMembers(state, [losF.leaderId], cfg.victoryLoserLeaderTrust);
      const losMembers = losF.memberIds.filter(id => id !== losF.leaderId);
      this._applyTrustToMembers(state, losMembers, cfg.victoryLoserMemberTrust);
      if (losF.authoritativeTag) losF.authoritativeTag = false;
      state._factionDefectionBoost = state._factionDefectionBoost || {};
      state._factionDefectionBoost[losF.id] = {
        startSeason: state.season, startWeek: state.week,
        weeks: cfg.victoryDefectionMultWeeks,
        mult: cfg.victoryDefectionMult,
      };
    }
    // 共通: 両方向 hostility 減衰
    this.applyHostilityChange(state, winF.id, losF.id, cfg.victoryHostilityDecay);
    this.applyHostilityChange(state, losF.id, winF.id, cfg.victoryHostilityDecay);
    // ペアエントリ削除
    const key = this._pairKey(winF.id, losF.id);
    if (state.factionRivalryPoints) delete state.factionRivalryPoints[key];
    // F08/F09 cooldown リセット
    this._markCooldown(state, `F08_${winF.id}_${losF.id}`);
    this._markCooldown(state, `F09_${winF.id}_${losF.id}`);
    // タイムライン
    if (Array.isArray(state.factionTimeline)) {
      state.factionTimeline = [...state.factionTimeline, {
        type: 'RIVALRY_CLOSED',
        season: state.season, week: state.week,
        winnerFactionId: winF.id, loserFactionId: losF.id,
        reason,
      }];
    }
    return state;
  },

  // §3 F09 発火条件
  checkF09Conditions(state) {
    if (!state || !state.factions || state.factions.length < 2) return null;
    const cfg = FACTION_CONFIG;
    // 既に F09 進行中なら返さない
    if (state._pendingF09) return null;
    const factions = state.factions;
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const fA = factions[i], fB = factions[j];
        if (fA.type !== 'rivalrous' || fB.type !== 'rivalrous') continue;
        const hostAB = (state.factionHostility || {})[this._hostKey(fA.id, fB.id)] || 0;
        const hostBA = (state.factionHostility || {})[this._hostKey(fB.id, fA.id)] || 0;
        if (hostAB < cfg.f09HostilityMin || hostBA < cfg.f09HostilityMin) continue;
        if ((fA.momentum || 0) < cfg.f09MomentumMin) continue;
        if ((fB.momentum || 0) < cfg.f09MomentumMin) continue;
        // OVR 上位 N 名合計の差
        const sumA = this._topNOvrSum(state, fA, cfg.f09OvrTopN);
        const sumB = this._topNOvrSum(state, fB, cfg.f09OvrTopN);
        const big = Math.max(sumA, sumB);
        const small = Math.min(sumA, sumB);
        if (big <= 0) continue;
        if ((big - small) / big > cfg.f09OvrDiffMaxRatio) continue;
        // クールダウン
        const cdKey = `F09_${Math.min(fA.id, fB.id)}_${Math.max(fA.id, fB.id)}`;
        if (!this._isCooldownReady(state, cdKey, cfg.f09Cooldown)) continue;
        return { factionAId: fA.id, factionBId: fB.id };
      }
    }
    return null;
  },

  _topNOvrSum(state, faction, n) {
    if (!faction || !faction.memberIds || faction.memberIds.length === 0) return 0;
    const ovrs = faction.memberIds
      .map(id => {
        const c = (state.roster || []).find(r => r.id === id);
        return c ? Engine.util.ov(c) : 0;
      })
      .sort((a, b) => b - a);
    const take = Math.min(n, ovrs.length);
    let sum = 0;
    for (let i = 0; i < take; i++) sum += ovrs[i];
    return sum;
  },

  // F09 後半補正
  _f09LateGameMult(state) {
    const cfg = FACTION_CONFIG;
    const week = (state.season - 1) * 52 + (state.week || 0);
    const tiers = Object.keys(cfg.f09LateGameMult).map(Number).sort((a, b) => a - b);
    let mult = cfg.f09LateGameMult[tiers[tiers.length - 1]];
    for (const t of tiers) {
      if (week <= t) { mult = cfg.f09LateGameMult[t]; break; }
    }
    return mult;
  },

  // F09 試合カードを組む（OVR順位マッチ・3〜5試合）
  buildF09MatchPairs(state, factionAId, factionBId) {
    const cfg = FACTION_CONFIG;
    const fA = (state.factions || []).find(f => f.id === factionAId);
    const fB = (state.factions || []).find(f => f.id === factionBId);
    if (!fA || !fB) return [];
    const ovr = (id) => {
      const c = (state.roster || []).find(r => r.id === id);
      return c ? Engine.util.ov(c) : 0;
    };
    const sortByOvr = (ids) => [...ids].sort((a, b) => ovr(b) - ovr(a));
    const aSorted = sortByOvr(fA.memberIds);
    const bSorted = sortByOvr(fB.memberIds);
    const n = Math.min(aSorted.length, bSorted.length, cfg.f09MaxMatches);
    if (n < cfg.f09MinMatches) return [];
    const pairs = [];
    for (let i = 0; i < n; i++) {
      pairs.push({ fighterIdA: aSorted[i], fighterIdB: bSorted[i] });
    }
    return pairs;
  },

  // F09 試合結果集計（accrueRivalryPointsFromMatch を isF09:true で叩いた後、勝ち越しボーナス）
  applyF09SweepBonus(state, factionAId, factionBId, results) {
    if (!Array.isArray(results) || results.length === 0) return state;
    const cfg = FACTION_CONFIG;
    let winsA = 0, winsB = 0;
    for (const r of results) {
      if (r.winnerFactionId === factionAId) winsA++;
      else if (r.winnerFactionId === factionBId) winsB++;
    }
    if (winsA === winsB) return state;
    const winnerFid = winsA > winsB ? factionAId : factionBId;
    const entry = this._ensureRivalryPointsEntry(state, factionAId, factionBId);
    if (winnerFid === entry.factionAId) entry.pointsA += cfg.f09SweepBonus;
    else entry.pointsB += cfg.f09SweepBonus;
    entry.lastUpdatedSeason = state.season;
    entry.lastUpdatedWeek = state.week;
    // F09 cooldown セット
    this._markCooldown(state, `F09_${Math.min(factionAId, factionBId)}_${Math.max(factionAId, factionBId)}`);
    return state;
  },

  // ── §9.9 F02 対峙セリフ引き（personality × archetype × side）──
  // FACTION_F02_LINES は data.js 定義。引けなければ normal / introverted にフォールバック。
  getF02ClashLine(fighter, side) {
    if (!fighter) return '';
    const sideKey = (side === 'defend') ? 'defend' : 'attack';
    const personality = Engine.contract.getPersonalityType(fighter);
    const archetype = fighter.archetype || 'normal';
    const table = (typeof FACTION_F02_LINES !== 'undefined' ? FACTION_F02_LINES : null);
    if (!table) return '';
    const pTable = table[personality] || table.introverted;
    const sTable = pTable[sideKey] || pTable.attack;
    return sTable[archetype] || sTable.normal || '';
  },

  // ── Common-3 派閥加入通知 セリフ引き ──
  getCommon3Line(category, ctx) {
    const table = (typeof COMMON3_LINES !== 'undefined' ? COMMON3_LINES : null);
    if (!table || !category) return '';
    const pickArr = (arr) => (Array.isArray(arr) && arr.length) ? arr[Math.floor(Math.random() * arr.length)] : '';
    if (category === 'newcomer') {
      const fighter = ctx && ctx.fighter;
      const personality = fighter ? Engine.contract.getPersonalityType(fighter) : 'introverted';
      const arr = table.newcomer[personality] || table.newcomer.introverted;
      return pickArr(arr);
    }
    if (category === 'reaction') {
      const arr = table.reaction[ctx && ctx.archetypeId] || table.reaction._any;
      return pickArr(arr);
    }
    return '';
  },

  // ── F07 v0.4 セリフ引き ──
  // category: 'leaderDemand' | 'coachReport' | 'resultLeader' | 'resultTarget'
  // ctx: { incidentType, choice?, fighter?, vars? }
  // F07_LINES は data.js 定義。引けなければ空文字を返す（呼び出し側でフォールバック）。
  getF07Line(category, ctx) {
    const table = (typeof F07_LINES !== 'undefined' ? F07_LINES : null);
    if (!table || !category) return '';
    const itype = ctx && ctx.incidentType;
    if (!itype) return '';
    const fighter = ctx && ctx.fighter;
    const personality = fighter ? Engine.contract.getPersonalityType(fighter) : 'introverted';
    const subst = (s) => {
      if (!s || !ctx || !ctx.vars) return s || '';
      let out = String(s);
      Object.keys(ctx.vars).forEach(k => {
        const v = ctx.vars[k] != null ? String(ctx.vars[k]) : '';
        out = out.split(`{${k}}`).join(v);
      });
      return out;
    };
    const pickArr = (arr) => (Array.isArray(arr) && arr.length) ? arr[Math.floor(Math.random() * arr.length)] : '';

    if (category === 'leaderDemand') {
      const t = table.leaderDemand && table.leaderDemand[itype];
      if (!t) return '';
      const arr = t[personality] || t.introverted || t._any;
      return subst(pickArr(arr));
    }
    if (category === 'coachReport') {
      const arr = table.coachReport && table.coachReport[itype];
      return subst(pickArr(arr));
    }
    if (category === 'resultLeader') {
      const choice = ctx.choice || 'A';
      const t = table.resultLeader && table.resultLeader[itype];
      if (!t) return '';
      const ct = t[choice];
      if (!ct) return '';
      const arr = ct[personality] || ct.introverted || ct._any;
      return subst(pickArr(arr));
    }
    if (category === 'resultTarget') {
      const choice = ctx.choice || 'A';
      const t = table.resultTarget && table.resultTarget[itype];
      if (!t) return '';
      return subst(pickArr(t[choice]));
    }
    return '';
  },
};
