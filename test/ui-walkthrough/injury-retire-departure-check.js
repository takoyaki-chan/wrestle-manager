#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  K-1 第4段 4-B 後半 受け入れ確認(手動実行・run-allには入らない)。
//  実プレイで怪我による引退(K1-E03)が起きた週の画面の流れを、実UI(index.html)で通す。
//  合成 fixture: seed 42 の2季目14週(差分テスト npm run test:k1:parity と同じ)から injury シナリオの
//  カードを組み、怪我引退が出る乱数シードを探して、引退者と仲の良い選手を1人置く(M-22 を出すため)。
//
//  通す流れ(本物のボタンを押す):
//   1. 興行を開いて全試合スキップ → 結果画面。怪我の欄に引退者が出る(全治の週数は出さない)
//   2. 「結果を確認 →」を1回押す → 週が1つ進み、引退者はロスターから消えて引退者の記録に入る
//   3. 本人の引退ポップアップ(B型・セピア)が出る。この時点では周りの反応(M-22)はまだ出ない
//   4. 本人のポップアップを閉じる → 「引退の置き土産」(M-22)が出る → 閉じる
//   5. ポップアップが全部閉じ、「週を処理」で次の週へ進める(止まらない)
//   6. 例外ゼロ
//  突然の退団(K1-E04)の週も同じ形で通す: departure シナリオ(信頼6の選手が6人)+退団が出る乱数シード →
//   結果画面 → 「結果を確認 →」1回で週が進み、去った選手はフリー/他団体へ → 退団のトースト(D型)が1枚出て OK で閉じる →
//   次の週へ進める・翌週に同じトーストが出直さない・例外ゼロ
//  注: 関係性フラグのポップアップ(M-22/M-23)はキューに積まれたことだけ確かめる。表示は既存の不具合
//      (_drainFlagModalQueue が window.G を見る)で実プレイでは出ないため、裁定待ち(k1-parity-report.md 参照)
//
//  使い方: node test/ui-walkthrough/injury-retire-departure-check.js
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./server');
const { advanceUntil, toSaveState } = require('./fixtures/headless-sim');
const { scenarios } = require('../k1-parity/scenarios');

const ROOT = path.resolve(__dirname, '..', '..');
const PROBE_PATH = path.join(__dirname, '..', 'k1-parity', 'page-probe.js');

function buildFixture() {
  const G = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 14 && g.weekPhase === 'manage' && !g.offSeason });
  const save = toSaveState(G, 'injury-retire-departure-check fixture seed=42 S2W14');
  save.rngSeed = 42;
  return JSON.stringify(save);
}

async function newPage(browser, server, fixtureText) {
  const context = await browser.newContext({ locale: 'ja-JP', viewport: { width: 1440, height: 1000 } });
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
  await page.addInitScript(({ save }) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', 'ja');
    localStorage.setItem('wrestle_manager_autosave', save);
  }, { save: fixtureText });
  await page.addInitScript({ path: PROBE_PATH });
  await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Engine !== 'undefined' && !!window.__k1, null, { timeout: 30000 });
  return { context, page, errs };
}

// ページ上の見えている状態を読む
const READ = `() => {
  const vis = el => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const txt = el => el ? el.textContent.replace(/\\s+/g, ' ').trim() : null;
  const res = document.getElementById('showResultOverlay');
  const mdlB = document.getElementById('mdlBOverlay');
  const c3btn = Array.from(document.querySelectorAll('.mdl-c-footer-btn')).find(vis) || null;
  const c3 = c3btn ? c3btn.closest('[id]') : null;
  return {
    week: G.week, season: G.season, weekPhase: G.weekPhase,
    resultActive: !!(res && res.classList.contains('active')),
    injuryItems: Array.from(document.querySelectorAll('#showResultOverlay .pb-injury-item')).map(txt),
    mdlBActive: !!(mdlB && mdlB.classList.contains('active')),
    mdlBText: mdlB && mdlB.classList.contains('active') ? txt(mdlB).slice(0, 400) : null,
    c3Text: c3 ? txt(c3).slice(0, 300) : null,
    toastText: Array.from(document.querySelectorAll('.notif-event-toast, .mdl-d-overlay.active, #mdlDOverlay.active')).map(txt).join(' | ').slice(0, 400) || null,
    overlays: Array.from(document.querySelectorAll('[id].active, .active[class*="overlay"]')).filter(vis).map(el => (el.id || el.className) + ':' + (txt(el) || '').slice(0, 60)).slice(0, 8),
  };
}`;

