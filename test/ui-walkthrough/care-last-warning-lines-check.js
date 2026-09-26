#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/ui-walkthrough/care-last-warning-lines-check.js — 退団寸前の引き留めのセリフ(承認済み204本)が
//  実UI(index.html)に出ることの確認(手動実行・run-all には入らない)
//
//  docs/care-last-warning-design-v0.1.md §5-2〜§5-4 の3か所を、fixture(1季目1週)を加工して実UIで踏む:
//    1. 道場「休憩中の選手」の確定枠 — 20割れの噂の週(原因=出番/人間関係)の本人の一言
//    2. 同じ確定枠 — 応えてもらえた一言(出番が原因の子をカードに入れた週。tone positive・milestone)
//    3. 声かけの結果モーダル(信頼20未満) — 原因(出番/人間関係/はっきりしない)の表の反応+「表情は硬いまま」の地の文
//  いずれも Engine の本物の経路(checkALayer・App.encourageFighter)で作り、吹き出しの文が表の1本(EN はその英訳)で
//  あること・吹き出しに選手名を書かないこと・EN に日本語が残らないことを JA/EN の両方で見る。
//  スクリーンショットは test/ui-walkthrough/artifacts/care-last-warning-lines/(Git管理外)。
//
//  使い方: node test/ui-walkthrough/care-last-warning-lines-check.js
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startStaticServer } = require('./server');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'season-1-week-1-seed42.json');
const OUT = path.join(__dirname, 'artifacts', 'care-last-warning-lines');
const JA_RE = /[぀-ヿ㐀-鿿]/;

async function setupPage(browser, server, fixtureText, lang, viewport) {
  const context = await browser.newContext({ viewport: viewport || { width: 1440, height: 1000 } });
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
  return { context, page, errs };
}

// 道場の確定枠: 選手を1人選び、噂(20割れ・原因 cause)または応えてもらえた週の状態にして checkALayer を通し、
// その週の glimpse を weekLogFeed に置いて道場を描く(app.js の Tier2 振り分けと同じ置き方)
const DOJO_PROBE = `(args) => {
  const { heroIndex, mode } = args;
  showScreen('roster');
  G.season = 2; G.week = 6; G.offSeason = false;
  G.currentCoachReport = null;
  G.lockerRoomMorale = 10;   // 雰囲気レベル1 = 中央の練習の列は0人(確定枠の選手が練習の列に取られない)
  window.getHiredCoaches = () => [];
  (G.roster || []).forEach(f => { f._heat = 0; f.injury = null; f.onLeave = false; });
  const hero = G.roster.filter(f => !f.isRental)[heroIndex];
  const abs = Engine.util.absWeek(G.season, G.week);
  const prev = {};
  G.roster.forEach(f => { prev[f.id] = f.trust != null ? f.trust : 50; });
  G.roster = G.roster.map(f => {
    if (f.id !== hero.id) return f;
    if (mode === 'answered') return { ...f, trust: 22, lastWarning: { cause: 'stage', week: abs - 4, answered: true, answeredBy: 'card', answeredWeek: abs } };
    return { ...f, trust: 19, trustStrain: { [mode]: 9, other: 1 }, lastWarning: undefined };
  });
  prev[hero.id] = 22;
  G._glimpseAPrevTrust = prev;
  G._glimpseAFired = {}; G._glimpseACooldowns = {};
  const type = mode === 'answered' ? 'last_warning_answered' : 'trust_below_20';
  let g = null;
  for (let i = 1; i < 200 && !g; i++) {   // 20割れの噂は率の抽選がある。出る種まで回す
    const out = Engine.glimpse.checkALayer(G, Engine.rng.create(i));
    g = out.glimpses.find(x => x.speakerId === hero.id && x.type === type) || null;
  }
  if (!g) return { error: 'glimpse が出ない' };
  const f = G.roster.find(x => x.id === hero.id);
  const tbl = mode === 'answered' ? LAST_WARNING_ANSWERED_LINES.stage : LAST_WARNING_RUMOR_LINES[mode];
  const raw = tbl[f.archetype][f.personality][0];
  G.weekLogFeed = [g];
  renderRoster();
  const el = document.getElementById('rosterDojoHeader');
  const bubbles = Array.from(el.querySelectorAll('.dojo-rest-bubble'));
  const wrap = bubbles[0] ? bubbles[0].closest('.dojo-rest-fighter') : null;
  const avatar = wrap ? wrap.querySelector('.dojo-rest-avatar') : null;
  return {
    name: WM_I18N.pn(f.name), cell: f.archetype + '/' + f.personality, cause: g.cause || null, tone: g.tone, milestone: !!g.milestone,
    glimpseDialogue: g.dialogue, raw, expected: WM_I18N.t(raw),
    bubbleCount: bubbles.length,
    text: bubbles[0] ? bubbles[0].textContent : '',
    speakerOk: !!(wrap && (wrap.getAttribute('onclick') || '').includes('(' + f.id + ',')),
    bubbleAboveImage: !!(wrap && avatar && Array.prototype.indexOf.call(wrap.children, bubbles[0]) < Array.prototype.indexOf.call(wrap.children, avatar)),
  };
}`;

