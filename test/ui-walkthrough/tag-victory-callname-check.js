'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/ui-walkthrough/tag-victory-callname-check.js — タッグ観戦の決着画面の呼び名(手動実行)
//
//  K-14(2026-09-25): 決着画面の勝者セリフ {partner} は呼び名(基本は名字、話し手→相手の絆85以上で下の名前)。
//  UI 走破(test:ui:walkthrough)は観戦 iframe に入らないので、観戦画面 tag-battle.html を実ブラウザで動かして確かめる。
//    1) 実試合1本を最後まで再生して決着画面を出す(JA/EN)。例外なし・{partner} が生で出ない・フルネームが出ない
//    2) 親(app.js)と同じ tagMatchCallNames で作った呼び名を、絆60(名字)と絆90(下の名前)の2通りで渡し、
//       名前入りの行を引かせて、吹き出しに名字/下の名前が出ることを JA/EN で確かめる
//    3) 最長の行(日本語49字・英語88字、呼び名はシュタインフェルト/Banyubashi)を吹き出しへ入れ、
//       PC(1280)とスマホ(375)で横にはみ出さないこと・吹き出しが画面内に収まることを測る
//  スクリーンショットと result.json は test/ui-walkthrough/artifacts/tag-victory-callname/(Git管理外)。
//
//  使い方: node test/ui-walkthrough/tag-victory-callname-check.js
// ══════════════════════════════════════════════════════════════════════════════
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const { startStaticServer } = require(path.join(ROOT, 'test/ui-walkthrough/server.js'));
const OUT = path.join(ROOT, 'test/ui-walkthrough/artifacts/tag-victory-callname');
const JA_RE = /[぀-ヿ㐀-鿿]/;