async function read(page) { return page.evaluate(src => (0, eval)(src)(), READ); }

// 目的のポップアップ以外に出ているもの(引退でない怪我・契約枠・王座設立の通知、派閥イベントなど)を1枚閉じる。
// 閉じたものの文面を返す(何も無ければ null)。本物のボタンを押す
async function closeOne(page) {
  const target = await page.evaluate(() => {
    const vis = el => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const pick = (sel) => Array.from(document.querySelectorAll(sel)).find(vis) || null;
    document.querySelectorAll('[data-check-close]').forEach(el => el.removeAttribute('data-check-close'));
    // C3 の通知 / 派閥の演出の CONTINUE / 直訴などの決断は「NO」/ A型の決断(最初の選択肢)/ A型の続行ボタン / TAP TO CONTINUE
    const btn = pick('.mdl-c-footer-btn') || pick('#mdlDOverlay .mdl-d-btn') || pick('.fevt-continue-btn')
      || pick('.fevt-decision-card[data-choice="NO"]')
      || pick('#mdlAOverlay.active .mdl-a-decision-card') || pick('#mdlAOverlay.active .mdl-a-continue-btn:not([disabled])')
      || (pick('#mdlAOverlay.active .mdl-a-tap-hint') ? pick('#mdlAOverlay.active .mdl-a-tap-hint') : null);
    if (!btn) return null;
    const box = btn.closest('[id]');
    btn.setAttribute('data-check-close', '1');
    return (box ? box.textContent : btn.textContent).replace(/\s+/g, ' ').trim().slice(0, 90);
  });
  if (!target) return null;
  await page.click('[data-check-close="1"]');
  await page.waitForTimeout(350);
  return target;
}

async function waitFor(page, predSrc, timeout = 10000) {
  try {
    await page.waitForFunction(src => { try { return !!(0, eval)(src)(); } catch (_e) { return false; } }, predSrc, { timeout, polling: 100 });
    return true;
  } catch (_e) { return false; }
}

// fixture(seed 42 の2季目14週)には、リーダーがロスターにいない派閥が1つある(翌週の週次処理で
// 「リーダー喪失」の派閥イベントが出る)。確かめたい流れと関係ないので、シナリオの入力から外しておく
function withoutOrphanFactions(state) {
  const ids = new Set((state.roster || []).map(f => f.id));
  return { ...state, factions: (state.factions || []).filter(f => f.status === 'dissolved' || ids.has(f.leaderId)) };
}

