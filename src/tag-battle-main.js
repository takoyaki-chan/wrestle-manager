// tag-battle メインロジック — Replay flow (UI refresh 2026-04-17)
// モックアップ archive/prototype/tag-match-prototype-v0.1/match-screen-tag.html 準拠
let matchData = null;
const S = {
  result: null,
  frames: [],
  frameIdx: 0,
  fighters: {},            // {a1,a2,b1,b2}
  pos: { legalA: 'a1', apronA: 'a2', legalB: 'b1', apronB: 'b2' },
  idToKey: {},
  lastCritTurn: {},
  mom: 0,
  logHtml: '',             // 累積ログHTML (forward方向のみ追記)
  lastEventClass: '',
  anim: false,
  autoAdvance: false,
  autoTimer: null,
  speedIdx: 0,             // 0=slow 1=mid 2=fast
  pendingCutin: false,
  pinCtrl: null,           // { seq, idx, fr } — クリック駆動ピンカウント制御
  pendingDamage: false,    // ダメージポップアップ表示中 (クリック待ち)
  matchInfo: null,
  chemA: 0,
  chemB: 0,
  prevSnap: null,          // 前フレーム(タッチ検出用)
};
const SPEED_DELAYS = [2500, 1500, 800];

// ── 初期画面 ──
function renderWaiting(){
  document.getElementById('mainContainer').innerHTML = `<div class="waiting">
    <div class="waiting-title">STANDBY</div>
    <div class="waiting-sub">タッグマッチデータの受信を待機中…</div>
    <div class="waiting-pulse"></div>
  </div>`;
}
renderWaiting();

// ── postMessage 受信 ──
window.addEventListener('message', function(e){
  if (!e.data || e.data.type !== 'START_TAG_MATCH') return;
  matchData = e.data;
  const mi = matchData.matchInfo || {};
  _ensureMasterGains();
  if (mi.sfxMasterVol !== undefined) _sfxMasterGain.gain.value = mi.sfxMasterVol;
  if (mi.bgmMasterVol !== undefined) _bgmMasterGain.gain.value = mi.bgmMasterVol;
  startReplay(e.data);
});

function startReplay(data){
  S.result = data.result;
  S.frames = data.result.frames || [];
  S.frameIdx = 0;
  S.matchInfo = data.matchInfo || {};
  S.chemA = data.result.chemA || 50;
  S.chemB = data.result.chemB || 50;
  S.logHtml = '';
  S.lastEventClass = '';
  S.mom = 0;
  S.lastCritTurn = {};
  S.prevSnap = null;
  S.autoAdvance = false;
  clearTimeout(S.autoTimer);

  const mk = (c) => {
    const st = Math.min(100, Math.max(0, c.st || 60));
    const mhp = Math.round(85 + st * 1.20);
    return { ...c, hp: mhp, mhp, gritTurns: 0, hotTagBuff: 0 };
  };
  S.fighters = {
    a1: mk(data.teamA.fighter1),
    a2: mk(data.teamA.fighter2),
    b1: mk(data.teamB.fighter1),
    b2: mk(data.teamB.fighter2),
  };
  S.pos = { legalA: 'a1', apronA: 'a2', legalB: 'b1', apronB: 'b2' };
  S.idToKey = {};
  ['a1','a2','b1','b2'].forEach(k => { S.idToKey[S.fighters[k].id] = k; });

  renderMatchFrame();
  try { sfx.gong(); } catch(e){}
}

// ── アクセサ ──
function f(key){ return S.fighters[key]; }
function byId(id){ return S.fighters[S.idToKey[id]]; }
function keyById(id){ return S.idToKey[id]; }
function hpCls(ratio){ return ratio <= 0.33 ? 'danger' : ratio <= 0.55 ? 'warn' : ''; }
function _getCurrentFrame(){ return S.frameIdx > 0 && S.frames[S.frameIdx - 1] ? S.frames[S.frameIdx - 1] : null; }

// ── メイン画面(全体)描画 ──
// 試合開始直後の初期描画と、大きな構造リセットが必要な時だけ呼ぶ。
// applyFrame 内の差分更新 (_updateHud/_updateCard/_updateCenter/_appendLog) はピンポイント書換。
function renderMatchFrame(){
  const container = document.getElementById('mainContainer');
  const curFrame = _getCurrentFrame();

  container.innerHTML = `
    ${_hudHtml(curFrame)}
    ${_chemBarHtml()}
    <div class="main-row">
      <div class="col-side left" id="col-a">
        ${_playerCardHtml('a', 'legal', S.pos.legalA)}
        ${_apronCardHtml('a', S.pos.apronA)}
      </div>
      <div class="col-center-top" id="col-center">
        ${_moveDisplayHtml(curFrame)}
        <div class="battle-log" id="battleLog"><div class="log-header-label">BATTLE LOG</div>${S.logHtml}</div>
      </div>
      <div class="col-side right" id="col-b">
        ${_playerCardHtml('b', 'legal', S.pos.legalB)}
        ${_apronCardHtml('b', S.pos.apronB)}
      </div>
    </div>
    ${_controlsHtml()}
  `;
  _bindNextButton();
  _scrollLogToTop();
}

function _fighterHpPct(ch){
  if (!ch) return { pct: 0, ratio: 0 };
  const ratio = ch.mhp > 0 ? Math.max(0, ch.hp) / ch.mhp : 0;
  // hp > 0 なら最低 1% 表示（Math.round で 0 になる誤表示を防ぐ）
  const pct = ch.hp > 0 ? Math.max(1, Math.round(ratio * 100)) : 0;
  return { pct, ratio };
}
function _hudHtml(fr){
  const turn = fr ? fr.turn : 0;
  const phase = fr ? fr.phase : 'Opening';
  const segIdx = fr ? fr.segmentIdx : 0;
  const teamA = [f(S.pos.legalA), f(S.pos.apronA)];
  const teamB = [f(S.pos.legalB), f(S.pos.apronB)];
  // HUD HP: チーム合算ではなくレガル選手個人のHP
  const hpA = _fighterHpPct(f(S.pos.legalA));
  const hpB = _fighterHpPct(f(S.pos.legalB));
  const legalAName = f(S.pos.legalA) ? f(S.pos.legalA).name : '';
  const legalBName = f(S.pos.legalB) ? f(S.pos.legalB).name : '';
  // mom は -50〜+50 → -1〜+1 に正規化。エンジン側規約: A(左)が攻撃ヒットで mom+方向。
  // バーは攻撃を決めた側が伸びる見え方にする (シングル battle-engine.html と同規約)
  const momNorm = S.mom / 50;
  const momL = 50 + momNorm * 30;
  const momR = 50 - momNorm * 30;
  const header = (S.matchInfo && S.matchInfo.header) || 'TAG MATCH';

  return `<div class="wm-hud">
    <div class="wm-hud-top">
      <div class="wm-hud-side">
        <div class="wm-hud-faces">${teamA.map(x=>`<div class="wm-hud-face"><img src="${getFaceUrl(x)}" onerror="this.style.display='none'"></div>`).join('')}</div>
        <div class="wm-hud-meta">
          <div class="wm-hud-label">Aチーム</div>
          <div class="wm-hud-name" title="${escHtml(teamA.map(x=>x.name).join(' & '))}">${escHtml(teamA.map(x=>x.name).join(' & '))}</div>
        </div>
      </div>
      <div class="wm-hud-center">
        <div class="wm-hud-turn" id="hudTurn">TURN ${turn || 1}</div>
        <div class="wm-hud-phase" id="hudPhase">${escHtml(String(phase).toUpperCase())}</div>
        <div class="wm-hud-seg" id="hudSeg">SEG ${segIdx + 1}　${escHtml(header)}</div>
      </div>
      <div class="wm-hud-side" style="flex-direction:row-reverse">
        <div class="wm-hud-faces">${teamB.map(x=>`<div class="wm-hud-face"><img src="${getFaceUrl(x)}" onerror="this.style.display='none'"></div>`).join('')}</div>
        <div class="wm-hud-meta right">
          <div class="wm-hud-label">Bチーム</div>
          <div class="wm-hud-name" title="${escHtml(teamB.map(x=>x.name).join(' & '))}">${escHtml(teamB.map(x=>x.name).join(' & '))}</div>
        </div>
      </div>
    </div>
    <div class="wm-mom">
      <div class="wm-mom-l" id="momL" style="width:${clamp(momL,0,100)}%"></div>
      <div class="wm-mom-r" id="momR" style="width:${clamp(momR,0,100)}%"></div>
    </div>
    <div class="wm-hp-row">
      <span class="wm-hp-name" id="hudHpNameA">${escHtml(legalAName)}</span>
      <span class="wm-hp-pct ${hpCls(hpA.ratio)}" id="hudHpPctA">${hpA.pct}%</span>
      <div class="wm-hp-bar"><div class="wm-hp-fill ${hpCls(hpA.ratio)}" id="hudHpFillA" style="width:${hpA.pct}%"></div></div>
      <span class="wm-hp-label">HP</span>
      <div class="wm-hp-bar"><div class="wm-hp-fill rev ${hpCls(hpB.ratio)}" id="hudHpFillB" style="width:${hpB.pct}%"></div></div>
      <span class="wm-hp-pct ${hpCls(hpB.ratio)}" id="hudHpPctB">${hpB.pct}%</span>
      <span class="wm-hp-name right" id="hudHpNameB">${escHtml(legalBName)}</span>
    </div>
  </div>`;
}