// ── node 側: 実エンジン+実 i18n で試合と呼び名を作る ─────────────────────────
const sandbox = { console, Math: Object.create(Math), JSON, IS_TRIAL: false };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
let rs = 20260925 >>> 0;
sandbox.Math.random = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; };
const run = (f, transform) => {
  let code = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
  if (transform) {
    code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
    code = code.replace(/^(const|let) /gm, 'var ');
  }
  new vm.Script(code, { filename: f }).runInContext(sandbox);
};
['i18n.js', 'lang-en.js', 'lang-en-names.js', 'lang-en-dialogue.js'].forEach(f => run(f, false));
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js', 'relationships.js', 'tag-battle-lines.js'].forEach(f => run(f, true));
const UI = fs.readFileSync(path.join(ROOT, 'src/ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const grab = (name) => { const at = UI.indexOf(`function ${name}(`); return UI.slice(at, UI.indexOf('\n}\n', at) + 2); };
new vm.Script(grab('callNameText') + '\n' + grab('tagMatchCallNames'), { filename: 'ui-common.js#callNames' }).runInContext(sandbox);
const X = (c) => vm.runInContext(c, sandbox);
const I = X('WM_I18N');
const ALL = X('ALL_CHARS');

const team = [1, 2, 3, 4].map(id => ({ ...ALL.find(c => c.id === id) }));
function makeTagPayload() {
  for (let i = 0; i < 600; i++) {
    const rng = X('Engine').rng.create(X('Engine').rng.derive(20260925, 'k14tag', i));
    const res = X('Engine').tagMatch.simulateTagMatch({ fighter1: team[0], fighter2: team[1] }, { fighter1: team[2], fighter2: team[3] }, rng, { recordFrames: true });
    if ((res.winner === 'A' || res.winner === 'B' || res.winner === 'teamA' || res.winner === 'teamB' || res.winner === 'left' || res.winner === 'right') && res.finMove) return res;
  }
  throw new Error('tag payload生成に失敗');
}
const result = makeTagPayload();
const callNamesFor = (lang, bond) => {
  I.setLang(lang);
  const rels = {};
  [[1, 2], [2, 1], [3, 4], [4, 3]].forEach(([a, b]) => { rels[`${a}>${b}`] = { bond, rivalry: 0 }; });
  const out = JSON.parse(JSON.stringify(X('tagMatchCallNames')({ fighter1: team[0], fighter2: team[1] }, { fighter1: team[2], fighter2: team[3] }, { relationships: rels })));
  I.setLang('ja');
  return out;
};
const prof = (f) => ({ ...f, portraitUrl: '', profile: '' });
const msgFor = (callNames) => ({
  type: 'START_TAG_MATCH',
  teamA: { fighter1: prof(team[0]), fighter2: prof(team[1]) },
  teamB: { fighter1: prof(team[2]), fighter2: prof(team[3]) },
  result,
  matchInfo: { header: 'K-14 CHECK', matchNum: 1, totalMatches: 1, sfxMasterVol: 0, bgmMasterVol: 0, chemA: result.chemA, chemB: result.chemB, callNames },
});

// 最長の行(下書き §6): 表の全行に最長の呼び名を入れて一番長いもの
const WIN = X('TAG_MATCH_WIN_LINES');
const allLines = [].concat(...Object.values(WIN).map(byP => [].concat(...Object.values(byP))));
const longestJa = allLines.map(l => l.replace('{partner}', 'シュタインフェルト')).sort((a, b) => b.length - a.length)[0];
I.setLang('en');
const longestEn = allLines.map(l => I.t(l).replace('{partner}', 'Banyubashi')).sort((a, b) => b.length - a.length)[0];
I.setLang('ja');

// ── ブラウザ側 ─────────────────────────────────────────────────────────
// 1) 自然に最後まで再生(spectator-move-i18n-check.js と同じ進め方)
const DRIVE = `(payload) => new Promise((resolve) => {
  window.postMessage(payload, '*');
  let n = 0;
  const tick = () => {
    n++;
    const ov = document.getElementById('victoryOv');
    const vl = document.getElementById('vicLines');
    if (ov && vl && vl.textContent.trim() && (ov.classList.contains('show') || ov.classList.contains('active') || getComputedStyle(ov).display !== 'none')) {
      resolve({ ok: true, steps: n, fallback: !!window.__k14Fallback, line: (vl.querySelector('.vic-win-line') || {}).textContent || '', speaker: (vl.querySelector('.vic-speaker-label') || {}).textContent || '' });
      return;
    }
    if (n > 4000) {
      const fov = document.getElementById('finishOverlay');
      resolve({ ok: false, steps: n, line: '', speaker: '', diag: { frameIdx: S.frameIdx, frames: S.frames.length, pinCtrl: !!S.pinCtrl, pendingCutin: S.pendingCutin,
        ovClass: ov && ov.className, finishOv: fov && fov.className, pendingDamage: S.pendingDamage, anim: S.anim } });
      return;
    }
    try { if (S.pendingCutin && typeof dismissCutin === 'function') { dismissCutin(); setTimeout(tick, 5); return; } } catch (e) {}
    // 全フレームを再生しても決着画面が出ない(ピン演出のクリック待ち等)ときは、実画面と同じ締め
    // (_finishPinSeq → showResult、ピン演出が無ければ showResult)を呼ぶ。決着画面の組み立ては本物の経路
    if (S.frameIdx >= S.frames.length && n > 600 && !window.__k14Finished) {
      window.__k14Finished = true;
      window.__k14Fallback = true;
      try { if (S.pinCtrl) _finishPinSeq(); else showResult(S.frames[S.frames.length - 1]); } catch (e) {}
    }
    const fbtn = document.getElementById('finishBtn');
    const fov = document.getElementById('finishOverlay');
    if (fbtn && fov && fov.classList.contains('show') && !fbtn.disabled) fbtn.click();
    else if (S.pinCtrl) { const nb = document.getElementById('nBtn'); if (nb && !nb.disabled) nb.click(); }
    else { try { nextFrame(); } catch (e) {} }
    setTimeout(tick, 5);
  };
  setTimeout(tick, 300);
})`;
// 2) 名前入りの行を引かせて決着画面を出し直す(Math.random を名前入りの行の番号に合わせる)
const FORCE = `(payload) => new Promise((resolve) => {
  window.postMessage(payload, '*');
  setTimeout(() => {
    const rnd = Math.random;
    const lastFr = S.frames[S.frames.length - 1];
    const tries = [];
    for (const r of [0.05, 0.25]) {
      Math.random = () => r;
      try { showResult(lastFr); } catch (e) { tries.push({ err: String(e) }); continue; }
      Math.random = rnd;
      const vl = document.getElementById('vicLines');
      tries.push({ r, line: (vl.querySelector('.vic-win-line') || {}).textContent || '', speaker: (vl.querySelector('.vic-speaker-label') || {}).textContent || '' });
    }
    Math.random = rnd;
    resolve(tries);
  }, 400);
})`;
// 3) 最長の行で吹き出しの収まりを測る
const MEASURE = `(text) => new Promise((resolve) => {
  const vl = document.getElementById('vicLines');
  vl.classList.add('visible');
  const bubble = vl.querySelector('.vic-win-line');
  bubble.textContent = text;
  requestAnimationFrame(() => {
    const b = bubble.getBoundingClientRect();
    const box = document.getElementById('victoryBox').getBoundingClientRect();
    resolve({
      bubble: { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), bottom: Math.round(b.bottom), width: Math.round(b.width), height: Math.round(b.height) },
      box: { left: Math.round(box.left), right: Math.round(box.right) },
      viewport: { w: innerWidth, h: innerHeight },
      bubbleScrollOverflow: bubble.scrollWidth - bubble.clientWidth,
      pageScrollOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      lineCount: Math.round(b.height / parseFloat(getComputedStyle(bubble).lineHeight)),
    });
  });
})`;

async function withPage(browser, server, lang, viewport, fn) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript((l) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', l);
  }, lang);
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`${server.baseUrl}/tag-battle.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const out = await fn(page);
  out.pageErrors = errs;
  await context.close();
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startStaticServer({ projectRoot: ROOT });
  const browser = await chromium.launch({ headless: true });
  const report = {};
  let ng = 0;
  const fail = (m) => { ng++; console.log('  NG: ' + m); };
  try {
    for (const lang of ['ja', 'en']) {
      const surnames = callNamesFor(lang, 60);
      const givens = callNamesFor(lang, 90);
      // 1) 自然再生
      const natural = await withPage(browser, server, lang, { width: 1280, height: 860 }, async (page) => {
        const r = await page.evaluate(({ src, p }) => (0, eval)(src)(p), { src: DRIVE, p: msgFor(surnames) });
        await page.waitForTimeout(2600);
        await page.screenshot({ path: path.join(OUT, `natural-${lang}.png`) });
        return r;
      });
      report[`natural-${lang}`] = natural;
      console.log(`[${lang}] 自然再生: ok=${natural.ok} steps=${natural.steps} 締めの補助=${natural.fallback} 話者=${natural.speaker} 吹き出し=${natural.line}`);
      if (!natural.ok) fail(`[${lang}] 決着画面まで進めなかった ${JSON.stringify(natural.diag)}`);
      if (natural.pageErrors.length) fail(`[${lang}] 例外: ${natural.pageErrors.join(' / ')}`);
      if (/\{partner\}|\{/.test(natural.line)) fail(`[${lang}] プレースホルダが残った: ${natural.line}`);
      team.forEach(t => { if (natural.line.includes(t.name) || (lang === 'en' && natural.line.includes(I.pn(t.name)))) fail(`[${lang}] フルネーム: ${natural.line}`); });
      if (lang === 'en' && JA_RE.test(natural.line)) fail(`[en] 日本語が漏れた: ${natural.line}`);
      // 2) 名字/下の名前の切り替え
      for (const [label, names] of [['名字(絆60)', surnames], ['下の名前(絆90)', givens]]) {
        const tries = await withPage(browser, server, lang, { width: 1280, height: 860 }, async (page) => {
          const t = await page.evaluate(({ src, p }) => (0, eval)(src)(p), { src: FORCE, p: msgFor(names) });
          const named = t.find(x => x.line && Object.values(names).some(v => x.line.includes(v)));
          if (named) await page.evaluate((r) => { const rnd = Math.random; Math.random = () => r; try { showResult(S.frames[S.frames.length - 1]); } finally { Math.random = rnd; } }, named.r);
          await page.waitForTimeout(3200);
          await page.screenshot({ path: path.join(OUT, `named-${lang}-${label.startsWith('名字') ? 'surname' : 'given'}.png`) });
          return { tries: t };
        });
        const values = Object.values(names);
        const hit = tries.tries.find(t => t.line && values.some(v => t.line.includes(v)));
        report[`named-${lang}-${label}`] = { names, tries: tries.tries, pageErrors: tries.pageErrors };
        console.log(`[${lang}] ${label}: 呼び名表=${JSON.stringify(names)}`);
        tries.tries.forEach(t => console.log(`    話者=${t.speaker} 吹き出し=${t.line || t.err}`));
        if (!hit) fail(`[${lang}] ${label}: 名前入りの行に呼び名が出なかった`);
        else {
          const speakerId = team.find(t => (lang === 'en' ? I.pn(t.name) : t.name) === hit.speaker.trim());
          if (speakerId) {
            const partner = speakerId.id % 2 === 1 ? speakerId.id + 1 : speakerId.id - 1;
            const want = names[`${speakerId.id}:${partner}`];
            if (!hit.line.includes(want)) fail(`[${lang}] ${label}: 話者→パートナーの呼び名 "${want}" ではない: ${hit.line}`);
          }
        }
        if (tries.pageErrors.length) fail(`[${lang}] ${label}: 例外 ${tries.pageErrors.join(' / ')}`);
      }
      // 3) 最長の行の収まり(PC/スマホ)
      for (const [vpLabel, vp] of [['pc', { width: 1280, height: 860 }], ['phone', { width: 375, height: 812 }]]) {
        const text = lang === 'en' ? longestEn : `「${longestJa}」`;
        const m = await withPage(browser, server, lang, vp, async (page) => {
          await page.evaluate(({ src, p }) => (0, eval)(src)(p), { src: FORCE, p: msgFor(surnames) });
          await page.waitForTimeout(3200);
          const r = await page.evaluate(({ src, t }) => (0, eval)(src)(t), { src: MEASURE, t: text });
          await page.screenshot({ path: path.join(OUT, `longest-${lang}-${vpLabel}.png`) });
          return r;
        });
        report[`longest-${lang}-${vpLabel}`] = { text, ...m };
        console.log(`[${lang}] 最長(${text.length}字) ${vpLabel}: 幅${m.bubble.width}px 高さ${m.bubble.height}px 約${m.lineCount}行 bubble横溢れ=${m.bubbleScrollOverflow} ページ横溢れ=${m.pageScrollOverflow}`);
        if (m.bubbleScrollOverflow > 0) fail(`[${lang}] ${vpLabel}: 吹き出しの中で横にはみ出す`);
        if (m.pageScrollOverflow > 0) fail(`[${lang}] ${vpLabel}: ページが横にはみ出す`);
        if (m.bubble.left < 0 || m.bubble.right > m.viewport.w) fail(`[${lang}] ${vpLabel}: 吹き出しが画面の外にはみ出す`);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n最長の行: JA「${longestJa}」(${longestJa.length}字) / EN "${longestEn}"(${longestEn.length}字)`);
  console.log(ng ? `tag-victory-callname-check: NG ${ng}件` : 'tag-victory-callname-check: OK');
  process.exit(ng ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
