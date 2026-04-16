// tag-battle メインロジック — Replay flow
let matchData = null;
const S = {
  result: null,       // simulateTagMatch の完全結果
  frames: [],
  frameIdx: 0,
  // 4 fighters: a1, a2, b1, b2 — 固定キー
  fighters: {},       // {a1, a2, b1, b2} each: {...char, hp, mhp, gritTurns, hotTagBuff, personality, archetype}
  // ポジション: どの fighter key が legalA/apronA/legalB/apronB か（初期は a1/a2/b1/b2）
  pos: { legalA: 'a1', apronA: 'a2', legalB: 'b1', apronB: 'b2' },
  // 直近のクリティカル受け記録（各 fighter key → turn number）
  lastCritTurn: {},
  mom: 0,
  log: [],            // 表示済み log line 配列
  anim: false,        // アニメ進行中ロック
  autoAdvance: false,
  autoTimer: null,
  pendingCutin: false,
  matchInfo: null,
  chemA: 0,
  chemB: 0,
};

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
  S.log = [];
  S.mom = 0;
  S.lastCritTurn = {};
  S.autoAdvance = false;
  clearTimeout(S.autoTimer);

  // 4 fighter オブジェクトを作成
  const mk = (c) => {
    const mhp = Math.round(85 + Math.min(100, Math.max(0, c.st || 60)) * 1.20 * 0.3); // ざっくり表示用
    // 正確なMHPは frame の HP から逆算されるため、最初のフレームで置き換え
    return { ...c, hp: mhp, mhp, gritTurns: 0, hotTagBuff: 0 };
  };
  S.fighters = {
    a1: mk(data.teamA.fighter1),
    a2: mk(data.teamA.fighter2),
    b1: mk(data.teamB.fighter1),
    b2: mk(data.teamB.fighter2),
  };
  // MHP は最初のフレームの hp 値でリセット（エンジンの hpBase+stScale に一致させる）
  if (S.frames.length > 0) {
    const f0 = S.frames[0];
    // frame[0] は既にターン1の末尾 — MHP は HP が少し減っているのでフレーム0のHPそのままは正確ではない
    // エンジン側の計算と合わせる: hpBase(85) + eff(st)*hpScale(1.20)
    ['a1','a2','b1','b2'].forEach(k => {
      const c = S.fighters[k];
      const st = Math.min(100, Math.max(0, c.st || 60));
      const mhp = Math.round(85 + st * 1.20);
      c.mhp = mhp; c.hp = mhp;
    });
  }
  // pos は fighter id → key マップ
  S.pos = { legalA: 'a1', apronA: 'a2', legalB: 'b1', apronB: 'b2' };
  S.idToKey = {};
  S.idToKey[S.fighters.a1.id] = 'a1';
  S.idToKey[S.fighters.a2.id] = 'a2';
  S.idToKey[S.fighters.b1.id] = 'b1';
  S.idToKey[S.fighters.b2.id] = 'b2';

  renderMatch();
  try { sfx.gong(); } catch(e){}
}

// ── ヘルパー ──
function hpCls(pct){ return pct > 66 ? 'high' : pct > 33 ? 'mid' : 'low'; }
function f(key){ return S.fighters[key]; }
function byId(id){ return f(S.idToKey[id]); }
function keyById(id){ return S.idToKey[id]; }

