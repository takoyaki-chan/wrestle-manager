// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9: UI HELPERS & SHOW PREP (v0.85)                ║
// ╚══════════════════════════════════════════════════════════╝

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** ランキング画面 v0.9：OVR数字に階調クラスを返す（数字専用、団体スコアには使わない） */
function valueClassOvr(ovr) {
  const T = OVR_TIER_THRESHOLDS;
  if (ovr >= T.mythic)   return 'v-mythic';
  if (ovr >= T.eliteMid) return 'v-elite-mid';
  if (ovr >= T.elite)    return 'v-elite';
  if (ovr >= T.eliteLow) return 'v-elite-low';
  if (ovr >= T.high)     return 'v-high';
  if (ovr >= T.mid)      return 'v-mid';
  if (ovr >= T.low)      return 'v-low';
  return 'v-poor';
}

function _fmtStat(v) {
  if (typeof v !== 'number' || isNaN(v)) return v;
  return +v.toFixed(2);
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 画像+イニシャルフォールバック付きimgタグ生成。onerror時にイニシャル円を表示 */
function _imgOrInitial(url, charId, size, extraStyle = '') {
  const ch = ALL_CHARS.find(c => c.id === charId);
  const initial = ch ? ch.name.charAt(0) : '?';
  const STYLE_COLORS = {Grappler:'#bb8fce',Striker:'#e74c3c',Submission:'#e67e22',Aerial:'#2ecc71',Allround:'#f1c40f',Brawler:'#e88a82'};
  const col = ch ? (STYLE_COLORS[ch.style] || '#888') : '#888';
  const fallback = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${col}33,${col}11);font-size:${Math.round(size*0.35)}px;font-weight:900;color:${col};border-radius:8px;${extraStyle}">${initial}</div>`;
  if (!url) return fallback;
  return `<img src="${url}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;${extraStyle}" onerror="this.outerHTML=this.dataset.fb" data-fb='${fallback.replace(/'/g, "&#39;")}'>`;
}

/** 団体アイコン <img> タグ生成ヘルパー */
function orgIconHtml(orgId, size = 40) {
  const isPlayer = (orgId === 'player');
  const path = isPlayer ? Engine.util.getPlayerOrgIconPath(G) : Engine.util.getOrgIconPath(G, orgId);
  if (!path) return '';
  return `<img src="${path}" width="${size}" height="${size}" style="vertical-align:middle;margin-right:6px;border-radius:4px" alt="" loading="lazy">`;
}

// ── Popup Queue System ──────────────────────────────────────────────────
// ポップアップの重複表示を防止する。1つのポップアップが表示中は、
// 新しいポップアップをキューに入れて順番待ちさせる。
const _POPUP_OVERLAY_IDS = [
  'growthEventOverlay', 'eventPopupOverlay', 'retirementPopupOverlay',
  'rivalryPopupOverlay', 'newspaperOverlay', 'seasonFanfareOverlay',
  'milestoneOverlay', 'awardsOverlay', 'careModalOverlay', 'notifModalOverlay',
  'careOverlay', 'fighterPopupOverlay', 'coachTooltipOverlay', 'showResultOverlay',
  // 統一モーダル(Phase 0以降)
  'mdlAOverlay', 'mdlBOverlay', 'mdlCOverlay', 'mdlDOverlay'
];
let _popupQueue = [];

function _isPopupActive(opts) {
  const ignoreShowResultOverlay = !!(opts && opts.ignoreShowResultOverlay);
  // 静的オーバーレイ（index.htmlで定義済み）
  const staticActive = _POPUP_OVERLAY_IDS.some(id => {
    if (ignoreShowResultOverlay && id === 'showResultOverlay') return false;
    const el = document.getElementById(id);
    return el && (el.classList.contains('active') || el.classList.contains('show'));
  });
  if (staticActive) return true;
  // 動的オーバーレイ（R3Modalなど、DOMに直接追加されるもの）
  return !!document.querySelector('.r3-modal-overlay') || !!document.querySelector('.war-victory-overlay');
}

function _enqueuePopup(fn, opts) {
  if (_isPopupActive(opts)) {
    _popupQueue.push(fn);
  } else {
    fn();
  }
}

function _drainPopupQueue() {
  if (_popupQueue.length === 0) return;
  setTimeout(() => {
    if (!_isPopupActive() && _popupQueue.length > 0) {
      const next = _popupQueue.shift();
      next();
    }
  }, 200);
}

// ─────────────────────────────────────────────────────────────
// 統一モーダル mdl-a-* ヘルパー (Phase 1)
// 社長室型モーダル(A-1〜A-6)の共通パーツをまとめる。
// 派閥イベント(fevt-*)の _factionReporterStrip などを参考にしているが、
// クラス名は本番用 mdl-a-* に置き換えている。
// ─────────────────────────────────────────────────────────────

/** A型モーダルを開く */
function _mdlAOpen(html, opts) {
  const overlay = document.getElementById('mdlAOverlay');
  const card = document.getElementById('mdlACard');
  if (!overlay || !card) return false;
  card.className = ['mdl-a-card',
    opts && opts.dark   ? 'dark'   : '',
    opts && opts.narrow ? 'narrow' : '',
    opts && opts.wide   ? 'wide'   : '',
  ].filter(Boolean).join(' ');
  card.innerHTML = html;
  overlay.classList.add('active');
  return true;
}

/** A型ダーク版: 吹き出し遅延表示 + クリックで即時表示 */
function _mdlAAttachSpeechHandlers(overlay, card) {
  const speeches = card.querySelectorAll('.mdl-a-speech.delayed');
  const pendings  = card.querySelectorAll('.mdl-a-speech-pending');
  const tapHint   = card.querySelector('.mdl-a-tap-hint');
  if (!speeches.length) return;
  const showNow = (e) => {
    if (e && e.target === overlay) return;
    speeches.forEach(s => s.classList.add('show-now'));
    pendings.forEach(p => p.classList.add('hide'));
    if (tapHint) tapHint.classList.add('hide');
    card.removeEventListener('click', showNow);
  };
  card.addEventListener('click', showNow);
  setTimeout(() => {
    pendings.forEach(p => p.classList.add('hide'));
    if (tapHint) tapHint.classList.add('hide');
  }, 5000);
}

/** A型モーダルを閉じる */
function _mdlAClose() {
  const overlay = document.getElementById('mdlAOverlay');
  if (overlay) overlay.classList.remove('active');
}

/** A型ヘッダーHTML */
function _mdlAHeader(title, meta, opts) {
  const urgent = opts && opts.urgent ? ' urgent' : '';
  return `<div class="mdl-a-header${urgent}">
    <div class="mdl-a-header-title">${title || ''}</div>
    <div class="mdl-a-header-meta">${meta || ''}</div>
  </div>`;
}

/** A型 reporter-strip(コーチ or 古参選手の取次) */
function _mdlAReporterStrip(state, line) {
  let url = '', name = 'BLACKWELL COACH';
  if (typeof _factionPickReporter === 'function') {
    const pick = _factionPickReporter(state);
    if (pick && pick.kind === 'coach') {
      url = (typeof getCoachPortraitUrl === 'function') ? getCoachPortraitUrl(pick.ref.id) : '';
      name = `${String(pick.ref.name)} コーチ`;
    } else if (pick && pick.kind === 'veteran') {
      url = (typeof getUpperUrl === 'function') ? getUpperUrl(pick.ref.id) : '';
      name = String(pick.ref.name);
    }
  }
  const bg = url
    ? `background-image:url('${url}'),linear-gradient(135deg,#5a4a3a,#3a2d22);background-size:cover;background-position:center`
    : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
  return `<div class="mdl-a-reporter-strip">
    <div class="mdl-a-reporter-portrait" style="${bg}"></div>
    <div class="mdl-a-reporter-text">
      <div class="mdl-a-reporter-name">${name}</div>
      <div class="mdl-a-reporter-line">${String(line || '')}</div>
    </div>
  </div>`;
}

/** A型 季節ラベル */
function _mdlASeasonLabel(state) {
  const s = state || (typeof G !== 'undefined' ? G : {});
  const season = s.season || 1;
  const week = s.week || 1;
  return `WEEK ${String(week).padStart(2, '0')} ・ ${season}Y`;
}

// ─────────────────────────────────────────────────────────────
// 統一モーダル mdl-b-* ヘルパー (Phase 2)
// ステージ演出型(B-1〜B-5)の共通パーツ
// ─────────────────────────────────────────────────────────────

/** B型モーダルを開く。variant: 'default' | 'sepia' | 'rival' | 'gold' */
function _mdlBOpen(html, variant) {
  const overlay = document.getElementById('mdlBOverlay');
  if (!overlay) return false;
  overlay.className = 'mdl-b-overlay' + (variant && variant !== 'default' ? ' ' + variant : '');
  overlay.innerHTML = html;
  // 次フレームでactive化(トランジションを走らせる)
  void overlay.offsetWidth;
  overlay.classList.add('active');
  return true;
}

/** B型モーダルを閉じる */
function _mdlBClose() {
  const overlay = document.getElementById('mdlBOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    // 600ms後に中身をクリア(fadeOut完了後)
    setTimeout(() => { if (!overlay.classList.contains('active')) overlay.innerHTML = ''; }, 650);
  }
}

/** B型 タイトル帯。titleCls: clash|victory|rival|milestone|dissolve など */
function _mdlBTitleBand(title, titleCls, sub) {
  return `<div class="mdl-b-title-band">
    <div class="mdl-b-title-main${titleCls ? ' ' + titleCls : ''}">${title || ''}</div>
    <div class="mdl-b-title-divider"></div>
    ${sub ? `<div class="mdl-b-title-sub">${sub}</div>` : ''}
  </div>`;
}

/** B型 頭上吹き出し。variant: default|rival|gold|soft, size: 'large'|null */
function _mdlBSpeech(speaker, text, variant, size) {
  if (!text) return '';
  const v = variant && variant !== 'default' ? ' ' + variant : '';
  const sz = size === 'large' ? ' large' : '';
  return `<div class="mdl-b-speech${v}">
    ${speaker ? `<div class="mdl-b-speech-speaker">${speaker}</div>` : ''}
    <div class="mdl-b-speech-text${sz}">${text}</div>
  </div>`;
}

/** B型 選手カラム(対峙構図用)。side: 'left'|'right', speech: {speaker,text,variant} | null, flag: {cls,label} */
function _mdlBCol(fighter, opts) {
  opts = opts || {};
  const upperUrl = fighter && typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
  const imgHtml = upperUrl
    ? `<img class="mdl-b-upper" src="${upperUrl}" alt="" onerror="this.style.display='none'">`
    : '';
  const speech = opts.speech
    ? _mdlBSpeech(opts.speech.speaker, opts.speech.text, opts.speech.variant, opts.speech.size)
    : '';
  const flag = opts.flag
    ? `<div class="mdl-b-flag ${opts.flag.cls || 'a'}">${opts.flag.label}</div>`
    : '';
  const colCls = 'mdl-b-col' + (opts.side === 'right' ? ' right' : '');
  const nameMeta = fighter
    ? `<div class="mdl-b-name">${fighter.name || ''}</div>
       <div class="mdl-b-org">${opts.meta || `AGE ${fighter.age || '—'} ・ OVR ${(typeof Engine !== 'undefined' && Engine.util) ? Engine.util.ov(fighter) : ''}`}</div>`
    : '';
  return `<div class="${colCls}">
    ${flag}
    <div class="mdl-b-upper-wrap">
      ${speech}
      ${imgHtml}
    </div>
    ${nameMeta}
  </div>`;
}

/** B型 ソロステージ(1選手中央)。opts.sepia で sepia 影 */
function _mdlBSoloStage(fighter, speech, opts) {
  opts = opts || {};
  const upperUrl = fighter && typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
  const sizeStyle = opts.large ? 'style="width:300px;height:360px"' : '';
  const imgHtml = upperUrl
    ? `<img class="mdl-b-upper" src="${upperUrl}" alt="" ${sizeStyle} onerror="this.style.display='none'">`
    : '';
  const speechHtml = speech
    ? _mdlBSpeech(speech.speaker, speech.text, speech.variant, speech.size)
    : '';
  const stageCls = 'mdl-b-solo-stage' + (opts.sepia ? ' sepia' : '');
  const nameMeta = fighter
    ? `<div class="mdl-b-name" style="margin-top:16px${opts.sepia ? ';color:rgba(232,220,200,0.9)' : ''}">${fighter.name || ''}</div>
       <div class="mdl-b-org"${opts.sepia ? ' style="color:rgba(200,180,150,0.7)"' : ''}>${opts.meta || `AGE ${fighter.age || '—'} ・ OVR ${(typeof Engine !== 'undefined' && Engine.util) ? Engine.util.ov(fighter) : ''}`}</div>`
    : '';
  return `<div class="${stageCls}">
    <div class="mdl-b-upper-wrap">
      ${speechHtml}
      ${imgHtml}
    </div>
    ${nameMeta}
  </div>`;
}

/** B型 アクション行(ボタン群)。buttons: [{label, sub, primary, onclick}] */
function _mdlBActions(buttons) {
  return `<div class="mdl-b-decision">${buttons.map(b =>
    `<button class="mdl-b-btn${b.primary ? ' primary' : ''}"${b.id ? ` id="${b.id}"` : ''}>${b.label}${b.sub ? `<span class="mdl-b-btn-label">${b.sub}</span>` : ''}</button>`
  ).join('')}</div>`;
}

// ─────────────────────────────────────────────────────────────
// 統一モーダル mdl-c-* ヘルパー (Phase 3)
// 情報パネル型(C-1〜C-3)の共通パーツ
// ─────────────────────────────────────────────────────────────

/** C型モーダルを開く。opts.wide / opts.compact でカード幅変更 */
function _mdlCOpen(html, opts) {
  const overlay = document.getElementById('mdlCOverlay');
  const card    = document.getElementById('mdlCCard');
  if (!overlay || !card) return false;
  card.className = 'mdl-c-card' + (opts && opts.wide ? ' wide' : opts && opts.compact ? ' compact' : '');
  card.innerHTML = html;
  void overlay.offsetWidth;
  overlay.classList.add('active');
  return true;
}

/** C型モーダルを閉じる */
function _mdlCClose() {
  const overlay = document.getElementById('mdlCOverlay');
  if (overlay) overlay.classList.remove('active');
}

/** D型モーダルを開く — html を #mdlDBox に注入して表示 */
function _mdlDOpen(html) {
  const box = document.getElementById('mdlDBox');
  const overlay = document.getElementById('mdlDOverlay');
  if (!box || !overlay) return;
  box.innerHTML = html;
  overlay.classList.add('active');
}
/** D型モーダルを閉じる */
function _mdlDClose() {
  const overlay = document.getElementById('mdlDOverlay');
  if (overlay) overlay.classList.remove('active');
}

/** A型 subject-stage: 選手の上半身 + 名前 + メタ + 仕切り線
 *  opts.small: 120x160 (default 140x184)
 *  opts.speech: 頭上吹き出しに表示するセリフ(文字列)
 */
function _mdlASubjectStage(fighter, bodyHtml, opts) {
  const size = (opts && opts.small) ? { w: 120, h: 160 } : { w: 140, h: 184 };
  let portraitHtml = '';
  if (fighter) {
    const upperUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(fighter.id) : '';
    const faceUrl  = (typeof getPortraitUrl === 'function') ? getPortraitUrl(fighter.id) : '';
    const bg = upperUrl
      ? `background-image:url('${upperUrl}')`
      : (faceUrl ? `background-image:url('${faceUrl}')` : '');
    const speech = opts && opts.speech
      ? `<div class="mdl-a-speech"><div class="mdl-a-speech-text">${opts.speech}</div></div>`
      : '';
    const wrapCls = speech ? 'mdl-a-subject-portrait-speechable' : '';
    portraitHtml = `<div class="${wrapCls}">
      ${speech}
      <div class="mdl-a-subject-portrait-wrap" style="width:${size.w}px;height:${size.h}px;${bg}"></div>
    </div>`;
  }
  const meta = fighter
    ? `AGE ${fighter.age || '—'} ・ OVR ${(typeof Engine !== 'undefined' && Engine.util) ? Engine.util.ov(fighter) : ''} ・ ${String(fighter.style || '').toUpperCase() || 'FIGHTER'}`
    : '';
  return `<div class="mdl-a-subject-stage">
    ${portraitHtml}
    ${fighter ? `<div class="mdl-a-subject-name">${fighter.name || ''}</div>` : ''}
    ${fighter ? `<div class="mdl-a-subject-org">${meta}</div>` : ''}
    <div class="mdl-a-subject-divider"></div>
    ${bodyHtml || ''}
  </div>`;
}

document.addEventListener('click', (event) => {
  const closeBtn = event.target.closest('.pb-close-btn, .sr-close-btn');
  if (!closeBtn) return;
  // JT進行中は干渉しない（JTボタンはonclickで直接処理する）
  if (App._jtPreview) return;
  event.preventDefault();
  event.stopPropagation();
  try {
    closeShowResult();
  } catch (e) {
    console.error('[WM] delegated closeShowResult failed:', e);
    try {
      if (typeof App !== 'undefined' && typeof App.closeShowResult === 'function') {
        App.closeShowResult();
      }
    } catch (inner) {
      console.error('[WM] App.closeShowResult fallback failed:', inner);
    }
  }
});

// MutationObserverで全オーバーレイのclass変更を監視し、閉じたら自動でキュー処理
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    if (!_isPopupActive() && _popupQueue.length > 0) _drainPopupQueue();
  });
  _POPUP_OVERLAY_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
});

// ── Custom Tooltip (PC hover + mobile tap) ───────────────
function showCustomTooltip(el, html) {
  const tip = document.getElementById('customTooltip');
  tip.innerHTML = html;
  tip.style.display = 'block';
  const rect = el.getBoundingClientRect();
  const tipW = tip.offsetWidth || 250;
  let left = rect.left + rect.width / 2 - tipW / 2;
  if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
  if (left < 8) left = 8;
  let top = rect.top + rect.height / 2 - tip.offsetHeight / 2;
  if (top + tip.offsetHeight > window.innerHeight - 8) top = window.innerHeight - 8 - tip.offsetHeight;
  tip.style.left = left + 'px';
  tip.style.top = Math.max(8, top) + 'px';
}
function hideCustomTooltip() {
  const tip = document.getElementById('customTooltip');
  if (tip) tip.style.display = 'none';
}
// Global tap-outside hides tooltip
document.addEventListener('click', hideCustomTooltip);

// ── War Challenge Dialogue Generator (personality×archetype) ──
function getWarChallengeDialogue(fighter, orgName) {
  if (typeof WAR_CHALLENGER_DIALOGUE !== 'undefined') {
    return pickDialogueLine(WAR_CHALLENGER_DIALOGUE, fighter);
  }
  return '…挑戦状を叩きつける';
}

// ── War Challenge Popup (F3: president delivers the challenge) ──
function showWarChallenge() {
  const ev = G.pendingEvent;
  if (!ev || ev.type !== 'war') return;
  Audio.play('war');

  try { Audio.fileBgm.play('../bgm/MusMus-BGM-125.mp3', { loop: true, volume: 0.10 }); } catch(e) {}

  const aiOrg = Engine.rival.getOrgInfo(G.aiOrgs, ev.opponentOrgId);
  if (!aiOrg) { skipEvent(); return; }

  const enemyAce = Engine.event.getAce(aiOrg.roster);
  if (!enemyAce) { skipEvent(); return; }

  const aceOvr = Engine.util.ov(enemyAce);
  const dialogue = getWarChallengeDialogue(enemyAce, G.orgName || 'あんたの団体');
  const dialogueHtml = dialogue.replace(/\n/g, '<br>');
  const upperUrl = getUpperUrl(enemyAce.id);
  const portraitStyle = upperUrl
    ? `background-image:url('${upperUrl}')`
    : `background:linear-gradient(135deg,#3a2820,#1a1208)`;
  const seasonMeta = `FROM ${(ev.opponentName || '').toUpperCase()} ・ ${ev.matchCount}試合`;

  const html =
    `<div class="mdl-a-header danger">
      <div class="mdl-a-header-title">📜 対 抗 戦 ・ 挑 戦 状</div>
      <div class="mdl-a-header-meta">${seasonMeta}</div>
    </div>
    ${_mdlAReporterStrip(G, `${ev.opponentName}から正式な対抗戦の申し入れが届きました`)}
    <div class="mdl-a-subject-stage danger" style="padding-top:88px">
      <div class="mdl-a-portrait-wrap">
        <div class="mdl-a-speech-pending">…</div>
        <div class="mdl-a-speech danger delayed">
          <div class="mdl-a-speech-speaker">${enemyAce.name.toUpperCase()}</div>
          <div class="mdl-a-speech-text large">${dialogueHtml}</div>
        </div>
        <div class="mdl-a-subject-portrait big danger" style="${portraitStyle}"></div>
      </div>
      <div class="mdl-a-subject-name danger">${enemyAce.name}</div>
      <div class="mdl-a-subject-org danger">${ev.opponentName} ・ ACE</div>
      <div class="mdl-a-subject-ovr danger"><span class="label">OVR</span>${aceOvr}</div>
      <div class="mdl-a-subject-divider"></div>
      <div class="mdl-a-observation"><span class="marker danger">${ev.matchCount}試合の団体対決</span>。敗北はランクにも影響します。</div>
    </div>
    <div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
    <div class="mdl-a-prompt">この挑戦、どう受けますか？</div>
    <div class="mdl-a-decision-tray two">
      <div class="mdl-a-decision-card danger-accent" data-war-choice="accept">
        <div class="mdl-a-decision-letter">⚔ 受けて立つ</div>
        <div class="mdl-a-decision-label">対抗戦を受諾する</div>
        <div class="mdl-a-decision-hint">試合カード編成へ進む</div>
      </div>
      <div class="mdl-a-decision-card" data-war-choice="decline">
        <div class="mdl-a-decision-letter">辞退</div>
        <div class="mdl-a-decision-label">今回は見送る</div>
        <div class="mdl-a-decision-hint negative">団体評価↓ ／ 関係悪化</div>
      </div>
    </div>`;

  _mdlAOpen(html, { dark: true, narrow: true });

  const overlay = document.getElementById('mdlAOverlay');
  const card    = document.getElementById('mdlACard');
  _mdlAAttachSpeechHandlers(overlay, card);

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-war-choice]');
    if (!btn) return;
    _mdlAClose();
    if (btn.dataset.warChoice === 'accept') acceptWarChallenge();
    else skipEvent();
  });
}

// ── Accept War: open match preview (like show) ──
function acceptWarChallenge() {
  const ev = G.pendingEvent;
  if (!ev || ev.type !== 'war') return;
  Audio.play('war');

  // Build card
  const card = Engine.event.makeWarCard(G, ev.opponentOrgId);
  if (card.length === 0) { skipEvent(); return; }

  // Close challenge popup, open match preview
  document.getElementById('confirmOverlay').classList.remove('active');
  App.initWarPreview(ev, card);
}

// ── War Match Preview Renderer ──
/** 対抗戦ヘッダー共通（試合進行・結果で再利用） */
function _rgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function _lightenColor(hex) {
  const r = Math.min(255, parseInt(hex.slice(1,3),16) + 60);
  const g = Math.min(255, parseInt(hex.slice(3,5),16) + 60);
  const b = Math.min(255, parseInt(hex.slice(5,7),16) + 60);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
// ── 6段階カラースケール ──
const _SCALE6 = ['#f0d078','#d4a843','#c4853a','#b89870','#8090a8','#607080'];
const _SCALE6_RIVALRY = ['#c44040','#c46040','#c48040','#b89870','#8090a8','#607080'];
function _scale6(v, thresholds, palette) {
  const p = palette || _SCALE6;
  for (let i = 0; i < thresholds.length; i++) {
    if (v >= thresholds[i]) return { color: p[i], glow: i === 0 };
  }
  return { color: p[5], glow: false };
}
function _scale6Style(sc) {
  return `color:${sc.color}${sc.glow ? ';text-shadow:0 0 6px #f0d07880' : ''}`;
}
function _mqColor(v)      { return _scale6(v, [80,70,60,50,40]); }
function _ovrColor(v)     { return _scale6(v, [85,75,65,55,45]); }
function _trustColor(v)   { return _scale6(v, [80,65,50,35,20]); }
function _condColor(v)    { return _scale6(v, [90,75,60,45,30]); }
function _popColor(v)     { return _scale6(v, [70,55,40,28,15]); }
function _bondColor(v)    { return _scale6(v, [80,65,50,35,20]); }
function _rivalryColor(v) { return _scale6(v, [70,50,35,20,5], _SCALE6_RIVALRY); }
function _orgPopColor(v)  { return _scale6(v, [70,55,40,25,12]); }
/** 対抗戦ステータスバー行 */
function _warStatRow(label, lv, rv, cls, pColor, eColor) {
  const bwL = Math.max(4, Math.round(lv));
  const bwR = Math.max(4, Math.round(rv));
  const dlv = Math.round(lv), drv = Math.round(rv);
  return `<div class="war-sr">
    <div class="war-sbl"><span class="war-sv"${lv>rv?` style="color:${pColor}"`:''}">${dlv}</span><div class="war-bt"><div class="war-bf ${cls}" style="width:${bwL}%"></div></div></div>
    <div class="war-sl">${label}</div>
    <div class="war-sbr"><div class="war-bt"><div class="war-bf ${cls}" style="width:${bwR}%"></div></div><span class="war-sv"${rv>lv?` style="color:${eColor}"`:''}">${drv}</span></div>
  </div>`;
}

function renderWarMatchPreview() {
  const wp = App._warPreview;
  if (!wp) return;
  const ev = wp.ev;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  const orgCfg = RIVAL_ORGS.find(o => o.id === ev.opponentOrgId) || {color:'#e74c3c', emoji:''};
  const eColor = orgCfg.color;

  const resolved = wp.results.filter(r => r !== null).length;
  const total = wp.card.length;
  let playerWins = 0, aiWins = 0;
  wp.results.forEach(r => { if (r) { if (r.playerWon) playerWins++; else aiWins++; } });

  let nextIdx = -1;
  for (let i = 0; i < total; i++) { if (wp.results[i] === null) { nextIdx = i; break; } }

  const statusText = playerWins > aiWins ? '勝ち越し中' : playerWins === aiWins ? (resolved > 0 ? 'タイ' : '試合開始') : '負け越し中';
  const statusColor = playerWins > aiWins ? 'var(--c-info)' : playerWins === aiWins ? 'var(--stage-text-sub)' : 'var(--c-negative)';
  const nextMatch = nextIdx >= 0 ? wp.card[nextIdx] : null;
  const nextLabel = nextMatch ? `${nextMatch.playerFighter.name} vs ${nextMatch.aiFighter.name}` : '—';

  const tierLabel = orgCfg.tier === 'S' ? 'Sランク王者' : orgCfg.tier === 'A' ? 'Aランク挑戦者' : 'Bランク';
  const playerOrgName = G.orgName || 'プレイヤー団体';

  let html = `<div class="pb-container" style="--pb-enemy-color:${eColor}">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-war">⚔ WAR</div>
    <div class="pb-banner-title is-war">対 抗 戦</div>
    <div class="pb-banner-sub">${escHtml(playerOrgName)}<span class="dot">·</span>vs<span class="dot">·</span>${escHtml(orgCfg.emoji || '')} ${escHtml(ev.opponentName)}<span class="dot">·</span>${escHtml(tierLabel)}</div>
  </div>`;

  // Scoreboard: Score / Status / Remaining / Next
  html += `<div class="pb-score-strip" style="grid-template-columns:1.2fr 1fr 1fr 1.6fr">
    <div class="pb-score-cell">
      <div class="pb-score-val"><span style="color:var(--c-info)">${playerWins}</span><span style="color:var(--stage-text-dim);margin:0 8px">—</span><span style="color:${eColor}">${aiWins}</span></div>
      <div class="pb-score-lbl">Score</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:${statusColor};font-size:18px">${escHtml(statusText)}</div>
      <div class="pb-score-lbl">Status</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val is-neutral">${total - resolved}<span style="font-size:14px;color:var(--stage-text-dim)"> / ${total}</span></div>
      <div class="pb-score-lbl">Remaining</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="font-size:14px;color:var(--stage-text-main)">${escHtml(nextLabel)}</div>
      <div class="pb-score-lbl">Next</div>
    </div>
  </div>`;

  // Matches: メイン → 前座
  html += `<div class="pb-matches">`;
  let shownMainLabel = false;
  let shownUndercardLabel = false;

  for (let di = total - 1; di >= 0; di--) {
    const idx = di;
    const m = wp.card[idx];
    const pf = m.playerFighter;
    const af = m.aiFighter;
    const result = wp.results[idx];
    const isResolved = result !== null;
    const isNext = idx === nextIdx;
    const isPending = !isResolved && !isNext;
    const matchNum = idx + 1;
    const isMain = idx === total - 1;

    if (isMain && !shownMainLabel) {
      html += `<div class="pb-divider is-main">⚔ MAIN — 第 ${matchNum} 試合</div>`;
      shownMainLabel = true;
    } else if (!isMain && !shownUndercardLabel && shownMainLabel) {
      html += `<div class="pb-divider">UNDERCARD</div>`;
      shownUndercardLabel = true;
    }

    if (isResolved) {
      const playerWon = result.playerWon;
      const leftCls = playerWon ? 'is-winner' : 'is-loser';
      const rightCls = playerWon ? 'is-loser' : 'is-winner';
      const leftLine = (playerWon && result.victoryLine) ? result.victoryLine : '';
      const rightLine = (!playerWon && result.victoryLine) ? result.victoryLine : '';
      const hasDialogue = !!result.victoryLine;

      const leftBlock = _pbFighterBlock('left', pf, leftCls, playerOrgName, leftLine)
        .replace('pb-fighter is-left', 'pb-fighter is-left is-player-side');
      const rightBlock = _pbFighterBlock('right', af, rightCls, ev.opponentName, rightLine)
        .replace('pb-fighter is-right', 'pb-fighter is-right is-enemy-side');
      const winnerLabel = `🏆 ${escHtml(playerWon ? pf.name : af.name)} WIN`;

      html += `<div class="pb-mrow is-resolved${hasDialogue ? ' has-dialogue' : ''}">`;
      html += leftBlock;
      html += _pbResultColumn({
        winnerLabel,
        winnerIsDraw: false,
        finishText: Engine.formatFinish(result.finType, result.finMove),
        turns: result.turns || 0,
        mq: result.mq
      });
      html += rightBlock;
      html += `</div>`;
    } else if (isNext) {
      const lineL = pickDialogueLine(PPV_OPPONENT_LINES, pf);
      const lineR = pickDialogueLine(PPV_OPPONENT_LINES, af);
      const hasDialogue = !!(lineL || lineR);

      const leftBlock = _pbFighterBlock('left', pf, '', playerOrgName, lineL || '')
        .replace('pb-fighter is-left', 'pb-fighter is-left is-player-side');
      const rightBlock = _pbFighterBlock('right', af, '', ev.opponentName, lineR || '')
        .replace('pb-fighter is-right', 'pb-fighter is-right is-enemy-side');

      html += `<div class="pb-mrow is-upcoming${hasDialogue ? ' has-dialogue' : ''}">`;
      html += leftBlock;
      html += `<div class="pb-result">
        <div class="pb-result-vs">VS</div>
        <div class="pb-result-winner" style="color:var(--c-rivalry);font-size:18px">第 ${matchNum} 試合</div>
        <div class="pb-result-finish sub" style="color:var(--stage-text-sub)">次の試合</div>
      </div>`;
      html += rightBlock;
      html += `<div class="pb-war-actions">
        <button type="button" class="pb-war-btn is-watch" onclick="App.warWatchMatch(${idx})">🎬 試合を観る</button>
        <button type="button" class="pb-war-btn is-skip" onclick="App.warSkipMatch(${idx})">≫ スキップ</button>
      </div>`;
      html += `</div>`;
    } else if (isPending) {
      html += `<div class="pb-mrow is-pending"><div class="pb-pending-text">第${matchNum}試合 — ${escHtml(pf.name)} vs ${escHtml(af.name)}</div></div>`;
    }
  }
  html += `</div>`; // .pb-matches

  // Skip all
  const remaining = wp.results.filter(r => r === null).length;
  if (remaining > 1) {
    html += `<div class="pb-war-skipall"><button type="button" onclick="App.warSkipAll()">残り全試合をスキップ（${remaining}試合）</button></div>`;
  }

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── Post-War Dialogue Generator (personality×archetype) ──
function getWarPostDialogue(fighter, orgName, eventWon, playerWins, aiWins) {
  if (typeof WAR_POST_DIALOGUE !== 'undefined') {
    const sub = eventWon ? WAR_POST_DIALOGUE.result_lose : WAR_POST_DIALOGUE.result_win;
    return pickDialogueLine(sub, fighter);
  }
  return eventWon ? '…次はこうはいかない' : '…当然の結果だ';
}

// ── War Final Result Overlay (with post-match dialogue) ──
function renderWarFinalResult(ev, results, playerWins, aiWins, eventWon) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  // 勝利したプレイヤー選手を記録（結果画面クローズ後のポップアップ用）
  _warVictoryWinners = eventWon
    ? results.filter(r => r.playerWon).map(r => r.playerFighter)
    : [];

  const orgCfg = RIVAL_ORGS.find(o => o.id === ev.opponentOrgId) || {color:'#e74c3c', emoji:''};

  // 結果画面クローズ後に表示する敵エースモーダル用の文脈を保持
  _warPostCtx = { ev, orgCfg, eventWon, playerWins, aiWins };
  const eColor = orgCfg.color;
  const total = results.length;
  const validResults = results.filter(r => r);
  const avgMQ = validResults.length > 0 ? Math.round(validResults.reduce((s, r) => s + r.mq, 0) / validResults.length) : 0;
  const heat = getHeatLevel();
  const heatFooterCls = (heat.id === 'hot' || heat.id === 'on_fire') ? 'is-hot' :
                       (heat.id === 'cold' || heat.id === 'ice_cold') ? 'is-cold' : '';

  // Find enemy ace for dialogue
  const aiOrg = Engine.rival.getOrgInfo(G.aiOrgs, ev.opponentOrgId);
  const enemyAce = aiOrg ? Engine.event.getAce(aiOrg.roster) : (results[0] ? results[0].aiFighter : null);
  _warPostCtx.enemyAce = enemyAce;

  // 勝敗ラベル + 色
  let verdictLabel, verdictColor;
  if (playerWins > aiWins) { verdictLabel = '🏆 勝ち越し'; verdictColor = 'var(--gold)'; }
  else if (playerWins === aiWins) { verdictLabel = '⚖ 引き分け'; verdictColor = 'var(--c-warning)'; }
  else { verdictLabel = '💀 負け越し'; verdictColor = 'var(--c-negative)'; }

  const tierLabel = orgCfg.tier === 'S' ? 'Sランク王者' : orgCfg.tier === 'A' ? 'Aランク挑戦者' : 'Bランク';
  const playerOrgName = G.orgName || 'プレイヤー団体';

  let html = `<div class="pb-container" style="--pb-enemy-color:${eColor}">`;

  // Banner
  html += `<div class="pb-banner">
    <div class="pb-live is-war">⚔ WAR</div>
    <div class="pb-banner-title is-war">対 抗 戦 結 果</div>
    <div class="pb-banner-sub">${escHtml(playerOrgName)}<span class="dot">·</span>vs<span class="dot">·</span>${escHtml(orgCfg.emoji || '')} ${escHtml(ev.opponentName)}<span class="dot">·</span>${escHtml(tierLabel)}</div>
  </div>`;

  // Scoreboard: Score / Verdict / Avg MQ / Heat
  html += `<div class="pb-score-strip" style="grid-template-columns:1.2fr 1fr 1fr 1fr">
    <div class="pb-score-cell">
      <div class="pb-score-val"><span style="color:var(--c-info)">${playerWins}</span><span style="color:var(--stage-text-dim);margin:0 8px">—</span><span style="color:${eColor}">${aiWins}</span></div>
      <div class="pb-score-lbl">Score</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:${verdictColor};font-size:20px">${verdictLabel}</div>
      <div class="pb-score-lbl">Result</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(avgMQ)}</div>
      <div class="pb-score-val" style="margin-top:3px">${avgMQ}</div>
      <div class="pb-score-lbl">Avg MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" ${heatFooterCls === 'is-hot' ? 'style="color:var(--c-rivalry)"' : heatFooterCls === 'is-cold' ? 'style="color:var(--c-info)"' : 'class="is-neutral"'}>${escHtml(heat.label.toUpperCase())}</div>
      <div class="pb-score-lbl">Heat</div>
    </div>
  </div>`;

  // Flavor
  if (eventWon) {
    html += `<div class="pb-war-flavor"><em>${escHtml(tierLabel)}・${escHtml(ev.opponentName)}に勝利！</em>団体の格が上がった。</div>`;
  } else if (playerWins < aiWins) {
    html += `<div class="pb-war-flavor">${escHtml(tierLabel)}・${escHtml(ev.opponentName)}に敗北…悔しさをバネに這い上がれ。</div>`;
  }

  // Matches: メイン→降順
  html += `<div class="pb-matches">`;
  for (let di = total - 1; di >= 0; di--) {
    const r = results[di];
    if (!r) continue;
    const isMain = di === total - 1;
    const matchNum = di + 1;

    if (isMain) {
      html += `<div class="pb-divider is-main">⚔ MAIN — 第 ${matchNum} 試合</div>`;
    } else if (di === total - 2) {
      html += `<div class="pb-divider">UNDERCARD</div>`;
    }

    const pf = r.playerFighter;
    const af = r.aiFighter;
    const playerWon = r.playerWon;
    const leftCls = playerWon ? 'is-winner' : 'is-loser';
    const rightCls = playerWon ? 'is-loser' : 'is-winner';
    // 左: プレイヤー / 右: 敵
    // side accent classes
    const leftBlock = _pbFighterBlock('left', pf, `${leftCls}`, playerOrgName, r.victoryLine && playerWon ? r.victoryLine : '')
      .replace('pb-fighter is-left', 'pb-fighter is-left is-player-side');
    const rightBlock = _pbFighterBlock('right', af, `${rightCls}`, ev.opponentName, r.victoryLine && !playerWon ? r.victoryLine : '')
      .replace('pb-fighter is-right', 'pb-fighter is-right is-enemy-side');

    const winnerLabel = `🏆 ${escHtml(playerWon ? pf.name : af.name)} WIN`;
    const hasDialogue = !!r.victoryLine;
    const rowCls = `pb-mrow${isMain ? ' is-main' : ''}${hasDialogue ? ' has-dialogue' : ''}`;

    html += `<div class="${rowCls}">`;
    html += leftBlock;
    html += _pbResultColumn({
      winnerLabel,
      winnerIsDraw: false,
      finishText: Engine.formatFinish(r.finType, r.finMove),
      turns: r.turns || 0,
      mq: r.mq
    });
    html += rightBlock;
    if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
    html += `</div>`;
  }
  html += `</div>`; // .pb-matches

  // 敵エースセリフは結果画面クローズ後の単独モーダルで表示（_showWarEnemyAceStatement）

  // Footer
  html += `<div class="pb-footer">
    <div class="pb-footer-heat">Heat<span class="val ${heatFooterCls}">${heat.emoji} ${escHtml(heat.label.toUpperCase())}</span></div>
    <button type="button" class="pb-close-btn" onclick="closeWarFinalResult(${eventWon})">閉じる</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

let _warVictoryWinners = [];
let _warPostCtx = null;

function _getWarVictoryLine(fighter) {
  const p = fighter.personality || 'normal';
  const a = fighter.archetype || '_default';
  const table = WAR_VICTORY_LINES[p] || WAR_VICTORY_LINES.normal;
  const lines = table[a] || table._default || WAR_VICTORY_LINES.normal._default;
  return lines[Math.floor(Math.random() * lines.length)];
}

function _showWarVictoryChain(list, idx, onDone) {
  if (idx >= list.length) { if (onDone) onDone(); return; }
  const w = list[idx];
  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay';
  const portraitUrl = getPortraitUrl(w.id);
  const line = _getWarVictoryLine(w);
  overlay.innerHTML = `
    <div class="war-victory-modal">
      <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);margin:0 auto 12px;box-shadow:0 0 20px rgba(212,168,83,0.15)">
        ${_imgOrInitial(portraitUrl, w.id, 80, 'border-radius:50%;')}
      </div>
      <div class="war-victory-name">${w.name}</div>
      <div class="war-victory-line">「${line}」</div>
      <button class="war-victory-close">▶</button>
    </div>
  `;
  overlay.querySelector('.war-victory-close').addEventListener('click', () => {
    overlay.remove();
    _showWarVictoryChain(list, idx + 1, onDone);
  });
  document.body.appendChild(overlay);
  Audio.play('notify');
}

function _showWarEnemyAceStatement(onDone) {
  const ctx = _warPostCtx;
  if (!ctx || !ctx.enemyAce) { if (onDone) onDone(); return; }
  const { ev, orgCfg, eventWon, playerWins, aiWins, enemyAce } = ctx;
  const playerOrgName = G.orgName || 'プレイヤー団体';
  const dialogue = getWarPostDialogue(enemyAce, playerOrgName, eventWon, playerWins, aiWins);
  const upperUrl = getUpperUrl(enemyAce.id);
  const dialogueHtml = escHtml(dialogue).replace(/\n/g, '<br>');
  const eColor = orgCfg.color || '#e74c3c';

  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay war-ace-overlay';
  overlay.style.setProperty('--pb-enemy-color', eColor);
  overlay.innerHTML = `
    <div class="war-ace-modal pb-container" style="--pb-enemy-color:${eColor}">
      <div class="pb-ace-area" style="margin-top:0">
        <div class="pb-ace-label">${escHtml(ev.opponentName)} — Ace Statement</div>
        <div class="pb-ace-portrait-wrap">
          <div class="pb-ace-portrait${eventWon ? ' is-defeated' : ''}">
            ${upperUrl ? `<img src="${upperUrl}" alt="${escHtml(enemyAce.name)}" onerror="this.style.display='none'">` : ''}
          </div>
          <div class="pb-ace-name">${escHtml(enemyAce.name)}</div>
        </div>
        <div class="pb-ace-speech">
          <div class="pb-ace-speaker">${escHtml(ev.opponentName)}エース — ${escHtml(enemyAce.name)}</div>
          <div class="pb-ace-bubble">「${dialogueHtml}」</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="war-victory-close war-ace-close" type="button">▶</button>
      </div>
    </div>
  `;
  overlay.querySelector('.war-ace-close').addEventListener('click', () => {
    overlay.remove();
    if (onDone) onDone();
  });
  document.body.appendChild(overlay);
  Audio.play('notify');
}

function closeWarFinalResult(eventWon) {
  const closeToken = (typeof App !== 'undefined' && typeof App._beginWarUiTransition === 'function')
    ? App._beginWarUiTransition()
    : null;
  const isCurrent = () => (
    typeof App === 'undefined' ||
    typeof App._isWarUiTokenCurrent !== 'function' ||
    App._isWarUiTokenCurrent(closeToken)
  );
  if (eventWon) { Audio.bgm.playJingle('victory'); }
  else { Audio.play('defeat'); }

  const revealManageScreen = () => {
    if (!isCurrent()) return;
    const overlay = document.getElementById('showResultOverlay');
    if (overlay) overlay.classList.remove('active');
    refreshAll();
  };

  const finishWithEnemyAce = () => {
    if (!isCurrent()) return;
    _showWarEnemyAceStatement(() => {
      if (!isCurrent()) return;
      App.restoreBgmForState();
    });
  };

  // 勝利選手のセリフポップアップチェーン → 敵エースの一言モーダル
  if (eventWon && _warVictoryWinners.length > 0) {
    setTimeout(() => {
      if (!isCurrent()) return;
      revealManageScreen();
      _showWarVictoryChain(_warVictoryWinners, 0, finishWithEnemyAce);
    }, 2000);
  } else {
    setTimeout(() => {
      if (!isCurrent()) return;
      revealManageScreen();
      finishWithEnemyAce();
    }, eventWon ? 2000 : 500);
  }
}

// ── R3 モーダル: 仲良し退団/引退演出 ──
function showR3Modal({ fighterName, fighterFace, departedName, reason, line }) {
  if (_isPopupActive()) { _popupQueue.push(() => showR3Modal({ fighterName, fighterFace, departedName, reason, line })); return; }

  const isRetired = reason && (reason.includes('引退') || reason === 'retired');
  const departureText = isRetired
    ? `${departedName} が引退した。`
    : `${departedName} が去った。`;

  const faceHtml = fighterFace
    ? `<div class="mdl-d-face" style="background-image:url('${fighterFace}')"></div>`
    : '';

  _mdlDOpen(`
    ${faceHtml}
    <div class="mdl-d-speaker">${fighterName}</div>
    <div class="mdl-d-body">${departureText}</div>
    <div class="mdl-d-body italic">${line}</div>
    <div class="mdl-d-actions">
      <button class="mdl-d-btn primary" onclick="_mdlDClose();_drainPopupQueue()">閉じる</button>
    </div>
  `);
}

function showConfirm(msg, yesLabel, onYes) {
  Audio.play('notify');
  window._confirmYes = onYes;
  _mdlDOpen(`
    <div class="mdl-d-title">確認</div>
    <div class="mdl-d-body">${msg}</div>
    <div class="mdl-d-actions">
      <button class="mdl-d-btn primary" onclick="_mdlDClose();if(window._confirmYes)window._confirmYes()">${yesLabel}</button>
      <button class="mdl-d-btn secondary" onclick="_mdlDClose()">いいえ</button>
    </div>
  `);
}

function showRosterOverflowSigningModal(pending) {
  if (!pending) return;
  const fighter = pending.fighter || {};
  const releaseCandidates = (G.roster || []).filter(c => !c.isRental && !c.lastRun);
  const sourceLabel = pending.source === 'negotiation' ? '交渉成立選手' : '加入予定選手';

  const fighterBlock = `
    <div style="background:rgba(255,255,255,0.5);border:1px solid rgba(100,85,50,0.15);border-radius:6px;padding:10px 14px;margin:10px auto 12px;max-width:460px;text-align:center">
      <div style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-bottom:4px">${sourceLabel}</div>
      <div style="font-size:16px;font-weight:700;color:var(--cream-text-main);margin-bottom:4px">${fighter.name || '選手'}</div>
      <div style="font-size:12px;color:var(--cream-text-sub)">OVR ${Engine.util.ov(fighter || {})} ・ ${fighter.age || '?'}歳 ・ 契約金 ${pending.cost || 0}万</div>
    </div>`;

  let candidatesHtml = '';
  if (releaseCandidates.length === 0) {
    candidatesHtml = `<div class="mdl-a-observation centered" style="color:var(--accent-negative);font-size:13px">解雇できる所属選手がいません。</div>`;
  } else {
    candidatesHtml += `<div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin:12px 0 8px">RELEASE ・ 解 雇 す る 選 手</div>`;
    candidatesHtml += `<div style="display:grid;gap:6px;max-height:280px;overflow-y:auto;padding:0 8px">`;
    releaseCandidates.forEach(c => {
      candidatesHtml += `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 12px;border-radius:4px;background:rgba(255,255,255,0.35);border:1px solid rgba(100,85,50,0.15)">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--cream-text-main)">${c.name}</div>
          <div style="font-size:11px;color:var(--cream-text-sub)">OVR ${ov(c)} ・ ${c.age || '?'}歳</div>
        </div>
        <button class="mdl-a-continue-btn" style="padding:6px 12px;font-size:11px;letter-spacing:2px;background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)" onclick="confirmRosterOverflowSigning(${c.id})">解雇して契約</button>
      </div>`;
    });
    candidatesHtml += `</div>`;
  }

  const stageBody = `
    <div class="mdl-a-observation centered" style="font-size:14px;line-height:1.9;max-width:460px">
      新契約を結ぶと、<span class="marker">ロスター定員を超過</span>します。<br>
      既存選手の１名と契約を解除する必要があります。
    </div>
    ${fighterBlock}
    ${candidatesHtml}
  `;

  const html = `
    ${_mdlAHeader('⚠ ロスター超過のお知らせ', `URGENT ・ ${_mdlASeasonLabel(G)}`, { urgent: true })}
    ${_mdlAReporterStrip(G, '社長、判断をお願いします')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-bottom:22px">
      <button class="mdl-a-continue-btn" onclick="cancelRosterOverflowSigning()">— 契約を見送る —</button>
    </div>
  `;

  if (!_mdlAOpen(html, { narrow: true })) return;
  Audio.play('notify');
}

function confirmRosterOverflowSigning(releaseId) {
  _mdlAClose();
  App.confirmRosterOverflowSigning(releaseId);
}

function cancelRosterOverflowSigning() {
  _mdlAClose();
  App.cancelRosterOverflowSigning();
}

// ── F2: Negotiation Popup ──
function showNegotiatePopup(orgId, fighterId) {
  Audio.play('hover');
  const orgCfg = RIVAL_ORGS.find(o => o.id === orgId);
  const orgData = G.aiOrgs && G.aiOrgs[orgId];
  if (!orgCfg || !orgData) return;
  const fighter = orgData.roster.find(f => f.id === fighterId);
  if (!fighter) return;

  // trust拒否チェック（門前払い）
  if (Engine.negotiate.isNegotiationBlocked(fighter)) {
    const dialogue = Engine.negotiate.getDialogue(fighter, 'blocked');
    showConfirm(
      `${fighter.name}は今の団体に強い忠誠を抱いており、交渉に応じません。<br><br>「${dialogue.replace(/\n/g, '<br>')}」`,
      'OK', () => {}
    );
    return;
  }

  // Check constraints
  if (G.pendingNegotiation) {
    showConfirm('現在交渉中の案件があります。同時に交渉できるのは1件までです。', 'OK', () => {});
    return;
  }
  if ((G.negotiatedThisSeason || []).includes(fighterId)) {
    showConfirm('この選手とは今シーズン既に交渉済みです。', 'OK', () => {});
    return;
  }

  const rc = orgCfg.color;
  const fOvr = Engine.util.ov(fighter);
  let baseFee = Engine.negotiate.calcBaseFee(fighter, orgCfg);
  // v1.5s25b: fa_discount バフ（マイルストーン）
  const faDiscountBuff = (G.milestoneBuffs || []).find(b => b.type === 'fa_discount');
  if (faDiscountBuff) baseFee = Math.round(baseFee * (1 - faDiscountBuff.percent / 100));
  const dialogue = Engine.negotiate.getDialogue(fighter, 'start');
  const dialogueHtml = dialogue.replace(/\n/g, '<br>');

  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  let html = '';
  // Header
  html += `<div style="text-align:center;margin:-20px -20px 0 -20px;padding:16px 20px 12px;background:linear-gradient(180deg,${rc}20,transparent);border-radius:12px 12px 0 0">`;
  html += `<div style="font-size:13px;letter-spacing:2px;color:${rc};font-weight:700">🤝 引き抜き交渉</div>`;
  html += `<div style="font-size:11px;color:var(--text-sub);margin-top:4px">${orgCfg.emoji} ${orgCfg.name}（${orgCfg.tier}級）</div>`;
  html += `</div>`;

  // Fighter portrait + info
  const fUrl = getPortraitUrl(fighter.id);
  html += `<div style="display:flex;align-items:center;gap:12px;margin:16px 8px 12px;padding:12px;background:var(--bg-card);border:1px solid ${rc}33;border-radius:8px">`;
  if (fUrl) html += `<img src="${fUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${rc};object-fit:cover" alt="">`;
  else html += `<div style="width:80px;height:80px;border-radius:50%;border:3px solid ${rc};display:flex;align-items:center;justify-content:center;background:${rc}11;font-size:30px;font-weight:900;color:${rc}">${fighter.name.charAt(0)}</div>`;
  html += `<div style="flex:1"><div style="font-size:16px;font-weight:700;color:var(--text-main)">${fighter.name}</div>`;
  html += `<div style="font-size:12px;color:var(--text-sub);margin-top:4px">OVR ${fOvr} ・ ${fighter.style || '?'}</div></div></div>`;

  // Dialogue
  html += `<div style="background:var(--panel-bg);border:1px solid ${rc}33;border-radius:10px;padding:14px 16px;margin:0 8px 16px;position:relative">`;
  html += `<div style="position:absolute;top:-8px;left:40px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid ${rc}33"></div>`;
  html += `<p style="font-size:13px;line-height:1.7;color:var(--text-main);margin:0">「${dialogueHtml}」</p>`;
  html += `</div>`;

  // 3 Plans
  const planLabels = ['🅰 堅実', '🅱 勝負', '🅲 本気'];
  const planDescs = ['リスク低め', 'バランス型', 'ハイリターン'];
  const cfg = NEGOTIATION_CONFIG;
  html += `<div style="margin:0 8px 16px">`;
  html += `<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">交渉プランを選択:</div>`;
  for (let i = 0; i < 3; i++) {
    const cost = Math.round(baseFee * cfg.baseFeeMultipliers[i]);
    const failCost = Math.round(cost * cfg.failureCostRatio);
    const rate = Engine.negotiate.calcSuccessRate(G, fighter, orgCfg, i);
    const canAfford = G.funds >= cost;
    const borderStyle = canAfford ? `border:1px solid ${rc}44` : 'border:1px solid rgba(100,100,100,0.3)';
    const opacity = canAfford ? '1' : '0.5';
    html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-bottom:6px;background:var(--bg-card);${borderStyle};border-radius:6px;opacity:${opacity}">`;
    html += `<div><div style="font-size:13px;font-weight:700;color:${canAfford ? rc : 'var(--text-dim)'}">${planLabels[i]} <span style="font-size:11px;font-weight:400;color:var(--text-sub)">${planDescs[i]}</span></div>`;
    const rateLabel = Engine.negotiate.getRateLabel(rate);
    html += `<div style="font-size:11px;color:var(--text-dim);margin-top:2px">費用: ${cost}万 ｜ 失敗時損失: ${failCost}万 ｜ 見通し: <span style="color:${rateLabel.color};font-weight:600">${rateLabel.text}</span></div></div>`;
    html += `<button class="btn" style="font-size:12px;padding:6px 14px;background:${canAfford ? rc+'20' : 'var(--bg-mid)'};color:${canAfford ? rc : '#666'};border:1px solid ${canAfford ? rc+'40' : '#444'}" ${canAfford ? `onclick="confirmNegotiation('${orgId}',${fighterId},${i})"` : 'disabled'}>選択</button>`;
    html += `</div>`;
  }
  html += `</div>`;

  // Pending negotiation info
  if (G.pendingNegotiation) {
    html += `<div style="font-size:11px;color:var(--text-dim);text-align:center;margin-bottom:8px">⚠ 交渉中: ${G.pendingNegotiation.fighterName}（残り${G.pendingNegotiation.resolveWeek - G.week}週）</div>`;
  }

  // Close button
  html += `<div style="text-align:center"><button class="btn" style="padding:8px 20px;font-size:12px;background:var(--bg-mid);color:var(--text-sub)" onclick="document.getElementById('showResultOverlay').classList.remove('active')">戻る</button></div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

function confirmNegotiation(orgId, fighterId, planIndex) {
  const orgCfg = RIVAL_ORGS.find(o => o.id === orgId);
  const orgData = G.aiOrgs && G.aiOrgs[orgId];
  if (!orgCfg || !orgData) return;
  const fighter = orgData.roster.find(f => f.id === fighterId);
  if (!fighter) return;
  let baseFee = Engine.negotiate.calcBaseFee(fighter, orgCfg);
  // v1.5s25b: fa_discount バフ（マイルストーン）
  const faDiscountBuff = (G.milestoneBuffs || []).find(b => b.type === 'fa_discount');
  if (faDiscountBuff) baseFee = Math.round(baseFee * (1 - faDiscountBuff.percent / 100));
  const cost = Math.round(baseFee * NEGOTIATION_CONFIG.baseFeeMultipliers[planIndex]);
  const planLabels = ['🅰 堅実', '🅱 勝負', '🅲 本気'];

  const confirmRate = Engine.negotiate.calcSuccessRate(G, fighter, orgCfg, planIndex);
  const confirmRateLabel = Engine.negotiate.getRateLabel(confirmRate);
  document.getElementById('showResultOverlay').classList.remove('active');
  showConfirm(
    `<div style="text-align:center"><strong>${fighter.name}</strong>への引き抜き交渉を開始します。<br><br>` +
    `プラン: ${planLabels[planIndex]}（費用: ${cost}万）<br>` +
    `見通し: <strong style="color:${confirmRateLabel.color}">${confirmRateLabel.text}</strong><br>` +
    `交渉期間: 4週間（キャンセル不可）<br><br>` +
    `よろしいですか？</div>`,
    '交渉開始',
    () => {
      Audio.play('stamp');
      // v1.5s25b: fa_discount 消費（1回限り）
      if (faDiscountBuff) {
        G = { ...G, milestoneBuffs: (G.milestoneBuffs || []).filter(b => b.type !== 'fa_discount') };
      }
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 700 + G.week + fighterId));
      const result = Engine.negotiate.startNegotiation(rng, G, orgId, fighterId, planIndex);
      G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
      Storage.autoSave();
      refreshAll();
    }
  );
}

// F2: Show negotiation result popup (called from refreshAll when negotiationResult exists)
function showNegotiationResult() {
  const nr = G.negotiationResult;
  if (!nr) return;
  const fighter = nr.fighter;
  if (!fighter) { G = { ...G, negotiationResult: null }; return; }

  Audio.play(nr.success ? 'victory' : 'defeat');

  const phase = nr.success ? 'success' : 'fail';
  const dialogue = Engine.negotiate.getDialogue(fighter, phase);
  const dialogueHtml = dialogue.replace(/\n/g, '<br>');
  const color = nr.success ? 'var(--gold)' : 'var(--red)';
  const title = nr.success ? '🎉 交渉成功！' : '😞 交渉失敗…';

  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  let html = '';
  html += `<div style="text-align:center;font-size:20px;font-weight:900;color:${color};margin-bottom:16px">${title}</div>`;

  // Fighter portrait
  const fUrl = getPortraitUrl(fighter.id);
  html += `<div style="text-align:center;margin-bottom:12px">`;
  if (fUrl) html += `<img src="${fUrl}" style="width:100px;height:100px;border-radius:50%;border:3px solid ${color};object-fit:cover" alt="">`;
  html += `<div style="font-size:15px;font-weight:700;margin-top:8px">${fighter.name}</div>`;
  html += `</div>`;

  // Dialogue
  html += `<div style="background:var(--panel-bg);border:1px solid ${color}44;border-radius:10px;padding:14px 16px;margin:0 8px 16px;position:relative">`;
  html += `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid ${color}44"></div>`;
  html += `<p style="font-size:14px;line-height:1.7;text-align:center;color:var(--text-main);margin:0">「${dialogueHtml}」</p>`;
  html += `</div>`;

  if (nr.success) {
    html += `<div style="text-align:center;font-size:13px;color:var(--text-sub);margin-bottom:12px">${fighter.name}がロスターに加わりました！</div>`;
  }

  html += `<div style="text-align:center"><button class="btn btn-gold" style="min-width:140px;padding:10px 24px" onclick="document.getElementById('showResultOverlay').classList.remove('active');G.negotiationResult=null;Storage.autoSave();refreshAll()">OK</button></div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── Signing Ceremony Popup (v2.x) ──
function showSigningCeremony(charId) {
  const fighter = G.freeAgents.find(c => c.id === charId);
  if (!fighter) return;

  Audio.play('stamp');

  const fOvr = Engine.util.ov(fighter);
  const tierCfg = Engine.scout.getTierConfig(fighter.assessedTier || 'material');
  const signingCost = Engine.scout.getSigningCost(fighter, G.orgPop || 0);
  const salary = getSalary(fighter);
  const quote = getSigningQuote(fighter);
  const color = '#2ecc71';

  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  let html = '';

  // Header
  html += `<div style="text-align:center;margin:-20px -20px 0 -20px;padding:16px 20px 12px;background:linear-gradient(180deg,${color}20,transparent);border-radius:12px 12px 0 0">`;
  html += `<div style="font-size:13px;letter-spacing:2px;color:${color};font-weight:700">✍ 契約セレモニー</div>`;
  html += `</div>`;

  // Fighter portrait + info
  const fUrl = getPortraitUrl(fighter.id);
  html += `<div style="display:flex;align-items:center;gap:12px;margin:16px 8px 12px;padding:12px;background:var(--bg-card);border:1px solid ${color}33;border-radius:8px">`;
  if (fUrl) html += `<img src="${fUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${color};object-fit:cover" alt="">`;
  else html += `<div style="width:80px;height:80px;border-radius:50%;border:3px solid ${color};display:flex;align-items:center;justify-content:center;background:${color}11;font-size:30px;font-weight:900;color:${color}">${fighter.name.charAt(0)}</div>`;
  html += `<div style="flex:1">`;
  html += `<div style="font-size:16px;font-weight:700;color:var(--text-main)">${fighter.name} <span style="font-size:24px;font-weight:900;color:var(--gold)">${fOvr}</span></div>`;
  html += `<div style="font-size:12px;color:var(--text-sub);margin-top:4px"><span class="badge badge-${fighter.style}">${fighter.style}</span></div>`;
  html += `</div></div>`;

  // Contract details
  html += `<div style="margin:0 8px 12px;padding:12px;background:var(--bg-card);border:1px solid rgba(212,168,67,0.2);border-radius:8px">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px">`;
  html += `<span style="color:var(--text-sub)">契約金</span>`;
  html += `<span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${Math.round(signingCost).toLocaleString()}万</span>`;
  html += `</div>`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-dim)">`;
  html += `<span>ランク: <span style="color:${tierCfg.color}">${tierCfg.label}</span></span>`;
  html += `<span>給与: ${salary}万/週</span>`;
  html += `</div></div>`;

  // Signing speech bubble
  html += `<div style="background:var(--panel-bg);border:1px solid ${color}33;border-radius:10px;padding:14px 16px;margin:0 8px 16px;position:relative">`;
  html += `<div style="position:absolute;top:-8px;left:40px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid ${color}33"></div>`;
  html += `<p style="font-size:13px;line-height:1.7;color:var(--text-main);margin:0">「${quote}」</p>`;
  html += `</div>`;

  // Buttons
  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:8px">`;
  html += `<button class="btn btn-gold" style="min-width:120px;padding:10px 24px" onclick="confirmSigning(${charId})">✍ 契約する</button>`;
  html += `<button class="btn" style="min-width:100px;padding:10px 20px;background:var(--bg-mid);color:var(--text-sub)" onclick="document.getElementById('showResultOverlay').classList.remove('active')">やめる</button>`;
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

function confirmSigning(charId) {
  // Close the ceremony overlay
  document.getElementById('showResultOverlay').classList.remove('active');
  // Capture fighter info before signing (for welcome popup)
  const fighter = G.freeAgents.find(c => c.id === charId);
  const name = fighter ? fighter.name : '???';
  const fighterId = fighter ? fighter.id : charId;
  const welcomeQuote = fighter ? getWelcomeQuote(fighter) : 'よろしくお願いします！';
  // Execute the actual signing logic
  App.signFighter(charId);
  // Show welcome event popup
  showEventPopup({
    type: 'fighter', id: fighterId, name,
    tone: 'positive',
    message: `「${welcomeQuote}」`,
    detail: `${name}がロスターに加わりました！`
  });
}

// ── Coach Tooltip (profile popup) ──
function showCoachTooltip(coachId) {
  const c = ALL_COACHES.find(co => co.id === coachId);
  if (!c) return;
  if (_isPopupActive()) { _popupQueue.push(() => showCoachTooltip(coachId)); return; }
  Audio.play('hover');

  const gradeColors = {C:'#888', B:'#2ecc71', A:'var(--gold)'};
  const color = gradeColors[c.grade] || '#888';
  const gMult = c.gMult || 1.0;
  const isHired = G.coaches.includes(c.id);
  const assigned = getCoachAssignees(c.id);
  const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);

  let html = '';

  const upperUrl = getCoachUpperUrl(c.id);
  const faceUrl = getCoachPortraitUrl(c.id);

  // Header（左: 上半身画像、右: 情報）
  html += `<div class="coach-tooltip-header" style="background:${color}0a">`;

  // 左: 上半身画像 or アバター
  if (upperUrl) {
    html += `<div style="flex-shrink:0;position:relative">
      <img class="coach-tooltip-upper-img" src="${upperUrl}" alt="${c.name}" onerror="this.onerror=null;${faceUrl ? `this.src='${faceUrl}';this.style.height='88px';this.style.width='88px';this.style.borderRadius='50%'` : `this.parentElement.innerHTML='<div style=\\'width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;background:linear-gradient(135deg,${color}33,${color}11);border:2px solid ${color}88\\'>${c.emoji}</div>'`}">
    </div>`;
  } else {
    html += `<div class="coach-tooltip-avatar" style="background:linear-gradient(135deg, ${color}33, ${color}11);border:2px solid ${color}88;overflow:hidden">
      ${coachPortraitImg(c, 84)}
    </div>`;
  }

  // 右: 名前・ステータス
  html += `<div style="flex:1;min-width:0">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <div style="font-weight:700;font-size:20px;margin-bottom:6px">${c.name}</div>
        <button onclick="closeCoachTooltip()" style="background:none;border:none;color:var(--text-dim);font-size:20px;cursor:pointer;padding:4px;line-height:1;flex-shrink:0">✕</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        <span class="coach-grade coach-grade-${c.grade}">${c.grade}級</span>
        ${(c.abilities||[]).map(a => `<span class="coach-trait">${a}</span>`).join(' ')}
        ${isHired ? '<span style="font-size:12px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 6px;border-radius:3px">雇用中</span>' : ''}
      </div>
      <div style="font-size:13px;color:var(--text);line-height:1.8">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <span style="color:var(--text-sub)">成長倍率 <strong style="color:var(--gold)">×${gMult}</strong></span>
          <span style="color:var(--text-sub)">観察眼 <strong style="color:${color}">${c.observation}</strong></span>
          <span style="color:var(--text-sub)">得意 <span class="badge badge-${c.style}" style="font-size:12px;padding:1px 6px">${c.style}</span></span>
        </div>
      </div>
    </div>`;

  html += `</div>`;

  // Body
  html += '<div class="coach-tooltip-body">';

  // Abilities
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">特殊能力</div>
    <div style="font-size:13px;color:var(--text);line-height:1.6">${(c.abilities||[]).map(a => {
      const cat = COACH_ABILITY_CATALOG[a];
      return cat ? `<div><strong>${a}</strong> <span style="font-size:11px;color:var(--text-sub)">(${cat.grade}級)</span> — ${cat.desc}</div>` : `<div>${a}</div>`;
    }).join('')}${c.flavor ? `<div style="margin-top:4px;color:var(--text-sub);font-size:12px">🌿 ${c.flavor}: ${(COACH_FLAVOR_DEFS[c.flavor]||{}).desc||''}</div>` : ''}</div>
  </div>`;

  // Cost
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">コスト</div>
    <div style="display:flex;gap:16px;font-size:12px">
      <span style="color:var(--text-sub)">雇用費: <strong style="color:var(--text)">${c.hireFee}万</strong></span>
      <span style="color:var(--text-sub)">給与: <strong style="color:var(--text)">${c.salary}万/週</strong></span>
      <span style="color:var(--text-sub)">担当上限: <strong style="color:var(--text)">${COACH_MAX_ASSIGN}名</strong></span>
    </div>
  </div>`;

  // Assigned fighters
  if (isHired) {
    html += `<div class="coach-tooltip-section">
      <div class="coach-tooltip-label">担当選手 (${assigned.length}/${COACH_MAX_ASSIGN})</div>`;
    if (assignedChars.length > 0) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      assignedChars.forEach(ch => {
        const sm = getCoachStyleMatch(c, ch);
        const matchIcon = sm.icon ? `<span style="font-weight:700;color:${sm.cls==='specialist'?'#2ecc71':'#f1c40f'};margin-left:2px">${sm.icon}</span>` : '';
        html += `<span class="coach-match-chip ${sm.cls}">${portraitImg(ch.id, 20, '', true)} ${fLink(ch, {source:'roster', size:'11px'})} <strong style="color:var(--gold)">${ov(ch)}</strong>${matchIcon}</span>`;
      });
      html += '</div>';
    } else {
      html += '<div style="font-size:12px;color:var(--text-dim)">担当選手なし（団体画面でアサインできます）</div>';
    }
    html += '</div>';
  }

  // Profile
  if (c.profile) {
    html += `<div class="coach-tooltip-section" style="border-top:1px solid rgba(200,190,170,0.08);padding-top:12px">
      <div class="coach-tooltip-label">プロフィール</div>
      <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px">
        ${c.age ? c.age + '歳' : ''} ${c.gender ? '｜ ' + c.gender + '性' : ''} ${c.origin ? '｜ ' + c.origin + '出身' : ''}
      </div>
      <div style="font-size:12px;color:var(--text);line-height:1.7">${c.profile}</div>
    </div>`;
  } else if (c.desc) {
    html += `<div class="coach-tooltip-section" style="border-top:1px solid rgba(200,190,170,0.08);padding-top:12px">
      <div class="coach-tooltip-label">紹介</div>
      <div style="font-size:12px;color:var(--text);line-height:1.7">${c.desc}</div>
    </div>`;
  }

  html += '</div>'; // end body

  document.getElementById('coachTooltipBox').innerHTML = html;
  document.getElementById('coachTooltipOverlay').classList.add('active');
}

function closeCoachTooltip() {
  document.getElementById('coachTooltipOverlay').classList.remove('active');
  _drainPopupQueue();
}

// ── Event Popup System (v0.96) ──
// Shows a character face + speech bubble for important events

// Event popup queue (multiple events can stack)
let _eventPopupQueue = [];
let _autoCloseTimer = null;

// ══════════════════════════════════════════════════════════
//  関係性フラグモーダル ドレイン (relationship-flags-spec-v1.0 §4)
// ══════════════════════════════════════════════════════════

// モーダル種別 → 表示メタ
const FLAG_MODAL_META = {
  'M-1':  { title: '🗯️ 裏切り',         tone: 'negative', priority: 2 },
  'M-2':  { title: '✨ 憧れ',           tone: 'positive', priority: 4 },
  'M-3':  { title: '🌟 憧れ・達成',     tone: 'gold',     priority: 3 },
  'M-4':  { title: '🕯️ 憧れ・喪失',    tone: 'negative', priority: 3 },
  'M-5':  { title: '💧 憧れ・幻滅',     tone: 'negative', priority: 3 },
  'M-6':  { title: '⚔️ 嫉妬・撃破',    tone: 'positive', priority: 3 },
  'M-7':  { title: '🌫️ 嫉妬・宙吊り', tone: 'negative', priority: 3 },
  'M-8':  { title: '🌬️ 嫉妬・風化',   tone: '',         priority: 3 },
  'M-9':  { title: '🌬️ 嫉妬・風化',   tone: '',         priority: 3 },
  'M-10': { title: '🌬️ 嫉妬・風化',   tone: '',         priority: 3 },
  'M-11': { title: '🩸 嫉妬',           tone: 'negative', priority: 4 },
  'M-12': { title: '🚪 出戻りの日',     tone: '',         priority: 1 },
  'M-13': { title: '🥋 師弟',           tone: 'gold',     priority: 5 },
  'M-14': { title: '🔥 ライバル同期',   tone: 'gold',     priority: 5 },
  // bond-rebalance v2.3: 低Bond決定的事件のポップアップ
  'M-15': { title: '🔥 番狂わせ・逆恨み',     tone: 'negative', priority: 3 },
  'M-16': { title: '💔 スランプの八つ当たり', tone: 'negative', priority: 4 },
  'M-17': { title: '🪦 共闘ペアの裏切り',    tone: 'negative', priority: 4 },
  'M-18': { title: '⛓️ 価値観の決裂',         tone: 'negative', priority: 5 },
};

function _findFighterById(id) {
  if (!id || !window.G) return null;
  const lists = [G.roster || [], G.freeAgents || [], G.retiredFighters || []];
  for (const list of lists) {
    const f = list.find(c => c && c.id === id);
    if (f) return f;
  }
  if (G.aiOrgs) {
    for (const org of Object.values(G.aiOrgs)) {
      const f = (org.roster || []).find(c => c && c.id === id);
      if (f) return f;
    }
  }
  if (typeof ALL_CHARS !== 'undefined') {
    return ALL_CHARS.find(c => c.id === id) || null;
  }
  return null;
}

function _flagPickPersonality(fighter) {
  return (fighter && fighter.personality) || 'normal';
}

function _flagFormatLine(template, fighter, fighter2) {
  let s = String(template || '');
  if (fighter) s = s.replace(/\{name\}/g, fighter.name || '');
  if (fighter2) s = s.replace(/\{name2\}/g, fighter2.name || '');
  return s;
}

function _flagBuildPopupOpts(modal) {
  const meta = FLAG_MODAL_META[modal.type] || { title: 'フラグ', tone: '' };
  const p = modal.payload || {};
  // Speaker priority: fromId > byIds[0] > departerId > masterId > idA > returnerId
  let speakerId = p.fromId ?? p.byIds?.[0] ?? p.departerId ?? p.masterId ?? p.idA ?? p.returnerId;
  let targetId = p.toId ?? p.targetId ?? p.discipleId ?? p.idB ?? null;

  // M-13: 師→弟子 と 弟子→師 を別々に出す（連続2モーダル）
  // M-12: 出戻り反応は専用フォーマット
  if (modal.type === 'M-12') return _flagBuildM12(modal, meta);
  if (modal.type === 'M-13') return _flagBuildM13(modal, meta);

  const speaker = _findFighterById(speakerId);
  const target = _findFighterById(targetId);
  const personality = _flagPickPersonality(speaker);
  const archetype = (speaker && speaker.archetype) || null;
  const lineSeed = (speakerId || 0) ^ (targetId || 0) ^ (modal.season || 0) * 31 + (modal.week || 0);
  const tmpl = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickLine(modal.type, personality, lineSeed, archetype)
    : '';
  const message = _flagFormatLine(tmpl, speaker, target);

  return {
    type: 'fighter',
    id: speakerId || (target?.id),
    name: (speaker && speaker.name) || (target && target.name) || '',
    tone: meta.tone || '',
    message: message || '…',
    detail: meta.title,
  };
}

function _flagBuildM12(modal, meta) {
  // 出戻り本人 + 反応リスト。1画面で出戻り者+各反応をまとめる簡易版
  const p = modal.payload || {};
  const returner = _findFighterById(p.returnerId);
  const reactions = p.reactions || [];
  const rPersonality = _flagPickPersonality(returner);
  const rSeed = (p.returnerId || 0) * 13 + (modal.week || 0);
  const rLine = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickSubLine('M-12', 'returner', rPersonality, rSeed)
    : '';
  const reactionLines = reactions.map(r => {
    const rem = _findFighterById(r.byId);
    if (!rem) return null;
    const sub = r.forgiven ? 'forgiven' : 'notForgiven';
    const tmpl = (typeof FLAG_DIALOGUE !== 'undefined')
      ? FLAG_DIALOGUE._pickSubLine('M-12', sub, _flagPickPersonality(rem), rem.id)
      : '';
    return `<b style="color:${r.forgiven ? 'var(--cream-gold)' : 'var(--cream-text-muted)'}">${rem.name}</b>: ${_flagFormatLine(tmpl, rem, returner)}`;
  }).filter(Boolean);

  return {
    type: 'fighter',
    id: p.returnerId,
    name: (returner && returner.name) || '',
    tone: '',
    message: _flagFormatLine(rLine, returner) || '…',
    detail: `${meta.title}<br><div style="margin-top:8px;font-size:12px;text-align:left;line-height:1.6">${reactionLines.join('<br>')}</div>`,
  };
}

function _flagBuildM13(modal, meta) {
  // 師匠目線のみ表示（弟子目線は連続表示すると重いので detail で併記）
  const p = modal.payload || {};
  const master = _findFighterById(p.masterId);
  const disciple = _findFighterById(p.discipleId);
  const mPersonality = _flagPickPersonality(master);
  const dPersonality = _flagPickPersonality(disciple);
  const seed = (p.masterId || 0) * 7 + (p.discipleId || 0);
  const mLine = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickSubLine('M-13', 'master', mPersonality, seed)
    : '';
  const dLine = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickSubLine('M-13', 'disciple', dPersonality, seed + 1)
    : '';
  return {
    type: 'fighter',
    id: p.masterId,
    name: (master && master.name) || '',
    tone: meta.tone,
    message: _flagFormatLine(mLine, master, disciple) || '…',
    detail: `${meta.title}<br><div style="margin-top:6px;font-size:12px;font-style:italic">${(disciple && disciple.name) || '弟子'}: ${_flagFormatLine(dLine, disciple, master)}</div>`,
  };
}

function _drainFlagModalQueue() {
  if (!window.G || !Array.isArray(G._modalQueue) || G._modalQueue.length === 0) return;
  // 仕様書 §4.1 優先順位（数字小さいほど先）
  const queue = [...G._modalQueue].sort((a, b) => {
    const pa = (FLAG_MODAL_META[a.type]?.priority) ?? 9;
    const pb = (FLAG_MODAL_META[b.type]?.priority) ?? 9;
    return pa - pb;
  });
  G._modalQueue = []; // 全て消費
  for (const modal of queue) {
    try {
      const opts = _flagBuildPopupOpts(modal);
      if (opts) showEventPopup(opts);
    } catch (e) {
      console.warn('[flag-modal] render error', modal.type, e);
    }
  }
}

function showEventPopup(opts) {
  // opts: { type: 'fighter'|'coach', id, name, emoji?, message, detail?, tone: 'positive'|'negative'|'gold',
  //         choices?: [{ label, hint?, tone?, onSelect }] — あれば A-5(mdl-a)で描画 }
  // A-5 分岐: choices を持つ場合は専用の A 型モーダルに流す
  if (opts && Array.isArray(opts.choices) && opts.choices.length > 0) {
    _showEventPopupAsChoice(opts);
    return;
  }
  _eventPopupQueue.push(opts);
  if (_eventPopupQueue.length === 1) {
    _enqueuePopup(() => _renderEventPopupAsC3());
  }
}

/** A-5: 選手要望型(選択肢付き eventPopup)を mdl-a で描画 */
function _showEventPopupAsChoice(opts) {
  const run = () => {
    const fighter = opts.type === 'fighter' && opts.id != null
      ? (G.roster || []).find(f => f.id === opts.id) || { id: opts.id, name: opts.name }
      : null;

    const bubbleHtml = `<div style="background:rgba(255,255,255,0.5);border-left:3px solid var(--cream-gold);border-radius:0 4px 4px 0;padding:12px 16px;margin-top:14px;max-width:440px;margin-left:auto;margin-right:auto;text-align:left;font-size:14px;color:var(--cream-text-main);line-height:1.7;font-style:italic">「${opts.message || ''}」</div>`;
    const detailHtml = opts.detail ? `<div class="mdl-a-observation centered" style="margin-top:10px;font-size:12px">${opts.detail}</div>` : '';

    const subjectHtml = fighter
      ? _mdlASubjectStage(fighter, bubbleHtml + detailHtml, { small: true })
      : `<div class="mdl-a-subject-stage">${bubbleHtml}${detailHtml}</div>`;

    const choices = opts.choices;
    const trayCls = choices.length === 2 ? 'mdl-a-decision-tray two' : 'mdl-a-decision-tray';
    const trayCards = choices.map((c, i) => {
      const letter = c.letter || String.fromCharCode(65 + i);
      const hintTone = c.tone === 'positive' ? 'positive' : c.tone === 'negative' ? 'negative' : '';
      return `<div class="mdl-a-decision-card" data-idx="${i}" style="text-align:center">
        <div class="mdl-a-decision-letter">${letter}</div>
        <div class="mdl-a-decision-label">${c.label || ''}</div>
        ${c.hint ? `<div class="mdl-a-decision-hint ${hintTone}">${c.hint}</div>` : ''}
      </div>`;
    }).join('');

    const html = `
      ${_mdlAHeader(opts.title || '💬 選手からの申し入れ', _mdlASeasonLabel(G))}
      ${_mdlAReporterStrip(G, opts.reporterLine || '本人が直接お話ししたいそうです')}
      ${subjectHtml}
      <div class="mdl-a-prompt">${opts.prompt || 'この申し入れ、どう受けますか？'}</div>
      <div class="${trayCls}">${trayCards}</div>
    `;

    if (!_mdlAOpen(html, { narrow: choices.length <= 2 })) return;

    const card = document.getElementById('mdlACard');
    card.querySelectorAll('.mdl-a-decision-card').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        Audio.play('click');
        const choice = choices[idx];
        _mdlAClose();
        if (choice && typeof choice.onSelect === 'function') choice.onSelect(idx);
        if (typeof opts.onChoice === 'function') opts.onChoice(idx);
      });
    });
    Audio.play(opts.sound || (opts.tone === 'negative' ? 'error' : opts.tone === 'gold' ? 'award' : 'event'));
  };

  _enqueuePopup(run);
}

function _renderEventPopup() {
  if (_eventPopupQueue.length === 0) return;
  const o = _eventPopupQueue[0];
  const box = document.getElementById('eventPopupBox');
  const toneClass = o.tone || '';

  // Face image
  let faceHtml = '';
  if (o.type === 'fighter' && o.id) {
    const url = getPortraitUrl(o.id);
    if (url) faceHtml = `<img src="${url}" alt="">`;
    else {
      const ch = ALL_CHARS.find(c => c.id === o.id);
      faceHtml = `<div class="emoji-face">${ch ? ch.name.charAt(0) : '?'}</div>`;
    }
  } else if (o.type === 'coach' && o.id) {
    const coach = ALL_COACHES.find(c => c.id === o.id);
    const url = getCoachPortraitUrl(o.id);
    if (url) faceHtml = `<img src="${url}" alt="" onerror="this.outerHTML='<div class=\\'emoji-face\\'>${coach?.emoji||'👤'}</div>'">`;
    else faceHtml = `<div class="emoji-face">${coach?.emoji || '👤'}</div>`;
  } else {
    faceHtml = `<div class="emoji-face">${o.emoji || '💬'}</div>`;
  }

  // 社長室 Phase 5: 二次アクションボタン(怪我→特別治療など)
  //   opts.action = { label, disabled?, disabledHint?, onClick: () => void }
  let actionHtml = '';
  if (o.action && typeof o.action === 'object' && o.action.label) {
    const isDisabled = !!o.action.disabled;
    const hint = isDisabled && o.action.disabledHint ? `<div class="event-popup-action-hint">${o.action.disabledHint}</div>` : '';
    actionHtml = `
      ${hint}
      <button class="event-popup-action${isDisabled ? ' is-disabled' : ''}" id="eventPopupActionBtn"${isDisabled ? ' disabled' : ''}>${o.action.label}</button>
    `;
  }

  box.className = `event-popup ${toneClass}`;
  box.innerHTML = `
    <div class="event-popup-face">${faceHtml}</div>
    <div class="event-popup-name">${o.name || ''}</div>
    <div class="event-popup-msg">${o.message}</div>
    ${o.detail ? `<div class="event-popup-detail">${o.detail}</div>` : ''}
    ${actionHtml}
    <button class="event-popup-ok" onclick="closeEventPopup()">${o.action ? '閉じる' : 'OK'}</button>
  `;

  // 二次アクションのハンドラ束縛
  if (o.action && !o.action.disabled && typeof o.action.onClick === 'function') {
    const btn = document.getElementById('eventPopupActionBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        // onClick内でポップアップを閉じる責任はハンドラ側に(closeEventPopupを呼ぶ)
        o.action.onClick();
      });
    }
  }

  document.getElementById('eventPopupOverlay').classList.add('active');
  Audio.play(o.sound || (o.tone === 'negative' ? 'error' : o.tone === 'gold' ? 'award' : 'event'));
  if (o.autoCloseMs) _autoCloseTimer = setTimeout(closeEventPopup, o.autoCloseMs);
}

/** C-3: choices なし eventPopup を mdlCOverlay で描画 */
function _renderEventPopupAsC3() {
  if (_eventPopupQueue.length === 0) return;
  const o = _eventPopupQueue[0];

  let faceHtml = '';
  if (o.type === 'fighter' && o.id) {
    const url = getPortraitUrl(o.id);
    const faceStyle = `background-color:rgba(212,168,67,0.1)${url ? `;background-image:url('${url}')` : ''}`;
    faceHtml = `<div style="width:120px;height:120px;margin:0 auto 12px;border-radius:50%;${faceStyle};background-size:cover;background-position:top center;border:3px solid rgba(212,168,67,0.5);box-shadow:0 4px 20px rgba(0,0,0,0.4)"></div>`;
  } else if (o.type === 'coach' && o.id) {
    const url = getCoachPortraitUrl(o.id);
    const faceStyle = `background-color:rgba(212,168,67,0.1)${url ? `;background-image:url('${url}')` : ''}`;
    faceHtml = `<div style="width:120px;height:120px;margin:0 auto 12px;border-radius:50%;${faceStyle};background-size:cover;background-position:top center;border:3px solid rgba(212,168,67,0.5);box-shadow:0 4px 20px rgba(0,0,0,0.4)"></div>`;
  }

  let actionHtml = '';
  if (o.action && typeof o.action === 'object' && o.action.label) {
    const disabled = !!o.action.disabled;
    const hint = disabled && o.action.disabledHint
      ? `<div class="event-popup-action-hint">${o.action.disabledHint}</div>` : '';
    actionHtml = `${hint}<button class="event-popup-action${disabled ? ' is-disabled' : ''}" id="eventPopupActionBtn"${disabled ? ' disabled' : ''}>${o.action.label}</button>`;
  }

  const html = `
    <div style="padding:24px 20px 12px;text-align:center">
      ${faceHtml}
      <div style="font-size:18px;font-weight:700;color:var(--info-text-main);margin-bottom:4px">${o.name || ''}</div>
    </div>
    <div class="mdl-c-body" style="padding-top:4px">
      <div class="mdl-c-comment-block">${o.message || ''}</div>
      ${o.detail ? `<div style="font-size:12px;color:var(--info-text-dim);margin-top:8px;text-align:center">${o.detail}</div>` : ''}
      ${actionHtml}
    </div>
    <div class="mdl-c-footer" style="justify-content:center">
      <button class="mdl-c-footer-btn" onclick="closeEventPopup()">${o.action ? '閉じる' : 'OK'}</button>
    </div>
  `;

  _mdlCOpen(html, { compact: true });

  if (o.action && !o.action.disabled && typeof o.action.onClick === 'function') {
    const btn = document.getElementById('eventPopupActionBtn');
    if (btn) btn.addEventListener('click', () => o.action.onClick());
  }

  Audio.play(o.sound || (o.tone === 'negative' ? 'error' : o.tone === 'gold' ? 'award' : 'event'));
  if (o.autoCloseMs) _autoCloseTimer = setTimeout(closeEventPopup, o.autoCloseMs);
}

function closeEventPopup() {
  clearTimeout(_autoCloseTimer); _autoCloseTimer = null;
  _mdlCClose();
  _eventPopupQueue.shift();
  if (_eventPopupQueue.length > 0) {
    setTimeout(_renderEventPopupAsC3, 200);
  } else if (_onEventPopupQueueEmpty) {
    const cb = _onEventPopupQueueEmpty;
    _onEventPopupQueueEmpty = null;
    setTimeout(cb, 200);
  } else {
    _drainPopupQueue();
  }
}
let _onEventPopupQueueEmpty = null;

// ── v1.3-3: Retirement Popup ────────────────
let _retirementPopupQueue = [];
let _retirementPopupCallback = null;

/**
 * Show retirement popup(s) in sequence.
 * @param {Array} retirements - Array of { fighter, route, line, summary, injuryType?, wasChampion? }
 * @param {Function} onAllDone - Called after all popups are dismissed
 */
function showRetirementPopups(retirements, onAllDone) {
  if (!retirements || retirements.length === 0) { if (onAllDone) onAllDone(); return; }
  _retirementPopupQueue = [...retirements];
  _retirementPopupCallback = onAllDone || null;
  _enqueuePopup(() => _renderRetirementPopup());
}

function _renderRetirementPopup() {
  if (_retirementPopupQueue.length === 0) {
    if (_retirementPopupCallback) { _retirementPopupCallback(); _retirementPopupCallback = null; }
    return;
  }
  const r = _retirementPopupQueue[0];
  const f = r.fighter;
  const isInjury = r.route === 'injury_wear' || r.route === 'injury_career_ending';

  const careerYears = f.careerSeasons || Math.max(1, (f.age || 17) - (f.debutAge || 17));
  const wins = f.wins || 0, losses = f.losses || 0, draws = f.draws || 0;
  const summary = r.summary || [];
  const title = isInjury ? '無 念 の 引 退' : '旅 　 立 ち';
  const sub = isInjury ? `FAREWELL ・ INJURY` : `FAREWELL ・ ${careerYears} YEARS`;
  const meta = `AGE ${f.age || '—'} ・ CAREER ${careerYears} YEARS`;

  // 引退選手のキャリアハイライトをB型ステージ下に挟む
  const careerHtml = summary.length > 0
    ? `<div style="max-width:560px;margin:0 auto 18px;background:rgba(20,18,15,0.55);border:1px solid rgba(200,180,150,0.12);border-radius:6px;padding:12px 16px">
         <div style="font-family:var(--font-label);font-size:10px;color:rgba(200,180,150,0.7);letter-spacing:2px;text-align:center;margin-bottom:8px">━━ ${careerYears}年間の軌跡 ━━</div>
         ${summary.map(item => `<div style="font-size:13px;color:rgba(232,220,200,0.88);line-height:1.7;display:flex;gap:8px;align-items:baseline">
           <span style="font-size:14px">${item.icon}</span><span>${item.text}</span>
         </div>`).join('')}
       </div>`
    : '';

  const statsRow = `
    <div class="mdl-b-stats-row">
      <div class="mdl-b-stat-box"><div class="mdl-b-stat-label">TOTAL RECORD</div>
        <div class="mdl-b-stat-value small" style="font-size:16px">${wins}W ${losses}L${draws > 0 ? ` ${draws}D` : ''}</div></div>
      <div class="mdl-b-stat-box"><div class="mdl-b-stat-label">CAREER</div>
        <div class="mdl-b-stat-value">${careerYears}<span style="font-size:14px">Y</span></div></div>
      <div class="mdl-b-stat-box"><div class="mdl-b-stat-label">CAREER HIGH</div>
        <div class="mdl-b-stat-value">OVR ${f.peakOVR || (typeof Engine !== 'undefined' && Engine.util ? Engine.util.ov(f) : '—')}</div></div>
    </div>`;

  const notes = [
    isInjury && r.injuryType ? `🏥 ${r.injuryType}` : '',
    r.wasChampion ? '🏆 王座返上' : ''
  ].filter(Boolean).join('　');
  const noteHtml = notes ? `<div style="text-align:center;color:rgba(200,180,150,0.85);font-size:13px;margin-bottom:10px">${notes}</div>` : '';

  const btnLabel = isInjury ? '— …… —' : '— 見 送 る —';
  const canRetain = r.canRetain && !isInjury;
  const retainCount = f.retainCount || 0;
  const retainBtn = canRetain
    ? { label: `🤝 引き留める（あと${2 - retainCount}回）`, id: 'mdlBRetainBtn' }
    : null;
  const buttons = [{ label: btnLabel, primary: true, id: 'mdlBRetireClose' }];
  if (retainBtn) buttons.push(retainBtn);

  const html = `
    ${_mdlBTitleBand(title, 'dissolve', sub)}
    ${_mdlBSoloStage(f, { speaker: f.name, text: r.line, variant: 'soft', size: 'large' }, { sepia: true, meta })}
    ${noteHtml}
    ${statsRow}
    ${careerHtml}
    ${_mdlBActions(buttons)}
  `;

  _mdlBOpen(html, 'sepia');
  Audio.play(isInjury ? 'error' : 'event');

  setTimeout(() => {
    const btn = document.getElementById('mdlBRetireClose');
    if (btn) btn.addEventListener('click', closeRetirementPopup);
    const retain = document.getElementById('mdlBRetainBtn');
    if (retain) retain.addEventListener('click', () => doRetainFighter(f.id));
  }, 50);
}

function closeRetirementPopup() {
  // B4タレント活動§13: チャンピオン怪我引退後の社長への一言
  const justClosed = _retirementPopupQueue[0];
  _mdlBClose();
  // 互換: 旧オーバーレイのactiveも解除
  const legacy = document.getElementById('retirementPopupOverlay');
  if (legacy) legacy.classList.remove('active');
  _retirementPopupQueue.shift();

  if (justClosed && justClosed.championWorryLine) {
    // Glimpse B形式の小さい吹き出しを表示（クリックで閉じる）
    _showChampionWorryBubble(justClosed.fighter, justClosed.championWorryLine, () => {
      if (_retirementPopupQueue.length > 0) {
        setTimeout(_renderRetirementPopup, 300);
      } else if (_retirementPopupCallback) {
        const cb = _retirementPopupCallback; _retirementPopupCallback = null; cb();
        _drainPopupQueue();
      } else {
        _drainPopupQueue();
      }
    });
    return;
  }

  if (_retirementPopupQueue.length > 0) {
    setTimeout(_renderRetirementPopup, 300);
  } else if (_retirementPopupCallback) {
    const cb = _retirementPopupCallback; _retirementPopupCallback = null; cb();
    _drainPopupQueue();
  } else {
    _drainPopupQueue();
  }
}

// B4タレント活動§13: チャンピオン怪我引退時の社長への一言（Glimpse B形式吹き出し）
function _showChampionWorryBubble(fighter, line, onClose) {
  const face = portraitImg(fighter.id, 56, '');
  const bubble = document.createElement('div');
  bubble.style.cssText = 'position:fixed;bottom:20%;left:50%;transform:translateX(-50%);z-index:10001;display:flex;align-items:center;gap:10px;padding:14px 18px;background:rgba(30,28,25,0.95);border:1px solid rgba(200,190,170,0.2);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.5);cursor:pointer;max-width:380px;animation:fadeInUp 0.4s ease';
  bubble.innerHTML = `
    <div style="flex-shrink:0;width:56px;height:56px;border-radius:50%;overflow:hidden;border:2px solid rgba(200,190,170,0.3)">${face}</div>
    <div>
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">${fighter.name}</div>
      <div style="font-size:13px;color:var(--text-main);line-height:1.5">${line}</div>
    </div>
  `;
  bubble.addEventListener('click', () => {
    bubble.style.opacity = '0';
    bubble.style.transition = 'opacity 0.3s';
    setTimeout(() => { bubble.remove(); if (onClose) onClose(); }, 300);
  });
  document.body.appendChild(bubble);
}

// ── 引退勧告結果ポップアップ ────────────────
function showRetireAdviseResultPopup(accepted, fighter, line) {
  const title = accepted ? '引 退 受 諾' : '引 退 拒 否';
  const titleCls = accepted ? 'dissolve' : 'rival';
  const sub = accepted
    ? 'LAST RUN BEGINS'
    : (fighter.proveMode > 0 ? 'PROVE MODE ACTIVATED' : 'REJECTED');
  const variant = accepted ? 'sepia' : 'rival';
  const speechVariant = accepted ? 'soft' : 'rival';

  const subText = accepted
    ? `ラストラン状態に入りました。次の興行で引退試合を組みましょう。`
    : (fighter.proveMode > 0 ? '🔥 見返しモード（4週間MQ+2）発動！' : 'ロッカールームに影響が出ました。');

  const html = `
    ${_mdlBTitleBand(title, titleCls, sub)}
    ${_mdlBSoloStage(fighter, { speaker: fighter.name, text: line, variant: speechVariant, size: 'large' }, { sepia: accepted })}
    <div class="mdl-b-atmosphere" style="margin-bottom:14px">${subText}</div>
    ${_mdlBActions([{ label: '— 閉 じ る —', primary: true, id: 'mdlBRetireAdviseClose' }])}
  `;

  _mdlBOpen(html, variant);
  Audio.play(accepted ? 'event' : 'error');

  setTimeout(() => {
    const btn = document.getElementById('mdlBRetireAdviseClose');
    if (btn) btn.addEventListener('click', () => _mdlBClose());
  }, 50);
}

// ── 因縁決着ポップアップ（宣戦布告 / 決着 共用）────────────────
let _rivalryPopupQueue = [];
let _rivalryPopupCallback = null;

/**
 * 因縁ポップアップをキュー表示
 * @param {Array} items - ポップアップデータの配列
 *   宣戦布告: { phase:'confrontation', leftId, rightId, leftName, rightName, isFate }
 *   決着:     { phase:'resolution', winnerId, loserId, winnerName, loserName, isFate, isSecondResolution, popBonus, orgPopBonus }
 * @param {Function} onAllDone
 */
function showRivalryPopups(items, onAllDone) {
  if (!items || items.length === 0) { if (onAllDone) onAllDone(); return; }
  _rivalryPopupQueue = [...items];
  _rivalryPopupCallback = onAllDone || null;
  _enqueuePopup(() => _renderRivalryPopup());
}

function _rivalryUpperHtml(id, mirrorClass) {
  const upper = getUpperUrl(id);
  if (upper) return `<img src="${upper}" class="rivalry-popup-upper${mirrorClass ? ' ' + mirrorClass : ''}" alt="" onerror="this.parentElement.innerHTML=_rivalryFallbackHtml(${id})">`;
  return `<div class="rivalry-popup-upper-fallback">${_rivalryFaceInnerHtml(id)}</div>`;
}
function _rivalryFaceInnerHtml(id) {
  const url = getPortraitUrl(id);
  if (url) return `<img src="${url}" alt="">`;
  const ch = ALL_CHARS.find(c => c.id === id);
  return `<div class="emoji-face">${ch ? ch.name.charAt(0) : '?'}</div>`;
}
function _rivalryFallbackHtml(id) {
  return `<div class="rivalry-popup-upper-fallback">${_rivalryFaceInnerHtml(id)}</div>`;
}

function _rivalryCol(id, name, line, isWinner, opts) {
  opts = opts || {};
  const fighter = (typeof findFighter === 'function' ? findFighter(id) : null) || ALL_CHARS.find(c => c.id === id);
  const ovr = (fighter && typeof Engine !== 'undefined' && Engine.util && Engine.util.ov) ? Engine.util.ov(fighter) : '—';
  const upperUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(id) : '';
  const colCls = isWinner ? 'vd-col-w' : 'vd-col-l';
  const bubbleCls = isWinner ? 'vd-bubble-w' : 'vd-bubble-l';
  const nameCls = isWinner ? 'vd-name-w' : 'vd-name-l';
  const ovrCls = isWinner ? 'vd-ovr-w' : 'vd-ovr-l';
  const badgeHtml = opts.hideBadge
    ? ''
    : (isWinner
      ? '<span class="vd-badge-w">WINNER</span>'
      : '<span class="vd-badge-l">LOSER</span>');
  const imgHtml = upperUrl
    ? `<img src="${upperUrl}" alt="">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;color:rgba(255,255,255,0.1)">👤</div>`;
  return `
    <div class="${colCls}">
      <div class="${bubbleCls}">
        <div class="vd-spk">${name}</div>
        ${line}
      </div>
      <div class="vd-img-card">
        <div class="vd-img-frame">${imgHtml}</div>
        <div class="vd-nameband">
          <div class="${nameCls}">${name}</div>
          <div class="vd-meta">
            <span class="${ovrCls}">OVR ${ovr}</span>
            ${badgeHtml}
          </div>
        </div>
      </div>
    </div>`;
}

function _renderRivalryPopup() {
  if (_rivalryPopupQueue.length === 0) {
    if (_rivalryPopupCallback) { const cb = _rivalryPopupCallback; _rivalryPopupCallback = null; cb(); }
    return;
  }
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { _rivalryPopupQueue.shift(); return; }
  const o = _rivalryPopupQueue[0];

  let title, sub, toneCls, leftHtml, rightHtml, vsIcon, vsLabel, resultHtml, audioKey;

  if (o.phase === 'confrontation') {
    const rivalryVal = o.rivalry || 0;
    const leftFighter = ALL_CHARS.find(c => c.id === o.leftId);
    const rightFighter = ALL_CHARS.find(c => c.id === o.rightId);
    let attackerPool, defenderPool;
    if (rivalryVal >= 90) {
      attackerPool = RIVALRY_CONFRONTATION_LINES_90.attacker;
      defenderPool = RIVALRY_CONFRONTATION_LINES_90.defender;
    } else if (rivalryVal >= 70) {
      attackerPool = RIVALRY_CONFRONTATION_LINES_70.attacker;
      defenderPool = RIVALRY_CONFRONTATION_LINES_70.defender;
    } else if (o.isFate) {
      attackerPool = RIVALRY_CONFRONTATION_LINES.fateAttacker;
      defenderPool = RIVALRY_CONFRONTATION_LINES.fateDefender;
    } else {
      attackerPool = RIVALRY_CONFRONTATION_LINES.attacker;
      defenderPool = RIVALRY_CONFRONTATION_LINES.defender;
    }
    const leftLine = pickDialogueLine(attackerPool, leftFighter);
    const rightLine = pickDialogueLine(defenderPool, rightFighter);
    title = rivalryVal >= 70 ? '因 縁 勃 発' : '宿 敵 対 決';
    sub = rivalryVal >= 70 ? 'RIVALRY DECLARED ・ FATED' : 'RIVALRY DECLARED';
    toneCls = 'tone-confront';
    leftHtml = _rivalryCol(o.leftId, o.leftName, leftLine, true, { hideBadge: true });
    rightHtml = _rivalryCol(o.rightId, o.rightName, rightLine, false, { hideBadge: true });
    vsIcon = '⚡';
    vsLabel = '勃 発';
    resultHtml = `<div class="vd-tag">⚡ ふたりの間に火花が散った</div>`;
    audioKey = o.isFate ? 'fate_confrontation' : 'rivalry_confrontation';

  } else {
    const isGoodRival = o.resolutionType === 'goodRival';
    const isBitter = o.resolutionType === 'bitter';
    const winLineObj = isGoodRival ? GOODRIVAL_RESOLUTION_LINES.winner
      : isBitter ? BITTER_RESOLUTION_LINES.winner
      : (o.isFate ? RIVALRY_RESOLUTION_LINES.fateWinner : RIVALRY_RESOLUTION_LINES.winner);
    const loseLineObj = isGoodRival ? GOODRIVAL_RESOLUTION_LINES.loser
      : isBitter ? BITTER_RESOLUTION_LINES.loser
      : (o.isFate ? RIVALRY_RESOLUTION_LINES.fateLoser : RIVALRY_RESOLUTION_LINES.loser);
    const winFighter = ALL_CHARS.find(c => c.id === o.winnerId);
    const loseFighter = ALL_CHARS.find(c => c.id === o.loserId);
    const winLine = pickDialogueLine(winLineObj, winFighter);
    const loseLine = pickDialogueLine(loseLineObj, loseFighter);
    title = isBitter ? '宿 怨 決 着'
      : isGoodRival ? '好 敵 手 誕 生'
      : (o.isSecondResolution ? '最 終 決 着' : (o.isFate ? '宿命の相手 決着' : '宿 敵 決 着'));
    sub = isBitter ? 'BITTER RIVALRY ・ FINAL'
      : isGoodRival ? 'GOOD RIVALS ・ MUTUAL RESPECT'
      : (o.isFate ? 'FATED RIVALRY ・ RESOLVED' : 'RIVALRY RESOLVED');
    toneCls = isGoodRival ? 'tone-goodrival'
      : isBitter ? 'tone-bitter'
      : (o.isFate || o.isSecondResolution) ? 'tone-fate' : '';
    leftHtml = _rivalryCol(o.winnerId, o.winnerName, winLine, true);
    rightHtml = _rivalryCol(o.loserId, o.loserName, loseLine, false);
    vsIcon = '⚔';
    vsLabel = '決 着';
    const bonusLine = `📈 両選手の人気 ${Engine.util.formatSignedStatDelta(o.popBonus, 0)}　🏢 団体人気 ${Engine.util.formatSignedStatDelta(o.orgPopBonus, 1)}`;
    const tagText = isGoodRival ? '🤝 ふたりは「好敵手」になった'
      : isBitter ? '💀 ふたりは「宿怨」になった'
      : o.isFate ? '✨ 宿命の相手との決着がついた'
      : '🔥 宿敵の決着';
    resultHtml = `<div class="vd-tag">${tagText}</div><div class="vd-bonus">${bonusLine}</div>`;
    audioKey = (o.isFate || isGoodRival || isBitter) ? 'fate_resolution' : 'rivalry_resolution';
  }

  box.className = `notif-modal-box verdict${toneCls ? ' ' + toneCls : ''}`;
  box.innerHTML = `
    <div class="vd-head">
      <div class="vd-title">${title}</div>
      <div class="vd-sub">${sub}</div>
    </div>
    <div class="vd-stage">
      ${leftHtml}
      <div class="vd-vs">
        <div class="vd-vs-line"></div>
        <div class="vd-vs-icon">${vsIcon}</div>
        <div class="vd-vs-label">${vsLabel}</div>
        <div class="vd-vs-line"></div>
      </div>
      ${rightHtml}
    </div>
    <div class="vd-result">${resultHtml}</div>
    <div class="vd-foot"><button class="vd-btn" id="mdlBRivalryClose">— 見 届 け る —</button></div>
  `;
  overlay.classList.add('active');
  setTimeout(() => Audio.play(audioKey), 200);

  setTimeout(() => {
    const btn = document.getElementById('mdlBRivalryClose');
    if (btn) btn.addEventListener('click', closeRivalryPopup);
  }, 50);
}

function closeRivalryPopup() {
  const overlay = document.getElementById('notifModalOverlay');
  if (overlay) overlay.classList.remove('active');
  _rivalryPopupQueue.shift();
  if (_rivalryPopupQueue.length > 0) {
    setTimeout(_renderRivalryPopup, 300);
  } else if (_rivalryPopupCallback) {
    const cb = _rivalryPopupCallback;
    _rivalryPopupCallback = null;
    setTimeout(cb, 200);
    _drainPopupQueue();
  } else {
    _drainPopupQueue();
  }
}

// ── v1.4: Awards Ceremony ────────────────────────────────────

/**
 * 年末表彰式を順番に表示
 * @param {Object} awards - Engine.awards.generate() の結果
 * @param {Function} onDone - 全表示完了後のコールバック
 */
// ═══════════════════════════════════════════════════════════════════
//  Awards Ceremony v2 — mockup-final-v2 準拠
// ═══════════════════════════════════════════════════════════════════

// ── ヘルパー ──────────────────────────────────────────────────────

function _awardLine(key, charId) {
  const lineObj = (typeof AWARD_LINES !== 'undefined' && AWARD_LINES[key]);
  if (!lineObj) return '';
  const ch = charId ? ALL_CHARS.find(c => c.id === charId) : null;
  return pickDialogueLine(lineObj, ch);
}

function _styleJa(style) {
  return { Grappler:'グラップラー', Striker:'ストライカー', Submission:'サブミッション',
           Aerial:'エアリアル', Allround:'オールラウンダー', Brawler:'ブロウラー' }[style] || style;
}

function _awPortrait(id, cssClass) {
  const url = typeof getUpperUrl === 'function' ? getUpperUrl(id) : '';
  if (url) return `<img src="${url}" alt="" onerror="this.style.display='none'">`;
  const ch = ALL_CHARS.find(c => c.id === id);
  return ch ? ch.name.charAt(0) : '?';
}

// 団体エンブレム（ポートレート外、上部に配置）
function _awOrgEmblem(orgName, isPlayerOrg, size) {
  size = size || 28;
  // orgIdを逆引き
  let orgId = 'player';
  if (!isPlayerOrg && typeof RIVAL_ORGS !== 'undefined') {
    const org = RIVAL_ORGS.find(o => o.name === orgName);
    if (org) orgId = org.id;
  }
  return `<div class="aw-org-emblem">${orgIconHtml(orgId, size)}</div>`;
}

function _awSpeech(name, line) {
  if (!line) return '';
  return `<div class="speech-bubble"><div class="speech-speaker">${name}</div><div class="speech-text">「${line}」</div></div>`;
}

function _mqStars(mq) {
  if (mq >= 90) return '★★★★★';
  if (mq >= 80) return '★★★★';
  if (mq >= 70) return '★★★';
  if (mq >= 60) return '★★';
  return '★';
}

// ── SE (Web Audio) ──────────────────────────────────────────────

let _awAudioCtx = null;
function _awEnsureCtx() { if (!_awAudioCtx) _awAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (_awAudioCtx.state === 'suspended') _awAudioCtx.resume(); }

function _awPlayChime() {
  _awEnsureCtx(); const t = _awAudioCtx.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = _awAudioCtx.createOscillator(), g = _awAudioCtx.createGain();
    o.connect(g); g.connect(_awAudioCtx.destination);
    o.frequency.value = f; o.type = 'sine';
    g.gain.setValueAtTime(0, t+i*.08);
    g.gain.linearRampToValueAtTime(0.18, t+i*.08+.02);
    g.gain.exponentialRampToValueAtTime(0.001, t+i*.08+.5);
    o.start(t+i*.08); o.stop(t+i*.08+.6);
  });
}
function _awPlayMvpFanfare() {
  _awEnsureCtx(); const t = _awAudioCtx.currentTime;
  const n=[523,659,784,1047,784,1047], tm=[0,.12,.24,.36,.5,.6];
  n.forEach((f,i) => {
    const o=_awAudioCtx.createOscillator(),g=_awAudioCtx.createGain();
    o.connect(g);g.connect(_awAudioCtx.destination);
    o.type=i===n.length-1?'sine':'triangle'; o.frequency.value=f;
    g.gain.setValueAtTime(0,t+tm[i]);
    g.gain.linearRampToValueAtTime(0.2,t+tm[i]+.02);
    g.gain.exponentialRampToValueAtTime(0.001,t+tm[i]+(i===n.length-1?1.2:.18));
    o.start(t+tm[i]);o.stop(t+tm[i]+1.5);
  });
}
function _awPlayHofChime() {
  _awEnsureCtx(); const t = _awAudioCtx.currentTime;
  [[130,0],[196,.05],[261,.1],[392,.15],[523,.22]].forEach(([f,d]) => {
    const o=_awAudioCtx.createOscillator(),g=_awAudioCtx.createGain();
    o.connect(g);g.connect(_awAudioCtx.destination);
    o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,t+d);
    g.gain.linearRampToValueAtTime(0.15,t+d+.04);
    g.gain.exponentialRampToValueAtTime(0.001,t+d+1.8);
    o.start(t+d);o.stop(t+d+2);
  });
}
function _awPlayFanfare() {
  _awEnsureCtx(); const t = _awAudioCtx.currentTime;
  [261,329,392,523,659,784].forEach((f,i) => {
    const o=_awAudioCtx.createOscillator(),g=_awAudioCtx.createGain();
    o.connect(g);g.connect(_awAudioCtx.destination);
    o.type='triangle';o.frequency.value=f;
    g.gain.setValueAtTime(0,t+i*.09);
    g.gain.linearRampToValueAtTime(0.14,t+i*.09+.03);
    g.gain.exponentialRampToValueAtTime(0.001,t+i*.09+.5);
    o.start(t+i*.09);o.stop(t+i*.09+.8);
  });
}
function _awPlaySE(type) {
  if (type === 'hof') _awPlayHofChime();
  else if (type === 'mvp') _awPlayMvpFanfare();
  else _awPlayChime();
}

// ── パーティクル ──────────────────────────────────────────────────

function _awSpawnParticles() {
  const el = document.getElementById('aw-particles');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div'); p.className = 'aw-particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    const sz = (2 + Math.random() * 3) + 'px'; p.style.width = p.style.height = sz;
    el.appendChild(p);
  }
}

function _awClearParticles() {
  const el = document.getElementById('aw-particles');
  if (el) el.innerHTML = '';
}

// ── 紙吹雪 ──────────────────────────────────────────────────────

function _awSpawnConfetti() {
  const colors = ['#d4a843','#f0cc6e','#ffffff','#8b1a2a','#c92042'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const c = document.createElement('div'); c.className = 'confetti-piece';
      c.style.left = (10 + Math.random() * 80) + 'vw'; c.style.top = '-10px';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      const sz = (5 + Math.random() * 8) + 'px'; c.style.width = sz; c.style.height = sz;
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      c.style.animationDuration = (1.5 + Math.random() * 2.5) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4500);
    }, i * 25);
  }
}

// ── スライドビルダー (TASK-3) ────────────────────────────────────

function _buildMediaAward(d) {
  const line = _awardLine('mediaAward', d.id);
  const totalRevDisp = Math.round(d.totalRev).toLocaleString();
  const mediaRevDisp = Math.round(d.mediaRevSeason).toLocaleString();
  const talentRevDisp = Math.round(d.talentRevSeason).toLocaleString();
  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">📺</span><span class="badge-jp">メディア功労賞</span></div>
  <div class="media-layout">
    <div>${_awOrgEmblem(d.orgName, d.isPlayerOrg)}<div class="portrait-main"><div class="portrait-glow"></div>${_awPortrait(d.id)}</div></div>
    <div class="media-stats">
      <div class="winner-name" style="font-size:28px">${d.name}</div>
      <div class="winner-sub">${d.orgName || ''} · ${_styleJa(d.style)}</div>
      <div class="media-total">${totalRevDisp}万円</div>
      <div class="media-total-label">年間メディア貢献</div>
      <div class="media-breakdown">
        <div class="media-breakdown-item"><div class="media-breakdown-val">${mediaRevDisp}万</div><div class="media-breakdown-label">出演料等</div></div>
        <div class="media-breakdown-item"><div class="media-breakdown-val">${talentRevDisp}万</div><div class="media-breakdown-label">タレント活動</div></div>
      </div>
      ${d.promoCountSeason > 0 ? `<div class="media-activity-count">📢 プロモ活動 ${d.promoCountSeason}週</div>` : ''}
      ${d.talentCountSeason > 0 ? `<div class="media-activity-count">📋 タレント活動 ${d.talentCountSeason}回</div>` : ''}
      ${_awSpeech(d.name, line)}
    </div>
  </div></div>`;
}

function _buildRookieAward(d) {
  if (!d) return null; // スキップ
  const line = _awardLine('rookie', d.id);
  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">🌟</span><span class="badge-jp">新人王</span></div>
  <div class="rookie-layout">
    <div>${_awOrgEmblem(d.orgName, d.isPlayerOrg)}<div class="portrait-main"><div class="portrait-glow"></div>${_awPortrait(d.id)}</div></div>
    <div>
      <div class="winner-name">${d.name}</div>
      <div class="winner-sub">${d.orgName || ''} · ${d.age}歳</div>
      <div class="winner-tags">
        <span class="aw-tag">${_styleJa(d.style)}</span>
        <span class="aw-tag neutral">OVR ${d.ovr}</span>
        <span class="aw-tag">デビュー1年目</span>
      </div>
      ${_awSpeech(d.name, line)}
    </div>
  </div></div>`;
}

function _buildJTChampionAward(d) {
  const line = _awardLine('rookie', d.id); // JT専用セリフがないのでrookieカテゴリを流用
  const runnerUpText = d.runnerUp ? `決勝: vs ${d.runnerUp.name}${d.runnerUp.orgName ? ` (${d.runnerUp.orgName})` : ''}` : '';
  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">🏟️</span><span class="badge-jp">ジュニアトーナメント優勝</span></div>
  <div class="rookie-layout">
    <div>${_awOrgEmblem(d.orgName, d.isPlayerOrg)}<div class="portrait-main"><div class="portrait-glow"></div>${_awPortrait(d.id)}</div></div>
    <div>
      <div class="winner-name">${d.name}</div>
      <div class="winner-sub">${d.orgName || ''}</div>
      <div class="winner-tags">
        <span class="aw-tag">${_styleJa(d.style)}</span>
        <span class="aw-tag neutral">OVR ${d.ovr}</span>
      </div>
      ${runnerUpText ? `<div style="font-size:11px;color:#7a7060;letter-spacing:1px;margin-bottom:14px">${runnerUpText}</div>` : ''}
      ${_awSpeech(d.name, line)}
    </div>
  </div></div>`;
}

function _buildBestMatchAward(d) {
  const f1 = typeof d.fighter1 === 'object' ? d.fighter1 : { id: null, name: d.fighter1, ovr: 0, style: 'Allround' };
  const f2 = typeof d.fighter2 === 'object' ? d.fighter2 : { id: null, name: d.fighter2, ovr: 0, style: 'Allround' };
  const line1 = _awardLine('bestMatch', f1.id);
  const line2 = _awardLine('bestMatch', f2.id);
  const f1OrgName = d.fighter1OrgName || d.orgName || '';
  const f2OrgName = d.fighter2OrgName || d.orgName || '';
  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">🎬</span><span class="badge-jp">ベストマッチ</span></div>
  <div class="bestmatch-fighters">
    <div class="fighter-side">
      ${_awOrgEmblem(f1OrgName, d.isPlayerOrg, 22)}<div class="portrait-sm">${_awPortrait(f1.id)}</div>
      <div class="fighter-name">${f1.name}</div>
      <div class="fighter-org">${f1OrgName}</div>
    </div>
    <div class="vs-center">
      <div class="mq-display">
        <div class="mq-value">${d.mq}</div>
        <div class="mq-label">MATCH QUALITY</div>
        <div class="mq-stars">${_mqStars(d.mq)}</div>
      </div>
      <div class="vs-text">vs</div>
    </div>
    <div class="fighter-side">
      ${_awOrgEmblem(f2OrgName, false, 22)}<div class="portrait-sm">${_awPortrait(f2.id)}</div>
      <div class="fighter-name">${f2.name}</div>
      <div class="fighter-org">${f2OrgName}</div>
    </div>
  </div>
  <div class="bestmatch-quotes">
    ${_awSpeech(f1.name, line1)}
    ${_awSpeech(f2.name, line2)}
  </div></div>`;
}

function _buildChampionsAward(champions) {
  if (!champions || champions.length === 0) return null;
  // 団体順位順: 1位中央、2位左、3位右
  const c1 = champions[0]; // rank 1
  const c2 = champions[1]; // rank 2
  const c3 = champions[2]; // rank 3

  const buildCol = (c, rank) => {
    if (!c) return '';
    const line = _awardLine('champion', c.id);
    const defText = c.defenses != null ? `防衛 ${c.defenses}回` : '';
    const isPlayer = c.isPlayer;
    return `<div class="champ-col rank-${rank}" id="aw-champ-rank${rank}">
      ${_awOrgEmblem(c.orgName, c.isPlayer, rank === 1 ? 36 : 24)}
      <div class="champ-portrait"><span class="rank-badge">${rank}位</span>${_awPortrait(c.id)}</div>
      <div class="champ-name">${c.name}</div>
      <div class="champ-org" ${isPlayer ? 'style="color:var(--gold-light)"' : ''}>${c.orgName}</div>
      ${defText ? `<div class="champ-defense" ${isPlayer ? 'style="color:var(--gold)"' : ''}>${defText}</div>` : ''}
      <div class="champ-quote">${_awSpeech(c.name, line)}</div>
    </div>`;
  };

  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">🏆</span><span class="badge-jp">タイトル王者</span></div>
  <div class="champions-layout" id="aw-champions-layout">
    ${buildCol(c2, 2)}
    ${buildCol(c1, 1)}
    ${buildCol(c3, 3)}
  </div></div>`;
}

function _buildMVPAward(d) {
  const line = _awardLine('mvp', d.id);
  const defenses = d.defenses || 0;
  const wins = d.wins || 0, losses = d.losses || 0;

  // 実績リスト構築
  const achievements = [];
  achievements.push({ icon: '💪', text: `OVR ${d.ovr}`, sub: _styleJa(d.style) });
  achievements.push({ icon: '🌟', text: `人気 ${Engine.util.dispPop(d.popularity)}`, sub: `${wins}勝${losses}敗` });
  if (d.isChampion) achievements.push({ icon: '🏆', text: '現王者', sub: defenses > 0 ? `防衛 ${defenses}回` : '王座保持中' });
  // careerRecordから当シーズン実績を表示
  const hist = [];
  if (typeof G !== 'undefined') {
    const fighter = (G.roster || []).find(f => f.id === d.id);
    const allFighters = fighter ? [fighter] : [];
    if (!fighter && G.aiOrgs) {
      Object.values(G.aiOrgs).forEach(org => {
        const f = (org.roster || []).find(f => f.id === d.id);
        if (f) allFighters.push(f);
      });
    }
    const f = allFighters[0];
    if (f && f.careerRecord && f.careerRecord.history) {
      f.careerRecord.history.forEach(ev => {
        if (ev.season !== G.season) return;
        if (ev.type === 'titleWin') hist.push({ icon: '👑', text: '王座獲得' });
        if (ev.type === 'titleDefense') hist.push({ icon: '🛡️', text: `王座防衛（${ev.defenseCount || ''}回目）` });
        if (ev.type === 'ppvMainEvent' && ev.won) hist.push({ icon: '🏟️', text: 'PPV優勝' });
        if (ev.type === 'juniorTournament' && ev.result === 'champion') hist.push({ icon: '🏅', text: 'JT優勝' });
      });
    }
  }
  if (hist.length > 0) {
    hist.forEach(h => achievements.push(h));
  }

  const achHtml = achievements.map(a =>
    `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(212,168,67,0.08)">
      <span style="font-size:16px;flex-shrink:0">${a.icon}</span>
      <span style="font-size:13px;font-weight:700;color:#f0ead8;flex:1">${a.text}</span>
      ${a.sub ? `<span style="font-size:11px;color:#7a7060">${a.sub}</span>` : ''}
    </div>`
  ).join('');

  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">👑</span><span class="badge-jp">MVP</span></div>
  <div class="mvp-layout">
    <div>${_awOrgEmblem(d.orgName, d.isPlayerOrg, 32)}<div class="portrait-mvp">${_awPortrait(d.id)}</div></div>
    <div style="flex:1">
      <div class="winner-name" style="font-size:28px;margin-bottom:4px">${d.name}</div>
      <div class="winner-sub" style="margin-bottom:12px">${d.orgName || ''} · ${_styleJa(d.style)}</div>
      <div style="margin-bottom:14px">${achHtml}</div>
      ${_awSpeech(d.name, line)}
    </div>
  </div></div>`;
}

function _buildHallOfFame(d) {
  const line = _awardLine('hallOfFame', d.id);
  const hofLevel = d.hofLevel || 1;
  const starCount = Math.min(hofLevel, 3);
  const stars = Array(starCount).fill('✦').join(' ');

  const statsLine = [];
  if (d.totalDefenses > 0) statsLine.push(`通算防衛 ${d.totalDefenses}回`);
  if (d.titleReigns > 0) statsLine.push(`王座${d.titleReigns}回獲得`);
  if (d.juniorTournamentWins > 0) statsLine.push(`JT優勝${d.juniorTournamentWins}回`);
  if (d.ppvMainEventWins > 0) statsLine.push(`PPV優勝${d.ppvMainEventWins}回`);
  const plaqueText = statsLine.join(' · ') || `${d.activeYears || ''}`;

  return `<div class="award-card" style="text-align:center"><div class="award-badge" style="justify-content:center"><span class="badge-icon">🏛️</span><span class="badge-jp">殿堂入り</span></div>
  <div class="hof-layout">
    ${_awOrgEmblem(d.orgName, d.orgId === 'player', 32)}
    <div class="hof-portrait"><div class="hof-glow-outer"></div>${_awPortrait(d.id)}</div>
    <div class="hof-stars">${stars}</div>
    <div class="hof-name">${d.name}</div>
    <div class="hof-plaque">${plaqueText}</div>
    <div class="hof-player-speech">${_awSpeech(d.name, line)}<div class="hof-tap-hint">タップして続きを見る</div></div>
  </div></div>`;
}

function _buildAwardsSummary(a) {
  const item = (icon, label, winner, detail, fullWidth) =>
    `<div class="summary-item${fullWidth ? ' full-width' : ''}">
      <div class="summary-icon">${icon}</div>
      <div><div class="summary-award">${label}</div>
      <div class="summary-winner" ${fullWidth ? 'style="color:var(--gold-light);font-size:18px"' : ''}>${winner}</div>
      ${detail ? `<div class="summary-org">${detail}</div>` : ''}
      </div></div>`;

  let html = '<div class="award-card"><div class="award-badge"><span class="badge-icon">📜</span><span class="badge-jp">全受賞者一覧</span></div><div class="summary-grid">';

  if (a.mediaAward)
    html += item('📺', 'メディア功労賞', a.mediaAward.name, `貢献 ${Math.round(a.mediaAward.totalRev).toLocaleString()}万円`);
  if (a.rookieOfYear)
    html += item('🌟', '新人王', a.rookieOfYear.name, a.rookieOfYear.orgName);
  if (a.jtChampion)
    html += item('🏟️', 'JT優勝', a.jtChampion.name, a.jtChampion.orgName);
  if (a.bestMatch) {
    const bm1 = typeof a.bestMatch.fighter1 === 'object' ? a.bestMatch.fighter1.name : a.bestMatch.fighter1;
    const bm2 = typeof a.bestMatch.fighter2 === 'object' ? a.bestMatch.fighter2.name : a.bestMatch.fighter2;
    html += item('🎬', 'ベストマッチ', `${bm1} vs ${bm2}`, `MQ ${a.bestMatch.mq}`);
  }
  if (a.champions && a.champions.length > 0) {
    const c1 = a.champions[0];
    const defText = c1.defenses != null ? `防衛 ${c1.defenses}回` : c1.orgName;
    html += item('🏆', 'タイトル王者 1位', c1.name, defText);
  }
  if (a.mvp)
    html += item('👑', 'MVP', a.mvp.name, a.mvp.orgName);

  // 殿堂入り
  const allInductees = [];
  if (a.hallOfFame && a.hallOfFame.length > 0)
    a.hallOfFame.forEach(h => allInductees.push(h));
  if (a.npcInductees && a.npcInductees.length > 0)
    a.npcInductees.forEach(h => allInductees.push(h));

  if (allInductees.length > 0) {
    const names = allInductees.map(h => h.name).join(' / ');
    const details = allInductees.map(h => h.orgName || '').filter(Boolean).join(' / ');
    html += item('🏛️', '殿堂入り', names, details, true);
  }

  html += '</div></div>';
  return html;
}

// ── メインフロー (TASK-4) ────────────────────────────────────────

function showAwardsCeremony(awards, onDone) {
  if (!awards) { if (onDone) onDone(); return; }
  if (_isPopupActive()) { _popupQueue.push(() => showAwardsCeremony(awards, onDone)); return; }

  // スライド構築（動的: 該当なしスキップ）
  const slideInfo = []; // { html, label, se, isChampions, isMvp, isHof, hofData }

  if (awards.mediaAward)
    slideInfo.push({ html: _buildMediaAward(awards.mediaAward), label: 'メディア功労賞', se: 'normal' });
  const rookieHtml = _buildRookieAward(awards.rookieOfYear);
  if (rookieHtml)
    slideInfo.push({ html: rookieHtml, label: '新人王', se: 'normal' });
  if (awards.jtChampion)
    slideInfo.push({ html: _buildJTChampionAward(awards.jtChampion), label: 'JT優勝', se: 'normal' });
  if (awards.bestMatch)
    slideInfo.push({ html: _buildBestMatchAward(awards.bestMatch), label: 'ベストマッチ', se: 'normal' });
  const champHtml = _buildChampionsAward(awards.champions);
  if (champHtml)
    slideInfo.push({ html: champHtml, label: 'タイトル王者', se: 'normal', isChampions: true });
  if (awards.mvp)
    slideInfo.push({ html: _buildMVPAward(awards.mvp), label: 'MVP', se: 'mvp' });
  if (awards.hallOfFame && awards.hallOfFame.length > 0) {
    awards.hallOfFame.forEach(inductee => {
      slideInfo.push({ html: _buildHallOfFame(inductee), label: '殿堂入り', se: 'hof', isHof: true, hofData: inductee });
    });
  }
  // 全受賞者一覧は常に表示
  slideInfo.push({ html: _buildAwardsSummary(awards), label: '全受賞者一覧', se: 'normal' });

  if (slideInfo.length === 0) { if (onDone) onDone(); return; }

  const overlay = document.getElementById('awardsOverlay');
  const slideWrap = document.getElementById('aw-slide-wrap');
  const headerLabel = document.getElementById('aw-header-award-name');
  const dotsEl = document.getElementById('aw-slide-dots');
  const btnNext = document.getElementById('aw-btn-next');
  const fanfareEl = document.getElementById('aw-fanfare-overlay');
  const coachFg = document.getElementById('hof-coach-fg');

  // スライドDOM生成
  slideWrap.innerHTML = '';
  slideInfo.forEach((si, i) => {
    const div = document.createElement('div');
    div.className = 'aw-slide' + (i === 0 ? ' active' : '');
    div.id = 'aw-slide-' + i;
    div.innerHTML = si.html;
    slideWrap.appendChild(div);
  });

  // ドット非表示（削除）
  dotsEl.innerHTML = '';

  // ファンファーレ
  fanfareEl.innerHTML = `
    <div class="fanfare-line-1">シーズン ${awards.season}</div>
    <div class="fanfare-line-2">年間表彰式</div>
    <div class="fanfare-divider"></div>
    <div class="fanfare-sub">全受賞者発表</div>`;
  fanfareEl.style.animation = 'none';
  requestAnimationFrame(() => { fanfareEl.style.animation = ''; });

  // パーティクル
  _awSpawnParticles();

  // コーチFG初期化
  coachFg.innerHTML = '';
  coachFg.classList.remove('revealed');

  let current = 0;
  const TOTAL = slideInfo.length;

  function goToSlide(idx) {
    const slides = slideWrap.querySelectorAll('.aw-slide');
    slides[current].classList.remove('active');
    current = idx;
    slides[current].classList.add('active');
    slides[current].style.animation = 'none';
    requestAnimationFrame(() => { slides[current].style.animation = ''; });

    headerLabel.textContent = 'シーズン ' + awards.season + ' — ' + slideInfo[current].label;
    btnNext.textContent = current === TOTAL - 1 ? '✕ 閉じる' : '次へ　→';

    setTimeout(() => _awPlaySE(slideInfo[current].se), 50);

    // タイトル王者 順番登場
    if (slideInfo[current].isChampions) {
      ['aw-champ-rank1','aw-champ-rank2','aw-champ-rank3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('revealed');
      });
      setTimeout(() => {
        ['aw-champ-rank3','aw-champ-rank2','aw-champ-rank1'].forEach((id, i) => {
          setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.classList.add('revealed');
            if (i < 2) _awPlayChime(); else _awPlayMvpFanfare();
          }, 400 + i * 700);
        });
      }, 200);
    }

    // 殿堂入り紙吹雪 + コーチFG
    window._hofCoachReady = false;
    window._hofCoachRevealed = false;
    if (slideInfo[current].isHof) {
      setTimeout(_awSpawnConfetti, 300);
      _awShowCoachFg(slideInfo[current].hofData, awards);
      // コーチ演出がある場合、次へボタンを無効化 + タップヒント表示
      if (window._hofCoachReady) {
        btnNext.disabled = true;
        btnNext.classList.add('disabled');
      } else {
        // コーチ不在時はタップヒントを非表示
        const hint = slideWrap.querySelector('.aw-slide.active .hof-tap-hint');
        if (hint) hint.style.display = 'none';
      }
    } else {
      coachFg.classList.remove('revealed');
      btnNext.disabled = false;
      btnNext.classList.remove('disabled');
    }
  }

  function nextSlide() {
    if (current >= TOTAL - 1) {
      // 閉じる
      overlay.classList.remove('active');
      _awClearParticles();
      coachFg.classList.remove('revealed');
      coachFg.innerHTML = '';
      window._awardsNext = null;
      if (onDone) onDone();
      _drainPopupQueue();
      return;
    }
    goToSlide(current + 1);
  }

  window._awardsNext = nextSlide;
  btnNext.onclick = function() { if (!btnNext.disabled) nextSlide(); };

  // 殿堂入りスライドのタップ→コーチセリフ切り替え
  slideWrap.addEventListener('click', function(e) {
    // 次へボタン領域は除外
    if (e.target.closest('.aw-btn-next') || e.target.closest('#aw-nav-area')) return;
    if (!window._hofCoachReady || window._hofCoachRevealed) return;
    if (!slideInfo[current].isHof) return;

    window._hofCoachRevealed = true;

    // 選手セリフをフェードアウト
    const playerSpeech = slideWrap.querySelector('.aw-slide.active .hof-player-speech');
    if (playerSpeech) {
      playerSpeech.classList.add('fade-out');
    }

    // 300ms後にコーチFGをフェードイン
    setTimeout(() => {
      coachFg.classList.add('revealed');
      _awPlayChime();
    }, 300);

    // コーチフェードイン完了後（700ms transition）に次へボタンを有効化
    setTimeout(() => {
      btnNext.disabled = false;
      btnNext.classList.remove('disabled');
    }, 1000);
  });

  // 表示開始
  overlay.classList.add('active');
  headerLabel.textContent = 'シーズン ' + awards.season + ' — ' + slideInfo[0].label;

  // 冒頭ファンファーレSE
  setTimeout(() => _awPlayFanfare(), 1000);

  // 3秒後にファンファーレ消えた後、最初のスライドSE
  setTimeout(() => {
    _awPlaySE(slideInfo[0].se);
    // タイトル王者が最初のスライドの場合
    if (slideInfo[0].isChampions) {
      setTimeout(() => {
        ['aw-champ-rank3','aw-champ-rank2','aw-champ-rank1'].forEach((id, i) => {
          setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.classList.add('revealed');
            if (i < 2) _awPlayChime(); else _awPlayMvpFanfare();
          }, 400 + i * 700);
        });
      }, 200);
    }
  }, 3200);

  // BGMはapp.js側で管理（_checkAndShowAwards内で再生開始済み）
}

// ── コーチFG演出 (TASK-5) ────────────────────────────────────────
// プレイヤー自団体の殿堂入り選手の場合のみ発動
function _awShowCoachFg(hofData, awards) {
  const coachFg = document.getElementById('hof-coach-fg');
  if (!coachFg) return;
  coachFg.classList.remove('revealed');
  coachFg.innerHTML = '';

  // 自団体選手でない場合はコーチ演出なし
  if (!hofData || hofData.orgId !== 'player') return;

  // 担当コーチを逆引き（coachAssign = { coachId: [fighterId, ...] }）
  const coachAssign = (typeof G !== 'undefined' && G.coachAssign) || {};
  let assignedCoachId = null;
  for (const [cId, fighters] of Object.entries(coachAssign)) {
    if (fighters && fighters.includes(hofData.id)) { assignedCoachId = parseInt(cId); break; }
  }
  if (assignedCoachId == null) return; // コーチ未割り当て

  const coach = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES.find(c => c.id === assignedCoachId) : null;
  if (!coach) return;

  // セリフ選出
  const lines = (typeof AWARD_LINES !== 'undefined' && AWARD_LINES.hofCoach && AWARD_LINES.hofCoach._default) || [];
  const line = lines.length > 0 ? lines[Math.floor(Math.random() * lines.length)] : '';
  if (!line) return;

  // コーチポートレート
  const coachPortUrl = typeof getCoachPortraitUrl === 'function' ? getCoachPortraitUrl(coach.id) : '';
  const coachPortHtml = coachPortUrl
    ? `<img src="${coachPortUrl}" alt="">`
    : (coach.emoji || '👩‍🏫');

  coachFg.innerHTML = `
    <div class="coach-fg-bubble">
      <div class="speech-speaker">${coach.name} コーチ</div>
      <div class="speech-text">「${line}」</div>
    </div>
    <div class="coach-fg-portrait">
      <div class="coach-fg-badge">COACH</div>
      ${coachPortHtml}
    </div>`;

  // コーチFGは非表示のまま待機（タップで表示する）
  // _hofCoachReady フラグを立てて goToSlide 内のクリックハンドラで使う
  window._hofCoachReady = true;
}


function pickQuote(category) {
  const pool = EVENT_LINES_BY_KEY[category] || ['...'];
  // trait-keyed object の場合は _default にフォールバック
  if (pool && typeof pool === 'object' && !Array.isArray(pool)) {
    const arr = pool._default || ['...'];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// personality×archetype セリフ取得（タイトルマッチリアクション等）
function getTraitQuote(category, char) {
  const pool = EVENT_LINES_BY_KEY[category];
  if (!pool) return '…';
  if (Array.isArray(pool)) return pool[Math.floor(Math.random() * pool.length)];
  return pickDialogueLine(pool, char);
}

// v1.0: Get a draft-context quote for a specific character
function getDraftQuote(char) {
  const pool = EVENT_DRAFT_INTEREST_LINES;
  if (!pool) return getTraitQuote('draftJoin', char);
  return pickDialogueLine(pool, char);
}

// v1.0c: Get FA signing quote (personality×archetype)
function getSigningQuote(char) {
  const pool = EVENT_FA_SIGNING_LINES;
  if (!pool) {
    const generic = EVENT_FA_SIGNING_GENERIC_LINES || ['よろしくお願いします！'];
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return pickDialogueLine(pool, char);
}

// v2.x: Get FA welcome quote after signing (personality×archetype)
function getWelcomeQuote(char) {
  const pool = EVENT_FA_WELCOME_LINES;
  if (!pool) {
    const generic = EVENT_FA_WELCOME_GENERIC_LINES || ['よろしくお願いします！頑張ります！'];
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return pickDialogueLine(pool, char);
}

// v1.0c: Get rental greeting quote (personality×archetype)
function getRentalQuote(char) {
  const pool = EVENT_RENTAL_GREETING_LINES;
  if (!pool) {
    const generic = EVENT_RENTAL_GREETING_GENERIC_LINES || ['よろしくお願いします！'];
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return pickDialogueLine(pool, char);
}

// v1.0: Get a draft "interest" line (when focused, before picking)
function getDraftInterestLine(char) {
  const pool = EVENT_DRAFT_INTEREST_LINES;
  if (!pool) return getTraitQuote('draftJoin', char);
  return pickDialogueLine(pool, char);
}

// ── Fighter Detail Popup ──
// source: 'roster' | 'free' | 'ai:{orgId}' | 'draft'
function findFighter(fighterId, source) {
  if (source === 'roster') return G.roster.find(c => c.id === fighterId);
  if (source === 'free') return G.freeAgents.find(c => c.id === fighterId);
  if (source === 'scout') return (G.scoutCandidates || []).find(c => c.id === fighterId);
  if (source && source.startsWith('ai:')) {
    const orgId = source.slice(3);
    return G.aiOrgs?.[orgId]?.roster?.find(f => f.id === fighterId);
  }
  // Auto-detect: search roster → free → scout → all AI orgs
  let f = G.roster.find(c => c.id === fighterId);
  if (f) return f;
  f = G.freeAgents.find(c => c.id === fighterId);
  if (f) return f;
  f = (G.scoutCandidates || []).find(c => c.id === fighterId);
  if (f) return f;
  if (G.aiOrgs) {
    for (const orgId of Object.keys(G.aiOrgs)) {
      f = G.aiOrgs[orgId].roster?.find(r => r.id === fighterId);
      if (f) return f;
    }
  }
  f = (G.retiredFighters || []).find(c => c.id === fighterId);
  if (f) return f;
  return null;
}

function showFighterPopup(fighterId, source, _skipQueueCheck) {
  const c = findFighter(fighterId, source);
  if (!c) return;
  // 他のポップアップが表示中ならキューに入れる（自分自身のタブ切り替え時はスキップ）
  if (!_skipQueueCheck && _isPopupActive()) {
    // 選手詳細が開いている場合は閉じて即差し替え
    const fpOverlay = document.getElementById('fighterPopupOverlay');
    if (fpOverlay && fpOverlay.classList.contains('active')) {
      fpOverlay.classList.remove('active');
    } else {
      _popupQueue.push(() => showFighterPopup(fighterId, source));
      return;
    }
  }
  Audio.play('hover');

  const STYLE_META = {
    Grappler:   {color:'#bb8fce',icon:'GRP'},
    Striker:    {color:'#e74c3c',icon:'STK'},
    Submission: {color:'#e67e22',icon:'SUB'},
    Aerial:     {color:'#2ecc71',icon:'AER'},
    Allround:   {color:'#f1c40f',icon:'ALL'},
    Brawler:    {color:'#e88a82',icon:'BRW'}
  };
  const sm = STYLE_META[c.style] || STYLE_META.Allround;
  const isRoster = G.roster.some(r => r.id === c.id);
  const isFree = G.freeAgents.some(r => r.id === c.id);
  const isScoutCandidate = (G.scoutCandidates || []).some(r => r.id === c.id);
  let orgLabel = '';
  let negotiateOrgId = null;
  if (!isRoster && !isFree && G.aiOrgs) {
    for (const [oId, oData] of Object.entries(G.aiOrgs)) {
      if (oData.roster?.some(f => f.id === c.id)) {
        const org = RIVAL_ORGS.find(o => o.id === oId);
        orgLabel = org ? `${org.emoji} ${org.name}` : oId;
        negotiateOrgId = oId;
        break;
      }
    }
  }

  const initial = c.name.charAt(0);
  const ovrVal = Engine.util.ov(c);
  // プレイヤー団体 or AI団体の王者判定
  const _playerChamp = G.titles?.world?.championId === c.id;
  const _npcChampOrgData = negotiateOrgId ? G.aiOrgs[negotiateOrgId] : null;
  const _npcChamp = _npcChampOrgData?.titles?.world?.championId === c.id;
  const isChamp = _playerChamp || _npcChamp;
  const _champDefenses = _playerChamp ? G.titles.world.defenses : (_npcChamp ? (_npcChampOrgData.titles.world.defenses || 0) : 0);

  // Stats
  const STATS = [
    {key:'pw',label:'PW',color:'#e74c3c',name:'パワー'},
    {key:'sp',label:'SP',color:'#2ecc71',name:'スピード'},
    {key:'te',label:'TE',color:'#3498db',name:'テクニック'},
    {key:'st',label:'ST',color:'#f39c12',name:'スタミナ'},
    {key:'mn',label:'MN',color:'#9b59b6',name:'マインド'}
  ];

  // Tab state (stored on window for re-rendering)
  window._fpTab = window._fpTab || 0;

  function buildPopup(tabIdx) {
    let html = '';
    const pUrl = getPortraitUrl(c.id);
    const uUrl = getUpperUrl(c.id);

    // ── Header（左: 上半身画像、右: 情報）──
    const popBorderColor = isChamp ? '#d4a843' : 'rgba(200,190,170,0.15)';
    const popShadow = isChamp ? '0 4px 20px rgba(0,0,0,0.5),0 0 16px rgba(212,168,67,0.5)' : '0 4px 20px rgba(0,0,0,0.5)';

    // 上半身画像（onerror時はface画像にフォールバック）
    const imgHtml = uUrl
      ? `<img src="${uUrl}" style="width:200px;height:300px;border-radius:14px;object-fit:cover;object-position:top;border:3px solid ${popBorderColor};box-shadow:${popShadow}" alt="${c.name}" onerror="this.onerror=null;this.src='${pUrl}';this.style.height='140px';this.style.width='140px'">`
      : pUrl
      ? `<img src="${pUrl}" style="width:140px;height:140px;border-radius:14px;object-fit:cover;border:3px solid ${popBorderColor};box-shadow:${popShadow}" alt="${c.name}">`
      : `<div style="width:140px;height:140px;border-radius:14px;background:linear-gradient(135deg,${sm.color}33,${sm.color}11);border:3px solid ${popBorderColor};box-shadow:${popShadow};display:flex;align-items:center;justify-content:center"><span style="font-size:48px;font-weight:900;color:${sm.color}">${initial}</span></div>`;

    html += `<div style="background:${sm.color}0a;border-bottom:1px solid rgba(200,190,170,0.08);padding:20px;text-align:center">
      <div style="display:flex;align-items:flex-start;gap:20px">
        <div style="flex-shrink:0;position:relative">
          ${imgHtml}
          <span style="position:absolute;bottom:-4px;right:-4px;font-size:11px;font-weight:700;background:${sm.color};color:#fff;border-radius:4px;padding:2px 5px;line-height:1;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${sm.icon}</span>
        </div>
        <div style="flex:1;min-width:0;text-align:left">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="font-weight:700;font-size:24px">${c.name}</span>
            <span style="font-size:36px;font-weight:900;color:var(--gold)">${ovrVal}</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
            <span class="badge badge-${c.style}" style="font-size:13px;padding:3px 10px">${c.style}</span>
            ${c.role ? `<span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:13px;padding:3px 10px">${c.role}</span>` : ''}
            ${isChamp ? '<span style="font-size:14px;color:var(--gold);font-weight:700">👑 王者</span>' : ''}
            ${c.lastRun ? '<span style="font-size:13px;color:var(--gold);font-weight:700;background:rgba(212,168,67,0.15);padding:2px 8px;border-radius:4px;border:1px solid rgba(212,168,67,0.4)">🌅 ラストラン</span>' : ''}
            ${c.isRental ? (() => { const ct = (G.rentals || []).find(r => r.fighterId === c.id); return `<span style="font-size:13px;color:#f39c12">🤝 レンタル（残${ct ? ct.weeksLeft : '?'}週）</span>`; })() : ''}
            ${(() => {
              if (!G.factions || !Engine.factions) return '';
              const f = Engine.factions.getFactionByFighterId(G, c.id);
              if (!f) return '';
              const role = f.leaderId === c.id ? 'リーダー'
                : Engine.factions.isExecutive(G, c.id) ? '幹部' : 'メンバー';
              const icon = role === 'リーダー' ? '👑' : role === '幹部' ? '⭐' : '🎭';
              return `<span class="fp-faction-badge" onclick="event.stopPropagation();openFactionPanel(${f.id})" title="派閥タブで詳細を見る">${icon} ${f.name}・${role}</span>`;
            })()}
          </div>
          ${(c.traits && c.traits.length > 0) ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${c.traits.map(t => {
            const td = TRAIT_DEFS[t]; if (!td) return '';
            return '<span title="' + td.desc + '" style="font-size:12px;padding:2px 7px;border-radius:8px;background:' + td.color + '22;color:' + td.color + ';border:1px solid ' + td.color + '44;white-space:nowrap;cursor:help">' + td.icon + ' ' + t + '</span>';
          }).join('')}</div>` : ''}
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:14px;color:var(--text-sub)">
            ${c.age !== undefined ? `<span>📅 ${c.age}歳</span>` : ''}
            ${c.h ? `<span>📏 ${c.h}cm</span>` : ''}
            ${(() => { const decline = Engine.retirement.getDeclinePresentation(c); if (decline.stage === 'terminal') return '<span style="color:#e74c3c">⬇⬇ 限界</span>'; if (decline.stage === 'major') return '<span style="color:#e67e22">⬇ 衰退期</span>'; if (decline.stage === 'early') return '<span style="color:#f1c40f">⚠ 衰え</span>'; return ''; })()}
            ${(() => { const gp = c.growthPenalty; if (!gp) return ''; const m = gp.multiplier; const lbl = m <= 0.2 ? '成長大幅低下' : m <= 0.5 ? '成長低下' : '成長やや低下'; return `<span style="color:#a29bfe">🩹 ${lbl}（残り${gp.remainingWeeks}週）</span>`; })()}
            ${c.hotStreak ? `<span style="color:#ff9500">🔥 絶好調（残り${c.hotStreak.remainingWeeks}週 / OVR+${c.hotStreak.ovrBuff}）</span>` : ''}
            ${c._trainerBuff ? (() => {
              // 社長室 Phase 7: 成長バフ表示 + 信頼度がじわじわ育つことの明示
              // _trainerBuff の出元 (trainer or camp) は pendingTrustDeltas の source から判定
              const weeks = c._trainerBuff.weeksLeft;
              const pending = (c.pendingTrustDeltas || []).find(p => p.source === 'trainer' || p.source === 'camp');
              const label = pending && pending.source === 'camp' ? '合宿' : '専属トレーナー';
              return `<span style="color:#d4a843">🏋️ ${label} 残り${weeks}週 — 信頼もじわじわ育つ</span>`;
            })() : ''}
            ${c.slump ? `<span style="color:#7f8c8d">📉 スランプ中（${c.slump.weeksSinceStart}週目 / 回復確率${(2 + (c.slump.recoveryMomentum || 0)).toFixed(1)}%）</span>` : ''}
            ${c.motivationLoss ? `<span style="color:#95a5a6">😞 モチベ喪失（${c.motivationLoss.weeksSinceStart}週目）</span>` : ''}
            ${(isRoster && !c.isRental && (c.trust != null ? c.trust : 50) < 40) ? '<span style="color:#e67e22;font-weight:700">💔 信頼が揺らいでいる</span>' : ''}
            ${isRoster ? '<span style="color:#2ecc71">🏠 所属中</span>' : ''}
            ${isFree ? '<span style="color:#8bc4f0">🆓 フリー</span>' : ''}
            ${isScoutCandidate ? '<span style="color:#f39c12">🔍 スカウト候補</span>' : ''}
            ${isScoutCandidate && c._isSeed ? '<span style="color:#f1c40f">⭐ 注目候補</span>' : ''}
            ${isScoutCandidate && c._hasCompetition ? '<span style="color:#e74c3c">⚔ 他団体注目</span>' : ''}
            ${orgLabel ? `<span>${orgLabel} 所属</span>` : ''}
          </div>
        </div>
        <button onclick="closeFighterPopup()" style="background:none;border:none;color:var(--text-dim);font-size:22px;cursor:pointer;padding:4px;line-height:1;flex-shrink:0">✕</button>
      </div>
    </div>`;

    // ── 引き抜きアクションバー（AI所属選手のみ）──
    if (negotiateOrgId) {
      const trustBlocked = negotiateOrgId && Engine.negotiate.isNegotiationBlocked(c);
      const canNeg = !trustBlocked && !G.pendingNegotiation && !(G.negotiatedThisSeason || []).includes(c.id);
      const negLabel = trustBlocked
        ? '🔒 忠誠度が高く交渉に応じない'
        : G.pendingNegotiation
          ? (G.pendingNegotiation.fighterId === c.id ? '⏳ 交渉中' : '— 他の選手と交渉中')
          : (G.negotiatedThisSeason || []).includes(c.id) ? '✓ 今季交渉済' : null;
      html += `<div style="padding:8px 16px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(200,190,170,0.08);display:flex;align-items:center;gap:10px">`;
      if (canNeg) {
        html += `<button onclick="closeFighterPopup();showNegotiatePopup('${negotiateOrgId}',${c.id})" style="font-size:13px;padding:6px 18px;background:rgba(212,168,67,0.15);color:var(--gold);border:1px solid rgba(212,168,67,0.4);border-radius:4px;cursor:pointer;font-weight:700">🤝 選手を引き抜く</button>`;
      } else {
        html += `<span style="font-size:13px;color:var(--text-dim)">${negLabel}</span>`;
      }
      html += `</div>`;
    }

    // ── 声をかけるアクションバー(気にかける理由がある選手のみ表示) ──
    // 2段階の温度感:
    //   urgent (オレンジ脈動): slump/motivLoss または trust<40 → 明らかにやばい
    //   gentle (緑・静か)    : trust<50 かつ trust>=40 かつ slump なし → 気になり始め
    // 自発的行動なので決裁枠・資金とも消費しない。
    const curTrust = c.trust != null ? c.trust : 50;
    const hasSlumpIssue = c.slump || c.motivationLoss;
    const hasUrgentTrust = curTrust < 40;
    const hasGentleTrust = curTrust < 50 && curTrust >= 40;
    const canEncourage = isRoster && !c.isRental && !c.injury
      && (hasSlumpIssue || hasUrgentTrust || hasGentleTrust);
    const isUrgent = hasSlumpIssue || hasUrgentTrust;
    // 選手別 cooldown(1週): 今週既に声をかけていれば非活性
    const encourageLastWeek = (c._decisionWeekUsed || {}).encourage || -99;
    const encourageUsedThisWeek = (G.week - encourageLastWeek) < 1;
    if (canEncourage) {
      // 理由テキスト(温度感別)
      let reasonText = '';
      if (c.slump) reasonText = 'スランプ中の選手だ。今日は、少し時間を取ろう。';
      else if (c.motivationLoss) reasonText = 'モチベーションを失いかけている。放っておけない。';
      else if (hasUrgentTrust) reasonText = '最近、この選手の様子が気になっている。';
      else reasonText = '最近、少し様子が気になっている。';

      const variantCls = isUrgent ? 'is-urgent' : 'is-gentle';
      const btnHtml = encourageUsedThisWeek
        ? `<span class="fp-encourage-btn is-done">💬 今週はもう声をかけた</span>`
        : `<button class="fp-encourage-btn ${variantCls}" onclick="App.encourageFighter(${c.id})" title="社長自ら足を運んで声をかける(決裁枠・資金とも消費しない)">💬 声をかけに行く</button>`;
      html += `<div class="fp-encourage-bar ${variantCls}">
        <div class="fp-encourage-reason">${reasonText}</div>
        ${btnHtml}
      </div>`;
    }

    // ── 相関図ボタン(全キャラ共通) ──
    html += `<div style="padding:6px 16px;background:rgba(0,0,0,0.15);border-bottom:1px solid rgba(200,190,170,0.08);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <button onclick="openRelationshipMap(${c.id})" style="font-size:12px;padding:5px 14px;background:rgba(74,143,212,0.12);color:#74b9ff;border:1px solid rgba(74,143,212,0.3);border-radius:4px;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:1px;transition:all .2s" onmouseover="this.style.borderColor='rgba(74,143,212,0.6)'" onmouseout="this.style.borderColor='rgba(74,143,212,0.3)'">🔗 相関図</button>
    </div>`;

    // ── Tab bar（NPC記録統一: 全選手に戦績・経歴タブ表示）──
    const tabs = ['📊 能力'];
    tabs.push('📋 戦績・経歴');
    if (isRoster) tabs.push('⚙️ 管理');
    if (tabIdx >= tabs.length) tabIdx = 0;
    html += `<div style="display:flex;border-bottom:1px solid rgba(200,190,170,0.08);background:rgba(0,0,0,0.15)">
      ${tabs.map((t, i) => `<button onclick="event.stopPropagation();_switchFighterTab(${c.id},'${source||''}',${i})"
        style="flex:1;padding:10px 6px;font-size:13px;background:${i===tabIdx?'rgba(200,190,170,0.05)':'none'};border:none;border-bottom:2px solid ${i===tabIdx?'var(--gold)':'transparent'};color:${i===tabIdx?'var(--text)':'var(--text-dim)'};cursor:pointer;transition:all 0.2s">${t}</button>`).join('')}
    </div>`;

    html += `<div class="fighter-popup-body" style="padding:12px 16px 16px">`;

    // ══════ TAB 0: Stats & Profile ══════
    if (tabIdx === 0) {
      // ── レーダーチャート + ステータスバー 横並び ──
      html += `<div style="display:flex;gap:14px;margin-bottom:12px;align-items:flex-start">`;
      // Left: Radar Chart canvas
      html += `<div style="flex-shrink:0"><canvas id="fpRadarChart" width="200" height="200"></canvas></div>`;
      // Right: Stat bars
      html += `<div style="flex:1;min-width:0">`;
      STATS.forEach(s => {
        const val = Math.round(c[s.key] || 0);
        const sg = Math.round(c.seasonGrowth?.[s.key] || 0);
        const w = Math.min(100, val);
        const valColor = val >= 75 ? s.color : val >= 50 ? 'var(--text)' : 'var(--text-sub)';
        html += `<div class="fighter-popup-stat-row">
          <span class="fighter-popup-stat-label" title="${STAT_TIPS[s.key]}">${s.label}</span>
          <div class="fighter-popup-stat-bar"><div class="fighter-popup-stat-fill" style="width:${w}%;background:${s.color}"></div></div>
          <span class="fighter-popup-stat-val" style="color:${valColor};font-weight:${val>=75?700:400}">${val}${sg > 0 ? `<span style="color:#2ecc71;font-size:11px">+${sg}</span>` : ''}</span>
        </div>`;
      });
      html += `</div></div>`; // end flex row

      // Potential & Condition
      if (isRoster || isFree) {
        const potPct = getPotentialPct(c);
        const potLabel = getPotentialLabel(c);
        const condPct = Math.round(c.condition || 0);
        const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
        html += `<div class="fighter-popup-section" style="display:flex;gap:16px;font-size:13px;margin-bottom:12px">
          <div style="flex:1">
            <span style="color:var(--text-dim)">開発率</span>
            <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <div style="flex:1;height:5px;background:rgba(200,190,170,0.08);border-radius:3px;overflow:hidden">
                <div style="width:${potPct}%;height:100%;background:${potLabel.color};border-radius:3px"></div>
              </div>
              <span style="color:${potLabel.color};font-weight:700;font-size:12px">${potLabel.label}</span>
            </div>
          </div>
          <div style="flex:1">
            <span style="color:var(--text-dim)">体調</span>
            <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <div style="flex:1;height:5px;background:rgba(200,190,170,0.08);border-radius:3px;overflow:hidden">
                <div style="width:${condPct}%;height:100%;background:${condCls};border-radius:3px"></div>
              </div>
              <span style="font-weight:700">${condPct}</span>
            </div>
          </div>
        </div>`;
      }

      // Popularity & Salary
      if (isRoster) {
        html += `<div class="fighter-popup-section" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:10px">
          <div style="padding:6px 8px;background:rgba(200,190,170,0.03);border-radius:4px">
            <span style="color:var(--text-dim)">人気</span><br>
            <strong style="${_scale6Style(_popColor(Engine.util.dispPop(c.popularity)))};font-size:16px">${Engine.util.dispPop(c.popularity)}</strong>
          </div>
          <div style="padding:6px 8px;background:rgba(200,190,170,0.03);border-radius:4px">
            <span style="color:var(--text-dim)">給与</span><br>
            <strong style="color:var(--text);font-size:13px">${getSalary(c)}万/週</strong>
          </div>
        </div>`;
      }
      if (isFree) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);margin-bottom:10px">
          <span>人気: <strong style="${_scale6Style(_popColor(Engine.util.dispPop(c.popularity)))}">${Engine.util.dispPop(c.popularity)}</strong></span>
          <span style="margin-left:12px">給与見込: <strong style="color:var(--text)">${getSalary(c)}万/週</strong></span>
        </div>`;
      }
      if (!isRoster && !isFree && c.popularity !== undefined) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);margin-bottom:10px">
          <span>人気: <strong style="${_scale6Style(_popColor(Engine.util.dispPop(c.popularity)))}">${Engine.util.dispPop(c.popularity)}</strong></span>
        </div>`;
      }

      // Injury
      if (c.injury) {
        html += `<div style="padding:6px 10px;background:rgba(214,48,49,0.1);border:1px solid rgba(214,48,49,0.3);border-radius:4px;font-size:11px;color:#f08b9e;margin-bottom:8px">
          🏥 ${c.injury.type} — 残り${c.injury.weeksLeft}週
        </div>`;
      }

      // Coach
      if (isRoster) {
        const coach = getCharCoach(c.id);
        if (coach) {
          const sm = getCoachStyleMatch(coach, c);
          const matchHtml = sm.icon ? `<span class="coach-match-badge ${sm.cls}" style="margin-left:4px">${sm.icon}${sm.label}+${sm.bonus}</span>` : '<span class="coach-match-badge none" style="margin-left:4px">不一致</span>';
          const styleBadgeCls = sm.type === 'none' ? 'style="font-size:10px;padding:1px 5px;margin-left:4px;border-radius:3px;background:rgba(136,136,136,0.08);color:#888;border:1px solid rgba(136,136,136,0.2);opacity:0.7"' : `class="badge badge-${coach.style}" style="font-size:10px;padding:1px 5px;margin-left:4px"`;
          html += `<div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;padding:6px 8px;background:rgba(200,190,170,0.03);border-radius:4px">
            🎓 <span style="color:var(--text-dim)">担当コーチ:</span>
            <span class="flink" onclick="event.stopPropagation();closeFighterPopup();setTimeout(()=>showCoachTooltip(${coach.id}),200)" style="display:inline-flex;align-items:center;gap:4px">${coachPortraitImg(coach, 18)} ${coach.name}</span>
            <span ${styleBadgeCls}>${coach.style}</span>
            ${matchHtml}
            <span style="color:var(--text-dim);font-size:12px;margin-left:4px">×${coach.gMult||1.0} / ${(coach.abilities||[]).join('・')}</span>
          </div>`;
        } else {
          html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;padding:6px 8px;background:rgba(200,190,170,0.02);border-radius:4px">
            🎓 担当コーチ: なし
          </div>`;
        }
      }

      // ── 試合情報セクション（因縁・ファン期待度・通算戦績）──
      const myRivalries = Object.entries(G.rivalries || {})
        .map(([key, entry]) => {
          const parts = key.split('-').map(Number);
          if (!parts.includes(c.id)) return null;
          const otherId = parts.find(id => id !== c.id);
          const level = Engine.title.getRivalryLevel(G, c.id, otherId);
          return level ? { otherId, entry, level } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (b.level.rivalry || 0) - (a.level.rivalry || 0));

      const myExpects = isRoster
        ? Engine.fanExpect.generate(G).filter(e => e.leftId === c.id || e.rightId === c.id)
        : [];

      if (myRivalries.length > 0 || myExpects.length > 0 || isRoster) {
        html += `<div class="fighter-popup-section" style="padding:10px 12px;background:rgba(200,190,170,0.02);border:1px solid rgba(200,190,170,0.08);border-radius:6px;margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:6px">⚔ 試合情報</div>`;
        if (myRivalries.length > 0) {
          myRivalries.forEach(r => {
            const other = findFighter(r.otherId);
            const lvl = r.level;
            html += `<div style="font-size:12px;margin-bottom:3px">${lvl.emoji} <span style="color:${lvl.color};font-weight:600">${lvl.label}</span>: ${other ? `<span class="flink" onclick="event.stopPropagation();showFighterPopup(${r.otherId},'')">${other.name}</span>` : `ID#${r.otherId}`} <span style="color:var(--text-dim)">(riv ${Math.round(lvl.rivalry || 0)} / ${r.entry.matches || 0}戦)</span></div>`;
          });
        }
        if (myExpects.length > 0) {
          myExpects.forEach(e => {
            const otherId = e.leftId === c.id ? e.rightId : e.leftId;
            const other = findFighter(otherId);
            html += `<div style="font-size:12px;color:#f1c40f;margin-bottom:3px">👥 vs ${other ? other.name : `ID#${otherId}`} が見たい！</div>`;
          });
        }
        if (isRoster) {
          const w = c.wins || 0, l = c.losses || 0, d = c.draws || 0;
          const tot = w + l + d;
          const rate = tot > 0 ? Math.round(w / tot * 100) : 0;
          html += `<div style="font-size:12px;color:var(--text-sub);margin-top:${(myRivalries.length > 0 || myExpects.length > 0) ? 4 : 0}px">📊 通算: <span style="color:#2ecc71">${w}勝</span> <span style="color:#e74c3c">${l}敗</span>${d > 0 ? ` <span>${d}分</span>` : ''} <span style="color:var(--text-dim)">(勝率${rate}%)</span></div>`;
          // 直近5戦表示
          const rm = c.recentMatches || [];
          if (rm.length > 0) {
            const allChars = [...(G.roster || []), ...(G.freeAgents || []), ...(G.retiredFighters || [])];
            const aiRosters = G.aiOrgs ? Object.values(G.aiOrgs).flatMap(o => o.roster || []) : [];
            const lookup = [...allChars, ...aiRosters];
            const items = rm.map(m => {
              const opp = lookup.find(f => f.id === m.opponentId && f.name);
              const name = opp ? opp.name : '???';
              const shortName = name.length > 4 ? name.substring(0, 4) : name;
              const mark = m.result === 'win' ? '○' : m.result === 'loss' ? '×' : '△';
              const color = m.result === 'win' ? '#2ecc71' : m.result === 'loss' ? '#e74c3c' : '#999';
              return `<span style="color:${color};white-space:nowrap">${mark}${shortName}</span>`;
            });
            html += `<div style="font-size:11px;color:var(--text-sub);margin-top:2px">直近: ${items.join(' ')}</div>`;
          }
        }
        html += `</div>`;
      }

      // Traits section（セーブデータから引く。_migrated_npc_traits で付与済み）
      const displayTraits = c.traits || [];
      if (displayTraits.length > 0) {
        html += '<div class="fighter-popup-section" style="margin-bottom:10px"><div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-bottom:8px">固有特性</div>';
        displayTraits.forEach(t => {
          const td = TRAIT_DEFS[t];
          if (!td) return;
          html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px">
            <span style="display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:8px;background:${td.color}22;color:${td.color};border:1px solid ${td.color}44;font-weight:600;min-width:90px">${td.icon} ${t}</span>
            <span style="color:var(--text-sub)">${td.desc}</span></div>`;
        });
        html += '</div>';
      }

      // Profile text
      const profileText = CHAR_PROFILES[c.id];
      if (profileText) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);line-height:1.7;padding:10px 12px;background:rgba(200,190,170,0.03);border-radius:6px;border-left:3px solid ${sm.color}44;margin-top:4px">
          📝 ${profileText}
        </div>`;
      }
    }

    // ══════ TAB 1: Record & Career ══════
    if (tabIdx === 1) {
      // Win/Loss/Draw record
      const wins = c.wins || 0;
      const losses = c.losses || 0;
      const draws = c.draws || 0;
      const totalMatches = wins + losses + draws;
      const winRate = totalMatches > 0 ? Math.round(wins / totalMatches * 100) : 0;

      // ── Build career display from milestones ──
      const milestones = Engine.milestone.get(G, c.id);
      const pOrgName = G.orgName || 'プレイヤー団体';
      const winRateFmt = totalMatches > 0 ? (wins / totalMatches).toFixed(3).slice(1) : '.000';

      // ── Compact Record Row（NPC記録統一: 全選手に戦績表示）──
      {
        const summary = Engine.career.buildSummary(c);
        const bestMQ = summary.bestMQ || c.bestMQ || (c.careerBestMQ || 0);
        html += `<div style="margin-bottom:12px;padding:9px 12px;background:rgba(200,190,170,0.04);border:1px solid var(--border);border-radius:6px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px">
            <span style="font-size:11px;font-weight:700;color:var(--gold);background:rgba(212,168,67,0.18);padding:2px 7px;border-radius:3px;flex-shrink:0">戦績</span>
            <span style="color:#2ecc71;font-weight:700">${wins}勝</span>
            <span style="color:#e74c3c;font-weight:700">${losses}敗</span>
            <span style="color:#b0b8c4;font-weight:700">${draws}分</span>
            <span style="color:var(--text-dim);font-size:11px">(${winRateFmt})</span>
            ${totalMatches > 0 ? `<span style="color:var(--text-dim)">勝率</span><span style="color:var(--gold);font-weight:700">${winRate}%</span>` : ''}
            ${bestMQ ? `<span style="color:var(--text-dim);margin-left:2px">｜ ベストMQ</span><span style="${_scale6Style(_mqColor(bestMQ))};font-weight:700">${bestMQ}</span>` : ''}
            ${isChamp ? `<span style="color:var(--gold);font-size:12px;font-weight:700">｜ 👑 王者（${_champDefenses}防衛）</span>` : ''}
            ${summary.peakOVR > 0 && !isChamp ? `<span style="color:var(--text-dim);margin-left:2px">｜ ピーク</span><span style="${_scale6Style(_ovrColor(summary.peakOVR))};font-weight:700">OVR ${summary.peakOVR}</span><span style="color:var(--text-dim);font-size:11px">(S${summary.peakSeason})</span>` : ''}
          </div>
          ${(() => {
            const tbo = summary.titleByOrg || [];
            if (tbo.length === 0) return summary.titleSummary ? `<div style="margin-top:6px;font-size:12px;color:var(--gold)">🏆 ${summary.titleSummary}</div>` : '';
            return tbo.map(t => {
              const body = t.wins > 1 ? `${t.wins}度戴冠・通算${t.defenses}度防衛` : `${t.defenses}度防衛`;
              return `<div style="margin-top:6px;font-size:12px;color:var(--gold)">🏆 元${t.orgName}王者（${body}）</div>`;
            }).join('');
          })()}
          ${summary.juniorTournamentWins > 0 || summary.ppvMainEventWins > 0 ? `<div style="margin-top:4px;font-size:12px;display:flex;gap:12px">${summary.juniorTournamentWins > 0 ? `<span style="color:#e67e22">🏅 JT優勝 <strong>${summary.juniorTournamentWins}</strong>回</span>` : ''}${summary.ppvMainEventWins > 0 ? `<span style="color:#9b59b6">🏅 PPV優勝 <strong>${summary.ppvMainEventWins}</strong>回</span>` : ''}</div>` : ''}
          ${(() => { const warEvts = ((c.careerRecord || {}).history || []).filter(e => e.type === 'war'); const wW = warEvts.filter(e => e.won).length; const wL = warEvts.length - wW; return warEvts.length > 0 ? `<div style="margin-top:4px;font-size:12px"><span style="color:#2c3e50">🏴 対抗戦 <strong style="color:#2ecc71">${wW}勝</strong> <strong style="color:#e74c3c">${wL}敗</strong></span></div>` : ''; })()}
          ${(() => { const hist = (c.careerRecord || {}).history || []; const mvp = hist.filter(e => e.type === 'awardMVP').length; const rookie = hist.some(e => e.type === 'awardRookie'); const bm = hist.filter(e => e.type === 'awardBestMatch').length; const media = hist.filter(e => e.type === 'awardMedia').length; const parts = []; if (mvp) parts.push(`<span style="color:#f1c40f">👑 MVP <strong>${mvp}</strong>回</span>`); if (rookie) parts.push(`<span style="color:#f1c40f">🌟 新人王</span>`); if (bm) parts.push(`<span style="color:#e67e22">🎬 ベストマッチ <strong>${bm}</strong>回</span>`); if (media) parts.push(`<span style="color:#3498db">📺 メディア功労賞 <strong>${media}</strong>回</span>`); return parts.length > 0 ? `<div style="margin-top:4px;font-size:12px;display:flex;gap:12px;flex-wrap:wrap">${parts.join('')}</div>` : ''; })()}
        </div>`;
      }

      // ── Milestone Timeline / Career History（NPC記録統一: 全選手に表示）──
      if (milestones.length > 0) {
        // Group by season
        const bySeason = {};
        milestones.forEach(m => {
          const s = m.season || 1;
          if (!bySeason[s]) bySeason[s] = [];
          bySeason[s].push(m);
        });
        const seasons = Object.keys(bySeason).map(Number).sort((a, b) => b - a);

        html += `<div style="margin-bottom:14px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="background:#3498db;color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">年表</span>
            キャリア年表
          </h5>`;

        seasons.forEach(s => {
          const seasonMs = bySeason[s];
          // Find season summary if exists
          const summary = seasonMs.find(m => m.type === 'season_end');
          const nonSummary = seasonMs.filter(m => m.type !== 'season_end');
          const isCurrentSeason = s === G.season;

          html += `<details ${isCurrentSeason ? 'open' : ''} style="margin-bottom:10px">
            <summary style="font-size:13px;cursor:pointer;padding:8px 12px;background:rgba(200,190,170,0.04);border:1px solid var(--border);border-radius:6px;user-select:none;display:flex;align-items:center;gap:8px">
              <span style="font-weight:900;color:var(--text);font-size:14px">[${s}年目]</span>
              ${summary ? `<span style="font-size:12px;color:var(--text-sub)">${summary.detail}</span>` :
                isCurrentSeason ? `<span style="font-size:12px;color:var(--blue)">シーズン進行中</span>` : ''}
            </summary>
            <div style="padding:6px 0 2px 8px;border-left:2px solid rgba(200,190,170,0.08);margin-left:6px;margin-top:6px">`;

          nonSummary.forEach(m => {
            const typeStyle = Engine.milestone._typeStyle(m.type);
            html += `<div style="padding:5px 10px;margin-bottom:4px;font-size:13px;display:flex;align-items:baseline;gap:8px;line-height:1.5">
              <span style="color:var(--text-dim);font-size:11px;flex-shrink:0;min-width:54px;text-align:right">${m.week ? `${m.week}週` : '—'}</span>
              <span style="color:${typeStyle.color};flex-shrink:0">${typeStyle.icon}</span>
              <span style="color:var(--text)">${m.text}</span>
            </div>`;
            if (m.detail) {
              html += `<div style="padding:0 10px 4px 70px;font-size:11px;color:var(--text-dim);line-height:1.4">${m.detail}</div>`;
            }
          });

          html += `</div></details>`;
        });

        html += `</div>`;
      } else {
        html += `<div style="font-size:13px;color:var(--text-dim);padding:14px;text-align:center;background:rgba(200,190,170,0.02);border-radius:6px">まだキャリア記録がありません</div>`;
      }

      // v1.3-2: §4.4/§7.1 経歴（怪我記録）セクション（NPC記録統一: 全選手に表示）
      const hist = c.careerHistory || [];
      if (hist.length > 0) {
        html += `<div style="margin-bottom:14px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="background:#a29bfe;color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">経歴</span>
            怪我・重大事項
          </h5>`;
        [...hist].reverse().forEach(h => {
          const typeColor = h.type === 'injury_retirement' ? '#e74c3c' : '#e17055';
          const typeIcon  = h.type === 'injury_retirement' ? '🏁' : '🩹';
          const seasonStr = h.season ? `${h.season}年目` : '';
          const weekStr   = h.week   ? ` ${h.week}週` : '';
          html += `<div style="padding:6px 10px;margin-bottom:4px;font-size:13px;display:flex;align-items:baseline;gap:8px;border-left:2px solid ${typeColor}33;padding-left:10px;line-height:1.5">
            <span style="color:var(--text-dim);font-size:11px;flex-shrink:0;min-width:70px;font-family:'Courier New',monospace">${seasonStr}${weekStr}</span>
            <span style="flex-shrink:0">${typeIcon}</span>
            <span style="color:var(--text)">${h.detail}</span>
          </div>`;
        });
        html += `</div>`;
      }
    }

    // ══════ TAB 2: Management (Roster only) ══════
    if (tabIdx === 2 && isRoster) {
      if (!c.isRental) {
        // §5.1 引退セクション
        const canAdvise = Engine.retirement.canAdvise(c);
        if (c.lastRun) {
          // ラストラン中
          const lastRunStart = c.lastRunWeek || 0;
          const currentAbsWeek = Engine.util.absWeekTotal(G.season, G.week, G.offSeason, G.offWeek);
          const weeksLeft = Math.max(0, 4 - (currentAbsWeek - lastRunStart));
          html += `<div style="margin-top:8px;padding:12px 14px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.3);border-radius:6px;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:4px">🌅 ラストラン中</div>
            <div style="font-size:12px;color:var(--text-sub)">引退試合をカードに組みましょう。（期限 あと約${weeksLeft}週）</div>
          </div>`;
        } else if (canAdvise) {
          // 引退勧告可能
          const cooldown = c.retireAdviceCooldown || 0;
          const advice = Engine.coach.getRetireAdvice(G, c.id);
          html += `<div style="margin-top:8px;padding:12px 14px;background:rgba(212,168,67,0.05);border:1px solid rgba(212,168,67,0.2);border-radius:6px;margin-bottom:10px">
            <div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:6px;border-bottom:1px solid rgba(212,168,67,0.15);padding-bottom:4px">─── 引退 ───</div>`;
          if (advice.text) {
            html += `<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px;padding:6px 8px;background:rgba(200,190,170,0.03);border-radius:4px;border-left:2px solid rgba(212,168,67,0.4)">
              💬 <span style="color:var(--text-dim)">${advice.coachName}</span>「${advice.text}」
            </div>`;
          }
          if (cooldown > 0) {
            html += `<button disabled style="font-size:13px;padding:8px 14px;background:rgba(200,190,170,0.04);border:1px solid rgba(200,190,170,0.1);color:var(--text-dim);border-radius:6px;width:100%;cursor:not-allowed">🌅 引退を勧める（クールダウン ${cooldown}週）</button>`;
          } else {
            html += `<button onclick="closeFighterPopup();doRetireAdvise(${c.id})" style="font-size:13px;padding:8px 14px;background:rgba(212,168,67,0.15);border:1px solid rgba(212,168,67,0.4);color:var(--gold);border-radius:6px;width:100%;cursor:pointer;font-weight:700">🌅 引退を勧める</button>`;
          }
          html += `</div>`;
        }

        // 解雇ボタン
        const inCard = G.showCard.some(m => m.left === c.id || m.right === c.id);
        html += `<div style="margin-top:4px;padding:14px;background:rgba(196,30,58,0.06);border:1px solid rgba(196,30,58,0.15);border-radius:6px">
          <div style="font-size:12px;font-weight:700;color:#f08b9e;margin-bottom:6px;border-bottom:1px solid rgba(196,30,58,0.2);padding-bottom:4px">─── 契約 ───</div>
          <div style="font-size:13px;color:var(--text-sub);margin-bottom:10px">⚠️ 選手の解雇は取り消せません。</div>
          <button onclick="closeFighterPopup();App.startReleaseInterview(${c.id})" style="font-size:13px;padding:10px 16px;cursor:pointer;background:rgba(196,30,58,0.2);border:1px solid rgba(196,30,58,0.4);color:#f08b9e;border-radius:6px;width:100%" ${inCard ? 'disabled title="カード登録中"' : ''}>🚪 この選手を解雇する</button>
          ${inCard ? '<div style="font-size:11px;color:var(--text-dim);margin-top:8px;text-align:center">※興行カード登録中のため解雇できません</div>' : ''}
        </div>`;
      }
      if (c.isRental) {
        html += `<div style="font-size:11px;color:#f39c12;padding:8px;text-align:center">🤝 レンタル選手のため管理操作は制限されています</div>`;
      }
    }

    // ══════ Acquire Button (Free Agents & Scout Candidates) ══════
    if (isFree && tabIdx === 0) {
      const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
      const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
      const signingCost = Engine.scout.getSigningCost(c, G.orgPop || 0);
      const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c, 'fa', G);
      const viaTicket = Engine.scout.isEliteTicketRequired(G.orgPop || 0, c, G);
      const canAfford = G.funds >= signingCost;
      // roster-cap v1.0
      const _ownRosterCount = G.roster.filter(f => !f.isRental).length;
      const _rCap = G.rosterCap || 8;
      const _rosterFull = _ownRosterCount >= _rCap;
      html += `<div style="margin-top:12px;padding:14px;background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.15);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">
          <span style="color:var(--text-sub)">契約金</span>
          <span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${Math.round(signingCost).toLocaleString()}万</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;color:var(--text-dim)">
          <span>ランク: <span style="color:${tierCfg.color}">${tierCfg.label}</span></span>
          <span>給与: ${getSalary(c)}万/週</span>
          ${scoutDisc > 0 ? `<span style="color:#f39c12">🔍 スカウト網割引${scoutDisc}%</span>` : ''}
        </div>
        ${viaTicket ? '<div style="text-align:center;font-size:13px;color:#f1c40f;padding:6px 8px;margin-bottom:8px;background:rgba(241,196,15,0.1);border:1px solid rgba(241,196,15,0.3);border-radius:6px">🎫 逸材特別交渉枠を使用します（1回限り）</div>' : ''}
        ${_rosterFull
          ? `<div style="text-align:center;font-size:13px;color:#e74c3c;padding:8px">🏢 ロスター枠が上限（${_rCap}名）に達しています</div>`
          : !canNeg
            ? `<div style="text-align:center;font-size:13px;color:#e74c3c;padding:8px">⛔ 知名度不足（団体人気 ${tierCfg.reqPop} 以上で交渉可能）</div>`
            : `<button onclick="closeFighterPopup();showSigningCeremony(${c.id})" style="width:100%;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:rgba(46,204,113,0.2);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:6px" ${canAfford?'':'disabled'}>✍ この選手と契約する</button>
            ${!canAfford ? '<div style="font-size:11px;color:#e74c3c;text-align:center;margin-top:6px">💸 資金不足</div>' : ''}`
        }
      </div>`;
    }
    if (isScoutCandidate && tabIdx === 0) {
      const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
      const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
      const signingCost = Engine.scout.getSigningCost(c, G.orgPop || 0);
      const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c);
      const canAfford = G.funds >= signingCost;
      const picks = G.scoutPicks || [];
      const maxPicks = G.scoutMaxPicks || 3;
      const slotsLeft = picks.length < maxPicks;
      // roster-cap v1.0
      const _scoutOwnCount = G.roster.filter(f => !f.isRental).length;
      const _scoutCap = G.rosterCap || 8;
      const _scoutFull = _scoutOwnCount >= _scoutCap;
      html += `<div style="margin-top:12px;padding:14px;background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.15);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">
          <span style="color:var(--text-sub)">契約金</span>
          <span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${Math.round(signingCost).toLocaleString()}万</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:12px;color:var(--text-dim)">
          <span>ランク: <span style="color:${tierCfg.color}">${tierCfg.label}</span></span>
          <span>獲得枠: ${picks.length}/${maxPicks}</span>
          ${scoutDisc > 0 ? `<span style="color:#f39c12">🔍 割引${scoutDisc}%</span>` : ''}
        </div>
        ${c._hasCompetition ? `<div style="font-size:11px;color:#e74c3c;margin-bottom:8px;padding:4px 8px;background:rgba(231,76,60,0.1);border-radius:4px">⚔ 他団体が注目 — 競合時: ${Math.round(signingCost * (c._compMultiplier || 1.5))}万</div>` : ''}
        ${_scoutFull
          ? `<div style="text-align:center;font-size:13px;color:#e74c3c;padding:8px">🏢 ロスター枠が上限（${_scoutCap}名）に達しています</div>`
          : !canNeg
            ? `<div style="text-align:center;font-size:13px;color:#e74c3c;padding:8px">⛔ 知名度不足（団体人気 ${tierCfg.reqPop} 以上で交渉可能）</div>`
            : !slotsLeft
            ? `<div style="text-align:center;font-size:13px;color:var(--text-dim);padding:8px">獲得枠上限に達しています</div>`
            : `<div style="display:flex;gap:8px">
                <button onclick="closeFighterPopup();scoutPick(${c.id})" style="flex:1;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:rgba(46,204,113,0.2);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:6px" ${canAfford?'':'disabled'}>✍ 獲得指名</button>
                <button onclick="closeFighterPopup();scoutResolve(${c.id},'skip')" style="padding:10px 16px;font-size:13px;cursor:pointer;background:rgba(200,190,170,0.04);border:1px solid rgba(200,190,170,0.12);color:var(--text-dim);border-radius:6px">見送り</button>
              </div>
              ${!canAfford ? '<div style="font-size:11px;color:#e74c3c;text-align:center;margin-top:6px">💸 資金不足</div>' : ''}`
        }
      </div>`;
    }

    html += `</div>`; // end body
    return html;
  }

  const popupHtml = buildPopup(window._fpTab || 0);
  document.getElementById('fighterPopupBox').innerHTML = popupHtml;
  document.getElementById('fighterPopupOverlay').classList.add('active');

  // ── レーダーチャート描画（DOM挿入後に実行）
  if ((window._fpTab || 0) === 0) {
    const cvs = document.getElementById('fpRadarChart');
    if (cvs) {
      const radarData = STATS.map(s => ({ label: s.label, value: c[s.key] || 0, color: s.color }));
      drawRadarChart(cvs, radarData, { fillColor: sm.color, fillAlpha: 0.25 });
    }
  }
}

function closeFighterPopup() {
  window._fpTab = 0; // Reset to first tab
  document.getElementById('fighterPopupOverlay').classList.remove('active');
  _drainPopupQueue();
}

// タブ切り替え専用関数：キュー判定をスキップして直接再描画
function _switchFighterTab(fighterId, source, tabIdx) {
  window._fpTab = tabIdx;
  showFighterPopup(fighterId, source, true); // true = キュー判定スキップ
}

// Phase 6: 相関図画面を開く
function openRelationshipMap(charId) {
  closeFighterPopup();
  showScreen('database');
  _dbSubTab = 4; // relmap tab
  _relmapCenterId = charId;
  _relmapFilter = 'all';
  _relmapSelected = null;
  renderDatabase();
}

/** 派閥タブへ遷移してカードをハイライト（選手ポップアップの派閥バッジから呼ばれる） */
function openFactionPanel(factionId) {
  closeFighterPopup();
  showScreen('database');
  _dbSubTab = 7;
  _factionHighlightId = factionId;
  renderDatabase();
}

/** PPV VS比較ポップアップ — 両選手のステータスを並べて表示 */
function showPPVVSDetail(matchIdx) {
  const pp = App._ppvPreview;
  if (!pp || !pp.card[matchIdx]) return;
  const match = pp.card[matchIdx];
  const left = match.left, right = match.right;
  Audio.play('hover');

  const STYLE_META = {
    Grappler:{color:'#bb8fce',icon:'GRP'}, Striker:{color:'#e74c3c',icon:'STK'},
    Submission:{color:'#e67e22',icon:'SUB'}, Aerial:{color:'#2ecc71',icon:'AER'},
    Allround:{color:'#f1c40f',icon:'ALL'}, Brawler:{color:'#e88a82',icon:'BRW'}
  };
  const STATS = [
    {key:'pw',label:'PW',name:'パワー',color:'#e74c3c'},
    {key:'sp',label:'SP',name:'スピード',color:'#2ecc71'},
    {key:'te',label:'TE',name:'テクニック',color:'#3498db'},
    {key:'st',label:'ST',name:'スタミナ',color:'#f39c12'},
    {key:'mn',label:'MN',name:'マインド',color:'#9b59b6'}
  ];

  function renderSide(f) {
    const sm = STYLE_META[f.style] || STYLE_META.Allround;
    const ovr = Engine.util.ov(f);
    const orgColor = f._ppvOrgId === 'player' ? 'var(--blue)' : (RIVAL_ORGS.find(o => o.id === f._ppvOrgId)?.color || 'var(--text-main)');
    const url = getPortraitUrl(f.id);
    const imgHtml = url
      ? `<img src="${url}" style="width:72px;height:72px;border-radius:50%;border:2px solid ${orgColor}66;object-fit:cover" alt="">`
      : portraitImg(f.id, 72);

    let html = `<div style="text-align:center;flex:1;min-width:130px">`;
    html += imgHtml;
    html += `<div style="font-size:14px;font-weight:700;color:${orgColor};margin-top:6px">${f.name}</div>`;
    html += `<div style="font-size:10px;color:var(--text-dim);margin-bottom:6px">${f._ppvOrgName || ''}</div>`;
    html += `<div style="font-size:11px;margin-bottom:2px"><span class="badge badge-${f.style}" style="font-size:10px;padding:1px 6px">${f.style}</span>`;
    if (f.role) html += ` <span class="badge badge-${f.role==='Babyface'?'bf':f.role==='Heel'?'heel':'neutral'}" style="font-size:10px;padding:1px 6px">${f.role}</span>`;
    html += `</div>`;
    html += `<div style="font-size:28px;font-weight:900;color:var(--gold);margin:4px 0">${ovr}</div>`;
    // 各ステータスバー
    STATS.forEach(s => {
      const val = f[s.key] || 0;
      html += `<div style="display:flex;align-items:center;gap:4px;margin:2px 0;font-size:10px">`;
      html += `<span style="width:20px;text-align:right;color:var(--text-dim)">${s.label}</span>`;
      html += `<div style="flex:1;height:6px;background:rgba(200,190,170,0.08);border-radius:3px;overflow:hidden">`;
      html += `<div style="width:${val}%;height:100%;background:${s.color};border-radius:3px"></div>`;
      html += `</div>`;
      html += `<span style="width:22px;color:var(--text-sub);font-weight:600">${val}</span>`;
      html += `</div>`;
    });
    // 特性
    const traits = (f.traits || []).filter(t => t);
    if (traits.length > 0) {
      html += `<div style="margin-top:6px;font-size:10px;color:var(--text-sub)">`;
      html += traits.map(t => {
        const td = typeof TRAIT_DATA !== 'undefined' ? TRAIT_DATA[t] : null;
        return `<span style="background:rgba(200,190,170,0.08);padding:1px 5px;border-radius:3px;margin:1px">${td?.label || t}</span>`;
      }).join(' ');
      html += `</div>`;
    }
    // 人気
    html += `<div style="margin-top:4px;font-size:10px;color:var(--text-dim)">人気 ${Engine.util.dispPop(f.popularity)}</div>`;
    html += `</div>`;
    return html;
  }

  const matchNum = matchIdx + 1;
  const matchLabel = match.isSummit ? '🏆 メインイベント — 頂上決戦' : `第${matchNum}試合`;

  let html = `<div style="padding:16px">`;
  html += `<div style="text-align:center;font-size:14px;color:var(--gold);font-weight:700;margin-bottom:12px">${matchLabel}</div>`;
  html += `<div style="display:flex;align-items:flex-start;gap:12px;justify-content:center">`;
  html += renderSide(left);
  html += `<div style="font-size:18px;font-weight:900;color:var(--text-dim);padding-top:60px">VS</div>`;
  html += renderSide(right);
  html += `</div>`;
  // 因縁情報
  if (match.isRivalry) {
    const level = Engine.title.getRivalryLevel(G, left.id, right.id);
    if (level) {
      const pairKey = `${Math.min(left.id, right.id)}-${Math.max(left.id, right.id)}`;
      const entry = (G.rivalries || {})[pairKey] || {};
      html += `<div style="text-align:center;margin-top:10px;font-size:12px;color:${level.color}">${level.emoji} ${level.label} (riv ${Math.round(level.rivalry || 0)} / ${entry.matches || 0}戦)</div>`;
    }
  }
  html += `<div style="text-align:center;margin-top:14px">`;
  html += `<button class="btn" style="padding:8px 24px;font-size:13px;background:var(--bg-mid);color:var(--text-sub)" onclick="closeFighterPopup()">閉じる</button>`;
  html += `</div>`;
  html += `</div>`;

  const box = document.getElementById('fighterPopupBox');
  box.innerHTML = html;
  document.getElementById('fighterPopupOverlay').classList.add('active');
}

// ── Name link helper ──
// Returns clickable HTML for a fighter name. Use everywhere.
function fLink(c, opts = {}) {
  const src = opts.source || '';
  const extra = opts.suffix || '';
  const cls = opts.bold !== false ? 'font-weight:700;' : '';
  const size = opts.size || '';
  const sizeStyle = size ? `font-size:${size};` : '';
  // skipQueue: オーバーレイ上から呼ぶ場合にキューチェックをスキップ
  const skipArg = opts.skipQueue ? ',true' : '';
  return `<span class="flink" style="${cls}${sizeStyle}" onclick="event.stopPropagation();showFighterPopup(${c.id},'${src}'${skipArg})">${c.name}</span>${extra}`;
}

function moveShowCard(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= G.showCard.length) return;
  // メインイベント(位置0)にタッグ枠を移動させない
  const card = [...G.showCard];
  if (target === 0 && card[idx].matchType === 'tag') { Audio.play('error'); return; }
  if (idx === 0 && card[target].matchType === 'tag') { Audio.play('error'); return; }
  [card[idx], card[target]] = [card[target], card[idx]];
  G = { ...G, showCard: card };
  renderShowPrep();
}

// タッグ枠保持ヘルパー: 既存タッグ枠を保持し、タッグ選手IDを除外セットに追加
function _preserveTagSlots(maxMatches) {
  const tags = G.showCard.filter(m => m.matchType === 'tag');
  const tagUsed = new Set();
  tags.forEach(t => {
    [t.teamA.fighter1, t.teamA.fighter2, t.teamB.fighter1, t.teamB.fighter2]
      .filter(id => id > 0).forEach(id => tagUsed.add(id));
  });
  const tagWeight = tags.length * 2;
  const singlesCount = maxMatches - tagWeight;
  return { tags, tagUsed, singlesCount };
}
function autoFillCard() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const { tags, tagUsed, singlesCount } = _preserveTagSlots(maxMatches);
  const card = [];
  for (let i = 0; i < singlesCount; i++) card.push({left:0, right:0, isTitle:false});
  const sorted = [...G.roster].filter(c => !c.injury && !c.forcedRest && !tagUsed.has(c.id)).sort((a,b) => ov(b) - ov(a));
  const used = new Set();
  const numMatches = Math.min(singlesCount, Math.floor(sorted.length / 2));
  const champId = G.titles.world.championId;
  for (let i = 0; i < numMatches; i++) {
    const left = sorted.find(c => !used.has(c.id));
    if (!left) break;
    used.add(left.id);
    const right = sorted.find(c => !used.has(c.id));
    if (!right) break;
    used.add(right.id);
    const hasChamp = champId && (left.id === champId || right.id === champId);
    const isVacant = !champId;
    const cdOk = Engine.title.canTitleMatch(G).allowed;
    const slotHasRental = (left.isRental || right.isRental);
    const slotIsTitle = i === 0 && G.titleEstablished && cdOk && (hasChamp || isVacant) && !slotHasRental;
    card[i] = {left: left.id, right: right.id, isTitle: slotIsTitle};
  }
  // タッグ枠を末尾に追加
  tags.forEach(t => card.push(t));
  G = { ...G, showCard: card };
}

// ── おすすめ編成: matchAppeal合計最大化 ──
function autoFillCardByAppeal() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const { tags, tagUsed, singlesCount } = _preserveTagSlots(maxMatches);
  const available = G.roster.filter(c => !c.injury && !c.forcedRest && !tagUsed.has(c.id));
  if (available.length < 2) { autoFillCard(); return; }

  const fanExpects = Engine.fanExpect.generate(G) || [];
  const feSet = new Set(fanExpects.map(fe => [fe.leftId, fe.rightId].sort().join('-')));

  const pairs = [];
  for (let i = 0; i < available.length; i++) {
    for (let j = i + 1; j < available.length; j++) {
      const a = available[i], b = available[j];
      const fr = Engine.freshness.calc(G.matchupLog || [], a.id, b.id, G.totalShows, G.roster.length, null);
      const rivLevel = Engine.title.getRivalryLevel(G, a.id, b.id);
      const pendingClash = rivLevel?.pendingClashBonus || 0;
      const rivAB = G.relationships ? (G.relationships[`${a.id}>${b.id}`]?.rivalry || 0) : 0;
      const rivBA = G.relationships ? (G.relationships[`${b.id}>${a.id}`]?.rivalry || 0) : 0;
      const pairKey = [a.id, b.id].sort().join('-');
      const ctx = {
        rivalry: Math.max(rivAB, rivBA), isTitle: false, isFanExpect: feSet.has(pairKey),
        pendingClashBonus: pendingClash, isFirstMeet: fr.isFirstMeet, freshnessCount: fr.countInWindow,
      };
      pairs.push({ aId: a.id, bId: b.id, appeal: Engine.attendanceV2.calcMatchAppeal(a, b, ctx, G) });
    }
  }

  pairs.sort((x, y) => y.appeal - x.appeal);
  const card = [];
  const used = new Set();
  for (const p of pairs) {
    if (card.length >= singlesCount) break;
    if (used.has(p.aId) || used.has(p.bId)) continue;
    card.push({ left: p.aId, right: p.bId, isTitle: false });
    used.add(p.aId);
    used.add(p.bId);
  }

  _applyAutoTitleMatch(card);
  while (card.length < singlesCount) card.push({ left: 0, right: 0, isTitle: false });
  tags.forEach(t => card.push(t));
  G = { ...G, showCard: card };
}

// ── 集客力順編成: drawPower合計最大化 ──
function autoFillCardByDraw() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const { tags, tagUsed, singlesCount } = _preserveTagSlots(maxMatches);
  const available = G.roster.filter(c => !c.injury && !c.forcedRest && !tagUsed.has(c.id));
  if (available.length < 2) { autoFillCard(); return; }

  const pairs = [];
  for (let i = 0; i < available.length; i++) {
    for (let j = i + 1; j < available.length; j++) {
      const a = available[i], b = available[j];
      const drawSum = Engine.attendanceV2.calcDrawPower(a, G) + Engine.attendanceV2.calcDrawPower(b, G);
      pairs.push({ aId: a.id, bId: b.id, drawSum });
    }
  }

  pairs.sort((x, y) => y.drawSum - x.drawSum);
  const card = [];
  const used = new Set();
  for (const p of pairs) {
    if (card.length >= singlesCount) break;
    if (used.has(p.aId) || used.has(p.bId)) continue;
    card.push({ left: p.aId, right: p.bId, isTitle: false });
    used.add(p.aId);
    used.add(p.bId);
  }

  _applyAutoTitleMatch(card);
  while (card.length < singlesCount) card.push({ left: 0, right: 0, isTitle: false });
  tags.forEach(t => card.push(t));
  G = { ...G, showCard: card };
}

// ── 自動編成共通: メインイベントのタイトルマッチ判定 ──
function _applyAutoTitleMatch(card) {
  if (!card.length || !G.titleEstablished) return;
  const cdOk = Engine.title.canTitleMatch(G).allowed;
  if (!cdOk) return;
  const champId = G.titles.world.championId;
  if (champId) {
    // 王者在位: 王者が含まれるスロットをメインに移動してタイトル戦に
    const champIdx = card.findIndex(m => m.left === champId || m.right === champId);
    if (champIdx < 0) return;
    if (champIdx !== 0) { [card[0], card[champIdx]] = [card[champIdx], card[0]]; }
    card[0].isTitle = true;
  } else {
    // 王座空位: メイン枠（両選手が埋まっていれば）を初代王者決定戦に
    if (card[0] && card[0].left > 0 && card[0].right > 0) {
      // レンタル選手チェック
      const hasRental = [card[0].left, card[0].right].some(id => G.roster.find(c => c.id === id)?.isRental);
      if (!hasRental) card[0].isTitle = true;
    }
  }
}

function onCardSelect(slotIndex, side, newId) {
  App.setShowCardSlot(slotIndex, side, newId);
}

function toggleTitle(slotIndex) {
  if (!G.titleEstablished) { alert('団体王座はまだ設立されていません（興行3回・人気15・ロスター5人で設立）'); return; }
  const m = G.showCard[slotIndex];
  // v1.2: タイトルONにする場合のみクールダウンチェック（OFFにする場合はスキップ）
  if (!m.isTitle) {
    const cd = Engine.title.canTitleMatch(G);
    if (!cd.allowed) { alert(`タイトルマッチは12週に1回のみ開催できます（あと${cd.weeksLeft}週）`); return; }
    // Rental restriction
    const hasRental = [m.left, m.right].some(id => id > 0 && G.roster.find(c => c.id === id)?.isRental);
    if (hasRental) { alert('レンタル選手はタイトルマッチに出場できません'); return; }
  }
  const champId = G.titles.world.championId;
  if (!champId && !m.isTitle) {
    if (!(m.left > 0 && m.right > 0)) { alert('両選手を選んでください'); return; }
  } else if (champId) {
    if (m.left !== champId && m.right !== champId) { alert('タイトルマッチはチャンピオンを含む必要があります'); return; }
    // 挑戦資格チェック（タイトルON時のみ）
    if (!m.isTitle) {
      const challengerId = m.left === champId ? m.right : m.left;
      if (challengerId > 0) {
        const eligibleIds = Engine.title.getEligibleChallengers(G.roster, champId);
        if (!eligibleIds.includes(challengerId)) {
          const chal = G.roster.find(c => c.id === challengerId);
          alert(`${chal?.name || '選手'}はタイトル挑戦資格がありません（OVR上位5位以内 or 最高OVRとの差8以内）`);
          return;
        }
      }
    }
  }
  App.toggleTitleMatch(slotIndex);
}

// MQ star rating display
function mqStars(mq) {
  const stars = mq >= 90 ? 5 : mq >= 75 ? 4.5 : mq >= 60 ? 4 : mq >= 50 ? 3.5 :
    mq >= 40 ? 3 : mq >= 30 ? 2.5 : mq >= 20 ? 2 : mq >= 10 ? 1.5 : 1;
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (half) s += '☆';
  const color = stars >= 4.5 ? '#f0d078' : stars >= 3.5 ? '#2ecc71' : stars >= 2.5 ? '#e8e6e0' : '#999';
  return `<span style="color:${color};font-size:13px;letter-spacing:1px">${s}</span>`;
}

// (applyMQPopularity / applyShowPopularity moved to Engine — no longer needed here)

// v1.0: Mission clear celebration — tap to dismiss
function dismissMissionClear(missionId, el) {
  Audio.play('award');
  el.classList.remove('new-clear');
  el.classList.add('clearing');
  // Remove from pending clears
  const pending = (G.missionNewClears || []).filter(id => id !== missionId);
  G = { ...G, missionNewClears: pending };
  // After animation, refresh
  setTimeout(() => { refreshAll(); }, 550);
}

// Show prep entry point (routes through App for state changes)
function startShowPrep() {
  if (G.offSeason || G.weekPhase !== 'manage' || !isShowWeek(G.week)) { Audio.play('error'); return; }
  // L1: 前回の会場を維持。初回のみbaseAttendanceベースでスマート選択
  let venueIdx = G.showVenue || 0;
  if (G.totalShows === 0 && G.showVenue === 0) {
    const baseAtt = Engine.economy.calcBaseAttendance(G.orgPop);
    for (let i = VENUES.length - 1; i >= 0; i--) {
      if (baseAtt >= VENUES[i].cap * 0.6) { venueIdx = i; break; }
    }
  }
  // Set show prep state
  G = {
    ...G,
    weekPhase: 'showPrep',
    showVenue: venueIdx,
    showCard: (G.showCard.length === 0 || G.showCard.every(m => m.left === 0 && m.right === 0))
      ? [] : [...G.showCard]
  };
  if (G.showCard.length === 0) autoFillCardByAppeal();
  Audio.bgm.play('management');
  showScreen('show');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => { if (b.textContent.includes('興行準備')) b.classList.add('active'); });
  renderShowPrep();
}

// Legacy aliases for UI onclick handlers
function executeShow() { App.executeShow(); }
function closeShowResult() { App.closeShowResult(); }
function doProcessWeek() { App.advanceCurrentFlow(); }
// v1.0: Instant schedule→action preview update
function updateSchedulePreview(fighterId, newSchedule) {
  const c = G.roster.find(r => r.id === fighterId);
  if (!c) return;
  c.schedule = newSchedule;
  // Predict action (mirrors Engine processManage logic)
  let action = newSchedule;
  if (c.injury) action = '療養';
  else if (c.intensive) action = 'intensive';
  else {
    if (action === 'balance') action = isShowWeek(G.week) ? 'promo' : 'practice';
    if (action !== 'rest' && c.condition < 60) action = 'auto_rest';
  }
  const actionLabels = {practice:'練習',promo:'プロモ',rest:'休養',auto_rest:'🔄休養',balance:'バランス','療養':'療養',intensive:'⚡強化'};
  const label = actionLabels[action] || action;
  // Update the cell in the table
  const cell = document.getElementById('action-' + fighterId);
  if (cell) cell.innerHTML = `<span class="sched-tag ${action}">${label}</span>`;
}
function advanceWeek() { App.advanceCurrentFlow(); }

// ═══ Battle Engine postMessage Listener (v0.86) ═══
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'BATTLE_FINISH_CUE') {
    try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.stop(); } catch(err) {}
    try { if (typeof Audio !== 'undefined' && Audio.bgm) Audio.bgm.stop(); } catch(err) {}
    return;
  }
  if (e.data && e.data.type === 'MATCH_RESULT') {
    App.receiveBattleResult(e.data);
  }
});

// ═══ Match Preview Renderer (v0.86) ═══
/** 通常興行ステータスバー列（5カラム用） */
function _showStatItem(label, lv, rv, cls, side) {
  const val = side === 'left' ? Math.round(lv) : Math.round(rv);
  const other = side === 'left' ? Math.round(rv) : Math.round(lv);
  const hi = val > other ? ' hi' : '';
  return `<div class="smc-stat-item"><span class="smc-stat-val${hi}">${val}</span><span class="smc-stat-label">${label}</span></div>
    <div class="smc-stat-bar"><div class="smc-stat-fill ${cls}" style="width:${Math.max(4, val)}%"></div></div>`;
}

function renderMatchPreview() {
  const sp = App._showPreview;
  if (!sp) return;

  if (typeof App._fillMissingShowPreviewResults === 'function') {
    App._fillMissingShowPreviewResults();
  } else {
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      if (!charL || !charR) {
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      }
    });
  }
  if (sp.results.every(r => r !== null)) {
    try { App.finalizeShow(); } catch(e) {
      console.error('finalizeShow error:', e);
      const overlay = document.getElementById('showResultOverlay');
      const box = document.getElementById('showResultBox');
      box.innerHTML = `<div class="show-result-title">エラー</div>
        <div style="text-align:center;color:var(--text-sub);margin-bottom:16px">興行結果の処理中にエラーが発生しました。<br><span style="font-size:11px;color:var(--text-dim)">${e.message}</span></div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn btn-gold" onclick="try{App.finalizeShow()}catch(e){alert('再試行失敗: '+e.message)}">🔄 再試行</button>
          <button class="btn" style="background:var(--bg-mid);color:var(--text-sub)" onclick="App.skipAllMatches()">⏩ スキップで確定</button>
        </div>`;
      overlay.classList.add('active');
    }
    return;
  }

  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const special = isSpecialShow(G.week);
  const ppv = isPPV(G.week);
  const showName = ppv ? '🏆 PPV GRAND FINAL' : special ? '⭐ 特別興行' : `第${G.totalShows + 1}回 定期興行`;
  const resolved = sp.results.filter(r => r !== null).length;
  const total = sp.validMatches.length;

  let nextIdx = -1;
  for (let i = total - 1; i >= 0; i--) {
    if (sp.results[i] === null) { nextIdx = i; break; }
  }

  // ヘッダー
  let html = `<div class="show-header">
    <div class="show-label">Weekly Show</div>
    <div class="show-title">${showName}</div>
    <div class="show-progress">全${total}試合 ─ ${resolved}/${total} 完了</div>
  </div>`;

  html += `<div class="match-list">`;
  for (let idx = 0; idx < total; idx++) {
    const m = sp.validMatches[idx];
    const result = sp.results[idx];
    const isResolved = result !== null;
    const isNext = idx === nextIdx;
    const isMain = idx === 0;
    const order = total - idx;
    const matchLabel = isMain ? '★ メインイベント' : `第${order}試合`;
    const cardClass = isMain ? 'card-main' : 'card-sub';
    const borderColor = isMain ? 'rgba(212,168,67,0.25)' : isNext ? 'rgba(74,143,212,0.3)' : 'rgba(200,190,170,0.08)';
    const cardBg = isMain ? 'rgba(212,168,67,0.04)' : isNext ? 'rgba(74,143,212,0.05)' : 'rgba(0,0,0,0.25)';
    const statusBadge = isResolved
      ? '<span class="smc-badge done">完了</span>'
      : isNext ? '<span class="smc-badge next">次戦</span>'
      : '<span class="smc-badge wait">待機</span>';

    // ── タッグマッチプレビュー ──
    if (m.matchType === 'tag') {
      const tA1 = G.roster.find(c => c.id === m.teamA.fighter1);
      const tA2 = G.roster.find(c => c.id === m.teamA.fighter2);
      const tB1 = G.roster.find(c => c.id === m.teamB.fighter1);
      const tB2 = G.roster.find(c => c.id === m.teamB.fighter2);
      if (!tA1 || !tA2 || !tB1 || !tB2) continue;
      const _tagFighter = (f) => {
        const upper = getUpperUrl(f.id);
        const ovr = Engine.util.ov(f);
        const pw = f.pw||0, sp2 = f.sp||0, te = f.te||0, st = f.st||0;
        const isChamp = G.titles?.world?.championId === f.id;
        return `<div class="smc-tag-fighter">
          <div class="upper-wrap">${upper ? `<img src="${upper}" alt="${f.name}" onerror="this.style.display='none'">` : portraitImg(f.id, 72)}</div>
          <div class="smc-tag-info">
            ${isChamp ? '<span class="smc-tag-champ-mark">👑</span>' : ''}
            <div class="fname">${f.name}</div>
            <div class="smc-tag-ovr-row">
              <span class="smc-tag-style-label">${f.style || '—'}</span>
              <span class="ovr-line">OVR&thinsp;<span class="ovr-num">${ovr}</span></span>
            </div>
            <div class="smc-tag-statbars">
              <div class="smc-tag-srow"><span class="smc-tag-sl">PW</span><div class="smc-tag-strk"><div class="smc-tag-sfill pw" style="width:${pw}%"></div></div></div>
              <div class="smc-tag-srow"><span class="smc-tag-sl">SP</span><div class="smc-tag-strk"><div class="smc-tag-sfill sp" style="width:${sp2}%"></div></div></div>
              <div class="smc-tag-srow"><span class="smc-tag-sl">TE</span><div class="smc-tag-strk"><div class="smc-tag-sfill te" style="width:${te}%"></div></div></div>
              <div class="smc-tag-srow"><span class="smc-tag-sl">ST</span><div class="smc-tag-strk"><div class="smc-tag-sfill st" style="width:${st}%"></div></div></div>
            </div>
          </div>
        </div>`;
      };
      const bondA = G.relationships ? ((G.relationships[`${Math.min(tA1.id,tA2.id)}>${Math.max(tA1.id,tA2.id)}`] || {}).bond || 50) : 50;
      const bondB = G.relationships ? ((G.relationships[`${Math.min(tB1.id,tB2.id)}>${Math.max(tB1.id,tB2.id)}`] || {}).bond || 50) : 50;
      html += `<div class="match-card ${cardClass}" data-match-next="${isNext}" style="background:${cardBg};border:1px solid ${borderColor};opacity:${isResolved ? 1 : isNext ? 1 : 0.55}">`;
      html += `<div class="smc-head">
        <span class="smc-label" style="font-size:${isMain ? '18px' : '15px'};color:${isMain ? 'var(--gold)' : 'var(--text-sub)'}">${matchLabel}</span>
        ${statusBadge} <span class="smc-tag-badge">TAG MATCH</span>
      </div>`;
      html += `<div class="smc-tag-arena">
        <div class="smc-tag-team left">${_tagFighter(tA1)}${_tagFighter(tA2)}<div class="smc-tag-chem">🤝 ${Math.round(bondA)}</div></div>
        <div class="smc-vs"><div class="smc-vs-text">VS</div></div>
        <div class="smc-tag-team right">${_tagFighter(tB1)}${_tagFighter(tB2)}<div class="smc-tag-chem">🤝 ${Math.round(bondB)}</div></div>
      </div>`;
      if (isResolved) {
        let wNames = '引き分け';
        if (result.winner === 'teamA') wNames = `${tA1.name} & ${tA2.name}`;
        else if (result.winner === 'teamB') wNames = `${tB1.name} & ${tB2.name}`;
        html += `<div class="smc-result">
          <span class="winner-tag">🏆 ${wNames} 勝利</span>
          <span class="finish">${(result.finType || result.finMove) ? Engine.formatFinish(result.finType, result.finMove) : ''} / ${result.turns}ターン</span>
          <span class="mq" style="${_scale6Style(_mqColor(result.mq))}">MQ ${result.mq}</span>
        </div>`;
      } else if (isNext) {
        html += `<div class="smc-action">
          <button class="smc-btn-watch" onclick="App.watchMatch(${idx})">🎬 試合を観る</button>
          <button class="smc-btn-skip" onclick="App.skipMatch(${idx})">≫ スキップ</button>
        </div>`;
      }
      html += `</div>`;
      continue;
    }

    // ── シングルマッチプレビュー ──
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) continue;
    const titleTag = m.isTitle ? ' <span class="smc-title-tag">🏆 タイトル戦</span>' : '';

    const upperL = getUpperUrl(charL.id);
    const upperR = getUpperUrl(charR.id);
    const imgW = isMain ? 120 : 100;
    const imgH = isMain ? 150 : 125;
    const ovrL = Engine.util.ov(charL), ovrR = Engine.util.ov(charR);

    // 関係性データ
    const relAB = (G.relationships || {})[`${charL.id}>${charR.id}`] || { bond: 50, rivalry: 0 };
    const relBA = (G.relationships || {})[`${charR.id}>${charL.id}`] || { bond: 50, rivalry: 0 };
    const bondAvg = Math.round((relAB.bond + relBA.bond) / 2);
    const rivMax = Math.max(relAB.rivalry, relBA.rivalry);
    const bondColor = _bondColor(bondAvg).color;
    const rivalLvl = getRivalryLevel(charL.id, charR.id);
    const relParts = [];
    if (rivalLvl) {
      relParts.push(`<span style="color:${rivalLvl.color};font-weight:700">${rivalLvl.emoji}${rivalLvl.label}（MQ+${rivalLvl.mqBonus}）</span>`);
    } else if (rivMax > 10) {
      relParts.push(`<span style="color:#e67e22">⚡ 因縁 ${Math.round(rivMax)}</span>`);
    }
    relParts.push(`<span style="color:${bondColor}">🤝 友好 ${bondAvg}</span>`);

    // 勝者/敗者判定（完了試合用）
    const leftIsWinner = isResolved && result.winner === 'left';
    const rightIsWinner = isResolved && result.winner === 'right';
    const leftCharClass = isResolved ? (leftIsWinner ? 'winner' : 'loser') : isNext ? 'player' : '';
    const rightCharClass = isResolved ? (rightIsWinner ? 'winner' : 'loser') : isNext ? 'enemy' : '';
    const leftDimmed = isResolved && !leftIsWinner ? ' dimmed' : '';
    const rightDimmed = isResolved && !rightIsWinner ? ' dimmed' : '';

    html += `<div class="match-card ${cardClass}" data-match-next="${isNext}" style="background:${cardBg};border:1px solid ${borderColor};opacity:${isResolved ? 1 : isNext ? 1 : 0.55}">`;

    // ヘッド行
    html += `<div class="smc-head">
      <span class="smc-label" style="font-size:${isMain ? '18px' : '15px'};color:${isMain ? 'var(--gold)' : 'var(--text-sub)'}">${matchLabel}</span>
      ${statusBadge}${titleTag}
    </div>`;

    // 5カラムアリーナ
    html += `<div class="smc-arena">`;
    // 左ステータス
    html += `<div class="smc-stat-col left${leftDimmed}">`;
    html += _showStatItem('PW', charL.pw||0, charR.pw||0, 'pw', 'left');
    html += _showStatItem('SP', charL.sp||0, charR.sp||0, 'sp', 'left');
    html += _showStatItem('TE', charL.te||0, charR.te||0, 'te', 'left');
    html += _showStatItem('ST', charL.st||0, charR.st||0, 'st', 'left');
    html += _showStatItem('MN', charL.mn||0, charR.mn||0, 'mn', 'left');
    html += `</div>`;

    // 左キャラ
    html += `<div class="smc-char ${leftCharClass}">
      <button type="button" onclick="showFighterPopup(${charL.id}, 'roster')" style="background:none;border:none;padding:0;cursor:pointer">
        <div class="upper-wrap"${isNext ? ' style="border-color:rgba(52,152,219,0.4)"' : ''}>
          ${upperL ? `<img src="${upperL}" alt="${charL.name}" onerror="this.style.display='none'">` : portraitImg(charL.id, imgW)}
        </div>
      </button>
      <div class="fname">${charL.name}</div>
      <div class="ovr-line"><span class="ovr-label">OVR</span><span class="ovr-num">${ovrL}</span></div>
    </div>`;

    // VS
    html += `<div class="smc-vs"><div class="smc-vs-text">VS</div></div>`;

    // 右キャラ
    html += `<div class="smc-char ${rightCharClass}">
      <button type="button" onclick="showFighterPopup(${charR.id}, 'roster')" style="background:none;border:none;padding:0;cursor:pointer">
        <div class="upper-wrap"${isNext ? ' style="border-color:rgba(231,76,60,0.4)"' : ''}>
          ${upperR ? `<img src="${upperR}" alt="${charR.name}" onerror="this.style.display='none'">` : portraitImg(charR.id, imgW)}
        </div>
      </button>
      <div class="fname">${charR.name}</div>
      <div class="ovr-line"><span class="ovr-label">OVR</span><span class="ovr-num">${ovrR}</span></div>
    </div>`;

    // 右ステータス
    html += `<div class="smc-stat-col right${rightDimmed}">`;
    html += _showStatItem('PW', charL.pw||0, charR.pw||0, 'pw', 'right');
    html += _showStatItem('SP', charL.sp||0, charR.sp||0, 'sp', 'right');
    html += _showStatItem('TE', charL.te||0, charR.te||0, 'te', 'right');
    html += _showStatItem('ST', charL.st||0, charR.st||0, 'st', 'right');
    html += _showStatItem('MN', charL.mn||0, charR.mn||0, 'mn', 'right');
    html += `</div>`;
    html += `</div>`; // smc-arena

    // 関係性ストリップ
    html += `<div class="smc-rel">${relParts.join('<span class="sep">|</span>')}</div>`;

    // ステータス別ボトム
    if (isResolved) {
      const wName = result.winner === 'draw' ? '引き分け' : result.winner === 'left' ? charL.name : charR.name;
      html += `<div class="smc-result">
        <span class="winner-tag">🏆 ${wName} 勝利</span>
        <span class="finish">${(result.finType || result.finMove) ? Engine.formatFinish(result.finType, result.finMove) : ''} / ${result.turns}ターン</span>
        <span class="mq" style="${_scale6Style(_mqColor(result.mq))}">MQ ${result.mq}</span>
      </div>`;
    } else if (isNext) {
      html += `<div class="smc-action">
        <button class="smc-btn-watch" onclick="App.watchMatch(${idx})">🎬 試合を観る</button>
        <button class="smc-btn-skip" onclick="App.skipMatch(${idx})">≫ スキップ</button>
      </div>`;
    }

    html += `</div>`; // match-card
  }
  html += `</div>`; // match-list

  const remaining = sp.results.filter(r => r === null).length;
  if (remaining > 0) {
    html += `<div class="smc-skip-all"><button onclick="App.skipAllMatches()">残り全試合をスキップ（${remaining}試合）</button></div>`;
  }

  box.innerHTML = html;
  overlay.classList.add('active');
  if (nextIdx >= 0) {
    const nextEl = box.querySelector('[data-match-next="true"]');
    if (nextEl) setTimeout(() => nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    // 試合前モーダル/フレーバー: 宣戦布告 → 初顔合わせ等の順に per-match 表示
    // (specs/match-flavor-popup-spec-v0.1.md §4.2)
    const cMap = sp.confrontationMap;
    const hasConfrontation = cMap && cMap[nextIdx] && !sp._shownConfrontations.has(nextIdx);
    if (hasConfrontation) {
      sp._shownConfrontations.add(nextIdx);
      setTimeout(() => showRivalryPopups([cMap[nextIdx]], () => {
        if (typeof App !== 'undefined' && App._runPreMatchFlavorForMatch) App._runPreMatchFlavorForMatch(nextIdx);
      }), 400);
    } else {
      setTimeout(() => {
        if (typeof App !== 'undefined' && App._runPreMatchFlavorForMatch) App._runPreMatchFlavorForMatch(nextIdx);
      }, 400);
    }
  }
}
// ── Show Result Renderer ────────────────────────────────
let _pendingMatchDialogues = [];

function renderShowResult(results, injuryResults) {
  _pendingMatchDialogues = [];
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  const special = isSpecialShow(G.week);
  const ppv = isPPV(G.week);
  const avgMQ = Math.round(results.reduce((s,r) => s + r.mq, 0) / results.length);
  const heat = getHeatLevel();

  const venue = VENUES[G.showVenue];
  const attendance = G.lastShowAttendance || 0;
  const cap = venue.cap;
  const occRate = cap > 0 ? attendance / cap : 0;
  const occPct = Math.round(occRate * 100);
  const occEntry = OCCUPANCY_BONUS.find(b => occRate >= b.min) || OCCUPANCY_BONUS[OCCUPANCY_BONUS.length - 1];
  const attendCls = _pbAttendClass(occRate);

  // 週ラベル（月/週）
  const week = G.week || 1;
  const monthIdx = Math.floor((week - 1) / 4) + 1;
  const weekInMonth = ((week - 1) % 4) + 1;
  const monthLabel = `${monthIdx}月 第${weekInMonth}週`;

  // Banner
  const liveText = special ? '⭐ MONTHLY SPECIAL' : '● ON AIR';
  const liveCls = special ? 'pb-live is-special' : 'pb-live';
  const titleCls = special ? 'pb-banner-title is-special' : 'pb-banner-title';
  const showName = special ? '特 別 興 行' : `第 ${G.totalShows} 回 定期興行`;

  let html = `<div class="pb-container">`;
  html += `<div class="pb-banner">
    <div class="${liveCls}">${liveText}</div>
    <div class="${titleCls}">${escHtml(showName)}</div>
    <div class="pb-banner-sub">Year ${G.year || 1}<span class="dot">·</span>Week ${week}<span class="dot">·</span>${monthLabel}</div>
  </div>`;

  // Hero: Attendance (客入り) — most prominent element
  const avgStarsHtml = _pbStars(avgMQ);
  const heatScoreCls = (heat.id === 'hot' || heat.id === 'on_fire') ? 'is-hot' :
                      (heat.id === 'cold' || heat.id === 'ice_cold') ? 'is-cold' : 'is-neutral';
  const heatScoreVal = heat.label.toUpperCase();
  const injuryCount = injuryResults.length;
  html += `<div class="pb-attend-hero">
    <div class="pb-attend-hero-label">客　入　り</div>
    <div class="pb-attend-hero-rating ${attendCls}">${escHtml(occEntry.label)}</div>
    <div class="pb-attend-hero-num">
      <span class="pb-attend-hero-val">${attendance.toLocaleString()}</span>
      <span class="pb-attend-hero-sep">/</span>
      <span class="pb-attend-hero-cap">${cap.toLocaleString()}</span>
      <span class="pb-attend-hero-pct ${attendCls}">${occPct}%</span>
    </div>
    <div class="pb-attend-hero-bar"><div class="pb-attend-hero-bar-fill ${attendCls}" style="width:${Math.min(occPct,100)}%"></div></div>
    <div class="pb-attend-hero-venue">会場: ${escHtml(venue.name)}</div>
  </div>`;

  // Secondary strip — 4 cells (MQ / Heat / Matches / Injuries)
  html += `<div class="pb-score-strip">
    <div class="pb-score-cell">
      <div class="pb-score-stars">${avgStarsHtml}</div>
      <div class="pb-score-val" style="margin-top:3px">${avgMQ}</div>
      <div class="pb-score-lbl">Avg MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val ${heatScoreCls === 'is-neutral' ? 'is-neutral' : ''}" ${heatScoreCls === 'is-hot' ? 'style="color:var(--c-rivalry)"' : heatScoreCls === 'is-cold' ? 'style="color:var(--c-info)"' : ''}>${heatScoreVal}</div>
      <div class="pb-score-lbl">Heat</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val is-neutral">${results.length}</div>
      <div class="pb-score-lbl">Matches</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val ${injuryCount > 0 ? '' : 'is-neutral'}" ${injuryCount > 0 ? 'style="color:var(--c-negative)"' : ''}>${injuryCount}</div>
      <div class="pb-score-lbl">Injuries</div>
    </div>
  </div>`;

  html += `<div class="pb-divider">Match Results</div>`;
  html += `<div class="pb-matches">`;

  const _srValidMatches = G.lastShowResults === results
    ? (App._showPreview?.validMatches || G.showCard.filter(m => m.matchType === 'tag' ? (m.teamA?.fighter1 > 0) : (m.left > 0 && m.right > 0)))
    : G.showCard;

  results.forEach((r, i) => {
    const isMain = i === 0;
    const spotlightInMatch = G.mediaSpotlight && (
      (r.left && G.mediaSpotlight.fighterId === r.left.id) ||
      (r.right && G.mediaSpotlight.fighterId === r.right.id)
    );
    const injuriesThisMatch = injuryResults.filter(ir => {
      const ids = r.matchType === 'tag'
        ? (() => {
            const sm = _srValidMatches[i];
            if (!sm || sm.matchType !== 'tag') return [];
            return [sm.teamA?.fighter1, sm.teamA?.fighter2, sm.teamB?.fighter1, sm.teamB?.fighter2].filter(Boolean);
          })()
        : [r.left?.id, r.right?.id];
      return ids.includes(ir.id);
    });

    // Tags
    const tags = [];
    if (r.matchType === 'tag') tags.push(`<span class="pb-tag is-tag">TAG MATCH</span>`);
    if (r.isTitleMatch) tags.push(`<span class="pb-tag is-title">🏆 タイトルマッチ</span>`);
    if (r.rivalryResolved) tags.push(`<span class="pb-tag is-rivalry">⚡ 決着！</span>`);
    else if (r.rivalryBonus) tags.push(`<span class="pb-tag is-rivalry">⚔ ${escHtml(r.rivalryBonus.label || '因縁')}</span>`);
    if (r.freshnessBonus) {
      if (r.freshnessBonus > 0) tags.push(`<span class="pb-tag is-first">✨ ${escHtml(r.freshnessLabel || '初顔合わせ')}</span>`);
      else tags.push(`<span class="pb-tag is-stale">😐 ${escHtml(r.freshnessLabel || 'フレッシュ度低')}</span>`);
    }
    if (spotlightInMatch) tags.push(`<span class="pb-tag is-spotlight">📺 取材中</span>`);

    // ── Tag match ──
    if (r.matchType === 'tag') {
      const sm = _srValidMatches[i];
      if (!sm || sm.matchType !== 'tag') return;
      const findF = id => G.roster.find(c => c.id === id) || (G.retiredFighters||[]).find(c => c.id === id);
      const tA1 = findF(sm.teamA.fighter1);
      const tA2 = findF(sm.teamA.fighter2);
      const tB1 = findF(sm.teamB.fighter1);
      const tB2 = findF(sm.teamB.fighter2);
      const isDraw = r.winner === 'draw';
      const aWin = r.winner === 'teamA';
      const bWin = r.winner === 'teamB';
      const leftCls = isDraw ? 'is-draw' : (aWin ? 'is-winner' : 'is-loser');
      const rightCls = isDraw ? 'is-draw' : (bWin ? 'is-winner' : 'is-loser');

      const winnerLabel = isDraw ? 'DRAW' : (aWin ? '🏆 左チーム WIN' : '🏆 右チーム WIN');
      const rowCls = `pb-mrow${isMain ? ' is-main' : ''}`;
      html += `<div class="${rowCls}">`;
      html += _pbTagFighterBlock('left', [tA1, tA2], leftCls);
      html += _pbResultColumn({
        winnerLabel,
        winnerIsDraw: isDraw,
        finishText: Engine.formatFinish(r.finType, r.finMove),
        turns: r.turns,
        mq: r.mq
      });
      html += _pbTagFighterBlock('right', [tB1, tB2], rightCls);
      if (tags.length) html += `<div class="pb-mrow-tags">${tags.join('')}</div>`;
      if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
      if (injuriesThisMatch.length) html += _pbInjuryBlock(injuriesThisMatch);
      html += `</div>`;
      return;
    }

    // ── Single match ──
    const isDraw = r.winner === 'draw';
    const leftIsWinner = r.winner === 'left';
    const rightIsWinner = r.winner === 'right';
    const leftCls = isDraw ? 'is-draw' : (leftIsWinner ? 'is-winner' : 'is-loser');
    const rightCls = isDraw ? 'is-draw' : (rightIsWinner ? 'is-winner' : 'is-loser');

    // Dialogue (rivalry 30+)
    const hasRivalryDialogue = !isDraw && r.rivalryBonus && (r.rivalryBonus.rivalry || 0) >= 30;
    let winLine = '', loseLine = '';
    if (hasRivalryDialogue) {
      const winF = leftIsWinner ? r.left : r.right;
      const loseF = leftIsWinner ? r.right : r.left;
      const winChar = ALL_CHARS.find(c => c.id === winF.id);
      const loseChar = ALL_CHARS.find(c => c.id === loseF.id);
      const ovrW = Engine.util.ov(winF);
      const ovrLose = Engine.util.ov(loseF);
      const isUpsetRivalry = ovrW < ovrLose - 8;
      const winPool = isUpsetRivalry && UPSET_RIVALRY_LINES ? UPSET_RIVALRY_LINES.winnerLines : RIVALRY_MATCH_REACTION.winnerLines;
      const losePool = isUpsetRivalry && UPSET_RIVALRY_LINES?.loserLines ? UPSET_RIVALRY_LINES.loserLines : RIVALRY_MATCH_REACTION.loserLines;
      winLine = pickDialogueLine(winPool, winChar);
      loseLine = pickDialogueLine(losePool, loseChar);
    }

    const leftLine = leftIsWinner ? winLine : (!isDraw ? loseLine : '');
    const rightLine = rightIsWinner ? winLine : (!isDraw ? loseLine : '');
    const hasDialogue = !!(leftLine || rightLine);

    const metaLeft = isMain ? (leftIsWinner ? 'Winner' : isDraw ? 'Draw' : 'Challenger') : `Match ${results.length - i}`;
    const metaRight = isMain ? (rightIsWinner ? 'Winner' : isDraw ? 'Draw' : 'Challenger') : `Match ${results.length - i}`;

    let winnerLabel;
    if (isDraw) winnerLabel = 'DRAW';
    else {
      const winF = leftIsWinner ? r.left : r.right;
      winnerLabel = `🏆 ${escHtml(winF.name)} WIN`;
    }

    const rowCls = `pb-mrow${isMain ? ' is-main' : ''}${hasDialogue ? ' has-dialogue' : ''}`;
    html += `<div class="${rowCls}">`;
    html += _pbFighterBlock('left', r.left, leftCls, metaLeft, leftLine);
    html += _pbResultColumn({
      winnerLabel,
      winnerIsDraw: isDraw,
      finishText: Engine.formatFinish(r.finType, r.finMove),
      turns: r.turns,
      mq: r.mq
    });
    html += _pbFighterBlock('right', r.right, rightCls, metaRight, rightLine);
    if (tags.length) html += `<div class="pb-mrow-tags">${tags.join('')}</div>`;
    if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
    if (injuriesThisMatch.length) html += _pbInjuryBlock(injuriesThisMatch);
    html += `</div>`;
  });

  html += `</div>`; // .pb-matches

  // Footer
  const heatFooterCls = (heat.id === 'hot' || heat.id === 'on_fire') ? 'is-hot' :
                       (heat.id === 'cold' || heat.id === 'ice_cold') ? 'is-cold' : '';
  html += `<div class="pb-footer">
    <div class="pb-footer-heat">Heat<span class="val ${heatFooterCls}">${heat.emoji} ${escHtml(heat.label.toUpperCase())}</span></div>
    <button type="button" class="pb-close-btn" onclick="closeShowResult()">結果を確認 →</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
  if (typeof App !== 'undefined' && typeof App.prepareShowResultInlinePopups === 'function') {
    App.prepareShowResultInlinePopups();
  }
}

// ── Pattern B ヘルパー（試合結果画面共通） ──
function _pbAttendClass(occRate) {
  if (occRate >= 0.95) return 'is-sellout';
  if (occRate >= 0.80) return 'is-good';
  if (occRate >= 0.60) return 'is-neutral';
  if (occRate >= 0.40) return 'is-weak';
  return 'is-empty';
}

function _pbStars(mq) {
  return [1,2,3,4,5].map(s => `<span class="star${mq >= s*20 ? ' on' : ''}">★</span>`).join('');
}

function _pbPortraitImg(fighter) {
  const url = getUpperUrl(fighter.id);
  if (url) return `<img src="${url}" alt="${escHtml(fighter.name || '')}" onerror="this.style.display='none'">`;
  const initial = (fighter.name || '?').charAt(0);
  return `<div class="pb-portrait-placeholder">${escHtml(initial)}</div>`;
}

function _pbFighterBlock(side, fighter, stateCls, metaText, dialogueLine) {
  const nameLink = fLink(fighter, { source: 'roster', skipQueue: true });
  const ovr = Engine.util.ov(fighter);
  const isWinnerForSpeaker = stateCls === 'is-winner';
  const isDrawForSpeaker = stateCls === 'is-draw';
  let bubbleHtml = '';
  if (dialogueLine) {
    const speakerCls = isDrawForSpeaker ? 'is-draw' : (isWinnerForSpeaker ? 'is-winner' : 'is-loser');
    const prefix = isWinnerForSpeaker ? '🏆 ' : '';
    bubbleHtml = `<div class="pb-dialogue">
      <div class="pb-dialogue-speaker ${speakerCls}">${prefix}${escHtml(fighter.name)}</div>
      「${escHtml(dialogueLine)}」
    </div>`;
  }
  const ovrHtml = side === 'left'
    ? `<span class="val">${ovr}</span><span class="lbl">OVR</span>`
    : `<span class="lbl">OVR</span><span class="val">${ovr}</span>`;
  return `<div class="pb-fighter is-${side} ${stateCls}">
    <div class="pb-portrait-wrap">
      ${bubbleHtml}
      <div class="pb-portrait">${_pbPortraitImg(fighter)}</div>
    </div>
    <div class="pb-fighter-info">
      <div class="pb-fighter-name">${nameLink}</div>
      <div class="pb-fighter-meta">${escHtml(metaText)}</div>
      <div class="pb-fighter-ovr">${ovrHtml}</div>
    </div>
  </div>`;
}

function _pbTagFighterBlock(side, members, stateCls) {
  const mems = members.filter(m => m).map(m => {
    const ovr = Engine.util.ov(m);
    const nameLink = fLink(m, { source: 'roster', skipQueue: true });
    return `<div class="pb-tag-member">
      <div class="pb-portrait-wrap">
        <div class="pb-portrait">${_pbPortraitImg(m)}</div>
      </div>
      <div class="pb-tag-member-name">${nameLink}</div>
      <div class="pb-tag-member-ovr"><span class="val">${ovr}</span><span class="lbl">OVR</span></div>
    </div>`;
  }).join('');
  return `<div class="pb-fighter is-${side} is-tag ${stateCls}">
    <div class="pb-tag-members">${mems}</div>
  </div>`;
}

function _pbResultColumn({ winnerLabel, winnerIsDraw, finishText, turns, mq }) {
  return `<div class="pb-result">
    <div class="pb-result-vs">VS</div>
    <div class="pb-result-winner ${winnerIsDraw ? 'is-draw' : ''}">${winnerLabel}</div>
    <div class="pb-result-finish">${escHtml(finishText)}</div>
    <div class="pb-result-turns">${turns} Turns</div>
    <div class="pb-result-mq">
      <span class="pb-result-mq-stars">${_pbStars(mq)}</span>
      <span>MQ</span>
      <span class="pb-result-mq-val">${mq}</span>
    </div>
  </div>`;
}

function _pbHpMini(hpL, hpR) {
  const lPct = hpL.max > 0 ? Math.round(hpL.final / hpL.max * 100) : 0;
  const rPct = hpR.max > 0 ? Math.round(hpR.final / hpR.max * 100) : 0;
  const lFillCls = lPct > 30 ? 'is-healthy' : lPct > 10 ? 'is-warning' : 'is-danger';
  const rFillCls = rPct > 30 ? 'is-healthy' : rPct > 10 ? 'is-warning' : 'is-danger';
  return `<div class="pb-hp-mini">
    <div class="pb-hp-mini-half is-left">
      <span class="pb-hp-mini-val">${hpL.final} / ${hpL.max}</span>
      <div class="pb-hp-mini-track"><div class="pb-hp-mini-fill ${lFillCls}" style="width:${lPct}%"></div></div>
    </div>
    <div class="pb-hp-mini-label">HP</div>
    <div class="pb-hp-mini-half is-right">
      <div class="pb-hp-mini-track"><div class="pb-hp-mini-fill ${rFillCls}" style="width:${rPct}%"></div></div>
      <span class="pb-hp-mini-val">${hpR.final} / ${hpR.max}</span>
    </div>
  </div>`;
}

function _pbInjuryBlock(injuries) {
  const items = injuries.map(ir => `<span class="pb-injury-item"><span class="type">${escHtml(ir.injury.type)}</span> <span class="name">${escHtml(ir.name)}</span> 全治 ${ir.injury.weeksLeft}週間</span>`).join('');
  return `<div class="pb-injury">
    <span class="pb-injury-label">🏥 Injury</span>
    ${items}
  </div>`;
}

// Legacy function aliases for onclick handlers in UI
function doRetireAdvise(id) { App.doRetireAdvise(id); }
function doRetainFighter(id) { App.doRetainFighter(id); }
function signFighter(id) { App.signFighter(id); }
function releaseFighter(id) { App.releaseFighter(id); }
function scoutPick(id) { App.scoutEventPick(id); }
function scoutResolve(id, choice) { App.scoutEventResolve(id, choice); }
function scoutFinish() { App.scoutEventFinish(); }
// draft SFX helper
// ドラフトSFX — 独立Audioオブジェクトで再生（FileBGMを使うとBGMが止まるため）
// 音量はミキサー経由: baseVol × sfxMasterVol。全体ミュート時は無音。
function _draftSfx(type) {
  try {
    if (Audio.muted) return; // 全体ミュート時はSFXも無音
    // ミキサー登録済みSEはAudio.play()で直接再生
    if (type === 'click') { Audio.play('click'); return; }
    if (type === 'lost') { Audio.play('defeat'); return; }
    if (type === 'bid') { Audio.play('select'); return; }
    const sfxMap = {
      gong:    { src: '../bgm/f08_gong_start_v2.mp3', vol: 0.15 },
      chime:   { src: '../bgm/f06_fin_chime_v1.mp3',  vol: 0.12 },
      dropped: { src: '../bgm/f06_fin_chime_v1.mp3',  vol: 0.10, rate: 0.7 },
      fanfare: { src: '../bgm/f10_victory_fanfare_v5.mp3', vol: 0.15 },
    };
    const cfg = sfxMap[type];
    if (!cfg) return;
    const a = new window.Audio(cfg.src);
    // ミキサー適用: baseVol × sfxMasterVol（ユーザーのSE音量スライダー）
    const masterVol = Audio.sfxMasterVol != null ? Audio.sfxMasterVol : 1;
    a.volume = Math.min(1.0, cfg.vol * masterVol);
    if (cfg.rate) a.playbackRate = cfg.rate;
    a.play().catch(() => {});
  } catch(e) {}
}

// 候補選択トグル
function toggleDraftSelection(candId) {
  const selections = G._draftSelections || [];
  const maxPicks = G.scoutMaxPicks || 4;
  const idx = selections.indexOf(candId);
  if (idx >= 0) {
    _draftSfx('click');
    G = { ...G, _draftSelections: selections.filter(id => id !== candId) };
  } else {
    if (selections.length >= maxPicks) return; // 上限到達
    _draftSfx('click');
    G = { ...G, _draftSelections: [...selections, candId] };
  }
  renderScoutEvent();
}

// draft-negotiation-spec 変更2: 分岐ロジック付きドラフト開始
function startDraftNegotiation() {
  if (!G._draftInterests || !G.scoutCandidates) return;
  const selections = G._draftSelections || [];
  if (selections.length === 0) return; // 未選択ガード

  const candidates = G.scoutCandidates;
  const maxPicks = G.scoutMaxPicks || 4;
  const allInterests = G._draftInterests || {};

  // assessedValue 高い順にソート
  const sorted = [...candidates].sort((a, b) => (b.assessedValue || 0) - (a.assessedValue || 0));

  const rngState = Engine.rng.derive(G.rngSeed, G.season, 0xDFA0);
  const log = [...(G.gameLog || [])];
  let newAiOrgs = {};
  Object.keys(G.aiOrgs || {}).forEach(k => {
    newAiOrgs[k] = { ...G.aiOrgs[k], roster: [...(G.aiOrgs[k]?.roster || [])] };
  });
  let newFA = [...(G.freeAgents || [])];
  const ORG_NAMES = { org_s: (RIVAL_ORGS.find(o=>o.id==='org_s')||{}).name||'S級', org_a: (RIVAL_ORGS.find(o=>o.id==='org_a')||{}).name||'A級', org_b: (RIVAL_ORGS.find(o=>o.id==='org_b')||{}).name||'B級' };

  const normFighter = (f) => ({
    ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
    injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false, intensiveWeeks: 0,
  });
  const canAIDraftAcquire = (orgId, rosterLength) => {
    const ideal = (AI_SCOUT_CFG[orgId === 'org_s' ? 'S' : orgId === 'org_a' ? 'A' : 'B'] || {}).idealRoster || 13;
    return rosterLength < ideal + 2;
  };

  // ── 非選択候補を先にバックグラウンド処理 ──
  const draftSummary = { playerAcquired: [], aiAcquired: {}, flowThrough: [] };
  for (const orgId of ['org_s', 'org_a', 'org_b']) draftSummary.aiAcquired[orgId] = [];

  const playerCandidateQueue = []; // 交渉UIに出す候補
  const soloConfirmQueue = [];     // 単独指名確認候補
  const returnToPool = [];         // dormantPoolに返却する未獲得候補ID

  for (const cand of sorted) {
    const isSelected = selections.includes(cand.id);
    // 元データを壊さないようコピーして、現在のロスター状態で判定
    const candInterests = (allInterests[cand.id] || []).map(i => ({ ...i }));
    // ロスター上限到達団体の参加を取り消し（ドラフト中の獲得でリアルタイムに上限に達した団体を除外）
    for (const ci of candInterests) {
      if (!ci.participating) continue;
      const orgRoster = newAiOrgs[ci.orgId]?.roster || [];
      if (!canAIDraftAcquire(ci.orgId, orgRoster.length)) ci.participating = false;
    }
    const aiParticipants = candInterests.filter(i => i.participating);
    const clean = { ...cand };
    delete clean._notion; delete clean._estimate; delete clean._isSeed; delete clean._hasCompetition;
    const tierLabel = Engine.scout.getTierConfig(clean.assessedTier || 'material').label;

    if (isSelected && aiParticipants.length >= 1) {
      // → 交渉画面
      playerCandidateQueue.push(cand);
    } else if (isSelected && aiParticipants.length === 0) {
      // → 単独指名確認
      soloConfirmQueue.push(cand);
    } else if (!isSelected && aiParticipants.length >= 2) {
      // → 裏で自動セリ（バックグラウンド: idealRosterでキャップ、+2枠はプレイヤー交渉用に温存）
      const autoRng = Engine.rng.create(Engine.rng.derive(rngState, cand.id, 0xAA01));
      const autoPlayerFn = () => 'drop';
      const result = Engine.draftNegotiation.runNegotiation(cand, candInterests.map(i=>({...i})), autoPlayerFn, G, autoRng);
      if (result.winner && result.winner !== 'player') {
        const wOrg = result.winner;
        const orgData = newAiOrgs[wOrg];
        if (orgData && canAIDraftAcquire(wOrg, orgData.roster.length)) {
          Engine.rival.pushUniqueFighter(orgData.roster, normFighter({ ...clean, orgId: wOrg }));
          draftSummary.aiAcquired[wOrg].push(clean.name);
          log.push(`📰 ${clean.name} [${tierLabel}]、${ORG_NAMES[wOrg] || wOrg}と電撃契約`);
        } else {
          // 流札 → dormantPoolに返却
          returnToPool.push(cand.id);
          draftSummary.flowThrough.push(clean.name);
          log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
        }
      } else {
        // 流札 → dormantPoolに返却
        returnToPool.push(cand.id);
        draftSummary.flowThrough.push(clean.name);
        log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
      }
    } else if (!isSelected && aiParticipants.length === 1) {
      // → AI自動落札（バックグラウンド: idealRosterでキャップ）
      const winner = aiParticipants[0].orgId;
      const orgData = newAiOrgs[winner];
      if (orgData && canAIDraftAcquire(winner, orgData.roster.length)) {
        Engine.rival.pushUniqueFighter(orgData.roster, normFighter({ ...clean, orgId: winner }));
        draftSummary.aiAcquired[winner].push(clean.name);
        log.push(`📰 ${ORG_NAMES[winner] || winner}、${clean.name} [${tierLabel}]の獲得を発表`);
      } else {
        // 流札 → dormantPoolに返却
        returnToPool.push(cand.id);
        draftSummary.flowThrough.push(clean.name);
        log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
      }
    } else {
      // → 流札 → dormantPoolに返却
      returnToPool.push(cand.id);
      draftSummary.flowThrough.push(clean.name);
      log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
    }
  }

  // 流札候補をdormantPool末尾に返却（枯渇防止）
  let updatedDormant = [...(G.dormantPool || [])];
  for (const rid of returnToPool) {
    if (!updatedDormant.some(e => e.id === rid)) {
      updatedDormant.push({ id: rid, age: 17 });
    }
  }

  G = { ...G, aiOrgs: newAiOrgs, freeAgents: newFA, dormantPool: updatedDormant, gameLog: log };

  // 交渉UIに出す候補がない場合(全部単独or未選択)
  const uiQueue = [...playerCandidateQueue, ...soloConfirmQueue];
  if (uiQueue.length === 0) {
    // 全候補処理完了 → まとめ記事 → 直接offseason進行
    G = _finalizeDraft(G, draftSummary, rngState, maxPicks);
    App.restoreBgmForState();
    console.log('[WM Draft] BGM → management (draft complete, no UI queue)');
    App.scoutEventFinish();
    return;
  }

  // 最初の候補の交渉状態を初期化（バックグラウンド処理後のロスター状態で再判定）
  const firstCand = uiQueue[0];
  const firstInterests = (allInterests[firstCand.id] || []).map(i => ({ ...i }));
  for (const ci of firstInterests) {
    if (!ci.participating) continue;
    const orgRoster = newAiOrgs[ci.orgId]?.roster || [];
    const ideal = (AI_SCOUT_CFG[ci.orgId === 'org_s' ? 'S' : ci.orgId === 'org_a' ? 'A' : 'B'] || {}).idealRoster || 13;
    if (orgRoster.length >= ideal + 2) ci.participating = false;
  }
  const firstActive = firstInterests.filter(i => i.participating);
  const negState = Engine.draftNegotiation.initNegState(firstCand, firstInterests);

  // 単独指名候補の場合
  if (firstActive.length === 0) {
    negState.finished = true;
    negState.winner = 'player';
    negState.finalBid = negState.assessedValue;
    negState.narration = '競合なし — 単独指名です。契約しますか？';
    negState._isSoloConfirm = true;
  }

  G = {
    ...G,
    _draftNegotiationStarted: true,
    _draftNegotiation: {
      sortedCandidates: uiQueue,
      currentCandidateIdx: 0,
      candidate: firstCand,
      negState,
      maxPicks,
      acquiredThisSession: [],
      rngState,
      draftSummary,
    },
  };
  _draftSfx('gong'); // ① 交渉開幕ゴング
  console.log('[WM Draft] 交渉開始');
  refreshAll();
  _showScreenNoBgm('scoutEvent');
}

// B1: ドラフト獲得選手カード画面
function _buildDraftGetPage(state, acquiredRecords) {
  const roster = state.roster || [];
  const acquired = acquiredRecords
    .map(rec => {
      const f = roster.find(r => r.id === (typeof rec === 'object' ? rec.id : rec));
      if (!f) return null;
      return { ...f, _finalBid: rec.finalBid || 0, _tierId: rec.tier || 'material' };
    })
    .filter(Boolean);

  const totalCost = acquired.reduce((s, f) => s + (f._finalBid || 0), 0);
  const avgOvr = acquired.length > 0
    ? Math.round(acquired.reduce((s, f) => s + Engine.util.ov(f), 0) / acquired.length) : 0;
  const avgAge = acquired.length > 0
    ? (acquired.reduce((s, f) => s + (f.age || 0), 0) / acquired.length).toFixed(1) : 0;
  const remainingFunds = Math.round(state.funds || 0);

  const TIER_LABELS = { superElite: '超逸材', elite: '逸材', promising: '有望', raw: '原石', material: '素材' };
  const STYLE_SHORT = { Grappler: 'GRP', Striker: 'STK', Submission: 'SUB', Aerial: 'AER', Allround: 'ALL', Brawler: 'BRW' };
  const ROLE_SHORT = { Babyface: 'Face', Heel: 'Heel', Neutral: 'Neu', Dirty: 'Dirty' };

  const STYLE_JP_FULL = { Grappler: 'グラップラー', Striker: 'ストライカー', Submission: 'サブミッション', Aerial: 'エアリアル', Allround: 'オールラウンド', Brawler: 'ブロウラー' };
  const statRow = (k, v) => `<div class="b1-stat-row"><span class="k">${k}</span><div class="bar"><div class="fill" style="width:${Math.min(100, v)}%"></div></div><span class="v">${v}</span></div>`;

  // 超逸材ヒーロー表示
  function _heroCard(f) {
    const ovr = Engine.util.ov(f);
    const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
    const faceUrl = typeof getPortraitUrl === 'function' ? getPortraitUrl(f.id) : '';
    const imgUrl = upperUrl || faceUrl;
    const imgHtml = imgUrl
      ? `<img src="${imgUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">`
      : `<div class="b1-placeholder" style="font-size:80px">${(f.name || '?').charAt(0)}</div>`;
    return `<div class="b1-hero">
      <div class="b1-hero-ribbon">GET!</div>
      <div class="b1-hero-img">${imgHtml}</div>
      <div class="b1-hero-body">
        <div class="b1-hero-tier">超逸材</div>
        <div class="b1-hero-name">${f.name}</div>
        <div class="b1-hero-meta">${f.age}歳 ・ ${STYLE_JP_FULL[f.style] || f.style} ・ ${ROLE_SHORT[f.role] || f.role}</div>
        <div class="b1-hero-ovr">OVR <span class="v">${ovr}</span></div>
        <div class="b1-hero-stats">
          ${statRow('PWR', f.pw || 0)}
          ${statRow('SPD', f.sp || 0)}
          ${statRow('TEC', f.te || 0)}
          ${statRow('STA', f.st || 0)}
          ${statRow('MNT', f.mn || 0)}
        </div>
        <div class="b1-hero-cost">
          <span class="lbl">契約金</span>
          <span class="val">${(f._finalBid || 0).toLocaleString()} 万</span>
        </div>
      </div>
    </div>`;
  }

  // 通常カード（逸材はやや大きめ）
  function _card(f) {
    const tierId = f._tierId || 'material';
    const tierLabel = TIER_LABELS[tierId] || tierId;
    const ovr = Engine.util.ov(f);
    const url = typeof getPortraitUrl === 'function' ? getPortraitUrl(f.id) : '';
    const portrait = url
      ? `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;">`
      : `<div class="b1-placeholder">${(f.name || '?').charAt(0)}</div>`;
    const lgClass = tierId === 'elite' ? ' b1-card-lg' : '';
    return `<div class="b1-card tier-${tierId}${lgClass}">
      <div class="b1-card-top">
        <span class="b1-tier tier-${tierId}">${tierLabel}</span>
        <span class="b1-style">${STYLE_SHORT[f.style] || f.style} / ${ROLE_SHORT[f.role] || f.role}</span>
      </div>
      <div class="b1-portrait">
        ${portrait}
        <div class="b1-age">${f.age}歳</div>
      </div>
      <div class="b1-name">${f.name}</div>
      <div class="b1-ovr">OVR <span class="v">${ovr}</span></div>
      <div class="b1-stats">
        ${statRow('PWR', f.pw || 0)}
        ${statRow('SPD', f.sp || 0)}
        ${statRow('TEC', f.te || 0)}
        ${statRow('STA', f.st || 0)}
        ${statRow('MNT', f.mn || 0)}
      </div>
      <div class="b1-cost">
        <span class="lbl">契約金</span>
        <span class="val">${(f._finalBid || 0).toLocaleString()} 万</span>
      </div>
    </div>`;
  }

  // 超逸材を分離
  const heroes = acquired.filter(f => f._tierId === 'superElite');
  const others = acquired.filter(f => f._tierId !== 'superElite');

  let cardsHtml = '';
  if (acquired.length === 0) {
    cardsHtml = '<div class="b1-empty">今回のドラフトでは獲得がありませんでした</div>';
  } else {
    if (heroes.length > 0) cardsHtml += heroes.map(_heroCard).join('');
    if (others.length > 0) cardsHtml += `<div class="b1-grid">${others.map(_card).join('')}</div>`;
  }

  return {
    title: 'ドラフト完了',
    isGetPage: true,
    html: `<div class="b1-wrap">
      <div class="b1-head">
        <div class="kick">DRAFT COMPLETE</div>
        <div class="title">獲得選手</div>
        <div class="sub">新戦力<span class="count">${acquired.length}</span>名 ・ 契約金合計 <span class="total-cost">${totalCost.toLocaleString()}</span> 万</div>
      </div>
      ${cardsHtml}
      <div class="b1-totals">
        <div class="cell"><div class="n">${acquired.length}</div><div class="l">新戦力</div></div>
        ${acquired.length > 0 ? `<div class="cell"><div class="n">${avgOvr}</div><div class="l">平均 OVR</div></div>` : ''}
        ${acquired.length > 0 ? `<div class="cell"><div class="n">${avgAge}</div><div class="l">平均 年齢</div></div>` : ''}
        <div class="cell"><div class="n">${totalCost.toLocaleString()}</div><div class="l">契約金 (万)</div></div>
        <div class="cell"><div class="n" style="color:#2ecc71">${remainingFunds.toLocaleString()}</div><div class="l">残資金 (万)</div></div>
      </div>
    </div>`
  };
}

// ドラフト完了処理(まとめ記事生成+EMPRESS安全網+クリーンアップ)
function _finalizeDraft(state, summary, rngState, maxPicks) {
  let s = state;
  const log = [...(s.gameLog || [])];
  const acquired = (s._draftNegotiation?.acquiredThisSession) || [];
  const ORG_NAMES = { org_s: (RIVAL_ORGS.find(o=>o.id==='org_s')||{}).name||'S級', org_a: (RIVAL_ORGS.find(o=>o.id==='org_a')||{}).name||'A級', org_b: (RIVAL_ORGS.find(o=>o.id==='org_b')||{}).name||'B級' };

  // EMPRESS安全網
  const empRng = Engine.rng.create(Engine.rng.derive(rngState, 0xE11E));
  const empEvents = Engine.draftNegotiation.empressReinforce(s, empRng);
  let newDormant = [...(s.dormantPool || [])];
  let empAiOrgs = {};
  Object.keys(s.aiOrgs || {}).forEach(k => { empAiOrgs[k] = { ...s.aiOrgs[k], roster: [...(s.aiOrgs[k]?.roster || [])] }; });
  const normFighter = (f) => ({
    ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
    injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false, intensiveWeeks: 0,
  });
  const empressNames = [];
  for (const ev of empEvents) {
    if (ev.type === 'empressReinforce' && ev.fighter) {
      const orgData = empAiOrgs['org_s'];
      if (orgData) {
        Engine.rival.pushUniqueFighter(orgData.roster, normFighter(ev.fighter));
        newDormant = newDormant.filter(e => e.id !== ev.dormantIdRemoved);
        empressNames.push(ev.template.name);
        const sOrgName = (RIVAL_ORGS.find(o=>o.id==='org_s')||{}).name||'S級団体';
        log.push(`📰 業界紙報道: ${ev.template.name}、${sOrgName} と電撃契約。スカウト合戦の裏で進められていた極秘交渉が明らかに`);
        // §6.4 ドラマ演出: 通知ポップアップ
        if (typeof showPopup === 'function') {
          setTimeout(() => {
            showPopup({
              type: 'scout', tone: 'negative',
              message: `業界紙報道: ${ev.template.name}、${sOrgName} と電撃契約`,
              detail: 'スカウト合戦の裏で進められていた極秘交渉が明らかに',
            });
          }, 500);
        }
      }
    }
  }

  // EMPRESS安全網で拾った選手を流札リストから除外（重複表示防止）
  if (empressNames.length > 0) {
    const empSet = new Set(empressNames);
    summary.flowThrough = summary.flowThrough.filter(name => !empSet.has(name));
  }

  // B1 獲得選手カードページ
  const getPage = _buildDraftGetPage(s, (s._draftNegotiation?.acquiredThisSession) || acquired);

  // 業界紙まとめ記事をnewspaperに挿入
  const draftNewsPage = _buildDraftSummaryPage(summary, acquired, empressNames, s);

  // weeklyNewspaper にページ追加（存在しない場合は新規作成）
  let newspaper = s.weeklyNewspaper ? { ...s.weeklyNewspaper } : {
    season: s.season, week: s.offWeek || 0,
    topStory: { headline: 'ドラフト会議終了', body: '全候補の交渉が完了しました', type: 'draftSummary' },
    pages: [],
  };
  const pages = newspaper.pages ? [...newspaper.pages] : [];
  pages.push(draftNewsPage);
  newspaper = { ...newspaper, pages };

  return {
    ...s,
    aiOrgs: empAiOrgs,
    dormantPool: newDormant,
    gameLog: log,
    scoutCandidates: null,
    scoutPicks: acquired.map(rec => typeof rec === 'object' ? rec.id : rec),
    _draftInterests: null,
    _draftNegotiation: null,
    _draftNegotiationStarted: false,
    _draftSelections: null,
    weeklyNewspaper: newspaper,
    _draftResultPages: [getPage, draftNewsPage],
    _draftResultIdx: 0,
  };
}

// 業界紙まとめ記事ページを構築
function _buildDraftSummaryPage(summary, playerAcquired, empressNames, state) {
  const ORG_NAMES = { org_s: (RIVAL_ORGS.find(o=>o.id==='org_s')||{}).name||'S級', org_a: (RIVAL_ORGS.find(o=>o.id==='org_a')||{}).name||'A級', org_b: (RIVAL_ORGS.find(o=>o.id==='org_b')||{}).name||'B級' };
  const stories = [];

  // プレイヤー獲得（ポートレート付き）
  if (playerAcquired.length > 0) {
    const acquiredIds = playerAcquired.map(rec => typeof rec === 'object' ? rec.id : rec);
    const fighters = (state.roster || []).filter(f => acquiredIds.includes(f.id));
    const names = fighters.map(f => f.name);
    const portraits = fighters.map(f => ({
      id: f.id, name: f.name,
      ovr: Engine.util.ov(f),
      url: typeof getPortraitUrl === 'function' ? getPortraitUrl(f.id) : '',
    }));
    stories.push({
      headline: `${state.orgName || 'プレイヤー団体'}、新戦力${names.length}名を獲得`,
      body: names.join('、') + ' — 新シーズンの台風の目となるか。',
      type: 'draftPlayerResult',
      portraits,
    });
  }

  // AI団体獲得
  for (const orgId of ['org_s', 'org_a', 'org_b']) {
    const names = summary.aiAcquired[orgId] || [];
    const empExtra = orgId === 'org_s' ? empressNames : [];
    const allNames = [...names, ...empExtra];
    if (allNames.length > 0) {
      stories.push({
        headline: `${ORG_NAMES[orgId]}、${allNames.length}名の新人を確保`,
        body: allNames.join('、'),
        type: 'draftAiResult',
      });
    }
  }

  // 流札
  if (summary.flowThrough.length > 0) {
    stories.push({
      headline: `指名漏れ${summary.flowThrough.length}名、フリー市場へ`,
      body: summary.flowThrough.join('、') + ' — 今後のFA市場で動きがあるか注目。',
      type: 'draftFlowThrough',
    });
  }

  return {
    title: 'ドラフト結果',
    stories,
  };
}

// プレイヤーアクション（強気/標準/降りる）
function draftPlayerAction(action) {
  const dn = G._draftNegotiation;
  if (!dn || dn.negState.finished) return;
  const rng = Engine.rng.create(Engine.rng.derive(dn.rngState, dn.negState.round, dn.candidate.id));

  if (action === 'drop') {
    // 降りる → AI同士の残りをヘッドレスで即座に決着
    let ns = { ...dn.negState };
    ns.playerIn = false;
    ns.log.push(`R${ns.round}: プレイヤー降り (${ns.currentBid}万)`);
    let safety = 0;
    while (!ns.finished && safety < 30) {
      safety++;
      const stepRng = Engine.rng.create(Engine.rng.derive(dn.rngState, ns.round, dn.candidate.id, safety));
      ns = Engine.draftNegotiation.stepRound(ns, 'drop', G, stepRng);
    }
    // SFX: 競り負け or 流札
    if (ns.winner && ns.winner !== 'player') _draftSfx('lost');
    G = { ...G, _draftNegotiation: { ...dn, negState: ns } };
    refreshAll();
    _showScreenNoBgm('scoutEvent');
    if (G._pendingDraftSigningPopup) {
      const popup = G._pendingDraftSigningPopup;
      G = { ...G, _pendingDraftSigningPopup: null };
      setTimeout(() => showEventPopup(popup), 50);
    }
    return;
  }

  const ns = Engine.draftNegotiation.stepRound(dn.negState, action, G, rng);
  // SFX
  if (ns.droppedThisRound.length > 0) _draftSfx('dropped'); // ④ 団体降り
  else _draftSfx('bid'); // ③ ラウンド進行
  if (ns.finished && ns.winner === 'player') _draftSfx('fanfare'); // ⑤ 落札成立
  else if (ns.finished && ns.winner !== 'player') _draftSfx('lost'); // ⑥ 競り負け
  G = { ...G, _draftNegotiation: { ...dn, negState: ns } };
  refreshAll();
  _showScreenNoBgm('scoutEvent');
}

// AI観戦モード
function draftWatchRound(speed) {
  const dn = G._draftNegotiation;
  if (!dn || dn.negState.finished) return;

  if (speed === 'skip') {
    // 即座に最後まで
    let ns = dn.negState;
    let safety = 0;
    while (!ns.finished && safety < 30) {
      safety++;
      const rng = Engine.rng.create(Engine.rng.derive(dn.rngState, ns.round, dn.candidate.id, safety));
      ns = Engine.draftNegotiation.stepRound(ns, 'drop', G, rng);
    }
    G = { ...G, _draftNegotiation: { ...dn, negState: ns } };
    refreshAll();
    _showScreenNoBgm('scoutEvent');
    if (G._pendingDraftSigningPopup) {
      const popup = G._pendingDraftSigningPopup;
      G = { ...G, _pendingDraftSigningPopup: null };
      setTimeout(() => showEventPopup(popup), 50);
    }
    return;
  }

  // normal=1000ms, fast=200ms
  const delay = speed === 'fast' ? 200 : 1000;
  const rng = Engine.rng.create(Engine.rng.derive(dn.rngState, dn.negState.round, dn.candidate.id));
  const ns = Engine.draftNegotiation.stepRound(dn.negState, 'drop', G, rng);
  G = { ...G, _draftNegotiation: { ...dn, negState: ns } };
  refreshAll();
  _showScreenNoBgm('scoutEvent');

  if (!ns.finished) {
    setTimeout(() => draftWatchRound(speed), delay);
  }
}

// 単独指名の確認(Yes/No)
function draftSoloConfirm(accept) {
  const dn = G._draftNegotiation;
  if (!dn) return;
  if (accept) {
    // そのまま次へ(draftNextCandidateがwinner=playerを処理)
    draftNextCandidate();
  } else {
    // 見送り → winner=null に変更して次へ
    const ns = { ...dn.negState, winner: null, finalBid: 0, narration: '見送りました' };
    G = { ...G, _draftNegotiation: { ...dn, negState: ns } };
    draftNextCandidate();
  }
}

// 次の候補に進む or 交渉終了
function draftNextCandidate() {
  const dn = G._draftNegotiation;
  if (!dn) return;

  const ns = dn.negState;
  const cand = dn.candidate;
  const acquired = [...(dn.acquiredThisSession || [])];
  const draftSummary = {
    playerAcquired: [...(dn.draftSummary?.playerAcquired || [])],
    aiAcquired: {
      org_s: [...(dn.draftSummary?.aiAcquired?.org_s || [])],
      org_a: [...(dn.draftSummary?.aiAcquired?.org_a || [])],
      org_b: [...(dn.draftSummary?.aiAcquired?.org_b || [])],
    },
    flowThrough: [...(dn.draftSummary?.flowThrough || [])],
  };
  const log = [...(G.gameLog || [])];
  let newRoster = [...G.roster];
  let newFunds = G.funds;
  let newAiOrgs = {};
  Object.keys(G.aiOrgs || {}).forEach(k => {
    newAiOrgs[k] = { ...G.aiOrgs[k], roster: [...(G.aiOrgs[k]?.roster || [])] };
  });
  let newFA = [...(G.freeAgents || [])];

  const normFighter = (f) => ({
    ...f, condition: f.condition ?? 80, schedule: f.schedule || 'balance',
    wins: f.wins || 0, losses: f.losses || 0, draws: f.draws || 0,
    injury: null, seasonGrowth: f.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false, intensiveWeeks: 0,
  });

  // 前の候補の結果を適用
  const clean = { ...cand };
  delete clean._notion; delete clean._estimate; delete clean._isSeed; delete clean._hasCompetition;
  const tierLabel = Engine.scout.getTierConfig(clean.assessedTier || 'material').label;

  let returnToPool = false; // 流札候補をdormantPoolに返却するフラグ
  if (ns.winner === 'player') {
    const maxPicks = dn.maxPicks || 4;
    if (newFunds >= ns.finalBid && acquired.length < maxPicks && newRoster.filter(c => !c.isRental).length < (G.rosterCap || 16)) {
      let signed = normFighter(clean);
      signed.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      signed = Engine.orgTimeline.transfer(signed, 'player', G.season, G.week);
      signed = Engine.career.addEvent(signed, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'scout' });
      // draft-value-rebalance: ドラフト指名ボーナス（trust + bond）
      {
        const rounds = ns.round || 0;
        const bonus = DRAFT_SIGNING_BONUS;
        const trustBonus = Math.min(bonus.trustCap, bonus.trustBase + rounds * bonus.trustPerRound);
        signed.trust = Math.min(100, (signed.trust || 50) + trustBonus);
      }
      newRoster.push(signed);
      // draft-value-rebalance: 既存メンバーとのbond付与（チームが新人を歓迎）
      if (G.relationships) {
        const bondRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xDF01, G.season, clean.id));
        const existingIds = newRoster.filter(c => c.id !== clean.id && !c.isRental).map(c => c.id);
        const relState = Engine.relationships.applyFromRoster(
          { relationships: G.relationships }, existingIds, clean.id,
          DRAFT_SIGNING_BONUS.bondRange, DRAFT_SIGNING_BONUS.rivalryRange, bondRng);
        G = { ...G, relationships: relState.relationships };
      }
      newFunds -= ns.finalBid;
      acquired.push({ id: clean.id, finalBid: ns.finalBid, tier: clean.assessedTier });
      draftSummary.playerAcquired.push(clean.name);
      log.push(`⚖ ドラフト獲得: ${clean.name} [${tierLabel}] 契約金${ns.finalBid}万 (R${ns.round})`);

      // 獲得時リアクション（顔写真付きポップアップ）
      try {
        const signingLine = (typeof getSigningLine === 'function')
          ? getSigningLine(clean, 'competition_won')
          : `${clean.name}との契約が成立した`;
        G._pendingDraftSigningPopup = {
          type: 'fighter', id: clean.id, name: clean.name,
          tone: 'positive', message: signingLine,
          detail: `📝 契約金: ${ns.finalBid.toLocaleString()}万 [${tierLabel}]`
        };
      } catch (e) {
        console.warn('[WM Draft] signing line fallback:', e);
      }
    } else {
      returnToPool = true;
      log.push(`⚖ ドラフト流札: ${clean.name} [${tierLabel}]（資金/枠不足）`);
    }
  } else if (ns.winner && ns.winner !== 'player') {
    const orgData = newAiOrgs[ns.winner];
    const wIdeal = (AI_SCOUT_CFG[ns.winner === 'org_s' ? 'S' : ns.winner === 'org_a' ? 'A' : 'B'] || {}).idealRoster || 13;
    if (orgData && orgData.roster.length < wIdeal + 2) {
      const aiFighter = normFighter({ ...clean, orgId: ns.winner });
      // draft-value-rebalance: AI落札時もtrust指名ボーナス
      {
        const rounds = ns.round || 0;
        const bonus = DRAFT_SIGNING_BONUS;
        const trustBonus = Math.min(bonus.trustCap, bonus.trustBase + rounds * bonus.trustPerRound);
        aiFighter.trust = Math.min(100, (aiFighter.trust || 50) + trustBonus);
      }
      Engine.rival.pushUniqueFighter(orgData.roster, aiFighter);
      if (!draftSummary.aiAcquired[ns.winner]) draftSummary.aiAcquired[ns.winner] = [];
      draftSummary.aiAcquired[ns.winner].push(clean.name);
      const orgInfo = RIVAL_ORGS.find(o => o.id === ns.winner);
      log.push(`⚖ ドラフト: ${clean.name} [${tierLabel}] → ${orgInfo ? orgInfo.name : ns.winner} (${ns.finalBid}万 R${ns.round})`);
    } else {
      returnToPool = true;
      draftSummary.flowThrough.push(clean.name);
      log.push(`⚖ ドラフト流札: ${clean.name} [${tierLabel}]（団体枠上限）`);
    }
  } else {
    returnToPool = true;
    draftSummary.flowThrough.push(clean.name);
    log.push(`⚖ ドラフト流札: ${clean.name} [${tierLabel}]`);
  }

  // 流札候補をdormantPool末尾に返却（枯渇防止）
  let updatedDormant = [...(G.dormantPool || [])];
  if (returnToPool && !updatedDormant.some(e => e.id === clean.id)) {
    updatedDormant.push({ id: clean.id, age: 17 });
  }

  G = { ...G, roster: newRoster, funds: newFunds, aiOrgs: newAiOrgs, freeAgents: newFA, dormantPool: updatedDormant, gameLog: log };

  // 次の候補があるか？
  const nextIdx = dn.currentCandidateIdx + 1;
  if (nextIdx >= dn.sortedCandidates.length) {
    // 全候補終了 → ドラフト完了(EMPRESS安全網+まとめ記事) → B1+まとめ記事表示
    G = { ...G, _draftNegotiation: { ...dn, acquiredThisSession: acquired, draftSummary }, gameLog: log };
    G = _finalizeDraft(G, draftSummary, dn.rngState, dn.maxPicks);
    App.restoreBgmForState();
    console.log('[WM Draft] BGM → management (draft complete)');
    // B1+まとめ記事ページ表示（_draftResultPages がセットされている）
    refreshAll();
    _showScreenNoBgm('scoutEvent');
    if (G._pendingDraftSigningPopup) {
      const popup = G._pendingDraftSigningPopup;
      G = { ...G, _pendingDraftSigningPopup: null };
      setTimeout(() => showEventPopup(popup), 50);
    }
    return;
  }

  // 次の候補を開始
  _draftSfx('chime'); // ② 次候補切替
  const nextCand = dn.sortedCandidates[nextIdx];
  const rawInterests = (G._draftInterests || {})[nextCand.id] || [];
  // 元データを壊さないようコピーして、現在のロスター状態で再判定
  const nextInterests = rawInterests.map(i => ({ ...i }));
  for (const ci of nextInterests) {
    if (!ci.participating) continue;
    const orgRoster = newAiOrgs[ci.orgId]?.roster || [];
    const ideal = (AI_SCOUT_CFG[ci.orgId === 'org_s' ? 'S' : ci.orgId === 'org_a' ? 'A' : 'B'] || {}).idealRoster || 13;
    if (orgRoster.length >= ideal + 2) ci.participating = false;
  }
  const nextNegState = Engine.draftNegotiation.initNegState(nextCand, nextInterests);
  const nextActive = nextInterests.filter(i => i.participating);
  if (nextActive.length === 0) {
    nextNegState.finished = true;
    nextNegState.winner = 'player';
    nextNegState.finalBid = nextNegState.assessedValue;
    nextNegState.narration = '競合なし — 単独指名です。契約しますか？';
    nextNegState._isSoloConfirm = true;
  }

  G = {
    ...G,
    _draftNegotiation: {
      ...dn,
      currentCandidateIdx: nextIdx,
      candidate: nextCand,
      negState: nextNegState,
      acquiredThisSession: acquired,
      draftSummary,
    },
  };
  refreshAll();
  _showScreenNoBgm('scoutEvent');

  // 獲得時ポップアップ（showScreen後に遅延表示）
  if (G._pendingDraftSigningPopup) {
    const popup = G._pendingDraftSigningPopup;
    G = { ...G, _pendingDraftSigningPopup: null };
    setTimeout(() => showEventPopup(popup), 50);
  }
}
function hireCoach(id) { App.hireCoach(id); }
function expandCoachSlot() { App.expandCoachSlot(); }
function fireCoach(id) { App.fireCoach(id); }
function autoSave() { Storage.autoSave(); }
function loadAutoSave() { Storage.loadAutoSave(); refreshAll(); }
function getAutoSaveInfo() { return Storage.getAutoSaveInfo(); }
function getSaveInfo(slot) { return Storage.getSaveInfo(slot); }
function exportSave(slot) { Audio.play('click'); Storage.exportToFile(slot); }
function importSave() { Storage.importFromFile(); }

// C-4: Transfer & Ace UI functions
function resolvePoach(fighterId, accepted) {
  Audio.play(accepted ? 'transfer' : 'deselect');
  const result = Engine.transfer.resolvePoach(G, fighterId, accepted);
  G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
  Storage.autoSave();
  refreshAll();

  // 結果に応じた選手リアクション(イベントポップアップ)
  if (result.outcome && result.fighterSnapshot && typeof POACH_REACTION_DIALOGUES !== 'undefined') {
    const dlg = POACH_REACTION_DIALOGUES[result.outcome];
    if (dlg) {
      const message = pickDialogueLine(dlg, result.fighterSnapshot);
      const orgName = result.orgName || '他団体';
      const tone = result.outcome === 'defended' ? 'positive'
                : result.outcome === 'accepted' ? 'gold'
                : 'negative';
      const titleByOutcome = {
        accepted: `💸 ${result.fighterSnapshot.name} → ${orgName}へ移籍`,
        defended: `🛡️ ${result.fighterSnapshot.name} 引き留め成功`,
        defense_failed: `😭 ${result.fighterSnapshot.name} 引き留め失敗`,
      };
      showEventPopup({
        type: 'fighter',
        id: result.fighterSnapshot.id,
        name: result.fighterSnapshot.name,
        emoji: titleByOutcome[result.outcome] ? '' : '💬',
        tone,
        message,
        detail: titleByOutcome[result.outcome],
      });
    }
  }
}
function finishTransferWindow() {
  G = { ...G, weekPhase: 'manage', pendingPoach: [], lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } };
  Storage.autoSave();
  refreshAll();
}
// ── Phase D: Event UI Functions ──
function executeEvent() {
  const ev = G.pendingEvent;
  if (!ev) return;

  // War type: handled by dedicated challenge system
  if (ev.type === 'war') {
    acceptWarChallenge();
    return;
  }

  Audio.play('bellx3');
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week));
  const events = [];
  let eventWon = false;

  if (ev.type === 'challenge') {
    const result = Engine.event.resolveEventMatch(rng, ev.playerFighter, ev.aiFighter, ev.mqBonus);
    const won = result.winner === 'left'; // player is left
    eventWon = won;
    const popDelta = won ? 3 : -1;
    events.push(`🔥 挑戦状結果: ${ev.playerFighter.name} vs ${ev.aiFighter.name} → ${won ? '勝利！' : '敗北…'} (MQ${result.mq}, 人気${popDelta >= 0 ? '+' : ''}${popDelta})`);
    G = { ...G, orgPop: Math.max(0, Math.min(100, G.orgPop + popDelta)), pendingEvent: null,
          gameLog: [...G.gameLog, ...events] };

  } else if (ev.type === 'summit') {
    const result = Engine.event.resolveEventMatch(rng, ev.playerFighter, ev.aiFighter, 0);
    const won = result.winner === 'left'; // player is left
    eventWon = won;
    events.push(`🏆 頂上決戦: ${ev.playerFighter.name} vs ${ev.aiFighter.name} → ${won ? '勝利！！' : '敗北…'} (MQ${result.mq})`);
    const outcome = Engine.event.applySummitOutcome(G, won);
    G = { ...outcome.state, gameLog: [...G.gameLog, ...events, ...outcome.events] };
    // v1.3: Record summit appearance
    G = { ...G, roster: G.roster.map(c => c.id !== ev.playerFighter.id ? c :
      Engine.career.addEvent(c, { type: 'summit', season: G.season, week: G.week, opponentOrg: ev.orgName, won })) };
  }

  // v0.95: Track event stats
  const evStats = { ...(G.seasonStats || {}) };
  if (eventWon) { evStats.eventsWon = (evStats.eventsWon || 0) + 1; Audio.play('victory'); }
  else { evStats.eventsLost = (evStats.eventsLost || 0) + 1; Audio.play('defeat'); }
  G = { ...G, seasonStats: evStats, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } };
  App.restoreBgmForState();
  Storage.autoSave();
  refreshAll();
}

function skipEvent() {
  Audio.play('deselect');
  const ev = G.pendingEvent;
  const events = [];
  if (ev) {
    if (ev.type === 'war') events.push(`⚔ ${ev.opponentName}との対抗戦を辞退`);
    else if (ev.type === 'challenge') events.push(`🔥 ${ev.orgName}の挑戦状を無視`);
    else if (ev.type === 'summit') events.push(`🏆 頂上決戦の挑戦を見送り`);
  }
  G = { ...G, pendingEvent: null, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] },
        gameLog: [...G.gameLog, ...events] };
  App.restoreBgmForState();
  Storage.autoSave();
  refreshAll();
}

// ── PPV GRAND FINAL Entry UI Functions ──
function togglePPVPick(fighterId) {
  const picks = G._ppvPicks || [];
  const rankings = G.rankings || [];
  const pRank = Engine.ranking.getPlayerRank(rankings);
  const maxSlots = Engine.ppv.getSlotCount(pRank);
  const champ = getWorldChampion();
  const champAutoEntry = champ && !champ.injury && !champ.isRental;
  const remainingSlots = champAutoEntry ? maxSlots - 1 : maxSlots;

  if (picks.includes(fighterId)) {
    // 解除
    G = { ...G, _ppvPicks: picks.filter(id => id !== fighterId) };
    Audio.play('deselect');
  } else {
    if (picks.length >= remainingSlots) return;
    G = { ...G, _ppvPicks: [...picks, fighterId] };
    Audio.play('select');
  }
  refreshAll();
}

function confirmPPVEntry() {
  const picks = G._ppvPicks || [];
  const rankings = G.rankings || [];
  const pRank = Engine.ranking.getPlayerRank(rankings);
  const maxSlots = Engine.ppv.getSlotCount(pRank);
  const champ = getWorldChampion();
  const champAutoEntry = champ && !champ.injury && !champ.isRental;
  const remainingSlots = champAutoEntry ? maxSlots - 1 : maxSlots;
  if (picks.length !== remainingSlots) return;

  Audio.play('stamp');
  // チャンピオン + 選択した選手をエントリーに
  const playerEntryIds = champAutoEntry ? [champ.id, ...picks] : [...picks];
  const playerEntries = playerEntryIds.map(id => {
    const c = G.roster.find(f => f.id === id);
    return c ? { ...c } : null;
  }).filter(Boolean);

  // エントリー全団体分を確定
  const aiEntries = G._ppvAIEntries || {};
  const ppvEntries = { player: playerEntries };
  RIVAL_ORGS.forEach(org => {
    ppvEntries[org.id] = aiEntries[org.id] || [];
  });

  const ppvName = G.ppvName || '';
  G = { ...G,
    ppvEntries,
    ppvPhase: 'locked',
    weekPhase: 'manage',
    _ppvPicks: undefined,
    _ppvAIEntries: undefined,
    lastShowResults: [],
    weeklyFinance: { income: 0, expense: 0, details: [] },
    gameLog: [...G.gameLog, `🏟️ PPV GRAND FINAL「${ppvName}」エントリー完了！第${PPV_SHOW_WEEK}週に開催`],
  };
  Storage.autoSave();
  showToast(`🏟️ エントリー完了！PPV GRAND FINAL は第${PPV_SHOW_WEEK}週に開催されます`, 7000);
  refreshAll();
}

// ── PPV マッチカード紹介画面（興行開始前の全カード一覧）──
function showPPVMatchCardIntro(onStart) {
  const pp = App._ppvPreview;
  if (!pp || pp.card.length === 0) { onStart(); return; }

  // 前回の表示状態をリセット
  const elReset = document.getElementById('ppvMatchCardOverlay');
  if (elReset) { elReset.style.display = ''; elReset.style.pointerEvents = ''; }

  const ppvName = G.ppvName || 'GRAND FINAL';
  const total = pp.card.length;
  const season = G.season || 1;

  // カード表示: メインイベント(最後のcard)を上、前座(最初のcard)を下に並べる
  let cardsHtml = '';
  const cards = pp.card;
  for (let di = total - 1; di >= 0; di--) {
    const match = cards[di];
    const isMain = !!(match.isSummit) || di === total - 1;
    const mainClass = isMain ? ' is-main' : '';

    // 試合種別ラベル
    const typeLabel = isMain ? 'MAIN EVENT' : `MATCH ${di + 1}`;

    // バッジ
    let badge = '';
    if (match.isRivalry) badge = `<div class="ppvmc-badge">🔥 ライバル対決</div>`;

    // h2h通算成績
    let h2hText = 'FIRST MEETING';
    const recForLeft = Engine.h2h.getRecordFor(G, match.left.id, match.right.id);
    if (recForLeft && recForLeft.matches > 0) {
      h2hText = `通算: ${match.left.name} ${recForLeft.wins}勝 - ${recForLeft.losses}勝 ${match.right.name}`;
    }

    // z-index: 下の段ほど高い（下のカードの画像が上のカードの背景の前に出る）
    const zIdx = total - di;

    cardsHtml += `
      <div class="ppvmc-card${mainClass}" style="z-index:${zIdx}">
        <div class="ppvmc-card-bg"></div>
        <div class="ppvmc-fighter left">
          ${_imgOrInitial(getFullUrl(match.left.id, match.left.ovr), match.left.id, 160)}
        </div>
        <div class="ppvmc-center">
          <div class="ppvmc-type">${typeLabel}</div>
          <div class="ppvmc-cname">${match.left.name}</div>
          <div class="ppvmc-vs">V S</div>
          <div class="ppvmc-cname">${match.right.name}</div>
          ${badge}
          <div class="ppvmc-h2h">${h2hText}</div>
        </div>
        <div class="ppvmc-fighter right">
          ${_imgOrInitial(getFullUrl(match.right.id, match.right.ovr), match.right.id, 160)}
        </div>
      </div>`;
  }

  const el = document.getElementById('ppvMatchCardOverlay');
  el.innerHTML = `<div class="ppvmc-inner">
    <div class="ppvmc-title">
      <div class="ppvmc-label">Special Event</div>
      <div class="ppvmc-bigname">${ppvName}</div>
      <div class="ppvmc-sub">Season ${season} ─ 全${total}試合</div>
    </div>
    <div class="ppvmc-list">${cardsHtml}</div>
    <div class="ppvmc-start"><button id="ppvmcStartBtn">S T A R T</button></div>
  </div>`;

  el.classList.add('active');
  document.getElementById('ppvmcStartBtn').addEventListener('click', () => {
    el.classList.remove('active');
    el.style.display = 'none';
    el.style.pointerEvents = 'none';
    onStart();
  });
}

// ── PPV GRAND FINAL: Match Preview / Result / TV ──
function renderPPVMatchPreview() {
  const pp = App._ppvPreview;
  if (!pp) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const total = pp.card.length;
  const resolved = pp.results.filter(r => r !== null).length;
  const ppvName = G.ppvName || 'GRAND FINAL';

  // 次の未解決試合を特定（前座=card[0]から順にメイン=card[total-1]へ）
  let nextIdx = -1;
  for (let i = 0; i < total; i++) {
    if (pp.results[i] === null) { nextIdx = i; break; }
  }

  // stat比較行ヘルパー
  function _statRow(label, lv, rv, cls) {
    const bwL = Math.max(4, Math.round(lv / 100 * 100));
    const bwR = Math.max(4, Math.round(rv / 100 * 100));
    const dlv = Math.round(lv), drv = Math.round(rv);
    return `<div class="ppvprog-sr">
      <div class="ppvprog-sbl"><span class="ppvprog-sv${lv>rv?' hi':''}">${dlv}</span><div class="ppvprog-bt"><div class="ppvprog-bf ${cls}" style="width:${bwL}%"></div></div></div>
      <div class="ppvprog-sl">${label}</div>
      <div class="ppvprog-sbr"><div class="ppvprog-bt"><div class="ppvprog-bf ${cls}" style="width:${bwR}%"></div></div><span class="ppvprog-sv${rv>lv?' hi':''}">${drv}</span></div>
    </div>`;
  }

  let html = `<div class="ppvprog-header">
    <div class="ppvprog-label">Special Event</div>
    <div class="ppvprog-name">${ppvName}</div>
    <div class="ppvprog-progress">全${total}試合 ─ ${resolved}/${total} 完了</div>
  </div><div class="ppvprog-wrap">`;

  // カード表示: card[0]=前座(下), card[total-1]=メイン(上)
  // 表示はメインイベント(上)→前座(下)
  for (let di = total - 1; di >= 0; di--) {
    const idx = di;
    const match = pp.card[idx];
    const result = pp.results[idx];
    const isResolved = result !== null;
    const isNext = idx === nextIdx;
    const isRevealed = isResolved || (nextIdx >= 0 && idx <= nextIdx);
    const matchNum = idx + 1;
    const isMain = !!match.isSummit;
    const typeLabel = isMain ? 'MAIN EVENT' : `第${matchNum}試合`;

    if (!isRevealed) {
      // 未到達（霧）
      html += `<div class="ppvprog-mw">
        <div class="ppvprog-mwh">${typeLabel}</div>
        <div class="ppvprog-mwn">${match.left.name} vs ${match.right.name}</div>
      </div>`;
      continue;
    }

    if (isResolved) {
      // 終了済み: コンパクト行
      const wName = result.winner === 'draw' ? '引き分け' : result.winner === 'left' ? match.left.name : match.right.name;
      const loser = result.winner === 'left' ? match.right.name : result.winner === 'right' ? match.left.name : '';
      const fin = (result.finType || result.finMove) ? Engine.formatFinish(result.finType, result.finMove) : '';
      const mqCls = result.mq >= 75 ? 'h' : 'm';
      html += `<div class="ppvprog-md">
        <div class="ppvprog-mdn">${typeLabel}</div>
        <div class="ppvprog-mdc">
          <div>
            <div class="ppvprog-mdw"><span class="w">✓ ${wName}</span>${loser ? ` <span style="color:#555">def.</span> ${loser}` : ''}</div>
            ${fin ? `<div class="ppvprog-mdr">${fin}</div>` : ''}
          </div>
          <div class="ppvprog-mdmq ${mqCls}">MQ ${result.mq}</div>
        </div>
      </div>`;
      continue;
    }

    // 現在の試合: 大カード
    const L = match.left, R = match.right;
    const ovrL = Engine.util.ov(L), ovrR = Engine.util.ov(R);
    const upperL = getUpperUrl(L.id);
    const upperR = getUpperUrl(R.id);
    const orgL = L._ppvOrgName || '';
    const orgR = R._ppvOrgName || '';
    const traitsL = (L.traits || []).slice(0, 3);
    const traitsR = (R.traits || []).slice(0, 3);
    const lineL = _getPPVPreMatchLine(L);
    const lineR = _getPPVPreMatchLine(R);
    const badge = match.isRivalry ? `<div class="ppvprog-vsb">🔥 因縁対決</div>` : '';
    const mainClass = isMain ? ' is-main' : '';

    html += `<div class="ppvprog-mc${mainClass}">
      <div class="ppvprog-mn">${typeLabel}</div>
      ${match.hype ? `<div class="ppvprog-hype">${match.hype}</div>` : ''}
      <div class="ppvprog-dl">
        <div class="ppvprog-dlc left"><div class="ppvprog-dlb"><div class="ppvprog-dlsp">${L.name}</div>「${lineL}」</div></div>
        <div class="ppvprog-dlc right"><div class="ppvprog-dlb"><div class="ppvprog-dlsp">${R.name}</div>「${lineR}」</div></div>
      </div>
      <div class="ppvprog-va">
        <div class="ppvprog-fc left">
          <div class="ppvprog-fi">
            <div class="ppvprog-fn">${L.name}</div>
            <div class="ppvprog-fo">${orgL}</div>
            <div class="ppvprog-fol">OVR</div>
            <div class="ppvprog-fov">${ovrL}</div>
          </div>
          <div class="ppvprog-fp">${upperL ? `<img src="${upperL}" alt="${L.name}" onerror="this.style.display='none'">` : ''}</div>
        </div>
        <div class="ppvprog-vsf">
          <div class="ppvprog-vst">VS</div>
          ${badge}
        </div>
        <div class="ppvprog-fc right">
          <div class="ppvprog-fp">${upperR ? `<img src="${upperR}" alt="${R.name}" onerror="this.style.display='none'">` : ''}</div>
          <div class="ppvprog-fi">
            <div class="ppvprog-fn">${R.name}</div>
            <div class="ppvprog-fo">${orgR}</div>
            <div class="ppvprog-fol">OVR</div>
            <div class="ppvprog-fov">${ovrR}</div>
          </div>
        </div>
      </div>
      <div class="ppvprog-stats">
        ${_statRow('PW', L.pw||0, R.pw||0, 'pw')}
        ${_statRow('SP', L.sp||0, R.sp||0, 'sp')}
        ${_statRow('TE', L.te||0, R.te||0, 'te')}
        ${_statRow('ST', L.st||0, R.st||0, 'st')}
        ${_statRow('MN', L.mn||0, R.mn||0, 'mn')}
        <div class="ppvprog-traits">
          <div class="ppvprog-ts left">${traitsL.length ? traitsL.map(t=>`<span class="ppvprog-tt">${t}</span>`).join('') : '<span class="ppvprog-tt" style="opacity:0.3">─</span>'}</div>
          <div class="ppvprog-tdiv"></div>
          <div class="ppvprog-ts right">${traitsR.length ? traitsR.map(t=>`<span class="ppvprog-tt">${t}</span>`).join('') : '<span class="ppvprog-tt" style="opacity:0.3">─</span>'}</div>
        </div>
      </div>
      <div class="ppvprog-act">
        <button class="ppvprog-bw" onclick="App.ppvWatchMatch(${idx})">🎬 試合を観る</button>
        <button class="ppvprog-bs" onclick="App.ppvSkipMatch(${idx})">⏭ スキップ</button>
      </div>
    </div>`;
  }

  html += '</div>';

  // 全スキップ
  const remaining = pp.results.filter(r => r === null).length;
  if (remaining > 0) {
    html += `<div class="ppvprog-sa"><button onclick="App.ppvSkipAll()">残り全試合をスキップ（${remaining}試合）</button></div>`;
  }

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** PPV試合前のキャラセリフ取得（personality×archetypeベースの汎用セリフ） */
function _getPPVPreMatchLine(fighter) {
  return pickDialogueLine(PPV_OPPONENT_LINES, fighter);
}

function renderPPVResult(card, results, summitPair, heatChange, mqBonuses) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const ppvName = G.ppvName || 'GRAND FINAL';
  const validResults = results.filter(r => r);
  const avgMQ = validResults.length > 0 ? Math.round(validResults.reduce((s, r) => s + r.mq, 0) / validResults.length) : 0;
  const bestMQ = validResults.length > 0 ? Math.max(...validResults.map(r => r.mq)) : 0;
  const heat = getHeatLevel();
  const heatFooterCls = (heat.id === 'hot' || heat.id === 'on_fire') ? 'is-hot' :
                       (heat.id === 'cold' || heat.id === 'ice_cold') ? 'is-cold' : '';

  let html = `<div class="pb-container">`;

  // Banner
  html += `<div class="pb-banner">
    <div class="pb-live is-ppv">🏆 GRAND FINAL</div>
    <div class="pb-banner-title is-ppv">${escHtml(ppvName)}</div>
    <div class="pb-banner-sub">Year ${G.year || 1}<span class="dot">·</span>Week ${G.week || 48}<span class="dot">·</span>頂上決戦</div>
  </div>`;

  // Scoreboard: Avg MQ / Best MQ / Heat / Matches
  html += `<div class="pb-score-strip" style="grid-template-columns:1fr 1fr 1fr 1fr">
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(avgMQ)}</div>
      <div class="pb-score-val" style="margin-top:3px">${avgMQ}</div>
      <div class="pb-score-lbl">Avg MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(bestMQ)}</div>
      <div class="pb-score-val" style="margin-top:3px">${bestMQ}</div>
      <div class="pb-score-lbl">Best MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" ${heatFooterCls === 'is-hot' ? 'style="color:var(--c-rivalry)"' : heatFooterCls === 'is-cold' ? 'style="color:var(--c-info)"' : 'class="is-neutral"'}>${escHtml(heat.label.toUpperCase())}</div>
      <div class="pb-score-lbl">Heat</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val is-neutral">${validResults.length}</div>
      <div class="pb-score-lbl">Matches</div>
    </div>
  </div>`;

  html += `<div class="pb-matches">`;

  const total = card.length;
  const summitIdx = card.findIndex(m => m.isSummit);
  let shownMainLabel = false;
  let shownUndercardLabel = false;

  for (let di = total - 1; di >= 0; di--) {
    const match = card[di];
    const r = results[di];
    if (!r) continue;
    const isMain = match.isSummit;
    const matchNum = di + 1;

    // Section dividers
    if (isMain && !shownMainLabel) {
      html += `<div class="pb-divider is-main">🏆 MAIN EVENT — 頂上決戦</div>`;
      shownMainLabel = true;
    } else if (!isMain && !shownUndercardLabel && shownMainLabel) {
      html += `<div class="pb-divider">UNDERCARD</div>`;
      shownUndercardLabel = true;
    }

    const isDraw = r.winner === 'draw';
    const leftIsWinner = r.winner === 'left';
    const rightIsWinner = r.winner === 'right';
    const leftCls = isDraw ? 'is-draw' : (leftIsWinner ? 'is-winner' : 'is-loser');
    const rightCls = isDraw ? 'is-draw' : (rightIsWinner ? 'is-winner' : 'is-loser');

    // Dialogue triggers
    let winLine = '', loseLine = '';
    let coachPraise = null;
    if (!isDraw) {
      const winF = leftIsWinner ? r.left : r.right;
      const loseF = leftIsWinner ? r.right : r.left;
      const winChar = ALL_CHARS.find(c => c.id === winF.id);
      const loseChar = ALL_CHARS.find(c => c.id === loseF.id);

      if (r.rivalryBonus && (r.rivalryBonus.rivalry || 0) >= 30) {
        const ovrW = Engine.util.ov(winF);
        const ovrL = Engine.util.ov(loseF);
        const isUpsetRivalry = ovrW < ovrL - 8;
        const winPool = isUpsetRivalry && UPSET_RIVALRY_LINES ? UPSET_RIVALRY_LINES.winnerLines : RIVALRY_MATCH_REACTION.winnerLines;
        const losePool = isUpsetRivalry && UPSET_RIVALRY_LINES?.loserLines ? UPSET_RIVALRY_LINES.loserLines : RIVALRY_MATCH_REACTION.loserLines;
        winLine = pickDialogueLine(winPool, winChar);
        loseLine = pickDialogueLine(losePool, loseChar);
      } else if (isMain && winF._ppvOrgId === 'player') {
        winLine = pickDialogueLine(PPV_SUMMIT_VICTORY_LINES, winChar);
        const coach = Engine.coach.getCharCoach(G, winF.id);
        if (coach) {
          const praiseIdx = Math.floor(Math.random() * PPV_COACH_PRAISE_LINES.length);
          coachPraise = { name: coach.name, line: PPV_COACH_PRAISE_LINES[praiseIdx] };
        }
      }
    }

    const leftLine = leftIsWinner ? winLine : (!isDraw ? loseLine : '');
    const rightLine = rightIsWinner ? winLine : (!isDraw ? loseLine : '');
    const hasDialogue = !!(leftLine || rightLine);

    // Tags
    const tags = [];
    if (r.isTitleMatch) tags.push(`<span class="pb-tag is-title">🏆 タイトルマッチ</span>`);
    if (r.rivalryResolved) tags.push(`<span class="pb-tag is-rivalry">⚡ 決着！</span>`);
    else if (r.rivalryBonus) tags.push(`<span class="pb-tag is-rivalry">⚔ ${escHtml(r.rivalryBonus.label || '因縁')}</span>`);
    if (r.freshnessBonus) {
      if (r.freshnessBonus > 0) tags.push(`<span class="pb-tag is-first">✨ ${escHtml(r.freshnessLabel || '初顔合わせ')}</span>`);
      else tags.push(`<span class="pb-tag is-stale">😐 ${escHtml(r.freshnessLabel || 'フレッシュ度低')}</span>`);
    }

    // Meta: org name for PPV
    const metaLeft = r.left._ppvOrgName || (isMain ? 'Summit' : `Match ${matchNum}`);
    const metaRight = r.right._ppvOrgName || (isMain ? 'Summit' : `Match ${matchNum}`);

    let winnerLabel;
    if (isDraw) winnerLabel = 'DRAW';
    else {
      const winF = leftIsWinner ? r.left : r.right;
      winnerLabel = `🏆 ${escHtml(winF.name)} WIN`;
    }

    const rowCls = `pb-mrow${isMain ? ' is-main is-ppv' : ''}${hasDialogue ? ' has-dialogue' : ''}`;
    html += `<div class="${rowCls}">`;
    html += _pbFighterBlock('left', r.left, leftCls, metaLeft, leftLine);
    html += _pbResultColumn({
      winnerLabel,
      winnerIsDraw: isDraw,
      finishText: Engine.formatFinish(r.finType, r.finMove),
      turns: r.turns,
      mq: r.mq
    });
    html += _pbFighterBlock('right', r.right, rightCls, metaRight, rightLine);
    if (tags.length) html += `<div class="pb-mrow-tags">${tags.join('')}</div>`;
    if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
    if (coachPraise) {
      html += `<div class="pb-coach-praise">
        <span class="pb-coach-praise-label">🎓 Coach</span>
        <div class="pb-coach-praise-text"><span class="coach-name">${escHtml(coachPraise.name)}</span>「${escHtml(coachPraise.line)}」</div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`; // .pb-matches

  // Footer: 対戦pt + Heat + button
  let footerExtras = '';
  if (summitIdx >= 0 && results[summitIdx]) {
    const sr = results[summitIdx];
    const leftOrg = card[summitIdx].left._ppvOrgId;
    const rightOrg = card[summitIdx].right._ppvOrgId;
    const winnerOrgId = sr.winner === 'left' ? leftOrg : sr.winner === 'right' ? rightOrg : null;
    const playerInSummit = leftOrg === 'player' || rightOrg === 'player';
    if (playerInSummit && winnerOrgId) {
      const playerWon = winnerOrgId === 'player';
      const sign = playerWon ? '+' : '-';
      footerExtras = `<div class="pb-footer-heat" style="color:${playerWon ? 'var(--gold)' : 'var(--c-negative)'}">BP<span class="val">${sign}${BATTLE_POINT_CFG.summit}</span></div>`;
    }
  }

  html += `<div class="pb-footer">
    ${footerExtras}
    <div class="pb-footer-heat">Heat<span class="val ${heatFooterCls}">${heat.emoji} ${escHtml(heat.label.toUpperCase())}</span></div>
    <button type="button" class="pb-close-btn" onclick="App.closePPVResult()">オフシーズンへ →</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** HP対比バー — 中央基準の左右対称表示（UI共通ルール①） */
function _hpComparisonBar(leftName, leftHP, rightName, rightHP) {
  const lPct = leftHP.max > 0 ? Math.round(leftHP.final / leftHP.max * 100) : 0;
  const rPct = rightHP.max > 0 ? Math.round(rightHP.final / rightHP.max * 100) : 0;
  const lColor = lPct > 30 ? '#2ecc71' : lPct > 10 ? '#f39c12' : '#e74c3c';
  const rColor = rPct > 30 ? '#2ecc71' : rPct > 10 ? '#f39c12' : '#e74c3c';
  return `<div class="hp-cmp">
    <div class="hp-cmp-half left">
      <div class="hp-cmp-track"><div class="hp-cmp-fill" style="width:${lPct}%;background:${lColor}"></div></div>
      <span class="hp-cmp-val">${leftHP.final}/${leftHP.max}</span>
      <span class="hp-cmp-name">${leftName}</span>
    </div>
    <div class="hp-cmp-center">HP</div>
    <div class="hp-cmp-half right">
      <div class="hp-cmp-track"><div class="hp-cmp-fill" style="width:${rPct}%;background:${rColor}"></div></div>
      <span class="hp-cmp-val">${rightHP.final}/${rightHP.max}</span>
      <span class="hp-cmp-name">${rightName}</span>
    </div>
  </div>`;
}

/** PPV結果画面: 吹き出しHTML生成 */
function _ppvBubble(name, line, isWinner) {
  const nameColor = isWinner ? 'color:var(--gold)' : 'color:#e17055';
  const namePrefix = isWinner ? '🏆 ' : '';
  return `<div style="margin-bottom:8px;width:100%">
    <div style="font-size:9px;font-weight:600;${nameColor};text-align:center;margin-bottom:3px">${namePrefix}${name}</div>
    <div style="background:#f0f0f0;color:#222;padding:7px 10px;border-radius:8px;font-size:11px;text-align:center;line-height:1.5;position:relative">
      ${line}
      <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #f0f0f0"></div>
    </div>
  </div>`;
}

/** PPV結果画面: コーチ称賛吹き出しHTML生成 */
function _ppvCoachBubble(coachName, line) {
  return `<div style="margin-bottom:8px;width:100%">
    <div style="font-size:9px;font-weight:600;color:#7ec8e3;text-align:center;margin-bottom:3px">🎓 ${coachName}コーチ</div>
    <div style="background:rgba(126,200,227,0.12);color:#c8dce4;padding:7px 10px;border:1px solid rgba(126,200,227,0.2);border-radius:8px;font-size:11px;text-align:center;line-height:1.5;position:relative">
      「${line}」
      <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid rgba(126,200,227,0.12)"></div>
    </div>
  </div>`;
}

/** PPV結果画面: MQボーナスタグ群生成 */
function _ppvBonusTags(r, mqBonuses, di) {
  let tags = '';
  if (r.isTitleMatch) tags += ' <span style="color:var(--gold)">(王座+5)</span>';
  // titleGapPenalty — MQ外部ボーナス整理で廃止
  if (r.rivalryBonus) tags += ` <span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>`;
  // coachMQBonus — MQ外部ボーナス整理で廃止
  if (r.freshnessBonus) tags += ` <span style="color:${r.freshnessBonus > 0 ? '#74b9ff' : '#e17055'}">(${r.freshnessLabel}${r.freshnessBonus > 0 ? '+' : ''}${r.freshnessBonus})</span>`;
  if (r.friendshipBonus) tags += ` <span style="color:#74b9ff">(相性+${r.friendshipBonus})</span>`;
  return tags;
}

function renderPPVTVResult(card, results, ppvName) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  const validResults = results.filter((r, i) => card[i] && r);
  const avgMQ = validResults.length > 0 ? Math.round(validResults.reduce((s, r) => s + r.mq, 0) / validResults.length) : 0;
  const bestMQ = validResults.length > 0 ? Math.max(...validResults.map(r => r.mq)) : 0;

  const total = card.length;
  const summitIdx = card.findIndex(m => m.isSummit);
  const sortedIdx = [];
  if (summitIdx >= 0) sortedIdx.push(summitIdx);
  for (let i = total - 1; i >= 0; i--) { if (i !== summitIdx) sortedIdx.push(i); }

  // 感情テキスト（bestMQ帯で分岐）
  const emotionText =
    bestMQ >= 80 ? '……すごい試合だった。来年こそ、あの舞台で戦う' :
    bestMQ >= 70 ? 'いい大会だった。来年は、絶対にあの舞台に立つ' :
    bestMQ >= 55 ? 'まだ差がある。でも来年は必ず——' :
                   '来年こそは、この舞台に……';

  let html = `<div class="pb-container">`;

  // Banner: PPV TV (青系バッジ、プレイヤー不参加なので控えめ)
  html += `<div class="pb-banner">
    <div class="pb-live is-ppvtv">📺 PPV 観戦</div>
    <div class="pb-banner-title is-ppvtv">${escHtml(ppvName || 'GRAND FINAL')}</div>
    <div class="pb-banner-sub">Year ${G.year || 1}<span class="dot">·</span>Week ${G.week || 48}<span class="dot">·</span>テレビの前で</div>
  </div>`;

  // Scoreboard: Avg MQ / Best MQ / Matches
  html += `<div class="pb-score-strip" style="grid-template-columns:1fr 1fr 1fr">
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(avgMQ)}</div>
      <div class="pb-score-val" style="margin-top:3px">${avgMQ}</div>
      <div class="pb-score-lbl">Avg MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(bestMQ)}</div>
      <div class="pb-score-val" style="margin-top:3px">${bestMQ}</div>
      <div class="pb-score-lbl">Best MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val is-neutral">${validResults.length}</div>
      <div class="pb-score-lbl">Matches</div>
    </div>
  </div>`;

  html += `<div class="pb-matches">`;
  let shownMainLabel = false;
  let shownUndercardLabel = false;

  sortedIdx.forEach((di, pos) => {
    const match = card[di];
    const r = results[di];
    if (!r) return;
    const isMain = match.isSummit;

    if (isMain && !shownMainLabel) {
      html += `<div class="pb-divider is-main">🏆 MAIN EVENT — 頂上決戦</div>`;
      shownMainLabel = true;
    } else if (!isMain && !shownUndercardLabel && shownMainLabel) {
      html += `<div class="pb-divider">UNDERCARD</div>`;
      shownUndercardLabel = true;
    }

    const isDraw = r.winner === 'draw';
    const leftIsWinner = r.winner === 'left';
    const rightIsWinner = r.winner === 'right';
    const leftCls = isDraw ? 'is-draw' : (leftIsWinner ? 'is-winner' : 'is-loser');
    const rightCls = isDraw ? 'is-draw' : (rightIsWinner ? 'is-winner' : 'is-loser');

    // 頂上決戦勝者のみセリフ
    let winLine = '';
    if (isMain && !isDraw) {
      const winF = leftIsWinner ? match.left : match.right;
      const winChar = ALL_CHARS.find(c => c.id === winF.id);
      if (winChar) winLine = pickDialogueLine(PPV_SUMMIT_VICTORY_LINES, winChar);
    }
    const leftLine = leftIsWinner ? winLine : '';
    const rightLine = rightIsWinner ? winLine : '';
    const hasDialogue = !!(leftLine || rightLine);

    const metaLeft = match.left._ppvOrgName || '—';
    const metaRight = match.right._ppvOrgName || '—';

    let winnerLabel;
    if (isDraw) winnerLabel = 'DRAW';
    else {
      const winF = leftIsWinner ? match.left : match.right;
      winnerLabel = `🏆 ${escHtml(winF.name)} WIN`;
    }

    const tags = [];
    if (r.isTitleMatch) tags.push(`<span class="pb-tag is-title">🏆 タイトルマッチ</span>`);
    if (r.rivalryBonus) tags.push(`<span class="pb-tag is-rivalry">⚔ ${escHtml(r.rivalryBonus.label || '因縁')}</span>`);

    const rowCls = `pb-mrow${isMain ? ' is-main is-ppv' : ''}${hasDialogue ? ' has-dialogue' : ''}`;
    html += `<div class="${rowCls}">`;
    html += _pbFighterBlock('left', match.left, leftCls, metaLeft, leftLine);
    html += _pbResultColumn({
      winnerLabel,
      winnerIsDraw: isDraw,
      finishText: Engine.formatFinish(r.finType, r.finMove),
      turns: r.turns,
      mq: r.mq
    });
    html += _pbFighterBlock('right', match.right, rightCls, metaRight, rightLine);
    if (tags.length) html += `<div class="pb-mrow-tags">${tags.join('')}</div>`;
    if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
    html += `</div>`;
  });

  html += `</div>`; // .pb-matches

  // Footer: 感情テキスト + button
  html += `<div class="pb-footer" style="flex-direction:column;gap:12px">
    <div style="font-size:13px;color:var(--stage-text-sub);font-style:italic;line-height:1.8;text-align:center;max-width:540px">「${escHtml(emotionText)}」</div>
    <button type="button" class="pb-close-btn" onclick="App.closePPVTV()">オフシーズンへ →</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── Phase D: Rental UI Functions ──
function requestRental(fighterId, fromSource, fromOrgId) {
  const sel = document.getElementById(`rentalSeasons_${fighterId}`);
  const seasons = sel ? parseInt(sel.value) || 1 : 1;

  // Find fighter info for confirmation dialog
  let fighterName = '不明', fighterOvr = '?';
  if (fromSource === 'rival') {
    const orgData = G.aiOrgs && G.aiOrgs[fromOrgId];
    const f = orgData ? orgData.roster.find(c => c.id === fighterId) : null;
    if (f) { fighterName = f.name; fighterOvr = Engine.util.ov(f); }
  } else {
    const f = (G.freeAgents || []).find(c => c.id === fighterId);
    if (f) { fighterName = f.name; fighterOvr = Engine.util.ov(f); }
  }
  const feeEl = document.getElementById(`rentalFee_${fighterId}`);
  const fee = feeEl ? feeEl.textContent : '?';
  const srcLabel = fromSource === 'rival'
    ? (RIVAL_ORGS.find(o => o.id === fromOrgId)?.name || '他団体')
    : 'フリーエージェント';

  const portrait = portraitImg(fighterId, 64);
  const msg = `<div style="text-align:left;font-size:13px;line-height:1.8">
    <div style="font-size:15px;font-weight:700;margin-bottom:10px;color:var(--gold)">🤝 レンタル確認</div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      ${portrait}
      <div>
        <div style="font-size:15px;font-weight:700">${fighterName}</div>
        <div style="font-size:13px;color:var(--text-sub)">総合 <b style="color:var(--gold);font-size:16px">${fighterOvr}</b></div>
      </div>
    </div>
    <div><b>供給元:</b> ${srcLabel}</div>
    <div><b>期間:</b> ${seasons}期（${seasons * 12}週）</div>
    <div><b>費用:</b> <span style="color:#f39c12;font-weight:700">${fee}万</span>（前払い一括）</div>
    <div style="margin-top:6px;font-size:12px;color:var(--text-sub)">残り資金: ${Math.round(G.funds)}万 → ${Math.round(G.funds - parseInt(fee))}万</div>
  </div>`;

  showConfirm(msg, 'レンタルする', () => _executeRental(fighterId, fromSource, fromOrgId, seasons));
}

function _executeRental(fighterId, fromSource, fromOrgId, seasons) {
  Audio.play('transfer');
  const rng = (typeof sessionRng !== 'undefined' && sessionRng) ? sessionRng : Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, fighterId, seasons));
  const result = Engine.rental.requestRental(rng, G, fighterId, fromSource, fromOrgId || null, seasons);
  G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
  if (result.success) {
    const fighter = G.roster.find(c => c.id === fighterId);
    if (fighter) {
      const quote = getRentalQuote(fighter);
      const srcLabel = fromSource === 'rival'
        ? (RIVAL_ORGS.find(o => o.id === fromOrgId)?.name || '') + 'から'
        : 'フリーエージェントとして';
      showEventPopup({ type:'fighter', id:fighter.id, name:fighter.name, tone:'positive',
        message: quote, detail:`${srcLabel}レンタル加入！（${seasons}期 / ${seasons * 12}週）` });
    }
  } else {
    if (fromSource === 'rival') {
      const orgData = G.aiOrgs && G.aiOrgs[fromOrgId];
      const fighter = orgData ? orgData.roster.find(f => f.id === fighterId) : null;
      if (fighter) {
        showEventPopup({ type:'fighter', id:fighter.id, name:fighter.name, tone:'negative',
          message: '…今は移籍する気はないわ。', detail:'レンタル交渉は不成立でした' });
      }
    } else {
      showToast(result.events[0] || '交渉失敗', 'warning');
    }
  }
  Storage.autoSave();
  refreshAll();
}

/** Update displayed rental fee when season selector changes */
function updateRentalFee(fighterId) {
  const sel = document.getElementById(`rentalSeasons_${fighterId}`);
  const feeEl = document.getElementById(`rentalFee_${fighterId}`);
  const btnEl = document.getElementById(`rentalBtn_${fighterId}`);
  if (!sel || !feeEl) return;
  const seasons = parseInt(sel.value) || 1;
  const rentals = Engine.rental.getAvailableRentals(G);
  const r = rentals.find(x => x.fighter.id === fighterId);
  if (!r) return;
  const fee = r.fees[seasons] || r.fees[1];
  feeEl.textContent = fee;
  if (btnEl) btnEl.disabled = G.funds < fee;
}

/** Sort rental table by column key */
function sortRentalTable(key) {
  if (window._rentalSortKey === key) {
    window._rentalSortAsc = !window._rentalSortAsc;
  } else {
    window._rentalSortKey = key;
    window._rentalSortAsc = key === 'name'; // name: A→Z default, ovr/fee: ascending default
  }
  renderShachoshitsu();
}

// Legacy aliases for Engine functions used in UI rendering
function getCoachSalaryTotal() { return Engine.coach.getSalaryTotal(G); }
function unassignFromCoach(charId) { G = { ...G, coachAssign: Engine.coach.unassignFromCoach(G, charId) }; }
function assignToCoach(coachId, charId) {
  const unassigned = Engine.coach.unassignFromCoach(G, charId);
  const { coachAssign, success } = Engine.coach.assignToCoach({ ...G, coachAssign: unassigned }, coachId, charId);
  if (success) G = { ...G, coachAssign };
  return { coachAssign, success };
}
function getCoachAssignees(coachId) { return Engine.coach.getCoachAssignees(G, coachId); }
function calcWeeklySalary() { return Engine.economy.calcWeeklySalary(G.roster, G.titles); }
function calcFixedCosts() { return Engine.economy.calcFixedCosts(); }
function getWeeklyMediaRev() { return Engine.economy.calcWeeklyMediaRev(G.orgPop); }
function calcAttendance(venueIdx, mainPop, hasTitleMatch, hasChampOnCard) { return Engine.economy.calcAttendance(G, venueIdx, mainPop, hasTitleMatch, hasChampOnCard, null); }
function calcShowRevenue(venueIdx, attendance) { return Engine.economy.calcShowRevenue(venueIdx, attendance); }
// 全ポップアップ・トースト・キューを強制クリア（タブ切替・週送り時に使用）
function dismissAllPopups() {
  _POPUP_OVERLAY_IDS.forEach(oid => {
    const el = document.getElementById(oid);
    if (el) { el.classList.remove('active'); el.classList.remove('show'); }
  });
  // confirmOverlayは_POPUP_OVERLAY_IDSに含まれないため個別処理
  const confirmEl = document.getElementById('confirmOverlay');
  if (confirmEl) { confirmEl.classList.remove('active'); confirmEl.classList.remove('show'); }
  // 動的R3Modalがあれば除去
  document.querySelectorAll('.r3-modal-overlay').forEach(el => el.remove());
  document.querySelectorAll('.war-victory-overlay').forEach(el => el.remove());
  const battleOverlay = document.getElementById('battleOverlay');
  if (battleOverlay) battleOverlay.style.display = 'none';
  _popupQueue = [];
  _growthPopupQueue = [];
  if (typeof App !== 'undefined' && typeof App._beginWarUiTransition === 'function') {
    App._beginWarUiTransition();
    App._warPreview = null;
  }
  // 通知トースト
  const _toastEl = document.getElementById('notifEventToast');
  if (_toastEl) { _toastEl.classList.remove('show'); _toastEl.onclick = null; }
  clearTimeout(window._notifTimer);
  clearTimeout(window._notifSafetyTimer);
  clearTimeout(window._notifModalTimer);
  clearTimeout(window._careModalTimer);
}

// BGMを変えずに画面だけ切り替える（ドラフト交渉中のUI更新用）
function _showScreenNoBgm(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screenEl = document.getElementById(`screen-${id}`);
  if (screenEl) screenEl.classList.add('active');
  if (id === 'scoutEvent') renderScoutEvent();
}

function showScreen(id, evt) {
  if (id === 'training') id = 'roster'; // Legacy compat: training tab merged into roster
  // Legacy compat: scout tab merged into shachoshitsu (Phase C)
  if (id === 'scout') {
    id = 'shachoshitsu';
    if (typeof G !== 'undefined') G._shachoshitsuTab = 'scout';
  }
  // 交渉中・解雇面談中は社長室以外へのナビゲーションをブロック
  if (typeof G !== 'undefined' && G.weekPhase === 'contractNegotiation' && id !== 'shachoshitsu') return;
  if (typeof G !== 'undefined' && G._releaseInterviewTarget && id !== 'shachoshitsu') return;
  Audio.play('click');
  dismissAllPopups();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screenEl = document.getElementById(`screen-${id}`);
  if (screenEl) screenEl.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const t = evt?.currentTarget || evt?.target || null;
  const btn = t?.closest ? t.closest('.nav-btn') : t;
  if (btn && btn.classList) btn.classList.add('active');
  // v0.9: Auto-render screens that need fresh data
  // BGM: Restore appropriate BGM when leaving show screens
  if (id !== 'show' && G.weekPhase !== 'showExec') Audio.bgm.playForState();
  if (id === 'ranking') renderRanking();
  if (id === 'roster') renderRoster();
  if (id === 'coach') renderCoach();
  if (id === 'scoutEvent') renderScoutEvent();
  if (id === 'database') renderDatabase();
  if (id === 'newspaper') renderNewspaper();
  if (id === 'shachoshitsu') renderShachoshitsu();
  if (id === 'week') renderWeekScreen();
}

// v0.96: Navigate to a screen and highlight the correct nav button
function gotoScreen(id) {
  const navBtns = document.querySelectorAll('.nav-btn');
  for (const b of navBtns) {
    if (b.getAttribute('onclick')?.includes(`'${id}'`)) {
      b.click();
      return;
    }
  }
  showScreen(id);
}

// v1.0: Help accordion toggle
function toggleHelp(btn) {
  const section = btn.closest('.help-section');
  if (!section) return;
  section.classList.toggle('open');
}

// ══════════════════════════════════════════════════════════
//  v1.8: 成長イベントポップアップシステム
//  ブレークスルー / スランプ / モチベ喪失 / AI脅威通知
// ══════════════════════════════════════════════════════════

let _growthPopupQueue = [];
let _growthPopupCallback = null;

/**
 * 成長イベントポップアップをキューに追加して順次表示
 * @param {Array} events - pendingGrowthEvents 配列
 * @param {Function} [onDone] - 全て完了後コールバック
 */
function showGrowthEventPopups(events, onDone) {
  if (!events || events.length === 0) { if (onDone) onDone(); return; }
  _growthPopupQueue = [...events];
  _growthPopupCallback = onDone || null;
  _enqueuePopup(() => _renderNextGrowthPopup());
}

function _renderNextGrowthPopup() {
  if (_growthPopupQueue.length === 0) {
    if (_growthPopupCallback) { _growthPopupCallback(); _growthPopupCallback = null; }
    return;
  }
  const ev = _growthPopupQueue[0];

  // A-6 分岐: breakthrough は mdl-a に専用描画
  if (ev.type === 'breakthrough') {
    _renderBreakthroughAsMdlA(ev);
    return;
  }

  const overlay = document.getElementById('growthEventOverlay');
  const box = document.getElementById('growthEventBox');
  if (!overlay || !box) {
    console.warn('[growthEvent] overlay/box not found, skipping');
    _growthPopupQueue.shift();
    _renderNextGrowthPopup();
    return;
  }

  const fighter = G.roster.find(c => c.id === ev.fighterId)
    || G.retiredFighters?.find(c => c.id === ev.fighterId);

  let title = '', message = '', detail = '', btnLabel = 'OK', tone = '';

  if (ev.type === 'breakthrough') {
    const f = fighter;
    const statNames = { pw:'パワー', sp:'スピード', te:'テクニック', st:'スタミナ', mn:'メンタル' };
    title = '💥 ブレークスルー！';
    message = f ? pickDialogueLine(BREAKTHROUGH_LINES, f) : 'ブレークスルー！';
    detail  = `${statNames[ev.stat] || ev.stat} <strong>+${parseFloat((+ev.gain).toFixed(1))}</strong>`;
    if (ev.hotStreak) detail += '　🔥 <em>絶好調突入！</em>';
    btnLabel = '素晴らしい';
    tone = 'gold';
    Audio.play('award');
  } else if (ev.type === 'slump_start') {
    const triggerLines = SLUMP_START_LINES[ev.trigger] || SLUMP_START_LINES['defeat'];
    title = '📉 スランプ…';
    message = pickDialogueLine(triggerLines, fighter);
    detail = 'しばらく成長が止まるかもしれない';
    btnLabel = '見守る';
    tone = 'negative';
    Audio.play('error');
  } else if (ev.type === 'slump_end') {
    title = '💪 スランプ脱出！';
    message = pickDialogueLine(SLUMP_END_LINES, fighter);
    detail = `${ev.duration || '?'}週間のスランプを乗り越えた！`;
    btnLabel = 'おかえり';
    tone = 'positive';
    Audio.play('event');
  } else if (ev.type === 'motivation_loss_start') {
    title = '😞 モチベーション喪失…';
    message = pickDialogueLine(MOTIVATION_LOSS_LINES, fighter);
    detail = '成長が止まり、能力が低下していく';
    btnLabel = '……';
    tone = 'negative';
    Audio.play('error');
  } else if (ev.type === 'motivation_loss_end') {
    title = '🌅 再起！';
    message = pickDialogueLine(MOTIVATION_RECOVERY_LINES, fighter);
    detail = `${ev.duration || '?'}週間の低迷から立ち直った！`;
    btnLabel = '待ってた';
    tone = 'positive';
    Audio.play('event');
  } else if (ev.type === 'milestone') {
    const STAT_JA = { pw:'パワー', sp:'スピード', te:'テクニック', st:'スタミナ', mn:'メンタル' };
    let icon, label, isGold;
    if (ev.subtype === 'ovr') {
      icon = ev.value >= 95 ? '👑' : ev.value >= 80 ? '🏆' : '🏅';
      label = `総合力 ${ev.value} 到達`;
      isGold = ev.value >= 80;
    } else if (ev.subtype === 'pop') {
      icon = ev.value >= 80 ? '🌟' : '✨';
      label = `人気 ${ev.value} 到達`;
      isGold = ev.value >= 80;
    } else {
      icon = '⚡';
      label = `${STAT_JA[ev.stat] || ev.stat} 極限到達`;
      isGold = true;
    }
    title = `${icon} ${label}`;
    message = ev.line || '';
    detail = '';
    btnLabel = isGold ? '素晴らしい' : 'よくやった';
    tone = isGold ? 'milestone-gold' : 'milestone';
    ev.category = 'MILESTONE';
    Audio.play(isGold ? 'award' : 'event');
  }

  // 顔画像
  let faceHtml = '';
  if (fighter) {
    const url = getPortraitUrl(fighter.id);
    if (url) faceHtml = `<img src="${url}" alt="">`;
    else {
      const ch = ALL_CHARS.find(c => c.id === fighter.id);
      faceHtml = `<div class="emoji-face">${ch ? ch.name.charAt(0) : '?'}</div>`;
    }
  }

  // ブレイクスルー兆し（試合中のモノローグ）
  const hintHtml = ev.btHint ? `<div class="growth-event-hint">${ev.btHint}</div>` : '';
  // スナップショット追記（あれば）
  const snapHtml = ev.snapshotText ? `<div class="log-snapshot" style="margin-top:8px;font-size:11px">\u{1F4AD} ${ev.snapshotText}</div>` : '';

  const categoryHtml = ev.category ? `<div class="growth-event-category">${ev.category}</div>` : '';
  box.className = `growth-event-box ${tone}`;
  box.innerHTML = `
    <div class="growth-event-face">${faceHtml}</div>
    <div class="growth-event-name">${fighter ? fighter.name : ''}</div>
    ${hintHtml}
    ${categoryHtml}
    <div class="growth-event-title">${title}</div>
    <div class="growth-event-msg">${message}</div>
    ${detail ? `<div class="growth-event-detail">${detail}</div>` : ''}
    ${snapHtml}
    <button class="growth-event-btn" onclick="closeGrowthEventPopup()">${btnLabel}</button>
  `;
  overlay.classList.add('active');
}

/** A-6: ブレークスルー報告を mdl-a で描画 */
function _renderBreakthroughAsMdlA(ev) {
  const fighter = G.roster.find(c => c.id === ev.fighterId)
    || G.retiredFighters?.find(c => c.id === ev.fighterId);

  const statNames = { pw:'パワー', sp:'スピード', te:'テクニック', st:'スタミナ', mn:'メンタル' };
  const statLabel = statNames[ev.stat] || ev.stat;
  const gain = parseFloat((+ev.gain).toFixed(1));
  const line = fighter ? pickDialogueLine(BREAKTHROUGH_LINES, fighter) : 'ブレークスルー！';

  const surgeHtml = `
    <div style="text-align:center;margin:10px 0 8px">
      <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:3px;margin-bottom:6px">STAT SURGE ・ 能 力 急 上 昇</div>
      <div style="display:inline-flex;align-items:baseline;gap:10px;padding:12px 30px;background:linear-gradient(180deg,rgba(122,101,48,0.15),rgba(122,101,48,0.04));border:1.5px solid rgba(122,101,48,0.5);border-radius:6px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),0 2px 16px rgba(212,168,67,0.2)">
        <span style="font-size:16px;color:#b5453a;font-weight:700;letter-spacing:1px">${statLabel}</span>
        <span style="font-family:var(--font-display);font-size:44px;font-weight:700;color:var(--cream-gold-dark);letter-spacing:2px;line-height:1">+${gain}</span>
      </div>
    </div>
  `;

  const hotStreakHtml = ev.hotStreak
    ? `<div style="text-align:center;font-size:12px;color:#b5453a;margin-top:4px;font-weight:700">🔥 絶好調突入！</div>`
    : '';
  const btHintHtml = ev.btHint
    ? `<div style="font-family:'Shippori Mincho',serif;font-style:italic;font-size:13px;color:var(--cream-text-sub);margin:12px auto 0;max-width:440px;text-align:center;line-height:1.7">${ev.btHint}</div>`
    : '';
  const snapHtml = ev.snapshotText
    ? `<div style="margin-top:8px;font-size:11px;color:var(--cream-text-dim);text-align:center">💭 ${ev.snapshotText}</div>`
    : '';

  const stageBody = `
    ${surgeHtml}
    ${hotStreakHtml}
    <div class="mdl-a-observation centered" style="margin-top:10px;font-size:14px">
      ${fighter ? `<span class="marker">${_factionSurname ? _factionSurname(fighter) : fighter.name}</span>` : ''}${line ? `<br>「${line}」` : ''}
    </div>
    ${btHintHtml}
    ${snapHtml}
  `;

  const subjectHtml = fighter
    ? _mdlASubjectStage(fighter, stageBody)
    : `<div class="mdl-a-subject-stage">${stageBody}</div>`;

  const html = `
    ${_mdlAHeader('🌱 練習場からの報告', `BREAKTHROUGH ・ ${_mdlASeasonLabel(G)}`)}
    ${_mdlAReporterStrip(G, '社長、嬉しい知らせです')}
    ${subjectHtml}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="mdlABreakthroughClose">— 素 晴 ら し い —</button>
    </div>
  `;

  if (!_mdlAOpen(html, { narrow: true })) {
    // 失敗時はキュー進行のみ
    _growthPopupQueue.shift();
    setTimeout(_renderNextGrowthPopup, 100);
    return;
  }
  Audio.play('award');

  const btn = document.getElementById('mdlABreakthroughClose');
  if (btn) btn.addEventListener('click', () => closeGrowthEventPopup());
}

function closeGrowthEventPopup() {
  const overlay = document.getElementById('growthEventOverlay');
  if (overlay) overlay.classList.remove('active');
  // A-6(mdl-a)を使っていれば閉じる
  _mdlAClose();
  _growthPopupQueue.shift();
  if (_growthPopupQueue.length > 0) {
    setTimeout(_renderNextGrowthPopup, 250);
  } else if (_growthPopupCallback) {
    const cb = _growthPopupCallback;
    _growthPopupCallback = null;
    setTimeout(cb, 250);
    _drainPopupQueue();
  } else {
    _drainPopupQueue();
  }
}

// ─── AI成長イベント脅威/好機アラート ──────────────────────

let _aiAlertQueue = [];
let _aiAlertCallback = null;

function showAIGrowthAlerts(alerts, onDone) {
  if (!alerts || alerts.length === 0) { if (onDone) onDone(); return; }
  if (_isPopupActive()) { _popupQueue.push(() => showAIGrowthAlerts(alerts, onDone)); return; }
  // major な脅威のみポップアップ、それ以外はスキップ
  const notable = alerts.filter(a =>
    (a.type === 'threat' && a.isMajor) ||
    (a.type === 'opportunity' && a.eventType === 'motivation_loss')
  );
  if (notable.length === 0) { if (onDone) onDone(); return; }
  _aiAlertQueue = [...notable];
  _aiAlertCallback = onDone || null;
  _renderNextAIAlert();
}

function _renderNextAIAlert() {
  if (_aiAlertQueue.length === 0) {
    if (_aiAlertCallback) { _aiAlertCallback(); _aiAlertCallback = null; }
    return;
  }
  const alert = _aiAlertQueue[0];
  const isThreat = alert.type === 'threat';
  const title = isThreat ? '⚠ 脅威：ライバルが成長した' : '📰 好機：ライバルが不調';
  const org = alert.org;
  const fighter = alert.fighter;
  const statNames = { pw:'パワー', sp:'スピード', te:'テクニック', st:'スタミナ', mn:'メンタル' };
  let message = '', detail = '';
  if (isThreat) {
    message = `${org.emoji || ''} ${org.name || ''}の${fighter.name}がブレークスルー！`;
    detail = alert.stat ? `${statNames[alert.stat]} +${parseFloat((+(alert.gain||0)).toFixed(1))}` : '急成長';
  } else {
    message = `${org.emoji || ''} ${org.name || ''}の${fighter.name}がモチベを喪失…`;
    detail = 'ライバル団体に隙が生まれた。攻勢のチャンス！';
  }
  // eventPopup を流用
  showEventPopup({
    type: 'fighter',
    id: fighter.id,
    name: fighter.name,
    emoji: isThreat ? '⚠' : '📰',
    tone: isThreat ? 'negative' : 'positive',
    message,
    detail
  });
  _aiAlertQueue.shift();
  if (_aiAlertQueue.length > 0) {
    _onEventPopupQueueEmpty = _renderNextAIAlert;
  } else {
    _onEventPopupQueueEmpty = _aiAlertCallback ? (() => {
      const cb = _aiAlertCallback; _aiAlertCallback = null; cb();
    }) : null;
  }
}

// ══════════════════════════════════════════════════════════
//  v1.9: トースト通知 / シーズン開幕ファンファーレ
// ══════════════════════════════════════════════════════════

// 画面下部に短時間表示されるトースト通知
function showToast(msg, duration) {
  const el = document.getElementById('toastEl');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  el.classList.remove('dismissable');
  el.onclick = null;
  clearTimeout(window._toastTimer);
  clearTimeout(window._toastDismissTimer);

  window._toastDismissTimer = setTimeout(() => {
    el.classList.add('dismissable');
    el.onclick = () => {
      clearTimeout(window._toastTimer);
      clearTimeout(window._toastDismissTimer);
      el.classList.remove('show', 'dismissable');
      el.onclick = null;
    };
  }, 4000);

  window._toastTimer = setTimeout(() => {
    el.classList.remove('show', 'dismissable');
    el.onclick = null;
  }, 30000);
}

// 新シーズン開幕ファンファーレ演出
function showSeasonFanfare(season, onDone) {
  if (_isPopupActive()) { _popupQueue.push(() => showSeasonFanfare(season, onDone)); return; }
  const overlay = document.getElementById('seasonFanfareOverlay');
  const box = document.getElementById('seasonFanfareBox');
  if (!overlay || !box) { if (onDone) onDone(); return; }
  box.innerHTML = `
    <div style="font-family:'Bebas Neue',sans-serif;font-size:72px;letter-spacing:4px;line-height:1;
      background:linear-gradient(180deg,#fff 20%,var(--gold-light));-webkit-background-clip:text;
      -webkit-text-fill-color:transparent;background-clip:text">SEASON ${season}</div>
    <div style="font-size:20px;color:var(--gold);margin-top:8px;font-family:'Oswald',sans-serif;
      letter-spacing:4px;text-transform:uppercase">シーズン開幕</div>
    <div style="font-size:12px;color:var(--text-dim);margin-top:14px">— タップで続行 —</div>
  `;
  overlay.classList.add('show');
  Audio.play('fanfare');
  window._sfDismiss = () => {
    overlay.classList.remove('show');
    overlay.removeEventListener('click', window._sfDismiss);
    window._sfDismiss = null;
    if (onDone) setTimeout(onDone, 100);
    _drainPopupQueue();
  };
  overlay.addEventListener('click', window._sfDismiss);
  // 安全策: 通常はタップで閉じるが、万が一に備えて長めのフォールバックを残す
  clearTimeout(window._sfTimer);
  window._sfTimer = setTimeout(() => { if (window._sfDismiss) window._sfDismiss(); }, 60000);
}

// ══════════════════════════════════════════════
//  v1.4w: 新聞パネル（業界ニュース）
// ══════════════════════════════════════════════
function showNewspaperPanel(articles, onDone) {
  if (_isPopupActive()) { _popupQueue.push(() => showNewspaperPanel(articles, onDone)); return; }
  const overlay = document.getElementById('newspaperOverlay');
  const box = document.getElementById('newspaperBox');
  if (!overlay || !box || articles.length === 0) { if (onDone) onDone(); return; }

  let idx = 0;

  function renderArticle(i) {
    const a = articles[i];
    const pUrl = a.characterId ? getPortraitUrl(a.characterId) : null;
    const faceHtml = pUrl
      ? `<img src="${pUrl}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(139,90,43,0.4);margin:10px auto" alt="">`
      : '';
    const navHtml = articles.length > 1
      ? `<div style="display:flex;justify-content:center;gap:12px;margin-bottom:10px">
          <button class="newspaper-nav" onclick="window._newsNav(-1)" ${i===0?'disabled':''} style="${i===0?'opacity:0.3':''}">&lt; 前</button>
          <span style="font-size:11px;color:rgba(80,50,20,0.5)">${i+1} / ${articles.length}</span>
          <button class="newspaper-nav" onclick="window._newsNav(1)" ${i===articles.length-1?'disabled':''} style="${i===articles.length-1?'opacity:0.3':''}">次 &gt;</button>
        </div>`
      : '';

    box.innerHTML = `
      <div class="newspaper-header">📰 業界ニュース</div>
      ${navHtml}
      <div class="newspaper-headline">${a.headline}</div>
      ${faceHtml}
      <div class="newspaper-body">${a.body}</div>
      <button class="newspaper-close" onclick="window._newsClose()">閉じる</button>
    `;
  }

  window._newsNav = (dir) => {
    idx = Math.max(0, Math.min(articles.length - 1, idx + dir));
    Audio.play('click');
    renderArticle(idx);
  };

  window._newsClose = () => {
    Audio.play('click');
    overlay.classList.remove('active');
    window._newsNav = null;
    window._newsClose = null;
    if (onDone) setTimeout(onDone, 100);
    _drainPopupQueue();
  };

  Audio.play('reveal');
  renderArticle(0);
  overlay.classList.add('active');
}

// showShowResultNewspaper removed — newspaper is now in database sub-tab


// ─────────────────────────────────────────────────────────────────────────────
// v1.5s25b: Milestone Event Popup — ナレーション形式の3択イベント
// ─────────────────────────────────────────────────────────────────────────────
function showMilestoneEvent(evt, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showMilestoneEvent(evt, onChoice)); return; }

  // Phase 1: ナレーション + 3択(B-5型 ゴールドステージ)
  const title = (evt.title || '').replace(/^[\W\s]+/, '') || evt.title || 'MILESTONE';
  const sub = 'MILESTONE ACHIEVED';
  const choicesHtml = evt.choices.map((c, i) =>
    `<button class="mdl-b-btn${i === 0 ? ' primary' : ''}" data-idx="${i}">${c.label}</button>`
  ).join('');

  const html = `
    ${_mdlBTitleBand(title, 'milestone', sub)}
    <div class="mdl-b-atmosphere" style="max-width:640px;white-space:pre-line">${evt.narration || ''}</div>
    <div class="mdl-b-decision" id="mdlBMilestoneChoices">${choicesHtml}</div>
  `;

  if (!_mdlBOpen(html, 'gold')) { if (onChoice) onChoice(-1); return; }
  Audio.play('event');

  setTimeout(() => {
    document.querySelectorAll('#mdlBMilestoneChoices .mdl-b-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        const choice = evt.choices[idx];
        Audio.play('event');
        // Phase 2: 結果を同じオーバーレイに差し替え
        const resultHtml = `
          ${_mdlBTitleBand(title, 'milestone', sub)}
          <div class="mdl-b-solo-line" style="max-width:720px;white-space:pre-line">${choice.result}</div>
          <div style="text-align:center;margin:6px 0 22px">
            <div style="display:inline-block;padding:10px 30px;border:1px solid var(--gold);color:var(--gold-light);font-family:var(--font-label);font-size:13px;letter-spacing:4px;background:rgba(212,168,67,0.08);border-radius:2px">${choice.effectLabel}</div>
          </div>
          ${_mdlBActions([{ label: '— 閉 じ る —', primary: true, id: 'mdlBMilestoneClose' }])}
        `;
        const overlay = document.getElementById('mdlBOverlay');
        if (overlay) overlay.innerHTML = resultHtml;
        setTimeout(() => {
          const close = document.getElementById('mdlBMilestoneClose');
          if (close) close.addEventListener('click', () => {
            _mdlBClose();
            if (onChoice) onChoice(idx);
            _drainPopupQueue();
          });
        }, 50);
      });
    });
  }, 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: 通知型イベント トースト表示 (event-system-spec-v2.md §3-4)
// 選手顔アイコン＋一言テキスト。数秒で自動消去
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 社長室 Phase 4: 決裁モーダル群 (shachoshitsu-spec-v1.0.md §8)
// - showDecisionTargetModal: 個人書類の対象選手選択
// - showDecisionConfirmModal: 団体書類の実行確認
// - showDecisionResultToast:   決裁完了後の1行トースト
// ─────────────────────────────────────────────────────────────────────────────
function _closeShachoshitsuDecisionModal() {
  const overlay = document.getElementById('shachoshitsuDecisionOverlay');
  if (overlay) overlay.classList.remove('active');
}

// 個人書類用: 対象選手選択モーダル (A-2型)
function showDecisionTargetModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;

  const roster = state.roster || [];
  let candidates;
  if (docId === 'special_treatment') {
    candidates = roster.filter(f => !f.isRental && f.injury && (f.injury.weeksLeft || 0) >= 2);
  } else {
    candidates = roster.filter(f => !f.isRental && !f.injury);
    if (docId === 'bonus') {
      candidates = candidates.filter(f => (f.trust != null ? f.trust : 50) < 60);
    } else if (docId === 'encourage' || docId === 'refresh_leave') {
      candidates = candidates.filter(f => f.slump || f.motivationLoss);
    }
  }
  const cooldown = doc.cooldown != null ? doc.cooldown : 1;
  const currentWeek = state.week || 0;
  candidates = candidates.filter(f => {
    const lastUsed = (f._decisionWeekUsed || {})[docId] || -99;
    return (currentWeek - lastUsed) >= cooldown;
  });

  if (candidates.length === 0) {
    showToast('対象候補の選手がいません');
    return;
  }

  const actualCost = Engine.shachoshitsu.calcCost(doc, state);
  const costText = actualCost === 0 ? '無料' : `${actualCost}万`;

  const candidateCards = candidates.map((f, i) => {
    const lastName = f.name.split(/\s/).pop();
    let hintText = '';
    let hintCls = '';
    if (docId === 'encourage' || docId === 'refresh_leave') {
      hintText = f.slump ? 'スランプ' : 'モチベ喪失';
      hintCls = 'negative';
    } else if (docId === 'special_treatment' && f.injury) {
      hintText = `全治${f.injury.weeksLeft || '?'}週`;
      hintCls = 'negative';
    }
    const faceUrl = (typeof getPortraitUrl === 'function') ? getPortraitUrl(f.id) : '';
    const bg = faceUrl
      ? `background-image:url('${faceUrl}');background-size:cover;background-position:center`
      : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
    const selCls = i === 0 ? ' is-selected' : '';
    return `<div class="mdl-a-decision-card${selCls}" data-id="${f.id}" style="text-align:center">
      <div style="width:72px;height:72px;margin:0 auto 8px;${bg};background-color:#2a2520;border:2px solid var(--cream-gold-dark);border-radius:50%"></div>
      <div class="mdl-a-decision-label" style="margin-bottom:4px">${lastName}</div>
      <div style="font-family:var(--font-label);font-size:9px;color:var(--cream-gold);letter-spacing:1.5px;margin-bottom:6px">AGE ${f.age || '—'} ・ OVR ${Engine.util.ov(f)}</div>
      ${hintText ? `<div class="mdl-a-decision-hint ${hintCls}">${hintText}</div>` : ''}
    </div>`;
  }).join('');

  const stageBody = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.6;margin-bottom:12px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${doc.detailText || ''}</div>
    <div style="display:flex;justify-content:center;gap:18px;align-items:baseline;font-size:13px;color:var(--cream-text-main);margin-bottom:14px">
      <span><span style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-right:6px">COST</span><strong style="color:var(--cream-gold-dark)">${costText}</strong></span>
      <span style="color:rgba(122,101,48,0.3)">|</span>
      <span><span style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-right:6px">DP</span><strong>⚡${doc.decisionCost}</strong></span>
    </div>
    <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:10px">CANDIDATES ・ 候 補 者</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px" id="mdlADecisionGrid">
      ${candidateCards}
    </div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '対象となる選手を選んでください')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">選択後、決裁ボタンを押してください</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlADecisionCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlADecisionConfirm" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  let selectedFighterId = candidates[0].id;
  const card = document.getElementById('mdlACard');
  const grid = card.querySelector('#mdlADecisionGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const el = e.target.closest('.mdl-a-decision-card');
      if (!el) return;
      selectedFighterId = parseInt(el.dataset.id);
      grid.querySelectorAll('.mdl-a-decision-card').forEach(c => c.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  }
  document.getElementById('mdlADecisionCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlADecisionConfirm').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision(docId, selectedFighterId);
    }
  });
}

// 団体書類用: 実行確認モーダル
function showDecisionConfirmModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;

  const headcount = (state.roster || []).filter(f => !f.isRental && !f.injury).length;
  const actualCost = Engine.shachoshitsu.calcCost(doc, state);
  const remainingFunds = (state.funds || 0) - actualCost;

  const costDetailHtml = doc.unitCost
    ? `<strong style="color:var(--cream-gold-dark)">${actualCost}万</strong> <span style="font-size:11px;color:var(--cream-text-dim)">(${doc.unitCost}万×${Math.max(headcount, doc.minHeadcount || 4)}人)</span>`
    : `<strong style="color:var(--cream-gold-dark)">${actualCost}万</strong>`;
  const remainingColor = remainingFunds < 200 ? 'var(--accent-negative)' : 'var(--cream-gold-dark)';

  const summaryHtml = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.7;margin-bottom:14px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${doc.detailText || ''}</div>
    <div style="max-width:460px;margin:0 auto;background:rgba(255,255,255,0.35);border:1px solid rgba(100,85,50,0.15);border-radius:6px;padding:12px 16px;font-size:13px">
      <div style="display:flex;justify-content:space-between;padding:4px 0">
        <span style="color:var(--cream-text-sub)">対象</span>
        <span style="color:var(--cream-text-main);font-weight:600">団体全員 (${headcount}名)</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0">
        <span style="color:var(--cream-text-sub)">コスト</span>
        <span>${costDetailHtml}　<span style="color:var(--cream-text-dim);font-size:11px">⚡${doc.decisionCost}</span></span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0">
        <span style="color:var(--cream-text-sub)">残金(決裁後)</span>
        <span style="color:${remainingColor};font-weight:700">${Math.round(remainingFunds).toLocaleString()}万</span>
      </div>
      <div style="padding:8px 0 2px;border-top:1px dashed rgba(100,85,50,0.2);margin-top:6px">
        <div style="color:var(--cream-text-sub);font-size:11px;margin-bottom:4px">効果</div>
        <div style="color:var(--cream-text-main);line-height:1.6">${doc.effectSummary || ''}</div>
      </div>
    </div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `TEAM DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '団体全体に対して発令します。内容をご確認ください')}
    <div class="mdl-a-subject-stage">${summaryHtml}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">この内容で決裁しますか？</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlAConfirmCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlAConfirmExec" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  document.getElementById('mdlAConfirmCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlAConfirmExec').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision(docId, null);
    }
  });
}

// 決裁実行の結果トースト(Phase 4: シンプルな1行)
function showDecisionResultToast(displayData) {
  if (!displayData) return;
  const name = displayData.fighter?.name || '団体全員';
  const icon = displayData.icon || '';
  const label = displayData.label || '決裁';
  let msg = `${icon} ${label} → ${name}`;
  const firstChange = (displayData.changes || [])[0];
  if (firstChange) {
    if (firstChange.text !== undefined) {
      msg += `: ${firstChange.label} ${firstChange.text}`;
    } else if (firstChange.before !== undefined && firstChange.after !== undefined) {
      msg += `: ${firstChange.label} ${_fmtStat(firstChange.before)}→${_fmtStat(firstChange.after)}`;
    }
  }
  showToast(msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// 社長室 Phase 5: 決裁結果モーダル(個人書類 / 団体書類 両対応)
// 既存の shachoshitsu-decision-overlay/Modal DOM を再利用。
// 全パターン共通で「話者の顔(大)+名前+セリフ」をヒーロー表示し、
// 誰が反応しているのかを一目で分かるようにする(CLAUDE.md「キャラの人生を覗き見る」)。
//
// 表示内容:
//   - 個人書類(bonus/trainer/media/encourage/refresh_leave):
//       ヒーロー(120px) + セリフ + 変化サマリ + コスト
//   - 団体書類(party/camp):
//       ヒーロー(代表選手120px) + セリフ + 参加者グリッド(小)
//       + camp はさらに CAMP_FLAVOR_TEXTS フレーバー + 変化サマリ + コスト
// ─────────────────────────────────────────────────────────────────────────────
function showDecisionResultModal(displayData) {
  if (!displayData) return;

  const {
    fighter, isTeam, fighters = [], repFighter, text, campFlavor,
    changes = [], cost, remainingFunds, icon, label, docId,
    reactionTone,
  } = displayData;
  const isCamp = docId === 'camp';

  // ヒーロー(話者): 個人書類なら対象選手、団体書類なら代表選手
  const hero = fighter || repFighter;

  // トーンマーカー(個人書類のみ)
  let toneBadge = '';
  if (reactionTone === 'high') {
    toneBadge = `<div class="mdl-a-result-badge success">🌟 深く刺さった</div>`;
  } else if (reactionTone === 'low') {
    toneBadge = `<div class="mdl-a-result-badge failure">💤 あまり響かなかった</div>`;
  }

  // 参加者グリッド(team書類のみ)
  let rosterHtml = '';
  if (isTeam && fighters.length > 0) {
    const others = fighters.filter(f => !hero || f.id !== hero.id);
    if (others.length > 0) {
      rosterHtml += `<div style="margin:14px auto 4px;max-width:520px">`;
      rosterHtml += `<div style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:8px">参加者 ${fighters.length}名</div>`;
      rosterHtml += `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">`;
      others.forEach(f => {
        const lastName = (f.name || '').split(/\s/).pop();
        const faceUrl = (typeof getPortraitUrl === 'function') ? getPortraitUrl(f.id) : '';
        const bg = faceUrl ? `background-image:url('${faceUrl}');background-size:cover;background-position:center` : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
        rosterHtml += `<div style="text-align:center">
          <div style="width:44px;height:44px;margin:0 auto 2px;${bg};border:1px solid var(--cream-gold-dark);border-radius:50%"></div>
          <div style="font-size:10px;color:var(--cream-text-sub)">${lastName}</div>
        </div>`;
      });
      rosterHtml += `</div></div>`;
    }
  }

  // camp フレーバー
  const flavorHtml = campFlavor
    ? `<div style="font-family:'Shippori Mincho',serif;font-size:13px;color:var(--cream-text-sub);font-style:italic;text-align:center;line-height:1.7;margin:14px auto 0;max-width:480px">${campFlavor}</div>`
    : '';

  // 変化サマリ
  let changesHtml = '';
  if (changes.length > 0) {
    changesHtml += `<div style="background:rgba(255,255,255,0.35);border:1px solid rgba(100,85,50,0.15);border-radius:6px;padding:10px 14px;margin:14px auto 0;max-width:460px;font-size:12px">`;
    changes.forEach(c => {
      if (c.text !== undefined) {
        changesHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;color:var(--cream-text-main)">
          <span style="color:var(--cream-text-sub)">${c.emoji || ''} ${c.label}</span>
          <span style="color:var(--accent-positive);font-weight:700">${c.text}</span>
        </div>`;
      } else if (c.before !== undefined && c.after !== undefined) {
        const bef = _fmtStat(c.before), aft = _fmtStat(c.after);
        const diff = _fmtStat(aft - bef);
        const color = diff >= 0 ? 'var(--accent-positive)' : 'var(--accent-negative)';
        const sign = diff >= 0 ? '+' : '';
        changesHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;color:var(--cream-text-main)">
          <span style="color:var(--cream-text-sub)">${c.emoji || ''} ${c.label}</span>
          <span style="color:${color};font-weight:700">${bef} → ${aft} (${sign}${diff})</span>
        </div>`;
      }
    });
    changesHtml += `</div>`;
  }

  // コスト表示
  let costHtml = '';
  if (cost > 0) {
    costHtml = `<div style="text-align:center;font-size:12px;color:var(--cream-text-sub);margin-top:12px">
      費用 <strong style="color:#a83828">-${cost}万</strong>
      ｜ 残金 <strong style="color:var(--cream-gold-dark)">${Math.round(remainingFunds).toLocaleString()}万</strong>
    </div>`;
  }

  // subject-stage: hero がいれば上半身(+頭上吹き出し)、いなければ説明のみ
  const stageBody = `
    ${toneBadge}
    ${rosterHtml}
    ${flavorHtml}
    ${changesHtml}
    ${costHtml}
  `;

  const subjectHtml = hero
    ? _mdlASubjectStage(hero, stageBody, { small: true, speech: text })
    : `<div class="mdl-a-subject-stage">${stageBody}</div>`;

  const html = `
    ${_mdlAHeader(`${icon || '📝'} ${label} — 決裁完了`, `RESULT ・ ${_mdlASeasonLabel(typeof G !== 'undefined' ? G : {})}`)}
    ${_mdlAReporterStrip(typeof G !== 'undefined' ? G : {}, '決裁の結果をお伝えします')}
    ${subjectHtml}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="mdlADecisionResultClose">— 見 届 け る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) { showDecisionResultToast(displayData); return; }

  const btn = document.getElementById('mdlADecisionResultClose');
  if (btn) btn.addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: 通知型イベント トースト表示 (event-system-spec-v2.md §3-4)
// 選手顔アイコン＋一言テキスト。数秒で自動消去
// ─────────────────────────────────────────────────────────────────────────────
// v2.0: 選択型イベント モーダル (event-system-spec-v2.md §3-4)
// 選手顔アイコン＋セリフ＋2〜3択のモーダルダイアログ
// ─────────────────────────────────────────────────────────────────────────────
function showChoiceEventModal(event, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showChoiceEventModal(event, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const fighter = event.fighter != null ? roster.find(f => f.id === event.fighter) : null;

  const typeLabels = {
    S1: '📋 タイトル挑戦要求', S2: '⚔ 対戦要求', S3: '🛌 休養願い',
    S4: '💢 不満・退団示唆',  S5: '⚡ 特訓志願', S6: '🎓 後輩指導申し出',
    E1: '📺 メディア出演オファー', E2: '💼 スポンサー提案',
    E3: '🤝 合同練習の誘い',  E4: '🔍 スカウト情報',
    E5: '💴 営業試合依頼',   E6: '🚨 他団体からの引き抜き',
    S_boycott: '🚫 練習ボイコット', S_grumble: '😤 ロッカールームの愚痴',
    S_sns: '📱 SNS匂わせ',
  };
  const title = typeLabels[event.type] || event.type;
  const isUrgent = event.type === 'S4' || event.type === 'E6' || event.type === 'S_grumble' || event.type === 'S_sns';

  // Reporter取次セリフ
  const reporterLine = isUrgent
    ? '社長、判断をお願いします'
    : '社長、ひとつ判断をお願いしたい件があります';

  // subject-stage 内容: 選手がいればセリフ、なければ E5 の説明文
  let stageBody = '';
  if (fighter) {
    const dialogue = event.dialogue || '';
    stageBody = `<div class="mdl-a-observation centered" style="padding-top:6px">
      <span class="marker">${fighter.name || ''}</span><br>
      <span style="font-style:italic;color:var(--cream-text-main);line-height:1.8;display:inline-block;margin-top:8px">「${dialogue}」</span>
    </div>`;
  } else if (event.type === 'E5') {
    stageBody = `<div class="mdl-a-observation centered">
      📣 近隣エリアの地域イベント実行委員会から営業試合の依頼が届きました。
    </div>`;
  }

  const subjectHtml = fighter
    ? _mdlASubjectStage(fighter, stageBody, { small: true })
    : `<div class="mdl-a-subject-stage">${stageBody}</div>`;

  const choices = event.choices || [{ label: '了解', hint: '', idx: 0 }];
  const trayCls = choices.length === 2 ? 'mdl-a-decision-tray two' : 'mdl-a-decision-tray';
  const trayCards = choices.map(c => {
    const letter = c.letter || (c.idx != null ? String.fromCharCode(65 + c.idx) : '?');
    const hintTone = c.tone === 'positive' ? 'positive' : c.tone === 'negative' ? 'negative' : '';
    const disabledAttr = c.disabled ? 'data-disabled="1" style="opacity:0.4;cursor:default"' : '';
    return `<div class="mdl-a-decision-card" data-choice="${c.idx}" ${disabledAttr}>
      <div class="mdl-a-decision-letter">${letter}</div>
      <div class="mdl-a-decision-label">${c.label || ''}</div>
      ${c.hint ? `<div class="mdl-a-decision-hint ${hintTone}">${c.hint}</div>` : ''}
    </div>`;
  }).join('');

  const html = `
    ${_mdlAHeader(title, _mdlASeasonLabel(state), { urgent: isUrgent })}
    ${_mdlAReporterStrip(state, reporterLine)}
    ${subjectHtml}
    <div class="mdl-a-prompt">どう対応しますか？</div>
    <div class="${trayCls}">${trayCards}</div>
  `;

  if (!_mdlAOpen(html, { narrow: choices.length <= 2 })) {
    if (onChoice) onChoice(-1);
    return;
  }

  const card = document.getElementById('mdlACard');
  card.querySelectorAll('.mdl-a-decision-card').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.disabled === '1') return;
      const idx = parseInt(el.dataset.choice);
      Audio.play('click');
      if (onChoice) onChoice(idx);
      // 結果モーダル (showChoiceEventResult) がオーバーレイを再利用していれば閉じない
      if (!card.querySelector('[data-mdl-choice-result]')) {
        _mdlAClose();
      }
    });
  });
}

/** 選択型イベント結果ポップアップ(mdlAOverlayに上書き、選択肢モーダルと連続表示) */
function showChoiceEventResult(event, resultTexts, state) {
  const roster = state ? (state.roster || []) : [];
  const fighter = event.fighter != null ? roster.find(f => f.id === event.fighter) : null;
  const typeLabels = {
    S1: '📋 タイトル挑戦要求', S2: '⚔ 対戦要求', S3: '🛌 休養願い',
    S4: '💢 不満・退団示唆',  S5: '⚡ 特訓志願', S6: '🎓 後輩指導申し出',
    E1: '📺 メディア出演オファー', E2: '💼 スポンサー提案',
    E3: '🤝 合同練習の誘い',  E4: '🔍 スカウト情報',
    E5: '💴 営業試合依頼',   E6: '🚨 他団体からの引き抜き',
    S_boycott: '🚫 練習ボイコット', S_grumble: '😤 ロッカールームの愚痴',
    S_sns: '📱 SNS匂わせ',
  };
  const title = typeLabels[event.type] || event.type;

  const resultsBlock = (resultTexts && resultTexts.length > 0)
    ? `<div class="mdl-a-observation centered" style="padding-top:6px" data-mdl-choice-result="1">
        ${resultTexts.map(t => `<div style="padding:8px 12px;background:rgba(255,255,255,0.4);border:1px solid rgba(100,85,50,0.15);border-radius:6px;margin-bottom:6px;line-height:1.6">${t}</div>`).join('')}
      </div>`
    : `<div class="mdl-a-observation centered" data-mdl-choice-result="1">決定が適用されました。</div>`;

  const stageBody = fighter
    ? resultsBlock
    : `<div data-mdl-choice-result="1">${resultsBlock}</div>`;
  const subjectHtml = fighter
    ? _mdlASubjectStage(fighter, stageBody, { small: true })
    : `<div class="mdl-a-subject-stage">${stageBody}</div>`;

  const html = `
    ${_mdlAHeader('📝 ' + title + ' — 結果', _mdlASeasonLabel(state))}
    ${_mdlAReporterStrip(state, 'ご判断の結果をお伝えします')}
    ${subjectHtml}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="mdlAChoiceResultClose">— 見 届 け る —</button>
    </div>
  `;

  if (!_mdlAOpen(html, { narrow: true })) return;

  const btn = document.getElementById('mdlAChoiceResultClose');
  if (btn) {
    btn.addEventListener('click', () => {
      Audio.play('click');
      _mdlAClose();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3a: 派閥イベントモーダル（F01/F02/F03）
// careOverlay/careBox を再利用。シーン切替は HTML 差し替えで実現
// spec: faction-system-spec-v0.1 §9.1〜§9.3
// ─────────────────────────────────────────────────────────────────────────────
function _factionModalOverlay() {
  return {
    overlay: document.getElementById('careOverlay'),
    box: document.getElementById('careBox'),
  };
}

function _factionModalBox(html) {
  const { overlay, box } = _factionModalOverlay();
  if (!overlay || !box) return null;
  box.innerHTML = `<div class="faction-event-modal">${html}</div>`;
  overlay.classList.add('active');
  return box;
}

function _factionCloseModal() {
  const { overlay } = _factionModalOverlay();
  if (overlay) overlay.classList.remove('active');
}

function _factionPortrait(fighter, size) {
  if (!fighter) return '';
  if (typeof portraitImg === 'function') {
    return portraitImg(fighter.id, size || 72, 'faction-portrait');
  }
  return `<div class="faction-portrait-placeholder" style="width:${size||72}px;height:${size||72}px;background:rgba(200,190,170,0.1);border-radius:50%"></div>`;
}

function _factionLine(table, fighter, seed) {
  if (typeof Engine !== 'undefined' && Engine.factions && typeof Engine.factions.getFactionLine === 'function') {
    const rng = Engine.rng.create(seed || 0xFA99);
    return Engine.factions.getFactionLine(table, fighter || {}, rng);
  }
  return '';
}

// F01: 忠誠型派閥結成（Office 応接室型 / ロッカールーム報告）
// 03-screens §1 特有ルール: Reporter は hired コーチから発火週ベースで擬似ランダム選出、
// コーチ不在時は古参選手（最年長）へフォールバック
function _factionPickReporter(state) {
  const coachIds = (state && state.coaches) || [];
  const ALL = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES : [];
  const coaches = coachIds.map(id => ALL.find(co => co.id === id)).filter(Boolean);
  const seed = Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA1F);
  if (coaches.length) {
    return { kind: 'coach', ref: coaches[(seed >>> 0) % coaches.length] };
  }
  const roster = (state && state.roster) || [];
  if (roster.length) {
    const veteran = [...roster].sort((a, b) => (b.age || 0) - (a.age || 0))[0];
    if (veteran) return { kind: 'veteran', ref: veteran };
  }
  return null;
}
function _factionReporterStrip(state, line) {
  const pick = _factionPickReporter(state);
  let url = '', name = '';
  if (pick && pick.kind === 'coach') {
    url = (typeof getCoachPortraitUrl === 'function') ? getCoachPortraitUrl(pick.ref.id) : '';
    name = `${String(pick.ref.name)} コーチ`;
  } else if (pick && pick.kind === 'veteran') {
    url = _factionUpperUrl(pick.ref.id);
    name = String(pick.ref.name);
  }
  const bg = url
    ? `background-image:url('${url}'),linear-gradient(135deg,#5a4a3a,#3a2d22)`
    : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
  return `
    <div class="fevt-reporter-strip">
      <div class="fevt-reporter-portrait" style="${bg}"></div>
      <div class="fevt-reporter-text">
        <div class="fevt-reporter-name">${name}</div>
        <div class="fevt-reporter-line">${String(line)}</div>
      </div>
    </div>`;
}
// モック L1414「宇田川 里奈」→ L1419 marker「宇田川」: 姓のみ抽出（全角/半角スペース区切り）
function _factionSurname(fighter) {
  if (!fighter || !fighter.name) return '';
  const parts = String(fighter.name).split(/[\s　]+/);
  return parts[0] || String(fighter.name);
}
function _factionSeasonLabel(state) {
  const season = (state && state.season) || 1;
  const week = (state && state.week) || 1;
  const pad = (n) => String(n).padStart(2, '0');
  return `WEEK ${pad(week)} ・ ${season}Y`;
}
function showFactionF01Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF01Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const leader = roster.find(c => c.id === payload.leaderId);
  // 03-screens §1: フォロワー肖像は OVR 降順 最大3人（モック Trio は左1・中央リーダー・右1 の2人）
  const followersAll = (payload.followerIds || [])
    .map(id => roster.find(c => c.id === id)).filter(Boolean)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const fol1 = followersAll[0] || null;
  const fol2 = followersAll[1] || null;

  const leaderName = leader ? leader.name : '???';
  const leaderSurname = _factionSurname(leader);
  const leaderUrl = leader ? _factionUpperUrl(leader.id) : '';
  const leaderMeta = leader
    ? `AGE ${leader.age || '—'} ・ OVR ${Engine.util.ov(leader)} ・ ${String(leader.style || '').toUpperCase() || 'FIGHTER'}`
    : '';

  // モック L1419: 「近藤・三浦の2人が自然と集まりを作っているようです」
  const followerSurnames = [fol1, fol2].filter(Boolean).map(f => _factionSurname(f));
  let followerText;
  if (followerSurnames.length >= 2) {
    followerText = `${followerSurnames.join('・')}の${followerSurnames.length}人が自然と集まりを作っているようです。`;
  } else if (followerSurnames.length === 1) {
    followerText = `${followerSurnames[0]}が自然と寄り添っているようです。`;
  } else {
    followerText = '周囲の数名が自然と集まっているようです。';
  }

  const leftFol = fol1 ? `<div class="fevt-follower-portrait" style="background-image:url('${_factionUpperUrl(fol1.id)}')"></div>` : `<div class="fevt-follower-portrait"></div>`;
  const rightFol = fol2 ? `<div class="fevt-follower-portrait right" style="background-image:url('${_factionUpperUrl(fol2.id)}')"></div>` : `<div class="fevt-follower-portrait right"></div>`;
  const centerLeader = leaderUrl
    ? `<div class="fevt-subject-portrait-wrap" style="background-image:url('${leaderUrl}')"></div>`
    : `<div class="fevt-subject-portrait-wrap"></div>`;

  const html = `
    <div class="fevt-overlay-office" id="fevtF01Overlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🎭 ロッカールーム報告</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, '社長、ちょっと気になる動きがあるのですが')}
        <div class="fevt-subject-stage">
          <div class="fevt-subject-trio">
            ${leftFol}
            ${centerLeader}
            ${rightFol}
          </div>
          <div class="fevt-subject-name">${String(leaderName)}</div>
          <div class="fevt-subject-org">${leaderMeta}</div>
          <div class="fevt-subject-divider"></div>
          <div class="fevt-observation-note">
            <span class="marker">${String(leaderSurname)}</span>を中心として、${String(followerText)}<br>
            練習後の残り方、ロッカーの席順、移動時の並び——細かい兆候はいくつもあります。<br>
            <span style="color:var(--cream-text-sub);font-size:13px">派閥のようなものが形成された、と言ってよいかもしれません。</span>
          </div>
        </div>
        <div class="fevt-decision-prompt">この動きについて、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">正式なチームとして認める</div>
            <div class="fevt-decision-hint">求心力と引き換えに、ロッカールーム全体の空気が悪化する</div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">今はそれどころじゃないと釘を刺す</div>
            <div class="fevt-decision-hint">派閥不成立。本人と周囲に角が立つ</div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">静観する</div>
            <div class="fevt-decision-hint">派閥成立（自然発生）。介入なし</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  root.querySelectorAll('.fevt-decision-card').forEach(card => {
    card.addEventListener('click', function() {
      const choice = this.dataset.choice;
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onChoice) onChoice(choice);
    });
  });
}

// F02: 派閥抗争勃発（Stage 対峙型、act1 ナレ → act2 対峙 の2段）
// 03-screens §2 / §6 F02② 準拠。モック準拠: act1 `#overlayF02A`（L1493-1509）、act2 `#overlayF02`（L1514-1580）
// ルール:
//   - 左右どちらが Leader A か Leader B かは常に画面左 = factionA（payload 順）
//   - attack/defend ではなく左右の立場対称扱い（§6）
//   - act1 ナレは 1文ずつ置き換え式（§6）
//   - セリフは personality × archetype で差別化 → Engine.factions.getF02ClashLine(fighter, 'attack'|'defend')
function _factionF02RenderClash(payload, state, onChoice) {
  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';
  const aName = leaderA ? leaderA.name : '???';
  const bName = leaderB ? leaderB.name : '???';
  const aUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const bUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';
  const aLine = Engine.factions.getF02ClashLine(leaderA, 'attack') || '';
  const bLine = Engine.factions.getF02ClashLine(leaderB, 'defend') || '';

  const html = `
    <div class="fevt-overlay-stage" id="fevtF02Overlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main clash">⚔ 抗 争 の 勃 発</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">FACTION CLASH ・ WEEK ${(state && state.week) || '—'}</div>
      </div>

      <div class="fevt-dual-stage">
        <div class="fevt-leader-col">
          <div class="fevt-faction-flag a">${String(factionAName)}</div>
          ${aUrl ? `<img class="fevt-leader-upper" src="${aUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(aName)}</div>
          <div class="fevt-leader-org">FACTION LEADER</div>
        </div>
        <div class="fevt-vs-col">
          <div class="fevt-silent-mark">
            — 沈 黙 —
            <span>NO WORDS EXCHANGED</span>
          </div>
        </div>
        <div class="fevt-leader-col right">
          <div class="fevt-faction-flag b">${String(factionBName)}</div>
          ${bUrl ? `<img class="fevt-leader-upper" src="${bUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(bName)}</div>
          <div class="fevt-leader-org">FACTION LEADER</div>
        </div>
      </div>

      <div class="fevt-clash-atmosphere">
        ロッカールームには、冷たい対立の空気が満ちているようです。
      </div>

      <div class="fevt-dialogue-row">
        <div class="fevt-dialogue-bubble a">
          <div class="fevt-dialogue-speaker">${String(aName)}</div>
          <div class="fevt-dialogue-text">${String(aLine || '……')}</div>
        </div>
        <div class="fevt-dialogue-bubble b">
          <div class="fevt-dialogue-speaker">${String(bName)}</div>
          <div class="fevt-dialogue-text">${String(bLine || '……')}</div>
        </div>
      </div>

      <div class="fevt-stage-decision">
        <button class="fevt-stage-btn" data-choice="A">A ・ 煽 る<span class="fevt-stage-btn-label">抗争を公式戦に仕立てる</span></button>
        <button class="fevt-stage-btn" data-choice="B">B ・ 仲 裁<span class="fevt-stage-btn-label">仲介して収める</span></button>
        <button class="fevt-stage-btn" data-choice="C">C ・ 介入しない<span class="fevt-stage-btn-label">成り行きに任せる</span></button>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-stage');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  root.querySelectorAll('.fevt-stage-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const choice = this.dataset.choice;
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onChoice) onChoice(choice);
    });
  });
}

function showFactionF02Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF02Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';
  const aUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const bUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';

  // act1: 前段ナレーション（1文ずつ置き換え式）
  const narLines = [
    'ここ数週、ロッカールームの空気が変わっていた。',
    `<em>「${String(factionAName)}」</em>と<em>「${String(factionBName)}」</em>——並び立っていた二つの派閥の間に、`,
    '目に見えない線が引かれている。視線は交わらず、言葉も交わさない。',
    'もう、元には戻らない。',
  ];
  const narHtml = `
    <div class="fevt-narration-act" id="fevtF02NarOverlay">
      <div class="fevt-nar-stage">
        <div class="fevt-nar-silhouettes">
          <div class="fevt-nar-sil left"${aUrl ? ` style="background-image:url('${aUrl}')"` : ''}></div>
          <div class="fevt-nar-lightning"></div>
          <div class="fevt-nar-sil right"${bUrl ? ` style="background-image:url('${bUrl}')"` : ''}></div>
        </div>
      </div>
      <div class="fevt-nar-text" id="fevtF02NarText">
        ${narLines.map((t, i) => `<span class="fevt-nar-line" data-idx="${i}">${t}</span>`).join('')}
        <span class="fevt-nar-hint" id="fevtF02NarHint">▼ CLICK TO CONTINUE</span>
      </div>
      <button class="fevt-nar-proceed" id="fevtF02NarProceed">— 目撃する —</button>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = narHtml;
  const overlay = root.querySelector('.fevt-narration-act');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  // 1文ずつ .shown 付与（置き換え式: 前文を .shown 外して次文を .shown）
  const lineEls = Array.from(root.querySelectorAll('.fevt-nar-line'));
  let idx = 0;
  const showLine = () => {
    lineEls.forEach(el => el.classList.remove('shown'));
    if (lineEls[idx]) lineEls[idx].classList.add('shown');
  };
  showLine();
  const timer = setInterval(() => {
    idx++;
    if (idx >= lineEls.length) { clearInterval(timer); return; }
    showLine();
  }, 2200);

  const proceed = () => {
    clearInterval(timer);
    // act1 閉じる → act2 clash
    const narOv = root.querySelector('.fevt-narration-act');
    if (narOv) narOv.classList.remove('active');
    setTimeout(() => _factionF02RenderClash(payload, state, onChoice), 500);
  };
  const proceedBtn = root.querySelector('#fevtF02NarProceed');
  if (proceedBtn) proceedBtn.addEventListener('click', proceed);
  // 画面クリックでも進む（モック同様 CLICK TO CONTINUE）
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target.closest('#fevtF02NarProceed')) return;
    proceed();
  });
}

// F03: リーダー喪失モーダル（軽量1シーン＋結果）
// F03: 派閥解散（Stage セピア型、通知のみ）
// reason: 'retirement' → A（引退）/ 'departure'|'poach' → B（引き抜き）
//         'isolated'   → C（離散：残存者がリーダー自身）
//         'collapse'   → D（瓦解：F02③敗者連鎖）
//         'longInjury' → 旧経路。F05 へルーティングすべきだが後方互換で残存
function _factionUpperUrl(fighterId) {
  if (typeof getUpperUrl === 'function') return getUpperUrl(fighterId);
  return `image/upper/${fighterId}.webp`;
}
function _factionEnsureOverlayRoot() {
  let root = document.getElementById('factionEventRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'factionEventRoot';
    document.body.appendChild(root);
  }
  return root;
}
function _factionCloseCinematicOverlay() {
  const root = document.getElementById('factionEventRoot');
  if (!root) return;
  const overlay = root.querySelector('.fevt-overlay-stage, .fevt-overlay-office, .fevt-narration-act');
  if (overlay) overlay.classList.remove('active');
  setTimeout(() => { root.innerHTML = ''; }, 600);
}

function showFactionF03Modal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF03Modal(payload, state, onContinue)); return; }

  const roster = state ? (state.roster || []) : [];
  const survivor = payload.successorId ? roster.find(c => c.id === payload.successorId) : null;
  const oldLeader = payload.oldLeaderId ? roster.find(c => c.id === payload.oldLeaderId) : null;

  const reason = payload.reason || 'retirement';
  const reasonMap = {
    retirement: { sub: 'FACTION DISSOLVED ・ LEADER RETIRED', caption: 'LEADER RETIRED', lostReason: 'RETIREMENT', line: 'もう、あの旗の下には戻れない' },
    departure:  { sub: 'FACTION DISSOLVED ・ LEADER DEPARTED', caption: 'LEADER DEPARTED', lostReason: 'DEPARTURE', line: 'あの人と同じ旗は、もう掲げられない' },
    poach:      { sub: 'FACTION DISSOLVED ・ LEADER DEPARTED', caption: 'LEADER DEPARTED', lostReason: 'DEPARTURE', line: 'あの人と同じ旗は、もう掲げられない' },
    isolated:   { sub: 'FACTION DISSOLVED ・ MEMBERS SCATTERED', caption: 'MEMBERS SCATTERED', lostReason: 'ISOLATED', line: '一人では、派閥とは呼べない' },
    collapse:   { sub: 'FACTION DISSOLVED ・ COLLAPSED AFTER DEFEAT', caption: 'COLLAPSED AFTER DEFEAT', lostReason: 'COLLAPSE', line: '負けた旗の下には、もう立てない' },
    longInjury: { sub: 'FACTION DISSOLVED ・ LEADER ABSENT', caption: 'LEADER ABSENT', lostReason: 'ABSENCE', line: 'もう、あの旗の下には戻れない' },
  };
  const meta = reasonMap[reason] || reasonMap.retirement;

  // 生存者セリフはペイロード優先、なければ reason デフォルト
  const survivorLine = payload.survivorLine || meta.line;
  const factionName = payload.factionName || '派閥';
  const oldLeaderName = payload.oldLeaderName || (oldLeader ? oldLeader.name : '???');
  const lostImgUrl = oldLeader ? _factionUpperUrl(oldLeader.id) : null;
  const survivorImgUrl = survivor ? _factionUpperUrl(survivor.id) : null;

  const lostUpper = lostImgUrl
    ? `<img class="fevt-lost-upper" src="${lostImgUrl}" alt="">`
    : `<div class="fevt-lost-upper" style="display:inline-block"></div>`;

  const survivorBlock = survivor ? `
    <div class="fevt-survivor">
      <div class="fevt-survivor-portrait"${survivorImgUrl ? ` style="background-image:url('${survivorImgUrl}')"` : ''}></div>
      <div class="fevt-survivor-text">
        <div class="fevt-survivor-name">${String(survivor.name)}</div>
        <div class="fevt-survivor-line">${String(survivorLine)}</div>
      </div>
    </div>` : '';

  const html = `
    <div class="fevt-overlay-stage sepia" id="fevtF03Overlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main dissolve">解 　 散</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">${meta.sub}</div>
      </div>
      <div class="fevt-faded-banner">
        <div class="fevt-faded-flag">${String(factionName)}</div>
        <div class="fevt-faded-caption">FLAG LOWERED ・ WEEK ${(state && state.week) || '—'}</div>
      </div>
      <div class="fevt-lost-leader">
        ${lostUpper}
        <div class="fevt-lost-name">${String(oldLeaderName)}</div>
        <div class="fevt-lost-reason">${meta.lostReason}</div>
      </div>
      ${survivorBlock}
      <button class="fevt-continue-btn" id="fevtF03Continue">CONTINUE</button>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-stage');
  // 強制リフロー後に .active を付与してトランジション発火
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  const finish = () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  };
  const btn = root.querySelector('#fevtF03Continue');
  if (btn) btn.addEventListener('click', finish);
}

// F05（活動休止）: F03 派生。リーダー長期離脱（8週+）で旗を畳む
function showFactionHiatusModal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionHiatusModal(payload, state, onContinue)); return; }

  const roster = state ? (state.roster || []) : [];
  const survivor = payload.successorId ? roster.find(c => c.id === payload.successorId) : null;
  const leader = payload.leaderId ? roster.find(c => c.id === payload.leaderId) : null;

  const weeks = payload.estimatedWeeks || 8;
  const factionName = payload.factionName || '派閥';
  const leaderName = payload.leaderName || (leader ? leader.name : '???');
  const lostImgUrl = leader ? _factionUpperUrl(leader.id) : null;
  const survivorImgUrl = survivor ? _factionUpperUrl(survivor.id) : null;
  const survivorLine = payload.survivorLine || '帰ってきたら、また集まろう';

  const lostUpper = lostImgUrl
    ? `<img class="fevt-lost-upper" src="${lostImgUrl}" alt="">`
    : `<div class="fevt-lost-upper" style="display:inline-block"></div>`;

  const survivorBlock = survivor ? `
    <div class="fevt-survivor">
      <div class="fevt-survivor-portrait"${survivorImgUrl ? ` style="background-image:url('${survivorImgUrl}')"` : ''}></div>
      <div class="fevt-survivor-text">
        <div class="fevt-survivor-name">${String(survivor.name)}</div>
        <div class="fevt-survivor-line">${String(survivorLine)}</div>
      </div>
    </div>` : '';

  const html = `
    <div class="fevt-overlay-stage sepia" id="fevtHiatusOverlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main dissolve">活 動 休 止</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">FACTION ON HIATUS ・ LEADER ABSENT</div>
      </div>
      <div class="fevt-faded-banner">
        <div class="fevt-faded-flag">${String(factionName)}</div>
        <div class="fevt-faded-caption">旗は畳まれ、主の帰りを待っている</div>
      </div>
      <div class="fevt-lost-leader">
        ${lostUpper}
        <div class="fevt-lost-name">${String(leaderName)}</div>
        <div class="fevt-lost-reason">ABSENCE ・ 長 期 離 脱（推 定 ${weeks} 週 +）</div>
      </div>
      ${survivorBlock}
      <button class="fevt-continue-btn" id="fevtHiatusContinue">続 け る</button>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-stage');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  const finish = () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  };
  const btn = root.querySelector('#fevtHiatusContinue');
  if (btn) btn.addEventListener('click', finish);
}

// F01/F02/F03 共通: 結果画面（選択結果を適用後のナレーション表示）
function showFactionEventResult(resultText, onClose) {
  const body = `
    <div class="faction-event-title">🎭 結果</div>
    <div class="faction-event-narration">${resultText || '……。'}</div>
    <button class="btn faction-event-next">閉じる ✓</button>
  `;
  _factionModalBox(body);
  const box = document.getElementById('careBox');
  if (box) {
    const btn = box.querySelector('.faction-event-next');
    if (btn) btn.addEventListener('click', () => {
      _factionCloseModal();
      if (onClose) onClose();
    });
  }
}

// ── Phase 3b: F04-F08 モーダル ──────────────────────────────

// F04: 寝返り（4シーン＋結果）
// F04: 寝返り（Office 応接室型 / 通知のみ・既成事実報告）
// 03-screens §1 F04 Variation:
//   - Reporter はコーチのみ（メンバーの告げ口は不自然）
//   - 選択肢なし、「見届ける」ボタン単独
//   - 移籍は既成事実、心情ではなく動きの事実として報告
//   - モック準拠: L1450-1488
function showFactionF04Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF04Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const target = roster.find(c => c.id === payload.targetId);
  const targetName = payload.targetName || (target ? target.name : '???');
  const targetSurname = target ? _factionSurname(target) : targetName;
  const targetUrl = target ? _factionUpperUrl(target.id) : '';
  const targetMeta = target
    ? `AGE ${target.age || '—'} ・ OVR ${Engine.util.ov(target)} ・ ${String(target.style || '').toUpperCase() || 'FIGHTER'}`
    : '';
  const fromFactionName = payload.fromFactionName || '派閥A';
  const toFactionName = payload.toFactionName || '派閥B';

  const subjectPortrait = targetUrl
    ? `<div class="fevt-subject-portrait-wrap" style="background-image:url('${targetUrl}')"></div>`
    : `<div class="fevt-subject-portrait-wrap"></div>`;

  const html = `
    <div class="fevt-overlay-office" id="fevtF04Overlay">
      <div class="fevt-report-card f04">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🕯 ロッカールーム報告（移籍）</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, '社長。ひとつ、事実としてお伝えしておくべきことが')}
        <div class="fevt-subject-stage">
          ${subjectPortrait}
          <div class="fevt-subject-name">${String(targetName)}</div>
          <div class="fevt-subject-org">${targetMeta}</div>

          <div class="fevt-f04-flags">
            <div class="fevt-f04-flag from">FROM ・ ${String(fromFactionName)}</div>
            <div class="fevt-f04-arrow">▶▶▶</div>
            <div class="fevt-f04-flag to">TO ・ ${String(toFactionName)}</div>
          </div>

          <div class="fevt-subject-divider" style="margin-top:14px"></div>
          <div class="fevt-observation-note" style="text-align:center">
            <span class="marker">${String(targetSurname)}</span>は<span class="marker">${String(toFactionName)}</span>と既に話をつけているようです。<br>
            練習後の合流、食事、移動——動きはもう表に出始めています。<br>
            <span style="color:var(--cream-text-sub);font-size:13px">報告として、お耳に入れておきます。</span>
          </div>
        </div>
        <div class="fevt-decision-prompt" style="padding-bottom:24px">
          <button class="fevt-continue-btn" id="fevtF04Continue" style="color:var(--cream-text-sub);border-color:rgba(100,85,50,0.3);background:rgba(255,255,255,0.3)">見 届 け る</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  const btn = root.querySelector('#fevtF04Continue');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      // 03-screens §1: 移籍は既成事実 → applyF04Choice('A') 分岐（転籍）を常に適用
      if (onChoice) onChoice('A');
    });
  }
}

// F05: 派閥内に火種（Office 応接室型 / 通知のみ・選択肢なし）
// 03-screens §4 / モック faction-events-f05-f08-rework.html §F05:
//   社長は派閥の内紛に介入する立場ではないため「見守る」1ボタンのみ。
//   裏で bond/hostility は進行し、決裂すれば F03 へ自然流入する。
function showFactionF05Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF05Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const ringleader = roster.find(c => c.id === payload.ringleaderId);
  const leader = roster.find(c => c.id === payload.leaderId);
  const ringleaderName = payload.ringleaderName || (ringleader ? ringleader.name : '???');
  const ringleaderSurname = ringleader ? _factionSurname(ringleader) : ringleaderName;
  const leaderSurname = leader ? _factionSurname(leader) : (payload.leaderName || '');
  const ringleaderUrl = ringleader ? _factionUpperUrl(ringleader.id) : '';
  const ringleaderMeta = ringleader
    ? `AGE ${ringleader.age || '—'} ・ OVR ${Engine.util.ov(ringleader)} ・ ${String(ringleader.style || '').toUpperCase() || 'FIGHTER'} ・ ${String(payload.factionName || '')}`
    : '';
  const line = _factionLine(FACTION_F05_DISSIDENT_LINES, ringleader,
    Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA51));

  const centerPortrait = ringleaderUrl
    ? `<div class="fevt-subject-portrait-wrap" style="background-image:url('${ringleaderUrl}')"></div>`
    : `<div class="fevt-subject-portrait-wrap"></div>`;

  const html = `
    <div class="fevt-overlay-office" id="fevtF05Overlay">
      <div class="fevt-report-card f05">
        <div class="fevt-report-header">
          <div class="fevt-report-title">⚙ 派閥内に火種</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)} ・ FOR YOUR INFORMATION</div>
        </div>
        ${_factionReporterStrip(state, '社長。お耳に入れておきます。あの組、中で軋みが出てるみたいです')}
        <div class="fevt-subject-stage">
          <div class="fevt-subject-trio">
            ${centerPortrait}
          </div>
          <div class="fevt-subject-name">${String(ringleaderName)}</div>
          <div class="fevt-subject-org">${ringleaderMeta}</div>
          <div class="fevt-subject-divider"></div>
          <div class="fevt-observation-note">
            練習後のロッカーでの会話が減った。<span class="marker">${String(ringleaderSurname)}</span>はリーダー
            <span class="marker">${String(leaderSurname)}</span>の方針に
            <span class="marker hostile">不満を抱えている</span>ようだ。<br>
            まだ表には出ていないが、このまま放っておけば派閥が割れるかもしれない。
          </div>
          <div class="fevt-quote hostile">
            <div class="fevt-quote-speaker">${String(ringleaderName)}</div>
            ${String(line || '……もう、ついていけない。')}
          </div>
        </div>
        <div class="fevt-decision-prompt" style="padding-bottom:24px">
          <button class="fevt-continue-btn" id="fevtF05Continue" style="color:var(--cream-text-sub);border-color:rgba(100,85,50,0.3);background:rgba(255,255,255,0.3)">見 守 る ✓</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  const btn = root.querySelector('#fevtF05Continue');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      // 通知のみ。applyF05Choice 側で choiceId は無視されるが互換で 'X' を渡す
      if (onChoice) onChoice('X');
    });
  }
}

// F06: 和解の兆し（Office 応接室型 / 2択：A そっと後押し / B 何もしない）
// モック faction-events-f05-f08-rework.html §F06:
//   旧 A「和解興行」削除。もう熱が抜けたものを興行化しない。
//   新 A は旧 B「自然に任せる」相当の弱い後押し（コストなし）。
function showFactionF06Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF06Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const leaderAName = leaderA ? leaderA.name : (payload.leaderAName || '???');
  const leaderBName = leaderB ? leaderB.name : (payload.leaderBName || '???');
  const leaderASurname = leaderA ? _factionSurname(leaderA) : leaderAName;
  const leaderBSurname = leaderB ? _factionSurname(leaderB) : leaderBName;
  const leaderAUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const leaderBUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';

  // 敵対度平均（表示用）
  let hostAvg = '—';
  if (state && state.factionHostility && Engine && Engine.factions && Engine.factions._hostKey) {
    const hAB = state.factionHostility[Engine.factions._hostKey(payload.factionAId, payload.factionBId)] || 0;
    const hBA = state.factionHostility[Engine.factions._hostKey(payload.factionBId, payload.factionAId)] || 0;
    hostAvg = Math.round((hAB + hBA) / 2);
  }

  // 代表セリフ（leaderB の諦観風）。seed 決定性
  const seedPick = (state && state.season || 0) + (state && state.week || 0);
  const speaker = (seedPick % 2 === 0) ? leaderB : leaderA;
  const speakerName = speaker ? speaker.name : leaderBName;
  const line = _factionLine(FACTION_F06_AMBIENT_LINES, speaker,
    Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA61));

  const leftPortrait = leaderAUrl
    ? `<div class="fevt-pair-portrait" style="background-image:url('${leaderAUrl}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-pair-portrait"></div>`;
  const rightPortrait = leaderBUrl
    ? `<div class="fevt-pair-portrait" style="background-image:url('${leaderBUrl}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-pair-portrait"></div>`;

  const html = `
    <div class="fevt-overlay-office" id="fevtF06Overlay">
      <div class="fevt-report-card f06">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🌱 和解の兆し</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, 'あの2組、もう揉めてませんよ。先週の合同練習でも、普通に挨拶してました')}
        <div class="fevt-subject-stage">
          <div class="fevt-subject-pair">
            ${leftPortrait}
            <div class="fevt-pair-bridge">↔</div>
            ${rightPortrait}
          </div>
          <div class="fevt-subject-name">${String(factionAName)} ・ ${String(factionBName)}</div>
          <div class="fevt-subject-org">FORMER RIVALS ・ HOSTILITY ${hostAvg} / 100</div>
          <div class="fevt-subject-divider"></div>
          <div class="fevt-observation-note">
            対立が始まって以来、両派閥のリーダー<span class="marker">${String(leaderASurname)}</span>と<span class="marker">${String(leaderBSurname)}</span>の間にあった棘は、
            ここ数週間で<span class="marker peace">明らかに和らいで</span>いる。<br>
            メンバー間でも私的な交流が戻り始めた。社長の一押しがあれば、抗争は完全に終結する。
          </div>
          <div class="fevt-quote peace">
            <div class="fevt-quote-speaker">${String(speakerName)}</div>
            ${String(line || '……もう、いいかな。あの人とぶつかり続ける理由も、正直、思い出せないし。')}
          </div>
        </div>
        <div class="fevt-decision-prompt">この空気を、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray two">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">そっと結束を後押しする</div>
            <div class="fevt-decision-hint">敵対度を一気に解消、両リーダー trust +3〜+5。大々的な興行は組まない、静かな終結</div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">何もしない</div>
            <div class="fevt-decision-hint">介入なし。自然減衰に任せる（CD 16週まで再判定なし）</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  root.querySelectorAll('.fevt-decision-card').forEach(card => {
    card.addEventListener('click', function() {
      const choice = this.dataset.choice;
      if (!choice) return;
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onChoice) onChoice(choice);
    });
  });
}

// F07: リーダーの要求（Office 応接室型 / 3択：認める / 釘刺し / 別幹部）
// モック faction-events-f05-f08-rework.html §F07:
//   trio 配置（follower + leader + follower）＋リーダーセリフ＋具体的数値ヒント。
//   「dictator」→「独裁化」と日本語で明示。
function showFactionF07Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF07Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const leader = roster.find(c => c.id === payload.leaderId);
  const leaderName = leader ? leader.name : (payload.leaderName || '???');
  const leaderSurname = leader ? _factionSurname(leader) : leaderName;
  const leaderUrl = leader ? _factionUpperUrl(leader.id) : '';
  const faction = (state && state.factions || []).find(f => f.id === payload.factionId);
  const memberIds = faction ? (faction.memberIds || []) : [];
  const memberCount = memberIds.length;
  // フォロワー 2 名: リーダー除き OVR 降順から
  const followers = memberIds
    .filter(id => id !== payload.leaderId)
    .map(id => roster.find(c => c.id === id))
    .filter(Boolean)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const fol1 = followers[0] || null;
  const fol2 = followers[1] || null;

  const leaderMeta = leader
    ? `AGE ${leader.age || '—'} ・ OVR ${Engine.util.ov(leader)} ・ FACTION LEADER ・ ${String(payload.factionName || '')}（${memberCount}名）`
    : `FACTION LEADER ・ ${String(payload.factionName || '')}`;

  const line = _factionLine(FACTION_F07_LEADER_LINES, leader,
    Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA71));

  const leftFol = fol1
    ? `<div class="fevt-follower-portrait" style="background-image:url('${_factionUpperUrl(fol1.id)}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-follower-portrait"></div>`;
  const rightFol = fol2
    ? `<div class="fevt-follower-portrait right" style="background-image:url('${_factionUpperUrl(fol2.id)}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-follower-portrait right"></div>`;
  const centerLeader = leaderUrl
    ? `<div class="fevt-subject-portrait-wrap" style="background-image:url('${leaderUrl}')"></div>`
    : `<div class="fevt-subject-portrait-wrap"></div>`;

  const html = `
    <div class="fevt-overlay-office" id="fevtF07Overlay">
      <div class="fevt-report-card f07">
        <div class="fevt-report-header">
          <div class="fevt-report-title">👑 リーダーの要求</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, (leaderSurname || 'リーダー') + 'さんが社長室に向かいました。後ろに数名ついてます。多分、いつもの話です')}
        <div class="fevt-subject-stage">
          <div class="fevt-subject-trio">
            ${leftFol}
            ${centerLeader}
            ${rightFol}
          </div>
          <div class="fevt-subject-name">${String(leaderName)}</div>
          <div class="fevt-subject-org">${leaderMeta}</div>
          <div class="fevt-subject-divider"></div>
          <div class="fevt-observation-note">
            <span class="marker">${String(leaderSurname)}</span>は、自分の派閥の地位を当然のものと見なしている。<br>
            要求の内容は明示されない——「うちの子らを大事にしろ」という、抽象的な圧。<br>
            後ろに控える2人の存在が、要求の重さを物語る。
          </div>
          <div class="fevt-quote leader">
            <div class="fevt-quote-speaker">${String(leaderName)}</div>
            ${String(line || '……うちの連中のこと、もう少し考えてほしい。')}
          </div>
        </div>
        <div class="fevt-decision-prompt">この要求を、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">権威を認める</div>
            <div class="fevt-decision-hint">
              リーダーの威圧に折れて、派閥の発言力を黙認する。<br>
              リーダー信頼 <strong>+5</strong>／非メンバー信頼 <strong>-3〜-6</strong>／ロッカー士気 <strong>-3〜-5</strong>。<br>
              <strong style="color:#7a1414">この派閥が「独裁化」する</strong>（派閥内の緊張が増し、F07 が再び起きやすくなる）
            </div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">釘を刺す</div>
            <div class="fevt-decision-hint">
              「特別扱いはしない、ここは皆の団体だ」と返す。<br>
              リーダー信頼 <strong>-8〜-12</strong>／非メンバー信頼 <strong>+2〜+3</strong>。<br>
              4回累積でこの派閥の「権威型」資格そのものを剥がせる
            </div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">別の幹部を立てる</div>
            <div class="fevt-decision-hint">
              リーダーを通さず、副リーダー格を表に出す。<br>
              リーダー信頼 <strong>-5〜-8</strong>／別幹部信頼 <strong>+5〜+8</strong>。<br>
              「権威型」資格は剥がれるが、派閥内に新たな対立軸が生まれる
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  root.querySelectorAll('.fevt-decision-card').forEach(card => {
    card.addEventListener('click', function() {
      const choice = this.dataset.choice;
      if (!choice) return;
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onChoice) onChoice(choice);
    });
  });
}

// F08: 対立ヒートアップ（Office 応接室型 / duel 配置 / 3択：直接対決 / 仲裁条件未達 / 煽らず組まず）
// モック faction-events-f05-f08-rework.html §F08:
//   subject-duel（2人並び VS）＋両リーダー肖像直下に吹き出し。
//   旧 B「別興行コスト200万」を削除し、B は「仲裁する（条件未達）」として disabled 表示のみ。
//   C は「煽らず組まず」。熱を持続させるため cooldown は立てない（apply 側で処理）。
function showFactionF08Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF08Modal(payload, state, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const leaderAName = leaderA ? leaderA.name : (payload.leaderAName || '???');
  const leaderBName = leaderB ? leaderB.name : (payload.leaderBName || '???');
  const leaderAUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const leaderBUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';
  const leaderAOvr = leaderA ? Engine.util.ov(leaderA) : '—';
  const leaderBOvr = leaderB ? Engine.util.ov(leaderB) : '—';
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';
  const hostilityPeak = payload.hostilityPeak != null ? payload.hostilityPeak : '—';

  const lineA = _factionLine(FACTION_F08_LEADER_LINES, leaderA,
    Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA81));
  const lineB = _factionLine(FACTION_F08_LEADER_LINES, leaderB,
    Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA82));

  const aPortrait = leaderAUrl
    ? `<div class="fevt-duel-portrait" style="background-image:url('${leaderAUrl}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-duel-portrait"></div>`;
  const bPortrait = leaderBUrl
    ? `<div class="fevt-duel-portrait" style="background-image:url('${leaderBUrl}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-duel-portrait"></div>`;

  const html = `
    <div class="fevt-overlay-office" id="fevtF08Overlay">
      <div class="fevt-report-card f08">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🔥 対立ヒートアップ</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)} ・ HOSTILITY ${hostilityPeak} / 100</div>
        </div>
        ${_factionReporterStrip(state, '……もう、止めても無駄だと思います。両方とも、リングで決着つける覚悟です')}
        <div class="fevt-subject-stage">
          <div class="fevt-subject-duel">
            <div class="col">
              ${aPortrait}
              <div class="fevt-duel-faction">FACTION ・ ${String(factionAName)}</div>
              <div class="fevt-duel-name">${String(leaderAName)}</div>
              <div class="fevt-duel-org">LEADER ・ OVR ${leaderAOvr}</div>
              <div class="fevt-bubble left">
                <span class="fevt-bubble-name">${String(leaderAName)}</span>
                ${String(lineA || '……もう、話し合いでは済まない。あの人とは、リングの上でしか答えが出ない。')}
              </div>
            </div>
            <div class="fevt-duel-vs">VS</div>
            <div class="col right">
              ${bPortrait}
              <div class="fevt-duel-faction">FACTION ・ ${String(factionBName)}</div>
              <div class="fevt-duel-name">${String(leaderBName)}</div>
              <div class="fevt-duel-org">LEADER ・ OVR ${leaderBOvr}</div>
              <div class="fevt-bubble right">
                <span class="fevt-bubble-name">${String(leaderBName)}</span>
                ${String(lineB || 'いいでしょう。逃げも隠れもしない。来週、メインで、決着をつけましょう。')}
              </div>
            </div>
          </div>
          <div class="fevt-subject-divider" style="margin-top:18px"></div>
          <div class="fevt-observation-note">
            両派閥の敵対度は <span class="marker hostile">${hostilityPeak}/100</span>。
            ロッカールームの緊張は限界に近く、メンバー全員が次の興行のカード編成を待っている。<br>
            この熱を、どこに着火させるかは社長の手の中にある。
          </div>
        </div>
        <div class="fevt-decision-prompt">この熱を、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">直接対決をメインに組む</div>
            <div class="fevt-decision-hint">F08直接対決ボーナス MQ +15〜+20、集客 +12%。負けた派閥は崩壊リスク</div>
          </div>
          <div class="fevt-decision-card label-disabled" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">仲裁する（条件未達）</div>
            <div class="fevt-decision-hint">敵対度80超では仲裁不能。敵対度70未満で再判定</div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">煽らず、組まず</div>
            <div class="fevt-decision-hint">熱は持続。次興行に持ち越し。CD 24週は走らない（再判定継続）</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  root.querySelectorAll('.fevt-decision-card').forEach(card => {
    card.addEventListener('click', function() {
      if (this.classList.contains('label-disabled')) return;
      const choice = this.dataset.choice;
      if (!choice) return;
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onChoice) onChoice(choice);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// F02 進展4種（ignite / resolution / peace / endless）: 通知型 Stage イベント
// モック: docs/ui/mockups/faction-events.html L1751-1984
// spec:  docs/ui/03-screens/faction-events.md F02 進展①〜④
// payload 共通: { leaderAId, leaderBId, factionAName, factionBName, ledger? }
// onContinue: 「続ける」クリック時コールバック（任意）
// ─────────────────────────────────────────────────────────────────────────────

function _factionF02StageBtnBind(root, onContinue) {
  const btn = root.querySelector('.fevt-continue-btn');
  if (btn) btn.addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  });
}

function _factionF02StageMount(html) {
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-stage');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }
  return root;
}

// F02① 発火 — 社長が A 煽る を選んだ後、次週メインカード公式戦化の通知
function showFactionF02IgniteModal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF02IgniteModal(payload, state, onContinue)); return; }
  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';
  const aName = leaderA ? leaderA.name : '???';
  const bName = leaderB ? leaderB.name : '???';
  const aUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const bUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';
  const hostilityA = payload.hostilityA != null ? payload.hostilityA : '—';
  const hostilityB = payload.hostilityB != null ? payload.hostilityB : '—';
  const membersA = payload.membersA != null ? payload.membersA : '—';
  const membersB = payload.membersB != null ? payload.membersB : '—';

  const html = `
    <div class="fevt-overlay-stage ignite" id="fevtF02IOverlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main ignite">開 　 戦</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">OFFICIAL MATCH SIGNED ・ WEEK ${(state && state.week) || '—'}</div>
      </div>
      <div class="fevt-ign-stage">
        <div class="fevt-ign-col left">
          <div class="fevt-role-label">PROVOKING SIDE</div>
          <div class="fevt-role-kanji">宣 　 戦</div>
          <div class="fevt-portrait-wrap">
            ${aUrl ? `<img class="fevt-leader-upper" src="${aUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
            <div class="fevt-faction-flag">${String(factionAName)}</div>
          </div>
          <div class="fevt-leader-name">${String(aName)}</div>
          <div class="fevt-leader-org">LEADER</div>
          <div class="fevt-ign-stats">
            <span>敵対度<span class="stat-num">${hostilityA}</span></span>
            <span>派閥人数<span class="stat-num">${membersA}</span></span>
          </div>
        </div>
        <div class="fevt-ign-vs">VS</div>
        <div class="fevt-ign-col right">
          <div class="fevt-role-label">RESPONDING SIDE</div>
          <div class="fevt-role-kanji">応 　 戦</div>
          <div class="fevt-portrait-wrap">
            ${bUrl ? `<img class="fevt-leader-upper" src="${bUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
            <div class="fevt-faction-flag">${String(factionBName)}</div>
          </div>
          <div class="fevt-leader-name">${String(bName)}</div>
          <div class="fevt-leader-org">LEADER</div>
          <div class="fevt-ign-stats">
            <span>敵対度<span class="stat-num">${hostilityB}</span></span>
            <span>派閥人数<span class="stat-num">${membersB}</span></span>
          </div>
        </div>
      </div>
      <div class="fevt-ign-card-band">
        <div class="fevt-ign-card-label">MAIN EVENT ・ 公式戦化</div>
        <div class="fevt-ign-card-name">派閥抗争 ・ 直接決戦</div>
      </div>
      <div class="fevt-ign-verdict">
        水面下でくすぶっていた火種は、<em>リング上での戦い</em>にまで燃え広がった。<br>
        来週の興行、メインは——この一戦。観客も、この対決に期待を膨らませている。
      </div>
      <div class="fevt-ign-ledger">
        <div class="fevt-ign-ledger-col">
          <div class="fevt-ign-ledger-head">両 派 閥</div>
          <div class="fevt-ign-ledger-line">相互 敵対度　<span class="delta-up">+12</span></div>
          <div class="fevt-ign-ledger-line">対戦マッチ数　<span class="delta-up">1 → 2</span></div>
        </div>
        <div class="fevt-ign-ledger-col">
          <div class="fevt-ign-ledger-head">興 行</div>
          <div class="fevt-ign-ledger-line">メイン MQ 期待値　<span class="delta-up">+8</span></div>
          <div class="fevt-ign-ledger-line">集客見込み　<span class="delta-up">+6%</span></div>
        </div>
      </div>
      <button class="fevt-continue-btn">続 け る</button>
    </div>
  `;
  const root = _factionF02StageMount(html);
  _factionF02StageBtnBind(root, onContinue);
}

// F02② 沈静化 — 仲裁後の対等な和解
function showFactionF02PeaceModal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF02PeaceModal(payload, state, onContinue)); return; }
  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';
  const aName = leaderA ? leaderA.name : '???';
  const bName = leaderB ? leaderB.name : '???';
  const aUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const bUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';

  const html = `
    <div class="fevt-overlay-stage peace" id="fevtF02POverlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main peace">和 　 解</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">MEDIATION SUCCEEDED ・ WEEK ${(state && state.week) || '—'}</div>
      </div>
      <div class="fevt-peace-stage">
        <div class="fevt-peace-col left">
          <div class="fevt-faction-flag a">${String(factionAName)}</div>
          ${aUrl ? `<img class="fevt-leader-upper" src="${aUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(aName)}</div>
          <div class="fevt-leader-org">LEADER</div>
        </div>
        <div class="fevt-peace-center">
          <div class="fevt-peace-handshake">
            <div class="fevt-peace-dot a"></div>
            <div class="fevt-peace-dot b"></div>
          </div>
          <div class="fevt-peace-center-label"><span>RECONCILED</span></div>
        </div>
        <div class="fevt-peace-col right">
          <div class="fevt-faction-flag b">${String(factionBName)}</div>
          ${bUrl ? `<img class="fevt-leader-upper" src="${bUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(bName)}</div>
          <div class="fevt-leader-org">LEADER</div>
        </div>
      </div>
      <div class="fevt-peace-verdict">
        決着はつかなかった。<br>
        ただ、それぞれの派閥は、抗争が続くことの<em>無益</em>を知り、<em>矛を収めること</em>を選んだ。
      </div>
      <div class="fevt-peace-ledger">
        <div class="fevt-peace-ledger-col">
          <div class="fevt-peace-ledger-head">${String(factionAName)}</div>
          <div class="fevt-peace-ledger-line">${String(factionBName)}への敵対度　<span class="delta-down">-40</span></div>
          <div class="fevt-peace-ledger-line">勢い　<span class="delta-flat">リセット</span></div>
        </div>
        <div class="fevt-peace-ledger-col">
          <div class="fevt-peace-ledger-head">${String(factionBName)}</div>
          <div class="fevt-peace-ledger-line">${String(factionAName)}への敵対度　<span class="delta-down">-40</span></div>
          <div class="fevt-peace-ledger-line">勢い　<span class="delta-flat">リセット</span></div>
        </div>
      </div>
      <button class="fevt-continue-btn">続 け る</button>
    </div>
  `;
  const root = _factionF02StageMount(html);
  _factionF02StageBtnBind(root, onContinue);
}

// F02③ 決着 — 試合で雌雄を決した直後（勝者ゴールド × 敗者グレースケール）
// payload: { winnerId, loserId, winnerFactionName, loserFactionName }
function showFactionF02ResolutionModal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF02ResolutionModal(payload, state, onContinue)); return; }
  const roster = state ? (state.roster || []) : [];
  const winner = roster.find(c => c.id === payload.winnerId);
  const loser = roster.find(c => c.id === payload.loserId);
  const winnerFactionName = payload.winnerFactionName || '勝者派閥';
  const loserFactionName = payload.loserFactionName || '敗者派閥';
  const wName = winner ? winner.name : '???';
  const lName = loser ? loser.name : '???';
  const wUrl = winner ? _factionUpperUrl(winner.id) : '';
  const lUrl = loser ? _factionUpperUrl(loser.id) : '';

  const html = `
    <div class="fevt-overlay-stage resolution" id="fevtF02ROverlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main settled">決 　 着</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">FACTION RIVALRY SETTLED ・ WEEK ${(state && state.week) || '—'}</div>
      </div>
      <div class="fevt-res-stage">
        <div class="fevt-res-winner">
          <div class="fevt-faction-flag a">${String(winnerFactionName)}</div>
          ${wUrl ? `<img class="fevt-leader-upper" src="${wUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(wName)}</div>
          <div class="fevt-leader-org">VICTOR</div>
        </div>
        <div class="fevt-res-loser">
          <div class="fevt-faction-flag b">${String(loserFactionName)}</div>
          ${lUrl ? `<img class="fevt-leader-upper" src="${lUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(lName)}</div>
          <div class="fevt-leader-org">DEFEATED</div>
        </div>
      </div>
      <div class="fevt-res-verdict">
        ロッカールームに満ちていた争いの空気は、<br>
        <em>勝者</em>と<em>敗者</em>という、はっきりとした形に決着した。
      </div>
      <div class="fevt-res-ledger">
        <div class="fevt-res-ledger-col win">
          <div class="fevt-res-ledger-head">${String(winnerFactionName)} ・ VICTOR</div>
          <div class="fevt-res-ledger-line">求心力　<span class="delta-up">+12</span> ・ 勢い <span class="delta-up">+18</span></div>
          <div class="fevt-res-ledger-line">リーダー信頼　<span class="delta-up">+6</span></div>
          <div class="fevt-res-ledger-line">${String(loserFactionName)}への敵対度　<span class="delta-down">-40</span></div>
        </div>
        <div class="fevt-res-ledger-col lose">
          <div class="fevt-res-ledger-head">${String(loserFactionName)} ・ DEFEATED</div>
          <div class="fevt-res-ledger-line">求心力　<span class="delta-down">-14</span> ・ 勢い <span class="delta-down">-22</span></div>
          <div class="fevt-res-ledger-line">離脱リスク者　<span class="delta-down">2名</span></div>
          <div class="fevt-res-ledger-line">${String(winnerFactionName)}への敵対度　<span class="delta-down">-40</span></div>
        </div>
      </div>
      <button class="fevt-continue-btn">続 け る</button>
    </div>
  `;
  const root = _factionF02StageMount(html);
  _factionF02StageBtnBind(root, onContinue);
}

// F02④ 無限抗争 — 両方向 hostility ≥55 が 52週継続
// payload: { leaderAId, leaderBId, factionAName, factionBName, weeksContinued }
function showFactionF02EndlessModal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF02EndlessModal(payload, state, onContinue)); return; }
  const roster = state ? (state.roster || []) : [];
  const leaderA = roster.find(c => c.id === payload.leaderAId);
  const leaderB = roster.find(c => c.id === payload.leaderBId);
  const factionAName = payload.factionAName || '派閥A';
  const factionBName = payload.factionBName || '派閥B';
  const aName = leaderA ? leaderA.name : '???';
  const bName = leaderB ? leaderB.name : '???';
  const aUrl = leaderA ? _factionUpperUrl(leaderA.id) : '';
  const bUrl = leaderB ? _factionUpperUrl(leaderB.id) : '';
  const weeks = payload.weeksContinued != null ? payload.weeksContinued : 52;

  const html = `
    <div class="fevt-overlay-stage endless" id="fevtF02EOverlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main endless">終 わ ら な い 抗 争</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">RIVALRY UNRESOLVED ・ WEEK ${(state && state.week) || '—'}</div>
      </div>
      <div class="fevt-endless-counter">
        <div class="fevt-endless-counter-label">抗 争 継 続</div>
        <div class="fevt-endless-counter-num">${weeks}</div>
        <div class="fevt-endless-counter-unit">WEEKS ・ 一 年 を 超 え た</div>
      </div>
      <div class="fevt-endless-stage">
        <div class="fevt-endless-col left">
          <div class="fevt-faction-flag a">${String(factionAName)}</div>
          ${aUrl ? `<img class="fevt-leader-upper" src="${aUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(aName)}</div>
          <div class="fevt-leader-org">UNRESOLVED</div>
        </div>
        <div class="fevt-endless-vs">
          <div class="fevt-endless-vs-mark">
            — 膠 着 —
            <span>NO END IN SIGHT</span>
          </div>
        </div>
        <div class="fevt-endless-col right">
          <div class="fevt-faction-flag b">${String(factionBName)}</div>
          ${bUrl ? `<img class="fevt-leader-upper" src="${bUrl}" alt="">` : `<div class="fevt-leader-upper"></div>`}
          <div class="fevt-leader-name">${String(bName)}</div>
          <div class="fevt-leader-org">UNRESOLVED</div>
        </div>
      </div>
      <div class="fevt-endless-verdict">
        どちらも屈しない。どちらも勝てない。<br>
        <em>抗争</em>は決着がつかないまま、<em>団体と所属選手の時間</em>を食いつぶし続けている。<br>
        <span style="color:#807860;font-size:13px">——ロッカールームの若手が、先輩たちの顔色を窺うようになった。</span>
      </div>
      <div class="fevt-endless-erosion">
        <div class="fevt-endless-erosion-head">静 か な 侵 食</div>
        <div class="fevt-endless-erosion-row">
          <span>ロスター全体の士気</span>
          <span class="delta">-4 / 継続中</span>
        </div>
        <div class="fevt-endless-erosion-row">
          <span>新人の練習集中</span>
          <span class="delta">-3 / 継続中</span>
        </div>
        <div class="fevt-endless-erosion-row">
          <span>観客の熱気（固定層以外）</span>
          <span class="delta">-5 / 継続中</span>
        </div>
        <div class="fevt-endless-erosion-row">
          <span>2派閥メンバーの離脱リスク</span>
          <span class="delta">緩やかに上昇</span>
        </div>
      </div>
      <button class="fevt-continue-btn">続 け る</button>
    </div>
  `;
  const root = _factionF02StageMount(html);
  _factionF02StageBtnBind(root, onContinue);
}

// グローバル公開
if (typeof window !== 'undefined') {
  window.showFactionF01Modal = showFactionF01Modal;
  window.showFactionF02Modal = showFactionF02Modal;
  window.showFactionF02IgniteModal = showFactionF02IgniteModal;
  window.showFactionF02PeaceModal = showFactionF02PeaceModal;
  window.showFactionF02ResolutionModal = showFactionF02ResolutionModal;
  window.showFactionF02EndlessModal = showFactionF02EndlessModal;
  window.showFactionF03Modal = showFactionF03Modal;
  window.showFactionF04Modal = showFactionF04Modal;
  window.showFactionF05Modal = showFactionF05Modal;
  window.showFactionHiatusModal = showFactionHiatusModal;
  window.showFactionF06Modal = showFactionF06Modal;
  window.showFactionF07Modal = showFactionF07Modal;
  window.showFactionF08Modal = showFactionF08Modal;
  window.showFactionEventResult = showFactionEventResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0 Phase1-6: 大型イベント モーダル（B1〜B4）
// careOverlay/careBox を再利用。多段階対応（step パラメータ）
// ─────────────────────────────────────────────────────────────────────────────
function showLargeEventModal(event, state, step, onChoice) {
  if (step === 0 && _isPopupActive()) { _popupQueue.push(() => showLargeEventModal(event, state, step, onChoice)); return; }

  const roster = state ? (state.roster || []) : [];

  // B2/B3 → ダーク A 型テンプレ (mdlAOverlay)
  if (event.type === 'B2' || event.type === 'B3') {
    const overlay = document.getElementById('mdlAOverlay');
    const card    = document.getElementById('mdlACard');
    if (!overlay || !card) { if (onChoice) onChoice(-1); return; }

    let html = '', cardCls = 'mdl-a-card dark';
    if (event.type === 'B2') {
      if (step === 0)      { html = _buildB2Step1(event, state, roster); }
      else if (step === 1) { html = _buildB2Step2(event, state, roster); }
      else                 { html = _buildB2Step3(event, state, roster); cardCls += ' narrow'; }
    } else {
      if (step === 0)      { html = _buildB3Step1(event, state);          cardCls += ' narrow'; }
      else if (step === 1) { html = _buildB3Step2(event, state, roster);  cardCls += ' wide'; }
      else                 { html = _buildB3Step3(event, state, roster);  cardCls += ' narrow'; }
    }

    card.className = cardCls;
    card.innerHTML  = html;
    overlay.classList.add('active');
    _mdlAAttachSpeechHandlers(overlay, card);

    const closeAndChoice = (idx) => {
      overlay.classList.remove('active');
      Audio.play('click');
      if (onChoice) onChoice(idx);
    };

    // step 2: "次へ" → frame 3b 差し替え
    if (step >= 2) {
      const nextBtn = card.querySelector('[data-mdla-next]');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          Audio.play('click');
          const html3b = event.type === 'B2'
            ? _buildB2Step3b(event, state, roster)
            : _buildB3Step3b(event, state, roster);
          card.className = 'mdl-a-card dark narrow';
          card.innerHTML  = html3b;
          _mdlAAttachSpeechHandlers(overlay, card);
          card.querySelectorAll('[data-choice]').forEach(b =>
            b.addEventListener('click', () => closeAndChoice(0)));
        });
      }
    }

    card.querySelectorAll('[data-choice]').forEach(btn => {
      btn.addEventListener('click', function() {
        if (this.hasAttribute('disabled')) return;
        closeAndChoice(parseInt(this.dataset.choice));
      });
    });

    // 代表選手カード (B3 step1)
    card.querySelectorAll('[data-fighter-id]').forEach(c => {
      c.addEventListener('click', function() {
        closeAndChoice(parseInt(this.dataset.fighterId));
      });
    });
    return;
  }

  // B1/B4 — 既存 careOverlay
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onChoice) onChoice(-1); return; }

  let html = '';
  switch (event.type) {
    case 'B1': html = _buildB1Modal(event, state, roster); break;
    case 'B4': html = _buildB4Modal(event, state, roster); break;
    default: html = '<div class="care-title">不明なイベント</div><button class="btn" data-choice="0">閉じる</button>';
  }

  box.innerHTML = html;

  box.querySelectorAll('.btn[data-choice]').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.hasAttribute('disabled')) return;
      overlay.classList.remove('active');
      const idx = parseInt(this.dataset.choice);
      Audio.play('click');
      if (onChoice) onChoice(idx);
    });
  });

  box.querySelectorAll('.large-evt-fighter-pick').forEach(card => {
    card.addEventListener('click', function() {
      overlay.classList.remove('active');
      const fId = parseInt(this.dataset.fighterId);
      Audio.play('click');
      if (onChoice) onChoice(fId);
    });
  });

  overlay.classList.add('active');
}

// ── B1: 練習中の怪我 ──────────────────────────────────────────────────────
function _buildB1Modal(event, state, roster) {
  const fighter = roster.find(f => f.id === event.fighter);
  const face = fighter ? portraitImg(fighter.id, 72, 'care-reaction-portrait') : '';
  const severityLabel = event.severity === 'moderate' ? '（重め）' : '（軽め）';
  const funds = state.funds || 0;

  let html = `<div class="care-title" style="border-bottom:1px solid #e67e22;padding-bottom:10px;margin-bottom:12px">⚠️ 練習中のアクシデント${severityLabel}</div>`;

  if (event.detail) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${event.detail}</div>`;
  }

  if (fighter) {
    html += `<div class="care-reaction" style="border-color:#e67e22">
      ${face}
      <div class="care-reaction-bubble" style="border-color:#e67e22">
        <strong style="font-size:12px;color:var(--text-dim)">${fighter.name}</strong><br>
        「${event.dialogue || '…'}」
      </div>
    </div>`;
  }

  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">';
  const canAfford = funds >= 200;
  html += `<button class="btn" data-choice="0" ${canAfford ? '' : 'disabled'}
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between${canAfford ? '' : ';opacity:0.4;cursor:default'}">
    <span>特別治療（-200万）</span><span style="font-size:11px;color:var(--text-dim)">回復期間半減・信頼が上がる</span>
  </button>`;
  html += `<button class="btn" data-choice="1"
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>通常の治療</span><span style="font-size:11px;color:var(--text-dim)">標準回復</span>
  </button>`;
  html += `<button class="btn" data-choice="2"
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>無理させる</span><span style="font-size:11px;color:var(--text-dim)">信頼が少し上がる、40%で悪化リスク</span>
  </button>`;
  html += '</div>';
  return html;
}

// ── B2 Step 1: 対立報告 ───────────────────────────────────────────────────
function _buildB2Step1(event, state, roster) {
  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);
  const u1 = f1 ? getUpperUrl(f1.id) : '';
  const u2 = f2 ? getUpperUrl(f2.id) : '';
  const p1s = u1 ? `background-image:url('${u1}')` : 'background:#2a1a14';
  const p2s = u2 ? `background-image:url('${u2}')` : 'background:#2a1a14';
  const n1 = f1 ? f1.name : (event.name1 || '?');
  const n2 = f2 ? f2.name : (event.name2 || '?');
  const o1 = f1 ? Engine.util.ov(f1) : '?';
  const o2 = f2 ? Engine.util.ov(f2) : '?';
  const weekMeta = _mdlASeasonLabel(state);
  const reporterLine = event.detail || '練習場で大きな衝突があったようです';

  return `
    <div class="mdl-a-header danger">
      <div class="mdl-a-header-title">💥 選 手 間 の 深 刻 な 対 立</div>
      <div class="mdl-a-header-meta">INTERNAL CONFLICT ・ ${weekMeta}</div>
    </div>
    ${_mdlAReporterStrip(state, reporterLine)}
    <div class="mdl-a-duo-stage" style="padding-top:108px">
      <div class="mdl-a-duo-col">
        <div class="mdl-a-portrait-wrap">
          <div class="mdl-a-speech-pending">…</div>
          <div class="mdl-a-speech danger delayed">
            <div class="mdl-a-speech-speaker">${n1.toUpperCase()}</div>
            <div class="mdl-a-speech-text">${event.dialogue || '…'}</div>
          </div>
          <div class="mdl-a-duo-portrait" style="${p1s}"></div>
        </div>
        <div class="mdl-a-duo-name">${n1}</div>
        <div class="mdl-a-duo-org">OVR ${o1}</div>
      </div>
      <div class="mdl-a-duo-col">
        <div class="mdl-a-portrait-wrap">
          <div class="mdl-a-speech-pending">…</div>
          <div class="mdl-a-speech danger delayed">
            <div class="mdl-a-speech-speaker">${n2.toUpperCase()}</div>
            <div class="mdl-a-speech-text">${event.dialogue2 || '…'}</div>
          </div>
          <div class="mdl-a-duo-portrait" style="${p2s}"></div>
        </div>
        <div class="mdl-a-duo-name">${n2}</div>
        <div class="mdl-a-duo-org">OVR ${o2}</div>
      </div>
    </div>
    <div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
    <div class="mdl-a-prompt" style="padding-top:20px">社長として、どう対処しますか？</div>
    <div class="mdl-a-decision-tray">
      <div class="mdl-a-decision-card" data-choice="0">
        <div class="mdl-a-decision-letter">A</div>
        <div class="mdl-a-decision-label">話し合いで解決</div>
        <div class="mdl-a-decision-hint positive">両者の信頼↑ ／ 士気回復</div>
      </div>
      <div class="mdl-a-decision-card danger-accent" data-choice="1">
        <div class="mdl-a-decision-letter">B</div>
        <div class="mdl-a-decision-label">試合で決着させる</div>
        <div class="mdl-a-decision-hint">勝者↑↑ ／ 敗者↓</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="2">
        <div class="mdl-a-decision-letter">C</div>
        <div class="mdl-a-decision-label">放置する</div>
        <div class="mdl-a-decision-hint negative">両者の信頼↓↓ ／ 士気低下</div>
      </div>
    </div>`;
}

// ── B2 Step 2: 介入選択 ───────────────────────────────────────────────────
function _buildB2Step2(event, state, roster) {
  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);
  const n1 = f1 ? f1.name : (event.name1 || '?');
  const n2 = f2 ? f2.name : (event.name2 || '?');
  const o1 = f1 ? Engine.util.ov(f1) : '?';
  const o2 = f2 ? Engine.util.ov(f2) : '?';
  const u1 = f1 ? getUpperUrl(f1.id) : '';
  const u2 = f2 ? getUpperUrl(f2.id) : '';
  const p1s = u1 ? `background-image:url('${u1}')` : 'background:#2a1a14';
  const p2s = u2 ? `background-image:url('${u2}')` : 'background:#2a1a14';

  return `
    <div class="mdl-a-header">
      <div class="mdl-a-header-title">🤝 ど う 立 ち 会 い ま す か</div>
      <div class="mdl-a-header-meta">INTERVENTION ・ ${_mdlASeasonLabel(state)}</div>
    </div>
    ${_mdlAReporterStrip(state, '試合で決着をつけさせることにしました。社長の立ち位置を決めてください')}
    <div class="mdl-a-vs-stage">
      <div class="mdl-a-vs-row">
        <div class="mdl-a-vs-fighter">
          <div class="mdl-a-vs-upper" style="${p1s}"></div>
          <div class="mdl-a-vs-name">${n1}</div>
          <div class="mdl-a-vs-ovr">OVR ${o1}</div>
        </div>
        <div class="mdl-a-vs-mark">VS</div>
        <div class="mdl-a-vs-fighter">
          <div class="mdl-a-vs-upper" style="${p2s}"></div>
          <div class="mdl-a-vs-name">${n2}</div>
          <div class="mdl-a-vs-ovr">OVR ${o2}</div>
        </div>
      </div>
    </div>
    <div class="mdl-a-prompt">どう介入しますか？</div>
    <div class="mdl-a-decision-tray">
      <div class="mdl-a-decision-card" data-choice="2">
        <div class="mdl-a-decision-letter">A</div>
        <div class="mdl-a-decision-label">介入しない</div>
        <div class="mdl-a-decision-hint">純粋な実力勝負</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="0">
        <div class="mdl-a-decision-letter">B</div>
        <div class="mdl-a-decision-label">${n1}を後押し</div>
        <div class="mdl-a-decision-hint">${n1}信頼↑ ／ ${n2}↓</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="1">
        <div class="mdl-a-decision-letter">C</div>
        <div class="mdl-a-decision-label">${n2}を後押し</div>
        <div class="mdl-a-decision-hint">${n2}信頼↑ ／ ${n1}↓</div>
      </div>
    </div>`;
}

// ── B2 Step 3: 勝者コマ (frame 3a) ────────────────────────────────────────
function _buildB2Step3(event, state, roster) {
  const result = event.matchResult;
  if (!result) return '<div class="mdl-a-header"><div class="mdl-a-header-title">試合結果</div></div><div class="mdl-a-prompt"><button class="mdl-a-continue-btn" data-choice="0">閉じる</button></div>';

  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);
  const isDraw = result.winner === 'draw';
  const winnerF = !isDraw ? (result.winner === 'fighter1' ? f1 : f2) : null;
  const loserF  = !isDraw ? (result.winner === 'fighter1' ? f2 : f1) : null;
  const displayF = winnerF || f1;
  const displayName = displayF ? displayF.name : '?';
  const upperUrl = displayF ? getUpperUrl(displayF.id) : '';
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a2520';

  const verdictJp  = isDraw ? '引き分け' : '勝 利';
  const verdictEn  = isDraw ? 'DRAW' : 'VICTORY';
  const verdictCls = isDraw ? 'draw' : 'victory';
  const speechCls  = isDraw ? '' : 'gold';

  const winnerLine = isDraw
    ? '互いの実力を認め合った。'
    : (typeof pickDialogueLine === 'function' && typeof RIVALRY_RESOLUTION_LINES !== 'undefined'
        ? (pickDialogueLine(RIVALRY_RESOLUTION_LINES.winner, winnerF) || 'これで、はっきりさせた')
        : 'これで、はっきりさせた');

  const n1 = f1 ? f1.name : (event.name1 || '?');
  const n2 = f2 ? f2.name : (event.name2 || '?');
  const resultRow = isDraw
    ? `<div class="mdl-a-result-row"><span>結果</span><strong>引き分け</strong></div>`
    : `<div class="mdl-a-result-row"><span>${winnerF ? winnerF.name : ''}の信頼</span><span class="pos">+8</span></div>
       <div class="mdl-a-result-row"><span>${loserF ? loserF.name : ''}の信頼</span><span class="neg">−4</span></div>
       <div class="mdl-a-result-row"><span>両者の士気</span><strong>一旦リセット</strong></div>`;

  const closePart = isDraw
    ? `<div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-choice="0">— 了 解 —</button></div>`
    : `<div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
       <div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-mdla-next>— 次 へ —</button></div>`;

  return `
    <div class="mdl-a-header">
      <div class="mdl-a-header-title">${isDraw ? '🤝 対立の結果' : '✨ 対 立 の 決 着'}</div>
      <div class="mdl-a-header-meta">${isDraw ? 'DRAW' : 'RESOLVED ・ 1 / 2'}</div>
    </div>
    ${_mdlAReporterStrip(state, '決着がつきました')}
    <div class="mdl-a-subject-stage" style="padding-top:30px">
      <div class="mdl-a-result-verdict">
        <div class="mdl-a-result-verdict-jp ${verdictCls}">${verdictJp}</div>
        <div class="mdl-a-result-verdict-en ${verdictCls}">${verdictEn}</div>
      </div>
      <div class="mdl-a-portrait-wrap" style="margin-top:20px">
        <div class="mdl-a-speech-pending">…</div>
        <div class="mdl-a-speech ${speechCls} delayed">
          <div class="mdl-a-speech-speaker">${displayName.toUpperCase()}</div>
          <div class="mdl-a-speech-text">${winnerLine}</div>
        </div>
        <div class="mdl-a-subject-portrait" style="${portraitStyle}"></div>
      </div>
      <div class="mdl-a-subject-name">${displayName}</div>
      <div class="mdl-a-subject-org">${displayF ? `AGE ${displayF.age || '—'} ・ OVR ${Engine.util.ov(displayF)}` : ''}</div>
      <div class="mdl-a-result-summary">${resultRow}</div>
    </div>
    ${closePart}`;
}

// ── B2 Step 3b: 敗者コマ (frame 3b) ──────────────────────────────────────
function _buildB2Step3b(event, state, roster) {
  const result = event.matchResult;
  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);
  const loserF = result && result.winner !== 'draw'
    ? (result.winner === 'fighter1' ? f2 : f1)
    : f2;
  const loserName = loserF ? loserF.name : '?';
  const upperUrl = loserF ? getUpperUrl(loserF.id) : '';
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a2520';
  const loserLine = (typeof pickDialogueLine === 'function' && typeof RIVALRY_RESOLUTION_LINES !== 'undefined')
    ? (pickDialogueLine(RIVALRY_RESOLUTION_LINES.loser, loserF) || '……覚えてなさいよ。次は絶対に、私が勝つ')
    : '……覚えてなさいよ。次は絶対に、私が勝つ';

  return `
    <div class="mdl-a-header">
      <div class="mdl-a-header-title">😔 敗 者 の 声</div>
      <div class="mdl-a-header-meta">AFTERMATH ・ 2 / 2</div>
    </div>
    ${_mdlAReporterStrip(state, `${loserName}は納得していないようです…`)}
    <div class="mdl-a-subject-stage defeat" style="padding-top:96px">
      <div class="mdl-a-portrait-wrap">
        <div class="mdl-a-speech-pending">…</div>
        <div class="mdl-a-speech resentment delayed">
          <div class="mdl-a-speech-speaker">${loserName.toUpperCase()}</div>
          <div class="mdl-a-speech-text">${loserLine}</div>
        </div>
        <div class="mdl-a-subject-portrait defeat" style="${portraitStyle}"></div>
      </div>
      <div style="margin-top:12px"><div class="mdl-a-defeat-badge">DEFEATED ・ 敗 者</div></div>
      <div class="mdl-a-subject-name" style="color:rgba(232,220,200,0.85)">${loserName}</div>
      <div class="mdl-a-subject-org" style="color:rgba(200,180,150,0.7)">${loserF ? `AGE ${loserF.age || '—'} ・ OVR ${Engine.util.ov(loserF)}` : ''}</div>
      <div class="mdl-a-observation" style="color:rgba(232,220,200,0.8);font-size:13px;margin-top:16px">
        胸の内に、<span class="marker danger">新たな火種</span>がくすぶり始めた。
      </div>
    </div>
    <div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" data-choice="0">— 見 届 け る —</button>
    </div>`;
}

// ── B3 Step 1: 挑戦状オファー ──────────────────────────────────────────────
function _buildB3Step1(event, state) {
  const challenger = event.challenger || {};
  const orgName = event.orgName || '他団体';
  const cOvr = challenger.pw ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5) : '?';
  const upperUrl = challenger.id ? getUpperUrl(challenger.id) : '';
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a1a14';

  return `
    <div class="mdl-a-header danger">
      <div class="mdl-a-header-title">⚔ ${orgName}からの挑戦状</div>
      <div class="mdl-a-header-meta">CHALLENGE LETTER ・ ${_mdlASeasonLabel(state)}</div>
    </div>
    ${_mdlAReporterStrip(state, `興行会場に${orgName}の関係者が来ています`)}
    <div class="mdl-a-subject-stage danger" style="padding-top:88px">
      <div class="mdl-a-portrait-wrap">
        <div class="mdl-a-speech-pending">…</div>
        <div class="mdl-a-speech danger delayed">
          <div class="mdl-a-speech-speaker">${(challenger.name || '???').toUpperCase()}</div>
          <div class="mdl-a-speech-text large">${event.challengerDialogue || '…'}</div>
        </div>
        <div class="mdl-a-subject-portrait big danger" style="${portraitStyle}"></div>
      </div>
      <div class="mdl-a-subject-name danger">${challenger.name || '???'}</div>
      <div class="mdl-a-subject-org danger">${orgName}</div>
      <div class="mdl-a-subject-ovr danger"><span class="label">OVR</span>${cOvr}</div>
      <div class="mdl-a-subject-divider"></div>
      <div class="mdl-a-observation">リングで語り合おう、と<span class="marker danger">挑戦状</span>を突きつけてきた。</div>
    </div>
    <div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
    <div class="mdl-a-prompt">この挑戦状、どうしますか？</div>
    <div class="mdl-a-decision-tray two">
      <div class="mdl-a-decision-card danger-accent" data-choice="0">
        <div class="mdl-a-decision-letter">受けて立つ</div>
        <div class="mdl-a-decision-label">代表選手を選んで対戦</div>
        <div class="mdl-a-decision-hint">次の画面で代表を選択</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="1">
        <div class="mdl-a-decision-letter">断る</div>
        <div class="mdl-a-decision-label">今回は辞退する</div>
        <div class="mdl-a-decision-hint">ペナルティなし</div>
      </div>
    </div>`;
}

// ── B3 Step 2: 代表選手選択 ────────────────────────────────────────────────
function _buildB3Step2(event, state, roster) {
  const available = roster.filter(f => !f.injury && !f.isRental);
  const challenger = event.challenger || {};
  const orgName = event.orgName || '他団体';
  const cOvr = challenger.pw ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5) : '?';
  const cUpperUrl = challenger.id ? getUpperUrl(challenger.id) : '';
  const cStyle = cUpperUrl ? `background-image:url('${cUpperUrl}')` : 'background:#2a1a14';

  const candidateCards = available.slice(0, 8).map(f => {
    const ovr = Engine.util.ov(f);
    const uUrl = getUpperUrl(f.id);
    const us = uUrl ? `background-image:url('${uUrl}')` : 'background:#2a2520';
    return `<div class="mdl-a-candidate-card" data-fighter-id="${f.id}">
      <div class="mdl-a-candidate-upper" style="${us}"></div>
      <div class="mdl-a-candidate-name">${f.name}</div>
      <div class="mdl-a-candidate-ovr-label">OVR</div>
      <div class="mdl-a-candidate-ovr">${ovr}</div>
    </div>`;
  }).join('');

  return `
    <div class="mdl-a-header danger">
      <div class="mdl-a-header-title">🥊 代表選手を選んでください</div>
      <div class="mdl-a-header-meta">SELECT YOUR CHAMPION</div>
    </div>
    ${_mdlAReporterStrip(state, 'どの選手を送り出しますか？')}
    <div class="mdl-a-candidate-stage">
      <div class="mdl-a-opponent-bar">
        <div class="mdl-a-opponent-upper" style="${cStyle}"></div>
        <div class="mdl-a-opponent-text">
          <div class="mdl-a-opponent-label">OPPONENT ・ 対戦相手</div>
          <div class="mdl-a-opponent-name">${challenger.name || '???'}</div>
          <div class="mdl-a-opponent-meta">${orgName}${challenger.style ? ' ・ ' + challenger.style : ''}</div>
        </div>
        <div class="mdl-a-opponent-ovr">${cOvr}</div>
      </div>
      <div class="mdl-a-candidate-title">— CANDIDATES ・ 自団体の代表候補 —</div>
      <div class="mdl-a-candidate-grid">${candidateCards}</div>
    </div>
    <div class="mdl-a-prompt" style="padding-bottom:24px">クリックで代表を決定します</div>`;
}

// ── B3 Step 3: 結果コマ (frame 3a) ────────────────────────────────────────
function _buildB3Step3(event, state, roster) {
  const result = event.matchResult;
  if (!result) return '<div class="mdl-a-header"><div class="mdl-a-header-title">挑戦状 結果</div></div><div class="mdl-a-prompt"><button class="mdl-a-continue-btn" data-choice="0">閉じる</button></div>';

  const challenger = event.challenger || {};
  const orgName = event.orgName || '他団体';
  const playerFighter = roster.find(f => f.id === event.selectedFighterId);
  const pName = playerFighter ? playerFighter.name : '代表選手';
  const won  = result.winner === 'left';
  const lost = result.winner === 'right';
  const isDraw = !won && !lost;

  const upperUrl = playerFighter ? getUpperUrl(playerFighter.id) : '';
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a2520';
  const verdictJp  = won ? '勝 利' : lost ? '敗 北' : '引き分け';
  const verdictEn  = won ? 'VICTORY' : lost ? 'DEFEAT' : 'DRAW';
  const verdictCls = won ? 'victory' : lost ? 'defeat' : 'draw';
  const speechCls  = won ? 'gold' : lost ? 'danger' : '';
  const pLine      = isDraw ? '互角の戦いを見せた。' : won ? 'この試合は、譲れなかった' : '…';

  const resultRows = `
    <div class="mdl-a-result-row"><span>対戦相手</span><strong>${challenger.name || '???'}（${orgName}）</strong></div>
    <div class="mdl-a-result-row"><span>MQ</span><span class="gold">${result.mq ? '★' + result.mq : '?'}</span></div>`;

  const closePart = isDraw
    ? `<div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-choice="0">— 了 解 —</button></div>`
    : `<div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
       <div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-mdla-next>— 次 へ —</button></div>`;

  const headerTitle = won ? '🏆 挑 戦 状 ・ 結 果' : lost ? '😞 挑 戦 状 ・ 結 果' : '🤼 引き分け';
  const headerMeta  = isDraw ? 'DRAW' : 'RESULT ・ 1 / 2';

  return `
    <div class="mdl-a-header${lost ? ' danger' : ''}">
      <div class="mdl-a-header-title">${headerTitle}</div>
      <div class="mdl-a-header-meta">${headerMeta}</div>
    </div>
    ${_mdlAReporterStrip(state, '試合、終わりました')}
    <div class="mdl-a-subject-stage" style="padding-top:30px">
      <div class="mdl-a-result-verdict">
        <div class="mdl-a-result-verdict-jp ${verdictCls}">${verdictJp}</div>
        <div class="mdl-a-result-verdict-en ${verdictCls}">${verdictEn}</div>
      </div>
      <div class="mdl-a-portrait-wrap" style="margin-top:20px">
        <div class="mdl-a-speech-pending">…</div>
        <div class="mdl-a-speech ${speechCls} delayed">
          <div class="mdl-a-speech-speaker">${pName.toUpperCase()}</div>
          <div class="mdl-a-speech-text">${pLine}</div>
        </div>
        <div class="mdl-a-subject-portrait" style="${portraitStyle}${won ? ';box-shadow:0 0 32px rgba(240,208,120,0.3)' : ''}"></div>
      </div>
      <div class="mdl-a-subject-name">${pName}</div>
      <div class="mdl-a-subject-org">${playerFighter ? `AGE ${playerFighter.age || '—'} ・ OVR ${Engine.util.ov(playerFighter)}` : ''}</div>
      <div class="mdl-a-result-summary">${resultRows}</div>
    </div>
    ${closePart}`;
}

// ── B3 Step 3b: 敵陣反応 (frame 3b) ──────────────────────────────────────
function _buildB3Step3b(event, state, roster) {
  const result = event.matchResult || {};
  const challenger = event.challenger || {};
  const orgName = event.orgName || '他団体';
  const won = result.winner === 'left';  // player won
  const upperUrl = challenger.id ? getUpperUrl(challenger.id) : '';
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a1a14';
  const cOvr = challenger.pw ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5) : '?';

  // 元コードのセリフデータを優先:
  //   敵が負けた → BITTER_RESOLUTION_LINES.loser (恨み)
  //   敵が勝った → WAR_POST_DIALOGUE.result_win (勝利宣言)
  let challengerLine;
  if (won) {
    challengerLine = (typeof pickDialogueLine === 'function' && typeof BITTER_RESOLUTION_LINES !== 'undefined')
      ? (pickDialogueLine(BITTER_RESOLUTION_LINES.loser, challenger) || '……この借り、必ず返してやる')
      : '……この借り、必ず返してやる';
  } else {
    challengerLine = (typeof WAR_POST_DIALOGUE !== 'undefined' && typeof pickDialogueLine === 'function')
      ? (pickDialogueLine(WAR_POST_DIALOGUE.result_win, challenger) || '……どうだ、これが実力の差だ')
      : '……どうだ、これが実力の差だ';
  }

  const speechVariant = won ? 'resentment' : 'danger';
  const headerTitle   = won ? '😠 敵 陣 の 反 応' : '😤 敵 の 勝 利 宣 言';
  const reporterLine  = won
    ? `${orgName}側は怒りを隠せない様子です…`
    : `${orgName}側は勝利を誇示しています`;
  const observationText = won
    ? `${orgName}との<span class="marker danger">因縁</span>は、まだ終わっていない。`
    : `${orgName}の<span class="marker danger">挑発</span>に、どう応えるか——`;

  return `
    <div class="mdl-a-header danger">
      <div class="mdl-a-header-title">${headerTitle}</div>
      <div class="mdl-a-header-meta">OPPONENT AFTERMATH ・ 2 / 2</div>
    </div>
    ${_mdlAReporterStrip(state, reporterLine)}
    <div class="mdl-a-subject-stage defeat" style="padding-top:96px">
      <div class="mdl-a-portrait-wrap">
        <div class="mdl-a-speech-pending">…</div>
        <div class="mdl-a-speech ${speechVariant} delayed">
          <div class="mdl-a-speech-speaker">${(challenger.name || '???').toUpperCase()}</div>
          <div class="mdl-a-speech-text">${challengerLine}</div>
        </div>
        <div class="mdl-a-subject-portrait defeat" style="${portraitStyle}"></div>
      </div>
      <div style="margin-top:12px"><div class="mdl-a-defeat-badge">${won ? 'DEFEATED ・ 敗 者' : 'VICTOR ・ 勝 者'}</div></div>
      <div class="mdl-a-subject-name" style="color:rgba(232,220,200,0.85)">${challenger.name || '???'}</div>
      <div class="mdl-a-subject-org" style="color:rgba(200,180,150,0.7)">${orgName} ・ OVR ${cOvr}</div>
      <div class="mdl-a-observation" style="color:rgba(232,220,200,0.8);font-size:13px;margin-top:16px">
        ${observationText}
      </div>
    </div>
    <div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" data-choice="0">— 見 届 け る —</button>
    </div>`;
}

// ── B3 VS対峙画面 (showResultOverlay) ─────────────────────────────────────
function _renderB3MatchPreview(event, playerFighter, challenger) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const orgName = event.orgName || '他団体';
  const orgCfg = RIVAL_ORGS.find(o => o.id === event.orgId) || { color: '#e74c3c', emoji: '' };
  const eColor = orgCfg.color;
  const eLight = _lightenColor(eColor);
  const pColor = '#74b9ff';
  const ovrL = Engine.util.ov(playerFighter), ovrR = Engine.util.ov(challenger);
  const standL = getStandUrl(playerFighter.id, ovrL), standR = getStandUrl(challenger.id, ovrR);
  const lineL = pickDialogueLine(PPV_OPPONENT_LINES, playerFighter);
  const lineR = pickDialogueLine(PPV_OPPONENT_LINES, challenger);

  let html = `<div style="text-align:center;padding:8px 0 4px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:6px;color:#aaa">Challenge Match</div>
    <div style="font-size:20px;font-weight:700;letter-spacing:4px;color:#e8e0d0">⚔️ 挑 戦 状</div>
    <div style="font-size:12px;color:var(--text-sub);margin-top:4px">${orgName}からの挑戦を受けて立つ</div>
  </div>`;

  // セリフ吹き出し
  if (lineL || lineR) {
    html += `<div class="mc-dl">`;
    if (lineL) html += `<div class="mc-dlc left"><div class="mc-dlb"><div class="mc-dlsp" style="color:#3498db">${playerFighter.name}</div>「${lineL}」</div></div>`;
    if (lineR) html += `<div class="mc-dlc right"><div class="mc-dlb"><div class="mc-dlsp" style="color:${eColor}">${challenger.name}</div>「${lineR}」</div></div>`;
    html += `</div>`;
  }

  // スタンド画像対峙
  html += `<div class="mc-va">
    <div class="mc-fc left">
      <div class="mc-fi">
        <div class="mc-fn">${playerFighter.name}</div>
        <div class="mc-fo" style="color:${pColor}">${G.orgName || 'プレイヤー団体'}</div>
        <div class="mc-fol">OVR</div>
        <div class="mc-fov" style="background:linear-gradient(180deg,${pColor},#3498db);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrL}</div>
      </div>
      <div class="mc-fp">${standL ? `<img src="${standL}" alt="" onerror="this.style.display='none'">` : ''}</div>
    </div>
    <div class="mc-vsf">
      <div class="mc-vst" style="background:linear-gradient(180deg,#fff,#aaa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(200,190,170,0.15))">VS</div>
    </div>
    <div class="mc-fc right">
      <div class="mc-fp">${standR ? `<img src="${standR}" alt="" onerror="this.style.display='none'">` : ''}</div>
      <div class="mc-fi">
        <div class="mc-fn">${challenger.name}</div>
        <div class="mc-fo" style="color:${eLight}">${orgCfg.emoji || ''} ${orgName}</div>
        <div class="mc-fol">OVR</div>
        <div class="mc-fov" style="background:linear-gradient(180deg,${eLight},${eColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrR}</div>
      </div>
    </div>
  </div>`;

  // 能力値対比バー
  html += `<div class="mc-stats">`;
  html += _warStatRow('PW', playerFighter.pw||0, challenger.pw||0, 'pw', pColor, eLight);
  html += _warStatRow('SP', playerFighter.sp||0, challenger.sp||0, 'sp', pColor, eLight);
  html += _warStatRow('TE', playerFighter.te||0, challenger.te||0, 'te', pColor, eLight);
  html += _warStatRow('ST', playerFighter.st||0, challenger.st||0, 'st', pColor, eLight);
  html += _warStatRow('MN', playerFighter.mn||0, challenger.mn||0, 'mn', pColor, eLight);

  // トレイト
  const pTraits = (playerFighter.traits || []).slice(0, 3);
  const cTraits = (challenger.traits || []).slice(0, 3);
  if (pTraits.length || cTraits.length) {
    html += `<div class="mc-traits" style="padding-left:0;padding-right:0;margin-top:4px">
      <div class="mc-ts left">${pTraits.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
      <div class="mc-tdiv"></div>
      <div class="mc-ts right">${cTraits.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
    </div>`;
  }
  html += `</div>`;

  // ボタン
  html += `<div class="mc-act">
    <button class="mc-bw" style="border:2px solid ${eColor};background:linear-gradient(135deg,${_rgba(eColor,0.15)},${_rgba(eColor,0.03)})" onclick="App.b3WatchMatch()">🎬 試合を観る</button>
    <button class="mc-bs" onclick="App.b3SkipMatch()">≫ スキップ</button>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── B3 試合結果画面 (Pattern B: pb-container) ──────────────────────────────────
function _renderB3MatchResult(event, matchResult, playerFighter, challenger) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const orgName = event.orgName || '他団体';
  const orgCfg = RIVAL_ORGS.find(o => o.id === event.orgId) || { color: '#e74c3c', emoji: '' };
  const eColor = orgCfg.color;
  const won = matchResult.winner === 'left';
  const draw = matchResult.winner === 'draw';
  const winChar = won ? playerFighter : challenger;
  const loseChar = won ? challenger : playerFighter;

  const leftCls = draw ? 'is-draw' : (won ? 'is-winner' : 'is-loser');
  const rightCls = draw ? 'is-draw' : (won ? 'is-loser' : 'is-winner');

  // セリフ
  let winLine = '', loseLine = '';
  if (!draw) {
    winLine = pickDialogueLine(RIVALRY_MATCH_REACTION.winnerLines, winChar);
    if (won) {
      // 自団体が勝ち → 挑戦者（敗者）に result_lose を使う
      loseLine = typeof WAR_POST_DIALOGUE !== 'undefined' ? pickDialogueLine(WAR_POST_DIALOGUE.result_lose, challenger) : '';
    } else {
      // 自団体が負け → 自団体選手（敗者）に loserLines を使う
      loseLine = pickDialogueLine(RIVALRY_MATCH_REACTION.loserLines, loseChar);
    }
  }
  const playerLine = won ? winLine : loseLine;
  const challengerLine = won ? loseLine : winLine;
  const hasDialogue = !!(playerLine || challengerLine);

  // verdict
  let verdictLabel, verdictColor;
  if (draw) { verdictLabel = '⚖ DRAW'; verdictColor = 'var(--c-warning)'; }
  else if (won) { verdictLabel = '🏆 WIN'; verdictColor = 'var(--gold)'; }
  else { verdictLabel = '💀 LOSE'; verdictColor = 'var(--c-negative)'; }

  let winnerLabel;
  if (draw) winnerLabel = 'DRAW';
  else winnerLabel = `🏆 ${escHtml(winChar.name)} WIN`;

  const playerOrgName = G.orgName || 'プレイヤー団体';

  let html = `<div class="pb-container" style="--pb-enemy-color:${eColor}">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-b3">⚔ CHALLENGE MATCH</div>
    <div class="pb-banner-title is-b3">挑 戦 状 — 結 果</div>
    <div class="pb-banner-sub">${escHtml(playerOrgName)}<span class="dot">·</span>vs<span class="dot">·</span>${escHtml(orgCfg.emoji || '')} ${escHtml(orgName)}</div>
  </div>`;

  // Scoreboard 4: Opponent / Verdict / MQ / Finish
  html += `<div class="pb-score-strip" style="grid-template-columns:1.2fr 1fr 1fr 1.2fr">
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:${eColor};font-size:16px">${escHtml(orgName)}</div>
      <div class="pb-score-lbl">Opponent</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:${verdictColor};font-size:20px">${verdictLabel}</div>
      <div class="pb-score-lbl">Result</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(matchResult.mq || 0)}</div>
      <div class="pb-score-val" style="margin-top:3px">${matchResult.mq || 0}</div>
      <div class="pb-score-lbl">MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="font-size:14px;color:var(--stage-text-main)">${escHtml(Engine.formatFinish(matchResult.finType, matchResult.finMove))}</div>
      <div class="pb-score-lbl">Finish</div>
    </div>
  </div>`;

  // 試合行 1つ (is-main is-b3)
  html += `<div class="pb-matches">`;
  html += `<div class="pb-divider is-main">⚔ CHALLENGE MATCH</div>`;

  const leftBlock = _pbFighterBlock('left', playerFighter, leftCls, playerOrgName, playerLine)
    .replace('pb-fighter is-left', 'pb-fighter is-left is-player-side');
  const rightBlock = _pbFighterBlock('right', challenger, rightCls, orgName, challengerLine)
    .replace('pb-fighter is-right', 'pb-fighter is-right is-enemy-side');

  html += `<div class="pb-mrow is-main is-b3${hasDialogue ? ' has-dialogue' : ''}">`;
  html += leftBlock;
  html += _pbResultColumn({
    winnerLabel,
    winnerIsDraw: draw,
    finishText: Engine.formatFinish(matchResult.finType, matchResult.finMove),
    turns: matchResult.turns || 0,
    mq: matchResult.mq || 0
  });
  html += rightBlock;
  if (matchResult.hpLeft && matchResult.hpRight) html += _pbHpMini(matchResult.hpLeft, matchResult.hpRight);
  html += `</div>`;
  html += `</div>`; // .pb-matches

  // Footer
  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.closeB3Result()">了解</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── B2 VS対峙画面 (showResultOverlay) ─────────────────────────────────────
function _renderB2MatchPreview(event, f1, f2, interventionChoice) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const ovrL = Engine.util.ov(f1), ovrR = Engine.util.ov(f2);
  const standL = getStandUrl(f1.id, ovrL), standR = getStandUrl(f2.id, ovrR);
  const lineL = pickDialogueLine(PPV_OPPONENT_LINES, f1);
  const lineR = pickDialogueLine(PPV_OPPONENT_LINES, f2);
  const pColor = '#9b59b6'; // 紫
  const eColor = '#e74c3c'; // 赤
  const pLight = '#c39bd3';
  const eLight = '#f1948a';

  let html = `<div style="text-align:center;padding:8px 0 4px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:6px;color:#aaa">Conflict Resolution</div>
    <div style="font-size:20px;font-weight:700;letter-spacing:4px;color:#e8e0d0">💥 決 着 の 試 合</div>
  </div>`;

  // 介入バフ表示
  if (interventionChoice === 0) {
    html += `<div style="text-align:center;font-size:12px;color:#2ecc71;margin:4px 0 8px">🤫 ${f1.name}を激励済み（OVR+5バフ）</div>`;
  } else if (interventionChoice === 1) {
    html += `<div style="text-align:center;font-size:12px;color:#2ecc71;margin:4px 0 8px">🤫 ${f2.name}を激励済み（OVR+5バフ）</div>`;
  }

  // セリフ吹き出し
  if (lineL || lineR) {
    html += `<div class="mc-dl">`;
    if (lineL) html += `<div class="mc-dlc left"><div class="mc-dlb"><div class="mc-dlsp" style="color:${pColor}">${f1.name}</div>「${lineL}」</div></div>`;
    if (lineR) html += `<div class="mc-dlc right"><div class="mc-dlb"><div class="mc-dlsp" style="color:${eColor}">${f2.name}</div>「${lineR}」</div></div>`;
    html += `</div>`;
  }

  // スタンド画像対峙
  html += `<div class="mc-va">
    <div class="mc-fc left">
      <div class="mc-fi">
        <div class="mc-fn">${f1.name}</div>
        <div class="mc-fol">OVR</div>
        <div class="mc-fov" style="background:linear-gradient(180deg,${pLight},${pColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrL}</div>
      </div>
      <div class="mc-fp">${standL ? `<img src="${standL}" alt="" onerror="this.style.display='none'">` : ''}</div>
    </div>
    <div class="mc-vsf">
      <div class="mc-vst" style="background:linear-gradient(180deg,#fff,#aaa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(200,190,170,0.15))">VS</div>
    </div>
    <div class="mc-fc right">
      <div class="mc-fp">${standR ? `<img src="${standR}" alt="" onerror="this.style.display='none'">` : ''}</div>
      <div class="mc-fi">
        <div class="mc-fn">${f2.name}</div>
        <div class="mc-fol">OVR</div>
        <div class="mc-fov" style="background:linear-gradient(180deg,${eLight},${eColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrR}</div>
      </div>
    </div>
  </div>`;

  // 能力値対比バー
  html += `<div class="mc-stats">`;
  html += _warStatRow('PW', f1.pw||0, f2.pw||0, 'pw', pLight, eLight);
  html += _warStatRow('SP', f1.sp||0, f2.sp||0, 'sp', pLight, eLight);
  html += _warStatRow('TE', f1.te||0, f2.te||0, 'te', pLight, eLight);
  html += _warStatRow('ST', f1.st||0, f2.st||0, 'st', pLight, eLight);
  html += _warStatRow('MN', f1.mn||0, f2.mn||0, 'mn', pLight, eLight);

  // トレイト
  const t1 = (f1.traits || []).slice(0, 3);
  const t2 = (f2.traits || []).slice(0, 3);
  if (t1.length || t2.length) {
    html += `<div class="mc-traits" style="padding-left:0;padding-right:0;margin-top:4px">
      <div class="mc-ts left">${t1.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
      <div class="mc-tdiv"></div>
      <div class="mc-ts right">${t2.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
    </div>`;
  }
  html += `</div>`;

  // ボタン
  html += `<div class="mc-act">
    <button class="mc-bw" style="border:2px solid ${eColor};background:linear-gradient(135deg,rgba(155,89,182,0.15),rgba(231,76,60,0.03))" onclick="App.b2WatchMatch()">🎬 試合を観る</button>
    <button class="mc-bs" onclick="App.b2SkipMatch()">≫ スキップ</button>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── B2 試合結果画面 (Pattern B: pb-container) ──────────────────────────────────
function _renderB2MatchResult(event, matchResult, f1, f2, interventionChoice) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const draw = matchResult.winner === 'draw';
  const won1 = matchResult.winner === 'left';
  const winChar = won1 ? f1 : f2;
  const loseChar = won1 ? f2 : f1;

  const leftCls = draw ? 'is-draw' : (won1 ? 'is-winner' : 'is-loser');
  const rightCls = draw ? 'is-draw' : (won1 ? 'is-loser' : 'is-winner');

  let winLine = '', loseLine = '';
  if (!draw) {
    winLine = pickDialogueLine(RIVALRY_MATCH_REACTION.winnerLines, winChar);
    loseLine = pickDialogueLine(RIVALRY_MATCH_REACTION.loserLines, loseChar);
  }
  const f1Line = draw ? '' : (won1 ? winLine : loseLine);
  const f2Line = draw ? '' : (won1 ? loseLine : winLine);
  const hasDialogue = !!(f1Line || f2Line);

  let verdictLabel, verdictColor;
  if (draw) { verdictLabel = '⚖ DRAW'; verdictColor = 'var(--c-warning)'; }
  else { verdictLabel = `🏆 ${escHtml(winChar.name)}`; verdictColor = 'var(--gold)'; }

  let winnerLabel;
  if (draw) winnerLabel = 'DRAW';
  else winnerLabel = `🏆 ${escHtml(winChar.name)} WIN`;

  // 介入ラベル
  let interventionLabel = '放置（介入なし）';
  if (interventionChoice === 0) interventionLabel = `🤫 ${f1.name}を激励`;
  else if (interventionChoice === 1) interventionLabel = `🤫 ${f2.name}を激励`;

  // 関係性変動 (ビジュアル向け簡略表記)
  const intensePenalty = interventionChoice !== 2 && ((interventionChoice === 0 && !won1) || (interventionChoice === 1 && won1));
  const relationText = draw ? '互いに認め合う' : (intensePenalty ? '深い亀裂' : '小さな揺らぎ');

  let html = `<div class="pb-container">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-b2">💥 CONFLICT RESOLUTION</div>
    <div class="pb-banner-title is-b2">決 着 の 試 合 — 結 果</div>
    <div class="pb-banner-sub">${escHtml(f1.name)}<span class="dot">·</span>vs<span class="dot">·</span>${escHtml(f2.name)}</div>
  </div>`;

  // 介入選択バナー
  if (interventionChoice === 0 || interventionChoice === 1) {
    html += `<div class="pb-b2-intervention">${escHtml(interventionLabel)}（OVR+5バフ適用）</div>`;
  }

  // Scoreboard 4: Intervention / Verdict / MQ / Bond/Rivalry 変動
  html += `<div class="pb-score-strip" style="grid-template-columns:1.3fr 1.2fr 1fr 1.2fr">
    <div class="pb-score-cell">
      <div class="pb-score-val" style="font-size:13px;color:var(--stage-text-main)">${interventionChoice === 2 ? '放置' : (interventionChoice === 0 ? `${escHtml(f1.name)}激励` : `${escHtml(f2.name)}激励`)}</div>
      <div class="pb-score-lbl">Intervention</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:${verdictColor};font-size:18px">${verdictLabel}</div>
      <div class="pb-score-lbl">Result</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(matchResult.mq || 0)}</div>
      <div class="pb-score-val" style="margin-top:3px">${matchResult.mq || 0}</div>
      <div class="pb-score-lbl">MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="font-size:13px;color:var(--c-rivalry)">${escHtml(relationText)}</div>
      <div class="pb-score-lbl">Relationship</div>
    </div>
  </div>`;

  // 試合行
  html += `<div class="pb-matches">`;
  html += `<div class="pb-divider is-main">💥 CONFLICT — 決着の試合</div>`;
  html += `<div class="pb-mrow is-main is-b2${hasDialogue ? ' has-dialogue' : ''}">`;
  html += _pbFighterBlock('left', f1, leftCls, f1.style || '—', f1Line);
  html += _pbResultColumn({
    winnerLabel,
    winnerIsDraw: draw,
    finishText: Engine.formatFinish(matchResult.finType, matchResult.finMove),
    turns: matchResult.turns || 0,
    mq: matchResult.mq || 0
  });
  html += _pbFighterBlock('right', f2, rightCls, f2.style || '—', f2Line);
  if (matchResult.hpLeft && matchResult.hpRight) html += _pbHpMini(matchResult.hpLeft, matchResult.hpRight);
  html += `</div>`;
  html += `</div>`; // .pb-matches

  // 対立解決サマリー (質的表現、数値非表示 — CLAUDE.md 数値哲学)
  html += `<div class="pb-b2-resolution">
    <div class="pb-b2-resolution-label">💭 対立解決</div>`;
  if (!draw) {
    html += `<div class="pb-b2-resolution-row"><span class="icon" style="color:var(--c-positive)">✅</span><span><b>${escHtml(winChar.name)}</b>：信頼が大きく上がり、気持ちにも張りが戻った</span></div>`;
    html += `<div class="pb-b2-resolution-row"><span class="icon" style="color:var(--c-negative)">❌</span><span><b>${escHtml(loseChar.name)}</b>：${intensePenalty ? '信頼が大きく揺らぎ、わだかまりを残した' : '信頼がわずかに揺らいだが、気持ちは立て直している'}</span></div>`;
  } else {
    html += `<div class="pb-b2-resolution-row"><span class="icon">🤝</span><span><b>${escHtml(f1.name)}</b>：互いに力を認め合い、信頼が少し上がった</span></div>`;
    html += `<div class="pb-b2-resolution-row"><span class="icon">🤝</span><span><b>${escHtml(f2.name)}</b>：互いに力を認め合い、信頼が少し上がった</span></div>`;
  }
  html += `</div>`;

  // Footer
  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.closeB2Result()">了解</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── B4: メディア密着取材 / タレント活動 ────────────────────────────────────
function _buildB4Modal(event, state, roster) {
  const activityType = event.activityType;
  const subType = event.subType || 'youngStar';
  const champId = state.titles?.world?.championId;

  // 基本フィルタ: 怪我なし ＆ レンタルでない
  let available = roster.filter(f => !f.injury && !f.isRental);

  // 既存spotlight: サブタイプ別フィルタ
  if (!activityType) {
    switch (subType) {
      case 'youngStar':
        available = available.filter(f => (f.age || 17) <= 22);
        break;
      case 'ace': {
        const ovrSorted = available.slice().sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
        const top3Ids = new Set(ovrSorted.slice(0, 3).map(f => f.id));
        available = available.filter(f => f.id === champId || top3Ids.has(f.id));
        break;
      }
      case 'veteran':
        available = available.filter(f => (f.age || 17) >= 26 || (f.careerSeasons || 0) >= 5);
        break;
    }
  }

  // フォールバック: 候補0人なら全員（レンタル除外のみ）
  if (available.length === 0) {
    available = roster.filter(f => !f.injury && !f.isRental);
  }

  const outletName = event.outletName || 'メディア';

  if (activityType && typeof TALENT_ACTIVITY_LABELS !== 'undefined') {
    // 新タレント活動モーダル
    const icon = TALENT_ACTIVITY_ICONS[activityType] || '🎤';
    const label = TALENT_ACTIVITY_LABELS[activityType] || 'タレント活動';

    let html = `<div class="care-title" style="border-bottom:1px solid #3498db;padding-bottom:10px;margin-bottom:12px">${icon} ${outletName}からの${label}オファー</div>`;

    if (event.detail) {
      html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:10px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${event.detail}</div>`;
    }

    // 効果説明
    const effectDesc = {
      cm: 'メディア収入がアップします',
      gravure: 'グッズ収入がアップします',
      variety: 'メディア収入がアップします',
      brand: 'グッズ収入がアップします（2週間）',
      fashion: '人気が即座にアップします',
      fan: '信頼度が即座にアップします',
    };
    html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">
      参加する選手を選んでください。${effectDesc[activityType] || ''}
    </div>`;

    // 推薦ヒント（相性○の選手を最大2名表示）
    const recommendations = available
      .map(f => ({ f, mult: Engine.eventSystem.calcTalentMultiplier(f, activityType) }))
      .filter(x => x.mult >= 1.4)
      .sort((a, b) => (b.f.popularity || 1) - (a.f.popularity || 1))
      .slice(0, 2)
      .map(x => x.f.name);

    if (recommendations.length > 0) {
      html += `<div style="font-size:11px;color:#f1c40f;margin-bottom:10px;padding:6px 8px;background:rgba(241,196,15,0.08);border-radius:4px;border:1px solid rgba(241,196,15,0.2)">
        💡 おすすめ：${recommendations.join('、')}
      </div>`;
    }

    html += '<div class="large-evt-roster-grid">';
    available.forEach(f => {
      const ovr = Engine.util.ov(f);
      const pop = Math.round(f.popularity || 0);
      const face = portraitImg(f.id, 72, '');
      const mult = Engine.eventSystem.calcTalentMultiplier(f, activityType);
      const compatTag = mult >= 1.4 ? '<span style="color:#f1c40f;font-size:9px"> ★適性◎</span>'
        : mult <= 0.6 ? '<span style="color:#e74c3c;font-size:9px"> △苦手</span>' : '';
      html += `<div class="large-evt-fighter-pick" data-fighter-id="${f.id}">
        ${face}
        <div style="font-size:11px;font-weight:600;margin-top:2px">${f.name}${compatTag}</div>
        <div style="font-size:10px;color:var(--text-dim)">OVR ${ovr} / 人気 ${pop}</div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  // 既存spotlight表示
  const subTypeLabels = { youngStar: '若手特集', ace: 'エース密着', veteran: 'ベテラン特集' };
  const subLabel = subTypeLabels[subType] || '密着取材';

  let html = `<div class="care-title" style="border-bottom:1px solid #3498db;padding-bottom:10px;margin-bottom:12px">📺 ${outletName}からの${subLabel}オファー</div>`;

  if (event.detail) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:10px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${event.detail}</div>`;
  }

  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px">
    推薦する選手を選んでください。取材期間中（3興行）にいい試合を見せれば、大きな注目が集まります。
  </div>`;

  html += '<div class="large-evt-roster-grid">';
  available.forEach(f => {
    const ovr = Engine.util.ov(f);
    const pop = Math.round(f.popularity || 0);
    const face = portraitImg(f.id, 72, '');
    html += `<div class="large-evt-fighter-pick" data-fighter-id="${f.id}">
      ${face}
      <div style="font-size:11px;font-weight:600;margin-top:2px">${f.name}</div>
      <div style="font-size:10px;color:var(--text-dim)">OVR ${ovr} / 人気 ${pop}</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: ケアリアクション ポップアップ — 選手顔+セリフをトーストで表示
// ─────────────────────────────────────────────────────────────────────────────
function _showCareReaction(fighter, text, changes = [], cost = 0, remainingFunds = 0) {
  if (!fighter || !text) return;
  const overlay = document.getElementById('careModalOverlay');
  const box = document.getElementById('careModalBox');
  if (!overlay || !box) { showToast(text); return; }

  const isPremium = cost >= 100;
  const face = portraitImg(fighter.id, 120, 'care-modal-face');

  let changesHtml = '';
  if (changes && changes.length > 0) {
    changesHtml = '<div class="care-modal-changes">';
    changes.forEach(c => {
      if (c.text !== undefined) {
        changesHtml += `<div class="care-modal-change"><span class="care-modal-change-label">${c.emoji || ''} ${c.label}</span><span class="care-modal-change-value care-modal-change-up">${c.text}</span></div>`;
      } else {
        const bef = _fmtStat(c.before), aft = _fmtStat(c.after);
        const diff = aft - bef;
        const cls = diff >= 0 ? 'care-modal-change-up' : 'care-modal-change-down';
        changesHtml += `<div class="care-modal-change"><span class="care-modal-change-label">${c.emoji || ''} ${c.label}</span><span class="care-modal-change-value ${cls}">${bef} → ${aft}</span></div>`;
      }
    });
    changesHtml += '</div>';
  }

  const costHtml = cost > 0 ? `<div class="care-modal-cost">-${cost}万（残金: ${Math.round(remainingFunds).toLocaleString()}万）</div>` : '';

  box.className = `care-modal-box${isPremium ? ' care-premium' : ''}`;
  box.innerHTML = `
    ${face}
    <div class="care-modal-name">${fighter.name}</div>
    <div class="care-modal-speech">「${text}」</div>
    ${changesHtml}
    ${costHtml}
    <button class="care-modal-btn" onclick="closeCareModal()">OK</button>
  `;
  overlay.classList.add('active');
  clearTimeout(window._careModalTimer);
  window._careModalTimer = setTimeout(closeCareModal, 60000);
}

function closeCareModal() {
  const overlay = document.getElementById('careModalOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(window._careModalTimer);
  _drainPopupQueue();
}

function showNotifEventToast(event) {
  if (!event) return;
  if (_isPopupActive()) { _popupQueue.push(() => showNotifEventToast(event)); return; }
  if (!document.getElementById('mdlDOverlay')) { showToast(event.text || ''); return; }

  const isWarning = event.type === 'N5'
    || event.type === 'N_isolation'
    || event.type === 'N_coach_report'
    || event.type === 'N_sudden_departure'
    || event.type === 'N_scandal'
    || event.type === 'N_pre_window';

  const f1Id = event.fighter;
  const f2Id = event.fighter2;
  const _fUrl = id => (typeof getPortraitUrl === 'function' ? getPortraitUrl(id) : '');
  let portraitsHtml = '';
  if (f1Id != null && f2Id != null) {
    portraitsHtml = `<div style="display:flex;gap:12px;justify-content:center;margin-bottom:10px">
      <div class="mdl-d-face" style="background-image:url('${_fUrl(f1Id)}');width:52px;height:52px;margin:0"></div>
      <div class="mdl-d-face" style="background-image:url('${_fUrl(f2Id)}');width:52px;height:52px;margin:0"></div>
    </div>`;
  } else if (f1Id != null) {
    portraitsHtml = `<div class="mdl-d-face" style="background-image:url('${_fUrl(f1Id)}')"></div>`;
  }

  const textHtml    = event.text     ? `<div class="mdl-d-body">${event.text}</div>`         : '';
  const detailHtml  = event.detail   ? `<div class="mdl-d-detail">${event.detail}</div>`     : '';
  const dialogueHtml = event.dialogue ? `<div class="mdl-d-body italic">${event.dialogue}</div>` : '';

  const box = document.getElementById('mdlDBox');
  if (box) box.className = 'mdl-d-box' + (isWarning ? ' urgent' : '');
  _mdlDOpen(`
    ${portraitsHtml}
    ${textHtml}
    ${detailHtml}
    ${dialogueHtml}
    <div class="mdl-d-actions">
      <button class="mdl-d-btn primary" onclick="_mdlDClose();clearTimeout(window._notifModalTimer);_drainPopupQueue()">OK</button>
    </div>
  `);
  Audio.play('event');
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(() => { _mdlDClose(); _drainPopupQueue(); }, 60000);
}

function closeNotifModal() {
  const _nmOverlay = document.getElementById('notifModalOverlay');
  if (_nmOverlay) _nmOverlay.classList.remove('active');
  clearTimeout(window._notifModalTimer);
  _glimpseQueue.shift();
  if (_glimpseQueue.length > 0) {
    setTimeout(_renderNextGlimpse, 200);
  } else if (_matchDialogueQueue.length > 0) {
    setTimeout(_renderNextMatchDialogue, 200);
  } else {
    _drainPopupQueue();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 試合後コメントポップアップ（因縁マッチ）
// ─────────────────────────────────────────────────────────────────────────────
const _matchDialogueQueue = [];

function showPostMatchDialogues(dialogues) {
  if (!dialogues || dialogues.length === 0) return;
  dialogues.forEach(d => _matchDialogueQueue.push(d));
  if (_matchDialogueQueue.length === dialogues.length) {
    _enqueuePopup(() => _renderNextMatchDialogue());
  }
}

function _renderNextMatchDialogue() {
  if (_matchDialogueQueue.length === 0) return;
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { _matchDialogueQueue.shift(); return; }
  const d = _matchDialogueQueue[0];

  const rb = d.rivalryBonus || {};
  const rivalryColor = rb.color || '#e17055';

  box.className = 'notif-modal-box';
  box.innerHTML = `
    <div class="notif-modal-text" style="color:${rivalryColor}">${d.matchLabel || ''} ${rb.emoji || '🔥'}${rb.label || '因縁'}</div>
    <div class="notif-modal-portraits">
      <div class="notif-modal-face dual">${portraitImg(d.winnerId, 100)}</div>
      <div class="notif-modal-face dual">${portraitImg(d.loserId, 100)}</div>
    </div>
    <div class="notif-modal-text">${d.winnerName}「${d.winLine}」</div>
    <div class="notif-modal-detail">${d.loserName}「${d.loseLine}」</div>
    <button class="notif-modal-btn" onclick="closeMatchDialogue()">OK</button>
  `;
  overlay.classList.add('active');
  Audio.play('event');
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeMatchDialogue, 60000);
}

function closeMatchDialogue() {
  const _nmOverlay = document.getElementById('notifModalOverlay');
  if (_nmOverlay) _nmOverlay.classList.remove('active');
  clearTimeout(window._notifModalTimer);
  _matchDialogueQueue.shift();
  if (_matchDialogueQueue.length > 0) {
    setTimeout(_renderNextMatchDialogue, 200);
  } else {
    _drainPopupQueue();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// P4-P6: Glimpse（心の垣間見え）モーダル表示
// ─────────────────────────────────────────────────────────────────────────────
const _glimpseQueue = [];

// Tier 1（リッチモーダル）か判定: gold/danger tone A層 + rivalry_50_up dramatic → Tier 1
function _isGlimpseTier1(glimpse) {
  if (glimpse.layer === 'A') {
    if (glimpse.tone === 'gold' || glimpse.tone === 'danger') return true;
    if (glimpse.type === 'rivalry_50_up') return true;
    return false;
  }
  // B層: すべて Tier 2
  return false;
}

function showGlimpseAModal(glimpse, opts) {
  _glimpseQueue.push({ ...glimpse, _renderer: 'A' });
  if (_glimpseQueue.length === 1) {
    _enqueuePopup(() => _renderNextGlimpse(), opts && opts.allowWhileShowResult ? { ignoreShowResultOverlay: true } : undefined);
  }
}

function showGlimpseBModal(glimpse, opts) {
  _glimpseQueue.push({ ...glimpse, _renderer: 'B' });
  if (_glimpseQueue.length === 1) {
    _enqueuePopup(() => _renderNextGlimpse(), opts && opts.allowWhileShowResult ? { ignoreShowResultOverlay: true } : undefined);
  }
}

function _renderNextGlimpse() {
  if (_glimpseQueue.length === 0) return;
  const g = _glimpseQueue[0];
  if (g._renderer === 'A') _renderGlimpseA(g);
  else _renderGlimpseB(g);
}

function _renderGlimpseA(glimpse) {
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { _glimpseQueue.shift(); return; }

  const toneCls = glimpse.tone === 'gold' ? ' notif-gold'
    : glimpse.tone === 'warning' || glimpse.tone === 'danger' ? ' notif-warning' : '';
  box.className = `notif-modal-box${toneCls}`;

  let portraitsHtml = '';
  let labelHtml = '';
  if (glimpse.targetId) {
    const axisIcon = glimpse.axis === 'rivalry' ? '⚡' : glimpse.tone === 'negative' ? '💔' : '💙';
    const axisColor = glimpse.axis === 'rivalry' ? '#e17055' : glimpse.tone === 'negative' ? '#e74c3c' : '#74b9ff';
    portraitsHtml = `
      <div class="notif-modal-portraits" style="align-items:flex-end">
        <div class="notif-modal-face dual">${portraitImg(glimpse.speakerId, 100)}</div>
        <span style="font-size:24px;padding-bottom:10px;filter:drop-shadow(0 0 5px ${axisColor})">${axisIcon}</span>
        <div class="notif-modal-face dual">${portraitImg(glimpse.targetId, 100)}</div>
      </div>`;
    labelHtml = `<div class="notif-modal-text" style="color:${axisColor}">${glimpse.speakerName} → ${glimpse.targetName}</div>
      <div class="notif-modal-detail">${glimpse.label}</div>`;
  } else {
    portraitsHtml = `
      <div class="notif-modal-portraits">
        <div class="notif-modal-face">${portraitImg(glimpse.speakerId, 120)}</div>
      </div>`;
    labelHtml = `<div class="notif-modal-text">${glimpse.speakerName} ・ ${glimpse.label}</div>`;
  }

  box.innerHTML = `
    ${portraitsHtml}
    ${labelHtml}
    <div class="notif-modal-dialogue">${glimpse.dialogue}</div>
    <button class="notif-modal-btn" onclick="closeNotifModal()">見届ける</button>
  `;
  overlay.classList.add('active');
  Audio.play(glimpse.tone === 'gold' ? 'award' : 'event');
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeNotifModal, 60000);
}

function _renderGlimpseB(glimpse) {
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { _glimpseQueue.shift(); return; }

  box.className = 'notif-modal-box';
  let portraitsHtml = '';
  let labelHtml = '';
  if (glimpse.targetId) {
    const axisIcon = glimpse.axis === 'rivalry' ? '⚡' : glimpse.tone === 'negative' ? '💔' : '💙';
    const axisColor = glimpse.axis === 'rivalry' ? '#e17055' : glimpse.tone === 'negative' ? '#e74c3c' : '#74b9ff';
    portraitsHtml = `
      <div class="notif-modal-portraits" style="align-items:flex-end">
        <div class="notif-modal-face dual">${portraitImg(glimpse.speakerId, 100)}</div>
        <span style="font-size:20px;padding-bottom:8px;filter:drop-shadow(0 0 4px ${axisColor})">${axisIcon}</span>
        <div class="notif-modal-face dual">${portraitImg(glimpse.targetId, 100)}</div>
      </div>`;
    labelHtml = `<div class="notif-modal-detail" style="color:${axisColor}">${glimpse.speakerName} → ${glimpse.targetName} ・ ${glimpse.label}</div>`;
  } else {
    portraitsHtml = `
      <div class="notif-modal-portraits">
        <div class="notif-modal-face">${portraitImg(glimpse.speakerId, 120)}</div>
      </div>`;
    labelHtml = `<div class="notif-modal-detail">${glimpse.speakerName} ・ ${glimpse.label}</div>`;
  }

  box.innerHTML = `
    ${portraitsHtml}
    ${labelHtml}
    <div class="notif-modal-dialogue">${glimpse.dialogue}</div>
    <button class="notif-modal-btn" onclick="closeNotifModal()">見届ける</button>
  `;
  overlay.classList.add('active');
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeNotifModal, 60000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2: バナーログフィードUI
// ─────────────────────────────────────────────────────────────────────────────
let _logFeedRotationTimer = null;
let _logFeedCurrentIndex = 0;

function refreshDojoLogFeed() {
  const feed = (typeof G !== 'undefined' && G.weekLogFeed) || [];
  const icon = document.querySelector('.dojo-log-feed-icon');
  if (!icon) return;

  // バッジ更新
  const badge = icon.querySelector('.dojo-log-feed-badge');
  if (badge) {
    if (feed.length > 0) {
      badge.textContent = feed.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // 吹き出しローテーション
  if (_logFeedRotationTimer) { clearInterval(_logFeedRotationTimer); _logFeedRotationTimer = null; }
  const bubble = document.querySelector('.dojo-log-feed-bubble');
  if (feed.length > 0) {
    _logFeedCurrentIndex = 0;
    _showLogFeedBubble(feed[0]);
    if (feed.length > 1) {
      _logFeedRotationTimer = setInterval(() => {
        _logFeedCurrentIndex = (_logFeedCurrentIndex + 1) % feed.length;
        _showLogFeedBubble(feed[_logFeedCurrentIndex]);
      }, 5000);
    }
  } else if (bubble) {
    bubble.style.display = 'none';
  }

  // パネルが開いていれば更新
  const panel = document.getElementById('logFeedPanel');
  if (panel && panel.style.display !== 'none') _renderLogFeedPanel();
}

function _showLogFeedBubble(log) {
  const bubble = document.querySelector('.dojo-log-feed-bubble');
  if (!bubble) return;
  let text = `「${log.dialogue}」`;
  if (log.targetName) text += ` → ${log.targetName}`;
  bubble.innerHTML = `${portraitImg(log.speakerId, 24, 'dojo-log-feed-face')}<span class="dojo-log-feed-text">${text}</span>`;
  bubble.style.display = 'flex';
  bubble.style.animation = 'none';
  void bubble.offsetWidth;
  bubble.style.animation = '';
}

function toggleLogFeedPanel() {
  const panel = document.getElementById('logFeedPanel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    _renderLogFeedPanel();
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}

function _renderLogFeedPanel() {
  const panel = document.getElementById('logFeedPanel');
  if (!panel) return;
  const feed = (typeof G !== 'undefined' && G.weekLogFeed) || [];
  const header = panel.querySelector('.log-feed-panel-header');
  const list = panel.querySelector('.log-feed-panel-list');
  if (header) header.textContent = `📋 今週の声（${feed.length}件）`;
  if (!list) return;

  if (feed.length === 0) {
    list.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:12px">今週は特に報告なし</div>';
    return;
  }

  const toneEmoji = { positive: '💙', negative: '💔', warning: '⚠️', calm: '😌', dramatic: '⚡' };
  list.innerHTML = feed.map(log => {
    const emoji = toneEmoji[log.tone] || '💭';
    const namesHtml = log.targetName
      ? `${log.speakerName} <span class="log-feed-item-arrow">→</span> ${log.targetName}`
      : log.speakerName;
    return `<div class="log-feed-item">
      <div class="log-feed-item-header">
        ${portraitImg(log.speakerId, 24, 'log-feed-item-face')}
        <span class="log-feed-item-names">${namesHtml}</span>
      </div>
      <div class="log-feed-item-label">${emoji} ${log.label}</div>
      <div class="log-feed-item-dialogue">「${log.dialogue}」</div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// 業界底上げ演出 — 1位達成翌シーズン開幕時の全画面演出 (v3: クリック送りカットイン)
// ─────────────────────────────────────────────────────────────────────────────

function showLeagueElevationCeremony(state, onDone) {
  const overlay = document.getElementById('awardsOverlay');

  // ── SE ヘルパー ──
  function _playFileSE(path, vol) {
    try { const a = new window.Audio(path); a.volume = vol != null ? vol : 0.5; a.play().catch(() => {}); } catch(e) {}
  }

  // ── 各団体データ ──
  const sOrg = RIVAL_ORGS[0], aOrg = RIVAL_ORGS[1], bOrg = RIVAL_ORGS[2];
  const sName = sOrg.name, sEmoji = sOrg.emoji, sColor = sOrg.color;
  const aName = aOrg.name, aEmoji = aOrg.emoji, aColor = aOrg.color;
  const bName = bOrg.name, bEmoji = bOrg.emoji, bColor = bOrg.color;

  // ── 各団体トップ3選手のアッパー画像 ──
  function _getTop3(orgData) {
    if (!orgData?.roster?.length) return [];
    return [...orgData.roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 3);
  }
  const top3S = _getTop3(state.aiOrgs?.org_s);
  const top3A = _getTop3(state.aiOrgs?.org_a);
  const top3B = _getTop3(state.aiOrgs?.org_b);
  function _upperSrc(f) { return f ? getUpperUrl(f.id) : ''; }
  // 3人重ね表示HTML: 中央=1位(160x240), 左=2位(130x195,少し後ろ), 右=3位(130x195,少し後ろ)
  function _buildTrioHtml(top3) {
    const c = top3[0], l = top3[1], r = top3[2];
    const cSrc = _upperSrc(c), lSrc = _upperSrc(l), rSrc = _upperSrc(r);
    return `<div class="le-trio">`
      + (lSrc ? `<img class="le-trio-side le-trio-left" src="${lSrc}" alt="" onerror="this.style.display='none'">` : '')
      + (cSrc ? `<img class="le-trio-center" src="${cSrc}" alt="" onerror="this.style.display='none'">` : '')
      + (rSrc ? `<img class="le-trio-side le-trio-right" src="${rSrc}" alt="" onerror="this.style.display='none'">` : '')
      + `</div>`;
  }

  // ── HTML ──
  overlay.innerHTML = `
    <div class="le-stage"><div class="le-pulse"></div><div class="le-spot l"></div><div class="le-spot r"></div></div>
    <div class="le-noise"></div>
    <div class="le-flash" id="leFlash"></div>
    <div class="le-click-area disabled" id="leClickArea"></div>
    <div class="le-click-hint" id="leClickHint"><span class="blink">▼</span> クリックで次へ</div>
    <div class="le-content" id="leContent" data-slide="1">
      <div class="le-slide-impact">
        <div class="le-impact-icon">⚡</div>
        <div class="le-impact-title">業界激震</div>
        <div class="le-impact-line"></div>
        <button class="le-btn" id="leNextBtn">次へ ▶</button>
      </div>
      <div class="le-slide-sequence">
        <div class="le-cutin-container">
          <div class="le-cutin from-left" id="leCutinS" style="--org-color:${sColor}">
            <div class="le-cutin-color"></div><div class="le-cutin-slash"></div>
            <div class="le-cutin-stand">${_buildTrioHtml(top3S)}</div>
            <div class="le-cutin-label">${orgIconHtml('org_s', 36)}<div class="le-cutin-label-name">${sName}</div><div class="le-cutin-label-grade">S級</div></div>
          </div>
          <div class="le-cutin from-right" id="leCutinA" style="--org-color:${aColor}">
            <div class="le-cutin-color"></div><div class="le-cutin-slash"></div>
            <div class="le-cutin-stand">${_buildTrioHtml(top3A)}</div>
            <div class="le-cutin-label">${orgIconHtml('org_a', 36)}<div class="le-cutin-label-name">${aName}</div><div class="le-cutin-label-grade">A級</div></div>
          </div>
          <div class="le-cutin from-left" id="leCutinB" style="--org-color:${bColor}">
            <div class="le-cutin-color"></div><div class="le-cutin-slash"></div>
            <div class="le-cutin-stand">${_buildTrioHtml(top3B)}</div>
            <div class="le-cutin-label">${orgIconHtml('org_b', 36)}<div class="le-cutin-label-name">${bName}</div><div class="le-cutin-label-grade">B級</div></div>
          </div>
        </div>
        <div class="le-narration-area">
          <div class="le-narr-line" id="leNarr0"></div>
          <div class="le-narr-line" id="leNarr1"></div>
          <div class="le-narr-line" id="leNarr2" style="margin-top:16px"></div>
          <div class="le-narr-line" id="leNarr3" style="margin-top:4px"></div>
          <div class="le-narr-line" id="leNarr4" style="margin-top:4px"></div>
        </div>
        <div class="le-closing-block">
          <div class="le-closing-text" id="leClosingText">もはや安泰の時代は終わった。<br><em>真の群雄割拠が始まる——</em></div>
          <button class="le-btn" id="leCloseBtn">続ける ▶</button>
        </div>
      </div>
    </div>
  `;
  overlay.classList.add('active');

  // ── ナレーションテキスト埋め込み ──
  document.getElementById('leNarr0').textContent = (state.orgName || '') + 'の凄まじい躍進は業界全体に衝撃を与えた。';
  document.getElementById('leNarr1').textContent = 'その影響は業界3団体の体制を大きく揺るがし、それぞれの団体は内部改革に動き出した。';

  const content   = document.getElementById('leContent');
  const flash     = document.getElementById('leFlash');
  const clickArea = document.getElementById('leClickArea');
  const clickHint = document.getElementById('leClickHint');

  // ── helpers ──
  function fireFlash() { flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire'); }
  function shake() { content.classList.remove('shake'); void content.offsetWidth; content.classList.add('shake'); }
  function showNarr(id) { document.getElementById(id).classList.add('visible'); }
  function hideNarr(id) { document.getElementById(id).classList.add('hide'); }
  function setNarr(id, text) {
    const el = document.getElementById(id);
    el.textContent = text; el.classList.add('visible', 'emphasis');
  }
  function clearNarr(id) { document.getElementById(id).classList.remove('visible', 'emphasis'); }
  function cutIn(id) {
    const el = document.getElementById(id);
    el.classList.remove('out', 'hold'); el.classList.add('active');
    setTimeout(() => { el.classList.remove('active'); el.classList.add('hold'); }, 400);
  }
  function cutOut(id) {
    const el = document.getElementById(id);
    el.classList.remove('active', 'hold'); el.classList.add('out');
  }

  // ── ステップ管理（クリック送り） ──
  let currentStep = -1;
  let locked = false;

  function unlock(delay) {
    setTimeout(() => {
      locked = false;
      if (currentStep < steps.length - 1) clickHint.classList.add('visible');
    }, delay || 400);
  }

  const steps = [
    // step 0: ナレーション1行目
    () => { showNarr('leNarr0'); unlock(600); },
    // step 1: ナレーション2行目
    () => { showNarr('leNarr1'); unlock(600); },
    // step 2: S級カットイン
    () => {
      _playFileSE('../bgm/b07_whiff_v4.mp3');
      fireFlash(); shake(); cutIn('leCutinS');
      setTimeout(() => setNarr('leNarr2', '王座奪還へ——全力の補強に動く'), 500);
      unlock(900);
    },
    // step 3: S級退場 → A級カットイン
    () => {
      cutOut('leCutinS'); clearNarr('leNarr2');
      setTimeout(() => {
        _playFileSE('../bgm/b07_whiff_v4.mp3');
        fireFlash(); shake(); cutIn('leCutinA');
        setTimeout(() => setNarr('leNarr3', '大型補強を宣言——エース候補の発掘に乗り出す'), 500);
        unlock(900);
      }, 400);
    },
    // step 4: A級退場 → B級カットイン
    () => {
      cutOut('leCutinA'); clearNarr('leNarr3');
      setTimeout(() => {
        _playFileSE('../bgm/b07_whiff_v4.mp3');
        fireFlash(); shake(); cutIn('leCutinB');
        setTimeout(() => setNarr('leNarr4', '育成体制を一新——コーチ陣を大幅強化'), 500);
        unlock(900);
      }, 400);
    },
    // step 5: B級退場 → 締め
    () => {
      cutOut('leCutinB'); clearNarr('leNarr4');
      hideNarr('leNarr0'); hideNarr('leNarr1');
      clickHint.classList.remove('visible');
      setTimeout(() => {
        _playFileSE('../bgm/e02_crowd_v2.mp3', 0.20);
        document.getElementById('leClosingText').classList.add('visible');
      }, 600);
      setTimeout(() => {
        document.getElementById('leCloseBtn').classList.add('visible');
      }, 1200);
      clickArea.classList.add('disabled');
    },
  ];

  function advanceStep() {
    if (locked) return;
    currentStep++;
    if (currentStep >= steps.length) return;
    locked = true;
    clickHint.classList.remove('visible');
    steps[currentStep]();
  }

  clickArea.addEventListener('click', advanceStep);

  // ── 「次へ」ボタン（スライド1→2） ──
  document.getElementById('leNextBtn').addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.fileBgm) {
      Audio.fileBgm.play('../bgm/bgm_tension_v1.mp3', { loop: false, volume: 0.10 });
    }
    _playFileSE('../bgm/e02_crowd_v2.mp3', 0.10);
    fireFlash();
    setTimeout(() => {
      content.dataset.slide = '2';
      clickArea.classList.remove('disabled');
      advanceStep(); // step 0 を自動実行
    }, 200);
  });

  // ── 「続ける」ボタン ──
  document.getElementById('leCloseBtn').addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.fadeOut(1500);
    overlay.style.transition = 'opacity .6s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      overlay.style.opacity = '';
      overlay.style.transition = '';
      if (onDone) onDone();
    }, 600);
  });

  if (typeof Audio !== 'undefined' && Audio.play) Audio.play('reveal');
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: エンディング演出 — ending-gameover-spec-v1.0.md §1.3
// ─────────────────────────────────────────────────────────────────────────────

/** エンディング演出（5スライド）。awardsOverlay を表彰式と同じパターンで使用 */
function showEndingCeremony(data, onDone) {

  // ── セリフプール ──
  const fighterLineObj = (typeof ENDING_LINES !== 'undefined' && ENDING_LINES.fighter) || null;
  const coachLinesPool = (typeof ENDING_LINES !== 'undefined' && ENDING_LINES.coach) || [];
  function _pickLines(pool, n) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // ── ポートレートHTML生成（選手・コーチ共通、Upper画像優先） ──
  function _endingPortrait(id, size, isCoach) {
    const h = Math.round(size * 1.5);
    let url = '';
    if (isCoach) {
      url = typeof getCoachUpperUrl === 'function' ? getCoachUpperUrl(id) : '';
      if (!url) url = typeof getCoachPortraitUrl === 'function' ? getCoachPortraitUrl(id) : '';
    } else {
      url = typeof getUpperUrl === 'function' ? getUpperUrl(id) : '';
    }
    if (url) {
      return `<div class="portrait-main" style="width:${size}px;height:${h}px">
        <div class="portrait-glow"></div>
        <img src="${url}" alt="">
      </div>`;
    }
    return `<div class="portrait-main" style="width:${size}px;height:${h}px;font-size:${Math.round(size * 0.5)}px">👤</div>`;
  }

  // ── スライドHTML構築 ──
  const slideInfo = []; // { html, label }

  // スライド1: タイトル（業界制覇）
  slideInfo.push({
    label: '業界制覇',
    html: `<div class="award-card" style="text-align:center">
      <div class="award-badge" style="justify-content:center"><span class="badge-jp">シーズン ${data.season}</span></div>
      <div style="font-size:48px;margin:16px 0">🏆</div>
      <div style="font-family:'Noto Serif JP',serif;font-size:22px;font-weight:900;letter-spacing:6px;color:var(--gold);
        text-shadow:0 0 30px rgba(212,168,67,0.4);margin-bottom:12px">業 界 制 覇</div>
      <div style="font-size:14px;color:var(--text-sub);line-height:2.0;margin-top:8px">
        団体立ち上げから${data.season}年。<br>ついに「${data.orgName}」が業界の頂点に立った。
      </div>
    </div>`
  });

  // スライド2: 道のりサマリー
  const peakPop = Math.round(data.peakOrgPop || 0);
  slideInfo.push({
    label: '頂点への道のり',
    html: `<div class="award-card">
      <div class="award-badge"><span class="badge-icon">📜</span><span class="badge-jp">頂点への道のり</span></div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);padding:8px 0">
          <span style="font-size:12px;color:var(--text-dim);letter-spacing:1px">活動期間</span>
          <span style="font-size:14px;font-weight:700;color:var(--text)">${data.season} シーズン</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);padding:8px 0">
          <span style="font-size:12px;color:var(--text-dim);letter-spacing:1px">最終レーティング</span>
          <span style="font-size:14px;font-weight:700;color:var(--gold-light)">${data.playerRating}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);padding:8px 0">
          <span style="font-size:12px;color:var(--text-dim);letter-spacing:1px">最高団体人気</span>
          <span style="font-size:14px;font-weight:700;color:var(--text)">${peakPop}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);padding:8px 0">
          <span style="font-size:12px;color:var(--text-dim);letter-spacing:1px">興行回数</span>
          <span style="font-size:14px;font-weight:700;color:var(--text)">${data.totalShows} 回</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);padding:8px 0">
          <span style="font-size:12px;color:var(--text-dim);letter-spacing:1px">ベストマッチ</span>
          <span style="font-size:14px;font-weight:700;color:var(--gold-light)">MQ ${data.bestMQ}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0">
          <span style="font-size:12px;color:var(--text-dim);letter-spacing:1px">殿堂入り</span>
          <span style="font-size:14px;font-weight:700;color:var(--text)">${data.hallOfFameCount} 名</span>
        </div>
      </div>
    </div>`
  });

  // スライド3: 選手たちの声
  const fighters = data.top3Fighters || [];
  if (fighters.length > 0) {
    const fHtml = fighters.map(f => {
      const ovrRaw = typeof Engine !== 'undefined' && Engine.util ? Engine.util.ov(f) : NaN;
      const ovr = isNaN(ovrRaw) ? (f.ovr || '—') : ovrRaw;
      const line = fighterLineObj ? pickDialogueLine(fighterLineObj, f) : '最高だ！';
      return `<div style="flex:1;text-align:center;min-width:0;max-width:160px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${_endingPortrait(f.id, 100)}</div>
        <div style="font-family:'Noto Serif JP',serif;font-size:13px;font-weight:700;color:var(--text)">${f.name}</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px">OVR ${ovr}</div>
        <div class="speech-bubble" style="margin-top:10px">
          <div class="speech-text" style="font-size:11px">「${line}」</div>
        </div>
      </div>`;
    }).join('');
    slideInfo.push({
      label: '選手たちの声',
      html: `<div class="award-card" style="text-align:center">
        <div class="award-badge" style="justify-content:center"><span class="badge-icon">🎤</span><span class="badge-jp">選手たちの声</span></div>
        <div style="display:flex;justify-content:center;gap:16px;margin:16px 0 8px">${fHtml}</div>
      </div>`
    });
  }

  // スライド4: スタッフの声（コーチがいる場合のみ）
  const coaches = (data.coaches || []).slice(0, 3);
  if (coaches.length > 0) {
    const cLines = _pickLines(coachLinesPool, coaches.length);
    const cHtml = coaches.map((c, i) => {
      const ALL_C = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES : [];
      const master = ALL_C.find(x => x.id === c.id) || c;
      return `<div style="flex:1;text-align:center;min-width:0;max-width:180px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${_endingPortrait(c.id, 100, true)}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">${master.name || c.name || '—'}</div>
        <div class="speech-bubble" style="margin-top:10px">
          <div class="speech-text" style="font-size:11px">「${cLines[i] || 'お疲れ様でした'}」</div>
        </div>
      </div>`;
    }).join('');
    slideInfo.push({
      label: 'スタッフの声',
      html: `<div class="award-card" style="text-align:center">
        <div class="award-badge" style="justify-content:center"><span class="badge-icon">🎓</span><span class="badge-jp">スタッフの声</span></div>
        <div style="display:flex;justify-content:center;gap:20px;margin:16px 0 8px">${cHtml}</div>
      </div>`
    });
  }

  // スライド5: 締めくくり
  slideInfo.push({
    label: 'CONGRATULATIONS',
    html: `<div class="award-card hall-of-fame" style="text-align:center">
      <div style="font-size:48px;margin:8px 0 16px">🏆</div>
      <div style="font-family:'Noto Serif JP',serif;font-size:24px;font-weight:900;letter-spacing:4px;color:var(--text);
        text-shadow:0 0 20px rgba(212,168,67,0.3);margin-bottom:16px">CONGRATULATIONS</div>
      <div style="font-size:14px;color:var(--text-sub);line-height:2.0">
        「${data.orgName}」は<br>女子プロレス界の頂点に立った。<br><br>
        しかし、「${data.orgName}」の戦いはまだ始まったばかり<br>この先に待つのは、新たな伝説か・・・・
      </div>
    </div>`
  });

  // ── DOM構築（showAwardsCeremonyと同パターン） ──
  const overlay = document.getElementById('awardsOverlay');
  const slideWrap = document.getElementById('aw-slide-wrap');
  const headerLabel = document.getElementById('aw-header-award-name');
  const dotsEl = document.getElementById('aw-slide-dots');
  const btnNext = document.getElementById('aw-btn-next');
  const fanfareEl = document.getElementById('aw-fanfare-overlay');
  const coachFg = document.getElementById('hof-coach-fg');

  // スライドDOM生成
  slideWrap.innerHTML = '';
  slideInfo.forEach((si, i) => {
    const div = document.createElement('div');
    div.className = 'aw-slide' + (i === 0 ? ' active' : '');
    div.id = 'aw-ending-slide-' + i;
    div.innerHTML = si.html;
    slideWrap.appendChild(div);
  });

  dotsEl.innerHTML = '';
  coachFg.innerHTML = '';
  coachFg.classList.remove('revealed');

  // ファンファーレ
  fanfareEl.innerHTML = `
    <div class="fanfare-line-1">シーズン ${data.season}</div>
    <div class="fanfare-line-2">業界制覇</div>
    <div class="fanfare-divider"></div>
    <div class="fanfare-sub">🏆 頂点到達</div>`;
  fanfareEl.style.animation = 'none';
  requestAnimationFrame(() => { fanfareEl.style.animation = ''; });

  _awSpawnParticles();

  let current = 0;
  const TOTAL = slideInfo.length;
  let bgmStarted = false;

  function goToSlide(idx) {
    const slides = slideWrap.querySelectorAll('.aw-slide');
    slides[current].classList.remove('active');
    current = idx;
    slides[current].classList.add('active');
    slides[current].style.animation = 'none';
    requestAnimationFrame(() => { slides[current].style.animation = ''; });

    headerLabel.textContent = 'シーズン ' + data.season + ' — ' + slideInfo[current].label;
    btnNext.textContent = current === TOTAL - 1 ? '続ける ▶' : '次へ　→';

    setTimeout(() => _awPlaySE('normal'), 50);
  }

  function nextSlide() {
    // BGM開始（最初の「次へ」クリック時、ユーザー操作内で）
    if (!bgmStarted) {
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) { Audio.fileBgm.play('../bgm/8bit-jo-jokyoku.mp3', { loop: true, volume: 0.10 }); } } catch(e) {}
      bgmStarted = true;
    }

    if (current >= TOTAL - 1) {
      // 閉じる: BGMフェードアウト後にコールバック
      overlay.classList.remove('active');
      _awClearParticles();
      window._awardsNext = null;
      btnNext.onclick = null;
      const doClose = () => { if (onDone) onDone(); _drainPopupQueue(); };
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) { Audio.fileBgm.fadeOut(2000).then(doClose); return; } } catch(e) {}
      doClose();
      return;
    }
    goToSlide(current + 1);
  }

  window._awardsNext = nextSlide;
  btnNext.onclick = nextSlide;

  // 表示開始
  headerLabel.textContent = 'シーズン ' + data.season + ' — ' + slideInfo[0].label;
  btnNext.textContent = '次へ　→';
  overlay.classList.add('active');

  setTimeout(() => _awPlayFanfare(), 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: ゲームオーバー画面 — ending-gameover-spec-v1.0.md §2
// ─────────────────────────────────────────────────────────────────────────────

/** ゲームオーバー画面を表示（オーバーレイ経由）*/
function showGameOverScreen(summary) {
  const overlay = document.getElementById('gameoverOverlay');
  const box = document.getElementById('gameoverBox');
  if (!overlay || !box) return;

  const fmt = n => (typeof n === 'number') ? n.toLocaleString() : (n ?? '—');

  box.innerHTML = `
    <div class="gameover-title">💀 GAME OVER</div>
    <div class="gameover-subtitle">「${summary.orgName}」は資金難により活動停止を発表した。</div>
    <div class="gameover-divider">─── 団体の足跡 ───</div>
    <div class="gameover-stats">
      <div class="gameover-stat-row"><span>活動期間</span><span>${summary.season} シーズン</span></div>
      <div class="gameover-stat-row"><span>最高ランク</span><span>${summary.bestRank} 位</span></div>
      <div class="gameover-stat-row"><span>最高資金</span><span>${fmt(summary.peakFunds)} 万</span></div>
      <div class="gameover-stat-row"><span>最高団体人気</span><span>${fmt(Math.round(summary.peakOrgPop))}</span></div>
      <div class="gameover-stat-row"><span>興行回数</span><span>${summary.totalShows} 回</span></div>
      <div class="gameover-stat-row"><span>ベストマッチ</span><span>${summary.bestMQMatch || '—'} (MQ ${summary.bestMQ})</span></div>
      <div class="gameover-stat-row"><span>殿堂入り</span><span>${summary.hallOfFameCount} 名</span></div>
    </div>
    <button class="gameover-btn" id="gameoverBtn1" onclick="
      document.getElementById('gameoverBtn1').style.display='none';
      document.getElementById('gameoverBtn2').style.display='block';
    ">成績を噛み締めた</button>
    <button class="gameover-btn secondary" id="gameoverBtn2" style="display:none" onclick="
      document.getElementById('gameoverOverlay').classList.remove('active');
      App.showTitleScreen();
    ">タイトルに戻る</button>
  `;
  overlay.classList.add('active');
  try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.play('../bgm/iwa_gameover001.mp3', { volume: 0.13 }); } catch(e) {}
}

// ╔══════════════════════════════════════════════════════════╗
// ║  RADAR CHART  (Canvas 2D — no external libs)             ║
// ╚══════════════════════════════════════════════════════════╝

// Helper: '#rrggbb' → 'rgba(r,g,b,alpha)'
function hexToRgba(hex, alpha) {
  let r = 136, g = 136, b = 136;
  if (hex && hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else if (hex && hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * drawRadarChart(canvas, stats, options)
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{label,value,color}>} stats  5軸（value: 0-100）
 * @param {Object} options
 *   fillColor {string}  hex塗り色
 *   fillAlpha {number}  不透明度（default 0.25）
 *   radius    {number}  チャート半径（default W/2-26）
 *   data2     {Object}  2本目 {values:number[], fillColor, fillAlpha}
 *   labelSize {number}  ラベルフォントサイズ（default 11）
 */
function drawRadarChart(canvas, stats, options = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = options.radius !== undefined ? options.radius : (Math.min(W, H) / 2 - 26);
  const n = stats.length;
  const angles = stats.map((_, i) => -Math.PI / 2 + i * (2 * Math.PI / n));

  ctx.clearRect(0, 0, W, H);

  // Grid lines 20/40/60/80/100
  [20, 40, 60, 80, 100].forEach(level => {
    const r = (level / 100) * radius;
    ctx.beginPath();
    angles.forEach((a, i) => {
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(200,190,170,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Axis lines from center
  angles.forEach(a => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  function drawPolygon(values, fillColor, fillAlpha) {
    ctx.beginPath();
    angles.forEach((a, i) => {
      const v = Math.min(100, Math.max(0, values[i] || 0));
      const r = (v / 100) * radius;
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
              : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgba(fillColor, fillAlpha);
    ctx.fill();
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    angles.forEach((a, i) => {
      const v = Math.min(100, Math.max(0, values[i] || 0));
      const r = (v / 100) * radius;
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 3, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
    });
  }

  if (options.data2) {
    const d2 = options.data2;
    drawPolygon(d2.values, d2.fillColor || '#888', d2.fillAlpha !== undefined ? d2.fillAlpha : 0.15);
  }
  const fillColor = options.fillColor || '#888';
  const fillAlpha = options.fillAlpha !== undefined ? options.fillAlpha : 0.25;
  drawPolygon(stats.map(s => s.value), fillColor, fillAlpha);

  // Axis labels
  const labelR = radius + 16;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  stats.forEach((s, i) => {
    const a = angles[i];
    ctx.font = `bold ${options.labelSize || 11}px sans-serif`;
    ctx.fillStyle = s.color || 'rgba(255,255,255,0.7)';
    ctx.fillText(s.label, cx + labelR * Math.cos(a), cy + labelR * Math.sin(a));
  });
}

// ── v2.1: 体験版制限モーダル ──────────────────────────────────────────────────
// IS_TRIAL=true のとき featureName が製品版限定である旨を表示し true を返す。
// IS_TRIAL=false のとき何もせず false を返す → if (showTrialLimitMessage('機能名')) return; で使う。
function showTrialLimitMessage(featureName) {
  if (!window.IS_TRIAL) return false;
  const overlay = document.getElementById('confirmOverlay');
  const box = document.getElementById('confirmBox');
  if (!overlay || !box) {
    // TODO: DLsite公開後に「DLsite / BOOTH」に戻す
    alert(`【${featureName}】は製品版で遊べます！\nBOOTH で製品版をチェックしてください。`);
    return true;
  }
  box.innerHTML = `
    <div class="panel-title" style="color:var(--gold);margin-bottom:12px">🔒 製品版限定機能</div>
    <p style="line-height:1.8;margin-bottom:20px">
      【${featureName}】は製品版で解放されます！<br>
      <!-- TODO: DLsite公開後に「DLsite / BOOTH」に戻す -->
      BOOTH で製品版をチェックしてください。
    </p>
    <button class="btn btn-gold" style="min-width:120px"
      onclick="document.getElementById('confirmOverlay').classList.remove('active')">閉じる</button>`;
  overlay.classList.add('active');
  return true;
}

// ── 体験版終了メッセージ ─────────────────────────────────────────────────────
function showTrialEndMessage() {
  const overlay = document.getElementById('confirmOverlay');
  const box = document.getElementById('confirmBox');
  if (!overlay || !box) return;
  box.innerHTML = `
    <div style="text-align:center;padding:20px 10px">
      <div style="font-size:22px;font-weight:800;color:var(--gold);margin-bottom:16px;letter-spacing:1px">
        🎬 体験版をプレイいただき<br>ありがとうございました！
      </div>
      <div style="line-height:2;margin-bottom:20px;font-size:14px;color:var(--text-main)">
        あなたの団体の物語は<br>まだ始まったばかりです。<br><br>
        製品版ではシーズン4以降を<br>無制限にプレイできます。<br>
        <span style="color:var(--gold)">セーブデータはそのまま引き継げます。</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;align-items:center">
        <a href="https://takoyakichan.booth.pm/" target="_blank" rel="noopener"
           class="btn btn-gold" style="min-width:200px;text-decoration:none;display:inline-block;text-align:center">
          🛒 BOOTH で購入</a>
        <!-- TODO: DLsite商品ページ公開後にボタンを追加する -->
        <button class="btn" style="min-width:200px;margin-top:8px;background:rgba(200,190,170,0.08);color:var(--text-sub)"
          onclick="document.getElementById('confirmOverlay').classList.remove('active')">
          閉じる（引き続き閲覧可能）</button>
      </div>
      <div style="border-top:1px solid rgba(200,190,170,0.12);margin:20px 0 16px;width:80%;margin-left:auto;margin-right:auto"></div>
      <div style="text-align:center">
        <div style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px;font-weight:600">
          ✦ この選手たちの作品をもっと見る ✦</div>
        <a href="https://takoyaki.fanbox.cc/" target="_blank" rel="noopener"
           class="btn" style="min-width:200px;text-decoration:none;display:inline-block;text-align:center;
             background:rgba(200,190,170,0.08);color:var(--text-main);border:1px solid rgba(200,190,170,0.15)">
          📖 無料作品を読む（FANBOX）</a>
      </div>
      <div style="border-top:1px solid rgba(200,190,170,0.12);margin:20px 0 16px;width:80%;margin-left:auto;margin-right:auto"></div>
      <div style="display:flex;gap:20px;justify-content:center;align-items:center">
        <a href="https://x.com/tkykchan" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:5px;text-decoration:none;color:var(--text-sub);font-size:12px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;
            border-radius:50%;background:rgba(200,190,170,0.1);font-size:13px">𝕏</span>X</a>
        <a href="https://www.patreon.com/takoyakichan" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:5px;text-decoration:none;color:var(--text-sub);font-size:12px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;
            border-radius:50%;background:rgba(200,190,170,0.1);font-size:13px">P</span>Patreon</a>
        <a href="https://takoyaki.fanbox.cc/" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:5px;text-decoration:none;color:var(--text-sub);font-size:12px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;
            border-radius:50%;background:rgba(200,190,170,0.1);font-size:13px">F</span>FANBOX</a>
      </div>
      <div style="margin-top:16px;font-size:11px;color:var(--text-dim);line-height:1.6">
        ※ 閉じた後もロスター閲覧・関係性マップ等は確認できます。<br>
        ※ 週送り（次シーズン進行）はできません。
      </div>
    </div>`;
  overlay.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────────────────
// 契約更新交渉UI (Phase A: 社長室内レンダリング版)
// careOverlay を使わず shachoshitsuContent に直接描画する
// ─────────────────────────────────────────────────────────────────────────────

// 壁前の発言者HTML (ポートレイト96px + 吹き出し)
function _negSpeakerHtml(neg, dialogue, badgeCls, badgeLabel) {
  const face = portraitImg(neg.fighterId, 96, 'negotiation-speaker-portrait');
  return `
    <div class="negotiation-speaker">
      ${face}
      <div class="negotiation-bubble">
        <strong style="font-size:12px;color:rgba(255,255,255,0.55)">${neg.fighterName}</strong>
        <span class="neg-badge ${badgeCls}">${badgeLabel}</span><br>
        「${dialogue}」
      </div>
    </div>`;
}

// 画面1: サマリー — 「シーズンN 契約更新 ／ 意見あり：M名」
function showContractSummaryModal(negotiations, autoCount, season, onStart) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) { if (onStart) onStart(); return; }

  const facesHtml = negotiations.map(n => {
    const [badgeCls, badgeLabel] = n.attitude === 'sudden_departure'
      ? ['neg-badge-sudden', '⚡ 突発退団']
      : n.attitude === 'raise'
        ? ['neg-badge-raise', '💰 昇給要求']
        : ['neg-badge-transfer', '🚪 移籍志願'];
    return `<div class="neg-card-face-item">
      <div style="border-radius:10px;overflow:hidden">${portraitImg(n.fighterId, 64)}</div>
      <span style="font-size:11px;color:#2a2318">${n.fighterName}</span>
      <span class="neg-badge ${badgeCls}">${badgeLabel}</span>
    </div>`;
  }).join('');

  const deskHtml = `
    <div class="neg-card-title">📋 シーズン${season} 契約更新</div>
    <div class="neg-stat-row">
      自動更新: <strong>${autoCount}名</strong>　／　意見あり: <strong style="color:#c0392b">${negotiations.length}名</strong>
    </div>
    <div class="neg-card-faces">${facesHtml}</div>
    <button class="btn btn-gold" id="contractStartBtn" style="width:100%;padding:12px;font-size:14px;font-weight:700">
      交渉を始める
    </button>`;

  renderShachoshitsuNegotiation('', deskHtml);
  Audio.play('paper');

  document.getElementById('contractStartBtn').addEventListener('click', () => {
    Audio.play('tension_hit');
    if (onStart) onStart();
  });
}

// 画面2: 1対1交渉 — 選手の顔+セリフ+選択肢
function showContractNegotiationModal(neg, idx, total, state, onChoice) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) { if (onChoice) onChoice(0); return; }

  const fighter = (state.roster || []).find(f => f.id === neg.fighterId);
  const isTransfer = neg.attitude === 'transfer';
  const [badgeCls, badgeLabel] = isTransfer
    ? ['neg-badge-transfer', '🚪 移籍志願']
    : ['neg-badge-raise', '💰 昇給要求'];

  // セリフ生成
  const dialogueRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId, 1));
  const openPhase = isTransfer ? 'transfer_open' : 'raise_open';
  const dialogue = Engine.contract.selectDialogue(dialogueRng, neg, openPhase, neg.context);

  // 選択肢の構築
  let choices;
  if (neg.attitude === 'raise') {
    choices = [
      { label: '昇給を受ける', hint: `信頼↑↑　給与+${neg.raiseAmount}万/週`, idx: 0 },
      { label: '交渉する',     hint: `成功時　給与+${neg.counterOffer}万/週`, idx: 1 },
      { label: '拒否する',     hint: '信頼↓↓', idx: 2 },
    ];
  } else {
    choices = [
      { label: '引き留める', hint: `${neg.retentionBonus}万 支出`, idx: 0,
        disabled: (state.funds || 0) < neg.retentionBonus },
      { label: '理由を聞く', hint: '', idx: 1 },
      { label: '送り出す',   hint: '退団', idx: 2 },
    ];
  }

  // 金額情報
  let infoHtml = '';
  if (neg.attitude === 'raise') {
    const currentSalary = fighter ? Engine.util.getSalary(fighter, state.titles) : 0;
    infoHtml = `<div class="neg-card-info neg-card-info-raise" style="font-size:12px">
      現在の週給: ${currentSalary}万 → 要求: ${currentSalary + neg.raiseAmount}万（+${neg.raiseAmount}万/週）
    </div>`;
  } else {
    infoHtml = `<div class="neg-card-info neg-card-info-transfer" style="font-size:12px">
      引き留めボーナス: ${neg.retentionBonus}万（一時金）
    </div>`;
  }

  const choicesHtml = choices.map(c => {
    const disAttr = c.disabled ? ' disabled' : '';
    const hintHtml = c.hint ? `<span class="neg-btn-hint">${c.hint}</span>` : '';
    return `<button class="neg-btn" data-choice="${c.idx}"${disAttr}><span>${c.label}</span>${hintHtml}</button>`;
  }).join('');

  const deskHtml = `
    <div class="neg-card-title">
      📋 契約交渉（${idx + 1}/${total}）
      <span class="neg-badge ${badgeCls}">${badgeLabel}</span>
    </div>
    ${infoHtml}
    <div class="neg-choices">${choicesHtml}</div>`;

  renderShachoshitsuNegotiation(_negSpeakerHtml(neg, dialogue, badgeCls, badgeLabel), deskHtml);
  Audio.play('event');

  el.querySelectorAll('.neg-btn[data-choice]').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.disabled) return;
      const ci = parseInt(this.dataset.choice);
      // 昇給: 受ける(0)=fanfare, 交渉(1)=select, 拒否(2)=defeat
      // 移籍: 引き留め(0)=coin, 理由を聞く(1)=select, 送り出す(2)=defeat
      if (ci === 0) Audio.play(isTransfer ? 'coin' : 'fanfare');
      else if (ci === 2) Audio.play('defeat');
      else Audio.play('select');
      if (onChoice) onChoice(ci);
    });
  });
}

// リアクション表示 — 選択後のセリフを見せてから次へ
function showContractReactionModal(neg, reactionText, onDone) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) { if (onDone) onDone(); return; }
  if (!reactionText) { if (onDone) onDone(); return; }

  const wallHtml = _negSpeakerHtml(neg, reactionText, 'neg-badge-raise', '');
  const deskHtml = `
    <button class="neg-btn" id="contractReactionOk" style="width:100%;justify-content:center;padding:12px;font-size:13px;font-weight:700">
      次へ
    </button>`;

  renderShachoshitsuNegotiation(wallHtml, deskHtml);
  Audio.play('notify');

  document.getElementById('contractReactionOk').addEventListener('click', () => {
    Audio.play('click');
    if (onDone) onDone();
  });
}

// 理由を聞く → サブ選択（引き留め or 送り出す）
function showContractListenModal(neg, listenText, state, onSubChoice) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) { if (onSubChoice) onSubChoice('release'); return; }

  const canAfford = (state.funds || 0) >= neg.retentionBonus;
  const wallHtml = _negSpeakerHtml(neg, listenText, 'neg-badge-transfer', '🚪 移籍志願');

  const deskHtml = `
    <div class="neg-card-title">📋 ${neg.fighterName}の話を聞く</div>
    <div class="neg-choices">
      <button class="neg-btn" data-sub="retain"${canAfford ? '' : ' disabled'}>
        <span>引き留める</span>
        <span class="neg-btn-hint">${neg.retentionBonus}万 支出</span>
      </button>
      <button class="neg-btn" data-sub="release">
        <span>送り出す</span>
      </button>
    </div>`;

  renderShachoshitsuNegotiation(wallHtml, deskHtml);
  Audio.play('event');

  el.querySelectorAll('.neg-btn[data-sub]').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.disabled) return;
      const sub = this.dataset.sub;
      Audio.play(sub === 'retain' ? 'coin' : 'defeat');
      if (onSubChoice) onSubChoice(sub);
    });
  });
}

// v2.0 §12.3: 突発退団画面 — 選択肢なし、[……わかった]ボタンのみ
function showContractSuddenDepartureModal(neg, state, onDone) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) { if (onDone) onDone(); return; }

  const dialogueRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId, 1));
  const dialogue = Engine.contract.selectDialogue(dialogueRng, neg, 'sudden_departure', neg.context);
  const wallHtml = _negSpeakerHtml(neg, dialogue, 'neg-badge-sudden', '⚡ 突発退団');

  const deskHtml = `
    <div class="neg-card-info neg-card-info-sudden" style="font-size:12px;text-align:center;margin-bottom:14px">
      交渉の余地なし — ${neg.fighterName}は退団を決意しています
    </div>
    <button class="neg-btn" id="contractSuddenOk" style="width:100%;justify-content:center;padding:12px;font-size:14px;font-weight:700;color:#8e44ad;border-color:rgba(142,68,173,0.5)">
      ……わかった
    </button>`;

  renderShachoshitsuNegotiation(wallHtml, deskHtml);
  Audio.play('transfer');

  document.getElementById('contractSuddenOk').addEventListener('click', () => {
    Audio.play('defeat');
    if (onDone) onDone();
  });
}

// 画面3: 結果サマリー
function showContractResultModal(results, salaryChanges, onDone) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) { if (onDone) onDone(); return; }

  const stayed   = results.filter(r => r.type === 'stay');
  const departed = results.filter(r => r.type === 'depart');
  const changed  = Array.isArray(salaryChanges) ? salaryChanges : [];

  let deskHtml = `<div class="neg-card-title">📋 契約更新 完了</div>`;
  deskHtml += `<div class="neg-stat-row">
    残留: <strong style="color:#27ae60">${stayed.length}名</strong>`;
  if (changed.length > 0) deskHtml += `（給与変動: ${changed.length}名）`;
  deskHtml += `　　退団: <strong style="color:#c0392b">${departed.length}名</strong></div>`;

  if (departed.length > 0) {
    deskHtml += '<div class="neg-result-section neg-result-depart">';
    departed.forEach(r => {
      let dest = '';
      if (r.departureInfo) {
        if (r.departureInfo.type === 'retire')      dest = '→ 引退';
        else if (r.departureInfo.type === 'rival')  dest = `→ ${r.departureInfo.orgName || 'ライバル団体'}`;
        else                                         dest = '→ フリーエージェント';
      }
      deskHtml += `<div class="neg-result-row">
        ${portraitImg(r.fighterId, 32)}
        <span style="font-size:13px;color:#2a2318">${r.fighterName}</span>
        <span style="font-size:11px;color:rgba(42,35,24,0.55);margin-left:auto">${dest}</span>
      </div>`;
    });
    deskHtml += '</div>';
  }

  if (changed.length > 0) {
    deskHtml += '<div class="neg-result-section neg-result-stay">';
    changed.forEach(r => {
      const deltaText = r.salaryDelta > 0 ? `+${r.salaryDelta}` : `${r.salaryDelta}`;
      const deltaColor = r.salaryDelta > 0 ? '#c07000' : '#2c5aa0';
      const negotiatedText = r.negotiatedDelta > 0 ? `+${r.negotiatedDelta}` : `${r.negotiatedDelta}`;
      const baselineText = r.baselineDelta > 0 ? `+${r.baselineDelta}` : `${r.baselineDelta}`;
      const breakdown = [];
      if (r.negotiatedDelta !== 0) breakdown.push(`交渉 ${negotiatedText}`);
      if (r.baselineDelta !== 0) breakdown.push(`契約基準 ${baselineText}`);
      deskHtml += `<div class="neg-result-row">
        ${portraitImg(r.fighterId, 32)}
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
          <span style="font-size:13px;color:#2a2318">${r.fighterName}</span>
          ${breakdown.length > 0
            ? `<span style="font-size:10px;color:rgba(42,35,24,0.6)">${breakdown.join(' ／ ')}</span>`
            : ''
          }
        </div>
        <span style="font-size:11px;color:rgba(42,35,24,0.65);margin-left:auto;margin-right:8px">${r.oldSalary}→${r.newSalary}万/週</span>
        <span style="font-size:11px;color:${deltaColor}">${deltaText}万/週</span>
      </div>`;
    });
    deskHtml += '</div>';
  }

  deskHtml += `<button class="btn btn-gold" id="contractResultOk" style="width:100%;padding:12px;font-size:14px;font-weight:700;margin-top:4px">
    シーズン開幕へ
  </button>`;

  renderShachoshitsuNegotiation('', deskHtml);
  Audio.play(departed.length > 0 ? 'transfer' : 'save');

  document.getElementById('contractResultOk').addEventListener('click', () => {
    Audio.play('stamp');
    if (onDone) onDone();
  });
}

// ══════════════════════════════════════════════════════════
//  U-20 ジュニアトーナメント UI  (V6 visual)
// ══════════════════════════════════════════════════════════

/** V6ヘッダー */
function _jtHeader() {
  const season = G.season;
  const bs = App._jtPreview?.result?.bracketSize || 8;
  return `<div class="jt-hd"><div class="jt-sp">NATIONAL U-20</div><h1>第${season}回 ジュニアトーナメント</h1><div class="jt-sub">${bs}名トーナメント</div></div>`;
}

/** 選手セルHTML (ブラケット用) */
function _jtFighterCell(p, isWin, isLose, isTbd) {
  if (isTbd) return `<div class="jt-bf tbd"><div class="jt-av"><span class="ini">?</span></div><div class="jt-fn">— TBD —</div></div>`;
  const cls = isWin ? 'jt-bf w' : isLose ? 'jt-bf l' : 'jt-bf';
  const faceUrl = getPortraitUrl(p.id);
  const imgH = faceUrl
    ? `<img src="${faceUrl}" alt="" onerror="this.outerHTML='<span class=ini>${(p.name||'?')[0]}</span>'">`
    : `<span class="ini">${(p.name||'?')[0]}</span>`;
  return `<div class="${cls}">
    <div class="jt-av">${imgH}</div>
    <div style="flex:1;min-width:0"><div class="jt-fn">${p.name}</div></div>
    <div class="jt-fo">OVR${p.ovr}</div>${isWin ? '<div style="color:#2ecc71;font-size:9px;font-weight:700;margin-left:3px">WIN</div>' : ''}
  </div>`;
}

// ===== SUMMON (card-style full-screen) =====
function renderJuniorTournamentSummon() {
  const jt = App._jtPreview;
  if (!jt) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const { myParticipants, summonIndex } = jt;
  const p = myParticipants[summonIndex];
  const season = G.season;
  const faceUrl = getPortraitUrl(p.id);
  const line = getJuniorTournamentLine('summon', p.personality || 'normal', p.archetype || '_default');

  let html = `<div class="jt-phase">召集通知</div>`;
  html += `<div class="jt-so" onclick="App.jtNextSummon()">`;
  html += `<div class="jt-so-top"><div class="tg">NATIONAL U-20 召集通知</div><h2>第${season}回 ジュニアトーナメント</h2></div>`;
  html += `<div class="jt-so-card" key="${summonIndex}">`;
  html += `<div class="jt-so-card-img">${faceUrl ? `<img src="${faceUrl}" alt="${p.name}">` : ''}</div>`;
  html += `<div class="jt-so-card-body">`;
  html += `<div class="jt-so-nm">${p.name}</div>`;
  html += `<div class="jt-so-inf">${p._orgName || ''} ・ OVR ${p.ovr}</div>`;
  if (line) {
    html += `<div class="jt-so-bub"><div class="sp">${p.name}</div>「${line}」</div>`;
  }
  html += `</div></div>`;
  // dots
  html += `<div class="jt-so-dots">${myParticipants.map((_, j) =>
    `<div class="d ${j < summonIndex ? 'dn' : ''}${j === summonIndex ? ' on' : ''}"></div>`).join('')}</div>`;
  html += `<div class="jt-so-hint">タップして次へ</div>`;
  html += `</div>`;

  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';
  box.innerHTML = html;
  overlay.classList.add('active');
}

// ===== JT IMPRESSION CHAIN (post-tournament fighter comments) =====
function _showJTImpressionChain(list, idx, onDone) {
  if (idx >= list.length) { if (onDone) onDone(); return; }
  const f = list[idx];
  const timing = f._jtTiming || 'postLose';
  const line = getJuniorTournamentLine(timing, f.personality || 'normal', f.archetype || '_default');
  if (!line) { _showJTImpressionChain(list, idx + 1, onDone); return; }

  const portraitUrl = getPortraitUrl(f.id);
  const resultLabel = timing === 'champion' ? '優勝' : timing === 'postWin' ? '入賞' : '敗退';
  const resultColor = timing === 'champion' ? 'var(--gold)' : timing === 'postWin' ? '#2ecc71' : 'var(--text-sub)';

  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay';
  overlay.innerHTML = `
    <div class="war-victory-modal">
      <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:3px solid ${resultColor};margin:0 auto 12px;box-shadow:0 0 20px rgba(212,168,83,0.15)">
        ${_imgOrInitial(portraitUrl, f.id, 80, 'border-radius:50%;')}
      </div>
      <div style="font-size:11px;color:${resultColor};letter-spacing:2px;margin-bottom:4px">${resultLabel}</div>
      <div class="war-victory-name">${f.name}</div>
      <div class="war-victory-line">「${line}」</div>
      <button class="war-victory-close">▶</button>
    </div>
  `;
  overlay.querySelector('.war-victory-close').addEventListener('click', () => {
    overlay.remove();
    _showJTImpressionChain(list, idx + 1, onDone);
  });
  document.body.appendChild(overlay);
  Audio.play('notify');
}

// ===== BRACKET (V6 horizontal with SVG connectors) =====
function renderJuniorTournamentBracket() {
  const jt = App._jtPreview;
  if (!jt) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const { result, currentRound, currentMatch } = jt;
  const { rounds, bracketSize } = result;

  // ブラケット表示用にboxを広げる（8名トーナメントは700pxに収まらない）
  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  // 「現在の試合」かどうかを判定するヘルパー
  const isMatchDone = (ri, mi) => ri < currentRound || (ri === currentRound && mi < currentMatch);
  const isCurrentMatch = (ri, mi) => ri === currentRound && mi === currentMatch;

  // 次ラウンドが既に進んでいるか（勝者吹き出し非表示判定用）
  const nextRoundStarted = (ri) => {
    if (ri + 1 >= rounds.length) return false;
    for (let i = 0; i < rounds[ri + 1].matches.length; i++) {
      if (isMatchDone(ri + 1, i) || isCurrentMatch(ri + 1, i)) return true;
    }
    return false;
  };

  let html = `<div class="jt-phase">対戦表</div>`;
  html += `<div class="jt-wrap">${_jtHeader()}`;

  // === 8名ブラケット ===
  if (bracketSize === 8 && rounds.length === 3) {
    html += _jtBracket8(rounds, currentRound, currentMatch, isMatchDone, isCurrentMatch, nextRoundStarted);
  } else {
    // 4名ブラケット
    html += _jtBracket4(rounds, currentRound, currentMatch, isMatchDone, isCurrentMatch, nextRoundStarted);
  }

  // フォーカスカード（現在の試合）
  const curRound = rounds[currentRound];
  if (curRound && currentMatch < curRound.matches.length) {
    const match = curRound.matches[currentMatch];
    html += _jtFocusCard(match, curRound.name, currentRound, currentMatch);
  }

  // 全スキップボタン
  html += `<div style="text-align:center;margin-top:12px">`;
  html += `<button class="btn" style="padding:8px 24px;font-size:12px;opacity:0.6" onclick="App.jtSkipAll()">全試合スキップ →</button>`;
  html += `</div></div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** 8名ブラケットHTML */
function _jtBracket8(rounds, cRd, cMi, isDone, isCur, nrStarted) {
  const qf = rounds[0], sf = rounds[1], fn = rounds[2];
  let h = '<div class="jt-bk">';
  // 左QF (match 0,1)
  h += '<div class="jt-rd"><div class="jt-rl">準々決勝</div>';
  h += _jtBkMatch(qf, 0, 0, cRd, cMi, isDone, isCur, nrStarted);
  h += '<div class="jt-gap"></div>';
  h += _jtBkMatch(qf, 0, 1, cRd, cMi, isDone, isCur, nrStarted);
  h += '</div>';
  // connector QF→SF left
  h += '<div class="jt-cn" style="width:24px;min-height:220px"><svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 200"><line x1="0" y1="36" x2="24" y2="72" stroke="var(--border)" stroke-width="1.5"/><line x1="0" y1="154" x2="24" y2="118" stroke="var(--border)" stroke-width="1.5"/></svg></div>';
  // left SF (match 0)
  h += '<div class="jt-rd"><div class="jt-rl">準決勝</div><div style="height:52px"></div>';
  h += _jtBkMatch(sf, 1, 0, cRd, cMi, isDone, isCur, nrStarted);
  h += '<div style="height:52px"></div></div>';
  // connector SF→FN left
  h += '<div class="jt-cn" style="width:24px;min-height:220px"><svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 200"><line x1="0" y1="95" x2="24" y2="100" stroke="var(--border)" stroke-width="1.5"/></svg></div>';
  // Final
  h += '<div class="jt-rd" style="min-width:210px"><div class="jt-rl">🏆 決勝</div><div style="height:40px"></div>';
  h += _jtBkMatch(fn, 2, 0, cRd, cMi, isDone, isCur, nrStarted);
  h += '<div style="height:40px"></div></div>';
  // connector SF→FN right
  h += '<div class="jt-cn" style="width:24px;min-height:220px"><svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 200"><line x1="24" y1="95" x2="0" y2="100" stroke="var(--border)" stroke-width="1.5"/></svg></div>';
  // right SF (match 1)
  h += '<div class="jt-rd"><div class="jt-rl">準決勝</div><div style="height:52px"></div>';
  h += _jtBkMatch(sf, 1, 1, cRd, cMi, isDone, isCur, nrStarted);
  h += '<div style="height:52px"></div></div>';
  // connector QF→SF right
  h += '<div class="jt-cn" style="width:24px;min-height:220px"><svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 200"><line x1="24" y1="36" x2="0" y2="72" stroke="var(--border)" stroke-width="1.5"/><line x1="24" y1="154" x2="0" y2="118" stroke="var(--border)" stroke-width="1.5"/></svg></div>';
  // 右QF (match 2,3)
  h += '<div class="jt-rd"><div class="jt-rl">準々決勝</div>';
  h += _jtBkMatch(qf, 0, 2, cRd, cMi, isDone, isCur, nrStarted);
  h += '<div class="jt-gap"></div>';
  h += _jtBkMatch(qf, 0, 3, cRd, cMi, isDone, isCur, nrStarted);
  h += '</div>';
  h += '</div>';
  return h;
}

/** 4名ブラケットHTML */
function _jtBracket4(rounds, cRd, cMi, isDone, isCur, nrStarted) {
  const sf = rounds[0], fn = rounds[1];
  let h = '<div class="jt-bk">';
  // left SF
  h += '<div class="jt-rd"><div class="jt-rl">準決勝</div>';
  h += _jtBkMatch(sf, 0, 0, cRd, cMi, isDone, isCur, nrStarted);
  h += '</div>';
  // connector
  h += '<div class="jt-cn" style="width:24px;min-height:180px"><svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 200"><line x1="0" y1="80" x2="24" y2="100" stroke="var(--border)" stroke-width="1.5"/></svg></div>';
  // Final
  h += '<div class="jt-rd" style="min-width:210px"><div class="jt-rl">🏆 決勝</div>';
  h += _jtBkMatch(fn, 1, 0, cRd, cMi, isDone, isCur, nrStarted);
  h += '</div>';
  // connector
  h += '<div class="jt-cn" style="width:24px;min-height:180px"><svg width="24" height="100%" preserveAspectRatio="none" viewBox="0 0 24 200"><line x1="24" y1="80" x2="0" y2="100" stroke="var(--border)" stroke-width="1.5"/></svg></div>';
  // right SF
  h += '<div class="jt-rd"><div class="jt-rl">準決勝</div>';
  h += _jtBkMatch(sf, 0, 1, cRd, cMi, isDone, isCur, nrStarted);
  h += '</div>';
  h += '</div>';
  return h;
}

/** ブラケット内の1試合枠 */
function _jtBkMatch(round, ri, mi, cRd, cMi, isDone, isCur, nrStarted) {
  const match = round.matches[mi];
  if (!match) return '';
  const fin = isDone(ri, mi);
  const cur = isCur(ri, mi);
  const lWin = fin && match.winnerId === match.left.id;
  const rWin = fin && match.winnerId === match.right.id;

  // 前ラウンドが未消化なら TBD
  let leftKnown = true, rightKnown = true;
  if (ri === 1 && round.matches.length === 2) { // SF of 8-bracket
    if (!isDone(0, mi * 2)) leftKnown = false;
    if (!isDone(0, mi * 2 + 1)) rightKnown = false;
  } else if (ri === 2) { // Final of 8-bracket
    if (!isDone(1, 0)) leftKnown = false;
    if (!isDone(1, 1)) rightKnown = false;
  } else if (ri === 1 && round.matches.length === 1) { // Final of 4-bracket
    if (!isDone(0, 0)) leftKnown = false;
    if (!isDone(0, 1)) rightKnown = false;
  }

  let h = `<div class="jt-bm${cur ? ' act' : ''}">`;
  h += leftKnown ? _jtFighterCell(match.left, lWin, fin && !lWin, false) : _jtFighterCell(null, false, false, true);
  h += `<div class="jt-bvs">VS</div>`;
  h += rightKnown ? _jtFighterCell(match.right, rWin, fin && !rWin, false) : _jtFighterCell(null, false, false, true);
  h += `</div>`;

  // 勝者吹き出し（次ラウンド未開始時のみ）
  if (fin && !nrStarted(ri)) {
    const winner = lWin ? match.left : match.right;
    const winLine = getJuniorTournamentLine('postMatchWin', winner.personality || 'normal', winner.archetype || '_default');
    if (winLine) {
      h += `<div class="jt-bub" style="margin:5px auto;max-width:200px;font-size:11px;padding:7px 12px"><div class="sp gd">${winner.name}</div>「${winLine}」</div>`;
    }
  }
  return h;
}

/** フォーカスカード（stand画像向かい合わせ + セリフ + ボタン） */
function _jtFocusCard(match, roundName, ri, mi) {
  const f1 = match.left, f2 = match.right;
  const isFinal = roundName === 'final';
  const roundLabel = isFinal ? '🏆 決勝' : roundName === 'semiFinal' ? '準決勝' : '準々決勝';
  const standL = getStandUrl(f1.id, f1.ovr);
  const standR = getStandUrl(f2.id, f2.ovr);

  // セリフ
  const timing = isFinal ? 'preFinal' : 'preMatch';
  const lineL = getJuniorTournamentLine(timing, f1.personality || 'normal', f1.archetype || '_default');
  const lineR = getJuniorTournamentLine(timing, f2.personality || 'normal', f2.archetype || '_default');

  let h = `<div class="jt-mf jt-su">`;
  h += `<div class="jt-mf-lb">${roundLabel} — 第${mi + 1}試合</div>`;
  // names + condition
  h += `<div class="jt-mf-names">`;
  h += `<div class="jt-mf-nm"><div class="n">${f1.name}</div><div class="o">${f1._orgName || ''} OVR${f1.ovr}</div></div>`;
  h += `<div class="jt-mf-vl">VS</div>`;
  h += `<div class="jt-mf-nm"><div class="n">${f2.name}</div><div class="o">${f2._orgName || ''} OVR${f2.ovr}</div></div>`;
  h += `</div>`;
  // pre-match speech
  if (lineL || lineR) {
    h += `<div class="jt-bub-pair">`;
    if (lineL) h += `<div class="jt-bub"><div class="sp bl">${f1.name}</div>「${lineL}」</div>`;
    if (lineR) h += `<div class="jt-bub"><div class="sp bl">${f2.name}</div>「${lineR}」</div>`;
    h += `</div>`;
  }
  // stand images face-off
  h += `<div class="jt-mf-stands">`;
  h += `<div class="st left"><img src="${standL}" alt="${f1.name}" onerror="this.style.opacity=0"></div>`;
  h += `<div class="vs-mark">VS</div>`;
  h += `<div class="st right"><img src="${standR}" alt="${f2.name}" onerror="this.style.opacity=0"></div>`;
  h += `</div>`;
  // buttons
  h += `<div class="jt-bt">`;
  h += `<button class="btn btn-gold" style="padding:8px 20px;font-size:13px" onclick="App.jtWatchMatch(${ri},${mi})">観戦する</button>`;
  h += `<button class="btn" style="padding:8px 20px;font-size:13px" onclick="App.jtSkipMatch(${ri},${mi})">スキップ</button>`;
  h += `</div>`;
  h += `</div>`;
  return h;
}

/** JT 用: trimmed fighter (ovr のみ持つ) を _pbFighterBlock が使えるように拡張 */
function _jtFighterShim(f) {
  if (f == null) return f;
  if (f.pw != null && f.sp != null) return f;
  return { ...f, pw: f.ovr, sp: f.ovr, te: f.ovr, st: f.ovr, mn: f.ovr };
}

// ===== MATCH RESULT (Pattern B: pb-container) =====
function renderJuniorTournamentMatchResult(ri, mi) {
  const jt = App._jtPreview;
  if (!jt) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '';
  box.style.padding = '';
  box.style.background = '';
  box.style.border = '';

  const round = jt.result.rounds[ri];
  const match = round.matches[mi];
  const rounds = jt.result.rounds;
  const totalMatchesInTournament = rounds.reduce((s, r) => s + r.matches.length, 0);
  let matchPos = 0;
  for (let r = 0; r < ri; r++) matchPos += rounds[r].matches.length;
  matchPos += mi + 1;

  const isFinal = ri === rounds.length - 1;
  const roundLabel = round.name === 'final' ? '🏆 決勝' : round.name === 'semiFinal' ? '準決勝' : '準々決勝';
  const lWin = match.winnerId === match.left.id;
  const winner = lWin ? match.left : match.right;
  const leftF = _jtFighterShim(match.left);
  const rightF = _jtFighterShim(match.right);

  const winLine = getJuniorTournamentLine('postMatchWin', winner.personality || 'normal', winner.archetype || '_default');
  const leftCls = lWin ? 'is-winner' : 'is-loser';
  const rightCls = lWin ? 'is-loser' : 'is-winner';
  const leftLine = lWin ? (winLine || '') : '';
  const rightLine = lWin ? '' : (winLine || '');
  const hasDialogue = !!winLine;

  const metaLeft = `${match.left._orgName || ''}`.trim() || '—';
  const metaRight = `${match.right._orgName || ''}`.trim() || '—';
  const winnerLabel = `🏆 ${escHtml(winner.name)} WIN`;
  const seasonLabel = `第${G.season}回 JT`;

  let html = `<div class="pb-container">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-jt">🥇 JUNIOR TOURNAMENT</div>
    <div class="pb-banner-title is-jt">${escHtml(roundLabel)}</div>
    <div class="pb-banner-sub">${escHtml(seasonLabel)}<span class="dot">·</span>Match ${matchPos} / ${totalMatchesInTournament}<span class="dot">·</span>${isFinal ? 'Final' : `第${mi + 1}試合`}</div>
  </div>`;

  // Scoreboard: Round / Match / MQ / Finish
  html += `<div class="pb-score-strip" style="grid-template-columns:1fr 1fr 1fr 1.2fr">
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:var(--gold-light);font-size:20px">${escHtml(roundLabel)}</div>
      <div class="pb-score-lbl">Round</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val is-neutral">${matchPos}<span style="font-size:14px;color:var(--stage-text-dim)"> / ${totalMatchesInTournament}</span></div>
      <div class="pb-score-lbl">Match</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(match.mq)}</div>
      <div class="pb-score-val" style="margin-top:3px">${match.mq}</div>
      <div class="pb-score-lbl">MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="font-size:14px;color:var(--stage-text-main)">${escHtml(Engine.formatFinish(match.finType, match.finMove))}</div>
      <div class="pb-score-lbl">Finish</div>
    </div>
  </div>`;

  // 試合行（1試合のみ、メイン扱い）
  html += `<div class="pb-matches">`;
  html += `<div class="pb-divider is-main">${isFinal ? '🏆 FINAL' : '⚔ MATCH'} — ${escHtml(roundLabel)}</div>`;
  html += `<div class="pb-mrow is-main is-jt${hasDialogue ? ' has-dialogue' : ''}">`;
  html += _pbFighterBlock('left', leftF, leftCls, metaLeft, leftLine);
  html += _pbResultColumn({
    winnerLabel,
    winnerIsDraw: false,
    finishText: Engine.formatFinish(match.finType, match.finMove),
    turns: match.turns || 0,
    mq: match.mq
  });
  html += _pbFighterBlock('right', rightF, rightCls, metaRight, rightLine);
  if (match.hpLeft && match.hpRight) html += _pbHpMini(match.hpLeft, match.hpRight);
  html += `</div>`;
  html += `</div>`; // .pb-matches

  // Footer
  const nextLabel = isFinal ? '優勝発表へ →' : '次の試合へ →';
  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.jtAdvanceAfterResult(${ri},${mi})">${nextLabel}</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// HP バーカウンターアニメーション
function _jtAnimateCounter(from, to, dur, el, colorFn) {
  const st = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - st) / dur);
    const v = Math.round(from + (to - from) * p);
    el.textContent = v + '%';
    el.style.color = colorFn(v);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ===== CHAMPION (Pattern B pb-container) =====
function renderJuniorTournamentResult() {
  const jt = App._jtPreview;
  if (!jt) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '';
  box.style.padding = '';
  box.style.background = '';
  box.style.border = '';

  const { result } = jt;
  const { rounds, champion, runnerUp, semiFinalists } = result;
  const season = G.season;
  const upperUrl = getUpperUrl(champion.id);
  const PRIZE = Engine.juniorTournament.PRIZE;

  // チャンピオンの通算MQ + 決勝MQ + path
  let totalMQ = 0;
  let finalMQ = 0;
  const pathParts = [];
  rounds.forEach((round, ri) => {
    const abbr = round.name === 'final' ? 'F' : round.name === 'semiFinal' ? 'SF' : 'QF';
    const champMatch = round.matches.find(m => m.left.id === champion.id || m.right.id === champion.id);
    if (champMatch) {
      totalMQ += champMatch.mq;
      if (ri === rounds.length - 1) finalMQ = champMatch.mq;
      pathParts.push(abbr);
    }
  });
  const pathText = pathParts.join(' → ');
  const champOvr = champion.ovr != null ? champion.ovr : Engine.util.ov(_jtFighterShim(champion));

  // 優勝スピーチ
  const champLine = getJuniorTournamentLine('champion', champion.personality || 'normal', champion.archetype || '_default');

  let html = `<div class="pb-container">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-jt-champ">🏆 JT CHAMPION</div>
    <div class="pb-banner-title is-jt-champ">第${season}回 ジュニアトーナメント 優勝</div>
    <div class="pb-banner-sub">${escHtml(champion.name)}<span class="dot">·</span>${escHtml(champion._orgName || '')}</div>
  </div>`;

  // Scoreboard: Path / Total MQ / Final MQ / Prize / OVR
  html += `<div class="pb-score-strip" style="grid-template-columns:1.2fr 1fr 1fr 1fr 1fr">
    <div class="pb-score-cell">
      <div class="pb-score-val" style="font-size:18px;color:var(--gold-light);font-family:var(--font-label);letter-spacing:2px">${escHtml(pathText)}</div>
      <div class="pb-score-lbl">Path</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(Math.round(totalMQ / Math.max(1, pathParts.length)))}</div>
      <div class="pb-score-val" style="margin-top:3px">${totalMQ}</div>
      <div class="pb-score-lbl">Total MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(finalMQ)}</div>
      <div class="pb-score-val" style="margin-top:3px">${finalMQ}</div>
      <div class="pb-score-lbl">Final MQ</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:var(--gold);font-size:22px">¥${PRIZE.champion}<span style="font-size:12px"> 万</span></div>
      <div class="pb-score-lbl">Prize</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:var(--gold-light)">${champOvr}</div>
      <div class="pb-score-lbl">OVR</div>
    </div>
  </div>`;

  // Champion card
  html += `<div class="pb-champion-card">`;
  if (champLine) {
    html += `<div class="pb-champion-bubble">
      <div class="pb-champion-bubble-speaker">🏆 ${escHtml(champion.name)}</div>
      「${escHtml(champLine)}」
    </div>`;
  }
  html += `<div class="pb-champion-portrait">
    ${upperUrl ? `<img src="${upperUrl}" alt="${escHtml(champion.name)}" onerror="this.style.display='none'">` : ''}
    <div class="pb-champion-trophy">🏆</div>
  </div>`;
  html += `<div class="pb-champion-label">CHAMPION</div>`;
  html += `<div class="pb-champion-name">${escHtml(champion.name)}</div>`;
  html += `<div class="pb-champion-org">${escHtml(champion._orgName || '')}</div>`;
  html += `</div>`;

  // Runner-up + semifinalists
  const subEntries = [];
  if (runnerUp) {
    subEntries.push({ f: runnerUp, labelCls: 'is-runnerup', labelText: '2nd Place', prize: PRIZE.runnerUp });
  }
  if (semiFinalists) {
    semiFinalists.forEach(sf => {
      if (sf) subEntries.push({ f: sf, labelCls: 'is-semifinalist', labelText: 'Semifinalist', prize: PRIZE.semiFinal });
    });
  }
  if (subEntries.length > 0) {
    html += `<div class="pb-champion-sub">`;
    subEntries.forEach(e => {
      const face = getPortraitUrl(e.f.id);
      html += `<div class="pb-champion-sub-card ${e.labelCls}">
        <div class="pb-champion-sub-portrait">${face ? `<img src="${face}" alt="" onerror="this.style.display='none'">` : `<span class="pb-champion-sub-init">${escHtml((e.f.name || '?')[0])}</span>`}</div>
        <div class="pb-champion-sub-info">
          <div class="pb-champion-sub-label">${e.labelText}</div>
          <div class="pb-champion-sub-name">${escHtml(e.f.name)}</div>
          <div class="pb-champion-sub-org">${escHtml(e.f._orgName || '')}<span class="pb-champion-sub-prize">¥${e.prize}万</span></div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // プレイヤー団体賞金サマリー
  const playerIds = new Set((G.roster || []).map(f => f.id));
  let totalPrize = 0;
  const prizeDetails = [];
  if (champion && playerIds.has(champion.id)) {
    totalPrize += PRIZE.champion;
    prizeDetails.push({ name: champion.name, rank: '優勝', amt: PRIZE.champion });
  }
  if (runnerUp && playerIds.has(runnerUp.id)) {
    totalPrize += PRIZE.runnerUp;
    prizeDetails.push({ name: runnerUp.name, rank: '準優勝', amt: PRIZE.runnerUp });
  }
  if (semiFinalists) {
    semiFinalists.forEach(sf => {
      if (sf && playerIds.has(sf.id)) {
        totalPrize += PRIZE.semiFinal;
        prizeDetails.push({ name: sf.name, rank: '3-4位', amt: PRIZE.semiFinal });
      }
    });
  }
  if (totalPrize > 0) {
    html += `<div class="pb-champion-prizebox">
      <div class="pb-champion-prizebox-label">💰 自団体の獲得賞金</div>
      <div class="pb-champion-prizebox-list">
        ${prizeDetails.map(d => `<div class="pb-champion-prizebox-item"><span class="n">${escHtml(d.name)}</span><span class="r">${d.rank}</span><span class="a">¥${d.amt}万</span></div>`).join('')}
      </div>
      <div class="pb-champion-prizebox-total">合計 <span>¥${totalPrize}万</span></div>
    </div>`;
  } else {
    html += `<div class="pb-champion-prizebox is-empty">自団体からの入賞者はいませんでした</div>`;
  }

  // Footer
  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.finalizeJuniorTournament()">閉じる</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}