function _teamHpSum(team){
  const hp = team.reduce((a,c)=>a + Math.max(0,c.hp), 0);
  const mhp = team.reduce((a,c)=>a + c.mhp, 0);
  const ratio = mhp > 0 ? hp/mhp : 0;
  return { pct: Math.round(ratio * 100), ratio };
}

function _chemBarHtml(){
  return `<div class="chem-bar">
    <span class="chem-label">連携 A</span>
    <span class="chem-a">${Math.round(S.chemA)}</span>
    <span class="chem-sep">／</span>
    <span class="chem-label">連携 B</span>
    <span class="chem-b">${Math.round(S.chemB)}</span>
  </div>`;
}

function _playerCardHtml(side, layer, posKey){
  const ch = f(posKey);
  const ratio = ch.mhp > 0 ? Math.max(0,ch.hp)/ch.mhp : 0;
  const pct = ch.hp > 0 ? Math.max(1, Math.round(ratio*100)) : 0;
  const cls = ['player-card'];
  if (ratio <= 0.33) cls.push('danger');
  if (ch.gritTurns > 0) cls.push('grit-active');
  if (ch.hotTagBuff > 0) cls.push('hot-tag-buff');
  const ovr = _calcOvr(ch);
  const isA = side === 'a';
  const portraitUrl = getStandUrl(ch);
  const nameRow = isA
    ? `<span class="player-name" onclick="openBp('${posKey}')">${escHtml(ch.name)}</span><span class="badge badge-inring">IN RING</span>`
    : `<span class="badge badge-inring">IN RING</span><span class="player-name" onclick="openBp('${posKey}')">${escHtml(ch.name)}</span>`;
  const styleOvr = isA ? `${escHtml(ch.style||'')}   OVR ${ovr}` : `OVR ${ovr}   ${escHtml(ch.style||'')}`;
  return `<div class="${cls.join(' ')}" id="card-${side}-legal">
    <div class="portrait-area">
      <div class="portrait-holder" id="portrait-${side}-legal"><img src="${portraitUrl}" alt="${escHtml(ch.name)}" onerror="this.style.display='none'"></div>
      <div class="monitor-frame"></div>
      <div class="danger-glow" id="danger-${side}"${ratio <= 0.25 && ratio > 0 ? ' style="opacity:1"' : ''}></div>
    </div>
    <div class="player-detail">
      <div class="name-row${isA?'':' right'}" id="namerow-${side}-legal">${nameRow}</div>
      <div class="style-ovr${isA?'':' right'}" id="styleovr-${side}-legal">${styleOvr}</div>
      <div class="card-hp-wrap">
        <div class="card-hp-track${isA?'':' rtl'}"><div class="card-hp-fill ${hpCls(ratio)}" id="cardhp-${side}-legal" style="width:${pct}%"></div></div>
        <span class="card-hp-text ${hpCls(ratio)}${isA?'':' right'}" id="cardhptext-${side}-legal">${Math.max(0,Math.round(ch.hp))} / ${ch.mhp} (${pct}%)</span>
      </div>
      <div class="stats-grid" id="stats-${side}-legal">${_statsHtml(ch, side)}</div>
    </div>
  </div>`;
}

function _apronCardHtml(side, posKey){
  const ch = f(posKey);
  const ratio = ch.mhp > 0 ? Math.max(0,ch.hp)/ch.mhp : 0;
  const pct = ch.hp > 0 ? Math.max(1, Math.round(ratio*100)) : 0;
  const isA = side === 'a';
  const ovr = _calcOvr(ch);
  const upperUrl = getUpperUrl(ch);
  const nameRow = isA
    ? `<span class="apron-name" onclick="openBp('${posKey}')">${escHtml(ch.name)}</span><span class="apron-badge">APRON</span>`
    : `<span class="apron-badge">APRON</span><span class="apron-name" onclick="openBp('${posKey}')">${escHtml(ch.name)}</span>`;
  const styleOvr = isA ? `${escHtml(ch.style||'')}   OVR ${ovr}` : `OVR ${ovr}   ${escHtml(ch.style||'')}`;
  return `<div class="apron-card${isA?'':' right'}" id="card-${side}-apron">
    <div class="apron-avatar" onclick="openBp('${posKey}')"><img src="${upperUrl}" onerror="this.style.display='none'"></div>
    <div class="apron-info${isA?'':' right'}">
      <div class="apron-name-row${isA?'':' right'}" id="apronrow-${side}">${nameRow}</div>
      <div class="apron-style" id="apronstyle-${side}">${styleOvr}</div>
      <div class="apron-hp-row${isA?'':' right'}" id="apronhp-${side}">
        <span class="apron-hp-val ${hpCls(ratio)}${isA?'':' right'}">${pct}%</span>
        <div class="apron-hp-track${isA?'':' rtl'}"><div class="apron-hp-fill ${hpCls(ratio)}" style="width:${pct}%"></div></div>
      </div>
      <div class="apron-recovery${isA?'':' right'}">▲ 回復中</div>
      <div class="stats-grid apron-stats" id="apron-stats-${side}">${_statsHtml(ch, side)}</div>
    </div>
  </div>`;
}

