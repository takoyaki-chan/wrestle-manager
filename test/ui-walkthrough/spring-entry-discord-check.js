#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  K-12 追加 受け入れ確認(手動実行・run-allには入らない)。
//  春のタッグリーグの編成画面(第11週)に、通常興行のプレビューと同じ不仲の警告が出ることを
//  実UI(index.html)で確かめる。fixture を第11週・編成期間に加工し、本物のボタン
//  (App.stlOpenEntryModal → 選手カードのクリック → 保存)で操作して DOM を読む。
//
//  検査対象:
//   1. 不仲の2人(逆向きだけ冷えた=低い方9)を選ぶと、下の帯に「⚠ 不仲 9」+
//      「能力-3 / 連携不可 / 団体への信頼が下がる」。色は Cream の赤(--cream-red)。相性の記号は出ない
//   2. 良好な2人に選び直すと警告が消える
//   3. おすすめペアに不仲の組があればチップに「⚠ 不仲」が出る
//   4. EN でも同じ警告が英語で出る(日本語が残らない)
//   5. スマホ幅(375px)で帯が横にはみ出さない
//   6. 保存ボタンまで例外なく進む
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startStaticServer } = require('./server');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'season-1-week-1-seed42.json');
const JA_RE = /[぀-ヿ㐀-鿿]/;

