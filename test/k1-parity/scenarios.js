'use strict';

// K-1 経路差分テストのシナリオ定義。
//
// 各シナリオは「実UIでロードした基準状態(base)」から興行前の状態 G0 を組み立てる。
// G0 はエンジン経路と実プレイ経路の両方にまったく同じものを渡すので、ここで状態を
// いじるのは「入力の設定」であって、どちらかの経路を有利/不利にするものではない。
//
// ここで使う Engine は headless-sim.loadEngines() が Node のグローバルに読み込んだもの
// (src/ と同一のコード)。カードの正規化や王者の戴冠など、入力の組み立てにだけ使う。

// 興行を始める前に片付けておく予約系のキー。残っていると実プレイ経路は
// 遠征・挑戦試合・奪還戦などの別フローへ分岐してしまい、通常興行の比較にならない。
const BOOKING_KEYS = [
  '_pendingAwayChallengeMatch', '_pendingUnifiedAwayMatch', '_pendingIncomingChallengeMatch',
  '_pendingChallengeMatch', '_pendingIncomingB3Match', '_pendingUnifiedIncomingMatch',
  '_pendingReclaim', '_awayChallengeUsedIds',
];
// 通常の比較では空にしておく派閥・社長室系の予約(専用シナリオで個別に入れる)
const DIRECTIVE_KEYS = [
  'bookedCommon1', '_pendingF07Directive', '_pendingF08Directive', '_pendingF09',
  '_pendingInternalChallenge', 'mediaSpotlight', '_pendingFactionEvent',
];

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function prepareBase(base) {
  const G = clone(base);
  for (const key of [...BOOKING_KEYS, ...DIRECTIVE_KEYS]) delete G[key];
  G.weekPhase = 'manage';
  G.offSeason = false;
  // 基準状態で怪我をしている選手は復帰させておく(入力の設定)。エンジンの変更で fixture の
  // 怪我人が増えると「12人の健康な選手」が揃わずシナリオが組めなくなるため
  // (2026-09-26: K-2+K-3+K-16 ほかの取り込み後、S2W14 で2人が怪我をしていた)。
  // 週次の復帰処理と同じく preInjuryPop も片付ける。怪我を扱う injury シナリオは自分で条件を入れる。
  G.roster = (G.roster || []).map(f => (f.injury ? Engine.popularity.clearPreInjury({ ...f, injury: null }) : f));
  if (!Engine.util.isRegularShowWeek(G.week)) {
    throw new Error(`base week ${G.week} is not a regular show week`);
  }
  return G;
}

function healthy(G) {
  return (G.roster || [])
    .filter(f => !f.injury && !f.forcedRest && !f.suspended && !f.isRental && (f.condition ?? 80) >= 40)
    .sort((a, b) => a.id - b.id);
}

function need(list, count, label) {
  if (list.length < count) throw new Error(`${label}: need ${count} healthy fighters, got ${list.length}`);
  return list.slice(0, count);
}

function single(left, right, extra = {}) {
  return { left: left.id, right: right.id, isTitle: false, ...extra };
}

function tag(a1, a2, b1, b2) {
  return {
    matchType: 'tag', isTitle: false,
    teamA: { fighter1: a1.id, fighter2: a2.id },
    teamB: { fighter1: b1.id, fighter2: b2.id },
  };
}

function finalizeCard(G, card, venueIdx) {
  const showCard = Engine.util.normalizeShowCardForVenue(card, G.week, venueIdx);
  const sanitized = Engine.title.sanitizeShowCardTitles({ ...G, showCard }, showCard);
  return { ...G, showVenue: venueIdx, showCard: sanitized };
}

function setRelation(G, a, b, values) {
  const relationships = { ...(G.relationships || {}) };
  for (const key of [`${a}>${b}`, `${b}>${a}`]) {
    relationships[key] = { bond: 50, rivalry: 0, ...(relationships[key] || {}), ...values };
  }
  return { ...G, relationships };
}

function singlesCard(fighters) {
  const card = [];
  for (let i = 0; i + 1 < fighters.length; i += 2) card.push(single(fighters[i], fighters[i + 1]));
  return card;
}

const ARENA = 7; // アリーナ(6枠)
const DOME = 9;