function _statsHtml(fighter, side){
  const stats = [
    {k:'pw', l:'PWR', cls:'pwr'},
    {k:'sp', l:'SPD', cls:'spd'},
    {k:'te', l:'TEC', cls:'tec'},
    {k:'st', l:'STA', cls:'sta'},
    {k:'mn', l:'MNT', cls:'mnt'},
  ];
  const rtl = side === 'b';
  return stats.map(s => {
    const val = Math.round(fighter[s.k] || 0);
    return `<div class="stat-row${rtl?' rtl':''}">
      <span class="stat-label">${s.l}</span>
      <div class="stat-bar-track${rtl?' rtl':''}"><div class="stat-bar-${s.cls}" style="width:${val}%"></div></div>
      <span class="stat-val">${val}</span>
    </div>`;
  }).join('');
}

function _moveDisplayHtml(fr){
  const move = fr && fr.action ? fr.action.move : '-';
  const nar = fr ? _narrateFrame(fr) : { text:'試合開始 — NEXT TURNを押してください', dramatic:false };
  const dmgText = fr && fr.action ? _dmgText(fr.action) : { text:'', cls:'' };
  return `<div class="move-display" id="moveDisplay">
    <div class="move-label">CURRENT MOVE</div>
    <div class="bigmove-splash" id="bigmoveSplash"></div>
    <div class="move-name" id="moveName">${escHtml(move)}</div>
    <div class="move-damage ${dmgText.cls}" id="moveDmg">${dmgText.text}</div>
    <div class="move-narration ${nar.dramatic?'dramatic':''}" id="moveNarration">${nar.text}</div>
    <div class="flash-overlay" id="flashOverlay"></div>
  </div>`;
}

function _dmgText(action){
  if (action.kind === 'miss') return { text: 'MISS', cls: 'miss' };
  if (action.kind === 'counter') return { text: `COUNTER! -${action.dmg}`, cls: 'counter' };
  if (action.kind === 'hit') return { text: `-${action.dmg} ダメージ`, cls: 'hit' };
  return { text: '', cls: '' };
}

function _narrateFrame(fr){
  if (!fr) return { text:'', dramatic:false };
  // イベント優先
  if (fr.events && fr.events.length) {
    const ev = fr.events[fr.events.length - 1];
    if (ev.type === 'hotTag') return { text:'会場が一気に沸いた！ 反撃のタッチだーーっ！', dramatic:true };
    if (ev.type === 'doubleTeam') return { text:'二人がかりの合体攻撃！ これがタッグの醍醐味だ！', dramatic:true };
    if (ev.type === 'cutinSave') return { text:'パートナーが間一髪で救出！ これがタッグマッチ！', dramatic:true };
    if (ev.type === 'friendlyFire') return { text:'あーっと！ 味方に当たってしまった！ 痛恨のミス！', dramatic:true };
    if (ev.type === 'betrayal') return { text:'助けに行かない…！ なんということだ…！', dramatic:true };
  }
  if (fr.winner) return { text:'決着！', dramatic:true };
  const a = fr.action;
  if (!a) return { text: (fr.logLines||[]).join(' '), dramatic:false };
  const atk = byId(a.attackerId);
  const def = byId(a.defenderId);
  if (!atk || !def) return { text: escHtml(a.move||''), dramatic:false };
  if (a.kind === 'miss') return { text: `${escHtml(atk.name)}の${escHtml(a.move)} → かわされた！`, dramatic:false };
  if (a.kind === 'counter') return { text: `${escHtml(atk.name)}がカウンター！ ${escHtml(a.move)} → ${escHtml(def.name)}に${a.dmg}ダメージ`, dramatic:true };
  const drama = a.isCrit;
  return { text: `${escHtml(atk.name)}の${escHtml(a.move)} → ${escHtml(def.name)}に${a.dmg}ダメージ`, dramatic: drama };
}

function _controlsHtml(){
  const curFrame = _getCurrentFrame();
  const winnerFrame = curFrame && curFrame.winner;
  const endState = winnerFrame || S.frameIdx >= S.frames.length;
  const btnLabel = winnerFrame ? '結果を見る' : (endState ? 'END' : '▶ NEXT TURN');
  const btnDisabled = S.anim || S.pendingCutin;
  const dots = [0,1,2].map(i => `<div class="speed-dot ${i <= S.speedIdx ? 'on' : 'off'}" onclick="setSpeed(${i})"></div>`).join('');
  return `<div class="controls-sub">
    <button class="btn-main" id="nBtn"${btnDisabled ? ' disabled' : ''}>${btnLabel}</button>
    <div class="control-sep"></div>
    <button class="btn btn-auto${S.autoAdvance?' active':''}" id="autoBtn" onclick="toggleAuto()">AUTO<span>${S.autoAdvance?'ON':'OFF'}</span></button>
    <div class="speed-dots">${dots}</div>
  </div>`;
}

function _bindNextButton(){
  const btn = document.getElementById('nBtn');
  if (!btn) return;
  const curFrame = _getCurrentFrame();
  const winnerFrame = curFrame && curFrame.winner;
  if (winnerFrame || S.frameIdx >= S.frames.length) btn.onclick = endMatch;
  else btn.onclick = nextFrame;
}

function _scrollLogToTop(){
  const lb = document.getElementById('battleLog');
  if (lb) lb.scrollTop = 0;
}

// ── 差分更新系 ──
function _updateHud(){
  const fr = _getCurrentFrame();
  // レガル選手個人HP
  const hpA = _fighterHpPct(f(S.pos.legalA));
  const hpB = _fighterHpPct(f(S.pos.legalB));
  const elTurn = document.getElementById('hudTurn');
  const elPhase = document.getElementById('hudPhase');
  const elSeg = document.getElementById('hudSeg');
  if (fr && elTurn) elTurn.textContent = `TURN ${fr.turn}`;
  if (fr && elPhase) elPhase.textContent = String(fr.phase||'').toUpperCase();
  if (fr && elSeg) elSeg.textContent = `SEG ${fr.segmentIdx + 1}　${(S.matchInfo && S.matchInfo.header) || 'TAG MATCH'}`;
  const fillA = document.getElementById('hudHpFillA');
  const pctA = document.getElementById('hudHpPctA');
  const nameA = document.getElementById('hudHpNameA');
  if (fillA) { fillA.style.width = hpA.pct + '%'; fillA.className = 'wm-hp-fill ' + hpCls(hpA.ratio); }
  if (pctA) { pctA.textContent = hpA.pct + '%'; pctA.className = 'wm-hp-pct ' + hpCls(hpA.ratio); }
  if (nameA && f(S.pos.legalA)) nameA.textContent = f(S.pos.legalA).name;
  const fillB = document.getElementById('hudHpFillB');
  const pctB = document.getElementById('hudHpPctB');
  const nameB = document.getElementById('hudHpNameB');
  if (fillB) { fillB.style.width = hpB.pct + '%'; fillB.className = 'wm-hp-fill rev ' + hpCls(hpB.ratio); }
  if (pctB) { pctB.textContent = hpB.pct + '%'; pctB.className = 'wm-hp-pct ' + hpCls(hpB.ratio); }
  if (nameB && f(S.pos.legalB)) nameB.textContent = f(S.pos.legalB).name;
  // モメンタム: -50〜+50 を -1〜+1 に正規化して表示
  const momElL = document.getElementById('momL');
  const momElR = document.getElementById('momR');
  if (momElL && momElR) {
    const momNorm = S.mom / 50;
    const lv = clamp(50 + momNorm * 30, 0, 100);
    momElL.style.width = lv + '%';
    momElR.style.width = (100 - lv) + '%';
  }
}

