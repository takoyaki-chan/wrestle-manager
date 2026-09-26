#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  退団寸前の引き留め(docs/care-last-warning-design-v0.1.md)の計測版
//
//  test/auto-sim.js を同じプロセスで走らせ、差し込み口(global.__WM_AUTOSIM_HOOKS)から
//  自団体の選手の信頼の動きを「何が下げたか」に分けて記録する。src も auto-sim.js も変えない。
//  (--enc で声かけの自動実行を足す変種、--lw で設計案の数値を試す変種は、Engine の関数を
//   このプロセスの中でだけ包んで行う)
//
//  使い方(大ロスターは環境変数 WM_FACTION_FIXTURE=1。設計書の付録 A も参照):
//    node test/care-last-warning-probe.js [季数=40] [シード=42] [オプション]
//      --book=random|merit|star : カード編成。random=auto-sim のまま(くじ)/ merit=格に±8の揺らぎ / star=格の順
//                                 (auto-sim.js を文字列で読み、カード編成の1行だけ差し替えて走らせる)
//      --care          : auto-sim のケア自動実行(決裁書類)をオン
//      --enc=all       : 毎週、声をかける理由がある選手(信頼50未満・スランプ)全員に声をかける
//      --enc=danger    : 毎週、信頼20未満の選手にだけ声をかける
//      --lw [--lwmult=0.25 --lwhi=25 --lwlo=20] : 設計案 A の仮の実装(声かけの効き目を帯で下げる。lwEncourageMult)
//      --bmech [--relief=0.5 --decay=0.8 --share=0.3] : 設計案 B の仮の実装(原因の帳簿・噂の原因・
//                        原因に合った手当てで帳簿の半分が戻る・以後は低い帯の戻りの鈍りを外す)
//      --remedy [--until=25] : 自動プレイヤーが噂の子(信頼 until 未満の間)に原因に合った既存の手を打つ
//                        (出番→次の興行に入れる / 人間関係・空気→慰労会 / それ以外→ボーナス支給願)
//      --trace         : 応えた後の選手の軌跡を stderr に出す(調査用)
//    何も付けなければ auto-sim と同じ軌道(意味の指紋が一致する)。
//
//  ■ 本体に実装した後(2026-09-26〜。Engine.trust.consumeWarningAnswer がある src)
//    A・B は本体が行うので、--lw / --bmech は何もしない(付けても無視する)。--remedy は auto-sim の --remedy
//    (--until は --remedy-until)にそのまま渡し、自動プレイヤーの手は auto-sim 側が打つ。噂の原因・応えた回・応えた後の
//    行方は、本体が選手に付ける噂の状態(f.lastWarning)から読む。WM_SOURCE_REF で実装前の src を読めば従来どおり
//    (計測器の仮の実装が動く)。
//
//  出す数字:
//    - 信頼20未満・15未満に入った回数(のべ)と人数、突然の退団の件数、契約更改での退団(信頼30未満)
//    - 20を割ったときの直近12週の信頼の減り方を原因別に(出番なし・待遇不満G1〜G4・関係・自然減・
//      士気・仲間の退団・約束破り・派閥・イベント・その他)と、その最大の原因のまとまり
//    - 20/15を割った時点で立っているフラグの割合
//    - 15未満・20未満のエピソードの結末(突然の退団/契約で退団/25まで回復/その他で離脱)
//    - --bmech のとき: 帳簿が選んだ噂の原因、応えた回数とその後(翌週の信頼・25に届いたか・その前に去ったか)
// ══════════════════════════════════════════════════════════════════════════════

const path = require('path');

