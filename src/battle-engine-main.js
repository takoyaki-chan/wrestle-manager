// battle-engine-main.js — シングルマッチ Replay flow (Phase 4c Step 2)
// 雛形: src/tag-battle-main.js。タッグ固有要素を除去し、シングル固有演出を追加。
// 依存: battle-sfx.js / battle-anim.js / battle-lines.js / battle-sfx-bgm.js (タグと共通)
// ロード元: battle-engine.html <script src="battle-engine-main.js"> (Step 3 で切り替え)

// ─── State ───
let matchData = null;
const S = {
  result: null,
  frames: [],
  frameIdx: 0,
  L: null,          // 左選手 { ...char, hp, mhp, gritTurns, kickoutCount }
  R: null,          // 右選手
  mom: 0,
  logHtml: '',      // 累積ログHTML (新しい順 = 先頭)
  lastCritTurn: {}, // { side: turnNo } — クリティカルセリフ連打防止
  anim: false,
  autoAdvance: false,
  autoTimer: null,
  speedIdx: 0,      // 0=slow 1=mid 2=fast
  pendingCutin: false,
  pinCtrl: null,    // { seq, idx, fr } — クリック駆動ピンカウント
  pinSeqPending: false,
  pinStepTimer: null,
  heldWinLogs: null,  // { turn, held: [lines] } — pin seq 中に保留する「★ 決着！」行
  pendingDamage: false,
  finishCueSent: false,
  matchInfo: null,
  // シングル固有
  cutinShown: null,   // { opening, mid, end, climax, finish } — 重複カットイン防止
  bigmoveCount: 0,    // フレーム内ビッグムーブ演出済みカウント (auto-replay向け参考値)
  halfTrig: { l: false, r: false },
  qtrTrig:  { l: false, r: false },
  _isBigMatch: false,
  cameraMode: 'auto',
  autoCameraPlan: [],
  showNumbers: true,
  startHpL: 0,
  startHpR: 0,
};

// SPEED_DELAYS / BIGMOVE_CHARGE_MS / BIGMOVE_ANIM_RATE は battle-replay-core.js で定義

// ─── CUTIN_LINES ───────────────────────────────────────────────────────────
// i18n Stage B P7-21: セリフ表の本体は src/battle-lines.js へ移設した(観戦系セリフの置き場は
// battle-lines.js という specs/i18n-runtime-spec-v1.0.md §10-2 の規約に合わせ、セリフ台帳
// ジェネレータ test/i18n-extract-dialogue.js の対象ファイルへ載せるため)。battle-engine.html /
// tag-battle.html とも battle-lines.js を本ファイルより先に読むので、ここでは参照するだけ。

// ─── ピンカウント導入ナレーション ────────────────────────────────────────
// i18n P7-9: 旧 FINISH_SUSPENSE(finishClickボックス表示中の実況プール5種17行)は
// 「結末ネタバレ防止: 全 attemptType で結末を示唆しない汎用文に統一」(_buildPinCtrl の
// finishClick label='…！？')の際に消費点が無くなっており、参照0の死蔵プールだった
// (src/ 全体で FINISH_SUSPENSE の参照は本宣言のみ)。訳出対象を実際に画面へ出るものだけに
// 保つため本バッチで削除した。**画面に出る導入ナレーションは下の PIN_INTRO_TEXTS**。
//
// PIN_INTRO_TEXTS / SUB_ATTEMPT_INTRO_TEXTS は _buildPinCtrl の関数本体に直書きされて
// いたプール(specs §10-2「関数の中の配列はどの抽出器からも永久に見えない」)を
// トップレベルへ出したもの。表の値は**日本語原文のまま**で、英訳は表示直前の
// WM_I18N.t() が辞書から引く(選択ロジック=JAのまま・ja出力1バイト不変)。
// tag-battle-main.js にも同名同値の表がある(両iframeは互いを読み込まない独立構成)。
const PIN_INTRO_TEXTS = {
  fall: ['フォールに入った！ ここで決まるのか！？','押さえ込んだーっ！ スリーカウントなるか！？','カバー！ これで決着か！？'],
  pin:  ['押さえ込んだーっ！ これで決まるのか！？','強引にフォールへ！ 返せるのか！？','カバーに入った！ 決着か！？'],
  tko:  ['もう立ち上がれない…！ レフェリーが試合を見ている！','意識が飛んでいる…！ TKOか！？','これ以上は危険だ！ ストップがかかるか！？'],
};
// 試合中の極め技トライ(HP>0で脱出される)の導入。
const SUB_ATTEMPT_INTRO_TEXTS = [
  '関節技を決めた！ このまま極めるか！？',
  '絞り上げる！ ギブアップするか！？',
  '逃げられるか！？ 極め技に捕らえた！',
];

// ─── ユーティリティ ──────────────────────────────────────────────────────
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function pk(arr){ return Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr; }
function tpl(str, v){
  return String(str || '').replace(/\{(\w+)\}/g, (_, k) => v && v[k] != null ? v[k] : '');
}
// hpCls は battle-replay-core.js で定義
function _calcOvr(ch){
  return Math.round(((ch.pw||0) + (ch.sp||0) + (ch.te||0) + (ch.st||0) + (ch.mn||0)) / 5);
}
function _hpPct(ch){
  if (!ch || !ch.mhp) return { pct: 0, ratio: 0 };
  const ratio = Math.max(0, ch.hp) / ch.mhp;
  const pct   = ch.hp > 0 ? Math.max(1, Math.round(ratio * 100)) : 0;
  return { pct, ratio };
}
// portrait helper: getStandUrl / getUpperUrl / getFullUrl / getFaceUrl は
// battle-engine.html 側のグローバルに依存(Step 3 でシェル化後も維持)
function _getStandUrl(ch){ return typeof getStandUrl === 'function' ? getStandUrl(ch) : ''; }
function _getUpperUrl(ch){ return typeof getUpperUrl === 'function' ? getUpperUrl(ch) : ''; }
function _getFullUrl(ch) { return typeof getFullUrl  === 'function' ? getFullUrl(ch)  : ''; }
function _getFaceUrl(ch) { return typeof getFaceUrl  === 'function' ? getFaceUrl(ch)  : ''; }

// ─── Presentation helpers ─────────────────────────────────────────────────
// 数値やフレーム内容を変えず、action を初心者向けの表示文へ翻訳する。
const MOVE_PRESENTATION = {
  strike:     { label: WM_I18N.t('打撃技'), guide: 'パンチやキックなどで相手の姿勢を崩し、次の攻めにつなげる。' },
  throw:      { label: WM_I18N.t('投げ技'), guide: '相手の重心を奪い、持ち上げるか回転させてマットへ叩きつける。' },
  submission: { label: WM_I18N.t('関節・絞め技'), guide: '関節や首を捕らえて動きを奪い、ギブアップや消耗を狙う。' },
  aerial:     { label: WM_I18N.t('飛び技'), guide: '跳躍や落下の勢いに体重を乗せ、一気に大きな衝撃を与える。' },
  ground:     { label: WM_I18N.t('グラウンド攻撃'), guide: '倒れた相手へ追撃し、起き上がる余裕と体力を奪う。' },
  rollup:     { label: WM_I18N.t('丸め込み'), guide: '一瞬の体勢変化を使って肩を押さえ、3カウントを狙う。' },
};

// i18n P7-9: 技名の正規表現で guide を上書きする分岐。_movePresentation の関数本体に
// if/else連鎖で直書きされていたものを、順序を変えずにトップレベル表へ出した
// (specs §10-2「関数の中の配列はどの抽出器からも永久に見えない」)。
// `cat` 付きの行は「カテゴリも一致したときだけ採用」= 元の `&& cat === 'throw'` と同義で、
// 不一致なら次の行の判定へ進む(if/else連鎖のフォールスルーと完全に同じ)。
const MOVE_GUIDE_OVERRIDES = [
  { re: /ドロップキック/, guide: '両足を突き出して相手を蹴り、勢いと間合いで体勢を崩す打撃。' },
  { re: /キック|PK|延髄斬り|ニー/, guide: '脚の振りや踏み込みを使い、相手の上半身や足元を狙う打撃。' },
  { re: /エルボー|ラリアット|クローズライン|チョップ|パンチ|ブロー|頭突き|ヘッドバット/, guide: '腕や頭部を直接ぶつけ、相手の動きと姿勢を止める打撃。' },
  { re: /スープレックス|バックドロップ/, guide: '相手を抱えて反らすように投げ、背中からマットへ落とす投げ技。' },
  { re: /パワーボム|ドライバー|スラム|DDT|ブリーカー|ドロップ/, cat: 'throw', guide: '相手を抱え上げるか頭部を制し、落差を使ってマットへ叩きつける投げ技。' },
  { re: /ロック|ホールド|クラッチ|固め|絞め|STF|卍|アームバー|ベアハッグ/, cat: 'submission', guide: '身体の一部を固定して逃げ道を狭め、ギブアップを迫る技。' },
  { re: /ダイビング|プレス|スプラッシュ|ムーンサルト|セントーン|トペ|プランチャ/, guide: '高い位置や助走から飛び込み、落下の勢いを全身でぶつける飛び技。' },
];

// **日本語名を返す**関数。効果音判定(battle-sfx.js guessCategory)と _movePresentation の
// 解説文選択がこの戻り値を正規表現で見ているので、ここで英訳してはいけない
// (docs/en-move-names-draft-v0.1.md §7-2)。英語化は表示の直前だけ — 下の _mvDisp() を使う。
function _actionMoveName(action){
  if (!action) return '---';
  return action.kind === 'counter'
    ? (action.counterMove || action.move || '---')
    : (action.move || '---');
}

// i18n Stage B P7-5: 技名の**表示専用**変換。観戦画面の技名枠(.move-value 内寸約212px=
// EN約27字)・攻撃矢印のラベル・ビッグムーブ演出はいずれも最狭クラスなので、短縮形が
// 用意されている19件はそちらを使う(mvShortは未登録ならフルEN名→原文へfail-open)。
function _mvDisp(name){
  return (typeof WM_I18N !== 'undefined' && WM_I18N.mvShort) ? WM_I18N.mvShort(name) : name;
}

// 折り返しの効く地の文(実況ナレーション・決着ラベル)向けはフルEN名。
function _mvFull(name){
  return (typeof WM_I18N !== 'undefined' && WM_I18N.mv) ? WM_I18N.mv(name) : name;
}

function _movePresentation(action){
  const cat = action && action.moveCat ? action.moveCat : 'strike';
  const base = MOVE_PRESENTATION[cat] || MOVE_PRESENTATION.strike;
  const name = _actionMoveName(action);
  const ov = MOVE_GUIDE_OVERRIDES.find(o => o.re.test(name) && (!o.cat || o.cat === cat));
  // **返り値のguideは日本語のまま**(この関数は判定層 — 効果音判定と同じくJA技名の
  // 正規表現で選ぶ)。英訳は表示直前の WM_I18N.t(meta.guide) が行う(§23-3/P7-9)。
  return { label: base.label, guide: ov ? ov.guide : base.guide };
}

function _moveResultText(action){
  if (!action) return WM_I18N.t('試合開始');
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
    const latePhase = frame && (frame.phase === 'End' || frame.phase === 'Climax');
    const action = frame && frame.action;
    const decisiveAction = !!(action && (action.isCrit || action.kind === 'counter' || (action.moveD|0) >= 14));
    const resultMoment = !!(frame && (frame.pinAttempt || frame.rollup || frame.tkoStop || frame.winner ||
      (frame.kickout && (frame.kickout.escapeType || frame.kickout.count != null))));
    if (resultMoment || (latePhase && decisiveAction)) holdUntil = Math.max(holdUntil, index + 1);
    return index <= holdUntil;
  });
}

