// ╔══════════════════════════════════════════════════════════╗
// ║  MATCH ENGINE — 試合シミュレーション                      ║
// ║  Pure logic layer — no DOM references                     ║
// ╚══════════════════════════════════════════════════════════╝

// MQ再設計P3b(mq-redesign-proposal-v0.4 §3.4): タイトル戦のリング内効果。
// 王座戦は挑戦者・王者ともフォール/ギブアップ脱出率+0.10(既存キャップに従う)。
const TITLE_RING_ESCAPE_BONUS = 0.10;
// MQ再設計P3c(mq-redesign-proposal-v0.5 §3.4較正結果): escape単独ではMQへの寄与が薄いため
// カウンター率+4ptを補強(名勝負製造機・因縁と同じ既存キャップ共有)。
const TITLE_RING_COUNTER_BONUS = 4;

// K-7(2026-09-25 Keisuke裁定A): 「返し」の上乗せを、HP0の判定だけでなくフォール狙い(ピン)の成否にも効かせる。
// 旧配線では上乗せがHP0判定(キックアウト/ロープエスケープ)にしか入っておらず、決着の本線である
// フォール狙いには1つも効いていなかった(ニアフォール0回の試合が約7割・特性はほぼ不発)。
//   両者の返し(同格なら勝率に中立): 名勝負製造機 / 因縁(0.05〜0.15) / 王座戦(0.10)
//   片側の返し: 防衛王者の土壇場(0.02、フォールとギブアップ) / 闘志(0.08、HP30%未満のフォールのみ)
// HP0でもピンでも、上乗せは「返す確率」に足し、上限は式の上限(フォール0.60/締め・ギブアップ0.52)にそろえる。
// 返しの回数(kickoutCount)はHP0・ピン・丸め込みで共通の上限(通常2回・大一番3回)。使い切ったら返せない。
// 丸め込みはTE主導の独立した決着なので、これらの上乗せは入れない(奇襲は踏ん張りで返すものではない)。
const MEISHOUBU_ESCAPE_BONUS = 0.15;
// 両者の返しは重ねても単独の最大値(因縁4段階・名勝負製造機の0.15)まで。返しは押さえ込まれる側を助けるので、
// 両者に同じだけ効いても格差のある試合では格下寄りに傾く(大一番・格差8〜15で上乗せ0.15→格上−1.2pt、
// 因縁4段階+王座戦の0.25→−2.3pt)。足し算のままだと mq spec 不変条件#6(勝率の歪み±2pt以内)を超えるため頭打ちにする。
const SHARED_RETURN_BONUS_CAP = 0.15;
const FIGHTING_SPIRIT_RETURN_BONUS = 0.08;
const FIGHTING_SPIRIT_HP_RATIO = 0.3;

// K-6(2026-09-25 Keisuke裁定A): 観戦演出の「大ダメージ」は被弾側の最大HPに対する割合で決める。
// 旧定義の絶対値(大ダメージ dmg≥15 / 赤フラッシュ等 dmg≥20)は、最大HPの式(通常 141+2.5×ST・
// 大一番 272+3.5×ST)でダメージ全体が膨らんだ結果、同格戦の命中のほぼ全部で成立し「全部が山場」になっていた。
//   大ダメージ(frame.action.isCrit)  : 被弾側の最大HPの12%以上。同格の通常戦で1試合約4回、大一番で約3回
//   特大    (frame.action.isHeavy) : 同18%以上。大ダメージの上の段(赤フラッシュ・溜め・長めの間)。通常戦で1試合約1回
// 使い道はフレームの演出フラグと実況ログの「大ダメージ！」注記の選択だけ。勝敗・MQ・乱数には一切関与しない
// (MQの「大技(10ダメ以上)」項 bigMoves は別物で、変えていない)。整数で比べて浮動小数の端数を避ける。
const BIG_HIT_HP_PCT = 12;
const HEAVY_HIT_HP_PCT = 18;
// K-6 追加(2026-09-26 Keisuke回答): 最大HPの式が違う大一番とタッグは、段の割合を持ち替える。
// どの形式でも「特大は大ダメージの約3割」にそろう(同格・平坦ステ OVR70/85/100・各3000試合の実測)。
//   大一番(matchTier 2): 最大HP 272+3.5×ST が大きく、1撃が最大HPの13〜16%止まりで特大18%が一度も出なかった
//     → 特大だけ13.75%へ(1試合0.6〜1.2回・実ロスター近接1.0回)。大ダメージは12%のまま(2.6〜3.3回)。
//     13.5%は0.9〜1.6回、14%は0.5〜0.8回。13.75は2進で正確に表せるので、下の比較に端数は出ない
//   タッグ: 最大HP 70+ST が小さく、12%では命中の6〜7割が大ダメージだった(1試合約19回)
//     → 大ダメージ17%(3.7〜4.8回・実ロスター近接4.8回)、特大20%(1.4〜1.6回・同2.0回。赤フラッシュ・溜め)
const BIGMATCH_HEAVY_HIT_HP_PCT = 13.75;
const TAG_BIG_HIT_HP_PCT = 17;
const TAG_HEAVY_HIT_HP_PCT = 20;
const HIT_BANDS = {
  normal:   { big: BIG_HIT_HP_PCT, heavy: HEAVY_HIT_HP_PCT },
  bigMatch: { big: BIG_HIT_HP_PCT, heavy: BIGMATCH_HEAVY_HIT_HP_PCT },
  tag:      { big: TAG_BIG_HIT_HP_PCT, heavy: TAG_HEAVY_HIT_HP_PCT },
};

// K-6 追加: 丸め込み決着の実況で「大金星」を言うのは格下が勝ったときだけ。
// 格下の基準は新聞・試合結果の「番狂わせ」(app.js の isUpset: 勝者のOVRが敗者より8を超えて低い)にそろえる。
const UPSET_OVR_GAP = 8;

// 技候補はモジュール初期化時に一度だけ威力ティアへ分類する。
// 丸め込みは独立抽選なので、通常ティアの候補からは除外する。
const MOVE_TIER_POOLS = {};
const ROLLUP_MOVES = commonMoves.filter(move => move.c === 'rollup');
const MOVE_BY_NAME = new Map();
[...commonMoves, ...Object.values(styleMoves).flat()].forEach(move => {
  if (!MOVE_BY_NAME.has(move.n)) MOVE_BY_NAME.set(move.n, move);
});
Object.keys(styleMoves).forEach(style => {
  const moves = [...commonMoves, ...styleMoves[style]].filter(move => move.c !== 'rollup');
  MOVE_TIER_POOLS[style] = {
    small: moves.filter(move => move.d >= 2 && move.d <= 5),
    medium: moves.filter(move => move.d >= 6 && move.d <= 10),
    big: moves.filter(move => move.d >= 11 && move.d <= 16),
  };
});

function createMoveSelectionStats() {
  return {
    total: 0,
    rollup: 0,
    finisher: 0,
    forcedFinisher: 0,
    consecutiveBig: 0,
    byPhase: {},
    _lastTierByFighter: {},
  };
}

function snapshotMoveSelectionStats(stats) {
  return {
    total: stats.total,
    rollup: stats.rollup,
    finisher: stats.finisher,
    forcedFinisher: stats.forcedFinisher,
    consecutiveBig: stats.consecutiveBig,
    byPhase: stats.byPhase,
  };
}

// 時間切れでも勝敗は必ず決める。残りHPが同じ場合は試合中の優勢度、
// それも同じなら試合用のseeded RNGで判定するため、通常の試合結果にdrawを作らない。
function resolveTimeoutWinner(leftHp, rightHp, leftControl, rightControl, rng, leftWinner, rightWinner) {
  if (leftHp > rightHp) return leftWinner;
  if (rightHp > leftHp) return rightWinner;
  if (leftControl > rightControl) return leftWinner;
  if (rightControl > leftControl) return rightWinner;
  return Engine.rng.float(rng) < 0.5 ? leftWinner : rightWinner;
}

