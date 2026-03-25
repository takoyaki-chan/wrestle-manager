import {
  calculateOvr,
  calculateTeamChemistry,
  getPairKey,
  getRelationship,
  getStyleCompatibilityLabel,
} from "./tag-chemistry.js";

const MAX_TURNS = 48;
const HOT_TAG_BUFF_CHANCE = 0.22;

const STYLE_MOVES = {
  Grappler: [
    { name: "ショルダータックル", power: 9, hit: 74, kind: "strike", attackBias: { pw: 0.45, st: 0.25, te: 0.1, sp: 0.1, mn: 0.1 } },
    { name: "ベリー・トゥ・ベリー", power: 12, hit: 68, kind: "throw", attackBias: { pw: 0.5, te: 0.2, st: 0.15, sp: 0.05, mn: 0.1 } },
    { name: "グラウンドコントロール", power: 8, hit: 78, kind: "grind", attackBias: { te: 0.35, st: 0.25, mn: 0.2, pw: 0.1, sp: 0.1 } },
  ],
  Aerial: [
    { name: "ランニングクロスボディ", power: 8, hit: 80, kind: "aerial", attackBias: { sp: 0.45, te: 0.2, st: 0.15, mn: 0.1, pw: 0.1 } },
    { name: "スワンダイブ式アタック", power: 12, hit: 66, kind: "aerial", attackBias: { sp: 0.4, te: 0.2, mn: 0.15, st: 0.15, pw: 0.1 } },
    { name: "ミサイルドロップキック", power: 10, hit: 72, kind: "strike", attackBias: { sp: 0.4, pw: 0.2, te: 0.15, mn: 0.15, st: 0.1 } },
  ],
  Submission: [
    { name: "アームドラッグ", power: 7, hit: 82, kind: "grapple", attackBias: { te: 0.4, sp: 0.2, mn: 0.15, st: 0.15, pw: 0.1 } },
    { name: "関節の取り合い", power: 8, hit: 78, kind: "submission", attackBias: { te: 0.45, mn: 0.2, st: 0.15, sp: 0.1, pw: 0.1 } },
    { name: "絞り上げ", power: 10, hit: 74, kind: "submission", attackBias: { te: 0.4, st: 0.25, mn: 0.15, pw: 0.1, sp: 0.1 } },
  ],
  Allround: [
    { name: "ショートレンジラリアット", power: 9, hit: 75, kind: "strike", attackBias: { pw: 0.25, te: 0.2, sp: 0.2, st: 0.2, mn: 0.15 } },
    { name: "バックブリーカー", power: 11, hit: 70, kind: "throw", attackBias: { pw: 0.25, te: 0.25, st: 0.2, sp: 0.15, mn: 0.15 } },
    { name: "テンポチェンジ", power: 7, hit: 84, kind: "setup", attackBias: { te: 0.3, sp: 0.25, mn: 0.2, st: 0.15, pw: 0.1 } },
  ],
  Striker: [
    { name: "ミドルキック連打", power: 9, hit: 78, kind: "strike", attackBias: { sp: 0.25, pw: 0.3, mn: 0.15, st: 0.15, te: 0.15 } },
    { name: "膝蹴りカウンター", power: 11, hit: 72, kind: "strike", attackBias: { sp: 0.3, pw: 0.25, te: 0.15, mn: 0.15, st: 0.15 } },
    { name: "ローキック崩し", power: 8, hit: 82, kind: "setup", attackBias: { sp: 0.3, te: 0.2, pw: 0.2, mn: 0.15, st: 0.15 } },
  ],
  Brawler: [
    { name: "乱打戦", power: 10, hit: 72, kind: "strike", attackBias: { pw: 0.35, st: 0.2, mn: 0.15, sp: 0.15, te: 0.15 } },
    { name: "場外際の押し込み", power: 12, hit: 68, kind: "power", attackBias: { pw: 0.4, st: 0.2, mn: 0.15, te: 0.15, sp: 0.1 } },
    { name: "ラフファイト", power: 8, hit: 80, kind: "dirty", attackBias: { pw: 0.3, mn: 0.2, sp: 0.15, st: 0.2, te: 0.15 } },
  ],
};

