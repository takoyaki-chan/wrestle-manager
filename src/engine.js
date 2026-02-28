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
    getMonth(w) { return ((Math.ceil(w / 4) - 1 + 3) % 12) + 1; },
    getWeekInMonth(w) { return ((w - 1) % 4) + 1; },
    formatDate(s, w) { return `${s}年目 ${this.getMonth(w)}月 第${this.getWeekInMonth(w)}週`; },
    // v1.5s25: 内部小数化 — 表示用ヘルパー（popularity/orgPopは内部小数、表示は整数）
    dispPop(v) { return Math.round(v || 0); },
    dispOrgPop(v) { return Math.round(v || 0); },
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
        + (eff(atk.sp) * ENG.dmgSpdScale);
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
        ...charL, hp: Math.round(ENG.hpBase + eff(charL.st) * ENG.hpScale),
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };
      L.mhp = L.hp;
      const R = {
        ...charR, hp: Math.round(ENG.hpBase + eff(charR.st) * ENG.hpScale),
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
      return Math.max(0, rawGain * mult);
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
      const floor = (fighter.preInjuryPop || fighter.popularity) * 0.5;
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
      const newPop = Math.max(1, fighter.popularity * TRANSFER_POP_MULT);
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
    // v1.7: 育成補助金（地域振興助成金）— orgPop 40未満の小団体を支援
    getSubsidy(orgPop) {
      for (const s of SUBSIDY_TABLE) if (orgPop <= s.max) return s.val;
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
      const baseAttendance = Math.round((G.orgPop / 100) * (G.orgPop / 100) * 10000);
      // v1.0c: CARD_MULT (was hardcoded * 3)
      const cardBonus = Math.round(mainCardPop * CARD_POP_CONFIG.CARD_MULT);
      const heatMult = Engine.heat.getMult(G);
      const titleBonus = hasTitleMatch ? 0.15 : 0.0;
      // v1.2: チャンピオン出場ボーナス +10%
      const champBonus = hasChampOnCard ? 0.10 : 0.0;
      // 華: ロスターに華持ちがいれば集客+5%
      const charismaBonus = (G.roster && G.roster.some(c => Traits.has(c, '華') && !c.injury)) ? 0.05 : 0.0;
      // v1.5: 乗算スタックを加算方式に変更（上限2.0）— 旧: 最大2.66倍 → 新: 最大2.0倍
      const totalMult = Math.min(1.0 + (heatMult - 1.0) + titleBonus + champBonus + charismaBonus, 2.0);
      const rawAttendance = Math.round((baseAttendance + cardBonus) * totalMult);
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
      // v1.5: 施策E — Heat上限帯の減衰（HOT以上では上昇量半減）
      if (delta > 0 && G.heatScore >= 6) delta *= 0.5;
      if (G.heatScore > 0 && delta <= 0) delta -= 0.5;
      if (G.heatScore < 0 && delta >= 0) delta += 0.5;
      return Engine.util.clamp(Math.round((G.heatScore + delta) * 10) / 10, -10, 10);
    },
    calcDecay(G) {
      let hs = G.heatScore;
      // v1.5: 施策E — HOT以上（|heat|≥6）は冷めやすい（decayRate 1.5）
      const decayRate = Math.abs(hs) >= 6 ? 1.5 : 1.0;
      if (hs > 0) hs = Math.max(0, hs - decayRate);
      else if (hs < 0) hs = Math.min(0, hs + decayRate);
      return Math.round(hs * 10) / 10;
    }
  },

  // ── Injury System (IMMUTABLE — returns new objects, never mutates) ──
  injury: {
    check(rng, fighter, matchResult, facilityReduction, coachInjuryMult = 1.0, week = 0, season = 0) {
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
      // v1.3-2: §5.2 怪我回数カウント
      updatedFighter = { ...updatedFighter, seasonInjuries: (updatedFighter.seasonInjuries || 0) + 1 };

      // v1.3-2: §3 growthPenalty 付与（overwriteルール: より重い方を優先）
      const debuff = INJURY_DEBUFF_TABLE[injury.type];
      if (debuff) {
        const existing = updatedFighter.growthPenalty;
        let applyNew = true;
        if (existing) {
          // 新しい怪我が軽いか同等 → 残り週数が多いほうを維持
          if (debuff.multiplier >= existing.multiplier) {
            applyNew = debuff.remainingWeeks > existing.remainingWeeks;
          }
          // 新しい怪我が重い → 上書き (applyNew=true のまま)
        }
        if (applyNew) {
          updatedFighter = { ...updatedFighter, growthPenalty: { ...debuff } };
        }
      }

      // v1.3-2: §4 moderate以上の怪我を careerHistory に記録
      if (injury.type === '中傷' || injury.type === '重傷') {
        const histEntry = {
          type: 'injury',
          week,
          season,
          detail: `${injury.type}（${reducedWeeks}週離脱）`,
        };
        updatedFighter = { ...updatedFighter, careerHistory: [...(updatedFighter.careerHistory || []), histEntry] };
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
      let rivalryBonus = (Traits.has(G.roster.find(c=>c.id===id1)||{}, 'ライバル体質') || Traits.has(G.roster.find(c=>c.id===id2)||{}, 'ライバル体質')) ? 2 : 1;
      // v1.5s25b: rivalry_chance_up バフ（マイルストーン）
      const rivalryChanceUp = (G.milestoneBuffs || []).find(b => b.type === 'rivalry_chance_up');
      if (rivalryChanceUp) rivalryBonus += 1;
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
          heatScore: Math.max(-10, (state.heatScore ?? 0) + penalty),
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
            heatGain: isChamp ? 2 : 1,
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
          s = { ...s, heatScore: Math.min(10, (s.heatScore ?? 0) + ev.heatGain) };
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

  // ── v1.7: Milestone System (キャリア年表 — careerRecord.history + careerHistory → 表示用変換) ──
  milestone: {
    /**
     * Get milestones for a fighter by ID.
     * Searches roster, retiredFighters, freeAgents.
     * Returns array of {season, week, type, text, detail?} sorted by season→week.
     */
    get(G, fighterId) {
      const fighter = (G.roster || []).find(c => c.id === fighterId)
        || (G.retiredFighters || []).find(c => c.id === fighterId)
        || (G.freeAgents || []).find(c => c.id === fighterId);
      if (!fighter) return [];

      const milestones = [];
      const history = fighter.careerRecord?.history || [];
      const careerHist = fighter.careerHistory || [];

      // Convert careerRecord.history events to milestones
      for (const ev of history) {
        switch (ev.type) {
          case 'debut':
            milestones.push({ season: ev.season || 1, week: ev.week || 1, type: 'debut',
              text: `${ev.via === 'draft' ? 'ドラフト' : ev.via === 'fa' ? 'FA' : ev.via === 'scout' ? 'スカウト' : ''}入団` });
            break;
          case 'titleWin':
            milestones.push({ season: ev.season, week: ev.week, type: 'title_win',
              text: '団体王座 獲得', detail: `${ev.beltId === 'world' ? '世界' : ''}チャンピオンに！` });
            break;
          case 'titleLoss':
            milestones.push({ season: ev.season, week: ev.week, type: 'title_loss',
              text: `団体王座 陥落`, detail: ev.defenses ? `${ev.defenses}度防衛の末に陥落` : undefined });
            break;
          case 'titleDefense': {
            const cnt = ev.count || 1;
            // Only show significant defenses (3, 5, 10, etc.)
            if (cnt === 3 || cnt === 5 || cnt >= 10 && cnt % 5 === 0) {
              milestones.push({ season: ev.season, week: ev.week, type: 'title_defense',
                text: `王座${cnt}度防衛達成` });
            }
            break;
          }
          case 'transfer':
            milestones.push({ season: ev.season, week: ev.week, type: 'transfer',
              text: `${ev.toOrg || '他団体'}へ移籍`,
              detail: ev.via === 'poach' ? '引き抜き' : ev.via === 'poach_forced' ? '強制引き抜き' : ev.via === 'negotiate' ? '交渉移籍' : undefined });
            break;
          case 'retire':
            milestones.push({ season: ev.season, week: ev.week || 48, type: 'retire',
              text: `引退（${ev.age || '?'}歳）`,
              detail: ev.reason === 'injury_wear' ? '度重なる怪我により' : ev.reason === 'injury_career_ending' ? '重傷により現役続行不可' : ev.reason === 'age' ? '年齢による引退' : undefined });
            break;
          case 'summit':
            milestones.push({ season: ev.season, week: ev.week, type: 'summit',
              text: `頂上決戦 ${ev.won ? '勝利' : '敗北'}` });
            break;
          case 'war':
            milestones.push({ season: ev.season, week: ev.week, type: 'war',
              text: `対抗戦 ${ev.won ? '勝利' : '敗北'}` });
            break;
          case 'peakOVR':
            milestones.push({ season: ev.season, week: ev.week || 0, type: 'peak',
              text: `全盛期 OVR ${ev.ovr}` });
            break;
          default:
            milestones.push({ season: ev.season || 1, week: ev.week || 0, type: ev.type,
              text: ev.detail || ev.type });
        }
      }

      // Convert careerHistory events (injuries etc.)
      for (const ev of careerHist) {
        milestones.push({
          season: ev.season || 1, week: ev.week || 0,
          type: ev.type === 'injury_retirement' ? 'injury' : (ev.type || 'note'),
          text: ev.detail || ev.type,
          detail: ev.type === 'injury_retirement' ? '怪我による引退' : undefined
        });
      }

      // Add season_end summary for completed seasons
      const currentSeason = G.season || 1;
      const record = fighter.careerRecord || {};
      // If fighter has been here multiple seasons, add season summaries
      const startSeason = milestones.reduce((min, m) => Math.min(min, m.season || currentSeason), currentSeason);
      for (let s = startSeason; s < currentSeason; s++) {
        const seasonEvents = milestones.filter(m => m.season === s);
        if (seasonEvents.length === 0) {
          // Add a placeholder for seasons with no notable events
          milestones.push({ season: s, week: 48, type: 'season_end',
            text: `${s}年目終了`, detail: '特記事項なし' });
        }
      }

      // Sort by season (asc) then week (asc)
      milestones.sort((a, b) => (a.season - b.season) || (a.week - b.week));
      return milestones;
    },

    /** Return style info for milestone type */
    _typeStyle(type) {
      const styles = {
        debut:         { icon: '🎓', color: '#2ecc71' },
        title_win:     { icon: '🏆', color: '#f1c40f' },
        title_loss:    { icon: '💫', color: '#e74c3c' },
        title_defense: { icon: '🛡️', color: '#3498db' },
        transfer:      { icon: '📋', color: '#9b59b6' },
        retire:        { icon: '🌅', color: '#e67e22' },
        summit:        { icon: '⚔️', color: '#e74c3c' },
        war:           { icon: '🏴', color: '#2c3e50' },
        peak:          { icon: '📈', color: '#1abc9c' },
        injury:        { icon: '🏥', color: '#e74c3c' },
        season_end:    { icon: '📅', color: '#95a5a6' },
        note:          { icon: '📝', color: '#bdc3c7' },
      };
      return styles[type] || styles.note;
    }
  },

  // ── v1.3-3: Retirement Presentation ────────────────
  retirement: {
    /**
     * Build career summary from careerRecord.history (max 8 items, spec §1.2)
     * Returns array of { icon, text } objects for display.
     */
    buildCareerSummary(fighter) {
      const history = (fighter.careerRecord?.history || []);
      if (history.length === 0) return [];

      // Categorize events
      const debut = history.filter(e => e.type === 'debut');
      const titleWins = history.filter(e => e.type === 'titleWin');
      const titleLosses = history.filter(e => e.type === 'titleLoss');
      const summits = history.filter(e => e.type === 'summit');
      const wars = history.filter(e => e.type === 'war');
      const transfers = history.filter(e => e.type === 'transfer');
      const peakOVRs = history.filter(e => e.type === 'peakOVR');
      const defenses = history.filter(e => e.type === 'titleDefense');

      const items = [];

      // 1. debut (always show)
      debut.forEach(e => {
        const via = e.via === 'draft' ? 'ドラフト' : e.via === 'fa' ? 'FA' : e.via === 'scout' ? 'スカウト' : '入団';
        items.push({ icon: '🎓', text: `S${e.season||1} ${via}入団`, priority: 1 });
      });

      // 2. titleWin / titleLoss (always show)
      titleWins.forEach(e => items.push({ icon: '🏆', text: `S${e.season} W${e.week} 団体王座 獲得`, priority: 2 }));
      titleLosses.forEach(e => items.push({ icon: '💫', text: `S${e.season} W${e.week} 団体王座 陥落`, priority: 2 }));

      // 3. summit (priority)
      summits.forEach(e => {
        const result = e.won ? '勝利' : '敗北';
        items.push({ icon: '🏆', text: `S${e.season} 頂上決戦（${result}）`, priority: 3 });
      });

      // 4. war (max 2)
      wars.slice(0, 2).forEach(e => {
        const result = e.won ? '勝利' : '敗北';
        items.push({ icon: '⚔', text: `S${e.season} 対抗戦（${result}）`, priority: 4 });
      });

      // 5. transfer (max 2)
      transfers.slice(0, 2).forEach(e => {
        items.push({ icon: '📋', text: `S${e.season} ${e.toOrg||'他団体'}に移籍`, priority: 5 });
      });

      // 6. peakOVR (best only, always show)
      if (peakOVRs.length > 0) {
        const best = peakOVRs.reduce((a, b) => (b.ovr || 0) > (a.ovr || 0) ? b : a, peakOVRs[0]);
        items.push({ icon: '📈', text: `S${best.season} 全盛期 OVR ${best.ovr || fighter.careerRecord?.peakOVR || '?'}`, priority: 6 });
      } else if (fighter.careerRecord?.peakOVR) {
        items.push({ icon: '📈', text: `全盛期 OVR ${fighter.careerRecord.peakOVR}`, priority: 6 });
      }

      // 7. titleDefense (summarized, 1 line)
      if (defenses.length > 0) {
        const maxCount = Math.max(...defenses.map(e => e.count || 1));
        items.push({ icon: '🛡️', text: `防衛 ${maxCount}回`, priority: 7 });
      }

      // Sort by priority, then trim to max 8
      items.sort((a, b) => a.priority - b.priority);
      return items.slice(0, 8);
    },

    /**
     * Select retirement line based on route × career × personality (spec §3.4)
     * @param {Object} fighter
     * @param {string} route - 'season_end' | 'injury_wear' | 'injury_career_ending'
     * @param {Object} state - GameState (for champion check)
     * @param {Object} rng
     * @returns {string} retirement line
     */
    selectLine(fighter, route, state, rng) {
      let category;

      if (route === 'injury_wear' || route === 'injury_career_ending') {
        // 怪我引退
        const isChamp = state.titles?.world?.championId === fighter.id;
        if (isChamp) {
          category = 'B4_champion_injury';
        } else if (fighter.age <= 25) {
          category = 'B1_young';
        } else if (fighter.age <= 30) {
          category = 'B2_prime';
        } else {
          category = 'B3_older';
        }
      } else {
        // シーズン末引退
        if (fighter.role === 'Heel') {
          category = 'A3_heel';
        } else if ((fighter.careerRecord?.totalTitleWins || 0) > 0) {
          category = 'A1_champion';
        } else if ((fighter.careerSeasons || 0) >= 10) {
          category = 'A4_veteran';
        } else {
          category = 'A2_uncrowned';
        }
      }

      const lines = RETIREMENT_LINES[category] || RETIREMENT_LINES.A2_uncrowned;
      const idx = Math.floor(Engine.rng.float(rng) * lines.length);
      return { line: lines[idx], category };
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
          // v1.3-2: §5.3 シーズン中の怪我回数 × 2
          wearBonus += (nc.seasonInjuries || 0) * 2;
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
        nc.seasonInjuries = 0; // v1.3-2: §5.4 シーズンリセット
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
    // Generate trainCap for a fighter (training-spec §1.4 v1.2: factor×Pot, 0ベース)
    generateTrainCap(rng, _notionValue, potential) {
      const caps = {};
      ['pw','sp','te','st','mn'].forEach(s => {
        const factor = 0.50 + Engine.rng.float(rng) * 0.30; // 0.50〜0.80
        caps[s] = Math.round(factor * (potential[s] || 0));
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
        traits: template.traits || [],
        notionValue: notion, trainCap,
        popularity: Math.max(5, Math.round(ovr * 0.6 + Engine.rng.int(rng, -5, 10))),
        orgId, age: age || (16 + Engine.rng.int(rng, 0, 12)),
        careerSeasons: Math.max(0, ((age || 20) - 16)), // v1.4: 新人王判定用
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
          f.careerSeasons = (f.careerSeasons || 0) + 1; // v1.4: 新人王判定用
          const aiDecayStart = 28 + (f.durability || 0);
          if (f.age >= aiDecayStart) {
            const aiBaseWear = 10 + Engine.rng.int(rng, -3, 3);
            f.wear = (f.wear || 0) + Math.max(1, aiBaseWear - (f.durability || 0));
          }
        });

        // Step 2: 衰退判定 (v1.3-1 §3 — wear-based)
        roster = roster.map(f => Engine.growth.applyDecay(rng, f));

        // Step 2b: v1.8 AI成長イベント（ブレークスルー・スランプ・モチベ喪失）
        const geResult = Engine.growthEvents.aiSeasonGrowthEvents(rng, roster, org);
        roster = geResult.fighters;
        geResult.aiGrowthEvents.forEach(ev => {
          const tbl = { breakthrough: 'ブレークスルー', slump: 'スランプ', motivation_loss: 'モチベ喪失' };
          events.push(`${org.emoji} ${ev.fighter.name}: ${tbl[ev.type] || ev.type}`);
        });
        if (geResult.aiGrowthEvents.length > 0) {
          // aiOrgs[org.id] への aiGrowthEvents 記録（脅威通知で参照）
          newAiOrgs[org.id] = newAiOrgs[org.id] || {};
          newAiOrgs[org.id]._lastSeasonGrowthEvents = geResult.aiGrowthEvents;
        }

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
      // v1.8: スランプ/モチベ喪失による成長ブロック
      if (f._aiGrowthBlock) {
        const { _aiGrowthBlock: _, _aiGrowthHalf: __, ...clean } = f;
        return clean;
      }
      const growthMod = f._aiGrowthHalf ? 0.5 : 1.0;
      const age = f.age || 20;
      const ageMul = ageMultiplier(age, (f || {}).traits);
      if (ageMul <= 0) { const { _aiGrowthHalf: _, ...clean } = f; return clean; } // no growth at 35+

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
        // v1.8: _aiGrowthHalf = スランプ → 成長50%カット
        f[s] = Math.min(trainCap[s], f[s] + Math.round((trainingGain + matchGain) * growthMod));
      });
      // 一時フィールドを除去してクリーンな fighter を返す
      const { _aiGrowthHalf: _h, _aiGrowthBlock: _b, ...cleanF } = f;
      return cleanF;
    },

    // AI season popularity (rival-spec §4.2)
    aiSeasonPopularity(rng, fighter, org) {
      const f = { ...fighter };
      const overall = Engine.util.ov(f);
      const tierBonus = AI_SEASON_CFG.tierPopBonus[org.tier] || 0;
      const popTarget = Math.min(90, overall * 0.7 + tierBonus);
      const diff = popTarget - (f.popularity || 10);
      const randomDelta = -AI_SEASON_CFG.popRandomRange + Engine.rng.int(rng, 0, AI_SEASON_CFG.popRandomRange * 2);
      f.popularity = Engine.util.clamp(f.popularity + diff * AI_SEASON_CFG.popConvergeRate + randomDelta, 5, 95);
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
      // v1.9c: dormantPool entries can be plain IDs or {id,age} objects
      // Keep original entries for return value (preserves age info), use normalized IDs for logic
      let dormantEntries = [...(state.dormantPool || [])];
      let poolIds = dormantEntries.map(e => typeof e === 'object' ? e.id : e);

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
          dormantEntries = dormantEntries.filter(e => (typeof e === 'object' ? e.id : e) !== candId);
          budget -= cost;
          picked++;
          events.push(`${org.emoji} ${org.name}が${template.name}を獲得`);
        }

        newAiOrgs[org.id] = { ...aiData, roster };
      });

      return { aiOrgs: newAiOrgs, dormantPool: dormantEntries, events };
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
      // v1.8: 怪我復帰スランプトリガー用に事前スナップショット取得
      const preInjuryRoster = G.roster;
      const injResult = Engine.injury.tick(G.roster, G.freeAgents);
      events.push(...injResult.events);
      let roster = injResult.roster;
      const freeAgents = injResult.freeAgents;

      // v1.8: §4.2 怪我復帰スランプ判定（復帰した選手にトリガー）
      const geSlumpRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0x5C1));
      const pendingSlumpEvents = [];
      const pendingMotivationEvents = [];
      const pendingMotivationRetirements = [];
      roster = roster.map(c => {
        const prev = preInjuryRoster.find(p => p.id === c.id);
        if (!prev || !prev.injury || c.injury) return c; // 復帰していない
        const severity = prev.injury.type;
        const trigger = severity === '重傷' ? 'injury_severe_recovery' : '中傷' ? 'injury_moderate_recovery' : null;
        if (!trigger) return c;
        if (Engine.growthEvents.checkSlump(geSlumpRng, c, trigger)) {
          const newC = Engine.growthEvents.applySlump(c, trigger, G.season, G.week);
          pendingSlumpEvents.push({ type: 'slump_start', fighterId: c.id, trigger });
          return newC;
        }
        return c;
      });

      let heatScore = G.heatScore;
      if (!Engine.util.isShowWeek(G.week)) {
        heatScore = Engine.heat.calcDecay({ ...G, heatScore });
      } else {
        // v1.7: mild decay even on show weeks (B fix — makes On Fire harder to maintain)
        if (heatScore > 0) heatScore = Math.round(Math.max(0, heatScore - 0.3) * 10) / 10;
        else if (heatScore < 0) heatScore = Math.round(Math.min(0, heatScore + 0.3) * 10) / 10;
      }

      const dormBonus = Engine.facility.getConditionBonus(G);
      const stateForCalc = { ...G, roster, heatScore };

      // v1.5s25b: マイルストーンバフ参照用（ループ外で1回取得）
      const mBuffs = G.milestoneBuffs || [];
      const trainingBoostBuff = mBuffs.find(b => b.type === 'training_boost');
      const trainingBoostMult = trainingBoostBuff ? trainingBoostBuff.multiplier : 1.0;
      const promoBoostBuff = mBuffs.find(b => b.type === 'promo_boost');
      const promoBoostAmount = promoBoostBuff ? promoBoostBuff.amount : 0;

      roster = roster.map(c => {
        let nc = { ...c, seasonGrowth: { ...(c.seasonGrowth || {pw:0,sp:0,te:0,st:0,mn:0}) } };

        // v1.3-2: §3.3 growthPenaltyカウントダウン（毎週 — 怪我中も時間は経過する）
        if (nc.growthPenalty) {
          const prevRemaining = nc.growthPenalty.remainingWeeks;
          nc.growthPenalty = { ...nc.growthPenalty, remainingWeeks: prevRemaining - 1 };
          if (nc.growthPenalty.remainingWeeks <= 0) {
            nc.growthPenalty = null;
            // v1.8: §4.2 growthPenalty解除時スランプ判定
            if (Engine.growthEvents.checkSlump(geSlumpRng, nc, 'penalty_end')) {
              nc = Engine.growthEvents.applySlump(nc, 'penalty_end', G.season, G.week);
              pendingSlumpEvents.push({ type: 'slump_start', fighterId: nc.id, trigger: 'penalty_end' });
            }
          }
        }

        // v1.8: §3.7 絶好調カウントダウン（怪我中でも時間は経過）
        if (nc.hotStreak) {
          const hadSevere = nc.injury && nc.injury.type === '重傷';
          const hsResult = Engine.growthEvents.tickHotStreak(nc, hadSevere);
          nc = { ...nc, hotStreak: hsResult.fighter.hotStreak };
          if (hsResult.ended) events.push(`✨ ${nc.name}の絶好調期間が終了した`);
        }

        // v1.8: §4 スランプ週次処理（時間経過 momentum + 回復判定）
        if (nc.slump && !nc.injury) {
          const slumpTickRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0x5C2, nc.id));
          const slumpResult = Engine.growthEvents.tickSlumpPassive(nc, slumpTickRng, G.season, G.week);
          nc = slumpResult.fighter;
          if (slumpResult.recovered) {
            pendingSlumpEvents.push({ type: 'slump_end', fighterId: nc.id, duration: slumpResult.duration });
            events.push(`💪 ${nc.name}がスランプから脱出！`);
          } else {
            // §5.2 モチベ喪失判定（スランプ中の毎週）
            const motivRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0x5C3, nc.id));
            if (Engine.growthEvents.checkMotivationLoss(motivRng, nc, 'weekly')) {
              nc = Engine.growthEvents.applyMotivationLoss(nc, G.season, G.week);
              pendingMotivationEvents.push({ type: 'motivation_loss_start', fighterId: nc.id });
              events.push(`😞 ${nc.name}のモチベーションが喪失…`);
            }
          }
        }

        // v1.8: §5 モチベ喪失週次処理
        if (nc.motivationLoss && !nc.injury) {
          const motTickRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0x5C4, nc.id));
          const motResult = Engine.growthEvents.tickMotivationLossPassive(nc, motTickRng, G.season, G.week);
          nc = motResult.fighter;
          if (motResult.selfRetire) {
            pendingMotivationRetirements.push({ fighterId: nc.id });
            events.push(`💔 ${nc.name}が自主引退を申し出た…`);
          } else if (motResult.recovered) {
            pendingMotivationEvents.push({ type: 'motivation_loss_end', fighterId: nc.id, duration: motResult.duration });
            events.push(`🌅 ${nc.name}が再起した！`);
          }
        }

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
          // v1.3-2: §2.6 練習成長×0.4 + §3.3 growthPenalty適用
          const rawPenMultI = nc.growthPenalty ? nc.growthPenalty.multiplier : 1.0;
          // 適応力: growthPenaltyの影響を0.2軽減（怪我中でも順応して成長できる）
          const penMult = (rawPenMultI < 1.0 && Traits.has(nc, '適応力')) ? Math.min(1.0, rawPenMultI + 0.2) : rawPenMultI;
          // v1.8: スランプ/モチベ喪失で成長停止、絶好調で×1.15
          const statusMult = (nc.slump || nc.motivationLoss) ? 0 : (nc.hotStreak ? 1.15 : 1.0);
          // v2.0: 専属トレーナーバフ
          const trainerMult = Engine.careActions.getTrainerMult(nc);
          const trainGrowth = Math.round(growth * 0.4 * penMult * statusMult * trainingBoostMult * trainerMult * 10) / 10;
          if (trainGrowth > 0) { nc[growStat] += trainGrowth; nc.seasonGrowth[growStat] = (nc.seasonGrowth[growStat] || 0) + trainGrowth; }
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
          // v1.3-2: §2.6 練習成長×0.4 + §3.3 growthPenalty適用
          const rawPenMultP = nc.growthPenalty ? nc.growthPenalty.multiplier : 1.0;
          // 適応力: growthPenaltyの影響を0.2軽減
          const penMult = (rawPenMultP < 1.0 && Traits.has(nc, '適応力')) ? Math.min(1.0, rawPenMultP + 0.2) : rawPenMultP;
          // v1.8: スランプ/モチベ喪失で成長停止、絶好調で×1.15
          const statusMult = (nc.slump || nc.motivationLoss) ? 0 : (nc.hotStreak ? 1.15 : 1.0);
          // v2.0: 専属トレーナーバフ
          const trainerMult = Engine.careActions.getTrainerMult(nc);
          const trainGrowth = Math.round(growth * 0.4 * penMult * statusMult * trainingBoostMult * trainerMult * 10) / 10;
          if (trainGrowth > 0) { nc[growStat] += trainGrowth; nc.seasonGrowth[growStat] = (nc.seasonGrowth[growStat] || 0) + trainGrowth; }
          const ironBonus = Traits.has(nc, '鉄人') ? 2 : 0;
          nc.condition = Math.max(0, nc.condition - (3 + Engine.rng.int(rng, 0, 3)) + dormBonus + mentalBonus + ironBonus);
          nc.intensiveWeeks = 0;
        } else if (action === 'promo') {
          // v1.0b: Apply diminishing returns + promo pop cap
          const rawPromoGain = Math.floor(1 + Engine.rng.float(rng) * 2) + Engine.coach.getPopBonusForChar(stateForCalc, nc.id) + Engine.facility.getPromoBonus(G) + promoBoostAmount;
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

      // v1.5: Natural popularity decay — 放っておくと人気は落ちる（低人気帯は軽減）
      roster = roster.map(c => {
        if (c.injury || c.isRental || c.popularity <= 10) return c;
        const decay = c.popularity < 25 ? 0.2 : c.popularity < 40 ? 0.3 : 0.5;
        return { ...c, popularity: Math.max(10, c.popularity - decay) };
      });

      // v1.8: §4.3/§5.3 スランプ/モチベ喪失中の能力微減（怪我中はスキップ）
      const decayRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0x5C5));
      roster = roster.map(c => {
        if (c.injury || c.isRental) return c;
        return Engine.growthEvents.applyWeeklyStatDecay(decayRng, c);
      });

      // v2.0: トレーナーバフ週次消費（成長計算の後でデクリメント）
      roster = Engine.careActions.tickTrainerBuffs(roster);

      // v2.0: 週次イベント生成（25%発生率、非興行週・通常シーズンのみ）
      // 通知型 (N1〜N5) と 選択型 (S1〜S6, E1〜E6) を区別して処理
      let pendingNotifEvent = null;
      let pendingChoiceEvent = null;
      let pendingLargeEvent = null;
      if (!Engine.util.isShowWeek(G.week) && !G.offSeason) {
        const evtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xE101));
        const rawEvent = Engine.eventSystem.generateWeeklyEvent(evtRng, { ...G, roster });
        if (rawEvent) {
          const evtPrefix = rawEvent.type ? rawEvent.type[0] : '';
          if (evtPrefix === 'B') {
            // 大型イベント (B1〜B4): セリフ付きで格納 — 効果はユーザーの選択後に適用
            const dialogue = Engine.eventSystem.getLargeEventDialogue(evtRng, rawEvent, G.roster);
            const dialogue2 = rawEvent.type === 'B2' ? Engine.eventSystem.getLargeEventDialogue2(evtRng, rawEvent, G.roster) : '';
            const textKey = rawEvent.type;
            const vars = { name: rawEvent.name || '', name1: rawEvent.name1 || '', name2: rawEvent.name2 || '',
                           orgName: rawEvent.orgName || '', outletName: rawEvent.outletName || '' };
            const textData = Engine.eventSystem.pickText(evtRng, textKey, vars);
            pendingLargeEvent = { ...rawEvent, ...textData, dialogue, dialogue2 };
          } else if (evtPrefix === 'S' || evtPrefix === 'E') {
            // 選択型: セリフ付きで格納 — 効果はユーザーの選択後に適用
            const dialogue = Engine.eventSystem.getChoiceDialogue(evtRng, rawEvent, G.roster);
            const choices = Engine.eventSystem.buildChoices(rawEvent, G);
            pendingChoiceEvent = { ...rawEvent, dialogue, choices };
          } else {
            // 通知型 (N1〜N5): 即座に効果を適用してトーストで通知
            const applied = Engine.eventSystem.applyNotifEffect(evtRng, rawEvent, roster);
            roster = applied.roster;
            const textKey = rawEvent.type === 'N5'
              ? (rawEvent.band === 'low' ? 'N5_low' : 'N5_warning')
              : rawEvent.type;
            const textData = Engine.eventSystem.pickText(evtRng, textKey, { name: rawEvent.name, name2: rawEvent.name2 });
            const dialogue = Engine.eventSystem.getNotifDialogue(evtRng, applied.event, roster);
            pendingNotifEvent = { ...applied.event, ...textData, dialogue };
          }
        }
      }

      // v1.8: pending growth events を transient フィールドとして返す
      const pendingGrowthEvents = [
        ...pendingSlumpEvents.map(e => ({ ...e })),
        ...pendingMotivationEvents.map(e => ({ ...e })),
      ];
      const result = { roster, freeAgents, heatScore, events };
      if (pendingGrowthEvents.length > 0) result._pendingGrowthEvents = pendingGrowthEvents;
      if (pendingMotivationRetirements.length > 0) result._pendingMotivationRetirements = pendingMotivationRetirements;
      if (pendingNotifEvent) result._pendingNotifEvent = pendingNotifEvent;
      if (pendingChoiceEvent) result._pendingChoiceEvent = pendingChoiceEvent;
      if (pendingLargeEvent) result._pendingLargeEvent = pendingLargeEvent;
      return result;
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

      // v1.7: 育成補助金（orgPop 40未満の団体に支給）
      const subsidy = Engine.economy.getSubsidy(G.orgPop);
      totalIncome += subsidy;
      if (subsidy > 0) details.push({ label: '🏛️ 地域振興助成金', val: subsidy, type: 'income' });

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
        let attendance = Engine.economy.calcAttendance(G, G.showVenue, mainPop, hasTitleMatch, hasChampOnCard);
        // v1.5s25b: attendance_boost バフ（マイルストーン）
        const attendBoostBuff = (G.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
        if (attendBoostBuff) attendance = Math.min(VENUES[G.showVenue].cap, Math.round(attendance * attendBoostBuff.multiplier));
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
    // v1.8: transient 成長イベントを state に乗せる
    if (manage._pendingGrowthEvents) s = { ...s, _pendingGrowthEvents: manage._pendingGrowthEvents };
    if (manage._pendingMotivationRetirements) s = { ...s, _pendingMotivationRetirements: manage._pendingMotivationRetirements };
    // v2.0: transient 通知型/選択型/大型イベントを state に乗せる
    if (manage._pendingNotifEvent) s = { ...s, _pendingNotifEvent: manage._pendingNotifEvent };
    if (manage._pendingChoiceEvent) s = { ...s, _pendingChoiceEvent: manage._pendingChoiceEvent };
    if (manage._pendingLargeEvent) s = { ...s, _pendingLargeEvent: manage._pendingLargeEvent };
    const settle = Engine.season.processSettlement(s);
    s = { ...s, roster: settle.roster, funds: settle.funds, weeklyFinance: settle.weeklyFinance, weekPhase: 'settled' };
    // v1.0b: Apply occupancy heat delta
    if (settle.occHeatDelta !== 0) {
      s = { ...s, heatScore: s.heatScore + settle.occHeatDelta };
    }
    const events = [...manage.events, settle.summary];
    // v2.1: 破産判定
    if (s.funds <= 0) {
      s = { ...s, weekPhase: 'gameover' };
      events.push('💀 資金が尽きた…団体は解散を余儀なくされた。');
    }
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
        // v1.5: store {id, age} to preserve age and prevent eternal youth glitch
        if (ALL_CHARS.find(c => c.id === r.id)) pool.push({ id: r.id, age: r.age || 18 });
      }
      // Add up to 2 from pool to FA
      // 占有済みID（現在のfa＋ロスター＋AI団体）を収集して重複を防ぐ
      const faOccupied = new Set(fa.map(f => f.id));
      (s.roster || []).forEach(c => faOccupied.add(c.id));
      Object.values(s.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => faOccupied.add(c.id)));
      // 直前に除外したIDも除外候補から切り離す（just-removed IDの即再入場を防止）
      removed.forEach(r => faOccupied.add(r.id));
      // v1.5: pool entries can be string IDs (legacy) or {id, age} objects
      const eligiblePool = pool.filter(entry => {
        const id = typeof entry === 'object' ? entry.id : entry;
        const age = typeof entry === 'object' ? entry.age : null;
        if (faOccupied.has(id)) return false;
        // 年齢保持エントリは22歳超えで除外（プロ入りの機会を逃した）
        if (age !== null && age >= 22) return false;
        return true;
      });
      const addCount = Math.min(2, eligiblePool.length);
      const shuffledPool = [...eligiblePool].sort(() => Engine.rng.float(faRng) - 0.5);
      const added = [];
      for (let i = 0; i < addCount && i < shuffledPool.length; i++) {
        const entry = shuffledPool[i];
        const cid = typeof entry === 'object' ? entry.id : entry;
        const storedAge = typeof entry === 'object' ? entry.age : null;
        const template = ALL_CHARS.find(c => c.id === cid);
        if (!template) continue;
        // v1.5: use stored age for returning FA fighters; fresh 18-24 for new entrants from initial pool
        const age = storedAge !== null ? storedAge : (18 + Engine.rng.int(faRng, 0, 6));
        const fighter = Engine.rival.makeAIFighter(template, faRng, null, age);
        fa.push(fighter);
        added.push(fighter);
        pool = pool.filter(e => (typeof e === 'object' ? e.id : e) !== cid);
      }
      if (removed.length > 0 || added.length > 0) {
        s = { ...s, freeAgents: fa, dormantPool: pool };
        if (added.length > 0) events.push(`📋 FA市場更新: ${added.map(f => f.name).join('、')}が新規参入`);
      }

      // v1.9c: 緊急補充 — FAが空で有効なpool候補もいない場合に即時補充
      // 修正: pool.length ではなく「22歳未満の有効エントリ数」で判定
      // 修正: dormantPool だけでなく freeAgents にも直接追加してすぐ表示されるようにする
      {
        const curFA = s.freeAgents || [];
        const curPool = s.dormantPool || [];
        // 占有済みID収集（ロスター＋AI団体＋現FA＋dormant全エントリ）
        const emergOccupied = new Set();
        (s.roster || []).forEach(c => emergOccupied.add(c.id));
        Object.values(s.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => emergOccupied.add(c.id)));
        curFA.forEach(c => emergOccupied.add(c.id));
        curPool.forEach(e => emergOccupied.add(typeof e === 'object' ? e.id : e));
        // pool内で実際に有効なエントリ数（22歳未満かつ未占有）
        const eligibleInPool = curPool.filter(e => {
          const age = typeof e === 'object' ? e.age : null;
          return age === null || age < 22;
        }).length;
        // FAが空 かつ 有効poolが3未満 → 緊急補充
        if (curFA.length === 0 && eligibleInPool < 3) {
          const available = ALL_CHARS.filter(c => !emergOccupied.has(c.id));
          if (available.length > 0) {
            const emergRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xE911));
            const shuffled = [...available].sort(() => Engine.rng.float(emergRng) - 0.5);
            // FA に直接3名追加（すぐ表示される）＋ dormantPool に5名追加（次回ローテ用）
            const directCount = Math.min(3, shuffled.length);
            const poolCount = Math.min(5, shuffled.length - directCount);
            const directFighters = shuffled.slice(0, directCount).map(c => {
              const age = 18 + Engine.rng.int(emergRng, 0, 2);
              return Engine.rival.makeAIFighter(c, emergRng, null, age);
            });
            const newPoolEntries = shuffled.slice(directCount, directCount + poolCount).map(c => ({ id: c.id, age: 18 + Engine.rng.int(emergRng, 0, 2) }));
            s = { ...s,
              freeAgents: [...curFA, ...directFighters],
              dormantPool: [...curPool, ...newPoolEntries]
            };
            events.push(`🌱 FA市場に新世代${directFighters.length}名が緊急参入`);
          }
        }
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

    // v1.5s25: Pass 1 — バトル結果生成（外部MQボーナスなし・メタデータのみ記録）
    const rawResults = validMatches.map(m => {
      const charL = roster.find(c => c.id === m.left);
      const charR = roster.find(c => c.id === m.right);
      if (!charL || !charR) return null;
      const matchRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, m.left, m.right));
      const result = Engine.battle.simulateMatch(charL, charR, matchRng);
      // メタデータ記録（MQにはまだ加算しない）
      const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
      if (rivalLvl) result.rivalryBonus = rivalLvl;
      if (m.isTitle) {
        result.isTitleMatch = true;
        // v2.1: OVR差格差ペナルティ用にチャンピオンvs挑戦者のOVR差を記録
        const champId = titles.world.championId;
        if (champId) {
          const champF = charL.id === champId ? charL : (charR.id === champId ? charR : null);
          const chalF  = charL.id === champId ? charR  : (charR.id === champId ? charL  : null);
          if (champF && chalF) result.titleOVRGap = Engine.util.ov(champF) - Engine.util.ov(chalF);
        }
      }
      result.coachMQBonus = Engine.coach.getMQBonusForMatch(s, m.left, m.right);
      // 因縁更新（副作用）
      const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right);
      rivalries = rivalResult.rivalries;
      if (rivalResult.msg) events.push(rivalResult.msg);
      return result;
    }).filter(Boolean);

    // Title outcomes
    validMatches.forEach((m, i) => {
      if (!m.isTitle || !rawResults[i]) return;
      const r = rawResults[i];
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

    // v1.0c: 会場熱気MQボーナス算出（満員率＋会場規模）
    const showMatchPops = validMatches.map(m => {
      const lc = roster.find(c => c.id === m.left);
      const rc = roster.find(c => c.id === m.right);
      return (lc ? lc.popularity : 0) + (rc ? rc.popularity : 0);
    });
    const showCardPop = Engine.economy.calcCardPop(showMatchPops);
    const hasTitleMatchForAttend = validMatches.some(m => m.isTitle);
    const champIdForAttend = s.titles?.world?.championId;
    const hasChampOnCardForAttend = champIdForAttend ? validMatches.some(m => m.left === champIdForAttend || m.right === champIdForAttend) : false;
    let preAttendance = Engine.economy.calcAttendance(s, s.showVenue, showCardPop, hasTitleMatchForAttend, hasChampOnCardForAttend);
    // v1.5s25b: attendance_boost バフ（マイルストーン）
    const attendBoostBuff = (state.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
    if (attendBoostBuff) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * attendBoostBuff.multiplier));
    const preOccRate = preAttendance / VENUES[s.showVenue].cap;
    const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);
    if (crowdMQ.crowdLabel) {
      events.push(`🏟️ ${crowdMQ.crowdLabel}（MQ全試合 ${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}）`);
    }

    // v1.5s25: Pass 2 — 外部MQボーナスキャップ適用（正方向合計 +15 上限。ガラガラペナルティはキャップ対象外）
    // v1.5s25b: mq_boost バフ（マイルストーン）
    const mqBoostBuff = (state.milestoneBuffs || []).find(b => b.type === 'mq_boost');
    const mqBoostAmount = mqBoostBuff ? mqBoostBuff.amount : 0;
    // v1.5s25b: next_match_mq バフ（特定ペアの次の対戦のみ）
    const nextMatchMqBuff = (state.milestoneBuffs || []).find(b => b.type === 'next_match_mq');
    let nextMatchMqConsumed = false;
    // v2.0: ファン期待度チェック（期待カードは MQ+5 ボーナス）
    const fanExpects = Engine.fanExpect.generate(s);
    const results = rawResults.map(r => {
      let externalMQ = 0;
      if (r.rivalryBonus) externalMQ += r.rivalryBonus.mqBonus;
      if (r.isTitleMatch) externalMQ += (TITLES.find(t => t.id === 'world')?.mqBonus || 5);
      if (r.coachMQBonus > 0) externalMQ += r.coachMQBonus;
      externalMQ += crowdMQ.total;
      // v1.5s25b: mq_boost（キャップ対象）
      externalMQ += mqBoostAmount;
      // v1.5s25b: next_match_mq（特定ペアのみ、1回限り）
      if (nextMatchMqBuff && !nextMatchMqConsumed && nextMatchMqBuff.pair) {
        const [p1, p2] = nextMatchMqBuff.pair;
        if ((r.left.id === p1 && r.right.id === p2) || (r.left.id === p2 && r.right.id === p1)) {
          externalMQ += nextMatchMqBuff.amount;
          nextMatchMqConsumed = true;
        }
      }
      // v2.0: ファン期待カード MQボーナス（キャップ対象）
      externalMQ += Engine.fanExpect.getMQBonus(r.left.id, r.right.id, fanExpects);
      // 野心: タイトルマッチで挑戦者側が野心持ちなら MQ+2（キャップ対象）
      if (r.isTitleMatch) {
        const champId = s.titles?.world?.championId;
        const challenger = champId === r.left.id ? r.right : (champId === r.right.id ? r.left : null);
        if (challenger && Traits.has(challenger, '野心')) externalMQ += 2;
      }
      const positiveExternal = Math.max(0, externalMQ);
      const negativeExternal = Math.min(0, externalMQ);
      const cappedPositive = Math.min(positiveExternal, MQ_EXTERNAL_CAP);
      // v2.1: タイトルマッチ格差ペナルティ（キャップ後に別途減算。タイトルボーナスは享受できる）
      let titleGapPenalty = 0;
      if (r.isTitleMatch && r.titleOVRGap > 20) titleGapPenalty = -6;
      else if (r.isTitleMatch && r.titleOVRGap > 10) titleGapPenalty = -3;
      r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal + titleGapPenalty, 5, 100);
      r.externalMQBonus = cappedPositive + negativeExternal + titleGapPenalty;
      if (titleGapPenalty < 0) r.titleGapPenalty = titleGapPenalty;
      return r;
    });

    // v1.5s25b: next_match_mq 消費（1回限り）
    if (nextMatchMqConsumed) {
      const cleanedBuffs = (s.milestoneBuffs || []).filter(b => b.type !== 'next_match_mq');
      s = { ...s, milestoneBuffs: cleanedBuffs };
    }

    // v2.1: 格差タイトルマッチのログ
    results.forEach(r => {
      if (r.titleGapPenalty) {
        events.push(`⚠️ 格差タイトルマッチ: OVR差+${r.titleOVRGap} → MQ${r.titleGapPenalty}`);
      }
    });

    // MQ popularity (immutable) — v1.0b: includes diminishing returns, losing streak, main event penalty
    const mainEventIdx = results.length - 1; // last match is main event
    results.forEach((r, idx) => {
      const isMainEvent = idx === mainEventIdx;
      const mqPop = Engine.applyMQPopularity(roster, r, isMainEvent);
      roster = mqPop.roster;
      events.push(...mqPop.popEvents);
    });
    const orgPopRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x4F50));
    const popResult = Engine.applyShowPopularity(roster, results, s.orgPop, orgPopRng);
    roster = popResult.roster;
    events.push(`📊 興行平均MQ: ${Math.round(results.reduce((a,r) => a + r.mq, 0) / results.length)} → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 10) / 10} (現在: ${Engine.util.dispOrgPop(popResult.orgPop)})`);

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
      const li = Engine.injury.check(injRngL, lc, r, injuryReduction, Engine.coach.getInjuryMult(s, r.left.id), s.week, s.season);
      if (li) {
        // v1.3-1: §4.2/§4.3 怪我引退チェック
        if (li.retireType) {
          const retiredMsg = li.retireType === 'careerEnding' ? '壊滅的な怪我' : '怪我による引退';
          // v1.3-2: §4.3 壊滅的怪我による引退を careerHistory に記録
          let retiredF = { ...li.newFighter, careerHistory: [...(li.newFighter.careerHistory || []), { type: 'injury_retirement', week: s.week, season: s.season, detail: `${li.injuryInfo.injury.type}により引退` }] };
          retiredF = Engine.career.addEvent(retiredF, { type: 'retire', reason: li.retireType, season: s.season, week: s.week, age: li.newFighter.age });
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
      const ri = Engine.injury.check(injRngR, rc, r, injuryReduction, Engine.coach.getInjuryMult(s, r.right.id), s.week, s.season);
      if (ri) {
        // v1.3-1: §4.2/§4.3 怪我引退チェック
        if (ri.retireType) {
          const retiredMsg = ri.retireType === 'careerEnding' ? '壊滅的な怪我' : '怪我による引退';
          // v1.3-2: §4.3 壊滅的怪我による引退を careerHistory に記録
          let retiredF = { ...ri.newFighter, careerHistory: [...(ri.newFighter.careerHistory || []), { type: 'injury_retirement', week: s.week, season: s.season, detail: `${ri.injuryInfo.injury.type}により引退` }] };
          retiredF = Engine.career.addEvent(retiredF, { type: 'retire', reason: ri.retireType, season: s.season, week: s.week, age: ri.newFighter.age });
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

    // v1.3-2: §2 試合成長 — 怪我処理後、ロスターに残っている出場選手に成長を与える
    const matchGrowthRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 1732));
    results.forEach(r => {
      [
        { charId: r.left.id, won: r.winner === 'left' },
        { charId: r.right.id, won: r.winner === 'right' },
      ].forEach(({ charId, won }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter) return; // 怪我引退でロスター離脱済み

        // 対戦相手OVR取得（引退済みでも matchResult からOVRを算出）
        const oppId = charId === r.left.id ? r.right.id : r.left.id;
        const oppInRoster = roster.find(c => c.id === oppId);
        const oppRaw = charId === r.left.id ? r.right : r.left;
        const oppOvr = oppInRoster ? Engine.util.ov(oppInRoster) : Engine.util.ov(oppRaw);
        const selfOvr = Engine.util.ov(fighter);

        // §2.3 成長計算
        const matchGrowthBase = 1.5;
        const opponentBonus = Engine.util.clamp((oppOvr - selfOvr) / 15, -0.3, 0.8);
        const closeMatchBonus = r.mq >= 65 ? 0.5 : 0.0; // MQ65以上を接戦とみなす
        const resultBonus = won ? 0.0 : 0.2;
        let matchGrowth = matchGrowthBase + opponentBonus + closeMatchBonus + resultBonus;

        // §3.3 growthPenalty適用（適応力持ちは0.2軽減）
        if (fighter.growthPenalty) {
          const rawMult = fighter.growthPenalty.multiplier;
          matchGrowth *= (rawMult < 1.0 && Traits.has(fighter, '適応力')) ? Math.min(1.0, rawMult + 0.2) : rawMult;
        }

        // §2.5 成長ステータス選択（1〜2個）
        const allStats = ['pw', 'sp', 'te', 'st', 'mn'];
        const numStats = Engine.rng.float(matchGrowthRng) < 0.5 ? 1 : 2;
        const pool = [...allStats];
        const chosen = [];
        for (let i = 0; i < numStats; i++) {
          const idx = Engine.rng.int(matchGrowthRng, 0, pool.length - 1);
          chosen.push(pool.splice(idx, 1)[0]);
        }
        const growthPerStat = matchGrowth / numStats;

        roster = roster.map(c => {
          if (c.id !== charId) return c;
          let nc = { ...c, seasonGrowth: { ...(c.seasonGrowth || {pw:0,sp:0,te:0,st:0,mn:0}) } };
          chosen.forEach(stat => {
            const gain = Math.max(0, Math.round(growthPerStat));
            if (gain > 0) {
              nc[stat] = Math.min(100, nc[stat] + gain);
              nc.seasonGrowth[stat] = (nc.seasonGrowth[stat] || 0) + gain;
            }
          });
          return nc;
        });
      });
    });
    // §2.4 TODO: 調子連動（試合後の調子変動）— 調子システム実装時に有効化

    // v1.2: タイトルマッチ実施時に絶対週数を記録
    const executedTitleMatch = validMatches.some(m => m.isTitle);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    s = { ...s, roster, rivalries, titles, heatScore: newHeatScore, orgPop: popResult.orgPop, lastShowResults: results, lastTitleMatchWeek };

    // v2.0: trust 月次更新（興行参加/不参加・勝敗・MQ・連敗・自然変動）
    const trustResult = Engine.trust.applyShowTrust(s.roster, results, s.titles);
    s = { ...s, roster: trustResult.roster, lockerRoomMorale: Engine.trust.updateLockerRoomMorale(s, trustResult) };

    // v1.7: 育成補助金打ち切り通知
    if (state.orgPop < 40 && popResult.orgPop >= 40) {
      events.push('🏛️ 団体人気が40に到達！ 地域振興助成金の支給が終了しました。自立経営の始まりです！');
    }

    // v1.3-3: Build pending injury retirement presentation data
    const injuryRetirees = injuryResults.filter(ir => ir.retireType);
    if (injuryRetirees.length > 0) {
      const lineRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xFAD2));
      const pendingInjuryRetirements = injuryRetirees.map(ir => {
        const route = ir.retireType === 'careerEnding' ? 'injury_career_ending' : 'injury_wear';
        const retiredF = (s.retiredFighters || []).find(f => f.name === ir.name);
        if (!retiredF) return null;
        const { line, category } = Engine.retirement.selectLine(retiredF, route, state, lineRng);
        const summary = Engine.retirement.buildCareerSummary(retiredF);
        const wasChampion = state.titles?.world?.championId === retiredF.id;
        return { fighter: retiredF, route, line, category, summary, injuryType: ir.injury?.type, wasChampion };
      }).filter(Boolean);
      if (pendingInjuryRetirements.length > 0) {
        s = { ...s, _pendingInjuryRetirements: pendingInjuryRetirements };
      }
    }

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
  applyShowPopularity(roster, results, orgPop, rng) {
    if (results.length === 0) return { roster, orgPop, popDelta: 0 };
    const avgMQ = Math.round(results.reduce((s, r) => s + r.mq, 0) / results.length);
    // v1.5s26: orgPop帯別MQ閾値シフト（旧フラット+0.2ボーナスを廃止して置き換え）
    // 低orgPopほど閾値が下がり、同じMQでも上がりやすく・下落ペナルティも軽くなる
    const mqAdj = Engine.orgPop.getMQAdjust(orgPop);
    let rawDelta = avgMQ >= (80 + mqAdj.shift) ? 1.8
                 : avgMQ >= (65 + mqAdj.shift) ? 1.2
                 : avgMQ >= (55 + mqAdj.shift) ? 0.7
                 : avgMQ >= (45 + mqAdj.shift) ? 0.3
                 : avgMQ >= (35 + mqAdj.shift) ? -0.3
                 :                               -0.5;
    if (rawDelta < 0) rawDelta *= mqAdj.negMult;
    // v1.5: 施策A — orgPop逓減カーブ適用
    const popDelta = rng ? Engine.orgPop.applyOrgPopChange(rawDelta, orgPop, rng) : rawDelta;
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
          // 忠誠心: 引き抜き確率を×0.25に削減
          const effectivePoachChance = Traits.has(fighter, '忠誠心') ? cfg.poachChancePerFighter * 0.25 : cfg.poachChancePerFighter;
          higherOrgs.forEach(org => {
            if (Engine.rng.float(rng) < effectivePoachChance) {
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

      // §6.2 trainCap (training-spec §1.4 v1.2: factor×Pot)
      const trainCap = Engine.rival.generateTrainCap(rng, notion, pot);

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
      // v1.9c: dormantPool entries can be plain IDs or {id,age} objects — normalize to plain IDs
      const dormantIds = [...(state.dormantPool || [])]
        .map(e => typeof e === 'object' ? e.id : e)
        .filter(id => !occupiedIds.has(id));
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
          // v1.3-3: Build pending retirement presentation data
          const lineRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0xFADE));
          const pendingRetirements = retiredWithRecords.map(f => {
            const { line, category } = Engine.retirement.selectLine(f, 'season_end', s, lineRng);
            const summary = Engine.retirement.buildCareerSummary(f);
            return { fighter: f, route: 'season_end', line, category, summary };
          });
          s = { ...s, roster: surviving, retiredFighters: [...(s.retiredFighters || []), ...retiredWithRecords], pendingRetirements };
          retirees.forEach(c => events.push(`🏁 ${c.name}(${c.age}歳)が引退を表明`));
        }

        // AI season end processing (steps 1-5)
        const aiResult = Engine.rival.processSeasonEnd(rng, s);
        s = { ...s, aiOrgs: aiResult.aiOrgs };
        events.push(...aiResult.events);

        // v1.8: AI成長イベント通知（脅威/好機アラートを state に格納）
        const aiGrowthAlerts = [];
        RIVAL_ORGS.forEach(org => {
          const ge = aiResult.aiOrgs[org.id]?._lastSeasonGrowthEvents || [];
          ge.forEach(ev => {
            if (ev.type === 'breakthrough') {
              // S級 or 隣接ランク → 脅威
              const isThreat = org.tier === 'S';
              aiGrowthAlerts.push({ type: 'threat', org, fighter: ev.fighter, stat: ev.stat, gain: ev.gain, isMajor: isThreat });
            } else if (ev.type === 'slump' || ev.type === 'motivation_loss') {
              aiGrowthAlerts.push({ type: 'opportunity', org, fighter: ev.fighter, eventType: ev.type });
            }
          });
        });
        if (aiGrowthAlerts.length > 0) {
          s = { ...s, _pendingAIGrowthAlerts: aiGrowthAlerts };
        }

        // FA: 加齢 + 20歳超えで自動引退（プロ入りを諦めた）
        const agedFA = (s.freeAgents || []).map(f => ({ ...f, age: (f.age || 18) + 1 }));
        const agedOutFA = agedFA.filter(f => f.age > 20);
        const youngFA   = agedFA.filter(f => f.age <= 20);
        if (agedOutFA.length > 0) {
          const retiredFA = agedOutFA.map(f => Engine.career.addEvent(
            Engine.career.ensure(f),
            { type: 'retire', reason: 'fa_aged_out', season: s.season, age: f.age }
          ));
          s = { ...s, freeAgents: youngFA, retiredFighters: [...(s.retiredFighters || []), ...retiredFA] };
          agedOutFA.forEach(f => events.push(`💭 ${f.name}(${f.age}歳)がプロ入りの夢を諦めた`));
        } else {
          s = { ...s, freeAgents: youngFA };
        }

        // v1.5: orgPop 年次自然減衰 — orgPop帯に応じた可変減衰（施策B-1）
        s = { ...s, orgPop: Math.max(0, (s.orgPop || 0) - Engine.orgPop.calcAnnualDecay(s.orgPop || 0)) };

        // v2.0: オフシーズン trust 自然変動（興行なし期間: 各選手に自然減衰 + メンタル回復のみ適用）
        const offSeasonRoster = s.roster.map(f => {
          if (f.injury) return f;  // 怪我中は変動なし
          const natural = Engine.trust.calcMonthlyNatural(f.mn || 50);
          const newTrust = Engine.util.clamp((f.trust || 50) + natural, 0, 100);
          return newTrust !== (f.trust || 50) ? { ...f, trust: newTrust } : f;
        });
        s = { ...s, roster: offSeasonRoster };

        // v1.7: dormantPool 年次加齢 — pool内でも年は取る（永遠の若者バグ修正）
        const agedPool = (s.dormantPool || []).map(entry => {
          if (typeof entry === 'object' && entry.age !== undefined) {
            return { ...entry, age: entry.age + 1 };
          }
          return entry; // legacy string ID — age unknown, leave as-is
        });
        s = { ...s, dormantPool: agedPool };

        // v1.4: 年末表彰式データ生成（純粋関数 — HOF適用はApp側コールバックで行う）
        const awardsRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0xA5D0));
        const pendingAwards = Engine.awards.generate(awardsRng, s);
        s = { ...s, pendingAwards };

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
        // v2.1: クリア判定（年間1位かつ未クリア）
        if (pRankOld === 1 && !s.endingCleared) {
          s = { ...s, endingCleared: true, endingClearedSeason: s.season };
          events.push(`🏆 「${s.orgName}」が業界1位でシーズンを締めくくった！`);
        } else if (s.endingCleared && pRankOld === 1) {
          events.push(`🏆 シーズン${s.season}: 業界1位でフィニッシュ！`);
        }
        const archive = { season: oldSeason, rank: pRankOld, funds: s.funds, rosterSize: s.roster.length,
          orgPop: s.orgPop || 0, ...oldStats,
          rankings: oldRankings.map(r => ({ name: r.name, rating: r.rating, rank: r.rank })),
          awards: s.lastAwards || null }; // v1.4
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

        // v1.9c: dormantPool補充 — 有効エントリ数で判定して確実に補充
        // 修正: pool.length ではなく「22歳未満の有効エントリ数」で枯渇判定
        {
          const MIN_ELIGIBLE = 6;
          const currentPool = s.dormantPool || [];
          // 有効エントリ = 22歳未満（またはage不明）のエントリ
          const eligibleCount = currentPool.filter(e => {
            const age = typeof e === 'object' ? e.age : null;
            return age === null || age < 22;
          }).length;
          if (eligibleCount < MIN_ELIGIBLE) {
            const occupiedIds = new Set();
            (s.roster || []).forEach(c => occupiedIds.add(c.id));
            Object.values(s.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => occupiedIds.add(c.id)));
            (s.freeAgents || []).forEach(c => occupiedIds.add(c.id));
            currentPool.forEach(e => occupiedIds.add(typeof e === 'object' ? e.id : e));
            const available = ALL_CHARS.filter(c => !occupiedIds.has(c.id));
            if (available.length > 0) {
              const refillRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0xD00F));
              const needed = Math.min(available.length, MIN_ELIGIBLE - eligibleCount + 4);
              const shuffled = [...available].sort(() => Engine.rng.float(refillRng) - 0.5);
              const newEntries = shuffled.slice(0, needed).map(c => ({ id: c.id, age: 18 + Engine.rng.int(refillRng, 0, 2) }));
              s = { ...s, dormantPool: [...currentPool, ...newEntries] };
              events.push(`🌱 新世代${newEntries.length}名がプロ入りを目指してFA市場に参入`);
            }
          }
        }

        // v2.0: シーズン末にボーナス逓減カウンタをリセット
        s = { ...s, roster: Engine.careActions.resetSeasonalCounters(s.roster) };

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
      seasonInjuries: 0,   // v1.3-2: 今シーズンの怪我回数
      careerHistory: [],   // v1.3-2: 経歴記録 [{type,week,season,detail}]
      growthPenalty: null, // v1.3-2: 成長デバフ {remainingWeeks,multiplier,source} | null
      trust: 50,           // v2.0: 信頼度 0-100（隠しパラメータ）
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
        const age = 16 + Engine.rng.int(rng, 0, 5); // 16-20歳（21歳超引退設計に合わせて上限修正）
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
      const age = 16 + Engine.rng.int(rng, 0, 5); // 16-20歳（21歳超引退設計に合わせて上限修正）
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
      lastAwards: null,     // v1.4: last year-end awards result
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
      // v1.5s25b: マイルストーンイベント
      milestones: {},
      milestoneBuffs: [],
      // v2.0: ロッカールームの空気
      lockerRoomMorale: 60,
      // v2.0 Phase1-6: 大型イベント
      lastLargeEventWeek: 0,
      mediaSpotlight: null,
      // v2.1: エンディング / ゲームオーバー
      endingCleared: false,
      endingClearedSeason: null,
    };
    initState.rankings = Engine.ranking.updateRankings(initState);
    return initState;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// v1.5: orgPop Diminishing Returns & Pressure System — difficulty-rebalance-design-v1.0.md §2/§3
