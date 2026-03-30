// ╔══════════════════════════════════════════════════════════╗
// ║  MATCH ENGINE — 試合シミュレーション                      ║
// ║  Pure logic layer — no DOM references                     ║
// ╚══════════════════════════════════════════════════════════╝

// ── Battle Engine (DOM-free) ──────────────────────────
Engine.battle = {
    phase(t, _phases) {
      const p = _phases || PHASES;
      return p.find(pp => t >= pp.min && t <= pp.max) || p[p.length - 1];
    },
    selMove(rng, style, turn, _phases) {
      const ph = Engine.battle.phase(turn, _phases);
      const use = Engine.rng.float(rng) * 100 < ph.sCh;
      const resolvedStyle = (style && styleMoves[style] && catW[style]) ? style : 'Allround';
      const pool = use ? styleMoves[resolvedStyle] : commonMoves;
      const cat = Engine.rng.weighted(rng, catW[resolvedStyle]);
      const cands = pool.filter(m => m.c === cat);
      return cands.length ? Engine.rng.pick(rng, cands) : Engine.rng.pick(rng, pool);
    },
    calcHitRate(mv, atk, def) {
      const eff = Engine.util.eff;
      const baseAcc = ENG.hitBase[Math.min(mv.d, 16)] || 70;
      let rate = baseAcc + (eff(atk.te) * ENG.tecHitBonus) - (eff(def.sp) * ENG.spdDodgeBonus);
      // 威圧感: 相手の命中率を低下させる
      if (Traits.has(def, '威圧感')) rate -= 2;
      return Engine.util.clamp(rate, ENG.hitMin, ENG.hitMax);
    },
    calcCounterRate(atk, def, ph) {
      const eff = Engine.util.eff;
      let rate = ENG.counterBase + (eff(def.te) * ENG.counterTecScale) - (eff(atk.sp) * ENG.counterSpdPenalty) + ph.counterBonus;
      if (def.gritTurns > 0) rate += ENG.gritCounterBonus;
      // 威圧感: 相手のカウンター率を低下させる
      if (Traits.has(atk, '威圧感')) rate -= 2;
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
    calcKickoutChance(def, ph, _eng) {
      const e = _eng || ENG;
      let chance = (def.mn / 100) * e.kickoutMnScale;
      if (ph.name === 'Climax') chance *= e.kickoutClimaxMult;
      // 闘志: HP低下時のキックアウト率UP
      if (Traits.has(def, '闘志') && def.hp / def.mhp < 0.3) chance += 0.08;
      chance = Engine.util.clamp(chance, 0.05, 0.45);
      if (def.kickoutCount >= e.kickoutMax) chance = 0;
      return chance;
    },
    calcGuEscapeChance(def, ph, _eng) {
      const e = _eng || ENG;
      let chance = (def.mn / 100) * e.guEscapeMnScale;
      if (ph.name === 'Climax') chance *= 0.8;
      chance = Engine.util.clamp(chance, 0.05, 0.40);
      if (def.kickoutCount >= e.guEscapeMax) chance = 0;
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
    // matchTier: 1=通常, 2=ビッグマッチ(PPV/タイトル/対抗戦)
    simulateMatch(charL, charR, rng, matchTier) {
      const clamp = Engine.util.clamp;
      const B = Engine.battle;

      const tier = matchTier || 1;
      const maxT    = tier >= 2 ? BIGMATCH_MAX_T    : MAX_T;
      const phases  = tier >= 2 ? BIGMATCH_PHASES   : PHASES;
      const eng     = tier >= 2 ? BIGMATCH_ENG      : ENG;

      const eff = Engine.util.eff;
      const L = {
        ...charL, hp: Math.round(eng.hpBase + eff(charL.st) * eng.hpScale),
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };
      L.mhp = L.hp;
      const R = {
        ...charR, hp: Math.round(eng.hpBase + eff(charR.st) * eng.hpScale),
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };
      R.mhp = R.hp;

      let mom = 0, turn = 1, log = [], winner = null, finType = null, finMove = null, finishPhase = null;
      // 威圧感: 序盤モメンタム優位（左+/右-）
      if (Traits.has(charL, '威圧感') && !Traits.has(charR, '威圧感')) mom += 3;
      if (Traits.has(charR, '威圧感') && !Traits.has(charL, '威圧感')) mom -= 3;
      let totalCounters = 0, totalKickouts = 0, leadChanges = 0, lastLeader = null, bigMoves = 0;

      while (turn <= maxT && !winner) {
        const ph = B.phase(turn, phases);
        const leftChance = 50 + mom * 0.3;
        const isLeftAtk = Engine.rng.float(rng) * 100 < leftChance;
        const atk = isLeftAtk ? L : R;
        const def = isLeftAtk ? R : L;
        const atkSide = isLeftAtk ? 'left' : 'right';

        const mv = B.selMove(rng, atk.style, turn, phases);
        const hitRate = B.calcHitRate(mv, atk, def);
        const roll = Engine.rng.float(rng) * 100;

        if (roll > hitRate) {
          log.push(`T${turn}: ${atk.name}の${mv.n} → MISS`);
          mom += isLeftAtk ? -5 : 5;
        } else {
          const counterRate = B.calcCounterRate(atk, def, ph);
          if (Engine.rng.float(rng) * 100 < counterRate) {
            const cDmg = Math.max(eng.dmgFloor, Math.round(mv.d * eng.counterDmgMult));
            atk.hp -= cDmg;
            mom += isLeftAtk ? -eng.counterMomShift : eng.counterMomShift;
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
                const koChance = B.calcKickoutChance(def, ph, eng);
                if (Engine.rng.float(rng) < koChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  totalKickouts++;
                  def.gritTurns = eng.gritDuration;
                  log.push(`  → ${def.name}がキックアウト！ Grit発動！`);
                }
              } else if (fType === 'gu') {
                const escChance = B.calcGuEscapeChance(def, ph, eng);
                if (Engine.rng.float(rng) < escChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  def.gritTurns = eng.gritDuration;
                  log.push(`  → ${def.name}がロープエスケープ！ Grit発動！`);
                  totalKickouts++;
                }
              }
              if (!escaped) {
                winner = atkSide;
                finType = finLabel;
                finishPhase = ph.name;
                finMove = mv.n;
                log.push(`★ ${atk.name}、${mv.n}で${finLabel}勝ち！`);
              }
            }
            else if (!winner && B.checkPinAttempt(rng, mv, atk, def, dmg, mom, atkSide, ph)) {
              const successRate = B.calcPinAttemptSuccess(atk, def, dmg, ph);
              if (Engine.rng.float(rng) * 100 < successRate) {
                const isSubPin = mv.c === 'submission';
                winner = atkSide;
                finType = isSubPin ? 'ギブアップ' : 'ピン';
                finishPhase = ph.name;
                finMove = mv.n;
                log.push(isSubPin ? `★ ${atk.name}、${mv.n}でギブアップ！` : `★ ${atk.name}、${mv.n}からのフォールで3カウント！`);
              } else {
                def.gritTurns = eng.gritDuration;
                log.push(`  → フォール！ だが${def.name}がカウント2で返した！`);
                totalKickouts++;
              }
            }
            else if (!winner && mv.c === 'rollup' && def.hp / def.mhp < eng.rollupHpThreshold) {
              let rSuccess = eng.rollupBaseSuccess + (Engine.util.eff(atk.te) * eng.rollupTecBonus);
              // 番狂わせ体質: 格上相手の丸め込み成功率UP
              if (Traits.has(atk, '番狂わせ体質') && Engine.util.ov(def) > Engine.util.ov(atk)) rSuccess += 8;
              if (Engine.rng.float(rng) * 100 < rSuccess) {
                winner = atkSide;
                finType = '丸め込み';
                finishPhase = ph.name;
                finMove = mv.n;
                log.push(`★ ${atk.name}、まさかの${mv.n}で3カウント！ 大金星！`);
              }
            }
            else if (!winner && atk.consecutiveHits >= eng.tkoConsecutiveThreshold
                     && def.hp / def.mhp < eng.tkoHpThreshold) {
              if (Engine.rng.float(rng) * 100 < eng.tkoBaseRate) {
                winner = atkSide;
                finType = 'TKO';
                finishPhase = ph.name;
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
        finishPhase = 'Timeout';
        log.push(`⏰ 時間切れ！ ${winner === 'draw' ? 'ドロー' : (winner === 'left' ? L.name : R.name) + 'のHP判定勝ち'}`);
      }

      // Calculate MQ (v2.0 deduction system — §1〜§5 of mq-deduction-redesign-v2.0.md)
      const matchTurns = turn - 1;
      const avgOV = (Engine.util.ov(charL) + Engine.util.ov(charR)) / 2;

      // §1 天井（OVシーリング）
      let ceiling;
      if (avgOV <= 50) ceiling = 20 + avgOV * 0.60;
      else if (avgOV <= 80) ceiling = 50 + (avgOV - 50) * 1.10;
      else ceiling = 83 + (avgOV - 80) * 0.85;
      ceiling = Math.round(Engine.util.clamp(ceiling, 15, 100));

      // §2 ドラマ減点（見せ場不足がペナルティ）
      let dramaPenalty = 30;
      dramaPenalty -= Math.min(totalKickouts, 2) * 8;
      dramaPenalty -= Math.min(totalCounters, 3) * 2.5;
      dramaPenalty -= Math.min(leadChanges, 3) * 1.5;
      dramaPenalty -= Math.min(bigMoves, 6) * 0.4;
      dramaPenalty = Math.max(0, Math.round(dramaPenalty));

      // §3 ペーシング減点（Tier別適正ターン帯）
      let pacingPenalty = 0;
      if (tier >= 2) {
        // Tier 2: 13ターン以上は全て理想、「長すぎ」ペナルティ撤廃
        if (matchTurns >= 13) pacingPenalty = 0;
        else if (matchTurns >= 10) pacingPenalty = 3;
        else pacingPenalty = 12;
      } else {
        // Tier 1: 7ターン以上は全て理想、「長すぎ」ペナルティ撤廃
        if (matchTurns >= 7) pacingPenalty = 0;
        else if (matchTurns >= 5) pacingPenalty = 3;
        else pacingPenalty = 12;
      }

      // §4 決着減点
      let finishPenalty = 0;
      if (finType === 'フォール' || finType === 'ギブアップ') {
        finishPenalty = (finishPhase === 'Climax') ? 0 : (finishPhase === 'End') ? 1 : 3;
      } else if (finType === 'ピン') {
        finishPenalty = 0;
      } else if (finType === '丸め込み') {
        finishPenalty = 1;
      } else if (finType === 'TKO') {
        finishPenalty = 2;
      } else {
        finishPenalty = 10; // 時間切れ / HP判定
      }

      // §5 最終MQ
      let mq = ceiling - dramaPenalty - pacingPenalty - finishPenalty;
      // 特性ボーナス（天井を超える加点として機能）
      if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')) mq += 1 + Engine.rng.int(rng, 0, 4);  // +1〜5ランダム
      const ovDiff = Math.abs(Engine.util.ov(charL) - Engine.util.ov(charR));
      if (ovDiff > 15 && (Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手'))) mq += Math.min(4, ovDiff * 0.15);
      mq = Math.round(Engine.util.clamp(mq, 5, 100));

      return {
        left: charL, right: charR,
        winner, finType, finMove,
        turns: matchTurns,
        hpLeft: { final: Math.max(0, L.hp), max: L.mhp },
        hpRight: { final: Math.max(0, R.hp), max: R.mhp },
        mq, log,
        finishPhase, matchTier: tier, btHintTurn: null,
        mqDetail: { ceiling, dramaPenalty, pacingPenalty, finishPenalty }
      };
    }
};

Engine.formatFinish = function(finType, finMove, isFinisher) {
  if (!finMove) return finType || '激闘決着';
  const prefix = isFinisher ? '★ ' : '';
  switch (finType) {
    case 'フォール':
    case 'ピン':
      return `${prefix}${finMove} → 3カウント`;
    case 'ギブアップ':
      return `${prefix}${finMove} → ギブアップ`;
    case 'TKO':
      return `${prefix}${finMove} → レフェリーストップ`;
    case '丸め込み':
      return `${prefix}${finMove} → 丸め込み`;
    default:
      return finType || '激闘決着';
  }
};
