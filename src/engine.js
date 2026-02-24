// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 5: ENGINE CORE (v0.9)                            ║
// ║  Pure logic layer — no DOM references                     ║
// ╚══════════════════════════════════════════════════════════╝

const Engine = {
  // ── RNG: Seeded xorshift128+ ──────────────────────────
  rng: {
    create(seed) {
      seed = seed | 0;
      if (seed === 0) seed = 1;
      // Splitmix64-style seed expansion for two 32-bit state words
      let s0 = seed;
      s0 = ((s0 >>> 16) ^ s0) * 0x45d9f3b | 0;
      s0 = ((s0 >>> 16) ^ s0) * 0x45d9f3b | 0;
      s0 = (s0 >>> 16) ^ s0;
      let s1 = seed * 1812433253 + 1;
      s1 = ((s1 >>> 16) ^ s1) * 0x45d9f3b | 0;
      s1 = ((s1 >>> 16) ^ s1) * 0x45d9f3b | 0;
      s1 = (s1 >>> 16) ^ s1;
      if (s0 === 0 && s1 === 0) s0 = 1;
      return { s0, s1 };
    },
    _next(state) {
      let s1 = state.s0;
      const s0 = state.s1;
      state.s0 = s0;
      s1 ^= s1 << 23;
      s1 ^= s1 >>> 17;
      s1 ^= s0;
      s1 ^= s0 >>> 26;
      state.s1 = s1;
      return ((state.s0 + state.s1) >>> 0);
    },
    float(rng) {
      // Returns [0, 1)
      return Engine.rng._next(rng) / 4294967296;
    },
    int(rng, min, max) {
      return min + Math.floor(Engine.rng.float(rng) * (max - min + 1));
    },
    pick(rng, arr) {
      return arr[Math.floor(Engine.rng.float(rng) * arr.length)];
    },
    weighted(rng, weights) {
      // weights: {key: weight, ...} — returns key
      const entries = Object.entries(weights);
      const total = entries.reduce((s, [, v]) => s + v, 0);
      let r = Engine.rng.float(rng) * total;
      for (const [k, v] of entries) {
        r -= v;
        if (r <= 0) return k;
      }
      return entries[entries.length - 1][0];
    },
    // Derive a sub-seed for a specific context
    derive(baseSeed, ...keys) {
      let h = baseSeed | 0;
      for (const k of keys) {
        h = ((h << 5) - h + (typeof k === 'number' ? k : 0)) | 0;
        h = ((h >>> 16) ^ h) * 0x45d9f3b | 0;
      }
      return h || 1;
    }
  },

  // ── Utilities ──────────────────────────────────────────
  util: {
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    ov(c) { return Math.round((c.pw + c.sp + c.te + c.st + c.mn) / 5); },
    isShowWeek(w) { return w % 2 === 0; },
    getQuarter(w) { return Math.ceil(w / 12); },
    /** Pick N items from array using seeded shuffle (deterministic per season+quarter) */
    seededPick(arr, n, seed) {
      if (arr.length <= n) return [...arr];
      const rng = Engine.rng.create(seed);
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Engine.rng.int(rng, 0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, n);
    },
    /** Compute visible FA IDs for this quarter (6 slots) */
    getVisibleFAIds(state) {
      const fa = state.freeAgents || [];
      if (fa.length <= 6) return fa.map(c => c.id);
      const seed = (state.rngSeed || 42) ^ ((state.season || 1) * 1000 + Engine.util.getQuarter(state.week || 1) * 100 + 0xFA);
      return Engine.util.seededPick(fa.map(c => c.id), 6, seed);
    },
    /** Compute visible Rental IDs for this quarter (10 slots) */
    getVisibleRentalIds(state) {
      const rentals = Engine.rental.getAvailableRentals(state);
      if (rentals.length <= 10) return rentals.map(r => r.fighter.id);
      const seed = (state.rngSeed || 42) ^ ((state.season || 1) * 1000 + Engine.util.getQuarter(state.week || 1) * 100 + 0xBE);
      return Engine.util.seededPick(rentals.map(r => r.fighter.id), 10, seed);
    },
    /**
     * 全プール（自団体・AI団体・FA・スカウト候補）から占有済み characterDefId を収集する。
     * FA/スカウト生成時の重複除外および契約確定時の最終チェックに使用。
     */
    collectOccupiedCharacterDefIds(state) {
      const occupied = new Set();
      // プレイヤーロスター
      (state.roster || []).forEach(c => occupied.add(c.id));
      // AI団体ロスター
      Object.values(state.aiOrgs || {}).forEach(org => {
        (org.roster || []).forEach(c => occupied.add(c.id));
      });
      // FA一覧
      (state.freeAgents || []).forEach(c => occupied.add(c.id));
      // スカウト候補一覧（イベント中のみ存在）
      (state.scoutCandidates || []).forEach(c => occupied.add(c.id));
      return occupied;
    },
    isSpecialShow(w) { return w % 12 === 0; },
    isPPV(w) { return w === 48; },
    eff(x) {
      if (x <= ENG.effPivot) return x;
      return ENG.effPivot + (x - ENG.effPivot) * ENG.effSlopeAfterPivot;
    },
    getSalary(c) {
      const o = Engine.util.ov(c);
      for (const s of SALARY_TABLE) if (o <= s.max) return s.pay;
      return 200;
    },
    getPotentialPct(char) {
      const stats = ['pw','sp','te','st','mn'];
      const current = stats.reduce((s, k) => s + char[k], 0);
      const cap = stats.reduce((s, k) => s + (char.trainCap ? char.trainCap[k] : (char.pot ? char.pot[k] : char[k])), 0);
      return cap > 0 ? Math.round(current / cap * 100) : 100;
    }
  },

  // ── Battle Engine (DOM-free) ──────────────────────────
  battle: {
    phase(t) {
      return PHASES.find(p => t >= p.min && t <= p.max) || PHASES[3];
    },
    selMove(rng, style, turn) {
      const ph = Engine.battle.phase(turn);
      const use = Engine.rng.float(rng) * 100 < ph.sCh;
      const pool = use ? styleMoves[style] : commonMoves;
      const cat = Engine.rng.weighted(rng, catW[style]);
      const cands = pool.filter(m => m.c === cat);
      return cands.length ? Engine.rng.pick(rng, cands) : Engine.rng.pick(rng, pool);
    },
    calcHitRate(mv, atk, def) {
      const eff = Engine.util.eff;
      const baseAcc = ENG.hitBase[Math.min(mv.d, 16)] || 70;
      let rate = baseAcc + (eff(atk.te) * ENG.tecHitBonus) - (eff(def.sp) * ENG.spdDodgeBonus);
      // 威圧感: 相手の命中率を低下させる
      if (Traits.has(def, '威圧感')) rate -= 3;
      return Engine.util.clamp(rate, ENG.hitMin, ENG.hitMax);
    },
    calcCounterRate(atk, def, ph) {
      const eff = Engine.util.eff;
      let rate = ENG.counterBase + (eff(def.te) * ENG.counterTecScale) - (eff(atk.sp) * ENG.counterSpdPenalty) + ph.counterBonus;
      if (def.gritTurns > 0) rate += ENG.gritCounterBonus;
      // 威圧感: 相手のカウンター率を低下させる
      if (Traits.has(atk, '威圧感')) rate -= 3;
      return Engine.util.clamp(rate, ENG.counterMin, ENG.counterMax);
    },
    calcDamage(rng, mv, atk, def, mom, atkSide, ph) {
      const eff = Engine.util.eff;
      const base = mv.d + (eff(atk.pw) * ENG.dmgPwrScale) + (eff(atk.te) * ENG.dmgTecScale)
        + (mv.c === 'aerial' ? eff(atk.sp) * ENG.dmgSpdScale : 0);
      const defense = (eff(def.st) * ENG.defStaScale) + (def.mn * ENG.defMntScale);
      const mAdv = atkSide === 'left' ? mom : -mom;
      const mMod = 1 + (mAdv * ENG.momDmgScale);
      const rF = ENG.dmgRandMin + (Engine.rng.float(rng) * ENG.dmgRandRange);
      let raw = (base - defense) * mMod * rF * ph.mult;
      if (def.gritTurns > 0) raw *= (1 - ENG.gritDmgReduction);
      return Math.max(ENG.dmgFloor, Math.round(raw));
    },
    determineFinishType(rng, mv) {
      return Engine.rng.weighted(rng, ENG.finishWeights[mv.c] || ENG.finishWeights.strike);
    },
    calcKickoutChance(def, ph) {
      let chance = (def.mn / 100) * ENG.kickoutMnScale;
      if (ph.name === 'Climax') chance *= ENG.kickoutClimaxMult;
      // 闘志: HP低下時のキックアウト率UP
      if (Traits.has(def, '闘志') && def.hp / def.mhp < 0.3) chance += 0.08;
      chance = Engine.util.clamp(chance, 0.05, 0.45);
      if (def.kickoutCount >= ENG.kickoutMax) chance = 0;
      return chance;
    },
    calcGuEscapeChance(def, ph) {
      let chance = (def.mn / 100) * ENG.guEscapeMnScale;
      if (ph.name === 'Climax') chance *= 0.8;
      chance = Engine.util.clamp(chance, 0.05, 0.40);
      if (def.kickoutCount >= ENG.guEscapeMax) chance = 0;
      return chance;
    },
    checkPinAttempt(rng, mv, atk, def, dmg, mom, atkSide, ph) {
      if (def.hp <= 0) return false;
      if (def.hp / def.mhp > ENG.pinAttemptHpThreshold) return false;
      if (dmg < ENG.pinAttemptMinDmg) return false;
      if (ph.name === 'Opening') return false;
      let attemptRate = ENG.pinAttemptBaseRate;
      const mAdv = atkSide === 'left' ? mom : -mom;
      attemptRate += mAdv * ENG.pinAttemptMomBonus;
      if (ph.name === 'Climax') attemptRate += 15;
      if (ph.name === 'End') attemptRate += 8;
      return Engine.rng.float(rng) * 100 < Engine.util.clamp(attemptRate, 10, 60);
    },
    calcPinAttemptSuccess(atk, def, dmg, ph) {
      let rate = ENG.pinAttemptSuccessBase + (dmg * 0.5) - (def.mn * ENG.pinAttemptMntPenalty);
      if (ph.name === 'Climax') rate += ENG.pinAttemptClimax;
      if (def.gritTurns > 0) rate -= 10;
      return Engine.util.clamp(rate, 8, 55);
    },

    // Main match simulation — pure function, no DOM
    simulateMatch(charL, charR, rng) {
      const clamp = Engine.util.clamp;
      const B = Engine.battle;

      const eff = Engine.util.eff;
      const L = {
        ...charL, hp: Math.round(eff(charL.st) * ENG.hpScale),
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };
      L.mhp = L.hp;
      const R = {
        ...charR, hp: Math.round(eff(charR.st) * ENG.hpScale),
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };
      R.mhp = R.hp;

      let mom = 0, turn = 1, log = [], winner = null, finType = null, finMove = null;
      // 威圧感: 序盤モメンタム優位（左+/右-）
      if (Traits.has(charL, '威圧感') && !Traits.has(charR, '威圧感')) mom += 5;
      if (Traits.has(charR, '威圧感') && !Traits.has(charL, '威圧感')) mom -= 5;
      let totalCounters = 0, totalKickouts = 0, leadChanges = 0, lastLeader = null, bigMoves = 0;

      while (turn <= MAX_T && !winner) {
        const ph = B.phase(turn);
        const leftChance = 50 + mom * 0.3;
        const isLeftAtk = Engine.rng.float(rng) * 100 < leftChance;
        const atk = isLeftAtk ? L : R;
        const def = isLeftAtk ? R : L;
        const atkSide = isLeftAtk ? 'left' : 'right';

        const mv = B.selMove(rng, atk.style, turn);
        const hitRate = B.calcHitRate(mv, atk, def);
        const roll = Engine.rng.float(rng) * 100;

        if (roll > hitRate) {
          log.push(`T${turn}: ${atk.name}の${mv.n} → MISS`);
          mom += isLeftAtk ? -5 : 5;
        } else {
          const counterRate = B.calcCounterRate(atk, def, ph);
          if (Engine.rng.float(rng) * 100 < counterRate) {
            const cDmg = Math.max(ENG.dmgFloor, Math.round(mv.d * ENG.counterDmgMult));
            atk.hp -= cDmg;
            mom += isLeftAtk ? -ENG.counterMomShift : ENG.counterMomShift;
            def.consecutiveHits = 0;
            totalCounters++;
            log.push(`T${turn}: ${atk.name}の${mv.n} → カウンター！ ${atk.name}に${cDmg}ダメージ`);
          } else {
            const dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
            def.hp -= dmg;
            mom += isLeftAtk ? 8 : -8;
            atk.consecutiveHits++;
            def.consecutiveHits = 0;
            if (dmg >= 10) bigMoves++;
            const curLeader = mom > 5 ? 'left' : mom < -5 ? 'right' : null;
            if (curLeader && curLeader !== lastLeader) { leadChanges++; lastLeader = curLeader; }

            if (L.gritTurns > 0) L.gritTurns--;
            if (R.gritTurns > 0) R.gritTurns--;

            const dmgStr = dmg >= 15 ? `${dmg}の大ダメージ！` : `${dmg}ダメージ`;
            log.push(`T${turn}: ${atk.name}の${mv.n} → ${def.name}に${dmgStr} (HP:${Math.max(0, def.hp)}/${def.mhp})`);

            if (def.hp <= 0) {
              const fType = B.determineFinishType(rng, mv);
              const finLabel = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
              let escaped = false;
              if (fType === 'fall' || fType === 'tko') {
                const koChance = B.calcKickoutChance(def, ph);
                if (Engine.rng.float(rng) < koChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  def.gritTurns = ENG.gritDuration;
                  log.push(`  → ${def.name}がキックアウト！ Grit発動！`);
                }
              } else if (fType === 'gu') {
                const escChance = B.calcGuEscapeChance(def, ph);
                if (Engine.rng.float(rng) < escChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  def.gritTurns = ENG.gritDuration;
                  log.push(`  → ${def.name}がロープエスケープ！ Grit発動！`);
                  totalKickouts++;
                }
              }
              if (!escaped) {
                winner = atkSide;
                finType = finLabel;
                finMove = mv.n;
                log.push(`★ ${atk.name}、${mv.n}で${finLabel}勝ち！`);
              }
            }
            else if (!winner && B.checkPinAttempt(rng, mv, atk, def, dmg, mom, atkSide, ph)) {
              const successRate = B.calcPinAttemptSuccess(atk, def, dmg, ph);
              if (Engine.rng.float(rng) * 100 < successRate) {
                winner = atkSide;
                finType = 'ピン';
                finMove = mv.n;
                log.push(`★ ${atk.name}、${mv.n}からのフォールで3カウント！`);
              } else {
                def.gritTurns = ENG.gritDuration;
                log.push(`  → フォール！ だが${def.name}がカウント2で返した！`);
                totalKickouts++;
              }
            }
            else if (!winner && mv.c === 'rollup' && def.hp / def.mhp < ENG.rollupHpThreshold) {
              let rSuccess = ENG.rollupBaseSuccess + (Engine.util.eff(atk.te) * ENG.rollupTecBonus);
              // 番狂わせ体質: 格上相手の丸め込み成功率UP
              if (Traits.has(atk, '番狂わせ体質') && Engine.util.ov(def) > Engine.util.ov(atk)) rSuccess += 8;
              if (Engine.rng.float(rng) * 100 < rSuccess) {
                winner = atkSide;
                finType = '丸め込み';
                finMove = mv.n;
                log.push(`★ ${atk.name}、まさかの${mv.n}で3カウント！ 大金星！`);
              }
            }
            else if (!winner && atk.consecutiveHits >= ENG.tkoConsecutiveThreshold
                     && def.hp / def.mhp < ENG.tkoHpThreshold) {
              if (Engine.rng.float(rng) * 100 < ENG.tkoBaseRate) {
                winner = atkSide;
                finType = 'TKO';
                finMove = mv.n;
                log.push(`★ レフェリーストップ！ ${atk.name}のTKO勝利！`);
              }
            }
          }
        }
        mom = clamp(mom, -50, 50);
        turn++;
      }

      if (!winner) {
        if (L.hp === R.hp) {
          winner = 'draw';
          finType = '時間切れドロー';
        } else {
          winner = L.hp > R.hp ? 'left' : 'right';
          finType = 'HP判定';
        }
        log.push(`⏰ 時間切れ！ ${winner === 'draw' ? 'ドロー' : (winner === 'left' ? L.name : R.name) + 'のHP判定勝ち'}`);
      }

      // Calculate MQ
      const matchTurns = turn - 1;
      const avgOV = (Engine.util.ov(charL) + Engine.util.ov(charR)) / 2;
      let mq = 0;
      mq += Math.min(30, avgOV * 0.35);
      const lengthScore = matchTurns <= 8 ? matchTurns * 1.5 : matchTurns <= 15 ? 12 + (matchTurns - 8) * 1.0 :
        matchTurns <= 30 ? 19 + Math.min(1, (matchTurns - 15) * 0.07) : 20 - (matchTurns - 30) * 0.3;
      mq += Math.max(0, Math.min(20, lengthScore));
      mq += Math.min(15, totalCounters * 3);
      mq += Math.min(20, totalKickouts * 8);
      mq += Math.min(10, leadChanges * 2.5);
      mq += Math.min(5, bigMoves * 0.8);
      // 名勝負製造機: MQに+5ボーナス
      if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')) mq += 5;
      // 引き出し上手: 格下とのMQが下がりにくい（OV差が大きい場合にMQ底上げ）
      const ovDiff = Math.abs(Engine.util.ov(charL) - Engine.util.ov(charR));
      if (ovDiff > 15 && (Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手'))) mq += Math.min(8, ovDiff * 0.3);
      mq = Math.round(Engine.util.clamp(mq, 5, 100));

      return {
        left: charL, right: charR,
        winner, finType, finMove,
        turns: matchTurns,
        hpLeft: { final: Math.max(0, L.hp), max: L.mhp },
        hpRight: { final: Math.max(0, R.hp), max: R.mhp },
        mq, log
      };
    }
  },

  // ── Popularity System (v1.0b) ─────────────────────────────
  popularity: {
    // §A: Diminishing returns curve (steep)
    getDiminishingMultiplier(currentPop) {
      if (currentPop < 20) return 1.0;
      if (currentPop < 35) return 0.6;
      if (currentPop < 50) return 0.35;
      if (currentPop < 65) return 0.18;
      if (currentPop < 80) return 0.13;
      return 0.10; // 80-99
    },
    applyDiminishing(rawGain, currentPop) {
      if (rawGain <= 0) return rawGain; // penalties are not diminished
      const mult = Engine.popularity.getDiminishingMultiplier(currentPop);
      return Math.max(0, Math.round(rawGain * mult));
    },
    // §B-1: Losing streak penalty
    checkLosingStreak(fighter, isWinner) {
      let streak = fighter.losingStreak || 0;
      if (isWinner) return { losingStreak: 0, popDelta: 0, msg: null };
      streak += 1;
      for (let i = LOSING_STREAK_PENALTIES.length - 1; i >= 0; i--) {
        const lsp = LOSING_STREAK_PENALTIES[i];
        if (streak === lsp.threshold) {
          return { losingStreak: streak, popDelta: lsp.penalty, msg: `📉 ${fighter.name}に${lsp.msg}（連敗${streak}）` };
        }
      }
      return { losingStreak: streak, popDelta: 0, msg: null };
    },
    // §B-2: Scandal (random event)
    checkScandal(rng, fighter, isChamp) {
      if (fighter.popularity < SCANDAL_CONFIG.minPop) return null;
      const chance = isChamp ? SCANDAL_CONFIG.champChance : SCANDAL_CONFIG.baseChance;
      if (Engine.rng.float(rng) >= chance) return null;
      const penalty = -(SCANDAL_CONFIG.penaltyMin + Engine.rng.int(rng, 0, SCANDAL_CONFIG.penaltyMax - SCANDAL_CONFIG.penaltyMin));
      const msg = SCANDAL_CONFIG.messages[Engine.rng.int(rng, 0, SCANDAL_CONFIG.messages.length - 1)];
      return { popDelta: penalty, msg: `${msg}（${fighter.name}: 人気${penalty}）` };
    },
    // §B-3: Injury forgetting — record pre-injury pop and decay weekly
    recordPreInjury(fighter) {
      if (fighter.preInjuryPop != null) return fighter; // already recorded
      return { ...fighter, preInjuryPop: fighter.popularity };
    },
    applyInjuryDecay(fighter) {
      if (!fighter.injury) return fighter;
      const floor = Math.round((fighter.preInjuryPop || fighter.popularity) * 0.5);
      const newPop = Math.max(floor, Math.max(1, fighter.popularity - 1));
      return { ...fighter, popularity: newPop };
    },
    clearPreInjury(fighter) {
      return { ...fighter, preInjuryPop: null };
    },
    // §B-4: Main event poor match penalty
    checkMainEventPenalty(mq) {
      if (mq < 25) return -5;
      if (mq < 35) return -3;
      if (mq < 45) return -1;
      return 0;
    },
    // §B-5: Transfer popularity reset (×0.75)
    applyTransferReset(fighter) {
      const newPop = Math.max(1, Math.round(fighter.popularity * TRANSFER_POP_MULT));
      return { ...fighter, popularity: newPop };
    },
    // §D: Roster popularity score for goods revenue
    calcRosterPopScore(roster) {
      const sorted = [...roster].filter(c => !c.injury).sort((a, b) => b.popularity - a.popularity);
      let totalWeight = 0, weightedPop = 0;
      sorted.forEach((c, i) => {
        let weight = i === 0 ? 3 : i < 3 ? 2 : 1;
        if (Traits.has(c, '華')) weight *= 1.3;
        if (Traits.has(c, 'ファンサービス')) weight *= 1.2;
        if (Traits.has(c, 'ヒール適性') && (c.role === 'Heel' || c.role === 'Dirty')) weight *= 1.2;
        totalWeight += weight;
        weightedPop += c.popularity * weight;
      });
      return totalWeight > 0 ? weightedPop / totalWeight : 0;
    }
  },

  // ── Economy (DOM-free) ─────────────────────────────────
  economy: {
    calcWeeklySalary(roster) {
      return roster.filter(c => !c.isRental).reduce((sum, c) => sum + Engine.util.getSalary(c), 0);
    },
    calcFixedCosts() {
      return FIXED_COSTS.facility + FIXED_COSTS.admin;
    },
    getSponsorIncome(orgPop) {
      for (const s of SPONSOR_TABLE) if (orgPop >= s.min && orgPop <= s.max) return s.val;
      return 0;
    },
    getBroadcastIncome(orgPop) {
      for (const b of BROADCAST_TABLE) if (orgPop >= b.min && orgPop <= b.max) return b.val;
      return 0;
    },
    // v1.0c: Card pop — 積み上げ方式（メイン=フル、サブ=SUB_WEIGHT、深度乗数）
    calcCardPop(matchPops) {
      if (matchPops.length === 0) return 0;
      const sorted = [...matchPops].sort((a, b) => b - a);
      let cardPop = sorted[0]; // メイン試合はフルウェイト
      for (let i = 1; i < sorted.length; i++) {
        cardPop += sorted[i] * CARD_POP_CONFIG.SUB_WEIGHT;
      }
      const depthIdx = Math.min(sorted.length, CARD_DEPTH_MULT.length) - 1;
      cardPop *= CARD_DEPTH_MULT[depthIdx];
      return cardPop;
    },
    calcAttendance(G, venueIdx, mainCardPop, hasTitleMatch, hasChampOnCard) {
      const v = VENUES[venueIdx];
      // v1.0b: Capacity-independent base attendance (quadratic on orgPop)
      const baseAttendance = Math.round((G.orgPop / 100) * (G.orgPop / 100) * 5000);
      // v1.0c: CARD_MULT (was hardcoded * 3)
      const cardBonus = Math.round(mainCardPop * CARD_POP_CONFIG.CARD_MULT);
      const heatMult = Engine.heat.getMult(G);
      const titleMult = hasTitleMatch ? 1.15 : 1.0;
      // v1.2: チャンピオン出場ボーナス +10%
      const champMult = hasChampOnCard ? 1.10 : 1.0;
      // 華: ロスターに華持ちがいれば集客+5%
      const charismaMult = (G.roster && G.roster.some(c => Traits.has(c, '華') && !c.injury)) ? 1.05 : 1.0;
      const rawAttendance = Math.round((baseAttendance + cardBonus) * heatMult * titleMult * champMult * charismaMult);
      // Minimum guarantee: 5% of capacity (at least 10)
      const minAttendance = Math.max(10, Math.round(v.cap * 0.05));
      return Engine.util.clamp(rawAttendance, minAttendance, v.cap);
    },
    // v1.0c: 会場熱気MQボーナス（満員率 + 会場規模）
    calcCrowdMQBonus(venueIdx, occupancyRate) {
      const crowdEntry = CROWD_HEAT_MQ.find(c => occupancyRate >= c.min)
        || CROWD_HEAT_MQ[CROWD_HEAT_MQ.length - 1];
      const crowdBonus = crowdEntry.bonus;
      const scaleBonus = VENUE_SCALE_MQ[venueIdx] || 0;
      return { total: crowdBonus + scaleBonus, crowdBonus, scaleBonus, crowdLabel: crowdEntry.label };
    },
    calcShowRevenue(roster, venueIdx, attendance) {
      const v = VENUES[venueIdx];
      // v1.0b: Unified ticket price + occupancy bonus
      const rawTicketRev = Math.round(attendance * TICKET_PRICE);
      const occupancyRate = attendance / v.cap;
      const occBonus = OCCUPANCY_BONUS.find(b => occupancyRate >= b.min) || OCCUPANCY_BONUS[OCCUPANCY_BONUS.length - 1];
      const ticketRev = Math.round(rawTicketRev * occBonus.ticketMult);
      // v1.0b: Goods revenue = attendance × GOODS_PRICE × rosterPopScore / 100
      const popScore = Engine.popularity.calcRosterPopScore(roster);
      const goodsRev = Math.round(attendance * GOODS_PRICE * popScore / 100);
      return { ticketRev, goodsRev, venueCost: v.cost, occupancyRate, occLabel: occBonus.label, occHeatDelta: occBonus.heatDelta };
    }
  },

  // ── Heat System (IMMUTABLE — returns new values, never mutates G) ──
  heat: {
    getLevel(G) {
      return HEAT_LEVELS.find(h => G.heatScore >= h.min && G.heatScore <= h.max) || HEAT_LEVELS[2];
    },
    getMult(G) { return Engine.heat.getLevel(G).mult; },
    calcUpdate(G, avgMQ) {
      let delta = avgMQ >= 75 ? 2 : avgMQ >= 60 ? 1 : avgMQ >= 40 ? 0 : avgMQ >= 25 ? -1 : -2;
      if (G.heatScore > 0 && delta <= 0) delta -= 0.5;
      if (G.heatScore < 0 && delta >= 0) delta += 0.5;
      return Engine.util.clamp(Math.round((G.heatScore + delta) * 10) / 10, -10, 10);
    },
    calcDecay(G) {
      let hs = G.heatScore;
      if (hs > 0) hs = Math.max(0, hs - 0.3);
      else if (hs < 0) hs = Math.min(0, hs + 0.3);
      return Math.round(hs * 10) / 10;
    }
  },

  // ── Injury System (IMMUTABLE — returns new objects, never mutates) ──
  injury: {
    check(rng, fighter, matchResult, facilityReduction, coachInjuryMult = 1.0) {
      if (!fighter) return null;
      const isLeft = matchResult.left.id === fighter.id;
      const hpData = isLeft ? matchResult.hpLeft : matchResult.hpRight;
      const hpRatio = hpData.final / hpData.max;
      const condFactor = (100 - fighter.condition) / 100;
      let injuryChance = Math.min(0.15, 0.025 + condFactor * 0.05 + (1 - hpRatio) * 0.04 + matchResult.turns * 0.0015);
      injuryChance *= coachInjuryMult;  // mental coach reduction
      // 頑丈さ: 怪我確率×0.7
      if (Traits.has(fighter, '頑丈さ')) injuryChance *= 0.7;
      // ガラスの身体: 怪我確率×1.4
      if (Traits.has(fighter, 'ガラスの身体')) injuryChance *= 1.4;
      if (Engine.rng.float(rng) > injuryChance) return null;
      const roll = Engine.rng.float(rng);
      const injury = roll < 0.65 ? INJURY_TABLE[0] : roll < 0.90 ? INJURY_TABLE[1] : INJURY_TABLE[2];
      let weeks = injury.minWeeks + Engine.rng.int(rng, 0, injury.maxWeeks - injury.minWeeks);
      // 不屈: 復帰期間-1週（最低1）
      if (Traits.has(fighter, '不屈')) weeks = Math.max(1, weeks - 1);
      // 鉄人: 復帰期間-1週（最低1）
      if (Traits.has(fighter, '鉄人')) weeks = Math.max(1, weeks - 1);
      const reducedWeeks = Math.max(1, weeks - facilityReduction);
      // v0.99: Reassess value on severe injury (pricing-balance-spec §4.2)
      let updatedFighter = { ...fighter, injury: { type: injury.type, weeksLeft: reducedWeeks, color: injury.color }, condition: Math.min(fighter.condition, 30) };
      // v1.0b: Record pre-injury popularity for injury forgetting
      updatedFighter = Engine.popularity.recordPreInjury(updatedFighter);
      if (injury.type === '重傷' && updatedFighter.assessedValue) {
        const injRng = Engine.rng.create(Engine.rng.derive(rng.state || 42, fighter.id, 888));
        const rv = Engine.scout.reassess(updatedFighter, 'severeInjury', injRng, 0);
        updatedFighter = { ...updatedFighter, ...rv };
      }
      // v1.3-1: 重傷時の引退チェック §4.2/§4.3 (独立した判定)
      let retireType = null;
      if (injury.type === '重傷') {
        const wear = fighter.wear || 0;
        // §4.2: wear + 重傷ボーナス(25) > 80 → 引退確定
        if (wear + 25 > 80) {
          retireType = 'wearInjury';
        }
        // §4.3: 壊滅的怪我 — 4.2とは独立した判定、年齢・wear問わず発生
        if (!retireType) {
          const careerEndChance = wear >= 40 ? 0.065 : 0.025; // 5-8% or 2-3%
          const ceRng = Engine.rng.create(Engine.rng.derive(rng.state || 42, fighter.id, 777));
          if (Engine.rng.float(ceRng) < careerEndChance) retireType = 'careerEnding';
        }
      }
      return {
        newFighter: updatedFighter,
        injuryInfo: { injury, reducedWeeks, originalWeeks: weeks },
        retireType  // null | 'wearInjury' | 'careerEnding'
      };
    },
    tick(roster, freeAgents) {
      const events = [];
      const newRoster = roster.map(c => {
        if (!c.injury) return c;
        const wl = c.injury.weeksLeft - 1;
        if (wl <= 0) {
          events.push(`✅ ${c.name}が${c.injury.type}から復帰！`);
          return Engine.popularity.clearPreInjury({ ...c, injury: null });
        }
        // v1.0b: Apply injury forgetting (popularity decay while injured)
        const decayed = Engine.popularity.applyInjuryDecay(c);
        return { ...decayed, injury: { ...c.injury, weeksLeft: wl } };
      });
      const newFA = freeAgents.map(c => {
        if (!c.injury) return c;
        const wl = c.injury.weeksLeft - 1;
        return wl <= 0 ? { ...c, injury: null } : { ...c, injury: { ...c.injury, weeksLeft: wl } };
      });
      return { roster: newRoster, freeAgents: newFA, events };
    }
  },

  // ── Title & Rivalry (IMMUTABLE — returns new objects, never mutates) ──
  title: {
    getRivalryKey(id1, id2) {
      return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    },
    getRivalry(G, id1, id2) {
      return G.rivalries[Engine.title.getRivalryKey(id1, id2)] || null;
    },
    getRivalryLevel(G, id1, id2) {
      const r = Engine.title.getRivalry(G, id1, id2);
      if (!r) return null;
      let best = null;
      for (const t of RIVALRY_THRESHOLDS) { if (r.matches >= t.matches) best = t; }
      return best;
    },
    // Returns { rivalries, msg }
    recordRivalry(G, id1, id2) {
      const key = Engine.title.getRivalryKey(id1, id2);
      const oldEntry = G.rivalries[key] || { matches: 0, lastWeek: 0 };
      const old = Engine.title.getRivalryLevel(G, id1, id2);
      // ライバル体質: 因縁カウント+1加速（通常1→2）
      const rivalryBonus = (Traits.has(G.roster.find(c=>c.id===id1)||{}, 'ライバル体質') || Traits.has(G.roster.find(c=>c.id===id2)||{}, 'ライバル体質')) ? 2 : 1;
      const newEntry = { matches: oldEntry.matches + rivalryBonus, lastWeek: G.week };
      const newRivalries = { ...G.rivalries, [key]: newEntry };
      const newLvl = Engine.title.getRivalryLevel({ ...G, rivalries: newRivalries }, id1, id2);
      let msg = null;
      if (newLvl && (!old || old.matches !== newLvl.matches)) {
        const c1 = G.roster.find(c => c.id === id1) || G.freeAgents.find(c => c.id === id1);
        const c2 = G.roster.find(c => c.id === id2) || G.freeAgents.find(c => c.id === id2);
        msg = `${newLvl.emoji} ${c1?.name || '?'} vs ${c2?.name || '?'} — ${newLvl.label}関係に発展！（MQ+${newLvl.mqBonus}）`;
      }
      return { rivalries: newRivalries, msg };
    },
    getWorldChampion(G) {
      if (!G.titles.world.championId) return null;
      return G.roster.find(c => c.id === G.titles.world.championId) || null;
    },
    // Returns { titles, roster, msg }
    crownChampion(G, fighterId) {
      const prev = Engine.title.getWorldChampion(G);
      const newTitles = { ...G.titles, world: { championId: fighterId, defenses: 0, wonWeek: G.week } };
      // v0.99: Reassess value on title win (pricing-balance-spec §4.2)
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, fighterId));
      // v1.3: Capture previous reign info before overwriting
      const prevReign = prev ? { wonWeek: G.titles.world.wonWeek, defenses: G.titles.world.defenses } : null;
      const newRoster = G.roster.map(c => {
        // v1.3: Record titleLoss for previous champion
        if (prev && c.id === prev.id) {
          return Engine.career.recordTitleLoss(c, 'world', G.season, G.week, prevReign.defenses);
        }
        if (c.id !== fighterId) return c;
        const reassessed = Engine.scout.reassess(c, 'titleWin', rng, G.season);
        const titlePopGain = Engine.popularity.applyDiminishing(5, c.popularity);
        // v1.3: Record titleWin for new champion
        let updated = { ...c, popularity: Math.min(100, c.popularity + titlePopGain), ...reassessed };
        return Engine.career.recordTitleWin(updated, 'world', G.season, G.week);
      });
      const c = G.roster.find(r => r.id === fighterId);
      const msg = prev
        ? `🏆 王座交代！ ${c?.name} が新チャンピオンに！（前王者: ${prev.name}）`
        : `🏆 ${c?.name} が初代団体王者に戴冠！`;
      return { titles: newTitles, roster: newRoster, msg };
    },
    // Returns { titles, roster, msg }
    recordDefense(G) {
      const newDefenses = G.titles.world.defenses + 1;
      const newTitles = { ...G.titles, world: { ...G.titles.world, defenses: newDefenses } };
      const champId = G.titles.world.championId;
      // v0.99: Reassess value on 3rd defense (pricing-balance-spec §4.2)
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, champId, 333));
      const newRoster = G.roster.map(c => {
        if (c.id !== champId) return c;
        let updated = { ...c, popularity: Math.min(100, c.popularity + Engine.popularity.applyDiminishing(2, c.popularity)) };
        if (newDefenses === 3) {
          const reassessed = Engine.scout.reassess(updated, 'titleDefend3', rng, G.season);
          updated = { ...updated, ...reassessed };
        }
        // v1.3: Record titleDefense
        updated = Engine.career.recordTitleDefense(updated, 'world', G.season, G.week, newDefenses);
        return updated;
        return updated;
      });
      const c = G.roster.find(r => r.id === champId);
      return { titles: newTitles, roster: newRoster, msg: `🛡️ ${c?.name} が団体王座${newDefenses}度目の防衛成功！` };
    },
    // Returns { titles, msg }
    validateChampion(G) {
      if (G.titles.world.championId && !G.roster.find(c => c.id === G.titles.world.championId)) {
        return { titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } }, msg: '🏆 王座返上: チャンピオンが団体を離脱したため王座は空位に' };
      }
      return { titles: G.titles, msg: null };
    },
    // v1.0: Check if title can be established (興行3回+ 人気15+ ロスター5人+)
    checkTitleEstablishment(G) {
      if (G.titleEstablished) return false; // already established
      return G.totalShows >= 3 && G.orgPop >= 15 && G.roster.length >= 5;
    },

    // v1.2: タイトルマッチ12週クールダウン
    // シーズンをまたいで正確に計算するため絶対週数（ゲーム開始から累計）を使う
    getAbsWeek(state) {
      return ((state.season || 1) - 1) * 48 + (state.week || 1);
    },
    // Returns { allowed: boolean, weeksLeft: number }
    canTitleMatch(state) {
      if (!state.titleEstablished) return { allowed: false, weeksLeft: 0 };
      const last = state.lastTitleMatchWeek; // 絶対週数 or null
      if (last == null) return { allowed: true, weeksLeft: 0 };
      const elapsed = Engine.title.getAbsWeek(state) - last;
      const weeksLeft = Math.max(0, 12 - elapsed);
      return { allowed: weeksLeft === 0, weeksLeft };
    },

    // v1.2: 現在のベルト表示名を返す
    // worldTitleUnlocked = true（1位達成後）かつ beltDisplayName が設定されていれば改名後の名称を返す。
    // 改名イベント自体は v1.2 後半で実装予定。
    getBeltName(state) {
      if (state.worldTitleUnlocked && state.beltDisplayName) {
        return state.beltDisplayName;
      }
      return '団体王座';
    }
  },

  // ── v1.2: Intrusion Match (乱入マッチ) ────────────────────────
  intrusion: {
    CHANCE: 0.20,         // 20% per eligible title match (~4 times in 5 years)
    MIN_DEFENSES: 3,      // チャンピオン3回以上防衛が条件
    OVR_THRESHOLD: 0.90,  // チャンピオンOVRの90%以上

    /** 乱入判定。条件を満たせば乱入選手情報を返す。不発ならnull */
    check(state, rng) {
      const champ = state.titles?.world;
      if (!champ?.championId || champ.defenses < this.MIN_DEFENSES) return null;
      const hasTitle = state.showCard && state.showCard.some(m => m.isTitle && m.left > 0 && m.right > 0);
      if (!hasTitle) return null;

      // 確率判定
      if (Engine.rng.float(rng) >= this.CHANCE) return null;

      // 隣接団体を特定（ランキング上下1位）
      const rankings = state.rankings || [];
      const pIdx = rankings.findIndex(r => r.orgId === 'player');
      if (pIdx < 0) return null;
      const adjacentOrgIds = [];
      if (pIdx > 0) adjacentOrgIds.push(rankings[pIdx - 1].orgId);
      if (pIdx < rankings.length - 1) adjacentOrgIds.push(rankings[pIdx + 1].orgId);
      // playerのみ除外
      const validOrgIds = adjacentOrgIds.filter(id => id !== 'player');
      if (validOrgIds.length === 0) return null;

      // チャンピオンのOVR取得
      const champFighter = state.roster.find(c => c.id === champ.championId);
      if (!champFighter) return null;
      const champOvr = Engine.util.ov(champFighter);
      const ovrMin = Math.floor(champOvr * this.OVR_THRESHOLD);

      // 候補選手: 各隣接団体の上位3名からOVR条件を満たす非怪我選手
      const candidates = [];
      validOrgIds.forEach(orgId => {
        const orgData = state.aiOrgs?.[orgId];
        if (!orgData) return;
        const org = RIVAL_ORGS.find(o => o.id === orgId);
        const top3 = [...orgData.roster]
          .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
          .slice(0, 3)
          .filter(f => Engine.util.ov(f) >= ovrMin && !f.injury);
        top3.forEach(f => candidates.push({ fighter: f, orgId, orgName: org?.name || orgId }));
      });

      if (candidates.length === 0) return null;

      // ランダム選出
      const pick = candidates[Engine.rng.int(rng, 0, candidates.length - 1)];
      return {
        intruder: { ...pick.fighter },
        fromOrgId: pick.orgId,
        fromOrgName: pick.orgName,
        champId: champ.championId,
        champName: champFighter.name
      };
    },

    /** 乱入マッチ結果の追加効果を適用 */
    applyResult(state, intruderWon, rng) {
      if (intruderWon) {
        // 敗北: ヒート -15〜-20 + 王座空位
        const penalty = -(15 + Engine.rng.int(rng, 0, 5));
        return {
          ...state,
          heatScore: Math.max(0, (state.heatScore || 50) + penalty),
          titles: { ...state.titles, world: { ...state.titles.world, championId: null, defenses: 0 } }
        };
      } else {
        // 勝利: 団体人気+2
        return { ...state, orgPop: Math.min(100, (state.orgPop || 0) + 2) };
      }
    }
  },

  // ── v1.2-9: Flavor Events (フレーバーイベント) ─────────────────
  flavor: {
    CHANCE: 0.12,          // 12% per eligible fighter per week (~1 event every 8 weeks)
    POP_THRESHOLD: 55,     // non-champion needs popularity >= 55

    MAGAZINE_HEADLINES: [
      (name) => `📰 週刊女子プロレス — 「${name}、独占インタビュー掲載。『まだまだ頂点を譲る気はない』」`,
      (name) => `📰 月刊プロレスマガジン — 「特集：${name}の素顔に迫る」`,
      (name) => `📰 週刊女子プロレス — 「${name}、表紙＆巻頭グラビア！ファン歓喜」`,
      (name) => `📰 スポーツ報知 — 「${name}が語る"強さの秘密"」`,
      (name) => `📰 週刊女子プロレス — 「${name}密着ルポ。練習場から見えた執念」`,
      (name) => `📰 月刊プロレスマガジン — 「${name}インタビュー。『ファンの声援が力になる』」`,
    ],
    TV_HEADLINES: [
      (name) => `📺 スポーツニュース — 「${name}がゴールデンタイムに登場。業界への注目が高まっている」`,
      (name) => `📺 バラエティ番組出演 — 「${name}のトーク力に共演者も驚き」`,
      (name) => `📺 朝の情報番組 — 「話題の女子プロレスラー${name}に密着取材」`,
      (name) => `📺 スポーツドキュメント — 「${name}、リングの外の真実」`,
      (name) => `📺 特番出演 — 「女子プロレス最前線！ ${name}の魅力を徹底解剖」`,
      (name) => `📺 トーク番組 — 「${name}、意外な素顔にスタジオ沸く」`,
    ],

    /**
     * フレーバーイベント判定。最大1件/週を返す。
     * @returns {Array<{type:'magazine'|'tv', fighterId, fighterName, popGain?, heatGain?, headline}>}
     */
    check(state, rng) {
      if (state.offSeason) return [];
      const champId = state.titles?.world?.championId;
      const eligible = (state.roster || []).filter(c =>
        !c.injury && !c.isRental && !c.isIntrusion &&
        (c.id === champId || c.popularity >= this.POP_THRESHOLD)
      );
      if (eligible.length === 0) return [];

      // Shuffle eligible list for fairness
      const shuffled = [...eligible].sort(() => Engine.rng.float(rng) - 0.5);

      for (const fighter of shuffled) {
        if (Engine.rng.float(rng) >= this.CHANCE) continue;

        const isChamp = fighter.id === champId;
        const isMagazine = Engine.rng.float(rng) < 0.5;

        if (isMagazine) {
          const templates = this.MAGAZINE_HEADLINES;
          const headline = templates[Engine.rng.int(rng, 0, templates.length - 1)](fighter.name);
          return [{
            type: 'magazine',
            fighterId: fighter.id,
            fighterName: fighter.name,
            popGain: isChamp ? 3 : 2,
            headline
          }];
        } else {
          const templates = this.TV_HEADLINES;
          const headline = templates[Engine.rng.int(rng, 0, templates.length - 1)](fighter.name);
          return [{
            type: 'tv',
            fighterId: fighter.id,
            fighterName: fighter.name,
            heatGain: isChamp ? 3 : 2,
            headline
          }];
        }
      }
      return [];
    },

    /** フレーバーイベントの効果を適用 */
    apply(state, flavorEvents) {
      let s = state;
      for (const ev of flavorEvents) {
        if (ev.type === 'magazine') {
          const roster = s.roster.map(c =>
            c.id === ev.fighterId
              ? { ...c, popularity: Math.min(100, c.popularity + ev.popGain) }
              : c
          );
          s = { ...s, roster };
        } else if (ev.type === 'tv') {
          s = { ...s, heatScore: Math.min(100, (s.heatScore || 50) + ev.heatGain) };
        }
      }
      return s;
    }
  },

  // ── v1.3: Career Record System (個人実績記録) ─────────────────
  career: {
    /** Create a fresh careerRecord object */
    createRecord() {
      return { history: [], totalTitleWins: 0, totalDefenses: 0, peakOVR: 0, peakOVRSeason: 0 };
    },
    /** Ensure fighter has careerRecord (for migration) */
    ensure(fighter) {
      if (fighter.careerRecord) return fighter;
      return { ...fighter, careerRecord: Engine.career.createRecord() };
    },
    /** Return new fighter with event appended to history */
    addEvent(fighter, event) {
      const f = Engine.career.ensure(fighter);
      return { ...f, careerRecord: { ...f.careerRecord, history: [...f.careerRecord.history, event] } };
    },
    /** Record title win: push event + update cache */
    recordTitleWin(fighter, beltId, season, week) {
      let f = Engine.career.addEvent(fighter, { type: 'titleWin', season, week, beltId });
      f = { ...f, careerRecord: { ...f.careerRecord, totalTitleWins: f.careerRecord.totalTitleWins + 1 } };
      return f;
    },
    /** Record title loss: push event */
    recordTitleLoss(fighter, beltId, season, week, defenses) {
      return Engine.career.addEvent(fighter, { type: 'titleLoss', season, week, beltId, defenses });
    },
    /** Record title defense: push event + update cache */
    recordTitleDefense(fighter, beltId, season, week, count) {
      let f = Engine.career.addEvent(fighter, { type: 'titleDefense', season, week, beltId, count });
      f = { ...f, careerRecord: { ...f.careerRecord, totalDefenses: f.careerRecord.totalDefenses + 1 } };
      return f;
    },
    /** Update peakOVR if current OVR is higher */
    updatePeakOVR(fighter, season) {
      const f = Engine.career.ensure(fighter);
      const ovr = Engine.util.ov(f);
      if (ovr > f.careerRecord.peakOVR) {
        return { ...f, careerRecord: { ...f.careerRecord, peakOVR: ovr, peakOVRSeason: season } };
      }
      return f;
    },
    /** Generate durability: normal distribution N(0,2), clamped to -4..+4 (v1.3-1 §1.1) */
    generateDurability(rng) {
      // Sum of 12 uniform(0,1) − 6 ≈ N(0,1); multiply by 2 → N(0,2)
      let s = 0;
      for (let i = 0; i < 12; i++) s += Engine.rng.float(rng);
      return Math.max(-4, Math.min(4, Math.round((s - 6) * 2)));
    }
  },

  // ── Coach System (IMMUTABLE for state changes) ────────────────
  coach: {
    getHiredCoaches(G) {
      return G.coaches.map(id => ALL_COACHES.find(c => c.id === id)).filter(Boolean);
    },
    getCoachAssignees(G, coachId) {
      return (G.coachAssign && G.coachAssign[coachId]) || [];
    },
    getCharCoach(G, charId) {
      for (const coachId of G.coaches) {
        if (Engine.coach.getCoachAssignees(G, coachId).includes(charId)) return ALL_COACHES.find(c => c.id === coachId);
      }
      return null;
    },
    // Returns { coachAssign, success }
    assignToCoach(G, coachId, charId) {
      const current = G.coachAssign[coachId] || [];
      if (current.length >= COACH_MAX_ASSIGN) return { coachAssign: G.coachAssign, success: false };
      return { coachAssign: { ...G.coachAssign, [coachId]: [...current, charId] }, success: true };
    },
    // Returns new coachAssign
    unassignFromCoach(G, charId) {
      const newAssign = {};
      for (const coachId of Object.keys(G.coachAssign)) {
        newAssign[coachId] = G.coachAssign[coachId].filter(id => id !== charId);
      }
      return newAssign;
    },
    getCharGrowthMult(G, charId, stat) {
      const coach = Engine.coach.getCharCoach(G, charId);
      if (!coach) return 1.0;
      if (coach.specialty === 'all') return coach.growthMult;
      if (coach.specialty === stat) return coach.growthMult;
      if (['pw','sp','te','st','mn'].includes(coach.specialty)) return GROWTH_CONFIG.subMult;
      return 1.0;
    },
    pickGrowthStat(rng, G, charId) {
      const stats = ['pw','sp','te','st','mn'];
      const coach = Engine.coach.getCharCoach(G, charId);
      let weights;
      if (coach && ['pw','sp','te','st','mn'].includes(coach.specialty)) {
        weights = stats.map(s => s === coach.specialty ? GROWTH_CONFIG.specialtyWeight : GROWTH_CONFIG.otherWeight);
      } else {
        weights = stats.map(() => 0.2);
      }
      const r = Engine.rng.float(rng);
      let cumulative = 0;
      for (let i = 0; i < stats.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) return stats[i];
      }
      return stats[4];
    },
    getMQBonusForMatch(G, leftId, rightId) {
      let bonus = 0;
      Engine.coach.getHiredCoaches(G).forEach(c => {
        if (c.specialty !== 'mq' || !c.mqBonus) return;
        const assigned = Engine.coach.getCoachAssignees(G, c.id);
        if (assigned.includes(leftId) || assigned.includes(rightId)) bonus += c.mqBonus;
      });
      return bonus;
    },
    getPopBonusForChar(G, charId) {
      const coach = Engine.coach.getCharCoach(G, charId);
      if (!coach || coach.specialty !== 'pop') return 0;
      return coach.popBonus || 0;
    },
    // Mental coach: condition recovery bonus per week
    getCondBonus(G, charId) {
      const coach = Engine.coach.getCharCoach(G, charId);
      if (!coach || coach.specialty !== 'mental') return 0;
      return coach.condBonus || 0;
    },
    // Mental coach: injury chance multiplier (0.5 = 50% reduction)
    getInjuryMult(G, charId) {
      const coach = Engine.coach.getCharCoach(G, charId);
      if (!coach || coach.specialty !== 'mental') return 1.0;
      return 1.0 - (coach.injuryReduce || 0);
    },
    getSalaryTotal(G) {
      return Engine.coach.getHiredCoaches(G).reduce((s, c) => s + c.salary, 0);
    }
  },

  // ── Facility System (DOM-free) ─────────────────────────
  facility: {
    getLevel(G, facilityId) {
      return (G.facilities && G.facilities[facilityId]) || 1;
    },
    getMaintenance(G) {
      if (!G.facilities) return 0;
      let total = 0;
      FACILITIES.forEach(f => {
        const lv = Engine.facility.getLevel(G, f.id);
        total += f.levels[lv - 1].maint;
      });
      return total;
    },
    getGrowthMult(G) {
      const lv = Engine.facility.getLevel(G, 'training');
      return lv === 3 ? 1.4 : lv === 2 ? 1.2 : 1.0;
    },
    getInjuryReduction(G) {
      const lv = Engine.facility.getLevel(G, 'medical');
      return lv === 3 ? 2 : lv === 2 ? 1 : 0;
    },
    getMedicalRecovery(G) {
      return Engine.facility.getLevel(G, 'medical') >= 3 ? 5 : 0;
    },
    getPromoBonus(G) {
      const lv = Engine.facility.getLevel(G, 'media');
      return lv === 3 ? 2 : lv === 2 ? 1 : 0;
    },
    getBroadcastBonus(G) {
      return Engine.facility.getLevel(G, 'media') >= 3 ? 50 : 0;
    },
    getConditionBonus(G) {
      const lv = Engine.facility.getLevel(G, 'dormitory');
      return lv === 3 ? 6 : lv === 2 ? 3 : 0;
    },
    getRestBonus(G) {
      return Engine.facility.getLevel(G, 'dormitory') >= 3 ? 5 : 0;
    },
    getScoutDiscount(G) {
      const lv = Engine.facility.getLevel(G, 'scouting');
      return lv === 3 ? 25 : lv === 2 ? 15 : 0;
    }
  },

  // ── Growth System v1.0 (IMMUTABLE) ─────────────────────
  growth: {
    // Convergence factor (training-spec §2.4) — growth slows near trainCap
    convergenceFactor(value, trainCap, notionValue) {
      if (value >= trainCap) return 0;
      const remaining = trainCap - value;
      const totalRange = Math.max(1, trainCap - 30);
      let factor = remaining / totalRange;
      if (value >= notionValue) factor *= 0.4; // Notion超え後は40%に鈍化
      return Engine.util.clamp(factor, 0.02, 1.2);
    },

    // Weekly growth calculation (training-spec §2.3) — v1.0 convergence-based
    calcGrowth(rng, G, char, stat) {
      if (stat === 'mn') return 0; // MNT is innate, no training growth
      const current = char[stat];
      const trainCap = char.trainCap ? char.trainCap[stat] : (char.pot[stat] || current);
      const notion = char.notionValue ? char.notionValue[stat] : current;
      if (current >= trainCap) return 0;

      const styleKey = char.style || 'Allround';
      const styleGain = (STYLE_GROWTH[styleKey] || STYLE_GROWTH.Allround)[stat] || 0.7;
      const age = char.age || (16 + (char.careerSeasons || 0));
      const ageMul = ageMultiplier(age, char.traits);
      if (ageMul <= 0) return 0;

      const coachMul = Engine.coach.getCharGrowthMult(G, char.id, stat);
      const facilityMul = Engine.facility.getGrowthMult(G);
      const convFactor = Engine.growth.convergenceFactor(current, trainCap, notion);

      let baseGain = styleGain * ageMul * coachMul * facilityMul * convFactor;
      // 努力家: 練習成長+15%
      if (Traits.has(char, '努力家')) baseGain *= 1.15;
      // ムードメーカー: 団体にいるだけで全体の練習効率+5%（自分含む）
      if (G.roster && G.roster.some(c => Traits.has(c, 'ムードメーカー') && !c.injury)) baseGain *= 1.05;
      // リーダー気質: エースが所属していれば若手(≤21)の成長+10%
      if ((char.age || 99) <= 21 && G.roster && G.roster.some(c => c.id !== char.id && Traits.has(c, 'リーダー気質') && !c.injury)) baseGain *= 1.10;
      // 負けず嫌い: 直近の試合で負けていれば成長+20%
      if (Traits.has(char, '負けず嫌い') && char.lastMatchResult === 'loss') baseGain *= 1.20;

      let weeklyVariance = 0.5 + Engine.rng.float(rng) * 1.0; // 0.5〜1.5
      // 破天荒: 成長の振れ幅拡大 (0.0〜2.5)
      if (Traits.has(char, '破天荒')) weeklyVariance = Engine.rng.float(rng) * 2.5;
      const rawGain = baseGain * weeklyVariance;

      // Intensive training bonus
      const intensiveMul = char.intensive ? GROWTH_CONFIG.intensiveMult : 1.0;
      const finalGain = Math.max(0, Math.round(rawGain * intensiveMul * 10) / 10);
      return Math.min(Math.ceil(finalGain), trainCap - current);
    },

    // Apply wear-based stat decay (v1.3-1 §3) — replaces age-based decay
    applyDecay(rng, fighter) {
      const wear = fighter.wear || 0;
      // wear 0-19: 全盛期（減少なし）  wear 80+: 確定引退（stat変更なし、checkRetirementで処理）
      if (wear < 20 || wear >= 80) return fighter;
      let decayMin, decayMax;
      if (wear < 40)      { decayMin = 1; decayMax = 2; } // 軽度衰退
      else if (wear < 60) { decayMin = 2; decayMax = 4; } // 本格衰退
      else                { decayMin = 3; decayMax = 5; } // 末期
      let f = { ...fighter };
      const notion = f.notionValue || { pw: f.pw, sp: f.sp, te: f.te, st: f.st, mn: f.mn };
      ['pw', 'sp', 'te', 'st', 'mn'].forEach(s => {
        const loss = decayMin + Math.round(Engine.rng.float(rng) * (decayMax - decayMin));
        const floor = Math.round((notion[s] || 30) * RETIRE_CFG.decayFloor);
        f[s] = Math.max(floor, f[s] - loss);
      });
      return f;
    },

    // Season end: aging + decay + growth reset for player roster
    applySeasonEnd(rng, G) {
      const report = [];
      const newRoster = G.roster.map(c => {
        let nc = { ...c, age: (c.age || 16) + 1, careerSeasons: (c.careerSeasons || 0) + 1,
                   seasonGrowth: { ...(c.seasonGrowth || {pw:0,sp:0,te:0,st:0,mn:0}) } };
        // v1.3-1: wear蓄積 — decayより先に計算し、今シーズンのdecayに反映させる (§2.1)
        const decayStartAge = 28 + (nc.durability || 0);
        if (nc.age >= decayStartAge) {
          const baseWear = 10 + Engine.rng.int(rng, -3, 3); // 7〜13
          let wearBonus = 0;
          // 年間試合数補正: キャリア平均で近似
          const avgMatches = Math.round(((nc.wins || 0) + (nc.losses || 0) + (nc.draws || 0)) / nc.careerSeasons);
          if (avgMatches >= 40) wearBonus += 3;
          // TODO: シーズン中の怪我回数 × 2 (要: seasonInjuries フィールド追加)
          // intensive多用（12週以上）
          if ((nc.intensiveWeeks || 0) >= 12) wearBonus += 2;
          // TODO: rest週 24週以上 → -3 (要: restWeeks フィールド追加)
          // durability補正（耐久値が高いほどwear増加が遅い）
          wearBonus -= (nc.durability || 0);
          const finalWear = Math.max(1, baseWear + wearBonus);
          nc = { ...nc, wear: (nc.wear || 0) + finalWear };
        }
        const beforeDecay = { pw:nc.pw, sp:nc.sp, te:nc.te, st:nc.st, mn:nc.mn };
        nc = Engine.growth.applyDecay(rng, nc);
        const changes = {};
        ['pw','sp','te','st','mn'].forEach(s => {
          const decayDelta = nc[s] - beforeDecay[s];
          if (decayDelta !== 0) changes[s] = decayDelta;
        });
        const parts = [];
        ['pw','sp','te','st','mn'].forEach(s => {
          const net = (nc.seasonGrowth[s] || 0) + (changes[s] || 0);
          if (net > 0) parts.push(`${s.toUpperCase()}+${net}`);
          else if (net < 0) parts.push(`${s.toUpperCase()}${net}`);
        });
        if (parts.length > 0) report.push(`${nc.name}(${nc.age}歳): ${parts.join(' ')}`);
        nc.seasonGrowth = { pw: 0, sp: 0, te: 0, st: 0, mn: 0 };
        nc.lowPerformanceSeasons = nc.lowPerformanceSeasons || 0;
        // v0.99: Age-based reassessment (pricing-balance-spec §4.2)
        if (nc.age === 30) {
          const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, nc.id, 30));
          const rv = Engine.scout.reassess(nc, 'age30', ageRng, G.season);
          nc = { ...nc, ...rv };
        } else if (nc.age >= 35 && nc.age <= 36) {
          const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, nc.id, 35));
          const rv = Engine.scout.reassess(nc, 'age35plus', ageRng, G.season);
          nc = { ...nc, ...rv };
        }
        // v1.3: Update peakOVR record
        nc = Engine.career.updatePeakOVR(nc, G.season);
        return nc;
      });
      return { roster: newRoster, report };
    }
  },

  // ── Ranking System (IMMUTABLE) ─────────────────────────
  ranking: {
    calcStarPower(roster) {
      return roster.reduce((score, f) => {
        for (const t of STAR_POWER) { if (f.popularity >= t.minPop) return score + t.points; }
        return score;
      }, 0);
    },
    calcTotalPop(roster) {
      return Math.round(roster.reduce((s, f) => s + (f.popularity || 0), 0) * 0.1);
    },
    calcOrgRating(championScore, roster) {
      return championScore + Engine.ranking.calcStarPower(roster) + Engine.ranking.calcTotalPop(roster);
    },
    // Returns updated rankings array: [{orgId, name, rating, championScore, starPower, totalPop}]
    updateRankings(state) {
      const playerChampScore = state.titles.world.championId ? 30 : 0;
      const playerRating = Engine.ranking.calcOrgRating(playerChampScore, state.roster) + (state.summitBonus || 0);
      const entries = [{
        orgId:'player', name: state.orgName || 'プレイヤー団体',
        rating: playerRating,
        championScore: playerChampScore,
        starPower: Engine.ranking.calcStarPower(state.roster),
        totalPop: Engine.ranking.calcTotalPop(state.roster),
        rosterSize: state.roster.length
      }];
      RIVAL_ORGS.forEach(org => {
        const aiRoster = (state.aiOrgs && state.aiOrgs[org.id]) ? state.aiOrgs[org.id].roster : [];
        const r = Engine.ranking.calcOrgRating(org.championScore, aiRoster);
        entries.push({
          orgId: org.id, name: org.name,
          rating: r,
          championScore: org.championScore,
          starPower: Engine.ranking.calcStarPower(aiRoster),
          totalPop: Engine.ranking.calcTotalPop(aiRoster),
          rosterSize: aiRoster.length
        });
      });
      entries.sort((a, b) => b.rating - a.rating);
      entries.forEach((e, i) => { e.rank = i + 1; });
      return entries;
    },
    getPlayerRank(rankings) {
      const p = rankings.find(r => r.orgId === 'player');
      return p ? p.rank : rankings.length;
    }
  },

  // ── Rival System (IMMUTABLE) ───────────────────────────
  rival: {
    // Generate trainCap for a fighter (training-spec §1.4)
    generateTrainCap(rng, notionValue, potential) {
      const caps = {};
      ['pw','sp','te','st','mn'].forEach(s => {
        const factor = 0.10 + Engine.rng.float(rng) * 0.40; // 0.10〜0.50
        caps[s] = Math.round(notionValue[s] + factor * (potential[s] - notionValue[s]));
      });
      return caps;
    },
    // Generate entry-level current values (training-spec §1.3)
    generateStartValues(rng, notionValue, entryAge) {
      let baseRatio;
      if (entryAge <= 17)      baseRatio = 0.55;
      else if (entryAge <= 20) baseRatio = 0.65;
      else if (entryAge <= 24) baseRatio = 0.75;
      else if (entryAge <= 29) baseRatio = 0.85;
      else                     baseRatio = 0.90;
      const vals = {};
      ['pw','sp','te','st'].forEach(s => {
        const ratio = baseRatio + Engine.rng.float(rng) * 0.10;
        vals[s] = Math.round(notionValue[s] * ratio);
      });
      vals.mn = notionValue.mn; // MNT is innate — no age reduction (training-spec §1.6)
      return vals;
    },
    // Make an AI fighter object from ALL_CHARS template
    makeAIFighter(template, rng, orgId, age) {
      const notion = {pw:template.pw,sp:template.sp,te:template.te,st:template.st,mn:template.mn};
      const trainCap = Engine.rival.generateTrainCap(rng, notion, template.pot);
      // AI fighters start closer to their Notion values (established pros)
      const maturity = Math.min(1.0, 0.70 + (age - 16) * 0.04 + Engine.rng.float(rng) * 0.10);
      const current = {};
      ['pw','sp','te','st','mn'].forEach(s => {
        current[s] = Math.min(trainCap[s], Math.round(notion[s] * maturity));
      });
      const ovr = Math.round((current.pw+current.sp+current.te+current.st+current.mn)/5);
      // Calculate assessed value (pricing-balance-spec §1)
      const charForAssess = { ...current, pot: template.pot, trainCap };
      const av = Engine.scout.calcAssessedValue(charForAssess, rng, 1);
      return {
        id: template.id, name: template.name, h: template.h,
        pw: current.pw, sp: current.sp, te: current.te, st: current.st, mn: current.mn,
        style: template.style, role: template.role, pot: { ...template.pot },
        notionValue: notion, trainCap,
        popularity: Math.max(5, Math.round(ovr * 0.6 + Engine.rng.int(rng, -5, 10))),
        orgId, age: age || (16 + Engine.rng.int(rng, 0, 12)),
        losingStreak: 0, preInjuryPop: null,
        assessedValue: av.assessedValue, assessedTier: av.assessedTier,
        assessedVariance: av.assessedVariance, assessedSeason: av.assessedSeason
      };
    },
    // Initialize all AI org rosters from ORG_ASSIGN
    // ── Roster Randomization: assign ALL_CHARS to S/A/B/FA/dormant ──
    initRandomRoster(rng) {
      const cfg = ROSTER_CFG;
      // Step 1: Compute potTotal for all characters
      const chars = ALL_CHARS.map(c => {
        const potTotal = (c.pot.pw||0) + (c.pot.sp||0) + (c.pot.te||0) + (c.pot.st||0) + (c.pot.mn||0);
        let tierClass;
        if (potTotal >= cfg.superEliteThreshold) tierClass = 'superElite';
        else if (potTotal >= cfg.eliteThreshold) tierClass = 'elite';
        else tierClass = 'other';
        return { id: c.id, potTotal, tierClass, group: CHAR_GROUP[c.id] || 'other' };
      });

      // Step 2: Super-elite → S級確定
      const superElites = chars.filter(c => c.tierClass === 'superElite');
      const remaining = chars.filter(c => c.tierClass !== 'superElite');

      // Step 3: Shuffle remaining with seeded RNG
      const shuffled = seededShuffle(remaining, rng);

      // Helper: weighted pick with series bonus
      // potWeight: how strongly potTotal influences selection (0=random, 1=strongly)
      // minPotTotal: minimum potTotal to be eligible (0=no filter)
      function weightedPick(pool, orgMembers, count, maxElites, potWeight, minPotTotal) {
        const result = [];
        let eliteCount = 0;
        const available = [...pool];
        while (result.length < count && available.length > 0) {
          // Calculate weights
          const weights = available.map(c => {
            // Elite cap check
            if (c.tierClass === 'elite' && eliteCount >= maxElites) return 0;
            // Minimum potTotal filter
            if (minPotTotal && c.potTotal < minPotTotal) return 0;
            // Base weight
            let w = 1.0;
            // PotTotal influence (scaled by potWeight parameter)
            // potTotal range ~440-820, normalize to 0-1 then scale
            w += (c.potTotal / 800) * (potWeight || 0);
            // Series bonus: if same group already in org
            if (c.group !== 'other' && orgMembers.some(m => m.group === c.group)) {
              w += cfg.seriesBonus;
            }
            return w;
          });
          // Weighted random selection
          const totalWeight = weights.reduce((s, w) => s + w, 0);
          if (totalWeight <= 0) break;
          let roll = Engine.rng.float(rng) * totalWeight;
          let picked = -1;
          for (let i = 0; i < available.length; i++) {
            roll -= weights[i];
            if (roll <= 0) { picked = i; break; }
          }
          if (picked < 0) picked = 0;
          const chosen = available.splice(picked, 1)[0];
          if (chosen.tierClass === 'elite') eliteCount++;
          result.push(chosen);
          orgMembers.push(chosen);
        }
        // Remove picked from pool
        const resultIds = new Set(result.map(r => r.id));
        for (let i = pool.length - 1; i >= 0; i--) {
          if (resultIds.has(pool[i].id)) pool.splice(i, 1);
        }
        return result;
      }

      // Step 4: Fill S級 (superElites guaranteed + fill remaining slots)
      const sMembers = [...superElites];
      const sRemaining = cfg.org_s - superElites.length;
      // Sort pool by potTotal desc for S-tier (strongest first)
      shuffled.sort((a, b) => b.potTotal - a.potTotal);
      const pool = [...shuffled];
      const sPicked = weightedPick(pool, sMembers, sRemaining, 99, 3.0, 690); // S: strong potTotal bias, 有望以上のみ
      const sAll = [...superElites.map(c => c.id), ...sPicked.map(c => c.id)];

      // Step 5: Re-shuffle remaining pool for A/B (reset sorting)
      const poolForAB = seededShuffle(pool, rng);
      pool.length = 0;
      pool.push(...poolForAB);

      // Step 6: Fill A級 (max 3 elites — AI_TIER_LIMITS)
      const aMembers = [];
      const aPicked = weightedPick(pool, aMembers, cfg.org_a, (AI_TIER_LIMITS.A || {}).maxProdigies || 3, 1.0, 640);
      const aAll = aPicked.map(c => c.id);

      // Step 7: Fill B級 (max 1 elite — AI_TIER_LIMITS)
      const bMembers = [];
      const bPicked = weightedPick(pool, bMembers, cfg.org_b, (AI_TIER_LIMITS.B || {}).maxProdigies || 1, 0.3);
      const bAll = bPicked.map(c => c.id);

      // Step 8: Remaining → FA (cfg.fa slots) + dormant (rest)
      const faShuffled = seededShuffle(pool, rng);
      const faAll = faShuffled.slice(0, cfg.fa).map(c => c.id);
      const dormantAll = faShuffled.slice(cfg.fa).map(c => c.id);

      // Step 9: Write to ORG_ASSIGN
      ORG_ASSIGN.org_s = sAll;
      ORG_ASSIGN.org_a = aAll;
      ORG_ASSIGN.org_b = bAll;
      ORG_ASSIGN.free = faAll;
      ORG_ASSIGN.player = [];

      return { dormantPool: dormantAll };
    },

    initAIOrgs(rng) {
      // Randomly assign org names from pool
      const nameMap = {};
      RIVAL_ORGS.forEach(org => {
        const pool = RIVAL_ORG_NAME_POOL[org.tier];
        if (pool && pool.length) {
          const idx = Engine.rng.int(rng, 0, pool.length - 1);
          org.name = pool[idx];
          nameMap[org.id] = org.name;
        }
      });

      const orgs = {};
      RIVAL_ORGS.forEach(org => {
        const ids = ORG_ASSIGN[org.id] || [];
        const roster = ids.map(id => {
          const t = ALL_CHARS.find(c => c.id === id);
          if (!t) return null;
          return Engine.rival.makeAIFighter(t, rng, org.id, 15 + Engine.rng.int(rng, 0, 18));
        }).filter(Boolean);
        // Sort by OVR desc and boost top fighters' popularity for realism
        roster.sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a));
        roster.forEach((f, i) => {
          const tierBonus = {S:8,A:4,B:2}[org.tier] || 0;
          if (i === 0) f.popularity = Math.min(90, f.popularity + 15 + tierBonus); // ace
          else if (i < 3) f.popularity = Math.min(85, f.popularity + 8 + tierBonus);
          else if (i < 6) f.popularity = Math.min(75, f.popularity + 3 + tierBonus);
        });
        orgs[org.id] = {
          roster,
          orgPop: {S:75,A:55,B:35}[org.tier] || 30
        };
      });
      return { aiOrgs: orgs, rivalOrgNames: nameMap };
    },

    /** Restore org names from saved state */
    applyOrgNames(nameMap) {
      if (!nameMap) return;
      RIVAL_ORGS.forEach(org => {
        if (nameMap[org.id]) org.name = nameMap[org.id];
      });
    },
    // Get dormant IDs (chars not assigned to any org or free)
    getDormantIds() {
      const assigned = new Set();
      Object.values(ORG_ASSIGN).forEach(ids => ids.forEach(id => assigned.add(id)));
      return ALL_CHARS.filter(c => !assigned.has(c.id)).map(c => c.id);
    },
    // Utility: get merged AI org info (config + state) by orgId
    getOrgInfo(aiOrgs, orgId) {
      const cfg = RIVAL_ORGS.find(o => o.id === orgId);
      const data = aiOrgs && aiOrgs[orgId];
      if (!cfg || !data) return null;
      return { id: cfg.id, orgId: cfg.id, name: cfg.name, tier: cfg.tier,
               championScore: cfg.championScore, coachMul: cfg.coachMul, facilityMul: cfg.facilityMul,
               roster: data.roster, orgPop: data.orgPop };
    },
    // Utility: get all AI orgs as array with merged config+state
    getAllOrgs(aiOrgs) {
      return RIVAL_ORGS.map(cfg => Engine.rival.getOrgInfo(aiOrgs, cfg.id)).filter(Boolean);
    },

    // Check if current week is a transfer window
    isTransferWindow(week) {
      return TRANSFER_CONFIG.windows.includes(week);
    },
    // Calculate transfer fee (rival-org §7.1)
    calcTransferFee(fighter, fromOrgTier) {
      const ovr = Engine.util.ov(fighter);
      const popBonus = (fighter.popularity || 0) * 10;
      let baseFee;
      if (ovr >= 80)      baseFee = 800;
      else if (ovr >= 60) baseFee = 400;
      else if (ovr >= 45) baseFee = 200;
      else                baseFee = 100;
      const tierMul = {S:1.5, A:1.2, B:1.0}[fromOrgTier] || 1.0;
      return Math.round((baseFee + popBonus) * tierMul);
    },

    // ── B-1: AI Season End Processing (8-step pipeline) ────
    // rival-spec §4: processes all AI orgs at season end
    processSeasonEnd(rng, state) {
      const events = [];
      const newAiOrgs = {};

      RIVAL_ORGS.forEach(org => {
        const aiData = state.aiOrgs[org.id];
        if (!aiData) { newAiOrgs[org.id] = aiData; return; }
        let roster = aiData.roster.map(f => ({ ...f }));
        const retiredNames = [];

        // Step 1: 加齢 + wear蓄積 (v1.3-1 §7 — AI team: baseWear + durability補正 only)
        roster.forEach(f => {
          f.age = (f.age || 20) + 1;
          const aiDecayStart = 28 + (f.durability || 0);
          if (f.age >= aiDecayStart) {
            const aiBaseWear = 10 + Engine.rng.int(rng, -3, 3);
            f.wear = (f.wear || 0) + Math.max(1, aiBaseWear - (f.durability || 0));
          }
        });

        // Step 2: 衰退判定 (v1.3-1 §3 — wear-based)
        roster = roster.map(f => Engine.growth.applyDecay(rng, f));

        // Step 3: 成長一括 (rival-spec §4.1 — aiSeasonGrowth)
        roster = roster.map(f => Engine.rival.aiSeasonGrowth(rng, f, org));

        // Step 4: 人気変動 (rival-spec §4.2)
        roster = roster.map(f => Engine.rival.aiSeasonPopularity(rng, f, org));

        // Step 5: 引退判定 (scout-spec §7)
        const surviving = [];
        roster.forEach(f => {
          if (Engine.rival.checkRetirement(rng, f)) {
            retiredNames.push(`${f.name}(${f.age}歳)`);
          } else {
            surviving.push(f);
          }
        });
        roster = surviving;

        // Step 6: AIスカウト → handled separately in offseason week 2
        // Step 7: AI間移籍 → handled separately
        // Step 8: org-rating → recalculated after all processing

        if (retiredNames.length > 0) {
          events.push(`${org.emoji} ${org.name}: ${retiredNames.join('、')} が引退`);
        }
        const avgOvr = roster.length > 0 ? Math.round(roster.reduce((s,f) => s + Engine.util.ov(f), 0) / roster.length) : 0;
        events.push(`${org.emoji} ${org.name}: ロスター${roster.length}名 (平均OVR ${avgOvr})`);

        newAiOrgs[org.id] = { ...aiData, roster, orgPop: aiData.orgPop };
      });

      return { aiOrgs: newAiOrgs, events };
    },

    // AI season growth (rival-spec §4.1 + F1 tier growth bonus) — 48 weeks in one calculation
    aiSeasonGrowth(rng, fighter, org) {
      const f = { ...fighter };
      const age = f.age || 20;
      const ageMul = ageMultiplier(age, (f || {}).traits);
      if (ageMul <= 0) return f; // no growth at 35+

      const styleKey = f.style || 'Allround';
      const styleTable = STYLE_GROWTH[styleKey] || STYLE_GROWTH.Allround;
      const coachMul = org.coachMul || 1.0;
      const facilityMul = org.facilityMul || 1.0;
      // F1: Tier-based growth bonus — S-tier compounds advantage each season
      const tierGrowth = (AI_TIER_LIMITS[org.tier] || AI_TIER_LIMITS.B).growthBonus;
      const notion = f.notionValue || {pw:f.pw,sp:f.sp,te:f.te,st:f.st,mn:f.mn};
      const trainCap = f.trainCap || f.pot || notion;
      const cfg = AI_SEASON_CFG;

      ['pw','sp','te','st'].forEach(s => {
        if (f[s] >= trainCap[s]) return;
        const convFactor = Engine.growth.convergenceFactor(f[s], trainCap[s], notion[s]);
        const weeklyGain = (styleTable[s] || 0.7) * ageMul * coachMul * facilityMul * tierGrowth * convFactor;
        const seasonVariance = cfg.seasonVarianceMin + Engine.rng.float(rng) * (cfg.seasonVarianceMax - cfg.seasonVarianceMin);
        const trainingGain = weeklyGain * cfg.trainWeeks * seasonVariance;
        const matchVariance = cfg.matchVarianceMin + Engine.rng.float(rng) * (cfg.matchVarianceMax - cfg.matchVarianceMin);
        const matchGain = cfg.matchGrowthBase * cfg.matchesPerSeason * convFactor * matchVariance;
        f[s] = Math.min(trainCap[s], f[s] + Math.round(trainingGain + matchGain));
      });
      return f;
    },

    // AI season popularity (rival-spec §4.2)
    aiSeasonPopularity(rng, fighter, org) {
      const f = { ...fighter };
      const overall = Engine.util.ov(f);
      const tierBonus = AI_SEASON_CFG.tierPopBonus[org.tier] || 0;
      const popTarget = Math.min(90, overall * 0.7 + tierBonus);
      const diff = popTarget - (f.popularity || 10);
      const randomDelta = -AI_SEASON_CFG.popRandomRange + Engine.rng.int(rng, 0, AI_SEASON_CFG.popRandomRange * 2);
      f.popularity = Engine.util.clamp(Math.round(f.popularity + diff * AI_SEASON_CFG.popConvergeRate + randomDelta), 5, 95);
      return f;
    },

    // Retirement check (v1.3-1 §4 — wear-based, replaces age-based chances)
    checkRetirement(rng, fighter) {
      const wear = fighter.wear || 0;

      // wear 80+: 確定引退 (§3)
      if (wear >= 80) return true;

      // 自主引退: OVR < Notion * 0.60 が2シーズン連続 (§4.4 — 既存ルート維持)
      const notion = fighter.notionValue || {pw:fighter.pw,sp:fighter.sp,te:fighter.te,st:fighter.st,mn:fighter.mn};
      const notionOvr = Math.round((notion.pw+notion.sp+notion.te+notion.st+notion.mn)/5);
      const currentOvr = Engine.util.ov(fighter);
      if (currentOvr < notionOvr * RETIRE_CFG.voluntaryThreshold) {
        fighter.lowPerformanceSeasons = (fighter.lowPerformanceSeasons || 0) + 1;
        if (fighter.lowPerformanceSeasons >= RETIRE_CFG.voluntarySeasons) return true;
      } else {
        fighter.lowPerformanceSeasons = 0;
      }

      // wear閾値ベースの引退確率 (§4.1)
      let retireChance = 0;
      if (wear >= 60)      retireChance = 0.50; // 末期
      else if (wear >= 40) retireChance = 0.20; // 本格衰退
      // wear < 40: 引退確率なし
      if (retireChance > 0 && Engine.rng.float(rng) < retireChance) return true;

      return false;
    },

    // ── B-3: AI Scouting (rival-spec §5 + F1 tier limits) ────
    // F1 helper: count prodigies/promising on a roster
    countRosterRanks(roster) {
      let prodigies = 0, promising = 0;
      roster.forEach(f => {
        const pot = f.pot || f.notionValue || {};
        const avgPot = Math.round(((pot.pw||0)+(pot.sp||0)+(pot.te||0)+(pot.st||0)+(pot.mn||0))/5);
        if (avgPot >= 160) prodigies++;
        else if (avgPot >= 130) promising++;
      });
      return { prodigies, promising };
    },
    aiScout(rng, state) {
      const events = [];
      const newAiOrgs = {};
      let poolIds = [...(state.dormantPool || [])];

      RIVAL_ORGS.forEach(org => {
        const aiData = state.aiOrgs[org.id];
        if (!aiData) { newAiOrgs[org.id] = aiData; return; }
        const cfg = AI_SCOUT_CFG[org.tier] || AI_SCOUT_CFG.B;
        const tierLim = AI_TIER_LIMITS[org.tier] || AI_TIER_LIMITS.B;
        let roster = aiData.roster.map(f => ({ ...f }));
        const need = Math.max(0, cfg.idealRoster - roster.length);
        const maxPicks = Math.min(need + 1, cfg.maxPicks);
        let budget = cfg.budget;
        let picked = 0;

        // Generate scout candidates from pool
        const available = poolIds.filter(id => {
          // Not already in any org
          const inAny = Object.values(state.aiOrgs).some(a => a.roster.some(f => f.id === id));
          const inPlayer = state.roster.some(f => f.id === id);
          const inFree = (state.freeAgents || []).some(f => f.id === id);
          return !inAny && !inPlayer && !inFree;
        });

        // Pick from available pool
        const shuffled = [...available].sort(() => Engine.rng.float(rng) - 0.5);
        for (const candId of shuffled) {
          if (picked >= maxPicks || budget <= 0) break;
          const template = ALL_CHARS.find(c => c.id === candId);
          if (!template) continue;

          // Estimate rank: prodigy/promising/rough based on avg potential
          const avgPot = Math.round(((template.pot?.pw||0)+(template.pot?.sp||0)+(template.pot?.te||0)+(template.pot?.st||0)+(template.pot?.mn||0))/5);
          let rank;
          if (avgPot >= 160) rank = 'prodigy';
          else if (avgPot >= 130) rank = 'promising';
          else rank = 'rough';

          // F1: Tier-based roster quality cap check
          const counts = Engine.rival.countRosterRanks(roster);
          if (rank === 'prodigy' && counts.prodigies >= tierLim.maxProdigies) continue;
          if (rank === 'promising' && counts.promising >= tierLim.maxPromising) continue;

          const acquireRate = cfg.rates[rank] || 0.5;
          if (Engine.rng.float(rng) >= acquireRate) continue;

          // Contract cost (simplified)
          const cost = rank === 'prodigy' ? 200 : rank === 'promising' ? 100 : 50;
          if (budget < cost) continue;

          const age = 16 + Engine.rng.int(rng, 0, 4);
          const newFighter = Engine.rival.makeAIFighter(template, rng, org.id, age);
          roster.push(newFighter);
          poolIds = poolIds.filter(id => id !== candId);
          budget -= cost;
          picked++;
          events.push(`${org.emoji} ${org.name}が${template.name}を獲得`);
        }

        newAiOrgs[org.id] = { ...aiData, roster };
      });

      return { aiOrgs: newAiOrgs, dormantPool: poolIds, events };
    },

    // AI inter-org transfers (rival-spec §7.3 + F1 tier divergence)
    // S-tier poaches best from lower tiers; lower tiers fill gaps from pool
    aiInterTransfer(rng, aiOrgs) {
      const events = [];
      const newOrgs = {};
      RIVAL_ORGS.forEach(org => { newOrgs[org.id] = { ...aiOrgs[org.id], roster: [...(aiOrgs[org.id]?.roster || [])] }; });

      // F1(d): Higher-tier orgs poach top talent from lower-tier orgs
      const sortedOrgs = [...RIVAL_ORGS].sort((a,b) => {
        const tierOrder = {S:0, A:1, B:2};
        return tierOrder[a.tier] - tierOrder[b.tier];
      });

      for (const org of sortedOrgs) {
        const cfg = AI_SCOUT_CFG[org.tier] || AI_SCOUT_CFG.B;
        const tierLim = AI_TIER_LIMITS[org.tier] || AI_TIER_LIMITS.B;
        const roster = newOrgs[org.id].roster;

        // If roster is already full, skip acquiring
        if (roster.length >= cfg.idealRoster + 2) continue;

        // Try to poach from lower-tier orgs
        for (const sourceOrg of sortedOrgs) {
          if (sourceOrg.id === org.id) continue;
          // Only poach downward (S from A/B, A from B)
          const tierRank = {S:0, A:1, B:2};
          if (tierRank[org.tier] >= tierRank[sourceOrg.tier]) continue;

          const srcRoster = newOrgs[sourceOrg.id].roster;
          if (srcRoster.length <= 5) continue; // Don't gut a tiny roster

          // S-tier: 25% chance to poach best fighter; A-tier: 15%
          const poachChance = org.tier === 'S' ? 0.25 : 0.15;
          if (Engine.rng.float(rng) > poachChance) continue;

          // Target the best non-ace fighter from source
          const sorted = [...srcRoster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a));
          const target = sorted.length > 1 ? sorted[1] : sorted[0]; // Skip ace (index 0), take 2nd best
          if (!target) continue;

          // Check tier limits before acquiring
          const counts = Engine.rival.countRosterRanks(roster);
          const pot = target.pot || target.notionValue || {};
          const avgPot = Math.round(((pot.pw||0)+(pot.sp||0)+(pot.te||0)+(pot.st||0)+(pot.mn||0))/5);
          const targetRank = avgPot >= 160 ? 'prodigy' : avgPot >= 130 ? 'promising' : 'rough';
          if (targetRank === 'prodigy' && counts.prodigies >= tierLim.maxProdigies) continue;
          if (targetRank === 'promising' && counts.promising >= tierLim.maxPromising) continue;

          newOrgs[sourceOrg.id].roster = srcRoster.filter(f => f.id !== target.id);
          target.orgId = org.id;
          // v1.0b: Transfer popularity reset
          const resetTarget = Engine.popularity.applyTransferReset(target);
          Object.assign(target, resetTarget);
          newOrgs[org.id].roster.push(target);
          events.push(`📋 ${target.name}が${sourceOrg.name}→${org.name}に引き抜き`);
          break; // Max 1 poach per org per season
        }
      }

      // Lower-tier orgs fill gaps if under ideal roster
      for (const org of sortedOrgs.reverse()) {
        const cfg = AI_SCOUT_CFG[org.tier] || AI_SCOUT_CFG.B;
        const roster = newOrgs[org.id].roster;
        if (roster.length >= cfg.idealRoster) continue;

        // Try to acquire weakest fighter from over-stocked orgs
        for (const srcOrg of sortedOrgs) {
          if (srcOrg.id === org.id) continue;
          const srcCfg = AI_SCOUT_CFG[srcOrg.tier] || AI_SCOUT_CFG.B;
          const srcRoster = newOrgs[srcOrg.id].roster;
          if (srcRoster.length <= srcCfg.idealRoster) continue;
          const sorted = [...srcRoster].sort((a,b) => Engine.util.ov(a) - Engine.util.ov(b));
          const transferee = sorted[0];
          if (!transferee || Engine.rng.float(rng) > 0.4) continue;
          newOrgs[srcOrg.id].roster = srcRoster.filter(f => f.id !== transferee.id);
          transferee.orgId = org.id;
          // v1.0b: Transfer popularity reset
          const resetTransferee = Engine.popularity.applyTransferReset(transferee);
          Object.assign(transferee, resetTransferee);
          newOrgs[org.id].roster.push(transferee);
          events.push(`📋 ${transferee.name}が${srcOrg.name}→${org.name}に移籍`);
          break;
        }
      }

      return { aiOrgs: newOrgs, events };
    },

    // F1(d): AI FA Acquisition — higher-tier orgs grab free agents to widen gap
    aiFAAcquire(rng, state) {
      const events = [];
      const newAiOrgs = {};
      let freeAgents = [...(state.freeAgents || [])];
      RIVAL_ORGS.forEach(org => { newAiOrgs[org.id] = { ...state.aiOrgs[org.id], roster: [...(state.aiOrgs[org.id]?.roster || [])] }; });

      // Process in tier order (S first, then A, then B)
      const sortedOrgs = [...RIVAL_ORGS].sort((a,b) => {
        const tierOrder = {S:0, A:1, B:2};
        return tierOrder[a.tier] - tierOrder[b.tier];
      });

      for (const org of sortedOrgs) {
        const cfg = AI_SCOUT_CFG[org.tier] || AI_SCOUT_CFG.B;
        const tierLim = AI_TIER_LIMITS[org.tier] || AI_TIER_LIMITS.B;
        const roster = newAiOrgs[org.id].roster;
        if (roster.length >= cfg.idealRoster) continue;
        if (freeAgents.length === 0) break;

        // Sort FA by OVR desc — higher tier orgs grab best available
        const sortedFA = [...freeAgents].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a));

        for (const fa of sortedFA) {
          if (roster.length >= cfg.idealRoster) break;
          if (Engine.rng.float(rng) > tierLim.faAggressiveness) continue;

          // Check tier limits
          const counts = Engine.rival.countRosterRanks(roster);
          const pot = fa.pot || fa.notionValue || {};
          const avgPot = Math.round(((pot.pw||0)+(pot.sp||0)+(pot.te||0)+(pot.st||0)+(pot.mn||0))/5);
          const rank = avgPot >= 160 ? 'prodigy' : avgPot >= 130 ? 'promising' : 'rough';
          if (rank === 'prodigy' && counts.prodigies >= tierLim.maxProdigies) continue;
          if (rank === 'promising' && counts.promising >= tierLim.maxPromising) continue;

          // Acquire
          const acquired = Engine.popularity.applyTransferReset({ ...fa, orgId: org.id });
          roster.push(acquired);
          freeAgents = freeAgents.filter(f => f.id !== fa.id);
          events.push(`${org.emoji} ${org.name}がFA ${fa.name}を獲得`);
          break; // 1 FA per org per offseason
        }
      }

      return { aiOrgs: newAiOrgs, freeAgents, events };
    }
  },
  season: {
    // Returns { roster, freeAgents, heatScore, events } — does NOT mutate G
    processManage(rng, G) {
      const events = [];
      const injResult = Engine.injury.tick(G.roster, G.freeAgents);
      events.push(...injResult.events);
      let roster = injResult.roster;
      const freeAgents = injResult.freeAgents;

      let heatScore = G.heatScore;
      if (!Engine.util.isShowWeek(G.week)) heatScore = Engine.heat.calcDecay({ ...G, heatScore });

      const dormBonus = Engine.facility.getConditionBonus(G);
      const stateForCalc = { ...G, roster, heatScore };

      roster = roster.map(c => {
        const nc = { ...c, seasonGrowth: { ...(c.seasonGrowth || {pw:0,sp:0,te:0,st:0,mn:0}) } };

        // D-1: Rental fighters — injury recovery only, no growth/promo
        if (nc.isRental) {
          if (nc.injury) return { ...nc, condition: Math.min(100, nc.condition + 5), _weekAction: '療養（レンタル）' };
          nc.condition = Math.min(100, nc.condition + 3);
          nc._weekAction = 'rental';
          return nc;
        }

        if (nc.injury) {
          const indomitableBonus = Traits.has(nc, '不屈') ? 3 : 0;
          return { ...nc, condition: Math.min(100, nc.condition + (5 + Engine.rng.int(rng, 0, 4)) + Engine.facility.getMedicalRecovery(G) + indomitableBonus), _weekAction: '療養', intensive: false };
        }

        if (nc.intensive) {
          const growStat = Engine.coach.pickGrowthStat(rng, stateForCalc, nc.id);
          const growth = Engine.growth.calcGrowth(rng, stateForCalc, nc, growStat);
          if (growth > 0) { nc[growStat] += growth; nc.seasonGrowth[growStat] = (nc.seasonGrowth[growStat] || 0) + growth; }
          nc.condition = Math.max(0, nc.condition - Math.round(6 + Engine.rng.int(rng, 0, 7)) + dormBonus);
          if (Engine.rng.float(rng) < GROWTH_CONFIG.intensiveInjuryChance * Engine.coach.getInjuryMult(stateForCalc, nc.id)) {
            const weeks = 1 + Engine.rng.int(rng, 0, 1);
            nc.injury = { type: '練習負傷', weeksLeft: weeks, severity: 'minor', color: '#f39c12' };
            events.push(`⚠️ ${nc.name}が強化練習中に負傷！（${weeks}週離脱）`);
          }
          nc.intensiveWeeks = (nc.intensiveWeeks || 0) + 1;
          nc._weekAction = 'intensive';
          nc.intensive = false;
          return nc;
        }

        let action = nc.schedule;
        if (action === 'balance') action = Engine.util.isShowWeek(G.week) ? 'promo' : 'practice';
        if (nc.condition <= 30) action = 'rest';
        const mentalBonus = Engine.coach.getCondBonus(stateForCalc, nc.id);

        if (action === 'practice') {
          const growStat = Engine.coach.pickGrowthStat(rng, stateForCalc, nc.id);
          const growth = Engine.growth.calcGrowth(rng, stateForCalc, nc, growStat);
          if (growth > 0) { nc[growStat] += growth; nc.seasonGrowth[growStat] = (nc.seasonGrowth[growStat] || 0) + growth; }
          const ironBonus = Traits.has(nc, '鉄人') ? 2 : 0;
          nc.condition = Math.max(0, nc.condition - (3 + Engine.rng.int(rng, 0, 3)) + dormBonus + mentalBonus + ironBonus);
          nc.intensiveWeeks = 0;
        } else if (action === 'promo') {
          // v1.0b: Apply diminishing returns + promo pop cap
          const rawPromoGain = Math.floor(1 + Engine.rng.float(rng) * 2) + Engine.coach.getPopBonusForChar(stateForCalc, nc.id) + Engine.facility.getPromoBonus(G);
          const diminishedGain = Engine.popularity.applyDiminishing(rawPromoGain, nc.popularity);
          const newPop = nc.popularity + diminishedGain;
          nc.popularity = Math.min(PROMO_POP_CAP, Math.min(100, newPop)); // promo alone cannot exceed PROMO_POP_CAP
          nc.condition = Math.max(0, nc.condition - (1 + Engine.rng.int(rng, 0, 1)) + dormBonus + mentalBonus);
          nc.intensiveWeeks = 0;
        } else {
          const restIronBonus = Traits.has(nc, '鉄人') ? 3 : 0;
          nc.condition = Math.min(100, nc.condition + (8 + Engine.rng.int(rng, 0, 7)) + Engine.facility.getRestBonus(G) + mentalBonus + restIronBonus);
          nc.intensiveWeeks = 0;
        }
        nc._weekAction = action;
        return nc;
      });

      // v1.0b §B-2: Scandal check (weekly, for each fighter with pop >= 40)
      const scandalRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 777));
      roster = roster.map(c => {
        if (c.injury || c.isRental) return c;
        const isChamp = G.titles?.world?.championId === c.id;
        const scandal = Engine.popularity.checkScandal(scandalRng, c, isChamp);
        if (!scandal) return c;
        events.push(scandal.msg);
        return { ...c, popularity: Math.max(1, c.popularity + scandal.popDelta) };
      });

      return { roster, freeAgents, heatScore, events };
    },

    // Returns { funds, weeklyFinance, roster, summary, occHeatDelta } — does NOT mutate G
    processSettlement(G) {
      const details = [];
      let totalIncome = 0, totalExpense = 0;
      let occHeatDelta = 0;

      const salary = Engine.economy.calcWeeklySalary(G.roster);
      totalExpense += salary;
      details.push({ label: '選手給与', val: -salary, type: 'expense' });

      const fixed = Engine.economy.calcFixedCosts();
      totalExpense += fixed;
      details.push({ label: '固定費（施設+事務）', val: -fixed, type: 'expense' });

      const coachSalary = Engine.coach.getSalaryTotal(G);
      if (coachSalary > 0) {
        totalExpense += coachSalary;
        details.push({ label: `コーチ給与（${G.coaches.length}名）`, val: -coachSalary, type: 'expense' });
      }

      const facilityMaint = Engine.facility.getMaintenance(G);
      if (facilityMaint > 0) {
        totalExpense += facilityMaint;
        details.push({ label: '施設アップグレード維持費', val: -facilityMaint, type: 'expense' });
      }

      const sponsor = Engine.economy.getSponsorIncome(G.orgPop);
      totalIncome += sponsor;
      if (sponsor > 0) details.push({ label: 'スポンサー収入', val: sponsor, type: 'income' });

      const broadcastBonus = Engine.facility.getBroadcastBonus(G);
      const broadcast = Engine.economy.getBroadcastIncome(G.orgPop) + broadcastBonus;
      totalIncome += broadcast;
      if (broadcast > 0) details.push({ label: `放映権収入${broadcastBonus > 0 ? '（メディア施設+' + broadcastBonus + '万）' : ''}`, val: broadcast, type: 'income' });

      let roster = G.roster.map(c => ({ ...c }));

      if (Engine.util.isShowWeek(G.week) && G.lastShowResults.length > 0) {
        // v1.0c: 積み上げ方式（平均→calcCardPop）
        const matchPops = G.lastShowResults.map(r => {
          const lc = roster.find(c => c.id === r.left.id);
          const rc = roster.find(c => c.id === r.right.id);
          return (lc ? lc.popularity : 0) + (rc ? rc.popularity : 0);
        });
        const mainPop = Engine.economy.calcCardPop(matchPops);

        const hasTitleMatch = G.showCard.some(m => m.isTitle && m.left > 0 && m.right > 0);
        const champId = G.titles?.world?.championId;
        const hasChampOnCard = champId ? G.showCard.some(m => m.left === champId || m.right === champId) : false;
        const attendance = Engine.economy.calcAttendance(G, G.showVenue, mainPop, hasTitleMatch, hasChampOnCard);
        const rev = Engine.economy.calcShowRevenue(roster, G.showVenue, attendance);

        totalIncome += rev.ticketRev;
        totalIncome += rev.goodsRev;
        totalExpense += rev.venueCost;

        const occPct = Math.round(rev.occupancyRate * 100);
        details.push({ label: `チケット収入（${attendance}人 / ${VENUES[G.showVenue].cap}席 ${occPct}% ${rev.occLabel}）`, val: rev.ticketRev, type: 'income' });
        details.push({ label: 'グッズ収入', val: rev.goodsRev, type: 'income' });
        details.push({ label: `会場費（${VENUES[G.showVenue].name}）`, val: -rev.venueCost, type: 'expense' });
        occHeatDelta = rev.occHeatDelta;

        // Win/loss tracking (immutable)
        G.lastShowResults.forEach(r => {
          const wId = r.winner === 'left' ? r.left.id : r.winner === 'right' ? r.right.id : null;
          if (wId) {
            const lId = wId === r.left.id ? r.right.id : r.left.id;
            roster = roster.map(c => c.id === wId ? { ...c, wins: c.wins + 1 } : c.id === lId ? { ...c, losses: c.losses + 1 } : c);
          } else {
            roster = roster.map(c => (c.id === r.left.id || c.id === r.right.id) ? { ...c, draws: c.draws + 1 } : c);
          }
        });

        // Condition drain (immutable)
        const usedIds = new Set();
        G.lastShowResults.forEach(r => { usedIds.add(r.left.id); usedIds.add(r.right.id); });
        roster = roster.map(c => {
          if (!usedIds.has(c.id)) return c;
          const condRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, c.id));
          return { ...c, condition: Math.max(0, c.condition - (8 + Engine.rng.int(condRng, 0, 7))) };
        });
      }

      // Natural condition recovery (+ mental coach bonus)
      roster = roster.map(c => ({ ...c, condition: Math.min(100, c.condition + 3 + Engine.coach.getCondBonus(G, c.id)) }));

      const net = totalIncome - totalExpense;
      const newFunds = G.funds + net;
      const weeklyFinance = { income: totalIncome, expense: totalExpense, details, net };
      const summary = `第${G.week}週: 収入${totalIncome}万 / 支出${totalExpense}万 = ${net >= 0 ? '+' : ''}${net}万 (残高: ${newFunds}万)`;

      return { funds: newFunds, weeklyFinance, roster, summary, occHeatDelta };
    }
  },

  // ══════════════════════════════════════════════════════════
  //  tickWeek: Unified weekly pipeline (principle ⑤)
  //  Input: state — NOT mutated
  //  Output: { state, events }
  // ══════════════════════════════════════════════════════════
  tickWeek(state) {
    const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week));
    const manage = Engine.season.processManage(rng, state);
    let s = { ...state, roster: manage.roster, freeAgents: manage.freeAgents, heatScore: manage.heatScore };
    const settle = Engine.season.processSettlement(s);
    s = { ...s, roster: settle.roster, funds: settle.funds, weeklyFinance: settle.weeklyFinance, weekPhase: 'settled' };
    // v1.0b: Apply occupancy heat delta
    if (settle.occHeatDelta !== 0) {
      s = { ...s, heatScore: s.heatScore + settle.occHeatDelta };
    }
    const events = [...manage.events, settle.summary];
    // D-1: Rental weekly processing
    if (s.rental) {
      const rentalResult = Engine.rental.advanceRental(s);
      s = rentalResult.state;
      events.push(...rentalResult.events);
      // Merge rental cost into weeklyFinance
      if (s.rental || rentalResult.returned) {
        const rentalCost = state.rental.weeklyCost;
        const wf = s.weeklyFinance;
        s = { ...s, weeklyFinance: {
          ...wf,
          expense: wf.expense + rentalCost,
          net: wf.net - rentalCost,
          details: [...wf.details, { label: `レンタル費（${state.rental.weeklyCost}万/週）`, val: -rentalCost, type: 'expense' }]
        }};
      }
    }
    // E3: FA monthly rotation — every 4 weeks, swap 2 out / 2 in
    if (s.week % 4 === 0 && !s.offSeason) {
      let fa = [...(s.freeAgents || [])];
      let pool = [...(s.dormantPool || [])];
      const faRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 9999));
      // Remove up to 2 from FA (random, back to pool)
      const removeCount = Math.min(2, fa.length);
      const shuffledFA = [...fa].sort(() => Engine.rng.float(faRng) - 0.5);
      const removed = shuffledFA.slice(0, removeCount);
      fa = fa.filter(f => !removed.some(r => r.id === f.id));
      for (const r of removed) {
        // Only return to pool if the char exists in ALL_CHARS (has portrait)
        if (ALL_CHARS.find(c => c.id === r.id)) pool.push(r.id);
      }
      // Add up to 2 from pool to FA
      // 占有済みID（現在のfa＋ロスター＋AI団体）を収集して重複を防ぐ
      const faOccupied = new Set(fa.map(f => f.id));
      (s.roster || []).forEach(c => faOccupied.add(c.id));
      Object.values(s.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => faOccupied.add(c.id)));
      // 直前に除外したIDも除外候補から切り離す（just-removed IDの即再入場を防止）
      removed.forEach(r => faOccupied.add(r.id));
      const eligiblePool = pool.filter(id => !faOccupied.has(id));
      const addCount = Math.min(2, eligiblePool.length);
      const shuffledPool = [...eligiblePool].sort(() => Engine.rng.float(faRng) - 0.5);
      const added = [];
      for (let i = 0; i < addCount && i < shuffledPool.length; i++) {
        const cid = shuffledPool[i];
        const template = ALL_CHARS.find(c => c.id === cid);
        if (!template) continue;
        const fighter = Engine.rival.makeAIFighter(template, faRng, null, 18 + Engine.rng.int(faRng, 0, 6));
        fa.push(fighter);
        added.push(fighter);
        pool = pool.filter(id => id !== cid);
      }
      if (removed.length > 0 || added.length > 0) {
        s = { ...s, freeAgents: fa, dormantPool: pool };
        if (added.length > 0) events.push(`📋 FA市場更新: ${added.map(f => f.name).join('、')}が新規参入`);
      }
    }
    // v1.2-9: Flavor events (雑誌取材・TV出演)
    const flavorRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 5555));
    const flavorEvents = Engine.flavor.check(s, flavorRng);
    if (flavorEvents.length > 0) {
      s = Engine.flavor.apply(s, flavorEvents);
      s = { ...s, _flavorEvents: flavorEvents };
      flavorEvents.forEach(ev => {
        if (ev.type === 'magazine') events.push(`${ev.headline}（${ev.fighterName} 人気+${ev.popGain}）`);
        else events.push(`${ev.headline}（ヒート+${ev.heatGain}）`);
      });
    }
    return { state: s, events };
  },

  // ══════════════════════════════════════════════════════════
  //  executeShow: Process all show matches (immutable)
  //  Output: { state, results, injuryResults, events } or { error }
  // ══════════════════════════════════════════════════════════
  executeShow(state) {
    const validMatches = state.showCard.filter(m => m.left > 0 && m.right > 0);
    if (validMatches.length === 0) return { error: '少なくとも1試合を組んでください' };

    // v1.2: タイトルマッチクールダウンガード（UIバイパス防止）
    const hasTitleSlot = validMatches.some(m => m.isTitle);
    if (hasTitleSlot) {
      const cd = Engine.title.canTitleMatch(state);
      if (!cd.allowed) {
        return { error: `タイトルマッチは12週に1回のみ開催できます（あと${cd.weeksLeft}週）` };
      }
    }

    let s = { ...state, totalShows: state.totalShows + 1, weekPhase: 'showExec' };
    let roster = s.roster.map(c => ({ ...c }));
    let rivalries = { ...s.rivalries };
    let titles = { ...s.titles, world: { ...s.titles.world } };
    const events = [];

    const results = validMatches.map(m => {
      const charL = roster.find(c => c.id === m.left);
      const charR = roster.find(c => c.id === m.right);
      if (!charL || !charR) return null;
      const matchRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, m.left, m.right));
      const result = Engine.battle.simulateMatch(charL, charR, matchRng);
      const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
      if (rivalLvl) { result.mq = Math.min(100, result.mq + rivalLvl.mqBonus); result.rivalryBonus = rivalLvl; }
      if (m.isTitle) { result.mq = Math.min(100, result.mq + (TITLES.find(t => t.id === 'world')?.mqBonus || 15)); result.isTitleMatch = true; }
      const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right);
      rivalries = rivalResult.rivalries;
      if (rivalResult.msg) events.push(rivalResult.msg);
      const coachMQ = Engine.coach.getMQBonusForMatch(s, m.left, m.right);
      if (coachMQ > 0) { result.mq = Math.min(100, result.mq + coachMQ); result.coachMQBonus = coachMQ; }
      return result;
    }).filter(Boolean);

    // Title outcomes
    validMatches.forEach((m, i) => {
      if (!m.isTitle || !results[i]) return;
      const r = results[i];
      const champId = titles.world.championId;
      const tempState = { ...s, titles, roster };
      if (r.winner === 'draw') {
        if (champId) { const def = Engine.title.recordDefense(tempState); titles = def.titles; roster = def.roster; events.push(def.msg); }
      } else {
        const winnerId = r.winner === 'left' ? m.left : m.right;
        if (!champId || winnerId !== champId) {
          const crown = Engine.title.crownChampion(tempState, winnerId); titles = crown.titles; roster = crown.roster; events.push(crown.msg);
        } else {
          const def = Engine.title.recordDefense(tempState); titles = def.titles; roster = def.roster; events.push(def.msg);
        }
      }
    });

    // v1.0c: 会場熱気MQボーナス — 満員率＋会場規模が全試合のMQを補正
    const showMatchPops = validMatches.map(m => {
      const lc = roster.find(c => c.id === m.left);
      const rc = roster.find(c => c.id === m.right);
      return (lc ? lc.popularity : 0) + (rc ? rc.popularity : 0);
    });
    const showCardPop = Engine.economy.calcCardPop(showMatchPops);
    const hasTitleMatchForAttend = validMatches.some(m => m.isTitle);
    const champIdForAttend = s.titles?.world?.championId;
    const hasChampOnCardForAttend = champIdForAttend ? validMatches.some(m => m.left === champIdForAttend || m.right === champIdForAttend) : false;
    const preAttendance = Engine.economy.calcAttendance(s, s.showVenue, showCardPop, hasTitleMatchForAttend, hasChampOnCardForAttend);
    const preOccRate = preAttendance / VENUES[s.showVenue].cap;
    const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);
    if (crowdMQ.total !== 0) {
      results.forEach(r => { r.mq = Engine.util.clamp(r.mq + crowdMQ.total, 5, 100); });
      if (crowdMQ.crowdLabel) {
        events.push(`🏟️ ${crowdMQ.crowdLabel}（MQ全試合 ${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}）`);
      }
    }

    // MQ popularity (immutable) — v1.0b: includes diminishing returns, losing streak, main event penalty
    const mainEventIdx = results.length - 1; // last match is main event
    results.forEach((r, idx) => {
      const isMainEvent = idx === mainEventIdx;
      const mqPop = Engine.applyMQPopularity(roster, r, isMainEvent);
      roster = mqPop.roster;
      events.push(...mqPop.popEvents);
    });
    const popResult = Engine.applyShowPopularity(roster, results, s.orgPop);
    roster = popResult.roster;
    events.push(`📊 興行平均MQ: ${Math.round(results.reduce((a,r) => a + r.mq, 0) / results.length)} → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${popResult.popDelta} (現在: ${popResult.orgPop})`);

    // Heat (immutable)
    const avgMQ = Math.round(results.reduce((a, r) => a + r.mq, 0) / results.length);
    const oldHeat = Engine.heat.getLevel(s);
    const newHeatScore = Engine.heat.calcUpdate(s, avgMQ);
    const newHeat = Engine.heat.getLevel({ ...s, heatScore: newHeatScore });
    if (oldHeat.id !== newHeat.id) events.push(`${newHeat.emoji} Heat変動: ${oldHeat.label} → ${newHeat.label}（集客倍率 ×${newHeat.mult}）`);

    // Injuries (immutable) — separate RNG per fighter to avoid correlation
    const injuryResults = [];
    const injuryReduction = Engine.facility.getInjuryReduction(s);
    results.forEach((r, idx) => {
      const lc = roster.find(c => c.id === r.left.id);
      const injRngL = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.left.id));
      const li = Engine.injury.check(injRngL, lc, r, injuryReduction, Engine.coach.getInjuryMult(s, r.left.id));
      if (li) {
        // v1.3-1: §4.2/§4.3 怪我引退チェック
        if (li.retireType) {
          const retiredMsg = li.retireType === 'careerEnding' ? '壊滅的な怪我' : '怪我による引退';
          let retiredF = Engine.career.addEvent(li.newFighter, { type: 'retire', reason: li.retireType, season: s.season, week: s.week, age: li.newFighter.age });
          roster = roster.filter(c => c.id !== lc.id);
          s = { ...s, retiredFighters: [...(s.retiredFighters || []), retiredF] };
          injuryResults.push({ name: lc.name, injury: li.newFighter.injury, retireType: li.retireType });
          events.push(`🏁 ${lc.name}(${lc.age}歳)が${retiredMsg}により引退`);
        } else {
          roster = roster.map(c => c.id === lc.id ? li.newFighter : c);
          injuryResults.push({ name: lc.name, injury: li.newFighter.injury });
        }
      }
      const rc = roster.find(c => c.id === r.right.id);
      const injRngR = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.right.id));
      const ri = Engine.injury.check(injRngR, rc, r, injuryReduction, Engine.coach.getInjuryMult(s, r.right.id));
      if (ri) {
        // v1.3-1: §4.2/§4.3 怪我引退チェック
        if (ri.retireType) {
          const retiredMsg = ri.retireType === 'careerEnding' ? '壊滅的な怪我' : '怪我による引退';
          let retiredF = Engine.career.addEvent(ri.newFighter, { type: 'retire', reason: ri.retireType, season: s.season, week: s.week, age: ri.newFighter.age });
          roster = roster.filter(c => c.id !== rc.id);
          s = { ...s, retiredFighters: [...(s.retiredFighters || []), retiredF] };
          injuryResults.push({ name: rc.name, injury: ri.newFighter.injury, retireType: ri.retireType });
          events.push(`🏁 ${rc.name}(${rc.age}歳)が${retiredMsg}により引退`);
        } else {
          roster = roster.map(c => c.id === rc.id ? ri.newFighter : c);
          injuryResults.push({ name: rc.name, injury: ri.newFighter.injury });
        }
      }
    });

    // v1.2: タイトルマッチ実施時に絶対週数を記録
    const executedTitleMatch = validMatches.some(m => m.isTitle);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    s = { ...s, roster, rivalries, titles, heatScore: newHeatScore, orgPop: popResult.orgPop, lastShowResults: results, lastTitleMatchWeek };
    return { state: s, results, injuryResults, events };
  },

  // MQ/Show popularity helpers (pure functions)
  applyMQPopularity(roster, result, isMainEvent) {
    const popEvents = [];
    const newRoster = roster.map(c => {
      const isLeft = c.id === result.left.id, isRight = c.id === result.right.id;
      if (!isLeft && !isRight) return c;
      const isWinner = (isLeft && result.winner === 'left') || (isRight && result.winner === 'right');
      const isDraw = result.winner === 'draw';

      // Base raw gain from MQ
      let rawGain = result.mq >= 70 ? 3 : result.mq >= 50 ? 2 : result.mq >= 30 ? 1 : 0;
      if (isWinner) rawGain += 1;
      // ヒール適性 + Heel: 試合後の人気上昇ボーナス
      if (Traits.has(c, 'ヒール適性') && (c.role === 'Heel' || c.role === 'Dirty') && result.mq >= 40) rawGain += 1;

      // v1.0b: Apply diminishing returns
      let popDelta = Engine.popularity.applyDiminishing(rawGain, c.popularity);

      // v1.0b §B-4: Main event poor match penalty (both fighters)
      if (isMainEvent) {
        const mainPenalty = Engine.popularity.checkMainEventPenalty(result.mq);
        if (mainPenalty < 0) {
          popDelta += mainPenalty; // penalties are not diminished
          popEvents.push(`📉 メインイベントの低MQ(${result.mq})で${c.name}の人気${mainPenalty}`);
        }
      }

      // v1.0b §B-1: Losing streak tracking
      const streakResult = Engine.popularity.checkLosingStreak(c, isWinner || isDraw);
      if (streakResult.msg) popEvents.push(streakResult.msg);
      popDelta += streakResult.popDelta;

      // 負けず嫌い用: 試合結果を記録
      let lastMatchResult = isWinner ? 'win' : (isDraw ? 'draw' : 'loss');
      const newPop = Engine.util.clamp(c.popularity + popDelta, 1, 100);
      return { ...c, popularity: newPop, lastMatchResult, losingStreak: streakResult.losingStreak };
    });
    return { roster: newRoster, popEvents };
  },
  applyShowPopularity(roster, results, orgPop) {
    if (results.length === 0) return { roster, orgPop, popDelta: 0 };
    const avgMQ = Math.round(results.reduce((s, r) => s + r.mq, 0) / results.length);
    const popDelta = avgMQ >= 70 ? 3 : avgMQ >= 55 ? 2 : avgMQ >= 40 ? 1 : avgMQ >= 25 ? 0 : -1;
    return { roster, orgPop: Engine.util.clamp(orgPop + popDelta, 0, 100), popDelta };
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ENGINE: ACE & TRANSFER (Phase C)                         ║
  // ╚══════════════════════════════════════════════════════════╝

  // ── C-3: Transfer Fee Calculation ──
  transfer: {
    calcFee(fighter, fromOrg) {
      const overall = Engine.util.ov(fighter);
      const popBonus = fighter.popularity * 15; // v1.0b: increased from ×10 to compensate lower avg pop
      let baseFee;
      if (overall >= 80)      baseFee = 800;
      else if (overall >= 60) baseFee = 400;
      else if (overall >= 45) baseFee = 200;
      else                    baseFee = 100;
      const tierMul = { S: 1.5, A: 1.2, B: 1.0 }[fromOrg?.tier || 'B'];
      return Math.round((baseFee + popBonus) * tierMul);
    },
    calcRetentionCost(fighter) {
      return Math.round(Engine.transfer.calcFee(fighter, { tier: 'B' }) * TRANSFER_CONFIG.retentionCostMultiplier);
    },

    // C-2: Quarterly transfer window — AI poach from player
    processTransferWindow(rng, state) {
      const cfg = TRANSFER_CONFIG;
      const events = [];
      let s = { ...state };
      const rankings = s.rankings || [];
      const playerRank = Engine.ranking.getPlayerRank(rankings);
      const poachAttempts = [];

      // AI → Player poach attempts
      s.roster.forEach(fighter => {
        if (fighter.popularity < cfg.poachMinPopularity) return;
        if (s.titles?.world?.championId === fighter.id) return; // チャンピオンは対象外

        // Only higher-ranked orgs can poach
        if (cfg.poachRequiresHigherRank) {
          const higherOrgs = RIVAL_ORGS.filter(org => {
            if (!s.aiOrgs[org.id]) return false;
            const orgRank = rankings.findIndex(r => r.orgId === org.id) + 1;
            return orgRank > 0 && orgRank < playerRank;
          });
          if (higherOrgs.length === 0) return;

          // Each eligible org rolls independently
          higherOrgs.forEach(org => {
            if (Engine.rng.float(rng) < cfg.poachChancePerFighter) {
              poachAttempts.push({ fighter, org, fee: Engine.transfer.calcFee(fighter, org) });
            }
          });
        }
      });

      if (poachAttempts.length > 0) {
        // Store pending poach for UI resolution
        s = { ...s, pendingPoach: poachAttempts };
        events.push(`🔔 移籍ウィンドウ: ${poachAttempts.length}件の引き抜きオファー`);
      } else {
        s = { ...s, pendingPoach: [] };
        events.push('📋 移籍ウィンドウ: 引き抜きオファーなし');
      }
      return { state: s, events };
    },

    // Resolve a single poach (called from UI)
    resolvePoach(state, fighterIdToRelease, accepted) {
      let s = { ...state };
      const pending = [...(s.pendingPoach || [])];
      const idx = pending.findIndex(p => p.fighter.id === fighterIdToRelease);
      if (idx === -1) return { state: s, events: [] };

      const poach = pending[idx];
      const events = [];

      if (accepted) {
        // Fighter leaves — player gets transfer fee
        s = { ...s,
          roster: s.roster.filter(c => c.id !== fighterIdToRelease),
          funds: s.funds + poach.fee
        };
        // Add fighter to AI org
        const targetId = poach.org.id;
        const targetData = s.aiOrgs[targetId];
        if (targetData) {
          // v1.0b: Transfer popularity reset
          let resetFighter = Engine.popularity.applyTransferReset({ ...poach.fighter, orgId: targetId });
          // v1.3: Record transfer event
          resetFighter = Engine.career.addEvent(resetFighter, { type: 'transfer', season: s.season, week: s.week, fromOrg: 'player', toOrg: poach.org.name, via: 'poach' });
          const newAiOrgs = { ...s.aiOrgs, [targetId]: { ...targetData, roster: [...targetData.roster, resetFighter] } };
          s = { ...s, aiOrgs: newAiOrgs };
        }
        events.push(`💸 ${poach.fighter.name}が${poach.org.name}に移籍（移籍金+${poach.fee}万）`);
      } else {
        // Defend — player pays retention cost
        const retCost = Engine.transfer.calcRetentionCost(poach.fighter);
        // Non-champion: 80% defense success
        const defRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week, fighterIdToRelease));
        const defended = s.titles?.world?.championId === fighterIdToRelease
          ? true
          : Engine.rng.float(defRng) < TRANSFER_CONFIG.nonChampionRetentionRate;
        if (defended) {
          s = { ...s, funds: s.funds - retCost };
          events.push(`🛡️ ${poach.fighter.name}の引き留めに成功（-${retCost}万）`);
        } else {
          // Defense failed — forced transfer
          const targetId = poach.org.id;
          const targetData = s.aiOrgs[targetId];
          s = { ...s,
            roster: s.roster.filter(c => c.id !== fighterIdToRelease),
            funds: s.funds + poach.fee
          };
          if (targetData) {
            // v1.0b: Transfer popularity reset
            let resetFighter = Engine.popularity.applyTransferReset({ ...poach.fighter, orgId: targetId });
            // v1.3: Record forced transfer
            resetFighter = Engine.career.addEvent(resetFighter, { type: 'transfer', season: s.season, week: s.week, fromOrg: 'player', toOrg: poach.org.name, via: 'poach_forced' });
            const newAiOrgs = { ...s.aiOrgs, [targetId]: { ...targetData, roster: [...targetData.roster, resetFighter] } };
            s = { ...s, aiOrgs: newAiOrgs };
          }
          events.push(`😭 ${poach.fighter.name}の引き留め失敗 → ${poach.org.name}に移籍（+${poach.fee}万）`);
        }
      }

      pending.splice(idx, 1);
      s = { ...s, pendingPoach: pending };
      return { state: s, events };
    },

    // Player poach from AI org
    playerPoach(state, aiOrgId, fighterId) {
      let s = { ...state };
      const events = [];

      const orgCfg = RIVAL_ORGS.find(o => o.id === aiOrgId);
      const orgData = s.aiOrgs[aiOrgId];
      if (!orgCfg || !orgData) return { state: s, events };

      const fighter = orgData.roster.find(f => f.id === fighterId);
      if (!fighter) return { state: s, events };

      const fee = Engine.transfer.calcFee(fighter, orgCfg);
      if (s.funds < fee) {
        events.push(`❌ 資金不足（必要: ${fee}万, 残高: ${s.funds}万）`);
        return { state: s, events };
      }

      // Remove from AI org, add to player roster (add missing player-roster fields)
      const newAiOrgs = { ...s.aiOrgs, [aiOrgId]: { ...orgData, roster: orgData.roster.filter(f => f.id !== fighterId) } };
      let newFighter = { ...fighter, orgId: 'player',
        condition: fighter.condition ?? 80,
        schedule: fighter.schedule || 'balance',
        wins: fighter.wins || 0, losses: fighter.losses || 0, draws: fighter.draws || 0,
        injury: fighter.injury || null,
        seasonGrowth: fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
        careerSeasons: fighter.careerSeasons || 0,
        intensive: false, intensiveWeeks: 0
      };
      // v1.3: Record transfer event
      newFighter = Engine.career.addEvent(newFighter, { type: 'transfer', season: s.season, week: s.week, fromOrg: orgCfg.name, toOrg: 'player', via: 'poach' });
      s = { ...s,
        aiOrgs: newAiOrgs,
        roster: [...s.roster, newFighter],
        funds: s.funds - fee,
        transfersThisSeason: (s.transfersThisSeason || 0) + 1
      };
      events.push(`🤝 ${fighter.name}を${orgCfg.name}から獲得！（移籍金-${fee}万）`);
      return { state: s, events };
    }
  },

  // ── F2: Player Negotiation System ────────────────
  negotiate: {
    /** Get traits-based dialogue for a fighter */
    getDialogue(fighter, phase) {
      const lines = NEGOTIATE_LINES[phase];
      if (!lines) return '';
      const ch = ALL_CHARS.find(c => c.id === fighter.id);
      const traits = ch ? (ch.traits || []) : [];
      const role = ch ? ch.role : 'Neutral';
      // Check trait-specific lines first
      for (const t of traits) {
        if (lines[t]) return lines[t];
      }
      // Fall back to role
      if (role === 'Heel' && lines._heel) return lines._heel;
      if (role === 'Babyface' && lines._babyface) return lines._babyface;
      return lines._neutral || '';
    },

    /** Calculate base fee for poaching a fighter */
    calcBaseFee(fighter, orgCfg) {
      return Engine.transfer.calcFee(fighter, orgCfg);
    },

    /** Calculate success rate */
    calcSuccessRate(state, fighter, orgCfg, planIndex) {
      const cfg = NEGOTIATION_CONFIG;
      let rate = cfg.baseSuccessRates[orgCfg.tier] || 30;

      // Reductions
      const orgData = state.aiOrgs[orgCfg.id];
      if (orgData) {
        const sorted = [...orgData.roster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a));
        if (sorted[0] && sorted[0].id === fighter.id) rate -= 15; // ace
      }
      if (Engine.util.ov(fighter) >= 80) rate -= 10;
      // Check if player org is last in rankings
      const rankings = state.rankings || [];
      const playerRank = rankings.find(r => r.orgId === 'player');
      if (playerRank && playerRank.rank === rankings.length) rate -= 10;

      // Additions
      if (Engine.util.ov(fighter) < 50) rate += 10;
      // War victory bonus: check if player beat this org this season
      if (state.warVictories && state.warVictories.includes(orgCfg.id)) rate += 15;
      // Popularity comparison
      const aiPop = orgData ? orgData.orgPop : 50;
      if ((state.orgPop || 0) > aiPop) rate += 10;
      // Plan bonus
      rate += cfg.planBonusRates[planIndex] || 0;

      return Math.max(cfg.clampMin, Math.min(cfg.clampMax, rate));
    },

    /** Start a negotiation (result pre-determined by rng) */
    startNegotiation(rng, state, orgId, fighterId, planIndex) {
      const cfg = NEGOTIATION_CONFIG;
      const orgCfg = RIVAL_ORGS.find(o => o.id === orgId);
      const orgData = state.aiOrgs[orgId];
      if (!orgCfg || !orgData) return { state, events: ['❌ 団体情報が見つかりません'] };

      const fighter = orgData.roster.find(f => f.id === fighterId);
      if (!fighter) return { state, events: ['❌ 選手が見つかりません'] };

      // Check concurrent limit
      if (state.pendingNegotiation) {
        return { state, events: ['❌ 既に交渉中の案件があります'] };
      }
      // Check cooldown
      const negotiated = state.negotiatedThisSeason || [];
      if (negotiated.includes(fighterId)) {
        return { state, events: ['❌ この選手とは今シーズン既に交渉済みです'] };
      }

      const baseFee = Engine.negotiate.calcBaseFee(fighter, orgCfg);
      const costMul = cfg.baseFeeMultipliers[planIndex];
      const totalCost = Math.round(baseFee * costMul);
      const failCost = Math.round(totalCost * cfg.failureCostRatio);

      // Check funds
      if (state.funds < totalCost) {
        return { state, events: [`❌ 資金不足（必要: ${totalCost}万, 残高: ${state.funds}万）`] };
      }

      // Pre-determine result
      const successRate = Engine.negotiate.calcSuccessRate(state, fighter, orgCfg, planIndex);
      const roll = Engine.rng.int(rng, 1, 100);
      const success = roll <= successRate;

      const negotiation = {
        orgId,
        fighterId,
        fighterName: fighter.name,
        planIndex,
        totalCost,
        failCost,
        successRate,
        success,
        startWeek: state.week,
        resolveWeek: state.week + cfg.durationWeeks
      };

      const events = [`📋 ${fighter.name}への引き抜き交渉を開始（${cfg.durationWeeks}週間）`];
      return {
        state: {
          ...state,
          pendingNegotiation: negotiation,
          negotiatedThisSeason: [...negotiated, fighterId]
        },
        events
      };
    },

    /** Check and resolve pending negotiation */
    resolveNegotiation(state) {
      const neg = state.pendingNegotiation;
      if (!neg || state.week < neg.resolveWeek) return null;

      const orgCfg = RIVAL_ORGS.find(o => o.id === neg.orgId);
      const orgData = state.aiOrgs[neg.orgId];
      if (!orgCfg || !orgData) {
        return { state: { ...state, pendingNegotiation: null }, events: ['❌ 交渉先の団体情報エラー'], success: false };
      }

      const fighter = orgData.roster.find(f => f.id === neg.fighterId);
      const events = [];

      if (neg.success && fighter) {
        // Success: move fighter, deduct full cost
        const newAiOrgs = { ...state.aiOrgs, [neg.orgId]: { ...orgData, roster: orgData.roster.filter(f => f.id !== neg.fighterId) } };
        const newFighter = { ...fighter, orgId: 'player',
          condition: fighter.condition ?? 80,
          schedule: fighter.schedule || 'balance',
          wins: fighter.wins || 0, losses: fighter.losses || 0, draws: fighter.draws || 0,
          injury: fighter.injury || null,
          seasonGrowth: fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
          careerSeasons: fighter.careerSeasons || 0,
          intensive: false, intensiveWeeks: 0
        };
        // v1.0b: Transfer popularity reset
        let resetFighter = Engine.popularity.applyTransferReset(newFighter);
        // v1.3: Record transfer event
        resetFighter = Engine.career.addEvent(resetFighter, { type: 'transfer', season: state.season, week: state.week, fromOrg: orgCfg.name, toOrg: 'player', via: 'negotiate' });
        events.push(`🎉 ${fighter.name}の引き抜き交渉成功！（-${neg.totalCost}万）`);
        return {
          state: {
            ...state,
            aiOrgs: newAiOrgs,
            roster: [...state.roster, resetFighter],
            funds: state.funds - neg.totalCost,
            pendingNegotiation: null,
            transferLog: [...(state.transferLog || []), { season: state.season, week: state.week, type: 'negotiate', fighter: fighter.name, from: orgCfg.name, cost: neg.totalCost }]
          },
          events,
          success: true,
          fighter
        };
      } else {
        // Failure: deduct fail cost
        events.push(`😞 ${neg.fighterName}の引き抜き交渉失敗…（-${neg.failCost}万）`);
        return {
          state: {
            ...state,
            funds: state.funds - neg.failCost,
            pendingNegotiation: null
          },
          events,
          success: false,
          fighter: fighter || { id: neg.fighterId, name: neg.fighterName }
        };
      }
    }
  },

  // ── Phase D: Rental System (rival-spec §8) ────────────────
  rental: {
    /** List all rentable fighters from AI orgs */
    getAvailableRentals(state) {
      const results = [];
      RIVAL_ORGS.forEach(orgCfg => {
        const orgData = state.aiOrgs && state.aiOrgs[orgCfg.id];
        if (!orgData) return;
        const org = { ...orgCfg, roster: orgData.roster, orgPop: orgData.orgPop };
        const sorted = [...orgData.roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
        // Only rank 5+ (index >= 4) are available
        sorted.slice(4).forEach(f => {
          if (f.injury) return; // skip injured
          const fee = Engine.rental.calcWeeklyFee(f, orgCfg);
          results.push({ fighter: f, org, weeklyFee: fee, totalFee: fee * RENTAL_CONFIG.duration });
        });
      });
      return results;
    },

    calcWeeklyFee(fighter, org) {
      const ovr = Engine.util.ov(fighter);
      // v0.99c: 指数カーブ — 低OVRは安く、高OVRは急激に高い
      const baseFee = Math.pow(ovr / 50, 2.5) * 25;
      const tierMul = { S: 1.4, A: 1.15, B: 1.0 }[org.tier] || 1.0;
      return Math.max(5, Math.round(baseFee * tierMul));
    },

    /** Attempt rental negotiation. Returns { success, state, events } */
    requestRental(rng, state, fighterId, fromOrgId) {
      const events = [];
      if (state.rental) return { success: false, state, events: ['⚠ 既にレンタル中の選手がいます'] };

      const orgCfg = RIVAL_ORGS.find(o => o.id === fromOrgId);
      const orgData = state.aiOrgs && state.aiOrgs[fromOrgId];
      if (!orgCfg || !orgData) return { success: false, state, events: ['⚠ 団体が見つかりません'] };

      const fighter = orgData.roster.find(f => f.id === fighterId);
      if (!fighter) return { success: false, state, events: ['⚠ 選手が見つかりません'] };

      // Negotiation check (rival-spec §8.5)
      const rankings = state.rankings || [];
      const pRank = rankings.find(r => r.orgId === 'player');
      const oRank = rankings.find(r => r.orgId === fromOrgId);
      let baseRate = 0.80;
      if (pRank && oRank) {
        const gap = oRank.rating - pRank.rating;
        if (gap > 150) baseRate -= 0.3;
        else if (gap > 80) baseRate -= 0.1;
      }
      baseRate = Math.max(0.3, Math.min(0.9, baseRate));

      if (Engine.rng.float(rng) >= baseRate) {
        events.push(`❌ ${orgCfg.name}がレンタル要請を拒否（交渉成功率${Math.round(baseRate * 100)}%）`);
        return { success: false, state, events };
      }

      const weeklyFee = Engine.rental.calcWeeklyFee(fighter, orgCfg);
      // Add rental fighter to player roster (marked as rental)
      const rentalFighter = {
        ...fighter,
        isRental: true, rentalFromOrg: fromOrgId, rentalWeeksLeft: RENTAL_CONFIG.duration,
        condition: 80, seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 }
      };
      const rental = { fighterId: fighter.id, fromOrgId, weeksLeft: RENTAL_CONFIG.duration, weeklyCost: weeklyFee };
      const s = { ...state, roster: [...state.roster, rentalFighter], rental };
      events.push(`🤝 ${fighter.name}を${orgCfg.name}からレンタル！（${weeklyFee}万/週×${RENTAL_CONFIG.duration}週）`);
      return { success: true, state: s, events };
    },

    /** Weekly rental processing: charge fee, decrement weeks, return if done */
    advanceRental(state) {
      if (!state.rental) return { state, events: [], returned: false };
      const events = [];
      let r = { ...state.rental, weeksLeft: state.rental.weeksLeft - 1 };
      let s = { ...state, funds: state.funds - r.weeklyCost };

      if (r.weeksLeft <= 0) {
        // Return fighter
        const rentalF = s.roster.find(c => c.id === r.fighterId);
        const returning = s.roster.filter(c => c.id !== r.fighterId);
        // Update fighter in AI org (popularity/injury may have changed)
        let aiOrgs = s.aiOrgs;
        const fromData = aiOrgs[r.fromOrgId];
        if (fromData) {
          aiOrgs = { ...aiOrgs, [r.fromOrgId]: { ...fromData, roster: fromData.roster.map(f => f.id === r.fighterId
            ? { ...f, popularity: rentalF ? rentalF.popularity : f.popularity, injury: rentalF ? rentalF.injury : f.injury }
            : f
          )}};
        }
        events.push(`↩ ${rentalF ? rentalF.name : 'レンタル選手'}がレンタル期間満了で帰団`);
        return { state: { ...s, roster: returning, rental: null, aiOrgs }, events, returned: true };
      }
      return { state: { ...s, rental: r }, events, returned: false };
    }
  },

  // ── Scout Pricing System (pricing-balance-spec-v0.99) ──────
  scout: {
    // Tier thresholds for assessedValue calculation
    TIERS: [
      { id: 'superElite', label: '超逸材', minPot: 850, minCur: 350, baseMin: 500, baseMax: 800, reqPop: 70, compRate: 0.95, compMul: 2.0, bidWin: 0.30, color: '#e74c3c' },
      { id: 'elite',      label: '逸材',   minPot: 740, minCur: 300, baseMin: 300, baseMax: 500, reqPop: 50, compRate: 0.85, compMul: 1.5, bidWin: 0.50, color: '#f39c12' },
      { id: 'promising',  label: '有望',   minPot: 690, minCur: 260, baseMin: 150, baseMax: 300, reqPop: 0,  compRate: 0.50, compMul: 1.3, bidWin: 0.50, color: '#3498db' },
      { id: 'raw',        label: '原石',   minPot: 550, minCur: 180, baseMin: 80,  baseMax: 150, reqPop: 0,  compRate: 0.15, compMul: 1.15, bidWin: 0.50, color: '#2ecc71' },
      { id: 'material',   label: '素材',   minPot: 0,   minCur: 0,   baseMin: 30,  baseMax: 80,  reqPop: 0,  compRate: 0.05, compMul: 1.1, bidWin: 0.50, color: '#95a5a6' },
    ],
    /** Determine tier from potential/current totals */
    getTier(potTotal, curTotal) {
      for (const t of Engine.scout.TIERS) {
        if (potTotal >= t.minPot || curTotal >= t.minCur) return t;
      }
      return Engine.scout.TIERS[Engine.scout.TIERS.length - 1];
    },
    /** Calculate assessedValue for a fighter. Returns { assessedValue, assessedTier, assessedVariance, assessedSeason } */
    calcAssessedValue(fighter, rng, currentSeason) {
      const pot = fighter.pot || fighter.trainCap || fighter.notionValue || fighter;
      const potTotal = (pot.pw||0) + (pot.sp||0) + (pot.te||0) + (pot.st||0) + (pot.mn||0);
      const curTotal = (fighter.pw||0) + (fighter.sp||0) + (fighter.te||0) + (fighter.st||0) + (fighter.mn||0);
      const tier = Engine.scout.getTier(potTotal, curTotal);
      const baseValue = tier.baseMin + Math.round(Engine.rng.float(rng) * (tier.baseMax - tier.baseMin));
      const variance = 0.70 + Engine.rng.float(rng) * 0.60; // 0.70〜1.30
      return {
        assessedValue: Math.round(baseValue * variance),
        assessedTier: tier.id,
        assessedVariance: variance,
        assessedSeason: currentSeason || 1
      };
    },
    /** Check if player org can negotiate with this tier */
    canNegotiate(orgPop, tierIdOrFighter) {
      const tierId = typeof tierIdOrFighter === 'string' ? tierIdOrFighter : (tierIdOrFighter.assessedTier || 'material');
      const tier = Engine.scout.TIERS.find(t => t.id === tierId) || Engine.scout.TIERS[Engine.scout.TIERS.length - 1];
      return orgPop >= tier.reqPop;
    },
    /** Get tier config by id */
    getTierConfig(tierId) {
      return Engine.scout.TIERS.find(t => t.id === tierId) || Engine.scout.TIERS[Engine.scout.TIERS.length - 1];
    },
    /** Reassess a fighter's value based on an event trigger */
    reassess(fighter, reason, rng, currentSeason) {
      const base = Engine.scout.calcAssessedValue(fighter, rng, currentSeason);
      const oldVal = fighter.assessedValue || base.assessedValue;
      switch (reason) {
        case 'titleWin':
          base.assessedValue = Math.max(base.assessedValue, Math.round(oldVal * 1.1));
          break;
        case 'titleDefend3': case 'seasonMVP':
          base.assessedValue = Math.round(base.assessedValue * 1.1);
          break;
        case 'age30':
          base.assessedValue = Math.round(base.assessedValue * 0.8);
          break;
        case 'age35plus':
          base.assessedValue = Math.round(base.assessedValue * 0.6);
          break;
        case 'severeInjury':
          base.assessedValue = Math.round(base.assessedValue * 0.85);
          break;
        case 'aftereffect':
          base.assessedValue = Math.round(base.assessedValue * 0.7);
          break;
      }
      base.assessedSeason = currentSeason;
      return base;
    },
    /** 3-season periodic micro-adjust: ±10% on all fighters */
    seasonalAdjust(fighters, rng) {
      return fighters.map(f => {
        if (!f.assessedValue) return f;
        const adj = 0.90 + Engine.rng.float(rng) * 0.20; // 0.90〜1.10
        return { ...f, assessedValue: Math.round(f.assessedValue * adj) };
      });
    },
    /** Apply assessedValue to a fighter if not already set */
    ensureAssessed(fighter, rng, currentSeason) {
      if (fighter.assessedValue) return fighter;
      const av = Engine.scout.calcAssessedValue(fighter, rng, currentSeason);
      return { ...fighter, ...av };
    },
    /** Get signing cost after facility discount */
    getSigningCost(fighter, facilityDiscount) {
      const base = fighter.assessedValue || 50;
      const discount = facilityDiscount || 0; // percentage (0, 15, 25)
      return Math.max(10, Math.round(base * (100 - discount) / 100));
    },

    // ── Scout Event Functions (scout-spec §2-§6) ──────────────

    /** Generate a single scout candidate (scout-spec §3) */
    generateCandidate(rng, season, isSeed) {
      // §3.1 Age distribution
      const ageRoll = Engine.rng.float(rng);
      let age;
      if (ageRoll < 0.40) age = 15 + Engine.rng.int(rng, 0, 1);       // 15-16: 40%
      else if (ageRoll < 0.65) age = 17;                                // 17: 25%
      else if (ageRoll < 0.85) age = 18 + Engine.rng.int(rng, 0, 1);   // 18-19: 20%
      else age = 20 + Engine.rng.int(rng, 0, 2);                        // 20-22: 15%

      // §3.2 Notion values
      let avgTarget;
      if (isSeed) {
        avgTarget = 75 + Engine.rng.int(rng, 0, 15); // seed = forced elite
      } else {
        const tierRoll = Engine.rng.float(rng);
        if (tierRoll < 0.05)      avgTarget = 75 + Engine.rng.int(rng, 0, 15); // 逸材 5%
        else if (tierRoll < 0.25) avgTarget = 60 + Engine.rng.int(rng, 0, 14); // 有望 20%
        else if (tierRoll < 0.70) avgTarget = 45 + Engine.rng.int(rng, 0, 14); // 普通 45%
        else                      avgTarget = 25 + Engine.rng.int(rng, 0, 19); // 素材 30%
      }
      const params = ['pw','sp','te','st','mn'];
      const notion = {};
      for (const p of params) {
        notion[p] = Math.max(11, Math.min(95, avgTarget + Engine.rng.int(rng, -15, 15)));
      }

      // §3.3 Potential
      const pot = {};
      for (const p of params) {
        pot[p] = Math.min(185, Math.round(notion[p] * 1.3 + 60));
      }

      // Seed boost: §3.6 — 1-2 params +10~20 to potential
      if (isSeed) {
        const boostCount = 1 + Engine.rng.int(rng, 0, 1);
        const boostParams = [...params].sort(() => Engine.rng.float(rng) - 0.5).slice(0, boostCount);
        for (const bp of boostParams) {
          pot[bp] = Math.min(185, pot[bp] + 10 + Engine.rng.int(rng, 0, 10));
        }
      }

      // §6.1 Start values (entry age ratio)
      let startRatio;
      if (age <= 17) startRatio = 0.55 + Engine.rng.float(rng) * 0.10;
      else if (age <= 20) startRatio = 0.65 + Engine.rng.float(rng) * 0.10;
      else startRatio = 0.75 + Engine.rng.float(rng) * 0.10;
      const cur = {};
      for (const p of params) {
        cur[p] = (p === 'mn') ? notion[p] : Math.round(notion[p] * startRatio); // §6.3 MNT no age adj
      }

      // §3.4 Style
      const weights = { Allround:25, Striker:14, Submission:14, Grappler:12, Brawler:9, Speed:6 };
      if (notion.pw >= notion.sp + 10 && notion.pw >= notion.te + 10) { weights.Grappler += 10; weights.Brawler += 8; }
      if (notion.sp >= notion.pw + 10 && notion.sp >= notion.te + 5)  { weights.Speed += 10; weights.Striker += 5; }
      if (notion.te >= notion.pw + 10 && notion.te >= notion.sp + 5)  { weights.Submission += 10; }
      const totalW = Object.values(weights).reduce((a, b) => a + b, 0);
      let styleRoll = Engine.rng.float(rng) * totalW;
      let style = 'Allround';
      for (const [s, w] of Object.entries(weights)) { styleRoll -= w; if (styleRoll <= 0) { style = s; break; } }

      // §3.5 Role (heel degree)
      const roleRoll = Engine.rng.float(rng);
      let role;
      if (roleRoll < 0.40) role = 'Babyface';
      else if (roleRoll < 0.80) role = 'Neutral';
      else if (roleRoll < 0.98) role = 'Heel';
      else role = 'Dirty';

      // §3.7 Name, height
      const surname = SCOUT_SURNAMES[Engine.rng.int(rng, 0, SCOUT_SURNAMES.length - 1)];
      const given = SCOUT_GIVENNAMES[Engine.rng.int(rng, 0, SCOUT_GIVENNAMES.length - 1)];
      const name = surname + given;
      const height = 145 + Engine.rng.int(rng, 0, 36); // 145-181

      // Traits: 0-2 random from pool
      const traitCount = Engine.rng.int(rng, 0, 2);
      const shuffledTraits = [...SCOUT_TRAITS_POOL].sort(() => Engine.rng.float(rng) - 0.5);
      const traits = shuffledTraits.slice(0, traitCount);
      // Exclude conflicting growth traits
      const growthTraits = traits.filter(t => ['早熟','晩成','遅咲き'].includes(t));
      if (growthTraits.length > 1) traits.splice(traits.indexOf(growthTraits[1]), 1);

      // §6.2 trainCap
      const trainCap = {};
      for (const p of params) {
        const factor = 0.10 + Engine.rng.float(rng) * 0.40;
        trainCap[p] = Math.round(notion[p] + factor * (pot[p] - notion[p]));
      }

      const id = nextGenCharId++;
      const fighter = {
        id, name, h: height, age, style, role, series: 'scout',
        pw: cur.pw, sp: cur.sp, te: cur.te, st: cur.st, mn: cur.mn,
        pot, trainCap, traits,
        popularity: 0, wins: 0, losses: 0, draws: 0,
        condition: 100, fatigue: 0, injuries: [], afterEffects: [],
        schedule: 'balance', titleDefenses: 0, matchesThisSeason: 0,
        _notion: notion, // internal: for scout display estimate
        _isSeed: !!isSeed,
      };

      // AssessedValue
      const avRng = Engine.rng.create(Engine.rng.derive(id, 777));
      const av = Engine.scout.calcAssessedValue(fighter, avRng, season);
      return { ...fighter, ...av };
    },

    /** Generate a scout report: list of candidates (scout-spec §2) */
    generateScoutReport(rng, state, eventType) {
      const cfg = eventType === 'midseason' ? SCOUT_EVENT_CFG.midseason : SCOUT_EVENT_CFG.offseason;
      const count = cfg.count[0] + Engine.rng.int(rng, 0, cfg.count[1] - cfg.count[0]);
      const candidates = [];

      // ALL candidates from pool (existing ALL_CHARS) — no generated chars
      // occupiedIds: 全プールの占有済みID（重複除外の基準）
      const occupiedIds = Engine.util.collectOccupiedCharacterDefIds(state);
      // reservedDefIds: この抽選バッチ内で仮予約済みのID
      const reservedDefIds = new Set();
      const dormantIds = [...(state.dormantPool || [])].filter(id => !occupiedIds.has(id));
      const poolShuffled = [...dormantIds].sort(() => Engine.rng.float(rng) - 0.5);

      const poolMax = Math.min(count, poolShuffled.length);
      const usedFromPool = [];
      for (let i = 0; i < poolMax; i++) {
        const cid = poolShuffled[i];
        if (reservedDefIds.has(cid)) continue; // 同一バッチ内の仮予約済みを除外
        const template = ALL_CHARS.find(c => c.id === cid);
        if (!template) continue;
        // Create fighter from template
        const age = 16 + Engine.rng.int(rng, 0, 4);
        const fighter = Engine.rival.makeAIFighter(template, rng, null, age);
        fighter.series = 'pool';
        fighter._notion = { pw: template.pw, sp: template.sp, te: template.te, st: template.st, mn: template.mn };
        fighter._isSeed = false;
        // Seed flag: mark top-tier as seed for UI highlight
        const avgNotion = Math.round((template.pw + template.sp + template.te + template.st + template.mn) / 5);
        if (avgNotion >= 75) fighter._isSeed = true;
        candidates.push(fighter);
        usedFromPool.push(cid);
        reservedDefIds.add(cid); // 同一バッチ内の仮予約
      }

      // §4.2 Scout estimates (noisy display values)
      const hasJinmyaku = (state.roster || []).some(f => Traits.has(f, '人脈'));
      const noiseRange = hasJinmyaku ? 0.05 : 0.10;
      for (const c of candidates) {
        const est = {};
        for (const p of ['pw','sp','te','st','mn']) {
          const actual = c[p];
          const noise = 1 - noiseRange + Engine.rng.float(rng) * noiseRange * 2;
          est[p] = Math.round(actual * noise);
        }
        c._estimate = est;
      }

      // §5.2 Competition flags
      for (const c of candidates) {
        const tier = Engine.scout.getTierConfig(c.assessedTier);
        c._hasCompetition = Engine.rng.float(rng) < tier.compRate;
        c._compMultiplier = tier.compMul;
        c._bidWinRate = tier.bidWin;
      }

      return { candidates, usedPoolIds: usedFromPool };
    },

    /** Resolve competition for a single pick (scout-spec §5.2) */
    resolveCompetition(rng, candidate, choice) {
      // choice: 'pay' (追加コスト払って確定) / 'gamble' (通常額で勝負) / 'skip' (諦め)
      if (choice === 'skip') return { result: 'skipped', cost: 0 };

      if (!candidate._hasCompetition) {
        // No competition — always succeed at base cost
        return { result: 'success', cost: candidate.assessedValue };
      }

      if (choice === 'pay') {
        // Pay additional multiplier for guaranteed win
        const cost = Math.round(candidate.assessedValue * candidate._compMultiplier);
        return { result: 'success', cost };
      }

      // Gamble: bid at base cost, roll for success
      const winRate = candidate._bidWinRate || 0.5;
      if (Engine.rng.float(rng) < winRate) {
        return { result: 'success', cost: candidate.assessedValue };
      } else {
        return { result: 'lost', cost: 0 };
      }
    },

    /** Determine where a lost candidate goes (scout-spec §5.2 行方) */
    resolveLostCandidate(rng, candidate, aiOrgs) {
      // 70% → joins random AI org, 30% → freeAgent pool
      if (Engine.rng.float(rng) < 0.70) {
        const orgIds = Object.keys(aiOrgs);
        const targetOrgId = orgIds[Engine.rng.int(rng, 0, orgIds.length - 1)];
        candidate.orgId = targetOrgId;
        return { destination: 'aiOrg', orgId: targetOrgId, fighter: candidate };
      }
      return { destination: 'freeAgent', fighter: candidate };
    }
  },

  // ── Phase D: Inter-org Events (rival-spec §9) ─────────────
  event: {
    /** D-2: Check if rivalry war should trigger (Q2/Q3 end) */
    checkRivalryWar(rng, state) {
      if (state.warThisSeason) return null;
      const w = state.week;
      // Only trigger at Q2 end (week 24) or Q3 end (week 36) non-show weeks
      if (w !== 24 && w !== 36) return null;
      if (Engine.rng.float(rng) >= EVENT_CONFIG.warChancePerSeason) return null;

      const rankings = state.rankings || [];
      const pIdx = rankings.findIndex(r => r.orgId === 'player');
      if (pIdx < 0) return null;

      // Pick adjacent ranked org
      const candidates = [];
      if (pIdx > 0) candidates.push(rankings[pIdx - 1]);
      if (pIdx < rankings.length - 1) candidates.push(rankings[pIdx + 1]);
      if (candidates.length === 0) return null;

      const opponent = candidates[Engine.rng.int(rng, 0, candidates.length - 1)];
      const aiOrg = Engine.rival.getOrgInfo(state.aiOrgs, opponent.orgId);
      if (!aiOrg) return null;

      const matchCount = Engine.rng.int(rng, EVENT_CONFIG.warMatchCount.min, EVENT_CONFIG.warMatchCount.max);
      return { type: 'war', opponentOrgId: aiOrg.orgId, opponentName: aiOrg.name, matchCount };
    },

    /** Make war card: auto-match by OVR rank */
    makeWarCard(state, opponentOrgId) {
      const aiOrg = Engine.rival.getOrgInfo(state.aiOrgs, opponentOrgId);
      if (!aiOrg) return [];
      const playerSorted = [...state.roster].filter(c => !c.injury && !c.isRental).sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
      const aiSorted = [...aiOrg.roster].filter(f => !f.injury).sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
      const count = Math.min(state.pendingEvent ? state.pendingEvent.matchCount : 3, playerSorted.length, aiSorted.length);
      const card = [];
      for (let i = 0; i < count; i++) {
        card.push({ playerFighter: playerSorted[i], aiFighter: aiSorted[i] });
      }
      return card;
    },

    /** Resolve a single event match using battle engine (no injury, condition=80) */
    resolveEventMatch(rng, playerFighter, aiFighter, mqBonus) {
      mqBonus = mqBonus || 0;
      // Prepare fighters with fixed condition for event matches
      const pf = { ...playerFighter, condition: 80 };
      const af = { ...aiFighter, condition: 80 };
      // Use battle engine
      const result = Engine.battle.simulateMatch(pf, af, rng);
      result.mq = Math.min(100, result.mq + mqBonus);
      return result;
    },

    /** Resolve entire war event. Returns { state, results, playerWins, aiWins } */
    resolveWar(rng, state, card) {
      const results = [];
      let playerWins = 0, aiWins = 0;
      card.forEach(match => {
        const r = Engine.event.resolveEventMatch(rng, match.playerFighter, match.aiFighter, 0);
        const pWin = r.winner === 'left'; // player is always left in resolveEventMatch
        if (pWin) playerWins++; else aiWins++;
        results.push({ ...r, playerFighter: match.playerFighter, aiFighter: match.aiFighter, playerWon: pWin });
      });
      return { results, playerWins, aiWins };
    },

    /** Apply war outcome to state */
    applyWarOutcome(state, playerWins, aiWins, opponentOrgId) {
      let popDelta = 0;
      if (playerWins > aiWins) popDelta = EVENT_CONFIG.warPopReward;
      else if (playerWins === aiWins) popDelta = 2;
      else popDelta = EVENT_CONFIG.warPopPenalty;
      const events = [];
      const winLabel = playerWins > aiWins ? '勝ち越し！' : playerWins === aiWins ? '引き分け' : '負け越し…';
      events.push(`⚔ 対抗戦結果: ${playerWins}勝${aiWins}敗 — ${winLabel}（団体人気${popDelta >= 0 ? '+' : ''}${popDelta}）`);
      return {
        state: { ...state, orgPop: Math.max(0, Math.min(100, state.orgPop + popDelta)), warThisSeason: true, pendingEvent: null },
        events
      };
    },

    /** D-4: Check summit match conditions */
    checkSummitMatch(state) {
      const rankings = state.rankings || [];
      const pRank = Engine.ranking.getPlayerRank(rankings);
      if (pRank > EVENT_CONFIG.summitMinRank) return null;
      if (!Engine.util.isPPV(state.week)) return null;

      // Find #1 ranked AI org
      const topRank = rankings.find(r => r.orgId !== 'player');
      if (!topRank) return null;
      const topOrg = Engine.rival.getOrgInfo(state.aiOrgs, topRank.orgId);
      if (!topOrg) return null;

      const playerAce = Engine.event.getAce(state.roster);
      const aiAce = Engine.event.getAce(topOrg.roster);
      if (!playerAce || !aiAce) return null;

      return { type: 'summit', opponentOrgId: topOrg.orgId, orgName: topOrg.name,
               playerFighter: playerAce, aiFighter: aiAce };
    },

    /** Apply summit outcome */
    applySummitOutcome(state, won) {
      const events = [];
      if (won) {
        events.push(`🏆 頂上決戦勝利！ 団体人気+${EVENT_CONFIG.summitPopReward}、レーティング+${EVENT_CONFIG.summitRatingReward}`);
        return {
          state: { ...state,
            orgPop: Math.min(100, state.orgPop + EVENT_CONFIG.summitPopReward),
            summitBonus: (state.summitBonus || 0) + EVENT_CONFIG.summitRatingReward,
            pendingEvent: null
          }, events
        };
      }
      events.push('🏆 頂上決戦敗北…しかし挑戦したこと自体が名誉');
      return { state: { ...state, pendingEvent: null }, events };
    },

    /** Helper: get ace (highest OVR non-injured fighter) */
    getAce(roster) {
      return [...roster].filter(f => !f.injury).sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0] || null;
    }
  },

  // advanceWeek: Returns { state, events }
  // B-2: Offseason 4-week system
  advanceWeek(state) {
    let s = { ...state };
    const events = [];

    // ── OFFSEASON PROCESSING ──
    if (s.offSeason) {
      const offWeek = (s.offWeek || 0) + 1;
      const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 900 + offWeek));

      if (offWeek === 1) {
        // OffWeek 1: Player season end (aging + decay + growth reset) + AI season end
        const { roster, report } = Engine.growth.applySeasonEnd(rng, s);
        s = { ...s, roster };
        events.push(`📊 シーズン${s.season}終了 — 成績レポート`);
        report.forEach(r => events.push(`  ${r}`));

        // Player retirement check
        const retirees = [];
        const surviving = [];
        s.roster.forEach(c => {
          if (Engine.rival.checkRetirement(rng, c)) {
            retirees.push(c);
          } else {
            surviving.push(c);
          }
        });
        if (retirees.length > 0) {
          // v1.3: Save retirees with career records for year-end awards
          const retiredWithRecords = retirees.map(c => {
            let f = Engine.career.ensure(c);
            f = Engine.career.addEvent(f, { type: 'retire', season: s.season, age: f.age });
            return f;
          });
          s = { ...s, roster: surviving, retiredFighters: [...(s.retiredFighters || []), ...retiredWithRecords] };
          retirees.forEach(c => events.push(`🏁 ${c.name}(${c.age}歳)が引退を表明`));
        }

        // AI season end processing (steps 1-5)
        const aiResult = Engine.rival.processSeasonEnd(rng, s);
        s = { ...s, aiOrgs: aiResult.aiOrgs };
        events.push(...aiResult.events);
        events.push('📅 オフシーズン第1週: シーズンレポート完了');

      } else if (offWeek === 2) {
        // OffWeek 2: Scout Event (player + AI)
        // AI scouting first
        const scoutResult = Engine.rival.aiScout(rng, s);
        s = { ...s, aiOrgs: scoutResult.aiOrgs, dormantPool: scoutResult.dormantPool };
        if (scoutResult.events.length > 0) events.push(...scoutResult.events);

        // Player scout event: generate candidates
        const scoutRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0x5C01));
        const report = Engine.scout.generateScoutReport(scoutRng, s, 'offseason');
        // Remove used pool IDs
        const remainingPool = (s.dormantPool || []).filter(id => !report.usedPoolIds.includes(id));
        s = {
          ...s,
          dormantPool: remainingPool,
          scoutCandidates: report.candidates,
          scoutPicks: [],
          scoutMaxPicks: SCOUT_EVENT_CFG.offseason.maxPicks,
          scoutEventType: 'offseason',
          scoutsThisSeason: (s.scoutsThisSeason || 0),
        };
        events.push('📅 オフシーズン第2週: スカウトレポート到着！');
        events.push(`🔍 スカウト候補 ${report.candidates.length}名の情報が届きました`);
        return { state: { ...s, offWeek, weekPhase: 'scoutEvent' }, events };

      } else if (offWeek === 3) {
        // OffWeek 3: AI inter-org transfers + FA acquisition
        const transferResult = Engine.rival.aiInterTransfer(rng, s.aiOrgs);
        s = { ...s, aiOrgs: transferResult.aiOrgs };
        if (transferResult.events.length > 0) events.push(...transferResult.events);

        // F1: AI grabs free agents
        const faResult = Engine.rival.aiFAAcquire(rng, s);
        s = { ...s, aiOrgs: faResult.aiOrgs, freeAgents: faResult.freeAgents };
        if (faResult.events.length > 0) events.push(...faResult.events);

        events.push('📅 オフシーズン第3週: 移籍ウィンドウ');

      } else if (offWeek >= 4) {
        // OffWeek 4: New season preparation — advance to next season
        // v0.95: Archive season stats before transition
        const oldSeason = s.season;
        const oldStats = s.seasonStats || { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:s.funds, peakPop:0, eventsWon:0, eventsLost:0 };
        const oldRankings = Engine.ranking.updateRankings(s);
        const pRankOld = Engine.ranking.getPlayerRank(oldRankings);
        const archive = { season: oldSeason, rank: pRankOld, funds: s.funds, rosterSize: s.roster.length,
          orgPop: s.orgPop || 0, ...oldStats, rankings: oldRankings.map(r => ({ name: r.name, rating: r.rating, rank: r.rank })) };
        const seasonHistory = [...(s.seasonHistory || []), archive];

        // v0.99: Seasonal pricing adjust every 3 seasons (pricing-balance-spec §4.3)
        const nextSeason = s.season + 1;
        if (nextSeason > 1 && (nextSeason - 1) % 3 === 0) {
          const adjRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, nextSeason, 777));
          s = { ...s,
            roster: Engine.scout.seasonalAdjust(s.roster, adjRng),
            freeAgents: Engine.scout.seasonalAdjust(s.freeAgents, adjRng)
          };
          // Also adjust AI org rosters
          const adjAiOrgs = {};
          Object.keys(s.aiOrgs).forEach(orgId => {
            const orgData = s.aiOrgs[orgId];
            adjAiOrgs[orgId] = { ...orgData, roster: Engine.scout.seasonalAdjust(orgData.roster, adjRng) };
          });
          s = { ...s, aiOrgs: adjAiOrgs };
          events.push(`📊 市場再評価: 選手の評価額が微調整されました（3シーズン周期）`);
        }

        s = { ...s, season: s.season + 1, week: 1, offSeason: false, offWeek: 0,
              transfersThisSeason: 0, warThisSeason: false, challengeTrigger: null, pendingEvent: null,
              summitBonus: 0, negotiatedThisSeason: [], pendingNegotiation: null, warVictories: [],
              seasonStats: { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:s.funds, peakPop:s.orgPop||0, eventsWon:0, eventsLost:0 },
              seasonHistory, fundsHistory: [s.funds],
              rngSeed: Engine.rng.derive(s.rngSeed, s.season + 1) };
        // Update rankings
        s.rankings = Engine.ranking.updateRankings(s);
        const pRank = Engine.ranking.getPlayerRank(s.rankings);
        // v1.2: ランキング1位達成で世界王座解禁フラグを立てる（一方向フラグ）
        if (pRank === 1 && !s.worldTitleUnlocked) {
          s.worldTitleUnlocked = true;
          events.push('🌟 業界1位達成！「団体王座」が世界に向けて開かれた。');
        }
        events.push(`🏆 シーズン${s.season - 1}最終ランキング: ${pRank}位 / ${s.rankings.length}団体`);
        s.rankings.forEach((r, i) => {
          const org = RIVAL_ORGS.find(o => o.orgId === r.orgId || o.id === r.orgId);
          const emoji = r.orgId === 'player' ? '🏠' : (org ? org.emoji : '');
          events.push(`  ${i+1}位 ${emoji} ${r.name}: ${r.rating}pt (👑${r.championScore} ⭐${r.starPower} 👥${r.totalPop})`);
        });
        events.push(`🎬 シーズン${s.season}開幕！`);
        return { state: { ...s, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } }, events };
      }

      s = { ...s, offWeek };
      return { state: { ...s, weekPhase: 'offseason' }, events };
    }

    // ── REGULAR WEEK ADVANCE ──
    s = { ...s, week: s.week + 1 };
    if (s.week > 48) {
      // F2: Force-resolve any pending negotiation before offseason
      if (s.pendingNegotiation) {
        const forceNeg = Engine.negotiate.resolveNegotiation({ ...s, week: s.pendingNegotiation.resolveWeek });
        if (forceNeg) {
          s = forceNeg.state;
          events.push(...forceNeg.events);
          s = { ...s, negotiationResult: { success: forceNeg.success, fighter: forceNeg.fighter } };
        }
      }
      // Enter offseason
      s = { ...s, offSeason: true, offWeek: 0 };
      events.push('📅 レギュラーシーズン終了 → オフシーズン突入');
      return { state: { ...s, weekPhase: 'offseason' }, events };
    }

    // F2: Check pending negotiation resolution
    const negResult = Engine.negotiate.resolveNegotiation(s);
    if (negResult) {
      s = negResult.state;
      events.push(...negResult.events);
      // Store result for UI popup display
      s = { ...s, negotiationResult: { success: negResult.success, fighter: negResult.fighter } };
    }

    // C-2: Quarterly transfer window check
    if (TRANSFER_CONFIG.windows.includes(s.week)) {
      const trng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 800 + s.week));
      const tfResult = Engine.transfer.processTransferWindow(trng, s);
      s = tfResult.state;
      events.push(...tfResult.events);
      if (s.pendingPoach && s.pendingPoach.length > 0) {
        return { state: { ...s, weekPhase: 'transfer' }, events };
      }
    }

    // C-3: Midseason scout event (week 29 = Q3 5th week)
    if (s.week === SCOUT_EVENT_CFG.midseasonWeek && !(s.scoutsThisSeason >= 2)) {
      const scoutRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0x5C02));
      const report = Engine.scout.generateScoutReport(scoutRng, s, 'midseason');
      const remainingPool = (s.dormantPool || []).filter(id => !report.usedPoolIds.includes(id));
      s = {
        ...s,
        dormantPool: remainingPool,
        scoutCandidates: report.candidates,
        scoutPicks: [],
        scoutMaxPicks: SCOUT_EVENT_CFG.midseason.maxPicks,
        scoutEventType: 'midseason',
      };
      events.push(`🔍 シーズン中スカウト: 補強候補 ${report.candidates.length}名の情報が届きました`);
      return { state: { ...s, weekPhase: 'scoutEvent' }, events };
    }

    // D-2: Rivalry war check (Q2末=week24, Q3末=week36)
    const eventRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 700 + s.week));
    const warCheck = Engine.event.checkRivalryWar(eventRng, s);
    if (warCheck) {
      s = { ...s, pendingEvent: warCheck, warThisSeason: true };
      events.push(`⚔ ${warCheck.opponentName}から対抗戦の申し入れ！（${warCheck.matchCount}試合）`);
      return { state: { ...s, weekPhase: 'event' }, events };
    }

    // D-4: Summit match check (PPV weeks, rank ≤ 2)
    const summitCheck = Engine.event.checkSummitMatch(s);
    if (summitCheck) {
      s = { ...s, pendingEvent: summitCheck };
      events.push(`🏆 頂上決戦のチャンス！ ${summitCheck.orgName}のエース${summitCheck.aiFighter.name}に挑戦可能`);
      return { state: { ...s, weekPhase: 'event' }, events };
    }

    return { state: { ...s, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } }, events };
  },

  // ── Character Factory (DOM-free) ───────────────────────
  makeChar(template, rng, opts = {}) {
    const notion = {pw:template.pw,sp:template.sp,te:template.te,st:template.st,mn:template.mn};
    const trainCap = Engine.rival.generateTrainCap(rng, notion, template.pot);
    // Player roster starts at entry-level values (training-spec §1.3)
    const entryAge = opts.age || 16;
    const startVals = opts.useNotion ? notion : Engine.rival.generateStartValues(rng, notion, entryAge);
    // Calculate assessed value (pricing-balance-spec §1)
    const charWithStats = { ...template, pw: startVals.pw, sp: startVals.sp, te: startVals.te, st: startVals.st, mn: startVals.mn };
    const av = Engine.scout.calcAssessedValue(charWithStats, rng, opts.season || 1);
    return {
      ...template,
      pw: startVals.pw, sp: startVals.sp, te: startVals.te, st: startVals.st, mn: startVals.mn,
      notionValue: notion,
      trainCap,
      age: entryAge,
      condition: 70 + Engine.rng.int(rng, 0, 19),
      popularity: Math.max(1, Math.round(Engine.util.ov({...template, ...startVals}) / 10) + Engine.rng.int(rng, -2, 2)),
      schedule: 'balance',
      wins: 0, losses: 0, draws: 0,
      injury: null,
      seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
      careerSeasons: 0,
      intensive: false,
      intensiveWeeks: 0,
      lastMatchResult: null,
      losingStreak: 0,     // v1.0b: losing streak counter
      preInjuryPop: null,  // v1.0b: pre-injury popularity for injury forgetting
      assessedValue: av.assessedValue,
      assessedTier: av.assessedTier,
      assessedVariance: av.assessedVariance,
      assessedSeason: av.assessedSeason,
      careerRecord: Engine.career.createRecord(),
      durability: Engine.career.generateDurability(rng), // v1.3-1: 個人耐久値 N(0,2) -4..+4
      wear: 0,                                           // v1.3-1: 累積摩耗
    };
  },

  // ── Draft System (v1.0) ─────────────────────────────────
  draft: {
    // Coach evaluation tiers (potOVR distribution: 85-164, most 115-160)
    EVAL_TIERS: [
      { min: 155, text: '将来のエース候補', emoji: '🌟', color: '#f1c40f' },
      { min: 145, text: '逸材の匂いがする', emoji: '✨', color: '#e6c35c' },
      { min: 135, text: 'かなりの素質あり', emoji: '💎', color: '#3498db' },
      { min: 125, text: '十分な伸びしろ',   emoji: '📈', color: '#2ecc71' },
      { min: 115, text: '堅実に育つタイプ', emoji: '🌱', color: '#95a5a6' },
      { min: 0,   text: '未知数',           emoji: '🔮', color: '#9b59b6' },
    ],
    // Coach-based potential evaluation with variance
    // coachMult: best coach's growthMult (0 = no coach = max variance)
    // variance: no coach ±20, best coach(2.0) ±8
    getEvalComment(potOvr, charId, seed, coachMult) {
      const rng = Engine.rng.create(Engine.rng.derive(seed || 42, charId, 999));
      const maxVar = coachMult > 0 ? Math.round(20 - coachMult * 6) : 20; // 0→±20, 1.3→±12, 2.0→±8
      const clampedVar = Math.max(6, maxVar); // minimum ±6 even with best coach
      const variance = Engine.rng.int(rng, -clampedVar, clampedVar);
      const perceived = potOvr + variance;
      const tier = Engine.draft.EVAL_TIERS.find(t => perceived >= t.min) || Engine.draft.EVAL_TIERS[Engine.draft.EVAL_TIERS.length - 1];
      return { ...tier, variance: clampedVar };
    },
    // v1.2: Age-based entry ratio (matches generateStartValues base + avg random)
    _entryRatio(age) {
      if (age <= 17) return 0.60;   // base 0.55 + ~0.05 avg
      return 0.70;                  // base 0.65 + ~0.05 avg (age 18-20)
    },
    // Get candidate info with estimated entry-level OVR for display
    // coachMult: best hired coach's growthMult (0 at draft = max variance)
    getCandidateInfo(seed, coachMult) {
      return DRAFT_CONFIG.candidates.map(id => {
        const t = ALL_CHARS.find(c => c.id === id);
        const age = (DRAFT_CONFIG.draftAges && DRAFT_CONFIG.draftAges[id]) || 16;
        const ratio = Engine.draft._entryRatio(age);
        const entryPw = Math.round(t.pw * ratio);
        const entrySp = Math.round(t.sp * ratio);
        const entryTe = Math.round(t.te * ratio);
        const entrySt = Math.round(t.st * ratio);
        const entryMn = t.mn; // MN is innate, no age reduction
        const ovr = Math.round((entryPw + entrySp + entryTe + entrySt + entryMn) / 5);
        const potOvr = Math.round((t.pot.pw + t.pot.sp + t.pot.te + t.pot.st + t.pot.mn) / 5);
        const coachEval = Engine.draft.getEvalComment(potOvr, id, seed, coachMult || 0);
        return { ...t, pw: entryPw, sp: entrySp, te: entryTe, st: entrySt, mn: entryMn, ovr, age, coachEval };
      });
    },
    // Get fixed member info (also entry-level)
    getFixedInfo(seed, coachMult) {
      return DRAFT_CONFIG.fixed.map(id => {
        const t = ALL_CHARS.find(c => c.id === id);
        const age = (DRAFT_CONFIG.draftAges && DRAFT_CONFIG.draftAges[id]) || 16;
        const ratio = Engine.draft._entryRatio(age);
        const entryPw = Math.round(t.pw * ratio);
        const entrySp = Math.round(t.sp * ratio);
        const entryTe = Math.round(t.te * ratio);
        const entrySt = Math.round(t.st * ratio);
        const entryMn = t.mn;
        const ovr = Math.round((entryPw + entrySp + entryTe + entrySt + entryMn) / 5);
        const potOvr = Math.round((t.pot.pw + t.pot.sp + t.pot.te + t.pot.st + t.pot.mn) / 5);
        const coachEval = Engine.draft.getEvalComment(potOvr, id, seed, coachMult || 0);
        return { ...t, pw: entryPw, sp: entrySp, te: entryTe, st: entrySt, mn: entryMn, ovr, age, coachEval };
      });
    },
    // Validate draft picks
    isValidPicks(picks) {
      if (!Array.isArray(picks) || picks.length !== DRAFT_CONFIG.pickCount) return false;
      return picks.every(id => DRAFT_CONFIG.candidates.includes(id));
    },
    // Complete draft: returns updated state with roster, freeAgents, and dormantPool
    completeDraft(state, picks, rng) {
      if (!Engine.draft.isValidPicks(picks)) return state;
      const rosterIds = [...DRAFT_CONFIG.fixed, ...picks];
      const rejected = DRAFT_CONFIG.candidates.filter(id => !picks.includes(id));
      // Build roster (use draftAges for age variation)
      const roster = rosterIds.map(id => {
        const t = ALL_CHARS.find(c => c.id === id);
        const age = (DRAFT_CONFIG.draftAges && DRAFT_CONFIG.draftAges[id]) || 16;
        return Engine.makeChar(t, rng, { age });
      });
      // FA = original free pool - draft used (fixed + candidates) + rejected
      const draftUsedIds = new Set([...DRAFT_CONFIG.fixed, ...DRAFT_CONFIG.candidates]);
      const remainingFreeIds = (ORG_ASSIGN.free || []).filter(id => !draftUsedIds.has(id));
      const allFreeIds = [...remainingFreeIds, ...rejected];
      const freeAgents = allFreeIds.map(id => {
        const t = ALL_CHARS.find(c => c.id === id);
        const age = 18 + Engine.rng.int(rng, 0, 8);
        return Engine.makeChar(t, rng, { age });
      });
      // Update ORG_ASSIGN for ranking calculations
      ORG_ASSIGN.player = rosterIds;
      ORG_ASSIGN.free = allFreeIds;
      // dormantPool unchanged during draft
      const dormantPool = state.dormantPool || Engine.rival.getDormantIds();
      const rankings = Engine.ranking.updateRankings({ ...state, roster, freeAgents, dormantPool });
      const pRank = Engine.ranking.getPlayerRank(rankings);
      return {
        ...state,
        roster,
        freeAgents,
        dormantPool,
        rankings,
        weekPhase: 'manage',
        draftComplete: true,
        gameLog: [
          '🎉 新団体設立！ 初期資金5,000万でスタート。',
          `📋 ドラフト完了！ ${roster.length}名の所属選手で船出。`,
          `🏢 フリーエージェント${freeAgents.length}名がスカウト可能。`,
          `📊 業界${pRank}位からの挑戦が始まる。`,
          `👑 ${RIVAL_ORGS.find(o=>o.id==='org_s')?.name||'S級'} (S級) / 💫 ${RIVAL_ORGS.find(o=>o.id==='org_a')?.name||'A級'} (A級) / 🌙 ${RIVAL_ORGS.find(o=>o.id==='org_b')?.name||'B級'} (B級)`,
          '⛽ まずは赤字を耐え忍び、黒字経営を目指せ！【経営サバイバル】',
          '🎯 目標: 業界1位の団体を超えてエンディングを目指せ！',
        ]
      };
    }
  },

  // ── State Factory ──────────────────────────────────────
  createInitialState(seed, skipDraft) {
    seed = seed || (Date.now() ^ 0xDEADBEEF);
    const rng = Engine.rng.create(seed);

    // Step 1: Randomize roster assignment (S/A/B/FA/dormant)
    const rosterResult = Engine.rival.initRandomRoster(rng);
    const dormantPool = rosterResult.dormantPool;

    // Step 2: Generate draft config from FA pool
    generateDraftConfig(seed);

    // If draft not skipped, start in draft phase with minimal state
    const isDraft = !skipDraft;

    // Player roster: empty for draft, or default for legacy/load
    const rosterIds = isDraft ? DRAFT_CONFIG.fixed : [...DRAFT_CONFIG.fixed, ...DRAFT_CONFIG.candidates.slice(0, DRAFT_CONFIG.pickCount)];
    ORG_ASSIGN.player = rosterIds;
    const roster = rosterIds.map(id => {
      const t = ALL_CHARS.find(c => c.id === id);
      const age = (DRAFT_CONFIG.draftAges && DRAFT_CONFIG.draftAges[id]) || 16;
      return Engine.makeChar(t, rng, { age });
    });

    // Free agents: FA pool minus draft candidates (they're shown separately)
    const draftUsedIds = new Set([...DRAFT_CONFIG.fixed, ...DRAFT_CONFIG.candidates]);
    const freeIds = (ORG_ASSIGN.free || []).filter(id => !draftUsedIds.has(id));
    const freeAgents = freeIds.map(id => {
      const t = ALL_CHARS.find(c => c.id === id);
      if (!t) return null;
      const age = 18 + Engine.rng.int(rng, 0, 8);
      return Engine.makeChar(t, rng, { age });
    }).filter(Boolean);

    // AI organizations (with randomized names)
    const aiResult = Engine.rival.initAIOrgs(rng);
    const aiOrgs = aiResult.aiOrgs;
    const rivalOrgNames = aiResult.rivalOrgNames;

    // Initial rankings
    const initState = {
      version: '0.9',
      rngSeed: seed,
      season: 1,
      week: 1,
      funds: 5000,
      orgPop: 10,
      orgName: 'プレイヤー団体',
      roster,
      freeAgents,
      gameLog: [],
      weekPhase: isDraft ? 'draft' : 'manage',
      draftComplete: !isDraft,
      showCard: [],
      showVenue: 0,
      lastShowResults: [],
      weeklyFinance: { income: 0, expense: 0, details: [] },
      totalShows: 0,
      heatScore: 0,
      matchHistory: [],
      titles: { world: { championId: null, defenses: 0, wonWeek: 0 } },
      titleEstablished: false, // v1.0: 団体王座は条件達成後に解禁
      rivalries: {},
      coaches: [],
      availableCoaches: ALL_COACHES.map(c => c.id),
      seasonGrowth: {},
      facilities: { training: 1, medical: 1, media: 1, dormitory: 1, scouting: 1 },
      coachAssign: {},
      // v0.9: Rival system
      aiOrgs,
      rivalOrgNames,
      rankings: [],
      transferLog: [],
      transfersThisSeason: 0,
      dormantPool,
      // v0.9b: Offseason system
      offSeason: false,
      offWeek: 0,
      // v0.9c: Phase C — Transfer
      pendingPoach: [],
      // v0.9d: Phase D — Rental & Events
      rental: null,
      warThisSeason: false,
      challengeTrigger: null,
      pendingEvent: null,
      summitBonus: 0,
      // F2: Negotiation system
      pendingNegotiation: null,
      negotiatedThisSeason: [],
      warVictories: [],
      // v1.3: Career record system
      retiredFighters: [],  // temporary — cleared after year-end awards
      hallOfFame: [],       // permanent — hall of fame inductees
      // v0.95: Season statistics & history
      seasonStats: { wins: 0, losses: 0, draws: 0, showCount: 0, totalRevenue: 0, totalExpense: 0,
                     bestMQ: 0, bestMQMatch: '', peakFunds: 5000, peakPop: 0, eventsWon: 0, eventsLost: 0 },
      seasonHistory: [], // array of past season summaries
      fundsHistory: [5000], // weekly fund snapshots for sparkline
      // v0.96: Mission system
      missionEnabled: true,
      missionsCompleted: [],
      missionNewClears: [], // v1.0: pending celebration items
      // v0.97: Survival gauge
      survivalCleared: false,
      survivalProfitStreak: 0,
      survivalMilestones: [],
      survivalClearWeek: null,
      survivalClearSeason: null,
      // v1.0: Rolling 4-week net (replaces profit streak for graduation)
      recentWeeklyNet: [0, 0, 0, 0],
      rollingNet4Count: 0,
      // v1.2: タイトルマッチクールダウン & 世界王座解禁
      lastTitleMatchWeek: null, // 最後にタイトルマッチを実施した絶対週数（null=未実施）
      worldTitleUnlocked: false, // ランキング1位達成後に true
      beltDisplayName: null,    // 将来の改名イベント用（null=デフォルト名「団体王座」）
    };
    initState.rankings = Engine.ranking.updateRankings(initState);
    return initState;
  }
};

