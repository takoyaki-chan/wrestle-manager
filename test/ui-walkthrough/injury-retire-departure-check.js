#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  K-1 第4段 4-B 後半 受け入れ確認(手動実行・run-allには入らない)。2026-09-26 総点検 第4回裁定5〜7で更新。
//  実プレイで怪我による引退(K1-E03)・ラストランの引退・突然の退団(K1-E04)が起きた週の画面の流れを、実UI(index.html)で通す。
//  合成 fixture: seed 42 の2季目14週(差分テスト npm run test:k1:parity と同じ)から injury / lastrun / departure シナリオの
//  カードを組み、該当の出来事が出る乱数シードを探す。怪我引退の週は引退者と仲の良い選手を1人置く(M-22 を積ませるため)。
//
//  通す流れ(本物のボタンを押す):
//   1. 興行を開いて全試合スキップ → 結果画面。怪我の欄に引退者が出る(全治の週数は出さない)
//   2. 「結果を確認 →」を1回押す → 週が1つ進み、引退者はロスターから消えて引退者の記録に入る
//   3. **最初に開くのが本人の別れのポップアップ(B型・セピア)**。それより前に何も閉じなくてよい(裁定6)。
//      その裏で他の通知が開いていない
//   4. 本人のポップアップを閉じる → その週のほかの通知(引退でない怪我など)が続く。関係性フラグの
//      ポップアップ(M-22「引退の置き土産」)は出ない(裁定5)。M-22 は出来事のデータとして列に残る
//   5. ログのタブに怪我による引退の1行が残る(裁定7)
//   6. ポップアップが全部閉じ、「週を処理」で次の週へ進める(止まらない)
//   7. 例外ゼロ
//  ラストランの週も 1〜3・6・7 を同じ形で通す(lastrun シナリオ+引退でない怪我が出る乱数シード)。
//  突然の退団の週: departure シナリオ(信頼6の選手が6人)+退団が出る乱数シード →
//   結果画面 → 「結果を確認 →」1回で週が進み、去った選手はフリー/他団体へ → 退団のトースト(D型)が1枚出て OK で閉じる →
//   ログのタブに退団の1行(行き先つき) → 次の週へ進める・翌週に同じトーストが出直さない・例外ゼロ
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
      || pick('.fevt-decision-card[data-choice="C"]') || pick('.fevt-decision-card:not(.disabled)')
      || pick('#mdlAOverlay.active .mdl-a-decision-card') || pick('#mdlAOverlay.active .mdl-a-continue-btn:not([disabled])')
      || (pick('#mdlAOverlay.active .mdl-a-tap-hint') ? pick('#mdlAOverlay.active .mdl-a-tap-hint') : null)
      // 成長イベント(ブレークスルー・スランプ等)のポップアップ。2026-09-26: headless 進行のスタブを直した fixture では
      // スランプ中の選手がいて、ラストランの週に別れの後で出る
      || pick('#growthEventOverlay.active .growth-event-btn');
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

// ポップアップが開いた順番を記録する(40msごとに共有ゲートの対象オーバーレイを見る)。
// 自動で閉じるもの(ファンの反応 2.5秒など)も、開いた時点で記録に残る
async function startOpenRecorder(page) {
  await page.evaluate(() => {
    window.__openLog = [];
    const ids = (typeof _POPUP_OVERLAY_IDS !== 'undefined' ? _POPUP_OVERLAY_IDS : []).filter(id => id !== 'showResultOverlay');
    const seen = new Set();
    clearInterval(window.__openRec);
    window.__openRec = setInterval(() => {
      const active = [];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && (el.classList.contains('active') || el.classList.contains('show'))) active.push({ id, el });
      });
      document.querySelectorAll('.cerem-overlay, .fevt-overlay-stage.active, .fevt-overlay-office.active, .fevt-overlay-arena.active')
        .forEach(el => active.push({ id: el.className.split(' ')[0], el }));
      active.forEach(({ id, el }) => {
        if (seen.has(id)) return;
        seen.add(id);
        window.__openLog.push({ id, text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90) });
      });
      [...seen].forEach(id => { if (!active.some(a => a.id === id)) seen.delete(id); });
    }, 40);
  });
}
async function readOpenLog(page) { return page.evaluate(() => (window.__openLog || []).slice()); }

