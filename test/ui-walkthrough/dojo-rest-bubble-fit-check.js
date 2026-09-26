#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/ui-walkthrough/dojo-rest-bubble-fit-check.js — 道場「休憩中の選手」の吹き出し(.dojo-rest-bubble)に
//  出るすべての一言が、実UIで最後まで読める(4行で「…」に切れない)こと・バナーの中で他の要素に被らないことの
//  確認(手動実行・run-all には入らない)
//
//  2026-09-26 Keisuke 裁定(案A): 幅150px・2行 → 幅200px・最大4行。docs/ui/mockup-baseline-v0.1.md §3 の例外。
//  fixture(1季目1週)を開き、道場バナーを「いちばん混む形」で実際に描いてから(コーチの吹き出し+練習中の列+
//  熱量の本人の吹き出し+休憩中の選手)、休憩中の吹き出しの文を表の全行に差し替えて1本ずつ測る:
//    1. 切れない: scrollHeight <= clientHeight(-webkit-line-clamp:4 で切れていない)
//    2. バナーの中: 吹き出しと顔がバナーの矩形からはみ出さない(overflow:hidden で上が切れない)
//    3. 被らない: コーチの吹き出し・顔・名前/雰囲気の地の文/練習中の選手の顔・熱量の吹き出し・掛け声と重ならない
//  表: GLIMPSE_A_LINES(bond/rivalry/trust の閾値すべて)・LAST_WARNING_RUMOR_LINES・LAST_WARNING_ANSWERED_LINES・
//      GLIMPSE_B_LINES(GL-01〜GL-12。GL-12 は表示言語でいちばん長い名前2つを入れる)・閾値のラベル(一言が空のときの代替)
//  場面: full(コーチ+練習の列+熱量の吹き出し)/ atmo(コーチ不在=雰囲気の地の文)/ coachOnly(練習の列なし)
//  言語: JA/EN。幅: 1920/1280/1024/761(横並び配置)・760/414/375/360(狭い画面の流し込み配置)
//  あわせて、道場の3つの吹き出し(コーチ/熱量の本人/休憩中)の尻尾が本体の overflow で切られていないこと、
//  休憩中の吹き出しの尻尾(吹き出しの水平中心)が顔の水平中心を指すことも見る
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
// 761 = 横並び配置の下限 / 760 = 流し込み配置の上限(index.html の @media(max-width:760px))
const VIEWPORTS = [[1920, 1080], [1280, 900], [1024, 768], [761, 900], [760, 900], [414, 896], [375, 812], [360, 780]];
const SCENES = ['full', 'atmo', 'coachOnly'];

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

// 道場バナーを描く。scene で混み具合を変える。休憩中の選手は練習の列にいない子を選ぶ(列にいる子は休憩枠に出ない)
const SCENE_PROBE = `(args) => {
  const { scene } = args;
  showScreen('roster');
  G.season = 2; G.week = 7; G.offSeason = false;
  G.currentCoachReport = null;
  G.lockerRoomMorale = scene === 'coachOnly' ? 10 : 95;   // 95 = 雰囲気レベル5(2〜3人の列) / 10 = 列なし
  const coach = (typeof ALL_COACHES !== 'undefined' && ALL_COACHES[0]) ? ALL_COACHES[0] : null;
  window.getHiredCoaches = (scene === 'atmo' || !coach) ? () => [] : () => [coach];
  const roster = (G.roster || []).filter(f => !f.isRental);
  (G.roster || []).forEach(f => { f._heat = 0; f.injury = null; f.onLeave = false; });
  // full: heavy を2人。1人目はコーチが語り、2人目は練習の列に割り込んで本人の吹き出しを出す
  if (scene === 'full') { roster[0]._heat = 5; roster[1]._heat = 5; }
  G.weekLogFeed = [];
  renderRoster();
  const root = document.getElementById('rosterDojoHeader');
  const practicing = new Set(Array.from(root.querySelectorAll('.dojo-scene-fighter-wrap'))
    .map(w => { const m = (w.getAttribute('onclick') || '').match(/showFighterPopup\\((\\d+)/); return m ? Number(m[1]) : null; }));
  const hero = roster.find(f => !practicing.has(f.id) && f._heat === 0);
  G.weekLogFeed = [{ layer: 'A', axis: 'trust', type: 'trust_below_15', tone: 'danger', label: '退団を決めかけているという噂',
    speakerId: hero.id, speakerName: hero.name, dialogue: 'テスト' }];
  renderRoster();
  const q = s => root.querySelector(s);
  return {
    restBubble: !!q('.dojo-rest-bubble'), coachBubble: !!q('.dojo-scene-bubble'), atmosphere: !!q('.dojo-scene-atmosphere'),
    fighters: root.querySelectorAll('.dojo-scene-fighter').length, heatBubble: !!q('.dojo-heat-bubble'),
    heroName: WM_I18N.pn(hero.name),
  };
}`;