function _updateCardsAfterFrame(skipLegalA, skipLegalB){
  // タッチ演出中のサイドは legal カードを後で更新するのでスキップ
  if (!skipLegalA) _refreshCard('a', 'legal', S.pos.legalA);
  _refreshCard('a', 'apron', S.pos.apronA);
  if (!skipLegalB) _refreshCard('b', 'legal', S.pos.legalB);
  _refreshCard('b', 'apron', S.pos.apronB);
}

function _refreshCard(side, layer, posKey){
  const id = `card-${side}-${layer}`;
  const el = document.getElementById(id);
  if (!el) return;
  // 選手カードは innerHTML の一部だけ更新(HP・数値)
  const ch = f(posKey);
  const ratio = ch.mhp > 0 ? Math.max(0,ch.hp)/ch.mhp : 0;
  const pct = ch.hp > 0 ? Math.max(1, Math.round(ratio*100)) : 0;
  if (layer === 'legal') {
    // カード内のキャラが変わっていないか確認 — 入れ替わった場合はDOM総入替
    const existingName = el.querySelector('.player-name');
    if (!existingName || existingName.textContent !== ch.name) {
      el.outerHTML = _playerCardHtml(side, 'legal', posKey);
      return;
    }
    // HP 更新
    const fill = document.getElementById(`cardhp-${side}-legal`);
    const text = document.getElementById(`cardhptext-${side}-legal`);
    if (fill) { fill.style.width = pct + '%'; fill.className = 'card-hp-fill ' + hpCls(ratio); }
    if (text) { text.textContent = `${Math.max(0,Math.round(ch.hp))} / ${ch.mhp} (${pct}%)`; text.className = 'card-hp-text ' + hpCls(ratio) + (side==='a'?'':' right'); }
    // danger class
    el.classList.toggle('danger', ratio <= 0.33);
    el.classList.toggle('grit-active', ch.gritTurns > 0);
    el.classList.toggle('hot-tag-buff', ch.hotTagBuff > 0);
    // danger glow
    const glow = document.getElementById(`danger-${side}`);
    if (glow) glow.classList.toggle('show', ratio <= 0.25 && ratio > 0);
  } else {
    // apron: キャラが入れ替わった場合もDOM総入替
    const existingName = el.querySelector('.apron-name');
    if (!existingName || existingName.textContent !== ch.name) {
      el.outerHTML = _apronCardHtml(side, posKey);
      return;
    }
    // HP bar 更新
    const row = document.getElementById(`apronhp-${side}`);
    if (row) {
      const isA = side === 'a';
      row.innerHTML = `<span class="apron-hp-val ${hpCls(ratio)}${isA?'':' right'}">${pct}%</span>` +
        `<div class="apron-hp-track${isA?'':' rtl'}"><div class="apron-hp-fill ${hpCls(ratio)}" style="width:${pct}%"></div></div>`;
    }
  }
}

function _updateCenter(fr){
  const dispHtml = _moveDisplayHtml(fr);
  const disp = document.getElementById('moveDisplay');
  if (disp) disp.outerHTML = dispHtml;
  // pop animation
  const mn = document.getElementById('moveName');
  if (mn) { mn.classList.remove('pop'); void mn.offsetWidth; mn.classList.add('pop'); }
}

function _appendLogForFrame(fr){
  if (!fr) return;
  const evClass = _detectEventClass(fr);
  const turnMarker = `<div class="log-new-marker">— Turn ${fr.turn} —</div>`;
  const lines = (fr.logLines || []).map(l => _logLineHtml(l, fr)).join('');
  // 新しいターンを先頭に追加 (新しい順 = 上が最新)
  S.logHtml = turnMarker + lines + S.logHtml;
  S.lastEventClass = evClass;
  const lb = document.getElementById('battleLog');
  if (lb) {
    lb.innerHTML = `<div class="log-header-label">BATTLE LOG</div>${S.logHtml}`;
    lb.className = 'battle-log' + (evClass ? ' ev-' + evClass : '');
    lb.scrollTop = 0;
  }
}

function _detectEventClass(fr){
  if (!fr) return '';
  if (fr.winner) return 'finish';
  if (fr.events && fr.events.length) {
    const types = fr.events.map(e => e.type);
    if (types.includes('betrayal')) return 'betrayal';
    if (types.includes('hotTag')) return 'hottag';
    if (types.includes('doubleTeam')) return 'double';
    if (types.includes('friendlyFire')) return 'friendly';
    if (types.includes('cutinSave')) return 'cutin';
  }
  // タッチ検出
  if (S.prevSnap && (fr.legalA !== S.prevSnap.legalA || fr.legalB !== S.prevSnap.legalB)) return 'touch';
  return '';
}

function _logLineHtml(line, fr){
  const t = line.trim();
  if (!t) return '';
  if (t.includes('★ 決着') || t.includes('★ ピン') || t.includes('★ タッグ技') || t.includes('時間切れ') || t.includes('丸め込みで逆転')) {
    return `<div class="log-event finish"><span class="log-event-text log-finish-text">${escHtml(t)}</span></div>`;
  }
  if (t.includes('反撃のタッチ')) return `<div class="log-event hottag"><span class="log-event-text log-hottag-text">${escHtml(t)}</span></div>`;
  if (t.includes('ダブルチーム') || t.includes('タッグ技')) return `<div class="log-event double"><span class="log-event-text log-double-text">${escHtml(t)}</span></div>`;
  if (t.includes('カットイン')) return `<div class="log-event cutin"><span class="log-event-text log-cutin-text">${escHtml(t)}</span></div>`;
  if (t.includes('同士討ち')) return `<div class="log-event friendly"><span class="log-event-text log-friendly-text">${escHtml(t)}</span></div>`;
  if (t.includes('見殺し')) return `<div class="log-event betrayal"><span class="log-event-text log-betrayal-text">${escHtml(t)}</span></div>`;
  if (t.includes('↔ タッチ')) return `<div class="log-event touch"><span class="log-event-text log-touch-text">${escHtml(t)}</span></div>`;
  // 通常ターンログ: T1 [phase] ... 形式
  const m = t.match(/^T(\d+)\s+\[[^\]]+\]\s+(.*)$/);
  if (m) return `<div class="log-line"><span style="color:#444">T${m[1]}</span> ${escHtml(m[2])}</div>`;
  return `<div class="log-line">${escHtml(t)}</div>`;
}

// ── フレーム進行 ──
const FRAME_DELAYS = { miss: 700, hit: 900, counter: 1100, crit: 1300 };
function _frameMinDelay(fr){
  if (!fr) return 800;
  // ピンカウントはクリック駆動なので時間加算しない (pinCtrl が進行管理)
  if (fr.winner) return 2200;
  let base = 800;
  if (fr.action) {
    if (fr.action.kind === 'miss') base = FRAME_DELAYS.miss;
    else if (fr.action.kind === 'counter') base = FRAME_DELAYS.counter;
    else if (fr.action.isCrit) base = FRAME_DELAYS.crit;
    else base = FRAME_DELAYS.hit;
  }
  if (fr.events && fr.events.length > 0) base += 500;
  return base;
}

