#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/ui-walkthrough/dojo-rest-bubble-fit-check.js — 道場バナーの3つの吹き出し(コーチ .dojo-scene-bubble /
//  練習中の本人の熱量 .dojo-heat-bubble / 休憩中の選手 .dojo-rest-bubble)に出るすべての一言が、実UIで最後まで
//  読める(打ち切りの行数で「…」に切れない)こと・バナーの中で互いにもほかの要素にも被らないことの確認
//  (手動実行・run-all には入らない)
//
//  2026-09-26 Keisuke 裁定: 休憩中は幅200px・最大4行(案A)、コーチと熱量の本人も「広げる」。
//  docs/ui/mockup-baseline-v0.1.md §3 の例外。幅と行数は下の SPEC(index.html と同じ値)。
//  fixture(1季目1週)を開き、道場バナーを「いちばん混む形」で実際に描いてから(コーチの吹き出し+練習中の列4人+
//  熱量の本人の吹き出し+休憩中の選手)、ほかの2つの吹き出しを「いちばん大きくなる文」にしたまま、
//  1つの吹き出しの文を表の全行に差し替えて1本ずつ測る:
//    1. 切れない: 本文の scrollHeight <= clientHeight(-webkit-line-clamp で切れていない)
//    2. バナーの中: 道場の要素がすべてバナーの矩形からはみ出さない(overflow:hidden で切れない)
//    3. 被らない: コーチの群(吹き出し・顔・名前・雰囲気の地の文)/練習の群(顔・熱量の吹き出し・掛け声)/
//       休憩の群(吹き出し・顔・地の文)が互いに重ならない。熱量の吹き出しは隣の顔・掛け声とも重ならない
//    4. 尻尾: 3つとも本体の overflow で切られていない・吹き出しの水平中心が下の顔の水平中心
//  表:
//    コーチ: COACH_VOICE_REPORT_LINES(全コーチ・全区分)・HEAT_STATE_COACH_LINES・ATMOSPHERE_TEXTS(報告の無い週に
//            コーチの口から出る)。{name} は表示言語でいちばん幅の広い呼び名(コーチ→選手は名字)、{stat} も最も幅の広い能力名
//    熱量の本人: HEAT_STATE_SELF_LINES(全状態・全性格・全アーキタイプ)
//    休憩中: GLIMPSE_A_LINES(bond/rivalry/trust の閾値すべて)・LAST_WARNING_RUMOR/ANSWERED_LINES・
//            GLIMPSE_B_LINES(GL-01〜GL-11)・閾値のラベル(一言が空のときの代替)
//    休憩中の地の文: GL-12「第三者の証言」(話者のいない地の文。2026-09-26 から吹き出しにせず .dojo-rest-narration で出す。
//            {nameA}/{nameB} は表示言語でいちばん長い名前2つ)。吹き出し・顔・鉤括弧が無いことも見る
//    雰囲気の地の文: コーチ不在時にコーチの位置に出る ATMOSPHERE_TEXTS(全レベル)
//  掛け声(.dojo-scene-shout)はいちばん幅の広いものにしておく(顔の中心に置かれ、顔からはみ出す)
//  場面: full(コーチ+練習の列4人の先頭に熱量の吹き出し)/ mid(コーチ+3人の列の真ん中に熱量の吹き出し)/
//        atmo(コーチ不在=雰囲気の地の文+熱量の吹き出し)/ coachOnly(練習の列なし)
//  言語: JA/EN。幅: 1920/1280/1024/821(横並び配置)・820/800/761/414/375/360(狭い画面の流し込み配置)
//  スクリーンショットは test/ui-walkthrough/artifacts/dojo-rest-bubble/(Git管理外)。
//
//  使い方: node test/ui-walkthrough/dojo-rest-bubble-fit-check.js
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startStaticServer } = require('./server');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'season-1-week-1-seed42.json');
const OUT = path.join(__dirname, 'artifacts', 'dojo-rest-bubble');
// 821 = 横並び配置の下限 / 820 = 流し込み配置の上限(index.html の @media(max-width:820px))
const VIEWPORTS = [[1920, 1080], [1280, 900], [1024, 768], [821, 900], [820, 900], [800, 900], [761, 900], [414, 896], [375, 812], [360, 780]];
const SCENES = ['full', 'mid', 'atmo', 'coachOnly'];
// 幅(px)と打ち切りの行数。index.html の道場の CSS と同じ値。OLD は広げる前(参考の本数を数えるため)
const SPEC = { coach: [210, 4], heat: [160, 3], rest: [200, 4] };
const OLD = { coach: [190, 2], heat: [150, 2], rest: [150, 2] };