// 裁定6(2026-09-26): 「結果を確認 →」の後、最初に開くのが本人の別れのポップアップ。何も閉じずに待つ。
// 別れより先に別のポップアップが開いて別れが出てこないときは、閉じながら探す(失敗として記録に残す)
async function awaitFarewellFirst(page, name) {
  const src = `() => { const o = document.getElementById('mdlBOverlay'); return o && o.classList.contains('active') && o.textContent.includes(${JSON.stringify(name)}); }`;
  const before = [];
  let popup = await waitFor(page, src, 8000);
  for (let i = 0; i < 15 && !popup; i++) {
    const closed = await closeOne(page);
    if (closed) before.push(closed);
    popup = await waitFor(page, src, 2500);
  }
  const log = await readOpenLog(page);
  const first = log[0] || null;
  return { popup, before, first, log };
}

// 別れのポップアップを閉じ(王者の一言の吹き出しが出たらそれも)、続いて出るポップアップを1枚ずつ閉じる。
// 閉じたものの文面を順に返す
async function closeFarewellAndRest(page) {
  await page.click('#mdlBRetireClose');
  await page.waitForTimeout(400);
  const worry = await page.$('.champion-worry-toast');
  if (worry) { await worry.click(); await page.waitForTimeout(400); }
  const after = [];
  for (let i = 0; i < 20; i++) {
    const closed = await closeOne(page);
    if (closed) { after.push(closed); continue; }
    await page.waitForTimeout(1600);
    const again = await closeOne(page);
    if (again) { after.push(again); continue; }
    break;
  }
  if (after.length) console.log(`  (本人の引退ポップアップの後に出たもの: ${JSON.stringify(after)})`);
  return after;
}

// ログのタブ(renderLog の「全て」)に出ている行のうち、name を含むものを返す
async function logTabLines(page, name) {
  return page.evaluate(n => {
    const el = document.getElementById('logContent');
    if (!el || typeof renderLog !== 'function') return ['(logContent なし)'];
    el.dataset.filter = 'all';
    renderLog();
    return Array.from(el.querySelectorAll('div')).map(d => d.textContent.replace(/\s+/g, ' ').trim())
      .filter(t => t.includes(n) && t.length < 200);
  }, name);
}