// ── メイン描画 ──
function renderMatch(){
  const teamA = [f(S.pos.legalA), f(S.pos.apronA)];
  const teamB = [f(S.pos.legalB), f(S.pos.apronB)];
  const curFrame = S.frameIdx > 0 ? S.frames[S.frameIdx - 1] : null;
  const turn = curFrame ? curFrame.turn : 0;
  const phase = curFrame ? curFrame.phase : (S.matchInfo.header || 'Opening');
  const segIdx = curFrame ? curFrame.segmentIdx : 0;

  const mi = S.matchInfo;
  const header = mi.header || 'タッグマッチ';
  const chemACls = S.chemA >= 70 ? 'high' : S.chemA >= 50 ? 'mid' : 'low';
  const chemBCls = S.chemB >= 70 ? 'high' : S.chemB >= 50 ? 'mid' : 'low';

  const hudHtml = `<div class="hud">
    <div class="hud-top">
      <div class="hud-team left">
        <div class="hud-faces">${teamA.map(x=>`<div class="hud-face"><img src="${getFaceUrl(x)}" onerror="this.style.display='none'"></div>`).join('')}</div>
        <div class="hud-team-info">
          <div class="hud-team-label">TEAM A</div>
          <div class="hud-team-names">${teamA.map(x=>x.name).join(' & ')}</div>
        </div>
      </div>
      <div class="hud-center">
        <div class="hud-turn">${header}</div>
        <div class="hud-phase">${phase}</div>
        <div class="hud-seg">セグメント ${segIdx + 1}　ターン ${turn || '-'}</div>
      </div>
      <div class="hud-team right">
        <div class="hud-faces">${teamB.map(x=>`<div class="hud-face"><img src="${getFaceUrl(x)}" onerror="this.style.display='none'"></div>`).join('')}</div>
        <div class="hud-team-info">
          <div class="hud-team-label">TEAM B</div>
          <div class="hud-team-names">${teamB.map(x=>x.name).join(' & ')}</div>
        </div>
      </div>
    </div>
    <div class="chem-row">
      <span class="chem-label">CHEM A</span>
      <span class="chem-val a">${Math.round(S.chemA)}</span>
      <div class="chem-track"><div class="chem-fill a" style="width:${clamp(S.chemA,0,100)}%"></div></div>
      <div class="chem-track"><div class="chem-fill b" style="width:${clamp(S.chemB,0,100)}%;float:right"></div></div>
      <span class="chem-val b">${Math.round(S.chemB)}</span>
      <span class="chem-label">CHEM B</span>
    </div>
  </div>`;

  const legalApanel = _fpanelHtml(S.pos.legalA, 'left', 'legal');
  const apronApanel = _fpanelHtml(S.pos.apronA, 'left', 'apron');
  const legalBpanel = _fpanelHtml(S.pos.legalB, 'right', 'legal');
  const apronBpanel = _fpanelHtml(S.pos.apronB, 'right', 'apron');

  const logHtml = S.log.slice(-60).map(_logEntryHtml).join('');
  const narration = curFrame ? _narrateFrame(curFrame) : '<div class="nar-empty">試合開始 — NEXT TURNを押してください</div>';
  const moveName = curFrame && curFrame.action ? curFrame.action.move : '---';

  const gridHtml = `<div class="main-grid">
    <div class="col-left">
      ${legalApanel}
      ${apronApanel}
    </div>
    <div class="center-panel">
      <div class="turn-label">ターン ${turn || '-'}</div>
      <div class="phase-pill">${phase}</div>
      <div class="narration-box">${narration}</div>
      <div class="move-box">
        <div class="move-label">Current Move</div>
        <div class="move-value" id="moveV">${moveName}</div>
      </div>
      <div class="log-section">
        <div class="log-header">Battle Log</div>
        <div class="log-box" id="logBox">${logHtml}</div>
      </div>
    </div>
    <div class="col-right">
      ${legalBpanel}
      ${apronBpanel}
    </div>
  </div>`;

  const winnerFrame = curFrame && curFrame.winner;
  const endState = winnerFrame || S.frameIdx >= S.frames.length;
  const btnLabel = winnerFrame ? 'WIN!' : (endState ? 'END' : '▶  NEXT TURN');
  // S.anim 中のクリックは nextFrame() 内部でガードされるので disabled にしない
  const actionHtml = `<div class="action-bar">
    <button class="btn-next" id="nBtn"${endState && !winnerFrame ? '' : ''}>${btnLabel}</button>
    ${!endState ? `<button class="btn-auto${S.autoAdvance?' on':''}" id="autoBtn" onclick="toggleAuto()">AUTO<br><span style="font-size:10px;letter-spacing:1px">${S.autoAdvance?'ON':'OFF'}</span></button>` : ''}
  </div>`;

  document.getElementById('mainContainer').innerHTML = hudHtml + gridHtml + actionHtml;
  // nextFrame 自体が S.anim チェックを持つので、ハンドラは常に割り当てる
  const btn = document.getElementById('nBtn');
  if (btn) {
    if (winnerFrame || S.frameIdx >= S.frames.length) btn.onclick = endMatch;
    else btn.onclick = nextFrame;
  }
  // log 自動スクロール
  setTimeout(() => { const lb = document.getElementById('logBox'); if (lb) lb.scrollTop = lb.scrollHeight; }, 30);
}