async function setupPage(browser, server, fixtureText, lang, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript(({ save, uiLang }) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', uiLang);
    localStorage.setItem('wrestle_manager_autosave', save);
  }, { save: fixtureText, uiLang: lang });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.evaluate(() => { if (typeof App !== 'undefined' && App.titleContinue) App.titleContinue(); });
  await page.waitForTimeout(300);
  try { await page.evaluate(() => document.fonts.ready.then(() => true)); } catch (e) { /* 代替フォントのまま測る */ }
  return { context, page, errs };
}

// 道場バナーを描く。scene で混み具合を変える。rest='bubble' は休憩中の吹き出し(退団の噂=確定枠)、
// rest='narration' は GL-12(抽選枠なので、出る週を探す)。休憩中の選手は練習の列にいない子を選ぶ
const SCENE_PROBE = `(args) => {
  const { scene, rest } = args;
  showScreen('roster');
  G.offSeason = false; G.currentCoachReport = null;
  G.lockerRoomMorale = scene === 'coachOnly' ? 10 : 95;   // 95 = 雰囲気レベル5(2〜3人の列) / 10 = 列なし
  const coach = (typeof ALL_COACHES !== 'undefined' && ALL_COACHES[0]) ? ALL_COACHES[0] : null;
  window.getHiredCoaches = (scene === 'atmo' || !coach) ? () => [] : () => [coach];
  const roster = (G.roster || []).filter(f => !f.isRental);
  (G.roster || []).forEach(f => { f.injury = null; f.onLeave = false; });
  const root = document.getElementById('rosterDojoHeader');
  const practicingList = () => Array.from(root.querySelectorAll('.dojo-scene-fighter-wrap'))
    .map(w => { const m = (w.getAttribute('onclick') || '').match(/showFighterPopup\\((\\d+)/); return m ? Number(m[1]) : null; });
  const practicingIds = () => new Set(practicingList());
  // 熱量の置き方。full: heavy を2人(1人目はコーチが語り、2人目は練習の列の先頭に割り込んで本人の吹き出し=列4人)
  // atmo: heavy を1人(コーチがいないので本人の吹き出しになる)
  // mid: 列3人の真ん中の子を heavy にし、列の外の子(名簿で前にいる子)も heavy にしてコーチにそちらを語らせる
  //      → 熱量の吹き出しが列の真ん中に出る(左右の顔の掛け声が吹き出しの両側に来る形)
  const setupHeat = week => {
    (G.roster || []).forEach(f => { f._heat = 0; });
    if (scene === 'full') { roster[0]._heat = 5; roster[1]._heat = 5; }
    if (scene === 'atmo') { roster[0]._heat = 5; }
    if (scene === 'mid') {
      G.season = 2; G.week = week; G.weekLogFeed = [];
      renderRoster();
      const row = practicingList();
      if (row.length !== 3) return false;
      const mIdx = G.roster.findIndex(f => f.id === row[1]);
      const n = G.roster.find((f, i) => i < mIdx && !row.includes(f.id) && !f.isRental);
      if (!n) return false;
      G.roster[mIdx]._heat = 5; n._heat = 5;
    }
    return true;
  };
  const build = week => {
    G.season = 2; G.week = week;
    G.weekLogFeed = [];
    renderRoster();
    const practicing = practicingIds();
    const free = roster.filter(f => !practicing.has(f.id) && f._heat === 0);
    const hero = free[0], other = free[1];
    if (rest === 'narration') {
      const tpl = GLIMPSE_B_LINES['GL-12']._narration[3];
      G.weekLogFeed = [{ layer: 'B', type: 'GL-12', tone: 'narration', label: '第三者の証言', speakerId: hero.id, speakerName: hero.name,
        targetId: other.id, targetName: other.name, dialogue: tpl.replace('{nameA}', hero.name).replace('{nameB}', other.name),
        dialogueTpl: tpl, dialogueVars: { nameA: hero.name, nameB: other.name } }];
    } else {
      G.weekLogFeed = [{ layer: 'A', axis: 'trust', type: 'trust_below_15', tone: 'danger', label: '退団を決めかけているという噂',
        speakerId: hero.id, speakerName: hero.name, dialogue: 'テスト' }];
    }
    renderRoster();
    return hero;
  };
  // 週を探す。休憩中の吹き出しは確定枠なのでどの週でも出る。GL-12 は18%の抽選なので出る週を探す。
  // full・atmo は列4人の週、mid は熱量の吹き出しが3人の列の真ん中に出る週
  const score = () => {
    if (rest === 'narration' && !root.querySelector('.dojo-rest-narration')) return 0;
    if (scene === 'mid') {
      const wraps = Array.from(root.querySelectorAll('.dojo-scene-fighter-wrap'));
      if (!(wraps.length === 3 && wraps[1].classList.contains('has-heat-bubble'))) return 0;
    }
    if ((scene === 'full' || scene === 'atmo') && root.querySelectorAll('.dojo-scene-fighter').length < 4) return 1;
    return 2;
  };
  let week = 7, best = 0;
  for (let w = 1; w <= 45 && best < 2; w++) {
    if (!setupHeat(w)) continue;
    build(w);
    const s = score();
    if (s > best) { best = s; week = w; }
  }
  setupHeat(week);
  const hero = build(week);
  const q = s => root.querySelector(s);
  return {
    week, restBubble: !!q('.dojo-rest-bubble'), restAvatar: !!q('.dojo-rest-avatar'), narration: !!q('.dojo-rest-narration'),
    coachBubble: !!q('.dojo-scene-bubble'), atmosphere: !!q('.dojo-scene-atmosphere'),
    fighters: root.querySelectorAll('.dojo-scene-fighter').length, heatBubble: !!q('.dojo-heat-bubble'),
    heatMid: (() => { const w = Array.from(root.querySelectorAll('.dojo-scene-fighter-wrap')); return w.length === 3 && w[1].classList.contains('has-heat-bubble'); })(),
    narrationText: q('.dojo-rest-narration') ? q('.dojo-rest-narration').textContent : null,
    narrationBg: q('.dojo-rest-narration') ? getComputedStyle(q('.dojo-rest-narration')).backgroundColor : null,
    heroName: WM_I18N.pn(hero.name),
  };
}`;

