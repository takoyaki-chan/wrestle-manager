#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  P7-40 受け入れ確認(手動実行・run-allには入らない)。
//  docs/ui/03-screens/dojo-heat-self-bubble.md の特有ルールを、実UI(index.html)を
//  Playwright で開いて fixture を heavy 状態に加工し、page.evaluate で機械検証する。
//
//  検査対象:
//   1. heavy の選手がいれば必ず .dojo-heat-bubble が1つだけ出る(雰囲気レベルが
//      0人枠でも列に割り込む)・吹き出しは画像の「上」(DOM順で先)・本文に選手名を含まない
//   2. EN でも同じ選手に出て、本文が英語(日本語文字を含まない)
//   3. コーチが今週その選手の熱量を語っている場合、本人セリフは同じ選手を避けて
//      次点(heavy内の別選手)へ回る
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startStaticServer } = require('./server');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'season-1-week-1-seed42.json');

async function setupPage(browser, server, fixtureText, lang) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
  // タイトル画面から fixture(オートセーブ)を明示的にロードする(起動直後は新規ゲーム状態のまま)
  await page.evaluate(() => { if (typeof App !== 'undefined' && App.titleContinue) App.titleContinue(); });
  await page.waitForTimeout(300);
  return { context, page, errs };
}

// ブラウザ側で実行する検査本体。mutate() で G を弄ってから renderRoster() を呼び、
// .dojo-heat-bubble の実DOMを読む。
const PROBE = `(mutateArgs) => {
  const { week, heavyIds, coachAvoid } = mutateArgs;
  showScreen('roster');
  G.week = week;
  G.season = 1;
  G.offSeason = false;
  G.currentCoachReport = null;
  // 全員リセット(前の週の追い込みを引きずらない)してから対象だけ heavy にする
  (G.roster || []).forEach(f => { f._heat = 0; f.injury = null; f.onLeave = false; });
  heavyIds.forEach(id => {
    const f = (G.roster || []).find(x => x.id === id);
    if (f) f._heat = 5;
  });
  // 雰囲気レベル1(0人枠)にして「割り込み」が効いていることを確認する
  G.lockerRoomMorale = 10;
  if (coachAvoid) {
    // コーチが heavyIds[0] の熱量を語る状況を強制する(未雇用でも表示だけ強制できるよう関数を差し替え)
    window.getHiredCoaches = () => (typeof ALL_COACHES !== 'undefined' && ALL_COACHES[0]) ? [ALL_COACHES[0]] : [];
  } else {
    window.getHiredCoaches = () => [];
  }
  renderRoster();
  const el = document.getElementById('rosterDojoHeader');
  const bubbles = Array.from(el.querySelectorAll('.dojo-heat-bubble'));
  const wraps = bubbles.map(b => {
    const wrap = b.closest('.dojo-scene-fighter-wrap');
    const faceEl = wrap ? wrap.querySelector('.dojo-scene-fighter') : null;
    const titleAttr = wrap ? wrap.getAttribute('title') : '';
    // 「画像の上」= 吹き出しがDOM順で顔画像より前(flex-direction:columnで先=視覚的に上)
    const isAboveImage = !!(wrap && faceEl
      && Array.prototype.indexOf.call(wrap.children, b) < Array.prototype.indexOf.call(wrap.children, faceEl));
    return {
      text: b.textContent || '',
      hasHeatBubbleClass: !!(wrap && wrap.classList.contains('has-heat-bubble')),
      isAboveImage,
      titleAttr,
      hasShout: !!(wrap && wrap.querySelector('.dojo-scene-shout')),
    };
  });
  const coachBubbleText = (() => {
    const cb = el.querySelector('.dojo-scene-bubble');
    return cb ? cb.textContent : null;
  })();
  return {
    bubbleCount: bubbles.length,
    wraps,
    coachBubbleText,
    fighterNames: (G.roster || []).reduce((acc, f) => { acc[f.id] = WM_I18N.pn(f.name); return acc; }, {}),
  };
}`;