function _fpanelHtml(posKey, side, layer){
  const ch = f(posKey);
  const hpPct = Math.max(0, Math.round(ch.hp / ch.mhp * 100));
  const cls = ['fpanel', layer, 'side-'+side];
  if (ch.gritTurns > 0) cls.push('grit-active');
  if (ch.hotTagBuff > 0) cls.push('hot-tag-buff');
  const tag = layer === 'legal'
    ? `<div class="legal-tag">IN RING</div>`
    : `<div class="apron-tag">APRON</div>`;
  const portraitUrl = layer === 'legal' ? getStandUrl(ch) : getFaceUrl(ch);
  const showDanger = layer === 'legal' && hpPct <= 25;
  return `<div class="${cls.join(' ')}" id="panel-${posKey}">
    ${tag}
    <div class="portrait-area" id="port-${posKey}">
      <img src="${portraitUrl}" alt="${ch.name}" onerror="this.style.display='none'">
      <div class="dmg-number" id="dmg-${posKey}"></div>
      ${showDanger ? `<div class="danger-glow show"><div class="danger-glow-inner"></div></div>` : ''}
      <div class="fname-row">
        <span class="fname${layer==='apron'?' small':''}" onclick="openBp('${posKey}')">${ch.name}</span>
        <span class="fstyle${layer==='apron'?' small':''}">${ch.style || ''}</span>
      </div>
    </div>
    <div class="f-hp-row">
      <span class="f-hp-pct">${hpPct}%</span>
      <div class="f-hp-bar"><div class="f-hp-fill ${hpCls(hpPct)}" style="width:${hpPct}%"></div></div>
    </div>
  </div>`;
}

function _narrateFrame(fr){
  if (!fr) return '';
  if (fr.events && fr.events.length) {
    const ev = fr.events[fr.events.length - 1];
    if (ev.type === 'hotTag') return `<div class="nar-line nar-event">★ ホットタグ！ 会場が沸く！</div>`;
    if (ev.type === 'doubleTeam') return `<div class="nar-line nar-event">★ ダブルチーム炸裂！</div>`;
    if (ev.type === 'cutinSave') return `<div class="nar-line nar-event">★ カットイン！ 救出！</div>`;
    if (ev.type === 'friendlyFire') return `<div class="nar-line nar-event">※ 同士討ち</div>`;
    if (ev.type === 'betrayal') return `<div class="nar-line nar-event" style="color:#888">…見殺し…</div>`;
  }
  const a = fr.action;
  if (!a) {
    if (fr.winner) return `<div class="nar-line nar-event">★ 決着！</div>`;
    return `<div class="nar-line">${(fr.logLines||[]).join('<br>')}</div>`;
  }
  const atk = byId(a.attackerId);
  const def = byId(a.defenderId);
  if (!atk || !def) return `<div class="nar-line">${a.move}</div>`;
  if (a.kind === 'miss') return `<div class="nar-line nar-miss">${atk.name}の${a.move} → MISS</div>`;
  if (a.kind === 'counter') return `<div class="nar-line nar-counter">${atk.name}がカウンター！ ${a.move} → ${def.name}に${a.dmg}ダメージ</div>`;
  return `<div class="nar-line nar-hit">${atk.name}の${a.move} → ${def.name}に${a.dmg}ダメージ</div>`;
}

function _logEntryHtml(line){
  let c = 'log-entry';
  if (line.includes('★')) {
    if (line.includes('ホットタグ')) c += ' hottag';
    else if (line.includes('ダブルチーム') || line.includes('タッグ技')) c += ' double';
    else c += ' finish';
  } else if (line.includes('カウンター')) c += ' counter';
  else if (line.includes('MISS')) c += ' miss';
  else if (line.includes('タッチ')) c += ' touch';
  else if (line.includes('※') || line.includes('→')) c += ' drama';
  return `<div class="${c}">${line}</div>`;
}

// ── フレーム進行 ──
function nextFrame(){
  if (S.anim || S.frameIdx >= S.frames.length) return;
  if (S.pendingCutin) return;
  clearTimeout(S.autoTimer);
  const fr = S.frames[S.frameIdx];
  applyFrame(fr);
  S.frameIdx++;

  if (fr.winner) {
    setTimeout(() => showResult(fr), 1800);
    return;
  }
  if (S.autoAdvance && S.frameIdx < S.frames.length) {
    S.autoTimer = setTimeout(() => nextFrame(), 1400);
  }
}