function _applyCamera(){
  const ring = document.getElementById('liveRing');
  if (!ring) return;
  const idx = Math.max(0, S.frameIdx - 1);
  const close = S.cameraMode === 'close' || (S.cameraMode === 'auto' && !!S.autoCameraPlan[idx]);
  ring.classList.toggle('camera-close', close);
  const chip = document.getElementById('cameraChip');
  if (chip) chip.textContent = S.cameraMode === 'auto'
    ? `CAMERA · AUTO ${close ? 'HIGHLIGHT' : 'WIDE'}`
    : `CAMERA · ${close ? 'CLOSE-UP' : 'WIDE'}`;
}

function setCameraMode(mode){
  if (!['auto','wide','close'].includes(mode)) return;
  S.cameraMode = mode;
  document.querySelectorAll('[data-camera]').forEach(btn => btn.classList.toggle('active', btn.dataset.camera === mode));
  _applyCamera();
}

function toggleBattleNumbers(){
  const input = document.getElementById('numberToggle');
  S.showNumbers = input ? !!input.checked : !S.showNumbers;
  _updateMoveDetail(_getCurrentFrame());
}

// ─── 初期待受 ─────────────────────────────────────────────────────────────
function renderWaiting(){
  const c = document.getElementById('mainContainer');
  if (c) c.innerHTML = `<div class="waiting">
    <div class="waiting-title">STANDBY</div>
    <div class="waiting-sub">${WM_I18N.t('試合データの受信を待機中…')}</div>
    <div class="waiting-pulse"></div>
  </div>`;
}
renderWaiting();

// ─── postMessage 受信 ─────────────────────────────────────────────────────
window.addEventListener('message', function(e){
  if (!e.data) return;
  if (e.data.type === 'START_MATCH') {
    matchData = e.data;
    const mi = matchData.matchInfo || {};
    _ensureMasterGains();
    if (mi.sfxMasterVol !== undefined) _sfxMasterGain.gain.value = mi.sfxMasterVol;
    if (mi.bgmMasterVol !== undefined) _bgmMasterGain.gain.value = mi.bgmMasterVol;
    startReplay(e.data);
  }
});

// ─── startReplay ──────────────────────────────────────────────────────────
function startReplay(data){
  const mi = data.matchInfo || {};
  S.result   = data.result;
  S.frames   = (data.result && data.result.frames) || [];
  S.frameIdx = 0;
  S.matchInfo = mi;
  S.logHtml  = '';
  S.mom      = 0;
  S.lastCritTurn = {};
  S.anim     = false;
  S.autoAdvance = false;
  S.pinCtrl  = null;
  S.pinSeqPending = false;
  S.pinStepTimer = null;
  S.heldWinLogs = null;
  S.pendingCutin = false;
  S.finishCueSent = false;
  S.bigmoveCount = 0;
  S.halfTrig  = { l: false, r: false };
  S.qtrTrig   = { l: false, r: false };
  S.cutinShown = { opening: false, mid: false, end: false, climax: false, finish: false };
  S._isBigMatch = !!(mi.matchTier && mi.matchTier >= 2);
  S.cameraMode = 'auto';
  S.showNumbers = true;
  S.autoCameraPlan = _buildAutoCameraPlan(S.frames);
  clearTimeout(S.autoTimer);

  // mhp は match-engine.js が計算した実値を result.hpLeft/hpRight.max から受け取る。
  // (iframe 側で再計算すると Tier/eff()/スケール値の二重管理でズレる — 111% 事故の原因)
  const resMhpL = (data.result && data.result.hpLeft && data.result.hpLeft.max) || 0;
  const resMhpR = (data.result && data.result.hpRight && data.result.hpRight.max) || 0;
  const fallbackMhp = (c) => {
    const st = clamp(c.st || 60, 0, 100);
    const hpBase  = S._isBigMatch ? 85 : 50;
    const hpScale = S._isBigMatch ? 1.10 : 0.90;
    return Math.round(hpBase + st * hpScale);
  };
  const mk = (c, realMhp) => {
    const mhp = realMhp > 0 ? realMhp : fallbackMhp(c);
    const startHp = c && c._hpOverride != null ? clamp(c._hpOverride, 1, mhp) : mhp;
    return { ...c, hp: startHp, mhp, gritTurns: 0, kickoutCount: 0 };
  };
  S.L = mk(data.left,  resMhpL);
  S.R = mk(data.right, resMhpR);
  S.startHpL = S.L.hp;
  S.startHpR = S.R.hp;

  renderMatchFrame();
  try { sfx.gongStart(); } catch(e){}
}

// ─── メイン画面 初期描画 ─────────────────────────────────────────────────
function renderMatchFrame(){
  const container = document.getElementById('mainContainer');
  if (!container) return;
  const fr = _getCurrentFrame();

  container.innerHTML = `
    ${_hudHtml(fr)}
    <div class="wm-presentation" id="mainRow">
      ${_liveRingHtml(fr)}
      <div class="wm-lower-dock">
        ${_statCardHtml(S.L, 'L')}
        <section class="wm-exchange-panel" id="colCenter">
          <div class="wm-exchange-head"><span>${WM_I18N.t('直近の攻防')}</span><span>${WM_I18N.t('最新が上')}</span></div>
          <div class="wm-exchange-grid">
            <div class="battle-log" id="battleLog">${S.logHtml || `<div class="log-empty">${WM_I18N.t('ゴングを待っています')}</div>`}</div>
            ${_centerHtml(fr)}
          </div>
        </section>
        ${_statCardHtml(S.R, 'R')}
      </div>
    </div>
    ${_controlsHtml()}
    <div class="finish-overlay" id="finishOverlay">
      <button class="finish-btn" id="finishBtn"></button>
    </div>
    <div class="cutin-overlay" id="cutinOv" onclick="dismissCutin()"></div>
    <div class="bp-overlay" id="bpOv"></div>
    <div class="flash-ov" id="flashOv"></div>
  `;
  _bindNextButton();
  _scrollLogToTop();
  if (fr) _updateCenter(fr);
  else _applyCamera();
}

// ─── HUD ──────────────────────────────────────────────────────────────────
function _hudHtml(fr){
  const turn  = fr ? fr.turn  : 0;
  const phase = fr ? fr.phase : 'Opening';
  const hpL   = _hpPct(S.L);
  const hpR   = _hpPct(S.R);
  const momNorm = S.mom / 50;
  const momLv   = clamp(50 + momNorm * 30, 0, 100);
  const bigBadge = S._isBigMatch ? '<span class="hud-bigmatch-badge">BIG MATCH</span>' : '';

  return `<div class="wm-hud">
    <div class="wm-hud-top">
      <div class="wm-hud-side">
        <div class="wm-hud-face"><img src="${_getFaceUrl(S.L)}" onerror="this.style.display='none'"></div>
        <div class="wm-hud-meta">
          <div class="wm-hud-name" onclick="openBp('L')">${escHtml(S.L ? WM_I18N.pn(S.L.name) : '')}</div>
        </div>
      </div>
      <div class="wm-hud-center">
        <div class="wm-hud-turn" id="hudTurn">TURN ${turn || 1}</div>
        <div class="wm-hud-phase${S._isBigMatch?' bigmatch':''}" id="hudPhase">${escHtml(String(phase).toUpperCase())}${bigBadge}</div>
      </div>
      <div class="wm-hud-side" style="flex-direction:row-reverse">
        <div class="wm-hud-face"><img src="${_getFaceUrl(S.R)}" onerror="this.style.display='none'"></div>
        <div class="wm-hud-meta right">
          <div class="wm-hud-name" onclick="openBp('R')">${escHtml(S.R ? WM_I18N.pn(S.R.name) : '')}</div>
        </div>
      </div>
    </div>
    <div class="wm-mom">
      <div class="wm-mom-l" id="momL" style="width:${momLv}%"></div>
      <div class="wm-mom-r" id="momR" style="width:${100-momLv}%"></div>
    </div>
    <div class="wm-hp-row">
      <span class="wm-hp-name" id="hudHpNameL">${escHtml(S.L ? WM_I18N.pn(S.L.name) : '')}</span>
      <span class="wm-hp-pct ${hpCls(hpL.ratio)}" id="hudHpPctL">${hpL.pct}%</span>
      <div class="wm-hp-bar"><div class="wm-hp-fill ${hpCls(hpL.ratio)} rev" id="hudHpFillL" style="width:${hpL.pct}%"></div></div>
      <span class="wm-hp-label">HP</span>
      <div class="wm-hp-bar"><div class="wm-hp-fill ${hpCls(hpR.ratio)}" id="hudHpFillR" style="width:${hpR.pct}%"></div></div>
      <span class="wm-hp-pct ${hpCls(hpR.ratio)}" id="hudHpPctR">${hpR.pct}%</span>
      <span class="wm-hp-name right" id="hudHpNameR">${escHtml(S.R ? WM_I18N.pn(S.R.name) : '')}</span>
    </div>
  </div>`;
}

function _matchBadgeHtml(){
  const mi = S.matchInfo || {};
  const rec = mi.h2hRecord || null;
  if (!S._isBigMatch && !(rec && rec.matches > 0) && !(mi.rivalryTier > 0)) return '';
  const recordText = rec && rec.matches > 0
    ? `${rec.matches} MATCHES  ${S.L ? escHtml(WM_I18N.pn(S.L.name)) : 'LEFT'} ${rec.leftWins || 0}-${rec.rightWins || 0} ${S.R ? escHtml(WM_I18N.pn(S.R.name)) : 'RIGHT'}${rec.bestMQ ? `  ${WM_I18N.t('最高評価')} ${rec.bestMQ}` : ''}`
    : 'FIRST MEETING';
  const title = S._isBigMatch ? 'BIG MATCH' : 'RIVALRY MATCH';
  return `<div class="wm-match-badge">
    <span class="wm-match-badge-title">${title}</span>
    <span class="wm-match-badge-record">${recordText}</span>
  </div>`;
}

// ─── ライブリング ──────────────────────────────────────────────────────────
function _liveRingHtml(fr){
  const phase = fr ? (fr.phase || 'Opening') : 'Opening';
  const turn = fr ? fr.turn : 1;
  return `<section class="wm-live-ring" id="liveRing">
    <img class="wm-ring-bg" src="../image/battle-ring-bg-mockup-v2.webp" alt="${WM_I18N.t('プロレス会場のリング')}"
      onerror="this.src='../image/battle-bg_venue_4.webp'">
    <div class="wm-ring-grade"></div>
    <div class="wm-ring-light left"></div><div class="wm-ring-light right"></div>
    <div class="wm-live-label"><i></i>LIVE RING</div>
    ${_matchBadgeHtml()}
    <div class="wm-phase-chip"><span id="pill" class="phase-pill${S._isBigMatch?' bigmatch':''}">${escHtml(phase)}</span><span id="turnLbl">T${turn}</span></div>
    <div class="wm-camera-chip" id="cameraChip">CAMERA · AUTO WIDE</div>
    ${_panelHtml(S.L, 'L')}${_panelHtml(S.R, 'R')}
    <div class="attack-arrow-layer wm-ring-arrow-layer" id="arrowLayer"></div>
    <div class="wm-ring-impact" id="ringImpact"></div>
    <div class="bigmove-name" id="bigmoveName"></div>
    <div class="narration-box wm-commentary" id="narBox">
      <div class="wm-commentary-label">${WM_I18N.t('実況')}</div>
      <div class="nar-empty">${WM_I18N.t('ゴング！　「次の攻防」で試合を進めてください')}</div>
    </div>
  </section>`;
}