function nextFrame(){
  if (S.anim || S.frameIdx >= S.frames.length) return;
  if (S.pendingCutin) return;
  clearTimeout(S.autoTimer);
  // タッチ検出（applyFrame より前に S.pos で判定）
  const fr = S.frames[S.frameIdx];
  const prevFr = S.frameIdx > 0 ? S.frames[S.frameIdx - 1] : null;
  const touchHappened = prevFr && (fr.legalA !== prevFr.legalA || fr.legalB !== prevFr.legalB);
  S.frameIdx++;
  applyFrame(fr);

  if (fr.winner) {
    // クリック駆動ピン seq が走るフレームは _finishPinSeq が showResult を呼ぶ
    const hasPinSeq = fr.events && fr.events.some(e => e.type === 'pinAttempt' && e.attemptType !== 'gu' && e.attemptType !== 'rollup' && e.attemptType !== 'tko');
    if (hasPinSeq) return;
    setTimeout(() => showResult(fr), 1800);
    return;
  }
  const delay = _frameMinDelay(fr) + (touchHappened ? 750 : 0);
  if (S.autoAdvance && S.frameIdx < S.frames.length) {
    const speedD = SPEED_DELAYS[S.speedIdx] || 1500;
    S.autoTimer = setTimeout(() => nextFrame(), Math.max(delay + 300, speedD));
  }
}

function applyFrame(fr){
  S.anim = true;
  const prevLegalA = S.pos.legalA, prevLegalB = S.pos.legalB;
  const newLegalAKey = keyById(fr.legalA);
  const newLegalBKey = keyById(fr.legalB);
  const newApronAKey = keyById(fr.apronA);
  const newApronBKey = keyById(fr.apronB);
  const touchA = newLegalAKey !== prevLegalA;
  const touchB = newLegalBKey !== prevLegalB;

  // HP/バフ更新
  ['a1','a2','b1','b2'].forEach(k => {
    const ch = S.fighters[k];
    if (fr.hp[ch.id] != null) ch.hp = fr.hp[ch.id];
    if (fr.grit && fr.grit[ch.id] != null) ch.gritTurns = fr.grit[ch.id];
    if (fr.hotTagBuff && fr.hotTagBuff[ch.id] != null) ch.hotTagBuff = fr.hotTagBuff[ch.id];
  });
  // タッチ発生: 旧カードのshrinkアニメを先に開始してから内容を差し替える
  if (touchA) {
    const oldCardA = document.getElementById('card-a-legal');
    if (oldCardA) { oldCardA.classList.remove('tag-out-legal'); void oldCardA.offsetWidth; oldCardA.classList.add('tag-out-legal'); }
  }
  if (touchB) {
    const oldCardB = document.getElementById('card-b-legal');
    if (oldCardB) { oldCardB.classList.remove('tag-out-legal'); void oldCardB.offsetWidth; oldCardB.classList.add('tag-out-legal'); }
  }

  S.pos = { legalA: newLegalAKey, apronA: newApronAKey, legalB: newLegalBKey, apronB: newApronBKey };
  S.mom = fr.mom || 0;

  // DOM 差分更新（タッチ中のlegalカードは後で入れ替えるためスキップ）
  _updateHud();
  _updateCardsAfterFrame(touchA, touchB);
  _updateCenter(fr);
  _appendLogForFrame(fr);

  // エンジン処理順: 攻撃 → タッチ判定 の順なので、
  // アクション演出は必ず「先」に発火させ、その後でタッチ交代アニメを重ねる。
  // touchPause: 「攻撃→タッチ」の間に置くブレス（次ターン開始までの追加余白）
  const touchPause = (touchA || touchB) ? 700 : 0;

  // アクション演出は常に即時発火（攻撃が先、タッチが後という時系列を守る）
  if (fr.action) animateAction(fr.action, fr);
  // ドラマイベントも即時
  if (fr.events && fr.events.length > 0) {
    (fr.events || []).forEach(ev => animateEvent(ev, fr));
  }
  // タッチ演出は即開始（アクション演出と並行）。内部で shrink→370ms→差し替え→grow-in
  if (touchA) animateTouchSwap('a', fr);
  if (touchB) animateTouchSwap('b', fr);
  // ピンイベントを検出 → クリック駆動ピン演出を開始
  const pinEv = fr.events && fr.events.find(e => e.type === 'pinAttempt' && e.attemptType !== 'gu' && e.attemptType !== 'rollup' && e.attemptType !== 'tko');
  // クリティカルダメージセリフ: ピンフレームではピン演出が主役なのでスキップ
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit && !pinEv) {
    setTimeout(() => tryDamageLine(fr.action, fr), 600);
  }
  if (pinEv) _beginPinSequence(pinEv, fr);

  S.prevSnap = { legalA: fr.legalA, legalB: fr.legalB };

  // タッチフレームは次のフレームまでの最低待機時間を延長し、
  // 「交代した選手がすぐ反撃する」のを防ぐ間を作る
  const minDelay = _frameMinDelay(fr) + touchPause;
  setTimeout(() => {
    S.anim = false;
    const btn = document.getElementById('nBtn');
    if (btn && !S.pendingCutin) btn.disabled = false;
    // pin seq 中は onclick を上書きしない (_advancePinStep を保持)
    if (!S.pinCtrl) _bindNextButton();
  }, minDelay);
}

// ── 演出 ──
function animateAction(action, fr){
  const defKey = keyById(action.defenderId);
  const atkKey = keyById(action.attackerId);
  const defSide = (defKey === 'a1' || defKey === 'a2') ? 'a' : 'b';
  const atkSide = (atkKey === 'a1' || atkKey === 'a2') ? 'a' : 'b';

  if (action.kind === 'miss') {
    try { sfx.missWhiff(); } catch(e){}
    return;
  }
  // ダメージポップ (レガル側のみ)
  if (defKey === S.pos.legalA || defKey === S.pos.legalB) {
    _showDmgPop(defSide, action.dmg, action.isCrit, action.kind === 'counter');
  }
  // パネルシェイク
  const defCard = document.getElementById(`card-${defSide}-legal`);
  if (defCard && (defKey === S.pos.legalA || defKey === S.pos.legalB)) {
    defCard.classList.remove('shake', 'shake-hard');
    void defCard.offsetWidth;
    defCard.classList.add(action.isCrit ? 'shake-hard' : 'shake');
    setTimeout(() => defCard.classList.remove('shake', 'shake-hard'), 400);
  }
  // カウンターフラッシュ
  if (action.kind === 'counter') {
    const atkCard = document.getElementById(`card-${atkSide}-legal`);
    if (atkCard && (atkKey === S.pos.legalA || atkKey === S.pos.legalB)) {
      atkCard.classList.remove('counter-flash');
      void atkCard.offsetWidth;
      atkCard.classList.add('counter-flash');
      setTimeout(() => atkCard.classList.remove('counter-flash'), 380);
    }
    try { sfx.counterSE(); } catch(e){}
  }
  // SE
  const cat = action.moveCat || guessCategory(action.move);
  const volMul = action.isCrit ? 1.2 : 1;
  try {
    if (action.dmg >= 20) sfx.bigmoveImpact();
    hitSE(cat, action.dmg, volMul);
  } catch(e){}
  // フラッシュ
  if (action.isCrit && action.dmg >= 20) {
    const ov = document.getElementById('flashOv');
    if (ov) { ov.classList.remove('flash','red'); void ov.offsetWidth; ov.classList.add('flash','red'); setTimeout(()=>ov.classList.remove('flash','red'), 300); }
  }
  // big move splash
  if (action.isCrit && action.dmg >= 15) _showBigMoveSplash(action.move);
}