const argv = process.argv.slice(2);
const flags = argv.filter(a => a.startsWith('--'));
const pos = argv.filter(a => !a.startsWith('--'));
const SEASONS = parseInt(pos[0], 10) || 40;
const SEED = pos[1] != null ? parseInt(pos[1], 10) : 42;
const flagVal = (name, dflt) => {
  const f = flags.find(x => x.startsWith(`--${name}=`));
  return f ? f.slice(name.length + 3) : dflt;
};
const CARE = flags.includes('--care');
const ENC = flagVal('enc', 'none');
const LW = flags.includes('--lw');
const LW_MULT = parseFloat(flagVal('lwmult', '0.25'));
const REMEDY = flags.includes('--remedy');
const REMEDY_UNTIL = parseFloat(flagVal('until', '25'));          // 自動プレイヤーが手当てを続ける信頼の上限(既定25)
const BMECH = flags.includes('--bmech');                          // 設計案 B の仕組み(原因に合った手当てで戻る)
const RELIEF = parseFloat(flagVal('relief', '0.5'));              // その原因で減った分のうち、すぐ戻る割合
const WARN_CLEAR = 30;                                            // 噂の状態が解ける信頼(20の噂の再武装と同じ)
const TRACE = flags.includes('--trace');                          // 応えた後の軌跡を stderr に出す(調査用)
const WINDOW = 12; // 週。20を割ったときに振り返る期間(= 通常興行6回)
const BOOK = flagVal('book', 'random');
// 本体に A・B が実装されているか(読み込む src の management.js の文面で判定。WM_SOURCE_REF にも従う)
const ENGINE_B = (() => {
  const fsx = require('fs');
  let txt;
  if (process.env.WM_SOURCE_REF) {
    txt = require('child_process').execFileSync('git', ['show', `${process.env.WM_SOURCE_REF}:src/management.js`],
      { cwd: path.join(__dirname, '..'), encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
  } else {
    txt = fsx.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
  }
  return txt.includes('consumeWarningAnswer(fighter, cause, by, absWeek)');
})();
// 本体の原因のキー → この計測器のまとまりの名前
const ENGINE_CAUSE_JA = { stage: '出番', pay: '給与', title: '王座', bonds: '人間関係', air: '空気', promise: '約束', faction: '派閥', general: 'general' };
const bookStats = { shows: 0, eligible: 0, slots: 0 };

// ── 集計 ──
const P = {
  ticks: 0, seasonsSeen: new Set(), rosterWeeks: 0,
  crossings20: 0, crossings15: 0, fighters20: new Set(), fighters15: new Set(),
  sudden: [], contractDepart: [],
  windowSums: {},            // 20を割ったときの直近12週の原因別合計(負の寄与のみ・正の寄与は別)
  windowPos: {},
  primary: {},               // 最大の負の寄与の原因
  flagsAt20: { n: 0, G1: 0, G2: 0, G3: 0, G4: 0, streak2: 0, R1: 0, R2: 0, R5: 0, lowMQ: 0, morale45: 0, none: 0 },
  flagsAt15: { n: 0, G1: 0, G2: 0, G3: 0, G4: 0, streak2: 0, R1: 0, R2: 0, R5: 0, lowMQ: 0, morale45: 0, none: 0 },
  showsBelow15: [],          // 15未満の滞在中に迎えた通常興行の回数(エピソードごと)
  outcomes: { sudden: 0, contract: 0, recovered: 0, leftOther: 0, open: 0 },
  outcomes20: { sudden: 0, contract: 0, recovered: 0, leftOther: 0, open: 0 },
  decompMismatch: 0, decompChecks: 0,
  encourageCount: 0, encourageInDanger: 0,
  remedyCount: {},
  weeksBelow20: 0, weeksBelow15: 0,
  minTrustAtCheck: [],
  // 退団の判定を受けた回数(興行×信頼15未満の選手)
  departureRolls: 0,
};

const add = (o, k, v) => { o[k] = (o[k] || 0) + v; };
// 原因のまとまり(設計書 §4 の「においわせる原因」の単位)
const GROUP = {
  bench: '出番', G4: '出番',
  G1: '給与', G2: '給与',
  G3: '王座',
  R1: '人間関係', R2: '人間関係', R5: '人間関係', relStory: '人間関係', friendLeft: '人間関係',
  moraleErosion: '空気', lowMQ: '試合の質',
  pledgeBroken: '約束', faction: '派閥', event: 'イベント', contract: '契約',
  natural: '自然減', gravity: '自然減',
};
P.primaryGroup = {};
P.departGroup = {};
P.warnCause = {};
P.causeAgree = 0;
P.recoveredAnswered = 0;
P.weeksToRecover = [];
P.remedySpend = 0;
P.remedyDp = 0;
P.answers = [];           // { tick, t0, relief, done: 'ok'|'left', weeks }
P.recoveredByCause = {};  // 20未満エピソードが25まで戻ったとき、噂の原因ごとに
P.closedByCause = {};
const priorityIds = new Set(); // 設計案 B の自動プレイヤー: 出番が原因の子を次の興行に入れる

// 選手ごとの状態
const F = new Map(); // id -> { prevTrust, pendingAttr: {cat: v}, hist: [{tick, cat, v}], lastFlags, ep20, ep15 }
function fs(id) {
  if (!F.has(id)) F.set(id, { prevTrust: null, pendingAttr: {}, hist: [], lastFlags: null, ep20: null, ep15: null, strain: {}, warn: null });
  return F.get(id);
}
let playerIds = new Set();
let tick = 0;

// ── 帰属(どの関数がどれだけ信頼を動かしたか)。入れ子は内側を差し引く ──
const frameStack = [];
function trustMapFrom(x) {
  if (!x) return null;
  let arr = null;
  if (Array.isArray(x)) arr = x;
  else if (Array.isArray(x.roster)) arr = x.roster;
  else if (x.state && Array.isArray(x.state.roster)) arr = x.state.roster;
  if (!arr) return null;
  const m = new Map();
  for (const f of arr) if (f && f.id != null && playerIds.has(f.id)) m.set(f.id, f.trust != null ? f.trust : 50);
  return m;
}
function attribute(id, cat, v) {
  if (!v || !isFinite(v)) return;
  const st = fs(id);
  add(st.pendingAttr, cat, v);
  st.hist.push({ tick, cat, v });
  // 設計案 B の「原因の帳簿」(減った分を原因のまとまりごとに積む。興行ごとに ×STRAIN_DECAY で薄れる)
  if (v < 0) {
    const g = STRAIN_GROUP[cat];
    if (g) add(st.strain, g, -v);
  }
}
// 帳簿に積むまとまり(設計書 §5.1)。契約での減り(昇給を断られた等)は給与に入れる
const STRAIN_GROUP = {
  bench: '出番', G4: '出番',
  G1: '給与', G2: '給与', contract: '給与',
  G3: '王座',
  R1: '人間関係', R2: '人間関係', R5: '人間関係', relStory: '人間関係', friendLeft: '人間関係',
  moraleErosion: '空気',
  pledgeBroken: '約束',
  faction: '派閥',
  natural: '自然減', gravity: '自然減', lowMQ: 'その他', event: 'その他', other: 'その他',
};
const HINTABLE = ['出番', '給与', '王座', '人間関係', '空気', '約束', '派閥'];
const STRAIN_DECAY = parseFloat(flagVal('decay', '0.8'));
const CAUSE_SHARE = parseFloat(flagVal('share', '0.3'));
function pickCause(strain) {
  const total = Object.values(strain).reduce((a, b) => a + b, 0);
  if (total <= 0) return 'general';
  let best = null, bv = 0;
  for (const g of HINTABLE) if ((strain[g] || 0) > bv) { bv = strain[g]; best = g; }
  return best && bv / total >= CAUSE_SHARE ? best : 'general';
}
function wrapAttr(obj, name, cat, pickIn) {
  const orig = obj[name];
  if (typeof orig !== 'function') return;
  obj[name] = function wrapped(...args) {
    const inArg = pickIn ? pickIn(args) : args.find(a => trustMapFrom(a));
    const before = trustMapFrom(inArg);
    const frame = { inner: new Map() };
    frameStack.push(frame);
    let out;
    try { out = orig.apply(this, args); } finally { frameStack.pop(); }
    if (before) {
      const after = trustMapFrom(out);
      if (after) {
        const parent = frameStack[frameStack.length - 1];
        for (const [id, t0] of before) {
          if (!after.has(id)) continue;
          const raw = after.get(id) - t0;
          const net = raw - (frame.inner.get(id) || 0);
          const label = typeof cat === 'function' ? cat(args, out) : cat;
          if (Math.abs(net) > 1e-9) attribute(id, label, net);
          if (parent) parent.inner.set(id, (parent.inner.get(id) || 0) + raw);
        }
      }
    }
    return out;
  };
}

// ── 興行後の信頼更新を原因別に分解する(applyShowTrust と同じ式をなぞる) ──
function decomposeShowTrust(E, roster, results, titles, state, newRoster) {
  const participated = new Set();
  results.forEach(r => {
    if (r.matchType === 'tag') Object.keys(r.perFighter).forEach(id => participated.add(Number(id)));
    else { participated.add(r.left.id); participated.add(r.right.id); }
  });
  const titleF = new Set();
  results.filter(r => r.matchType !== 'tag' && (r.isTitle || r.isTitleMatch)).forEach(r => { titleF.add(r.left.id); titleF.add(r.right.id); });
  const mainF = new Set();
  if (results.length) {
    const m = results[0];
    if (m.matchType === 'tag') Object.keys(m.perFighter).forEach(id => mainF.add(Number(id)));
    else { mainF.add(m.left.id); mainF.add(m.right.id); }
  }
  const rivF = new Set();
  results.forEach(r => { if (r.matchType !== 'tag' && (r.rivalryBonus || r.rivalryLevel)) { rivF.add(r.left.id); rivF.add(r.right.id); } });
  const goodF = new Set();
  results.forEach(r => { if ((r.mq || 0) >= 70) {
    if (r.matchType === 'tag') Object.keys(r.perFighter).forEach(id => goodF.add(Number(id)));
    else { goodF.add(r.left.id); goodF.add(r.right.id); }
  } });
  const seniorCount = roster.filter(f => !f.injury && !f.isRental && (f.trust != null ? f.trust : 50) >= 70).length;
  const morale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
  const hasLeader = id => (state.roster || []).some(c => c.id !== id && !c.isRental && Traits.has(c, 'リーダー気質') && !c.injury);
  const newById = new Map(newRoster.map(f => [f.id, f]));
  const currentWeek = (state.season || 1) * 100 + (state.week || 1);

  for (const f of roster) {
    if (!playerIds.has(f.id)) continue;
    if (f.injury || f.onLeave) continue;
    const nf = newById.get(f.id);
    if (!nf) continue;
    const mn = f.mn || 50;
    const old = f.trust != null ? f.trust : 50;
    const comp = {};
    // 本体の B: この興行で出番・王座の手当てが成立した(応えた週がこの週)/すでに応えてもらえた噂の状態の選手は、戻りの鈍りが外れる
    const nowAbs = E.util.absWeek(state.season || 1, state.week || 1);
    const nlw = ENGINE_B ? nf.lastWarning : null;
    const answeredNow = !!(nlw && nlw.answered && nlw.answeredWeek === nowAbs && (nlw.answeredBy === 'card' || nlw.answeredBy === 'titleMatch')
      && !(f.lastWarning && f.lastWarning.answered));
    const answeredBefore = !!(ENGINE_B && f.lastWarning && f.lastWarning.answered && old < 30);
    if (participated.has(f.id)) {
      const base = 1.53 * ((answeredNow || answeredBefore) ? 1 : E.trust.recoveryMult(old));
      let extra = 0;
      if (mainF.has(f.id)) extra += 1.07;
      if (titleF.has(f.id)) extra += 1.84;
      if (rivF.has(f.id)) extra += 0.77;
      if (goodF.has(f.id)) extra += 0.54;
      const tot = E.trust.applyCoeff(base + extra, mn) * E.trust.gainMult(old);
      comp.appear = tot * base / (base + extra);
      if (extra) comp.stage = tot * extra / (base + extra);
      const fm = results.find(r => r.matchType === 'tag' ? !!r.perFighter[f.id] : (r.left.id === f.id || r.right.id === f.id));
      const th = 40 + E.orgPop.getTrustMQShift(state.orgPop || 0);
      if (fm && (fm.mq || 0) < th) comp.lowMQ = -0.46;
    } else {
      const streak = f.noAppearStreak || 0;
      const sm = [1.00, 1.15, 1.35, 1.55];
      comp.bench = E.trust.applyCoeff(-2.64 * (streak < sm.length ? sm[streak] : 1.55), mn);
    }
    if (f._trustBonus) {
      let b = f._trustBonus; if (b > 0) b *= E.trust.gainMult(old);
      comp.bonus = b;
    }
    // 待遇不満(捕まえた値。リーダー気質の軽減は外側で掛かる)
    const g = capture.griev.get(f.id);
    if (g) {
      let gd = g.delta;
      if (gd < 0 && hasLeader(f.id)) gd *= 0.7;
      const raw = { G1: g.flags.G1 ? -0.4 : 0, G2: g.flags.G2 ? -0.6 : 0, G3: g.flags.G3 ? -0.5 : 0, G4: g.flags.G4 ? -0.35 : 0 };
      const rs = raw.G1 + raw.G2 + raw.G3 + raw.G4;
      if (rs !== 0) for (const k of Object.keys(raw)) if (raw[k]) comp[k] = gd * raw[k] / rs;
    }
    const rl = capture.rel.get(f.id);
    if (rl) {
      const fl = rl.flags;
      let r1 = 0, r2 = 0, r4 = 0, r5 = 0;
      if (fl.R1) r1 = -0.3 * fl.R1.length;
      if (fl.R2) r2 = -0.4;
      if (fl.R4 != null) r4 = 0.2;
      if (fl.R5 != null) r5 = -0.3;
      // R4/R5 は同じ対戦で複数回立ちうるが稀。合計が合わない分は R5 に寄せる
      const diff = rl.delta - (r1 + r2 + r4 + r5);
      if (r1) comp.R1 = r1; if (r2) comp.R2 = r2; if (r4) comp.R4 = r4; if (r5 || diff) comp.R5 = r5 + diff;
    }
    comp.natural = -0.46 + mn / 217;
    const sb = 0.05 * Math.min(seniorCount, 3); if (sb) comp.senior = sb;
    const grav = -Math.max(0, old - 60) * 0.04; if (grav) comp.gravity = grav;
    if (morale < 45) comp.moraleErosion = -(45 - morale) / 100;
    const sumPre = Object.values(comp).reduce((a, b) => a + b, 0);
    const sens = E.trust.trustSensitivity(old);
    const engineRelief = answeredNow ? (nlw.relief || 0) : 0;
    let expected = E.util.clamp(old + sumPre * sens + engineRelief, 0, 100);
    if (f.trustCap && !(currentWeek >= f.trustCap.expiresWeek) && expected > f.trustCap.value) expected = f.trustCap.value;
    const actual = nf.trust != null ? nf.trust : 50;
    P.decompChecks++;
    if (Math.abs(expected - actual) > 1e-6) P.decompMismatch++;
    let acc = 0;
    for (const [k, v] of Object.entries(comp)) { attribute(f.id, k, v * sens); acc += v * sens; }
    if (engineRelief) { attribute(f.id, 'remedy', engineRelief); acc += engineRelief; }
    const clip = (actual - old) - acc;
    if (Math.abs(clip) > 1e-9) attribute(f.id, 'clampCap', clip);
    // この興行で立っていた不満フラグ(20/15を割った時点の集計用)
    fs(f.id).lastFlags = {
      G1: !!(g && g.flags.G1), G2: !!(g && g.flags.G2), G3: !!(g && g.flags.G3), G4: !!(g && g.flags.G4),
      streak2: (nf.noAppearStreak || 0) >= 2,
      R1: !!(rl && rl.flags.R1), R2: !!(rl && rl.flags.R2), R5: !!(rl && rl.flags.R5 != null),
      lowMQ: !!comp.lowMQ, morale45: morale < 45,
    };
  }
}
const capture = { active: false, griev: new Map(), rel: new Map() };

// ── 設計案 A: 声かけの効き目(信頼の帯で下げる) ──
// LW_HI 以上は今まで通り(×1)。LW_LO〜LW_HI はなだらかに下げ、LW_LO 未満で底(LW_MULT)。
// 既定は 25→20(噂が出る20未満は全部が底。20ちょうどの崖を作らない)
const LW_HI = parseFloat(flagVal('lwhi', '25'));
const LW_LO = parseFloat(flagVal('lwlo', '20'));
function lwEncourageMult(trust) {
  if (trust >= LW_HI) return 1;
  if (trust <= LW_LO) return LW_MULT;
  const x = (trust - LW_LO) / (LW_HI - LW_LO); // 0..1
  const s = x * x * (3 - 2 * x);               // smoothstep
  return LW_MULT + (1 - LW_MULT) * s;
}

// ── 設計案 B: 原因に合った手当て(仮の実装。本体に入れるときは Engine.trust 側に置く) ──
function clampCap(f, t, state) {
  let v = Math.max(0, Math.min(100, t));
  const cw = (state.season || 1) * 100 + (state.week || 1);
  if (f.trustCap && !(cw >= f.trustCap.expiresWeek) && v > f.trustCap.value) v = Math.max(f.trust ?? 50, f.trustCap.value);
  return v;
}
function answer(st, cause, label) {
  if (!st.warn || st.warn.answered || st.warn.cause !== cause) return 0;
  const relief = RELIEF * (st.strain[cause] || 0);
  st.strain[cause] = 0;
  st.warn.answered = true;
  add(P.remedyCount, `応えた:${label}`, 1);
  // 応えた時点からの行方(25に届くか・その前に去るか)を追う
  st.answerTrack = { tick, t0: st.prevTrust, relief };
  P.answers.push(st.answerTrack);
  return relief;
}
// 出番: 通常興行に出たら、その週の信頼の更新に「応えてもらえた」分を足す。
// あわせて、噂のあと原因に応えてもらえた選手は低い帯の回復の鈍り(recoveryMult)を外す
function applyStageAnswer(E, roster, results, state, newRoster) {
  const participated = new Set();
  results.forEach(r => {
    if (r.matchType === 'tag') Object.keys(r.perFighter).forEach(id => participated.add(Number(id)));
    else { participated.add(r.left.id); participated.add(r.right.id); }
  });
  const oldById = new Map(roster.map(f => [f.id, f]));
  return newRoster.map(nf => {
    if (!playerIds.has(nf.id) || !participated.has(nf.id)) return nf;
    const st = F.get(nf.id);
    if (!st || !st.warn) return nf;
    const f = oldById.get(nf.id) || nf;
    const old = f.trust != null ? f.trust : 50;
    const mn = f.mn || 50;
    const relief = answer(st, '出番', '起用');
    let extra = 0;
    if (st.warn.answered) {
      extra = 1.53 * (1 - E.trust.recoveryMult(old)) * (1 + (100 - mn) / 200) * E.trust.gainMult(old) * E.trust.trustSensitivity(old);
    }
    if (!relief && !extra) return nf;
    const t0 = nf.trust != null ? nf.trust : 50;
    const t1 = clampCap(nf, t0 + relief + extra, state);
    if (t1 !== t0) attribute(nf.id, 'remedy', t1 - t0);
    return { ...nf, trust: t1 };
  });
}
// 書類での手当て(慰労会=人間関係・空気 / ボーナス相場以上=給与 / 関係修復の成功=人間関係)
function applyDocAnswer(docId, fighterId, state, options, out) {
  const targets = [];
  if (docId === 'party') {
    for (const f of out.roster) if (playerIds.has(f.id) && !f.injury && !f.onLeave) {
      targets.push([f.id, '人間関係', '慰労会(人間関係)'], [f.id, '空気', '慰労会(空気)']);
    }
  } else if (docId === 'bonus' && options && options.presetIndex >= 1) {
    targets.push([fighterId, '給与', 'ボーナス']);
  } else if (docId === 'relationship_repair' && out.pairRepairResult && out.pairRepairResult.success) {
    targets.push([out.pairRepairResult.idA, '人間関係', '関係修復'], [out.pairRepairResult.idB, '人間関係', '関係修復']);
  }
  if (!targets.length) return out;
  const reliefById = new Map();
  for (const [id, cause, label] of targets) {
    const st = F.get(id);
    if (!st) continue;
    const r = answer(st, cause, label);
    if (r) reliefById.set(id, (reliefById.get(id) || 0) + r);
  }
  if (!reliefById.size) return out;
  return { ...out, roster: out.roster.map(f => {
    const r = reliefById.get(f.id);
    if (!r) return f;
    const t0 = f.trust != null ? f.trust : 50;
    const t1 = clampCap(f, t0 + r, state);
    if (t1 !== t0) attribute(f.id, 'remedy', t1 - t0);
    return { ...f, trust: t1 };
  }) };
}

function afterLoad() {
  const E = global.Engine;
  // 待遇不満・関係の値を捕まえる(自団体の興行後処理のときだけ)
  const oG = E.trust.calcGrievanceDelta;
  E.trust.calcGrievanceDelta = function (fighter, ctx, titles, state) {
    const r = oG.call(this, fighter, ctx, titles, state);
    if (capture.active) capture.griev.set(fighter.id, { delta: r.delta, flags: r.flags });
    return r;
  };
  const oR = E.trust.calcRelationshipTrustDelta;
  E.trust.calcRelationshipTrustDelta = function (fighter, state, mc) {
    const r = oR.call(this, fighter, state, mc);
    if (capture.active) capture.rel.set(fighter.id, { delta: r.delta, flags: r.flags });
    return r;
  };
  const oAST = E.trust.applyShowTrust;
  // 第5引数(opts。本体実装後は { ledger: true } で帳簿と手当てが動く)も必ず渡す
  E.trust.applyShowTrust = function (roster, results, titles, state, opts) {
    const isPlayer = state && titles === state.titles && roster.some(f => playerIds.has(f.id));
    if (!isPlayer || !results || results.length === 0) return oAST.call(this, roster, results, titles, state, opts);
    capture.active = true; capture.griev.clear(); capture.rel.clear();
    let out;
    try { out = oAST.call(this, roster, results, titles, state, opts); } finally { capture.active = false; }
    // 入れ子の親(tickWeek 内の他の包み)へ生の差を渡す
    const parent = frameStack[frameStack.length - 1];
    // 原因の帳簿は興行ごとに薄れる(この興行の減りを積む前に)
    for (const f of roster) if (playerIds.has(f.id)) {
      const st = fs(f.id);
      for (const k of Object.keys(st.strain)) st.strain[k] *= STRAIN_DECAY;
    }
    decomposeShowTrust(E, roster, results, titles, state, out.roster);
    if (BMECH && !ENGINE_B) out = { ...out, roster: applyStageAnswer(E, roster, results, state, out.roster) };
    if (parent) {
      const nb = new Map(out.roster.map(f => [f.id, f]));
      for (const f of roster) if (playerIds.has(f.id) && nb.has(f.id)) {
        parent.inner.set(f.id, (parent.inner.get(f.id) || 0) + ((nb.get(f.id).trust ?? 50) - (f.trust ?? 50)));
      }
    }
    return out;
  };

  wrapAttr(E.trust, 'applyDepartureTrustImpact', 'friendLeft', a => a[0]);
  wrapAttr(E.shachoshitsu, 'settlePledge', (args, out) => (out && out.outcome === 'broken') ? 'pledgeBroken' : 'pledgeKept', a => a[0]);
  wrapAttr(E.shachoshitsu, 'applyPendingTrustDeltas', 'care', a => a[0]);
  wrapAttr(E.shachoshitsu, 'tickInviteBuffs', 'care', a => a[0]);
  wrapAttr(E.shachoshitsu, 'resolveInviteConflict', 'care', a => a[0]);
  wrapAttr(E.eventSystem, 'applyNotifEffect', 'event', a => a[2]);
  wrapAttr(E.eventSystem, 'applyChoiceEffect', 'event', a => a[2]);
  wrapAttr(E.eventSystem, 'applyLargeEventEffect', 'event', a => a[3]);
  wrapAttr(E.relationships, 'processWeeklyStoryEvents', 'relStory', a => a[0]);
  wrapAttr(E.factions, '_applyTrustToMembers', 'faction', a => a[0]);
  wrapAttr(E.factions, 'processWeeklyMemberChanges', 'faction', a => a[0]);
  wrapAttr(E.contract, 'resolveNegotiation', 'contract', a => a[1]);

  // 決裁書類(声かけを含む)。--lw のときは声かけの信頼の伸びを帯で縮める
  const oExec = E.shachoshitsu.execute;
  E.shachoshitsu.execute = function (docId, fighterId, state, options) {
    const before = trustMapFrom(state);
    let out = oExec.call(this, docId, fighterId, state, options);
    if (out && !out.error && docId === 'encourage' && LW && !ENGINE_B && before && before.has(fighterId)) {
      const t0 = before.get(fighterId);
      const mult = lwEncourageMult(t0);
      if (mult < 1) {
        out = { ...out, roster: out.roster.map(f => f.id === fighterId ? { ...f, trust: t0 + ((f.trust ?? 50) - t0) * mult } : f) };
      }
    }
    if (before && out && !out.error) {
      const after = trustMapFrom(out);
      for (const [id, t0] of before) {
        if (!after || !after.has(id)) continue;
        const d = after.get(id) - t0;
        if (Math.abs(d) > 1e-9) attribute(id, docId === 'encourage' ? 'encourage' : 'care', d);
      }
    }
    if (BMECH && !ENGINE_B && out && !out.error && out.roster) out = applyDocAnswer(docId, fighterId, state, options, out);
    return out;
  };

  // 突然の退団(判定の回数と、去った選手)
  const oCSD = E.trust.checkSuddenDepartures;
  E.trust.checkSuddenDepartures = function (rng, state) {
    for (const f of (state.roster || [])) {
      if (f.isRental || f.isUnifiedTitleGuest) continue;
      if ((f.trust != null ? f.trust : 50) < 15) { P.departureRolls++; P.minTrustAtCheck.push(f.trust); }
    }
    const r = oCSD.call(this, rng, state);
    for (const d of r.departed) {
      P.sudden.push({ id: d.id, trust: d.fighter.trust, season: state.season, week: state.week, pop: d.fighter.popularity || 0 });
      closeEpisodes(d.id, 'sudden');
    }
    return r;
  };
  // 契約更改での退団
  const oRN = E.contract.resolveNegotiation;
  E.contract.resolveNegotiation = function (rng, state, neg, choiceIdx, subChoice, dict) {
    const out = oRN.call(this, rng, state, neg, choiceIdx, subChoice, dict);
    if (out && out.result && out.result.type === 'depart' && playerIds.has(neg.fighterId)) {
      P.contractDepart.push({ id: neg.fighterId, trust: neg.trust, attitude: neg.attitude, season: state.season });
      if ((neg.trust ?? 50) < 30) closeEpisodes(neg.fighterId, 'contract');
    }
    return out;
  };
}

function windowSum(id) {
  const st = fs(id);
  const neg = {}, pos = {};
  for (const h of st.hist) {
    if (tick - h.tick > WINDOW) continue;
    if (h.v < 0) add(neg, h.cat, h.v); else add(pos, h.cat, h.v);
  }
  return { neg, pos };
}
function pruneHist(st) { st.hist = st.hist.filter(h => tick - h.tick <= WINDOW + 1); }

function recordFlags(bucket, fl) {
  bucket.n++;
  if (!fl) { bucket.none++; return; }
  let any = false;
  for (const k of ['G1', 'G2', 'G3', 'G4', 'streak2', 'R1', 'R2', 'R5', 'lowMQ', 'morale45']) if (fl[k]) { bucket[k]++; any = true; }
  if (!any) bucket.none++;
}

function closeEpisodes(id, how) {
  const st = F.get(id);
  if (!st) return;
  if (st.ep15) { P.outcomes[how] = (P.outcomes[how] || 0) + 1; P.showsBelow15.push(st.ep15.shows); st.ep15 = null; }
  if (st.answerTrack && !st.answerTrack.done) { st.answerTrack.done = 'left'; st.answerTrack.weeks = tick - st.answerTrack.tick; }
  st.answerTrack = null;
  if (st.ep20) {
    P.outcomes20[how] = (P.outcomes20[how] || 0) + 1;
    add(P.closedByCause, st.ep20.warnCause || '(前の噂が続く)', 1);
    if (how === 'sudden' || how === 'contract') {
      add(P.departGroup, st.ep20.group || '(不明)', 1);
      if ((st.warn && st.warn.answered) || st.lwAnswered) add(P.remedyCount, '応えたのに退団', 1);
    }
    st.ep20 = null;
  }
  st.warn = null;
  st.strain = {};
  st.lwAnswered = false;
  st.answeredKey = null;
}

// 週の入口(auto-sim のループの各周の先頭)
function observe(G) {
  tick++;
  P.ticks++;
  if (G.season) P.seasonsSeen.add(G.season);
  const roster = (G.roster || []).filter(f => f && !f.isRental && !f.isUnifiedTitleGuest);
  const nowIds = new Set(roster.map(f => f.id));
  // 名簿から消えた選手のエピソードを閉じる(突然の退団・契約退団は各所で閉じ済み)
  for (const id of playerIds) if (!nowIds.has(id)) closeEpisodes(id, 'leftOther');
  const showWeekPassed = !G.offSeason && G.week && Engine.util.isShowWeek(G.week - 1);
  for (const f of roster) {
    const st = fs(f.id);
    const t = f.trust != null ? f.trust : 50;
    if (st.prevTrust != null) {
      const attributed = Object.values(st.pendingAttr).reduce((a, b) => a + b, 0);
      const resid = (t - st.prevTrust) - attributed;
      if (Math.abs(resid) > 1e-6) attribute(f.id, G.offSeason ? 'offseason' : 'other', resid);
    }
    st.pendingAttr = {};
    pruneHist(st);
    P.rosterWeeks++;
    if (t < 20) P.weeksBelow20++;
    if (t < 15) P.weeksBelow15++;
    // エピソード(20/15を割った・25まで戻ったら回復)
    if (st.prevTrust != null && st.prevTrust >= 20 && t < 20 && !st.ep20) {
      P.crossings20++; P.fighters20.add(f.id);
      st.ep20 = { startTick: tick };
      const w = windowSum(f.id);
      for (const [k, v] of Object.entries(w.neg)) add(P.windowSums, k, v);
      for (const [k, v] of Object.entries(w.pos)) add(P.windowPos, k, v);
      const top = Object.entries(w.neg).sort((a, b) => a[1] - b[1])[0];
      if (top) add(P.primary, top[0], 1);
      const grp = {};
      for (const [k, v] of Object.entries(w.neg)) add(grp, GROUP[k] || 'その他', v);
      const topG = Object.entries(grp).sort((a, b) => a[1] - b[1])[0];
      if (topG) add(P.primaryGroup, topG[0], 1);
      st.ep20.group = topG ? topG[0] : null;
      recordFlags(P.flagsAt20, st.lastFlags);
      // 本体実装後: 噂の状態は本体が付ける(この週の tickWeek で付いている)。原因をそのまま記録する
      if (ENGINE_B) {
        const lw = f.lastWarning;
        const cause = lw ? (ENGINE_CAUSE_JA[lw.cause] || lw.cause) : '(噂なし)';
        add(P.warnCause, cause, 1);
        st.ep20.warnCause = cause;
        if (st.ep20.group === cause) P.causeAgree++;
      }
      // 噂(20割れ)の週に、帳簿のいちばん重い原因を「においわせる原因」として決める
      if (!ENGINE_B && !st.warn) {
        const cause = pickCause(st.strain);
        st.warn = { cause, answered: false, tick };
        add(P.warnCause, cause, 1);
        st.ep20.warnCause = cause;
        // 帳簿と「直近12週の原因」が同じ答えを出しているか(帳簿の減衰率の妥当性)
        if (st.ep20.group === cause) P.causeAgree++;
      }
    }
    if (st.warn && t >= WARN_CLEAR) st.warn = null;
    // 本体実装後: 応えた回を噂の状態から拾い、応えた時点からの行方を追う(t0 = 応えた週の前の信頼、t1 = 応えた週の直後)
    if (ENGINE_B) {
      const lw = f.lastWarning;
      st.lwAnswered = !!(lw && lw.answered);
      if (lw && lw.answered) {
        const key = `${lw.week}`;
        if (st.answeredKey !== key) {
          st.answeredKey = key;
          add(P.remedyCount, `応えた:${lw.answeredBy || '?'}`, 1);
          st.answerTrack = { tick: tick - 1, t0: st.prevTrust, relief: lw.relief || 0, t1: t };
          P.answers.push(st.answerTrack);
        }
      }
    }
    if (st.prevTrust != null && st.prevTrust >= 15 && t < 15 && !st.ep15) {
      P.crossings15++; P.fighters15.add(f.id);
      st.ep15 = { startTick: tick, shows: 0 };
      recordFlags(P.flagsAt15, st.lastFlags);
    }
    if (st.ep15 && showWeekPassed) st.ep15.shows++;
    if (t >= 25) {
      if (st.ep15) { P.outcomes.recovered++; P.showsBelow15.push(st.ep15.shows); st.ep15 = null; }
      if (st.answerTrack && !st.answerTrack.done) { st.answerTrack.done = 'ok'; st.answerTrack.weeks = tick - st.answerTrack.tick; }
      if (st.ep20) {
        P.outcomes20.recovered++;
        add(P.recoveredByCause, st.ep20.warnCause || '(前の噂が続く)', 1);
        add(P.closedByCause, st.ep20.warnCause || '(前の噂が続く)', 1);
        if ((st.warn && st.warn.answered) || st.lwAnswered) P.recoveredAnswered++;
        P.weeksToRecover.push(tick - st.ep20.startTick);
        st.ep20 = null;
      }
    }
    if (st.answerTrack && st.answerTrack.t1 == null && tick > st.answerTrack.tick) st.answerTrack.t1 = t;
    if (TRACE && st.answerTrack && tick - st.answerTrack.tick <= 16) {
      const recent = st.hist.filter(h => h.tick === tick - 1 || h.tick === tick).map(h => `${h.cat}${h.v >= 0 ? '+' : ''}${h.v.toFixed(1)}`).join(' ');
      console.error(`[trace] id${f.id} S${G.season}W${G.week}${G.offSeason ? '(off)' : ''} +${tick - st.answerTrack.tick}w trust ${t.toFixed(1)} streak ${f.noAppearStreak || 0} cond ${Math.round(f.condition ?? 0)} | ${recent}`);
    }
    st.prevTrust = t;
  }
  playerIds = nowIds;

  // ── 自動プレイヤーの追加の手(変種) ──
  if (!G.offSeason && G.weekPhase === 'manage') {
    if (ENC === 'all' || ENC === 'danger') G = autoEncourage(G);
    if (REMEDY && !ENGINE_B) G = autoRemedy(G);  // 本体実装後は auto-sim の --remedy が打つ
  }
  return G;
}

function autoEncourage(G) {
  const cands = (G.roster || []).filter(f => !f.isRental && !f.injury && !f.onLeave && !f.isUnifiedTitleGuest)
    .filter(f => {
      const t = f.trust != null ? f.trust : 50;
      if (ENC === 'danger') return t < 20;
      return t < 50 || f.slump || f.motivationLoss;
    })
    .filter(f => (G.week - ((f._decisionWeekUsed || {}).encourage || -99)) >= 1);
  for (const f of cands) {
    const r = Engine.shachoshitsu.execute('encourage', f.id, G);
    if (!r || r.error) continue;
    P.encourageCount++;
    if ((f.trust ?? 50) < 20) P.encourageInDanger++;
    G = { ...G, roster: r.roster, _decisionWeekUsed: r._decisionWeekUsed || G._decisionWeekUsed || {} };
    if (r.relationships) G = { ...G, relationships: r.relationships };
  }
  return G;
}

// 設計案 B の自動プレイヤー: 噂が出た子(信頼25未満の間)に、原因に合った手を打つ
//   出番     → 次の通常興行に必ず入れる(カード編成の差し込み口で枠の後ろの方に入れる)
//   人間関係・空気 → 慰労会(机に出ていて、決裁枠と資金が足りれば)
//   それ以外(給与・王座・約束・派閥・原因がはっきりしない) → ボーナス支給願(基準額×1.0 の案)
function applyDocResult(G, docId, r) {
  G = { ...G,
    roster: r.roster, funds: r.funds,
    lockerRoomMorale: r.lockerRoomMorale != null ? r.lockerRoomMorale : G.lockerRoomMorale,
    decisionPoints: r.decisionPoints != null ? r.decisionPoints : G.decisionPoints,
    _decisionWeekUsed: r._decisionWeekUsed || G._decisionWeekUsed || {},
    _decisionDoneThisWeek: [...(G._decisionDoneThisWeek || []), docId],
  };
  if (r.relationships) G = { ...G, relationships: r.relationships };
  if (r._partyAfterglowWeeks) G = { ...G, _partyAfterglowWeeks: r._partyAfterglowWeeks };
  P.remedySpend += r.cost || 0;
  const doc = Engine.shachoshitsu.getDoc(docId);
  P.remedyDp += (doc && doc.decisionCost) || 0;
  add(P.remedyCount, `打った:${docId}`, 1);
  return G;
}
function autoRemedy(G) {
  priorityIds.clear();
  const live = (G.roster || []).filter(f => !f.isRental && !f.injury && !f.onLeave && !f.isUnifiedTitleGuest);
  let partyWanted = false;
  const bonusWanted = [];
  for (const f of live) {
    const st = F.get(f.id);
    if (!st || !st.warn || (f.trust ?? 50) >= REMEDY_UNTIL) continue;
    const c = st.warn.cause;
    if (c === '出番') priorityIds.add(f.id);
    else if (c === '人間関係' || c === '空気') partyWanted = true;
    else bonusWanted.push(f);
  }
  const avail = new Set(Engine.shachoshitsu.getAvailableDocs(G).map(d => d.id));
  if (partyWanted && avail.has('party') && !(G._decisionDoneThisWeek || []).includes('party')) {
    const r = Engine.shachoshitsu.execute('party', null, G);
    if (r && !r.error) G = applyDocResult(G, 'party', r);
  }
  for (const f of bonusWanted) {
    if (!avail.has('bonus')) break;
    const r = Engine.shachoshitsu.execute('bonus', f.id, G, { presetIndex: 1 });
    if (r && !r.error) G = applyDocResult(G, 'bonus', r);
  }
  return G;
}

function final() { /* 出力は exit 時 */ }

function report() {
  const seasons = Math.max(1, SEASONS);
  const per = v => (v / seasons).toFixed(2);
  const L = [];
  L.push('');
  L.push('══ 退団寸前の計測(care-last-warning-probe) ══');
  L.push(`条件: ${SEASONS}季 seed=${SEED} book=${BOOK} care=${CARE ? 'on' : 'off'} enc=${ENC} lw=${ENGINE_B ? '本体' : (LW ? `on(mult ${LW_MULT} ${LW_HI}→${LW_LO})` : 'off')} remedy=${REMEDY ? `on(〜${REMEDY_UNTIL})` : 'off'} bmech=${ENGINE_B ? '本体' : (BMECH ? `on(relief ${RELIEF})` : 'off')} fixture=${process.env.WM_FACTION_FIXTURE === '1' ? '大ロスター' : '通常'}`);
  if (bookStats.shows) L.push(`通常興行 ${bookStats.shows}回: 出場可能 平均${(bookStats.eligible / bookStats.shows).toFixed(1)}人 / 出番の枠 平均${(bookStats.slots / bookStats.shows).toFixed(1)}人`);
  L.push(`分解の検算: ${P.decompChecks}件中 不一致 ${P.decompMismatch}件`);
  L.push(`在籍のべ週: ${P.rosterWeeks}(季あたり ${per(P.rosterWeeks)}) / 信頼20未満の週 ${(100 * P.weeksBelow20 / P.rosterWeeks).toFixed(2)}% / 15未満の週 ${(100 * P.weeksBelow15 / P.rosterWeeks).toFixed(2)}%`);
  L.push(`20を割った: のべ ${P.crossings20}回(季あたり ${per(P.crossings20)}) / 人数 ${P.fighters20.size}`);
  L.push(`15を割った: のべ ${P.crossings15}回(季あたり ${per(P.crossings15)}) / 人数 ${P.fighters15.size}`);
  L.push(`突然の退団: ${P.sudden.length}件(季あたり ${per(P.sudden.length)}) / 判定を受けた回数(興行×15未満の選手) ${P.departureRolls}`);
  const cdLow = P.contractDepart.filter(c => (c.trust ?? 50) < 30).length;
  L.push(`契約更改での退団: ${P.contractDepart.length}件(うち信頼30未満 ${cdLow}件 = 季あたり ${per(cdLow)})`);
  if (ENC !== 'none') L.push(`声かけ(自動): ${P.encourageCount}回(季あたり ${per(P.encourageCount)}) / うち信頼20未満へ ${P.encourageInDanger}回`);
  const sumNeg = Object.values(P.windowSums).reduce((a, b) => a + b, 0);
  L.push(`20を割ったときの直近${WINDOW}週の「下げた力」(合計 ${sumNeg.toFixed(1)}。1回あたり ${(sumNeg / Math.max(1, P.crossings20)).toFixed(2)}):`);
  Object.entries(P.windowSums).sort((a, b) => a[1] - b[1]).forEach(([k, v]) => {
    L.push(`  ${k.padEnd(14)} ${(v / Math.max(1, P.crossings20)).toFixed(2).padStart(7)} /回  ${(100 * v / sumNeg).toFixed(1).padStart(5)}%`);
  });
  const sumPos = Object.values(P.windowPos).reduce((a, b) => a + b, 0);
  L.push(`同じ期間の「支えた力」(1回あたり ${(sumPos / Math.max(1, P.crossings20)).toFixed(2)}):`);
  Object.entries(P.windowPos).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    L.push(`  ${k.padEnd(14)} ${(v / Math.max(1, P.crossings20)).toFixed(2).padStart(7)} /回`);
  });
  L.push('最大の下げ要因(20を割った回ごと):');
  Object.entries(P.primary).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => L.push(`  ${k.padEnd(14)} ${v}回 ${(100 * v / Math.max(1, P.crossings20)).toFixed(1)}%`));
  L.push('最大の下げ要因のまとまり(20を割った回ごと):');
  Object.entries(P.primaryGroup).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => L.push(`  ${k.padEnd(10)} ${v}回 ${(100 * v / Math.max(1, P.crossings20)).toFixed(1)}%`));
  if (Object.keys(P.departGroup).length) L.push(`退団(突然+契約)に至った回の原因のまとまり: ${Object.entries(P.departGroup).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' / ')}`);
  const fl = b => ['G1', 'G2', 'G3', 'G4', 'streak2', 'R1', 'R2', 'R5', 'lowMQ', 'morale45', 'none']
    .map(k => `${k} ${(100 * b[k] / Math.max(1, b.n)).toFixed(0)}%`).join(' / ');
  L.push(`20を割った時点のフラグ(n=${P.flagsAt20.n}): ${fl(P.flagsAt20)}`);
  L.push(`15を割った時点のフラグ(n=${P.flagsAt15.n}): ${fl(P.flagsAt15)}`);
  const o = P.outcomes, o2 = P.outcomes20;
  L.push(`15未満エピソードの結末: 突然の退団 ${o.sudden} / 契約で退団 ${o.contract} / 25まで回復 ${o.recovered} / その他で離脱 ${o.leftOther}`);
  L.push(`20未満エピソードの結末: 突然の退団 ${o2.sudden} / 契約で退団 ${o2.contract} / 25まで回復 ${o2.recovered} / その他で離脱 ${o2.leftOther}`);
  const wc = Object.entries(P.warnCause).sort((a, b) => b[1] - a[1]);
  if (wc.length) {
    L.push(`帳簿が選んだ「においわせる原因」(減衰 ${STRAIN_DECAY}/興行・しきい ${CAUSE_SHARE}): ${wc.map(([k, v]) => `${k} ${v}`).join(' / ')} / 直近12週の最大要因と一致 ${P.causeAgree}/${P.crossings20}`);
  }
  const r20 = P.outcomes20.recovered, n20 = r20 + P.outcomes20.sudden + P.outcomes20.contract + P.outcomes20.leftOther;
  L.push(`20未満エピソードの回復率: ${n20 ? (100 * r20 / n20).toFixed(1) : '-'}%(閉じた ${n20}件中 ${r20}件。うち原因に応えてもらえた回復 ${P.recoveredAnswered}件)`);
  if (P.weeksToRecover.length) {
    const s = [...P.weeksToRecover].sort((a, b) => a - b);
    L.push(`回復までの週数: 中央値 ${s[Math.floor(s.length / 2)]} / 90%点 ${s[Math.floor(s.length * 0.9)]}`);
  }
  const causes = Object.keys(P.closedByCause);
  if (causes.length) L.push(`噂の原因ごとの回復(25まで): ${causes.map(c => `${c} ${P.recoveredByCause[c] || 0}/${P.closedByCause[c]}`).join(' / ')}`);
  const ans = P.answers.filter(a => a.t0 != null && a.t0 < 25);
  if (ans.length) {
    const ok = ans.filter(a => a.done === 'ok'), left = ans.filter(a => a.done === 'left');
    const ok8 = ok.filter(a => a.weeks <= 8).length;
    const med = arr => { const s = [...arr].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : '-'; };
    L.push(`応えた(信頼25未満で): ${ans.length}回 → 25に届いた ${ok.length}(${(100 * ok.length / ans.length).toFixed(1)}%。8週以内 ${ok8}) / 届く前に去った ${left.length} / 未決 ${ans.length - ok.length - left.length}` +
      ` / 応えた時点の信頼 中央値 ${Number(med(ans.map(a => a.t0))).toFixed(1)} / すぐ戻った量 中央値 ${Number(med(ans.map(a => a.relief))).toFixed(1)} / 25まで 中央値 ${med(ok.map(a => a.weeks))}週`);
    const w1 = ans.filter(a => a.t1 != null);
    if (w1.length) {
      L.push(`応えた翌週の信頼: 中央値 ${Number(med(w1.map(a => a.t1))).toFixed(1)} / 15以上 ${(100 * w1.filter(a => a.t1 >= 15).length / w1.length).toFixed(1)}% / 20以上 ${(100 * w1.filter(a => a.t1 >= 20).length / w1.length).toFixed(1)}%(n=${w1.length})`);
    }
  }
  if (Object.keys(P.remedyCount).length) {
    L.push(`手当て: ${Object.entries(P.remedyCount).map(([k, v]) => `${k} ${v}`).join(' / ')} / 支出 ${Math.round(P.remedySpend)}万(季あたり ${per(P.remedySpend)}) / 決裁枠 ${P.remedyDp}(季あたり ${per(P.remedyDp)})`);
  }
  if (P.showsBelow15.length) {
    const s = [...P.showsBelow15].sort((a, b) => a - b);
    L.push(`15未満の滞在(通常興行の回数): 中央値 ${s[Math.floor(s.length / 2)]} / 90%点 ${s[Math.floor(s.length * 0.9)]} / 最大 ${s[s.length - 1]}`);
  }
  console.log(L.join('\n'));
}