// ─── リング上の選手 ────────────────────────────────────────────────────────
function _panelHtml(ch, side){
  if (!ch) return '';
  const isL = side === 'L';
  return `<div class="fighter-panel wm-ring-fighter ${isL?'left':'right'}" id="panel-${side}">
    <div class="battle-speech-slot"><div class="speech-bubble" id="sp-${side}"></div></div>
    <div class="portrait-area" id="port-${side}">
      <img class="wm-full-figure" src="${_getFullUrl(ch)}" alt="${escHtml(WM_I18N.pn(ch.name))}" id="img-${side}"
        onerror="this.style.display='none'">
      <div class="monitor-frame"></div>
      <div class="dmg-number" id="dmg-${side}"></div>
      <div class="danger-glow" id="dangerGlow-${side}"><div class="danger-glow-inner"></div></div>
    </div>
    <button class="wm-ring-nameplate" onclick="openBp('${side}')">${escHtml(WM_I18N.pn(ch.name))}</button>
  </div>`;
}

function _statCardHtml(ch, side){
  if (!ch) return '';
  const isL = side === 'L';
  const rc = (ch.role || 'Neutral').toLowerCase();
  const stats = [
    {k:'power',l:'PWR',v:Math.round(ch.pw||0)},
    {k:'speed',l:'SPD',v:Math.round(ch.sp||0)},
    {k:'technique',l:'TEC',v:Math.round(ch.te||0)},
    {k:'stamina',l:'STA',v:Math.round(ch.st||0)},
    {k:'mental',l:'MNT',v:Math.round(ch.mn||0)},
  ];
  const rows = stats.map(stat => `<div class="ab-row">
    <span class="ab-name">${stat.l}</span>
    <div class="ab-track"><div class="ab-fill ${stat.k}" style="width:${stat.v}%"></div></div>
    <span class="ab-val">${stat.v}</span>
  </div>`).join('');
  return `<article class="wm-stat-card ${isL?'left':'right'}">
    ${isL ? `<img class="wm-stat-upper" src="${_getUpperUrl(ch)}" alt="" onerror="this.style.display='none'">` : ''}
    <div class="wm-stat-core">
      <div class="wm-stat-head"><button onclick="openBp('${side}')">${escHtml(WM_I18N.pn(ch.name))}</button><strong>OVR ${_calcOvr(ch)}</strong></div>
      <div class="wm-stat-meta"><span class="f-role-tag ${rc}">${escHtml(ch.role || 'Neutral')}</span> · ${escHtml(ch.style || '')}</div>
      <div class="ability-bars">${rows}</div>
      <div class="grit-indicator${ch.gritTurns>0?' active':''}" id="grit-${side}">⚡ ${WM_I18N.t('闘志 ({n})', {n: ch.gritTurns})}</div>
    </div>
    ${!isL ? `<img class="wm-stat-upper" src="${_getUpperUrl(ch)}" alt="" onerror="this.style.display='none'">` : ''}
  </article>`;
}

// ─── 現在の技 ──────────────────────────────────────────────────────────────
function _centerHtml(fr){
  const action = fr && fr.action;
  const meta = _movePresentation(action);
  return `<div class="center-panel wm-move-detail" id="centerPanel">
    <div class="move-label" id="moveCatLabel">${escHtml(meta.label)}</div>
    <div class="move-value" id="moveV">${escHtml(_mvDisp(_actionMoveName(action)))}</div>
    <div class="wm-move-guide" id="moveGuide">${escHtml(WM_I18N.t(meta.guide))}</div>
    <div class="wm-move-result" id="moveResult">${escHtml(_moveResultText(action))}</div>
  </div>`;
}

// ─── コントロール ──────────────────────────────────────────────────────────
function _controlsHtml(){
  const fr = _getCurrentFrame();
  const isEnd = (fr && fr.winner) || S.frameIdx >= S.frames.length;
  const label = (fr && fr.winner) ? WM_I18N.t('結果を見る') : (isEnd ? WM_I18N.t('試合終了') : WM_I18N.t('次の攻防 ▶'));
  const disabled = S.anim || S.pendingCutin;
  const dots = [0,1,2].map(i =>
    `<button class="speed-dot wm-speed-btn ${i === S.speedIdx?'on':'off'}" onclick="setSpeed(${i})">${i+1}×</button>`
  ).join('');
  return `<div class="controls-sub">
    <div class="wm-control-left">
      <button class="btn wm-prev-btn" id="prevBtn" onclick="previousFrame()"${disabled||S.frameIdx===0?' disabled':''}>◀ ${WM_I18N.t('ひとつ戻る')}</button>
      <button class="btn btn-auto${S.autoAdvance?' active':''}" id="autoBtn" onclick="toggleAuto()">${WM_I18N.t('自動再生')}<span>${S.autoAdvance?WM_I18N.t('再生中'):WM_I18N.t('停止')}</span></button>
      <div class="wm-control-set"><span>${WM_I18N.t('速度')}</span><div class="speed-dots">${dots}</div></div>
    </div>
    <div class="wm-control-center"><button class="btn-main" id="nBtn"${disabled?' disabled':''}>${label}</button></div>
    <div class="wm-control-right">
      <div class="wm-control-set"><span>${WM_I18N.t('カメラ')}</span><div class="wm-camera-buttons">
        <button data-camera="auto" class="${S.cameraMode==='auto'?'active':''}" onclick="setCameraMode('auto')">${WM_I18N.t('自動')}</button>
        <button data-camera="wide" class="${S.cameraMode==='wide'?'active':''}" onclick="setCameraMode('wide')">${WM_I18N.t('全景')}</button>
        <button data-camera="close" class="${S.cameraMode==='close'?'active':''}" onclick="setCameraMode('close')">${WM_I18N.t('アップ')}</button>
      </div></div>
      <label class="wm-number-toggle"><input id="numberToggle" type="checkbox" onchange="toggleBattleNumbers()"${S.showNumbers?' checked':''}> ${WM_I18N.t('正確な数値')}</label>
    </div>
  </div>`;
}

function _bindNextButton(){
  const btn = document.getElementById('nBtn');
  if (!btn) return;
  const fr = _getCurrentFrame();
  if ((fr && fr.winner) || S.frameIdx >= S.frames.length) btn.onclick = endMatch;
  else btn.onclick = nextFrame;
}

function _getCurrentFrame(){
  return S.frameIdx > 0 ? S.frames[S.frameIdx - 1] : null;
}

function _scrollLogToTop(){
  const lb = document.getElementById('battleLog');
  if (lb) lb.scrollTop = 0;
}

// ─── 差分更新 ─────────────────────────────────────────────────────────────
function _updateHud(){
  const fr   = _getCurrentFrame();
  const hpL  = _hpPct(S.L);
  const hpR  = _hpPct(S.R);
  const momNorm = S.mom / 50;
  const momLv   = clamp(50 + momNorm * 30, 0, 100);

  const elTurn  = document.getElementById('hudTurn');
  const elPhase = document.getElementById('hudPhase');
  if (fr && elTurn)  elTurn.textContent  = `TURN ${fr.turn}`;
  if (fr && elPhase) elPhase.textContent = String(fr.phase || '').toUpperCase();

  const fillL = document.getElementById('hudHpFillL');
  const pctL  = document.getElementById('hudHpPctL');
  if (fillL){ fillL.style.width = hpL.pct + '%'; fillL.className = 'wm-hp-fill rev ' + hpCls(hpL.ratio); }
  if (pctL) { pctL.textContent = hpL.pct + '%'; pctL.className = 'wm-hp-pct ' + hpCls(hpL.ratio); }

  const fillR = document.getElementById('hudHpFillR');
  const pctR  = document.getElementById('hudHpPctR');
  if (fillR){ fillR.style.width = hpR.pct + '%'; fillR.className = 'wm-hp-fill ' + hpCls(hpR.ratio); }
  if (pctR) { pctR.textContent = hpR.pct + '%'; pctR.className = 'wm-hp-pct ' + hpCls(hpR.ratio); }

  const momElL = document.getElementById('momL');
  const momElR = document.getElementById('momR');
  if (momElL && momElR){ momElL.style.width = momLv + '%'; momElR.style.width = (100 - momLv) + '%'; }
}

function _updatePanel(side){
  const ch = side === 'L' ? S.L : S.R;
  if (!ch) return;
  const hp  = _hpPct(ch);
  const panel = document.getElementById(`panel-${side}`);
  if (!panel) return;

  // HP 数値更新 (存在すれば)
  const dmgEl = document.getElementById(`dmg-${side}`);
  // grit クラス
  panel.classList.toggle('grit-active', ch.gritTurns > 0);
  panel.classList.toggle('danger', hp.ratio <= 0.33);
  panel.classList.toggle('silhouette-danger', hp.ratio <= 0.25 && hp.ratio > 0);
  // danger-glow
  const glow = document.getElementById(`dangerGlow-${side}`);
  if (glow) { if (hp.ratio <= 0.25 && hp.ratio > 0) glow.classList.add('show'); else glow.classList.remove('show'); }
  // grit indicator
  const gi = document.getElementById(`grit-${side}`);
  if (gi){ gi.textContent = '⚡ ' + WM_I18N.t('闘志 ({n})', {n: ch.gritTurns}); gi.className = 'grit-indicator' + (ch.gritTurns>0?' active':''); }
}

// 結末を示唆するログ行を判定。pin/rollup/tkoStop シーケンスフレームでのみ hold する。
// i18n Stage B P7-53(裁定C-6): 完成文の部分一致は**翻訳した瞬間に無音で壊れる**ので、
// 生成元(match-engine.js の pushLog)がテンプレIDに固定した `logLineSpoilers` を正とする。
// 下の正規表現は、この配列を持たない旧フレーム(旧セーブのJT/天頂戦リプレイ)専用の保険。
const _SPOILER_LINE_RE = /(★|カウント2で返した|振りほどいた|キックアウト|ロープエスケープ|カットイン|見殺し|丸め込み|タップ|レフェリーストップ|大金星)/;
function _isSpoilerLine(line){
  const t = String(line).trim();
  return _SPOILER_LINE_RE.test(t);
}

// i18n Stage B P7-53: フレームのログ行を「1行=1レコード」へ展開する。
// text(JA完成文)は §14-3 の追加フィールド方式でそのまま残っており、tpl/vars があれば
// 表示直前に WM_I18N.t() で言語別に組み直す。tpl が無い旧フレームは text へ fail-open。
//   - {name}/{move} は t() のパラメータ値自動変換(D-P6-2/P7-5)で名前辞書・技名辞書を通る
//   - cls / spoiler は言語非依存(生成元が確定済み)。無ければ従来の部分一致へ落ちる
function _logRecords(fr){
  const lines = (fr && fr.logLines) || [];
  const tpls = (fr && fr.logLineTpls) || [];
  const vars = (fr && fr.logLineVars) || [];
  const clss = (fr && fr.logLineClasses) || [];
  const spos = (fr && fr.logLineSpoilers) || [];
  return lines.map((text, i) => ({
    text,
    tpl: tpls[i] || null,
    vars: vars[i] || null,
    cls: (clss.length > i) ? clss[i] : undefined,
    spoiler: (spos.length > i) ? !!spos[i] : _isSpoilerLine(text),
  }));
}

// 行頭の字下げ("  → …")は保ったまま返す(旧 `logLines.join(' ')` と1バイト同一にする)。
// trim は表示側(_logLineHtml)が従来どおり行う。
function _logRecordText(rec){
  if (rec && rec.tpl) {
    try { return String(WM_I18N.t(rec.tpl, rec.vars || {})); } catch (e) {}
  }
  return String((rec && rec.text) || '');
}

