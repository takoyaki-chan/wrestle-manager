#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  旗揚げ序章オーバーレイ(renderOpeningScreen)の i18n 受け入れ確認(手動実行)。
//  run-all は *-test.js しか拾わないので自動テストには入らない。
//
//  P7-31 で新設。**走破ハーネスは序章を構造的に踏めない** ため、実関数を直接叩く
//  (§37-4 のカットイン検査と同じ流儀):
//    - walk/ignite の fixture はいずれも `weekPhase:'manage'`(S1W1・draftComplete)の
//      オートセーブから起動する。序章は「タイトル→新規ゲーム→団体名入力」の後の
//      `weekPhase:'opening'` でしか描画されないので、走破のどのモードでも到達しない
//    - 仮に到達しても `scanJaExposureDetail()` / `readPageSnapshot()` の JA 露出計測は
//      **子要素を持たないリーフ要素だけ**を見るため、`<br>` や `<span>` を含む
//      `.opening-act-line` は走査対象から外れる(幕1〜4すべてが該当)
//
//  検査内容:
//    (1) JA: 幕1〜4の描画HTMLが基準(このファイル内のフローズン)と**空白正規化後に一致**する
//    (2) EN: 幕1〜4の可視テキストに日本語が1文字も残らない
//    (3) EN: 序章の描画中に [i18n-miss] が1件も出ない
//    (4) `orgLengthClass` の言語別閾値: 同じ意味の団体名でJA/ENが同じ段(通常/medium/long)
//        に落ち、`.opening-org-line` が `.opening-act` の内寸を超えない
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const { startStaticServer } = require(path.join(ROOT, 'test/ui-walkthrough/server.js'));
const FIXTURE = path.join(ROOT, 'test/ui-walkthrough/fixtures/season-1-week-1-seed42.json');

// 幕1のみ団体名が入るため、JA基準は団体名を固定して採る
const ORG_JA = 'クイーンズゲート';
// 段の境界検査に使う団体名(JA文字数 / EN文字数)
// 段の境界検査に使う団体名。JA/EN は「同じくらいの実描画幅になる名前」を選んである
// (JA 約32px/字・EN 約16.5px/字 @28px。実測は P7-31 worklog)
const ORG_TIER_CASES = [
  { label: 'normal', ja: '紅蓮', en: 'Ember' },
  { label: 'medium', ja: 'クイーンズゲート幕張ス', en: 'Queens Gate Makuhari' },
  { label: 'long', ja: 'クイーンズゲート・プロレスリング', en: 'Queens Gate Pro Wrestling Japan' },
];

const JAPANESE_CHAR = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/;

async function openPage(browser, server, lang) {
  const context = await browser.newContext({ locale: 'ja-JP', reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleLines = [];
  page.on('console', (msg) => consoleLines.push(msg.text()));
  await page.addInitScript(({ save, uiLang }) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', uiLang);
    localStorage.setItem('wrestle_manager_autosave', save);
  }, { save: fs.readFileSync(FIXTURE, 'utf8'), uiLang: lang });
  await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction("typeof G !== 'undefined' && G && G.roster && typeof renderOpeningScreen === 'function'", null, { timeout: 20000 });
  return { context, page, consoleLines };
}

// 序章を実関数で描画し、幕1〜4のHTML・可視テキスト・団体名行の実寸を採る
async function captureOpening(page, orgName) {
  return page.evaluate((org) => {
    G.orgName = org;
    G.weekPhase = 'opening';
    renderOpeningScreen();
    const acts = [];
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById(`openingAct${i}`);
      // rendered = ブラウザが実際に見せる行(innerText は <br>/ブロックを改行にし、
      // 折りたためる空白を1個に正規化する)。JA同一性はこの「見えている文字」で測る。
      // **幕2〜4は display:none のまま** だと innerText が textContent へ落ちて
      // <br> が消えるので、計測の間だけ表示に戻す(P7-31 で踏んだ罠)。
      if (!el) { acts.push(null); continue; }
      const saved = el.style.display;
      el.style.display = '';
      const rendered = (el.innerText || '').split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | ');
      const html = el.innerHTML;
      el.style.display = saved;
      acts.push({ html, rendered });
    }
    // .opening-org-line は display:block + nowrap なので scrollWidth は親の幅を返す。
    // 文字の実幅は Range で測る
    const orgLine = document.querySelector('.opening-org-line');
    let measure = null;
    if (orgLine) {
      const range = document.createRange();
      range.selectNodeContents(orgLine);
      measure = {
        cls: orgLine.className,
        textWidth: Math.round(range.getBoundingClientRect().width),
        // .opening-act は max-width:720px + padding:40px。内寸はこの設計上限で見る
        limitWidth: 720 - 80,
      };
    }
    return { acts, measure };
  }, orgName);
}

