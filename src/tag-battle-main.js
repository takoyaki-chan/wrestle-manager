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
  pinSeqPending: false,    // このフレームで pin seq を走らせる予定 (ネタバレ抑制用)
  pinStepTimer: null,      // ワン/ツー/ロック 等のリード step 自動進行タイマ
  heldWinLogs: null,       // { turn, held: [lines] } — pin seq 完了まで保留する「★ 決着！」ログ
  pendingDamage: false,    // ダメージポップアップ表示中 (クリック待ち)
  finishCueSent: false,
  cameraMode: 'auto',
  showNumbers: true,
  autoCameraPlan: [],
  cameraLocked: false,
  cameraLockTimer: null,
  matchInfo: null,
  chemA: 0,
  chemB: 0,
  prevSnap: null,          // 前フレーム(タッチ検出用)
};
// SPEED_DELAYS は battle-replay-core.js で定義

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
  S.finishCueSent = false;
  S.cameraMode = 'auto';
  S.showNumbers = true;
  S.autoCameraPlan = _buildAutoCameraPlan(S.frames);
  S.cameraLocked = false;
  clearTimeout(S.cameraLockTimer);

  const mk = (c) => {
    const st = Math.min(100, Math.max(0, c.st || 60));
    // TAG_MATCH_CONFIG.hpBase=70, hpScale=1.00 と一致させる (iframe 側では定数参照できないので同値をハードコード)
    const mhp = Math.round(70 + st * 1.00);
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
  try { sfx.gongStart(); } catch(e){}
}

// ── アクセサ ──
function f(key){ return S.fighters[key]; }
function byId(id){ return S.fighters[S.idToKey[id]]; }
function keyById(id){ return S.idToKey[id]; }
// hpCls は battle-replay-core.js で定義
function _getCurrentFrame(){ return S.frameIdx > 0 && S.frames[S.frameIdx - 1] ? S.frames[S.frameIdx - 1] : null; }

// ── プレゼンテーション変換 ──
// Replay の action / events を初心者向けの技説明とカメラ指示へ翻訳する。
// 数値・フレーム・乱数には一切触れない。
const TAG_MOVE_PRESENTATION = {
  strike:     { label: '打撃技', guide: 'パンチやキックなどで相手の姿勢を崩し、次の攻めにつなげる。' },
  throw:      { label: '投げ技', guide: '相手の重心を奪い、持ち上げるか回転させてマットへ叩きつける。' },
  submission: { label: '関節・絞め技', guide: '関節や首を捕らえて動きを奪い、ギブアップや消耗を狙う。' },
  aerial:     { label: '飛び技', guide: '跳躍や落下の勢いに体重を乗せ、一気に大きな衝撃を与える。' },
  ground:     { label: 'グラウンド攻撃', guide: '倒れた相手へ追撃し、起き上がる余裕と体力を奪う。' },
  rollup:     { label: '丸め込み', guide: '一瞬の体勢変化を使って肩を押さえ、3カウントを狙う。' },
  tag:        { label: '連携技', guide: 'パートナーと呼吸を合わせ、二人の動きを一つの攻撃へつなげる。' },
};

function _actionMoveName(action){
  if (!action) return '---';
  return action.kind === 'counter'
    ? (action.counterMove || action.move || '---')
    : (action.move || '---');
}

function _movePresentation(action, fr){
  const doubleEv = fr && fr.events && fr.events.find(ev => ev.type === 'doubleTeam');
  const cat = doubleEv ? 'tag' : (action && action.moveCat ? action.moveCat : 'strike');
  const base = TAG_MOVE_PRESENTATION[cat] || TAG_MOVE_PRESENTATION.strike;
  const name = doubleEv && doubleEv.move ? doubleEv.move : _actionMoveName(action);
  let guide = base.guide;
  if (/ドロップキック/.test(name)) guide = '両足を突き出して相手を蹴り、勢いと間合いで体勢を崩す打撃。';
  else if (/キック|PK|延髄斬り|ニー/.test(name)) guide = '脚の振りや踏み込みを使い、相手の上半身や足元を狙う打撃。';
  else if (/エルボー|ラリアット|クローズライン|チョップ|パンチ|ブロー|頭突き|ヘッドバット/.test(name)) guide = '腕や頭部を直接ぶつけ、相手の動きと姿勢を止める打撃。';
  else if (/スープレックス|バックドロップ/.test(name)) guide = '相手を抱えて反らすように投げ、背中からマットへ落とす投げ技。';
  else if (/パワーボム|ドライバー|スラム|DDT|ブリーカー|ドロップ/.test(name) && cat === 'throw') guide = '相手を抱え上げるか頭部を制し、落差を使ってマットへ叩きつける投げ技。';
  else if (/ロック|ホールド|クラッチ|固め|絞め|STF|卍|アームバー|ベアハッグ/.test(name) && cat === 'submission') guide = '身体の一部を固定して逃げ道を狭め、ギブアップを迫る技。';
  else if (/ダイビング|プレス|スプラッシュ|ムーンサルト|セントーン|トペ|プランチャ/.test(name)) guide = '高い位置や助走から飛び込み、落下の勢いを全身でぶつける飛び技。';
  return { label: base.label, guide, name };
}

function _moveResultText(action){
  if (!action) return '試合開始';
  const state = action.kind === 'miss' ? 'MISS'
    : action.kind === 'counter' ? 'COUNTER'
    : action.isCrit ? 'BIG HIT' : 'HIT';
  if (!S.showNumbers) return state;
  const dmg = action.kind === 'miss' ? 0 : (action.dmg || 0);
  return `${state} · DMG ${dmg} / PWR ${action.moveD || 0}`;
}

function _buildAutoCameraPlan(frames){
  let holdUntil = -1;
  return (frames || []).map((frame, index) => {
    const events = (frame && frame.events) || [];
    const eventTypes = events.map(ev => ev.type);
    const latePhase = frame && (frame.phase === 'End' || frame.phase === 'Climax');
    const action = frame && frame.action;
    const decisiveAction = !!(action && (action.isCrit || action.kind === 'counter' || (action.moveD|0) >= 14));
    const eventMoment = !!(frame && (frame.winner || eventTypes.some(type =>
      ['hotTag','doubleTeam','cutinSave','friendlyFire','betrayal','pinAttempt'].includes(type))));
    if (eventMoment || (latePhase && decisiveAction)) holdUntil = Math.max(holdUntil, index + 1);
    return index <= holdUntil;
  });
}

function _applyCamera(force){
  const ring = document.getElementById('liveRing');
  if (!ring) return;
  if (!force && S.cameraMode === 'auto' && S.cameraLocked) {
    const chip = document.getElementById('cameraChip');
    if (chip) chip.textContent = `カメラ · 自動・交代中固定`;
    return;
  }
  const idx = Math.max(0, S.frameIdx - 1);
  const close = S.cameraMode === 'close' || (S.cameraMode === 'auto' && !!S.autoCameraPlan[idx]);
  ring.classList.toggle('camera-close', close);
  const chip = document.getElementById('cameraChip');
  if (chip) chip.textContent = S.cameraMode === 'auto'
    ? `カメラ · 自動${close ? 'アップ' : '全景'}`
    : `カメラ · ${close ? 'アップ' : '全景'}`;
}

function setCameraMode(mode){
  if (!['auto','wide','close'].includes(mode)) return;
  S.cameraMode = mode;
  if (mode !== 'auto') S.cameraLocked = false;
  document.querySelectorAll('[data-camera]').forEach(btn => btn.classList.toggle('active', btn.dataset.camera === mode));
  _applyCamera(true);
}

function toggleBattleNumbers(){
  const input = document.getElementById('numberToggle');
  S.showNumbers = input ? !!input.checked : !S.showNumbers;
  const disp = document.getElementById('moveDisplay');
  if (disp) disp.outerHTML = _moveDisplayHtml(_getCurrentFrame());
}