function applyFrame(fr){
  S.anim = true;
  // 旧状態を保存（タッチ検出用）
  const prevLegalA = S.pos.legalA, prevLegalB = S.pos.legalB;
  const newLegalAKey = keyById(fr.legalA);
  const newLegalBKey = keyById(fr.legalB);
  const newApronAKey = keyById(fr.apronA);
  const newApronBKey = keyById(fr.apronB);
  const touchA = newLegalAKey !== prevLegalA;
  const touchB = newLegalBKey !== prevLegalB;

  // HPとバフを全員更新
  ['a1','a2','b1','b2'].forEach(k => {
    const ch = S.fighters[k];
    if (fr.hp[ch.id] != null) ch.hp = fr.hp[ch.id];
    if (fr.grit && fr.grit[ch.id] != null) ch.gritTurns = fr.grit[ch.id];
    if (fr.hotTagBuff && fr.hotTagBuff[ch.id] != null) ch.hotTagBuff = fr.hotTagBuff[ch.id];
  });
  S.pos = { legalA: newLegalAKey, apronA: newApronAKey, legalB: newLegalBKey, apronB: newApronBKey };
  S.mom = fr.mom || 0;

  // ログ追記
  (fr.logLines || []).forEach(line => S.log.push(line));

  // 描画更新
  renderMatch();

  // アクション演出
  if (fr.action) animateAction(fr.action, fr);

  // ドラマイベント演出
  (fr.events || []).forEach(ev => animateEvent(ev, fr));

  // タッチアニメ
  if (touchA) animateTouchSwap('A');
  if (touchB) animateTouchSwap('B');

  // クリティカルダメージセリフ／ボイス
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit) {
    tryDamageLine(fr.action, fr);
  }

  setTimeout(() => { S.anim = false; }, 600);
}

// ── 演出群 ──
function animateAction(action, fr){
  const defKey = keyById(action.defenderId);
  const atkKey = keyById(action.attackerId);
  if (action.kind === 'miss') {
    try { sfx.missWhiff(); } catch(e){}
    return;
  }
  // ダメージ数字
  const dmgEl = document.getElementById('dmg-' + defKey);
  if (dmgEl) {
    dmgEl.textContent = '-' + action.dmg;
    dmgEl.classList.remove('show', 'crit');
    if (action.isCrit) dmgEl.classList.add('crit');
    // reflow
    void dmgEl.offsetWidth;
    dmgEl.classList.add('show');
    setTimeout(() => dmgEl.classList.remove('show'), 900);
  }
  // パネルシェイク
  const panel = document.getElementById('panel-' + defKey);
  if (panel) {
    panel.classList.remove('shake', 'shake-hard');
    void panel.offsetWidth;
    panel.classList.add(action.isCrit ? 'shake-hard' : 'shake');
    setTimeout(() => panel.classList.remove('shake', 'shake-hard'), 400);
  }
  // フラッシュ攻撃側
  const atkPanel = document.getElementById('panel-' + atkKey);
  if (atkPanel) {
    atkPanel.classList.remove('flash-atk');
    void atkPanel.offsetWidth;
    atkPanel.classList.add('flash-atk');
    setTimeout(() => atkPanel.classList.remove('flash-atk'), 420);
  }
  // カウンター演出
  if (action.kind === 'counter') {
    if (atkPanel) {
      atkPanel.classList.remove('counter-flash');
      void atkPanel.offsetWidth;
      atkPanel.classList.add('counter-flash');
      setTimeout(() => atkPanel.classList.remove('counter-flash'), 380);
    }
    try { sfx.counterSE(); } catch(e){}
  }
  // SE
  const cat = guessCategory(action.move);
  const volMul = action.isCrit ? 1.2 : 1;
  try {
    if (action.dmg >= 20) sfx.bigmoveImpact();
    hitSE(cat, action.dmg, volMul);
  } catch(e){}
  // 全画面フラッシュ（クリット）
  if (action.isCrit && action.dmg >= 20) {
    const ov = document.getElementById('flashOv');
    if (ov) { ov.classList.remove('flash','red'); void ov.offsetWidth; ov.classList.add('flash','red'); setTimeout(()=>ov.classList.remove('flash','red'), 300); }
  }
}