// 声かけ: 信頼17・噂の原因 cause の選手に App.encourageFighter を押し、結果モーダルの吹き出しと地の文を読む
const ENC_PROBE = `(args) => {
  const { heroIndex, cause, table } = args;
  G.season = 2; G.week = 6; G.offSeason = false;
  const hero = G.roster.filter(f => !f.isRental)[heroIndex];
  const abs = Engine.util.absWeek(G.season, G.week);
  G.roster = G.roster.map(f => f.id !== hero.id ? f
    : { ...f, trust: 17, injury: null, slump: null, motivationLoss: false, _decisionWeekUsed: {},
        lastWarning: cause ? { cause, week: abs - 2, answered: false } : undefined });
  App.encourageFighter(hero.id);
  const f = G.roster.find(x => x.id === hero.id);
  const raw = LAST_WARNING_ENCOURAGE_LINES[table][f.archetype][f.personality][0];
  const speech = document.querySelector('.mdl-a-subject-speech .u3b-bubble-text');
  const modal = document.getElementById('mdlADecisionResultClose');
  // モーダルの根 = 「見届ける」のボタンと本人の吹き出しを両方含むいちばん近い祖先
  let box = modal;
  while (box && !box.querySelector('.mdl-a-subject-speech')) box = box.parentElement;
  const bodyText = box ? box.textContent : '';
  // 取次の帯(.mdl-a-reporter-strip「決裁の結果をお伝えします」)も含めてモーダル全体を見る(2026-09-26 英訳済み)
  const reporter = box ? box.querySelector('.mdl-a-reporter-strip') : null;
  const badge = box ? box.querySelector('.mdl-a-result-badge') : null;
  return {
    name: WM_I18N.pn(f.name), cell: f.archetype + '/' + f.personality, cause, raw, expected: WM_I18N.t(raw),
    text: speech ? speech.textContent : '',
    hardFace: bodyText.includes(WM_I18N.t('話は最後まで聞いてくれた。けれど、表情は硬いままだ')),
    // 「・」(U+30FB)は見出しの区切りなので日本語の判定から外す
    bodyJa: (bodyText.match(/[぀-ヺー-ヿ㐀-鿿][぀-ヿ㐀-鿿、。…！？]*/g) || []).slice(0, 8),
    reporterExpected: WM_I18N.t('決裁の結果をお伝えします'),
    reporterText: reporter ? reporter.textContent.replace(/\\s+/g, ' ').trim() : '',
    // 不確実性トーンのマーカー: 信頼20未満の声かけでは出さない(性格×口調の倍率が high/low の子でも)
    badge: badge ? badge.textContent.trim() : '',
    toneIfOutsideBand: Engine.shachoshitsu.classifyTone(Engine.shachoshitsu.calcUncertainty('encourage', f)),
    modalOpen: !!modal,
  };
}`;