async function advanceWeekCheck(page, check) {
  // 別れの後の通知を閉じ切った後から遅れて出るポップアップ(成長イベント等)が残っていれば閉じる
  const late = [];
  for (let i = 0; i < 10; i++) {
    const closed = await closeOne(page);
    if (!closed) break;
    late.push(closed);
  }
  if (late.length) console.log(`  (週を処理の前に閉じたもの: ${JSON.stringify(late)})`);
  const adv = await page.$('[data-walk-role="advance-week"]');
  check('「週を処理」ボタンが押せる状態にある', !!adv && await adv.isVisible());
  const wBefore = (await read(page)).week;
  if (adv) {
    await adv.click();
    const moved = await waitFor(page, `() => G.week === ${wBefore + 1}`, 10000);
    check('次の週へ進める(止まらない)', moved, { before: wBefore, now: (await read(page)).week });
  }
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
    await startOpenRecorder(page);
    await page.click('#showResultOverlay .pb-close-btn');
    // 3. 最初に開くのが本人の別れのポップアップ(裁定6)。何も閉じずに待つ
    const fw = await awaitFarewellFirst(page, setup.retireeName);
    if (fw.before.length) console.log(`  (本人の引退ポップアップの前に出たもの: ${JSON.stringify(fw.before)})`);
    check('最初に開くのは本人の別れのポップアップ(それより前に閉じるものが無い)', fw.popup && fw.before.length === 0
      && !!fw.first && fw.first.id === 'mdlBOverlay' && fw.first.text.includes(setup.retireeName), { first: fw.first, before: fw.before, log: fw.log });
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
    check('本人の引退ポップアップ(B型)が出る', fw.popup, r2.mdlBText);
    const expectTitle = setup.farewellKind ? null : '無 念 の 引 退';
    if (expectTitle) check(`見出しは「${expectTitle}」`, !!(r2.mdlBText && r2.mdlBText.includes(expectTitle)), r2.mdlBText);
    check('本人のポップアップの裏で他の通知(C3)が開いていない', !r2.c3Text, r2.c3Text);
    if (!fw.popup) { check('例外ゼロ', errs.length === 0, errs); return; }

    // 4. 本人のポップアップを閉じる → その週のほかの通知が続く。関係性フラグのポップアップ(M-22)は出さない(裁定5)
    const queued = await page.evaluate(id => (G._modalQueue || []).filter(m => m.type === 'M-22' && m.payload && m.payload.toId === id).map(m => ({ from: m.payload.fromId, scope: m.scope || null })), setup.retireeId);
    check('「引退の置き土産」(M-22)は出来事のデータとして列に残る(自団体の出来事)', queued.length === 1 && queued[0].from === setup.friendId && queued[0].scope === 'own', queued);
    const after = await closeFarewellAndRest(page);
    check('別れの後に、その週のほかの通知(引退でない怪我のポップアップ)が続く', after.some(t => /全治/.test(t)), after);
    check('関係性フラグのポップアップ(M-22「引退の置き土産」)は出ない', !after.some(t => t.includes('引退の置き土産'))
      && !(await readOpenLog(page)).some(e => e.text.includes('引退の置き土産')), after);

    // 5. ログのタブに怪我による引退の1行(裁定7)
    const logLine = await logTabLines(page, setup.retireeName);
    const expectLog = setup.retireType === 'careerEnding' ? '試合中の重傷により引退' : '度重なる怪我により引退';
    check(`ログのタブに「${expectLog}」の1行が残る`, logLine.filter(t => t.includes(expectLog)).length === 1, logLine);

    // 6. 次の週へ進める
    await advanceWeekCheck(page, check);
    check('例外ゼロ', errs.length === 0, errs);
  } finally {
    await context.close();
  }
}

