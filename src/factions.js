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

  // ── §2.1 対立型発生条件（簡易BFS連結成分）─────────────────
  checkRivalrousFormationConditions(state) {
    const cfg = FACTION_CONFIG;
    const roster = (state.roster || []).filter(c => !c.isRental);
    if (roster.length <= cfg.minRosterSize) return { eligible: false };
    const factionCount = (state.factions || []).length;
    if (factionCount > 1) return { eligible: false };

    // 既に派閥所属のメンバーは除外対象（対立型は無派閥から新規クラスタを探す）
    const assigned = new Set();
    (state.factions || []).forEach(f => f.memberIds.forEach(id => assigned.add(id)));
    const pool = roster.filter(c => !assigned.has(c.id));
    if (pool.length < 6) return { eligible: false };

    // BFS: 相互bond >= threshold のペアで連結成分
    const idSet = new Set(pool.map(c => c.id));
    const visited = new Set();
    const clusters = [];
    for (const c of pool) {
      if (visited.has(c.id)) continue;
      const queue = [c.id];
      const cluster = [];
      visited.add(c.id);
      while (queue.length) {
        const cur = queue.shift();
        cluster.push(cur);
        for (const other of pool) {
          if (visited.has(other.id) || !idSet.has(other.id)) continue;
          const bondAB = this._getBond(state, cur, other.id);
          const bondBA = this._getBond(state, other.id, cur);
          if (bondAB >= cfg.rivalrousBondThreshold && bondBA >= cfg.rivalrousBondThreshold) {
            visited.add(other.id);
            queue.push(other.id);
          }
        }
      }
      if (cluster.length >= 3) clusters.push(cluster);
    }

    if (clusters.length < 2) return { eligible: false };

    // 上位2クラスタ（サイズ降順）間の平均rivalry
    clusters.sort((a, b) => b.length - a.length);
    const [A, B] = [clusters[0], clusters[1]];
    let sum = 0, count = 0;
    for (const a of A) for (const b of B) {
      sum += this._getRivalry(state, a, b);
      sum += this._getRivalry(state, b, a);
      count += 2;
    }
    const avgRivalry = count ? sum / count : 0;
    if (avgRivalry < cfg.rivalrousRivalryThreshold) return { eligible: false };

    // 各クラスタのリーダー = OVR最上位
    const pickLeader = (ids) => {
      let best = ids[0], bestOvr = -1;
      for (const id of ids) {
        const f = roster.find(c => c.id === id);
        if (!f) continue;
        const ovr = Engine.util.ov(f);
        if (ovr > bestOvr) { best = id; bestOvr = ovr; }
      }
      return best;
    };

    return {
      eligible: true,
      clusterA: { leaderId: pickLeader(A), memberIds: A },
      clusterB: { leaderId: pickLeader(B), memberIds: B },
      avgRivalry,
    };
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
      if (f.type !== 'rivalrous') return f; // §5.3 忠誠型は勢い適用外
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
    return { ...state, factionHostility: newHost };
  },

  // ── §5.2 週次勢い減衰 ─────────────────────────────────────
  processWeeklyMomentumDecay(state) {
    const cfg = FACTION_CONFIG;
    const factions = (state.factions || []).map(f => {
      if (f.type !== 'rivalrous') return { ...f, momentum: 0 };
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
        if (f.type === 'rivalrous') {
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
        if (f.type === 'rivalrous') {
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
      if (f.type === 'rivalrous' && f.momentum < -60) {
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
        if (f.type !== 'rivalrous') return f;
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
      const rival = (s.factions || []).find(f => f.id !== factionId && f.type === 'rivalrous');
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
      .map(f => f.type === 'rivalrous' ? { ...f, momentum: Engine.util.clamp(f.momentum - 4, -100, 100) } : f);
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