function _appendLogForFrame(fr){
  if (!fr) return;
  const turnMarker = `<div class="log-new-marker">— Turn ${fr.turn} —</div>`;
  let recs = _logRecords(fr);
  // pin seq 予定フレーム: ★決着行＋結末示唆行（カウント2返し/キックアウト/カットイン/丸め込み等）を保留
  if (S.pinSeqPending) {
    const held = recs.filter(r => r.spoiler);
    recs = recs.filter(r => !r.spoiler);
    S.heldWinLogs = { turn: fr.turn, held };
  }
  const lines = recs.map(r => _logLineHtml(r)).join('');
  S.logHtml = turnMarker + lines + S.logHtml;
  const lb = document.getElementById('battleLog');
  if (lb){ lb.innerHTML = S.logHtml; lb.scrollTop = 0; }
}

function _logLineHtml(rec){
  const t = _logRecordText(rec).trim();
  if (!t) return '';
  // 生成元が確定させたクラス(P7-53)を最優先。undefined=クラス情報を持たない旧フレーム
  // のときだけ、従来の完成文部分一致へフォールバックする。
  let cls = rec ? rec.cls : undefined;
  if (cls === undefined) {
    const ja = String((rec && rec.text) || '').trim();
    cls = (ja.startsWith('★') || ja.includes('時間切れ') || ja.includes('丸め込みで逆転')) ? 'finish' : null;
  }
  if (cls === 'finish')
    return `<div class="log-event finish"><span class="log-event-text log-finish-text">${escHtml(t)}</span></div>`;
  const m = t.match(/^T(\d+)\s+\[[^\]]+\]\s+(.*)$/);
  if (m) return `<div class="log-line"><span style="color:#444">T${m[1]}</span> ${escHtml(m[2])}</div>`;
  return `<div class="log-line">${escHtml(t)}</div>`;
}

// ─── フレーム進行 ─────────────────────────────────────────────────────────
// FRAME_DELAYS / _frameMinDelay は battle-replay-core.js で定義

function nextFrame(){
  if (S.anim || S.frameIdx >= S.frames.length) return;
  if (S.pendingCutin) return;
  clearTimeout(S.autoTimer);

  const fr = S.frames[S.frameIdx];
  S.frameIdx++;

  // フェーズ切替カットイン (Replay 版: フレームのフェーズが前フレームと変わったとき)
  const prevFr = S.frameIdx >= 2 ? S.frames[S.frameIdx - 2] : null;
  if (fr && prevFr && fr.phase !== prevFr.phase) {
    const phKey = (fr.phase || '').toLowerCase();
    if (S.cutinShown && !S.cutinShown[phKey]) {
      S.cutinShown[phKey] = true;
      const pill = document.getElementById('pill');
      if (pill){ pill.textContent = fr.phase; pill.classList.add('flash'); setTimeout(() => pill.classList.remove('flash'), 600); }
      // ビッグマッチ Climax → BGM 切替
      if (S._isBigMatch && fr.phase === 'Climax' && window.parent !== window) {
        window.parent.postMessage({ type: 'BIGMATCH_CLIMAX' }, '*');
      }
      // フェーズ導入カットイン (rivalryTier ≥ 1 の試合のみ)
      if (_tryPhaseIntroCutin(fr.phase)) return; // cutin が閉じたら nextFrame() を再呼び出し
    }
  }

  applyFrame(fr);

  if (fr.winner) {
    // ピン seq が走るフレームは _finishPinSeq が showResult を呼ぶ
    if (S.pinSeqPending) return;
    _notifyFinishCue();
    const finishNarEl = document.getElementById('narBox');
    if (finishNarEl) finishNarEl.innerHTML = `<div class="nar-line dramatic">${escHtml(WM_I18N.t('決着！'))}</div>`;
    setTimeout(() => showResult(fr), 1800);
    return;
  }
  const delay = _frameMinDelay(fr);
  if (S.autoAdvance && S.frameIdx < S.frames.length) {
    const speedD = SPEED_DELAYS[S.speedIdx] || 1500;
    S.autoTimer = setTimeout(() => nextFrame(), Math.max(delay + 300, speedD));
  }
}

function applyFrame(fr){
  S.anim = true;
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.disabled = true;
  // _buildPinCtrl が扱う全ケースを拾う: pinAttempt / rollup / tkoStop / kickout(fall/gu/count 付)
  S.pinSeqPending = !!(fr && (fr.pinAttempt || fr.rollup || fr.tkoStop || (fr.kickout && (fr.kickout.escapeType || fr.kickout.count != null))));

  // HP / grit を JS state に反映
  if (fr.hpL != null) S.L.hp = fr.hpL;
  if (fr.hpR != null) S.R.hp = fr.hpR;
  if (fr.gritL != null) S.L.gritTurns = fr.gritL;
  if (fr.gritR != null) S.R.gritTurns = fr.gritR;
  S.mom = fr.mom || 0;

  // 旧 battle-engine.html 準拠: big = 技基礎威力 mv.d>=14、phase rate + 3回上限で発動
  const _bigBase = !!(fr.action && fr.action.kind !== 'miss' && (fr.action.moveD|0) >= 14);
  const _phRate = BIGMOVE_ANIM_RATE[fr.phase] || 0;
  const isBigMove = _bigBase && (S.bigmoveCount|0) < 3 && Math.random() < _phRate;
  const chargeDelay = isBigMove ? BIGMOVE_CHARGE_MS : 0;

  if (isBigMove) {
    S.bigmoveCount = (S.bigmoveCount|0) + 1;
    try { sfx.bigmoveCharge(); } catch(e){}
    // 溜め中: 攻撃者パネルに charging を付与
    const atkSide = fr.action.atkSide === 'left' ? 'L' : 'R';
    const atkPanel = document.getElementById(`panel-${atkSide}`);
    if (atkPanel) atkPanel.classList.add('charging');
  }

  setTimeout(() => _applyFrameVisuals(fr, isBigMove), chargeDelay);

  const minDelay = _frameMinDelay(fr);
  setTimeout(() => {
    S.anim = false;
    const btn = document.getElementById('nBtn');
    if (btn && !S.pendingCutin && !S.pinCtrl) btn.disabled = false;
    const prev = document.getElementById('prevBtn');
    if (prev && !S.pendingCutin && !S.pinCtrl) prev.disabled = S.frameIdx === 0;
    if (!S.pinCtrl) _bindNextButton();
  }, minDelay);
}

function _applyFrameVisuals(fr, isBigMove){
  // 溜め終了 → charging 解除
  ['L','R'].forEach(s => {
    const el = document.getElementById(`panel-${s}`);
    if (el) el.classList.remove('charging');
  });

  _updateHud();
  _updatePanel('L');
  _updatePanel('R');
  _updateCenter(fr);
  _appendLogForFrame(fr);

  if (fr.action) animateAction(fr.action, fr, isBigMove);

  // クリティカルダメージセリフ (ピンフレームではスキップ)
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit && !S.pinSeqPending) {
    const serifDelay = isBigMove ? 900 : 600;
    setTimeout(() => tryDamageLine(fr.action, fr), serifDelay);
  }

  // ピンシーケンス起動
  if (S.pinSeqPending) _beginPinSequence(fr);
}

// ─── 演出 ─────────────────────────────────────────────────────────────────
function animateAction(action, fr, isBigMove){
  try { sfx.ready(); } catch(e){}
  _setRingActionState(action);

  if (action.kind === 'miss') {
    try { sfx.missWhiff(); } catch(e){}
    _spawnMissEffect(action);
    _spawnAttackArrow(action);
    return;
  }

  _spawnAttackArrow(action);

  if (isBigMove) {
    setTimeout(() => _renderActionImpact(action), 500);
    return;
  }
  _renderActionImpact(action);
}

function _setRingActionState(action){
  const ring = document.getElementById('liveRing');
  if (!ring || !action) return;
  ring.classList.remove('attack-left','attack-right','miss','counter');
  ring.classList.add(action.atkSide === 'right' ? 'attack-right' : 'attack-left');
  if (action.kind === 'miss') ring.classList.add('miss');
  if (action.kind === 'counter') ring.classList.add('counter');
  clearTimeout(ring._wmActionTimer);
  ring._wmActionTimer = setTimeout(() => ring.classList.remove('attack-left','attack-right','miss','counter'), action.kind === 'counter' ? 1700 : 950);
}

function _spawnMissEffect(action){
  // MISS! テキスト 1.5秒 + フラッシュ
  const mt = document.createElement('div');
  mt.className = 'miss-text';
  mt.textContent = 'MISS!';
  document.body.appendChild(mt);
  void mt.offsetWidth;
  mt.classList.add('show');
  setTimeout(() => mt.remove(), 1600);
  const mf = document.createElement('div');
  mf.className = 'miss-flash';
  document.body.appendChild(mf);
  setTimeout(() => mf.remove(), 400);
  // narBox にも MISS ナレーション (CMT は battle-lines.js 提供)
  const box = document.getElementById('narBox');
  if (box && typeof CMT !== 'undefined') {
    const v = { a: (action && action.atkSide === 'left') ? (S.L ? S.L.name : '') : (S.R ? S.R.name : '') };
    box.innerHTML = `<div class="nar-line nar-miss show">${pk(CMT.miss || ['かわした！'])}</div>`;
  }
}

function _spawnAttackArrow(action){
  const layer = document.getElementById('arrowLayer');
  if (!layer) return;
  const isMiss = action.kind === 'miss';
  if (action.kind === 'counter') {
    const origDir = action.atkSide === 'left' ? 'rtl' : 'ltr';
    const retDir  = origDir === 'ltr' ? 'rtl' : 'ltr';
    // P7-5: 技名は表示用の短縮EN(_mvDisp)。P7-9: 接頭の地の文もt()経由にした。
    // 技名は既に表示用へ変換済みの値をパラメータで渡す(convertNamesは英語値を素通しする)。
    _renderArrow(layer, origDir, _mvDisp(action.move) || WM_I18N.t('攻撃'), false, false);
    setTimeout(() => _renderArrow(layer, retDir, WM_I18N.t('カウンター！ {move}', { move: _mvDisp(action.counterMove || action.move) || '' }), true, false), 1000);
  } else {
    const dir = action.atkSide === 'left' ? 'ltr' : 'rtl';
    _renderArrow(layer, dir, _mvDisp(action.move) || WM_I18N.t('攻撃'), false, isMiss);
  }
}

function _renderArrow(layer, dir, labelText, isCounter, isMiss){
  [...layer.querySelectorAll('.attack-arrow')].forEach(el => {
    el.style.transition = 'opacity 0.15s'; el.style.opacity = '0';
    setTimeout(() => el.remove(), 180);
  });
  const arrow = document.createElement('div');
  arrow.className = 'attack-arrow ' + dir + (isCounter?' counter-reversal':'') + (isMiss?' miss':'');
  const head = dir === 'ltr' ? '▶' : '◀';
  arrow.innerHTML = `<div class="shaft"></div><div class="head">${head}</div><div class="label">${escHtml(labelText)}</div>`;
  layer.appendChild(arrow);
  void arrow.offsetWidth;
  arrow.classList.add('play');
  setTimeout(() => { if (arrow.parentNode) arrow.remove(); }, 1600);
}

function _renderActionImpact(action){
  // 多層防御: 上流が壊れていても MISS フレームで衝撃演出が走らないようガード
  if (!action || action.kind === 'miss') return;
  const defSide = action.atkSide === 'left' ? 'R' : 'L';
  const atkSide = action.atkSide === 'left' ? 'L' : 'R';
  const isBig   = action.dmg >= 20;

  _showRingImpact(action);
  _showDmgPop(defSide, action.dmg, action.isCrit, action.kind === 'counter');
  _applyShake(document.getElementById(`panel-${defSide}`), action.isCrit);

  if (action.kind === 'counter') _applyCounterFlash(document.getElementById(`panel-${atkSide}`));

  _playImpactSE(action);

  if (action.isCrit && isBig) _flashRedOverlay(document.getElementById('flashOv'));
  if (action.isCrit && action.dmg >= 15) _showBigMoveSplash(action.kind === 'counter' ? (action.counterMove || action.move) : action.move);
}