async function setupPage(browser, server, fixtureText, lang, viewport) {
  const context = await browser.newContext({ viewport: viewport || { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.addInitScript(({ save, uiLang }) => {
    localStorage.setItem('wm_audio', JSON.stringify({
      muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0,
    }));
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

// 第11週・編成期間にして、不仲の組(x,y)と良好な組(x,z)を作る。おすすめ1位の組も逆向きだけ冷やす
const SETUP = `() => {
  showScreen('week');
  G.week = Engine.springTagLeague.ENTRY_WEEK;
  G.offSeason = false;
  (G.roster || []).forEach(f => { f.injury = null; f.isRental = false; });
  const ann = Engine.springTagLeague.announce(G);
  G.springTagLeague = { ...ann, announcedSeason: G.season };
  G.springTagPhase = 'entry';
  App._stlIntroSeason = G.season; // 導入シーンは別の検査の領分。直接編成へ
  const el = Engine.springTagLeague._eligible(G.roster);
  const [x, y, z] = el;
  const rel = {};
  rel[Math.min(x.id, y.id) + '>' + Math.max(x.id, y.id)] = { bond: 70, rivalry: 0 };
  rel[Math.max(x.id, y.id) + '>' + Math.min(x.id, y.id)] = { bond: 9, rivalry: 0 };
  rel[Math.min(x.id, z.id) + '>' + Math.max(x.id, z.id)] = { bond: 70, rivalry: 0 };
  rel[Math.max(x.id, z.id) + '>' + Math.min(x.id, z.id)] = { bond: 65, rivalry: 0 };
  G.relationships = rel;
  // おすすめ1位(ケミストリーは従来の片方向で計算されるので、逆向きを冷やしても1位のまま)
  const top = Engine.springTagLeague.getEntryCandidates(G).suggestions[0];
  let chipPair = null;
  if (top && !((top.f1Id === x.id && top.f2Id === y.id) || (top.f1Id === y.id && top.f2Id === x.id))) {
    G.relationships[Math.max(top.f1Id, top.f2Id) + '>' + Math.min(top.f1Id, top.f2Id)] = { bond: 12, rivalry: 0 };
    chipPair = [top.f1Id, top.f2Id];
  }
  App.stlOpenEntryModal();
  return { x: x.id, y: y.id, z: z.id, chipPair, discordBond: Math.round(Engine.showTagMatch.pairBond(G, x.id, y.id)) };
}`;

const READ = `() => {
  const bar = document.querySelector('#mdlACard .stl-summary-bar');
  const warn = bar ? bar.querySelector('.stl-discord-warn') : null;
  const chips = Array.from(document.querySelectorAll('#mdlACard .stl-suggest-chip')).map(c => c.textContent.replace(/\\s+/g, ' ').trim());
  return {
    barText: bar ? bar.textContent.replace(/\\s+/g, ' ').trim() : null,
    warnText: warn ? warn.textContent.replace(/\\s+/g, ' ').trim() : null,
    warnColor: warn ? getComputedStyle(warn).color : null,
    creamRed: getComputedStyle(document.documentElement).getPropertyValue('--cream-red').trim(),
    hasChem: !!(bar && bar.querySelector('.stl-summary-chem')),
    chips,
    barOverflow: bar ? bar.scrollWidth - bar.clientWidth : null,
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}`;

const hexToRgb = hex => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return m ? `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})` : null;
};

async function pick(page, id) {
  await page.click(`#mdlACard [onclick="App.stlPickFighter(${id})"]`);
  await page.waitForTimeout(80);
}

(async () => {
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
      const { context, page, errs } = await setupPage(browser, server, fixtureText, lang);
      const ids = await page.evaluate(src => (0, eval)(src)(), SETUP);
      const effect = lang === 'ja' ? '能力-3 / 連携不可 / 団体への信頼が下がる' : 'Ability -3 / no teamwork / trust in the promotion drops';
      console.log(`\n=== [${lang}] 編成画面 ${JSON.stringify(ids)} ===`);
      check('編成画面が開く', await page.$('#mdlACard .stl-summary-bar') !== null);

      // 1. 不仲の2人
      await pick(page, ids.x);
      await pick(page, ids.y);
      const d = await page.evaluate(src => (0, eval)(src)(), READ);
      console.log(JSON.stringify(d));
      check('不仲の2人: 警告の1行目に低い方の絆', !!(d.warnText && d.warnText.includes(`${ids.discordBond}`) && ids.discordBond === 9), d.warnText);
      check('不仲の2人: 警告の2行目は通常興行のプレビューと同じ文言', !!(d.warnText && d.warnText.includes(effect)), d.warnText);
      check('不仲の2人: 相性の記号の代わりに警告', !d.hasChem);
      check('警告の色は Cream の赤(--cream-red)', d.warnColor === hexToRgb(d.creamRed), { color: d.warnColor, token: d.creamRed });
      if (lang === 'en') check('EN: 警告に日本語が残っていない', !!(d.warnText && !JA_RE.test(d.warnText)), d.warnText);
      else check('JA: 1行目は「⚠ 不仲」', !!(d.warnText && d.warnText.startsWith('⚠ 不仲')), d.warnText);

      // 3. おすすめペアのチップ
      if (ids.chipPair) {
        const chipWarn = d.chips.filter(t => /⚠/.test(t));
        check('おすすめペアの不仲の組のチップに ⚠ が出る', chipWarn.length >= 1, d.chips);
      } else {
        console.log('  --  おすすめ1位が検査用の不仲の組と同じだったのでチップの検査は省略');
      }

      // 2. 良好な2人に選び直す
      await pick(page, ids.y); // y を外す
      await pick(page, ids.z);
      const g = await page.evaluate(src => (0, eval)(src)(), READ);
      console.log(JSON.stringify(g));
      check('良好な2人: 警告が消える', g.warnText === null, g.barText);

      // 6. 不仲の組で保存まで進む
      await pick(page, ids.z);
      await pick(page, ids.y);
      await page.click('#mdlACard .stl-modal-footer .btn');
      await page.waitForTimeout(200);
      const saved = await page.evaluate(({ x, y }) => {
        const t = (G.springTagLeague.teams || []).find(team => team.orgId === 'player' && team.confirmed);
        return { phase: G.springTagPhase, confirmed: !!t, pair: t ? [t.f1Id, t.f2Id] : null, x, y };
      }, ids);
      check('保存ボタンで編成が確定する', saved.confirmed && saved.pair.includes(ids.x) && saved.pair.includes(ids.y), saved);
      check('例外ゼロ', errs.length === 0, errs);
      await context.close();
    }

    // 5. スマホ幅
    {
      const { context, page, errs } = await setupPage(browser, server, fixtureText, 'en', { width: 375, height: 812 });
      const ids = await page.evaluate(src => (0, eval)(src)(), SETUP);
      await pick(page, ids.x);
      await pick(page, ids.y);
      const m = await page.evaluate(src => (0, eval)(src)(), READ);
      console.log('\n=== [375px EN] ===');
      console.log(JSON.stringify(m));
      check('スマホ幅: 警告が出る', !!m.warnText, m.barText);
      check('スマホ幅: 帯が横にはみ出さない', m.barOverflow !== null && m.barOverflow <= 1, m.barOverflow);
      check('スマホ幅: 例外ゼロ', errs.length === 0, errs);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