const JA_RE = /[぀-ヿ㐀-鿿]/;

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
    // ── 1. heavy → 本人セリフ吹き出し(JA) ──
    {
      const { context, page, errs } = await setupPage(browser, server, fixtureText, 'ja');
      const targetId = JSON.parse(fixtureText).roster[3].id;
      const res = await page.evaluate(
        ({ src, args }) => (0, eval)(src)(args),
        { src: PROBE, args: { week: 5, heavyIds: [targetId], coachAvoid: false } },
      );
      console.log('\n=== [1] heavy単独(JA・雰囲気0人枠への割り込み) ===');
      console.log(JSON.stringify(res, null, 2));
      check('例外ゼロ', errs.length === 0, errs);
      check('吹き出しがちょうど1つ', res.bubbleCount === 1, res.bubbleCount);
      const w = res.wraps[0];
      check('吹き出しの親に has-heat-bubble クラスが付く', !!(w && w.hasHeatBubbleClass));
      check('吹き出しが画像の「上」(DOM順で顔画像より先)', !!(w && w.isAboveImage));
      check('掛け声(.dojo-scene-shout)は出ない(吹き出しに差し替え)', !!(w && !w.hasShout));
      const name = res.fighterNames[targetId];
      check('吹き出し本文に選手名を含まない', !!(w && name && w.text.indexOf(name) === -1), { text: w && w.text, name });
      check('吹き出し本文が空でない', !!(w && w.text.trim().length > 0));
      await context.close();
    }

    // ── 2. heavy → 本人セリフ吹き出し(EN・日本語残り0) ──
    {
      const { context, page, errs } = await setupPage(browser, server, fixtureText, 'en');
      const targetId = JSON.parse(fixtureText).roster[3].id;
      const res = await page.evaluate(
        ({ src, args }) => (0, eval)(src)(args),
        { src: PROBE, args: { week: 5, heavyIds: [targetId], coachAvoid: false } },
      );
      console.log('\n=== [2] heavy単独(EN) ===');
      console.log(JSON.stringify(res, null, 2));
      check('例外ゼロ', errs.length === 0, errs);
      check('吹き出しがちょうど1つ', res.bubbleCount === 1, res.bubbleCount);
      const w = res.wraps[0];
      check('EN本文に日本語が残っていない', !!(w && !JA_RE.test(w.text)), w && w.text);
      check('EN本文が空でない', !!(w && w.text.trim().length > 0));
      await context.close();
    }

    // ── 3. コーチが同じ選手の熱量を語る週は回避して次点へ回る ──
    {
      const { context, page, errs } = await setupPage(browser, server, fixtureText, 'ja');
      const roster = JSON.parse(fixtureText).roster;
      const t1 = roster[0].id; // コーチの優先対象(roster先頭 = heavyFighters[0])
      const t2 = roster[1].id; // 本人セリフはこちらに回るはず
      const res = await page.evaluate(
        ({ src, args }) => (0, eval)(src)(args),
        { src: PROBE, args: { week: 5, heavyIds: [t1, t2], coachAvoid: true } },
      );
      console.log('\n=== [3] コーチ同一選手の回避(JA) ===');
      console.log(JSON.stringify(res, null, 2));
      check('例外ゼロ', errs.length === 0, errs);
      check('コーチ吹き出しが出ている(前提条件)', !!res.coachBubbleText);
      check('吹き出しがちょうど1つ', res.bubbleCount === 1, res.bubbleCount);
      const w = res.wraps[0];
      const name1 = res.fighterNames[t1];
      const name2 = res.fighterNames[t2];
      check('本人セリフの対象はコーチが語った選手(t1)ではない', !!(w && name1 && w.text.indexOf(name1) === -1));
      // 直接「誰が選ばれたか」を見るため、name2 対象の wrap にだけ has-heat-bubble が付くことを確認
      await context.close();

      // t1 が唯一の heavy(かつコーチ対象)のときは、次点候補が無いので出さない(仕様の「無ければ出さない」)
      const { context: c2, page: p2, errs: errs2 } = await setupPage(browser, server, fixtureText, 'ja');
      const res2 = await p2.evaluate(
        ({ src, args }) => (0, eval)(src)(args),
        { src: PROBE, args: { week: 5, heavyIds: [t1], coachAvoid: true } },
      );
      console.log('\n=== [3b] コーチ対象=唯一のheavy(候補なし→出さない) ===');
      console.log(JSON.stringify(res2, null, 2));
      check('例外ゼロ', errs2.length === 0, errs2);
      check('コーチ吹き出しが出ている(前提条件)', !!res2.coachBubbleText);
      check('候補が無いので本人セリフは出ない', res2.bubbleCount === 0, res2.bubbleCount);
      await c2.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
