#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  総点検 第4回の確認4(2026-09-26 Keisuke 裁定)受け入れ確認(手動実行・run-allには入らない)。
//  40週続いた派閥抗争の「和解させる/続けさせる」の2択(F06_FORCE)を、実UI(index.html)で通す。
//  自然走破ではまず出ない(抗争が40週続く必要がある)ので、合成 fixture を使う:
//    seed 42 の2季目15週(非興行週=「週を処理」が押せる)の headless セーブに、ロスターから4人ずつの
//    抗争中の2派閥(リーダーは各派閥の先頭)と、40週前に始まった抗争ポイントの記録(62 — 41)を置く。
//  週の抽選の派閥イベント(F07 等)がこの週に先に立つと2択は翌週以降に回り、確認したい流れと関係ないので、
//  この確認の間だけ Engine.factions.pickWeeklyEvent を「何も起きない」にする(ほかは本物)。
//
//  通す流れ(本物のボタンを押す):
//   1. 「週を処理」→ 週次処理 → 2択の報告カード(#fevtF06ForceOverlay)が出る
//      - いつものモーダル(.fevt-overlay-office。全画面の暗転 .fevt-overlay-stage ではない)
//      - 両リーダーの吹き出しが画像の上(DOM 順で先)・中身に名前を書かない・PT が 62 / 41
//      - 見出しに「抗争N週目」、残り週数(カウントダウン)は出さない
//   2. A をダブルクリック → 1回だけ効く(対立度 −30 が二重に引かれない)→ 記録が閉じ(F06_RECONCILE)、
//      結果モーダル「抗争の幕引き」→「— 見 届 け る —」で閉じる → 週の画面に戻る・例外ゼロ
//   3. B(別ページ): 記録はそのまま、次の判定は選んだ週から +20週(forceCloseDeferredUntil)。
//      結果モーダル「抗争続行」。エンジンの判定をもう一度通しても2択は出ない
//   4. EN: 同じ報告カードに日本語が残っていない
//
//  使い方: node test/ui-walkthrough/faction-f06-force-check.js
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./server');
const { advanceUntil, toSaveState } = require('./fixtures/headless-sim');

const ROOT = path.resolve(__dirname, '..', '..');

function buildFixture() {
  const G = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 15 && g.weekPhase === 'manage' && !g.offSeason });
  const save = toSaveState(G, 'faction-f06-force-check fixture seed=42 S2W15');
  save.rngSeed = 42;
  return JSON.stringify(save);
}

