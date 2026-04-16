// ╔══════════════════════════════════════════════════════════╗
// ║  TAG MATCH ENGINE — タッグマッチ専用エンジン v0.1         ║
// ║  既存 Engine.battle / Engine.rng を流用しつつ              ║
// ║  セグメント進行・タッチ・ケミストリーをタッグ専用に新規設計 ║
// ╚══════════════════════════════════════════════════════════╝

const TagEngine = (() => {
  'use strict';

  // 依存: Engine (engine.js), ENG (data.js), TAG_MATCH_CONFIG / getTagMove / getStyleCompat (tag-data.js)
  // これらはグローバルスコープに存在する前提

  // ── ヘルパー ──────────────────────────────────────
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /** タッグ専用ダメージスケール適用 (1箇所で管理) */
  function tagScaleDmg(dmg) {
    return Math.max(ENG.dmgFloor, Math.round(dmg * TAG_MATCH_CONFIG.damageScale));
  }

  /** HP減衰曲線 (§3.1.1): HP残量に応じた実効スタッツ倍率
   *  後半急降下型。MNTが高いほど減衰が緩やか。 */
  function effectiveStatMul(hpRatio, mnt) {
    // 基本曲線: 3区間線形
    let base;
    if (hpRatio >= 0.50) {
      // HP 100~50%: 1.0 → 0.95
      base = 1.0 - (1.0 - hpRatio) * 0.10;  // hpRatio=1→1.0, 0.5→0.95
    } else if (hpRatio >= 0.30) {
      // HP 50~30%: 0.95 → 0.75
      base = 0.95 - (0.50 - hpRatio) * 1.0;  // hpRatio=0.5→0.95, 0.3→0.75
    } else {
      // HP 30~0%: 0.75 → 0.60
      base = 0.75 - (0.30 - hpRatio) * 0.50; // hpRatio=0.3→0.75, 0→0.60
    }
    // MNT補正: 減衰を緩和
    const mntFactor = (100 - (mnt || 70)) / 100 * 0.15;
    const reduction = 1.0 - base; // 減衰量
    const adjusted = 1.0 - reduction * (1.0 - mntFactor);
    return clamp(adjusted, 0.55, 1.0);
  }

  /** HP減衰を適用した実効ステータス */
  function applyHpDecay(fighter) {
    const hpRatio = clamp(fighter.hp / fighter.mhp, 0, 1);
    const mul = effectiveStatMul(hpRatio, fighter.mn);
    return {
      ...fighter,
      pw: Math.round(fighter._basePw * mul),
      sp: Math.round(fighter._baseSp * mul),
      te: Math.round(fighter._baseTe * mul),
      st: Math.round(fighter._baseSt * mul),
      // MNTは減衰しない（精神面は別系統）
    };
  }

  // ── フェーズ判定 ──────────────────────────────────
  function getPhase(totalTurn) {
    const phases = TAG_MATCH_CONFIG.phases;
    return phases.find(p => totalTurn >= p.min && totalTurn <= p.max) || phases[phases.length - 1];
  }

  // ── ケミストリー (§4) ────────────────────────────
  /** タッグ経験値 (§4.2): 指数減衰カーブ */
  function tagExpValue(matchCount) {
    return 100 * (1 - Math.exp(-(matchCount || 0) / 7));
  }

  /** ケミストリー算出 (§4.1) */
  function calcChemistry(bond, tagMatchCount, styleA, styleB) {
    const compat = getStyleCompat(styleA, styleB);
    const tagExp = tagExpValue(tagMatchCount);
    return bond * 0.5 + tagExp * 0.3 + compat * 0.2;
  }

  // ── タッチ判定 (§3.3) ────────────────────────────
  /** 「タッチしたい」判定 */
  function wantTouch(fighter, consecutiveLossTurns, chemistry, rng) {
    const hpRatio = fighter.hp / fighter.mhp;
    const TC = TAG_MATCH_CONFIG.touch;
    // 強制: 危険域
    if (hpRatio <= TC.wantHpCritical) return true;
    // HP閾値
    if (hpRatio <= TC.wantHpThreshold) return true;
    // 連続劣勢
    if (consecutiveLossTurns >= TC.wantLossTurns) return true;
    // 戦術タッチ: ケミストリー高ならHP高くても
    if (chemistry >= TC.tacticalChemThreshold && Engine.rng.float(rng) < TC.tacticalBaseRate) return true;
    return false;
  }

  /** 「タッチできる」判定 → 成功率を返す */
  function touchSuccessRate(fighter, opponent) {
    const TC = TAG_MATCH_CONFIG.touch;
    const hpRatio = clamp(fighter.hp / fighter.mhp, 0, 1);
    const hpBase = (hpRatio - 0.20) * TC.canTouchHpWeight;
    const spdBonus = (fighter._baseSp - 70) * TC.canTouchSpdScale;
    const oppBlock = ((opponent._basePw + opponent._baseTe) / 2 - 70) * TC.canTouchOppScale;
    return clamp(hpBase + spdBonus - oppBlock, TC.canTouchMin, TC.canTouchMax);
  }

  /** タッチ種類の分類 */
  function classifyTouch(fighter, isolationCount, chemistry) {
    if (isolationCount >= TAG_MATCH_CONFIG.touch.isolationThreshold) return 'hotTag';
    const hpRatio = fighter.hp / fighter.mhp;
    if (hpRatio > 0.60 && chemistry >= TAG_MATCH_CONFIG.touch.tacticalChemThreshold) return 'tactical';
    return 'exhaustion';
  }

  // ── カットイン (§3.2.2) ──────────────────────────
  /** カットイン成功判定 */
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

  // ── ドラマイベント (§5) ──────────────────────────
  /** ダブルチーム判定 */
  function checkDoubleTeam(chemistry, rng) {
    const DD = TAG_MATCH_CONFIG.drama;
    const rate = DD.doubleTeamBase + chemistry * DD.doubleTeamChemScale;
    return Engine.rng.float(rng) < rate;
  }

  /** 同士討ち判定 */
  function checkFriendlyFire(chemistry, rng) {
    const DD = TAG_MATCH_CONFIG.drama;
    const rate = DD.friendlyFireBase - chemistry * DD.friendlyFireChemScale;
    return rate > 0 && Engine.rng.float(rng) < rate;
  }

  /** 見殺し判定 */
  function checkBetrayal(bond, rng) {
    const DD = TAG_MATCH_CONFIG.drama;
    if (bond >= DD.betrayalBondThreshold) return false;
    const rate = (DD.betrayalBondThreshold - bond) * DD.betrayalBondScale;
    return Engine.rng.float(rng) < rate;
  }

  // ── メイン: simulateTagMatch ──────────────────────
  /**
   * タッグマッチシミュレーション
   * @param {Object} teamA - {fighter1, fighter2} キャラオブジェクト
   * @param {Object} teamB - {fighter1, fighter2}
   * @param {Object} rng   - Engine.rng.create() で作成したRNG状態
   * @param {Object} [options] - {bond_A, bond_B, tagExp_A, tagExp_B}
   *   bond_A/B: チーム内のbond値 (default 50)
   *   tagExp_A/B: そのペアのタッグ対戦数 (default 0)
   */
  function simulateTagMatch(teamA, teamB, rng, options) {
    const opts = options || {};
    const B = Engine.battle;
    const eff = Engine.util.eff;
    const TC = TAG_MATCH_CONFIG;

    // ── チームセットアップ ──
    const bondA = opts.bond_A != null ? opts.bond_A : 50;
    const bondB = opts.bond_B != null ? opts.bond_B : 50;
    const chemA = calcChemistry(bondA, opts.tagExp_A || 0, teamA.fighter1.style, teamA.fighter2.style);
    const chemB = calcChemistry(bondB, opts.tagExp_B || 0, teamB.fighter1.style, teamB.fighter2.style);

    // ── 各選手の初期化 ──
    function initFighter(char) {
      const hp = Math.round(TC.hpBase + eff(char.st) * TC.hpScale);
      return {
        ...char,
        hp, mhp: hp,
        _basePw: char.pw, _baseSp: char.sp, _baseTe: char.te, _baseSt: char.st,
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0,
        // タッグ用追跡
        turnsLegal: 0, turnsApron: 0,
        damageDealt: 0, damageTaken: 0,
        cutinCount: 0,
        hotTagBuff: 0, // 残りバフターン
      };
    }

    // チームA: legal=fighter1, apron=fighter2 (初期配置)
    const fA1 = initFighter(teamA.fighter1);
    const fA2 = initFighter(teamA.fighter2);
    const fB1 = initFighter(teamB.fighter1);
    const fB2 = initFighter(teamB.fighter2);

    // 現在のリーガルマン
    let legalA = fA1, apronA = fA2;
    let legalB = fB1, apronB = fB2;

    // ── 試合状態 ──
    let totalTurn = 0;
    let mom = 0; // モメンタム (正=A優勢, 負=B優勢)
    let log = [];
    let winner = null;
    let finType = null, finMove = null, finishPhase = null;
    let winAttribution = { pinnedBy: null, pinnedWho: null };

    // セグメント追跡
    let segments = [];
    let curSegment = {
      legalA: legalA.id, legalB: legalB.id,
      turns: 0, touchType: null, events: [],
    };

    // 孤立カウント (各チーム)
    let isolationA = 0, isolationB = 0;

    // タッチ連続劣勢ターン追跡
    let lossStreakA = 0, lossStreakB = 0;

    // ドラマイベント追跡
    let dramaSummary = [];
    let touchTypes = new Set();

    // ターンログ（ビューア用構造化データ）
    let turnLog = [];

    // キックアウト・カウンター等の追跡 (MQ用)
    let totalKickouts = 0, totalCounters = 0, leadChanges = 0, bigMoves = 0;
    let lastMomSign = 0;

    // ── セグメント単位ドラマイベント計画 ──
    // セグメント開始時に1回判定 → 発生なら目標ターンオフセットを保存
    let _dtTargetTurn = -1; // ダブルチーム発火ターン (セグメント内, -1=不発)
    let _ffTargetTurn = -1; // 同士討ち発火ターン
    function planSegmentDrama() {
      _dtTargetTurn = -1;
      _ffTargetTurn = -1;
      const DD = TC.drama;
      // ダブルチーム: 高い方のケミストリーで判定
      const dtRate = DD.doubleTeamBase + Math.max(chemA, chemB) * DD.doubleTeamChemScale;
      if (Engine.rng.float(rng) < dtRate) {
        _dtTargetTurn = Engine.rng.int(rng, 1, 6);
      }
      // 同士討ち: 低い方のケミストリーで判定
      const ffRate = DD.friendlyFireBase - Math.min(chemA, chemB) * DD.friendlyFireChemScale;
      if (ffRate > 0 && Engine.rng.float(rng) < ffRate) {
        _ffTargetTurn = Engine.rng.int(rng, 1, 6);
        // DT と同ターンなら FF を1ターンずらす
        if (_ffTargetTurn === _dtTargetTurn) _ffTargetTurn++;
      }
    }
    planSegmentDrama(); // 最初のセグメント

    // ── ターンループ ──
    while (totalTurn < TC.maxTotalTurns && !winner) {
      totalTurn++;
      curSegment.turns++;

      const ph = getPhase(totalTurn);

      // エプロン回復 (§3.2.1)
      apronA.hp = Math.min(apronA.mhp, apronA.hp + TC.apronRecovery);
      apronB.hp = Math.min(apronB.mhp, apronB.hp + TC.apronRecovery);
      apronA.turnsApron++;
      apronB.turnsApron++;
      legalA.turnsLegal++;
      legalB.turnsLegal++;

      // grit減衰
      if (legalA.gritTurns > 0) legalA.gritTurns--;
      if (legalB.gritTurns > 0) legalB.gritTurns--;
      if (legalA.hotTagBuff > 0) legalA.hotTagBuff--;
      if (legalB.hotTagBuff > 0) legalB.hotTagBuff--;

      // 実効ステータス (HP減衰適用)
      const effA = applyHpDecay(legalA);
      const effB = applyHpDecay(legalB);

      // ── アクション記録 ──
      let _turnAction = { type: 'idle' };

      // ── 1. 攻防判定 ──
      // 攻撃側判定: モメンタム＋乱数
      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.3;
      const isAAttacking = atkRoll >= 50;
      const atk = isAAttacking ? effA : effB;
      const def = isAAttacking ? effB : effA;
      const atkFighter = isAAttacking ? legalA : legalB;
      const defFighter = isAAttacking ? legalB : legalA;
      const atkSide = isAAttacking ? 'left' : 'right';

      // 技選択
      const mv = B.selMove(rng, atk.style, totalTurn, TC.phases);
      const hitRate = B.calcHitRate(mv, atk, def);
      const hit = Engine.rng.float(rng) * 100 < hitRate;

      if (!hit) {
        // ミス
        mom += isAAttacking ? -5 : 5;
        mom = clamp(mom, -50, 50);
        _turnAction = { type: 'miss', atkId: atkFighter.id, defId: defFighter.id, move: mv.n, moveCat: mv.c, side: atkSide };
        log.push(`T${totalTurn} [${ph.name}] ${atkFighter.name}の${mv.n}→MISS`);
        if (isAAttacking) lossStreakA++;
        else lossStreakB++;
        if (!isAAttacking) lossStreakA = 0;
        else lossStreakB = 0;
      } else {
        // カウンター判定
        const counterRate = B.calcCounterRate(atk, def, ph);
        const isCounter = Engine.rng.float(rng) * 100 < counterRate;

        if (isCounter) {
          // カウンター成功
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
          _turnAction = { type: 'counter', atkId: defFighter.id, defId: atkFighter.id, move: cMv.n, moveCat: cMv.c, dmg: cDmg, side: atkSide === 'left' ? 'right' : 'left', defHpRatio: atkFighter.hp / atkFighter.mhp };
          log.push(`T${totalTurn} [${ph.name}] ${defFighter.name}がカウンター！ ${cMv.n} → ${atkFighter.name}に${cDmg}ダメージ`);
          if (isAAttacking) { lossStreakA++; lossStreakB = 0; }
          else { lossStreakB++; lossStreakA = 0; }
        } else {
          // 通常ヒット
          let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
          // ホットタグバフ適用
          if (atkFighter.hotTagBuff > 0) dmg = Math.round(dmg * TC.touch.hotTagBuffMult);
          dmg = tagScaleDmg(dmg);
          defFighter.hp -= dmg;
          atkFighter.damageDealt += dmg;
          defFighter.damageTaken += dmg;
          atkFighter.consecutiveHits++;
          mom += isAAttacking ? 8 : -8;
          mom = clamp(mom, -50, 50);
          if (mv.d >= 10) bigMoves++;
          _turnAction = { type: 'hit', atkId: atkFighter.id, defId: defFighter.id, move: mv.n, moveCat: mv.c, dmg, isBig: mv.d >= 10, side: atkSide, defHpRatio: defFighter.hp / defFighter.mhp, atkPersonality: atkFighter.personality, atkArchetype: atkFighter.archetype, defPersonality: defFighter.personality, defArchetype: defFighter.archetype };
          log.push(`T${totalTurn} [${ph.name}] ${atkFighter.name}の${mv.n} → ${defFighter.name}に${dmg}ダメージ (HP:${Math.round(defFighter.hp)}/${defFighter.mhp})`);
          if (isAAttacking) { lossStreakB++; lossStreakA = 0; }
          else { lossStreakA++; lossStreakB = 0; }

          // ── 決着判定 (§3.4) ──
          if (defFighter.hp <= 0) {
            const fType = B.determineFinishType(rng, mv);
            let finished = false;

            if (fType === 'fall' || fType === 'tko') {
              if (fType === 'tko') {
                finished = true;
              } else {
                // キックアウト判定
                const koChance = B.calcKickoutChance(defFighter, ph, ENG);
                if (defFighter.kickoutCount < TC.kickoutMax && Engine.rng.float(rng) < koChance) {
                  // キックアウト成功
                  defFighter.hp = Math.round(defFighter.mhp * 0.05);
                  defFighter.kickoutCount++;
                  defFighter.gritTurns = ENG.gritDuration;
                  totalKickouts++;
                  log.push(`  → ${defFighter.name}がキックアウト！ (${defFighter.kickoutCount}回目)`);
                } else {
                  // カットイン判定
                  const apronDef = isAAttacking ? apronB : apronA;
                  const defBond = isAAttacking ? bondB : bondA;
                  // 見殺し判定
                  if (checkBetrayal(defBond, rng)) {
                    finished = true;
                    dramaSummary.push({ type: 'betrayal', turn: totalTurn, by: apronDef.id, victim: defFighter.id });
                    log.push(`  → ${apronDef.name}が助けに行かない！ 見殺し！`);
                  } else {
                    const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
                    if (Engine.rng.float(rng) < cutinRate) {
                      // カットイン成功
                      apronDef.cutinCount++;
                      defFighter.hp = Math.round(defFighter.mhp * 0.05);
                      defFighter.gritTurns = ENG.gritDuration;
                      totalKickouts++;
                      dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                      log.push(`  → ${apronDef.name}がカットイン！ ${defFighter.name}を救出！`);
                    } else {
                      finished = true;
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
              break;
            }
          }

          // ── ピン試み (HP低下時) ──
          if (!winner && defFighter.hp > 0 && defFighter.hp / defFighter.mhp <= ENG.pinAttemptHpThreshold) {
            if (B.checkPinAttempt(rng, mv, atk, defFighter, dmg, mom, atkSide, ph)) {
              const pinSuccess = B.calcPinAttemptSuccess(atk, defFighter, dmg, ph);
              if (Engine.rng.float(rng) * 100 < pinSuccess) {
                // ピン成功 → カットイン判定
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
                  log.push(`  → ピン成功！ ${apronDef.name}が見殺し！ ${atkFighter.name}の勝利！`);
                  break;
                }
                const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
                if (Engine.rng.float(rng) < cutinRate) {
                  apronDef.cutinCount++;
                  dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                  log.push(`  → ピン！ だが${apronDef.name}がカットイン！`);
                } else {
                  winner = isAAttacking ? 'teamA' : 'teamB';
                  finType = 'ピン';
                  finMove = mv.n;
                  finishPhase = ph.name;
                  winAttribution.pinnedBy = atkFighter.id;
                  winAttribution.pinnedWho = defFighter.id;
                  log.push(`  ★ ピン成功！ ${atkFighter.name}の勝利！ (${ph.name})`);
                  break;
                }
              } else {
                log.push(`  → ピン！ だが${defFighter.name}が返した！`);
              }
            }
          }

          // ── 丸め込み判定 ──
          if (!winner && defFighter.hp > 0 && defFighter.hp / defFighter.mhp <= ENG.rollupHpThreshold && ph.name !== 'Opening') {
            const rollupRate = 5 + (eff(def.te) * 0.15);
            if (Engine.rng.float(rng) * 100 < rollupRate) {
              let rSuccess = ENG.rollupBaseSuccess + (eff(def.te) * ENG.rollupTecBonus);
              if (ph.name === 'Climax') rSuccess += 15;
              if (Engine.rng.float(rng) * 100 < rSuccess) {
                // 丸め込み成功 → カットイン判定
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

      // ── 2. ダブルチーム判定 (§5.1 セグメント単位) ──
      if (!winner && curSegment.turns === _dtTargetTurn) {
        // セグメント計画で決定済みのターンに発火
        {
          const atkApron = isAAttacking ? apronA : apronB;
          const tagMv = getTagMove(atkFighter.style, atkApron.style);
          const effAtk = applyHpDecay(atkFighter);
          const effDef = applyHpDecay(defFighter);
          let tagDmg = B.calcDamage(rng, tagMv, effAtk, effDef, mom, atkSide, ph);
          tagDmg = Math.round(tagDmg * 1.3); // タッグ技ボーナス
          tagDmg = tagScaleDmg(tagDmg);
          defFighter.hp -= tagDmg;
          atkFighter.damageDealt += Math.round(tagDmg * 0.5);
          atkApron.damageDealt += Math.round(tagDmg * 0.5);
          defFighter.damageTaken += tagDmg;
          bigMoves++;
          dramaSummary.push({ type: 'doubleTeam', turn: totalTurn, by: [atkFighter.id, atkApron.id], move: tagMv.n });
          log.push(`  ★ ダブルチーム！ ${atkFighter.name}&${atkApron.name}の${tagMv.n}！ ${defFighter.name}に${tagDmg}ダメージ！`);

          // ダブルチームで決着判定
          if (defFighter.hp <= 0) {
            // カットイン判定
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
              log.push(`  ★ タッグ技で決着！ ${winner === 'teamA' ? 'チームA' : 'チームB'}の勝利！`);
              break;
            }
          }
        }
      }

      // ── 3. 同士討ち判定 (§5.1 セグメント単位) ──
      if (!winner && curSegment.turns === _ffTargetTurn) {
        // セグメント計画で決定済みのターンに発火
        {
          const defApron = isAAttacking ? apronB : apronA;
          const ffDmg = Engine.rng.int(rng, 5, 10);
          defApron.hp -= ffDmg;
          defApron.damageTaken += ffDmg;
          dramaSummary.push({ type: 'friendlyFire', turn: totalTurn, team: isAAttacking ? 'B' : 'A', victim: defApron.id });
          log.push(`  ※ 同士討ち！ ${defFighter.name}の攻撃が${defApron.name}に誤爆！ ${ffDmg}ダメージ`);
        }
      }

      // ── 4. タッチ判定 (§3.3) ──
      if (!winner) {
        // チームAのタッチ
        if (wantTouch(legalA, lossStreakA, chemA, rng)) {
          const rate = touchSuccessRate(legalA, legalB);
          if (Engine.rng.float(rng) < rate) {
            const tType = classifyTouch(legalA, isolationA, chemA);
            touchTypes.add(tType);

            // ホットタグ処理
            if (tType === 'hotTag') {
              dramaSummary.push({ type: 'hotTag', turn: totalTurn, team: 'A', tagged: apronA.id });
              log.push(`  ★ ホットタグ！ ${legalA.name}から${apronA.name}へ！ 会場が沸く！`);
              // バフ判定
              if (Engine.rng.float(rng) < TC.touch.hotTagBuffChance) {
                apronA.hotTagBuff = TC.touch.hotTagBuffTurns;
                log.push(`    → ${apronA.name}に気迫バフ発動！`);
              }
            } else {
              log.push(`  ↔ タッチ(${tType === 'tactical' ? '戦術' : '消耗'}): ${legalA.name} → ${apronA.name}`);
            }

            // セグメント終了
            curSegment.touchType = tType;
            segments.push({ ...curSegment });
            // 交代
            const tmp = legalA;
            legalA = apronA;
            apronA = tmp;
            lossStreakA = 0;
            isolationA = 0;
            curSegment = { legalA: legalA.id, legalB: legalB.id, turns: 0, touchType: null, events: [] };
            planSegmentDrama(); // 新セグメントのドラマ計画
          } else {
            isolationA++;
            if (isolationA === TC.touch.isolationThreshold) {
              log.push(`  ✕ ${legalA.name}のタッチ失敗… 孤立状態に！`);
            }
          }
        }

        // チームBのタッチ
        if (!winner && wantTouch(legalB, lossStreakB, chemB, rng)) {
          const rate = touchSuccessRate(legalB, legalA);
          if (Engine.rng.float(rng) < rate) {
            const tType = classifyTouch(legalB, isolationB, chemB);
            touchTypes.add(tType);

            if (tType === 'hotTag') {
              dramaSummary.push({ type: 'hotTag', turn: totalTurn, team: 'B', tagged: apronB.id });
              log.push(`  ★ ホットタグ！ ${legalB.name}から${apronB.name}へ！ 会場が沸く！`);
              if (Engine.rng.float(rng) < TC.touch.hotTagBuffChance) {
                apronB.hotTagBuff = TC.touch.hotTagBuffTurns;
                log.push(`    → ${apronB.name}に気迫バフ発動！`);
              }
            } else {
              log.push(`  ↔ タッチ(${tType === 'tactical' ? '戦術' : '消耗'}): ${legalB.name} → ${apronB.name}`);
            }

            curSegment.touchType = tType;
            segments.push({ ...curSegment });
            const tmp = legalB;
            legalB = apronB;
            apronB = tmp;
            lossStreakB = 0;
            isolationB = 0;
            curSegment = { legalA: legalA.id, legalB: legalB.id, turns: 0, touchType: null, events: [] };
            planSegmentDrama(); // 新セグメントのドラマ計画
          } else {
            isolationB++;
            if (isolationB === TC.touch.isolationThreshold) {
              log.push(`  ✕ ${legalB.name}のタッチ失敗… 孤立状態に！`);
            }
          }
        }
      }

      // ターンログスナップショット（構造化アクション付き）
      turnLog.push({
        turn: totalTurn,
        phase: ph.name,
        segIdx: segments.length,
        legalA: legalA.id, legalB: legalB.id,
        apronA: apronA.id, apronB: apronB.id,
        hp: { [fA1.id]: Math.round(fA1.hp), [fA2.id]: Math.round(fA2.hp), [fB1.id]: Math.round(fB1.hp), [fB2.id]: Math.round(fB2.hp) },
        mom,
        action: _turnAction,
      });
    } // end while

    // 最終セグメント追記
    if (curSegment.turns > 0) {
      curSegment.touchType = winner ? 'finish' : 'timeout';
      segments.push({ ...curSegment });
    }

    // タイムアウト処理
    if (!winner) {
      // HP判定で決着
      const totalHpA = legalA.hp + apronA.hp;
      const totalHpB = legalB.hp + apronB.hp;
      if (totalHpA > totalHpB) winner = 'teamA';
      else if (totalHpB > totalHpA) winner = 'teamB';
      else winner = 'draw';
      finType = 'HP判定';
      finMove = '';
      finishPhase = 'Timeout';
      log.push(`  ★ 時間切れ → HP判定: A=${Math.round(totalHpA)} vs B=${Math.round(totalHpB)} → ${winner}`);
    }

    // ── MQ算出 (§6) ──
    const mq = calcTagMQ({
      fA1, fA2, fB1, fB2,
      totalTurn, segments, touchTypes, dramaSummary,
      totalKickouts, totalCounters, leadChanges, bigMoves,
      finType, finishPhase, winner,
    });

    // ── 試合後イベントフラグ (§5.2) ──
    const postMatchFlags = {
      betrayalFlag: dramaSummary.some(d => d.type === 'betrayal'),
      friendlyFireFlag: dramaSummary.some(d => d.type === 'friendlyFire'),
      hotTagComebackFlag: false,
      cutinSaveFlag: dramaSummary.some(d => d.type === 'cutinSave'),
      doubleTeamFinishFlag: dramaSummary.some(d => d.type === 'doubleTeam') && finMove && dramaSummary.some(d => d.type === 'doubleTeam' && d.move === finMove),
    };
    // ホットタグからの逆転勝ち判定
    if (winner !== 'draw') {
      const winTeam = winner === 'teamA' ? 'A' : 'B';
      const hotTags = dramaSummary.filter(d => d.type === 'hotTag' && d.team === winTeam);
      if (hotTags.length > 0) {
        postMatchFlags.hotTagComebackFlag = true;
      }
    }

    // ── 結果構築 ──
    return {
      winner,
      finType,
      finMove,
      finishPhase,
      turns: totalTurn,
      segments,
      log,
      turnLog,
      mq: mq.final,
      mqDetail: mq,
      chemA, chemB,
      dramaSummary,
      postMatchFlags,
      winAttribution,
      perFighter: {
        [fA1.id]: { hpFinal: Math.round(fA1.hp), turnsLegal: fA1.turnsLegal, turnsApron: fA1.turnsApron, damageDealt: fA1.damageDealt, damageTaken: fA1.damageTaken },
        [fA2.id]: { hpFinal: Math.round(fA2.hp), turnsLegal: fA2.turnsLegal, turnsApron: fA2.turnsApron, damageDealt: fA2.damageDealt, damageTaken: fA2.damageTaken },
        [fB1.id]: { hpFinal: Math.round(fB1.hp), turnsLegal: fB1.turnsLegal, turnsApron: fB1.turnsApron, damageDealt: fB1.damageDealt, damageTaken: fB1.damageTaken },
        [fB2.id]: { hpFinal: Math.round(fB2.hp), turnsLegal: fB2.turnsLegal, turnsApron: fB2.turnsApron, damageDealt: fB2.damageDealt, damageTaken: fB2.damageTaken },
      },
    };
  }

  // ── タッグMQ算出 (§6) ─────────────────────────────
  function calcTagMQ(ctx) {
    const {
      fA1, fA2, fB1, fB2,
      totalTurn, segments, touchTypes, dramaSummary,
      totalKickouts, totalCounters, leadChanges, bigMoves,
      finType, finishPhase, winner,
    } = ctx;
    const TC = TAG_MATCH_CONFIG.mq;
    const eff = Engine.util.eff;

    // §1 Ceiling (4人平均OVR)
    const avgOV = Math.round((
      Engine.util.ov(fA1) + Engine.util.ov(fA2) + Engine.util.ov(fB1) + Engine.util.ov(fB2)
    ) / 4);
    let ceiling;
    if (avgOV <= 50) ceiling = 20 + avgOV * 0.60;
    else if (avgOV <= 80) ceiling = 50 + (avgOV - 50) * 1.10;
    else ceiling = 83 + (avgOV - 80) * 0.85;
    ceiling = clamp(ceiling, 15, 100);

    // §2 Drama penalty
    let dramaPenalty = 30;
    dramaPenalty -= Math.min(totalKickouts, 3) * 6;
    dramaPenalty -= Math.min(totalCounters, 4) * 2;
    dramaPenalty -= Math.min(leadChanges, 4) * 1.5;
    dramaPenalty -= Math.min(bigMoves, 8) * 0.4;
    dramaPenalty = Math.max(0, dramaPenalty);

    // §3 Pacing penalty (タッグ用: 最適20-35ターン)
    let pacingPenalty = 0;
    if (totalTurn < 20) pacingPenalty = (20 - totalTurn) * 2;
    else if (totalTurn > 35) pacingPenalty = (totalTurn - 35) * 2;

    // §4 Finish penalty
    let finishPenalty = 0;
    if (finType === 'フォール' || finType === 'ギブアップ') {
      if (finishPhase === 'Climax') finishPenalty = 0;
      else if (finishPhase === 'End') finishPenalty = 1;
      else finishPenalty = 3;
    } else if (finType === 'ピン') finishPenalty = 0;
    else if (finType === '丸め込み') finishPenalty = 1;
    else if (finType === 'TKO') finishPenalty = 2;
    else finishPenalty = 10; // HP判定

    // §5 タッグ特有ボーナス

    // 見せ場分配: 4人の出場ターン偏差
    const turnsArr = [fA1.turnsLegal, fA2.turnsLegal, fB1.turnsLegal, fB2.turnsLegal];
    const avgTurns = turnsArr.reduce((a, b) => a + b, 0) / 4;
    const stdDev = Math.sqrt(turnsArr.reduce((s, t) => s + (t - avgTurns) ** 2, 0) / 4);
    const idealStdDev = avgTurns * 0.25; // 理想は25%程度のばらつき
    const screenTimeBonus = stdDev <= idealStdDev
      ? TC.screenTimeMaxBonus
      : Math.max(0, TC.screenTimeMaxBonus - (stdDev - idealStdDev) * 1.5);

    // タッチ多様性
    const touchDiversityBonus = TC.touchDiversityBonus[Math.min(touchTypes.size, TC.touchDiversityBonus.length - 1)] || 0;

    // ドラマイベント
    const dramaTypes = new Set(dramaSummary.map(d => d.type));
    const dramaEventBonus = Math.min(dramaTypes.size * TC.dramaEventBonus, TC.dramaEventMaxBonus);

    // 決着説得力
    let finishBonus = 0;
    if (dramaSummary.some(d => d.type === 'cutinSave')) finishBonus += TC.cutinBreakBonus;
    // ダブルチーム技での決着
    const hasTagFinish = dramaSummary.some(d => d.type === 'doubleTeam');
    if (hasTagFinish) finishBonus += TC.tagMoveFinishBonus;

    // §6 ペナルティ
    // 最長セグメント比率
    const maxSegTurns = Math.max(...segments.map(s => s.turns), 0);
    const maxSegRatio = totalTurn > 0 ? maxSegTurns / totalTurn : 0;
    let longSegPenalty = 0;
    if (maxSegRatio > TC.longSegmentPenaltyThreshold) {
      longSegPenalty = (maxSegRatio - TC.longSegmentPenaltyThreshold) * TC.longSegmentPenaltyScale;
    }

    // 出番偏り (最少出場者の出場率)
    const minTurns = Math.min(...turnsArr);
    const minRatio = totalTurn > 0 ? minTurns / totalTurn : 0;
    let screenTimePenalty = 0;
    if (minRatio < 0.10) {
      screenTimePenalty = (0.10 - minRatio) * TC.screenTimePenaltyScale * 10;
    }

    const tagBonus = screenTimeBonus + touchDiversityBonus + dramaEventBonus + finishBonus;
    const tagPenalty = longSegPenalty + screenTimePenalty;

    const final = clamp(Math.round(ceiling - dramaPenalty - pacingPenalty - finishPenalty + tagBonus - tagPenalty), 5, 100);

    return {
      ceiling: Math.round(ceiling),
      dramaPenalty: Math.round(dramaPenalty * 10) / 10,
      pacingPenalty: Math.round(pacingPenalty * 10) / 10,
      finishPenalty,
      screenTimeBonus: Math.round(screenTimeBonus * 10) / 10,
      touchDiversityBonus,
      dramaEventBonus,
      finishBonus,
      longSegPenalty: Math.round(longSegPenalty * 10) / 10,
      screenTimePenalty: Math.round(screenTimePenalty * 10) / 10,
      tagBonus: Math.round(tagBonus * 10) / 10,
      tagPenalty: Math.round(tagPenalty * 10) / 10,
      final,
    };
  }

  // ── 公開API ──
  return {
    simulateTagMatch,
    calcChemistry,
    tagExpValue,
    getPhase,
    effectiveStatMul,
    calcTagMQ,
    // テスト用に内部関数も公開
    _wantTouch: wantTouch,
    _touchSuccessRate: touchSuccessRate,
    _calcCutinRate: calcCutinRate,
  };
})();

// Node.js モジュールエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TagEngine };
}