function _showRingImpact(action){
  const impact = document.getElementById('ringImpact');
  if (!impact || !action || action.kind === 'miss') return;
  impact.textContent = action.kind === 'counter' ? 'COUNTER!' : action.isCrit ? 'BIG HIT!' : 'HIT!';
  impact.classList.remove('show');
  void impact.offsetWidth;
  impact.classList.add('show');
  setTimeout(() => impact.classList.remove('show'), 650);
}

function _showDmgPop(side, val, isCrit, isCounter){
  const el = document.getElementById(`dmg-${side}`);
  if (!el) return;
  el.textContent = '-' + val;
  el.className = 'dmg-number' + (isCrit?' crit':'') + (isCounter?' counter':'');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); el.className = 'dmg-number'; }, 900);
}

function _showBigMoveSplash(moveName){
  const el = document.getElementById('bigmoveName');
  if (!el) return;
  // P7-5: Bebas Neue 56px の1行枠(モバイルは36px/max-width 92vw)。短縮形を優先する
  el.textContent = '— ' + _mvDisp(moveName) + ' —';
  el.className = 'bigmove-name show';
  setTimeout(() => el.classList.add('fade'), 1200);
  setTimeout(() => { el.className = 'bigmove-name'; el.textContent = ''; }, 1600);
}

// ─── ダメージセリフ ────────────────────────────────────────────────────────
function tryDamageLine(action, fr){
  if (!action) return;
  const defSide = action.atkSide === 'left' ? 'right' : 'left';
  const def     = action.atkSide === 'left' ? S.R : S.L;
  if (!def) return;
  const hpRatio = def.hp / def.mhp;
  // battle-lines.js 提供の pickDamageLine
  if (typeof pickDamageLine !== 'function') return;
  let line = pickDamageLine(def, action.dmg, hpRatio);
  if (!line) return;
  const last = S.lastCritTurn[defSide] || 0;
  if (fr.turn - last < 3) return;
  S.lastCritTurn[defSide] = fr.turn;
  // firing-grudge-spec-v0.1 Phase 5: 解雇キャラが元雇用団体に被弾したとき、
  // vsExHit から 50% で差し替える（HP 33% 以下の "言葉にならない" 帯では発動させない＝既存ルール尊重）。
  if (def.vsExHit && Array.isArray(def.vsExHit) && def.vsExHit.length > 0 && hpRatio > 0.33 && Math.random() < 0.5) {
    const text = def.vsExHit[Math.floor(Math.random() * def.vsExHit.length)];
    line = { type: 'serif', text };
  }
  const domSide = defSide === 'left' ? 'L' : 'R';
  const cssCls  = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
  // i18n Stage B P5-1: 表示直前でt()を通す(pickDamageLineはbattle-lines.jsのEngine純粋関数、
  // def.vsExHitはVS_EX_EMPLOYER_LINES由来。どちらも生JA行)。
  showCutin(def, domSide, WM_I18N.t(line.text), cssCls);
  setTimeout(() => { if (S.pendingCutin) dismissCutin(); }, 1500);
}

// ─── カットイン ────────────────────────────────────────────────────────────
function _getCutinLines(lineType, personality, archetype){
  const section = CUTIN_LINES[lineType];
  if (!section) return null;
  // 第一分岐はアーキタイプ(口調)。性格を先に引くと口調が揃ってしまう(2026-08-01 入れ替え)
  // フォールバックは4段: (a,p) → (a,normal) → (standard,p) → (standard,normal)
  const byA = section[archetype] || {};
  const byStd = section['standard'] || {};
  if (Array.isArray(byA)) return byA;
  if (Array.isArray(byStd) && !section[archetype]) return byStd;
  return byA[personality] || byA['normal'] || byStd[personality] || byStd['normal'] || null;
}

function showCutin(fighter, side, text, cssCls){
  const variant = (cssCls === 'damage-serif' || cssCls === 'damage-voice') ? cssCls : 'default';
  BattleAnim.renderCutin({
    overlay: document.getElementById('cutinOv'),
    fighter, side: side === 'L' ? 'left' : (side === 'R' ? 'right' : side), text, variant,
  });
  S.pendingCutin = true;
  const btn = document.getElementById('nBtn');
  if (btn) btn.disabled = true;
  const prev = document.getElementById('prevBtn');
  if (prev) prev.disabled = true;
}

function dismissCutin(){
  // 進行不能防止: DOM 異常時もフラグだけは必ず落とす（オーバーレイが消失しても次フレームへ進めるように）
  const ov = document.getElementById('cutinOv');
  const wasPhaseIntro = !!S._pendingPhaseIntro;
  S.pendingCutin = false;
  S._pendingPhaseIntro = false;
  if (S._phaseIntroSafetyTimer) { clearTimeout(S._phaseIntroSafetyTimer); S._phaseIntroSafetyTimer = null; }
  if (ov) BattleAnim.dismissCutin(ov);

  // フェーズ導入 pending があれば nextFrame を再開
  if (wasPhaseIntro) {
    // 仮差し替えした nBtn.onclick を通常導線へ戻す
    _bindNextButton();
    setTimeout(() => nextFrame(), 400);
    return;
  }
  // ピンシーケンス中なら次ステップへ
  if (S.pinCtrl && S.pinCtrl.seq[S.pinCtrl.idx]) {
    const kind = S.pinCtrl.seq[S.pinCtrl.idx].kind;
    if (kind === 'damage') { _advancePinStep(); return; }
  }
  const btn = document.getElementById('nBtn');
  if (btn && !S.anim) btn.disabled = false;
  const prev = document.getElementById('prevBtn');
  if (prev && !S.anim && !S.pinCtrl) prev.disabled = S.frameIdx === 0;
  if (S.autoAdvance && !S.anim && S.frameIdx < S.frames.length) {
    S.autoTimer = setTimeout(() => nextFrame(), 600);
  }
}

// フェーズ導入カットイン (Replay 版: nextFrame 内から呼ぶ)
function _tryPhaseIntroCutin(phaseName){
  const mi = S.matchInfo || {};
  if (!mi.rivalryTier || mi.rivalryTier <= 0) return false;
  const rates = [0, 0.30, 0.50, 0.80];
  const rate  = rates[Math.min(mi.rivalryTier, 3)] || 0;
  if (Math.random() > rate) return false; // RNG: 演出側は Math.random() で可
  const isLeftLeading = S.mom >= 0;
  const charData = isLeftLeading ? S.L : S.R;
  const domSide  = isLeftLeading ? 'L' : 'R';
  const lineType = (phaseName === 'Climax') ? 'climax' : 'atk';
  const personality = isLeftLeading ? (mi.leftPersonality || 'normal') : (mi.rightPersonality || 'normal');
  const archetype   = isLeftLeading ? (mi.leftArchetype  || 'standard') : (mi.rightArchetype  || 'standard');
  const lines = _getCutinLines(lineType, personality, archetype);
  if (!lines || !lines.length) return false;
  // i18n Stage B P5-1: CUTIN_LINES はこのファイル内に直書きされたセリフ表(本台帳の
  // 抽出対象外だが、表示直前でt()を通しておけば将来ledger化されたときに無改修で乗る)。
  const text = WM_I18N.t(pk(lines));
  S._pendingPhaseIntro = true;
  showCutin(charData, domSide, text, 'default');
  // 冗長化: 次へボタンからも dismiss できるよう一時的にハンドラを差し替える
  const nBtn = document.getElementById('nBtn');
  if (nBtn) {
    nBtn.disabled = false;
    nBtn.onclick = () => { dismissCutin(); };
  }
  // セーフティ: 8秒経っても dismiss されなければ自動解除（onclick失火/オーバーレイ消失への保険）
  if (S._phaseIntroSafetyTimer) clearTimeout(S._phaseIntroSafetyTimer);
  S._phaseIntroSafetyTimer = setTimeout(() => {
    if (S._pendingPhaseIntro) dismissCutin();
  }, 8000);
  return true;
}

// ライバリーカットイン: フィニッシュ前 (tryRivalryCutin は showFinishClickBtn から呼ぶ)
function tryRivalryCutin(lineType, side){
  const mi = S.matchInfo || {};
  if (!mi.rivalryTier || mi.rivalryTier <= 0) return;
  const rates = [0, 0.30, 0.50, 0.80];
  const rate  = rates[Math.min(mi.rivalryTier, 3)] || 0;
  if (Math.random() > rate) return;
  const charData = side === 'L' ? S.L : S.R;
  const personality = side === 'L' ? (mi.leftPersonality || 'normal') : (mi.rightPersonality || 'normal');
  const archetype   = side === 'L' ? (mi.leftArchetype  || 'standard') : (mi.rightArchetype  || 'standard');
  const lines = _getCutinLines(lineType, personality, archetype);
  if (!lines || !lines.length) return;
  // i18n Stage B P5-1: 表示直前でt()を通す(CUTIN_LINES、本台帳の抽出対象外だが将来のため配線)。
  showCutin(charData, side, WM_I18N.t(pk(lines)), 'default');
}

// ─── フィニッシュクリックボックス ──────────────────────────────────────────
// pinCtrl.seq 内の finishClick ステップから _showFinishClickBox 経由で呼ばれる。
// battle-engine.html の showFinishClickBtn と同じ役割だが Replay 版はコールバックで次ステップへ進む。
function _showFinishClickBox(label, onResolve){
  const btn = document.getElementById('finishBtn');
  const ov  = document.getElementById('finishOverlay');
  const nBtn = document.getElementById('nBtn');
  if (!btn || !ov) { if (typeof onResolve === 'function') onResolve(); return; }
  if (nBtn) nBtn.disabled = true;
  btn.textContent = label;
  btn.disabled = false;
  ov.classList.add('show');
  setTimeout(() => btn.classList.add('show'), 100);
  // サスペンスドローン
  try { startDrone(false); } catch(e){}
  let handled = false;
  let autoTimer = null;
  const cleanup = () => {
    btn.disabled = true;
    btn.classList.remove('show');
    ov.classList.remove('show');
    btn.removeEventListener('click', handler);
    document.removeEventListener('keydown', keyHandler);
    clearTimeout(autoTimer);
    try { stopDrone(); } catch(e){}
  };
  const handler = () => {
    if (handled) return;
    handled = true;
    cleanup();
    if (typeof onResolve === 'function') onResolve();
  };
  const keyHandler = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handler(); }
  };
  btn.addEventListener('click', handler);
  document.addEventListener('keydown', keyHandler);
  if (S.autoAdvance) autoTimer = setTimeout(handler, 2500);
}

// ─── ピンカウントシーケンス ────────────────────────────────────────────────
// Replay 版: フレームの pinAttempt / kickout / rollup / tkoStop フィールドを読んでシーケンスを構築。
// PIN_SEQ_LEAD_MS は battle-replay-core.js で定義

function _beginPinSequence(fr){
  const ctrl = _buildPinCtrl(fr);
  if (!ctrl || ctrl.seq.length === 0) return;
  S.pinCtrl = ctrl;
  S.pendingCutin = true;
  const btn = document.getElementById('nBtn');
  if (btn) btn.disabled = true;
  setTimeout(() => { if (!S.pinCtrl) return; _executePinStep(0); }, PIN_SEQ_LEAD_MS);
}

