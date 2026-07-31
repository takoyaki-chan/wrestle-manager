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
/** 「自己最高値からどれだけ落ちたか」を見せるための計算。
 *
 *  返す割合はどれもバー全体(0〜barMax)に対する%。
 *    cur  … 現在値
 *    lost … 現在値 → **自己最高値(statPeak)** まで、途切れず続く帯
 *    lostPts … 落ちた量（peak − cur）。バーの▼N と同じ数字
 *
 *  基準は `fighter.statPeak`。Engine.growth.trackStatPeaks が**毎週**控えている。
 *
 *  2026-07-27 に基準を2度直している。経緯を残す:
 *    1度目: 帯を [trainCap, trainCapOrigin] に置いていた。
 *           帯の左端がそのまま trainCap の位置になり、**伏せてある天井の値が読めた**。
 *           現在値との間に隙間も空き、バーが分断されて見えた。
 *    2度目(現在): 起点を現在値へ寄せただけでは足りなかった。
 *           **trainCapOrigin は「伸ばせる上限」であって、実際に到達した値ではない**。
 *           MN のように上限まで伸びにくいステータスでは、一度も届いていない高さまで
 *           帯が伸び、「そんなに高かったはずがない」表示になっていた（Keisuke 指摘）。
 *           さらに trainCapOrigin は初回衰退時にしか記録されないため、
 *           **年をまたぐまで表示が出なかった**。
 *           → 実際に到達した最高値を毎週控え、そこを基準にする。
 *
 *  statPeak を持たない選手（既存セーブの初回ロード前）は lost=0 で色は一切出ない。
 *  **衰えの履歴を捏造しない**という方針は据え置き。 */
function statDecayView(fighter, stat, barMax, recoverKnownCapLoss = false) {
  const max = barMax || 150;
  const cur = Math.max(0, Math.round((fighter && fighter[stat]) || 0));
  // 基準は**自己最高値**(statPeak)。毎週 Engine.growth.trackStatPeaks が控えている。
  const recordedPeak = (fighter && fighter.statPeak && fighter.statPeak[stat] != null)
    ? Math.round(fighter.statPeak[stat]) : null;
  // AI団体は statPeak を保存していないため、消耗時に実際に記録された天井差だけから
  // 最高値を復元する。既存セーブ一般には適用せず、履歴の捏造はしない。
  const capRatio = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.wearCapDecayRatio) || 0;
  const capLost = recoverKnownCapLoss && fighter && fighter.trainCapOrigin && fighter.trainCap && capRatio > 0
    ? Math.max(0, Math.round((fighter.trainCapOrigin[stat] || 0) - (fighter.trainCap[stat] || 0))) : 0;
  const recoveredPeak = capLost > 0 ? Math.round(cur + capLost / capRatio) : null;
  const peak = recordedPeak != null ? recordedPeak : recoveredPeak;
  const lostPts = peak != null ? Math.max(0, peak - cur) : 0;
  const pct = v => Math.max(0, Math.min(100, (v / max) * 100));
  // 帯は現在値から自己最高値まで。落ちていなければ帯は出ない
  const spanPct = lostPts > 0 ? Math.max(0, pct(peak) - pct(cur)) : 0;
  return {
    curPct: pct(cur),
    lostPts,
    lostPct: spanPct,
    lostFromRightPct: spanPct > 0 ? Math.max(0, 100 - pct(peak)) : 0,
  };
}

if (typeof window !== 'undefined') window.statDecayView = statDecayView;

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

/** 挑戦試合で他団体から来ているゲスト選手の所属orgId。自団体所属なら null。
 *  挑戦試合は 2026-07-21(2e1092b)から通常興行のカードに混ざって出るようになったため、
 *  「どちらが他団体の選手か」はこのフラグでしか分からない。 */
function guestOrgIdOf(fighter) {
  if (!fighter) return null;
  if (fighter.isCRGuest) return fighter._crGuestOrgId || null;
  if (fighter.isB3ChallengeGuest) return fighter._b3GuestOrgId || null;
  return null;
}

/** 対戦カードに他団体の選手が絡むときだけ、その選手の団体エンブレムを返す
 *  (mockup-baseline-v0.1 §5「出す条件: 他団体が絡む試合のみ」)。 */
function crossOrgEmblemHtml(fighter, opponent, size = 16) {
  const own = guestOrgIdOf(fighter);
  const other = guestOrgIdOf(opponent);
  if (String(own || 'player') === String(other || 'player')) return '';
  return typeof orgIconHtml === 'function' ? orgIconHtml(own || 'player', size) : '';
}

// ── U3 グループB 共通: 「2人が対置して語る」画面の顔出しブロック生成 ──────────
// 仕様: docs/ui/mockup-baseline-v0.1.md §2〜§5。縦順は固定:
//   吹き出し(予約枠) → 画像 → 名前 → 役割ラベル → 団体バッジ → 数値(OVR等)
// 対象: _rivalryCol(.vd-*) / showFactionF08Modal(.fevt-bubble) /
//       showFactionF08Pre/AftermathModal・showInternalChallengePre/PostModal(.fevt-arena-bubble) /
//       _factionF02RenderClash(.fevt-dialogue-bubble) /
//       showFactionCommon3/Common1Modal・showChallengeRequestModal(.fc1m-bubble-wrap)
// 色は呼び出し元が祖先要素に .u3b-theme-cream / .u3b-theme-dark / .u3b-theme-stage を
// 付ける(構造はここで共通化、配色はCSS変数経由でカテゴリごとに切り替える)。
/**
 * @param {Object} o
 *   name, imgUrl, line, role(役割ラベル文字列 or null), isLoser(bool),
 *   size('xl'|'l'|'m'|'s'|'chip'。既定'm'=132×194。U3グループA「1人が語る」画面用に
 *     xl=172×258/s=108×162/chip=40×40丸を追加。isBigは旧互換で size:'l' と同じ),
 *   isBig(旧互換。true で L サイズ 150×224。「1人ずつ見せる」勝者非対称画面のみ使う),
 *   small(true で吹き出し枠46px。既定は52px。sizeが's'/'chip'のときは自動でそれぞれ46px/40pxになる),
 *   statLabel, statValue(nullなら数値行を省く),
 *   orgBadge: { orgId, orgName, isHome } | null, orgHtml(prebuilt HTML優先),
 *   bubbleClass / portraitClass / extraSideClass / slotClass(安全網テスト互換のため既存クラス名を co-class する),
 *   onClick(画像・名前クリックのonclick属性文字列。選手詳細への導線がある画面のみ),
 *   extraHtml(数値行の後ろに追加するHTML。fc1mの5項目比較などスクリーン固有の内容),
 *   roleHtml(役割ラベルを生のHTMLで差し込む。旧 vd-badge-w/l のような既存装飾を保つ場合に role の代わりに使う),
 *   imgHtml(画像タグを生のHTMLで差し込む。imgUrlが空でも<img>タグ自体は出したい画面向け。指定時はimgUrl/fallbackより優先),
 *   fallback(imgUrl/imgHtmlが無いときに .u3b-upper-fallback へ差し込む頭文字・絵文字などの文字列。
 *     escHtml済みで出力するため呼び出し側は生文字列でよい)
 */
function _u3bSideHtml(o) {
  o = o || {};
  const name = escHtml(o.name != null ? o.name : '?');
  const line = (o.line != null && o.line !== '') ? escHtml(o.line) : '';
  const bubbleCls = ['u3b-bubble', o.bubbleClass].filter(Boolean).join(' ');
  const bubbleInner = line ? `<div class="${bubbleCls}"><div class="u3b-bubble-text">${line}</div></div>` : '';
  const sizeKey = o.size || (o.isBig ? 'l' : 'm');
  const slotSizeCls = o.small ? 'is-s' : (sizeKey === 's' ? 'is-s' : sizeKey === 'chip' ? 'is-chip' : '');
  const slotCls = ['u3b-bubble-slot', slotSizeCls, o.slotClass].filter(Boolean).join(' ');
  const upperSizeCls = sizeKey === 'xl' ? 'is-xl' : sizeKey === 'l' ? 'is-l' : sizeKey === 's' ? 'is-s' : sizeKey === 'chip' ? 'is-chip' : '';
  const upperCls = ['u3b-upper', upperSizeCls, o.portraitClass].filter(Boolean).join(' ');
  const clickAttr = o.onClick ? ` style="cursor:pointer" onclick="${o.onClick}"` : '';
  const imgHtml = o.imgHtml != null ? o.imgHtml : (o.imgUrl
    ? `<img src="${escHtml(o.imgUrl)}" alt="" onerror="this.style.display='none'">`
    : (o.fallback != null ? _u3bInitialFallback(o.fallback) : ''));
  const roleHtml = o.roleHtml != null ? o.roleHtml : (o.role ? `<div class="u3b-role">${escHtml(o.role)}</div>` : '');
  const orgHtml = o.orgHtml != null ? o.orgHtml : (o.orgBadge ? _u3bOrgBadgeHtml(o.orgBadge) : '');
  const statHtml = (o.statValue != null && o.statValue !== '')
    ? `<div class="u3b-stat"><small>${escHtml(o.statLabel || 'OVR')}</small>${escHtml(o.statValue)}</div>`
    : '';
  const sideCls = ['u3b-side', o.isLoser ? 'is-loser' : '', o.extraSideClass].filter(Boolean).join(' ');
  return `<div class="${sideCls}">
    <div class="${slotCls}">${bubbleInner}</div>
    <div class="${upperCls}"${clickAttr}>${imgHtml}</div>
    <div class="u3b-copy">
      <div class="u3b-name"${clickAttr}>${name}</div>
      ${roleHtml}
      ${orgHtml}
      ${statHtml}
      ${o.extraHtml || ''}
    </div>
  </div>`;
}

/** 顔画像が無いときの汎用フォールバック(.u3b-upper 内へ差し込む頭文字/絵文字)。
 *  U3グループA(2026-07-25): 1人が語る画面のうち「画像URLが空でも必ず何かが見える」べき
 *  画面向けに追加。label は escHtml 済みで出力するので呼び出し側は生文字列を渡してよい。 */
function _u3bInitialFallback(label) {
  return `<div class="u3b-upper-fallback">${escHtml(label != null ? label : '?')}</div>`;
}

/** 団体バッジ(.u3b-org-badge)。実エンブレム画像を使う(mockup-baseline §5)。
 *  他団体が絡む試合でのみ呼び出し側が渡す(自団体完結の画面は badge=null で省く)。 */
function _u3bOrgBadgeHtml(badge) {
  if (!badge || !badge.orgName) return '';
  const sideCls = badge.isHome === false ? 'u3b-org-away' : 'u3b-org-home';
  const path = badge.orgId != null && typeof Engine !== 'undefined' && Engine.util
    ? (badge.orgId === 'player'
        ? (typeof Engine.util.getPlayerOrgIconPath === 'function' ? Engine.util.getPlayerOrgIconPath(G) : '')
        : (typeof Engine.util.getOrgIconPath === 'function' ? Engine.util.getOrgIconPath(G, badge.orgId) : ''))
    : '';
  const emblem = path ? `<img src="${escHtml(path)}" alt="" loading="lazy">` : '';
  return `<div class="u3b-org-badge ${sideCls}"><span class="u3b-org-emblem">${emblem}</span><span class="u3b-org-name">${escHtml(badge.orgName)}</span></div>`;
}

// ── Popup Queue System ──────────────────────────────────────────────────
// ポップアップの重複表示を防止する。1つのポップアップが表示中は、
// 新しいポップアップをキューに入れて順番待ちさせる。
const _POPUP_OVERLAY_IDS = [
  // U4(2026-07-26): eventPopupOverlay/retirementPopupOverlay/rivalryPopupOverlay/milestoneOverlay は
  // 開く側のコードが無い死んだ枠だったため、CSS/DOM削除と合わせてここからも外した。
  // newspaperOverlay(旧 v1.4w 新聞パネル)は 2026-07-27 に撤去。業界ニュースは📰新聞へ一本化
  'growthEventOverlay', 'seasonFanfareOverlay',
  'awardsOverlay', 'careModalOverlay', 'notifModalOverlay',
  'careOverlay', 'fighterPopupOverlay', 'coachTooltipOverlay', 'showResultOverlay',
  // 統一モーダル(Phase 0以降)
  'mdlAOverlay', 'mdlBOverlay', 'mdlCOverlay', 'mdlDOverlay',
  'glimpseCascadeOverlay',
  // U4(2026-07-26): 登録漏れを1件ずつ追加(都度npm testで確認)。ppvMatchCardOverlayは
  // 週送り中に他のポップアップと重なると二重表示や操作不能になりうる懸念が最も強かったもの
  'ppvMatchCardOverlay',
  // relmapPopupOverlay(相関図の比較)はid="relmapPopupOverlay"がui-render.jsのテンプレート文字列側で
  // 生成される動的オーバーレイ(相関図タブ表示中のみDOMに存在)。idは固定文字列なのでgetElementById方式で登録できる
  'relmapPopupOverlay',
  // travelSceneOverlay(移動演出)も同様にid固定の動的オーバーレイ(showTravelScene実行中のみDOMに存在)
  'travelSceneOverlay'
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
  const factionRoot = document.getElementById('factionEventRoot');
  if (factionRoot && factionRoot.querySelector('.fevt-overlay-stage.active, .fevt-overlay-office.active, .fevt-overlay-arena.active, .fevt-narration-act.active')) {
    return true;
  }
  // 動的オーバーレイ（war-victory-overlayなど、DOMに直接追加されるもの）
  if (document.querySelector('.war-victory-overlay')) return true;
  // U4(2026-07-26): db-hof-detail-overlay/cerem-overlayはid無しでdocument.createElementされる
  // 動的モーダルのため(毎回新規生成・id不定)、_POPUP_OVERLAY_IDSのid方式ではなくクラスで検出する。
  // cerem-overlay(ドーム到達などの節目セレモニー)はshowCeremonyEvent実行中のみDOMに存在する
  if (document.querySelector('.db-hof-detail-overlay')) return true;
  return !!document.querySelector('.cerem-overlay');
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

// U4(2026-07-26): 「情報を見るだけ」系オーバーレイの共通ESCハンドラ
// (docs/ui/mockup-baseline-v0.1.md v0.6 §5-C: 情報を見るだけ=背景クリックとESCの両方で閉じられる)。
// 対象は選手ポップアップ・コーチ情報・殿堂入り詳細・新聞・成長イベント報告。
// 画面ごとにキーハンドラを書かず、ここに集約する(1つだけ・スクリプト読み込み時に一度だけ登録)。
// 相関図の比較(relmapPopupOverlay)は既存の専用ハンドラ(ui-render.js、右クリックメニューの
// ESC閉じも兼ねる)が既に正しく動作しているため、ここでは重複登録しない。
// 選択を迫るもの・演出(mdl-a/b、gameover等)はここに含めない(誤ってESCで進行が壊れるのを防ぐため)。
function _handleInfoOverlayEscClose(e) {
  if (e.key !== 'Escape') return;
  const fighterPopup = document.getElementById('fighterPopupOverlay');
  if (fighterPopup && fighterPopup.classList.contains('active')) { closeFighterPopup(); return; }
  const coachTooltip = document.getElementById('coachTooltipOverlay');
  if (coachTooltip && coachTooltip.classList.contains('active')) { closeCoachTooltip(); return; }
  const hofDetail = document.querySelector('.db-hof-detail-overlay');
  if (hofDetail) { hofDetail.remove(); return; }
  const growthEvent = document.getElementById('growthEventOverlay');
  if (growthEvent && growthEvent.classList.contains('active')) { closeGrowthEventPopup(); return; }
}
document.addEventListener('keydown', _handleInfoOverlayEscClose);

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
  _drainPopupQueue();
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

/** B型 ソロステージ(1選手中央)。opts.sepia で琥珀掛かったアクセント(受諾/年齢引退など穏やかな別れ)。
 *  U3グループA統一(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1)。
 *  節目(引退)の主役なので size:'xl'(172×258、指示書の明示指定)。画像URLが空でも頭文字フォールバックを
 *  出すよう修正(あわせて直すもの#2)。旧 _mdlBSpeech(このソロ画面専用だった頭上吹き出し実装)は
 *  役目を終えたため削除し、共通の _u3bSideHtml 吹き出しへ統合した */
function _mdlBSoloStage(fighter, speech, opts) {
  opts = opts || {};
  if (!fighter) return '<div class="mdl-b-solo-stage"></div>';
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
  const meta = opts.meta || `AGE ${fighter.age || '—'} ・ OVR ${(typeof Engine !== 'undefined' && Engine.util) ? Engine.util.ov(fighter) : ''}`;
  const stageCls = ['mdl-b-solo-stage', opts.sepia ? 'sepia' : '', 'u3b-theme-stage', opts.sepia ? 'is-sepia' : '']
    .filter(Boolean).join(' ');
  return `<div class="${stageCls}">${_u3bSideHtml({
    name: fighter.name, line: speech && speech.text, imgUrl: upperUrl,
    fallback: (fighter.name || '?').charAt(0), size: 'xl',
    role: meta,
    bubbleClass: 'mdl-b-speech',
  })}</div>`;
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
function _mdlDOpen(html, variant) {
  const box = document.getElementById('mdlDBox');
  const overlay = document.getElementById('mdlDOverlay');
  if (!box || !overlay) return;
  // **クラスは毎回ここでリセットする。**
  // 以前は呼び出し側が box.className を書き換えっぱなしにできたため、一度クリーム地の
  // 号外を出すと**その後のD型モーダルが全部クリーム地**になっていた。確認ダイアログは
  // 本文に暗色地前提の色トークン(--gold / --text-sub)を埋めているので、クリーム地に
  // 白文字が乗って読めなくなる(2026-07-31 Keisuke 実機: 興行確認が読めない)。
  box.className = 'mdl-d-box' + (variant ? ' ' + variant : '');
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
// opts.portraitUrl / opts.name / opts.meta を渡すと、選手以外(コーチなど)も
// **同じ見た目で**立たせられる。見た目を2箇所に書くと必ず片方だけ古くなるので、
// コーチ枚もこの関数を通すこと。
function _mdlASubjectStage(fighter, bodyHtml, opts) {
  const size = (opts && opts.small) ? { w: 120, h: 160 } : { w: 140, h: 184 };
  const override = (opts && opts.portraitUrl !== undefined);
  let portraitHtml = '';
  if (fighter || override) {
    const upperUrl = override ? opts.portraitUrl
      : ((typeof getUpperUrl === 'function') ? getUpperUrl(fighter.id) : '');
    const faceUrl  = (!override && typeof getPortraitUrl === 'function') ? getPortraitUrl(fighter.id) : '';
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
  const name = (opts && opts.name !== undefined) ? opts.name : (fighter ? (fighter.name || '') : '');
  const meta = (opts && opts.meta !== undefined) ? opts.meta : (fighter
    ? `AGE ${fighter.age || '—'} ・ OVR ${(typeof Engine !== 'undefined' && Engine.util) ? Engine.util.ov(fighter) : ''} ・ ${String(fighter.style || '').toUpperCase() || 'FIGHTER'}`
    : '');
  return `<div class="mdl-a-subject-stage">
    ${portraitHtml}
    ${name ? `<div class="mdl-a-subject-name">${name}</div>` : ''}
    ${meta ? `<div class="mdl-a-subject-org">${meta}</div>` : ''}
    <div class="mdl-a-subject-divider"></div>
    ${bodyHtml || ''}
  </div>`;
}

function _handlePatternBResultClose(event) {
  const closeBtn = event.target.closest('.pb-close-btn, .sr-close-btn');
  if (!closeBtn) return;
  // トーナメント進行中は干渉しない（各ボタンは onclick で専用の次試合処理を行う）
  if (App._jtPreview || App._tcPreview || App._awPreview) return;
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
}

document.addEventListener('click', _handlePatternBResultClose);

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

// ── C-4 P2: 宣言的ツールチップ(data-tip) ───────────────
// title 属性はスマホで一切表示されないため、説明系ティップスは data-tip に寄せる。
// 属性を書いておくだけで、下の委譲リスナーが PCホバー+モバイルタップ の両方を拾う。
// title 属性は「なくても困らない冗長情報」専用に格下げ(C-4 方針)。
function _tipAttr(html) {
  return `data-tip="${escHtml(html)}"`;
}
// ℹ型トリガーアイコン(列見出しやボタン群の隣に置く小さな「?」)
function _tipIcon(html) {
  return `<span class="tt" ${_tipAttr(html)}>?</span>`;
}
document.addEventListener('mouseover', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
  if (el) showCustomTooltip(el, el.getAttribute('data-tip'));
});
document.addEventListener('mouseout', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
  // 子要素間の移動では消さない(relatedTarget がまだ el 内なら維持)
  if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) hideCustomTooltip();
});
// タップ表示: capture 段階で拾い、親要素の onclick(列ソート等)より先に伝播を止める。
//
// **押せる部品には手を出さないこと。**
// 2026-07-26: ⚡追い込みボタンに説明文(data-tip)を足した瞬間、ここで click が
// 食い止められて **ボタンが完全に無反応**になった。説明を足しただけで機能が死ぬ。
// 止めてよいのは「ℹ️ や見出しの ? のように、押しても何も起きない印」だけ。
document.addEventListener('click', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
  if (!el) return;
  showCustomTooltip(el, el.getAttribute('data-tip'));
  // data-tip の**内側**に押せる部品があるなら、その click は本人のもの。通す
  const ctrl = e.target.closest('button,a,input,select,textarea,[onclick]');
  if (ctrl && (ctrl === el || el.contains(ctrl))) return;
  e.stopPropagation();
}, true);

// ── War Challenge Dialogue Generator (personality×archetype) ──
function getWarChallengeDialogue(fighter, orgName) {
  if (typeof WAR_CHALLENGER_DIALOGUE !== 'undefined') {
    return pickDialogueLine(WAR_CHALLENGER_DIALOGUE, fighter);
  }
  return '…挑戦状を叩きつける';
}

// ── War Challenge Popup (F3: president delivers the challenge) ──
function showWarChallenge() {
  const run = () => {
  const ev = G.pendingEvent;
  if (!ev || ev.type !== 'war') return;
  Audio.play('war');

  try { Audio.bgm.playStage('war'); } catch(e) {}

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
  };
  _enqueuePopup(run);
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

      // 通常の pb-fighter 枠のみ使用（is-player-side / is-enemy-side のサイドアクセントは
      // 勝者/敗者の標準フレームと二重表示になっていたため撤去）
      const leftBlock = _pbFighterBlock('left', pf, leftCls, playerOrgName, leftLine);
      const rightBlock = _pbFighterBlock('right', af, rightCls, ev.opponentName, rightLine);
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

      // 通常の pb-fighter 枠のみ使用（サイドアクセント撤去）
      const leftBlock = _pbFighterBlock('left', pf, '', playerOrgName, lineL || '');
      const rightBlock = _pbFighterBlock('right', af, '', ev.opponentName, lineR || '');

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
  else if (playerWins === aiWins) { verdictLabel = '⚖ 決着つかず'; verdictColor = 'var(--c-warning)'; }
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
    // 通常の pb-fighter 枠のみ使用（is-player-side / is-enemy-side のサイドアクセントは
    // 勝者/敗者の標準フレームと二重表示になっていたため撤去）
    const leftBlock = _pbFighterBlock('left', pf, `${leftCls}`, playerOrgName, '');
    const rightBlock = _pbFighterBlock('right', af, `${rightCls}`, ev.opponentName, '');

    const winnerLabel = `🏆 ${escHtml(playerWon ? pf.name : af.name)} WIN`;
    const rowCls = `pb-mrow${isMain ? ' is-main' : ''}`;

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
    <button type="button" class="pb-close-btn" onclick="event.stopPropagation();closeWarFinalResult(${eventWon})">閉じる</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

let _warVictoryWinners = [];
let _warPostCtx = null;

function _getWarVictoryLine(fighter, state) {
  // firing-grudge-spec-v0.1 Phase 5: 解雇キャラが元雇用団体相手に勝った war 試合では vsExEmployer を優先抽選（50%）
  // war は基本「player team vs AI org(_warPostCtx.ev.opponentOrgId)」。fighter の grudge.vsOrgId が
  // 対戦相手 org と一致するケースを汎用的に検出。
  const opponentOrgId = (_warPostCtx && _warPostCtx.ev && _warPostCtx.ev.opponentOrgId) || null;
  if (fighter && fighter.grudge && fighter.grudge.vsOrgId
      && opponentOrgId && fighter.grudge.vsOrgId === opponentOrgId
      && fighter.grudge.intensity >= 60
      && typeof getVsExEmployerLine === 'function') {
    const ctxState = state || (typeof G !== 'undefined' ? G : null);
    if (ctxState) {
      const nowAbs = (ctxState.season - 1) * 20 + (ctxState.week || 1);
      const firedAbs = ((fighter.grudge.issuedSeason || 1) - 1) * 20 + (fighter.grudge.issuedWeek || 1);
      if (nowAbs - firedAbs <= 24 && nowAbs - firedAbs >= 0 && Math.random() < 0.5) {
        const line = getVsExEmployerLine(fighter, 'win', opponentOrgId);
        if (line) return line;
      }
    }
  }
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
  overlay.className = 'war-victory-overlay u3b-theme-stage is-victory';
  const portraitUrl = getPortraitUrl(w.id);
  const line = _getWarVictoryLine(w);
  // U3グループA統一(2026-07-26): 1人ずつ全画面モーダルを▶で送る演出であり一覧ではないため、
  // 他のグループA画面と同じ規則で顔出しブロックを _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1)。
  // 1人を主役として見せるモーダルなので size:'m'(132×194)以上を採用
  const sideHtml = _u3bSideHtml({
    name: w.name, line, imgUrl: portraitUrl,
    fallback: (w.name || '?').charAt(0), size: 'm',
    bubbleClass: 'war-victory-line', portraitClass: 'war-victory-img',
  });
  overlay.innerHTML = `
    <div class="war-victory-modal">
      ${sideHtml}
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
  const eColor = orgCfg.color || '#e74c3c';

  // U3グループA統一(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1)。
  // Stage(対抗戦サマリ後の全画面オーバーレイ、--stage-*系トークン)。相手団体のエースなので
  // .u3b-theme-stage.is-hostility(既存の敵陣アクセント)+ 団体バッジ(away、実エンブレム)。
  // 団体の「大将」格として size:'l'(150×224)。旧 pb-ace-label/pb-ace-speaker の重複表記
  // (団体名を2回出していた)は role="ACE" + 団体バッジに統合(情報は保持、表記だけ整理)
  const sideHtml = _u3bSideHtml({
    name: enemyAce.name, line: dialogue, imgUrl: upperUrl,
    fallback: (enemyAce.name || '?').charAt(0), size: 'l',
    isLoser: !!eventWon, role: 'ACE',
    orgBadge: { orgId: ev.opponentOrgId, orgName: ev.opponentName, isHome: false },
    bubbleClass: 'pb-ace-bubble', portraitClass: 'pb-ace-portrait',
  });

  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay war-ace-overlay u3b-theme-stage is-hostility';
  overlay.style.setProperty('--pb-enemy-color', eColor);
  overlay.innerHTML = `
    <div class="war-ace-modal pb-container" style="--pb-enemy-color:${eColor}">
      <div class="pb-ace-area" style="margin-top:0">
        ${sideHtml}
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

// ── MQ再設計P4 §5.3: 大ニュース週頭通知モーダル ──
// weeklyNewspaper.isBigNews の週に1回だけ表示。号外リード1行+「紙面を読む」/「あとで」。
// variant: 'seasonOpening' を渡すと、大ニュースではない**シーズン開幕号**の文言になる
// （枠・音・導線は大ニュースと同じものを使う）。
function showBigNewsPopup(topStory, variant) {
  if (_isPopupActive()) { _popupQueue.push(() => showBigNewsPopup(topStory, variant)); return; }
  if (!topStory) { _drainPopupQueue(); return; }
  const leadPool = (variant === 'seasonOpening')
    ? ((typeof SEASON_OPENING_NEWS_LEAD_LINES !== 'undefined') ? SEASON_OPENING_NEWS_LEAD_LINES : [])
    : ((typeof BIG_NEWS_LEAD_LINES !== 'undefined') ? (BIG_NEWS_LEAD_LINES[topStory.type] || []) : []);
  const pickIdx = leadPool.length > 0 ? ((G.season || 0) * 7 + (G.week || 0)) % leadPool.length : 0;
  let lead = leadPool.length > 0 ? leadPool[pickIdx] : '号外――大ニュースが届いた';
  const mqVal = topStory.newsData && topStory.newsData.mq;
  if (mqVal != null) lead = lead.replace(/\{mq\}/g, mqVal);

  _mdlDOpen(`
    <div class="bignews-icon-dropin">📰</div>
    <div class="mdl-d-title" style="text-align:center">${_escapeHtml(lead)}</div>
    <div class="mdl-d-actions">
      <button class="mdl-d-btn primary" onclick="_mdlDClose();_drainPopupQueue();showScreen('newspaper')">紙面を読む</button>
      <button class="mdl-d-btn secondary" onclick="_mdlDClose();_drainPopupQueue()">あとで</button>
    </div>
  `, 'cream bignews');
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

// ── セーブスロット名 入力モーダル（showConfirmと同系統の D型モーダルを流用） ──
// input の maxlength は UTF-16 コード単位でカウントされるため、絵文字等のサロゲートペア文字だけを
// 入力すると SAVE_NAME_MAX_LEN(コードポイント基準)の半分で頭打ちになってしまう。
// そのため maxlength は 2倍に緩め、実際の32文字上限は送信時に _sanitizeSaveNameLabel（コードポイント基準）で確定させる。
function showSaveNameModal(slot) {
  Audio.play('notify');
  const info = Storage.getSaveInfo(slot);
  const currentName = (info && info.name) || '';
  window._saveNameModalSlot = slot;
  _mdlDOpen(`
    <div class="mdl-d-title">セーブ名を変更</div>
    <div class="mdl-d-body">スロット${slot}の表示名を設定します。空欄のまま決定すると名前を解除します。</div>
    <input id="mdlSaveNameInput" class="mdl-d-input" type="text" maxlength="${SAVE_NAME_MAX_LEN * 2}"
      value="${_escapeHtml(currentName)}" placeholder="例: メインセーブ（${SAVE_NAME_MAX_LEN}文字まで）"
      onkeydown="if(event.key==='Enter'){event.preventDefault();_confirmSaveNameModal();}">
    <div class="mdl-d-actions">
      <button class="mdl-d-btn primary" onclick="_confirmSaveNameModal()">決定</button>
      <button class="mdl-d-btn secondary" onclick="_mdlDClose()">キャンセル</button>
    </div>
  `);
  setTimeout(() => {
    const el = document.getElementById('mdlSaveNameInput');
    if (el) { el.focus(); el.select(); }
  }, 50);
}

function _confirmSaveNameModal() {
  const slot = window._saveNameModalSlot;
  const el = document.getElementById('mdlSaveNameInput');
  const val = el ? el.value : '';
  _mdlDClose();
  if (slot == null) return;
  renameSaveSlot(slot, val);
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
  // U7: 1人の去就をここで決める場面なので、丸い小アイコンではなく 2:3 のアッパーを
  // S(108×162) で見せる(§2 の梯子)。押せば選手詳細に戻れる
  const fUpper = (typeof getUpperUrl === 'function') ? getUpperUrl(fighter.id) : '';
  const fUrl = getPortraitUrl(fighter.id);
  html += `<div style="display:flex;align-items:center;gap:12px;margin:16px 8px 12px;padding:12px;background:var(--bg-card);border:1px solid ${rc}33;border-radius:8px">`;
  if (fUpper) html += `<img src="${fUpper}" class="u7-poach-upper" style="border-color:${rc}" onclick="event.stopPropagation();showFighterPopup(${Number(fighter.id)})" onerror="this.style.display='none'" alt="">`;
  else if (fUrl) html += `<img src="${fUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${rc};object-fit:cover" alt="">`;
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
      Audio.play('offer');
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

  Audio.play(nr.success ? 'victory' : 'reject');

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

  // これは契約前の確認画面。成立音は confirmSigning → App.signFighter 側だけで鳴らす。
  Audio.play('offer');

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
  html += `<div style="font-size:13px;letter-spacing:2px;color:${color};font-weight:700">✍ 契約セレモニー ${getJoinSourceBadge('fa')}</div>`;
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
  const welcomeQuote = fighter ? getJoinGreeting(fighter) : 'よろしくお願いします！';
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
        html += `<span class="coach-match-chip ${sm.cls}">${portraitImg(ch.id, 24, '', true)} ${fLink(ch, {source:'roster', size:'11px'})} <strong style="color:var(--gold)">${ov(ch)}</strong>${matchIcon}</span>`;
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
  'M-19': { title: '⚡ BF/Heel 衝突',         tone: 'negative', priority: 3 },
  'M-20': { title: '💸 引き抜きの遺恨',       tone: 'negative', priority: 3 },
  'M-21': { title: '😭 引き留め失敗の遺恨',   tone: 'negative', priority: 4 },
  'M-22': { title: '🥀 引退の置き土産',       tone: 'negative', priority: 2 },
  'M-23': { title: '🚪 突然離脱の波紋',       tone: 'negative', priority: 3 },
  // bond-rivalry plan P-4: ロッカー荒廃（同団体内 bond≤30 ペアが3組以上）
  'M-24': { title: '🌫️ ロッカールームの崩壊', tone: 'negative', priority: 4 },
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

function _flagPickArchetype(fighter) {
  return (fighter && fighter.archetype) || 'normal';
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
  const archetype = _flagPickArchetype(speaker);
  const lineSeed = (speakerId || 0) ^ (targetId || 0) ^ (modal.season || 0) * 31 + (modal.week || 0);
  const tmpl = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickLine(modal.type, archetype, lineSeed)
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
  const rArchetype = _flagPickArchetype(returner);
  const rSeed = (p.returnerId || 0) * 13 + (modal.week || 0);
  const rLine = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickSubLine('M-12', 'returner', rArchetype, rSeed)
    : '';
  const reactionLines = reactions.map(r => {
    const rem = _findFighterById(r.byId);
    if (!rem) return null;
    const sub = r.forgiven ? 'forgiven' : 'notForgiven';
    const tmpl = (typeof FLAG_DIALOGUE !== 'undefined')
      ? FLAG_DIALOGUE._pickSubLine('M-12', sub, _flagPickArchetype(rem), rem.id)
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
  const mArchetype = _flagPickArchetype(master);
  const dArchetype = _flagPickArchetype(disciple);
  const seed = (p.masterId || 0) * 7 + (p.discipleId || 0);
  const mLine = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickSubLine('M-13', 'master', mArchetype, seed)
    : '';
  const dLine = (typeof FLAG_DIALOGUE !== 'undefined')
    ? FLAG_DIALOGUE._pickSubLine('M-13', 'disciple', dArchetype, seed + 1)
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
    const cb = _consumeEventPopupQueueEmpty();
    if (cb) setTimeout(cb, 200);
  } else {
    _drainPopupQueue();
  }
}
let _onEventPopupQueueEmpty = null;

function _consumeEventPopupQueueEmpty() {
  const cb = _onEventPopupQueueEmpty;
  _onEventPopupQueueEmpty = null;
  return cb;
}

function _chainEventPopupQueueEmpty(cb) {
  if (typeof cb !== 'function') return;
  // **キューが空なら即座に実行する。** ここを登録だけで済ませると、閉じるポップアップが
  // 1つも無い場合に closeEventPopup が呼ばれず、コールバックが永久に発火しない
  // (2026-07-31: PPVテレビ中継が「準備中…」で止まる不具合の原因)。
  if (_eventPopupQueue.length === 0 && !_onEventPopupQueueEmpty) {
    setTimeout(cb, 200);
    return;
  }
  const prevCb = _consumeEventPopupQueueEmpty();
  _onEventPopupQueueEmpty = () => {
    if (prevCb) {
      try {
        prevCb();
      } catch (e) {
        console.error('[WM] eventPopup queue callback error:', e);
      }
    }
    cb();
  };
}

// ── v1.3-3: Retirement Popup ────────────────
let _retirementPopupQueue = [];
// WM-D03「引退」BGM が鳴っている間だけ true。連続引退で鳴らし直さないための番人。
let _retirementBgmOn = false;
let _retirementPopupCallback = null;

/**
 * Show retirement popup(s) in sequence.
 * @param {Array} retirements - Array of { fighter, route, line, summary, injuryType?, wasChampion? }
 * @param {Function} onAllDone - Called after all popups are dismissed
 */
// 引退の一枚。**確定(見送る/引き留める)とあいさつを続けて**見せる。
//
// 一度「あいさつだけ表彰式の後」に分けたが、分ける必要はなかった(2026-07-27 Keisuke)。
// ただし**表彰式より前**であることは動かせない — 殿堂入りの判定は
// retiredFighters(引退が確定した選手)だけを見ており、確定前に表彰式を作ると
// 殿堂入りが静かに0件になる(実測: 36ポイントの選手で 0人 / 1人)。
function showRetirementPopups(retirements, onAllDone) {
  if (!retirements || retirements.length === 0) { if (onAllDone) onAllDone(); return; }
  _retirementPopupQueue = [...retirements];
  _retirementPopupCallback = onAllDone || null;
  _enqueuePopup(() => _renderRetirementPopup());
}

function _renderRetirementPopup() {
  try {
    wmDiag('[WM][retire-popup-render]', { queueLen: _retirementPopupQueue.length });
  } catch (_e) {}
  if (_retirementPopupQueue.length === 0) {
    if (_retirementPopupCallback) { _retirementPopupCallback(); _retirementPopupCallback = null; }
    return;
  }
  const r = _retirementPopupQueue[0];
  const f = {
    ...(r.fighter || {}),
    peakOVR: r.fighter?.careerRecord?.peakOVR || r.fighter?.peakOVR,
  };
  const isInjury = r.route === 'injury_wear' || r.route === 'injury_career_ending';

  const careerYears = f.careerSeasons || Math.max(1, (f.age || 17) - (f.debutAge || 17));
  const wins = f.wins || 0, losses = f.losses || 0, draws = f.draws || 0;
  const summary = r.summary || [];
  // C「壮絶な幕切れ」の型があれば見出しと地の文を差し替える。
  // **引退であって死ではない**ので、命に関わる書き方はしない(spec v0.2 §3-C)
  const fk = (r.farewellKind && typeof FAREWELL_KIND_TEXT !== 'undefined')
    ? FAREWELL_KIND_TEXT[r.farewellKind] : null;
  const title = fk ? fk.title : (isInjury ? '無 念 の 引 退' : '旅 　 立 ち');
  // 型の見出しには「引退」の語が入らないので、**副題で必ず引退だと分かるようにする**
  const sub = fk ? '現 役 引 退 ・ FAREWELL'
    : (isInjury ? `FAREWELL ・ INJURY` : `FAREWELL ・ ${careerYears} YEARS`);
  const meta = `年齢 ${f.age || '—'} ・ 現役期間 ${careerYears}年間`;

  // 引退選手のキャリアハイライトをB型ステージ下に挟む
  // 型ごとの地の文。セリフではないので白い吹き出しには入れない(ベースライン §3)
  const farewellNarration = fk
    ? `<div style="max-width:560px;margin:0 auto 14px;padding:12px 16px;border-left:2px solid rgba(200,180,150,0.25)">
         <div style="font-size:14px;color:rgba(232,220,200,0.95);line-height:1.8;margin-bottom:6px">${escHtml(fk.lead)}</div>
         <div style="font-size:13px;color:rgba(200,190,175,0.78);line-height:1.9">${escHtml(fk.body)}</div>
       </div>`
    : '';
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
      <div class="mdl-b-stat-box"><div class="mdl-b-stat-label">戦績</div>
        <div class="mdl-b-stat-value small" style="font-size:16px">${wins}勝 ${losses}敗</div></div>
      <div class="mdl-b-stat-box"><div class="mdl-b-stat-label">現役期間</div>
        <div class="mdl-b-stat-value">${careerYears}<span style="font-size:14px">年間</span></div></div>
      <div class="mdl-b-stat-box"><div class="mdl-b-stat-label">自己最高OVR</div>
        <div class="mdl-b-stat-value">${f.peakOVR || (typeof Engine !== 'undefined' && Engine.util ? Engine.util.ov(f) : '—')}</div></div>
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
    ${farewellNarration}
    ${careerHtml}
    ${_mdlBActions(buttons)}
  `;

  _mdlBOpen(html, 'sepia');
  // WM-D03「引退」。連続で複数人の引退が出るときは鳴らし直さず1本を通す。
  if (!_retirementBgmOn) {
    _retirementBgmOn = true;
    // WM-D03 引退。音量はミキサー実聴値（2026-07-27）
    try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_d03_v01.ogg', { loop: true, volume: 0.41 }); } catch (_e) {}
  }
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
  _retirementPopupQueue.shift();

  if (justClosed && justClosed.championWorryLine) {
    // Glimpse B形式の小さい吹き出しを表示（クリックで閉じる）
    _showChampionWorryBubble(justClosed.fighter, justClosed.championWorryLine, () => {
      if (_retirementPopupQueue.length > 0) {
        setTimeout(_renderRetirementPopup, 300);
      } else if (_retirementPopupCallback) {
        _stopRetirementBgm();
        const cb = _retirementPopupCallback; _retirementPopupCallback = null; cb();
        _drainPopupQueue();
      } else {
        _stopRetirementBgm();
        _drainPopupQueue();
      }
    });
    return;
  }

  if (_retirementPopupQueue.length > 0) {
    setTimeout(_renderRetirementPopup, 300);
  } else if (_retirementPopupCallback) {
    _stopRetirementBgm();
    const cb = _retirementPopupCallback; _retirementPopupCallback = null; cb();
    _drainPopupQueue();
  } else {
    _stopRetirementBgm();
    _drainPopupQueue();
  }
}

/** WM-D03 を落として通常BGMへ戻す。引退が全員分終わったときだけ呼ぶ。 */
function _stopRetirementBgm() {
  if (!_retirementBgmOn) return;
  _retirementBgmOn = false;
  try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.fadeOut(1200); } catch (_e) {}
  setTimeout(() => { try { if (typeof Audio !== 'undefined' && Audio.bgm) Audio.bgm.playForState(); } catch (_e) {} }, 1300);
}

// B4タレント活動§13: チャンピオン怪我引退時の社長への一言（Glimpse B形式吹き出し）
// U3グループA統一(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1)。
// 画面の下から差し込まれる通知トーストのため、主役級の矩形梯子ではなく
// §2-B「丸い顔アイコン(第4系統・小さく差し込む場所限定)」を採用し size:'chip'(40px丸)。
// '…'フォールバックは_buildB1Modalに揃える(あわせて直すもの#1)
function _showChampionWorryBubble(fighter, line, onClose) {
  const face = typeof getPortraitUrl === 'function' ? getPortraitUrl(fighter.id) : '';
  const bubble = document.createElement('div');
  bubble.className = 'champion-worry-toast u3b-theme-dark';
  bubble.innerHTML = _u3bSideHtml({
    name: fighter.name, line: line || '…', imgUrl: face,
    fallback: (fighter.name || '?').charAt(0), size: 'chip',
    bubbleClass: 'champion-worry-bubble',
  });
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
  // 宿怨の試合前演出は表示開始時に、task-41 と同じ表示済み記録へ残す。
  if (typeof _markRivalryMatchDialoguesSeen === 'function') _markRivalryMatchDialoguesSeen(items);
  _rivalryPopupQueue = [...items];
  _rivalryPopupCallback = onAllDone || null;
  _enqueuePopup(() => _renderRivalryPopup());
}

// U3統一(2026-07-25): 因縁ポップアップの顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。
// 旧 vd-bubble-w/l・vd-img-card・vd-nameband・vd-spk 等の内側構造は廃止(下記CSSも撤去)。
// vd-col-w/l・vd-badge-w/l は既存テスト(test/u3-group-b-safety-net-test.js)互換のため co-class として残す。
function _rivalryCol(id, name, line, isWinner, opts) {
  opts = opts || {};
  const fighter = (typeof findFighter === 'function' ? findFighter(id) : null) || ALL_CHARS.find(c => c.id === id);
  const ovr = (fighter && typeof Engine !== 'undefined' && Engine.util && Engine.util.ov) ? Engine.util.ov(fighter) : '—';
  const upperUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(id) : '';
  const colCls = isWinner ? 'vd-col-w' : 'vd-col-l';
  const badgeCls = isWinner ? 'vd-badge-w' : 'vd-badge-l';
  // 対峙(hideBadge)フェーズは勝敗未定=対等表示。決着フェーズのみ敗者演出(グレースケール+下辺無彩色)を出す
  // (mockup-baseline-v0.1 §2「勝敗の格差の付け方」: 2人を並置する画面はサイズを揃え、灰色化だけで表す)
  const isLoser = !opts.hideBadge && !isWinner;
  const roleHtml = opts.hideBadge
    ? ''
    : `<div class="u3b-role"><span class="${badgeCls}">${isWinner ? 'WINNER' : 'LOSER'}</span></div>`;
  return _u3bSideHtml({
    name, line, imgUrl: upperUrl, isLoser, roleHtml,
    statLabel: 'OVR', statValue: ovr,
    extraSideClass: colCls,
  });
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
    if (o.isBitter) {
      const leftLine = pickDialogueLine(BITTER_PREMATCH_LINES[o.leftSide || 'behind'], leftFighter);
      const rightLine = pickDialogueLine(BITTER_PREMATCH_LINES[o.rightSide || 'behind'], rightFighter);
      title = '遺 恨 再 燃';
      sub = 'GRUDGE REKINDLED';
      toneCls = 'tone-bitter';
      leftHtml = _rivalryCol(o.leftId, o.leftName, leftLine, true, { hideBadge: true });
      rightHtml = _rivalryCol(o.rightId, o.rightName, rightLine, false, { hideBadge: true });
      vsIcon = '💀';
      vsLabel = '再 燃';
      resultHtml = `<div class="vd-tag">💀 消えなかったものが、また火を持った</div>`;
      audioKey = 'fate_confrontation';
    } else if (rivalryVal >= 90) {
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
    if (!o.isBitter) {
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

    }

  } else {
    const isFirstWin = o.resolutionType === 'first';
    const isGoodRival = o.resolutionType === 'goodRival';
    const isBitter = o.resolutionType === 'bitter';
    const winLineObj = isFirstWin ? RIVALRY_MATCH_REACTION.winnerLines
      : isGoodRival ? GOODRIVAL_RESOLUTION_LINES.winner
      : isBitter ? BITTER_RESOLUTION_LINES.winner
      : (o.isFate ? RIVALRY_RESOLUTION_LINES.fateWinner : RIVALRY_RESOLUTION_LINES.winner);
    const loseLineObj = isFirstWin ? RIVALRY_MATCH_REACTION.loserLines
      : isGoodRival ? GOODRIVAL_RESOLUTION_LINES.loser
      : isBitter ? BITTER_RESOLUTION_LINES.loser
      : (o.isFate ? RIVALRY_RESOLUTION_LINES.fateLoser : RIVALRY_RESOLUTION_LINES.loser);
    const winFighter = ALL_CHARS.find(c => c.id === o.winnerId);
    const loseFighter = ALL_CHARS.find(c => c.id === o.loserId);
    const winLine = pickDialogueLine(winLineObj, winFighter);
    const loseLine = pickDialogueLine(loseLineObj, loseFighter);
    title = isBitter ? '決 着。し か し、宿 怨 は 消 え ず'
      : isGoodRival ? '好 敵 手 誕 生'
      : isFirstWin ? '宿 敵 戦 勝 利'
      : (o.isSecondResolution ? '最 終 決 着' : (o.isFate ? '宿命の相手 決着' : '因 縁 決 着'));
    sub = isBitter ? 'THE MATCH IS OVER ・ THE GRUDGE REMAINS'
      : isGoodRival ? 'GOOD RIVALS ・ MUTUAL RESPECT'
      : isFirstWin ? 'RIVALRY MATCH ・ VICTORY'
      : (o.isFate ? 'FATED RIVALRY ・ RESOLVED' : 'RIVALRY RESOLVED');
    toneCls = isGoodRival ? 'tone-goodrival'
      : isBitter ? 'tone-bitter'
      : (o.isFate || o.isSecondResolution) ? 'tone-fate' : '';
    leftHtml = _rivalryCol(o.winnerId, o.winnerName, winLine, true);
    rightHtml = _rivalryCol(o.loserId, o.loserName, loseLine, false);
    vsIcon = '⚔';
    vsLabel = isFirstWin ? '勝 利' : '決 着';
    const bonusLine = `📈 両選手の人気 ${Engine.util.formatSignedStatDelta(o.popBonus, 0)}　🏢 団体人気 ${Engine.util.formatSignedStatDelta(o.orgPopBonus, 1)}`;
    const tagText = isGoodRival ? '🤝 ふたりは「好敵手」になった'
      : isBitter ? '💀 勝敗は決した。しかし、遺恨は消えなかった'
      : isFirstWin ? '🔥 宿敵との一戦を制した'
      : o.isFate ? '✨ 宿命の相手との決着がついた'
      : '🔥 宿敵の決着';
    resultHtml = `<div class="vd-tag">${tagText}</div><div class="vd-bonus">${bonusLine}</div>`;
    audioKey = (o.isFate || isGoodRival || isBitter) ? 'fate_resolution' : 'rivalry_resolution';
  }

  box.className = `notif-modal-box verdict u3b-theme-dark${toneCls ? ' ' + toneCls : ''}`;
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
  setTimeout(() => { if (typeof Audio !== 'undefined' && Audio.play) Audio.play(audioKey); }, 200);

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

function _awSpeech(line) {
  if (!line) return '';
  // 名前は顔出しブロックの画像下に置く。吹き出しにはセリフ本文だけを入れる。
  return `<div class="speech-bubble"><div class="speech-text">「${line}」</div></div>`;
}

function _awSpeechSlot(line) {
  // 発言がない場合も同じ予約枠を確保し、複数人の画像上端を揃える。
  return `<div class="aw-speech-slot">${_awSpeech(line)}</div>`;
}

function _awWinnerBlock(d, opts) {
  const o = opts || {};
  const portraitClass = o.portraitClass || 'portrait-main';
  const role = o.role || '';
  const orgName = o.orgName != null ? o.orgName : d.orgName;
  const isPlayerOrg = o.isPlayerOrg != null ? o.isPlayerOrg : d.isPlayerOrg;
  const nameClass = o.nameClass || 'aw-winner-name';
  const nameStyle = o.nameStyle ? ` style="${o.nameStyle}"` : '';
  return `<div class="aw-winner-block ${o.className || ''}">
    ${_awSpeechSlot(o.line)}
    <div class="${portraitClass}">${o.glow ? '<div class="portrait-glow"></div>' : ''}${_awPortrait(d.id)}</div>
    <div class="${nameClass}"${nameStyle}>${d.name}</div>
    ${role ? `<div class="aw-winner-role">${role}</div>` : ''}
    ${orgName ? `<div class="aw-winner-emblem">${_awOrgEmblem(orgName, isPlayerOrg)}</div>` : ''}
  </div>`;
}

// ── 汎用の顔アイコン背景パレット ────────────────────────────────
// キャラ固有の色を持たない場面（遠征メンバー選択・移動演出など）で、
// idから決定論的に選ぶ配色。ハードコード16進を避け、既存トークンの組み合わせのみで構成する。
const _GENERIC_FACE_BG = [
  'linear-gradient(160deg, var(--accent-faction-1), var(--office-panel-dark-deep))',
  'linear-gradient(160deg, var(--accent-faction-2), var(--office-panel-dark-deep))',
  'linear-gradient(160deg, var(--accent-faction-3), var(--office-panel-dark-deep))',
  'linear-gradient(160deg, var(--accent-faction-4), var(--office-panel-dark-deep))',
  'linear-gradient(160deg, var(--gold-deep), var(--office-panel-dark-deep))',
  'linear-gradient(160deg, var(--c-negative), var(--office-panel-dark-deep))',
];
function _genericFaceBg(id) {
  const idx = Math.abs(Number(id) || 0) % _GENERIC_FACE_BG.length;
  return _GENERIC_FACE_BG[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// 汎用「移動演出」コンポーネント（away-flow-redesign 実装B）
// 特定の場面（遠征）に依存しない再利用可能なフルスクリーン演出。
// 想定される再利用先: 出稽古・合宿・巡業・大会会場入りなど、キャラが移動する任意の場面。
//
// showTravelScene(opts, onDone)
//   opts.heading      見出し文字列。既定 '— 移 動 中 —'
//   opts.from         { label, emblemHtml, accent } 出発側。accentはvar(--*)文字列
//   opts.to           { label, emblemHtml, accent } 到着側
//   opts.party        [{ id, name, portraitUrl? }, ...] 同行者の顔アイコン（人数可変・0人可）
//   opts.lines        [主文, 補足] 本文2行。補足は省略可
//   opts.vehicleIcon  隊列先頭のアイコン文字。既定 '🚌'
//   opts.durationMs   移動アニメーションの所要時間(ms)。既定 5800
//   onDone            演出終了（自動到着 or クリックでスキップ）時に1回だけ呼ばれる
//
// 実装メモ: 隊列(.travel-convoy)の移動はCSS @keyframesではなくWeb Animations APIで駆動する。
// @keyframes内にvar()を書くとChromeが離散補間にしてしまい動かないため（モック作成時に実際に踏んだ罠）。
// 距離はステージ幅(.travel-stage)と隊列の実測幅(.travel-convoy)から算出するので、人数が変わっても破綻しない。
// ─────────────────────────────────────────────────────────────────────────────
function _travelSceneEnsureRoot() {
  let root = document.getElementById('travelSceneRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'travelSceneRoot';
    document.body.appendChild(root);
  }
  return root;
}

function _travelFaceHtml(member) {
  const id = member && member.id;
  const url = (member && member.portraitUrl) || (id != null && typeof getUpperUrl === 'function' ? getUpperUrl(id) : '');
  const bg = _genericFaceBg(id);
  if (url) {
    return `<div class="travel-face" style="background:${bg}"><img src="${url}" alt="" onerror="this.style.display='none'"></div>`;
  }
  const initial = escHtml(((member && member.name) || '?').charAt(0));
  return `<div class="travel-face" style="background:${bg}"><span class="travel-face-ini">${initial}</span></div>`;
}

function showTravelScene(opts, onDone) {
  opts = opts || {};
  const root = _travelSceneEnsureRoot();
  const heading = opts.heading || '— 移 動 中 —';
  const from = opts.from || {};
  const to = opts.to || {};
  const fromAccent = from.accent || 'var(--gold)';
  const toAccent = to.accent || 'var(--gold)';
  const party = Array.isArray(opts.party) ? opts.party : [];
  const vehicleIcon = opts.vehicleIcon || '🚌';
  const lines = Array.isArray(opts.lines) ? opts.lines : [];
  const primaryLine = lines[0] || '';
  const secondaryLine = lines[1] || '';
  const durationMs = opts.durationMs > 0 ? opts.durationMs : 5800;

  let reduce = false;
  try { reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  const convoyHtml = [
    `<span class="travel-vehicle">${escHtml(vehicleIcon)}</span>`,
    ...party.map(_travelFaceHtml),
  ].join('');

  const html = `
    <div class="travel-overlay" id="travelSceneOverlay">
      <div class="travel-panel">
        <div class="travel-kicker">${escHtml(heading)}</div>
        <div class="travel-parties">
          <span class="travel-party from">${from.emblemHtml || ''}<span>${escHtml(from.label || '')}</span></span>
          <span class="travel-party to">${to.emblemHtml || ''}<span>${escHtml(to.label || '')}</span></span>
        </div>
        <div class="travel-stage">
          <span class="travel-track" style="background:linear-gradient(90deg, ${fromAccent}, var(--stage-text-quiet) 45%, ${toAccent})"></span>
          <span class="travel-dot from" style="background:${fromAccent};box-shadow:0 0 12px ${fromAccent}"></span>
          <span class="travel-dot to" style="background:${toAccent};box-shadow:0 0 12px ${toAccent}"></span>
          <div class="travel-convoy" id="travelConvoy">${convoyHtml}</div>
        </div>
        <div class="travel-msg">${escHtml(primaryLine)}${secondaryLine ? `<small>${escHtml(secondaryLine)}</small>` : ''}</div>
        <div class="travel-skip">画面をクリックで<b>すぐ進む</b>　／　そのままでも自動で進みます</div>
      </div>
    </div>`;

  root.innerHTML = html;
  const overlay = root.querySelector('.travel-overlay');
  const stage = root.querySelector('.travel-stage');
  const convoy = root.querySelector('#travelConvoy');
  if (!overlay || !stage || !convoy) { root.innerHTML = ''; if (typeof onDone === 'function') onDone(); return; }

  void overlay.offsetWidth;
  overlay.classList.add('active');

  let done = false;
  let anim = null;
  const finish = () => {
    if (done) return;
    done = true;
    if (anim) { try { anim.cancel(); } catch (e) {} }
    overlay.removeEventListener('click', onOverlayClick);
    overlay.classList.remove('active');
    setTimeout(() => { if (root.contains(overlay)) root.innerHTML = ''; }, 400);
    if (typeof onDone === 'function') onDone();
  };
  const onOverlayClick = () => finish();
  overlay.addEventListener('click', onOverlayClick);

  requestAnimationFrame(() => {
    if (done) return;
    const stageW = stage.getBoundingClientRect().width;
    const convoyW = convoy.getBoundingClientRect().width || 190;
    const end = Math.max(40, stageW - convoyW - 10);
    const dur = reduce ? Math.round(durationMs * 1.25) : durationMs;
    if (typeof convoy.animate !== 'function') { setTimeout(finish, dur); return; }
    try {
      anim = convoy.animate(
        [
          { transform: 'translateX(8px)' },
          { transform: `translateX(${end}px)`, offset: 0.72 },
          { transform: `translateX(${end}px)` },
        ],
        { duration: dur, easing: 'cubic-bezier(.34,.03,.24,1)', fill: 'forwards' }
      );
      anim.onfinish = finish;
    } catch (e) {
      setTimeout(finish, dur);
    }
  });
}
if (typeof window !== 'undefined') { window.showTravelScene = showTravelScene; }

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
    ${_awWinnerBlock(d, { line, glow: true, role: _styleJa(d.style) })}
    <div class="media-stats">
      <div class="media-total">${totalRevDisp}万円</div>
      <div class="media-total-label">年間メディア貢献</div>
      <div class="media-breakdown">
        <div class="media-breakdown-item"><div class="media-breakdown-val">${mediaRevDisp}万</div><div class="media-breakdown-label">出演料等</div></div>
        <div class="media-breakdown-item"><div class="media-breakdown-val">${talentRevDisp}万</div><div class="media-breakdown-label">タレント活動</div></div>
      </div>
      ${d.promoCountSeason > 0 ? `<div class="media-activity-count">📢 プロモ活動 ${d.promoCountSeason}週</div>` : ''}
      ${d.talentCountSeason > 0 ? `<div class="media-activity-count">📋 タレント活動 ${d.talentCountSeason}回</div>` : ''}
    </div>
  </div></div>`;
}

function _buildJTChampionAward(d) {
  // 新人王はジュニアトーナメント優勝者に授与される。受賞セリフは rookie プールが正。
  const line = _awardLine('rookie', d.id);
  const runnerUpText = d.runnerUp ? `決勝: vs ${d.runnerUp.name}${d.runnerUp.orgName ? ` (${d.runnerUp.orgName})` : ''}` : '';
  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">🏟️</span><span class="badge-jp">ジュニアトーナメント 優勝</span></div>
  <div class="rookie-layout">
    ${_awWinnerBlock(d, { line, glow: true, role: d.age != null ? `${d.age}歳` : '' })}
    <div>
      <div class="winner-tags">
        <span class="aw-tag">新人王</span>
        <span class="aw-tag neutral">${_styleJa(d.style)}</span>
        <span class="aw-tag neutral">OVR ${d.ovr}</span>
      </div>
      ${runnerUpText ? `<div style="font-size:11px;color:#7a7060;letter-spacing:1px;margin-bottom:14px">${runnerUpText}</div>` : ''}
    </div>
  </div></div>`;
}

function _buildSeasonEventChampionAward(d, kind) {
  if (!d) return null;
  // title = その大会の優勝が同時に授与する称号。大会結果と称号を1枚に収め、
  // 同じ選手が「優勝」と「称号」で2枚続くのを避ける。
  const cfg = {
    springTag: { icon: '🌸', label: '春のタッグリーグ 優勝', title: 'タッグ王者' },
    autumnWar: { icon: '🍁', label: '4団体勝ち残り対抗戦 優勝', title: null },
    tenchosen: { icon: '👑', label: '天頂戦 覇者', title: null },
    ppvFinal: { icon: '🏆', label: 'PPV GRAND FINAL 最終戦勝者', title: null },
  }[kind];
  if (!cfg) return null;
  const fighters = d.fighters || [d];
  const many = fighters.length >= 3;
  const orgName = d.orgName || fighters[0]?.orgName || '';
  const isPlayerOrg = d.isPlayerOrg != null ? d.isPlayerOrg : fighters[0]?.isPlayerOrg;
  const lineFor = f => _awardLine('champion', f.id);
  if (fighters.length === 1) {
    return `<div class="award-card"><div class="award-badge"><span class="badge-icon">${cfg.icon}</span><span class="badge-jp">${cfg.label}</span></div>
      <div class="aw-event-solo">
        ${_awWinnerBlock(fighters[0], { line: lineFor(fighters[0]), glow: true, role: cfg.title || '' })}
      </div></div>`;
  }
  const teamMembers = fighters.map((f, i) => {
    const center = many && i === Math.floor(fighters.length / 2);
    return `<div class="aw-team-member${center ? ' is-center' : ''}">
      ${_awSpeechSlot(lineFor(f))}
      <div class="aw-team-portrait">${_awPortrait(f.id)}</div>
      <div class="aw-team-name">${f.name}</div>
    </div>`;
  }).join('');
  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">${cfg.icon}</span><span class="badge-jp">${cfg.label}</span></div>
    <div class="aw-team-group">
      <div class="aw-team-header">${_awOrgEmblem(orgName, isPlayerOrg)}<span>${orgName}</span>${cfg.title ? `<span class="aw-tag">${cfg.title}</span>` : ''}</div>
      <div class="aw-team-lineup${many ? ' is-many' : ''}">${teamMembers}</div>
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
      ${_awSpeechSlot(line1)}<div class="portrait-sm">${_awPortrait(f1.id)}</div>
      <div class="fighter-name">${f1.name}</div>
      <div class="fighter-org">${f1OrgName}</div>
      <div class="aw-winner-emblem">${_awOrgEmblem(f1OrgName, d.isPlayerOrg, 22)}</div>
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
      ${_awSpeechSlot(line2)}<div class="portrait-sm">${_awPortrait(f2.id)}</div>
      <div class="fighter-name">${f2.name}</div>
      <div class="fighter-org">${f2OrgName}</div>
      <div class="aw-winner-emblem">${_awOrgEmblem(f2OrgName, false, 22)}</div>
    </div>
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
      <div class="champ-quote">${_awSpeechSlot(line)}</div>
      <div class="champ-portrait"><span class="rank-badge">${rank}位</span>${_awPortrait(c.id)}</div>
      <div class="champ-name">${c.name}</div>
      ${defText ? `<div class="champ-defense" ${isPlayer ? 'style="color:var(--gold)"' : ''}>${defText}</div>` : ''}
      <div class="aw-winner-emblem">${_awOrgEmblem(c.orgName, c.isPlayer, rank === 1 ? 36 : 24)}</div>
    </div>`;
  };

  return `<div class="award-card"><div class="award-badge"><span class="badge-icon">🏆</span><span class="badge-jp">タイトル王者</span></div>
  <div class="champions-layout" id="aw-champions-layout">
    <div class="champ-slot">${buildCol(c2, 2)}</div>
    <div class="champ-slot">${buildCol(c1, 1)}</div>
    <div class="champ-slot">${buildCol(c3, 3)}</div>
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
        if (ev.type === 'titleDefense') {
          const defenseCount = ev.count ?? ev.defenseCount ?? '';
          hist.push({ icon: '🛡️', text: `王座防衛（${defenseCount}回目）` });
        }
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
    ${_awWinnerBlock(d, { line, portraitClass: 'portrait-mvp', role: _styleJa(d.style) })}
    <div style="flex:1">
      <div style="margin-bottom:14px">${achHtml}</div>
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
    <div class="aw-winner-block hof-winner-block">
      ${_awSpeechSlot(line)}
      <div class="hof-portrait"><div class="hof-glow-outer"></div>${_awPortrait(d.id)}</div>
      <div class="hof-name">${d.name}</div>
      <div class="aw-winner-emblem">${_awOrgEmblem(d.orgName, d.orgId === 'player', 32)}</div>
    </div>
    <div class="hof-stars">${stars}</div>
    <div class="hof-plaque">${plaqueText}</div>
    <div class="hof-player-speech"><div class="hof-tap-hint">タップして続きを見る</div></div>
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

  // 今年の大会（開催週の順）
  if (a.springTagChampion)
    html += item('🌸', '春のタッグリーグ優勝 / タッグ王者', a.springTagChampion.fighters.map(f => f.name).join(' & '), a.springTagChampion.orgName);
  if (a.jtChampion)
    html += item('🏟️', 'JT優勝 / 新人王', a.jtChampion.name, a.jtChampion.orgName);
  if (a.autumnWarChampion)
    html += item('🍁', '4団体勝ち残り対抗戦優勝', a.autumnWarChampion.orgName, a.autumnWarChampion.fighters.map(f => f.name).join(' · '));
  if (a.tenchosenChampion)
    html += item('👑', '天頂戦 覇者', a.tenchosenChampion.name, a.tenchosenChampion.orgName);
  if (a.ppvFinalWinner)
    html += item('🏆', 'PPV最終戦勝者', a.ppvFinalWinner.name, a.ppvFinalWinner.orgName);
  // 個人表彰
  if (a.mediaAward)
    html += item('📺', 'メディア功労賞', a.mediaAward.name, `貢献 ${Math.round(a.mediaAward.totalRev).toLocaleString()}万円`);
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

function showAwardsCeremony(awards, onDone, onOpen) {
  if (!awards) { if (onDone) onDone(); return; }
  if (Engine.awards && !Engine.awards.hasDisplayableAwards(awards)) { if (onDone) onDone(); return; }
  if (_isPopupActive()) { _popupQueue.push(() => showAwardsCeremony(awards, onDone, onOpen)); return; }

  // スライド構築（動的: 該当なしスキップ）
  // 構成は2部。第1部は今年の大会を開催週の順に並べ、その優勝が兼ねる称号
  // （タッグ王者・新人王）は各大会スライドの中で示す。第2部は個人表彰で、
  // メディア功労賞→ベストマッチ→タイトル王者→MVP→殿堂入りと重みを上げていく。
  const SEC_EVENT = '今年の大会';
  const SEC_AWARD = '個人表彰';
  const slideInfo = []; // { html, label, section, se, isChampions, isMvp, isHof, hofData }

  // ── 第1部: 今年の大会 ──
  if (awards.springTagChampion)
    slideInfo.push({ html: _buildSeasonEventChampionAward(awards.springTagChampion, 'springTag'), label: '春タッグ優勝', section: SEC_EVENT, se: 'normal' });
  if (awards.jtChampion)
    slideInfo.push({ html: _buildJTChampionAward(awards.jtChampion), label: 'JT優勝・新人王', section: SEC_EVENT, se: 'normal' });
  if (awards.autumnWarChampion)
    slideInfo.push({ html: _buildSeasonEventChampionAward(awards.autumnWarChampion, 'autumnWar'), label: '勝ち残り対抗戦 優勝', section: SEC_EVENT, se: 'normal' });
  // 天頂戦シーズンは通常のPPV GRAND FINALが開催されないため、この2枚は排他になる。
  if (awards.tenchosenChampion)
    slideInfo.push({ html: _buildSeasonEventChampionAward(awards.tenchosenChampion, 'tenchosen'), label: '天頂戦 覇者', section: SEC_EVENT, se: 'normal' });
  if (awards.ppvFinalWinner)
    slideInfo.push({ html: _buildSeasonEventChampionAward(awards.ppvFinalWinner, 'ppvFinal'), label: 'PPV最終戦勝者', section: SEC_EVENT, se: 'normal' });

  // ── 第2部: 個人表彰 ──
  if (awards.mediaAward)
    slideInfo.push({ html: _buildMediaAward(awards.mediaAward), label: 'メディア功労賞', section: SEC_AWARD, se: 'normal' });
  if (awards.bestMatch)
    slideInfo.push({ html: _buildBestMatchAward(awards.bestMatch), label: 'ベストマッチ', section: SEC_AWARD, se: 'normal' });
  const champHtml = _buildChampionsAward(awards.champions);
  if (champHtml)
    slideInfo.push({ html: champHtml, label: 'タイトル王者', section: SEC_AWARD, se: 'normal', isChampions: true });
  if (awards.mvp)
    slideInfo.push({ html: _buildMVPAward(awards.mvp), label: 'MVP', section: SEC_AWARD, se: 'mvp' });
  if (awards.hallOfFame && awards.hallOfFame.length > 0) {
    awards.hallOfFame.forEach(inductee => {
      slideInfo.push({ html: _buildHallOfFame(inductee), label: '殿堂入り', section: SEC_AWARD, se: 'hof', isHof: true, hofData: inductee });
    });
  }
  // 受賞が一つもない年は、該当なしの説明を出さず式典自体を静かに省略する。
  if (slideInfo.length === 0) { if (onDone) onDone(); return; }
  // 全受賞者一覧は、成立した受賞がある年だけの締めの1枚。
  slideInfo.push({ html: _buildAwardsSummary(awards), label: '全受賞者一覧', se: 'normal' });

  const overlay = document.getElementById('awardsOverlay');
  const slideWrap = document.getElementById('aw-slide-wrap');
  const headerLabel = document.getElementById('aw-header-award-name');
  const headerSection = document.getElementById('aw-header-section');
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
    if (headerSection) headerSection.textContent = slideInfo[current].section || '';
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
  if (onOpen) onOpen();
  overlay.classList.add('active');
  headerLabel.textContent = 'シーズン ' + awards.season + ' — ' + slideInfo[0].label;
  if (headerSection) headerSection.textContent = slideInfo[0].section || '';

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

  // BGMはapp.js側で管理（表彰式が実際に開く瞬間に onOpen から開始）
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

  // コーチポートレート(U3グループA統一 2026-07-26: _u3bSideHtml(.u3b-*)へ移行。
  // 殿堂入り本人の脇で語る補助的な反応のため size:'s'(108×162)。
  // 縦順は吹き出し→画像→名前→役割ラベルの固定順、mockup-baseline-v0.1 §4)
  const coachPortUrl = typeof getCoachPortraitUrl === 'function' ? getCoachPortraitUrl(coach.id) : '';

  coachFg.innerHTML = _u3bSideHtml({
    name: coach.name, line, imgUrl: coachPortUrl, fallback: coach.emoji || '👩‍🏫',
    role: 'コーチ', size: 's',
    bubbleClass: 'coach-fg-bubble',
  });

  // コーチFGは非表示のまま待機（タップで表示する）
  // _hofCoachReady フラグを立てて goToSlide 内のクリックハンドラで使う
  if (typeof window !== 'undefined') window._hofCoachReady = true;
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

// E-8 Phase A/B: コーチの口調系統(voiceKey)別セリフ取得
// category: 'coachHire' | 'coachFire' | 'ppvPraise'
const COACH_VOICE_QUOTE_TABLES = {
  coachHire: () => COACH_VOICE_HIRE_LINES,
  coachFire: () => COACH_VOICE_FIRE_LINES,
  ppvPraise: () => COACH_VOICE_PRAISE_LINES,
};
function pickCoachVoiceQuote(category, coachId) {
  const getTable = COACH_VOICE_QUOTE_TABLES[category];
  const table = getTable ? getTable() : null;
  if (!table) return '...';
  const voiceKey = getCoachVoiceKey(coachId);
  const pool = table[voiceKey] || table.theorist;
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

function hasCareerHistory(char) {
  if (!char) return false;
  if ((char.wins || 0) + (char.losses || 0) + (char.draws || 0) > 0) return true;
  const history = Array.isArray(char.careerRecord?.history) ? char.careerRecord.history : [];
  if (history.some(event => ['transfer', 'release', 'contractEnd', 'suddenDeparture', 'retire'].includes(event?.type))) return true;
  return (char.careerSeasons || 0) >= 1;
}

function getJoinGreeting(char) {
  // 少量の「よろしく」系を混ぜ、加入経路ではなく本人のキャリアで主文脈を決める。
  if (Math.random() < 0.25 && EVENT_FA_WELCOME_LINES) {
    const welcome = pickDialogueLine(EVENT_FA_WELCOME_LINES, char);
    if (welcome) return welcome;
  }
  const isCareer = hasCareerHistory(char);
  const pool = isCareer ? FA_GREETING_LINES : SCOUT_GREETING_LINES;
  const generic = isCareer ? FA_GREETING_GENERIC_LINES : SCOUT_GREETING_GENERIC_LINES;
  const line = pool && pickDialogueLine(pool, char);
  if (line) return line;
  if (Array.isArray(generic) && generic.length > 0) {
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return 'よろしくお願いします！';
}

function getJoinSourceBadge(source) {
  const isFA = source === 'fa';
  const color = isFA ? 'var(--blue)' : 'var(--green)';
  const label = isFA ? 'FA' : '発掘';
  return `<span style="display:inline-block;padding:2px 6px;border:1px solid ${color};border-radius:3px;background:color-mix(in srgb,${color} 14%,transparent);color:${color};font-family:Oswald,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;line-height:1">${label}</span>`;
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

// ── Fighter Detail Popup ──
// source: 'roster' | 'free' | 'ai:{orgId}' | 'draft'
function findFighter(fighterId, source) {
  // source は「まずここを見ろ」というヒントであって、**そこに居なければ諦める**という
  // 意味ではない。決め打ちで return していたため、'roster' を渡した画面に他団体の選手が
  // 並ぶと(試合カードのメイン、対抗戦、ゲスト参戦など)引けずに **押しても無反応**になっていた。
  // 見つからなければ下の自動探索へ落とす(2026-07-26)。
  if (source === 'roster') { const f = G.roster.find(c => c.id === fighterId); if (f) return f; }
  else if (source === 'free') { const f = G.freeAgents.find(c => c.id === fighterId); if (f) return f; }
  else if (source === 'scout') { const f = (G.scoutCandidates || []).find(c => c.id === fighterId); if (f) return f; }
  else if (source && source.startsWith('ai:')) {
    const orgId = source.slice(3);
    const f = G.aiOrgs?.[orgId]?.roster?.find(x => x.id === fighterId);
    if (f) return f;
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

/** 選手詳細を開けるだけのデータが今あるか。
 *  年代記や旗揚げドラフトには「もうゲームに存在しない選手」が並ぶ。
 *  findFighter は roster/FA/スカウト/AI団体/引退直後 しか見ないので、
 *  chronicle.fighterArchive しか残っていない選手や、ALL_CHARS から
 *  その場で組み立てているドラフト候補は引けず、押しても**無反応**になる。
 *  「押せそうなのに何も起きない」を作らないために、開ける相手にだけ手を付ける。 */
function canOpenFighterPopup(fighterId) {
  if (fighterId == null || typeof G === 'undefined') return false;
  return !!findFighter(Number(fighterId));
}

// 選手詳細に置く、状態ごとの熱量セリフ。性格・アーキタイプで引き分ける。
function getHeatStateQuote(state, fighter) {
  const pool = typeof HEAT_STATE_SELF_LINES !== 'undefined' && HEAT_STATE_SELF_LINES[state];
  if (!pool || typeof pickDialogueLine !== 'function') return '…';
  return pickDialogueLine(HEAT_STATE_SELF_LINES[state], fighter);
}

// 第3引数 _skipQueueCheck は歴史的な残り。**押したら必ず開く**ようになったので効果は無い。
// 既存の呼び出しを壊さないために受け取るだけにしてある。
function showFighterPopup(fighterId, source, _skipQueueCheck) {
  const c = findFighter(fighterId, source);
  if (!c) return;
  // 以前は「他のポップアップが開いていたらキューに積んで return」していたが、
  // showFighterPopup の呼び出し元は**全部ユーザーの操作**（onclick / タップ）であり、
  // システムが勝手に開くことは無い。そのためこの判定は、新聞・トーナメント表・式典など
  // **オーバーレイの中から押したクリックを黙って捨てるだけ**の存在になっていた
  // （2026-07-26、天頂戦と新聞で発覚）。押したら必ず開く。
  // 選手詳細が既に開いている場合だけ、一度閉じて中身を差し替える。
  const fpOverlay = document.getElementById('fighterPopupOverlay');
  if (fpOverlay && fpOverlay.classList.contains('active')) {
    fpOverlay.classList.remove('active');
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
  const trainingState = typeof getTrainingState === 'function' ? getTrainingState(c) : 'fresh';
  const trainingStateLine = getHeatStateQuote(trainingState, c);
  let orgLabel = '';
  let negotiateOrgId = null;
  let isAiFighter = false;
  if (!isRoster && !isFree && G.aiOrgs) {
    for (const [oId, oData] of Object.entries(G.aiOrgs)) {
      if (oData.roster?.some(f => f.id === c.id)) {
        const org = RIVAL_ORGS.find(o => o.id === oId);
        orgLabel = org ? `${org.emoji} ${org.name}` : oId;
        negotiateOrgId = oId;
        isAiFighter = true;
        break;
      }
    }
  }

  const initial = c.name.charAt(0);
  const ovrVal = Engine.util.ov(c);
  const peakOVR = Number((c.careerRecord || {}).peakOVR) || 0;
  const peakOVRSeason = (c.careerRecord || {}).peakOVRSeason;
  const peakHeader = ovrVal < peakOVR
    ? `<span style="font-size:13px;color:var(--text-sub);align-self:flex-end;padding-bottom:5px">ピーク <b>${peakOVR}</b> <span style="color:var(--text-dim);font-size:11px">(S${peakOVRSeason || '?'})</span></span>`
    : '';
  // プレイヤー団体 or AI団体の王者判定
  const _playerChamp = G.titles?.world?.championId === c.id;
  const _npcChampOrgData = negotiateOrgId ? G.aiOrgs[negotiateOrgId] : null;
  const _npcChamp = _npcChampOrgData?.titles?.world?.championId === c.id;
  const isChamp = _playerChamp || _npcChamp;
  const _champDefenses = _playerChamp ? G.titles.world.defenses : (_npcChamp ? (_npcChampOrgData.titles.world.defenses || 0) : 0);
  // 春のタッグリーグ「総合ベストタッグ」称号（遅延失効判定 — 片方が退団/引退していれば自動非表示）
  const _activeBestTag = (typeof Engine !== 'undefined' && Engine.springTagLeague) ? Engine.springTagLeague.getActiveBestTagTeam(G) : null;
  const _isBestTagTeam = !!(_activeBestTag && (_activeBestTag.f1Id === c.id || _activeBestTag.f2Id === c.id));
  const _bestTagPartnerName = _isBestTagTeam
    ? Engine.career.resolveFighterName(G, _activeBestTag.f1Id === c.id ? _activeBestTag.f2Id : _activeBestTag.f1Id)
    : null;
  const _bestTagSeason = _isBestTagTeam ? _activeBestTag.awardedSeason : null;

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
            ${peakHeader}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
            <span class="badge badge-${c.style}" style="font-size:13px;padding:3px 10px">${c.style}</span>
            ${c.role ? `<span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:13px;padding:3px 10px">${c.role}</span>` : ''}
            ${isChamp ? '<span style="font-size:14px;color:var(--gold);font-weight:700">👑 王者</span>' : ''}
            ${_isBestTagTeam ? `<span style="font-size:13px;color:#ff6f9c;font-weight:700">🌸 総合ベストタッグ（第${_bestTagSeason}回${_bestTagPartnerName ? '・' + _bestTagPartnerName + 'と' : ''}）</span>` : ''}
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
            return '<span ' + _tipAttr(td.desc) + ' style="font-size:12px;padding:2px 7px;border-radius:8px;background:' + td.color + '22;color:' + td.color + ';border:1px solid ' + td.color + '44;white-space:nowrap;cursor:help">' + td.icon + ' ' + t + '</span>';
          }).join('')}</div>` : ''}
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:14px;color:var(--text-sub)">
            ${c.age !== undefined ? `<span>📅 ${c.age}歳</span>` : ''}
            ${c.h ? `<span>📏 ${c.h}cm</span>` : ''}
            ${(() => { const decline = Engine.retirement.getDeclinePresentation(c); if (decline.stage === 'terminal') return '<span style="color:#e74c3c">⬇⬇ 限界</span>'; if (decline.stage === 'major') return '<span style="color:#e67e22">⬇ 衰退期</span>'; if (decline.stage === 'early') return '<span style="color:#f1c40f">⚠ 衰え</span>'; return ''; })()}
            ${(() => { const gp = c.growthPenalty; if (!gp) return ''; const m = gp.multiplier; const lbl = m <= 0.2 ? '成長大幅低下' : m <= 0.5 ? '成長低下' : '成長やや低下'; return `<span style="color:#a29bfe">🩹 ${lbl}（残り${gp.remainingWeeks}週）</span>`; })()}
            ${c.hotStreak ? `<span style="color:#ff9500">🔥 絶好調（残り${c.hotStreak.remainingWeeks}週 / OVR+${c.hotStreak.ovrBuff}）</span>` : ''}
            ${c._trainerBuff ? (() => {
              // 社長室 Phase 7: 成長バフと、合宿に馴染んでいる様子を表示
              // _trainerBuff は現在 camp 由来のみ(trainer は care-rework v0.1 で _inviteBuff に移行、既存セーブ互換のため残置)
              const weeks = c._trainerBuff.weeksLeft;
              return `<span style="color:#d4a843">🏋️ 合宿 残り${weeks}週 — 団体にも馴染んできている</span>`;
            })() : ''}
            ${c._inviteBuff ? (() => {
              // care-rework v0.1 §3: 招聘中コーチの表示
              const coach = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES.find(cc => cc.id === c._inviteBuff.coachId) : null;
              const coachName = coach ? coach.name : '招聘コーチ';
              return `<span style="color:#d4a843">🎓 ${coachName}コーチ招聘中 残り${c._inviteBuff.weeksLeft}週</span>`;
            })() : ''}
            ${c.slump ? `<span style="color:#7f8c8d">📉 スランプ中（${c.slump.weeksSinceStart}週目 / 回復確率${(2 + (c.slump.recoveryMomentum || 0)).toFixed(1)}%）</span>` : ''}
            ${c.motivationLoss ? `<span style="color:#95a5a6">😞 モチベ喪失（${c.motivationLoss.weeksSinceStart}週目）</span>` : ''}
            ${(isRoster && !c.isRental && (c.trust != null ? c.trust : 50) < 40) ? '<span style="color:#e67e22;font-weight:700">💭 最近よそよそしい</span>' : ''}
            ${isRoster ? '<span style="color:#2ecc71">🏠 所属中</span>' : ''}
            ${isFree ? '<span style="color:#8bc4f0">🆓 フリー</span>' : ''}
            ${isScoutCandidate ? '<span style="color:#f39c12">🔍 スカウト候補</span>' : ''}
            ${isScoutCandidate && c._isSeed ? '<span style="color:#f1c40f">⭐ 注目候補</span>' : ''}
            ${isScoutCandidate && c._hasCompetition ? '<span style="color:#e74c3c">⚔ 他団体注目</span>' : ''}
            ${orgLabel ? `<span>${orgLabel} 所属</span>` : ''}
          </div>
          <div class="training-state-line">💬 ${trainingStateLine}</div>
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
    // 契約更新交渉中・解雇面談中は社長室から動けない(showScreen がブロックする)。
    // そのまま出すと**押しても何も起きないボタン**になるので、その間は出さない。
    const _navLocked = (typeof G !== 'undefined')
      && (G.weekPhase === 'contractNegotiation' || !!G._releaseInterviewTarget);
    if (!_navLocked) {
      html += `<div style="padding:6px 16px;background:rgba(0,0,0,0.15);border-bottom:1px solid rgba(200,190,170,0.08);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button onclick="openRelationshipMap(${c.id})" style="font-size:12px;padding:5px 14px;background:rgba(74,143,212,0.12);color:#74b9ff;border:1px solid rgba(74,143,212,0.3);border-radius:4px;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:1px;transition:all .2s" onmouseover="this.style.borderColor='rgba(74,143,212,0.6)'" onmouseout="this.style.borderColor='rgba(74,143,212,0.3)'">🔗 相関図</button>
      </div>`;
    }

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
        const w = Math.min(100, (val / 150) * 100);
        const valColor = val >= 75 ? s.color : val >= 50 ? 'var(--text)' : 'var(--text-sub)';
        // 消耗で失われた天井。団体タブと同じ 0〜150 目盛りに揃える。
        // AI選手は、保存済みの実天井差からのみ最高値を復元する。
        const dv = statDecayView(c, s.key, 150, isAiFighter);
        const lostBar = dv.lostPts > 0
          ? `<div class="fighter-popup-stat-lost" title="消耗で失われた伸びしろ ${dv.lostPts}" style="width:${dv.lostPct}%;right:${dv.lostFromRightPct}%"></div>`
          : '';
        const lostTag = dv.lostPts > 0
          ? `<span style="color:var(--stat-decayed);font-size:11px">▼${dv.lostPts}</span>` : '';
        html += `<div class="fighter-popup-stat-row">
          <span class="fighter-popup-stat-label" style="cursor:help" ${_tipAttr(STAT_TIPS[s.key])}>${s.label}</span>
          <div class="fighter-popup-stat-bar">${lostBar}<div class="fighter-popup-stat-fill" style="width:${w}%;background:${s.color};position:relative;z-index:1"></div></div>
          <span class="fighter-popup-stat-val" style="color:${valColor};font-weight:${val>=75?700:400}">${val}${sg > 0 ? `<span style="color:#2ecc71;font-size:11px">+${sg}</span>` : lostTag}</span>
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
          html += `<div style="font-size:12px;color:var(--text-sub);margin-top:${(myRivalries.length > 0 || myExpects.length > 0) ? 4 : 0}px">📊 通算: <span style="color:#2ecc71">${w}勝</span> <span style="color:#e74c3c">${l}敗</span> <span style="color:var(--text-dim)">(勝率${rate}%)</span></div>`;
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
              const mark = m.result === 'win' ? '○' : m.result === 'loss' ? '×' : '';
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
            <span style="color:var(--text-dim);font-size:11px">(${winRateFmt})</span>
            ${totalMatches > 0 ? `<span style="color:var(--text-dim)">勝率</span><span style="color:var(--gold);font-weight:700">${winRate}%</span>` : ''}
            ${bestMQ ? `<span style="color:var(--text-dim);margin-left:2px">｜ ベストMQ</span><span style="${_scale6Style(_mqColor(bestMQ))};font-weight:700">${bestMQ}</span>` : ''}
            ${isChamp ? `<span style="color:var(--gold);font-size:12px;font-weight:700">｜ 👑 王者（${_champDefenses}防衛）</span>` : ''}
            ${summary.peakOVR > 0 && Engine.util.ov(c) < summary.peakOVR ? `<span style="color:var(--text-dim);margin-left:2px">｜ ピーク</span><span style="${_scale6Style(_ovrColor(summary.peakOVR))};font-weight:700">OVR ${summary.peakOVR}</span><span style="color:var(--text-dim);font-size:11px">(S${summary.peakSeason})</span>` : ''}
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
          ${(() => { const _hAll = ((c.careerRecord || {}).history || []); const _js = Engine.career.joinSeason(c); const warEvts = Engine.career.filterPostJoin(_hAll, _js).filter(e => e.type === 'war'); const wW = warEvts.filter(e => e.won).length; const wL = warEvts.length - wW; return warEvts.length > 0 ? `<div style="margin-top:4px;font-size:12px"><span style="color:#2c3e50">🏴 対抗戦 <strong style="color:#2ecc71">${wW}勝</strong> <strong style="color:#e74c3c">${wL}敗</strong></span></div>` : ''; })()}
          ${(() => { const _hAll = (c.careerRecord || {}).history || []; const _js = Engine.career.joinSeason(c); const hist = Engine.career.filterPostJoin(_hAll, _js); const mvp = hist.filter(e => e.type === 'awardMVP').length; const rookie = hist.some(e => e.type === 'awardRookie'); const bm = hist.filter(e => e.type === 'awardBestMatch').length; const media = hist.filter(e => e.type === 'awardMedia').length; const parts = []; if (mvp) parts.push(`<span style="color:#f1c40f">👑 MVP <strong>${mvp}</strong>回</span>`); if (rookie) parts.push(`<span style="color:#f1c40f">🌟 新人王</span>`); if (bm) parts.push(`<span style="color:#e67e22">🎬 ベストマッチ <strong>${bm}</strong>回</span>`); if (media) parts.push(`<span style="color:#3498db">📺 メディア功労賞 <strong>${media}</strong>回</span>`); return parts.length > 0 ? `<div style="margin-top:4px;font-size:12px;display:flex;gap:12px;flex-wrap:wrap">${parts.join('')}</div>` : ''; })()}
        </div>`;
      }

      // ── Milestone Timeline / Career History（NPC記録統一: 全選手に表示）──
      if (milestones.length > 0) {
        const bySeason = {};
        milestones.forEach(m => {
          const s = m.season || 1;
          if (!bySeason[s]) bySeason[s] = [];
          bySeason[s].push(m);
        });
        const seasons = Object.keys(bySeason).map(Number).sort((a, b) => b - a);
        const _joinS = Engine.career.joinSeason(c);
        const _currentRel = Engine.career.relSeason(G.season || 1, _joinS);

        html += `<div style="margin-bottom:14px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <span style="background:#3498db;color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">年表</span>
            キャリア年表
          </h5>
          <div style="border:1px solid rgba(200,190,170,0.12);border-radius:8px;overflow:hidden;background:rgba(200,190,170,0.02)">`;

        seasons.forEach(s => {
          const seasonMs = bySeason[s];
          const summary = seasonMs.find(m => m.type === 'season_end');
          const nonSummary = seasonMs
            .filter(m => m.type !== 'season_end')
            .sort((a, b) => (b.week - a.week) || String(b.text || '').localeCompare(String(a.text || '')));
          const isCurrentSeason = s === _currentRel;
          const seasonMeta = summary
            ? summary.detail
            : (isCurrentSeason ? 'シーズン進行中' : '');

          html += `<section style="display:grid;grid-template-columns:84px minmax(0,1fr);border-top:${s === seasons[0] ? '0' : '1px solid rgba(200,190,170,0.08)'}">
            <div style="padding:10px 9px;background:rgba(212,168,67,0.06);border-right:1px solid rgba(200,190,170,0.08)">
              <div style="font-size:13px;font-weight:900;color:var(--text);line-height:1.15">\u30ad\u30e3\u30ea\u30a2${s}\u5e74\u76ee</div>
              ${seasonMeta ? `<div style="margin-top:4px;font-size:10px;line-height:1.35;color:${isCurrentSeason ? 'var(--blue)' : 'var(--text-dim)'}">${seasonMeta}</div>` : ''}
            </div>
            <div style="padding:9px 10px;background:rgba(255,255,255,0.015)">`;

          if (nonSummary.length === 0) {
            html += `<div style="font-size:11px;color:var(--text-dim);line-height:1.35">\u7279\u8a18\u4e8b\u9805\u306a\u3057</div>`;
          } else {
            nonSummary.forEach(m => {
              const typeStyle = Engine.milestone._typeStyle(m.type);
              const detailInline = m.detail ? `<span style="color:var(--text-dim)"> / ${m.detail}</span>` : '';
              html += `<div style="display:grid;grid-template-columns:42px 14px minmax(0,1fr);align-items:start;column-gap:6px;padding:2px 0;font-size:12px;line-height:1.35">
                <span style="color:var(--text-dim);font-size:10px;text-align:right;padding-top:2px">${m.week ? `${m.week}\u9031` : '---'}</span>
                <span style="color:${typeStyle.color};padding-top:1px">${typeStyle.icon}</span>
                <span style="color:var(--text)">${m.text}${detailInline}</span>
              </div>`;
            });
          }

          html += `</div></section>`;
        });

        html += `</div></div>`;
      } else {
        html += `<div style="font-size:13px;color:var(--text-dim);padding:14px;text-align:center;background:rgba(200,190,170,0.02);border-radius:6px">まだキャリア記録がありません</div>`;
      }

      // v1.3-2: §4.4/§7.1 経歴（怪我記録）セクション（NPC記録統一: 全選手に表示）
      // 入団以降のみ表示（転生前 NPC事前史の怪我は別人扱いで非表示）
      const _histJoinS = Engine.career.joinSeason(c);
      const hist = Engine.career.filterPostJoin(c.careerHistory || [], _histJoinS);
      if (hist.length > 0) {
        html += `<div style="margin-bottom:14px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="background:#a29bfe;color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">経歴</span>
            怪我・重大事項
          </h5>`;
        [...hist].reverse().forEach(h => {
          const typeColor = h.type === 'injury_retirement' ? '#e74c3c' : '#e17055';
          const typeIcon  = h.type === 'injury_retirement' ? '🏁' : '🩹';
          const _relS = Engine.career.relSeason(h.season, _histJoinS);
          const seasonStr = h.season ? `キャリア${_relS}年目` : '';
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
  return `<span class="flink" style="${cls}${sizeStyle}" onclick="event.stopPropagation();showFighterPopup(${c.id},'${src}'${skipArg})">${escHtml(c.name)}</span>${extra}`;
}

function getScheduledChallengeCard() {
  return (typeof Engine !== 'undefined' && Engine.challengeRequest?.getScheduledCard)
    ? Engine.challengeRequest.getScheduledCard(G)
    : null;
}

/** その週、通常興行のカードに入れてはいけない自団体の選手。
 *
 *  2026-07-27 Keisuke 報告の修正:
 *   ・遠征の予約は **isEligibleHomeShow で絞ってはいけない**。あれは「この興行が挑戦試合を
 *     開催できるか」の判定で、選手が空いているかとは別。特別興行週・PPV週で false になり、
 *     おすすめ編成が遠征メンバーを呼び戻して**挑戦試合が中止**になっていた。
 *   ・予約は試合が終わると消えるので、**出た事実**(_awayChallengeUsedIds)も見る。
 *     見ないと、遠征のあとの通常興行に同じ選手が並び**同じ週に二重出場**する。
 */
function getChallengeUnavailableIds() {
  const ids = new Set(getScheduledChallengeCard()?.reservedIds || []);
  const single = Engine.challengeRequest?.getScheduledSingleChallenge?.(G);
  (single?.reservedIds || []).forEach(id => ids.add(id));
  // これから遠征に出る(週の種類を問わない)
  const away = G && G._pendingAwayChallengeMatch;
  if (away) {
    const playerIds = away.requesterOrgId === 'player' ? away.teamAIds : away.teamBIds;
    (playerIds || []).forEach(id => ids.add(id));
  }
  // 今週すでに遠征に出た
  const used = G && G._awayChallengeUsedIds;
  if (used && used.season === G.season && used.week === G.week) {
    (used.ids || []).forEach(id => ids.add(id));
  }
  return ids;
}

function getShowCardFighter(id) {
  if (!(id > 0)) return null;
  const own = (G.roster || []).find(c => c.id === id);
  if (own) return own;
  const scheduled = getScheduledChallengeCard();
  if (scheduled) return [...scheduled.teamA, ...scheduled.teamB].find(c => c.id === id) || null;
  const single = Engine.challengeRequest?.getScheduledSingleChallenge?.(G);
  return single && (single.playerFighter.id === id ? single.playerFighter : single.challenger.id === id ? single.challenger : null);
}

function moveShowCard(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= G.showCard.length) return;
  // メインイベント(位置0)にタッグ枠を移動させない
  const card = [...G.showCard];
  if (card[idx]?._crMatchLocked || card[target]?._crMatchLocked) {
    Audio.play('error');
    showToast('⚔ 挑戦試合の上位3枠は固定です', 3000);
    return;
  }
  if (target === 0 && card[idx].matchType === 'tag') { Audio.play('error'); return; }
  if (idx === 0 && card[target].matchType === 'tag') { Audio.play('error'); return; }
  [card[idx], card[target]] = [card[target], card[idx]];
  G = { ...G, showCard: card };
  renderShowPrep();
}

// タッグ枠保持ヘルパー: 既存タッグ枠を保持し、タッグ選手IDを除外セットに追加
function _preserveTagSlots(maxMatches) {
  const scheduled = getScheduledChallengeCard();
  const reservedIds = getChallengeUnavailableIds();
  const prefix = scheduled ? [0, 1, 2].map(i => ({
    left: scheduled.teamA[i].id, right: scheduled.teamB[i].id,
    isTitle: false, isCRMatch: true, _crMatchLocked: true,
    _crGroupId: `cr_${scheduled.requesterId}_${scheduled.opponentId}_${G.season}_${G.week}`,
    _crSlot: i,
  })) : [];
  const maxTags = Math.max(0, Math.floor((maxMatches - prefix.length) / 2));
  const tags = G.showCard.filter(m => m.matchType === 'tag' &&
    ![m.teamA?.fighter1, m.teamA?.fighter2, m.teamB?.fighter1, m.teamB?.fighter2].some(id => reservedIds.has(id)))
    .slice(0, maxTags);
  const tagUsed = new Set();
  tags.forEach(t => {
    [t.teamA.fighter1, t.teamA.fighter2, t.teamB.fighter1, t.teamB.fighter2]
      .filter(id => id > 0).forEach(id => tagUsed.add(id));
  });
  const tagWeight = tags.length * 2;
  const singlesCount = Math.max(0, maxMatches - prefix.length - tagWeight);
  return { tags, tagUsed, singlesCount, prefix, reservedIds };
}
function autoFillCard() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const { tags, tagUsed, singlesCount, prefix, reservedIds } = _preserveTagSlots(maxMatches);
  const card = [...prefix];
  for (let i = 0; i < singlesCount; i++) card.push({left:0, right:0, isTitle:false});
  const sorted = [...G.roster].filter(c => !c.injury && !c.forcedRest && !tagUsed.has(c.id) && !reservedIds.has(c.id)).sort((a,b) => ov(b) - ov(a));
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
    card[prefix.length + i] = {left: left.id, right: right.id, isTitle: slotIsTitle};
  }
  // タッグ枠を末尾に追加
  tags.forEach(t => card.push(t));
  G = { ...G, showCard: card };
}

// ── おすすめ編成: matchAppeal合計最大化 ──
function autoFillCardByAppeal() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const { tags, tagUsed, singlesCount, prefix, reservedIds } = _preserveTagSlots(maxMatches);
  const available = G.roster.filter(c => !c.injury && !c.forcedRest && !tagUsed.has(c.id) && !reservedIds.has(c.id));
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
        freshnessRawBonus: fr.bonus,
      };
      pairs.push({ aId: a.id, bId: b.id, appeal: Engine.attendanceV2.calcMatchAppeal(a, b, ctx, G) });
    }
  }

  pairs.sort((x, y) => y.appeal - x.appeal);
  const card = [...prefix];
  const used = new Set();
  let regularCount = 0;
  for (const p of pairs) {
    if (regularCount >= singlesCount) break;
    if (used.has(p.aId) || used.has(p.bId)) continue;
    card.push({ left: p.aId, right: p.bId, isTitle: false });
    regularCount++;
    used.add(p.aId);
    used.add(p.bId);
  }

  _applyAutoTitleMatch(card);
  while (regularCount < singlesCount) { card.push({ left: 0, right: 0, isTitle: false }); regularCount++; }
  tags.forEach(t => card.push(t));
  G = { ...G, showCard: card };
}

// ── 集客力順編成: drawPower合計最大化 ──
function autoFillCardByDraw() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const { tags, tagUsed, singlesCount, prefix, reservedIds } = _preserveTagSlots(maxMatches);
  const available = G.roster.filter(c => !c.injury && !c.forcedRest && !tagUsed.has(c.id) && !reservedIds.has(c.id));
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
  const card = [...prefix];
  const used = new Set();
  let regularCount = 0;
  for (const p of pairs) {
    if (regularCount >= singlesCount) break;
    if (used.has(p.aId) || used.has(p.bId)) continue;
    card.push({ left: p.aId, right: p.bId, isTitle: false });
    regularCount++;
    used.add(p.aId);
    used.add(p.bId);
  }

  _applyAutoTitleMatch(card);
  while (regularCount < singlesCount) { card.push({ left: 0, right: 0, isTitle: false }); regularCount++; }
  tags.forEach(t => card.push(t));
  G = { ...G, showCard: card };
}

// ── 自動編成共通: メインイベントのタイトルマッチ判定 ──
function _applyAutoTitleMatch(card) {
  if (!card.length || !G.titleEstablished) return;
  const cdOk = Engine.title.canTitleMatch(G).allowed;
  if (!cdOk) return;
  const topRegularIdx = card.findIndex(m => m && !m._crMatchLocked && !m.isCRMatch && m.matchType !== 'tag');
  if (topRegularIdx < 0) return;
  const champId = G.titles.world.championId;
  if (champId) {
    // 王者在位: 王者が含まれるスロットをメインに移動してタイトル戦に
    const champIdx = card.findIndex(m => m.left === champId || m.right === champId);
    if (champIdx < 0) return;
    if (card[champIdx]?._crMatchLocked || card[champIdx]?.isCRMatch) return;
    if (champIdx !== topRegularIdx) { [card[topRegularIdx], card[champIdx]] = [card[champIdx], card[topRegularIdx]]; }
    card[topRegularIdx].isTitle = true;
  } else {
    // 王座空位: メイン枠（両選手が埋まっていれば）を初代王者決定戦に
    if (card[topRegularIdx] && card[topRegularIdx].left > 0 && card[topRegularIdx].right > 0) {
      // レンタル選手チェック
      const hasRental = [card[topRegularIdx].left, card[topRegularIdx].right].some(id => G.roster.find(c => c.id === id)?.isRental);
      if (!hasRental) card[topRegularIdx].isTitle = true;
    }
  }
}

function toggleTitle(slotIndex) {
  if (!G.titleEstablished) { alert('団体王座はまだ設立されていません（興行3回・人気15・ロスター5人で設立）'); return; }
  // 画面に出ている枠と G.showCard がずれていたら、**例外で落とさず描き直して合わせる**。
  // ここで throw すると以降のクリックが全部死に、興行開催ボタンまで効かなくなる
  // (2026-07-31 Keisuke 実機: isTitle の TypeError と「開催ボタンが押せない」が同時発生)。
  if (!G.showCard || !G.showCard[slotIndex]) {
    try {
      console.warn('[WM][showCard] toggleTitle: 画面の枠が G.showCard に無い', {
        slotIndex, cardLength: (G.showCard || []).length,
        season: G.season, week: G.week, weekPhase: G.weekPhase, venue: G.showVenue,
      });
    } catch (_e) {}
    Audio.play('error');
    if (typeof renderShowPrep === 'function') renderShowPrep();
    return;
  }
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

// (applyMQPopularity / applyShowPopularity moved to Engine — no longer needed here)

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
  // away-flow-redesign CH-2: 遠征(敵地遠征)が未消化なら、興行準備(会場選択・カード編集)
  // という寄り道を見せる前に「敵地へ向かう」演出→遠征試合を挟む。
  // 遠征が解決すると App.beginAwayChallengeTravel() 経由で通常の興行準備へ戻ってくる。
  if (G._pendingAwayChallengeMatch && Engine.challengeRequest?.isEligibleHomeShow?.(G) && typeof App !== 'undefined' && typeof App.beginAwayChallengeTravel === 'function') {
    App.beginAwayChallengeTravel();
    return;
  }
  showScreen('show');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => { if (b.textContent.includes('興行準備')) b.classList.add('active'); });
  renderShowPrep();
}

// showPrep 中に「今週」タブへ戻った場合の復帰導線。
// startShowPrep() は weekPhase==='manage' を要求するため再入できない。ここでは
// 状態を作り直さず、準備画面を再表示するだけにする。
function resumeShowPrep() {
  if (G.weekPhase !== 'showPrep') { startShowPrep(); return; }
  // 遠征が未消化ならそちらを先に消化する（startShowPrep と同じ優先順位）
  if (G._pendingAwayChallengeMatch && Engine.challengeRequest?.isEligibleHomeShow?.(G)
      && typeof App !== 'undefined' && typeof App.beginAwayChallengeTravel === 'function') {
    App.beginAwayChallengeTravel();
    return;
  }
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
  Audio.play('policy');
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
    if (!e.data.preserveParentFileBgm) {
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.stop(); } catch(err) {}
      try { if (typeof Audio !== 'undefined' && Audio.bgm) Audio.bgm.stop(); } catch(err) {}
    }
    try { if (typeof Audio !== 'undefined' && Audio.play) Audio.play('bellx3'); } catch(err) {}
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
  const showName = sp.isAwayChallenge
    ? `🚌 ${sp.awayBooking?.opponentOrgName || '相手団体'} 興行・遠征試合`
    : ppv ? '🏆 PPV GRAND FINAL' : special ? '⭐ 特別興行' : `第${G.totalShows + 1}回 定期興行`;
  const resolved = sp.results.filter(r => r !== null).length;
  const total = sp.validMatches.length;

  let nextIdx = -1;
  for (let i = total - 1; i >= 0; i--) {
    if (sp.results[i] === null) { nextIdx = i; break; }
  }

  // away-flow-redesign 実装C: 敵地仕様（sp.isAwayChallenge のときのみ）。
  // 構造(縦並びの試合カード)は変えず、.away修飾クラスによる色replaceと補助情報の追加のみ。
  const isAway = !!sp.isAwayChallenge;
  const awayOpponentOrgId = isAway ? (sp.awayBooking?.opponentOrgId || '') : '';
  const awayOpponentOrgName = isAway ? (sp.awayBooking?.opponentOrgName || '相手団体') : '';
  const awaySelfOrgName = isAway ? (sp.awayBooking?.requesterOrgName || G.orgName || '自団体') : '';
  const hdrEmblemHtml = isAway
    ? `<div class="hdr-emblem">${typeof orgIconHtml === 'function' ? orgIconHtml(awayOpponentOrgId, 58) : ''}</div>`
    : '';
  const awayBarHtml = isAway
    ? `<div class="awaybar">${typeof orgIconHtml === 'function' ? orgIconHtml('player', 20) : ''}${escHtml(awaySelfOrgName)}<span class="awaybar-sep">が</span>${typeof orgIconHtml === 'function' ? orgIconHtml(awayOpponentOrgId, 20) : ''}${escHtml(awayOpponentOrgName)}のリングへ乗り込む</div>`
    : '';
  // 試合行の選手名下に出す所属団体ラベル（自陣=緑ドット／敵地=赤茶ドット）
  // 他団体が絡む試合でだけ所属を出す(mockup-baseline-v0.1 §5)。
  // 敵地遠征に加え、2026-07-21 から通常興行のカードに混ざるようになった挑戦試合の
  // ゲスト選手も対象にする（挑戦試合の専用プレビュー画面は 2026-07-26 に削除済み）。
  const _matchOrgLabel = (fighter, opponent) => {
    if (isAway) {
      const isHome = (sp.awayPlayerRosterIds || []).includes(fighter.id);
      const name = isHome ? awaySelfOrgName : awayOpponentOrgName;
      const orgId = isHome ? 'player' : awayOpponentOrgId;
      const emblem = typeof orgIconHtml === 'function' ? orgIconHtml(orgId, 14) : '';
      return `<div class="forg">${emblem}<span class="dot ${isHome ? 'home' : 'away'}"></span>${escHtml(name)}</div>`;
    }
    const emblem = crossOrgEmblemHtml(fighter, opponent, 14);
    if (!emblem) return '';
    const guestOrgId = guestOrgIdOf(fighter);
    const name = guestOrgId
      ? ((RIVAL_ORGS.find(o => o.id === guestOrgId) || {}).name || '他団体')
      : (G.orgName || '自団体');
    return `<div class="forg">${emblem}<span class="dot ${guestOrgId ? 'away' : 'home'}"></span>${escHtml(name)}</div>`;
  };

  // ヘッダー
  let html = `<div class="show-pregame-a${isAway ? ' away' : ''}"><div class="show-header">
    ${hdrEmblemHtml}
    <div class="show-label">${sp.isAwayChallenge ? 'Away Challenge' : 'Weekly Show'}</div>
    <div class="show-title">${showName}</div>
    <div class="show-progress">全${total}試合 ─ ${resolved}/${total} 完了</div>
  </div>${awayBarHtml}`;

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
    const cardStateClass = isResolved ? ' is-resolved' : isNext ? ' is-next' : ' is-waiting';
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
        // portraitImg(f.id, 40) was the former fallback; keep the tag fallback on the L group scale instead.
        const portraitHtml = upper
          ? `<img src="${upper}" alt="${f.name}" onerror="this.style.display='none'">`
          : `<div class="smc-tag-portrait-placeholder">${escHtml((f.name || '?').charAt(0))}</div>`;
        return `<div class="smc-tag-fighter">
          <button type="button" class="smc-tag-portrait" onclick="event.stopPropagation();showFighterPopup(${Number(f.id)})">${portraitHtml}</button>
          <div class="smc-tag-info">
            ${isChamp ? '<span class="smc-tag-champ-mark">👑</span>' : ''}
            <div class="fname">${f.name}</div>
            <div class="smc-tag-ovr-row">
              <span class="smc-tag-style-label">${f.style || '—'}</span>
              <span class="ovr-line">OVR&thinsp;<span class="ovr-num" style="${_scale6Style(_ovrColor(ovr))}">${ovr}</span></span>
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
      html += `<div class="match-card ${cardClass}${cardStateClass}" data-match-next="${isNext}" style="opacity:${isResolved ? 1 : isNext ? 1 : 0.62}">`;
      html += `<div class="smc-head">
        <span class="smc-label" style="font-size:${isMain ? '18px' : '15px'};color:${isMain ? 'var(--gold)' : 'var(--text-sub)'}">${matchLabel}</span>
        ${statusBadge} <span class="smc-tag-badge">TAG MATCH</span>
      </div>`;
      // bond-rivalry plan P-1: bond ≤ 20 不仲ペアの警告マーカー
      const _chemHtml = (bond) => {
        if (bond <= 20) {
          return `<div class="smc-tag-chem" style="color:#ff7675;font-weight:900">⚠ 不仲 ${Math.round(bond)}<div style="font-size:10px;font-weight:700;opacity:0.85;margin-top:2px">能力-3 / 連携不可 / 相手との関係-1</div></div>`;
        }
        return `<div class="smc-tag-chem">🤝 ${Math.round(bond)}</div>`;
      };
      html += `<div class="smc-tag-arena">
        <div class="smc-tag-team left"><div class="smc-tag-lineup">${_tagFighter(tA1)}${_tagFighter(tA2)}</div>${_chemHtml(bondA)}</div>
        <div class="smc-vs"><div class="smc-vs-text">VS</div></div>
        <div class="smc-tag-team right"><div class="smc-tag-lineup">${_tagFighter(tB1)}${_tagFighter(tB2)}</div>${_chemHtml(bondB)}</div>
      </div>`;
      if (isResolved) {
        let wNames = '決着つかず';
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
    const imgW = 132;
    const imgH = 194;
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

    html += `<div class="match-card ${cardClass}${cardStateClass}" data-match-next="${isNext}" style="opacity:${isResolved ? 1 : isNext ? 1 : 0.62}">`;

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
        <div class="upper-wrap">
          ${upperL ? `<img src="${upperL}" alt="${charL.name}" onerror="this.style.display='none'">` : portraitImg(charL.id, imgW)}
        </div>
      </button>
      <div class="fname">${charL.name}</div>
      <div class="ovr-line"><span class="ovr-label">OVR</span><span class="ovr-num" style="${_scale6Style(_ovrColor(ovrL))}">${ovrL}</span></div>
      ${_matchOrgLabel(charL, charR)}
    </div>`;

    // VS
    html += `<div class="smc-vs"><div class="smc-vs-text">VS</div></div>`;

    // 右キャラ
    html += `<div class="smc-char ${rightCharClass}">
      <button type="button" onclick="showFighterPopup(${charR.id}, 'roster')" style="background:none;border:none;padding:0;cursor:pointer">
        <div class="upper-wrap">
          ${upperR ? `<img src="${upperR}" alt="${charR.name}" onerror="this.style.display='none'">` : portraitImg(charR.id, imgW)}
        </div>
      </button>
      <div class="fname">${charR.name}</div>
      <div class="ovr-line"><span class="ovr-label">OVR</span><span class="ovr-num" style="${_scale6Style(_ovrColor(ovrR))}">${ovrR}</span></div>
      ${_matchOrgLabel(charR, charL)}
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
      const wName = result.winner === 'draw' ? '決着つかず' : result.winner === 'left' ? charL.name : charR.name;
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
  html += `</div>`; // .show-pregame-a

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

function _rivalryPopupPairKey(idA, idB) {
  return [String(idA), String(idB)].sort().join('-');
}

function _getRivalryPopupSeen() {
  const currentWeek = Engine.util.absWeek(G.season, G.week);
  const previous = (G._rivalryPopupSeen && !Array.isArray(G._rivalryPopupSeen))
    ? G._rivalryPopupSeen
    : {};
  const seen = { ...previous };
  Object.keys(seen).forEach(pairKey => {
    const seenWeek = seen[pairKey];
    const cooldownWeeks = pairKey.startsWith('bitter:')
      ? RIVALRY_POPUP_CONFIG.bitterPairCooldownWeeks
      : RIVALRY_POPUP_CONFIG.normalPairCooldownWeeks;
    if (!Number.isFinite(seenWeek) || seenWeek > currentWeek || currentWeek - seenWeek >= cooldownWeeks) {
      delete seen[pairKey];
    }
  });
  G._rivalryPopupSeen = seen;
  return { seen, currentWeek };
}

function _markRivalryMatchDialoguesSeen(dialogues) {
  if (!dialogues || dialogues.length === 0) return;
  const { seen, currentWeek } = _getRivalryPopupSeen();
  dialogues.forEach(dialogue => {
    if (dialogue._rivalryPopupPairKey) seen[dialogue._rivalryPopupPairKey] = currentWeek;
  });
}

/** 通常の因縁マッチの試合後コメントを、興行あたりの上限内で予約する。
 *  格下が OVR差9以上をひっくり返したときだけ UPSET_RIVALRY_LINES(番狂わせ専用)を引く。
 *  因縁決着は showRivalryPopups() の専用キューで必ず表示し、ここでは抑制しない。 */
function _queueRivalryMatchDialogue(r, leftIsWinner, isDraw, matchLabel, sourceMatch) {
  if (isDraw || !r || !r.rivalryBonus) return;
  if (typeof _sameSinglesPair === 'function' && !_sameSinglesPair(sourceMatch, r)) return;
  if (r.rivalryResolved) return; // 決着演出は専用キューに任せ、通常演出を重ねない。
  const rivalry = r.rivalryBonus.rivalry || 0;
  const hasRivalTitle = r.rivalryBonus.isGoodRival || r.rivalryBonus.isBitterRival;
  if (!hasRivalTitle && rivalry < RIVALRY_POPUP_CONFIG.normalMinRivalry) return;
  const winF = leftIsWinner ? r.left : r.right;
  const loseF = leftIsWinner ? r.right : r.left;
  if (!winF || !loseF) return;
  const { seen, currentWeek } = _getRivalryPopupSeen();
  const pairKey = _rivalryPopupPairKey(winF.id, loseF.id);
  if (Number.isFinite(seen[pairKey]) && currentWeek - seen[pairKey] < RIVALRY_POPUP_CONFIG.normalPairCooldownWeeks) return;
  const winChar = ALL_CHARS.find(c => c.id === winF.id);
  const loseChar = ALL_CHARS.find(c => c.id === loseF.id);
  if (!winChar || !loseChar) return;
  const ovrW = Engine.util.ov(winF);
  const ovrLose = Engine.util.ov(loseF);
  const isUpset = ovrW < ovrLose - 8;
  const upset = (typeof UPSET_RIVALRY_LINES !== 'undefined') ? UPSET_RIVALRY_LINES : null;
  const winPool = (isUpset && upset) ? upset.winnerLines : RIVALRY_MATCH_REACTION.winnerLines;
  const losePool = (isUpset && upset?.loserLines) ? upset.loserLines : RIVALRY_MATCH_REACTION.loserLines;
  const winLine = pickDialogueLine(winPool, winChar);
  const loseLine = pickDialogueLine(losePool, loseChar);
  if (!winLine && !loseLine) return;
  _pendingMatchDialogues.push({
    matchLabel, rivalryBonus: r.rivalryBonus, isUpset,
    winnerId: winF.id, loserId: loseF.id,
    winnerName: winF.name, loserName: loseF.name,
    winLine, loseLine,
    _rivalryPopupPairKey: pairKey,
    _rivalryPopupRivalry: rivalry,
  });
  _pendingMatchDialogues.sort((a, b) => b._rivalryPopupRivalry - a._rivalryPopupRivalry);
  _pendingMatchDialogues.splice(RIVALRY_POPUP_CONFIG.maxNormalPerShow);
}

function _pbShowSummaryTheme(week) {
  const normalizedWeek = ((((Number(week) || 1) - 1) % 48) + 48) % 48 + 1;
  if (normalizedWeek === 12) return { key: 'spring', emblem: '../image/emblem-spring.png', liveText: '🌸 SPRING SPECIAL' };
  if (normalizedWeek === 24) return { key: 'summer', emblem: '../image/emblem-summer.png', liveText: '☀ SUMMER SPECIAL' };
  if (normalizedWeek === 36) return { key: 'autumn', emblem: '../image/emblem-autumn.png', liveText: '🍁 AUTUMN SPECIAL' };
  if (normalizedWeek === 48) return { key: 'ppv', emblem: '', liveText: '♛ GRAND FINAL' };
  return { key: 'normal', emblem: '', liveText: '● ON AIR' };
}

function renderShowResult(results, injuryResults) {
  _pendingMatchDialogues = [];
  _getRivalryPopupSeen();
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
  const summaryTheme = _pbShowSummaryTheme(week);

  // Banner
  const liveText = summaryTheme.liveText;
  const liveCls = special ? 'pb-live is-special' : 'pb-live';
  const titleCls = special ? 'pb-banner-title is-special' : 'pb-banner-title';
  const showName = special ? '特 別 興 行' : `第 ${G.totalShows} 回 定期興行`;

  const summaryEmblem = summaryTheme.emblem
    ? `<img src="${summaryTheme.emblem}" alt="" onerror="this.style.display='none'">`
    : '<span aria-hidden="true">●</span>';
  let html = `<div class="pb-container pb-event-summary pb-theme-${summaryTheme.key}">`;
  html += `<div class="pb-banner">
    <div class="pb-summary-emblem">${summaryEmblem}</div>
    <div class="${liveCls}">${liveText}</div>
    <div class="${titleCls}">${escHtml(showName)}</div>
    <div class="pb-banner-sub">Year ${G.season || 1}<span class="dot">·</span>Week ${week}<span class="dot">·</span>${monthLabel}</div>
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
    const sourceMatch = _srValidMatches[i];
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
    if (sourceMatch?.isCRMatch) tags.push(`<span class="pb-tag is-rivalry">⚔ 挑戦試合</span>`);
    if (r.isTitleMatch) tags.push(`<span class="pb-tag is-title">🏆 タイトルマッチ</span>`);
    if (r.rivalryResolved) tags.push(`<span class="pb-tag is-rivalry">${r.rivalryResolutionType === 'first' ? '⚔ 宿敵戦勝利' : '⚡ 決着！'}</span>`);
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

      const winnerLabel = isDraw ? 'NO CONTEST' : (aWin ? '🏆 左チーム WIN' : '🏆 右チーム WIN');
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

    const metaLeft = isMain ? (leftIsWinner ? 'Winner' : isDraw ? 'No Contest' : 'Challenger') : `Match ${results.length - i}`;
    const metaRight = isMain ? (rightIsWinner ? 'Winner' : isDraw ? 'No Contest' : 'Challenger') : `Match ${results.length - i}`;

    // 因縁マッチ(rivalry 30+)の試合後コメントを予約する。結果一覧を閉じた直後に
    // showPostMatchDialogues() が順番に出す。
    _queueRivalryMatchDialogue(r, leftIsWinner, isDraw, `Match ${results.length - i}`, sourceMatch);

    let winnerLabel;
    if (isDraw) winnerLabel = 'NO CONTEST';
    else {
      const winF = leftIsWinner ? r.left : r.right;
      winnerLabel = `🏆 ${escHtml(winF.name)} WIN`;
    }

    const rowCls = `pb-mrow${isMain ? ' is-main' : ''}`;
    html += `<div class="${rowCls}">`;
    html += _pbFighterBlock('left', r.left, leftCls, metaLeft, '');
    html += _pbResultColumn({
      winnerLabel,
      winnerIsDraw: isDraw,
      finishText: Engine.formatFinish(r.finType, r.finMove),
      turns: r.turns,
      mq: r.mq
    });
    html += _pbFighterBlock('right', r.right, rightCls, metaRight, '');
    if (tags.length) html += `<div class="pb-mrow-tags">${tags.join('')}</div>`;
    if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
    if (sourceMatch?.isCRMatch && r._challengeRelationshipDelta) {
      const signedRel = value => `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}`;
      const leftRel = r._challengeRelationshipDelta[r.left.id];
      const rightRel = r._challengeRelationshipDelta[r.right.id];
      const relLine = (fighter, delta) => delta
        ? `<span><strong>${escHtml(fighter.name)}</strong> → 因縁 ${signedRel(delta.rivalry)} / 相手との関係 ${signedRel(delta.bond)}</span>`
        : '';
      html += `<div style="grid-column:1/-1;display:flex;justify-content:center;gap:18px;flex-wrap:wrap;padding:7px 10px;border-top:1px solid var(--line);color:var(--accent-warm);font-size:11px">${relLine(r.left, leftRel)}${relLine(r.right, rightRel)}</div>`;
    }
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
  // U1: 吹き出しの中身はセリフ本文のみ(話者名は画像下の.pb-fighter-nameが既に示している)
  let bubbleHtml = '';
  if (dialogueLine) {
    bubbleHtml = `<div class="pb-dialogue"><span class="pb-dialogue-line">「${escHtml(dialogueLine)}」</span></div>`;
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
      <div class="pb-tag-portrait">${_pbPortraitImg(m)}</div>
      <div class="pb-tag-member-name">${nameLink}</div>
      <div class="pb-tag-member-ovr"><span class="val">${ovr}</span><span class="lbl">OVR</span></div>
    </div>`;
  }).join('');
  return `<div class="pb-fighter is-${side} is-tag ${stateCls}">
    <div class="pb-tag-lineup">${mems}</div>
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

function _pbHpMini(hpL, hpR, opts = {}) {
  const lPct = hpL.max > 0 ? Math.round(hpL.final / hpL.max * 100) : 0;
  const rPct = hpR.max > 0 ? Math.round(hpR.final / hpR.max * 100) : 0;
  const lFillCls = lPct > 30 ? 'is-healthy' : lPct > 10 ? 'is-warning' : 'is-danger';
  const rFillCls = rPct > 30 ? 'is-healthy' : rPct > 10 ? 'is-warning' : 'is-danger';
  const lData = opts.left || {};
  const rData = opts.right || {};
  const dataAttrs = (d) => Object.keys(d).map(k => ` data-${k}="${escHtml(d[k])}"`).join('');
  return `<div class="pb-hp-mini${opts.className ? ' ' + opts.className : ''}">
    <div class="pb-hp-mini-half is-left ${lFillCls}">
      <span class="pb-hp-mini-val"${dataAttrs(lData)}>${hpL.final} / ${hpL.max}</span>
      <div class="pb-hp-mini-track"><div class="pb-hp-mini-fill ${lFillCls}" style="width:${lPct}%"${dataAttrs(lData)}></div></div>
    </div>
    <div class="pb-hp-mini-label">${opts.label || 'HP'}</div>
    <div class="pb-hp-mini-half is-right ${rFillCls}">
      <div class="pb-hp-mini-track"><div class="pb-hp-mini-fill ${rFillCls}" style="width:${rPct}%"${dataAttrs(rData)}></div></div>
      <span class="pb-hp-mini-val"${dataAttrs(rData)}>${hpR.final} / ${hpR.max}</span>
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
  // task-54: 新聞のサブ記事に顔を出すため、氏名と**並行して選手IDも持つ**。
  // 既存の消費側(見出し・本文の氏名羅列)が文字列配列を前提にしているので、
  // 要素の型は変えずに ID 用の配列を足す形にする。
  const draftSummary = { playerAcquired: [], aiAcquired: {}, aiAcquiredIds: {}, flowThrough: [], flowThroughIds: [] };
  for (const orgId of ['org_s', 'org_a', 'org_b']) { draftSummary.aiAcquired[orgId] = []; draftSummary.aiAcquiredIds[orgId] = []; }

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
          let bgAiFighter = normFighter({ ...clean, orgId: wOrg });
          // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
          { const reg = Engine.mq.registerBignewsHire(G, bgAiFighter); G = reg.state; bgAiFighter = reg.fighter; }
          Engine.rival.pushUniqueFighter(orgData.roster, bgAiFighter);
          draftSummary.aiAcquired[wOrg].push(clean.name);
          if (!draftSummary.aiAcquiredIds) draftSummary.aiAcquiredIds = {};
          (draftSummary.aiAcquiredIds[wOrg] = draftSummary.aiAcquiredIds[wOrg] || []).push(clean.id);
          log.push(`📰 ${clean.name} [${tierLabel}]、${ORG_NAMES[wOrg] || wOrg}と電撃契約`);
        } else {
          // 流札 → dormantPoolに返却
          returnToPool.push(cand.id);
          draftSummary.flowThrough.push(clean.name);
          (draftSummary.flowThroughIds = draftSummary.flowThroughIds || []).push(clean.id);
          log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
        }
      } else {
        // 流札 → dormantPoolに返却
        returnToPool.push(cand.id);
        draftSummary.flowThrough.push(clean.name);
        (draftSummary.flowThroughIds = draftSummary.flowThroughIds || []).push(clean.id);
        log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
      }
    } else if (!isSelected && aiParticipants.length === 1) {
      // → AI自動落札（バックグラウンド: idealRosterでキャップ）
      const winner = aiParticipants[0].orgId;
      const orgData = newAiOrgs[winner];
      if (orgData && canAIDraftAcquire(winner, orgData.roster.length)) {
        let soloAiFighter = normFighter({ ...clean, orgId: winner });
        // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
        { const reg = Engine.mq.registerBignewsHire(G, soloAiFighter); G = reg.state; soloAiFighter = reg.fighter; }
        Engine.rival.pushUniqueFighter(orgData.roster, soloAiFighter);
        draftSummary.aiAcquired[winner].push(clean.name);
        if (!draftSummary.aiAcquiredIds) draftSummary.aiAcquiredIds = {};
        (draftSummary.aiAcquiredIds[winner] = draftSummary.aiAcquiredIds[winner] || []).push(clean.id);
        log.push(`📰 ${ORG_NAMES[winner] || winner}、${clean.name} [${tierLabel}]の獲得を発表`);
      } else {
        // 流札 → dormantPoolに返却
        returnToPool.push(cand.id);
        draftSummary.flowThrough.push(clean.name);
        (draftSummary.flowThroughIds = draftSummary.flowThroughIds || []).push(clean.id);
        log.push(`📰 ${clean.name} [${tierLabel}]、指名漏れ`);
      }
    } else {
      // → 流札 → dormantPoolに返却
      returnToPool.push(cand.id);
      draftSummary.flowThrough.push(clean.name);
      (draftSummary.flowThroughIds = draftSummary.flowThroughIds || []).push(clean.id);
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

  // ドラフトの顛末を**業界ニュースへも積む**(2026-07-27)。
  // このページは直後の「ドラフト結果」画面で見せるものだが、オフシーズン中は新聞が
  // 発行されないため、そのままだと W48 の号にぶら下がったまま本紙には出てこない。
  // 積んでおくと翌シーズン第1週の号（新年号）に記事として載る。
  // 新年号が去年末の引退記事ばかりになるのを避ける狙いもある（Keisuke 2026-07-27）。
  s = _queueDraftIndustryNews(s, draftNewsPage, summary);

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

// ドラフト結果を業界ニュース(_industryNewsEvents)へ積む。
// 記事の中身は「ドラフト結果」画面と同じ材料（draftNewsPage.stories）を使い、
// 見出し・本文だけ NEWS_HEADLINE_TEMPLATES 側の紙面用に組み直す。
// 2箇所で別々に文章を作ると必ず片方だけ古くなるので、材料は1つに保つ。
function _queueDraftIndustryNews(state, draftNewsPage, summary) {
  if (!Engine.industryNews || !draftNewsPage || !Array.isArray(draftNewsPage.stories)) return state;
  let s = state;
  const push = (type, names, extra) => {
    if (!names || names.length === 0) return;
    s = Engine.industryNews.push(s, {
      type,
      characterId: (extra && extra.characterId) != null ? extra.characterId : null,
      characterIds: (extra && extra.characterIds) || null,
      data: {
        org: (extra && extra.org) || '',
        count: names.length,
        names: names.join('、'),
      },
    });
  };
  for (const st of draftNewsPage.stories) {
    if (st.type === 'draftPlayerResult') {
      const ports = st.portraits || [];
      push('draftPlayerResult', ports.map(p => p.name), {
        org: state.orgName || 'プレイヤー団体',
        characterId: ports[0] ? ports[0].id : null,
        // 切り詰めはここでしない。紙面に何人まで載せるかは Engine.newspaper.generate が
        // 決め、載り切らなかった人数は「+N」で示す(task-54)。
        characterIds: ports.map(p => p.id).filter(id => Number.isInteger(id) && id > 0),
      });
    } else if (st.type === 'draftAiResult') {
      // 見出しから団体名を復元せず、本文(氏名の羅列)と見出しの団体名部分を分けて渡す
      const org = String(st.headline || '').split('、')[0];
      // task-54: ID を渡していなかったため、**他団体の新人記事だけ顔が出ていなかった**
      const aiIds = (st.ids || []).filter(id => Number.isInteger(id) && id > 0);
      push('draftAiResult', String(st.body || '').split('、').filter(Boolean), {
        org,
        characterId: aiIds[0] != null ? aiIds[0] : null,
        characterIds: aiIds.length ? aiIds : null,
      });
    } else if (st.type === 'draftFlowThrough') {
      const names = String(st.body || '').split(' — ')[0].split('、').filter(Boolean);
      const ftIds = (st.ids || []).filter(id => Number.isInteger(id) && id > 0);
      push('draftFlowThrough', names, {
        characterId: ftIds[0] != null ? ftIds[0] : null,
        characterIds: ftIds.length ? ftIds : null,
      });
    }
  }
  // 指名漏れゼロは「何も起きなかった」ではなく、それ自体が一行の記事になる
  if (summary && Array.isArray(summary.flowThrough) && summary.flowThrough.length === 0) {
    s = Engine.industryNews.push(s, { type: 'draftEmpty', data: {} });
  }
  return s;
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
        // task-54: 新聞のサブ記事に顔を出すためのID。EMPRESS安全網(empExtra)は
        // 氏名しか持たないので ID 側には入らない。載る顔は実際に取れたぶんだけ。
        ids: [...(summary.aiAcquiredIds?.[orgId] || [])],
      });
    }
  }

  // 流札
  if (summary.flowThrough.length > 0) {
    stories.push({
      headline: `指名漏れ${summary.flowThrough.length}名、フリー市場へ`,
      body: summary.flowThrough.join('、') + ' — 今後のFA市場で動きがあるか注目。',
      type: 'draftFlowThrough',
      ids: [...(summary.flowThroughIds || [])],
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
    // 氏名と並行して持つ選手ID(task-54)。ここで写し忘れると、交渉を1件でも
    // 挟んだ年だけ新聞の顔が消える。
    aiAcquiredIds: {
      org_s: [...(dn.draftSummary?.aiAcquiredIds?.org_s || [])],
      org_a: [...(dn.draftSummary?.aiAcquiredIds?.org_a || [])],
      org_b: [...(dn.draftSummary?.aiAcquiredIds?.org_b || [])],
    },
    flowThrough: [...(dn.draftSummary?.flowThrough || [])],
    flowThroughIds: [...(dn.draftSummary?.flowThroughIds || [])],
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
      // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
      { const reg = Engine.mq.registerBignewsHire(G, signed); G = reg.state; signed = reg.fighter; }
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
      let aiFighter = normFighter({ ...clean, orgId: ns.winner });
      // draft-value-rebalance: AI落札時もtrust指名ボーナス
      {
        const rounds = ns.round || 0;
        const bonus = DRAFT_SIGNING_BONUS;
        const trustBonus = Math.min(bonus.trustCap, bonus.trustBase + rounds * bonus.trustPerRound);
        aiFighter.trust = Math.min(100, (aiFighter.trust || 50) + trustBonus);
      }
      // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
      { const reg = Engine.mq.registerBignewsHire(G, aiFighter); G = reg.state; aiFighter = reg.fighter; }
      Engine.rival.pushUniqueFighter(orgData.roster, aiFighter);
      if (!draftSummary.aiAcquired[ns.winner]) draftSummary.aiAcquired[ns.winner] = [];
      draftSummary.aiAcquired[ns.winner].push(clean.name);
      if (!draftSummary.aiAcquiredIds) draftSummary.aiAcquiredIds = {};
      (draftSummary.aiAcquiredIds[ns.winner] = draftSummary.aiAcquiredIds[ns.winner] || []).push(clean.id);
      const orgInfo = RIVAL_ORGS.find(o => o.id === ns.winner);
      log.push(`⚖ ドラフト: ${clean.name} [${tierLabel}] → ${orgInfo ? orgInfo.name : ns.winner} (${ns.finalBid}万 R${ns.round})`);
    } else {
      returnToPool = true;
      draftSummary.flowThrough.push(clean.name);
      (draftSummary.flowThroughIds = draftSummary.flowThroughIds || []).push(clean.id);
      log.push(`⚖ ドラフト流札: ${clean.name} [${tierLabel}]（団体枠上限）`);
    }
  } else {
    returnToPool = true;
    draftSummary.flowThrough.push(clean.name);
    (draftSummary.flowThroughIds = draftSummary.flowThroughIds || []).push(clean.id);
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

  Audio.play('select');
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
// ─────────────────────────────────────────────────────────────────────────────
// 特別興行の開幕カード紹介 (2026-07-27)
//
// 「これから何が始まるのか」を、始まる前に一枚で見せる(Keisuke 選択)。
// PPV には前から入っていた演出。**新しく作らず、これを5大会の共通口にする。**
//
// カードの枠(ppvmc-card)は「左右が向かい合う」形。5大会すべてこれに載る:
//   夏ジュニア・冬天頂戦   1回戦の全カード(選手 vs 選手)
//   冬PPV                  当日の全カード(従来どおり)
//   秋4団体戦              準決勝2つ(団体 vs 団体 / 顔は大将・下段にメンバー3名)
//   春タッグ               第1節(チーム vs チーム / 顔は1人目・下段に組)
// ─────────────────────────────────────────────────────────────────────────────

/** 開幕カード紹介。cards は上から順に並ぶので、**メインを先頭**にして渡すこと。
 *  cards[i] = { typeLabel, leftName, rightName, leftId, leftOvr, rightId, rightOvr,
 *               badge?, note?, isMain? } */
function showSpecialEventCardIntro(opts) {
  const onStart = (opts && opts.onStart) || (() => {});
  const cards = (opts && opts.cards) || [];
  const el = document.getElementById('ppvMatchCardOverlay');
  if (!el || !cards.length) { onStart(); return; }

  // 前回の表示状態をリセット
  el.style.display = ''; el.style.pointerEvents = '';

  const total = cards.length;
  const cardsHtml = cards.map((c, i) => {
    // z-index: 下の段ほど高い（下のカードの画像が上のカードの背景の前に出る）
    const zIdx = i + 1;
    const sideHtml = (id, ovr) => (typeof _imgOrInitial === 'function')
      ? _imgOrInitial(typeof getFullUrl === 'function' ? getFullUrl(id, ovr) : '', id, 160) : '';
    return `
      <div class="ppvmc-card${c.isMain ? ' is-main' : ''}" style="z-index:${zIdx}">
        <div class="ppvmc-card-bg"></div>
        <div class="ppvmc-fighter left">${sideHtml(c.leftId, c.leftOvr)}</div>
        <div class="ppvmc-center">
          <div class="ppvmc-type">${escHtml(c.typeLabel || '')}</div>
          <div class="ppvmc-cname">${escHtml(c.leftName || '')}</div>
          <div class="ppvmc-vs">V S</div>
          <div class="ppvmc-cname">${escHtml(c.rightName || '')}</div>
          ${c.badge ? `<div class="ppvmc-badge">${escHtml(c.badge)}</div>` : ''}
          ${c.note ? `<div class="ppvmc-h2h">${escHtml(c.note)}</div>` : ''}
        </div>
        <div class="ppvmc-fighter right">${sideHtml(c.rightId, c.rightOvr)}</div>
      </div>`;
  }).join('');

  el.innerHTML = `<div class="ppvmc-inner">
    <div class="ppvmc-title">
      <div class="ppvmc-label">${escHtml(opts.label || 'Special Event')}</div>
      <div class="ppvmc-bigname">${escHtml(opts.bigName || '')}</div>
      <div class="ppvmc-sub">${escHtml(opts.sub || '')}</div>
    </div>
    <div class="ppvmc-list">${cardsHtml}</div>
    <div class="ppvmc-start"><button id="ppvmcStartBtn">S T A R T</button></div>
  </div>`;

  el.classList.add('active');
  const btn = document.getElementById('ppvmcStartBtn');
  if (btn) btn.addEventListener('click', () => {
    Audio.play('click');
    el.classList.remove('active');
    el.style.display = 'none';
    el.style.pointerEvents = 'none';
    onStart();
  });
}

/** 単発エリミネーション(夏ジュニア / 冬天頂戦)の開幕カード紹介。
 *  1回戦の全カード = その大会の出場者全員。並びは表と同じ「上が先の試合」。 */
function _showBracketCardIntro(rounds, meta, onStart) {
  const first = rounds && rounds[0];
  if (!first || !Array.isArray(first.matches) || !first.matches.length) { onStart(); return; }
  const cards = first.matches.map((m, mi) => {
    const rec = Engine.h2h.getRecordFor(G, m.left.id, m.right.id);
    const riv = (typeof _rivalryPreMatchLines === 'function') ? _rivalryPreMatchLines(m.left.id, m.right.id) : null;
    return {
      typeLabel: `${meta.roundLabel} 第${mi + 1}試合`,
      leftName: m.left.name, rightName: m.right.name,
      leftId: m.left.id, leftOvr: m.left.ovr,
      rightId: m.right.id, rightOvr: m.right.ovr,
      badge: riv ? '🔥 ライバル対決' : '',
      note: (rec && rec.matches > 0)
        ? `通算: ${m.left.name} ${rec.wins}勝 - ${rec.losses}勝 ${m.right.name}`
        : 'FIRST MEETING',
    };
  });
  showSpecialEventCardIntro({
    label: meta.label, bigName: meta.bigName, sub: meta.sub, cards, onStart,
  });
}

/** 秋4団体勝ち残り対抗戦の開幕カード紹介。
 *  「団体 vs 団体」を準決勝2つぶん。顔は大将、下段に3名の名前を並べる。 */
function _showAutumnWarCardIntro(result, onStart) {
  const semis = (result && result.results || []).filter(m => m.round === 'semiFinal');
  if (!semis.length) { onStart(); return; }
  const teamOf = orgId => (result.teams || []).find(t => t && t.orgId === orgId);
  const side = (orgId, order) => {
    const team = teamOf(orgId);
    const ids = order || team?.order || team?.memberIds || [];
    // 大将 = 最後に出てくる選手。顔はこの人が背負う
    const aceId = ids[ids.length - 1];
    const ace = (typeof _agwFighter === 'function') ? _agwFighter(orgId, aceId) : null;
    const names = ids.map(id => {
      const f = (typeof _agwFighter === 'function') ? _agwFighter(orgId, id) : null;
      return f ? f.name : '';
    }).filter(Boolean);
    return { name: team?.orgName || '', id: aceId, ovr: ace ? Engine.util.ov(ace) : 0, names };
  };
  const cards = semis.map((m, mi) => {
    const L = side(m.orgA, m.orderA), R = side(m.orgB, m.orderB);
    return {
      typeLabel: `準決勝 ${mi + 1}`,
      leftName: L.name, rightName: R.name,
      leftId: L.id, leftOvr: L.ovr, rightId: R.id, rightOvr: R.ovr,
      note: `${L.names.join('・')}  /  ${R.names.join('・')}`,
    };
  });
  showSpecialEventCardIntro({
    label: 'Special Event',
    bigName: 'AUTUMN SURVIVAL WAR',
    sub: `Season ${G.season || 1} ─ 4団体 × 3名 勝ち残り`,
    cards, onStart,
  });
}

/** 春のタッグリーグの開幕カード紹介。総当たりなので「第1節」を見せる。
 *  顔は各チームの1人目、下段に組の2名と所属を並べる。 */
function _showSpringTagCardIntro(stl, onStart) {
  const matches = (stl && stl.matches) || [];
  const teams = (stl && stl.teams) || [];
  if (!matches.length) { onStart(); return; }
  const orgNameOf = orgId => (teams.find(t => t && t.orgId === orgId) || {}).orgName || '';
  const side = (orgId, team) => {
    const f1 = _stlFighterOf(orgId, team && team.f1Id);
    const f2 = _stlFighterOf(orgId, team && team.f2Id);
    const n1 = f1 ? f1.name : '?', n2 = f2 ? f2.name : '?';
    return {
      name: `${n1} & ${n2}`,
      id: team && team.f1Id,
      ovr: f1 ? Engine.util.ov(f1) : 0,
      org: orgNameOf(orgId),
    };
  };
  // 第1節 = 最初の2試合(4チーム総当たりなので同じ日に2カード進む)
  const cards = matches.slice(0, 2).map((m, mi) => {
    const L = side(m.orgA, m.teamA), R = side(m.orgB, m.teamB);
    return {
      typeLabel: `第1節 第${mi + 1}試合`,
      leftName: L.name, rightName: R.name,
      leftId: L.id, leftOvr: L.ovr, rightId: R.id, rightOvr: R.ovr,
      note: `${L.org}  /  ${R.org}`,
    };
  });
  showSpecialEventCardIntro({
    label: 'Special Event',
    bigName: 'SPRING TAG LEAGUE',
    sub: `Season ${G.season || 1} ─ ${teams.length}チーム 総当たり + 決勝`,
    cards, onStart,
  });
}

function showPPVMatchCardIntro(onStart) {
  const pp = App._ppvPreview;
  if (!pp || pp.card.length === 0) { onStart(); return; }
  const total = pp.card.length;
  // メインイベント(最後のcard)を上、前座(最初のcard)を下に並べる
  const cards = [];
  for (let di = total - 1; di >= 0; di--) {
    const m = pp.card[di];
    const isMain = !!m.isSummit || di === total - 1;
    const rec = Engine.h2h.getRecordFor(G, m.left.id, m.right.id);
    cards.push({
      typeLabel: isMain ? 'MAIN EVENT' : `MATCH ${di + 1}`,
      leftName: m.left.name, rightName: m.right.name,
      leftId: m.left.id, leftOvr: m.left.ovr,
      rightId: m.right.id, rightOvr: m.right.ovr,
      badge: m.isRivalry ? '🔥 ライバル対決' : '',
      note: (rec && rec.matches > 0)
        ? `通算: ${m.left.name} ${rec.wins}勝 - ${rec.losses}勝 ${m.right.name}`
        : 'FIRST MEETING',
      isMain,
    });
  }
  showSpecialEventCardIntro({
    label: 'Special Event',
    bigName: G.ppvName || 'GRAND FINAL',
    sub: `Season ${G.season || 1} ─ 全${total}試合`,
    cards, onStart,
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
      const wName = result.winner === 'draw' ? '決着つかず' : result.winner === 'left' ? match.left.name : match.right.name;
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
    // U6団体バッジ統一: 他団体が絡む対戦のときだけ実エンブレムを出す
    // (mockup-baseline-v0.1 §5)。旧 VS比較ポップアップは 2026-07-26 に削除したため、
    // PPV 中に必ず通るこの対戦紹介が正となる。
    const ppvCrossOrg = (L._ppvOrgId != null && R._ppvOrgId != null)
      ? String(L._ppvOrgId) !== String(R._ppvOrgId)
      : orgL !== orgR;
    const ppvEmblem = (f) => (ppvCrossOrg && typeof orgIconHtml === 'function')
      ? orgIconHtml(f._ppvOrgId, 14) : '';
    const traitsL = (L.traits || []).slice(0, 3);
    const traitsR = (R.traits || []).slice(0, 3);
    // 因縁があれば宣戦布告に差し替える(吹き出しの見た目はPPVのものをそのまま使う)
    const ppvRiv = (typeof _rivalryPreMatchLines === 'function')
      ? _rivalryPreMatchLines(L.id, R.id) : null;
    const lineL = (ppvRiv && ppvRiv.leftLine) || _getPPVPreMatchLine(L);
    const lineR = (ppvRiv && ppvRiv.rightLine) || _getPPVPreMatchLine(R);
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
            <div class="ppvprog-fo">${ppvEmblem(L)}${orgL}</div>
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
            <div class="ppvprog-fo">${ppvEmblem(R)}${orgR}</div>
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

function renderPPVMatchResultPopup(idx, onContinue) {
  const pp = App._ppvPreview;
  const match = pp?.card?.[idx];
  const result = pp?.results?.[idx];
  if (!match || !result) { if (onContinue) onContinue(); return; }
  const total = pp.card.length;
  const winnerSide = result.winner === 'right' ? 'right' : result.winner === 'draw' ? 'draw' : 'left';
  const winner = winnerSide === 'right' ? match.right : match.left;
  let victoryLine = '';
  if (match.isSummit && winnerSide !== 'draw' && typeof PPV_SUMMIT_VICTORY_LINES !== 'undefined' && typeof pickDialogueLine === 'function') {
    try { victoryLine = pickDialogueLine(PPV_SUMMIT_VICTORY_LINES, winner); } catch (_e) {}
  }
  const bestMq = Math.max(...pp.results.filter(Boolean).map(r => r.mq || 0));
  const next = pp.results.findIndex((r, i) => i > idx && r === null);
  showEventMatchResultPopup({
    theme: 'ppv', title: `第${idx + 1}試合　結果`, meta: `YEAR ${G.season} ・ ${G.ppvName || 'GRAND FINAL'} ・ 第${idx + 1}試合 / 全${total}試合`,
    progress: `${idx + 1} / ${total}`, progressLabel: match.isSummit ? 'MAIN EVENT' : idx === total - 2 ? 'CO-MAIN' : 'LIVE',
    context: [['カード', match.isSummit ? '頂上決戦' : `第${idx + 1}試合`], ['大会最高MQ', String(bestMq)], ['次戦', next >= 0 ? `第${next + 1}試合` : '大会結果']],
    left: { ...match.left, org: match.left._ppvOrgName || '', orgId: match.left._ppvOrgId }, right: { ...match.right, org: match.right._ppvOrgName || '', orgId: match.right._ppvOrgId }, winnerSide, winnerFighter: winner,
    leftRole: winnerSide === 'left' ? 'Winner' : 'Challenger', rightRole: winnerSide === 'right' ? 'Winner' : 'Challenger', resultLabel: winnerSide === 'draw' ? 'NO CONTEST' : match.isSummit ? 'SUMMIT WIN' : 'VICTORY',
    finish: Engine.formatFinish(result.finType, result.finMove), turns: result.turns || 0, mq: result.mq, victoryLine,
    chips: [match.isSummit ? 'PPV MAIN EVENT' : `PPV 第${idx + 1}試合`, result.mq === bestMq ? '大会ベストMQ' : '', match.isRivalry ? '因縁対決' : ''],
    hpLeft: result.hpLeft, hpRight: result.hpRight, hpLabel: 'FINAL HP', footNote: winnerSide === 'draw' ? 'PPV ・ 決着つかず' : `PPV ・ ${winner?.name || ''} 勝利`,
    nextLabel: _matchNextLabel(pp.results.every(Boolean)), onContinue,
  });
}

/** PPV試合前のキャラセリフ取得（personality×archetypeベースの汎用セリフ） */
function _getPPVPreMatchLine(fighter) {
  return pickDialogueLine(PPV_OPPONENT_LINES, fighter);
}

function renderPPVResult(card, results, summitPair, heatChange, mqBonuses) {
  _pendingMatchDialogues = [];
  _getRivalryPopupSeen();
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const ppvName = G.ppvName || 'GRAND FINAL';
  const validResults = results.filter(r => r);
  const avgMQ = validResults.length > 0 ? Math.round(validResults.reduce((s, r) => s + r.mq, 0) / validResults.length) : 0;
  const bestMQ = validResults.length > 0 ? Math.max(...validResults.map(r => r.mq)) : 0;
  const heat = getHeatLevel();
  const heatFooterCls = (heat.id === 'hot' || heat.id === 'on_fire') ? 'is-hot' :
                       (heat.id === 'cold' || heat.id === 'ice_cold') ? 'is-cold' : '';

  let html = `<div class="pb-container pb-event-summary pb-theme-ppv">`;

  // Banner
  html += `<div class="pb-banner">
    <div class="pb-summary-emblem"><span aria-hidden="true">♛</span></div>
    <div class="pb-live is-ppv">🏆 GRAND FINAL</div>
    <div class="pb-banner-title is-ppv">${escHtml(ppvName)}</div>
    <div class="pb-banner-sub">Year ${G.season || 1}<span class="dot">·</span>Week ${G.week || 48}<span class="dot">·</span>頂上決戦</div>
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

    // Tags
    const tags = [];
    if (r.isTitleMatch) tags.push(`<span class="pb-tag is-title">🏆 タイトルマッチ</span>`);
    if (r.rivalryResolved) tags.push(`<span class="pb-tag is-rivalry">${r.rivalryResolutionType === 'first' ? '⚔ 宿敵戦勝利' : '⚡ 決着！'}</span>`);
    else if (r.rivalryBonus) tags.push(`<span class="pb-tag is-rivalry">⚔ ${escHtml(r.rivalryBonus.label || '因縁')}</span>`);
    if (r.freshnessBonus) {
      if (r.freshnessBonus > 0) tags.push(`<span class="pb-tag is-first">✨ ${escHtml(r.freshnessLabel || '初顔合わせ')}</span>`);
      else tags.push(`<span class="pb-tag is-stale">😐 ${escHtml(r.freshnessLabel || 'フレッシュ度低')}</span>`);
    }

    // Meta: org name for PPV
    const metaLeft = r.left._ppvOrgName || (isMain ? 'Summit' : `Match ${matchNum}`);
    const metaRight = r.right._ppvOrgName || (isMain ? 'Summit' : `Match ${matchNum}`);

    // 通常興行と同じく因縁マッチの試合後コメントを予約する（App.closePPVResult で消化）
    _queueRivalryMatchDialogue(r, leftIsWinner, isDraw, isMain ? '頂上決戦' : `Match ${matchNum}`, match);

    let winnerLabel;
    if (isDraw) winnerLabel = 'NO CONTEST';
    else {
      const winF = leftIsWinner ? r.left : r.right;
      winnerLabel = `🏆 ${escHtml(winF.name)} WIN`;
    }

    const rowCls = `pb-mrow${isMain ? ' is-main is-ppv' : ''}`;
    html += `<div class="${rowCls}">`;
    html += _pbFighterBlock('left', r.left, leftCls, metaLeft, '');
    html += _pbResultColumn({
      winnerLabel,
      winnerIsDraw: isDraw,
      finishText: Engine.formatFinish(r.finType, r.finMove),
      turns: r.turns,
      mq: r.mq
    });
    html += _pbFighterBlock('right', r.right, rightCls, metaRight, '');
    if (tags.length) html += `<div class="pb-mrow-tags">${tags.join('')}</div>`;
    if (r.hpLeft && r.hpRight) html += _pbHpMini(r.hpLeft, r.hpRight);
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

// ── PPV GRAND FINAL テレビ中継（5場面構成・docs/ui/mockups/ppv-tv-broadcast-mockup.html v1 準拠）──
// 場面: 放送OP → 対戦カード → 試合速報(1試合ずつ) → 頂上決戦(VS→決着) → 放送終了
// カード・結果は Engine.ppv.simulateTVResults の実選手・実シミュレーション値をそのまま表示する
function renderPPVTvBroadcast(card, results, ppvName) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  const summitIdx = card.findIndex(m => m.isSummit);
  const underIdxs = card.map((m, i) => i).filter(i => i !== summitIdx && results[i]);
  const hasSummit = summitIdx >= 0 && !!results[summitIdx];
  const totalMatches = underIdxs.length + (hasSummit ? 1 : 0);
  const watchCount = G.ppvTvWatchCount || 1;

  // 実況コメント(匿名の実況アナ)。MQ帯で温度を分け、(mq+turns)で決定的に選ぶ
  const LIVE_LINES = {
    epic: ['なんという試合だ…！今夜この瞬間を見られた人は幸せ者です！', '場内、総立ち！実況席まで震えが伝わってきます！', 'これぞプロレス！長く語り継がれる一戦になるでしょう！'],
    good: ['決まったーッ！！見事なフィニッシュです！', '大熱戦！客席のボルテージが最高潮です！', '素晴らしい攻防でした！拍手が鳴り止みません！'],
    mid:  ['勝負あり！手堅くまとめました！', '決着です！実力どおりの内容と言えるでしょう。', 'ここで試合終了！さあ、次のカードへ参りましょう。'],
    low:  ['…勝負あり。少し噛み合わなかった印象です。', '決着はつきましたが、静かな幕切れとなりました。', '淡々とした展開のまま、試合終了です。'],
    draw: ['時間切れ…！決着はつきませんでした！', '両者譲らず！これは決着つかずの裁定です！'],
  };
  const _liveLine = (r) => {
    const pool = r.winner === 'draw' ? LIVE_LINES.draw
      : r.mq >= 85 ? LIVE_LINES.epic : r.mq >= 70 ? LIVE_LINES.good : r.mq >= 50 ? LIVE_LINES.mid : LIVE_LINES.low;
    return pool[((r.mq || 0) + (r.turns || 0)) % pool.length];
  };

  // face(1:1) を親より大きい inline サイズのまま入れていたため、CSS を上書きし、
  // 左上だけが丸く切り取られていた。カード列は主役を並べるため upper(2:3) の chip を使う。
  const _face = (f, cls) => {
    const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
    const fallback = escHtml((f.name || '?').charAt(0));
    return `<div class="ptv-upper ${cls || ''}">${upperUrl
      ? `<img src="${upperUrl}" alt="${escHtml(f.name || '')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : ''}<span class="ptv-upper-fallback"${upperUrl ? '' : ' style="display:flex"'}>${fallback}</span></div>`;
  };
  // U6団体バッジ統一: 対戦相手と所属団体が異なるときだけ実エンブレムを出す
  // (mockup-baseline-v0.1 §5「出す条件: 他団体が絡む試合のみ」。GRAND FINALは複数団体混成のため
  // 同一団体の組み合わせも起こり得る)
  const _ptvOrgTag = (f, otherF) => {
    const cross = (f._ppvOrgId != null && otherF._ppvOrgId != null)
      ? String(f._ppvOrgId) !== String(otherF._ppvOrgId)
      : (f._ppvOrgName || '') !== (otherF._ppvOrgName || '');
    return cross && typeof orgIconHtml === 'function' ? orgIconHtml(f._ppvOrgId, 14) : '';
  };
  const _chrome = (liveLabel) => `<div class="ptv-chrome">
    <span class="ptv-ch">WRESTLE TV</span>
    <span class="ptv-live ${liveLabel === 'LIVE' ? '' : 'is-off'}">${liveLabel}</span>
  </div>`;
  const _telop = (cat, main, sub) => `<div class="ptv-telop">
    <div><span class="ptv-telop-cat">${cat}</span><span class="ptv-telop-main">${main}</span></div>
    ${sub ? `<div class="ptv-telop-sub">${sub}</div>` : ''}
  </div>`;
  const _hint = '<div class="ptv-hint">クリックで進む ▶</div>';
  const _resultSide = (fighter, otherF, outcome, size, showWinLabel) => {
    const mark = outcome === 'winner' ? '○' : outcome === 'loser' ? '×' : '△';
    const role = outcome === 'winner' ? '勝者' : outcome === 'loser' ? '敗者' : '引き分け';
    return `<div class="ptv-result-fighter is-${outcome}">
      <div class="ptv-result-mark" aria-label="${role}">${mark}</div>
      ${_face(fighter, `ptv-result-upper ptv-result-upper--${size}`)}
      <div class="ptv-result-name ptv-flash-name">${escHtml(fighter.name)}${showWinLabel ? '<span class="ptv-result-win">WIN</span>' : ''}</div>
      <div class="ptv-result-org">${_ptvOrgTag(fighter, otherF)}${escHtml(fighter._ppvOrgName || '')}</div>
    </div>`;
  };

  const scenes = [];

  // ① 放送オープニング
  scenes.push({
    bgm: 'grandFinalProgress',
    html: _chrome('LIVE') + `<div class="ptv-op">
      <div class="ptv-op-emblem">♛</div>
      <div class="ptv-op-kicker">YEAR-END SPECIAL</div>
      <div class="ptv-op-title">GRAND FINAL</div>
      <div class="ptv-op-sub">年間総決算ペイ・パー・ビュー「${escHtml(ppvName || 'GRAND FINAL')}」</div>
      <div class="ptv-op-badge">全国生中継</div>
    </div>` + _hint + _telop('中継', '年末恒例・女子プロレス年間総決算', '今夜、業界の頂点が決まる — 4団体の代表が集結'),
  });

  // ② 本日の対戦カード(メイン先頭)
  {
    const rowFor = (i) => {
      const m = card[i];
      const main = m.isSummit;
      return `<div class="ptv-mrow ${main ? 'is-main' : ''}">
        ${main ? '<div class="ptv-mtag">MAIN EVENT — 頂上決戦</div>' : ''}
        <div class="ptv-wcell">${_face(m.left)}<div><div class="ptv-wname">${escHtml(m.left.name)}</div><div class="ptv-worg">${_ptvOrgTag(m.left, m.right)}${escHtml(m.left._ppvOrgName || '')}</div></div></div>
        <div class="ptv-vs">VS</div>
        <div class="ptv-wcell is-right"><div><div class="ptv-wname">${escHtml(m.right.name)}</div><div class="ptv-worg">${_ptvOrgTag(m.right, m.left)}${escHtml(m.right._ppvOrgName || '')}</div></div>${_face(m.right)}</div>
      </div>`;
    };
    const order = hasSummit ? [summitIdx, ...underIdxs] : [...underIdxs];
    scenes.push({
      bgm: 'grandFinalProgress',
      html: _chrome('LIVE') + `<div class="ptv-cardlist">
        <div class="ptv-h-row">TONIGHT'S CARD</div>
        ${order.map(rowFor).join('')}
      </div>` + _hint + _telop('カード', `全${totalMatches}試合 — メインは頂上決戦`,
        watchCount <= 1 ? '画面の向こうは、まだ遠い世界だ。' : 'うちの名前は…今年もここにない。'),
    });
  }

  // ③ 試合速報(アンダーカードを1試合ずつ)
  underIdxs.forEach((di, pos) => {
    const m = card[di], r = results[di];
    const isDraw = r.winner === 'draw';
    const winF = r.winner === 'left' ? m.left : r.winner === 'right' ? m.right : null;
    const loseF = winF === m.left ? m.right : m.left;
    // baseline §2 は並置した2人を同じ段に揃えるが、PPV速報では勝敗を瞬時に読ませるという
    // Keisuke 指示を優先し、勝者だけを M、敗者を S に一段下げる意図的な逸脱とする。
    const resultBlock = isDraw
      ? `<div class="ptv-result-fighters is-draw">${_resultSide(m.left, m.right, 'draw', 'm', false)}<div class="ptv-result-divider">DRAW</div>${_resultSide(m.right, m.left, 'draw', 'm', false)}</div>`
      : `<div class="ptv-result-fighters">${_resultSide(winF, loseF, 'winner', 'm', true)}<div class="ptv-result-divider">RESULT</div>${_resultSide(loseF, winF, 'loser', 's', false)}</div>`;
    const dots = underIdxs.map((_, j) => `<span class="ptv-dot ${j <= pos ? 'done' : ''}"></span>`).join('')
      + (hasSummit ? '<span class="ptv-dot"></span>' : '');
    scenes.push({
      bgm: 'grandFinalProgress',
      html: _chrome('LIVE') + `<div class="ptv-flash">
        <div class="ptv-flash-band">
          <div class="ptv-flash-kicker">RESULT — 第${pos + 1}試合</div>
          ${resultBlock}
          <div class="ptv-flash-detail">${r.turns || 0}ターン ${isDraw ? '' : `<b>${escHtml(Engine.formatFinish(r.finType, r.finMove))}</b>`} ／ MQ <b>${r.mq}</b> ${_pbStars(r.mq)}</div>
        </div>
        <div class="ptv-commentary"><div class="ptv-who">実況</div>「${_liveLine(r)}」</div>
        <div class="ptv-dots">${dots}</div>
      </div>` + _hint + _telop('速報', `第${pos + 1}試合 ${winF ? escHtml(winF.name) + ' 勝利' : '決着つかず'}`,
        pos < underIdxs.length - 1 ? '画面の前で、次を見届ける。' : '次はいよいよ、メインイベント。'),
    });
  });

  // ④ 頂上決戦(VS対峙 → 決着の2段階)
  if (hasSummit) {
    const m = card[summitIdx], r = results[summitIdx];
    const isDraw = r.winner === 'draw';
    const winF = r.winner === 'left' ? m.left : r.winner === 'right' ? m.right : null;
    const loseF = winF === m.left ? m.right : m.left;
    const vsBlock = `<div class="ptv-summit-vs">
        <div>${_face(m.left, 'is-big')}<div class="ptv-sname">${escHtml(m.left.name)}</div><div class="ptv-sorg">${_ptvOrgTag(m.left, m.right)}${escHtml(m.left._ppvOrgName || '')}</div></div>
        <div class="ptv-vs-big">VS</div>
        <div>${_face(m.right, 'is-big')}<div class="ptv-sname">${escHtml(m.right.name)}</div><div class="ptv-sorg">${_ptvOrgTag(m.right, m.left)}${escHtml(m.right._ppvOrgName || '')}</div></div>
      </div>`;
    const summitResultBlock = isDraw
      ? `<div class="ptv-result-fighters ptv-summit-result-fighters is-draw">${_resultSide(m.left, m.right, 'draw', 'xl', false)}<div class="ptv-result-divider">DRAW</div>${_resultSide(m.right, m.left, 'draw', 'xl', false)}</div>`
      : `<div class="ptv-result-fighters ptv-summit-result-fighters">${_resultSide(winF, loseF, 'winner', 'xl', true)}<div class="ptv-result-divider">RESULT</div>${_resultSide(loseF, winF, 'loser', 'm', false)}</div>`;
    scenes.push({
      bgm: 'grandFinalMain',
      html: _chrome('LIVE') + `<div class="ptv-summit">
        <div class="ptv-summit-kicker">MAIN EVENT ─ 頂上決戦</div>
        ${vsBlock}
        <div class="ptv-summit-result">両団体の誇りを懸けて——</div>
      </div>` + _hint + _telop('中継', '頂上決戦 まもなくゴング', '実況席にも、張り詰めた空気。'),
    });
    scenes.push({
      bgm: null,
      se: 'rs04',
      stopBgmBeforeSe: true,
      html: _chrome('LIVE') + `<div class="ptv-summit">
        <div class="ptv-summit-kicker">MAIN EVENT ─ 頂上決戦</div>
        ${summitResultBlock}
        <div class="ptv-summit-result">${r.turns || 0}ターンの死闘の末に——
          <div class="ptv-win-line">${isDraw ? '△ 両者譲らず、DRAW' : `🏆 ${escHtml(winF.name)}、業界の頂点へ`}</div>
        </div>
      </div>` + _hint + _telop('速報', `頂上決戦 決着 — MQ ${r.mq} ${_pbStars(r.mq)}`, isDraw ? '決着は、来年に持ち越された。' : 'これが、頂点の景色。'),
    });
  }

  // ⑤ 放送終了(視聴回数で独白を変える)
  const endMsg = watchCount <= 1
    ? 'テレビの明かりを消す。<br><br>初めて画面越しに見た、年末の大舞台。<br>いつか——<b>あの画面の中に立つのはうちの選手たちだ。</b>'
    : 'テレビの明かりを消す。<br><br>今夜の歓声も、私たちのものではなかった。<br>でも——<b>来年こそ、あの画面の中に立つ。</b>';
  scenes.push({
    bgm: null,
    final: true,
    html: _chrome('放送終了') + `<div class="ptv-ending">
      <div class="ptv-end-msg">${endMsg}</div>
      <div class="ptv-end-note">団体人気${typeof PPV_UNLOCK_POP !== 'undefined' ? PPV_UNLOCK_POP : 30}以上で PPV GRAND FINAL への出場資格を獲得できます</div>
      <button type="button" class="ptv-btn" onclick="App.closePPVTV()">事務所へ戻る</button>
    </div>` + _telop('次回', 'また来年 — GRAND FINAL', 'ご視聴ありがとうございました'),
  });

  let sceneIdx = 0;
  const show = () => {
    const sc = scenes[sceneIdx];
    box.innerHTML = `<div class="ptv-tv"><div class="ptv-screen">${sc.html}</div></div>`;
    if (sc.stopBgmBeforeSe) {
      // 決着のファンファーレを主役にする。以後、放送終了までBGMは再開しない。
      try { Audio.bgm.stop(); } catch (e) {}
    } else if (sc.bgm) {
      try { Audio.bgm.playStage(sc.bgm); } catch (e) {}
    } else {
      // 放送終了は無音。直前の頂上決戦曲を次の画面へ持ち越さない。
      try { Audio.bgm.fadeOutStop(350); } catch (e) {}
    }
    if (sc.se === 'rs04' && !Audio.muted) {
      try {
        const a = new window.Audio('../bgm/production-ogg/wm_se_rs04_v01.ogg');
        // PPV TV中継の画面なので、表彰枠(JINGLE_MIX.championship)より一段低く鳴らす。
        // 台帳に TV中継用の値が無いため、元の下げ幅(0.14/0.29 = 約0.48倍)を新しい実聴値 0.39 に掛けた。
        a.volume = Math.min(1, 0.19 * (Audio.sfxMasterVol != null ? Audio.sfxMasterVol : 1));
        a.play().catch(() => {});
      } catch (e) {}
    }
    if (!sc.final) {
      const tv = box.querySelector('.ptv-tv');
      if (tv) tv.addEventListener('click', () => {
        sceneIdx++;
        try { Audio.play('click'); } catch (e) {}
        show();
      }, { once: true });
    }
  };
  show();
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
function calcAttendance(venueIdx, mainPop, hasTitleMatch, hasChampOnCard) { return Engine.economy.calcAttendance(G, venueIdx, mainPop, hasTitleMatch, hasChampOnCard, null); }
function calcShowRevenue(venueIdx, attendance) { return Engine.economy.calcShowRevenue(venueIdx, attendance); }
// 全ポップアップ・トースト・キューを強制クリア（タブ切替・週送り時に使用）
function dismissAllPopups() {
  _POPUP_OVERLAY_IDS.forEach(oid => {
    const el = document.getElementById(oid);
    if (el) { el.classList.remove('active'); el.classList.remove('show'); }
  });
  // confirmOverlayは_POPUP_OVERLAY_IDSに含まれないため個別処理。
  // U4(2026-07-26)調査: 汎用の確認ダイアログはすでにshowConfirm()経由でmdl-d(_mdlDOpen)へ移行済みで、
  // confirmOverlay自体は体験版限定(showTrialLimitMessage/showTrialEndMessage)専用の
  // ニッチな旧系統として残っている。統一モーダルの popup queue(_enqueuePopup/_isPopupActive)には
  // 元々組み込まれておらず、意図的に対象外(この関数でのクリーンアップだけ個別に行う)。
  const confirmEl = document.getElementById('confirmOverlay');
  if (confirmEl) { confirmEl.classList.remove('active'); confirmEl.classList.remove('show'); }
  // 動的war-victory-overlay/db-hof-detail-overlay/cerem-overlayがあれば除去
  document.querySelectorAll('.war-victory-overlay').forEach(el => el.remove());
  document.querySelectorAll('.db-hof-detail-overlay').forEach(el => el.remove());
  document.querySelectorAll('.cerem-overlay').forEach(el => el.remove());
  const battleOverlay = document.getElementById('battleOverlay');
  if (battleOverlay) battleOverlay.style.display = 'none';
  _popupQueue = [];
  _growthPopupQueue = [];
  // **専用キューも必ず空にする(2026-07-31 監査で検出)。**
  // この3系統は「push した時点で自分が1件目なら描画を予約する」という形で回っている。
  // ここで取り残しが1件でも残ると、以後 length===1 の条件が二度と成立せず、
  // **その系統の演出がセッション中まるごと出なくなる**(エラーも出ないので気づけない)。
  // 実際の筋道: 成長ポップアップ表示中に試合後セリフが積まれる → 閉じる →
  // _drainPopupQueue が 200ms 後の予約になる → その隙にタブ移動や「次の週へ」を押すと
  // ここが走り、汎用キュー側の描画予約だけ消えて専用キューに1件残る。
  _eventPopupQueue = [];
  _matchDialogueQueue.length = 0;
  _glimpseQueue.length = 0;
  // キューの空きを待っていたコールバックは、いま空になったので走らせる。
  // 捨てると「待ちが永久に解けない」進行不能を作る(§5-D 鉄則1)。
  const _pendingQueueEmptyCb = _consumeEventPopupQueueEmpty();
  if (_pendingQueueEmptyCb) setTimeout(_pendingQueueEmptyCb, 0);
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
  let btn = t?.closest ? t.closest('.nav-btn') : t;
  if (!btn || !btn.classList?.contains('nav-btn')) {
    btn = Array.from(document.querySelectorAll('.nav-btn')).find(b =>
      b.getAttribute('onclick')?.includes(`'${id}'`)
    ) || null;
  }
  const isPhoneLayout = !!window.matchMedia?.('(max-width: 700px)').matches;
  if (isPhoneLayout) {
    const scroller = document.querySelector('.app');
    if (scroller) scroller.scrollTop = 0;
  }
  if (btn && btn.classList) {
    btn.classList.add('active');
    if (isPhoneLayout) {
      requestAnimationFrame(() => {
        const nav = btn.closest('.nav-bar');
        if (!nav) return;
        const navRect = nav.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const left = nav.scrollLeft + btnRect.left - navRect.left - (nav.clientWidth - btnRect.width) / 2;
        if (typeof nav.scrollTo === 'function') nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        else nav.scrollLeft = Math.max(0, left);
      });
    }
  }
  // v0.9: Auto-render screens that need fresh data
  // BGM: Restore appropriate BGM when leaving show screens
  if (id !== 'show' && G.weekPhase !== 'showExec') Audio.bgm.playForState();
  if (id === 'ranking') renderRanking();
  if (id === 'roster') renderRoster();
  if (id === 'coach') renderCoach();
  if (id === 'scoutEvent') renderScoutEvent();
  if (id === 'database') renderDatabase();
  if (id === 'newspaper') {
    // MQ再設計P4 §5.3: 新聞を開いたら大ニュース未読バッジを消灯
    if (G._bigNewsUnread) G = { ...G, _bigNewsUnread: false };
    renderNewspaper();
    if (typeof refreshTopBar === 'function') refreshTopBar();
  }
  if (id === 'shachoshitsu') renderShachoshitsu();
  // 興行準備だけ再描画対象から漏れていた。#showPrepContent は開幕時などに一度書かれると
  // 誰も上書きしないので、**週が進んでも前の週の内容が残り続ける**。
  // 特別興行週のブロック表示(春タッグ/秋4団体戦/ジュニア)はボタンを持たないため、
  // 古いまま残ると「進めなくなった」ように見える(2026-07-26 Keisuke 報告の再現原因)。
  // showExec 中は興行進行のUIを壊さないよう触らない。
  if (id === 'show' && typeof renderShowPrep === 'function'
      && ['manage', 'showPrep'].includes(G.weekPhase)) renderShowPrep();
  if (id === 'week') renderWeekScreen();
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
    _chainEventPopupQueueEmpty(_renderNextAIAlert);
  } else {
    _chainEventPopupQueueEmpty(_aiAlertCallback ? (() => {
      const cb = _aiAlertCallback;
      _aiAlertCallback = null;
      cb();
    }) : null);
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

// 2026-07-27: 旧「v1.4w 新聞パネル」(showNewspaperPanel) を撤去した。
// 業界ニュースは 📰新聞（weeklyNewspaper / newspaperArchive）に一本化されている。
// 撤去の理由:
//   ・大ニュースも普段の記事も同じ小箱で、見分けがつかなかった
//   ・オーバーレイの外側を1回押すと _newsClose() がパネルごと閉じるため、
//     前/次で送る作りなのに**何枚積まれていても1クリックで全部消えた**
//   ・表示時に state からイベントを削除していたので、閉じた記事はどこにも残らなかった
//     （バックナンバー24号を調べても、この経路の記事は1本も入っていなかった）
// 積み先は App._pushNewsEvent → Engine.industryNews.push に変更済み。

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
// 個人書類用: 対象選手選択モーダル (A-2型)
function showDecisionTargetModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;

  const roster = state.roster || [];
  let candidates;
  if (docId === 'special_treatment') {
    candidates = roster.filter(f => !f.isRental && f.injury && (f.injury.weeksLeft || 0) >= 2);
  } else {
    candidates = roster.filter(f => !f.isRental && !f.injury && !f.onLeave);
    if (docId === 'bonus') {
      candidates = candidates.filter(f => (f.trust != null ? f.trust : 50) < 60);
    } else if (docId === 'encourage') {
      candidates = candidates.filter(f => f.slump || f.motivationLoss);
    }
    // refresh_leave: care-rework v0.1 §2 でスランプ限定を廃止(常時可、疲労管理ツール)
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
  // bonus / refresh_leave は動的コスト(costLabel で表示、実額は次のステップで確定)
  const costText = doc.costLabel ? doc.costLabel : (actualCost === 0 ? '無料' : `${actualCost}万`);

  const candidateCards = candidates.map((f, i) => {
    const lastName = f.name.split(/\s/).pop();
    let hintText = '';
    let hintCls = '';
    if (docId === 'encourage') {
      hintText = f.slump ? 'スランプ' : 'モチベ喪失';
      hintCls = 'negative';
    } else if (docId === 'refresh_leave') {
      if (f.slump || f.motivationLoss) {
        hintText = f.slump ? 'スランプ' : 'モチベ喪失';
        hintCls = 'negative';
      } else {
        const cond = Math.round(f.condition != null ? f.condition : 70);
        hintText = `体調 ${cond}`;
        hintCls = cond < 60 ? 'negative' : '';
      }
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
    // care-rework v0.1: bonus / refresh_leave は金額・週数を決める第2ステップへ。
    // ※ここで _mdlAClose() を呼んではいけない — close は _drainPopupQueue を走らせるため、
    //   キューに溜まったポップアップが第2ステップのモーダルを上書きして操作不能になる。
    //   _mdlAOpen が card.innerHTML を差し替えるので、開いたまま次の画面へ遷移してよい。
    if (docId === 'bonus') { showBonusProposalModal(selectedFighterId, G); return; }
    if (docId === 'refresh_leave') { showLeaveWeeksModal(selectedFighterId, G); return; }
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision(docId, selectedFighterId);
    }
  });
}

// care-rework v0.1 §1.1: ボーナス起案4案の選択モーダル(対象選手決定後の第2ステップ)
// 4案 = 基準額×{0.5, 1.0, 2.0, 3.0}(シード固定・開き直しても不変)。基準額そのものは見せない。
function showBonusProposalModal(fighterId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.bonus : null;
  const f = (state.roster || []).find(c => c.id === fighterId);
  if (!doc || !f) return;
  const proposals = Engine.shachoshitsu.getBonusProposals(f, state);
  const funds = state.funds || 0;
  if (!proposals.some(p => p.amount <= funds)) {
    showToast('どの起案額にも資金が足りません');
    return;
  }
  const memos = (typeof BONUS_PROPOSAL_MEMOS !== 'undefined') ? BONUS_PROPOSAL_MEMOS : ['', '', '', ''];
  const warning = (typeof BONUS_PROPOSAL_MEMO_WARNING !== 'undefined') ? BONUS_PROPOSAL_MEMO_WARNING : '';
  // 初期選択: 案二(相場)が払えるならそこ、無理なら払える中で最上位の案
  const affordable = [0, 1, 2, 3].filter(i => proposals[i].amount <= funds);
  const defaultIdx = proposals[1].amount <= funds ? 1 : affordable[affordable.length - 1];
  const kanji = ['一', '二', '三', '四'];
  const cards = proposals.map((p, i) => {
    const isWarned = i === 0 && p.proud;
    const memo = isWarned ? warning : (memos[i] || '');
    const afford = p.amount <= funds;
    const selCls = (afford && i === defaultIdx) ? ' is-selected' : '';
    return `<div class="mdl-a-decision-card${selCls}" data-idx="${i}" style="text-align:center${afford ? '' : ';opacity:0.45;pointer-events:none'}">
      <div style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-bottom:6px">案 ${kanji[i]}</div>
      <div class="mdl-a-decision-label" style="font-size:19px;margin-bottom:8px">${p.amount.toLocaleString()}<span style="font-size:12px">万</span></div>
      <div style="font-size:11px;line-height:1.6;min-height:3.2em;${isWarned ? 'color:var(--accent-negative)' : 'color:var(--cream-text-sub)'}">${memo}</div>
      ${afford ? '' : '<div style="font-size:10px;color:var(--accent-negative);margin-top:6px">資金不足</div>'}
    </div>`;
  }).join('');

  const stageBody = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.6;margin-bottom:14px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${f.name} への支給額の起案が上がっている。いくら積むかは、社長の判断ひとつ。</div>
    <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:10px">PROPOSALS ・ 起 案</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px" id="mdlABonusGrid">
      ${cards}
    </div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '支給額を選んでください')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">選択後、決裁ボタンを押してください</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlABonusCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlABonusConfirm" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  let selectedIdx = defaultIdx;
  const grid = document.getElementById('mdlABonusGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const el = e.target.closest('.mdl-a-decision-card');
      if (!el) return;
      selectedIdx = parseInt(el.dataset.idx);
      grid.querySelectorAll('.mdl-a-decision-card').forEach(c => c.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  }
  document.getElementById('mdlABonusCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlABonusConfirm').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision('bonus', fighterId, { presetIndex: selectedIdx });
    }
  });
}

// 派閥解散命令の処置選択モーダル(2026-07-27)
// 新しい枠は作らず、ボーナス起案4案と同じ mdl-a-decision-card グリッドをそのまま使う。
// 出す案は状況で変わる: 封印中なら「解除」だけ / 派閥がいるなら「解散」と「解散して禁止」/
// 派閥がまだ無いなら「禁止だけ」。
function showFactionDecreeModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;
  const factions = state.factions || [];
  const sealed = !!state.factionsSealed;

  let options;
  if (sealed) {
    options = [{
      mode: 'unseal', title: '禁 止 を 解 く',
      note: '選手たちが再び群れを作ることを認める。畳んだ派閥は戻らない',
    }];
  } else if (factions.length > 0) {
    const names = factions.map(f => f.name).join('・');
    const heads = factions.reduce((s, f) => s + (f.memberIds || []).length, 0);
    options = [
      {
        mode: 'dissolve', title: '解 散 さ せ る',
        note: `${names}（${heads}名）を畳む。時が経てば、また新しい群れが生まれる`,
      },
      {
        mode: 'seal', title: '解 散 し 、 以 後 認 め な い',
        note: `${names}（${heads}名）を畳み、今後いっさい派閥を作らせない`,
      },
    ];
  } else {
    options = [{
      mode: 'seal', title: '以 後 認 め な い',
      note: '今はまだ誰も群れていない。生まれる前に禁じておけば、誰の信頼も損なわない',
    }];
  }

  const cards = options.map((o, i) => `
    <div class="mdl-a-decision-card${i === 0 ? ' is-selected' : ''}" data-mode="${o.mode}" style="text-align:center">
      <div class="mdl-a-decision-label" style="font-size:15px;margin-bottom:10px">${o.title}</div>
      <div style="font-size:11px;line-height:1.7;color:var(--cream-text-sub);min-height:3.4em">${o.note}</div>
    </div>`).join('');

  const warning = (!sealed && factions.length > 0)
    ? '<div style="font-size:12px;color:var(--accent-negative);text-align:center;margin-top:14px;line-height:1.7">畳まれた選手たちの信頼は下がる。とくに束ねていた本人には深く残る</div>'
    : '';

  const stageBody = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.7;margin-bottom:14px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${doc.detailText || ''}</div>
    <div style="display:flex;justify-content:center;gap:18px;align-items:baseline;font-size:13px;color:var(--cream-text-main);margin-bottom:16px">
      <span><span style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-right:6px">COST</span><strong style="color:var(--cream-gold-dark)">無料</strong></span>
      <span style="color:rgba(122,101,48,0.3)">|</span>
      <span><span style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-right:6px">DP</span><strong>⚡${doc.decisionCost}</strong></span>
    </div>
    <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:10px">DECREE ・ 処 置</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px" id="mdlAFactionGrid">
      ${cards}
    </div>
    ${warning}
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '処置を選んでください')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">選択後、決裁ボタンを押してください</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlAFactionCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlAFactionConfirm" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  let selectedMode = options[0].mode;
  const grid = document.getElementById('mdlAFactionGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const el = e.target.closest('.mdl-a-decision-card');
      if (!el) return;
      Audio.play('switch');
      selectedMode = el.dataset.mode;
      grid.querySelectorAll('.mdl-a-decision-card').forEach(c => c.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  }
  document.getElementById('mdlAFactionCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlAFactionConfirm').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision(docId, null, { mode: selectedMode });
    }
  });
}

// care-rework v0.1 §2.1: 休暇辞令の週数選択モーダル(対象選手決定後の第2ステップ)
// 費用 = 週給×週数 + 手配費50万。「休暇中の試合には欠場します」は確定文言(Keisuke 指定)。
function showLeaveWeeksModal(fighterId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.refresh_leave : null;
  const f = (state.roster || []).find(c => c.id === fighterId);
  if (!doc || !f) return;
  const funds = state.funds || 0;
  const opts = [1, 2, 3, 4].map(w => ({ weeks: w, cost: Engine.shachoshitsu.getLeaveCost(f, state, w) }));
  if (opts[0].cost > funds) {
    showToast('資金が足りません');
    return;
  }
  const effectHints = [
    '体調が少し戻る',
    '体調が戻り、積み重なった消耗もわずかに癒える',
    '体調が大きく戻る。消耗の回復も',
    '体調・消耗ともに回復は最大。ただし1ヶ月不在',
  ];
  const defaultIdx = opts[1].cost <= funds ? 1 : 0;
  const cards = opts.map((o, i) => {
    const afford = o.cost <= funds;
    const selCls = (afford && i === defaultIdx) ? ' is-selected' : '';
    return `<div class="mdl-a-decision-card${selCls}" data-idx="${i}" style="text-align:center${afford ? '' : ';opacity:0.45;pointer-events:none'}">
      <div class="mdl-a-decision-label" style="font-size:18px;margin-bottom:4px">${o.weeks}週間</div>
      <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold-dark);letter-spacing:1px;margin-bottom:8px">${o.cost.toLocaleString()}万</div>
      <div style="font-size:11px;line-height:1.6;min-height:3.2em;color:var(--cream-text-sub)">${effectHints[i]}</div>
      ${afford ? '' : '<div style="font-size:10px;color:var(--accent-negative);margin-top:6px">資金不足</div>'}
    </div>`;
  }).join('');

  const stageBody = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.6;margin-bottom:10px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${f.name} に与える休暇の長さを決める。長いほど心身は癒えるが、そのぶんリングを空ける。</div>
    <div style="text-align:center;margin-bottom:14px"><span style="display:inline-block;font-size:12px;color:var(--accent-negative);border:1px solid var(--accent-negative);border-radius:4px;padding:4px 12px">※ 休暇中の試合には欠場します</span></div>
    <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:10px">DURATION ・ 休 暇 週 数</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px" id="mdlALeaveGrid">
      ${cards}
    </div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '休暇の週数を選んでください')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">選択後、決裁ボタンを押してください</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlALeaveCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlALeaveConfirm" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  let selectedIdx = defaultIdx;
  const grid = document.getElementById('mdlALeaveGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const el = e.target.closest('.mdl-a-decision-card');
      if (!el) return;
      selectedIdx = parseInt(el.dataset.idx);
      grid.querySelectorAll('.mdl-a-decision-card').forEach(c => c.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  }
  document.getElementById('mdlALeaveCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlALeaveConfirm').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision('refresh_leave', fighterId, { weeks: opts[selectedIdx].weeks });
    }
  });
}

// care-rework v0.1 §3: 外部コーチ招聘 第1ステップ — 今期候補(2〜3名)からコーチを選ぶ。
// bonus/refresh_leaveとは逆順(コーチ選択が先、対象選手選択は showInviteTargetModal で後段)。
function showInviteCoachModal(state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.trainer : null;
  if (!doc) return;
  const market = Engine.shachoshitsu.ensureInviteMarket(state);
  const candidates = (market.candidateIds || []).map(id => ALL_COACHES.find(c => c.id === id)).filter(Boolean);
  if (candidates.length === 0) {
    showToast('今期招聘できるコーチがいません');
    return;
  }
  const funds = state.funds || 0;
  const gradeLabel = { C: 'C級', B: 'B級', A: 'A級' };
  const defaultId = candidates.find(c => Engine.shachoshitsu.getInviteCost(c, state) <= funds)?.id ?? candidates[0].id;
  const cards = candidates.map((c) => {
    const cost = Engine.shachoshitsu.getInviteCost(c, state);
    const afford = cost <= funds;
    const typeLabel = (typeof COACHING_TYPE_LABELS !== 'undefined' && COACHING_TYPE_LABELS[c.coachingType]) || '';
    const styleLabel = (typeof COACH_STYLE_MAP !== 'undefined' && COACH_STYLE_MAP[c.style]) || c.style;
    const abilities = (c.abilities || []).slice(0, 2).join(' / ');
    const selCls = c.id === defaultId ? ' is-selected' : '';
    const faceUrl = (typeof getCoachPortraitUrl === 'function') ? getCoachPortraitUrl(c.id) : '';
    const bg = faceUrl
      ? `background-image:url('${faceUrl}');background-size:cover;background-position:top center`
      : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
    return `<div class="mdl-a-decision-card${selCls}" data-id="${c.id}" style="text-align:center${afford ? '' : ';opacity:0.45;pointer-events:none'}">
      <div style="width:64px;height:64px;margin:0 auto 8px;${bg};background-color:#2a2520;border:2px solid var(--cream-gold-dark);border-radius:50%"></div>
      <div class="mdl-a-decision-label" style="font-size:15px;margin-bottom:2px">${c.name}</div>
      <div style="font-family:var(--font-label);font-size:9px;color:var(--cream-gold);letter-spacing:1.5px;margin-bottom:6px">${gradeLabel[c.grade] || c.grade} ・ ${typeLabel}</div>
      <div style="font-size:11px;color:var(--cream-text-sub);margin-bottom:4px">得意: ${styleLabel}</div>
      <div style="font-size:10px;color:var(--cream-text-dim);line-height:1.5;min-height:2.2em">${abilities}</div>
      <div style="font-size:13px;color:var(--cream-gold-dark);font-weight:700;margin-top:6px">${cost.toLocaleString()}万</div>
      ${afford ? '' : '<div style="font-size:10px;color:var(--accent-negative);margin-top:4px">資金不足</div>'}
    </div>`;
  }).join('');

  const stageBody = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.6;margin-bottom:10px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">今期、招聘に応じてくれそうなコーチの顔ぶれ。指導タイプと得意スタイルを見て、誰に任せるか決める。</div>
    <div style="text-align:center;margin-bottom:14px"><span style="display:inline-block;font-size:12px;color:var(--cream-gold-dark);border:1px solid var(--cream-gold-dark);border-radius:4px;padding:4px 12px">招聘期間は 4週間 ・ 同時に招聘できるのは1名まで</span></div>
    <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:10px">CANDIDATES ・ 招 聘 候 補</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px" id="mdlAInviteCoachGrid">
      ${cards}
    </div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '招聘するコーチを選んでください')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">選択後、次へ進んでください</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlAInviteCoachCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlAInviteCoachNext" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 次 へ —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  let selectedCoachId = defaultId;
  const grid = document.getElementById('mdlAInviteCoachGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const el = e.target.closest('.mdl-a-decision-card');
      if (!el) return;
      selectedCoachId = parseInt(el.dataset.id);
      grid.querySelectorAll('.mdl-a-decision-card').forEach(c => c.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  }
  document.getElementById('mdlAInviteCoachCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlAInviteCoachNext').addEventListener('click', () => {
    Audio.play('click');
    // 連鎖遷移中は close しない(_drainPopupQueue が次画面を上書きするため)。_mdlAOpen が差し替える
    showInviteTargetModal(selectedCoachId, G);
  });
}

// care-rework v0.1 §3: 外部コーチ招聘 第2ステップ — 対象選手を選ぶ。
// 候補は非レンタル・非怪我・非休暇・招聘中でない選手。スタイル一致(✦/○)だけ表示し、
// 指導相性は「事前には完全に分からない」(spec §3.3)ため出さない。消化力逓減中はヒントのみ。
function showInviteTargetModal(coachId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.trainer : null;
  const coach = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES.find(c => c.id === coachId) : null;
  if (!doc || !coach) return;

  const cost = Engine.shachoshitsu.getInviteCost(coach, state);
  if ((state.funds || 0) < cost) {
    showToast('資金が足りません');
    return;
  }

  const roster = state.roster || [];
  const candidates = roster.filter(f => !f.isRental && !f.injury && !f.onLeave && !f._inviteBuff);
  if (candidates.length === 0) {
    showToast('対象候補の選手がいません');
    return;
  }

  const absoluteWeek = Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
  const cards = candidates.map((f, i) => {
    const lastName = f.name.split(/\s/).pop();
    const sm = (typeof getCoachStyleMatch === 'function') ? getCoachStyleMatch(coach, f) : { icon: '', cls: 'none' };
    // 無印方式(2026-07-07 Keisuke 判断): 不一致が標準なので何も出さない。
    // バッジが付くこと自体をボーナスとして見せる(「不一致」の減点表示をやめる)
    const matchHtml = sm.cls === 'specialist'
      ? `<span style="font-weight:700;color:#2ecc71">✦ 得意スタイル</span>`
      : sm.cls === 'allround'
        ? `<span style="font-weight:700;color:#f1c40f">○ 万能指導</span>`
        : '&nbsp;';
    const diminishedHint = (f._lastInviteEndWeek != null && (absoluteWeek - f._lastInviteEndWeek) <= 12)
      ? `<div class="mdl-a-decision-hint negative">詰め込み注意</div>` : '';
    const faceUrl = (typeof getPortraitUrl === 'function') ? getPortraitUrl(f.id) : '';
    const bg = faceUrl
      ? `background-image:url('${faceUrl}');background-size:cover;background-position:center`
      : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
    const selCls = i === 0 ? ' is-selected' : '';
    return `<div class="mdl-a-decision-card${selCls}" data-id="${f.id}" style="text-align:center">
      <div style="width:72px;height:72px;margin:0 auto 8px;${bg};background-color:#2a2520;border:2px solid var(--cream-gold-dark);border-radius:50%"></div>
      <div class="mdl-a-decision-label" style="margin-bottom:4px">${lastName}</div>
      <div style="font-family:var(--font-label);font-size:9px;color:var(--cream-gold);letter-spacing:1.5px;margin-bottom:6px">AGE ${f.age || '—'} ・ OVR ${Engine.util.ov(f)}</div>
      <div style="font-size:11px;margin-bottom:2px">${matchHtml}</div>
      ${diminishedHint}
    </div>`;
  }).join('');

  const stageBody = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.6;margin-bottom:12px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${coach.name}コーチを、誰に付ける。4週間の指導になる。指導との相性までは、始めてみないと分からない。</div>
    <div style="display:flex;justify-content:center;gap:18px;align-items:baseline;font-size:13px;color:var(--cream-text-main);margin-bottom:14px">
      <span><span style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-right:6px">COST</span><strong style="color:var(--cream-gold-dark)">${cost.toLocaleString()}万</strong></span>
      <span style="color:rgba(122,101,48,0.3)">|</span>
      <span><span style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;margin-right:6px">DP</span><strong>⚡${doc.decisionCost}</strong></span>
    </div>
    <label style="display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto 14px;padding:10px 14px;max-width:360px;border:1px solid rgba(100,85,50,0.18);border-radius:8px;background:rgba(255,255,255,0.45);font-size:12px;color:var(--cream-text-main)">
      <input type="checkbox" id="mdlAInviteAutoRenew" checked>
      <span>満了後は自動継続する。途中で2週延長が入った場合は、その終了後に継続する。</span>
    </label>
    <div style="font-family:var(--font-label);font-size:11px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:10px">CANDIDATES ・ 対 象 選 手</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px" id="mdlAInviteTargetGrid">
      ${cards}
    </div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '対象となる選手を選んでください')}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">選択後、決裁ボタンを押してください</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlAInviteTargetBack">— 戻 る —</button>
      <button class="mdl-a-continue-btn" id="mdlAInviteTargetConfirm" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  let selectedFighterId = candidates[0].id;
  const grid = document.getElementById('mdlAInviteTargetGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const el = e.target.closest('.mdl-a-decision-card');
      if (!el) return;
      selectedFighterId = parseInt(el.dataset.id);
      grid.querySelectorAll('.mdl-a-decision-card').forEach(c => c.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  }
  document.getElementById('mdlAInviteTargetBack').addEventListener('click', () => {
    Audio.play('click');
    // 連鎖遷移中は close しない(_drainPopupQueue が次画面を上書きするため)
    showInviteCoachModal(G);
  });
  document.getElementById('mdlAInviteTargetConfirm').addEventListener('click', () => {
    Audio.play('click');
    const autoRenew = !!document.getElementById('mdlAInviteAutoRenew')?.checked;
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision('trainer', selectedFighterId, { coachId, autoRenew });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// care-rework v0.1 §3.4/§7 P4: 招聘 過程イベント(中間報告/衝突/延長打診/卒業レポート)
// ─────────────────────────────────────────────────────────────────────────────

// コーチ本人を話者にした reporter-strip(_mdlAReporterStrip はランダム取次者用のため専用版を用意)
function _inviteCoachReporterStrip(coach, line) {
  const url = (typeof getCoachPortraitUrl === 'function') ? getCoachPortraitUrl(coach.id) : '';
  const bg = url
    ? `background-image:url('${url}'),linear-gradient(135deg,#5a4a3a,#3a2d22);background-size:cover;background-position:center`
    : `background:linear-gradient(135deg,#5a4a3a,#3a2d22)`;
  return `<div class="mdl-a-reporter-strip">
    <div class="mdl-a-reporter-portrait" style="${bg}"></div>
    <div class="mdl-a-reporter-text">
      <div class="mdl-a-reporter-name">${coach.name || ''} コーチ</div>
      <div class="mdl-a-reporter-line">${String(line || '')}</div>
    </div>
  </div>`;
}

// 中間報告: コーチ顔+一言の軽いポップアップ(1クリックで閉じる) — showNotifEventToast(mdl-d)を流用
function showInviteMidtermPopup(payload, state, onDone) {
  const coach = ALL_COACHES.find(c => c.id === payload.coachId);
  const fighter = (state.roster || []).find(f => f.id === payload.fighterId);
  if (!coach || !fighter) { if (onDone) onDone(); return; }
  const voiceKey = getCoachVoiceKey(coach.id);
  const line = (COACH_INVITE_LINES.midterm && COACH_INVITE_LINES.midterm[voiceKey]) || '';
  if (typeof showNotifEventToast !== 'function' || !document.getElementById('mdlDOverlay')) {
    showToast(`${coach.name}コーチ: ${line}`);
    if (onDone) onDone();
    return;
  }
  showNotifEventToast({
    type: 'N_invite_midterm',
    fighter: coach.id,
    text: `🎓 ${coach.name}コーチより、${fighter.name}の指導状況`,
    detail: line,
  });
  // showNotifEventToast は OK ボタンで _drainPopupQueue するのみで onDone を呼ばないため、
  // ここでは即座に onDone してキュー管理は App._drainInviteEvents 側に委ねる。
  if (onDone) onDone();
}

// 衝突イベント: コーチ顔+申し立てセリフ+選択肢A(続行)/B(打ち切り)
function showInviteConflictModal(payload, state, onChoice) {
  const coach = ALL_COACHES.find(c => c.id === payload.coachId);
  const fighter = (state.roster || []).find(f => f.id === payload.fighterId);
  if (!coach || !fighter) { if (onChoice) onChoice(null); return; }
  const voiceKey = getCoachVoiceKey(coach.id);
  const line = (COACH_INVITE_LINES.conflict && COACH_INVITE_LINES.conflict[voiceKey]) || '';

  const stageBody = `
    <div class="mdl-a-observation centered" style="padding-top:6px">
      <span class="marker">${fighter.name}</span> の指導について
    </div>
  `;
  const html = `
    ${_mdlAHeader(`⚠️ 指導方針の衝突`, `EVENT ・ ${_mdlASeasonLabel(state)}`, { urgent: true })}
    ${_inviteCoachReporterStrip(coach, line)}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt">どう対応しますか？</div>
    <div class="mdl-a-decision-tray two">
      <div class="mdl-a-decision-card" data-choice="continue">
        <div class="mdl-a-decision-letter">A</div>
        <div class="mdl-a-decision-label">続行させる</div>
        <div class="mdl-a-decision-hint negative">選手は不満を残すが、指導は続く</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="cancel">
        <div class="mdl-a-decision-letter">B</div>
        <div class="mdl-a-decision-label">打ち切る</div>
        <div class="mdl-a-decision-hint negative">返金なし・選手の心に跡が残る</div>
      </div>
    </div>
  `;
  if (!_mdlAOpen(html, { narrow: true })) { if (onChoice) onChoice(null); return; }
  const card = document.getElementById('mdlACard');
  card.querySelectorAll('.mdl-a-decision-card').forEach(el => {
    el.addEventListener('click', () => {
      Audio.play('click');
      _mdlAClose();
      if (onChoice) onChoice(el.dataset.choice);
    });
  });
}

// 延長打診: コーチ顔+セリフ+「受ける(費用表示)/断る」。資金不足なら受けるをグレーアウト
function showInviteExtensionModal(payload, state, onChoice) {
  const coach = ALL_COACHES.find(c => c.id === payload.coachId);
  const fighter = (state.roster || []).find(f => f.id === payload.fighterId);
  if (!coach || !fighter) { if (onChoice) onChoice(null); return; }
  const voiceKey = getCoachVoiceKey(coach.id);
  const line = (COACH_INVITE_LINES.extension && COACH_INVITE_LINES.extension[voiceKey]) || '';
  const cost = payload.cost || 0;
  const funds = state.funds || 0;
  const dpCost = (typeof DECISION_DOCS !== 'undefined' && DECISION_DOCS.trainer) ? (DECISION_DOCS.trainer.decisionCost || 0) : 0;
  const afford = cost <= funds;
  const hasDp = (state.decisionPoints || 0) >= dpCost;
  const canAccept = afford && hasDp;
  const renewLabel = payload.autoRenew ? 'ON' : 'OFF';

  const stageBody = `
    <div class="mdl-a-observation centered" style="padding-top:6px">
      <span class="marker">${fighter.name}</span> の指導期間延長(+2週)
    </div>
    <div style="text-align:center;font-size:13px;color:var(--cream-text-main);margin-top:10px">
      追加費用 <strong style="color:var(--cream-gold-dark)">${cost.toLocaleString()}万</strong>
    </div>
    <div style="text-align:center;font-size:12px;color:var(--cream-text-sub);margin-top:8px">
      決裁枠 <strong>⚡${dpCost}</strong> ・ 自動継続 <strong>${renewLabel}</strong>
    </div>
  `;
  const html = `
    ${_mdlAHeader(`📩 延長打診`, `EVENT ・ ${_mdlASeasonLabel(state)}`)}
    ${_inviteCoachReporterStrip(coach, line)}
    <div class="mdl-a-subject-stage">${stageBody}</div>
    <div class="mdl-a-prompt">どうしますか？</div>
    <div class="mdl-a-decision-tray two">
      <div class="mdl-a-decision-card" data-choice="accept" ${canAccept ? '' : 'data-disabled="1" style="opacity:0.4;cursor:default"'}>
        <div class="mdl-a-decision-letter">A</div>
        <div class="mdl-a-decision-label">受ける(${cost.toLocaleString()}万 / ⚡${dpCost})</div>
        ${canAccept ? '' : `<div class="mdl-a-decision-hint negative">${!afford ? '資金不足' : '決裁枠不足'}</div>`}
      </div>
      <div class="mdl-a-decision-card" data-choice="decline">
        <div class="mdl-a-decision-letter">B</div>
        <div class="mdl-a-decision-label">断る</div>
      </div>
    </div>
  `;
  if (!_mdlAOpen(html, { narrow: true })) { if (onChoice) onChoice(null); return; }
  const card = document.getElementById('mdlACard');
  card.querySelectorAll('.mdl-a-decision-card').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.disabled === '1') return;
      Audio.play('click');
      _mdlAClose();
      if (onChoice) onChoice(el.dataset.choice);
    });
  });
}

// 卒業レポート: コーチ総評(voice別)+選手の一言(アーキタイプ別・頭上吹き出し)+伸び幅表示。
// 化ける発生時はナレーション+コーチの一言を先頭に追加し、金色系トークンで一段豪華に演出。
function showInviteGraduationModal(payload, state, onDone) {
  const coach = ALL_COACHES.find(c => c.id === payload.coachId);
  const fighter = (state.roster || []).find(f => f.id === payload.fighterId);
  if (!coach || !fighter) { if (onDone) onDone(); return; }
  const voiceKey = getCoachVoiceKey(coach.id);
  const gradPool = payload.gradTier === 'good' ? COACH_INVITE_LINES.gradGood : COACH_INVITE_LINES.gradNormal;
  const coachLine = (gradPool && gradPool[voiceKey]) || '';

  const archetype = fighter.archetype || 'normal';
  const fighterLine = payload.gradTier === 'good'
    ? (FIGHTER_INVITE_GRAD_LINES[archetype] || FIGHTER_INVITE_GRAD_LINES.normal)
    : FIGHTER_INVITE_GRAD_NORMAL_LINES[Math.floor(Math.random() * FIGHTER_INVITE_GRAD_NORMAL_LINES.length)];

  // 伸び幅表示: statsAtStart が無い(旧セーブ互換)場合は「不明」表記に切り替え
  let growthHtml = '';
  if (payload.statsAtStart && payload.statsAtEnd) {
    const STAT_JA = { pw: 'パワー', sp: 'スピード', te: 'テクニック', st: 'スタミナ', mn: 'メンタル' };
    const rows = ['pw','sp','te','st','mn'].map(k => {
      const delta = Math.round((payload.statsAtEnd[k] || 0) - (payload.statsAtStart[k] || 0));
      if (delta <= 0) return '';
      return `<div style="display:flex;justify-content:space-between;padding:2px 0">
        <span style="color:var(--cream-text-sub)">${STAT_JA[k]}</span>
        <span style="color:var(--accent-positive);font-weight:700">+${delta}</span>
      </div>`;
    }).filter(Boolean).join('');
    growthHtml = rows
      ? `<div style="background:rgba(255,255,255,0.35);border:1px solid rgba(100,85,50,0.15);border-radius:6px;padding:10px 14px;margin:14px auto 0;max-width:320px;font-size:12px">${rows}</div>`
      : `<div style="text-align:center;font-size:12px;color:var(--cream-text-dim);margin-top:12px">大きな変化は数値には出なかったが、確かな手応えが残った</div>`;
  } else {
    growthHtml = `<div style="text-align:center;font-size:12px;color:var(--cream-text-dim);margin-top:12px">伸び幅は記録が残っていません</div>`;
  }

  // 化ける演出: ナレーション + コーチの一言(全voice共通)を先頭に追加、金色トークンで一段豪華に
  const awakeningHtml = payload.awakened
    ? `<div style="text-align:center;margin-bottom:16px;padding:14px;border:1px solid var(--cream-gold);border-radius:8px;background:rgba(212,168,67,0.08)">
        <div style="font-family:'Shippori Mincho',serif;font-size:13px;color:var(--cream-gold-dark);line-height:1.8;font-style:italic">${INVITE_AWAKENING_LINES.narration}</div>
        <div style="margin-top:8px;font-size:13px;color:var(--cream-text-main)">${coach.name}コーチ「${INVITE_AWAKENING_LINES.coachLine.replace(/^「|」$/g, '')}」</div>
        <div style="margin-top:6px;font-size:11px;color:var(--cream-gold-dark);letter-spacing:2px;font-family:var(--font-label)">— 才能の壁を、一枚だけ超えた —</div>
      </div>`
    : '';

  const tierLabel = payload.gradTier === 'good' ? '成果: 大' : '成果: 並';
  const stageBody = `
    ${awakeningHtml}
    <div style="font-family:var(--font-label);font-size:10px;color:var(--cream-gold);letter-spacing:2px;text-align:center;margin-bottom:8px">${tierLabel}</div>
    ${growthHtml}
  `;

  const subjectHtml = _mdlASubjectStage(fighter, stageBody, { small: true, speech: fighterLine });

  const html = `
    ${_mdlAHeader(`🎓 卒業レポート`, `RESULT ・ ${_mdlASeasonLabel(state)}`)}
    ${_inviteCoachReporterStrip(coach, coachLine)}
    ${subjectHtml}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="mdlAInviteGradClose">— 見 届 け る —</button>
    </div>
  `;
  if (!_mdlAOpen(html)) { if (onDone) onDone(); return; }
  const btn = document.getElementById('mdlAInviteGradClose');
  if (btn) btn.addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (onDone) onDone();
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

// bond-rivalry plan P-6: ペア書類用モーダル(関係修復斡旋)
// W-1 累計4回以上のペアを一覧表示し、選択させる
function showDecisionPairModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;

  const w1 = state.w1FireCount || {};
  const roster = state.roster || [];
  const _findF = (id) => roster.find(c => c.id === id);
  const eligiblePairs = Object.keys(w1)
    .filter(k => (w1[k] || 0) >= 4)
    .map(k => {
      const [aStr, bStr] = k.split('_');
      const a = parseInt(aStr, 10), b = parseInt(bStr, 10);
      const fA = _findF(a), fB = _findF(b);
      if (!fA || !fB || fA.isRental || fB.isRental || fA.injury || fB.injury) return null;
      const rels = state.relationships || {};
      const bondAB = (rels[`${a}>${b}`] || {}).bond;
      const bondBA = (rels[`${b}>${a}`] || {}).bond;
      const avgBond = ((bondAB != null ? bondAB : 50) + (bondBA != null ? bondBA : 50)) / 2;
      // タスクa(2026-07-17): ペアごとに当事者給与連動コストを算出しておく
      const cost = Engine.shachoshitsu.calcCost(doc, state, k);
      return { key: k, idA: a, idB: b, fA, fB, count: w1[k], avgBond, cost };
    })
    .filter(p => p)
    .sort((x, y) => y.count - x.count);

  if (eligiblePairs.length === 0) {
    showToast('対象となる険悪ペアがありません');
    return;
  }

  const successPct = Math.round(((doc.effect && doc.effect.successRate) || 0.7) * 100);

  let selectedPairKey = eligiblePairs[0].key;

  // P-6モーダル改善(2026-07-17 Keisuke指摘): 平均bond数値の露出をやめ、定性ラベルに置換
  const _pairRelLabel = (avgBond) => {
    if (avgBond <= 15) return { text: '冷え切っている', color: 'var(--accent-negative)', weight: 700 };
    if (avgBond <= 25) return { text: '険悪', color: 'var(--accent-negative)', weight: 400 };
    if (avgBond <= 35) return { text: 'ぎくしゃくしている', color: 'var(--accent-milestone)', weight: 400 };
    return { text: 'わだかまりが残る', color: 'var(--cream-text-sub)', weight: 400 };
  };
  const _pairFaceImg = (f, overlap) => {
    const u = getPortraitUrl(f.id);
    const base = 'width:30px;height:30px;border-radius:50%;object-fit:cover;border:1.5px solid var(--cream-gold);background:var(--cream-panel-bg);display:block';
    if (!u) return `<span style="${base};display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--cream-text-dim);background:var(--cream-panel-bg)${overlap ? ';margin-left:-10px' : ''}">👤</span>`;
    return `<img src="${u}" alt="${escHtml(f.name || '')}" style="${base}${overlap ? ';margin-left:-10px' : ''}" onerror="this.style.display='none'">`;
  };

  const _renderPairList = () => {
    return eligiblePairs.map(p => {
      const sel = p.key === selectedPairKey;
      const rel = _pairRelLabel(p.avgBond);
      return `<div class="mdl-a-pair-row" data-pairkey="${p.key}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:6px;cursor:pointer;background:${sel ? 'rgba(232,196,118,0.35)' : 'rgba(255,255,255,0.35)'};border:1px solid ${sel ? 'var(--cream-gold)' : 'rgba(100,85,50,0.15)'};margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="display:flex;align-items:center">${_pairFaceImg(p.fA, false)}${_pairFaceImg(p.fB, true)}</span>
          <span style="font-weight:700;color:var(--cream-text-main)">${p.fA.name}</span>
          <span style="color:var(--cream-text-dim);font-size:12px">×</span>
          <span style="font-weight:700;color:var(--cream-text-main)">${p.fB.name}</span>
        </div>
        <div style="display:flex;gap:14px;align-items:center;font-size:12px">
          <span style="color:${rel.color};font-weight:${rel.weight}">二人の関係: ${rel.text}</span>
          <span style="color:var(--cream-text-sub)">対立累計 ${p.count}回</span>
          <span style="color:var(--cream-gold-dark);font-weight:700">${p.cost}万</span>
        </div>
      </div>`;
    }).join('');
  };

  // タスクa(2026-07-17): 選択ペアごとにコスト・残金パネルを再描画する
  const _renderCostPanel = () => {
    const sel = eligiblePairs.find(p => p.key === selectedPairKey) || eligiblePairs[0];
    const actualCost = sel.cost;
    const remainingFunds = (state.funds || 0) - actualCost;
    const remainingColor = remainingFunds < 200 ? 'var(--accent-negative)' : 'var(--cream-gold-dark)';
    return `
      <div style="display:flex;justify-content:space-between;padding:3px 0">
        <span style="color:var(--cream-text-sub)">コスト</span>
        <span><strong style="color:var(--cream-gold-dark)">${actualCost}万</strong>　<span style="color:var(--cream-text-dim);font-size:11px">⚡${doc.decisionCost}</span></span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:3px 0">
        <span style="color:var(--cream-text-sub)">残金(決裁後)</span>
        <span style="color:${remainingColor};font-weight:700">${Math.round(remainingFunds).toLocaleString()}万</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:3px 0">
        <span style="color:var(--cream-text-sub)">成功率</span>
        <span style="color:var(--cream-text-main);font-weight:700">${successPct}%</span>
      </div>
      <div style="padding-top:6px;font-size:11px;color:var(--cream-text-dim)">当事者の格に応じて費用が変わる</div>
    `;
  };

  const summaryHtml = `
    <div style="font-size:13px;color:var(--cream-text-sub);line-height:1.7;margin-bottom:14px;text-align:center;max-width:520px;margin-left:auto;margin-right:auto">${doc.detailText || ''}</div>
    <div style="max-width:560px;margin:0 auto 14px">
      <div style="font-size:12px;color:var(--cream-text-sub);margin-bottom:8px">対象ペアを選択してください</div>
      <div id="mdlAPairList" style="max-height:240px;overflow-y:auto">${_renderPairList()}</div>
    </div>
    <div style="max-width:460px;margin:0 auto;background:rgba(255,255,255,0.35);border:1px solid rgba(100,85,50,0.15);border-radius:6px;padding:10px 16px;font-size:13px" id="mdlAPairCostPanel">${_renderCostPanel()}</div>
  `;

  const html = `
    ${_mdlAHeader(`${doc.icon} ${doc.label}`, `PAIR DECISION ・ ${_mdlASeasonLabel(state)}`)}
    ${_mdlAReporterStrip(state, '関係修復を試みるペアを選んでください')}
    <div class="mdl-a-subject-stage">${summaryHtml}</div>
    <div class="mdl-a-prompt" style="padding-top:14px">このペアに対して斡旋を行いますか？</div>
    <div style="padding:0 40px 22px;background:var(--office-panel-cream);text-align:center;display:flex;gap:12px;justify-content:center">
      <button class="mdl-a-continue-btn" id="mdlAPairCancel">— 取 消 —</button>
      <button class="mdl-a-continue-btn" id="mdlAPairExec" style="background:var(--cream-gold);color:#fff;border-color:var(--cream-gold)">— 決 裁 す る —</button>
    </div>
  `;

  if (!_mdlAOpen(html)) return;

  const _attachPairHandlers = () => {
    document.querySelectorAll('.mdl-a-pair-row').forEach(row => {
      row.addEventListener('click', () => {
        Audio.play('click');
        selectedPairKey = row.dataset.pairkey;
        const listEl = document.getElementById('mdlAPairList');
        if (listEl) listEl.innerHTML = _renderPairList();
        const costEl = document.getElementById('mdlAPairCostPanel');
        if (costEl) costEl.innerHTML = _renderCostPanel();
        _attachPairHandlers();
      });
    });
  };
  _attachPairHandlers();
  document.getElementById('mdlAPairCancel').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
  });
  document.getElementById('mdlAPairExec').addEventListener('click', () => {
    Audio.play('click');
    _mdlAClose();
    if (typeof App !== 'undefined' && App.executeDecision) {
      App.executeDecision(docId, selectedPairKey);
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
// 統一モーダル mdl-a(_mdlAOpen)経由で描画する(shachoshitsu-decision-overlay系DOMは廃止済み、U4で削除)。
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
// コーチ取次セリフ — イベント種別ごとに何が問われているのかを伝える
function _choiceEventReporterLine(event, fighter, isUrgent) {
  const nm = fighter ? (fighter.name || '選手') : '';
  switch (event.type) {
    case 'S1': return `${nm}選手から、タイトル挑戦を希望する申し出が来ています`;
    case 'S2': return `${nm}選手が、因縁の相手との対戦を希望しています`;
    case 'S3': return `${nm}選手から休養願いが出ています。コンディションの問題かもしれません`;
    case 'S4': return `${nm}選手から待遇への強い不満が…退団も口にしています。早急なご判断を`;
    case 'S5': return `${nm}選手が特訓を志願しています。ご判断を`;
    case 'S6': return `${nm}選手が、後輩の指導役を申し出ています`;
    case 'E1': return `${nm}選手にメディアから出演オファーが届いています。出すか、断るか、別の選手を推薦するか——ご判断を`;
    case 'E2': return `スポンサーから提案が届いています。受けるかどうかご判断ください`;
    case 'E3': return `他団体から合同練習の誘いが来ています`;
    case 'E4': return `スカウトからの情報が入りました。動くかどうかご判断を`;
    case 'E5': return `近隣の地域イベント実行委員会から、営業試合の依頼が届いています`;
    case 'E6': return `${nm}選手に他団体から引き抜きオファーが入りました。早急なご判断を`;
    case 'S_boycott': return `${nm}選手が練習をボイコットしています。対応をお願いします`;
    case 'S_grumble': return `${nm}選手の不満がロッカーで広がっています`;
    case 'S_sns': return `${nm}選手のSNS投稿が話題に…早めの対応をご検討ください`;
    default: return isUrgent ? '社長、判断をお願いします' : '社長、ひとつ判断をお願いしたい件があります';
  }
}

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

  // Reporter取次セリフ — イベント種別ごとに具体化
  const reporterLine = _choiceEventReporterLine(event, fighter, isUrgent);

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

/** 選択型イベント結果ポップアップ(mdlAOverlayに上書き、選択肢モーダルと連続表示)
 *  opts.reaction = { fighterId, line } — 選手のリアクション吹き出し（任意） */
function showChoiceEventResult(event, resultTexts, state, opts) {
  const roster = state ? (state.roster || []) : [];
  const reaction = opts && opts.reaction ? opts.reaction : null;
  // リアクション選手がいればそちらを stage に置く（E1 別選手推薦の場合は推薦された側）
  const reactionFighter = reaction && reaction.fighterId != null
    ? roster.find(f => f.id === reaction.fighterId) : null;
  const fighter = reactionFighter
    || (event.fighter != null ? roster.find(f => f.id === event.fighter) : null);
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

  // リアクション吹き出し（あれば結果ブロックの上に表示）
  const reactionBlock = (reaction && reaction.line && reactionFighter)
    ? `<div class="mdl-a-observation centered" style="padding-top:6px">
        <span class="marker">${reactionFighter.name || ''}</span><br>
        <span style="font-style:italic;color:var(--cream-text-main);line-height:1.8;display:inline-block;margin-top:8px">「${reaction.line}」</span>
      </div>`
    : '';

  const stageInner = reactionBlock + resultsBlock;
  const stageBody = fighter
    ? stageInner
    : `<div data-mdl-choice-result="1">${stageInner}</div>`;
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
// F01 アーキタイプ別の前置き文 + A 選択肢補足（spec faction-archetype-rework-spec-v0.1.md §5.1）
const _F01_ARCHETYPE_META = {
  authoritarian: {
    flavorText: 'リーダーへの一方向の追従が強く、トップダウンの色が濃いようです。',
    aLabel: '正式なチームとして認める',
    aHint: '権威型として承認（authoritativeTag）。求心力と引き換えにロッカー士気が下がる。',
    archLabel: '権威型',
  },
  bond_first: {
    flavorText: '上下というより、横の絆で繋がった集まりのようです。',
    aLabel: 'チームとして後押しする',
    aHint: '結束型として承認（bondTag）。メンバー間 bond +5〜+8、ロッカー士気 +1〜+2。',
    archLabel: '結束型',
  },
  meritocratic: {
    flavorText: 'OVR を強く意識した、自負心の高い者同士の集まりに見えます。',
    aLabel: '実力主義のチームとして認める',
    aHint: '実力主義として承認（meritTag）。bond +2〜+3（敬意ベース）、士気 -1〜-2。',
    archLabel: '実力主義',
  },
  heel: {
    flavorText: '反主流派の色が濃く、観客を挑発する姿勢が共通しているようです。',
    aLabel: 'ヒール派閥として承認する',
    aHint: 'ヒール派閥として承認（heelTag）。bond +3〜+4、次回興行集客一時+。',
    archLabel: 'ヒール派閥',
  },
  face: {
    flavorText: '王道・ベビーフェイスの旗印で、団体の顔を担う気概が見えます。',
    aLabel: '正統派として承認する',
    aHint: '正統派として承認（faceTag）。bond +3〜+4、次回興行集客一時+ + メディア露出収益。',
    archLabel: '正統派',
  },
  combat: {
    flavorText: '攻めの姿勢を共有する集まりで、メインを取りに行く色が濃いようです。',
    aLabel: '武闘派として承認する',
    aHint: '武闘派として承認（combatTag）。リーダー momentum +5、派閥外 rivalry が生まれやすくなる。',
    archLabel: '武闘派',
  },
};

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

  // v0.2: アーキタイプ別前置き + A 選択肢ヒント
  const archMeta = _F01_ARCHETYPE_META[payload.archetype] || _F01_ARCHETYPE_META.bond_first;

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
            ${archMeta.flavorText}<br>
            <span style="color:var(--cream-text-sub);font-size:13px">これは <strong>${archMeta.archLabel}</strong> の集まりになりそうです。</span>
          </div>
        </div>
        <div class="fevt-decision-prompt">この動きについて、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">${archMeta.aLabel}</div>
            <div class="fevt-decision-hint">${archMeta.aHint}</div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">今はそれどころじゃないと釘を刺す</div>
            <div class="fevt-decision-hint">派閥不成立。本人と周囲に角が立つ</div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">静観する</div>
            <div class="fevt-decision-hint">派閥成立（自然発生）。アーキタイプ専用タグなし</div>
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
  const aLine = Engine.factions.getF02ClashLine(leaderA, 'attack') || '……';
  const bLine = Engine.factions.getF02ClashLine(leaderB, 'defend') || '……';

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1 §2-4)。
  // 吹き出しは画像の上へ(旧実装は下段の別セクションにあり rule1 違反だった)。左右は派閥アイデンティティ
  // 色(紫/橙、accent-faction-3/1)で区別する。「側で色分け」ではなく「どちらの派閥か」の識別色
  // (01-foundations.md #9 参照)。.fevt-leader-col は F02の他サブ画面(ignite/peace/resolution/endless、
  // 対象外)と別クラス体系でこのクラッシュ画面専用のラッパーと確認済みなので、入場アニメ/スポットライトは温存する。
  const html = `
    <div class="fevt-overlay-stage" id="fevtF02Overlay">
      <div class="fevt-title-band">
        <div class="fevt-title-main clash">⚔ 抗 争 の 勃 発</div>
        <div class="fevt-title-divider"></div>
        <div class="fevt-title-sub">FACTION CLASH ・ WEEK ${(state && state.week) || '—'}</div>
      </div>

      <div class="fevt-dual-stage">
        <div class="fevt-leader-col">
          ${_u3bSideHtml({
            name: aName, line: aLine, imgUrl: aUrl, role: `${factionAName} ・ FACTION LEADER`,
            bubbleClass: 'fevt-dialogue-bubble a', portraitClass: 'fevt-leader-upper',
            extraSideClass: 'u3b-theme-stage is-clash-a',
          })}
        </div>
        <div class="fevt-vs-col">
          <div class="fevt-silent-mark">
            — 沈 黙 —
            <span>NO WORDS EXCHANGED</span>
          </div>
        </div>
        <div class="fevt-leader-col right">
          ${_u3bSideHtml({
            name: bName, line: bLine, imgUrl: bUrl, role: `${factionBName} ・ FACTION LEADER`,
            bubbleClass: 'fevt-dialogue-bubble b', portraitClass: 'fevt-leader-upper',
            extraSideClass: 'u3b-theme-stage is-clash-b',
          })}
        </div>
      </div>

      <div class="fevt-clash-atmosphere">
        ロッカールームには、冷たい対立の空気が満ちているようです。
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
  const overlay = root.querySelector('.fevt-overlay-stage, .fevt-overlay-office, .fevt-overlay-arena, .fevt-narration-act');
  if (overlay) overlay.classList.remove('active');
  setTimeout(() => {
    if (!overlay || root.contains(overlay)) root.innerHTML = '';
    _drainPopupQueue();
  }, 600);
}

function showFactionF03Modal(payload, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF03Modal(payload, state, onContinue)); return; }

  payload = payload || {};
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
    <div class="fevt-overlay-stage sepia f03-dissolution" id="fevtF03Overlay">
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

// F01-F09 共通: 結果モーダル（クリーム Office 化, v0.5 / 2026-05-03）
// 旧シグネチャ: showFactionEventResult(resultText:string, onClose)
// 新シグネチャ: showFactionEventResult({eventId, category, resultText, charId, charName,
//   charLine, factionName, factionTone, impactSummary, weekLabel, state}, onClose)
//   - charId があれば主役選手のヒーロー画像+メタを表示
//   - charId が無く factionName があれば派閥章プレースホルダを表示
//   - charLine があれば白吹き出しカード（顔つき）を追加表示
//   - impactSummary は受け取るが画面表示しない（数値はナレーション側で吸収する方針）
function showFactionEventResult(arg, onClose) {
  // 後方互換: 文字列単独 → ナレーションのみのシンプル表示
  if (typeof arg === 'string' || arg == null) {
    arg = { resultText: arg || '……。' };
  }
  const opts = arg || {};
  const state = opts.state || (typeof G !== 'undefined' ? G : {});
  const roster = state.roster || [];
  const eventId = String(opts.eventId || '');
  const heroFighter = opts.charId != null ? roster.find(c => c.id === opts.charId) : null;
  const speakerFighter = (opts.charLine && opts.charId != null)
    ? (heroFighter || roster.find(c => c.id === opts.charId)) : null;
  const factionPair = Array.isArray(opts.factionPair)
    ? opts.factionPair.filter(entry => entry && (entry.factionName || entry.leaderId != null)).slice(0, 2)
    : [];

  const titleHtml = `🎭 ${opts.category || '結果'}`;
  const metaParts = [];
  if (eventId) metaParts.push(eventId);
  metaParts.push(_mdlASeasonLabel(state));
  const metaHtml = metaParts.join(' ・ ');

  // ナレーション本文（改行を <br> に変換）
  const narrationHtml = opts.resultText
    ? `<div class="mdl-a-observation centered" style="text-align:left;padding-top:6px">${String(opts.resultText).replace(/\n/g, '<br>')}</div>`
    : '';

  // キャラ吹き出しカード（顔つき）
  let charlineHtml = '';
  if (opts.charLine) {
    const portraitUrl = speakerFighter ? _factionUpperUrl(speakerFighter.id) : '';
    const portraitBg = portraitUrl
      ? `background-image:url('${portraitUrl}');background-size:cover;background-position:top center`
      : 'background:linear-gradient(135deg,#c8a075,#7a5530)';
    const speakerName = opts.charName || (speakerFighter ? speakerFighter.name : '');
    charlineHtml = `
      <div class="fevt-result-charline">
        <div class="fevt-result-charline-portrait" style="${portraitBg}"></div>
        <div class="fevt-result-charline-text">
          ${speakerName ? `<div class="fevt-result-charline-name">${speakerName}</div>` : ''}
          <div class="fevt-result-charline-line">${opts.charLine}</div>
        </div>
      </div>`;
  }

  const stageBody = `${narrationHtml}${charlineHtml}`;

  // ヒーロー描画: charId があれば選手, なければ派閥章プレースホルダ
  let subjectHtml = '';
  if (heroFighter) {
    subjectHtml = _mdlASubjectStage(heroFighter, stageBody, { small: true });
  } else if (factionPair.length === 2) {
    const factionSideHtml = (entry) => {
      const leader = entry.leaderId != null ? roster.find(c => c.id === entry.leaderId) : null;
      const portraitUrl = leader ? _factionUpperUrl(leader.id) : '';
      const leaderName = entry.leaderName || (leader ? leader.name : '') || '代表選手';
      const portraitStyle = portraitUrl ? ` style="background-image:url('${portraitUrl}')"` : '';
      const portraitFallback = portraitUrl ? '' : '<span>LEADER</span>';
      return `<div class="mdl-a-faction-clash-side">
        <div class="mdl-a-faction-clash-side-label">${entry.sideLabel || 'FACTION'}</div>
        <div class="mdl-a-faction-clash-portrait"${portraitStyle}>${portraitFallback}</div>
        <div class="mdl-a-faction-clash-faction">${entry.factionName || '派閥'}</div>
        <div class="mdl-a-faction-clash-leader">${leaderName}</div>
      </div>`;
    };
    subjectHtml = `<div class="mdl-a-subject-stage mdl-a-faction-clash-stage">
      <div class="mdl-a-faction-clash-kicker">MAIN EVENT ・ OFFICIAL</div>
      <div class="mdl-a-faction-clash">
        ${factionSideHtml(factionPair[0])}
        <div class="mdl-a-faction-clash-vs">VS</div>
        ${factionSideHtml(factionPair[1])}
      </div>
      <div class="mdl-a-faction-clash-caption">両派閥の抗争は、団体公認のメインイベントへ</div>
      ${stageBody}
    </div>`;
  } else if (opts.factionName) {
    const tone = opts.factionTone || 'neutral';
    const toneBg = tone === 'hostile'
      ? 'linear-gradient(135deg,#c8504a,#5a1818)'
      : tone === 'allied'
      ? 'linear-gradient(135deg,#7a85a8,#2a3550)'
      : 'linear-gradient(135deg,#8a7550,#3a2d18)';
    subjectHtml = `<div class="mdl-a-subject-stage">
      <div class="mdl-a-subject-portrait-wrap" style="width:120px;height:160px;background:${toneBg};display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.85);font-family:var(--font-label);font-size:11px;letter-spacing:2px;text-align:center;padding:8px;box-sizing:border-box">FACTION</div>
      <div class="mdl-a-subject-name">${opts.factionName}</div>
      <div class="mdl-a-subject-org">FACTION</div>
      <div class="mdl-a-subject-divider"></div>
      ${stageBody}
    </div>`;
  } else {
    subjectHtml = `<div class="mdl-a-subject-stage">${stageBody}</div>`;
  }

  const html = `
    ${_mdlAHeader(titleHtml, metaHtml)}
    ${_mdlAReporterStrip(state, opts.reporterText || '派閥について、ひとつご報告があります')}
    ${subjectHtml}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="fevtResultClose">— 見 届 け る —</button>
    </div>
  `;

  if (!_mdlAOpen(html, { narrow: true })) {
    if (onClose) onClose();
    return;
  }
  const btn = document.getElementById('fevtResultClose');
  if (btn) {
    btn.addEventListener('click', () => {
      Audio.play('click');
      _mdlAClose();
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

  // U3グループD統一(2026-07-26): .fevt-quote(本人セリフ)は頭上の白い吹き出しへ移行(mockup-baseline-v0.1 §3)。
  // F08 と同じ手法(_u3bSideHtml + u3b-theme-cream)。ringleaderMeta は role ラベルへ吸収。
  const html = `
    <div class="fevt-overlay-office" id="fevtF05Overlay">
      <div class="fevt-report-card f05">
        <div class="fevt-report-header">
          <div class="fevt-report-title">⚙ 派閥内に火種</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)} ・ FOR YOUR INFORMATION</div>
        </div>
        ${_factionReporterStrip(state, '社長。お耳に入れておきます。あの組、中で軋みが出てるみたいです')}
        <div class="fevt-subject-stage u3b-theme-cream">
          ${_u3bSideHtml({
            name: ringleaderName, line: line || '……もう、ついていけない。',
            imgUrl: ringleaderUrl, role: ringleaderMeta,
            bubbleClass: 'fevt-bubble',
          })}
          <div class="fevt-subject-divider" style="margin-top:18px"></div>
          <div class="fevt-observation-note">
            練習後のロッカーでの会話が減った。<span class="marker">${String(ringleaderSurname)}</span>はリーダー
            <span class="marker">${String(leaderSurname)}</span>の方針に
            <span class="marker hostile">不満を抱えている</span>ようだ。<br>
            まだ表には出ていないが、このまま放っておけば派閥が割れるかもしれない。
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
  const speakerIsB = (seedPick % 2 === 0);
  const speaker = speakerIsB ? leaderB : leaderA;
  const line = _factionLine(FACTION_F06_AMBIENT_LINES, speaker,
    Engine.rng.derive((state && state.rngSeed) || 1, (state && state.season) || 0, (state && state.week) || 0, 0xFA61));
  const resolvedLine = line || '……もう、いいかな。あの人とぶつかり続ける理由も、正直、思い出せないし。';

  // U3グループD統一(2026-07-26): .fevt-quote(本人セリフ)は発言者側の頭上吹き出しへ移行。
  // 発言しない側は line を渡さず(mockup-baseline-v0.1 §2-B「発言しない人は枠だけ」)予約枠のみ出す。
  const html = `
    <div class="fevt-overlay-office" id="fevtF06Overlay">
      <div class="fevt-report-card f06">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🌱 和解の兆し</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, 'あの2組、もう揉めてませんよ。先週の合同練習でも、普通に挨拶してました')}
        <div class="fevt-subject-stage u3b-theme-cream">
          <div class="fevt-subject-pair">
            <div class="col">
              ${_u3bSideHtml({
                name: leaderAName, line: speakerIsB ? '' : resolvedLine,
                imgUrl: leaderAUrl, role: factionAName,
                bubbleClass: 'fevt-bubble',
              })}
            </div>
            <div class="fevt-pair-bridge">↔</div>
            <div class="col right">
              ${_u3bSideHtml({
                name: leaderBName, line: speakerIsB ? resolvedLine : '',
                imgUrl: leaderBUrl, role: factionBName,
                bubbleClass: 'fevt-bubble',
              })}
            </div>
          </div>
          <div class="fevt-subject-org" style="margin-top:6px">FORMER RIVALS ・ HOSTILITY ${hostAvg} / 100</div>
          <div class="fevt-subject-divider" style="margin-top:12px"></div>
          <div class="fevt-observation-note">
            対立が始まって以来、両派閥のリーダー<span class="marker">${String(leaderASurname)}</span>と<span class="marker">${String(leaderBSurname)}</span>の間にあった棘は、
            ここ数週間で<span class="marker peace">明らかに和らいで</span>いる。<br>
            メンバー間でも私的な交流が戻り始めた。社長の一押しがあれば、抗争は完全に終結する。
          </div>
        </div>
        <div class="fevt-decision-prompt">この空気を、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray two">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">そっと結束を後押しする</div>
            <div class="fevt-decision-hint">敵対度を一気に解消。両リーダーも社長の仲裁を好意的に受け止める、静かな終結</div>
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

// F07 v0.4: 派閥動向（Office 応接室型 / modalShape choice2 or choice3）
// trio 配置は維持し、incidentType により本文・選択肢を分岐。
// 互換: incidentType 未指定の場合は旧 DEMAND_ABSTRACT 3 択挙動を表示。
const _F07_INCIDENT_META = {
  DEMAND_MAIN: { titleEmoji: '👑', titleText: 'メインカード相談', shape: 'choice3', source: 'leader',
    choices: [
      { id: 'A', label: '相談に乗る',          hint: '次回興行のメイン提案で、{factionName}メンバーを優先候補にする。<br>派閥内では期待に応えたと受け止められそうだ。' },
      { id: 'B', label: '受け流す',            hint: 'リーダーは不満を募らせるが、派閥外には公平な対応と映りそうだ。' },
      { id: 'C', label: '別ルートで応える',    hint: '要求自体には応じず、メンバーへの個別ケアで返す。<br>注意累積 +1。' },
    ],
  },
  DEMAND_MONEY: { titleEmoji: '💰', titleText: '待遇相談', shape: 'choice3', source: 'leader',
    choices: [
      { id: 'A', label: '次オフで反映する',    hint: '次オフ契約交渉で +10% 反映予定（Phase D 実装）。<br>派閥メンバーは前向きな回答と受け止める。' },
      { id: 'B', label: '受け流す',            hint: '待遇相談は黙認する。リーダーは不満を残しそうだ。' },
      { id: 'C', label: '個別ケアで応える',    hint: 'メンバー一人一人に目を配る。<br>注意累積 +1。' },
    ],
  },
  DEMAND_ABSTRACT: { titleEmoji: '👑', titleText: 'リーダーの要求', shape: 'choice3', source: 'leader',
    choices: [
      { id: 'A', label: '権威を認める',        hint: 'リーダーは満足するが、非メンバーとロッカー全体には反発が広がる。<br>権威型なら「独裁化」する。' },
      { id: 'B', label: '釘を刺す',            hint: 'リーダーは強く反発する一方、非メンバーには歓迎される。<br>4 回累積で権威型資格剥がし。' },
      { id: 'C', label: '別の幹部を立てる',    hint: '現リーダーは反発し、別幹部は社長の意図を汲む。<br>権威型資格は剥がれるが、派閥内に新たな対立軸。' },
    ],
  },
  DEMAND_RECOGNITION: { titleEmoji: '🎤', titleText: '評価要求', shape: 'choice3', source: 'leader',
    choices: [
      { id: 'A', label: '貢献を認める',        hint: '派閥メンバーは報われたと感じ、ロッカーの空気も少し明るくなる。' },
      { id: 'B', label: '受け流す',            hint: 'リーダーは評価されなかったと感じそうだ。' },
      { id: 'C', label: '個別の声かけで応える', hint: 'メンバーごとに労をねぎらう。注意累積 +1。' },
    ],
  },
  OBSERVE_RIVAL_HEAT: { titleEmoji: '⚠️', titleText: '派閥外への当たり', shape: 'choice3', source: 'coach',
    choices: [
      { id: 'A', label: '介入する',            hint: 'リーダーは口出しに反発するが、標的になった選手は守られたと感じる。' },
      { id: 'B', label: '黙認する',            hint: 'リーダーは勢いづく一方、標的とロッカー全体に不満が残る。' },
      { id: 'C', label: '別ルートで諭す',      hint: 'リーダーの顔を立てつつ、標的を個別に支える。注意累積 +1。' },
    ],
  },
  OBSERVE_ABSENCE: { titleEmoji: '🌙', titleText: '練習サボり連鎖', shape: 'choice3', source: 'coach',
    choices: [
      { id: 'A', label: '介入する',            hint: '派閥は反発するが、ロッカー全体には規律を示せる。' },
      { id: 'B', label: '黙認する',            hint: 'リーダーは満足するが、ロッカー全体の空気が悪くなる。' },
      { id: 'C', label: '別ルートで諭す',      hint: 'コーチ経由で個別ケア／注意累積 +1。' },
    ],
  },
  OBSERVE_INTERNAL_RANK: { titleEmoji: '📊', titleText: '内部格付け争い', shape: 'choice3', source: 'coach',
    choices: [
      { id: 'A', label: '介入する',            hint: 'リーダーは不服そうだが、中位メンバーは救われる。' },
      { id: 'B', label: '黙認する',            hint: 'リーダーの顔は立つが、ロッカーにわだかまりが残る。' },
      { id: 'C', label: '別ルートで諭す',      hint: '派閥内 bond 微増／注意累積 +1。' },
    ],
  },
  OBSERVE_FAN_PRESSURE: { titleEmoji: '🎭', titleText: 'ファン期待の重圧', shape: 'choice3', source: 'coach',
    choices: [
      { id: 'A', label: '介入する',            hint: 'リーダーは不服そうだが、コンディションは回復する。' },
      { id: 'B', label: '黙認する',            hint: 'リーダーの意向を尊重する代わりに、コンディションが落ちる。' },
      { id: 'C', label: '別ルートで諭す',      hint: 'コンディション <strong>+3</strong>／注意累積 +1。' },
    ],
  },
  OBSERVE_TRAINING_HARD: { titleEmoji: '💪', titleText: '過度な追い込み', shape: 'choice3', source: 'coach',
    choices: [
      { id: 'A', label: '介入する',            hint: 'リーダーは反発するが、メンバーの消耗を抑えられる。勢いは落ちる。' },
      { id: 'B', label: '黙認する',            hint: 'リーダーは勢いづくが、怪我の危険が高まる。' },
      { id: 'C', label: '別ルートで諭す',      hint: 'コーチ経由で調整／注意累積 +1。' },
    ],
  },
  INCIDENT_BOUNDARY: { titleEmoji: '🧱', titleText: '派閥の壁', shape: 'choice2', source: 'coach',
    choices: [
      { id: 'A', label: '注意する',            hint: 'リーダーは反発するが、対象選手は守られたと感じる。注意累積 +1。' },
      { id: 'B', label: '流す',                hint: '派閥は勢いづく一方、対象選手に不満が残る。' },
    ],
  },
  INCIDENT_BONDING: { titleEmoji: '🤝', titleText: '派閥内結束', shape: 'choice2', source: 'coach',
    choices: [
      { id: 'A', label: 'たしなめる',          hint: '派閥は少し不満を持つが、派閥外には公平な態度と映る。' },
      { id: 'B', label: '見守る',              hint: '派閥の結束は強まるが、派閥外には距離を置かれる。' },
    ],
  },
  INCIDENT_HEEL_PROVOKE: { titleEmoji: '🔥', titleText: '観客挑発エピソード', shape: 'choice2', source: 'coach',
    choices: [
      { id: 'A', label: '注意する',            hint: 'リーダーは反発。次回興行の集客が一時微減し、注意累積 +1。' },
      { id: 'B', label: '流す',                hint: '次回興行集客一時+。' },
    ],
  },
};

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
  const followers = memberIds
    .filter(id => id !== payload.leaderId)
    .map(id => roster.find(c => c.id === id))
    .filter(Boolean)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const fol1 = followers[0] || null;
  const fol2 = followers[1] || null;

  const incidentType = payload.incidentType || 'DEMAND_ABSTRACT';
  const meta = _F07_INCIDENT_META[incidentType] || _F07_INCIDENT_META.DEMAND_ABSTRACT;
  const factionName = String(payload.factionName || '');

  // 対象選手情報（観察・インシデント型）
  const targetId = payload.incidentPayload && payload.incidentPayload.targetId;
  const target = targetId ? roster.find(c => c.id === targetId) : null;
  const targetName = target ? target.name : (payload.incidentPayload && payload.incidentPayload.targetName) || '';

  const vars = { factionName, leaderName, leaderSurname, targetName };

  // セリフ取得
  let leaderQuote = '';
  let coachLine = '';
  if (meta.source === 'leader') {
    leaderQuote = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.getF07Line)
      ? Engine.factions.getF07Line('leaderDemand', { incidentType, fighter: leader, vars })
      : '';
    if (!leaderQuote) leaderQuote = '社長、お願いがあります。';
  } else {
    coachLine = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.getF07Line)
      ? Engine.factions.getF07Line('coachReport', { incidentType, vars })
      : '';
    if (!coachLine) coachLine = `${leaderSurname}と${factionName}の動きについて報告があります。`;
  }

  const leaderMeta = leader
    ? `AGE ${leader.age || '—'} ・ OVR ${Engine.util.ov(leader)} ・ FACTION LEADER ・ ${factionName}（${memberCount}名）`
    : `FACTION LEADER ・ ${factionName}`;

  const leftFol = fol1
    ? `<div class="fevt-follower-portrait" style="background-image:url('${_factionUpperUrl(fol1.id)}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-follower-portrait"></div>`;
  const rightFol = fol2
    ? `<div class="fevt-follower-portrait right" style="background-image:url('${_factionUpperUrl(fol2.id)}');background-size:cover;background-position:center 20%"></div>`
    : `<div class="fevt-follower-portrait right"></div>`;
  const leaderBubbleHtml = meta.source === 'leader'
    ? `<div class="fevt-leader-bubble-wrap"><div class="fevt-leader-bubble-speaker">${String(leaderName)}</div><div class="fevt-leader-bubble">${String(leaderQuote)}</div></div>`
    : '';
  const centerLeader = leaderUrl
    ? `<div class="fevt-subject-portrait-wrap" style="background-image:url('${leaderUrl}')">${leaderBubbleHtml}</div>`
    : `<div class="fevt-subject-portrait-wrap">${leaderBubbleHtml}</div>`;

  // observation-note(社長視点ナレーション。キャラのセリフは肖像頭上の吹き出しへ)
  const reporterText = meta.source === 'leader'
    ? `${leaderSurname || 'リーダー'}さんが社長室に向かいました。`
    : (coachLine || `${factionName}の動向について報告があります。`);

  const observationNote = meta.source === 'leader'
    ? `<div class="fevt-observation-note"><span class="marker">${String(leaderSurname)}</span>と${factionName}の動きについて、社長室での相談です。</div>`
    : `<div class="fevt-observation-note"><span class="marker">${String(leaderSurname)}</span>と${factionName}の様子について、社長の判断を仰ぎたいとのことです。</div>`;

  const decisionCardsHtml = meta.choices.map(c => `
    <div class="fevt-decision-card" data-choice="${c.id}">
      <div class="fevt-decision-letter">${c.id}</div>
      <div class="fevt-decision-label">${c.label}</div>
      <div class="fevt-decision-hint">${c.hint.split('{factionName}').join(factionName).split('{targetName}').join(targetName || '対象')}</div>
    </div>
  `).join('');

  const html = `
    <div class="fevt-overlay-office" id="fevtF07Overlay">
      <div class="fevt-report-card f07">
        <div class="fevt-report-header">
          <div class="fevt-report-title">${meta.titleEmoji} ${meta.titleText}</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, reporterText)}
        <div class="fevt-subject-stage">
          <div class="fevt-subject-trio">
            ${leftFol}
            ${centerLeader}
            ${rightFol}
          </div>
          <div class="fevt-subject-name">${String(leaderName)}</div>
          <div class="fevt-subject-org">${leaderMeta}</div>
          <div class="fevt-subject-divider"></div>
          ${observationNote}
        </div>
        <div class="fevt-decision-prompt">この件、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray">
          ${decisionCardsHtml}
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

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1 §2-4)。
  // .col/.col.right は安全網テスト(test/u3-group-b-safety-net-test.js)の厳密一致(class="col">)を
  // 保つため display:contents の透過ラッパーとして残す。「FACTION・◯◯」と「LEADER・OVR」の2行は
  // 役割ラベル1行(◯◯・LEADER)へ統合し、OVRは数値行として独立させた(baseline §4の並び順に合わせる)。
  const html = `
    <div class="fevt-overlay-office" id="fevtF08Overlay">
      <div class="fevt-report-card f08">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🔥 対立ヒートアップ</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)} ・ HOSTILITY ${hostilityPeak} / 100</div>
        </div>
        ${_factionReporterStrip(state, '……もう、止めても無駄だと思います。両方とも、リングで決着つける覚悟です')}
        <div class="fevt-subject-stage u3b-theme-cream">
          <div class="fevt-subject-duel">
            <div class="col">
              ${_u3bSideHtml({
                name: leaderAName, line: lineA || '……もう、話し合いでは済まない。あの人とは、リングの上でしか答えが出ない。',
                imgUrl: leaderAUrl, role: `${factionAName} ・ LEADER`, statLabel: 'OVR', statValue: leaderAOvr,
                bubbleClass: 'fevt-bubble left', portraitClass: 'fevt-duel-portrait',
              })}
            </div>
            <div class="fevt-duel-vs">VS</div>
            <div class="col right">
              ${_u3bSideHtml({
                name: leaderBName, line: lineB || 'いいでしょう。逃げも隠れもしない。来週、メインで、決着をつけましょう。',
                imgUrl: leaderBUrl, role: `${factionBName} ・ LEADER`, statLabel: 'OVR', statValue: leaderBOvr,
                bubbleClass: 'fevt-bubble right', portraitClass: 'fevt-duel-portrait',
              })}
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
            <div class="fevt-decision-hint">集客 +12%、両リーダー間の因縁が一気に深まる（rivalry 大幅増）。負けた派閥は崩壊リスク</div>
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
// Phase 3e: F08-A 試合前モーダル（ダーク Arena テーマ）
// 試合フォーカス直前、_f08Locked スロットに対して発火
// data: Engine.factions.getF08PreMatchData の戻り値
// ─────────────────────────────────────────────────────────────────────────────
function showFactionF08PreMatchModal(data, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF08PreMatchModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }

  const aPortraitUrl = _factionUpperUrl(data.factionA.leaderId);
  const bPortraitUrl = _factionUpperUrl(data.factionB.leaderId);

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1 §2-4)。
  // Stageカテゴリ(.u3b-theme-stage)を使う(このカードは既に純黒の全画面カードで実装済みのため。
  // 詳細は完了報告の判断点を参照)。「FACTION・◯◯」「LEADER・OVR」は役割ラベル1行へ統合。
  // .fevt-arena-col は F09(派閥対抗戦、対象外)と共有のため構造は変えず中身だけ差し替える。
  const html = `
    <div class="fevt-overlay-arena" id="fevtF08PreOverlay">
      <div class="fevt-arena-card f08-pre">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">🔥 直接対決</div>
          <div class="fevt-arena-meta">${_factionSeasonLabel(state)} ・ DIRECT CONFRONTATION</div>
        </div>
        <div class="fevt-arena-narration">${escHtml(data.narration)}</div>
        <div class="fevt-arena-stage u3b-theme-stage is-hostility">
          <div class="fevt-arena-duel">
            <div class="fevt-arena-col">
              ${_u3bSideHtml({
                name: data.factionA.leaderName, line: data.lineA, imgUrl: aPortraitUrl,
                role: `${data.factionA.name} ・ LEADER`, statLabel: 'OVR', statValue: data.factionA.leaderOvr,
                bubbleClass: 'fevt-arena-bubble', portraitClass: 'fevt-arena-portrait',
              })}
            </div>
            <div class="fevt-arena-vs">VS</div>
            <div class="fevt-arena-col">
              ${_u3bSideHtml({
                name: data.factionB.leaderName, line: data.lineB, imgUrl: bPortraitUrl,
                role: `${data.factionB.name} ・ LEADER`, statLabel: 'OVR', statValue: data.factionB.leaderOvr,
                bubbleClass: 'fevt-arena-bubble', portraitClass: 'fevt-arena-portrait',
              })}
            </div>
          </div>
        </div>
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtF08PreBtn">試合へ進む →</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  // BGM/SFX: tension ループ + 150ms 遅延の gong 1打
  try {
    if (typeof Audio !== 'undefined' && Audio.fileBgm && Audio.fileBgm.play) {
      Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_s03_v01.ogg', { loop: true, volume: 0.20 });
    }
    if (typeof Audio !== 'undefined' && Audio.stinger) {
      setTimeout(() => { try { Audio.stinger('../bgm/f07_gong_v1.mp3', 0.18); } catch(e) {} }, 150);
    }
  } catch(e) {}

  const btn = root.querySelector('#fevtF08PreBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.fadeOut(800); } catch(e) {}
      if (onContinue) onContinue();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3e: F08-A 試合後モーダル（ダーク Arena テーマ + 暗赤フレーム）
// data: Engine.factions.getF08AftermathData の戻り値
// ─────────────────────────────────────────────────────────────────────────────
function showFactionF08AftermathModal(data, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionF08AftermathModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }

  const wPortraitUrl = _factionUpperUrl(data.winner.id);
  const lPortraitUrl = _factionUpperUrl(data.loser.id);
  const roleTag = (faction, role) => (faction ? `${faction} ・ ${role}` : role);

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。1人ずつ順に見せる決着画面のため
  // baseline §2「勝敗の格差の付け方」に従い勝者だけ一段大きいLサイズ(isBig)を許容する。
  const html = `
    <div class="fevt-overlay-arena" id="fevtF08PostOverlay">
      <div class="fevt-arena-card f08-post">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 決着の夜</div>
          <div class="fevt-arena-meta">${_factionSeasonLabel(state)} ・ AFTERMATH</div>
        </div>
        <div class="fevt-arena-narration">${escHtml(data.narrationOpen)}</div>
        <div class="fevt-arena-stage u3b-theme-stage is-hostility">
          ${_u3bSideHtml({
            name: data.winner.name, line: data.winnerLine, imgUrl: wPortraitUrl, isBig: true,
            role: roleTag(data.winner.factionName, 'WINNER'),
            bubbleClass: 'fevt-arena-bubble winner-big', portraitClass: 'fevt-arena-portrait winner-big',
          })}
          <div class="fevt-arena-divider"></div>
          ${_u3bSideHtml({
            name: data.loser.name, line: data.loserLine, imgUrl: lPortraitUrl, isLoser: true,
            role: roleTag(data.loser.factionName, 'LOSER'),
            bubbleClass: 'fevt-arena-bubble loser', portraitClass: 'fevt-arena-portrait loser',
          })}
        </div>
        <div class="fevt-arena-narration close">${escHtml(data.narrationClose)}</div>
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtF08PostBtn">閉じる</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  const btn = root.querySelector('#fevtF08PostBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      // 結びチャイム
      try { if (typeof Audio !== 'undefined' && Audio.stinger) Audio.stinger('../bgm/f06_fin_chime_v1.mp3', 0.14); } catch(e) {}
      _factionCloseCinematicOverlay();
      if (onContinue) onContinue();
    });
  }
}

if (typeof window !== 'undefined') {
  window.showFactionF08PreMatchModal = showFactionF08PreMatchModal;
  window.showFactionF08AftermathModal = showFactionF08AftermathModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// 派閥内序列戦 試合前モーダル（紫〜深青グラデ、F08 流用ベース）
// data: Engine.factions.getInternalChallengePreData の戻り値
// ─────────────────────────────────────────────────────────────────────────────
function showInternalChallengePreModal(data, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showInternalChallengePreModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }

  const cPortraitUrl = _factionUpperUrl(data.challenger.id);
  const lPortraitUrl = _factionUpperUrl(data.leader.id);

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。Stageテーマの派閥内(紫)accent。
  const html = `
    <div class="fevt-overlay-arena" id="fevtICPreOverlay">
      <div class="fevt-arena-card internal-challenge-pre">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 派閥内序列戦</div>
          <div class="fevt-arena-meta">${_factionSeasonLabel(state)} ・ INTERNAL CHALLENGE</div>
        </div>
        <div class="fevt-arena-narration">${escHtml(data.narration)}</div>
        <div class="fevt-arena-stage u3b-theme-stage is-internal">
          <div class="fevt-arena-duel">
            <div class="fevt-arena-col">
              ${_u3bSideHtml({
                name: data.challenger.name, line: data.lineChallenger, imgUrl: cPortraitUrl,
                role: `${data.faction.name} ・ CHALLENGER`, statLabel: 'OVR', statValue: data.challenger.ovr,
                bubbleClass: 'fevt-arena-bubble', portraitClass: 'fevt-arena-portrait',
              })}
            </div>
            <div class="fevt-arena-vs">VS</div>
            <div class="fevt-arena-col">
              ${_u3bSideHtml({
                name: data.leader.name, line: data.lineLeader, imgUrl: lPortraitUrl,
                role: `${data.faction.name} ・ LEADER`, statLabel: 'OVR', statValue: data.leader.ovr,
                bubbleClass: 'fevt-arena-bubble', portraitClass: 'fevt-arena-portrait',
              })}
            </div>
          </div>
        </div>
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtICPreBtn">試合へ進む →</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  try {
    if (typeof Audio !== 'undefined' && Audio.fileBgm && Audio.fileBgm.play) {
      Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_s03_v01.ogg', { loop: true, volume: 0.18 });
    }
    if (typeof Audio !== 'undefined' && Audio.stinger) {
      setTimeout(() => { try { Audio.stinger('../bgm/f07_gong_v1.mp3', 0.18); } catch(e) {} }, 150);
    }
  } catch(e) {}

  const btn = root.querySelector('#fevtICPreBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.fadeOut(800); } catch(e) {}
      if (onContinue) onContinue();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 派閥内序列戦 試合後モーダル
// data: Engine.factions.getInternalChallengePostData の戻り値
// ─────────────────────────────────────────────────────────────────────────────
function showInternalChallengePostModal(data, state, onContinue) {
  if (_isPopupActive()) { _popupQueue.push(() => showInternalChallengePostModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }

  const wPortraitUrl = _factionUpperUrl(data.winner.id);
  const lPortraitUrl = _factionUpperUrl(data.loser.id);
  const transitionLabel = ({
    MERIT: '実力主義',
    BOND:  '結束型',
    HEEL:  'ヒール派閥',
    FACE:  '正統派',
    COMBAT: '武闘派',
    AUTHORITY: '権威型',
  });
  const transitionHtml = data.archetypeTransition
    ? `<div class="fevt-arena-narration close" style="margin-top:8px;color:var(--stage-text-main)">― ${escHtml(data.faction.name)}は《${escHtml(transitionLabel[data.archetypeTransition.from] || data.archetypeTransition.from)}》から《${escHtml(transitionLabel[data.archetypeTransition.to] || data.archetypeTransition.to)}》へ気風を変えた ―</div>`
    : '';

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。1人ずつ順に見せる決着画面のため
  // baseline §2に従い勝者だけLサイズ(isBig)。派閥は両者共通なので勝者側にのみ役割ラベルへ載せる
  // (元実装も敗者側は役割名のみで派閥名を重複表示していなかった)。
  const html = `
    <div class="fevt-overlay-arena" id="fevtICPostOverlay">
      <div class="fevt-arena-card internal-challenge-post">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 序列戦・決着</div>
          <div class="fevt-arena-meta">${_factionSeasonLabel(state)} ・ ${data.leaderWon ? 'HOLD' : 'SUCCESSION'}</div>
        </div>
        <div class="fevt-arena-narration">${escHtml(data.narrationOpen)}</div>
        <div class="fevt-arena-stage u3b-theme-stage is-internal">
          ${_u3bSideHtml({
            name: data.winner.name, line: data.winnerLine, imgUrl: wPortraitUrl, isBig: true,
            role: `${data.faction.name} ・ ${data.leaderWon ? 'LEADER (DEFENDED)' : 'NEW LEADER'}`,
            bubbleClass: 'fevt-arena-bubble winner-big', portraitClass: 'fevt-arena-portrait winner-big',
          })}
          <div class="fevt-arena-divider"></div>
          ${_u3bSideHtml({
            name: data.loser.name, line: data.loserLine, imgUrl: lPortraitUrl, isLoser: true,
            role: data.leaderWon ? 'CHALLENGER' : 'FORMER LEADER',
            bubbleClass: 'fevt-arena-bubble loser', portraitClass: 'fevt-arena-portrait loser',
          })}
        </div>
        <div class="fevt-arena-narration close">${escHtml(data.narrationClose)}</div>
        ${transitionHtml}
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtICPostBtn">閉じる</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) {
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('active'), 20);
  }

  const btn = root.querySelector('#fevtICPostBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      try { if (typeof Audio !== 'undefined' && Audio.stinger) Audio.stinger('../bgm/f06_fin_chime_v1.mp3', 0.14); } catch(e) {}
      _factionCloseCinematicOverlay();
      if (onContinue) onContinue();
    });
  }
}

if (typeof window !== 'undefined') {
  window.showInternalChallengePreModal = showInternalChallengePreModal;
  window.showInternalChallengePostModal = showInternalChallengePostModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase B-2: F09 派閥対抗戦 モーダル4種
// spec: faction-rivalry-points-spec-v0.1 §3.5
// data 構造（呼び出し側で構築）:
//   Opening: { factionA, factionB, lineA, lineB, narration }
//             factionX = { id, name, leaderId, leaderName, leaderOvr, members: [{id,name,ovr},...] }
//   MatchPre: { fighterA, fighterB, lineA, lineB, matchIndex, totalMatches }
//   MatchPost: { winner, loser, winnerLine, loserLine, ptDelta, currentScore } (currentScore: {a,b,aFid,bFid})
//   Ending: { winnerFaction, loserFaction, winnerLine, loserLine, scoreA, scoreB, swept, narration }
// ─────────────────────────────────────────────────────────────────────────────

function _f09BgmStart(volume) {
  try {
    if (typeof Audio !== 'undefined' && Audio.fileBgm && Audio.fileBgm.play) {
      Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_s03_v01.ogg', { loop: true, volume: volume || 0.20 });
    }
  } catch (e) {}
}
function _f09BgmStop(fadeMs) {
  try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.fadeOut(fadeMs || 800); } catch (e) {}
}

// オープニング：両派閥全メンバー並列 + 両リーダー宣戦
function showFactionF09OpeningModal(data, state, onContinue) {
  // F09 is presented inside the live show flow, where showResultOverlay remains active
  // as the match-preview shell. Treating that shell as a blocking popup creates a
  // circular wait at the final result (the ending waits for the shell to close,
  // while the shell waits for the ending callback before rendering the result).
  if (_isPopupActive({ ignoreShowResultOverlay: true })) { _popupQueue.push(() => showFactionF09OpeningModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }

  const aPp = _factionUpperUrl(data.factionA.leaderId);
  const bPp = _factionUpperUrl(data.factionB.leaderId);
  const memberRow = (members) => (members || []).map(m => {
    const url = _factionUpperUrl(m.id);
    return `<div style="width:42px;height:54px;background:#2a2520 url('${url}') center 20%/cover no-repeat;border:1px solid rgba(255,255,255,0.08)" title="${m.name}"></div>`;
  }).join('');

  const html = `
    <div class="fevt-overlay-arena" id="fevtF09OpeningOverlay">
      <div class="fevt-arena-card f08-pre">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 派閥対抗戦 ・ 開幕</div>
          <div class="fevt-arena-meta">${_factionSeasonLabel(state)} ・ FACTION WAR</div>
        </div>
        <div class="fevt-arena-narration">${String(data.narration || '')}</div>
        <div class="fevt-arena-stage">
          <div class="fevt-arena-duel">
            <div class="fevt-arena-col">
              <div class="fevt-arena-portrait" style="background-image:url('${aPp}');background-size:cover;background-position:center 20%"></div>
              <div class="fevt-arena-faction">${String(data.factionA.name)}</div>
              <div class="fevt-arena-name">${String(data.factionA.leaderName)}</div>
              <div class="fevt-arena-org">LEADER ・ OVR ${data.factionA.leaderOvr}</div>
              <div style="display:flex;gap:4px;justify-content:center;margin:8px 0;flex-wrap:wrap">${memberRow(data.factionA.members)}</div>
              <div class="fevt-arena-bubble">
                <span class="fevt-arena-bubble-name">${String(data.factionA.leaderName)}</span>
                ${String(data.lineA || '')}
              </div>
            </div>
            <div class="fevt-arena-vs">VS</div>
            <div class="fevt-arena-col">
              <div class="fevt-arena-portrait" style="background-image:url('${bPp}');background-size:cover;background-position:center 20%"></div>
              <div class="fevt-arena-faction">${String(data.factionB.name)}</div>
              <div class="fevt-arena-name">${String(data.factionB.leaderName)}</div>
              <div class="fevt-arena-org">LEADER ・ OVR ${data.factionB.leaderOvr}</div>
              <div style="display:flex;gap:4px;justify-content:center;margin:8px 0;flex-wrap:wrap">${memberRow(data.factionB.members)}</div>
              <div class="fevt-arena-bubble">
                <span class="fevt-arena-bubble-name">${String(data.factionB.leaderName)}</span>
                ${String(data.lineB || '')}
              </div>
            </div>
          </div>
        </div>
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtF09OpeningBtn">対抗戦を開始 →</button>
        </div>
      </div>
    </div>`;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
  _f09BgmStart(0.22);
  try { if (typeof Audio !== 'undefined' && Audio.stinger) setTimeout(() => Audio.stinger('../bgm/f07_gong_v1.mp3', 0.20), 150); } catch (e) {}

  const btn = root.querySelector('#fevtF09OpeningBtn');
  if (btn) btn.addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  });
}

// 各試合前 簡略 confrontation
function showFactionF09MatchPreModal(data, state, onContinue) {
  if (_isPopupActive({ ignoreShowResultOverlay: true })) { _popupQueue.push(() => showFactionF09MatchPreModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }
  const aPp = _factionUpperUrl(data.fighterA.id);
  const bPp = _factionUpperUrl(data.fighterB.id);
  const idx = data.matchIndex || 1, total = data.totalMatches || 5;
  const html = `
    <div class="fevt-overlay-arena" id="fevtF09PreOverlay">
      <div class="fevt-arena-card f08-pre">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 第${idx}試合 / ${total}</div>
          <div class="fevt-arena-meta">FACTION WAR ・ MATCH ${idx}</div>
        </div>
        <div class="fevt-arena-stage">
          <div class="fevt-arena-duel">
            <div class="fevt-arena-col">
              <div class="fevt-arena-portrait" style="background-image:url('${aPp}');background-size:cover;background-position:center 20%"></div>
              <div class="fevt-arena-faction">${String(data.fighterA.factionName || '')}</div>
              <div class="fevt-arena-name">${String(data.fighterA.name)}</div>
              <div class="fevt-arena-bubble"><span class="fevt-arena-bubble-name">${String(data.fighterA.name)}</span>${String(data.lineA || '')}</div>
            </div>
            <div class="fevt-arena-vs">VS</div>
            <div class="fevt-arena-col">
              <div class="fevt-arena-portrait" style="background-image:url('${bPp}');background-size:cover;background-position:center 20%"></div>
              <div class="fevt-arena-faction">${String(data.fighterB.factionName || '')}</div>
              <div class="fevt-arena-name">${String(data.fighterB.name)}</div>
              <div class="fevt-arena-bubble"><span class="fevt-arena-bubble-name">${String(data.fighterB.name)}</span>${String(data.lineB || '')}</div>
            </div>
          </div>
        </div>
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtF09PreBtn">試合へ →</button>
        </div>
      </div>
    </div>`;
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
  const btn = root.querySelector('#fevtF09PreBtn');
  if (btn) btn.addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  });
}

// 各試合後 簡略 aftermath（ptDelta + 現在スコア表示）
function showFactionF09MatchPostModal(data, state, onContinue) {
  if (_isPopupActive({ ignoreShowResultOverlay: true })) { _popupQueue.push(() => showFactionF09MatchPostModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }
  const wPp = _factionUpperUrl(data.winner.id);
  const lPp = _factionUpperUrl(data.loser.id);
  const score = data.currentScore || {};
  const html = `
    <div class="fevt-overlay-arena" id="fevtF09PostOverlay">
      <div class="fevt-arena-card f08-post">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 決着</div>
          <div class="fevt-arena-meta">${data.ptDelta ? `+${data.ptDelta}PT` : ''}</div>
        </div>
        <div class="fevt-arena-stage">
          <div class="fevt-arena-portrait winner-big" style="background-image:url('${wPp}');background-size:cover;background-position:center 20%;margin:0 auto 10px"></div>
          <div class="fevt-arena-faction">${String(data.winner.factionName || '')}</div>
          <div class="fevt-arena-name">${String(data.winner.name)}</div>
          <div class="fevt-arena-org">WINNER</div>
          <div class="fevt-arena-bubble winner-big" style="margin-left:auto;margin-right:auto">
            <span class="fevt-arena-bubble-name">${String(data.winner.name)}</span>${String(data.winnerLine || '')}
          </div>
          <div class="fevt-arena-divider"></div>
          <div class="fevt-arena-name" style="opacity:0.75">${String(data.loser.factionName || '')} ・ ${String(data.loser.name)}</div>
          <div class="fevt-arena-bubble loser" style="margin-left:auto;margin-right:auto">
            <span class="fevt-arena-bubble-name">${String(data.loser.name)}</span>${String(data.loserLine || '')}
          </div>
        </div>
        <div style="text-align:center;font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--gold-light, #f0d078);letter-spacing:2px;margin:12px 0">
          ${score.aName || ''} <span style="color:#fff">${score.a || 0}</span> — <span style="color:#fff">${score.b || 0}</span> ${score.bName || ''}
        </div>
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtF09PostBtn">次の試合へ →</button>
        </div>
      </div>
    </div>`;
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
  const btn = root.querySelector('#fevtF09PostBtn');
  if (btn) btn.addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  });
}

// エンディング：勝ち越し派閥スポット + 両リーダー総括
function showFactionF09EndingModal(data, state, onContinue) {
  if (_isPopupActive({ ignoreShowResultOverlay: true })) { _popupQueue.push(() => showFactionF09EndingModal(data, state, onContinue)); return; }
  if (!data) { if (onContinue) onContinue(); return; }
  const wPp = _factionUpperUrl(data.winnerFaction.leaderId);
  const lPp = _factionUpperUrl(data.loserFaction.leaderId);
  if (Number.isFinite(data.winnerScore) && Number.isFinite(data.loserScore)) {
    data = { ...data, scoreA: data.winnerScore, scoreB: data.loserScore };
  }
  const html = `
    <div class="fevt-overlay-arena" id="fevtF09EndingOverlay">
      <div class="fevt-arena-card f08-post">
        <div class="fevt-arena-header">
          <div class="fevt-arena-title">⚔ 派閥対抗戦 ・ 結末</div>
          <div class="fevt-arena-meta">${_factionSeasonLabel(state)} ・ AFTERMATH</div>
        </div>
        <div class="fevt-arena-narration">${String(data.narration || '')}</div>
        <div class="fevt-arena-stage">
          <div class="fevt-arena-portrait winner-big" style="background-image:url('${wPp}');background-size:cover;background-position:center 20%;margin:0 auto 10px"></div>
          <div class="fevt-arena-faction">${String(data.winnerFaction.name)}</div>
          <div class="fevt-arena-name">${String(data.winnerFaction.leaderName)}</div>
          <div class="fevt-arena-org">勝ち越し派閥</div>
          <div class="fevt-arena-bubble winner-big" style="margin-left:auto;margin-right:auto">
            <span class="fevt-arena-bubble-name">${String(data.winnerFaction.leaderName)}</span>${String(data.winnerLine || '')}
          </div>
          <div class="fevt-arena-divider"></div>
          <div class="fevt-arena-portrait loser" style="background-image:url('${lPp}');background-size:cover;background-position:center 20%;margin:0 auto 8px"></div>
          <div class="fevt-arena-faction" style="opacity:0.75">${String(data.loserFaction.name)}</div>
          <div class="fevt-arena-name" style="font-size:15px;opacity:0.85">${String(data.loserFaction.leaderName)}</div>
          <div class="fevt-arena-bubble loser" style="margin-left:auto;margin-right:auto">
            <span class="fevt-arena-bubble-name">${String(data.loserFaction.leaderName)}</span>${String(data.loserLine || '')}
          </div>
        </div>
        <div style="text-align:center;font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--gold-light, #f0d078);letter-spacing:2px;margin:14px 0">
          ${String(data.winnerFaction.name)} <span style="color:#fff">${data.scoreA}</span> — <span style="color:#fff">${data.scoreB}</span> ${String(data.loserFaction.name)}
        </div>
        ${data.swept ? '<div style="text-align:center;font-family:\'Oswald\',sans-serif;font-size:11px;letter-spacing:3px;color:var(--accent-hostility);margin-bottom:12px">勝ち越しボーナス +15PT</div>' : ''}
        <div class="fevt-arena-actions">
          <button class="fevt-arena-btn" id="fevtF09EndingBtn">閉じる</button>
        </div>
      </div>
    </div>`;
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-arena');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
  const btn = root.querySelector('#fevtF09EndingBtn');
  if (btn) btn.addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    try { if (typeof Audio !== 'undefined' && Audio.stinger) Audio.stinger('../bgm/f06_fin_chime_v1.mp3', 0.16); } catch (e) {}
    _f09BgmStop(800);
    _factionCloseCinematicOverlay();
    if (onContinue) onContinue();
  });
}

if (typeof window !== 'undefined') {
  window.showFactionF09OpeningModal = showFactionF09OpeningModal;
  window.showFactionF09MatchPreModal = showFactionF09MatchPreModal;
  window.showFactionF09MatchPostModal = showFactionF09MatchPostModal;
  window.showFactionF09EndingModal = showFactionF09EndingModal;
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
          <div class="fevt-res-ledger-line">リーダーは社長の裁定を受け入れている</div>
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

// Common-3: 派閥加入通知モーダル（通知のみ・選択肢なし）
function showFactionCommon3Modal(payload, state, onClose) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionCommon3Modal(payload, state, onClose)); return; }

  const roster = state ? (state.roster || []) : [];
  const newcomer = roster.find(c => c.id === payload.newcomerId);
  const leader = roster.find(c => c.id === payload.leaderId);
  const newcomerName = newcomer ? newcomer.name : (payload.newcomerName || '???');
  const leaderName = leader ? leader.name : '???';
  const factionName = String(payload.factionName || '派閥');
  const archetypeId = payload.archetypeId || null;

  const newcomerUrl = newcomer ? _factionUpperUrl(newcomer.id) : '';
  const leaderUrl = leader ? _factionUpperUrl(leader.id) : '';

  const newcomerLine = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.getCommon3Line)
    ? Engine.factions.getCommon3Line('newcomer', { fighter: newcomer })
    : 'よろしくお願いします。';
  const reactionLine = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.getCommon3Line)
    ? Engine.factions.getCommon3Line('reaction', { archetypeId, newcomerFighter: newcomer })
    : 'よろしく。';

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1 §2-4)。
  // fc1m-bubble-wrap・fc1m-portraitは安全網テスト(test/u3-group-b-safety-net-test.js)互換のためco-classとして残す。
  const html = `
    <div class="fevt-overlay-office" id="fevtCommon3Overlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🤝 ${escHtml(factionName)}へ加入</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, `${escHtml(newcomerName)}が${escHtml(factionName)}に加わったみたいです。`)}
        <div class="fevt-subject-stage">
          <div class="fc1m-compare u3b-theme-cream">
            ${_u3bSideHtml({
              name: newcomerName, line: newcomerLine, imgUrl: newcomerUrl, role: '新加入',
              bubbleClass: 'fc1m-bubble-wrap', portraitClass: 'fc1m-portrait',
            })}
            <div class="fc1m-vs">→</div>
            ${_u3bSideHtml({
              name: leaderName, line: reactionLine, imgUrl: leaderUrl, role: `${factionName} ・ リーダー`,
              bubbleClass: 'fc1m-bubble-wrap', portraitClass: 'fc1m-portrait',
            })}
          </div>
        </div>
        <div class="fevt-decision-tray" style="justify-content:center">
          <div class="fevt-decision-card" data-choice="OK" style="max-width:200px">
            <div class="fevt-decision-label">見届ける ✓</div>
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
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onClose) onClose();
    });
  });
}

// ── §6 アーキタイプ遷移ナレーション モーダル ──
// payload: { factionId, factionName, leaderId, reasonKey, fromArchetype, toArchetype }
function showFactionArchetypeTransitionModal(payload, state, onClose) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionArchetypeTransitionModal(payload, state, onClose)); return; }

  const roster = state ? (state.roster || []) : [];
  const leader = roster.find(c => c.id === payload.leaderId);
  const leaderName = leader ? leader.name : '???';
  const factionName = String(payload.factionName || '派閥');
  const reasonKey = payload.reasonKey || '';
  const leaderUrl = leader ? _factionUpperUrl(leader.id) : '';

  const lines = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.getTransitionLine)
    ? Engine.factions.getTransitionLine(reasonKey, leader, { leader: leaderName, org: factionName })
    : { leaderLine: '', narration: '' };

  const ARCHETYPE_LABEL = {
    AUTHORITY: '権威型', BOND: '結束型', MERIT: '実力主義', HEEL: 'ヒール派閥', FACE: '正統派', COMBAT: '武闘派',
  };
  const fromLabel = ARCHETYPE_LABEL[payload.fromArchetype] || payload.fromArchetype || '';
  const toLabel = ARCHETYPE_LABEL[payload.toArchetype] || payload.toArchetype || '';

  // U3グループD統一(2026-07-26): .fevt-quote(本人セリフ)は頭上の白い吹き出しへ移行(_u3bSideHtml)。
  // 旧96×120の生img肖像はladder Mサイズ(132×194)に統一。地の文(fevt-narration)は位置そのまま。
  const html = `
    <div class="fevt-overlay-office" id="fevtTransitionOverlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🔄 ${factionName} 派閥の変質</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, `${factionName}の色合いが変わったようです——${fromLabel}から${toLabel}へ。`)}
        <div class="fevt-subject-stage u3b-theme-cream">
          ${_u3bSideHtml({
            name: leaderName, line: lines.leaderLine || '',
            imgUrl: leaderUrl, role: `${factionName} : ${fromLabel} → ${toLabel}`,
            bubbleClass: 'fevt-bubble',
          })}
          <div class="fevt-subject-divider" style="margin-top:18px"></div>
          <div class="fevt-narration" style="margin-top:10px;color:var(--text-muted);font-size:0.92em;line-height:1.55">
            ${lines.narration || ''}
          </div>
        </div>
        <div class="fevt-decision-tray" style="justify-content:center">
          <div class="fevt-decision-card" data-choice="OK" style="max-width:200px">
            <div class="fevt-decision-label">見届ける ✓</div>
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
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onClose) onClose();
    });
  });
}

// Common-4: 派閥合宿・慰労会 通知モーダル（プレイヤー選択なし）
function showFactionCommon4Modal(payload, state, onClose) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionCommon4Modal(payload, state, onClose)); return; }

  const roster = state ? (state.roster || []) : [];
  const leader = roster.find(c => c.id === payload.leaderId);
  const leaderName = leader ? leader.name : (payload.leaderName || '???');
  const factionName = String(payload.factionName || '派閥');
  const archetypeId = payload.archetypeId || null;
  const leaderUrl = leader ? _factionUpperUrl(leader.id) : '';

  const lineRng = (typeof Engine !== 'undefined' && Engine.rng && Engine.rng.create)
    ? Engine.rng.create(Engine.rng.derive(state.rngSeed || 1, state.season || 1, state.week || 1, payload.factionId, 0xC04))
    : null;
  const line = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.getCommon4Line)
    ? Engine.factions.getCommon4Line(archetypeId, lineRng)
    : { headline: '派閥合宿', narration: '揃って数日を過ごした。', leaderQuote: '' };

  // U3グループD統一(2026-07-26): .fevt-quote(本人セリフ)は頭上の白い吹き出しへ移行(_u3bSideHtml)。
  const html = `
    <div class="fevt-overlay-office" id="fevtCommon4Overlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🏕 ${factionName} ${line.headline}</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, `${factionName}が${line.headline}を組んだみたいです。`)}
        <div class="fevt-subject-stage u3b-theme-cream">
          ${_u3bSideHtml({
            name: leaderName, line: line.leaderQuote || '',
            imgUrl: leaderUrl, role: `${factionName} — ${line.headline}`,
            bubbleClass: 'fevt-bubble',
          })}
          <div class="fevt-subject-divider" style="margin-top:18px"></div>
          <div style="color:#5d4a30;line-height:1.7;margin:8px 4px 0;font-size:14px">${line.narration}</div>
        </div>
        <div class="fevt-decision-tray" style="justify-content:center">
          <div class="fevt-decision-card" data-choice="OK" style="max-width:200px">
            <div class="fevt-decision-label">見届ける ✓</div>
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
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onClose) onClose();
    });
  });
}

// Common-1: 派閥内試合提案 3 択モーダル
function showFactionCommon1Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionCommon1Modal(payload, state, onChoice)); return; }
  const roster = state ? (state.roster || []) : [];
  const sameId = (left, right) => String(left) === String(right);
  const findRosterFighter = id => roster.find(c => c && sameId(c.id, id)) || null;
  const resolved = (typeof Engine !== 'undefined' && Engine.factions && Engine.factions.resolveCommon1Fighters)
    ? Engine.factions.resolveCommon1Fighters(state, payload)
    : null;
  const fA = (resolved && resolved.fighterA) || findRosterFighter(payload.fighterAId);
  const fB = (resolved && resolved.fighterB) || findRosterFighter(payload.fighterBId);
  const leader = (resolved && resolved.leader) || findRosterFighter(payload.leaderId);
  const factionName = String(payload.factionName || '派閥');
  const archetypeId = payload.archetypeId || null;
  const aName = fA ? fA.name : (payload.fighterAName || '???');
  const bName = fB ? fB.name : (payload.fighterBName || '???');

  const vars = { factionName, aName, bName };
  const coachLine = (Engine.factions.getCommon1Line)
    ? Engine.factions.getCommon1Line('coachReport', { archetypeId, vars })
    : `${factionName}内の${aName}と${bName}に火種があります。`;
  const leaderLine = (Engine.factions.getCommon1Line)
    ? Engine.factions.getCommon1Line('leaderDemand', { archetypeId, vars, fighter: leader || fA })
    : 'リングで決めたい。';

  const ovr = (f) => f ? Math.round(((f.pw||0)+(f.sp||0)+(f.te||0)+(f.st||0)+(f.mn||0))/5) : '—';
  const ovrA = ovr(fA), ovrB = ovr(fB);
  const stat = (f, k) => f && typeof f[k] === 'number' ? f[k] : 0;
  const statRow = (label, key) => {
    const va = stat(fA, key), vb = stat(fB, key);
    const aHi = va > vb ? ' fc1m-higher' : '';
    const bHi = vb > va ? ' fc1m-higher' : '';
    return { label, aHi, va, bHi, vb };
  };
  const stats = [
    statRow('PW','pw'), statRow('SP','sp'), statRow('TE','te'), statRow('ST','st'), statRow('MN','mn')
  ];
  const renderStats = (side) => stats.map(r => {
    const hi = side === 'a' ? r.aHi : r.bHi;
    const v = side === 'a' ? r.va : r.vb;
    return `<div class="fc1m-stat"><div class="fc1m-stat-label">${r.label}</div><div class="fc1m-stat-val${hi}">${v}</div></div>`;
  }).join('');

  const isLeaderA = leader && fA && leader.id === fA.id;
  const isLeaderB = leader && fB && leader.id === fB.id;
  const leaderSide = isLeaderA ? 'a' : (isLeaderB ? 'b' : 'a');
  const aClick = fA ? `event.stopPropagation();showFighterPopup(${fA.id},'roster',true)` : '';
  const bClick = fB ? `event.stopPropagation();showFighterPopup(${fB.id},'roster',true)` : '';
  const factionTagA = isLeaderA ? `${factionName} ・ リーダー` : factionName;
  const factionTagB = isLeaderB ? `${factionName} ・ リーダー` : factionName;
  const rivalryNum = (payload.currentRivalry != null) ? payload.currentRivalry : 0;

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。5項目比較(fc1m-stats)は
  // 数値行の後ろに追加する画面固有コンテンツとして温存する(構成順は変えず末尾に付く)。
  const html = `
    <div class="fevt-overlay-office" id="fevtCommon1Overlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">⚔ 派閥内対決の打診</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, escHtml(coachLine))}
        <div class="fc1m-compare u3b-theme-cream">
          ${_u3bSideHtml({
            name: aName, line: leaderSide === 'a' ? leaderLine : '', imgUrl: fA ? _factionUpperUrl(fA.id) : '',
            role: factionTagA, statLabel: 'OVR', statValue: ovrA, onClick: aClick,
            bubbleClass: 'fc1m-bubble-wrap', portraitClass: 'fc1m-portrait',
            extraHtml: `<div class="fc1m-stats">${renderStats('a')}</div>`,
          })}
          <div class="fc1m-vs">VS</div>
          ${_u3bSideHtml({
            name: bName, line: leaderSide === 'b' ? leaderLine : '', imgUrl: fB ? _factionUpperUrl(fB.id) : '',
            role: factionTagB, statLabel: 'OVR', statValue: ovrB, onClick: bClick,
            bubbleClass: 'fc1m-bubble-wrap', portraitClass: 'fc1m-portrait',
            extraHtml: `<div class="fc1m-stats">${renderStats('b')}</div>`,
          })}
        </div>
        <div class="fc1m-rivalry">2名間の因縁 <strong>${rivalryNum}</strong> / 100 — 火種は熟している</div>
        <div class="fevt-decision-prompt">この火種、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray three">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">派閥内対決を組む</div>
            <div class="fevt-decision-hint">ビッグマッチとして実際に試合。勝者は報われ、敗者はわだかまりを残す／因縁 <strong>-30〜-50</strong></div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">別カードに置換</div>
            <div class="fevt-decision-hint">対決は組まない。火種は残ったまま継続</div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">静観する</div>
            <div class="fevt-decision-hint">何もしない。彼女らの自然な決着に任せる</div>
          </div>
        </div>
      </div>
    </div>
  `;
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
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

// Common-5: 派閥代表メディア取材 3 択モーダル
function showFactionCommon5Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionCommon5Modal(payload, state, onChoice)); return; }
  const roster = state ? (state.roster || []) : [];
  const leader = roster.find(c => c.id === payload.leaderId);
  const leaderName = leader ? leader.name : (payload.leaderName || '???');
  const factionName = String(payload.factionName || '派閥');
  const archetypeId = payload.archetypeId || null;
  const leaderUrl = leader ? _factionUpperUrl(leader.id) : '';
  const portrait = leaderUrl
    ? `<div class="fevt-subject-portrait-wrap" style="background-image:url('${leaderUrl}');width:96px;height:120px"></div>`
    : `<div class="fevt-subject-portrait-wrap" style="width:96px;height:120px"></div>`;

  const vars = { factionName, leaderName };
  const coachLine = (Engine.factions.getCommon5Line)
    ? Engine.factions.getCommon5Line('coachReport', { archetypeId, vars })
    : `${factionName}に取材依頼が来ています。`;

  const html = `
    <div class="fevt-overlay-office" id="fevtCommon5Overlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">📰 派閥代表メディア取材</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, coachLine)}
        <div class="fevt-subject-stage">
          <div style="display:flex;justify-content:center;margin-bottom:8px">${portrait}</div>
          <div class="fevt-subject-name">${leaderName}（${factionName}）</div>
          <div class="fevt-subject-divider"></div>
          <div style="color:#5d4a30;line-height:1.7;margin:8px 4px;font-size:14px">取材オファーが届いた。誰がどう答えるかで、誌面の色が変わる。</div>
        </div>
        <div class="fevt-decision-prompt">取材、誰に委ねますか？</div>
        <div class="fevt-decision-tray three">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">${leaderName}に任せる</div>
            <div class="fevt-decision-hint">派閥色が強く出る。アーキタイプに応じてハイリスクハイリターン</div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">コーチ同席で対応</div>
            <div class="fevt-decision-hint">無難な記事に。勢い <strong>+2</strong>／メディア収入 <strong>¥5〜10万</strong></div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">取材を断る</div>
            <div class="fevt-decision-hint">露出なし。勢い <strong>-2</strong>／メディア関係微低下</div>
          </div>
        </div>
      </div>
    </div>
  `;
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
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

// Common-7: 派閥間合同企画 3 択モーダル
function showFactionCommon7Modal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showFactionCommon7Modal(payload, state, onChoice)); return; }
  const roster = state ? (state.roster || []) : [];
  const lA = roster.find(c => c.id === payload.leaderAId);
  const lB = roster.find(c => c.id === payload.leaderBId);
  const lAName = lA ? lA.name : (payload.leaderAName || '???');
  const lBName = lB ? lB.name : (payload.leaderBName || '???');
  const factionAName = String(payload.factionAName || '派閥A');
  const factionBName = String(payload.factionBName || '派閥B');
  const planType = String(payload.planType || '合同企画');
  const archA = payload.archetypeAId || null;
  const archB = payload.archetypeBId || null;

  const vars = { factionAName, factionBName, planType };
  const coachLine = (Engine.factions.getCommon7Line)
    ? Engine.factions.getCommon7Line('coachReport', { vars })
    : `${factionAName}と${factionBName}、合同企画の打診が出ています。`;
  const aQuote = (Engine.factions.getCommon7Line)
    ? Engine.factions.getCommon7Line('leaderAQuote', { archetypeId: archA, vars })
    : '「組んでみるか」';
  const bQuote = (Engine.factions.getCommon7Line)
    ? Engine.factions.getCommon7Line('leaderBQuote', { archetypeId: archB, vars })
    : '「乗った」';

  // U3グループD統一(2026-07-26): .fevt-quote(本人セリフ)は各リーダー側の頭上吹き出しへ移行。
  // 両者とも発言するので F08 の duel 型と同様、両側の bubble-slot を埋める。
  const html = `
    <div class="fevt-overlay-office" id="fevtCommon7Overlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">🤝 派閥間合同企画</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, coachLine)}
        <div class="fevt-subject-stage u3b-theme-cream">
          <div class="fevt-subject-pair">
            <div class="col">
              ${_u3bSideHtml({
                name: lAName, line: aQuote, imgUrl: lA ? _factionUpperUrl(lA.id) : '',
                role: factionAName, bubbleClass: 'fevt-bubble',
              })}
            </div>
            <div class="fevt-pair-bridge">＋</div>
            <div class="col right">
              ${_u3bSideHtml({
                name: lBName, line: bQuote, imgUrl: lB ? _factionUpperUrl(lB.id) : '',
                role: factionBName, bubbleClass: 'fevt-bubble',
              })}
            </div>
          </div>
          <div class="fevt-subject-org" style="margin-top:6px">${planType}</div>
          <div class="fevt-subject-divider" style="margin-top:12px"></div>
        </div>
        <div class="fevt-decision-prompt">この合同企画、社長としてどう扱いますか？</div>
        <div class="fevt-decision-tray three">
          <div class="fevt-decision-card" data-choice="A">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">合同企画を承認</div>
            <div class="fevt-decision-hint">${planType}が組まれる。両派閥 勢い <strong>+5〜+8</strong>／メンバー間 bond <strong>+1〜+3</strong></div>
          </div>
          <div class="fevt-decision-card" data-choice="B">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">距離を保つ</div>
            <div class="fevt-decision-hint">関係を維持。効果なし</div>
          </div>
          <div class="fevt-decision-card" data-choice="C">
            <div class="fevt-decision-letter">C</div>
            <div class="fevt-decision-label">観察する</div>
            <div class="fevt-decision-hint">現場任せ。50% で両派閥 勢い <strong>+3</strong>／50% で何も起きない</div>
          </div>
        </div>
      </div>
    </div>
  `;
  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
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
  window.showFactionCommon3Modal = showFactionCommon3Modal;
  window.showFactionCommon4Modal = showFactionCommon4Modal;
  window.showFactionCommon1Modal = showFactionCommon1Modal;
  window.showFactionCommon5Modal = showFactionCommon5Modal;
  window.showFactionCommon7Modal = showFactionCommon7Modal;
  window.showFactionArchetypeTransitionModal = showFactionArchetypeTransitionModal;
  window.showFactionEventResult = showFactionEventResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// challenge-request-spec-v0.1 Phase 2: 選手発信 挑戦試合打診モーダル
// 自団体選手 → 他団体選手 への直訴。YES / NO の2択。
// 派閥 Common-1 の比較レイアウト(fc1m-*)を流用しつつ、cross-org 用に再設計。
// ─────────────────────────────────────────────────────────────────────────────
function showChallengeRequestModal(payload, state, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showChallengeRequestModal(payload, state, onChoice)); return; }
  if (!payload) { if (onChoice) onChoice(null); return; }

  const roster = state ? (state.roster || []) : [];
  const aiOrgs = state ? (state.aiOrgs || {}) : {};
  const isInverse = !!payload._inverse;

  // 打診者・相手の lookup（forward / inverse で参照先を切替）
  let requester, opponent, requesterOrgName, opponentOrgName;
  if (isInverse) {
    const reqOrg = aiOrgs[payload.requesterOrgId];
    if (!reqOrg || !Array.isArray(reqOrg.roster)) { if (onChoice) onChoice(null); return; }
    requester = reqOrg.roster.find(c => c.id === payload.selfId);
    opponent = roster.find(c => c.id === payload.otherId);
    if (!requester || !opponent) { if (onChoice) onChoice(null); return; }
    requesterOrgName = (state.rivalOrgNames && state.rivalOrgNames[payload.requesterOrgId])
      || reqOrg.name || payload.requesterOrgId || '他団体';
    opponentOrgName = state.orgName || 'プレイヤー団体';
  } else {
    const otherOrg = aiOrgs[payload.otherOrgId];
    requester = roster.find(c => c.id === payload.selfId);
    opponent = otherOrg && otherOrg.roster ? otherOrg.roster.find(c => c.id === payload.otherId) : null;
    if (!requester || !opponent) { if (onChoice) onChoice(null); return; }
    requesterOrgName = state.orgName || 'プレイヤー団体';
    opponentOrgName = (state.rivalOrgNames && state.rivalOrgNames[payload.otherOrgId])
      || (otherOrg && otherOrg.name) || payload.otherOrgId || '他団体';
  }

  const orgName = state.orgName || 'プレイヤー団体';
  const otherOrgName = isInverse ? requesterOrgName : opponentOrgName;
  const rivalry = payload.rivalry != null ? payload.rivalry : 0;
  const bond    = payload.bond != null ? payload.bond : 50;

  // セリフ抽選（決定論的 rng）
  const lineRng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 0, state.season, state.week, 0xC4A1, payload.selfId, payload.otherId));
  const requesterLine = Engine.challengeRequest.pickRequesterLine(requester, lineRng, opponentOrgName) || 'あの相手と試合させてください。';
  const flavorLine = Engine.challengeRequest.pickFlavorLine(rivalry, bond, requester.name, opponent.name);

  // 取次コーチセリフ
  const coachLine = isInverse
    ? `社長、${requesterOrgName}の${requester.name}選手から直訴です。古巣の${opponent.name}選手とリングで決着をつけたい、と。`
    : `社長、${requester.name}選手から直訴です。${otherOrgName}の${opponent.name}選手と試合をさせてほしい、と。`;

  const ovr = (f) => f ? Math.round(((f.pw||0)+(f.sp||0)+(f.te||0)+(f.st||0)+(f.mn||0))/5) : '—';
  const ovrA = ovr(requester), ovrB = ovr(opponent);
  const stat = (f, k) => f && typeof f[k] === 'number' ? f[k] : 0;
  const statRow = (label, key) => {
    const va = stat(requester, key), vb = stat(opponent, key);
    return { label, aHi: va > vb ? ' fc1m-higher' : '', va, bHi: vb > va ? ' fc1m-higher' : '', vb };
  };
  const stats = [statRow('PW','pw'), statRow('SP','sp'), statRow('TE','te'), statRow('ST','st'), statRow('MN','mn')];
  const renderStats = (side) => stats.map(r => {
    const hi = side === 'a' ? r.aHi : r.bHi;
    const v  = side === 'a' ? r.va  : r.vb;
    return `<div class="fc1m-stat"><div class="fc1m-stat-label">${r.label}</div><div class="fc1m-stat-val${hi}">${v}</div></div>`;
  }).join('');

  // H2H 戦績（短く）
  let h2hLabel = '初対戦';
  if (Engine.h2h && Engine.h2h.getRecordFor) {
    const rec = Engine.h2h.getRecordFor(state, requester.id, opponent.id);
    if (rec && rec.matches > 0) {
      h2hLabel = `${rec.wins}勝${rec.losses}敗`;
    }
  }

  // クリック対象: forward は requester(自陣)、inverse は opponent(自陣) のみ
  const aClick = isInverse ? '' : `event.stopPropagation();showFighterPopup(${requester.id},'roster',true)`;
  const bClick = isInverse ? `event.stopPropagation();showFighterPopup(${opponent.id},'roster',true)` : '';
  // 他団体が絡む(cross-org)画面のため団体バッジを出す(mockup-baseline-v0.1 §5)。
  // orgIdはpayloadの実IDをそのまま使う(名前からの逆引きより確実)
  const requesterOrgId = isInverse ? payload.requesterOrgId : 'player';
  const opponentOrgId = isInverse ? 'player' : payload.otherOrgId;
  const requesterRole = isInverse ? '打診者（古巣に挑む）' : '直訴者';
  const opponentRole = isInverse ? '名指しされた側' : '対戦相手';

  // U3統一(2026-07-25): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。5項目比較(fc1m-stats)は
  // 数値行の後ろに追加する画面固有コンテンツとして温存する(構成順は変えず末尾に付く)。
  const html = `
    <div class="fevt-overlay-office" id="challengeRequestOverlay">
      <div class="fevt-report-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title">📜 挑戦試合の直訴</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)}</div>
        </div>
        ${_factionReporterStrip(state, escHtml(coachLine))}
        <div class="fc1m-compare u3b-theme-cream">
          ${_u3bSideHtml({
            name: requester.name, line: requesterLine, imgUrl: _factionUpperUrl(requester.id),
            role: requesterRole, orgBadge: { orgId: requesterOrgId, orgName: requesterOrgName, isHome: !isInverse },
            statLabel: 'OVR', statValue: ovrA, onClick: aClick,
            bubbleClass: 'fc1m-bubble-wrap', portraitClass: 'fc1m-portrait',
            extraHtml: `<div class="fc1m-stats">${renderStats('a')}</div>`,
          })}
          <div class="fc1m-vs">VS</div>
          ${_u3bSideHtml({
            name: opponent.name, line: '', imgUrl: _factionUpperUrl(opponent.id),
            role: opponentRole, orgBadge: { orgId: opponentOrgId, orgName: opponentOrgName, isHome: isInverse },
            statLabel: 'OVR', statValue: ovrB, onClick: bClick,
            bubbleClass: 'fc1m-bubble-wrap', portraitClass: 'fc1m-portrait',
            extraHtml: `<div class="fc1m-stats">${renderStats('b')}</div>`,
          })}
        </div>
        <div class="fc1m-rivalry">直近対戦 <strong>${h2hLabel}</strong> — ${escHtml(flavorLine)}</div>
        <div class="fevt-decision-prompt">${isInverse ? 'この越境試合、社長として受けますか？' : 'この直訴、社長としてどう答えますか？'}</div>
        <div class="fevt-decision-tray two">
          <div class="fevt-decision-card" data-choice="YES">
            <div class="fevt-decision-letter">A</div>
            <div class="fevt-decision-label">${isInverse ? '受けて立つ' : 'この舞台、組もう'}</div>
            <div class="fevt-decision-hint">${isInverse ? `${escHtml(requesterOrgName)}の挑戦を受け、次の自団体興行の上位3試合で迎え撃つ` : `次の通常興行週、自団体興行より先に${escHtml(opponentOrgName)}へ3人で遠征する`}</div>
          </div>
          <div class="fevt-decision-card" data-choice="NO">
            <div class="fevt-decision-letter">B</div>
            <div class="fevt-decision-label">${isInverse ? 'お引き取り願う' : '今は時期じゃない'}</div>
            <div class="fevt-decision-hint">${isInverse ? `${escHtml(requester.name)}の挑戦は保留。同じ相手からの再打診は当分先になる` : `${escHtml(requester.name)}の意気込みは保留。同じ相手への再打診は当分先になる`}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
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

if (typeof window !== 'undefined') {
  window.showChallengeRequestModal = showChallengeRequestModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// away-flow-redesign 実装A: 同行2名を選ぶ（CH-1b）
// 直訴YESの直後、forward（自団体→他団体）のときだけプレイヤーに選ばせる。
// 言い出し手はロック、残り2枠を自団体ロスターから選ぶ。負傷・休養中・謹慎中の選手は
// 理由付きでグレーアウト表示する（buildMatchCard の _healthy 判定と同じ基準）。
// 健康な候補が2名に満たない場合はモーダルを開かず null で即コールバックし、
// 呼び出し側の既存フォールバック（buildMatchCard 失敗時の却下トースト）に委ねる。
// ─────────────────────────────────────────────────────────────────────────────
function showAwayTeamPickModal(state, requester, opponentOrgName, onConfirm) {
  if (_isPopupActive()) { _popupQueue.push(() => showAwayTeamPickModal(state, requester, opponentOrgName, onConfirm)); return; }
  if (!state || !requester) { if (onConfirm) onConfirm(null); return; }

  const ov = f => (typeof Engine !== 'undefined' && Engine.util && Engine.util.ov) ? Engine.util.ov(f) : 0;
  const roster = state.roster || [];
  const candidates = roster
    .filter(f => f && f.id !== requester.id && !f.isRental)
    .map(f => ({
      fighter: f,
      ovr: ov(f),
      healthy: !f.injury && !f.forcedRest && !f.suspended,
      reason: f.injury ? `${f.injury.type} ${f.injury.weeksLeft}週`
        : f.forcedRest ? '休養中'
        : f.suspended ? '謹慎中'
        : '',
    }))
    .sort((a, b) => b.ovr - a.ovr);

  const healthyOnly = candidates.filter(c => c.healthy);
  if (healthyOnly.length < 2) { if (onConfirm) onConfirm(null); return; }

  let selected = [healthyOnly[0].fighter.id, healthyOnly[1].fighter.id];
  // 枠フォーカス方式(2026-07-25): 初期状態は両枠とも埋まっているが、
  // 「1枠目」にフォーカスを当てておき、候補をいきなりクリックしても
  // そこへ上書きされるようにする(ユーザー指摘: 解除→選択の2手を要求しない)。
  let focusedSlot = 0;

  const root = _factionEnsureOverlayRoot();

  const _awpickFaceHtml = (fighter, cls) => {
    const url = typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
    const bg = _genericFaceBg(fighter.id);
    if (url) return `<div class="${cls}" style="background:${bg}"><img src="${url}" alt="" onerror="this.style.display='none'"></div>`;
    return `<div class="${cls}" style="background:${bg}"><span class="awpick-ini">${escHtml((fighter.name || '?').charAt(0))}</span></div>`;
  };

  const slotHtml = (idx) => {
    const id = selected[idx];
    const c = id ? candidates.find(x => x.fighter.id === id) : null;
    const isFocused = focusedSlot === idx;
    const cls = ['awpick-slot', !c ? 'empty' : '', isFocused ? 'focused' : ''].filter(Boolean).join(' ');
    const commonAttrs = `data-idx="${idx}" role="button" tabindex="0" aria-pressed="${isFocused ? 'true' : 'false'}"`;
    if (!c) {
      const ariaLabel = `同行者${idx + 1}、未選択。タップして候補を選ぶ`;
      return `<div class="${cls}" ${commonAttrs} aria-label="${escHtml(ariaLabel)}">
        <span class="awpick-tag">同行者 ${idx + 1}</span>
        <div class="awpick-face blank">＋</div>
        <div class="awpick-nm awpick-empty">未選択</div>
        <div class="awpick-sub">${isFocused ? '候補を選んでください' : 'タップして選ぶ'}</div>
      </div>`;
    }
    const ariaLabel = `同行者${idx + 1}、${c.fighter.name}。タップで入れ替え`;
    return `<div class="${cls}" ${commonAttrs} aria-label="${escHtml(ariaLabel)}">
      <span class="awpick-tag">同行者 ${idx + 1}</span>
      ${_awpickFaceHtml(c.fighter, 'awpick-face')}
      <div class="awpick-nm">${escHtml(c.fighter.name)}</div>
      <div class="awpick-sub">${isFocused ? '候補を選ぶと入れ替わります' : 'タップで入れ替え'}</div>
      <div class="awpick-ov">OVR ${c.ovr}</div>
    </div>`;
  };

  const candHtml = (c) => {
    const isSel = selected.includes(c.fighter.id);
    const cls = ['awpick-cand', isSel ? 'sel' : '', !c.healthy ? 'dis' : ''].filter(Boolean).join(' ');
    const condLabel = c.healthy && c.fighter.condition != null ? ` ／ 体調 ${Math.round(c.fighter.condition)}` : '';
    return `<div class="${cls}" data-id="${c.fighter.id}" data-healthy="${c.healthy ? '1' : '0'}">
      ${isSel ? '<span class="awpick-chk">✓</span>' : ''}
      ${_awpickFaceHtml(c.fighter, 'awpick-cf')}
      <div class="awpick-cnm">${escHtml(c.fighter.name)}</div>
      <div class="awpick-cst">OVR ${c.ovr}${condLabel}</div>
      ${!c.healthy ? `<div class="awpick-warn">${escHtml(c.reason)}</div>` : ''}
    </div>`;
  };

  function confirmAndClose() {
    const overlay = root.querySelector('.fevt-overlay-office');
    if (overlay) overlay.classList.remove('active');
    setTimeout(() => { if (overlay && root.contains(overlay)) root.innerHTML = ''; _drainPopupQueue(); }, 500);
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    root.removeEventListener('click', handleClick);
    root.removeEventListener('keydown', handleKeydown);
    if (onConfirm) onConfirm(selected.filter(Boolean));
  }

  function paint() {
    const selCount = selected.filter(Boolean).length;
    const candHeadText = focusedSlot != null
      ? `出せる選手 — 「同行者${focusedSlot + 1}」に入れる候補を選んでください`
      : '出せる選手（体調・負傷を考慮）';
    const html = `
      <div class="fevt-overlay-office" id="awayTeamPickOverlay">
        <div class="fevt-report-card">
          <div class="fevt-report-header">
            <div class="fevt-report-title">🚌 遠征メンバーを決める</div>
            <div class="fevt-report-meta">${_mdlASeasonLabel(state)}</div>
          </div>
          <div class="awpick-body">
            <p class="awpick-note">${escHtml(requester.name)}が名指しした一戦です。<strong>あと2名</strong>を連れて${escHtml(opponentOrgName)}へ乗り込みます。<br>遠征に出た選手は、同じ週の自団体興行には出られません。</p>
            <div class="awpick-slots">
              <div class="awpick-slot fixed">
                <span class="awpick-tag">言い出し手・確定</span>
                ${_awpickFaceHtml(requester, 'awpick-face')}
                <div class="awpick-nm">${escHtml(requester.name)}</div>
                <div class="awpick-sub">この一戦の当事者</div>
                <div class="awpick-ov">OVR ${ov(requester)}</div>
              </div>
              ${slotHtml(0)}
              ${slotHtml(1)}
            </div>
            <div class="awpick-cand-head">${escHtml(candHeadText)}</div>
            <div class="awpick-cands">${candidates.map(candHtml).join('')}</div>
            <div class="awpick-foot">
              <div class="awpick-sum">選択 <strong>${selCount}</strong> / 2 名${selCount < 2 ? `　—　残り${2 - selCount}名を選んでください` : ''}</div>
              <div class="awpick-actions">
                <button class="awpick-btn-auto" id="awpickAuto" type="button">おまかせ（OVR順）</button>
                <button class="awpick-btn-go" id="awpickGo" type="button"${selCount === 2 ? '' : ' disabled'}>この3人で行く →</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    root.innerHTML = html;
    const overlay = root.querySelector('.fevt-overlay-office');
    if (overlay) { void overlay.offsetWidth; overlay.classList.add('active'); }
  }

  // 枠フォーカス方式(2026-07-25、Keisuke指摘対応):
  // 同行者スロットをクリックすると「フォーカス」される。フォーカス中の枠がある状態で
  // 候補をクリックすると、既に誰か入っていてもその枠へ即座に上書きされる
  // (旧: 満枠時は候補クリックを拒否し、先に解除させる2手UIだった)。
  function slotClicked(idx) {
    if (idx === focusedSlot) {
      if (selected[idx] != null) {
        // フォーカス中の枠をもう一度押す = その枠から選手を外す(枠側の解除手段)。
        // フォーカスはそのまま保持し、続けて候補を選べば即座に埋まる。
        selected[idx] = null;
      } else {
        // 既に空＆フォーカス中の枠をもう一度押す = フォーカス解除。
        focusedSlot = null;
      }
    } else {
      focusedSlot = idx;
    }
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    paint();
  }

  function candClicked(cand) {
    if (cand.dataset.healthy !== '1') return;
    const id = Number(cand.dataset.id);
    const pos = selected.indexOf(id);
    if (pos >= 0) {
      // 既に選ばれている選手をもう一度押す=解除(既存の逃げ道、維持)。
      // 空いた枠にそのままフォーカスを移し、続けて別候補を選べば埋められるようにする。
      selected[pos] = null;
      focusedSlot = pos;
    } else {
      let target = focusedSlot;
      if (target == null) {
        const emptyIdx = selected.indexOf(null);
        if (emptyIdx >= 0) {
          target = emptyIdx;
        } else {
          // フォーカス無し＋2枠とも埋まっている: 誤操作で意図しない枠を
          // 書き換えないよう、ここでは何もせず「枠を選んでください」と促す。
          if (typeof showToast === 'function') showToast('入れ替えたい同行者の枠を選んでください', 2200);
          return;
        }
      }
      selected[target] = id;
      // 埋めたら次の空き枠へフォーカスを移す。両方埋まったらフォーカス解除
      // (次の変更は必ず枠を明示的に選び直させ、連続クリックでの誤上書きを防ぐ)。
      const nextEmpty = selected.indexOf(null);
      focusedSlot = nextEmpty >= 0 ? nextEmpty : null;
    }
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    paint();
  }

  function handleClick(e) {
    const slotEl = e.target.closest('.awpick-slot');
    if (slotEl && !slotEl.classList.contains('fixed')) {
      slotClicked(Number(slotEl.dataset.idx));
      return;
    }
    const cand = e.target.closest('.awpick-cand');
    if (cand) {
      candClicked(cand);
      return;
    }
    if (e.target.closest('#awpickAuto')) {
      selected = [healthyOnly[0].fighter.id, healthyOnly[1].fighter.id];
      focusedSlot = null;
      confirmAndClose();
      return;
    }
    if (e.target.closest('#awpickGo')) {
      if (selected.filter(Boolean).length !== 2) return;
      confirmAndClose();
    }
  }

  function handleKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const slotEl = e.target.closest && e.target.closest('.awpick-slot');
    if (slotEl && !slotEl.classList.contains('fixed')) {
      e.preventDefault();
      slotClicked(Number(slotEl.dataset.idx));
    }
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);
  paint();
}
if (typeof window !== 'undefined') {
  window.showAwayTeamPickModal = showAwayTeamPickModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// challenge-request-spec-v0.1 追加: YES 直後の返事（sendoff）を頭上吹き出しで見せる。
// 独自モーダルは新設せず、社長室型(mdl-a)の subject-stage + speech（卒業レポート等と同じ部品）を流用する。
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 特別興行の導入シーン (2026-07-26 Keisuke 承認)
//   コーチ1人 → 選手1人 → (呼び出し元が選手選定へ)
// **新しい画面は作らない。** 直訴のYES直後と同じ _mdlASubjectStage を2回続けるだけ。
// **2人並べない。** 選ばれなかった側の扱いが要らなくなる。
// どちらの枚もクリックで飛ばせる(年4回×何十年ぶん見るので、B案=毎回出すが即スキップ可)。
// ─────────────────────────────────────────────────────────────────────────────

/** 2枚目に出す選手を選ぶ。**語れる文脈がある人**から順に。
 *  誰も当てはまらなければ null を返し、**2枚目を出さない**。
 *  無理に喋らせると、言うことのない選手が薄いセリフを言うことになる。
 *
 *  pool は「その大会に実際に出る選手」。**出場者が決まっている大会では必ず渡すこと。**
 *  2026-07-26: 渡していなかったため、U-20 のジュニアトーナメントで
 *  **出場すらしないベテランが「出ます」と喋っていた**(Keisuke 指摘)。 */
function _specialIntroPickSpeaker(state, cfg, pool) {
  const all = (state && state.roster || []);
  const base = pool
    ? pool.map(x => all.find(f => f && f.id === (x && x.id != null ? x.id : x)) || x)
    : all;
  const roster = base.filter(f => f && !f.isRental && !f.injury);
  if (!roster.length || !cfg) return null;
  // 1. 去年この大会に出た選手
  const lastSeason = (state.season || 1) - 1;
  // 前年優勝者は「前年に出場した」だけの選手より優先し、初戦敗退用の台詞を避ける。
  const lastYearChampion = roster.find(f => ((f.careerRecord && f.careerRecord.history) || [])
    .some(h => h && h.type === cfg.historyType && h.season === lastSeason && h.result === 'champion'));
  if (lastYearChampion) return { fighter: lastYearChampion, kind: 'champion' };
  const veteran = roster.find(f => ((f.careerRecord && f.careerRecord.history) || [])
    .some(h => h && h.type === cfg.historyType && h.season === lastSeason));
  if (veteran) return { fighter: veteran, kind: 'lastYear' };
  // 2. 現王者
  const champId = state.titles && state.titles.world ? state.titles.world.championId : null;
  const champ = champId != null ? roster.find(f => f.id === champId) : null;
  if (champ) return { fighter: champ, kind: 'champion' };
  // 3. いちばん人気の選手。
  //    pool 指定時(=出場が確定している大会)は足切りしない。ジュニアの U-20 は
  //    そもそも人気が低いので、40 で切ると2枚目が永遠に出なくなる。
  //    出場が決まっている時点で、その子には語る資格がある。
  const popular = [...roster].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
  if (popular && (pool || (popular.popularity || 0) >= 40)) return { fighter: popular, kind: 'popular' };
  // 4. 該当なし → 2枚目は出さない
  return null;
}

// ── Title match ceremony ─────────────────────────────────────────────────
// 節目イベントと同じ showCeremonyEvent の2フェーズ式典へ、王座結果だけを
// データとして渡す。画面構造・スキップ・音響の復帰を独自実装しない。
// タスク51(2026-07-31): 防衛は年に何度も起きるため、通常の防衛(節目でない)は
// showFactionEventResult と同じ密度のA型モーダル1枚に落とす。
// 戴冠と、5/10/15度目の節目防衛だけ従来の大判式典(showCeremonyEvent)を使う。
// 判定は Engine.news.checkDefenseMilestone(management.js) をそのまま使う(新しい閾値を作らない)。
function showTitleMatchCeremony(outcome, onDone) {
  const done = () => { if (typeof onDone === 'function') onDone(); };
  const isDefense = outcome?.outcome === 'defense';
  const championId = isDefense ? outcome?.champId : outcome?.newChampId;
  const champion = (G?.roster || []).find(f => f.id === championId)
    || (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS.find(f => f.id === championId) : null);
  if (!champion) { done(); return; }
  const opponentId = isDefense ? outcome?.challengerId : outcome?.prevChampId;
  const opponent = (G?.roster || []).find(f => f.id === opponentId)
    || (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS.find(f => f.id === opponentId) : null);
  const defenses = Number(G?.titles?.world?.defenses) || 0;
  const champLine = typeof getTraitQuote === 'function'
    ? getTraitQuote(isDefense ? 'titleDefense' : 'titleWin', champion)
    : (isDefense ? 'このベルトは、まだ渡さない。' : 'このベルトとともに、頂点へ行く。');
  const opponentLine = opponent && typeof getTraitQuote === 'function'
    ? getTraitQuote(isDefense ? 'titleChallengeLoss' : 'titleLoss', opponent)
    : '';

  const milestone = isDefense && typeof Engine !== 'undefined' && Engine.news
    && typeof Engine.news.checkDefenseMilestone === 'function'
    ? Engine.news.checkDefenseMilestone(defenses) : 0;
  if (isDefense && !milestone) {
    showTitleDefenseResultModal(champion, champLine, defenses, done);
    return;
  }

  if (typeof showCeremonyEvent !== 'function') { done(); return; }
  const evt = {
    titleMain: isDefense ? '防 衛' : '戴 冠',
    titleSub: isDefense ? `TITLE DEFENSE · ${defenses}` : 'NEW WORLD CHAMPION',
    narration: isDefense
      ? ['世界王座戦の幕が下りた。', `${champion.name}は、王者としてベルトを守り抜いた。`, `${defenses}度目の防衛成功。王座は、なおその手にある。`]
      : ['世界王座戦の幕が下りた。', `${champion.name}が、頂点のベルトを手にした。`, '新たな王者の時代が、ここから始まる。'],
    narrationGaps: [1],
    visualVariant: 'triumph',
    continueLabel: '式典を終える',
    lineForFighter: fighter => fighter.id === champion.id
      ? champLine
      : (opponentLine || '次は、この景色を取り戻す。'),
  };
  const speakers = [
    { fighter: champion, roleLabel: isDefense ? 'WORLD CHAMPION · DEFENSE SUCCESS' : 'NEW WORLD CHAMPION' },
    ...(opponent ? [{ fighter: opponent, roleLabel: isDefense ? 'CHALLENGER' : 'FORMER CHAMPION' }] : []),
  ];
  showCeremonyEvent(evt, speakers, done);
}

// 通常防衛(節目でない防衛)専用: showFactionEventResult(ui-common.js内)と同じ部品
// (_mdlAHeader / _mdlASubjectStage / _mdlAOpen)で組む、派閥イベント級の軽量A型モーダル。
// 全画面式典は使わない。挑戦者の顔は出さない(王者の頭上吹き出し1つだけに絞る)。
function showTitleDefenseResultModal(champion, champLine, defenses, done) {
  if (typeof _mdlAOpen !== 'function') { done(); return; }
  const metaParts = [];
  if (defenses > 0) metaParts.push(`${defenses}度目の防衛`);
  metaParts.push(typeof _mdlASeasonLabel === 'function' ? _mdlASeasonLabel(G) : '');
  const metaHtml = metaParts.filter(Boolean).join(' ・ ');

  const narrationText = `${escHtml(champion.name || '')}が王座防衛に成功した。`;
  const narrationHtml = `<div class="mdl-a-observation centered" style="text-align:left;padding-top:6px">${narrationText}</div>`;

  const subjectHtml = _mdlASubjectStage(champion, narrationHtml, {
    small: true,
    speech: champLine ? escHtml(champLine) : '',
  });

  const html = `
    ${_mdlAHeader('🛡 王座防衛', metaHtml)}
    ${subjectHtml}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="mdlATitleDefenseClose">閉じる</button>
    </div>
  `;
  if (!_mdlAOpen(html, { narrow: true })) { done(); return; }
  const btn = document.getElementById('mdlATitleDefenseClose');
  if (!btn) { done(); return; }
  btn.addEventListener('click', () => {
    if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
    _mdlAClose();
    done();
  });
}

// U-20 は召集された選手自身が話すため、特別興行の共通文ではなく
// personality × archetype のジュニア用レパートリーを使う。
// 他の特別興行は従来どおり「前年出場者 / 王者 / 人気者」ごとの文脈を優先する。
function _specialIntroFighterLine(eventKey, cfg, speaker, rng) {
  const fighter = speaker && speaker.fighter;
  if (eventKey === 'juniorTournament' && fighter && typeof getJuniorTournamentLine === 'function') {
    const line = getJuniorTournamentLine(
      'summon', fighter.personality || 'normal', fighter.archetype || '_default', rng
    );
    if (line) return line;
  }
  const lines = cfg && cfg.fighter && cfg.fighter[speaker && speaker.kind];
  return (lines && lines.length) ? lines[Engine.rng.int(rng, 0, lines.length - 1)] : '';
}

/** コーチ→選手の2枚を順に見せ、終わったら onDone。
 *  eventKey は SPECIAL_EVENT_INTRO のキー
 *  (autumnWar / springTagLeague / juniorTournament / tenchosen / ppvGrandFinal)
 *
 *  opts.pool … その大会に実際に出る自団体の選手。出場者が既に決まっている大会
 *              (ジュニア/天頂戦/PPV)では必ず渡す。**空なら導入そのものを出さない** —
 *              自団体から誰も出ない大会で「送り出しましょう」と言われても白ける。 */
function showSpecialEventIntro(eventKey, state, onDone, opts) {
  const done = () => { if (onDone) onDone(); };
  const cfg = (typeof SPECIAL_EVENT_INTRO !== 'undefined') ? SPECIAL_EVENT_INTRO[eventKey] : null;
  if (!cfg || typeof _mdlAOpen !== 'function') { done(); return; }
  const pool = opts && opts.pool;
  if (pool && !pool.length) { done(); return; }
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed || 0, state.season, state.week, 0x5E1C));
  const pickLine = arr => (arr && arr.length) ? arr[Engine.rng.int(rng, 0, arr.length - 1)] : '';

  // 取次ぎコーチ。雇っていなければコーチ枚は飛ばす
  const coaches = (typeof getHiredCoaches === 'function') ? getHiredCoaches() : [];
  const coach = coaches.length ? coaches[Engine.rng.int(rng, 0, coaches.length - 1)] : null;
  const speaker = _specialIntroPickSpeaker(state, cfg, pool);

  const showFighterScene = () => {
    if (!speaker) { done(); return; }
    const line = _specialIntroFighterLine(eventKey, cfg, speaker, rng)
      || pickLine(cfg.fighter.popular);
    if (!line) { done(); return; }
    const html = `
      ${_mdlAHeader(cfg.title, _mdlASeasonLabel(state))}
      ${_mdlASubjectStage(speaker.fighter, '', { small: true, speech: escHtml(line) })}
      <div class="mdl-a-prompt" style="padding-bottom:24px">
        <button class="mdl-a-continue-btn" id="mdlASpecialIntroNext2">${escHtml(cfg.nextLabel || '— 続 け る —')}</button>
      </div>`;
    if (!_mdlAOpen(html)) { done(); return; }
    const btn = document.getElementById('mdlASpecialIntroNext2');
    if (btn) btn.addEventListener('click', () => { Audio.play('click'); _mdlAClose(); done(); });
  };

  if (!coach) { showFighterScene(); return; }
  // コーチはアッパー画像で立たせる。_mdlASubjectStage は選手用なので、
  // 同じ見た目になるよう coach を fighter 形に寄せて渡す(画像URLだけ差し替え)
  const coachUrl = (typeof getCoachUpperUrl === 'function') ? getCoachUpperUrl(coach.id) : '';
  const coachSubject = _mdlASubjectStage(null, '', {
    small: true,
    speech: escHtml(pickLine(cfg.coach)),
    portraitUrl: coachUrl,
    name: escHtml(coach.name || ''),
    meta: 'COACH',
  });
  const html = `
    ${_mdlAHeader(cfg.title, _mdlASeasonLabel(state))}
    ${coachSubject}
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" id="mdlASpecialIntroNext1">— 続 け る —</button>
    </div>`;
  if (!_mdlAOpen(html)) { done(); return; }
  const btn = document.getElementById('mdlASpecialIntroNext1');
  if (btn) btn.addEventListener('click', () => { Audio.play('click'); _mdlAClose(); showFighterScene(); });
}

/** 選手を決めたあとの「会場入り」。既存の遠征カット(showTravelScene)をそのまま使う。
 *  行き先は会場名(大会場)。道場から出るので from は自団体。 */
function showSpecialEventTravel(eventKey, state, party, onDone) {
  const done = () => { if (onDone) onDone(); };
  const cfg = (typeof SPECIAL_EVENT_INTRO !== 'undefined') ? SPECIAL_EVENT_INTRO[eventKey] : null;
  if (!cfg || typeof showTravelScene !== 'function') { done(); return; }
  const venueName = (typeof VENUES !== 'undefined' && VENUES[cfg.venueIndex])
    ? VENUES[cfg.venueIndex].name : '会場';
  const members = (Array.isArray(party) ? party : []).filter(Boolean)
    .map(f => ({ id: f.id, name: f.name }));
  const countLabel = ['', '一人', '二人', '三人', '四人'][members.length] || `${members.length}人`;
  showTravelScene({
    heading: '— 会 場 入 り —',
    from: {
      label: state.orgName || 'プレイヤー団体',
      emblemHtml: (typeof orgIconHtml === 'function' ? orgIconHtml('player', 22) : ''),
      accent: 'var(--c-positive)',
    },
    to: { label: venueName, accent: 'var(--gold)' },
    party: members,
    lines: [
      `${countLabel}を乗せたバスが、${venueName}へ向かっています。`,
      cfg.travelLine || '',
    ].filter(Boolean),
    vehicleIcon: '🚌',
    durationMs: 5200,
  }, done);
}

if (typeof window !== 'undefined') {
  window.showSpecialEventIntro = showSpecialEventIntro;
  window.showSpecialEventTravel = showSpecialEventTravel;
}

function showChallengeSendoffModal(fighter, line, state, onDone) {
  const run = () => {
    if (!fighter || !line) { if (onDone) onDone(); return; }
    const subjectHtml = _mdlASubjectStage(fighter, '', { small: true, speech: line });
    const html = `
      ${_mdlAHeader('📜 直訴への返事', _mdlASeasonLabel(state))}
      ${subjectHtml}
      <div class="mdl-a-prompt" style="padding-bottom:24px">
        <button class="mdl-a-continue-btn" id="mdlAChallengeSendoffClose">— 送 り 出 す —</button>
      </div>
    `;
    if (!_mdlAOpen(html)) { if (onDone) onDone(); return; }
    const btn = document.getElementById('mdlAChallengeSendoffClose');
    if (btn) {
      btn.addEventListener('click', () => {
        Audio.play('click');
        _mdlAClose();
        if (onDone) onDone();
      });
    }
  };
  _enqueuePopup(run);
}

if (typeof window !== 'undefined') {
  window.showChallengeSendoffModal = showChallengeSendoffModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// challenge-request-spec-v0.1 Phase 3: 挑戦試合 結果モーダル
// 3シングル連戦の結果を「果たし状成就/不発/痛み分け」のクリームOfficeトーンで提示。
// ─────────────────────────────────────────────────────────────────────────────
function _challengeRequestResultReaction(card, result, state, playerWon, playerLost) {
  const isInverse = !!card.isInverse;
  const pickLine = (lines, fighter, salt) => {
    if (!Array.isArray(lines) || lines.length === 0) return '';
    const fighterId = Number(fighter && fighter.id) || 0;
    const rng = Engine.rng.create(Engine.rng.derive(
      state.rngSeed || 0, state.season || 0, state.week || 0, 0xC4A3, fighterId, salt || 0
    ));
    return lines[Engine.rng.int(rng, 0, lines.length - 1)];
  };

  // 勝っても負けても、まず映すのは「自団体の代表」。この画面は社長への報告なので、
  // 自団体側の言葉を主役に置く。自団体側は forward なら teamA（挑んだ側）、
  // inverse なら teamB（迎え撃った側）。
  // 引き分けだけは従来どおりAI側リアクション（CHALLENGE_LINES に draw を持たないため）。
  // なお「自団体が敗れた回に相手の勝ち名乗りを出さない」という 2026-07-25 の裁定は
  // 2026-07-30 に撤回された。敗戦時も相手側を併記する（呼び出し側の showFoeAlongside 参照）。
  const selfSideFighter = isInverse ? (card.teamB && card.teamB[0]) : (card.teamA && card.teamA[0]);
  if ((playerWon || playerLost) && selfSideFighter
      && Engine.challengeRequest && Engine.challengeRequest.pickLine) {
    const scene = playerWon ? 'win' : 'lose';
    const selfOrgName = isInverse
      ? (card.requesterOrgName || card.otherOrgName)
      : (card.otherOrgName || card.opponentOrgName);
    const selfRng = Engine.rng.create(Engine.rng.derive(
      state.rngSeed || 0, state.season || 0, state.week || 0, 0xC4A3,
      Number(selfSideFighter.id) || 0, playerWon ? 1 : 3
    ));
    const selfLine = Engine.challengeRequest.pickLine(selfSideFighter, scene, selfRng, selfOrgName);
    if (selfLine) {
      const selfLabel = playerWon
        ? (isInverse ? '挑戦を退けた代表' : '挑戦を実らせた代表')
        : (isInverse ? '受けて、敗れた代表' : '挑んで、敗れた代表');
      return { fighter: selfSideFighter, line: selfLine, label: selfLabel, defeated: !playerWon };
    }
  }

  // 上記で拾えない場合（主に引き分け、またはセリフ欠落時）はAI側代表を映す。
  return _challengeRequestOpponentReaction(card, result, state, playerWon, playerLost);
}

/** 相手団体（AI側）代表のリアクション。勝敗は teamB＝相手陣視点で解釈する。
 *  自団体が勝った回では、報告の前に映す「敗れた相手の顔」としても使う。 */
function _challengeRequestOpponentReaction(card, result, state, playerWon, playerLost) {
  const isInverse = !!card.isInverse;
  const fighter = isInverse ? (card.teamA && card.teamA[0]) : (card.teamB && card.teamB[0]);
  const outcome = playerWon ? 'lose' : (playerLost ? 'win' : 'draw');
  const label = outcome === 'lose'
    ? (isInverse ? '挑み、敗れた代表' : '受けて、敗れた代表')
    : outcome === 'win'
    ? (isInverse ? '挑戦を実らせた代表' : '受けて、勝った代表')
    : (isInverse ? '挑んだ代表・決着つかず' : '受けた代表・決着つかず');

  const arch = (fighter && fighter.archetype) || 'normal';
  const personality = (fighter && fighter.personality) || 'normal';
  const pool = typeof CHALLENGE_REQUEST_OPPONENT_REACTIONS !== 'undefined'
    ? (CHALLENGE_REQUEST_OPPONENT_REACTIONS[`${arch}_${personality}`]
      || CHALLENGE_REQUEST_OPPONENT_REACTIONS[`${arch}_normal`]
      || CHALLENGE_REQUEST_OPPONENT_REACTIONS.normal_normal)
    : null;
  const lines = pool && ((pool[outcome] && pool[outcome].length > 0) ? pool[outcome] : pool._accept);
  const rng = fighter ? Engine.rng.create(Engine.rng.derive(
    state.rngSeed || 0, state.season || 0, state.week || 0, 0xC4A3, Number(fighter.id) || 0, 2
  )) : null;
  const line = (Array.isArray(lines) && lines.length > 0 && rng)
    ? lines[Engine.rng.int(rng, 0, lines.length - 1)]
    : '';
  return { fighter, line, label, defeated: outcome === 'lose' };
}

/** 併記する2人の描画順を決める（純粋関数）。**勝者を左、敗者を右**に固定する。
 *  自団体が負けた回は自団体側が敗者なので、相手（勝者）を先に置く。
 *  この並べ替えが無いと敗戦時だけ左右が逆になる。foeReaction が null なら1人だけ返す。 */
function _challengeRequestReactionOrder(reaction, foeReaction, playerLost) {
  if (!reaction) return foeReaction ? [foeReaction] : [];
  if (!foeReaction) return [reaction];
  return playerLost ? [foeReaction, reaction] : [reaction, foeReaction];
}

function showChallengeRequestResultModal(card, result, state, onClose) {
  // The match-preview/result shell stays active while the post-show modal chain runs.
  // Waiting on that shell would deadlock: renderShowResult is only called by onClose.
  if (_isPopupActive({ ignoreShowResultOverlay: true })) {
    _popupQueue.push(() => showChallengeRequestResultModal(card, result, state, onClose));
    return;
  }
  if (!card || !result) { if (onClose) onClose(); return; }
  // 直前の _factionCloseCinematicOverlay が 600ms 後に innerHTML を消すため、
  // 描画はそのタイマー消化後に行う。
  if (!card.__deferredRender) {
    card.__deferredRender = true;
    setTimeout(() => showChallengeRequestResultModal(card, result, state, onClose), 650);
    return;
  }

  const teamWin = result.teamWin; // 'A' | 'B' | 'draw' （teamA = 打診者陣 / teamB = 相手陣）
  const isInverse = !!card.isInverse;
  // プレイヤー視点の勝敗: forward は teamA(player) / inverse は teamB(player)
  const playerWon = isInverse ? teamWin === 'B' : teamWin === 'A';
  const playerLost = isInverse ? teamWin === 'A' : teamWin === 'B';
  const titleText = playerWon ? (isInverse ? '挑戦、退ける。' : '果たし状、成就。')
    : playerLost ? (isInverse ? '挑戦、許す。' : '果たし状、敗れる。')
    : '挑戦、決着つかず。';
  const tone = playerWon ? 'positive' : (playerLost ? 'negative' : 'neutral');

  // 生の値(reqName/oppName/ourOrg/otherOrgName)は_awOrgEmblem()の団体名完全一致検索にも使うため
  // 変更しない。表示にはescHtml済みの*Safe変数を使う(U5: スコア帯・コーチ行・試合行のescHtml抜けを解消)。
  const reqName = card.teamA[0].name;
  const oppName = card.teamB[0].name;
  const ourOrg = state.orgName || 'プレイヤー団体';
  const otherOrgName = isInverse ? (card.requesterOrgName || card.otherOrgName) : card.otherOrgName;
  const reqNameSafe = escHtml(reqName);
  const oppNameSafe = escHtml(oppName);
  const ourOrgSafe = escHtml(ourOrg);
  const otherOrgNameSafe = escHtml(otherOrgName);
  // プレイヤー陣スコア表示順を player-vs-AI で揃える
  const playerScore = isInverse ? result.winsB : result.winsA;
  const aiScore = isInverse ? result.winsA : result.winsB;

  const coachLine = isInverse
    ? (playerWon
        ? `社長、挑戦試合 ${playerScore} — ${aiScore}。${otherOrgNameSafe}の${reqNameSafe}選手の越境挑戦、退けました。`
        : playerLost
        ? `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqNameSafe}選手陣に古巣として星を取られる結果になりました。`
        : `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqNameSafe}選手と${oppNameSafe}選手の決着は持ち越しです。`)
    : (playerWon
        ? `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqNameSafe}選手が呼んだ舞台、しっかり制しました。`
        : playerLost
        ? `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqNameSafe}選手の直訴…結果が伴いませんでした。`
        : `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqNameSafe}選手と${oppNameSafe}選手の決着は持ち越しです。`);

  // U1: 顔出し+セリフの縦順序(吹き出し→画像→名前→役割ラベル)をmockup-baseline v0.2に揃える。
  // 吹き出しの中身はセリフ本文のみ(話者名・所属は入れない。話者は画像下の名前表示で示す)。
  const renderReactionScene = (rx) => {
    if (!rx || !rx.line || !rx.fighter) return '';
    const url = _factionUpperUrl(rx.fighter.id);
    const nm = escHtml(rx.fighter.name || '');
    return `<div class="crrm-reaction-scene${rx.defeated ? ' is-defeated' : ' is-victorious'}">
        <div class="crrm-reaction-bubble-slot"><div class="crrm-reaction-bubble"><span class="crrm-reaction-line">「${escHtml(rx.line)}」</span></div></div>
        <div class="crrm-reaction-portrait"${url ? ` style="background-image:url('${url}')"` : ''}>${url ? '' : escHtml((rx.fighter.name || '?').slice(0, 1))}</div>
        <div class="crrm-reaction-copy">
          <div class="crrm-reaction-name">${nm}</div>
          <div class="crrm-reaction-role">${escHtml(rx.label)}</div>
        </div>
      </div>`;
  };

  const reaction = _challengeRequestResultReaction(card, result, state, playerWon, playerLost);
  // 決着した回は自団体と相手の両方を映す。勝った回は敗れた相手の顔を、
  // 負けた回は相手の勝ち名乗りを併記する（2026-07-30 Keisuke裁定。当初は
  // 「敗れた回に相手の勝ち名乗りを出さない」としていたが撤回された）。
  // 引き分けは reaction 自体がAI側になるため二重に出さない。
  const foeReaction = ((playerWon || playerLost) && Engine.rng)
    ? _challengeRequestOpponentReaction(card, result, state, playerWon, playerLost)
    : null;
  const showFoeAlongside = !!(foeReaction && foeReaction.fighter && foeReaction.line
    && reaction && reaction.fighter && foeReaction.fighter !== reaction.fighter);
  const scenes = _challengeRequestReactionOrder(reaction, showFoeAlongside ? foeReaction : null, playerLost)
    .map(renderReactionScene).join('');
  const reactionHtml = `<div class="crrm-reactions${showFoeAlongside ? ' is-pair' : ''}">${scenes}</div>`;

  const matchRows = result.matches.map((m, i) => {
    const winSide = m.winner === 'left' ? 'A' : (m.winner === 'right' ? 'B' : 'draw');
    const winLabelA = winSide === 'A' ? '<span class="crrm-win">○</span>' : (winSide === 'B' ? '<span class="crrm-loss">×</span>' : '');
    const winLabelB = winSide === 'B' ? '<span class="crrm-win">○</span>' : (winSide === 'A' ? '<span class="crrm-loss">×</span>' : '');
    const numLabel = ['第1試合', '第2試合', '第3試合'][i] || `第${i+1}試合`;
    const finLabel = m.finMove ? `<span class="crrm-fin">${m.finMove}</span>` : '';
    // inverse: 行表示も player を左に揃える（fighterB が player 側）
    const leftFighter = isInverse ? m.fighterB : m.fighterA;
    const rightFighter = isInverse ? m.fighterA : m.fighterB;
    const leftLabel = isInverse ? winLabelB : winLabelA;
    const rightLabel = isInverse ? winLabelA : winLabelB;
    const relText = fighter => {
      const delta = m.relationshipDelta && m.relationshipDelta[fighter.id];
      if (!delta) return '';
      const signed = value => `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}`;
      return `<small class="crrm-rel">因縁 ${signed(delta.rivalry)} / 相手との関係 ${signed(delta.bond)}</small>`;
    };
    return `
      <div class="crrm-row">
        <div class="crrm-row-num">${numLabel}</div>
        <div class="crrm-row-side crrm-row-a">${leftLabel} <span class="crrm-name">${escHtml(leftFighter.name)}${relText(leftFighter)}</span></div>
        <div class="crrm-row-vs">vs</div>
        <div class="crrm-row-side crrm-row-b"><span class="crrm-name">${escHtml(rightFighter.name)}${relText(rightFighter)}</span> ${rightLabel}</div>
        <div class="crrm-row-mq">MQ ${Math.round(m.mq || 0)}</div>
        <div class="crrm-row-fin">${finLabel}</div>
      </div>`;
  }).join('');

  const html = `
    <style>
      .crrm-card { padding: 22px 26px 18px; max-height:calc(100vh - 24px); overflow-y:auto; }
      .crrm-score-banner { display:flex; align-items:center; justify-content:center; gap:18px; margin:8px 0 14px; }
      .crrm-score-org { font-size:14px; font-weight:600; color:var(--ink-soft, #5a4a3a); flex:1; text-align:center; }
      .crrm-score-org-name { display:flex; align-items:center; justify-content:center; gap:6px; }
      .crrm-score-org-name .aw-org-emblem { margin-bottom:0; }
      .crrm-score-num { font-size:42px; font-weight:800; color:var(--ink, #2a1a08); letter-spacing:2px; }
      .crrm-score-num.win { color:var(--accent-positive, #2d6a2d); }
      .crrm-score-num.lose { color:var(--accent-negative, #8b3a3a); }
      .crrm-tone-pos { color:var(--accent-positive, #2d6a2d); }
      .crrm-tone-neg { color:var(--accent-negative, #8b3a3a); }
      .crrm-tone-neu { color:var(--ink-soft, #5a4a3a); }
      .crrm-rows { display:flex; flex-direction:column; gap:8px; margin:10px 0 14px; }
      .crrm-row { display:grid; grid-template-columns: 70px 1fr 30px 1fr 70px 1fr; align-items:center; gap:8px; padding:8px 10px; background:rgba(255,247,230,0.6); border:1px solid rgba(180,140,90,0.25); border-radius:6px; font-size:13px; }
      .crrm-row-num { font-weight:600; color:var(--ink-soft, #5a4a3a); font-size:12px; }
      .crrm-row-side { display:flex; align-items:center; gap:6px; }
      .crrm-row-a { justify-content:flex-start; }
      .crrm-row-b { justify-content:flex-end; }
      .crrm-row-vs { text-align:center; color:var(--ink-soft, #5a4a3a); font-size:11px; }
      .crrm-row-mq { font-size:11px; color:var(--ink-soft, #5a4a3a); text-align:center; }
      .crrm-row-fin { font-size:11px; color:var(--ink-soft, #5a4a3a); }
      .crrm-name { font-weight:600; color:var(--ink, #2a1a08); }
      .crrm-rel { display:block; margin-top:3px; font-size:9px; font-weight:600; color:var(--accent-warm); white-space:nowrap; }
      .crrm-win { color:var(--accent-positive, #2d6a2d); font-weight:700; }
      .crrm-loss { color:rgba(120,90,60,0.5); }
      .crrm-fin { color:var(--accent-warm, #a06030); }
      .crrm-close-tray { display:flex; justify-content:center; margin-top:12px; }
      .crrm-close-btn { padding:10px 28px; background:var(--accent, #8b5a2b); color:#fff8e8; border:none; border-radius:4px; font-weight:600; cursor:pointer; font-size:13px; }
      .crrm-close-btn:hover { background:var(--accent-strong, #6b4520); }
      /* U1: 試合結果表示の配置バランスを.emr-*(1試合結果ポップアップ)に統一。勝者・敗者で画像サイズは変えず
         (段M=132x194固定)、灰色化と下辺境界の色だけで格差を示す。吹き出しは画像の上の予約枠。 */
      /* 敗れた側と勝った側は**横に並べる**(2026-07-27 Keisuke)。
         ラッパー無しで2つ置いていたため、それぞれが margin:auto の独立ブロックとして
         縦に積まれ、対戦の結果なのに2画面ぶんの高さを食っていた。
         下端(名前・役割)で揃えるので、勝者だけ画像が大きくても土台が揃って見える。 */
      .crrm-reactions { display:flex; justify-content:center; align-items:flex-end; gap:10px; flex-wrap:nowrap; }
      .crrm-reaction-scene { display:flex; flex-direction:column; align-items:center; text-align:center; margin:8px 0 14px; padding:0 6px; max-width:260px; }
      .crrm-reactions.is-pair { display:grid; grid-template-columns:minmax(0,260px) minmax(0,260px); justify-content:center; align-items:end; }
      .crrm-reactions.is-pair .crrm-reaction-scene { width:100%; min-width:0; }
      .crrm-reaction-bubble-slot { height:52px; display:flex; align-items:flex-end; justify-content:center; width:100%; margin-bottom:8px; }
      .crrm-reaction-bubble { position:relative; width:max-content; max-width:220px; padding:7px 11px; background:#fffdf6; border:1px solid rgba(122,101,48,.3); border-radius:var(--radius-lg, 10px); box-shadow:0 5px 14px rgba(70,48,20,.12); font-size:13px; line-height:1.5; color:var(--ink, #2a1a08); }
      .crrm-reaction-line { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .crrm-reaction-bubble::after { content:''; position:absolute; left:50%; transform:translateX(-50%); bottom:-7px; border:7px solid transparent; border-top-color:#fffdf6; border-bottom:0; }
      .crrm-reaction-portrait { display:grid; place-items:center; width:132px; height:194px; overflow:hidden; border-radius:10px 10px 5px 5px; border:1px solid rgba(160,96,48,.25); border-bottom:3px solid var(--accent-warm, #a06030); background:rgba(60,48,36,.12) center top/cover no-repeat; color:rgba(90,70,50,.45); font-size:36px; font-weight:800; }
      .crrm-reaction-copy { margin-top:8px; }
      .crrm-reaction-name { font-size:15px; font-weight:700; color:var(--ink, #2a1a08); }
      .crrm-reaction-role { margin-top:2px; font-size:11px; color:var(--ink-soft, #5a4a3a); }
      /* この画面は勝者/敗者を1人ずつ別々に見せるため、左右対称性の制約が無い。
         「勝ったんだから真ん中でもっと大きく」の指示どおり勝者だけ一段上げる(M -> XL)。
         2人を並置する画面(.emr-*)では従来どおりサイズ差を付けない。 */
      .crrm-reaction-scene.is-victorious .crrm-reaction-portrait { width:172px; height:258px; }
      .crrm-reaction-scene.is-victorious .crrm-reaction-name { font-size:18px; }
      .crrm-reaction-scene.is-defeated .crrm-reaction-portrait { filter:grayscale(.9) brightness(.72); border-bottom-color:rgba(120,112,102,.55); }
      .crrm-reaction-scene.is-defeated .crrm-reaction-bubble { background:#eeeae2; border-color:rgba(100,92,82,.3); }
      .crrm-reaction-scene.is-defeated .crrm-reaction-bubble::after { border-top-color:#eeeae2; }
      .crrm-reaction-scene.is-defeated .crrm-reaction-role { color:rgba(90,70,50,.6); }
      @media(max-width:600px) {
        .crrm-card { padding:14px 12px 12px; }
        /* 狭い画面でも横並びは崩さない（縦積みに戻すと結局2画面ぶんの高さになる）。
           そのぶん画像と吹き出しを一段小さくして2人を収める */
        .crrm-reactions { gap:6px; }
        .crrm-reactions.is-pair { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
        .crrm-reaction-scene { padding:0 2px; }
        .crrm-reaction-bubble { max-width:100%; font-size:11px; padding:5px 8px; }
        .crrm-reaction-bubble-slot { height:46px; margin-bottom:5px; }
        .crrm-reaction-portrait { width:84px; height:123px; }
        .crrm-reaction-scene.is-victorious .crrm-reaction-portrait { width:104px; height:156px; }
        .crrm-reaction-scene.is-victorious .crrm-reaction-name { font-size:14px; }
        .crrm-reaction-name { font-size:12px; }
        .crrm-reaction-role { font-size:10px; }
      }
    </style>
    <div class="fevt-overlay-office" id="challengeRequestResultOverlay">
      <div class="fevt-report-card crrm-card">
        <div class="fevt-report-header">
          <div class="fevt-report-title crrm-tone-${tone === 'positive' ? 'pos' : tone === 'negative' ? 'neg' : 'neu'}">📜 ${titleText}</div>
          <div class="fevt-report-meta">${_factionSeasonLabel(state)} · 挑戦試合（${ourOrgSafe} vs ${otherOrgNameSafe}）</div>
        </div>
        ${_factionReporterStrip(state, coachLine)}
        ${reactionHtml}
        <div class="crrm-score-banner">
          <div class="crrm-score-org"><div class="crrm-score-org-name">${_awOrgEmblem(ourOrg, true, 20)}<span>${ourOrgSafe}</span></div><small>${isInverse ? `迎撃: ${oppNameSafe}陣` : `${reqNameSafe}陣`}</small></div>
          <div class="crrm-score-num ${playerWon ? 'win' : (playerLost ? 'lose' : '')}">${playerScore} — ${aiScore}</div>
          <div class="crrm-score-org"><div class="crrm-score-org-name">${_awOrgEmblem(otherOrgName, false, 20)}<span>${otherOrgNameSafe}</span></div><small>${isInverse ? `打診: ${reqNameSafe}陣` : `${oppNameSafe}陣`}</small></div>
        </div>
        <div class="crrm-rows">${matchRows}</div>
        <div class="crrm-close-tray">
          <button class="crrm-close-btn" id="crrmCloseBtn">閉じる</button>
        </div>
      </div>
    </div>
  `;

  const root = _factionEnsureOverlayRoot();
  root.innerHTML = html;
  const overlay = root.querySelector('.fevt-overlay-office');
  if (overlay) { void overlay.offsetWidth; setTimeout(() => overlay.classList.add('active'), 20); }
  const closeBtn = root.querySelector('#crrmCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      _factionCloseCinematicOverlay();
      if (onClose) onClose();
    });
  }
}

if (typeof window !== 'undefined') {
  window.showChallengeRequestResultModal = showChallengeRequestResultModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0 Phase1-6: 大型イベント モーダル（B1〜B4）
// careOverlay/careBox を再利用。多段階対応（step パラメータ）
// ─────────────────────────────────────────────────────────────────────────────
function showLargeEventModal(event, state, step, onChoice) {
  if (_isPopupActive()) { _popupQueue.push(() => showLargeEventModal(event, state, step, onChoice)); return; }

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
  const severityLabel = event.severity === 'moderate' ? '（重め）' : '（軽め）';
  const funds = state.funds || 0;

  let html = `<div class="care-title" style="border-bottom:1px solid #e67e22;padding-bottom:10px;margin-bottom:12px">⚠️ 練習中のアクシデント${severityLabel}</div>`;

  if (event.detail) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${event.detail}</div>`;
  }

  if (fighter) {
    // U3グループA統一(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1)。
    // Office/Dark Panel(care-overlay は --bg-card 等の非Cream暗色トークン)のため theme=dark。
    // 日常のケアモーダルなので size:'m'(132×194、指示書の明示指定)
    const upperUrl = typeof getPortraitUrl === 'function' ? getPortraitUrl(fighter.id) : '';
    html += `<div class="care-reaction u3b-theme-dark" style="border-color:var(--accent-hostility)">
      ${_u3bSideHtml({
        name: fighter.name, line: event.dialogue || '…', imgUrl: upperUrl,
        fallback: (fighter.name || '?').charAt(0), size: 'm',
        bubbleClass: 'care-reaction-bubble', portraitClass: 'care-reaction-portrait',
      })}
    </div>`;
  }

  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">';
  const canAfford = funds >= 200;
  html += `<button class="btn" data-choice="0" ${canAfford ? '' : 'disabled'}
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between${canAfford ? '' : ';opacity:0.4;cursor:default'}">
    <span>特別治療（-200万）</span><span style="font-size:11px;color:var(--text-dim)">回復期間半減・手厚い対応が伝わる</span>
  </button>`;
  html += `<button class="btn" data-choice="1"
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>通常の治療</span><span style="font-size:11px;color:var(--text-dim)">標準回復</span>
  </button>`;
  html += `<button class="btn" data-choice="2"
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>無理させる</span><span style="font-size:11px;color:var(--text-dim)">期待に応えようとする、40%で悪化リスク</span>
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
        <div class="mdl-a-decision-hint positive">両者とも話を聞く姿勢を取り戻す ／ 士気回復</div>
      </div>
      <div class="mdl-a-decision-card danger-accent" data-choice="1">
        <div class="mdl-a-decision-letter">B</div>
        <div class="mdl-a-decision-label">試合で決着させる</div>
        <div class="mdl-a-decision-hint">勝者↑↑ ／ 敗者↓</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="2">
        <div class="mdl-a-decision-letter">C</div>
        <div class="mdl-a-decision-label">放置する</div>
        <div class="mdl-a-decision-hint negative">両者とも社長への不満を募らせる ／ 士気低下</div>
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
        <div class="mdl-a-decision-hint">${n1}は後押しを喜ぶ ／ ${n2}はえこひいきと感じる</div>
      </div>
      <div class="mdl-a-decision-card" data-choice="1">
        <div class="mdl-a-decision-letter">C</div>
        <div class="mdl-a-decision-label">${n2}を後押し</div>
        <div class="mdl-a-decision-hint">${n2}は後押しを喜ぶ ／ ${n1}はえこひいきと感じる</div>
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

  const verdictJp  = isDraw ? '決着つかず' : '勝 利';
  const verdictEn  = isDraw ? 'NO CONTEST' : 'VICTORY';
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
    ? `<div class="mdl-a-result-row"><span>結果</span><strong>決着つかず</strong></div>`
    : `<div class="mdl-a-result-row"><span>${winnerF ? escHtml(winnerF.name) : ''}</span><strong>社長の判断に満足</strong></div>
       <div class="mdl-a-result-row"><span>${loserF ? escHtml(loserF.name) : ''}</span><strong>わだかまりを残した</strong></div>
       <div class="mdl-a-result-row"><span>両者の士気</span><strong>一旦リセット</strong></div>`;

  const closePart = isDraw
    ? `<div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-choice="0">— 了 解 —</button></div>`
    : `<div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
       <div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-mdla-next>— 次 へ —</button></div>`;

  return `
    <div class="mdl-a-header">
      <div class="mdl-a-header-title">${isDraw ? '🤝 対立の結果' : '✨ 対 立 の 決 着'}</div>
      <div class="mdl-a-header-meta">${isDraw ? 'NO CONTEST' : 'RESOLVED ・ 1 / 2'}</div>
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
          <div class="mdl-a-speech-speaker">${escHtml(displayName.toUpperCase())}</div>
          <div class="mdl-a-speech-text">${escHtml(winnerLine)}</div>
        </div>
        <div class="mdl-a-subject-portrait" style="${portraitStyle}"></div>
      </div>
      <div class="mdl-a-subject-name">${escHtml(displayName)}</div>
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
  const verdictJp  = won ? '勝 利' : lost ? '敗 北' : '決着つかず';
  const verdictEn  = won ? 'VICTORY' : lost ? 'DEFEAT' : 'NO CONTEST';
  const verdictCls = won ? 'victory' : lost ? 'defeat' : 'draw';
  const speechCls  = won ? 'gold' : lost ? 'danger' : '';
  const pLine      = isDraw ? '互角の戦いを見せた。' : won ? 'この試合は、譲れなかった' : '…';

  const resultRows = `
    <div class="mdl-a-result-row"><span>対戦相手</span><strong>${escHtml(challenger.name || '???')}（${escHtml(orgName)}）</strong></div>
    <div class="mdl-a-result-row"><span>MQ</span><span class="gold">${result.mq ? '★' + result.mq : '?'}</span></div>`;

  const closePart = isDraw
    ? `<div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-choice="0">— 了 解 —</button></div>`
    : `<div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
       <div class="mdl-a-prompt" style="padding-bottom:24px"><button class="mdl-a-continue-btn" data-mdla-next>— 次 へ —</button></div>`;

  const headerTitle = won ? '🏆 挑 戦 状 ・ 結 果' : lost ? '😞 挑 戦 状 ・ 結 果' : '🤼 決着つかず';
  const headerMeta  = isDraw ? 'NO CONTEST' : 'RESULT ・ 1 / 2';

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
          <div class="mdl-a-speech-speaker">${escHtml(pName.toUpperCase())}</div>
          <div class="mdl-a-speech-text">${escHtml(pLine)}</div>
        </div>
        <div class="mdl-a-subject-portrait" style="${portraitStyle}${won ? ';box-shadow:0 0 32px rgba(240,208,120,0.3)' : ''}"></div>
      </div>
      <div class="mdl-a-subject-name">${escHtml(pName)}</div>
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
function showB3OpponentAftermath(event, matchResult, onDone) {
  if (!event || !matchResult || matchResult.winner === 'draw') {
    if (onDone) onDone();
    return;
  }

  const challenger = event.challenger || {};
  if (!challenger.id) {
    if (onDone) onDone();
    return;
  }

  const orgName = event.orgName || 'Opponent';
  const won = matchResult.winner === 'left';
  const upperUrl = getUpperUrl(challenger.id);
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a1a14';
  const cOvr = challenger.pw ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5) : '?';

  let challengerLine;
  if (won) {
    challengerLine = (typeof pickDialogueLine === 'function' && typeof BITTER_RESOLUTION_LINES !== 'undefined')
      ? (pickDialogueLine(BITTER_RESOLUTION_LINES.loser, challenger) || '窶ｦ窶ｦ縺薙・蛟溘ｊ縲∝ｿ・★霑斐＠縺ｦ繧・ｋ')
      : '窶ｦ窶ｦ縺薙・蛟溘ｊ縲∝ｿ・★霑斐＠縺ｦ繧・ｋ';
  } else {
    challengerLine = (typeof WAR_POST_DIALOGUE !== 'undefined' && typeof pickDialogueLine === 'function')
      ? (pickDialogueLine(WAR_POST_DIALOGUE.result_win, challenger) || '窶ｦ窶ｦ縺ｩ縺・□縲√％繧後′螳溷鴨縺ｮ蟾ｮ縺')
      : '窶ｦ窶ｦ縺ｩ縺・□縲√％繧後′螳溷鴨縺ｮ蟾ｮ縺';
  }

  const speechVariant = won ? 'resentment' : 'danger';
  const headerTitle = won ? '相手の反応' : '相手の勝利宣言';
  const reporterLine = won
    ? `${orgName}蛛ｴ縺ｯ諤偵ｊ繧帝國縺帙↑縺・ｧ伜ｭ舌〒縺吮ｦ`
    : `${orgName}蛛ｴ縺ｯ蜍晏茜繧定ｪ・､ｺ縺励※縺・∪縺兪`;
  const observationText = won
    ? `${orgName}縺ｨ縺ｮ<span class="marker danger">蝗邵・/span>縺ｯ縲√∪縺邨ゅｏ縺｣縺ｦ縺・↑縺・Ａ`
    : `${orgName}縺ｮ<span class="marker danger">謖醍匱</span>縺ｫ縲√←縺・ｿ懊∴繧九°窶披覗`;

  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay war-ace-overlay';
  overlay.innerHTML = `
    <div class="war-ace-modal pb-container">
      <div class="mdl-a-header danger">
        <div class="mdl-a-header-title">${headerTitle}</div>
        <div class="mdl-a-header-meta">OPPONENT AFTERMATH</div>
      </div>
      ${_mdlAReporterStrip(G, reporterLine)}
      <div class="mdl-a-subject-stage defeat" style="padding-top:96px">
        <div class="mdl-a-portrait-wrap">
          <div class="mdl-a-speech-pending">窶ｦ</div>
          <div class="mdl-a-speech ${speechVariant} delayed">
            <div class="mdl-a-speech-speaker">${(challenger.name || '???').toUpperCase()}</div>
            <div class="mdl-a-speech-text">${challengerLine}</div>
          </div>
          <div class="mdl-a-subject-portrait defeat" style="${portraitStyle}"></div>
        </div>
        <div style="margin-top:12px"><div class="mdl-a-defeat-badge">${won ? 'DEFEATED' : 'VICTOR'}</div></div>
        <div class="mdl-a-subject-name" style="color:rgba(232,220,200,0.85)">${challenger.name || '???'}</div>
        <div class="mdl-a-subject-org" style="color:rgba(200,180,150,0.7)">${orgName} 繝ｻ OVR ${cOvr}</div>
        <div class="mdl-a-observation" style="color:rgba(232,220,200,0.8);font-size:13px;margin-top:16px">
          ${observationText}
        </div>
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="war-victory-close war-ace-close" type="button">笆ｶ</button>
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

// Re-declare the B3 aftermath renderers with clean strings to override mojibake above.
function _buildB3Step3b(event, state, roster) {
  const result = event.matchResult || {};
  const challenger = event.challenger || {};
  const orgName = event.orgName || 'Opponent';
  const won = result.winner === 'left';
  const upperUrl = challenger.id ? getUpperUrl(challenger.id) : '';
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a1a14';
  const cOvr = challenger.pw
    ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5)
    : '?';

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
  const headerTitle = won ? '相手の反応' : '相手の勝利宣言';
  const reporterLine = won
    ? `${orgName}勢は苛立ちを隠せない表情です`
    : `${orgName}勢は勝利を確信しています`;
  const observationText = won
    ? `${orgName}との<span class="marker danger">遺恨</span>は、まだ終わっていない`
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
        <div class="mdl-a-portrait-vignette"></div>
      </div>
      <div style="margin-top:12px"><div class="mdl-a-defeat-badge">${won ? 'DEFEATED ・ 敗北者' : 'VICTOR ・ 勝者'}</div></div>
      <div class="mdl-a-subject-name" style="color:rgba(232,220,200,0.85)">${challenger.name || '???'}</div>
      <div class="mdl-a-subject-org" style="color:rgba(200,180,150,0.7)">${orgName} ・ OVR ${cOvr}</div>
      <div class="mdl-a-observation" style="color:rgba(232,220,200,0.8);font-size:13px;margin-top:16px">
        ${observationText}
      </div>
    </div>
    <div class="mdl-a-tap-hint">TAP TO CONTINUE ・ クリックで進む</div>
    <div class="mdl-a-prompt" style="padding-bottom:24px">
      <button class="mdl-a-continue-btn" data-choice="0">続きを見る</button>
    </div>`;
}

function showB3OpponentAftermath(event, matchResult, onDone) {
  if (!event || !matchResult || matchResult.winner === 'draw') {
    if (onDone) onDone();
    return;
  }

  const challenger = event.challenger || {};
  if (!challenger.id) {
    if (onDone) onDone();
    return;
  }

  const orgName = event.orgName || 'Opponent';
  const won = matchResult.winner === 'left';
  const upperUrl = getUpperUrl(challenger.id);
  const portraitStyle = upperUrl ? `background-image:url('${upperUrl}')` : 'background:#2a1a14';
  const cOvr = challenger.pw
    ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5)
    : '?';

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
  const headerTitle = won ? '相手の反応' : '相手の勝利宣言';
  const reporterLine = won
    ? `${orgName}勢は苛立ちを隠せない表情です`
    : `${orgName}勢は勝利を確信しています`;
  const observationText = won
    ? `${orgName}との<span class="marker danger">遺恨</span>は、まだ終わっていない`
    : `${orgName}の<span class="marker danger">挑発</span>に、どう応えるか——`;

  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay war-ace-overlay';
  overlay.innerHTML = `
    <div class="war-ace-modal pb-container">
      <div class="mdl-a-header danger">
        <div class="mdl-a-header-title">${headerTitle}</div>
        <div class="mdl-a-header-meta">OPPONENT AFTERMATH</div>
      </div>
      ${_mdlAReporterStrip(G, reporterLine)}
      <div class="mdl-a-subject-stage defeat" style="padding-top:96px">
        <div class="mdl-a-portrait-wrap">
          <div class="mdl-a-speech-pending">…</div>
          <div class="mdl-a-speech ${speechVariant} delayed">
            <div class="mdl-a-speech-speaker">${(challenger.name || '???').toUpperCase()}</div>
            <div class="mdl-a-speech-text">${challengerLine}</div>
          </div>
          <div class="mdl-a-subject-portrait defeat" style="${portraitStyle}"></div>
          <div class="mdl-a-portrait-vignette"></div>
        </div>
        <div style="margin-top:12px"><div class="mdl-a-defeat-badge">${won ? 'DEFEATED' : 'VICTOR'}</div></div>
        <div class="mdl-a-subject-name" style="color:rgba(232,220,200,0.85)">${challenger.name || '???'}</div>
        <div class="mdl-a-subject-org" style="color:rgba(200,180,150,0.7)">${orgName} ・ OVR ${cOvr}</div>
        <div class="mdl-a-observation" style="color:rgba(232,220,200,0.8);font-size:13px;margin-top:16px">
          ${observationText}
        </div>
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="war-victory-close war-ace-close" type="button">閉じる</button>
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

// ── Common-1 派閥内対決 試合後結果モーダル ──────────────────────────────────
// payload: COMMON_1 イベント payload
// matchResult: Engine.battle.simulateMatch の戻り値
// fA, fB: 試合に出場した 2 選手 (左/右)
// applyResult: Engine.factions.applyCommon1MatchResult の戻り値（resultText, impactSummary, winnerId, loserId, winnerName, loserName）
function _renderCommon1MatchResult(payload, matchResult, fA, fB, applyResult, onClose) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  if (!overlay || !box) { if (onClose) onClose(); return; }

  const factionName = payload.factionName || '派閥';
  const archetypeId = payload.archetypeId || null;
  const won = matchResult.winner === 'left';
  const isDraw = matchResult.winner === 'draw';
  const winChar = isDraw ? null : (won ? fA : fB);
  const loseChar = isDraw ? null : (won ? fB : fA);
  const isLeaderA = payload.leaderId === fA.id;
  const factionTagA = isLeaderA ? `${factionName} · リーダー` : factionName;
  const factionTagB = !isLeaderA && payload.leaderId === fB.id ? `${factionName} · リーダー` : factionName;

  // セリフ: 既存 COMMON1_LINES.resultLeader / resultLoser を引く
  const winnerVars = { factionName, aName: fA.name, bName: fB.name };
  let winnerLine = '';
  let loserLine = '';
  if (!isDraw && winChar && loseChar) {
    if (Engine.factions.getCommon1Line) {
      winnerLine = Engine.factions.getCommon1Line('resultLeader', { archetypeId, choice: 'A', vars: winnerVars, fighter: winChar }) || '';
      loserLine  = Engine.factions.getCommon1Line('resultLoser',  { archetypeId, choice: 'A', vars: winnerVars, fighter: loseChar }) || '';
    }
  }

  const ovrA = Math.round(Engine.util.ov(fA)), ovrB = Math.round(Engine.util.ov(fB));
  const finText = (typeof Engine.formatFinish === 'function')
    ? Engine.formatFinish(matchResult.finType, matchResult.finMove)
    : `${matchResult.finMove || ''} → ${matchResult.finType || ''}`;

  // 影響行を方向で色分け
  const impactRows = (applyResult.impactSummary || []).map(item => {
    const rawLabel = String(item.label || '');
    const isOrgTrust = /\btrust\b|信頼度/.test(rawLabel);
    const label = rawLabel.replace(/\btrust\b/g, '社長への反応').replace(/\brivalry\b/g, '因縁');
    let cls = '';
    const deltaStr = item.delta != null ? String(item.delta) : '';
    if (deltaStr.startsWith('+')) cls = 'pos';
    else if (deltaStr.startsWith('-')) cls = label.includes('因縁') ? 'resolved' : 'neg';
    const display = isOrgTrust
      ? (deltaStr.startsWith('+') ? '納得した様子' : deltaStr.startsWith('-') || deltaStr.startsWith('−') ? '不満を残した様子' : '態度に変化')
      : (label.includes('因縁') && deltaStr.startsWith('-') ? `${deltaStr}(解消)` : deltaStr);
    return `<div class="c1r-impact-row"><span>${escHtml(label)}</span><span class="${cls}">${escHtml(display)}</span></div>`;
  }).join('');

  const escHtmlSafe = (s) => (typeof escHtml === 'function') ? escHtml(s) : String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  // バナー右側
  const weekLabel = `S${G.season} · W${G.week}`;

  // U1: 試合結果表示は.emr-*(1試合結果ポップアップ)と同じ配置バランスに揃える(共通ヘルパー流用)。
  // 派閥内対決=自団体内の試合なのでcrossOrgは常にfalse(団体バッジは出さない)。
  const winnerSideForEmr = isDraw ? 'draw' : (won ? 'left' : 'right');
  const bubbleFor = (f) => {
    const line = isDraw ? '' : (f === winChar ? winnerLine : (f === loseChar ? loserLine : ''));
    return line ? `<div class="emr-bubble"><span class="emr-bubble-line">「${escHtmlSafe(line)}」</span></div>` : '';
  };
  const bout = `<div class="emr-bout">
      ${_emrSingleSide(fA, 'left', winnerSideForEmr, factionTagA, 'OVR', ovrA, bubbleFor(fA), false, { profileContext: 'roster' })}
      <div class="emr-center">
        <div class="emr-winner">${isDraw ? 'NO CONTEST' : 'WIN'}</div>
        <div class="emr-finish">${escHtmlSafe(finText)}</div>
        <div class="emr-turn">${matchResult.turns || 0} TURN</div>
        <div class="emr-mq">MQ <b>${matchResult.mq || 0}</b></div>
      </div>
      ${_emrSingleSide(fB, 'right', winnerSideForEmr, factionTagB, 'OVR', ovrB, bubbleFor(fB), false, { profileContext: 'roster' })}
    </div>`;

  const hpA = matchResult.hpLeft  || { final: 0, max: 100 };
  const hpB = matchResult.hpRight || { final: 0, max: 100 };
  const pctA = Math.max(0, Math.min(100, Math.round((hpA.final / Math.max(1, hpA.max)) * 100)));
  const pctB = Math.max(0, Math.min(100, Math.round((hpB.final / Math.max(1, hpB.max)) * 100)));
  const hpBlock = `<div class="emr-hp">
      <div class="emr-hp-half"><span class="emr-hp-val">${hpA.final} / ${hpA.max}</span><div class="emr-hp-track"><div class="emr-hp-fill" style="width:${pctA}%"></div></div></div>
      <span class="emr-hp-label">HP REMAINING</span>
      <div class="emr-hp-half is-right"><span class="emr-hp-val">${hpB.final} / ${hpB.max}</span><div class="emr-hp-track"><div class="emr-hp-fill" style="width:${pctB}%"></div></div></div>
    </div>`;

  const html = `
    <div class="c1r-card">
      <div class="c1r-banner">
        <div class="c1r-title">⚔ 派閥内対決 — 結果</div>
        <div class="c1r-meta">${escHtmlSafe(weekLabel)} · ${escHtmlSafe(factionName)}</div>
      </div>
      ${bout}
      ${hpBlock}
      <div class="c1r-narr">${escHtmlSafe(applyResult.resultText || '')}</div>
      ${impactRows ? `<div class="c1r-impact"><div class="c1r-impact-h">影響</div>${impactRows}</div>` : ''}
      <div class="c1r-actions">
        <button class="c1r-btn" id="c1rCloseBtn">閉じる ✓</button>
      </div>
    </div>
  `;
  box.innerHTML = html;
  overlay.classList.add('active');
  const btn = document.getElementById('c1rCloseBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (typeof Audio !== 'undefined' && Audio.play) Audio.play('click');
      overlay.classList.remove('active');
      if (onClose) onClose();
    });
  }
}

// ── Common-1 派閥内対決 試合プレビュー画面 ──────────────────────────────────
function _renderCommon1MatchPreview(payload, fA, fB) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const factionName = payload.factionName || '派閥';
  const aColor = '#d4a843';
  const bColor = '#c97a4a';
  const aLight = _lightenColor(aColor);
  const bLight = _lightenColor(bColor);
  const ovrL = Engine.util.ov(fA), ovrR = Engine.util.ov(fB);
  const standL = getStandUrl(fA.id, ovrL), standR = getStandUrl(fB.id, ovrR);

  let html = `<div style="text-align:center;padding:8px 0 4px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:6px;color:#aaa">Faction Internal Match</div>
    <div style="font-size:20px;font-weight:700;letter-spacing:4px;color:#e8e0d0">⚔️ 派閥内対決</div>
    <div style="font-size:12px;color:var(--text-sub);margin-top:4px">${factionName} ・ ビッグマッチ規格で行う</div>
  </div>`;

  html += `<div class="mc-va">
    <div class="mc-fc left">
      <div class="mc-fi">
        <div class="mc-fn">${fA.name}</div>
        <div class="mc-fo" style="color:${aLight}">${factionName}</div>
        <div class="mc-fol">OVR</div>
        <div class="mc-fov" style="background:linear-gradient(180deg,${aLight},${aColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrL}</div>
      </div>
      <div class="mc-fp">${standL ? `<img src="${standL}" alt="" onerror="this.style.display='none'">` : ''}</div>
    </div>
    <div class="mc-vsf">
      <div class="mc-vst" style="background:linear-gradient(180deg,#fff,#aaa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(200,190,170,0.15))">VS</div>
    </div>
    <div class="mc-fc right">
      <div class="mc-fp">${standR ? `<img src="${standR}" alt="" onerror="this.style.display='none'">` : ''}</div>
      <div class="mc-fi">
        <div class="mc-fn">${fB.name}</div>
        <div class="mc-fo" style="color:${bLight}">${factionName}</div>
        <div class="mc-fol">OVR</div>
        <div class="mc-fov" style="background:linear-gradient(180deg,${bLight},${bColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrR}</div>
      </div>
    </div>
  </div>`;

  html += `<div class="mc-stats">`;
  html += _warStatRow('PW', fA.pw||0, fB.pw||0, 'pw', aLight, bLight);
  html += _warStatRow('SP', fA.sp||0, fB.sp||0, 'sp', aLight, bLight);
  html += _warStatRow('TE', fA.te||0, fB.te||0, 'te', aLight, bLight);
  html += _warStatRow('ST', fA.st||0, fB.st||0, 'st', aLight, bLight);
  html += _warStatRow('MN', fA.mn||0, fB.mn||0, 'mn', aLight, bLight);

  const pTraits = (fA.traits || []).slice(0, 3);
  const cTraits = (fB.traits || []).slice(0, 3);
  if (pTraits.length || cTraits.length) {
    html += `<div class="mc-traits" style="padding-left:0;padding-right:0;margin-top:4px">
      <div class="mc-ts left">${pTraits.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
      <div class="mc-tdiv"></div>
      <div class="mc-ts right">${cTraits.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
    </div>`;
  }
  html += `</div>`;

  html += `<div class="mc-act">
    <button class="mc-bw" style="border:2px solid ${aColor};background:linear-gradient(135deg,${_rgba(aColor,0.15)},${_rgba(aColor,0.03)})" onclick="App.common1WatchMatch()">🎬 試合を観る</button>
    <button class="mc-bs" onclick="App.common1SkipMatch()">≫ スキップ</button>
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

  // verdict(U5: LOSEの文字は使わない。敗者はポートレートのグレースケール[.pb-fighter.is-loser]で示す。
  // _renderB2MatchResultと同じ「常に勝者名を立てる」パターンに揃える)
  let verdictLabel, verdictColor;
  if (draw) { verdictLabel = '⚖ NO CONTEST'; verdictColor = 'var(--c-warning)'; }
  else { verdictLabel = `🏆 ${escHtml(winChar.name)}`; verdictColor = 'var(--gold)'; }

  let winnerLabel;
  if (draw) winnerLabel = 'NO CONTEST';
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
    <button type="button" class="pb-close-btn" onclick="App.closeB3Result()">${draw ? '了解' : '次へ'}</button>
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
  if (draw) { verdictLabel = '⚖ NO CONTEST'; verdictColor = 'var(--c-warning)'; }
  else { verdictLabel = `🏆 ${escHtml(winChar.name)}`; verdictColor = 'var(--gold)'; }

  let winnerLabel;
  if (draw) winnerLabel = 'NO CONTEST';
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
    html += `<div class="pb-b2-resolution-row"><span class="icon" style="color:var(--c-positive)">✅</span><span><b>${escHtml(winChar.name)}</b>：社長の裁定に納得し、気持ちにも張りが戻った</span></div>`;
    html += `<div class="pb-b2-resolution-row"><span class="icon" style="color:var(--c-negative)">❌</span><span><b>${escHtml(loseChar.name)}</b>：${intensePenalty ? '社長の裁定に強い不満とわだかまりを残した' : '少し不満そうだが、気持ちは立て直している'}</span></div>`;
  } else {
    html += `<div class="pb-b2-resolution-row"><span class="icon">🤝</span><span><b>${escHtml(f1.name)}</b>：互いに力を認め合い、表情が和らいだ</span></div>`;
    html += `<div class="pb-b2-resolution-row"><span class="icon">🤝</span><span><b>${escHtml(f2.name)}</b>：互いに力を認め合い、表情が和らいだ</span></div>`;
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
        available = available.filter(f => (f.age || 17) <= 20);
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
      fan: '選手が団体への愛着を深めます',
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
      const face = portraitImg(f.id, 40, '', 'roster');
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
    const face = portraitImg(f.id, 40, '', 'roster');
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

  _mdlDOpen(`
    ${portraitsHtml}
    ${textHtml}
    ${detailHtml}
    ${dialogueHtml}
    <div class="mdl-d-actions">
      <button class="mdl-d-btn primary" onclick="_mdlDClose();clearTimeout(window._notifModalTimer);_drainPopupQueue()">OK</button>
    </div>
  `, isWarning ? 'urgent' : '');
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
  _markRivalryMatchDialoguesSeen(dialogues);
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

  // U3グループB(2人が対置する画面)の共通コンポーネントで描く。_renderRivalryPopup と同じ外枠。
  // セリフは頭上の吹き出しに入れ、名前は画像の下（吹き出しの中に名前は書かない）。
  // 番狂わせは「宿命がひっくり返った」瞬間なので tone-fate、順当な決着は tone-confront。
  // (verdict 用のトーンは .notif-modal-box.verdict.tone-* に定義があるものだけ使う)
  box.className = `notif-modal-box verdict u3b-theme-dark ${d.isUpset ? 'tone-fate' : 'tone-confront'}`;
  box.innerHTML = `
    <div class="vd-head">
      <div class="vd-title">${d.isUpset ? '番 狂 わ せ' : '因 縁 の 一 戦'}</div>
      <div class="vd-sub">${escHtml(d.matchLabel || '')} ・ ${rb.emoji || '🔥'}${escHtml(rb.label || '因縁')}</div>
    </div>
    <div class="vd-stage">
      ${_rivalryCol(d.winnerId, d.winnerName, d.winLine, true)}
      <div class="vd-vs">
        <div class="vd-vs-line"></div>
        <div class="vd-vs-icon">${d.isUpset ? '⚡' : '🔥'}</div>
        <div class="vd-vs-label">${d.isUpset ? '下 剋 上' : '試 合 結 果'}</div>
        <div class="vd-vs-line"></div>
      </div>
      ${_rivalryCol(d.loserId, d.loserName, d.loseLine, false)}
    </div>
    <div class="vd-foot"><button class="vd-btn" onclick="closeMatchDialogue()">— 見 届 け る —</button></div>
  `;
  overlay.classList.add('active');
  if (typeof Audio !== 'undefined' && Audio.play) Audio.play(d.isUpset ? 'rivalry_resolution' : 'event');
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
// Glimpse Cascade: 興行後に複数の Tier1 Glimpse を1枚のオーバーレイに集約し、
// 「ポンポンポン」と順次降ってくる演出にまとめる(2件以上のとき)。
// 1件のみのときは showGlimpseAModal にフォールバックする。
// ─────────────────────────────────────────────────────────────────────────────
const GLIMPSE_CASCADE_MIN = 2;
const GLIMPSE_CASCADE_DELAY_MS = 260;

let _glimpseCascadeAudioCtx = null;
function _gcAudioCtx() {
  try {
    if (!_glimpseCascadeAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      _glimpseCascadeAudioCtx = new Ctx();
    }
    if (_glimpseCascadeAudioCtx.state === 'suspended') {
      _glimpseCascadeAudioCtx.resume().catch(() => {});
    }
    return _glimpseCascadeAudioCtx;
  } catch (e) { return null; }
}
function _gcSePop(pitchSemi) {
  const ctx = _gcAudioCtx();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime;
    const baseFreq = 740 * Math.pow(2, (pitchSemi || 0) / 12);
    [{ mult: 1, type: 'sine', gain: 0.28 }, { mult: 1.5, type: 'triangle', gain: 0.09 }].forEach(({ mult, type, gain }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(baseFreq * mult, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
    });
  } catch (e) {}
}

function _glimpseToneClass(g) {
  if (g.tone === 'gold') return 'tone-good';
  if (g.axis === 'rivalry' || g.tone === 'danger' || g.tone === 'warning') return 'tone-rival';
  if (g.tone === 'negative') return 'tone-broken';
  return 'tone-bond';
}
function _glimpseEmoIcon(g) {
  if (g.tone === 'gold') return '★';
  if (g.axis === 'rivalry') return '⚡';
  if (g.tone === 'negative') return '💔';
  return '♥';
}

/** Glimpse Cascade カード内、アッパー画像+感情バッジ(対象側のみ)のHTML。
 *  U3グループD統一(2026-07-26): _u3bSideHtml の imgHtml に差し込む。画像が無い場合は
 *  既存の .u3b-upper-fallback(頭文字)を再利用する。 */
function _gcAvatarImgHtml(charId, name, badgeEmoji) {
  const url = (typeof getUpperUrl === 'function') ? getUpperUrl(charId) : '';
  const inner = url
    ? `<img src="${escHtml(url)}" alt="" onerror="this.style.display='none'">`
    : `<div class="u3b-upper-fallback">${escHtml((name || '?').charAt(0))}</div>`;
  const badge = badgeEmoji ? `<span class="gc-emo-badge">${escHtml(badgeEmoji)}</span>` : '';
  return `<span class="gc-upper-inner">${inner}${badge}</span>`;
}

/** U3グループD統一(2026-07-26): 丸96pxアバターは梯子のS(108×162)アッパー画像へ移行
 *  (mockup-baseline-v0.1 §2案2)。顔出しブロックは _u3bSideHtml(.u3b-*)へ移行。
 *  構造は「発言者→対象の2人1組(対象の右下に感情アイコン)」。単独版(targetなし)も対応。 */
function _renderGlimpseCardHtml(g) {
  const toneCls = _glimpseToneClass(g);
  const emo = _glimpseEmoIcon(g);
  const dialogue = g.dialogue ? `「${g.dialogue}」` : (g.label || '');
  const label = g.label || '';
  const tagHtml = label ? `<div class="gc-tag">${escHtml(label)}</div>` : '';

  if (g.targetId) {
    return `<div class="gc-card ${toneCls} u3b-theme-stage">
      <div class="gc-duo">
        ${_u3bSideHtml({
          name: g.speakerName, line: dialogue, size: 's',
          imgHtml: _gcAvatarImgHtml(g.speakerId, g.speakerName),
        })}
        <div class="gc-duo-arrow">➜</div>
        ${_u3bSideHtml({
          name: g.targetName, size: 's',
          imgHtml: _gcAvatarImgHtml(g.targetId, g.targetName, emo),
        })}
      </div>
      ${tagHtml}
    </div>`;
  }
  // 単独 Glimpse(target なし): 1人が語る
  return `<div class="gc-card ${toneCls} u3b-theme-stage">
    ${_u3bSideHtml({
      name: g.speakerName, line: dialogue, size: 's',
      imgHtml: _gcAvatarImgHtml(g.speakerId, g.speakerName),
    })}
    ${tagHtml}
  </div>`;
}

function showGlimpseCascade(glimpses, opts) {
  if (!glimpses || glimpses.length === 0) return;
  // 1件のみは既存の単発ポップアップにフォールバック(連打感のない演出は冗長)
  if (glimpses.length < GLIMPSE_CASCADE_MIN) {
    showGlimpseAModal(glimpses[0], opts);
    return;
  }
  _enqueuePopup(
    () => _renderGlimpseCascade(glimpses),
    opts && opts.allowWhileShowResult ? { ignoreShowResultOverlay: true } : undefined
  );
}

function _renderGlimpseCascade(glimpses) {
  const overlay = document.getElementById('glimpseCascadeOverlay');
  const box = document.getElementById('glimpseCascadeBox');
  if (!overlay || !box) return;

  const cardsHtml = glimpses.map(_renderGlimpseCardHtml).join('');
  box.innerHTML = `
    <button class="glimpse-cascade-skip" onclick="closeGlimpseCascade()">スキップ ›</button>
    <div class="glimpse-cascade-title">SHOW AFTERMATH</div>
    <div class="glimpse-cascade-heading">興行のあとで…</div>
    <div class="glimpse-cascade-cards" id="glimpseCascadeCards">${cardsHtml}</div>
    <button class="glimpse-cascade-done" id="glimpseCascadeDone" onclick="closeGlimpseCascade()">見届ける</button>
  `;
  overlay.classList.add('active');

  const cards = box.querySelectorAll('.gc-card');
  const doneBtn = box.querySelector('#glimpseCascadeDone');
  cards.forEach((c, i) => {
    setTimeout(() => {
      c.classList.add('in');
      _gcSePop(i * 2);
    }, i * GLIMPSE_CASCADE_DELAY_MS);
  });
  setTimeout(() => {
    if (doneBtn) doneBtn.classList.add('show');
  }, cards.length * GLIMPSE_CASCADE_DELAY_MS + 300);

  clearTimeout(window._glimpseCascadeTimer);
  window._glimpseCascadeTimer = setTimeout(closeGlimpseCascade, 90000);
}

function closeGlimpseCascade() {
  const overlay = document.getElementById('glimpseCascadeOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(window._glimpseCascadeTimer);
  _drainPopupQueue();
}

// ─────────────────────────────────────────────────────────────────────────────
// U3グループD統一(2026-07-26): 旧「Tier 2: バナーログフィードUI」(「今週の声」アイコン+
// ローテーション吹き出し+一覧パネル)はKeisuke決定で機能ごと廃止。refreshDojoLogFeed /
// _showLogFeedBubble / _renderLogFeedPanel / toggleLogFeedPanel と、ローテーション用の
// _logFeedRotationTimer / _logFeedCurrentIndex を削除(呼び出し元は app.js 4箇所・
// ui-render.js 1箇所を確認しすべて除去済み)。G.weekLogFeed のデータ自体は残し、
// 道場バナーの「休憩中の選手」(_renderRosterDojoHeader 内 _isDojoRestEligibleGlimpse)の
// 素材として使う。
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
      Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_s03_v01.ogg', { loop: false, volume: 0.10 });
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
  let _leClosing = false;
  document.getElementById('leCloseBtn').addEventListener('click', () => {
    if (_leClosing) return;
    _leClosing = true;
    if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.fadeOut(1500);
    overlay.style.transition = 'opacity .6s';
    overlay.style.opacity = '0';
    // オーバーレイが不透明なうちに背景を正しい画面へ差し替える。
    // フェード完了を待つと、透けて見える間だけ演出前の古い画面が一瞬映ってしまう。
    if (onDone) onDone();
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      overlay.style.opacity = '';
      overlay.style.transition = '';
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
  const ALL_C_ENDING = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES : [];
  const coaches = (data.coaches || [])
    .map(c => (typeof c === 'string') ? c : (c && c.id))
    .filter(id => ALL_C_ENDING.some(x => x.id === id))
    .slice(0, 3);
  if (coaches.length > 0) {
    const cLines = _pickLines(coachLinesPool, coaches.length);
    const cHtml = coaches.map((id, i) => {
      const master = ALL_C_ENDING.find(x => x.id === id);
      return `<div style="flex:1;text-align:center;min-width:0;max-width:180px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${_endingPortrait(id, 100, true)}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">${master.name || '—'}</div>
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
  // 表彰式と同じオーバーレイを使い回すため、部名が残っていたら消す
  const _hSec = document.getElementById('aw-header-section');
  if (_hSec) _hSec.textContent = '';
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
      // WM-H04 エンディング
      // WM-H04 エンディング。音量はミキサー実聴値（2026-07-27）
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) { Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_h04_v01.ogg', { loop: true, volume: 0.45 }); } } catch(e) {}
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
  // WM-H06「ゲームオーバー(団体解散)」。8秒 One Shot・ループなし(台帳の仕様どおり)。
  // 冒頭に不穏な一撃が来る作りなので、他のBGM(0.13〜0.20)より強めの音量で置く。
  try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_h06_v01.ogg', { volume: 0.30 }); } catch(e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 解散セレモニー(5スライド) — bankruptcy-redesign-spec-v1.1.md §3
// showEndingCeremony と対称構造。トーンだけダーク反転。
// ─────────────────────────────────────────────────────────────────────────────
function showGameOverCeremony(data, onDone) {
  const fmt = n => (typeof n === 'number') ? n.toLocaleString() : (n ?? '—');

  function _gameoverPortrait(id, size, isCoach) {
    const h = Math.round(size * 1.5);
    let url = '';
    if (isCoach) {
      url = typeof getCoachUpperUrl === 'function' ? getCoachUpperUrl(id) : '';
      if (!url) url = typeof getCoachPortraitUrl === 'function' ? getCoachPortraitUrl(id) : '';
    } else {
      url = typeof getUpperUrl === 'function' ? getUpperUrl(id) : '';
    }
    if (url) {
      return `<div class="portrait-main" style="width:${size}px;height:${h}px;filter:grayscale(0.3) brightness(0.85)">
        <div class="portrait-glow" style="background:radial-gradient(circle,rgba(170,30,30,0.18) 0%,transparent 70%)"></div>
        <img src="${url}" alt="">
      </div>`;
    }
    return `<div class="portrait-main" style="width:${size}px;height:${h}px;font-size:${Math.round(size * 0.5)}px;background:#1a1010">👤</div>`;
  }

  const reason = data.gameOverReason || 'timeout';
  const reasonHeadline = reason === 'collapse' ? '【崩壊】'
                       : reason === 'season_end' ? '【シーズン終了】'
                       : '【活動停止】';

  const slideInfo = [];

  // スライド1: 解散告知 + 黒田コラム
  slideInfo.push({
    label: '解散の告知',
    html: `<div class="award-card" style="text-align:center;background:linear-gradient(180deg,#1a0808 0%,#100404 100%);border:1px solid #4a1a1a;color:#cdb8b8">
      <div class="award-badge" style="justify-content:center;color:#aa6666"><span class="badge-jp" style="color:#cca0a0">シーズン ${data.season}</span></div>
      <div style="font-size:42px;margin:8px 0;filter:grayscale(0.5)">💀</div>
      <div style="font-family:'Noto Serif JP',serif;font-size:24px;font-weight:900;letter-spacing:8px;color:#d8a8a8;
        text-shadow:0 0 24px rgba(170,30,30,0.3);margin-bottom:10px">解 散</div>
      <div style="font-size:13px;color:#a89898;line-height:1.9;margin:8px 0 16px">
        ${reasonHeadline}<br>「${data.orgName}」は活動停止を発表した。
      </div>
      <div style="border-top:1px solid #3a1818;margin:12px 0;padding-top:14px">
        <div style="font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2px;color:#cc8888;text-transform:uppercase;margin-bottom:8px">黒田 沙智子 編集記事</div>
        <p style="margin:0;font-size:12px;line-height:1.95;color:#c8b8b8;white-space:pre-wrap;text-align:left;max-width:520px;margin:0 auto">${data.kurodaColumn || ''}</p>
      </div>
    </div>`
  });

  // スライド2: 数字が示す現実
  slideInfo.push({
    label: '団体の足跡',
    html: `<div class="award-card" style="background:linear-gradient(180deg,#1a0808 0%,#100404 100%);border:1px solid #4a1a1a;color:#cdb8b8">
      <div class="award-badge" style="color:#aa6666"><span class="badge-icon">📜</span><span class="badge-jp" style="color:#cca0a0">${data.orgName}の足跡</span></div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(170,30,30,0.15);padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">活動期間</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${data.season} シーズン</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(170,30,30,0.15);padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">最高ランク</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${data.bestRank} 位</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(170,30,30,0.15);padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">最高資金</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${fmt(data.peakFunds)} 万</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(170,30,30,0.15);padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">最高団体人気</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${fmt(Math.round(data.peakOrgPop || 0))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(170,30,30,0.15);padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">興行回数</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${data.totalShows} 回</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(170,30,30,0.15);padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">ベストマッチ</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${data.bestMQMatch || '—'} (MQ ${data.bestMQ})</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0">
          <span style="font-size:12px;color:#988080;letter-spacing:1px">殿堂入り</span>
          <span style="font-size:14px;font-weight:700;color:#d8c8c8">${data.hallOfFameCount} 名</span>
        </div>
      </div>
    </div>`
  });

  // スライド3: 選手たちの解散セリフ
  const fighters = data.top3Fighters || [];
  const fighterLines = data.top3Lines || [];
  if (fighters.length > 0) {
    const fHtml = fighters.map((f, i) => {
      const ovrRaw = typeof Engine !== 'undefined' && Engine.util ? Engine.util.ov(f) : NaN;
      const ovr = isNaN(ovrRaw) ? (f.ovr || '—') : ovrRaw;
      const line = fighterLines[i] || '……';
      return `<div style="flex:1;text-align:center;min-width:0;max-width:160px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${_gameoverPortrait(f.id, 100)}</div>
        <div style="font-family:'Noto Serif JP',serif;font-size:13px;font-weight:700;color:#d8c8c8">${f.name}</div>
        <div style="font-size:10px;color:#887878;margin-top:2px">OVR ${ovr}</div>
        <div class="speech-bubble" style="margin-top:10px;background:rgba(40,16,16,0.6);border-color:#5a2020;color:#c8b8b8">
          <div class="speech-text" style="font-size:11px;color:#c8b8b8">「${line}」</div>
        </div>
      </div>`;
    }).join('');
    slideInfo.push({
      label: '選手たちの声',
      html: `<div class="award-card" style="text-align:center;background:linear-gradient(180deg,#1a0808 0%,#100404 100%);border:1px solid #4a1a1a">
        <div class="award-badge" style="justify-content:center;color:#aa6666"><span class="badge-icon">🎤</span><span class="badge-jp" style="color:#cca0a0">選手たちの声</span></div>
        <div style="display:flex;justify-content:center;gap:16px;margin:16px 0 8px">${fHtml}</div>
      </div>`
    });
  }

  // スライド4: スタッフの声（コーチがいる場合のみ）
  const ALL_C_GO = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES : [];
  const coaches = (data.coaches || [])
    .map(c => (typeof c === 'string') ? c : (c && c.id))
    .filter(id => ALL_C_GO.some(x => x.id === id))
    .slice(0, 3);
  const coachLines = data.coachLines || [];
  if (coaches.length > 0) {
    const cHtml = coaches.map((id, i) => {
      const master = ALL_C_GO.find(x => x.id === id);
      return `<div style="flex:1;text-align:center;min-width:0;max-width:180px">
        <div style="display:flex;justify-content:center;margin-bottom:8px">${_gameoverPortrait(id, 100, true)}</div>
        <div style="font-size:12px;font-weight:700;color:#d8c8c8">${master.name || '—'}</div>
        <div class="speech-bubble" style="margin-top:10px;background:rgba(40,16,16,0.6);border-color:#5a2020;color:#c8b8b8">
          <div class="speech-text" style="font-size:11px;color:#c8b8b8">「${coachLines[i] || '……'}」</div>
        </div>
      </div>`;
    }).join('');
    slideInfo.push({
      label: 'スタッフの声',
      html: `<div class="award-card" style="text-align:center;background:linear-gradient(180deg,#1a0808 0%,#100404 100%);border:1px solid #4a1a1a">
        <div class="award-badge" style="justify-content:center;color:#aa6666"><span class="badge-icon">🎓</span><span class="badge-jp" style="color:#cca0a0">スタッフの声</span></div>
        <div style="display:flex;justify-content:center;gap:20px;margin:16px 0 8px">${cHtml}</div>
      </div>`
    });
  }

  // スライド5: 締めくくり
  slideInfo.push({
    label: 'THE END',
    html: `<div class="award-card" style="text-align:center;background:linear-gradient(180deg,#0a0303 0%,#000000 100%);border:1px solid #3a1414;color:#bba8a8">
      <div style="font-size:44px;margin:8px 0 16px;filter:grayscale(0.6)">🥀</div>
      <div style="font-family:'Noto Serif JP',serif;font-size:24px;font-weight:900;letter-spacing:6px;color:#c8b0b0;
        text-shadow:0 0 20px rgba(170,30,30,0.25);margin-bottom:18px">THE END</div>
      <div style="font-size:14px;color:#a89898;line-height:2.0">
        「${data.orgName}」の物語は、ここで終わる。<br><br>
        だが選手たちの戦いは続く——<br>どこか別の団体の下で。
      </div>
    </div>`
  });

  // ── DOM構築（showEndingCeremony と同パターン） ──
  const overlay = document.getElementById('awardsOverlay');
  const slideWrap = document.getElementById('aw-slide-wrap');
  const headerLabel = document.getElementById('aw-header-award-name');
  // 表彰式と同じオーバーレイを使い回すため、部名が残っていたら消す
  const _hSecGO = document.getElementById('aw-header-section');
  if (_hSecGO) _hSecGO.textContent = '';
  const dotsEl = document.getElementById('aw-slide-dots');
  const btnNext = document.getElementById('aw-btn-next');
  const fanfareEl = document.getElementById('aw-fanfare-overlay');
  const coachFg = document.getElementById('hof-coach-fg');
  if (!overlay || !slideWrap || !btnNext) {
    // フォールバック: 旧 showGameOverScreen 経路
    if (typeof showGameOverScreen === 'function') showGameOverScreen(data);
    if (onDone) onDone();
    return;
  }

  slideWrap.innerHTML = '';
  slideInfo.forEach((si, i) => {
    const div = document.createElement('div');
    div.className = 'aw-slide' + (i === 0 ? ' active' : '');
    div.id = 'aw-gameover-slide-' + i;
    div.innerHTML = si.html;
    slideWrap.appendChild(div);
  });

  if (dotsEl) dotsEl.innerHTML = '';
  if (coachFg) { coachFg.innerHTML = ''; coachFg.classList.remove('revealed'); }

  if (fanfareEl) {
    fanfareEl.innerHTML = `
      <div class="fanfare-line-1" style="color:#c8a0a0">シーズン ${data.season}</div>
      <div class="fanfare-line-2" style="color:#d8a0a0;text-shadow:0 0 20px rgba(170,30,30,0.4)">解散</div>
      <div class="fanfare-divider"></div>
      <div class="fanfare-sub" style="color:#aa6666">💀 活動停止</div>`;
    fanfareEl.style.animation = 'none';
    requestAnimationFrame(() => { fanfareEl.style.animation = ''; });
  }

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
    btnNext.textContent = current === TOTAL - 1 ? 'タイトルへ ▶' : '次へ　→';
    setTimeout(() => { try { _awPlaySE && _awPlaySE('normal'); } catch(e) {} }, 50);
  }

  function nextSlide() {
    if (!bgmStarted) {
      // WM-H06。**ループしない**(台帳の仕様: 8秒 One Shot)。冒頭の一撃が鳴り切ったあとは無音のまま
      // スライドを送らせる。「積み上げたものが一瞬で消える」瞬間なので、鳴り続けないほうが効く。
      try { if (typeof Audio !== 'undefined' && Audio.fileBgm) { Audio.fileBgm.play('../bgm/production-ogg/wm_bgm_h06_v01.ogg', { volume: 0.30 }); } } catch(e) {}
      bgmStarted = true;
    }
    if (current >= TOTAL - 1) {
      overlay.classList.remove('active');
      try { _awClearParticles && _awClearParticles(); } catch(e) {}
      window._awardsNext = null;
      btnNext.onclick = null;
      const doClose = () => {
        if (onDone) onDone();
        else if (typeof App !== 'undefined' && typeof App.showTitleScreen === 'function') App.showTitleScreen();
      };
      try {
        if (typeof Audio !== 'undefined' && Audio.fileBgm) {
          Audio.fileBgm.fadeOut(2000).then(doClose);
          return;
        }
      } catch(e) {}
      doClose();
      return;
    }
    goToSlide(current + 1);
  }

  window._awardsNext = nextSlide;
  btnNext.onclick = nextSlide;

  headerLabel.textContent = 'シーズン ' + data.season + ' — ' + slideInfo[0].label;
  btnNext.textContent = '次へ　→';
  overlay.classList.add('active');
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
// U3グループA統一(2026-07-26)注記: 解雇面談(renderShachoshitsuReleaseInterview)だけを
// _u3bSideHtml(.u3b-*)へ移行したため、意匠の異なるこちら(契約更新交渉)は
// .negotiation-* とのクラス名衝突を避けて .negc-* に改名した(見た目・挙動は変更なし)。
function _negSpeakerHtml(neg, dialogue, badgeCls, badgeLabel) {
  // 顔と名前から選手詳細を開けるようにする(2026-07-27 Keisuke)。
  // 交渉相手の成績・能力を確かめないまま判断することになっていたため。
  const face = portraitImg(neg.fighterId, 96, 'negc-speaker-portrait', 'roster');
  return `
    <div class="negc-speaker">
      ${face}
      <div class="negc-bubble">
        <strong style="font-size:12px;color:rgba(255,255,255,0.55);cursor:pointer;text-decoration:underline dotted rgba(255,255,255,0.3);text-underline-offset:3px"
          onclick="event.stopPropagation();showFighterPopup(${neg.fighterId},'roster',true)">${neg.fighterName}</strong>
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
    // 顔と名前から選手詳細を開ける(2026-07-27 Keisuke)
    return `<div class="neg-card-face-item">
      <div style="border-radius:10px;overflow:hidden">${portraitImg(n.fighterId, 64, '', 'roster')}</div>
      <span style="font-size:11px;color:#2a2318;cursor:pointer;text-decoration:underline dotted rgba(42,35,24,0.35);text-underline-offset:3px"
        onclick="event.stopPropagation();showFighterPopup(${n.fighterId},'roster',true)">${n.fighterName}</span>
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
  const retentionRaise = isTransfer && fighter
    ? Engine.contract.calcRetentionRaiseAmount(neg, fighter, state)
    : 0;
  const retentionTerms = `一時金${neg.retentionBonus}万 + 給与+${retentionRaise}万/週`;

  // 選択肢の構築
  let choices;
  if (neg.attitude === 'raise') {
    choices = [
      { label: '昇給を受ける', hint: `本人は強く報われたと感じる　給与+${neg.raiseAmount}万/週`, idx: 0 },
      { label: '交渉する',     hint: `成功時　給与+${neg.counterOffer}万/週`, idx: 1 },
      { label: '拒否する',     hint: '本人に強い不満が残るおそれ', idx: 2 },
    ];
  } else {
    choices = [
      { label: '引き留める', hint: retentionTerms, idx: 0,
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
      引き留め条件: ${retentionTerms}
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
  const fighter = (state.roster || []).find(f => f.id === neg.fighterId);
  const retentionRaise = fighter ? Engine.contract.calcRetentionRaiseAmount(neg, fighter, state) : 0;
  const retentionTerms = `一時金${neg.retentionBonus}万 + 給与+${retentionRaise}万/週`;
  const wallHtml = _negSpeakerHtml(neg, listenText, 'neg-badge-transfer', '🚪 移籍志願');

  const deskHtml = `
    <div class="neg-card-title">📋 ${neg.fighterName}の話を聞く</div>
    <div class="neg-choices">
      <button class="neg-btn" data-sub="retain"${canAfford ? '' : ' disabled'}>
        <span>引き留める</span>
        <span class="neg-btn-hint">${retentionTerms}</span>
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
        ${portraitImg(r.fighterId, 40, '', 'contractResult')}
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
        ${portraitImg(r.fighterId, 40, '', 'contractResult')}
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
    Audio.play('confirm');
    if (onDone) onDone();
  });
}

// ══════════════════════════════════════════════════════════
//  U-20 ジュニアトーナメント UI  (V6 visual)
// ══════════════════════════════════════════════════════════

/** クライムライン共通ヘッダー(B案「エンブレム」様式、夏=--ev-summer) */
function _jtHeader() {
  const season = G.season;
  const bs = App._jtPreview?.result?.bracketSize || 8;
  return `<div class="jtc-header">
    <img class="jtc-header-emblem" src="../image/emblem-summer.png" alt="" onerror="this.style.display='none'">
    <div class="jtc-header-title">JUNIOR CUP</div>
    <div class="jtc-header-sub">ジュニアトーナメント — U-20</div>
    <div class="jtc-header-ed">第${season}回大会 / ${bs}名トーナメント</div>
  </div><div class="jtc-double-rule"></div><div class="jtc-climb-note">▲ Climb to the top — 勝ち上がるほど上へ</div>`;
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

  // コメント画面は縦長の .u3b-upper を使う。正方形の顔アイコンを入れると
  // 背景ごと引き伸ばされて枠と噛み合わないため、他の試合画面と同じアッパー画像を使う。
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
  const resultLabel = timing === 'champion' ? '優勝' : timing === 'postWin' ? '入賞' : '敗退';
  const resultColor = timing === 'champion' ? 'var(--gold)' : timing === 'postWin' ? 'var(--c-positive)' : 'var(--text-sub)';
  const ovr = (typeof Engine !== 'undefined' && Engine.util && typeof Engine.util.ov === 'function')
    ? Engine.util.ov(f) : (f.ovr ?? '—');

  // U3グループA統一(2026-07-26): war-victory-line(_showWarVictoryChain)と同じ顔出しブロックへ移行
  // (mockup-baseline-v0.1)。旧#2ecc71(緑のハードコード)はvar(--c-positive)へトークン化。
  // 結果ラベル(優勝/入賞/敗退)は role スロットへ、色は resultColor をそのまま引き継ぐ
  const overlay = document.createElement('div');
  overlay.className = 'war-victory-overlay u3b-theme-stage is-junior';
  overlay.innerHTML = `
    <div class="war-victory-modal">
      <div class="jt-impression-kicker">JUNIOR CUP · TOURNAMENT NOTE</div>
      ${_u3bSideHtml({
        name: f.name, line, imgUrl: upperUrl,
        fallback: (f.name || '?').charAt(0), size: 'm', isLoser: timing === 'postLose',
        roleHtml: `<div class="u3b-role" style="color:${resultColor}">${escHtml(resultLabel)}</div>`,
        statLabel: 'OVR', statValue: ovr,
        bubbleClass: 'war-victory-line', portraitClass: 'war-victory-img',
      })}
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

// ===== CLIMBLINE BRACKET (P2b: jt-climbline-rework-inventory-v0.1) =====
// 下段=1回戦、勝ち進むほど上へ。開幕時は下段の枠のみ描画し、勝者確定のたびに
// 上段の枠がフェード+上昇で出現する。全ラウンドのデータは Engine.juniorTournament.run() で
// 事前に一括シミュレーション済みのため、ここでは「どこまで見せるか」を currentRound/currentMatch
// のポインタで制御するのみ（数値の再計算はしない）。
function _jtcRoundLabel(name) {
  return name === 'final' ? '決勝' : name === 'semiFinal' ? '準決勝' : name === 'quarterFinal' ? '準々決勝' : '1回戦';
}

function _jtcSizeClass(matchCount) {
  // 16名時の1回戦(8試合)だけは横幅内に収める xs。以降はsm(76px)に統一。
  // 決勝(jtc-final-row.jtc-size-lg=132px)・頂上(jtc-up-peak=150x225)との段差を際立たせるため、
  // 旧mdサイズ(112px)分岐は廃止(8名大会でも準々決勝→準決勝は同sizeでよく、決勝への跳躍幅こそが要)。
  return matchCount >= 8 ? 'xs' : 'sm';
}

/** アッパー画像フィッター(勝者=大会色リング/敗者=モノクロ落ち) */
function _jtcFx(f, isWin, isLose) {
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
  const cls = isWin ? 'w' : isLose ? 'l' : '';
  const img = upperUrl
    ? `<img src="${upperUrl}" alt="" onerror="this.style.display='none'">`
    : `<span class="jtc-ini">${escHtml((f.name || '?')[0])}</span>`;
  // U7 §2-C: ブラケットも顔が出ている以上、押せば選手詳細が開く
  const open = ` style="cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${Number(f.id)},'juniorTournament',true)"`;
  return `<div class="jtc-fx${isLose ? ' is-lose' : ''}"${open}>
    <div class="jtc-up ${cls}">${img}</div>
    <div class="jtc-fn">${escHtml(f.name)}${isWin ? ' <span class="jtc-win-tag">WIN</span>' : ''}</div>
  </div>`;
}

/** 決着時間 / MQ チップ */
function _jtcMinfo(match) {
  const t = typeof _npTurnsToTime === 'function' ? _npTurnsToTime(match.turns) : '';
  return `<div class="jtc-minfo">${t ? `<span class="t">${t}</span><span class="jtc-minfo-dot">/</span>` : ''}<span class="mq">MQ ${match.mq}</span></div>`;
}

/** 通常段(準々決勝/準決勝)の行。8名時は準々決勝(4試合)のみ縮小サイズになる */
function _jtcRowGrid(round, ri, cRd, cMi, isDone, riseClass) {
  const matches = round.matches;
  const sizeClass = _jtcSizeClass(matches.length);
  let cells = '';
  matches.forEach((m, mi) => {
    const fin = isDone(ri, mi);
    const cur = ri === cRd && mi === cMi;
    const lWin = fin && m.winnerId === m.left.id;
    const rWin = fin && m.winnerId === m.right.id;
    cells += `<div class="jtc-cell${cur ? ' is-current' : ''}">
      <div class="jtc-pair">${_jtcFx(m.left, lWin, fin && !lWin)}${_jtcFx(m.right, rWin, fin && !rWin)}</div>
      ${fin ? _jtcMinfo(m) : ''}
    </div>`;
  });
  return `<div class="jtc-tier-label">${_jtcRoundLabel(round.name)}</div>
  <div class="jtc-row jtc-size-${sizeClass}${riseClass}" style="grid-template-columns:repeat(${matches.length},1fr)">${cells}</div>`;
}

/** 決勝段(常に1試合、VS表記で大きく) */
function _jtcFinalRow(round, ri, cRd, cMi, isDone, riseClass) {
  const match = round.matches[0];
  const fin = isDone(ri, 0);
  const cur = ri === cRd && cMi === 0;
  const lWin = fin && match.winnerId === match.left.id;
  const rWin = fin && match.winnerId === match.right.id;
  return `<div class="jtc-tier-label">決勝</div>
  <div class="jtc-final-row jtc-size-lg${cur ? ' is-current' : ''}${riseClass}">
    ${_jtcFx(match.left, lWin, fin && !lWin)}
    <div class="jtc-vs">VS</div>
    ${_jtcFx(match.right, rWin, fin && !rWin)}
  </div>
  ${fin ? _jtcMinfo(match) : ''}`;
}

/** 合流線(山型)。子段(childCount試合)→親段(childCount/2試合)を CSS Grid の等分割で厳密に位置合わせする。
 * 親試合が決着済みかつその子の勝者==親の勝者のときだけ大会色に灯す(勝者ラインのみ点灯)。 */
function _jtcMergeGrid(childCount, hotFlags) {
  const half = childCount / 2;
  let cells = '';
  for (let j = 0; j < half; j++) {
    const hotL = !!hotFlags[j * 2];
    const hotR = !!hotFlags[j * 2 + 1];
    cells += `<div class="jtc-chev"><svg viewBox="0 0 100 30" preserveAspectRatio="none">
      <path class="${hotL ? 'hot' : ''}" d="M25 30 L25 16 L50 16 L50 2"/>
      <path class="${hotR ? 'hot' : ''}" d="M75 30 L75 16 L50 16 L50 2"/>
    </svg></div>`;
  }
  return `<div class="jtc-merge" style="grid-template-columns:repeat(${half},1fr)">${cells}</div>`;
}

/** 決勝→頂上の合流線(常に1本、常に大会色) */
function _jtcMergePeak() {
  return `<div class="jtc-merge-peak"><svg viewBox="0 0 20 30" preserveAspectRatio="none"><path class="hot" d="M10 30 L10 2"/></svg></div>`;
}

/** 同じ枠の出現アニメを再レンダーのたびに繰り返さないための一度きりフラグ */
function _jtcMarkRise(jt, key) {
  jt._jtcRevealed = jt._jtcRevealed || {};
  const isNew = !jt._jtcRevealed[key];
  jt._jtcRevealed[key] = true;
  return isNew ? ' jtc-rise' : '';
}

/** 頂上(王者)ブロック。決勝決着の瞬間にせり上がって出現し、タップで優勝発表画面へ(二段構え) */
function _jtcPeakBlock(jt, riseClass) {
  const champion = jt.result.champion;
  const season = G.season;
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(champion.id) : '';
  const img = upperUrl
    ? `<img src="${upperUrl}" alt="${escHtml(champion.name)}" onerror="this.style.display='none'">`
    : `<span class="jtc-ini">${escHtml((champion.name || '?')[0])}</span>`;
  return `<div class="jtc-peak${riseClass}" onclick="App.jtGoToFinalResult()">
    <div class="jtc-up jtc-up-peak w">${img}</div>
    <div class="jtc-peak-name">${escHtml(champion.name)}</div>
    <div class="jtc-peak-title">第${season}回大会ジュニアチャンピオン</div>
    <div class="jtc-peak-cta">表彰へ ▶</div>
    <div class="jtc-peak-auto-note">1.6秒で自動的に進みます(タップで即スキップ)</div>
  </div>`;
}

/** クライムライン本体(頂上〜決勝〜準決勝〜準々決勝)を currentRound/currentMatch まで構築する */
function _jtcClimbHtml(jt) {
  const { result, currentRound, currentMatch } = jt;
  const rounds = result.rounds;
  const finalRi = rounds.length - 1;
  const isMatchDone = (ri, mi) => ri < currentRound || (ri === currentRound && mi < currentMatch);
  const finalDone = isMatchDone(finalRi, 0);
  const maxVisibleRi = Math.min(currentRound, finalRi);

  let html = '';
  if (finalDone) {
    html += _jtcPeakBlock(jt, _jtcMarkRise(jt, 'peak'));
    html += _jtcMergePeak();
  }

  for (let ri = maxVisibleRi; ri >= 0; ri--) {
    const round = rounds[ri];
    const riseClass = _jtcMarkRise(jt, 'r' + ri);
    html += ri === finalRi
      ? _jtcFinalRow(round, ri, currentRound, currentMatch, isMatchDone, riseClass)
      : _jtcRowGrid(round, ri, currentRound, currentMatch, isMatchDone, riseClass);

    // 現在進行中の段なら、その直下にフォーカスカード(既存演出を無変更で流用)
    if (ri === currentRound && currentMatch < round.matches.length) {
      html += _jtFocusCard(round.matches[currentMatch], round.name, ri, currentMatch);
    }

    if (ri > 0) {
      const childRound = rounds[ri - 1];
      const hotFlags = childRound.matches.map((cm, cmi) => {
        const parentMi = Math.floor(cmi / 2);
        const parentMatch = round.matches[parentMi];
        return isMatchDone(ri, parentMi) && parentMatch.winnerId === cm.winnerId;
      });
      html += _jtcMergeGrid(childRound.matches.length, hotFlags);
    }
  }
  return html;
}

// ===== BRACKET (クライムライン型 / P2b) =====
function renderJuniorTournamentBracket() {
  const jt = App._jtPreview;
  if (!jt) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const { result, currentRound, currentMatch } = jt;

  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  let html = `<div class="jt-phase">対戦表</div>`;
  html += `<div class="jt-wrap" style="--jtc-color:var(--ev-summer);--jtc-color-rgb:var(--ev-summer-rgb)">${_jtHeader()}`;
  html += `<div class="jtc-climb">${_jtcClimbHtml(jt)}</div>`;

  // 全試合スキップボタン(進行中の試合がある間のみ表示。頂上せり上がり後はタップ操作に切替)
  const curRound = result.rounds[currentRound];
  if (curRound && currentMatch < curRound.matches.length) {
    html += `<div style="text-align:center;margin-top:12px">
      <button class="btn" style="padding:8px 24px;font-size:12px;opacity:0.6" onclick="App.jtSkipAll()">全試合スキップ →</button>
    </div>`;
  }
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** フォーカスカード（アッパー対面 + セリフ + ボタン） */
function _jtHpTone(pct) {
  return pct >= 70 ? 'is-healthy' : pct >= 40 ? 'is-warning' : 'is-danger';
}

function _jtCarryPct(f) {
  const raw = f && f.jtCarryHpPct != null ? f.jtCarryHpPct : 100;
  return Math.max(1, Math.min(100, Math.round(raw)));
}

function _jtStartHp(f, hp) {
  const pct = _jtCarryPct(f);
  const max = hp && hp.max ? hp.max : 100;
  return { final: Math.max(1, Math.round(max * pct / 100)), max, pct };
}

// ── mockup-jt-restyle-v0.1 tab2: JT/天頂戦 共通フォーカスカード部品 ──────────
// 呼び出し側の祖先(.jt-wrap)で --jtc-color/--jtc-color-rgb が設定済みであること
// (JT=--ev-summer/天頂戦=--gold)。_jtFocusCard(JT)・_tcFocusCard(天頂戦)の双方から利用する。

/** 自団体(自)ピル。JT/天頂戦 共通。--jtc-color未設定時は旧tc-own-pillと同じgold表示 */
function _jtcOwnPill(isOwn) {
  return isOwn ? ' <span class="jtc-own-pill">自</span>' : '';
}

/** フォーカスカードの開始HPブロック(片側)。左右常に大会色で統一(HP残量による色替えはしない・原則9) */
function _jtcFcHpBlock(side, final, max, pct) {
  const top = side === 'right'
    ? `<em>${pct}%</em><strong>${final} / ${max}</strong><span>HP</span>`
    : `<span>HP</span><strong>${final} / ${max}</strong><em>${pct}%</em>`;
  return `<div class="jtc-fc-hp ${side}">
    <div class="jtc-fc-hp-top">${top}</div>
    <div class="jtc-fc-hp-track"><div class="jtc-fc-hp-fill" style="width:${pct}%"></div></div>
  </div>`;
}

/** フォーカスカード本体(アッパー画像対面・左右とも非反転+開始HPバー+観戦/スキップ)。
 * extraHtml があれば names 行の直後（大会固有のセリフ・案内）に挿入する。 */
// ─────────────────────────────────────────────────────────────────────────────
// 因縁の宣戦布告 (2026-07-26)
//
// セリフ資産(RIVALRY_CONFRONTATION_LINES 系)は前からあったが、**通常興行の
// 自団体どうしの試合でしか出ていなかった**。しかも通常興行ですら
//   const cl = G.roster.find(...); const cr = G.roster.find(...); if (cl && cr)
// という条件だったため、**対外戦では一度も出たことがなかった**(2026-07-26 Keisuke)。
//
// 因縁データ自体は選手IDで引くので他団体でも問題なく引ける。眠っていただけ。
// ここに判定を1本化し、特別興行・対外戦のどこからでも同じ基準で出せるようにする。
//
// 基準は通常興行と同じ **rivalry 50以上**。好敵手・宿怨は従来どおり対象外
// (あちらは決着済みの関係で、宣戦布告の場面ではない)。
// 大会の格では出し分けない — 準々決勝の名勝負を取りこぼしたくない(Keisuke 裁定)。
// ─────────────────────────────────────────────────────────────────────────────

/** 因縁のある2人なら宣戦布告のセリフ組を返す。無ければ null。
 *  同じ対戦なら何度描き直しても同じセリフになるよう、ペアと日付から種を作る。 */
function _rivalryPreMatchLines(leftId, rightId) {
  if (typeof Engine === 'undefined' || !Engine.title || typeof G === 'undefined') return null;
  const lvl = Engine.title.getRivalryLevel(G, leftId, rightId);
  // 好敵手・宿怨は決着済みの関係。宣戦布告の場面ではない。
  // (宿怨には専用のセリフを別途書く予定 — 2026-07-27 Keisuke)
  if (!lvl || lvl.isGoodRival || lvl.isBitterRival) return null;

  // **セリフは「強いほうの向き」で出す。**(2026-07-27 Keisuke 裁定)
  // getRivalryLevel は相互の因縁を **弱いほうの向き** で評価するため、
  // 片方が 80 でも相手が 45 なら 45 扱いになり、宣戦布告が出なかった。
  // しかも相手が 10 まで下がると「片側因縁」に分類されて強いほうが使われるので、
  // **相手が少し因縁を持っているほうが出にくい**という逆転まで起きていた。
  // 誰か一人が本気なら、その人は宣戦布告する。数値(MQ等)の評価は従来のまま。
  const rel = (G && G.relationships) || {};
  const rivalry = Math.max(
    (rel[`${leftId}>${rightId}`] || {}).rivalry || 0,
    (rel[`${rightId}>${leftId}`] || {}).rivalry || 0,
    lvl.rivalry || 0);
  if (rivalry < 50) return null;

  let attackerPool, defenderPool;
  if (rivalry >= 90) {
    attackerPool = RIVALRY_CONFRONTATION_LINES_90.attacker;
    defenderPool = RIVALRY_CONFRONTATION_LINES_90.defender;
  } else if (rivalry >= 70) {
    attackerPool = RIVALRY_CONFRONTATION_LINES_70.attacker;
    defenderPool = RIVALRY_CONFRONTATION_LINES_70.defender;
  } else {
    attackerPool = RIVALRY_CONFRONTATION_LINES.attacker;
    defenderPool = RIVALRY_CONFRONTATION_LINES.defender;
  }
  // 性格・アーキタイプは静的定義から引く(他団体の選手も同じ口で引ける)
  const charOf = id => (typeof ALL_CHARS !== 'undefined')
    ? ALL_CHARS.find(c => c.id === id) : null;
  const l = charOf(leftId), r = charOf(rightId);
  if (!l || !r) return null;

  const rng = Engine.rng.create(Engine.rng.derive(
    G.rngSeed || 0, G.season || 0, G.week || 0, Number(leftId) * 1000 + Number(rightId)));
  const pick = (obj, f) => {
    const pool = (typeof getDialoguePool === 'function') ? getDialoguePool(obj, f) : [];
    return pool.length ? pool[Engine.rng.int(rng, 0, pool.length - 1)] : '';
  };
  const leftLine = pick(attackerPool, l);
  const rightLine = pick(defenderPool, r);
  if (!leftLine && !rightLine) return null;
  return { leftLine, rightLine, rivalry, isFate: rivalry >= 70 };
}

/** 上を既存の吹き出し対(jt-bub-pair)の形にして返す。無ければ ''。
 *  **新しい見た目は作らない** — ジュニアも秋も同じ部品を使っている。
 *
 *  これは**飾り**なので、何があっても盤面を落としてはいけない。
 *  中で投げたら黙って '' を返す(セリフが1つ出ないだけで済ませる)。 */
function _rivalryBubblePairHtml(leftId, rightId, leftName, rightName, extraCls) {
  let r = null;
  try { r = _rivalryPreMatchLines(leftId, rightId); } catch (_e) { return ''; }
  if (!r) return '';
  // 吹き出しの中身は**話者名とセリフだけ**。既存の jt-bub と同じ形を崩さない。
  // 因縁であることはセリフ自体が言っている(「今日こそ、決着をつける」)ので、
  // バッジのような飾りは足さない
  return `<div class="jt-bub-pair${extraCls ? ' ' + extraCls : ''}" data-rivalry="${r.rivalry}">
    ${r.leftLine ? `<div class="jt-bub"><div class="sp bl">${escHtml(leftName || '')}</div>「${escHtml(r.leftLine)}」</div>` : ''}
    ${r.rightLine ? `<div class="jt-bub"><div class="sp gd">${escHtml(rightName || '')}</div>「${escHtml(r.rightLine)}」</div>` : ''}
  </div>`;
}

function _jtcFcCore({ label, f1, f2, own1, own2, upperL, upperR, hpLeftBlock, hpRightBlock, hpMidLabel, extraHtml, onWatch, onSkip, onLeftDetail, onRightDetail, skipLabel }) {
  // U7 §2-C: 顔と名前が出ているなら押せば詳細が開く。
  // onLeftDetail/onRightDetail は引数として用意されていたが**どの呼び出し元も渡しておらず**、
  // ジュニアT も天頂戦も次戦カードが一切押せなかった(2026-07-26 Keisuke 指摘)。
  // 渡されなければ id から自前で組む。以後どの大会から呼んでも付け忘れが起きない。
  const _fallbackDetail = f => (f && f.id != null)
    ? `event.stopPropagation();showFighterPopup(${Number(f.id)})` : '';
  const _l = onLeftDetail || _fallbackDetail(f1);
  const _r = onRightDetail || _fallbackDetail(f2);
  const leftDetail = _l ? ` role="button" tabindex="0" style="cursor:pointer" onclick="${_l}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${_l}}"` : '';
  const rightDetail = _r ? ` role="button" tabindex="0" style="cursor:pointer" onclick="${_r}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${_r}}"` : '';
  const ovr1Cls = typeof valueClassOvr === 'function' ? valueClassOvr(f1.ovr) : '';
  const ovr2Cls = typeof valueClassOvr === 'function' ? valueClassOvr(f2.ovr) : '';
  const fighterInfo = (f, own, ovrCls, detail) => {
    const style = String(f.style || 'FIGHTER').toUpperCase();
    const age = f.age != null ? `AGE ${f.age}` : '';
    return `<div class="jtc-fc-nm"${detail}>
      <div class="n">${escHtml(f.name)}</div>
      <div class="jtc-fc-statline">
        <span class="jtc-fc-style">${escHtml(style)}</span>
        ${age ? `<span>${escHtml(age)}</span>` : ''}
        <span class="jtc-fc-ovr"><small>OVR</small><b class="${ovrCls}">${escHtml(f.ovr)}</b></span>
      </div>
      <div class="o">${escHtml(f._orgName || '')}${own}</div>
    </div>`;
  };
  let h = `<div class="jtc-fc jt-su">`;
  h += `<div class="jtc-fc-lb">${escHtml(label)}</div>`;
  h += `<div class="jtc-fc-names">`;
  h += fighterInfo(f1, own1, ovr1Cls, leftDetail);
  h += `<div class="jtc-fc-vl">VS</div>`;
  h += fighterInfo(f2, own2, ovr2Cls, rightDetail);
  h += `</div>`;
  if (extraHtml) h += extraHtml;
  // アッパー画像対面(反転禁止: 左右とも素の向き)
  h += `<div class="jtc-fc-uppers">`;
  h += `<div class="jtc-fc-upper"${leftDetail}>${upperL ? `<img src="${upperL}" alt="" onerror="this.style.opacity=0">` : ''}</div>`;
  h += `<div class="vs-mark">VS</div>`;
  h += `<div class="jtc-fc-upper"${rightDetail}>${upperR ? `<img src="${upperR}" alt="" onerror="this.style.opacity=0">` : ''}</div>`;
  h += `</div>`;
  h += `<div class="jtc-fc-hp-row">${hpLeftBlock}<div class="jtc-fc-hp-mid">${hpMidLabel}</div>${hpRightBlock}</div>`;
  h += `<div class="jtc-fc-bt">`;
  h += `<button class="btn btn-gold" style="padding:8px 22px;font-size:13px" onclick="${onWatch}">観戦する</button>`;
  h += `<button class="btn" style="padding:8px 22px;font-size:13px" onclick="${onSkip}">${escHtml(skipLabel || 'スキップ')}</button>`;
  h += `</div>`;
  h += `</div>`;
  return h;
}

function _jtRecoveredHpTarget(match, side, isFinal) {
  const hp = side === 'left' ? match.hpLeft : match.hpRight;
  if (!hp || !hp.max) return {};
  const isWinner = side === 'left' ? match.winnerId === match.left.id : match.winnerId === match.right.id;
  if (!isWinner || isFinal || typeof App === 'undefined' || typeof App._jtWinnerAdvanceState !== 'function') return {};
  const advanced = App._jtWinnerAdvanceState(match);
  const targetPct = advanced && advanced.jtCarryHpPct != null ? Math.max(1, Math.min(100, Math.round(advanced.jtCarryHpPct))) : null;
  if (targetPct == null) return {};
  const targetFinal = Math.max(1, Math.round(hp.max * targetPct / 100));
  return {
    'jt-recover-final': targetFinal,
    'jt-recover-max': hp.max,
    'jt-recover-pct': targetPct,
  };
}

function _jtFocusCard(match, roundName, ri, mi) {
  const f1 = match.left, f2 = match.right;
  const isFinal = roundName === 'final';
  const roundLabel = isFinal ? '🏆 決勝' : roundName === 'semiFinal' ? '準決勝' : roundName === 'quarterFinal' ? '準々決勝' : '1回戦';
  const label = isFinal ? roundLabel : `${roundLabel} — 第${mi + 1}試合`;
  const upperL = typeof getUpperUrl === 'function' ? getUpperUrl(f1.id) : '';
  const upperR = typeof getUpperUrl === 'function' ? getUpperUrl(f2.id) : '';

  // 因縁があれば宣戦布告を優先。汎用セリフより語ることがある
  let bubbleHtml = (typeof _rivalryBubblePairHtml === 'function')
    ? _rivalryBubblePairHtml(f1.id, f2.id, f1.name, f2.name) : '';
  // セリフ(JTのみ・天頂戦にはない)
  const timing = isFinal ? 'preFinal' : 'preMatch';
  const lineL = getJuniorTournamentLine(timing, f1.personality || 'normal', f1.archetype || '_default');
  const lineR = getJuniorTournamentLine(timing, f2.personality || 'normal', f2.archetype || '_default');
  if (!bubbleHtml && (lineL || lineR)) {
    bubbleHtml = `<div class="jt-bub-pair">`;
    if (lineL) bubbleHtml += `<div class="jt-bub"><div class="sp bl">${escHtml(f1.name)}</div>「${escHtml(lineL)}」</div>`;
    if (lineR) bubbleHtml += `<div class="jt-bub"><div class="sp bl">${escHtml(f2.name)}</div>「${escHtml(lineR)}」</div>`;
    bubbleHtml += `</div>`;
  }

  const startL = _jtStartHp(f1, match.hpLeft);
  const startR = _jtStartHp(f2, match.hpRight);

  return _jtcFcCore({
    label, f1, f2,
    own1: _jtcOwnPill(f1._orgId === 'player'),
    own2: _jtcOwnPill(f2._orgId === 'player'),
    upperL, upperR,
    extraHtml: bubbleHtml,
    hpLeftBlock: _jtcFcHpBlock('left', startL.final, startL.max, startL.pct),
    hpRightBlock: _jtcFcHpBlock('right', startR.final, startR.max, startR.pct),
    hpMidLabel: '開始HP',
    onWatch: `App.jtWatchMatch(${ri},${mi})`,
    onSkip: `App.jtSkipMatch(${ri},${mi})`,
  });
}

/** JT 用: trimmed fighter (ovr のみ持つ) を _pbFighterBlock が使えるように拡張 */
function _jtFighterShim(f) {
  if (f == null) return f;
  if (f.pw != null && f.sp != null) return f;
  return { ...f, pw: f.ovr, sp: f.ovr, te: f.ovr, st: f.ovr, mn: f.ovr };
}

// ===== ONE-MATCH RESULT POPUP =====
// The event board stays in the DOM. Only this fixed layer is added/removed, so closing
// the result always returns the player to the exact board/card they came from.
let _eventMatchResultContinue = null;

function _emrTheme(key) {
  const themes = {
    normal:    { cls: 'is-normal',    emblem: '',                          mark: '●', kicker: 'Regular Show / Match Result' },
    spring:    { cls: 'is-spring',    emblem: '../image/emblem-spring.png', mark: '',  kicker: 'Spring Tag League / Match Result' },
    summer:    { cls: 'is-summer',    emblem: '../image/emblem-summer.png', mark: '',  kicker: 'Junior Cup / Match Result' },
    autumn:    { cls: 'is-autumn',    emblem: '../image/emblem-autumn.png', mark: '',  kicker: 'Autumn Survival War / Fall Result' },
    tenchosen: { cls: 'is-tenchosen', emblem: '../image/emblem-tenchosen.png', mark: '', kicker: 'Quadrennial Tournament / Match Result' },
    ppv:       { cls: 'is-ppv',       emblem: '',                          mark: '♛', kicker: 'PPV Grand Final / Live Result' },
  };
  return themes[key] || themes.normal;
}

function _emrUpper(fighter) {
  return fighter && fighter.id != null && typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
}

function _emrOvr(fighter) {
  if (!fighter) return '—';
  if (fighter.ovr != null) return Math.round(fighter.ovr);
  try { return Math.round(Engine.util.ov(fighter)); } catch (_e) { return '—'; }
}

function _emrVictoryLine(fighter, preferred) {
  if (preferred) return String(preferred).replace(/^[「『]|[」』]$/g, '');
  if (!fighter) return 'この勝利を、次につなげる。';
  const own = fighter.voiceLines || fighter.vl;
  const byId = typeof VICTORY_LINES !== 'undefined' ? VICTORY_LINES[fighter.id] : null;
  // 優先順は **キャラ固有セリフが最上位**(その子だけの言葉を見せるのが本作の芯。
  // 汎用プールで固有セリフを上書きしない — 2026-07-31 Keisuke裁定)。
  // 固有セリフを持たないキャラだけ、性格×アーキタイプの汎用プールへ落とす
  // (従来はここで定型1文に落ちていたため、全員が同じ台詞を話していた)。
  const archetypePool = typeof POST_MATCH_FLAVOR_LINES !== 'undefined' && typeof getDialoguePool === 'function'
    ? getDialoguePool(POST_MATCH_FLAVOR_LINES.winner, fighter)
    : null;
  const pool = Array.isArray(own) && own.length ? own
    : (Array.isArray(byId) && byId.length ? byId
      : (Array.isArray(archetypePool) ? archetypePool : []));
  if (!pool.length) return 'この勝利を、次につなげる。';
  const seed = `${fighter.id || ''}${G?.season || 0}${G?.week || 0}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return String(pool[seed % pool.length]).replace(/^[「『]|[」』]$/g, '');
}

function _emrHp(hp) {
  if (hp == null) return { pct: 0, text: '—' };
  if (typeof hp === 'number') {
    const pct = Math.max(0, Math.min(100, Math.round(hp)));
    return { pct, text: `${pct}%` };
  }
  const max = Number(hp.max) || 100;
  const final = Number(hp.final != null ? hp.final : hp.current) || 0;
  const pct = Math.max(0, Math.min(100, Math.round(final / max * 100)));
  return { pct, text: `${pct}%` };
}

function _emrTeamHp(result, fighterIds) {
  const perFighter = result && result.perFighter;
  if (!perFighter || !Array.isArray(fighterIds)) return null;
  const values = fighterIds.map(id => perFighter[id]).filter(Boolean);
  if (!values.length) return null;
  return {
    final: values.reduce((sum, item) => sum + (Number(item.hpFinal) || 0), 0),
    max: values.reduce((sum, item) => sum + (Number(item.hpMax) || 0), 0),
  };
}

/** 対外試合バッジ用: 団体名の先頭1文字(エンブレム代わり)。絵文字などのサロゲートペアも1文字として拾う */
function _emrOrgInitial(name) {
  const s = String(name || '').trim();
  if (!s) return '●';
  return [...s][0];
}

/** 対外試合(所属が左右で異なる)のときだけ、名前の下にエンブレム+団体名バッジを出す。
 *  実エンブレム画像を使う(mockup-baseline-v0.1 §5)。orgIdが取れない経路だけ頭文字色丸へフォールバック */
function _emrOrgBadgeHtml(orgId, orgName, side) {
  if (!orgName) return '';
  const sideCls = side === 'right' ? 'emr-org-away' : 'emr-org-home';
  const path = orgId != null && typeof Engine !== 'undefined' && Engine.util
    ? (orgId === 'player'
        ? (typeof Engine.util.getPlayerOrgIconPath === 'function' ? Engine.util.getPlayerOrgIconPath(G) : '')
        : (typeof Engine.util.getOrgIconPath === 'function' ? Engine.util.getOrgIconPath(G, orgId) : ''))
    : '';
  const emblem = path ? `<img src="${path}" alt="" loading="lazy">` : escHtml(_emrOrgInitial(orgName));
  return `<div class="emr-org-badge ${sideCls}"><span class="emr-org-emblem">${emblem}</span><span class="emr-org-name">${escHtml(orgName)}</span></div>`;
}

/** opts.profileContext を渡すと画像と名前が選手プロフィールへの導線になる。
 *  結果画面から選手を掘れる動線は画面ごとに有無が違うため、呼び出し側で明示する。 */
function _emrSingleSide(fighter, side, winnerSide, role, statLabel, statValue, bubbleHtml, crossOrg, opts) {
  const isWinner = winnerSide === side;
  const stateClass = winnerSide === 'draw' ? 'is-draw' : isWinner ? 'is-winner' : 'is-loser';
  const displayRole = winnerSide === 'draw' ? 'Draw' : (role || (isWinner ? 'Winner' : 'Challenger'));
  const upper = _emrUpper(fighter);
  const orgName = fighter?.org || fighter?._orgName || fighter?._ppvOrgName || '';
  const ctx = opts && opts.profileContext ? String(opts.profileContext).replace(/[^a-zA-Z0-9_]/g, '') : '';
  const fid = Number(fighter?.id);
  const openProfile = ctx && Number.isFinite(fid)
    ? ` style="cursor:pointer" onclick="showFighterPopup(${fid},'${ctx}')"` : '';
  return `<div class="emr-side ${side === 'right' ? 'is-right ' : ''}${stateClass}">
    <div class="emr-bubble-slot">${bubbleHtml || ''}</div>
    <div class="emr-upper"${openProfile}>${upper ? `<img src="${upper}" alt="" onerror="this.style.display='none'">` : ''}</div>
    <div class="emr-side-copy"><div class="emr-name"${openProfile}>${escHtml(fighter?.name || '?')}</div>
      <div class="emr-role">${escHtml(displayRole)}</div>${crossOrg ? _emrOrgBadgeHtml(fighter?.orgId, orgName, side) : ''}
      <div class="emr-stat"><small>${escHtml(statLabel || 'OVR')}</small>${escHtml(statValue != null ? statValue : _emrOvr(fighter))}</div>
    </div></div>`;
}

function _emrTeamSide(team, side, winnerSide, bubbleHtml, crossOrg) {
  const members = (team?.members || []).slice(0, 2);
  const isWinner = winnerSide === side;
  const stateClass = winnerSide === 'draw' ? 'is-draw' : isWinner ? 'is-winner' : 'is-loser';
  return `<div class="emr-team ${side === 'right' ? 'is-right ' : ''}${stateClass}">
    <div class="emr-bubble-slot">${bubbleHtml || ''}</div>
    <div class="emr-pair">${members.map(f => { const upper = _emrUpper(f); return `<div class="emr-upper">${upper ? `<img src="${upper}" alt="" onerror="this.style.display='none'">` : ''}</div>`; }).join('')}</div>
    <div><div class="emr-team-name">${members.map(f => escHtml(f?.name || '?')).join('<br>&amp; ')}</div><div class="emr-role">${winnerSide === 'draw' ? 'Draw Team' : isWinner ? 'Winner Team' : 'Loser Team'}</div>${crossOrg ? _emrOrgBadgeHtml(team?.orgId, team?.org || '', side) : ''}</div>
  </div>`;
}

/** 両サイドの所属が実際に異なるかを判定する。orgIdが両方分かればそれを優先し、
 *  分からない場合のみ表示用org文字列の一致/不一致にフォールバックする。
 *  呼び出し側はできる限り leftOrgId/rightOrgId (または teamLeft.orgId/teamRight.orgId) を渡すこと。 */
function _emrCrossOrg(opts) {
  if (opts.crossOrg != null) return !!opts.crossOrg;
  if (opts.isTag) {
    const lid = opts.teamLeft?.orgId, rid = opts.teamRight?.orgId;
    if (lid != null && rid != null) return String(lid) !== String(rid);
    const lo = opts.teamLeft?.org, ro = opts.teamRight?.org;
    return !!(lo && ro && lo !== ro);
  }
  const lid = opts.leftOrgId != null ? opts.leftOrgId : opts.left?.orgId;
  const rid = opts.rightOrgId != null ? opts.rightOrgId : opts.right?.orgId;
  if (lid != null && rid != null) return String(lid) !== String(rid);
  const lo = opts.left?.org, ro = opts.right?.org;
  return !!(lo && ro && lo !== ro);
}

/** 試合結果の音を選ぶ。**自団体から見てどうだったか**で決める(2026-07-27 Keisuke)。
 *
 *  それまでは「勝者が誰であれ勝利音」だったので、**自団体が負けても勝利音**が鳴り、
 *  他団体どうしの試合(ジュニア・天頂戦・PPVでは大半)でも勝利音が鳴っていた。
 *
 *    自団体の勝ち          → RS01「通常勝利」
 *    自団体の負け・引き分け → RS02「敗北」
 *    自団体が絡まない試合   → CR03「歓声」(勝ち負けを名乗らない)
 */
function _emrResultSeKey(opts, winnerSide) {
  const orgOf = side => {
    if (opts.isTag) {
      const t = side === 'left' ? opts.teamLeft : opts.teamRight;
      return t && t.orgId != null ? String(t.orgId) : null;
    }
    const direct = side === 'left' ? opts.leftOrgId : opts.rightOrgId;
    if (direct != null) return String(direct);
    const f = side === 'left' ? opts.left : opts.right;
    const id = f && (f.orgId != null ? f.orgId : f._orgId);
    return id != null ? String(id) : null;
  };
  const lo = orgOf('left'), ro = orgOf('right');
  // 所属が分からない画面は、従来どおり「決着した」音にしておく(嘘をつかない側へ倒す)
  if (lo == null && ro == null) return winnerSide === 'draw' ? 'boutLose' : 'boutWin';
  // **両方とも自団体なら、どちらが勝っても勝ち**(2026-07-27 Keisuke)。
  // 通常興行はほとんどこれ。左が勝つと勝利音・右が勝つと敗北音、では嘘になる。
  // 引き分けだけは勝利音を鳴らさない(どちらの選手も勝っていない)。
  if (lo === 'player' && ro === 'player') {
    return winnerSide === 'draw' ? 'boutOther' : 'boutWin';
  }
  const mine = lo === 'player' ? 'left' : ro === 'player' ? 'right' : null;
  if (!mine) return 'boutOther';
  if (winnerSide === 'draw') return 'boutLose';
  return winnerSide === mine ? 'boutWin' : 'boutLose';
}

/** 試合が決まった音を、共通の規則で鳴らす。
 *
 *  イベント試合(派閥内対決 / B3 元同僚初対戦 / B2 大型イベント)は
 *  showEventMatchResultPopup を通らない独自の結果画面を持っており、
 *  **決着音のかわりに coin(お金の音)が鳴っていた**(2026-07-27 Keisuke 報告)。
 *  規則を2箇所に書くと必ず片方が古くなるので、判定は _emrResultSeKey に寄せる。 */
function playMatchResultSe(left, right, winnerSide, isTag) {
  try {
    const key = _emrResultSeKey(
      isTag ? { isTag: true, teamLeft: left, teamRight: right } : { left, right },
      winnerSide);
    Audio.play(key);
  } catch (_e) {}
}

if (typeof window !== 'undefined') window.playMatchResultSe = playMatchResultSe;

function closeEventMatchResultPopup() {
  const layer = document.querySelector('.emr-layer');
  if (layer) layer.remove();
  const next = _eventMatchResultContinue;
  _eventMatchResultContinue = null;
  if (typeof next === 'function') next();
}

/** 試合が終わったあとの「次へ」ボタンの文言。**行き先の名前で呼ばない。**
 *  2026-07-26 統一: 以前は `進む` `戦況ボードへ` `次のカードへ` `リーグ表へ戻る`
 *  `大会結果へ` `優勝発表へ` の6通りが並立し、**同じ動作に8つの言い方**があった。
 *  行き先の名前(戦況ボード/リーグ表)は、その画面を知っている人にしか通じない。
 *  **「次の試合が続くのか、終わったのか」の二択**だけで書く。
 *  大会が増えても崩れないので、新しい画面もこの2語から選ぶこと。 */
function _emrTagFinishActors(opts, winnerSide) {
  if (!opts || winnerSide === 'draw') return '';
  const attribution = opts.winAttribution;
  if (!attribution || attribution.pinnedBy == null || attribution.pinnedWho == null) return '';
  const members = [
    ...((opts.teamLeft && opts.teamLeft.members) || []),
    ...((opts.teamRight && opts.teamRight.members) || []),
  ];
  const by = members.find(member => String(member.id) === String(attribution.pinnedBy));
  const who = members.find(member => String(member.id) === String(attribution.pinnedWho));
  if (!by || !who) return '';
  return `<div class="emr-finish-actors"><b>${escHtml(by.name)}</b><span>&#8594;</span><b class="is-loser">${escHtml(who.name)}</b></div>`;
}

function _matchNextLabel(isLast) {
  return isLast ? '結果へ →' : '次の試合へ →';
}

function showEventMatchResultPopup(opts) {
  if (!opts) return;
  const old = document.querySelector('.emr-layer');
  if (old) old.remove();
  const theme = _emrTheme(opts.theme);
  const winnerSide = opts.winnerSide === 'right' ? 'right' : opts.winnerSide === 'draw' ? 'draw' : 'left';
  const winnerFighter = opts.winnerFighter || (winnerSide === 'right' ? opts.right : opts.left);
  const contexts = (opts.context || []).slice(0, 3);
  while (contexts.length < 3) contexts.push(['', '—']);
  const hpL = _emrHp(opts.hpLeft), hpR = _emrHp(opts.hpRight);
  const emblem = theme.emblem ? `<img src="${theme.emblem}" alt="" onerror="this.style.display='none'">` : escHtml(theme.mark);
  const showVictoryLine = winnerSide !== 'draw' && opts.showVictoryLine !== false;
  // 試合が決まった音。**どの大会の結果でも無音だった**(2026-07-26 Keisuke 指摘は
  // 秋4団体戦の1フォール目だったが、調べたら通常興行もPPVも全部鳴っていなかった)。
  // 共通の入口で鳴らすので、大会を足しても付け忘れが起きない。
  // 大会の優勝ファンファーレとは別物。1試合ごとに何度も鳴るので控えめに。
  try { Audio.play(_emrResultSeKey(opts, winnerSide)); } catch (_e) {}
  const line = showVictoryLine ? _emrVictoryLine(winnerFighter, opts.victoryLine) : '';
  // 顔出しイベント共通ルール(docs/ui/02-layouts.md 2-D-X)準拠: 吹き出しは画像の「上」の予約枠に入れ、
  // 中身はセリフ本文だけ(話者名・所属は書かない。話者は画像下の表示で示す)。発言が無い側は空枠のままにして
  // 左右の画像の高さを揃える(画像に被らないこと・左右の高さが揃うことは自動検証済み)。
  const bubbleHtml = showVictoryLine && line
    ? `<div class="emr-bubble"><span class="emr-bubble-line">「${escHtml(line)}」</span></div>` : '';
  const bubbleLeft = winnerSide === 'left' ? bubbleHtml : '';
  const bubbleRight = winnerSide === 'right' ? bubbleHtml : '';
  const isTag = !!opts.isTag;
  // 対外試合(左右の所属団体が実際に異なる)のときだけ、名前の下に団体エンブレム+団体名バッジを出す。
  // 自団体だけの試合(通常興行の通常カード・PPV等)ではバッジそのものを省略する。
  const crossOrg = _emrCrossOrg(opts);
  const sides = isTag
    ? `${_emrTeamSide(opts.teamLeft, 'left', winnerSide, bubbleLeft, crossOrg)}<div class="emr-center"><div class="emr-winner">${escHtml(opts.resultLabel || (winnerSide === 'draw' ? 'NO CONTEST' : 'TEAM WIN'))}</div>${_emrTagFinishActors(opts, winnerSide)}<div class="emr-finish">${escHtml(opts.finish || '—')}</div><div class="emr-turn">${escHtml(opts.turnLabel || `${opts.turns || 0} TURN`)}</div><div class="emr-mq">MQ <b>${escHtml(opts.mq != null ? opts.mq : '—')}</b></div></div>${_emrTeamSide(opts.teamRight, 'right', winnerSide, bubbleRight, crossOrg)}`
    : `${_emrSingleSide(opts.left, 'left', winnerSide, opts.leftRole, opts.leftStatLabel, opts.leftStat, bubbleLeft, crossOrg)}<div class="emr-center"><div class="emr-winner">${escHtml(opts.resultLabel || (winnerSide === 'draw' ? 'NO CONTEST' : 'WIN'))}</div><div class="emr-finish">${escHtml(opts.finish || '—')}</div><div class="emr-turn">${escHtml(opts.turnLabel || `${opts.turns || 0} TURN`)}</div><div class="emr-mq">MQ <b>${escHtml(opts.mq != null ? opts.mq : '—')}</b></div></div>${_emrSingleSide(opts.right, 'right', winnerSide, opts.rightRole, opts.rightStatLabel, opts.rightStat, bubbleRight, crossOrg)}`;
  const chips = (opts.chips || []).filter(Boolean).map(chip => `<span class="emr-chip">${escHtml(chip)}</span>`).join('');
  const layer = document.createElement('div');
  layer.className = `emr-layer ${theme.cls}`.trim();
  layer.setAttribute('role', 'presentation');
  layer.innerHTML = `<article class="emr-popup" role="dialog" aria-modal="true" aria-label="1試合結果">
    <header class="emr-head"><div class="emr-emblem">${emblem}</div><div><div class="emr-kicker">${escHtml(opts.kicker || theme.kicker)}</div><div class="emr-title">${escHtml(opts.title || '試合結果')}</div><div class="emr-meta">${escHtml(opts.meta || '')}</div></div><div class="emr-progress">${escHtml(opts.progress || '')}<small>${escHtml(opts.progressLabel || 'MATCH')}</small></div></header>
    <div class="emr-context">${contexts.map(([label, value]) => `<div class="emr-context-cell"><span>${escHtml(label)}</span><b>${escHtml(value)}</b></div>`).join('')}</div>
    <div class="emr-bout ${isTag ? 'is-tag' : ''}">${sides}</div>
    ${chips ? `<div class="emr-chips">${chips}</div>` : ''}
    <div class="emr-hp"><div class="emr-hp-half"><span class="emr-hp-val">${hpL.text}</span><div class="emr-hp-track"><div class="emr-hp-fill" style="width:${hpL.pct}%"></div></div></div><span class="emr-hp-label">${escHtml(opts.hpLabel || 'FINAL HP')}</span><div class="emr-hp-half is-right"><span class="emr-hp-val">${hpR.text}</span><div class="emr-hp-track"><div class="emr-hp-fill" style="width:${hpR.pct}%"></div></div></div></div>
    <footer class="emr-foot"><span class="emr-foot-note">${escHtml(opts.footNote || '')}</span><button type="button" class="emr-next" onclick="closeEventMatchResultPopup()">${escHtml(opts.nextLabel || _matchNextLabel(false))}</button></footer>
  </article>`;
  _eventMatchResultContinue = typeof opts.onContinue === 'function' ? opts.onContinue : null;
  document.body.appendChild(layer);
  requestAnimationFrame(() => layer.querySelector('.emr-next')?.focus());
}

function renderRegularMatchResultPopup(idx, onContinue) {
  const sp = App._showPreview;
  const match = sp?.validMatches?.[idx];
  const result = sp?.results?.[idx];
  if (!match || !result) { if (onContinue) onContinue(); return; }
  const total = sp.validMatches.length;
  const venue = typeof VENUES !== 'undefined' ? VENUES[G.showVenue || 0] : null;
  const challenge = sp.awayBooking || sp.incomingChallenge;
  const isChallenge = !!(challenge && (match.isCRMatch || match._crMatchLocked || match._awayChallengeMatch));
  const resultTitle = sp.isAwayChallenge
    ? `${challenge?.opponentOrgName || '相手団体'}興行　遠征試合結果`
    : `第${G.totalShows + 1}回 定期興行　試合結果`;
  const venueLabel = sp.isAwayChallenge ? `${challenge?.opponentOrgName || '相手団体'} 興行` : (venue?.name || '通常興行');
  const leftOrg = isChallenge ? (challenge.requesterOrgName || challenge.requesterOrgId) : 'プレイヤー団体';
  const rightOrg = isChallenge ? (challenge.opponentOrgName || challenge.opponentOrgId) : 'プレイヤー団体';
  const leftOrgId = isChallenge ? (challenge.requesterOrgId || 'player') : 'player';
  const rightOrgId = isChallenge ? (challenge.opponentOrgId || 'away') : 'player';
  if (match.matchType === 'tag') {
    const idsA = [match.teamA.fighter1, match.teamA.fighter2];
    const idsB = [match.teamB.fighter1, match.teamB.fighter2];
    const membersA = idsA.map(id => (G.roster || []).find(f => f.id === id)).filter(Boolean);
    const membersB = idsB.map(id => (G.roster || []).find(f => f.id === id)).filter(Boolean);
    const winnerSide = result.winner === 'teamB' || result.winner === 'right' ? 'right' : result.winner === 'draw' ? 'draw' : 'left';
    const winnerFighter = (winnerSide === 'right' ? membersB : membersA)[0];
    const boutNumber = total - idx;
    showEventMatchResultPopup({
      theme: 'normal', title: resultTitle, meta: `YEAR ${G.season} ・ WEEK ${G.week} ・ 第${boutNumber}試合 / 全${total}試合`,
      progress: `${boutNumber} / ${total}`, progressLabel: 'MATCH', context: [['会場', venueLabel], ['試合形式', 'TAG MATCH'], ['MQ', String(result.mq ?? '—')]],
      isTag: true, teamLeft: { members: membersA, org: leftOrg, orgId: leftOrgId }, teamRight: { members: membersB, org: rightOrg, orgId: rightOrgId }, winnerSide, winnerFighter,
      winAttribution: result.winAttribution, finish: Engine.formatFinish(result.finType, result.finMove), turns: result.turns || 0, mq: result.mq, chips: ['通常興行', 'タッグマッチ'], hpLeft: _emrTeamHp(result, idsA), hpRight: _emrTeamHp(result, idsB),
      footNote: '通常興行 ・ 試合結果', nextLabel: _matchNextLabel(idx >= total - 1), onContinue,
    });
    return;
  }
  const left = (G.roster || []).find(f => f.id === match.left) || result.left;
  const right = (G.roster || []).find(f => f.id === match.right) || result.right;
  const winnerSide = result.winner === 'right' ? 'right' : result.winner === 'draw' ? 'draw' : 'left';
  const winner = winnerSide === 'right' ? right : left;
  const boutNumber = total - idx;
  let victoryLine = '';
  if (winnerSide !== 'draw' && winner && typeof POST_MATCH_FLAVOR_LINES !== 'undefined' && typeof pickDialogueLine === 'function') {
    try { victoryLine = pickDialogueLine(POST_MATCH_FLAVOR_LINES.winner, winner); } catch (_e) {}
  }
  showEventMatchResultPopup({
    theme: 'normal', title: resultTitle, meta: `YEAR ${G.season} ・ WEEK ${G.week} ・ 第${boutNumber}試合 / 全${total}試合`,
    progress: `${boutNumber} / ${total}`, progressLabel: 'MATCH', context: [['会場', venueLabel], ['試合形式', isChallenge ? 'CHALLENGE MATCH' : match.isTitle ? 'TITLE MATCH' : 'SINGLE MATCH'], ['MQ', String(result.mq ?? '—')]],
    left: { ...left, org: leftOrg, orgId: leftOrgId }, right: { ...right, org: rightOrg, orgId: rightOrgId }, winnerSide, winnerFighter: winner,
    leftRole: winnerSide === 'left' ? 'Winner' : 'Challenger', rightRole: winnerSide === 'right' ? 'Winner' : 'Challenger', resultLabel: winnerSide === 'draw' ? 'NO CONTEST' : match.isTitle ? 'TITLE WIN' : 'WIN',
    finish: Engine.formatFinish(result.finType, result.finMove), turns: result.turns || 0, mq: result.mq, victoryLine, chips: [isChallenge ? '挑戦試合' : match.isTitle ? 'タイトルマッチ' : '通常興行', `MQ ${result.mq}`], hpLeft: result.hpLeft, hpRight: result.hpRight,
    footNote: isChallenge ? `${leftOrg} vs ${rightOrg}` : '通常興行 ・ 試合結果', nextLabel: _matchNextLabel(idx >= total - 1), onContinue,
  });
}

// ===== MATCH RESULT =====
function renderJuniorTournamentMatchResult(ri, mi) {
  const jt = App._jtPreview;
  if (!jt) return;
  {
    const rounds = jt.result.rounds;
    const round = rounds[ri];
    const match = round?.matches?.[mi];
    if (!match) return;
    const total = rounds.reduce((sum, item) => sum + item.matches.length, 0);
    const position = rounds.slice(0, ri).reduce((sum, item) => sum + item.matches.length, 0) + mi + 1;
    const isFinal = ri === rounds.length - 1;
    const roundLabel = round.name === 'final' ? '決勝' : round.name === 'semiFinal' ? '準決勝' : round.name === 'quarterFinal' ? '準々決勝' : '1回戦';
    const left = _jtFighterShim(match.left), right = _jtFighterShim(match.right);
    const leftWins = match.winnerId === match.left.id;
    const winner = leftWins ? left : right;
    const recover = side => {
      if (isFinal) return side === 'left' ? match.hpLeft : match.hpRight;
      const target = _jtRecoveredHpTarget(match, side, false);
      return target && target['jt-recover-pct'] != null ? target['jt-recover-pct'] : (side === 'left' ? match.hpLeft : match.hpRight);
    };
    const winLine = getJuniorTournamentLine('postMatchWin', winner.personality || 'normal', winner.archetype || '_default');
    showEventMatchResultPopup({
      theme: 'summer', title: `${roundLabel} 第${mi + 1}試合　結果`, meta: `第${G.season}回大会 ・ 第${position}試合 / 全${total}試合`,
      progress: `${position} / ${total}`, progressLabel: isFinal ? 'FINAL' : round.name === 'semiFinal' ? 'SEMI FINAL' : 'TOURNAMENT',
      context: [['Round', roundLabel], ['勝ち上がり', isFinal ? '優勝' : '次戦進出'], ['次戦', isFinal ? '優勝発表' : (ri + 1 === rounds.length - 1 ? '決勝' : '次ラウンド')]],
      left: { ...left, org: match.left._orgName || '', orgId: match.left._orgId }, right: { ...right, org: match.right._orgName || '', orgId: match.right._orgId }, winnerSide: leftWins ? 'left' : 'right', winnerFighter: winner,
      leftRole: leftWins ? 'Finalist' : 'Eliminated', rightRole: leftWins ? 'Eliminated' : 'Finalist', resultLabel: isFinal ? 'CHAMPION' : 'ADVANCE',
      finish: Engine.formatFinish(match.finType, match.finMove), turns: match.turns || 0, mq: match.mq, victoryLine: winLine,
      chips: [isFinal ? 'ジュニア王者' : '次戦進出', `${roundLabel}`, `MQ ${match.mq}`], hpLeft: recover('left'), hpRight: recover('right'), hpLabel: isFinal ? 'FINAL HP' : '回復後HP',
      footNote: `夏季ジュニア ・ ${winner.name} ${isFinal ? '優勝' : '勝ち上がり'}`, nextLabel: _matchNextLabel(isFinal),
      onContinue: () => App.jtAdvanceAfterResult(ri, mi),
    });
    return;
  }
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
  const roundLabel = round.name === 'final' ? '🏆 決勝' : round.name === 'semiFinal' ? '準決勝' : round.name === 'quarterFinal' ? '準々決勝' : '1回戦';
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
  const matchNoLabel = isFinal ? '決勝' : `${escHtml(roundLabel)} 第${mi + 1}試合`;

  // クライムライン画面と地続きに見せるため、同じヘッダー(エンブレム+金二重罫)を先頭に置く
  let html = `<div class="jt-wrap" style="max-width:640px;padding:0;--jtc-color:var(--ev-summer);--jtc-color-rgb:var(--ev-summer-rgb)">${_jtHeader()}</div>`;
  html += `<div class="pb-container">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-jt">🥇 JUNIOR TOURNAMENT</div>
    <div class="pb-banner-title is-jt">${escHtml(roundLabel)}</div>
    <div class="pb-banner-sub">${escHtml(seasonLabel)}<span class="dot">·</span>第${matchPos}試合 / 全${totalMatchesInTournament}試合<span class="dot">·</span>${escHtml(matchNoLabel)}</div>
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
  if (match.hpLeft && match.hpRight) {
    html += _pbHpMini(match.hpLeft, match.hpRight, {
      className: 'is-jt-recovery',
      label: isFinal ? 'HP' : '回復後HP',
      left: _jtRecoveredHpTarget(match, 'left', isFinal),
      right: _jtRecoveredHpTarget(match, 'right', isFinal),
    });
  }
  html += `</div>`;
  // 決着時間チップ(クライムライン画面と同一の見た目。_jtcMinfoを流用し視覚を地続きにする)
  html += `<div class="jtc-result-minfo">${_jtcMinfo(match)}</div>`;
  html += `</div>`; // .pb-matches

  // Footer
  const nextLabel = _matchNextLabel(isFinal);
  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.jtAdvanceAfterResult(${ri},${mi})">${nextLabel}</button>
  </div>`;

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
  if (!isFinal) setTimeout(_jtAnimateHpRecoveryBars, 350);
}

function _jtAnimateHpRecoveryBars() {
  const fills = Array.from(document.querySelectorAll('.pb-hp-mini.is-jt-recovery .pb-hp-mini-fill[data-jt-recover-pct]'));
  fills.forEach(fill => {
    const targetPct = Number(fill.dataset.jtRecoverPct);
    if (!Number.isFinite(targetPct)) return;
    const val = fill.closest('.pb-hp-mini-half')?.querySelector('.pb-hp-mini-val[data-jt-recover-final]');
    const targetFinal = val ? Number(val.dataset.jtRecoverFinal) : null;
    const targetMax = val ? Number(val.dataset.jtRecoverMax) : null;
    const fromPct = parseFloat(fill.style.width) || 0;
    const fromText = val ? String(val.textContent || '').match(/(\d+)/) : null;
    const fromFinal = fromText ? Number(fromText[1]) : 0;
    const start = performance.now();
    const dur = 1100;
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const pct = Math.round(fromPct + (targetPct - fromPct) * eased);
      fill.style.width = `${pct}%`;
      fill.classList.remove('is-healthy', 'is-warning', 'is-danger');
      const tone = _jtHpTone(pct);
      fill.classList.add(tone);
      const half = fill.closest('.pb-hp-mini-half');
      if (half) {
        half.classList.remove('is-healthy', 'is-warning', 'is-danger');
        half.classList.add(tone);
      }
      if (val && Number.isFinite(targetFinal) && Number.isFinite(targetMax)) {
        const cur = Math.round(fromFinal + (targetFinal - fromFinal) * eased);
        val.textContent = `${cur} / ${targetMax}`;
      }
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ══════════════════════════════════════════════════════════
//  U2: 大会の優勝発表 統一デザイン (.champ / .ch-*)
//  JT・春タッグリーグ・秋4団体対抗戦・天頂戦の優勝発表を1つの型に統一する共通ヘルパー。
//  大会ごとの差分はテーマ色(.th-*, --ev-rgb)のみ。縦の並び順は固定(吹き出し→画像→名前→役割→団体→数値)。
//  spec: docs/ui/mockup-baseline-v0.1.md, docs/game-system-roadmap.md「UI統一リデザイン」U2
// ══════════════════════════════════════════════════════════

/** ヒーロー/デュオ/トリオ用の主役ポートレート。実画像優先、無ければイニシャル */
function _chPortraitImg(fighter) {
  const url = fighter && fighter.id != null && typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
  if (url) return `<img src="${url}" alt="${escHtml(fighter?.name || '')}" onerror="this.style.display='none'">`;
  return `<span class="ini">${escHtml((fighter?.name || '?').charAt(0))}</span>`;
}

/** 準優勝以下チップ用の小さいポートレート */
function _chSubImg(fighter) {
  if (!fighter) return '';
  const url = typeof getPortraitUrl === 'function' ? getPortraitUrl(fighter.id) : '';
  if (url) return `<img src="${url}" alt="" onerror="this.style.display='none'">`;
  return `<span class="ini">${escHtml((fighter.name || '?').charAt(0))}</span>`;
}

/** 吹き出しの予約枠。発言が無くても同じ高さの空枠を返し、左右/複数人の画像上端を揃える */
function _chBubbleSlot(text, bubbleClass = '') {
  const modifier = bubbleClass ? ` ${escHtml(bubbleClass)}` : '';
  return `<div class="ch-bubble-slot">${text ? `<div class="ch-bubble${modifier}">「${escHtml(text)}」</div>` : ''}</div>`;
}

/** 団体エンブレム(実画像)。orgIdが取れないときだけ頭文字色丸へフォールバック(mockup-baseline-v0.1 §5) */
function _chOrgEmblemInner(orgId, orgName) {
  if (orgId != null && typeof Engine !== 'undefined' && Engine.util) {
    const path = orgId === 'player'
      ? (typeof Engine.util.getPlayerOrgIconPath === 'function' ? Engine.util.getPlayerOrgIconPath(G) : '')
      : (typeof Engine.util.getOrgIconPath === 'function' ? Engine.util.getOrgIconPath(G, orgId) : '');
    if (path) return `<img src="${path}" alt="" loading="lazy">`;
  }
  return `<span class="ch-org-ini">${escHtml(_emrOrgInitial(orgName))}</span>`;
}

/** 個人優勝(JT/天頂戦)の団体バッジ。対外(他団体が絡む)ときだけ呼ぶこと */
function _chOrgBadgeHtml(orgId, orgName) {
  if (!orgName) return '';
  return `<div class="ch-org"><span class="oe">${_chOrgEmblemInner(orgId, orgName)}</span><span class="on">${escHtml(orgName)}</span></div>`;
}

/** 団体優勝(春タッグ/秋対抗戦)の団体名帯。主役は団体そのもの */
function _chTeamlineHtml(orgId, orgName) {
  if (!orgName) return '';
  return `<div class="ch-teamline"><span class="oe">${_chOrgEmblemInner(orgId, orgName)}</span><span class="ch-teamname">${escHtml(orgName)}</span></div>`;
}

/** 準優勝以下チップ1枚 */
function _chSubCardHtml(rankLabel, fighter, orgId, orgName, prizeAmt) {
  if (!fighter) return '';
  const isOwn = orgId === 'player';
  return `<div class="ch-sub-card">
    <span class="ch-sub-rank">${escHtml(rankLabel)}</span>
    <div class="ch-sub-img">${_chSubImg(fighter)}</div>
    <div><div class="ch-sub-nm">${escHtml(fighter.name || '?')}</div><div class="ch-sub-org">${orgName ? `<span class="ch-sub-dot" style="background:${isOwn ? 'var(--c-positive)' : 'var(--accent-hostility)'}"></span>${escHtml(orgName)}` : ''}${prizeAmt ? `<span class="ch-sub-prize">¥${prizeAmt}万</span>` : ''}</div></div>
  </div>`;
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
  const PRIZE = Engine.juniorTournament.PRIZE;

  // チャンピオンの通算MQ + 決勝MQ
  let totalMQ = 0;
  let finalMQ = 0;
  let championMatchCount = 0;
  rounds.forEach((round, ri) => {
    const champMatch = round.matches.find(m => m.left.id === champion.id || m.right.id === champion.id);
    if (champMatch) {
      totalMQ += champMatch.mq;
      if (ri === rounds.length - 1) finalMQ = champMatch.mq;
      championMatchCount++;
    }
  });
  const champOvr = champion.ovr != null ? champion.ovr : Engine.util.ov(_jtFighterShim(champion));

  // 優勝スピーチ
  const champLine = getJuniorTournamentLine('champion', champion.personality || 'normal', champion.archetype || '_default');

  let html = `<div class="pb-container">`;

  // U2統一デザイン: 大会ヘッダー→吹き出し→画像→名前→役割→団体→数値→準優勝以下→フッター
  html += `<div class="champ th-summer">
    <div class="ch-head">
      <div class="ch-emb"><img src="../image/emblem-summer.png" alt="" onerror="this.style.display='none'"></div>
      <div class="ch-kicker">Junior Cup / Champion</div>
      <div class="ch-title">第${season}回 ジュニアトーナメント</div>
      <div class="ch-meta">第${G.week}週 ・ 全${rounds[0] ? rounds[0].matches.length * 2 : 0}名参加</div>
    </div>
    <div class="ch-hero">
      ${_chBubbleSlot(champLine)}
      <div class="ch-por-wrap"><span class="ch-glow"></span><span class="ch-crown">🏆</span><div class="ch-por">${_chPortraitImg(champion)}</div></div>
      <div class="ch-name">${escHtml(champion.name)}</div>
      <div class="ch-role">優勝</div>
      ${_chOrgBadgeHtml(champion._orgId, champion._orgName)}
      <div class="ch-stat"><small>OVR</small>${champOvr}</div>
    </div>`;

  // Runner-up + semifinalists
  const subEntries = [];
  if (runnerUp) {
    subEntries.push({ f: runnerUp, rank: '2', prize: PRIZE.runnerUp });
  }
  if (semiFinalists) {
    semiFinalists.forEach(sf => {
      if (sf) subEntries.push({ f: sf, rank: '3', prize: PRIZE.semiFinal });
    });
  }
  if (subEntries.length > 0) {
    html += `<div class="ch-sub">${subEntries.map(e => _chSubCardHtml(e.rank, e.f, e.f._orgId, e.f._orgName, e.prize)).join('')}</div>`;
  }

  html += `<div class="ch-foot">
    <span class="ch-prize">優勝賞金<b>¥${PRIZE.champion}万</b></span>
    <button type="button" class="ch-next" onclick="App.finalizeJuniorTournament()">閉じる</button>
  </div>`;
  html += `</div>`; // .champ

  // Scoreboard: Total MQ / Final MQ / Prize / OVR
  html += `<div class="pb-score-strip" style="grid-template-columns:1fr 1fr 1fr 1fr">
    <div class="pb-score-cell">
      <div class="pb-score-stars">${_pbStars(Math.round(totalMQ / Math.max(1, championMatchCount)))}</div>
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

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ══════════════════════════════════════════════════════════
//  S8: 春のタッグリーグ（spring-tag-league-spec-v0.1 UI実装 / P2a）
//  spec: docs/ui/03-screens/spring-tag-league.md
//  リプレイ方式 — G.springTagLeague の確定済みデータを順に「再生」するのみ。
//  UIは再計算しない（数値は嘘をつかない）。JTのS4姉妹シーケンス、showResultOverlayを共用。
// ══════════════════════════════════════════════════════════

const _STL_STYLE_CREAM = {
  Grappler: 'tag-cream-grappler', Striker: 'tag-cream-striker', Submission: 'tag-cream-submission',
  Aerial: 'tag-cream-aerial', Allround: 'tag-cream-allround', Brawler: 'tag-cream-brawler',
};

function _stlOrgTeam(orgId) {
  const stl = G.springTagLeague;
  return (stl && Array.isArray(stl.teams) ? stl.teams : []).find(t => t.orgId === orgId) || null;
}

function _stlFighterOf(orgId, fighterId) {
  if (fighterId == null) return null;
  const sameId = (left, right) => String(left) === String(right);
  if (orgId === 'player') return (G.roster || []).find(f => f && sameId(f.id, fighterId)) || null;
  const org = G.aiOrgs && G.aiOrgs[orgId];
  return (org && org.roster ? org.roster : []).find(f => f && sameId(f.id, fighterId)) || null;
}

function _stlFaceImg(f) {
  if (!f) return '';
  const u = getPortraitUrl(f.id);
  // U7 §2-C: 顔が出ているなら押せば選手詳細が開く
  const open = ` style="cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${Number(f.id)},'springTagLeague',true)"`;
  return u ? `<img src="${u}" alt="${escHtml(f.name || '')}"${open} onerror="this.style.display='none'">` : '';
}

/** condition(40-80)を定性3段に変換。数値は表に出さない */
function _stlConditionTier(cond) {
  const c = cond == null ? Engine.springTagLeague.INITIAL_CONDITION : cond;
  if (c >= 65) return { cls: 'is-fresh', label: '元気' };
  if (c >= 52) return { cls: 'is-tired', label: '疲れが見える' };
  return { cls: 'is-spent', label: '満身創痍' };
}

function _stlWearBarHtml(cond) {
  const tier = _stlConditionTier(cond);
  return `<div class="stl-wear-bar ${tier.cls}"><span class="stl-wear-dots"><span class="stl-wear-dot"></span><span class="stl-wear-dot"></span><span class="stl-wear-dot"></span></span><span>${tier.label}</span></div>`;
}

/** matches[0..count) から現在の condition を逆引きする（無ければ初期値） */
function _stlCurrentCondition(matches, count, orgId) {
  for (let i = count - 1; i >= 0; i--) {
    const m = matches[i];
    if (m && m.conditionAfter && m.conditionAfter[orgId] != null) return m.conditionAfter[orgId];
  }
  return Engine.springTagLeague.INITIAL_CONDITION;
}

/** matches[0..count) を集計した中間スタンディング（UI専用の簡易順位。h2h厳密tie-breakは行わない —
 * 全試合終了後の最終順位は常に G.springTagLeague.standings を正とする） */
function _stlComputeStandingsThrough(matches, count) {
  const P = Engine.springTagLeague.POINTS;
  const MQT = Engine.springTagLeague.MQ_BONUS_THRESHOLD;
  const MQB = Engine.springTagLeague.MQ_BONUS;
  const orgOrder = Engine.springTagLeague.ORG_ORDER;
  const acc = {};
  orgOrder.forEach(o => { acc[o] = { orgId: o, points: 0, wins: 0, losses: 0, draws: 0, mqTotal: 0, closeBonusCount: 0 }; });
  matches.slice(0, count).forEach(m => {
    if (m.isDraw) {
      acc[m.orgA].points += P.draw; acc[m.orgB].points += P.draw;
      acc[m.orgA].draws++; acc[m.orgB].draws++;
    } else {
      const winnerOrg = m.winner === 'teamA' ? m.orgA : m.orgB;
      const loserOrg = winnerOrg === m.orgA ? m.orgB : m.orgA;
      acc[winnerOrg].points += P.win; acc[winnerOrg].wins++;
      acc[loserOrg].points += P.loss; acc[loserOrg].losses++;
    }
    if (m.mq >= MQT) {
      acc[m.orgA].points += MQB; acc[m.orgB].points += MQB;
      acc[m.orgA].closeBonusCount++; acc[m.orgB].closeBonusCount++;
    }
    acc[m.orgA].mqTotal += m.mq; acc[m.orgB].mqTotal += m.mq;
  });
  const arr = orgOrder.map(o => acc[o]);
  arr.sort((a, b) => (b.points - a.points) || (b.mqTotal - a.mqTotal));
  arr.forEach((row, i) => { row.rank = i + 1; });
  return arr;
}

function _stlHeaderHtml(subLabel) {
  const season = G.season;
  return `<div class="stl-header">
    <img class="stl-header-emblem" src="../image/emblem-spring.png" alt="" onerror="this.style.display='none'">
    <div class="stl-header-title">SPRING TAG LEAGUE</div>
    <div class="stl-header-sub">春のタッグリーグ — 総当たり戦</div>
    <div class="stl-header-ed">第${season}回大会${subLabel ? ` / ${escHtml(subLabel)}` : ''}</div>
  </div><div class="stl-double-rule"></div>`;
}

function _stlLastMatchStripHtml(m) {
  if (!m) return '';
  const fA1 = _stlFighterOf(m.orgA, m.teamA.f1Id), fA2 = _stlFighterOf(m.orgA, m.teamA.f2Id);
  const fB1 = _stlFighterOf(m.orgB, m.teamB.f1Id), fB2 = _stlFighterOf(m.orgB, m.teamB.f2Id);
  const aWin = !m.isDraw && m.winner === 'teamA';
  const bWin = !m.isDraw && m.winner === 'teamB';
  const timeStr = (typeof _npTurnsToTime === 'function') ? _npTurnsToTime(m.turns) : '';
  const closeBonus = m.mq >= Engine.springTagLeague.MQ_BONUS_THRESHOLD;
  // U5: 引き分け時は「両陣営ともWINタグが無い」という消去法でしか判別できなかったため、
  // △DRAWタグを明示する(is-draw)。勝敗色は既存の verdict 表現(--c-warning=引分)に合わせる。
  return `<div class="stl-lastmatch">
    <span class="stl-lastmatch-label">第${m.round}試合 結果</span>
    <span class="stl-lastmatch-duo ${aWin ? 'is-win' : (m.isDraw ? 'is-draw' : 'is-lose')}">${_stlFaceImg(fA1)}${_stlFaceImg(fA2)}<span class="n">${escHtml(fA1 ? fA1.name : '?')} &amp; ${escHtml(fA2 ? fA2.name : '?')}${aWin ? '<br><b class="win-tag">WIN</b>' : (m.isDraw ? '<br><b class="draw-tag">NO CONTEST</b>' : '')}</span></span>
    <span class="stl-lastmatch-vs">VS</span>
    <span class="stl-lastmatch-duo ${bWin ? 'is-win' : (m.isDraw ? 'is-draw' : 'is-lose')}">${_stlFaceImg(fB1)}${_stlFaceImg(fB2)}<span class="n">${escHtml(fB1 ? fB1.name : '?')} &amp; ${escHtml(fB2 ? fB2.name : '?')}${bWin ? '<br><b class="win-tag">WIN</b>' : (m.isDraw ? '<br><b class="draw-tag">NO CONTEST</b>' : '')}</span></span>
    <span class="stl-lastmatch-meta">MQ ${m.mq}${closeBonus ? '<span class="bonus">接戦+1pt（両者)</span>' : ''}<span class="stl-lastmatch-time">${escHtml(timeStr || '')}</span></span>
  </div>`;
}

function _stlFinalPreviewHtml(finalM) {
  const teamA = _stlOrgTeam(finalM.orgA), teamB = _stlOrgTeam(finalM.orgB);
  const fA1 = _stlFighterOf(finalM.orgA, finalM.teamA.f1Id), fA2 = _stlFighterOf(finalM.orgA, finalM.teamA.f2Id);
  const fB1 = _stlFighterOf(finalM.orgB, finalM.teamB.f1Id), fB2 = _stlFighterOf(finalM.orgB, finalM.teamB.f2Id);
  return `<div class="stl-final-banner">
    <div class="stl-final-label">FINAL</div>
    <div class="stl-final-sub">優勝決定戦</div>
    <div class="stl-final-faceoff">
      <div class="stl-final-side"><span class="faces">${_stlFaceImg(fA1)}${_stlFaceImg(fA2)}</span><span class="nm">${escHtml(fA1 ? fA1.name : '?')} &amp; ${escHtml(fA2 ? fA2.name : '?')}</span><span class="org">${teamA ? escHtml(teamA.orgName) : ''}</span></div>
      <div class="stl-final-vs">VS</div>
      <div class="stl-final-side"><span class="faces">${_stlFaceImg(fB1)}${_stlFaceImg(fB2)}</span><span class="nm">${escHtml(fB1 ? fB1.name : '?')} &amp; ${escHtml(fB2 ? fB2.name : '?')}</span><span class="org">${teamB ? escHtml(teamB.orgName) : ''}</span></div>
    </div>
  </div>`;
}

function _stlUpcomingMatchHtml(m, matchNumber) {
  if (!m) return '';
  const teamA = _stlOrgTeam(m.orgA), teamB = _stlOrgTeam(m.orgB);
  const fA1 = _stlFighterOf(m.orgA, m.teamA.f1Id), fA2 = _stlFighterOf(m.orgA, m.teamA.f2Id);
  const fB1 = _stlFighterOf(m.orgB, m.teamB.f1Id), fB2 = _stlFighterOf(m.orgB, m.teamB.f2Id);
  return `<div class="stl-match-preview">
    <div class="stl-match-preview-label">NEXT MATCH</div>
    <div class="stl-match-preview-round">リーグ 第${matchNumber}試合</div>
    <div class="stl-final-faceoff">
      <div class="stl-final-side"><span class="faces">${_stlFaceImg(fA1)}${_stlFaceImg(fA2)}</span><span class="nm">${escHtml(fA1 ? fA1.name : '?')} &amp; ${escHtml(fA2 ? fA2.name : '?')}</span><span class="org">${teamA ? escHtml(teamA.orgName) : ''}</span></div>
      <div class="stl-final-vs">VS</div>
      <div class="stl-final-side"><span class="faces">${_stlFaceImg(fB1)}${_stlFaceImg(fB2)}</span><span class="nm">${escHtml(fB1 ? fB1.name : '?')} &amp; ${escHtml(fB2 ? fB2.name : '?')}</span><span class="org">${teamB ? escHtml(teamB.orgName) : ''}</span></div>
    </div>
  </div>`;
}

function renderSpringTagLeagueMatchResultPopup(match, isFinal, onContinue) {
  if (!match) { if (onContinue) onContinue(); return; }
  const teamA = _stlOrgTeam(match.orgA), teamB = _stlOrgTeam(match.orgB);
  const membersA = [_stlFighterOf(match.orgA, match.teamA.f1Id), _stlFighterOf(match.orgA, match.teamA.f2Id)].filter(Boolean);
  const membersB = [_stlFighterOf(match.orgB, match.teamB.f1Id), _stlFighterOf(match.orgB, match.teamB.f2Id)].filter(Boolean);
  const winnerSide = match.isDraw ? 'draw' : match.winner === 'teamB' ? 'right' : 'left';
  const winnerFighter = (winnerSide === 'right' ? membersB : membersA)[0];
  const closeBonus = match.mq >= Engine.springTagLeague.MQ_BONUS_THRESHOLD;
  const winnerOrg = winnerSide === 'right' ? match.orgB : match.orgA;
  showEventMatchResultPopup({
    theme: 'spring', title: `${isFinal ? '優勝決定戦' : `リーグ 第${match.round}試合`}　結果`, meta: `第${G.season}回大会 ・ 春のタッグリーグ`,
    progress: isFinal ? 'FINAL' : `${match.round} / ${(G.springTagLeague?.matches || []).length}`, progressLabel: isFinal ? 'CHAMPIONSHIP' : 'LEAGUE',
    context: [['勝者勝点', match.isDraw ? '+1' : '+3'], ['接戦ボーナス', closeBonus ? '+1' : '—'], ['勝利団体', _stlOrgTeam(winnerOrg)?.orgName || '決着つかず']],
    isTag: true, teamLeft: { members: membersA, org: teamA?.orgName || '', orgId: match.orgA }, teamRight: { members: membersB, org: teamB?.orgName || '', orgId: match.orgB }, winnerSide, winnerFighter,
    resultLabel: match.isDraw ? 'NO CONTEST' : isFinal ? 'CHAMPION' : 'TEAM WIN', winAttribution: match.winAttribution, finish: Engine.formatFinish(match.finType, match.finMove), turns: match.turns || 0, mq: match.mq,
    chips: [match.isDraw ? '勝点 +1' : 'リーグ勝点 +3', closeBonus ? '接戦ボーナス +1' : '', isFinal ? '春の王者' : 'リーグ戦'],
    hpLeft: match.conditionAfter?.[match.orgA], hpRight: match.conditionAfter?.[match.orgB], hpLabel: 'TEAM WEAR', footNote: `春タッグ ・ ${_stlOrgTeam(winnerOrg)?.orgName || '決着つかず'}`,
    nextLabel: _matchNextLabel(isFinal), onContinue,
  });
}

/** リーグ表 + 直近試合ストリップ（週12リーグ興行画面のメイン画面。試合ごとにここへ戻ってくる） */
function renderSpringTagLeagueBoard() {
  const p = App._stlPreview;
  if (!p) return;
  const stl = G.springTagLeague;
  if (!stl || !Array.isArray(stl.teams)) return;
  const matches = stl.matches || [];
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  if (!overlay || !box) return;
  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  const idx = p.idx;
  const isFinalReady = p.phase === 'finalReady';
  const progLabel = isFinalReady ? '決勝進出チーム決定'
    : idx === 0 ? '開幕前'
    : `リーグ 第${idx}試合まで終了`;

  // FLIP用: 再描画前の行位置を記録
  const oldRects = {};
  document.querySelectorAll('.stl-league-row').forEach(tr => {
    const org = tr.getAttribute('data-org');
    if (org) oldRects[org] = tr.getBoundingClientRect();
  });

  const standings = _stlComputeStandingsThrough(matches, idx);

  let html = `<div class="stl-wrap">`;
  html += _stlHeaderHtml(progLabel);

  html += `<table class="stl-league-table"><tr><th></th><th>チーム</th><th>戦績</th><th style="text-align:right">勝ち点</th></tr>`;
  standings.forEach(row => {
    const team = _stlOrgTeam(row.orgId);
    if (!team) return;
    const f1 = _stlFighterOf(row.orgId, team.f1Id);
    const f2 = _stlFighterOf(row.orgId, team.f2Id);
    const cond = _stlCurrentCondition(matches, idx, row.orgId);
    const recParts = [];
    if (row.wins) recParts.push(`${row.wins}勝`);
    if (row.losses) recParts.push(`${row.losses}敗`);
    const recText = recParts.length ? recParts.join('') : '——';
    const isMine = row.orgId === 'player';
    const rowCls = `stl-league-row${isMine ? ' is-mine' : ''}${row.rank === 1 ? ' is-rank1' : ''}`;
    html += `<tr class="${rowCls}" data-org="${row.orgId}">
      <td class="stl-league-rank">${row.rank}</td>
      <td><div class="stl-league-pair">
        <span class="stl-league-faces">${_stlFaceImg(f1)}${_stlFaceImg(f2)}</span>
        <span>
          <span class="stl-league-org">${isMine ? '★ 自団体' : escHtml(team.orgName)}</span>
          <span class="stl-league-team-name">${escHtml(f1 ? f1.name : '?')} &amp; ${escHtml(f2 ? f2.name : '?')}</span>
          ${idx > 0 ? `<span class="stl-league-condition">${_stlWearBarHtml(cond)}</span>` : ''}
        </span>
      </div></td>
      <td class="stl-league-rec">${recText}${row.closeBonusCount ? `<span class="stl-league-bonus"> / 接戦+${row.closeBonusCount}</span>` : ''}</td>
      <td class="stl-league-pts">${row.points}<small>pt</small></td>
    </tr>`;
  });
  html += `</table>`;

  if (idx > 0 && !isFinalReady) {
    html += _stlLastMatchStripHtml(matches[idx - 1]);
  }
  if (isFinalReady) {
    html += _stlFinalPreviewHtml(stl.finalMatch);
  } else if (idx < matches.length) {
    html += _stlUpcomingMatchHtml(matches[idx], idx + 1);
  }

  html += `<div class="stl-progress-btn-row">`;
  if (isFinalReady || idx < matches.length) {
    html += `<button class="btn btn-gold" style="padding:10px 26px;font-size:14px" onclick="App.stlWatchMatch()">🎬 観戦する</button>`;
    html += `<button class="btn" style="padding:10px 26px;font-size:14px" onclick="App.stlAdvance()">結果を見る ▶</button>`;
  } else {
    html += `<button class="btn btn-gold" style="padding:10px 26px;font-size:14px" onclick="App.stlAdvance()">決勝へ ▶</button>`;
  }
  html += `</div></div>`; // .stl-progress-btn-row, .stl-wrap

  box.innerHTML = html;
  overlay.classList.add('active');

  // FLIP: 順位入れ替えアニメ + 変動行のフラッシュ
  const lastMatch = idx > 0 ? matches[idx - 1] : null;
  requestAnimationFrame(() => {
    document.querySelectorAll('.stl-league-row').forEach(tr => {
      const org = tr.getAttribute('data-org');
      const old = org ? oldRects[org] : null;
      if (old) {
        const newRect = tr.getBoundingClientRect();
        const dy = old.top - newRect.top;
        if (Math.abs(dy) > 1) {
          tr.style.transition = 'none';
          tr.style.transform = `translateY(${dy}px)`;
          requestAnimationFrame(() => {
            tr.style.transition = 'transform 420ms cubic-bezier(.2,.8,.2,1)';
            tr.style.transform = '';
          });
        }
      }
      if (lastMatch && (org === lastMatch.orgA || org === lastMatch.orgB)) {
        tr.classList.add('is-flash');
        setTimeout(() => tr.classList.remove('is-flash'), 700);
      }
    });
  });
}

/** 優勝発表（Ceremony寄り、JT優勝発表の構成を流用。タッグなので2名対応） */
function renderSpringTagLeagueChampion() {
  const stl = G.springTagLeague;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  if (!overlay || !box) return;
  box.style.maxWidth = '';
  box.style.padding = '';
  box.style.background = '';
  box.style.border = '';

  const champTeam = _stlOrgTeam(stl.champion);
  const runnerTeam = _stlOrgTeam(stl.runnerUp);
  if (!champTeam) { App.finalizeSpringTagLeagueReplay(); return; }
  const f1 = _stlFighterOf(stl.champion, champTeam.f1Id);
  const f2 = _stlFighterOf(stl.champion, champTeam.f2Id);
  const season = G.season;
  const PRIZE = Engine.springTagLeague.PRIZE;
  // タッグ優勝は2名とも主役 → 2名とも吹き出しを持つ(既存の勝利セリフ機構=JT champion timingを流用)
  const line1 = f1 ? getJuniorTournamentLine('champion', f1.personality || 'normal', f1.archetype || '_default') : '';
  const line2 = f2 ? getJuniorTournamentLine('champion', f2.personality || 'normal', f2.archetype || '_default') : '';

  let html = `<div class="pb-container">`;
  html += `<div class="champ th-spring">
    <div class="ch-head">
      <div class="ch-emb"><img src="../image/emblem-spring.png" alt="" onerror="this.style.display='none'"></div>
      <div class="ch-kicker">Spring Tag League / Champion</div>
      <div class="ch-title">春のタッグリーグ</div>
      <div class="ch-meta">第${season}回大会 ・ 総合ベストタッグ</div>
    </div>
    ${_chTeamlineHtml(champTeam.orgId, champTeam.orgName)}
    <div class="ch-role-line"><span class="ch-role-crown">🏆</span><div class="ch-role">優 勝</div></div>
    <div class="ch-duo">
      <div class="ch-lineup-bubs">
        <div class="ch-mem">${_chBubbleSlot(line1)}</div>
        <div class="ch-mem">${_chBubbleSlot(line2)}</div>
      </div>
      <div class="ch-lineup-imgs">
        <div class="ch-mem"><div class="ch-por-wrap"><div class="ch-por">${_chPortraitImg(f1 || { id: null, name: '?' })}</div></div></div>
        <div class="ch-mem"><div class="ch-por-wrap"><div class="ch-por">${_chPortraitImg(f2 || { id: null, name: '?' })}</div></div></div>
      </div>
      <div class="ch-lineup-names">
        <div class="ch-mem"><div class="ch-name">${escHtml(f1 ? f1.name : '?')}</div></div>
        <div class="ch-mem"><div class="ch-name">${escHtml(f2 ? f2.name : '?')}</div></div>
      </div>
    </div>`;

  if (runnerTeam) {
    const r1 = _stlFighterOf(stl.runnerUp, runnerTeam.f1Id);
    const r2 = _stlFighterOf(stl.runnerUp, runnerTeam.f2Id);
    html += `<div class="ch-sub">${_chSubCardHtml('2', r1, runnerTeam.orgId, runnerTeam.orgName, PRIZE.runnerUp)}${_chSubCardHtml('2', r2, runnerTeam.orgId, runnerTeam.orgName, PRIZE.runnerUp)}</div>`;
  }

  html += `<div class="ch-foot">
    <span class="ch-prize">優勝賞金<b>¥${PRIZE.champion}万</b></span>
    <button type="button" class="ch-next" onclick="App.finalizeSpringTagLeagueReplay()">閉じる</button>
  </div>`;
  html += `</div>`; // .champ

  const standing = (stl.standings || []).find(s => s.orgId === 'player');
  if (standing) {
    const prizeByRank = { 1: PRIZE.champion, 2: PRIZE.runnerUp, 3: PRIZE.third, 4: PRIZE.fourth };
    const rankLabel = { 1: '優勝', 2: '準優勝', 3: '3位', 4: '4位' }[standing.rank] || `${standing.rank}位`;
    const amt = prizeByRank[standing.rank] || 0;
    if (amt > 0) {
      html += `<div class="pb-champion-prizebox">
        <div class="pb-champion-prizebox-label">💰 自団体の獲得賞金</div>
        <div class="pb-champion-prizebox-total">${rankLabel} <span>¥${amt}万</span></div>
      </div>`;
    } else {
      html += `<div class="pb-champion-prizebox is-empty">自団体は入賞圏外でした（${rankLabel}）</div>`;
    }
  }

  html += `</div>`; // .pb-container

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── 週11 編成モーダル（Office/Cream、mdl-a-card を土台に使用） ──
function _stlEntryModalHtml() {
  const sel = App._stlEntrySelection || { f1Id: null, f2Id: null };
  const data = Engine.springTagLeague.getEntryCandidates(G);
  const eligible = data.eligible || [];
  const suggestions = data.suggestions || [];
  const season = G.season;

  let html = _mdlAHeader('🌸 春のタッグリーグ 出場チーム編成', `第${season}回大会 ・ 代表タッグ1組`);
  html += `<div class="stl-modal-lead">代表タッグ1組を選出してください。編成しない場合はおまかせ編成（サジェスト1位）で開催されます。</div>`;

  if (suggestions.length > 0) {
    html += `<div class="stl-modal-section-label" style="padding:10px 24px 0">おすすめペア</div>`;
    html += `<div class="stl-suggest-row">`;
    suggestions.forEach(sug => {
      const f1 = eligible.find(f => f.id === sug.f1Id);
      const f2 = eligible.find(f => f.id === sug.f2Id);
      if (!f1 || !f2) return;
      const chemLabel = sug.chemistry >= 70 ? '◎' : sug.chemistry >= 45 ? '◯' : '△';
      html += `<div class="stl-suggest-chip" onclick="App.stlPickSuggestion(${f1.id},${f2.id})">
        <span class="faces">${_stlFaceImg(f1)}${_stlFaceImg(f2)}</span>
        <span>${escHtml(f1.name)} &amp; ${escHtml(f2.name)}</span>
        <span class="chem">${chemLabel}</span>
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="stl-modal-section-label" style="padding:0 24px">出場資格のある選手</div>`;
  html += `<div class="stl-pick-grid">`;
  eligible.forEach(f => {
    const picked = sel.f1Id === f.id || sel.f2Id === f.id;
    const upperUrl = getUpperUrl(f.id);
    const tagCls = _STL_STYLE_CREAM[f.style] || 'tag-cream-neutral';
    html += `<div class="draft-fc cand${picked ? ' picked' : ''}" onclick="App.stlPickFighter(${f.id})">
      <div class="draft-fc-portrait">${upperUrl ? `<img src="${upperUrl}" alt="${escHtml(f.name)}">` : ''}</div>
      <div class="draft-fc-info">
        <div class="draft-fc-name-row"><span class="draft-fc-name">${escHtml(f.name)}</span></div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
          <span class="draft-fc-ovr-label">OVR</span><span class="draft-fc-ovr">${f.ovr}</span>
        </div>
        <div class="draft-fc-meta"><span class="draft-fc-tag ${tagCls}">${escHtml(f.style || '')}</span></div>
      </div>
    </div>`;
  });
  html += `</div>`;

  const f1 = sel.f1Id != null ? eligible.find(f => f.id === sel.f1Id) : null;
  const f2 = sel.f2Id != null ? eligible.find(f => f.id === sel.f2Id) : null;
  let chemLabel = '';
  if (f1 && f2) {
    const pairData = suggestions.find(s => (s.f1Id === f1.id && s.f2Id === f2.id) || (s.f1Id === f2.id && s.f2Id === f1.id));
    if (pairData) chemLabel = pairData.chemistry >= 70 ? '◎' : pairData.chemistry >= 45 ? '◯' : '△';
  }
  html += `<div class="stl-summary-bar">
    <span class="stl-summary-label">選択中</span>
    <span class="stl-summary-names">${f1 ? escHtml(f1.name) : '未選択'} &amp; ${f2 ? escHtml(f2.name) : '未選択'}</span>
    ${chemLabel ? `<span class="stl-summary-chem">相性 ${chemLabel}</span>` : ''}
  </div>`;

  const canConfirm = !!(f1 && f2);
  html += `<div class="stl-modal-footer">
    <button class="btn btn-gold" ${canConfirm ? '' : 'disabled'} onclick="App.stlConfirmTeam()">この2人で確定する</button>
  </div>`;

  return html;
}

// ══════════════════════════════════════════════════════════
//  E-4 4団体勝ち残り対抗戦 UI
//  案1 布陣ボード + 案2 小型クライムライン + 案3 リングサイド
//  spec: docs/ui/03-screens/autumn-gauntlet-war.md
// ══════════════════════════════════════════════════════════

function _agwTeam(orgId) {
  return (G.autumnWar?.teams || []).find(t => t.orgId === orgId) || null;
}

function _agwFighter(orgId, id) {
  if (id == null) return null;
  const roster = orgId === 'player' ? (G.roster || []) : (G.aiOrgs?.[orgId]?.roster || []);
  return roster.find(f => f.id === id) || null;
}

function _agwRenderPhase(phase, html, focusSelector) {
  const overlay = document.getElementById('autumnWarOverlay');
  const screen = document.getElementById('autumnWarScreen');
  if (!overlay || !screen) return false;
  overlay.dataset.phase = phase;
  screen.dataset.phase = phase;
  screen.innerHTML = html;
  overlay.classList.remove('is-suspended');
  overlay.classList.add('active');
  const focusTarget = focusSelector ? screen.querySelector(focusSelector) : screen;
  if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
  return true;
}

function _agwOvrHtml(value, label = 'OVR') {
  const rounded = Math.round(value || 0);
  const cls = typeof valueClassOvr === 'function' ? valueClassOvr(rounded) : '';
  return `<span class="agw-ovr"><small>${escHtml(label)}</small><b class="${cls}">${rounded}</b></span>`;
}

function _agwPlayerOpponent() {
  const pair = _agwBracket().find(item => item.orgA === 'player' || item.orgB === 'player');
  if (!pair) return null;
  return _agwTeam(pair.orgA === 'player' ? pair.orgB : pair.orgA);
}

function _agwBracket() {
  const aw = G.autumnWar;
  if (Array.isArray(aw?.session?.bracket)) return aw.session.bracket;
  if (Array.isArray(aw?.bracket)) return aw.bracket;
  if (typeof Engine !== 'undefined' && typeof Engine.autumnWar?._buildBracket === 'function') return Engine.autumnWar._buildBracket(aw?.teams || [], G);
  return [];
}

function _agwOpponentStrength(team) {
  const values = (team?.memberIds || []).map(id => _agwFighter(team.orgId, id)).filter(Boolean).map(fighter => Engine.util.ov(fighter)).filter(Number.isFinite);
  if (!values.length) return { average: 0, min: 0, max: 0 };
  return {
    average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function renderAutumnWarIntro() {
  const aw = G.autumnWar;
  if (!aw || aw.cancelled) return;
  const bySeed = seed => (aw.teams || []).find(team => team.seed === seed);
  const matchCard = (a, b, label) => `<div class="agw-intro-match"><span>${label}</span><b>${escHtml(a?.orgName || '未定')}</b><em>VS</em><b>${escHtml(b?.orgName || '未定')}</b></div>`;
  const bracket = _agwBracket();
  const semiFinals = bracket.length >= 2
    ? bracket.slice(0, 2).map((pair, index) => matchCard(_agwTeam(pair.orgA), _agwTeam(pair.orgB), `SEMI FINAL ${index + 1}`)).join('')
    : `${matchCard(bySeed(1), bySeed(4), 'SEMI FINAL 1')}${matchCard(bySeed(2), bySeed(3), 'SEMI FINAL 2')}`;
  const html = `<div class="agw-wrap agw-intro">${_agwHeaderHtml('Autumn Survival War', 'WEEK 36・開幕')}
    <div class="agw-intro-lead"><span>今週は</span><strong>4団体勝ち残り対抗戦</strong><p>各団体の3名が、最後の一人になるまでリングを譲らない。</p></div>
    <div class="agw-intro-bracket">${semiFinals}</div>
    <div class="agw-intro-steps" aria-label="勝ち残り戦の3ステップ">
      <div><b>1</b><strong>3名を送り出す</strong><span>先鋒・中堅・大将の順を決める</span></div>
      <div><b>2</b><strong>勝者はリングに残る</strong><span>消耗したまま次の相手と連戦する</span></div>
      <div><b>3</b><strong>3名全員OUTで敗退</strong><span>最後まで選手が残った団体が勝ち上がる</span></div>
    </div>
    <div class="agw-screen-actions"><button type="button" class="btn btn-gold" onclick="App.awBeginEntry()">代表3名の布陣を組む ▶</button></div>
  </div>`;
  _agwRenderPhase('intro', html, '.agw-screen-actions .btn');
}

function _agwHeaderHtml(kicker, meta) {
  return `<div class="agw-header">
    <img class="agw-emblem" src="../image/emblem-autumn.png" alt="" onerror="this.style.display='none'">
    <div class="agw-kicker">${escHtml(kicker)}</div>
    <div class="agw-title">4団体勝ち残り対抗戦</div>
    <div class="agw-meta">SEASON ${G.season} / 第${G.season}回大会${meta ? ` / ${escHtml(meta)}` : ''}</div>
    <div class="agw-rule"></div>
  </div>`;
}

function _agwConditionMeta(value) {
  const v = Math.round(value == null ? Engine.autumnWar.INITIAL_CONDITION : value);
  if (v >= 68) return { value: v, label: '元気', cls: 'is-good' };
  if (v >= 54) return { value: v, label: '疲れが見える', cls: 'is-warn' };
  return { value: v, label: '消耗が大きい', cls: 'is-danger' };
}

function _agwConditionBar(value, mirror) {
  const m = _agwConditionMeta(value);
  const width = Math.max(0, Math.min(100, Math.round(m.value / Engine.autumnWar.CEILING * 100)));
  return `<div class="agw-cond ${mirror ? 'is-mirror' : ''}">
    <div class="agw-cond-top"><span>${m.label}</span><b>${m.value}</b></div>
    <div class="agw-cond-track" role="meter" aria-label="コンディション" aria-valuemin="0" aria-valuemax="${Engine.autumnWar.CEILING}" aria-valuenow="${m.value}"><span class="${m.cls}" style="width:${width}%"></span></div>
  </div>`;
}

function _agwRoleLabel(order, id) {
  const idx = (order || []).indexOf(id);
  return ['先鋒', '中堅', '大将'][idx] || '代表';
}

function _agwTeamViewState(result, matchIndex, boutIndex, team) {
  const matches = result.results || [];
  const current = matches[matchIndex];
  const states = {};
  const conditions = {};
  (team.memberIds || []).forEach(id => {
    states[id] = 'wait';
    conditions[id] = result.conditions?.[id] ?? Engine.autumnWar.INITIAL_CONDITION;
  });

  const prior = matches.slice(0, matchIndex);
  const priorLoss = prior.find(m => m.loserOrg === team.orgId);
  if (priorLoss) {
    (team.memberIds || []).forEach(id => { states[id] = 'out'; });
    return { states, conditions, label: '敗退', remaining: 0 };
  }

  if (!current || (current.orgA !== team.orgId && current.orgB !== team.orgId)) {
    const semiWin = prior.find(m => m.round === 'semiFinal' && m.winnerOrg === team.orgId);
    return { states, conditions, label: semiWin ? '決勝進出' : '出番待ち', remaining: team.memberIds?.length || 0 };
  }

  const revealed = (current.bouts || []).slice(0, boutIndex);
  revealed.forEach(b => {
    [b.left.id, b.right.id].forEach(id => {
      if (b.conditionAfter?.[id] != null) conditions[id] = b.conditionAfter[id];
    });
    if (b.draw) {
      states[b.left.id] = 'out';
      states[b.right.id] = 'out';
    } else {
      const loserId = b.winnerId === b.left.id ? b.right.id : b.left.id;
      states[loserId] = 'out';
    }
  });

  const nextBout = !current.winnerOrg && current.orderA && current.orderB
    ? {
        left: { id: current.orderA[current.aIdx], orgId: current.orgA },
        right: { id: current.orderB[current.bIdx], orgId: current.orgB },
        conditionBefore: {
          [current.orderA[current.aIdx]]: conditions[current.orderA[current.aIdx]],
          [current.orderB[current.bIdx]]: conditions[current.orderB[current.bIdx]],
        },
      }
    : null;
  if (nextBout) {
    [nextBout.left.id, nextBout.right.id].forEach(id => {
      if (states[id] !== 'out') states[id] = 'ring';
      if (nextBout.conditionBefore?.[id] != null) conditions[id] = nextBout.conditionBefore[id];
    });
  }
  const remaining = Object.values(states).filter(v => v !== 'out').length;
  const done = !!current.winnerOrg;
  const label = done
    ? current.winnerOrg === team.orgId ? (current.round === 'final' ? '優勝' : '決勝進出') : '敗退'
    : '対戦中';
  return { states, conditions, label, remaining };
}

function _agwScoreThrough(match, boutIndex) {
  const score = { [match.orgA]: 0, [match.orgB]: 0 };
  (match.bouts || []).slice(0, boutIndex).forEach(b => {
    if (b.winnerId === b.left.id) score[match.orgA] += 1;
    else if (b.winnerId === b.right.id) score[match.orgB] += 1;
  });
  return score;
}

function _agwDisplayOrgIds(match) {
  return { left: match.orgA, right: match.orgB };
}

function _agwOrderFor(match, orgId) {
  return orgId === match.orgA ? match.orderA : match.orderB;
}

function _agwLiveTeamHtml(result, matchIndex, boutIndex, match, orgId, side) {
  const team = _agwTeam(orgId);
  if (!team) return '<div class="agw-live-team"></div>';
  const view = _agwTeamViewState(result, matchIndex, boutIndex, team);
  const order = _agwOrderFor(match, orgId) || team.order || team.memberIds || [];
  const stateOrder = { ring: 0, wait: 1, out: 2 };
  const displayOrder = order.map((id, originalIndex) => ({
    id,
    originalIndex,
    state: view.states[id] || 'wait',
  })).sort((a, b) => (stateOrder[a.state] - stateOrder[b.state]) || (a.originalIndex - b.originalIndex));
  const figures = displayOrder.map(({ id, state }, index) => {
    const fighter = _agwFighter(orgId, id);
    if (!fighter) return '';
    const full = typeof getFullUrl === 'function' ? getFullUrl(id, Engine.util.ov(fighter)) : '';
    return `<div class="agw-live-figure is-${state} agw-live-slot-${index}">
      ${state === 'ring' ? '<span>IN RING</span>' : ''}
      ${full ? `<img src="${full}" alt="${escHtml(fighter.name)}">` : ''}
    </div>`;
  }).join('');
  const names = displayOrder.map(({ id, state }, index) => {
    const fighter = _agwFighter(orgId, id);
    if (!fighter) return '';
    const stateLabel = state === 'out' ? 'OUT' : state === 'ring' ? 'RING' : 'WAIT';
    return `<button type="button" class="agw-live-name is-${state} agw-live-slot-${index}" onclick="event.stopPropagation();showFighterPopup(${id},'autumnWar',true)">
      <small>${_agwRoleLabel(order, id)} / ${stateLabel}</small><b>${escHtml(fighter.name)}</b>
    </button>`;
  }).join('');
  return `<div class="agw-live-team is-${side}">
    <div class="agw-live-lineup">${figures}</div>
    <div class="agw-live-names">${names}</div>
  </div>`;
}

function _agwStatusRailHtml(result, matchIndex, boutIndex) {
  return `<div class="agw-status-rail">${(result.teams || []).map(team => {
    const view = _agwTeamViewState(result, matchIndex, boutIndex, team);
    const active = view.label === '対戦中';
    return `<div class="agw-status-team${active ? ' is-active' : ''}${view.remaining === 0 ? ' is-out' : ''}">
      <small>${escHtml(view.label)} / ${view.remaining}名生存</small><b>${escHtml(team.orgName || '')}</b>
    </div>`;
  }).join('')}</div>`;
}

const _AGW_DIALOGUE_CHANCE = Object.freeze({ preBout: 0.55, survivor: 0.60, champion: 0.75 });

function _agwDialogueRng(kind, parts, chance) {
  const signature = [kind, G.rngSeed || 42, G.season || 1, G.week || 36, ...(parts || [])].join('|');
  let seed = 2166136261;
  for (let i = 0; i < signature.length; i++) {
    seed ^= signature.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const rng = Engine.rng.create(seed | 0);
  return Engine.rng.float(rng) < chance ? rng : null;
}

function _agwPreBoutDialogueHtml(match, next, left, right, displayOrgIds) {
  // 因縁は抽選を通さない。年1回の対抗戦で当たった宿敵が黙っているほうが不自然
  const rivalryHtml = (typeof _rivalryBubblePairHtml === 'function')
    ? _rivalryBubblePairHtml(left.id, right.id, left.name, right.name, 'agw-bout-dialogue') : '';
  if (rivalryHtml) return rivalryHtml;
  const rng = _agwDialogueRng('preBout', [match.round, match.orgA, match.orgB, next.index, left.id, right.id], _AGW_DIALOGUE_CHANCE.preBout);
  if (!rng || typeof getAutumnWarMatchLine !== 'function') return '';
  const timing = match.round === 'final' ? 'preFinal' : 'preMatch';
  const leftLine = getAutumnWarMatchLine(timing, left.personality || 'normal', left.archetype || '_default', rng);
  const rightLine = getAutumnWarMatchLine(timing, right.personality || 'normal', right.archetype || '_default', rng);
  if (!leftLine && !rightLine) return '';
  const dialogueByOrg = {
    [next.left.orgId]: { fighter: left, line: leftLine },
    [next.right.orgId]: { fighter: right, line: rightLine },
  };
  const displayLeft = dialogueByOrg[displayOrgIds.left];
  const displayRight = dialogueByOrg[displayOrgIds.right];
  return `<div class="jt-bub-pair agw-bout-dialogue">
    ${displayLeft?.line ? `<div class="jt-bub"><div class="sp bl">${escHtml(displayLeft.fighter.name)}</div>「${escHtml(displayLeft.line)}」</div>` : ''}
    ${displayRight?.line ? `<div class="jt-bub"><div class="sp gd">${escHtml(displayRight.fighter.name)}</div>「${escHtml(displayRight.line)}」</div>` : ''}
  </div>`;
}

function _agwSurvivorLine(match, bout, winner) {
  if (!winner || bout.draw) return '';
  if (match.winnerOrg) {
    const context = match.round === 'final' ? 'champion' : 'gauntlet';
    const rng = _agwDialogueRng('teamVictory', [match.round, match.orgA, match.orgB, bout.index || match.bouts.length, winner.id], 1);
    const lineSet = typeof AUTUMN_WAR_MVP_LINES !== 'undefined' ? AUTUMN_WAR_MVP_LINES[context] : null;
    const pool = lineSet && typeof getDialoguePool === 'function' ? getDialoguePool(lineSet, winner) : [];
    return pool.length ? pool[Engine.rng.int(rng, 0, pool.length - 1)] : '';
  }
  if (typeof getAutumnWarMatchLine !== 'function') return '';
  const rng = _agwDialogueRng('survivor', [match.round, match.orgA, match.orgB, bout.index || match.bouts.length, winner.id], _AGW_DIALOGUE_CHANCE.survivor);
  if (!rng) return '';
  return getAutumnWarMatchLine('survivor', winner.personality || 'normal', winner.archetype || '_default', rng);
}

function _agwChampionSpeech(result, championTeam) {
  const candidates = (championTeam?.memberIds || []).map(id => _agwFighter(championTeam.orgId, id)).filter(Boolean)
    .sort((a, b) => (result.fighterWins?.[b.id] || 0) - (result.fighterWins?.[a.id] || 0) || a.id - b.id);
  const fighter = candidates[0];
  if (!fighter) return null;
  const wins = result.fighterWins?.[fighter.id] || 0;
  const rng = _agwDialogueRng('champion', [result.champion, fighter.id, wins], _AGW_DIALOGUE_CHANCE.champion);
  if (!rng) return null;
  const lineSet = typeof AUTUMN_WAR_MVP_LINES !== 'undefined' ? AUTUMN_WAR_MVP_LINES.champion : null;
  let pool = [];
  if (lineSet && typeof getDialoguePool === 'function') pool = getDialoguePool(lineSet, fighter);
  let line = pool.length ? pool[Engine.rng.int(rng, 0, pool.length - 1)] : '';
  if (!line && typeof getJuniorTournamentLine === 'function') line = getJuniorTournamentLine('champion', fighter.personality || 'normal', fighter.archetype || '_default', rng);
  if (!line) return null;
  return {
    fighter,
    line: String(line).replaceAll('{wins}', String(wins)).replaceAll('{org}', championTeam.orgName || 'この団体'),
  };
}

function _agwMiniClimbHtml(result, matchIndex, boutIndex) {
  const semis = result.results.filter(m => m.round === 'semiFinal');
  const final = result.results.find(m => m.round === 'final')
    || (result.finalists?.length === 2 ? { round: 'final', orgA: result.finalists[0], orgB: result.finalists[1], bouts: [] } : null);
  const matchDone = m => {
    const idx = result.results.indexOf(m);
    return idx >= 0 && (idx < matchIndex || (idx === matchIndex && !!m.winnerOrg));
  };
  const cell = (m, label) => {
    if (!m) return `<div class="agw-climb-cell"><span>${label}</span><b>進出団体 未決定</b></div>`;
    const done = matchDone(m);
    const a = _agwTeam(m.orgA), b = _agwTeam(m.orgB);
    return `<div class="agw-climb-cell${done ? ' is-done' : ''}"><span>${label}</span><b>${done ? escHtml(_agwTeam(m.winnerOrg)?.orgName || '') : `${escHtml(a?.orgName || '')} vs ${escHtml(b?.orgName || '')}`}</b><small>${done ? 'WINNER' : 'UPCOMING'}</small></div>`;
  };
  return `<div class="agw-climb">
    <div class="agw-climb-semis">${semis.map((m, i) => cell(m, `準決勝 ${i + 1}`)).join('')}</div>
    <div class="agw-climb-line"></div>
    ${cell(final, '決勝')}
  </div>`;
}

function _agwFocusHtml(match, boutIndex, displayOrgIds) {
  const score = _agwScoreThrough(match, boutIndex);
  const next = !match.winnerOrg && match.orderA && match.orderB
    ? {
        index: (match.bouts?.length || 0) + 1,
        left: { id: match.orderA[match.aIdx], orgId: match.orgA },
        right: { id: match.orderB[match.bIdx], orgId: match.orgB },
        conditionBefore: {
          [match.orderA[match.aIdx]]: App._awPreview?.result?.conditions?.[match.orderA[match.aIdx]],
          [match.orderB[match.bIdx]]: App._awPreview?.result?.conditions?.[match.orderB[match.bIdx]],
        },
      }
    : null;
  const last = (match.bouts || []).length > 0 ? match.bouts[match.bouts.length - 1] : null;
  if (!next) {
    const winner = _agwTeam(match.winnerOrg);
    return `<div class="agw-live-complete">
      <div class="agw-focus-kicker">TEAM MATCH COMPLETE</div>
      <div class="agw-focus-winner">${escHtml(winner?.orgName || '')}</div>
      <div class="agw-focus-score">${score[displayOrgIds.left] || 0} — ${score[displayOrgIds.right] || 0}</div>
      <div class="agw-focus-note">${match.round === 'final' ? '秋の総力戦、決着' : '決勝へ勝ち上がる'}</div>
      <button class="btn btn-gold" onclick="App.awAdvanceMatch()">${match.round === 'final' ? '大会結果へ' : '次の団体戦へ'} ▶</button>
    </div>`;
  }
  const engineLeft = _agwFighter(next.left.orgId, next.left.id);
  const engineRight = _agwFighter(next.right.orgId, next.right.id);
  const byOrg = {
    [next.left.orgId]: { fighter: engineLeft, id: next.left.id, condition: next.conditionBefore?.[next.left.id] },
    [next.right.orgId]: { fighter: engineRight, id: next.right.id, condition: next.conditionBefore?.[next.right.id] },
  };
  const displayLeft = byOrg[displayOrgIds.left];
  const displayRight = byOrg[displayOrgIds.right];
  const leftOrder = _agwOrderFor(match, displayOrgIds.left);
  const rightOrder = _agwOrderFor(match, displayOrgIds.right);
  const dialogueHtml = _agwPreBoutDialogueHtml(match, next, engineLeft, engineRight, displayOrgIds);
  const sideHtml = (current, orgId, order, side) => `<div class="agw-bout-side is-${side}">
    <small>第${next.index}フォール・${escHtml(_agwTeam(orgId)?.orgName || '')} / ${_agwRoleLabel(order, current.id)}</small>
    <button type="button" onclick="event.stopPropagation();showFighterPopup(${current.id},'autumnWar',true)">${escHtml(current.fighter?.name || '')}</button>
    ${_agwConditionBar(current.condition, side === 'right')}
  </div>`;
  return `<div class="agw-live-current">
    ${dialogueHtml}
    <div class="agw-bout-strip">
      ${sideHtml(displayLeft, displayOrgIds.left, leftOrder, 'left')}
      <div class="agw-bout-vs">VS</div>
      ${sideHtml(displayRight, displayOrgIds.right, rightOrder, 'right')}
    </div>
    <div class="agw-focus-guide">勝者はリングに残り、敗者側の次の選手が登場</div>
    <div class="agw-live-actions">
      <button type="button" class="btn btn-gold" onclick="App.awWatchBout()">観戦する</button>
      <button type="button" class="btn" onclick="App.awRevealBout()">この試合の結果を見る ▶</button>
      <button type="button" class="btn agw-team-skip" onclick="App.awSkipTeamMatch()">まとめてスキップ</button>
    </div>
    ${last ? `<div class="agw-last-result">前フォール: ${escHtml(last.draw ? '決着つかず' : `${last.winnerId === last.left.id ? last.left.name : last.right.name} 勝利`)} / MQ ${last.mq}</div>` : ''}
  </div>`;
}

function _agwLiveBoardHtml(result, matchIndex, boutIndex, match) {
  const displayOrgIds = _agwDisplayOrgIds(match);
  const score = _agwScoreThrough(match, boutIndex);
  const roundLabel = match.round === 'final' ? 'FINAL' : 'SEMI FINAL';
  return `<section class="agw-live-board">
    <div class="agw-live-head">
      <strong>${escHtml(_agwTeam(displayOrgIds.left)?.orgName || '')}</strong>
      <div><span>${roundLabel} / TEAM SCORE</span><b>${score[displayOrgIds.left] || 0} — ${score[displayOrgIds.right] || 0}</b></div>
      <strong>${escHtml(_agwTeam(displayOrgIds.right)?.orgName || '')}</strong>
    </div>
    <div class="agw-live-stage">
      ${_agwLiveTeamHtml(result, matchIndex, boutIndex, match, displayOrgIds.left, 'left')}
      <div class="agw-live-vs">VS</div>
      ${_agwLiveTeamHtml(result, matchIndex, boutIndex, match, displayOrgIds.right, 'right')}
    </div>
    ${_agwFocusHtml(match, boutIndex, displayOrgIds)}
  </section>`;
}

function renderAutumnWarBoutResultPopup(match, bout, onContinue) {
  if (!match || !bout) { if (onContinue) onContinue(); return; }
  const displayOrgIds = _agwDisplayOrgIds(match);
  const boutSides = {
    [bout.left.orgId]: bout.left,
    [bout.right.orgId]: bout.right,
  };
  const displayLeft = boutSides[displayOrgIds.left];
  const displayRight = boutSides[displayOrgIds.right];
  const left = _agwFighter(displayOrgIds.left, displayLeft.id) || displayLeft;
  const right = _agwFighter(displayOrgIds.right, displayRight.id) || displayRight;
  const winnerSide = bout.draw ? 'draw' : bout.winnerId === right.id ? 'right' : 'left';
  const winner = winnerSide === 'right' ? right : left;
  const winnerCond = bout.conditionAfter?.[winner?.id];
  const score = _agwScoreThrough(match, match.bouts.length);
  const roundLabel = match.round === 'final' ? '決勝' : '準決勝';
  const victoryLine = _agwSurvivorLine(match, bout, winner);
  showEventMatchResultPopup({
    theme: 'autumn', title: `${roundLabel} 第${bout.index || match.bouts.length}フォール　結果`, meta: `${_agwTeam(displayOrgIds.left)?.orgName || ''} vs ${_agwTeam(displayOrgIds.right)?.orgName || ''} ・ スコア ${score[displayOrgIds.left] || 0}–${score[displayOrgIds.right] || 0}`,
    progress: String(bout.index || match.bouts.length), progressLabel: match.winnerOrg ? 'FINAL FALL' : 'FALL',
    context: [['団体スコア', `${score[displayOrgIds.left] || 0}–${score[displayOrgIds.right] || 0}`], ['勝者コンディション', winnerCond != null ? `${Math.round(winnerCond)}%` : '—'], ['戦況', match.winnerOrg ? '団体戦決着' : '続行']],
    left: { ...left, org: _agwTeam(displayOrgIds.left)?.orgName || '', orgId: displayOrgIds.left }, right: { ...right, org: _agwTeam(displayOrgIds.right)?.orgName || '', orgId: displayOrgIds.right },
    winnerSide, winnerFighter: winner, victoryLine, showVictoryLine: !!victoryLine,
    leftRole: `${winnerSide === 'left' ? 'Survivor' : 'Eliminated'} ・ ${_agwRoleLabel(_agwOrderFor(match, displayOrgIds.left), left.id)}`,
    rightRole: `${winnerSide === 'right' ? 'Survivor' : 'Eliminated'} ・ ${_agwRoleLabel(_agwOrderFor(match, displayOrgIds.right), right.id)}`,
    leftStatLabel: 'COND', leftStat: Math.round(bout.conditionAfter?.[left.id] || 0), rightStatLabel: 'COND', rightStat: Math.round(bout.conditionAfter?.[right.id] || 0),
    resultLabel: bout.draw ? 'NO CONTEST' : 'SURVIVE', finish: Engine.formatFinish(bout.finType, bout.finMove), turns: bout.turns || 0, mq: bout.mq,
    chips: [`団体スコア ${score[displayOrgIds.left] || 0}–${score[displayOrgIds.right] || 0}`, match.winnerOrg ? '団体戦決着' : '勝ち残り', roundLabel], hpLeft: bout.conditionAfter?.[left.id], hpRight: bout.conditionAfter?.[right.id], hpLabel: 'CONDITION',
    footNote: `秋団体戦 ・ ${bout.draw ? '決着つかず' : `${winner.name} 生存`}`, nextLabel: _matchNextLabel(false), onContinue,
  });
}

function renderAutumnWarBoard() {
  const p = App._awPreview;
  const result = p?.result;
  const match = result?.results?.[p.matchIndex];
  if (!p || !result || !match) return;
  const roundLabel = match.round === 'final' ? '決勝' : `準決勝 ${Math.max(1, result.results.filter(m => m.round === 'semiFinal').indexOf(match) + 1)}`;
  const displayBout = match.winnerOrg ? match.bouts.length : match.bouts.length + 1;
  let html = `<div class="agw-wrap">${_agwHeaderHtml('Autumn Survival War', `${roundLabel}・第${displayBout}フォール`)}`;
  html += _agwMiniClimbHtml(result, p.matchIndex, p.boutIndex);
  html += _agwLiveBoardHtml(result, p.matchIndex, p.boutIndex, match);
  html += _agwStatusRailHtml(result, p.matchIndex, p.boutIndex);
  html += `</div>`;
  _agwRenderPhase('board', html, '.agw-live-actions .btn, .agw-live-complete .btn');
}

function _agwRecoveredConditions(result, orgId) {
  const team = (result.teams || []).find(t => t.orgId === orgId);
  const values = {};
  (team?.memberIds || []).forEach(id => { values[id] = result.conditions?.[id] ?? Engine.autumnWar.INITIAL_CONDITION; });
  return values;
}

function renderAutumnWarReorder() {
  const p = App._awPreview;
  if (!p || !Array.isArray(p.finalOrder)) return;
  const order = p.finalOrder;
  const activeRole = Math.max(0, Math.min(Engine.autumnWar.TEAM_SIZE - 1, App._awFinalActiveRole || 0));
  const conditions = _agwRecoveredConditions(p.result, 'player');
  const final = p.result.results.find(m => m.round === 'final');
  const opponentId = p.result.finalists?.find(id => id !== 'player')
    || (final?.orgA === 'player' ? final.orgB : final?.orgA);
  const opponent = _agwTeam(opponentId);
  const strength = _agwOpponentStrength(opponent);
  const playerTeam = _agwTeam('player');
  const roles = ['先鋒', '中堅', '大将'];
  const roleNotes = ['最初にリングへ', '流れを引き戻す二番手', '最後に控える団体の柱'];
  const selected = order.map(id => _agwFighter('player', id)).filter(Boolean);
  const eligible = (playerTeam?.memberIds || order).map(id => _agwFighter('player', id)).filter(Boolean);
  const conditionValue = id => Math.round(conditions[id] ?? Engine.autumnWar.INITIAL_CONDITION);
  const opponentSummary = `<div class="agw-entry-opponent-summary"><span>決勝の相手</span><strong>${escHtml(opponent?.orgName || '決勝進出団体')}</strong>${_agwOvrHtml(strength.average, '平均OVR')}<small>OVR幅 ${strength.min}〜${strength.max} / 最終出場順は開戦時に公開</small></div>`;
  const figures = selected.map((fighter, index) => {
    const full = typeof getFullUrl === 'function' ? getFullUrl(fighter.id, Engine.util.ov(fighter)) : '';
    return `<div class="agw-entry-figure" data-order="${index}">${full ? `<img src="${full}" alt="${escHtml(fighter.name)}">` : ''}</div>`;
  }).join('');
  const placeholders = roles.map((role, index) => `<div class="agw-entry-placeholder" data-order="${index}"><span>?</span><b>${role}</b></div>`).join('');
  const opponentSlots = roles.map(() => '<div class="agw-entry-empty-slot" aria-hidden="true"></div>').join('');
  const roleTabs = selected.map((fighter, index) => `<button type="button" class="agw-entry-role-tab${index === activeRole ? ' is-active' : ''}" onclick="App.awSelectFinalRole(${index})"><span>${roles[index]}</span><b>${escHtml(fighter.name)}</b>${_agwOvrHtml(Engine.util.ov(fighter))}${_agwConditionBar(conditionValue(fighter.id), false)}</button>`).join('');
  const finalOrgIds = final ? [final.orgA, final.orgB] : (p.result.finalists || []);
  const playerOnLeft = finalOrgIds[0] === 'player';
  const playerSide = playerOnLeft ? 'left' : 'right';
  const opponentSide = playerOnLeft ? 'right' : 'left';
  const playerPanel = `<div class="agw-entry-team is-player is-${playerSide}"><div class="agw-entry-team-label"><span>YOUR FINAL ORDER</span><b>${escHtml(G.orgName || '自団体')}</b></div><div class="agw-entry-formation">${figures}</div><div class="agw-entry-slot-row">${roleTabs}</div></div>`;
  const opponentPanel = `<div class="agw-entry-team is-opponent is-${opponentSide}"><div class="agw-entry-team-label"><span>FINAL OPPONENT</span><b>${escHtml(opponent?.orgName || '決勝進出団体')}</b></div><div class="agw-entry-formation">${placeholders}</div><div class="agw-entry-slot-row is-opponent">${opponentSlots}</div></div>`;
  const mobileCards = selected.map((fighter, index) => {
    const stand = typeof getStandUrl === 'function' ? getStandUrl(fighter.id, Engine.util.ov(fighter)) : '';
    return `<article class="agw-entry-mobile-card${index === activeRole ? ' is-active' : ''}">
      <button type="button" class="agw-entry-mobile-detail" onclick="event.stopPropagation();showFighterPopup(${fighter.id},'autumnWar',true)">${stand ? `<img src="${stand}" alt="${escHtml(fighter.name)}">` : ''}</button>
      <div class="agw-entry-mobile-info"><span>${roles[index]}</span><button type="button" onclick="event.stopPropagation();showFighterPopup(${fighter.id},'autumnWar',true)">${escHtml(fighter.name)}</button><div>${_agwOvrHtml(Engine.util.ov(fighter))}<small>CONDITION ${conditionValue(fighter.id)}</small></div>${_agwConditionBar(conditionValue(fighter.id), false)}<em>${roleNotes[index]}</em></div>
      <div class="agw-entry-mobile-actions"><button type="button" onclick="App.awSelectFinalRole(${index})">交代</button><button type="button" ${index === 0 ? 'disabled' : ''} onclick="App.awMoveFinal(${index},-1)">↑</button><button type="button" ${index === 2 ? 'disabled' : ''} onclick="App.awMoveFinal(${index},1)">↓</button></div>
    </article>`;
  }).join('');
  const candidates = eligible.map(fighter => {
    const selectedIndex = order.indexOf(fighter.id);
    const stand = typeof getStandUrl === 'function' ? getStandUrl(fighter.id, Engine.util.ov(fighter)) : '';
    return `<article class="agw-entry-candidate is-selected">
      <button type="button" class="agw-entry-candidate-pick" onclick="App.awPickFinalFighter(${fighter.id})">${stand ? `<img src="${stand}" alt="">` : ''}<em>${roles[selectedIndex]}</em></button>
      <button type="button" class="agw-entry-candidate-name" onclick="event.stopPropagation();showFighterPopup(${fighter.id},'autumnWar',true)">${escHtml(fighter.name)}</button>
      <div>${_agwOvrHtml(Engine.util.ov(fighter))}<small>COND ${conditionValue(fighter.id)} / ${escHtml(fighter.style || '')}</small></div>
      ${_agwConditionBar(conditionValue(fighter.id), false)}
    </article>`;
  }).join('');
  const html = `<div class="agw-wrap agw-entry agw-reorder">${_agwHeaderHtml('Final Order', '準決勝後・決勝布陣の再編成')}
    <div class="agw-entry-stage">
      ${playerOnLeft ? playerPanel : opponentPanel}
      <div class="agw-entry-versus">VS</div>
      ${playerOnLeft ? opponentPanel : playerPanel}
    </div>
    <div class="agw-entry-mobile">${opponentSummary}<div class="agw-entry-mobile-head"><strong>L1 — 決勝の先鋒・中堅・大将</strong><span>交代する枠を選び、代表3名を並べ替える</span></div>${mobileCards}</div>
    <div class="agw-entry-candidate-section"><div class="agw-entry-section-head"><strong>準決勝を戦った代表3名</strong><span>枠を選んでから選手を押すと、その位置へ入れ替え</span></div><div class="agw-entry-candidate-rail">${candidates}</div></div>
    <div class="agw-entry-footer">${opponentSummary}<span>準決勝後のコンディションを見て、決勝の出場順を組み直せます。</span><div><button type="button" class="btn" onclick="App.awAutoFinalOrder()">おまかせ</button><button type="button" class="btn btn-gold" onclick="App.awConfirmFinalOrder()">この布陣で決勝へ ▶</button></div></div>
  </div>`;
  _agwRenderPhase('reorder', html, '.agw-entry-footer .btn-gold');
}

function renderAutumnWarResult() {
  const p = App._awPreview;
  if (!p) return;
  if (!p.committed) App._awCommitResult();
  const result = p.result;
  const champ = (result.teams || []).find(t => t.orgId === result.champion);
  const final = result.finalResult;
  const scoreW = final.teamWins?.[result.champion] || 0;
  const scoreL = final.teamWins?.[result.runnerUp] || 0;
  const revenue = result.revenueDistribution;
  const playerShare = revenue?.shares?.find(share => share.orgId === 'player');
  const playerPrize = result.champion === 'player' ? Engine.autumnWar.PRIZE.champion
    : result.runnerUp === 'player' ? Engine.autumnWar.PRIZE.runnerUp : 0;
  const financeHtml = playerShare ? `<div class="agw-result-finance">
    <div><span>${escHtml(revenue.venueName)}・大会総収入</span><strong>¥${revenue.totalPool}万</strong><small>共同興行分配原資 ¥${revenue.gateNet}万 ＋ 各団体の通常型ブランド収入 計¥${revenue.brandRevenue}万</small></div>
    <div class="is-player"><span>自団体の大会収入</span><strong>¥${playerShare.amount + playerPrize}万</strong><small>興行分配 ¥${playerShare.gateAmount}万（均等${playerShare.gateEqual}・延べ出場${playerShare.appearances}人 ${playerShare.gateAppearances}）<br>ブランド ¥${playerShare.brandAmount}万（通常興行基礎${playerShare.brandBase}・結果ボーナス +${Math.round(playerShare.brandBonusRate * 100)}%／${playerShare.brandBonusAmount}）${playerPrize ? `<br>入賞賞金 ¥${playerPrize}万` : ''}</small></div>
  </div>` : '';
  const speech = _agwChampionSpeech(result, champ);
  // U2統一デザイン: 団体優勝(秋4団体対抗戦)は3名を横一列、大将を中央に一回り大きく。全員に吹き出しの予約枠を置く
  const champOrder = (final && champ) ? (final.orgA === champ.orgId ? final.orderA : final.orderB) : null;
  const roleRank = { '先鋒': 0, '大将': 1, '中堅': 2 };
  const members = (champ?.memberIds || [])
    .map(id => ({ id, f: _agwFighter(champ.orgId, id), role: _agwRoleLabel(champOrder || champ?.order || champ?.memberIds, id) }))
    .filter(m => m.f)
    .sort((a, b) => (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9));
  // U3: 隊列は群の外側を1つの枠で囲む(案C)。吹き出し/画像/名前を3段の行に分け、
  // 同じ列(先鋒・大将・中堅)が3段すべてで同じ幅を持つことで-18px重なりが揃う
  const memberRows = members.map(m => {
    const isAce = m.role === '大将';
    const wins = result.fighterWins?.[m.id] || 0;
    const line = speech?.fighter?.id === m.id ? speech.line : '';
    return { m, isAce, wins, line };
  });
  const bubsRow = memberRows.map(({ m, isAce, line }) => `<div class="ch-mem${isAce ? ' is-ace' : ''}">
      <div class="ch-order">${escHtml(m.role)}</div>
      ${_chBubbleSlot(line, 'is-autumn-speech')}
    </div>`).join('');
  const imgsRow = memberRows.map(({ m, isAce }) => `<div class="ch-mem${isAce ? ' is-ace' : ''}">
      <div class="ch-por-wrap">
        <div class="ch-por" style="cursor:pointer" onclick="showFighterPopup(${m.id},'autumnWar')">${_chPortraitImg(m.f)}</div></div>
    </div>`).join('');
  const namesRow = memberRows.map(({ m, wins, isAce }) => `<div class="ch-mem${isAce ? ' is-ace' : ''}">
      <div class="ch-name">${escHtml(m.f.name)}</div>
      <div class="ch-mem-rec">通算${wins}人抜き${m.id === result.mvpId ? ' ・ 大会MVP' : ''}</div>
    </div>`).join('');
  const html = `<div class="agw-wrap agw-result">${_agwHeaderHtml('Survival War Champion', '全団体戦終了')}
    <div class="champ th-autumn">
      ${_chTeamlineHtml(champ?.orgId, champ?.orgName)}
      <div class="ch-role-line"><span class="ch-role-crown">🏆</span><div class="ch-role">優 勝</div></div>
      <div class="ch-trio">
        <div class="ch-lineup-bubs">${bubsRow}</div>
        <div class="ch-lineup-imgs">${imgsRow}</div>
        <div class="ch-lineup-names">${namesRow}</div>
      </div>
      <div class="ch-foot"><span class="ch-prize">優勝賞金<b>¥${Engine.autumnWar.PRIZE.champion}万</b></span></div>
    </div>
    <div class="agw-result-score"><span>FINAL</span><b>${scoreW} — ${scoreL}</b><small>${escHtml(_agwTeam(result.runnerUp)?.orgName || '')}</small></div>
    ${financeHtml}
    <button class="btn btn-gold" onclick="App.awShowMvpScene()">大会MVP発表へ ▶</button>
  </div>`;
  _agwRenderPhase('result', html, '.agw-result > .btn');
}

function _agwMvpLine(fighter, result) {
  const wins = result.fighterWins?.[fighter?.id] || 0;
  const context = wins >= 3 ? 'gauntlet' : result.mvpOrgId === result.champion ? 'champion' : 'defiant';
  const lineSet = typeof AUTUMN_WAR_MVP_LINES !== 'undefined' ? AUTUMN_WAR_MVP_LINES[context] : null;
  let pool = [];
  if (lineSet && typeof getDialoguePool === 'function') pool = getDialoguePool(lineSet, fighter);
  if (!pool.length) pool = ['……この三人で、最後まで立てた。それが全部です'];
  const seed = Math.abs(((G.season || 1) * 131 + (fighter?.id || 0) * 17 + wins * 7) | 0);
  return String(pool[seed % pool.length]).replaceAll('{wins}', String(wins)).replaceAll('{org}', _agwTeam(result.mvpOrgId)?.orgName || 'この団体');
}

function renderAutumnWarMvpScene() {
  const p = App._awPreview;
  const result = p?.result;
  if (!p || !result) return;
  const fighter = _agwFighter(result.mvpOrgId, result.mvpId);
  const upper = fighter && typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
  const wins = result.fighterWins?.[result.mvpId] || 0;
  const line = _agwMvpLine(fighter, result);
  const html = `<div class="agw-mvp-scene">
    <div class="agw-mvp-light"></div>
    <div class="agw-mvp-kicker">MOST VALUABLE WRESTLER</div>
    <div class="agw-mvp-stage">
      <blockquote class="agw-mvp-speech">「${escHtml(line)}」</blockquote>
      <button type="button" class="agw-mvp-portrait" onclick="showFighterPopup(${fighter?.id || 0},'autumnWar')">${upper ? `<img src="${upper}" alt="">` : ''}</button>
      <button type="button" class="agw-mvp-name" onclick="showFighterPopup(${fighter?.id || 0},'autumnWar')"><h2>${escHtml(fighter?.name || '該当選手')}</h2></button>
      <span class="agw-mvp-role">大会MVP</span>
      <small class="agw-mvp-org">${escHtml(_agwTeam(result.mvpOrgId)?.orgName || '')} ・ 通算${wins}人抜き</small>
    </div>
    <button type="button" class="pb-close-btn" onclick="App.finalizeAutumnWarReplay()">大会を終える</button>
  </div>`;
  _agwRenderPhase('mvp', html, '.pb-close-btn');
}

// ── Week36 導入直後の代表編成（専用Stage / Desktop対面 + Mobile L1） ──
function _awEntryScreenHtml() {
  const order = Array.isArray(App._awEntrySelection) ? App._awEntrySelection : [];
  const activeRole = Math.max(0, Math.min(Engine.autumnWar.TEAM_SIZE - 1, App._awEntryActiveRole || 0));
  const eligible = Engine.autumnWar._eligible(G.roster || [])
    .map(f => ({ ...f, ovr: Engine.util.ov(f) }))
    .sort((a, b) => b.ovr - a.ovr || a.id - b.id);
  const roles = ['先鋒', '中堅', '大将'];
  const roleNotes = ['最初にリングへ', '流れを引き戻す二番手', '最後に控える団体の柱'];
  const selected = order.map(id => eligible.find(f => f.id === id)).filter(Boolean);
  const opponent = _agwPlayerOpponent();
  const playerPair = _agwBracket().find(pair => pair.orgA === 'player' || pair.orgB === 'player');
  const playerOnLeft = playerPair?.orgA === 'player';
  const playerSide = playerOnLeft ? 'left' : 'right';
  const opponentSide = playerOnLeft ? 'right' : 'left';
  const strength = _agwOpponentStrength(opponent);
  const opponentSummary = `<div class="agw-entry-opponent-summary"><span>初戦の相手</span><strong>${escHtml(opponent?.orgName || '上位シード待ち')}</strong>${_agwOvrHtml(strength.average, '平均OVR')}<small>OVR幅 ${strength.min}〜${strength.max} / 出場順は開戦時に公開</small></div>`;
  const figures = selected.map((fighter, index) => {
    const full = typeof getFullUrl === 'function' ? getFullUrl(fighter.id, fighter.ovr) : '';
    return `<div class="agw-entry-figure" data-order="${index}">${full ? `<img src="${full}" alt="${escHtml(fighter.name)}">` : ''}</div>`;
  }).join('');
  const placeholders = roles.map((role, index) => `<div class="agw-entry-placeholder" data-order="${index}"><span>?</span><b>${role}</b></div>`).join('');
  const opponentSlots = roles.map(() => '<div class="agw-entry-empty-slot" aria-hidden="true"></div>').join('');
  const mobileCards = selected.map((fighter, index) => {
    const stand = typeof getStandUrl === 'function' ? getStandUrl(fighter.id, fighter.ovr) : '';
    const cond = Math.round(fighter.condition == null ? Engine.autumnWar.INITIAL_CONDITION : fighter.condition);
    return `<article class="agw-entry-mobile-card${index === activeRole ? ' is-active' : ''}">
      <button type="button" class="agw-entry-mobile-detail" onclick="event.stopPropagation();showFighterPopup(${fighter.id},'autumnWar',true)">${stand ? `<img src="${stand}" alt="${escHtml(fighter.name)}">` : ''}</button>
      <div class="agw-entry-mobile-info"><span>${roles[index]}</span><button type="button" onclick="event.stopPropagation();showFighterPopup(${fighter.id},'autumnWar',true)">${escHtml(fighter.name)}</button><div>${_agwOvrHtml(fighter.ovr)}<small>CONDITION ${cond}</small></div><em>${roleNotes[index]}</em></div>
      <div class="agw-entry-mobile-actions"><button type="button" onclick="App.awSelectEntryRole(${index})">交代</button><button type="button" ${index === 0 ? 'disabled' : ''} onclick="App.awMoveEntry(${index},-1)">↑</button><button type="button" ${index === 2 ? 'disabled' : ''} onclick="App.awMoveEntry(${index},1)">↓</button></div>
    </article>`;
  }).join('');
  const roleTabs = selected.map((fighter, index) => `<button type="button" class="agw-entry-role-tab${index === activeRole ? ' is-active' : ''}" onclick="App.awSelectEntryRole(${index})"><span>${roles[index]}</span><b>${escHtml(fighter.name)}</b>${_agwOvrHtml(fighter.ovr)}</button>`).join('');
  const playerPanel = `<div class="agw-entry-team is-player is-${playerSide}"><div class="agw-entry-team-label"><span>YOUR TEAM</span><b>${escHtml(G.orgName || '自団体')}</b></div><div class="agw-entry-formation">${figures}</div><div class="agw-entry-slot-row">${roleTabs}</div></div>`;
  const opponentPanel = `<div class="agw-entry-team is-opponent is-${opponentSide}"><div class="agw-entry-team-label"><span>OPPONENT</span><b>${escHtml(opponent?.orgName || '対戦団体')}</b></div><div class="agw-entry-formation">${placeholders}</div><div class="agw-entry-slot-row is-opponent">${opponentSlots}</div></div>`;
  const candidates = eligible.map(fighter => {
    const selectedIndex = order.indexOf(fighter.id);
    const stand = typeof getStandUrl === 'function' ? getStandUrl(fighter.id, fighter.ovr) : '';
    const cond = Math.round(fighter.condition == null ? Engine.autumnWar.INITIAL_CONDITION : fighter.condition);
    return `<article class="agw-entry-candidate${selectedIndex >= 0 ? ' is-selected' : ''}">
      <button type="button" class="agw-entry-candidate-pick" onclick="App.awPickFighter(${fighter.id})">${stand ? `<img src="${stand}" alt="">` : ''}${selectedIndex >= 0 ? `<em>${roles[selectedIndex]}</em>` : '<em>選出</em>'}</button>
      <button type="button" class="agw-entry-candidate-name" onclick="event.stopPropagation();showFighterPopup(${fighter.id},'autumnWar',true)">${escHtml(fighter.name)}</button>
      <div>${_agwOvrHtml(fighter.ovr)}<small>COND ${cond} / ${escHtml(fighter.style || '')}</small></div>
    </article>`;
  }).join('');
  return `<div class="agw-wrap agw-entry">${_agwHeaderHtml('Select Your Three', '代表3名・先鋒 / 中堅 / 大将')}
    <div class="agw-entry-stage">
      ${playerOnLeft ? playerPanel : opponentPanel}
      <div class="agw-entry-versus">VS</div>
      ${playerOnLeft ? opponentPanel : playerPanel}
    </div>
    <div class="agw-entry-mobile">${opponentSummary}<div class="agw-entry-mobile-head"><strong>L1 — 先鋒・中堅・大将</strong><span>交代する枠を選び、候補棚から選手を選択</span></div>${mobileCards}</div>
    <div class="agw-entry-candidate-section"><div class="agw-entry-section-head"><strong>出場可能選手</strong><span>スタンド画像または名前で詳細を確認</span></div><div class="agw-entry-candidate-rail">${candidates}</div></div>
    <div class="agw-entry-footer">${opponentSummary}<span>OVR昇順で、大将に最強選手を置くのがおまかせ編成です。</span><div><button type="button" class="btn" onclick="App.awAutoEntry()">おまかせ</button><button type="button" class="btn btn-gold" ${order.length === 3 ? '' : 'disabled'} onclick="App.awConfirmEntry()">この布陣で開戦 ▶</button></div></div>
  </div>`;
}

function renderAutumnWarEntry() {
  _agwRenderPhase('entry', _awEntryScreenHtml(), '.agw-entry-footer .btn-gold');
}

// ══════════════════════════════════════════════════════════
//  C-6 天頂戦 UI (quadrennial-ppv-tournament-spec-v0.1 / tenchosen.md)
//  進行の骨格はJTクライムライン(jtc-*)を流用。差分は tc-* クラス。
//  確定ビジュアル: docs/ui/mockups/mockup-ppv-tournament-v0.3.html
// ══════════════════════════════════════════════════════════

function _tcFindFighterAnywhere(id) {
  if (id == null) return null;
  return (G.roster || []).find(f => f.id === id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === id)
    || null;
}

function _tcEditionNo() {
  return Math.max(1, Math.round((G.season || 4) / 4));
}

function _tcOwnPill(orgId) {
  return _jtcOwnPill(orgId === 'player');
}

function _tcRoundLabel(name) {
  return name === 'final' ? '決勝'
    : name === 'semiFinal' ? '準決勝'
    : name === 'quarterFinal' ? '準々決勝' : '1回戦';
}

/** 共通ヘッダー: エンブレム → 冠(小) → 天頂戦(大・金グラデ) → ed行 */
function _tcHeader() {
  return `<div class="jtc-header">
    <img class="jtc-header-emblem" src="../image/emblem-tenchosen.png" alt="" onerror="this.style.display='none'">
    <div class="tc-header-kanmuri">全国女子プロレス最強王者決定戦</div>
    <div class="tc-header-title">天頂戦</div>
    <div class="tc-header-sub">Quadrennial Tournament — 4年に一度の祭典</div>
    <div class="jtc-header-ed">SEASON ${G.season} / 第${_tcEditionNo()}回大会 / 16名トーナメント / 全試合ビッグマッチルール</div>
  </div><div class="jtc-double-rule"></div><div class="jtc-climb-note">▲ Climb to the top — 勝ち上がるほど上へ / 消耗は次の試合へ持ち越し</div>`;
}

/** 丸アイコンフィッター(1回戦・準々決勝)。withOrg=準々決勝のみ所属表示 */
function _tcCircleFx(f, isWin, isLose, withOrg) {
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
  const cls = isWin ? 'w' : isLose ? 'l' : '';
  const img = upperUrl
    ? `<img src="${upperUrl}" alt="" onerror="this.style.display='none'">`
    : `<span class="jtc-ini">${escHtml((f.name || '?')[0])}</span>`;
  const org = withOrg ? `<span class="org">${escHtml(f._orgName || '')}${_tcOwnPill(f.orgId)}</span>` : '';
  const open = ` style="cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${Number(f.id)},'tenchosen',true)"`;
  return `<div class="tc-fx${isLose ? ' is-lose' : ''}"${open}>
    <div class="tc-cir ${cls}">${img}</div>
    <div class="tc-fn">${escHtml(f.name)}${isWin ? ' <span class="jtc-win-tag">WIN</span>' : ''}${org}</div>
  </div>`;
}

/** 2:3矩形フィッター(準決勝md/決勝lg)。jtc-up流用+セル幅は tc-rc-fx で指定 */
function _tcRectFx(f, isWin, isLose) {
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
  const cls = isWin ? 'w' : isLose ? 'l' : '';
  const img = upperUrl
    ? `<img src="${upperUrl}" alt="" onerror="this.style.display='none'">`
    : `<span class="jtc-ini">${escHtml((f.name || '?')[0])}</span>`;
  const open = ` style="cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${Number(f.id)},'tenchosen',true)"`;
  return `<div class="tc-rc-fx${isLose ? ' is-lose' : ''}"${open}>
    <div class="jtc-up ${cls}">${img}</div>
    <div class="tc-fn">${escHtml(f.name)}${isWin ? ' <span class="jtc-win-tag">WIN</span>' : ''}<span class="org">${escHtml(f._orgName || '')}${_tcOwnPill(f.orgId)}</span></div>
  </div>`;
}

/** 次戦タグ(赤) */
function _tcNextTag(cur) {
  return cur ? '<span class="tc-next-tag">▶ 次戦 — 未決着</span>' : '';
}

/** 通常段(1回戦・準々決勝=丸 / 準決勝=矩形md)の行 */
function _tcRowGrid(round, ri, cRd, cMi, isDone, riseClass) {
  const matches = round.matches;
  const isR16 = round.name === 'firstRound';
  const isRect = round.name === 'semiFinal';
  let cells = '';
  matches.forEach((m, mi) => {
    const fin = isDone(ri, mi);
    const cur = ri === cRd && mi === cMi;
    const lWin = fin && m.winnerId === m.left.id;
    const rWin = fin && m.winnerId === m.right.id;
    const fx = isRect
      ? _tcRectFx(m.left, lWin, fin && !lWin) + _tcRectFx(m.right, rWin, fin && !rWin)
      : _tcCircleFx(m.left, lWin, fin && !lWin, !isR16) + _tcCircleFx(m.right, rWin, fin && !rWin, !isR16);
    const seed = isR16 ? `<span class="tc-seed">${m.left.seed || '?'}·${m.right.seed || '?'}</span>` : '';
    cells += `<div class="tc-cell${cur ? ' is-current' : ''}">
      ${seed}${_tcNextTag(cur)}
      <div class="tc-pair">${fx}</div>
      ${fin ? _jtcMinfo(m) : ''}
    </div>`;
  });
  const maxW = isR16 ? '' : isRect ? 'max-width:560px;' : 'max-width:760px;';
  return `<div class="tc-tier-label">${_tcRoundLabel(round.name)}</div>
  <div class="tc-row${isR16 ? ' tc-r16' : ''}${riseClass}" style="grid-template-columns:repeat(${matches.length},1fr);${maxW}">${cells}</div>`;
}

/** 決勝段(矩形lg・VS大) */
function _tcFinalRow(round, ri, cRd, cMi, isDone, riseClass) {
  const match = round.matches[0];
  const fin = isDone(ri, 0);
  const cur = ri === cRd && cMi === 0;
  const lWin = fin && match.winnerId === match.left.id;
  const rWin = fin && match.winnerId === match.right.id;
  return `<div class="tc-tier-label gold">決勝</div>
  <div class="tc-final-row${cur ? ' is-current' : ''}${riseClass}">
    ${_tcNextTag(cur)}
    ${_tcRectFx(match.left, lWin, fin && !lWin)}
    <div class="tc-vs">VS</div>
    ${_tcRectFx(match.right, rWin, fin && !rWin)}
  </div>
  ${fin ? _jtcMinfo(match) : ''}`;
}

/** 出現アニメの一度きりフラグ(JT流儀) */
function _tcMarkRise(tc, key) {
  tc._revealed = tc._revealed || {};
  const isNew = !tc._revealed[key];
  tc._revealed[key] = true;
  return isNew ? ' jtc-rise' : '';
}

/** 頂上(覇者)ブロック。決勝決着後にせり上がり、タップで優勝画面へ */
function _tcPeakBlock(tc, riseClass) {
  const finalMatch = tc.rounds[tc.rounds.length - 1].matches[0];
  const champion = finalMatch.winnerId === finalMatch.left.id ? finalMatch.left : finalMatch.right;
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(champion.id) : '';
  const img = upperUrl
    ? `<img src="${upperUrl}" alt="${escHtml(champion.name)}" onerror="this.style.display='none'">`
    : `<span class="jtc-ini">${escHtml((champion.name || '?')[0])}</span>`;
  return `<div class="jtc-peak${riseClass}" onclick="App.tcGoToFinalResult()">
    <div class="jtc-up jtc-up-peak w">${img}</div>
    <div class="jtc-peak-name">${escHtml(champion.name)}</div>
    <div class="jtc-peak-title">第${_tcEditionNo()}回 天頂戦 覇者</div>
    <div class="jtc-peak-cta">表彰へ ▶</div>
    <div class="jtc-peak-auto-note">1.6秒で自動的に進みます(タップで即スキップ)</div>
  </div>`;
}

/** 頂上空位クレスト(決着前) */
function _tcPeakEmpty() {
  return `<div class="tc-peak-empty">
    <div class="crest">👑</div>
    <div class="cap">第${_tcEditionNo()}回大会覇者</div>
  </div>`;
}

/** フォーカスカード: アッパー画像対面(左右とも非反転)+開始HP(持ち越し)。JT共通部品(_jtcFcCore)を利用 */
function _tcFocusCard(match, roundName, ri, mi) {
  const f1 = match.left, f2 = match.right;
  const isFinal = roundName === 'final';
  const label = isFinal ? '👑 決勝' : `${_tcRoundLabel(roundName)} — 第${mi + 1}試合`;
  const upperL = typeof getUpperUrl === 'function' ? getUpperUrl(f1.id) : '';
  const upperR = typeof getUpperUrl === 'function' ? getUpperUrl(f2.id) : '';
  const pctL = Math.max(1, Math.min(100, Math.round(match.carryLeftPct != null ? match.carryLeftPct : 100)));
  const pctR = Math.max(1, Math.min(100, Math.round(match.carryRightPct != null ? match.carryRightPct : 100)));
  const carryNote = ri > 0 ? `<br>(${ri}試合分持ち越し)` : '';

  return _jtcFcCore({
    label, f1, f2,
    own1: _tcOwnPill(f1.orgId),
    own2: _tcOwnPill(f2.orgId),
    upperL, upperR,
    // 天頂戦に汎用セリフは無い。**因縁のときだけ**口を開く
    extraHtml: (typeof _rivalryBubblePairHtml === 'function')
      ? _rivalryBubblePairHtml(f1.id, f2.id, f1.name, f2.name) : '',
    hpLeftBlock: _jtcFcHpBlock('left', pctL, 100, pctL),
    hpRightBlock: _jtcFcHpBlock('right', pctR, 100, pctR),
    hpMidLabel: `開始HP${carryNote}`,
    onWatch: `App.tcWatchMatch(${ri},${mi})`,
    onSkip: `App.tcSkipMatch(${ri},${mi})`,
  });
}

/** クライムライン本体(頂上〜決勝〜…〜1回戦)。currentRound/currentMatch まで構築 */
function _tcClimbHtml(tc) {
  const rounds = tc.rounds;
  const { currentRound, currentMatch } = tc;
  const finalRi = rounds.length - 1;
  const isMatchDone = (ri, mi) => ri < currentRound || (ri === currentRound && mi < currentMatch);
  const finalDone = isMatchDone(finalRi, 0);
  const maxVisibleRi = Math.min(currentRound, finalRi);

  let html = '';
  if (finalDone) {
    html += _tcPeakBlock(tc, _tcMarkRise(tc, 'peak'));
    html += _jtcMergePeak();
  } else {
    html += _tcPeakEmpty();
    html += `<div class="jtc-merge-peak"><svg viewBox="0 0 20 30" preserveAspectRatio="none"><path d="M10 30 L10 2" style="stroke:rgba(212,168,67,0.35)"/></svg></div>`;
  }

  for (let ri = maxVisibleRi; ri >= 0; ri--) {
    const round = rounds[ri];
    const riseClass = _tcMarkRise(tc, 'r' + ri);
    html += ri === finalRi
      ? _tcFinalRow(round, ri, currentRound, currentMatch, isMatchDone, riseClass)
      : _tcRowGrid(round, ri, currentRound, currentMatch, isMatchDone, riseClass);

    if (ri === currentRound && currentMatch < round.matches.length) {
      html += _tcFocusCard(round.matches[currentMatch], round.name, ri, currentMatch);
    }

    if (ri > 0) {
      const childRound = rounds[ri - 1];
      const hotFlags = childRound.matches.map((cm, cmi) => {
        const parentMi = Math.floor(cmi / 2);
        const parentMatch = round.matches[parentMi];
        return isMatchDone(ri, parentMi) && parentMatch.winnerId === cm.winnerId;
      });
      html += _jtcMergeGrid(childRound.matches.length, hotFlags);
    }
  }
  return html;
}

/** ブラケット画面(P7クライムライン) */
function renderTenchosenBracket() {
  const tc = App._tcPreview;
  if (!tc) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  let html = `<div class="jt-phase">天頂戦</div>`;
  html += `<div class="jt-wrap" style="--jtc-color:var(--gold);--jtc-color-rgb:var(--gold-rgb)">${_tcHeader()}`;
  html += `<div class="tc-scroll"><div class="jtc-climb tc-climb">${_tcClimbHtml(tc)}</div></div>`;

  const curRound = tc.rounds[tc.currentRound];
  if (curRound && tc.currentMatch < curRound.matches.length) {
    html += `<div style="text-align:center;margin-top:12px">
      <button class="btn" style="padding:8px 24px;font-size:12px;opacity:0.6" onclick="App.tcSkipAll()">全試合スキップ →</button>
    </div>`;
  }
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** 勝者の次戦開始HP(回復後)ターゲット。JTの回復バーアニメを流用するための data 属性 */
function _tcRecoveredHpTarget(tc, ri, mi, side) {
  const match = tc.rounds[ri].matches[mi];
  const hp = side === 'left' ? match.hpLeft : match.hpRight;
  if (!hp || !hp.max) return {};
  const isWinner = side === 'left' ? match.winnerId === match.left.id : match.winnerId === match.right.id;
  if (!isWinner || ri + 1 >= tc.rounds.length) return {};
  const next = tc.rounds[ri + 1].matches[Math.floor(mi / 2)];
  if (!next) return {};
  const targetPct = next.left.id === match.winnerId ? next.carryLeftPct
    : next.right.id === match.winnerId ? next.carryRightPct : null;
  if (targetPct == null) return {};
  const pct = Math.max(1, Math.min(100, Math.round(targetPct)));
  return {
    'jt-recover-final': Math.max(1, Math.round(hp.max * pct / 100)),
    'jt-recover-max': hp.max,
    'jt-recover-pct': pct,
  };
}

/** 試合結果画面(Pattern B: pb-container。JT版の天頂戦差し替え) */
function renderTenchosenMatchResult(ri, mi) {
  const tc = App._tcPreview;
  if (!tc) return;
  {
    const rounds = tc.rounds;
    const round = rounds[ri];
    const match = round?.matches?.[mi];
    if (!match) return;
    const total = rounds.reduce((sum, item) => sum + item.matches.length, 0);
    const position = rounds.slice(0, ri).reduce((sum, item) => sum + item.matches.length, 0) + mi + 1;
    const isFinal = round.name === 'final';
    const roundLabel = isFinal ? '決勝' : _tcRoundLabel(round.name);
    const leftFull = _tcFindFighterAnywhere(match.left.id) || match.left;
    const rightFull = _tcFindFighterAnywhere(match.right.id) || match.right;
    const left = { ...leftFull, ..._jtFighterShim(match.left), org: match.left._orgName || '', orgId: match.left.orgId };
    const right = { ...rightFull, ..._jtFighterShim(match.right), org: match.right._orgName || '', orgId: match.right.orgId };
    const leftWins = match.winnerId === match.left.id;
    const winner = leftWins ? left : right;
    const recover = side => {
      if (isFinal) return side === 'left' ? match.hpLeft : match.hpRight;
      const target = _tcRecoveredHpTarget(tc, ri, mi, side);
      return target && target['jt-recover-pct'] != null ? target['jt-recover-pct'] : (side === 'left' ? match.hpLeft : match.hpRight);
    };
    showEventMatchResultPopup({
      theme: 'tenchosen', title: `${roundLabel} 第${mi + 1}試合　結果`, meta: `第${_tcEditionNo()}回 天頂戦 ・ 第${position}試合 / 全${total}試合`,
      progress: `${position} / ${total}`, progressLabel: isFinal ? 'FINAL' : 'QUADRENNIAL',
      context: [['Round', roundLabel], ['次戦', isFinal ? '優勝発表' : '勝ち上がり'], ['4年周期', `第${_tcEditionNo()}回大会`]],
      left, right, winnerSide: leftWins ? 'left' : 'right', winnerFighter: winner,
      leftRole: leftWins ? 'Finalist' : 'Eliminated', rightRole: leftWins ? 'Eliminated' : 'Finalist', resultLabel: isFinal ? 'CHAMPION' : 'ADVANCE',
      finish: Engine.formatFinish(match.finType, match.finMove), turns: match.turns || 0, mq: match.mq,
      chips: [`第${_tcEditionNo()}回天頂戦`, isFinal ? '最強王者' : '次戦進出', `MQ ${match.mq}`], hpLeft: recover('left'), hpRight: recover('right'), hpLabel: isFinal ? 'FINAL HP' : '回復後HP',
      footNote: `天頂戦 ・ ${winner.name} ${isFinal ? '優勝' : '勝ち上がり'}`, nextLabel: _matchNextLabel(isFinal),
      onContinue: () => App.tcAdvanceAfterResult(ri, mi),
    });
    return;
  }
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '';
  box.style.padding = '';
  box.style.background = '';
  box.style.border = '';

  const rounds = tc.rounds;
  const round = rounds[ri];
  const match = round.matches[mi];
  const totalMatches = rounds.reduce((s, r) => s + r.matches.length, 0);
  let matchPos = 0;
  for (let r = 0; r < ri; r++) matchPos += rounds[r].matches.length;
  matchPos += mi + 1;

  const isFinal = round.name === 'final';
  const roundLabel = isFinal ? '👑 決勝' : _tcRoundLabel(round.name);
  const lWin = match.winnerId === match.left.id;
  const winner = lWin ? match.left : match.right;
  const leftF = _jtFighterShim(match.left);
  const rightF = _jtFighterShim(match.right);
  const leftCls = lWin ? 'is-winner' : 'is-loser';
  const rightCls = lWin ? 'is-loser' : 'is-winner';
  const metaLeft = `${match.left._orgName || ''}`.trim() || '—';
  const metaRight = `${match.right._orgName || ''}`.trim() || '—';
  const matchNoLabel = isFinal ? '決勝' : `${_tcRoundLabel(round.name)} 第${mi + 1}試合`;

  let html = `<div class="jt-wrap" style="max-width:640px;padding:0;--jtc-color:var(--gold);--jtc-color-rgb:var(--gold-rgb)">${_tcHeader()}</div>`;
  html += `<div class="pb-container">`;

  html += `<div class="pb-banner">
    <div class="pb-live is-jt">👑 TENCHOSEN</div>
    <div class="pb-banner-title is-jt">${escHtml(roundLabel)}</div>
    <div class="pb-banner-sub">第${_tcEditionNo()}回 天頂戦<span class="dot">·</span>第${matchPos}試合 / 全${totalMatches}試合<span class="dot">·</span>${escHtml(matchNoLabel)}</div>
  </div>`;

  html += `<div class="pb-score-strip" style="grid-template-columns:1fr 1fr 1fr 1.2fr">
    <div class="pb-score-cell">
      <div class="pb-score-val" style="color:var(--gold-light);font-size:20px">${escHtml(roundLabel)}</div>
      <div class="pb-score-lbl">Round</div>
    </div>
    <div class="pb-score-cell">
      <div class="pb-score-val is-neutral">${matchPos}<span style="font-size:14px;color:var(--stage-text-dim)"> / ${totalMatches}</span></div>
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

  html += `<div class="pb-matches">`;
  html += `<div class="pb-divider is-main">${isFinal ? '👑 FINAL' : '⚔ MATCH'} — ${escHtml(roundLabel)}</div>`;
  html += `<div class="pb-mrow is-main is-jt is-tenchosen">`;
  html += _pbFighterBlock('left', leftF, leftCls, metaLeft, '');
  html += _pbResultColumn({
    winnerLabel: `🏆 ${escHtml(winner.name)} WIN`,
    winnerIsDraw: false,
    finishText: Engine.formatFinish(match.finType, match.finMove),
    turns: match.turns || 0,
    mq: match.mq
  });
  html += _pbFighterBlock('right', rightF, rightCls, metaRight, '');
  if (match.hpLeft && match.hpRight) {
    html += _pbHpMini(match.hpLeft, match.hpRight, {
      className: 'is-jt-recovery',
      label: isFinal ? 'HP' : '回復後HP',
      left: _tcRecoveredHpTarget(tc, ri, mi, 'left'),
      right: _tcRecoveredHpTarget(tc, ri, mi, 'right'),
    });
  }
  html += `</div>`;
  html += `<div class="jtc-result-minfo">${_jtcMinfo(match)}</div>`;
  html += `</div>`;

  const nextLabel = _matchNextLabel(isFinal);
  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.tcAdvanceAfterResult(${ri},${mi})">${nextLabel}</button>
  </div>`;
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
  if (!isFinal) setTimeout(_jtAnimateHpRecoveryBars, 350);
}

/** 優勝画面(モックv0.3 優勝演出タブ準拠) */
function renderTenchosenResult() {
  const tc = App._tcPreview;
  if (!tc) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  const finalMatch = tc.rounds[tc.rounds.length - 1].matches[0];
  const champion = finalMatch.winnerId === finalMatch.left.id ? finalMatch.left : finalMatch.right;
  const isPlayerChamp = champion.orgId === 'player';
  const prize = (Engine.ppvTournament.PRIZE && Engine.ppvTournament.PRIZE.champion) || 3000;
  const winCount = tc.rounds.length;
  // 天頂戦には専用の優勝セリフ機構が無いため、JT/秋対抗戦と同じ「優勝タイミング」テーブルを流用する
  const champLine = getJuniorTournamentLine('champion', champion.personality || 'normal', champion.archetype || '_default');

  // U2統一デザイン: 全画面の回転レイズ演出(.tcwn-wrap/.tcwn-rays)は温存し、内側の優勝カードだけ統一デザインへ
  let html = `<div class="tcwn-wrap" onclick="App.tcAfterWinner()">
    <div class="tcwn-rays"></div>
    <div class="champ th-tenchosen">
      <div class="ch-head">
        <div class="ch-emb"><img src="../image/emblem-tenchosen.png" alt="" onerror="this.style.display='none'"></div>
        <div class="ch-kicker">Season ${G.season} — Quadrennial Tournament</div>
        <div class="ch-title">天 頂 戦</div>
        <div class="ch-meta">全国女子プロレス最強王者決定戦 ・ 第${_tcEditionNo()}回</div>
      </div>
      <div class="ch-hero">
        ${_chBubbleSlot(champLine)}
        <div class="ch-por-wrap"><span class="ch-glow"></span><span class="ch-crown">👑</span><div class="ch-por">${_chPortraitImg(champion)}</div></div>
        <div class="ch-name">${escHtml(champion.name)}</div>
        <div class="ch-role">戴冠</div>
        ${_chOrgBadgeHtml(champion.orgId, champion._orgName)}
        <div class="ch-stat"><small>WINS</small>${winCount}</div>
      </div>
      ${isPlayerChamp ? `<div class="ch-foot"><span class="ch-prize">優勝賞金<b>¥${prize.toLocaleString()}万</b></span></div>` : ''}
    </div>
    <div class="tcwn-tap">タップして進む ▶</div>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** 関係性ドラマ: ナレーション(事実記述・固定文) */
function _tcDramaNarration(evClass, winner, loser) {
  if (evClass === 'epic') return '死闘の後、敗者は勝者の前に立った。';
  if (evClass === 'humiliation') return `敗れた${loser.name}は、バックステージで${winner.name}を待っていた。`;
  if (evClass === 'stablemate_rift') return '試合後の控室で、二人の間に言葉は少なかった。';
  return `試合後の控室で、${loser.name}は${winner.name}のもとへ歩み寄った。`;
}

/** 関係性ドラマ: 関係変化チップ */
function _tcDramaChip(evClass, winner, loser) {
  if (evClass === 'epic') return `<span class="tcdr-chip bond">好敵手 — 絆・因縁 ともに上昇(相互)</span>`;
  if (evClass === 'humiliation') return `<span class="tcdr-chip riv">因縁 激発展(${escHtml(loser.name)} → ${escHtml(winner.name)})</span>`;
  if (evClass === 'stablemate_rift') return `<span class="tcdr-chip riv">絆に亀裂</span>`;
  return `<span class="tcdr-chip bond">絆 深化</span>`;
}

/** 関係性ドラマ: 相手側の感情バッジ(非相互時) */
function _tcDramaEmoBadge(evClass) {
  if (evClass === 'humiliation') return '⚡ 因縁を刻まれた';
  if (evClass === 'stablemate_rift') return '…… 亀裂が生まれた';
  return '🤝 絆が深まった';
}

/** 関係性ドラマ: 出演者1名ぶんのカラム(頭上白吹き出し or 感情バッジ + 2:3矩形) */
function _tcDramaActor(fighter, bubbleText, emoBadge, crimson) {
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(fighter.id) : '';
  const top = bubbleText
    ? `<div class="tcdr-bub${crimson ? ' crimson' : ''}"><div class="sp">${escHtml(fighter.name)}</div>「${escHtml(bubbleText)}」</div>`
    : (emoBadge ? `<div class="tcdr-emo">${emoBadge}</div>` : '');
  return `<div class="tcdr-actor">
    ${top}
    <div class="tcdr-rc">${upperUrl ? `<img src="${upperUrl}" alt="" onerror="this.style.opacity=0">` : ''}</div>
    <div class="tcdr-name">${escHtml(fighter.name)}<span class="org">${escHtml(fighter._orgName || '')}${_tcOwnPill(fighter.orgId)}</span></div>
  </div>`;
}

/** 関係性ドラマモーダル(1件ずつ)。idx番目の dramaEvents を表示 */
function renderTenchosenDrama(idx) {
  const tc = App._tcPreview;
  const events = (G.ppvTournament && G.ppvTournament.dramaEvents) || [];
  const ev = events[idx];
  if (!tc || !ev) { App.finalizeTenchosen(); return; }
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  // matchRef からラウンド・対戦を復元(trimmed fighter に name/_orgName/orgId が入っている)
  const round = tc.rounds.find(r => r.name === ev.matchRef.round) || tc.rounds[tc.rounds.length - 1];
  const match = (round.matches && round.matches[ev.matchRef.index]) || round.matches[0];
  const winner = match.winnerId === match.left.id ? match.left : match.right;
  const loser = match.winnerId === match.left.id ? match.right : match.left;
  const roundLabel = round.name === 'final' ? '決勝' : `${_tcRoundLabel(round.name)} 第${ev.matchRef.index + 1}試合`;
  const mqNote = ev.class === 'epic' ? ` (MQ ${match.mq})` : '';

  const lineBySpeaker = {};
  (ev.lines || []).forEach(l => { lineBySpeaker[l.speakerId] = l.text; });
  const crimson = ev.class === 'humiliation' || ev.class === 'stablemate_rift';

  let actors = '';
  if (ev.mutual) {
    actors = _tcDramaActor(loser, lineBySpeaker[loser.id] || '', '', false)
      + _tcDramaActor(winner, lineBySpeaker[winner.id] || '', '', false);
  } else {
    actors = _tcDramaActor(loser, lineBySpeaker[loser.id] || '', '', crimson)
      + _tcDramaActor(winner, '', _tcDramaEmoBadge(ev.class), false)
      + (ev.class === 'humiliation' ? '<div class="tcdr-arrow">→</div>' : '');
  }

  const isLast = idx + 1 >= events.length;
  let html = `<div class="tcdr-wrap">
    <div class="tcdr-head">Aftermath — Backstage</div>
    <div class="tcdr-head-jp">大会が生んだ関係</div>
    <div class="tcdr-card jt-su">
      <div class="tcdr-src">${escHtml(roundLabel)} — ${escHtml(winner.name)} ○ ${escHtml(loser.name)} ×${mqNote}</div>
      <div class="tcdr-narr">${escHtml(_tcDramaNarration(ev.class, winner, loser))}</div>
      <div class="tcdr-stagegrid">${actors}</div>
      <div class="tcdr-chips">${_tcDramaChip(ev.class, winner, loser)}</div>
    </div>
    <div style="text-align:center;margin-top:8px">
      <button class="btn btn-gold" style="padding:9px 28px;font-size:13px" onclick="App.tcNextDrama(${idx + 1})">${isLast ? '閉じる' : '次へ ▶'}</button>
    </div>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** TV観戦モード(orgPop<30): ラウンドごとの勝者一覧+優勝者の簡易リザルト */
function renderTenchosenTVResult() {
  const t = G.ppvTournament;
  if (!t || !t.rounds || !t.rounds.length) { App.finalizeTenchosen(); return; }
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '';
  box.style.padding = '';
  box.style.background = '';
  box.style.border = '';

  const finalMatch = t.rounds[t.rounds.length - 1].matches[0];
  const champion = finalMatch.winnerId === finalMatch.left.id ? finalMatch.left : finalMatch.right;
  const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(champion.id) : '';

  let html = `<div class="jt-wrap" style="max-width:640px;padding:0;--jtc-color:var(--gold);--jtc-color-rgb:var(--gold-rgb)">${_tcHeader()}</div>`;
  html += `<div class="pb-container">`;
  html += `<div class="pb-banner">
    <div class="pb-live is-ppvtv">📺 テレビ観戦</div>
    <div class="pb-banner-title is-ppvtv">天頂戦</div>
    <div class="pb-banner-sub">第${_tcEditionNo()}回大会<span class="dot">·</span>テレビの前で</div>
  </div>`;

  html += `<div class="pb-matches">`;
  t.rounds.forEach(round => {
    const isFinal = round.name === 'final';
    html += `<div class="pb-divider${isFinal ? ' is-main' : ''}">${isFinal ? '👑 ' : ''}${escHtml(_tcRoundLabel(round.name))}</div>`;
    round.matches.forEach(m => {
      const w = m.winnerId === m.left.id ? m.left : m.right;
      const l = m.winnerId === m.left.id ? m.right : m.left;
      html += `<div class="tc-tv-row">
        <span class="w">○ ${escHtml(w.name)}</span><span style="color:var(--stage-text-dim)">(${escHtml(w._orgName || '')})</span>
        <span style="color:var(--stage-text-dim)">—</span>
        <span>× ${escHtml(l.name)}</span><span style="color:var(--stage-text-dim)">(${escHtml(l._orgName || '')})</span>
        <span class="mq">MQ ${m.mq}</span>
      </div>`;
    });
  });
  html += `</div>`;

  html += `<div style="text-align:center;padding:16px 0 4px">
    <div style="width:84px;aspect-ratio:2/3;border-radius:4px;overflow:hidden;margin:0 auto 8px;border:2px solid var(--gold);background:#121110">
      ${upperUrl ? `<img src="${upperUrl}" style="width:100%;height:100%;object-fit:cover;object-position:top" alt="">` : ''}
    </div>
    <div style="font-family:var(--font-label);font-size:10px;letter-spacing:5px;color:var(--gold);text-transform:uppercase">Champion</div>
    <div style="font-size:22px;font-weight:900;color:var(--stage-text-main);margin-top:2px">${escHtml(champion.name)}</div>
    <div style="font-size:11px;color:var(--stage-text-sub);margin-top:2px">${escHtml(champion._orgName || '')} — 第${_tcEditionNo()}回 天頂戦 覇者</div>
  </div>`;

  html += `<div class="pb-footer">
    <button type="button" class="pb-close-btn" onclick="App.finalizeTenchosen()">閉じる</button>
  </div>`;
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

/** 開催前ミニイベント(Week42・数値効果なし・純演出)。コーチ+自団体から1名のセリフを見せる。
 *  語り手は出場圏内から毎回ランダム(Engine.ppvTournament.buildPreEvent)。
 *  以前は上位3名固定で、開催のたびに同じ顔ぶれが並んでいた(2026-07-27 Keisuke)。 */
function renderTenchosenPreEvent() {
  const tp = G.tenchosenPreEvent;
  if (!tp) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  box.style.maxWidth = '100%';
  box.style.padding = '0';
  box.style.background = 'transparent';
  box.style.border = 'none';

  const coach = tp.coach;
  const coachFaceUrl = coach && typeof getCoachPortraitUrl === 'function' ? getCoachPortraitUrl(coach.id) : '';
  const coachHtml = coach ? `
    <div class="tcpe-coach">
      <div class="tcdr-bub"><div class="sp">${escHtml(coach.name)} コーチ</div>「${escHtml(coach.line)}」</div>
      <div class="tc-cir w">${coachFaceUrl
        ? `<img src="${coachFaceUrl}" alt="" onerror="this.style.display='none'">`
        : `<span class="tcpe-coach-face">👩‍🏫</span>`}</div>
      <div class="tcdr-name">${escHtml(coach.name)} コーチ</div>
    </div>` : '';

  const fightersHtml = (tp.fighters || []).map(f => {
    const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
    return `<div class="tcdr-actor">
      <div class="tcdr-bub"><div class="sp">${escHtml(f.name)}</div>「${escHtml(f.line)}」</div>
      <div class="tcdr-rc">${upperUrl ? `<img src="${upperUrl}" alt="" onerror="this.style.opacity=0">` : ''}</div>
      <div class="tcdr-name">${escHtml(f.name)}</div>
    </div>`;
  }).join('');

  const html = `<div class="tcpe-wrap">
    <img class="tcpe-emblem" src="../image/emblem-tenchosen.png" alt="" onerror="this.style.display='none'">
    <div class="tcpe-head-jp">4年に一度の大舞台まで、あと6週</div>
    ${coachHtml}
    <div class="tcpe-fighters">${fightersHtml}</div>
    <div class="tcpe-bt"><button class="btn btn-gold" onclick="App.closeTenchosenPreEvent()">閉じる</button></div>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── 天頂戦 エントリーモーダル(Week43〜) ──────────────────────

function _tcEntryModalHtml() {
  const t = G.ppvTournament;
  if (!t) return '';
  const picks = App._tcEntryPicks || [];
  const slotCount = Engine.ppvTournament.getPlayerSlotCount(G);
  const candidates = Engine.ppvTournament.getPlayerEntryCandidates(G);
  const expected = Math.min(slotCount, candidates.length);
  const champId = G.titles && G.titles.world ? G.titles.world.championId : null;
  const champLocked = champId != null && candidates.some(f => f.id === champId);

  let html = _mdlAHeader('👑 天頂戦 エントリー', `SEASON ${G.season} ・ 第${_tcEditionNo()}回大会 ・ 16名トーナメント`);
  html += `<div class="tc-entry-lead">4年に一度の全国女子プロレス最強王者決定戦。<br>特別招待2名に続き、団体枠 ${expected}名を選出してください。</div>`;

  // 特別招待2名の発表ブロック
  html += `<div class="tc-entry-section-label">特別招待 — 先行確定</div>`;
  html += `<div class="tc-invite-row">`;
  (t.specialInvites || []).forEach(inv => {
    const f = _tcFindFighterAnywhere(inv.id);
    if (!f) return;
    const orgName = typeof Engine.ppvTournament._orgName === 'function'
      ? Engine.ppvTournament._orgName(G, inv.orgId) : '';
    const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(f.id) : '';
    const kindLabel = inv.kind === 'ranking' ? '個人ランキング 1位' : '人気 1位';
    html += `<div class="tc-invite-card" style="cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${Number(f.id)},'tenchosen',true)">
      <div class="tc-invite-kind">${kindLabel}</div>
      <div class="tc-invite-up">${upperUrl ? `<img src="${upperUrl}" alt="">` : ''}</div>
      <div class="tc-invite-name">${escHtml(f.name)}</div>
      <div class="tc-invite-org">${escHtml(orgName)}${_tcOwnPill(inv.orgId)}</div>
    </div>`;
  });
  html += `</div>`;

  // 団体枠の選択
  html += `<div class="tc-entry-section-label">団体枠 — ${expected}名を選出(団体順位による)</div>`;
  html += `<div class="tc-entry-list">`;
  candidates.forEach(f => {
    const ovr = Engine.util.ov(f);
    const isChamp = champLocked && f.id === champId;
    const picked = picks.includes(f.id);
    const full = picks.length >= expected && !picked;
    const cls = `ppv-pick-item${picked ? ' picked' : ''}${full && !isChamp ? ' disabled' : ''}`;
    const click = isChamp ? '' : ` onclick="App.tcTogglePick(${f.id})"`;
    html += `<div class="${cls}" style="border:1px solid var(--stage-border-lit);border-radius:6px;cursor:${isChamp ? 'default' : 'pointer'}"${click}>
      <span style="font-size:18px;width:24px;text-align:center">${picked ? (isChamp ? '👑' : '✅') : '⬜'}</span>
      ${portraitImg(f.id, 40, '', 'roster')}
      <span style="flex:1;font-size:13px;color:var(--stage-text-main)">${escHtml(f.name)}${isChamp ? ' <span style="font-size:10px;color:var(--gold)">王者・出場必須</span>' : ''}</span>
      <span style="font-size:11px;color:var(--stage-text-sub)">OVR ${ovr}</span>
      <span style="font-size:11px;color:var(--stage-text-dim)">人気 ${Math.round(f.popularity || 0)}</span>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="tc-entry-lead" style="font-size:11px;color:var(--stage-text-dim);padding-top:8px">※ 大会当日までに負傷した場合は自動で補充されます。未確定のまま大会週を迎えた場合はおまかせ編成で出場します。</div>`;

  const canConfirm = picks.length === expected;
  html += `<div class="tc-entry-footer">
    <button class="btn" style="padding:9px 18px;font-size:12px" onclick="App.tcSuggestPicks()">おまかせ選出</button>
    <button class="btn btn-gold" style="padding:9px 24px;font-size:13px" ${canConfirm ? '' : 'disabled'} onclick="App.tcConfirmEntries()">エントリー確定（${picks.length}/${expected}名）</button>
  </div>`;
  return html;
}