// ラストランの引退の週(裁定6)。lastrun シナリオのラストラン中の選手が出場し、ほかの出場者は体調を落として
// 引退でない怪我が1件以上出る乱数シードを選ぶ(別れの後に続く通知として見る)
async function lastrunCase(browser, server, fixtureText, check) {
  const { context, page, errs } = await newPage(browser, server, fixtureText);
  try {
    const loaded = await page.evaluate(() => window.__k1.loadBase());
    if (!loaded.ok) throw new Error(`loadBase failed: ${loaded.reason}`);
    const base = withoutOrphanFactions(loaded.state);
    const sc = scenarios.find(s => s.name === 'lastrun');
    const built = sc.build(base, {});
    const lrId = built.G0.roster.find(f => f.lastRun).id;
    const tired = (G) => ({ ...G, roster: G.roster.map(f => (f.id !== lrId && (G.showCard || []).some(m => m.left === f.id || m.right === f.id)) ? { ...f, condition: 40 } : f) });
    const probeG0 = tired(built.G0);
    const seeds = Array.from({ length: 600 }, (_, i) => 9001 + i * 7);
    const seedInfo = await page.evaluate(({ G0, seeds }) => {
      for (const seed of seeds) {
        let show = null;
        try { show = Engine.executeShow({ ...JSON.parse(JSON.stringify(G0)), rngSeed: seed }); } catch (_e) { show = null; }
        if (!show || show.error) continue;
        const inj = show.injuryResults || [];
        if (inj.some(ir => ir.retireType)) continue;
        if (inj.filter(ir => !ir.retireType).length >= 1) return { seed };
      }
      return { seed: null };
    }, { G0: probeG0, seeds });
    check('引退でない怪我が出る乱数シードが見つかる(ラストランの週)', seedInfo.seed != null, seedInfo);
    if (seedInfo.seed == null) return;
    const G0 = { ...probeG0, rngSeed: seedInfo.seed };
    const lrName = G0.roster.find(f => f.id === lrId).name;
    console.log(`  ラストランの選手 #${lrId} ${lrName} / rngSeed ${seedInfo.seed}`);

    await page.evaluate(({ G0 }) => {
      G = JSON.parse(JSON.stringify(G0));
      showScreen('week');
      App.executeShow();
      App.skipAllMatches();
    }, { G0 });
    const opened = await waitFor(page, `() => { const o = document.getElementById('showResultOverlay'); return o && o.classList.contains('active'); }`);
    check('結果画面が開く', opened);
    const weekBefore = (await read(page)).week;
    await startOpenRecorder(page);
    await page.click('#showResultOverlay .pb-close-btn');
    const fw = await awaitFarewellFirst(page, lrName);
    if (fw.before.length) console.log(`  (本人の引退ポップアップの前に出たもの: ${JSON.stringify(fw.before)})`);
    check('最初に開くのは本人の別れのポップアップ(それより前に閉じるものが無い)', fw.popup && fw.before.length === 0
      && !!fw.first && fw.first.id === 'mdlBOverlay' && fw.first.text.includes(lrName), { first: fw.first, before: fw.before, log: fw.log });
    const r2 = await read(page);
    check('1回の操作で週が1つ進む', r2.week === weekBefore + 1 && r2.weekPhase === 'manage', { before: weekBefore, after: r2.week, phase: r2.weekPhase });
    check('見出しは「旅 立 ち」(ラストラン)', !!(r2.mdlBText && /旅\s*立\s*ち/.test(r2.mdlBText)), r2.mdlBText);
    check('本人のポップアップの裏で他の通知(C3)が開いていない', !r2.c3Text, r2.c3Text);
    if (!fw.popup) { check('例外ゼロ', errs.length === 0, errs); return; }
    const after = await closeFarewellAndRest(page);
    check('別れの後に、その週のほかの通知(引退でない怪我のポップアップ)が続く', after.some(t => /全治/.test(t)), after);
    await advanceWeekCheck(page, check);
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
    // 行き先は実際に移った先(他団体のロスターにいれば移籍、そうでなければフリー)
    check('退団のトーストが出る(名前と行き先)', toast && tText.includes(st.inAI ? '他団体へ移籍した' : 'フリーとなった'), tText);
    const toastCount = await page.evaluate(() => document.querySelectorAll('#mdlDOverlay.active').length);
    check('トーストは1枚だけ(二重に出ない)', toastCount === 1, toastCount);
    if (toast) {
      await page.click('#mdlDOverlay .mdl-d-btn');
      await page.waitForTimeout(400);
    }
    const again = await waitFor(page, toastSrc, 1500);
    check('OK を1回押すと閉じ、同じトーストはもう出ない', !again);
    // ログのタブに突然の退団の1行(行き先つき。裁定7)
    const depLines = await logTabLines(page, dep.name);
    const expectDep = st.inAI
      ? await page.evaluate(id => { const e = Object.entries(G.aiOrgs || {}).find(([, o]) => (o.roster || []).some(f => f.id === id)); return e ? `突然退団し、${Engine.contract._getOrgName(e[0], G)}へ移籍した` : '?'; }, dep.id)
      : '突然退団し、フリーとなった';
    check(`ログのタブに「${expectDep}」の1行が残る`, depLines.filter(t => t.includes(expectDep)).length === 1, depLines);
    check('トーストの行き先もログと同じ(他団体/フリー)', st.inAI ? tText.includes('他団体へ移籍した') : tText.includes('フリーとなった'), tText);
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
    console.log('\n=== ラストランの引退の週 ===');
    await lastrunCase(browser, server, fixtureText, check);
    console.log('\n=== 突然の退団(K1-E04)の週 ===');
    await departureCase(browser, server, fixtureText, check);
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng} 件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
