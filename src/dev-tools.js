// Hidden developer tools. Open with Ctrl+Shift+D; normal saves are never overwritten while active.
(function () {
  'use strict';

  const DEV_AUTOSAVE_KEY = 'wm_dev_autosave';
  const DEV_SESSION_BASE_KEY = 'wm_dev_session_base';
  const DEV_CHECKPOINT_PREFIX = 'wm_dev_checkpoint_';
  let active = false;
  let panel = null;
  const originalAutoSave = Storage.autoSave.bind(Storage);

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function phaseLabel(state) { return `S${state.season} / ${state.offSeason ? `OFF ${state.offWeek || 0}` : `W${state.week}`} / ${state.weekPhase || 'manage'}`; }
  function checkpointKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(DEV_CHECKPOINT_PREFIX)) keys.push(key); }
    return keys.sort().reverse();
  }
  function saveDevAuto() { try { localStorage.setItem(DEV_AUTOSAVE_KEY, Storage.serialize(G, '開発用オートセーブ')); } catch (e) { console.warn('[WM Dev] autosave failed', e); } }
  // Redirect every existing auto-save call only while the hidden mode is active.
  Storage.autoSave = function () { return active ? saveDevAuto() : originalAutoSave(); };
  function saveCheckpoint(label) {
    const safeLabel = String(label || '確認用').trim().slice(0, 32) || '確認用';
    localStorage.setItem(`${DEV_CHECKPOINT_PREFIX}${String(Date.now())}_${safeLabel}`, Storage.serialize(G, safeLabel));
    saveDevAuto();
    return safeLabel;
  }
  function restore(raw) {
    if (!raw || !Storage.deserialize(raw)) throw new Error('開発用セーブの読み込みに失敗しました。');
    sessionRng = Engine.rng.create(G.rngSeed);
    if (App._refreshTicker) App._refreshTicker();
    showScreen('week'); refreshAll(); Audio.bgm.playForState();
  }
  function defaultSchedules(state) {
    return { ...state, roster: (state.roster || []).map(f => {
      if (f.injury || f.isRental || f.forcedRest) return f;
      const schedule = (f.condition || 0) < 80 ? 'rest' : ((f.schedule || 'balance') === 'rest' ? 'balance' : (f.schedule || 'balance'));
      return { ...f, schedule, intensive: false };
    }) };
  }
  function defaultShowCard(state) {
    const available = (state.roster || []).filter(f => !f.injury && !f.isRental && (f.condition || 0) >= 35).sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const card = [];
    for (let i = 0; i + 1 < available.length && card.length < 4; i += 2) card.push({ left: available[i].id, right: available[i + 1].id, isTitle: false });
    return { ...state, showCard: card, showVenue: state.showVenue || 0 };
  }
  function clearTransient(state) {
    const keys = ['_pendingChoiceEvent','_pendingNotifEvent','_pendingLargeEvent','_pendingTeamSpirit','_pendingGrowthEvents','_pendingMotivationRetirements','_pendingCoachReport','_flavorEvents','_pendingEliteTicket','_pendingFactionEvent','_pendingGlimpseA','_pendingGlimpseB','_pendingHotStreakEnds','_pendingMilestone','_pendingTrustReveals','_pendingR3Modal','_pendingPreWindowWarning','_pendingEmptyVenue','_pendingAIGrowthAlerts','tenchosenPreEvent'];
    const next = { ...state, gameLog: [], debugLog: [], weekLogFeed: [] }; keys.forEach(key => { delete next[key]; }); return next;
  }
  function resolveDefaultBlockingPhase(state) {
    let next = state;
    if (next.weekPhase === 'draft') {
      const picks = [];
      const candidates = Engine.draft.getCandidateInfo(next.rngSeed, 0).sort((a, b) => b.ovr - a.ovr);
      for (const candidate of candidates) {
        if (picks.length >= DRAFT_CONFIG.pickCount) break;
        const trial = [...picks, candidate.id];
        if (Engine.draft.canAffordSelection(next, trial, next.rngSeed)) picks.push(candidate.id);
      }
      if (!Engine.draft.isValidPicks(picks)) throw new Error('既定のドラフト編成を確定できませんでした。');
      next = Engine.draft.completeDraft(next, picks, Engine.rng.create(next.rngSeed));
      next = Engine.career.generateAllBackstories(next);
      next = Engine.relationships.initialize(next);
      next = Engine.career.generateInheritedRecords(next);
      next = Engine.prologue.create(next);
    }
    if (next.springTagPhase === 'entry' && next.springTagLeague && !next.springTagLeague.cancelled) {
      const pair = Engine.springTagLeague.bestPair(next, next.roster || []); if (pair) next = Engine.springTagLeague.confirmPlayerTeam(next, pair.f1Id, pair.f2Id);
    }
    if (next.autumnWarPhase === 'entry' && next.autumnWar && !next.autumnWar.cancelled) {
      const memberIds = Engine.autumnWar._selectMembers(next, 'player');
      if (memberIds.length === Engine.autumnWar.TEAM_SIZE) next = Engine.autumnWar.confirmPlayerTeam(next, memberIds, Engine.autumnWar._defaultOrder(next, 'player', memberIds));
    }
    if (next.ppvTournament?.phase === 'entry') next = Engine.ppvTournament.confirmPlayerEntries(next, Engine.ppvTournament.suggestPlayerEntries(next));
    if (next.weekPhase === 'contractNegotiation') {
      (next.pendingContractNegotiations || []).forEach(neg => { const rng = Engine.rng.create(Engine.rng.derive(next.rngSeed, next.season, 0xC0E7, neg.fighterId, 2)); next = Engine.contract.resolveNegotiation(rng, next, neg, 0).state; });
      delete next.pendingContractNegotiations; delete next._contractAutoRenewed; next = { ...next, weekPhase: 'offseason' };
    }
    if (next.weekPhase === 'scoutEvent' || next.weekPhase === 'event' || next.weekPhase === 'transfer') next = { ...next, weekPhase: 'manage' };
    if (next.weekPhase === 'juniorTournament') {
      const selection = next._juniorTournamentSelection || Engine.juniorTournament.select(next);
      const rng = Engine.rng.create(Engine.rng.derive(next.rngSeed, next.season, 0xBB10));
      next = Engine.juniorTournament.apply(next, Engine.juniorTournament.run(next, selection.participants, rng)).state;
      // apply()の非キャンセル分岐はweekPhaseを'manage'に戻さない（実UIのApp.finalizeJuniorTournamentが
      // finishUp内で明示的に戻している）。ここで戻さないとtickWeek()がこの週スキップされてしまう。
      next = { ...next, weekPhase: 'manage' };
    }
    if (next._pendingAutumnWarReplay) { delete next._pendingAutumnWarReplay; next = { ...next, autumnWarPhase: 'result', weekPhase: 'manage' }; }
    if (next.weekPhase === 'ppvShow' || next.weekPhase === 'ppvTV') next = { ...next, weekPhase: 'manage', ppvPhase: null };
    return clearTransient(next);
  }
  function advanceOneDefault(state) {
    let next = resolveDefaultBlockingPhase(state);
    if (next.weekPhase === 'manage') {
      next = defaultSchedules(next);
      // 天頂戦(第48週)・春のタッグリーグ(第12週)・秋4団体対抗戦(第36週)・
      // ジュニアトーナメント(第24週、開催成立時)は Engine.advanceWeek()/tickWeek() や
      // 上のresolveDefaultBlockingPhaseが自動でその週の興行を処理する。ここで通常興行も
      // 組むと、早送り時だけ同じ週に通常興行が重複してしまう（実プレイでも各種 *IsEventWeek()
      // により通常興行ボタンはブロックされ、この週は専用イベントが興行を代替する）。
      const isTenchosenShowWeek = next.week === Engine.ppvTournament.SHOW_WEEK
        && Engine.ppvTournament.isTournamentSeason(next.season);
      const isSpringTagWeek = next.week === Engine.springTagLeague.LEAGUE_WEEK
        && next.springTagLeague && !next.springTagLeague.cancelled;
      const isAutumnWarWeek = next.week === Engine.autumnWar.EVENT_WEEK
        && next.autumnWar && !next.autumnWar.cancelled;
      const isJuniorTournamentWeek = next.week === Engine.juniorTournament.WEEK
        && next._juniorTournamentResult && !next._juniorTournamentResult.cancelled;
      if (!next.offSeason && Engine.util.isShowWeek(next.week) && !isTenchosenShowWeek && !isSpringTagWeek && !isAutumnWarWeek && !isJuniorTournamentWeek) {
        const prepared = defaultShowCard(next); const show = prepared.showCard.length ? Engine.executeShow(prepared) : null; next = show?.state || prepared;
      }
      next = { ...Engine.tickWeek(next).state, gameLog: [] };
    }
    return clearTransient({ ...Engine.advanceWeek(next).state, gameLog: [] });
  }
  function targetReached(state, season, week) { return !state.offSeason && state.season === season && state.week === week; }
  function fastForward(season, week, label) {
    const targetSeason = Math.max(1, Number(season) || G.season || 1), targetWeek = Math.min(48, Math.max(1, Number(week) || 1));
    if (targetReached(G, targetSeason, targetWeek)) { saveCheckpoint(label || `S${targetSeason}W${targetWeek}`); renderPanel('すでに指定週です。チェックポイントを保存しました。'); return; }
    let state = G, steps = 0;
    while (!targetReached(state, targetSeason, targetWeek) && steps++ < 320) {
      state = advanceOneDefault(state);
      if (state.weekPhase === 'gameover') throw new Error('高速進行中にゲームオーバーになりました。直前のチェックポイントから条件を調整してください。');
      if (state.season > targetSeason || (state.season === targetSeason && !state.offSeason && state.week > targetWeek)) throw new Error('指定週を通過しました。目標は現在より後の日付を指定してください。');
    }
    if (!targetReached(state, targetSeason, targetWeek)) throw new Error('高速進行の上限に達しました。');
    // The requested week is the inspection point: do not consume its tournament/entry flow.
    G = state; saveCheckpoint(label || `S${targetSeason}W${targetWeek}`); saveDevAuto();
    sessionRng = Engine.rng.create(G.rngSeed); if (App._refreshTicker) App._refreshTicker(); showScreen('week'); refreshAll();
    renderPanel(`${phaseLabel(G)} で停止し、開発用チェックポイントを保存しました。`);
  }
  function presetRows() {
    let tenchosenSeason = G.season || 1; while (!Engine.ppvTournament.isTournamentSeason(tenchosenSeason)) tenchosenSeason++;
    return [['春タッグ編成', G.season, Engine.springTagLeague.ENTRY_WEEK],['夏ジュニア大会', G.season, Engine.juniorTournament.WEEK],['秋4団体対抗戦', G.season, Engine.autumnWar.EVENT_WEEK],['冬・天頂戦', tenchosenSeason, Engine.ppvTournament.SHOW_WEEK]];
  }
  function renderPanel(message) {
    if (!panel) return;
    const checkpoints = checkpointKeys().map(key => { try { const s = Storage._parseRaw(localStorage.getItem(key)); return { key, label: s._saveName || key.slice(DEV_CHECKPOINT_PREFIX.length), phase: phaseLabel(s) }; } catch (_) { return null; } }).filter(Boolean);
    const presets = presetRows().map(([name, season, week]) => `<button data-dev-preset="${season}:${week}:${esc(name)}">${esc(name)}<small>S${season} W${week}</small></button>`).join('');
    const restores = checkpoints.length ? checkpoints.map(c => `<button data-dev-restore="${esc(c.key)}">${esc(c.label)}<small>${esc(c.phase)}</small></button>`).join('') : '<div class="wm-dev-empty">まだ開発用チェックポイントはありません。</div>';
    panel.innerHTML = `<div class="wm-dev-backdrop" data-dev-close></div><section class="wm-dev-card" role="dialog" aria-modal="true" aria-label="開発者モード"><header><div><b>DEVELOPER MODE</b><span>通常オートセーブは保護されています</span></div><button data-dev-close aria-label="閉じる">×</button></header><p class="wm-dev-status">${esc(message || `${phaseLabel(G)} — すべての自動選択は既定値で処理します。`)}</p><div class="wm-dev-grid"><label>シーズン<input id="wmDevSeason" type="number" min="1" value="${G.season || 1}"></label><label>週<input id="wmDevWeek" type="number" min="1" max="48" value="${G.week || 1}"></label></div><button class="wm-dev-primary" data-dev-go>指定週まで高速進行して保存</button><div class="wm-dev-section"><b>大会プリセット</b><div class="wm-dev-buttons">${presets}</div></div><div class="wm-dev-section"><b>検証用チェックポイント</b><div class="wm-dev-buttons"><button data-dev-base>開発開始地点へ戻す</button><button data-dev-save>現在地を保存</button>${restores}</div></div><p class="wm-dev-note">開く: Ctrl + Shift + D ／ 高速進行中は興行・選択イベントを既定値で自動処理します。通常のオートセーブと手動セーブには書き込みません。</p></section>`;
    panel.querySelectorAll('[data-dev-close]').forEach(el => el.addEventListener('click', close));
    panel.querySelector('[data-dev-go]').addEventListener('click', () => { try { fastForward(panel.querySelector('#wmDevSeason').value, panel.querySelector('#wmDevWeek').value); } catch (e) { renderPanel(e.message); } });
    panel.querySelectorAll('[data-dev-preset]').forEach(el => el.addEventListener('click', () => { const [season, week, label] = el.dataset.devPreset.split(':'); try { fastForward(season, week, label); } catch (e) { renderPanel(e.message); } }));
    panel.querySelector('[data-dev-save]').addEventListener('click', () => renderPanel(`「${saveCheckpoint(phaseLabel(G))}」を保存しました。`));
    panel.querySelector('[data-dev-base]').addEventListener('click', () => { try { restore(localStorage.getItem(DEV_SESSION_BASE_KEY)); renderPanel('開発開始地点へ戻しました。'); } catch (e) { renderPanel(e.message); } });
    panel.querySelectorAll('[data-dev-restore]').forEach(el => el.addEventListener('click', () => { try { restore(localStorage.getItem(el.dataset.devRestore)); renderPanel('チェックポイントを復元しました。'); } catch (e) { renderPanel(e.message); } }));
  }
  function open() {
    if (!active) localStorage.setItem(DEV_SESSION_BASE_KEY, Storage.serialize(G, '開発開始地点'));
    active = true;
    if (!panel) { panel = document.createElement('div'); panel.id = 'wmDevPanel'; document.body.appendChild(panel); }
    renderPanel();
  }
  function close() { if (panel) panel.remove(); panel = null; }
  document.addEventListener('keydown', event => { if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') { event.preventDefault(); open(); } });
  window.WrestleManagerDev = { open, saveCheckpoint, fastForward, restoreDevAutosave: () => restore(localStorage.getItem(DEV_AUTOSAVE_KEY)) };
})();