// ── Battle Engine (DOM-free) ──────────────────────────
Engine.battle = {
    // MQ再設計P3c(mq-redesign-proposal-v0.5 §3.7b): OV100超の減衰シーリング。
    // 第4セグメントを追加するのみ — avgOV<=100の3セグメントは既存式のまま完全不変。
    ovCeiling(avgOV) {
      let ceiling;
      if (avgOV <= 50) ceiling = 20 + avgOV * 0.60;
      else if (avgOV <= 80) ceiling = 50 + (avgOV - 50) * 1.10;
      else if (avgOV <= 100) ceiling = 83 + (avgOV - 80) * 0.85;
      else ceiling = 100 + (avgOV - 100) * 0.25;
      return Engine.util.clamp(ceiling, 15, Infinity);
    },
    pacingPenalty(matchTurns, tier, hasHikidashi) {
      const limits = tier >= 2
        ? (hasHikidashi ? { ideal: 14, ok: 10 } : { ideal: 18, ok: 14 })
        : (hasHikidashi ? { ideal: 6, ok: 4 } : { ideal: 8, ok: 6 });
      if (matchTurns >= limits.ideal) return 0;
      if (matchTurns >= limits.ok) return 3;
      return 12;
    },
    phase(t, _phases) {
      const p = _phases || PHASES;
      return p.find(pp => t >= pp.min && t <= pp.max) || p[p.length - 1];
    },
    moveTier(move) {
      if (!move || move.c === 'rollup') return 'rollup';
      if (move.d <= 5) return 'small';
      if (move.d <= 10) return 'medium';
      return 'big';
    },
    // K-6: 演出専用の段判定(被弾側の最大HP比。定義はファイル先頭の HIT_BANDS)。
    // 最大HPを正しく知っているのはエンジンだけなので、ここで決めてフレームに焼き、観戦iframeは読むだけにする。
    // bands は hitBands(kind) の戻り値(省略時は通常戦の 12% / 18%)。
    hitBands(kind) {
      return HIT_BANDS[kind] || HIT_BANDS.normal;
    },
    isBigHit(dmg, defMhp, bands) {
      const pct = (bands || HIT_BANDS.normal).big;
      return dmg > 0 && defMhp > 0 && dmg * 100 >= defMhp * pct;
    },
    isHeavyHit(dmg, defMhp, bands) {
      const pct = (bands || HIT_BANDS.normal).heavy;
      return dmg > 0 && defMhp > 0 && dmg * 100 >= defMhp * pct;
    },
    // K-6 追加: 格下の勝利か(丸め込みの「大金星」の実況だけに使う。定義はファイル先頭の UPSET_OVR_GAP)
    isUpsetWin(winnerOvr, loserOvr) {
      return winnerOvr < loserOvr - UPSET_OVR_GAP;
    },
    // numeric-overhaul P1: 内部戦闘力 = 5ステのべき平均(p=powerMeanP)。
    // ダメージのOVR比補正だけがこれを参照する。p=1で算術平均(旧仕様)と一致し、
    // p>1は尖った配分ほど高く出る=尖りプレミアムの実体。スケール不変なので
    // 「相対的な尖り」に反応する。表示OVR(番付/給料/MQ天井/開幕大技判定)は
    // 従来どおり算術平均のまま — 「尖った子は同じ番付でも一撃が重い」を作る。
    battlePower(c, _eng) {
      const p = (_eng || ENG).powerMeanP || 1;
      if (p === 1) return (c.pw + c.sp + c.te + c.st + c.mn) / 5;
      return Math.pow(
        (Math.pow(c.pw, p) + Math.pow(c.sp, p) + Math.pow(c.te, p) + Math.pow(c.st, p) + Math.pow(c.mn, p)) / 5,
        1 / p);
    },
    findMoveByName(name) {
      return MOVE_BY_NAME.get(name) || null;
    },
    openingExecutionConfig(gap, _eng) {
      const eng = _eng || ENG;
      return eng.openingExecution.gapBands.find(band => gap >= band.minGap) || null;
    },
    rollOpeningExecutionDamage(rng, gap, maxHp, _eng) {
      const eng = _eng || ENG;
      const config = Engine.battle.openingExecutionConfig(gap, eng);
      const band = Engine.rng.weighted(rng, config.damageW);
      const [minRatio, maxRatio] = eng.openingExecution.damageRanges[band];
      const ratio = minRatio + Engine.rng.float(rng) * (maxRatio - minRatio);
      return { band, ratio, damage: Math.round(maxHp * ratio) };
    },
    selMove(rng, style, turn, _phases, context) {
      const ph = Engine.battle.phase(turn, _phases);
      const resolvedStyle = (style && styleMoves[style] && catW[style]) ? style : 'Allround';
      const ctx = context || {};
      const fighter = ctx.fighter || null;
      const wasCoolingDown = !!(fighter && fighter.bigMoveCooldown);
      if (fighter) fighter.bigMoveCooldown = false;
      const eng = ctx.eng || ENG;
      const defender = ctx.defender;
      const defenderHpRatio = defender ? defender.hp / defender.mhp : 1;
      const finisherUnlocked = defenderHpRatio <= eng.finisherUnlockHpThreshold;

      let move;
      let tier;
      if (!ctx.forcedTier && ph.rollupRate > 0 && Engine.rng.float(rng) * 100 < ph.rollupRate) {
        tier = 'rollup';
        move = Engine.rng.pick(rng, ROLLUP_MOVES);
      } else {
        if (ctx.forcedTier) {
          tier = ctx.forcedTier;
        } else {
          const tierWeights = { ...ph.tierW };
          // Normal big moves (d11-13) cool down for one turn. Finishers
          // (d14-16) are exempt, so an unlocked finisher remains selectable.
          if (wasCoolingDown && !finisherUnlocked) tierWeights.big = 0;
          const selectableTierWeights = Object.fromEntries(
            Object.entries(tierWeights).filter(([, weight]) => weight > 0)
          );
          tier = Engine.rng.weighted(rng, selectableTierWeights);
        }

        let pool = MOVE_TIER_POOLS[resolvedStyle][tier];
        if (tier === 'big' && !ctx.ignoreFinisherLock) {
          if (!finisherUnlocked) {
            pool = pool.filter(candidate => candidate.d <= 13);
          } else if (wasCoolingDown) {
            pool = pool.filter(candidate => candidate.d >= 14);
          }
        }

        // 通常は全スタイル・全ティアに候補がある。データ破損時だけ全候補へ退避する。
        if (!pool.length) pool = Object.values(MOVE_TIER_POOLS[resolvedStyle]).flat();
        const presentCategories = new Set(pool.map(candidate => candidate.c));
        const categoryWeights = Object.fromEntries(
          Object.entries(catW[resolvedStyle]).filter(([category, weight]) => weight > 0 && presentCategories.has(category))
        );
        const category = Object.keys(categoryWeights).length
          ? Engine.rng.weighted(rng, categoryWeights)
          : null;
        const candidates = category ? pool.filter(candidate => candidate.c === category) : pool;
        move = Engine.rng.pick(rng, candidates);
        if (fighter && move.d >= 11 && move.d <= 13) fighter.bigMoveCooldown = true;
      }

      const stats = ctx.stats;
      if (stats) {
        stats.total++;
        if (tier === 'rollup') stats.rollup++;
        if (move.d >= 14) {
          stats.finisher++;
          if (ctx.forcedTier) stats.forcedFinisher++;
        }
        if (!stats.byPhase[ph.name]) stats.byPhase[ph.name] = { small: 0, medium: 0, big: 0, rollup: 0 };
        stats.byPhase[ph.name][tier]++;
        if (fighter) {
          const fighterKey = String(fighter.id != null ? fighter.id : fighter.name);
          const isNormalBig = !ctx.forcedTier && move.d >= 11 && move.d <= 13;
          if (stats._lastTierByFighter[fighterKey] === 'normalBig' && isNormalBig) stats.consecutiveBig++;
          stats._lastTierByFighter[fighterKey] = isNormalBig ? 'normalBig' : 'other';
        }
      }
      return move;
    },
    // numeric-overhaul P1: 命中はTEとSPの「差」で決まる(絶対値参照はレンジインフレで
    // 上限98に張り付き、TEの差が消えていた)。同格(TE=SP)ではhitBaseがそのまま出る。
    calcHitRate(mv, atk, def) {
      const baseAcc = ENG.hitBase[Math.min(mv.d, 16)] || 70;
      let rate = baseAcc + (atk.te - def.sp) * ENG.hitDiffScale;
      // 威圧感: 相手の命中率を低下させる
      if (Traits.has(def, '威圧感')) rate -= 2;
      return Engine.util.clamp(rate, ENG.hitMin, ENG.hitMax);
    },
    // numeric-overhaul P1: カウンターも差分参照(防御側TE − 攻撃側SP)。
    // 同格の実効値は旧式と同一(counterBase 1.5 = 旧3+5.5-7)。テクニシャンの見せ場。
    calcCounterRate(atk, def, ph) {
      let rate = ENG.counterBase + (def.te - atk.sp) * ENG.counterDiffScale + ph.counterBonus;
      if (def.gritTurns > 0) rate += ENG.gritCounterBonus;
      // 威圧感: 相手のカウンター率を低下させる
      if (Traits.has(atk, '威圧感')) rate -= 2;
      return Engine.util.clamp(rate, ENG.counterMin, ENG.counterMax);
    },
    calcDamage(rng, mv, atk, def, mom, atkSide, ph) {
      // numeric-overhaul P2: eff()残骸(素通し恒等関数)を撤去。値は生のステをそのまま使う
      const base = mv.d + (atk.pw * ENG.dmgPwrScale) + (atk.te * ENG.dmgTecScale)
        + (atk.sp * ENG.dmgSpdScale);
      const defense = (def.st * ENG.defStaScale) + (def.mn * ENG.defMntScale);
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
    // numeric-overhaul P1: MN80超はハードクランプ(旧0.45)からsoft-knee漸近へ。
    // 「MN90超がフォール脱出に1ptも効かない」死に帯の根治。盛った1ptは必ず効く。
    calcKickoutChance(def, ph, _eng, popAdv, popMult) {
      const e = _eng || ENG;
      const knee = e.kickoutKnee;
      let chance = def.mn <= knee.start
        ? (def.mn / 100) * e.kickoutMnScale
        : knee.base + knee.range * (1 - Math.exp(-(def.mn - knee.start) / knee.scale));
      if (popAdv != null) chance += popAdv * 0.07 * (popMult || 1);
      if (ph.name === 'Climax') chance *= e.kickoutClimaxMult;
      // 闘志: HP低下時のキックアウト率UP
      chance += Engine.battle.fightingSpiritBonus(def);
      chance = Engine.util.clamp(chance, 0.05, knee.cap);
      if (def.kickoutCount >= e.kickoutMax) chance = 0;
      return chance;
    },
    // 闘志(片側の返し): HP30%未満で返す力が上乗せされる。HP0のキックアウトとフォール狙いの返しが共有する(K-7)
    fightingSpiritBonus(def) {
      return (Traits.has(def, '闘志') && def.hp / def.mhp < FIGHTING_SPIRIT_HP_RATIO) ? FIGHTING_SPIRIT_RETURN_BONUS : 0;
    },
    // K-7: HP0判定の脱出率に「返し」の上乗せを足す。上限は式そのものの上限(soft-kneeのcap: 0.60/0.52)。
    // 旧実装は加算後に0.45/0.40で頭打ちにしていたため、MNの高い選手ほど上乗せを足すと脱出率が下がる逆転があった。
    // また回数上限(kickoutMax/guEscapeMax)に達して0になった側を上乗せで生き返らせていたので、それも止める。
    addReturnBonus(chance, bonus, cap) {
      if (!(chance > 0) || !(bonus > 0)) return chance;
      return Math.max(chance, Math.min(chance + bonus, cap));
    },
    calcGuEscapeChance(def, ph, _eng, popAdv, popMult) {
      const e = _eng || ENG;
      const knee = e.guEscapeKnee;
      let chance = def.mn <= knee.start
        ? (def.mn / 100) * e.guEscapeMnScale
        : knee.base + knee.range * (1 - Math.exp(-(def.mn - knee.start) / knee.scale));
      if (popAdv != null) chance += popAdv * 0.07 * (popMult || 1);
      if (ph.name === 'Climax') chance *= 0.8;
      chance = Engine.util.clamp(chance, 0.05, knee.cap);
      if (def.kickoutCount >= e.guEscapeMax) chance = 0;
      return chance;
    },
    // K-7: _eng はシングルの試合のTier別設定(大一番は BIGMATCH_ENG の成功基礎14・Climax+18。閾値は通常と同じ35%)。
    // 旧実装はグローバル ENG を直接読んでいたため、大一番の値がフォール狙いに一度も効いていなかった。
    // タッグは引数を渡さない(従来どおり ENG)。
    checkPinAttempt(rng, mv, atk, def, dmg, mom, atkSide, ph, _eng) {
      const e = _eng || ENG;
      if (def.hp <= 0) return false;
      const defHpRatio = def.hp / def.mhp;
      if (defHpRatio > e.pinAttemptHpThreshold) return false;
      if (dmg < e.pinAttemptMinDmg) return false;
      if (ph.name === 'Opening') return false;
      let attemptRate = e.pinAttemptBaseRate;
      const mAdv = atkSide === 'left' ? mom : -mom;
      attemptRate += mAdv * e.pinAttemptMomBonus;
      if (ph.name === 'Climax') attemptRate += 15;
      if (ph.name === 'End') attemptRate += 8;
      // 低HPほど急激にピン試行率アップ (HP0%で+70、HP10%で+50、HP20%で+30)
      attemptRate += Math.max(0, (e.pinAttemptHpThreshold - defHpRatio) * e.pinLowHpAttemptScale);
      return Engine.rng.float(rng) * 100 < Engine.util.clamp(attemptRate, 10, 95);
    },
    calcPinAttemptSuccess(atk, def, dmg, ph, _eng) {
      const e = _eng || ENG;
      let rate = e.pinAttemptSuccessBase + (dmg * 0.5) - (def.mn * e.pinAttemptMntPenalty);
      if (ph.name === 'Climax') rate += e.pinAttemptClimax;
      if (def.gritTurns > 0) rate -= 10;
      // 低HPほど決まりやすい (HP0%で+35、HP10%で+25、HP20%で+15)
      const defHpRatio = def.hp / def.mhp;
      rate += Math.max(0, (e.pinAttemptHpThreshold - defHpRatio) * e.pinLowHpSuccessScale);
      return Engine.util.clamp(rate, 8, 80);
    },
    // K-7: フォール狙いの成功率(%)に防御側の「返し」の上乗せを入れる。HP0判定と同じ規則で、
    // 返す確率(100−成功率)に足し、上限は式の上限(フォール0.60/締め0.52)。成功率を直接引く形だと
    // クランプ(8〜80)の手前で上乗せが消えたり(通常戦のClimax)、重ねると3カウントがほぼ入らなくなったりした。
    applyPinReturnBonus(successRate, bonus, cap) {
      const ret = Engine.battle.addReturnBonus(1 - successRate / 100, bonus, cap);
      return (1 - ret) * 100;
    },

    // Main match simulation — pure function, no DOM
    // matchTier: 1=通常, 2=ビッグマッチ(PPV/タイトル/対抗戦)
    // opts: { recordFrames: boolean }  — 観戦用にターン毎のスナップショットを記録
    simulateMatch(charL, charR, rng, matchTier, opts) {
      const clamp = Engine.util.clamp;
      const B = Engine.battle;
      const recordFrames = !!(opts && opts.recordFrames);

      const tier = matchTier || 1;
      const maxT    = tier >= 2 ? BIGMATCH_MAX_T    : MAX_T;
      const phases  = tier >= 2 ? BIGMATCH_PHASES   : PHASES;
      const eng     = tier >= 2 ? BIGMATCH_ENG      : ENG;
      // K-6 追加: 演出専用の段(大ダメージ/特大)の割合。大一番は特大だけ下げる(ファイル先頭の HIT_BANDS)
      const hitBands = B.hitBands(tier >= 2 ? 'bigMatch' : 'normal');
      const popularityInfluence = opts && opts.popularityInfluence != null ? opts.popularityInfluence : 1.0;

      const fullHpL = Math.round(eng.hpBase + charL.st * eng.hpScale);
      const fullHpR = Math.round(eng.hpBase + charR.st * eng.hpScale);
      const L = {
        ...charL, hp: charL._hpOverride != null ? charL._hpOverride : fullHpL,
        mhp: fullHpL, gritTurns: 0, kickoutCount: 0, consecutiveHits: 0,
        bigMoveCooldown: false, openingCounterBoost: false
      };
      const R = {
        ...charR, hp: charR._hpOverride != null ? charR._hpOverride : fullHpR,
        mhp: fullHpR, gritTurns: 0, kickoutCount: 0, consecutiveHits: 0,
        bigMoveCooldown: false, openingCounterBoost: false
      };

      let mom = 0, turn = 1, log = [], winner = null, finType = null, finMove = null, finishPhase = null;
      // i18n Stage B P7-53(裁定C-6): 実況ログはテンプレID + パラメータで積む。
      // logには従来と1バイト同一のJA完成文が入る(=result.logは不変)。フレームには
      // テンプレID由来の tpl/vars と言語非依存の分類(cls/spoiler)を併記し、
      // 観戦iframe(battle-engine-main.js)の表示点が WM_I18N.t で引き直す(§14-3)。
      // **Engineは WM_I18N を呼ばない**(§1) — ここはJAの組み立てだけを行う。
      const logTpl = [], logVars = [], logCls = [], logSpoiler = [];
      function pushLog(id, params) {
        const tpl = BATTLE_LOG_TEMPLATES.single[id];
        const kind = BATTLE_LOG_LINE_KINDS.single[id] || { cls: null, spoiler: false };
        log.push(fillTemplateVars(tpl, params));
        logTpl.push(tpl);
        logVars.push(params || {});
        logCls.push(kind.cls);
        logSpoiler.push(!!kind.spoiler);
      }
      // 威圧感: 序盤モメンタム優位（左+/右-）
      if (Traits.has(charL, '威圧感') && !Traits.has(charR, '威圧感')) mom += 3;
      if (Traits.has(charR, '威圧感') && !Traits.has(charL, '威圧感')) mom -= 3;
      // v5.1 パターンB: TE/SP/PW差で試合開始時ボーナス（試合長に依存しない一発バフ）
      const _teGap = (charL.te - charR.te) / 100;  // -1〜+1
      const _spGap = (charL.sp - charR.sp) / 100;
      const _pwGap = (charL.pw - charR.pw) / 100;
      mom += (_teGap + _spGap) * 10 + _pwGap * 8;  // PW+30なら mom+2.4 追加
      // 先攻3ターンの命中/回避バフ（leftが正なら左有利）
      const _techLead = _teGap * 15;  // TE+30 → +4.5pt
      const _spdLead  = _spGap * 15;  // SP+30 → 相手命中-4.5pt
      // 先攻3ターンのカウンター率ペナルティ（PW優位な側が攻撃時、相手のカウンター率DOWN）
      const _pwLead   = _pwGap * 10;  // PW+30 → 相手カウンター率-3.0pt
      const _ovrL = Engine.util.ov(charL);
      const _ovrR = Engine.util.ov(charR);
      const _openingExecutionGap = Math.abs(_ovrL - _ovrR);
      const _openingExecutionStrongerSide = _openingExecutionGap >= 15
        ? (_ovrL > _ovrR ? 'left' : 'right')
        : null;
      let _openingExecutionChecked = false;
      let _openingExecutionData = null;
      let totalCounters = 0, totalKickouts = 0, leadChanges = 0, lastLeader = null, bigMoves = 0;
      const moveSelectionStats = createMoveSelectionStats();
      // 名勝負製造機: ドラマ素材（キックアウト・カウンター）の発生率UP
      // 仕様(v2.1): 双方持ちでも効果は1試合1回分のみ（boolean OR で重複適用なし）
      const hasMeishoubu = Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機');
      // 引き出し上手: 格下戦でのペーシング減点緩和
      const hasHikidashi = Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手');

      // MQ再設計P3b(mq-redesign-proposal-v0.4 §3.3〜§3.6): 因縁/タイトル/trust/バフを
      // 固定MQ加算ではなく「シムへの入力」として受け取る。因縁段階・タイトル戦フラグは
      // 名勝負製造機と同じ機構(カウンター率・脱出率)に乗る。trust/バフはOV参照(シーリング)を
      // その試合限りで補正する。呼び出し元は Engine.mq.buildRingInOpts で事前に解決して渡す。
      const ringOpts = opts || {};
      const rivalryRing = ringOpts.rivalryRing || null;
      const titleRingMatch = !!ringOpts.titleMatch;
      const ringCounterBonus = (rivalryRing ? (Number(rivalryRing.counterPt) || 0) : 0)
        + (titleRingMatch ? TITLE_RING_COUNTER_BONUS : 0);
      const ringEscapeBonus = (rivalryRing ? (Number(rivalryRing.escape) || 0) : 0)
        + (titleRingMatch ? TITLE_RING_ESCAPE_BONUS : 0);
      // 通常興行の防衛戦でのみ渡される、王者個人のごく小さな土壇場補正。
      const championDefenseEscape = Array.isArray(ringOpts.championDefenseEscape)
        ? ringOpts.championDefenseEscape : [0, 0];
      // K-7: 両者に同じだけ効く「返し」の上乗せ(名勝負製造機・因縁・王座戦)。HP0判定とフォール狙いが共有する。
      // 重ねても SHARED_RETURN_BONUS_CAP まで(カウンター率側の上乗せは従来どおり足し算・counterMaxで頭打ち)。
      const sharedReturnBonus = Math.min((hasMeishoubu ? MEISHOUBU_ESCAPE_BONUS : 0) + ringEscapeBonus, SHARED_RETURN_BONUS_CAP);
      // 防衛王者の土壇場(片側)。defIsLeft: 返す側(防御側)が左か
      const championReturnBonus = (defIsLeft) => Number(championDefenseEscape[defIsLeft ? 0 : 1]) || 0;
      const trustRingDebuff = Array.isArray(ringOpts.trustDebuff) ? ringOpts.trustDebuff : [0, 0];
      const buffRingBonus = Array.isArray(ringOpts.ovBuff) ? ringOpts.ovBuff : [0, 0];
      const ringOvAdjustL = (Number(trustRingDebuff[0]) || 0) + (Number(buffRingBonus[0]) || 0);
      const ringOvAdjustR = (Number(trustRingDebuff[1]) || 0) + (Number(buffRingBonus[1]) || 0);

      // ── フレーム記録（観戦用） ──
      // ターン毎に1フレーム push。battle-engine.html (リプレイ版) が再生する。
      const frames = recordFrames ? [] : null;
      let _turnLogStart = 0;
      let _turnAction = null;
      let _turnKickout = null;   // { count, escapeType: 'fall'|'tko'|'gu' }
      let _turnPinAttempt = null; // 'success' | 'kickout2'
      let _turnRollup = null;     // 'success' | 'kickout2'(K-7: 丸め込みをカウント2で返した)
      let _turnTkoStop = false;
      function pushFrame(phName) {
        if (!recordFrames) return;
        const _newHpL = Math.max(0, L.hp);
        const _newHpR = Math.max(0, R.hp);
        // MISS フレームで HP が前フレームから減っていたら異常（Bug #1 ガード）
        if (_turnAction && _turnAction.kind === 'miss' && frames.length > 0) {
          const _prev = frames[frames.length - 1];
          if (_newHpL < _prev.hpL || _newHpR < _prev.hpR) {
            try { console.warn(`[WM Debug] MISS frame HP decrease detected: turn=${turn} dL=${_prev.hpL - _newHpL} dR=${_prev.hpR - _newHpR}`); } catch(e){}
          }
        }
        frames.push({
          turn,
          phase: phName,
          hpL: _newHpL,
          hpR: _newHpR,
          mhpL: L.mhp,
          mhpR: R.mhp,
          mom,
          gritL: L.gritTurns | 0,
          gritR: R.gritTurns | 0,
          kickoutCountL: L.kickoutCount | 0,
          kickoutCountR: R.kickoutCount | 0,
          consecL: L.consecutiveHits | 0,
          consecR: R.consecutiveHits | 0,
          logLines: log.slice(_turnLogStart),
          // P7-53: 表示点(観戦iframe)が言語別に組み直すためのテンプレIDと値、
          // および言語非依存の演出分類。logLinesと同じ添字で並ぶ。
          logLineTpls: logTpl.slice(_turnLogStart),
          logLineVars: logVars.slice(_turnLogStart),
          logLineClasses: logCls.slice(_turnLogStart),
          logLineSpoilers: logSpoiler.slice(_turnLogStart),
          action: _turnAction,
          kickout: _turnKickout,
          pinAttempt: _turnPinAttempt,
          rollup: _turnRollup,
          tkoStop: _turnTkoStop || undefined,
          winner: winner || null,
          finType: winner ? finType : null,
          finMove: winner ? finMove : null,
          finishPhase: winner ? finishPhase : null,
        });
      }

      while (turn <= maxT && !winner) {
        const ph = B.phase(turn, phases);
        _turnLogStart = log.length;
        _turnAction = null;
        _turnKickout = null;
        _turnPinAttempt = null;
        _turnRollup = null;
        _turnTkoStop = false;
        const _popAdvL = ((L.popularity || 50) - (R.popularity || 50)) / 100 * popularityInfluence;
        const _popMultL = (tier >= 2 ? 2.0 : 1.0);
        const leftChance = 50 + mom * 0.05 + _popAdvL * 6 * _popMultL;
        const isLeftAtk = Engine.rng.float(rng) * 100 < leftChance;
        const atk = isLeftAtk ? L : R;
        const def = isLeftAtk ? R : L;
        const atkSide = isLeftAtk ? 'left' : 'right';
        const openingCounterBoost = !!atk.openingCounterBoost;
        if (openingCounterBoost) atk.openingCounterBoost = false;
        if (openingCounterBoost && _openingExecutionData) {
          _openingExecutionData.counterBoostUsed = true;
          _openingExecutionData.counterBoostTurn = turn;
          _openingExecutionData.counterBoostDamage = 0;
        }

        // OVR差15以上の格上がOpeningで得た最初の攻撃ターンに一度だけ判定する。
        // 対象外カードではこの分岐に入らず、追加の乱数を一切消費しない。
        if (_openingExecutionStrongerSide === atkSide && ph.name === 'Opening' && !_openingExecutionChecked) {
          _openingExecutionChecked = true;
          const executionConfig = B.openingExecutionConfig(_openingExecutionGap, eng);
          const fires = Engine.rng.float(rng) * 100 < executionConfig.triggerRate;
          if (fires) {
            const mv = B.selMove(rng, atk.style, turn, phases, {
              fighter: atk,
              defender: def,
              eng,
              stats: moveSelectionStats,
              forcedTier: 'big',
              ignoreFinisherLock: true,
            });
            const hit = Engine.rng.float(rng) * 100 < executionConfig.hitRate;
            _openingExecutionData = {
              openingExecution: true,
              turn,
              attackerSide: atkSide,
              attackerId: atk.id,
              defenderId: def.id,
              move: mv.n,
              moveD: mv.d,
              moveCat: mv.c,
              ovrGap: _openingExecutionGap,
              hit,
              damage: 0,
              damageRatio: 0,
              damageBand: null,
              defenderMaxHp: def.mhp,
              finished: false,
            };

            if (!hit) {
              def.openingCounterBoost = true;
              mom += isLeftAtk ? -eng.counterMomShift : eng.counterMomShift;
              pushLog('openingExecMiss', { turn, name: atk.name, move: mv.n, name2: def.name });
              if (recordFrames) {
                _turnAction = {
                  kind: 'miss', atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c,
                  dmg: 0, isCrit: false, isBig: true, openingExecution: true,
                  openingExecutionHit: false, openingExecutionDamageRatio: 0,
                  openingExecutionOvrGap: _openingExecutionGap,
                };
              }
            } else {
              const executionDamage = B.rollOpeningExecutionDamage(rng, _openingExecutionGap, def.mhp, eng);
              const dmg = executionDamage.damage;
              def.hp -= dmg;
              mom += isLeftAtk ? 8 : -8;
              atk.consecutiveHits++;
              def.consecutiveHits = 0;
              bigMoves++;
              _openingExecutionData.damage = dmg;
              _openingExecutionData.damageRatio = executionDamage.ratio;
              _openingExecutionData.damageBand = executionDamage.band;
              pushLog('openingExecHit', { turn, name: atk.name, move: mv.n, name2: def.name, dmg, hp: Math.max(0, def.hp), mhp: def.mhp });
              if (recordFrames) {
                // 開幕大技の命中は常に大ダメージ扱い(ログも固定で「大ダメージ！」)。特大は実ダメージで判定(K-6)
                _turnAction = {
                  kind: 'hit', atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c,
                  dmg, isCrit: true, isHeavy: B.isHeavyHit(dmg, def.mhp, hitBands), isBig: true, openingExecution: true,
                  openingExecutionHit: true, openingExecutionDamageRatio: executionDamage.ratio,
                  openingExecutionDamageBand: executionDamage.band,
                  openingExecutionOvrGap: _openingExecutionGap,
                };
              }

              if (def.hp <= 0) {
                const fType = B.determineFinishType(rng, mv);
                const finLabel = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
                winner = atkSide;
                finType = finLabel;
                finMove = mv.n;
                finishPhase = ph.name;
                _openingExecutionData.finished = true;
                pushLog(fType === 'fall' ? 'openingFinishFall' : fType === 'gu' ? 'openingFinishGu' : 'openingFinishTko',
                  { name: atk.name, move: mv.n });
                if (recordFrames) {
                  if (fType === 'tko') _turnTkoStop = true;
                  else if (fType === 'gu') {
                    _turnPinAttempt = 'success';
                    _turnKickout = { count: 0, escapeType: 'gu' };
                  } else {
                    _turnPinAttempt = 'success';
                  }
                }
              }
            }

            mom = clamp(mom, -50, 50);
            pushFrame(ph.name);
            turn++;
            continue;
          }
        }

        const mv = B.selMove(rng, atk.style, turn, phases, { fighter: atk, defender: def, eng, stats: moveSelectionStats });
        const moveTier = B.moveTier(mv);
        let hitRate = B.calcHitRate(mv, atk, def);
        // v5.1 パターンB: 先攻3ターンの命中/回避バフ（TE/SP優位な側が攻撃時に命中UP）
        if (turn <= 3) {
          const _flatLead = _techLead + _spdLead;
          hitRate += isLeftAtk ? _flatLead : -_flatLead;
          hitRate = Engine.util.clamp(hitRate, ENG.hitMin, ENG.hitMax);
        }
        const roll = Engine.rng.float(rng) * 100;

        if (roll > hitRate) {
          pushLog('miss', { turn, name: atk.name, move: mv.n });
          mom += isLeftAtk ? -5 : 5;
          if (recordFrames) {
            _turnAction = { kind: 'miss', atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c, dmg: 0, isCrit: false, isBig: false };
          }
        } else {
          let counterRate = B.calcCounterRate(atk, def, ph);
          const counterFlatBonus = (hasMeishoubu ? 5 : 0) + ringCounterBonus;
          if (counterFlatBonus > 0) counterRate = Math.min(counterRate + counterFlatBonus, ENG.counterMax);
          // v5.1 パターンB: 先攻3ターン PW優位な側が攻撃時、相手カウンター率ペナルティ
          if (turn <= 3) {
            counterRate -= isLeftAtk ? _pwLead : -_pwLead;
            counterRate = Engine.util.clamp(counterRate, ENG.counterMin, ENG.counterMax);
          }
          if (Engine.rng.float(rng) * 100 < counterRate) {
            const cMv = B.selMove(rng, def.style, turn, phases, { fighter: def, defender: atk, eng, stats: moveSelectionStats });
            // タスク69: カウンター成立ダメージは元々OVR差に無反応(mv.d*counterDmgMultのみ)だった。
            // counterOvrGapMixin(0〜1)で通常打撃と同じOVR比補正をどれだけ混ぜるかを制御する(既定0=旧仕様のまま)。
            let _counterOvrMult = 1;
            if (eng.counterOvrGapMixin > 0) {
              const _cAtkOvr = B.battlePower(def, eng);
              const _cDefOvr = B.battlePower(atk, eng);
              const _fullCounterOvrMult = Math.pow(_cAtkOvr / Math.max(1, _cDefOvr), eng.ovrGapDmgExponent);
              _counterOvrMult = 1 + (_fullCounterOvrMult - 1) * eng.counterOvrGapMixin;
            }
            const cDmg = Math.max(eng.dmgFloor, Math.round(mv.d * eng.counterDmgMult * _counterOvrMult));
            atk.hp = B.moveTier(cMv) === 'small' ? Math.max(1, atk.hp - cDmg) : atk.hp - cDmg;
            mom += isLeftAtk ? -eng.counterMomShift : eng.counterMomShift;
            def.consecutiveHits = 0;
            totalCounters++;
            pushLog('counter', { turn, name: atk.name, move: mv.n, name2: def.name, move2: cMv.n, dmg: cDmg });
            if (recordFrames) {
              // K-6: 被弾するのは切り返された攻撃側(atk)なので、その最大HPで段を決める
              _turnAction = { kind: 'counter', atkSide: isLeftAtk ? 'right' : 'left', move: mv.n, counterMove: cMv.n, moveD: mv.d, moveCat: mv.c, dmg: cDmg, isCrit: B.isBigHit(cDmg, atk.mhp, hitBands), isHeavy: B.isHeavyHit(cDmg, atk.mhp, hitBands), isBig: cDmg >= 10 };
            }
          } else {
            let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
            // v5.0 M1: OVR比ダメージ補正 — numeric-overhaul P1でべき平均(battlePower)参照へ
            const _atkOvr = B.battlePower(atk, eng);
            const _defOvr = B.battlePower(def, eng);
            const _ovrMult = Math.pow(_atkOvr / Math.max(1, _defOvr), eng.ovrGapDmgExponent);
            // v5.0 popularity: 防御側人気優位で被ダメ軽減
            const _popAdvD = ((def.popularity || 50) - (atk.popularity || 50)) / 100 * popularityInfluence;
            const _popMultD = (tier >= 2 ? 2.0 : 1.0);
            // v5.1 MN: 終盤の粘り（End +8% / Climax +12% 被ダメ軽減、MN50超過分のみ）
            let _mnLateMult = 1.0;
            if (ph.name === 'End') _mnLateMult = 1 - Math.max(0, (def.mn - 50) / 100) * 0.08;
            else if (ph.name === 'Climax') _mnLateMult = 1 - Math.max(0, (def.mn - 50) / 100) * 0.12;
            dmg = Math.max(eng.dmgFloor, Math.round(dmg * _ovrMult * (1 - _popAdvD * 0.06 * _popMultD) * _mnLateMult));
            if (openingCounterBoost) {
              dmg = Math.max(eng.dmgFloor, Math.round(dmg * eng.openingExecutionCounterDmgMult));
              if (_openingExecutionData) _openingExecutionData.counterBoostDamage = dmg;
            }
            def.hp = moveTier === 'small' ? Math.max(1, def.hp - dmg) : def.hp - dmg;
            mom += isLeftAtk ? 8 : -8;
            atk.consecutiveHits++;
            def.consecutiveHits = 0;
            if (dmg >= 10) bigMoves++;
            // K-6: 演出専用の「大ダメージ」(被弾側の最大HPの12%以上)。フレームのフラグと実況ログの注記にだけ使う
            const bigHit = B.isBigHit(dmg, def.mhp, hitBands);
            if (recordFrames) {
              _turnAction = {
                kind: 'hit', atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c,
                dmg, isCrit: bigHit, isHeavy: B.isHeavyHit(dmg, def.mhp, hitBands), isBig: dmg >= 10,
                ...(openingCounterBoost ? { openingCounterBoost: true } : {}),
              };
            }
            const curLeader = mom > 5 ? 'left' : mom < -5 ? 'right' : null;
            if (curLeader && curLeader !== lastLeader) { leadChanges++; lastLeader = curLeader; }

            if (L.gritTurns > 0) L.gritTurns--;
            if (R.gritTurns > 0) R.gritTurns--;

            // P7-53: 「大ダメージ」注記と「透かし後の反撃」注記の組み合わせは、
            // 値の差し替えではなく4通りの完全文テンプレへ展開してある(構造規約3)。
            pushLog(openingCounterBoost
              ? (bigHit ? 'hitBoostCrit' : 'hitBoost')
              : (bigHit ? 'hitCrit' : 'hit'),
              { turn, name: atk.name, move: mv.n, name2: def.name, dmg, hp: Math.max(0, def.hp), mhp: def.mhp });

            if (def.hp <= 0) {
              const fType = B.determineFinishType(rng, mv);
              const finLabel = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
              let escaped = false;
              if (fType === 'fall' || fType === 'tko') {
                const _popAdvKo = ((def.popularity || 50) - (atk.popularity || 50)) / 100 * popularityInfluence;
                const _popMultKo = (tier >= 2 ? 2.0 : 1.0);
                let koChance = B.calcKickoutChance(def, ph, eng, _popAdvKo, _popMultKo);
                const defenderChampionBonus = fType === 'fall' ? championReturnBonus(!isLeftAtk) : 0;
                koChance = B.addReturnBonus(koChance, sharedReturnBonus + defenderChampionBonus, eng.kickoutKnee.cap);
                if (Engine.rng.float(rng) < koChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  totalKickouts++;
                  def.gritTurns = eng.gritDuration;
                  pushLog('kickoutGrit', { name: def.name });
                  pushLog('hpNote', { name: def.name, hp: Math.max(0, def.hp), mhp: def.mhp });
                  if (recordFrames) _turnKickout = { count: def.kickoutCount, escapeType: fType };
                }
              } else if (fType === 'gu') {
                const _popAdvGu = ((def.popularity || 50) - (atk.popularity || 50)) / 100 * popularityInfluence;
                const _popMultGu = (tier >= 2 ? 2.0 : 1.0);
                let escChance = B.calcGuEscapeChance(def, ph, eng, _popAdvGu, _popMultGu);
                escChance = B.addReturnBonus(escChance, sharedReturnBonus + championReturnBonus(!isLeftAtk), eng.guEscapeKnee.cap);
                if (Engine.rng.float(rng) < escChance) {
                  escaped = true;
                  def.hp = Math.round(def.mhp * 0.05);
                  def.kickoutCount++;
                  def.gritTurns = eng.gritDuration;
                  pushLog('ropeEscapeGrit', { name: def.name });
                  pushLog('hpNote', { name: def.name, hp: Math.max(0, def.hp), mhp: def.mhp });
                  totalKickouts++;
                  if (recordFrames) _turnKickout = { count: def.kickoutCount, escapeType: 'gu' };
                }
              }
              if (!escaped) {
                winner = atkSide;
                finType = finLabel;
                finishPhase = ph.name;
                finMove = mv.n;
                pushLog(fType === 'fall' ? 'finishFall' : fType === 'gu' ? 'finishGu' : 'finishTko',
                  { name: atk.name, move: mv.n });
                // リプレイ用: 直接決着でもピン/TKOシーケンスUIを表示する
                if (recordFrames) {
                  if (fType === 'tko') {
                    _turnTkoStop = true;
                  } else if (fType === 'gu') {
                    _turnPinAttempt = 'success';
                    _turnKickout = { count: 0, escapeType: 'gu' };
                  } else { // 'fall'
                    _turnPinAttempt = 'success';
                  }
                }
              }
            }
            // K-7: 丸め込み技は丸め込み専用の判定を先に評価する(TE主導の独立した決着)。
            // 旧実装は汎用のフォール狙いを先に評価していたため、低HP時の丸め込み技の約7〜8割が
            // 「ピン」決着に吸われ、番狂わせ体質(+8)もほぼ届いていなかった。タッグは元からこの順。
            else if (!winner && mv.c === 'rollup' && def.hp / def.mhp < eng.rollupHpThreshold) {
              let rSuccess = eng.rollupBaseSuccess + (atk.te * eng.rollupTecBonus);
              // 番狂わせ体質: 格上相手の丸め込み成功率UP
              if (Traits.has(atk, '番狂わせ体質') && Engine.util.ov(def) > Engine.util.ov(atk)) rSuccess += 8;
              // K-7: 返しの回数(kickoutCount)はHP0判定・フォール狙いと共通。使い切った側はもう返せない
              if (def.kickoutCount >= eng.kickoutMax) rSuccess = 100;
              if (Engine.rng.float(rng) * 100 < rSuccess) {
                winner = atkSide;
                finType = '丸め込み';
                finishPhase = ph.name;
                finMove = mv.n;
                // K-6 追加: 「まさかの…大金星！」は格下が勝ったときだけ。それ以外は事実だけを言う行
                const upsetWin = B.isUpsetWin(isLeftAtk ? _ovrL : _ovrR, isLeftAtk ? _ovrR : _ovrL);
                pushLog(upsetWin ? 'rollupUpset' : 'rollupWin', { name: atk.name, move: mv.n });
                if (recordFrames) _turnRollup = 'success';
              } else {
                // 丸め込みもカウント2で返せばニアフォール。フォール狙いの返しと同じ流れ(粘りバフ・ドラマ集計)に乗せる
                def.kickoutCount++;
                def.gritTurns = eng.gritDuration;
                pushLog('rollupFail', { name: def.name });
                totalKickouts++;
                if (recordFrames) _turnRollup = 'kickout2';
              }
            }
            else if (!winner && moveTier !== 'small' && mv.c !== 'rollup'
                     && B.checkPinAttempt(rng, mv, atk, def, dmg, mom, atkSide, ph, eng)) {
              const isSubPin = mv.c === 'submission';
              // K-7: 返しの上乗せ(両者分+防衛王者の土壇場+闘志)。闘志はHP0判定と同じくフォール(キックアウト)にだけ効く
              const pinReturnBonus = sharedReturnBonus + championReturnBonus(!isLeftAtk)
                + (isSubPin ? 0 : B.fightingSpiritBonus(def));
              // K-7: 返しの回数はHP0判定と共通の上限(通常2回・大一番3回。ギブアップの脱出も同じ枠)。
              // 使い切った側は返せない(旧: ピンの返しは無制限で、上乗せが重なると3カウントが入らず時間切れまで続いた)
              const returnsLeft = def.kickoutCount < (isSubPin ? eng.guEscapeMax : eng.kickoutMax);
              const successRate = returnsLeft
                ? B.applyPinReturnBonus(B.calcPinAttemptSuccess(atk, def, dmg, ph, eng), pinReturnBonus,
                    isSubPin ? eng.guEscapeKnee.cap : eng.kickoutKnee.cap)
                : 100;
              if (Engine.rng.float(rng) * 100 < successRate) {
                winner = atkSide;
                finType = isSubPin ? 'ギブアップ' : 'ピン';
                finishPhase = ph.name;
                finMove = mv.n;
                pushLog(isSubPin ? 'pinSubmission' : 'pinFall', { name: atk.name, move: mv.n });
                if (recordFrames) {
                  _turnPinAttempt = 'success';
                  if (isSubPin) _turnKickout = { count: 0, escapeType: 'gu' };
                }
              } else {
                def.kickoutCount++;
                def.gritTurns = eng.gritDuration;
                pushLog(isSubPin ? 'pinFailSub' : 'pinFailFall', { name: def.name });
                totalKickouts++;
                if (recordFrames) _turnPinAttempt = isSubPin ? 'kickout2_sub' : 'kickout2';
              }
            }
            else if (!winner && atk.consecutiveHits >= eng.tkoConsecutiveThreshold
                     && def.hp / def.mhp < eng.tkoHpThreshold) {
              if (Engine.rng.float(rng) * 100 < eng.tkoBaseRate) {
                winner = atkSide;
                finType = 'TKO';
                finishPhase = ph.name;
                finMove = mv.n;
                pushLog('refStop', { name: atk.name });
                if (recordFrames) _turnTkoStop = true;
              }
            }
          }
        }
        mom = clamp(mom, -50, 50);
        pushFrame(ph.name);
        turn++;
      }

      if (!winner) {
        winner = resolveTimeoutWinner(L.hp, R.hp, mom, -mom, rng, 'left', 'right');
        finType = 'HP判定';
        finishPhase = 'Timeout';
        pushLog('timeout', { name: winner === 'left' ? L.name : R.name });
        // 最終フレームに winner を刻む。最後に push された直前のフレームを上書きしても良いが、
        // 追加フレーム (turnSub 無し、turn は維持) で timeout 表示を分離した方が演出しやすい
        if (recordFrames && frames.length > 0) {
          const last = frames[frames.length - 1];
          last.winner = winner;
          last.finType = finType;
          last.finMove = null;
          last.finishPhase = 'Timeout';
          last.logLines = last.logLines.concat([log[log.length - 1]]);
          // P7-53: 並走する4本(tpl/vars/cls/spoiler)も同じ添字で伸ばす。
          last.logLineTpls = (last.logLineTpls || []).concat([logTpl[logTpl.length - 1]]);
          last.logLineVars = (last.logLineVars || []).concat([logVars[logVars.length - 1]]);
          last.logLineClasses = (last.logLineClasses || []).concat([logCls[logCls.length - 1]]);
          last.logLineSpoilers = (last.logLineSpoilers || []).concat([logSpoiler[logSpoiler.length - 1]]);
        }
      }

      // Calculate MQ (v2.0 deduction system — §1〜§5 of mq-deduction-redesign-v2.0.md)
      const matchTurns = turn - 1;
      // MQ再設計P3b §3.5〜§3.6: trust低下/バフによる実効OV補正はシーリング計算にのみ効かせる
      // (恒久的なステータス変更ではなく、その試合の天井だけをその場で動かす)。
      const avgOV = (Engine.util.ov(charL) + ringOvAdjustL + Engine.util.ov(charR) + ringOvAdjustR) / 2;

      // §1 天井（OVシーリング。OV100超は§3.7bの減衰セグメントを含む共通関数を使う）
      const ceiling = Math.round(B.ovCeiling(avgOV));

      // §2 ドラマ減点（見せ場不足がペナルティ）
      let dramaPenalty = 30;
      dramaPenalty -= Math.min(totalKickouts, 2) * 8;
      dramaPenalty -= Math.min(totalCounters, 3) * 2.5;
      dramaPenalty -= Math.min(leadChanges, 3) * 1.5;
      dramaPenalty -= Math.min(bigMoves, 6) * 0.4;
      dramaPenalty = Math.max(0, Math.round(dramaPenalty));

      // §3 ペーシング減点（Tier別適正ターン帯、引き出し上手で緩和）
      const pacingPenalty = B.pacingPenalty(matchTurns, tier, hasHikidashi);

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
      mq = Math.max(0, Math.round(mq)); // 下限クランプ前に超過レイヤーを加算するため一旦0以上に留める

      // §6 超過レイヤー（mq-redesign-proposal-v0.4 §3.7）— 天井の蓋を外す限定加点。
      // 発火条件: ドラマ減点完全回復 + ペーシング減点0 + まともな決着（決着減点≤1）。既存式・係数は不変。
      const transcendFired = dramaPenalty === 0 && pacingPenalty === 0 && finishPenalty <= 1;
      let transcendExcess = 0;
      let transcendOverflow = 0;
      if (transcendFired) {
        transcendExcess = 4 * Math.max(0, totalKickouts - 2)
          + 1.5 * Math.max(0, totalCounters - 3)
          + 1 * Math.max(0, leadChanges - 3)
          + 0.3 * Math.max(0, bigMoves - 6);
        if (transcendExcess > 0) {
          transcendOverflow = Math.min(12, Math.round(4 * Math.sqrt(transcendExcess / 4)));
        }
      }
      mq += transcendOverflow;
      return {
        left: charL, right: charR,
        winner, finType, finMove,
        turns: matchTurns,
        hpLeft: { final: Math.max(0, L.hp), current: Math.max(0, L.hp), max: L.mhp },
        hpRight: { final: Math.max(0, R.hp), current: Math.max(0, R.hp), max: R.mhp },
        mq, log,
        finishPhase, matchTier: tier, btHintTurn: null,
        finMoveD: B.findMoveByName(finMove)?.d || null,
        finMoveTier: B.moveTier(B.findMoveByName(finMove)),
        moveSelectionStats: snapshotMoveSelectionStats(moveSelectionStats),
        ...(_openingExecutionStrongerSide ? {
          openingExecutionEligible: true,
          openingExecutionGap: _openingExecutionGap,
          openingExecutionStrongerSide: _openingExecutionStrongerSide,
          openingExecutionChecked: _openingExecutionChecked,
        } : {}),
        ...(_openingExecutionData ? {
          openingExecution: true,
          openingExecutionHit: _openingExecutionData.hit,
          openingExecutionDamage: _openingExecutionData.damage,
          openingExecutionDamageRatio: _openingExecutionData.damageRatio,
          openingExecutionOvrGap: _openingExecutionData.ovrGap,
          openingExecutionData: _openingExecutionData,
        } : {}),
        mqDetail: { ceiling, dramaPenalty, pacingPenalty, finishPenalty },
        transcend: { fired: transcendFired && transcendOverflow > 0, excess: transcendExcess, overflow: transcendOverflow },
        // MQ再設計P3b: リング内化の適用メタデータ(観測・新聞演出用。存在する場合のみ付与)
        ...(rivalryRing ? { rivalryRing: { tier: rivalryRing.tier, counterPt: rivalryRing.counterPt, escape: rivalryRing.escape } } : {}),
        ...(titleRingMatch ? { titleRing: { escape: TITLE_RING_ESCAPE_BONUS, counterPt: TITLE_RING_COUNTER_BONUS } } : {}),
        ...((championDefenseEscape[0] || championDefenseEscape[1]) ? { championDefenseEscape: [championDefenseEscape[0] || 0, championDefenseEscape[1] || 0] } : {}),
        ...((trustRingDebuff[0] || trustRingDebuff[1]) ? { trustDebuff: [trustRingDebuff[0] || 0, trustRingDebuff[1] || 0] } : {}),
        ...((buffRingBonus[0] || buffRingBonus[1]) ? { ovBuff: [buffRingBonus[0] || 0, buffRingBonus[1] || 0] } : {}),
        ...((ringOvAdjustL || ringOvAdjustR) ? { ovAdjust: [ringOvAdjustL, ringOvAdjustR] } : {}),
        frames: recordFrames ? frames : undefined,
      };
    }
};

// i18n Stage A P3a: 表示文言はdata.jsのFINISH_TEXTテーブルに抽出済み。ここはテーブルを読むだけ。
// i18n Stage B P4-2(D-P4-2): 第4引数 dict は任意の「辞書参照関数」(text => text の形)。
// Engine純粋性のためグローバルWM_I18Nは直接参照しない — 省略時は従来どおりFINISH_TEXTの
// JA原文をそのまま使う(呼び出し元の大半である既存UI/Engineコールは無改修で不変)。
// UI表示時点で呼ぶ場合はWM_I18N.tを、Engine内で生成しGへ焼く場合は糸通しされたdict関数を渡す。
Engine.formatFinish = function(finType, finMove, isFinisher, dict) {
  const T = (typeof dict === 'function') ? dict : (s) => s;
  if (finType === 'HP判定') return T(FINISH_TEXT['HP判定']);
  if (!finMove) return finType || FINISH_TEXT_FALLBACK;
  const tmpl = FINISH_TEXT[finType];
  if (!tmpl) return finType || FINISH_TEXT_FALLBACK;
  const prefix = isFinisher ? '★ ' : '';
  // i18n Stage B P7-5: 技名も辞書の住人(名前辞書と同じ「data由来の値」)。テンプレ側だけ
  // dictを通して{move}は素通しにしていたので、決着文の技名だけJAで残っていた。
  // 値は**パラメータとして渡す** — WM_I18N.tのenブランチが持つパラメータ値の自動変換
  // (D-P6-2、P7-5で技名辞書も見るよう拡張)が引き当てる。dictで先に訳そうとしないこと
  // (specs §19-3の会場名と同型)。dict省略時(恒等関数)やparams非対応のdictでは{move}が
  // 残るので、従来どおりの.replace()を後段に残してJA出力を1バイト不変に保つ
  // (先例: management.js の _wmFillWithDict も dict(tpl, params) → fill の二段構え)。
  return prefix + String(T(tmpl, { move: finMove })).replace('{move}', finMove);
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

  // 連戦消耗モジュール用: タッグ戦の満タンHPを事前算出したいときのヘルパー
  function calcFullHp(char) {
    return Math.round(TAG_MATCH_CONFIG.hpBase + char.st * TAG_MATCH_CONFIG.hpScale);
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
    // bond-rivalry plan P-1: bond ≤ 20 不仲ペアはタッグ連携（cut-in救援）を打たない
    if ((bond != null ? bond : 50) <= 20) return 0;
    // K-12 追加(2026-09-26): 不仲の判定は「2人の絆の低い方」。渡される bond(ケミストリー用の片方向の値)が
    // 20を超えていても、Engine.showTagMatch.penalize が付けた印のある選手は救援しない
    if (apronFighter && apronFighter._noCutin) return 0;
    const CC = TAG_MATCH_CONFIG.cutin;
    let base;
    if (type === 'pin') base = CC.basePinRate;
    else if (type === 'finisher') base = CC.baseFinisherRate;
    else base = CC.baseCounterRate;
    const hpBonus = (apronFighter.hp - 50) * CC.hpScale;
    // 絆≤20 は冒頭で返しているので、ここに来るのは絆>20 か欠損・数値でない値だけ(後者は50扱い)
    const bondBonus = ((Number.isFinite(bond) ? bond : 50) - 50) * CC.bondScale;
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
    const TC = TAG_MATCH_CONFIG;
    const recordFrames = !!opts.recordFrames;
    // K-6 追加: 演出専用の段(大ダメージ/特大)。タッグは最大HPが小さいので割合を上げる(ファイル先頭の HIT_BANDS)
    const hitBands = B.hitBands('tag');

    const bondA = opts.bond_A != null ? opts.bond_A : 50;
    const bondB = opts.bond_B != null ? opts.bond_B : 50;
    const chemA = calcChemistry(bondA, opts.tagExp_A || 0, teamA.fighter1.style, teamA.fighter2.style);
    const chemB = calcChemistry(bondB, opts.tagExp_B || 0, teamB.fighter1.style, teamB.fighter2.style);

    function initFighter(char) {
      const hp = Math.round(TC.hpBase + char.st * TC.hpScale);
      // 連戦消耗モジュール(autumn-gauntlet-war-spec-v0.1 §3)用: _hpOverride が指定されていれば
      // 開始HPをその値にする(JT の jtCarryHpPct と同じ仕組み)。未指定時は従来通り満タン開始。
      const startHp = char._hpOverride != null ? Math.max(1, Math.min(hp, Math.round(char._hpOverride))) : hp;
      return {
        ...char,
        hp: startHp, mhp: hp,
        _basePw: char.pw, _baseSp: char.sp, _baseTe: char.te, _baseSt: char.st,
        gritTurns: 0, kickoutCount: 0, consecutiveHits: 0, bigMoveCooldown: false,
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
    // i18n Stage A P3a-3 D-G4: logと同じ添字で対応するCSSクラス配列。
    // tag-battle-main.jsの_logLineHtmlは従来「完成文の部分一致」でクラスを再判定していた
    // (翻訳した瞬間に無音故障する最危険パターン)。生成元であるここで、どの分岐から
    // pushしたかに基づいてクラスを確定させ、logLinesと一緒にframeへ運ぶ。
    // i18n Stage B P7-53(裁定C-6): 文面もテンプレID化した(BATTLE_LOG_TEMPLATES.tag)。
    // logには従来と1バイト同一のJA完成文が入る(=result.logは不変)。クラスと
    // 「ピンシーケンス中に伏せる行か(spoiler)」はテンプレIDに固定してframeへ運ぶ
    // (第2引数のcls手渡しは廃止 — 1つのIDに1つの分類、という形で監査できるようにした)。
    let logCls = [], logTpl = [], logVars = [], logSpoiler = [];
    function pushLog(id, params) {
      const tpl = BATTLE_LOG_TEMPLATES.tag[id];
      const kind = BATTLE_LOG_LINE_KINDS.tag[id] || { cls: null, spoiler: false };
      log.push(fillTemplateVars(tpl, params));
      logTpl.push(tpl);
      logVars.push(params || {});
      logCls.push(kind.cls);
      logSpoiler.push(!!kind.spoiler);
    }
    let winner = null, finType = null, finMove = null, finishPhase = null;
    let winAttribution = { pinnedBy: null, pinnedWho: null };

    // 名勝負製造機(v2.1): 4選手中1人以上持っていれば効果ON。重複適用なし
    const hasMeishoubu =
      Traits.has(teamA.fighter1, '名勝負製造機') || Traits.has(teamA.fighter2, '名勝負製造機') ||
      Traits.has(teamB.fighter1, '名勝負製造機') || Traits.has(teamB.fighter2, '名勝負製造機');

    let segments = [];
    let curSegment = { legalA: legalA.id, legalB: legalB.id, turns: 0, touchType: null, events: [] };
    let isolationA = 0, isolationB = 0;
    let lossStreakA = 0, lossStreakB = 0;
    let dramaSummary = [];
    let touchTypes = new Set();
    let totalKickouts = 0, totalCounters = 0, leadChanges = 0, bigMoves = 0;
    const moveSelectionStats = createMoveSelectionStats();
    let lastMomSign = 0;

    // ── フレーム記録（観戦用） ──
    const frames = recordFrames ? [] : null;
    let _turnLogStart = 0;
    let _turnAction = null;
    let _turnOutcome = null;
    // F1: タッチ発生時は「攻撃フレーム (Frame A, turnSub=0)」と
    //     「タッチフレーム (Frame B, turnSub=0.5)」を同一ターン内で別フレームに分離する。
    //     観戦側で攻撃→タッチの時系列を明確に見せるため。
    let _frameTurnSub = 0;
    function pushFrame(phName) {
      if (!recordFrames) return;
      const turnLog = log.slice(_turnLogStart);
      const turnLogCls = logCls.slice(_turnLogStart);
      const turnLogTpl = logTpl.slice(_turnLogStart);
      const turnLogVars = logVars.slice(_turnLogStart);
      const turnLogSpoiler = logSpoiler.slice(_turnLogStart);
      const turnEvents = dramaSummary
        .filter(d => d.turn === totalTurn && !d._framed)
        .map(d => { d._framed = true; return { type: d.type, by: d.by, victim: d.victim, tagged: d.tagged, saved: d.saved, team: d.team, move: d.move, moveCat: d.moveCat, attemptType: d.attemptType, byId: d.byId, onId: d.onId, outcome: d.outcome, count: d.count }; });
      // MISS フレームで HP が前フレームから減っていたら異常（Bug #1 ガード）
      if (_turnAction && _turnAction.kind === 'miss' && frames.length > 0) {
        const _prev = frames[frames.length - 1];
        const _curHp = { [fA1.id]: Math.round(fA1.hp), [fA2.id]: Math.round(fA2.hp), [fB1.id]: Math.round(fB1.hp), [fB2.id]: Math.round(fB2.hp) };
        for (const _id of Object.keys(_curHp)) {
          if (_prev.hp && _curHp[_id] < _prev.hp[_id]) {
            try { console.warn(`[WM Debug Tag] MISS frame HP decrease: turn=${totalTurn} id=${_id} d=${_prev.hp[_id] - _curHp[_id]}`); } catch(e){}
          }
        }
      }
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
        logLineClasses: turnLogCls,
        // P7-53: 表示点(観戦iframe)が言語別に組み直すためのテンプレIDと値、
        // および「ピンシーケンス中に伏せる行か」。logLinesと同じ添字で並ぶ。
        logLineTpls: turnLogTpl,
        logLineVars: turnLogVars,
        logLineSpoilers: turnLogSpoiler,
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
    let _lastTagMoveName = null; // T1: 試合内の直近ダブルチーム技名 (連続回避)
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
      _turnOutcome = null;
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
        pushLog('downTko', { name: legalA.name, phase: ph.name });
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
        pushLog('downTko', { name: legalB.name, phase: ph.name });
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
      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.05;
      const isAAttacking = atkRoll >= 50;
      const atk = isAAttacking ? effA : effB;
      const def = isAAttacking ? effB : effA;
      const atkFighter = isAAttacking ? legalA : legalB;
      const defFighter = isAAttacking ? legalB : legalA;
      const atkSide = isAAttacking ? 'left' : 'right';

      const mv = B.selMove(rng, atk.style, totalTurn, TC.phases, { fighter: atkFighter, defender: defFighter, eng: ENG, stats: moveSelectionStats });
      const moveTier = B.moveTier(mv);
      const hitRate = B.calcHitRate(mv, atk, def);
      const hit = Engine.rng.float(rng) * 100 < hitRate;

      if (!hit) {
        _turnOutcome = 'miss';
        mom += isAAttacking ? -5 : 5;
        mom = clamp(mom, -50, 50);
        pushLog('miss', { turn: totalTurn, phase: ph.name, name: atkFighter.name, move: mv.n });
        if (recordFrames) {
          _turnAction = { attackerId: atkFighter.id, defenderId: defFighter.id, atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c, kind: 'miss', dmg: 0, isCrit: false };
        }
        if (isAAttacking) { lossStreakA++; lossStreakB = 0; }
        else { lossStreakB++; lossStreakA = 0; }
      } else {
        let counterRate = B.calcCounterRate(atk, def, ph);
        if (hasMeishoubu) counterRate = Math.min(counterRate + 5, ENG.counterMax);
        const isCounter = Engine.rng.float(rng) * 100 < counterRate;

        if (isCounter) {
          _turnOutcome = 'counter';
          totalCounters++;
          const cMv = B.selMove(rng, def.style, totalTurn, TC.phases, { fighter: defFighter, defender: atkFighter, eng: ENG, stats: moveSelectionStats });
          let cDmg = B.calcDamage(rng, cMv, def, atk, mom, atkSide === 'left' ? 'right' : 'left', ph);
          cDmg = Math.round(cDmg * ENG.counterDmgMult);
          cDmg = tagScaleDmg(cDmg);
          atkFighter.hp = B.moveTier(cMv) === 'small' ? Math.max(1, atkFighter.hp - cDmg) : atkFighter.hp - cDmg;
          defFighter.damageDealt += cDmg;
          atkFighter.damageTaken += cDmg;
          defFighter.consecutiveHits++;
          atkFighter.consecutiveHits = 0;
          mom += isAAttacking ? -ENG.counterMomShift : ENG.counterMomShift;
          mom = clamp(mom, -50, 50);
          pushLog('counter', { turn: totalTurn, phase: ph.name, name: defFighter.name, move: cMv.n, name2: atkFighter.name, dmg: cDmg });
          if (recordFrames) {
            // K-6: 大ダメージ/特大は被弾側(切り返された atkFighter)の最大HP比で決める(演出専用)
            _turnAction = { attackerId: defFighter.id, defenderId: atkFighter.id, atkSide: atkSide === 'left' ? 'right' : 'left', move: cMv.n, origMove: mv.n, moveD: cMv.d, moveCat: cMv.c, kind: 'counter', dmg: cDmg, isCrit: B.isBigHit(cDmg, atkFighter.mhp, hitBands), isHeavy: B.isHeavyHit(cDmg, atkFighter.mhp, hitBands) };
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
                let koChance = B.calcKickoutChance(atkFighter, ph, ENG);
                if (hasMeishoubu) koChance = Math.min(koChance + 0.15, 0.45);
                if (atkFighter.kickoutCount < TC.kickoutMax && Engine.rng.float(rng) < koChance) {
                  atkFighter.hp = Math.round(atkFighter.mhp * 0.05);
                  atkFighter.kickoutCount++;
                  atkFighter.gritTurns = ENG.gritDuration;
                  totalKickouts++;
                  pushLog('kickout', { name: atkFighter.name, n: atkFighter.kickoutCount });
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'kickout', count: 2 });
                } else {
                  const apronAtk = isAAttacking ? apronA : apronB;
                  const atkBond = isAAttacking ? bondA : bondB;
                  if (checkBetrayal(atkBond, rng)) {
                    finished = true;
                    dramaSummary.push({ type: 'betrayal', turn: totalTurn, by: apronAtk.id, victim: atkFighter.id });
                    dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'betrayalWin', count: 3 });
                    pushLog('betrayal', { name: apronAtk.name });
                  } else {
                    const cutinRate = calcCutinRate('pin', apronAtk, atkBond, apronAtk.cutinCount);
                    if (Engine.rng.float(rng) < cutinRate) {
                      apronAtk.cutinCount++;
                      atkFighter.hp = Math.round(atkFighter.mhp * 0.05);
                      atkFighter.gritTurns = ENG.gritDuration;
                      totalKickouts++;
                      dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronAtk.id, saved: atkFighter.id });
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'cutinSave', count: 2 });
                      pushLog('cutinSave', { name: apronAtk.name, name2: atkFighter.name });
                    } else {
                      finished = true;
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: defFighter.id, onId: atkFighter.id, outcome: 'win', count: 3 });
                    }
                  }
                }
              }
            } else if (fType === 'gu') {
              let escChance = B.calcGuEscapeChance(atkFighter, ph, ENG);
              if (hasMeishoubu) escChance = Math.min(escChance + 0.15, 0.40);
              if (atkFighter.kickoutCount < TC.guEscapeMax && Engine.rng.float(rng) < escChance) {
                atkFighter.hp = Math.round(atkFighter.mhp * 0.05);
                atkFighter.kickoutCount++;
                atkFighter.gritTurns = ENG.gritDuration;
                totalKickouts++;
                pushLog('ropeEscape', { name: atkFighter.name });
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'gu', byId: defFighter.id, onId: atkFighter.id, outcome: 'escape', count: 0 });
              } else {
                finished = true;
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'gu', byId: defFighter.id, onId: atkFighter.id, outcome: 'win', count: 0 });
              }
            }
            if (finished) {
              winner = isAAttacking ? 'teamB' : 'teamA';
              finType = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
              finMove = cMv.n;
              finishPhase = ph.name;
              winAttribution.pinnedBy = defFighter.id;
              winAttribution.pinnedWho = atkFighter.id;
              pushLog(fType === 'fall' ? 'counterFinishFall' : fType === 'gu' ? 'counterFinishGu' : 'counterFinishTko',
                { name: defFighter.name, move: cMv.n, phase: ph.name });
              pushFrame(ph.name);
              break;
            }
          }
          if (!winner && cMv.c === 'rollup' && atkFighter.hp > 0
              && atkFighter.hp / atkFighter.mhp <= ENG.rollupHpThreshold) {
            let rSuccess = ENG.rollupBaseSuccess + (def.te * ENG.rollupTecBonus);
            if (ph.name === 'Climax') rSuccess += 15;
            if (Engine.rng.float(rng) * 100 < rSuccess) {
              const apronAtk = isAAttacking ? apronA : apronB;
              const atkBond = isAAttacking ? bondA : bondB;
              const cutinRate = calcCutinRate('pin', apronAtk, atkBond, apronAtk.cutinCount);
              if (Engine.rng.float(rng) < cutinRate) {
                apronAtk.cutinCount++;
                dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronAtk.id, saved: atkFighter.id });
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'rollup', byId: defFighter.id, onId: atkFighter.id, outcome: 'cutinSave', count: 2 });
                pushLog('rollupCutin', { name: defFighter.name, move: cMv.n, name2: apronAtk.name });
              } else {
                winner = isAAttacking ? 'teamB' : 'teamA';
                finType = '丸め込み';
                finMove = cMv.n;
                finishPhase = ph.name;
                winAttribution.pinnedBy = defFighter.id;
                winAttribution.pinnedWho = atkFighter.id;
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'rollup', byId: defFighter.id, onId: atkFighter.id, outcome: 'win', count: 3 });
                pushLog('rollupWin', { name: defFighter.name, move: cMv.n, phase: ph.name });
                pushFrame(ph.name);
                break;
              }
            }
          }
          if (!winner && defFighter.consecutiveHits >= ENG.tkoConsecutiveThreshold
              && atkFighter.hp / atkFighter.mhp < ENG.tkoHpThreshold
              && Engine.rng.float(rng) * 100 < ENG.tkoBaseRate) {
            winner = isAAttacking ? 'teamB' : 'teamA';
            finType = 'TKO';
            finMove = cMv.n;
            finishPhase = ph.name;
            winAttribution.pinnedBy = defFighter.id;
            winAttribution.pinnedWho = atkFighter.id;
            dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'tko', byId: defFighter.id, onId: atkFighter.id, outcome: 'win', count: 0 });
            pushLog('refStop', { name: defFighter.name, phase: ph.name });
            pushFrame(ph.name);
            break;
          }
        } else {
          _turnOutcome = 'hit';
          // 通常ヒット
          let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
          // v5.0 M1: タッグも OVR比補正（popularity は無し）
          // v5.1 MN: 終盤の粘り
          {
            const _tAtkOvr = (atk.pw + atk.sp + atk.te + atk.st + atk.mn) / 5;
            const _tDefOvr = (def.pw + def.sp + def.te + def.st + def.mn) / 5;
            const _tOvrMult = Math.pow(_tAtkOvr / Math.max(1, _tDefOvr), 0.50);
            let _tMnLateMult = 1.0;
            if (ph.name === 'End') _tMnLateMult = 1 - Math.max(0, (def.mn - 50) / 100) * 0.08;
            else if (ph.name === 'Climax') _tMnLateMult = 1 - Math.max(0, (def.mn - 50) / 100) * 0.12;
            dmg = Math.max(ENG.dmgFloor, Math.round(dmg * _tOvrMult * _tMnLateMult));
          }
          if (atkFighter.hotTagBuff > 0) dmg = Math.round(dmg * TC.touch.hotTagBuffMult);
          dmg = tagScaleDmg(dmg);
          defFighter.hp = moveTier === 'small' ? Math.max(1, defFighter.hp - dmg) : defFighter.hp - dmg;
          atkFighter.damageDealt += dmg;
          defFighter.damageTaken += dmg;
          atkFighter.consecutiveHits++;
          defFighter.consecutiveHits = 0;
          mom += isAAttacking ? 8 : -8;
          mom = clamp(mom, -50, 50);
          if (mv.d >= 10) bigMoves++;
          pushLog('hit', { turn: totalTurn, phase: ph.name, name: atkFighter.name, move: mv.n, name2: defFighter.name, dmg, hp: Math.round(defFighter.hp), mhp: defFighter.mhp });
          if (recordFrames) {
            // K-6: 大ダメージ/特大は被弾側の最大HP比で決める(演出専用)
            _turnAction = { attackerId: atkFighter.id, defenderId: defFighter.id, atkSide, move: mv.n, moveD: mv.d, moveCat: mv.c, kind: 'hit', dmg, isCrit: B.isBigHit(dmg, defFighter.mhp, hitBands), isHeavy: B.isHeavyHit(dmg, defFighter.mhp, hitBands) };
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
                let koChance = B.calcKickoutChance(defFighter, ph, ENG);
                if (hasMeishoubu) koChance = Math.min(koChance + 0.15, 0.45);
                if (defFighter.kickoutCount < TC.kickoutMax && Engine.rng.float(rng) < koChance) {
                  defFighter.hp = Math.round(defFighter.mhp * 0.05);
                  defFighter.kickoutCount++;
                  defFighter.gritTurns = ENG.gritDuration;
                  totalKickouts++;
                  pushLog('kickout', { name: defFighter.name, n: defFighter.kickoutCount });
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'kickout', count: 2 });
                } else {
                  const apronDef = isAAttacking ? apronB : apronA;
                  const defBond = isAAttacking ? bondB : bondA;
                  if (checkBetrayal(defBond, rng)) {
                    finished = true;
                    dramaSummary.push({ type: 'betrayal', turn: totalTurn, by: apronDef.id, victim: defFighter.id });
                    dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'betrayalWin', count: 3 });
                    pushLog('betrayal', { name: apronDef.name });
                  } else {
                    const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
                    if (Engine.rng.float(rng) < cutinRate) {
                      apronDef.cutinCount++;
                      defFighter.hp = Math.round(defFighter.mhp * 0.05);
                      defFighter.gritTurns = ENG.gritDuration;
                      totalKickouts++;
                      dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'cutinSave', count: 2 });
                      pushLog('cutinSave', { name: apronDef.name, name2: defFighter.name });
                    } else {
                      finished = true;
                      dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'fall', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 3 });
                    }
                  }
                }
              }
            } else if (fType === 'gu') {
              let escChance = B.calcGuEscapeChance(defFighter, ph, ENG);
              if (hasMeishoubu) escChance = Math.min(escChance + 0.15, 0.40);
              if (defFighter.kickoutCount < TC.guEscapeMax && Engine.rng.float(rng) < escChance) {
                defFighter.hp = Math.round(defFighter.mhp * 0.05);
                defFighter.kickoutCount++;
                defFighter.gritTurns = ENG.gritDuration;
                totalKickouts++;
                pushLog('ropeEscape', { name: defFighter.name });
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'gu', byId: atkFighter.id, onId: defFighter.id, outcome: 'escape', count: 0 });
              } else {
                finished = true;
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'gu', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 0 });
              }
            }

            if (finished) {
              winner = isAAttacking ? 'teamA' : 'teamB';
              finType = fType === 'fall' ? 'フォール' : fType === 'gu' ? 'ギブアップ' : 'TKO';
              finMove = mv.n;
              finishPhase = ph.name;
              winAttribution.pinnedBy = atkFighter.id;
              winAttribution.pinnedWho = defFighter.id;
              pushLog(fType === 'fall' ? 'finishFall' : fType === 'gu' ? 'finishGu' : 'finishTko',
                { name: atkFighter.name, move: mv.n, phase: ph.name });
              pushFrame(ph.name);
              break;
            }
          }

          // ピン試み
          if (!winner && moveTier !== 'small' && mv.c !== 'rollup'
              && defFighter.hp > 0 && defFighter.hp / defFighter.mhp <= ENG.pinAttemptHpThreshold) {
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
                  pushLog('pinBetrayalWin', { name: apronDef.name, name2: atkFighter.name });
                  pushFrame(ph.name);
                  break;
                }
                const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
                if (Engine.rng.float(rng) < cutinRate) {
                  apronDef.cutinCount++;
                  dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'cutinSave', count: 2 });
                  pushLog('pinCutin', { name: apronDef.name });
                } else {
                  winner = isAAttacking ? 'teamA' : 'teamB';
                  finType = 'ピン';
                  finMove = mv.n;
                  finishPhase = ph.name;
                  winAttribution.pinnedBy = atkFighter.id;
                  winAttribution.pinnedWho = defFighter.id;
                  dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 3 });
                  pushLog('pinWin', { name: atkFighter.name, phase: ph.name });
                  pushFrame(ph.name);
                  break;
                }
              } else {
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'pin', byId: atkFighter.id, onId: defFighter.id, outcome: 'kickout', count: 2 });
                pushLog('pinKickout', { name: defFighter.name });
              }
            }
          }

          // 丸め込みは selMove の独立経路で選ばれたときだけ決着判定する。
          if (!winner && mv.c === 'rollup' && defFighter.hp > 0
              && defFighter.hp / defFighter.mhp <= ENG.rollupHpThreshold) {
            let rSuccess = ENG.rollupBaseSuccess + (atk.te * ENG.rollupTecBonus);
            if (ph.name === 'Climax') rSuccess += 15;
            if (Engine.rng.float(rng) * 100 < rSuccess) {
              const apronDef = isAAttacking ? apronB : apronA;
              const defBond = isAAttacking ? bondB : bondA;
              const cutinRate = calcCutinRate('pin', apronDef, defBond, apronDef.cutinCount);
              if (Engine.rng.float(rng) < cutinRate) {
                apronDef.cutinCount++;
                dramaSummary.push({ type: 'cutinSave', turn: totalTurn, by: apronDef.id, saved: defFighter.id });
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'rollup', byId: atkFighter.id, onId: defFighter.id, outcome: 'cutinSave', count: 2 });
                pushLog('rollupCutin', { name: atkFighter.name, move: mv.n, name2: apronDef.name });
              } else {
                winner = isAAttacking ? 'teamA' : 'teamB';
                finType = '丸め込み';
                finMove = mv.n;
                finishPhase = ph.name;
                winAttribution.pinnedBy = atkFighter.id;
                winAttribution.pinnedWho = defFighter.id;
                dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'rollup', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 3 });
                pushLog('rollupWin', { name: atkFighter.name, move: mv.n, phase: ph.name });
                pushFrame(ph.name);
                break;
              }
            }
          }

          if (!winner && atkFighter.consecutiveHits >= ENG.tkoConsecutiveThreshold
              && defFighter.hp / defFighter.mhp < ENG.tkoHpThreshold
              && Engine.rng.float(rng) * 100 < ENG.tkoBaseRate) {
            winner = isAAttacking ? 'teamA' : 'teamB';
            finType = 'TKO';
            finMove = mv.n;
            finishPhase = ph.name;
            winAttribution.pinnedBy = atkFighter.id;
            winAttribution.pinnedWho = defFighter.id;
            dramaSummary.push({ type: 'pinAttempt', turn: totalTurn, attemptType: 'tko', byId: atkFighter.id, onId: defFighter.id, outcome: 'win', count: 0 });
            pushLog('refStop', { name: atkFighter.name, phase: ph.name });
            pushFrame(ph.name);
            break;
          }
        }
      }

      // リードチェンジ追跡
      const curSign = mom > 5 ? 1 : mom < -5 ? -1 : 0;
      if (curSign !== 0 && curSign !== lastMomSign) { leadChanges++; lastMomSign = curSign; }

      // ── ダブルチーム (セグメント計画) ──
      if (!winner && curSegment.turns === _dtTargetTurn && _turnOutcome && _turnOutcome !== 'miss') {
        const atkApron = isAAttacking ? apronA : apronB;
        // T1: 乱数選択で同試合内の連続を避ける
        const tagMv = getTagMove(atkFighter.style, atkApron.style, rng, _lastTagMoveName);
        _lastTagMoveName = tagMv.n;
        const effAtk = applyHpDecay(atkFighter);
        const effDef = applyHpDecay(defFighter);
        let tagDmg = B.calcDamage(rng, tagMv, effAtk, effDef, mom, atkSide, ph);
        {
          const _tgAtkOvr = (effAtk.pw + effAtk.sp + effAtk.te + effAtk.st + effAtk.mn) / 5;
          const _tgDefOvr = (effDef.pw + effDef.sp + effDef.te + effDef.st + effDef.mn) / 5;
          const _tgOvrMult = Math.pow(_tgAtkOvr / Math.max(1, _tgDefOvr), 0.50);
          let _tgMnLateMult = 1.0;
          if (ph.name === 'End') _tgMnLateMult = 1 - Math.max(0, (effDef.mn - 50) / 100) * 0.08;
          else if (ph.name === 'Climax') _tgMnLateMult = 1 - Math.max(0, (effDef.mn - 50) / 100) * 0.12;
          tagDmg = Math.max(ENG.dmgFloor, Math.round(tagDmg * _tgOvrMult * _tgMnLateMult));
        }
        tagDmg = Math.round(tagDmg * 1.3);
        tagDmg = tagScaleDmg(tagDmg);
        defFighter.hp -= tagDmg;
        atkFighter.damageDealt += Math.round(tagDmg * 0.5);
        atkApron.damageDealt += Math.round(tagDmg * 0.5);
        defFighter.damageTaken += tagDmg;
        bigMoves++;
        // T1: moveCat をイベントに乗せる (tag-battle-main.js の実況文選択に使用)
        dramaSummary.push({ type: 'doubleTeam', turn: totalTurn, by: [atkFighter.id, atkApron.id], move: tagMv.n, moveCat: tagMv.c });
        pushLog('doubleTeam', { name: atkFighter.name, name2: atkApron.name, move: tagMv.n, name3: defFighter.name, dmg: tagDmg });

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
            pushLog('doubleTeamCutin', { name: apronDef.name });
          } else {
            winner = isAAttacking ? 'teamA' : 'teamB';
            finType = 'フォール';
            finMove = tagMv.n;
            finishPhase = ph.name;
            winAttribution.pinnedBy = atkFighter.id;
            winAttribution.pinnedWho = defFighter.id;
            pushLog('tagMoveFinish');
            pushFrame(ph.name);
            break;
          }
        }
      }

      // ── 同士討ち (セグメント計画) ──
      // 同士討ちは「連携のほころび」ドラマ。HP は少しだけ削るが、控えの体力が尽きる事はない。
      // 主要な効果はモメンタム反転(連携ミスで流れを失う)。
      if (!winner && curSegment.turns === _ffTargetTurn && _turnOutcome && _turnOutcome !== 'miss') {
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
        pushLog('friendlyFire', { name: defFighter.name, name2: defApron.name });
      }

      // ── タッチ判定 ──
      // F1: タッチ成立時は攻撃フレーム (Frame A) をここで先行 push し、
      //     直後のタッチ処理によるログ/swap は次フレーム (Frame B, turnSub=0.5) へ回す。
      //     同一ターン内で A と B が続けて touch する場合、Frame A push は最初の一度だけ。
      const _splitTouchFrame = () => {
        if (!recordFrames || _frameTurnSub !== 0) return;
        pushFrame(ph.name);
        _turnAction = null;
        _turnOutcome = null;
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
              pushLog('hotTag', { name: legalA.name, name2: apronA.name });
              if (Engine.rng.float(rng) < TC.touch.hotTagBuffChance) {
                apronA.hotTagBuff = TC.touch.hotTagBuffTurns;
              }
            } else {
              pushLog(tType === 'tactical' ? 'touchTactical' : 'touchWorn', { name: legalA.name, name2: apronA.name });
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
              pushLog('hotTag', { name: legalB.name, name2: apronB.name });
              if (Engine.rng.float(rng) < TC.touch.hotTagBuffChance) {
                apronB.hotTagBuff = TC.touch.hotTagBuffTurns;
              }
            } else {
              pushLog(tType === 'tactical' ? 'touchTactical' : 'touchWorn', { name: legalB.name, name2: apronB.name });
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
      const controlA = fA1.damageDealt + fA2.damageDealt;
      const controlB = fB1.damageDealt + fB2.damageDealt;
      winner = resolveTimeoutWinner(totalHpA, totalHpB, controlA, controlB, rng, 'teamA', 'teamB');
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
      finMoveD: B.findMoveByName(finMove)?.d || null,
      finMoveTier: B.moveTier(B.findMoveByName(finMove)),
      moveSelectionStats: snapshotMoveSelectionStats(moveSelectionStats),
      matchType: 'tag',
      teamA: { f1Id: fA1.id, f1Name: fA1.name, f2Id: fA2.id, f2Name: fA2.name },
      teamB: { f1Id: fB1.id, f1Name: fB1.name, f2Id: fB2.id, f2Name: fB2.name },
      frames: recordFrames ? frames : undefined,
      perFighter: {
        [fA1.id]: { hpFinal: Math.round(fA1.hp), hpMax: fA1.mhp, turnsLegal: fA1.turnsLegal, turnsApron: fA1.turnsApron, damageDealt: fA1.damageDealt, damageTaken: fA1.damageTaken },
        [fA2.id]: { hpFinal: Math.round(fA2.hp), hpMax: fA2.mhp, turnsLegal: fA2.turnsLegal, turnsApron: fA2.turnsApron, damageDealt: fA2.damageDealt, damageTaken: fA2.damageTaken },
        [fB1.id]: { hpFinal: Math.round(fB1.hp), hpMax: fB1.mhp, turnsLegal: fB1.turnsLegal, turnsApron: fB1.turnsApron, damageDealt: fB1.damageDealt, damageTaken: fB1.damageTaken },
        [fB2.id]: { hpFinal: Math.round(fB2.hp), hpMax: fB2.mhp, turnsLegal: fB2.turnsLegal, turnsApron: fB2.turnsApron, damageDealt: fB2.damageDealt, damageTaken: fB2.damageTaken },
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
    // §3.7b: OV100超の減衰シーリングは共通関数(Engine.battle.ovCeiling)を使う。avgOV<=100は不変。
    const ceiling = Engine.battle.ovCeiling(avgOV);

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
    let final = Math.max(
      0,
      Math.round(ceiling - dramaPenalty - pacingPenalty - finishPenalty + tagBonus - tagPenalty)
    ); // 下限クランプ前に超過レイヤーを加算するため一旦0以上に留める

    // 超過レイヤー（mq-redesign-proposal-v0.4 §3.7・タッグ版）。既存式・係数は不変、加点項のみ追加。
    const transcendFired = dramaPenalty === 0 && pacingPenalty === 0 && finishPenalty <= 1;
    let transcendExcess = 0;
    let transcendOverflow = 0;
    if (transcendFired) {
      transcendExcess = 3 * Math.max(0, totalKickouts - 3)
        + 1 * Math.max(0, totalCounters - 4)
        + 0.75 * Math.max(0, leadChanges - 4)
        + 0.2 * Math.max(0, bigMoves - 8);
      if (transcendExcess > 0) {
        transcendOverflow = Math.min(12, Math.round(4 * Math.sqrt(transcendExcess / 4)));
      }
    }
    final += transcendOverflow;
    return {
      ceiling: Math.round(ceiling), dramaPenalty: Math.round(dramaPenalty * 10) / 10,
      pacingPenalty: Math.round(pacingPenalty * 10) / 10, finishPenalty,
      screenTimeBonus: Math.round(screenTimeBonus * 10) / 10,
      touchDiversityBonus, dramaEventBonus, finishBonus,
      longSegPenalty: Math.round(longSegPenalty * 10) / 10,
      screenTimePenalty: Math.round(screenTimePenalty * 10) / 10,
      tagBonus: Math.round(tagBonus * 10) / 10,
      tagPenalty: Math.round(tagPenalty * 10) / 10,
      transcend: { fired: transcendFired && transcendOverflow > 0, excess: transcendExcess, overflow: transcendOverflow },
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
    calcFullHp,
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

// ══════════════════════════════════════════════════════════
//  Engine.showTagMatch — 通常興行のタッグ1試合(不仲ペナルティ込み)
//  spec: relationship-system-spec-v2.3 §D.1(bond-rivalry P-1)/ K-12 裁定(2026-09-25)
//  通常興行のタッグ戦は必ずここを通す。呼び出し元は4か所:
//    App.skipMatch(1試合スキップ)/ App._watchTagMatch(観戦)/
//    App.skipAllMatches(残り全試合スキップ)/ Engine.executeShow(headless)
//  以前は呼び出し元ごとに不仲処理を書き写していた。能力-3はキー名の誤り(power 等)で
//  どの経路でも効いておらず、全スキップと headless では試合後の信頼-1も抜けていた。
//  押したボタンで結果が変わらないよう、乱数・絆・不仲ペナルティ・試合後処理を1か所に置く。
//  不仲の判定(pairBond / isLowBond / isDiscord)と罰(penalize / applyTrustPenalty)は、
//  春のタッグリーグ(Engine.springTagLeague.run / simulateReplay / apply)もここを呼ぶ(K-12 追加 2026-09-26)。
//  Pure functions only.
// ══════════════════════════════════════════════════════════
Engine.showTagMatch = {
  /** 絆がこの値以下のペアは「不仲」(興行プレビューの ⚠ 不仲 と同じ閾値) */
  LOW_BOND_MAX: 20,
  /** 不仲ペアの試合中の能力低下量(興行プレビューの「能力-3」) */
  STAT_PENALTY: 3,
  /**
   * 下げる能力。spec §D.1 の power/speed/technique/spirit をエンジンのキーに当てたもの
   * (spirit = MN メンタル)。ST(スタミナ=HP総量)は spec の列挙に無いので下げない。
   */
  PENALTY_STATS: Object.freeze(['pw', 'sp', 'te', 'mn']),

  /** 片方向の絆(from→to)。未登録・数値でないときは50 */
  _directedBond(state, fromId, toId) {
    const rels = state && state.relationships;
    const rel = rels ? rels[`${fromId}>${toId}`] : null;
    // 絆0は正当な値(完全に冷え切った仲)。以前の `bond || 50` は0を50に化けさせ、
    // いちばん険悪なペアが「🤝 50」と表示されて不仲判定からも漏れていた。
    return (rel && Number.isFinite(rel.bond)) ? rel.bond : 50;
  },

  /**
   * タッグ1ペアの絆 = 2人の絆の低い方(A→B と B→A の min)。
   * 不仲の判定と画面の表示(興行プレビューの 🤝 / ⚠ 不仲、カード編成の 🤝 友好)は必ずこの値を使う。
   * K-12 追加(2026-09-26): 以前は `小さいID>大きいID` の片方向だけを読んでいて、
   * 相手からの絆だけが冷え切ったペアが不仲にならなかった(どちら向きを読むかはIDの大小で決まっていた)。
   */
  pairBond(state, id1, id2) {
    const self = Engine.showTagMatch;
    return Math.min(self._directedBond(state, id1, id2), self._directedBond(state, id2, id1));
  },

  /**
   * 試合エンジンへ bond_A / bond_B として渡すケミストリー用の絆(`小さいID>大きいID` の片方向)。
   * ケミストリー・タッチ・救援率の絆補正・裏切り判定はこの値で動く。K-12 追加の時点で
   * 数値を不仲の3効果以外で動かさないため据え置いた(不仲の判定は pairBond の低い方)。
   */
  chemistryBond(state, id1, id2) {
    return Engine.showTagMatch._directedBond(state, Math.min(id1, id2), Math.max(id1, id2));
  },

  isLowBond(bond) {
    return bond <= Engine.showTagMatch.LOW_BOND_MAX;
  },

  /** 不仲ペアか(2人の絆の低い方が20以下)。全経路の判定はここに集める */
  isDiscord(state, id1, id2) {
    const self = Engine.showTagMatch;
    return self.isLowBond(self.pairBond(state, id1, id2));
  },

  /**
   * 試合用の一時コピーを返す。選手本体の能力値は変えない。
   * pw/sp/te/mn を各-3 し、`_noCutin` の印で連携(カットイン救援)を止める(calcCutinRate が読む)
   */
  penalize(fighter) {
    const copy = { ...fighter, _noCutin: true };
    Engine.showTagMatch.PENALTY_STATS.forEach(key => {
      if (Number.isFinite(copy[key])) copy[key] = Math.max(1, copy[key] - Engine.showTagMatch.STAT_PENALTY);
    });
    return copy;
  },

  /** 試合後の信頼-1 を times 回ぶん反映した roster を返す(対象がいなければ同じ配列を返す) */
  applyTrustPenalty(roster, ids, times) {
    const n = times == null ? 1 : times;
    if (!ids || ids.length === 0 || !(n > 0)) return roster;
    const hit = new Set(ids.map(id => String(id)));
    return (roster || []).map(c => hit.has(String(c.id))
      ? { ...c, trust: Math.max(0, (c.trust != null ? c.trust : 50) - n) }
      : c);
  },

  /**
   * 通常興行のタッグ1試合をシミュレートする。
   *  - 不仲ペア(2人の絆の低い方≤20): 試合用コピーの pw/sp/te/mn を各-3
   *  - 連携不可: penalize の `_noCutin` で calcCutinRate が0を返す
   *  - 試合後: 不仲ペア両者の trust -1 を反映した roster を返す(呼び出し元が書き戻す)
   * @param {Object} state - relationships / tagExp / rngSeed / season / week / roster を読む
   * @param {Object} teamA - { fighter1, fighter2 }(state.roster の選手)
   * @param {Object} teamB - { fighter1, fighter2 }
   * @param {Object} [extraOpts] - simulateTagMatch へ足すオプション(観戦の recordFrames など)
   * @returns {{ result: Object, roster: Array, lowBondIds: Array, bondA: number, bondB: number }}
   *   bondA / bondB は不仲の判定に使った値(pairBond = 2人の絆の低い方)
   */
  simulate(state, teamA, teamB, extraOpts) {
    const self = Engine.showTagMatch;
    const a1 = teamA.fighter1, a2 = teamA.fighter2;
    const b1 = teamB.fighter1, b2 = teamB.fighter2;
    const bondA = self.pairBond(state, a1.id, a2.id);
    const bondB = self.pairBond(state, b1.id, b2.id);
    const lowA = self.isLowBond(bondA);
    const lowB = self.isLowBond(bondB);
    const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week, a1.id, b1.id, 0x7A60));
    // simulateTagMatch は必ずプロパティ経由で呼ぶ(auto-sim の計測フックが差し替えるため)
    const result = Engine.tagMatch.simulateTagMatch(
      { fighter1: lowA ? self.penalize(a1) : a1, fighter2: lowA ? self.penalize(a2) : a2 },
      { fighter1: lowB ? self.penalize(b1) : b1, fighter2: lowB ? self.penalize(b2) : b2 },
      rng,
      {
        ...(extraOpts || {}),
        bond_A: self.chemistryBond(state, a1.id, a2.id), bond_B: self.chemistryBond(state, b1.id, b2.id),
        tagExp_A: Engine.tagExp.getCount(state, a1.id, a2.id),
        tagExp_B: Engine.tagExp.getCount(state, b1.id, b2.id),
      }
    );
    const lowBondIds = [...(lowA ? [a1.id, a2.id] : []), ...(lowB ? [b1.id, b2.id] : [])];
    const roster = self.applyTrustPenalty(state.roster, lowBondIds, 1);
    return { result, roster, lowBondIds, bondA, bondB };
  },
};

// ══════════════════════════════════════════════════════════
//  Engine.wear — 連戦消耗モジュール（共通機構）
//  定義元: autumn-gauntlet-war-spec-v0.1 §3。同一興行内で連戦が発生する
//  イベント（春タッグリーグ / 秋4団体勝ち残り対抗戦 / 4年に一度PPVトーナメント）
//  で共用する。数値は嘘をつかない — 固定値ではなく試合の実ダメージから算出する。
//  Pure functions only.
// ══════════════════════════════════════════════════════════
Engine.wear = {
  /** wear = 12 + (1 - hpRatio) × 20  （レンジ12〜32） */
  calc(hpRatio) {
    const ratio = Engine.util.clamp(hpRatio == null ? 1 : hpRatio, 0, 1);
    return Engine.util.clamp(12 + (1 - ratio) * 20, 12, 32);
  },
  /** hpFinal/hpMax から hpRatio を算出（0〜1） */
  hpRatio(hpFinal, hpMax) {
    if (!hpMax) return 1;
    return Engine.util.clamp(hpFinal / hpMax, 0, 1);
  },
  /** 次戦condition = clamp(前戦condition - wear + recovery, floor, ceiling) */
  nextCondition(prevCondition, wear, recovery, floor, ceiling) {
    const f = floor != null ? floor : 40;
    const c = ceiling != null ? ceiling : 80;
    const base = prevCondition != null ? prevCondition : c;
    return Engine.util.clamp(base - (wear || 0) + (recovery || 0), f, c);
  },
  /** condition(0-100) を満タンHPに対する開始HP値へ変換する（_hpOverride 用） */
  toHpOverride(condition, fullHp) {
    const pct = Engine.util.clamp(condition == null ? 80 : condition, 1, 100);
    return Math.max(1, Math.round(fullHp * pct / 100));
  },
};