const scenarios = [
  {
    name: 'single-basic',
    title: '通常のシングル興行(アリーナ6試合・王座戦なし)',
    build(base) {
      const G = prepareBase(base);
      const fighters = need(healthy(G), 12, this.name);
      return { G0: finalizeCard(G, singlesCard(fighters), ARENA) };
    },
  },
  {
    name: 'tag-mixed',
    title: 'タッグ入り興行(シングル2+タッグ2)',
    build(base) {
      const G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const card = [single(f[0], f[1]), tag(f[2], f[3], f[4], f[5]), tag(f[6], f[7], f[8], f[9]), single(f[10], f[11])];
      return { G0: finalizeCard(G, card, ARENA) };
    },
  },
  {
    name: 'mq-record',
    title: '歴代最高評価(シングル/タッグ別)が更新される興行 — 記録の下限を下げて必ず更新させる',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      // 記録の値だけを下げる(下限値の定数は変えない)。シングルもタッグも今夜の試合で必ず塗り替わる
      G = {
        ...G,
        mqRecord: { value: 20, holderIds: null, orgId: null, season: null, week: null, stage: null },
        mqRecordTag: { value: 20, holderIds: null, orgId: null, season: null, week: null, stage: null },
      };
      const card = [single(f[0], f[1]), tag(f[2], f[3], f[4], f[5]), tag(f[6], f[7], f[8], f[9]), single(f[10], f[11])];
      return { G0: finalizeCard(G, card, ARENA) };
    },
  },
  {
    name: 'tag-lowbond',
    title: '不仲ペア(bond≤20)のタッグ入り興行 — 全試合スキップ/1試合ずつスキップの両方',
    modes: ['skipAll', 'skipEach'],
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      G = setRelation(G, f[2].id, f[3].id, { bond: 10 });
      const card = [single(f[0], f[1]), tag(f[2], f[3], f[4], f[5]), tag(f[6], f[7], f[8], f[9]), single(f[10], f[11])];
      return { G0: finalizeCard(G, card, ARENA), notes: [`low-bond pair: ${f[2].id} & ${f[3].id}`] };
    },
  },
  {
    name: 'title-vacant',
    title: '王座戦入り興行(初代王者決定戦・王座空位)',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      G = { ...G, titleEstablished: true, titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } } };
      const card = singlesCard(f);
      card[0] = { ...card[0], isTitle: true };
      return { G0: finalizeCard(G, card, ARENA) };
    },
  },
  {
    name: 'title-defense',
    title: '王座戦入り興行(防衛戦・王者あり)',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const byOvr = [...f].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a) || a.id - b.id);
      const champ = byOvr[0];
      const challenger = byOvr[1];
      G = { ...G, titleEstablished: true };
      const crowned = Engine.title.crownChampion(G, champ.id);
      G = { ...G, titles: crowned.titles, roster: crowned.roster, lastTitleMatchWeek: Engine.title.getAbsWeek(G) - 13 };
      const rest = f.filter(x => x.id !== champ.id && x.id !== challenger.id);
      const card = [single(champ, challenger, { isTitle: true }), ...singlesCard(rest)];
      return { G0: finalizeCard(G, card, ARENA), notes: [`champion ${champ.id} vs challenger ${challenger.id}`] };
    },
  },
  {
    name: 'intrusion',
    title: '王座戦に他団体の選手が乱入する興行(防衛3回以上の王者)— 乱入が起きる乱数シードを探索',
    seedSearch: { intrusion: true },
    build(base, { rngSeed } = {}) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const byOvr = [...f].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a) || a.id - b.id);
      const champ = byOvr[0];
      const challenger = byOvr[1];
      G = { ...G, titleEstablished: true, lastIntrusionWeek: 0 };
      const crowned = Engine.title.crownChampion(G, champ.id);
      G = {
        ...G, roster: crowned.roster, lastTitleMatchWeek: Engine.title.getAbsWeek(G) - 13,
        titles: { ...crowned.titles, world: { ...crowned.titles.world, defenses: 3 } },
      };
      if (rngSeed != null) G = { ...G, rngSeed };
      const rest = f.filter(x => x.id !== champ.id && x.id !== challenger.id);
      const card = [single(champ, challenger, { isTitle: true }), ...singlesCard(rest)];
      return { G0: finalizeCard(G, card, ARENA), notes: [`champion ${champ.id} (3 defenses) vs challenger ${challenger.id}`] };
    },
  },
  {
    name: 'rivalry',
    title: '因縁カード入り興行(宿怨の2度目の決着候補+好敵手寄りの候補+因縁カード)',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const entry = { matches: 8, lastWeek: G.week - 2, resolutionCount: 0, lastBand: 0, oneSided: null };
      // メイン: 好敵手寄り(rivalry 66/bond 60)の1度目の決着候補。評価が閾値に届かなければ持ち越し
      G = setRelation(G, f[0].id, f[1].id, { rivalry: 66, bond: 60 });
      const keyMain = Engine.title.getRivalryKey(f[0].id, f[1].id);
      // 第2試合: 因縁カード(★の因縁カード判定 rivalry≥30)
      G = setRelation(G, f[2].id, f[3].id, { rivalry: 40, bond: 45 });
      // 第3試合: 宿怨の2度目の決着候補(rivalry 88/bond 30・決着1回済み)。
      //   決着すれば bitter(宿怨)になる。険悪ペア(rivalry≥60・平均bond≤30)でもある
      G = setRelation(G, f[4].id, f[5].id, { rivalry: 88, bond: 30 });
      const keyBitter = Engine.title.getRivalryKey(f[4].id, f[5].id);
      G = { ...G, rivalries: { ...(G.rivalries || {}), [keyMain]: { ...entry }, [keyBitter]: { ...entry, resolutionCount: 1 } } };
      return { G0: finalizeCard(G, singlesCard(f), ARENA), notes: [`first-resolution candidate ${keyMain}, bitter candidate ${keyBitter}`] };
    },
  },
  {
    name: 'veteran',
    title: 'ベテラン出場興行(年齢倍率の確認: 23〜33歳を出場させる)',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const ages = [27, 29, 31, 33, 25, 23];
      const ageById = new Map(f.slice(0, ages.length).map((x, i) => [x.id, ages[i]]));
      G = { ...G, roster: G.roster.map(x => (ageById.has(x.id) ? { ...x, age: ageById.get(x.id) } : x)) };
      return { G0: finalizeCard(G, singlesCard(need(healthy(G), 12, this.name)), ARENA), notes: [`ages ${JSON.stringify([...ageById])}`] };
    },
  },
  {
    name: 'lastrun',
    title: 'ラストラン中の選手が出場する興行',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const startAbs = Engine.util.absWeek(G.season, G.week) - 4;
      G = { ...G, roster: G.roster.map(x => (x.id === f[0].id ? Engine.career.ensure({ ...x, lastRun: true, lastRunWeek: startAbs }) : x)) };
      return { G0: finalizeCard(G, singlesCard(f), ARENA), notes: [`lastRun fighter ${f[0].id}`] };
    },
  },
  {
    name: 'injury',
    title: '怪我が出やすい興行(低コンディション・高消耗・険悪ペア)— 怪我引退が出る乱数シードを探索',
    // エンジン経路で「怪我引退が1件以上」かつ「通常の怪我が1件以上」出るシードを選ぶ
    seedSearch: { minRetire: 1, minPlainInjury: 1 },
    build(base, { rngSeed } = {}) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const ids = new Set(f.map(x => x.id));
      G = { ...G, roster: G.roster.map(x => (ids.has(x.id) ? { ...x, condition: 42, wear: 62 } : x)) };
      G = setRelation(G, f[0].id, f[1].id, { rivalry: 75, bond: 20 });
      if (rngSeed != null) G = { ...G, rngSeed };
      return { G0: finalizeCard(G, singlesCard(f), ARENA), notes: [`hostile pair ${f[0].id}-${f[1].id}`] };
    },
  },
  {
    name: 'departure',
    title: '信頼の底をついた選手がいる興行(trust<15)— 突然の退団が出る乱数シードを探索',
    seedSearch: { minDeparted: 1 },
    build(base, { rngSeed } = {}) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const low = new Set(f.slice(6, 12).map(x => x.id));
      G = { ...G, roster: G.roster.map(x => (low.has(x.id) ? { ...x, trust: 6 } : x)) };
      if (rngSeed != null) G = { ...G, rngSeed };
      return { G0: finalizeCard(G, singlesCard(f), ARENA), notes: [`trust 6: ${[...low].join(',')}`] };
    },
  },
  {
    name: 'factions',
    title: '派閥どうしの対戦(派閥2つ・対抗戦F09の枠・派閥員どうしの王座決定戦)',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const existing = (G.factions || []).find(x => Array.isArray(x.memberIds) && x.memberIds.length >= 4 && x.status !== 'dissolved');
      if (!existing) throw new Error(`${this.name}: base state has no faction to pair with`);
      const inExisting = new Set(existing.memberIds);
      // 新しい派閥(900)の顔ぶれは、どの派閥にも属していない選手から選ぶ(2026-09-26)。
      // 基準状態に派閥が2つある fixture で、もう一方の派閥の選手を 900 にも入れてしまい、
      // validateGameState の「複数派閥に所属」の違反を両経路に出していた(入力の作り方の不具合)
      const inAnyFaction = new Set((G.factions || [])
        .filter(x => x.status !== 'dissolved')
        .flatMap(x => (Array.isArray(x.memberIds) ? x.memberIds : [])));
      const outsiders = f.filter(x => !inExisting.has(x.id) && !inAnyFaction.has(x.id));
      const insiders = f.filter(x => inExisting.has(x.id) && x.id !== existing.leaderId);
      const leaderA = G.roster.find(x => x.id === existing.leaderId);
      // 使うのは insiders[0..2] の3人(2026-09-26: 基準状態の派閥が4人=リーダー+3人になったので下限を実際の使用数に合わせた)
      if (outsiders.length < 5 || insiders.length < 3 || !leaderA) throw new Error(`${this.name}: not enough fighters to form a second faction`);
      const newMembers = outsiders.slice(0, 4);
      const factionB = {
        ...clone(existing), id: 900, name: `${newMembers[0].surname || newMembers[0].name}派`,
        leaderId: newMembers[0].id, memberIds: newMembers.map(x => x.id), momentum: 0,
      };
      G = {
        ...G,
        titleEstablished: true,
        titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } },
        factions: [...G.factions, factionB],
        _pendingF09: { factionAId: existing.id, factionBId: factionB.id },
      };
      const rest = f.filter(x => ![leaderA.id, ...insiders.slice(0, 3).map(y => y.id), ...newMembers.map(y => y.id)].includes(x.id));
      const card = [
        single(insiders[0], newMembers[1], { isTitle: true }),                  // 派閥員(非リーダー)どうしの王座決定戦
        single(leaderA, newMembers[0], { _f09Locked: true }),                   // リーダー対決(F09枠)
        single(insiders[1], newMembers[2], { _f09Locked: true }),
        single(insiders[2], newMembers[3], { _f09Locked: true }),
        ...singlesCard(rest).slice(0, 2),
      ];
      return {
        G0: finalizeCard(G, card, ARENA),
        notes: [`faction ${existing.id}(leader ${leaderA.id}) vs faction 900(leader ${newMembers[0].id}); _pendingF09 set`],
      };
    },
  },
  {
    name: 'dome',
    title: 'ドーム興行(メイン=大一番ルール・ドームの経歴記録)',
    build(base) {
      const G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      return { G0: finalizeCard(G, singlesCard(f), DOME) };
    },
  },
  {
    name: 'directives',
    title: '社長室・派閥・節目の予約が載った興行(密着取材の最終回+F07メイン推薦+節目のバフ)',
    build(base) {
      let G = prepareBase(base);
      const f = need(healthy(G), 12, this.name);
      const notes = [];
      G = { ...G, mediaSpotlight: { fighterId: f[0].id, fighterName: f[0].name, totalMQ: 150, matchCount: 2, remainingShows: 1 } };
      notes.push(`mediaSpotlight on ${f[0].id} (last show)`);
      // 節目イベントの選択で付くバフ(週数/興行数で切れるもの)。付与・減算・週次資金は画面側だけが扱う
      G = {
        ...G,
        milestoneBuffs: [
          { type: 'weekly_funds', amount: 100, weeks: 3, remainingWeeks: 3, source: 'k1-parity' },
          { type: 'rivalry_chance_up', shows: 2, remainingShows: 2, source: 'k1-parity' },
        ],
      };
      notes.push('milestoneBuffs: weekly_funds(3w) + rivalry_chance_up(2 shows)');
      const faction = (G.factions || []).find(x => Array.isArray(x.memberIds) && x.memberIds.length > 0);
      if (faction) {
        G = { ...G, _pendingF07Directive: { type: 'DEMAND_MAIN', factionId: faction.id, remainingShows: 3 } };
        notes.push(`F07 DEMAND_MAIN for faction ${faction.id} (members ${faction.memberIds.join(',')})`);
      } else {
        notes.push('no faction in base state: F07 directive skipped');
      }
      return { G0: finalizeCard(G, singlesCard(f), ARENA), notes };
    },
  },
];

module.exports = { scenarios, prepareBase };