function _buildPinCtrl(fr){
  const seq = [];

  // フレームスキーマ: pinAttempt='success'|'kickout2', kickout={count,escapeType}, rollup='success', tkoStop=true
  // action.isCrit があればダメージセリフを先頭に
  if (fr.action && fr.action.kind !== 'miss' && fr.action.isCrit && !fr.rollup) {
    const defSide = fr.action.atkSide === 'left' ? 'right' : 'left';
    const def = fr.action.atkSide === 'left' ? S.R : S.L;
    if (def && typeof pickDamageLine === 'function') {
      const hpRatio = def.hp / def.mhp;
      let line = pickDamageLine(def, fr.action.dmg, hpRatio);
      const last = S.lastCritTurn[defSide] || 0;
      if (line && fr.turn - last >= 3) {
        S.lastCritTurn[defSide] = fr.turn;
        // firing-grudge-spec-v0.1 Phase 5: vsExHit 50% bias（HP 33% 超のみ）
        if (def.vsExHit && Array.isArray(def.vsExHit) && def.vsExHit.length > 0 && hpRatio > 0.33 && Math.random() < 0.5) {
          const text = def.vsExHit[Math.floor(Math.random() * def.vsExHit.length)];
          line = { type: 'serif', text };
        }
        const domSide = defSide === 'left' ? 'L' : 'R';
        const cssCls  = line.type === 'serif' ? 'damage-serif' : 'damage-voice';
        // i18n Stage B P5-1: 表示直前でt()を通す(このseqアイテムはpin-sequence再生時に
        // そのままtext表示されるだけで、以後のtext自体の加工はない)。
        seq.push({ kind: 'damage', fighter: def, side: domSide, text: WM_I18N.t(line.text), cssCls });
      }
    }
  }

  // i18n P7-9: seq のテキストは push 時点で t() を通す(既存の damage ステップと同じ作法)。
  // 観戦iframeは試合ごとに開き直すので試合中に言語が変わることはない。
  // 名前・技名は**プレースホルダの値として渡す**(t()のenブランチが名前辞書/技名辞書を
  // 引き当てる。置換より前に辞書を引くのが規約 — specs §9)。
  const INTRO = PIN_INTRO_TEXTS;

  // TKO
  if (fr.tkoStop) {
    seq.push({ kind: 'introBig', text: WM_I18N.t(pk(INTRO.tko)), dramatic: true });
    seq.push({ kind: 'finishClick', label: WM_I18N.t('…！？') });
    seq.push({ kind: 'count', text: WM_I18N.t('TKO！！'), cls: 'tko' });
    return { seq, idx: -1, fr };
  }

  // 丸め込み
  if (fr.rollup) {
    const atkSide  = fr.action ? fr.action.atkSide : 'left';
    const subjChar = atkSide === 'left' ? S.L : S.R;
    const objChar  = atkSide === 'left' ? S.R : S.L;
    const subjSide = atkSide === 'left' ? 'L' : 'R';
    const objSide  = subjSide === 'L' ? 'R' : 'L';
    const statusText = subjChar
      ? WM_I18N.t('{subj}が押さえ込んでいる！', { subj: subjChar.name })
      : WM_I18N.t('押さえ込んでいる！');
    if (subjChar && objChar) {
      seq.push({ kind: 'introBig', text: WM_I18N.t('{subj}が{obj}を丸め込んだ！', { subj: subjChar.name, obj: objChar.name }), dramatic: true, rollupHighlight: { subjSide, objSide } });
    }
    seq.push({ kind: 'count', text: WM_I18N.t('ワン！'), cls: '', rollupStatus: statusText });
    seq.push({ kind: 'count', text: WM_I18N.t('ツー！'), cls: 'two', rollupStatus: statusText });
    seq.push({ kind: 'finishClick', label: WM_I18N.t('…！？') });
    if (fr.rollup === 'success') {
      seq.push({ kind: 'count', text: WM_I18N.t('3ーーーっ！！'), cls: 'three', rollupStatus: statusText });
    } else {
      // kickout
      seq.push({ kind: 'count', text: WM_I18N.t('返したーーっ！'), cls: 'kickout' });
    }
    return { seq, idx: -1, fr };
  }

  // ギブアップ
  if (fr.kickout && fr.kickout.escapeType === 'gu') {
    const atkSide = fr.action ? fr.action.atkSide : 'left';
    const atkChar = atkSide === 'left' ? S.L : S.R;
    const defChar = atkSide === 'left' ? S.R : S.L;
    const moveName = fr.action ? (fr.action.move || '') : '';
    if (atkChar && defChar) seq.push({ kind: 'introBig', text: WM_I18N.t('{atk}が{def}に{move}をがっちりロック！', { atk: atkChar.name, def: defChar.name, move: moveName }), dramatic: true });
    const isWin = fr.winner != null;
    if (isWin) {
      seq.push({ kind: 'finishClick', label: WM_I18N.t('…！？') });
      if (defChar) seq.push({ kind: 'count', text: WM_I18N.t('{def}がタップ！！', { def: defChar.name }), cls: 'tap' });
    } else {
      seq.push({ kind: 'finishClick', label: WM_I18N.t('…！？') });
      seq.push({ kind: 'count', text: WM_I18N.t('ロープ！ ロープブレイクーーっ！！'), cls: 'escape' });
    }
    return { seq, idx: -1, fr };
  }

  // submission mid-match attempt (HP>0 で極め技が脱出された)
  if (fr.pinAttempt === 'kickout2_sub') {
    const atkSide = fr.action ? fr.action.atkSide : 'left';
    const defChar = atkSide === 'left' ? S.R : S.L;
    seq.push({ kind: 'introBig', text: WM_I18N.t(pk(SUB_ATTEMPT_INTRO_TEXTS)), dramatic: true });
    seq.push({ kind: 'finishClick', label: WM_I18N.t('…！？') });
    seq.push({ kind: 'count', text: defChar ? WM_I18N.t('{def}が振りほどいた！！', { def: defChar.name }) : WM_I18N.t('振りほどいた！！'), cls: 'escape' });
    return { seq, idx: -1, fr };
  }

  // フォール / ピン (fall / kickout2)
  const isPin  = fr.pinAttempt === 'kickout2'; // HP > 0 でのフォール試み
  const isFall = !isPin && fr.kickout && (fr.kickout.escapeType === 'fall' || fr.kickout.count != null);
  const introArr = isPin ? INTRO.pin : INTRO.fall;
  seq.push({ kind: 'introBig', text: WM_I18N.t(pk(introArr)), dramatic: true });
  const count = (fr.kickout && fr.kickout.count) ? fr.kickout.count : 2;
  if (count >= 1) seq.push({ kind: 'count', text: WM_I18N.t('ワン！'), cls: '' });
  if (count >= 2) seq.push({ kind: 'count', text: WM_I18N.t('ツー！'), cls: 'two' });
  seq.push({ kind: 'finishClick', label: WM_I18N.t('…！？') });
  if (fr.winner != null) {
    seq.push({ kind: 'count', text: WM_I18N.t('3ーーーーっ！！！'), cls: 'three' });
  } else {
    seq.push({ kind: 'count', text: WM_I18N.t('返したーーーーっ！！'), cls: 'kickout' });
  }
  return { seq, idx: -1, fr };
}

function _executePinStep(idx){
  if (!S.pinCtrl) return;
  if (idx >= S.pinCtrl.seq.length) { _finishPinSeq(); return; }
  S.pinCtrl.idx = idx;
  const step = S.pinCtrl.seq[idx];
  const isFinal = idx === S.pinCtrl.seq.length - 1;
  const isLead  = !isFinal && (step.kind === 'count' || step.kind === 'introBig');

  if (step.kind === 'count') {
    _spawnPinCount(step.text, step.cls);
    if (step.rollupStatus) {
      const narEl = document.getElementById('narBox');
      if (narEl) narEl.innerHTML = `<div class="nar-line dramatic rollup-status">${escHtml(step.rollupStatus)}</div>`;
    }
    _schedulePinAdvance(isLead, step.cls);
  } else if (step.kind === 'introBig') {
    _spawnBigIntro(step.text);
    const narEl = document.getElementById('narBox');
    if (narEl) narEl.innerHTML = `<div class="nar-line ${step.dramatic?'dramatic':''}">${escHtml(step.text)}</div>`;
    if (step.rollupHighlight) {
      _applyRollupHighlight(step.rollupHighlight.subjSide, step.rollupHighlight.objSide);
      try { sfx.cutinSlide(); } catch(e){}
    } else {
      try { sfx.finImpact(); } catch(e){}
    }
    _schedulePinAdvance(isLead, 'introBig');
  } else if (step.kind === 'finishClick') {
    // フィニッシュ直前カットイン (rivalryTier 2+)
    const mi = S.matchInfo || {};
    if (mi.rivalryTier >= 2 && S.cutinShown && !S.cutinShown.finish) {
      S.cutinShown.finish = true;
      const atkSide = S.mom >= 0 ? 'L' : 'R';
      tryRivalryCutin('atk', atkSide);
    }
    _showFinishClickBox(step.label, () => _advancePinStep());
  } else if (step.kind === 'damage') {
    showCutin(step.fighter, step.side, step.text, step.cssCls);
    setTimeout(() => { if (S.pendingCutin) dismissCutin(); }, 1500);
  }
}

function _schedulePinAdvance(isLead, stepKey){
  const btn = document.getElementById('nBtn');
  clearTimeout(S.pinStepTimer);
  const LEAD_DELAY  = (stepKey === 'introBig') ? 1800 : (stepKey === 'narration') ? 1500 : 1100;
  const FINAL_AUTO  = 2500;
  const decisiveAuto = (stepKey === 'three' || stepKey === 'tap' || stepKey === 'tko');
  if (isLead) {
    if (btn){ btn.disabled = true; btn.onclick = () => { clearTimeout(S.pinStepTimer); _advancePinStep(); }; setTimeout(() => { if (S.pinCtrl && btn.onclick) btn.disabled = false; }, 400); }
    S.pinStepTimer = setTimeout(() => _advancePinStep(), LEAD_DELAY);
  } else {
    if (btn){ btn.disabled = true; btn.onclick = _advancePinStep; setTimeout(() => { if (S.pinCtrl && btn.onclick === _advancePinStep) btn.disabled = false; }, decisiveAuto ? 250 : 700); }
    if (decisiveAuto || S.autoAdvance) S.pinStepTimer = setTimeout(() => _advancePinStep(), decisiveAuto ? 900 : FINAL_AUTO);
  }
}

function _advancePinStep(){ if (S.pinCtrl) _executePinStep(S.pinCtrl.idx + 1); }

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
  S.pendingCutin  = false;
  _clearRollupHighlight();
  const btn = document.getElementById('nBtn');

  // 保留していた「★ 決着！」ログ追記
  if (S.heldWinLogs && fr && S.heldWinLogs.turn === fr.turn && S.heldWinLogs.held.length) {
    const heldHtml  = S.heldWinLogs.held.map(r => _logLineHtml(r)).join('');
    const markerEnd = S.logHtml.indexOf('</div>');
    if (markerEnd >= 0) {
      const cut = markerEnd + '</div>'.length;
      S.logHtml = S.logHtml.slice(0, cut) + heldHtml + S.logHtml.slice(cut);
    } else {
      S.logHtml = heldHtml + S.logHtml;
    }
    const lb = document.getElementById('battleLog');
    if (lb){ lb.innerHTML = S.logHtml; lb.scrollTop = 0; }
  }
  S.heldWinLogs = null;

  if (fr && fr.winner != null) {
    _notifyFinishCue();
    // narBox を「決着！」に差し替え
    const narEl = document.getElementById('narBox');
    if (narEl) narEl.innerHTML = `<div class="nar-line dramatic">${escHtml(WM_I18N.t('決着！'))}</div>`;
    if (btn) btn.disabled = true;
    setTimeout(() => showResult(fr), 800);
  } else {
    _bindNextButton();
    if (btn) btn.disabled = false;
    const prev = document.getElementById('prevBtn');
    if (prev) prev.disabled = S.frameIdx === 0;
    if (S.autoAdvance && S.frameIdx < S.frames.length) {
      clearTimeout(S.autoTimer);
      S.autoTimer = setTimeout(() => nextFrame(), 600);
    }
  }
}