// 3つの吹き出し(と GL-12 の地の文)の文を表の全行に差し替えて測る。targets に測る対象を並べる
const LINES_PROBE = `(args) => {
  const { targets, spec, old } = args;
  const root = document.getElementById('rosterDojoHeader');
  const header = root.querySelector('.dojo-header');
  const strings = (node, out) => {
    if (typeof node === 'string') out.push(node);
    else if (Array.isArray(node)) node.forEach(x => strings(x, out));
    else if (node && typeof node === 'object') Object.values(node).forEach(x => strings(x, out));
    return out;
  };
  const coachBubble = root.querySelector('.dojo-scene-bubble');
  const cv = document.createElement('canvas').getContext('2d');
  cv.font = getComputedStyle(coachBubble || root.querySelector('.dojo-rest-bubble, .dojo-heat-bubble') || header).font;
  const widest = arr => arr.filter(Boolean).sort((a, b) => cv.measureText(b).width - cv.measureText(a).width)[0];
  // {name}: 表示言語でいちばん幅の広い呼び名(コーチ→選手は名字) / {stat}: いちばん幅の広い能力名
  const callName = widest(ALL_CHARS.map(c => callNameText(null, c, '')));
  const stat = widest(Object.values(STAT_LABELS_JP).map(s => WM_I18N.t(s)));
  // GL-12 の {nameA}/{nameB}: 表示言語でいちばん長いフルネーム2つ
  const names = (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS : []).map(c => c.name).filter(Boolean)
    .sort((a, b) => WM_I18N.pn(b).length - WM_I18N.pn(a).length);
  const nameA = names[0], nameB = names[1];
  const axes = new Set(['bond', 'rivalry', 'trust']);
  const GROUPS = {
    coach: [
      ['コーチの報告', strings(COACH_VOICE_REPORT_LINES, []).map(raw => WM_I18N.t(raw, { name: callName, stat }))],
      ['コーチの熱量', strings(HEAT_STATE_COACH_LINES, []).map(raw => WM_I18N.t(raw).replace('{name}', callName))],
      ['雰囲気(コーチの口)', ATMOSPHERE_TEXTS.flat().map(o => WM_I18N.t(o.text))],
    ],
    heat: [['本人の熱量', strings(HEAT_STATE_SELF_LINES, []).map(raw => WM_I18N.t(raw))]],
    rest: [
      ['引き留め(噂・応えてもらえた)', [].concat(
        ...Object.values(LAST_WARNING_RUMOR_LINES).map(t => strings(t, [])),
        ...Object.values(LAST_WARNING_ANSWERED_LINES).map(t => strings(t, []))).map(raw => WM_I18N.t(raw))],
      ['信頼15割れ', strings(GLIMPSE_A_LINES.trust_below_15, []).map(raw => WM_I18N.t(raw))],
      ['A層(ほか)', [].concat(...GLIMPSE_A_THRESHOLDS.filter(t => axes.has(t.axis) && t.id !== 'trust_below_15')
        .map(t => strings(GLIMPSE_A_LINES[t.id], []))).map(raw => WM_I18N.t(raw))],
      ['B層 GL-01〜11', [].concat(...Object.keys(GLIMPSE_B_LINES).filter(k => k !== 'GL-12')
        .map(k => strings(GLIMPSE_B_LINES[k], []))).map(raw => WM_I18N.t(raw))],
      ['ラベル', GLIMPSE_A_THRESHOLDS.map(t => t.label).concat(['出番表に名前があった']).map(raw => WM_I18N.t(raw))],
    ],
    narration: [['GL-12 第三者の証言', strings(GLIMPSE_B_LINES['GL-12'], []).map(raw => WM_I18N.t(raw, { nameA, nameB }))]],
    // コーチ不在時にコーチの位置に出る雰囲気の地の文(全レベル。熱量の本人の割り込みはどのレベルでも起きる)
    atmoText: [['雰囲気の地の文', ATMOSPHERE_TEXTS.flat().map(o => o.emoji + ' ' + WM_I18N.t(o.text))]],
  };
  const SEL = { coach: '.dojo-scene-bubble', heat: '.dojo-heat-bubble', rest: '.dojo-rest-bubble', narration: '.dojo-rest-narration',
    atmoText: '.dojo-scene-atmosphere' };
  const PLAIN = new Set(['narration', 'atmoText']);   // 吹き出しではない地の文(本文の要素=それ自身・鉤括弧なし・打ち切りなし)
  const FACE = {
    coach: b => root.querySelector('.dojo-scene-coach-avatar'),
    heat: b => b.parentElement.querySelector('.dojo-scene-fighter'),
    rest: b => b.parentElement.querySelector('.dojo-rest-avatar'),
  };
  const shown = (kind, t) => PLAIN.has(kind) ? t : _quoteLine(t);
  const textElOf = kind => { const b = root.querySelector(SEL[kind]); return b ? (PLAIN.has(kind) ? b : b.querySelector('.dojo-bubble-text')) : null; };
  const setText = (kind, t) => { const el = textElOf(kind); if (el) el.textContent = shown(kind, t); };
  // 浮かんで消える演出(opacity)を止めて測る
  root.querySelectorAll('.dojo-rest-bubble, .dojo-rest-narration').forEach(b => { b.style.animation = 'none'; b.style.opacity = '1'; });
  // 掛け声はいちばん幅の広いものにしておく
  const widestShout = widest(DOJO_SHOUTS.map(s => WM_I18N.t(s)));
  root.querySelectorAll('.dojo-scene-shout').forEach(s => { s.style.animation = 'none'; s.textContent = widestShout; });

  const rect = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const inside = (a, o) => a.l >= o.l - 0.5 && a.t >= o.t - 0.5 && a.r <= o.r + 0.5 && a.b <= o.b + 0.5;
  const hit = (a, o) => Math.min(a.r, o.r) - Math.max(a.l, o.l) > 0.5 && Math.min(a.b, o.b) - Math.max(a.t, o.t) > 0.5;
  // 群ごとの要素。違う群どうしは重ならないこと。練習の群の中では熱量の吹き出しが隣の顔・掛け声に重ならないこと
  const PARTS = [
    ['coach', 'コーチの吹き出し', '.dojo-scene-bubble'], ['coach', 'コーチの顔', '.dojo-scene-coach-avatar'],
    ['coach', 'コーチ名', '.dojo-scene-coach-name'], ['coach', '雰囲気の地の文', '.dojo-scene-atmosphere'],
    ['center', '練習中の顔', '.dojo-scene-fighter'], ['center', '熱量の吹き出し', '.dojo-heat-bubble'], ['center', '掛け声', '.dojo-scene-shout'],
    ['rest', '休憩中の吹き出し', '.dojo-rest-bubble'], ['rest', '休憩中の顔', '.dojo-rest-avatar'], ['rest', '休憩中の地の文', '.dojo-rest-narration'],
  ];
  const layoutIssues = () => {
    const hr = rect(header);
    const els = [];
    PARTS.forEach(([g, label, sel]) => root.querySelectorAll(sel).forEach(el => { const r = rect(el); if (r.r - r.l >= 1) els.push({ g, label, el, r }); }));
    const outside = els.filter(e => !inside(e.r, hr)).map(e => e.label);
    const overlaps = [];
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i], b = els[j];
      const heatPair = (a.label === '熱量の吹き出し' || b.label === '熱量の吹き出し') && a.g === 'center' && b.g === 'center';
      if (a.g === b.g && !heatPair) continue;
      if (hit(a.r, b.r)) overlaps.push(a.label + '×' + b.label);
    }
    return { outside, overlaps };
  };
  // 文を1本ずつ当てて、いちばん大きくなる文(高さ→幅)を選ぶ
  const measureKind = kind => {
    const el = textElOf(kind); if (!el) return null;
    const box = root.querySelector(SEL[kind]);
    let best = null, bestKey = -1;
    GROUPS[kind].forEach(([, texts]) => texts.forEach(t => {
      setText(kind, t);
      const key = el.scrollHeight * 10000 + box.getBoundingClientRect().width;
      if (key > bestKey) { bestKey = key; best = t; }
    }));
    return best;
  };
  const worst = {};
  ['coach', 'heat', 'rest', 'narration', 'atmoText'].forEach(k => { worst[k] = measureKind(k); if (worst[k] != null) setText(k, worst[k]); });

  // 広げる前の寸法で何行になるか(参考): 切らない形の複製で数える
  const linesAtOld = (kind, text) => {
    const box = root.querySelector(SEL[kind]);
    const probe = box.cloneNode(false);
    probe.style.cssText = 'animation:none;display:block;position:absolute;visibility:hidden;left:0;top:0;margin:0;max-width:' + old[kind][0] + 'px';
    probe.textContent = text; header.appendChild(probe);
    const cs = getComputedStyle(probe);
    const n = Math.round((probe.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight));
    probe.remove();
    return n;
  };

  // 尻尾(::after・bottom:-6px)が吹き出し本体の overflow で切られていないこと(道場の3つの吹き出しすべて)
  const bubbles = Array.from(root.querySelectorAll('.dojo-rest-bubble, .dojo-heat-bubble, .dojo-scene-bubble'));
  const out = {
    tailClipped: bubbles.filter(b => getComputedStyle(b).overflow !== 'visible' || getComputedStyle(b, '::after').content === 'none').map(b => b.className),
    noTextEl: bubbles.filter(b => !b.querySelector('.dojo-bubble-text')).map(b => b.className),
    worst, callName, stat, nameA: WM_I18N.pn(nameA), nameB: WM_I18N.pn(nameB), widestShout, kinds: {},
  };
  targets.forEach(kind => {
    const el = textElOf(kind); if (!el) return;
    const box = root.querySelector(SEL[kind]);
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    // 地の文は line-height:normal なので、行の数は文字の矩形の上端を数える
    const rng = document.createRange();
    const lineCount = () => {
      rng.selectNodeContents(el);
      const tops = Array.from(rng.getClientRects()).filter(r => r.width > 0).map(r => r.top).sort((a, b) => a - b);
      const gap = parseFloat(cs.fontSize) * 0.6;   // 絵文字と文字の上端の数pxのずれは同じ行に数える
      return tops.reduce((acc, t, i) => acc + (i === 0 || t - tops[i - 1] > gap ? 1 : 0), 0);
    };
    const k = { total: 0, groups: {}, truncated: [], outside: [], overlaps: [], offCenter: [], maxLines: 0, widest: 0,
      clampLines: PLAIN.has(kind) ? null : (Number(cs.webkitLineClamp) || null),
      maxWidth: parseFloat(getComputedStyle(box).maxWidth) || null };
    GROUPS[kind].forEach(([name, texts]) => {
      const g = { n: texts.length, before: 0, after: 0 };
      texts.forEach(t => {
        const s = shown(kind, t);
        el.textContent = s;
        k.total++;
        if (old[kind] && linesAtOld(kind, s) > old[kind][1]) g.before++;
        const cut = el.scrollHeight > el.clientHeight + 1;
        if (cut) { g.after++; if (k.truncated.length < 3) k.truncated.push(s); }
        const n = PLAIN.has(kind) ? lineCount() : Math.round(el.scrollHeight / lh);
        if (n > k.maxLines) k.maxLines = n;
        const br = rect(box);
        if (br.r - br.l > k.widest) k.widest = Math.round(br.r - br.l);
        if (FACE[kind]) {
          const fr = rect(FACE[kind](box));
          if (Math.abs((br.l + br.r) / 2 - (fr.l + fr.r) / 2) > 1 && k.offCenter.length < 3) k.offCenter.push(s);
        }
        const li = layoutIssues();
        li.outside.forEach(x => { if (!k.outside.includes(x)) k.outside.push(x); });
        li.overlaps.forEach(x => { if (k.overlaps.length < 5 && !k.overlaps.some(o => o.with === x)) k.overlaps.push({ with: x, text: s }); });
      });
      k.groups[name] = g;
    });
    setText(kind, worst[kind]);
    out.kinds[kind] = k;
  });
  out.header = { h: Math.round(header.getBoundingClientRect().height), w: Math.round(header.getBoundingClientRect().width) };
  return out;
}`;