// (参考・NG にしない) 道場の吹き出し(.dojo-rest-bubble: 幅150px・2行で切る)に収まる本数を数える。
// 切らない形で描いて行数を測り、3行以上=「…」で切れて最後まで読めない
const FIT_PROBE = `() => {
  showScreen('roster');
  const header = document.querySelector('#rosterDojoHeader .dojo-header') || document.getElementById('rosterDojoHeader');
  const outer = document.createElement('div'); outer.className = 'dojo-rest-fighters'; header.appendChild(outer);
  const wrap = document.createElement('div'); wrap.className = 'dojo-rest-fighter'; outer.appendChild(wrap);
  const lines = (raw) => {
    const b = document.createElement('div');
    b.className = 'dojo-rest-bubble';
    b.textContent = _quoteLine(WM_I18N.t(raw));
    b.style.animation = 'none'; b.style.display = 'block'; b.style.webkitLineClamp = 'unset'; b.style.overflow = 'visible';
    wrap.appendChild(b);
    const cs = getComputedStyle(b);
    const n = Math.round((b.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight));
    wrap.removeChild(b);
    return n;
  };
  const flat = (tbl) => [].concat(...Object.values(tbl).map(byP => [].concat(...Object.values(byP))));
  const out = {};
  [['噂・出番', LAST_WARNING_RUMOR_LINES.stage], ['噂・人間関係', LAST_WARNING_RUMOR_LINES.bonds],
   ['応えてもらえた', LAST_WARNING_ANSWERED_LINES.stage], ['(既存)信頼15割れ', GLIMPSE_A_LINES.trust_below_15]].forEach(([k, t]) => {
    const all = flat(t);
    out[k] = all.filter(s => lines(s) > 2).length + '/' + all.length;
  });
  outer.remove();
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
    if (!cond) { ng++; if (detail !== undefined) console.log('        -> ' + JSON.stringify(detail)); }
  };

  try {
    for (const lang of ['ja', 'en']) {
      // ── 道場の確定枠(噂: 出番/人間関係・応えてもらえた) ── 口調の違う3人で
      for (const [heroIndex, mode] of [[0, 'stage'], [3, 'bonds'], [5, 'answered'], [8, 'stage']]) {
        const { context, page, errs } = await setupPage(browser, server, fixtureText, lang);
        const r = await page.evaluate(({ src, args }) => (0, eval)(src)(args), { src: DOJO_PROBE, args: { heroIndex, mode } });
        console.log(`\n=== [${lang}] 道場 ${mode} #${heroIndex} ===\n` + JSON.stringify(r));
        check(`[${lang}] 道場 ${mode}: 例外ゼロ`, errs.length === 0, errs);
        check(`[${lang}] 道場 ${mode}: glimpse の一言が表の1本`, !r.error && r.glimpseDialogue === r.raw, r);
        if (mode !== 'answered') check(`[${lang}] 道場 ${mode}: 噂の原因`, r.cause === mode, r.cause);
        else check(`[${lang}] 道場 answered: tone positive・milestone`, r.tone === 'positive' && r.milestone, r);
        check(`[${lang}] 道場 ${mode}: 確定枠に1つ出る(話し手はその選手・吹き出しは画像の上)`, r.bubbleCount === 1 && r.speakerOk && r.bubbleAboveImage, r);
        check(`[${lang}] 道場 ${mode}: 吹き出しの文が表の1本(${lang === 'en' ? '英訳' : '原文'})`, r.text.includes(r.expected), { text: r.text, expected: r.expected });
        check(`[${lang}] 道場 ${mode}: 吹き出しに選手名を書かない`, !r.text.includes(r.name), r.text);
        if (lang === 'en') check(`[en] 道場 ${mode}: 日本語が残らない`, !JA_RE.test(r.text), r.text);
        await page.screenshot({ path: path.join(OUT, `dojo-${mode}-${heroIndex}-${lang}.png`), clip: { x: 0, y: 0, width: 1440, height: 520 } }).catch(() => {});
        await context.close();
      }
      // ── 声かけの結果モーダル(出番/人間関係/給与=はっきりしない/原因なし) ──
      for (const [heroIndex, cause, table] of [[1, 'stage', 'stage'], [2, 'bonds', 'bonds'], [4, 'pay', 'general'], [6, null, 'general']]) {
        const { context, page, errs } = await setupPage(browser, server, fixtureText, lang);
        await page.evaluate(() => showScreen('roster'));
        const r = await page.evaluate(({ src, args }) => (0, eval)(src)(args), { src: ENC_PROBE, args: { heroIndex, cause, table } });
        await page.waitForTimeout(1500);   // モーダルの開きのアニメーションが終わってから撮る
        console.log(`\n=== [${lang}] 声かけ ${cause} #${heroIndex} ===\n` + JSON.stringify(r));
        check(`[${lang}] 声かけ ${cause}: 例外ゼロ`, errs.length === 0, errs);
        check(`[${lang}] 声かけ ${cause}: 結果モーダルが開く`, r.modalOpen, r);
        check(`[${lang}] 声かけ ${cause}: 吹き出しが原因の表(${table})の1本`, r.text === r.expected, { text: r.text, expected: r.expected });
        check(`[${lang}] 声かけ ${cause}: 地の文「表情は硬いまま」`, r.hardFace, r);
        check(`[${lang}] 声かけ ${cause}: 吹き出しに選手名を書かない`, !r.text.includes(r.name), r.text);
        check(`[${lang}] 声かけ ${cause}: トーンのマーカーを出さない(帯の外なら ${r.toneIfOutsideBand || 'なし'})`, r.badge === '', r.badge);
        if (lang === 'en') {
          check(`[en] 声かけ ${cause}: モーダル(取次の帯を含む)に日本語が残らない`, r.bodyJa.length === 0, r.bodyJa);
          check(`[en] 声かけ ${cause}: 取次の帯が英語`, r.reporterText.includes(r.reporterExpected) && !JA_RE.test(r.reporterText), r.reporterText);
        }
        await page.screenshot({ path: path.join(OUT, `encourage-${cause || 'none'}-${heroIndex}-${lang}.png`) }).catch(() => {});
        await context.close();
      }
      // (参考) 道場の吹き出しで「…」で切れる本数
      {
        const { context, page } = await setupPage(browser, server, fixtureText, lang);
        const fit = await page.evaluate(({ src }) => (0, eval)(src)(), { src: FIT_PROBE });
        console.log(`\n  (参考) [${lang}] 道場の吹き出し(幅150px・2行)で切れる本数: ${JSON.stringify(fit)}`);
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