// ── メイン画面(全体)描画 ──
// 試合開始直後の初期描画と、大きな構造リセットが必要な時だけ呼ぶ。
// applyFrame 内の差分更新 (_updateHud/_updateCard/_updateCenter/_appendLog) はピンポイント書換。
function renderMatchFrame(){
  const container = document.getElementById('mainContainer');
  const curFrame = _getCurrentFrame();

  container.innerHTML = `
    ${_hudHtml(curFrame)}
    <div class="wm-tag-presentation" id="mainRow">
      ${_liveRingHtml(curFrame)}
      <div class="wm-tag-lower-dock">
        ${_teamCardHtml('a')}
        <section class="wm-tag-exchange-panel" id="col-center">
          <div class="wm-tag-exchange-head"><span>直近の攻防</span><span>最新が上</span></div>
          <div class="wm-tag-exchange-grid">
            <div class="battle-log" id="battleLog">${S.logHtml || '<div class="log-empty">ゴングを待っています</div>'}</div>
            ${_moveDisplayHtml(curFrame)}
          </div>
        </section>
        ${_teamCardHtml('b')}
      </div>
    </div>
    ${_controlsHtml()}
  `;
  _bindNextButton();
  _scrollLogToTop();
  _applyCamera(true);
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
  const legalA = f(S.pos.legalA), apronA = f(S.pos.apronA);
  const legalB = f(S.pos.legalB), apronB = f(S.pos.apronB);
  const hpA = _fighterHpPct(legalA), hpApronA = _fighterHpPct(apronA);
  const hpB = _fighterHpPct(legalB), hpApronB = _fighterHpPct(apronB);
  const momNorm = S.mom / 50;
  const momL = 50 + momNorm * 30;
  const momR = 50 - momNorm * 30;
  const header = (S.matchInfo && S.matchInfo.header) || 'TAG MATCH';

  return `<div class="wm-hud">
    <div class="wm-hud-top">
      <div class="wm-hud-side">
        <div class="wm-hud-faces">
          <div class="wm-hud-face"><img id="hudFaceALegal" src="${getFaceUrl(legalA)}" onerror="this.style.display='none'"></div>
          <div class="wm-hud-face apron"><img id="hudFaceAApron" src="${getFaceUrl(apronA)}" onerror="this.style.display='none'"></div>
        </div>
        <div class="wm-hud-meta">
          <div class="wm-hud-label">青コーナー</div>
          <div class="wm-hud-name" id="hudTeamNameA">${escHtml(legalA.name)} ＆ ${escHtml(apronA.name)}</div>
          <div class="wm-hud-active-label" id="hudActiveA">リング上 · ${escHtml(legalA.name)}</div>
        </div>
      </div>
      <div class="wm-hud-center">
        <div class="wm-hud-turn" id="hudTurn">TURN ${turn || 1}</div>
        <div class="wm-hud-phase" id="hudPhase">${escHtml(String(phase).toUpperCase())}</div>
        <div class="wm-hud-seg" id="hudSeg">SEG ${segIdx + 1}　${escHtml(header)}</div>
        <div class="wm-tag-chem">連携 <strong>A ${Math.round(S.chemA)}</strong><span>／</span><strong>B ${Math.round(S.chemB)}</strong></div>
      </div>
      <div class="wm-hud-side" style="flex-direction:row-reverse">
        <div class="wm-hud-faces">
          <div class="wm-hud-face"><img id="hudFaceBLegal" src="${getFaceUrl(legalB)}" onerror="this.style.display='none'"></div>
          <div class="wm-hud-face apron"><img id="hudFaceBApron" src="${getFaceUrl(apronB)}" onerror="this.style.display='none'"></div>
        </div>
        <div class="wm-hud-meta right">
          <div class="wm-hud-label">赤コーナー</div>
          <div class="wm-hud-name" id="hudTeamNameB">${escHtml(legalB.name)} ＆ ${escHtml(apronB.name)}</div>
          <div class="wm-hud-active-label" id="hudActiveB">リング上 · ${escHtml(legalB.name)}</div>
        </div>
      </div>
    </div>
    <div class="wm-mom">
      <div class="wm-mom-l" id="momL" style="width:${clamp(momL,0,100)}%"></div>
      <div class="wm-mom-r" id="momR" style="width:${clamp(momR,0,100)}%"></div>
    </div>
    <div class="wm-hp-row">
      <span class="wm-hp-name" id="hudHpNameA">${escHtml(legalA.name)}</span>
      <span class="wm-hp-pct ${hpCls(hpA.ratio)}" id="hudHpPctA">${hpA.pct}%</span>
      <div class="wm-hp-bar"><div class="wm-hp-fill left ${hpCls(hpA.ratio)}" id="hudHpFillA" style="width:${hpA.pct}%"></div></div>
      <span class="wm-hp-label">リング上 HP</span>
      <div class="wm-hp-bar"><div class="wm-hp-fill right ${hpCls(hpB.ratio)}" id="hudHpFillB" style="width:${hpB.pct}%"></div></div>
      <span class="wm-hp-pct ${hpCls(hpB.ratio)}" id="hudHpPctB">${hpB.pct}%</span>
      <span class="wm-hp-name right" id="hudHpNameB">${escHtml(legalB.name)}</span>
    </div>
    <div class="wm-apron-hp-row">
      <div class="wm-apron-hp-side left"><span class="wm-apron-hp-name" id="hudApronNameA">${escHtml(apronA.name)}</span><div class="wm-apron-hp-track"><div class="wm-apron-hp-fill left ${hpCls(hpApronA.ratio)}" id="hudApronFillA" style="width:${hpApronA.pct}%"></div></div><span class="wm-apron-hp-pct" id="hudApronPctA">${hpApronA.pct}%</span></div>
      <span class="wm-apron-hp-label">控え HP</span>
      <div class="wm-apron-hp-side right"><span class="wm-apron-hp-pct" id="hudApronPctB">${hpApronB.pct}%</span><div class="wm-apron-hp-track"><div class="wm-apron-hp-fill right ${hpCls(hpApronB.ratio)}" id="hudApronFillB" style="width:${hpApronB.pct}%"></div></div><span class="wm-apron-hp-name" id="hudApronNameB">${escHtml(apronB.name)}</span></div>
    </div>
  </div>`;
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
  const cls = ['player-card', 'wm-tag-ring-fighter', side === 'a' ? 'left' : 'right'];
  if (ratio <= 0.33) cls.push('danger');
  if (ratio <= 0.25 && ratio > 0) cls.push('silhouette-danger');
  if (ch.gritTurns > 0) cls.push('grit-active');
  if (ch.hotTagBuff > 0) cls.push('hot-tag-buff');
  return `<div class="${cls.join(' ')}" id="card-${side}-legal" data-fighter-key="${posKey}">
    <div class="portrait-area" id="portrait-${side}-legal">
      <img class="wm-tag-full-figure" src="${getFullUrl(ch)}" alt="${escHtml(ch.name)}" onerror="this.style.display='none'">
      <div class="monitor-frame"></div>
      <div class="danger-glow" id="dangerGlow-${side}"${ratio <= 0.25 && ratio > 0 ? ' style="opacity:1"' : ''}></div>
      <div class="speech-bubble" id="sp-${side}"></div>
    </div>
    <button class="wm-tag-ring-nameplate" onclick="openBp('${posKey}')"><span>リング上</span><b class="player-name">${escHtml(ch.name)}</b></button>
  </div>`;
}