// ── JA 基準(P7-31 の**実装前**に実ブラウザで採取した「見えている行」)────────
//    行区切りは ' | '。ソースの改行・字下げは HTML で畳まれるので基準に入れない
//    (テンプレ化で字下げは動くが、見える文字と <br> の位置は 1バイトも変えない)。
//    幕3は設立2名の名前が実行のたびに変わるので形だけ検査する。
const JA_RENDERED_BASELINE = [
  '今、ひとつの団体が旗を揚げようとしている。 | 団体の名は | 「クイーンズゲート」。',
  '後ろ盾があるわけではない。 | 期待されているわけでもない。 | いつまで経営が続くかわからない弱小団体。 | 業界へ爪痕を残すことはできるだろうか。',
  null,
  'さらに3名。 | 立ち上げメンバーを選びに行こう。',
];
const JA_ACT3_SHAPE = /^(.+) \| (.+) \| 新団体旗揚げの噂を聞きつけ、集まったのは2名。 \| \1と\2。 \| 彼女たちと共に、ここから業界への挑戦が始まる。$/;

async function main() {
  const capture = process.argv.includes('--capture');
  const server = await startStaticServer();
  const browser = await chromium.launch();
  const failures = [];
  const notes = [];
  try {
    // ── JA ────────────────────────────────────────────────────────────────
    const ja = await openPage(browser, server, 'ja');
    const jaShot = await captureOpening(ja.page, ORG_JA);
    if (capture) {
      console.log(JSON.stringify(jaShot, null, 2));
    } else {
      for (let i = 0; i < 4; i++) {
        const got = jaShot.acts[i]?.rendered || '';
        notes.push(`JA act${i + 1}: ${got}`);
        if (JA_RENDERED_BASELINE[i] != null && got !== JA_RENDERED_BASELINE[i]) {
          failures.push(`JA act${i + 1} rendered mismatch\n  expected: ${JA_RENDERED_BASELINE[i]}\n  actual  : ${got}`);
        }
      }
      // 幕3は設立2名の名前が実行ごとに変わるので、名前を後方参照で束ねて形だけ検査する
      const act3 = jaShot.acts[2]?.rendered || '';
      if (!JA_ACT3_SHAPE.test(act3)) failures.push(`JA act3 rendered shape mismatch: ${act3}`);
    }
    const jaTiers = [];
    for (const c of ORG_TIER_CASES) jaTiers.push(await captureOpening(ja.page, c.ja));
    await ja.context.close();

    // ── EN ────────────────────────────────────────────────────────────────
    const en = await openPage(browser, server, 'en');
    const enShot = await captureOpening(en.page, 'Queens Gate');
    for (let i = 0; i < 4; i++) {
      const text = enShot.acts[i]?.rendered || '';
      if (JAPANESE_CHAR.test(text)) failures.push(`EN act${i + 1} still contains Japanese: ${text}`);
      notes.push(`EN act${i + 1}: ${text}`);
    }
    const enTiers = [];
    for (const c of ORG_TIER_CASES) enTiers.push(await captureOpening(en.page, c.en));
    const misses = en.consoleLines.filter(l => l.includes('[i18n-miss]'));
    if (misses.length) failures.push(`EN i18n-miss ${misses.length}: ${misses.slice(0, 5).join(' / ')}`);
    await en.context.close();

    // ── 団体名行の段と実寸 ────────────────────────────────────────────────
    for (let i = 0; i < ORG_TIER_CASES.length; i++) {
      const c = ORG_TIER_CASES[i];
      const j = jaTiers[i].measure;
      const e = enTiers[i].measure;
      const jTier = (j.cls.match(/is-(medium|long)/) || [null, 'normal'])[1];
      const eTier = (e.cls.match(/is-(medium|long)/) || [null, 'normal'])[1];
      notes.push(`org tier [${c.label}] JA "${c.ja}"(${c.ja.length}) -> ${jTier} w=${j.textWidth}px / EN "${c.en}"(${c.en.length}) -> ${eTier} w=${e.textWidth}px (limit ${e.limitWidth}px)`);
      if (jTier !== eTier) failures.push(`org tier mismatch [${c.label}]: JA=${jTier} EN=${eTier}`);
      if (e.textWidth > e.limitWidth) failures.push(`EN org line overflows [${c.label}]: ${e.textWidth}px > ${e.limitWidth}px`);
      if (j.textWidth > j.limitWidth) failures.push(`JA org line overflows [${c.label}]: ${j.textWidth}px > ${j.limitWidth}px`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (capture) return;
  notes.forEach(n => console.log(`  ${n}`));
  if (failures.length) {
    console.error('\nopening-scene-i18n-check: FAILURES');
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }
  console.log('\nopening-scene-i18n-check: ALL CHECKS PASS');
}

main().catch((error) => { console.error(error); process.exit(1); });