// 休憩中の吹き出しの文を表の全行に差し替えて測る
const LINES_PROBE = `(args) => {
  const root = document.getElementById('rosterDojoHeader');
  const header = root.querySelector('.dojo-header');
  const bubble = root.querySelector('.dojo-rest-bubble');
  const textEl = bubble.querySelector('.dojo-bubble-text');   // 行数の打ち切り(line-clamp)は本文側
  const restAvatar = root.querySelector('.dojo-rest-avatar');
  bubble.style.animation = 'none'; bubble.style.opacity = '1';
  // 尻尾(::after・bottom:-6px)が吹き出し本体の overflow で切られていないこと(道場の3つの吹き出しすべて)
  const tailClipped = Array.from(root.querySelectorAll('.dojo-rest-bubble, .dojo-heat-bubble, .dojo-scene-bubble'))
    .filter(b => getComputedStyle(b).overflow !== 'visible' || getComputedStyle(b, '::after').content === 'none')
    .map(b => b.className);
  const noTextEl = Array.from(root.querySelectorAll('.dojo-rest-bubble, .dojo-heat-bubble, .dojo-scene-bubble'))
    .filter(b => !b.querySelector('.dojo-bubble-text')).map(b => b.className);
  const strings = (node, out) => {
    if (typeof node === 'string') out.push(node);
    else if (Array.isArray(node)) node.forEach(x => strings(x, out));
    else if (node && typeof node === 'object') Object.values(node).forEach(x => strings(x, out));
    return out;
  };
  // GL-12 の {nameA}/{nameB}: 表示言語でいちばん長いフルネーム2つ
  const names = (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS : []).map(c => c.name).filter(Boolean)
    .sort((a, b) => WM_I18N.pn(b).length - WM_I18N.pn(a).length);
  const nameA = names[0], nameB = names[1];
  const groups = [];
  const axes = new Set(['bond', 'rivalry', 'trust']);
  const lw = [].concat(
    ...Object.values(LAST_WARNING_RUMOR_LINES).map(t => strings(t, [])),
    ...Object.values(LAST_WARNING_ANSWERED_LINES).map(t => strings(t, [])));
  groups.push(['引き留め(噂・応えてもらえた)', lw.map(raw => WM_I18N.t(raw))]);
  groups.push(['信頼15割れ', strings(GLIMPSE_A_LINES.trust_below_15, []).map(raw => WM_I18N.t(raw))]);
  groups.push(['A層(ほか)', [].concat(...GLIMPSE_A_THRESHOLDS.filter(t => axes.has(t.axis) && t.id !== 'trust_below_15')
    .map(t => strings(GLIMPSE_A_LINES[t.id], []))).map(raw => WM_I18N.t(raw))]);
  groups.push(['B層 GL-01〜11', [].concat(...Object.keys(GLIMPSE_B_LINES).filter(k => k !== 'GL-12')
    .map(k => strings(GLIMPSE_B_LINES[k], []))).map(raw => WM_I18N.t(raw))]);
  groups.push(['B層 GL-12', strings(GLIMPSE_B_LINES['GL-12'], []).map(raw => WM_I18N.t(raw, { nameA, nameB }))]);
  groups.push(['ラベル', GLIMPSE_A_THRESHOLDS.map(t => t.label).concat(['出番表に名前があった']).map(raw => WM_I18N.t(raw))]);

  const rect = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const inside = (a, o) => a.l >= o.l - 0.5 && a.t >= o.t - 0.5 && a.r <= o.r + 0.5 && a.b <= o.b + 0.5;
  const hit = (a, o) => Math.min(a.r, o.r) - Math.max(a.l, o.l) > 0.5 && Math.min(a.b, o.b) - Math.max(a.t, o.t) > 0.5;
  const others = [
    ['コーチの吹き出し', '.dojo-scene-bubble'], ['コーチの顔', '.dojo-scene-coach-avatar'], ['コーチ名', '.dojo-scene-coach-name'],
    ['雰囲気の地の文', '.dojo-scene-atmosphere'], ['練習中の顔', '.dojo-scene-fighter'], ['熱量の吹き出し', '.dojo-heat-bubble'],
    ['掛け声', '.dojo-scene-shout'],
  ];
  // 旧寸法(幅150px・2行)で切れていた本数(参考): 切らない形の複製で行数を数える
  const probe = bubble.cloneNode(false);
  probe.style.cssText = 'animation:none;display:block;-webkit-line-clamp:unset;overflow:visible;max-width:150px;position:absolute;visibility:hidden;left:0;top:0';
  header.appendChild(probe);
  const linesAt150 = text => {
    probe.textContent = text;
    const cs = getComputedStyle(probe);
    return Math.round((probe.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight));
  };
  const out = { groups: {}, truncated: [], clipped: [], overlaps: [], othersClipped: [], offCenter: [], maxLines: 0, total: 0, widest: 0,
    tailClipped, noTextEl, clampLines: Number(getComputedStyle(textEl).webkitLineClamp) || null };
  const lh = parseFloat(getComputedStyle(textEl).lineHeight);
  groups.forEach(([name, texts]) => {
    const g = { n: texts.length, before: 0, after: 0 };
    texts.forEach(t => {
      const shown = _quoteLine(t);
      textEl.textContent = shown;
      out.total++;
      if (linesAt150(shown) > 2) g.before++;
      const cut = textEl.scrollHeight > textEl.clientHeight + 1;
      if (cut) { g.after++; out.truncated.push(shown); }
      const n = Math.round(textEl.scrollHeight / lh);
      if (n > out.maxLines) out.maxLines = n;
      const br = rect(bubble), ar = rect(restAvatar), hr = rect(header);
      if (br.r - br.l > out.widest) out.widest = Math.round(br.r - br.l);
      // 尻尾(吹き出しの水平中心)が顔の水平中心を指す
      if (Math.abs((br.l + br.r) / 2 - (ar.l + ar.r) / 2) > 1 && out.offCenter.length < 3) out.offCenter.push(shown);
      if (!inside(br, hr) || !inside(ar, hr)) out.clipped.push({ text: shown, bubble: br, avatar: ar, header: hr });
      others.forEach(([label, sel]) => root.querySelectorAll(sel).forEach(el => {
        const or = rect(el);
        if (or.r - or.l < 1) return;
        if (hit(br, or) || hit(ar, or)) out.overlaps.push({ with: label, text: shown });
        if (!inside(or, hr) && !out.othersClipped.includes(label)) out.othersClipped.push(label);
      }));
    });
    out.groups[name] = g;
  });
  probe.remove();
  // いちばん長い文を載せた状態で撮る
  const longest = [].concat(...groups.map(g => g[1])).sort((a, b) => b.length - a.length)[0];
  textEl.textContent = _quoteLine(longest);
  out.header = { h: Math.round(header.getBoundingClientRect().height), w: Math.round(header.getBoundingClientRect().width) };
  out.overlaps = out.overlaps.slice(0, 5); out.clipped = out.clipped.slice(0, 3);
  return out;
}`;

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
  try {
    for (const lang of ['ja', 'en']) {
      for (const [width, height] of VIEWPORTS) {
        for (const scene of SCENES) {
          const { context, page, errs } = await setupPage(browser, server, fixtureText, lang, { width, height });
          const s = await page.evaluate(({ src, args }) => (0, eval)(src)(args), { src: SCENE_PROBE, args: { scene } });
          const tag = `[${lang} ${width}px ${scene}]`;
          check(`${tag} 場面が組めた(休憩中の吹き出し${s.restBubble ? 'あり' : 'なし'}・コーチ${s.coachBubble ? 'あり' : 'なし'}・練習の顔${s.fighters}・熱量${s.heatBubble ? 'あり' : 'なし'})`,
            s.restBubble && (scene === 'atmo' ? s.atmosphere : s.coachBubble) && (scene === 'coachOnly' ? s.fighters === 0 : s.fighters > 0)
              && (scene !== 'full' || s.heatBubble), s);
          if (!s.restBubble) { await context.close(); continue; }
          const r = await page.evaluate(({ src }) => (0, eval)(src)({}), { src: LINES_PROBE });
          check(`${tag} 全${r.total}本が切れない(打ち切り${r.clampLines}行・最大${r.maxLines}行・最大幅${r.widest}px・バナー${r.header.w}×${r.header.h})`,
            r.truncated.length === 0 && r.clampLines === 4 && r.maxLines <= 4, r.truncated.slice(0, 3));
          check(`${tag} 3つの吹き出しの尻尾が切られていない(本文は .dojo-bubble-text)`, r.tailClipped.length === 0 && r.noTextEl.length === 0, r);
          check(`${tag} 休憩中の吹き出しの尻尾が顔の水平中心を指す`, r.offCenter.length === 0, r.offCenter);
          check(`${tag} 吹き出しと顔がバナーからはみ出さない`, r.clipped.length === 0, r.clipped);
          check(`${tag} ほかの要素に被らない`, r.overlaps.length === 0, r.overlaps);
          check(`${tag} ほかの要素もバナーの中に収まる`, r.othersClipped.length === 0, r.othersClipped);
          check(`${tag} 例外ゼロ`, errs.length === 0, errs);
          if (scene === 'full' && (width === 1280 || width === 375)) summary[`${lang} ${width}px`] = r.groups;
          await page.screenshot({ path: path.join(OUT, `${scene}-${lang}-${width}.png`),
            clip: await page.evaluate(() => { const b = document.querySelector('#rosterDojoHeader .dojo-header').getBoundingClientRect();
              return { x: 0, y: Math.max(0, b.top - 8), width: window.innerWidth, height: b.height + 16 }; }) }).catch(() => {});
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log('\n(参考) 切れる本数 — 旧(幅150px・2行)→ 新(幅200px・4行)');
  Object.entries(summary).forEach(([k, groups]) => {
    console.log('  ' + k + ': ' + Object.entries(groups).map(([g, v]) => `${g} ${v.before}→${v.after}/${v.n}`).join(' / '));
  });
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