function _apronCardHtml(side, posKey){
  const ch = f(posKey);
  return `<div class="player-card wm-tag-ring-helper ${side === 'a' ? 'left' : 'right'}" id="card-${side}-apron" data-fighter-key="${posKey}" aria-hidden="true">
    <div class="portrait-area"><img class="wm-tag-full-figure" src="${getFullUrl(ch)}" alt="" onerror="this.style.display='none'"></div>
    <span class="apron-name">${escHtml(ch.name)}</span>
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

function _liveRingHtml(fr){
  const phase = fr ? (fr.phase || 'Opening') : 'Opening';
  const turn = fr ? fr.turn : 1;
  const nar = fr ? _narrateFrame(fr) : { text:'ゴング！ 「次の攻防」で試合を進めてください', dramatic:false };
  const header = (S.matchInfo && S.matchInfo.header) || 'TAG MATCH';
  return `<section class="wm-tag-live-ring" id="liveRing">
    <img class="wm-tag-ring-bg" src="../image/battle-ring-bg-mockup-v2.webp" alt="プロレス会場のリング" onerror="this.src='../image/battle-bg_venue_4.webp'">
    <div class="wm-tag-ring-grade"></div>
    <div class="wm-tag-team-light left"></div><div class="wm-tag-team-light right"></div>
    <div class="wm-tag-live-label"><i></i>LIVE RING</div>
    <div class="wm-tag-match-chip">${escHtml(header)}</div>
    <div class="wm-tag-phase-chip"><span id="pill">${escHtml(phase)}</span><span id="turnLbl">T${turn}</span></div>
    <div class="wm-tag-camera-chip" id="cameraChip">カメラ · 自動全景</div>
    ${_playerCardHtml('a', 'legal', S.pos.legalA)}${_playerCardHtml('b', 'legal', S.pos.legalB)}
    ${_apronCardHtml('a', S.pos.apronA)}${_apronCardHtml('b', S.pos.apronB)}
    <div class="attack-arrow-layer wm-tag-ring-arrow-layer" id="arrowLayer"></div>
    <div class="bigmove-splash" id="bigmoveSplash"></div>
    <div class="flash-overlay" id="flashOverlay"></div>
    <div class="move-narration wm-tag-commentary${nar.dramatic?' dramatic':''}" id="moveNarration"><span>${nar.text}</span></div>
  </section>`;
}

function _teamCardHtml(side){
  const legalKey = side === 'a' ? S.pos.legalA : S.pos.legalB;
  const apronKey = side === 'a' ? S.pos.apronA : S.pos.apronB;
  return `<article class="wm-tag-team-card ${side === 'a' ? 'left' : 'right'}" id="teamCard-${side}">
    ${_teamMemberHtml(side, 'legal', legalKey)}
    ${_teamMemberHtml(side, 'apron', apronKey)}
  </article>`;
}

function _teamMemberHtml(side, layer, posKey){
  const ch = f(posKey);
  const hp = _fighterHpPct(ch);
  const active = layer === 'legal';
  const role = active ? 'リング上' : '控え';
  const recovery = active ? '' : ' · 回復中';
  return `<div class="wm-tag-member${active?' active':''}" id="team-${side}-${layer}" data-fighter-key="${posKey}">
    <img class="wm-tag-member-upper" src="${getUpperUrl(ch)}" alt="" onerror="this.style.display='none'">
    <div class="wm-tag-member-profile">
      <div class="wm-tag-member-head"><button onclick="openBp('${posKey}')">${escHtml(ch.name)}</button><strong>OVR ${_calcOvr(ch)}</strong></div>
      <div class="wm-tag-member-meta"><span class="wm-tag-member-role">${role}</span><span>${escHtml(ch.style||'')}${recovery}</span></div>
    </div>
    <div class="wm-tag-micro-stats">${_statsHtml(ch, side)}</div>
    <div class="wm-tag-member-hp"><span>HP ${hp.pct}%</span><div><i class="${hpCls(hp.ratio)}" style="width:${hp.pct}%"></i></div></div>
  </div>`;
}

function _moveDisplayHtml(fr){
  const action = fr && fr.action;
  const meta = _movePresentation(action, fr);
  return `<div class="move-display wm-tag-move-detail" id="moveDisplay">
    <div class="move-label" id="moveCatLabel">${escHtml(meta.label)}</div>
    <div class="move-name" id="moveName">${escHtml(meta.name)}</div>
    <div class="wm-move-guide" id="moveGuide">${escHtml(meta.guide)}</div>
    <div class="move-damage wm-move-result" id="moveDmg">${escHtml(_moveResultText(action))}</div>
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
    if (ev.type === 'doubleTeam') {
      // T1: 技カテゴリに応じて実況文を選択。フィニッシュにつながる場合は別プールから決め台詞。
      const isFinish = !!(fr.winner && fr.events.some(e => e.type === 'doubleTeam'));
      return { text: pickDoubleTeamCommentary(ev.moveCat, isFinish), dramatic:true };
    }
    if (ev.type === 'cutinSave') return { text:'パートナーが間一髪で救出！ これがタッグマッチ！', dramatic:true };
    if (ev.type === 'friendlyFire') return { text:'あーっと！ 味方に当たってしまった！ 痛恨のミス！', dramatic:true };
    if (ev.type === 'betrayal') return { text:'助けに行かない…！ なんということだ…！', dramatic:true };
  }
  if (fr.winner) {
    // ピン seq が進行予定なら「決着！」ネタバレを隠し、seq 完了まで「…！？」に差し替え
    if (S.pinSeqPending) return { text:'…！？', dramatic:true };
    return { text:'決着！', dramatic:true };
  }
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
  const btnLabel = winnerFrame ? '結果を見る' : (endState ? '試合終了' : '次の攻防 ▶');
  const btnDisabled = S.anim || S.pendingCutin;
  const dots = [0,1,2].map(i => `<button class="speed-dot wm-speed-btn ${i === S.speedIdx ? 'on' : 'off'}" onclick="setSpeed(${i})">${i+1}×</button>`).join('');
  return `<div class="controls-sub">
    <div class="wm-control-left">
      <button class="btn btn-auto${S.autoAdvance?' active':''}" id="autoBtn" onclick="toggleAuto()">自動再生<span>${S.autoAdvance?'再生中':'停止'}</span></button>
      <div class="wm-control-set"><span>速度</span><div class="speed-dots">${dots}</div></div>
    </div>
    <div class="wm-control-center"><button class="btn-main" id="nBtn"${btnDisabled ? ' disabled' : ''}>${btnLabel}</button></div>
    <div class="wm-control-right">
      <div class="wm-control-set"><span>カメラ</span><div class="wm-camera-buttons">
        <button data-camera="auto" class="${S.cameraMode==='auto'?'active':''}" onclick="setCameraMode('auto')">自動</button>
        <button data-camera="wide" class="${S.cameraMode==='wide'?'active':''}" onclick="setCameraMode('wide')">全景</button>
        <button data-camera="close" class="${S.cameraMode==='close'?'active':''}" onclick="setCameraMode('close')">アップ</button>
      </div></div>
      <label class="wm-number-toggle"><input id="numberToggle" type="checkbox" onchange="toggleBattleNumbers()"${S.showNumbers?' checked':''}> 正確な数値</label>
    </div>
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
  const legalA = f(S.pos.legalA), apronA = f(S.pos.apronA);
  const legalB = f(S.pos.legalB), apronB = f(S.pos.apronB);
  const hpA = _fighterHpPct(legalA), hpApronA = _fighterHpPct(apronA);
  const hpB = _fighterHpPct(legalB), hpApronB = _fighterHpPct(apronB);
  const elTurn = document.getElementById('hudTurn');
  const elPhase = document.getElementById('hudPhase');
  const elSeg = document.getElementById('hudSeg');
  if (fr && elTurn) elTurn.textContent = `TURN ${fr.turn}`;
  if (fr && elPhase) elPhase.textContent = String(fr.phase||'').toUpperCase();
  if (fr && elSeg) elSeg.textContent = `SEG ${fr.segmentIdx + 1}　${(S.matchInfo && S.matchInfo.header) || 'TAG MATCH'}`;
  const updateHp = (fillId, pctId, nameId, hp, name, fillClass) => {
    const fill = document.getElementById(fillId);
    const pct = document.getElementById(pctId);
    const nameEl = document.getElementById(nameId);
    if (fill) { fill.style.width = hp.pct + '%'; fill.className = `${fillClass} ${hpCls(hp.ratio)}`; }
    if (pct) { pct.textContent = hp.pct + '%'; pct.className = pctId.includes('Apron') ? 'wm-apron-hp-pct' : `wm-hp-pct ${hpCls(hp.ratio)}`; }
    if (nameEl) nameEl.textContent = name;
  };
  updateHp('hudHpFillA','hudHpPctA','hudHpNameA',hpA,legalA.name,'wm-hp-fill left');
  updateHp('hudHpFillB','hudHpPctB','hudHpNameB',hpB,legalB.name,'wm-hp-fill right');
  updateHp('hudApronFillA','hudApronPctA','hudApronNameA',hpApronA,apronA.name,'wm-apron-hp-fill left');
  updateHp('hudApronFillB','hudApronPctB','hudApronNameB',hpApronB,apronB.name,'wm-apron-hp-fill right');
  const teamNameA = document.getElementById('hudTeamNameA');
  const teamNameB = document.getElementById('hudTeamNameB');
  const activeA = document.getElementById('hudActiveA');
  const activeB = document.getElementById('hudActiveB');
  if (teamNameA) teamNameA.textContent = `${legalA.name} ＆ ${apronA.name}`;
  if (teamNameB) teamNameB.textContent = `${legalB.name} ＆ ${apronB.name}`;
  if (activeA) activeA.textContent = `リング上 · ${legalA.name}`;
  if (activeB) activeB.textContent = `リング上 · ${legalB.name}`;
  [['hudFaceALegal',legalA],['hudFaceAApron',apronA],['hudFaceBLegal',legalB],['hudFaceBApron',apronB]].forEach(([id,ch]) => {
    const img = document.getElementById(id);
    if (img) { img.src = getFaceUrl(ch); img.style.display = ''; }
  });
  const pill = document.getElementById('pill');
  const turnLbl = document.getElementById('turnLbl');
  if (fr && pill) pill.textContent = fr.phase || '';
  if (fr && turnLbl) turnLbl.textContent = `T${fr.turn}`;
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
  const ch = f(posKey);
  if (!ch) return;
  const ratio = ch.mhp > 0 ? Math.max(0,ch.hp)/ch.mhp : 0;
  if (el && el.dataset.fighterKey !== posKey) {
    el.outerHTML = layer === 'legal' ? _playerCardHtml(side, layer, posKey) : _apronCardHtml(side, posKey);
  }
  if (layer === 'legal') {
    const current = document.getElementById(id);
    if (current) {
      current.classList.toggle('danger', ratio <= 0.33);
      current.classList.toggle('silhouette-danger', ratio <= 0.25 && ratio > 0);
      current.classList.toggle('grit-active', ch.gritTurns > 0);
      current.classList.toggle('hot-tag-buff', ch.hotTagBuff > 0);
      const glow = document.getElementById(`dangerGlow-${side}`);
      if (glow) glow.classList.toggle('show', ratio <= 0.25 && ratio > 0);
    }
  }
  const member = document.getElementById(`team-${side}-${layer}`);
  if (member) member.outerHTML = _teamMemberHtml(side, layer, posKey);
}

function _updateCenter(fr){
  const disp = document.getElementById('moveDisplay');
  if (disp) disp.outerHTML = _moveDisplayHtml(fr);
  const nar = _narrateFrame(fr);
  const narEl = document.getElementById('moveNarration');
  if (narEl) {
    narEl.innerHTML = `<span>${nar.text}</span>`;
    narEl.className = `move-narration wm-tag-commentary${nar.dramatic?' dramatic':''}`;
  }
  const mn = document.getElementById('moveName');
  if (mn) { mn.classList.remove('pop'); void mn.offsetWidth; mn.classList.add('pop'); }
  _applyCamera();
}

// 結末を示唆するログ行（pin/rollup/tkoStop シーケンス完了まで保留）
const _SPOILER_LINE_RE = /(★|カウント2で返した|振りほどいた|キックアウト|ロープエスケープ|カットイン|見殺し|丸め込み|タップ|なんとか阻止|返した)/;
function _isSpoilerLine(line){
  const t = String(line).trim();
  return _SPOILER_LINE_RE.test(t);
}

function _appendLogForFrame(fr){
  if (!fr) return;
  const evClass = _detectEventClass(fr);
  const turnMarker = `<div class="log-new-marker">— Turn ${fr.turn} —</div>`;
  let rawLines = fr.logLines || [];
  // ピン seq 予定フレーム: ★決着行＋結末示唆行（カットイン/見殺し/カウント2返し/丸め込み等）を保留
  if (S.pinSeqPending) {
    const held = rawLines.filter(l => _isSpoilerLine(l));
    rawLines = rawLines.filter(l => !_isSpoilerLine(l));
    S.heldWinLogs = { turn: fr.turn, held };
  }
  const lines = rawLines.map(l => _logLineHtml(l, fr)).join('');
  // 新しいターンを先頭に追加 (新しい順 = 上が最新)
  S.logHtml = turnMarker + lines + S.logHtml;
  S.lastEventClass = evClass;
  const lb = document.getElementById('battleLog');
  if (lb) {
    lb.innerHTML = S.logHtml;
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
// FRAME_DELAYS / _frameMinDelay は battle-replay-core.js で定義

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
    const hasPinSeq = fr.events && fr.events.some(e => e.type === 'pinAttempt');
    if (hasPinSeq) return;
    _notifyFinishCue();
    setTimeout(() => showResult(fr), 1800);
    return;
  }
  const delay = _frameMinDelay(fr) + (touchHappened ? 750 : 0);
  if (S.autoAdvance && S.frameIdx < S.frames.length) {
    const speedD = SPEED_DELAYS[S.speedIdx] || 1500;
    S.autoTimer = setTimeout(() => nextFrame(), Math.max(delay + 300, speedD));
  }
}

// 大技フレームは single battle-engine.html L1939-2002 の 3 段タイミングを踏襲:
//   t=0     sfx.bigmoveCharge() のみ (DOM / ログ / HUD / 演出は完全停止)
//   t=1800  ナレーション・ログ・HUD・技名・ドラマイベント・タッチ演出を一斉に解禁
//   t=2300  _renderActionImpact (bigmoveImpact + hitSE + ダメージポップ + shake + flash + splash)
//   t=2700  tryDamageLine (被弾セリフ/ボイス)
// これにより「溜めの最中に他の演出が炸裂する」drift を封じる。
// BIGMOVE_CHARGE_MS は battle-replay-core.js で定義

function applyFrame(fr){
  S.anim = true;
  // ピン seq 予定のフレームなら「決着！」ナレーションと「★ 決着！」ログをホールド
  // (seq 完了後に _finishPinSeq が剥がす)
  S.pinSeqPending = !!(fr && fr.events && fr.events.some(e => e.type === 'pinAttempt'));
  const prevLegalA = S.pos.legalA, prevLegalB = S.pos.legalB;
  const newLegalAKey = keyById(fr.legalA);
  const newLegalBKey = keyById(fr.legalB);
  const newApronAKey = keyById(fr.apronA);
  const newApronBKey = keyById(fr.apronB);
  const touchA = newLegalAKey !== prevLegalA;
  const touchB = newLegalBKey !== prevLegalB;
  if ((touchA || touchB) && S.cameraMode === 'auto') {
    S.cameraLocked = true;
    clearTimeout(S.cameraLockTimer);
  }

  // HP/バフ/position は即時更新（JS 状態、DOM には反映しない）
  ['a1','a2','b1','b2'].forEach(k => {
    const ch = S.fighters[k];
    if (fr.hp[ch.id] != null) ch.hp = fr.hp[ch.id];
    if (fr.grit && fr.grit[ch.id] != null) ch.gritTurns = fr.grit[ch.id];
    if (fr.hotTagBuff && fr.hotTagBuff[ch.id] != null) ch.hotTagBuff = fr.hotTagBuff[ch.id];
  });
  S.pos = { legalA: newLegalAKey, apronA: newApronAKey, legalB: newLegalBKey, apronB: newApronBKey };
  S.mom = fr.mom || 0;

  const isBigMove = !!(fr.action && fr.action.kind !== 'miss' && fr.action.dmg >= 20);
  const chargeDelay = isBigMove ? BIGMOVE_CHARGE_MS : 0;
  const touchPause = (touchA || touchB) ? 700 : 0;

  if (isBigMove) {
    // 溜め音だけ先に再生。ナレーション・HUD・カード・ログは前フレームの状態のまま固定。
    try { sfx.bigmoveCharge(); } catch(e){}
    // D3: 溜め中は攻撃者パネルに charging クラスを付与して発光 (どちらが溜めているか視覚化)
    if (fr.action && fr.action.attackerId) {
      const atkKey = keyById(fr.action.attackerId);
      const atkSide = (atkKey === 'a1' || atkKey === 'a2') ? 'a' : 'b';
      const atkCard = document.getElementById(`card-${atkSide}-legal`);
      if (atkCard) atkCard.classList.add('charging');
    }
  }

  setTimeout(() => _applyFrameVisuals(fr, touchA, touchB, isBigMove), chargeDelay);

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

function _applyFrameVisuals(fr, touchA, touchB, isBigMove){
  // D3: 溜め終了時に全カードから charging を解除 (衝撃演出に切り替わる)
  ['a','b'].forEach(s => {
    const el = document.getElementById(`card-${s}-legal`);
    if (el) el.classList.remove('charging');
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

  // DOM 差分更新（タッチ中のlegalカードは後で入れ替えるためスキップ）
  _updateHud();
  _updateCardsAfterFrame(touchA, touchB);
  _updateCenter(fr);
  _appendLogForFrame(fr);

  if (fr.action) animateAction(fr.action, fr, isBigMove);
  if (fr.events && fr.events.length > 0) {
    (fr.events || []).forEach(ev => animateEvent(ev, fr));
  }
  if (touchA) animateTouchSwap('a', fr);
  if (touchB) animateTouchSwap('b', fr);

  const pinEv = fr.events && fr.events.find(e => e.type === 'pinAttempt');
  // クリティカルダメージセリフ: ピンフレームではピン演出が主役なのでスキップ
  // 大技は _renderActionImpact が 500ms 遅延で撃つので、セリフはさらに 400ms 後 = 900ms
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit && !pinEv) {
    const serifDelay = isBigMove ? 900 : 600;
    setTimeout(() => tryDamageLine(fr.action, fr), serifDelay);
  }
  if (pinEv) _beginPinSequence(pinEv, fr);

  S.prevSnap = { legalA: fr.legalA, legalB: fr.legalB };
}

// ── 演出 ──
// SE 層は single battle-engine.html 準拠。主な分配:
//   - ターン頭 sfx.ready() 必須 (single L1781/1814/1876/2007 と同じ)
//   - 大技 (action.dmg>=20) は applyFrame 側で sfx.bigmoveCharge() を t=0 に先行再生し、
//     ナレーション・HUD・技名を 1800ms 保留 → ここでは衝撃演出を +500ms 後に撃つだけ
//     (全体タイムライン: 0ms charge / 1800ms 技名表示 / 2300ms 衝撃 / 2700ms セリフ)
//   - カウンター SE は half-volume (single L1881 の `counterSE*0.5` 準拠)
//   - hitSE の volMul は 大技 1.3 / 通常 1.0 (single L1839/1883/1961 が 1.3 / L2023 が無指定=1.0)
function animateAction(action, fr, isBigMove){
  // 毎ターン頭の準備音
  try { sfx.ready(); } catch(e){}

  const ring = document.getElementById('liveRing');
  const atkKeyForStage = action && keyById(action.attackerId);
  if (ring && atkKeyForStage) {
    const attackClass = (atkKeyForStage === 'a1' || atkKeyForStage === 'a2') ? 'attack-left' : 'attack-right';
    ring.classList.remove('attack-left', 'attack-right', 'miss');
    void ring.offsetWidth;
    ring.classList.add(attackClass);
    if (action.kind === 'miss') ring.classList.add('miss');
    setTimeout(() => ring.classList.remove(attackClass, 'miss'), 700);
  }

  if (action.kind === 'miss') {
    try { sfx.missWhiff(); } catch(e){}
    // D2: MISS 時もグレー矢印で方向性を示す
    _spawnAttackArrow(action);
    return;
  }

  // 攻撃方向矢印 (T5): counter は 2段階、通常は単発
  _spawnAttackArrow(action);

  if (isBigMove) {
    // 溜め音は applyFrame 側で先行済み。技名表示 (_updateCenter) の 500ms 後に衝撃
    setTimeout(() => _renderActionImpact(action), 500);
    return;
  }

  _renderActionImpact(action);
}

// T5: 攻撃方向矢印 spawn (battle-shared.css の .attack-arrow* を使用)。
// - 通常/ミス以外: 攻撃側 → 被攻撃側に矢印 + 技名ラベル
// - カウンター: 段階1 (元の攻撃を示す逆向き矢印) → 1000ms後 段階2 (返しの太い矢印) の2段構成
function _spawnAttackArrow(action){
  const layer = document.getElementById('arrowLayer');
  if (!layer) return;
  const atkKey = keyById(action.attackerId);
  if (!atkKey) return;
  const atkSide = (atkKey === 'a1' || atkKey === 'a2') ? 'a' : 'b';
  const isMiss = action.kind === 'miss';
  if (action.kind === 'counter') {
    // counter: 段階1 元の攻撃側 → 段階2 返し (逆向き太い)
    const origAtkKey = keyById(action.defenderId);
    const origAtkSide = origAtkKey && (origAtkKey === 'a1' || origAtkKey === 'a2') ? 'a' : 'b';
    const stage1Dir = origAtkSide === 'a' ? 'ltr' : 'rtl';
    const stage2Dir = stage1Dir === 'ltr' ? 'rtl' : 'ltr';
    _renderArrow(layer, stage1Dir, action.origMove || '攻撃', false, false);
    setTimeout(() => _renderArrow(layer, stage2Dir, 'カウンター！ ' + (action.move || ''), true, false), 1000);
  } else {
    const dir = atkSide === 'a' ? 'ltr' : 'rtl';
    _renderArrow(layer, dir, action.move || '攻撃', false, isMiss);
  }
}

function _renderArrow(layer, dir, labelText, isCounter, isMiss){
  // 同方向の古い矢印を掃除
  [...layer.querySelectorAll('.attack-arrow')].forEach(el => {
    el.style.transition = 'opacity 0.15s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 180);
  });
  const arrow = document.createElement('div');
  arrow.className = 'attack-arrow ' + dir + (isCounter ? ' counter-reversal' : '') + (isMiss ? ' miss' : '');
  const headChar = dir === 'ltr' ? '▶' : '◀';
  arrow.innerHTML = `<div class="shaft"></div><div class="head">${headChar}</div><div class="label">${escHtml(labelText)}</div>`;
  layer.appendChild(arrow);
  void arrow.offsetWidth;
  arrow.classList.add('play');
  setTimeout(() => { if (arrow.parentNode) arrow.remove(); }, 1600);
}

function _renderActionImpact(action){
  // 多層防御: MISS フレームでは衝撃演出を絶対に出さない
  if (!action || action.kind === 'miss') return;
  const defKey = keyById(action.defenderId);
  const atkKey = keyById(action.attackerId);
  const defSide = (defKey === 'a1' || defKey === 'a2') ? 'a' : 'b';
  const atkSide = (atkKey === 'a1' || atkKey === 'a2') ? 'a' : 'b';
  const isBigMove = action.dmg >= 20;

  // ダメージポップ (レガル側のみ)
  if (defKey === S.pos.legalA || defKey === S.pos.legalB) {
    _showDmgPop(defSide, action.dmg, action.isCrit, action.kind === 'counter');
  }
  // パネルシェイク (レガル側のみ)
  if (defKey === S.pos.legalA || defKey === S.pos.legalB) {
    _applyShake(document.getElementById(`card-${defSide}-legal`), action.isCrit);
  }
  // カウンターフラッシュ (レガル側のみ) + 半音量 counterSE
  if (action.kind === 'counter') {
    const atkCardEl = (atkKey === S.pos.legalA || atkKey === S.pos.legalB)
      ? document.getElementById(`card-${atkSide}-legal`) : null;
    _applyCounterFlash(atkCardEl);
  }
  _playImpactSE(action);
  if (action.isCrit && isBigMove) _flashRedOverlay(document.getElementById('flashOv'));
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

function _showRingHelperFor(side, duration){
  const helper = document.getElementById(`card-${side}-apron`);
  if (!helper) return;
  helper.classList.remove('show');
  void helper.offsetWidth;
  helper.classList.add('show');
  setTimeout(() => helper.classList.remove('show'), duration || 1350);
}

function animateEvent(ev, fr){
  if (ev.type === 'hotTag') {
    showBanner('反撃のタッチ！', 'gold');
    try { sfx.hotTagSE(); } catch(e){}
    flashGold();
    const teamKey = ev.team === 'A' ? S.pos.legalA : S.pos.legalB;
    const fighter = f(teamKey);
    if (fighter) showCutin(fighter, ev.team === 'A' ? 'left' : 'right', pickHotTagLine(fighter), 'tag-hot');
  } else if (ev.type === 'doubleTeam') {
    showBanner('ダブルチーム！', 'red');
    try { sfx.doubleTeamSE(); } catch(e){}
    const firstKey = keyById(Array.isArray(ev.by) ? ev.by[0] : ev.by);
    if (firstKey) _showRingHelperFor(firstKey === 'a1' || firstKey === 'a2' ? 'a' : 'b', 1500);
  } else if (ev.type === 'cutinSave') {
    // pinAttempt(outcome=cutinSave) と同フレームなら pin シーケンス内で扱うためスキップ
    const hasPinCutin = fr && fr.events && fr.events.some(e => e.type === 'pinAttempt' && e.outcome === 'cutinSave');
    if (hasPinCutin) return;
    const saverKey = keyById(ev.by);
    showBanner('カットイン！', 'gold');
    try { sfx.cutinSlide(); } catch(e){}
    const saver = f(saverKey);
    if (saver) {
      const side = (saverKey === 'a1' || saverKey === 'a2') ? 'left' : 'right';
      _showRingHelperFor(side === 'left' ? 'a' : 'b', 1500);
      showCutin(saver, side, pickCutinSaveLine(saver), 'tag-save');
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
      showCutin(betrayer, cutinSide, pickBetrayalLine(betrayer), 'damage-serif');
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

  // 交代中は画像倍率を変えず、同じ表示枠のまま水平方向だけで入れ替える。
  setTimeout(() => {
    _refreshCard(side, 'legal', posKey);
    const card = document.getElementById(`card-${side}-legal`);
    if (card) {
      card.classList.remove('tag-out-legal', 'tag-in-legal', hlCls);
      void card.offsetWidth;
      card.classList.add('tag-in-legal', hlCls);
      setTimeout(() => card.classList.remove('tag-in-legal'), 600);
      setTimeout(() => card.classList.remove(hlCls), 1600);
    }
  }, 330);

  clearTimeout(S.cameraLockTimer);
  S.cameraLockTimer = setTimeout(() => {
    S.cameraLocked = false;
    _applyCamera(true);
  }, 660);

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
// PIN_SEQ_LEAD_MS は battle-replay-core.js で定義

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
  const { attemptType, outcome, count } = pinEv;
  const seq = [];
  // ダメージセリフ/ボイス: crit ヒットで pickDamageLine が line を返したら先頭に配置。
  //「ビッグムーブ食らう → 苦悶 → カバー → ワン、ツー、スリー」の流れを作る。
  // ただし rollup は逆カウンター (守備側が勝つ) なので攻撃側のダメージは出さない。
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit && attemptType !== 'rollup') {
    const defKey = keyById(fr.action.defenderId);
    const def = defKey ? f(defKey) : null;
    if (def) {
      const hpRatio = def.hp / def.mhp;
      let line = pickDamageLine(def, fr.action.dmg, hpRatio);
      const lastCrit = S.lastCritTurn[defKey] || 0;
      if (line && fr.turn - lastCrit >= 3) {
        S.lastCritTurn[defKey] = fr.turn;
        // firing-grudge-spec-v0.1 Phase 5: vsExHit 50% bias（HP 33% 超のみ）
        if (def.vsExHit && Array.isArray(def.vsExHit) && def.vsExHit.length > 0 && hpRatio > 0.33 && Math.random() < 0.5) {
          const text = def.vsExHit[Math.floor(Math.random() * def.vsExHit.length)];
          line = { type: 'serif', text };
        }
        const side = (defKey === 'a1' || defKey === 'a2') ? 'left' : 'right';
        const cssCls = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
        seq.push({ kind: 'damage', fighter: def, side, text: line.text, cssCls });
      }
    }
  }
  // 攻撃者/被攻撃者の名前取得 (タップ文言埋め込み用、fall/gu は def が押さえ込まれ側)
  const atkKey2 = fr.action ? keyById(fr.action.attackerId) : null;
  const defKey2 = fr.action ? keyById(fr.action.defenderId) : null;
  const atkChar = atkKey2 ? f(atkKey2) : null;
  const defChar = defKey2 ? f(defKey2) : null;
  const moveName = (fr.action && fr.action.move) || '';
  // シングル battle-engine.html の showFinishClickBtn ラベルに完全準拠
  // 結末ネタバレ防止: 全 attemptType で結末を示唆しない汎用文に統一
  const FINISH_LABELS = { 'fall': '…！？', 'pin': '…！？', 'gu': '…！？', 'rollup': '…！？', 'tko': '…！？' };
  // D4: カウント前導入ナレーション (attemptType 別の短文。moveNarration に出してサスペンスを作る)
  const INTRO_NARRATIONS = {
    fall: ['フォールに入った！ ここで決まるのか！？', '押さえ込んだーっ！ スリーカウントなるか！？', 'カバー！ これで決着か！？'],
    pin: ['押さえ込んだーっ！ これで決まるのか！？', '強引にフォールへ！ 返せるのか！？', 'カバーに入った！ 決着か！？'],
    tko: ['もう立ち上がれない…！ レフェリーが試合を見ている！', '意識が飛んでいる…！ TKOか！？', 'これ以上は危険だ！ ストップがかかるか！？'],
  };
  const _pickIntro = (type) => {
    const arr = INTRO_NARRATIONS[type];
    if (!arr) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  // attemptType 別にカウント/専用テキストを構築 (シングル battle-engine.html 準拠)
  // シングルの順序: 導入ナレーション → ワン/ツー → finishClick box → 最終カウント(スリー/返した/タップ/エスケープ)
  if (attemptType === 'tko') {
    // TKO: 導入ナレーション → finishClick → 「TKO！！」大 flash (ワン/ツー なし)
    const introT = _pickIntro('tko');
    if (introT) seq.push({ kind: 'introBig', text: introT, dramatic: true });
    seq.push({ kind: 'finishClick', label: FINISH_LABELS.tko });
    seq.push({ kind: 'count', text: 'TKO！！', cls: 'tko' });
  } else if (attemptType === 'gu') {
    // ギブアップ: ロック → (win のみ) 極まり → finishClick → タップ/エスケープ
    if (defChar) {
      const lockText = atkChar ? `${atkChar.name}が${defChar.name}に${moveName}をがっちりロック！` : `${defChar.name}に${moveName}が極まった！`;
      seq.push({ kind: 'introBig', text: lockText, dramatic: true });
      if (outcome === 'win') {
        seq.push({ kind: 'finishClick', label: FINISH_LABELS.gu });
        seq.push({ kind: 'count', text: `${defChar.name}がタップ！！`, cls: 'tap' });
      } else if (outcome === 'escape') {
        seq.push({ kind: 'finishClick', label: FINISH_LABELS.gu });
        seq.push({ kind: 'count', text: 'ロープ！ ロープブレイクーーっ！！', cls: 'escape' });
      }
    }
  } else if (attemptType === 'rollup') {
    // 丸め込み: 主体/対象ナレーション → ワン/ツー → finishClick → スリー/cutin
    const subjKey = keyById(pinEv.byId);
    const objKey = keyById(pinEv.onId);
    const subjChar = subjKey ? f(subjKey) : null;
    const objChar = objKey ? f(objKey) : null;
    const subjSide = (subjKey === 'a1' || subjKey === 'a2') ? 'a' : 'b';
    const objSide = subjSide === 'a' ? 'b' : 'a';
    const statusText = subjChar ? `${subjChar.name}が押さえ込んでいる！` : '押さえ込んでいる！';

    if (subjChar && objChar) {
      seq.push({ kind: 'introBig', text: `${subjChar.name}が${objChar.name}を丸め込んだ！`, dramatic: true, rollupHighlight: { subjSide, objSide } });
    }
    if (count >= 1) seq.push({ kind: 'count', text: 'ワン！', cls: '', rollupStatus: statusText });
    if (count >= 2) seq.push({ kind: 'count', text: 'ツー！', cls: 'two', rollupStatus: statusText });
    seq.push({ kind: 'finishClick', label: FINISH_LABELS.rollup });
    if (outcome === 'win') {
      seq.push({ kind: 'count', text: '3ーーーっ！！', cls: 'three', rollupStatus: statusText });
    } else if (outcome === 'cutinSave') {
      const cutinEv = fr.events && fr.events.find(e => e.type === 'cutinSave');
      if (cutinEv) {
        const saverKey = keyById(cutinEv.by);
        const saver = saverKey ? f(saverKey) : null;
        if (saver) {
          const side = (saverKey === 'a1' || saverKey === 'a2') ? 'left' : 'right';
          seq.push({ kind: 'cutin', saver, side, line: pickCutinSaveLine(saver) });
        }
      }
    }
  } else {
    // fall / pin: 導入ナレーション → ワン/ツー → finishClick → スリー/返した/cutin
    const introF = _pickIntro(attemptType === 'pin' ? 'pin' : 'fall');
    if (introF) seq.push({ kind: 'introBig', text: introF, dramatic: true });
    if (count >= 1) seq.push({ kind: 'count', text: 'ワン！', cls: '' });
    if (count >= 2) seq.push({ kind: 'count', text: 'ツー！', cls: 'two' });
    seq.push({ kind: 'finishClick', label: FINISH_LABELS[attemptType] || FINISH_LABELS.fall });
    if (outcome === 'win' || outcome === 'betrayalWin') {
      seq.push({ kind: 'count', text: '3ーーーーっ！！！', cls: 'three' });
    } else if (outcome === 'kickout') {
      seq.push({ kind: 'count', text: '返したーーーーっ！！', cls: 'kickout' });
    } else if (outcome === 'cutinSave') {
      const cutinEv = fr.events && fr.events.find(e => e.type === 'cutinSave');
      if (cutinEv) {
        const saverKey = keyById(cutinEv.by);
        const saver = saverKey ? f(saverKey) : null;
        if (saver) {
          const side = (saverKey === 'a1' || saverKey === 'a2') ? 'left' : 'right';
          seq.push({ kind: 'cutin', saver, side, line: pickCutinSaveLine(saver) });
        }
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
  // ワン/ツー/ロック/極まり は「リードステップ」として自動進行する (シングル battle-engine.html の setTimeout チェーン準拠)。
  // 最終ステップ (スリー/返した/タップ/エスケープ/TKO/rollupIntro 後の決着) だけクリック待機。
  const isFinal = idx === S.pinCtrl.seq.length - 1;
  const isLead = !isFinal && (step.kind === 'count' || step.kind === 'narration' || step.kind === 'introBig');

  if (step.kind === 'count') {
    _spawnPinCount(step.text, step.cls);
    // 丸め込みカウント中は moveNarration に「{主体}が押さえ込んでいる！」を継続表示 (T3)
    if (step.rollupStatus) {
      const narEl = document.getElementById('moveNarration');
      if (narEl) {
        narEl.textContent = step.rollupStatus;
        narEl.className = 'move-narration wm-tag-commentary dramatic rollup-status';
      }
    }
    _schedulePinAdvance(isLead, step.cls);
  } else if (step.kind === 'narration') {
    const narEl = document.getElementById('moveNarration');
    if (narEl) {
      narEl.textContent = step.text;
      narEl.className = 'move-narration wm-tag-commentary' + (step.dramatic ? ' dramatic' : '');
    }
    // 丸め込み intro narration: 主体/対象のパネルハイライトを付与 (T3)
    if (step.rollupHighlight) {
      _applyRollupHighlight(step.rollupHighlight.subjSide, step.rollupHighlight.objSide);
      try { sfx.cutinSlide(); } catch(e){}
    } else {
      try { sfx.dmgVoice(); } catch(e){}
    }
    _schedulePinAdvance(isLead, 'narration');
  } else if (step.kind === 'introBig') {
    // 決着寸前導入: 画面中央に大きな文字で「フォールに入った！」等を表示 + moveNarration にも同じテキスト
    _spawnBigIntro(step.text);
    const narEl = document.getElementById('moveNarration');
    if (narEl) {
      narEl.textContent = step.text;
      narEl.className = 'move-narration wm-tag-commentary' + (step.dramatic ? ' dramatic' : '');
    }
    if (step.rollupHighlight) {
      _applyRollupHighlight(step.rollupHighlight.subjSide, step.rollupHighlight.objSide);
      try { sfx.cutinSlide(); } catch(e){}
    } else {
      try { sfx.finImpact(); } catch(e){}
    }
    _schedulePinAdvance(isLead, 'introBig');
  } else if (step.kind === 'finishClick') {
    // D5: シングル showFinishClickBtn 準拠のボックス型クリック待機。
    // 画面下部に「スリーカウント…！？」等のラベルを pulse 表示、クリック or Space/Enter で次へ。
    _showFinishClickBox(step.label, () => _advancePinStep());
  } else if (step.kind === 'damage') {
    // ダメージセリフ: showCutin が pendingCutin=true を立てる。
    // クリックで dismissCutin → dismissCutin 側で pinCtrl 判定し次 step へ進む。
    showCutin(step.fighter, step.side, step.text, step.cssCls);
  } else if (step.kind === 'cutin') {
    // カットインは showCutin が pendingCutin=true を立てる。
    // クリックで dismissCutin → dismissCutin 側で pinCtrl 判定し _finishPinSeq を呼ぶ。
    showBanner('カットイン！', 'gold');
    try { sfx.cutinSlide(); } catch(e){}
    _showRingHelperFor(step.side === 'left' ? 'a' : 'b', 1500);
    showCutin(step.saver, step.side, step.line, 'tag-save');
    // nBtn は showCutin 内で disabled 化済み。dismissCutin からの遷移を待つ。
  }
}

// count / narration ステップ用の進行スケジューラ。
// isLead=true: 自動進行 (シングル battle-engine.html の setTimeout チェーン準拠)。
// isLead=false: クリック待機。autoAdvance 有効時は AUTO_DELAY 後に強制進行。
function _schedulePinAdvance(isLead, stepKey){
  const btn = document.getElementById('nBtn');
  clearTimeout(S.pinStepTimer);
  const decisiveAuto = (stepKey === 'three' || stepKey === 'tap' || stepKey === 'tko');
  // introBig は大きな文字で 2.2s 見せるので 1.8s 後に次ステップ。narration は 1.5s。count は 1.1s。
  const LEAD_DELAY = (stepKey === 'introBig') ? 1800 : (stepKey === 'narration') ? 1500 : 1100;
  const FINAL_AUTO_DELAY = 2500;  // シングル AUTO_DELAY 準拠

  if (isLead) {
    // リードステップ: ユーザーが急ぎたければクリックで前倒しできるようハンドラも張る
    if (btn) {
      btn.disabled = true;
      btn.onclick = () => { clearTimeout(S.pinStepTimer); _advancePinStep(); };
      setTimeout(() => {
        if (S.pinCtrl && btn.onclick) btn.disabled = false;
      }, 400);
    }
    S.pinStepTimer = setTimeout(() => _advancePinStep(), LEAD_DELAY);
  } else {
    // 最終ステップ: クリック待機 (autoAdvance=ON なら AUTO_DELAY 後に進む)
    if (btn) {
      btn.disabled = true;
      btn.onclick = _advancePinStep;
      setTimeout(() => {
        if (S.pinCtrl && btn.onclick === _advancePinStep) btn.disabled = false;
      }, decisiveAuto ? 250 : 700);
    }
    if (decisiveAuto || S.autoAdvance) {
      S.pinStepTimer = setTimeout(() => _advancePinStep(), decisiveAuto ? 900 : FINAL_AUTO_DELAY);
    }
  }
}

function _advancePinStep(){
  if (!S.pinCtrl) return;
  _executePinStep(S.pinCtrl.idx + 1);
}

function _notifyFinishCue(){
  if (S.finishCueSent || window.parent === window) return;
  S.finishCueSent = true;
  try { window.parent.postMessage({
    type: 'BATTLE_FINISH_CUE',
    preserveParentFileBgm: !!(S.matchInfo && S.matchInfo.preserveParentFileBgm),
  }, '*'); } catch(e) {}
}

function _finishPinSeq(){
  const fr = S.pinCtrl ? S.pinCtrl.fr : null;
  clearTimeout(S.pinStepTimer);
  S.pinCtrl = null;
  S.pinSeqPending = false;
  S.pendingCutin = false;
  _clearRollupHighlight();
  const btn = document.getElementById('nBtn');

  // 保留していた「★ 決着！」ログを現ターンの先頭に挿入 (turn marker 直後)
  if (S.heldWinLogs && fr && S.heldWinLogs.turn === fr.turn && S.heldWinLogs.held.length) {
    const heldHtml = S.heldWinLogs.held.map(l => _logLineHtml(l, fr)).join('');
    // turn marker の閉じ </div> 直後に挿入 (ターン内の他行より上 = 最新位置)
    const markerEnd = S.logHtml.indexOf('</div>');
    if (markerEnd >= 0) {
      const cut = markerEnd + '</div>'.length;
      S.logHtml = S.logHtml.slice(0, cut) + heldHtml + S.logHtml.slice(cut);
    } else {
      S.logHtml = heldHtml + S.logHtml;
    }
    const lb = document.getElementById('battleLog');
    if (lb) {
      lb.innerHTML = S.logHtml;
      lb.scrollTop = 0;
    }
  }
  S.heldWinLogs = null;

  // CURRENT MOVE ナレーションを「決着！」に差し替え
  if (fr && fr.winner) {
    const narEl = document.getElementById('moveNarration');
    if (narEl) {
      narEl.textContent = '決着！';
      narEl.className = 'move-narration wm-tag-commentary dramatic';
    }
  }

  if (fr && fr.winner) {
    // 誤クリックで endMatch が発火して結果画面を飛ばさないよう showResult 呼び出しまで button を無効のまま
    _notifyFinishCue();
    if (btn) btn.disabled = true;
    setTimeout(() => showResult(fr), 800);
    // _bindNextButton は showResult 側が状態復帰を担う
  } else {
    _bindNextButton();
    if (btn) btn.disabled = false;
    if (S.autoAdvance && S.frameIdx < S.frames.length) {
      clearTimeout(S.autoTimer);
      S.autoTimer = setTimeout(() => nextFrame(), 600);
    }
  }
}

// 決着寸前導入テキスト: 画面中央に大きな文字を pop させて短く残す (2.2s自動消滅)
function _spawnBigIntro(text){
  const el = document.createElement('div');
  const long = String(text).length >= 16;
  el.className = 'big-intro' + (long ? ' long' : '');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

// _schedulePinAdvance の延長: introBig は narration より少し長めに見せる
// D5: finishClick ボックス表示。シングル showFinishClickBtn 準拠。
// onResolve: クリック/キーで進行する callback。autoAdvance=ON なら 2500ms 後に自動発火。
function _showFinishClickBox(label, onResolve){
  const btn = document.getElementById('finishBtn');
  const ov = document.getElementById('finishOverlay');
  const nBtn = document.getElementById('nBtn');
  if (!btn || !ov) { // 万一 DOM 無ければ即進行
    if (typeof onResolve === 'function') onResolve();
    return;
  }
  if (nBtn) nBtn.disabled = true;
  btn.textContent = label;
  btn.disabled = false;
  ov.classList.add('show');
  setTimeout(() => btn.classList.add('show'), 100);
  let handled = false;
  let autoTimer = null;
  const cleanup = () => {
    btn.disabled = true;
    btn.classList.remove('show');
    ov.classList.remove('show');
    btn.removeEventListener('click', handler);
    document.removeEventListener('keydown', keyHandler);
    clearTimeout(autoTimer);
  };
  const handler = () => {
    if (handled) return;
    handled = true;
    cleanup();
    if (typeof onResolve === 'function') onResolve();
  };
  const keyHandler = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      handler();
    }
  };
  btn.addEventListener('click', handler);
  document.addEventListener('keydown', keyHandler);
  if (S.autoAdvance) autoTimer = setTimeout(handler, 2500); // シングル AUTO_DELAY 準拠
}

// 丸め込みハイライト: 主体側カード glow、対象側カード dim (T3)
function _applyRollupHighlight(subjSide, objSide){
  const subj = document.getElementById(`card-${subjSide}-legal`);
  const obj = document.getElementById(`card-${objSide}-legal`);
  if (subj) subj.classList.add('rollup-subject');
  if (obj) obj.classList.add('rollup-object');
}
function _clearRollupHighlight(){
  ['a','b'].forEach(s => {
    const el = document.getElementById(`card-${s}-legal`);
    if (el) el.classList.remove('rollup-subject','rollup-object');
  });
}

function _spawnPinCount(text, cls){
  const el = document.createElement('div');
  el.className = 'pin-count' + (cls ? ' ' + cls : '');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400); // 少し長めに残す (クリック待ち間も視認可能に)
  try {
    if (cls === 'three') { sfx.count(); sfx.finImpact(); }
    else if (cls === 'tap' || cls === 'tko') { sfx.bellx3(); sfx.finImpact(); }
    else if (cls === 'kickout') sfx.kickoutSE();
    else if (cls === 'escape') sfx.guEscapeSE();
    else if (cls === 'rollupIntro') sfx.cutinSlide();
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
  let line = pickDamageLine(def, action.dmg, hpRatio);
  if (!line) return;
  const last = S.lastCritTurn[defKey] || 0;
  if (fr.turn - last < 3) return;
  S.lastCritTurn[defKey] = fr.turn;
  // firing-grudge-spec-v0.1 Phase 5: vsExHit 50% bias（HP 33% 超のみ）
  if (def.vsExHit && Array.isArray(def.vsExHit) && def.vsExHit.length > 0 && hpRatio > 0.33 && Math.random() < 0.5) {
    const text = def.vsExHit[Math.floor(Math.random() * def.vsExHit.length)];
    line = { type: 'serif', text };
  }
  const side = (defKey === 'a1' || defKey === 'a2') ? 'left' : 'right';
  const cssCls = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
  showCutin(def, side, line.text, cssCls);
}

// ── カットイン ──
// DOM レンダリング + SE 再生は battle-anim.js の BattleAnim.renderCutin に集約。
// ここでは tag 固有の state/button 管理 (pendingCutin / nBtn disabled) だけを追加で行う。
function showCutin(fighter, side, text, cssCls){
  const variant = (cssCls === 'damage-serif' || cssCls === 'damage-voice') ? cssCls : 'default';
  BattleAnim.renderCutin({
    overlay: document.getElementById('cutinOv'),
    fighter, side, text, variant,
  });
  S.pendingCutin = true;
  const btn = document.getElementById('nBtn');
  if (btn) btn.disabled = true;
}
function dismissCutin(){
  const ov = document.getElementById('cutinOv');
  if (!ov) return;
  BattleAnim.dismissCutin(ov);
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
    b.innerHTML = '自動再生<span>' + (S.autoAdvance ? '再生中' : '停止') + '</span>';
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
    d.classList.toggle('on', i === S.speedIdx);
    d.classList.toggle('off', i !== S.speedIdx);
  });
}

// ── 結果表示 (Victory Overlay) ──
function showResult(fr){
  const result = S.result;
  const winTeam = result.winner; // 'teamA' | 'teamB' | 'draw'
  const finType = result.finType || '';
  const finMove = result.finMove || '';
  const finishPhase = result.finishPhase || '';

  _notifyFinishCue();

  const winners = winTeam === 'teamA' ? [f('a1'), f('a2')] :
                  winTeam === 'teamB' ? [f('b1'), f('b2')] : [];
  const losers = winTeam === 'teamA' ? [f('b1'), f('b2')] :
                 winTeam === 'teamB' ? [f('a1'), f('a2')] : [];

  // Reset classes
  const ov = document.getElementById('victoryOv');
  const box = document.getElementById('victoryBox');
  ov.classList.remove('visible');
  box.classList.remove('visible');
  ['vicLabel','vicNames','vicType','vicLines','vicBottom','vicClose'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('visible');
  });
  document.querySelectorAll('.vic-portrait').forEach(p => p.classList.remove('visible'));
  ov.classList.add('show');
  if (winTeam !== 'draw') {
    setTimeout(() => { try { sfx.victoryFanfare(); } catch(e) {} }, 800);
  }

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
    names.textContent = 'NO CONTEST';
    names.style.background = 'linear-gradient(180deg, #ccc, #888)';
    names.style.webkitBackgroundClip = 'text';
  }

  // Finish type
  const vicType = document.getElementById('vicType');
  const segments = (result.segments || []).length;
  vicType.textContent = `${finType}${finMove ? ' — ' + finMove : ''}${finishPhase ? ' / ' + finishPhase : ''} / ${result.turns} Turns`;

  // 決着画面は勝者中心。決め手となった選手のコメントと実況だけを表示する。
  // pinnedBy = 決め技を打った勝者
  const winFinisher = (winners.length === 2 && result.pinnedBy)
    ? winners.find(w => w.id === result.pinnedBy) || winners[0]
    : (winners[0] || null);
  const winPartner = (winners.length === 2)
    ? (winFinisher === winners[0] ? winners[1] : winners[0])
    : null;
  const vicLines = document.getElementById('vicLines');
  if (vicLines) {
    if (winFinisher && winPartner) {
      const winLine = pickTagWinLine(winFinisher);
      const commentary = pickTagWinCommentary(winFinisher.name, winPartner.name, finMove);
      vicLines.innerHTML =
        `<div class="vic-win-line"><span class="vic-speaker">${escHtml(winFinisher.name)}</span>「${escHtml(winLine)}」</div>` +
        `<div class="vic-commentary">${escHtml(commentary)}</div>`;
    } else {
      vicLines.innerHTML = '';
    }
  }

  // 敗者は小さな結果情報だけを残し、敗者セリフは表示しない。
  const loserEl = document.getElementById('vicLoser');
  if (losers.length === 2) {
    loserEl.innerHTML =
      `<div class="vic-loser-faces">` +
        `<img class="vic-loser-face" src="${getFaceUrl(losers[0])}" onerror="this.style.display='none'">` +
        `<img class="vic-loser-face" src="${getFaceUrl(losers[1])}" onerror="this.style.display='none'">` +
      `</div>` +
      `<div>` +
        `<div class="vic-loser-names">${escHtml(losers[0].name)} & ${escHtml(losers[1].name)}</div>` +
        `<div class="vic-loser-tag">LOSER</div>` +
      `</div>`;
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
  // T2: 締めセリフをタイプ表示の直後に入れる
  setTimeout(() => { const vl = document.getElementById('vicLines'); if (vl) vl.classList.add('visible'); }, 2200);
  setTimeout(() => document.getElementById('vicBottom').classList.add('visible'), 2700);
  setTimeout(() => document.getElementById('vicClose').classList.add('visible'), 1200);
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
  // シングル battle-engine.html 準拠: Space / Enter でピンカウント/通常フレーム進行
  if (e.key === ' ' || e.key === 'Enter') {
    const bp = document.getElementById('bpOv');
    if (bp && bp.classList.contains('show')) return;
    const cu = document.getElementById('cutinOv');
    if (cu && cu.classList.contains('show')) { e.preventDefault(); dismissCutin(); return; }
    const btn = document.getElementById('nBtn');
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  }
});