function _showDmgPop(side, val, isCrit, isCounter){
  const card = document.getElementById(`card-${side}-legal`);
  if (!card) return;
  const portrait = card.querySelector('.portrait-area');
  if (!portrait) return;
  const el = document.createElement('div');
  el.className = 'dmg-pop' + (isCrit?' crit':'') + (isCounter?' counter':'');
  el.textContent = '-' + val;
  portrait.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function _showBigMoveSplash(moveName){
  const el = document.getElementById('bigmoveSplash');
  if (!el) return;
  el.textContent = '— ' + moveName + ' —';
  el.className = 'bigmove-splash show';
  setTimeout(() => el.classList.add('fade'), 1200);
  setTimeout(() => { el.className = 'bigmove-splash'; el.textContent = ''; }, 1600);
}

function animateEvent(ev, fr){
  if (ev.type === 'hotTag') {
    showBanner('HOT TAG!', 'gold');
    try { sfx.hotTagSE(); } catch(e){}
    flashGold();
    const teamKey = ev.team === 'A' ? S.pos.legalA : S.pos.legalB;
    const fighter = f(teamKey);
    if (fighter) showCutin(fighter, ev.team === 'A' ? 'left' : 'right', pickHotTagLine(fighter.personality || 'normal'), 'tag-hot');
  } else if (ev.type === 'doubleTeam') {
    showBanner('DOUBLE TEAM!', 'red');
    try { sfx.doubleTeamSE(); } catch(e){}
  } else if (ev.type === 'cutinSave') {
    // pinAttempt(outcome=cutinSave) と同フレームなら pin シーケンス内で扱うためスキップ
    const hasPinCutin = fr && fr.events && fr.events.some(e => e.type === 'pinAttempt' && e.outcome === 'cutinSave');
    if (hasPinCutin) return;
    const saverKey = keyById(ev.by);
    showBanner('CUT IN!', 'gold');
    try { sfx.cutinSlide(); } catch(e){}
    const saver = f(saverKey);
    if (saver) {
      const side = (saverKey === 'a1' || saverKey === 'a2') ? 'left' : 'right';
      showCutin(saver, side, pickCutinSaveLine(saver.personality || 'normal'), 'tag-save');
    }
  } else if (ev.type === 'friendlyFire') {
    showBanner('同士討ち！', 'yellow');
    try { sfx.friendlyFireSE(); } catch(e){}
    const victimKey = keyById(ev.victim);
    const side = (victimKey === 'a1' || victimKey === 'a2') ? 'a' : 'b';
    const card = document.getElementById(`card-${side}-legal`);
    if (card) { card.classList.add('ff-flash'); setTimeout(() => card.classList.remove('ff-flash'), 650); }
  } else if (ev.type === 'betrayal') {
    showBanner('…見殺し', 'grey');
    try { sfx.betrayalSE(); } catch(e){}
    const betrayerKey = keyById(ev.by);
    const side = (betrayerKey === 'a1' || betrayerKey === 'a2') ? 'a' : 'b';
    const layer = (betrayerKey === S.pos.legalA || betrayerKey === S.pos.legalB) ? 'legal' : 'apron';
    const card = document.getElementById(`card-${side}-${layer}`);
    if (card) { card.classList.add('betrayed'); setTimeout(() => card.classList.remove('betrayed'), 2500); }
    const betrayer = f(betrayerKey);
    if (betrayer) {
      const cutinSide = (betrayerKey === 'a1' || betrayerKey === 'a2') ? 'left' : 'right';
      showCutin(betrayer, cutinSide, pickBetrayalLine(betrayer.personality || 'normal'), 'damage-serif');
    }
  }
  // pinAttempt は applyFrame 側の _beginPinSequence でクリック駆動処理するため、ここでは何もしない
  // flash overlay on move-display
  const ov = document.getElementById('flashOverlay');
  if (ov) {
    ov.style.background = ev.type === 'hotTag' ? 'rgba(238,85,85,0.3)' :
                          ev.type === 'doubleTeam' ? 'rgba(221,170,68,0.3)' :
                          ev.type === 'friendlyFire' ? 'rgba(238,136,68,0.3)' :
                          'rgba(255,255,255,0.2)';
    ov.classList.remove('active'); void ov.offsetWidth; ov.classList.add('active');
  }
}

function animateTouchSwap(side, fr){
  try { sfx.touchSE(); } catch(e){}
  const isHot = fr.events && fr.events.some(e => e.type === 'hotTag' && e.team === side.toUpperCase());
  const hlCls = isHot ? 'tag-highlight-hot' : 'tag-highlight';
  const posKey = side === 'a' ? S.pos.legalA : S.pos.legalB;
  const newLegal = f(posKey);

  // shrink完了後(~380ms)に内容差し替え → grow-in
  setTimeout(() => {
    _refreshCard(side, 'legal', posKey);
    const card = document.getElementById(`card-${side}-legal`);
    if (card) {
      card.classList.remove('tag-out-legal', 'tag-in-legal', hlCls);
      void card.offsetWidth;
      card.classList.add('tag-in-legal', hlCls);
      setTimeout(() => card.classList.remove('tag-in-legal'), 500);
      setTimeout(() => card.classList.remove(hlCls), 1600);
    }
  }, 370);

  // タグバナー (少し遅らせてアニメと同期)
  setTimeout(() => {
    const banner = document.getElementById('tagBanner');
    if (banner && newLegal) {
      banner.textContent = isHot ? `🔥 反撃のタッチ！ ${newLegal.name}` : `🔄 タッチ → ${newLegal.name}`;
      banner.className = 'tag-banner' + (isHot ? ' hottag' : '') + ' show';
      setTimeout(() => banner.classList.remove('show'), 1800);
    }
  }, 200);
}

function showBanner(text, cls){
  const el = document.getElementById('bannerEl');
  if (!el) return;
  el.className = 'banner ' + cls;
  el.textContent = text;
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1700);
}

// ── ピンカウント演出 (U3 rework) ──
// クリック駆動: 攻撃後 600ms で「ワン！」自動表示 → クリック → 「ツー！」→ クリック →
// 「スリー／返した／カットイン」→ クリック → 次フレーム。シングル battle-engine.html と同仕様。
const PIN_SEQ_LEAD_MS = 600;

function _beginPinSequence(pinEv, fr){
  const ctrl = _buildPinCtrl(pinEv, fr);
  if (!ctrl || ctrl.seq.length === 0) return;
  S.pinCtrl = ctrl;
  S.pendingCutin = true; // nextFrame ガードを流用
  const btn = document.getElementById('nBtn');
  if (btn) btn.disabled = true;
  // 先頭 step (ワン！) を軽く遅延させて表示 → その後クリック待ち
  setTimeout(() => {
    if (!S.pinCtrl) return;
    _executePinStep(0);
  }, PIN_SEQ_LEAD_MS);
}