function animateEvent(ev, fr){
  if (ev.type === 'hotTag') {
    showBanner('HOT TAG!', 'gold');
    try { sfx.hotTagSE(); } catch(e){}
    flashGold();
    // カットイン（パートナー交代直後の選手 = 新 legal）
    const teamKey = ev.team === 'A' ? S.pos.legalA : S.pos.legalB;
    const fighter = f(teamKey);
    if (fighter) {
      showCutin(fighter, ev.team === 'A' ? 'left' : 'right', pickHotTagLine(fighter.personality || 'normal'), 'tag-hot');
    }
  } else if (ev.type === 'doubleTeam') {
    showBanner('DOUBLE TEAM!', 'red');
    try { sfx.doubleTeamSE(); } catch(e){}
    // 両パネルに flash
    flashPanel(S.pos.legalA, 'red');
    flashPanel(S.pos.apronA, 'red');
  } else if (ev.type === 'cutinSave') {
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
    flashPanel(victimKey, 'yellow');
  } else if (ev.type === 'betrayal') {
    showBanner('…見殺し', 'grey');
    try { sfx.betrayalSE(); } catch(e){}
    const betrayerKey = keyById(ev.by);
    const panel = document.getElementById('panel-' + betrayerKey);
    if (panel) { panel.classList.add('betrayed'); setTimeout(() => panel.classList.remove('betrayed'), 2500); }
    // セリフ
    const betrayer = f(betrayerKey);
    if (betrayer) {
      const side = (betrayerKey === 'a1' || betrayerKey === 'a2') ? 'left' : 'right';
      showCutin(betrayer, side, pickBetrayalLine(betrayer.personality || 'normal'), 'damage-serif');
    }
  }
}

