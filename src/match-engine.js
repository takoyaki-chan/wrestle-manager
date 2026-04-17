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
      const defHpRatio = def.hp / def.mhp;
      if (defHpRatio > ENG.pinAttemptHpThreshold) return false;
      if (dmg < ENG.pinAttemptMinDmg) return false;
      if (ph.name === 'Opening') return false;
      let attemptRate = ENG.pinAttemptBaseRate;
      const mAdv = atkSide === 'left' ? mom : -mom;
      attemptRate += mAdv * ENG.pinAttemptMomBonus;
      if (ph.name === 'Climax') attemptRate += 15;
      if (ph.name === 'End') attemptRate += 8;
      // 低HPほど急激にピン試行率アップ (HP0%で+70、HP10%で+50、HP20%で+30)
      attemptRate += Math.max(0, (ENG.pinAttemptHpThreshold - defHpRatio) * ENG.pinLowHpAttemptScale);
      return Engine.rng.float(rng) * 100 < Engine.util.clamp(attemptRate, 10, 95);
    },
    calcPinAttemptSuccess(atk, def, dmg, ph) {
      let rate = ENG.pinAttemptSuccessBase + (dmg * 0.5) - (def.mn * ENG.pinAttemptMntPenalty);
      if (ph.name === 'Climax') rate += ENG.pinAttemptClimax;
      if (def.gritTurns > 0) rate -= 10;
      // 低HPほど決まりやすい (HP0%で+35、HP10%で+25、HP20%で+15)
      const defHpRatio = def.hp / def.mhp;
      rate += Math.max(0, (ENG.pinAttemptHpThreshold - defHpRatio) * ENG.pinLowHpSuccessScale);
      return Engine.util.clamp(rate, 8, 80);
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
      const fullHpL = Math.round(eng.hpBase + eff(charL.st) * eng.hpScale);
      const fullHpR = Math.round(eng.hpBase + eff(charR.st) * eng.hpScale);
      const L = {
        ...charL, hp: charL._hpOverride != null ? charL._hpOverride : fullHpL,
        mhp: fullHpL, gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };
      const R = {
        ...charR, hp: charR._hpOverride != null ? charR._hpOverride : fullHpR,
        mhp: fullHpR, gritTurns: 0, kickoutCount: 0, consecutiveHits: 0
      };

      let mom = 0, turn = 1, log = [], winner = null, finType = null, finMove = null, finishPhase = null;
      // 威圧感: 序盤モメンタム優位（左+/右-）
      if (Traits.has(charL, '威圧感') && !Traits.has(charR, '威圧感')) mom += 3;
      if (Traits.has(charR, '威圧感') && !Traits.has(charL, '威圧感')) mom -= 3;
      let totalCounters = 0, totalKickouts = 0, leadChanges = 0, lastLeader = null, bigMoves = 0;
      // 名勝負製造機: ドラマ素材（キックアウト・カウンター）の発生率UP
      const hasMeishoubu = Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機');
      // 引き出し上手: 格下戦でのペーシング減点緩和
      const hasHikidashi = Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手');

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
          let counterRate = B.calcCounterRate(atk, def, ph);
          if (hasMeishoubu) counterRate = Math.min(counterRate + 5, ENG.counterMax);
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
                let koChance = B.calcKickoutChance(def, ph, eng);
                if (hasMeishoubu) koChance = Math.min(koChance + 0.15, 0.45);
                if (Engine.rng.float(rng) < koChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  totalKickouts++;
                  def.gritTurns = eng.gritDuration;
                  log.push(`  → ${def.name}がキックアウト！ Grit発動！`);
                }
              } else if (fType === 'gu') {
                let escChance = B.calcGuEscapeChance(def, ph, eng);
                if (hasMeishoubu) escChance = Math.min(escChance + 0.15, 0.40);
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

      // §3 ペーシング減点（Tier別適正ターン帯、引き出し上手で緩和）
      let pacingPenalty = 0;
      if (tier >= 2) {
        const idealMin = hasHikidashi ? 10 : 13;
        const okMin = hasHikidashi ? 7 : 10;
        if (matchTurns >= idealMin) pacingPenalty = 0;
        else if (matchTurns >= okMin) pacingPenalty = 3;
        else pacingPenalty = 12;
      } else {
        const idealMin = hasHikidashi ? 5 : 7;
        const okMin = hasHikidashi ? 3 : 5;
        if (matchTurns >= idealMin) pacingPenalty = 0;
        else if (matchTurns >= okMin) pacingPenalty = 3;
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
      mq = Math.max(5, Math.round(mq));

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

// ╔══════════════════════════════════════════════════════════╗
// ║  TAG MATCH ENGINE — タッグマッチ専用エンジン               ║
// ║  Engine.battle の共通関数を流用しつつ                      ║
// ║  セグメント進行・タッチ・ケミストリーをタッグ専用に設計    ║
// ╚══════════════════════════════════════════════════════════╝

Engine.tagMatch = (() => {
  'use strict';
  const clamp = Engine.util.clamp;

  // ── タッグ専用ダメージスケール ──
  function tagScaleDmg(dmg) {
    return Math.max(ENG.dmgFloor, Math.round(dmg * TAG_MATCH_CONFIG.damageScale));
  }

  // ── HP減衰曲線 (§3.1.1): 後半急降下型。MNTで緩和 ──
  function effectiveStatMul(hpRatio, mnt) {
    let base;
    if (hpRatio >= 0.50) {
      base = 1.0 - (1.0 - hpRatio) * 0.10;
    } else if (hpRatio >= 0.30) {
      base = 0.95 - (0.50 - hpRatio) * 1.0;
    } else {
      base = 0.75 - (0.30 - hpRatio) * 0.50;
    }
    const mntFactor = (100 - (mnt || 70)) / 100 * 0.15;
    const reduction = 1.0 - base;
    const adjusted = 1.0 - reduction * (1.0 - mntFactor);
    return clamp(adjusted, 0.55, 1.0);
  }

  function applyHpDecay(fighter) {
    const hpRatio = clamp(fighter.hp / fighter.mhp, 0, 1);
    const mul = effectiveStatMul(hpRatio, fighter.mn);
    return {
      ...fighter,
      pw: Math.round(fighter._basePw * mul),
      sp: Math.round(fighter._baseSp * mul),
      te: Math.round(fighter._baseTe * mul),
      st: Math.round(fighter._baseSt * mul),
    };
  }

  // ── フェーズ判定 ──
  function getPhase(totalTurn) {
    const phases = TAG_MATCH_CONFIG.phases;
    return phases.find(p => totalTurn >= p.min && totalTurn <= p.max) || phases[phases.length - 1];
  }

  // ── ケミストリー (§4) ──
  function tagExpValue(matchCount) {
    return 100 * (1 - Math.exp(-(matchCount || 0) / 7));
  }

  function calcChemistry(bond, tagMatchCount, styleA, styleB) {
    const compat = getStyleCompat(styleA, styleB);
    const tagExp = tagExpValue(tagMatchCount);
    return bond * 0.5 + tagExp * 0.3 + compat * 0.2;
  }

  // ── タッチ判定 (§3.3) ──
  // minTurnsLegal: タッチ後の最低連続出場ターン。これ未満は戦術タッチ禁止（タッチ直後の再タッチ防止）
  // maxTurnsLegal: これを超えたら強制的にタッチしたがる（出ずっぱり防止）
  function wantTouch(fighter, consecutiveLossTurns, chemistry, rng) {
    const hpRatio = fighter.hp / fighter.mhp;
    const TC = TAG_MATCH_CONFIG.touch;
    // 瀕死は最低出場ターン関係なく即タッチ欲求
    if (hpRatio <= TC.wantHpCritical) return true;
    // 最低出場ターン未満ではこれ以降の判定をスキップ（直後の再タッチを防ぐ）
    if (fighter.turnsLegal < (TC.minTurnsLegal || 0)) return false;
    if (hpRatio <= TC.wantHpThreshold) return true;
    if (consecutiveLossTurns >= TC.wantLossTurns) return true;
    if (TC.maxTurnsLegal && fighter.turnsLegal >= TC.maxTurnsLegal) return true;
    if (chemistry >= TC.tacticalChemThreshold && Engine.rng.float(rng) < TC.tacticalBaseRate) return true;
    return false;
  }

  function touchSuccessRate(fighter, opponent) {
    const TC = TAG_MATCH_CONFIG.touch;
    const hpRatio = clamp(fighter.hp / fighter.mhp, 0, 1);
    // 低HPほど必死にタッチを取りに行く: wantTouch と同じ閾値で段階化
    let hpBase;
    if (hpRatio <= TC.wantHpCritical) hpBase = 0.85;
    else if (hpRatio <= TC.wantHpThreshold) hpBase = 0.60;
    else hpBase = clamp(0.30 + (1 - hpRatio) * 0.4, 0.30, 0.70);
    const spdBonus = (fighter._baseSp - 70) * TC.canTouchSpdScale;
    const oppBlock = ((opponent._basePw + opponent._baseTe) / 2 - 70) * TC.canTouchOppScale;
    return clamp(hpBase + spdBonus - oppBlock, TC.canTouchMin, TC.canTouchMax);
  }

  function classifyTouch(fighter, isolationCount, chemistry) {
    if (isolationCount >= TAG_MATCH_CONFIG.touch.isolationThreshold) return 'hotTag';
    const hpRatio = fighter.hp / fighter.mhp;
    if (hpRatio > 0.60 && chemistry >= TAG_MATCH_CONFIG.touch.tacticalChemThreshold) return 'tactical';
    return 'exhaustion';
  }

  // ── カットイン (§3.2.2) ──
  function calcCutinRate(type, apronFighter, bond, cutinCount) {
    const CC = TAG_MATCH_CONFIG.cutin;
    let base;
    if (type === 'pin') base = CC.basePinRate;
    else if (type === 'finisher') base = CC.baseFinisherRate;
    else base = CC.baseCounterRate;
    const hpBonus = (apronFighter.hp - 50) * CC.hpScale;
    const bondBonus = ((bond || 50) - 50) * CC.bondScale;
    const penalty = cutinCount * CC.countPenalty;
    return clamp(base + hpBonus + bondBonus - penalty, 0.05, 0.95);
  }

  // ── ドラマイベント (§5) ──
  function checkBetrayal(bond, rng) {
    const DD = TAG_MATCH_CONFIG.drama;
    if (bond >= DD.betrayalBondThreshold) return false;
    const rate = (DD.betrayalBondThreshold - bond) * DD.betrayalBondScale;
    return Engine.rng.float(rng) < rate;
  }

  // ── メイン: simulateTagMatch ──
  /**
   * @param {Object} teamA - {fighter1, fighter2}
   * @param {Object} teamB - {fighter1, fighter2}
   * @param {Object} rng   - Engine.rng.create() で作成したRNG
   * @param {Object} [options] - {bond_A, bond_B, tagExp_A, tagExp_B, recordFrames}
   */
  function simulateTagMatch(teamA, teamB, rng, options) {
    const opts = options || {};
    const B = Engine.battle;
    const eff = Engine.util.eff;
    const TC = TAG_MATCH_CONFIG;
    const recordFrames = !!opts.recordFrames;

    const bondA = opts.bond_A != null ? opts.bond_A : 50;
    const bondB = opts.bond_B != null ? opts.bond_B : 50;
    const chemA = calcChemistry(bondA, opts.tagExp_A || 0, teamA.fighter1.style, teamA.fighter2.style);
    const chemB = calcChemistry(bondB, opts.tagExp_B || 0, teamB.fighter1.style, teamB.fighter2.style);

    function initFighter(char) {
      const hp = Math.round(TC.hpBase + eff(char.st) * TC.hpScale);
      return {
        ...char,
        hp, mhp: hp,
        _basePw: char.pw, _baseSp: char.sp, _baseTe: char.te, _baseSt: char.st,
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0,
        turnsLegal: 0, turnsApron: 0,
        damageDealt: 0, damageTaken: 0,
        cutinCount: 0, hotTagBuff: 0,
      };
    }

    const fA1 = initFighter(teamA.fighter1);
    const fA2 = initFighter(teamA.fighter2);
    const fB1 = initFighter(teamB.fighter1);
    const fB2 = initFighter(teamB.fighter2);

    let legalA = fA1, apronA = fA2;
    let legalB = fB1, apronB = fB2;

    let totalTurn = 0, mom = 0, log = [];
    let winner = null, finType = null, finMove = null, finishPhase = null;
    let winAttribution = { pinnedBy: null, pinnedWho: null };

    let segments = [];
    let curSegment = { legalA: legalA.id, legalB: legalB.id, turns: 0, touchType: null, events: [] };
    let isolationA = 0, isolationB = 0;
    let lossStreakA = 0, lossStreakB = 0;
    let dramaSummary = [];
    let touchTypes = new Set();
    let totalKickouts = 0, totalCounters = 0, leadChanges = 0, bigMoves = 0;
    let lastMomSign = 0;

    // ── フレーム記録（観戦用） ──
    const frames = recordFrames ? [] : null;
    let _turnLogStart = 0;
    let _turnAction = null;
    // F1: タッチ発生時は「攻撃フレーム (Frame A, turnSub=0)」と
    //     「タッチフレーム (Frame B, turnSub=0.5)」を同一ターン内で別フレームに分離する。
    //     観戦側で攻撃→タッチの時系列を明確に見せるため。
    let _frameTurnSub = 0;
    function pushFrame(phName) {
      if (!recordFrames) return;
      const turnLog = log.slice(_turnLogStart);
      const turnEvents = dramaSummary
        .filter(d => d.turn === totalTurn && !d._framed)
        .map(d => { d._framed = true; return { type: d.type, by: d.by, victim: d.victim, tagged: d.tagged, saved: d.saved, team: d.team, move: d.move, attemptType: d.attemptType, byId: d.byId, onId: d.onId, outcome: d.outcome, count: d.count }; });
      frames.push({
        turn: totalTurn,
        turnSub: _frameTurnSub,
        phase: phName,
        legalA: legalA.id,
        legalB: legalB.id,
        apronA: apronA.id,
        apronB: apronB.id,
        hp: {
          [fA1.id]: Math.round(fA1.hp),
          [fA2.id]: Math.round(fA2.hp),
          [fB1.id]: Math.round(fB1.hp),
          [fB2.id]: Math.round(fB2.hp),
        },
        grit: {
          [fA1.id]: fA1.gritTurns | 0,
          [fA2.id]: fA2.gritTurns | 0,
          [fB1.id]: fB1.gritTurns | 0,
          [fB2.id]: fB2.gritTurns | 0,
        },
        hotTagBuff: {
          [fA1.id]: fA1.hotTagBuff | 0,
          [fA2.id]: fA2.hotTagBuff | 0,
          [fB1.id]: fB1.hotTagBuff | 0,
          [fB2.id]: fB2.hotTagBuff | 0,
        },
        mom,
        logLines: turnLog,
        events: turnEvents,
        action: _turnAction,
        segmentIdx: segments.length, // 現在進行中セグメントのインデックス
        winner: winner || null,
        finType: winner ? finType : null,
        finMove: winner ? finMove : null,
        finishPhase: winner ? finishPhase : null,
        pinnedBy: winner ? winAttribution.pinnedBy : null,
        pinnedWho: winner ? winAttribution.pinnedWho : null,
      });
    }

    // セグメント単位ドラマイベント計画
    let _dtTargetTurn = -1, _ffTargetTurn = -1;
    function planSegmentDrama() {
      _dtTargetTurn = -1;
      _ffTargetTurn = -1;
      const DD = TC.drama;
      const dtRate = DD.doubleTeamBase + Math.max(chemA, chemB) * DD.doubleTeamChemScale;
      if (Engine.rng.float(rng) < dtRate) {
        _dtTargetTurn = Engine.rng.int(rng, 1, 6);
      }
      const ffRate = DD.friendlyFireBase - Math.min(chemA, chemB) * DD.friendlyFireChemScale;
      if (ffRate > 0 && Engine.rng.float(rng) < ffRate) {
        _ffTargetTurn = Engine.rng.int(rng, 1, 6);
        if (_ffTargetTurn === _dtTargetTurn) _ffTargetTurn++;
      }
    }
    planSegmentDrama();

    // ── ターンループ ──
    while (totalTurn < TC.maxTotalTurns && !winner) {
      totalTurn++;
      curSegment.turns++;
      const ph = getPhase(totalTurn);
      _turnLogStart = log.length;
      _turnAction = null;
      _frameTurnSub = 0;

      // HP 0 即決着チェック（前ターンから HP が枯渇した場合のセーフティネット。
      // 本来はダメージ発生箇所側で決着判定すべきなので、ここに来たら TKO とする）
      if (legalA.hp <= 0) {
        winner = 'teamB';
        finType = 'TKO';
        finMove = '';
        finishPhase = ph.name;
        winAttribution.pinnedBy = null;
        winAttribution.pinnedWho = legalA.id;
        log.push(`  ★ 決着！ ${legalA.name}は立ち上がれない。TKO！（${ph.name}）`);
        pushFrame(ph.name);
        break;
      }
      if (legalB.hp <= 0) {
        winner = 'teamA';
        finType = 'TKO';
        finMove = '';
        finishPhase = ph.name;
        winAttribution.pinnedBy = null;
        winAttribution.pinnedWho = legalB.id;
        log.push(`  ★ 決着！ ${legalB.name}は立ち上がれない。TKO！（${ph.name}）`);
        pushFrame(ph.name);
        break;
      }

      // エプロン回復
      apronA.hp = Math.min(apronA.mhp, apronA.hp + TC.apronRecovery);
      apronB.hp = Math.min(apronB.mhp, apronB.hp + TC.apronRecovery);
      apronA.turnsApron++;
      apronB.turnsApron++;
      legalA.turnsLegal++;
      legalB.turnsLegal++;

      // バフ減衰
      if (legalA.gritTurns > 0) legalA.gritTurns--;
      if (legalB.gritTurns > 0) legalB.gritTurns--;
      if (legalA.hotTagBuff > 0) legalA.hotTagBuff--;
      if (legalB.hotTagBuff > 0) legalB.hotTagBuff--;

      // 実効ステータス
      const effA = applyHpDecay(legalA);
      const effB = applyHpDecay(legalB);

      // ── 攻防判定 ──
      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.3;
      const isAAttacking = atkRoll >= 50;
      const atk = isAAttacking ? effA : effB;
      const def = isAAttacking ? effB : effA;
      const atkFighter = isAAttacking ? legalA : legalB;
      const defFighter = isAAttacking ? legalB : legalA;
      const atkSide = isAAttacking ? 'left' : 'right';

      const mv = B.selMove(rng, atk.style, totalTurn, TC.phases);
      const hitRate = B.calcHitRate(mv, atk, def);
      const hit = Engine.rng.float(rng) * 100 < hitRate;

      if (!hit) {
        mom += isAAttacking ? -5 : 5;
        mom = clamp(mom, -50, 50);
        log.push(`T${totalTurn} [${ph.name}] ${atkFighter.name}の${mv.n}→MISS`);
        if (recordFrames) {
          _turnAction = { attackerId: atkFighter.id, defenderId: defFighter.id, atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c, kind: 'miss', dmg: 0, isCrit: false };
        }
        if (isAAttacking) { lossStreakA++; lossStreakB = 0; }
        else { lossStreakB++; lossStreakA = 0; }
      } else {
        const counterRate = B.calcCounterRate(atk, def, ph);
        const isCounter = Engine.rng.float(rng) * 100 < counterRate;

        if (isCounter) {
          totalCounters++;
          const cMv = B.selMove(rng, def.style, totalTurn, TC.phases);
          let cDmg = B.calcDamage(rng, cMv, def, atk, mom, atkSide === 'left' ? 'right' : 'left', ph);
          cDmg = Math.round(cDmg * ENG.counterDmgMult);
          cDmg = tagScaleDmg(cDmg);
          atkFighter.hp -= cDmg;
          defFighter.damageDealt += cDmg;
          atkFighter.damageTaken += cDmg;
          mom += isAAttacking ? -ENG.counterMomShift : ENG.counterMomShift;
          mom = clamp(mom, -50, 50);
          log.push(`T${totalTurn} [${ph.name}] ${defFighter.name}がカウンター！ ${cMv.n} → ${atkFighter.name}に${cDmg}ダメージ`);
          if (recordFrames) {
            _turnAction = { attackerId: defFighter.id, defenderId: atkFighter.id, atkSide: atkSide === 'left' ? 'right' : 'left', move: cMv.n, moveD: cMv.d, moveCat: cMv.c, kind: 'counter', dmg: cDmg, isCrit: cDmg >= 15 };
          }
          if (isAAttacking) { lossStreakA++; lossStreakB = 0; }
          else { lossStreakB++; lossStreakA = 0; }

          // ── カウンターKO決着判定 ──
          if (atkFighter.hp <= 0) {
            const fType = B.determineFinishType(rng, cMv);
            let finished = false;
            if (fType === 'fall' || fType === 'tko') {
              if (fType === 'tko') {
                finished = true;
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'tko', byId: defFighter.id, onId: atkFighter.id, outcome: 'win', count: 0 });
              } else {
                const koChance = B.calcKickoutChance(atkFighter, ph, ENG);
                if (atkFighter.kickoutCount < TC.kickoutMax && Engine.rng.float(rng) < koChance) {
                  atkFighter.hp = Math.round(atkFighter.mhp * 0.05);
                  atkFighter.kickoutCount++;
                  atkFighter.gritTurns = ENG.gritDuration;
                  totalKickouts++;
                  log.push(`  → ${atkFighter.name}がキックアウト！ (${atkFighter.kickoutCount}回目)`);
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'kickout', count: 2 });
                } else {
                  const apronAtk = isAAttacking ? apronA : apronB;
                  const atkBond = isAAttacking ? bondA : bondB;
                  if (checkBetrayal(atkBond, rng)) {
                    finished = true;
                    dramaSummary.push({ type: 'betrayal', turn: totalTurn, by: apronAtk.id, victim: atkFighter.id });
                    dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'betrayalWin', count: 3 });
                    log.push(`  → ${apronAtk.name}が助けに行かない！ 見殺し！`);
                  } else {
                    const cutinRate = calcCutinRate('pin', apronAtk, atkBond, apronAtk.cutinCount);
                    if (Engine.rng.float(rng) < cutinRate) {
                      apronAtk.cutinCount++;
                      atkFighter.hp = Math.round(atkFighter.mhp * 0.05);
                      atkFighter.gritTurns = ENG.gritDuration;
                      totalKickouts++;
                      dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronAtk.id, saved: atkFighter.id });
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'cutinSave', count: 2 });
                      log.push(`  → ${apronAtk.name}がカットイン！ ${atkFighter.name}を救出！`);
                    } else {
                      finished = true;
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'win', count: 3 });
                    }
                  }
                }
              }
            } else if (fType === 'gu') {
              const escChance = B.calcGuEscapeChance(atkFighter, ph, ENG);
              if (atkFighter.kickoutCount < TC.guEscapeMax && Engine.rng.float(rng) < escChance) {
                atkFighter.hp = Math.round(atkFighter.mhp * 0.05);
                atkFighter.kickoutCount++;
                atkFighter.gritTurns = ENG.gritDuration;
                totalKickouts++;
                log.push(`  → ${atkFighter.name}がロープエスケープ！`);
              } else {
                finished = true;
              }
            }
            if (finished) {
              winner = isAAttacking ? 'teamB' : 'teamA';
              finType = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
              finMove = cMv.n;
              finishPhase = ph.name;
              winAttribution.pinnedBy = defFighter.id;
              winAttribution.pinnedWho = atkFighter.id;
              log.push(`  ★ 決着！ ${defFighter.name}のカウンター（${cMv.n}）で${finType}勝ち！ (${ph.name})`);
              pushFrame(ph.name);
              break;
            }
          }
        } else {
          // 通常ヒット
          let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
          if (atkFighter.hotTagBuff > 0) dmg = Math.round(dmg * TC.touch.hotTagBuffMult);
          dmg = tagScaleDmg(dmg);
          defFighter.hp -= dmg;
          atkFighter.damageDealt += dmg;
          defFighter.damageTaken += dmg;
          atkFighter.consecutiveHits++;
          mom += isAAttacking ? 8 : -8;
          mom = clamp(mom, -50, 50);
          if (mv.d >= 10) bigMoves++;
          log.push(`T${totalTurn} [${ph.name}] ${atkFighter.name}の${mv.n} → ${defFighter.name}に${dmg}ダメージ (HP:${Math.round(defFighter.hp)}/${defFighter.mhp})`);
          if (recordFrames) {
            _turnAction = { attackerId: atkFighter.id, defenderId: defFighter.id, atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c, kind: 'hit', dmg, isCrit: dmg >= 15 };
          }
          if (isAAttacking) { lossStreakB++; lossStreakA = 0; }
          else { lossStreakA++; lossStreakB = 0; }

          // ── 決着判定 ──
          if (defFighter.hp <= 0) {
            const fType = B.determineFinishType(rng, mv);
            let finished = false;

            if (fType === 'fall' || fType === 'tko') {
              if (fType === 'tko') {
                finished = true;
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'tko', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 0 });
              } else {
                const koChance = B.calcKickoutChance(defFighter, ph, ENG);
                if (defFighter.kickoutCount < TC.kickoutMax && Engine.rng.float(rng) < koChance) {
                  defFighter.hp = Math.round(defFighter.mhp * 0.05);
                  defFighter.kickoutCount++;
                  defFighter.gritTurns = ENG.gritDuration;
                  totalKickouts++;
                  log.push(`  → ${defFighter.name}がキックアウト！ (${defFighter.kickoutCount}回目)`);
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'kickout', count: 2 });
                } else {
                  const apronDef = isAAttacking ? apronB : apronA;
                  const defBond = isAAttacking ? bondB : bondA;
                  if (checkBetrayal(defBond, rng)) {
                    finished = true;
                    dramaSummary.push({ type: 'betrayal', turn: totalTurn, by: apronDef.id, victim: defFighter.id });
                    dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'betrayalWin', count: 3 });
                    log.push(`  → ${apronDef.name}が助けに行かない！ 見殺し！`);
                  } else {
                    const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
                    if (Engine.rng.float(rng) < cutinRate) {
                      apronDef.cutinCount++;
                      defFighter.hp = Math.round(defFighter.mhp * 0.05);
                      defFighter.gritTurns = ENG.gritDuration;
                      totalKickouts++;
                      dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'cutinSave', count: 2 });
                      log.push(`  → ${apronDef.name}がカットイン！ ${defFighter.name}を救出！`);
                    } else {
                      finished = true;
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 3 });
                    }
                  }
                }
              }
            } else if (fType === 'gu') {
              const escChance = B.calcGuEscapeChance(defFighter, ph, ENG);
              if (defFighter.kickoutCount < TC.guEscapeMax && Engine.rng.float(rng) < escChance) {
                defFighter.hp = Math.round(defFighter.mhp * 0.05);
                defFighter.kickoutCount++;
                defFighter.gritTurns = ENG.gritDuration;
                totalKickouts++;
                log.push(`  → ${defFighter.name}がロープエスケープ！`);
              } else {
                finished = true;
              }
            }

            if (finished) {
              winner = isAAttacking ? 'teamA' : 'teamB';
              finType = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
              finMove = mv.n;
              finishPhase = ph.name;
              winAttribution.pinnedBy = atkFighter.id;
              winAttribution.pinnedWho = defFighter.id;
              log.push(`  ★ 決着！ ${atkFighter.name}の${mv.n}で${finType}勝ち！ (${ph.name})`);
              pushFrame(ph.name);
              break;
            }
          }

          // ピン試み
          if (!winner && defFighter.hp > 0 && defFighter.hp / defFighter.mhp <= ENG.pinAttemptHpThreshold) {
            if (B.checkPinAttempt(rng, mv, atk, defFighter, dmg, mom, atkSide, ph)) {
              const pinSuccess = B.calcPinAttemptSuccess(atk, defFighter, dmg, ph);
              if (Engine.rng.float(rng) * 100 < pinSuccess) {
                const apronDef = isAAttacking ? apronB : apronA;
                const defBond = isAAttacking ? bondB : bondA;
                if (checkBetrayal(defBond, rng)) {
                  winner = isAAttacking ? 'teamA' : 'teamB';
                  finType = 'ピン';
                  finMove = mv.n;
                  finishPhase = ph.name;
                  winAttribution.pinnedBy = atkFighter.id;
                  winAttribution.pinnedWho = defFighter.id;
                  dramaSummary.push({ type: 'betrayal', turn: totalTurn, by: apronDef.id, victim: defFighter.id });
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'betrayalWin', count: 3 });
                  log.push(`  → ピン成功！ ${apronDef.name}が見殺し！ ${atkFighter.name}の勝利！`);
                  pushFrame(ph.name);
                  break;
                }
                const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
                if (Engine.rng.float(rng) < cutinRate) {
                  apronDef.cutinCount++;
                  dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'cutinSave', count: 2 });
                  log.push(`  → ピン！ だが${apronDef.name}がカットイン！`);
                } else {
                  winner = isAAttacking ? 'teamA' : 'teamB';
                  finType = 'ピン';
                  finMove = mv.n;
                  finishPhase = ph.name;
                  winAttribution.pinnedBy = atkFighter.id;
                  winAttribution.pinnedWho = defFighter.id;
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 3 });
                  log.push(`  ★ ピン成功！ ${atkFighter.name}の勝利！ (${ph.name})`);
                  pushFrame(ph.name);
                  break;
                }
              } else {
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'kickout', count: 2 });
                log.push(`  → ピン！ だが${defFighter.name}が返した！`);
              }
            }
          }

          // 丸め込み判定
          if (!winner && defFighter.hp > 0 && defFighter.hp / defFighter.mhp <= ENG.rollupHpThreshold && ph.name !== 'Opening') {
            const rollupRate = 5 + (eff(def.te) * 0.15);
            if (Engine.rng.float(rng) * 100 < rollupRate) {
              let rSuccess = ENG.rollupBaseSuccess + (eff(def.te) * ENG.rollupTecBonus);
              if (ph.name === 'Climax') rSuccess += 15;
              if (Engine.rng.float(rng) * 100 < rSuccess) {
                const apronAtk = isAAttacking ? apronA : apronB;
                const atkBond = isAAttacking ? bondA : bondB;
                const cutinRate = calcCutinRate('pin', apronAtk, atkBond, apronAtk.cutinCount);
                if (Engine.rng.float(rng) < cutinRate) {
                  apronAtk.cutinCount++;
                  log.push(`  → ${defFighter.name}が丸め込み！ しかし${apronAtk.name}がカットイン！`);
                } else {
                  winner = isAAttacking ? 'teamB' : 'teamA';
                  finType = '丸め込み';
                  finMove = '丸め込み';
                  finishPhase = ph.name;
                  winAttribution.pinnedBy = defFighter.id;
                  winAttribution.pinnedWho = atkFighter.id;
                  log.push(`  ★ ${defFighter.name}が丸め込みで逆転勝利！ (${ph.name})`);
                  pushFrame(ph.name);
                  break;
                }
              }
            }
          }
        }
      }

      // リードチェンジ追跡
      const curSign = mom > 5 ? 1 : mom < -5 ? -1 : 0;
      if (curSign !== 0 && curSign !== lastMomSign) { leadChanges++; lastMomSign = curSign; }

      // ── ダブルチーム (セグメント計画) ──
      if (!winner && curSegment.turns === _dtTargetTurn) {
        const atkApron = isAAttacking ? apronA : apronB;
        const tagMv = getTagMove(atkFighter.style, atkApron.style);
        const effAtk = applyHpDecay(atkFighter);
        const effDef = applyHpDecay(defFighter);
        let tagDmg = B.calcDamage(rng, tagMv, effAtk, effDef, mom, atkSide, ph);
        tagDmg = Math.round(tagDmg * 1.3);
        tagDmg = tagScaleDmg(tagDmg);
        defFighter.hp -= tagDmg;
        atkFighter.damageDealt += Math.round(tagDmg * 0.5);
        atkApron.damageDealt += Math.round(tagDmg * 0.5);
        defFighter.damageTaken += tagDmg;
        bigMoves++;
        dramaSummary.push({ type: 'doubleTeam', turn: totalTurn, by: [atkFighter.id, atkApron.id], move: tagMv.n });
        log.push(`  ★ ダブルチーム！ ${atkFighter.name}&${atkApron.name}の${tagMv.n}！ ${defFighter.name}に${tagDmg}ダメージ！`);

        if (defFighter.hp <= 0) {
          const apronDef = isAAttacking ? apronB : apronA;
          const defBond = isAAttacking ? bondB : bondA;
          const cutinRate = calcCutinRate('finisher', apronDef, defBond, apronDef.cutinCount);
          if (!checkBetrayal(defBond, rng) && Engine.rng.float(rng) < cutinRate) {
            apronDef.cutinCount++;
            defFighter.hp = Math.round(defFighter.mhp * 0.03);
            defFighter.gritTurns = ENG.gritDuration;
            totalKickouts++;
            dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
            log.push(`  → ${apronDef.name}がカットイン！ なんとか阻止！`);
          } else {
            winner = isAAttacking ? 'teamA' : 'teamB';
            finType = 'フォール';
            finMove = tagMv.n;
            finishPhase = ph.name;
            winAttribution.pinnedBy = atkFighter.id;
            winAttribution.pinnedWho = defFighter.id;
            log.push(`  ★ タッグ技で決着！`);
            pushFrame(ph.name);
            break;
          }
        }
      }

      // ── 同士討ち (セグメント計画) ──
      // 同士討ちは「連携のほころび」ドラマ。HP は少しだけ削るが、控えの体力が尽きる事はない。
      // 主要な効果はモメンタム反転(連携ミスで流れを失う)。
      if (!winner && curSegment.turns === _ffTargetTurn) {
        const defApron = isAAttacking ? apronB : apronA;
        const ffDmg = Engine.rng.int(rng, 2, 4);
        // 最低でも mhp の 50% は残す（控えが戦闘不能にならないように）
        const floorHp = Math.round(defApron.mhp * 0.50);
        const appliedDmg = Math.max(0, Math.min(ffDmg, defApron.hp - floorHp));
        defApron.hp -= appliedDmg;
        defApron.damageTaken += appliedDmg;
        // モメンタム反転（主要なゲーム上の効果）
        mom += isAAttacking ? 6 : -6;
        mom = clamp(mom, -50, 50);
        dramaSummary.push({ type: 'friendlyFire', turn: totalTurn, team: isAAttacking ? 'B' : 'A', victim: defApron.id });
        log.push(`  ※ 連携にほころび！ ${defFighter.name}の反撃が${defApron.name}をかすめる！`);
      }

      // ── タッチ判定 ──
      // F1: タッチ成立時は攻撃フレーム (Frame A) をここで先行 push し、
      //     直後のタッチ処理によるログ/swap は次フレーム (Frame B, turnSub=0.5) へ回す。
      //     同一ターン内で A と B が続けて touch する場合、Frame A push は最初の一度だけ。
      const _splitTouchFrame = () => {
        if (!recordFrames || _frameTurnSub !== 0) return;
        pushFrame(ph.name);
        _turnAction = null;
        _turnLogStart = log.length;
        _frameTurnSub = 0.5;
      };

      if (!winner) {
        if (wantTouch(legalA, lossStreakA, chemA, rng)) {
          const rate = touchSuccessRate(legalA, legalB);
          if (Engine.rng.float(rng) < rate) {
            _splitTouchFrame();
            const tType = classifyTouch(legalA, isolationA, chemA);
            touchTypes.add(tType);
            if (tType === 'hotTag') {
              dramaSummary.push({ type: 'hotTag', turn: totalTurn, team: 'A', tagged: apronA.id });
              log.push(`  ★ 反撃のタッチ！ ${legalA.name}から${apronA.name}へ！ 会場が沸く！`);
              if (Engine.rng.float(rng) < TC.touch.hotTagBuffChance) {
                apronA.hotTagBuff = TC.touch.hotTagBuffTurns;
              }
            } else {
              log.push(`  ↔ タッチ(${tType === 'tactical' ? '戦術' : '消耗'}): ${legalA.name} → ${apronA.name}`);
            }
            curSegment.touchType = tType;
            segments.push({ ...curSegment });
            const tmp = legalA; legalA = apronA; apronA = tmp;
            // タッチ後: 新法定選手は「たった今法定入りしたばかり」なので turnsLegal=0 にリセット。
            // 下がった選手は控え再エントリ扱いなので turnsApron=0。
            legalA.turnsLegal = 0;
            apronA.turnsApron = 0;
            lossStreakA = 0; isolationA = 0;
            curSegment = { legalA: legalA.id, legalB: legalB.id, turns: 0, touchType: null, events: [] };
            planSegmentDrama();
          } else {
            isolationA++;
          }
        }

        if (!winner && wantTouch(legalB, lossStreakB, chemB, rng)) {
          const rate = touchSuccessRate(legalB, legalA);
          if (Engine.rng.float(rng) < rate) {
            _splitTouchFrame();
            const tType = classifyTouch(legalB, isolationB, chemB);
            touchTypes.add(tType);
            if (tType === 'hotTag') {
              dramaSummary.push({ type: 'hotTag', turn: totalTurn, team: 'B', tagged: apronB.id });
              log.push(`  ★ 反撃のタッチ！ ${legalB.name}から${apronB.name}へ！ 会場が沸く！`);
              if (Engine.rng.float(rng) < TC.touch.hotTagBuffChance) {
                apronB.hotTagBuff = TC.touch.hotTagBuffTurns;
              }
            } else {
              log.push(`  ↔ タッチ(${tType === 'tactical' ? '戦術' : '消耗'}): ${legalB.name} → ${apronB.name}`);
            }
            curSegment.touchType = tType;
            segments.push({ ...curSegment });
            const tmp = legalB; legalB = apronB; apronB = tmp;
            legalB.turnsLegal = 0;
            apronB.turnsApron = 0;
            lossStreakB = 0; isolationB = 0;
            curSegment = { legalA: legalA.id, legalB: legalB.id, turns: 0, touchType: null, events: [] };
            planSegmentDrama();
          } else {
            isolationB++;
          }
        }
      }

      // ターン末尾フレーム記録（break していないターン）
      pushFrame(ph.name);
    } // end while

    // 最終セグメント
    if (curSegment.turns > 0) {
      curSegment.touchType = winner ? 'finish' : 'timeout';
      segments.push({ ...curSegment });
    }

    // タイムアウト
    if (!winner) {
      const totalHpA = legalA.hp + apronA.hp;
      const totalHpB = legalB.hp + apronB.hp;
      if (totalHpA > totalHpB) winner = 'teamA';
      else if (totalHpB > totalHpA) winner = 'teamB';
      else winner = 'draw';
      finType = 'HP判定';
      finMove = '';
      finishPhase = 'Timeout';
      // タイムアウト時は最後のフレームに winner 情報を追加
      if (recordFrames && frames.length > 0) {
        const last = frames[frames.length - 1];
        last.winner = winner;
        last.finType = finType;
        last.finMove = finMove;
        last.finishPhase = finishPhase;
      }
    }

    // ── MQ算出 ──
    const mq = calcTagMQ({
      fA1, fA2, fB1, fB2,
      totalTurn, segments, touchTypes, dramaSummary,
      totalKickouts, totalCounters, leadChanges, bigMoves,
      finType, finishPhase, winner,
    });

    // 試合後フラグ
    const postMatchFlags = {
      betrayalFlag: dramaSummary.some(d => d.type === 'betrayal'),
      friendlyFireFlag: dramaSummary.some(d => d.type === 'friendlyFire'),
      hotTagComebackFlag: false,
      cutinSaveFlag: dramaSummary.some(d => d.type === 'cutinSave'),
      doubleTeamFinishFlag: dramaSummary.some(d => d.type === 'doubleTeam') && finMove && dramaSummary.some(d => d.type === 'doubleTeam' && d.move === finMove),
    };
    if (winner !== 'draw') {
      const winTeam = winner === 'teamA' ? 'A' : 'B';
      if (dramaSummary.some(d => d.type === 'hotTag' && d.team === winTeam)) {
        postMatchFlags.hotTagComebackFlag = true;
      }
    }

    // dramaSummary から frame 記録用フラグを除去
    if (recordFrames) {
      dramaSummary.forEach(d => { delete d._framed; });
    }

    return {
      winner, finType, finMove, finishPhase,
      turns: totalTurn, segments, log,
      mq: mq.final, mqDetail: mq,
      chemA, chemB, dramaSummary, postMatchFlags, winAttribution,
      matchType: 'tag',
      frames: recordFrames ? frames : undefined,
      perFighter: {
        [fA1.id]: { hpFinal: Math.round(fA1.hp), turnsLegal: fA1.turnsLegal, turnsApron: fA1.turnsApron, damageDealt: fA1.damageDealt, damageTaken: fA1.damageTaken },
        [fA2.id]: { hpFinal: Math.round(fA2.hp), turnsLegal: fA2.turnsLegal, turnsApron: fA2.turnsApron, damageDealt: fA2.damageDealt, damageTaken: fA2.damageTaken },
        [fB1.id]: { hpFinal: Math.round(fB1.hp), turnsLegal: fB1.turnsLegal, turnsApron: fB1.turnsApron, damageDealt: fB1.damageDealt, damageTaken: fB1.damageTaken },
        [fB2.id]: { hpFinal: Math.round(fB2.hp), turnsLegal: fB2.turnsLegal, turnsApron: fB2.turnsApron, damageDealt: fB2.damageDealt, damageTaken: fB2.damageTaken },
      },
    };
  }

  // ── タッグMQ算出 (§6) ──
  function calcTagMQ(ctx) {
    const {
      fA1, fA2, fB1, fB2,
      totalTurn, segments, touchTypes, dramaSummary,
      totalKickouts, totalCounters, leadChanges, bigMoves,
      finType, finishPhase,
    } = ctx;
    const MC = TAG_MATCH_CONFIG.mq;

    const avgOV = Math.round((
      Engine.util.ov(fA1) + Engine.util.ov(fA2) + Engine.util.ov(fB1) + Engine.util.ov(fB2)
    ) / 4);
    let ceiling;
    if (avgOV <= 50) ceiling = 20 + avgOV * 0.60;
    else if (avgOV <= 80) ceiling = 50 + (avgOV - 50) * 1.10;
    else ceiling = 83 + (avgOV - 80) * 0.85;
    ceiling = clamp(ceiling, 15, 100);

    let dramaPenalty = 30;
    dramaPenalty -= Math.min(totalKickouts, 3) * 6;
    dramaPenalty -= Math.min(totalCounters, 4) * 2;
    dramaPenalty -= Math.min(leadChanges, 4) * 1.5;
    dramaPenalty -= Math.min(bigMoves, 8) * 0.4;
    dramaPenalty = Math.max(0, dramaPenalty);

    let pacingPenalty = 0;
    if (totalTurn < 20) pacingPenalty = (20 - totalTurn) * 2;
    else if (totalTurn > 35) pacingPenalty = (totalTurn - 35) * 2;

    let finishPenalty = 0;
    if (finType === 'フォール' || finType === 'ギブアップ') {
      if (finishPhase === 'Climax') finishPenalty = 0;
      else if (finishPhase === 'End') finishPenalty = 1;
      else finishPenalty = 3;
    } else if (finType === 'ピン') finishPenalty = 0;
    else if (finType === '丸め込み') finishPenalty = 1;
    else if (finType === 'TKO') finishPenalty = 2;
    else finishPenalty = 10;

    const turnsArr = [fA1.turnsLegal, fA2.turnsLegal, fB1.turnsLegal, fB2.turnsLegal];
    const avgTurns = turnsArr.reduce((a, b) => a + b, 0) / 4;
    const stdDev = Math.sqrt(turnsArr.reduce((s, t) => s + (t - avgTurns) ** 2, 0) / 4);
    const idealStdDev = avgTurns * 0.25;
    const screenTimeBonus = stdDev <= idealStdDev
      ? MC.screenTimeMaxBonus
      : Math.max(0, MC.screenTimeMaxBonus - (stdDev - idealStdDev) * 1.5);

    const touchDiversityBonus = MC.touchDiversityBonus[Math.min(touchTypes.size, MC.touchDiversityBonus.length - 1)] || 0;

    const dramaTypes = new Set(dramaSummary.map(d => d.type));
    const dramaEventBonus = Math.min(dramaTypes.size * MC.dramaEventBonus, MC.dramaEventMaxBonus);

    let finishBonus = 0;
    if (dramaSummary.some(d => d.type === 'cutinSave')) finishBonus += MC.cutinBreakBonus;
    if (dramaSummary.some(d => d.type === 'doubleTeam')) finishBonus += MC.tagMoveFinishBonus;

    const maxSegTurns = Math.max(...segments.map(s => s.turns), 0);
    const maxSegRatio = totalTurn > 0 ? maxSegTurns / totalTurn : 0;
    let longSegPenalty = 0;
    if (maxSegRatio > MC.longSegmentPenaltyThreshold) {
      longSegPenalty = (maxSegRatio - MC.longSegmentPenaltyThreshold) * MC.longSegmentPenaltyScale;
    }

    const minTurns = Math.min(...turnsArr);
    const minRatio = totalTurn > 0 ? minTurns / totalTurn : 0;
    let screenTimePenalty = 0;
    if (minRatio < 0.10) {
      screenTimePenalty = (0.10 - minRatio) * MC.screenTimePenaltyScale * 10;
    }

    const tagBonus = screenTimeBonus + touchDiversityBonus + dramaEventBonus + finishBonus;
    const tagPenalty = longSegPenalty + screenTimePenalty;
    const final = clamp(Math.round(ceiling - dramaPenalty - pacingPenalty - finishPenalty + tagBonus - tagPenalty), 5, 100);

    return {
      ceiling: Math.round(ceiling), dramaPenalty: Math.round(dramaPenalty * 10) / 10,
      pacingPenalty: Math.round(pacingPenalty * 10) / 10, finishPenalty,
      screenTimeBonus: Math.round(screenTimeBonus * 10) / 10,
      touchDiversityBonus, dramaEventBonus, finishBonus,
      longSegPenalty: Math.round(longSegPenalty * 10) / 10,
      screenTimePenalty: Math.round(screenTimePenalty * 10) / 10,
      tagBonus: Math.round(tagBonus * 10) / 10,
      tagPenalty: Math.round(tagPenalty * 10) / 10,
      final,
    };
  }

  return {
    simulateTagMatch,
    calcChemistry,
    tagExpValue,
    getPhase,
    effectiveStatMul,
    calcTagMQ,
  };
})();

// ── Tag Experience Tracker (G.tagExp管理) ──
Engine.tagExp = {
  getKey(id1, id2) { return `${Math.min(id1, id2)}>${Math.max(id1, id2)}`; },
  getCount(state, id1, id2) { return (state.tagExp || {})[this.getKey(id1, id2)] || 0; },
  increment(tagExp, id1, id2) {
    const key = this.getKey(id1, id2);
    const ne = { ...(tagExp || {}) };
    ne[key] = (ne[key] || 0) + 1;
    return ne;
  },
};