// ─── ピン演出ヘルパー ─────────────────────────────────────────────────────
function _spawnPinCount(text, cls){
  const el = document.createElement('div');
  el.className = 'pin-count' + (cls ? ' ' + cls : '');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
  try {
    if (cls === 'three')                    { sfx.count(); sfx.finImpact(); }
    else if (cls === 'tap' || cls === 'tko') { sfx.bellx3(); sfx.finImpact(); }
    else if (cls === 'kickout')              sfx.kickoutSE();
    else if (cls === 'escape')               sfx.guEscapeSE();
    else                                     sfx.count();
  } catch(e){}
}

// P7-12: .long判定の閾値は言語別。JAは元の16字を1文字も変えない。
// ENは実測(PIN_INTRO_TEXTS/SUB_ATTEMPT_INTRO_TEXTS全12件の英訳、下記コメント)で
// JAの長短判定(閾値16)と一致する境界を求め、37字とした。
//   JA長: 20 22 13 20 17 14 26 17 21 19 17 18 字
//   EN長: 46 46 28 37 48 36 61 39 50 43 37 49 字
//   → JAで16字未満(13/14字)の2件だけがEN37字未満(28/36字)に対応する。
//   よって「EN長>=37字」で判定すると同じ12件がJAと1件も食い違わずlong/通常に分かれる。
const BIG_INTRO_LONG_THRESHOLD_EN = 37;
function _spawnBigIntro(text){
  const el  = document.createElement('div');
  const isEn = (typeof WM_I18N !== 'undefined' && WM_I18N.lang === 'en');
  const long = String(text).length >= (isEn ? BIG_INTRO_LONG_THRESHOLD_EN : 16);
  el.className = 'big-intro' + (long ? ' long' : '');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

function _applyRollupHighlight(subjSide, objSide){
  const subj = document.getElementById(`panel-${subjSide}`);
  const obj  = document.getElementById(`panel-${objSide}`);
  if (subj) subj.classList.add('rollup-subject');
  if (obj)  obj.classList.add('rollup-object');
}
function _clearRollupHighlight(){
  ['L','R'].forEach(s => {
    const el = document.getElementById(`panel-${s}`);
    if (el) el.classList.remove('rollup-subject','rollup-object');
  });
}

// ─── REPLAY CONTROLS ──────────────────────────────────────────────────────
function _rebuildLogUntil(frameCount){
  let html = '';
  for (let i = 0; i < frameCount; i++) {
    const frame = S.frames[i];
    if (!frame) continue;
    const marker = `<div class="log-new-marker">— Turn ${frame.turn} —</div>`;
    const lines = _logRecords(frame).map(r => _logLineHtml(r)).join('');
    html = marker + lines + html;
  }
  return html;
}

function previousFrame(){
  if (S.anim || S.pendingCutin || S.pinCtrl || S.frameIdx <= 0) return;
  clearTimeout(S.autoTimer);
  S.autoAdvance = false;
  S.frameIdx = Math.max(0, S.frameIdx - 1);
  const frame = _getCurrentFrame();
  S.L.hp = frame && frame.hpL != null ? frame.hpL : S.startHpL;
  S.R.hp = frame && frame.hpR != null ? frame.hpR : S.startHpR;
  S.L.gritTurns = frame && frame.gritL != null ? frame.gritL : 0;
  S.R.gritTurns = frame && frame.gritR != null ? frame.gritR : 0;
  S.mom = frame ? (frame.mom || 0) : 0;
  S.logHtml = _rebuildLogUntil(S.frameIdx);
  S.pinSeqPending = false;
  S.heldWinLogs = null;
  renderMatchFrame();
}

function toggleAuto(){
  S.autoAdvance = !S.autoAdvance;
  const b = document.getElementById('autoBtn');
  if (b){ b.classList.toggle('active', S.autoAdvance); b.innerHTML = WM_I18N.t('自動再生') + '<span>' + (S.autoAdvance?WM_I18N.t('再生中'):WM_I18N.t('停止')) + '</span>'; }
  if (S.autoAdvance) {
    if (!S.anim && !S.pendingCutin && S.frameIdx < S.frames.length)
      S.autoTimer = setTimeout(() => nextFrame(), 500);
  } else {
    clearTimeout(S.autoTimer);
  }
}
function setSpeed(idx){
  S.speedIdx = clamp(idx, 0, SPEED_DELAYS.length - 1);
  document.querySelectorAll('.speed-dot').forEach((d, i) => {
    d.classList.toggle('on',  i === S.speedIdx);
    d.classList.toggle('off', i !== S.speedIdx);
  });
}

// ─── 結果表示 ─────────────────────────────────────────────────────────────
function showResult(fr){
  const result  = S.result;
  const winSide = result.winner; // 'left'|'right'|'draw'
  const isDraw  = winSide === 'draw';
  const winner  = isDraw ? null : (winSide === 'left' ? S.L : S.R);
  const loser   = isDraw ? null : (winSide === 'left' ? S.R : S.L);
  const finType = result.finType  || '';
  const finMove = result.finMove  || '';
  const mq      = result.mq       || 0;
  const turns   = result.turns    || 0;

  _notifyFinishCue();

  const mqCls = mq >= 80 ? 'mq-gold' : mq >= 60 ? 'mq-green' : mq >= 40 ? 'mq-normal' : 'mq-low';
  const finLabel = _localFormatFinish(finType, finMove);

  const ov = document.getElementById('victoryOv');
  if (!ov) {
    // victoryOv が存在しない場合は動的生成 (Step 3 シェル化前の互換)
    const dynOv = document.createElement('div');
    dynOv.id = 'victoryOv';
    dynOv.className = 'victory-overlay';
    document.body.appendChild(dynOv);
  }
  const victoryOv = document.getElementById('victoryOv');
  if (!victoryOv) return;

  if (isDraw) {
    victoryOv.innerHTML = `<div class="result-box">
      <div class="result-draw-content">
        <div class="result-winner">NO CONTEST</div>
        <div class="result-type">${WM_I18N.t('タイムアップ — 決着つかず')}</div>
      </div>
      <button class="btn-end" id="eBtn">CLOSE</button>
    </div>`;
  } else {
    // i18n Stage B P5-1: t()は表示直前(タイプライター開始前)に1回だけ通す(1文字ずつではない)。
    // winner.vl は VICTORY_LINES 由来の生JA行配列(app.js側で選手データに付与)。
    const vLine = winner && winner.vl && winner.vl.length ? WM_I18N.t(pk(winner.vl)) : '';
    // The victory quote is the winner speaking, so the identity card below must match that speaker.
    victoryOv.innerHTML = `<div class="victory-box" id="rBox">
      <div class="vic-speech-slot"><div class="vic-speech" id="rQuote"><div class="vic-speech-text" id="rSpeech"></div></div></div>
      <img id="rImg" class="winner-portrait" src="${_getUpperUrl(winner)}" alt="${escHtml(WM_I18N.pn(winner.name))}" onerror="this.style.display='none'">
      <div class="winner-label">W I N N E R</div>
      <div class="winner-name" id="rWinner">${escHtml(WM_I18N.pn(winner.name))}</div>
      <div class="vic-finish" id="rType">${escHtml(finLabel)}</div>
      <div class="vic-bottom" id="rBottom">
        <div class="vic-loser">
          <img class="vic-loser-face" src="${_getFaceUrl(winner)}" alt="${escHtml(WM_I18N.pn(winner.name))}" onerror="this.style.display='none'">
          <div>
            <div class="vic-loser-name">${escHtml(WM_I18N.pn(winner.name))}</div>
            <div class="vic-loser-tag">WINNER</div>
          </div>
        </div>
        <div class="vic-stats">
          <div class="vic-stat"><div class="vic-stat-label">${WM_I18N.t('評価')}</div><div class="vic-stat-value ${mqCls}">${mq}</div></div>
          <div class="vic-stat"><div class="vic-stat-label">Turns</div><div class="vic-stat-value">${turns}</div></div>
        </div>
      </div>
      <button class="vic-close" id="eBtn">C L O S E</button>
    </div>`;

    setTimeout(() => {
      const rBox = document.getElementById('rBox');
      if (rBox) rBox.classList.add('visible');
      const rImg = document.getElementById('rImg');
      if (rImg) rImg.classList.add('visible');
      try { if (sfx.victoryFanfare) sfx.victoryFanfare(); } catch(e) {}
    }, 800);
    setTimeout(() => { const rW = document.getElementById('rWinner'); if (rW) rW.classList.add('visible'); const rT = document.getElementById('rType'); if (rT) rT.classList.add('visible'); }, 1500);
    setTimeout(() => { const rB = document.getElementById('rBottom'); if (rB) rB.classList.add('visible'); }, 1800);
    if (vLine) {
      setTimeout(() => {
        const rQ = document.getElementById('rQuote');
        if (rQ) rQ.classList.add('visible');
        const rS = document.getElementById('rSpeech');
        if (rS) { let idx = 0; const tw = setInterval(() => { idx++; rS.textContent = vLine.slice(0, idx); if (idx >= vLine.length) clearInterval(tw); }, 40); }
      }, 2200);
    }
  }
  victoryOv.classList.add('show');
  requestAnimationFrame(() => victoryOv.classList.add('visible'));

  setTimeout(() => {
    const eBtn = document.getElementById('eBtn');
    if (eBtn) { eBtn.classList.add('visible'); eBtn.addEventListener('click', endMatch); }
  }, 1200);
}

// i18n Stage A P3a: data.js FINISH_TEXTと同値のローカル複製。
// battle-engine.htmlはdata.jsを読み込まない独立構成のためテーブルを共通化できない
// (重複の正はdata.js側のFINISH_TEXT — 値を変えるときは両方直すこと)。
const _LOCAL_FINISH_TEXT = {
  'フォール': '{move} → 3カウント',
  'ピン': '{move} → 3カウント',
  'ギブアップ': '{move} → ギブアップ',
  'TKO': '{move} → レフェリーストップ',
  '丸め込み': '{move} → 丸め込み',
};
// data.js の FINISH_TEXT_FALLBACK と同値。**変数で t() へ渡すのは意図的** —
// このキーは i18n/template-ledger.json 側に既にあり、静的リテラルで書くと
// test/i18n-extract-ui.js が拾って ui-ledger にも同じキーが載る=二重登録になる
// (どちらの訳が出るかが addDict の読み込み順に依存する。specs §9 の禁止事項)。
const _LOCAL_FINISH_FALLBACK = '激闘決着';

// i18n P7-9: result.finType は**ロジックキー**(日本語固定・セーブ互換 — specs §2-2)。
// 表示ラベルは辞書で引く。ここを switch + 静的リテラルで書くのは、
// test/i18n-extract-ui.js が WM_I18N.t() の静的第1引数を機械抽出するから
// (変数を渡すと台帳に載らず、kept:true の手追加が要る)。
// ja では t() が素通しするので、返る文字列は finType そのもの = 1バイト不変。
function _finTypeLabel(finType){
  switch (finType) {
    case 'フォール':   return WM_I18N.t('フォール');
    case 'ピン':       return WM_I18N.t('ピン');
    case 'ギブアップ': return WM_I18N.t('ギブアップ');
    case 'TKO':        return WM_I18N.t('TKO');
    case '丸め込み':   return WM_I18N.t('丸め込み');
    case 'HP判定':     return WM_I18N.t('HP判定');
    default:           return finType || '';
  }
}
// i18n P7-9: battle-engine.html が lang-en-templates.js を読み込むようになったので、
// テンプレ本体(=data.js FINISH_TEXT と同じ辞書キー)もt()で引けるようになった(P7-5の発見1)。
// 技名は**パラメータで渡す** — t()のenブランチが技名辞書を引き当てる(Engine.formatFinish
// と同じ作法。dictで先に訳してから置換しないこと)。
function _localFormatFinish(finType, finMove){
  if (!finMove) return finType ? _finTypeLabel(finType) : WM_I18N.t(_LOCAL_FINISH_FALLBACK);
  const tmpl = _LOCAL_FINISH_TEXT[finType];
  if (tmpl) return WM_I18N.t(tmpl, { move: finMove });
  return WM_I18N.t('{move} ({type})', { move: finMove, type: finType ? _finTypeLabel(finType) : WM_I18N.t('決着') });
}

// ─── 試合終了 → 親フレームへ結果通知 ────────────────────────────────────
function endMatch(){
  const result = S.result;
  if (!result) return;
  const msg = {
    type:    'MATCH_RESULT',
    winner:  result.winner,
    winnerId: result.winnerId || null,
    loserId:  result.loserId  || null,
    leftId:   result.leftId   || (S.L ? S.L.id : null),
    rightId:  result.rightId  || (S.R ? S.R.id : null),
    turns:   result.turns,
    mq:      result.mq,
    finType: result.finType,
    finMove: result.finMove,
    hpLeft:  result.hpLeft  || { current: Math.max(0, S.L ? S.L.hp : 0), max: S.L ? S.L.mhp : 0 },
    hpRight: result.hpRight || { current: Math.max(0, S.R ? S.R.hp : 0), max: S.R ? S.R.mhp : 0 },
    log:     result.log || [],
  };
  window.parent.postMessage(msg, '*');
}

// ─── Fighter Popup ────────────────────────────────────────────────────────
// side: 'L' | 'R'
function openBp(side){
  const ch  = side === 'L' ? S.L : S.R;
  if (!ch) return;
  const hp  = _hpPct(ch);
  const ovr = _calcOvr(ch);
  const mi  = S.matchInfo || {};
  const hasRivalry = mi.rivalryTier > 0;
  const isTitle    = !!mi.isTitle;
  const mirrorStyle = side === 'L' ? 'transform:scaleX(-1)' : '';
  // i18n P7-9(同型の穴): 選手ポップアップの年齢だけ生JAの連結だった(既存キー`{age}歳`)
  const age = ch.age ? WM_I18N.t('{age}歳', { age: ch.age }) : '';
  let badges = '';
  if (hasRivalry) badges += '<span class="bp-badge rival">🔥 RIVAL</span>';
  if (isTitle)    badges += '<span class="bp-badge title">🏆 TITLE MATCH</span>';
  const stats = [
    {k:'pow',l:'POW',v:Math.round(ch.pw||0)},
    {k:'spd',l:'SPD',v:Math.round(ch.sp||0)},
    {k:'tec',l:'TEC',v:Math.round(ch.te||0)},
    {k:'sta',l:'STA',v:Math.round(ch.st||0)},
    {k:'mn', l:'MNT',v:Math.round(ch.mn||0)},
  ];
  const ov = document.getElementById('bpOv');
  if (!ov) return;
  ov.innerHTML = `<div class="bp-box">
    <button class="bp-close" onclick="closeBp()">✕</button>
    <div class="bp-img"><img src="${_getFullUrl(ch)}" style="${mirrorStyle}" onerror="this.style.display='none'"></div>
    <div class="bp-info">
      <div class="bp-header"><span class="bp-name">${escHtml(WM_I18N.pn(ch.name))}</span><span class="bp-role ${(ch.role||'neutral').toLowerCase()}">${ch.role||''}</span></div>
      <div class="bp-basics"><span class="bp-style">${escHtml(ch.style||'')}</span><div class="bp-meta">${age?`<span>${age}</span>`:''}<span>${ch.h||''}cm</span></div></div>
      <div class="bp-ovr"><span class="bp-ovr-label">OVR</span><span class="bp-ovr-val">${ovr}</span></div>
      <div class="bp-stats">${stats.map(s=>`<div class="bp-stat-row"><span class="bp-stat-name">${s.l}</span><div class="bp-stat-track"><div class="bp-stat-fill ${s.k}" style="width:${s.v}%"></div></div><span class="bp-stat-val">${s.v}</span></div>`).join('')}</div>
      <div class="bp-divider"></div>
      <div class="bp-details">
        <div class="bp-detail-item"><span class="bp-detail-label">${WM_I18N.t('現在HP')}</span><span class="bp-detail-value">${Math.max(0, Math.round(ch.hp))} / ${ch.mhp} (${hp.pct}%)</span></div>
        <div class="bp-detail-item"><span class="bp-detail-label">${WM_I18N.t('モメンタム')}</span><span class="bp-detail-value">${S.mom > 15 ? (side==='L'?WM_I18N.t('優勢'):WM_I18N.t('劣勢')) : S.mom < -15 ? (side==='L'?WM_I18N.t('劣勢'):WM_I18N.t('優勢')) : WM_I18N.t('互角')}</span></div>
      </div>
      ${ch.profile?`<div class="bp-divider"></div><div class="bp-profile"><div class="bp-profile-label">PROFILE</div><div class="bp-profile-text">${escHtml(WM_I18N.t(ch.profile))}</div></div>`:''}
      ${badges?`<div class="bp-badges">${badges}</div>`:''}
    </div>
  </div>`;
  ov.classList.add('show');
}
function closeBp(){ const ov = document.getElementById('bpOv'); if (ov) ov.classList.remove('show'); }

// ─── キーボードショートカット ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const bp = document.getElementById('bpOv');
    if (bp && bp.classList.contains('show')) { closeBp(); return; }
    const cu = document.getElementById('cutinOv');
    if (cu && cu.classList.contains('show')) { dismissCutin(); return; }
  }
  if (e.key === ' ' || e.key === 'Enter') {
    const bp = document.getElementById('bpOv');
    if (bp && bp.classList.contains('show')) return;
    const cu = document.getElementById('cutinOv');
    if (cu && cu.classList.contains('show')) { e.preventDefault(); dismissCutin(); return; }
    const btn = document.getElementById('nBtn');
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  }
});