function _buildPinCtrl(pinEv, fr){
  const { outcome, count } = pinEv;
  const seq = [];
  // ダメージセリフ/ボイス: crit ヒットで pickDamageLine が line を返したら先頭に配置。
  //「ビッグムーブ食らう → 苦悶 → カバー → ワン、ツー、スリー」の流れを作る。
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit) {
    const defKey = keyById(fr.action.defenderId);
    const def = defKey ? f(defKey) : null;
    if (def) {
      const hpRatio = def.hp / def.mhp;
      const line = pickDamageLine(def, fr.action.dmg, hpRatio);
      const lastCrit = S.lastCritTurn[defKey] || 0;
      if (line && fr.turn - lastCrit >= 3) {
        S.lastCritTurn[defKey] = fr.turn;
        const side = (defKey === 'a1' || defKey === 'a2') ? 'left' : 'right';
        const cssCls = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
        seq.push({ kind: 'damage', fighter: def, side, text: line.text, cssCls });
      }
    }
  }
  if (count >= 1) seq.push({ kind: 'count', text: 'ワン！', cls: '' });
  if (count >= 2) seq.push({ kind: 'count', text: 'ツー！', cls: '' });
  if (outcome === 'win' || outcome === 'betrayalWin') {
    seq.push({ kind: 'count', text: 'スリーーー！', cls: 'three' });
  } else if (outcome === 'kickout') {
    seq.push({ kind: 'count', text: '返したーっ！', cls: 'kickout' });
  } else if (outcome === 'cutinSave') {
    const cutinEv = fr.events && fr.events.find(e => e.type === 'cutinSave');
    if (cutinEv) {
      const saverKey = keyById(cutinEv.by);
      const saver = saverKey ? f(saverKey) : null;
      if (saver) {
        const side = (saverKey === 'a1' || saverKey === 'a2') ? 'left' : 'right';
        seq.push({ kind: 'cutin', saver, side, line: pickCutinSaveLine(saver.personality || 'normal') });
      }
    }
  }
  return { seq, idx: -1, fr };
}

function _executePinStep(idx){
  if (!S.pinCtrl) return;
  if (idx >= S.pinCtrl.seq.length) { _finishPinSeq(); return; }
  S.pinCtrl.idx = idx;
  const step = S.pinCtrl.seq[idx];
  if (step.kind === 'count') {
    _spawnPinCount(step.text, step.cls);
    // クリックで次 step
    const btn = document.getElementById('nBtn');
    if (btn) { btn.disabled = false; btn.onclick = _advancePinStep; }
  } else if (step.kind === 'damage') {
    // ダメージセリフ: showCutin が pendingCutin=true を立てる。
    // クリックで dismissCutin → dismissCutin 側で pinCtrl 判定し次 step へ進む。
    showCutin(step.fighter, step.side, step.text, step.cssCls);
  } else if (step.kind === 'cutin') {
    // カットインは showCutin が pendingCutin=true を立てる。
    // クリックで dismissCutin → dismissCutin 側で pinCtrl 判定し _finishPinSeq を呼ぶ。
    showBanner('CUT IN!', 'gold');
    try { sfx.cutinSlide(); } catch(e){}
    showCutin(step.saver, step.side, step.line, 'tag-save');
    // nBtn は showCutin 内で disabled 化済み。dismissCutin からの遷移を待つ。
  }
}

function _advancePinStep(){
  if (!S.pinCtrl) return;
  _executePinStep(S.pinCtrl.idx + 1);
}

function _finishPinSeq(){
  const fr = S.pinCtrl ? S.pinCtrl.fr : null;
  S.pinCtrl = null;
  S.pendingCutin = false;
  _bindNextButton(); // onclick を通常フローに戻す
  const btn = document.getElementById('nBtn');
  if (fr && fr.winner) {
    // 勝者フレーム: 少し余韻を置いて結果画面へ
    setTimeout(() => showResult(fr), 800);
  } else {
    if (btn) btn.disabled = false;
    if (S.autoAdvance && S.frameIdx < S.frames.length) {
      clearTimeout(S.autoTimer);
      S.autoTimer = setTimeout(() => nextFrame(), 600);
    }
  }
}

function _spawnPinCount(text, cls){
  const el = document.createElement('div');
  el.className = 'pin-count' + (cls ? ' ' + cls : '');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400); // 少し長めに残す (クリック待ち間も視認可能に)
  try {
    if (cls === 'three') { sfx.finChime(); sfx.finImpact(); }
    else if (cls === 'kickout') sfx.kickoutSE();
    else sfx.count();
  } catch(e){}
}
function flashGold(){
  const ov = document.getElementById('flashOv');
  if (!ov) return;
  ov.classList.remove('flash','red','gold');
  void ov.offsetWidth;
  ov.classList.add('flash','gold');
  setTimeout(() => ov.classList.remove('flash','gold'), 300);
}

// ── ダメージセリフ ──
function tryDamageLine(action, fr){
  const defKey = keyById(action.defenderId);
  if (!defKey) return;
  const def = f(defKey);
  if (!def) return;
  const hpRatio = def.hp / def.mhp;
  const line = pickDamageLine(def, action.dmg, hpRatio);
  if (!line) return;
  const last = S.lastCritTurn[defKey] || 0;
  if (fr.turn - last < 3) return;
  S.lastCritTurn[defKey] = fr.turn;
  const side = (defKey === 'a1' || defKey === 'a2') ? 'left' : 'right';
  const cssCls = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
  showCutin(def, side, line.text, cssCls);
}

// ── カットイン ──
function showCutin(fighter, side, text, cssCls){
  const ov = document.getElementById('cutinOv');
  if (!ov) return;
  const portraitUrl = getUpperUrl(fighter);
  const dirCls = side === 'right' ? ' right' : '';
  const extraCls = cssCls ? ' ' + cssCls : '';
  ov.innerHTML = `<div class="cutin-box${dirCls}${extraCls}">
    ${portraitUrl ? `<img class="cutin-portrait" src="${portraitUrl}" onerror="this.style.display='none'">` : ''}
    <div class="cutin-info">
      <div class="cutin-name">${escHtml(fighter.name || '')}</div>
      <div class="cutin-text">「${escHtml(text)}」</div>
      <div class="cutin-dismiss">CLICK TO CLOSE</div>
    </div>
  </div>`;
  ov.classList.add('show');
  S.pendingCutin = true;
  const btn = document.getElementById('nBtn');
  if (btn) btn.disabled = true;
  try {
    if (cssCls === 'damage-voice') sfx.dmgVoice();
    else sfx.cutinSlide();
  } catch(e){}
}
function dismissCutin(){
  const ov = document.getElementById('cutinOv');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(() => { ov.innerHTML = ''; }, 350);
  S.pendingCutin = false;
  // ピン seq の cutin/damage step だった場合は次へ進む
  if (S.pinCtrl && S.pinCtrl.seq[S.pinCtrl.idx]) {
    const kind = S.pinCtrl.seq[S.pinCtrl.idx].kind;
    if (kind === 'cutin') { _finishPinSeq(); return; }
    if (kind === 'damage') { _advancePinStep(); return; }
  }
  const btn = document.getElementById('nBtn');
  if (btn && !S.anim) btn.disabled = false;
  if (S.autoAdvance && !S.anim && S.frameIdx < S.frames.length) {
    S.autoTimer = setTimeout(() => nextFrame(), 600);
  }
}