const STYLE_FINISHERS = {
  Grappler: { name: "ハイアングル・スープレックス", power: 22, hit: 62, attackBias: { pw: 0.45, te: 0.2, st: 0.15, mn: 0.1, sp: 0.1 } },
  Aerial: { name: "スターダスト・スプラッシュ", power: 23, hit: 58, attackBias: { sp: 0.45, te: 0.2, mn: 0.15, st: 0.1, pw: 0.1 } },
  Submission: { name: "エンドレス・ロック", power: 21, hit: 65, attackBias: { te: 0.45, mn: 0.2, st: 0.15, sp: 0.1, pw: 0.1 } },
  Allround: { name: "ブレンド・ブレイカー", power: 22, hit: 60, attackBias: { pw: 0.2, te: 0.25, sp: 0.2, st: 0.2, mn: 0.15 } },
  Striker: { name: "ハイキック・エンド", power: 22, hit: 61, attackBias: { sp: 0.3, pw: 0.3, mn: 0.15, te: 0.1, st: 0.15 } },
  Brawler: { name: "ワイルド・ボム", power: 23, hit: 59, attackBias: { pw: 0.45, st: 0.2, mn: 0.15, te: 0.1, sp: 0.1 } },
};

const GENERIC_TAG_MOVES = {
  "Aerial|Allround": { name: "アシスト式ダイビングアタック", power: 16 },
  "Aerial|Grappler": { name: "投げ受け式フライングプレス", power: 17 },
  "Aerial|Striker": { name: "キックアシスト・ムーンサルト", power: 16 },
  "Allround|Grappler": { name: "連携バックドロップ", power: 15 },
  "Allround|Submission": { name: "崩しからのサンドイッチ極め", power: 15 },
  "Brawler|Striker": { name: "打撃ラッシュ", power: 17 },
  "Grappler|Submission": { name: "捕獲式コンビネーション", power: 16 },
  "Submission|Striker": { name: "打撃崩しからの締め上げ", power: 16 },
  "Brawler|Submission": { name: "荒らして極める", power: 16 },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function weightedPick(rng, items, weightKey = "weight") {
  const total = items.reduce((sum, item) => sum + item[weightKey], 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item[weightKey];
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function createFighterState(fighter) {
  const maxHp = Math.round(92 + (fighter.st * 0.68) + (fighter.mn * 0.12));
  return {
    ...fighter,
    ovr: calculateOvr(fighter),
    maxHp,
    hp: maxHp,
    legalTurns: 0,
    segmentTurns: 0,
    apronTurns: 0,
    damageTaken: 0,
    consecutiveDamageTurns: 0,
    hotTagBuffTurns: 0,
    hotTagBuffValue: 0,
    startsMatch: false,
  };
}

function createTeamState(label, fighters, chemistryInfo) {
  const fighterStates = fighters.map(createFighterState);
  const startingIndex = fighterStates[0].ovr >= fighterStates[1].ovr ? 0 : 1;
  fighterStates[startingIndex].startsMatch = true;
  return {
    label,
    fighters: fighterStates,
    legalIndex: startingIndex,
    isolationCount: 0,
    lastTagTurn: 0,
    failedTags: 0,
    successfulTags: 0,
    hotTags: 0,
    doubleTeams: 0,
    friendlyFire: 0,
    abandonments: 0,
    saveAttempts: 0,
    saveSuccesses: 0,
    counterSaves: 0,
    matchControlTurns: 0,
    chemistry: chemistryInfo,
    tagTypes: new Set(),
    legalTurnShare: new Map(),
    lastDoubleTeamTurn: -99,
  };
}

function getLegal(team) {
  return team.fighters[team.legalIndex];
}

function getApron(team) {
  return team.fighters[1 - team.legalIndex];
}

function hpPercent(fighter) {
  return (fighter.hp / fighter.maxHp) * 100;
}

function getHpRetention(fighter) {
  const hpPct = hpPercent(fighter);
  let retention;
  if (hpPct >= 50) {
    retention = 0.95 + ((hpPct - 50) / 50) * 0.05;
  } else if (hpPct >= 30) {
    retention = 0.75 + ((hpPct - 30) / 20) * 0.2;
  } else {
    retention = 0.6 + (hpPct / 30) * 0.15;
  }
  const mntEase = (1 - retention) * (fighter.mn / 100) * 0.28;
  return clamp(retention + mntEase, 0.6, 1);
}

function effectiveStat(fighter, stat) {
  const buff = fighter.hotTagBuffTurns > 0 ? fighter.hotTagBuffValue : 0;
  return fighter[stat] * getHpRetention(fighter) * (1 + buff);
}

function getDefenseScore(fighter) {
  return (effectiveStat(fighter, "st") * 0.34)
    + (effectiveStat(fighter, "te") * 0.22)
    + (effectiveStat(fighter, "mn") * 0.16)
    + (effectiveStat(fighter, "sp") * 0.14)
    + (effectiveStat(fighter, "pw") * 0.14);
}

function getAttackScore(fighter, move) {
  const bias = move.attackBias;
  return (effectiveStat(fighter, "pw") * (bias.pw || 0))
    + (effectiveStat(fighter, "sp") * (bias.sp || 0))
    + (effectiveStat(fighter, "te") * (bias.te || 0))
    + (effectiveStat(fighter, "st") * (bias.st || 0))
    + (effectiveStat(fighter, "mn") * (bias.mn || 0));
}

function getApronRecovery(fighter) {
  return 1.5 + (fighter.st / 100) * 0.35 + (fighter.mn / 100) * 0.15;
}

function log(match, text, type = "info") {
  match.log.push({ text, type, turn: match.turn });
}

function pushEvent(match, type, data = {}) {
  match.eventCounts[type] = (match.eventCounts[type] || 0) + 1;
  match.events.push({ type, turn: match.turn, ...data });
}

function createSegment(match, leftTeam, rightTeam, reason) {
  const leftLegal = getLegal(leftTeam);
  const rightLegal = getLegal(rightTeam);
  const segment = {
    number: match.segments.length + 1,
    reason,
    startingTurn: match.turn,
    turns: 0,
    matchup: `${leftLegal.name} vs ${rightLegal.name}`,
    tags: [],
  };
  leftLegal.segmentTurns = 0;
  rightLegal.segmentTurns = 0;
  match.segments.push(segment);
  return segment;
}

function getMoveForTurn(rng, attacker, defender) {
  const styleMoves = STYLE_MOVES[attacker.style] || STYLE_MOVES.Allround;
  const finisher = STYLE_FINISHERS[attacker.style] || STYLE_FINISHERS.Allround;
  const finisherThreshold = clamp(35 + (attacker.mn - defender.mn) * 0.15 + attacker.legalTurns * 1.2, 18, 62);
  const shouldUseFinisher = hpPercent(defender) <= finisherThreshold && rng() < 0.32;
  if (shouldUseFinisher) {
    return { ...finisher, kind: "finisher" };
  }
  return styleMoves[randomInt(rng, 0, styleMoves.length - 1)];
}

function getTagMove(fighterA, fighterB) {
  const key = [fighterA.style, fighterB.style].sort().join("|");
  return GENERIC_TAG_MOVES[key] || { name: `${getStyleCompatibilityLabel(fighterA.style, fighterB.style)}連携`, power: 15 };
}

function computeTouchIntent(team, otherTeam) {
  const legal = getLegal(team);
  const partner = getApron(team);
  const chemistry = team.chemistry.chemistry;
  const hpPct = hpPercent(legal);
  const partnerHpPct = hpPercent(partner);
  const opponentPressure = getLegal(otherTeam).consecutiveDamageTurns;

  const tacticalScore = (chemistry - 50) * 0.35 + Math.max(0, legal.legalTurns - 2) * 2.4 + (partnerHpPct - hpPct) * 0.08;
  const survivalScore = (60 - hpPct) * 0.9 + legal.consecutiveDamageTurns * 7 + opponentPressure * 1.2;
  const emergencyScore = (35 - hpPct) * 1.8;

  if (hpPct <= 35) {
    return { wants: true, type: "消耗タッチ", urgency: emergencyScore + 30 };
  }
  if (survivalScore > 18) {
    return { wants: true, type: "消耗タッチ", urgency: survivalScore };
  }
  if (tacticalScore > 20 && hpPct <= 85) {
    return { wants: true, type: "戦術タッチ", urgency: tacticalScore };
  }
  return { wants: false, type: null, urgency: 0 };
}

function computeTouchSuccess(team, otherTeam, rng) {
  const legal = getLegal(team);
  const opponent = getLegal(otherTeam);
  const hpScore = hpPercent(legal);
  const speedEdge = legal.sp - opponent.sp;
  const disruption = ((opponent.pw + opponent.te) / 2) - ((legal.sp + legal.te) / 2);
  const chance = 18 + (hpScore * 0.58) + (speedEdge * 0.18) - (disruption * 0.08);
  const finalChance = clamp(chance, 8, 92);
  return rng() * 100 < finalChance;
}

function resolveInterferenceSequence({
  match,
  rng,
  defendingTeam,
  attackingTeam,
  defender,
  attacker,
  baseChance,
  bond,
  triggerLabel,
}) {
  const helper = getApron(defendingTeam);
  defendingTeam.saveAttempts += 1;

  const abandonmentChance = clamp((55 - bond) * 0.32, 0, 18);
  if (rng() * 100 < abandonmentChance) {
    defendingTeam.abandonments += 1;
    pushEvent(match, "abandonment", { team: defendingTeam.label, helper: helper.name, defender: defender.name });
    log(match, `${helper.name}は${defender.name}を助けに行けない。見殺しが発生。`, "bad");
    return { saved: false, abandoned: true, countered: false };
  }

  const helperHpPct = hpPercent(helper);
  const hpAdj = (helperHpPct - 50) * 0.38;
  const bondAdj = (bond - 50) * 0.23;
  const penalty = defendingTeam.saveAttempts * 6;
  const rawChance = clamp(baseChance + hpAdj + bondAdj - penalty, 5, 95);

  if (rng() * 100 >= rawChance) {
    log(match, `${helper.name}が${triggerLabel}へ飛び込むも届かない。`, "minor");
    return { saved: false, abandoned: false, countered: false };
  }

  const attackingHelper = getApron(attackingTeam);
  const counterBond = attackingTeam.chemistry.bond;
  const counterBase = 60 + ((hpPercent(attackingHelper) - 50) * 0.2) + ((counterBond - 50) * 0.12) - (attackingTeam.counterSaves * 7);
  const counterChance = clamp(counterBase, 5, 88);
  if (rng() * 100 < counterChance) {
    attackingTeam.counterSaves += 1;
    pushEvent(match, "counterCut", { team: attackingTeam.label, helper: attackingHelper.name });
    log(match, `${attackingHelper.name}が割って入り、${helper.name}のカットインを封じた。`, "good");
    return { saved: false, abandoned: false, countered: true };
  }

  defendingTeam.saveSuccesses += 1;
  pushEvent(match, "cutIn", { team: defendingTeam.label, helper: helper.name, defender: defender.name });
  log(match, `${helper.name}が${triggerLabel}に成功。${defender.name}を救出した。`, "dramatic");
  defender.hp = Math.max(defender.hp, defender.maxHp * 0.08);
  return { saved: true, abandoned: false, countered: false };
}

function maybeFriendlyFire(match, rng, team, victim, source) {
  const lowChemistryRate = clamp(3.4 - (team.chemistry.chemistry * 0.03), 0.3, 3.2);
  const mntGuard = (getApron(team).mn + getLegal(team).mn) * 0.015;
  const finalChance = clamp(lowChemistryRate - mntGuard, 0.1, 2.6);
  if (rng() * 100 >= finalChance) return false;

  const damage = round(4 + rng() * 4, 1);
  victim.hp = Math.max(0, victim.hp - damage);
  team.friendlyFire += 1;
  pushEvent(match, "friendlyFire", { team: team.label, victim: victim.name, source });
  log(match, `${source}が乱れ、${victim.name}へ誤爆。チームワークの粗さが出た。`, "bad");
  return true;
}

function maybeDoubleTeam(match, rng, attackingTeam, defendingTeam) {
  if (match.turn - attackingTeam.lastDoubleTeamTurn < 3) return null;
  const legal = getLegal(attackingTeam);
  const helper = getApron(attackingTeam);
  const target = getLegal(defendingTeam);
  const chemistry = attackingTeam.chemistry.chemistry;
  const chance = clamp(2 + chemistry * 0.06, 2, 8);
  if (rng() * 100 >= chance) return null;

  const move = getTagMove(legal, helper);
  const damage = round(move.power + ((legal.pw + helper.te) - (target.st + target.mn) * 0.5) * 0.08 + rng() * 3, 1);
  target.hp = Math.max(0, target.hp - damage);
  target.damageTaken += damage;
  target.consecutiveDamageTurns += 1;
  attackingTeam.doubleTeams += 1;
  attackingTeam.lastDoubleTeamTurn = match.turn;
  pushEvent(match, "doubleTeam", { team: attackingTeam.label, move: move.name, target: target.name });
  log(match, `${legal.name}と${helper.name}が${move.name}。${target.name}へ${damage}ダメージ。`, "dramatic");
  maybeFriendlyFire(match, rng, attackingTeam, legal, move.name);
  return { move, damage, target };
}

function resolveAttack(match, rng, attackingTeam, defendingTeam) {
  const attacker = getLegal(attackingTeam);
  const defender = getLegal(defendingTeam);
  const move = getMoveForTurn(rng, attacker, defender);
  const attackScore = getAttackScore(attacker, move);
  const defenseScore = getDefenseScore(defender);
  const hitChance = clamp(move.hit + ((attackScore - defenseScore) * 0.22), 24, 92);

  if (move.kind === "finisher" && hpPercent(defender) > 18) {
    const relation = getRelationship(match.relationships, defender.id, getApron(defendingTeam).id);
    const preSave = resolveInterferenceSequence({
      match,
      rng,
      defendingTeam,
      attackingTeam,
      defender,
      attacker,
      baseChance: 40,
      bond: relation.averageBond,
      triggerLabel: "フィニッシャー迎撃",
    });
    if (preSave.saved) {
      return {
        move,
        hit: false,
        damage: 0,
        finisherInterrupted: true,
        attacker,
        defender,
      };
    }
  }

  if (rng() * 100 > hitChance) {
    const counterDamage = round(2 + rng() * 3, 1);
    attacker.hp = Math.max(0, attacker.hp - counterDamage);
    attacker.damageTaken += counterDamage;
    attacker.consecutiveDamageTurns += 1;
    defender.consecutiveDamageTurns = 0;
    log(match, `${defender.name}が${move.name}を読み切り、${attacker.name}に切り返し。`, "minor");
    return {
      move,
      hit: false,
      damage: counterDamage,
      attacker,
      defender,
      countered: true,
    };
  }

  const rawDamage = move.power + ((attackScore - defenseScore) * 0.085) + (rng() * 3.4 - 1.1);
  const damage = round(clamp(rawDamage, 4.5, move.kind === "finisher" ? 27 : 16), 1);
  defender.hp = Math.max(0, defender.hp - damage);
  defender.damageTaken += damage;
  defender.consecutiveDamageTurns += 1;
  attacker.consecutiveDamageTurns = 0;
  if (attacker.hotTagBuffTurns > 0) attacker.hotTagBuffTurns -= 1;

  attackingTeam.matchControlTurns += 1;
  log(match, `${attacker.name}の${move.name}が決まり、${defender.name}へ${damage}ダメージ。`, move.kind === "finisher" ? "dramatic" : "hit");

  return {
    move,
    hit: true,
    damage,
    attacker,
    defender,
    finisherInterrupted: false,
  };
}

function maybeFinishMatch(match, rng, attackingTeam, defendingTeam, attackResult) {
  const { attacker, defender, move, hit } = attackResult;
  if (!hit) return null;

  const defenderHpPct = hpPercent(defender);
  const pinSetup = move.kind === "finisher"
    || defenderHpPct <= 16
    || (defenderHpPct <= 24 && attackResult.damage >= 12);

  if (!pinSetup) return null;

  const relation = getRelationship(match.relationships, defender.id, getApron(defendingTeam).id);
  const save = resolveInterferenceSequence({
    match,
    rng,
    defendingTeam,
    attackingTeam,
    defender,
    attacker,
    baseChance: 70,
    bond: relation.averageBond,
    triggerLabel: "カットイン",
  });

  if (save.saved) {
    return { finished: false, saved: true };
  }

  if (save.countered) {
    log(match, `${attacker.name}がフォール体勢を維持し、そのまま3カウント。`, "finish");
  } else {
    log(match, `${attacker.name}が押さえ込み、3カウント。`, "finish");
  }

  return {
    finished: true,
    saved: false,
    save,
    type: move.kind === "finisher" ? "個人フィニッシャー" : "押さえ込み",
    finishMove: move.name,
    scorer: attacker.name,
    victim: defender.name,
    scorerId: attacker.id,
    victimId: defender.id,
  };
}

function runApronRecovery(team) {
  const helper = getApron(team);
  helper.apronTurns += 1;
  helper.hp = clamp(helper.hp + getApronRecovery(helper), 0, helper.maxHp);
}

function performTag(match, rng, team, otherTeam, intent) {
  const current = getLegal(team);
  const partner = getApron(team);
  const hotTagReady = team.isolationCount >= 3 && intent.type !== "戦術タッチ";

  if (!computeTouchSuccess(team, otherTeam, rng)) {
    team.failedTags += 1;
    team.isolationCount += 1;
    pushEvent(match, "tagFail", { team: team.label, wrestler: current.name });
    log(match, `${current.name}はコーナーへ向かうが、${getLegal(otherTeam).name}が引き離す。`, "bad");
    return null;
  }

  team.legalIndex = 1 - team.legalIndex;
  team.lastTagTurn = match.turn;
  team.successfulTags += 1;
  team.tagTypes.add(hotTagReady ? "ホットタグ" : intent.type);

  const tagType = hotTagReady ? "ホットタグ" : intent.type;
  const newLegal = getLegal(team);
  const segment = match.segments[match.segments.length - 1];
  segment.tags.push({ team: team.label, type: tagType, turn: match.turn });
  pushEvent(match, hotTagReady ? "hotTag" : "tag", { team: team.label, wrestler: newLegal.name, type: tagType });

  if (hotTagReady) {
    team.hotTags += 1;
    log(match, `${current.name}がついにタッチ成功。${newLegal.name}へホットタグ。`, "dramatic");
    if (rng() < HOT_TAG_BUFF_CHANCE) {
      newLegal.hotTagBuffTurns = 2 + Math.floor(newLegal.mn / 40);
      newLegal.hotTagBuffValue = 0.08;
      log(match, `${newLegal.name}に気迫の波。しばらく攻め手が鋭くなる。`, "good");
      pushEvent(match, "hotTagBuff", { team: team.label, wrestler: newLegal.name });
    }
  } else {
    log(match, `${current.name}が${newLegal.name}へ${tagType}。`, "good");
  }

  team.isolationCount = 0;
  return createSegment(match, match.leftTeam, match.rightTeam, `${team.label} ${tagType}`);
}

function updateRingTime(team) {
  const legal = getLegal(team);
  legal.legalTurns += 1;
  legal.segmentTurns += 1;
  team.legalTurnShare.set(legal.id, (team.legalTurnShare.get(legal.id) || 0) + 1);
}

function buildMq(match) {
  const ringTime = [...match.leftTeam.fighters, ...match.rightTeam.fighters].map((fighter) => fighter.legalTurns);
  const totalRingTime = ringTime.reduce((sum, value) => sum + value, 0) || 1;
  const shares = ringTime.map((value) => (value / totalRingTime) * 100);
  const meanShare = shares.reduce((sum, value) => sum + value, 0) / shares.length;
  const shareDeviation = Math.sqrt(shares.reduce((sum, value) => sum + ((value - meanShare) ** 2), 0) / shares.length);

  const avgOvrLeft = match.leftTeam.fighters.reduce((sum, fighter) => sum + fighter.ovr, 0) / 2;
  const avgOvrRight = match.rightTeam.fighters.reduce((sum, fighter) => sum + fighter.ovr, 0) / 2;
  const balanceBase = clamp(26 - Math.abs(avgOvrLeft - avgOvrRight) * 0.55, 8, 26);
  const exchangeQuality = clamp((match.damageTotal / Math.max(match.turn - 1, 1)) * 1.45, 8, 24);
  const offenseBase = round(10 + balanceBase * 0.78 + exchangeQuality * 0.6, 1);

  const showcaseBonus = round(clamp(13 - shareDeviation * 0.58, 0, 13), 1);
  const touchVarietyBonus = round(clamp((new Set([
    ...match.leftTeam.tagTypes,
    ...match.rightTeam.tagTypes,
  ])).size * 2.8, 0, 11), 1);

  const dramaBonus = round(clamp(
    (match.eventCounts.hotTag || 0) * 4.4
    + (match.eventCounts.doubleTeam || 0) * 2.1
    + (match.eventCounts.cutIn || 0) * 2.8
    + (match.eventCounts.counterCut || 0) * 1.9
    + (match.eventCounts.hotTagBuff || 0) * 1.2,
    0,
    18,
  ), 1);

  let finishBonus = 0;
  if (match.finish.type === "個人フィニッシャー") finishBonus += 7;
  if (match.eventCounts.cutIn || match.eventCounts.counterCut) finishBonus += 2.5;
  if (match.eventCounts.doubleTeam && match.finish.type === "押さえ込み") finishBonus += 1;
  finishBonus = round(clamp(finishBonus, 0, 10), 1);

  const longestSegmentTurns = Math.max(...match.segments.map((segment) => segment.turns));
  const isolationPenalty = round(clamp((longestSegmentTurns - 8) * 1.7, 0, 22), 1);
  const unusedPenalty = round(shares.reduce((sum, share) => sum + Math.max(0, 15 - share) * 0.52, 0), 1);
  const chaosPenalty = round((match.eventCounts.friendlyFire || 0) * 2.2 + (match.eventCounts.abandonment || 0) * 4, 1);

  const mq = round(clamp(
    offenseBase + showcaseBonus + touchVarietyBonus + dramaBonus + finishBonus
    - isolationPenalty - unusedPenalty - chaosPenalty,
    12,
    100,
  ), 0);

  return {
    total: mq,
    offenseBase,
    showcaseBonus,
    touchVarietyBonus,
    dramaBonus,
    finishBonus,
    isolationPenalty,
    unusedPenalty,
    chaosPenalty,
    longestSegmentTurns,
  };
}

function finalizeSegments(match) {
  match.segments.forEach((segment, index) => {
    const nextSegment = match.segments[index + 1];
    const endTurn = nextSegment ? nextSegment.startingTurn - 1 : match.turn - 1;
    segment.turns = Math.max(1, endTurn - segment.startingTurn + 1);
  });
}

function pickTouchOrder(leftTeam, rightTeam) {
  const leftHp = hpPercent(getLegal(leftTeam));
  const rightHp = hpPercent(getLegal(rightTeam));
  if (leftHp < rightHp) return [leftTeam, rightTeam];
  if (rightHp < leftHp) return [rightTeam, leftTeam];
  return [leftTeam, rightTeam];
}

export function simulateTagMatch({
  leftTeamName,
  rightTeamName,
  leftFighters,
  rightFighters,
  relationships,
  tagExperienceByPair,
  seed = 1,
}) {
  const rng = createRng(seed);
  const leftChemistry = calculateTeamChemistry(leftFighters[0], leftFighters[1], relationships, tagExperienceByPair);
  const rightChemistry = calculateTeamChemistry(rightFighters[0], rightFighters[1], relationships, tagExperienceByPair);

  const match = {
    turn: 1,
    log: [],
    events: [],
    eventCounts: {},
    damageTotal: 0,
    relationships,
    segments: [],
    leftTeam: createTeamState(leftTeamName, leftFighters, leftChemistry),
    rightTeam: createTeamState(rightTeamName, rightFighters, rightChemistry),
    finish: null,
  };

  createSegment(match, match.leftTeam, match.rightTeam, "試合開始");
  log(match, `${leftTeamName} vs ${rightTeamName} 開始。`, "header");

  while (match.turn <= MAX_TURNS && !match.finish) {
    updateRingTime(match.leftTeam);
    updateRingTime(match.rightTeam);

    const leftLegal = getLegal(match.leftTeam);
    const rightLegal = getLegal(match.rightTeam);
    const leftAttackChance = clamp(
      50
      + (effectiveStat(leftLegal, "sp") - effectiveStat(rightLegal, "sp")) * 0.18
      + (leftLegal.hotTagBuffTurns > 0 ? 6 : 0)
      - (rightLegal.hotTagBuffTurns > 0 ? 6 : 0),
      24,
      76,
    );

    const attackingTeam = rng() * 100 < leftAttackChance ? match.leftTeam : match.rightTeam;
    const defendingTeam = attackingTeam === match.leftTeam ? match.rightTeam : match.leftTeam;

    const attackResult = resolveAttack(match, rng, attackingTeam, defendingTeam);
    match.damageTotal += attackResult.damage || 0;

    runApronRecovery(match.leftTeam);
    runApronRecovery(match.rightTeam);

    maybeDoubleTeam(match, rng, attackingTeam, defendingTeam);

    const finish = maybeFinishMatch(match, rng, attackingTeam, defendingTeam, attackResult);
    if (finish?.finished) {
      match.finish = {
        ...finish,
        winningTeam: attackingTeam.label,
        losingTeam: defendingTeam.label,
      };
      break;
    }

    const touchOrder = pickTouchOrder(match.leftTeam, match.rightTeam);
    let segmentChanged = false;
    for (const team of touchOrder) {
      const opponent = team === match.leftTeam ? match.rightTeam : match.leftTeam;
      const intent = computeTouchIntent(team, opponent);
      if (!intent.wants) continue;
      const newSegment = performTag(match, rng, team, opponent, intent);
      if (newSegment) {
        segmentChanged = true;
        break;
      }
    }

    if (!segmentChanged) {
      match.segments[match.segments.length - 1].turns += 1;
    }

    match.turn += 1;
  }

  if (!match.finish) {
    const leftTotalHp = match.leftTeam.fighters.reduce((sum, fighter) => sum + fighter.hp, 0);
    const rightTotalHp = match.rightTeam.fighters.reduce((sum, fighter) => sum + fighter.hp, 0);
    match.finish = leftTotalHp >= rightTotalHp
      ? {
          type: "時間切れ判定",
          finishMove: "判定",
          scorer: getLegal(match.leftTeam).name,
          victim: getLegal(match.rightTeam).name,
          scorerId: getLegal(match.leftTeam).id,
          victimId: getLegal(match.rightTeam).id,
          winningTeam: match.leftTeam.label,
          losingTeam: match.rightTeam.label,
        }
      : {
          type: "時間切れ判定",
          finishMove: "判定",
          scorer: getLegal(match.rightTeam).name,
          victim: getLegal(match.leftTeam).name,
          scorerId: getLegal(match.rightTeam).id,
          victimId: getLegal(match.leftTeam).id,
          winningTeam: match.rightTeam.label,
          losingTeam: match.leftTeam.label,
        };
    log(match, "制限時間へ到達。残HP優勢側の判定勝ち。", "finish");
  }

  finalizeSegments(match);
  const mq = buildMq(match);

  const serializeFighter = (fighter) => ({
    id: fighter.id,
    name: fighter.name,
    style: fighter.style,
    ovr: fighter.ovr,
    hp: round(fighter.hp, 1),
    maxHp: fighter.maxHp,
    legalTurns: fighter.legalTurns,
    startsMatch: fighter.startsMatch,
  });

  return {
    seed,
    turns: match.turn,
    mq,
    finish: match.finish,
    segments: match.segments,
    log: match.log,
    events: match.events,
    eventCounts: match.eventCounts,
    leftTeam: {
      name: match.leftTeam.label,
      chemistry: match.leftTeam.chemistry,
      fighters: match.leftTeam.fighters.map(serializeFighter),
      hotTags: match.leftTeam.hotTags,
      successfulTags: match.leftTeam.successfulTags,
      failedTags: match.leftTeam.failedTags,
      doubleTeams: match.leftTeam.doubleTeams,
      saveSuccesses: match.leftTeam.saveSuccesses,
      abandonments: match.leftTeam.abandonments,
      friendlyFire: match.leftTeam.friendlyFire,
    },
    rightTeam: {
      name: match.rightTeam.label,
      chemistry: match.rightTeam.chemistry,
      fighters: match.rightTeam.fighters.map(serializeFighter),
      hotTags: match.rightTeam.hotTags,
      successfulTags: match.rightTeam.successfulTags,
      failedTags: match.rightTeam.failedTags,
      doubleTeams: match.rightTeam.doubleTeams,
      saveSuccesses: match.rightTeam.saveSuccesses,
      abandonments: match.rightTeam.abandonments,
      friendlyFire: match.rightTeam.friendlyFire,
    },
  };
}

export function runBatchSimulation({
  leftTeamName,
  rightTeamName,
  leftFighters,
  rightFighters,
  relationships,
  tagExperienceByPair,
  baseSeed = 1000,
  seedCount = 10,
  iterationsPerSeed = 10,
}) {
  const matches = [];
  for (let seedIndex = 0; seedIndex < seedCount; seedIndex += 1) {
    for (let iteration = 0; iteration < iterationsPerSeed; iteration += 1) {
      const seed = baseSeed + seedIndex * 97 + iteration * 13;
      matches.push(simulateTagMatch({
        leftTeamName,
        rightTeamName,
        leftFighters,
        rightFighters,
        relationships,
        tagExperienceByPair,
        seed,
      }));
    }
  }

  const leftWins = matches.filter((match) => match.finish.winningTeam === leftTeamName).length;
  const rightWins = matches.length - leftWins;
  const avgMq = matches.reduce((sum, match) => sum + match.mq.total, 0) / matches.length;
  const avgTurns = matches.reduce((sum, match) => sum + match.turns, 0) / matches.length;
  const avgHotTags = matches.reduce((sum, match) => sum + (match.eventCounts.hotTag || 0), 0) / matches.length;
  const avgCutIns = matches.reduce((sum, match) => sum + (match.eventCounts.cutIn || 0), 0) / matches.length;
  const avgDoubleTeams = matches.reduce((sum, match) => sum + (match.eventCounts.doubleTeam || 0), 0) / matches.length;

  const finishBreakdown = matches.reduce((acc, match) => {
    acc[match.finish.type] = (acc[match.finish.type] || 0) + 1;
    return acc;
  }, {});

  return {
    seedCount,
    iterationsPerSeed,
    totalMatches: matches.length,
    leftWins,
    rightWins,
    leftWinRate: round((leftWins / matches.length) * 100, 1),
    rightWinRate: round((rightWins / matches.length) * 100, 1),
    avgMq: round(avgMq, 1),
    avgTurns: round(avgTurns, 1),
    avgHotTags: round(avgHotTags, 2),
    avgCutIns: round(avgCutIns, 2),
    avgDoubleTeams: round(avgDoubleTeams, 2),
    finishBreakdown,
    notableMatch: matches.slice().sort((a, b) => b.mq.total - a.mq.total)[0],
  };
}
