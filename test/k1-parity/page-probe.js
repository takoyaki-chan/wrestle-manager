// K-1 経路差分テストのページ側プローブ(page.addInitScript で注入する)。
//
// 役割:
//   - 同じ興行前の状態 G0 から、エンジン経路(Engine.executeShow → Engine.tickWeek)と
//     実プレイ経路(App.executeShow → skipAllMatches/skipMatch → App._finalizeShowImpl →
//     App.closeShowResult 内の Engine.tickWeek)を走らせ、各時点の状態を JSON で返す。
//   - 乱数の消費を「ストリーム(derive の引数)ごとの引き数」で数える(計測のみ。値は変えない)。
//
// src の挙動は変えない。ここで行う差し替えは次の3つだけで、いずれも計測・固定のため:
//   1) Math.random を種付きの擬似乱数に置き換える(表示用の文選びの再現性のため。数値経路は
//      Engine.rng を使うので影響しない)
//   2) Engine.rng.derive/create/_next を「数えるだけ」の包みで覆う(戻り値は元の関数そのまま)
//   3) 実プレイ経路の実行中だけ Engine.tickWeek と App.advanceFromWeekSummary を包み、
//      closeShowResult が tickWeek に渡す状態/受け取る状態と、週送り直前の状態を写し取る。
//      advanceFromWeekSummary は写し取ったあと呼ばずに止める(次週へ進めない)。
(function installK1Probe() {
  'use strict';
  const K1 = {};

  // ── 1) Math.random の種付け(mulberry32) ─────────────────────────────
  let mrState = 0x2545F491;
  K1.reseedMathRandom = function reseedMathRandom(seed) { mrState = (seed >>> 0) || 1; };
  Math.random = function seededRandom() {
    mrState = (mrState + 0x6D2B79F5) | 0;
    let t = Math.imul(mrState ^ (mrState >>> 15), 1 | mrState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
  K1.clone = clone;

  // ── 2) 乱数ストリームの計数 ───────────────────────────────────────
  let tap = null;           // 計数中の器 { streams: Map, untracked }
  let tapInstalled = false;
  const deriveKeys = new Map();   // derive の戻り値 → キー列(先頭の baseSeed は除く)
  const streamOf = new WeakMap(); // create が返した rng 状態 → 計数レコード

  K1.installRngTap = function installRngTap() {
    if (tapInstalled) return;
    tapInstalled = true;
    const R = Engine.rng;
    const origDerive = R.derive;
    const origCreate = R.create;
    const origNext = R._next;
    R.derive = function tappedDerive(baseSeed, ...keys) {
      const value = origDerive.call(R, baseSeed, ...keys);
      if (!deriveKeys.has(value)) {
        deriveKeys.set(value, keys.map(k => (typeof k === 'number' ? k : `(${typeof k})`)));
      }
      return value;
    };
    R.create = function tappedCreate(seed) {
      const rng = origCreate.call(R, seed);
      if (tap) {
        const normalized = (seed | 0) === 0 ? 1 : (seed | 0);
        const key = String(normalized);
        let record = tap.streams.get(key);
        if (!record) {
          record = { seed: normalized, keys: deriveKeys.get(normalized) || null, creates: 0, draws: 0 };
          tap.streams.set(key, record);
        }
        record.creates++;
        streamOf.set(rng, record);
      }
      return rng;
    };
    R._next = function tappedNext(state) {
      if (tap) {
        const record = streamOf.get(state);
        if (record) record.draws++;
        else tap.untracked++;
      }
      return origNext.call(R, state);
    };
  };
  K1.startRngTap = function startRngTap() { tap = { streams: new Map(), untracked: 0 }; };
  K1.stopRngTap = function stopRngTap() {
    const t = tap;
    tap = null;
    if (!t) return { untracked: 0, streams: [] };
    return { untracked: t.untracked, streams: [...t.streams.values()].map(s => ({ ...s })) };
  };
  const pauseTap = () => { const t = tap; tap = null; return t; };
  const resumeTap = (t) => { tap = t; };

  // ── 基準状態の読込み ───────────────────────────────────────────
  // タイトル画面の CONTINUE と同じ経路でオートセーブを読む(セーブ移行処理も本番どおり通る)。
  K1.loadBase = function loadBase() {
    if (typeof App === 'undefined' || typeof G === 'undefined') return { ok: false, reason: 'App/G not ready' };
    K1.installRngTap();
    App.titleContinue();
    return {
      ok: true,
      season: G.season, week: G.week, weekPhase: G.weekPhase, offSeason: !!G.offSeason,
      roster: (G.roster || []).length, relationships: Object.keys(G.relationships || {}).length,
      state: clone(G),
    };
  };

  // ── エンジン経路 ──────────────────────────────────────────────
  K1.runEngine = function runEngine(G0, options = {}) {
    K1.installRngTap();
    const out = { errors: [] };
    const input = clone(G0);
    K1.reseedMathRandom(options.mathSeed || 0x1234);
    K1.startRngTap();
    let show = null;
    try {
      show = Engine.executeShow(input);
    } catch (error) {
      out.errors.push(`Engine.executeShow threw: ${error && error.stack || error}`);
    }
    out.rngShow = K1.stopRngTap();
    if (!show || show.error) {
      if (show && show.error) out.errors.push(`Engine.executeShow error: ${show.error}`);
      return out;
    }
    out.postShow = clone(show.state);
    out.showEvents = clone(show.events || []);
    out.injuryResults = clone(show.injuryResults || []);
    out.showRivalryResolutions = clone(show.showRivalryResolutions || []);
    K1.startRngTap();
    let tick = null;
    try {
      tick = Engine.tickWeek(clone(show.state), { lang: WM_I18N.lang, dict: WM_I18N.t });
    } catch (error) {
      out.errors.push(`Engine.tickWeek threw: ${error && error.stack || error}`);
    }
    out.rngTick = K1.stopRngTap();
    if (tick) {
      out.postTick = clone(tick.state);
      out.tickEvents = clone(tick.events || []);
    }
    return out;
  };

  // ── シード探索(injury / departure シナリオ用) ────────────────────────
  // G0 の rngSeed だけを差し替えてエンジン経路の興行処理を回し、条件に合う最初のシードを返す。
  // 条件(すべて「以上」): minRetire=怪我引退の件数 / minPlainInjury=引退でない怪我の件数 /
  //                        minDeparted=突然の退団の件数
  K1.searchSeed = function searchSeed(G0, seeds, criteria = {}) {
    const minRetire = criteria.minRetire || 0;
    const minPlainInjury = criteria.minPlainInjury || 0;
    const minDeparted = criteria.minDeparted || 0;
    const base = clone(G0);
    let tried = 0;
    for (const seed of seeds) {
      tried++;
      if (criteria.intrusion) {
        // 乱入は実プレイ経路(App.executeShow)だけが判定する。App と同じ乱数ストリームで
        // Engine.intrusion.check を呼び、乱入が起きるシードを探す(判定関数そのものは純関数)
        const s = { ...clone(base), rngSeed: seed };
        const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 8888));
        let hit = null;
        try { hit = Engine.intrusion.check(s, rng); } catch (_e) { hit = null; }
        if (hit) return { seed, tried, intruderId: hit.intruder && hit.intruder.id };
        continue;
      }
      let show = null;
      try { show = Engine.executeShow({ ...clone(base), rngSeed: seed }); } catch (_e) { show = null; }
      if (!show || show.error) continue;
      const inj = show.injuryResults || [];
      const retire = inj.filter(ir => ir.retireType).length;
      const plain = inj.filter(ir => !ir.retireType).length;
      const departed = ((show.state && show.state._pendingSuddenDepartures) || []).length;
      if (retire >= minRetire && plain >= minPlainInjury && departed >= minDeparted) {
        return { seed, tried, retire, plain, departed };
      }
    }
    return { seed: null, tried };
  };

  // ── 実プレイ経路 ──────────────────────────────────────────────
  // mode: 'skipAll'(残り全試合スキップ) | 'skipEach'(1試合ずつスキップ=観戦と同じ前処理)
  K1.runApp = function runApp(G0, options = {}) {
    K1.installRngTap();
    const mode = options.mode || 'skipAll';
    const out = { errors: [], notes: [], mode };
    const origTick = Engine.tickWeek;
    const origAdvance = App.advanceFromWeekSummary;
    let closeTick = null;
    let showTap = null;
    let tickTap = null;

    Engine.tickWeek = function spiedTickWeek(state, tickOptions) {
      const stack = String(new Error().stack || '');
      const fromClose = stack.includes('closeShowResult');
      if (!fromClose) {
        // 結果画面のインライン Glimpse 用の「先読み tick」など。乱数計数は止める。
        // 先読み tick が G を直接書き換えていないか(引数の共有部分を破壊的に変えていないか)を
        // 呼ぶ前後の G で確かめるため、前後の G を写し取っておく。
        const caller = stack.split('\n').slice(2, 4).map(s => s.trim()).join(' <- ');
        out.notes.push(`tickWeek called outside closeShowResult (${caller})`);
        const paused = pauseTap();
        const gBefore = clone(G);
        try {
          return origTick.call(Engine, state, tickOptions);
        } finally {
          resumeTap(paused);
          (out.previewTicks = out.previewTicks || []).push({ caller, gBefore, gAfter: clone(G) });
        }
      }
      showTap = K1.stopRngTap();
      const input = clone(state);
      K1.startRngTap();
      const result = origTick.call(Engine, state, tickOptions);
      tickTap = K1.stopRngTap();
      closeTick = { input, output: clone(result.state), events: clone(result.events || []) };
      K1.startRngTap(); // 以降(closeShowResult の後段)の計数
      return result;
    };
    App.advanceFromWeekSummary = function stoppedAdvance() {
      out.final = clone(G);
      return false;
    };

    try {
      G = clone(G0);
      K1.reseedMathRandom(options.mathSeed || 0x1234);
      K1.startRngTap();
      try { App.executeShow(); } catch (error) { out.errors.push(`App.executeShow threw: ${error && error.stack || error}`); }
      const sp = App._showPreview;
      if (!sp) {
        out.errors.push('App._showPreview is empty after App.executeShow (the show did not start)');
        out.rngShow = K1.stopRngTap();
        out.stateAtFailure = clone(G);
        return out;
      }
      out.validMatchCount = sp.validMatches.length;
      out.intrusion = App._intrusionData ? { intruderId: App._intrusionData.intruder && App._intrusionData.intruder.id, champId: App._intrusionData.champId } : null;
      try {
        if (mode === 'skipEach') {
          for (let i = 0; i < sp.validMatches.length; i++) {
            if (!sp.results[i]) App.skipMatch(i);
          }
          // 最後の試合結果ポップアップの「次へ」が呼ぶのと同じ関数
          if (App._showPreview && App._showPreview.results.every(r => r !== null)) App.finalizeShow();
        } else {
          App.skipAllMatches();
        }
      } catch (error) {
        out.errors.push(`skip/finalize threw: ${error && error.stack || error}`);
      }
      out.afterFinalize = clone(G);
      out.lastInjuries = clone(App._lastInjuries || []);
      if (G.weekPhase !== 'showExec') {
        out.errors.push(`after finalize weekPhase=${G.weekPhase} (expected showExec)`);
      }
      for (let attempt = 0; attempt < 3 && !closeTick; attempt++) {
        try { App.closeShowResult(); } catch (error) { out.errors.push(`App.closeShowResult threw: ${error && error.stack || error}`); }
        if (!closeTick) out.notes.push(`closeShowResult attempt ${attempt + 1} returned before tickWeek`);
      }
      out.rngPost = K1.stopRngTap();
      out.rngShow = showTap;
      out.rngTick = tickTap;
      if (closeTick) {
        out.tickInput = closeTick.input;
        out.tickOutput = closeTick.output;
        out.tickEvents = closeTick.events;
      } else {
        out.errors.push('closeShowResult never reached Engine.tickWeek');
      }
      if (!out.final) out.final = clone(G);
      return out;
    } finally {
      Engine.tickWeek = origTick;
      App.advanceFromWeekSummary = origAdvance;
    }
  };

  window.__k1 = K1;
})();