// ── カード編成の方針(auto-sim は全員をくじで並べる。実プレイの社長は格で並べる) ──
// auto-sim.js を文字列で読み、カード編成の1行だけを差し替えて同じプロセスで走らせる(元のファイルは変えない)
//   random : auto-sim のまま(全員をくじで並べる)
//   merit  : 格(OVR)に ±8 の揺らぎを足して上から並べる(実プレイの社長の近似)
//   star   : 格の順に並べる(下位は出番が来ない)
global.__WM_CLW_CARD_ORDER = function (G, roster, simRng, effectiveMax) {
  bookStats.shows++; bookStats.eligible += roster.length; bookStats.slots += Math.min(roster.length, effectiveMax * 2);
  let order;
  if (BOOK === 'random') order = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  else {
    const noise = BOOK === 'merit' ? 8 : 0;
    const scored = roster.map(f => ({ f, s: Engine.util.ov(f) + (noise ? (Engine.rng.float(simRng) - 0.5) * 2 * noise : 0) }));
    scored.sort((a, b) => (b.s - a.s) || (a.f.id - b.f.id));
    order = scored.map(x => x.f);
  }
  // 設計案 B の自動プレイヤー: 出番が原因の子を、出番の枠の後ろの方(メインではない)に必ず入れる
  const pri = order.filter(f => priorityIds.has(f.id));
  if (!pri.length) return order;
  const rest = order.filter(f => !priorityIds.has(f.id));
  const slots = Math.min(order.length, effectiveMax * 2);
  const head = rest.slice(0, Math.max(0, slots - pri.length));
  add(P.remedyCount, '打った:起用', pri.length);
  return [...head, ...pri, ...rest.slice(head.length)];
};

global.__WM_AUTOSIM_HOOKS = { afterLoad, observe, final };
process.on('exit', report);
process.argv = [process.argv[0], path.join(__dirname, 'auto-sim.js'), String(SEASONS), String(SEED), ...(CARE ? ['--care'] : []),
  // 本体実装後は、原因に合った手当ての自動プレイヤーを auto-sim の --remedy に任せる
  ...(REMEDY && ENGINE_B ? ['--remedy', `--remedy-until=${REMEDY_UNTIL}`] : [])];
{
  const Module = require('module');
  const fsx = require('fs');
  const asPath = path.join(__dirname, 'auto-sim.js');
  let code = fsx.readFileSync(asPath, 'utf8');
  const anchor = 'const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);';
  if (code.split(anchor).length !== 2) throw new Error('auto-sim.js のカード編成の行が見つからない(1か所であるべき)');
  code = code.replace(anchor, 'const shuffled = global.__WM_CLW_CARD_ORDER(G, roster, simRng, effectiveMax);');
  if (code.startsWith('#!')) code = '//' + code.slice(2);
  const m = new Module(asPath, module);
  m.filename = asPath;
  m.paths = Module._nodeModulePaths(__dirname);
  m._compile(code, asPath);
}