const KIND_LABEL = { coach: 'コーチの吹き出し', heat: '熱量の本人の吹き出し', rest: '休憩中の吹き出し', narration: '休憩中の地の文(GL-12)',
  atmoText: '雰囲気の地の文' };
const PLAIN_KINDS = new Set(['narration', 'atmoText']);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const fixtureText = fs.readFileSync(FIXTURE, 'utf8');
  const server = await startStaticServer({ projectRoot: ROOT });
  const browser = await chromium.launch({ headless: true });
  let ng = 0;
  const check = (label, cond, detail) => {
    console.log((cond ? '  OK  ' : '  NG  ') + label);
    if (!cond) { ng++; if (detail !== undefined) console.log('        -> ' + JSON.stringify(detail).slice(0, 600)); }
  };
  const summary = {};
  const runLines = async (page, tag, targets, errs) => {
    const r = await page.evaluate(({ src, args }) => (0, eval)(src)(args), { src: LINES_PROBE, args: { targets, spec: SPEC, old: OLD } });
    for (const kind of targets) {
      const k = r.kinds[kind];
      if (!k) { check(`${tag} ${KIND_LABEL[kind]} が描かれている`, false); continue; }
      if (PLAIN_KINDS.has(kind)) {
        check(`${tag} ${KIND_LABEL[kind]} 全${k.total}本(最大${k.maxLines}行・最大幅${k.widest}px・バナー${r.header.w}×${r.header.h})`, k.truncated.length === 0, k.truncated);
      } else {
        const [w, lines] = SPEC[kind];
        check(`${tag} ${KIND_LABEL[kind]} 全${k.total}本が切れない(幅${k.maxWidth}px・打ち切り${k.clampLines}行・最大${k.maxLines}行・最大幅${k.widest}px・バナー${r.header.w}×${r.header.h})`,
          k.truncated.length === 0 && k.clampLines === lines && k.maxWidth === w && k.maxLines <= lines, k.truncated);
        check(`${tag} ${KIND_LABEL[kind]} の尻尾が顔の水平中心を指す`, k.offCenter.length === 0, k.offCenter);
      }
      check(`${tag} ${KIND_LABEL[kind]} を全行当てても、道場の要素がバナーからはみ出さない`, k.outside.length === 0, k.outside);
      check(`${tag} ${KIND_LABEL[kind]} を全行当てても、要素どうしが被らない`, k.overlaps.length === 0, k.overlaps);
    }
    check(`${tag} 3つの吹き出しの尻尾が切られていない(本文は .dojo-bubble-text)`, r.tailClipped.length === 0 && r.noTextEl.length === 0, r);
    check(`${tag} 例外ゼロ`, errs.length === 0, errs);
    return r;
  };
  const shot = async (page, name) => page.screenshot({ path: path.join(OUT, name),
    clip: await page.evaluate(() => { const b = document.querySelector('#rosterDojoHeader .dojo-header').getBoundingClientRect();
      return { x: 0, y: Math.max(0, b.top - 8), width: window.innerWidth, height: b.height + 16 }; }) }).catch(() => {});
  try {
    for (const lang of ['ja', 'en']) {
      for (const [width, height] of VIEWPORTS) {
        for (const scene of SCENES) {
          // 1) 休憩中の吹き出し+コーチ+熱量の本人
          {
            const { context, page, errs } = await setupPage(browser, server, fixtureText, lang, { width, height });
            const s = await page.evaluate(({ src, args }) => (0, eval)(src)(args), { src: SCENE_PROBE, args: { scene, rest: 'bubble' } });
            const tag = `[${lang} ${width}px ${scene}]`;
            const wantHeat = scene !== 'coachOnly';
            check(`${tag} 場面が組めた(${s.week}週・休憩中の吹き出し${s.restBubble ? 'あり' : 'なし'}・コーチ${s.coachBubble ? 'あり' : 'なし'}・練習の顔${s.fighters}・熱量${s.heatBubble ? (s.heatMid ? 'あり(列の真ん中)' : 'あり') : 'なし'})`,
              s.restBubble && (scene === 'atmo' ? s.atmosphere && !s.coachBubble : s.coachBubble)
                && (scene === 'coachOnly' ? s.fighters === 0 : s.fighters > 0) && s.heatBubble === wantHeat
                && ((scene !== 'full' && scene !== 'atmo') || s.fighters >= 4) && (scene !== 'mid' || s.heatMid), s);
            if (s.restBubble) {
              const targets = ['rest'].concat(s.coachBubble ? ['coach'] : []).concat(s.heatBubble ? ['heat'] : [])
                .concat(s.atmosphere ? ['atmoText'] : []);
              const r = await runLines(page, tag, targets, errs);
              if (scene === 'full' && (width === 1280 || width === 375)) summary[`${lang} ${width}px`] = r.kinds;
              if (scene === 'full' && width === 1280) summary[`${lang} 置換`] = { name: r.callName, stat: r.stat, nameA: r.nameA, nameB: r.nameB, shout: r.widestShout };
              await shot(page, `${scene}-${lang}-${width}.png`);
            }
            await context.close();
          }
          // 2) 休憩中の枠に GL-12(地の文)
          {
            const { context, page, errs } = await setupPage(browser, server, fixtureText, lang, { width, height });
            const s = await page.evaluate(({ src, args }) => (0, eval)(src)(args), { src: SCENE_PROBE, args: { scene, rest: 'narration' } });
            const tag = `[${lang} ${width}px ${scene} GL-12]`;
            const hasQuote = /[「」『』“”"]/.test(s.narrationText || '');
            check(`${tag} 地の文は吹き出しにしない(${s.week}週・練習の顔${s.fighters}・白い塗りなし・顔なし・鉤括弧なし: 背景 ${s.narrationBg})`,
              s.narration && !s.restBubble && !s.restAvatar && !hasQuote && /rgba\(0, 0, 0, 0\)|transparent/.test(s.narrationBg || '')
                && (scene !== 'mid' || s.heatMid) && ((scene !== 'full' && scene !== 'atmo') || s.fighters >= 4), s);
            if (s.narration) {
              await runLines(page, tag, ['narration'], errs);
              if (scene === 'full') await shot(page, `${scene}-gl12-${lang}-${width}.png`);
            }
            await context.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log('\n(参考) 切れる本数 — 広げる前(コーチ190px・2行/熱量150px・2行/休憩中150px・2行)→ 今(コーチ210px・4行/熱量160px・3行/休憩中200px・4行)');
  Object.entries(summary).forEach(([k, v]) => {
    if (k.endsWith('置換')) { console.log(`  ${k}: ${JSON.stringify(v)}`); return; }
    Object.entries(v).forEach(([kind, kk]) => {
      console.log(`  ${k} ${KIND_LABEL[kind]}: ` + Object.entries(kk.groups).map(([g, x]) => `${g} ${x.before}→${x.after}/${x.n}`).join(' / '));
    });
  });
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