// スピーチバブル タイマー管理
const _spTimers = {};
function _narrationHtml(nar){
  if (!nar || !nar.text) {
    return '<div class="wm-commentary-label">' + WM_I18N.t('実況') + '</div><div class="nar-empty">' + escHtml(WM_I18N.t('ゴング！　「次の攻防」で試合を進めてください')) + '</div>';
  }
  return `<div class="wm-commentary-label">${WM_I18N.t('実況')}</div><div class="nar-line nar-main show${nar.dramatic ? ' dramatic' : ''}">${escHtml(nar.text)}</div>`;
}

// i18n P7-9: \u5b9f\u6cc1\u30ca\u30ec\u30fc\u30b7\u30e7\u30f3\u306f\u300c\u30c6\u30f3\u30d7\u30ec+\u30d1\u30e9\u30e1\u30fc\u30bf\u300d\u3067t()\u3078\u6e21\u3059(\u00a79\u306e\u914d\u7dda\u898f\u7d04 \u2014
// \u30d7\u30ec\u30fc\u30b9\u30db\u30eb\u30c0\u3092\u7f6e\u63db\u3057\u305f\u5b8c\u6210\u6587\u3092t()\u3078\u6e21\u3059\u3068\u8f9e\u66f8\u30ad\u30fc(\u672a\u7f6e\u63db\u306e\u539f\u6587)\u3068\u4e00\u81f4\u305b\u305a
// fail-open\u3059\u308b)\u3002\u9078\u624b\u540d\u30fb\u6280\u540d\u306f**\u5024\u3068\u3057\u3066\u6e21\u3059\u3060\u3051\u3067\u3088\u3044**: t()\u306een\u30d6\u30e9\u30f3\u30c1\u304c
// \u540d\u524d\u8f9e\u66f8\u2192\u6280\u540d\u8f9e\u66f8\u306e\u9806\u306b\u5f15\u304d\u5f53\u3066\u308b(D-P6-2 / P7-5)\u3002ja \u3067\u306f applyParams \u306e
// {key} \u7f6e\u63db\u3060\u3051\u304c\u8d70\u308b\u306e\u3067\u3001\u5f93\u6765\u306e\u6587\u5b57\u5217\u9023\u7d50\u30681\u30d0\u30a4\u30c8\u540c\u4e00\u306b\u306a\u308b\u3002
function _narrateFrame(fr){
  if (!fr) return { text: '', dramatic: false };
  if (fr.winner) {
    if (S.pinSeqPending) return { text: '\u2026', dramatic: true };
    return { text: WM_I18N.t('\u6c7a\u7740\uff01'), dramatic: true };
  }

  const action = fr.action;
  // P7-53: action を持たないフレームは試合ログ行をそのまま実況ストリップへ出す。
  // 表示点なので言語別に組み直したテキストを使う(JAは1バイト同一)。
  if (!action) return { text: _logRecords(fr).map(_logRecordText).join(' '), dramatic: false };

  const atk = action.atkSide === 'left' ? S.L : S.R;
  const def = action.atkSide === 'left' ? S.R : S.L;
  if (!atk || !def) return { text: _mvFull(action.move) || '', dramatic: false };

  if (action.kind === 'miss') {
    return {
      text: WM_I18N.t('{atk}の{move}は空を切る！ {def}が間合いを外した。', { atk: atk.name, move: action.move || '', def: def.name }),
      dramatic: false,
    };
  }
  if (action.kind === 'counter') {
    return {
      text: WM_I18N.t('{atk}が待っていた！ {def}の攻めを読み、{move}で切り返す！', { atk: atk.name, def: def.name, move: action.counterMove || action.move || '' }),
      dramatic: true,
    };
  }

  return {
    text: action.isCrit
      ? WM_I18N.t('{atk}の{move}が深く入った！ {def}を大きく揺らす！', { atk: atk.name, move: action.move || '', def: def.name })
      : WM_I18N.t('{atk}が{move}！ {def}の体勢を崩していく。', { atk: atk.name, move: action.move || '', def: def.name }),
    dramatic: !!action.isCrit,
  };
}

function _updateMoveDetail(fr){
  const action = fr && fr.action;
  const meta = _movePresentation(action);
  const move = document.getElementById('moveV');
  if (move){ move.textContent = _mvDisp(_actionMoveName(action)); move.classList.remove('move-pop'); void move.offsetWidth; move.classList.add('move-pop'); }
  const category = document.getElementById('moveCatLabel');
  if (category) category.textContent = meta.label;
  const guide = document.getElementById('moveGuide');
  if (guide) guide.textContent = WM_I18N.t(meta.guide);
  const result = document.getElementById('moveResult');
  if (result){ result.textContent = _moveResultText(action); result.classList.toggle('big', !!(action && (action.isCrit || action.kind === 'counter'))); }
}

function _updateCenter(fr){
  const box = document.getElementById('centerPanel');
  if (!box) return;
  _updateMoveDetail(fr);
  const turn = document.getElementById('turnLbl');
  if (turn && fr) turn.textContent = `T${fr.turn}`;
  const pill = document.getElementById('pill');
  if (pill && fr) pill.textContent = fr.phase || '';
  const narration = document.getElementById('narBox');
  if (narration) narration.innerHTML = _narrationHtml(_narrateFrame(fr));
  _applyCamera();
}