async function injuryCase(browser, server, fixtureText, check) {
  const { context, page, errs } = await newPage(browser, server, fixtureText);
  try {
    const loaded = await page.evaluate(() => window.__k1.loadBase());
    if (!loaded.ok) throw new Error(`loadBase failed: ${loaded.reason}`);
    const base = withoutOrphanFactions(loaded.state);
    const sc = scenarios.find(s => s.name === 'injury');
    const probeG0 = sc.build(base, {}).G0;
    const seeds = Array.from({ length: 600 }, (_, i) => 9001 + i * 7);
    const seedInfo = await page.evaluate(({ G0, seeds }) => window.__k1.searchSeed(G0, seeds, { minRetire: 1, minPlainInjury: 1 }), { G0: probeG0, seeds });
    check('怪我引退が出る乱数シードが見つかる', seedInfo.seed != null, seedInfo);
    if (seedInfo.seed == null) return;
    let G0 = sc.build(base, { rngSeed: seedInfo.seed }).G0;
    // 引退者と対戦相手をエンジンで確かめ、対戦相手以外の1人を引退者と仲良くしておく(M-22 を出すため)
    const setup = await page.evaluate(({ G0 }) => {
      const show = Engine.executeShow(JSON.parse(JSON.stringify(G0)));
      const ret = (show.injuryResults || []).find(ir => ir.retireType);
      const card = (G0.showCard || []).find(m => m.left === ret.id || m.right === ret.id);
      const oppId = card.left === ret.id ? card.right : card.left;
      const friend = G0.roster.find(f => f.id !== ret.id && f.id !== oppId && !f.injury);
      return { retireeId: ret.id, retireeName: ret.name, retireType: ret.retireType, farewellKind: ret.farewellKind || null, friendId: friend.id, friendName: friend.name };
    }, { G0 });
    const rels = { ...G0.relationships };
    rels[`${setup.friendId}>${setup.retireeId}`] = { ...(rels[`${setup.friendId}>${setup.retireeId}`] || { rivalry: 0 }), bond: 82 };
    rels[`${setup.retireeId}>${setup.friendId}`] = { ...(rels[`${setup.retireeId}>${setup.friendId}`] || { rivalry: 0 }), bond: 82 };
    G0 = { ...G0, relationships: rels };
    const still = await page.evaluate(({ G0, id }) => {
      const show = Engine.executeShow(JSON.parse(JSON.stringify(G0)));
      return (show.injuryResults || []).some(ir => ir.id === id && ir.retireType);
    }, { G0, id: setup.retireeId });
    check('仲の良い選手を置いても同じ選手が引退する(怪我の判定は対戦ペアだけを見る)', still, setup);
    console.log(`  引退者 #${setup.retireeId} ${setup.retireeName}(${setup.retireType}${setup.farewellKind ? ` / ${setup.farewellKind}` : ''}) / 仲の良い選手 #${setup.friendId} ${setup.friendName} / rngSeed ${seedInfo.seed}`);

    // 1. 興行 → 全試合スキップ → 結果画面
    await page.evaluate(({ G0 }) => {
      G = JSON.parse(JSON.stringify(G0));
      showScreen('week');
      App.executeShow();
      App.skipAllMatches();
    }, { G0 });
    const opened = await waitFor(page, `() => { const o = document.getElementById('showResultOverlay'); return o && o.classList.contains('active'); }`);
    check('結果画面が開く', opened);
    const r1 = await read(page);
    const retireeItem = r1.injuryItems.find(t => t.includes(setup.retireeName));
    check('結果画面の怪我の欄に引退者が出る', !!retireeItem, r1.injuryItems);
    check('引退者には全治の週数を出さない', !!retireeItem && !/全治/.test(retireeItem), retireeItem);
    check('引退でない怪我には全治の週数が出る', r1.injuryItems.some(t => !t.includes(setup.retireeName) && /全治/.test(t)), r1.injuryItems);

    // 2. 「結果を確認 →」を1回押す
    const weekBefore = r1.week;
    await page.click('#showResultOverlay .pb-close-btn');
    // 本人の引退ポップアップより前に出るもの(引退でない怪我のポップアップなど)は1枚ずつ閉じる。
    // その中に周りの反応(M-22)が混じっていないことを確かめる
    const retirePopupSrc = `() => { const o = document.getElementById('mdlBOverlay'); return o && o.classList.contains('active') && o.textContent.includes(${JSON.stringify(setup.retireeName)}); }`;
    const before = [];
    let popup = false;
    for (let i = 0; i < 15 && !popup; i++) {
      popup = await waitFor(page, retirePopupSrc, 2500);
      if (popup) break;
      const closed = await closeOne(page);
      if (closed) before.push(closed);
      else if (process.env.DEBUG) {
        console.log('  [debug]', JSON.stringify((await read(page)).overlays));
        console.log('  [debug-q]', JSON.stringify(await page.evaluate(() => ({
          popupQ: typeof _popupQueue !== 'undefined' ? _popupQueue.length : null,
          eventQ: typeof _eventPopupQueue !== 'undefined' ? _eventPopupQueue.length : null,
          onEmpty: typeof _onEventPopupQueueEmpty !== 'undefined' ? !!_onEventPopupQueueEmpty : null,
          retQ: typeof _retirementPopupQueue !== 'undefined' ? _retirementPopupQueue.length : null,
          active: typeof _isPopupActive === 'function' ? _isPopupActive() : null,
          activeIgn: typeof _isPopupActive === 'function' ? _isPopupActive({ ignoreShowResultOverlay: true }) : null,
        }))));
      }
    }
    if (before.length) console.log(`  (本人の引退ポップアップの前に出たもの: ${JSON.stringify(before)})`);
    check('本人の引退ポップアップより先に周りの反応(M-22)が出ていない', !before.some(t => t.includes('引退の置き土産')), before);
    const r2 = await read(page);
    const st = await page.evaluate(id => ({
      inRoster: (G.roster || []).some(f => f.id === id),
      retired: (G.retiredFighters || []).some(f => f.id === id),
      pendingLeft: !!G._pendingInjuryRetirements,
    }), setup.retireeId);
    check('1回の操作で週が1つ進む', r2.week === weekBefore + 1 && r2.weekPhase === 'manage', { before: weekBefore, after: r2.week, phase: r2.weekPhase });
    check('引退者はロスターから消え、引退者の記録に入る', !st.inRoster && st.retired, st);
    check('演出データ(_pendingInjuryRetirements)は消化されて残らない', !st.pendingLeft, st);

    // 3. 本人の引退ポップアップ
    check('本人の引退ポップアップ(B型)が出る', popup, r2.mdlBText);
    const expectTitle = setup.farewellKind ? null : '無 念 の 引 退';
    if (expectTitle) check(`見出しは「${expectTitle}」`, !!(r2.mdlBText && r2.mdlBText.includes(expectTitle)), r2.mdlBText);
    check('本人のポップアップの裏で周りの反応(M-22)が開いていない', !(r2.c3Text && r2.c3Text.includes('引退の置き土産')), r2.c3Text);
    if (!popup) { check('例外ゼロ', errs.length === 0, errs); return; }

    // 4. 本人のポップアップを閉じる → M-22
    const queued = await page.evaluate(id => (G._modalQueue || []).filter(m => m.type === 'M-22' && m.payload && m.payload.toId === id).map(m => ({ from: m.payload.fromId, scope: m.scope || null })), setup.retireeId);
    check('「引退の置き土産」(M-22)が自団体の出来事としてキューに積まれている', queued.length === 1 && queued[0].from === setup.friendId && queued[0].scope === 'own', queued);
    const flagDrainWorks = await page.evaluate(() => typeof window.G !== 'undefined');
    await page.click('#mdlBRetireClose');
    // チャンピオンの一言の吹き出しが出たら閉じる
    await page.waitForTimeout(400);
    const worry = await page.$('.champion-worry-toast');
    if (worry) { await worry.click(); await page.waitForTimeout(400); }
    if (flagDrainWorks) {
      const m22 = await waitFor(page, `() => Array.from(document.querySelectorAll('.mdl-c-footer-btn')).some(b => { const c = b.closest('[id]'); return c && c.textContent.includes('引退の置き土産'); })`, 10000);
      const r3 = await read(page);
      check('本人のポップアップを閉じると「引退の置き土産」(M-22)が出る', m22, r3.c3Text);
      check('M-22 の話し手は仲の良い選手', !!(r3.c3Text && r3.c3Text.includes(setup.friendName)), r3.c3Text);
    } else {
      // 既存の不具合(2026-04-28 から): ui-common.js の _drainFlagModalQueue が window.G を見ているが、
      // G は app.js の let 宣言で window に載らないため、関係性フラグのポップアップ(M-1〜M-24)は実プレイで一度も出ない。
      // K-1 4-B の範囲外(直すと全フラグのポップアップが出るようになる)なので、報告して裁定を待つ
      console.log('  --  M-22 のポップアップ表示は確認を省略(既存の不具合: _drainFlagModalQueue が window.G を見ていて、フラグのポップアップが実プレイで一度も出ない)');
    }

    // ここからは出ているポップアップを順に閉じる(1回押すと1枚閉じる)
    const after = [];
    for (let i = 0; i < 20; i++) {
      const closed = await closeOne(page);
      if (closed) { after.push(closed); continue; }
      await page.waitForTimeout(1200);
      const again = await closeOne(page);
      if (again) { after.push(again); continue; }
      break;
    }
    if (after.length) console.log(`  (本人の引退ポップアップの後に出たもの: ${JSON.stringify(after)})`);

    // 5. 次の週へ進める
    const adv = await page.$('[data-walk-role="advance-week"]');
    check('「週を処理」ボタンが押せる状態にある', !!adv && await adv.isVisible());
    const wBefore = (await read(page)).week;
    if (adv) {
      await adv.click();
      const moved = await waitFor(page, `() => G.week === ${wBefore + 1}`, 10000);
      check('次の週へ進める(止まらない)', moved, { before: wBefore, now: (await read(page)).week });
    }
    check('例外ゼロ', errs.length === 0, errs);
  } finally {
    await context.close();
  }
}