async function newPage(browser, server, fixtureText, lang) {
  const context = await browser.newContext({ locale: lang === 'en' ? 'en-US' : 'ja-JP', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(`pageerror: ${e && e.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Failed to load resource/.test(text)) return;
    errs.push(`console.error: ${text.slice(0, 300)}`);
  });
  page.on('dialog', d => { errs.push(`dialog: ${d.message().slice(0, 200)}`); d.dismiss().catch(() => {}); });
  await page.addInitScript(({ save, uiLang }) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', uiLang);
    localStorage.setItem('wrestle_manager_autosave', save);
  }, { save: fixtureText, uiLang: lang });
  await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Engine !== 'undefined' && typeof G !== 'undefined', null, { timeout: 30000 });
  await page.evaluate(() => { if (App.titleContinue) App.titleContinue(); });
  await page.waitForTimeout(400);
  return { context, page, errs };
}

// 合成の抗争を置く(ページの中で。G は app.js のトップレベル let)
const SETUP = `() => {
  Engine.factions.pickWeeklyEvent = () => ({ eventId: null });
  const own = (G.roster || []).filter(c => !c.isRental && !c.injury);
  const ids = own.slice(0, 8).map(c => c.id);
  // 派閥名は本物と同じ「{名字}派」(ALL_CHARS の surname)
  const surname = (id) => { const c = G.roster.find(x => x.id === id); return String(c.surname || String(c.name).split(/[\\s　]+/)[0]); };
  const nowAbs = Engine.util.absWeekTotal(G.season, G.week, G.offSeason, G.offWeek);
  const start = nowAbs - 40;
  const se = Math.floor((start - 1) / 52) + 1;
  const mk = (id, lead, members) => ({ id, name: surname(lead) + '派', leaderId: lead, memberIds: members, status: 'active', type: 'rivalrous', momentum: 10, archetypeId: 'COMBAT', flavor: 'combat', createdSeason: 1, createdWeek: 1 });
  G.factions = [mk(1, ids[0], ids.slice(0, 4)), mk(2, ids[4], ids.slice(4, 8))];
  G.factionHostility = { '1>2': 60, '2>1': 55 };
  G.factionRivalryPoints = { '1-2': { factionAId: 1, factionBId: 2, pointsA: 62, pointsB: 41, startedSeason: se, startedWeek: start - (se - 1) * 52, lastUpdatedSeason: G.season, lastUpdatedWeek: G.week, naturalCalmStreak: 0 } };
  G.factionInternalPoints = {};
  G.factionTimeline = [];
  delete G._pendingFactionEvent;
  delete G._pendingF09;
  delete G._pendingInternalChallenge;
  showScreen('week');
  return { leaderA: G.roster.find(c => c.id === ids[0]).name, leaderB: G.roster.find(c => c.id === ids[4]).name, week: G.week };
}`;

const READ_MODAL = `() => {
  const o = document.getElementById('fevtF06ForceOverlay');
  if (!o) return null;
  const txt = el => el ? el.textContent.replace(/\\s+/g, ' ').trim() : '';
  const sides = Array.from(o.querySelectorAll('.fevt-subject-duel .u3b-side')).map(side => {
    const kids = Array.from(side.children);
    const slot = side.querySelector('.u3b-bubble-slot');
    const upper = side.querySelector('.u3b-upper');
    return {
      bubble: txt(side.querySelector('.u3b-bubble-text')),
      bubbleBeforeImage: !!slot && !!upper && kids.indexOf(slot) >= 0 && kids.indexOf(slot) < kids.indexOf(upper),
      name: txt(side.querySelector('.u3b-name')),
      stat: txt(side.querySelector('.u3b-stat')),
    };
  });
  return {
    active: o.classList.contains('active'),
    office: o.classList.contains('fevt-overlay-office'),
    stage: !!document.querySelector('.fevt-overlay-stage.active'),
    title: txt(o.querySelector('.fevt-report-title')),
    meta: txt(o.querySelector('.fevt-report-meta')),
    cards: Array.from(o.querySelectorAll('.fevt-decision-card')).map(c => c.dataset.choice),
    all: txt(o),
    sides,
  };
}`;

async function waitFor(page, predSrc, timeout = 10000) {
  try {
    await page.waitForFunction(src => { try { return !!(0, eval)(src)(); } catch (_e) { return false; } }, predSrc, { timeout, polling: 100 });
    return true;
  } catch (_e) { return false; }
}

// 2択の報告カード以外に出ているポップアップを1枚閉じる(週次処理の通知など)
async function closeOther(page) {
  const target = await page.evaluate(() => {
    const vis = el => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const pick = (sel) => Array.from(document.querySelectorAll(sel)).find(el => vis(el) && !el.closest('#fevtF06ForceOverlay')) || null;
    document.querySelectorAll('[data-check-close]').forEach(el => el.removeAttribute('data-check-close'));
    const btn = pick('.mdl-c-footer-btn') || pick('#mdlDOverlay .mdl-d-btn') || pick('.fevt-continue-btn')
      || pick('#mdlAOverlay.active .mdl-a-decision-card') || pick('#mdlAOverlay.active .mdl-a-continue-btn:not([disabled])');
    if (!btn) return null;
    btn.setAttribute('data-check-close', '1');
    const box = btn.closest('[id]');
    return (box ? box.textContent : btn.textContent).replace(/\s+/g, ' ').trim().slice(0, 80);
  });
  if (!target) return null;
  await page.click('[data-check-close="1"]');
  await page.waitForTimeout(350);
  return target;
}

async function openForceModal(page, check) {
  const setup = await page.evaluate(src => (0, eval)(src)(), SETUP);
  const adv = await page.$('[data-walk-role="advance-week"]');
  check('「週を処理」が押せる(非興行週)', !!adv && await adv.isVisible());
  if (!adv) return null;
  await adv.click();
  const openSrc = `() => { const o = document.getElementById('fevtF06ForceOverlay'); return o && o.classList.contains('active'); }`;
  let opened = false;
  const others = [];
  for (let i = 0; i < 12 && !opened; i++) {
    opened = await waitFor(page, openSrc, 2500);
    if (opened) break;
    const closed = await closeOther(page);
    if (closed) others.push(closed);
  }
  if (others.length) console.log(`  (2択の前に閉じたもの: ${JSON.stringify(others)})`);
  check('週次処理のあとに2択の報告カードが出る', opened);
  await page.waitForTimeout(1800); // カードのフェードイン(最長 1600ms)を待つ
  return { setup, modal: opened ? await page.evaluate(src => (0, eval)(src)(), READ_MODAL) : null };
}

async function jaCase(browser, server, fixtureText, check, choice) {
  const { context, page, errs } = await newPage(browser, server, fixtureText, 'ja');
  try {
    const got = await openForceModal(page, check);
    if (!got || !got.modal) { check('例外ゼロ', errs.length === 0, errs); return; }
    const { setup, modal } = got;
    console.log(`  リーダー: ${setup.leaderA}(62) / ${setup.leaderB}(41)・${setup.week}週`);
    if (choice === 'A') {
      check('いつものモーダル(Office の報告カード。全画面の暗転ではない)', modal.office && !modal.stage, modal);
      check('見出しは「⏳ 長引く抗争」、「抗争N週目」を出す', modal.title.includes('長引く抗争') && /抗争\d+週目/.test(modal.meta), { title: modal.title, meta: modal.meta });
      check('残り週数(カウントダウン)は出さない', !/残り|あと\d+週|\+20/.test(modal.all), modal.all.slice(0, 300));
      check('選択肢は A/B の2つ', JSON.stringify(modal.cards) === '["A","B"]', modal.cards);
      check('両リーダーが並ぶ', modal.sides.length === 2, modal.sides);
      check('両リーダーとも吹き出しで一言(画像の上)', modal.sides.every(s => s.bubble && s.bubbleBeforeImage), modal.sides);
      check('吹き出しの中に名前を書かない', modal.sides.every(s => !s.bubble.includes(s.name.split(/\s/)[0])), modal.sides);
      check('PT は 62 / 41', /62/.test(modal.sides[0].stat) && /41/.test(modal.sides[1].stat), modal.sides.map(s => s.stat));
      check('先行側と追う側で一言が違う表から出る', modal.sides[0].bubble !== modal.sides[1].bubble, modal.sides.map(s => s.bubble));
    }
    const before = await page.evaluate(() => ({ h12: G.factionHostility['1>2'], h21: G.factionHostility['2>1'], pending: !!G._pendingFactionEvent }));
    check('2択を出した時点で派閥イベントは G から外れている(二重に出ない)', !before.pending, before);
    const sel = `#fevtF06ForceOverlay .fevt-decision-card[data-choice="${choice}"]`;
    if (choice === 'A') await page.dblclick(sel); // 二度押ししても1回だけ効く
    else await page.click(sel);
    const resultSrc = `() => { const o = document.getElementById('mdlAOverlay'); return o && o.classList.contains('active') && o.textContent.includes(${JSON.stringify(choice === 'A' ? '抗争の幕引き' : '抗争続行')}); }`;
    const result = await waitFor(page, resultSrc, 5000);
    check(`結果モーダル「${choice === 'A' ? '抗争の幕引き' : '抗争続行'}」が出る`, result);
    const st = await page.evaluate(() => {
      const e = (G.factionRivalryPoints || {})['1-2'] || null;
      const tl = (G.factionTimeline || []).filter(t => t.type === 'RIVALRY_CLOSED');
      return {
        entry: e, h12: G.factionHostility['1>2'], h21: G.factionHostility['2>1'],
        closed: tl.map(t => t.reason), nowAbs: Engine.util.absWeekTotal(G.season, G.week, G.offSeason, G.offWeek),
        pending: G._pendingFactionEvent ? G._pendingFactionEvent.eventId : null,
        again: (() => { const c = JSON.parse(JSON.stringify(G)); const r = Engine.factions.checkRivalryResolution(c, null); return r && r.forceClose ? r.forceClose.pairKey : null; })(),
      };
    });
    if (choice === 'A') {
      check('記録が閉じる(RIVALRY_CLOSED / F06_RECONCILE)', !st.entry && st.closed.length === 1 && st.closed[0] === 'F06_RECONCILE', st);
      check('対立度は両方向とも −30 が1回だけ(二度押しで二重に引かれない)', st.h12 === before.h12 - 30 && st.h21 === before.h21 - 30, { before, after: { h12: st.h12, h21: st.h21 } });
    } else {
      check('記録とポイントはそのまま', !!st.entry && st.entry.pointsA === 62 && st.entry.pointsB === 41 && st.closed.length === 0, st);
      check('次の判定は選んだ週から +20週', !!st.entry && st.entry.forceCloseDeferredUntil === st.nowAbs + 20, { entry: st.entry, nowAbs: st.nowAbs });
      check('対立度は動かない', st.h12 === before.h12 && st.h21 === before.h21, { before, st });
    }
    check('選んだあと、エンジンの判定をもう一度通しても2択は出ない', st.again === null, st.again);
    check('派閥イベントは残っていない', st.pending === null, st.pending);
    if (result) {
      await page.click('#fevtResultClose');
      await page.waitForTimeout(500);
    }
    const back = await page.evaluate(() => ({
      phase: G.weekPhase,
      force: !!(document.getElementById('fevtF06ForceOverlay') && document.getElementById('fevtF06ForceOverlay').classList.contains('active')),
      mdlA: !!(document.getElementById('mdlAOverlay') && document.getElementById('mdlAOverlay').classList.contains('active')),
    }));
    check('結果を閉じると週の画面に戻る(モーダルが残らない)', back.phase === 'manage' && !back.force && !back.mdlA, back);
    check('例外ゼロ', errs.length === 0, errs);
  } finally {
    await context.close();
  }
}

async function enCase(browser, server, fixtureText, check) {
  const { context, page, errs } = await newPage(browser, server, fixtureText, 'en');
  try {
    const got = await openForceModal(page, check);
    if (!got || !got.modal) return;
    // 区切りの「・」(U+30FB)は EN でも使う既存の約物なので除く
    const JP = /[぀-ヺー-ヿ㐀-鿿]+/g;
    const jp = got.modal.all.match(JP) || [];
    check('EN: 報告カードに日本語が残っていない', jp.length === 0, { jp, text: got.modal.all.slice(0, 400) });
    console.log(`  EN: ${got.modal.all.slice(0, 260)}`);
    await page.click('#fevtF06ForceOverlay .fevt-decision-card[data-choice="B"]');
    const result = await waitFor(page, `() => { const o = document.getElementById('mdlAOverlay'); return o && o.classList.contains('active'); }`, 5000);
    const rtext = await page.evaluate(() => { const o = document.getElementById('mdlAOverlay'); return o ? o.textContent.replace(/\s+/g, ' ').trim() : ''; });
    const rjp = rtext.match(JP) || [];
    check('EN: 結果モーダルに日本語が残っていない', result && rjp.length === 0, { rjp, text: rtext.slice(0, 300) });
    check('EN: 例外ゼロ', errs.length === 0, errs);
  } finally {
    await context.close();
  }
}

(async () => {
  const fixtureText = buildFixture();
  const server = await startStaticServer({ projectRoot: ROOT });
  const browser = await chromium.launch({ headless: true });
  let ng = 0;
  const check = (label, cond, detail) => {
    console.log((cond ? '  OK  ' : '  NG  ') + label);
    if (!cond) { ng++; if (detail !== undefined) console.log('        -> ' + JSON.stringify(detail).slice(0, 600)); }
  };
  try {
    console.log('\n=== A 和解させる(JA)===');
    await jaCase(browser, server, fixtureText, check, 'A');
    console.log('\n=== B 続けさせる(JA)===');
    await jaCase(browser, server, fixtureText, check, 'B');
    console.log('\n=== EN ===');
    await enCase(browser, server, fixtureText, check);
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
