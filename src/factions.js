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
  checkLoyalFormationConditions(state) {
    const cfg = FACTION_CONFIG;
    const roster = (state.roster || []).filter(c => !c.isRental);
    if (roster.length <= cfg.minRosterSize) return { eligible: false };
    if (state.factions && state.factions.length > 0) return { eligible: false };

    const sorted = [...roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const top3 = sorted.slice(0, 3);

    for (const cand of top3) {
      const followers = roster
        .filter(c => c.id !== cand.id)
        .filter(c => this._getBond(state, c.id, cand.id) >= cfg.loyalBondThreshold);
      if (followers.length >= cfg.loyalMinFollowers) {
        return {
          eligible: true,
          leaderId: cand.id,
          leaderName: cand.name,
          followerIds: followers.map(c => c.id),
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

    // 未抗争ペアのみ対象
    const pool = factions.filter(f => !f.inHostility);
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

  // ── 派閥生成 ──────────────────────────────────────────────
  createFaction(state, leaderId, memberIds, options = {}) {
    const roster = state.roster || [];
    const leader = roster.find(c => c.id === leaderId);
    if (!leader) return state;
    const type = options.type || 'loyal';
    const existingIds = new Set((state.factions || []).map(f => f.id));
    let nextId = 1;
    while (existingIds.has(nextId)) nextId++;

    const faction = {
      id: nextId,
      name: `${leader.name}組`,
      leaderId,
      memberIds: [...new Set(memberIds)],
      type,
      authoritativeTag: !!options.authoritativeTag,
      dictatorTag: !!options.dictatorTag,
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

  // ── §2.2 §2.3 メンバー変動 ──────────────────────────────
  processWeeklyMemberChanges(state, rng) {
    const cfg = FACTION_CONFIG;
    let s = state;
    if (!s.factions || s.factions.length === 0) return s;

    const rosterIds = new Set((s.roster || []).filter(c => !c.isRental).map(c => c.id));
    const assigned = new Set();
    s.factions.forEach(f => f.memberIds.forEach(id => assigned.add(id)));

    // ── 加入判定 ──
    const newFactions = s.factions.map(f => ({ ...f, memberIds: [...f.memberIds] }));
    for (const f of newFactions) {
      const candidates = [...rosterIds].filter(id => !assigned.has(id));
      for (const candId of candidates) {
        if (f.memberIds.includes(candId)) continue;
        const avg = this._avgBond(s, candId, f.memberIds);
        if (avg < cfg.joinBondThreshold) continue;
        let rate;
        if (avg >= 80) rate = cfg.joinRate[80];
        else if (avg >= 70) rate = cfg.joinRate[70];
        else rate = cfg.joinRate[60];
        if (this._isHostile(f)) {
          if (f.momentum > 30) rate *= cfg.joinMomentumHighMult;
          else if (f.momentum < -30) rate *= cfg.joinMomentumLowMult;
        }
        if (Engine.rng.float(rng) < rate) {
          f.memberIds.push(candId);
          assigned.add(candId);
          const name = (s.roster || []).find(c => c.id === candId)?.name || `#${candId}`;
          if (typeof console !== 'undefined') console.log(`[WM Faction] ${name} joined ${f.name}`);
        }
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

    return { ...s, factions: newFactions };
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

    return s;
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

  // ── §9.3 フック: リーダー喪失検出（roster 外 or 長期重傷）──
  // return: { factionId, reason:'departure'|'retirement'|'longInjury' } | null
  detectLeaderLoss(state) {
    if (!state.factions || state.factions.length === 0) return null;
    const roster = state.roster || [];
    const rosterMap = new Map(roster.map(c => [c.id, c]));
    const retiredIds = new Set((state.retiredFighters || []).map(c => c.id));

    for (const f of state.factions) {
      const leader = rosterMap.get(f.leaderId);
      if (!leader) {
        // リーダーがロスター不在
        const reason = retiredIds.has(f.leaderId) ? 'retirement' : 'departure';
        return { factionId: f.id, reason };
      }
      // 長期重傷（8週以上の injury）
      if (leader.injury && (leader.injury.weeksLeft || 0) >= 8) {
        return { factionId: f.id, reason: 'longInjury' };
      }
    }
    return null;
  },

  // ── §8 週次イベント抽選（F03 > F02 > F01 の優先順）──
  // return: { eventId:'F01'|'F02'|'F03'|null, payload }
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

    // 2) F02（派閥抗争勃発、確率 80%）
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

    // 3) F01（忠誠型結成、確率 60%、拒否クールダウン対応）
    const loyalCheck = this.checkLoyalFormationConditions(state);
    if (loyalCheck.eligible) {
      const cdUntil = (state.factionEventCooldowns || {}).F01_rejected_until || 0;
      const now = this._absWeek(state);
      if (now >= cdUntil && Engine.rng.float(rng) < cfg.eventProbability.F01) {
        return {
          eventId: 'F01',
          payload: {
            leaderId: loyalCheck.leaderId,
            leaderName: loyalCheck.leaderName,
            followerIds: loyalCheck.followerIds,
          },
        };
      }
    }

    return { eventId: null };
  },

  // ── §9.1 F01 選択肢効果適用 ──
  // choiceId: 'A'=権威化 / 'B'=拒否 / 'C'=静観
  applyF01Choice(state, payload, choiceId, rng) {
    const { leaderId, leaderName, followerIds } = payload;
    let s = state;
    const members = [leaderId, ...followerIds];

    if (choiceId === 'A') {
      // 派閥成立 + authoritativeTag + リーダー trust +5〜+8 + メンバー間 bond +3〜+5 + 士気 -2〜-4
      s = this.createFaction(s, leaderId, members, { type: 'loyal', authoritativeTag: true });
      const rawTrust = 5 + Math.floor(Engine.rng.float(rng) * 4); // 5〜8
      s = this._applyTrustToMembers(s, [leaderId], rawTrust);
      const bondDelta = 3 + Math.floor(Engine.rng.float(rng) * 3); // 3〜5
      s = this._applyBondBetweenMembers(s, members, bondDelta);
      const moralePen = -(2 + Math.floor(Engine.rng.float(rng) * 3)); // -2〜-4
      s = this._applyLockerRoomMorale(s, moralePen);
      return { state: s, resultText: `${leaderName}を中心に派閥「${leaderName}組」が旗揚げされた。` };
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
    // 'C' 静観
    s = this.createFaction(s, leaderId, members, { type: 'loyal' });
    return { state: s, resultText: `${leaderName}を中心とした集まりを静かに見守ることにした。` };
  },

  // ── §9.2 F02 選択肢効果適用（派閥抗争の勃発）──
  // choiceId: 'A'=派閥A側 / 'B'=派閥B側 / 'C'=調停 / 'D'=静観
  // 既存の2派閥に inHostility フラグを立て、対立度・勢いを注入する
  applyF02Choice(state, payload, choiceId, rng) {
    const { factionAId, factionBId, leaderAId, leaderBId, leaderAName, leaderBName, avgCrossRivalry } = payload;
    let s = state;

    // 両派閥に inHostility フラグを立てる（A/B/C/D 全ケースで抗争状態に入る）
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

    if (choiceId === 'A' || choiceId === 'B') {
      const favored = choiceId === 'A' ? A : B;
      const neglected = choiceId === 'A' ? B : A;
      const favoredLeaderId = choiceId === 'A' ? leaderAId : leaderBId;
      const neglectedLeaderId = choiceId === 'A' ? leaderBId : leaderAId;
      const favTrust = 5 + Math.floor(Engine.rng.float(rng) * 4);
      const negTrust = -(5 + Math.floor(Engine.rng.float(rng) * 4));
      s = this._applyTrustToMembers(s, [favoredLeaderId], favTrust);
      s = this._applyTrustToMembers(s, [neglectedLeaderId], negTrust);
      const h1 = 55 + Math.floor(Engine.rng.float(rng) * 16);
      const h2 = 65 + Math.floor(Engine.rng.float(rng) * 16);
      s = this.applyHostilityChange(s, favored.id, neglected.id, h1);
      s = this.applyHostilityChange(s, neglected.id, favored.id, h2);
      const mf = 20 + Math.floor(Engine.rng.float(rng) * 11);
      const mn = -(10 + Math.floor(Engine.rng.float(rng) * 11));
      s = this.applyMomentumChange(s, favored.id, mf);
      s = this.applyMomentumChange(s, neglected.id, mn);
      return {
        state: s,
        resultText: choiceId === 'A'
          ? `${leaderAName}側に立つ方針を取った。${leaderBName}には割り切った眼差しが残る。`
          : `${leaderBName}側に立つ方針を取った。${leaderAName}には割り切った眼差しが残る。`,
      };
    }
    if (choiceId === 'C') {
      const t1 = -(3 + Math.floor(Engine.rng.float(rng) * 3));
      const t2 = -(3 + Math.floor(Engine.rng.float(rng) * 3));
      s = this._applyTrustToMembers(s, [leaderAId], t1);
      s = this._applyTrustToMembers(s, [leaderBId], t2);
      const h = 30 + Math.floor(Engine.rng.float(rng) * 16);
      s = this.applyHostilityChange(s, A.id, B.id, h);
      s = this.applyHostilityChange(s, B.id, A.id, h);
      return { state: s, resultText: `両者を呼び出し、団体のために筋を通させた。空気は張り詰めたまま。` };
    }
    // 'D' 静観
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
    return 'OK'; // F03 は選択肢なし
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
  applyMatchResult(state, fighterIdA, fighterIdB, result, rng) {
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

    // 勝者/敗者判定（result.winner: 'A'|'B'|'draw'）
    const winner = result && result.winner;
    if (winner !== 'A' && winner !== 'B') return s;

    const winnerFaction = winner === 'A' ? fA : fB;
    const loserFaction = winner === 'A' ? fB : fA;
    const isLeaderMatch = aIsLeader && bIsLeader;

    // 勢い変動
    const [mlo, mhi] = isLeaderMatch ? cfg.momentumLeaderBonus : cfg.momentumSeniorBonus;
    const bump = mlo + Math.floor(Engine.rng.float(rng) * (mhi - mlo + 1));
    s = this.applyMomentumChange(s, winnerFaction.id, bump);
    s = this.applyMomentumChange(s, loserFaction.id, -bump);

    // 対立度変動: 敗者派閥 → 勝者派閥 +3〜+5
    const hostBump = 3 + Math.floor(Engine.rng.float(rng) * 3);
    s = this.applyHostilityChange(s, loserFaction.id, winnerFaction.id, hostBump);
    if (isLeaderMatch) {
      s = this.applyHostilityChange(s, loserFaction.id, winnerFaction.id, hostBump);
    }

    return s;
  },
};