// ─────────────────────────────────────────────────────────────────────────────
Engine.orgPop = {
  // 施策A: 逓減カーブ — orgPopが高いほど上がりにくい
  getDiminishingMultiplier(orgPop) {
    if (orgPop < 20) return 1.0;   // 創設期: そのまま上がる
    if (orgPop < 40) return 0.70;  // 地方団体: やや鈍化（緩和）
    if (orgPop < 55) return 0.35;  // 中堅の壁: 大幅鈍化
    if (orgPop < 70) return 0.20;  // メジャーの壁
    if (orgPop < 85) return 0.12;  // トップ級
    return 0.08;                    // 覇権級: ほとんど上がらない
  },

  // 施策A: 逓減適用 — 正方向のみ逓減、小数のまま返す（v1.5s25: 確率的丸め廃止）
  applyOrgPopChange(rawDelta, orgPop, rng) {
    if (rawDelta > 0) {
      const mult = Engine.orgPop.getDiminishingMultiplier(orgPop);
      return rawDelta * mult;  // 小数のまま返す
    }
    // 下落には逓減を適用しない（高人気ほど落ちやすいまま）
    return rawDelta;
  },

  // 施策B-1: 年次減衰（orgPop帯に応じて増える）
  calcAnnualDecay(orgPop) {
    if (orgPop < 15) return 0;    // 創設期: 減衰なし（序盤保護）
    if (orgPop < 30) return 1;    // 弱小: 微減のみ
    if (orgPop < 50) return 3;    // 中堅
    if (orgPop < 70) return 5;    // メジャー: 維持が難しくなる
    if (orgPop < 85) return 7;    // トップ: かなり落ちる
    return 10;                     // 覇権: 激しく落ちる
  },

  // v1.5s26: orgPop帯別MQ閾値シフト — 低orgPopほどMQ閾値が下がり上がりやすく・下がりにくく
  getMQAdjust(orgPop) {
    if (orgPop < 20) return { shift: -10, negMult: 0.4 };   // 創設期: MQ閾値-10、ペナルティ×0.4
    if (orgPop < 30) return { shift: -7,  negMult: 0.5 };   // 地方団体（強化）: MQ閾値-7、ペナルティ×0.5
    if (orgPop < 45) return { shift: -3,  negMult: 0.85 };  // 中堅への橋渡し（新設）
    return { shift: 0, negMult: 1.0 };                       // 中堅以上: 現行通り
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: Ending / GameOver System — ending-gameover-spec-v1.0.md
// ─────────────────────────────────────────────────────────────────────────────
Engine.ending = {
  /** クリア演出用データを集計（純粋関数） */
  buildClearData(state) {
    const sh = state.seasonHistory || [];
    const allBestMQ  = [...sh.map(h => h.bestMQ  || 0), state.seasonStats?.bestMQ  || 0];
    const allOrgPop  = [...sh.map(h => h.peakPop || h.orgPop || 0), state.orgPop || 0];
    const allShows   = [...sh.map(h => h.showCount || 0), state.seasonStats?.showCount || 0];
    const sortedRoster = [...(state.roster || [])].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return {
      season:          state.endingClearedSeason || state.season,
      orgName:         state.orgName || '団体',
      playerRating:    Math.round(state.rankings?.find(r => r.orgId === 'player')?.rating || 0),
      peakOrgPop:      Math.max(...allOrgPop, 0),
      totalShows:      allShows.reduce((a, b) => a + b, 0),
      bestMQ:          Math.max(...allBestMQ, 0),
      hallOfFameCount: (state.hallOfFame || []).length,
      top3Fighters:    sortedRoster.slice(0, 3),
      coaches:         state.coaches || [],
    };
  },

  /** ゲームオーバー成績サマリーを集計（純粋関数） */
  buildGameOverSummary(state) {
    const sh = state.seasonHistory || [];
    const allRanks  = sh.map(h => h.rank).filter(r => r != null);
    const allFunds  = sh.map(h => h.peakFunds || h.funds || 0);
    const allPop    = sh.map(h => h.peakPop || h.orgPop || 0);
    const allShows  = sh.map(h => h.showCount || 0);
    const allBestMQ = sh.map(h => h.bestMQ || 0);
    const overallBestMQ  = Math.max(...allBestMQ, state.seasonStats?.bestMQ || 0, 0);
    const bestMQSeason   = sh.find(h => (h.bestMQ || 0) === overallBestMQ);
    const bestMQMatch    = bestMQSeason?.bestMQMatch || state.seasonStats?.bestMQMatch || '—';
    return {
      orgName:         state.orgName || '団体',
      season:          state.season,
      bestRank:        allRanks.length ? Math.min(...allRanks) : '—',
      peakFunds:       allFunds.length ? Math.max(...allFunds, 0) : 0,
      peakOrgPop:      allPop.length   ? Math.max(...allPop,   0) : 0,
      totalShows:      allShows.reduce((a, b) => a + b, 0) + (state.seasonStats?.showCount || 0),
      bestMQ:          overallBestMQ,
      bestMQMatch,
      hallOfFameCount: (state.hallOfFame || []).length,
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// v1.4: Awards System (年末表彰式) — ppv-awards-spec.md Part2
// ─────────────────────────────────────────────────────────────────────────────
Engine.awards = {
  /** Get org display name from state */
  _orgName(state, orgId) {
    if (orgId === 'player') return state.orgName || 'あなたの団体';
    const cfg = RIVAL_ORGS.find(o => o.id === orgId);
    return cfg ? cfg.name : orgId;
  },

  /**
   * 全表彰データを生成（純粋関数）
   * @param {Object} rng
   * @param {Object} state - offWeek 1 処理完了後の GameState
   * @returns {Object} pendingAwards データ
   */
  generate(rng, state) {
    return {
      season: state.season,
      rookieOfYear: Engine.awards.selectRookie(state),
      bestMatch:    Engine.awards.selectBestMatch(rng, state),
      mvp:          Engine.awards.selectMVP(rng, state),
      champions:    Engine.awards.getChampions(state),
      hallOfFame:   Engine.awards.checkHallOfFame(state)
    };
  },

  /** ① 新人王: 全団体の careerSeasons===1 から OVR 最高 */
  selectRookie(state) {
    const ov = Engine.util.ov;
    const candidates = [];
    state.roster.forEach(f => {
      if (f.careerSeasons === 1)
        candidates.push({ fighter: f, orgId: 'player', orgName: Engine.awards._orgName(state, 'player') });
    });
    if (state.aiOrgs) {
      Object.keys(state.aiOrgs).forEach(orgId => {
        const orgData = state.aiOrgs[orgId];
        if (!orgData || !orgData.roster) return;
        orgData.roster.forEach(f => {
          if (f.careerSeasons === 1)
            candidates.push({ fighter: f, orgId, orgName: Engine.awards._orgName(state, orgId) });
        });
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => ov(b.fighter) - ov(a.fighter));
    const best = candidates[0];
    return {
      id: best.fighter.id, name: best.fighter.name, portrait: best.fighter.portrait,
      orgName: best.orgName, ovr: ov(best.fighter), age: best.fighter.age,
      style: best.fighter.style || 'Allround',
      isPlayerOrg: best.orgId === 'player'
    };
  },

  /** ② ベストマッチ: プレイヤー=実データ, AI=生成MQ → 最高の1試合 */
  selectBestMatch(rng, state) {
    const ov = Engine.util.ov;
    const candidates = [];
    const playerMQ = (state.seasonStats && state.seasonStats.bestMQ) || 0;
    if (playerMQ > 0) {
      const matchStr = (state.seasonStats && state.seasonStats.bestMQMatch) || '';
      const parts = matchStr.split(' vs ');
      const findF = name => (state.roster || []).find(f => f.name === name) ||
                            (state.retiredFighters || []).find(f => f.name === name);
      const f1 = findF(parts[0]);
      const f2 = findF(parts[1]);
      candidates.push({
        fighter1: { id: f1 ? f1.id : null, name: parts[0] || '???', ovr: f1 ? ov(f1) : 0, style: f1 ? (f1.style || 'Allround') : 'Allround' },
        fighter2: { id: f2 ? f2.id : null, name: parts[1] || '???', ovr: f2 ? ov(f2) : 0, style: f2 ? (f2.style || 'Allround') : 'Allround' },
        orgName: Engine.awards._orgName(state, 'player'), mq: playerMQ, isPlayerOrg: true
      });
    }
    if (state.aiOrgs) {
      Object.keys(state.aiOrgs).forEach(orgId => {
        const orgData = state.aiOrgs[orgId];
        if (!orgData || !orgData.roster || orgData.roster.length < 2) return;
        const sorted = [...orgData.roster].sort((a, b) => ov(b) - ov(a));
        const topAvg = (ov(sorted[0]) + ov(sorted[1])) / 2;
        const cfg = RIVAL_ORGS.find(o => o.id === orgId);
        const tierBase = { S: 75, A: 65, B: 55 }[(cfg && cfg.tier)] || 55;
        const mq = Engine.util.clamp(
          Math.round(topAvg * 0.6 + tierBase * 0.4 + Engine.rng.int(rng, -10, 10)), 30, 98
        );
        candidates.push({
          fighter1: { id: sorted[0].id, name: sorted[0].name, ovr: ov(sorted[0]), style: sorted[0].style || 'Allround' },
          fighter2: { id: sorted[1].id, name: sorted[1].name, ovr: ov(sorted[1]), style: sorted[1].style || 'Allround' },
          orgName: Engine.awards._orgName(state, orgId), mq, isPlayerOrg: false
        });
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.mq - a.mq);
    return candidates[0];
  },

  /** ③ MVP: 各団体エース1名 → MVPスコア比較 (±15 random) */
  selectMVP(rng, state) {
    const ov = Engine.util.ov;
    const champId = state.titles && state.titles.world && state.titles.world.championId;
    const candidates = [];
    if (state.roster.length > 0) {
      const sorted = [...state.roster].sort((a, b) => {
        const sa = ov(a) + a.popularity * 0.5 + (a.id === champId ? 20 : 0);
        const sb = ov(b) + b.popularity * 0.5 + (b.id === champId ? 20 : 0);
        return sb - sa;
      });
      const ace = sorted[0];
      const score = ov(ace) + ace.popularity * 0.5 + (ace.id === champId ? 20 : 0) + Engine.rng.int(rng, -15, 15);
      candidates.push({ fighter: ace, orgId: 'player', orgName: Engine.awards._orgName(state, 'player'), score, isPlayerOrg: true });
    }
    if (state.aiOrgs) {
      Object.keys(state.aiOrgs).forEach(orgId => {
        const orgData = state.aiOrgs[orgId];
        if (!orgData || !orgData.roster || orgData.roster.length === 0) return;
        const sorted = [...orgData.roster].sort((a, b) =>
          (ov(b) + b.popularity * 0.5) - (ov(a) + a.popularity * 0.5)
        );
        const ace = sorted[0];
        const score = ov(ace) + ace.popularity * 0.5 + Engine.rng.int(rng, -15, 15);
        candidates.push({ fighter: ace, orgId, orgName: Engine.awards._orgName(state, orgId), score, isPlayerOrg: false });
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0];
    return {
      id: winner.fighter.id, name: winner.fighter.name, portrait: winner.fighter.portrait,
      orgName: winner.orgName, ovr: ov(winner.fighter), popularity: winner.fighter.popularity,
      age: winner.fighter.age, style: winner.fighter.style || 'Allround',
      isPlayerOrg: winner.isPlayerOrg
    };
  },

  /** ④ チャンピオン紹介: プレイヤー=実データ(防衛あり), AI=エース名のみ → 上位3団体のみ */
  getChampions(state) {
    const ov = Engine.util.ov;
    const champions = [];
    const rankings = state.rankings || [];
    const sortedRankings = rankings.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99));
    const top3OrgIds = new Set(sortedRankings.slice(0, 3).map(r => r.orgId));
    const getRankNum = orgId => { const r = rankings.find(x => x.orgId === orgId); return r ? (r.rank || 99) : 99; };
    // Player org (only if in top 3)
    if (state.titleEstablished && top3OrgIds.has('player')) {
      const champId = state.titles && state.titles.world && state.titles.world.championId;
      if (champId) {
        const champ = state.roster.find(f => f.id === champId);
        if (champ) {
          champions.push({
            id: champ.id, name: champ.name, portrait: champ.portrait,
            orgName: state.orgName || 'あなたの団体',
            ovr: ov(champ), popularity: champ.popularity || 0, style: champ.style || 'Allround',
            defenses: state.titles.world.defenses || 0, isPlayer: true, rank: getRankNum('player')
          });
        }
      }
    }
    // AI orgs: エースを王者として表示（上位3団体のみ）
    if (state.aiOrgs) {
      Object.keys(state.aiOrgs).forEach(orgId => {
        if (!top3OrgIds.has(orgId)) return;
        const orgData = state.aiOrgs[orgId];
        if (!orgData || !orgData.roster || orgData.roster.length === 0) return;
        const sorted = [...orgData.roster].sort((a, b) => ov(b) - ov(a));
        const ace = sorted[0];
        champions.push({
          id: ace.id, name: ace.name, portrait: ace.portrait,
          orgName: Engine.awards._orgName(state, orgId),
          ovr: ov(ace), popularity: ace.popularity || 0, style: ace.style || 'Allround',
          defenses: null, isPlayer: false, rank: getRankNum(orgId)
        });
      });
    }
    champions.sort((a, b) => a.rank - b.rank);
    return champions;
  },

  /** ⑤ 殿堂入り判定: retiredFighters から条件合致者 */
  checkHallOfFame(state) {
    return (state.retiredFighters || [])
      .filter(f => {
        const rec = f.careerRecord;
        if (!rec) return false;
        return (rec.totalTitleWins || 0) + (rec.totalDefenses || 0) >= 13;
      })
      .map(f => {
        const rec = f.careerRecord || {};
        const hist = rec.history || [];
        const debut = hist.find(e => e.type === 'debut');
        const retire = hist.find(e => e.type === 'retire');
        return {
          id: f.id, name: f.name, portrait: f.portrait,
          orgName: state.orgName || 'あなたの団体',
          style: f.style || 'Allround',
          activeSeasonsStart: debut ? debut.season : 1,
          activeSeasonsEnd: retire ? retire.season : state.season,
          activeYears: `S${debut ? debut.season : 1}〜S${retire ? retire.season : state.season}`,
          titleReigns: rec.totalTitleWins || 0, totalDefenses: rec.totalDefenses || 0,
          peakOVR: rec.peakOVR || 0, peakOVRSeason: rec.peakOVRSeason || 0,
          inductionSeason: state.season
        };
      });
  },

  /**
   * 殿堂入り確定処理: retiredFighters → hallOfFame 移動
   * @param {Object} state
   * @param {Array} inductees - checkHallOfFame の結果
   * @returns {Object} 新しい state
   */
  applyHallOfFame(state, inductees) {
    const newHallOfFame = [...(state.hallOfFame || []), ...inductees];
    return { ...state, hallOfFame: newHallOfFame, retiredFighters: [] };
  }
};

// ══════════════════════════════════════════════════════════
//  Engine.news — 世界観演出ニュースシステム (v1.4w)
//  Pure functions only — no DOM references
// ══════════════════════════════════════════════════════════
Engine.news = {

  /** ティッカーニュース生成（毎週 manage画面に表示） */
  generateTicker(rng, state) {
    const items = [];
    const ov = Engine.util.ov;
    const orgName = id => Engine.awards ? Engine.awards._orgName(state, id) : id;

    // AI団体の興行結果（興行週なら）
    if (Engine.util.isShowWeek(state.week)) {
      if (state.aiOrgs) {
        Object.keys(state.aiOrgs).forEach(orgId => {
          const org = RIVAL_ORGS.find(o => o.id === orgId);
          if (!org) return;
          if (Engine.rng.float(rng) < 0.4) {
            items.push({ cat: 'aiShow', data: { org: org.name } });
          }
        });
      }
    }

    // 好成績・不振（自団体ロスターの勝敗比率から生成）
    (state.roster || []).forEach(f => {
      const wins = f.wins || 0; const losses = f.losses || 0;
      const total = wins + losses;
      if (total >= 4 && wins >= total * 0.75) {
        items.push({ cat: 'winStreak', data: { name: f.name, count: wins } });
      }
      if (total >= 3 && losses >= total * 0.7) {
        items.push({ cat: 'loseStreak', data: { name: f.name, count: losses } });
      }
    });

    // AI団体の選手ピックアップ（連勝的フレーバー）
    if (state.aiOrgs) {
      Object.keys(state.aiOrgs).forEach(orgId => {
        const org = RIVAL_ORGS.find(o => o.id === orgId);
        if (!org || !state.aiOrgs[orgId].roster) return;
        const top = [...state.aiOrgs[orgId].roster].sort((a, b) => ov(b) - ov(a));
        if (top.length > 0 && Engine.rng.float(rng) < 0.25) {
          const f = top[0];
          items.push({ cat: 'winStreak', data: { name: f.name, count: Engine.rng.int(rng, 4, 8) } });
        }
      });
    }

    // フレーバー（ランダム全団体選手）
    const allFighters = [...(state.roster || [])];
    if (state.aiOrgs) {
      Object.values(state.aiOrgs).forEach(o => { if (o.roster) allFighters.push(...o.roster); });
    }
    if (allFighters.length >= 2 && Engine.rng.float(rng) < 0.5) {
      const f1 = Engine.rng.pick(rng, allFighters);
      const f2 = Engine.rng.pick(rng, allFighters.filter(f => f.id !== f1.id));
      items.push({ cat: 'flavor', data: { name: f1.name, name2: f2 ? f2.name : '???' } });
    }

    // AI団体の負傷情報
    if (state.aiOrgs) {
      Object.keys(state.aiOrgs).forEach(orgId => {
        const org = RIVAL_ORGS.find(o => o.id === orgId);
        if (!org) return;
        const roster = state.aiOrgs[orgId].roster || [];
        if (roster.length > 0 && Engine.rng.float(rng) < 0.15) {
          const f = Engine.rng.pick(rng, roster);
          items.push({ cat: 'injury', data: { org: org.name, name: f.name } });
        }
      });
    }

    // スカウト動向
    if (Engine.rng.float(rng) < 0.12) {
      items.push({ cat: 'scout', data: {} });
    }

    // 経済
    if (state.aiOrgs) {
      const orgIds = Object.keys(state.aiOrgs);
      if (orgIds.length > 0 && Engine.rng.float(rng) < 0.15) {
        const orgId = Engine.rng.pick(rng, orgIds);
        const org = RIVAL_ORGS.find(o => o.id === orgId);
        if (org) items.push({ cat: 'economy', data: { org: org.name } });
      }
    }

    // 一般
    if (Engine.rng.float(rng) < 0.2) {
      items.push({ cat: 'general', data: {} });
    }

    // テンプレート適用して3〜5件選出
    const resolved = items.map(item => {
      const templates = NEWS_TICKER_TEMPLATES[item.cat];
      if (!templates || templates.length === 0) return null;
      let text = Engine.rng.pick(rng, templates);
      Object.keys(item.data).forEach(k => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), item.data[k]);
      });
      return text;
    }).filter(Boolean);

    // シャッフルして3〜5件
    const shuffled = [...resolved];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Engine.rng.int(rng, 0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const count = Math.min(shuffled.length, Engine.rng.int(rng, 3, 5));
    return shuffled.slice(0, count);
  },

  /** 新聞パネル記事生成（イベント配列から Article[] を生成） */
  generateHeadlines(rng, events) {
    return events.map(ev => {
      const templates = NEWS_HEADLINE_TEMPLATES[ev.type];
      if (!templates || templates.length === 0) return null;
      const tmpl = Engine.rng.pick(rng, templates);
      let headline = tmpl.headline;
      let body = tmpl.body;
      const data = ev.data || {};
      Object.keys(data).forEach(k => {
        headline = headline.replace(new RegExp(`\\{${k}\\}`, 'g'), data[k]);
        body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), data[k]);
      });
      return {
        headline,
        body,
        characterId: ev.characterId || null,
        type: ev.type
      };
    }).filter(Boolean);
  },

  /** 防衛回数マイルストーン判定 */
  checkDefenseMilestone(defenses) {
    if (defenses === 15) return 15;
    if (defenses === 10) return 10;
    if (defenses === 5) return 5;
    return 0;
  }
};

// ══════════════════════════════════════════════════════════
//  Engine.growthEvents — 成長イベントシステム (v1.8)
//  §2 ブレークスルー / §3 絶好調 / §4 スランプ / §5 モチベ喪失
//  Pure functions only — no DOM references
// ══════════════════════════════════════════════════════════
Engine.growthEvents = {

  // ─── §2 ブレークスルー ────────────────────────────────

  /** §2.3 ブレークスルー確率計算（0〜3.5%を返す、判定は呼び出し側） */
  calcBreakthroughProb(fighter, mq, oppOvr, isTitle, won) {
    const selfOvr = Engine.util.ov(fighter);
    const ovrDiff = oppOvr - selfOvr;
    let prob = 0;
    if (ovrDiff >= 20) prob += 1.2;
    else if (ovrDiff >= 10) prob += 0.8;
    const prevBest = fighter.careerBestMQ || 0;
    if (mq > prevBest) prob += 1.0;
    if (isTitle) prob += 0.5;
    // 野心: タイトルマッチでのブレークスルー確率+0.5%（チャンピオンへの野望が成長を後押し）
    if (isTitle && Traits.has(fighter, '野心')) prob += 0.5;
    if (mq >= 70) prob += 0.5;
    if (!won) prob += 0.3;
    if ((fighter.age || 20) <= 25) prob += 0.3;
    return Math.min(prob, 3.5) / 100;
  },

  /** §2 ブレークスルー判定・効果適用（純粋関数）
   * @returns {{ fighter, stat, gain, hotStreak }} or null */
  checkAndApplyBreakthrough(rng, fighter, mq, oppOvr, isTitle, won, season, week) {
    // スランプ/モチベ喪失中はブレークスルー判定なし
    if (fighter.slump || fighter.motivationLoss) return null;
    const prob = Engine.growthEvents.calcBreakthroughProb(fighter, mq, oppOvr, isTitle, won);
    if (prob <= 0 || Engine.rng.float(rng) >= prob) return null;

    // §2.4 ジャンプ量 +3〜6、5ステ均等
    const gain = Engine.rng.int(rng, 3, 6);
    const stats = ['pw', 'sp', 'te', 'st', 'mn'];
    const stat = stats[Engine.rng.int(rng, 0, 4)];
    const cap = fighter.trainCap ? (fighter.trainCap[stat] || 100) : 100;
    const actualGain = Math.round(Math.min(gain, cap - (fighter[stat] || 0)) * 10) / 10;
    if (actualGain <= 0) return null;

    // §2.5 絶好調連鎖 15%
    let hotStreak = null;
    if (Engine.rng.float(rng) < 0.15) {
      hotStreak = { remainingWeeks: Engine.rng.int(rng, 8, 16), ovrBuff: 2 };
    }

    let nf = { ...fighter };
    nf[stat] = (nf[stat] || 0) + actualGain;
    nf.careerBestMQ = Math.max(nf.careerBestMQ || 0, mq);
    if (hotStreak) nf.hotStreak = hotStreak;
    nf.careerRecord = { ...(nf.careerRecord || {}),
      history: [...((nf.careerRecord || {}).history || []),
        { type: 'breakthrough', season, week, stat, gain: actualGain }]
    };
    nf.careerHistory = [...(nf.careerHistory || []),
      { type: 'breakthrough', season, week, detail: `${stat.toUpperCase()} +${actualGain} のブレークスルー！` }
    ];
    return { fighter: nf, stat, gain: actualGain, hotStreak };
  },

  // ─── §3 絶好調 ────────────────────────────────────────

  /** §3.7 絶好調カウントダウン（毎週）。重傷時は即終了。
   * @returns {{ fighter, ended: bool }} */
  tickHotStreak(fighter, hadSevereInjury) {
    if (!fighter.hotStreak) return { fighter, ended: false };
    if (hadSevereInjury) return { fighter: { ...fighter, hotStreak: null }, ended: true };
    const hs = { ...fighter.hotStreak, remainingWeeks: fighter.hotStreak.remainingWeeks - 1 };
    if (hs.remainingWeeks <= 0) return { fighter: { ...fighter, hotStreak: null }, ended: true };
    return { fighter: { ...fighter, hotStreak: hs }, ended: false };
  },

  // ─── §4 スランプ ──────────────────────────────────────

  /** §4.2 スランプ発生判定
   * trigger: 'injury_moderate_recovery' | 'injury_severe_recovery' | 'defeat' | 'penalty_end' */
  checkSlump(rng, fighter, trigger) {
    if (fighter.hotStreak || fighter.slump || fighter.motivationLoss) return false;
    const probTable = {
      injury_moderate_recovery: 0.03,
      injury_severe_recovery:   0.05,
      defeat:                   0.008,
      penalty_end:              0.02,
    };
    const prob = probTable[trigger] || 0;
    return prob > 0 && Engine.rng.float(rng) < prob;
  },

  /** §4 スランプ開始 */
  applySlump(fighter, trigger, season, week) {
    let nf = { ...fighter, slump: { recoveryMomentum: 0, weeksSinceStart: 0, ovrDebuff: -1 } };
    nf.careerHistory = [...(nf.careerHistory || []),
      { type: 'slump_start', season, week, detail: `スランプ突入（${trigger}）` }
    ];
    return nf;
  },

  /** §4.4 スランプ毎週処理（時間経過 momentum +0.3 + 回復判定）
   * @returns {{ fighter, recovered: bool, duration?: number }} */
  tickSlumpPassive(fighter, rng, season, week) {
    if (!fighter.slump) return { fighter, recovered: false };
    let slump = { ...fighter.slump,
      weeksSinceStart: (fighter.slump.weeksSinceStart || 0) + 1,
      recoveryMomentum: (fighter.slump.recoveryMomentum || 0) + 0.3
    };
    const recoveryProb = (2 + slump.recoveryMomentum) / 100;
    if (Engine.rng.float(rng) < recoveryProb) {
      const duration = slump.weeksSinceStart;
      let nf = { ...fighter, slump: null };
      nf.careerHistory = [...(nf.careerHistory || []),
        { type: 'slump_end', season, week, detail: `スランプ脱出（${duration}週間）` }
      ];
      return { fighter: nf, recovered: true, duration };
    }
    return { fighter: { ...fighter, slump }, recovered: false };
  },

  /** §4.4 スランプ momentum 更新（試合後） */
  updateSlumpMomentumAfterMatch(fighter, mq, won, rng) {
    if (!fighter.slump) return fighter;
    let slump = { ...fighter.slump,
      recoveryMomentum: (fighter.slump.recoveryMomentum || 0) + 0.5
    };
    if (mq >= 80) slump.recoveryMomentum += 2.5;
    else if (mq >= 65) slump.recoveryMomentum += 1.5;
    if (!won && Engine.rng.float(rng) < 0.08) slump.recoveryMomentum = 0;
    return { ...fighter, slump };
  },

  // ─── §5 モチベ喪失 ────────────────────────────────────

  /** §5.2 モチベ喪失発生判定
   * trigger: 'weekly' | 'defeat' */
  checkMotivationLoss(rng, fighter, trigger) {
    if (!fighter.slump) return false;
    const probTable = { weekly: 0.015, defeat: 0.025 };
    const prob = probTable[trigger] || 0;
    return prob > 0 && Engine.rng.float(rng) < prob;
  },

  /** §5 モチベ喪失開始（スランプを解除して上書き） */
  applyMotivationLoss(fighter, season, week) {
    let nf = { ...fighter, slump: null,
      motivationLoss: { recoveryMomentum: 0, weeksSinceStart: 0, ovrDebuff: -2 } };
    nf.careerHistory = [...(nf.careerHistory || []),
      { type: 'motivation_loss_start', season, week, detail: 'モチベーション喪失' }
    ];
    return nf;
  },

  /** §5.4 モチベ喪失毎週処理（+0.15 momentum + 回復判定 + 自主引退判定）
   * @returns {{ fighter, recovered: bool, selfRetire: bool, duration?: number }} */
  tickMotivationLossPassive(fighter, rng, season, week) {
    if (!fighter.motivationLoss) return { fighter, recovered: false, selfRetire: false };
    let ml = { ...fighter.motivationLoss,
      weeksSinceStart: (fighter.motivationLoss.weeksSinceStart || 0) + 1,
      recoveryMomentum: (fighter.motivationLoss.recoveryMomentum || 0) + 0.15
    };
    // §5.5 自主引退判定（24週超え → 2%/週）
    if (ml.weeksSinceStart > 24 && Engine.rng.float(rng) < 0.02) {
      return { fighter: { ...fighter, motivationLoss: ml }, recovered: false, selfRetire: true };
    }
    // 回復判定（基礎1%）
    const recoveryProb = (1 + ml.recoveryMomentum) / 100;
    if (Engine.rng.float(rng) < recoveryProb) {
      const duration = ml.weeksSinceStart;
      let nf = { ...fighter, motivationLoss: null };
      nf.careerHistory = [...(nf.careerHistory || []),
        { type: 'motivation_loss_end', season, week, detail: `再起（${duration}週間）` }
      ];
      return { fighter: nf, recovered: true, selfRetire: false, duration };
    }
    return { fighter: { ...fighter, motivationLoss: ml }, recovered: false, selfRetire: false };
  },

  /** §5.4 モチベ喪失 momentum 更新（試合後） */
  updateMotivationLossMomentumAfterMatch(fighter, mq, won, rng) {
    if (!fighter.motivationLoss) return fighter;
    let ml = { ...fighter.motivationLoss,
      recoveryMomentum: (fighter.motivationLoss.recoveryMomentum || 0) + 0.25
    };
    if (mq >= 80) ml.recoveryMomentum += 1.5;
    else if (mq >= 65) ml.recoveryMomentum += 0.8;
    if (!won && Engine.rng.float(rng) < 0.12) ml.recoveryMomentum = 0;
    return { ...fighter, motivationLoss: ml };
  },

  /** §4.3/§5.3 能力微減（スランプ/モチベ喪失中の選手に毎週） */
  applyWeeklyStatDecay(rng, fighter) {
    if (!fighter.slump && !fighter.motivationLoss) return fighter;
    const isMot = !!fighter.motivationLoss;
    const decayMin = isMot ? 0.3 : 0.2;
    const decayMax = isMot ? 0.8 : 0.5;
    const floorRatio = isMot ? 0.65 : 0.70;
    const stats = ['pw', 'sp', 'te', 'st', 'mn'];
    const targetStat = Engine.rng.pick(rng, stats);
    const decay = decayMin + Engine.rng.float(rng) * (decayMax - decayMin);
    const notion = fighter.notionValue ||
      { pw: fighter.pw, sp: fighter.sp, te: fighter.te, st: fighter.st, mn: fighter.mn };
    const floor = Math.round((notion[targetStat] || 30) * floorRatio);
    let nf = { ...fighter };
    nf[targetStat] = Math.max(floor, Math.round((nf[targetStat] || 30) - decay));
    return nf;
  },

  // ─── §9 AI団体成長イベント ────────────────────────────

  /** §9 AI団体シーズン末一括判定
   * @returns {{ fighters: Array, aiGrowthEvents: Array }} */
  aiSeasonGrowthEvents(rng, fighters, org) {
    const tier = org.tier || 'B';
    const btProb    = tier === 'S' ? 0.08 : tier === 'A' ? 0.06 : 0.04;
    const slumpProb = 0.05;
    const motivProb = 0.01;
    const aiGrowthEvents = [];

    const newFighters = fighters.map(f => {
      let nf = { ...f };
      // スランプ / モチベ喪失（排他: モチベ優先）
      if (Engine.rng.float(rng) < motivProb) {
        // モチベ喪失: 成長量0 + 能力微減
        const stats = ['pw', 'sp', 'te', 'st'];
        const stat = Engine.rng.pick(rng, stats);
        const decay = Engine.rng.int(rng, 2, 4);
        nf[stat] = Math.max(1, (nf[stat] || 30) - decay);
        nf._aiGrowthBlock = true; // 成長ゼロ
        aiGrowthEvents.push({ type: 'motivation_loss', org, fighter: f });
      } else if (Engine.rng.float(rng) < slumpProb) {
        nf._aiGrowthHalf = true;  // 成長50%カット
        aiGrowthEvents.push({ type: 'slump', org, fighter: f });
      }
      // ブレークスルー（モチベ喪失中は発生しない）
      if (!nf._aiGrowthBlock && Engine.rng.float(rng) < btProb) {
        const stats = ['pw', 'sp', 'te', 'st'];
        const stat = Engine.rng.pick(rng, stats);
        const gain = Engine.rng.int(rng, 3, 6);
        const cap = nf.trainCap ? (nf.trainCap[stat] || 100) : 100;
        const actualGain = Math.round(Math.min(gain, cap - (nf[stat] || 0)) * 10) / 10;
        if (actualGain > 0) {
          nf[stat] = (nf[stat] || 0) + actualGain;
          aiGrowthEvents.push({ type: 'breakthrough', org, fighter: f, stat, gain: actualGain });
        }
      }
      return nf;
    });

    return { fighters: newFighters, aiGrowthEvents };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: Trust System (event-system-spec-v2.md §1 + §5)
// ─────────────────────────────────────────────────────────────────────────────
Engine.trust = {
  // ── §1-5: メンタル係数の適用 ──────────────────────────────────────────────
  // 上昇: 低メンタルほど増幅。係数: delta × (1.0 + (100-mn)/200)
  // 下降: 高メンタルほど緩和。係数: delta × (1.0 - mn/200)
  applyCoeff(delta, mental) {
    const mn = Engine.util.clamp(mental || 50, 1, 100);
    if (delta > 0) return delta * (1.0 + (100 - mn) / 200);
    return delta * (1.0 - mn / 200);
  },

  // ── §1-4自然変動: -1/月 + mental/50 の回復 ────────────────────────────────
  // Mental 100 → +1/月、Mental 50 → ±0/月、Mental 25 → -0.5（切り捨てで 0）
  calcMonthlyNatural(mental) {
    return -1 + Math.floor((mental || 50) / 50);
  },

  // ── §1-6: 特性による行動分岐 ─────────────────────────────────────────────
  // 熱血・生意気系（直接行動型）: 闘志, 負けず嫌い, 野心, 破天荒
  // クール・内向系（沈黙型）: 上記なし → N5通知のみ
  isDirectType(fighter) {
    const traits = fighter.traits || [];
    return traits.some(t => ['闘志', '負けず嫌い', '野心', '破天荒'].includes(t));
  },

  // ── §1-3/1-4: 興行後の trust 月次更新 ───────────────────────────────────
  // 参加した選手: 勝敗 + MQボーナス + タイトルボーナス + 連敗ペナルティ + 自然変動
  // 参加しなかった選手（怪我除く）: -8 + 自然変動
  applyShowTrust(roster, results, titles) {
    if (results.length === 0) return { roster, changes: [] };

    // 出場選手IDセット
    const participated = new Set();
    results.forEach(r => { participated.add(r.left.id); participated.add(r.right.id); });

    // タイトルマッチ出場選手IDセット
    const titleFighters = new Set();
    results.filter(r => r.isTitle).forEach(r => {
      titleFighters.add(r.left.id); titleFighters.add(r.right.id);
    });

    const changes = [];
    const newRoster = roster.map(fighter => {
      // 怪我中は変動なし
      if (fighter.injury) return fighter;

      const mental = fighter.mn || 50;
      let delta = 0;

      if (participated.has(fighter.id)) {
        // 出場した場合
        const match = results.find(r => r.left.id === fighter.id || r.right.id === fighter.id);
        if (match) {
          const won = (match.left.id === fighter.id && match.winner === 'left') ||
                      (match.right.id === fighter.id && match.winner === 'right');
          const isDraw = match.winner === 'draw';
          const mq = match.mq || 0;

          // §1-3: 勝利+3 / 敗北+1
          if (won)      delta += Engine.trust.applyCoeff(3, mental);
          else if (!isDraw) delta += Engine.trust.applyCoeff(1, mental);
          else          delta += Engine.trust.applyCoeff(1, mental);  // 引き分けも+1

          // §1-3: 好試合（MQ70+）追加+2
          if (mq >= 70) delta += Engine.trust.applyCoeff(2, mental);

          // §1-3: タイトルマッチ+5
          if (titleFighters.has(fighter.id)) delta += Engine.trust.applyCoeff(5, mental);

          // §1-4: 連敗ペナルティ（2連敗以降）— losingStreak はこの時点で更新済み
          const streak = fighter.losingStreak || 0;
          if (!won && !isDraw && streak >= 2) delta += Engine.trust.applyCoeff(-3, mental);
        }
      } else {
        // §1-4: 興行に出場できなかった月 -8
        delta += Engine.trust.applyCoeff(-8, mental);
      }

      // §1-3/1-4: 月次自然変動（-1/月 + mental/50 回復）
      delta += Engine.trust.calcMonthlyNatural(mental);

      const oldTrust = fighter.trust != null ? fighter.trust : 50;
      const newTrust = Engine.util.clamp(Math.round(oldTrust + delta), 0, 100);
      if (newTrust !== oldTrust) {
        changes.push({ id: fighter.id, name: fighter.name, from: oldTrust, to: newTrust, delta: Math.round(delta) });
      }
      return { ...fighter, trust: newTrust };
    });

    return { roster: newRoster, changes };
  },

  // ── §5: ロッカールームの空気 更新 ────────────────────────────────────────
  // 上昇: 興行成功（avgMQ高）+3 / 下降: trust<25の選手 -2/月
  updateLockerRoomMorale(state, trustResult) {
    const current = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    let delta = 0;

    // 興行成功ボーナス（avgMQ 65+ で+3）
    const results = state.lastShowResults || [];
    if (results.length > 0) {
      const avgMQ = results.reduce((s, r) => s + r.mq, 0) / results.length;
      if (avgMQ >= 65) delta += 3;
    }

    // trust < 25 の選手が多いほど空気が悪化（-2/名）
    const lowTrustCount = (trustResult.roster || []).filter(f => (f.trust || 50) < 25).length;
    delta -= lowTrustCount * 2;

    // 人望: 在籍中の間だけロッカールーム士気に+3ボーナス
    const hasNinbo = (trustResult.roster || []).some(f => Traits.has(f, '人望') && !f.injury);
    if (hasNinbo) delta += 3;

    return Engine.util.clamp(Math.round(current + delta), 0, 100);
  },

  // ── 信頼度帯の判定 ───────────────────────────────────────────────────────
  getTrustBand(trust) {
    const t = trust != null ? trust : 50;
    if (t >= 70) return 'high';
    if (t >= 40) return 'normal';
    if (t >= 25) return 'low';
    return 'critical';
  },

  // ── 直訴型イベント発火条件 ────────────────────────────────────────────────
  // trust < 40 の選手のうち、今週イベント発火対象になりうる選手を返す
  getEventCandidates(roster, rng) {
    return roster.filter(f => {
      if (f.injury) return false;
      const trust = f.trust != null ? f.trust : 50;
      return trust < 40;
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: Care Actions (event-system-spec-v2.md §2)
// ─────────────────────────────────────────────────────────────────────────────
Engine.careActions = {
  // アクション定義参照
  getConfig(actionId) {
    return typeof CARE_ACTIONS !== 'undefined' ? (CARE_ACTIONS[actionId] || null) : null;
  },

  // ── ボーナス逓減チェック ───────────────────────────────────────────────────
  // 同一選手へ連続でボーナスを支給した場合、効果が逓減する
  getBonusRepeatCount(fighter) {
    return fighter._bonusRepeat || 0;
  },

  // ── アクション実行（純粋関数） ─────────────────────────────────────────────
  // 返り値: { roster, state, funds, events, reactionKey, reactionFighterId }
  execute(actionId, fighterId, state) {
    const cfg = Engine.careActions.getConfig(actionId);
    if (!cfg) return null;
    if ((state.funds || 0) < cfg.cost) return { error: 'funds_insufficient' };

    let roster = [...state.roster];
    let lockerRoomMorale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    const events = [];
    let reactionKey = actionId;
    let reactionFighterId = fighterId;

    const applyTrust = (fighter, delta) => {
      const mental = fighter.mn || 50;
      const adjusted = Engine.trust.applyCoeff(delta, mental);
      const newTrust = Engine.util.clamp(Math.round((fighter.trust != null ? fighter.trust : 50) + adjusted), 0, 100);
      return { ...fighter, trust: newTrust };
    };

    // ── 個人向けアクション ──
    if (cfg.category === 'individual') {
      const idx = roster.findIndex(f => f.id === fighterId);
      if (idx < 0) return { error: 'fighter_not_found' };
      let f = { ...roster[idx] };

      if (actionId === 'bonus') {
        const repeatCount = Engine.careActions.getBonusRepeatCount(f);
        const trustGain = Math.max(1, cfg.effects.trust - repeatCount * 2);  // 逓減
        f = applyTrust(f, trustGain);
        f._bonusRepeat = repeatCount + 1;
        if (repeatCount >= 2) reactionKey = 'bonus_repeat';
        events.push(`💴 ${f.name}にボーナスを支給（信頼度+${trustGain}）`);
      } else if (actionId === 'costume') {
        // v2.0: 週次1回制限
        if ((f._careWeekUsed || {})[actionId] === state.week) return { error: 'already_used_this_week' };
        const newPop = Engine.util.clamp((f.popularity || 1) + cfg.effects.popularity, 1, 100);
        f = { ...f, popularity: newPop };
        f = applyTrust(f, cfg.effects.trust);
        f._careWeekUsed = { ...(f._careWeekUsed || {}), [actionId]: state.week };
        events.push(`👗 ${f.name}のコスチュームを新調（人気+${cfg.effects.popularity}、信頼度+${cfg.effects.trust}）`);
      } else if (actionId === 'trainer') {
        // 専属トレーナー: 成長バフを付与（growthPenaltyの逆パターンとして実装）
        f = applyTrust(f, cfg.effects.trust);
        f._trainerBuff = { weeksLeft: cfg.effects.growth_boost.weeks, mult: cfg.effects.growth_boost.mult };
        events.push(`🏋️ ${f.name}に専属トレーナーを手配（${cfg.effects.growth_boost.weeks}週間 成長+30%）`);
      } else if (actionId === 'media') {
        // v2.0: 週次1回制限
        if ((f._careWeekUsed || {})[actionId] === state.week) return { error: 'already_used_this_week' };
        const newPop = Engine.util.clamp((f.popularity || 1) + cfg.effects.popularity, 1, 100);
        f = { ...f, popularity: newPop };
        f = applyTrust(f, cfg.effects.trust);
        // 練習休み: condition を少し回復（スキップ扱い）
        f = { ...f, condition: Math.min(100, (f.condition || 70) + 5) };
        f._careWeekUsed = { ...(f._careWeekUsed || {}), [actionId]: state.week };
        events.push(`📺 ${f.name}のメディア露出を手配（人気+${cfg.effects.popularity}）`);
      } else if (actionId === 'special_treatment') {
        if (!f.injury) return { error: 'not_injured' };
        const cur = f.injury.weeksLeft || 0;
        const reduced = Math.max(1, Math.floor(cur / 2));
        f = { ...f, injury: { ...f.injury, weeksLeft: reduced } };
        events.push(`🏥 ${f.name}の特別治療（回復期間 ${cur}週→${reduced}週）`);
      }

      roster[idx] = f;
    }

    // ── 団体全体向けアクション ──
    if (cfg.category === 'team') {
      if (actionId === 'party') {
        roster = roster.map(f => {
          if (f.injury) return f;
          return applyTrust(f, cfg.effects.trust_all);
        });
        lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + cfg.effects.morale, 0, 100);
        events.push(`🎉 打ち上げ・慰労会を開催（全員の信頼度+${cfg.effects.trust_all}、雰囲気+${cfg.effects.morale}）`);
        reactionFighterId = null;  // 全員反応
      } else if (actionId === 'camp') {
        roster = roster.map(f => {
          if (f.injury) return f;
          const newF = applyTrust(f, cfg.effects.trust_all);
          return { ...newF, _trainerBuff: { weeksLeft: cfg.effects.growth_all.weeks, mult: cfg.effects.growth_all.mult } };
        });
        events.push(`⛺ 合宿を実施（全員の成長バフ+50%、${cfg.effects.growth_all.weeks}週間）`);
        reactionFighterId = null;
      }
    }

    const newFunds = (state.funds || 0) - cfg.cost;
    return { roster, lockerRoomMorale, funds: newFunds, events, reactionKey, reactionFighterId };
  },

  // ── トレーナーバフの週次消費（processManage内で呼び出し） ─────────────────
  tickTrainerBuffs(roster) {
    return roster.map(f => {
      if (!f._trainerBuff) return f;
      const buf = f._trainerBuff;
      if (buf.weeksLeft <= 1) {
        const { _trainerBuff: _, ...rest } = f;
        return rest;  // バフ期限切れ
      }
      return { ...f, _trainerBuff: { ...buf, weeksLeft: buf.weeksLeft - 1 } };
    });
  },

  // ── 成長計算時のトレーナーバフ取得 ──────────────────────────────────────────
  getTrainerMult(fighter) {
    return fighter._trainerBuff ? fighter._trainerBuff.mult : 1.0;
  },

  // ── シーズン末にボーナス逓減カウンタをリセット ───────────────────────────
  resetSeasonalCounters(roster) {
    return roster.map(f => {
      if (!f._bonusRepeat) return f;
      const { _bonusRepeat: _, ...rest } = f;
      return rest;
    });
  },

  // ── リアクションセリフ選択 ────────────────────────────────────────────────
  getReactionText(actionId, fighter) {
    if (typeof CARE_REACTION_DIALOGUES === 'undefined') return '…';
    const dialogues = CARE_REACTION_DIALOGUES[actionId] || {};
    const traits = (fighter && fighter.traits) || [];
    for (const trait of traits) {
      if (dialogues[trait]) {
        const pool = dialogues[trait];
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    const defPool = dialogues.default || ['…'];
    return defPool[Math.floor(Math.random() * defPool.length)];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: Event System (event-system-spec-v2.md §3)
// ─────────────────────────────────────────────────────────────────────────────
Engine.eventSystem = {
  // ── 週次イベント生成（25%発生率、非興行週・通常シーズンのみ）──────────────
  // 現在は通知型(N1〜N5)と選択型(S/E)を生成。大型(B)は後続ステップで追加
  // 種別重み: 通知型50% / 選択型40% / 大型10%
  generateWeeklyEvent(rng, state) {
    if (Engine.rng.float(rng) > 0.25) return null;   // 25% 基本発生率

    const roster = (state.roster || []).filter(f => !f.injury && !f.isRental);
    if (roster.length === 0) return null;

    // 種別抽選: 選択型はStep4で実装。現在は通知型のみ
    const roll = Engine.rng.float(rng);
    if (roll < 0.50) {
      // 通知型 (50%)
      return Engine.eventSystem.generateNotifEvent(rng, state, roster);
    } else if (roll < 0.90) {
      // 選択型 (40%) — Step4実装まで通知型にフォールバック
      return Engine.eventSystem.generateChoiceEvent(rng, state, roster);
    }
    // 大型 (10%) — Phase1-6: B1〜B4 大型イベント
    return Engine.eventSystem.generateLargeEvent(rng, state, roster);
  },

  // ── 通知型イベント生成 + 効果適用 ────────────────────────────────────────
  generateNotifEvent(rng, state, roster) {
    // N5優先判定（trust閾値接近の選手が存在する場合、50%でN5を優先）
    const n5Pool = roster.filter(f => {
      const t = f.trust != null ? f.trust : 50;
      return t >= 25 && t <= 54;
    });
    if (n5Pool.length > 0 && Engine.rng.float(rng) < 0.50) {
      const f = Engine.rng.pick(rng, n5Pool);
      const trust = f.trust != null ? f.trust : 50;
      const band = trust < 40 ? 'low' : 'warning';
      return { type: 'N5', fighter: f.id, name: f.name, band };
    }

    // N1〜N4: 重み付き抽選
    const weighted = [];
    const n1Pool = roster.filter(f => (f.trust != null ? f.trust : 50) >= 60);
    if (n1Pool.length > 0) weighted.push({ w: 2, t: 'N1', pool: n1Pool });

    if (roster.length >= 2) weighted.push({ w: 3, t: 'N2', pool: roster });

    weighted.push({ w: 2, t: 'N3', pool: roster });

    const n4Pool = roster.filter(f => (f.popularity || 0) >= 30);
    if (n4Pool.length > 0) weighted.push({ w: 3, t: 'N4', pool: n4Pool });

    if (weighted.length === 0) return null;

    const total = weighted.reduce((s, c) => s + c.w, 0);
    let roll = Engine.rng.float(rng) * total;
    let sel = weighted[weighted.length - 1];
    for (const c of weighted) { roll -= c.w; if (roll <= 0) { sel = c; break; } }

    const f1 = Engine.rng.pick(rng, sel.pool);
    if (sel.t === 'N2') {
      const others = sel.pool.filter(f => f.id !== f1.id);
      const f2 = Engine.rng.pick(rng, others);
      return { type: 'N2', fighter: f1.id, name: f1.name, fighter2: f2.id, name2: f2.name };
    }
    return { type: sel.t, fighter: f1.id, name: f1.name };
  },

  // ── 通知型イベントのroster効果適用 ──────────────────────────────────────
  // N1: 対象能力+1 / N3: コンディション-5 / N4: 人気+1, trust+2
  // 返り値: { roster, event } — roster が変更された場合は新しいアレイ
  applyNotifEffect(rng, event, roster) {
    if (!event) return { roster, event };
    const fId = event.fighter;

    switch (event.type) {
      case 'N1': {
        // 成長できる能力値を選ぶ（trainCapに余裕がある stat）
        const stats = ['pw', 'sp', 'te', 'st', 'mn'];
        const newRoster = roster.map(f => {
          if (f.id !== fId) return f;
          const available = stats.filter(s => {
            const cap = f.trainCap ? (f.trainCap[s] || 100) : 100;
            return (f[s] || 0) < cap;
          });
          if (available.length === 0) return f;
          const stat = Engine.rng.pick(rng, available);
          const cap = f.trainCap ? (f.trainCap[stat] || 100) : 100;
          const newVal = Math.min(cap, (f[stat] || 0) + 1);
          return { ...f, [stat]: newVal, seasonGrowth: { ...(f.seasonGrowth || {}), [stat]: ((f.seasonGrowth || {})[stat] || 0) + 1 } };
        });
        const updatedF = newRoster.find(f => f.id === fId);
        return { roster: newRoster, event: { ...event, statGain: updatedF } };
      }
      case 'N3': {
        const newRoster = roster.map(f => {
          if (f.id !== fId) return f;
          return { ...f, condition: Math.max(20, (f.condition || 70) - 5) };
        });
        return { roster: newRoster, event };
      }
      case 'N4': {
        const newRoster = roster.map(f => {
          if (f.id !== fId) return f;
          const newPop = Engine.util.clamp((f.popularity || 1) + 1, 1, 100);
          const newTrust = Engine.util.clamp((f.trust != null ? f.trust : 50) + 2, 0, 100);
          return { ...f, popularity: newPop, trust: newTrust };
        });
        return { roster: newRoster, event };
      }
      default:
        return { roster, event };
    }
  },

  // ── 選択型イベント生成（S1〜S6 / E1〜E6） ──────────────────────────────
  generateChoiceEvent(rng, state, roster) {
    const champId = state.titles?.world?.championId;
    const funds = state.funds || 0;

    // S4: trust < 25 — 不満・退団示唆（高優先度）
    const s4Pool = roster.filter(f => (f.trust != null ? f.trust : 50) < 25);
    if (s4Pool.length > 0 && Engine.rng.float(rng) < 0.60) {
      const f = Engine.rng.pick(rng, s4Pool);
      return { type: 'S4', fighter: f.id, name: f.name, isDirect: Engine.trust.isDirectType(f) };
    }

    // S3: condition <= 40 — 休養願い
    const s3Pool = roster.filter(f => (f.condition || 70) <= 40);
    if (s3Pool.length > 0 && Engine.rng.float(rng) < 0.50) {
      const f = Engine.rng.pick(rng, s3Pool);
      return { type: 'S3', fighter: f.id, name: f.name };
    }

    // E6: 他団体からの引き抜き（trust < 45、人気40+）
    const e6Pool = roster.filter(f => (f.popularity || 0) >= 40 && (f.trust != null ? f.trust : 50) < 45);
    if (e6Pool.length > 0 && Engine.rng.float(rng) < 0.30) {
      const f = Engine.rng.pick(rng, e6Pool);
      return { type: 'E6', fighter: f.id, name: f.name };
    }

    // S1: タイトル挑戦要求（trust 30〜55、人気30+、タイトル未保持）
    const s1Pool = roster.filter(f =>
      (f.trust != null ? f.trust : 50) <= 55 && (f.popularity || 0) >= 30 && f.id !== champId
    );
    if (s1Pool.length > 0 && Engine.rng.float(rng) < 0.40) {
      const f = Engine.rng.pick(rng, s1Pool);
      return { type: 'S1', fighter: f.id, name: f.name };
    }

    // S5: 特訓志願（trust 70+）
    const s5Pool = roster.filter(f => (f.trust != null ? f.trust : 50) >= 70);
    if (s5Pool.length > 0 && Engine.rng.float(rng) < 0.35) {
      const f = Engine.rng.pick(rng, s5Pool);
      return { type: 'S5', fighter: f.id, name: f.name };
    }

    // E1: メディア出演オファー（人気35+）
    const e1Pool = roster.filter(f => (f.popularity || 0) >= 35);
    if (e1Pool.length > 0 && Engine.rng.float(rng) < 0.30) {
      const f = Engine.rng.pick(rng, e1Pool);
      return { type: 'E1', fighter: f.id, name: f.name };
    }

    // E5: 営業試合依頼（資金不足時に出やすい）
    if (funds < 500 && Engine.rng.float(rng) < 0.35) {
      return { type: 'E5', fighter: null, name: '' };
    }

    // フォールバック: 通知型に委譲
    return Engine.eventSystem.generateNotifEvent(rng, state, roster);
  },

  // ── 選択型イベントの選手セリフ取得 ──────────────────────────────────────
  getChoiceDialogue(rng, event, roster) {
    if (typeof CHOICE_EVENT_DIALOGUES === 'undefined') return '';
    const f = roster ? roster.find(f => f.id === event.fighter) : null;
    if (!f) return '';
    const key = event.type === 'S4'
      ? (Engine.trust.isDirectType(f) ? 'S4_direct' : 'S4_silent')
      : event.type;
    const dialogues = CHOICE_EVENT_DIALOGUES[key] || {};
    const traits = f.traits || [];
    for (const trait of traits) {
      if (dialogues[trait]) {
        const pool = dialogues[trait];
        return pool[Engine.rng.int(rng, 0, pool.length - 1)];
      }
    }
    const defPool = dialogues.default || ['…'];
    return defPool[Engine.rng.int(rng, 0, defPool.length - 1)];
  },

  // ── 選択型イベントの選択肢定義生成 ──────────────────────────────────────
  buildChoices(event, state) {
    const funds = state.funds || 0;
    switch (event.type) {
      case 'S1': return [
        { label: '受ける',       hint: '信頼度+8、次興行でタイトルマッチ調整を検討',  idx: 0 },
        { label: 'まだ早い',     hint: '信頼度-5（約束として記憶）',                   idx: 1 },
        { label: '却下する',     hint: '信頼度-10',                                   idx: 2 },
      ];
      case 'S3': return [
        { label: '休ませる',     hint: '信頼度+3、回復促進',                          idx: 0 },
        { label: '励ます',       hint: '信頼度-2（無理強い）',                        idx: 1 },
        { label: '無視する',     hint: '信頼度-5、怪我リスク増',                      idx: 2 },
      ];
      case 'S4': return [
        { label: `待遇改善（-100万）`, hint: funds >= 100 ? '信頼度+8' : '資金不足', idx: 0, disabled: funds < 100 },
        { label: '出場を約束する',     hint: '信頼度保留（約束のプレッシャー）',      idx: 1 },
        { label: '突っぱねる',         hint: '信頼度-15、退団リスク',                idx: 2 },
      ];
      case 'S5': return [
        { label: '許可する',       hint: '強化練習に設定、信頼度+3',                idx: 0 },
        { label: '通常練習を指示', hint: '変化なし',                               idx: 1 },
        { label: '別メニューを提案', hint: '信頼度+1',                             idx: 2 },
      ];
      case 'E1': return [
        { label: '出す',       hint: '人気+4、信頼度+2、コンディション-5',         idx: 0 },
        { label: '断る',       hint: '変化なし',                                  idx: 1 },
        { label: '別の選手を推薦', hint: 'チームの人気+2（ランダムな選手）',       idx: 2 },
      ];
      case 'E5': return [
        { label: '受ける（+150万）', hint: '資金+150、全選手コンディション-8',     idx: 0 },
        { label: '断る',            hint: '変化なし',                             idx: 1 },
      ];
      case 'E6': return [
        { label: `契約金を積む（-100万）`, hint: funds >= 100 ? '信頼度+10、引き止め確定' : '資金不足', idx: 0, disabled: funds < 100 },
        { label: '説得する',              hint: '信頼度次第で引き止め成功',                           idx: 1 },
        { label: '放出する',              hint: '資金+50、選手が退団',                                idx: 2 },
      ];
      default: return [{ label: '了解', hint: '', idx: 0 }];
    }
  },

  // ── 選択型イベントの効果適用（純粋関数） ─────────────────────────────────
  // 返り値: { roster, funds, lockerRoomMorale, events, log }
  applyChoiceEffect(event, choiceIdx, state) {
    let roster = state.roster.map(f => ({ ...f }));
    let funds = state.funds || 0;
    let lockerRoomMorale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    const events = [];

    const applyTrust = (fighterId, delta) => {
      roster = roster.map(f => {
        if (f.id !== fighterId) return f;
        const adjusted = Engine.trust.applyCoeff(delta, f.mn || 50);
        return { ...f, trust: Engine.util.clamp(Math.round((f.trust != null ? f.trust : 50) + adjusted), 0, 100) };
      });
    };
    const getFighter = () => roster.find(f => f.id === event.fighter);

    switch (event.type) {
      case 'S1': {
        const f = getFighter();
        if (choiceIdx === 0) {
          applyTrust(event.fighter, 8);
          events.push(`✅ ${event.name}のタイトル挑戦要求を受諾（信頼度+8）`);
        } else if (choiceIdx === 1) {
          applyTrust(event.fighter, -5);
          events.push(`⚠️ ${event.name}のタイトル挑戦要求を保留（信頼度-5）`);
        } else {
          applyTrust(event.fighter, -10);
          events.push(`❌ ${event.name}のタイトル挑戦要求を却下（信頼度-10）`);
        }
        break;
      }
      case 'S3': {
        if (choiceIdx === 0) {
          applyTrust(event.fighter, 3);
          // 休養設定（scheduleをrestに）
          roster = roster.map(f => f.id === event.fighter ? { ...f, schedule: 'rest' } : f);
          events.push(`🛌 ${event.name}を休養させた（信頼度+3）`);
        } else if (choiceIdx === 1) {
          applyTrust(event.fighter, -2);
          events.push(`😓 ${event.name}を励まして続けさせた（信頼度-2）`);
        } else {
          applyTrust(event.fighter, -5);
          events.push(`⚠️ ${event.name}の休養願いを無視（信頼度-5、怪我リスク増）`);
        }
        break;
      }
      case 'S4': {
        if (choiceIdx === 0 && funds >= 100) {
          funds -= 100;
          applyTrust(event.fighter, 8);
          lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + 5, 0, 100);
          events.push(`💴 ${event.name}の待遇を改善（-100万、信頼度+8）`);
        } else if (choiceIdx === 1) {
          events.push(`🤝 ${event.name}への出場約束（次の興行に出場させること）`);
        } else {
          applyTrust(event.fighter, -15);
          lockerRoomMorale = Engine.util.clamp(lockerRoomMorale - 10, 0, 100);
          events.push(`💢 ${event.name}の要求を突っぱねた（信頼度-15、退団リスク）`);
        }
        break;
      }
      case 'S5': {
        if (choiceIdx === 0) {
          roster = roster.map(f => f.id === event.fighter ? { ...f, intensive: true } : f);
          applyTrust(event.fighter, 3);
          events.push(`⚡ ${event.name}の特訓を許可（信頼度+3）`);
        } else if (choiceIdx === 2) {
          applyTrust(event.fighter, 1);
          events.push(`📋 ${event.name}に別メニューを提案（信頼度+1）`);
        }
        break;
      }
      case 'E1': {
        if (choiceIdx === 0) {
          roster = roster.map(f => {
            if (f.id !== event.fighter) return f;
            const newPop = Engine.util.clamp((f.popularity || 1) + 4, 1, 100);
            const newCond = Math.max(20, (f.condition || 70) - 5);
            return { ...f, popularity: newPop, condition: newCond };
          });
          applyTrust(event.fighter, 2);
          events.push(`📺 ${event.name}のメディア出演を手配（人気+4、信頼度+2）`);
        } else if (choiceIdx === 2) {
          const others = roster.filter(f => f.id !== event.fighter && !f.injury);
          if (others.length > 0) {
            const alt = others[Math.floor(Math.random() * others.length)];
            roster = roster.map(f => f.id === alt.id
              ? { ...f, popularity: Engine.util.clamp((f.popularity || 1) + 2, 1, 100) }
              : f);
            events.push(`📺 ${alt.name}を代わりに推薦（人気+2）`);
          }
        } else {
          events.push(`📺 メディア出演オファーを断った`);
        }
        break;
      }
      case 'E5': {
        if (choiceIdx === 0) {
          funds += 150;
          roster = roster.map(f => ({ ...f, condition: Math.max(20, (f.condition || 70) - 8) }));
          events.push(`💴 営業試合を受諾（+150万、全選手コンディション-8）`);
        } else {
          events.push(`🚫 営業試合オファーを断った`);
        }
        break;
      }
      case 'E6': {
        if (choiceIdx === 0 && funds >= 100) {
          funds -= 100;
          applyTrust(event.fighter, 10);
          events.push(`💴 ${event.name}を契約金で引き止め（-100万、信頼度+10）`);
        } else if (choiceIdx === 1) {
          // 信頼度次第で成功
          const f = getFighter();
          const trust = f ? (f.trust != null ? f.trust : 50) : 50;
          if (trust >= 35) {
            applyTrust(event.fighter, 5);
            events.push(`🤝 ${event.name}の説得に成功（信頼度+5）`);
          } else {
            // 退団
            roster = roster.filter(f => f.id !== event.fighter);
            events.push(`📋 ${event.name}の説得に失敗、他団体へ移籍`);
          }
        } else {
          // 放出
          roster = roster.filter(f => f.id !== event.fighter);
          funds += 50;
          events.push(`📋 ${event.name}を放出（+50万）`);
        }
        break;
      }
      default: break;
    }

    return { roster, funds, lockerRoomMorale, events };
  },

  // ── テキスト選択ヘルパー ────────────────────────────────────────────────
  // 返り値: { text, detail } オブジェクト（旧string形式との互換性あり）
  pickText(rng, key, vars) {
    let pool = typeof NOTIF_EVENT_TEXTS !== 'undefined' ? (NOTIF_EVENT_TEXTS[key] || []) : [];
    // B型イベントテキストもチェック
    if (pool.length === 0 && typeof LARGE_EVENT_TEXTS !== 'undefined') pool = LARGE_EVENT_TEXTS[key] || [];
    if (pool.length === 0) return { text: key, detail: '' };
    const tmpl = Engine.rng.pick(rng, pool);
    const sub = s => s ? s.replace(/\{name\}/g, vars.name || '').replace(/\{name1\}/g, vars.name1 || '')
      .replace(/\{name2\}/g, vars.name2 || '').replace(/\{orgName\}/g, vars.orgName || '')
      .replace(/\{outletName\}/g, vars.outletName || '') : '';
    if (typeof tmpl === 'string') return { text: sub(tmpl), detail: '' };
    return { text: sub(tmpl.text), detail: sub(tmpl.detail || '') };
  },

  // ── 通知型イベント 特性別セリフ選択 ─────────────────────────────────────
  // N2（2人イベント）・N5_warning（情報絞る）はnull返却
  getNotifDialogue(rng, event, roster) {
    if (!roster || event.fighter == null) return null;
    if (event.type === 'N2' || (event.type === 'N5' && event.band === 'warning')) return null;
    const f = roster.find(f => f.id === event.fighter);
    if (!f) return null;
    const key = event.type === 'N5' ? `N5_${event.band}` : event.type;
    if (typeof NOTIF_DIALOGUES === 'undefined') return null;
    const dialogues = NOTIF_DIALOGUES[key];
    if (!dialogues) return null;
    const traits = f.traits || [];
    for (const trait of traits) {
      if (dialogues[trait] && dialogues[trait].length > 0) {
        return dialogues[trait][Engine.rng.int(rng, 0, dialogues[trait].length - 1)];
      }
    }
    const defPool = dialogues.default;
    if (!defPool || defPool.length === 0) return null;
    return defPool[Engine.rng.int(rng, 0, defPool.length - 1)];
  },

  // ── Phase1-6: 大型イベント生成（B1〜B4） ─────────────────────────────────
  // クールダウン8週。条件を満たすB型から重み付き抽選
  generateLargeEvent(rng, state, roster) {
    // クールダウンチェック
    const absWeek = ((state.season - 1) * 52) + state.week;
    const lastLarge = state.lastLargeEventWeek || 0;
    if (absWeek - lastLarge < 8) return null;

    const candidates = [];

    // B1: 練習中の怪我 — condition < 50 の選手がいる
    const b1Pool = roster.filter(f => (f.condition || 70) < 50);
    if (b1Pool.length > 0) candidates.push({ type: 'B1', w: 3, pool: b1Pool });

    // B2: 選手間の深刻対立 — trust < 40 の選手が2人以上
    const b2Pool = roster.filter(f => (f.trust != null ? f.trust : 50) < 40);
    if (b2Pool.length >= 2) candidates.push({ type: 'B2', w: 2, pool: b2Pool });

    // B3: 他団体からの対抗戦 — orgPop > 20
    if ((state.orgPop || 0) > 20) candidates.push({ type: 'B3', w: 2 });

    // B4: メディア密着取材 — orgPop > 25、取材中でない
    if ((state.orgPop || 0) > 25 && !state.mediaSpotlight) candidates.push({ type: 'B4', w: 3 });

    if (candidates.length === 0) return null;

    // 重み付き抽選
    const total = candidates.reduce((s, c) => s + c.w, 0);
    let roll = Engine.rng.float(rng) * total;
    let sel = candidates[candidates.length - 1];
    for (const c of candidates) { roll -= c.w; if (roll <= 0) { sel = c; break; } }

    switch (sel.type) {
      case 'B1': {
        const f = Engine.rng.pick(rng, sel.pool);
        const severity = (f.condition || 70) < 30 ? 'moderate' : 'minor';
        return { type: 'B1', fighter: f.id, name: f.name, severity };
      }
      case 'B2': {
        // trust低い順に2人選択
        const sorted = sel.pool.slice().sort((a, b) => (a.trust != null ? a.trust : 50) - (b.trust != null ? b.trust : 50));
        return { type: 'B2', fighter1: sorted[0].id, name1: sorted[0].name,
                 fighter2: sorted[1].id, name2: sorted[1].name };
      }
      case 'B3': {
        // プレイヤーのorgPopに近い団体を選択
        const allOrgs = Engine.rival.getAllOrgs(state.aiOrgs);
        if (allOrgs.length === 0) return null;
        const pPop = state.orgPop || 10;
        // orgPop差が小さい順にソート → 上位から選択
        const sorted = allOrgs.slice().sort((a, b) => Math.abs(a.orgPop - pPop) - Math.abs(b.orgPop - pPop));
        const org = sorted[0];
        if (!org.roster || org.roster.length === 0) return null;
        // 上位3人からランダム
        const topFighters = org.roster.slice().sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 3);
        const challenger = Engine.rng.pick(rng, topFighters);
        const dialogues = typeof LARGE_EVENT_DIALOGUES !== 'undefined' ? LARGE_EVENT_DIALOGUES.B3_challenger : [];
        const dialogue = dialogues.length > 0 ? dialogues[Engine.rng.int(rng, 0, dialogues.length - 1)] : '';
        return { type: 'B3', orgId: org.id, orgName: org.name || '他団体',
                 challenger: { id: challenger.id, name: challenger.name,
                   pw: challenger.pw, sp: challenger.sp, te: challenger.te,
                   st: challenger.st, mn: challenger.mn,
                   popularity: challenger.popularity || 0, traits: challenger.traits || [] },
                 challengerDialogue: dialogue };
      }
      case 'B4': {
        const outlets = typeof MEDIA_OUTLET_NAMES !== 'undefined' ? MEDIA_OUTLET_NAMES : ['メディア'];
        const outletName = outlets[Engine.rng.int(rng, 0, outlets.length - 1)];
        return { type: 'B4', outletName };
      }
      default: return null;
    }
  },

  // ── Phase1-6: 大型イベントのセリフ取得 ───────────────────────────────────
  getLargeEventDialogue(rng, event, roster) {
    if (typeof LARGE_EVENT_DIALOGUES === 'undefined') return '';
    const key = event.type;
    const dialogues = LARGE_EVENT_DIALOGUES[key];
    if (!dialogues) return '';
    // B3_challenger は配列なので別処理（生成時にセット済み）
    if (key === 'B3') return '';
    // 選手の特性からセリフ選択
    const fId = event.fighter || event.fighter1;
    const f = roster ? roster.find(f => f.id === fId) : null;
    if (!f) {
      const defPool = dialogues.default || ['…'];
      return defPool[Engine.rng.int(rng, 0, defPool.length - 1)];
    }
    const traits = f.traits || [];
    for (const trait of traits) {
      if (dialogues[trait] && dialogues[trait].length > 0) {
        return dialogues[trait][Engine.rng.int(rng, 0, dialogues[trait].length - 1)];
      }
    }
    const defPool = dialogues.default || ['…'];
    return defPool[Engine.rng.int(rng, 0, defPool.length - 1)];
  },

  // B2用: fighter2のセリフ取得
  getLargeEventDialogue2(rng, event, roster) {
    if (typeof LARGE_EVENT_DIALOGUES === 'undefined') return '';
    const dialogues = LARGE_EVENT_DIALOGUES.B2_fighter2;
    if (!dialogues) return '';
    const f = roster ? roster.find(f => f.id === event.fighter2) : null;
    if (!f) {
      const defPool = dialogues.default || ['…'];
      return defPool[Engine.rng.int(rng, 0, defPool.length - 1)];
    }
    const traits = f.traits || [];
    for (const trait of traits) {
      if (dialogues[trait] && dialogues[trait].length > 0) {
        return dialogues[trait][Engine.rng.int(rng, 0, dialogues[trait].length - 1)];
      }
    }
    const defPool = dialogues.default || ['…'];
    return defPool[Engine.rng.int(rng, 0, defPool.length - 1)];
  },

  // ── Phase1-6: 大型イベント効果適用（純粋関数） ──────────────────────────
  // 返り値: { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek, events, matchResult }
  applyLargeEventEffect(event, step, choiceIdx, state, rng) {
    let roster = state.roster.map(f => ({ ...f }));
    let funds = state.funds || 0;
    let lockerRoomMorale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    let mediaSpotlight = state.mediaSpotlight || null;
    const absWeek = ((state.season - 1) * 52) + state.week;
    const events = [];

    const applyTrust = (fighterId, delta) => {
      roster = roster.map(f => {
        if (f.id !== fighterId) return f;
        const adjusted = Engine.trust.applyCoeff(delta, f.mn || 50);
        return { ...f, trust: Engine.util.clamp(Math.round((f.trust != null ? f.trust : 50) + adjusted), 0, 100) };
      });
    };

    switch (event.type) {
      // ── B1: 練習中の怪我 ────────────────────────────────────────────────
      case 'B1': {
        let severity = event.severity || 'minor';
        if (choiceIdx === 0 && funds >= 200) {
          // 特別治療
          funds -= 200;
          applyTrust(event.fighter, 5);
          const injWeeks = severity === 'moderate' ? 3 : 2;
          const gpWeeks = severity === 'moderate' ? 7 : 3;
          const gpMult = severity === 'moderate' ? 0.4 : 0.7;
          roster = roster.map(f => {
            if (f.id !== event.fighter) return f;
            return { ...f, injury: injWeeks, condition: Math.max(20, (f.condition || 70) - 10),
              growthPenalty: { remainingWeeks: gpWeeks, multiplier: gpMult, source: '練習中の怪我(特別治療)' } };
          });
          events.push(`🏥 ${event.name}に特別治療を施した（-200万、復帰${injWeeks}週）`);
        } else if (choiceIdx === 2) {
          // 無理させる
          applyTrust(event.fighter, 3);
          const worsen = Engine.rng.float(rng) < 0.40;
          if (worsen) severity = 'moderate';
          const injWeeks = severity === 'moderate' ? 6 : 3;
          const gpWeeks = severity === 'moderate' ? 14 : 6;
          const gpMult = severity === 'moderate' ? 0.4 : 0.7;
          roster = roster.map(f => {
            if (f.id !== event.fighter) return f;
            return { ...f, injury: injWeeks, condition: Math.max(20, (f.condition || 70) - 15),
              growthPenalty: { remainingWeeks: gpWeeks, multiplier: gpMult, source: worsen ? '練習中の怪我(悪化)' : '練習中の怪我' } };
          });
          if (worsen) events.push(`💥 ${event.name}を無理させた結果、症状が悪化！（${injWeeks}週離脱）`);
          else events.push(`😤 ${event.name}を無理させた（${injWeeks}週離脱、信頼度+3）`);
        } else {
          // 通常の治療（choiceIdx === 1、または資金不足でchoice 0を選んだ場合）
          const injWeeks = severity === 'moderate' ? 6 : 3;
          const gpWeeks = severity === 'moderate' ? 14 : 6;
          const gpMult = severity === 'moderate' ? 0.4 : 0.7;
          roster = roster.map(f => {
            if (f.id !== event.fighter) return f;
            return { ...f, injury: injWeeks, condition: Math.max(20, (f.condition || 70) - 10),
              growthPenalty: { remainingWeeks: gpWeeks, multiplier: gpMult, source: '練習中の怪我' } };
          });
          events.push(`🩹 ${event.name}の練習中の怪我を通常治療（${injWeeks}週離脱）`);
        }
        return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
      }

      // ── B2: 選手間の深刻対立 ────────────────────────────────────────────
      case 'B2': {
        if (step === 0) {
          // Step 1 の選択
          if (choiceIdx === 0) {
            // 話し合いで解決
            applyTrust(event.fighter1, 5);
            applyTrust(event.fighter2, 5);
            lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + 3, 0, 100);
            events.push(`🤝 ${event.name1}と${event.name2}の対立を話し合いで解決（両者信頼度+5）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
          } else if (choiceIdx === 1) {
            // 試合で決着 → nextStep で Step 2 へ
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, nextStep: 1 };
          } else {
            // 放置
            applyTrust(event.fighter1, -8);
            applyTrust(event.fighter2, -8);
            lockerRoomMorale = Engine.util.clamp(lockerRoomMorale - 10, 0, 100);
            events.push(`😡 ${event.name1}と${event.name2}の対立を放置（両者信頼度-8、士気-10）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
          }
        }
        if (step === 1) {
          // Step 2: 介入選択 → 試合シミュレーションへ (nextStep=2)
          // choiceIdx: 0=fighter1を激励、1=fighter2を激励、2=介入しない
          return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events,
                   nextStep: 2, interventionChoice: choiceIdx };
        }
        if (step === 2) {
          // Step 3: 試合結果の適用
          // event.matchResult と event.interventionChoice は app.js から渡される
          const winner = event.matchResult?.winner; // 'fighter1' | 'fighter2' | 'draw'
          const intervention = event.interventionChoice; // 0=help f1, 1=help f2, 2=neutral

          if (winner === 'draw') {
            applyTrust(event.fighter1, 3);
            applyTrust(event.fighter2, 3);
            lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + 2, 0, 100);
            events.push(`🤼 ${event.name1}と${event.name2}は引き分け。互いの実力を認め合った`);
          } else {
            const winnerId = winner === 'fighter1' ? event.fighter1 : event.fighter2;
            const loserId = winner === 'fighter1' ? event.fighter2 : event.fighter1;
            const winnerName = winner === 'fighter1' ? event.name1 : event.name2;
            const loserName = winner === 'fighter1' ? event.name2 : event.name1;
            // 介入ありで負けた側は追加ペナルティ
            const helpedId = intervention === 0 ? event.fighter1 : (intervention === 1 ? event.fighter2 : null);
            const loserPenalty = (helpedId && helpedId === loserId) ? -8 : -5;

            applyTrust(winnerId, 10);
            applyTrust(loserId, loserPenalty);
            roster = roster.map(f => f.id === winnerId ? { ...f, popularity: Engine.util.clamp((f.popularity || 1) + 2, 1, 100) } : f);
            lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + 2, 0, 100);
            events.push(`🏆 ${winnerName}が${loserName}に勝利し対立に決着（士気+2）`);
          }
          return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
        }
        return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
      }

      // ── B3: 他団体からの対抗戦 ──────────────────────────────────────────
      case 'B3': {
        if (step === 0) {
          if (choiceIdx === 0) {
            // 受けて立つ → 代表選手選択へ
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, nextStep: 1 };
          } else {
            // 断る
            events.push(`🚫 ${event.orgName || '他団体'}からの対抗戦オファーを断った`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
          }
        }
        if (step === 1) {
          // choiceIdx = 選ばれた選手のID
          return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events,
                   nextStep: 2, selectedFighterId: choiceIdx };
        }
        if (step === 2) {
          // 試合結果の適用
          const result = event.matchResult; // { winner: 'left'|'right'|'draw', mq }
          const fighterId = event.selectedFighterId;
          const orgName = event.orgName || '他団体';

          if (result.winner === 'left') {
            // プレイヤー勝利（left=プレイヤー選手）
            const orgPopDelta = Engine.orgPop.applyOrgPopChange(3, state.orgPop, rng);
            applyTrust(fighterId, 5);
            roster = roster.map(f => f.id === fighterId
              ? { ...f, popularity: Engine.util.clamp((f.popularity || 1) + 3, 1, 100) } : f);
            events.push(`🎉 対抗戦で${orgName}を返り討ち！（人気+${Math.round(orgPopDelta * 10) / 10}）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta };
          } else if (result.winner === 'right') {
            // 敗北
            const orgPopDelta = Engine.orgPop.applyOrgPopChange(-1, state.orgPop, rng);
            applyTrust(fighterId, -3);
            events.push(`😞 対抗戦で${orgName}に敗北…（人気${Math.round(orgPopDelta * 10) / 10}）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta };
          } else {
            // 引き分け
            const orgPopDelta = Engine.orgPop.applyOrgPopChange(1, state.orgPop, rng);
            applyTrust(fighterId, 2);
            events.push(`🤼 対抗戦は引き分け。互角の戦いを見せた（人気+${Math.round(orgPopDelta * 10) / 10}）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta };
          }
        }
        return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
      }

      // ── B4: メディア密着取材 ─────────────────────────────────────────────
      case 'B4': {
        // choiceIdx = 選ばれた選手のID
        const f = roster.find(f => f.id === choiceIdx);
        if (!f) return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
        mediaSpotlight = { fighterId: f.id, fighterName: f.name, remainingShows: 3,
                           totalMQ: 0, matchCount: 0, outletName: event.outletName || 'メディア' };
        events.push(`📺 ${f.name}の密着取材が開始（${mediaSpotlight.outletName}、3興行）`);
        return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
      }

      default:
        return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
    }
  },

  // ── Phase1-6: メディアスポットライトの興行後処理（純粋関数） ─────────────
  // 返り値: { mediaSpotlight, roster, events, orgPopDelta }
  processMediaSpotlight(state, showResults, validMatches, rng) {
    const spotlight = state.mediaSpotlight;
    if (!spotlight) return null;

    let roster = state.roster.map(f => ({ ...f }));
    const events = [];
    let orgPopDelta = 0;
    let newSpotlight = { ...spotlight };

    // スポットライト選手がカードに出場しているか
    const fId = spotlight.fighterId;
    let matchMQ = null;
    if (validMatches && showResults) {
      for (let i = 0; i < validMatches.length; i++) {
        const m = validMatches[i];
        if ((m.left === fId || m.right === fId) && showResults[i]) {
          matchMQ = showResults[i].mq || 0;
          break;
        }
      }
    }

    if (matchMQ !== null) {
      newSpotlight.totalMQ += matchMQ;
      newSpotlight.matchCount++;
    }
    newSpotlight.remainingShows--;

    // 取材終了判定
    if (newSpotlight.remainingShows <= 0) {
      const avgMQ = newSpotlight.matchCount > 0 ? newSpotlight.totalMQ / newSpotlight.matchCount : 0;
      if (avgMQ >= 60) {
        orgPopDelta = Engine.orgPop.applyOrgPopChange(3, state.orgPop, rng);
        roster = roster.map(f => {
          if (f.id !== fId) return f;
          const newPop = Engine.util.clamp((f.popularity || 1) + 5, 1, 100);
          const newTrust = Engine.util.clamp((f.trust != null ? f.trust : 50) + 3, 0, 100);
          return { ...f, popularity: newPop, trust: newTrust };
        });
        events.push(`📺 ${newSpotlight.fighterName}の密着取材が大成功！（人気+5、団体人気+${Math.round(orgPopDelta * 10) / 10}）`);
      } else if (avgMQ >= 45) {
        orgPopDelta = Engine.orgPop.applyOrgPopChange(1, state.orgPop, rng);
        roster = roster.map(f => {
          if (f.id !== fId) return f;
          return { ...f, popularity: Engine.util.clamp((f.popularity || 1) + 2, 1, 100) };
        });
        events.push(`📺 ${newSpotlight.fighterName}の密着取材はまずまずの結果（人気+2）`);
      } else {
        events.push(`📺 ${newSpotlight.fighterName}の密着取材は期待外れに終わった`);
      }
      return { mediaSpotlight: null, roster, events, orgPopDelta };
    }

    return { mediaSpotlight: newSpotlight, roster, events, orgPopDelta: 0 };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: Fan Expectation System (event-system-spec-v2.md §4)
// ─────────────────────────────────────────────────────────────────────────────
Engine.fanExpect = {
  // ── ファン期待カードの生成（純粋関数）─────────────────────────────────────
  // 返り値: [{ leftId, rightId, leftName, rightName, reason, priority }] 最大3件
  generate(state) {
    const roster = (state.roster || []).filter(f => !f.injury && !f.isRental);
    if (roster.length < 2) return [];

    const champId = state.titles?.world?.championId;
    const rivalries = state.rivalries || {};
    const candidates = [];
    const seen = new Set();

    const addCandidate = (f1, f2, reason, priority) => {
      if (!f1 || !f2 || f1.id === f2.id) return;
      const key = [f1.id, f2.id].sort().join('-');
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ leftId: f1.id, rightId: f2.id, leftName: f1.name, rightName: f2.name, reason, priority });
    };

    // Priority 3: 因縁ペア（matches >= 2 以上で、再戦希望）
    Object.entries(rivalries).forEach(([key, rv]) => {
      if ((rv.matches || 0) < 2) return;
      const ids = key.split('-');
      const f1 = roster.find(f => f.id === parseInt(ids[0]));
      const f2 = roster.find(f => f.id === parseInt(ids[1]));
      if (!f1 || !f2) return;
      addCandidate(f1, f2, `${f1.name} vs ${f2.name}の決着を望む声が高まっています！`, 3);
    });

    // Priority 2: チャンピオンへの挑戦（人気3位以内のノンチャンプ）
    if (champId) {
      const champ = roster.find(f => f.id === champId);
      if (champ) {
        const challengers = [...roster]
          .filter(f => f.id !== champId)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        if (challengers.length > 0) {
          const chal = challengers[0];
          addCandidate(champ, chal, `${chal.name}の王座挑戦を望む声があります！`, 2);
        }
      }
    }

    // Priority 1: 人気上位2名の対決（未追加の場合）
    const topByPop = [...roster].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    if (topByPop.length >= 2) {
      addCandidate(topByPop[0], topByPop[1], `${topByPop[0].name} vs ${topByPop[1].name}の対決が見たい！`, 1);
    }
    if (topByPop.length >= 3) {
      addCandidate(topByPop[0], topByPop[2], `${topByPop[0].name} vs ${topByPop[2].name}の実現を望む声もあります`, 1);
    }

    return candidates.sort((a, b) => b.priority - a.priority).slice(0, 3);
  },

  // ── 期待カードに一致するMQボーナス ──────────────────────────────────────
  // 一致する場合 +5 MQ（MQ_EXTERNAL_CAP の内数として扱う）
  getMQBonus(fId1, fId2, expects) {
    const matched = expects.some(exp =>
      (exp.leftId === fId1 && exp.rightId === fId2) ||
      (exp.leftId === fId2 && exp.rightId === fId1)
    );
    return matched ? 5 : 0;
  },

  // ── 現在のカードに期待カードが何件含まれているか ──────────────────────────
  countMatched(showCard, expects) {
    return expects.filter(exp =>
      showCard.some(m => m.left > 0 && m.right > 0 &&
        ((m.left === exp.leftId && m.right === exp.rightId) ||
         (m.left === exp.rightId && m.right === exp.leftId)))
    ).length;
  },
};

// ╔══════════════════════════════════════════════════════════╗
// ║  ENGINE.DATABASE  — データベースタブ用ヘルパー           ║
// ╚══════════════════════════════════════════════════════════╝
Engine.database = {

  /**
   * 全選手を収集（dormantPool除外、引退選手除外）
   * 返り値: [...fighter, orgId, orgName, orgTier]
   */
  getAllFighters(state) {
    const result = [];
    const orgName = state.orgName || 'プレイヤー団体';

    // プレイヤー団体
    (state.roster || []).forEach(f => {
      result.push({ ...f, _orgId: 'player', _orgName: orgName, _orgTier: 'player' });
    });

    // AI団体
    RIVAL_ORGS.forEach(org => {
      const aiRoster = state.aiOrgs?.[org.id]?.roster || [];
      aiRoster.forEach(f => {
        result.push({ ...f, _orgId: org.id, _orgName: org.name || org.id, _orgTier: org.tier });
      });
    });

    // フリーエージェント
    (state.freeAgents || []).forEach(f => {
      result.push({ ...f, _orgId: 'fa', _orgName: 'FA', _orgTier: 'fa' });
    });

    return result;
  },

  /**
   * 団体比較用スコア算出（0-100スケール）
   * orgId: 'player' | 'org_s' | 'org_a' | 'org_b'
   */
  getOrgCompareScores(state, orgId) {
    let roster, orgPop;
    if (orgId === 'player') {
      roster = state.roster || [];
      orgPop = state.orgPop || 0;
    } else {
      const org = RIVAL_ORGS.find(o => o.id === orgId);
      roster = state.aiOrgs?.[orgId]?.roster || [];
      // AI orgPop: ランキング評価値から推定（org単独データがなければ代替値）
      orgPop = state.aiOrgs?.[orgId]?.orgPop ?? (org ? (org.tier === 'S' ? 75 : org.tier === 'A' ? 50 : 30) : 30);
    }

    // エース力: TOP3平均OVR / 90 * 100
    const sorted = [...roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const top3 = sorted.slice(0, 3);
    const ace = top3.length > 0
      ? Math.min(100, Math.round(top3.reduce((s, f) => s + Engine.util.ov(f), 0) / top3.length / 90 * 100))
      : 0;

    // 層の厚さ: 全員平均OVR / 75 * 100
    const depth = roster.length > 0
      ? Math.min(100, Math.round(roster.reduce((s, f) => s + Engine.util.ov(f), 0) / roster.length / 75 * 100))
      : 0;

    // 将来性: 25歳以下のpotTotal平均 / 400 * 100
    const young = roster.filter(f => (f.age || 99) <= 25);
    const potential = young.length > 0
      ? Math.min(100, Math.round(
          young.reduce((s, f) => {
            const pt = f.pot ? (f.pot.pw + f.pot.sp + f.pot.te + f.pot.st + f.pot.mn) : 0;
            return s + pt;
          }, 0) / young.length / 400 * 100
        ))
      : 0;

    // 団体人気: orgPop / 100 * 100（最大100）
    const popularity = Math.min(100, Math.round(Engine.util.dispOrgPop(orgPop)));

    // スター度: 人気50以上の選手数 × 20（5人=100）
    const starCount = roster.filter(f => Engine.util.dispPop(f.popularity || 0) >= 50).length;
    const starPower = Math.min(100, starCount * 20);

    return { ace, depth, potential, popularity, starPower };
  },
};