// ── AUTO ──
function toggleAuto(){
  S.autoAdvance = !S.autoAdvance;
  const b = document.getElementById('autoBtn');
  if (b) {
    b.classList.toggle('active', S.autoAdvance);
    b.innerHTML = 'AUTO<span>' + (S.autoAdvance ? 'ON' : 'OFF') + '</span>';
  }
  if (S.autoAdvance) {
    if (!S.anim && !S.pendingCutin && S.frameIdx < S.frames.length) {
      S.autoTimer = setTimeout(() => nextFrame(), 500);
    }
  } else {
    clearTimeout(S.autoTimer);
  }
}
function setSpeed(idx){
  S.speedIdx = clamp(idx, 0, SPEED_DELAYS.length - 1);
  document.querySelectorAll('.speed-dot').forEach((d, i) => {
    d.classList.toggle('on', i <= S.speedIdx);
    d.classList.toggle('off', i > S.speedIdx);
  });
}

// ── 結果表示 (Victory Overlay) ──
function showResult(fr){
  const result = S.result;
  const winTeam = result.winner; // 'teamA' | 'teamB' | 'draw'
  const finType = result.finType || '';
  const finMove = result.finMove || '';
  const finishPhase = result.finishPhase || '';

  try { sfx.victoryFanfare(); } catch(e){}

  const winners = winTeam === 'teamA' ? [f('a1'), f('a2')] :
                  winTeam === 'teamB' ? [f('b1'), f('b2')] : [];
  const losers = winTeam === 'teamA' ? [f('b1'), f('b2')] :
                 winTeam === 'teamB' ? [f('a1'), f('a2')] : [];

  // Reset classes
  const ov = document.getElementById('victoryOv');
  const box = document.getElementById('victoryBox');
  ov.classList.remove('visible');
  box.classList.remove('visible');
  ['vicLabel','vicNames','vicType','vicBottom','vicClose'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('visible');
  });
  document.querySelectorAll('.vic-portrait').forEach(p => p.classList.remove('visible'));
  ov.classList.add('show');

  // Portraits (upper images)
  const portraits = document.getElementById('vicPortraits');
  if (winners.length === 2) {
    portraits.innerHTML =
      `<img class="vic-portrait left" src="${getUpperUrl(winners[0])}" onerror="this.style.display='none'">` +
      `<img class="vic-portrait" src="${getUpperUrl(winners[1])}" onerror="this.style.display='none'">`;
  } else {
    portraits.innerHTML = '';
  }

  // Names
  const names = document.getElementById('vicNames');
  if (winners.length === 2) {
    names.textContent = `${winners[0].name} & ${winners[1].name}`;
    names.style.background = 'linear-gradient(180deg, #ffd700, #daa520)';
    names.style.webkitBackgroundClip = 'text';
  } else {
    names.textContent = 'DRAW';
    names.style.background = 'linear-gradient(180deg, #ccc, #888)';
    names.style.webkitBackgroundClip = 'text';
  }

  // Finish type
  const vicType = document.getElementById('vicType');
  const segments = (result.segments || []).length;
  vicType.textContent = `${finType}${finMove ? ' — ' + finMove : ''}${finishPhase ? ' / ' + finishPhase : ''} / ${result.turns} Turns`;

  // Loser
  const loserEl = document.getElementById('vicLoser');
  if (losers.length === 2) {
    loserEl.innerHTML =
      `<div class="vic-loser-faces">` +
        `<img class="vic-loser-face" src="${getFaceUrl(losers[0])}" onerror="this.style.display='none'">` +
        `<img class="vic-loser-face" src="${getFaceUrl(losers[1])}" onerror="this.style.display='none'">` +
      `</div>` +
      `<div><div class="vic-loser-names">${escHtml(losers[0].name)} & ${escHtml(losers[1].name)}</div><div class="vic-loser-tag">LOSER</div></div>`;
  } else {
    loserEl.innerHTML = '';
  }

  // Stats
  const mq = result.mq || 0;
  const mqCls = mq >= 80 ? 'mq-gold' : mq >= 60 ? 'mq-green' : mq >= 40 ? 'mq-normal' : 'mq-low';
  document.getElementById('vicStats').innerHTML =
    `<div class="vic-stat"><div class="vic-stat-label">MQ</div><div class="vic-stat-value ${mqCls}">${mq}</div></div>` +
    `<div class="vic-stat"><div class="vic-stat-label">TURNS</div><div class="vic-stat-value">${result.turns}</div></div>` +
    `<div class="vic-stat"><div class="vic-stat-label">SEGS</div><div class="vic-stat-value">${segments}</div></div>`;

  // Staggered fade-in
  setTimeout(() => ov.classList.add('visible'), 50);
  setTimeout(() => box.classList.add('visible'), 300);
  setTimeout(() => document.querySelectorAll('.vic-portrait').forEach(p => p.classList.add('visible')), 800);
  setTimeout(() => { document.getElementById('vicLabel').classList.add('visible'); names.classList.add('visible'); }, 1400);
  setTimeout(() => vicType.classList.add('visible'), 1800);
  setTimeout(() => document.getElementById('vicBottom').classList.add('visible'), 2200);
  setTimeout(() => document.getElementById('vicClose').classList.add('visible'), 2800);
}

function endMatch(){
  const result = S.result;
  const msg = {
    type: 'MATCH_RESULT',
    matchType: 'tag',
    winner: result.winner,
    turns: result.turns,
    mq: result.mq,
    finType: result.finType,
    finMove: result.finMove,
  };
  window.parent.postMessage(msg, '*');
}

// ── Fighter popup ──
function openBp(posKey){
  const ch = f(posKey);
  if (!ch) return;
  const hpPct = ch.mhp > 0 ? Math.max(0, Math.round(ch.hp / ch.mhp * 100)) : 0;
  const stats = [
    {k:'pow', l:'PWR', v: Math.round(ch.pw||0)},
    {k:'spd', l:'SPD', v: Math.round(ch.sp||0)},
    {k:'tec', l:'TEC', v: Math.round(ch.te||0)},
    {k:'sta', l:'STA', v: Math.round(ch.st||0)},
    {k:'mn',  l:'MNT', v: Math.round(ch.mn||0)},
  ];
  const ov = document.getElementById('bpOv');
  ov.innerHTML = `<div class="bp-box">
    <button class="bp-close" onclick="closeBp()">✕</button>
    <div class="bp-img"><img src="${getFullUrl(ch)}" onerror="this.style.display='none'"></div>
    <div class="bp-info">
      <div class="bp-name">${escHtml(ch.name)}</div>
      <div class="bp-style">${escHtml(ch.style||'')} ／ OVR ${_calcOvr(ch)}</div>
      <div class="bp-stats">${stats.map(s=>`<div class="bp-stat-row">
        <span class="bp-stat-name">${s.l}</span>
        <div class="bp-stat-track"><div class="bp-stat-fill ${s.k}" style="width:${s.v}%"></div></div>
        <span class="bp-stat-val">${s.v}</span>
      </div>`).join('')}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text-sub)">現在HP: ${Math.max(0,Math.round(ch.hp))} / ${ch.mhp} (${hpPct}%)</div>
      ${ch.profile ? `<div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.03);border-radius:3px;font-size:12px;line-height:1.6;color:var(--text-sub)">${escHtml(ch.profile)}</div>` : ''}
    </div>
  </div>`;
  ov.classList.add('show');
}
function closeBp(){
  document.getElementById('bpOv').classList.remove('show');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const bp = document.getElementById('bpOv');
    if (bp && bp.classList.contains('show')) { closeBp(); return; }
    const cu = document.getElementById('cutinOv');
    if (cu && cu.classList.contains('show')) { dismissCutin(); return; }
  }
});