function animateTouchSwap(team){
  try { sfx.touchSE(); } catch(e){}
  const outKey = team === 'A' ? S.pos.apronA : S.pos.apronB; // 新apronが旧legal
  const inKey  = team === 'A' ? S.pos.legalA : S.pos.legalB; // 新legalが旧apron
  const outPanel = document.getElementById('panel-' + outKey);
  const inPanel  = document.getElementById('panel-' + inKey);
  if (outPanel) { outPanel.classList.add('swap-in'); setTimeout(()=>outPanel.classList.remove('swap-in'), 600); }
  if (inPanel)  { inPanel.classList.add('swap-in');  setTimeout(()=>inPanel.classList.remove('swap-in'), 600); }
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
function flashGold(){
  const ov = document.getElementById('flashOv');
  if (!ov) return;
  ov.classList.remove('flash','red','gold');
  void ov.offsetWidth;
  ov.classList.add('flash','gold');
  setTimeout(() => ov.classList.remove('flash','gold'), 300);
}
function flashPanel(posKey, color){
  const panel = document.getElementById('panel-' + posKey);
  if (!panel) return;
  if (color === 'red') { panel.classList.add('counter-flash'); setTimeout(()=>panel.classList.remove('counter-flash'), 400); }
  else if (color === 'yellow') { panel.classList.add('ff-flash'); setTimeout(()=>panel.classList.remove('ff-flash'), 650); }
}

// ── ダメージセリフ／ボイス ──
function tryDamageLine(action, fr){
  const defKey = keyById(action.defenderId);
  if (!defKey) return;
  const def = f(defKey);
  if (!def) return;
  const hpRatio = def.hp / def.mhp;
  const line = pickDamageLine(def, action.dmg, hpRatio);
  if (!line) return;
  // 1試合あたり同じ選手で頻発しないよう、直前クリット turn から 3ターン以上空ける
  const last = S.lastCritTurn[defKey] || 0;
  if (fr.turn - last < 3) return;
  S.lastCritTurn[defKey] = fr.turn;
  const side = (defKey === 'a1' || defKey === 'a2') ? 'left' : 'right';
  const cssCls = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
  showCutin(def, side, line.text, cssCls);
}

// ── カットイン表示 ──
function showCutin(fighter, side, text, cssCls){
  const ov = document.getElementById('cutinOv');
  if (!ov) return;
  const portraitUrl = getUpperUrl(fighter);
  const dirCls = side === 'right' ? ' right' : '';
  const extraCls = cssCls ? ' ' + cssCls : '';
  ov.innerHTML = `<div class="cutin-box${dirCls}${extraCls}">
    ${portraitUrl ? `<img class="cutin-portrait" src="${portraitUrl}" onerror="this.style.display='none'">` : ''}
    <div class="cutin-info">
      <div class="cutin-name">${fighter.name || ''}</div>
      <div class="cutin-text">「${text}」</div>
      <div class="cutin-dismiss">CLICK TO CLOSE</div>
    </div>
  </div>`;
  ov.classList.add('show');
  S.pendingCutin = true;
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
  // AUTO mode なら次へ
  if (S.autoAdvance && !S.anim && S.frameIdx < S.frames.length) {
    S.autoTimer = setTimeout(() => nextFrame(), 400);
  }
}

// ── AUTO ──
function toggleAuto(){
  S.autoAdvance = !S.autoAdvance;
  if (S.autoAdvance) {
    if (!S.anim && !S.pendingCutin && S.frameIdx < S.frames.length) {
      S.autoTimer = setTimeout(() => nextFrame(), 500);
    }
  } else {
    clearTimeout(S.autoTimer);
  }
  renderMatch();
}

// ── 結果表示 ──
function showResult(fr){
  const result = S.result;
  const winTeam = result.winner; // 'teamA' | 'teamB' | 'draw'
  const finType = result.finType || '';
  const finMove = result.finMove || '';
  const pinnedByKey = keyById(result.winAttribution.pinnedBy);
  const pinnedWhoKey = keyById(result.winAttribution.pinnedWho);
  const pinner = pinnedByKey ? f(pinnedByKey) : null;
  const pinned = pinnedWhoKey ? f(pinnedWhoKey) : null;

  try { sfx.victoryFanfare(); } catch(e){}

  const teamALabel = f('a1').name + ' & ' + f('a2').name;
  const teamBLabel = f('b1').name + ' & ' + f('b2').name;
  const winnerTeamLabel = winTeam === 'teamA' ? teamALabel : winTeam === 'teamB' ? teamBLabel : '引き分け';
  const winnerFighters = winTeam === 'teamA' ? [f('a1'), f('a2')] : winTeam === 'teamB' ? [f('b1'), f('b2')] : [];

  const ov = document.getElementById('resultOv');
  ov.innerHTML = `<div class="result-box" id="resultBox">
    <div class="result-title">MATCH END</div>
    <div class="result-team-row">
      <div class="result-winner-team">
        ${winnerFighters.map(w=>`<img class="result-portrait" src="${getUpperUrl(w)}" onerror="this.style.display='none'">`).join('')}
        <div>
          <div class="result-win-label">${winTeam === 'draw' ? 'DRAW' : 'WIN!'}</div>
          <div style="font-size:14px;font-weight:700;margin-top:4px">${winnerTeamLabel}</div>
        </div>
      </div>
    </div>
    <div class="result-fintype">${finType}${finMove ? ' ／ ' + finMove : ''}</div>
    ${pinner && pinned ? `<div class="result-decision"><strong>${pinner.name}</strong> が <strong>${pinned.name}</strong> をフォール</div>` : ''}
    <div class="result-stats">
      <div class="result-stat"><div class="result-stat-label">MQ</div><div class="result-stat-val mq">${result.mq}</div></div>
      <div class="result-stat"><div class="result-stat-label">Turns</div><div class="result-stat-val">${result.turns}</div></div>
      <div class="result-stat"><div class="result-stat-label">Segments</div><div class="result-stat-val">${(result.segments||[]).length}</div></div>
    </div>
    <button class="btn-end" onclick="endMatch()">EXIT</button>
  </div>`;
  ov.classList.add('show');
  setTimeout(() => { ov.classList.add('visible'); document.getElementById('resultBox').classList.add('visible'); }, 40);
}

function endMatch(){
  // 結果を親に返送
  const result = S.result;
  const msg = {
    type: 'MATCH_RESULT',
    matchType: 'tag',
    // 親は事前計算結果を尊重するので、ここでは最小限返す
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
  const hpPct = Math.max(0, Math.round(ch.hp / ch.mhp * 100));
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
      <div class="bp-name">${ch.name}</div>
      <div class="bp-style">${ch.style || ''}</div>
      <div class="bp-stats">${stats.map(s=>`<div class="bp-stat-row">
        <span class="bp-stat-name">${s.l}</span>
        <div class="bp-stat-track"><div class="bp-stat-fill ${s.k}" style="width:${s.v}%"></div></div>
        <span class="bp-stat-val">${s.v}</span>
      </div>`).join('')}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text-sub)">現在HP: ${Math.max(0,ch.hp)} / ${ch.mhp} (${hpPct}%)</div>
      ${ch.profile ? `<div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.03);border-radius:3px;font-size:12px;line-height:1.6;color:var(--text-sub)">${ch.profile}</div>` : ''}
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
    if (bp.classList.contains('show')) { closeBp(); return; }
    const cu = document.getElementById('cutinOv');
    if (cu.classList.contains('show')) { dismissCutin(); return; }
  }
});