async function departureCase(browser, server, fixtureText, check) {
  const { context, page, errs } = await newPage(browser, server, fixtureText);
  try {
    const loaded = await page.evaluate(() => window.__k1.loadBase());
    if (!loaded.ok) throw new Error(`loadBase failed: ${loaded.reason}`);
    const base = withoutOrphanFactions(loaded.state);
    const sc = scenarios.find(s => s.name === 'departure');
    const probeG0 = sc.build(base, {}).G0;
    const seeds = Array.from({ length: 600 }, (_, i) => 9001 + i * 7);
    const seedInfo = await page.evaluate(({ G0, seeds }) => window.__k1.searchSeed(G0, seeds, { minDeparted: 1 }), { G0: probeG0, seeds });
    check('突然の退団が出る乱数シードが見つかる', seedInfo.seed != null, seedInfo);
    if (seedInfo.seed == null) return;
    const G0 = sc.build(base, { rngSeed: seedInfo.seed }).G0;
    const who = await page.evaluate(({ G0 }) => {
      const show = Engine.executeShow(JSON.parse(JSON.stringify(G0)));
      return (show.state._pendingSuddenDepartures || []).map(d => ({ id: d.id, name: d.name, destination: d.destination }));
    }, { G0 });
    const dep = who[0];
    console.log(`  去る選手 #${dep.id} ${dep.name}(${dep.destination === 'rival' ? '他団体へ' : 'フリー'}) / rngSeed ${seedInfo.seed}`);

    // 1. 興行 → 全試合スキップ → 結果画面 → 「結果を確認 →」を1回
    await page.evaluate(({ G0 }) => {
      G = JSON.parse(JSON.stringify(G0));
      showScreen('week');
      App.executeShow();
      App.skipAllMatches();
    }, { G0 });
    const opened = await waitFor(page, `() => { const o = document.getElementById('showResultOverlay'); return o && o.classList.contains('active'); }`);
    check('結果画面が開く', opened);
    const weekBefore = (await read(page)).week;
    await page.click('#showResultOverlay .pb-close-btn');

    // 2. 週が1つ進み、去った選手はロスターにいない。演出データは消化済み
    await page.waitForTimeout(300);
    const st = await page.evaluate(id => ({
      week: G.week, weekPhase: G.weekPhase,
      inRoster: (G.roster || []).some(f => f.id === id),
      inFA: (G.freeAgents || []).some(f => f.id === id),
      inAI: Object.values(G.aiOrgs || {}).some(o => (o.roster || []).some(f => f.id === id)),
      pendingLeft: !!G._pendingSuddenDepartures,
      m23: (G._modalQueue || []).filter(m => m.type === 'M-23' && m.payload && m.payload.toId === id).map(m => m.scope || null),
    }), dep.id);
    check('1回の操作で週が1つ進む', st.week === weekBefore + 1 && st.weekPhase === 'manage', st);
    check('去った選手はロスターから消え、フリーか他団体にいる', !st.inRoster && (st.inFA || st.inAI), st);
    check('演出データ(_pendingSuddenDepartures)は週送りの前に消化され、翌週へ持ち越さない', !st.pendingLeft, st);
    check('「突然離脱の波紋」(M-23)が自団体の出来事としてキューに積まれている', st.m23.length === 1 && st.m23[0] === 'own', st.m23);

    // 3. 退団のトースト(D型・OK で閉じる。60秒で自動で閉じる保険つき)が出る。ほかのポップアップは順に閉じる
    const toastSrc = `() => { const o = document.getElementById('mdlDOverlay'); return !!o && o.classList.contains('active') && o.textContent.includes('荷物をまとめて団体を去った') && o.textContent.includes(${JSON.stringify(dep.name)}); }`;
    const seen = [];
    let toast = false;
    for (let i = 0; i < 15 && !toast; i++) {
      toast = await waitFor(page, toastSrc, 2500);
      if (toast) break;
      const closed = await closeOne(page);
      if (closed) seen.push(closed);
    }
    if (seen.length) console.log(`  (退団のトーストの前に出たもの: ${JSON.stringify(seen)})`);
    const tText = await page.evaluate(() => { const o = document.getElementById('mdlDOverlay'); return o ? o.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : null; });
    check('退団のトーストが出る(名前と行き先)', toast && tText.includes(dep.destination === 'rival' ? '他団体へ移籍した' : 'フリーとなった'), tText);
    const toastCount = await page.evaluate(() => document.querySelectorAll('#mdlDOverlay.active').length);
    check('トーストは1枚だけ(二重に出ない)', toastCount === 1, toastCount);
    if (toast) {
      await page.click('#mdlDOverlay .mdl-d-btn');
      await page.waitForTimeout(400);
    }
    const again = await waitFor(page, toastSrc, 1500);
    check('OK を1回押すと閉じ、同じトーストはもう出ない', !again);
    for (let i = 0; i < 20; i++) {
      const closed = await closeOne(page);
      if (closed) continue;
      await page.waitForTimeout(1200);
      if (!(await closeOne(page))) break;
    }

    // 4. 次の週へ進める。翌週(非興行週)の processWeek で同じトーストが出直さない
    const adv = await page.$('[data-walk-role="advance-week"]');
    check('「週を処理」ボタンが押せる状態にある', !!adv && await adv.isVisible());
    const wBefore = (await read(page)).week;
    if (adv) {
      await adv.click();
      const moved = await waitFor(page, `() => G.week === ${wBefore + 1}`, 10000);
      check('次の週へ進める(止まらない)', moved, { before: wBefore, now: (await read(page)).week });
      const dup = await waitFor(page, toastSrc, 2500);
      check('翌週に同じ退団のトーストが出直さない', !dup);
    }
    check('例外ゼロ', errs.length === 0, errs);
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
    if (!cond) { ng++; if (detail !== undefined) console.log('        -> ' + JSON.stringify(detail)); }
  };
  try {
    console.log('\n=== 怪我による引退(K1-E03)の週 ===');
    await injuryCase(browser, server, fixtureText, check);
    console.log('\n=== 突然の退団(K1-E04)の週 ===');
    await departureCase(browser, server, fixtureText, check);
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
