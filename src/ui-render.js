// 新聞・DB画面用: クリック可能なキャラクター名リンク
function _newsClickableName(name, characterId) {
  if (!characterId) return name;
  return `<span style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${characterId})">${name}</span>`;
}

// story の headline/body 内のキャラ名をクリック可能にして返す
function _newsStoryClickable(story) {
  let headline = story.headline || '';
  let body = story.body || '';
  // characterId のキャラ名を置換
  if (story.characterId) {
    const ch = ALL_CHARS.find(c => c.id === story.characterId);
    if (ch) {
      const link = _newsClickableName(ch.name, ch.id);
      headline = headline.split(ch.name).join(link);
      body = body.split(ch.name).join(link);
    }
  }
  // warData がある場合: 全選手名をクリック可能に（characterIdで既に処理済みのキャラは重複しない）
  if (story.warData && story.warData.matches) {
    const done = new Set(story.characterId ? [story.characterId] : []);
    story.warData.matches.forEach(m => {
      if (!done.has(m.playerId)) {
        const link = _newsClickableName(m.playerName, m.playerId);
        headline = headline.split(m.playerName).join(link);
        body = body.split(m.playerName).join(link);
        done.add(m.playerId);
      }
      if (!done.has(m.aiId)) {
        const link = _newsClickableName(m.aiName, m.aiId);
        headline = headline.split(m.aiName).join(link);
        body = body.split(m.aiName).join(link);
        done.add(m.aiId);
      }
    });
  }
  // summitData がある場合: 両選手名をクリック可能に
  if (story.summitData) {
    const sd = story.summitData;
    const done = new Set(story.characterId ? [story.characterId] : []);
    if (!done.has(sd.playerId)) {
      body = body.split(sd.playerName).join(_newsClickableName(sd.playerName, sd.playerId));
      done.add(sd.playerId);
    }
    if (!done.has(sd.aiId)) {
      body = body.split(sd.aiName).join(_newsClickableName(sd.aiName, sd.aiId));
    }
  }
  return { headline, body };
}

// v1.9: Roster sort state
let _rosterSortKey = 'ovr';
let _rosterDetailOpenId = null; // 現在展開中のカードID
function setRosterSort(key) { _rosterSortKey = key; renderRoster(); }

// v2.1: Week screen sort state
let _weekSortKey = 'ovr';
let _weekSortDir = 'desc';
let _survivalPanelCollapsed = false;
try {
  _survivalPanelCollapsed = typeof localStorage !== 'undefined' && localStorage.getItem('wm-survival-panel-collapsed') === '1';
} catch (e) {}

function toggleSurvivalPanel(button) {
  _survivalPanelCollapsed = !_survivalPanelCollapsed;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wm-survival-panel-collapsed', _survivalPanelCollapsed ? '1' : '0');
    }
  } catch (e) {}
  const panel = button && button.closest ? button.closest('.survival-panel') : null;
  if (!panel) return;
  panel.classList.toggle('is-collapsed', _survivalPanelCollapsed);
  button.setAttribute('aria-expanded', _survivalPanelCollapsed ? 'false' : 'true');
  button.textContent = _survivalPanelCollapsed ? '＋ 展開' : '− 最小化';
}
window.toggleSurvivalPanel = toggleSurvivalPanel;
let _spActivePicker = null; // showprep v7 picker state: { slotIdx, side } | null
function setWeekSort(key) {
  if (_weekSortKey === key) _weekSortDir = _weekSortDir === 'desc' ? 'asc' : 'desc';
  else { _weekSortKey = key; _weekSortDir = 'desc'; }
  renderWeekScreen();
}
function _weekSortIndicator(key) {
  if (_weekSortKey !== key) return '';
  return _weekSortDir === 'desc' ? ' ▼' : ' ▲';
}
function _getWeekSortValue(c, key) {
  switch (key) {
    case 'ovr': return Engine.util.ov(c);
    case 'cond': return c.condition || 0;
    case 'pop': return c.popularity || 0;
    case 'name': return c.name || '';
    case 'trust': return c.trust || 0;
    case 'schedule': return c.schedule || 'balance';
    default: return 0;
  }
}
// 今週画面ロスター用: OVR ティア決定 (data.js OVR_TIER_THRESHOLDS に準拠)
function _wrOvrTier(v) {
  if (v >= OVR_TIER_THRESHOLDS.mythic)   return { cls: 'mythic',    label: 'SS' };
  if (v >= OVR_TIER_THRESHOLDS.eliteMid) return { cls: 'elite-mid', label: 'S+' };
  if (v >= OVR_TIER_THRESHOLDS.elite)    return { cls: 'elite',     label: 'S'  };
  if (v >= OVR_TIER_THRESHOLDS.eliteLow) return { cls: 'elite-low', label: 'A'  };
  if (v >= OVR_TIER_THRESHOLDS.high)     return { cls: 'high',      label: 'B'  };
  if (v >= OVR_TIER_THRESHOLDS.mid)      return { cls: 'mid',       label: 'C'  };
  if (v >= OVR_TIER_THRESHOLDS.low)      return { cls: 'low',       label: 'D'  };
  return                                        { cls: 'poor',      label: 'E'  };
}
function toggleWeekCheckAll(checked) {
  document.querySelectorAll('.week-check:not(:disabled)').forEach(cb => { cb.checked = checked; });
}
function getCheckedFighterIds() {
  return [...document.querySelectorAll('.week-check:checked')].map(cb => parseInt(cb.dataset.id));
}
function applyWeekPreset(schedule) {
  const ids = getCheckedFighterIds();
  if (ids.length === 0) return;
  ids.forEach(id => {
    const fighter = G.roster.find(c => c.id === id);
    if (!fighter || fighter.injury || fighter.isRental) return;
    fighter.schedule = schedule;
  });
  renderWeekScreen();
}
function batchIntensive(on) {
  const ids = getCheckedFighterIds();
  if (ids.length === 0) return;
  ids.forEach(id => {
    const c = G.roster.find(r => r.id === id);
    if (!c || c.injury || c.isRental || c.onLeave) return;
    if (on) {
      if (c.condition >= GROWTH_CONFIG.intensiveMinCond && c.intensiveWeeks < GROWTH_CONFIG.intensiveMaxConsec) {
        c.intensive = true;
      }
    } else {
      c.intensive = false;
    }
  });
  renderWeekScreen();
}

// Coach-fighter style match helper
function getCoachStyleMatch(coach, fighter) {
  if (!coach || !fighter) return { type: 'none', bonus: 0, label: '', icon: '', cls: 'none' };
  if (coach.style === 'Allround') return { type: 'allround', bonus: 0.05, label: '万能', icon: '○', cls: 'allround' };
  if (coach.style === fighter.style) return { type: 'specialist', bonus: 0.08, label: '一致', icon: '✦', cls: 'specialist' };
  return { type: 'none', bonus: 0, label: '不一致', icon: '', cls: 'none' };
}

function refreshTopBar() {
  // Audio mute button sync
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) muteBtn.textContent = Audio.muted ? '🔇' : '🔊';
  const bgmMuteBtn = document.getElementById('bgmMuteBtn');
  if (bgmMuteBtn) bgmMuteBtn.textContent = Audio.bgmMuted ? '🎵❌' : '🎵';
  // Org icon in top bar
  const orgIconEl = document.getElementById('dispOrgIcon');
  if (orgIconEl) orgIconEl.innerHTML = orgIconHtml('player', 24);
  // MQ再設計P4 §5.3: 大ニュース未読バッジ（既存セーブでフィールドが無ければ静かに非表示）
  const npBadge = document.getElementById('newspaperBadge');
  if (npBadge) npBadge.style.display = G._bigNewsUnread ? '' : 'none';
  // Hide nav during draft/opening
  const navBar = document.querySelector('.nav-bar');
  if (navBar) navBar.style.display = (['draft','opening'].includes(G.weekPhase)) ? 'none' : '';
  // Hide top bar during opening
  const topBar = document.querySelector('.top-bar');
  if (topBar) topBar.style.display = (['draft','opening'].includes(G.weekPhase)) ? 'none' : '';
  // Crisis warning bar (bankruptcy-redesign v1.1)
  const crisisBar = document.getElementById('crisisBar');
  if (crisisBar) {
    const showCrisis = !!G.crisisActive
      && !['draft','opening','gameover'].includes(G.weekPhase)
      && !G.offSeason;
    if (showCrisis) {
      crisisBar.classList.add('active');
      const wkLabel = document.getElementById('crisisWeeksLabel');
      if (wkLabel) wkLabel.textContent = `残り${Math.max(0, G.crisisWeeksRemaining || 0)}週`;
    } else {
      crisisBar.classList.remove('active');
    }
  }
  // Cream theme for draft
  const appEl = document.querySelector('.app');
  if (appEl) { G.weekPhase === 'draft' ? appEl.classList.add('draft-cream') : appEl.classList.remove('draft-cream'); }
  const dateEl = document.getElementById('dispDate');
  if (dateEl) {
    if (G.offSeason) {
      dateEl.textContent = `${G.season}年目 年度末 — オフシーズン ${G.offWeek || 0}/4`;
    } else {
      dateEl.textContent = Engine.util.formatDate(G.season, G.week);
    }
  }
  const fundsEl = document.getElementById('dispFunds');
  fundsEl.textContent = `${Math.round(G.funds).toLocaleString()}万`;
  fundsEl.className = `info-val ${G.funds >= 0 ? 'positive' : 'negative'}`;
  const _dispPopEl = document.getElementById('dispPop');
  const _dispPopVal = Engine.util.dispOrgPop(G.orgPop);
  _dispPopEl.textContent = _dispPopVal;
  _dispPopEl.style.color = _orgPopColor(_dispPopVal).color;
  // v1.5s25b: 補助金カウントダウン
  const subsidyEl = document.getElementById('dispSubsidy');
  if (subsidyEl) {
    const popInt = Engine.util.dispOrgPop(G.orgPop);
    if (popInt < 40 && G.difficultyMode !== 'hard') {
      const subsidyAmt = Engine.economy.getSubsidy(G.orgPop, G.difficultyMode);
      const remaining = 40 - popInt;
      const tipHtml = `<strong style="color:var(--gold)">🏛️ 地域振興助成金</strong><br>
現在の支給額: <strong style="color:#2ecc71">+${subsidyAmt}万/週</strong>（自動）<br>
<span style="color:#aaa">人気があと<strong style="color:#fff">${remaining}pt</strong>上がると打ち切り</span><br><br>
<span style="color:#aaa;font-size:11px">打ち切り後はスポンサー収入が<br>10万 → <strong style="color:#fff">30万/週</strong>に増えます</span>`;
      subsidyEl.textContent = `補助金あと${remaining}pt`;
      subsidyEl.style.display = '';
      subsidyEl.style.cursor = 'pointer';
      subsidyEl.onmouseover = (e) => { e.stopPropagation(); showCustomTooltip(subsidyEl, tipHtml); };
      subsidyEl.onmouseout = () => hideCustomTooltip();
      subsidyEl.onclick = (e) => { e.stopPropagation(); showCustomTooltip(subsidyEl, tipHtml); };
    } else { subsidyEl.style.display = 'none'; }
  }
  const heat = getHeatLevel();
  const heatEl = document.getElementById('dispHeat');
  const heatAnimCls = heat.anim ? ` class="${heat.anim}"` : '';
  heatEl.innerHTML = `<span style="color:${heat.color}"${heatAnimCls}>${heat.emoji} ${heat.label}</span>`;
  // v0.9: Rank display
  const rankings = G.rankings || [];
  const pRank = Engine.ranking.getPlayerRank(rankings);
  const rankEl = document.getElementById('dispRank');
  if (rankEl) {
    const rColor = pRank === 1 ? 'var(--gold)' : pRank === 2 ? '#e74c3c' : pRank === 3 ? '#9b59b6' : '#2ecc71';
    rankEl.innerHTML = `<span style="color:${rColor}">${pRank}位/${rankings.length}</span>`;
  }
  const champEl = document.getElementById('dispChamp');
  const champ = getWorldChampion();
  champEl.innerHTML = champ ? `<span style="display:inline-flex;align-items:center;gap:6px">${portraitImg(champ.id, 28)}<span>🏆 ${fLink(champ, {source:'roster', bold:false, size:'15px'})} (${G.titles.world.defenses}防衛)</span></span>` : '<span style="color:var(--text-dim)">🏆 空位</span>';
}

// ╔══════════════════════════════════════════════════╗
// ║  OPENING SCENE — 社長就任の儀式                    ║
// ╚══════════════════════════════════════════════════╝
let _openingAct = 0;
let _openingOverlay = null;
let _openingTransitioning = false;

function renderOpeningScreen() {
  const el = document.getElementById('weekContent');
  el.innerHTML = ''; // 本体は空 — オーバーレイで描画

  // 既存オーバーレイがあれば除去
  if (_openingOverlay) { _openingOverlay.remove(); _openingOverlay = null; }

  const orgName = G.orgName || 'プレイヤー団体';
  const fixed = Engine.draft.getFixedInfo();
  const name1 = fixed[0]?.name || '???';
  const name2 = fixed[1]?.name || '???';
  const upper1 = getUpperUrl(fixed[0]?.id);
  const upper2 = getUpperUrl(fixed[1]?.id);
  const orgLengthClass = orgName.length >= 16 ? ' is-long' : orgName.length >= 11 ? ' is-medium' : '';

  _openingAct = 0;
  _openingTransitioning = false;

  // ── Acts データ ──
  const acts = [
    // 幕1: 旗を揚げる
    `<div class="opening-act" id="openingAct0">
      <div class="opening-act-line">
        今、ひとつの団体が旗を揚げようとしている。<br>
        団体の名は
        <span class="opening-org-line${orgLengthClass}">「<span class="org">${orgName}</span>」。</span>
      </div>
    </div>`,
    // 幕2: 弱小団体としての宣言
    `<div class="opening-act" id="openingAct1" style="display:none">
      <div class="opening-act-line">
        後ろ盾があるわけではない。<br>
        期待されているわけでもない。<br>
        いつまで経営が続くかわからない弱小団体。
      </div>
      <div class="opening-act-line question">
        業界へ爪痕を残すことはできるだろうか。
      </div>
    </div>`,
    // 幕3: 仲間の紹介
    `<div class="opening-act" id="openingAct2" style="display:none">
      <div class="opening-portraits">
        <div class="opening-portrait left">
          ${upper1 ? `<img src="${upper1}" alt="${name1}">` : ''}
          <div class="opening-portrait-name">${name1}</div>
        </div>
        <div class="opening-portrait right">
          ${upper2 ? `<img src="${upper2}" alt="${name2}">` : ''}
          <div class="opening-portrait-name">${name2}</div>
        </div>
      </div>
      <div class="opening-act-line">
        新団体旗揚げの噂を聞きつけ、集まったのは2名。<br>
        <span style="font-family:'Noto Sans JP',sans-serif;font-weight:700;letter-spacing:0.1em">${name1}</span>と<span style="font-family:'Noto Sans JP',sans-serif;font-weight:700;letter-spacing:0.1em">${name2}</span>。<br>
        彼女たちと共に、ここから業界への挑戦が始まる。
      </div>
    </div>`,
    // 幕4: ドラフトへの導入
    `<div class="opening-act" id="openingAct3" style="display:none">
      <div class="opening-act-line">
        さらに3名。<br>
        立ち上げメンバーを選びに行こう。
      </div>
    </div>`
  ];

  // ── オーバーレイ構築 ──
  const overlay = document.createElement('div');
  overlay.className = 'opening-overlay';
  overlay.innerHTML = `
    <div class="opening-vignette"></div>
    ${acts.join('')}
    <div class="opening-click-hint">CLICK TO CONTINUE</div>
  `;
  document.body.appendChild(overlay);
  _openingOverlay = overlay;

  // skip リンク
  const skip = document.createElement('div');
  skip.className = 'opening-skip';
  skip.textContent = '>> skip';
  skip.onclick = (e) => { e.stopPropagation(); _finishOpening(); };
  document.body.appendChild(skip);
  overlay._skipEl = skip;

  // クリックで進行
  overlay.addEventListener('click', _advanceOpening);

  // ESCキーでスキップ
  overlay._escHandler = (e) => { if (e.key === 'Escape') _finishOpening(); };
  document.addEventListener('keydown', overlay._escHandler);

  // 幕1をフェードイン
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const act0 = document.getElementById('openingAct0');
      if (act0) act0.classList.add('show');
    });
  });
}

function _advanceOpening() {
  if (_openingTransitioning) return;
  const nextAct = _openingAct + 1;
  if (nextAct >= 4) { _finishOpening(); return; }

  _openingTransitioning = true;
  const currentEl = document.getElementById('openingAct' + _openingAct);
  if (currentEl) currentEl.classList.remove('show');

  // 前の文章を完全に隠してから次を表示し、二重描画を防ぐ。
  setTimeout(() => {
    if (currentEl) currentEl.style.display = 'none';
    _openingAct = nextAct;
    const nextEl = document.getElementById('openingAct' + _openingAct);
    if (!nextEl) { _openingTransitioning = false; return; }
    nextEl.style.display = '';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextEl.classList.add('show');
        setTimeout(() => { _openingTransitioning = false; }, 700);
      });
    });
  }, 450);
}

function _finishOpening() {
  _openingTransitioning = false;
  // クリーンアップ
  if (_openingOverlay) {
    if (_openingOverlay._escHandler) document.removeEventListener('keydown', _openingOverlay._escHandler);
    if (_openingOverlay._skipEl) _openingOverlay._skipEl.remove();
    _openingOverlay.classList.add('hidden');
    setTimeout(() => { if (_openingOverlay) { _openingOverlay.remove(); _openingOverlay = null; } }, 900);
  }
  // draft フェーズに遷移
  G.weekPhase = 'draft';
  refreshAll();
}

// ══════════════════════════════════════════════════════════
//  season-retrospective-spec Phase 1: シーズン総括(オフシーズン・レポート)
//  Engine.seasonReview.build(G) の結果を寒色黒金の証書レイアウトへ描画する。
// ══════════════════════════════════════════════════════════

/** 単一系列(ゴールド)の折れ線+塗り+最新点強調 SVG。dataviz準拠: dual-axis禁止・凡例なし */
function _srChartSvg(values) {
  if (!values || values.length < 2) return '';
  const w = 340, h = 140, x0 = 30, x1 = 320, yTop = 15, yBase = 120;
  const vMin = Math.min(...values, 0);
  const vMax = Math.max(...values, 0);
  const range = (vMax - vMin) || 1;
  const n = values.length;
  const px = i => x0 + (n === 1 ? 0 : (i * (x1 - x0) / (n - 1)));
  const py = v => yTop + (yBase - yTop) * (1 - (v - vMin) / range);
  const pts = values.map((v, i) => [px(i), py(v)]);
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const areaD = `${lineD} L${last[0].toFixed(1)},${yBase} L${pts[0][0].toFixed(1)},${yBase} Z`;
  const gid = 'srg' + Math.abs(Math.round(vMax * 7 + n * 13)).toString(36);
  const dots = pts.slice(0, -1).map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--gold)"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <line x1="${x0}" y1="${yBase}" x2="${x1}" y2="${yBase}" stroke="var(--sr-grid)"/>
    <line x1="${x0}" y1="${(yTop + yBase) / 2}" x2="${x1}" y2="${(yTop + yBase) / 2}" stroke="var(--sr-grid)"/>
    <line x1="${x0}" y1="${yTop}" x2="${x1}" y2="${yTop}" stroke="var(--sr-grid)"/>
    <path d="${areaD}" fill="url(#${gid})" opacity="0.55"/>
    <path d="${lineD}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4.5" fill="var(--gold-light)" stroke="var(--sr-void)" stroke-width="1.5"/>
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gold)" stop-opacity="0.35"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></linearGradient></defs>
  </svg>`;
}

/** 資金推移チャートのX軸ラベル(開幕→締め、間は空白で等間隔に見せる) */
function _srFundsXLabels(n) {
  if (n <= 1) return '';
  const mid = ['春', '夏', '秋'];
  const labels = new Array(n).fill('');
  labels[0] = '開幕';
  labels[n - 1] = '締め';
  // 中間点にざっくり季節ラベルを均等配置(演出上の目安。厳密な週対応ではない)
  for (let i = 1; i < mid.length + 1 && i < n - 1; i++) {
    const idx = Math.round((i * (n - 1)) / (mid.length + 1));
    if (idx > 0 && idx < n - 1) labels[idx] = mid[i - 1];
  }
  return labels.map(l => `<span>${l}</span>`).join('');
}

/** シーズン総括画面本体を描画する。review = Engine.seasonReview.build(G) の結果 */
function _renderSeasonReview(review, state) {
  let h = '';
  h += `<div class="sr-stage">`;
  h += `<span class="sr-tick sr-tl"></span><span class="sr-tick sr-tr"></span><span class="sr-tick sr-bl"></span><span class="sr-tick sr-br"></span>`;

  // ── MASTHEAD ──
  h += `<div class="sr-masthead">
    <div class="sr-eyebrow">Season<span class="sr-dot"></span>Review</div>
    <div class="sr-season-title">${state.season}年目 総括</div>
    <div class="sr-sub">Annual Record</div>
  </div>`;

  // ── VERDICT ──
  let deltaHtml = '';
  if (review.prevRank != null) {
    const up = review.rank < review.prevRank;
    const down = review.rank > review.prevRank;
    const arrow = up ? '▲' : down ? '▼' : '=';
    deltaHtml = `<span class="sr-delta${down ? ' sr-down' : ''}">${arrow} 前年 ${review.prevRank}位</span>`;
  }
  const heroImg = review.hero ? getStandUrl(review.hero.id, review.hero.ovr) : '';
  h += `<div class="sr-verdict">
    <div class="sr-verdict-l">
      <div class="sr-seal"><span class="sr-w">${review.headline}</span></div>
      <div class="sr-rank-line"><span class="sr-num">${review.rank}</span><span class="sr-suf">位</span>${deltaHtml}</div>
      <div class="sr-rank-cap">Final Standing — 最終順位</div>
      <div class="sr-lead">${review.lead}</div>
    </div>
    <div class="sr-portrait">
      <span class="sr-frame-tick sr-tl"></span><span class="sr-frame-tick sr-tr"></span>
      ${heroImg ? `<img src="${heroImg}" alt="" onerror="this.style.display='none'">` : ''}
      ${review.hero ? `<div class="sr-plaque"><div class="sr-role">${review.hero.role}</div><div class="sr-nm">${review.hero.name}</div></div>` : ''}
    </div>
  </div>`;

  // ── §I 今季を彩った記録 ──
  if (review.records && review.records.length > 0) {
    h += `<div class="sr-section">
      <div class="sr-sec-head"><span class="sr-idx">I</span><span class="sr-t">今季を彩った記録</span><span class="sr-rule"></span></div>
      <div class="sr-strip">`;
    review.records.forEach(r => {
      h += `<div class="sr-card">
        <span class="sr-card-tag">${r.tag}</span>
        <img class="sr-card-img" src="${getUpperUrl(r.id)}" alt="" onerror="this.style.display='none'">
        <div class="sr-card-body">
          <div class="sr-card-nm">${r.name}</div>
          <div class="sr-card-meta">${r.meta}</div>
          <div class="sr-card-narr">${r.narr}</div>
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // ── §II 経営の一年 ──
  h += `<div class="sr-section">
    <div class="sr-sec-head"><span class="sr-idx">II</span><span class="sr-t">経営の一年</span><span class="sr-rule"></span></div>
    <div class="sr-chart-grid">`;
  if (review.popHistory && review.popHistory.length >= 2) {
    const vals = review.popHistory.map(p => p.orgPop);
    const cur = vals[vals.length - 1];
    const d = Math.round(cur - vals[vals.length - 2]);
    h += `<div class="sr-chart-card">
      <div class="sr-chart-head"><span class="sr-chart-title">団体人気の歩み — 旗揚げから</span>
        <span class="sr-chart-now">${Math.round(cur)}${d !== 0 ? `<span class="sr-d${d < 0 ? ' sr-down' : ''}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</span>` : ''}</span></div>
      <div class="sr-chart">${_srChartSvg(vals)}</div>
      <div class="sr-chart-x">${review.popHistory.map((p, i) => `<span>${(i === 0 || i === review.popHistory.length - 1) ? p.season + '年目' : p.season}</span>`).join('')}</div>
    </div>`;
  }
  if (review.fundsCurve && review.fundsCurve.length >= 2) {
    const cur = review.fundsCurve[review.fundsCurve.length - 1];
    h += `<div class="sr-chart-card">
      <div class="sr-chart-head"><span class="sr-chart-title">資金の推移 — 今季</span>
        <span class="sr-chart-now" style="font-size:18px">${Math.round(cur).toLocaleString()}<span style="font-family:'Oswald';font-size:9px;color:var(--sr-ink-dim)">万</span></span></div>
      <div class="sr-chart">${_srChartSvg(review.fundsCurve)}</div>
      <div class="sr-chart-x">${_srFundsXLabels(review.fundsCurve.length)}</div>
    </div>`;
  }
  {
    const rev = review.finance.revenue, exp = review.finance.expense, net = review.finance.net;
    const maxV = Math.max(rev, exp, 1);
    h += `<div class="sr-chart-card sr-full">
      <div class="sr-chart-head"><span class="sr-chart-title">今季の収支</span></div>
      <div class="sr-pl-row"><span class="sr-pl-lbl">収入</span><div class="sr-pl-track"><div class="sr-pl-fill sr-rev" style="width:${Math.max(4, Math.round(rev / maxV * 100))}%">${rev.toLocaleString()}万</div></div></div>
      <div class="sr-pl-row"><span class="sr-pl-lbl">支出</span><div class="sr-pl-track"><div class="sr-pl-fill sr-exp" style="width:${Math.max(4, Math.round(exp / maxV * 100))}%">${exp.toLocaleString()}万</div></div></div>
      <div class="sr-pl-net">純益<b${net < 0 ? ' class="sr-negnet"' : ''}>${net >= 0 ? '+' : ''}${net.toLocaleString()}万</b></div>
    </div>`;
  }
  h += `</div></div>`;

  // ── §III 顔ぶれの変化 ──
  const ro = review.roster || {};
  const departures = ro.departures || [];
  const joins = ro.joins || [];
  if (departures.length > 0 || joins.length > 0 || ro.grew || ro.declined) {
    h += `<div class="sr-section">
      <div class="sr-sec-head"><span class="sr-idx">III</span><span class="sr-t">顔ぶれの変化</span><span class="sr-rule"></span></div>
      <div class="sr-roster-grid">`;
    if (departures.length > 0 || joins.length > 0) {
      h += `<div><div class="sr-rc-h">出 入 り</div>`;
      departures.forEach(d => {
        h += `<div class="sr-rc-item"><img class="sr-rc-thumb" src="${getUpperUrl(d.id)}" alt="" onerror="this.style.display='none'">
          <div><div class="sr-rc-nm">${d.name}</div><div class="sr-rc-sub">${d.age != null ? d.age : '?'} / ${d.note}</div></div>
          <span class="sr-rc-tag sr-retire">引退</span></div>`;
      });
      joins.forEach(j => {
        h += `<div class="sr-rc-item"><img class="sr-rc-thumb" src="${getUpperUrl(j.id)}" alt="" onerror="this.style.display='none'">
          <div><div class="sr-rc-nm">${j.name}</div><div class="sr-rc-sub">${j.age != null ? j.age : '?'} / ${j.note}</div></div>
          <span class="sr-rc-tag sr-join">加入</span></div>`;
      });
      h += `</div>`;
    }
    if (ro.grew || ro.declined) {
      h += `<div><div class="sr-rc-h">成 長 と 陰 り</div>`;
      if (ro.grew) {
        h += `<div class="sr-rc-item"><img class="sr-rc-thumb" src="${getUpperUrl(ro.grew.id)}" alt="" onerror="this.style.display='none'">
          <div><div class="sr-rc-nm">${ro.grew.name}</div><div class="sr-rc-sub">最も伸びた選手</div></div>
          <span class="sr-rc-delta sr-up">+${Math.round(ro.grew.delta)}</span></div>`;
      }
      if (ro.declined) {
        h += `<div class="sr-rc-item"><img class="sr-rc-thumb" src="${getUpperUrl(ro.declined.id)}" alt="" onerror="this.style.display='none'">
          <div><div class="sr-rc-nm">${ro.declined.name}</div><div class="sr-rc-sub">陰りの見えた選手</div></div>
          <span class="sr-rc-delta sr-down">${Math.round(ro.declined.delta)}</span></div>`;
      }
      h += `</div>`;
    }
    h += `</div></div>`;
  }

  // ── §IV 団体ランキングと来季 ──
  const rankingsArr = review.rankings || [];
  const maxRating = Math.max(...rankingsArr.map(r => r.rating), 1);
  h += `<div class="sr-section" style="margin-bottom:8px">
    <div class="sr-sec-head"><span class="sr-idx">IV</span><span class="sr-t">団体ランキングと来季</span><span class="sr-rule"></span></div>
    <div class="sr-rank-bars">`;
  rankingsArr.forEach((r, i) => {
    const pct = Math.max(4, Math.round(r.rating / maxRating * 100));
    h += `<div class="sr-rank-bar${r.isPlayer ? ' sr-me' : ''}"><span class="sr-medal">${i + 1}</span><div class="sr-track"><div class="sr-fill" style="width:${pct}%">${r.name}</div></div><span class="sr-pt">${Math.round(r.rating).toLocaleString()}</span></div>`;
  });
  h += `</div>`;
  h += `<div class="sr-closing">${review.closing}</div>`;
  h += `</div>`; // section IV

  h += `</div>`; // sr-stage
  return h;
}

function _renderWeekSeasonTrack(week, offSeason = false, offWeek = 0) {
  const info = Engine.util.getSeasonInfo(week);
  const filledThrough = offSeason ? Engine.util.WEEKS_PER_SEASON : info.week;
  const labels = Engine.util.SEASON_DEFINITIONS.map(season => `
    <div class="week-season-quarter${!offSeason && season.quarter === info.quarter ? ' is-active' : ''}">
      <strong>${season.emoji}${season.name}</strong>
      <span>${season.months.join('·')}</span>
    </div>`).join('');
  const cells = Array.from({ length: Engine.util.WEEKS_PER_SEASON }, (_, index) => {
    const cellWeek = index + 1;
    const classes = [
      'week-season-cell',
      cellWeek <= filledThrough ? 'is-filled' : '',
      !offSeason && cellWeek === info.week ? 'is-current' : '',
    ].filter(Boolean).join(' ');
    return `<span class="${classes}"></span>`;
  }).join('');
  const ariaLabel = offSeason
    ? `年間48週完了、年度末オフシーズン${offWeek}/4`
    : `${info.label} 第${info.weekInQuarter}週、年間第${info.week}週`;
  return `<div class="week-season-card${offSeason ? ' is-offseason' : ''}">
    <div class="week-season-labels">${labels}</div>
    <div class="week-season-track" role="img" aria-label="${ariaLabel}">${cells}</div>
    <div class="week-season-bridge">年度末ブリッジ ${offWeek}/4</div>
  </div>`;
}

function renderWeekScreen() {
  if (typeof App !== 'undefined' && App.repairProgressionState && App.repairProgressionState('renderWeekScreen')) {
    try { Storage.autoSave(); } catch (_e) {}
  }
  const el = document.getElementById('weekContent');
  let html = '';

  // ── OPENING PHASE ──
  if (G.weekPhase === 'opening') {
    renderOpeningScreen();
    return;
  }

  // ── DRAFT PHASE (CREAM THEME) ──
  if (G.weekPhase === 'draft') {
    document.getElementById('weekTitle').textContent = '';
    const fixed = Engine.draft.getFixedInfo();
    const candidates = Engine.draft.getCandidateInfo();
    const picks = G._draftPicks || [];
    const focusId = G._draftFocus || null;

    // ── Helpers ──
    const STYLE_META = {
      Grappler:   {color:'#bb8fce',icon:'GRP',desc:'投げ技と関節技を軸にした正統派。パワーとテクニックに優れる',cream:'tag-cream-grappler'},
      Striker:    {color:'#e74c3c',icon:'STK',desc:'打撃主体のファイター。パワーとスピードで圧倒する',cream:'tag-cream-striker'},
      Submission: {color:'#e67e22',icon:'SUB',desc:'関節技のスペシャリスト。テクニックで相手を仕留める',cream:'tag-cream-submission'},
      Aerial:     {color:'#2ecc71',icon:'AER',desc:'空中殺法と俊敏な動きで試合をコントロール',cream:'tag-cream-aerial'},
      Allround:   {color:'#f1c40f',icon:'ALL',desc:'万能型。突出した弱点がなく安定した試合運びが可能',cream:'tag-cream-allround'},
      Brawler:    {color:'#e88a82',icon:'BRW',desc:'喧嘩殺法。パワーとスタミナでゴリ押す荒くれ者',cream:'tag-cream-brawler'}
    };
    const ROLE_META = {
      Babyface: {color:'#8bc4f0',label:'ベビーフェイス',icon:'BF',cream:'tag-cream-bf'},
      Heel:     {color:'#f08b9e',label:'ヒール',icon:'HL',cream:'tag-cream-heel'},
      Neutral:  {color:'#b0b8c4',label:'ニュートラル',icon:'NT',cream:'tag-cream-neutral'}
    };

    function makeAvatar(c, size) {
      const sm = STYLE_META[c.style] || STYLE_META.Allround;
      const pUrl = getPortraitUrl(c.id);
      if (pUrl) {
        return `<div style="position:relative;flex-shrink:0">
          <img src="${pUrl}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid ${sm.color}88" alt="${c.name}">
          <span style="position:absolute;bottom:-2px;right:-2px;font-size:${Math.round(size*0.15)}px;font-weight:700;background:${sm.color};color:#fff;border-radius:3px;padding:1px 3px;line-height:1">${sm.icon}</span>
        </div>`;
      }
      const initial = c.name.charAt(0);
      return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,${sm.color}33,${sm.color}11);border:2px solid ${sm.color}88;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative">
        <span style="font-size:${Math.round(size*0.45)}px;font-weight:900;color:${sm.color}">${initial}</span>
        <span style="position:absolute;bottom:-2px;right:-2px;font-size:${Math.round(size*0.15)}px;font-weight:700;background:${sm.color};color:#fff;border-radius:3px;padding:1px 3px;line-height:1">${sm.icon}</span>
      </div>`;
    }

    // ── Cream theme helpers ──
    function makeCreamStatBars(c) {
      const stats = [
        {key:'pw',short:'PW',cls:'bar-cream-pw'},
        {key:'sp',short:'SP',cls:'bar-cream-sp'},
        {key:'te',short:'TE',cls:'bar-cream-te'},
        {key:'st',short:'ST',cls:'bar-cream-st'},
        {key:'mn',short:'MN',cls:'bar-cream-mn'}
      ];
      return `<div class="draft-stat-bars">${stats.map(s => {
        const val = c[s.key]; const w = Math.min(100, val);
        return `<div class="draft-stat-row">
          <span class="draft-stat-key">${s.short}</span>
          <div class="draft-stat-bar"><div class="draft-stat-bar-fill ${s.cls}" style="width:${w}%"></div></div>
          <span class="draft-stat-val">${val}</span>
        </div>`;
      }).join('')}</div>`;
    }

    function analyzeStrengths(c) {
      const stats = {pw:c.pw,sp:c.sp,te:c.te,st:c.st,mn:c.mn};
      const labels = {pw:'パワー',sp:'スピード',te:'テクニック',st:'スタミナ',mn:'マインド'};
      const sorted = Object.entries(stats).sort((a,b) => b[1] - a[1]);
      const best = sorted.slice(0,2).filter(([,v]) => v >= 50);
      const worst = sorted.slice(-1).filter(([,v]) => v < 60);
      return {
        strengths: best.map(([k,v]) => `<span class="strong">${labels[k]}${v}</span>`),
        weaknesses: worst.map(([k,v]) => `<span class="weak">${labels[k]}${v}</span>`)
      };
    }

    // §3.5: 現在の選択コストを事前計算
    const currentCost = Engine.draft.getSelectionCost(G.rngSeed || 42, picks);
    const remainingBudget = (G.funds || 0) - currentCost;
    const orgName = G.orgName || 'プレイヤー団体';

    // ── Draft paper wrapper ──
    html += `<div class="draft-paper">`;

    // 新聞バー
    html += `<div class="paper-bar">
      <span class="paper-bar-name">WRESTLING OBSERVER</span>
      <span class="paper-bar-issue">SPECIAL EDITION</span>
    </div>`;

    // キャプション
    html += `<div class="paper-caption">数字は推定値。本当の姿は、リングの上でしか分からない。</div>`;

    // 持ち越しナレーション
    html += `<div class="draft-narration">
      <p>さらに3名。<br>立ち上げメンバーを選びに行こう。</p>
      <div class="small">候補6名の中から3名を選び、5名の所属選手でシーズンを開始する</div>
    </div>`;

    html += `<div class="draft-body">`;

    // ── FIRST ROSTER — 設立メンバー ──
    html += `<div class="draft-sec-label">
      <span class="draft-sec-label-en">FIRST ROSTER</span>
      <span class="draft-sec-label-jp">設立メンバー</span>
      <span class="draft-sec-label-rule"></span>
    </div>`;

    html += `<div class="draft-roster-grid">`;
    for (const c of fixed) {
      const sm = STYLE_META[c.style] || STYLE_META.Allround;
      const rm = ROLE_META[c.role] || ROLE_META.Neutral;
      const {strengths, weaknesses} = analyzeStrengths(c);
      const upperUrl = getUpperUrl(c.id);
      html += `<div class="draft-fc fixed">
        <div class="draft-fc-portrait">${upperUrl ? `<img src="${upperUrl}" alt="${c.name}">` : ''}</div>
        <div class="draft-fc-info">
          <div class="draft-fc-name-row">
            <span class="draft-fc-name">${c.name}</span>
            <span class="draft-fc-age">${c.age || 17}歳 / ${c.h}cm</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
            <span class="draft-fc-ovr-label">OVR</span>
            <span class="draft-fc-ovr">${c.ovr}</span>
          </div>
          <div class="draft-fc-meta">
            <span class="draft-fc-tag ${sm.cream}">${c.style}</span>
            <span class="draft-fc-tag ${rm.cream}">${rm.label}</span>
          </div>
          ${makeCreamStatBars(c)}
          <div class="draft-analysis">
            ${strengths.length ? '強み: ' + strengths.join(', ') : ''}
            ${weaknesses.length ? (strengths.length ? ' / ' : '') + '課題: ' + weaknesses.join(', ') : ''}
          </div>
          <div class="draft-coach-quote">${c.coachEval.emoji} 将来性: ${c.coachEval.text}</div>
        </div>
      </div>`;
    }
    html += `</div>`; // roster-grid

    // ── CANDIDATES — 候補選手 ──
    html += `<div class="draft-sec-label">
      <span class="draft-sec-label-en">CANDIDATES</span>
      <span class="draft-sec-label-jp">候補選手（${picks.length}/${DRAFT_CONFIG.pickCount}名選択済）</span>
      <span class="draft-sec-label-rule"></span>
    </div>`;

    html += `<div class="draft-cand-grid">`;
    for (const c of candidates) {
      const picked = picks.includes(c.id);
      const full = picks.length >= DRAFT_CONFIG.pickCount && !picked;
      const tooExpensive = !picked && (c.assessedValue || 0) > remainingBudget;
      const disabled = full || tooExpensive;
      const sm = STYLE_META[c.style] || STYLE_META.Allround;
      const rm = ROLE_META[c.role] || ROLE_META.Neutral;
      const {strengths, weaknesses} = analyzeStrengths(c);
      const upperUrl = getUpperUrl(c.id);

      html += `<div class="draft-fc cand${picked ? ' picked' : ''}${disabled ? ' disabled' : ''}"
        onclick="${disabled ? '' : `App.toggleDraftPick(${c.id})`}">
        <div class="draft-fc-portrait">${upperUrl ? `<img src="${upperUrl}" alt="${c.name}">` : ''}</div>
        <div class="draft-fc-info">
          <div class="draft-fc-name-row">
            <span class="draft-fc-name">${c.name}</span>
            <span class="draft-fc-age">${c.age || 17}歳</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
            <span class="draft-fc-ovr-label">OVR</span>
            <span class="draft-fc-ovr">${c.ovr}</span>
          </div>
          <div class="draft-fc-meta">
            <span class="draft-fc-tag ${sm.cream}">${c.style}</span>
            <span class="draft-fc-tag ${rm.cream}">${rm.label}</span>
          </div>
          ${makeCreamStatBars(c)}
          <div class="draft-analysis">
            ${strengths.length ? '強み: ' + strengths.join(', ') : ''}
            ${weaknesses.length ? (strengths.length ? ' / ' : '') + '課題: ' + weaknesses.join(', ') : ''}
          </div>
          <div class="draft-coach-quote">${c.coachEval.emoji} 将来性: ${c.coachEval.text}</div>
          <div class="draft-contract-fee">契約金: <strong>${c.assessedValue || 0}</strong> 万
            ${tooExpensive ? '<span style="color:#922b21;font-weight:700;margin-left:6px">資金不足</span>' : ''}</div>
        </div>
      </div>`;
    }
    html += `</div>`; // cand-grid

    // ── Confirm area ──
    const canConfirm = picks.length === DRAFT_CONFIG.pickCount;
    const canAfford = Engine.draft.canAffordSelection(G, picks, G.rngSeed);
    const confirmReady = canConfirm && canAfford;

    html += `<div class="draft-confirm-area">
      <div class="budget-info">
        契約金合計 <span class="num">${currentCost}</span> 万 ／ 残り資金 <span class="num">${remainingBudget}</span> 万
      </div>
      <button class="btn-draft-confirm" ${confirmReady ? 'onclick="App.completeDraft()"' : 'disabled'}>
        ${!canConfirm ? `あと${DRAFT_CONFIG.pickCount - picks.length}名選んでください` :
          !canAfford ? '資金不足 — より安い候補を選んでください' :
          `この5名でシーズン開始`}
      </button>
    </div>`;

    html += `</div>`; // draft-body
    html += `</div>`; // draft-paper

    el.innerHTML = html;
    return;
  }

  // ── OFFSEASON DISPLAY ──
  if (G.weekPhase === 'offseason') {
    const offW = G.offWeek || 0;
    document.getElementById('weekTitle').textContent = offW === 0
      ? 'オフシーズン突入'
      : `オフシーズン ${offW}/4`;

    html += `<div class="week-overview-card">${_renderWeekSeasonTrack(48, true, offW)}</div>`;

    // Progress bar
    html += `<div style="margin-bottom:16px">
      <div style="display:flex;gap:4px;margin-bottom:8px">
        ${[1,2,3,4].map(i => `<div style="flex:1;height:6px;border-radius:3px;background:${i <= offW ? 'var(--gold)' : 'var(--bg-card)'};transition:background 0.3s"></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim)">
        <span>レポート</span><span>ドラフト</span><span>移籍</span><span>開幕</span>
      </div>
    </div>`;

    // season-retrospective-spec: シーズン総括(ANNUAL RECORD)。offWeek 0〜1 の一枚レポート
    if (offW <= 1) {
      const review = Engine.seasonReview.build(G);
      html += _renderSeasonReview(review, G);
    } else {
      // offWeek 2以降(ドラフト/移籍/開幕準備週)は従来どおりgameLogフィルタ+ランキング要約を表示
      const recentEvents = (G.gameLog || []).filter(e => typeof e === 'string' && (e.includes('オフシーズン') || e.includes('シーズン') || e.includes('引退') || e.includes('獲得') || e.includes('移籍') || e.includes('衰退') || e.includes('成長')));
      const offEvents = recentEvents.slice(-15);
      if (offEvents.length > 0) {
        html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px;max-height:300px;overflow-y:auto">';
        html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">📋 オフシーズンレポート</h4>';
        offEvents.forEach(ev => {
          const isHighlight = typeof ev === 'string' && (ev.includes('引退') || ev.includes('獲得') || ev.includes('移籍'));
          html += `<div style="font-size:11px;padding:2px 0;color:${isHighlight ? 'var(--text-main)' : 'var(--text-sub)'}">${ev}</div>`;
        });
        html += '</div>';
      }

      if (G.rankings && G.rankings.length > 0) {
        html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px">';
        html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">🏆 現在のランキング</h4>';
        G.rankings.forEach((r, i) => {
          const isPlayer = r.orgId === 'player';
          html += `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;${isPlayer ? 'color:var(--gold);font-weight:700' : 'color:var(--text-sub)'}">
            <span>${i+1}位 ${r.name}</span><span>${Math.round(r.rating)}pt</span>
          </div>`;
        });
        html += '</div>';
      }
    }

    const nextLabels = ['シーズンレポートへ →', 'ドラフト会議へ →', '移籍ウィンドウへ →', '新シーズン開幕 →'];
    const nextLabel = nextLabels[offW] || `オフシーズン第${offW + 1}週へ →`;
    const nextLabelOverrides = {
      1: '次へ →',
    };
    const btnClass = offW >= 3 ? 'btn-gold' : 'btn-blue';
    html += `<div class="btn-row" style="margin-top:16px"><button class="btn ${btnClass}" onclick="advanceWeek()">${nextLabelOverrides[offW] || nextLabel}</button></div>`;

    el.innerHTML = html;
    return;
  }

  // ── REGULAR WEEK DISPLAY ──
  const stlBlocked = _stlIsLeagueWeek();
  const agwBlocked = _agwIsEventWeek();
  const jtBlocked = _jtIsEventWeek();
  const specialEventBlocked = stlBlocked || agwBlocked || jtBlocked;
  const isShow = isShowWeek(G.week) && !specialEventBlocked;
  const special = isSpecialShow(G.week) && !specialEventBlocked;
  const ppv = isPPV(G.week);
  let typeLabel = stlBlocked ? '🌸 春のタッグリーグ' : agwBlocked ? '⚔️ 4団体勝ち残り対抗戦' : jtBlocked ? '🏟️ ジュニアトーナメント' : isShow ? (ppv ? '🏆 PPV' : special ? '⭐ 特別興行' : '🎤 興行週') : '📋 非興行週';
  document.getElementById('weekTitle').textContent = G.offSeason ? `オフシーズン ${G.offWeek}/4` : typeLabel;

  html = '';

  if (G.weekPhase === 'manage') {
    // ── v0.95: Dashboard Panel ──
    const pRank = G.rankings && G.rankings.length ? Engine.ranking.getPlayerRank(G.rankings) : '-';
    const stats = G.seasonStats || {};
    const fh = G.fundsHistory || [];
    // Mini sparkline: last 12 data points
    const spark = fh.slice(-12);
    const sparkMin = Math.min(...spark, 0);
    const sparkMax = Math.max(...spark, 1);
    const sparkH = 24;
    const sparkW = 80;
    const sparkPoints = spark.map((v, i) => `${Math.round(i * sparkW / Math.max(spark.length - 1, 1))},${sparkH - Math.round(((v - sparkMin) / (sparkMax - sparkMin || 1)) * sparkH)}`).join(' ');

    // Upcoming events
    const upcomingItems = [];
    const nextShow = (() => { for (let w = G.week; w <= 48; w++) if (isShowWeek(w)) return w; return null; })();
    if (nextShow && nextShow > G.week) upcomingItems.push(`🎤 次の興行: 第${nextShow}週`);
    else if (nextShow === G.week) upcomingItems.push('🎤 今週は興行週！');
    if (isPPV(G.week)) upcomingItems.push('🏆 PPV週！');
    else { const ppvW = (() => { for (let w = G.week+1; w <= 48; w++) if (isPPV(w)) return w; return null; })(); if (ppvW) upcomingItems.push(`🏆 PPV: 第${ppvW}週`); }
    if (!isPPV(G.week)) {
      if (isSpecialShow(G.week)) upcomingItems.push('⭐ 今週は特別興行！（試合枠+1）');
      else { const spW = (() => { for (let w = G.week+1; w <= 48; w++) if (isSpecialShow(w) && !isPPV(w)) return w; return null; })(); if (spW) upcomingItems.push(`⭐ 特別興行: 第${spW}週`); }
    }
    if (G.pendingNegotiation) {
      const remainW = G.pendingNegotiation.resolveWeek - G.week;
      upcomingItems.push(`🤝 交渉中: ${G.pendingNegotiation.fighterName}（残${remainW}週）`);
    }

    html += `<div class="week-overview-grid">
      <!-- Season Progress -->
      <div class="week-overview-card">${_renderWeekSeasonTrack(G.week)}</div>
      <!-- Mini Ranking + Finance -->
      <div class="week-overview-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;color:var(--text-dim)">ランキング <strong style="color:${pRank===1?'var(--gold)':pRank===2?'#e74c3c':pRank===3?'#9b59b6':'#2ecc71'};font-size:14px">#${pRank}</strong></span>
          <span style="font-size:11px;color:var(--text-dim)">資金 <strong style="color:${G.funds>=0?'#2ecc71':'#e74c3c'};font-size:13px">${Math.round(G.funds).toLocaleString()}万</strong></span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end">
          <div style="font-size:12px;color:var(--text-dim)">
            興行${stats.showCount||0}回 ｜ MQ最高${stats.bestMQ||0}${stats.eventsWon ? ` ｜ 抗争${stats.eventsWon}勝` : ''}
          </div>
          <svg width="${sparkW}" height="${sparkH}" style="opacity:0.6"><polyline points="${sparkPoints}" fill="none" stroke="${G.funds>=0?'#2ecc71':'#e74c3c'}" stroke-width="1.5"/></svg>
        </div>
      </div>
    </div>`;

    // v1.9: Month-to-date finance summary (during non-month-end manage weeks)
    const _cycleNum = Math.ceil(G.week / 4);
    const _monthStart = (_cycleNum - 1) * 4 + 1;
    const manageBuf = (G.financeHistory || []).filter(h => h.season === G.season && h.week >= _monthStart && h.week < G.week);
    if (manageBuf.length > 0) {
      let mIncome = 0, mExpense = 0;
      manageBuf.forEach(e => { mIncome += (e.income || 0); mExpense += (e.expense || 0); });
      const mNet = mIncome - mExpense;
      const netColor = mNet >= 0 ? '#2ecc71' : '#e74c3c';
      const weekInMonth = manageBuf.length + 1;
      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:6px 12px;background:rgba(200,190,170,0.025);border:1px solid rgba(200,190,170,0.05);border-radius:5px;font-size:12px">
        <span style="color:var(--text-dim);flex-shrink:0">月${weekInMonth}週目:</span>
        <span style="color:${netColor};font-weight:700">${mNet >= 0 ? '+' : ''}${Math.round(mNet)}万</span>
        <span style="color:var(--text-dim);font-size:11px">収入${Math.round(mIncome)}万 / 支出${Math.round(mExpense)}万</span>
      </div>`;
    }

    // v1.4w: ティッカー（ニュースバー）
    const tickerItems = G._tickerItems || [];
    if (tickerItems.length > 0) {
      const tickerText = tickerItems.join('　　');
      // 2回分繰り返してシームレスにスクロール
      html += `<div class="news-ticker-bar">
        <div class="news-ticker-track">
          <span class="news-ticker-text">${tickerText}　　${tickerText}</span>
        </div>
      </div>`;
    }

    // Upcoming events strip
    if (upcomingItems.length > 0) {
      html += `<div style="display:flex;gap:12px;margin-bottom:10px;font-size:12px;color:var(--text-dim);flex-wrap:wrap">${upcomingItems.map(item => `<span style="padding:2px 6px;background:rgba(212,168,67,0.06);border:1px solid rgba(212,168,67,0.12);border-radius:3px">${item}</span>`).join('')}</div>`;
    }

    // ── v0.97: SURVIVAL GAUGE PANEL ──
    if (!G.survivalCleared) {
      const sPhase = Survival.getPhase(G);
      const sNet = Survival.estimateWeeklyNet(G);
      const sWeeks = Survival.weeksUntilBankrupt(G);
      const sFuel = Survival.fuelPct(G);
      const sMilestones = Survival.getMilestones(G);
      const isCritical = sFuel < 25 && sPhase && sPhase.id === 'red';

      const gaugeColor = sPhase ? sPhase.id : 'red';
      html += `<div class="survival-panel ${sPhase ? sPhase.cssClass : 'phase-red'}${isCritical ? ' critical' : ''}${_survivalPanelCollapsed ? ' is-collapsed' : ''}">`;
      html += `<div class="survival-header">
        <span class="survival-title" style="color:${sPhase?.color || '#e74c3c'}">
          <span style="font-size:16px">⛽</span> 経営サバイバル
        </span>
        <span class="survival-header-actions">
          <span class="survival-phase-badge" style="background:${sPhase?.color || '#e74c3c'}22;color:${sPhase?.color || '#e74c3c'};border:1px solid ${sPhase?.color || '#e74c3c'}44">
            ${sPhase?.emoji || '🔴'} ${sPhase?.label || '赤字地獄'}
          </span>
          <button class="survival-toggle" type="button" onclick="toggleSurvivalPanel(this)" aria-expanded="${_survivalPanelCollapsed ? 'false' : 'true'}">${_survivalPanelCollapsed ? '＋ 展開' : '− 最小化'}</button>
        </span>
      </div>`;

      // Fuel gauge
      html += '<div class="survival-body">';
      html += `<div class="survival-gauge-track">
        <div class="survival-gauge-fill ${gaugeColor}" style="width:${sFuel}%">
          <span class="survival-gauge-label">${Math.round(G.funds).toLocaleString()}万</span>
        </div>
      </div>`;

      // Milestone markers
      html += '<div class="survival-gauge-markers">';
      sMilestones.forEach(m => {
        const cls = m.done ? 'cleared' : (m === sMilestones.find(x => !x.done) ? 'active' : '');
        html += `<span class="survival-gauge-marker ${cls}" style="cursor:help" ${_tipAttr(m.desc)}>${m.done ? '✅' : '⬜'} ${m.label}</span>`;
      });
      html += '</div>';

      // Key stats
      html += '<div class="survival-stats">';
      // Weekly burn rate
      const netColor = sNet.weeklyNet >= 0 ? '#2ecc71' : '#e74c3c';
      const netSign = sNet.weeklyNet >= 0 ? '+' : '';
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${netColor}">${netSign}${Math.round(sNet.weeklyNet)}万</span>
        <span class="survival-stat-label">推定週間収支</span>
      </div>`;
      // Weeks until bankrupt
      if (sNet.weeklyNet < 0) {
        const urgency = sWeeks <= 10 ? '#e74c3c' : sWeeks <= 20 ? '#e67e22' : '#f1c40f';
        html += `<div class="survival-stat">
          <span class="survival-stat-val" style="color:${urgency}">残り${sWeeks}週</span>
          <span class="survival-stat-label">倒産までの猶予</span>
        </div>`;
      } else {
        html += `<div class="survival-stat">
          <span class="survival-stat-val" style="color:#2ecc71">安全</span>
          <span class="survival-stat-label">資金状況</span>
        </div>`;
      }
      // Rolling 4-week net (monthly profit indicator)
      const buf = G.recentWeeklyNet || [0,0,0,0];
      const rollingSum = buf.reduce((a,b) => a+b, 0);
      const r4count = G.rollingNet4Count || 0;
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${rollingSum >= 0 ? '#2ecc71' : r4count > 0 ? '#f1c40f' : 'var(--text-dim)'}">${rollingSum >= 0 ? '+' : ''}${Math.round(rollingSum)}万</span>
        <span class="survival-stat-label">月次収支(4週)</span>
      </div>`;
      // Weekly expense
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:#e74c3c">-${Math.round(sNet.totalExpense)}万</span>
        <span class="survival-stat-label">週間支出</span>
      </div>`;
      // Weekly base income
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${sNet.totalBaseIncome > 0 ? '#2ecc71' : 'var(--text-dim)'}">${sNet.totalBaseIncome > 0 ? '+' : ''}${Math.round(sNet.totalBaseIncome)}万</span>
        <span class="survival-stat-label">固定収入</span>
      </div>`;
      html += '</div>'; // .survival-stats

      // Tip text
      if (sPhase && sPhase.id === 'red') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          💡 <strong style="color:#f1c40f">目標:</strong> 倒産する前に黒字経営に持っていこう！ まずは興行を開催して人気を上げ、スポンサー収入（人気20〜）を獲得するのが第一歩。
        </div>`;
      } else if (sPhase && sPhase.id === 'orange') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          💡 赤字が縮小しています！ 人気を上げてスポンサー・放映権収入を増やし、損益分岐点を超えよう。
        </div>`;
      } else if (sPhase && sPhase.id === 'yellow') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          💡 あと少し！ 4週連続で黒字を出し、資金3,000万以上を維持すれば経営安定化クリア！
        </div>`;
      } else if (sPhase && sPhase.id === 'green') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          💡 黒字転換達成！ この調子で${4 - (G.survivalProfitStreak || 0)}週間黒字を維持すればクリア！（現在の資金: ${Math.round(G.funds).toLocaleString()}万${G.funds < 3000 ? ` / 目標3,000万` : ''}）
        </div>`;
      }

      html += '</div></div>'; // .survival-body, .survival-panel
    }

    html += renderSpringTagLeagueWeekBanner();
    html += renderAutumnWarWeekBanner();
    html += renderTenchosenWeekBanner();

    const heat = getHeatLevel();
    const injuredCount = G.roster.filter(c => c.injury).length;
    html += `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:var(--text-sub)">
      <span>Heat: <span style="color:${heat.color};font-weight:700">${heat.emoji} ${heat.label}（×${heat.mult}）</span></span>
      ${injuredCount > 0 ? `<span style="color:#e17055">🏥 負傷者: ${injuredCount}名</span>` : ''}
      ${G.coaches.length > 0 ? `<span style="color:#2ecc71">🎓 コーチ: ${G.coaches.length}名</span>` : ''}
    </div>`;
    html += `<p style="margin-bottom:12px;color:var(--text-sub)">選手の週間スケジュールを確認し、${stlBlocked ? '週を進めてください（今週は春のタッグリーグ開催週）' : agwBlocked ? '週を進めてください（今週は4団体勝ち残り対抗戦）' : jtBlocked ? '週を進めてください（今週はジュニアトーナメント開催週）' : isShow ? '興行準備に進んでください' : '週を進めてください'}。</p>`;

    // v1.0: Primary action buttons — top-left, large, prominent
    html += '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">';
    if (typeof App !== 'undefined' && App.canEnterJuniorTournamentThisWeek && App.canEnterJuniorTournamentThisWeek()) {
      html += '<button class="btn btn-gold" onclick="App.enterJuniorTournamentFromWeek({ processWeekOnCancel: true })" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">JTへ進む</button>';
    } else if (isShow) {
      html += '<button class="btn btn-gold" onclick="startShowPrep()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">🎤 興行準備へ →</button>';
    } else {
      html += '<button class="btn btn-gold" onclick="doProcessWeek()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">⏩ 週を処理</button>';
    }
    html += '<button class="btn" onclick="App.autoManage()" style="font-size:14px;padding:10px 20px;background:rgba(46,204,113,0.12);color:#2ecc71;border:1px solid rgba(46,204,113,0.3);font-weight:600" title="体調80未満の選手を休養にし、体調80以上で休養方針の選手をバランスに切り替えます。それ以外の方針は維持されます">🤖 おまかせ</button>';
    html += _tipIcon('<strong style="color:var(--gold)">🤖 おまかせ</strong><br>体調80未満の選手を休養にし、体調80以上で休養方針の選手をバランスに戻します。それ以外の方針は維持されます。');
    html += '</div>';

    // Roster schedule overview
    const canManageWeek = G.weekPhase === 'manage';
    const _ownRosterWk = G.roster.filter(c => !c.isRental);
    const _rentalRosterWk = G.roster.filter(c => c.isRental);
    const _renderWeekRow = c => {
      const condPct = Math.round(c.condition);
      const condCls = condPct >= 100 ? 'cond-100'
        : condPct >= 90 ? 'cond-90'
        : condPct >= 80 ? 'cond-80'
        : condPct >= 70 ? 'cond-70'
        : condPct >= 50 ? 'cond-50'
        : 'cond-low';
      const actionLabels = {practice:'練習',promo:'プロモ',rest:'休養',auto_rest:'🔄休養',balance:'バランス','療養':'療養',intensive:'⚡強化'};
      const statusHtml = c.injury
        ? `<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(214,48,49,0.15);color:${c.injury.color};border:1px solid ${c.injury.color}40">${c.injury.type} ${c.injury.weeksLeft}週</span>`
        : c.forcedRest
          ? '<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(52,152,219,0.15);color:#3498db;border:1px solid rgba(52,152,219,0.4)">🛌 休養中</span>'
          : '<span style="font-size:12px;color:#2ecc71">健康</span>';
      const wkChampBadge = G.titles.world.championId === c.id ? ' <span style="color:var(--gold);font-size:12px">👑</span>' : '';

      // レンタル選手は操作不可（自律行動）
      if (c.isRental) {
        const rentalContract = (G.rentals || []).find(r => r.fighterId === c.id);
        const rentalWL = rentalContract ? rentalContract.weeksLeft : '?';
        const rentalAction = c.injury ? '療養' : c.condition < 60 ? '🔄休養' : '練習';
        const tier = _wrOvrTier(ov(c));
        const popVal = Engine.util.dispPop(c.popularity);
        const popCol = _popColor(popVal).color;
        const faceUrl = getPortraitUrl(c.id);
        html += `<tr style="opacity:0.85${c.injury ? ';opacity:0.65' : ''}">
          <td><input type="checkbox" class="week-check" data-id="${c.id}" disabled></td>
          <td>
            <div class="wr-name-cell">
              ${_imgOrInitial(faceUrl, c.id, 40, 'border-radius:8px;')}
              <span>
                <span class="wr-name-link" onclick="showFighterPopup(${c.id},'roster')">${c.name}</span>${wkChampBadge}
                <span style="font-size:10px;color:#f39c12;margin-left:4px">🤝残${rentalWL}週</span>
              </span>
            </div>
          </td>
          <td>
            <div class="wr-ovr-wrap">
              <span class="wr-ovr-num v-${tier.cls}">${ov(c)}</span>
              <span class="wr-ovr-tier">${tier.label}</span>
            </div>
          </td>
          <td><span class="wr-pop-num" style="color:${popCol}">${popVal}</span></td>
          <td>${statusHtml}</td>
          <td>
            <div class="wr-cond-wrap">
              <div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div>
              <span class="wr-cond-num">${condPct}</span>
            </div>
          </td>
          <td><span style="font-size:12px;color:var(--text-dim);cursor:help" ${_tipAttr('レンタル選手は自律行動します。スケジュールの指定はできません。')}>🤝自律</span></td>
          <td><span style="font-size:12px;color:var(--text-dim)">--</span></td>
          <td><span class="sched-tag practice">${rentalAction}</span></td>
          <td></td>
        </tr>`;
        return;
      }

      const isOnLeave = !!c.onLeave;
      const schedDisabled = (c.injury || isOnLeave) ? 'disabled' : '';
      // Intensive button for week screen
      const isInjured = !!c.injury;
      const isResting = c.condition <= 30;
      const canInt = canManageWeek && !isInjured && !isOnLeave && !isResting && c.condition >= GROWTH_CONFIG.intensiveMinCond && c.intensiveWeeks < GROWTH_CONFIG.intensiveMaxConsec;
      let intBtnHtml = '';
      if (isInjured || isOnLeave || isResting) {
        intBtnHtml = '<span style="font-size:12px;color:var(--text-dim)">--</span>';
      } else if (!canManageWeek) {
        intBtnHtml = c.intensive ? '<span style="font-size:12px;color:#ffa500">⚡ON</span>' : '';
      } else {
        const warnTitle = c.intensiveWeeks >= GROWTH_CONFIG.intensiveMaxConsec ? '連続上限' : c.condition < GROWTH_CONFIG.intensiveMinCond ? '体調不足' : '';
        intBtnHtml = `<button class="btn-intensive${c.intensive?' active':''}" onclick="toggleIntensive(${c.id})" ${canInt || c.intensive ? '' : `disabled title="${warnTitle}"`}>⚡</button>`;
      }
      // v1.0: Compute predicted action for initial display
      // ※ _weekAction は前週の記録なので参照しない。常に現在のスケジュールから算出する
      let previewAction;
      if (c.injury) previewAction = '療養';
      else if (isOnLeave) previewAction = '休暇';
      else if (c.intensive) previewAction = 'intensive';
      else {
        previewAction = c.schedule || 'balance';
        if (previewAction === 'balance') previewAction = isShow ? 'promo' : 'practice';
        if (c.condition < 60) previewAction = 'auto_rest';
      }
      const previewLabel = actionLabels[previewAction] || previewAction;
      const trainerBadge = c._trainerBuff ? ` <span style="font-size:10px;color:#2ecc71;background:rgba(46,204,113,0.12);padding:1px 5px;border-radius:3px;border:1px solid rgba(46,204,113,0.3);cursor:help" ${_tipAttr(`専属指導中 — 練習効果アップ(残${c._trainerBuff.weeksLeft}週)`)}>🏋️${c._trainerBuff.weeksLeft}w</span>` : '';
      // care-rework v0.1 §3: 招聘中コーチのバッジ(コーチ名をツールチップに)
      const inviteCoach = c._inviteBuff ? (typeof ALL_COACHES !== 'undefined' ? ALL_COACHES.find(cc => cc.id === c._inviteBuff.coachId) : null) : null;
      const inviteBadge = c._inviteBuff ? ` <span style="font-size:10px;color:#2ecc71;background:rgba(46,204,113,0.12);padding:1px 5px;border-radius:3px;border:1px solid rgba(46,204,113,0.3);cursor:help" ${_tipAttr(`${inviteCoach ? inviteCoach.name + 'コーチ招聘中' : 'コーチ招聘中'} — 練習効果アップ(残${c._inviteBuff.weeksLeft}週)`)}>🏋️${c._inviteBuff.weeksLeft}w</span>` : '';
      const leaveBadge = isOnLeave ? ` <span style="font-size:10px;color:#3498db;background:rgba(52,152,219,0.12);padding:1px 5px;border-radius:3px;border:1px solid rgba(52,152,219,0.3);cursor:help" ${_tipAttr('休暇中は興行に欠場します。体調が回復し、蓄積した衰えも少し癒えます。')}>🏖️休暇 あと${c.onLeave.weeksLeft}週</span>` : '';
      const tier = _wrOvrTier(ov(c));
      const popVal = Engine.util.dispPop(c.popularity);
      const popCol = _popColor(popVal).color;
      const faceUrl = getPortraitUrl(c.id);
      html += `<tr${(c.injury || isOnLeave) ? ' style="opacity:0.65"' : ''}>
        <td><input type="checkbox" class="week-check" data-id="${c.id}" ${(c.injury || isOnLeave) ? 'disabled' : ''}></td>
        <td>
          <div class="wr-name-cell">
            ${_imgOrInitial(faceUrl, c.id, 40, 'border-radius:8px;')}
            <span>
              <span class="wr-name-link" onclick="showFighterPopup(${c.id},'roster')">${c.name}</span>${wkChampBadge}${trainerBadge}${inviteBadge}${leaveBadge}
            </span>
          </div>
        </td>
        <td>
          <div class="wr-ovr-wrap">
            <span class="wr-ovr-num v-${tier.cls}">${ov(c)}</span>
            <span class="wr-ovr-tier">${tier.label}</span>
          </div>
        </td>
        <td><span class="wr-pop-num" style="color:${popCol}">${popVal}</span></td>
        <td>${statusHtml}</td>
        <td>
          <div class="wr-cond-wrap">
            <div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div>
            <span class="wr-cond-num">${condPct}</span>
          </div>
        </td>
        <td>
          <select onchange="updateSchedulePreview(${c.id},this.value)" style="font-size:13px;padding:6px 10px;border-radius:6px;width:100%" ${schedDisabled}>
            <option value="balance" ${c.schedule==='balance'?'selected':''} title="非興行週は練習、興行週はプロモを自動選択。迷ったらこれ。体調60未満で自動休養します">バランス</option>
            <option value="practice" ${c.schedule==='practice'?'selected':''} title="毎週練習を行います。ステータス成長に集中したい時に。体調60未満で自動休養します">練習優先</option>
            <option value="promo" ${c.schedule==='promo'?'selected':''} title="毎週プロモ活動を行います。人気を上げたい時に（上限70）。体調60未満で自動休養します">プロモ優先</option>
            <option value="rest" ${c.schedule==='rest'?'selected':''} title="強制的に休養させます。体調管理よりも確実に休ませたい時に">休養重視</option>
          </select>
        </td>
        <td style="text-align:center">${intBtnHtml}</td>
        <td id="action-${c.id}"><span class="sched-tag ${previewAction}">${previewLabel}</span></td>
        <td></td>
      </tr>`;
    };
    // 一括操作パネル
    html += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--text-dim)">選択中の選手に一括適用:</span>
      <button class="btn" onclick="applyWeekPreset('practice')" style="font-size:11px;padding:4px 10px">練習優先</button>
      <button class="btn" onclick="applyWeekPreset('promo')" style="font-size:11px;padding:4px 10px">プロモ優先</button>
      <button class="btn" onclick="applyWeekPreset('balance')" style="font-size:11px;padding:4px 10px">バランス</button>
      <button class="btn" onclick="applyWeekPreset('rest')" style="font-size:11px;padding:4px 10px">休養重視</button>
      <span style="border-left:1px solid var(--text-dim);height:16px;margin:0 4px"></span>
      <button class="btn" onclick="batchIntensive(true)" style="font-size:11px;padding:4px 10px">⚡全ON</button>
      <button class="btn" onclick="batchIntensive(false)" style="font-size:11px;padding:4px 10px">⚡全OFF</button>
    </div>`;

    // ソート適用
    const sortedOwn = [..._ownRosterWk].sort((a, b) => {
      const va = _getWeekSortValue(a, _weekSortKey);
      const vb = _getWeekSortValue(b, _weekSortKey);
      const cmp = typeof va === 'string' ? va.localeCompare(vb, 'ja') : vb - va;
      return _weekSortDir === 'asc' ? -cmp : cmp;
    });

    html += `<table class="week-roster-table"><tr>
      <th style="width:30px"><input type="checkbox" id="weekCheckAll" onchange="toggleWeekCheckAll(this.checked)"></th>
      <th onclick="setWeekSort('name')" style="width:210px;cursor:pointer">名前${_weekSortIndicator('name')}</th>
      <th onclick="setWeekSort('ovr')" class="num" style="width:80px;cursor:pointer">総合${_weekSortIndicator('ovr')}</th>
      <th onclick="setWeekSort('pop')" class="num" style="width:60px;cursor:pointer">人気${_weekSortIndicator('pop')}</th>
      <th style="width:60px">状態</th>
      <th onclick="setWeekSort('cond')" style="width:120px;cursor:pointer">体調${_weekSortIndicator('cond')}</th>
      <th onclick="setWeekSort('schedule')" style="width:130px;cursor:pointer">スケジュール${_weekSortIndicator('schedule')} ${_tipIcon('<strong style="color:var(--gold)">育成方針</strong><br>・<strong>バランス</strong> — 興行週はプロモ、練習週は練習。迷ったらこれ<br>・<strong>練習優先</strong> — ステータス成長に集中<br>・<strong>プロモ優先</strong> — 人気を上げる(上限あり)<br>・<strong>休養重視</strong> — 確実に休ませる<br><br>どの方針でも、体調60未満になると自動で休養します。')}</th>
      <th class="center" style="width:60px">⚡${_tipIcon('<strong style="color:var(--gold)">⚡追込練習</strong><br>成長が大きく伸びる代わりに体調の消耗が激しく、怪我のリスクも上がります。<br><br>体調50以上・最大2週連続まで。')}</th>
      <th style="width:92px">今週の行動</th>
      <th></th>
    </tr>`;
    sortedOwn.forEach(_renderWeekRow);
    if (_rentalRosterWk.length > 0) {
      const _rSlots = RENTAL_CONFIG.getMaxConcurrent(_ownRosterWk.length);
      html += `<tr><td colspan="10" style="padding:6px 8px;background:rgba(243,156,18,0.07);border-top:1px solid rgba(243,156,18,0.3);border-bottom:1px solid rgba(243,156,18,0.3);color:#f39c12;font-size:12px;font-weight:600">🤝 レンタル枠 (${_rentalRosterWk.length}/${_rSlots})</td></tr>`;
      _rentalRosterWk.forEach(_renderWeekRow);
    }
    html += '</table>';
  }
  else if (G.weekPhase === 'weekSummary') {
    // v2.0-C3: Brief weekly summary — non-month-end weeks stop here
    const dateStr = G.offSeason ? `オフシーズン ${G.offWeek}/4` : Engine.util.formatDate(G.season, G.week);
    document.getElementById('weekTitle').textContent = '完了';
    // 直近4週バッファを集計（_tryAutoAdvance で当週分が push 済み）
    const _wsCycleNum = Math.ceil(G.week / 4);
    const _wsMonthStart = (_wsCycleNum - 1) * 4 + 1;
    const wsBuf = (G.financeHistory || []).filter(h => h.season === G.season && h.week >= _wsMonthStart && h.week <= G.week);
    let wsIncome = 0, wsExpense = 0;
    wsBuf.forEach(e => { wsIncome += e.income || 0; wsExpense += e.expense || 0; });
    const wsNet = wsIncome - wsExpense;
    const netColor = wsNet >= 0 ? 'var(--green)' : 'var(--red)';
    const wsWeeks = wsBuf.map(e => e.week).filter(Boolean);
    const wsRange = wsWeeks.length > 1
      ? `第${Math.min(...wsWeeks)}週〜第${Math.max(...wsWeeks)}週`
      : `第${wsWeeks[0] || G.week}週`;
    html += `<div style="text-align:center;padding:24px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:16px">`;
    html += `<div style="font-size:16px;color:var(--text-main);margin-bottom:6px;font-weight:700">${dateStr} 完了</div>`;
    html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:12px">${wsRange} 累計</div>`;
    html += `<div style="display:flex;justify-content:center;gap:18px;font-size:13px;margin-bottom:10px">
      <span>収入 <span style="color:var(--green);font-weight:600">+${Math.round(wsIncome).toLocaleString()}万</span></span>
      <span>支出 <span style="color:var(--red);font-weight:600">-${Math.round(wsExpense).toLocaleString()}万</span></span>
      <span>収支 <span style="color:${netColor};font-weight:600">${wsNet>=0?'+':''}${Math.round(wsNet).toLocaleString()}万</span></span>
    </div>`;
    html += `<div style="font-size:15px">残高: <strong style="color:${G.funds>=0?'var(--green)':'var(--red)'}">${Math.round(G.funds).toLocaleString()}万</strong></div>`;
    html += `</div>`;
    html += `<div class="btn-row" style="justify-content:center">
      <button class="btn btn-gold" style="font-size:15px;padding:12px 32px;font-weight:700" onclick="App.advanceFromWeekSummary()">次の週へ →</button>
    </div>`;
  }
  else if (G.weekPhase === 'settled') {
    const heat = getHeatLevel();
    const _sCycleNum = Math.ceil(G.week / 4);
    const _sMonthStart = (_sCycleNum - 1) * 4 + 1;
    const monthBuf = (G.financeHistory || []).filter(h => h.season === G.season && h.week >= _sMonthStart && h.week <= G.week);
    const weeksInMonth = monthBuf.length;
    html += `<h3 style="color:var(--gold);margin-bottom:12px">📊 月次収支レポート</h3>`;
    html += `<div style="margin-bottom:8px;font-size:12px">Heat: <span style="color:${heat.color};font-weight:700">${heat.emoji} ${heat.label}（集客×${heat.mult}）</span></div>`;
    const settleChamp = getWorldChampion();
    if (settleChamp) html += `<div style="margin-bottom:8px;font-size:12px">🏆 団体王座: ${fLink(settleChamp, {source:'roster'})}（${G.titles.world.defenses}防衛）</div>`;

    // 金銭バランス改善: カテゴリ別グルーピング月次決算
    let monthIncome = 0, monthExpense = 0;
    const mCats = { ticket: {}, goods: {}, media: {}, promo: {}, other: {} };
    const mExpenses = {};
    monthBuf.forEach(entry => {
      if (!entry.details) return;
      entry.details.forEach(d => {
        if (d.type === 'income') {
          const cat = d.category || 'other';
          const target = mCats[cat] || mCats.other;
          const key = d.label;
          if (!target[key]) target[key] = { label: d.label, val: 0, count: 0 };
          target[key].val += d.val;
          target[key].count++;
        } else {
          const key = _normalizeFinanceLabel(d.label);
          if (!mExpenses[key]) mExpenses[key] = { label: d.label, val: 0, count: 0 };
          mExpenses[key].val += d.val;
          mExpenses[key].count++;
          mExpenses[key].label = d.label;
        }
      });
      monthIncome += (entry.income || 0);
      monthExpense += (entry.expense || 0);
    });
    const monthNet = monthIncome - monthExpense;

    // 週範囲
    const weekNums = monthBuf.map(e => e.week).filter(Boolean);
    if (weekNums.length > 1) {
      html += `<div style="margin-bottom:8px;font-size:11px;color:var(--text-dim)">第${Math.min(...weekNums)}週〜第${Math.max(...weekNums)}週</div>`;
    }

    // ■ 興行収入
    const mTicketTotal = Object.values(mCats.ticket).reduce((s, i) => s + i.val, 0);
    if (mTicketTotal > 0) {
      html += `<div style="font-size:12px;font-weight:700;color:var(--gold);margin:6px 0 4px">■ 興行収入</div>`;
      Object.values(mCats.ticket).forEach(d => {
        html += `<div class="finance-row"><span class="f-label">${d.label}</span><span class="f-val income">+${Math.round(d.val).toLocaleString()}万</span></div>`;
      });
    }

    // ■ ブランド収入
    const brandKeys = ['goods', 'media', 'promo'];
    const mBrandTotal = brandKeys.reduce((s, k) => s + Object.values(mCats[k]).reduce((ss, i) => ss + i.val, 0), 0);
    const mOtherTotal = Object.values(mCats.other).reduce((s, i) => s + i.val, 0);
    if (mBrandTotal + mOtherTotal > 0) {
      html += `<div style="font-size:12px;font-weight:700;color:var(--gold);margin:8px 0 4px">■ ブランド収入</div>`;
      const catLabels = { goods: 'グッズ', media: 'メディア', promo: 'プロモ' };
      brandKeys.forEach(catKey => {
        const items = Object.values(mCats[catKey]);
        const catTotal = items.reduce((s, i) => s + i.val, 0);
        if (catTotal <= 0) return;
        html += `<div class="finance-row"><span class="f-label" style="font-weight:600">${catLabels[catKey]}収入</span><span class="f-val income">+${Math.round(catTotal).toLocaleString()}万</span></div>`;
      });
      if (mOtherTotal > 0) {
        Object.values(mCats.other).forEach(d => {
          html += `<div class="finance-row"><span class="f-label">${d.label}</span><span class="f-val income">+${Math.round(d.val).toLocaleString()}万</span></div>`;
        });
      }
    }

    // ■ 支出
    const expenseItems = Object.values(mExpenses).sort((a, b) => a.val - b.val);
    if (expenseItems.length > 0) {
      html += `<div style="font-size:12px;font-weight:700;color:var(--gold);margin:8px 0 4px">■ 支出</div>`;
      expenseItems.forEach(d => {
        html += `<div class="finance-row"><span class="f-label">${d.label}${d.count > 1 ? ` ×${d.count}週` : ''}</span><span class="f-val expense">${Math.round(d.val).toLocaleString()}万</span></div>`;
      });
    }

    html += `<div style="border-top:2px solid var(--border);margin:8px 0"></div>`;
    html += `<div class="finance-row finance-total"><span>月間収支</span><span class="f-val ${monthNet >= 0 ? 'income' : 'expense'}">${monthNet >= 0 ? '+' : ''}${Math.round(monthNet).toLocaleString()}万</span></div>`;
    html += `<div style="margin-top:8px;font-size:13px">残高: <strong style="color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${Math.round(G.funds).toLocaleString()}万</strong></div>`;

    // v0.97: Survival gauge mini-status in settlement
    const f = G.weeklyFinance;
    if (!G.survivalCleared && f.net !== undefined) {
      const sPhase = Survival.getPhase(G);
      const rollingBuf = G.recentWeeklyNet || [0,0,0,0];
      const rollingNet = rollingBuf.reduce((a,b) => a+b, 0);
      const r4c = G.rollingNet4Count || 0;
      if (monthNet >= 0) {
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.2);font-size:11px;color:#2ecc71">
          ⛽ 月間黒字！${rollingNet >= 0 ? ` 月次黒字${r4c}回達成` : ''}${r4c >= 1 ? ' 🔥' : ''}${r4c >= 2 && G.funds >= 3000 ? ' — クリア間近！' : ''}
        </div>`;
      } else {
        const sWeeks = Survival.weeksUntilBankrupt(G);
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.2);font-size:11px;color:#e74c3c">
          ⛽ ${sPhase?.emoji || '🔴'} ${sPhase?.label || '赤字'} — 倒産まで推定${sWeeks === Infinity ? '∞' : sWeeks}週
        </div>`;
      }
    }

    if (G.funds <= -1000) {
      html += '<div style="margin-top:12px;padding:12px;background:rgba(196,30,58,0.2);border:1px solid var(--red);border-radius:4px;text-align:center"><strong style="color:var(--red);font-size:18px">💀 GAME OVER — 倒産</strong></div>';
    } else {
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn btn-gold" style="font-size:16px;padding:12px 28px;font-weight:700" onclick="advanceWeek()">次の月へ →</button></div>';
    }
  }
  // ── C-4: TRANSFER WINDOW UI ──
  else if (G.weekPhase === 'transfer') {
    document.getElementById('weekTitle').textContent = '🔄 移籍ウィンドウ';
    const pending = G.pendingPoach || [];
    if (pending.length > 0) {
      html += '<h3 style="color:#e17055;margin-bottom:12px">⚠️ 引き抜きオファー</h3>';
      html += '<p style="font-size:12px;color:var(--text-sub);margin-bottom:12px">上位団体から選手への引き抜きオファーが届いています。各選手への対応を選択してください。</p>';
      pending.forEach(p => {
        const f = p.fighter;
        const retCost = Engine.transfer.calcRetentionCost(f);
        const isChampion = G.titles?.world?.championId === f.id;
        html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:14px;margin-bottom:8px">
          <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:8px">
            ${portraitImg(f.id, 80)}
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <div>
                  <strong style="font-size:17px">${f.name}</strong>
                  ${isChampion ? '<span style="color:var(--gold);font-size:12px;margin-left:6px">👑王者</span>' : ''}
                  <span style="font-size:13px;color:var(--text-dim);margin-left:8px">OVR ${Engine.util.ov(f)} / 人気 ${Engine.util.dispPop(f.popularity)}</span>
                </div>
                <div style="font-size:13px;color:var(--text-sub)">← ${p.org.name} (${p.org.tier}級)</div>
              </div>
          <div style="display:flex;gap:10px;font-size:13px;margin-bottom:10px">
            <span style="color:#2ecc71">💰 移籍金: +${p.fee}万</span>
            <span style="color:#e17055">🛡️ 引き留め費: -${retCost}万${isChampion ? ' (確定成功)' : ' (成功率80%)'}</span>
          </div>
          <div class="btn-row" style="gap:8px">
            <button class="btn btn-blue" style="font-size:11px;padding:6px 12px" onclick="resolvePoach(${f.id},false)">🛡️ 引き留める</button>
            <button class="btn" style="font-size:11px;padding:6px 12px;background:rgba(196,30,58,0.2);border:1px solid var(--red);color:var(--red)" onclick="resolvePoach(${f.id},true)">💸 移籍を承認</button>
          </div>
            </div>
          </div>
        </div>`;
      });
    } else {
      html += '<h3 style="color:var(--gold);margin-bottom:12px">移籍ウィンドウ完了</h3>';
      html += '<p style="font-size:12px;color:var(--text-sub);margin-bottom:12px">全ての移籍オファーに対応しました。</p>';
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn btn-gold" onclick="finishTransferWindow()">次へ進む →</button></div>';
    }
  }
  // ── EVENT DISPLAY (Phase D) ──
  else if (G.weekPhase === 'event') {
    const ev = G.pendingEvent;
    if (!ev) {
      html += '<h3 style="color:var(--text-sub)">イベントデータなし</h3>';
      html += '<div class="btn-row"><button class="btn btn-gold" onclick="skipEvent()">スキップ →</button></div>';
    } else if (ev.type === 'war') {
      document.getElementById('weekTitle').textContent = '⚔ 対抗戦';
      html += `<div style="background:linear-gradient(135deg,rgba(196,30,58,0.15),rgba(231,76,60,0.1));border:1px solid rgba(231,76,60,0.3);border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
        <h3 style="color:#e74c3c;margin-bottom:8px">⚔ 対抗戦の申し入れ</h3>
        <p style="font-size:14px;color:var(--text-main);margin-bottom:4px">${ev.opponentName}から挑戦状が届いています</p>
        <p style="font-size:12px;color:var(--text-sub)">${ev.matchCount}試合の団体対決</p>
      </div>`;
      html += `<div class="btn-row" style="margin-top:16px;justify-content:center">
        <button class="btn btn-gold" style="padding:12px 32px;font-size:15px" onclick="showWarChallenge()">⚔ 挑戦状を見る</button>
      </div>`;
      // Auto-show the challenge popup on first render
      setTimeout(() => showWarChallenge(), 300);
    } else if (ev.type === 'summit') {
      document.getElementById('weekTitle').textContent = '🏆 頂上決戦';
      html += `<div style="background:linear-gradient(135deg,rgba(241,196,15,0.2),rgba(255,215,0,0.1));border:1px solid rgba(241,196,15,0.4);border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
        <h3 style="color:var(--gold);margin-bottom:8px">🏆 頂上決戦</h3>
        <p style="font-size:14px;color:var(--text-main);margin-bottom:4px">${ev.orgName}のエースに挑む！</p>
        <p style="font-size:12px;color:var(--text-sub)">勝利で団体人気+${EVENT_CONFIG.summitPopReward}、対戦pt+${BATTLE_POINT_CFG.summit} / 敗北で対戦pt-${BATTLE_POINT_CFG.summit}</p>
      </div>`;
      html += `<div style="display:flex;justify-content:center;align-items:center;gap:24px;margin:16px 0;font-size:16px">
        <span><strong style="color:var(--gold)">${ev.playerFighter.name}</strong> <span style="font-size:11px;color:var(--text-dim)">OVR${Engine.util.ov(ev.playerFighter)}</span></span>
        <span style="color:var(--text-dim)">VS</span>
        <span><strong style="color:#e74c3c">${ev.aiFighter.name}</strong> <span style="font-size:11px;color:var(--text-dim)">OVR${Engine.util.ov(ev.aiFighter)}</span></span>
      </div>`;
      html += `<div class="btn-row" style="margin-top:16px">
        <button class="btn btn-gold" onclick="executeEvent()">🏆 挑戦する！</button>
        <button class="btn btn-blue" onclick="skipEvent()">見送る</button>
      </div>`;
    }
  }
  // ── PPV ENTRY PHASE ──
  else if (G.weekPhase === 'ppvEntry') {
    const ppvName = G.ppvName || 'GRAND FINAL';
    document.getElementById('weekTitle').textContent = '🏟️ PPV GRAND FINAL';
    const rankings = G.rankings || [];
    const pRank = Engine.ranking.getPlayerRank(rankings);
    const maxSlots = Engine.ppv.getSlotCount(pRank);
    const champ = getWorldChampion();
    const champAutoEntry = champ && !champ.injury && !champ.isRental;
    const remainingSlots = champAutoEntry ? maxSlots - 1 : maxSlots;
    const picks = G._ppvPicks || [];

    // ヘッダー
    html += `<div style="text-align:center;padding:20px 16px;background:linear-gradient(135deg,rgba(241,196,15,0.15),rgba(231,76,60,0.08));border:1px solid rgba(241,196,15,0.35);border-radius:10px;margin-bottom:16px">
      <h2 style="color:var(--gold);margin:0 0 6px 0;font-size:20px">🏟️ PPV GRAND FINAL「${ppvName}」</h2>
      <p style="font-size:14px;color:var(--text-main);margin:0 0 4px 0">出場枠: <strong>${maxSlots}名</strong>（ランク${pRank}位）</p>
      <p style="font-size:12px;color:var(--text-dim);margin:0">出場報酬: ${PPV_REWARD[pRank] || 100}万円</p>
    </div>`;

    // チャンピオン自動エントリー
    if (champAutoEntry) {
      html += `<div style="padding:10px 14px;background:rgba(241,196,15,0.08);border:1px solid rgba(241,196,15,0.25);border-radius:6px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
        ${portraitImg(champ.id, 40)}
        <span style="font-size:13px;color:var(--text-main)">👑 <strong>${champ.name}</strong> — チャンピオンとして自動エントリー</span>
      </div>`;
    }

    // 残り枠の選択
    html += `<div style="margin-bottom:12px">
      <h4 style="color:var(--text-main);margin:0 0 8px 0;font-size:14px">出場選手を選択（残り${remainingSlots - picks.length}枠）</h4>`;

    const eligible = (G.roster || []).filter(c => {
      if (champAutoEntry && c.id === champ.id) return false;
      if (c.injury) return false;
      if (c.isRental) return false;
      return true;
    }).sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));

    eligible.forEach(c => {
      const ovr = Engine.util.ov(c);
      const picked = picks.includes(c.id);
      const full = picks.length >= remainingSlots && !picked;
      const disabled = full ? 'opacity:0.4;pointer-events:none;' : '';
      const bg = picked ? 'background:rgba(241,196,15,0.12);border-color:rgba(241,196,15,0.4);' : '';
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;cursor:pointer;${bg}${disabled}" onclick="togglePPVPick(${c.id})">
        <span style="font-size:18px;width:24px;text-align:center">${picked ? '✅' : '⬜'}</span>
        ${portraitImg(c.id, 36)}
        <span style="flex:1;font-size:13px;color:var(--text-main)">${c.name}</span>
        <span style="font-size:11px;color:var(--text-sub)">OVR ${ovr}</span>
        <span style="font-size:11px;color:var(--text-dim)">人気 ${Math.round(c.popularity || 0)}</span>
      </div>`;
    });
    html += `</div>`;

    // 注意書き
    html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:16px;line-height:1.6">
      ※ エントリー後の変更はできません<br>
      ※ PPVまでに負傷した場合、自動的に代理選手が出場します<br>
      ※ レンタル選手はエントリーできません
    </div>`;

    // 確定ボタン
    const canConfirm = picks.length === remainingSlots;
    const btnStyle = canConfirm ? '' : 'opacity:0.4;pointer-events:none;';
    html += `<div class="btn-row" style="justify-content:center">
      <button class="btn btn-gold" style="padding:12px 32px;font-size:15px;${btnStyle}" onclick="confirmPPVEntry()">🏟️ エントリー確定（${picks.length}/${remainingSlots}名）</button>
    </div>`;
  }
  // ── PPV SHOW DAY PHASE ──
  else if (G.weekPhase === 'ppvShow') {
    document.getElementById('weekTitle').textContent = '🏟️ PPV GRAND FINAL';
    html += `<div style="text-align:center;padding:24px">
      <div style="color:var(--gold);font-size:18px;margin-bottom:16px">PPV GRAND FINAL「${G.ppvName || 'GRAND FINAL'}」開催日！</div>
      <button class="btn btn-gold" style="padding:12px 32px;font-size:15px" onclick="App.initPPVShow()">🏟️ PPV カードを表示</button>
    </div>`;
  }
  // ── PPV TV PHASE ──
  else if (G.weekPhase === 'ppvTV') {
    document.getElementById('weekTitle').textContent = '📺 PPV テレビ中継';
    html += `<div style="text-align:center;padding:24px">
      <div style="color:var(--text-sub);font-size:16px;margin-bottom:16px">📺 PPV GRAND FINAL テレビ中継中…</div>
      <button class="btn btn-blue" style="padding:10px 24px;font-size:14px" onclick="App.initPPVTV()">📺 テレビ中継を見る</button>
    </div>`;
  }

  // ── SCOUT EVENT PHASE (A1: 号外紙面型ドラフト開幕画面) ──
  else if (G.weekPhase === 'scoutEvent') {
    const eventLabel = 'メインドラフト';
    const weekLabel = G.offSeason
      ? `シーズン${G.season} オフ第${G.offWeek || 3}週`
      : `シーズン${G.season} 第${G.week}週`;
    document.getElementById('weekTitle').textContent = `⚖ ${eventLabel}`;

    const candidates = G.scoutCandidates || [];
    const totalCount = candidates.length;
    const superElites = candidates.filter(c => c.assessedTier === 'superElite');
    const elites = candidates.filter(c => c.assessedTier === 'elite');
    const maxPicks = G.scoutMaxPicks || 4;
    const editionNo = 100 + (G.season - 1) * 4 + 1;

    const topSE = superElites.length > 0
      ? [...superElites].sort((a, b) => (b.assessedValue || 0) - (a.assessedValue || 0))[0]
      : null;
    const heroHeadline = topSE
      ? `<span class="red">超逸材</span>・${topSE.name}、<br>ついに業界の門を叩く`
      : `<span class="red">運命</span>の<span class="red">ドラフト</span>、<br>ついに開幕`;
    const heroSub = topSE
      ? `${G.season}年目 ${eventLabel} — ${topSE.age}歳の才能を筆頭に全${totalCount}名`
      : `${G.season}年目 ${eventLabel} — 全${totalCount}名、業界の門を叩く`;

    const silCount = Math.min(8, totalCount);
    const featCount = Math.min(3, superElites.length + elites.length);
    let silHtml = '';
    for (let i = 0; i < silCount; i++) {
      silHtml += `<div class="a1-sil${i < featCount ? ' feat' : ''}"></div>`;
    }

    const leadBody = topSE
      ? `本日、${weekLabel}。各団体のフロントが動き出す。今年の目玉は${topSE.age}歳の超逸材・${topSE.name}。複数の団体がすでに獲得に本腰を入れているとの情報があり、業界関係者の注目が集まっている。${maxPicks}名の新戦力を掴み取れるか — あなたの団体の未来を決める選択が、今始まる。`
      : `本日、${weekLabel}。各団体のフロントが動き出す。${elites.length > 0 ? `注目の逸材${elites.length}名を中心に、` : ''}業界関係者の視線が集まっている。${maxPicks}名の新戦力を掴み取れるか — あなたの団体の未来を決める選択が、今始まる。`;

    const statCells = [{ num: totalCount, lbl: 'TOTAL' }];
    if (superElites.length > 0) statCells.push({ num: superElites.length, lbl: 'SUPER ELITE', hot: true });
    statCells.push({ num: elites.length, lbl: 'ELITE' });
    statCells.push({ num: maxPicks, lbl: '獲得上限' });
    statCells.push({ num: Math.round(G.funds).toLocaleString(), lbl: '資金 (万)' });

    const statsHtml = statCells.map(s =>
      `<div class="a1-stat"><div class="a1-stat-num${s.hot ? ' hot' : ''}">${s.num}</div><div class="a1-stat-lbl">${s.lbl}</div></div>`
    ).join('');

    html += `<div class="a1-wrap">
      ${superElites.length > 0 ? '<div class="a1-stamp">◆ 超逸材発見 ◆</div>' : '<div class="a1-stamp">◆ 号外 ◆</div>'}
      <div class="a1-title-bar">
        <div class="brand">週刊グラップル</div>
        <div class="ed">第${editionNo}号 ・ ${weekLabel}</div>
      </div>
      <div class="a1-hero">
        <div class="a1-kicker">◆ ${superElites.length > 0 ? '緊急速報' : 'ドラフト速報'} ◆</div>
        <div class="a1-main-h">${heroHeadline}</div>
        <div class="a1-sub-h">${heroSub}</div>
        <div class="a1-lead">${leadBody}</div>
      </div>
      <div class="a1-silhouettes">
        <div class="a1-sil-label">本日の候補者 ・ ${totalCount}名</div>
        <div class="a1-sil-row">${silHtml}</div>
      </div>
      <div class="a1-stats" style="grid-template-columns:repeat(${statCells.length},1fr);">${statsHtml}</div>
      <div class="a1-footer">
        <button class="btn btn-gold a1-btn-go" onclick="showScreen('scoutEvent');try{Audio.bgm.play('tension')}catch(e){}">⚖ ドラフトへ</button>
        <button class="btn btn-ghost" onclick="scoutFinish()">辞退する →</button>
      </div>
    </div>`;
  }

  // 進行不具合復旧: 想定外の weekPhase（showExec/showPrep 等）でも今週タブを空にしない。
  // 「進行不具合発生 — 次の週へ進む」ボタンで復旧パスを提供する。
  if (!html) {
    console.warn('[WM] renderWeekScreen: unhandled weekPhase=', G.weekPhase, '— showing recovery UI');
    html += `<div style="text-align:center;padding:24px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:16px">
      <div style="font-size:15px;color:var(--text-main);margin-bottom:8px;font-weight:700">⚠️ 進行不具合が発生しました</div>
      <div style="font-size:12px;color:var(--text-sub);margin-bottom:14px">想定外の状態(${G.weekPhase || '不明'})で停止しました。下のボタンで復旧できます。</div>
      <button class="btn btn-gold" style="font-size:14px;padding:10px 24px"
        onclick="if(typeof G!=='undefined'){G={...G,weekPhase:'manage',lastShowResults:G.lastShowResults||[],weeklyFinance:G.weeklyFinance||{income:0,expense:0,details:[]}};try{Storage.autoSave()}catch(e){}refreshAll();}">
        🔧 状態を復元して今週へ
      </button>
    </div>`;
  }

  el.innerHTML = html;
}

function _renderRosterDojoHeader() {
  const el = document.getElementById('rosterDojoHeader');
  if (!el) return;
  const hired = getHiredCoaches();

  // --- 雰囲気テキスト生成 ---
  const atmoRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season || 1, G.week || 1, Date.now() & 0xFFFF));
  const atmo = Engine.lockerRoom.getAtmosphereText(atmoRng, G.lockerRoomMorale || 60);

  let html = '<div class="dojo-header">';
  html += '<img src="../image/dojo-header.webp" class="dojo-header-img" onerror="this.style.display=\'none\'" alt="">';
  html += '<div class="dojo-header-overlay"></div>';

  // --- コーチ吹き出し（左下） ---
  const report = G.currentCoachReport;
  const coachForBubble = report
    ? ALL_COACHES.find(c => c.id === report.coachId)
    : (hired.length > 0 ? hired[0] : null);

  if (coachForBubble || atmo) {
    html += '<div class="dojo-scene-coach">';
    if (coachForBubble) {
      html += `<div class="dojo-scene-coach-avatar" onclick="showCoachTooltip(${coachForBubble.id})" style="cursor:pointer">
        ${coachPortraitImg(coachForBubble, 48)}
      </div>`;
    }
    html += '<div class="dojo-scene-bubble">';
    if (report && coachForBubble) {
      html += `<div class="coach-name">💬 ${report.coachName}</div>`;
      html += `「${report.reportText}」`;
    } else if (coachForBubble) {
      html += `<div class="coach-name">💬 ${coachForBubble.name}</div>`;
      html += `「${atmo.text}」`;
    } else {
      html += `${atmo.emoji}「${atmo.text}」`;
    }
    html += '</div></div>';
  }

  // --- 選手アイコン（右下） ---
  // 雰囲気レベルに応じた人数: level1=0, level2=0-1, level3=1, level4=1-2, level5=2-3
  const levelMaxMap = [0, 0, 1, 1, 2, 3]; // index = atmo.level (1-5)
  const levelMinMap = [0, 0, 0, 1, 1, 2];
  const maxFighters = levelMaxMap[atmo.level] || 0;
  const minFighters = levelMinMap[atmo.level] || 0;

  if (maxFighters > 0 && G.roster && G.roster.length > 0) {
    const fRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season || 1, G.week || 1, 777));
    const available = G.roster.filter(c => !c.injury && !c.onLeave);
    // シャッフル
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Engine.rng.int(fRng, 0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const count = minFighters + Engine.rng.int(fRng, 0, maxFighters - minFighters);
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));

    if (picked.length > 0) {
      html += '<div class="dojo-scene-fighters">';
      picked.forEach((c, idx) => {
        const offsetY = Engine.rng.int(fRng, -5, 5);
        const delay = Engine.rng.int(fRng, 0, 8);
        const cycle = 13 + Engine.rng.int(fRng, 0, 6); // 13-19sでバラけさせる
        html += `<div class="dojo-scene-fighter-wrap" style="margin-bottom:${offsetY}px" title="${c.name}" onclick="showFighterPopup(${c.id},'roster')">`;
        html += `<div class="dojo-scene-shout" style="--shout-cycle:${cycle}s;--shout-delay:${delay}s"></div>`;
        html += `<div class="dojo-scene-fighter">${portraitImg(c.id, 40)}</div>`;
        html += '</div>';
      });
      html += '</div>';
    }
  }

  // ログフィードアイコン（バナー右下）
  html += `<div class="dojo-log-feed">
    <div class="dojo-log-feed-icon" onclick="toggleLogFeedPanel()">📋<span class="dojo-log-feed-badge" style="display:none">0</span></div>
    <div class="dojo-log-feed-bubble" style="display:none"></div>
  </div>`;

  html += '</div>'; // .dojo-header 閉じ

  // ログ一覧パネル（バナー直後）
  html += '<div class="log-feed-panel" id="logFeedPanel" style="display:none">';
  html += '<div class="log-feed-panel-header" onclick="toggleLogFeedPanel()">📋 今週の声（0件）</div>';
  html += '<div class="log-feed-panel-list"></div>';
  html += '</div>';

  // コーチ特性（バナー外に残す）
  if (hired.length > 0) {
    const abilityParts = hired.flatMap(c => c.abilities || []);
    html += `<div class="train-tendency" style="margin-bottom:8px">→ コーチ能力: <strong>${abilityParts.join('、')}</strong></div>`;
  }
  el.innerHTML = html;

  // ログフィードの状態を反映
  refreshDojoLogFeed();

  // 吹き出しテキストを毎サイクルでランダム差し替え
  const DOJO_SHOUTS = [
    'はぁっ…!','ふっ!','せいっ!','よいしょ!','もう一本!',
    'はっ!','くっ…!','たぁっ!','いける…!','まだまだ!',
    'おりゃ!','よし!','うぅっ…','どりゃ!','そこだ!'
  ];
  el.querySelectorAll('.dojo-scene-shout').forEach(s => {
    const pick = (prev) => {
      let t;
      do { t = DOJO_SHOUTS[Math.floor(Math.random() * DOJO_SHOUTS.length)]; } while (t === prev && DOJO_SHOUTS.length > 1);
      return t;
    };
    s.textContent = pick('');
    s.addEventListener('animationiteration', () => { s.textContent = pick(s.textContent); });
  });
}

let _rosterDetailTab = {}; // { charId: tabIndex (0=能力, 1=成長経過, 2=育成) }
function switchRosterDetailTab(charId, tabIdx) {
  _rosterDetailTab[charId] = tabIdx;
  const ct = document.getElementById(`roster-detail-${charId}`);
  if (!ct) return;
  ct.querySelectorAll('.rd-tab').forEach((t, i) => t.classList.toggle('active', i === tabIdx));
  ct.querySelectorAll('.rd-tab-content').forEach((c, i) => c.classList.toggle('active', i === tabIdx));
}

function _renderRosterDetailPanel(c, hired) {
  const coach = getCharCoach(c.id);
  const isInjured = !!c.injury;
  const canManage = G.weekPhase === 'manage';
  const tabIdx = _rosterDetailTab[c.id] || 0;
  const fullUrl = getFullUrl(c.id, Engine.util.ov(c));
  // 自団体での在籍年数を算出（所属年数基準を Engine.orgTimeline に統一）
  const tenure = Engine.orgTimeline.getTenureYears(c, G.season, G.week, 'player');
  const stats = ['pw','sp','te','st','mn'];
  const STAT_COLORS = {pw:'#c03030',sp:'#1a8a4a',te:'#2060a0',st:'#b06010',mn:'#7040a0'};
  const STAT_LABELS = {pw:'PW',sp:'SP',te:'TE',st:'ST',mn:'MN'};

  // === Left Column: Portrait ===
  const roleCls = c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral';
  const isChamp = G.titles?.world?.championId === c.id;
  const statusBadges = [];
  if (c.hotStreak) statusBadges.push('<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(200,120,0,0.12);color:#a06000;border:1px solid rgba(200,120,0,0.3)">🔥 絶好調</span>');
  if (c.slump) statusBadges.push('<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(52,73,94,0.15);color:#5a6670;border:1px solid rgba(127,140,141,0.3)">📉 スランプ</span>');
  if (c.motivationLoss) statusBadges.push('<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(44,62,80,0.15);color:#6a7880;border:1px solid rgba(149,165,166,0.3)">😞 モチベ喪失</span>');
  if (c.injury) statusBadges.push(`<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(180,40,40,0.12);color:#a03030;border:1px solid rgba(180,40,40,0.3)">🏥 ${c.injury.type} ${c.injury.weeksLeft}週</span>`);
  const decline = Engine.retirement.getDeclinePresentation(c);
  if (decline.stage === 'terminal') statusBadges.push('<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(180,40,40,0.12);color:#a03030;border:1px solid rgba(180,40,40,0.3)">⬇⬇ 限界</span>');
  else if (decline.stage === 'major') statusBadges.push('<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(180,100,20,0.12);color:#a06000;border:1px solid rgba(180,100,20,0.3)">⬇ 衰退期</span>');
  else if (decline.stage === 'early') statusBadges.push('<span style="font-size:10px;padding:2px 6px;border-radius:3px;background:rgba(160,130,20,0.12);color:#806010;border:1px solid rgba(160,130,20,0.3)">⚠ 衰え</span>');

  let leftCol = `<div class="rd-portrait">`;
  if (fullUrl) {
    const _ch = ALL_CHARS.find(x => x.id === c.id);
    const _ini = _ch ? _ch.name.charAt(0) : '?';
    const _SC = {Grappler:'#bb8fce',Striker:'#e74c3c',Submission:'#e67e22',Aerial:'#2ecc71',Allround:'#f1c40f',Brawler:'#e88a82'};
    const _co = _ch ? (_SC[_ch.style] || '#888') : '#888';
    leftCol += `<img class="rd-portrait-img" src="${fullUrl}" alt="${c.name}" onerror="this.outerHTML='<div class=\\'rd-portrait-img\\' style=\\'display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${_co}22,${_co}08);font-size:72px;font-weight:900;color:${_co}\\'>${_ini}</div>'">`;
  } else {
    const _ch = ALL_CHARS.find(x => x.id === c.id);
    const _ini = _ch ? _ch.name.charAt(0) : '?';
    const _SC = {Grappler:'#bb8fce',Striker:'#e74c3c',Submission:'#e67e22',Aerial:'#2ecc71',Allround:'#f1c40f',Brawler:'#e88a82'};
    const _co = _ch ? (_SC[_ch.style] || '#888') : '#888';
    leftCol += `<div class="rd-portrait-img" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${_co}22,${_co}08);font-size:72px;font-weight:900;color:${_co}">${_ini}</div>`;
  }
  leftCol += `<div class="rd-portrait-overlay"></div>
    <div class="rd-portrait-info">
      <div class="rd-portrait-name">${c.name}</div>
      <div class="rd-portrait-sub">${c.h || '?'}cm ｜ ${c.age || '?'}歳 ｜ ${tenure}年目</div>
      <div class="rd-portrait-badges">
        <span class="badge badge-${c.style}" style="font-size:10px">${c.style}</span>
        <span class="badge badge-${roleCls}" style="font-size:10px">${c.role}</span>
      </div>
      <div class="rd-portrait-record">
        <span style="color:#1a7a3a">${c.wins||0}○</span> <span style="color:#b03030">${c.losses||0}×</span> <span style="color:#7a7468">${c.draws||0}△</span>
        ${isChamp ? '<span style="margin-left:8px;color:#7a6530">👑王者</span>' : ''}
      </div>
      ${statusBadges.length > 0 ? `<div class="rd-portrait-status">${statusBadges.join('')}</div>` : ''}
    </div>
  </div>`;

  // === Tab 1: 能力 ===
  const traitsText = (c.traits || []).join(' / ');
  let tab1 = `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
    <span style="font-family:'Bebas Neue',sans-serif;font-size:40px;color:#5c4a1e;line-height:1">${ov(c)}</span>
    <span style="font-size:12px;color:#7a7466">OVR</span>
    <span style="margin-left:auto;font-size:11px;color:#7a7466">${traitsText}</span>
  </div>`;
  stats.forEach(s => {
    const current = Math.round(c[s]);
    const cap = c.trainCap ? c.trainCap[s] : 100;
    const pct = Math.min(100, Math.round(current / cap * 100));
    const sg = Math.round((c.seasonGrowth?.[s] || 0));
    const atCap = current >= cap;
    const roomLabel = atCap ? '<span style="color:#7a6530">MAX</span>'
      : pct >= 85 ? '<span style="color:#a03030">残僅か</span>'
      : pct >= 60 ? '<span style="color:#a07010">成長中</span>'
      : '<span style="color:#1a8a4a">伸びしろ大</span>';
    const col = STAT_COLORS[s];
    tab1 += `<div class="rd-stat-row">
      <span class="rd-stat-label" style="color:${col};cursor:help" ${_tipAttr(STAT_TIPS[s])}>${STAT_LABELS[s]}</span>
      <div class="rd-stat-bar-outer"><div class="rd-stat-bar-current" style="width:${Math.min(100, current/1.5)}%;background:${col}"></div></div>
      <span class="rd-stat-val" style="color:${col}">${current}</span>
      <span class="rd-stat-growth" style="color:${sg > 0 ? '#1a8a4a' : '#7a7466'}">${sg > 0 ? '+' + sg : '—'}</span>
      <span class="rd-stat-room">${roomLabel}</span>
    </div>`;
  });
  tab1 += `<div class="rd-note">MNは試合経験で成長します</div>`;
  tab1 += `<div style="margin-top:8px;display:flex;gap:16px;font-size:11px;color:#4a4638">
    <div>人気 <b style="${_scale6Style(_popColor(Engine.util.dispPop(c.popularity)))}">${Engine.util.dispPop(c.popularity)}</b></div>
    <div>体調 <b style="${_scale6Style(_condColor(Math.round(c.condition)))}">${Math.round(c.condition)}</b></div>
    <div>給与 <b style="color:#1e1c16">${getSalary(c)}万</b>/週</div>
  </div>`;

  // === Tab 2: 成長経過 ===
  const log = (c.growthLog || []).slice().reverse();
  let tab2 = `<div style="font-size:12px;color:#7a6530;font-weight:700;margin-bottom:6px">📈 シーズン${G.season} 成長ログ</div>`;
  tab2 += '<div class="rd-growth-scroll">';
  let prevSeason = G.season;
  log.forEach(entry => {
    if (entry.season !== prevSeason) {
      tab2 += `<div class="rd-growth-week" style="border-top:1px solid rgba(122,101,48,0.35);padding-top:8px;margin-top:4px">
        <span class="rd-growth-label" style="color:#7a6530 !important">${entry.season}年目 末</span>
        <span class="rd-growth-event" style="color:#7a7466">— シーズン${entry.season}終了 —</span>
      </div>`;
      prevSeason = entry.season;
    }
    let eventText = '';
    if (entry.type === 'match') {
      const resColor = entry.result === 'win' ? '#5c4a1e' : entry.result === 'lose' ? '#b03030' : '#7a7466';
      const resLabel = entry.result === 'win' ? '勝利' : entry.result === 'lose' ? '敗北' : '引分';
      eventText = `🏆 ${entry.detail} — <b style="color:${resColor}">${resLabel}</b>`;
    } else if (entry.type === 'practice') {
      eventText = `練習（${entry.detail}）`;
      if (entry.eventTag) eventText += ` <span style="color:#1a8a4a">${entry.eventTag}</span>`;
    } else if (entry.type === 'rest') {
      eventText = entry.detail;
    } else if (entry.type === 'injury') {
      eventText = `🏥 療養（${entry.detail}）`;
    } else if (entry.type === 'milestone') {
      eventText = `<span style="color:#c9a84c;font-weight:700">🔔 ${entry.detail}</span>`;
    } else {
      eventText = entry.detail || '—';
    }
    let deltaText = '—';
    if (entry.deltas && Object.keys(entry.deltas).length > 0) {
      deltaText = Object.entries(entry.deltas).map(([k,v]) => `${STAT_LABELS[k]||k.toUpperCase()} +${Math.round(v*10)/10}`).join(' ');
    }
    const hasDelta = entry.deltas && Object.keys(entry.deltas).length > 0;
    tab2 += `<div class="rd-growth-week">
      <span class="rd-growth-label">W${entry.week}</span>
      <span class="rd-growth-event">${eventText}</span>
      <span class="rd-growth-delta${hasDelta ? ' positive' : ''}" ${!hasDelta ? 'style="color:#7a7466"' : ''}>${deltaText}</span>
    </div>`;
  });
  if (log.length === 0) {
    tab2 += '<div style="font-size:11px;color:#7a7466;padding:12px 0;text-align:center">まだ記録がありません</div>';
  }
  tab2 += '</div>';
  // Season summary
  const sg = c.seasonGrowth || {};
  const summaryParts = stats.map(s => { const v = Math.round((sg[s]||0)*10)/10; return v > 0 ? `<span style="color:${STAT_COLORS[s]};font-weight:700">${STAT_LABELS[s]} +${v}</span>` : ''; }).filter(Boolean);
  if (summaryParts.length > 0) {
    tab2 += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.06);font-size:11px;display:flex;gap:10px;flex-wrap:wrap">
      <span style="color:#4a4638">今シーズン累計:</span>${summaryParts.join('')}
    </div>`;
  }

  // === Tab 3: 育成 ===
  let tab3 = '<div style="display:flex;flex-direction:column;gap:8px">';
  // Coach assign — 常にドロップダウン表示（負傷中はdisabled）
  // 招聘中(_inviteBuff)は §3.5「二重指導なし」のためドロップダウンを出さない
  // (ここにガードが無いと招聘中の選手に雇用コーチを重ねて割り当てられてしまう)
  if (c._inviteBuff) {
    tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">担当コーチ</span><span class="rd-meta-val" style="color:#7a6530;font-style:italic">招聘中: ${coach ? coach.name : '外部コーチ'}（残${c._inviteBuff.weeksLeft}週・終了後は元の担当に自動復帰）</span></div>`;
  } else if (hired.length > 0) {
    let opts = `<option value="0"${!coach?' selected':''}>--- なし ---</option>`;
    hired.forEach(h => {
      const aCount = getCoachAssignees(h.id).length;
      const isCurrent = coach && coach.id === h.id;
      const isFull = aCount >= COACH_MAX_ASSIGN && !isCurrent;
      const effShort = `${h.grade}級 ×${h.gMult||1.0}`;
      const sm = getCoachStyleMatch(h, c);
      const matchTag = sm.icon ? ` ${sm.icon}${sm.label}` : '';
      opts += `<option value="${h.id}"${isCurrent?' selected':''}${isFull?' disabled':''}>${h.emoji} ${h.name} [${effShort}]${matchTag} (${aCount}/${COACH_MAX_ASSIGN})${isFull?' [満]':''}</option>`;
    });
    tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">担当コーチ</span><span class="rd-meta-val"><select onchange="changeCoachAssign(${c.id}, Number(this.value))" style="font-size:11px;padding:3px 6px"${isInjured?' disabled':''}>${opts}</select></span></div>`;
  } else {
    tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">担当コーチ</span><span class="rd-meta-val" style="color:#7a7466">未雇用</span></div>`;
  }
  // Coach effect
  if (coach) {
    const mult = coach.gMult || 1.0;
    const sm = getCoachStyleMatch(coach, c);
    const matchHtml = sm.icon ? `<span class="coach-match-badge ${sm.cls}">${sm.icon}${sm.label}+${sm.bonus}</span>` : '<span style="color:#7a7466">不一致</span>';
    const abilitiesText = (coach.abilities||[]).join('・');
    tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">コーチ効果</span><span class="rd-meta-val" style="font-size:12px">成長×${mult} <span class="badge badge-${coach.style}" style="font-size:9px;padding:1px 5px">${coach.style}</span> ${matchHtml} ${abilitiesText}</span></div>`;
  }
  // Growth tendency
  const tendency = getGrowthTendency(c.id);
  if (tendency && !isInjured) {
    const arrowsHtml = tendency.arrows.map(a => `<span class="train-growth-arrow ${a.cls}">${a.arrow}</span>${a.label.replace(/[A-Z]+/,'')}`).join(' ');
    tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">成長傾向</span><span class="rd-meta-val">${tendency.arrows.map(a => `<span class="train-growth-arrow ${a.cls}">${a.arrow}</span>${STAT_LABELS[a.stat] || a.label}`).join(' ')}</span></div>`;
  }
  // Development rate
  const potPct = getPotentialPct(c);
  const potLabel = getPotentialLabel(c);
  tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">開発率</span><span class="rd-meta-val"><div style="display:flex;align-items:center;gap:6px"><div style="width:100px;height:6px;background:rgba(0,0,0,0.08);border-radius:3px;overflow:hidden"><div style="width:${potPct}%;height:100%;background:${potLabel.color};border-radius:3px"></div></div><span style="font-size:12px;color:${potLabel.color};font-weight:700">${potLabel.label}</span></div></span></div>`;
  // Physical decline
  const stageLabel = {none:'良好',early:'わずかに衰えの兆候',major:'衰退期',terminal:'限界'};
  const stageColor = {none:'#1a8a4a',early:'#a07010',major:'#a06000',terminal:'#a03030'};
  tab3 += `<div class="rd-meta-row"><span class="rd-meta-label">フィジカル</span><span class="rd-meta-val"><span style="font-size:12px;color:${stageColor[decline.stage]||'#1a8a4a'}">${stageLabel[decline.stage]||'良好'}</span></span></div>`;
  tab3 += '</div>';

  // === Assemble ===
  const _isOpen = _rosterDetailOpenId === c.id;
  let html = `<div class="rd-detail${_isOpen?' open':''}" id="roster-detail-${c.id}" onclick="event.stopPropagation()"><div class="rd-layout">
    ${leftCol}
    <div class="rd-info">
      <div class="rd-tabs">
        <div class="rd-tab${tabIdx===0?' active':''}" onclick="event.stopPropagation();switchRosterDetailTab(${c.id},0)">能力</div>
        <div class="rd-tab${tabIdx===1?' active':''}" onclick="event.stopPropagation();switchRosterDetailTab(${c.id},1)">成長経過</div>
        <div class="rd-tab${tabIdx===2?' active':''}" onclick="event.stopPropagation();switchRosterDetailTab(${c.id},2)">育成</div>
      </div>
      <div class="rd-tab-content${tabIdx===0?' active':''}">${tab1}</div>
      <div class="rd-tab-content${tabIdx===1?' active':''}">${tab2}</div>
      <div class="rd-tab-content${tabIdx===2?' active':''}">${tab3}</div>
    </div>
  </div></div>`;
  return html;
}

function _renderRosterGrowthLog() {
  const el = document.getElementById('rosterGrowthLog');
  if (!el) return;
  const growthEntries = G.roster.filter(c => {
    const sg = c.seasonGrowth || {};
    return (sg && Object.values(sg).some(v => v > 0)) || (c.seasonPopGrowth || 0) > 0;
  });
  if (growthEntries.length > 0) {
    let html = '<div class="panel" style="margin-top:12px;background:#d4ccb8;border-color:rgba(100,85,50,0.18)"><div class="train-season-log" style="background:rgba(122,101,48,0.06);border-color:rgba(122,101,48,0.15);color:#4a4638">';
    html += '<div style="font-weight:700;color:#7a6530;margin-bottom:4px">📈 今シーズン成長</div>';
    growthEntries.forEach(c => {
      const parts = [];
      ['pw','sp','te','st','mn'].forEach(s => {
        const v = Math.round(((c.seasonGrowth && c.seasonGrowth[s]) || 0) * 10) / 10;
        if (v > 0) parts.push(`<span style="color:#1a8a4a">${s.toUpperCase()}+${v}</span>`);
      });
      const popG = Math.round((c.seasonPopGrowth || 0) * 10) / 10;
      if (popG > 0) parts.push(`<span style="color:#c07a10">人気+${popG}</span>`);
      if (parts.length > 0) html += `<div><span style="color:#5c4a1e;font-weight:700;font-size:11px">${c.name}</span>: ${parts.join(' ')}</div>`;
    });
    html += '</div></div>';
    el.innerHTML = html;
  } else {
    el.innerHTML = '';
  }
}

function renderRoster() {
  _renderRosterDojoHeader();
  // === Staff Section ===
  const staffEl = document.getElementById('rosterStaffSection');
  const staffCountEl = document.getElementById('staffCount');
  const staffMaxEl = document.getElementById('staffMax');
  if (staffEl) {
    const hired = getHiredCoaches();
    if (staffCountEl) staffCountEl.textContent = hired.length;
    if (staffMaxEl) staffMaxEl.textContent = Engine.coach.getMaxCoaches(G);

    const coachEffectShort = (c) => {
      const mult = c.gMult || 1.0;
      return `${c.grade}級 ×${mult} <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>`;
    };

    let staffHtml = '';
    if (hired.length > 0) {
      staffHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">';
      hired.forEach(c => {
        const assigned = getCoachAssignees(c.id);
        const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);
        staffHtml += `<div onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 14px;background:#ede8dc;border:1px solid rgba(100,85,50,0.14);border-radius:8px;transition:border-color 0.2s" onmouseenter="this.style.borderColor='#7a6530'" onmouseleave="this.style.borderColor='rgba(100,85,50,0.14)'">
          ${coachPortraitImg(c, 64)}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15px;margin-bottom:3px;color:#1e1c16">${c.name}</div>
            <div style="font-size:13px;color:#7a6530;margin-bottom:4px">${coachEffectShort(c)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">`;
        if (assignedChars.length > 0) {
          assignedChars.forEach(ch => {
            const sm = getCoachStyleMatch(c, ch);
            const matchIcon = sm.icon ? `<span style="font-weight:700;color:${sm.cls==='specialist'?'#1a8a4a':'#a07010'}">${sm.icon}</span>` : '';
            staffHtml += `<span class="coach-match-chip" style="background:rgba(122,101,48,0.06);border:1px solid rgba(122,101,48,0.15);border-radius:4px;padding:3px 6px;display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#4a4638">${portraitImg(ch.id, 18, '', false)} ${ch.name.substring(0,4)}${matchIcon}<span onclick="event.stopPropagation();changeCoachAssign(${ch.id},0)" style="cursor:pointer;color:#a03030;font-size:9px;margin-left:2px" title="担当解除">✕</span></span>`;
          });
        } else {
          staffHtml += `<span style="font-size:12px;color:#7a7466;font-style:italic">担当なし</span>`;
        }
        // ＋ボタン: 未割当の選手をこのコーチに追加
        const unassignedFighters = G.roster.filter(f => !f.isRental && !f.injury && !getCharCoach(f.id));
        const canAddMore = assigned.length < COACH_MAX_ASSIGN;
        if (canAddMore && unassignedFighters.length > 0) {
          let addOpts = '<option value="">＋ 追加</option>';
          unassignedFighters.forEach(f => {
            const fSm = getCoachStyleMatch(c, f);
            addOpts += `<option value="${f.id}">${f.name} ${fSm.icon||''}</option>`;
          });
          staffHtml += `<select onclick="event.stopPropagation()" onchange="event.stopPropagation();if(this.value)changeCoachAssign(Number(this.value),${c.id});this.value=''" style="font-size:10px;padding:2px 4px;border-radius:4px;background:rgba(122,101,48,0.08);border:1px solid rgba(122,101,48,0.2);color:#7a6530;cursor:pointer">${addOpts}</select>`;
        }
        staffHtml += `</div>
          </div>
          <span onclick="event.stopPropagation();showCoachTooltip(${c.id})" style="font-size:12px;color:#7a7466;cursor:pointer">ℹ️</span>
        </div>`;
      });
      staffHtml += '</div>';
    } else {
      staffHtml += `<div style="text-align:center;padding:16px;color:#7a7466;font-size:12px">コーチ未雇用 — <span style="color:#7a6530;cursor:pointer;text-decoration:underline" onclick="showScreen('coach')">スタッフ募集</span>から雇用できます</div>`;
    }
    staffEl.innerHTML = staffHtml;
  }

  // === Roster Section ===
  const el = document.getElementById('rosterTable');


  const hired = getHiredCoaches();
  const sortBtns = [
    {key:'ovr', label:'OVR'},
    {key:'name', label:'名前'},
    {key:'cond', label:'体調'},
    {key:'pop', label:'人気'},
    {key:'schedule', label:'育成'},
  ].map(s => `<button class="rd-sort-btn${_rosterSortKey===s.key?' active':''}" onclick="setRosterSort('${s.key}')">${s.label}</button>`).join('');
  let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:11px;color:#7a7466">並び順:</span>${sortBtns}</div>`;
  html += '<div style="display:flex;flex-direction:column;gap:4px">';
  const _schedOrder = {intensive:0, practice:1, balance:2, promo:3, rest:4};
  const _sortFn = (a,b) => {
    switch(_rosterSortKey) {
      case 'name': return a.name.localeCompare(b.name, 'ja');
      case 'cond': return b.condition - a.condition;
      case 'pop': return b.popularity - a.popularity;
      case 'schedule': {
        const ao = _schedOrder[a.schedule] ?? 2;
        const bo = _schedOrder[b.schedule] ?? 2;
        return ao !== bo ? ao - bo : ov(b) - ov(a);
      }
      default: return ov(b) - ov(a);
    }
  };
  const ownFighters = G.roster.filter(c => !c.isRental).sort(_sortFn);
  const rentalFighters = G.roster.filter(c => c.isRental).sort((a,b) => ov(b) - ov(a));
  const sorted = ownFighters;
  // roster-cap v1.0: 所属枠ヘッダーをhtmlの先頭に追加
  const rosterCap = G.rosterCap || 8;
  const isFull = ownFighters.length >= rosterCap;
  html = `<div class="rd-cap-bar">
    <span style="font-size:13px;color:#4a4638">所属選手</span>
    <span style="font-size:15px;font-weight:700;color:#1e1c16">${ownFighters.length}/${rosterCap}名</span>
    ${isFull ? '<span style="font-size:12px;color:#7a7466">（上限）</span>' : ''}
  </div>` + html;
  sorted.forEach(c => {
    const roleCls = c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral';
    const condPct = Math.round(c.condition);
    const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
    const injuryBadge = c.injury ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(214,48,49,0.15);color:#f08b9e;border:1px solid rgba(214,48,49,0.3)">🏥${c.injury.weeksLeft}週</span>` : '';
    const champBadge = G.titles.world.championId === c.id ? '<span style="color:var(--gold);font-size:12px"> 👑</span>' : '';
    const rentalBadge = c.isRental ? '<span style="color:#f39c12;font-size:12px"> 🤝</span>' : '';
    // v1.3-1: wear状態ラベル (§3)
    const wearBadge = (() => {
      const decline = Engine.retirement.getDeclinePresentation(c);
      if (decline.stage === 'terminal') return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">⬇⬇ 限界</span>';
      if (decline.stage === 'major') return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(230,126,34,0.12);color:#e67e22;border:1px solid rgba(230,126,34,0.3)">⬇ 衰退期</span>';
      if (decline.stage === 'early') return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(241,196,15,0.12);color:#f1c40f;border:1px solid rgba(241,196,15,0.3)">⚠ 衰え</span>';
      return '';
    })();
    // v1.3-2: §7.2 growthPenalty中の選手に🩹アイコン表示
    const growthPenaltyBadge = (!c.injury && c.growthPenalty)
      ? '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(108,92,231,0.12);color:#a29bfe;border:1px solid rgba(108,92,231,0.3)">🩹成長低下</span>'
      : '';
    // v1.8: 成長イベントバッジ
    const hotStreakBadge = c.hotStreak
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,165,0,0.15);color:#ff9500;border:1px solid rgba(255,165,0,0.4)">🔥絶好調</span>`
      : '';
    const slumpBadge = c.slump
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(52,73,94,0.15);color:#7f8c8d;border:1px solid rgba(127,140,141,0.3)">📉スランプ</span>`
      : '';
    const motivLossBadge = c.motivationLoss
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(44,62,80,0.15);color:#95a5a6;border:1px solid rgba(149,165,166,0.3)">😞モチベ喪失</span>`
      : '';
    // 所属への気持ちが冷えている選手は、行動としてだけ示す。内部値は表示しない。
    const lowTrustBadge = (!c.isRental && (c.trust != null ? c.trust : 50) < 40)
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(230,126,34,0.15);color:#e67e22;border:1px solid rgba(230,126,34,0.45);cursor:help" ${_tipAttr('最近は社長室を避けがちだという噂がある')}>💭よそよそしい</span>`
      : '';
    const statG = (key) => {
      const g = Math.round(c.seasonGrowth ? (c.seasonGrowth[key] || 0) : 0);
      return g > 0 ? `<span style="color:#1a8a4a;font-size:12px;font-weight:700">+${g}</span>` : '';
    };
    // Coach mini-select in card row (inline, 1-click assign)
    const coachOfChar = c.isRental ? null : getCharCoach(c.id);
    let coachInlineHtml = '';
    if (c._inviteBuff) {
      // care-rework v0.1 §3.5: 招聘中は雇用コーチのアサインから外れているため、
      // 通常のコーチ選択プルダウンではなく招聘状況を表示する(操作不可)。
      // 「コーチ: 招聘中」だけだと設定欄が消えたように見えるため、誰が・あと何週かを明示する
      const invCoach = getCharCoach(c.id);
      const invName = invCoach ? invCoach.name.split(' ')[0] : '外部コーチ';
      coachInlineHtml = `<span style="font-size:10px;color:#7a6530;font-style:italic">招聘中: ${invName}（残${c._inviteBuff.weeksLeft}週）</span>`;
    } else if (!c.isRental && hired.length > 0) {
      const sm = coachOfChar ? getCoachStyleMatch(coachOfChar, c) : null;
      const smCls = sm ? sm.cls : '';
      let miniOpts = `<option value="0"${!coachOfChar?' selected':''}>コーチ: なし</option>`;
      hired.forEach(h => {
        const aC = getCoachAssignees(h.id).length;
        const isCur = coachOfChar && coachOfChar.id === h.id;
        const isFull = aC >= COACH_MAX_ASSIGN && !isCur;
        const hSm = getCoachStyleMatch(h, c);
        const mTag = hSm.icon || '';
        miniOpts += `<option value="${h.id}"${isCur?' selected':''}${isFull?' disabled':''}>${h.name.split(' ')[0]}${mTag} (${aC}/${COACH_MAX_ASSIGN})${isFull?' 満':''}</option>`;
      });
      coachInlineHtml = `<select class="rd-coach-select" onclick="event.stopPropagation()" onchange="event.stopPropagation();changeCoachAssign(${c.id}, Number(this.value))"${c.injury?' disabled':''}>${miniOpts}</select>`;
    }
    html += `<div class="rd-card${_rosterDetailOpenId===c.id?' expanded':''}" onclick="toggleRosterDetail(${c.id})">
      <div class="rd-card-inner">
        <div onclick="event.stopPropagation();showFighterPopup(${c.id},'roster')" style="cursor:pointer;flex-shrink:0">
          ${portraitImg(c.id, 52, '', true)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
            <span class="rd-name" onclick="event.stopPropagation();showFighterPopup(${c.id},'roster')">${c.name}</span>${champBadge ? '<span style="color:#7a6530;font-size:12px">👑⭐</span>' : ''}
            <span style="font-size:11px;color:#7a6530;font-weight:600">${c.age}歳</span>
            <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>
            <span class="badge badge-${roleCls}" style="font-size:10px;padding:1px 5px">${c.role}</span>
            ${coachInlineHtml}
            ${c._trainerBuff ? `<span style="font-size:10px;color:#2ecc71;background:rgba(46,204,113,0.12);padding:1px 5px;border-radius:3px;border:1px solid rgba(46,204,113,0.3)">🏋️${c._trainerBuff.weeksLeft}w</span>` : ''}
            ${c._inviteBuff ? (() => {
              const invCoach = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES.find(cc => cc.id === c._inviteBuff.coachId) : null;
              return `<span style="font-size:10px;color:#2ecc71;background:rgba(46,204,113,0.12);padding:1px 5px;border-radius:3px;border:1px solid rgba(46,204,113,0.3);cursor:help" ${_tipAttr(`${invCoach ? invCoach.name + 'コーチ招聘中' : 'コーチ招聘中'} — 練習効果アップ(残${c._inviteBuff.weeksLeft}週)`)}>🏋️${c._inviteBuff.weeksLeft}w</span>`;
            })() : ''}
            ${injuryBadge}${wearBadge}${growthPenaltyBadge}${hotStreakBadge}${slumpBadge}${motivLossBadge}${lowTrustBadge}
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#4a4638;flex-wrap:wrap">
            <span style="font-size:17px;font-weight:900;color:#5c4a1e">${ov(c)}</span>
            <span ${_tipAttr(STAT_TIPS.pw)}>PW<b style="color:#1e1c16">${Math.round(c.pw)}</b>${statG('pw')}</span>
            <span ${_tipAttr(STAT_TIPS.sp)}>SP<b style="color:#1e1c16">${Math.round(c.sp)}</b>${statG('sp')}</span>
            <span ${_tipAttr(STAT_TIPS.te)}>TE<b style="color:#1e1c16">${Math.round(c.te)}</b>${statG('te')}</span>
            <span ${_tipAttr(STAT_TIPS.st)}>ST<b style="color:#1e1c16">${Math.round(c.st)}</b>${statG('st')}</span>
            <span ${_tipAttr(STAT_TIPS.mn)}>MN<b style="color:#1e1c16">${Math.round(c.mn)}</b>${statG('mn')}</span>
            <span style="color:#bcb39f;margin:0 2px">｜</span>
            <span style="display:inline-flex;align-items:center;gap:3px">⭐<b style="color:#1e1c16">${Engine.util.dispPop(c.popularity)}</b></span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;font-size:11px;color:#4a4638">
          <div style="display:flex;align-items:center;gap:3px;justify-content:flex-end">体調<div class="cond-bar"><div class="cond-fill" style="width:${condPct}%;background:${condCls}"></div></div><b style="color:#1e1c16">${condPct}</b></div>
          <div style="margin-top:2px;color:#7a7466">💰${getSalary(c)}万</div>
        </div>
      </div>
      ${_renderRosterDetailPanel(c, hired)}
    </div>`;
  });
  html += '</div>';
  // ── Rental fighters separated section ──
  if (rentalFighters.length > 0) {
    const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownFighters.length);
    html += `<div class="panel-title" style="font-size:14px;margin-top:16px;color:#a06000">🤝 レンタル枠（${rentalFighters.length}/${maxSlots}）</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:4px">';
    rentalFighters.forEach(c => {
      const condPct = Math.round(c.condition);
      const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
      const injuryBadge = c.injury ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(214,48,49,0.15);color:#f08b9e;border:1px solid rgba(214,48,49,0.3)">🏥${c.injury.weeksLeft}週</span>` : '';
      const contract = (G.rentals || []).find(r => r.fighterId === c.id);
      const srcLabel = contract ? (contract.fromSource === 'rival'
        ? (Engine.rival.getOrgInfo(G.aiOrgs, contract.fromOrgId)?.name || '他団体')
        : 'FA') : '?';
      html += `<div style="background:#ede8dc;border:1px solid rgba(180,120,30,0.3);border-radius:8px${c.injury ? ';opacity:0.75' : ''}">
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer" onclick="showFighterPopup(${c.id},'roster')">
          ${portraitImg(c.id, 52, '', true)}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
              <span class="rd-name" onclick="event.stopPropagation();showFighterPopup(${c.id},'roster')">${c.name}</span><span style="color:#a06000;font-size:12px"> 🤝</span>
              <span style="font-size:11px;color:#7a6530;font-weight:600">${c.age}歳</span>
              <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>
              ${injuryBadge}
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#4a4638;flex-wrap:wrap">
              <span style="font-size:17px;font-weight:900;color:#5c4a1e">${ov(c)}</span>
              <span ${_tipAttr(STAT_TIPS.pw)}>PW<b style="color:#1e1c16">${Math.round(c.pw)}</b></span>
              <span ${_tipAttr(STAT_TIPS.sp)}>SP<b style="color:#1e1c16">${Math.round(c.sp)}</b></span>
              <span ${_tipAttr(STAT_TIPS.te)}>TE<b style="color:#1e1c16">${Math.round(c.te)}</b></span>
              <span ${_tipAttr(STAT_TIPS.st)}>ST<b style="color:#1e1c16">${Math.round(c.st)}</b></span>
              <span ${_tipAttr(STAT_TIPS.mn)}>MN<b style="color:#1e1c16">${Math.round(c.mn)}</b></span>
              <span style="color:#bcb39f;margin:0 2px">｜</span>
              <span style="display:inline-flex;align-items:center;gap:3px">⭐<b style="color:#1e1c16">${Engine.util.dispPop(c.popularity)}</b></span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;font-size:11px;color:#4a4638">
            <div style="display:flex;align-items:center;gap:3px;justify-content:flex-end">体調<div class="cond-bar"><div class="cond-fill" style="width:${condPct}%;background:${condCls}"></div></div><b style="color:#1e1c16">${condPct}</b></div>
            <div style="margin-top:2px;color:#a06000">${srcLabel}・残${contract ? contract.weeksLeft : '?'}週</div>
          </div>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  el.innerHTML = html;

  _renderRosterGrowthLog();
}

function getCardWeight(card) {
  return Engine.util.getCardWeight(card);
}
function getUsedFighterIds(excludeSlot) {
  // Returns Set of fighter IDs already assigned to other match slots (singles + tag)
  const used = new Set();
  G.showCard.forEach((m, i) => {
    if (i === excludeSlot) return;
    if (m.matchType === 'tag') {
      [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2]
        .filter(id => id > 0).forEach(id => used.add(id));
    } else {
      if (m.left > 0) used.add(m.left);
      if (m.right > 0) used.add(m.right);
    }
  });
  return used;
}

function getAvailableForSlot(slotIndex, side) {
  // Returns roster members not injured + not on opposite side of same slot
  // Fighters in other slots are included but marked with _usedInOtherSlot for swap UI
  const used = getUsedFighterIds(slotIndex);
  const otherSide = side === 'left' ? G.showCard[slotIndex].right : G.showCard[slotIndex].left;
  const reservedCRIds = getChallengeUnavailableIds();
  return G.roster.filter(c => c.id !== otherSide && !c.injury && !c.forcedRest && !reservedCRIds.has(c.id)).map(c => ({
    ...c, _usedInOtherSlot: used.has(c.id)
  }));
}

// ── showprep v7 picker ──────────────────────────────────────────────────────
function _spOpenPicker(slotIdx, side) {
  // F08 ロック: 直接対決固定枠は選手差替え不可
  const slot = G.showCard && G.showCard[slotIdx];
  if (slot && slot._crMatchLocked) {
    if (typeof showToast === 'function') showToast('⚔ 挑戦試合の上位3枠は固定です', 3000);
    return;
  }
  if (slot && slot._f08Locked) {
    if (typeof showToast === 'function') showToast('🔥 派閥の直接対決のため、この試合の選手は変更できません', 3000);
    return;
  }
  // 派閥内序列戦 ロック
  if (slot && slot._internalChallengeLocked) {
    if (typeof showToast === 'function') showToast('⚔ 派閥内序列戦は固定です', 3000);
    return;
  }
  // F09 ロック
  if (slot && slot._f09Locked) {
    if (typeof showToast === 'function') showToast('⚔ F09 派閥対抗戦のため、この試合の選手は変更できません', 3000);
    return;
  }
  if (_spActivePicker && _spActivePicker.slotIdx === slotIdx && _spActivePicker.side === side) {
    _spActivePicker = null;
  } else {
    _spActivePicker = { slotIdx, side };
  }
  renderShowPrep();
}
function _spOpenTagPicker(slotIdx, tagTeam, tagPos) {
  if (G.showCard?.[slotIdx]?._crMatchLocked) {
    if (typeof showToast === 'function') showToast('⚔ 挑戦試合の上位3枠は固定です', 3000);
    return;
  }
  if (_spActivePicker && _spActivePicker.slotIdx === slotIdx && _spActivePicker.tagTeam === tagTeam && _spActivePicker.tagPos === tagPos) {
    _spActivePicker = null;
  } else {
    _spActivePicker = { slotIdx, tagTeam, tagPos };
  }
  renderShowPrep();
}
function _spClosePicker() {
  _spActivePicker = null;
  renderShowPrep();
}
function _spSelectFighter(slotIdx, side, newId) {
  _spClearHighlight();
  App.setShowCardSlot(slotIdx, side, newId);
  _spActivePicker = null;
  renderShowPrep();
}
function _spHighlightSwap(fighterId) {
  _spClearHighlight();
  for (let i = 0; i < G.showCard.length; i++) {
    if (G.showCard[i].left === fighterId || G.showCard[i].right === fighterId) {
      const el = document.getElementById('sp-slot-' + i);
      if (el) el.classList.add('swap-highlight');
      break;
    }
  }
}
function _spClearHighlight() {
  document.querySelectorAll('.sp-match-card.swap-highlight').forEach(el => el.classList.remove('swap-highlight'));
}
function _spAfterRender() {
  if (_spActivePicker !== null) {
    const el = document.getElementById('sp-picker-' + _spActivePicker.slotIdx);
    if (el && el.innerHTML.trim()) {
      requestAnimationFrame(() => { requestAnimationFrame(() => { el.classList.add('open'); }); });
    }
  }
}
// ────────────────────────────────────────────────────────────────────────────

// 集客v2: カード評価ツールチップ
function showMatchAppealTooltip(event, slotIdx) {
  if (!G.showCard || !G.showCard[slotIdx]) return;
  const m = G.showCard[slotIdx];
  if (!m.left || m.left <= 0 || !m.right || m.right <= 0) return;
  const fA = getShowCardFighter(m.left);
  const fB = getShowCardFighter(m.right);
  if (!fA || !fB) return;

  const fanExpects = Engine.fanExpect.generate(G);
  const rivalryAB = G.relationships ? (G.relationships[`${m.left}>${m.right}`]?.rivalry || 0) : 0;
  const rivalryBA = G.relationships ? (G.relationships[`${m.right}>${m.left}`]?.rivalry || 0) : 0;
  const isFanExpect = fanExpects && fanExpects.some(fe =>
    (fe.leftId === m.left && fe.rightId === m.right) || (fe.leftId === m.right && fe.rightId === m.left));
  const bdRivalryLevel = Engine.title.getRivalryLevel(G, m.left, m.right);
  const bdPendingClash = bdRivalryLevel?.pendingClashBonus || 0;
  const bdFr = Engine.freshness.calc(G.matchupLog || [], m.left, m.right, G.totalShows, G.roster.length, null);
  const context = { rivalry: Math.max(rivalryAB, rivalryBA), isTitle: !!m.isTitle, isFanExpect,
    isChallengeRequest: !!(m._crMatchLocked || m.isCRMatch),
    pendingClashBonus: bdPendingClash, isFirstMeet: bdFr.isFirstMeet, freshnessCount: bdFr.countInWindow,
    freshnessRawBonus: bdFr.bonus };
  const bd = Engine.attendanceV2.calcMatchAppealBreakdown(fA, fB, context, G);

  const _drawLine = (d) => {
    const parts = [`pop${d.popDraw}`];
    if (d.ovrDraw !== 0) parts.push(`ovr${d.ovrDraw > 0 ? '+' : ''}${d.ovrDraw}`);
    d.traits.forEach(t => parts.push(`${t.label}+${t.value}`));
    d.details.forEach(t => parts.push(`${t.label}${t.value > 0 ? '+' : ''}${t.value}`));
    return `<span style="color:var(--text-dim);font-size:10px">${parts.join(' ')}</span>`;
  };

  const bonuses = [];
  if (bd.parityBonus !== 0) bonuses.push(`🤝拮抗${bd.parityBonus > 0 ? '+' : ''}${bd.parityBonus}`);
  if (bd.rivalryAppeal > 0) bonuses.push(`⚡因縁+${bd.rivalryAppeal}`);
  if (bd.titleBonus > 0) bonuses.push(`🏆タイトル+${bd.titleBonus}`);
  if (bd.fanExpectBonus > 0) bonuses.push(`📣期待+${bd.fanExpectBonus}`);
  if (bd.challengeRequestBonus > 0) bonuses.push(`⚔他団体挑戦+${bd.challengeRequestBonus}`);
  if (bd.heelFaceBonus > 0) bonuses.push(`😈善悪+${bd.heelFaceBonus}`);
  if (bd.clashAppeal > 0) bonuses.push(`🥊乱闘蓄積+${bd.clashAppeal}`);
  if (bd.firstMeetBonus > 0) bonuses.push(`🆕初顔合わせ+${bd.firstMeetBonus}`);
  if (bd.stalePenalty < 0) bonuses.push(`😴マンネリ${bd.stalePenalty}`);

  const html = `
    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:6px">
      <div style="text-align:center">
        ${portraitImg(fA.id, 32)}
        <div style="font-size:11px;font-weight:700;margin-top:2px">${fA.name.slice(0,4)}</div>
        <div style="font-size:12px;color:#74b9ff;font-weight:900">集客力 ${bd.drawA.total}</div>
        ${_drawLine(bd.drawA)}
      </div>
      <div style="text-align:center">
        ${portraitImg(fB.id, 32)}
        <div style="font-size:11px;font-weight:700;margin-top:2px">${fB.name.slice(0,4)}</div>
        <div style="font-size:12px;color:#74b9ff;font-weight:900">集客力 ${bd.drawB.total}</div>
        ${_drawLine(bd.drawB)}
      </div>
    </div>
    ${bonuses.length > 0 ? `<div style="border-top:1px solid rgba(200,190,170,0.15);padding-top:4px;margin-bottom:4px;font-size:11px;color:#ddd">${bonuses.join('  ')}</div>` : ''}
    <div style="border-top:1px solid rgba(200,190,170,0.15);padding-top:4px;font-size:13px;font-weight:900;color:var(--gold)">カード魅力 ${bd.total}</div>
  `;

  showCustomTooltip(event.currentTarget, html);
}

// ── S8 春のタッグリーグ: 週12判定 + 今週バナー ──────────────────────
// spec: docs/ui/03-screens/spring-tag-league.md
function _stlIsLeagueWeek() {
  const stl = G.springTagLeague;
  return !!(stl && !stl.cancelled && stl.announcedSeason === G.season
    && G.week === Engine.springTagLeague.LEAGUE_WEEK);
}

function _stlFindFighterAnywhere(id) {
  if (id == null) return null;
  return (G.roster || []).find(f => f.id === id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === id)
    || null;
}

/** 週10(出場4団体決定)/週11(編成期間・編成済み) の今週バナー。存在しないセーブでは何も出さない */
function renderSpringTagLeagueWeekBanner() {
  const stl = G.springTagLeague;
  if (!stl || stl.cancelled || stl.announcedSeason !== G.season) return '';
  if (G.week === Engine.springTagLeague.ANNOUNCE_WEEK) {
    const names = (stl.teams || []).map(t => t.orgName).filter(Boolean).join(' / ');
    return `<div class="stl-week-banner">
      <div class="stl-week-banner-icon">🌸</div>
      <div class="stl-week-banner-body">
        <div class="stl-week-banner-title">春のタッグリーグ 出場4団体決定</div>
        <div class="stl-week-banner-sub">${escHtml(names)}。編成期間は来週(第${Engine.springTagLeague.ENTRY_WEEK}週)です。</div>
      </div>
    </div>`;
  }
  if (G.week === Engine.springTagLeague.ENTRY_WEEK) {
    const myTeam = (stl.teams || []).find(t => t.orgId === 'player');
    const confirmed = !!(myTeam && myTeam.confirmed);
    if (confirmed) {
      const f1 = _stlFindFighterAnywhere(myTeam.f1Id);
      const f2 = _stlFindFighterAnywhere(myTeam.f2Id);
      return `<div class="stl-week-banner is-done">
        <div class="stl-week-banner-icon">🌸</div>
        <div class="stl-week-banner-body">
          <div class="stl-week-banner-title">春のタッグリーグ 編成済み: ${escHtml(f1 ? f1.name : '?')} &amp; ${escHtml(f2 ? f2.name : '?')}</div>
          <div class="stl-week-banner-sub">タップすると組み直せます。</div>
        </div>
        <button class="btn btn-gold" onclick="App.stlOpenEntryModal()">組み直す</button>
      </div>`;
    }
    return `<div class="stl-week-banner is-urgent">
      <div class="stl-week-banner-icon">🌸</div>
      <div class="stl-week-banner-body">
        <div class="stl-week-banner-title">春のタッグリーグ 出場チーム編成期間</div>
        <div class="stl-week-banner-sub">代表タッグ1組を選出してください。編成しない場合はおまかせ編成(サジェスト1位)で開催されます。</div>
      </div>
      <button class="btn btn-gold" onclick="App.stlOpenEntryModal()">編成する</button>
    </div>`;
  }
  return '';
}

// ── 4団体勝ち残り対抗戦: Week34告知 / Week36専用Stage ──
function _agwIsEventWeek() {
  const aw = G.autumnWar;
  return !!(aw && !aw.cancelled && G.week === Engine.autumnWar.EVENT_WEEK);
}

/** ジュニアトーナメント開催週(Week24=夏の最終興行週)。開催成立時は通常興行をブロックする。
 *  不開催年(選手不足キャンセル)は従来どおり通常の特別興行にフォールバック */
function _jtIsEventWeek() {
  return !!(!G.offSeason && G.week === Engine.juniorTournament.WEEK
    && (G.weekPhase === 'juniorTournament'
        || (G._juniorTournamentResult && !G._juniorTournamentResult.cancelled)));
}

function renderAutumnWarWeekBanner() {
  const aw = G.autumnWar;
  if (!aw || aw.cancelled || aw.announcedSeason !== G.season) return '';
  if (G.week === Engine.autumnWar.ANNOUNCE_WEEK) {
    const names = (aw.teams || []).map(t => t.orgName).filter(Boolean).join(' / ');
    return `<div class="stl-week-banner agw-week-banner">
      <div class="stl-week-banner-icon">⚔️</div>
      <div class="stl-week-banner-body">
        <div class="stl-week-banner-title">4団体勝ち残り対抗戦 出場団体決定</div>
        <div class="stl-week-banner-sub">${escHtml(names)}。第${Engine.autumnWar.EVENT_WEEK}週、大会導入の直後に代表3名と出場順を決定します。</div>
      </div>
    </div>`;
  }
  if (G.week === Engine.autumnWar.EVENT_WEEK && aw.champion) {
    const championName = (aw.teams || []).find(t => t.orgId === aw.champion)?.orgName || aw.champion;
    return `<div class="stl-week-banner agw-week-banner is-done">
      <div class="stl-week-banner-icon">🏆</div>
      <div class="stl-week-banner-body">
        <div class="stl-week-banner-title">4団体勝ち残り対抗戦 決着</div>
        <div class="stl-week-banner-sub">優勝 ${escHtml(championName)}。大会結果を記録しました。</div>
      </div>
    </div>`;
  }
  return '';
}

// ── C-6 天頂戦: Week43〜 エントリー導線バナー ──────────────────────
// spec: docs/ui/03-screens/tenchosen.md。weekPhaseは奪わず、manage画面のバナーから
// モーダルを開く(STLバナーの様式踏襲)。未確定でも週送りでエンジンが自己修復する。
function renderTenchosenWeekBanner() {
  const t = G.ppvTournament;
  if (!t || t.season !== G.season) return '';
  if (t.phase === 'entry') {
    return `<div class="stl-week-banner is-urgent tc-week-banner">
      <div class="stl-week-banner-icon">👑</div>
      <div class="stl-week-banner-body">
        <div class="stl-week-banner-title">天頂戦 エントリー受付中 — 4年に一度の全国女子プロレス最強王者決定戦</div>
        <div class="stl-week-banner-sub">特別招待2名が発表されました。自団体の出場選手を選出してください。未選出のまま大会週(第${Engine.ppvTournament.SHOW_WEEK}週)を迎えた場合はおまかせ編成で出場します。</div>
      </div>
      <button class="btn btn-gold" onclick="App.tcOpenEntryModal()">エントリー</button>
    </div>`;
  }
  if (t.phase === 'ready' && G.week < Engine.ppvTournament.SHOW_WEEK) {
    return `<div class="stl-week-banner is-done tc-week-banner">
      <div class="stl-week-banner-icon">👑</div>
      <div class="stl-week-banner-body">
        <div class="stl-week-banner-title">天頂戦 出場選手 確定済み</div>
        <div class="stl-week-banner-sub">第${Engine.ppvTournament.SHOW_WEEK}週に16名トーナメントが開催されます。</div>
      </div>
    </div>`;
  }
  return '';
}

function _stlBlockedShowPrepHtml() {
  return `<div class="stl-block-banner">
    <div class="stl-block-banner-icon">🌸</div>
    <div class="stl-block-banner-title">今週は春のタッグリーグ開催週</div>
    <div class="stl-block-banner-sub">第${Engine.springTagLeague.LEAGUE_WEEK}週は通常興行の代わりに春のタッグリーグ(4団体総当たり戦+優勝決定戦)が開催されます。今週のカード編成はありません。</div>
  </div>`;
}

function _jtBlockedShowPrepHtml() {
  return `<div class="stl-block-banner">
    <div class="stl-block-banner-icon">🏟️</div>
    <div class="stl-block-banner-title">今週はジュニアトーナメント</div>
    <div class="stl-block-banner-sub">第${Engine.juniorTournament.WEEK}週は通常興行の代わりに、U-20ジュニアトーナメントが開催されます。今週のカード編成はありません。</div>
  </div>`;
}

function _agwBlockedShowPrepHtml() {
  return `<div class="stl-block-banner agw-block-banner">
    <div class="stl-block-banner-icon">⚔️</div>
    <div class="stl-block-banner-title">今週は4団体勝ち残り対抗戦</div>
    <div class="stl-block-banner-sub">第${Engine.autumnWar.EVENT_WEEK}週は通常興行の代わりに、各団体3名による勝ち残り戦が開催されます。週を処理すると大会画面へ進みます。</div>
  </div>`;
}

function renderShowPrep() {
  if (typeof App !== 'undefined' && App.repairProgressionState && App.repairProgressionState('renderShowPrep')) {
    try { Storage.autoSave(); } catch (_e) {}
  }
  const el = document.getElementById('showPrepContent');
  // v2.0: 興行準備は manage/showPrep フェーズのみ（settled等の非興行フェーズでは表示しない）
  if (!isShowWeek(G.week) || !['manage', 'showPrep'].includes(G.weekPhase)) {
    el.innerHTML = '<p style="color:var(--text-sub)">興行週ではありません。</p>';
    return;
  }

  // 春のタッグリーグ Week12: 通常カード編成をブロック（PPV week48バイパスと同型）
  if (_stlIsLeagueWeek()) {
    el.innerHTML = _stlBlockedShowPrepHtml();
    return;
  }

  if (_agwIsEventWeek()) {
    el.innerHTML = _agwBlockedShowPrepHtml();
    return;
  }

  if (_jtIsEventWeek()) {
    el.innerHTML = _jtBlockedShowPrepHtml();
    return;
  }

  let html = '';

  // 興行準備ヘッダーバナー
  html += '<div class="arena-header">';
  html += '<img src="../image/arena-header.webp" class="arena-header-img" onerror="this.style.display=\'none\'" alt="">';
  html += '</div>';

  // v2.0 Phase1-6: メディア密着取材バナー
  if (G.mediaSpotlight) {
    const sp = G.mediaSpotlight;
    const spFighter = G.roster.find(f => f.id === sp.fighterId);
    const spName = spFighter ? spFighter.name : sp.fighterName;
    html += `<div class="media-spotlight-banner">
      📺 <strong>${spName}</strong>の密着取材中（${sp.outletName}・残り${sp.remainingShows}興行）
      — この選手にいい試合を組んでください
    </div>`;
  }

  // Special show / PPV banner
  if (isPPV(G.week)) {
    html += `<div style="background:linear-gradient(135deg,#2d1b00,#4a2c00);border:1px solid #f39c12;border-radius:8px;padding:12px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:16px;font-weight:700;color:#f1c40f;letter-spacing:1px">🏆 PPV GRAND FINAL</div>
      <div style="font-size:12px;color:#e67e22;margin-top:4px">年間最大の舞台！全会場で試合枠+1</div>
    </div>`;
  } else if (isSpecialShow(G.week)) {
    html += `<div style="background:linear-gradient(135deg,#1a0033,#2e0055);border:1px solid #9b59b6;border-radius:8px;padding:12px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:15px;font-weight:700;color:#d4a8ff;letter-spacing:1px">⭐ 月末特別興行</div>
      <div style="font-size:12px;color:#a29bfe;margin-top:4px">特別な舞台！全会場で試合枠+1</div>
    </div>`;
  }

  // ── Phase 5: 王座空位（A-4 置いていき or 通常空位）→ 王座決定戦の案内 ──
  if (G.titles?.world?.championId == null && !G.titles?.world?.externalHolder && G.titleEstablished) {
    const eligibleIds = Engine.title.getEligibleChallengers(G.roster, null);
    const topTwo = eligibleIds
      .map(id => G.roster.find(c => c.id === id))
      .filter(Boolean)
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
      .slice(0, 2);
    if (topTwo.length >= 2) {
      const [a, b] = topTwo;
      html += `<div style="background:linear-gradient(135deg,#0d2a3a,#1a3f5a);border:1px solid #6fa8c8;border-radius:8px;padding:12px 16px;margin-bottom:14px">
        <div style="font-size:14px;font-weight:700;color:#bfe0ff;letter-spacing:1px;margin-bottom:6px">👑 世界王座 空位中</div>
        <div style="font-size:12px;color:#dfeefc;line-height:1.6">
          王座決定戦の有力候補: <strong>${a.name}</strong>（OVR ${Engine.util.ov(a)}） × <strong>${b.name}</strong>（OVR ${Engine.util.ov(b)}）<br>
          メインイベントの 🏆 を有効化すると王座決定戦になります（勝者が新王者）。
        </div>
      </div>`;
    }
  }

  // ── タイトル奪還挑戦バナー（Phase 4: relationship-events-betrayal-task §6） ──
  if (G.titles?.world?.externalHolder) {
    const eh = G.titles.world.externalHolder;
    const heldByOrg = G.aiOrgs?.[eh.orgId];
    const heldByOrgName = heldByOrg?.name || eh.orgId;
    // 元王者の名前を AI 団体ロスターから引く（離脱直後に該当しているはず）
    const exChamp = heldByOrg?.roster?.find(c => c.id === eh.fighterId);
    const exChampName = exChamp?.name || `元王者#${eh.fighterId}`;
    const canIssue = Engine.title.canIssueReclaim(G, 'world');
    const pending = !!G._pendingReclaim;
    const nowAbs = Engine.util.absWeek(G.season, G.week);
    const transferAbs = Engine.util.absWeek(eh.transferredSeason || 1, eh.transferredWeek || 1);
    const lastLossAbs = (G.reclaimChallenges || [])
      .filter(c => c.titleType === 'world' && c.result === 'lose')
      .reduce((max, c) => Math.max(max, Engine.util.absWeek(c.resolvedSeason || 1, c.resolvedWeek || 1)), 0);
    const cdRemain = Math.max(
      Math.max(0, Engine.title.RECLAIM_COOLDOWN_WEEKS - (nowAbs - transferAbs)),
      lastLossAbs > 0 ? Math.max(0, Engine.title.RECLAIM_COOLDOWN_WEEKS - (nowAbs - lastLossAbs)) : 0
    );

    html += `<div style="background:linear-gradient(135deg,#3a0d12,#5a1f28);border:1px solid #d4607a;border-radius:8px;padding:12px 16px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:700;color:#ffb3c1;letter-spacing:1px;margin-bottom:6px">🏆 持ち出された王座</div>
      <div style="font-size:12px;color:#f5d4dc;line-height:1.6">
        ${exChampName} が <strong>${heldByOrgName}</strong> へ世界王座を持ち去った。挑戦状を発行して取り戻せ。
      </div>`;
    if (pending) {
      const ch = G.roster.find(c => c.id === G._pendingReclaim.challengerId);
      html += `<div style="margin-top:10px;padding:8px 10px;background:rgba(255,195,0,0.15);border-radius:6px;color:#ffd966;font-size:12px">
        📜 挑戦状発行済み — 次の興行のメインで <strong>${ch?.name || '挑戦者'}</strong> vs ${exChampName}
        <button class="btn-secondary" style="margin-left:12px;padding:4px 10px;font-size:11px" onclick="App.cancelReclaim()">取り下げる</button>
      </div>`;
    } else if (canIssue) {
      html += `<div style="margin-top:10px"><button class="btn-primary" style="background:linear-gradient(135deg,#d4607a,#a8334d);padding:8px 16px;font-size:13px" onclick="App.openReclaimDialog()">⚔ 奪還挑戦状を発行</button></div>`;
    } else {
      html += `<div style="margin-top:10px;color:#aaa;font-size:11px">挑戦可能まで残り <strong>${cdRemain}</strong> 週</div>`;
    }
    html += '</div>';
  }

  // ── F07 DEMAND_MAIN ディレクティブバナー（Phase C）──
  // 派閥リーダーへの「メイン要求」を A 受諾した場合、推奨フラグが立つ。
  // メインカードに当該派閥メンバーを含めるとリーダー満足、含めないと小さな trust ペナルティ。
  if (G._pendingF07Directive && G._pendingF07Directive.type === 'DEMAND_MAIN') {
    const dir = G._pendingF07Directive;
    const fac = (G.factions || []).find(f => f.id === dir.factionId);
    if (fac) {
      const memberNames = fac.memberIds
        .map(id => G.roster.find(c => c.id === id))
        .filter(Boolean)
        .slice(0, 8)
        .map(c => c.name)
        .join(' / ');
      const mainSlot = G.showCard[0];
      let mainContainsFaction = false;
      if (mainSlot) {
        if (mainSlot.matchType === 'tag') {
          const ids = [mainSlot.teamA?.fighter1, mainSlot.teamA?.fighter2, mainSlot.teamB?.fighter1, mainSlot.teamB?.fighter2].filter(Boolean);
          mainContainsFaction = ids.some(id => fac.memberIds.includes(id));
        } else {
          mainContainsFaction = (mainSlot.left && fac.memberIds.includes(mainSlot.left)) || (mainSlot.right && fac.memberIds.includes(mainSlot.right));
        }
      }
      const ok = mainContainsFaction;
      const remaining = dir.remainingShows != null ? dir.remainingShows : 1;
      const total = dir.totalShows != null ? dir.totalShows : remaining;
      const periodLabel = total > 1 ? `（残り ${remaining}/${total} 興行）` : '';
      html += `<div style="background:linear-gradient(135deg,${ok ? '#1d2e1a,#2a4422' : '#2e2a1a,#443a22'});border:1px solid ${ok ? '#7bc46c' : '#e0c98a'};border-radius:8px;padding:10px 14px;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:${ok ? '#bff5b3' : '#f0d99a'};letter-spacing:1px;margin-bottom:4px">📣 ${fac.name} からのメイン推薦${periodLabel}</div>
        <div style="font-size:12px;color:#dcd6c0;line-height:1.55">
          メイン枠に <strong>${fac.name}</strong> のメンバーを推す約束をしています。<br>
          <span style="color:#aaa;font-size:11px">候補: ${memberNames || '—'}</span><br>
          <span style="color:${ok ? '#9be08a' : '#e0a85a'};font-size:11px;margin-top:2px;display:inline-block">
            ${ok ? '✓ 現在のメインに該当メンバーが入っています' : '⚠ 現在のメインに該当メンバー無し（リーダーが不満を募らせます）'}
          </span>
        </div>
      </div>`;
    }
  }

  // L1: 会場選択（全会場選択可能・リスク指標付き）
  html += '<div class="panel-title" style="margin-top:0">会場選択</div>';
  const baseAtt = Engine.economy.calcBaseAttendance(G.orgPop);
  html += '<div class="venue-grid">';
  VENUES.forEach((v, i) => {
    const selected = G.showVenue === i;
    const fillRate = baseAtt / v.cap;
    // orgPop リバランス v1.1 §5: ドーム年1回制限チェック
    const isDomeLocked = (i === 9 && (G.domeShowsThisSeason || 0) >= 1);
    let riskClass = '', riskLabel = '';
    if (isDomeLocked) { riskClass = 'venue-danger'; riskLabel = '🔒 今季使用済み'; }
    else if (fillRate >= 0.7) { riskClass = 'venue-safe'; riskLabel = '◎ 安全'; }
    else if (fillRate >= 0.4) { riskClass = 'venue-risky'; riskLabel = '△ 挑戦'; }
    else { riskClass = 'venue-danger'; riskLabel = '✕ 危険'; }
    const clickHandler = isDomeLocked
      ? `onclick="showToast('今シーズンは既にドーム興行を開催済みです。次シーズンに挑戦してください。', 4000)"`
      : `onclick="App.setShowVenue(${i});renderShowPrep()"`;
    html += `<div class="venue-card ${selected ? 'selected' : ''} ${riskClass}${isDomeLocked ? ' venue-locked' : ''}"
      ${clickHandler}
      style="${isDomeLocked ? 'opacity:0.55;cursor:not-allowed' : ''}">
      ${v.img ? `<img src="${v.img}" style="width:100%;height:80px;object-fit:cover;border-radius:4px 4px 0 0;opacity:0.8" onerror="this.style.display='none'" alt="">` : ''}
      <div class="venue-name">${v.name}</div>
      <div class="venue-info">キャパ: ${v.cap.toLocaleString()}人</div>
      <div class="venue-info">コスト: ${v.cost}万</div>
      <div class="venue-info">試合枠: ${v.maxMatches}試合${(isSpecialShow(G.week) || isPPV(G.week)) ? ' <span style="color:var(--gold)">(+1)</span>' : ''}</div>
      <div class="venue-risk">${riskLabel}</div>
    </div>`;
  });
  html += '</div>';

  // Match card — 会場規模連動の試合枠
  // pad up OR trim down to match the venue's limit (tag match = 2 slots)
  {
    const adjusted = Engine.util.normalizeShowCardForVenue(G.showCard, G.week, G.showVenue);
    if (JSON.stringify(adjusted) !== JSON.stringify(G.showCard)) G = { ...G, showCard: adjusted };
  }

  // Sanitize stale IDs (released/retired/transferred wrestlers still in card)
  // forcedRest（S3休養願い承認）の選手も除外
  {
    const scheduledCR = getScheduledChallengeCard();
    const rosterMap = new Map([
      ...G.roster,
      ...(scheduledCR ? [...scheduledCR.teamA, ...scheduledCR.teamB] : []),
    ].map(c => [c.id, c]));
    let dirty = false;
    const _isOk = id => { const f = rosterMap.get(id); return id > 0 && f && !f.forcedRest; };
    const cleaned = G.showCard.map(m => {
      if (m.matchType === 'tag') {
        const a1 = _isOk(m.teamA.fighter1), a2 = _isOk(m.teamA.fighter2);
        const b1 = _isOk(m.teamB.fighter1), b2 = _isOk(m.teamB.fighter2);
        if ((!a1 && m.teamA.fighter1 > 0) || (!a2 && m.teamA.fighter2 > 0) ||
            (!b1 && m.teamB.fighter1 > 0) || (!b2 && m.teamB.fighter2 > 0)) dirty = true;
        return { ...m,
          teamA: { fighter1: a1 ? m.teamA.fighter1 : 0, fighter2: a2 ? m.teamA.fighter2 : 0 },
          teamB: { fighter1: b1 ? m.teamB.fighter1 : 0, fighter2: b2 ? m.teamB.fighter2 : 0 },
        };
      }
      const leftOk = _isOk(m.left), rightOk = _isOk(m.right);
      if ((m.left > 0 && !leftOk) || (m.right > 0 && !rightOk)) dirty = true;
      return { ...m, left: leftOk ? m.left : 0, right: rightOk ? m.right : 0,
        isTitle: !!m.isTitle && leftOk && rightOk };
    });
    if (dirty) G = { ...G, showCard: cleaned };
  }

  // ── F08 ロック解除: ディレクティブが存在しないならロック flag を全スロットでクリア ──
  if (!G._pendingF08Directive) {
    let hadLock = false;
    G.showCard.forEach(m => { if (m._f08Locked) { delete m._f08Locked; hadLock = true; } });
    if (hadLock) G = { ...G, showCard: [...G.showCard] };
  }

  // ── F09 ロック解除: pending F09 が無いならロック flag を全スロットでクリア ──
  if (!G._pendingF09) {
    let hadLock = false;
    G.showCard.forEach(m => { if (m._f09Locked) { delete m._f09Locked; hadLock = true; } });
    if (hadLock) G = { ...G, showCard: [...G.showCard] };
  }

  // ── 派閥内序列戦 ロック解除: pending が無いならロック flag を全スロットでクリア ──
  if (!G._pendingInternalChallenge) {
    let hadLock = false;
    G.showCard.forEach(m => { if (m._internalChallengeLocked) { delete m._internalChallengeLocked; hadLock = true; } });
    if (hadLock) G = { ...G, showCard: [...G.showCard] };
  }

  // ── 派閥内序列戦 注入: _pendingInternalChallenge が立っていれば挑戦者 vs リーダーを slot 0 に強制注入 ──
  if (G._pendingInternalChallenge) {
    const ic = G._pendingInternalChallenge;
    const ch = G.roster.find(c => c.id === ic.challengerId && !c.injury && !c.forcedRest);
    const ld = G.roster.find(c => c.id === ic.leaderId && !c.injury && !c.forcedRest);
    if (!ch || !ld) {
      // 怪我等で成立不能 → pending を解除
      const { _pendingInternalChallenge: _, ...rest } = G;
      G = rest;
    } else {
      // 既存 slot に両者がペアで入っているか
      let alreadyPlaced = false;
      for (const m of G.showCard) {
        if (m.matchType === 'tag') continue;
        if ((m.left === ic.challengerId && m.right === ic.leaderId) || (m.left === ic.leaderId && m.right === ic.challengerId)) {
          alreadyPlaced = true;
          m._internalChallengeLocked = true;
          break;
        }
      }
      if (!alreadyPlaced) {
        // 他の試合に既出 → その試合から除去
        const newCard = G.showCard.map(m => {
          if (m.matchType === 'tag') {
            let nm = { ...m };
            const ta = { ...(m.teamA || {}) };
            const tb = { ...(m.teamB || {}) };
            if (ta.fighter1 === ic.challengerId || ta.fighter1 === ic.leaderId) ta.fighter1 = 0;
            if (ta.fighter2 === ic.challengerId || ta.fighter2 === ic.leaderId) ta.fighter2 = 0;
            if (tb.fighter1 === ic.challengerId || tb.fighter1 === ic.leaderId) tb.fighter1 = 0;
            if (tb.fighter2 === ic.challengerId || tb.fighter2 === ic.leaderId) tb.fighter2 = 0;
            nm.teamA = ta; nm.teamB = tb;
            return nm;
          }
          let nm = { ...m };
          if (m.left === ic.challengerId || m.left === ic.leaderId) nm.left = 0;
          if (m.right === ic.challengerId || m.right === ic.leaderId) nm.right = 0;
          return nm;
        });
        if (newCard.length === 0) newCard.push({ left: 0, right: 0, isTitle: false });
        // slot 0（メイン）に強制注入。元 slot 0 が tag の場合は単発に置換
        if (newCard[0] && newCard[0].matchType === 'tag') {
          newCard[0] = { left: ic.challengerId, right: ic.leaderId, isTitle: false, _internalChallengeLocked: true };
        } else {
          newCard[0] = {
            ...(newCard[0] || {}),
            left: ic.challengerId, right: ic.leaderId,
            matchType: undefined, teamA: undefined, teamB: undefined,
            // 序列戦は専用固定枠。既存メインのタイトル属性は引き継がない
            isTitle: false,
            _internalChallengeLocked: true,
          };
        }
        G = { ...G, showCard: newCard };
      }
    }
  }

  // ── F09 注入: _pendingF09 が立っていれば派閥対抗戦カードを強制組込み ──
  if (G._pendingF09 && typeof Engine.factions.buildF09MatchPairs === 'function') {
    const f09 = G._pendingF09;
    const pairs = Engine.factions.buildF09MatchPairs(G, f09.factionAId, f09.factionBId);
    const pairCount = pairs.length;
    if (pairCount === 0) {
      const { _pendingF09: _, ...rest } = G; G = rest;
    } else {
      const slots = Math.min(pairCount, G.showCard.length);
      const newCard = [...G.showCard];
      for (let i = 0; i < slots; i++) {
        const p = pairs[i];
        if (newCard[i] && newCard[i].matchType === 'tag') {
          newCard[i] = { left: 0, right: 0, isTitle: false };
        }
        newCard[i] = {
          ...(newCard[i] || {}),
          left: p.fighterIdA, right: p.fighterIdB,
          matchType: undefined,
          teamA: undefined, teamB: undefined,
          isTitle: !!(newCard[i] && newCard[i].isTitle),
          _f09Locked: true,
        };
      }
      // F09 ロックされた選手は他枠から除去
      const lockedIds = new Set();
      pairs.forEach(p => { lockedIds.add(p.fighterIdA); lockedIds.add(p.fighterIdB); });
      for (let i = slots; i < newCard.length; i++) {
        const m = newCard[i];
        if (!m) continue;
        if (m.matchType === 'tag') {
          const ta1 = lockedIds.has(m.teamA?.fighter1) ? 0 : m.teamA?.fighter1;
          const ta2 = lockedIds.has(m.teamA?.fighter2) ? 0 : m.teamA?.fighter2;
          const tb1 = lockedIds.has(m.teamB?.fighter1) ? 0 : m.teamB?.fighter1;
          const tb2 = lockedIds.has(m.teamB?.fighter2) ? 0 : m.teamB?.fighter2;
          newCard[i] = { ...m,
            teamA: { fighter1: ta1 || 0, fighter2: ta2 || 0 },
            teamB: { fighter1: tb1 || 0, fighter2: tb2 || 0 } };
        } else {
          const left = lockedIds.has(m.left) ? 0 : m.left;
          const right = lockedIds.has(m.right) ? 0 : m.right;
          newCard[i] = { ...m, left: left || 0, right: right || 0 };
        }
      }
      G = { ...G, showCard: newCard };
    }
  }

  // ── F08 ディレクティブ注入: _pendingF08Directive が立っていればリーダー同士を強制組込み ──
  if (G._pendingF08Directive && G._pendingF08Directive.leaderAId && G._pendingF08Directive.leaderBId) {
    const d = G._pendingF08Directive;
    const lA = G.roster.find(c => c.id === d.leaderAId && !c.injury && !c.forcedRest);
    const lB = G.roster.find(c => c.id === d.leaderBId && !c.injury && !c.forcedRest);
    if (!lA || !lB) {
      // どちらかがロスター外/欠場 → ディレクティブ無効化
      const { _pendingF08Directive: _, ...rest } = G;
      G = rest;
    } else {
      // 既存slotに両者がペアで入っているかチェック
      let alreadyPlaced = false;
      for (const m of G.showCard) {
        if (m.matchType === 'tag') continue;
        if ((m.left === d.leaderAId && m.right === d.leaderBId) || (m.left === d.leaderBId && m.right === d.leaderAId)) {
          alreadyPlaced = true;
          m._f08Locked = true;
          break;
        }
      }
      if (!alreadyPlaced) {
        // どちらかが別の試合に既出 → その試合から除去
        const newCard = G.showCard.map(m => {
          if (m.matchType === 'tag') return m;
          let nm = { ...m };
          if (m.left === d.leaderAId || m.left === d.leaderBId) nm.left = 0;
          if (m.right === d.leaderAId || m.right === d.leaderBId) nm.right = 0;
          return nm;
        });
        // slot 0 を F08 固定に置き換え
        if (newCard.length === 0) newCard.push({ left: 0, right: 0, isTitle: false });
        newCard[0] = { left: d.leaderAId, right: d.leaderBId, isTitle: !!newCard[0].isTitle, _f08Locked: true };
        G = { ...G, showCard: newCard };
      }
    }
  }

  // ── 集客予測 + ファンの声 + マッチカード v7 ──────────────────────────────

  // 集客予測計算（v2）
  // Reserve the three highest card positions for an accepted inter-org
  // challenge before the player fills the remaining venue slots.
  const eligibleChallengeShow = !!Engine.challengeRequest?.isEligibleHomeShow?.(G);
  if (eligibleChallengeShow && G._pendingAwayChallengeMatch && Engine.challengeRequest?.removeFightersFromCard) {
    const awayOwnIds = G._pendingAwayChallengeMatch.requesterOrgId === 'player'
      ? G._pendingAwayChallengeMatch.teamAIds
      : G._pendingAwayChallengeMatch.teamBIds;
    const clearedAwayCard = Engine.challengeRequest.removeFightersFromCard(G.showCard, awayOwnIds);
    if (JSON.stringify(clearedAwayCard) !== JSON.stringify(G.showCard)) G = { ...G, showCard: clearedAwayCard };
  }
  if (eligibleChallengeShow && (G._pendingIncomingChallengeMatch || G._pendingChallengeMatch?.isInverse) && Engine.challengeRequest?.reserveScheduledMatches) {
    const reservedCR = Engine.challengeRequest.reserveScheduledMatches(G, G.showCard);
    if (reservedCR) {
      if (JSON.stringify(reservedCR.card) !== JSON.stringify(G.showCard)) {
        G = { ...G, showCard: reservedCR.card };
      }
    } else {
      const clearedCard = Engine.challengeRequest.clearReservedMatches(G, G.showCard);
      const { _pendingIncomingChallengeMatch: _invalidIncomingCR, _pendingChallengeMatch: _legacyIncomingCR, ...rest } = G;
      G = { ...rest, showCard: clearedCard };
      if (typeof showToast === 'function') showToast('⚠ 挑戦試合の出場メンバーが揃わないため、予約を解除しました', 5000);
    }
  }

  let scheduledSingleNotice = null;
  const b3AwayConflict = G._pendingIncomingB3Match && Engine.challengeRequest?.hasAwayParticipantConflict?.(G, [
    G._pendingIncomingB3Match.fighterId,
    G._pendingIncomingB3Match.challenger?.id,
  ]);
  if (eligibleChallengeShow && !getScheduledChallengeCard() && G._pendingIncomingB3Match && !b3AwayConflict && Engine.challengeRequest?.reserveScheduledSingleMatch) {
    const reservedSingle = Engine.challengeRequest.reserveScheduledSingleMatch(G, G.showCard);
    if (reservedSingle) {
      scheduledSingleNotice = reservedSingle.scheduled;
      if (JSON.stringify(reservedSingle.card) !== JSON.stringify(G.showCard)) G = { ...G, showCard: reservedSingle.card };
    } else {
      const { _pendingIncomingB3Match: _invalidB3, ...rest } = G;
      G = { ...rest, showCard: Engine.challengeRequest.clearReservedMatches(G, G.showCard) };
      if (typeof showToast === 'function') showToast('⚠ 挑戦試合の出場条件が整わないため、予約を解除しました', 5000);
    }
  }

  const scheduledCRNotice = getScheduledChallengeCard();
  if (scheduledCRNotice) {
    const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
    const regularSlots = Math.max(0, maxMatches - 3);
    const requesterName = scheduledCRNotice.requesterOrgName || scheduledCRNotice.requesterOrgId || '挑戦側';
    const opponentName = scheduledCRNotice.opponentOrgName || scheduledCRNotice.opponentOrgId || '迎撃側';
    html += `<div style="margin:10px 0;padding:12px 14px;border:1px solid rgba(235,105,90,.55);background:rgba(145,45,40,.18);border-radius:6px;color:#ffd9d2;font-size:12px;line-height:1.65">
      <strong style="color:#ff9e8f">⚔ 他団体挑戦シリーズ</strong>　${requesterName} vs ${opponentName}<br>
      メインイベントから上位3試合を固定しています。会場の全${maxMatches}枠のうち、通常カードは残り${regularSlots}枠です。各挑戦試合には集客評価+${MATCH_APPEAL_CONFIG.challengeRequestAppeal}が入ります。
    </div>`;
  }
  if (scheduledSingleNotice) {
    html += `<div style="margin:10px 0;padding:12px 14px;border:1px solid var(--c-negative);background:var(--bg-mid);border-radius:6px;color:var(--text-sub);font-size:12px;line-height:1.65">
      <strong style="color:var(--c-negative)">⚔ 挑戦状によるメインイベント</strong>　${scheduledSingleNotice.playerFighter.name} vs ${scheduledSingleNotice.challenger.name}<br>
      挑戦試合をメインイベントに固定しています。残りの枠に通常カードを編成してください。
    </div>`;
  }
  if (eligibleChallengeShow && b3AwayConflict) {
    html += `<div style="margin:10px 0;padding:12px 14px;border:1px solid var(--c-info);background:var(--bg-mid);border-radius:6px;color:var(--text-sub);font-size:12px;line-height:1.65">
      <strong style="color:var(--c-info)">📨 挑戦状は次の通常興行へ</strong><br>
      対戦予定者が敵地遠征にも出場するため、この挑戦試合は破棄せず次の通常興行まで持ち越します。
    </div>`;
  }
  if (!eligibleChallengeShow && (G._pendingIncomingChallengeMatch || G._pendingIncomingB3Match)) {
    html += `<div style="margin:10px 0;padding:12px 14px;border:1px solid var(--c-info);background:var(--bg-mid);border-radius:6px;color:var(--text-sub);font-size:12px;line-height:1.65">
      <strong style="color:var(--c-info)">📨 挑戦試合は次の通常興行へ</strong><br>
      今回は固定興行のためカードへ割り込まず、挑戦試合は次の通常興行まで持ち越されます。
    </div>`;
  }
  // away-flow-redesign CH-2: 「🚌 敵地遠征の予約」バナーと手動起動ボタンは廃止。
  // 遠征が未消化のときは startShowPrep()（ui-common.js）がこの興行準備画面自体を経由させず、
  // App.beginAwayChallengeTravel() で先に「敵地へ向かう」演出→遠征試合を挟むため、
  // この画面が描画される時点では原則として遠征は解決済み（固定興行週で消化待ちの間は無表示）。
  // App.startAwayChallengeFromPrep() 自体は安全弁として executeShow() 側に残置している。

  const fanExpects = Engine.fanExpect.generate(G);
  const _isValidSlot = m => m.matchType === 'tag'
    ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
    : (m.left > 0 && m.right > 0);
  const validCurrent = G.showCard.filter(m => !m.matchType && m.left > 0 && m.right > 0);
  const matchedCount = Engine.fanExpect.countMatched(validCurrent, fanExpects);
  const validMatches = G.showCard.filter(m => _isValidSlot(m));
  const hasTitlePreview = validMatches.some(m => m.isTitle);
  const previewMatchAppeals = validMatches.map(m => {
    if (m.matchType === 'tag') {
      // タッグ: 4人の平均集客力で簡易計算
      const ids = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
      const fighters = ids.map(id => getShowCardFighter(id)).filter(Boolean);
      if (fighters.length < 4) return 0;
      return fighters.reduce((sum, f) => sum + Engine.attendanceV2.calcDrawPower(f, G), 0) / 2;
    }
    const fA = getShowCardFighter(m.left);
    const fB = getShowCardFighter(m.right);
    if (!fA || !fB) return 0;
    const rivalryAB = G.relationships ? (G.relationships[`${m.left}>${m.right}`]?.rivalry || 0) : 0;
    const rivalryBA = G.relationships ? (G.relationships[`${m.right}>${m.left}`]?.rivalry || 0) : 0;
    const isFE = fanExpects && fanExpects.some(fe =>
      (fe.leftId === m.left && fe.rightId === m.right) || (fe.leftId === m.right && fe.rightId === m.left));
    const uiRivalryLevel = Engine.title.getRivalryLevel(G, m.left, m.right);
    const uiPendingClash = uiRivalryLevel?.pendingClashBonus || 0;
    const uiFr = Engine.freshness.calc(G.matchupLog || [], m.left, m.right, G.totalShows, G.roster.length, null);
    return Engine.attendanceV2.calcMatchAppeal(fA, fB, {
      rivalry: Math.max(rivalryAB, rivalryBA), isTitle: !!m.isTitle, isFanExpect: isFE,
      isChallengeRequest: !!(m._crMatchLocked || m.isCRMatch),
      pendingClashBonus: uiPendingClash, isFirstMeet: uiFr.isFirstMeet, freshnessCount: uiFr.countInWindow,
      freshnessRawBonus: uiFr.bonus,
    }, G);
  });
  const _allMatchFighterIds = new Set();
  validMatches.forEach(m => {
    if (m.matchType === 'tag') {
      [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2].forEach(id => _allMatchFighterIds.add(id));
    } else { _allMatchFighterIds.add(m.left); _allMatchFighterIds.add(m.right); }
  });
  const previewNonMatchPromo = G.roster.filter(c => !_allMatchFighterIds.has(c.id)).reduce((sum, c) => sum + (c.promoStack || 0), 0);
  const previewShowDraw = Engine.attendanceV2.calcShowDraw(previewMatchAppeals, previewNonMatchPromo, G.showVenue);
  const prediction = Engine.economy.getAttendancePrediction(G, G.showVenue, previewShowDraw);
  // MQ再設計P3c(§3.2/§3.2b): 予想MQタイルは会場の熱(venueHeat)ベースに変更。
  // fp(fill pressure)はrawDemand/capacityで、実際のfinalize計算と同じ経路(calcAttendanceV2)を使う。
  const previewV2Result = Engine.attendanceV2.calcAttendanceV2(G, G.showVenue, previewShowDraw, null);
  const previewFp = previewV2Result.rawDemand / VENUES[G.showVenue].cap;
  const estCrowdMQ = Engine.economy.calcVenueHeat(G.showVenue, previewFp);
  const v = VENUES[G.showVenue];
  const heat = getHeatLevel();
  const titleCd = Engine.title.canTitleMatch(G);

  // 予測レベル → ムードアイコン + ドット数
  const _spPredMeta = [
    { icon: '🔥', dots: 5 }, { icon: '🔥', dots: 5 },
    { icon: '😊', dots: 4 }, { icon: '🤔', dots: 3 },
    { icon: '😟', dots: 2 }, { icon: '😰', dots: 1 },
  ];
  const _spPredIdx = ATTENDANCE_PREDICTION.findIndex(p => prediction.estOccRate >= p.min);
  const _spPred = _spPredIdx >= 0 ? _spPredMeta[_spPredIdx] : _spPredMeta[_spPredMeta.length - 1];
  const _spMoodText = prediction.text.replace(/^[\S]+\s*/, '');
  const _spDots = Array(5).fill(0).map((_, di) =>
    `<div class="sp-mood-dot" style="${di < _spPred.dots ? 'background:' + prediction.color : ''}"></div>`
  ).join('');

  // 集客予測パネル v7
  html += `<div class="sp-forecast">
    <div class="sp-mood-row">
      <div class="sp-mood-icon">${_spPred.icon}</div>
      <div class="sp-mood-label" style="color:${prediction.color}">${_spMoodText}</div>
      <div class="sp-mood-dots">${_spDots}</div>
    </div>
    <div class="sp-metrics">
      <div class="sp-metric"><div class="sp-metric-val" style="color:${heat.color}">${heat.label}</div><div class="sp-metric-label">Heat</div></div>
      ${estCrowdMQ.total !== 0 ? `<div class="sp-metric" style="cursor:help" ${_tipAttr('会場の熱気予測。ここに各試合の注目度(人気・因縁・タイトル・メイン枠など)を掛けた分だけ試合品質(MQ)に効きます。超満員は試合を熱くし、ガラガラは冷やします。')}><div class="sp-metric-val" style="color:${estCrowdMQ.total > 0 ? 'var(--green)' : 'var(--red)'}">${estCrowdMQ.total >= 0 ? '+' : ''}${Math.round(estCrowdMQ.total * 10) / 10}</div><div class="sp-metric-label">会場の熱</div></div>` : ''}
      ${hasTitlePreview
        ? `<div class="sp-metric"><div class="sp-metric-val" style="color:var(--gold)">🏆</div><div class="sp-metric-label">タイトル戦</div></div>`
        : (titleCd.allowed
          ? `<div class="sp-metric"><div class="sp-metric-val" style="color:var(--gold)">🏆</div><div class="sp-metric-label">王座戦 解禁中</div></div>`
          : `<div class="sp-metric"><div class="sp-metric-val" style="color:var(--text-dim);font-size:18px">⏳${titleCd.weeksLeft}週</div><div class="sp-metric-label">王座戦 解禁まで</div></div>`)}
      <div class="sp-metric"><div class="sp-metric-val" style="color:var(--text-sub)">${v.cap.toLocaleString()}</div><div class="sp-metric-label">会場席数</div></div>
      <div class="sp-metric"><div class="sp-metric-val" style="color:#e17055">-${v.cost}万</div><div class="sp-metric-label">会場費</div></div>
    </div>
  </div>`;

  // ファンの声 v7
  if (fanExpects.length > 0) {
    html += `<div class="sp-fan-voices">
      <div class="sp-fan-voices-title">🎤 ファンの声${matchedCount > 0 ? ` <span style="color:var(--green);font-size:9px">（${matchedCount}件反映中 → MQ+5/試合）</span>` : ''}</div>
      <div class="sp-fan-items">`;
    fanExpects.forEach(exp => {
      const isOnCard = validCurrent.some(m =>
        (m.left === exp.leftId && m.right === exp.rightId) ||
        (m.left === exp.rightId && m.right === exp.leftId));
      html += `<div class="sp-fan-item${isOnCard ? ' matched' : ''}">${isOnCard ? '✓ ' : '• '}${exp.reason}</div>`;
    });
    html += `</div></div>`;
  }

  // カードヘッダー v7
  html += `<div class="sp-card-header">
    <span class="sp-card-header-title">Match Card</span>${_tipIcon('<strong style="color:var(--gold)">おまかせ編成</strong><br>・🔥おすすめ — 因縁・鮮度・話題性を考慮した最適カード<br>・💪OVR順 — 実力上位同士をマッチング<br>・🎤集客力順 — 集客力の高い選手をメインに')}
    <button class="btn btn-sm" style="background:rgba(255,140,0,0.18);border:1px solid rgba(255,140,0,0.5);color:#ff8c00" onclick="_spActivePicker=null;autoFillCardByAppeal();renderShowPrep()" title="因縁・鮮度・話題性を考慮した最適カード">🔥 おすすめ</button>
    <button class="btn btn-sm" style="background:rgba(52,152,219,0.15);border:1px solid rgba(52,152,219,0.4);color:#3498db" onclick="_spActivePicker=null;autoFillCard();renderShowPrep()" title="OVR上位同士をマッチング">💪 OVR順</button>
    <button class="btn btn-sm" style="background:rgba(155,89,182,0.15);border:1px solid rgba(155,89,182,0.4);color:#9b59b6" onclick="_spActivePicker=null;autoFillCardByDraw();renderShowPrep()" title="個人集客力が高い選手をメインに">🎤 集客力順</button>
    <button class="btn btn-sm" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c" onclick="_spActivePicker=null;App.clearShowCard()">🗑 全クリア</button>
    <span class="sp-venue-info">${v.name}（${v.cap.toLocaleString()}席）</span>
  </div>`;

  // マッチスロット v7
  const _spFighterInfo = (f, side, slotIdx, drawData) => {
    if (!f) {
      return `<div class="sp-fighter-info ${side}"><div class="sp-fighter-name empty" onclick="_spOpenPicker(${slotIdx},'${side}')">— 選手選択 —</div></div>`;
    }
    const isChamp = G.titles?.world?.championId === f.id;
    const condOk = (f.condition || 100) >= 60;
    let drawHtml = '';
    if (drawData) {
      const dets = [...(drawData.traits || []), ...(drawData.details || [])]
        .map(d => `<span class="sp-draw-detail">${d.label}+${d.value}</span>`).join(' ');
      drawHtml = `<div class="sp-draw-block"><span class="sp-draw-head">集客力</span> <span class="sp-draw-val" style="${_scale6Style(_popColor(drawData.total))}">${drawData.total}</span>${dets ? `<div class="sp-draw-sub">${dets}</div>` : ''}</div>`;
    }
    return `<div class="sp-fighter-info ${side}">
      ${isChamp ? '<div class="sp-champ">👑 王者</div>' : ''}
      <div class="sp-fighter-name" onclick="_spOpenPicker(${slotIdx},'${side}')">${f.name}</div>
      <div class="sp-ovr-row"><span class="sp-ovr-label">OVR</span><span class="sp-ovr-val">${ov(f)}</span><span class="sp-fighter-cond" style="margin-left:6px">体調 <span style="${_scale6Style(_condColor(Math.round(f.condition || 100)))}">${Math.round(f.condition || 100)}</span></span></div>
      ${drawHtml}
    </div>`;
  };
  const _spPortrait = (f, size) => {
    if (f) return portraitImg(f.id, size);
    return `<div class="sp-portrait-placeholder" style="width:${size}px;height:${size}px;border-radius:4px;border:1px dashed rgba(200,190,170,.08);flex-shrink:0"></div>`;
  };

  for (let i = 0; i < G.showCard.length; i++) {
    const slot = G.showCard[i];

    // ── タッグマッチカード描画 ──
    if (slot.matchType === 'tag') {
      const tA1 = slot.teamA.fighter1 > 0 ? getShowCardFighter(slot.teamA.fighter1) : null;
      const tA2 = slot.teamA.fighter2 > 0 ? getShowCardFighter(slot.teamA.fighter2) : null;
      const tB1 = slot.teamB.fighter1 > 0 ? getShowCardFighter(slot.teamB.fighter1) : null;
      const tB2 = slot.teamB.fighter2 > 0 ? getShowCardFighter(slot.teamB.fighter2) : null;
      const tagFilled = tA1 && tA2 && tB1 && tB2;
      // ケミストリー情報
      const bondA = (tA1 && tA2 && G.relationships) ? ((G.relationships[`${Math.min(tA1.id,tA2.id)}>${Math.max(tA1.id,tA2.id)}`] || {}).bond || 50) : 50;
      const bondB = (tB1 && tB2 && G.relationships) ? ((G.relationships[`${Math.min(tB1.id,tB2.id)}>${Math.max(tB1.id,tB2.id)}`] || {}).bond || 50) : 50;
      const tagExpA = (tA1 && tA2) ? Engine.tagExp.getCount(G, tA1.id, tA2.id) : 0;
      const tagExpB = (tB1 && tB2) ? Engine.tagExp.getCount(G, tB1.id, tB2.id) : 0;
      const _tagFighterHtml = (f, team, pos, side) => {
        if (!f) return `<div class="sp-tag-fighter ${side}" onclick="_spOpenTagPicker(${i},'${team}','${pos}')"><div style="width:72px;height:72px;border-radius:6px;border:1px dashed rgba(200,190,170,.15);flex-shrink:0"></div><div class="sp-tag-fighter-info"><div class="sp-tag-fighter-name empty">— 選択 —</div></div></div>`;
        const cond = Math.round(f.condition || 100);
        const drawPow = Math.round(Engine.attendanceV2.calcDrawPower(f, G));
        const isChamp = G.titles?.world?.championId === f.id;
        return `<div class="sp-tag-fighter ${side}" onclick="_spOpenTagPicker(${i},'${team}','${pos}')">
          ${portraitImg(f.id, 72)}
          <div class="sp-tag-fighter-info">
            ${isChamp ? '<div style="font-size:9px;color:var(--gold)">👑 王者</div>' : ''}
            <div class="sp-tag-fighter-name">${f.name}</div>
            <div class="sp-tag-fighter-ovr">OVR <span style="font-size:20px;color:var(--text-main);font-weight:700">${ov(f)}</span></div>
            <div style="font-size:10px;color:var(--text-dim)">体調 <span style="${_scale6Style(_condColor(cond))}">${cond}</span></div>
            <div style="font-size:10px;color:var(--text-dim)">集客力 <span style="${_scale6Style(_popColor(drawPow))}">${drawPow}</span></div>
          </div>
        </div>`;
      };
      const _bondColor = b => b >= 70 ? 'var(--green)' : b >= 40 ? 'var(--text-sub)' : 'var(--red)';
      const moveUpBtn = i > 0 ? `<button class="sp-move-btn" onclick="moveShowCard(${i},-1)" title="上へ">▲</button>` : `<span class="sp-move-btn sp-move-btn-disabled"></span>`;
      const moveDnBtn = i < G.showCard.length - 1 ? `<button class="sp-move-btn" onclick="moveShowCard(${i},1)" title="下へ">▼</button>` : `<span class="sp-move-btn sp-move-btn-disabled"></span>`;
      // ピッカー
      const isTagPickerOpen = _spActivePicker && _spActivePicker.slotIdx === i && _spActivePicker.tagTeam;
      let tagPickerInner = '';
      if (isTagPickerOpen) {
        const { tagTeam, tagPos } = _spActivePicker;
        const usedInOther = getUsedFighterIds(i);
        // 同じタッグ枠内の他3ポジションも除外
        const sameSlotIds = new Set();
        for (const t of ['teamA', 'teamB']) {
          for (const p of ['fighter1', 'fighter2']) {
            if (t === tagTeam && p === tagPos) continue;
            if (slot[t][p] > 0) sameSlotIds.add(slot[t][p]);
          }
        }
        const curInPos = slot[tagTeam][tagPos];
        const reservedCRIds = getChallengeUnavailableIds();
        const pickerFighters = G.roster
          .filter(c => !c.injury && !c.forcedRest && c.id !== curInPos && !sameSlotIds.has(c.id) && !reservedCRIds.has(c.id))
          .sort((a, b) => ov(b) - ov(a));
        const rows = pickerFighters.map(c => {
          const isAssigned = usedInOther.has(c.id);
          const cls = isAssigned ? 'sp-picker-row assigned' : 'sp-picker-row';
          return `<div class="${cls}" onclick="App.setTagSlotFighter(${i},'${tagTeam}','${tagPos}',${c.id});_spActivePicker=null">${portraitImg(c.id, 24)}<span style="font-weight:700;font-size:12px;flex:1;min-width:0;padding-left:4px">${c.name}</span><span style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:rgba(200,190,170,0.4);flex-shrink:0;margin-left:4px">${ov(c)}</span></div>`;
        }).join('');
        const removeRow = curInPos > 0 ? `<div class="sp-picker-row" onclick="App.setTagSlotFighter(${i},'${tagTeam}','${tagPos}',0);_spActivePicker=null" style="justify-content:center;color:#e74c3c;font-weight:700;font-size:12px;border:1px dashed rgba(231,76,60,.25);margin-bottom:4px">✕ この選手を外す</div>` : '';
        const teamLabel = tagTeam === 'teamA' ? 'チームA' : 'チームB';
        const posLabel = tagPos === 'fighter1' ? '1人目' : '2人目';
        tagPickerInner = `<div class="sp-picker-header"><span class="sp-picker-title">${teamLabel} ${posLabel}を選択</span><span class="sp-picker-close" onclick="_spClosePicker()">閉じる</span></div><div class="sp-picker-list">${removeRow}${rows}</div>`;
      }
      // 試合番号
      let tagMatchNum = 0;
      if (tagFilled) {
        tagMatchNum = 1;
        for (let j = i + 1; j < G.showCard.length; j++) {
          const sj = G.showCard[j];
          if (sj.matchType === 'tag') { if (sj.teamA?.fighter1 > 0 && sj.teamA?.fighter2 > 0 && sj.teamB?.fighter1 > 0 && sj.teamB?.fighter2 > 0) tagMatchNum++; }
          else if (sj.left > 0 && sj.right > 0) tagMatchNum++;
        }
      }
      const tagMatchLabel = tagFilled ? `第${tagMatchNum}試合` : '';
      html += `<div class="sp-match-card tag-match" id="sp-slot-${i}">
        <div class="sp-match-card-inner">
          <div class="sp-move-btns">${moveUpBtn}${moveDnBtn}</div>
          <div class="sp-tag-team left">
            ${_tagFighterHtml(tA1, 'teamA', 'fighter1', 'left')}
            ${_tagFighterHtml(tA2, 'teamA', 'fighter2', 'left')}
            ${tA1 && tA2 ? `<div class="sp-tag-chem">🤝 友好 <span class="sp-tag-chem-val" style="color:${_bondColor(bondA)}">${Math.round(bondA)}</span>${tagExpA > 0 ? ` ・タッグ経験${tagExpA}` : ''}</div>` : ''}
          </div>
          <div class="sp-match-center">
            ${tagMatchLabel ? `<div class="sp-match-num">${tagMatchLabel}</div>` : ''}
            ${(() => {
              if (!tagFilled) return '';
              const ids = [tA1, tA2, tB1, tB2];
              const tagAppeal = Math.round(ids.reduce((sum, f) => sum + Engine.attendanceV2.calcDrawPower(f, G), 0) / 2);
              return `<div class="sp-appeal-label">カード魅力</div><div class="sp-appeal-score" style="${_scale6Style(_mqColor(tagAppeal))}">${tagAppeal}</div>`;
            })()}
            <div class="sp-tag-badge">TAG MATCH</div>
            <div class="sp-match-vs" style="font-size:20px;margin:8px 0">VS</div>
            <div style="font-size:10px;color:var(--text-dim)">20分1本勝負</div>
            <div class="sp-tag-remove-btn" onclick="App.removeTagSlot(${i})">シングルに戻す</div>
          </div>
          <div class="sp-tag-team right">
            ${_tagFighterHtml(tB1, 'teamB', 'fighter1', 'right')}
            ${_tagFighterHtml(tB2, 'teamB', 'fighter2', 'right')}
            ${tB1 && tB2 ? `<div class="sp-tag-chem">🤝 友好 <span class="sp-tag-chem-val" style="color:${_bondColor(bondB)}">${Math.round(bondB)}</span>${tagExpB > 0 ? ` ・タッグ経験${tagExpB}` : ''}</div>` : ''}
          </div>
          <div class="sp-move-btns">${moveUpBtn}${moveDnBtn}</div>
        </div>
        <div class="sp-picker" id="sp-picker-${i}">${tagPickerInner}</div>
      </div>`;
      continue;
    }

    // ── シングルマッチカード描画 ──
    const curL = slot.left;
    const curR = slot.right;
    const fl = curL > 0 ? getShowCardFighter(curL) : null;
    const fr = curR > 0 ? getShowCardFighter(curR) : null;
    const isFilled = !!fl && !!fr;
    const isEmpty = !fl && !fr;

    // ティア判定
    let tier;
    if (isEmpty) { tier = 'empty-slot'; }
    else if (i === 0) { tier = 'main-event'; }
    else if (G.showCard.length >= 3 && i >= G.showCard.length - 2) { tier = 'undercard'; }
    else { tier = 'mid-card'; }

    const ps = tier === 'main-event' ? 100 : 72;

    // 試合番号（成立試合のみカウント）
    let matchNum = 0;
    if (isFilled) {
      matchNum = 1;
      for (let j = i + 1; j < G.showCard.length; j++) {
        const sj = G.showCard[j];
        if (sj.matchType === 'tag') { if (sj.teamA?.fighter1 > 0 && sj.teamA?.fighter2 > 0 && sj.teamB?.fighter1 > 0 && sj.teamB?.fighter2 > 0) matchNum++; }
        else if (sj.left > 0 && sj.right > 0) matchNum++;
      }
    }
    const matchLabel = (i === 0 && isFilled) ? 'MAIN EVENT' : isFilled ? `第${matchNum}試合` : '';
    const matchRule = isFilled ? (i === 0 ? '30分1本勝負' : (G.showCard.length >= 3 && i >= G.showCard.length - 2) ? '15分1本勝負' : '20分1本勝負') : '';

    // タグ計算
    const champId = G.titles.world.championId;
    const hasChamp = champId && (curL === champId || curR === champId);
    const isVacant = !champId;
    const cdCheck = Engine.title.canTitleMatch(G);
    const titleEligible = G.titleEstablished && (hasChamp || (isVacant && curL > 0 && curR > 0));
    const slotHasRental = [curL, curR].some(id => id > 0 && G.roster.find(c => c.id === id)?.isRental);
    const canTitle = !slot._crMatchLocked && titleEligible && cdCheck.allowed && !slotHasRental;
    const isTitle = G.showCard[i].isTitle || false;
    const titleLabel = isVacant ? '初代王者決定戦' : 'タイトル戦';
    const rivalLvl = (curL > 0 && curR > 0) ? getRivalryLevel(curL, curR) : null;
    const freshnessPreview = (curL > 0 && curR > 0)
      ? Engine.freshness.calc(G.matchupLog || [], curL, curR, G.totalShows || 0, G.roster.length, null)
      : null;
    const isLastRunMatch = (curL > 0 && getShowCardFighter(curL)?.lastRun) ||
                           (curR > 0 && getShowCardFighter(curR)?.lastRun);
    const isFanExpect = fanExpects && fanExpects.some(fe =>
      (fe.leftId === curL && fe.rightId === curR) || (fe.leftId === curR && fe.rightId === curL));

    const isFactionFeud = (curL > 0 && curR > 0 && G.factions && G.factions.length > 0 && Engine.factions)
      ? Engine.factions.isFactionFeudMatch(G, curL, curR) : false;

    const tagParts = [];
    if (canTitle) {
      tagParts.push(`<label class="sp-match-tag sp-tag-title"><input type="checkbox" ${isTitle ? 'checked' : ''} onchange="toggleTitle(${i});renderShowPrep()" style="margin-right:3px;vertical-align:middle"> 🏆${titleLabel}</label>`);
    }
    if (titleEligible && !cdCheck.allowed) tagParts.push(`<span class="sp-match-tag sp-tag-dim">⏳${cdCheck.weeksLeft}週後</span>`);
    if (titleEligible && cdCheck.allowed && slotHasRental) tagParts.push(`<span class="sp-match-tag sp-tag-dim">🤝レンタル不可</span>`);
    if (!G.titleEstablished && curL > 0 && curR > 0) tagParts.push(`<span class="sp-match-tag sp-tag-dim">🔒王座未設立</span>`);
    if (isFactionFeud) {
      const fA = Engine.factions.getFactionByFighterId(G, curL);
      const fB = Engine.factions.getFactionByFighterId(G, curR);
      const label = (fA && fB) ? `${fA.name} vs ${fB.name}` : '派閥抗争';
      tagParts.push(`<span class="sp-match-tag sp-tag-faction" style="cursor:help" ${_tipAttr('派閥の顔役同士の試合：集客ブースト')}>🏴vs🏴 ${label}</span>`);
    }
    if (slot._f08Locked) {
      tagParts.push(`<span class="sp-match-tag sp-tag-faction" ${_tipAttr('派閥対立のヒートアップによる直接対決：この試合は固定枠です')} style="background:rgba(255,90,40,0.22);border-color:rgba(255,90,40,0.55);color:#ffd2b0;cursor:help">🔥 直接対決（固定）</span>`);
    }
    if (slot._internalChallengeLocked) {
      tagParts.push(`<span class="sp-match-tag sp-tag-faction" ${_tipAttr('派閥内序列戦：挑戦者がリーダーの座を狙う、固定枠です')} style="background:rgba(120,60,180,0.28);border-color:rgba(170,120,220,0.55);color:#e6c8ff;cursor:help">⚔ 派閥内序列戦（固定）</span>`);
    }
    if (slot._crMatchLocked) {
      tagParts.push(`<span class="sp-match-tag sp-tag-faction" ${_tipAttr('他団体との3試合挑戦シリーズ：会場枠内の上位3試合として固定され、カード魅力に専用ボーナスが入ります')} style="background:rgba(170,55,55,0.28);border-color:rgba(235,105,90,0.6);color:#ffd0c8;cursor:help">⚔ 他団体挑戦（固定）</span>`);
    }
    if (rivalLvl) tagParts.push(`<span class="sp-match-tag sp-tag-rivalry">${rivalLvl.emoji}${rivalLvl.label} MQ+${rivalLvl.mqBonus}</span>`);
    if (freshnessPreview && freshnessPreview.label) {
      const isFresh = freshnessPreview.bonus > 0;
      // MQ再設計P3c(§1.3/G): 鮮度は集客(appeal)側の係数に移管済み。MQ表記はやめて動員への効きを示す。
      const freshMult = Engine.freshness.attendanceMult(freshnessPreview.bonus);
      tagParts.push(`<span class="sp-match-tag ${isFresh ? 'sp-tag-fresh' : 'sp-tag-stale'}">${isFresh ? '✨' : '😐'}${freshnessPreview.label} 動員×${freshMult.toFixed(2)}</span>`);
    }
    if (isFanExpect) tagParts.push(`<span class="sp-match-tag sp-tag-fanexpect">📣ファン期待</span>`);
    if (isLastRunMatch) tagParts.push(`<span class="sp-match-tag sp-tag-lastrun">🌅ラストマッチ</span>`);
    // タイトル格差ペナルティ表示は MQ外部ボーナス整理で廃止

    // 集客力内訳
    let slotBD = null;
    if (isFilled && Engine.attendanceV2?.calcMatchAppealBreakdown) {
      const rivalryAB = G.relationships ? (G.relationships[`${curL}>${curR}`]?.rivalry || 0) : 0;
      const rivalryBA = G.relationships ? (G.relationships[`${curR}>${curL}`]?.rivalry || 0) : 0;
      const slotRivalryLevel = Engine.title.getRivalryLevel(G, curL, curR);
      const slotPendingClash = slotRivalryLevel?.pendingClashBonus || 0;
      const slotFr = Engine.freshness.calc(G.matchupLog || [], curL, curR, G.totalShows, G.roster.length, null);
      const ctx = { rivalry: Math.max(rivalryAB, rivalryBA), isTitle: !!G.showCard[i].isTitle, isFanExpect,
        isChallengeRequest: !!(slot._crMatchLocked || slot.isCRMatch),
        pendingClashBonus: slotPendingClash, isFirstMeet: slotFr.isFirstMeet, freshnessCount: slotFr.countInWindow,
        freshnessRawBonus: slotFr.bonus };
      try { slotBD = Engine.attendanceV2.calcMatchAppealBreakdown(fl, fr, ctx, G); } catch(e) {}
    }

    // ピッカーコンテンツ
    const isPickerOpen = _spActivePicker && _spActivePicker.slotIdx === i;
    const pickerSide = isPickerOpen ? _spActivePicker.side : null;
    let pickerInner = '';
    if (isPickerOpen) {
      const otherSideCur = G.showCard[i][pickerSide === 'left' ? 'right' : 'left'];
      const usedInOther = getUsedFighterIds(i);
      const curInSide = G.showCard[i][pickerSide];
      const reservedCRIds = getChallengeUnavailableIds();
      const pickerFighters = G.roster
        .filter(c => !c.injury && !c.forcedRest && c.id !== curInSide && c.id !== otherSideCur && !reservedCRIds.has(c.id))
        .sort((a, b) => ov(b) - ov(a));
      const rows = pickerFighters.map(c => {
        const isAssigned = usedInOther.has(c.id);
        const cls = isAssigned ? 'sp-picker-row assigned' : 'sp-picker-row';
        const champBadge = G.titles?.world?.championId === c.id ? ' <span style="color:var(--gold);font-size:9px">👑</span>' : '';
        const hoverEvts = isAssigned
          ? ` onmouseenter="_spHighlightSwap(${c.id})" onmouseleave="_spClearHighlight()"` : '';
        return `<div class="${cls}" onclick="_spSelectFighter(${i},'${pickerSide}',${c.id})"${hoverEvts}>${portraitImg(c.id, 24)}<span style="font-weight:700;font-size:12px;flex:1;min-width:0;padding-left:4px">${c.name}</span>${champBadge}<span style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:rgba(200,190,170,0.4);flex-shrink:0;margin-left:4px">${ov(c)}</span></div>`;
      }).join('');
      const removeRow = curInSide > 0 ? `<div class="sp-picker-row" onclick="_spSelectFighter(${i},'${pickerSide}',0)" style="justify-content:center;color:#e74c3c;font-weight:700;font-size:12px;border:1px dashed rgba(231,76,60,.25);margin-bottom:4px">✕ この選手を外す</div>` : '';
      pickerInner = `<div class="sp-picker-header"><span class="sp-picker-title">${pickerSide === 'left' ? '赤コーナー' : '青コーナー'}選手を選択</span><span class="sp-picker-close" onclick="_spClosePicker()">閉じる</span></div><div class="sp-picker-list">${removeRow}${rows}</div>`;
    }

    // カード魅力の内訳ボーナス
    const appealParts = [];
    if (slotBD) {
      if (slotBD.parityBonus !== 0) appealParts.push(`🤝拮抗${slotBD.parityBonus > 0 ? '+' : ''}${slotBD.parityBonus}`);
      if (slotBD.rivalryAppeal > 0) appealParts.push(`⚡因縁+${slotBD.rivalryAppeal}`);
      if (slotBD.titleBonus > 0) appealParts.push(`🏆タイトル+${slotBD.titleBonus}`);
      if (slotBD.fanExpectBonus > 0) appealParts.push(`📣期待+${slotBD.fanExpectBonus}`);
      if (slotBD.challengeRequestBonus > 0) appealParts.push(`⚔他団体挑戦+${slotBD.challengeRequestBonus}`);
      if (slotBD.heelFaceBonus > 0) appealParts.push(`😈善悪+${slotBD.heelFaceBonus}`);
    }

    const cardBorder = slot._crMatchLocked
      ? ' style="border-color:rgba(235,105,90,0.5)"'
      : isLastRunMatch ? ' style="border-color:rgba(212,168,67,0.4)"' : '';
    const moveUpBtn = !slot._crMatchLocked && i > 0 ? `<button class="sp-move-btn" onclick="moveShowCard(${i},-1)" title="上へ">▲</button>` : `<span class="sp-move-btn sp-move-btn-disabled"></span>`;
    const moveDnBtn = !slot._crMatchLocked && i < G.showCard.length - 1 ? `<button class="sp-move-btn" onclick="moveShowCard(${i},1)" title="下へ">▼</button>` : `<span class="sp-move-btn sp-move-btn-disabled"></span>`;
    html += `<div class="sp-match-card ${tier}" id="sp-slot-${i}"${cardBorder}>
      <div class="sp-match-card-inner">
        <div class="sp-move-btns">${moveUpBtn}${moveDnBtn}</div>
        ${_spFighterInfo(fl, 'left', i, slotBD?.drawA)}
        ${_spPortrait(fl, ps)}
        <div class="sp-match-center">
          ${matchLabel ? `<div class="sp-match-num">${matchLabel}</div>` : ''}
          ${slotBD ? `<div class="sp-appeal-label" style="cursor:help" ${_tipAttr('この一戦がどれだけ客を呼べるか。両選手の人気と実力に、拮抗・因縁・タイトル戦などの注目度が上乗せされます。')}>カード魅力</div><div class="sp-appeal-score" style="${_scale6Style(_mqColor(slotBD.total))}">${slotBD.total}</div>` : ''}
          ${appealParts.length > 0 ? `<div class="sp-appeal-bonuses">${appealParts.join('  ')}</div>` : ''}
          <div class="sp-match-vs">VS</div>
          ${matchRule ? `<div class="sp-match-rule">${matchRule}</div>` : ''}
          ${tagParts.length > 0 ? `<div class="sp-match-tags">${tagParts.join('')}</div>` : ''}
          ${(!slot._crMatchLocked && i > 0 && i + 1 < G.showCard.length && !G.showCard[i + 1]?._crMatchLocked && G.showCard[i + 1]?.matchType !== 'tag') ? `<div class="sp-tag-merge-btn" onclick="App.mergeToTagSlot(${i})" title="下の枠と合体してタッグマッチに">🤝 タッグに変換</div>` : ''}
        </div>
        ${_spPortrait(fr, ps)}
        ${_spFighterInfo(fr, 'right', i, slotBD?.drawB)}
        <div class="sp-move-btns">${moveUpBtn}${moveDnBtn}</div>
      </div>
      <div class="sp-picker" id="sp-picker-${i}">${pickerInner}</div>
    </div>`;
  }

  // 開催ボタン v7
  html += `<div class="sp-action-row">
    <button class="btn btn-gold" onclick="executeShow()" ${validMatches.length === 0 ? 'disabled' : ''}>興行開催！（${validMatches.length}試合）</button>
    <button class="btn btn-blue" onclick="G={...G,weekPhase:'manage'};showScreen('week');refreshAll()">← 戻る</button>
  </div>`;

  el.innerHTML = html;
  _spAfterRender();
}

// 財務タブリデザイン: ラベル正規化ヘルパー
function _normalizeFinanceLabel(label) {
  if (label.startsWith('チケット収入')) return 'チケット収入';
  if (label.startsWith('グッズ収入')) return 'グッズ収入';
  if (label.startsWith('メディア収入')) return 'メディア収入';
  if (label.startsWith('プロモ収入')) return 'プロモ収入';
  if (label.startsWith('会場費')) return label; // 会場ごとに分けて表示
  return label.replace(/（.*?）/g, '').replace(/\d+人/g, '').trim();
}

// 財務タブリデザイン: 期間フィルタ
function _getFilteredFinance(period) {
  const history = G.financeHistory || [];
  switch (period) {
    case 'month': {
      const startWeek = Math.max(1, G.week - 3);
      return history.filter(h => h.season === G.season && h.week >= startWeek && h.week <= G.week);
    }
    case 'year':
      return history.filter(h => h.season === G.season);
    case 'all':
    default:
      return history;
  }
}

/**
 * 収支チャートSVG生成
 * @param {Array<number>} values - 週ごとの値の配列
 * @param {Object} options - { color, negColor, label, showZeroLine, height, width }
 * @returns {string} SVG HTML文字列 or 空文字（データ不足時）
 */
function _financeChart(values, options = {}) {
  if (!values || values.length < 2) return '';
  const { color = '#2ecc71', negColor = null, label = '', showZeroLine = false, height = 120, width = 380 } = options;
  const leftPad = 55;
  const plotW = width - leftPad;
  const vMin = Math.min(...values, showZeroLine ? 0 : Infinity);
  const vMax = Math.max(...values, showZeroLine ? 0 : -Infinity);
  const range = vMax - vMin || 1;
  const rawStep = range / 4;
  const niceSteps = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  const step = niceSteps.find(s => s >= rawStep) || Math.ceil(rawStep / 1000) * 1000;
  const gridLines = [];
  for (let v = Math.ceil(vMin / step) * step; v <= vMax; v += step) gridLines.push(v);
  if (showZeroLine && vMin <= 0 && vMax >= 0 && !gridLines.includes(0)) gridLines.push(0);
  gridLines.sort((a, b) => a - b);
  const toY = v => height - Math.round(((v - vMin) / range) * height);
  const points = values.map((v, i) => `${leftPad + Math.round(i * plotW / Math.max(values.length - 1, 1))},${toY(v)}`).join(' ');
  const lastVal = values[values.length - 1];
  const lineColor = negColor && lastVal < 0 ? negColor : color;
  let svg = `<svg width="${width}" height="${height + 16}" style="display:block;overflow:visible">`;
  gridLines.forEach(val => {
    const y = toY(val);
    const isZero = val === 0;
    svg += `<line x1="${leftPad}" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(200,190,170,${isZero?0.2:0.06})" stroke-width="${isZero?1:0.5}"${isZero?' stroke-dasharray="4"':''}/>`;
    svg += `<text x="${leftPad-6}" y="${y+3}" text-anchor="end" fill="rgba(200,190,170,${isZero?0.4:0.2})" font-size="10">${val.toLocaleString()}</text>`;
  });
  svg += `<polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="2"/>`;
  const lastX = leftPad + plotW, lastY = toY(lastVal);
  svg += `<circle cx="${lastX}" cy="${lastY}" r="3" fill="${lineColor}"/>`;
  svg += `<text x="${lastX}" y="${lastY-8}" text-anchor="end" fill="${lineColor}" font-size="11" font-weight="700">${Math.round(lastVal).toLocaleString()}万</text>`;
  svg += '</svg>';
  return `<div style="margin-bottom:16px;padding:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">${label ? `<div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">${label}</div>` : ''}${svg}</div>`;
}

/**
 * orgPop推移グラフSVG生成（orgPop リバランス v1.1 §6）
 * @param {Array<{season:number, pop:number}>} points - シーズン別orgPop
 * @returns {string} SVG HTML文字列
 */
function _orgPopChart(points) {
  if (!points || points.length < 2) return '<div style="font-size:12px;color:var(--text-dim);padding:8px 0">まだデータが不足しています（2シーズン以上経過後に表示）</div>';
  const height = 140, width = 350, leftPad = 42, bottomPad = 20;
  const plotW = width - leftPad;
  const plotH = height - bottomPad;
  // Y軸: 0-100固定（ただし表示は10ずつのグリッド）
  const gridVals = [0, 20, 40, 60, 80, 100];
  const toY = v => Math.round(plotH - (v / 100) * plotH);
  // 色: orgPop帯別グラデーション風（現在値で決定）
  const lastPop = points[points.length - 1].pop;
  const lineColor = lastPop >= 90 ? '#f1c40f' : lastPop >= 75 ? '#2ecc71' : lastPop >= 55 ? '#3498db' : '#aaa';
  // 折れ線点列
  const pts = points.map((p, i) => {
    const x = leftPad + Math.round(i * plotW / Math.max(points.length - 1, 1));
    const y = toY(p.pop);
    return { x, y, season: p.season, pop: p.pop };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  // ドーム閾値ライン (90)
  const domeY = toY(90);
  let svg = `<svg width="${width}" height="${height + 4}" style="display:block;overflow:visible">`;
  // グリッド
  gridVals.forEach(v => {
    const y = toY(v);
    const isTarget = v === 90;
    svg += `<line x1="${leftPad}" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(200,190,170,${isTarget ? 0.35 : 0.07})" stroke-width="${isTarget ? 1 : 0.5}"${isTarget ? ' stroke-dasharray="5,3"' : ''}/>`;
    svg += `<text x="${leftPad - 5}" y="${y + 3}" text-anchor="end" fill="rgba(200,190,170,${isTarget ? 0.6 : 0.25})" font-size="10">${v}</text>`;
  });
  // ドーム閾値ラベル
  svg += `<text x="${leftPad + 4}" y="${domeY - 4}" fill="rgba(241,196,15,0.55)" font-size="9">ドーム圏</text>`;
  // 折れ線
  svg += `<polyline points="${polyline}" fill="none" stroke="${lineColor}" stroke-width="2.5"/>`;
  // データ点（ホバーtitleつき）+ 5シーズンおきにシーズン番号
  pts.forEach((p, i) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${lineColor}" stroke="var(--bg-main)" stroke-width="1.5"><title>${p.season}年目: ${Math.round(p.pop * 10) / 10}</title></circle>`;
    // シーズン番号ラベル（5の倍数 or 最初と最後）
    if (p.season % 5 === 0 || i === 0 || i === pts.length - 1) {
      svg += `<text x="${p.x}" y="${height - 2}" text-anchor="middle" fill="rgba(200,190,170,0.35)" font-size="9">${p.season}年</text>`;
    }
  });
  // 最新値ラベル
  const last = pts[pts.length - 1];
  svg += `<text x="${last.x + 5}" y="${last.y - 6}" fill="${lineColor}" font-size="11" font-weight="700">${Math.round(lastPop * 10) / 10}</text>`;
  svg += '</svg>';
  return `<div style="padding:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;margin-bottom:14px">${svg}</div>`;
}

/** filteredFinanceHistory から週ごとに値を集計する */
function _weeklyFinanceValues(filtered, extractFn) {
  return filtered.map(h => {
    const details = h.details || [];
    return details.filter(extractFn).reduce((sum, d) => sum + d.val, 0);
  });
}

/**
 * 週次データを月平均（4週ごと）に集約する
 * 今月タブ以外で使用。週ごとの大幅な浮き沈みを平滑化する
 */
function _monthlyAverageValues(weeklyValues) {
  if (weeklyValues.length <= 4) return weeklyValues;
  const months = [];
  for (let i = 0; i < weeklyValues.length; i += 4) {
    const chunk = weeklyValues.slice(i, i + 4);
    months.push(chunk.reduce((s, v) => s + v, 0) / chunk.length);
  }
  return months;
}

/**
 * ランニングトータル（資金残高等）を月末スナップショット（4週ごとの末尾値）に集約する
 */
function _monthlySnapshotValues(weeklyValues) {
  if (weeklyValues.length <= 4) return weeklyValues;
  const months = [];
  for (let i = 3; i < weeklyValues.length; i += 4) {
    months.push(weeklyValues[i]);
  }
  // 端数（最後の月が4週未満の場合、最終値を含める）
  if (weeklyValues.length % 4 !== 0) {
    months.push(weeklyValues[weeklyValues.length - 1]);
  }
  return months;
}

function renderFinance() {
  const el = document.getElementById('financeContent');
  const period = el.dataset.financePeriod || 'month';
  const tab = el.dataset.financeTab || 'summary';
  const filtered = _getFilteredFinance(period);

  // ── 期間フィルタバー ──
  const periodDefs = [{ k:'month', l:'今月' }, { k:'year', l:'年間' }, { k:'all', l:'全期間' }];
  let html = `<div style="display:flex;gap:6px;margin-bottom:10px">`;
  periodDefs.forEach(p => {
    const a = period === p.k;
    html += `<button onclick="document.getElementById('financeContent').dataset.financePeriod='${p.k}';renderFinance()" style="flex:1;padding:6px 4px;border:1px solid ${a?'var(--gold)':'var(--border)'};background:${a?'rgba(255,200,60,0.1)':'var(--bg-card)'};border-radius:5px;cursor:pointer;font-size:12px;color:${a?'var(--gold)':'var(--text-dim)'};font-weight:${a?700:400}">${p.l}</button>`;
  });
  html += `</div>`;

  // ── サブタブバー ──
  const tabDefs = [{ k:'summary', l:'📊 総合' }, { k:'income', l:'📈 収入' }, { k:'expense', l:'📉 支出' }, { k:'salary', l:'💰 給与' }, { k:'orgpop', l:'📣 団体人気' }];
  html += `<div style="display:flex;gap:4px;margin-bottom:14px">`;
  tabDefs.forEach(t => {
    const a = tab === t.k;
    html += `<button onclick="document.getElementById('financeContent').dataset.financeTab='${t.k}';renderFinance()" style="flex:1;padding:7px 2px;border:1px solid ${a?'var(--gold)':'var(--border)'};background:${a?'rgba(255,200,60,0.1)':'var(--bg-card)'};border-radius:5px;cursor:pointer;font-size:11px;color:${a?'var(--gold)':'var(--text-dim)'};font-weight:${a?700:400}">${t.l}</button>`;
  });
  html += `</div>`;

  // ── 総合タブ ──
  if (tab === 'summary') {
    html += `<div style="font-size:24px;font-weight:900;margin-bottom:12px;color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${Math.round(G.funds).toLocaleString()}万</div>`;

    // 資金推移チャート — 期間フィルタに追従する
    // fundsHistory は今シーズンの週次スナップショット（シーズン開幕でリセット）のため、
    // 今月=直近4週 / 年間=今シーズンの月末値 / 全期間=seasonHistory のシーズン末資金 で描き分ける
    const fhRaw = G.fundsHistory || [];
    let fh, fhLabel;
    if (period === 'month') {
      fh = fhRaw.slice(-4);
      fhLabel = `💹 資金推移 (直近${fh.length}週)`;
    } else if (period === 'all' && (G.seasonHistory || []).length >= 1) {
      fh = [...G.seasonHistory.map(h => h.funds || 0), G.funds];
      fhLabel = `💹 資金推移 (シーズン末値・${fh.length}年分)`;
    } else {
      fh = _monthlySnapshotValues(fhRaw);
      fhLabel = `💹 資金推移 (今シーズン ${fh.length}ヶ月)`;
    }
    html += _financeChart(fh, { color: '#2ecc71', negColor: '#e74c3c', label: fhLabel, showZeroLine: true });

    // 期間サマリ
    if (filtered.length > 0) {
      let totalIncome = 0, totalExpense = 0;
      filtered.forEach(h => { totalIncome += h.income || 0; totalExpense += h.expense || 0; });
      const totalNet = totalIncome - totalExpense;
      const periodLabel = period === 'month' ? '今月' : period === 'year' ? '今シーズン' : '全期間';
      html += `<div class="panel-title">期間サマリ — ${periodLabel} <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${filtered.length}週)</span></div>`;
      html += `<div class="finance-row"><span class="f-label">📈 総収入</span><span class="f-val income">+${Math.round(totalIncome).toLocaleString()}万</span></div>`;
      html += `<div class="finance-row"><span class="f-label">📉 総支出</span><span class="f-val expense">-${Math.round(totalExpense).toLocaleString()}万</span></div>`;
      html += `<div class="finance-row finance-total"><span>純利益</span><span class="f-val ${totalNet >= 0 ? 'income' : 'expense'}">${totalNet >= 0 ? '+' : ''}${Math.round(totalNet).toLocaleString()}万</span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">この期間の記録はまだありません</div>`;
      // 推定週間コスト（初回表示用）
      html += '<div class="panel-title" style="margin-top:12px">週間コスト内訳（推定）</div>';
      html += `<div class="finance-row"><span class="f-label">選手給与合計</span><span class="f-val expense">-${calcWeeklySalary()}万/週</span></div>`;
      html += `<div class="finance-row"><span class="f-label">事務運営費</span><span class="f-val expense">-${FIXED_COSTS.admin}万/週</span></div>`;
      const coachTotal = getCoachSalaryTotal();
      if (coachTotal > 0) html += `<div class="finance-row"><span class="f-label">コーチ給与（${G.coaches.length}名）</span><span class="f-val expense">-${coachTotal}万/週</span></div>`;
      html += `<div class="finance-row"><span class="f-label">グッズ収入</span><span class="f-val income">+${Engine.economy.calcWeeklyGoodsRev(G.roster)}万/週</span></div>`;
      html += `<div class="finance-row"><span class="f-label">メディア収入</span><span class="f-val income">+${Engine.economy.calcWeeklyMediaRev(G.orgPop)}万/週</span></div>`;
    }
  }

  // ── 収入タブ（金銭バランス改善: カテゴリ別グルーピング）──
  else if (tab === 'income') {
    const incomeRaw = _weeklyFinanceValues(filtered, d => d.type === 'income');
    const isMonthlyI = period !== 'month';
    const incomeChart = isMonthlyI ? _monthlyAverageValues(incomeRaw) : incomeRaw;
    const incomeChartLabel = isMonthlyI
      ? `📈 月間平均収入推移 (${incomeChart.length}ヶ月)`
      : `📈 週間収入推移 (${filtered.length}週)`;
    html += _financeChart(incomeChart, { color: '#2ecc71', label: incomeChartLabel });

    // カテゴリ別集計
    const catDefs = [
      { key: 'ticket', label: '興行収入', items: {} },
      { key: 'goods',  label: 'グッズ収入', items: {} },
      { key: 'media',  label: 'メディア収入', items: {} },
      { key: 'promo',  label: 'プロモ収入', items: {} },
      { key: 'other',  label: 'その他', items: {} },
    ];
    const catMap = {};
    catDefs.forEach(c => { catMap[c.key] = c; });
    let grandTotal = 0;

    filtered.forEach(h => {
      (h.details || []).filter(d => d.type === 'income').forEach(d => {
        const cat = d.category || 'other';
        const target = catMap[cat] || catMap.other;
        const sub = d.label;
        if (!target.items[sub]) target.items[sub] = { label: sub, val: 0, count: 0 };
        target.items[sub].val += d.val;
        target.items[sub].count++;
        grandTotal += d.val;
      });
    });

    if (grandTotal > 0) {
      // 興行収入セクション
      const ticketCat = catMap.ticket;
      const ticketTotal = Object.values(ticketCat.items).reduce((s, i) => s + i.val, 0);
      if (ticketTotal > 0) {
        html += `<div class="panel-title" style="margin-top:6px">■ 興行収入</div>`;
        Object.values(ticketCat.items).sort((a, b) => b.val - a.val).forEach(d => {
          html += `<div class="finance-row"><span class="f-label">${d.label}</span><span class="f-val income">+${Math.round(d.val).toLocaleString()}万</span></div>`;
        });
        html += `<div style="border-top:1px solid var(--border);margin:4px 0"></div>`;
        html += `<div class="finance-row" style="font-weight:600"><span>小計</span><span class="f-val income">+${Math.round(ticketTotal).toLocaleString()}万</span></div>`;
      }

      // ブランド収入セクション
      const brandCats = ['goods', 'media', 'promo'];
      const brandTotal = brandCats.reduce((s, k) => s + Object.values(catMap[k].items).reduce((ss, i) => ss + i.val, 0), 0);
      const otherTotal = Object.values(catMap.other.items).reduce((s, i) => s + i.val, 0);
      if (brandTotal + otherTotal > 0) {
        html += `<div class="panel-title" style="margin-top:10px">■ ブランド収入</div>`;
        brandCats.forEach(catKey => {
          const cat = catMap[catKey];
          const catTotal = Object.values(cat.items).reduce((s, i) => s + i.val, 0);
          if (catTotal <= 0) return;
          const subs = Object.values(cat.items).sort((a, b) => b.val - a.val);
          const detailId = `_finDetail_${catKey}`;
          // 折りたたみ可能なカテゴリヘッダ
          html += `<div class="finance-row" style="cursor:pointer" onclick="var el=document.getElementById('${detailId}');el.style.display=el.style.display==='none'?'block':'none'">`;
          html += `<span class="f-label" style="font-weight:600">▼ ${cat.label}</span>`;
          html += `<span class="f-val income">+${Math.round(catTotal).toLocaleString()}万</span></div>`;
          html += `<div id="${detailId}" style="display:none;padding-left:16px">`;
          subs.forEach(d => {
            const subLabel = d.label.replace(/^(グッズ収入|メディア収入|プロモ収入)/, '').replace(/^（/, '').replace(/）$/, '') || d.label;
            html += `<div class="finance-row"><span class="f-label" style="font-size:11px;color:var(--text-dim)">└ ${subLabel}</span><span style="font-size:11px" class="f-val income">+${Math.round(d.val).toLocaleString()}万</span></div>`;
          });
          html += `</div>`;
        });
        // その他（助成金等）
        if (otherTotal > 0) {
          Object.values(catMap.other.items).sort((a, b) => b.val - a.val).forEach(d => {
            html += `<div class="finance-row"><span class="f-label">${d.label}</span><span class="f-val income">+${Math.round(d.val).toLocaleString()}万</span></div>`;
          });
        }
        html += `<div style="border-top:1px solid var(--border);margin:4px 0"></div>`;
        html += `<div class="finance-row" style="font-weight:600"><span>小計</span><span class="f-val income">+${Math.round(brandTotal + otherTotal).toLocaleString()}万</span></div>`;
      }

      html += `<div style="border-top:2px solid var(--border);margin:8px 0"></div>`;
      html += `<div class="finance-row finance-total"><span>総収入</span><span class="f-val income">+${Math.round(grandTotal).toLocaleString()}万</span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">この期間の収入記録はありません</div>`;
    }
  }

  // ── 支出タブ ──
  else if (tab === 'expense') {
    const expenseRaw = _weeklyFinanceValues(filtered, d => d.type === 'expense');
    const isMonthlyE = period !== 'month';
    const expenseChart = isMonthlyE ? _monthlyAverageValues(expenseRaw) : expenseRaw;
    const expenseChartLabel = isMonthlyE
      ? `📉 月間平均支出推移 (${expenseChart.length}ヶ月)`
      : `📉 週間支出推移 (${filtered.length}週)`;
    html += _financeChart(expenseChart, { color: '#e74c3c', label: expenseChartLabel });
    const items = {};
    filtered.forEach(h => {
      (h.details || []).filter(d => d.type === 'expense').forEach(d => {
        const key = _normalizeFinanceLabel(d.label);
        if (!items[key]) items[key] = { label: key, val: 0, count: 0 };
        items[key].val += d.val;
        items[key].count++;
      });
    });
    const sorted = Object.values(items).sort((a, b) => a.val - b.val);
    const total = sorted.reduce((s, i) => s + i.val, 0);
    if (sorted.length > 0) {
      sorted.forEach(d => {
        html += `<div class="finance-row"><span class="f-label">${d.label}</span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:10px;color:var(--text-dim)">×${d.count}</span><span class="f-val expense">${Math.round(d.val).toLocaleString()}万</span></span></div>`;
      });
      html += `<div style="border-top:1px solid var(--border);margin:8px 0"></div>`;
      html += `<div class="finance-row finance-total"><span>総支出</span><span class="f-val expense">${Math.round(total).toLocaleString()}万</span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">この期間の支出記録はありません</div>`;
    }
  }

  // ── 給与タブ ──
  else if (tab === 'salary') {
    const salaryRaw = _weeklyFinanceValues(filtered, d => d.type === 'expense' && _normalizeFinanceLabel(d.label) === '選手給与');
    // 給与は負数で記録されているが、上=高給のグラフにするため絶対値化
    const salaryAbs = salaryRaw.map(v => Math.abs(v));
    const isMonthlyS = period !== 'month';
    const salaryChart = isMonthlyS ? _monthlyAverageValues(salaryAbs) : salaryAbs;
    const salaryChartLabel = isMonthlyS
      ? `💰 月間平均給与推移 (${salaryChart.length}ヶ月)`
      : `💰 週間給与推移 (${filtered.length}週)`;
    html += _financeChart(salaryChart, { color: '#e67e22', label: salaryChartLabel });
    // 期間中の給与支払い合計
    let salaryTotal = 0, salaryWeeks = 0;
    filtered.forEach(h => {
      (h.details || []).filter(d => d.type === 'expense' && _normalizeFinanceLabel(d.label) === '選手給与').forEach(d => {
        salaryTotal += d.val;
        salaryWeeks++;
      });
    });
    if (salaryWeeks > 0) {
      const periodLabel = period === 'month' ? '今月' : period === 'year' ? '今シーズン' : '全期間';
      html += `<div class="panel-title">${periodLabel}の給与支払い</div>`;
      html += `<div class="finance-row finance-total"><span>給与支払い合計 <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${salaryWeeks}週)</span></span><span class="f-val expense">${Math.round(salaryTotal).toLocaleString()}万</span></div>`;
      html += `<div style="margin-bottom:14px"></div>`;
    }
    // 選手別給与（現在のスナップショット）
    const ownFightersForSalary = G.roster.filter(c => !c.isRental);
    const rentalFightersForSalary = G.roster.filter(c => c.isRental);
    html += '<div class="panel-title">選手別給与（現在）</div>';
    html += '<table class="data-table"><tr><th>名前</th><th>総合</th><th>給与</th></tr>';
    [...ownFightersForSalary].sort((a, b) => getSalary(b) - getSalary(a)).forEach(c => {
      html += `<tr><td>${fLink(c, {source:'roster', size:'12px'})}</td><td class="num">${ov(c)}</td><td class="num">${getSalary(c)}万</td></tr>`;
    });
    html += '</table>';
    if (rentalFightersForSalary.length > 0) {
      html += `<div style="font-size:11px;color:var(--text-dim);margin-top:6px">🤝 レンタル選手（${rentalFightersForSalary.map(c => c.name).join('、')}）は前払い契約のため給与なし</div>`;
    }
  }

  // ── 団体人気推移タブ（orgPop リバランス v1.1 §6）──
  else if (tab === 'orgpop') {
    // seasonHistory から過去シーズンのorgPopを収集（最大30シーズン）
    const sh = (G.seasonHistory || []).slice(-29);
    const chartPoints = sh.map(h => ({ season: h.season, pop: h.orgPop || h.peakPop || 0 }));
    // 現在シーズンの現在値を末尾に追加
    chartPoints.push({ season: G.season, pop: G.orgPop || 0 });

    html += `<div class="panel-title" style="margin-top:0">団体人気推移</div>`;
    html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">折れ線: 各シーズン末の団体人気 ／ 破線: ドーム圏(90)</div>`;
    html += _orgPopChart(chartPoints);

    // 現在のorgPop状態説明
    const curPop = G.orgPop || 0;
    let popDesc = '', popColor = 'var(--text-dim)';
    if (curPop >= 95) { popDesc = '頂点 — ドーム満員が狙える'; popColor = '#f1c40f'; }
    else if (curPop >= 90) { popDesc = 'ドーム挑戦圏 — 理想のカードで成功も'; popColor = '#2ecc71'; }
    else if (curPop >= 80) { popDesc = 'メジャー — ドームを意識し始めるレベル'; popColor = '#3498db'; }
    else if (curPop >= 65) { popDesc = '中堅上位 — じわじわ登り続けよう'; popColor = '#aaa'; }
    else if (curPop >= 50) { popDesc = '中堅 — 着実に興行を重ねて'; popColor = '#aaa'; }
    else { popDesc = '発展中 — まだまだここから'; popColor = '#aaa'; }
    html += `<div style="padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;margin-bottom:10px">`;
    html += `<div style="font-size:22px;font-weight:900;color:${popColor}">${Math.round(curPop * 10) / 10} <span style="font-size:12px;font-weight:400;color:var(--text-dim)">/ 100</span></div>`;
    html += `<div style="font-size:12px;color:${popColor};margin-top:2px">${popDesc}</div>`;
    html += `</div>`;

    // 直近の変動サマリ
    if (sh.length >= 2) {
      const prev = sh[sh.length - 1];
      const prevPop = prev.orgPop || prev.peakPop || 0;
      const delta = curPop - prevPop;
      const deltaStr = `${delta >= 0 ? '+' : ''}${Math.round(delta * 10) / 10}`;
      const deltaColor = delta >= 0 ? '#2ecc71' : '#e74c3c';
      html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">前シーズン比: <span style="color:${deltaColor};font-weight:700">${deltaStr}</span>（S${prev.season}: ${Math.round(prevPop * 10) / 10} → 現在: ${Math.round(curPop * 10) / 10}）</div>`;
    }

    // ドームまでの距離
    if (curPop < 90) {
      html += `<div style="font-size:12px;color:rgba(241,196,15,0.6);margin-top:6px">ドーム圏まであと <strong style="color:rgba(241,196,15,0.9)">${Math.round((90 - curPop) * 10) / 10}</strong> ポイント</div>`;
    } else {
      html += `<div style="font-size:12px;color:rgba(241,196,15,0.8);margin-top:6px">🏟️ ドーム圏内です！今シーズン${(G.domeShowsThisSeason || 0) >= 1 ? '（今季使用済み）' : 'の挑戦を検討してください'}</div>`;
    }
  }

  el.innerHTML = html;
}

function renderLog() {
  const el = document.getElementById('logContent');
  // ゲーム設定バッジ
  const modeLabel = G.difficultyMode === 'hard' ? '通常モード（補助金なし）' : '補助金モード';
  const modeColor = G.difficultyMode === 'hard' ? '#e74c3c' : '#3498db';
  const survivalBadge = G.survivalCleared
    ? '<span style="color:#2ecc71;border:1px solid rgba(46,204,113,0.25);border-radius:3px;padding:1px 6px;font-weight:700;margin-left:6px">🎊 経営安定化クリア</span>'
    : '';
  let html = `<div style="margin-bottom:10px;font-size:11px;color:var(--text-dim)">
    <span style="color:${modeColor};border:1px solid ${modeColor}44;border-radius:3px;padding:1px 6px;font-weight:700">${modeLabel}</span>${survivalBadge}
    <span style="margin-left:6px">${G.orgName} — ${Engine.util.formatDate(G.season, G.week)}</span>
  </div>`;
  // v0.95: Enhanced log with filter
  const categories = [
    { key: 'all', label: '全て', icon: '全' },
    { key: 'show', label: '興行', icon: '興', match: l => l.includes('興行') || l.includes('MQ') || l.includes('勝利') || l.includes('防衛') },
    { key: 'finance', label: '財務', icon: '金', match: l => l.includes('収入') || l.includes('支出') || l.includes('万') || l.includes('残高') },
    { key: 'event', label: 'イベント', icon: '戦', match: l => l.includes('対抗') || l.includes('挑戦') || l.includes('頂上') || l.includes('移籍') || l.includes('レンタル') || l.includes('引き抜き') },
    { key: 'season', label: 'シーズン', icon: '季', match: l => l.includes('シーズン') || l.includes('オフ') || l.includes('引退') || l.includes('開幕') || l.includes('ランキング') },
  ];
  const currentFilter = el.dataset.filter || 'all';
  html += '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
  categories.forEach(cat => {
    const active = currentFilter === cat.key;
    html += `<button onclick="document.getElementById('logContent').dataset.filter='${cat.key}';renderLog()" style="font-size:12px;padding:3px 8px;border-radius:3px;cursor:pointer;border:1px solid ${active ? 'var(--gold)' : 'var(--border)'};background:${active ? 'rgba(212,168,67,0.15)' : 'transparent'};color:${active ? 'var(--gold)' : 'var(--text-dim)'}">${cat.icon} ${cat.label}</button>`;
  });
  html += '</div>';

  // ログエントリのテキスト取得ヘルパー（文字列 or オブジェクト両対応）
  const getLogText = (entry) => typeof entry === 'string' ? entry : (entry && entry.text ? entry.text : '');
  const isSnapshot = (entry) => typeof entry === 'object' && entry && entry.type === 'snapshot';
  const matchFilter = (entry, fn) => fn(getLogText(entry));
  const filtered = currentFilter === 'all' ? G.gameLog : G.gameLog.filter(entry => {
    if (isSnapshot(entry)) return currentFilter === 'all'; // スナップショットは「全て」のみ
    const fn = categories.find(c => c.key === currentFilter)?.match;
    return fn ? matchFilter(entry, fn) : true;
  });
  const display = filtered.slice(-100).reverse();
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">${filtered.length}件中 最新${Math.min(display.length, 100)}件</div>`;
  display.forEach(l => {
    if (isSnapshot(l)) {
      html += `<div class="log-snapshot" style="padding:3px 0;border-bottom:1px solid rgba(200,190,170,0.03);font-size:11px">\u{1F4AD} ${l.text}</div>`;
    } else {
      html += `<div style="padding:3px 0;border-bottom:1px solid rgba(200,190,170,0.03);font-size:11px;color:var(--text-sub)">${getLogText(l)}</div>`;
    }
  });
  el.innerHTML = html;
}

// ── Ranking Screen (v0.9) ────────────────────────────────
function renderRanking() {
  const el = document.getElementById('rankingContent');
  const mastEl = document.getElementById('rankingMast');
  const vbarEl = document.getElementById('rankingVictoryBar');
  // Recalculate live rankings
  const rankings = Engine.ranking.updateRankings(G);
  G = { ...G, rankings };

  let html = '';

  // ── Phase 1: マスト + 勝利条件バー ─────────────────────────
  const top1 = rankings.find(r => r.rank === 1);
  const playerEntry = rankings.find(r => r.orgId === 'player');
  if (mastEl) {
    mastEl.outerHTML = `<div id="rankingMast" class="popup-mast">
      <div class="popup-mast-title">INDUSTRY STANDINGS</div>
      <div class="popup-mast-meta">
        <div class="issue">第${G.season || 1} シーズン・全4団体</div>
        <div class="date">${Engine.util.formatDate(G.season || 1, G.week || 1)}</div>
      </div>
    </div>`;
  }
  if (vbarEl) {
    let vbarHtml = '';
    if (top1 && playerEntry) {
      if (top1.orgId === 'player') {
        vbarHtml = `<div id="rankingVictoryBar" class="victory-bar is-top">
          <div class="vb-top">👑 業界1位 ／ あなたの団体が頂点に立っています</div>
        </div>`;
      } else {
        const gap = Math.max(0, Math.round(top1.rating - playerEntry.rating));
        vbarHtml = `<div id="rankingVictoryBar" class="victory-bar">
          <div class="vb-side vb-target">
            <span class="vb-label">▲ 1位</span>
            <span class="vb-org">${escHtml(top1.name)}</span>
            <span class="vb-pt">${Math.round(top1.rating)}<span class="unit">pt</span></span>
          </div>
          <div class="vb-middle">
            <div class="vb-gap-num">−${gap}</div>
            <div class="vb-gap-label">pt で頂点</div>
          </div>
          <div class="vb-side vb-player">
            <span class="vb-label">▼ 自団体</span>
            <span class="vb-org">${escHtml(playerEntry.name)}</span>
            <span class="vb-pt">${Math.round(playerEntry.rating)}<span class="unit">pt</span></span>
          </div>
        </div>`;
      }
    } else {
      vbarHtml = `<div id="rankingVictoryBar" class="victory-bar"></div>`;
    }
    vbarEl.outerHTML = vbarHtml;
  }

  // ── 02 全団体ロースター（4団体グリッド + T字フォーメーション） ──
  // 各団体の主力上位3名 + 王者 + 看板を計算するヘルパー
  const buildOrgTopThree = (roster, championId) => {
    const sorted = [...roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    let top3 = sorted.slice(0, 3);
    if (championId) {
      const champIdx = sorted.findIndex(c => c.id === championId);
      if (champIdx > 0) {
        top3 = [sorted[champIdx], ...sorted.filter(c => c.id !== championId)].slice(0, 3);
      }
    }
    // 看板：OVR 最高位。王者兼看板もあり得る。
    const boardId = (sorted[0] || {}).id;
    return { top3, sorted, boardId };
  };
  const coreLimitForRank = (rank) => rank === 1 ? 5 : (rank === 2 ? 4 : 3);
  const coreIdsForRank = (sorted, rank, championId, boardId) => new Set(
    sorted
      .filter(f => f.id !== championId && f.id !== boardId)
      .slice(0, coreLimitForRank(rank))
      .map(f => f.id)
  );
  const roleBadgesHtml = (f, championId, boardId, coreIds) => {
    if (!f) return '';
    const badges = [];
    if (championId === f.id) badges.push('<span class="badge champ">王者</span>');
    if (boardId === f.id) badges.push('<span class="badge board">看板</span>');
    if (coreIds && coreIds.has(f.id) && championId !== f.id && boardId !== f.id) badges.push('<span class="badge core">主力</span>');
    return badges.length ? `<span class="role-badges">${badges.join('')}</span>` : '';
  };
  const _ovrCss = (o) => valueClassOvr(o);
  const fcellHtml = (f, pos, championId, boardId, coreIds, popupSource) => {
    if (!f) return '';
    const o = Engine.util.ov(f);
    const isChamp = championId === f.id;
    const url = getUpperUrl(f.id);
    const imgTag = url ? `<img src="${url}" alt="" onerror="this.style.display='none'">` : '';
    const badges = roleBadgesHtml(f, championId, boardId, coreIds);
    return `<div class="orgcell-fcell pos-${pos}${isChamp ? ' is-champ' : ''}" onclick="showFighterPopup(${f.id},'${popupSource}')" title="${escHtml(f.name)} OVR ${o}">
      ${badges}
      <div class="img-wrap">${imgTag}</div>
      <div class="nm-tag">${escHtml(f.name)}<span class="ovr ${_ovrCss(o)}">${o}</span></div>
    </div>`;
  };

  html += '<section class="section bg-card"><div class="section-marker"><div class="text"><div class="kicker">02 — Roster</div><div class="title">全団体ロースター</div></div></div><div class="orgs-grid">';

  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const orgName = isPlayer ? (G.orgName || 'プレイヤー団体') : (org ? org.name : r.name);
    const tier = isPlayer ? '自' : (org ? org.tier : '');
    const rankClass = `is-rank-${r.rank}`;
    const playerClass = isPlayer ? ' is-player' : '';

    let roster, championId;
    if (isPlayer) {
      roster = (G.roster || []).filter(c => !c.isRental && !c.injury && !c.forcedRest);
      championId = G.titles?.world?.championId || null;
    } else {
      const aiData = G.aiOrgs && G.aiOrgs[r.orgId];
      roster = aiData ? Engine.rival.dedupeRoster(aiData.roster || []).filter(f => !f.isRental) : [];
      championId = aiData?.titles?.world?.championId || null;
    }
    const popupSource = isPlayer ? 'roster' : ('ai:' + r.orgId);
    const { top3, sorted, boardId } = buildOrgTopThree(roster, championId);
    const coreIds = coreIdsForRank(sorted, r.rank, championId, boardId);

    const avgOvr = sorted.length ? Math.round(sorted.reduce((s, c) => s + Engine.util.ov(c), 0) / sorted.length) : 0;
    const battleSign = r.battlePt > 0 ? '+' : '';
    const battleClass = r.battlePt > 0 ? 'battle-pos' : (r.battlePt < 0 ? 'battle-neg' : '');

    html += `<div class="orgcell ${rankClass}${playerClass}">
      <div class="orgcell-head">
        <div class="rank">${r.rank}</div>
        <div class="name-block">
          <div class="nm">${escHtml(orgName)}</div>
          <div class="meta"><span class="tier-pill">${tier}</span></div>
        </div>
      </div>
      <div class="orgcell-formation">
        ${fcellHtml(top3[1], 2, championId, boardId, coreIds, popupSource)}
        ${fcellHtml(top3[2], 3, championId, boardId, coreIds, popupSource)}
        ${fcellHtml(top3[0], 1, championId, boardId, coreIds, popupSource)}
      </div>
      <div class="orgcell-foot">
        <div class="pt-block rank-metric">
          <div class="label">評価</div>
          <div class="v">${Math.round(r.rating)}<span class="unit">pt</span></div>
          <div class="rank-metric-tooltip"><div class="rmt-label">評価 — 総合順位の決定値</div><div class="rmt-text">基礎力 ＋ レガシー ＋ 対戦PT ＋ 実績 の合計。<br>このポイントで業界順位が決まる。</div></div>
        </div>
        <div class="meta-block">
          <div class="ovr-line rank-metric">平均OVR ${avgOvr}
            <div class="rank-metric-tooltip"><div class="rmt-label">平均OVR</div><div class="rmt-text">ロスター全員のOVR単純平均。</div></div>
          </div>
          <div class="${battleClass} rank-metric">対戦PT ${battleSign}${Math.round(r.battlePt)}
            <div class="rank-metric-tooltip"><div class="rmt-label">対戦PT — 団体間の勝敗ポイント</div><div class="rmt-text">対抗戦・サミットの勝敗で増減する団体間ポイント。<br>シーズンを跨いで保持される。</div></div>
          </div>
        </div>
      </div>
    </div>`;
  });
  html += '</div></section>';

  // ── 03 団体プロファイル（戦力層台帳） ──
  const RANK_TIER = { 1: 'S級', 2: '自団体', 3: 'A級', 4: 'B級' };
  const DEPTH_TOTAL = { 1: 8, 2: 6, 3: 5, 4: 4 };
  const rank1Entry = rankings.find(x => x.rank === 1);
  const _countOvrAtLeast = (list, min) => list.filter(f => Engine.util.ov(f) >= min).length;
  const _avgOvrOf = (list) => list.length ? Math.round(list.reduce((s, f) => s + Engine.util.ov(f), 0) / list.length) : 0;
  // ── 動的フレーバーテキスト生成 ──
  const _strHash = (s) => { let h = 0; for (let i = 0; i < (s||'').length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return Math.abs(h); };
  const _seedBase = ((G.season || 1) * 100 + (G.week || 1)) | 0;
  const _pickSeed = (arr, seed) => arr.length ? arr[seed % arr.length] : '';
  const _hasTrait = (f, t) => Array.isArray(f?.traits) && f.traits.includes(t);

  const _collectOrgTags = ({ r, sortedAll, featured, champion, defenses, orgPop, isPlayer, rank1Entry, rankAbove }) => {
    const tags = new Set();
    // 順位
    if (r.rank === 1) tags.add('top');
    else if (r.rank === 2) tags.add('chasing');
    else if (r.rank >= 4) tags.add('bottom');
    else tags.add('midpack');
    const gapTop = Math.max(0, Math.round((rank1Entry?.rating || r.rating) - r.rating));
    const gapAbove = rankAbove ? Math.max(0, Math.round(rankAbove.rating - r.rating)) : 0;
    if (gapTop > 0 && gapTop <= 5) tags.add('closeToTop');
    if (gapAbove > 0 && gapAbove <= 3) tags.add('breathingDown');
    // トレンド (player のみ seasonHistory あり)
    if (isPlayer && Array.isArray(G.seasonHistory) && G.seasonHistory.length >= 2) {
      const recent = G.seasonHistory.slice(-3).map(h => h.rank).filter(x => x != null);
      if (recent.length >= 2) {
        const prev = recent[recent.length - 1];
        const older = recent[0];
        if (prev - r.rank >= 2) tags.add('rising');
        else if (r.rank - prev >= 2) tags.add('sliding');
        else if (older === r.rank) tags.add('stable');
      }
    }
    // 勢い
    if (r.battlePt >= 10) tags.add('hot');
    else if (r.battlePt <= -10) tags.add('cooling');
    // 王者
    if (!champion) tags.add('vacant');
    else if (defenses >= 5) tags.add('longReign');
    else if (defenses <= 1) tags.add('freshChamp');
    else tags.add('reigning');
    // 人気
    const popNum = Number(orgPop) || 0;
    if (popNum >= 75) tags.add('popHigh');
    else if (popNum < 40) tags.add('popLow');
    else tags.add('popMid');
    // 戦力層
    const top3Avg = _avgOvrOf(sortedAll.slice(0, 3));
    const over80 = _countOvrAtLeast(sortedAll, 80);
    const over70 = _countOvrAtLeast(sortedAll, 70);
    const avgOvr = sortedAll.length ? Math.round(sortedAll.reduce((s, c) => s + Engine.util.ov(c), 0) / sortedAll.length) : 0;
    if (over80 >= 3 || top3Avg >= 82) tags.add('layerSuper');
    else if (over80 >= 1 || top3Avg >= 76) tags.add('layerSolid');
    else if (over70 >= 3 || avgOvr >= 62) tags.add('layerMid');
    else tags.add('layerRaw');
    // 規模
    if (sortedAll.length <= 8) tags.add('compact');
    else if (sortedAll.length >= 16) tags.add('wide');
    return { tags, gapTop, gapAbove, top3Avg, over80, over70, avgOvr };
  };

  // 団体の周辺コンテキスト (実績アイテム、過去年間王者歴、battlePT動向 など) を語に変換
  const _orgContextSentences = (r, seed) => {
    const out = [];
    // 直近の年間王者歴
    const sh = G.seasonHistory || [];
    const recentAnnual = sh.slice(-3).filter(h => h.annualChampion && h.annualChampion.orgId === r.orgId);
    if (recentAnnual.length >= 2) {
      out.push(_pickSeed(['ここ数シーズンで複数回の年間王者となり、業界を支配する空気を作っている', '直近の年間王者を立て続けに獲り、トップとしての色がはっきりしてきた'], seed));
    } else if (recentAnnual.length === 1) {
      const yr = recentAnnual[0].season;
      out.push(_pickSeed([`${yr}年目の年間王者の余韻がまだ団体に残っている`, `${yr}年目に頂点を獲った記憶が、今のチームの基準になっている`], seed));
    }
    // 実績ポイントの厚み
    const items = r.achievementItems || [];
    if (items.length >= 4) {
      out.push(_pickSeed(['シーズンの勲章を多数抱え、勢いのある団体としての印象が定着している', '直近で獲った実績の蓄積が、評価ptの押し上げ役になっている'], seed >> 2));
    } else if (items.length === 0 && (r.legacyScore || 0) <= 5) {
      out.push(_pickSeed(['際立った勲章を持たず、評価の積み上げに苦労している', 'シーズン実績で稼げず、地力勝負を強いられている'], seed >> 2));
    }
    // 対戦PT動向
    if (r.battlePt >= 20) {
      out.push(_pickSeed(['他団体との直接対決で星を稼いでおり、対戦pt面でも優位に立つ', '対抗戦やサミットでの勝ち越しが続き、業界内の貯金を作っている'], seed >> 4));
    } else if (r.battlePt <= -15) {
      out.push(_pickSeed(['他団体相手の星勘定で大きくマイナスを背負っている', '対抗戦での連敗が続き、対戦ptが重しになっている'], seed >> 4));
    }
    return out;
  };

  const _buildLeadSentences = ({ tags, featured, champion, gapTop, gapAbove, seed, r }) => {
    const has = (t) => tags.has(t);
    const aceName = featured ? featured.name : '看板選手';
    // 文1: ポジション×トレンド×勢い
    let s1Pool = [];
    if (has('top')) {
      if (has('sliding') || has('cooling')) s1Pool = ['首位の座が揺らぎ始めている', '頂点に立ちながらも背中が見え始めた', '王座防衛戦のような立ち位置に追われている'];
      else if (has('rising') || has('hot')) s1Pool = ['業界の頂点を独走する勢い', '首位として後続を突き放しにかかる時期', '今がまさに全盛期と呼べる団体'];
      else s1Pool = ['業界の頂点に座り続けている', '首位の重みを引き受ける立場', '王者団体としての風格を備える'];
    } else if (has('chasing') || has('closeToTop')) {
      if (has('rising') || has('hot')) s1Pool = ['首位の喉元に手をかけている', '逆転劇の主役になりかけている団体', '頂点が射程に入ってきた'];
      else if (has('sliding')) s1Pool = ['二番手の座すら危うくなってきた', '追走しながらも足が止まりかけている'];
      else s1Pool = ['首位を追い続ける挑戦者の位置', `首位の背中を捉えきれずにいる`, '万年二番手の汚名を返上したい'];
    } else if (has('midpack')) {
      if (has('rising') || has('hot')) s1Pool = ['中盤から這い上がってきた団体', '台頭の気配を漂わせ始めた', '中位の枠を破ろうと牙を研ぐ'];
      else if (has('sliding') || has('cooling')) s1Pool = ['中位で足踏みが続いている', 'かつての勢いがやや陰りつつある', '中盤に沈みかけている'];
      else s1Pool = ['中位に腰を落ち着けている', '上にも下にも振れる中堅', '安定の中位という評価が定着している'];
    } else {
      if (has('rising')) s1Pool = ['最下層から這い上がろうともがいている', '下位ながら反転の兆しを見せる'];
      else s1Pool = ['業界の最下層に沈んでいる', '再建が急務の窮状', '下位に甘んじている苦しい時期'];
    }
    // 文2: 王者×人気
    let s2Pool = [];
    if (has('vacant')) {
      if (has('popHigh')) s2Pool = [`王座は空位のまま、${aceName}の看板で人気を保っている`, `頂点の椅子は空席。それでも${aceName}を中心に客足は途絶えない`];
      else s2Pool = [`王座は不在で、${aceName}が看板を一人で背負う`, `タイトルを欠いたまま、${aceName}頼みで戦線をつなぐ`, `世界戦線から距離を置き、${aceName}を軸に再起を図る`];
    } else if (has('longReign')) {
      const cn = champion.name;
      if (has('popHigh')) s2Pool = [`${cn}の長期政権が団体を支え、客の目もそこに集まる`, `${cn}が幾度も防衛を重ね、団体の顔そのものになっている`];
      else s2Pool = [`${cn}の防衛記録だけが、いまの団体の数少ない誇り`, `${cn}が長く王座を握り、新陳代謝の遅さも同時に露わになっている`];
    } else if (has('freshChamp')) {
      s2Pool = [`戴冠したばかりの${champion.name}が、まだ手探りで王座を温めている`, `新王者${champion.name}の真価がこれから試される段階`, `${champion.name}が王座を獲ったばかりで、団体全体が新章に入った`];
    } else {
      if (has('popHigh')) s2Pool = [`${champion.name}が王座を構え、人気と実力の両輪が噛み合っている`, `${champion.name}を中心線に置き、団体としての形が見えている`];
      else s2Pool = [`${champion.name}が王座を保持してはいるが、団体全体に火がついた感じはまだ薄い`, `${champion.name}の王座が、いまの団体をかろうじて束ねている`];
    }
    // 文3: 戦力層
    let s3Pool = [];
    if (has('layerSuper')) s3Pool = ['上位だけで興行を成立させられる分厚さがある', 'エース級が複数並び、対戦カードに困らない', '主力陣の格だけで他団体を上回っている'];
    else if (has('layerSolid')) s3Pool = ['看板を軸に主力の輪郭がはっきりしている', '上位陣の顔ぶれで勝負できる骨格は整っている', '看板級の周りに準主力が並ぶ手堅い構成'];
    else if (has('layerMid')) s3Pool = ['突出した怪物はいないが、主力候補が広く並ぶ', '頭抜けた選手はいないものの、層は意外と広い', '横並びの主力で何とか試合数をこなしている'];
    else s3Pool = ['まだ発展途上で、伸びしろの賭け', '主力という呼び名に届く選手が乏しい', '育成の途上で、来季以降の積み上げを待つ段階'];
    const baseLead = [_pickSeed(s1Pool, seed), _pickSeed(s2Pool, seed >> 3), _pickSeed(s3Pool, seed >> 6)].filter(Boolean).join('。') + '。';
    // 周辺コンテキスト (年間王者歴/実績/対戦PT) を最大1-2文足す
    const ctx = r ? _orgContextSentences(r, seed >> 9) : [];
    if (ctx.length === 0) return baseLead;
    const pickedCtx = ctx.slice(0, 2).join('。') + '。';
    return baseLead + pickedCtx;
  };

  const _aceFlavorByPersona = (f, seed) => {
    const arch = f?.archetype || 'normal';
    const pers = f?.personality || 'normal';
    const archMap = {
      composed: ['鷹揚な物腰で団体を束ねる', '常に落ち着いた佇まいが格を生む', '泰然とした空気で対戦相手を呑む'],
      ojousama: ['気品ある立ち振る舞いで観客を魅了する', 'お嬢様然とした華が興行に色を添える', '上品な所作の奥に勝負師の牙を隠す'],
      polite: ['礼節を重んじる姿勢で敵すら味方につける', '丁寧で清廉な人柄が団体の品位を作る'],
      cool: ['クールな佇まいで観客を引き寄せる', '冷ややかな眼差しが対戦相手を凍らせる', '感情を見せない戦い方が逆に怖い'],
      delinquent: ['不良性感度の塊で観客を煽り続ける', '荒っぽい振る舞いが団体の毒気を担う', 'ルールの外側で観客を熱狂させる'],
      seductive: ['妖艶な魅せ方で他団体にはない色を添える', '艶のある立ち姿が独自のファン層を呼ぶ'],
      normal: ['素直な人柄が選手会の核になっている', '飾らない佇まいが逆に絵になる']
    };
    const persMap = {
      bold: ['物怖じしない発言で常に火種を撒く', '気の強さでカードを引っ張る'],
      quiet: ['多くを語らず試合で全てを示す', '寡黙さの裏に確かな圧がある'],
      easygoing: ['ゆるい空気で控室の緊張を解く側', '飄々とした雰囲気が独特の間合いを作る'],
      earnest: ['真面目さがそのまま強さに直結している', '愚直な姿勢でチームを牽引する'],
      emotional: ['感情の振れ幅で試合をドラマに変える', '熱が乗ったときの爆発力が桁違い'],
      normal: []
    };
    const pool = (archMap[arch] || archMap.normal).concat(persMap[pers] || []);
    return _pickSeed(pool, seed);
  };

  // 王座の「奪い合い」検出: 直近3シーズン以内に複数のtitleWin (= 取られて取り返した) があれば true
  const _isContestedBelt = (champion) => {
    if (!champion || !champion.careerRecord) return false;
    // 転生前の架空タイトルは無視
    const _js = Engine.career.joinSeason(champion);
    const hist = Engine.career.filterPostJoin(champion.careerRecord.history || [], _js);
    const curSeason = G.season || 1;
    const recentWins = hist.filter(e => e.type === 'titleWin' && (curSeason - (e.season || curSeason)) <= 2);
    return recentWins.length >= 2;
  };
  const _titleWinCount = (fighter) => {
    if (!fighter || !fighter.careerRecord) return 0;
    const _js = Engine.career.joinSeason(fighter);
    return Engine.career.filterPostJoin(fighter.careerRecord.history || [], _js).filter(e => e.type === 'titleWin').length;
  };

  const _buildAceCopy = ({ featured, champion, defenses, isChampion, seed }) => {
    if (!featured) return '看板を担う選手がまだ定まっていない。';
    const ovr = Engine.util.ov(featured);
    const peak = featured.peakOVR || ovr;
    const age = featured.age || 0;
    const pop = Number(featured.popularity) || 0;
    // 強シグナル選定
    let primary = '';
    if (isChampion && defenses >= 5) {
      primary = _pickSeed([
        `王座を${defenses}度防衛し、団体の中心線そのものになっている`,
        `防衛記録を伸ばし続け、もはや交代が想像しにくい`,
        `長期政権を敷き、団体の歴史と一体化している`,
        `${defenses}度の防衛は王座そのものに重みを与え続けている`,
        `揺るぎない王者として、対抗馬を寄せ付けない`,
      ], seed);
    } else if (isChampion && defenses === 4) {
      primary = _pickSeed([
        `4度の防衛を重ね、盤石と呼べる体制を築き上げた`,
        `防衛戦のたびに王者像が研ぎ澄まされていく`,
        `4連続防衛で、団体の顔として完全に定着した`,
      ], seed);
    } else if (isChampion && defenses === 3) {
      primary = _pickSeed([
        `3度の防衛で、もはや盤石の体制と言っていい`,
        `防衛を3つ重ね、王者の格が形になってきた`,
        `挑戦者を退け続け、王座が安定圏に入った`,
        `3連続防衛は団体に静かな安心感をもたらしている`,
      ], seed);
    } else if (isChampion && defenses === 2) {
      primary = _pickSeed([
        `2度の防衛で、王者としての軸が定まりつつある`,
        `防衛を重ねるたびに王者像がはっきりしてきた`,
        `2連続防衛で、団体の中心が見えてきた`,
      ], seed);
    } else if (isChampion && defenses === 1) {
      primary = _pickSeed([
        `初防衛を成功させ、王者としての足場を固め始めた`,
        `1度の防衛をクリアし、戴冠時の不安はひとまず払拭された`,
        `最初の防衛戦を乗り越え、王者像を作り始めている`,
        `初防衛の手応えを掴み、ここからが王座固めの本番`,
      ], seed);
    } else if (isChampion && defenses === 0) {
      const contested = _isContestedBelt(champion);
      const winCount = _titleWinCount(champion);
      if (contested && winCount >= 3) {
        primary = _pickSeed([
          `防衛戦を経ずに王座が動き続けており、団体は抗争の渦中にある`,
          `奪い合いの最中で戴冠したばかり、白熱した王座争いが続いている`,
          `${champion.name}と前王者の取り合いになっており、王座がまだ落ち着く気配を見せない`,
          `王座が短期間で行き来しており、抗争の只中での即位`,
        ], seed);
      } else if (contested) {
        primary = _pickSeed([
          `直近で王座が動いたばかりで、防衛戦に向けた緊張感が漂う`,
          `奪取からまだ間がなく、王座を巡る空気はまだ熱い`,
          `戴冠したばかりだが、奪取と奪還が続く流れの一コマ`,
        ], seed);
      } else if (winCount >= 2) {
        primary = _pickSeed([
          `再び王座を巡って戻ってきた挑戦者でもある王者`,
          `王座経験者として、改めて頂点に座り直した格`,
          `過去の戴冠経験を糧に、再び王座を獲り戻した`,
        ], seed);
      } else {
        primary = _pickSeed([
          `戴冠したばかりで、王者としての色をこれから作っていく`,
          `新王者として、最初の防衛戦が試金石になる`,
          `王座を獲って間もなく、団体全体が新章に入った`,
        ], seed);
      }
    } else if (age >= 33 && ovr >= peak - 2) {
      primary = _pickSeed([`${age}歳になっても全盛期を維持し続けるベテラン`, `年齢を重ねても衰えを見せず、まだ第一線に立つ`, '老練という言葉が似合うが、力の落ち方を感じさせない'], seed);
    } else if (age <= 20 && ovr >= 75) {
      primary = _pickSeed([`若くして団体の顔に押し上げられた逸材`, `${age}歳とは思えない試合運びで看板を任されている`, '世代交代を一人で先取りしてしまった存在'], seed);
    } else if (pop >= ovr + 8) {
      primary = _pickSeed(['実力以上に客を呼べる人気先行型', '数字より華で勝負できる稀有なタイプ', '人気が先に立つことで興行の柱になっている'], seed);
    } else if (_hasTrait(featured, '威圧感')) {
      primary = _pickSeed(['リング上の圧で対戦相手を呑む', '威圧感ひとつで会場の空気を変える'], seed);
    } else if (_hasTrait(featured, 'ガラスの身体')) {
      primary = _pickSeed(['才能はあるが身体が悲鳴を上げやすく、起用には常に怖さがつきまとう', '欠場リスクと隣り合わせで看板を張っている'], seed);
    } else if (_hasTrait(featured, '反骨心')) {
      primary = _pickSeed(['逆境で燃えるタイプで、追い込まれるほど強い', '反骨を糧に這い上がってきた選手'], seed);
    } else if (_hasTrait(featured, '努力家')) {
      primary = _pickSeed(['地道な積み上げで看板まで上ってきたタイプ', '才能より努力で位置を勝ち取った選手'], seed);
    } else if (isChampion) {
      primary = _pickSeed([`王座を保持し、団体の軸として機能している`, '中堅クラスの王者として、防衛戦を一つずつ積む段階'], seed);
    } else {
      primary = _pickSeed(['団体最高のOVRを誇り、看板を背負う立場', 'タイトルこそないが、団体の顔として認知されている'], seed);
    }
    const flavor = _aceFlavorByPersona(featured, seed >> 4);
    return flavor ? `${primary}。${flavor}。` : `${primary}。`;
  };

  // ── 実績ツールチップ: アイテム時系列一覧 (org-ranking-spec-v2.0) ──
  const _buildAchievementTooltip = (r, currentSeason) => {
    const items = (r && r.achievementItems) || [];
    if (items.length === 0) {
      return 'このシーズンの勲章はまだない。<br>※ PPV優勝/MVP/ベストマッチ賞/ジュニアトーナメント優勝/新人賞/メディア厚労賞などで加点。<br>翌シーズンまで満額、その後毎年半減。1pt未満で消滅。';
    }
    // age (シーズン跨ぎ回数) でグルーピング: 0=当シーズン, 1=1年前, ...
    const buckets = {};
    items.forEach(it => {
      const age = it.age || 0;
      if (!buckets[age]) buckets[age] = [];
      buckets[age].push(it);
    });
    const decay = (typeof ACHIEVEMENT_CONFIG !== 'undefined' && ACHIEVEMENT_CONFIG.decayRate != null) ? ACHIEVEMENT_CONFIG.decayRate : 0.5;
    const grace = (typeof ACHIEVEMENT_CONFIG !== 'undefined' && ACHIEVEMENT_CONFIG.graceAge != null) ? ACHIEVEMENT_CONFIG.graceAge : 1;
    const ageLabel = (age) => {
      if (age === 0) return `当シーズン (${currentSeason}年目)`;
      const seasonNum = currentSeason - age;
      return `${age}年前 (${seasonNum}年目)`;
    };
    const currentPt = (it) => {
      const age = it.age || 0;
      const orig = it.originalPt || 0;
      if (age <= grace) return orig;
      return orig * Math.pow(decay, age - grace);
    };
    const sortedAges = Object.keys(buckets).map(Number).sort((a, b) => a - b);
    const lines = [];
    let total = 0;
    sortedAges.forEach(age => {
      lines.push(`<b>${ageLabel(age)}</b>`);
      buckets[age].forEach(it => {
        const pt = currentPt(it);
        total += pt;
        const ptDisp = pt === Math.round(pt) ? String(pt) : pt.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
        const winnerSuffix = it.winnerName ? ` <span style="opacity:0.7">(${escHtml(it.winnerName)})</span>` : '';
        lines.push(`　${escHtml(it.label)}${winnerSuffix} +${ptDisp}`);
      });
    });
    lines.push(`<b>合計 ${Math.round(total)}pt</b>`);
    lines.push('<span style="opacity:0.7">※ 翌シーズンまで満額、その後毎年半減。1pt未満で消滅。</span>');
    return lines.join('<br>');
  };

  const _buildDepthNoteV2 = ({ sortedAll, featured }) => {
    if (!sortedAll.length) return '主力と呼べる顔触れがまだ揃っていない。';
    const aceOvr = featured ? Engine.util.ov(featured) : 0;
    const next = sortedAll.find(f => !featured || f.id !== featured.id);
    const nextOvr = next ? Engine.util.ov(next) : 0;
    const third = sortedAll.filter(f => f !== featured && f !== next)[0];
    const thirdOvr = third ? Engine.util.ov(third) : 0;
    const top3Avg = _avgOvrOf(sortedAll.slice(0, 3));
    const avgOvr = sortedAll.length ? Math.round(sortedAll.reduce((s, c) => s + Engine.util.ov(c), 0) / sortedAll.length) : 0;
    const over70 = _countOvrAtLeast(sortedAll, 70);
    const aceGap = next ? aceOvr - nextOvr : 99;
    const secondGap = third ? nextOvr - thirdOvr : 99;
    const youthCount = sortedAll.slice(0, 8).filter(f => (f.age || 99) <= 20).length;
    const veteranCount = sortedAll.slice(0, 8).filter(f => (f.age || 0) >= 26).length;
    const injured = sortedAll.filter(f => f.injury || f.forcedRest).length;
    // 上位2-3人の踏み込み描写ヘルパ — role: 'second' | 'third'
    const _personDesc = (f, role) => {
      if (!f) return '';
      const a = f.age || 0;
      const o = Engine.util.ov(f);
      const p = Number(f.popularity) || 0;
      const peak = f.peakOVR || o;
      const traits = Array.isArray(f.traits) ? f.traits : [];
      const roleLabel = role === 'second' ? '二番手' : (role === 'third' ? '三番手' : '');
      const prefix = roleLabel ? `${roleLabel}は` : '';
      if (traits.includes('威圧感'))      return `${prefix}${f.name}(${o})、押し出しの強さで場を作る`;
      if (traits.includes('反骨心'))      return `${prefix}${f.name}(${o})、反骨で場を引き締める存在`;
      if (traits.includes('ガラスの身体')) return `${prefix}${f.name}(${o})、試合数を選ぶ難しさを抱える`;
      if (a <= 20 && o >= 70)             return `${prefix}${f.name}(${a}歳/${o})、伸び盛りが頼もしい`;
      if (a >= 30 && o >= peak - 2)       return `${prefix}${f.name}(${a}歳/${o})、衰えを見せないベテラン`;
      if (a >= 30)                        return `${prefix}${f.name}(${o})、ベテランの間合いで凌ぐタイプ`;
      if (p >= o + 8)                     return `${prefix}${f.name}(${o})、人気先行で客を呼べる`;
      // OVR 帯の表現は role で言葉を変えて重複を避ける
      if (o >= 80) {
        return role === 'second'
          ? `${prefix}${f.name}(${o})、エース級の格を持つ`
          : `${prefix}${f.name}(${o})、上位陣に並ぶ実力者`;
      }
      if (o >= 70) {
        return role === 'second'
          ? `${prefix}${f.name}(${o})、看板を支える働き手`
          : `${prefix}${f.name}(${o})、中軸を担える位置`;
      }
      return role === 'second'
        ? `${prefix}${f.name}(${o})、次の主力候補として育成中`
        : `${prefix}${f.name}(${o})、控えから上を窺う立ち位置`;
    };

    const tags = new Set();
    if (top3Avg - avgOvr >= 10) tags.add('topHeavy');
    if (sortedAll.length >= 5 && (aceOvr - Engine.util.ov(sortedAll[sortedAll.length - 1])) <= 12) tags.add('flat');
    if (aceGap >= 10) tags.add('aceDependent');
    if (youthCount >= 3) tags.add('youthRising');
    if (veteranCount >= 4) tags.add('aging');
    if (injured >= 2) tags.add('injuryShadow');
    if (over70 >= 5) tags.add('thickCore');
    else if (over70 <= 1) tags.add('thinCore');

    const seed = _seedBase + _strHash((featured?.name || '') + 'depth');
    const has = (t) => tags.has(t);
    let pool = [];
    // 主軸タグ優先順
    if (has('aceDependent') && has('injuryShadow')) {
      pool = [`${featured.name}への依存が強く、離脱者が出ると一気に苦しくなる構図`, `看板一枚に支えられている状態で、戦線離脱の影が濃い`];
    } else if (has('aceDependent')) {
      pool = [`${featured.name}と次点の差が大きく、看板頼みの色が濃い`, '上が突出していて、下との段差が興行設計の悩みどころ', '看板への一極集中で、二番手の育成が急務'];
    } else if (has('topHeavy') && has('aging')) {
      pool = ['上位はベテランが固める。世代交代をどう仕掛けるかが課題', '主力がベテラン揃いで安定するが、その先が見えない', '上位陣の経験値で持っているが、次の世代が控えていない'];
    } else if (has('flat') && has('youthRising')) {
      pool = ['主力の差が小さく、伸び盛りの若手が突き上げる構図', '横並びの中で若手の台頭が秩序を揺らし始めている', '実力差が薄い分、下剋上が起きやすい層構成'];
    } else if (has('flat')) {
      pool = ['上から下まで実力差が小さく、誰がメインを張ってもおかしくない', '突出は無いが横の厚みでカードを回せる', '主力の階層がフラットで、序列を崩しやすい'];
    } else if (has('youthRising') && has('thickCore')) {
      pool = ['若手が押し上げ、主力層も厚いという理想形に近づきつつある', '伸び盛りが並び、向こう数シーズンの伸びしろが大きい'];
    } else if (has('youthRising')) {
      pool = ['若手の台頭が目立ち、世代交代の波が見え始めている', '伸び盛りが主力に食い込んできて層の景色が変わりつつある'];
    } else if (has('aging')) {
      pool = ['ベテラン中心で安定するが、後継者の不在が中長期の影', '熟練の試合運びで持っている層構成。引退リスクと隣り合わせ'];
    } else if (has('injuryShadow')) {
      pool = ['離脱者が嵩んで主力編成が苦しい', '怪我人が複数おり、フル戦力が揃わない週が続く'];
    } else if (has('thickCore')) {
      pool = ['主力候補が広く並び、控えにも試合を任せやすい厚さ', '中堅層がしっかり機能していて、カード編成の自由度が高い'];
    } else if (has('thinCore')) {
      pool = ['主力と呼べる顔触れが乏しく、毎週の編成に苦労する', '層が薄く、看板頼みのカードが続く'];
    } else {
      pool = ['可もなく不可もない層構成で、突き抜けるには一押し足りない', '平均的な厚みに留まり、次の一歩を模索する段階'];
    }
    const main = _pickSeed(pool, seed);
    // 上位2-3人の踏み込み: 看板の次2人を取り上げて1〜2文足す
    const personLines = [];
    if (next) personLines.push(_personDesc(next, 'second'));
    if (third) personLines.push(_personDesc(third, 'third'));
    // 二番手と三番手の差で締めの一言を選ぶ
    let closing = '';
    if (secondGap <= 2 && third) {
      closing = _pickSeed(['二番手と三番手の力差はわずかで、序列がいつ入れ替わってもおかしくない', '次点の二人がほぼ並んでいるのは、カード編成の自由度を生んでいる', '上位の真ん中が拮抗しており、興行ごとに序列が動いている'], seed >> 5);
    } else if (secondGap >= 8 && third) {
      closing = _pickSeed(['二番手と三番手の段差が大きく、控え陣の底上げが課題', '上位3人目との差が開いており、看板二枚に頼る色が濃い'], seed >> 5);
    } else if (aceGap >= 8 && next) {
      closing = _pickSeed(['看板と二番手の差は埋めきれていないが、その下は実直に積み上がっている', 'エースの突出は変わらないが、追走勢が静かに地力を伸ばしている'], seed >> 5);
    }
    const sentences = [main, ...personLines.filter(Boolean), closing].filter(Boolean);
    return sentences.join('。') + '。';
  };
  html += '<section class="section bg-deep"><div class="section-marker"><div class="text"><div class="kicker">03 — 団体詳細</div><div class="title">団体プロフィール</div></div></div><div class="rp-profiles">';

  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const orgName = isPlayer ? (G.orgName || 'プレイヤー団体') : (org ? org.name : r.name);
    const rankClass = `is-rank-${r.rank}`;
    const playerClass = isPlayer ? ' is-player' : '';

    let roster, championId, defenses, orgPop, deck;
    if (isPlayer) {
      roster = (G.roster || []).filter(c => !c.isRental && !c.injury && !c.forcedRest);
      championId = G.titles?.world?.championId || null;
      defenses = G.titles?.world?.defenses || 0;
      orgPop = G.orgPop;
      deck = '';
    } else {
      const aiData = G.aiOrgs && G.aiOrgs[r.orgId];
      if (!aiData) return;
      roster = Engine.rival.dedupeRoster(aiData.roster || []).filter(f => !f.isRental);
      championId = aiData.titles?.world?.championId || null;
      defenses = aiData.titles?.world?.defenses || 0;
      orgPop = aiData.orgPop;
      deck = (org && org.desc) || '';
    }
    const popupSource = isPlayer ? 'roster' : ('ai:' + r.orgId);
    const rosterAll = isPlayer ? (G.roster || []).filter(c => !c.isRental) : roster;

    const sortedAll = [...rosterAll].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const boardId = (sortedAll[0] || {}).id;
    const champion = championId ? sortedAll.find(c => c.id === championId) : null;
    const featured = champion || sortedAll[0] || null;
    const coreIds = coreIdsForRank(sortedAll, r.rank, championId, boardId);
    const visibleTotal = DEPTH_TOTAL[r.rank] || 4;
    const depthFaces = sortedAll.filter(f => !featured || f.id !== featured.id).slice(0, Math.max(0, visibleTotal - 1));
    const avgOvr = sortedAll.length ? Math.round(sortedAll.reduce((s, c) => s + Engine.util.ov(c), 0) / sortedAll.length) : 0;
    const rankAbove = rankings.find(x => x.rank === r.rank - 1);

    const battleSign = r.battlePt > 0 ? '+' : '';
    const battleClass = r.battlePt > 0 ? 'battle-pos' : (r.battlePt < 0 ? 'battle-neg' : '');
    const popDisplay = Engine.util.dispOrgPop(orgPop);
    const popColor = _orgPopColor(popDisplay).color;
    const baseDepth = sortedAll.length >= 18 ? '厚' : (sortedAll.length >= 14 ? '中' : '薄');
    const topDepth = _avgOvrOf(sortedAll.slice(0, 3)) >= 78 ? '厚' : (_avgOvrOf(sortedAll.slice(0, 3)) >= 68 ? '中' : '薄');
    const tierLabel = isPlayer ? '自団体' : (org ? org.tier : (RANK_TIER[r.rank] || ''));
    const tierMeta = isPlayer ? `${rosterAll.length}名` : `${rosterAll.length}名`;
    const aceOvr = featured ? Engine.util.ov(featured) : 0;
    const aceImgUrl = featured ? getUpperUrl(featured.id) : '';
    const aceImg = aceImgUrl ? `<img src="${aceImgUrl}" alt="" onerror="this.style.display='none'">` : '';
    const aceRoles = featured ? [
      championId === featured.id ? '<span class="rp-ace-role-champ">王者</span>' : '',
      boardId === featured.id ? '<span class="rp-ace-role-board">看板</span>' : ''
    ].filter(Boolean).join('<span class="rp-ace-role-sep"> / </span>') : '';
    const secondOvr = sortedAll[1] ? Engine.util.ov(sortedAll[1]) : 0;
    const thirdOvr = sortedAll[2] ? Engine.util.ov(sortedAll[2]) : 0;
    const secondName = sortedAll[1]?.name || '';
    const thirdName = sortedAll[2]?.name || '';
    const _orgSeed = _seedBase + _strHash(r.orgId || orgName);
    const _tagInfo = _collectOrgTags({ r, sortedAll, featured, champion, defenses, orgPop, isPlayer, rank1Entry, rankAbove });
    const aceCopy = _buildAceCopy({ featured, champion, defenses, isChampion: championId === featured?.id, seed: _orgSeed });
    const scoreLine = depthFaces.length
      ? [aceOvr, ...depthFaces.map(f => Engine.util.ov(f))].join(' / ') + '台多数'
      : `${aceOvr}`;
    const dynamicLead = _buildLeadSentences({ tags: _tagInfo.tags, featured, champion, gapTop: _tagInfo.gapTop, gapAbove: _tagInfo.gapAbove, seed: _orgSeed, r });
    const dynamicDepthNote = _buildDepthNoteV2({ sortedAll, featured });

    const depthFacesHtml = depthFaces.map(f => {
      if (!f) return '';
      const o = Engine.util.ov(f);
      const badges = roleBadgesHtml(f, championId, boardId, coreIds);
      const url = getUpperUrl(f.id);
      const imgTag = url ? `<img src="${url}" alt="" onerror="this.style.display='none'">` : '';
      const roleClass = championId === f.id ? ' is-champ' : (boardId === f.id ? ' is-board' : (coreIds.has(f.id) ? ' is-core' : ''));
      return `<span class="rp-face${roleClass}" onclick="showFighterPopup(${f.id},'${popupSource}')" title="${escHtml(f.name)} OVR ${o}">
        ${badges}
        ${imgTag}
        <b>${o}</b>
      </span>`;
    }).join('');

    const _embPath = (r.orgId === 'player')
      ? ((typeof Engine !== 'undefined' && Engine.util && Engine.util.getPlayerOrgIconPath) ? Engine.util.getPlayerOrgIconPath(G) : '')
      : ((typeof Engine !== 'undefined' && Engine.util && Engine.util.getOrgIconPath) ? Engine.util.getOrgIconPath(G, r.orgId) : '');
    const _embHtml = _embPath ? `<img src="${_embPath}" alt="${escHtml(orgName)}" onerror="this.style.display='none'">` : `<span class="rp-rank-fallback">${escHtml((orgName || '').charAt(0))}</span>`;
    html += `<div class="rp-card ${rankClass}${playerClass}">
      <div class="rp-rank">${_embHtml}</div>
      <div class="rp-info">
        <div class="rp-tags"><span>${tierLabel}</span><span>${tierMeta}</span>${champion ? '<span>王者保持</span>' : '<span>追走中</span>'}</div>
        <h3>${escHtml(orgName)}</h3>
        <p>${escHtml(dynamicLead)}</p>
      </div>
      <div class="rp-ace" onclick="${featured ? `showFighterPopup(${featured.id},'${popupSource}')` : ''}">
        <div class="rp-ace-text">
          <div class="rp-ace-role">${aceRoles}</div>
          <strong>${featured ? escHtml(featured.name) : '不在'} / OVR${aceOvr}</strong>
          <p>${escHtml(aceCopy)}</p>
          <dl><dt>上位層</dt><dd>${topDepth}</dd><dt>控え層</dt><dd>${baseDepth}</dd></dl>
        </div>
        <div class="rp-ace-img">${aceImg}</div>
      </div>
      <div class="rp-depth">
        <div class="rp-depth-head"><strong>主力層 ${visibleTotal}名（大枠含む）</strong><span>${scoreLine}</span></div>
        <div class="rp-faces">${depthFacesHtml}</div>
        <div class="rp-depth-note">${escHtml(dynamicDepthNote)}</div>
      </div>
      <div class="rp-metrics">
        <div class="rank-metric"><span>評価</span><b>${Math.round(r.rating)}</b>
          <div class="rank-metric-tooltip"><div class="rmt-label">評価 — 総合順位の決定値</div><div class="rmt-text">基礎力 ＋ レガシー ＋ 対戦PT ＋ 実績 の合計。<br>このポイントで業界順位が決まる。</div></div></div>
        <div class="rank-metric"><span>基礎力</span><b>${Math.round(r.baseScore)}</b>
          <div class="rank-metric-tooltip"><div class="rmt-label">基礎力 — 今そこにある戦力</div><div class="rmt-text">3軸の合算:<br>・コア戦力 ${Math.round((r.force||0))}　TOP8加重OVR×1.2 ＋ 加重人気×0.6<br>・層の厚み ${Math.round((r.depth||0))}　11位以下のOVR70+/75+を加点（上限30）<br>・看板スター ${Math.round((r.marquee||0))}　TOP3人気の突出加重×0.45<br>引退・レンタル選手は除外。</div></div></div>
        <div class="rank-metric"><span>平均OVR</span><b>${avgOvr}</b>
          <div class="rank-metric-tooltip"><div class="rmt-label">平均OVR</div><div class="rmt-text">ロスター全員のOVR単純平均。<br>厚みの目安。</div></div></div>
        <div class="rank-metric"><span>対戦PT</span><b class="${battleClass}">${battleSign}${Math.round(r.battlePt)}</b>
          <div class="rank-metric-tooltip"><div class="rmt-label">対戦PT — 団体間の勝敗ポイント</div><div class="rmt-text">対抗戦・サミットの勝敗で増減する団体間ポイント。<br>勝つと積み上がり、負けると目減りする。</div></div></div>
        <div class="rank-metric"><span>レガシー</span><b>${Math.round(r.legacyScore)}</b>
          <div class="rank-metric-tooltip"><div class="rmt-label">レガシー — 積み上げた歴史（上限50pt）</div><div class="rmt-text">団体格ベース（自団体0 / S級+50 / A級+30 / B級+15）<br>＋ 殿堂入り盾（★殿堂+8 / ★★ゴールド+10 / ★★★レジェンド+13）<br>＋ 対抗戦通算勝利数 ÷ 5</div></div></div>
        <div class="rank-metric"><span>実績</span><b>${Math.round(r.achievementScore || 0)}</b>
          <div class="rank-metric-tooltip"><div class="rmt-label">実績 — シーズンで勝ち取った勲章とその余韻</div><div class="rmt-text">${_buildAchievementTooltip(r, G.season)}</div></div></div>
      </div>
    </div>`;
  });
  html += '</div></section>';

  // ── 04 シーズン履歴 ──
  // 記録欠落エントリ (showCount/totalRevenue/bestMQ が全て0) は表示から除外
  const _hasValidRecord = (h) => (h.showCount || 0) > 0 || (h.totalRevenue || 0) > 0 || (h.bestMQ || 0) > 0;
  const _validHistory = (G.seasonHistory || []).filter(_hasValidRecord);
  if (_validHistory.length > 0) {
    html += '<section class="section bg-card history-wrap"><div class="section-marker"><div class="text"><div class="kicker">04 — History</div><div class="title">シーズン履歴</div></div></div>';
    html += '<table><thead><tr><th>シーズン</th><th>順位</th><th>興行数</th><th>最高MQ</th><th>収支</th><th>最終資金</th><th>人数</th></tr></thead><tbody>';
    [..._validHistory].reverse().forEach(h => {
      const profit = (h.totalRevenue || 0) - (h.totalExpense || 0);
      const profitClass = profit >= 0 ? 'profit-pos' : 'profit-neg';
      html += `<tr>
        <td>${h.season}年目</td>
        <td class="h-rank-${h.rank}">${h.rank}位</td>
        <td>${h.showCount || 0}</td>
        <td>${h.bestMQ || 0}</td>
        <td class="${profitClass}">${profit >= 0 ? '+' : ''}${Math.round(profit).toLocaleString()}万</td>
        <td>${Math.round(h.funds || 0).toLocaleString()}万</td>
        <td>${h.rosterSize || '-'}</td>
      </tr>`;
    });
    html += '</tbody></table></section>';
  }

  el.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
//  社長室 (Phase 1)
//  見た目だけの骨組み。書類プレースホルダー7枚 + HUD + 壁/机背景
// ══════════════════════════════════════════════════════════

// HUDバー (日付 / 資金 / 決裁印鑑6本)
function renderShachoshitsuHud() {
  // Phase 2: 決裁枠は G.decisionPoints 連動
  const dpMax = G.decisionPointsMax || 6;
  const dp = Math.max(0, Math.min(G.decisionPoints != null ? G.decisionPoints : dpMax, dpMax));
  let hankos = '';
  for (let i = 0; i < dpMax; i++) {
    const cls = i < dp ? 'hanko available' : 'hanko used';
    hankos += `<img class="${cls}" src="../image/shachoshitsu/hanko.webp" alt="決裁枠">`;
  }
  const dateStr = Engine.util.formatDate(G.season, G.week);
  const fundsStr = Math.round(G.funds).toLocaleString();
  return `
    <div class="shachoshitsu-hud">
      <div class="shachoshitsu-hud-left">
        <span class="shachoshitsu-hud-date">${dateStr}</span>
        <span class="shachoshitsu-hud-funds">資金 ${fundsStr}万</span>
      </div>
      <div class="shachoshitsu-hud-right">
        <span class="shachoshitsu-hud-dp-label">決裁枠</span>
        <span class="shachoshitsu-hud-dp-count">⚡${dp}/${dpMax}</span>
        <div class="shachoshitsu-hankos">${hankos}</div>
      </div>
    </div>
  `;
}

// Phase 3: 書類コスト表示フォーマッタ
// unitCost(団体書類) → "15万×人数"
// cost 0    (面談)    → "無料"
// cost null (hireCoach) → "—"(机には並ばないが念のため)
// cost > 0              → "50万"
function _formatShachoshitsuDocCost(doc) {
  if (doc.unitCost) return `${doc.unitCost}万×人数`;
  if (doc.costLabel) return doc.costLabel;  // 動的コスト書類(ボーナス/休暇/招聘)は「—」でなく説明を出す
  if (doc.cost == null) return '—';
  if (doc.cost === 0) return '無料';
  return `${doc.cost}万`;
}

function renderShachoshitsu() {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) return;

  // 交渉中・解雇面談中は専用レンダラーが使うので何もしない
  if (G.weekPhase === 'contractNegotiation') return;
  if (G._releaseInterviewTarget) return;

  const season = Engine.util.getSeasonInfo(G.week).id;

  // タブ状態: ドラフト開催週はスカウトをデフォルトに
  const hasDraft = !!(G.scoutCandidates && G.scoutCandidates.length > 0);
  if (!G._shachoshitsuTab) {
    G._shachoshitsuTab = hasDraft ? 'scout' : 'decision';
  }
  const tab = G._shachoshitsuTab;

  let html = '';
  // ── HUD ──
  html += _renderShachoshitsuHudForTab(tab);
  // ── 内部タブ ──
  const scoutBadge = hasDraft ? '<span class="shachoshitsu-tab-badge">📰</span>' : '';
  const rentalDot = (G.rentals || []).length > 0 ? '<span class="shachoshitsu-tab-dot"></span>' : '';
  html += `<div class="shachoshitsu-tabs">
    <button class="shachoshitsu-tab${tab === 'decision' ? ' active' : ''}" onclick="App.switchShachoshitsuTab('decision')">📋 決裁</button>
    <button class="shachoshitsu-tab${tab === 'scout' ? ' active' : ''}" onclick="App.switchShachoshitsuTab('scout')">🔍 スカウト${scoutBadge}</button>
    <button class="shachoshitsu-tab${tab === 'rental' ? ' active' : ''}" onclick="App.switchShachoshitsuTab('rental')">🤝 レンタル${rentalDot}</button>
  </div>`;
  // ── サマリーバー ──
  html += _renderShachoshitsuSummary(tab);
  // ── 壁 + 窓 ──
  const wallRentalHtml = (tab === 'rental') ? _renderShachoshitsuWallRentals() : '';
  html += `<div class="shachoshitsu-wall" style="background-image:url('../image/shachoshitsu/wall-window-${season}.webp')">${wallRentalHtml}</div>`;
  // ── 机 ──
  html += `<div class="shachoshitsu-desk">`;
  if (tab === 'decision') {
    // 決裁は単一グリッドなのでラッパー不要（既存の margin:0 auto が効く）
    html += _renderShachoshitsuDecisionDesk();
  } else {
    // スカウト・レンタルは複数要素を縦積みするためラッパーで包む
    html += `<div class="shachoshitsu-desk-inner">`;
    if (tab === 'scout') {
      html += _renderShachoshitsuScoutDesk();
    } else if (tab === 'rental') {
      html += _renderShachoshitsuRentalDesk();
    }
    html += `</div>`; // desk-inner
  }
  html += `</div>`; // desk

  el.innerHTML = html;
}

// ── Phase C: タブ別 HUD 右側 ───────────────────────────────────────────────
function _renderShachoshitsuHudForTab(tab) {
  const dateStr = Engine.util.formatDate(G.season, G.week);
  const fundsStr = Math.round(G.funds).toLocaleString();
  let rightHtml = '';
  if (tab === 'decision') {
    const dpMax = G.decisionPointsMax || 6;
    const dp = Math.max(0, Math.min(G.decisionPoints != null ? G.decisionPoints : dpMax, dpMax));
    let hankos = '';
    for (let i = 0; i < dpMax; i++) {
      const cls = i < dp ? 'hanko available' : 'hanko used';
      hankos += `<img class="${cls}" src="../image/shachoshitsu/hanko.webp" alt="決裁枠">`;
    }
    rightHtml = `
      <span class="shachoshitsu-hud-dp-label">決裁枠</span>
      <span class="shachoshitsu-hud-dp-count">⚡${dp}/${dpMax}</span>
      <div class="shachoshitsu-hankos">${hankos}</div>`;
  } else if (tab === 'scout') {
    const ownCount = G.roster.filter(f => !f.isRental).length;
    const rCap = G.rosterCap || 8;
    const visibleFAIds = Engine.util.getVisibleFAIds(G);
    rightHtml = `<span style="font-family:'Noto Sans JP',sans-serif;font-size:12px;color:var(--text-sub)">
      所属 <b style="color:var(--text-main)">${ownCount}/${rCap}名</b>
      <span style="margin:0 6px;opacity:0.4">｜</span>
      紹介枠 <b style="color:var(--text-main)">${visibleFAIds.length}名</b>
    </span>`;
  } else if (tab === 'rental') {
    const activeRentals = G.rentals || [];
    const ownRoster = G.roster.filter(c => !c.isRental);
    const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownRoster.length);
    const remaining = Math.max(0, maxSlots - activeRentals.length);
    rightHtml = `<span style="font-family:'Noto Sans JP',sans-serif;font-size:12px;color:var(--text-sub)">
      レンタル枠 <b style="color:var(--text-main)">${activeRentals.length}/${maxSlots}枠</b>
      <span style="margin:0 6px;opacity:0.4">｜</span>
      残り <b style="color:var(--text-main)">${remaining}枠</b>
    </span>`;
  }
  return `
    <div class="shachoshitsu-hud">
      <div class="shachoshitsu-hud-left">
        <span class="shachoshitsu-hud-date">${dateStr}</span>
        <span class="shachoshitsu-hud-funds">資金 ${fundsStr}万</span>
      </div>
      <div class="shachoshitsu-hud-right">${rightHtml}</div>
    </div>`;
}

// ── Phase C: サマリーバー ────────────────────────────────────────────────────
function _renderShachoshitsuSummary(tab) {
  if (tab === 'decision') {
    const docs = (typeof Engine !== 'undefined' && Engine.shachoshitsu)
      ? Engine.shachoshitsu.getAvailableDocs(G) : [];
    return `<div class="shachoshitsu-summary">案件 <b>${docs.length}件</b></div>`;
  }
  if (tab === 'scout') {
    const ownCount = G.roster.filter(f => !f.isRental).length;
    const rCap = G.rosterCap || 8;
    const visibleFAIds = Engine.util.getVisibleFAIds(G);
    const currentQ = getQuarter(G.week);
    const qLabel = QUARTER_LABELS[currentQ] || '';
    return `<div class="shachoshitsu-summary">所属: <b>${ownCount}/${rCap}名</b> ｜ FA: <b>${G.freeAgents.length}名</b> ｜ 紹介枠: <b>${visibleFAIds.length}名</b>（${qLabel}入替）</div>`;
  }
  if (tab === 'rental') {
    const activeRentals = G.rentals || [];
    const ownRoster = G.roster.filter(c => !c.isRental);
    const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownRoster.length);
    const visibleRentalIds = Engine.util.getVisibleRentalIds(G);
    return `<div class="shachoshitsu-summary">レンタル枠: <b>${activeRentals.length}/${maxSlots}枠</b> ｜ 紹介枠: <b>${visibleRentalIds.length}名</b>（四半期入替）</div>`;
  }
  return '';
}

// ── Phase C: 決裁タブの机上 ──────────────────────────────────────────────────
function _renderShachoshitsuDecisionDesk() {
  let html = '<div class="shachoshitsu-doc-grid">';
  const availableDocs = (typeof Engine !== 'undefined' && Engine.shachoshitsu)
    ? Engine.shachoshitsu.getAvailableDocs(G) : [];

  if (availableDocs.length === 0) {
    const emptyMsg = G.offSeason
      ? 'オフシーズン — 案件なし'
      : '今週は机に並ぶ案件がありません';
    html += `<div class="shachoshitsu-empty-note">${emptyMsg}</div>`;
  } else {
    const doneThisWeek = G._decisionDoneThisWeek || [];
    const docRotation = (docId, week) => {
      let h = (week || 0) * 2654435761;
      for (let i = 0; i < docId.length; i++) h = (h ^ docId.charCodeAt(i)) * 16777619;
      h = Math.abs(h >>> 0);
      return (((h % 601) / 100) - 3).toFixed(2);
    };
    availableDocs.forEach((doc, renderIdx) => {
      const gridCol = (renderIdx % 4) + 1;
      const costDisplay = _formatShachoshitsuDocCost(doc);
      const isApproved = doneThisWeek.includes(doc.id);
      const approvedCls = isApproved ? ' is-approved' : '';
      const clickAttr = isApproved ? '' : ` onclick="App.onShachoshitsuDocClick('${doc.id}')"`;
      // 朱印(決裁済)で無反応な理由を説明する(「クリックできない」報告対策、data-tipでスマホ対応)
      const titleAttr = isApproved ? ` ${_tipAttr('この書類は今週すでに決裁済みです。週を進めるとまた検討できます')}` : '';
      const rot = docRotation(doc.id, G.week);
      html += `
        <div class="shachoshitsu-doc${approvedCls}" data-doc-id="${doc.id}" data-category="${doc.category}" data-col="${gridCol}" style="--doc-rotate:${rot}deg"${clickAttr}${titleAttr}>
          <div class="shachoshitsu-doc-tag">${doc.categoryLabel}</div>
          <div class="shachoshitsu-doc-icon">${doc.icon}</div>
          <div class="shachoshitsu-doc-title">${doc.label}</div>
          <div class="shachoshitsu-doc-body">${doc.body}</div>
          <div class="shachoshitsu-doc-cost">
            <span class="doc-cost-money">${costDisplay}</span>
            <span class="doc-cost-sep">/</span>
            <span class="doc-cost-dp">⚡${doc.decisionCost}</span>
          </div>
          <div class="shachoshitsu-doc-tooltip">
            <div class="tooltip-section">
              <div class="tooltip-label">詳細</div>
              <div class="tooltip-text">${doc.detailText}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">効果</div>
              <div class="tooltip-text">${doc.effectSummary}</div>
            </div>
            <div class="tooltip-section">
              <div class="tooltip-label">使いどころ</div>
              <div class="tooltip-text">${doc.recommendation}</div>
            </div>
          </div>
        </div>
      `;
    });
  }
  html += '</div>'; // doc-grid
  return html;
}

// ── Phase C: スカウトタブの机上 ──────────────────────────────────────────────
function _renderShachoshitsuScoutDesk() {
  // ドラフト開催週: 新聞通知
  const hasDraft = !!(G.scoutCandidates && G.scoutCandidates.length > 0);
  const draftStarted = !!G._draftNegotiationStarted;
  if (hasDraft && !draftStarted) {
    return `<div class="shachoshitsu-draft-notice">
      <div class="headline">📰 ドラフト速報が届いています</div>
      <div class="sub">候補 ${G.scoutCandidates.length}名の調査報告が届きました。<br>ドラフト会場で交渉が始まります。</div>
      <button onclick="showScreen('scoutEvent');Audio.bgm.play('tension')">⚖ ドラフトへ</button>
    </div>`;
  }

  const visibleFAIds = Engine.util.getVisibleFAIds(G);
  const allVisibleFA = [...G.freeAgents]
    .filter(c => visibleFAIds.includes(c.id))
    .sort((a, b) => ov(b) - ov(a));

  // 契約可能→不可の順にソート
  const canNegList = [];
  const cantNegList = [];
  allVisibleFA.forEach(c => {
    if (Engine.scout.canNegotiate(G.orgPop || 0, c, 'fa', G)) canNegList.push(c);
    else cantNegList.push(c);
  });
  const sortedFA = [...canNegList, ...cantNegList];

  if (sortedFA.length === 0) {
    return '<div class="shachoshitsu-empty-note">この四半期の紹介枠にフリーエージェントはいません</div>';
  }

  const PAGE_SIZE = 3;
  const scoutPage = G._shachoshitsuScoutPage || 0;
  const totalPages = Math.ceil(sortedFA.length / PAGE_SIZE);
  const safePage = Math.min(scoutPage, totalPages - 1);
  const pageItems = sortedFA.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const _ownCount = G.roster.filter(f => !f.isRental).length;
  const _rCap = G.rosterCap || 8;
  const _capFull = _ownCount >= _rCap;

  let html = '<div class="shachoshitsu-scout-grid">';
  pageItems.forEach((c, idx) => {
    const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c, 'fa', G);
    const viaTicket = Engine.scout.isEliteTicketRequired(G.orgPop || 0, c, G);
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const unavailCls = canNeg ? '' : ' unavailable';

    // ステータスバー用データ
    const stats = ['pw', 'sp', 'te', 'st', 'mn'];
    const statLabels = { pw: 'PWR', sp: 'SPD', te: 'TEC', st: 'STA', mn: 'MNT' };
    const statColors = { pw: '#e74c3c', sp: '#3498db', te: '#2ecc71', st: '#f39c12', mn: '#9b59b6' };

    // アッパー画像
    const upperUrl = getUpperUrl(c.id);
    const imgTag = upperUrl
      ? `<img class="shachoshitsu-resume-img" src="${upperUrl}" alt="${c.name}">`
      : `<div class="shachoshitsu-resume-img" style="background:rgba(0,0,0,0.08)"></div>`;

    // 契約金・給与
    const signingCost = Math.round(Engine.scout.getSigningCost(c, G.orgPop || 0));
    const salary = getSalary(c);

    // ボタン
    let btnHtml = '';
    // disabledボタンはマウスイベントを発火しないため、data-tipはラッパーspanに付け
    // ボタン側をpointer-events:noneにして理由説明をPCホバー+スマホタップ両対応にする
    const _disBtn = (label, tip) => `<span ${_tipAttr(tip)} style="display:inline-block;cursor:help"><button disabled style="pointer-events:none">${label}</button></span>`;
    if (G.offSeason) {
      btnHtml = _disBtn('⛔ オフシーズン', 'オフシーズン中は契約できません');
    } else if (!canNeg) {
      const tierReq = Engine.scout.getTierConfig(c.assessedTier || 'material');
      btnHtml = _disBtn('⛔ 知名度不足', `団体人気${Engine.util.dispOrgPop(tierReq.reqPop)}以上で交渉可能`);
    } else if (_capFull) {
      btnHtml = _disBtn('⛔ 枠上限', 'ロスター枠が上限です');
    } else {
      btnHtml = `<button class="primary" onclick="event.stopPropagation();showFighterPopup(${c.id},'free')">✒️ 契約交渉</button>`;
    }

    html += `
      <div class="shachoshitsu-resume${unavailCls}" style="animation-delay:${idx * 0.05}s">
        ${!canNeg ? '<div class="shachoshitsu-resume-stamp">契約不可</div>' : ''}
        <div class="shachoshitsu-resume-tags">
          <span class="shachoshitsu-resume-tag source">${viaTicket ? '🎫 特別枠' : 'フリー'}</span>
          <span class="shachoshitsu-resume-tag tier" style="color:${tierCfg.color};border-color:${tierCfg.color}66;background:${tierCfg.color}22">${tierCfg.label}</span>
        </div>
        ${imgTag}
        <div class="shachoshitsu-resume-name">${c.name}</div>
        <div class="shachoshitsu-resume-age">${c.age}歳</div>
        <div class="shachoshitsu-resume-ovr" style="color:${_ovrColor(ov(c)).color}">${ov(c)}<span>OVR</span></div>
        <div class="shachoshitsu-resume-style">
          <span class="badge badge-${c.style}">${c.style}</span>
          <span class="badge badge-${c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral'}">${c.role === 'Babyface' ? 'BF' : c.role === 'Heel' ? 'HL' : 'NT'}</span>
        </div>
        <div class="shachoshitsu-resume-stats">
          ${stats.map(s => {
            const val = c._estimate ? c._estimate[s] : c[s];
            const pct = Math.min(100, Math.max(0, val));
            return `<div class="shachoshitsu-resume-stat">
              <span class="shachoshitsu-resume-stat-label">${statLabels[s]}</span>
              <div class="shachoshitsu-resume-stat-bar"><div class="shachoshitsu-resume-stat-fill" style="width:${pct}%;background:${statColors[s]}"></div></div>
              <span class="shachoshitsu-resume-stat-val">${Math.round(val)}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="shachoshitsu-resume-cost">
          契約金 <b class="signing">${signingCost.toLocaleString()}万</b><br>
          <span class="salary">給与 ${salary}万/週</span>
        </div>
        <div class="shachoshitsu-resume-btns">
          <button onclick="showFighterPopup(${c.id},'free')">📋 詳細</button>
          ${btnHtml}
        </div>
      </div>`;
  });
  html += '</div>'; // scout-grid

  // ページナビ（グリッドの下）
  if (totalPages > 1) {
    html += `<div class="shachoshitsu-page-nav">
      <button class="shachoshitsu-page-btn" onclick="App.shachoshitsuScoutPage(${safePage - 1})" ${safePage <= 0 ? 'disabled' : ''}>◀ 前へ</button>
      <span class="shachoshitsu-page-info">${safePage + 1} / ${totalPages}</span>
      <button class="shachoshitsu-page-btn" onclick="App.shachoshitsuScoutPage(${safePage + 1})" ${safePage >= totalPages - 1 ? 'disabled' : ''}>次へ ▶</button>
    </div>`;
  }

  return html;
}

// ── Phase C: レンタルタブの机上 ──────────────────────────────────────────────
function _renderShachoshitsuRentalDesk() {
  const activeRentals = G.rentals || [];
  const ownRoster = G.roster.filter(c => !c.isRental);
  const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownRoster.length);
  const remainingSlots = Math.max(0, maxSlots - activeRentals.length);

  // オフシーズン
  if (G.offSeason) {
    return '<div class="shachoshitsu-empty-note">オフシーズン中はレンタルできません</div>';
  }
  // 枠上限
  if (remainingSlots <= 0) {
    return '<div class="shachoshitsu-empty-note">レンタル枠が満員です</div>';
  }

  const rentals = Engine.rental.getAvailableRentals(G);
  const visibleRentalIds = Engine.util.getVisibleRentalIds(G);
  const visibleRentals = rentals.filter(r => visibleRentalIds.includes(r.fighter.id));

  if (visibleRentals.length === 0) {
    return '<div class="shachoshitsu-empty-note">レンタル可能な選手がいません</div>';
  }

  // ソート
  const sortDir = window._rentalSortDir || 'asc';
  const sorted = [...visibleRentals].sort((a, b) => {
    return sortDir === 'asc' ? a.fees[1] - b.fees[1] : b.fees[1] - a.fees[1];
  });

  let html = '';
  // ソートボタン
  const arrow = sortDir === 'asc' ? '▲' : '▼';
  html += `<div class="shachoshitsu-rental-sort">
    <span class="sort-label">並び替え:</span>
    <button onclick="window._rentalSortDir=window._rentalSortDir==='asc'?'desc':'asc';renderShachoshitsu()">💰 費用 ${sortDir === 'asc' ? '安い順' : '高い順'} ${arrow}</button>
  </div>`;
  html += '<div class="shachoshitsu-rental-grid">';
  sorted.forEach((r, idx) => {
    const f = r.fighter;
    const srcLabel = r.source === 'rival' ? (r.org?.name || '他団体') : 'フリー';
    const feeFor1 = r.fees[1];
    const selectId = `rentalSeasons_${f.id}`;
    const seasonOpts = [1, 2, 3, 4].map(n => `<option value="${n}">${n}期</option>`).join('');
    const srcLink = r.source === 'rival' ? `ai:${r.org.id}` : 'free';

    html += `
      <div class="shachoshitsu-rental-mini" style="animation-delay:${idx * 0.04}s">
        <div class="shachoshitsu-rental-mini-tag">${srcLabel}</div>
        <div class="shachoshitsu-rental-mini-row">
          ${portraitImg(f.id, 32, '', true)}
          <div>
            <div class="shachoshitsu-rental-mini-name">${f.name}</div>
            <div style="font-size:10px;color:rgba(42,35,24,0.55)">${f.style}</div>
          </div>
          <div class="shachoshitsu-rental-mini-ovr" style="color:${_ovrColor(Engine.util.ov(f)).color}">${Engine.util.ov(f)}<span>OVR</span></div>
        </div>
        <div class="shachoshitsu-rental-mini-fee">
          <b><span id="rentalFee_${f.id}">${feeFor1}</span>万</b>/期
          <select id="${selectId}" onchange="updateRentalFee(${f.id})">
            ${seasonOpts}
          </select>
        </div>
        <button id="rentalBtn_${f.id}" onclick="requestRental(${f.id},'${r.source}','${r.source === 'rival' ? r.org.id : ''}')" ${G.funds >= feeFor1 ? '' : 'disabled'}>🤝 契約</button>
      </div>`;
  });
  html += '</div>'; // rental-grid
  return html;
}

// ── Phase C: 壁上のレンタルミニカード ──────────────────────────────────────────
function _renderShachoshitsuWallRentals() {
  const activeRentals = G.rentals || [];
  if (activeRentals.length === 0) return '';
  let html = '<div class="shachoshitsu-wall-rental-strip">';
  activeRentals.forEach(contract => {
    const rentalF = G.roster.find(c => c.id === contract.fighterId);
    const fromLabel = contract.fromSource === 'rival'
      ? (Engine.rival.getOrgInfo(G.aiOrgs, contract.fromOrgId)?.name || contract.fromOrgId)
      : 'FA';
    html += `<div class="shachoshitsu-wall-rental-card">
      <div class="name">${rentalF ? rentalF.name : '不明'} ← ${fromLabel}</div>
      <div class="meta">残り${contract.weeksLeft}週</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// ─── Phase A: 交渉モード共通テンプレート ───────────────────────────────────────
// wallInnerHtml: 壁背景の上に重ねる要素（選手+吹き出し等）。空文字でも可。
// deskInnerHtml: 机カード内のコンテンツ（金額情報・選択肢等）。
function renderShachoshitsuNegotiation(wallInnerHtml, deskInnerHtml) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) return;

  const season = G.season || 1;
  const fundsStr = Math.round(G.funds).toLocaleString();
  const dateStr = Engine.util.formatDate(G.season, G.week);

  el.innerHTML = `
    <div class="shachoshitsu-hud">
      <div class="shachoshitsu-hud-left">
        <span class="shachoshitsu-hud-date">${dateStr}</span>
        <span class="shachoshitsu-hud-funds">資金 ${fundsStr}万</span>
      </div>
      <div class="shachoshitsu-hud-right">
        <span class="neg-hud-label">📋 シーズン${season} 契約更新</span>
      </div>
    </div>
    <div class="shachoshitsu-wall negotiation-wall" style="background-image:url('../image/shachoshitsu/wall-window-winter.webp')">
      ${wallInnerHtml || ''}
    </div>
    <div class="shachoshitsu-desk">
      <div class="negotiation-card">
        ${deskInnerHtml || ''}
      </div>
    </div>
  `;
}

// ─── Phase B: 解雇面談テンプレート ────────────────────────────────────────────
// fighter: G.roster中のキャラオブジェクト
// dialogue: 性格別別れのセリフ文字列
function renderShachoshitsuReleaseInterview(fighter, dialogue) {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) return;

  const seasonId = Engine.util.getSeasonInfo(G.offSeason ? 48 : G.week).id;
  const fundsStr = Math.round(G.funds).toLocaleString();
  const dateStr = Engine.util.formatDate(G.season, G.week);

  const face = portraitImg(fighter.id, 96, 'negotiation-speaker-portrait');

  const wallHtml = `
    <div class="negotiation-speaker">
      ${face}
      <div class="negotiation-bubble">
        <strong style="font-size:12px;color:rgba(255,255,255,0.55)">${fighter.name}</strong><br>
        「${dialogue}」
      </div>
    </div>`;

  const deskHtml = `
    <div class="neg-card-title">🚪 解雇の確認</div>
    <div class="release-card-fighter-name">${fighter.name}</div>
    <div class="release-card-warning">⚠️ 選手の解雇は取り消せません</div>
    <div class="neg-choices release-choices">
      <button class="neg-btn release-confirm-btn" onclick="App.confirmRelease(${fighter.id})">
        <span>解雇を実行する</span>
      </button>
      <button class="neg-btn release-cancel-btn" onclick="App.cancelReleaseInterview()">
        <span>やっぱりやめる</span>
      </button>
    </div>`;

  el.innerHTML = `
    <div class="shachoshitsu-hud">
      <div class="shachoshitsu-hud-left">
        <span class="shachoshitsu-hud-date">${dateStr}</span>
        <span class="shachoshitsu-hud-funds">資金 ${fundsStr}万</span>
      </div>
      <div class="shachoshitsu-hud-right">
        <span class="neg-hud-label">🚪 解雇面談</span>
      </div>
    </div>
    <div class="shachoshitsu-wall negotiation-wall" style="background-image:url('../image/shachoshitsu/wall-window-${seasonId}.webp')">
      ${wallHtml}
    </div>
    <div class="shachoshitsu-desk">
      <div class="negotiation-card release-interview-card">
        ${deskHtml}
      </div>
    </div>
  `;
}

function renderScout() {
  const el = document.getElementById('scoutContent');
  document.getElementById('faCount').textContent = G.freeAgents.length;
  document.getElementById('rosterCount').textContent = G.roster.length;

  const discount = 0;
  const _ownCount = G.roster.filter(f => !f.isRental).length;
  const _rCap = G.rosterCap || 8;
  const _capFull = _ownCount >= _rCap;
  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">
    所属: <span style="color:var(--text)">${_ownCount}/${_rCap}名${_capFull ? '（上限）' : ''}</span> ｜ フリー: ${G.freeAgents.length}名 ｜ 団体人気: ${Engine.util.dispOrgPop(G.orgPop)}
  </div>
  ${_capFull ? `<div style="padding:8px 12px;background:rgba(200,190,170,0.04);border:1px solid var(--border);border-radius:6px;font-size:13px;color:var(--text-sub);margin-bottom:10px">ロスター枠が上限（${_rCap}名）に達しています。新規契約はできません。</div>` : ''}`;

  // Free agents — compact card list (click name/portrait to open popup with acquire button)
  const visibleFAIds = Engine.util.getVisibleFAIds(G);
  const visibleFA = [...G.freeAgents].filter(c => visibleFAIds.includes(c.id)).sort((a,b) => ov(b) - ov(a));
  const currentQ = getQuarter(G.week);
  const qLabel = QUARTER_LABELS[currentQ] || '';
  html += `<div class="panel-title" style="font-size:13px">フリーエージェント一覧 <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${qLabel}の紹介枠 ${visibleFA.length}/${G.freeAgents.length}名)</span></div>`;
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">💡 紹介枠は四半期ごとに入れ替わります</div>`;
  visibleFA.forEach(c => {
    const STYLE_META = {
      Grappler:{color:'#bb8fce',icon:'GRP'}, Striker:{color:'#e74c3c',icon:'STK'},
      Submission:{color:'#e67e22',icon:'SUB'}, Aerial:{color:'#2ecc71',icon:'AER'},
      Allround:{color:'#f1c40f',icon:'ALL'}, Brawler:{color:'#e88a82',icon:'BRW'}
    };
    const sm = STYLE_META[c.style] || STYLE_META.Allround;
    const roleCls = c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral';
    const roleIcon = c.role === 'Babyface' ? 'BF' : c.role === 'Heel' ? 'HL' : 'NT';
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c, 'fa', G);
    const viaTicket = Engine.scout.isEliteTicketRequired(G.orgPop || 0, c, G);
    const rowOpacity = canNeg ? '' : 'opacity:0.45;';
    html += `<div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:var(--bg-card);border:1px solid ${viaTicket ? 'rgba(241,196,15,0.5)' : 'var(--border)'};border-radius:8px;margin-bottom:8px;${rowOpacity}cursor:pointer" onclick="showFighterPopup(${c.id},'free')">
      ${portraitImg(c.id, 80, '', true)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <span class="flink" style="font-size:17px;font-weight:700">${c.name}</span>
          <span style="font-size:14px;color:var(--text-dim)">${c.age}歳</span>
          <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role==='Babyface'?'ベビーフェイス':c.role==='Heel'?'ヒール':'中立'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;padding:3px 10px;border-radius:4px;background:${tierCfg.color}22;color:${tierCfg.color};border:1px solid ${tierCfg.color}44;font-weight:600">${tierCfg.label}</span>
          ${viaTicket ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(241,196,15,0.2);color:#f1c40f;border:1px solid rgba(241,196,15,0.4);font-weight:600">🎫 特別交渉枠</span>' : ''}
          ${!canNeg ? '<span style="font-size:13px;color:#e74c3c">⛔ 知名度不足</span>' : ''}
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:32px;font-weight:900;color:${_ovrColor(ov(c)).color};line-height:1;font-family:'Bebas Neue',sans-serif;text-shadow:0 0 1px #000,1px 1px 0 rgba(0,0,0,0.6),-1px -1px 0 rgba(0,0,0,0.3)">${ov(c)}<span style="font-size:11px;font-weight:600;color:var(--text-dim);margin-left:2px;text-shadow:none">OVR</span></div>
        <div style="font-size:22px;font-weight:800;color:#c44e8a;margin-top:6px;line-height:1">${Math.round(Engine.scout.getSigningCost(c, G.orgPop || 0)).toLocaleString()}<span style="font-size:11px;font-weight:400;color:var(--text-dim)">万</span></div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:4px">給与 <b style="color:var(--text)">${getSalary(c)}万</b>/週</div>
      </div>
    </div>`;
  });
  if (visibleFA.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:var(--text-dim)">この四半期の紹介枠にフリーエージェントはいません</div>';
  }

  // ── Phase D: Rental Section ──
  const activeRentals = G.rentals || [];
  const ownRoster = G.roster.filter(c => !c.isRental);
  const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownRoster.length);
  const remainingSlots = Math.max(0, maxSlots - activeRentals.length);
  html += `<div class="panel-title" style="font-size:15px;margin-top:18px">🤝 レンタル（${activeRentals.length}/${maxSlots}枠）</div>`;
  // Active rentals display
  if (activeRentals.length > 0) {
    activeRentals.forEach(contract => {
      const rentalF = G.roster.find(c => c.id === contract.fighterId);
      const fromLabel = contract.fromSource === 'rival'
        ? (Engine.rival.getOrgInfo(G.aiOrgs, contract.fromOrgId)?.name || contract.fromOrgId)
        : 'フリーエージェント';
      html += `<div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-size:14px;color:var(--text-main)">${rentalF ? fLink(rentalF, {source:'roster'}) : '不明'}</span>
            <span style="font-size:12px;color:var(--text-sub);margin-left:8px">← ${fromLabel}</span>
          </div>
          <div style="font-size:13px;color:var(--gold)">残り${contract.weeksLeft}週</div>
        </div>
      </div>`;
    });
  }
  // Rental market
  if (G.offSeason) {
    html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">オフシーズン中はレンタルできません</div>';
  } else if (remainingSlots <= 0) {
    html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">レンタル枠が満員です</div>';
  } else {
    const rentals = Engine.rental.getAvailableRentals(G);
    const visibleRentalIds = Engine.util.getVisibleRentalIds(G);
    const visibleRentals = rentals.filter(r => visibleRentalIds.includes(r.fighter.id));
    if (visibleRentals.length === 0) {
      html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">レンタル可能な選手がいません</div>';
    } else {
      // Sort rental candidates
      const sortKey = window._rentalSortKey || 'fee';
      const sortAsc = window._rentalSortAsc != null ? window._rentalSortAsc : true;
      const sorted = [...visibleRentals].sort((a, b) => {
        let va, vb;
        if (sortKey === 'ovr') { va = Engine.util.ov(a.fighter); vb = Engine.util.ov(b.fighter); }
        else if (sortKey === 'fee') { va = a.fees[1]; vb = b.fees[1]; }
        else if (sortKey === 'name') { va = a.fighter.name; vb = b.fighter.name; return sortAsc ? va.localeCompare(vb,'ja') : vb.localeCompare(va,'ja'); }
        else { va = 0; vb = 0; }
        return sortAsc ? va - vb : vb - va;
      });
      const arrow = k => sortKey === k ? (sortAsc ? ' ▲' : ' ▼') : '';
      const thStyle = 'cursor:pointer;user-select:none';
      html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">1〜4期契約（1期=12週） / 前払い一括 / OVR上位${RENTAL_CONFIG.topExclude}名は対象外（団体） ｜ 紹介枠${visibleRentals.length}名（四半期入替）</div>`;
      html += `<div style="overflow-x:auto"><table class="data-table"><tr>
        <th style="${thStyle}" onclick="sortRentalTable('name')">名前${arrow('name')}</th>
        <th>供給元</th><th>Style</th>
        <th style="${thStyle}" onclick="sortRentalTable('ovr')">総合${arrow('ovr')}</th>
        <th>期間</th>
        <th style="${thStyle}" onclick="sortRentalTable('fee')">費用${arrow('fee')}</th>
        <th>交渉</th></tr>`;
      sorted.forEach(r => {
        const srcLabel = r.source === 'rival' ? (r.org?.name || '?') : 'FA';
        const srcLink = r.source === 'rival' ? `ai:${r.org.id}` : 'free';
        const feeFor1 = r.fees[1];
        const selectId = `rentalSeasons_${r.fighter.id}`;
        const seasonOpts = [1,2,3,4].map(n => `<option value="${n}">${n}期(${n*12}週)</option>`).join('');
        html += `<tr>
          <td>${fLink(r.fighter, {source:srcLink})}</td>
          <td style="font-size:13px;color:var(--text-sub)">${srcLabel}</td>
          <td><span class="badge badge-${r.fighter.style}">${r.fighter.style}</span></td>
          <td style="font-size:20px;font-weight:900;color:#f0d048;font-family:'Bebas Neue',sans-serif;text-align:center;text-shadow:0 0 1px #000,1px 1px 0 rgba(0,0,0,0.6)">${Engine.util.ov(r.fighter)}</td>
          <td><select id="${selectId}" onchange="updateRentalFee(${r.fighter.id})" style="font-size:12px;padding:2px 4px;background:var(--card-bg);color:var(--text);border:1px solid var(--border)">${seasonOpts}</select></td>
          <td class="num" style="color:#c44e8a;font-weight:700"><span id="rentalFee_${r.fighter.id}">${feeFor1}</span>万</td>
          <td><button id="rentalBtn_${r.fighter.id}" onclick="requestRental(${r.fighter.id},'${r.source}','${r.source === 'rival' ? r.org.id : ''}')" class="btn btn-sm" style="font-size:12px;padding:4px 10px;background:#5c4a1e;border:1px solid #7a6530;color:#ede8dc" ${G.funds >= feeFor1 ? '' : 'disabled'}>レンタル</button></td>
        </tr>`;
      });
      html += '</table></div>';
    }
  }

  el.innerHTML = html;
}

// ── Draft Candidate List (週刊グラップル ドラフト速報) ──────────────
// draft-negotiation-spec §7.1 / docs/draft-mockup-newspaper-v4.html
function _renderDraftCandidateList(candidates, context) {
  const interests = context.draftInterests || {};
  const maxPicks = context.maxPicks || 4;
  const funds = context.funds || 0;
  const season = context.season || 1;
  const eventType = context.eventType || 'offseason';
  const weekLabel = eventType === 'offseason' ? `シーズン${season} オフ第3週` : `シーズン${season} 第${context.week || '?'}週`;

  // Sort by assessedValue desc
  const sorted = [...candidates].sort((a, b) => (b.assessedValue || 0) - (a.assessedValue || 0));

  // assessedValue 順で紙面ポジション振り分け（ティア問わず純粋に順位）
  const top = sorted.slice(0, 3);                // 1〜3位 → トップ3欄
  const mid = sorted.slice(3, 8);                // 4〜8位 → 有望株欄
  const rest = sorted.slice(8);                   // 9位以降 → その他テーブル

  const TIER_LABELS = { superElite: '超逸材', elite: '逸材', promising: '有望', raw: '原石', material: '素材' };
  const STYLE_JP = { Grappler: 'グラップラー', Striker: 'ストライカー', Submission: 'サブミッション', Aerial: 'エアリアル', Allround: 'オールラウンド', Brawler: 'ブロウラー' };
  const ROLE_JP = { Babyface: 'ベビーフェイス', Heel: 'ヒール', Neutral: '中立' };
  const MARK_DISPLAY = { honmei: { text: '◎', cls: 'mark-bullseye' }, taikou: { text: '○', cls: 'mark-contender' }, osae: { text: '△', cls: 'mark-outside' } };
  const _rOrgName = (id) => (RIVAL_ORGS.find(o => o.id === id) || {}).name || id;
  const ORG_ABBR = { org_s: _rOrgName('org_s').slice(0,3).toUpperCase(), org_a: _rOrgName('org_a').slice(0,3).toUpperCase(), org_b: _rOrgName('org_b').slice(0,3).toUpperCase() };
  const ORG_FULL = { org_s: _rOrgName('org_s'), org_a: _rOrgName('org_a'), org_b: _rOrgName('org_b') };

  function _markHtml(candId, orgId, isFull) {
    const ci = (interests[candId] || []).find(i => i.orgId === orgId);
    if (!ci || !ci.participating) return isFull
      ? `<div class="feat-org-mark mark-none">—</div>`
      : `<span class="short-mark mark-none">—</span>`;
    const m = MARK_DISPLAY[ci.displayMark] || MARK_DISPLAY.osae;
    return isFull
      ? `<div class="feat-org-mark ${m.cls}">${m.text}</div>`
      : `<span class="short-mark ${m.cls}">${m.text}</span>`;
  }

  function _miniStats(c) {
    const est = c._estimate || { pw: c.pw, sp: c.sp, te: c.te, st: c.st, mn: c.mn };
    const stats = [
      { key: 'PWR', val: est.pw || 0 },
      { key: 'SPD', val: est.sp || 0 },
      { key: 'TEC', val: est.te || 0 },
      { key: 'STA', val: est.st || 0 },
      { key: 'MNT', val: est.mn || 0 },
    ];
    return `<div class="draft-mini-stats">${stats.map(s =>
      `<div class="draft-stat-block"><div class="draft-stat-key">${s.key}</div><div class="draft-stat-bar"><div class="draft-stat-bar-fill" style="width:${Math.min(100, s.val)}%"></div></div><div class="draft-stat-num">${s.val}</div></div>`
    ).join('')}</div>`;
  }

  function _scoutComment(c) {
    const tier = c.assessedTier || 'material';
    const STYLE_FLAIR = {
      Grappler: '組み技のセンスが光る', Striker: '打撃の鋭さが際立つ',
      Submission: '関節技に天性の嗅覚がある', Aerial: '空中戦の身のこなしが目を引く',
      Allround: 'バランスの良さが持ち味の', Brawler: '荒々しいファイトが魅力の',
    };
    const flair = STYLE_FLAIR[c.style] || '素質を感じる';
    const comments = {
      superElite: `${c.age}歳にして複数の能力が標準を大きく上回る。${flair}逸材で、今年の業界最大の話題人物。`,
      elite: `${flair}将来性豊かな新人。長期育成で看板選手に化ける可能性を秘めている。`,
      promising: `着実な成長が見込める堅実なタイプ。${flair}。`,
    };
    return comments[tier] || '';
  }

  function _portrait(c, size) {
    const url = typeof getPortraitUrl === 'function' ? getPortraitUrl(c.id) : '';
    const initial = (c.name || '?').charAt(0);
    if (url) {
      return `<img src="${url}" alt="" style="width:${size}px;height:${size}px;border-radius:10px;object-fit:cover;border:2px solid rgba(154,112,32,0.4);box-shadow:0 0 8px rgba(154,112,32,0.2);flex-shrink:0;">`;
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:10px;background:linear-gradient(135deg,#d4c4a0,#b8a07a);border:2px solid rgba(154,112,32,0.4);box-shadow:0 0 8px rgba(154,112,32,0.2);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;font-weight:900;color:#1f1710;flex-shrink:0;">${initial}</div>`;
  }

  // Star selection state
  const selections = G._draftSelections || [];
  function _starBtn(candId, size) {
    const selected = selections.includes(candId);
    const sz = size || 'md';
    const fs = sz === 'lg' ? '24px' : sz === 'sm' ? '18px' : '20px';
    const pad = sz === 'lg' ? '4px 6px' : '3px 5px';
    return `<button class="draft-star-btn${selected ? ' draft-star-on' : ''}" onclick="toggleDraftSelection(${candId})" style="font-size:${fs};padding:${pad};" title="${selected ? '選択解除' : '交渉候補に追加'}">${selected ? '★' : '☆'}</button>`;
  }

  // Find lead headline name (top candidate)
  const leadName = top[0] ? top[0].name : '注目の新人';
  const totalCount = candidates.length;

  let html = '';

  // ── Paper container ──
  html += `<div style="max-width:940px;margin:12px auto;background:linear-gradient(180deg,#f8eed2 0%,#f0e0ba 100%);color:#1f1710;border:1px solid rgba(120,84,39,0.32);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.25);overflow:hidden;">`;

  // ── Title bar ──
  html += `<div style="background:linear-gradient(90deg,#8b1a1a,#c22020);padding:10px 22px;display:flex;align-items:center;justify-content:space-between;">
    <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:2px;">週刊グラップル</div>
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:12px;color:rgba(255,255,255,0.85);font-weight:700;">★ 選択中 <span style="font-size:16px;color:${selections.length >= maxPicks ? '#f08b9e' : '#f0d078'};">${selections.length}</span> / ${maxPicks}名${selections.length >= maxPicks ? ' <span style="font-size:10px;color:#f08b9e;animation:dn-pulse 1.2s infinite;">上限</span>' : ''}</div>
      <div style="font-size:16px;font-weight:900;color:#fff;letter-spacing:1px;">${weekLabel}</div>
    </div>
  </div>`;

  // ── Feature header ──
  html += `<div style="text-align:center;padding:18px 22px 16px;border-bottom:3px double rgba(95,69,35,0.35);">
    <div style="display:inline-block;font-size:11px;letter-spacing:4px;color:#fff;background:#8b1a1a;padding:4px 14px;font-weight:700;margin-bottom:12px;">◆ ドラフト速報 ◆</div>
    <div style="font-size:28px;font-weight:900;color:#1f1710;line-height:1.25;letter-spacing:1px;margin-bottom:8px;">${season + 2024}年度 新人交渉、本日開幕</div>
    <div style="font-size:13px;color:#3a2e1c;line-height:1.7;max-width:640px;margin:0 auto;font-weight:500;">
      若き才能${totalCount}名が業界の門を叩く。${top[0] ? `最大の注目は${top[0].age}歳の${TIER_LABELS[top[0].assessedTier] || '注目株'}・${leadName}。` : ''}複数団体が本気の獲得を狙う。
    </div>
  </div>`;

  // ── TOP 3 Feature Grid ──
  if (top.length > 0) {
    html += `<div style="padding:14px 22px;border-top:1px solid rgba(95,69,35,0.18);">
      <div class="news-sec-label">注目の上位指名候補 — ${top.length}名</div>
      <div style="display:grid;grid-template-columns:${top.length >= 3 ? '1.5fr 1fr 1fr' : top.length === 2 ? '1fr 1fr' : '1fr'};gap:16px;">`;
    top.forEach((c, idx) => {
      const isLead = idx === 0;
      const portraitSize = isLead ? 120 : 80;
      const nameSize = isLead ? '22px' : '17px';
      const tier = TIER_LABELS[c.assessedTier] || c.assessedTier;
      const tierClass = 't-' + (c.assessedTier || 'material');
      const baseCost = c.assessedValue || 0;
      html += `<div style="${idx > 0 ? 'border-left:1px solid rgba(95,69,35,0.18);padding-left:14px;' : ''}">
        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;">
          ${_portrait(c, portraitSize)}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
              <span style="display:inline-block;font-size:9px;letter-spacing:1px;color:#fff;background:#1f1710;padding:1px 7px;font-weight:700;">PICK NO. ${String(idx + 1).padStart(2, '0')}</span>
              ${_starBtn(c.id, 'lg')}
            </div>
            <div style="font-size:${nameSize};font-weight:900;color:#1f1710;line-height:1.2;margin-bottom:5px;">${c.name}</div>
            <div style="font-size:11px;color:#3a2e1c;line-height:1.6;">
              <span class="tier-tag ${tierClass}" style="display:inline-block;font-size:11px;font-weight:900;padding:1px 7px;margin-right:5px;border:1px solid currentColor;border-radius:3px;letter-spacing:0.5px;">${tier}</span>
              ${c.age}歳・${STYLE_JP[c.style] || c.style}${c.role ? '・<strong>' + (ROLE_JP[c.role] || c.role) + '</strong>' : ''}<br>
              推定契約金 <strong>¥${baseCost.toLocaleString()}万</strong>
            </div>
          </div>
        </div>
        ${_miniStats(c)}
        ${_scoutComment(c) ? `<div style="font-size:12px;line-height:1.7;color:#3a2e1c;margin:8px 0 0;padding:8px 12px;background:rgba(200,190,170,0.22);border-radius:6px;border-left:3px solid #9a7020;">
          <div style="font-size:9px;letter-spacing:1px;color:#9a7020;font-weight:700;margin-bottom:3px;">記者の目</div>
          ${_scoutComment(c)}
        </div>` : ''}
        <div style="display:flex;gap:8px;padding:8px 0 0;margin-top:8px;border-top:1px solid rgba(95,69,35,0.12);">
          ${['org_s','org_a','org_b'].map(oid => `<div style="flex:1;text-align:center;padding:2px;">
            <div style="font-size:9px;letter-spacing:0.5px;color:#7a5b32;font-weight:700;margin-bottom:1px;">${ORG_FULL[oid]}</div>
            ${_markHtml(c.id, oid, true)}
          </div>`).join('')}
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // ── MID Grid (有望) ──
  if (mid.length > 0) {
    html += `<div style="padding:14px 22px;border-top:1px solid rgba(95,69,35,0.18);">
      <div style="font-size:11px;letter-spacing:0.15em;color:#6a4a10;font-weight:900;margin-bottom:10px;padding-left:8px;border-left:3px solid #9a7020;">有望株 — 育成価値の高い${mid.length}名</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;">`;
    mid.forEach((c, idx) => {
      const globalIdx = top.length + idx + 1;
      const tier = TIER_LABELS[c.assessedTier] || c.assessedTier;
      const tierClass = 't-' + (c.assessedTier || 'material');
      const baseCost = c.assessedValue || 0;
      const midSelected = selections.includes(c.id);
      html += `<div class="${midSelected ? 'draft-card-selected' : ''}" style="display:flex;gap:12px;padding:10px 0;${idx >= 2 ? 'border-top:1px solid rgba(95,69,35,0.12);' : ''}">
        ${_portrait(c, 56)}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
            <span style="font-size:9px;color:#7a5b32;letter-spacing:0.5px;font-weight:700;">No.${String(globalIdx).padStart(2, '0')}</span>
            <span style="font-size:15px;font-weight:900;color:#1f1710;">${c.name}</span>
            ${_starBtn(c.id, 'md')}
          </div>
          <div style="font-size:10px;line-height:1.5;color:#3a2e1c;margin-bottom:4px;">
            <span class="tier-tag ${tierClass}" style="display:inline-block;font-size:11px;font-weight:900;padding:1px 7px;margin-right:5px;border:1px solid currentColor;border-radius:3px;letter-spacing:0.5px;">${tier}</span>
            ${c.age}歳・${STYLE_JP[c.style] || c.style}${c.role ? '・' + (ROLE_JP[c.role] || c.role) : ''}<br>
            推定契約金 <strong style="color:#1f1710;">¥${baseCost.toLocaleString()}万</strong>
          </div>
          <div style="display:flex;gap:12px;padding-top:4px;border-top:1px dotted rgba(95,69,35,0.18);">
            ${['org_s','org_a','org_b'].map(oid => `<div style="display:flex;align-items:center;gap:3px;font-size:9px;color:#7a5b32;letter-spacing:0.5px;font-weight:700;">
              ${ORG_ABBR[oid]} ${_markHtml(c.id, oid, false)}
            </div>`).join('')}
          </div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // ── Short Table (原石+素材) ──
  if (rest.length > 0) {
    html += `<div style="padding:14px 22px;border-top:1px solid rgba(95,69,35,0.18);">
      <div style="font-size:11px;letter-spacing:0.15em;color:#6a4a10;font-weight:900;margin-bottom:10px;padding-left:8px;border-left:3px solid #9a7020;">その他指名候補 — ${rest.length}名</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr>
          <th style="text-align:left;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:30px;"></th>
          <th style="text-align:left;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:40px;"></th>
          <th style="text-align:left;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);">名前</th>
          <th style="text-align:center;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:32px;">歳</th>
          <th style="text-align:left;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:48px;">分類</th>
          <th style="text-align:center;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:62px;">契約金</th>
          <th style="text-align:center;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:38px;">EMP</th>
          <th style="text-align:center;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:38px;">NOV</th>
          <th style="text-align:center;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:38px;">CRE</th>
          <th style="text-align:center;font-size:9px;letter-spacing:1px;color:#7a5b32;font-weight:700;padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.35);background:rgba(95,69,35,0.06);width:32px;">★</th>
        </tr></thead><tbody>`;
    rest.forEach((c, idx) => {
      const globalIdx = top.length + mid.length + idx + 1;
      const tier = TIER_LABELS[c.assessedTier] || c.assessedTier;
      const tierClass = 't-' + (c.assessedTier || 'material');
      const baseCost = c.assessedValue || 0;
      const rowSelected = selections.includes(c.id);
      html += `<tr class="${rowSelected ? 'draft-row-selected' : ''}">
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;color:#3a2e1c;">${String(globalIdx).padStart(2, '0')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);">${_portrait(c, 32)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);"><span style="font-size:12px;font-weight:900;color:#1f1710;">${c.name}</span><div style="font-size:9px;color:#7a5b32;">${STYLE_JP[c.style] || c.style}</div></td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;color:#1f1710;font-size:13px;">${c.age}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);"><span class="tier-tag ${tierClass}" style="display:inline-block;font-size:11px;font-weight:900;padding:1px 7px;border:1px solid currentColor;border-radius:3px;letter-spacing:0.5px;">${tier}</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;color:#3a2e1c;">¥${baseCost.toLocaleString()}万</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;">${_markHtml(c.id, 'org_s', false)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;">${_markHtml(c.id, 'org_a', false)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;">${_markHtml(c.id, 'org_b', false)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(95,69,35,0.12);text-align:center;background:${rowSelected ? 'rgba(212,168,67,0.1)' : 'rgba(95,69,35,0.04)'};">${_starBtn(c.id, 'sm')}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }

  // ── Footer bar ──
  html += `<div style="margin:0 22px;padding:14px 0 16px;border-top:2px double rgba(95,69,35,0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
    <div style="display:flex;gap:24px;">
      <div style="font-size:9px;letter-spacing:1.5px;color:#7a5b32;font-weight:700;">獲得上限<br><strong style="display:block;font-size:22px;color:#1f1710;letter-spacing:1px;margin-top:1px;font-weight:400;">${maxPicks}名</strong></div>
      <div style="font-size:9px;letter-spacing:1.5px;color:#7a5b32;font-weight:700;">選択中<br><strong style="display:block;font-size:22px;color:${selections.length >= maxPicks ? '#c22020' : '#9a7020'};letter-spacing:1px;margin-top:1px;font-weight:400;">${selections.length} / ${maxPicks}名</strong></div>
      <div style="font-size:9px;letter-spacing:1.5px;color:#7a5b32;font-weight:700;">残資金<br><strong style="display:block;font-size:22px;color:#9a7020;letter-spacing:1px;margin-top:1px;font-weight:400;">¥ ${Math.round(funds).toLocaleString()}万</strong></div>
    </div>
    <button onclick="startDraftNegotiation()" style="font-size:13px;letter-spacing:3px;padding:12px 28px;background:linear-gradient(90deg,${selections.length > 0 ? '#8b1a1a,#c22020' : '#555,#666'});color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;${selections.length === 0 ? 'opacity:0.5;' : ''}">${selections.length > 0 ? `交渉開始（${selections.length}名）→` : '★ 候補を選択してください'}</button>
  </div>`;

  // ── Legend ──
  html += `<div style="padding:10px 22px 16px;font-size:10px;color:#7a5b32;text-align:center;line-height:1.7;border-top:1px solid rgba(95,69,35,0.12);">
    <strong style="font-weight:900;color:#5b4b34;font-size:12px;">◎</strong> 本命 &nbsp;&nbsp;
    <strong style="font-weight:900;color:#5b4b34;font-size:12px;">○</strong> 対抗 &nbsp;&nbsp;
    <strong style="font-weight:900;color:#5b4b34;font-size:12px;">△</strong> 押さえ &nbsp;&nbsp;
    <strong style="font-weight:900;color:#5b4b34;font-size:12px;">—</strong> 興味なし<br>
    各団体の関心は事前情報。実際の交渉では予測と異なる動きを見せることもある。
  </div>`;

  html += `</div>`; // end paper

  return html;
}

// ── Draft Negotiation Screen (交渉画面) ──────────────────────────────
// draft-negotiation-spec §7.2 / docs/draft-mockup-negotiation-C-venue-v3.html
function _renderDraftNegotiation() {
  const dn = G._draftNegotiation;
  if (!dn) return '<div style="text-align:center;padding:60px;color:var(--text-dim)">交渉データがありません</div>';

  const cand = dn.candidate;
  const ns = dn.negState;
  const sorted = dn.sortedCandidates || [];
  const candIdx = dn.currentCandidateIdx || 0;
  const totalCands = sorted.length;
  const maxPicks = dn.maxPicks || 4;
  const acquired = dn.acquiredThisSession || [];

  const TIER_LABELS = { superElite: '超逸材', elite: '逸材', promising: '有望', raw: '原石', material: '素材' };
  const STYLE_JP = { Grappler: 'グラップラー', Striker: 'ストライカー', Submission: 'サブミッション', Aerial: 'エアリアル', Allround: 'オールラウンド', Brawler: 'ブロウラー' };
  const ROLE_JP = { Babyface: 'ベビーフェイス', Heel: 'ヒール', Neutral: '中立' };
  const _orgName = (id) => (RIVAL_ORGS.find(o => o.id === id) || {}).name || id;
  const ORG_META = {
    org_s: { name: _orgName('org_s'), tier: 'S級', emblCls: 'empress', embl: '../image/org/org-s-0.png' },
    org_a: { name: _orgName('org_a'), tier: 'A級', emblCls: 'nova',    embl: '../image/org/org-a-0.png' },
    org_b: { name: _orgName('org_b'), tier: 'B級', emblCls: 'crescent',embl: '../image/org/org-b-0.png' },
  };
  const MARK_DISPLAY = { honmei: { text: '◎', cls: 'dn-mark-bullseye' }, taikou: { text: '○', cls: 'dn-mark-contender' }, osae: { text: '△', cls: 'dn-mark-outside' } };

  // Portrait
  const portUrl = typeof getPortraitUrl === 'function' ? getPortraitUrl(cand.id) : '';
  const initial = (cand.name || '?').charAt(0);
  const portHtml = portUrl
    ? `<img src="${portUrl}" alt="" class="dn-cand-portrait-img">`
    : `<div class="dn-cand-portrait-fallback">${initial}</div>`;

  // Mini stats
  const est = cand._estimate || { pw: cand.pw, sp: cand.sp, te: cand.te, st: cand.st, mn: cand.mn };
  const stats = [
    { key: 'PWR', val: est.pw || 0 }, { key: 'SPD', val: est.sp || 0 },
    { key: 'TEC', val: est.te || 0 }, { key: 'STA', val: est.st || 0 }, { key: 'MNT', val: est.mn || 0 },
  ];
  const miniStatsHtml = `<div class="dn-mini-stats">${stats.map(s =>
    `<div class="dn-sblock"><div class="dn-skey">${s.key}</div><div class="dn-sbar"><div class="dn-sbar-fill" style="width:${Math.min(100,s.val)}%"></div></div><div class="dn-snum">${s.val}</div></div>`
  ).join('')}</div>`;

  const bidRatio = ns.assessedValue > 0 ? (ns.currentBid / ns.assessedValue).toFixed(2) : '1.00';
  const baseCost = cand.assessedValue || 0;

  let html = `<div class="dn-container">`;

  // ── Banner ──
  html += `<div class="dn-banner">
    <img src="../image/draft-header.webp" alt="Draft Conference" class="dn-banner-img" onerror="this.style.display='none'">
    <div class="dn-banner-strip">
      <span>シーズン${G.season || '?'} オフ第${G.offWeek || '?'}週</span>
      <span>ROUND ${String(ns.round || 0).padStart(2, '0')}</span>
    </div>
  </div>`;

  // ── Status strip ──
  html += `<div class="dn-status">
    <div class="dn-status-block"><div class="dn-status-label">獲得</div><div class="dn-status-val">${acquired.length} / ${maxPicks}</div></div>
    <div class="dn-status-block"><div class="dn-status-label">候補</div><div class="dn-status-val">${String(candIdx + 1).padStart(2,'0')} / ${totalCands}</div></div>
    <div class="dn-status-block"><div class="dn-status-label">残資金</div><div class="dn-status-val dn-gold">¥ ${Math.round(G.funds).toLocaleString()}万</div></div>
  </div>`;

  // ── Stage ──
  html += `<div class="dn-stage">
    <div class="dn-eyebrow">交渉中</div>
    <div class="dn-portrait">${portHtml}</div>
    <div class="dn-cand-name">${cand.name}</div>
    <div class="dn-cand-meta">
      <span class="dn-cand-age">${cand.age}</span>
      <span class="dn-tier-badge dn-tier-${cand.assessedTier || 'material'}">${TIER_LABELS[cand.assessedTier] || cand.assessedTier}</span>
      <span class="dn-style-tag">${STYLE_JP[cand.style] || cand.style}${cand.role ? ' · ' + (ROLE_JP[cand.role] || cand.role) : ''}</span>
    </div>
    ${miniStatsHtml}
    <div class="dn-bid-display">
      <div class="dn-bid-label">CURRENT BID</div>
      <div class="dn-bid-amount">¥ ${ns.currentBid.toLocaleString()}万</div>
      <div class="dn-bid-base">推定相場 <strong>¥${baseCost.toLocaleString()}万</strong> · ${bidRatio}×</div>
    </div>
  </div>`;

  // ── Bid cards ──
  html += `<div class="dn-cards-section">
    <div class="dn-cards-label">▎ 入札卓 ▎</div>
    <div class="dn-heat-legend">各カード下部のゲージ＝粘り度（右に行くほど限界に近い）&nbsp;
      <span class="dn-heat-composed">●</span>余裕 &nbsp;
      <span class="dn-heat-steady">●</span>まだ余裕 &nbsp;
      <span class="dn-heat-heated">●</span>熱が入る &nbsp;
      <span class="dn-heat-strained">●</span>限界
    </div>
    <div class="dn-cards">`;

  // AI cards
  for (const orgId of ['org_s', 'org_a', 'org_b']) {
    const om = ORG_META[orgId];
    const interest = ns.interests.find(i => i.orgId === orgId);
    const isParticipating = interest && interest.participating;
    const isDropped = interest && interest.dropped;
    const markKey = interest ? (interest.displayMark || 'osae') : null;
    const mark = markKey ? MARK_DISPLAY[markKey] : null;
    const heat = isParticipating && !isDropped
      ? Engine.draftNegotiation.getHeatInfo(ns.currentBid, interest.obsessionScore)
      : { label: '', labelJp: '', cls: 'dropped', pct: 0 };

    // Is this org the current leader? (highest obsession among active)
    const activeOrgs = ns.interests.filter(i => i.participating && !i.dropped);
    const isLeader = isParticipating && !isDropped && activeOrgs.length > 0 &&
      activeOrgs.reduce((best, cur) => (cur.obsessionScore || 0) > (best.obsessionScore || 0) ? cur : best).orgId === orgId;

    const cardCls = isDropped ? 'dn-card dn-card-dropped' : isLeader ? 'dn-card dn-card-leading' : 'dn-card';

    html += `<div class="${cardCls}">
      <img class="dn-emblem dn-emblem-${om.emblCls}" src="${om.embl}" alt="${om.name}" onerror="this.style.display='none'">
      <div class="dn-card-name">${om.name}</div>
      <div class="dn-card-tier">${om.tier}</div>
      <div class="dn-card-bid-row">
        ${!isParticipating ? '<span class="dn-card-mark dn-mark-none">—</span><span class="dn-card-bid dn-bid-passed">不参加</span>'
        : isDropped ? `<span class="dn-card-mark dn-mark-none">—</span><span class="dn-card-bid dn-bid-passed">PASSED</span>`
        : `<span class="dn-card-mark ${mark ? mark.cls : ''}">${mark ? mark.text : '—'}</span>
           <span class="dn-card-bid${isLeader ? ' dn-bid-lead' : ''}">¥${ns.currentBid.toLocaleString()}万</span>`}
      </div>
      <div class="dn-card-heat-section">
        <div class="dn-card-heat-title">粘り度</div>
        <div class="dn-card-heat"><div class="dn-card-heat-fill dn-heat-${isDropped ? 'dropped' : heat.cls}" style="width:${isDropped ? 0 : heat.pct}%"></div></div>
        <div class="dn-card-heat-label dn-heat-${isDropped ? 'dropped' : heat.cls}">${isDropped ? `R${interest._droppedAtRound || '?'}で離脱` : !isParticipating ? '不参加' : heat.labelJp}</div>
      </div>
    </div>`;
  }

  // Player card
  const playerIcon = (G.playerOrgIcon != null) ? `<img class="dn-emblem dn-emblem-player" src="../image/org/org-player-${G.playerOrgIcon}.png" alt="${G.orgName || 'YOU'}" onerror="this.style.display='none'">` : `<div class="dn-emblem dn-emblem-player" style="display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:var(--gold-light);">${(G.orgName || 'YOU').charAt(0)}</div>`;
  const playerDropped = !ns.playerIn;
  const playerCardCls = playerDropped ? 'dn-card dn-card-dropped dn-card-player' : 'dn-card dn-card-player';
  html += `<div class="${playerCardCls}">
    ${playerIcon}
    <div class="dn-card-name dn-card-name-player">${G.orgName || 'YOU'}</div>
    <div class="dn-card-tier">PLAYER</div>
    <div class="dn-card-bid-row">
      ${playerDropped ? '<span class="dn-card-bid dn-bid-passed">PASSED</span>'
      : `<span class="dn-card-bid">¥${ns.currentBid.toLocaleString()}万</span>`}
    </div>
    <div class="dn-card-heat-section">
      <div class="dn-card-heat-label" style="color:rgba(232,230,224,0.3);margin-top:6px;">${playerDropped ? '離脱済み' : '— あなたの判断 —'}</div>
    </div>
  </div>`;

  html += `</div></div>`; // end cards

  // ── Narration ──
  if (ns.narration) {
    html += `<div class="dn-narration">${ns.narration}</div>`;
  }

  // ── Actions / Observation / Results ──
  if (ns._isSoloConfirm && ns.finished && ns.winner === 'player') {
    // 単独指名確認モード
    html += `<div class="dn-actions" style="text-align:center;">
      <div style="font-size:18px;font-weight:900;color:var(--text-main);margin-bottom:8px;">単独指名 — 競合なし</div>
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:16px;">契約金: ¥${(ns.finalBid || 0).toLocaleString()}万</div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="dn-action-btn dn-action-standard" onclick="draftSoloConfirm(true)">
          <div class="dn-action-label">契約する</div>
        </button>
        <button class="dn-action-btn dn-action-withdraw" onclick="draftSoloConfirm(false)">
          <div class="dn-action-label">見送る</div>
        </button>
      </div>
    </div>`;
  } else if (ns.finished) {
    // 通常の結果表示
    const winnerLabel = ns.winner === 'player' ? (G.orgName || 'あなた') + 'が獲得！'
      : ns.winner ? (ORG_META[ns.winner]?.name || ns.winner) + ' が獲得'
      : '流札（フリー市場へ）';
    html += `<div class="dn-actions" style="text-align:center;">
      <div style="font-size:18px;font-weight:900;color:var(--text-main);margin-bottom:8px;">${winnerLabel}</div>
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:16px;">最終額: ¥${(ns.finalBid || 0).toLocaleString()}万 (R${ns.round})</div>
      <button class="dn-action-btn dn-action-standard" onclick="draftNextCandidate()">
        <div class="dn-action-label">${candIdx + 1 < totalCands ? '次の候補へ →' : '交渉終了'}</div>
      </button>
    </div>`;
  } else if (!ns.playerIn) {
    // プレイヤー降り後 → 結果表示（観戦モード廃止、即座に決着済み）
    const winnerLabel = ns.winner
      ? (RIVAL_ORGS.find(o => o.id === ns.winner)?.name || ns.winner) + ' が獲得'
      : '流札（フリー市場へ）';
    html += `<div class="dn-actions" style="text-align:center;">
      <div style="font-size:18px;font-weight:900;color:var(--text-main);margin-bottom:8px;">${winnerLabel}</div>
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:16px;">最終額: ¥${(ns.finalBid || 0).toLocaleString()}万 (R${ns.round})</div>
      <button class="dn-action-btn dn-action-standard" onclick="draftNextCandidate()">
        <div class="dn-action-label">${candIdx + 1 < totalCands ? '次の候補へ →' : '交渉終了'}</div>
      </button>
    </div>`;
  } else {
    // プレイヤーアクション
    const aggressiveBid = Math.round(ns.currentBid * DRAFT_BID_MUL.aggressive);
    const standardBid = Math.round(ns.currentBid * DRAFT_BID_MUL.standard);
    html += `<div class="dn-actions">
      <button class="dn-action-btn dn-action-aggressive" onclick="draftPlayerAction('aggressive')" title="相手が降りやすくなる。ただし一部の相手には逆効果の場合も">
        <div class="dn-action-label">強気で押す</div>
        <div class="dn-action-detail">→ <strong>¥${aggressiveBid.toLocaleString()}万</strong></div>
        <div class="dn-action-hint">相手の心を揺さぶる</div>
      </button>
      <button class="dn-action-btn dn-action-standard" onclick="draftPlayerAction('standard')" title="通常の入札倍率で金額を上げる">
        <div class="dn-action-label">標準で粘る</div>
        <div class="dn-action-detail">→ <strong>¥${standardBid.toLocaleString()}万</strong></div>
        <div class="dn-action-hint">粘り強く交渉を続ける</div>
      </button>
      <button class="dn-action-btn dn-action-withdraw" onclick="draftPlayerAction('drop')" title="この選手の交渉から離脱する">
        <div class="dn-action-label">ここで降りる</div>
        <div class="dn-action-detail">交渉から離脱</div>
        <div class="dn-action-hint">残りはAI同士で決着</div>
      </button>
    </div>`;
  }

  html += `</div>`; // end container
  return html;
}

// Mini stats CSS (injected once) — draft-negotiation-spec §7.1
(function _injectDraftCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('draft-newspaper-css')) return;
  const style = document.createElement('style');
  style.id = 'draft-newspaper-css';
  style.textContent = `
/* ── Star button (draft candidate selection) ── */
.draft-star-btn { background:none; border:2px solid rgba(154,112,32,0.3); border-radius:6px; cursor:pointer; color:rgba(154,112,32,0.4); transition:all .15s; line-height:1; }
.draft-star-btn:hover { background:rgba(154,112,32,0.08); border-color:rgba(154,112,32,0.6); color:#9a7020; transform:scale(1.1); }
.draft-star-on { color:#9a7020; background:rgba(212,168,67,0.12); border-color:rgba(154,112,32,0.5); filter:drop-shadow(0 0 6px rgba(154,112,32,0.5)); }
.draft-star-on:hover { background:rgba(212,168,67,0.2); }
/* Selected row/card highlight */
.draft-row-selected { background:rgba(212,168,67,0.06) !important; }
.draft-row-selected td:first-child { box-shadow:inset 3px 0 0 #9a7020; }
.draft-card-selected { background:rgba(212,168,67,0.08); border-left:3px solid #9a7020 !important; }
.draft-mini-stats { display:flex; gap:5px; margin-top:8px; padding:7px 0; border-top:1px dashed rgba(95,69,35,0.18); border-bottom:1px dashed rgba(95,69,35,0.18); }
.draft-stat-block { flex:1; text-align:center; }
.draft-stat-key { font-size:8px; letter-spacing:0.5px; color:#7a5b32; font-weight:700; }
.draft-stat-bar { height:4px; background:rgba(95,69,35,0.12); margin:3px 0 1px; border-radius:2px; overflow:hidden; }
.draft-stat-bar-fill { height:100%; background:#5b4b34; border-radius:2px; }
.draft-stat-num { font-size:11px; color:#1f1710; }
.tier-tag { display:inline-block; font-size:11px; font-weight:900; padding:1px 7px; margin-right:5px; border:1px solid currentColor; border-radius:3px; letter-spacing:0.5px; }
.tier-tag.t-superElite { color:#8b1a1a; background:rgba(139,26,26,0.08); }
.tier-tag.t-elite { color:#9a5a10; background:rgba(154,90,16,0.08); }
.tier-tag.t-promising { color:#1f4d80; background:rgba(31,77,128,0.08); }
.tier-tag.t-raw { color:#1a7a50; background:rgba(26,122,80,0.08); }
.tier-tag.t-material { color:#6b5b3a; background:rgba(107,91,58,0.08); }
.mark-bullseye { color:#8b1a1a; font-weight:900; }
.mark-contender { color:#1f4d80; font-weight:900; }
.mark-outside { color:#7a5b32; font-weight:900; }
.mark-none { color:rgba(95,69,35,0.2); font-weight:900; }
.feat-org-mark { font-size:17px; font-weight:900; line-height:1; }
.short-mark { font-size:13px; font-weight:900; }
/* ── Draft Negotiation Screen CSS ── */
.dn-container { max-width:920px; margin:0 auto; background:#0a0a08; color:#e8e6e0; }
.dn-banner { position:relative; width:100%; line-height:0; border-bottom:2px solid #d4a843; }
.dn-banner-img { width:100%; height:auto; display:block; min-height:100px; background:linear-gradient(135deg,#1a1610,#0a0808); }
.dn-banner-strip { position:absolute; top:10px; left:0; right:0; display:flex; justify-content:space-between; padding:0 22px; font-size:10px; letter-spacing:2px; color:rgba(255,255,255,0.85); font-weight:700; text-shadow:0 1px 4px rgba(0,0,0,0.6); pointer-events:none; z-index:2; }
.dn-status { background:#1c1a16; padding:10px 22px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(200,190,170,0.1); }
.dn-status-block { display:flex; align-items:baseline; gap:6px; }
.dn-status-label { font-size:9px; letter-spacing:2px; color:rgba(232,230,224,0.28); font-weight:700; }
.dn-status-val { font-size:16px; color:#e8e6e0; letter-spacing:1px; }
.dn-gold { color:#f0d078; }
.dn-stage { padding:24px 22px 20px; text-align:center; background:radial-gradient(ellipse 50% 60% at 50% 30%,rgba(212,168,67,0.1) 0%,transparent 60%),#14120e; border-bottom:1px solid rgba(200,190,170,0.1); }
.dn-eyebrow { display:inline-flex; align-items:center; gap:12px; font-size:10px; letter-spacing:3px; color:#c41e3a; font-weight:700; margin-bottom:14px; }
.dn-eyebrow::before,.dn-eyebrow::after { content:''; display:block; width:28px; height:1px; background:#c41e3a; }
.dn-portrait { width:150px; height:150px; margin:0 auto 14px; border-radius:50%; background:linear-gradient(135deg,#2a2622,#1a1814); border:4px solid #d4a843; box-shadow:0 0 30px rgba(212,168,67,0.5),0 0 80px rgba(212,168,67,0.2),inset 0 0 30px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.dn-cand-portrait-img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
.dn-cand-portrait-fallback { font-size:80px; font-weight:900; color:#f0d078; }
.dn-cand-name { font-size:28px; font-weight:900; color:#e8e6e0; line-height:1.1; margin-bottom:6px; }
.dn-cand-meta { display:inline-flex; align-items:center; gap:10px; margin-bottom:12px; }
.dn-cand-age { font-size:24px; color:#f0d078; }
.dn-tier-badge { font-size:11px; letter-spacing:1.2px; font-weight:700; padding:3px 10px; border-radius:3px; }
.dn-tier-superElite { background:rgba(196,30,58,0.2); color:#f08b9e; border:1px solid rgba(196,30,58,0.5); }
.dn-tier-elite { background:rgba(243,156,18,0.2); color:#f0c060; border:1px solid rgba(243,156,18,0.5); }
.dn-tier-promising { background:rgba(74,143,212,0.2); color:#80b8e8; border:1px solid rgba(74,143,212,0.5); }
.dn-tier-raw { background:rgba(46,204,113,0.2); color:#70d898; border:1px solid rgba(46,204,113,0.5); }
.dn-tier-material { background:rgba(149,165,166,0.2); color:#b0b8b8; border:1px solid rgba(149,165,166,0.5); }
.dn-style-tag { font-size:11px; letter-spacing:1.5px; color:rgba(232,230,224,0.55); font-weight:700; }
.dn-mini-stats { display:flex; gap:5px; margin:8px auto; max-width:400px; padding:7px 0; border-top:1px dashed rgba(200,190,170,0.1); border-bottom:1px dashed rgba(200,190,170,0.1); }
.dn-sblock { flex:1; text-align:center; }
.dn-skey { font-size:8px; letter-spacing:0.5px; color:rgba(232,230,224,0.28); font-weight:700; }
.dn-sbar { height:4px; background:rgba(232,230,224,0.06); margin:3px 0 1px; border-radius:2px; overflow:hidden; }
.dn-sbar-fill { height:100%; background:rgba(232,230,224,0.4); border-radius:2px; }
.dn-snum { font-size:11px; color:#e8e6e0; }
.dn-bid-display { margin:0 auto; padding:14px 0; border-top:1px solid rgba(200,190,170,0.1); border-bottom:1px solid rgba(200,190,170,0.1); max-width:480px; }
.dn-bid-label { font-size:10px; letter-spacing:3px; color:#d4a843; font-weight:700; margin-bottom:4px; }
.dn-bid-amount { font-size:44px; background:linear-gradient(180deg,#fff 20%,#f0d078); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1; letter-spacing:1px; }
.dn-bid-base { font-size:11px; color:rgba(232,230,224,0.28); margin-top:4px; }
.dn-bid-base strong { color:rgba(232,230,224,0.55); }
.dn-cards-section { background:#1c1a16; padding:24px 22px 20px; border-bottom:1px solid rgba(200,190,170,0.1); }
.dn-cards-label { font-size:10px; letter-spacing:3px; color:#d4a843; font-weight:700; text-align:center; margin-bottom:8px; }
.dn-heat-legend { font-size:9px; color:rgba(232,230,224,0.35); text-align:center; margin-bottom:14px; letter-spacing:0.3px; }
.dn-heat-legend span { background:none !important; }
.dn-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; align-items:end; }
.dn-card { background:#14120e; border:1px solid rgba(200,190,170,0.1); border-radius:8px; padding:16px 12px 14px; text-align:center; position:relative; transition:all .25s; }
.dn-card-leading { border:2px solid #d4a843; background:linear-gradient(180deg,rgba(212,168,67,0.1),#14120e); box-shadow:0 0 24px rgba(212,168,67,0.35); transform:translateY(-12px); padding-top:22px; padding-bottom:18px; }
.dn-card-leading::before { content:'LEAD'; position:absolute; top:-10px; left:50%; transform:translateX(-50%); font-size:9px; letter-spacing:2px; font-weight:700; background:#d4a843; color:#1a1410; padding:3px 10px; border-radius:3px; }
.dn-card-dropped { opacity:0.35; filter:grayscale(0.7); transform:rotate(-2deg); }
.dn-card-player { border:1px solid rgba(212,168,67,0.4); background:rgba(212,168,67,0.04); }
.dn-emblem { width:64px; height:64px; margin:0 auto 10px; display:block; object-fit:contain; border-radius:8px; background:rgba(0,0,0,0.2); }
.dn-emblem-empress { border:2px solid #d4a843; box-shadow:0 0 12px rgba(196,30,58,0.4); }
.dn-emblem-nova { border:2px solid rgba(184,160,238,0.6); box-shadow:0 0 12px rgba(74,143,212,0.4); }
.dn-emblem-crescent { border:2px solid rgba(200,232,212,0.5); box-shadow:0 0 12px rgba(46,204,113,0.4); }
.dn-emblem-player { border:3px solid #d4a843; box-shadow:0 0 16px rgba(212,168,67,0.5); }
.dn-card-name { font-size:16px; letter-spacing:1.5px; color:#e8e6e0; line-height:1; margin-bottom:2px; }
.dn-card-name-player { color:#f0d078; }
.dn-card-tier { font-size:8px; letter-spacing:0.5px; color:rgba(232,230,224,0.28); margin-bottom:8px; }
.dn-card-bid-row { display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:6px; }
.dn-card-mark { font-size:14px; font-weight:900; line-height:1; }
.dn-mark-bullseye { color:#c41e3a; }
.dn-mark-contender { color:#f0d078; }
.dn-mark-outside { color:rgba(232,230,224,0.55); }
.dn-mark-none { color:rgba(232,230,224,0.28); font-size:11px; }
.dn-card-bid { font-size:16px; letter-spacing:0.5px; color:#e8e6e0; }
.dn-bid-lead { background:linear-gradient(180deg,#fff,#f0d078); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.dn-bid-passed { color:rgba(232,230,224,0.28); font-size:12px; }
.dn-card-heat-section { margin-top:8px; padding-top:6px; border-top:1px solid rgba(200,190,170,0.06); }
.dn-card-heat-title { font-size:7px; letter-spacing:1px; color:rgba(232,230,224,0.25); font-weight:700; text-align:center; margin-bottom:3px; }
.dn-card-heat { height:6px; background:rgba(232,230,224,0.12); border-radius:3px; overflow:hidden; border:1px solid rgba(232,230,224,0.08); }
.dn-card-heat-fill { height:100%; border-radius:2px; }
.dn-heat-composed { background:#4a8fd4; color:#4a8fd4; }
.dn-heat-steady { background:#d4a843; color:#d4a843; }
.dn-heat-heated { background:#f39c12; color:#f39c12; }
.dn-heat-strained { background:#c41e3a; color:#c41e3a; animation:dn-pulse 1.4s infinite; }
.dn-heat-desperate { background:#c41e3a; color:#c41e3a; animation:dn-pulse 0.8s infinite; }
.dn-heat-dropped { background:rgba(232,230,224,0.28); color:rgba(232,230,224,0.28); }
@keyframes dn-pulse { 0%,100%{box-shadow:0 0 0 rgba(196,30,58,0.5);} 50%{box-shadow:0 0 12px rgba(196,30,58,0.8);} }
.dn-card-heat-label { font-size:8px; letter-spacing:0.5px; font-weight:700; margin-top:2px; background:none !important; }
.dn-narration { margin:14px 22px 0; padding:11px 16px; background:#14120e; border:1px solid rgba(200,190,170,0.1); border-left:3px solid #c41e3a; border-radius:4px; font-size:12px; color:rgba(232,230,224,0.55); line-height:1.6; font-style:italic; }
.dn-narration::before { content:'— '; color:rgba(232,230,224,0.28); }
.dn-actions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; padding:16px 22px 22px; background:#14120e; }
.dn-action-btn { padding:16px 8px; border-radius:4px; border:1px solid rgba(200,190,170,0.1); background:#1c1a16; cursor:pointer; transition:all .2s; text-align:center; }
.dn-action-btn:hover { transform:translateY(-1px); }
.dn-action-label { font-size:11px; letter-spacing:2px; font-weight:700; margin-bottom:4px; }
.dn-action-detail { font-size:10px; color:rgba(232,230,224,0.55); }
.dn-action-detail strong { font-size:14px; color:#e8e6e0; font-weight:400; letter-spacing:0.5px; }
.dn-action-hint { font-size:8px; color:rgba(232,230,224,0.3); margin-top:4px; letter-spacing:0.3px; }
.dn-action-aggressive { border:1px solid rgba(196,30,58,0.4); background:rgba(196,30,58,0.08); }
.dn-action-aggressive .dn-action-label { color:#f08b9e; }
.dn-action-aggressive:hover { background:rgba(196,30,58,0.16); border-color:#c41e3a; }
.dn-action-standard { border:1px solid rgba(212,168,67,0.35); background:rgba(212,168,67,0.05); }
.dn-action-standard .dn-action-label { color:#f0d078; }
.dn-action-standard:hover { background:rgba(212,168,67,0.12); border-color:#d4a843; }
.dn-action-withdraw .dn-action-label { color:rgba(232,230,224,0.55); }
.dn-action-withdraw:hover { background:rgba(232,230,224,0.04); }
/* ── Dark mode overrides for negotiation screen ── */
.dn-dark-mode { background:#0a0a08 !important; }
.dn-dark-panel { background:#0a0a08 !important; border-color:rgba(200,190,170,0.1) !important; color:#e8e6e0 !important; }
.dn-dark-panel .panel-title { color:#d4a843 !important; border-bottom-color:rgba(200,190,170,0.15) !important; }
  `;
  document.head.appendChild(style);
})();

// ── Scout Event Rendering ─────────────────────────────────
function _draftResultNext() {
  try { Audio.play('click'); } catch(e) {}
  const idx = (G._draftResultIdx || 0) + 1;
  if (idx >= (G._draftResultPages || []).length) {
    G = { ...G, _draftResultPages: null, _draftResultIdx: 0 };
    App.scoutEventFinish();
    return;
  }
  G = { ...G, _draftResultIdx: idx };
  refreshAll();
  _showScreenNoBgm('scoutEvent');
}

function renderScoutEvent() {
  const el = document.getElementById('scoutEventContent');
  if (!el) return;

  // B1+まとめ記事結果ページ表示
  if (G._draftResultPages && G._draftResultPages.length > 0) {
    const pages = G._draftResultPages;
    const idx = G._draftResultIdx || 0;
    const page = pages[idx];
    const isLast = idx >= pages.length - 1;
    const titleEl = document.getElementById('scoutEventTitle');
    if (titleEl) titleEl.textContent = page.title || 'ドラフト結果';
    // ダークテーマをリセット
    const screenEl = document.getElementById('screen-scoutEvent');
    const panelEl = screenEl ? screenEl.querySelector('.panel') : null;
    if (screenEl) screenEl.classList.remove('dn-dark-mode');
    if (panelEl) panelEl.classList.remove('dn-dark-panel');

    let pageHtml = '';
    if (page.html) {
      pageHtml = page.html;
    } else if (page.stories) {
      pageHtml = _renderNewspaperExtraPage(
        G.weeklyNewspaper || { season: G.season, week: G.offWeek || G.week },
        page
      );
    }
    el.innerHTML = pageHtml
      + `<div class="btn-row" style="justify-content:center;margin-top:20px;">
        <button class="btn btn-gold" onclick="_draftResultNext()">${isLast ? '▶ 経営画面へ' : '▶ 次へ進む'}</button>
      </div>`;
    return;
  }

  const candidates = G.scoutCandidates || [];
  const picks = G.scoutPicks || [];
  const maxPicks = G.scoutMaxPicks || 3;
  const discount = 0;
  const orgPop = G.orgPop || 0;
  const eventLabel = 'メインドラフト';

  // 交渉画面 / ドラフト速報 のダーク/クリーム切替
  const screenEl = document.getElementById('screen-scoutEvent');
  const panelEl = screenEl ? screenEl.querySelector('.panel') : null;

  // draft-negotiation-spec: 交渉画面表示（セリ進行中）
  if (G._draftNegotiation) {
    const titleEl = document.getElementById('scoutEventTitle');
    if (titleEl) titleEl.textContent = '⚖ ドラフト交渉';
    // ダークテーマに切替
    if (screenEl) screenEl.classList.add('dn-dark-mode');
    if (panelEl) panelEl.classList.add('dn-dark-panel');
    el.innerHTML = _renderDraftNegotiation();
    return;
  }

  // クリームに戻す
  if (screenEl) screenEl.classList.remove('dn-dark-mode');
  if (panelEl) panelEl.classList.remove('dn-dark-panel');

  // draft-negotiation-spec: ドラフト速報表示（_draftInterests がある場合）
  if (G._draftInterests && !G._draftNegotiationStarted) {
    const titleEl = document.getElementById('scoutEventTitle');
    if (titleEl) titleEl.textContent = '📰 ドラフト速報';
    el.innerHTML = _renderDraftCandidateList(candidates, {
      draftInterests: G._draftInterests,
      maxPicks: G.scoutMaxPicks || 4,
      funds: G.funds,
      season: G.season,
      week: G.week,
      orgPop: G.orgPop || 0,
      eventType: G.scoutEventType || 'offseason',
    });
    return;
  }

  const titleEl = document.getElementById('scoutEventTitle');
  if (titleEl) titleEl.textContent = `🔍 ${eventLabel} — 候補 ${candidates.length}名`;

  const STYLE_META = {
    Grappler:   {color:'#bb8fce',icon:'GRP'}, Striker:    {color:'#e74c3c',icon:'STK'},
    Submission: {color:'#e67e22',icon:'SUB'}, Aerial:     {color:'#2ecc71',icon:'AER'},
    Allround:   {color:'#f1c40f',icon:'ALL'}, Brawler:    {color:'#e88a82',icon:'BRW'}
  };

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">
    <span style="font-size:14px;color:var(--text-sub)">資金: <strong style="color:var(--gold)">${Math.round(G.funds).toLocaleString()}万</strong></span>
    <span style="font-size:14px;color:var(--text-sub)">獲得: <strong style="color:#2ecc71">${picks.length} / ${maxPicks}名</strong></span>
    <span style="font-size:14px;color:var(--text-sub)">団体人気: <strong style="${_scale6Style(_orgPopColor(Engine.util.dispOrgPop(orgPop)))}">${Engine.util.dispOrgPop(orgPop)}</strong></span>
    
  </div>`;

  if (candidates.length === 0) {
    html += '<div style="text-align:center;padding:32px;color:var(--text-dim)">全候補の確認が完了しました</div>';
  }

  candidates.forEach(c => {
    const sm = STYLE_META[c.style] || STYLE_META.Allround;
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const canNeg = Engine.scout.canNegotiate(orgPop, c);
    const roleIcon = c.role === 'Babyface' ? 'BF' : c.role === 'Heel' ? 'HL' : 'NT';
    const est = c._estimate || { pw: c.pw, sp: c.sp, te: c.te, st: c.st, mn: c.mn };
    const estAvg = Math.round((est.pw + est.sp + est.te + est.st + est.mn) / 5);

    html += `<div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:var(--bg-card);border:1px solid ${canNeg ? 'var(--border)' : 'rgba(231,76,60,0.3)'};border-radius:8px;margin-bottom:8px;${!canNeg?'opacity:0.5;':''}cursor:pointer" onclick="showFighterPopup(${c.id},'scout')">
      ${portraitImg(c.id, 80)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <span class="flink" style="font-size:17px;font-weight:700">${c.name}</span>
          <span style="font-size:14px;color:var(--text-dim)">${c.age}歳</span>
          <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role==='Babyface'?'ベビーフェイス':c.role==='Heel'?'ヒール':'中立'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;padding:3px 10px;border-radius:4px;background:${tierCfg.color}22;color:${tierCfg.color};border:1px solid ${tierCfg.color}44;font-weight:600">${tierCfg.label}</span>
          ${c._isSeed ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(241,196,15,0.2);color:#f1c40f;border:1px solid rgba(241,196,15,0.4)">⭐ 注目</span>' : ''}
          ${c._hasCompetition ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(231,76,60,0.15);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">⚔ 競合</span>' : ''}
          ${!canNeg ? '<span style="font-size:13px;color:#e74c3c">⛔ 知名度不足</span>' : ''}
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:28px;font-weight:900;color:var(--gold)">${estAvg}</div>
        <div style="font-size:12px;color:var(--text-dim)">推定OVR</div>
      </div>
    </div>`;
  });

  html += `<div class="btn-row" style="margin-top:16px">
    <button class="btn btn-gold" onclick="scoutFinish()">⚖ ドラフト終了</button>
    <button class="btn btn-blue" onclick="showScreen('week')">← 週画面に戻る</button>
  </div>`;

  el.innerHTML = html;
}

function renderScoutCompetitionModal(cand, baseCost, discount) {
  const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
  const compCost = Math.round(baseCost * (cand._compMultiplier || 1.5));
  const winRate = Math.round((cand._bidWinRate || 0.5) * 100);
  const candId = cand.id;

  const box = document.getElementById('mdlDBox');
  const overlay = document.getElementById('mdlDOverlay');
  if (!box || !overlay) return;

  box.innerHTML = `
    <div class="mdl-d-title urgent">⚔ 他団体との競合発生！</div>
    <div class="mdl-d-speaker">${cand.name} ・ ${tierCfg.label} / ${cand.style} / ${cand.age}歳</div>
    <div class="mdl-d-detail">
      通常契約金: <strong>${baseCost}万</strong> &nbsp;|&nbsp;
      競合上乗せ (×${cand._compMultiplier}): <strong style="color:#ff9080">${compCost}万</strong> &nbsp;|&nbsp;
      通常額勝率: <strong style="color:var(--gold)">${winRate}%</strong>
    </div>
    <div class="mdl-d-actions" style="flex-direction:column;gap:8px">
      <button class="mdl-d-btn primary" onclick="document.getElementById('mdlDOverlay').classList.remove('active');scoutResolve(${candId},'pay')" ${G.funds >= compCost ? '' : 'disabled'}>
        💰 上乗せ確定獲得 (${compCost}万)
      </button>
      <button class="mdl-d-btn secondary" onclick="document.getElementById('mdlDOverlay').classList.remove('active');scoutResolve(${candId},'gamble')">
        🎲 通常額で勝負 (${baseCost}万 / 勝率${winRate}%)
      </button>
      <button class="mdl-d-btn secondary" onclick="document.getElementById('mdlDOverlay').classList.remove('active');scoutResolve(${candId},'skip')">
        ❌ 諦める
      </button>
    </div>
  `;
  box.className = 'mdl-d-box urgent';
  overlay.classList.add('active');
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9B: COACH & SAVE UI (v0.6)                      ║
// ╚══════════════════════════════════════════════════════════╝
function renderCoach() {
  const el = document.getElementById('coachContent');
  if (!el) return;
  const hired = getHiredCoaches();

  // Effect label helper
  const gradeColors = {C:'#888', B:'#2ecc71', A:'var(--gold)'};
  const coachEffectHtml = (c) => {
    const mult = c.gMult || 1.0;
    const abText = (c.abilities||[]).map(a => {
      const cat = COACH_ABILITY_CATALOG[a];
      return cat ? `<span class="coach-trait">${a}</span>` : `<span class="coach-trait">${a}</span>`;
    }).join(' ');
    return `<span class="coach-grade coach-grade-${c.grade}">${c.grade}級</span>
      <span style="font-size:12px;color:var(--gold);font-weight:700">成長×${mult}</span>
      <span class="badge badge-${c.style}" style="font-size:11px;padding:1px 6px">${c.style}</span>
      ${abText}`;
  };

  // Brief effect explanation
  const coachBrief = (c) => (c.abilities||[]).map(a => (COACH_ABILITY_CATALOG[a]||{}).desc||a).join(' / ');

  const maxCoaches = Engine.coach.getMaxCoaches(G);
  const nextCost = Engine.coach.getNextSlotCost(G);
  const slotText = nextCost != null ? `次の枠拡張: ${nextCost}万` : '全枠解放済み';
  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">
    雇用中: ${hired.length}/${maxCoaches}名 ｜ スタッフ給与合計: ${getCoachSalaryTotal()}万/週 ｜ ${slotText}
    ${nextCost != null ? `<button onclick="expandCoachSlot()" style="font-size:11px;padding:2px 8px;margin-left:8px;background:var(--gold);color:#1a1a1a;border:none;border-radius:4px;cursor:pointer;font-weight:700">＋ 枠拡張 (${nextCost}万)</button>` : ''}
    <br><span style="font-size:12px;color:var(--text-dim)">※ 選手のアサインは「🏋️ 育成」画面で行えます ｜ コーチ名タップで詳細</span>
  </div>`;

  // Hired coaches
  if (hired.length > 0) {
    html += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:10px">雇用中のコーチ</div>';
    hired.forEach(c => {
      const assigned = getCoachAssignees(c.id);
      const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);
      html += `<div class="coach-card hired">
        <div class="coach-avatar" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;justify-content:center">${coachPortraitImg(c, 48)}</div>
        <div class="coach-info">
          <div class="coach-name" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-size:15px">${c.name} <span style="font-size:11px;color:var(--text-dim)">ℹ️</span></div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${coachEffectHtml(c)}
            <span style="font-size:12px;color:var(--text-sub)">${coachBrief(c)}</span>
          </div>
          <div style="margin-top:6px;font-size:12px;color:#6a6050">
            給与: <b style="color:#4a4035">${c.salary}万/週</b> ｜ 担当: ${assigned.length}/${COACH_MAX_ASSIGN}名
          </div>`;
      if (assignedChars.length > 0) {
        html += `<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px">`;
        assignedChars.forEach(ch => {
          const sm = getCoachStyleMatch(c, ch);
          const matchIcon = sm.icon ? `<span style="font-weight:700;color:${sm.cls==='specialist'?'#2ecc71':'#f1c40f'};margin-left:2px">${sm.icon}</span>` : '';
          html += `<span class="coach-match-chip ${sm.cls}">${portraitImg(ch.id, 22, '', true)} ${fLink(ch, {source:'roster', size:'12px'})} <strong style="color:var(--gold)">${ov(ch)}</strong>${matchIcon}</span>`;
        });
        html += `</div>`;
      } else {
        html += `<div style="margin-top:5px;font-size:12px;color:var(--text-dim);font-style:italic">└ 担当選手なし</div>`;
      }
      html += `</div>
        <button class="btn btn-red btn-sm" onclick="showConfirm('${c.name}を解任しますか？\\n担当選手のアサインも解除されます','解任',()=>fireCoach(${c.id}))">解任</button>
      </div>`;
    });
  }

  // Available coaches
  const available = G.availableCoaches.map(id => ALL_COACHES.find(c => c.id === id)).filter(Boolean);
  if (available.length > 0) {
    html += '<div style="font-size:14px;font-weight:700;color:var(--text-sub);margin-top:18px;margin-bottom:10px">雇用可能なコーチ</div>';
    // 社長室 Phase 5: 雇用には決裁枠2を消費
    const hireDpCost = (typeof DECISION_DOCS !== 'undefined' && DECISION_DOCS.hireCoach?.decisionCost) || 2;
    const hasDp = (G.decisionPoints || 0) >= hireDpCost;
    available.forEach(c => {
      const fee = c.hireFee || COACH_HIRE_FEE;
      const canHire = G.coaches.length < maxCoaches && G.funds >= fee && hasDp;
      let btnLabel;
      if (canHire) btnLabel = `雇用 (${fee}万 / ⚡${hireDpCost})`;
      else if (G.coaches.length >= maxCoaches) btnLabel = '上限';
      else if (G.funds < fee) btnLabel = '資金不足';
      else btnLabel = `決裁枠不足 (⚡${hireDpCost}必要)`;
      html += `<div class="coach-card">
        <div class="coach-avatar" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;justify-content:center">${coachPortraitImg(c, 48)}</div>
        <div class="coach-info">
          <div class="coach-name" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-size:15px">${c.name} <span style="font-size:11px;color:var(--text-dim)">ℹ️</span></div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${coachEffectHtml(c)}
            <span style="font-size:12px;color:var(--text-sub)">${coachBrief(c)}</span>
          </div>
          <div style="margin-top:5px;font-size:12px;color:#6a6050">雇用費: <b style="color:#4a4035">${fee}万</b> ｜ 給与: <b style="color:#4a4035">${c.salary}万/週</b> ｜ 決裁枠: <b style="color:#c00000">⚡${hireDpCost}</b></div>
        </div>
        <button class="btn btn-sm" style="background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);color:#2ecc71"
          onclick="hireCoach(${c.id})" ${canHire ? '' : 'disabled'}>${btnLabel}</button>
      </div>`;
    });
  }

  el.innerHTML = html;
}

function renderSave() {
  const el = document.getElementById('saveContent');
  if (!el) return;
  let html = '';


  // Autosave info
  if (!window.IS_TRIAL) {
    const autoInfo = getAutoSaveInfo();
    html += '<div style="margin-bottom:16px">';
    html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">⚡ オートセーブ</div>';
    if (autoInfo) {
      html += `<div class="save-slot has-data">
        <div>
          <div class="save-slot-title">オートセーブ</div>
          <div class="save-slot-meta">${Engine.util.formatDate(autoInfo.season, autoInfo.week)} ｜ 資金${Math.round(autoInfo.funds).toLocaleString()}万 ｜ ${new Date(autoInfo.date).toLocaleString('ja-JP')}</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-blue btn-sm" onclick="showConfirm('オートセーブからロードしますか？\\n現在の進行は失われます。','ロード',()=>{loadAutoSave();refreshAll()})">ロード</button>
          <button class="btn btn-sm" style="background:rgba(116,185,255,0.08);color:#74b9ff;border:1px solid rgba(116,185,255,0.25)" onclick="exportSave('auto')">📥 書出</button>
        </div>
      </div>`;
    } else {
      html += '<div class="save-slot"><div class="save-slot-info">オートセーブデータなし（週を進めると自動保存されます）</div></div>';
    }
    html += '</div>';
  }

  // Manual save slots
  const maxSlots = window.IS_TRIAL ? 1 : SAVE_SLOTS;
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">💾 手動セーブスロット</div>';
  for (let i = 1; i <= maxSlots; i++) {
    const info = getSaveInfo(i);
    if (info) {
      const slotTitle = info.name
        ? `${_escapeHtml(info.name)}<span style="font-weight:400;font-size:11px;color:var(--text-dim);margin-left:6px">スロット ${i}</span>`
        : `スロット ${i}`;
      html += `<div class="save-slot has-data">
        <div>
          <div class="save-slot-title">${slotTitle}</div>
          <div class="save-slot-meta">${Engine.util.formatDate(info.season, info.week)} ｜ 資金${Math.round(info.funds).toLocaleString()}万 ｜ 人気${Engine.util.dispOrgPop(info.orgPop)} ｜ 所属${info.rosterSize}名</div>
          <div class="save-slot-meta">${new Date(info.date).toLocaleString('ja-JP')} ｜ v${info.version}</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-gold btn-sm" onclick="showConfirm('スロット${i}に上書きセーブしますか？','セーブ',()=>saveGame(${i}))">セーブ</button>
          <button class="btn btn-blue btn-sm" onclick="showConfirm('スロット${i}からロードしますか？\\n現在の進行は失われます。','ロード',()=>loadGame(${i}))">ロード</button>
          <button class="btn btn-red btn-sm" onclick="showConfirm('スロット${i}のデータを削除しますか？','削除',()=>deleteSave(${i}))">削除</button>
          <button class="btn btn-sm" style="background:rgba(212,168,67,0.08);color:var(--gold-light);border:1px solid rgba(212,168,67,0.25)" onclick="showSaveNameModal(${i})">✏️ 名前</button>
          <button class="btn btn-sm" style="background:rgba(116,185,255,0.08);color:#74b9ff;border:1px solid rgba(116,185,255,0.25)" onclick="exportSave(${i})">📥 書出</button>
        </div>
      </div>`;
    } else {
      html += `<div class="save-slot">
        <div>
          <div class="save-slot-title" style="color:var(--text-dim)">スロット ${i}</div>
          <div class="save-slot-meta">空きスロット</div>
        </div>
        <button class="btn btn-gold btn-sm" onclick="saveGame(${i})">セーブ</button>
      </div>`;
    }
  }
  // セーブデータ注意書き（スロット下）
  html += `<div style="margin-top:18px;padding:14px 16px;background:linear-gradient(135deg,rgba(231,112,85,0.18),rgba(231,112,85,0.10));border:2px solid rgba(231,112,85,0.55);border-radius:8px">
    <div style="font-size:14px;font-weight:900;color:#ff8c6b;margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <span style="font-size:18px">⚠️</span>セーブデータについて必ずお読みください
    </div>
    <div style="font-size:12px;color:#f5e8e0;line-height:1.75">
      このゲームのセーブデータは<span style="color:#ffb59a;font-weight:700">ブラウザのローカルストレージ</span>に保存されます。<br>
      ブラウザのキャッシュクリア・再インストール・プライベートモード終了で<span style="color:#ff7a55;font-weight:700">データが完全に消失</span>します。<br>
      <span style="color:#ffd1bd;font-weight:700">📥 大切なデータは必ず「書出」ボタンでファイルにバックアップしてください。</span>
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,0.25);border-radius:5px;font-size:11px;color:#e0d4cc;line-height:1.7">
      こまめにセーブしましょう。こまめに書き出しセーブもしましょう。
    </div>
  </div>`;

  // 体験版: ロックされたスロット表示
  if (window.IS_TRIAL) {
    for (let i = maxSlots + 1; i <= SAVE_SLOTS; i++) {
      html += `<div class="save-slot" style="opacity:0.5">
        <div>
          <div class="save-slot-title" style="color:var(--text-dim)">🔒 スロット ${i}</div>
          <div class="save-slot-meta">製品版で解放されます</div>
        </div>
      </div>`;
    }
  }

  // Data Transfer section
  html += `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(200,190,170,0.08)">
  <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">📦 データ移行</div>
  <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px;line-height:1.6">
    セーブデータをファイルとして書き出し、別のデバイスやブラウザに移行できます。<br>
    上のスロットの「📥 書出」でファイル保存、下の「読み込む」で復元してください。
  </div>
  <div class="save-slot" style="border-color:rgba(116,185,255,0.2);background:rgba(116,185,255,0.03)">
    <div>
      <div class="save-slot-title" style="color:#74b9ff">📤 ファイルから読み込む</div>
      <div class="save-slot-meta">JSONファイルを選択するとすぐにロードされます</div>
    </div>
    <button class="btn btn-blue btn-sm" onclick="importSave()">ファイルを選択</button>
  </div>
</div>`;

  // Settings: Org name change
  html += `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(200,190,170,0.08)">
    <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">⚙️ 設定</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <label style="color:var(--text-sub);font-size:12px;white-space:nowrap">🏢 団体名:</label>
      <input id="settingsOrgName" type="text" value="${G.orgName || 'プレイヤー団体'}" maxlength="20"
        style="flex:1;max-width:240px;background:rgba(200,190,170,0.08);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:13px;font-weight:700"
        placeholder="団体名を入力">
      <button class="btn btn-gold btn-sm" onclick="const v=document.getElementById('settingsOrgName').value.trim();if(v){G={...G,orgName:v};refreshAll();Audio.play('stamp')}">変更</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
      <label style="color:var(--text-sub);font-size:12px;white-space:nowrap">🛡️ エンブレム:</label>
      <img src="../image/org/org-player-${G.playerOrgIcon ?? 0}.png" width="32" height="32" style="border-radius:4px;vertical-align:middle" alt="">
      <button class="btn btn-sm" style="font-size:11px" onclick="document.getElementById('settingsOrgIconGrid').style.display=document.getElementById('settingsOrgIconGrid').style.display==='none'?'flex':'none';Audio.play('click')">変更</button>
    </div>
    <div id="settingsOrgIconGrid" style="display:none;flex-wrap:wrap;gap:6px;margin-top:8px;margin-left:2px">
      ${(() => {
        const cur = G.playerOrgIcon ?? 0;
        let g = '';
        for (let i = 0; i < 10; i++) {
          const sel = i === cur;
          const border = sel ? '3px solid var(--gold)' : '3px solid transparent';
          const shadow = sel ? '0 0 10px rgba(212,168,67,0.4)' : 'none';
          g += '<img src="../image/org/org-player-' + i + '.png" width="48" height="48" data-idx="' + i + '"' +
            ' style="cursor:pointer;border-radius:6px;border:' + border + ';box-shadow:' + shadow + ';transition:border 0.2s,box-shadow 0.2s"' +
            ' onclick="G={...G,playerOrgIcon:' + i + '};refreshAll();Audio.play(\'stamp\')" alt="">';
        }
        return g;
      })()}
    </div>
  </div>`;

  // Volume controls: BGM / SE master (10-step sliders)
  const bgmMv = Math.round(Audio.bgmMasterVol * 100);
  const sfxMv = Math.round(Audio.sfxMasterVol * 100);
  html += `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(200,190,170,0.08)">
    <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:10px">🔊 音量設定</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <label style="color:var(--text-sub);font-size:12px;white-space:nowrap;min-width:56px">🎵 BGM</label>
      <input type="range" min="0" max="100" step="10" value="${bgmMv}" id="settingsBgmVol"
        style="flex:1;max-width:200px;accent-color:var(--gold)"
        oninput="Audio.setBgmMasterVol(this.value/100);document.getElementById('settingsBgmVal').textContent=this.value+'%'">
      <span id="settingsBgmVal" style="color:var(--gold);font-size:12px;min-width:36px;text-align:right">${bgmMv}%</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <label style="color:var(--text-sub);font-size:12px;white-space:nowrap;min-width:56px">🔊 SE</label>
      <input type="range" min="0" max="100" step="10" value="${sfxMv}" id="settingsSfxVol"
        style="flex:1;max-width:200px;accent-color:var(--gold)"
        oninput="Audio.setSfxMasterVol(this.value/100);document.getElementById('settingsSfxVal').textContent=this.value+'%'">
      <span id="settingsSfxVal" style="color:var(--gold);font-size:12px;min-width:36px;text-align:right">${sfxMv}%</span>
    </div>
  </div>`;

  // New game button
  html += `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(200,190,170,0.08)">
    <button class="btn btn-red" onclick="showConfirm('本当にニューゲームを開始しますか？\\n現在の進行は失われます。','ニューゲーム',()=>{location.reload()})">🔄 ニューゲーム</button>
  </div>`;

  el.innerHTML = html;
}


// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9D: TRAINING HELPERS (roster tab integrated)     ║
// ╚══════════════════════════════════════════════════════════╝

function toggleIntensive(charId) {
  const c = G.roster.find(r => r.id === charId);
  if (!c) return;
  c.intensive = !c.intensive;
  renderWeekScreen();
}

function changeCoachAssign(charId, newCoachId) {
  // §3.5 二重指導なし: 招聘中の選手には雇用コーチを割り当てない(UI側ガードの保険)
  const targetChar = (G.roster || []).find(f => f.id === charId);
  if (targetChar && targetChar._inviteBuff) {
    Audio.play('error');
    alert('外部コーチの招聘期間中は担当コーチを変更できません（終了後に自動で元へ戻ります）');
    return;
  }
  // First unassign from any current coach
  const unassigned = Engine.coach.unassignFromCoach(G, charId);
  if (newCoachId > 0) {
    const { coachAssign, success } = Engine.coach.assignToCoach({ ...G, coachAssign: unassigned }, newCoachId, charId);
    if (!success) { Audio.play('error'); alert('このコーチのアサイン枠が満員です'); return; }
    Audio.play('click');
    G = { ...G, coachAssign };
  } else {
    G = { ...G, coachAssign: unassigned };
  }
  refreshAll();
}

function toggleRosterDetail(charId) {
  const panel = document.getElementById(`roster-detail-${charId}`);
  if (!panel) return;
  const isOpen = _rosterDetailOpenId === charId;
  // Close currently open panel
  if (_rosterDetailOpenId !== null) {
    const prev = document.getElementById(`roster-detail-${_rosterDetailOpenId}`);
    if (prev) { prev.classList.remove('open'); const pc = prev.closest('.rd-card'); if (pc) pc.classList.remove('expanded'); }
    _rosterDetailOpenId = null;
  }
  if (!isOpen) {
    _rosterDetailOpenId = charId;
    panel.classList.add('open');
    const card = panel.closest('.rd-card');
    if (card) card.classList.add('expanded');
  }
}

function getGrowthTendency(charId) {
  const coach = getCharCoach(charId);
  const stats = ['pw','sp','te','st','mn'];
  const labels = {pw:'PW',sp:'SP',te:'TE',st:'ST',mn:'MN'};
  if (!coach) return {text: '均等', arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'eq', arrow: '→'}))};
  return {text: `${coach.grade}級コーチ`, arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'up1', arrow: '↑'}))};
}

function refreshAll() {
  refreshTopBar();
  renderWeekScreen();
  renderRoster();
  renderShowPrep();
  renderFinance();
  renderLog();
  renderCoach();
  renderSave();
  renderRanking();
  renderDatabase();
  // Phase C: 社長室が表示中なら再描画（スカウト/レンタル統合後は refreshAll 経由で更新が必要）
  const shachoshitsuScreen = document.getElementById('screen-shachoshitsu');
  if (shachoshitsuScreen && shachoshitsuScreen.classList.contains('active')) renderShachoshitsu();
  // F2: Show negotiation result popup if pending
  if (G.negotiationResult) {
    setTimeout(() => showNegotiationResult(), 300);
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  DATABASE SCREEN  (v1.0)                                  ║
// ╚══════════════════════════════════════════════════════════╝

let _dbSubTab = 0; // 0=全選手 1=全コーチ 4=相関図 7=派閥(条件付) 3=殿堂 6=年代記 (2/5/8 は 📰新聞タブへ移管)
let _newspaperSubPage = 1; // 1=1面 2=2面 3=3面 (新聞独立タブ用)
let _factionHighlightId = null; // openFactionPanel() から来たハイライト対象（1.5秒後 null 復帰）
let _dbHofFilter = 'all'; // 殿堂フィルタ: all/player/org_s/org_a/org_b
let _dbHofSort = 'season_desc'; // 殿堂ソート: season_desc/points_desc/name
let _dbChronicleIdx = null; // 表示中の章番号 (1-indexed), null=最新章
let _newspaperPage = 0; // 新聞ページ番号（0=通常面, 1+=特集面）
let _newspaperArchiveIdx = -1; // -1=最新号, 0=アーカイブ[0](1つ前), ...
let _dbSortKey = 'ovr';
let _dbSortAsc = false;
let _dbFilterOrg = '';
let _dbFilterStyle = '';
let _dbFilterName = '';
let _dbCoachSortKey = 'grade';
let _dbCoachSortAsc = false;
let _dbCoachFilterGrade = '';
let _dbCoachFilterName = '';
// Phase 6v2: 相関図 state (force-directed network)
// C-4宿題: 絆/因縁バーの説明ティップス(data-tip)。内部変数名(bond/rivalry)は出さず日本語のみ
const _RM_TIP_BOND = '一緒に過ごした時間や共闘で深まる、相手への信頼と親愛。高いほど息が合いやすくなります';
const _RM_TIP_RIVALRY = '対戦の因縁や敵意。高いほど試合が激しくなります';
let _relmapCenterId = null;
let _relmapFilter = 'all';
let _relmapSelected = null;
let _relmapViewMode = 'network'; // 'network' | 'focus' | 'power'
let _relmapMobileStrongOnly = true;
let _relmapMobileSearchTerm = '';
let _relmapFactionCenters = {}; // { factionId: {x, y, keepR} } — Phase 3c 団体フィルタ時の派閥中心
let _relmapFactionOverlay = false; // Phase 3c 団体フィルタ ON 時の派閥オーバーレイ ON/OFF
let _relmapSavedCenterId = null; // 派閥オーバーレイ ON 時に CENTER 選手を退避
let _relmapFilterRelOnly = true;
let _relmapFilterThreshold = 25;
let _relmapFilterUserSet = false; // true once player changes filter manually
let _relmapCompareA = null;
let _relmapCompareB = null;
let _relmapAnimId = null; // requestAnimationFrame id
let _relmapNodes = [];
let _relmapLinks = [];
let _relmapVisibleLinks = [];
let _relmapLinksByNode = {};
let _relmapLinksByPair = {};
let _relmapVisibleNodeHasRivalTitle = {};
let _relmapVisibleNodeConnectedToFocus = {};
let _relmapNodeMap = {};
let _relmapVelocities = [];
let _relmapAlpha = { value: 1.0, decay: 0.0015, min: 0.005 };
let _relmapFrameCount = 0;
let _relmapDragTarget = null;
let _relmapDragOffset = { x: 0, y: 0 };
let _relmapDragMoved = false;
let _relmapCtxTarget = null;
let _relmapFocusTargets = {};
let _relmapW = 0;
let _relmapH = 0;
let _relmapZoom = 1.0;
let _relmapPanX = 0;
let _relmapPanY = 0;
let _relmapPanning = false;
let _relmapOrgCenters = null;
let _relmapOrgFilter = null; // orgId string or null — show only this org's members
let _relmapPanStart = { x: 0, y: 0 };
let _relmapPanStartPan = { x: 0, y: 0 };
const _RELMAP_FOCUS_MAX_CONN = 12;
const _RELMAP_NETWORK_LINK_BUDGET = 110;
const _RELMAP_NETWORK_LINKS_PER_NODE = 4;
const _RELMAP_FILTERED_LINK_BUDGET = 180;

function renderDatabase() {
  // Stop any running relmap animation when switching tabs
  if (_relmapAnimId) { cancelAnimationFrame(_relmapAnimId); _relmapAnimId = null; }

  const el = document.getElementById('databaseContent');
  if (!el) return;
  // Normalize stale _dbSubTab from prior versions where 2/5/8 were valid
  if (_dbSubTab === 2 || _dbSubTab === 5 || _dbSubTab === 8) _dbSubTab = 0;
  // Toggle relmap-active class on panel
  const panel = el.closest('.panel') || el.parentElement;
  if (panel) panel.classList.toggle('relmap-active', _dbSubTab === 4);

  const hasFactions = !!(G.factions && G.factions.length > 0);
  const subTabs = [
    { label: '👤 全選手', idx: 0 },
    { label: '🏋️ 全コーチ', idx: 1 },
    { label: '🔗 相関図', idx: 4 },
    ...(hasFactions ? [{ label: '🎭 派閥', idx: 7 }] : []),
    { label: '🏅 殿堂', idx: 3 },
    { label: '📖 年代記', idx: 6 },
  ];

  let html = `<div class="panel-title">📊 データベース</div>`;
  html += `<div class="db-subtab-bar">`;
  subTabs.forEach(t => {
    html += `<button class="db-subtab-btn${_dbSubTab === t.idx ? ' active' : ''}" onclick="setDbSubTab(${t.idx})">${t.label}</button>`;
  });
  html += `</div>`;
  html += `<div id="dbSubContent">`;
  if (_dbSubTab === 0) html += _renderDbFighters();
  else if (_dbSubTab === 1) html += _renderDbCoaches();
  else if (_dbSubTab === 2) html += _renderDbOrgCompare();
  else if (_dbSubTab === 3) html += _renderDbHallOfFame();
  else if (_dbSubTab === 4) html += _renderDbRelmap();
  else if (_dbSubTab === 5) html += _renderDbNewspaper();
  else if (_dbSubTab === 6) html += _renderDbChronicle();
  else if (_dbSubTab === 7) html += _renderDbFactions();
  else if (_dbSubTab === 8) html += _renderDbRivalry();
  html += `</div>`;

  el.innerHTML = html;

  // 相関図ならマップを描画（DOM挿入後に実行）
  if (_dbSubTab === 4) _drawRelmapAfterRender();
  // 派閥タブのハイライト（openFactionPanel から遷移した場合）
  if (_dbSubTab === 7 && _factionHighlightId != null) {
    const targetId = _factionHighlightId;
    _factionHighlightId = null;
    setTimeout(() => {
      const card = document.getElementById(`faction-card-${targetId}`);
      if (!card) return;
      card.classList.add('faction-highlight');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => card.classList.remove('faction-highlight'), 1500);
    }, 50);
  }
}

function setDbSubTab(idx) {
  _dbSubTab = idx;
  _newspaperPage = 0; // タブ切替時はページリセット
  _newspaperArchiveIdx = -1; // 最新号にリセット
  renderDatabase();
  if (window.matchMedia?.('(max-width: 700px)').matches) {
    requestAnimationFrame(() => {
      const app = document.querySelector('.app');
      const screen = document.getElementById('screen-database');
      if (!app || !screen) return;
      const targetTop = Math.max(0, screen.offsetTop - 8);
      if (typeof app.scrollTo === 'function') app.scrollTo({ top: targetTop, behavior: 'auto' });
      else app.scrollTop = targetTop;
    });
  }
}
function setNewspaperPage(page) {
  _newspaperPage = page;
  renderNewspaper();
}
function setNewspaperArchiveIdx(idx) {
  _newspaperArchiveIdx = idx;
  _newspaperPage = 0; // ページリセット
  renderNewspaper();
}

// ══════════════════════════════════════════════════════════════
// 📰 新聞 独立タブ (v3.0 — モックアップv8 準拠 + タブ独立化)
// renderNewspaper → setNewspaperSubPage で 1面/2面/3面 切替
// ══════════════════════════════════════════════════════════════
function renderNewspaper() {
  const el = document.getElementById('newspaperContent');
  if (!el) return;
  if (![1,2,3,4].includes(_newspaperSubPage)) _newspaperSubPage = 1;

  let html = `<div class="np-outer-tabs">
    <button class="np-tab${_newspaperSubPage === 1 ? ' active' : ''}" onclick="setNewspaperSubPage(1)">📰 1面 興行</button>
    <button class="np-tab${_newspaperSubPage === 2 ? ' active' : ''}" onclick="setNewspaperSubPage(2)">⚔ 2面 団体比較</button>
    <button class="np-tab${_newspaperSubPage === 3 ? ' active' : ''}" onclick="setNewspaperSubPage(3)">🔥 3面 因縁列伝</button>
    <button class="np-tab${_newspaperSubPage === 4 ? ' active' : ''}" onclick="setNewspaperSubPage(4)">📊 4面 MVPレース</button>
  </div>`;

  if (_newspaperSubPage === 1) html += _npRenderPage1();
  else if (_newspaperSubPage === 2) html += _npRenderPage2();
  else if (_newspaperSubPage === 3) html += _npRenderPage3();
  else if (_newspaperSubPage === 4) html += _npRenderPage4();

  el.innerHTML = html;
}
function setNewspaperSubPage(n) {
  _newspaperSubPage = n;
  if (n === 1) { _newspaperPage = 0; _newspaperArchiveIdx = -1; }
  renderNewspaper();
}

// ── 共通ヘルパー ────────────────────────────────────
function _npPaperHeader(seasonNum, weekNum) {
  const today = G.today || `Y${seasonNum} W${weekNum}`;
  return `<div class="np-paper-header">
    <div class="logo">週刊グラップル</div>
    <div class="issue">シーズン${seasonNum} 第${weekNum}週<small>${today}</small></div>
  </div>`;
}
function _npPhotoBg(id) {
  if (!id) return '';
  const url = (typeof getUpperUrl === 'function') ? getUpperUrl(id) : '';
  return url ? `background-image: url('${url}');` : '';
}
// MQ再設計P5補: 一面トップで2名を並び写真にする対象タイプ。
// springTagResult(優勝ペア)とfatedRivals(同年代の逸材2名)が該当。
function _npSpringTagStoryIds(state, story, seasonNum) {
  if (!story || (story.type !== 'springTagResult' && story.type !== 'fatedRivals')) return [];
  const direct = Array.isArray(story.characterIds)
    ? story.characterIds.filter(id => Number.isInteger(id) && id > 0).slice(0, 2)
    : [];
  if (direct.length >= 2) return direct;
  if (story.type !== 'springTagResult') return direct;

  // v1.2以前に生成済みの新聞は優勝ペアIDを保持していないため、
  // 同じシーズンの大会結果またはベストタッグ記録から補完する(springTagResult専用の救済)。
  const league = state.springTagLeague;
  if (league && !league.cancelled && league.announcedSeason === seasonNum) {
    const team = (league.teams || []).find(t => t.orgId === league.champion);
    if (team?.f1Id && team?.f2Id) return [team.f1Id, team.f2Id];
  }
  const best = state.bestTagTeam;
  if (best && best.awardedSeason === seasonNum && best.f1Id && best.f2Id) {
    return [best.f1Id, best.f2Id];
  }
  return direct;
}
function _npTopTagPhotoHtml(ids) {
  if (!Array.isArray(ids) || ids.length < 2) return '';
  const members = ids.slice(0, 2).map((id, idx) => {
    const upper = (typeof getUpperUrl === 'function') ? getUpperUrl(id) : '';
    const portrait = (typeof getPortraitUrl === 'function') ? getPortraitUrl(id) : '';
    const src = upper || portrait;
    if (!src) return '';
    const fighter = ALL_CHARS.find(c => c.id === id);
    return `<div class="np-top-tag-photo-member np-top-tag-photo-member-${idx + 1}" onclick="showFighterPopup(${id})"><img src="${src}" alt="${escHtml(fighter?.name || '')}"></div>`;
  }).join('');
  return members ? `<div class="np-top-tag-photo">${members}</div>` : '';
}
// MQ再設計P4 §5: mqTagRecord の本文｜区切りを段落配列へ展開（前半=記録事実／後半=称賛）
function _npSplitBignewsBody(body) {
  return (body || '').split('｜').map(s => s.trim()).filter(Boolean);
}
// MQ再設計P4 §5: mqTagRecord 専用「上下ぶち抜き大記事」レイアウト。
// springTagResult の優勝ペア写真枠（58%幅・中央重ね）の実装を流用し、全幅フォトバー+2段落本文で描画する。
function _npRenderBignewsTag(state, ts, seasonNum, weekNum) {
  const ids = Array.isArray(ts.characterIds) ? ts.characterIds.slice(0, 2) : [];
  const photoHtml = ids.length >= 2
    ? ids.map((id, idx) => {
        const upper = (typeof getUpperUrl === 'function') ? getUpperUrl(id) : '';
        const portrait = (typeof getPortraitUrl === 'function') ? getPortraitUrl(id) : '';
        const src = upper || portrait;
        if (!src) return '';
        const fighter = ALL_CHARS.find(c => c.id === id);
        return `<div class="np-bignews-photo-member np-bignews-photo-member-${idx + 1}" onclick="showFighterPopup(${id})"><img src="${src}" alt="${escHtml(fighter?.name || '')}"></div>`;
      }).join('')
    : '';
  const tsName = ids.map(id => ALL_CHARS.find(c => c.id === id)?.name || '').filter(Boolean).join(' ＆ ');
  const primaryId = ids[0] || null;
  const tsOrgKey = primaryId ? _npFindFighterOrgKey(state, primaryId) : null;
  const tsOrgName = primaryId ? _findFighterOrgName(state, primaryId) : '';
  const tsOrgEmblem = tsOrgKey ? _npOrgEmblem(state, tsOrgKey, 18) : '';
  const tsOrgLineHtml = (tsOrgEmblem || tsOrgName)
    ? `<div class="np-top-org-line">${tsOrgEmblem}<span>${tsOrgName || ''}</span></div>`
    : '';
  const paragraphs = _npSplitBignewsBody(ts.body);
  const bodyHtml = paragraphs.map((p, idx) =>
    `<p${idx > 0 ? ' class="np-bignews-praise"' : ''}>${p}</p>`).join('');
  return `<article class="np-bignews-tag">
    <div class="np-bignews-photobar">
      ${photoHtml}
      <div class="np-bignews-stamp">EXCLUSIVE</div>
      <div class="np-bignews-caption">${tsOrgLineHtml}<strong>${tsName}</strong>${ts.captionExtra || `${seasonNum}-${weekNum}号 紙面より`}</div>
    </div>
    <div class="np-sec-gold">大ニュース・タッグ歴代最高評価</div>
    ${ts.situation ? `<div class="np-bignews-situation">${ts.situation}</div>` : ''}
    <h2 class="np-bignews-headline">${ts.headline || '——'}</h2>
    <div class="np-bignews-text">${bodyHtml}</div>
  </article>`;
}
function _npThumbBg(id) {
  if (!id) return '';
  const url = (typeof getPortraitUrl === 'function') ? getPortraitUrl(id) : '';
  return url ? `background-image: url('${url}');` : '';
}
function _npClickName(name, id) {
  if (id == null) return name || '';
  return `<a href="javascript:void(0)" onclick="event.stopPropagation();showFighterPopup(${id})" style="color:inherit;text-decoration:none;border-bottom:1px dotted rgba(120,84,39,0.5);">${name || '?'}</a>`;
}
function _npKurodaFaceUrl() {
  return (typeof getNpcPortraitUrl === 'function') ? getNpcPortraitUrl('reporter') : '';
}
// 1ターン=1分30秒換算で「X分Y秒」表記を返す
function _npTurnsToTime(turns) {
  const t = Number(turns) || 0;
  if (t < 1) return '';
  const totalSec = t * 90;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec === 0 ? `${min}分` : `${min}分${sec}秒`;
}
// 黒田の署名・肩書ローテーション (用途別)
const NP_KURODA_BYLINE = {
  news: '——黒田幸子(週刊グラップル)',     // 一面記事/興行寸評
  rating: '——黒田幸子(本紙)',              // 興行総合評価
  editorial: '——黒田幸子(編集部)',          // 編集長コラム/論説
  rivalry: '——黒田幸子(本紙)',              // 因縁列伝
  warRecord: '——黒田幸子(週刊グラップル)',  // 対戦成績寸評
};
function _npStandUrl(id, ovr) {
  if (typeof getStandUrl === 'function') return getStandUrl(id, ovr);
  return '';
}
function _npStandBg(id, ovr) {
  const url = _npStandUrl(id, ovr);
  return url ? `background-image: url('${url}');` : '';
}
function _npOrgEmblem(state, orgId, size = 18) {
  // returns inline img tag for org emblem
  if (!orgId) return '';
  let path = '';
  if (orgId === 'player') {
    path = (typeof Engine !== 'undefined' && Engine.util && Engine.util.getPlayerOrgIconPath) ? Engine.util.getPlayerOrgIconPath(state) : '';
  } else {
    path = (typeof Engine !== 'undefined' && Engine.util && Engine.util.getOrgIconPath) ? Engine.util.getOrgIconPath(state, orgId) : '';
  }
  if (!path) return '';
  return `<img src="${path}" width="${size}" height="${size}" style="vertical-align:middle;border-radius:2px" alt="" loading="lazy">`;
}
/**
 * h2h ペアの「○年来の関係」用の年数を計算。
 * history[0].s（初対戦シーズン）から G.season までの差分。最低1年、最大はキャリア年数の現実的上限。
 * 旧実装は対戦数を年数に換算していたため100試合で25年など破綻していた。
 */
function _npH2HYearsApprox(h2h, state) {
  if (!h2h) return 1;
  const curSeason = state.season || 1;
  let firstSeason = curSeason;
  if (h2h.history && h2h.history.length > 0 && typeof h2h.history[0].s === 'number') {
    firstSeason = h2h.history[0].s;
  } else if (h2h.lastMatch && typeof h2h.lastMatch.season === 'number') {
    // history が無い場合のフォールバック（最後の対戦時季しか分からない）
    firstSeason = h2h.lastMatch.season;
  }
  const diff = Math.max(0, curSeason - firstSeason);
  // 1〜12 年の範囲にクランプ（現実的な選手キャリア内）
  return Math.max(1, Math.min(12, diff + 1));
}

function _npComputeWarRecord(state, rivalOrgId) {
  // h2h を全件走査し、player vs 指定AI団体 の対戦集計
  // 通算は「対抗戦・PPV・挑戦状」の団体間ガチンコ試合のみ。通常興行(show)は除外
  const playerIds = new Set((state.roster || []).map(c => c.id));
  const aiRoster = (state.aiOrgs && state.aiOrgs[rivalOrgId] && state.aiOrgs[rivalOrgId].roster) || [];
  const aiIds = new Set(aiRoster.map(c => c.id));
  const byWar = { w: 0, l: 0, d: 0 };
  const byPpv = { w: 0, l: 0, d: 0 };
  const byB3 = { w: 0, l: 0, d: 0 };
  const recentResults = [];
  Object.entries(state.h2h || {}).forEach(([key, h]) => {
    const [a, b] = key.split('>').map(Number);
    let playerSide = null;
    if (playerIds.has(a) && aiIds.has(b)) playerSide = 'A';
    else if (playerIds.has(b) && aiIds.has(a)) playerSide = 'B';
    if (!playerSide) return;
    if (h.history && h.history.length > 0) {
      h.history.forEach(hh => {
        // 通常興行は団体比較の対象外
        if (hh.st !== 'war' && hh.st !== 'ppv' && hh.st !== 'b3' && hh.st !== 'b3Challenge') return;
        let curSide = null;
        if (hh.oA || hh.oB) {
          // 試合当時の所属で絞り込み
          const aIsPlayer = hh.oA === 'player', bIsPlayer = hh.oB === 'player';
          const aIsRival = hh.oA === rivalOrgId, bIsRival = hh.oB === rivalOrgId;
          if (aIsPlayer && bIsRival) curSide = 'A';
          else if (bIsPlayer && aIsRival) curSide = 'B';
          if (!curSide) return;
        } else {
          // レガシー: 現所属ベース
          curSide = playerSide;
        }
        const cat = hh.st === 'war' ? byWar
          : hh.st === 'ppv' ? byPpv
          : byB3; // b3 / b3Challenge
        if (hh.win === curSide) { cat.w++; recentResults.push({ s: hh.s, w: hh.w, r: 'w' }); }
        else if (hh.win === 'd') { cat.d++; recentResults.push({ s: hh.s, w: hh.w, r: 'd' }); }
        else { cat.l++; recentResults.push({ s: hh.s, w: hh.w, r: 'l' }); }
      });
    }
    // history なしレガシーは war/ppv/b3 区別不能なので集計対象外（通算からも除外）
  });
  const wins = byWar.w + byPpv.w + byB3.w;
  const losses = byWar.l + byPpv.l + byB3.l;
  const draws = byWar.d + byPpv.d + byB3.d;
  // 直近を時系列ソート → 連勝・連敗判定
  recentResults.sort((x, y) => (y.s - x.s) || (y.w - x.w));
  let streakKind = 'even', streak = 0;
  if (recentResults.length > 0) {
    const first = recentResults[0].r;
    if (first === 'w' || first === 'l') {
      let count = 0;
      for (const r of recentResults) {
        if (r.r === first) count++;
        else break;
      }
      if (count >= 2) {
        streakKind = first === 'w' ? 'win' : 'lose';
        streak = count;
      }
    }
  }
  return { wins, losses, draws, total: wins + losses + draws, diff: wins - losses, byWar, byPpv, byB3, streakKind, streak };
}

function _npFindFighterOrgKey(state, charId) {
  // returns 'player' | 'org_s' | 'org_a' | 'org_b' | null
  if ((state.roster || []).some(c => c.id === charId)) return 'player';
  const aiOrgs = state.aiOrgs || {};
  for (const k in aiOrgs) {
    if ((aiOrgs[k].roster || []).some(c => c.id === charId)) return k;
  }
  return null;
}
function _npFindRuntimeFighter(state, id) {
  if (id == null) return null;
  const inRoster = (state.roster || []).find(c => c.id === id);
  if (inRoster) return inRoster;
  const aiOrgs = state.aiOrgs || {};
  for (const k in aiOrgs) {
    const f = (aiOrgs[k].roster || []).find(c => c.id === id);
    if (f) return f;
  }
  const inFA = (state.freeAgents || []).find(c => c.id === id);
  if (inFA) return inFA;
  const inRet = (state.retiredFighters || []).find(c => c.id === id);
  if (inRet) return inRet;
  return null;
}

// ══════════════════════════════════════════════════════════════
// 1面: 興行 (v8 mockup §news)
// ══════════════════════════════════════════════════════════════
function _npRenderPage1() {
  const archive = G.newspaperArchive || [];
  const archiveTotal = archive.length;
  if (_newspaperArchiveIdx >= archiveTotal) _newspaperArchiveIdx = archiveTotal - 1;

  let wp;
  if (_newspaperArchiveIdx < 0) wp = G.weeklyNewspaper;
  else wp = archive[_newspaperArchiveIdx];

  if (!wp) {
    return `<div class="np-paper">
      ${_npPaperHeader(G.season || 1, G.week || 1)}
      <div class="np-content"><div class="np-empty">📰 まだ新聞は届いていない。週を進めると最新号が掲載される。</div></div>
    </div>`;
  }

  const seasonNum = wp.season || G.season || 1;
  const weekNum = wp.week || G.week || 1;

  // バックナンバーナビ
  const isLatest = _newspaperArchiveIdx < 0;
  const canOlder = _newspaperArchiveIdx < archiveTotal - 1;
  const canNewer = !isLatest;
  let archiveNav = '';
  if (archiveTotal > 0) {
    const label = isLatest ? '最新号' : `バックナンバー ${_newspaperArchiveIdx + 1}/${archiveTotal}`;
    archiveNav = `<div class="np-archive-nav">
      ${canNewer ? `<button onclick="setNewspaperArchiveIdx(${_newspaperArchiveIdx - 1})">◀ 次の号</button>` : ''}
      <span class="label">${label}</span>
      ${canOlder ? `<button onclick="setNewspaperArchiveIdx(${isLatest ? 0 : _newspaperArchiveIdx + 1})">前の号 ▶</button>` : ''}
      ${!isLatest ? `<button class="gold" onclick="setNewspaperArchiveIdx(-1)">最新号</button>` : ''}
    </div>`;
  }

  let html = `<div class="np-paper">${_npPaperHeader(seasonNum, weekNum)}${archiveNav}<div class="np-content">`;

  // bankruptcy-redesign v1.1: 危機コラム（最新号のみ・editorial 優先掲載）
  if (isLatest && typeof KURODA_CRISIS !== 'undefined') {
    const tag = G._crisisColumnTag;
    if (tag === 'enter' || tag === 'ongoing' || tag === 'recovered') {
      const pool = KURODA_CRISIS[tag] || [];
      if (pool.length > 0) {
        const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, 0xC715));
        const pick = Engine.rng.pick(rng, pool);
        const orgName = G.orgName || 'プレイヤー団体';
        const weeksRem = Math.max(0, G.crisisWeeksRemaining || 0);
        const headline = (pick.headline || '').replace(/\{orgName\}/g, orgName).replace(/\{weeksRemaining\}/g, String(weeksRem));
        const body = (pick.body || '').replace(/\{orgName\}/g, orgName).replace(/\{weeksRemaining\}/g, String(weeksRem));
        html += `<section class="np-kuroda-crisis" style="background:linear-gradient(180deg,#1a0808 0%,#2a0f0f 100%);border-left:4px solid #aa2020;border-radius:4px;padding:14px 18px;margin-bottom:16px;color:#f4d8d8;box-shadow:0 0 12px rgba(170,30,30,0.25) inset">
          <div style="font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2px;color:#ff8888;margin-bottom:6px;text-transform:uppercase">編集記事 — 黒田幸子</div>
          <h3 style="margin:0 0 8px 0;font-size:18px;color:#ffd6d6;font-weight:700">${headline}</h3>
          <p style="margin:0;font-size:13px;line-height:1.8;white-space:pre-wrap">${body}</p>
          <div style="text-align:right;margin-top:10px;font-size:11px;color:#cc8888">${NP_KURODA_BYLINE.editorial}</div>
        </section>`;
      }
    }
  }

  // 一面記事
  if (wp.topStory && wp.topStory.type === 'mqTagRecord') {
    // MQ再設計P4 §5: タッグ歴代最高評価は上下ぶち抜き大記事の専用レイアウト
    html += _npRenderBignewsTag(G, wp.topStory, seasonNum, weekNum);
  } else if (wp.topStory) {
    const ts = wp.topStory;
    const tagPhotoIds = _npSpringTagStoryIds(G, ts, seasonNum);
    const isTagPhoto = tagPhotoIds.length >= 2;
    const primaryId = tagPhotoIds[0] || ts.characterId || null;
    const photoBg = isTagPhoto ? '' : _npPhotoBg(primaryId);
    const photoIds = isTagPhoto ? tagPhotoIds : (primaryId ? [primaryId] : []);
    const tsName = photoIds.map(id => ALL_CHARS.find(c => c.id === id)?.name || '').filter(Boolean).join(' / ');
    const tsOrgKey = primaryId ? _npFindFighterOrgKey(G, primaryId) : null;
    const tsOrgName = primaryId ? _findFighterOrgName(G, primaryId) : '';
    const tsOrgEmblem = tsOrgKey ? _npOrgEmblem(G, tsOrgKey, 18) : '';
    const tsOrgLineHtml = (tsOrgEmblem || tsOrgName)
      ? `<div class="np-top-org-line">${tsOrgEmblem}<span>${tsOrgName || ''}</span></div>`
      : '';
    html += `<article class="np-top-story">
      <div class="np-top-photo${isTagPhoto ? ' np-top-photo--tag' : ''}" style="${photoBg}">
        ${isTagPhoto ? _npTopTagPhotoHtml(tagPhotoIds) : ''}
        ${primaryId ? `<div class="stamp">EXCLUSIVE</div>` : ''}
        ${primaryId ? `<div class="caption">${tsOrgLineHtml}<strong>${tsName}</strong>${ts.captionExtra || `${seasonNum}-${weekNum}号 紙面より`}</div>` : ''}
      </div>
      <div class="np-top-body">
        <div class="np-sec">一面記事</div>
        ${ts.situation ? `<div class="np-top-situation">${ts.situation}</div>` : ''}
        <h2 class="np-top-headline">${ts.headline || '——'}</h2>
        ${ts.subhead ? `<div class="np-top-sub">${ts.subhead}</div>` : ''}
        <div class="np-top-text"><p>${ts.body || ''}</p></div>
      </div>
    </article>`;

    // 一面が他団体ニュースのとき黒田寸評
    const isPlayerStory = ts.type === 'playerShowTitle' || ts.type === 'playerShowNormal';
    if (!isPlayerStory) {
      const pool = (typeof _getKurodaNewsComment === 'function') ? _getKurodaNewsComment(ts.type) : [];
      if (pool.length > 0) {
        const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, 0xC0DA));
        const fn = Engine.rng.pick(rng, pool);
        let txt = '';
        try { txt = fn({ headline: ts.headline, orgName: '' }); } catch(e) {}
        if (txt) {
          html += `<div class="np-kuroda" style="margin-bottom:14px">
            <div class="np-kuroda-face" style="background-image:url('${_npKurodaFaceUrl()}')"></div>
            <div><div class="np-kuroda-text">「${txt}」</div><div class="np-kuroda-byline">${NP_KURODA_BYLINE.news}</div></div>
          </div>`;
        }
      }
    }
  }

  // 自団体興行結果
  // 一面トップが自団体興行（同じメイン試合）の場合、興行結果セクションのメインを
  // 第2試合に差し替えてダイジェストも繰り上げる（同じ試合を二度語らない）
  if (wp.playerShowData) {
    const ts = wp.topStory;
    const topIsPlayerShow = ts && (ts.type === 'playerShowTitle' || ts.type === 'playerShowNormal');
    const psd = topIsPlayerShow ? _npSwapMainToSecondCard(wp.playerShowData, seasonNum, weekNum) : wp.playerShowData;
    if (psd) html += _npRenderPlayerShow(psd, seasonNum, weekNum);
  }

  // 業界ニュース (常に表示、空時はプレースホルダー)
  html += `<section class="np-sub-stories">
    <div class="np-sec-gold">業界ニュース</div>`;
  if (wp.subStories && wp.subStories.length > 0) {
    html += `<div class="np-sub-grid">`;
    wp.subStories.forEach((ss, idx) => {
      const photoBg = _npPhotoBg(ss.characterId);
      const sitTag = ss.situation
        ? `<div class="np-sub-situation">${ss.situation}</div>`
        : '';
      const ssOrgKey = ss.characterId ? _npFindFighterOrgKey(G, ss.characterId) : null;
      const ssOrgName = ss.characterId ? _findFighterOrgName(G, ss.characterId) : '';
      const ssOrgEmblem = ssOrgKey ? _npOrgEmblem(G, ssOrgKey, 14) : '';
      const ssOrgLineHtml = (ssOrgEmblem || ssOrgName)
        ? `<div class="np-sub-org-line">${ssOrgEmblem}<span>${ssOrgName || ''}</span></div>`
        : '';
      html += `<div class="np-sub">
        <div class="np-sub-photo" style="${photoBg}" ${ss.characterId ? `onclick="showFighterPopup(${ss.characterId})"` : ''}></div>
        <div style="flex:1;min-width:0">
          ${sitTag}
          ${ssOrgLineHtml}
          <div class="np-sub-headline">${ss.headline || ''}</div>
          <div class="np-sub-text">${ss.body || ''}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
    // 他団体ニュースまとめの黒田寸評(1個)
    const ss = wp.subStories[0];
    const pool = (typeof _getKurodaNewsComment === 'function') ? _getKurodaNewsComment(ss.type) : [];
    if (pool.length > 0) {
      const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, 0xC0DC));
      const fn = Engine.rng.pick(rng, pool);
      let txt = '';
      try { txt = fn({ headline: ss.headline, orgName: '' }); } catch(e) {}
      if (txt) {
        html += `<div class="np-kuroda">
          <div class="np-kuroda-face" style="background-image:url('${_npKurodaFaceUrl()}')"></div>
          <div><div class="np-kuroda-text">「${txt}」</div><div class="np-kuroda-byline">${NP_KURODA_BYLINE.news}</div></div>
        </div>`;
      }
    }
  } else {
    html += `<div class="np-empty-substory">今週は業界動向の特筆事項なし。<br>業界全体が静かに次の展開を待っている。</div>`;
  }
  html += `</section>`;

  html += `</div></div>`;
  return html;
}

/**
 * 一面トップ記事と興行メインが同じ試合になるとき、第2試合をメイン枠に繰り上げ、
 * 元のメイン試合は ダイジェスト1段目（旧 allMatches[0] の位置）に押し下げる。
 * 双方の試合を消さず、順序だけ入れ替えるイメージ。
 * 繰り上げた試合には簡易記事を生成して空欄を埋める。
 */
function _npSwapMainToSecondCard(d, seasonNum, weekNum) {
  if (!d || !d.allMatches || d.allMatches.length === 0) return d;
  const m = d.allMatches[0];
  if (!m || !m.left || !m.right) return d;

  // 元メインを ダイジェスト1段目に押し下げるためのエントリへ変換
  const origMainAsRow = {
    left: d.left,
    right: d.right,
    winner: (d.winner && d.winner.id) ? (d.winner.id === d.left.id ? 'left' : (d.winner.id === d.right.id ? 'right' : null)) : (typeof d.winner === 'string' ? d.winner : null),
    isDraw: !!d.isDraw,
    isTitleMatch: !!d.isTitleMatch,
    isUpset: !!d.isUpset,
    isDominant: !!d.isDominant,
    mq: d.mq,
    turns: d.turns,
    finishLabel: d.finishLabel || '',
  };

  // 繰り上げ試合の長文記事を生成（メインと同じ App._NEWSPAPER_ARTICLES プールから seeded pick）
  const winnerObj = m.isDraw ? null
    : m.winner === 'left' ? m.left
    : m.winner === 'right' ? m.right
    : null;
  const loserObj = m.isDraw ? null
    : m.winner === 'left' ? m.right
    : m.winner === 'right' ? m.left
    : null;
  const winnerName = winnerObj ? winnerObj.name : null;
  const loserName = loserObj ? loserObj.name : null;
  let promotedArticle = '';
  const promotedSeed = Engine.rng.derive(seasonNum || 1, weekNum || 1, m.left.id || 0, 0xC6A1);
  const promotedRng = Engine.rng.create(promotedSeed);
  // dContext: メイン記事用と同じ形でフィールドを揃える
  const promotedCtx = {
    isDraw: !!m.isDraw,
    winner: winnerObj,
    loser: loserObj,
    left: m.left,
    right: m.right,
    isTitleMatch: !!m.isTitleMatch,
    isUpset: !!m.isUpset,
    isDominant: !!m.isDominant,
    finishLabel: m.finishLabel || '決着',
    turns: m.turns || 0,
    mq: m.mq || 0,
    venue: { name: d.venueName || (VENUES[d.venueIdx]?.name) || '会場' },
    attendance: d.attendance || 0,
    showName: d.showName || '定期興行',
    rivalLabel: '宿命のカード',
    ovrGap: Math.abs((m.left.ovr || 0) - (m.right.ovr || 0)),
  };
  // カテゴリ選択（メインと重複しないよう titleWin/titleDefend は使わず、汎用記事プールから選ぶ）
  let promotedCat;
  if (m.isDraw) promotedCat = 'draw';
  else if ((m.mq || 0) >= 90) promotedCat = 'superMQ';
  else if (m.isUpset) promotedCat = 'upset';
  else if (m.isDominant) promotedCat = 'dominant';
  else if ((m.mq || 0) >= 75) promotedCat = 'closeMQ';
  else promotedCat = 'normal';
  const ART = (typeof App !== 'undefined' && App._NEWSPAPER_ARTICLES) ? App._NEWSPAPER_ARTICLES : null;
  if (ART) {
    const pool = ART[promotedCat] || ART.normal || [];
    if (pool.length > 0) {
      const fn = Engine.rng.pick(promotedRng, pool);
      try { promotedArticle = fn(promotedCtx); } catch(e) { promotedArticle = ''; }
    }
    // 低MQ追記
    if (promotedArticle && (m.mq || 0) < 40 && ART.lowMQ) {
      try { promotedArticle = Engine.rng.pick(promotedRng, ART.lowMQ)(promotedCtx); } catch(e) {}
    }
  }
  if (!promotedArticle) {
    // フォールバックも長めに
    if (m.isDraw) {
      promotedArticle = `${m.left.name}と${m.right.name}、${m.turns || '?'}ターンの攻防は決着を見なかった。互いに譲らず${promotedCtx.venue.name}の${(d.attendance || 0).toLocaleString()}人を最後まで沸かせ、リング上には引き分けに納得しきれない両者の表情が残った。MQ${m.mq || '?'}——再戦を望む声は早くも上がっている。`;
    } else if (winnerName) {
      promotedArticle = `${winnerName}が${loserName}を${m.finishLabel || '決着技'}で仕留めた${m.turns || '?'}ターンの一戦。${promotedCtx.venue.name}の${(d.attendance || 0).toLocaleString()}人を前にMQ${m.mq || '?'}を記録し、メインに次ぐ好カードとして紙面に残った。${m.isTitleMatch ? '王座戦としての重みも感じさせる勝利だった。' : `${loserName}も意地を見せたが、${winnerName}の地力が最後にものを言った形だ。`}`;
    } else {
      promotedArticle = `${m.left.name}対${m.right.name}は${m.turns || '?'}ターンに及ぶ攻防となり、${promotedCtx.venue.name}の${(d.attendance || 0).toLocaleString()}人を魅了。MQ${m.mq || '?'}は今興行のセミとして十分な数字で、両者の評価をさらに押し上げる結果となった。`;
    }
  }

  const winner = m.winner;
  const winnerObjForSwap = m.isDraw ? null : (winner === 'left' ? m.left : (winner === 'right' ? m.right : null));
  const loserObjForSwap = m.isDraw ? null : (winner === 'left' ? m.right : (winner === 'right' ? m.left : null));
  const swapped = Object.assign({}, d, {
    left: Object.assign({}, m.left, { isWinner: winner === 'left' }),
    right: Object.assign({}, m.right, { isWinner: winner === 'right' }),
    winner: winnerObjForSwap,
    loser: loserObjForSwap,
    isDraw: !!m.isDraw,
    mq: m.mq,
    turns: m.turns,
    isTitleMatch: !!m.isTitleMatch,
    isUpset: !!m.isUpset,
    isDominant: !!m.isDominant,
    finishLabel: m.finishLabel || '',
    matchLabel: m.isTitleMatch ? '王座戦' : 'セミファイナル',
    headline: m.isTitleMatch
      ? `王座戦 ${m.left.name} vs ${m.right.name}`
      : `セミファイナル ${m.left.name} vs ${m.right.name}`,
    article: promotedArticle,
    // 元メインを ダイジェスト先頭に押し下げ、残りは元の順を保つ
    allMatches: [origMainAsRow].concat(d.allMatches.slice(1)),
    // showRating は興行全体の評価なので維持
  });
  return swapped;
}

function _npRenderPlayerShow(d, seasonNum, weekNum) {
  if (!d || !d.left || !d.right) return '';
  const leftBg = _npPhotoBg(d.left.id);
  const rightBg = _npPhotoBg(d.right.id);
  const leftWin = !d.isDraw && d.winner && d.winner.id === d.left.id;
  const rightWin = !d.isDraw && d.winner && d.winner.id === d.right.id;
  const leftCls = leftWin ? 'np-fc win' : 'np-fc';
  const rightCls = rightWin ? 'np-fc win' : 'np-fc';
  const tagMembers = team => (team?.members || [])
    .filter(f => f && f.name)
    .map(f => f.id ? `<span onclick="showFighterPopup(${f.id})">${f.name}</span>` : `<span>${f.name}</span>`)
    .join('<em> / </em>');
  const tagPhotos = (team, isWinner) => {
    const members = (team?.members || []).filter(f => f && f.id).slice(0, 2);
    if (members.length === 0) return '';
    return `<div class="np-fphoto np-tag-photo${isWinner ? ' win' : ''}">` + members.map(f =>
      `<div class="np-tag-photo-member" style="${_npPhotoBg(f.id)}" onclick="showFighterPopup(${f.id})" title="${f.name}"></div>`
    ).join('') + `</div>`;
  };

  let html = `<section class="np-show-result">
    <div class="np-sec">自団体 興行結果</div>
    <h3 class="np-show-headline">${d.headline || '定期興行'}</h3>
    <div class="np-versus-grid">
      <div class="${leftCls}">
        ${d.isTag && d.teamA ? tagPhotos(d.teamA, leftWin) : `<div class="np-fphoto" style="${leftBg}" onclick="showFighterPopup(${d.left.id})"></div>`}
        <div class="np-fname">${d.left.name}${leftWin ? '<span class="np-winner-mark">○</span>' : (rightWin ? '<span class="np-loser-mark">×</span>' : '')}</div>
        ${d.isTag && d.teamA ? `<div class="np-frole">${tagMembers(d.teamA)}</div>` : ''}
        ${d.left.role ? `<div class="np-frole">${d.left.role}</div>` : ''}
      </div>
      <div class="np-vs-block">
        <div class="np-vs-text">${d.isDraw ? 'DRAW' : 'VS'}</div>
        ${d.finishLabel ? `<div class="np-vs-finish">${d.finishLabel}</div>` : ''}
      </div>
      <div class="${rightCls}">
        ${d.isTag && d.teamB ? tagPhotos(d.teamB, rightWin) : `<div class="np-fphoto" style="${rightBg}" onclick="showFighterPopup(${d.right.id})"></div>`}
        <div class="np-fname">${d.right.name}${rightWin ? '<span class="np-winner-mark">○</span>' : (leftWin ? '<span class="np-loser-mark">×</span>' : '')}</div>
        ${d.isTag && d.teamB ? `<div class="np-frole">${tagMembers(d.teamB)}</div>` : ''}
        ${d.right.role ? `<div class="np-frole">${d.right.role}</div>` : ''}
      </div>
    </div>
    ${(() => {
      const timeStr = _npTurnsToTime(d.turns);
      const turnsTail = timeStr ? (d.turns ? `<span class="dec-turns">（${d.turns}ターン）</span>` : '') : (d.turns ? `<span class="dec-time">${d.turns}ターン</span>` : '');
      const timeMain = timeStr ? `<span class="dec-time">決着時間 ${timeStr}</span>` : '';
      if (d.isDraw) {
        return `<div class="np-show-decision draw"><span class="dec-text">時間切れ引き分け</span></div>`;
      }
      const winName = leftWin ? d.left.name : (rightWin ? d.right.name : null);
      if (!winName) return '';
      return `<div class="np-show-decision">
        <span class="dec-winner"><strong>${winName}</strong> 勝利</span>
        ${d.finishLabel ? `<span class="dec-finish">決着技：${d.finishLabel}</span>` : ''}
        ${timeMain}${turnsTail}
      </div>`;
    })()}
    <div class="np-result-line">
      <div>${d.matchLabel || 'メインイベント'}</div>
      <div class="mq-block"><label>MQ</label><strong>${d.mq || '?'}</strong></div>
      <div class="duration">${_npTurnsToTime(d.turns) || (d.turns ? `${d.turns}ターン` : '')}</div>
    </div>
    ${d.article ? `<div class="np-show-article">${d.article}</div>` : ''}
    ${_renderNewspaperInjuries(d)}`;

  // 評価ブロック
  if (d.showRating) {
    const stars = d.showRating.stars || 0;
    const starHtml = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    let comment = '';
    const pool = (typeof KURODA_SHOW_RATING !== 'undefined') ? KURODA_SHOW_RATING[`stars${stars}`] : null;
    if (pool && pool.length) {
      const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, 0xC5A1));
      const fn = Engine.rng.pick(rng, pool);
      try { comment = fn({ playerName: G.orgName || '我が団体', avgMQ: d.avgMQ || d.mq || 0 }); } catch(e) {}
    }
    html += `<div class="np-rating">
      <div class="np-rating-stars">${starHtml}</div>
      <div class="np-rating-headline">観客満足度 ${stars}.0 / 5</div>
      ${comment ? `<div class="np-rating-comment">「${comment}」</div>` : ''}
    </div>`;
  }

  // ダイジェストテーブル
  if (d.allMatches && d.allMatches.length > 0) {
    html += _npRenderDigest(d, seasonNum, weekNum);
  }

  html += `</section>`;
  return html;
}

function _renderNewspaperInjuries(d) {
  const injuries = (d && Array.isArray(d.injuries)) ? d.injuries.filter(ir => ir && ir.name) : [];
  if (!injuries.length) return '';
  const rows = injuries.map(ir => {
    const weeks = ir.weeksLeft != null ? ` / ${ir.weeksLeft}週離脱` : '';
    return `<div class="news-injury-row" style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-top:1px solid rgba(137,41,41,0.16);"><strong>${ir.name}</strong><span>${ir.type || '負傷'}${weeks}</span></div>`;
  }).join('');
  return `<div class="news-injury-report" style="margin-top:10px;padding:8px 10px;border:1px solid rgba(137,41,41,0.22);background:rgba(137,41,41,0.06);border-radius:8px;color:#4a241d;"><div class="news-sec-label">負傷者情報</div>${rows}</div>`;
}

function _npRenderDigest(d, seasonNum, weekNum) {
  const venueIdx = (typeof d.venueIdx === 'number') ? d.venueIdx : (G.showVenue || 0);
  const expectedMQ = d.showRating?.expected || (typeof _calcExpectedMQ === 'function' ? _calcExpectedMQ(venueIdx, G.orgPop) : 50);

  let rows = '';
  d.allMatches.forEach((m, idx) => {
    const leftWon = m.winner === 'left';
    const rightWon = m.winner === 'right';
    const winnerId = leftWon ? m.left.id : (rightWon ? m.right.id : null);
    const loserId = leftWon ? m.right.id : (rightWon ? m.left.id : null);
    const winnerName = leftWon ? m.left.name : (rightWon ? m.right.name : m.left.name);
    const loserName = leftWon ? m.right.name : (rightWon ? m.left.name : m.right.name);
    const wId = m.isDraw ? m.left.id : winnerId;
    const lId = m.isDraw ? m.right.id : loserId;
    const wName = m.isDraw ? m.left.name : winnerName;
    const lName = m.isDraw ? m.right.name : loserName;

    let badge = '';
    if (m.isTitleMatch) badge = '<span class="badge-title">王座戦</span>';
    else if (m.isUpset) badge = '<span class="badge-upset">番狂わせ</span>';

    const mqClass = m.mq >= 75 ? 'high' : m.mq >= 55 ? 'mid' : 'low';

    // コメント
    let comment = '';
    if (typeof NEWSPAPER_DIGEST_COMMENTS !== 'undefined') {
      let pool;
      if (m.isDraw) pool = NEWSPAPER_DIGEST_COMMENTS.draw;
      else if (m.isUpset) pool = NEWSPAPER_DIGEST_COMMENTS.upset;
      else if (m.isDominant) pool = NEWSPAPER_DIGEST_COMMENTS.dominant;
      else if (m.isTitleMatch) pool = NEWSPAPER_DIGEST_COMMENTS.titleMatch;
      else {
        const diff = m.mq - expectedMQ;
        let r;
        if (diff >= 15) r = 'great';
        else if (diff >= 5) r = 'good';
        else if (diff >= -4) r = 'average';
        else if (diff >= -15) r = 'poor';
        else r = 'bad';
        pool = NEWSPAPER_DIGEST_COMMENTS[r];
      }
      if (pool && pool.length) {
        const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, idx, 0xD1C0));
        const fn = Engine.rng.pick(rng, pool);
        try { comment = fn({ winnerName: wName, loserName: lName, mq: m.mq, turns: m.turns }); } catch(e) {}
      }
    }

    const dTimeStr = _npTurnsToTime(m.turns);
    const dTimeMain = dTimeStr ? `<span class="np-digest-time">${dTimeStr}</span>` : '';
    const dTurnsSub = dTimeStr
      ? (m.turns ? `<span class="np-digest-turns-sub">（${m.turns}ターン）</span>` : '')
      : (m.turns ? `<span class="np-digest-time">${m.turns}ターン</span>` : '');
    let finishLine = '';
    if (m.isDraw) {
      finishLine = `<span class="np-digest-finish-text">時間切れ引き分け</span>`;
    } else if (wName) {
      const finBit = m.finishLabel ? `<strong>${m.finishLabel}</strong>で勝利` : '勝利';
      finishLine = `<span class="np-digest-finish-text"><strong>${wName}</strong>が${finBit}</span>${dTimeMain}${dTurnsSub}`;
    }
    const rowNo = m.matchNumber || (idx + 2);
    const rowLabel = m.matchLabel || (rowNo ? `第${rowNo}試合` : '');
    const digestTagThumbs = (team, isWinner) => {
      const members = (team?.members || []).filter(f => f && f.id).slice(0, 2);
      if (!members.length) return '';
      return `<div class="np-digest-thumb-stack${isWinner ? ' win' : ''}">` + members.map(f =>
        `<div class="np-digest-thumb sm" style="${_npThumbBg(f.id)}" onclick="showFighterPopup(${f.id})" title="${f.name}"></div>`
      ).join('') + `</div>`;
    };
    rows += `<tr>
      <td class="num" title="${rowLabel}">${rowNo}</td>
      <td class="tag">${badge}</td>
      <td>
        ${m.isTag ? `<div class="np-digest-card">
          ${digestTagThumbs(m.teamA, leftWon)}
          <span class="np-digest-name${leftWon ? ' win' : ''}">${m.left.name}${leftWon ? '<span class="np-digest-mark win">○</span>' : ''}</span>
          <span class="np-digest-vs">${m.isDraw ? 'DRAW' : 'vs'}</span>
          <span class="np-digest-name${rightWon ? ' win' : ' lose'}">${!m.isDraw && rightWon ? '<span class="np-digest-mark win">○</span>' : (!m.isDraw ? '<span class="np-digest-mark lose">×</span>' : '')}${m.right.name}</span>
          ${digestTagThumbs(m.teamB, rightWon)}
        </div>` : `<div class="np-digest-card">
          <div class="np-digest-thumb" style="${_npThumbBg(wId)}" onclick="showFighterPopup(${wId})"></div>
          <span class="np-digest-name">${wName}${!m.isDraw && wName ? '<span class="np-digest-mark win">○</span>' : ''}</span>
          <span class="np-digest-vs">${m.isDraw ? 'DRAW' : 'vs'}</span>
          <span class="np-digest-name lose">${!m.isDraw && lName ? '<span class="np-digest-mark lose">×</span>' : ''}${lName}</span>
          <div class="np-digest-thumb" style="${_npThumbBg(lId)}" onclick="showFighterPopup(${lId})"></div>
        </div>`}
        ${finishLine ? `<div class="np-digest-finish">${finishLine}</div>` : ''}
      </td>
      <td class="np-digest-mq ${mqClass}">${m.mq}</td>
    </tr>`;
    if (comment) {
      rows += `<tr><td></td><td></td><td colspan="2" class="np-digest-comment">「${comment}」</td></tr>`;
    }
  });

  return `<div class="np-digest">
    <div class="np-sec">興行ダイジェスト</div>
    <table class="np-digest-table">
      <thead><tr><th>#</th><th></th><th>カード</th><th style="text-align:right">MQ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// 2面: 団体比較 (v8 mockup §compare)
// ══════════════════════════════════════════════════════════════
function _npRenderPage2() {
  const seasonNum = G.season || 1, weekNum = G.week || 1;
  // ライバル団体選択
  const orgs = (typeof RIVAL_ORGS !== 'undefined') ? RIVAL_ORGS : [];
  if (!_dbCompareTarget && orgs.length > 0) _dbCompareTarget = orgs[0].id;

  let html = `<div class="np-paper">${_npPaperHeader(seasonNum, weekNum)}<div class="np-content">`;

  if (orgs.length === 0 || !_dbCompareTarget) {
    html += `<div class="np-empty">比較対象の団体が存在しない。</div></div></div>`;
    return html;
  }

  // セレクタ
  html += `<div class="np-cmp-select">
    <label>📊 比較対象</label>
    <select onchange="_dbCompareTarget=this.value;renderNewspaper()">`;
  orgs.forEach(o => {
    const sel = (o.id === _dbCompareTarget) ? ' selected' : '';
    const nameDisp = (G.rivalOrgNames && G.rivalOrgNames[o.id]) || o.name || o.id;
    html += `<option value="${o.id}"${sel}>${nameDisp} (Tier ${o.tier})</option>`;
  });
  html += `</select></div>`;

  const d = Engine.database.getOrgCompareAnalysis(G, _dbCompareTarget);

  // ヘッドラインセクション (黒田顔 + 引用 + グレード)
  html += `<div class="np-headline-section">
    <div class="np-kuroda-face" style="background-image:url('${_npKurodaFaceUrl()}')"></div>
    <div>
      <div class="np-headline-quote">「${d.summaryText || ''}」</div>
      <div class="np-headline-byline">${NP_KURODA_BYLINE.editorial}</div>
    </div>
    <div class="np-headline-grade">
      <div class="lbl">GRADE</div>
      <div class="val">${d.grade}</div>
      <div class="desc">${d.gradeDesc ? d.gradeDesc.slice(0, 14) : ''}</div>
    </div>
  </div>`;

  // 団体サマリー (player / VS / rival)
  const playerChamp = _npFindOrgChampion(G, 'player');
  const rivalChamp = _npFindOrgChampion(G, _dbCompareTarget);
  html += `<div class="np-org-summary">
    <div class="np-org-card player">
      <div class="np-org-card-head">
        <div>
          <div class="np-org-name">${d.playerName}</div>
          <div class="np-org-sub">${d.playerSubtitle || ''}</div>
        </div>
        <div class="np-org-tier">プレイヤー</div>
      </div>
      <div class="np-org-tags">${(d.playerTags || []).map(t => `<span class="np-org-tag">${t}</span>`).join('')}</div>
      <div class="np-org-stats">
        <div class="stat-item"><label>選手</label><strong>${d.playerRosterCount}</strong></div>
        <div class="stat-item"><label>団体人気</label><strong>${d.pOrgPop}</strong></div>
        <div class="stat-item"><label>TOP5実力</label><strong>${d.pTop5Ovr}</strong></div>
        <div class="stat-item"><label>エース</label><strong>${d.playerScores.ace}</strong></div>
      </div>
      <div class="np-org-champ">王者: ${playerChamp ? `<strong>${playerChamp.name}</strong>` : '<strong>不在</strong>'}</div>
    </div>
    <div class="np-versus-mark">VS</div>
    <div class="np-org-card rival">
      <div class="np-org-card-head">
        <div>
          <div class="np-org-name">${d.rivalName}</div>
          <div class="np-org-sub">${d.rivalSubtitle || ''}</div>
        </div>
        <div class="np-org-tier">Tier ${d.rivalTier}</div>
      </div>
      <div class="np-org-tags">${(d.rivalTags || []).map(t => `<span class="np-org-tag">${t}</span>`).join('')}</div>
      <div class="np-org-stats">
        <div class="stat-item"><label>選手</label><strong>${d.rivalRosterCount}</strong></div>
        <div class="stat-item"><label>団体人気</label><strong>${d.rOrgPop}</strong></div>
        <div class="stat-item"><label>TOP5実力</label><strong>${d.rTop5Ovr}</strong></div>
        <div class="stat-item"><label>エース</label><strong>${d.rivalScores.ace}</strong></div>
      </div>
      <div class="np-org-champ">王者: ${rivalChamp ? `<strong>${rivalChamp.name}</strong>` : '<strong>不在</strong>'}</div>
    </div>
  </div>`;

  // 過去対戦成績 (war-record) — モックアップ §2-2 準拠
  const warStats = _npComputeWarRecord(G, _dbCompareTarget);
  if (warStats.total > 0) {
    const hasStreak = (warStats.streakKind === 'win' || warStats.streakKind === 'lose') && warStats.streak >= 2;
    const streakCls = hasStreak ? warStats.streakKind : 'even';
    const streakLabel = hasStreak
      ? (warStats.streakKind === 'win' ? `${warStats.streak}連勝中` : `${warStats.streak}連敗中`)
      : '';
    let warComment = '';
    if (typeof KURODA_WAR_RECORD !== 'undefined') {
      // ストリークが立っているときは streak 系プールを優先。
      // それ以外は通算 wins/losses の偏りで heavy/slight/even を選ぶ。
      let cat;
      if (hasStreak) {
        cat = warStats.streakKind === 'win' ? 'winStreak' : 'loseStreak';
      } else {
        const w = warStats.wins, l = warStats.losses, t = warStats.total;
        if (w === l) cat = 'evenRecord';
        else if (t > 0 && w / t >= 0.67) cat = 'heavyWinning';
        else if (w > l) cat = 'slightWinning';
        else if (t > 0 && l / t >= 0.67) cat = 'heavyLosing';
        else cat = 'slightLosing';
      }
      const pool = KURODA_WAR_RECORD[cat] || KURODA_WAR_RECORD.evenRecord || [];
      if (pool.length > 0) {
        const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, 0xC2D0));
        const fn = Engine.rng.pick(rng, pool);
        const signedStreak = hasStreak
          ? (warStats.streakKind === 'win' ? warStats.streak : -warStats.streak)
          : 0;
        try {
          warComment = fn({
            playerName: d.playerName,
            rivalName: d.rivalName,
            wins: warStats.wins,
            losses: warStats.losses,
            streak: signedStreak,
          });
        } catch(e) {}
      }
    }
    if (!warComment) {
      warComment = warStats.diff > 1 ? `${d.playerName}が対戦成績で先行している。${d.rivalName}としては反撃の機会を作りたいところだ。`
        : warStats.diff < -1 ? `${d.rivalName}が対戦成績で優位。${d.playerName}としては流れを変える一戦が必要になる。`
        : `通算${warStats.total}戦で互角。次戦が大きな分岐点になりそうだ。`;
    }
    html += `<div class="np-war-record">
      <div class="np-sec-gold">過去対戦成績</div>
      <div class="np-war-grid">
        <div class="np-war-overall">
          <span class="lbl">通算（団体間ガチンコのみ）</span>
          <span class="wl">${warStats.wins}勝-${warStats.losses}敗${warStats.draws ? `-${warStats.draws}分` : ''}</span>
        </div>
        <div class="np-war-breakdown">
          <div class="item"><label>対抗戦</label><span>${warStats.byWar.w}-${warStats.byWar.l}${warStats.byWar.d ? `-${warStats.byWar.d}分` : ''}</span></div>
          <div class="item"><label>PPV</label><span>${warStats.byPpv.w}-${warStats.byPpv.l}${warStats.byPpv.d ? `-${warStats.byPpv.d}分` : ''}</span></div>
          <div class="item"><label>挑戦状</label><span>${warStats.byB3.w}-${warStats.byB3.l}${warStats.byB3.d ? `-${warStats.byB3.d}分` : ''}</span></div>
        </div>
        ${streakLabel ? `<div class="np-war-streak ${streakCls}">${streakLabel}</div>` : ''}
      </div>
      <div class="np-war-comment">
        <div class="np-kuroda-face" style="background-image:url('${_npKurodaFaceUrl()}')"></div>
        <div>「${warComment}」<div class="np-kuroda-byline">${NP_KURODA_BYLINE.warRecord}</div></div>
      </div>
    </div>`;
  }

  // エース対峙 (上位選手1名同士) — stand画像で対峙
  const aceP = (d.matchups && d.matchups[0]) ? d.matchups[0].player : null;
  const aceR = (d.matchups && d.matchups[0]) ? d.matchups[0].rival : null;
  if (aceP && aceR) {
    const aceDiff = aceP.ovr - aceR.ovr;
    const edgeCls = aceDiff > 3 ? 'player' : aceDiff < -3 ? 'rival' : 'even';
    const edgeText = aceDiff > 3 ? `${d.playerName}優位 +${aceDiff}` : aceDiff < -3 ? `${d.rivalName}優位 ${aceDiff}` : '互角';
    html += `<div class="np-ace-confront">
      <div class="np-ace-top">
        <span class="role-chip">エース対決</span>
        <span class="edge ${edgeCls}">${edgeText}</span>
      </div>
      <div class="np-ace-arena">
        <div class="np-stand-wrap"><div class="np-stand-img flip" style="${_npStandBg(aceP.id, aceP.ovr)}"></div></div>
        <div class="np-ace-vs-center">
          <div class="np-ace-vs-text">VS</div>
          <div class="np-ace-vs-metrics">OVR<br>${aceP.ovr} : ${aceR.ovr}</div>
        </div>
        <div class="np-stand-wrap"><div class="np-stand-img" style="${_npStandBg(aceR.id, aceR.ovr)}"></div></div>
      </div>
      <div class="np-ace-name-bar">
        <div class="np-ace-side">
          <div class="org">${d.playerName}</div>
          <div class="name">${_npClickName(aceP.name, aceP.id)}</div>
          <div class="ovr-line">OVR<strong>${aceP.ovr}</strong> / 人気<strong>${aceP.pop}</strong></div>
        </div>
        <div class="np-ace-side">
          <div class="org">${d.rivalName}</div>
          <div class="name">${_npClickName(aceR.name, aceR.id)}</div>
          <div class="ovr-line">OVR<strong>${aceR.ovr}</strong> / 人気<strong>${aceR.pop}</strong></div>
        </div>
      </div>
      <div class="np-ace-flavor">${d.opportunity || ''}</div>
    </div>`;
  }

  // 主力対決リスト (matchups[1..]) — モックアップ準拠で各行に黒田寸評
  if (d.matchups && d.matchups.length > 1) {
    html += `<div class="np-sec-gold">主力対決</div>`;
    html += `<div class="np-matchup-list">`;
    d.matchups.slice(1).forEach((m, idx) => {
      const diff = m.player.ovr - m.rival.ovr;
      const verdictCls = diff > 3 ? 'player' : diff < -3 ? 'rival' : 'even';
      const verdictText = diff > 3 ? '優勢' : diff < -3 ? '劣勢' : '互角';
      // 寸評
      let comment = '';
      if (typeof KURODA_MATCHUP_FLAVOR !== 'undefined') {
        // pick from h2h or generic pool
        const pool = (KURODA_MATCHUP_FLAVOR.h2h && KURODA_MATCHUP_FLAVOR.h2h.firstMeet) || [];
        const stylePool = (KURODA_MATCHUP_FLAVOR.style && KURODA_MATCHUP_FLAVOR.style.differentStyle) || [];
        const allPool = [...pool, ...stylePool];
        if (allPool.length > 0) {
          const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, m.player.id, m.rival.id, 0xC2A1));
          const fn = Engine.rng.pick(rng, allPool);
          try { comment = fn({ aName: m.player.name, bName: m.rival.name, aOrg: d.playerName, bOrg: d.rivalName, role: m.role }); } catch(e) {}
        }
      }
      if (!comment) {
        comment = diff > 5 ? `${m.player.name}にOVR優位がある。${m.rival.name}は地力で押し返したい。`
          : diff < -5 ? `${m.rival.name}が地力で勝る。${m.player.name}は工夫が要る。`
          : `OVRは互角。${m.role}対決として見逃せない一戦になる。`;
      }
      const pEmblem = _npOrgEmblem(G, 'player', 14);
      const rEmblem = _npOrgEmblem(G, _dbCompareTarget, 14);
      html += `<div class="np-matchup-row">
        <div class="np-matchup-fighter">
          <div class="np-matchup-photo" style="${_npThumbBg(m.player.id)}" onclick="showFighterPopup(${m.player.id})"></div>
          <div>
            <div class="np-matchup-org-line">${pEmblem}<span>${d.playerName}</span></div>
            <div class="np-matchup-name">${m.player.name}</div>
            <div class="np-matchup-ovr">OVR<strong>${m.player.ovr}</strong> 人気<strong>${m.player.pop}</strong></div>
          </div>
        </div>
        <div class="np-matchup-vs">
          <span class="role">${m.role}</span>
          <span class="verdict ${verdictCls}">${verdictText}</span>
        </div>
        <div class="np-matchup-fighter right">
          <div class="np-matchup-photo right" style="${_npThumbBg(m.rival.id)}" onclick="showFighterPopup(${m.rival.id})"></div>
          <div>
            <div class="np-matchup-org-line right">${rEmblem}<span>${d.rivalName}</span></div>
            <div class="np-matchup-name">${m.rival.name}</div>
            <div class="np-matchup-ovr">OVR<strong>${m.rival.ovr}</strong> 人気<strong>${m.rival.pop}</strong></div>
          </div>
        </div>
        <div class="np-matchup-comment">${comment}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // 戦力レーダー (4軸 単色バー) — 値を両端に + 業界基準注記
  const AXES = [
    { key: 'ace', label: 'エース力', basis: 'TOP3平均OVRが100で100点 (上限100)' },
    { key: 'depth', label: '層の厚み', basis: '4〜8位5人の平均OVRが80で100点 (8人未満は不足枠OVR=0)' },
    { key: 'popularity', label: '集客力', basis: '団体人気をそのまま0〜100で点数化' },
    { key: 'starPower', label: 'タイトル力', basis: 'TOP5平均人気が80で100点 (上限100)' },
  ];
  let powerRows = '';
  AXES.forEach(ax => {
    const pVal = Math.max(0, Math.min(100, d.playerScores[ax.key] || 0));
    const rVal = Math.max(0, Math.min(100, d.rivalScores[ax.key] || 0));
    const diff = (d.diffs && d.diffs[ax.key] != null) ? d.diffs[ax.key] : (pVal - rVal);
    const diffSign = diff > 0 ? `+${diff}` : `${diff}`;
    const diffCls = diff > 0 ? 'player' : diff < 0 ? 'rival' : '';
    powerRows += `<div class="np-power-row">
      <div class="np-power-val player">${pVal}</div>
      <div class="np-power-label">${ax.label}</div>
      <div class="np-power-bar-wrap">
        <div class="player-side" style="width:${pVal}%"></div>
        <div class="rival-side" style="width:${rVal}%"></div>
        <div class="center-line"></div>
      </div>
      <div class="np-power-val rival">${rVal}</div>
      <div class="np-power-diff ${diffCls}">${diffSign}</div>
    </div>`;
  });
  html += `<div class="np-power-section">
    <div class="heading">戦力レーダー (4軸 / 100点満点)</div>
    <div class="heading-note">エース力=看板3人のOVR (TOP3平均÷100×100) / 層の厚み=控え5人のOVR (4〜8位平均÷80×100、不足枠は0扱い) / 集客力=団体人気そのまま / タイトル力=看板5人の人気 (TOP5平均人気÷80×100)</div>
    ${powerRows}
  </div>`;

  // 記者コラム (黒田)
  if (d.opportunity || d.risk || d.scout) {
    html += `<div class="np-editorial">
      <div class="np-editorial-head">
        <div class="np-kuroda-face sm" style="background-image:url('${_npKurodaFaceUrl()}')"></div>
        <div style="flex:1">
          <div class="np-editorial-text">${d.summaryText || ''}<br>勝ち筋: ${d.opportunity || ''}<br>リスク: ${d.risk || ''}<br>補強提案: ${d.scout || ''}</div>
          <div class="np-editorial-byline">${NP_KURODA_BYLINE.editorial}</div>
        </div>
      </div>
    </div>`;
  }

  // ライバル団体 注目選手3件
  const rRoster = G.aiOrgs && G.aiOrgs[_dbCompareTarget] && G.aiOrgs[_dbCompareTarget].roster || [];
  const rTop3 = [...rRoster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 3);
  if (rTop3.length > 0) {
    const rivalEmblem = _npOrgEmblem(G, _dbCompareTarget, 16);
    html += `<div class="np-sec-gold" style="margin-top:14px">${rivalEmblem} ${d.rivalName} 注目選手</div>`;
    html += `<div class="np-spotlight-grid">`;
    rTop3.forEach((f, i) => {
      const tagCls = i === 0 ? 'ace' : i === 1 ? 'star' : 'threat';
      const tagText = i === 0 ? 'エース級' : i === 1 ? '主力級' : '中堅級';
      const fOvr = Engine.util.ov(f);
      const fPop = Math.round(f.popularity || 0);
      const fAge = f.age != null ? f.age : '?';
      // 寸評: KURODA_SPOTLIGHT — 年齢を反映してプール選択
      // youngThreat は20歳以下限定。21〜26は risingYoung、27〜32は midCareer、33以上は veteran
      const ageNum = (typeof f.age === 'number') ? f.age : 25;
      let poolKey;
      if (i <= 1) {
        // エース級・主力級
        if (ageNum >= 33) poolKey = 'veteran';
        else if (ageNum <= 22) poolKey = 'risingYoung';
        else poolKey = 'star';
      } else {
        // 中堅級
        if (ageNum <= 20) poolKey = 'youngThreat';
        else if (ageNum <= 26) poolKey = 'risingYoung';
        else if (ageNum <= 32) poolKey = 'midCareer';
        else poolKey = 'veteran';
      }
      let comment = '';
      if (typeof KURODA_SPOTLIGHT !== 'undefined') {
        const pool = (KURODA_SPOTLIGHT[poolKey]) || (KURODA_SPOTLIGHT.star) || [];
        if (pool.length > 0) {
          const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, f.id, 0xC3A1));
          const fn = Engine.rng.pick(rng, pool);
          try { comment = fn({ name: f.name, ovr: fOvr, pop: fPop, orgName: d.rivalName, age: fAge }); } catch(e) {}
        }
      }
      if (!comment) {
        comment = i === 0 ? `${d.rivalName}の看板。OVR${fOvr}は当面の脅威。`
          : i === 1 ? `主力として団体を支える。試合の質で平均値を引き上げる。`
          : `中堅として団体を支える一人。注視すべき存在だ。`;
      }
      html += `<div class="np-spotlight">
        <div class="np-spotlight-head">
          <div class="np-spotlight-photo" style="${_npThumbBg(f.id)}" onclick="showFighterPopup(${f.id})"></div>
          <div style="flex:1;min-width:0">
            <div class="np-spotlight-name">${f.name}</div>
            <div class="np-spotlight-meta">OVR<strong>${fOvr}</strong> / 人気<strong>${fPop}</strong> / 年齢<strong>${fAge}</strong></div>
          </div>
          <span class="np-spotlight-tag ${tagCls}">${tagText}</span>
        </div>
        <div class="np-spotlight-comment">${comment}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // ファンの声セクション
  if (typeof FAN_OPINIONS !== 'undefined') {
    const tier = d.totalDiff > 40 ? 'dominant' : d.totalDiff > 10 ? 'ahead' : d.totalDiff > -25 ? 'even' : d.totalDiff > -60 ? 'behind' : 'devastating';
    const tones = [
      { key: 'hopeful', handle: '@熱狂派' },
      { key: 'hardcore', handle: '@辛口派' },
      { key: 'neutral', handle: '@分析派' },
    ];
    const fans = [];
    tones.forEach((t, i) => {
      const pool = (FAN_OPINIONS[tier] && FAN_OPINIONS[tier][t.key]) || [];
      if (pool.length > 0) {
        const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, i, 0xC4A1));
        const fn = Engine.rng.pick(rng, pool);
        let txt = '';
        try { txt = fn({ playerName: d.playerName, rivalName: d.rivalName }); } catch(e) {}
        if (txt) fans.push({ tone: t.key, txt, handle: t.handle });
      }
    });
    if (fans.length > 0) {
      html += `<div class="np-fan-section">
        <div class="np-sec">ファンの声</div>
        <div class="np-fan-list">`;
      fans.forEach(f => {
        html += `<div class="np-fan-comment">
          <div class="np-fan-text">「${f.txt}」</div>
          <div class="np-fan-handle">${f.handle}</div>
        </div>`;
      });
      html += `</div></div>`;
    }
  }

  html += `</div></div>`;
  return html;
}

function _npFindOrgChampion(state, orgKey) {
  if (orgKey === 'player') {
    const titles = state.titles || {};
    const champId = titles.world?.holderId || titles.heavy?.holderId || titles.junior?.holderId;
    if (champId == null) return null;
    const c = (state.roster || []).find(x => x.id === champId);
    return c ? { name: c.name, id: c.id } : null;
  }
  // AI団体
  const aiTitle = state.aiOrgs && state.aiOrgs[orgKey] && state.aiOrgs[orgKey].titles;
  if (!aiTitle) return null;
  const champId = aiTitle.world?.holderId || aiTitle.heavy?.holderId || aiTitle.main?.holderId;
  if (champId == null) return null;
  const ar = state.aiOrgs[orgKey].roster || [];
  const c = ar.find(x => x.id === champId);
  return c ? { name: c.name, id: c.id } : null;
}

// ══════════════════════════════════════════════════════════════
// 3面: 因縁列伝 (v8 mockup §rivalry)
// ══════════════════════════════════════════════════════════════
function _npRenderPage3() {
  const seasonNum = G.season || 1, weekNum = G.week || 1;
  const { featured, relations } = _pickRivalryFeatured(G);

  let html = `<div class="np-paper">${_npPaperHeader(seasonNum, weekNum)}<div class="np-content">`;

  if (!featured) {
    html += `<div class="np-empty">記事にする価値のある因縁が、まだ業界には育っていない。<br>記者として、もう少し時間が要ると見ている。</div></div></div>`;
    return html;
  }

  // 大見出し — KURODA_RELATION_NARRATIVE.headlines から動的 pick
  const tagPreMap = {
    fated_admiration: '深層リポート', pure_hatred: '対立の深淵', destined_rival: '宿命対決',
    allied_rivalry: '友情と闘志', bitter_feud: '骨肉の争い', standard_rivalry: '互角の宿敵',
    mutual_respect: '相互尊敬', cold_rivalry: '冷戦', casual_rivalry: '緩やかな宿敵',
  };
  const tagSubMap = {
    fated_admiration: '頂点を分け合う二人の物語', pure_hatred: '埋まらぬ亀裂の裏側', destined_rival: '運命に導かれた敵対関係',
    allied_rivalry: '同じ志、別の道', bitter_feud: '冷めぬ確執の記録', standard_rivalry: '互いを高め合う関係',
    mutual_respect: 'リングの上での敬意', cold_rivalry: '静かな確執', casual_rivalry: '日々のリング上で',
  };
  const _hd_h2h = featured.h2h || {};
  const yearsApprox = _npH2HYearsApprox(_hd_h2h, G);
  let dynHeadline = '';
  if (typeof KURODA_RELATION_NARRATIVE !== 'undefined' && KURODA_RELATION_NARRATIVE[featured.tag] && KURODA_RELATION_NARRATIVE[featured.tag].headlines) {
    const pool = KURODA_RELATION_NARRATIVE[featured.tag].headlines;
    if (pool.length > 0) {
      const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, featured.idA, featured.idB, 0xC1B1));
      const fn = Engine.rng.pick(rng, pool);
      try { dynHeadline = fn({ charA: featured.charA.name, charB: featured.charB.name, matches: _hd_h2h.matches || 0, bestMQ: _hd_h2h.bestMQ || 0, years: yearsApprox }); } catch(e) {}
    }
  }
  html += `<div class="np-rivalry-headline">
    <div class="pre">${tagPreMap[featured.tag] || '深層リポート'}</div>
    <div class="title">${dynHeadline || `${featured.charA.name}と${featured.charB.name}——${tagSubMap[featured.tag] || ''}`}</div>
    <div class="sub">${tagSubMap[featured.tag] || ''}</div>
  </div>`;

  // メイン featured
  const aRT = _npFindRuntimeFighter(G, featured.idA) || featured.charA;
  const bRT = _npFindRuntimeFighter(G, featured.idB) || featured.charB;
  const a = aRT, b = bRT;
  const aName = a.name, bName = b.name;
  const aOrg = _findFighterOrgName(G, featured.idA);
  const bOrg = _findFighterOrgName(G, featured.idB);
  const aOvr = Engine.util.ov(a), bOvr = Engine.util.ov(b);
  const aAge = a.age != null ? a.age : '?';
  const bAge = b.age != null ? b.age : '?';
  const aRole = (a.style || '') + (a.role ? ` / ${a.role}` : '');
  const bRole = (b.style || '') + (b.role ? ` / ${b.role}` : '');
  const h2h = featured.h2h;
  const wA = h2h.winsA || 0, wB = h2h.winsB || 0, dr = h2h.draws || 0;
  const matches = h2h.matches || 0;

  // narrative pick
  let narrative = '';
  if (typeof KURODA_RELATION_NARRATIVE !== 'undefined' && KURODA_RELATION_NARRATIVE[featured.tag]) {
    const pool = KURODA_RELATION_NARRATIVE[featured.tag];
    if (pool.length > 0) {
      const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, a.id, b.id, 0xC1A1));
      const fn = Engine.rng.pick(rng, pool);
      try { narrative = fn({ aName, bName, aOrg, bOrg, matches, wA, wB, bestMQ: h2h.bestMQ || 0 }); } catch(e) {}
    }
  }

  // narrative を3本 pick して連結 (情報量増、bodies 配列を使用)
  const narrativeParas = [];
  const _bestMQVal = h2h.bestMQ || 0;
  // bestMQ が低いとき (<75) は「最高評価」と褒める文言の本文を除外する
  const _filterPraiseByMQ = (fnList) => {
    if (_bestMQVal >= 75) return fnList;
    return fnList.filter(fn => {
      try {
        const src = fn.toString();
        return !/最高評価|bestMQ/.test(src);
      } catch(e) { return true; }
    });
  };
  if (typeof KURODA_RELATION_NARRATIVE !== 'undefined' && KURODA_RELATION_NARRATIVE[featured.tag] && KURODA_RELATION_NARRATIVE[featured.tag].bodies) {
    const pool = _filterPraiseByMQ(KURODA_RELATION_NARRATIVE[featured.tag].bodies);
    if (pool.length > 0) {
      const seeds = [0xC1A1, 0xC1A2, 0xC1A3, 0xC1A4, 0xC1A5];
      const used = new Set();
      seeds.forEach(seed => {
        if (narrativeParas.length >= 3) return;
        const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, a.id, b.id, seed));
        const fn = Engine.rng.pick(rng, pool);
        if (used.has(fn)) return;
        used.add(fn);
        try {
          const t = fn({ aName, bName, aOrg, bOrg, matches, wA, wB, bestMQ: _bestMQVal, years: yearsApprox, charA: aName, charB: bName });
          if (t) narrativeParas.push(t);
        } catch(e) {}
      });
    }
  }
  if (narrativeParas.length === 0) {
    narrativeParas.push(`${aName}と${bName}。${matches}度のぶつかり合いが、二人の関係を形づくってきた。`);
    narrativeParas.push(`通算${wA}勝${wB}敗${dr ? dr + '分' : ''}。本紙はこの関係を、業界を象徴する一組として注視している。`);
  } else if (narrativeParas.length === 1) {
    narrativeParas.push(`通算${wA}勝${wB}敗${dr ? dr + '分' : ''}。数字は嘘をつかない。`);
  }

  // 事実段落: h2h データを最大限盛り込む
  const facts = [];
  facts.push(`<span class="fact-item">通算<strong>${matches}</strong>戦</span>`);
  facts.push(`<span class="fact-item">${aName}<strong>${wA}</strong>勝 / ${bName}<strong>${wB}</strong>勝${dr ? ` / ${dr}分` : ''}</span>`);
  facts.push(`<span class="fact-item">ベスト試合 MQ<strong>${h2h.bestMQ || '?'}</strong></span>`);
  if (h2h.hadTitleMatch) facts.push(`<span class="fact-item">タイトル戦経験<strong>あり</strong></span>`);
  if (h2h.hadPPV) facts.push(`<span class="fact-item">PPV対決<strong>あり</strong></span>`);
  if (h2h.lastMatch) facts.push(`<span class="fact-item">直近対戦 S<strong>${h2h.lastMatch.season}</strong>W<strong>${h2h.lastMatch.week}</strong></span>`);
  // 関係性数値 (bond / rivalry 平均)
  facts.push(`<span class="fact-item">親密度<strong>${Math.round(featured.bond)}</strong> / ライバル度<strong>${Math.round(featured.rivalry)}</strong></span>`);
  // 過去同団体経験
  if (typeof Engine !== 'undefined' && Engine.orgTimeline && Engine.orgTimeline.wereColleagues) {
    try {
      if (Engine.orgTimeline.wereColleagues(G, featured.idA, featured.idB)) {
        facts.push(`<span class="fact-item">過去同団体<strong>あり</strong></span>`);
      }
    } catch(e) {}
  }

  // 団体エンブレム
  const aOrgKey = _npFindFighterOrgKey(G, featured.idA);
  const bOrgKey = _npFindFighterOrgKey(G, featured.idB);
  const aEmblem = _npOrgEmblem(G, aOrgKey, 18);
  const bEmblem = _npOrgEmblem(G, bOrgKey, 18);

  html += `<div class="np-rivalry-main">
    <div class="np-rivalry-main-photos">
      <div class="np-rivalry-stand"><div class="img" style="${_npPhotoBg(a.id)}"></div></div>
      <div class="np-rivalry-vs">
        <div class="vs">VS</div>
        <div class="h2h">${wA}勝-${wB}勝${dr ? ` (${dr}分)` : ''}</div>
        <div class="h2h-lbl">通算${matches}戦</div>
      </div>
      <div class="np-rivalry-stand"><div class="img flip" style="${_npPhotoBg(b.id)}"></div></div>
    </div>
    <div class="np-rivalry-info">
      <div class="np-rivalry-side">
        <div class="org-line">${aEmblem}<span>${aOrg}</span></div>
        <div class="name">${_npClickName(aName, a.id)}</div>
        <div class="role">${aRole}</div>
        <div class="stats">
          <span>OVR<strong>${aOvr}</strong></span>
          <span>年齢<strong>${aAge}</strong></span>
          <span>勝<strong>${wA}</strong></span>
        </div>
      </div>
      <div class="np-rivalry-side">
        <div class="org-line">${bEmblem}<span>${bOrg}</span></div>
        <div class="name">${_npClickName(bName, b.id)}</div>
        <div class="role">${bRole}</div>
        <div class="stats">
          <span>OVR<strong>${bOvr}</strong></span>
          <span>年齢<strong>${bAge}</strong></span>
          <span>勝<strong>${wB}</strong></span>
        </div>
      </div>
    </div>
    <div class="np-rivalry-narrative">
      ${narrativeParas.map(p => `<p>${p}</p>`).join('')}
      <div style="text-align:right;font-size:10px;color:#7a5b32;margin-top:6px">${NP_KURODA_BYLINE.rivalry}</div>
    </div>
    <div class="np-rivalry-facts">${facts.join('')}</div>
  </div>`;

  // 過去対戦タイムライン
  html += `<div class="np-history">
    <div class="np-sec-gold">対戦の軌跡</div>`;
  if (h2h.history && h2h.history.length > 0) {
    html += `<div class="np-history-list">`;
    const recent = h2h.history.slice(-10).reverse();
    recent.forEach(h => {
      const isPlayerA = _isPlayerSide(G, a.id);
      const playerWin = h.win === 'A' ? isPlayerA : (h.win === 'B' ? !isPlayerA : null);
      const cls = playerWin === true ? 'win-player' : playerWin === false ? 'win-rival' : 'draw';
      const stageBadge = h.st === 'ppv' ? 'PPV' : h.st === 'war' ? '対抗戦' : '興行';
      const winnerName = h.win === 'A' ? aName : (h.win === 'B' ? bName : '——');
      const resultText = h.win === 'd' ? 'ドロー' : `${winnerName} 勝`;
      html += `<div class="np-history-row ${cls}">
        <div class="np-history-when">S${h.s}<span class="week-num">W${h.w}</span></div>
        <div>
          <div class="np-history-card">${aName} vs ${bName}</div>
          <div class="np-history-detail">${stageBadge}${h.t ? ` / ${h.t}T` : ''}</div>
        </div>
        <div class="np-history-result ${cls}">${resultText}<span class="mq">MQ${h.mq || '?'}</span></div>
      </div>`;
    });
    html += `</div>`;
  } else {
    // 個別履歴は無いが、サマリが残っている場合に概要を1行に集約して見せる
    const summaryBits = [];
    summaryBits.push(`通算<strong>${matches}</strong>戦`);
    if (wA || wB || dr) summaryBits.push(`${aName} <strong>${wA}</strong>勝 / ${bName} <strong>${wB}</strong>勝${dr ? ` / ${dr}分` : ''}`);
    if (h2h.bestMQ) summaryBits.push(`ベスト試合 MQ<strong>${h2h.bestMQ}</strong>`);
    if (h2h.lastMatch && h2h.lastMatch.season) summaryBits.push(`直近 S${h2h.lastMatch.season} W${h2h.lastMatch.week || '?'}`);
    if (h2h.hadTitleMatch) summaryBits.push(`タイトル戦経験<strong>あり</strong>`);
    if (h2h.hadPPV) summaryBits.push(`PPV経験<strong>あり</strong>`);
    if (matches > 0) {
      html += `<div class="np-history-summary-row">${summaryBits.join(' ・ ')}</div>`;
      html += `<div class="np-history-note">個別の試合データは記録に残っていない。次戦からは時系列で刻まれる。</div>`;
    } else {
      html += `<div class="np-empty-substory">対戦履歴はまだ刻まれていない。本紙としては、最初の一戦が組まれる日を待ちたい。</div>`;
    }
  }
  html += `</div>`;

  // 他にも続く因縁 — タグ別カラー/説明 + 団体名/エンブレム/戦績
  const TAG_DESC = {
    fated_admiration: { cls: 'respect', label: '熱', desc: '認め合うがゆえに、退けない関係' },
    pure_hatred: { cls: 'heat', label: '激', desc: '楽屋で目を合わせない、純粋な敵意' },
    destined_rival: { cls: 'heat', label: '宿', desc: '幾度も交差する宿命の軌道' },
    allied_rivalry: { cls: 'respect', label: '友', desc: '友情と闘志、矛盾しない関係' },
    bitter_feud: { cls: 'heat', label: '激', desc: '水と油、リングでも楽屋でも' },
    standard_rivalry: { cls: 'heat', label: '宿', desc: '拮抗する数字、燃える夜' },
    mutual_respect: { cls: 'respect', label: '敬', desc: '言葉なき信頼、リング上の敬意' },
    cold_rivalry: { cls: 'cold', label: '冷', desc: '言葉なき戦い、静かな確執' },
    casual_rivalry: { cls: 'cold', label: '緩', desc: '日々のリング上で続く小競り合い' },
  };

  if (relations && relations.length > 0) {
    html += `<div class="np-relations">
      <div class="np-sec-gold">他にも続く因縁(全業界)</div>
      <div class="np-relations-grid">`;
    relations.forEach(r => {
      const td = TAG_DESC[r.tag] || TAG_DESC.casual_rivalry;
      let summary = '';
      if (typeof KURODA_RELATION_NARRATIVE !== 'undefined' && KURODA_RELATION_NARRATIVE[r.tag] && KURODA_RELATION_NARRATIVE[r.tag].bodies) {
        const _bm = r.h2h.bestMQ || 0;
        const pool = (_bm >= 75)
          ? KURODA_RELATION_NARRATIVE[r.tag].bodies
          : KURODA_RELATION_NARRATIVE[r.tag].bodies.filter(fn => {
              try { return !/最高評価|bestMQ/.test(fn.toString()); } catch(e) { return true; }
            });
        if (pool.length > 0) {
          const rng = Engine.rng.create(Engine.rng.derive(seasonNum, weekNum, r.idA, r.idB, 0xC1B2));
          const fn = Engine.rng.pick(rng, pool);
          const yrs = _npH2HYearsApprox(r.h2h, G);
          try { summary = fn({ aName: r.charA.name, bName: r.charB.name, charA: r.charA.name, charB: r.charB.name, aOrg: _findFighterOrgName(G, r.idA), bOrg: _findFighterOrgName(G, r.idB), matches: r.h2h.matches || 0, bestMQ: r.h2h.bestMQ || 0, years: yrs, wA: r.h2h.winsA || 0, wB: r.h2h.winsB || 0 }); } catch(e) {}
        }
      }
      const aOrgKeyR = _npFindFighterOrgKey(G, r.idA);
      const bOrgKeyR = _npFindFighterOrgKey(G, r.idB);
      const aOrgNameR = _findFighterOrgName(G, r.idA);
      const bOrgNameR = _findFighterOrgName(G, r.idB);
      const wAR = r.h2h.winsA || 0, wBR = r.h2h.winsB || 0, drR = r.h2h.draws || 0;

      html += `<div class="np-relation-card">
        <div class="np-relation-card-head">
          <div class="np-relation-pair">
            <div class="np-relation-photo left" style="${_npThumbBg(r.idA)}" onclick="showFighterPopup(${r.idA})"></div>
            <span class="np-relation-vs">VS</span>
            <div class="np-relation-photo right" style="${_npThumbBg(r.idB)}" onclick="showFighterPopup(${r.idB})"></div>
          </div>
          <span class="np-relation-tag ${td.cls}" title="${td.desc}">${td.label}</span>
        </div>
        <div class="np-relation-card-names">${_npClickName(r.charA.name, r.idA)} × ${_npClickName(r.charB.name, r.idB)}</div>
        <div class="np-relation-org-line">${_npOrgEmblem(G, aOrgKeyR, 16)}<span>${aOrgNameR}</span><span class="vs">vs</span>${_npOrgEmblem(G, bOrgKeyR, 16)}<span>${bOrgNameR}</span></div>
        <div class="np-relation-card-text">${summary || `${r.charA.name}と${r.charB.name}。${r.h2h.matches || 0}戦のぶつかり合い。`}</div>
        <div class="np-relation-tag-desc">「${td.label}」: ${td.desc}</div>
        <div class="np-relation-stats">
          <span>通算<strong>${r.h2h.matches || 0}</strong>戦</span>
          <span>${wAR}勝-${wBR}勝${drR ? ` (${drR}分)` : ''}</span>
          <span>最高MQ<strong>${r.h2h.bestMQ || '?'}</strong></span>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  html += `</div></div>`;
  return html;
}

// ══════════════════════════════════════════════════════════════
// 4面: 年間MVPレース (MVPレース v2 / mvp-race-page4-final.html 準拠)
// ══════════════════════════════════════════════════════════════
function _npRenderPage4() {
  const seasonNum = G.season || 1, weekNum = G.week || 1;
  let html = `<div class="np-paper">${_npPaperHeader(seasonNum, weekNum)}<div class="np-content">`;

  const race = G.mvpRace;
  if (!race || !race.rankings || race.rankings.length === 0) {
    html += `<div class="np-sec-gold">📊 4面 ・ 年間MVPレース</div>`;
    html += `<div class="np-empty" style="padding:24px;text-align:center;color:#5b4b34;font-size:13px">📊 まだMVPレースのデータがない。週を進めると更新される。</div>`;
    html += `</div></div>`;
    return html;
  }

  html += `<div class="np-sec-gold">📊 4面 ・ 年間MVPレース</div>`;
  // 既存セーブでキャッシュ済みの古いテキストには 5.159999...pt のような小数が残っているので
  // レンダー時に整数化する (例: "5.16pt" / "0.000003pt" → "5pt" / "0pt")
  const _sanitizePts = (txt) => (txt || '').replace(/(\d+(?:\.\d+)?)pt/g, (_, n) => `${Math.round(parseFloat(n))}pt`);
  html += `<h2 class="np-page-headline">${_escapeHtml(_sanitizePts(race.pageHeadline))}</h2>`;
  html += `<p class="np-page-lead">${_escapeHtml(_sanitizePts(race.pageLead))}</p>`;
  html += `<div class="np-page-meta">第${weekNum}週時点 ・ 注目選手 上位三傑 ・ 全団体合同</div>`;

  // TOP3カード
  html += `<div class="np-mvprace-list">`;
  if (race.rankings[0]) html += _npMvpRaceRank1Card(race.rankings[0]);
  if (race.rankings[1]) html += _npMvpRaceMinorCard(race.rankings[1], 2);
  if (race.rankings[2]) html += _npMvpRaceMinorCard(race.rankings[2], 3);
  html += `</div>`;

  // 黒田寸評
  if (race.kurodaComment) {
    html += `<div class="np-kuroda">
      <div class="np-kuroda-face" style="background-image:url('${_npKurodaFaceUrl()}')"></div>
      <div>
        <div class="np-kuroda-text">${_escapeHtml(race.kurodaComment)}</div>
        <div class="np-kuroda-byline">— 編集長 黒田 貫一郎</div>
      </div>
    </div>`;
  }

  // 4-10位
  if (race.rankings.length > 3) {
    html += `<div class="np-mvprace-divider">— 4 位 以 下 ・ 追 走 集 団 —</div>`;
    for (let i = 3; i < race.rankings.length; i++) {
      html += _npMvpRaceListRow(race.rankings[i]);
    }
  }

  html += `</div></div>`;
  return html;
}

// ── 4面 補助: 矢印チップ ───────────────────────────
function _npMvpRaceArrowText(arrow, delta) {
  if (arrow === 'new') return '初登場';
  if (arrow === 'same') return '−';
  if (arrow === 'up') return `▲ ${delta || 1}`;
  if (arrow === 'down') return `▼ ${Math.abs(delta || 1)}`;
  return '';
}
function _npMvpRaceArrow1ChipText(arrow, prevRank) {
  if (arrow === 'new') return '初登場';
  if (arrow === 'same') return `前週 ${prevRank}位`;
  if (arrow === 'up') return `前週 ${prevRank}位 から上昇`;
  if (arrow === 'down') return `前週 ${prevRank}位 から下降`;
  return '';
}
function _npMvpRaceMetaChips(entry) {
  const m = entry.breakdown.meta;
  const chips = [];
  if (m.isCurrentChamp) chips.push(`<span class="np-mvprace-meta-chip champ">👑 現王者</span>`);
  if (m.role === 'Ace') chips.push(`<span class="np-mvprace-meta-chip">エース</span>`);
  else if (m.role === 'MidCarder' || m.role === 'Midcarder') chips.push(`<span class="np-mvprace-meta-chip">中堅</span>`);
  else if (m.role === 'Heel') chips.push(`<span class="np-mvprace-meta-chip">ヒール</span>`);
  else if (m.role === 'Babyface') chips.push(`<span class="np-mvprace-meta-chip">ベビーフェイス</span>`);
  else if (m.role === 'Veteran') chips.push(`<span class="np-mvprace-meta-chip">ベテラン</span>`);
  else if (m.role === 'Rookie' || m.role === 'Young') chips.push(`<span class="np-mvprace-meta-chip">新人</span>`);
  if (m.age > 0) chips.push(`<span class="np-mvprace-meta-chip">${m.age}歳</span>`);
  return chips.join('');
}
function _npMvpRaceOrgEmblemBg(orgId) {
  let path = '';
  if (orgId === 'player') {
    path = (typeof Engine !== 'undefined' && Engine.util && Engine.util.getPlayerOrgIconPath) ? Engine.util.getPlayerOrgIconPath(G) : '';
  } else if (typeof Engine !== 'undefined' && Engine.util && Engine.util.getOrgIconPath) {
    path = Engine.util.getOrgIconPath(G, orgId);
  }
  return path ? `background-image: url('${path}');` : '';
}

function _npMvpRaceRank1Card(entry) {
  const isPlayer = entry.orgId === 'player';
  const photoUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(entry.fighterId) : '';
  const photoBg = photoUrl ? `background-image: url('${photoUrl}');` : '';
  const embBg = _npMvpRaceOrgEmblemBg(entry.orgId);
  const arrowChip = _npMvpRaceArrow1ChipText(entry.arrow, entry.prevRank);
  const meta = _npMvpRaceMetaChips(entry);
  const bd = entry.breakdown;
  const m = bd.meta;
  const rich = (typeof Engine !== 'undefined' && Engine.mvpRace && Engine.mvpRace.generateRichBlocks)
    ? Engine.mvpRace.generateRichBlocks(entry, G) : { headlineLine: '', factChips: [], flavorLine: '' };
  const titleDetail = m.titleWins > 0 || m.titleDefenses > 0 || m.isCurrentChamp
    ? `奪取${m.titleWins}+防衛${m.titleDefenses}${m.isCurrentChamp ? '+保持' : ''}` : '王座なし';
  const ppvDetail = m.ppvChampion > 0 ? `優勝${m.ppvChampion}回` : (m.ppvRunnerUp > 0 ? `準V${m.ppvRunnerUp}回` : (m.ppvParticipation > 0 ? `出場${m.ppvParticipation}回` : '未開催'));
  const warDetail = (m.warWins + m.warLosses + m.warDraws) > 0
    ? `${m.warWins}勝${m.warLosses}敗${m.warDraws}分` : '出場なし';
  const domeDetail = m.domeAppearances > 0 ? `メイン${m.domeAppearances}回出場` : 'なし';
  const titleZero = bd.title === 0 ? ' zero' : '';
  const ppvZero = bd.ppv === 0 ? ' zero' : '';
  const warZero = bd.war === 0 ? ' zero' : '';
  const domeZero = bd.dome === 0 ? ' zero' : '';
  const drawZero = (bd.draw || 0) === 0 ? ' zero' : '';
  const drawPts = Math.round(bd.draw || 0);
  const drawDetail = `人気${Math.round(m.popularity || 0)}・集客${Math.round(m.drawPower || 0)}`;

  return `<div class="np-mvprace-card np-mvprace-card-1${isPlayer ? ' player' : ''}" onclick="event.stopPropagation();showFighterPopup(${entry.fighterId})">
    <div class="np-mvprace-photo">
      <div class="char-img-lg" style="${photoBg};width:100%;height:100%;background-size:cover;background-position:center top;background-repeat:no-repeat;background-color:#2a1a10"></div>
      <div class="np-mvprace-rank-overlay"><span class="lbl">順位</span>1</div>
      <div class="np-mvprace-emb-overlay" style="${embBg}"></div>
    </div>
    <div class="np-mvprace-info">
      <div class="np-mvprace-name-row">
        <div class="np-mvprace-name">${_escapeHtml(entry.fighterName)}</div>
        <span class="np-mvprace-arrow ${entry.arrow}">${_escapeHtml(arrowChip)}</span>
      </div>
      <div class="np-mvprace-meta">${meta}</div>
      <div class="np-mvprace-stats">
        <div class="np-mvprace-stat-box ovr"><span class="lbl">OVR</span><strong>${entry.ovr}</strong></div>
        <div class="np-mvprace-stat-box pts"><span class="lbl">ポイント</span><strong>${Math.round(entry.points)}<span class="unit">pt</span></strong></div>
      </div>
      ${entry.narrative ? `<div class="np-mvprace-narrative">${_escapeHtml(entry.narrative)}</div>` : ''}
      ${rich.headlineLine ? `<div class="np-mvprace-rich-line">${_escapeHtml(rich.headlineLine)}</div>` : ''}
      <div class="np-mvprace-badges">
        <div class="np-mvprace-badge${titleZero}">
          <div class="icon-row">👑<span class="lbl">王者</span></div>
          <div class="pts">+${bd.title}</div>
          <div class="detail">${_escapeHtml(titleDetail)}</div>
        </div>
        <div class="np-mvprace-badge${domeZero}">
          <div class="icon-row">🏟<span class="lbl">ドーム</span></div>
          <div class="pts">+${bd.dome}</div>
          <div class="detail">${_escapeHtml(domeDetail)}</div>
        </div>
        <div class="np-mvprace-badge${warZero}">
          <div class="icon-row">⚔<span class="lbl">対抗戦</span></div>
          <div class="pts">+${bd.war}</div>
          <div class="detail">${_escapeHtml(warDetail)}</div>
        </div>
        <div class="np-mvprace-badge${ppvZero}">
          <div class="icon-row">🏆<span class="lbl">PPV</span></div>
          <div class="pts">+${bd.ppv}</div>
          <div class="detail">${_escapeHtml(ppvDetail)}</div>
        </div>
        <div class="np-mvprace-badge${drawZero}">
          <div class="icon-row">⭐<span class="lbl">人気</span></div>
          <div class="pts">+${drawPts}</div>
          <div class="detail">${_escapeHtml(drawDetail)}</div>
        </div>
      </div>
    </div>
  </div>`;
}

function _npMvpRaceMinorCard(entry, rank) {
  const isPlayer = entry.orgId === 'player';
  const photoUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(entry.fighterId) : '';
  const photoBg = photoUrl ? `background-image: url('${photoUrl}');` : '';
  const embBg = _npMvpRaceOrgEmblemBg(entry.orgId);
  const arrowText = _npMvpRaceArrowText(entry.arrow, entry.arrowDelta);
  const m = entry.breakdown.meta;
  const bd = entry.breakdown;
  const role = (m.role === 'Ace') ? 'エース'
    : (m.role === 'MidCarder' || m.role === 'Midcarder') ? '中堅'
    : (m.role === 'Heel') ? 'ヒール'
    : (m.role === 'Babyface') ? 'ベビーフェイス'
    : (m.role === 'Rookie' || m.role === 'Young') ? '新人'
    : (m.role === 'Veteran') ? 'ベテラン' : '';

  // ピル: 王者 / PPV / 対抗戦 / ドーム / 大試合 (上位4のみ表示)
  const pillCandidates = [
    { icon: '👑', label: '王者', val: bd.title },
    { icon: '🏆', label: 'PPV', val: bd.ppv },
    { icon: '⚔', label: '対抗戦', val: bd.war },
    { icon: '🏟', label: 'ドーム', val: bd.dome },
    { icon: '🥊', label: '大試合', val: bd.mq },
    { icon: '⭐', label: '人気', val: Math.round(bd.draw || 0) },
  ];
  pillCandidates.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
  const pills = pillCandidates.slice(0, 4).map(p => {
    const zero = p.val === 0 ? ' zero' : '';
    const sign = p.val >= 0 ? '+' : '';
    return `<span class="np-mvprace-minor-pill${zero}">${p.icon} ${p.label}<strong>${sign}${p.val}</strong></span>`;
  }).join('');
  const rich = (typeof Engine !== 'undefined' && Engine.mvpRace && Engine.mvpRace.generateRichBlocks)
    ? Engine.mvpRace.generateRichBlocks(entry, G) : { headlineLine: '', factChips: [], flavorLine: '' };
  const factChipsHtml = rich.factChips && rich.factChips.length > 0
    ? `<div class="np-mvprace-fact-chips">${rich.factChips.map(c => `<span class="np-mvprace-fact-chip">${c.icon} ${_escapeHtml(c.text)}</span>`).join('')}</div>` : '';
  const flavorHtml = rich.flavorLine
    ? `<div class="np-mvprace-flavor">${_escapeHtml(rich.flavorLine)}</div>` : '';

  return `<div class="np-mvprace-card np-mvprace-card-minor np-mvprace-rank-${rank}${isPlayer ? ' player' : ''}" onclick="event.stopPropagation();showFighterPopup(${entry.fighterId})">
    <div class="np-mvprace-photo-mini">
      <div class="char-img-lg" style="${photoBg};width:100%;height:100%;background-size:cover;background-position:center top;background-repeat:no-repeat;background-color:#2a1a10"></div>
      <div class="np-mvprace-rank-mini">${rank}</div>
      <div class="np-mvprace-emb-mini" style="${embBg}"></div>
    </div>
    <div class="np-mvprace-minor-mid">
      <div class="np-mvprace-minor-name-row">
        <div class="np-mvprace-minor-name">${_escapeHtml(entry.fighterName)}</div>
        ${arrowText ? `<span class="np-mvprace-minor-arrow ${entry.arrow}">${_escapeHtml(arrowText)}</span>` : ''}
      </div>
      <div class="np-mvprace-minor-meta">${_escapeHtml(entry.orgName)}${role ? `<span class="div">/</span><span>${role}</span>` : ''}${m.age ? `<span class="div">/</span><span>${m.age}歳</span>` : ''}</div>
      ${entry.narrative ? `<div class="np-mvprace-minor-narrative">${_escapeHtml(entry.narrative)}</div>` : ''}
      ${factChipsHtml}
      ${flavorHtml}
      <div class="np-mvprace-minor-pills">${pills}</div>
    </div>
    <div class="np-mvprace-minor-num">
      <div class="np-mvprace-minor-num-box ovr"><span class="lbl">OVR</span><strong>${entry.ovr}</strong></div>
      <div class="np-mvprace-minor-num-box pts"><span class="lbl">ポイント</span><strong>${Math.round(entry.points)}</strong></div>
    </div>
  </div>`;
}

function _npMvpRaceListRow(entry) {
  const isPlayer = entry.orgId === 'player';
  const thumbUrl = (typeof getPortraitUrl === 'function') ? getPortraitUrl(entry.fighterId) : '';
  const thumbBg = thumbUrl ? `background-image: url('${thumbUrl}');` : '';
  const embBg = _npMvpRaceOrgEmblemBg(entry.orgId);
  const arrowText = _npMvpRaceArrowText(entry.arrow, entry.arrowDelta);
  const m = entry.breakdown && entry.breakdown.meta || {};
  const role = (m.role === 'Ace') ? 'エース'
    : (m.role === 'MidCarder' || m.role === 'Midcarder') ? '中堅'
    : (m.role === 'Heel') ? 'ヒール'
    : (m.role === 'Babyface') ? 'ベビーフェイス'
    : (m.role === 'Rookie' || m.role === 'Young') ? '新人'
    : (m.role === 'Veteran') ? 'ベテラン' : '';
  const champBadge = m.isCurrentChamp ? `<span class="np-mvprace-list-champ">👑 現王者</span>` : '';
  const rich = (typeof Engine !== 'undefined' && Engine.mvpRace && Engine.mvpRace.generateRichBlocks)
    ? Engine.mvpRace.generateRichBlocks(entry, G) : { headlineLine: '', factChips: [], flavorLine: '' };
  const factChipsHtml = rich.factChips && rich.factChips.length > 0
    ? `<div class="np-mvprace-list-facts">${rich.factChips.map(c => `<span class="np-mvprace-fact-chip">${c.icon} ${_escapeHtml(c.text)}</span>`).join('')}</div>` : '';
  const flavorHtml = rich.flavorLine
    ? `<div class="np-mvprace-list-flavor">${_escapeHtml(rich.flavorLine)}</div>`
    : (entry.tagline ? `<div class="np-mvprace-list-flavor">${_escapeHtml(entry.tagline)}</div>` : '');
  const metaLine = [role, m.age ? `${m.age}歳` : ''].filter(Boolean).join(' / ');

  return `<div class="np-mvprace-list-row np-mvprace-list-row--rich${isPlayer ? ' player' : ''}" onclick="event.stopPropagation();showFighterPopup(${entry.fighterId})">
    <div class="np-mvprace-list-rank">${entry.rank}</div>
    <div class="np-mvprace-list-arrow ${entry.arrow}">${_escapeHtml(arrowText)}</div>
    <div class="np-mvprace-list-thumb" style="${thumbBg}"></div>
    <div class="np-mvprace-list-emb" style="${embBg}"></div>
    <div class="np-mvprace-list-name">
      <div class="name-line">
        <strong>${_escapeHtml(entry.fighterName)}</strong>
        <span class="org">${_escapeHtml(entry.orgName)}</span>
        ${champBadge}
      </div>
      ${metaLine ? `<div class="np-mvprace-list-metaline">${_escapeHtml(metaLine)}</div>` : ''}
    </div>
    <div class="np-mvprace-list-ovr"><span class="lbl">OVR</span><strong>${entry.ovr}</strong></div>
    <div class="np-mvprace-list-pts">${Math.round(entry.points)}<span class="lbl">pt</span></div>
    ${factChipsHtml}
    ${flavorHtml}
  </div>`;
}

// ── HTMLエスケープ ───────────────────────────────────
function _escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── 📰 新聞 1面 描画 (旧 _renderDbNewspaper を流用) ───────────
function _renderDbNewspaper() {
  const archive = G.newspaperArchive || [];
  const archiveTotal = archive.length;

  // アーカイブインデックスの範囲補正
  if (_newspaperArchiveIdx >= archiveTotal) _newspaperArchiveIdx = archiveTotal - 1;

  // 表示対象の新聞を決定
  let wp;
  if (_newspaperArchiveIdx < 0) {
    wp = G.weeklyNewspaper; // 最新号
  } else {
    wp = archive[_newspaperArchiveIdx];
  }
  const d = G.currentNewspaper; // フォールバック用

  // weeklyNewspaper もなく currentNewspaper もない場合
  if (!wp && !d && _newspaperArchiveIdx < 0) {
    return `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);line-height:2;">
      📰 現在の新聞はありません<br>
      <span style="font-size:12px;color:var(--text-sub);">次の週に進むと新聞が届きます</span></div>`;
  }

  // フォールバック: 旧セーブで weeklyNewspaper がない場合は旧形式
  if (!wp && d && _newspaperArchiveIdx < 0) return _renderDbNewspaperLegacy(d);

  // アーカイブの新聞がnullの場合（境界）
  if (!wp) {
    _newspaperArchiveIdx = -1;
    wp = G.weeklyNewspaper;
    if (!wp) return `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);line-height:2;">📰 新聞がありません</div>`;
  }

  // ── バックナンバーナビ ──
  const isLatest = _newspaperArchiveIdx < 0;
  const canOlder = _newspaperArchiveIdx < archiveTotal - 1;
  const canNewer = !isLatest;
  let archiveNav = '';
  if (archiveTotal > 0) {
    const label = isLatest ? '最新号' : `バックナンバー ${_newspaperArchiveIdx + 1}/${archiveTotal}`;
    archiveNav = `<div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:10px auto 4px;max-width:560px;">
      ${canNewer ? `<button class="btn" style="padding:5px 12px;font-size:12px;" onclick="setNewspaperArchiveIdx(${_newspaperArchiveIdx - 1})">◀ 次の号</button>` : ''}
      <span style="font-size:12px;color:var(--text-dim);min-width:120px;text-align:center;">${label}</span>
      ${canOlder ? `<button class="btn" style="padding:5px 12px;font-size:12px;" onclick="setNewspaperArchiveIdx(${isLatest ? 0 : _newspaperArchiveIdx + 1})">前の号 ▶</button>` : ''}
      ${!isLatest ? `<button class="btn btn-gold" style="padding:5px 12px;font-size:12px;" onclick="setNewspaperArchiveIdx(-1)">最新号</button>` : ''}
    </div>`;
  }

  // ページ送りナビ（複数ページ時）
  const hasPages = wp.pages && wp.pages.length > 0 && wp.pages.some(Boolean);
  let pageNav = '';
  if (hasPages) {
    const totalExtra = wp.pages.filter(Boolean).length;
    pageNav += `<div style="display:flex;justify-content:center;gap:8px;margin:12px auto;max-width:560px">`;
    pageNav += `<button class="btn${_newspaperPage === 0 ? ' btn-gold' : ''}" style="padding:6px 14px;font-size:12px" onclick="setNewspaperPage(0)">1面</button>`;
    wp.pages.forEach((pg, idx) => {
      if (!pg) return;
      pageNav += `<button class="btn${_newspaperPage === idx + 1 ? ' btn-gold' : ''}" style="padding:6px 14px;font-size:12px" onclick="setNewspaperPage(${idx + 1})">${pg.title || (idx + 2) + '面'}</button>`;
    });
    pageNav += `</div>`;
  }

  // 特集ページ表示時は1面をスキップ
  if (hasPages && _newspaperPage > 0) {
    const pageData = wp.pages[_newspaperPage - 1];
    if (pageData && pageData.stories) {
      return archiveNav + pageNav + _renderNewspaperExtraPage(wp, pageData);
    }
  }

  const kurodaFace = typeof getNpcPortraitUrl === 'function' ? getNpcPortraitUrl('reporter') : '';
  const kurodaIcon = kurodaFace ? `<img src="${kurodaFace}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">` : '';

  // ── ヘッダー ──
  let html = `<div style="max-width:560px;margin:12px auto;display:grid;gap:0;background:linear-gradient(180deg,#f8eed2 0%,#f0e0ba 100%);color:#1f1710;border:1px solid rgba(120,84,39,0.32);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.25);overflow:hidden;">`;
  html += `<div style="background:linear-gradient(90deg,#8b1a1a,#c22020);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;">
    <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:2px;">週刊グラップル</div>
    <div style="font-size:16px;font-weight:900;color:#fff;letter-spacing:1px;">シーズン${wp.season || '?'} 第${wp.week || '?'}週</div>
  </div>`;

  // ── 一面記事 ──
  if (wp.topStory) {
    const ts = wp.topStory;
    const isPlayerStory = ts.type === 'playerShowTitle' || ts.type === 'playerShowNormal';
    const charPort = ts.characterId && typeof getPortraitUrl === 'function' ? getPortraitUrl(ts.characterId) : '';

    const tsC = _newsStoryClickable(ts);
    // 額装写真: upper(バスト) → portrait(顔) の順でフォールバック
    const charUpper = ts.characterId && typeof getUpperUrl === 'function' ? getUpperUrl(ts.characterId) : '';
    const photoSrc = charUpper || charPort || '';
    const photoHtml = photoSrc
      ? `<div class="newspaper-photo-frame" style="width:200px;height:240px;"><img src="${photoSrc}" alt=""></div>`
      : '';
    html += `<div style="padding:16px 20px 12px;border-bottom:1px solid rgba(95,69,35,0.18);">
      <div class="news-sec-label">一面記事</div>
      <div style="display:flex;gap:14px;align-items:flex-start;">
        ${photoHtml}
        <div style="flex:1;min-width:0;">
          <div style="font-size:20px;line-height:1.2;font-weight:1000;margin-bottom:6px;">${tsC.headline}</div>
          <div style="font-size:13px;line-height:1.75;color:#3a2e1c;">${tsC.body}</div>
        </div>
      </div>`;
    // 対抗戦記事: 個別試合結果表示
    if (ts.warData && ts.warData.matches) {
      html += `<div style="margin-top:8px;font-size:12px;line-height:1.8;">`;
      ts.warData.matches.forEach((m, i) => {
        const icon = m.playerWon ? '🔵' : '🔴';
        const pName = _newsClickableName(m.playerName, m.playerId);
        const aName = _newsClickableName(m.aiName, m.aiId);
        html += `<div>${icon} 第${i+1}試合: ${pName} vs ${aName} → ${m.playerWon ? pName : aName} (MQ${m.mq})</div>`;
      });
      html += `</div>`;
    }
    // 一面が他団体ニュースのとき黒田コメント
    if (!isPlayerStory && kurodaIcon) {
      const newsRng = Engine.rng.create(Engine.rng.derive(wp.season || 1, wp.week || 1, 0xC0DA));
      const commentPool = _getKurodaNewsComment(ts.type);
      if (commentPool.length > 0) {
        const fn = Engine.rng.pick(newsRng, commentPool);
        let commentText = '';
        try { commentText = fn({ headline: ts.headline, orgName: '' }); } catch(e) {}
        if (commentText) {
          html += `<div style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;padding:8px 10px;border-radius:8px;background:rgba(200,190,170,0.22);">
            ${kurodaIcon}
            <div style="font-size:12px;line-height:1.7;color:#4a3518;">「${commentText}」<span style="font-size:10px;color:#7a5b32;">——黒田幸子</span></div>
          </div>`;
        }
      }
    }
    html += `</div>`;
  }

  // ── 自団体興行結果（playerShowData がある場合のみ） ──
  if (wp.playerShowData) {
    html += _renderNewspaperPlayerShow(wp.playerShowData);
  }

  // ── 他団体動向（subStories） ──
  if (wp.subStories && wp.subStories.length > 0) {
    html += `<div style="padding:12px 20px;border-top:1px solid rgba(95,69,35,0.15);">
      <div class="news-sec-label-gold">他団体ニュース</div>
      <div class="other-org-news-grid">`;
    wp.subStories.forEach((ss, idx) => {
      const ssPort = ss.characterId && typeof getPortraitUrl === 'function' ? getPortraitUrl(ss.characterId) : '';
      const ssName = ss.characterId ? (ALL_CHARS.find(c => c.id === ss.characterId)?.name || '?') : '?';
      const ssC = _newsStoryClickable(ss);
      const ssPortHtml = ssPort
        ? `<img src="${ssPort}" alt="" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;border:2px solid rgba(106,56,144,0.3);box-shadow:0 0 6px rgba(106,56,144,0.15);">`
        : `<div style="width:36px;height:36px;border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:900;background:linear-gradient(135deg,#3a2050,#2a1440);color:#b088d0;border:2px solid rgba(106,56,144,0.3);box-shadow:0 0 6px rgba(106,56,144,0.15);flex-shrink:0;">${ssName.charAt(0)}</div>`;

      // 取材モード寸評(KURODA_NEWS_COMMENT)
      let kurodaQuote = '';
      const cPool = _getKurodaNewsComment(ss.type);
      if (cPool && cPool.length > 0 && kurodaFace) {
        const cRng = Engine.rng.create(Engine.rng.derive(wp.season || 1, wp.week || 1, idx, 0xC0DC));
        const fn = Engine.rng.pick(cRng, cPool);
        let txt = '';
        try { txt = fn({ headline: ss.headline, orgName: '' }); } catch(e) {}
        if (txt) {
          kurodaQuote = `<div class="kuroda-block" style="margin:6px 0 0;padding:6px 8px">
            <img src="${kurodaFace}" class="kuroda-face" alt="" style="width:28px;height:28px">
            <div class="body" style="font-size:11px;line-height:1.6">「${txt}」<span class="sig" style="margin-top:2px;font-size:9px">——黒田幸子</span></div>
          </div>`;
        }
      }

      html += `<div class="other-org-card">
        <div class="other-org-card-head">
          ${ssPortHtml}
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:800;line-height:1.3;">${ssC.headline}</div>
            <div style="font-size:12px;line-height:1.6;color:#5b4b34;margin-top:2px;">${ssC.body}</div>
          </div>
        </div>
        ${kurodaQuote}
      </div>`;
    });
    html += `</div></div>`;
  }

  // ── 次回展望 ──
  if (wp.preview) {
    html += _renderNewspaperPreview({ preview: wp.preview, generatedSeason: wp.season, generatedWeek: wp.week });
  }

  html += `</div>`;
  return archiveNav + pageNav + html;
}

// ── 自団体興行結果セクション（新聞v2内部用） ──
function _renderNewspaperPlayerShow(d) {
  if (!d || !d.left || !d.right) return '';
  const pLeft = getPortraitUrl(d.left.id);
  const pRight = getPortraitUrl(d.right.id);
  const leftWin = !d.isDraw && d.winner && d.winner.id === d.left.id;
  const rightWin = !d.isDraw && d.winner && d.winner.id === d.right.id;
  const lPct = Math.max(0, Math.min(100, Math.round(((d.hpLeft?.final || 0) / Math.max(1, d.hpLeft?.max || 1)) * 100)));
  const rPct = Math.max(0, Math.min(100, Math.round(((d.hpRight?.final || 0) / Math.max(1, d.hpRight?.max || 1)) * 100)));
  const portrait = (url, fallback, extra='') => url
    ? `<img src="${url}" alt="" style="width:80px;height:80px;border-radius:10px;object-fit:cover;border:2px solid rgba(82,53,23,0.25);${extra}">`
    : `<div style="width:80px;height:80px;border-radius:10px;display:grid;place-items:center;font-size:12px;font-weight:900;color:#fff;${extra}">${fallback?.name || '?'}</div>`;

  const articleHtml = d.article
    ? `<div style="font-size:12.5px;line-height:1.8;color:#3a2e1c;padding:8px 0 4px;text-indent:1em;">${d.article}</div>`
    : '';

  const leftLink = _newsClickableName(d.left.name, d.left.id);
  const rightLink = _newsClickableName(d.right.name, d.right.id);
  const winnerLink = d.winner ? _newsClickableName(d.winner.name, d.winner.id) : '';
  const tagMembers = team => (team?.members || [])
    .filter(f => f && f.name)
    .map(f => f.id ? _newsClickableName(f.name, f.id) : f.name)
    .join(' / ');
  const tagPortraits = (team, isWinner, side) => {
    const members = (team?.members || []).filter(f => f && f.id).slice(0, 2);
    if (members.length === 0) return '';
    return `<div style="display:flex;gap:4px;justify-content:center;align-items:center;">` + members.map(f => {
      const url = getPortraitUrl(f.id);
      const bg = side === 'right' ? 'background:linear-gradient(180deg,#ff8396,#9f213f);' : 'background:linear-gradient(180deg,#4f8fff,#1d49aa);';
      return url
        ? `<img src="${url}" alt="" title="${f.name}" onclick="showFighterPopup(${f.id})" style="width:46px;height:46px;border-radius:8px;object-fit:cover;border:2px solid rgba(82,53,23,0.25);cursor:pointer;${isWinner ? 'outline:2px solid rgba(240,212,139,0.75);' : ''}${bg}">`
        : `<div title="${f.name}" onclick="showFighterPopup(${f.id})" style="width:46px;height:46px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:900;color:#fff;cursor:pointer;${isWinner ? 'outline:2px solid rgba(240,212,139,0.75);' : ''}${bg}">${f.name.charAt(0)}</div>`;
    }).join('') + `</div>`;
  };

  let html = `<div style="padding:14px 20px 12px;border-top:1px solid rgba(95,69,35,0.15);">
    <div class="news-sec-label">興行結果</div>
    <div style="font-size:16px;font-weight:1000;margin-bottom:8px;">${d.headline || '定期興行'}</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-bottom:8px;">
      <div style="display:grid;justify-items:center;gap:4px;">
        ${d.isTag && d.teamA ? tagPortraits(d.teamA, leftWin, 'left') : portrait(pLeft, d.left, leftWin ? 'outline:3px solid rgba(240,212,139,0.75);background:linear-gradient(180deg,#4f8fff,#1d49aa);' : 'background:linear-gradient(180deg,#4f8fff,#1d49aa);')}
        <div style="font-size:13px;font-weight:900;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.4);">${leftLink}</div>
        ${d.isTag && d.teamA ? `<div style="font-size:10px;line-height:1.35;color:#5b4b34;text-align:center;">${tagMembers(d.teamA)}</div>` : ''}
      </div>
      <div style="text-align:center;">
        <div style="font-size:24px;font-weight:1000;color:#9b1212;">${d.isDraw ? 'DRAW' : 'VS'}</div>
        <div style="font-size:9px;font-weight:900;color:#b9892a;letter-spacing:0.1em;margin-top:2px;">${d.isDraw ? 'TIME LIMIT' : 'WINNER'}</div>
      </div>
      <div style="display:grid;justify-items:center;gap:4px;">
        ${d.isTag && d.teamB ? tagPortraits(d.teamB, rightWin, 'right') : portrait(pRight, d.right, rightWin ? 'outline:3px solid rgba(240,212,139,0.75);background:linear-gradient(180deg,#ff8396,#9f213f);' : 'background:linear-gradient(180deg,#ff8396,#9f213f);')}
        <div style="font-size:13px;font-weight:900;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.4);">${rightLink}</div>
        ${d.isTag && d.teamB ? `<div style="font-size:10px;line-height:1.35;color:#5b4b34;text-align:center;">${tagMembers(d.teamB)}</div>` : ''}
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 8px;border:1px solid rgba(125,95,50,0.20);border-radius:8px;background:rgba(200,190,170,0.18);font-size:12px;">
      <div style="font-weight:900;">${d.isDraw ? 'Time-limit draw' : `${winnerLink} wins`}</div>
      <div style="color:#5b4b34;">${d.finishLabel}${d.turns ? ` / ${d.turns}T` : ''}</div>
      <div style="color:#5b4b34;">MQ <strong style="font-size:16px;color:#15120d;">${d.mq}</strong></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
      <div style="padding:6px 8px;border:1px solid rgba(125,95,50,0.20);border-radius:8px;background:rgba(200,190,170,0.14);">
        <label style="font-size:10px;color:#6a5e4c;">${leftLink}</label>
        <div style="font-size:11px;font-weight:700;">HP ${d.hpLeft.final}/${d.hpLeft.max}</div>
        <div style="height:5px;border-radius:999px;background:rgba(38,31,20,0.12);overflow:hidden;margin-top:2px;"><span style="display:block;height:100%;width:${lPct}%;background:${lPct > 30 ? '#44d18e' : lPct > 10 ? '#d9ab45' : '#ef6277'}"></span></div>
      </div>
      <div style="padding:6px 8px;border:1px solid rgba(125,95,50,0.20);border-radius:8px;background:rgba(200,190,170,0.14);">
        <label style="font-size:10px;color:#6a5e4c;">${rightLink}</label>
        <div style="font-size:11px;font-weight:700;">HP ${d.hpRight.final}/${d.hpRight.max}</div>
        <div style="height:5px;border-radius:999px;background:rgba(38,31,20,0.12);overflow:hidden;margin-top:2px;"><span style="display:block;height:100%;width:${rPct}%;background:${rPct > 30 ? '#44d18e' : rPct > 10 ? '#d9ab45' : '#ef6277'}"></span></div>
      </div>
    </div>
    ${articleHtml}
    ${_renderNewspaperInjuries(d)}
    ${_renderNewspaperShowRating(d)}
    ${_renderNewspaperDigest(d)}
  </div>`;
  return html;
}

// ── 旧形式新聞（フォールバック用） ──
function _renderDbNewspaperLegacy(d) {
  const pLeft = d.left ? getPortraitUrl(d.left.id) : '';
  const pRight = d.right ? getPortraitUrl(d.right.id) : '';
  const leftWin = !d.isDraw && d.winner && d.winner.id === d.left.id;
  const rightWin = !d.isDraw && d.winner && d.winner.id === d.right.id;
  const lPct = Math.max(0, Math.min(100, Math.round(((d.hpLeft?.final || 0) / Math.max(1, d.hpLeft?.max || 1)) * 100)));
  const rPct = Math.max(0, Math.min(100, Math.round(((d.hpRight?.final || 0) / Math.max(1, d.hpRight?.max || 1)) * 100)));
  const portrait = (url, fallback, extra='') => url
    ? `<img src="${url}" alt="" style="width:110px;height:110px;border-radius:14px;object-fit:cover;border:3px solid rgba(82,53,23,0.28);box-shadow:0 10px 24px rgba(0,0,0,0.15);${extra}">`
    : `<div style="width:110px;height:110px;border-radius:14px;display:grid;place-items:center;font-size:14px;font-weight:900;color:#fff;box-shadow:0 10px 24px rgba(0,0,0,0.15);${extra}">${fallback?.name || '?'}</div>`;
  const articleHtml = d.article
    ? `<div style="font-size:13.5px;line-height:1.85;color:#3a2e1c;padding:12px 4px 4px;text-indent:1em;border-top:1px solid rgba(95,69,35,0.15);">${d.article}</div>`
    : '';
  return `
    <div style="max-width:520px;margin:12px auto;display:grid;gap:12px;padding:20px 22px 18px;background:linear-gradient(180deg,#f8eed2 0%,#f0e0ba 100%);color:#1f1710;border:1px solid rgba(120,84,39,0.32);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
      <div style="display:flex;justify-content:space-between;align-items:end;gap:12px;border-bottom:3px double rgba(95,69,35,0.45);padding-bottom:10px;">
        <div style="flex:1;">
          <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#7a5b32;font-weight:900;">Extra Edition</div>
          <div style="font-size:26px;line-height:1.15;font-weight:1000;letter-spacing:0.02em;">${d.headline}</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#6a5435;white-space:nowrap;">${d.showName}<br>${d.venueName}</div>
      </div>
      <div style="font-size:13px;line-height:1.6;color:#5b4b34;border-bottom:1px solid rgba(95,69,35,0.18);padding-bottom:10px;">${d.subheadline}</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;">
        <div style="display:grid;justify-items:center;gap:5px;">
          ${portrait(pLeft, d.left, leftWin ? 'outline:4px solid rgba(240,212,139,0.75);transform:scale(1.04);background:linear-gradient(180deg,#4f8fff,#1d49aa);' : 'background:linear-gradient(180deg,#4f8fff,#1d49aa);')}
          <div style="font-size:15px;font-weight:900;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.4);">${d.left.name}</div>
        </div>
        <div style="display:grid;justify-items:center;gap:6px;padding-bottom:10px;">
          <div style="font-size:36px;letter-spacing:0.08em;font-weight:1000;color:#9b1212;">${d.isDraw ? 'DRAW' : 'VS'}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:linear-gradient(135deg,#d9ab45,#b9892a);color:#16120b;font-size:10px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">${d.isDraw ? 'Time Limit' : 'Winner'}</div>
        </div>
        <div style="display:grid;justify-items:center;gap:5px;">
          ${portrait(pRight, d.right, rightWin ? 'outline:4px solid rgba(240,212,139,0.75);transform:scale(1.04);background:linear-gradient(180deg,#ff8396,#9f213f);' : 'background:linear-gradient(180deg,#ff8396,#9f213f);')}
          <div style="font-size:15px;font-weight:900;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.4);">${d.right.name}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 10px;border:1px solid rgba(125,95,50,0.24);border-radius:10px;background:rgba(200,190,170,0.22);">
        <div style="font-size:14px;font-weight:900;">${d.isDraw ? 'Time-limit draw' : `${d.winner.name} wins`}</div>
        <div style="font-size:12px;color:#5b4b34;">${d.finishLabel}${d.turns ? ` / ${d.turns}T` : ''}</div>
        <div style="font-size:13px;color:#5b4b34;">MQ <strong style="font-size:20px;color:#15120d;">${d.mq}</strong></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="display:grid;gap:4px;padding:8px 10px;border:1px solid rgba(125,95,50,0.24);border-radius:10px;background:rgba(200,190,170,0.18);">
          <label style="font-size:11px;color:#6a5e4c;">${d.left.name}</label>
          <strong style="font-size:12px;">HP ${d.hpLeft.final}/${d.hpLeft.max}</strong>
          <div style="height:6px;border-radius:999px;background:rgba(38,31,20,0.12);overflow:hidden"><span style="display:block;height:100%;width:${lPct}%;background:${lPct > 30 ? '#44d18e' : lPct > 10 ? '#d9ab45' : '#ef6277'}"></span></div>
        </div>
        <div style="display:grid;gap:4px;padding:8px 10px;border:1px solid rgba(125,95,50,0.24);border-radius:10px;background:rgba(200,190,170,0.18);">
          <label style="font-size:11px;color:#6a5e4c;">${d.right.name}</label>
          <strong style="font-size:12px;">HP ${d.hpRight.final}/${d.hpRight.max}</strong>
          <div style="height:6px;border-radius:999px;background:rgba(38,31,20,0.12);overflow:hidden"><span style="display:block;height:100%;width:${rPct}%;background:${rPct > 30 ? '#44d18e' : rPct > 10 ? '#d9ab45' : '#ef6277'}"></span></div>
        </div>
      </div>
      ${articleHtml}
      ${_renderNewspaperShowRating(d)}
      ${_renderNewspaperDigest(d)}
      ${_renderNewspaperPreview(d)}
    </div>`;
}

// ── 黒田ニュースコメント取得（他団体ニュース用） ──
function _getKurodaNewsComment(storyType) {
  // KURODA_NEWS_COMMENT が定義されていればそれを使う、なければ汎用コメント
  if (typeof KURODA_NEWS_COMMENT !== 'undefined' && KURODA_NEWS_COMMENT[storyType]) {
    return KURODA_NEWS_COMMENT[storyType];
  }
  // フォールバック: インライン汎用コメント
  return [
    () => '業界の動きは速い。目を離す暇はない',
    () => '他団体の動向は、回り回って我々にも影響する',
    () => '注視すべきニュースだ',
  ];
}

// ── 興行総合評価セクション ──
function _renderNewspaperShowRating(d) {
  if (!d.showRating) return '';
  const { stars } = d.showRating;
  const starHtml = '★'.repeat(stars) + '☆'.repeat(5 - stars);

  // seeded pick from KURODA_SHOW_RATING
  const ratingKey = `stars${stars}`;
  const pool = (typeof KURODA_SHOW_RATING !== 'undefined' && KURODA_SHOW_RATING[ratingKey]) || [];
  let commentText = '';
  if (pool.length > 0) {
    const seed = Engine.rng.derive(d.generatedSeason || 1, d.generatedWeek || 1, 0xC5A1);
    const rng = Engine.rng.create(seed);
    const fn = Engine.rng.pick(rng, pool);
    try { commentText = fn({ playerName: G.orgName || '我が団体', avgMQ: d.avgMQ || 0 }); } catch(e) { commentText = ''; }
  }
  const kurodaFace = typeof getNpcPortraitUrl === 'function' ? getNpcPortraitUrl('reporter') : '';

  return `
    <div class="news-show-rating">
      <div style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:10px;">
        <div class="news-rating-stars" style="margin-bottom:0">${starHtml}</div>
        <div style="font-size:12px;font-weight:900;color:#5b4b34;">観客満足度 ${(stars).toFixed(1)}</div>
      </div>
      ${commentText ? `<div class="news-rating-comment">
        ${kurodaFace ? `<img src="${kurodaFace}" class="news-kuroda-face" style="background:linear-gradient(135deg,#3a1a1a,#2a0a0a);border:2px solid rgba(139,26,26,0.5);box-shadow:0 0 6px rgba(139,26,26,0.2);" alt="">` : ''}
        <p>「${commentText}」</p>
      </div>` : ''}
    </div>`;
}

// ── 会場レベル別 期待MQ計算 (handoff §2-2) ──
// ショー評価系 expectedMQTotal (data.js SHOW_RATING_CONFIG) と整合させた per-match 期待MQ。
// MQ再設計P3d(§3.8a): 観客下駄撤去後の分布実測に合わせbase全段-4、cap 80→76。popCoefは不変。
const EXPECTED_MQ_BY_VENUE = [
  { base: 26, popCoef: 0.15 },  // 0: 公民館
  { base: 29, popCoef: 0.18 },  // 1: 小ホール
  { base: 32, popCoef: 0.20 },  // 2: 中ホール
  { base: 36, popCoef: 0.22 },  // 3: 大ホール
  { base: 40, popCoef: 0.25 },  // 4: アリーナ
  { base: 44, popCoef: 0.28 },  // 5: 大アリーナ
  { base: 48, popCoef: 0.32 },  // 6: 武道館
  { base: 52, popCoef: 0.35 },  // 7: スタジアム
  { base: 56, popCoef: 0.38 },  // 8: 大スタジアム
  { base: 61, popCoef: 0.40 },  // 9: ドーム
];
function _calcExpectedMQ(venueIdx, orgPop) {
  const conf = EXPECTED_MQ_BY_VENUE[venueIdx] || EXPECTED_MQ_BY_VENUE[0];
  return Math.min(76, Math.round(conf.base + (orgPop || 0) * conf.popCoef));
}

// ── 全試合ダイジェストセクション（テーブル形式） ──
function _renderNewspaperDigest(d) {
  if (!d.allMatches || d.allMatches.length === 0) return '';
  const venueIdx = (typeof d.venueIdx === 'number') ? d.venueIdx : (G.showVenue || 0);
  const expectedMQ = d.showRating?.expected || _calcExpectedMQ(venueIdx, G.orgPop);

  const rowsHtml = d.allMatches.map((m, idx) => {
    // ダイジェストコメント選択
    let commentText = '';
    if (typeof NEWSPAPER_DIGEST_COMMENTS !== 'undefined') {
      const seed = Engine.rng.derive(d.generatedSeason || 1, d.generatedWeek || 1, idx, 0xD1C0);
      const rng = Engine.rng.create(seed);
      let pool;
      if (m.isDraw) pool = NEWSPAPER_DIGEST_COMMENTS.draw;
      else if (m.isUpset) pool = NEWSPAPER_DIGEST_COMMENTS.upset;
      else if (m.isDominant) pool = NEWSPAPER_DIGEST_COMMENTS.dominant;
      else if (m.isTitleMatch) pool = NEWSPAPER_DIGEST_COMMENTS.titleMatch;
      else {
        const diff = m.mq - expectedMQ;
        let rating;
        if (diff >= 15) rating = 'great';
        else if (diff >= 5) rating = 'good';
        else if (diff >= -4) rating = 'average';
        else if (diff >= -15) rating = 'poor';
        else rating = 'bad';
        pool = NEWSPAPER_DIGEST_COMMENTS[rating];
      }
      if (pool && pool.length > 0) {
        const fn = Engine.rng.pick(rng, pool);
        try { commentText = fn({ winnerName: m.winnerName || '?', loserName: m.loserName || '?', mq: m.mq, turns: m.turns }); } catch(e) {}
      }
    }

    // 勝者/敗者判定
    const leftWon = m.winner === 'left';
    const rightWon = m.winner === 'right';
    const winnerId = leftWon ? m.left.id : (rightWon ? m.right.id : null);
    const loserId = leftWon ? m.right.id : (rightWon ? m.left.id : null);
    const winnerName = leftWon ? m.left.name : (rightWon ? m.right.name : '');
    const loserName = leftWon ? m.right.name : (rightWon ? m.left.name : '');

    const ndtPort = (id, isWinner) => {
      const url = typeof getPortraitUrl === 'function' ? getPortraitUrl(id) : '';
      const cls = isWinner ? 'ndt-port w' : 'ndt-port l';
      if (url) return `<div class="${cls}"><img src="${url}" alt=""></div>`;
      const name = (ALL_CHARS.find(c => c.id === id)?.name || '?');
      return `<div class="${cls}">${name.charAt(0)}</div>`;
    };
    const ndtTagPorts = (team, isWinner) => {
      const members = (team?.members || []).filter(f => f && f.id).slice(0, 2);
      if (members.length === 0) return '';
      return `<div class="ndt-port-stack">` + members.map(f => ndtPort(f.id, isWinner)).join('') + `</div>`;
    };

    // バッジ
    const badge = m.isTitleMatch ? '<span class="ndt-badge-tag title">王座戦</span>'
      : m.isUpset ? '<span class="ndt-badge-tag upset">番狂わせ</span>' : '';

    // MQ色クラス
    const mqClass = m.mq >= 75 ? 'high' : m.mq >= 55 ? 'mid' : 'low';

    // ★評価(MQ vs expectedMQ で 1〜5)
    const mqDiff = m.mq - expectedMQ;
    let stars;
    if (m.isDraw) stars = 3;
    else if (mqDiff >= 15) stars = 5;
    else if (mqDiff >= 5) stars = 4;
    else if (mqDiff >= -4) stars = 3;
    else if (mqDiff >= -15) stars = 2;
    else stars = 1;
    const starsHtml = '★'.repeat(stars) + '<span style="color:rgba(120,84,39,0.25)">' + '★'.repeat(5 - stars) + '</span>';

    // 対戦行
    const rowNo = m.matchNumber || (idx + 2);
    const rowLabel = m.matchLabel || (rowNo ? `第${rowNo}試合` : '');
    let html = `<tr>
      <td class="ndt-num" title="${rowLabel}">${rowNo}</td>
      <td class="ndt-badge">${badge}</td>
      <td class="ndt-card">`;
    if (m.isTag) {
      const winLeft = m.winner === 'left';
      const winRight = m.winner === 'right';
      html += `<div class="ndt-ff">
        ${ndtTagPorts(m.teamA, winLeft)}
        <span class="ndt-name${winLeft ? ' w' : ''}">${m.left.name}</span>
        <span class="ndt-vs">${m.isDraw ? 'DRAW' : 'vs'}</span>
        <span class="ndt-name${winRight ? ' w' : ''}">${m.right.name}</span>
        ${ndtTagPorts(m.teamB, winRight)}
      </div>`;
    } else if (m.isDraw) {
      html += `<div class="ndt-ff">
        ${ndtPort(m.left.id, false)}
        <span class="ndt-name">${m.left.name}</span>
        <span class="ndt-vs">DRAW</span>
        <span class="ndt-name">${m.right.name}</span>
        ${ndtPort(m.right.id, false)}
      </div>`;
    } else {
      html += `<div class="ndt-ff">
        ${ndtPort(winnerId, true)}
        <span class="ndt-name w">${winnerName}</span>
        <span class="ndt-vs">vs</span>
        <span class="ndt-name">${loserName}</span>
        ${ndtPort(loserId, false)}
      </div>`;
    }
    html += `</td>
      <td class="ndt-mq ${mqClass}">MQ${m.mq}</td>
      <td class="ndt-rating"><span class="stars">${starsHtml}</span></td>
    </tr>`;

    // コメント行
    if (commentText) {
      html += `<tr>
        <td colspan="2"></td>
        <td colspan="3" class="ndt-comment">「${commentText}」</td>
      </tr>`;
    }

    return html;
  }).join('');

  return `
    <div class="news-digest">
      <div class="news-sec-label" style="margin-bottom:10px;">興行ダイジェスト</div>
      <table class="news-digest-table">${rowsHtml}</table>
    </div>`;
}

// ── 次回展望セクション ──
function _renderNewspaperPreview(d) {
  if (!d.preview) return '';
  const pv = d.preview;
  const hasFanExpect = pv.fanExpect && pv.fanExpect.length > 0;
  const hasRivalry = !!pv.rivalry;
  const hasTitle = !!pv.title;
  if (!hasFanExpect && !hasRivalry && !hasTitle && (typeof KURODA_PREVIEW === 'undefined' || !KURODA_PREVIEW.generic)) return '';

  const seed = Engine.rng.derive(d.generatedSeason || 1, d.generatedWeek || 1, 0xF0CA);
  const rng = Engine.rng.create(seed);
  const items = [];

  if (typeof KURODA_PREVIEW !== 'undefined') {
    // ファン期待
    if (hasFanExpect) {
      pv.fanExpect.forEach(fe => {
        const pool = KURODA_PREVIEW.fanExpect || [];
        if (pool.length > 0) {
          const fn = Engine.rng.pick(rng, pool);
          try { items.push(fn({ leftName: _newsClickableName(fe.leftName, fe.leftId), rightName: _newsClickableName(fe.rightName, fe.rightId) })); } catch(e) {}
        }
      });
    }
    // 因縁
    if (hasRivalry) {
      const pool = KURODA_PREVIEW.rivalry || [];
      if (pool.length > 0) {
        const fn = Engine.rng.pick(rng, pool);
        try { items.push(fn({ leftName: _newsClickableName(pv.rivalry.leftName, pv.rivalry.leftId), rightName: _newsClickableName(pv.rivalry.rightName, pv.rivalry.rightId) })); } catch(e) {}
      }
    }
    // タイトル
    if (hasTitle) {
      const pool = KURODA_PREVIEW.titleOutlook || [];
      if (pool.length > 0) {
        const fn = Engine.rng.pick(rng, pool);
        try { items.push(fn({ championName: _newsClickableName(pv.title.championName, pv.title.championId), challengerName: _newsClickableName(pv.title.challengerName, pv.title.challengerId) })); } catch(e) {}
      }
    }
    // いずれもなければgeneric
    if (items.length === 0) {
      const pool = KURODA_PREVIEW.generic || [];
      if (pool.length > 0) {
        const fn = Engine.rng.pick(rng, pool);
        try { items.push(fn({})); } catch(e) {}
      }
    }
  }

  if (items.length === 0) return '';

  return `
    <div class="news-preview">
      <div class="news-sec-label-gold" style="margin-bottom:10px;">次回展望</div>
      ${items.map(t => `<div class="news-preview-item">${t}</div>`).join('')}
    </div>`;
}

// ── 新聞特集ページ描画 ──
function _renderNewspaperExtraPage(wp, pageData) {
  let html = `<div style="max-width:560px;margin:0 auto 12px;background:linear-gradient(180deg,#f8eed2 0%,#f0e0ba 100%);color:#1f1710;border:1px solid rgba(120,84,39,0.32);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.25);overflow:hidden;">`;
  html += `<div style="background:linear-gradient(90deg,#8b1a1a,#c22020);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;">
    <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:2px;">週刊グラップル</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;">S${wp.season || '?'} W${wp.week || '?'} — ${pageData.title || '特集'}</div>
  </div>`;

  pageData.stories.forEach(story => {
    html += `<div style="padding:12px 20px;border-bottom:1px solid rgba(95,69,35,0.12);">`;
    html += `<div style="font-size:16px;font-weight:900;line-height:1.3;margin-bottom:6px;">${story.headline}</div>`;

    // 出場選手テーブル（プレビュー用）
    if (story.type === 'juniorTournamentPreviewRoster' && story.participants) {
      html += `<div style="font-size:13px;line-height:1.6;color:#3a2e1c;margin-bottom:8px">${story.body}</div>`;
      html += `<table style="width:100%;font-size:12px;border-collapse:collapse">`;
      html += `<tr style="border-bottom:1px solid rgba(95,69,35,0.25)"><th style="text-align:left;padding:4px">選手名</th><th>所属</th><th>OVR</th><th>年齢</th><th>スタイル</th></tr>`;
      story.participants.forEach((p, i) => {
        const bg = i % 2 === 0 ? 'rgba(200,190,170,0.15)' : '';
        html += `<tr style="background:${bg}"><td style="padding:3px 4px;font-weight:600">${_newsClickableName(p.name, p.id)}</td><td style="text-align:center">${p.orgName}</td><td style="text-align:center">${p.ovr}</td><td style="text-align:center">${p.age}</td><td style="text-align:center">${p.style || '-'}</td></tr>`;
      });
      html += `</table>`;
    }
    // 全試合結果テーブル
    else if (story.type === 'juniorTournamentMatchResults' && story.matches) {
      html += `<table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:4px">`;
      story.matches.forEach((m, i) => {
        const bg = i % 2 === 0 ? 'rgba(200,190,170,0.15)' : '';
        html += `<tr style="background:${bg}">`;
        html += `<td style="padding:4px;color:#7a5b32;min-width:50px">${m.round}</td>`;
        html += `<td style="padding:4px;font-weight:700;color:#2d5e1e">${_newsClickableName(m.winner, m.winnerId)}</td>`;
        html += `<td style="padding:4px;color:#7a5b32;font-size:10px">def.</td>`;
        html += `<td style="padding:4px">${_newsClickableName(m.loser, m.loserId)}</td>`;
        html += `<td style="padding:4px;text-align:right;color:${_mqColor(m.mq).color};font-weight:600">MQ${m.mq}</td>`;
        html += `</tr>`;
      });
      html += `</table>`;
    }
    // ドラフト プレイヤー獲得記事（ポートレート付き）
    else if (story.type === 'draftPlayerResult' && story.portraits && story.portraits.length > 0) {
      html += `<div style="font-size:13px;line-height:1.75;color:#3a2e1c;">${story.body}</div>`;
      html += `<div class="news-draft-portraits">`;
      story.portraits.forEach(p => {
        const imgHtml = p.url
          ? `<img src="${p.url}" alt="">`
          : `<span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#d4c4a0;text-align:center;line-height:32px;font-size:14px;font-weight:900;color:#1f1710">${(p.name||'?').charAt(0)}</span>`;
        html += `<div class="news-draft-chip">${imgHtml}<span class="nm">${p.name}</span><span class="ov">OVR${p.ovr}</span></div>`;
      });
      html += `</div>`;
    }
    // 通常テキスト記事
    else {
      html += `<div style="font-size:13px;line-height:1.75;color:#3a2e1c;">${story.body}</div>`;
    }
    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

const _STAT_COLORS = { pw: '#e74c3c', sp: '#2ecc71', te: '#3498db', st: '#f39c12', mn: '#9b59b6' };
function _statCell(val, color) {
  const v = Math.round(val || 0);
  const c = v >= 75 ? (color || '#e74c3c') : v >= 60 ? 'var(--text-main)' : 'var(--text-dim)';
  return `<td class="num" style="font-size:12px;color:${c}">${v}</td>`;
}

// ── 全選手一覧 ─────────────────────────────────────────────
function _renderDbFighters() {
  const RANK_COLORS = { S: '#d63031', A: '#6c5ce7', B: '#00b894', player: '#d4a843', fa: '#8bc4f0' };

  // 全選手収集
  const all = Engine.database.getAllFighters(G);

  // フィルタ
  let filtered = all;
  if (_dbFilterOrg) {
    filtered = filtered.filter(f => f._orgId === _dbFilterOrg);
  }
  if (_dbFilterStyle) {
    filtered = filtered.filter(f => f.style === _dbFilterStyle);
  }
  if (_dbFilterName) {
    const q = _dbFilterName.toLowerCase();
    filtered = filtered.filter(f => f.name.toLowerCase().includes(q));
  }

  // ソート
  filtered = [...filtered].sort((a, b) => {
    let va, vb;
    if (_dbSortKey === 'ovr') { va = Engine.util.ov(a); vb = Engine.util.ov(b); }
    else if (_dbSortKey === 'name') { va = a.name; vb = b.name; }
    else if (_dbSortKey === 'org') { va = a._orgName; vb = b._orgName; }
    else if (_dbSortKey === 'style') { va = a.style || ''; vb = b.style || ''; }
    else if (_dbSortKey === 'age') { va = a.age || 0; vb = b.age || 0; }
    else if (_dbSortKey === 'pop') { va = a.popularity || 0; vb = b.popularity || 0; }
    else if (_dbSortKey === 'pw') { va = Math.round(a.pw || 0); vb = Math.round(b.pw || 0); }
    else if (_dbSortKey === 'sp') { va = Math.round(a.sp || 0); vb = Math.round(b.sp || 0); }
    else if (_dbSortKey === 'te') { va = Math.round(a.te || 0); vb = Math.round(b.te || 0); }
    else if (_dbSortKey === 'st') { va = Math.round(a.st || 0); vb = Math.round(b.st || 0); }
    else if (_dbSortKey === 'mn') { va = Math.round(a.mn || 0); vb = Math.round(b.mn || 0); }
    else { va = Engine.util.ov(a); vb = Engine.util.ov(b); }
    if (va < vb) return _dbSortAsc ? -1 : 1;
    if (va > vb) return _dbSortAsc ? 1 : -1;
    return 0;
  });

  // フィルタバー
  const orgOptions = [
    { id: '', label: '全て' },
    { id: 'player', label: G.orgName || 'プレイヤー団体' },
    ...RIVAL_ORGS.map(o => ({ id: o.id, label: `${o.name || o.id} (${o.tier})` })),
    { id: 'fa', label: 'FA' },
  ];
  const styles = ['Grappler', 'Striker', 'Submission', 'Aerial', 'Allround', 'Brawler'];

  let html = `<div class="db-filter-bar">
    <select onchange="_dbFilterOrg=this.value;renderDatabase()">
      ${orgOptions.map(o => `<option value="${o.id}" ${_dbFilterOrg === o.id ? 'selected' : ''}>${o.label}</option>`).join('')}
    </select>
    <select onchange="_dbFilterStyle=this.value;renderDatabase()">
      <option value="" ${_dbFilterStyle === '' ? 'selected' : ''}>スタイル: 全て</option>
      ${styles.map(s => `<option value="${s}" ${_dbFilterStyle === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select>
    <input type="text" placeholder="🔍 名前検索..." value="${_dbFilterName}"
      oninput="_dbFilterName=this.value;renderDatabase()" style="max-width:160px">
    <span class="db-count">全${all.length}名 / 表示中: ${filtered.length}名</span>
  </div>`;

  // ソート用ヘッダー生成
  const th = (key, label, w) => {
    const active = _dbSortKey === key;
    const ind = active ? (_dbSortAsc ? ' ▲' : ' ▼') : '';
    return `<th class="${active ? 'sorted' : ''}" style="${w ? `width:${w}` : ''}" onclick="_dbSortKey='${key}';_dbSortAsc=${active ? !_dbSortAsc : false};renderDatabase()">${label}${ind}</th>`;
  };

  html += `<div class="db-table-scroll"><table class="db-table db-fighter-table">
    <thead><tr>
      <th style="width:40px"></th>
      ${th('name', '名前')}
      ${th('org', '団体', '110px')}
      ${th('style', 'スタイル', '80px')}
      ${th('ovr', 'OVR', '50px')}
      ${th('pw', 'PW', '40px')}
      ${th('sp', 'SP', '40px')}
      ${th('te', 'TE', '40px')}
      ${th('st', 'ST', '40px')}
      ${th('mn', 'MN', '40px')}
      ${th('age', '年齢', '45px')}
      ${th('pop', '人気', '50px')}
    </tr></thead>
    <tbody>`;

  // 王者IDマップ構築（プレイヤー+全AI団体）
  const _champIds = new Set();
  if (G.titles?.world?.championId) _champIds.add(G.titles.world.championId);
  if (G.aiOrgs) { for (const oData of Object.values(G.aiOrgs)) { if (oData.titles?.world?.championId) _champIds.add(oData.titles.world.championId); } }
  // 春のタッグリーグ「総合ベストタッグ」IDセット（遅延失効判定込み）
  const _bestTagIds = new Set();
  const _dbActiveBestTag = Engine.springTagLeague.getActiveBestTagTeam(G);
  if (_dbActiveBestTag) { _bestTagIds.add(_dbActiveBestTag.f1Id); _bestTagIds.add(_dbActiveBestTag.f2Id); }

  filtered.forEach(f => {
    const ovr = Engine.util.ov(f);
    const _ovrSc = _ovrColor(ovr);
    const rc = RANK_COLORS[f._orgTier] || '#888';
    const tierBadge = f._orgTier !== 'player' && f._orgTier !== 'fa'
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:2px;background:${rc}22;color:${rc};border:1px solid ${rc}44;margin-left:4px">${f._orgTier}</span>`
      : '';
    const faBadge = f._orgTier === 'fa'
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:2px;background:rgba(139,196,240,0.15);color:#8bc4f0;border:1px solid rgba(139,196,240,0.3)">FA</span>`
      : '';
    const playerBadge = f._orgTier === 'player'
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:2px;background:rgba(212,168,67,0.15);color:var(--gold);border:1px solid rgba(212,168,67,0.3)">自</span>`
      : '';
    const champBadge = _champIds.has(f.id)
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:2px;background:rgba(212,168,67,0.2);color:var(--gold);border:1px solid rgba(212,168,67,0.4);margin-left:4px">👑</span>`
      : '';
    const bestTagBadge = _bestTagIds.has(f.id)
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:2px;background:rgba(255,111,156,0.2);color:#ff6f9c;border:1px solid rgba(255,111,156,0.4);margin-left:4px">🌸</span>`
      : '';
    const source = f._orgTier === 'player' ? 'roster' : f._orgTier === 'fa' ? 'free' : `ai:${f._orgId}`;
    html += `<tr class="clickable" onclick="showFighterPopup(${f.id},'${source}')">
      <td>${portraitImg(f.id, 36, '', false)}</td>
      <td style="font-weight:600">${f.name}${champBadge}${bestTagBadge}</td>
      <td style="font-size:12px">${f._orgName}${tierBadge}${faBadge}${playerBadge}</td>
      <td><span class="badge badge-${f.style}" style="font-size:11px">${f.style || '—'}</span></td>
      <td class="num" style="${_scale6Style(_ovrSc)};font-weight:700;font-size:15px">${ovr}</td>
      ${_statCell(f.pw, '#e74c3c')}${_statCell(f.sp, '#3498db')}${_statCell(f.te, '#2ecc71')}${_statCell(f.st, '#f39c12')}${_statCell(f.mn, '#9b59b6')}
      <td class="num" style="color:var(--text-sub)">${f.age || '—'}</td>
      <td class="num" style="color:${_popColor(Engine.util.dispPop(f.popularity || 0)).color}">${Engine.util.dispPop(f.popularity || 0)}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
}

// ── 全コーチ一覧 ────────────────────────────────────────────
function _renderDbCoaches() {
  const GRADE_COLORS = { C: '#888', B: '#2ecc71', A: 'var(--gold)' };
  const GRADE_ORDER = { A: 0, B: 1, C: 2 };
  const RANK_ORDER = { A: 0, B: 1, C: 2, D: 3, E: 4 };

  let coaches = [...ALL_COACHES];

  // フィルタ
  if (_dbCoachFilterGrade) {
    coaches = coaches.filter(c => c.grade === _dbCoachFilterGrade);
  }
  if (_dbCoachFilterName) {
    const q = _dbCoachFilterName.toLowerCase();
    coaches = coaches.filter(c => c.name.toLowerCase().includes(q));
  }

  // ソート
  coaches.sort((a, b) => {
    let va, vb;
    if (_dbCoachSortKey === 'grade') { va = GRADE_ORDER[a.grade] ?? 9; vb = GRADE_ORDER[b.grade] ?? 9; }
    else if (_dbCoachSortKey === 'name') { va = a.name; vb = b.name; }
    else if (_dbCoachSortKey === 'gMult') { va = a.gMult || 1; vb = b.gMult || 1; }
    else if (_dbCoachSortKey === 'observation') { va = RANK_ORDER[a.observation] ?? 9; vb = RANK_ORDER[b.observation] ?? 9; }
    else if (_dbCoachSortKey === 'style') { va = a.style || ''; vb = b.style || ''; }
    else if (_dbCoachSortKey === 'salary') { va = a.salary || 0; vb = b.salary || 0; }
    else if (_dbCoachSortKey === 'hireFee') { va = a.hireFee || 0; vb = b.hireFee || 0; }
    else { va = GRADE_ORDER[a.grade] ?? 9; vb = GRADE_ORDER[b.grade] ?? 9; }
    if (va < vb) return _dbCoachSortAsc ? -1 : 1;
    if (va > vb) return _dbCoachSortAsc ? 1 : -1;
    return 0;
  });

  // フィルタバー
  let html = `<div class="db-filter-bar">
    <select onchange="_dbCoachFilterGrade=this.value;renderDatabase()">
      <option value="">グレード: 全て</option>
      <option value="A" ${_dbCoachFilterGrade === 'A' ? 'selected' : ''}>A級</option>
      <option value="B" ${_dbCoachFilterGrade === 'B' ? 'selected' : ''}>B級</option>
      <option value="C" ${_dbCoachFilterGrade === 'C' ? 'selected' : ''}>C級</option>
    </select>
    <input type="text" placeholder="🔍 名前検索..." value="${_dbCoachFilterName}"
      oninput="_dbCoachFilterName=this.value;renderDatabase()" style="max-width:160px">
    <span class="db-count">全${ALL_COACHES.length}名 / 表示中: ${coaches.length}名</span>
  </div>`;

  // ソート用ヘッダー
  const th = (key, label, w) => {
    const active = _dbCoachSortKey === key;
    const ind = active ? (_dbCoachSortAsc ? ' ▲' : ' ▼') : '';
    return `<th class="${active ? 'sorted' : ''}" style="${w ? `width:${w}` : ''}" onclick="_dbCoachSortKey='${key}';_dbCoachSortAsc=${active ? !_dbCoachSortAsc : false};renderDatabase()">${label}${ind}</th>`;
  };

  html += `<div class="db-table-scroll"><table class="db-table">
    <thead><tr>
      <th style="width:40px"></th>
      ${th('name', '名前')}
      ${th('grade', 'グレード', '80px')}
      ${th('gMult', '成長倍率', '70px')}
      ${th('observation', '観察眼', '65px')}
      ${th('style', '得意', '90px')}
      <th style="width:140px">能力</th>
      ${th('salary', '給与', '70px')}
      ${th('hireFee', '雇用費', '70px')}
      <th style="width:55px">状態</th>
    </tr></thead>
    <tbody>`;

  coaches.forEach(c => {
    const gc = GRADE_COLORS[c.grade] || '#888';
    const isHired = G.coaches.includes(c.id);
    html += `<tr class="clickable" onclick="showCoachTooltip(${c.id})">
      <td>${coachPortraitImg(c, 36)}</td>
      <td style="font-weight:600">${c.name}</td>
      <td><span class="coach-grade coach-grade-${c.grade}" style="font-size:12px">${c.grade}級</span></td>
      <td class="num" style="font-weight:700;color:${gc}">×${c.gMult||1.0}</td>
      <td class="num" style="color:${gc}">${c.observation}</td>
      <td><span class="badge badge-${c.style}" style="font-size:11px;padding:1px 6px">${c.style}</span></td>
      <td style="font-size:11px;color:var(--text-sub)">${(c.abilities||[]).join('・')}${c.flavor ? ` <span style="color:var(--text-dim)">[${c.flavor}]</span>` : ''}</td>
      <td class="num" style="font-size:12px">${c.salary}万</td>
      <td class="num" style="font-size:12px">${c.hireFee}万</td>
      <td>${isHired ? '<span style="font-size:11px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 5px;border-radius:3px">雇用中</span>' : '<span style="font-size:11px;color:var(--text-dim)">—</span>'}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
}

// ── 殿堂一覧 v2.0 ──────────────────────────────────────────────
function _getHofStarText(level) { return level >= 3 ? '★★★ レジェンド' : level >= 2 ? '★★ ゴールド殿堂' : '★ 殿堂入り'; }
function _getHofBorderColor(level) { return level >= 3 ? '#f39c12' : level >= 2 ? '#d4a843' : '#bdc3c7'; }
function _getHofShieldEmoji(level) { return level >= 3 ? '🏆' : level >= 2 ? '🥇' : '🛡️'; }
function _hofShieldImg(level, id, size) {
  const variant = Engine.awards.assignShieldVariant(level, id);
  const url = Engine.awards.getShieldUrl(variant);
  return `<img src="${url}" style="width:${size}px;height:auto;display:block;margin:0 auto" alt="${_getHofStarText(level)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none;font-size:${Math.round(size*0.6)}px;text-align:center">${_getHofShieldEmoji(level)}</span>`;
}
function _getHighlightIcon(type) {
  return { titleWin: '👑', titleDefense: '🛡️', titleLoss: '💔', juniorTournament: '🏟️', ppvMainEvent: '🏆', springTagLeague: '🌸' }[type] || '📌';
}

function _getAllHofEntries() {
  const allHof = G.allHallOfFame || {};
  const entries = [];
  ['player', 'org_s', 'org_a', 'org_b'].forEach(key => {
    (allHof[key] || []).forEach(h => entries.push(h));
  });
  // 後方互換: allHallOfFameが空でhallOfFameがある場合
  if (entries.length === 0 && G.hallOfFame && G.hallOfFame.length > 0) {
    G.hallOfFame.forEach(h => entries.push({ ...h, orgId: h.orgId || 'player' }));
  }
  return entries;
}

function _getHofOrgName(orgId) {
  if (orgId === 'player') return G.orgName || 'あなたの団体';
  const org = RIVAL_ORGS.find(o => o.id === orgId);
  const aiData = G.aiOrgs && G.aiOrgs[orgId];
  return (aiData && aiData.orgName) || (org && org.name) || orgId;
}

function _renderDbHallOfFame() {
  const allEntries = _getAllHofEntries();

  // フィルタタブ
  const orgKeys = ['all', 'player', 'org_s', 'org_a', 'org_b'];
  const orgCounts = {};
  orgKeys.forEach(k => { orgCounts[k] = k === 'all' ? allEntries.length : allEntries.filter(h => h.orgId === k).length; });

  let html = `<div class="db-hof-filter-bar">`;
  orgKeys.forEach(k => {
    const label = k === 'all' ? '全団体' : _getHofOrgName(k);
    const active = _dbHofFilter === k ? ' active' : '';
    html += `<button class="db-hof-filter-btn${active}" onclick="_dbHofFilter='${k}';renderDatabase()">${label}(${orgCounts[k]})</button>`;
  });
  html += `</div>`;

  // ソート
  html += `<div class="db-hof-sort-bar"><span style="color:var(--text-dim);font-size:11px">並び替え:</span>`;
  [['season_desc','殿堂入り順'],['points_desc','ポイント順'],['name','名前順']].forEach(([k,label]) => {
    const active = _dbHofSort === k ? ' active' : '';
    html += `<button class="db-hof-sort-btn${active}" onclick="_dbHofSort='${k}';renderDatabase()">${label}</button>`;
  });
  html += `</div>`;

  // フィルタ適用
  let filtered = _dbHofFilter === 'all' ? allEntries : allEntries.filter(h => h.orgId === _dbHofFilter);

  // ソート適用
  if (_dbHofSort === 'season_desc') filtered.sort((a, b) => (b.inductionSeason || 0) - (a.inductionSeason || 0));
  else if (_dbHofSort === 'points_desc') filtered.sort((a, b) => (b.hofPoints || 0) - (a.hofPoints || 0));
  else if (_dbHofSort === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (filtered.length === 0) {
    html += `<div style="text-align:center;padding:40px 20px;color:var(--text-dim)">
      <div style="font-size:40px;margin-bottom:12px">🏅</div>
      <div style="font-size:15px;margin-bottom:8px">まだ殿堂入りした選手はいません</div>
      <div style="font-size:13px;color:var(--text-dim)">殿堂ポイント15pt以上の選手が引退時に殿堂入りします。<br>
      <span style="display:inline-block;margin-top:8px;text-align:left;line-height:1.8">
      <span style="color:var(--text-sub)">【実績】</span> 戴冠1 ／ 防衛1 ／ ジュニア優勝4 ／ 春タッグ優勝3 ／ PPV勝利5 ／ 対抗戦勝利1.5 ／ 天頂戦 優勝8・準優勝5・ベスト4 3<br>
      <span style="color:var(--text-sub)">【表彰】</span> MVP2 ／ 新人王1.5 ／ ベストマッチ1 ／ メディア功労賞1.5
      </span></div>
    </div>`;
    return html;
  }

  // 盾グリッド（flex-wrap コンパクトカード）
  html += `<div class="db-hof-grid">`;
  filtered.forEach((h, idx) => {
    const level = h.hofLevel || 1;
    const borderColor = _getHofBorderColor(level);
    const pUrl = getPortraitUrl(h.id || 0);
    const starText = _getHofStarText(level);
    const legendClass = level >= 3 ? ' legend-glow' : '';
    const imgHtml = pUrl
      ? `<img src="${pUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid ${borderColor}" alt="">`
      : `<div style="width:32px;height:32px;border-radius:50%;background:rgba(212,168,67,0.15);border:2px solid ${borderColor};display:inline-flex;align-items:center;justify-content:center;font-size:14px">🏅</div>`;

    html += `<div class="db-hof-card${legendClass}" style="border-color:${borderColor}" onclick="showHofDetail(${idx})" data-hof-idx="${idx}">
      ${_hofShieldImg(level, h.id, 50)}
      <div style="font-size:10px;color:${borderColor};font-weight:700;margin:2px 0">${starText}</div>
      <div style="margin:4px 0">${imgHtml}</div>
      <div class="db-hof-name">${h.name}</div>
      <div class="db-hof-row">${h.orgName || _getHofOrgName(h.orgId)}</div>
      <div class="db-hof-row">王座${h.titleReigns || 0}/防衛${h.totalDefenses || 0}</div>
    </div>`;
  });
  html += `</div>`;

  // 詳細ポップアップ用データを window に保持
  window._hofFilteredList = filtered;

  return html;
}

/** 殿堂詳細ポップアップ */
function showHofDetail(idx) {
  const list = window._hofFilteredList || [];
  const h = list[idx];
  if (!h) return;

  const level = h.hofLevel || 1;
  const borderColor = _getHofBorderColor(level);
  const starText = _getHofStarText(level);
  const pUrl = getPortraitUrl(h.id || 0);
  const orgName = h.orgName || _getHofOrgName(h.orgId);
  const sep = '<div style="border-top:1px solid rgba(255,255,255,0.1);margin:12px 0"></div>';

  // 異名（フォールバック: 動的生成）
  const epithet = h.epithet || Engine.awards.generateEpithet(h, null, null);
  // 語り文（フォールバック: 動的生成）
  const biography = h.biography || Engine.awards.generateBiography({ ...h, epithet, orgName });

  // 顔画像
  const portraitHtml = pUrl
    ? `<img src="${pUrl}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${borderColor}" alt="">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:rgba(212,168,67,0.15);border:3px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:32px">🏅</div>`;

  // §3 全身画像（グラデーション背景付き）
  const fullUrl = typeof getFullUrl === 'function' ? getFullUrl(h.id || 0, h.ovr || 0) : '';
  const fullHtml = fullUrl
    ? `<div style="text-align:center;margin:8px 0;padding:12px 0;background:radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%);border-radius:8px"><img src="${fullUrl}" style="height:200px;object-fit:contain;border-radius:8px" alt="" onerror="this.parentElement.style.display='none'"></div>`
    : '';

  // §2 語り文（明るい白系）
  const bioHtml = biography
    ? `<div style="font-style:italic;color:rgba(232,230,224,0.85);font-size:12px;line-height:1.7;padding:10px 8px;text-align:center">${biography}</div>`
    : '';

  // §6 キャリアハイライト年表
  let highlights = h.careerHighlights || [];
  if (highlights.length === 0 && h.careerRecord && h.careerRecord.history) {
    highlights = Engine.awards.buildCareerHighlights(h.careerRecord, orgName, G);
  }
  let highlightsHtml = '';
  if (highlights.length > 0) {
    highlightsHtml = `<div class="db-hof-detail-section" style="text-align:center">━━ キャリアハイライト ━━</div><div class="db-hof-highlights" style="display:inline-block;text-align:left">`;
    highlights.forEach(hl => {
      highlightsHtml += `<div class="db-hof-hl-row"><span class="db-hof-hl-season" style="font-family:monospace">S${hl.season}</span><span>${_getHighlightIcon(hl.type)} ${hl.text}</span></div>`;
    });
    highlightsHtml += `</div>`;
  }

  // 対抗戦戦績（既存エントリはwarWins未保存→retiredFightersからフォールバック）
  let _warW = h.warWins || 0, _warL = h.warLosses || 0;
  if (_warW === 0 && _warL === 0) {
    const _rf = (G.retiredFighters || []).find(f => f.id === h.id);
    if (_rf) {
      // 転生前の架空対抗戦は別人扱いで除外
      const _rfJs = Engine.career.joinSeason(_rf);
      const _wh = Engine.career.filterPostJoin(((_rf.careerRecord || {}).history || []), _rfJs).filter(e => e.type === 'war');
      _warW = _wh.filter(e => e.won).length;
      _warL = _wh.length - _warW;
    }
  }

  // 通算実績
  const statsHtml = `<div class="db-hof-detail-section" style="text-align:center">━━ 通算実績 ━━</div>
    <div class="db-hof-stats-grid" style="max-width:280px;margin:0 auto">
      <div>王座獲得 <strong>${h.titleReigns || 0}</strong>回</div>
      <div>通算防衛 <strong>${h.totalDefenses || 0}</strong>回</div>
      ${h.juniorTournamentWins ? `<div>JT優勝 <strong>${h.juniorTournamentWins}</strong>回</div>` : '<div></div>'}
      ${h.ppvMainEventWins ? `<div>PPV優勝 <strong>${h.ppvMainEventWins}</strong>回</div>` : '<div></div>'}
      ${_warW + _warL > 0 ? `<div style="grid-column:1/-1;margin-top:4px">🏴 対抗戦 <strong style="color:#2ecc71">${_warW}勝</strong> <strong style="color:#e74c3c">${_warL}敗</strong></div>` : ''}
    </div>`;

  // §4 引退時OVR
  const retireInfo = h.retireOVR
    ? `<div style="font-size:12px;color:var(--text-sub)">引退時OVR ${h.retireOVR}${h.retireAge ? `（${h.retireAge}歳）` : ''}</div>`
    : '';

  const legendGlow = level >= 3 ? 'box-shadow:0 0 20px rgba(243,156,18,0.3);' : '';
  const shieldGlow = level >= 3 ? 'filter:drop-shadow(0 0 8px rgba(243,156,18,0.5))' : '';

  // 年代記チャプターに登場するか（「年代記で見る」ボタン表示判定）
  const hasChronicleChapter = !!(G && G.chronicle && ((G.chronicle.chaptersCache || {}).chapters || [])
    .some(ch => [...(ch.aces || []), ...(ch.peers || [])].some(c => c.id === h.id)));

  const modal = document.createElement('div');
  modal.className = 'db-hof-detail-overlay';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `<div class="db-hof-detail-modal" style="text-align:center;${legendGlow}">
    <button class="db-hof-detail-close" onclick="this.closest('.db-hof-detail-overlay').remove()">×</button>
    <div style="margin-bottom:12px;${shieldGlow}">
      ${_hofShieldImg(level, h.id, 120)}
      <div style="font-size:14px;color:${borderColor};font-weight:700;margin-top:4px">${starText}</div>
    </div>
    ${sep}
    <div style="display:inline-flex;align-items:center;gap:14px;text-align:left;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
      ${portraitHtml}
      <div>
        <div style="font-size:18px;font-weight:700;color:var(--text-main)">${h.name}</div>
        <div style="font-size:15px;color:var(--gold);margin:4px 0">── 「${epithet}」──</div>
        <div style="font-size:13px;color:var(--text-sub)">${orgName} / ${h.style || 'Allround'}</div>
        <div style="font-size:12px;color:var(--text-sub)">${h.activeYears || ''}（${(h.activeSeasonsEnd || 1) - (h.activeSeasonsStart || 1) + 1}シーズン）</div>
        <div style="font-size:12px;color:var(--text-sub)">最高OVR ${h.peakOVR || 0}（S${h.peakOVRSeason || '?'}）</div>
        ${retireInfo}
      </div>
    </div>
    ${fullHtml ? sep + fullHtml : ''}
    ${bioHtml ? sep + bioHtml : ''}
    ${highlightsHtml ? sep + highlightsHtml : ''}
    ${sep}
    ${statsHtml}
    <div style="margin-top:14px;font-size:13px;color:${borderColor}">
      殿堂pt: ${h.hofPoints || 0} ／ 殿堂入り: S${h.inductionSeason || '?'}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      ${hasChronicleChapter ? `<button class="db-hof-detail-btn" style="background:rgba(154,112,32,0.12);border-color:rgba(184,137,42,0.6);color:#c9a84c" onclick="openChronicleForFighter(${h.id})">📖 年代記で見る</button>` : ''}
      <button class="db-hof-detail-btn" onclick="this.closest('.db-hof-detail-overlay').remove()">閉じる</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}
window.showHofDetail = showHofDetail;

// ╔══════════════════════════════════════════════════════════╗
// ║  CHRONICLE — 団体年代記 (chronicle-system-spec-v0.1.md)   ║
// ╚══════════════════════════════════════════════════════════╝

function setDbChronicleIdx(idx) {
  _dbChronicleIdx = idx;
  renderDatabase();
}
window.setDbChronicleIdx = setDbChronicleIdx;

function rebuildChronicle() {
  if (!G || !Engine.chronicle) return;
  G = Engine.chronicle.buildChapters(G, { forceRebuild: true });
  _dbChronicleIdx = null;
  Storage.autoSave();
  renderDatabase();
}
window.rebuildChronicle = rebuildChronicle;

/** 年代記 → HoF: fighter ID から直接 HoF 詳細モーダルを開く */
function openHofDetailById(fighterId) {
  const allEntries = _getAllHofEntries();
  const idx = allEntries.findIndex(h => h.id === fighterId);
  if (idx < 0) return;
  window._hofFilteredList = allEntries;
  showHofDetail(idx);
}
window.openHofDetailById = openHofDetailById;

/** HoF → 年代記: fighter が登場する章を開く */
function openChronicleForFighter(fighterId) {
  if (!G || !G.chronicle) return;
  const chapters = (G.chronicle.chaptersCache || {}).chapters || [];
  let targetIdx = null;
  for (let i = 0; i < chapters.length; i++) {
    const all = [...(chapters[i].aces || []), ...(chapters[i].peers || [])];
    if (all.some(c => c.id === fighterId)) { targetIdx = i + 1; break; }
  }
  if (targetIdx === null) return;
  const overlay = document.querySelector('.db-hof-detail-overlay');
  if (overlay) overlay.remove();
  _dbSubTab = 6;
  _dbChronicleIdx = targetIdx;
  showScreen('database');
  renderDatabase();
}
window.openChronicleForFighter = openChronicleForFighter;

function _chronicleStyleLabel(style) {
  const m = { striker: 'STRIKER', grappler: 'GRAPPLER', submission: 'SUBMISSION', brawler: 'BRAWLER', allround: 'ALLROUND' };
  if (!style) return 'ALLROUND';
  return m[String(style).toLowerCase()] || String(style).toUpperCase();
}

function _chronicleHighlightClass(tier) {
  if (tier === 'gold') return ' chron-highlight-gold';
  if (tier === 'silver') return ' chron-highlight-silver';
  if (tier === 'red') return ' chron-highlight-red';
  return '';
}

function _chronicleStyleBlock() {
  // Chronicle 専用 Cream Paper スコープ (UI階層1のトークンに Cream 系がないため、ここで定義)
  return `<style>
.chron-wrap {
  --chr-paper-top: #f8eed2;
  --chr-paper-bot: #f0e0ba;
  --chr-ink: #1f1710;
  --chr-ink-sub: #3a2e1c;
  --chr-ink-mid: #5b4b34;
  --chr-ink-dim: #7a5b32;
  --chr-rule: rgba(95,69,35,0.18);
  --chr-rule-bold: rgba(95,69,35,0.35);
  --chr-border: rgba(120,84,39,0.32);
  --chr-red: #8b1a1a;
  --chr-red-bright: #c22020;
  --chr-gold: #9a7020;
  --chr-gold-light: #b8892a;
  --chr-silver: #6f6657;
  --chr-idol: #b03366;
  --chr-idol-bg: rgba(176,51,102,0.08);
  display: block;
  margin: 12px auto 40px;
  max-width: 940px;
  background: linear-gradient(180deg, var(--chr-paper-top) 0%, var(--chr-paper-bot) 100%);
  color: var(--chr-ink);
  border: 1px solid var(--chr-border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  overflow: hidden;
  font-family: 'Noto Sans JP', 'Meiryo', sans-serif;
}
.chron-subhead {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 22px;
  background: rgba(95,69,35,0.04);
  border-bottom: 1px solid var(--chr-rule);
}
.chron-subhead-label {
  font-size: 10px; letter-spacing: 3px; color: var(--chr-ink-dim);
  text-transform: uppercase; font-weight: 700;
}
.chron-subhead-org { font-size: 12px; color: var(--chr-ink-sub); font-weight: 700; }
.chron-rebuild-btn {
  background: transparent; border: 1px solid var(--chr-rule-bold);
  color: var(--chr-ink-dim); font-size: 10px; padding: 3px 10px;
  letter-spacing: 1px; cursor: pointer; font-weight: 700;
}
.chron-rebuild-btn:hover { background: rgba(95,69,35,0.08); }
.chron-timeline { padding: 14px 22px 28px; border-bottom: 1px solid var(--chr-rule); }
.chron-timeline-rail { position: relative; height: 50px; margin: 0 12px; }
/* Phase D: 章窓を背景バンドで可視化。重複は半透明の重ね描きで濃く見える */
.chron-timeline-band {
  position: absolute;
  top: 6px; height: 14px;
  background: rgba(154,112,32,0.16);
  border-radius: 7px;
  pointer-events: none;
  border: 1px solid rgba(154,112,32,0.28);
}
.chron-timeline-band.current {
  background: rgba(180,40,40,0.22);
  border-color: rgba(180,40,40,0.5);
  z-index: 1;
}
.chron-timeline-band.fledgling {
  background: rgba(60,120,60,0.18);
  border-color: rgba(60,120,60,0.40);
}
.chron-timeline-line {
  position: absolute; top: 18px; left: 0; right: 0; height: 2px;
  background: var(--chr-rule-bold);
}
.chron-timeline-tick {
  position: absolute; top: 12px;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--chr-paper-top);
  border: 2px solid var(--chr-ink-dim);
  transform: translateX(-50%);
  cursor: pointer;
}
.chron-timeline-tick.current {
  width: 18px; height: 18px; top: 10px;
  border-color: var(--chr-red);
  background: var(--chr-red-bright);
  box-shadow: 0 0 0 4px rgba(194,32,32,0.18);
}
.chron-timeline-tick.in-progress { border-style: dashed; }
.chron-timeline-label {
  position: absolute; top: 30px;
  font-size: 9px; color: var(--chr-ink-dim);
  transform: translateX(-50%); white-space: nowrap;
  letter-spacing: 0.5px; font-weight: 700;
  cursor: pointer;
}
.chron-timeline-label.current { color: var(--chr-red); font-weight: 900; }
.chron-header {
  text-align: center;
  padding: 22px 22px 18px;
  border-bottom: 3px double var(--chr-rule-bold);
}
.chron-eyebrow {
  display: inline-block;
  font-size: 11px; letter-spacing: 4px;
  color: #fff; background: var(--chr-ink);
  padding: 4px 14px; font-weight: 700;
  text-transform: uppercase; margin-bottom: 12px;
}
.chron-eyebrow.in-progress {
  background: var(--chr-gold);
}
.chron-num {
  font-size: 14px; letter-spacing: 3px;
  color: var(--chr-ink-dim); margin-bottom: 6px;
}
.chron-title {
  font-size: 28px; font-weight: 900;
  color: var(--chr-ink); line-height: 1.25;
  letter-spacing: 1px; margin-bottom: 8px;
}
.chron-sub {
  font-size: 13px; color: var(--chr-ink-sub);
  line-height: 1.7; max-width: 640px; margin: 0 auto;
  font-weight: 500;
}
.chron-period {
  display: inline-block; margin-top: 10px;
  font-size: 11px; letter-spacing: 2px;
  color: var(--chr-ink-dim); padding: 3px 10px;
  border: 1px solid var(--chr-rule-bold); font-weight: 700;
}
.chron-focus-tag {
  display: inline-block; margin-left: 8px;
  font-size: 10px; letter-spacing: 1.5px;
  color: var(--chr-gold);
  font-weight: 700;
}
.chron-overlap-row {
  margin-top: 8px;
  font-size: 10px; letter-spacing: 0.5px;
  color: var(--chr-ink-dim);
  font-weight: 600;
}
.chron-overlap-prev, .chron-overlap-next {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(154,112,32,0.10);
  border: 1px dashed rgba(154,112,32,0.40);
  border-radius: 3px;
}
.chron-overlap-sep { margin: 0 6px; opacity: 0.5; }
.chron-sec-label {
  font-size: 11px; letter-spacing: 0.15em;
  color: var(--chr-red); font-weight: 900;
  margin-bottom: 12px; padding-left: 8px;
  border-left: 3px solid var(--chr-red);
}
.chron-section {
  padding: 18px 22px;
  border-top: 1px solid var(--chr-rule);
}
.chron-section:first-of-type { border-top: none; }
.chron-ace-row {
  display: grid; grid-template-columns: 160px 1fr; gap: 20px;
  align-items: start;
}
.chron-ace-row.dual { grid-template-columns: 160px 160px 1fr; }
.chron-ace-portrait {
  width: 160px; height: 200px;
  background: linear-gradient(135deg, #d4c4a0 0%, #a8916a 100%);
  border: 3px solid var(--chr-gold);
  box-shadow: 0 0 12px rgba(154,112,32,0.25),
              inset 0 0 30px rgba(95,69,35,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--chr-ink);
  position: relative;
  overflow: hidden;
}
.chron-ace-portrait img {
  width: 100%; height: 100%; object-fit: cover; object-position: center top;
}
.chron-ace-portrait-letter {
  font-size: 88px; font-weight: 900;
}
.chron-ace-portrait::before {
  content: ''; position: absolute; inset: 4px;
  border: 1px solid rgba(154,112,32,0.5);
  pointer-events: none;
}
.chron-ace-tagline {
  display: inline-block;
  font-size: 10px; letter-spacing: 2px;
  color: var(--chr-gold); text-transform: uppercase;
  font-weight: 700; margin-bottom: 4px;
}
.chron-ace-name {
  font-size: 26px; font-weight: 900;
  color: var(--chr-ink); letter-spacing: 1px;
  margin-bottom: 10px; line-height: 1.1;
}
.chron-ace-meta-row {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 8px; padding: 10px 0;
  border-top: 1px dashed var(--chr-rule);
  border-bottom: 1px dashed var(--chr-rule);
  margin-bottom: 12px;
  align-items: end;
}
.chron-ace-meta {
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-end;
  text-align: center;
  min-height: 44px;
}
.chron-ace-meta-key {
  font-size: 9px; color: var(--chr-ink-dim);
  letter-spacing: 1px; text-transform: uppercase;
  font-weight: 700; margin-bottom: 4px;
  line-height: 1;
}
.chron-ace-meta-val {
  font-size: 22px; color: var(--chr-ink);
  letter-spacing: 0.5px; line-height: 1; font-weight: 700;
  display: flex; align-items: baseline;
  justify-content: center; gap: 1px;
}
.chron-ace-meta-val .small {
  font-size: 11px; color: var(--chr-ink-dim);
  margin-left: 2px; font-weight: 600;
}
.chron-ace-meta-val.is-text {
  font-size: 13px; line-height: 1.15;
}
.chron-ace-quote {
  font-size: 12px; line-height: 1.7;
  color: var(--chr-ink-sub);
  padding: 10px 14px;
  background: rgba(200,190,170,0.22);
  border-left: 3px solid var(--chr-gold);
  border-radius: 4px;
  font-weight: 500;
}
.chron-ace-quote::before {
  content: '記者の目'; font-size: 9px; letter-spacing: 1px;
  color: var(--chr-gold); font-weight: 700;
  text-transform: uppercase; display: block; margin-bottom: 4px;
}
.chron-ace-narrative {
  margin-top: 8px;
  padding: 8px 12px;
  font-size: 11.5px; line-height: 1.7;
  color: var(--chr-ink-sub);
  background: rgba(220,210,190,0.18);
  border-left: 2px solid var(--chr-rule-bold);
  border-radius: 3px;
}
.chron-ace-narrative::before {
  content: '事実'; font-size: 9px; letter-spacing: 1px;
  color: var(--chr-ink-dim); font-weight: 700;
  text-transform: uppercase; display: block; margin-bottom: 3px;
}
.chron-gen-narrative {
  font-size: 10px; color: var(--chr-ink-sub);
  font-weight: 500; margin-top: 3px;
  line-height: 1.5;
}
.chron-rivals {
  list-style: none; padding: 0; margin: 0;
}
.chron-rival {
  display: flex; flex-wrap: wrap; gap: 6px 12px;
  padding: 8px 0;
  border-bottom: 1px dotted var(--chr-rule);
  align-items: baseline;
}
.chron-rival:last-child { border-bottom: none; }
.chron-rival-org {
  font-size: 12px; font-weight: 900;
  color: var(--chr-ink);
  flex-shrink: 0;
}
.chron-rival-record {
  font-size: 11px; color: var(--chr-ink-mid);
  font-weight: 700; letter-spacing: 0.3px;
}
.chron-rival-opp {
  font-size: 10px; color: var(--chr-ink-dim);
  flex-basis: 100%;
}
.chron-two-col {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 0;
}
.chron-col-left {
  padding: 18px 22px;
  border-right: 1px solid var(--chr-rule);
}
.chron-col-right { padding: 18px 22px; }
.chron-highlights {
  list-style: none;
  padding: 0 8px 0 0;
  margin: 0;
  max-height: 360px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--chr-rule-bold) transparent;
}
.chron-highlights::-webkit-scrollbar { width: 6px; }
.chron-highlights::-webkit-scrollbar-thumb { background: var(--chr-rule-bold); border-radius: 3px; }
.chron-highlight {
  display: flex; gap: 12px;
  padding: 9px 0;
  border-bottom: 1px dotted var(--chr-rule);
  align-items: baseline;
}
.chron-highlight:last-child { border-bottom: none; }
.chron-highlight-season {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--chr-ink-dim);
  letter-spacing: 0.5px;
  width: 42px;
  font-weight: 700;
}
.chron-highlight-text {
  flex: 1; font-size: 12px;
  line-height: 1.6;
  color: var(--chr-ink-sub);
  font-weight: 500;
}
.chron-highlight-text strong {
  color: var(--chr-ink); font-weight: 900;
}
.chron-highlight-gold .chron-highlight-season { color: var(--chr-gold); }
.chron-highlight-silver .chron-highlight-season { color: var(--chr-silver); }
.chron-highlight-red .chron-highlight-season { color: var(--chr-red); }
.chron-gen-list { list-style: none; padding: 0; margin: 0; }
.chron-gen-member {
  display: flex; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dotted var(--chr-rule);
  align-items: center;
}
.chron-gen-member:last-child { border-bottom: none; }
.chron-gen-portrait {
  width: 42px; height: 42px;
  border-radius: 6px;
  background: linear-gradient(135deg, #d4c4a0 0%, #b8a07a 100%);
  border: 2px solid rgba(154,112,32,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; font-weight: 900;
  color: var(--chr-ink);
  flex-shrink: 0;
  overflow: hidden;
}
.chron-gen-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.chron-gen-info { flex: 1; min-width: 0; }
.chron-gen-name {
  font-size: 13px; font-weight: 900;
  color: var(--chr-ink); line-height: 1.2;
}
.chron-gen-meta {
  font-size: 10px; color: var(--chr-ink-dim);
  font-weight: 500; margin-top: 2px;
}
.chron-gen-ovr {
  font-size: 17px; color: var(--chr-ink-mid);
  letter-spacing: 0.5px; flex-shrink: 0; font-weight: 700;
  display: flex; flex-direction: column; align-items: flex-end; line-height: 1.05;
}
.chron-gen-ovr .chron-gen-stat-key {
  font-size: 8px; letter-spacing: 1.2px;
  color: var(--chr-ink-dim); font-weight: 700;
  margin-top: 2px;
}
.chron-gen-ovr .chron-gen-pop {
  font-size: 14px; color: var(--chr-ink-dim);
  font-weight: 700; margin-top: 1px;
}
.chron-gen-member.idol {
  background: var(--chr-idol-bg);
  border-left: 2px solid var(--chr-idol);
  padding-left: 8px; margin-left: -10px; margin-right: -2px;
  border-radius: 0 4px 4px 0;
}
.chron-gen-member.idol .chron-gen-portrait {
  background: linear-gradient(135deg, #e8c4d4 0%, #c89aae 100%);
  border-color: var(--chr-idol);
  box-shadow: 0 0 6px rgba(176,51,102,0.18);
}
.chron-gen-member.idol .chron-gen-name,
.chron-gen-member.idol .chron-gen-ovr { color: var(--chr-idol); }
.chron-gen-idol-tag {
  display: block;
  font-size: 8px;
  letter-spacing: 1.2px;
  color: var(--chr-idol);
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 2px;
}
/* Phase B: stage 別 4 枠の役割タグ。idol タグと並ぶ小型ラベル。 */
.chron-gen-role-tag {
  display: block;
  font-size: 8px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 2px;
  opacity: 0.78;
}
.chron-gen-role-tag.chron-gen-role-strength { color: var(--chr-rule-bold, #5f4523); }
.chron-gen-role-tag.chron-gen-role-rising { color: #4a8a3c; }
.chron-gen-role-tag.chron-gen-role-veteran { color: #6b5a3e; }
.chron-gen-member.rising .chron-gen-portrait { border-color: #4a8a3c; }
.chron-gen-member.veteran .chron-gen-portrait { border-color: #6b5a3e; opacity: 0.92; }
.chron-era-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-top: 4px;
}
.chron-era-stat {
  padding: 8px 10px;
  background: rgba(95,69,35,0.05);
  border-left: 2px solid var(--chr-rule-bold);
  display: flex; flex-direction: column;
  justify-content: flex-end;
  min-height: 50px;
}
.chron-era-stat-key {
  font-size: 9px; color: var(--chr-ink-dim);
  letter-spacing: 1px; text-transform: uppercase;
  font-weight: 700; margin-bottom: 4px;
  line-height: 1;
}
.chron-era-stat-val {
  font-size: 18px; color: var(--chr-ink);
  line-height: 1; font-weight: 700;
  display: flex; align-items: baseline; gap: 1px;
}
.chron-era-stat-val .small {
  font-size: 10px; color: var(--chr-ink-dim);
  margin-left: 2px; font-weight: 600;
}
.chron-closing {
  padding: 16px 22px 18px;
  border-top: 3px double var(--chr-rule-bold);
  background: rgba(95,69,35,0.04);
  text-align: center;
}
.chron-closing-eyebrow {
  font-size: 9px; letter-spacing: 2.5px;
  color: var(--chr-ink-dim); text-transform: uppercase;
  font-weight: 700; margin-bottom: 6px;
}
.chron-closing-line {
  font-size: 14px; color: var(--chr-ink-sub);
  line-height: 1.7; font-weight: 500;
  font-style: italic; letter-spacing: 0.5px;
}
.chron-closing-line strong {
  color: var(--chr-ink); font-weight: 900;
  font-style: normal; padding: 0 2px;
}
.chron-nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 22px;
  border-top: 1px solid var(--chr-rule);
  background: rgba(95,69,35,0.03);
}
.chron-nav-btn {
  font-size: 11px; letter-spacing: 1.5px;
  color: var(--chr-ink-sub); font-weight: 700;
  text-transform: uppercase; cursor: pointer;
  padding: 6px 12px;
  border: 1px solid var(--chr-rule-bold);
  background: transparent; transition: all .15s;
}
.chron-nav-btn:hover { background: rgba(95,69,35,0.08); }
.chron-nav-btn.disabled { opacity: 0.3; cursor: default; pointer-events: none; }
.chron-nav-center {
  font-size: 10px; color: var(--chr-ink-dim);
  letter-spacing: 1.5px; font-weight: 700;
}
.chron-empty {
  padding: 60px 40px 48px; text-align: center;
}
.chron-empty-icon { font-size: 52px; margin-bottom: 16px; }
.chron-empty-title {
  font-size: 16px; color: var(--chr-ink);
  font-weight: 700; margin-bottom: 12px;
}
.chron-empty-text {
  font-size: 13px; color: var(--chr-ink-sub);
  line-height: 1.8;
}
.chron-empty-divider {
  width: 60px; height: 1px; margin: 22px auto 18px;
  background: var(--chr-rule-bold);
}
.chron-empty-meta {
  display: inline-block; text-align: left;
  padding: 12px 22px;
  background: rgba(95,69,35,0.05);
  border-left: 2px solid var(--chr-rule-bold);
  margin-bottom: 16px;
}
.chron-empty-meta-row {
  display: flex; gap: 18px; align-items: baseline;
  font-size: 11px; padding: 3px 0;
}
.chron-empty-meta-key {
  color: var(--chr-ink-dim); letter-spacing: 0.5px;
  font-weight: 700; min-width: 100px;
}
.chron-empty-meta-val {
  color: var(--chr-ink-sub); font-weight: 700;
}
.chron-empty-flavor {
  font-size: 11px; color: var(--chr-ink-dim);
  font-style: italic; letter-spacing: 0.5px;
  margin-top: 8px;
}
.chron-header.in-progress {
  background: repeating-linear-gradient(135deg,
    transparent 0 14px,
    rgba(154,112,32,0.04) 14px 15px);
}
.chron-writing-mark {
  display: inline-block;
  font-size: 10px; letter-spacing: 2px;
  color: var(--chr-gold-light); font-weight: 900;
  padding: 1px 7px; margin-left: 8px;
  border: 1px dashed var(--chr-gold);
  vertical-align: middle;
  animation: chron-writing-blink 2.4s ease-in-out infinite;
}
@keyframes chron-writing-blink {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
.chron-writing-note {
  display: inline-block;
  margin-top: 10px; padding: 6px 14px;
  font-size: 11px; color: var(--chr-gold);
  background: rgba(154,112,32,0.08);
  border: 1px dashed var(--chr-gold);
  letter-spacing: 0.3px; font-weight: 500;
  line-height: 1.5; max-width: 560px;
}
.chron-closing.in-progress {
  background: repeating-linear-gradient(135deg,
    rgba(95,69,35,0.04) 0 14px,
    rgba(154,112,32,0.06) 14px 15px);
}
.chron-closing-note {
  font-size: 10px; color: var(--chr-ink-dim);
  margin-top: 8px; letter-spacing: 0.3px;
  font-style: normal; line-height: 1.5;
}
/* Phase 3: HoFバッジ・相互リンク */
.chron-hof-badge {
  display: inline-block; font-size: 11px;
  vertical-align: middle; margin-left: 4px;
  cursor: pointer; opacity: 0.8; transition: opacity .15s;
}
.chron-hof-badge:hover { opacity: 1; }
.chron-hof-link {
  cursor: pointer;
  border-bottom: 1px dotted var(--chr-gold);
  transition: color .15s;
}
.chron-hof-link:hover { color: var(--chr-gold); }
/* Phase 3: 2枚看板専用レイアウト */
.chron-dual-wrap {
  display: grid;
  grid-template-columns: 1fr 28px 1fr;
  gap: 0;
  align-items: stretch;
  padding: 0 4px;
}
.chron-dual-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}
/* dual-info を flex column にして meta-row が同じ位置で揃うようにする */
.chron-dual-card .chron-dual-info {
  display: flex; flex-direction: column;
  flex: 1;
}
.chron-dual-card .chron-dual-info > .chron-dual-meta-row {
  margin-top: auto;
}
.chron-dual-card .chron-dual-info > .chron-ace-narrative {
  margin-top: 6px;
}
.chron-dual-portrait {
  width: 130px; height: 168px;
  background: linear-gradient(135deg, #d4c4a0 0%, #a8916a 100%);
  border: 3px solid var(--chr-gold);
  box-shadow: 0 0 10px rgba(154,112,32,0.22),
              inset 0 0 24px rgba(95,69,35,0.18);
  display: flex; align-items: center; justify-content: center;
  color: var(--chr-ink);
  position: relative; overflow: hidden;
}
.chron-dual-portrait img {
  width: 100%; height: 100%; object-fit: cover; object-position: center top;
}
.chron-dual-portrait::before {
  content: ''; position: absolute; inset: 3px;
  border: 1px solid rgba(154,112,32,0.5);
  pointer-events: none;
}
.chron-dual-portrait-letter {
  font-size: 72px; font-weight: 900;
}
.chron-dual-info { width: 100%; text-align: center; }
.chron-dual-tagline {
  display: inline-block;
  font-size: 9px; letter-spacing: 2px;
  color: var(--chr-gold); text-transform: uppercase;
  font-weight: 700; margin-bottom: 3px;
}
.chron-dual-name {
  font-size: 18px; font-weight: 900;
  color: var(--chr-ink); letter-spacing: 0.5px;
  line-height: 1.2; margin-bottom: 8px;
}
.chron-dual-meta-row {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 8px 0;
  border-top: 1px dashed var(--chr-rule);
  border-bottom: 1px dashed var(--chr-rule);
  margin-bottom: 8px;
  align-items: end;
}
.chron-dual-meta {
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-end;
  text-align: center;
  min-height: 38px;
}
.chron-dual-meta-key {
  font-size: 8px; color: var(--chr-ink-dim);
  letter-spacing: 0.8px; text-transform: uppercase;
  font-weight: 700; margin-bottom: 3px;
  line-height: 1;
}
.chron-dual-meta-val {
  font-size: 17px; color: var(--chr-ink);
  line-height: 1; font-weight: 700;
  display: flex; align-items: baseline;
  justify-content: center; gap: 1px;
}
.chron-dual-meta-val .small {
  font-size: 9px; color: var(--chr-ink-dim);
  margin-left: 1px; font-weight: 600;
}
.chron-dual-meta-val.is-text { font-size: 11px; line-height: 1.1; }
.chron-dual-shared-quote {
  margin: 0 22px 14px;
  font-size: 12px;
  line-height: 1.7;
}
.chron-dual-quote {
  font-size: 11px; line-height: 1.65;
  color: var(--chr-ink-sub);
  padding: 8px 10px;
  background: rgba(200,190,170,0.22);
  border-left: 3px solid var(--chr-gold);
  border-radius: 4px;
  font-weight: 500; text-align: left;
  width: 100%; box-sizing: border-box;
}
.chron-dual-quote::before {
  content: '記者の目'; font-size: 8px; letter-spacing: 1px;
  color: var(--chr-gold); font-weight: 700;
  text-transform: uppercase; display: block; margin-bottom: 3px;
}
.chron-dual-divider {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding-top: 56px;
  border-left: 1px solid var(--chr-rule);
  border-right: 1px solid var(--chr-rule);
  height: 100%; min-height: 180px;
}
.chron-dual-vs {
  font-size: 12px; letter-spacing: 3px;
  color: var(--chr-gold-light); font-weight: 900;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

/* ── 序章 (Prologue) VARIANT B 専用 ── */
.chron-prologue-roster {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 6px;
}
.chron-prologue-card {
  text-align: center;
  padding: 12px 8px;
  background: rgba(95,69,35,0.04);
  border: 1px solid var(--chr-rule);
  border-radius: 4px;
}
.chron-prologue-card.retired,
.chron-prologue-card.departed {
  filter: saturate(0.4);
  opacity: 0.7;
}
.chron-prologue-portrait {
  width: 72px; height: 90px; margin: 0 auto 8px;
  background: linear-gradient(135deg, #d4c4a0 0%, #b8a07a 100%);
  border: 2px solid var(--chr-gold-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 38px; font-weight: 900; color: var(--chr-ink);
  overflow: hidden;
}
.chron-prologue-card.idol .chron-prologue-portrait {
  background: linear-gradient(135deg, #e8c4d4 0%, #c89aae 100%);
  border-color: var(--chr-idol);
}
.chron-prologue-card.idol .chron-prologue-name { color: var(--chr-idol); }
.chron-prologue-card.champion .chron-prologue-portrait {
  border-color: var(--chr-gold);
  box-shadow: 0 0 6px rgba(154,112,32,0.3);
}
.chron-prologue-name {
  font-size: 13px; font-weight: 900; color: var(--chr-ink); line-height: 1.2;
}
.chron-prologue-style {
  font-size: 10px; color: var(--chr-ink-dim); margin-top: 3px; font-weight: 700;
}
.chron-prologue-badge {
  display: inline-block;
  font-size: 9px; letter-spacing: 1px;
  padding: 2px 6px; margin-top: 4px;
  background: var(--chr-gold); color: #fff;
  font-weight: 700; border-radius: 2px;
}
.chron-prologue-card.idol .chron-prologue-badge {
  background: var(--chr-idol);
}
.chron-prologue-badge.muted {
  background: var(--chr-silver);
  color: rgba(255,255,255,0.85);
}
.chron-prologue-quote {
  margin-top: 16px;
  font-size: 12px; color: var(--chr-ink-sub); line-height: 1.7;
  padding: 10px 14px;
  background: rgba(200,190,170,0.22);
  border-left: 3px solid var(--chr-gold-light);
  border-radius: 4px;
  font-weight: 500;
}
.chron-prologue-quote-eyebrow {
  display: block;
  font-size: 9px; letter-spacing: 1px;
  color: var(--chr-gold-light); font-weight: 700;
  text-transform: uppercase; margin-bottom: 4px;
}
@media (max-width: 700px) {
  .chron-wrap { margin-top: 6px; border-radius: 5px; }
  .chron-subhead, .chron-header, .chron-section,
  .chron-col-left, .chron-col-right { padding-left: 12px; padding-right: 12px; }
  .chron-title { font-size: 21px; }
  .chron-two-col { grid-template-columns: minmax(0, 1fr); }
  .chron-col-left { border-right: 0; border-bottom: 1px solid var(--chr-rule); }
  .chron-highlights { max-height: none; padding-right: 0; overflow: visible; }
  .chron-highlight { gap: 8px; align-items: flex-start; }
  .chron-highlight-season { width: 34px; font-size: 11px; }
  .chron-highlight-text { min-width: 0; font-size: 11px; line-height: 1.65; overflow-wrap: anywhere; }
  .chron-ace-row { grid-template-columns: 104px minmax(0, 1fr); gap: 12px; }
  .chron-ace-portrait { width: 104px; height: 140px; }
  .chron-ace-name { font-size: 20px; }
  .chron-ace-meta-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .chron-dual-wrap { grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 0; }
  .chron-dual-divider { display: none; }
  .chron-dual-card { border-bottom: 1px solid var(--chr-rule); padding-bottom: 12px; }
  .chron-dual-card:last-child { border-bottom: 0; }
  .chron-dual-shared-quote { margin-left: 0; margin-right: 0; }
}
</style>`;
}

// 序章ブロック (VARIANT B) — chronicle-prologue-mockup-v0.1.html 準拠
function _renderPrologueBlock(prologue, chapters) {
  const orgName = G.orgName || 'あなたの団体';
  const founderIds = prologue.founderIds || [];
  // founder の最新スナップショット (roster / archive / retiredFighters のいずれかから取得)
  const founders = founderIds.map(id => {
    const inRoster = (G.roster || []).find(c => c.id === id);
    const inArchive = (G.chronicle?.fighterArchive || []).find(a => a.id === id);
    const inRetired = (G.retiredFighters || []).find(f => f.id === id);
    const raw = (typeof ALL_CHARS !== 'undefined') ? ALL_CHARS.find(c => c.id === id) : null;
    const src = inRoster || inArchive || inRetired || raw || { id, name: '?' };
    return {
      id,
      name: src.name || '?',
      surname: src.surname || (src.name ? src.name.charAt(0) : '?'),
      style: src.style || 'Allround',
      role: src.role || 'Babyface',
      peakPopularity: src.peakPopularity || src.popularity || 0,
      titleWins: (src.careerRecord?.totalTitleWins) || 0,
      state: Engine.prologue.founderState(G, id),
    };
  });
  // 看板候補: peakPopularity 最大かつ 60+ かつ active のメンバー
  const idolThreshold = 60;
  const idolCandidate = founders.filter(f => f.peakPopularity >= idolThreshold)
    .sort((a, b) => b.peakPopularity - a.peakPopularity)[0];

  const STYLE_JP = { Striker:'打撃', Grappler:'組技', Submission:'関節技', Brawler:'喧嘩', Aerial:'空中戦', Allround:'万能' };
  const ROLE_JP = { Babyface:'ベビー', Heel:'ヒール', Tweener:'ニュートラル' };

  const isInProgress = prologue.status === 'in_progress';
  const totalTicks = chapters.length + 1; // 序 + 確定章
  let html = `<div class="chron-wrap">`;

  // Subhead
  html += `<div class="chron-subhead">
    <div class="chron-subhead-label">◆ 団体年代記 ◆</div>
    <div class="chron-subhead-org">${orgName}</div>
  </div>`;

  // Timeline (序のみ current)
  html += `<div class="chron-timeline"><div class="chron-timeline-rail">
    <div class="chron-timeline-line"></div>`;
  {
    const pct = totalTicks === 1 ? 50 : 6;
    const cls = `chron-timeline-tick current${isInProgress ? ' in-progress' : ''}`;
    html += `<div class="${cls}" style="left:${pct}%" onclick="setDbChronicleIdx(0)" title="序章"></div>`;
    html += `<div class="chron-timeline-label current" style="left:${pct}%" onclick="setDbChronicleIdx(0)">序</div>`;
  }
  chapters.forEach((c, i) => {
    const localIdx = i + 1;
    const pct = totalTicks === 1 ? 50 : 6 + (88 * localIdx / (totalTicks - 1));
    html += `<div class="chron-timeline-tick" style="left:${pct}%" onclick="setDbChronicleIdx(${i + 1})" title="${c.title}"></div>`;
    html += `<div class="chron-timeline-label" style="left:${pct}%" onclick="setDbChronicleIdx(${i + 1})">CH.${c.number}</div>`;
  });
  html += `</div></div>`;

  // Header
  html += `<div class="chron-header${isInProgress ? ' in-progress' : ''}">
    <div class="chron-eyebrow${isInProgress ? ' in-progress' : ''}">${isInProgress ? '◆ 序章 / 進行中 ◆' : '◆ 序章 ◆'}</div>
    <div class="chron-num">PROLOGUE${isInProgress ? ' <span class="chron-writing-mark">— WRITING —</span>' : ''}</div>
    <h2 class="chron-title">旗揚げ — 最初の5人と、最初の会場</h2>
    <div class="chron-period">SEASON ${prologue.startSeason} — ${isInProgress ? '現在' : `SEASON ${prologue.endSeason}`}</div>
    ${isInProgress ? `<div class="chron-writing-note">この章はまだ書きかけです。旗揚げメンバー全員が引退すると、序章が確定します。</div>` : ''}
  </div>`;

  // Founder roster grid
  html += `<div class="chron-section">
    <div class="chron-sec-label">旗揚げ世代</div>
    <div class="chron-prologue-roster">`;
  founders.forEach(f => {
    const portraitUrl = (typeof getPortraitUrl === 'function') ? getPortraitUrl(f.id) : '';
    const isChamp = f.titleWins >= 1;
    const isIdol = idolCandidate && f.id === idolCandidate.id;
    const cardCls = `chron-prologue-card${isChamp ? ' champion' : ''}${isIdol ? ' idol' : ''}${f.state === 'retired' ? ' retired' : ''}${f.state === 'departed' ? ' departed' : ''}`;
    const styleLabel = STYLE_JP[f.style] || f.style;
    const roleLabel = ROLE_JP[f.role] || f.role;
    let badge = '';
    if (isChamp) badge = `<div class="chron-prologue-badge">初代王者</div>`;
    else if (isIdol) badge = `<div class="chron-prologue-badge">看板</div>`;
    if (f.state === 'retired') badge = `<div class="chron-prologue-badge muted">引退</div>`;
    else if (f.state === 'departed') badge = `<div class="chron-prologue-badge muted">退団</div>`;
    const portraitInner = portraitUrl
      ? `<img src="${portraitUrl}" alt="${f.name}" style="width:100%;height:100%;object-fit:cover">`
      : `<span>${f.surname}</span>`;
    html += `<div class="${cardCls}">
      <div class="chron-prologue-portrait">${portraitInner}</div>
      <div class="chron-prologue-name">${f.name}</div>
      <div class="chron-prologue-style">${styleLabel} / ${roleLabel}</div>
      ${badge}
    </div>`;
  });
  html += `</div>`; // .chron-prologue-roster
  // 記者の見立て
  if (isInProgress) {
    html += `<div class="chron-prologue-quote">
      <span class="chron-prologue-quote-eyebrow">記者の見立て</span>
      この章の主役が誰になるかは、まだ確定していない。
      旗揚げの5人がそれぞれの形でこの団体を背負っている。
    </div>`;
  }
  html += `</div>`; // .chron-section

  // Two-col body: highlights + era stats
  const highlights = (prologue.highlights || []).slice().sort((a, b) =>
    (a.season - b.season) || (a.week - b.week)
  );
  const peakPop = founders.reduce((m, f) => Math.max(m, f.peakPopularity || 0), 0);
  const titleCount = founders.reduce((s, f) => s + (f.titleWins || 0), 0);
  const peakMQ = Math.max(G.seasonStats?.bestMQ || 0,
    (G.seasonHistory || []).reduce((m, s) => Math.max(m, s.bestMQ || 0), 0));

  html += `<div class="chron-two-col">
    <div class="chron-col-left">
      <div class="chron-sec-label">この時代の主な出来事</div>
      <ul class="chron-highlights">`;
  if (highlights.length === 0) {
    html += `<li class="chron-highlight"><div class="chron-highlight-text" style="color:var(--chr-ink-dim);font-style:italic">まだ出来事は刻まれていない。</div></li>`;
  } else {
    highlights.forEach(h => {
      const tierCls = _chronicleHighlightClass(h.tier);
      html += `<li class="chron-highlight${tierCls}">
        <div class="chron-highlight-season">S${h.season}</div>
        <div class="chron-highlight-text">${h.text}</div>
      </li>`;
    });
  }
  html += `</ul>
    </div>
    <div class="chron-col-right">
      <div class="chron-sec-label">この時代の通算</div>
      <div class="chron-era-stats">
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">TITLES</div>
          <div class="chron-era-stat-val">${titleCount}<span class="small">戴冠</span></div>
        </div>
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">PEAK MQ</div>
          <div class="chron-era-stat-val">${Math.round(peakMQ)}</div>
        </div>
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">PEAK POP</div>
          <div class="chron-era-stat-val">${Math.round(peakPop)}</div>
        </div>
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">STATUS</div>
          <div class="chron-era-stat-val" style="font-size:11px">${isInProgress ? '進行中' : '確定'}</div>
        </div>
      </div>
    </div>
  </div>`;

  // Closing
  const closingText = prologue.closing || (isInProgress ? 'この世代の物語は、まだ始まったばかりだ。' : '');
  html += `<div class="chron-closing${isInProgress ? ' in-progress' : ''}">
    <div class="chron-closing-eyebrow">— ${isInProgress ? '書きかけの章末' : '章末'} —</div>
    <div class="chron-closing-line">${closingText}</div>
    ${isInProgress ? `<div class="chron-closing-note">旗揚げメンバー全員が引退したとき、序章は閉じられます。</div>` : ''}
  </div>`;

  // Nav: 序章は次章のみ (chapters があれば)
  if (chapters.length > 0) {
    const nextCh = chapters[0];
    html += `<div class="chron-nav">
      <button class="chron-nav-btn disabled">◀ 前章なし</button>
      <div class="chron-nav-center">PROLOGUE</div>
      <button class="chron-nav-btn" onclick="setDbChronicleIdx(1)">次章 / ${nextCh.title} ▶</button>
    </div>`;
  } else {
    html += `<div class="chron-nav">
      <button class="chron-nav-btn disabled">◀ 前章なし</button>
      <div class="chron-nav-center">PROLOGUE</div>
      <button class="chron-nav-btn disabled">次章なし ▶</button>
    </div>`;
  }

  html += `</div>`; // .chron-wrap close
  return html;
}

function _renderDbChronicle() {
  const ch = (G && G.chronicle) || null;
  // 確定済み章のみ表示。in_progress は世代の中心が決まるまで伏せる
  const chapters = ((ch && ch.chaptersCache && ch.chaptersCache.chapters) || [])
    .filter(c => c.status === 'confirmed');
  // 序章は status が 'in_progress' / 'confirmed' で、かつ founderIds が実在する場合のみ表示
  // (status='empty' / 過去マイグレ残留の founderIds=[] は無視して既存挙動を保つ)
  const prologue = (G && G.prologue
    && (G.prologue.status === 'in_progress' || G.prologue.status === 'confirmed')
    && Array.isArray(G.prologue.founderIds)
    && G.prologue.founderIds.length > 0) ? G.prologue : null;

  // 序章 (idx=0) を選択中ならプロローグブロックを描画して終了
  if (prologue && _dbChronicleIdx === 0) {
    return _chronicleStyleBlock() + _renderPrologueBlock(prologue, chapters);
  }

  let html = _chronicleStyleBlock();
  html += `<div class="chron-wrap">`;

  // Subhead
  html += `<div class="chron-subhead">
    <div class="chron-subhead-label">◆ 団体年代記 ◆</div>
    <div class="chron-subhead-org">${G.orgName || 'あなたの団体'}</div>
  </div>`;

  // 空状態 (確定章ゼロ): 序章があれば自動で序章へ遷移、なければ既存の空状態
  if (chapters.length === 0 && prologue) {
    _dbChronicleIdx = 0;
    return _chronicleStyleBlock() + _renderPrologueBlock(prologue, chapters);
  }
  if (chapters.length === 0) {
    const rosterSize = (G.roster || []).length;
    const topByOvr = (G.roster || [])
      .map(c => ({ name: c.name, ovr: Engine.util.ov(c) || 0 }))
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 3);
    const nowSeason = G.season || 1;
    html += `<div class="chron-empty">
      <div class="chron-empty-icon">📖</div>
      <div class="chron-empty-title">${G.orgName || '団体'}にはまだ年代記が存在しません。</div>
      <div class="chron-empty-text">
        エース級の選手が引退し、ひとつの世代が終わったとき、<br>
        最初の章が記録されます。
      </div>
      <div class="chron-empty-divider"></div>
      <div class="chron-empty-meta">
        <div class="chron-empty-meta-row">
          <span class="chron-empty-meta-key">期間</span>
          <span class="chron-empty-meta-val">SEASON 1 — SEASON ${nowSeason}</span>
        </div>
        <div class="chron-empty-meta-row">
          <span class="chron-empty-meta-key">在籍選手</span>
          <span class="chron-empty-meta-val">${rosterSize}名</span>
        </div>
        ${topByOvr.length > 0 ? `
        <div class="chron-empty-meta-row">
          <span class="chron-empty-meta-key">代表的な選手</span>
          <span class="chron-empty-meta-val">${topByOvr.map(t => t.name).join(' ・ ')}</span>
        </div>` : ''}
      </div>
      <div style="display:flex;justify-content:center;padding:8px 22px 16px">
        <button class="chron-rebuild-btn" onclick="rebuildChronicle()">年代記を再構築</button>
      </div>
      <div class="chron-empty-flavor">
        — この選手たちの活躍が、物語を作っていきます。
      </div>
    </div>
    </div>`; // .chron-wrap close
    return html;
  }

  // 現在章
  if (_dbChronicleIdx === null || _dbChronicleIdx < 1 || _dbChronicleIdx > chapters.length) {
    _dbChronicleIdx = chapters.length; // 最新章
  }
  const current = chapters[_dbChronicleIdx - 1];

  // Timeline (序章があれば先頭に "序" tic)
  // Phase D: 章窓の重複を背景バンドで可視化。各章を seasonStart→seasonEnd の
  // 透過バンドとして描画し、重なりは視覚的に色濃く現れる。
  // tick は focusSeason 上に置き、章番号ラベルもそこに配置する。
  const minSeason = 1;
  const maxSeason = Math.max(
    ...chapters.map(c => c.seasonEnd || 0),
    (G && G.season) || 1,
    prologue ? (prologue.endSeason || prologue.startSeason || 1) : 1
  );
  const seasonToPct = (s) => {
    if (maxSeason <= minSeason) return 50;
    return 6 + 88 * (s - minSeason) / (maxSeason - minSeason);
  };
  html += `<div class="chron-timeline"><div class="chron-timeline-rail">`;
  // 章窓バンド (tick より下層)
  chapters.forEach((c, i) => {
    const left = seasonToPct(c.seasonStart || 1);
    const right = seasonToPct(c.seasonEnd || c.seasonStart || 1);
    const width = Math.max(2, right - left);
    const isCurrent = (i + 1) === _dbChronicleIdx;
    const bandCls = `chron-timeline-band${isCurrent ? ' current' : ''}${c._fledgling ? ' fledgling' : ''}`;
    html += `<div class="${bandCls}" style="left:${left}%;width:${width}%" title="CH.${c.number} S${c.seasonStart}-${c.seasonEnd}"></div>`;
  });
  html += `<div class="chron-timeline-line"></div>`;
  if (prologue) {
    const pct = seasonToPct(prologue.startSeason || 1);
    const inProg = prologue.status === 'in_progress';
    const cls = `chron-timeline-tick${inProg ? ' in-progress' : ''}`;
    html += `<div class="${cls}" style="left:${pct}%" onclick="setDbChronicleIdx(0)" title="序章"></div>`;
    html += `<div class="chron-timeline-label" style="left:${pct}%" onclick="setDbChronicleIdx(0)">序</div>`;
  }
  chapters.forEach((c, i) => {
    // tick は focusSeason に置く (重複窓の中心点)
    const pct = seasonToPct(c.focusSeason || c.seasonStart || 1);
    const isCurrent = (i + 1) === _dbChronicleIdx;
    const cls = `chron-timeline-tick${isCurrent ? ' current' : ''}${c.status === 'in_progress' ? ' in-progress' : ''}`;
    html += `<div class="${cls}" style="left:${pct}%" onclick="setDbChronicleIdx(${i + 1})" title="${c.title}"></div>`;
    html += `<div class="chron-timeline-label${isCurrent ? ' current' : ''}" style="left:${pct}%" onclick="setDbChronicleIdx(${i + 1})">CH.${c.number}</div>`;
  });
  html += `</div></div>`;

  // Chapter header
  const isInProgress = current.status === 'in_progress';
  const romanNum = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][current.number] || current.number.toString();
  // Phase D: 前後章との重複インジケータ
  const overlapWith = (other) => {
    if (!other) return null;
    const start = Math.max(current.seasonStart, other.seasonStart || 0);
    const end = Math.min(current.seasonEnd, other.seasonEnd || 0);
    if (start > end) return null;
    return { start, end, ch: other };
  };
  const prevOverlap = overlapWith(chapters[_dbChronicleIdx - 2]);
  const nextOverlap = overlapWith(chapters[_dbChronicleIdx]);
  const focusLine = current.focusSeason
    ? `<span class="chron-focus-tag">焦点: SEASON ${current.focusSeason}</span>`
    : '';
  let overlapHtml = '';
  if (prevOverlap || nextOverlap) {
    const parts = [];
    if (prevOverlap) parts.push(`<span class="chron-overlap-prev">← 第${prevOverlap.ch.number}章と SEASON ${prevOverlap.start}–${prevOverlap.end} で重なる</span>`);
    if (nextOverlap) parts.push(`<span class="chron-overlap-next">第${nextOverlap.ch.number}章と SEASON ${nextOverlap.start}–${nextOverlap.end} で重なる →</span>`);
    overlapHtml = `<div class="chron-overlap-row">${parts.join('<span class="chron-overlap-sep">・</span>')}</div>`;
  }

  html += `<div class="chron-header${isInProgress ? ' in-progress' : ''}">
    <div class="chron-eyebrow${isInProgress ? ' in-progress' : ''}">${isInProgress ? '◆ 進行中の章 ◆' : `◆ 第${current.number}章 ◆`}</div>
    <div class="chron-num">CHAPTER ${romanNum}${isInProgress ? ' <span class="chron-writing-mark">— WRITING —</span>' : ''}</div>
    <h2 class="chron-title">${current.title} — ${current.subtitle}</h2>
    <div class="chron-period">SEASON ${current.seasonStart} — SEASON ${current.seasonEnd}${isInProgress ? ' / 現在' : ''} ${focusLine}</div>
    ${overlapHtml}
    ${isInProgress ? `<div class="chron-writing-note">この章はまだ書きかけです。選手たちが引退して数年が経つと、章が確定します。</div>` : ''}
  </div>`;

  // Ace feature row — Phase 3: 2枚看板専用レイアウト + HoFバッジ
  const aces = current.aces || [];
  const peers = current.peers || [];
  const isDual = aces.length >= 2;

  // HoF IDセット (年代記内でのHoFバッジ判定用)
  const hofSet = new Set(((G.allHallOfFame || {}).player || []).map(h => h.id));

  // ポートレート HTML ビルダー
  const _buildAcePortrait = (a, isDualPortrait) => {
    const pUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(a.id || 0, a.peakOVR || 0) : '';
    const letter = Engine.chronicle._getSurname(a.name).charAt(0);
    if (isDualPortrait) {
      const img = pUrl
        ? `<img src="${pUrl}" onerror="this.remove()" alt=""><span class="chron-dual-portrait-letter" style="display:none">${letter}</span>`
        : `<span class="chron-dual-portrait-letter">${letter}</span>`;
      return `<div class="chron-dual-portrait">${img}</div>`;
    }
    const img = pUrl
      ? `<img src="${pUrl}" onerror="this.remove()" alt=""><span class="chron-ace-portrait-letter" style="display:none">${letter}</span>`
      : `<span class="chron-ace-portrait-letter">${letter}</span>`;
    return `<div class="chron-ace-portrait">${img}</div>`;
  };

  html += `<div class="chron-section">
    <div class="chron-sec-label">${isDual ? 'この時代の二枚看板' : 'この時代のエース'}</div>`;

  if (isDual) {
    // ── 2枚看板専用レイアウト ────────────────────────────
    const buildDualCard = (a) => {
      const hofBadge = hofSet.has(a.id)
        ? `<span class="chron-hof-badge" onclick="openHofDetailById(${a.id})" title="殿堂入り">🏅</span>`
        : '';
      const nameHtml = hofSet.has(a.id)
        ? `<span class="chron-hof-link" onclick="openHofDetailById(${a.id})">${a.name}</span>${hofBadge}`
        : a.name;
      return `<div class="chron-dual-card">
        ${_buildAcePortrait(a, true)}
        <div class="chron-dual-info">
          <div class="chron-dual-tagline">ACE OF THE ERA</div>
          <div class="chron-dual-name">${nameHtml}</div>
          <div class="chron-dual-meta-row">
            <div class="chron-dual-meta">
              <div class="chron-dual-meta-key">PEAK OVR</div>
              <div class="chron-dual-meta-val">${a.peakOVR || 0}</div>
            </div>
            <div class="chron-dual-meta">
              <div class="chron-dual-meta-key">PEAK POP</div>
              <div class="chron-dual-meta-val">${a.peakPopularity || 0}</div>
            </div>
            <div class="chron-dual-meta">
              <div class="chron-dual-meta-key">STYLE</div>
              <div class="chron-dual-meta-val is-text">${_chronicleStyleLabel(a.style)}</div>
            </div>
            <div class="chron-dual-meta">
              <div class="chron-dual-meta-key">ERA RUN</div>
              <div class="chron-dual-meta-val">${a.seasons || 1}<span class="small">期</span></div>
            </div>
            <div class="chron-dual-meta">
              <div class="chron-dual-meta-key">TITLES</div>
              <div class="chron-dual-meta-val">${a.titleReigns || 0}<span class="small">戴冠</span></div>
            </div>
          </div>
          ${a.narrative ? `<div class="chron-ace-narrative">${a.narrative}</div>` : ''}
        </div>
      </div>`;
    };
    html += `<div class="chron-dual-wrap">
      ${buildDualCard(aces[0])}
      <div class="chron-dual-divider"><div class="chron-dual-vs">＆</div></div>
      ${buildDualCard(aces[1])}
    </div>`;
    // 統合「記者の目」: 二枚看板の quote が個別だと内容が酷似するため 1 つにまとめる
    html += `<div class="chron-ace-quote chron-dual-shared-quote">${Engine.chronicle.buildDualAceQuote(aces, current, G)}</div>`;
  } else {
    // ── 単独エースレイアウト（従来ベース） ──────────────────
    const a = aces[0];
    const hofBadge = hofSet.has(a.id)
      ? `<span class="chron-hof-badge" onclick="openHofDetailById(${a.id})" title="殿堂入り">🏅</span>`
      : '';
    const nameHtml = hofSet.has(a.id)
      ? `<span class="chron-hof-link" onclick="openHofDetailById(${a.id})">${a.name}</span>${hofBadge}`
      : a.name;
    html += `<div class="chron-ace-row">
      ${_buildAcePortrait(a, false)}
      <div>
        <div class="chron-ace-tagline">ACE OF THE ERA</div>
        <div class="chron-ace-name">${nameHtml}</div>
        <div class="chron-ace-meta-row">
          <div class="chron-ace-meta">
            <div class="chron-ace-meta-key">PEAK OVR</div>
            <div class="chron-ace-meta-val">${a.peakOVR || 0}</div>
          </div>
          <div class="chron-ace-meta">
            <div class="chron-ace-meta-key">PEAK POP</div>
            <div class="chron-ace-meta-val">${a.peakPopularity || 0}</div>
          </div>
          <div class="chron-ace-meta">
            <div class="chron-ace-meta-key">STYLE</div>
            <div class="chron-ace-meta-val is-text">${_chronicleStyleLabel(a.style)}</div>
          </div>
          <div class="chron-ace-meta">
            <div class="chron-ace-meta-key">ERA RUN</div>
            <div class="chron-ace-meta-val">${a.seasons || 1}<span class="small">期</span></div>
          </div>
          <div class="chron-ace-meta">
            <div class="chron-ace-meta-key">TITLES</div>
            <div class="chron-ace-meta-val">${a.titleReigns || 0}<span class="small">戴冠</span></div>
          </div>
        </div>
        <div class="chron-ace-quote">${_chronicleAceQuote(a, current)}</div>
        ${a.narrative ? `<div class="chron-ace-narrative">${a.narrative}</div>` : ''}
      </div>
    </div>`;
  }

  html += `</div>`;

  // Two-column body
  html += `<div class="chron-two-col">
    <div class="chron-col-left">
      <div class="chron-sec-label">この時代の主な出来事</div>`;
  const hl = current.highlights || [];
  if (hl.length === 0) {
    html += `<div style="font-size:12px;color:var(--chr-ink-dim);padding:8px 0">特筆すべき記録は残されなかった。</div>`;
  } else {
    html += `<ul class="chron-highlights">`;
    hl.forEach(h => {
      html += `<li class="chron-highlight${_chronicleHighlightClass(h.tier)}">
        <div class="chron-highlight-season">S${h.season || '?'}</div>
        <div class="chron-highlight-text">${h.text}</div>
      </li>`;
    });
    html += `</ul>`;
  }

  // 左列に「外敵」と「通算」を移動して左右のボリュームを揃える (Phase D 微調整)
  const xrLeft = current.externalRivals || [];
  if (xrLeft.length > 0) {
    html += `<div class="chron-sec-label" style="margin-top:18px">この時代の外敵</div>
      <ul class="chron-rivals">`;
    xrLeft.forEach(r => {
      const recordParts = [];
      if (r.wins > 0) recordParts.push(`${r.wins}勝`);
      if (r.losses > 0) recordParts.push(`${r.losses}敗`);
      if (r.draws > 0) recordParts.push(`${r.draws}分`);
      const record = recordParts.join('') || `${r.total}戦`;
      const oppFrag = (r.mainOpponents && r.mainOpponents.length > 0)
        ? `<span class="chron-rival-opp">主な相手: ${r.mainOpponents.join('・')}</span>`
        : '';
      html += `<li class="chron-rival">
        <div class="chron-rival-org">${r.orgName}</div>
        <div class="chron-rival-record">${r.total}戦 ${record}</div>
        ${oppFrag}
      </li>`;
    });
    html += `</ul>`;
  }
  {
    const es = current.eraStats || {};
    html += `<div class="chron-sec-label" style="margin-top:18px">この時代の通算</div>
      <div class="chron-era-stats">
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">TITLES</div>
          <div class="chron-era-stat-val">${es.totalTitleWins || 0}<span class="small">戴冠</span></div>
        </div>
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">${es.competitiveRecord ? es.competitiveRecord.label : 'VS S-TIER'}</div>
          <div class="chron-era-stat-val">${es.competitiveRecord ? _chronicleCompetitiveValueHtml(es.competitiveRecord.valueText) : `${(es.vsStier && es.vsStier.wins) || 0}<span class="small">勝</span>${(es.vsStier && es.vsStier.losses) || 0}<span class="small">敗</span>`}</div>
        </div>
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">PEAK POP</div>
          <div class="chron-era-stat-val">${es.peakOrgPop || 0}</div>
        </div>
        <div class="chron-era-stat">
          <div class="chron-era-stat-key">STATUS</div>
          <div class="chron-era-stat-val" style="font-size:11px">${current.status === 'confirmed' ? '確定' : '進行中'}</div>
        </div>
      </div>`;
  }
  html += `</div><div class="chron-col-right">
    <div class="chron-sec-label">この時代の同期</div>`;
  if (peers.length === 0) {
    html += `<div style="font-size:12px;color:var(--chr-ink-dim);padding:8px 0">同期なし(単独エース)</div>`;
  } else {
    html += `<ul class="chron-gen-list">`;
    peers.forEach(p => {
      const surname = Engine.chronicle._getSurname(p.name);
      const letter = surname.charAt(0);
      const pUrl = (typeof getUpperUrl === 'function') ? getUpperUrl(p.id || 0, p.peakOVR || 0) : '';
      const imgHtml = pUrl
        ? `<img src="${pUrl}" onerror="this.style.display='none'" alt="">`
        : letter;
      const isIdol = p.role === 'idol';
      const isRising = p.role === 'rising';
      const isVeteran = p.role === 'veteran';
      const styleLabel = _chronicleStyleLabel(p.style);
      const metaParts = [styleLabel];
      // peer 行は narrative を主役に。OVR/人気 の数値繰り返しは ace 側のタイルに集約。
      if (isIdol && p.traits && p.traits.length > 0) metaParts.push(p.traits.slice(0, 2).join('・'));
      else if (p.titleReigns > 0) metaParts.push(`${p.titleReigns}度戴冠`);
      // HoFバッジ (hofSet は上のエースセクションで定義済み)
      const pHofBadge = hofSet.has(p.id)
        ? `<span class="chron-hof-badge" onclick="openHofDetailById(${p.id})" title="殿堂入り">🏅</span>`
        : '';
      const pNameHtml = hofSet.has(p.id)
        ? `<span class="chron-hof-link" onclick="openHofDetailById(${p.id})">${p.name}</span>${pHofBadge}`
        : p.name;
      // Phase B: 4 枠ごとの役割タグ
      let roleTag = '';
      if (isIdol) roleTag = `<div class="chron-gen-idol-tag">★ アイドル選手</div>`;
      else if (isRising) roleTag = `<div class="chron-gen-role-tag chron-gen-role-rising">▲ 若手ホープ</div>`;
      else if (isVeteran) roleTag = `<div class="chron-gen-role-tag chron-gen-role-veteran">◇ ベテラン</div>`;
      else roleTag = `<div class="chron-gen-role-tag chron-gen-role-strength">◆ 実力副官</div>`;
      const memberClass = `chron-gen-member${isIdol ? ' idol' : ''}${isRising ? ' rising' : ''}${isVeteran ? ' veteran' : ''}`;
      html += `<li class="${memberClass}">
        <div class="chron-gen-portrait">${imgHtml}</div>
        <div class="chron-gen-info">
          ${roleTag}
          <div class="chron-gen-name">${pNameHtml}</div>
          <div class="chron-gen-meta">${metaParts.join(' ・ ')}</div>
          ${p.narrative ? `<div class="chron-gen-narrative">${p.narrative}</div>` : ''}
        </div>
        <div class="chron-gen-ovr">
          <span class="chron-gen-ovr-val">${p.peakOVR || 0}</span>
          <span class="chron-gen-stat-key">OVR</span>
          <span class="chron-gen-pop">${p.peakPopularity || 0}</span>
          <span class="chron-gen-stat-key">人気</span>
        </div>
      </li>`;
    });
    html += `</ul>`;
  }

  // 外敵 / 通算 は左列へ移動済み (Phase D 微調整)
  html += `</div></div>`;

  // Closing
  if (current.closing) {
    html += `<div class="chron-closing${isInProgress ? ' in-progress' : ''}">
      <div class="chron-closing-eyebrow">— ${isInProgress ? '書きかけの章末' : '章末'} —</div>
      <div class="chron-closing-line">${current.closing}</div>
      ${isInProgress ? `<div class="chron-closing-note">この時代の気風はまだ動いています。この章の選手たちが引退したとき、最終的な傾向が確定します。</div>` : ''}
    </div>`;
  } else if (isInProgress) {
    html += `<div class="chron-closing in-progress">
      <div class="chron-closing-eyebrow">— 書きかけの章末 —</div>
      <div class="chron-closing-line">この世代が団体に残す傾向は、まだ確定していない。</div>
    </div>`;
  }

  // Nav
  const hasPrevChapter = _dbChronicleIdx > 1;
  const hasPrologueBack = _dbChronicleIdx === 1 && !!prologue;
  const hasPrev = hasPrevChapter || hasPrologueBack;
  const hasNext = _dbChronicleIdx < chapters.length;
  const prevChapter = hasPrevChapter ? chapters[_dbChronicleIdx - 2] : null;
  const nextChapter = hasNext ? chapters[_dbChronicleIdx] : null;
  const prevTarget = hasPrevChapter ? _dbChronicleIdx - 1 : 0;
  const prevLabel = hasPrologueBack ? '序章' : (prevChapter ? prevChapter.title : '前章なし');
  html += `<div class="chron-nav">
    <button class="chron-nav-btn${hasPrev ? '' : ' disabled'}" ${hasPrev ? `onclick="setDbChronicleIdx(${prevTarget})"` : ''}>
      ◀ ${hasPrev ? `前章 / ${prevLabel}` : '前章なし'}
    </button>
    <div class="chron-nav-center">CHAPTER ${romanNum} OF ${chapters.length}</div>
    <button class="chron-nav-btn${hasNext ? '' : ' disabled'}" ${hasNext ? `onclick="setDbChronicleIdx(${_dbChronicleIdx + 1})"` : ''}>
      ${hasNext ? `次章 / ${nextChapter.title}` : '次章なし'} ▶
    </button>
  </div>`;

  // Footer: rebuild button
  html += `<div style="display:flex;justify-content:center;padding:8px 22px 16px">
    <button class="chron-rebuild-btn" onclick="rebuildChronicle()">🔄 年代記を再構築</button>
  </div>`;

  html += `</div>`; // .chron-wrap close
  return html;
}

/** spec v0.2 §C.1 mode別 valueText の HTML 装飾 */
function _chronicleCompetitiveValueHtml(text) {
  if (!text) return '';
  let m = text.match(/^(\d+)度防衛(.*)$/);
  if (m) return `${m[1]}<span class="small">度防衛${m[2]}</span>`;
  m = text.match(/^(\d+)勝(\d+)敗$/);
  if (m) return `${m[1]}<span class="small">勝</span>${m[2]}<span class="small">敗</span>`;
  return text;
}

/** 記者コメント (Engine.chronicle.buildAceQuote のシム) */
function _chronicleAceQuote(ace, chapter) {
  if (Engine.chronicle && typeof Engine.chronicle.buildAceQuote === 'function') {
    return Engine.chronicle.buildAceQuote(ace, chapter, G);
  }
  return `${Engine.chronicle._getSurname(ace.name)}はこの世代の主役だった。`;
}

// ── 団体比較 ──────────────────────────────────────────────
let _dbCompareTarget = null; // null=自動選択（ランキングでプレイヤーのすぐ上の団体）

function _getDefaultCompareTarget() {
  const rankings = G.rankings || [];
  const playerRank = Engine.ranking.getPlayerRank(rankings);
  // プレイヤーの1つ上のランクの団体を探す
  const above = rankings.find(r => r.rank === playerRank - 1 && r.orgId !== 'player');
  if (above) return above.orgId;
  // 1位なら1つ下を見る
  const below = rankings.find(r => r.rank === playerRank + 1 && r.orgId !== 'player');
  if (below) return below.orgId;
  // フォールバック: 最初のAI団体
  return RIVAL_ORGS[0].id;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ORG COMPARE — 黒田幸子リニューアル版                      ║
// ╚══════════════════════════════════════════════════════════╝

function _renderDbOrgCompare() {
  // 初回表示時にデフォルト比較対象を自動選択
  if (!_dbCompareTarget) _dbCompareTarget = _getDefaultCompareTarget();
  const d = Engine.database.getOrgCompareAnalysis(G, _dbCompareTarget);
  const rc = d.rivalColor;
  const tierCls = d.rivalTier === 'S' ? 's' : d.rivalTier === 'A' ? 'a' : 'b';

  // ── ヘルパー ──
  function hexDim(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function signValue(n) { return n > 0 ? `+${n}` : `${n}`; }

  function getEdgeState(diff) {
    if (diff >= 8) return { cls: 'player', text: `${d.playerName}が圧倒` };
    if (diff >= 4) return { cls: 'player', text: `${d.playerName}が優勢` };
    if (diff >= 2) return { cls: 'player', text: `${d.playerName}が先行` };
    if (diff <= -8) return { cls: 'rival', text: `${d.rivalName}が圧倒` };
    if (diff <= -4) return { cls: 'rival', text: `${d.rivalName}が優勢` };
    if (diff <= -2) return { cls: 'rival', text: `${d.rivalName}が先行` };
    return { cls: 'even', text: 'ほぼ五分' };
  }

  function getPopularityTail(popDiff, slotIndex) {
    if (popDiff >= 8) {
      return [
        '人気でもこちらが大きくリードしており、興行の主導権は完全にこちらにある。',
        '人気面でも圧倒。集客力を含めた総合力でねじ伏せられる。',
        '人気でも完勝。ここまで差があれば興行の空気は自在に作れる。',
      ][slotIndex] || '人気でもこちらが大きくリード。';
    }
    if (popDiff >= 3) {
      return [
        '集客力でもこちらが上。興行の空気を作れるのは大きい。',
        '人気面でも先行しており、会場の後押しが期待できる。',
        '集客面の優位が下支えになる。地力の差が出る場面だ。',
      ][slotIndex] || '集客力でも上回っている。';
    }
    if (popDiff <= -8) {
      return [
        'ただし人気では大きく水をあけられている。集客面の不利は、そのまま興行の空気に直結する。',
        '一方で人気面では相手に大きく分がある。会場の温度差がそのまま試合の空気になる。',
        '集客面の弱さは団体の地力に響く。人気差がこれだけ開くと、興行全体の勢いが違ってくる。',
      ][slotIndex] || 'ただし人気では大きく水をあけられている。';
    }
    if (popDiff <= -3) {
      return [
        '一方、人気面では相手に分がある。集客への影響がボディブローのように効いてくる。',
        '人気差は無視できない。ファンの声援が試合の流れを変えることもある。',
        '人気で後手を踏んでいるのが気がかりだ。数字以上の壁を感じるかもしれない。',
      ][slotIndex] || '人気面では相手に分がある。';
    }
    return [
      '人気は互角。純粋な実力勝負の構図だ。',
      '人気差はほぼなし。勝負は地力で決まる。',
      '集客面は五分。ここは内容で差をつけたい。',
    ][slotIndex] || '人気は互角。';
  }

  function getMatchupSlot(index) {
    return [
      { chip: 'エース比較', center: 'エース対決', key: 'ace' },
      { chip: 'No.2比較', center: 'No.2対決', key: 'no2' },
      { chip: 'No.3比較', center: 'No.3対決', key: 'no3' },
    ][index] || { chip: '比較', center: 'VS', key: 'generic' };
  }

  function getMatchupCopy(slot, ovrDiff, popDiff, slotIndex) {
    const popTail = getPopularityTail(popDiff, slotIndex);
    if (slot.key === 'ace') {
      if (ovrDiff <= -8) return `エース比較？ 話にならない。看板に据えたら向こうのサンドバッグにされるだけだ。${popTail}`;
      if (ovrDiff <= -4) return `エース比較は正直キツい。真っ向勝負を挑んでも、主導権を握られる展開が目に見えている。${popTail}`;
      if (ovrDiff < 3) return `エース比較は互角。ここを五分で返せるなら、興行の格がまるで違ってくる。${popTail}`;
      if (ovrDiff < 8) return `エース比較は明確にこちらが上。メインの看板に据えて、堂々と押し切ればいい。${popTail}`;
      return `エース比較は圧勝。相手の看板ごと食い潰すつもりで前に出していい。遠慮は要らない。${popTail}`;
    }
    if (slot.key === 'no2') {
      if (ovrDiff <= -8) return `No.2対決でこの差は致命傷だ。二番手がこれでは、上位カードを組む意味すら危うい。${popTail}`;
      if (ovrDiff <= -4) return `No.2対決で押されている。戦力の厚みで勝負すると、こちらの薄さが余計に目立つ。${popTail}`;
      if (ovrDiff < 3) return `No.2対決は互角。ここで勝ち切れるかどうかが、団体の「層の厚さ」の証明になる。${popTail}`;
      if (ovrDiff < 8) return `No.2対決もこちらが上。主力層の充実を見せつけるには十分すぎるカードだ。${popTail}`;
      return `No.2対決まで圧倒している。相手の上位陣をまとめて凌駕しているのは、圧倒的な戦力の証だ。${popTail}`;
    }
    if (ovrDiff <= -8) return `三番手比較ですら負けている。もう個人の問題じゃなく、団体として戦力が足りていない。${popTail}`;
    if (ovrDiff <= -4) return `三番手で不利ということは、中堅以下は全滅に近い。団体力の差がモロに出る。${popTail}`;
    if (ovrDiff < 3) return `三番手は互角。ここを互角で回せれば、興行全体の見栄えを保てる。${popTail}`;
    if (ovrDiff < 8) return `三番手でも勝っている。層の厚さを示す意味で、一番分かりやすい優位だ。${popTail}`;
    return `三番手まで圧倒。どこを切っても勝てる戦力を揃えている。これが本物の団体力だ。${popTail}`;
  }

  // ── 黒田テキスト選択用seed ──
  const kurodaSeed = Engine.rng.derive(G.rngSeed, G.season, G.week, (_dbCompareTarget || '').charCodeAt(0) || 0, 0xCDA1);
  const kurodaRng = Engine.rng.create(kurodaSeed);
  function pickText(pool) {
    if (!pool || !pool.length) return '';
    return Engine.rng.pick(kurodaRng, pool);
  }

  // ── 黒田tier判定 ──
  function getKurodaTier(totalDiff) {
    if (totalDiff <= -60) return 'devastating';
    if (totalDiff <= -25) return 'behind';
    if (totalDiff <= 10) return 'even';
    if (totalDiff <= 40) return 'ahead';
    return 'dominant';
  }

  const totalDiff = d.totalDiff || 0;
  const kurodaTier = getKurodaTier(totalDiff);
  const textData = { playerName: d.playerName, rivalName: d.rivalName, chaseAxisLabel: d.chaseAxisLabel, leadAxisLabel: d.leadAxisLabel };

  const rivalDim = hexDim(rc, 0.12);
  const rivalGrad = `linear-gradient(90deg,${rc},${hexDim(rc, 0.6)})`;
  const fallbackTag = '分析中';
  const playerTags = d.playerTags.length ? d.playerTags : [fallbackTag];
  const rivalTags = d.rivalTags.length ? d.rivalTags : [fallbackTag];
  const _playerChampId = G.titles?.world?.championId;
  const _playerChampF = _playerChampId ? G.roster.find(f => f.id === _playerChampId) : null;
  const playerChampionName = _playerChampF
    ? _newsClickableName(_playerChampF.name, _playerChampF.id)
    : '不在';
  const rivalOrgData = G.aiOrgs?.[_dbCompareTarget];
  const _rivalChampId = rivalOrgData?.titles?.world?.championId;
  const _rivalChampF = _rivalChampId ? rivalOrgData.roster?.find(f => f.id === _rivalChampId) : null;
  const rivalChampionName = _rivalChampF
    ? _newsClickableName(_rivalChampF.name, _rivalChampF.id)
    : '不在';

  // ═══ 赤帯ヘッダー ═══
  const rivalDisplayName = G.rivalOrgNames?.[_dbCompareTarget] || d.rivalName;
  let html = `<div class="db-cmp-newspaper-header">
    <h1>週刊グラップル ── 団体比較</h1>
    <span>比較対象: ${rivalDisplayName} (ティア${d.rivalTier})</span>
  </div>
  <div class="db-cmp-wrap">`;

  // ═══ [SELECT] 比較対象選択 ═══
  html += `<div class="db-cmp-select">
    <label>比較対象</label>
    <select onchange="_dbCompareTarget=this.value;renderDatabase()">
      ${RIVAL_ORGS.map(o => `<option value="${o.id}" ${_dbCompareTarget === o.id ? 'selected' : ''}>${o.emoji} ${G.rivalOrgNames?.[o.id] || o.name || o.id} (ティア${o.tier})</option>`).join('')}
    </select>
  </div>`;

  // ═══ ① 特集ヘッダー ═══
  const headlineText = pickText(KURODA_HEADLINES[kurodaTier]);
  const headlineStr = typeof headlineText === 'function' ? headlineText(textData) : (headlineText || '');
  html += `<section class="db-cmp-headline">
    <div class="db-cmp-headline-reporter">
      <img src="${getNpcPortraitUrl('reporter')}" class="db-cmp-kuroda-face" alt="">
      <div class="db-cmp-headline-text">
        <div class="db-cmp-headline-quote">「${headlineStr}」</div>
        <div class="db-cmp-headline-byline">——黒田幸子 <span>週刊グラップル</span></div>
      </div>
    </div>
    <div class="db-cmp-headline-grade">
      <div class="grade-label">相性</div>
      <div class="grade-value">${d.grade}</div>
      <div class="grade-desc">${d.gradeDesc}</div>
    </div>
  </section>`;

  // ═══ ② 団体カードVS ═══
  function getPopTrend(side) {
    const hist = G.orgPopHistory?.[side] || [];
    const s1Pop = hist[0]?.start || 0;
    const currentPop = side === 'player' ? d.pOrgPop : d.rOrgPop;
    const delta = currentPop - s1Pop;
    if (s1Pop === 0 && delta === 0) return '';
    const cls = delta > 0 ? 'growth-up' : delta < 0 ? 'growth-down' : '';
    return `<div style="margin-top:6px;font-size:11px;color:#3a2a1a">S1: ${s1Pop} → 現在: ${currentPop} <span class="${cls}">${delta > 0 ? '+' : ''}${delta}</span></div>`;
  }

  function buildOrgSummaryCard(name, subtitle, sideCls, tierHtml, tags, rosterCount, orgPop, scores, championName, popTrend, styleAttr = '') {
    return `<article class="db-cmp-org-summary-card ${sideCls}" ${styleAttr}>
      <div class="db-cmp-org-summary-head">
        <div class="db-cmp-org-summary-name">
          <strong>${name}</strong>
          <span>${subtitle}</span>
        </div>
        ${tierHtml}
      </div>
      <div class="db-cmp-tags">${tags.slice(0, 2).map(t => `<span class="db-cmp-tag">${t}</span>`).join('')}</div>
      <div class="db-cmp-org-summary-statline">
        <span>TOP5総合 <strong>${scores.ace}</strong></span>
        <span>選手層 <strong>${rosterCount}</strong></span>
        <span>団体人気 <strong>${orgPop}</strong></span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#3a2a1a">王者 <strong style="color:#1a0a00">${championName}</strong></div>
      ${popTrend}
    </article>`;
  }

  html += `<div class="db-cmp-org-summary">
    <div class="db-cmp-org-summary-row" style="grid-template-columns:1fr 1fr;gap:14px;position:relative;">
      ${buildOrgSummaryCard(d.playerName, d.playerSubtitle, 'player', '<div class="db-cmp-tier player">プレイヤー</div>', playerTags, d.playerRosterCount, d.pOrgPop, d.playerScores, playerChampionName, getPopTrend('player'))}
      ${buildOrgSummaryCard(d.rivalName, d.rivalSubtitle, 'rival', `<div class="db-cmp-tier ${tierCls}">ティア${d.rivalTier}</div>`, rivalTags, d.rivalRosterCount, d.rOrgPop, d.rivalScores, rivalChampionName, getPopTrend(_dbCompareTarget), `style="--rival-dim:${rivalDim}"`)}
      <div class="db-cmp-vs-mark-circle">VS</div>
    </div>
  </div>`;

  // ═══ ③ 戦績サマリー ═══
  const rec = Engine.orgWar ? Engine.orgWar.getFor(G, 'player', _dbCompareTarget) : null;
  if (rec) {
    const totalW = rec.warsWon + rec.summitsWon + rec.ppvWon;
    const totalL = rec.warsLost + rec.summitsLost + rec.ppvLost;
    const totalD = rec.warsDraw || 0;
    const totalGames = totalW + totalL + totalD;
    let recordTier;
    if (totalGames === 0) recordTier = 'noRecord';
    else if (totalW === totalL) recordTier = 'evenRecord';
    else if (totalGames > 0 && totalW / totalGames >= 0.67) recordTier = 'heavyWinning';
    else if (totalW > totalL) recordTier = 'slightWinning';
    else if (totalGames > 0 && totalL / totalGames >= 0.67) recordTier = 'heavyLosing';
    else recordTier = 'slightLosing';

    const recTextData = { ...textData, wins: totalW, losses: totalL, streak: rec.streak };
    const warComment = pickText(KURODA_WAR_RECORD[recordTier]);
    const warCommentStr = typeof warComment === 'function' ? warComment(recTextData) : (warComment || '');
    let streakComment = '';
    if (rec.streak >= 3) {
      const sc = pickText(KURODA_WAR_RECORD.winStreak);
      streakComment = typeof sc === 'function' ? sc({ ...recTextData, streak: rec.streak }) : (sc || '');
    } else if (rec.streak <= -3) {
      const sc = pickText(KURODA_WAR_RECORD.loseStreak);
      streakComment = typeof sc === 'function' ? sc({ ...recTextData, streak: rec.streak }) : (sc || '');
    }

    let streakHtml = '';
    if (rec.streak >= 2) streakHtml = `<div class="db-cmp-war-streak win">${rec.streak}連勝中</div>`;
    else if (rec.streak <= -2) streakHtml = `<div class="db-cmp-war-streak lose">${Math.abs(rec.streak)}連敗中</div>`;

    html += `<section class="db-cmp-panel db-cmp-war-record">
      <h2 class="db-cmp-panel-title">対戦成績</h2>
      <div class="db-cmp-war-overall">
        <span class="db-cmp-war-label">通算</span>
        <strong class="db-cmp-war-wl">${totalW}勝${totalL}敗${totalD > 0 ? totalD + '分' : ''}</strong>
      </div>
      <div class="db-cmp-war-breakdown">
        <div class="db-cmp-war-item"><label>対抗戦</label><span>${rec.warsWon}勝${rec.warsLost}敗</span></div>
        <div class="db-cmp-war-item"><label>PPV</label><span>${rec.ppvWon}勝${rec.ppvLost}敗</span></div>
        <div class="db-cmp-war-item"><label>サミット</label><span>${rec.summitsWon}勝${rec.summitsLost}敗</span></div>
      </div>
      ${streakHtml}
      <div class="db-cmp-war-comment">
        <img src="${getNpcPortraitUrl('reporter')}" class="db-cmp-kuroda-face-sm" alt="">
        <p>「${warCommentStr}${streakComment ? ' ' + streakComment : ''}」</p>
      </div>
    </section>`;
  }

  // ═══ ④ Top 3 Matchups ═══
  // マッチアップフレーバーヘルパー
  function getStyleCategory(style) {
    const map = { Grappler: 'power', Striker: 'power', Brawler: 'power', Aerial: 'speed', Submission: 'tech', Allround: null };
    return map[style] || null;
  }
  function getStyleMatchupKey(s1, s2) {
    const a = getStyleCategory(s1), b = getStyleCategory(s2);
    if (!a || !b) return 'defaultStyle';
    if (a === b) return `${a}Vs${a.charAt(0).toUpperCase() + a.slice(1)}`;
    const sorted = [a, b].sort();
    return `${sorted[0]}Vs${sorted[1].charAt(0).toUpperCase() + sorted[1].slice(1)}`;
  }
  function getAgeFlavorKey(age1, age2) {
    const diff = Math.abs(age1 - age2);
    if (diff <= 2) {
      if (age1 <= 20 && age2 <= 20) return 'youngVsYoung';
      if (age1 >= 26 && age2 >= 26) return 'veteranVsVeteran';
      return 'sameGeneration';
    }
    const younger = Math.min(age1, age2);
    const older = Math.max(age1, age2);
    if (older >= 26 && younger <= 20) return 'veteranVsYoung';
    return null;
  }

  function buildMatchupCard(m, index) {
    const featured = index === 0;
    const slot = getMatchupSlot(index);
    const pUrl = getPortraitUrl(m.player.id);
    const rUrl = getPortraitUrl(m.rival.id);
    const pAvatar = pUrl ? `<img src="${pUrl}" alt="">` : m.player.name.charAt(0);
    const rAvatar = rUrl ? `<img src="${rUrl}" alt="">` : m.rival.name.charAt(0);
    const ovrDiff = m.player.ovr - m.rival.ovr;
    const popDiff = m.player.pop - m.rival.pop;
    const edge = getEdgeState(ovrDiff);
    let fullCopy = getMatchupCopy(slot, ovrDiff, popDiff, index);

    // 黒田フレーバー追加
    const flavors = [];
    // スタイル
    const pChar = ALL_CHARS.find(c => c.id === m.player.id);
    const rChar = ALL_CHARS.find(c => c.id === m.rival.id);
    if (pChar && rChar) {
      const styleKey = getStyleMatchupKey(pChar.style, rChar.style);
      const stylePick = pickText(KURODA_MATCHUP_FLAVOR.style[styleKey] || KURODA_MATCHUP_FLAVOR.style.defaultStyle);
      if (stylePick) flavors.push(typeof stylePick === 'function' ? stylePick(textData) : stylePick);
      // 年齢
      const pAge = pChar.age || (G.season + 17);
      const rAge = rChar.age || (G.season + 17);
      const ageKey = getAgeFlavorKey(pAge, rAge);
      if (ageKey) {
        const agePick = pickText(KURODA_MATCHUP_FLAVOR.age[ageKey] || []);
        if (agePick) flavors.push(typeof agePick === 'function' ? agePick(textData) : agePick);
      }
    }
    // h2h
    if (Engine.h2h) {
      const h2hRec = Engine.h2h.getRecordFor(G, m.player.id, m.rival.id);
      if (h2hRec && h2hRec.matches > 0) {
        const h2hData = { ...textData, selfWins: h2hRec.winsA, selfLosses: h2hRec.winsB };
        let h2hKey = 'evenRecord';
        if (h2hRec.winsA > h2hRec.winsB) h2hKey = 'winningRecord';
        else if (h2hRec.winsA < h2hRec.winsB) h2hKey = 'losingRecord';
        const h2hPick = pickText(KURODA_MATCHUP_FLAVOR.h2h[h2hKey] || []);
        if (h2hPick) flavors.push(typeof h2hPick === 'function' ? h2hPick(h2hData) : h2hPick);
      } else {
        const h2hPick = pickText(KURODA_MATCHUP_FLAVOR.h2h.firstMeeting || []);
        if (h2hPick) flavors.push(typeof h2hPick === 'function' ? h2hPick(textData) : h2hPick);
      }
    }
    // 最大2件を追記
    const selectedFlavors = flavors.slice(0, 2);
    if (selectedFlavors.length) fullCopy += ' ' + selectedFlavors.join(' ');

    // ── エース対決（index===0）: アリーナレイアウト ──
    if (featured) {
      const pStandUrl = getStandUrl(m.player.id, m.player.ovr);
      const rStandUrl = getStandUrl(m.rival.id, m.rival.ovr);
      const pStandHtml = pStandUrl
        ? `<img src="${pStandUrl}" alt="" onerror="this.parentNode.innerHTML='<div class=ace-char-fallback>${m.player.name.charAt(0)}</div>'">`
        : `<div class="ace-char-fallback">${m.player.name.charAt(0)}</div>`;
      const rStandHtml = rStandUrl
        ? `<img src="${rStandUrl}" alt="" onerror="this.parentNode.innerHTML='<div class=ace-char-fallback>${m.rival.name.charAt(0)}</div>'">`
        : `<div class="ace-char-fallback">${m.rival.name.charAt(0)}</div>`;

      return `<article class="db-cmp-match-featured">
        <div class="db-cmp-match-top">
          <span class="db-cmp-role-chip">${slot.chip}</span>
          <span class="db-cmp-edge ${edge.cls}">${edge.text}</span>
        </div>
        <div class="ace-arena">
          <div class="ace-char left">${pStandHtml}</div>
          <div class="ace-vs-center">
            <div class="ace-vs-text">VS</div>
            <div class="ace-vs-metrics">OVR差 ${signValue(ovrDiff)} / 人気差 ${signValue(popDiff)}</div>
          </div>
          <div class="ace-char right">${rStandHtml}</div>
        </div>
        <div class="ace-name-bar">
          <div class="ace-side">
            <strong onclick="event.stopPropagation();showFighterPopup(${m.player.id},'roster')">${m.player.name}</strong>
            <span>${d.playerName}/OVR${m.player.ovr}</span>
          </div>
          <div class="ace-side right">
            <span>${d.rivalName}/OVR${m.rival.ovr}</span>
            <strong onclick="event.stopPropagation();showFighterPopup(${m.rival.id},'ai:${_dbCompareTarget}')">${m.rival.name}</strong>
          </div>
        </div>
        <p class="db-cmp-match-copy">${fullCopy}</p>
      </article>`;
    }

    // ── No.2/No.3: 従来の丸アバター+テキスト形式 ──
    return `<article class="db-cmp-match-card">
      <div class="db-cmp-match-top">
        <span class="db-cmp-role-chip">${slot.chip}</span>
        <span class="db-cmp-edge ${edge.cls}">${edge.text}</span>
      </div>
      <div class="db-cmp-match-faceoff">
        <div class="db-cmp-match-side">
          <div class="db-cmp-match-avatar player" style="cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${m.player.id},'roster')">${pAvatar}</div>
          <div class="db-cmp-match-meta">
            <strong style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${m.player.id},'roster')">${m.player.name}</strong>
            <span>${d.playerName}</span>
            <span>OVR ${m.player.ovr} / 人気 ${m.player.pop}</span>
          </div>
        </div>
        <div class="db-cmp-match-center">
          <div class="db-cmp-match-vs">${slot.center}</div>
          <div class="db-cmp-match-metrics">
            <span>OVR差 ${signValue(ovrDiff)}</span>
            <span>人気差 ${signValue(popDiff)}</span>
          </div>
        </div>
        <div class="db-cmp-match-side right">
          <div class="db-cmp-match-avatar rival" style="background:linear-gradient(135deg,${hexDim(rc, 0.5)},${hexDim(rc, 0.25)});cursor:pointer" onclick="event.stopPropagation();showFighterPopup(${m.rival.id},'ai:${_dbCompareTarget}')">${rAvatar}</div>
          <div class="db-cmp-match-meta">
            <strong style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${m.rival.id},'ai:${_dbCompareTarget}')">${m.rival.name}</strong>
            <span>${d.rivalName}</span>
            <span>OVR ${m.rival.ovr} / 人気 ${m.rival.pop}</span>
          </div>
        </div>
      </div>
      <p class="db-cmp-match-copy">${fullCopy}</p>
    </article>`;
  }

  const topMatchups = d.matchups.slice(0, 3);
  if (topMatchups.length) {
    html += `<section class="db-cmp-spotlight-panel">
      <div class="db-cmp-panel-title rival-accent">主力対決</div>
      ${buildMatchupCard(topMatchups[0], 0)}
      ${topMatchups.length > 1 ? `<div class="db-cmp-match-grid">${topMatchups.slice(1).map((m, idx) => buildMatchupCard(m, idx + 1)).join('')}</div>` : ''}
    </section>`;
  } else {
    html += `<section class="db-cmp-spotlight-panel">
      <div class="db-cmp-panel-title rival-accent">主力対決</div>
      <div class="db-cmp-recommend"><p>比較対象になる主力カードがまだ揃っていません。</p></div>
    </section>`;
  }

  // ═══ ⑤ Power Snapshot — 左右対称バー型レーダー(4軸) ═══
  const AXES = [
    { key: 'ace', label: 'エース力' },
    { key: 'depth', label: '層の厚み' },
    { key: 'popularity', label: '集客力' },
    { key: 'starPower', label: 'タイトル力' },
  ];
  let barRadarRows = '';
  AXES.forEach(ax => {
    const pVal = d.playerScores[ax.key] || 0;
    const rVal = d.rivalScores[ax.key] || 0;
    const diff = (d.diffs && d.diffs[ax.key] != null) ? d.diffs[ax.key] : (pVal - rVal);
    const diffSign = diff > 0 ? `+${diff}` : `${diff}`;
    barRadarRows += `<div class="bar-row">
      <div class="bar-track left"><div class="bar-fill left" style="width:${Math.max(0, Math.min(100, pVal))}%"></div></div>
      <div class="bar-axis-label">${ax.label}<span class="axis-diff">${diffSign}</span></div>
      <div class="bar-track right"><div class="bar-fill right" style="width:${Math.max(0, Math.min(100, rVal))}%;background:linear-gradient(90deg,${rc},${hexDim(rc, 0.2)} 60%,transparent)"></div></div>
    </div>`;
  });

  html += `<section class="db-cmp-panel">
    <h2 class="db-cmp-panel-title">戦力レーダー</h2>
    <div style="font-size:10.5px;color:#6a5e4c;line-height:1.55;margin:0 6px 8px;padding:6px 8px;background:rgba(120,84,39,0.08);border-left:2px solid rgba(120,84,39,0.4);border-radius:0 3px 3px 0;">
      4軸 / 100点満点 ・ <strong>エース力</strong>=TOP3平均OVR÷100×100 ・ <strong>層の厚み</strong>=4〜8位5人の平均OVR÷80×100 (不足枠は0扱い) ・ <strong>集客力</strong>=団体人気そのまま ・ <strong>タイトル力</strong>=TOP5平均人気÷80×100
    </div>
    <div style="display:flex;justify-content:space-between;font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:1px;color:#5b4b34;margin-bottom:6px;padding:0 6px;">
      <span style="color:#6a4a10">◀ ${d.playerName}</span>
      <span style="color:${rc}">${d.rivalName} ▶</span>
    </div>
    <div class="org-bar-radar">${barRadarRows}</div>
  </section>`;

  // ═══ ⑥ 記者の総評コラム（GM Brief置換）═══
  const editorialPick = pickText(KURODA_EDITORIAL[kurodaTier]);
  const editorialStr = typeof editorialPick === 'function' ? editorialPick(textData) : (editorialPick || '');
  const planHtml = d.actions.slice(0, 2).map(a => `<div class="db-cmp-brief-card">
      <header><strong>${a.title}</strong><span class="db-cmp-badge ${a.badgeClass}">${a.badge}</span></header>
      <p>${a.text}</p>
    </div>`).join('') || `<div class="db-cmp-brief-card"><p>現時点で大きく動かすべきアクションはありません。</p></div>`;

  html += `<div class="db-cmp-panel">
    <h2 class="db-cmp-panel-title">記者コラム</h2>
    <div class="db-cmp-editorial">
      <img src="${getNpcPortraitUrl('reporter')}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;" alt="">
      <div class="db-cmp-editorial-body">
        <p>${editorialStr}</p>
        <div class="db-cmp-editorial-byline">——黒田幸子</div>
      </div>
    </div>
    <div class="db-cmp-editorial-actions">
      <strong>補強ポイント</strong>
      <div class="db-cmp-brief-grid">${planHtml}</div>
    </div>
  </div>`;

  // ═══ ⑦ 注目選手ピックアップ ═══
  const rivalRoster = rivalOrgData?.roster || [];
  const rivalOrgName = d.rivalName;
  if (rivalRoster.length > 0) {
    const picks = [];
    // 1. 最も成長した選手
    // ovrGainThisSeason: seasonStartOvrから算出（ない場合はgain=0）
    const rosterWithGain = rivalRoster.map(f => ({ ...f, ovrGainThisSeason: f.seasonStartOvr != null ? Engine.util.ov(f) - f.seasonStartOvr : 0 }));
    const growthSorted = [...rosterWithGain].sort((a, b) => (b.ovrGainThisSeason || 0) - (a.ovrGainThisSeason || 0));
    if (growthSorted[0] && (growthSorted[0].ovrGainThisSeason || 0) >= 3) {
      picks.push({ ...growthSorted[0], category: 'growth', ovrGain: growthSorted[0].ovrGainThisSeason });
    }
    // 2. 人気TOP
    const popSorted = [...rivalRoster].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    if (popSorted[0] && !picks.find(p => p.id === popSorted[0].id)) {
      picks.push({ ...popSorted[0], category: 'star', pop: Math.round(popSorted[0].popularity || 0) });
    }
    // 3. 若手脅威
    const young = rivalRoster.filter(f => (G.season - (f.debutSeason || 1)) <= 2);
    if (young.length) {
      const youngBest = young.sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
      if (youngBest && !picks.find(p => p.id === youngBest.id)) {
        picks.push({ ...youngBest, category: 'youngThreat' });
      }
    }
    // フォールバック: OVR最高
    if (picks.length < 2) {
      const ovrSorted = [...rivalRoster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
      for (const f of ovrSorted) {
        if (!picks.find(p => p.id === f.id)) { picks.push({ ...f, category: 'star', pop: Math.round(f.popularity || 0) }); break; }
      }
    }
    const spotPicks = picks.slice(0, 3);
    if (spotPicks.length > 0) {
      function getCategoryLabel(category, ovr) {
        if (category === 'star') {
          if (ovr >= 90) return 'エース級';
          if (ovr >= 75) return '主力級';
          return '人気先行';
        }
        return { growth: '要警戒', youngThreat: '若手脅威' }[category] || '';
      }
      html += `<section class="db-cmp-panel db-cmp-spotlight">
        <h2 class="db-cmp-panel-title rival-accent">${rivalOrgName} 注目選手</h2>
        ${spotPicks.map(p => {
          const pUrl = getPortraitUrl(p.id);
          const pOvr = Engine.util.ov(p);
          const spotData = { name: p.name, orgName: rivalOrgName, ovrGain: p.ovrGain || 0, pop: p.pop || Math.round(p.popularity || 0), ovr: pOvr };
          const spotComment = pickText(KURODA_SPOTLIGHT[p.category] || []);
          const spotStr = typeof spotComment === 'function' ? spotComment(spotData) : (spotComment || '');
          const _scoutOnclick = `onclick="event.stopPropagation();showFighterPopup(${p.id},'ai:${_dbCompareTarget}')"`;
          const faceHtml = pUrl
            ? `<div class="db-cmp-spotlight-face" ${_scoutOnclick} style="cursor:pointer"><img src="${pUrl}" alt=""></div>`
            : `<div class="db-cmp-spotlight-face" ${_scoutOnclick} style="cursor:pointer;background:linear-gradient(135deg,${hexDim(rc, 0.35)},${hexDim(rc, 0.18)});display:grid;place-items:center;font-size:16px;font-weight:900;color:#fff">${p.name.charAt(0)}</div>`;
          const _scoutName = `<span style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${p.id},'ai:${_dbCompareTarget}')">${p.name}</span>`;
          return `<div class="db-cmp-spotlight-pick">
            ${faceHtml}
            <div class="db-cmp-spotlight-info">
              <div class="db-cmp-spotlight-name">${_scoutName} <span style="font-size:12px;color:rgba(80,50,20,0.5);font-weight:400">OVR ${pOvr}${p.category === 'star' ? ' / 人気' + (p.pop || '') : p.category === 'growth' ? ' / +' + p.ovrGain : ''}</span></div>
              <span class="db-cmp-spotlight-tag ${p.category}">${getCategoryLabel(p.category, pOvr)}</span>
              <div class="db-cmp-spotlight-comment">「${spotStr}」</div>
            </div>
          </div>`;
        }).join('')}
      </section>`;
    }
  }

  // ═══ ⑧ ファン世論 ═══
  const fanSeed = Engine.rng.derive(G.rngSeed, G.season, G.week, (_dbCompareTarget || '').charCodeAt(0) || 0, 0xFAC1);
  const fanRng = Engine.rng.create(fanSeed);
  const tierFanTypes = {
    devastating: ['troll', 'hardcore', 'hopeful'],
    behind: ['hardcore', 'hopeful', 'neutral'],
    even: ['neutral', 'hardcore', 'hopeful'],
    ahead: ['neutral', 'hopeful', 'hardcore'],
    dominant: ['troll', 'neutral', 'hopeful'],
  };
  const fanTypes = tierFanTypes[kurodaTier] || ['neutral', 'hardcore', 'hopeful'];
  const fanPool = FAN_OPINIONS[kurodaTier] || {};
  const fanComments = fanTypes.map(type => {
    const pool = fanPool[type] || [];
    if (!pool.length) return null;
    const text = Engine.rng.pick(fanRng, pool);
    const textStr = typeof text === 'function' ? text(textData) : (text || '');
    const handlePool = FAN_HANDLES[type] || FAN_HANDLES.neutral;
    const handle = Engine.rng.pick(fanRng, handlePool);
    const suffix = Engine.rng.int(fanRng, 100, 9999);
    return { text: textStr, handle: `@${handle}_${suffix}` };
  }).filter(Boolean);

  if (fanComments.length > 0) {
    html += `<section class="db-cmp-panel db-cmp-fan-opinions">
      <h2 class="db-cmp-panel-title">ファンの声</h2>
      ${fanComments.map(fc => `<div class="db-cmp-fan-comment">
        <div class="db-cmp-fan-text">「${fc.text}」</div>
        <div class="db-cmp-fan-handle">${fc.handle}</div>
      </div>`).join('')}
    </section>`;
  }

  html += `</div>`; // close .db-cmp-wrap
  return html;
}
const _RELMAP_ORG_COLORS = { player: '#d4a843', org_s: '#d63031', org_a: '#6c5ce7', org_b: '#00b894', fa: '#8bc4f0' };
const _RELMAP_STAT_META = [
  { key: 'pw', label: 'PW', color: '#e74c3c' },
  { key: 'sp', label: 'SP', color: '#3498db' },
  { key: 'te', label: 'TE', color: '#2ecc71' },
  { key: 'st', label: 'ST', color: '#f39c12' },
  { key: 'mn', label: 'MN', color: '#9b59b6' },
];

// ── 感情テキストシステム ──────────────────────────────
const EMOTION_TEXTS = {
  trust: {
    normal:    'そばにいてくれるだけで、なんだか安心する',
    ojousama:  'お隣にいてくださると、心が穏やかになりますの',
    delinquent:'一緒にいると……なんか、落ち着くんだよな',
    cool:      '信頼できる数少ない人間。それだけで十分',
    seductive: '隣にいると、居心地がいいのよね……ふふ',
    polite:    '本当に感謝しています。大切な存在です',
    composed:  '一緒にいてくれると、不思議と心が落ち着くのよね',
  },
  rival_friend: {
    normal:    '負けたくない。でも、おかげで強くなれている気がする',
    ojousama:  '負けたくありませんけれど……実力は認めざるを得ませんわ',
    delinquent:'ぜってー負けねえ。でもまあ……いるから燃えんだよ',
    cool:      '互いに高め合える関係。……悪くない',
    seductive: '勝ちたい……でも、追いかけてる時間も嫌いじゃないの',
    polite:    '競い合えることが、自分の力になっています',
    composed:  'あの子のおかげで、わたくしも頑張れるの。ありがたい存在ね',
  },
  destined_rival: {
    normal:    '考えない日はない。絶対に、越えなきゃいけない壁',
    ojousama:  '何があっても……わたくしの手で超えてみせますわ',
    delinquent:'四六時中頭ん中にいやがる。絶対ぶっ倒す',
    cool:      '……いなければ、今の自分はいない。だからこそ、倒す',
    seductive: '頭から離れない……悔しいけど、そういうことなのよね',
    polite:    'その存在が、私を突き動かしています。必ず、超えてみせます',
    composed:  'あの子とはいつか、決着をつけなければね。楽しみでもあるのよ',
  },
  acquaintance: {
    normal:    'まあ、知ってはいるけど……それだけかな',
    ojousama:  '存じ上げてはおりますけれど、特別な感情はございませんわ',
    delinquent:'あー、いたな。別にどうでもいいけど',
    cool:      '認識はしている。それ以上でもそれ以下でもない',
    seductive: '知ってるわよ、一応ね。……それだけ',
    polite:    'お名前は存じています。お話する機会は少ないですけれど',
    composed:  'そうねぇ、お名前くらいは存じているかしら',
  },
  intrigued: {
    normal:    'なんだろう、目で追ってしまう。気にしてないと言えば嘘になる',
    ojousama:  'なぜかしら……気にかかって仕方がありませんの',
    delinquent:'……別に気にしてねーし。してねーけど、目に入んだよ',
    cool:      '気にしていないつもりだった……',
    seductive: 'ちょっと気になるのよね……何がとは言えないけど',
    polite:    'つい気にかけてしまいます。理由はよくわかりませんが',
    composed:  'どういうわけか、あの子のことが気になるのよね',
  },
  hostile_competitor: {
    normal:    '負けたくない。それだけは、はっきりしている',
    ojousama:  '絶対に遅れを取りたくありませんの。それだけですわ',
    delinquent:'負けねえ。死んでも負けねえ',
    cool:      '負けるわけにはいかない。理屈じゃない',
    seductive: '負けたくないの。理由なんて知らないわ',
    polite:    'どうしても負けたくないんです。強い気持ちがあります',
    composed:  '負けるわけにはいかないわ。穏やかに、でも譲らない',
  },
  // ── マイナス側 (Bond low / bottom) ──
  // distant: Bond低×Rival低 — 関心の希薄。憎悪ではなく無関心
  distant: {
    normal:    '名前は知ってるけど、それ以上は別に',
    ojousama:  '存じ上げてはおりますけれど、それ以上は……特に',
    delinquent:'あー、いたな。それで?',
    cool:      '認識しているだけ。それ以上はない',
    seductive: 'いたわね、そういえば。……それだけ',
    polite:    'お見かけはしますけれど、特には……',
    composed:  'お顔は存じているわ。それだけのことね',
  },
  // contempt: 上書き判定 (selfOvr-targetOvr >= 15) — 格上の侮蔑
  contempt: {
    normal:    '同じリングに立っていい相手じゃない',
    ojousama:  'わたくしと並ぶには、まだ早うございますわ',
    delinquent:'ハッ、雑魚が視界に入んな。場違いだ',
    cool:      '実力差は数字で出てる。語ることもない',
    seductive: 'あらあら……まだそのレベルなのね。可愛いこと',
    polite:    '……失礼ですが、同じ土俵という気にはなれません',
    composed:  '同じ場に立つ相手だとは、思っていないの。ごめんなさいね',
  },
  // irritation: Bond低×Rival中 — 表面的な不快・そりが合わない
  irritation: {
    normal:    '視界に入るたび、地味にイラっとくる',
    ojousama:  'どうにも、お顔を拝見するだけで気が立ちますの',
    delinquent:'チッ……顔見るだけでイライラすんだよ',
    cool:      '不快。距離を取りたい',
    seductive: 'なんかね、無性にカチンとくるのよ。理由は知らない',
    polite:    '……正直、近くにいられると気が休まりません',
    composed:  'あの子とは、どうしてもそりが合わないの。困ったことに',
  },
  // dislike: Bond低×Rival高 — 明確な嫌悪・拒絶
  dislike: {
    normal:    'はっきり言って、好きじゃない。関わりたくもない',
    ojousama:  'あの方とは、お話する気にもなれませんの',
    delinquent:'嫌い。マジで嫌い。それだけ',
    cool:      '受け付けない。理屈じゃない',
    seductive: 'ごめんなさいね、あの子は無理。生理的に',
    polite:    '……申し訳ありませんが、お近づきになりたくはありません',
    composed:  'あの子のことは、はっきりと苦手ね。隠す気もないわ',
  },
  // cold_loathing: Bond底×Rival低 — 冷えた嫌悪・存在無視
  cold_loathing: {
    normal:    '視線も合わせない。いないものとして扱ってる',
    ojousama:  'わたくしの視界には、入れておりませんの',
    delinquent:'……あいつは、いねえもんとして扱ってる',
    cool:      '存在を認識から外している。話すこともない',
    seductive: 'あら、誰のこと？……ふふ、知らない人だわ',
    polite:    'お話できることは、何もございません。失礼します',
    composed:  'あの子のことは、わたくしの中では終わっているの',
  },
  // dislike_strong: Bond底×Rival中 — 強い嫌悪・蓄積
  dislike_strong: {
    normal:    '顔も見たくない。同じ空気を吸いたくない',
    ojousama:  '同じ空間にいるだけで、息が詰まりますの',
    delinquent:'マジで無理。視界から消えてくれ',
    cool:      '生理的に駄目。これは変わらない',
    seductive: 'ねえ、近寄らないでくれる？……本気で',
    polite:    '……同じ場にいるだけで、耐えがたいのです',
    composed:  '同じ部屋にいるのも辛いの。本当に、無理なのよ',
  },
  // hatred: Bond底×Rival高 — 憎悪・敵意
  hatred: {
    normal:    '絶対に許さない。叩き潰すまで終わらない',
    ojousama:  'あの方だけは、決して許しませんわ。何があっても',
    delinquent:'ぶっ潰す。マジでぶっ潰す。それしかねえ',
    cool:      '消したい。自覚している。そういう感情だ',
    seductive: 'この気持ち、一生消えないと思う。許す気もないし',
    polite:    '……あの方のことは、生涯、許すつもりはございません',
    composed:  'あの子だけは、どうしても許せないの。穏やかではいられないわ',
  },
};

function getEmotionCategory(bond, rivalry, selfOvr, targetOvr) {
  // Bond 4段: high(>=65) / mid(45-64) / low(29-44) / bottom(<29)
  const bLvl = bond >= 65 ? 'high' : bond >= 45 ? 'mid' : bond >= 29 ? 'low' : 'bottom';
  const rLvl = rivalry >= 50 ? 'high' : rivalry >= 20 ? 'mid' : 'low';
  // 高/中 Bond帯
  if (bLvl === 'high' && rLvl === 'low') return 'trust';
  if (bLvl === 'high' && rLvl === 'mid') return 'rival_friend';
  if (bLvl === 'high' && rLvl === 'high') return 'destined_rival';
  if (bLvl === 'mid' && rLvl === 'low') return 'acquaintance';
  if (bLvl === 'mid' && rLvl === 'mid') return 'intrigued';
  if (bLvl === 'mid' && rLvl === 'high') return 'hostile_competitor';
  // 低/底 Bond帯：contempt 上書き（selfOvr - targetOvr >= 15、Rival低のときのみ）
  if (rLvl === 'low' && (selfOvr - targetOvr) >= 15) return 'contempt';
  // 低 Bond帯
  if (bLvl === 'low' && rLvl === 'low') return 'distant';
  if (bLvl === 'low' && rLvl === 'mid') return 'irritation';
  if (bLvl === 'low' && rLvl === 'high') return 'dislike';
  // 底 Bond帯
  if (bLvl === 'bottom' && rLvl === 'low') return 'cold_loathing';
  if (bLvl === 'bottom' && rLvl === 'mid') return 'dislike_strong';
  return 'hatred'; // bottom × high
}

function getEmotionText(bond, rivalry, selfOvr, targetOvr, archetype) {
  const category = getEmotionCategory(bond, rivalry, selfOvr, targetOvr);
  const at = archetype || 'normal';
  const texts = EMOTION_TEXTS[category];
  return texts[at] || texts.normal;
}

function _relmapGetAllChars() {
  return Engine.database.getAllFighters(G);
}

function _relmapGetOrgLabel(f) {
  if (f._orgId === 'player') return G.orgName || 'プレイヤー団体';
  if (f._orgId === 'fa') return 'フリー';
  const org = RIVAL_ORGS.find(o => o.id === f._orgId);
  return org ? (G.rivalOrgNames?.[f._orgId] || org.name || f._orgId) : f._orgName || '?';
}

function _relmapGetOrgEmoji(orgId) {
  if (orgId === 'player') return '\u2B50';
  const org = RIVAL_ORGS.find(o => o.id === orgId);
  return org ? org.emoji : '\uD83C\uDFE2';
}

function _relmapGetOrgColor(f) {
  return _RELMAP_ORG_COLORS[f._orgId] || 'var(--text-dim)';
}

function _relmapGetOrgColorById(orgId) {
  return _RELMAP_ORG_COLORS[orgId] || '#888';
}

// Build link data between all character pairs with meaningful relationships
function _relmapPairKey(aId, bId) {
  return aId < bId ? `${aId}>${bId}` : `${bId}>${aId}`;
}

function _relmapBuildLinks(allChars) {
  const rels = G.relationships || {};
  const historyStore = Engine.relationships.normalizeHistoryStore(G.relationshipHistory);
  const history = historyStore.retiredRivalries;
  const rivalries = G.rivalries || {};
  const links = [];
  const charsById = new Map(allChars.map(c => [String(c.id), c]));
  const pairKeys = new Set();

  Object.keys(rels).forEach(key => {
    const sep = key.indexOf('>');
    if (sep <= 0) return;
    const aId = key.slice(0, sep);
    const bId = key.slice(sep + 1);
    if (!charsById.has(aId) || !charsById.has(bId) || aId === bId) return;
    pairKeys.add(_relmapPairKey(Number(aId), Number(bId)));
  });

  history.forEach(entry => {
    const aId = Number(entry && entry.id1);
    const bId = Number(entry && entry.id2);
    if (!Number.isFinite(aId) || !Number.isFinite(bId) || aId === bId) return;
    if (!charsById.has(String(aId)) || !charsById.has(String(bId))) return;
    pairKeys.add(_relmapPairKey(aId, bId));
  });

  Object.keys(rivalries).forEach(key => {
    const parts = key.split('-');
    if (parts.length !== 2) return;
    const aId = Number(parts[0]);
    const bId = Number(parts[1]);
    if (!Number.isFinite(aId) || !Number.isFinite(bId) || aId === bId) return;
    if (!charsById.has(String(aId)) || !charsById.has(String(bId))) return;
    pairKeys.add(_relmapPairKey(aId, bId));
  });

  pairKeys.forEach(pairKey => {
    const sep = pairKey.indexOf('>');
    const aId = Number(pairKey.slice(0, sep));
    const bId = Number(pairKey.slice(sep + 1));
    const a = charsById.get(String(aId));
    const b = charsById.get(String(bId));
    if (!a || !b) return;

    const keyAB = `${a.id}>${b.id}`;
    const keyBA = `${b.id}>${a.id}`;
    const rAB = rels[keyAB] || { bond: 50, rivalry: 0 };
    const rBA = rels[keyBA] || { bond: 50, rivalry: 0 };
    const bondAB = Math.round(rAB.bond * 10) / 10;
    const bondBA = Math.round(rBA.bond * 10) / 10;
    const rivAB = Math.round(rAB.rivalry * 10) / 10;
    const rivBA = Math.round(rBA.rivalry * 10) / 10;

    const rivalLvl = Engine.title.getRivalryLevel(G, a.id, b.id);
    const hasTitle = !!rivalLvl && !rivalLvl.isOneSided;
    const isOneSided = rivalLvl?.isOneSided || false;
    const hasPast = history.some(h =>
      (h.id1 === a.id && h.id2 === b.id) || (h.id1 === b.id && h.id2 === a.id)
    );

    const strength = (Math.abs(bondAB - 50) + Math.abs(bondBA - 50) + rivAB + rivBA) / 200;
    const sortScore =
      (hasTitle ? 1000 + rivAB + rivBA : 0) +
      (isOneSided ? 500 : 0) +
      Math.max(rivAB, rivBA) +
      Math.abs(bondAB - 50) + Math.abs(bondBA - 50);

    if (sortScore < 3 && !hasPast) return;

    // bond-rivalry plan 2026-04-29 1-C: 極端ペアの日本語ラベル
    // pure_hatred (rivalry≥80 ∧ bond≤30): 憎悪 / bitter_feud (rivalry≥60 ∧ bond≤30): 因縁
    const _avgBond = (bondAB + bondBA) / 2;
    const _maxRiv = Math.max(rivAB, rivBA);
    let hostileLabel = null;
    if (_avgBond <= 30) {
      if (_maxRiv >= 80) hostileLabel = '憎悪';
      else if (_maxRiv >= 60) hostileLabel = '因縁';
    }

    links.push({
      a: a.id, b: b.id, source: a.id, target: b.id,
      bondAB, bondBA, rivAB, rivBA,
      rivalLvl, hasTitle, isOneSided, hasPast,
      strength, sortScore,
      rivalTitle: hasTitle && rivalLvl ? rivalLvl.label : null,
      titleColor: hasTitle && rivalLvl ? rivalLvl.color : null,
      titleEmoji: hasTitle && rivalLvl ? rivalLvl.emoji : null,
      hostileLabel,
    });
  });

  return links.sort((a, b) => b.sortScore - a.sortScore);
}

function _relmapBuildLinkIndexes(links) {
  const byNode = {};
  const byPair = {};
  (links || []).forEach(link => {
    const pairKey = _relmapPairKey(link.a, link.b);
    byPair[pairKey] = link;
    if (!byNode[link.a]) byNode[link.a] = [];
    if (!byNode[link.b]) byNode[link.b] = [];
    byNode[link.a].push(link);
    byNode[link.b].push(link);
  });
  Object.keys(byNode).forEach(id => byNode[id].sort((a, b) => b.sortScore - a.sortScore));
  _relmapLinksByNode = byNode;
  _relmapLinksByPair = byPair;
}

function _relmapGetLinksFor(id) {
  return _relmapLinksByNode[id] ? [..._relmapLinksByNode[id]] : [];
}

function _relmapGetLinkBetween(aId, bId) {
  return _relmapLinksByPair[_relmapPairKey(aId, bId)] || null;
}

function _relmapTrustVisible(val) {
  return val <= 40 || val >= 60;
}

function _relmapRivalryVisible(val) {
  return val >= 30;
}

function _relmapHasVisibleTrust(link) {
  return !!link && (_relmapTrustVisible(link.bondAB) || _relmapTrustVisible(link.bondBA));
}

function _relmapHasVisibleRivalry(link) {
  return !!link && (_relmapRivalryVisible(link.rivAB) || _relmapRivalryVisible(link.rivBA) || !!link.rivalTitle);
}

function _relmapHasVisibleRelation(link) {
  return _relmapHasVisibleTrust(link) || _relmapHasVisibleRivalry(link);
}

function _relmapHexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function _relmapMixHex(a, b, t) {
  const ca = _relmapHexToRgb(a), cb = _relmapHexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(ca.r + (cb.r - ca.r) * k);
  const g = Math.round(ca.g + (cb.g - ca.g) * k);
  const bl = Math.round(ca.b + (cb.b - ca.b) * k);
  return `rgb(${r},${g},${bl})`;
}

function _relmapTrustColor(val) {
  if (val >= 60) return _relmapMixHex('#f2eee6', '#4aa3ff', (val - 60) / 40);
  if (val <= 40) return _relmapMixHex('#f2eee6', '#a98cff', (40 - val) / 40);
  return 'rgba(242,238,230,0.18)';
}

function _relmapRivalryColor(val) {
  return _relmapMixHex('#d7b45a', '#ff8a2a', (Math.max(30, val) - 30) / 70);
}

function _relmapRelationshipIntensity(link) {
  if (!link) return 0;
  const trust = Math.abs((link.bondAB || 50) - 50) + Math.abs((link.bondBA || 50) - 50);
  return trust + _relmapRivalryTotal(link) * 0.72;
}

function _relmapRelationshipFilterScore(link) {
  return Math.min(100, Math.round(_relmapRelationshipIntensity(link) / 1.8));
}

function _relmapRelationshipPassesThreshold(link) {
  return _relmapRelationshipFilterScore(link) >= _relmapFilterThreshold;
}

function _relmapFilterThresholdLabel(value) {
  const v = Number(value) || 0;
  if (v <= 10) return '細かく';
  if (v <= 30) return '標準';
  if (v <= 55) return '強め';
  if (v <= 80) return '強力';
  return '最強級';
}

function _relmapRelationshipStrokeWidth(link, emphasized) {
  const intensity = _relmapRelationshipIntensity(link);
  const cap = emphasized ? 9.2 : 7.0;
  return Math.min(cap, 0.75 + Math.max(0, intensity - 18) / 22);
}

function _relmapRelationshipColor(link) {
  const bAB = link?.bondAB ?? 50;
  const bBA = link?.bondBA ?? 50;
  const total = Math.max(0, Math.min(200, bAB + bBA));
  // Pair link hue is derived from the combined bond total:
  // <=40 = strong red, 90-110 = white, >=160 = strong blue.
  // Between those zones, leave white quickly so the direction reads at a glance.
  if (total <= 40) return '#ff3b30';
  if (total >= 160) return '#2f8cff';
  if (total >= 90 && total <= 110) return '#f7fbff';
  if (total < 90) {
    if (total >= 82) return _relmapMixHex('#ffd43b', '#f7fbff', (total - 82) / 8);
    if (total >= 62) return _relmapMixHex('#ff9f1c', '#ffd43b', (total - 62) / 20);
    return _relmapMixHex('#ff3b30', '#ff9f1c', (total - 40) / 22);
  }
  if (total <= 125) return _relmapMixHex('#f7fbff', '#9be564', (total - 110) / 15);
  if (total <= 145) return _relmapMixHex('#9be564', '#2ec4b6', (total - 125) / 20);
  return _relmapMixHex('#2ec4b6', '#2f8cff', (total - 145) / 15);
}

function _relmapOffsetLineEndpoints(s, t, offset, pad) {
  const dx = t.x - s.x, dy = t.y - s.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const px = -uy, py = ux;
  const sR = Math.max(1, (s.r || 0) + (pad || 4));
  const tR = Math.max(1, (t.r || 0) + (pad || 4));
  const sAlong = Math.sqrt(Math.max(0, sR * sR - offset * offset));
  const tAlong = Math.sqrt(Math.max(0, tR * tR - offset * offset));
  return {
    x1: s.x + ux * sAlong + px * offset,
    y1: s.y + uy * sAlong + py * offset,
    x2: t.x - ux * tAlong + px * offset,
    y2: t.y - uy * tAlong + py * offset,
  };
}

function _relmapRivalryTotal(link) {
  return Math.max(0, (link?.rivAB || 0) + (link?.rivBA || 0));
}

function _relmapRivalryStrokeWidth(link, emphasized) {
  const total = _relmapRivalryTotal(link);
  const cap = emphasized ? 8.5 : 6.6;
  return Math.min(cap, 0.75 + Math.max(0, total - 50) / 24);
}

function _relmapNodeDisplayName(node) {
  return _escapeHtml(node?.name || '');
}

function _relmapRivalryDirectionText(link, s, t, named) {
  const ab = Math.round(link.rivAB || 0);
  const ba = Math.round(link.rivBA || 0);
  const aName = _relmapNodeDisplayName(s);
  const bName = _relmapNodeDisplayName(t);
  if (named) {
    return {
      ab: `${aName}→${bName} ${ab}`,
      ba: `${bName}→${aName} ${ba}`,
    };
  }
  return { ab: `${ab}→`, ba: `←${ba}` };
}

function _relmapLinkPassesFilter(link, filter) {
  if (!link) return false;
  if (filter === 'rivalry') return _relmapHasVisibleRivalry(link);
  if (filter === 'bond') return _relmapHasVisibleTrust(link);
  return _relmapHasVisibleRelation(link);
}

function _relmapLinkPassesDisplayControls(link, filter) {
  if (!_relmapLinkPassesFilter(link, filter)) return false;
  if (!_relmapFilterRelOnly) return true;
  return _relmapRelationshipPassesThreshold(link);
}

function _relmapSelectRenderableLinks(candidateLinks, budget, maxPerNode, priorityNodeId) {
  const selected = [];
  const degree = {};
  const seen = new Set();
  const sorted = [...(candidateLinks || [])].sort((a, b) => {
    const aPriority = priorityNodeId && (a.a === priorityNodeId || a.b === priorityNodeId) ? 1 : 0;
    const bPriority = priorityNodeId && (b.a === priorityNodeId || b.b === priorityNodeId) ? 1 : 0;
    if (aPriority !== bPriority) return bPriority - aPriority;
    if (!!a.rivalTitle !== !!b.rivalTitle) return a.rivalTitle ? -1 : 1;
    return b.sortScore - a.sortScore;
  });

  sorted.forEach(link => {
    if (selected.length >= budget) return;
    const key = _relmapPairKey(link.a, link.b);
    if (seen.has(key)) return;
    const aCount = degree[link.a] || 0;
    const bCount = degree[link.b] || 0;
    const bypassCap = priorityNodeId && (link.a === priorityNodeId || link.b === priorityNodeId);
    if (!bypassCap && (aCount >= maxPerNode || bCount >= maxPerNode)) return;
    seen.add(key);
    degree[link.a] = aCount + 1;
    degree[link.b] = bCount + 1;
    selected.push(link);
  });

  return selected;
}

function _relmapRebuildVisibleLinkState() {
  _relmapVisibleNodeHasRivalTitle = {};
  _relmapVisibleNodeConnectedToFocus = {};
  const focused = _relmapCenterId;
  (_relmapVisibleLinks || []).forEach(link => {
    if (link.rivalTitle) {
      _relmapVisibleNodeHasRivalTitle[link.a] = true;
      _relmapVisibleNodeHasRivalTitle[link.b] = true;
    }
    if (focused && (link.a === focused || link.b === focused)) {
      const otherId = link.a === focused ? link.b : link.a;
      _relmapVisibleNodeConnectedToFocus[otherId] = true;
    }
  });
}

function _relmapFaceHtml(charId, size) {
  const pUrl = getPortraitUrl(charId);
  if (pUrl) return `<img src="${pUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%"><span style="display:none;width:${size}px;height:${size}px;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px">\uD83D\uDC64</span>`;
  return `<span style="display:flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px">\uD83D\uDC64</span>`;
}

function _relmapBondColor(val) {
  if (val >= 65) return '#74b9ff';
  if (val >= 45) return 'var(--text-sub)';
  return '#ff7675';
}

// ══════════════════════════════════════════════════════════
// _renderDbRivalry — 🔥 因縁列伝(3面) [v8 redesign]
// ══════════════════════════════════════════════════════════

// bond × rivalry の 9象限分類。淡白なペア(rivalry < 40)は null
function _classifyRelation(bond, rivalry) {
  if (rivalry < 40) return null;
  if (rivalry >= 80) {
    if (bond >= 70) return 'fated_admiration';
    if (bond <= 30) return 'pure_hatred';
    return 'destined_rival';
  }
  if (rivalry >= 60) {
    if (bond >= 70) return 'allied_rivalry';
    if (bond <= 30) return 'bitter_feud';
    return 'standard_rivalry';
  }
  // rivalry 40-59
  if (bond >= 70) return 'mutual_respect';
  if (bond <= 30) return 'cold_rivalry';
  return 'casual_rivalry';
}

// 因縁列伝 v1.1: context tag 導出（h2h.history と現在 state から）
//  優先順: reclaiming > betrayed > factionWar > lockerStress > repaired
//  history の直近10戦に該当フラグがあれば成立。repaired は h2h._repairedAt が直近2シーズン以内。
function _deriveRelationContext(state, idA, idB, h2h) {
  if (!h2h) return null;
  const recent = (h2h.history || []).slice(-10);
  // 1. reclaiming: 直近 history に rc=1
  if (recent.some(r => r.rc === 1)) return 'reclaiming';
  // 2. betrayed: 元同僚（離脱経験）または history bt=1
  if (recent.some(r => r.bt === 1)) return 'betrayed';
  if (Engine.orgTimeline && typeof Engine.orgTimeline.checkFirstMeetSinceDeparture === 'function') {
    try {
      const fA = (state.roster || []).concat(...Object.values(state.aiOrgs || {}).map(o => o.roster || [])).find(c => c.id === idA);
      const fB = (state.roster || []).concat(...Object.values(state.aiOrgs || {}).map(o => o.roster || [])).find(c => c.id === idB);
      // 「元同僚関係」: orgTimeline で過去同団体期間あり、現在は別団体
      if (fA && fB && Array.isArray(fA.orgTimeline) && Array.isArray(fB.orgTimeline)) {
        const aOrgs = new Set(fA.orgTimeline.map(e => e.orgId));
        const bOrgs = new Set(fB.orgTimeline.map(e => e.orgId));
        const shared = [...aOrgs].some(o => bOrgs.has(o));
        const aLast = fA.orgTimeline[fA.orgTimeline.length - 1]?.orgId;
        const bLast = fB.orgTimeline[fB.orgTimeline.length - 1]?.orgId;
        if (shared && aLast && bLast && aLast !== bLast) return 'betrayed';
      }
    } catch (_) {}
  }
  // 3. factionWar: history fc=1 または現在の派閥状態
  if (recent.some(r => r.fc === 1)) return 'factionWar';
  if (Engine.factions && typeof Engine.factions.getFactionByFighterId === 'function') {
    try {
      const fA = Engine.factions.getFactionByFighterId(state, idA);
      const fB = Engine.factions.getFactionByFighterId(state, idB);
      if (fA && fB && fA.id !== fB.id && (fA.inHostility || fB.inHostility)) return 'factionWar';
    } catch (_) {}
  }
  // 4. lockerStress: 直近 history lc=1 または現在 _lockerCrisisWeek 直近4週
  if (recent.some(r => r.lc === 1)) return 'lockerStress';
  if (state._lockerCrisisWeek != null && Engine.util && typeof Engine.util.absWeek === 'function') {
    const aw = Engine.util.absWeek(state.season, state.week);
    if (aw - state._lockerCrisisWeek <= 4) return 'lockerStress';
  }
  // 5. repaired: h2h._repairedAt が直近2シーズン以内
  if (h2h._repairedAt) {
    const dy = (state.season || 1) - (h2h._repairedAt.season || 1);
    if (dy <= 2) return 'repaired';
  }
  return null;
}

function _isPlayerSide(state, charId) {
  return (state.roster || []).some(c => c.id === charId);
}

function _findFighterOrgName(state, charId) {
  if (_isPlayerSide(state, charId)) return state.orgName || 'プレイヤー団体';
  const aiOrgs = state.aiOrgs || {};
  for (const orgId in aiOrgs) {
    const org = aiOrgs[orgId];
    if ((org.roster || []).some(c => c.id === charId)) {
      return (typeof RIVAL_ORGS !== 'undefined' && RIVAL_ORGS.find(o => o.id === orgId)?.name) || org.name || orgId;
    }
  }
  return '';
}

function _pickRivalryFeatured(state) {
  const totalWeek = Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
  const period = Math.floor(totalWeek / 2);

  // featured 選出用プレイヤーボーナス: ローテーションごとに 0〜15 をランダム抽選
  const playerBonusRng = Engine.rng.create(
    Engine.rng.derive(state.rngSeed || 1, state.season || 1, period, 0xFA11, 0)
  );
  const playerBonus = Math.floor(Engine.rng.float(playerBonusRng) * 16);

  const all = [];
  Object.entries(state.h2h || {}).forEach(([key, h2h]) => {
    const [a, b] = key.split('>').map(Number);
    const charA = ALL_CHARS.find(c => c.id === a);
    const charB = ALL_CHARS.find(c => c.id === b);
    if (!charA || !charB) return;
    const relAB = (state.relationships || {})[`${a}>${b}`] || { bond: 50, rivalry: 0 };
    const relBA = (state.relationships || {})[`${b}>${a}`] || { bond: 50, rivalry: 0 };
    const bond = (relAB.bond + relBA.bond) / 2;
    const rivalry = (relAB.rivalry + relBA.rivalry) / 2;
    const tag = _classifyRelation(bond, rivalry);
    if (!tag) return;
    // rawScore: 業界全体の実力値ベース（relations 並び替え用）
    const rawScore = rivalry * 0.4 + (h2h.matches || 0) * 0.2 + (h2h.bestMQ || 0) * 0.2
      + Math.abs(bond - 50) * 0.3;
    // score: featured 選出用（プレイヤーボーナス＋ドラマタグ込み）
    const isPlayerInvolved = _isPlayerSide(state, a) || _isPlayerSide(state, b);
    const dramaTagBonus = {
      pure_hatred: 20, fated_admiration: 18, bitter_feud: 12,
      allied_rivalry: 10, destined_rival: 8,
    };
    // 因縁列伝 v1.1: context tag に応じて featured ボーナス
    const ctx = _deriveRelationContext(state, a, b, h2h);
    const contextBoost = { reclaiming: 20, betrayed: 25, factionWar: 15, repaired: 10, lockerStress: 5 };
    const ctxBonus = ctx ? (contextBoost[ctx] || 0) : 0;
    const score = rawScore + (isPlayerInvolved ? playerBonus : 0) + (dramaTagBonus[tag] || 0) + ctxBonus;
    all.push({ key, h2h, tag, ctx, bond, rivalry, charA, charB, idA: a, idB: b, score, rawScore, isPlayerInvolved });
  });
  all.sort((x, y) => y.score - x.score);
  if (!all.length) return { featured: null, relations: [] };

  // 上位プールから2週周期でローテーション。スコア最上位の0.55倍以上を候補とし、最低3件・最大8件
  const topScore = all[0].score;
  let pool = all.filter(e => e.score >= topScore * 0.55).slice(0, 8);
  if (pool.length < 3) pool = all.slice(0, Math.min(3, all.length));
  const featured = pool[period % pool.length];
  // relations は rawScore 降順で並べ「全業界」の実力値を正直に反映する
  const relations = all
    .filter(e => e.key !== featured.key)
    .sort((x, y) => y.rawScore - x.rawScore)
    .slice(0, 6);
  return { featured, relations };
}

function _renderDbRivalry() {
  const { featured, relations } = _pickRivalryFeatured(G);
  const seasonNum = G.season || 1, weekNum = G.week || 1;

  let html = `<div class="db-cmp-newspaper-header">
    <h1>週刊グラップル ── 因縁列伝</h1>
    <span>シーズン${seasonNum} 第${weekNum}週</span>
  </div>
  <div class="db-cmp-wrap rivalry-wrap">`;

  if (!featured) {
    html += `<div class="db-cmp-rivalry-empty">
      <p>記事にする価値のある因縁が、まだ業界には育っていない。記者として、もう少し時間が要ると見ている。</p>
    </div></div>`;
    return html;
  }

  // 黒田テキスト選択用seed
  const kurodaSeed = Engine.rng.derive(G.rngSeed || 1, seasonNum, weekNum, 0xBE99, 0);
  const kurodaRng = Engine.rng.create(kurodaSeed);
  const pickText = (pool, d) => {
    if (!pool || !pool.length) return '';
    let usable = pool;
    // bestMQ が低い (<75) ときは「最高評価」と褒めるテンプレを除外
    const bm = (d && typeof d.bestMQ === 'number') ? d.bestMQ : null;
    if (bm !== null && bm < 75) {
      const filtered = pool.filter(fn => {
        try { return !/最高評価|bestMQ/.test(fn.toString()); } catch(e) { return true; }
      });
      if (filtered.length > 0) usable = filtered;
    }
    const fn = Engine.rng.pick(kurodaRng, usable);
    try { return fn(d); } catch (e) { return ''; }
  };

  html += _renderRivalryHeadline();
  html += _renderRivalryFeatured(featured, pickText);
  html += _renderRivalryHistory(featured);
  html += _renderRivalryRelations(relations, pickText);
  html += `</div>`;
  return html;
}

function _renderRivalryHeadline() {
  const subs = [
    '本紙が選んだ、今もっとも目を離せない関係たち',
    '取材ノートから——リング上で、リング外で、動き続ける関係',
    '勝敗だけでは語れない、関係の深層',
  ];
  const sub = subs[Math.floor(Math.random() * subs.length)];
  return `<div class="rivalry-headline">
    <div class="pre">因 縁 列 伝</div>
    <h1 class="title">数字の奥に宿る、選手たちの物語</h1>
    <div class="sub">${sub}</div>
  </div>`;
}

function _buildNarrativeData(featured) {
  const { h2h, charA, charB, idA, idB } = featured;
  const history = h2h.history || [];
  const firstSeason = history.length ? history[0].s : (G.season || 1);
  const yearsRaw = (G.season || 1) - firstSeason + ((G.week || 1) - (history.length ? history[0].w : 1)) / 52;
  const years = Math.max(1, Math.round(yearsRaw));
  return {
    charA: charA.name, charB: charB.name,
    matches: h2h.matches || 0,
    bestMQ: h2h.bestMQ || 0,
    years,
    hadTitleMatch: !!h2h.hadTitleMatch,
    hadPPV: !!h2h.hadPPV,
  };
}

function _renderRivalryFeatured(featured, pickText) {
  const { tag, ctx, charA, charB, idA, idB, h2h } = featured;
  const tagNarrative = (typeof KURODA_RELATION_NARRATIVE !== 'undefined') ? KURODA_RELATION_NARRATIVE[tag] : null;
  // 因縁列伝 v1.1: context narrative があれば優先、なければ tag default にフォールバック
  const ctxNarrative = (ctx && tagNarrative && tagNarrative.contexts && tagNarrative.contexts[ctx]) || null;
  const narrative = ctxNarrative || tagNarrative;
  const d = _buildNarrativeData(featured);
  const headline = (narrative && pickText(narrative.headlines, d)) || '業界が注目する一組';
  const body = (narrative && pickText(narrative.bodies, d)) || `${charA.name}と${charB.name}——本紙が見守る関係。`;

  // 戦績(A視点)
  const winsA = h2h.winsA || 0, winsB = h2h.winsB || 0, draws = h2h.draws || 0;
  const recordText = (winsA || winsB || draws)
    ? `${winsA}勝${winsB}敗${draws ? draws + '分' : ''}`
    : '未対戦';

  const standA = (typeof getStandUrl === 'function') ? getStandUrl(idA, Engine.util?.ov?.(charA) || 70) : '';
  const standB = (typeof getStandUrl === 'function') ? getStandUrl(idB, Engine.util?.ov?.(charB) || 70) : '';
  const orgA = _findFighterOrgName(G, idA);
  const orgB = _findFighterOrgName(G, idB);
  const styleA = (charA.style || '').toUpperCase();
  const styleB = (charB.style || '').toUpperCase();

  const facts = [];
  if (h2h.matches) facts.push(`<span class="fact-item">通算 ${recordText}</span>`);
  if (d.years >= 1 && h2h.matches) facts.push(`<span class="fact-item">${d.years}年の付き合い</span>`);
  if (h2h.bestMQ) facts.push(`<span class="fact-item">ベスト試合 MQ${h2h.bestMQ}</span>`);
  if (h2h.hadTitleMatch) facts.push(`<span class="fact-item">タイトル戦経験あり</span>`);
  if (h2h.hadPPV) facts.push(`<span class="fact-item">PPV経験あり</span>`);
  // 因縁列伝 v1.1: context tag の視覚キュー
  if (ctx) {
    const ctxLabel = {
      betrayed: '⚠ 元同僚',
      factionWar: '⚔ 派閥抗争中',
      lockerStress: '❄ ロッカー荒廃中',
      repaired: '🤝 修復後',
      reclaiming: '🏆 奪還挑戦戦線',
    }[ctx];
    if (ctxLabel) facts.push(`<span class="fact-item" style="background:rgba(139,26,26,0.15);border-color:rgba(139,26,26,0.5);color:#9a4040;font-weight:700;">${ctxLabel}</span>`);
  }

  return `<section class="rivalry-main" data-internal-tag="${tag}">
    <div class="rivalry-featured-headline">
      <div class="pre">本 日 の 一 組</div>
      <div class="h">${headline}</div>
    </div>
    <div class="rivalry-main-photos">
      <div class="rivalry-main-stand">
        ${standA ? `<div class="ace-stand-img flip" style="background-image:url('${standA}');background-size:cover;background-position:center top;width:100%;height:100%;"></div>` : ''}
      </div>
      <div class="rivalry-main-vs"><div class="vs">VS</div></div>
      <div class="rivalry-main-stand">
        ${standB ? `<div class="ace-stand-img" style="background-image:url('${standB}');background-size:cover;background-position:center top;width:100%;height:100%;"></div>` : ''}
      </div>
    </div>
    <div class="rivalry-main-info">
      <div class="rivalry-main-side">
        <div class="org">${orgA}</div>
        <div class="name">${charA.name}</div>
        <div class="role">${styleA}</div>
      </div>
      <div class="rivalry-main-stats" style="display:flex;align-items:center;justify-content:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:#f0d48b;line-height:1;">${recordText}</div>
      </div>
      <div class="rivalry-main-side right">
        <div class="org">${orgB}</div>
        <div class="name">${charB.name}</div>
        <div class="role">${styleB}</div>
      </div>
    </div>
    <div class="rivalry-featured-body">
      <p>${body}</p>
    </div>
    ${facts.length ? `<div class="rivalry-featured-facts">${facts.join('')}</div>` : ''}
  </section>`;
}

function _renderRivalryHistory(featured) {
  const { h2h, charA, charB, idA, idB } = featured;
  const history = (h2h.history || []).slice(-10);
  if (!history.length) {
    return `<section class="rivalry-history">
      <div class="sec-label">対戦の軌跡</div>
      <div style="padding:8px 4px;color:#5b4b34;font-size:11px;">対戦履歴はまだ刻まれていない。本紙としては、最初の一戦が組まれる日を待ちたい。</div>
    </section>`;
  }

  const stageBadge = (st) => {
    if (st === 'war') return `<span style="font-size:9px;background:#8b1a1a;color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">対抗戦</span>`;
    if (st === 'ppv') return `<span style="font-size:9px;background:#1a4a30;color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">PPV</span>`;
    return '';
  };
  const titleBadge = (t) => t ? `<span style="font-size:9px;background:rgba(154,112,32,0.7);color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">タイトル戦</span>` : '';
  // 因縁列伝 v1.1: イベント文脈バッジ
  const eventBadges = (rec) => {
    let out = '';
    if (rec.bt) out += `<span style="font-size:9px;background:#c92a2a;color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">⚠ 元同僚</span>`;
    if (rec.fc) out += `<span style="font-size:9px;background:#5b2d8c;color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">派閥戦</span>`;
    if (rec.lc) out += `<span style="font-size:9px;background:#4a4a52;color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">険悪期</span>`;
    if (rec.rc) out += `<span style="font-size:9px;background:#a87010;color:#fff;padding:1px 6px;border-radius:2px;letter-spacing:1px;margin-right:4px;">奪還挑戦</span>`;
    return out;
  };

  const rows = history.map((rec, idx) => {
    // win: 'A' (idA winner), 'B' (idB winner), 'd' (draw)
    let cls, resultText, mqText;
    if (rec.win === 'd') { cls = 'draw'; resultText = '引き分け'; }
    else if (rec.win === 'A') {
      const isPlayerA = _isPlayerSide(G, idA);
      cls = isPlayerA ? 'win-player' : 'win-rival';
      resultText = `${charA.name} 勝利`;
    } else {
      const isPlayerB = _isPlayerSide(G, idB);
      cls = isPlayerB ? 'win-player' : 'win-rival';
      resultText = `${charB.name} 勝利`;
    }
    mqText = rec.mq ? `MQ ${rec.mq}` : '';
    const cardLabel = idx === 0 ? `${charA.name} vs ${charB.name}(初対戦)` : `${charA.name} vs ${charB.name}(${idx + 1}戦目)`;
    return `<div class="history-row ${cls}">
      <div class="history-when">
        <span class="week-num">S${rec.s} W${String(rec.w).padStart(2, '0')}</span>
        シーズン${rec.s}<br>第${rec.w}週
      </div>
      <div>
        <div class="history-card">${stageBadge(rec.st)}${titleBadge(rec.t)}${eventBadges(rec)}${cardLabel}</div>
      </div>
      <div class="history-result ${cls}">
        ${resultText}<br><span class="mq">${mqText}</span>
      </div>
    </div>`;
  }).join('');

  return `<section class="rivalry-history">
    <div class="sec-label">対戦の軌跡(直近${history.length}戦)</div>
    <div class="history-list">${rows}</div>
  </section>`;
}

function _renderRivalryRelations(relations, pickText) {
  if (!relations || !relations.length) {
    return '';
  }
  const cards = relations.map(rel => {
    const { tag, charA, charB, idA, idB, h2h } = rel;
    const narrative = (typeof KURODA_RELATION_NARRATIVE !== 'undefined') ? KURODA_RELATION_NARRATIVE[tag] : null;
    const d = _buildNarrativeData(rel);
    const headline = (narrative && pickText(narrative.headlines, d)) || '業界の関係';
    const body = (narrative && pickText(narrative.bodies, d)) || '';

    const faceA = (typeof getPortraitUrl === 'function') ? getPortraitUrl(idA) : '';
    const faceB = (typeof getPortraitUrl === 'function') ? getPortraitUrl(idB) : '';
    const orgA = _findFighterOrgName(G, idA);
    const orgB = _findFighterOrgName(G, idB);
    const scope = (orgA === orgB) ? `${orgA}内` : `${orgA} × ${orgB}`;
    const isInterAi = !rel.isPlayerInvolved;

    const winsA = h2h.winsA || 0, winsB = h2h.winsB || 0, draws = h2h.draws || 0;
    const recordText = (winsA || winsB || draws)
      ? `通算 ${winsA}勝${winsB}敗${draws ? draws + '分' : ''}`
      : '対戦履歴なし';
    const factParts = [recordText];
    if (h2h.bestMQ) factParts.push(`最高 MQ${h2h.bestMQ}`);
    if (h2h.lastMatch) factParts.push(`直近 S${h2h.lastMatch.season} W${String(h2h.lastMatch.week).padStart(2, '0')}`);

    const headlineCls = (tag === 'pure_hatred') ? 'heat'
      : (tag === 'bitter_feud') ? 'bitter'
      : (tag === 'allied_rivalry') ? 'allied'
      : (tag === 'fated_admiration') ? 'fated' : '';

    return `<div class="relation-card" data-tag="${tag}">
      <div class="relation-card-photos">
        ${faceA ? `<div class="relation-photo left" style="background-image:url('${faceA}');"></div>` : ''}
        <span class="relation-vs">VS</span>
        ${faceB ? `<div class="relation-photo right" style="background-image:url('${faceB}');"></div>` : ''}
        <div class="pair-meta">
          <span class="scope"${isInterAi ? ' style="background:rgba(139,26,26,0.15);color:#8b1a1a;"' : ''}>${scope}</span>
        </div>
      </div>
      <div class="relation-names">${charA.name} ⇄ ${charB.name}</div>
      <div class="relation-headline ${headlineCls}">${headline}</div>
      ${body ? `<div class="relation-body">${body}</div>` : ''}
      <div class="relation-facts">${factParts.join(' <span class="sep">|</span> ')}</div>
    </div>`;
  }).join('');

  return `<section class="rivalry-relations">
    <div class="sec-label-gold">他にも続く因縁(全業界)</div>
    <div class="relations-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">${cards}</div>
  </section>`;
}

// ══════════════════════════════════════════════════════════
// _renderDbFactions — 🎭 派閥サブタブ
// ══════════════════════════════════════════════════════════
function _getFactionAccentVar(factionId) {
  const palette = ['--accent-faction-1', '--accent-faction-2', '--accent-faction-3', '--accent-faction-4'];
  return palette[(factionId - 1) % palette.length];
}

// Faction Tab v0.9 (Phase B-2 完全リデザイン) — 補助関数群
const _DFC_FACTION_ACCENT_LIGHT = {
  '--accent-faction-1': '#d8a87a',
  '--accent-faction-2': '#9bb6cf',
  '--accent-faction-3': '#a89bc4',
  '--accent-faction-4': '#8fbaa6',
};
function _dfcRoleMark(char, factionId) {
  const f = (G.factions || []).find(fc => fc.id === factionId);
  if (!f) return '';
  if (char.id === f.leaderId) return 'CAP';
  return '';
}
function _dfcImg(charId, alt) {
  const upper = (typeof getUpperUrl === 'function' ? getUpperUrl(charId) : null)
    || (typeof getPortraitUrl === 'function' ? getPortraitUrl(charId) : null);
  if (upper) return `<img src="${upper}" alt="${alt || ''}" onerror="this.style.display='none'">`;
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#7a7466;background:rgba(200,190,170,0.06)">${(alt||'?').slice(0,1)}</div>`;
}
function _dfcImgFace(charId, alt) {
  const face = (typeof getPortraitUrl === 'function' ? getPortraitUrl(charId) : null);
  if (face) return `<img src="${face}" alt="${alt || ''}" onerror="this.style.display='none'">`;
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#7a7466;background:rgba(200,190,170,0.06)">${(alt||'?').slice(0,1)}</div>`;
}
function _dfcFlavorTag(flavor) {
  // v0.2 アーキタイプ拡張: 6 種対応（自然型は廃止し結束型へ吸収）
  const map = {
    authoritarian: '権威型',
    bond_first: '結束型',
    meritocratic: '実力主義',
    heel: 'ヒール派閥',
    face: '正統派',
    combat: '武闘派',
    neutral: '結束型',
  };
  return map[flavor] || '結束型';
}
function _dfcSolidarityKey(label) {
  return label === '強固' ? 'strong' : label === '安定' ? 'stable' : label === '揺らぎ' ? 'wobble' : 'crumble';
}
function _dfcMomentumKey(label) {
  return label === '隆盛' ? 'boom' : label === '上昇' ? 'rise' : label === '平常' ? 'calm' : label === '陰り' ? 'dim' : 'fade';
}
function _dfcAvgOvr(faction, roster) {
  if (!faction || !faction.memberIds.length) return 0;
  const ovrs = faction.memberIds.map(id => {
    const c = roster.find(r => r.id === id);
    return c ? Engine.util.ov(c) : 0;
  });
  const sum = ovrs.reduce((a, b) => a + b, 0);
  return Math.round((sum / ovrs.length) * 10) / 10;
}
function _dfcSeasonLabel(season, week) {
  if (!season || !week) return '—';
  return `第${season}年 W${String(week).padStart(2, '0')}`;
}
function _dfcEra(state, faction) {
  if (!faction) return '—';
  const since = (faction.createdSeason || state.season || 1) - 1;
  const sinceWeek = (faction.createdWeek || 1);
  const nowAbs = Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
  const startAbs = Engine.util.absWeekTotal(since + 1, sinceWeek, false, 0);
  return Math.max(0, nowAbs - startAbs);
}
// 黒田ナレーション・テンプレ生成（5パターン以上、抗争中/中立で分岐、状態スロット埋め）
function _dfcChronicle(faction, state, opts = {}) {
  if (!faction) return '';
  const roster = state.roster || [];
  const leader = roster.find(c => c.id === faction.leaderId);
  if (!leader) return '';
  const flavor = _dfcFlavorTag(faction.flavor);
  const created = _dfcSeasonLabel(faction.createdSeason, faction.createdWeek);
  const eraWeeks = _dfcEra(state, faction);
  const memberChars = faction.memberIds
    .filter(id => id !== faction.leaderId)
    .map(id => roster.find(c => c.id === id))
    .filter(Boolean)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const keyMember = memberChars[0];
  const solidarity = Engine.factions.getSolidarityLabel(faction, state);
  const inFeud = !!opts.feudPair;

  let html = `<div class="dfc-narrative"><div class="nh"><span class="icon">📜</span><span>FACTION CHRONICLE</span></div>`;
  if (inFeud) {
    const otherFaction = opts.feudPair;
    const fp = opts.feudEntry;
    const myPt = (fp && (fp.factionAId === faction.id ? fp.pointsA : fp.pointsB)) || 0;
    const oppPt = (fp && (fp.factionAId === faction.id ? fp.pointsB : fp.pointsA)) || 0;
    const tide = myPt > oppPt ? '優勢' : (myPt < oppPt ? '劣勢' : '互角');
    const tideStrong = myPt - oppPt >= 25 ? '大きく優勢' : (oppPt - myPt >= 25 ? '苦戦色濃く' : tide);
    html += `<p>${created} 結成、<em>${leader.name}</em>を頂点に<strong>${flavor}</strong>を掲げる派閥。`
      + `結成${eraWeeks}週で<em>${otherFaction.name}</em>と<strong>抗争状態</strong>に突入し、現在 W${eraWeeks} 目の戦線。</p>`;
    if (keyMember) {
      html += `<p>要は <em>${keyMember.name}</em>（OVR ${Engine.util.ov(keyMember)}）。`
        + `${otherFaction.name}との抗争で<strong>${tideStrong}</strong>を維持しつつ、${faction.name}の象徴となる選手。</p>`;
    } else {
      html += `<p>抗争ポイントは <strong>${myPt} - ${oppPt}</strong>（${tideStrong}）。`
        + `結束は<em>${solidarity}</em>、リーダー直轄の規律で戦線を保つ。</p>`;
    }
  } else {
    html += `<p>${created} 結成、<em>${leader.name}</em>のもとに集まった<strong>${flavor}</strong>の派閥。`
      + `結成から${eraWeeks}週、結束は<em>${solidarity}</em>。</p>`;
    if (keyMember) {
      html += `<p>要は <em>${keyMember.name}</em>（OVR ${Engine.util.ov(keyMember)}）。`
        + `${faction.name}の柱として安定した戦力を提供している。</p>`;
    }
  }
  html += `</div>`;
  return html;
}

// FactionCard レンダラ (in-feud / left-right / 中立 を opts で分岐)
function _dfcRenderCard(faction, state, opts = {}) {
  if (!faction) return '';
  const roster = state.roster || [];
  const leader = roster.find(c => c.id === faction.leaderId);
  if (!leader) return '';
  const accentVar = _getFactionAccentVar(faction.id);
  const accentLight = _DFC_FACTION_ACCENT_LIGHT[accentVar] || '#d8a87a';
  const memberChars = faction.memberIds
    .filter(id => id !== faction.leaderId)
    .map(id => roster.find(c => c.id === id))
    .filter(Boolean)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const seconds = memberChars.slice(0, 2);
  const rankFile = memberChars.slice(2);
  const flavor = _dfcFlavorTag(faction.flavor);
  const solidarity = Engine.factions.getSolidarityLabel(faction, state);
  const solidarityKey = _dfcSolidarityKey(solidarity);
  const momentumLabel = Engine.factions.getMomentumLabel(faction.momentum || 0);
  const momentumKey = _dfcMomentumKey(momentumLabel);
  const avgOvr = _dfcAvgOvr(faction, roster);
  const created = _dfcSeasonLabel(faction.createdSeason, faction.createdWeek);

  // side クラス: 'left' / 'right' / '' (中立)
  const sideCls = opts.side ? ` ${opts.side}` : '';
  const inFeudCls = opts.inFeud ? ' in-feud' : '';
  const styleVars = `--faction-accent:var(${accentVar});--faction-accent-light:${accentLight};`;
  const isLeftSide = opts.side === 'left';

  let html = `<div class="dfc${inFeudCls}${sideCls}" style="${styleVars}" data-faction-id="${faction.id}" onclick="if(window.openFactionPanel)openFactionPanel(${faction.id})">`;
  if (opts.inFeud) html += `<div class="dfc-flag">🔥 抗争中</div>`;

  // Hero
  const leaderOvr = Engine.util.ov(leader);
  const leaderPop = Math.round(leader.popularity || 0);
  const tagsHtml = (() => {
    const t = [];
    if (faction.authoritativeTag) t.push(`<span class="dfc-tag auth">権威型</span>`);
    if (faction.dictatorTag) t.push(`<span class="dfc-tag" style="border-color:rgba(196,98,58,0.5);color:#e89270">独裁化</span>`);
    t.push(`<span class="dfc-tag">${flavor}</span>`);
    return t.join('');
  })();
  const heroMeta = `
    <div class="meta">
      ${isLeftSide
        ? `<div class="name-row"><span class="count">${faction.memberIds.length}名</span><span class="name">${faction.name}</span></div>`
        : `<div class="name-row"><span class="name">${faction.name}</span><span class="count">${faction.memberIds.length}名</span></div>`}
      <div class="leader-name">${isLeftSide
        ? `${leader.name}<span class="role-mark">CAP</span>`
        : `<span class="role-mark">CAP</span>${leader.name}`}</div>
      <div class="leader-stats">
        <span class="stat-ovr">${leaderOvr}<small>OVR</small></span>
        <span class="stat-pop">${leaderPop}<small>POP</small></span>
      </div>
      <div class="tags">${tagsHtml}</div>
    </div>`;
  const heroPp = `<div class="leader-pp" onclick="event.stopPropagation();showFighterPopup(${leader.id},'')">${_dfcImg(leader.id, leader.name)}</div>`;
  html += `<div class="dfc-hero">`;
  html += isLeftSide ? `${heroMeta}${heroPp}` : `${heroPp}${heroMeta}`;
  html += `</div>`;

  // RIVALRY POINTS (in-feud のみ)
  if (opts.inFeud && opts.feudEntry) {
    const fp = opts.feudEntry;
    const myPt = fp.factionAId === faction.id ? fp.pointsA : fp.pointsB;
    const goal = (typeof FACTION_CONFIG !== 'undefined' && FACTION_CONFIG.pointsResolutionThreshold) || 100;
    const pct = Math.min(100, (myPt / goal) * 100);
    const ptHtml = `<div class="dfc-pp-pt">${myPt}<small>PT</small></div>`;
    const barHtml = `<div class="dfc-pp-bar"><div class="dfc-pp-fill" style="width:${pct}%"></div></div>`;
    html += `<div class="dfc-pp">`;
    html += `<div class="dfc-pp-label">RIVALRY POINTS</div>`;
    html += `<div class="dfc-pp-row">${isLeftSide ? `${barHtml}${ptHtml}` : `${ptHtml}${barHtml}`}</div>`;
    html += `</div>`;
  }

  // Roster (2ND/3RD)
  if (seconds.length) {
    html += `<div class="dfc-roster">`;
    seconds.forEach((c, idx) => {
      const role = idx === 0 ? '2ND · 副将' : '3RD · 中堅';
      const ovr = Engine.util.ov(c);
      const pop = Math.round(c.popularity || 0);
      const archMap = { striker: 'ストライカー', technician: 'テクニシャン', flyer: 'フライヤー', powerhouse: 'パワーファイター', allrounder: 'オールラウンダー' };
      const sub = archMap[c.style] || (c.style || '—');
      const ppCell = `<div class="pp" onclick="event.stopPropagation();showFighterPopup(${c.id},'')">${_dfcImgFace(c.id, c.name)}</div>`;
      const statsCell = `<div class="stats"><div class="ovr">${ovr}</div><div class="pop">${pop}</div></div>`;
      const nameCell = `<div class="name-block"><div class="role">${role}</div><div class="nm">${c.name}</div><div class="sub-info">${sub}</div></div>`;
      html += `<div class="dfc-roster-row">`;
      html += isLeftSide ? `${statsCell}${nameCell}${ppCell}` : `${ppCell}${nameCell}${statsCell}`;
      html += `</div>`;
    });
    html += `</div>`;
  }

  // RANK & FILE (in-feud は最大4名表示、中立は最大3名)
  if (rankFile.length) {
    const maxTiles = opts.inFeud ? 4 : 3;
    const tiles = rankFile.slice(0, maxTiles);
    const overflow = rankFile.length - tiles.length;
    html += `<div class="dfc-rankfile">`;
    html += `<div class="dfc-rankfile-head"><span>RANK & FILE</span><span class="count">${rankFile.length}名</span></div>`;
    html += `<div class="dfc-rankfile-tiles">`;
    tiles.forEach(c => {
      const ovr = Engine.util.ov(c);
      html += `<div class="rf-tile" title="${c.name}" onclick="event.stopPropagation();showFighterPopup(${c.id},'')">${_dfcImgFace(c.id, c.name)}<div class="rf-ovr">${ovr}</div></div>`;
    });
    if (overflow > 0) {
      html += `<div class="rf-tile" title="他${overflow}名" style="display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:18px;color:#9a9080">+${overflow}</div>`;
    }
    html += `</div></div>`;
  }

  // FACTION CHRONICLE (in-feud のみフル、中立は省略)
  if (opts.inFeud) {
    html += _dfcChronicle(faction, state, { feudPair: opts.feudOpponent, feudEntry: opts.feudEntry });
  }

  // Stats
  const stats = [];
  stats.push(`<div class="dfc-stat-row"><span class="lbl">平均OVR</span><span class="val">${avgOvr}</span></div>`);
  stats.push(`<div class="dfc-stat-row"><span class="lbl">設立</span><span class="val">${created}</span></div>`);
  if (opts.inFeud) {
    // 抗争中: 勝率/直対戦績の算出は h2h からの集計が重いので、Phase B-2 では平均OVR/設立に留め将来拡張
    stats.push(`<div class="dfc-stat-row"><span class="lbl">構成</span><span class="val">${faction.memberIds.length}名</span></div>`);
    const momCls = (faction.momentum || 0) >= 30 ? 'pos' : ((faction.momentum || 0) <= -30 ? 'warn' : '');
    stats.push(`<div class="dfc-stat-row"><span class="lbl">勢い</span><span class="val ${momCls}">${momentumLabel}</span></div>`);
  }
  html += `<div class="dfc-stats">${stats.join('')}</div>`;

  // Foot
  html += `<div class="dfc-foot"><div class="meters">`;
  html += `<span class="dfc-meter solid-${solidarityKey}">結束:${solidarity}</span>`;
  html += `<span class="dfc-meter mom-${momentumKey === 'boom' ? 'boom' : ''}">勢い:${momentumLabel}</span>`;
  if (opts.inFeud && opts.feudOpponent) {
    const hostMap = state.factionHostility || {};
    const hAB = hostMap[`${faction.id}>${opts.feudOpponent.id}`] || 0;
    const hBA = hostMap[`${opts.feudOpponent.id}>${faction.id}`] || 0;
    const avg = (hAB + hBA) / 2;
    html += `<span class="dfc-meter">${opts.feudOpponent.name}と${Engine.factions.getHostilityLabel(avg)}</span>`;
  }
  html += `</div></div>`;

  // 派閥内序列（spec: faction-internal-rank-spec-v0.2 §5.4）
  // BOND archetype はポイント蓄積を行わないため非表示
  if (faction.archetypeId !== 'BOND' && faction.flavor !== 'bond_first') {
    const ipMap = (state.factionInternalPoints || {})[faction.id] || {};
    const leaderPt = ipMap[faction.leaderId] || 0;
    const challengers = (faction.memberIds || [])
      .filter(id => id !== faction.leaderId)
      .map(id => {
        const c = roster.find(r => r.id === id);
        return c ? { id, name: c.name, pt: ipMap[id] || 0 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.pt - a.pt);
    const top = challengers[0];
    const cfg = (typeof FACTION_CONFIG !== 'undefined') ? FACTION_CONFIG : {};
    const threshold = (faction.archetypeId === 'FACE')
      ? (cfg.internalChallengeThresholdGapFace || 15)
      : (cfg.internalChallengeThresholdGap || 10);
    const challengerActive = top && top.pt > leaderPt && (top.pt - leaderPt) >= threshold;
    // リーダー就任からの経過週（lastLeaderChangeSeason/Week 流用）
    const enthronedSeason = faction.lastLeaderChangeSeason != null ? faction.lastLeaderChangeSeason
      : (faction.createdSeason != null ? faction.createdSeason : 1);
    const enthronedWeek = faction.lastLeaderChangeWeek != null ? faction.lastLeaderChangeWeek
      : (faction.createdWeek != null ? faction.createdWeek : 1);
    const enthronedAbs = Engine.util.absWeekTotal(enthronedSeason, enthronedWeek, false, 0);
    const nowAbs = Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
    const enthronedWeeks = Math.max(0, nowAbs - enthronedAbs);
    const enthronedLabel = (enthronedWeeks < 52) ? `就任${enthronedWeeks + 1}週目` : '';
    const arrow = challengerActive ? '⚔' : '·';
    html += `<div class="dfc-internal-rank">`;
    html += `<div class="dfc-ir-row">`;
    html += `<span class="dfc-ir-label">序列</span>`;
    html += `<span class="dfc-ir-leader">👑 ${leader.name} <small>${leaderPt}pt</small></span>`;
    if (top) {
      const challengerCls = challengerActive ? ' active' : '';
      html += `<span class="dfc-ir-arrow${challengerCls}">${arrow}</span>`;
      html += `<span class="dfc-ir-challenger${challengerCls}">${top.name} <small>${top.pt}pt</small></span>`;
    }
    if (enthronedLabel) {
      html += `<span class="dfc-ir-tenure">${enthronedLabel}</span>`;
    }
    html += `</div>`;
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// 抗争タイムライン（FeudTimeline）
function _dfcRenderFeudTimeline(state, factionAId, factionBId, feudEntry) {
  const tl = state.factionTimeline || [];
  const relevant = tl.filter(ev => {
    if (!ev) return false;
    const ids = [ev.factionAId, ev.factionBId, ev.winnerFactionId, ev.loserFactionId, ev.factionId, ev.survivorFactionId, ev.goneFactionId].filter(Boolean);
    return ids.includes(factionAId) || ids.includes(factionBId);
  });
  // 開始週以降のみ
  const startAbs = feudEntry ? Engine.util.absWeekTotal(feudEntry.startedSeason, feudEntry.startedWeek, false, 0) : 0;
  const filtered = relevant.filter(ev => {
    const evAbs = Engine.util.absWeekTotal(ev.season, ev.week, false, 0);
    return evAbs >= startAbs;
  });
  // 直近6件
  const recent = filtered.slice(-6);
  if (!recent.length) {
    return `<div class="feud-timeline"><span style="color:var(--office-text-on-dark-dim,#7a7466)">タイムラインに記録された抗争イベントはまだありません</span></div>`;
  }
  const parts = recent.map((ev, i) => {
    let cls = 'match', label = ev.type || 'EVENT';
    if (/F02/.test(ev.type)) { cls = 'f02'; label = ev.type.replace('F02_', 'F02 ・ '); }
    else if (/F08/.test(ev.type)) { cls = 'f08'; label = 'F08'; }
    else if (/F09/.test(ev.type)) { cls = 'f09'; label = 'F09'; }
    else if (ev.type === 'RIVALRY_CLOSED') { cls = 'f09'; label = `決着 ・ ${ev.reason || ''}`; }
    const w = `第${ev.season}年 W${String(ev.week).padStart(2, '0')}`;
    return `<span class="feud-timeline-marker ${cls}" title="${w}">${label}</span>`;
  });
  parts.push(`<span class="feud-timeline-marker now">NOW</span>`);
  const arrow = `<span class="feud-timeline-arrow">→</span>`;
  return `<div class="feud-timeline">${parts.join(arrow)}</div>`;
}

// 中央 VS 軸
function _dfcRenderFeudAxis(state, factionAId, factionBId, feudEntry, opts = {}) {
  const cfg = (typeof FACTION_CONFIG !== 'undefined') ? FACTION_CONFIG : {};
  const goal = cfg.pointsResolutionThreshold || 100;
  const f09NearH = cfg.f09NearBadgeHostility || 60;
  const f09H = cfg.f09HostilityMin || 65;
  const startAbs = feudEntry ? Engine.util.absWeekTotal(feudEntry.startedSeason, feudEntry.startedWeek, false, 0) : 0;
  const nowAbs = Engine.util.absWeekTotal(state.season, state.week, state.offSeason, state.offWeek);
  const weeks = Math.max(1, nowAbs - startAbs + 1);
  const hostMap = state.factionHostility || {};
  const hAB = hostMap[`${factionAId}>${factionBId}`] || 0;
  const hBA = hostMap[`${factionBId}>${factionAId}`] || 0;
  const f09Ready = hAB >= f09H && hBA >= f09H;
  const f09Near = !f09Ready && hAB >= f09NearH && hBA >= f09NearH;
  const badge = f09Ready
    ? `<div class="near-badge fire">F09 発火圏</div>`
    : (f09Near ? `<div class="near-badge">F09 接近中</div>` : '');
  const histId = `feud-history-${factionAId}-${factionBId}`;
  return `
    <div class="feud-axis">
      <div class="feud-axis-vs">
        <div class="vs">VS</div>
        <div class="week">WEEK ${weeks}</div>
        ${badge}
      </div>
      <div class="feud-axis-goal">
        <div class="lbl">GOAL</div>
        <div class="v">${goal}</div>
        <div class="sub">先取で決着</div>
      </div>
      <div class="feud-axis-spine"></div>
      <div class="feud-axis-history" onclick="(function(el){const t=document.getElementById('${histId}');if(t)t.style.display=t.style.display==='none'?'flex':'none';const a=el.querySelector('.arrow');if(a)a.textContent=t&&t.style.display==='none'?'▼':'▲';})(this)">
        <div class="lbl">HISTORY</div>
        <div class="arrow">▼</div>
      </div>
    </div>`;
}

function _dfcRenderFeudDuel(state, factionA, factionB, feudEntry) {
  const histId = `feud-history-${factionA.id}-${factionB.id}`;
  let html = `<div class="feud-duel">`;
  html += _dfcRenderCard(factionA, state, { side: 'left', inFeud: true, feudEntry, feudOpponent: factionB });
  html += _dfcRenderFeudAxis(state, factionA.id, factionB.id, feudEntry);
  html += _dfcRenderCard(factionB, state, { side: 'right', inFeud: true, feudEntry, feudOpponent: factionA });
  html += `</div>`;
  // HISTORY 展開部 (デフォルト非表示)
  html += `<div id="${histId}" style="display:none">${_dfcRenderFeudTimeline(state, factionA.id, factionB.id, feudEntry)}</div>`;
  return html;
}

function _renderDbFactions() {
  const factions = G.factions || [];
  if (!factions.length) {
    return `
      <div style="padding:48px 24px;text-align:center;color:var(--office-text-on-dark-sub,#b8b1a3)">
        <div style="font-size:48px;margin-bottom:12px;opacity:0.35">🎭</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:6px;color:var(--office-text-on-dark-main,#e8e6e0)">現在、派閥は存在しません</div>
        <div style="font-size:12px;line-height:1.7;max-width:440px;margin:0 auto">
          所属選手11人以上＋リーダー候補から深い絆（bond 60以上）で結ばれたフォロワーが2人以上集まると、
          自然発生的に派閥が形成されることがあります。<br>
          やがて複数の派閥が並び立ち、選手同士の因縁が積み重なると、派閥間で抗争が勃発することも。
        </div>
      </div>
    `;
  }

  const rivalryPoints = G.factionRivalryPoints || {};
  const factionById = new Map(factions.map(f => [f.id, f]));

  // 抗争中ペアを抽出（factionRivalryPoints のうち両派閥存命のもの）
  const feudPairs = [];
  const inFeudIds = new Set();
  for (const key of Object.keys(rivalryPoints)) {
    const e = rivalryPoints[key];
    if (!e) continue;
    const fA = factionById.get(e.factionAId);
    const fB = factionById.get(e.factionBId);
    if (!fA || !fB) continue;
    feudPairs.push({ factionA: fA, factionB: fB, entry: e });
    inFeudIds.add(fA.id);
    inFeudIds.add(fB.id);
  }
  // 中立派閥: 抗争中でない全派閥
  const neutralFactions = factions.filter(f => !inFeudIds.has(f.id));

  let html = `<h2 class="dfx-section-title"><span>FACTION OVERVIEW</span><span class="ja">🎭 派閥</span><span class="count">${factions.length}</span></h2>`;

  // 抗争中ペアセクション
  if (feudPairs.length) {
    feudPairs.forEach(pair => {
      html += `<div class="dfx-layer-label feud">⚔ 抗争中 — ${pair.factionA.name} ╳ ${pair.factionB.name}</div>`;
      html += _dfcRenderFeudDuel(G, pair.factionA, pair.factionB, pair.entry);
    });
  }

  // 中立派閥セクション
  if (neutralFactions.length) {
    html += `<div class="dfx-layer-label">⛺ 平和な派閥 — ${neutralFactions.length} FACTIONS</div>`;
    html += `<div class="dfx-grid-neutral">`;
    neutralFactions.forEach(f => {
      html += _dfcRenderCard(f, G, { side: '', inFeud: false });
    });
    html += `</div>`;
  }

  return html;
}

// ══════════════════════════════════════════════════════════
// _renderDbRelmap — HTML skeleton generation
// ══════════════════════════════════════════════════════════
function _relmapPrepareMobileData(allChars) {
  _relmapNodeMap = {};
  _relmapNodes = allChars.map((c, index) => {
    const node = {
      id: c.id,
      name: c.name,
      orgId: c._orgId,
      ovr: Engine.util.ov(c),
      style: c.style,
      color: _relmapGetOrgColorById(c._orgId),
      _char: c,
      _index: index,
    };
    _relmapNodeMap[node.id] = node;
    return node;
  });
  _relmapLinks = _relmapBuildLinks(allChars);
  _relmapBuildLinkIndexes(_relmapLinks);
}

function _relmapMobileFactionNames(charId) {
  return (G.factions || [])
    .filter(f => (f.memberIds || []).some(id => String(id) === String(charId)))
    .map(f => f.name)
    .filter(Boolean);
}

function _relmapMobileOrientedValues(link, centerId) {
  const centerIsA = String(link.a) === String(centerId);
  return centerIsA
    ? { bondOut: link.bondAB, bondIn: link.bondBA, rivOut: link.rivAB, rivIn: link.rivBA }
    : { bondOut: link.bondBA, bondIn: link.bondAB, rivOut: link.rivBA, rivIn: link.rivAB };
}

function _relmapMobileCategory(link) {
  const maxRiv = Math.max(link.rivAB, link.rivBA);
  const avgBond = (link.bondAB + link.bondBA) / 2;
  const minBond = Math.min(link.bondAB, link.bondBA);
  if (link.rivalTitle || link.hostileLabel || maxRiv >= 40) return 'rivalry';
  if (avgBond >= 60) return 'trust';
  if (minBond <= 40) return 'tension';
  return 'history';
}

function _relmapMobileIsStrong(link) {
  return !!(
    link.rivalTitle ||
    link.hostileLabel ||
    Math.max(link.rivAB, link.rivBA) >= 40 ||
    Math.max(Math.abs(link.bondAB - 50), Math.abs(link.bondBA - 50)) >= 20
  );
}

function _relmapMobileRelationLabel(link, values) {
  if (link.rivalTitle) return `${link.titleEmoji || '🔥'} ${link.rivalTitle}`;
  if (link.hostileLabel) return `⚡ ${link.hostileLabel}`;
  const maxRiv = Math.max(values.rivOut, values.rivIn);
  const avgBond = (values.bondOut + values.bondIn) / 2;
  if (maxRiv >= 60) return '激しいライバル関係';
  if (maxRiv >= 40) return '意識し合う相手';
  if (avgBond >= 75) return '強い信頼関係';
  if (avgBond >= 60) return '友好的な関係';
  if (Math.min(values.bondOut, values.bondIn) <= 25) return '深い不和';
  if (Math.min(values.bondOut, values.bondIn) <= 40) return '警戒・距離感';
  return link.hasPast ? '過去に接点あり' : '関係あり';
}

function _relmapMobileRelationCard(centerChar, otherChar, link, factionNames = []) {
  const centerOvr = Engine.util.ov(centerChar);
  const otherOvr = Engine.util.ov(otherChar);
  const safeName = _escapeHtml(otherChar.name || '不明');
  const safeOrg = _escapeHtml(_relmapGetOrgLabel(otherChar));
  const safeStyle = _escapeHtml(otherChar.style || '');
  const factionText = factionNames.length ? `🎭 ${factionNames.map(_escapeHtml).join(' / ')}` : '';
  let relationHtml = '';

  if (link) {
    const values = _relmapMobileOrientedValues(link, centerChar.id);
    const label = _relmapMobileRelationLabel(link, values);
    const emotion = getEmotionText(
      values.bondOut,
      values.rivOut,
      centerOvr,
      otherOvr,
      centerChar.archetype
    );
    relationHtml = `
      <div class="rm-mobile-relation-label">${_escapeHtml(label)}</div>
      <div class="rm-mobile-direction-grid">
        <div><span>${_escapeHtml(centerChar.name)} →</span><b>親密 ${Math.round(values.bondOut)}</b><b>競争 ${Math.round(values.rivOut)}</b></div>
        <div><span>← ${safeName}</span><b>親密 ${Math.round(values.bondIn)}</b><b>競争 ${Math.round(values.rivIn)}</b></div>
      </div>
      <div class="rm-mobile-emotion">「${_escapeHtml(emotion)}」</div>`;
  } else {
    relationHtml = `<div class="rm-mobile-relation-label">同じ派閥に所属</div>`;
  }

  return `<article class="rm-mobile-card" role="button" tabindex="0"
      onclick="_relmapMobileSetCenter(${Number(otherChar.id)})"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_relmapMobileSetCenter(${Number(otherChar.id)})}">
    <div class="rm-mobile-card-head">
      <div class="rm-mobile-face">${_relmapFaceHtml(otherChar.id, 54)}</div>
      <div class="rm-mobile-person">
        <strong>${safeName}</strong>
        <span>${safeOrg}</span>
        <small>OVR ${otherOvr}${safeStyle ? ` ・ ${safeStyle}` : ''}</small>
      </div>
      <button class="rm-mobile-detail-btn" type="button" onclick="event.stopPropagation();showFighterPopup(${Number(otherChar.id)})">詳細</button>
    </div>
    ${factionText ? `<div class="rm-mobile-faction-chip">${factionText}</div>` : ''}
    ${relationHtml}
    <div class="rm-mobile-change-hint">この選手を中心に見る ›</div>
  </article>`;
}

function _relmapMobileSearchResultsHtml(allChars, query) {
  const normalized = String(query || '').trim().toLocaleLowerCase('ja');
  if (!normalized) return '';
  const results = allChars
    .filter(c => String(c.id) !== String(_relmapCenterId))
    .filter(c => `${c.name || ''} ${_relmapGetOrgLabel(c)}`.toLocaleLowerCase('ja').includes(normalized))
    .slice(0, 8);
  if (!results.length) return '<div class="rm-mobile-search-empty">該当する選手がいません</div>';
  return results.map(c => `<button type="button" onclick="_relmapMobileSetCenter(${Number(c.id)})">
    <span class="rm-mobile-search-face">${_relmapFaceHtml(c.id, 34)}</span>
    <span><b>${_escapeHtml(c.name)}</b><small>${_escapeHtml(_relmapGetOrgLabel(c))} ・ OVR ${Engine.util.ov(c)}</small></span>
  </button>`).join('');
}

function _relmapMobileSearch(value) {
  _relmapMobileSearchTerm = String(value || '');
  const results = document.getElementById('rmMobileSearchResults');
  if (results) results.innerHTML = _relmapMobileSearchResultsHtml(_relmapGetAllChars(), _relmapMobileSearchTerm);
}

function _relmapMobileToggleStrong(checked) {
  _relmapMobileStrongOnly = !!checked;
  renderDatabase();
}

function _relmapMobileSetCenter(charId) {
  _relmapCenterId = Number(charId);
  _relmapMobileSearchTerm = '';
  renderDatabase();
  requestAnimationFrame(() => {
    const root = document.getElementById('relmapMobileRoot');
    if (root) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function _renderDbRelmapMobile(allChars, centerChar) {
  _relmapPrepareMobileData(allChars);
  const links = _relmapGetLinksFor(centerChar.id)
    .filter(link => !_relmapMobileStrongOnly || _relmapMobileIsStrong(link));
  const charsById = new Map(allChars.map(c => [String(c.id), c]));
  const groups = { rivalry: [], trust: [], tension: [], faction: [], history: [] };
  const includedIds = new Set();

  links.forEach(link => {
    const otherId = String(String(link.a) === String(centerChar.id) ? link.b : link.a);
    const otherChar = charsById.get(otherId);
    if (!otherChar) return;
    const category = _relmapMobileCategory(link);
    groups[category].push({ otherChar, link, factionNames: _relmapMobileFactionNames(otherChar.id).filter(name => _relmapMobileFactionNames(centerChar.id).includes(name)) });
    includedIds.add(otherId);
  });

  const centerFactions = (G.factions || []).filter(f =>
    (f.memberIds || []).some(id => String(id) === String(centerChar.id))
  );
  centerFactions.forEach(faction => {
    (faction.memberIds || []).forEach(memberId => {
      const key = String(memberId);
      if (key === String(centerChar.id) || includedIds.has(key)) return;
      const otherChar = charsById.get(key);
      if (!otherChar) return;
      const factionNames = centerFactions
        .filter(f => (f.memberIds || []).some(id => String(id) === key))
        .map(f => f.name)
        .filter(Boolean);
      groups.faction.push({ otherChar, link: null, factionNames });
      includedIds.add(key);
    });
  });

  const sections = [
    ['rivalry', '🔥 因縁・ライバル'],
    ['trust', '🤝 友情・親愛'],
    ['tension', '⚠️ 警戒・不和'],
    ['faction', '🎭 同門・派閥'],
    ['history', '📖 その他の関係'],
  ];
  const relationCount = links.length + groups.faction.length;
  const centerFactionNames = _relmapMobileFactionNames(centerChar.id);

  let html = `<div id="relmapMobileRoot" class="relmap-mobile-root">`;
  html += `<section class="rm-mobile-hero">
    <div class="rm-mobile-hero-face">${_relmapFaceHtml(centerChar.id, 74)}</div>
    <div class="rm-mobile-hero-main">
      <span class="rm-mobile-center-label">CENTER</span>
      <h3>${_escapeHtml(centerChar.name)}</h3>
      <p>${_escapeHtml(_relmapGetOrgLabel(centerChar))}</p>
      <div><b>OVR ${Engine.util.ov(centerChar)}</b>${centerChar.style ? `<span>${_escapeHtml(centerChar.style)}</span>` : ''}<span>関係 ${relationCount}人</span></div>
    </div>
    <button type="button" onclick="showFighterPopup(${Number(centerChar.id)})">選手詳細</button>
    ${centerFactionNames.length ? `<div class="rm-mobile-hero-factions">🎭 ${centerFactionNames.map(_escapeHtml).join(' / ')}</div>` : ''}
  </section>`;
  html += `<section class="rm-mobile-tools">
    <label class="rm-mobile-search"><span>🔎</span><input type="search" value="${_relmapEscapeAttr(_relmapMobileSearchTerm)}" placeholder="中心にする選手を検索" oninput="_relmapMobileSearch(this.value)"></label>
    <label class="rm-mobile-strong"><input type="checkbox" ${_relmapMobileStrongOnly ? 'checked' : ''} onchange="_relmapMobileToggleStrong(this.checked)"><span>強い関係のみ</span></label>
    <div id="rmMobileSearchResults" class="rm-mobile-search-results">${_relmapMobileSearchResultsHtml(allChars, _relmapMobileSearchTerm)}</div>
  </section>`;

  const visibleSections = sections.filter(([key]) => groups[key].length);
  if (!visibleSections.length) {
    html += `<div class="rm-mobile-no-relations">${_relmapMobileStrongOnly ? '強い関係はまだありません。絞り込みを外すと、すべての関係を確認できます。' : '表示できる関係はまだありません。'}</div>`;
  } else {
    visibleSections.forEach(([key, title]) => {
      html += `<section class="rm-mobile-section"><h4>${title}<span>${groups[key].length}</span></h4>`;
      html += groups[key].map(item => _relmapMobileRelationCard(centerChar, item.otherChar, item.link, item.factionNames)).join('');
      html += `</section>`;
    });
  }
  html += `</div>`;
  return html;
}

function _renderDbRelmap() {
  const allChars = _relmapGetAllChars();
  if (!allChars.length) return '<div style="text-align:center;padding:40px;color:var(--text-dim)">選手がいません</div>';

  // Default center: first roster member
  if (!_relmapCenterId || !allChars.find(c => c.id === _relmapCenterId)) {
    _relmapCenterId = allChars.length > 0 ? allChars[0].id : null;
  }

  const centerChar = _relmapCenterId ? allChars.find(c => c.id === _relmapCenterId) : null;

  if (window.matchMedia?.('(max-width: 700px)').matches && centerChar) {
    return _renderDbRelmapMobile(allChars, centerChar);
  }

  let html = `<div id="relmapRoot" class="relmap-root">`;

  // ── Header bar ──
  html += `<div class="relmap-header">`;
  html += `<span class="rm-title">\uD83D\uDD17 RELATIONSHIP MAP</span>`;
  html += `<div class="rm-header-sep"></div>`;
  // View mode toggle
  html += `<div class="rm-view-toggle">`;
  html += `<button class="rm-vt-btn${_relmapViewMode==='network'?' active':''}" onclick="_relmapSetViewMode('network')">\uD83C\uDF10 ネットワーク</button>`;
  html += `<button class="rm-vt-btn${_relmapViewMode==='focus'?' active':''}" onclick="_relmapSetViewMode('focus')">\uD83C\uDFAF フォーカス</button>`;
  html += `<button class="rm-vt-btn${_relmapViewMode==='power'?' active':''}" onclick="_relmapSetViewMode('power')">\uD83D\uDDFA\uFE0F 勢力図</button>`;
  // Phase 3c: 派閥オーバーレイトグル（団体フィルタ ON 時のみ有効）
  const _foDisabled = !_relmapOrgFilter || _relmapGetFilteredFactions().length === 0;
  html += `<button class="rm-vt-btn rm-vt-faction${_relmapFactionOverlay?' active':''}" onclick="_relmapToggleFactionOverlay()"${_foDisabled?' disabled':''} title="${_foDisabled?'団体を選んでください':'派閥表示の ON/OFF'}">\uD83C\uDFAD 派閥</button>`;
  html += `</div>`;
  // Center indicator
  html += `<div class="rm-center-indicator" id="rmCenterIndicator" style="display:${_relmapCenterId && centerChar?'flex':'none'}">`;
  html += `<span class="ci-label">CENTER</span>`;
  html += `<span class="ci-name" id="rmCenterName">${centerChar ? centerChar.name : ''}</span>`;
  html += `<span class="ci-clear" onclick="_relmapClearCenter()" title="解除">\u2715</span>`;
  html += `</div>`;
  // Link filters
  html += `<div class="rm-header-controls">`;
  html += `<button class="rm-ctrl-btn${_relmapFilter==='all'?' active':''}" onclick="_relmapSetFilter('all')">全リンク</button>`;
  html += `<button class="rm-ctrl-btn${_relmapFilter==='rivalry'?' active':''}" onclick="_relmapSetFilter('rivalry')">ライバル</button>`;
  html += `<button class="rm-ctrl-btn${_relmapFilter==='bond'?' active':''}" onclick="_relmapSetFilter('bond')">親密度</button>`;
  html += `</div>`;
  html += `</div>`; // end header

  // ── Main area ──
  html += `<div class="relmap-main">`;

  // Sidebar
  html += `<div class="relmap-sidebar" id="rmSidebar"></div>`;

  // Graph canvas
  html += `<div class="relmap-canvas" id="relmapContainer">`;
  html += `<svg id="relmapSvg"><defs>`;
  html += `<filter id="rm-glow-gold" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feFlood flood-color="#d4a843" flood-opacity="0.5"/><feComposite in2="blur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  html += `<filter id="rm-glow-red" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-color="#e17055" flood-opacity="0.4"/><feComposite in2="blur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  // Bond arrowheads (warm=blue, cold=red)
  html += `<marker id="rm-arrow-warm" viewBox="0 0 8 6" refX="8" refY="3" markerWidth="8" markerHeight="6" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#74b9ff" opacity="0.7"/></marker>`;
  html += `<marker id="rm-arrow-cold" viewBox="0 0 8 6" refX="8" refY="3" markerWidth="8" markerHeight="6" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#ff7675" opacity="0.7"/></marker>`;
  // Org zone gradients
  for (const [orgId, color] of Object.entries(_RELMAP_ORG_COLORS)) {
    const op = orgId === 'player' ? 0.08 : 0.06;
    html += `<radialGradient id="rm-zone-${orgId}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${color}" stop-opacity="${op}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  }
  html += `</defs><g id="relmapZoneLayer"></g><g id="relmapFactionLayer"></g><g id="relmapLinkLayer"></g><g id="relmapNodeLayer"></g><g id="relmapFactionMarkerLayer"></g></svg>`;
  html += `</div>`; // end canvas

  // Legend
  html += `<div class="relmap-legend">`;
  html += `<div class="rm-legend-title">LEGEND</div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch" style="background:#4aa3ff"></div> ボンド合計 高（青）</div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch" style="background:#ecf0f4"></div> ボンド合計 中立（白）</div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch" style="background:#e74c3c"></div> ボンド合計 低（赤）</div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch thick" style="background:#d7b45a"></div> ライバル心</div>`;
  html += `<div style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px;font-size:9px;color:var(--text-dim)">一本線=関係の濃さ<br>敵対ライバル=橙→赤<br>友好ライバル=黄緑→青</div>`;
  html += `</div>`;

  // Zoom controls
  html += `<div class="rm-zoom-controls">`;
  html += `<button class="rm-zoom-btn" onclick="_relmapZoomIn()" title="拡大">＋</button>`;
  html += `<button class="rm-zoom-btn" onclick="_relmapZoomOut()" title="縮小">−</button>`;
  html += `<button class="rm-zoom-btn rm-zoom-fit" onclick="_relmapZoomFit()" title="全員が入るように表示">全体</button>`;
  html += `</div>`;

  html += `</div>`; // end main

  // Detail panel
  html += `<div class="relmap-detail" id="relmapDetailPanel"></div>`;

  // Select hint
  html += `<div class="rm-select-hint" id="relmapSelectHint"></div>`;

  // Tooltip
  html += `<div class="rm-tooltip" id="relmapTooltip"></div>`;

  // Context menu
  html += `<div class="rm-ctx-menu" id="relmapCtxMenu">`;
  html += `<div class="rm-ctx-item" id="rmCtxCenter"><span class="rm-ctx-icon">\uD83C\uDFAF</span>中心に設定</div>`;
  html += `<div class="rm-ctx-item" id="rmCtxDetail"><span class="rm-ctx-icon">\uD83D\uDCCB</span>詳細を見る</div>`;
  html += `<div class="rm-ctx-sep"></div>`;
  html += `<div class="rm-ctx-item" id="rmCtxCompare"><span class="rm-ctx-icon">\u2696</span>比較に追加</div>`;
  html += `</div>`;

  // Compare popup overlay
  html += `<div class="rm-popup-overlay" id="relmapPopupOverlay"><div class="rm-popup-card" id="relmapPopupCard"></div></div>`;

  html += `</div>`; // end relmap-root

  return html;
}

// ══════════════════════════════════════════════════════════
// Face pattern helper — defsに<pattern>として顔画像を登録
// innerHTMLでnodeLayerを書き換えても画像が再読込されない
// ══════════════════════════════════════════════════════════
function _relmapBuildFacePatterns(svg) {
  const defs = svg.querySelector('defs');
  if (!defs) return;
  defs.querySelectorAll('[id^="rm-face-"]').forEach(el => el.remove());
  _relmapNodes.forEach(n => {
    const pUrl = getPortraitUrl(n.id);
    if (!pUrl) return;
    const pat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pat.id = `rm-face-${n.id}`;
    pat.setAttribute('patternContentUnits', 'objectBoundingBox');
    pat.setAttribute('width', '1');
    pat.setAttribute('height', '1');
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', pUrl);
    img.setAttribute('width', '1');
    img.setAttribute('height', '1');
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    pat.appendChild(img);
    defs.appendChild(pat);
  });
}

// ══════════════════════════════════════════════════════════
// _drawRelmapAfterRender — physics sim + event listeners
// ══════════════════════════════════════════════════════════
function _relmapEscapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/\"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _relmapBuildInlineFacePattern(patternId, pUrl) {
  const safeUrl = _relmapEscapeAttr(pUrl);
  const safeId = _relmapEscapeAttr(patternId);
  return `<pattern id="${safeId}" patternContentUnits="objectBoundingBox" width="1" height="1"><image href="${safeUrl}" xlink:href="${safeUrl}" width="1" height="1" preserveAspectRatio="xMidYMid slice"/></pattern>`;
}

function _relmapPolarOffset(radiusX, radiusY, angle, scale) {
  const amp = scale == null ? 1 : scale;
  return {
    x: Math.cos(angle) * radiusX * amp,
    y: Math.sin(angle) * radiusY * amp,
  };
}

function _drawRelmapAfterRender() {
  const container = document.getElementById('relmapContainer');
  const svg = document.getElementById('relmapSvg');
  if (!container || !svg) return;

  const W = container.offsetWidth;
  const H = container.offsetHeight;
  _relmapW = W; _relmapH = H;
  _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Build nodes & links from game data
  const allChars = _relmapGetAllChars();
  _relmapNodeMap = {};
  _relmapNodes = allChars.map((c, index) => {
    const ovr = Engine.util.ov(c);
    const n = { id: c.id, name: c.name, orgId: c._orgId, ovr, style: c.style,
      pw: c.pw, sp: c.sp, te: c.te, st: c.st, mn: c.mn,
      r: 12 + (ovr - 60) * 0.5, color: _relmapGetOrgColorById(c._orgId),
      x: 0, y: 0, _hidden: false, _dragging: false, _char: c, _index: index };
    _relmapNodeMap[n.id] = n;
    return n;
  });

  _relmapLinks = _relmapBuildLinks(allChars);
  _relmapBuildLinkIndexes(_relmapLinks);
  _relmapVisibleLinks = _relmapLinks.slice();

  // Initial positions: cluster by org
  const orgCenters = {
    player: { x: W * 0.3, y: H * 0.35 },
    org_s: { x: W * 0.7, y: H * 0.3 },
    org_a: { x: W * 0.25, y: H * 0.7 },
    org_b: { x: W * 0.7, y: H * 0.7 },
    fa: { x: W * 0.5, y: H * 0.5 },
  };
  _relmapNodes.forEach(n => {
    const c = orgCenters[n.orgId] || { x: W / 2, y: H / 2 };
    n.x = c.x + (Math.random() - 0.5) * 120;
    n.y = c.y + (Math.random() - 0.5) * 120;
  });

  _relmapVelocities = _relmapNodes.map(() => ({ vx: 0, vy: 0 }));
  _relmapAlpha = { value: 1.0, decay: 0.0015, min: 0.005 };
  _relmapFrameCount = 0;
  _relmapFocusTargets = {};

  // Build face image patterns in <defs> (persistent across innerHTML updates)
  _relmapBuildFacePatterns(svg);

  const isPhoneLayout = !!window.matchMedia?.('(max-width: 700px)').matches;

  // Apply visibility
  _relmapUpdateVisibility();

  // A phone focus graph must be readable immediately rather than waiting for
  // the force simulation to drift into its target layout.
  if (isPhoneLayout && _relmapViewMode === 'focus') {
    _relmapNodes.forEach((n, i) => {
      if (n._hidden) return;
      const target = _relmapFocusTargets[n.id];
      if (!target) return;
      n.x = target.x;
      n.y = target.y;
      if (_relmapVelocities[i]) {
        _relmapVelocities[i].vx = 0;
        _relmapVelocities[i].vy = 0;
      }
    });
  }

  // Draw org zones
  _relmapDrawOrgZones(orgCenters);

  // Render sidebar
  _relmapRenderSidebar(orgCenters);

  // Start animation
  _relmapOrgCenters = orgCenters;
  _relmapStartLoop();

  // ── Event listeners ──
  _relmapSetupInteraction(svg, container);

  // Context menu items
  const ctxCenter = document.getElementById('rmCtxCenter');
  const ctxDetail = document.getElementById('rmCtxDetail');
  const ctxCompare = document.getElementById('rmCtxCompare');
  if (ctxCenter) ctxCenter.onclick = () => { if (_relmapCtxTarget) _relmapSetCenter(_relmapCtxTarget); _relmapHideCtxMenu(); };
  if (ctxDetail) ctxDetail.onclick = () => { if (_relmapCtxTarget) showFighterPopup(_relmapCtxTarget); _relmapHideCtxMenu(); };
  if (ctxCompare) ctxCompare.onclick = () => { if (_relmapCtxTarget) _relmapHandleCompareClick(_relmapCtxTarget); _relmapHideCtxMenu(); };

  // Popup overlay: ボタンでのみ閉じる（外部クリック無効）

  // Show detail for initial center if set
  if (_relmapCenterId && !isPhoneLayout) _relmapShowDetailForNode(_relmapCenterId);
  if (isPhoneLayout) {
    setTimeout(() => {
      if (document.getElementById('relmapSvg')) _relmapZoomFit();
    }, 80);
  }
}

// ══════════════════════════════════════════════════════════
// Physics tick
// ══════════════════════════════════════════════════════════
function _relmapTick(orgCenters) {
  const W = _relmapW, H = _relmapH;
  const nodes = _relmapNodes, links = _relmapVisibleLinks, vel = _relmapVelocities;
  const a = Math.max(_relmapAlpha.value, _relmapAlpha.min);

  if (_relmapViewMode === 'network' || _relmapOrgFilter) {
    // Cluster gravity (centered when org filtered) + Phase 3c: 団体フィルタ時の派閥重力項
    nodes.forEach((n, i) => {
      if (n._hidden) return;
      let cx, cy, k = 0.008;
      let isFactionMember = false;
      if (_relmapOrgFilter) {
        // 団体絞り込み中: 派閥オーバーレイ ON のときのみ派閥中心へ引力、それ以外は画面中央
        if (_relmapFactionOverlay) {
          const f = (G.factions || []).find(ff => ff.memberIds.includes(n.id));
          const fc = f && _relmapFactionCenters[f.id];
          if (fc) { cx = fc.x; cy = fc.y; k = 0.02; isFactionMember = true; }
          else { cx = W / 2; cy = H / 2; }
        } else {
          cx = W / 2; cy = H / 2;
        }
      } else {
        const c = orgCenters[n.orgId] || { x: W / 2, y: H / 2 };
        cx = c.x; cy = c.y;
      }
      vel[i].vx += (cx - n.x) * k * a;
      vel[i].vy += (cy - n.y) * k * a;
      // Phase 3c: 非派閥メンバーを派閥円から弾く（侵入防止、派閥オーバーレイ ON 時のみ）
      if (_relmapOrgFilter && _relmapFactionOverlay && !isFactionMember) {
        for (const fid in _relmapFactionCenters) {
          const fc2 = _relmapFactionCenters[fid];
          const dx = n.x - fc2.x, dy = n.y - fc2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const keepR = fc2.keepR || 100;
          if (dist < keepR) {
            const push = (keepR - dist) * 0.03 * a / dist;
            vel[i].vx += dx * push;
            vel[i].vy += dy * push;
          }
        }
      }
    });
    // Link attraction
    links.forEach(l => {
      const s = _relmapNodeMap[l.a], t = _relmapNodeMap[l.b];
      if (!s || !t || s._hidden || t._hidden) return;
      const si = s._index, ti = t._index;
      const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const td = 100 + (1 - l.strength) * 150;
      const f = (dist - td) * 0.003 * a;
      const fx = dx / dist * f, fy = dy / dist * f;
      vel[si].vx += fx; vel[si].vy += fy;
      vel[ti].vx -= fx; vel[ti].vy -= fy;
    });
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]._hidden) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j]._hidden) continue;
        const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const md = (nodes[i].r + nodes[j].r + 30) * 3;
        if (dist < md) {
          const rf = (md - dist) * 0.02 * a / dist;
          vel[i].vx -= dx * rf; vel[i].vy -= dy * rf;
          vel[j].vx += dx * rf; vel[j].vy += dy * rf;
        }
      }
    }
  } else {
    // Focus mode: pull toward target positions
    nodes.forEach((n, i) => {
      if (n._hidden) return;
      const ft = _relmapFocusTargets[n.id];
      if (ft) { vel[i].vx += (ft.x - n.x) * 0.05 * a; vel[i].vy += (ft.y - n.y) * 0.05 * a; }
    });
    // Focus keeps the center readable and lets related nodes orbit with springy spacing.
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]._hidden) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j]._hidden) continue;
        const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minD = nodes[i].r + nodes[j].r + (nodes[i].id === _relmapCenterId || nodes[j].id === _relmapCenterId ? 118 : 62);
        if (dist < minD) {
          const rf = (minD - dist) * 0.04 * a / dist;
          vel[i].vx -= dx * rf; vel[i].vy -= dy * rf;
          vel[j].vx += dx * rf; vel[j].vy += dy * rf;
        }
      }
    }
  }

  // Apply velocities
  nodes.forEach((n, i) => {
    if (n._dragging || n._hidden) return;
    vel[i].vx *= 0.65; vel[i].vy *= 0.65;
    n.x += vel[i].vx; n.y += vel[i].vy;
    n.x = Math.max(n.r + 30, Math.min(W - n.r - 30, n.x));
    n.y = Math.max(n.r + 30, Math.min(H - n.r - 30, n.y));
  });
  _relmapAlpha.value -= _relmapAlpha.decay;

  // Render every 2 frames
  _relmapFrameCount++;
  if (_relmapFrameCount % 2 === 0) _relmapRender(orgCenters);
}

function _relmapReheat() {
  if (_relmapViewMode === 'power') {
    _relmapRenderPowerView();
    return;
  }
  _relmapAlpha.value = 0.8;
  _relmapStartLoop();
}

function _relmapStartLoop() {
  if (_relmapAnimId) return; // already running
  _relmapAnimId = requestAnimationFrame(function _loop() {
    _relmapTick(_relmapOrgCenters);
    if (_relmapAlpha.value > _relmapAlpha.min || _relmapDragTarget || _relmapPanning) {
      _relmapAnimId = requestAnimationFrame(_loop);
    } else {
      _relmapRender(_relmapOrgCenters); // final render
      _relmapAnimId = null;
    }
  });
}

// ══════════════════════════════════════════════════════════
// SVG Render (innerHTML bulk update)
// ══════════════════════════════════════════════════════════
function _relmapRender(orgCenters) {
  const nodes = _relmapNodes, links = _relmapVisibleLinks;
  const linkLayer = document.getElementById('relmapLinkLayer');
  const nodeLayer = document.getElementById('relmapNodeLayer');
  const zoneLayer = document.getElementById('relmapZoneLayer');
  if (!linkLayer || !nodeLayer) return;

  // Update viewBox for zoom/pan
  const svg = document.getElementById('relmapSvg');
  if (svg) {
    const vw = _relmapW / _relmapZoom, vh = _relmapH / _relmapZoom;
    svg.setAttribute('viewBox', `${_relmapPanX} ${_relmapPanY} ${vw} ${vh}`);
  }

  const focused = _relmapCenterId;
  const vm = _relmapViewMode;
  const filter = _relmapFilter;

  // ── Links ──
  let lh = '';
  links.forEach(l => {
    const s = _relmapNodeMap[l.a], t = _relmapNodeMap[l.b];
    if (!s || !t || s._hidden || t._hidden) return;
    // Focus mode: only show links to/from center (reduce clutter) — except when org filter shows all intra-org links
    if (!_relmapLinkPassesFilter(l, filter)) return;
    if (vm === 'focus' && focused && s.id !== focused && t.id !== focused) return;
    const dimmed = focused && vm === 'network' && focused !== s.id && focused !== t.id;
    const highlighted = focused && (focused === s.id || focused === t.id);
    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist, uy = dy / dist, px = -uy * 7, py = ux * 7;
    const sp = s.r + 4, ep = t.r + 4;
    const normalBaseOp = filter === 'bond' ? 0.72 : filter === 'rivalry' ? 0.88 : 0.82;
    const minRelOp = filter === 'bond' ? 0.58 : filter === 'rivalry' ? 0.8 : 0.72;
    const baseOp = dimmed ? 0.04 : (highlighted || vm === 'focus' ? 1 : normalBaseOp);
    const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
    const relColor = _relmapRelationshipColor(l);
    const relStroke = _relmapRelationshipStrokeWidth(l, highlighted || vm === 'focus');
    const relOp = dimmed
      ? 0.04
      : Math.max(minRelOp, Math.min(0.98, baseOp * (0.55 + _relmapRelationshipIntensity(l) / 140)));
    if ((filter === 'bond' && _relmapHasVisibleTrust(l)) || (filter === 'rivalry' && _relmapHasVisibleRivalry(l)) || (filter === 'all' && _relmapHasVisibleRelation(l))) {
      lh += `<line class="relationship-line" x1="${(s.x+ux*sp).toFixed(1)}" y1="${(s.y+uy*sp).toFixed(1)}" x2="${(t.x-ux*ep).toFixed(1)}" y2="${(t.y-uy*ep).toFixed(1)}" stroke="${relColor}" stroke-width="${relStroke.toFixed(2)}" opacity="${relOp.toFixed(2)}" stroke-linecap="round"/>`;
    }

    // Bond A→B / B→A (skip when rivalry-only filter)
    if (false && filter !== 'rivalry') {
      [
        { val: l.bondAB, from: s, to: t, off: 1 },
        { val: l.bondBA, from: t, to: s, off: -1 },
      ].filter(it => _relmapTrustVisible(it.val)).forEach(it => {
        const cold = it.val <= 40;
        const color = _relmapTrustColor(it.val);
        const w = Math.min(2.8, 1.15 + Math.abs(it.val - 50) / 28);
        const op = dimmed ? 0.05 : Math.min(0.95, baseOp * (0.42 + Math.abs(it.val - 50) / 72));
        const ox = px * it.off, oy = py * it.off;
        const m = cold ? 'url(#rm-arrow-cold)' : 'url(#rm-arrow-warm)';
        lh += `<line x1="${it.from.x+ux*sp+ox}" y1="${it.from.y+uy*sp+oy}" x2="${it.to.x-ux*ep+ox}" y2="${it.to.y-uy*ep+oy}" stroke="${color}" stroke-width="${w.toFixed(2)}" ${cold?'stroke-dasharray="5,4"':''} opacity="${op.toFixed(2)}" stroke-linecap="round" marker-end="${m}"/>`;
      });
    }

    // Rivalry overlay (skip when bond-only filter)
    if (false && filter !== 'bond') {
      const mr = Math.max(l.rivAB, l.rivBA);
      if (_relmapRivalryVisible(mr)) {
        const rivalryTotal = _relmapRivalryTotal(l);
        const rivalryAvg = rivalryTotal / 2;
        const ro = dimmed ? 0.03 : (highlighted || vm === 'focus' ? 0.78 : 0.4);
        const rivalryStroke = _relmapRivalryStrokeWidth(l, highlighted || vm === 'focus');
        const rivalryColor = _relmapRivalryColor(rivalryAvg);
        if (vm === 'focus') {
          const curve = 26 + Math.min(38, rivalryTotal * 0.18);
          const qx = mx - px * curve / 7, qy = my - py * curve / 7;
          lh += `<path class="rivalry-line" d="M${(s.x+ux*sp-px*0.65).toFixed(1)},${(s.y+uy*sp-py*0.65).toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${(t.x-ux*ep-px*0.65).toFixed(1)},${(t.y-uy*ep-py*0.65).toFixed(1)}" fill="none" stroke="${rivalryColor}" stroke-width="${rivalryStroke.toFixed(2)}" stroke-dasharray="7,5" opacity="${ro.toFixed(2)}" stroke-linecap="round" ${highlighted?'filter="url(#rm-glow-red)"':''}/>`;
        } else {
          lh += `<line class="rivalry-line" x1="${s.x+ux*sp-px*1.45}" y1="${s.y+uy*sp-py*1.45}" x2="${t.x-ux*ep-px*1.45}" y2="${t.y-uy*ep-py*1.45}" stroke="${rivalryColor}" stroke-width="${rivalryStroke.toFixed(2)}" stroke-dasharray="7,5" opacity="${ro.toFixed(2)}" stroke-linecap="round"/>`;
        }
      }
    }
    // Rivalry title badge
    if (l.rivalTitle && !dimmed) {
      const labelY = my - 17;
      const label = `${l.titleEmoji || ''} ${l.rivalTitle}`;
      lh += `<text x="${mx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans JP,sans-serif" font-size="10" font-weight="900" fill="#ffd36a" paint-order="stroke" stroke="rgba(0,0,0,0.82)" stroke-width="2.4" opacity="${highlighted||vm==='focus'?0.98:0.78}">${_escapeHtml(label)}</text>`;
    }
    // bond-rivalry plan 2026-04-29 1-C: 極端ペアの hostile ラベル（rivalTitle が無い時のみ）
    else if (l.hostileLabel && !dimmed) {
      const labelY = my - 17;
      const fillColor = l.hostileLabel === '憎悪' ? '#ff7675' : '#e17055';
      lh += `<text x="${mx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans JP,sans-serif" font-size="9.5" font-weight="900" fill="${fillColor}" paint-order="stroke" stroke="rgba(0,0,0,0.82)" stroke-width="2.4" opacity="${highlighted||vm==='focus'?0.95:0.7}">${l.hostileLabel}</text>`;
      // bond-rivalry plan P-7: 険悪可視化 — 人物系の険悪アイコン（数字は出さない）
      const hostileIcon = l.hostileLabel === '憎悪' ? '😠' : '😤';
      lh += `<text x="${mx.toFixed(1)}" y="${(my + 5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="12" opacity="${highlighted||vm==='focus'?0.92:0.6}">${hostileIcon}</text>`;
    }
    // One-sided icon
    if (l.isOneSided && !dimmed) {
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2 + 12;
      lh += `<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#fdcb6e" opacity="0.8">\u26A1</text>`;
    }
    // Filter-specific value labels
    if (!dimmed && (filter === 'bond' || filter === 'rivalry' || vm === 'focus' || highlighted)) {
      const ox = -uy * 12, oy = ux * 12; // perpendicular offset
      if (filter === 'bond') {
        if (_relmapTrustVisible(l.bondAB)) lh += `<text x="${mx+ox}" y="${my+oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="700" fill="${_relmapTrustColor(l.bondAB)}" paint-order="stroke" stroke="rgba(0,0,0,0.88)" stroke-width="2.5" opacity="${baseOp}">${Math.round(l.bondAB)}</text>`;
        if (_relmapTrustVisible(l.bondBA)) lh += `<text x="${mx-ox}" y="${my-oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="700" fill="${_relmapTrustColor(l.bondBA)}" paint-order="stroke" stroke="rgba(0,0,0,0.88)" stroke-width="2.5" opacity="${baseOp}">${Math.round(l.bondBA)}</text>`;
      } else if (filter === 'rivalry' && !(vm === 'focus' || highlighted)) {
        const maxRiv = Math.max(l.rivAB, l.rivBA);
        if (_relmapRivalryVisible(maxRiv)) {
          const rc = _relmapRivalryColor(_relmapRivalryTotal(l) / 2);
          const dir = _relmapRivalryDirectionText(l, s, t, false);
          if (_relmapRivalryVisible(l.rivAB)) lh += `<text x="${mx+ox}" y="${my+oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="700" fill="${rc}" paint-order="stroke" stroke="rgba(0,0,0,0.88)" stroke-width="2.5" opacity="${baseOp}">${dir.ab}</text>`;
          if (_relmapRivalryVisible(l.rivBA)) lh += `<text x="${mx-ox}" y="${my-oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="700" fill="${rc}" paint-order="stroke" stroke="rgba(0,0,0,0.88)" stroke-width="2.5" opacity="${baseOp}">${dir.ba}</text>`;
        }
      } else if (vm === 'focus' || highlighted) {
        if (_relmapTrustVisible(l.bondAB)) lh += `<text x="${mx+ox}" y="${my+oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="8.5" font-weight="700" fill="${_relmapTrustColor(l.bondAB)}" paint-order="stroke" stroke="rgba(0,0,0,0.88)" stroke-width="2.5" opacity="${baseOp}">相手との関係 ${Math.round(l.bondAB)}→</text>`;
        if (_relmapTrustVisible(l.bondBA)) lh += `<text x="${mx-ox}" y="${my-oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="8.5" font-weight="700" fill="${_relmapTrustColor(l.bondBA)}" paint-order="stroke" stroke="rgba(0,0,0,0.88)" stroke-width="2.5" opacity="${baseOp}">←${Math.round(l.bondBA)}</text>`;
        const maxRiv = Math.max(l.rivAB, l.rivBA);
        if (_relmapRivalryVisible(maxRiv)) {
          const dir = _relmapRivalryDirectionText(l, s, t, true);
          const rc = _relmapRivalryColor(_relmapRivalryTotal(l) / 2);
          const line1 = _relmapRivalryVisible(l.rivAB) ? dir.ab : '';
          const line2 = _relmapRivalryVisible(l.rivBA) ? dir.ba : '';
          const both = line1 && line2;
          if (line1) lh += `<text x="${mx}" y="${my+20}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans JP,sans-serif" font-size="8.2" font-weight="800" fill="${rc}" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="2.6" opacity="${baseOp}">ライバル心 ${line1}${both?' /':''}</text>`;
          if (line2) lh += `<text x="${mx}" y="${my+(both?32:20)}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans JP,sans-serif" font-size="8.2" font-weight="800" fill="${rc}" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="2.6" opacity="${baseOp}">${both?'': 'ライバル心 '}${line2}</text>`;
        }
      }
    }
  });
  linkLayer.innerHTML = lh;

  // ── Nodes ──
  let nh = '';
  nodes.forEach(n => {
    if (n._hidden) return;
    const isConn = focused && vm === 'network' && !!_relmapVisibleNodeConnectedToFocus[n.id];
    const dimmed = focused && vm === 'network' && focused !== n.id && !isConn;
    const isFocused = focused === n.id;
    const op = focused && vm === 'network' ? (dimmed ? 0.1 : 1) : 1;
    const oc = n.color, r = n.r;
    const hasRiv = !!_relmapVisibleNodeHasRivalTitle[n.id];
    const isCmpA = _relmapCompareA === n.id, isCmpB = _relmapCompareB === n.id;
    const nodeR = vm === 'focus' && isFocused ? r * 1.3 : r;
    const pUrl = getPortraitUrl(n.id);

    nh += `<g class="rm-node-group" data-id="${n.id}" opacity="${op}" style="cursor:pointer">`;
    // Compare selection ring
    if (isCmpA || isCmpB) {
      const rc = isCmpA ? '#74b9ff' : '#ff7675';
      nh += `<circle cx="${n.x}" cy="${n.y}" r="${nodeR+8}" fill="none" stroke="${rc}" stroke-width="2.5" stroke-dasharray="5,3"/>`;
      nh += `<text x="${n.x}" y="${n.y-nodeR-12}" text-anchor="middle" font-family="Oswald,sans-serif" font-size="9" font-weight="700" fill="${rc}" paint-order="stroke" stroke="rgba(0,0,0,0.8)" stroke-width="2">${isCmpA?'\u2460 LEFT':'\u2461 RIGHT'}</text>`;
    }
    // Focus glow
    if (isFocused) {
      nh += `<circle cx="${n.x}" cy="${n.y}" r="${nodeR+6}" fill="none" stroke="${oc}" stroke-width="2" opacity="0.3"><animate attributeName="r" values="${nodeR+4};${nodeR+20};${nodeR+4}" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/></circle>`;
    }
    // Rival pulse ring
    if (hasRiv && !dimmed) {
      nh += `<circle cx="${n.x}" cy="${n.y}" r="${nodeR+3}" fill="none" stroke="#e17055" stroke-width="1.5" opacity="0.25"><animate attributeName="opacity" values="0.15;0.35;0.15" dur="3s" repeatCount="indefinite"/></circle>`;
    }
    // Main circle (border ring + face pattern or fallback)
    if (pUrl) {
      nh += `<circle cx="${n.x}" cy="${n.y}" r="${nodeR}" fill="url(#rm-face-${n.id})" stroke="${oc}" stroke-width="${isFocused?3:2}" ${isFocused?'filter="url(#rm-glow-gold)"':''}/>`;
    } else {
      nh += `<circle cx="${n.x}" cy="${n.y}" r="${nodeR}" fill="${isFocused?oc+'33':'rgba(15,15,25,0.9)'}" stroke="${oc}" stroke-width="${isFocused?3:2}" ${isFocused?'filter="url(#rm-glow-gold)"':''}/>`;
      nh += `<text x="${n.x}" y="${n.y+1}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="${nodeR*0.7}" font-weight="600" fill="${oc}" opacity="0.5">${n.ovr}</text>`;
    }
    // OVR badge below face
    const ovrY = n.y + nodeR + 10;
    const ovrW = 22, ovrH = 13;
    nh += `<rect x="${n.x-ovrW/2}" y="${ovrY-ovrH/2}" width="${ovrW}" height="${ovrH}" rx="3" fill="rgba(10,10,20,0.85)" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>`;
    nh += `<text x="${n.x}" y="${ovrY+1}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="700" fill="#fff">${n.ovr}</text>`;
    // Name label
    const nameStr = n.name.length > 5 ? n.name.slice(0, 5) + '\u2026' : n.name;
    nh += `<text x="${n.x}" y="${ovrY+14}" text-anchor="middle" font-family="Noto Sans JP,sans-serif" font-size="${vm==='focus'?11:10}" font-weight="600" fill="${dimmed?'rgba(160,160,180,0.4)':'#e8e8e8'}" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="3">${nameStr}</text>`;
    nh += `</g>`;
  });
  nodeLayer.innerHTML = nh;

  // Zone follow (network only, not when org filtered)
  if (vm === 'network' && !_relmapOrgFilter && zoneLayer) {
    const og = {};
    nodes.forEach(n => { if (n._hidden) return; if (!og[n.orgId]) og[n.orgId] = { sx: 0, sy: 0, c: 0 }; og[n.orgId].sx += n.x; og[n.orgId].sy += n.y; og[n.orgId].c++; });
    zoneLayer.querySelectorAll('.rm-org-zone').forEach(el => {
      const g = og[el.dataset.org]; if (g) { el.setAttribute('cx', g.sx / g.c); el.setAttribute('cy', g.sy / g.c); }
    });
    zoneLayer.querySelectorAll('.rm-zone-label').forEach(t => {
      const oid = t.dataset.org; if (oid && og[oid]) { t.setAttribute('x', og[oid].sx / og[oid].c); t.setAttribute('y', og[oid].sy / og[oid].c); }
    });
  }

  // Faction layer (Phase 2)
  _relmapDrawFactionLayer();
}

// ══════════════════════════════════════════════════════════
// Faction layer — Phase 2 は相関図では派閥を可視化しない。
//   理由: フォースシミュレーションは派閥メンバーを集約しないため、派閥を囲う円は
//         地理的に嘘をつく（非メンバーまで巻き込む巨大な円になる）。かといって
//         円を外した状態で王冠/星マーカーや派閥名ラベルだけ残すと「これは何？」
//         と逆に混乱を呼ぶ。派閥情報は DB 派閥タブと選手ポップアップの派閥バッジで
//         識別可能なので、相関図側は Phase 2 では一旦何も描画しない。
//   Phase 3 で、メンバーをクラスタリングする派閥ビューモード（ネットワーク/フォーカス/
//   勢力図に続く第4モード）を新設してここで描画する予定。
//   関数本体とレイヤー <g> は残す（Phase 3 の差し込み点）。
// ══════════════════════════════════════════════════════════
// Phase 3c: 団体フィルタ時の派閥中心配置（フィルタ団体内の派閥のみ）
// filteredFactions: 団体フィルタに属する派閥配列（idx 順）
// 各派閥中心に { x, y, keepR } を保存: keepR は非派閥メンバーが侵入しない想定半径
function _relmapComputeFactionCenters(filteredFactions) {
  const W = _relmapW, H = _relmapH;
  _relmapFactionCenters = {};
  const list = filteredFactions || [];
  const N = list.length;
  if (N === 0) return;
  const _keepR = (f) => {
    const cnt = (f.memberIds || []).filter(id => _relmapNodeMap[id]).length;
    return 70 + Math.max(0, cnt - 3) * 15;
  };
  if (N === 1) {
    _relmapFactionCenters[list[0].id] = { x: W / 2, y: H / 2, keepR: _keepR(list[0]) };
    return;
  }
  if (N === 2) {
    _relmapFactionCenters[list[0].id] = { x: W * 0.35, y: H / 2, keepR: _keepR(list[0]) };
    _relmapFactionCenters[list[1].id] = { x: W * 0.65, y: H / 2, keepR: _keepR(list[1]) };
    return;
  }
  const R = Math.min(W, H) * (N === 3 ? 0.22 : 0.26);
  const cx = W / 2, cy = H / 2;
  list.forEach((f, i) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i / N);
    _relmapFactionCenters[f.id] = { x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R, keepR: _keepR(f) };
  });
}

// Phase 3c: 団体フィルタ内に属する派閥のリスト（フィルタ団体のメンバーを少なくとも1人含む派閥）
function _relmapGetFilteredFactions() {
  if (!_relmapOrgFilter) return [];
  const factions = G.factions || [];
  if (factions.length === 0) return [];
  // フィルタ団体に所属する選手IDセット
  const orgIds = new Set();
  const addRoster = (arr) => { (arr || []).forEach(c => { if (c && c.id != null) orgIds.add(c.id); }); };
  if (_relmapOrgFilter === 'player') addRoster(G.roster);
  else if (_relmapOrgFilter === 'fa') addRoster(G.freeAgents);
  else {
    // 修正: state のAIロスターは G.aiOrgs(G.rivalOrgs は存在しないフィールドで常に空だった)
    const org = (G.aiOrgs || {})[_relmapOrgFilter];
    if (org) addRoster(org.roster);
  }
  // 孤児派閥フィルタ: 派閥の現存メンバーが誰もいない派閥だけを隠す。
  // 旧実装は「リーダーが現存ロスターにいること」を必須にしていたが、
  // (a) AIロスターを G.rivalOrgs(存在しない)から引いていたため常に空で、AI団体所属リーダーの派閥が全滅する
  // (b) リーダー継承の遷移中など leaderId が一時的に stale なだけで派閥円ごと消える
  // の2点で「派閥円が表示されない」実バグになっていた。メンバー生存で救済する。
  const liveIds = new Set();
  (G.roster || []).forEach(c => { if (c && c.id != null) liveIds.add(c.id); });
  (G.freeAgents || []).forEach(c => { if (c && c.id != null) liveIds.add(c.id); });
  Object.values(G.aiOrgs || {}).forEach(org => {
    (org && org.roster || []).forEach(c => { if (c && c.id != null) liveIds.add(c.id); });
  });
  return factions.filter(f =>
    f.memberIds.some(id => orgIds.has(id)) &&
    (liveIds.has(f.leaderId) || f.memberIds.some(id => liveIds.has(id))));
}

// Phase 3c: 派閥レイヤー描画（団体フィルタ ON 時のみ、フィルタ団体内の派閥を対象）
function _relmapDrawFactionLayer() {
  const layer = document.getElementById('relmapFactionLayer');
  const markerLayer = document.getElementById('relmapFactionMarkerLayer');
  if (!layer) return;
  layer.innerHTML = '';
  if (markerLayer) markerLayer.innerHTML = '';
  if (!_relmapOrgFilter || !_relmapFactionOverlay) return;
  const factions = _relmapGetFilteredFactions();
  if (factions.length === 0) return;
  const filteredFactionIds = new Set(factions.map(f => f.id));

  // OVRマップ（幹部判定用）
  const ovrMap = new Map();
  (G.roster || []).forEach(c => { if (c && c.id != null) ovrMap.set(c.id, Engine.util.ov(c)); });
  (G.freeAgents || []).forEach(c => { if (c && c.id != null) ovrMap.set(c.id, Engine.util.ov(c)); });
  Object.values(G.aiOrgs || {}).forEach(org => {
    (org.roster || []).forEach(c => { if (c && c.id != null) ovrMap.set(c.id, Engine.util.ov(c)); });
  });

  // 派閥ごとの外接円（ただしフィルタ団体所属メンバーのノードからのみ計算=フィルタ外メンバーは無視）
  const circleData = {};
  factions.forEach((f, i) => {
    const memberNodes = f.memberIds
      .map(id => _relmapNodeMap[id])
      .filter(n => n && !n._hidden); // _hidden はフィルタで絞り込み済み
    if (memberNodes.length === 0) return;
    let cx, cy, r;
    if (memberNodes.length === 1) {
      cx = memberNodes[0].x; cy = memberNodes[0].y; r = 48;
    } else {
      cx = memberNodes.reduce((s, n) => s + n.x, 0) / memberNodes.length;
      cy = memberNodes.reduce((s, n) => s + n.y, 0) / memberNodes.length;
      let maxD = 0;
      memberNodes.forEach(n => {
        const d = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2) + n.r;
        if (d > maxD) maxD = d;
      });
      r = maxD + 24;
    }
    const colorIdx = (i % 4) + 1;
    circleData[f.id] = { cx, cy, r, colorIdx, faction: f, memberNodes };
  });

  // 1. 抗争破線（両方の派閥がフィルタ内に存在する場合のみ描画）
  const host = G.factionHostility || {};
  const drawnPairs = new Set();
  factions.forEach(A => {
    if (!Engine.factions._isHostile(A)) return;
    factions.forEach(B => {
      if (A.id >= B.id) return;
      if (!filteredFactionIds.has(B.id)) return;
      if (!Engine.factions._isHostile(B)) return;
      const pairKey = `${A.id}|${B.id}`;
      if (drawnPairs.has(pairKey)) return;
      const hAB = host[`${A.id}>${B.id}`] || 0;
      const hBA = host[`${B.id}>${A.id}`] || 0;
      if (hAB + hBA <= 0) return;
      const cA = circleData[A.id], cB = circleData[B.id];
      if (!cA || !cB) return;
      drawnPairs.add(pairKey);
      const sum = Math.min(200, hAB + hBA);
      const sw = 1.5 + (sum / 200) * 2; // 1.5〜3.5
      layer.innerHTML += `<line x1="${cA.cx.toFixed(1)}" y1="${cA.cy.toFixed(1)}" x2="${cB.cx.toFixed(1)}" y2="${cB.cy.toFixed(1)}" stroke="var(--accent-faction-feud)" stroke-width="${sw.toFixed(2)}" stroke-dasharray="6,4" opacity="0.7"/>`;
    });
  });

  // 2. 派閥円＋ラベル
  Object.values(circleData).forEach(cd => {
    const colorVar = `var(--accent-faction-${cd.colorIdx})`;
    layer.innerHTML += `<circle cx="${cd.cx.toFixed(1)}" cy="${cd.cy.toFixed(1)}" r="${cd.r.toFixed(1)}" fill="none" stroke="${colorVar}" stroke-width="2.5" stroke-opacity="0.55"/>`;
    const labelY = cd.cy - cd.r - 12;
    const name = (cd.faction.name || '').replace(/</g, '&lt;');
    layer.innerHTML += `<text x="${cd.cx.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-family="Oswald,sans-serif" font-size="16" font-weight="700" fill="${colorVar}" opacity="0.85">${name}</text>`;
  });

  // 3. リーダー 👑 / 幹部 ⭐ マーカー（ノードより上=markerLayer に描画）
  const mTarget = markerLayer || layer;
  factions.forEach(f => {
    const leaderNode = _relmapNodeMap[f.leaderId];
    if (leaderNode && !leaderNode._hidden) {
      const lx = leaderNode.x + leaderNode.r * 0.7;
      const ly = leaderNode.y - leaderNode.r * 0.7;
      mTarget.innerHTML += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="18" text-anchor="middle" dominant-baseline="central" style="pointer-events:none">👑</text>`;
    }
    // 幹部: リーダー除く OVR 上位 2 名
    const execs = f.memberIds
      .filter(id => id !== f.leaderId)
      .sort((a, b) => (ovrMap.get(b) || 0) - (ovrMap.get(a) || 0))
      .slice(0, 2);
    execs.forEach(id => {
      const n = _relmapNodeMap[id];
      if (!n || n._hidden) return;
      const ex = n.x + n.r * 0.7;
      const ey = n.y - n.r * 0.7;
      mTarget.innerHTML += `<text x="${ex.toFixed(1)}" y="${ey.toFixed(1)}" font-size="15" text-anchor="middle" dominant-baseline="central" style="pointer-events:none">⭐</text>`;
    });
  });
}

// ══════════════════════════════════════════════════════════
// Org zone backgrounds
// ══════════════════════════════════════════════════════════
function _relmapDrawOrgZones(orgCenters) {
  const zoneLayer = document.getElementById('relmapZoneLayer');
  if (!zoneLayer) return;
  zoneLayer.innerHTML = '';
  if (_relmapViewMode === 'focus' || _relmapOrgFilter) return;
  Object.entries(orgCenters).forEach(([orgId, center]) => {
    const orgName = _relmapGetOrgNameById(orgId);
    const color = _RELMAP_ORG_COLORS[orgId] || '#888';
    zoneLayer.innerHTML += `<circle class="rm-org-zone" data-org="${orgId}" cx="${center.x}" cy="${center.y}" r="180" fill="url(#rm-zone-${orgId})"/>`;
    zoneLayer.innerHTML += `<text class="rm-zone-label" data-org="${orgId}" x="${center.x}" y="${center.y}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="36" font-weight="700" letter-spacing="6" fill="${color}" opacity="0.07">${orgName}</text>`;
  });
}

function _relmapGetOrgNameById(orgId) {
  if (orgId === 'player') return G.orgName || 'プレイヤー団体';
  if (orgId === 'fa') return 'フリー';
  const org = RIVAL_ORGS.find(o => o.id === orgId);
  return org ? (G.rivalOrgNames?.[orgId] || org.name) : orgId;
}

// ══════════════════════════════════════════════════════════
// Visibility control
// ══════════════════════════════════════════════════════════
function _relmapPlaceFocusTargets(centerId, otherIds) {
  const cx = _relmapW / 2, cy = _relmapH / 2;
  const ids = otherIds || [];
  const baseR = Math.min(_relmapW, _relmapH) * (ids.length <= 6 ? 0.34 : 0.38);
  _relmapFocusTargets = {};
  if (centerId) _relmapFocusTargets[centerId] = { x: cx, y: cy };
  ids.forEach((id, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i / Math.max(1, ids.length));
    const wobble = ids.length > 7 ? (i % 2 === 0 ? 0.96 : 1.08) : 1;
    const r = baseR * wobble;
    _relmapFocusTargets[id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
}

function _relmapFocusLimit() {
  return window.matchMedia?.('(max-width: 700px)').matches ? 7 : _RELMAP_FOCUS_MAX_CONN;
}

function _relmapUpdateVisibility() {
  const nodes = _relmapNodes;
  const links = _relmapLinks;
  let candidateLinks = links;

  if (_relmapOrgFilter) {
    const visibleNodeIds = new Set();
    nodes.forEach(n => {
      const show = n.orgId === _relmapOrgFilter;
      n._hidden = !show;
      if (show) visibleNodeIds.add(n.id);
    });
    candidateLinks = links.filter(l =>
      visibleNodeIds.has(l.a) && visibleNodeIds.has(l.b) && _relmapLinkPassesDisplayControls(l, _relmapFilter)
    );

    if (_relmapViewMode === 'focus' && _relmapCenterId && visibleNodeIds.has(_relmapCenterId)) {
      const fl = _relmapGetLinksFor(_relmapCenterId)
        .filter(l => visibleNodeIds.has(l.a) && visibleNodeIds.has(l.b) && _relmapLinkPassesDisplayControls(l, _relmapFilter));
      const shownIds = new Set([_relmapCenterId]);
      fl.slice(0, _relmapFocusLimit()).forEach(l => shownIds.add(l.a === _relmapCenterId ? l.b : l.a));
      nodes.forEach(n => { if (visibleNodeIds.has(n.id)) n._hidden = !shownIds.has(n.id); });
      _relmapPlaceFocusTargets(_relmapCenterId, [...shownIds].filter(id => id !== _relmapCenterId));
      candidateLinks = fl.filter(l => shownIds.has(l.a) && shownIds.has(l.b));
    }

    _relmapVisibleLinks = _relmapSelectRenderableLinks(candidateLinks, _RELMAP_FILTERED_LINK_BUDGET, _RELMAP_NETWORK_LINKS_PER_NODE + 1, _relmapCenterId);
    _relmapRebuildVisibleLinkState();
    return;
  }

  if (_relmapViewMode === 'focus' && _relmapCenterId) {
    const fl = _relmapGetLinksFor(_relmapCenterId)
      .filter(l => _relmapLinkPassesDisplayControls(l, _relmapFilter));

    const intensityLinks = fl.map(l => {
      const oid = l.a === _relmapCenterId ? l.b : l.a;
      const bondAB = l.a === _relmapCenterId ? l.bondAB : l.bondBA;
      const bondBA = l.a === _relmapCenterId ? l.bondBA : l.bondAB;
      const rivAB = l.a === _relmapCenterId ? l.rivAB : l.rivBA;
      const rivBA = l.a === _relmapCenterId ? l.rivBA : l.rivAB;
      const bondDev = (Math.abs(bondAB - 50) + Math.abs(bondBA - 50)) / 2;
      const rivalryMax = Math.max(rivAB, rivBA);
      const intensity = Math.max(bondDev * 1.2, rivalryMax, bondDev + rivalryMax * 0.6);
      return { oid, intensity, l };
    }).sort((a, b) => b.intensity - a.intensity);

    const focusLimit = _relmapFocusLimit();
    const shown = intensityLinks.slice(0, focusLimit);
    const shownIds = new Set(shown.map(il => il.oid));
    shownIds.add(_relmapCenterId);
    // New saves can have very few relationship records. Fill empty places
    // with same-organization wrestlers first so the phone graph is not blank.
    if (window.matchMedia?.('(max-width: 700px)').matches && shownIds.size < focusLimit + 1) {
      const centerNode = _relmapNodeMap[_relmapCenterId];
      const fillers = nodes
        .filter(n => n.id !== _relmapCenterId && !shownIds.has(n.id))
        .sort((a, b) => {
          const aSame = a.orgId === centerNode?.orgId ? 1 : 0;
          const bSame = b.orgId === centerNode?.orgId ? 1 : 0;
          return bSame - aSame || b.ovr - a.ovr;
        });
      for (const n of fillers) {
        if (shownIds.size >= focusLimit + 1) break;
        shownIds.add(n.id);
      }
    }
    nodes.forEach(n => { n._hidden = !shownIds.has(n.id); });

    _relmapPlaceFocusTargets(_relmapCenterId, [...shownIds].filter(id => id !== _relmapCenterId));

    _relmapVisibleLinks = shown.map(il => il.l);
    _relmapRebuildVisibleLinkState();
    return;
  }

  if (_relmapViewMode === 'focus' && !_relmapCenterId) {
    nodes.forEach(n => { n._hidden = true; });
    _relmapVisibleLinks = [];
    _relmapFocusTargets = {};
    _relmapRebuildVisibleLinkState();
    return;
  }

  if (_relmapFilter === 'rivalry') {
    const visibleNodeIds = new Set();
    candidateLinks = links.filter(l => _relmapLinkPassesDisplayControls(l, _relmapFilter));
    candidateLinks.forEach(l => { visibleNodeIds.add(l.a); visibleNodeIds.add(l.b); });
    nodes.forEach(n => { n._hidden = !visibleNodeIds.has(n.id); });
  } else if (_relmapFilter === 'bond') {
    const visibleNodeIds = new Set();
    candidateLinks = links.filter(l => _relmapLinkPassesDisplayControls(l, _relmapFilter));
    candidateLinks.forEach(l => { visibleNodeIds.add(l.a); visibleNodeIds.add(l.b); });
    nodes.forEach(n => { n._hidden = !visibleNodeIds.has(n.id); });
  } else if (_relmapFilterRelOnly) {
    const visibleNodeIds = new Set();
    candidateLinks = links.filter(l => _relmapHasVisibleRelation(l) && _relmapRelationshipPassesThreshold(l));
    candidateLinks.forEach(l => { visibleNodeIds.add(l.a); visibleNodeIds.add(l.b); });
    // 旗揚げ直後など関係リンクがまだ無い時も、空画面にはせず選手を表示する。
    nodes.forEach(n => { n._hidden = candidateLinks.length > 0 && !visibleNodeIds.has(n.id); });
  } else {
    nodes.forEach(n => { n._hidden = false; });
    candidateLinks = links.filter(l => _relmapLinkPassesDisplayControls(l, _relmapFilter));
  }

  candidateLinks = candidateLinks.filter(l => !(_relmapNodeMap[l.a]?._hidden) && !(_relmapNodeMap[l.b]?._hidden));
  const budget = _relmapFilter === 'all' ? _RELMAP_NETWORK_LINK_BUDGET : _RELMAP_FILTERED_LINK_BUDGET;
  const maxPerNode = _relmapFilter === 'all' ? _RELMAP_NETWORK_LINKS_PER_NODE : _RELMAP_NETWORK_LINKS_PER_NODE + 2;
  _relmapVisibleLinks = _relmapSelectRenderableLinks(candidateLinks, budget, maxPerNode, _relmapCenterId);

  if (_relmapFilter === 'all' && !_relmapFilterRelOnly) {
    const shownIds = new Set();
    _relmapVisibleLinks.forEach(l => { shownIds.add(l.a); shownIds.add(l.b); });
    nodes.forEach(n => { n._hidden = !shownIds.has(n.id); });
  }

  _relmapRebuildVisibleLinkState();
}

function _relmapRenderSidebar(orgCenters) {
  const sb = document.getElementById('rmSidebar');
  if (!sb) return;
  let h = '';
  // 勢力図モードで団体フィルタ中: 全体に戻るボタン
  if (_relmapViewMode === 'power' && _relmapOrgFilter) {
    h += `<div class="rm-sb-btn rm-sb-back" onclick="_relmapFocusOrg('${_relmapOrgFilter}')" style="border:1px solid rgba(212,168,67,0.5);color:#d4a843;font-weight:bold;margin-bottom:8px">\u2190 全体に戻る</div>`;
  }
  // Reset button
  h += `<div class="rm-sb-btn" onclick="_relmapResetAll()">\uD83D\uDD04 全体を表示</div>`;
  // Display filter panel
  h += `<div class="rm-filter-panel">`;
  h += `<div class="rm-fp-title">📊 表示フィルタ</div>`;
  h += `<div class="rm-fp-row"><label><input type="checkbox" id="rmChkRelOnlyNew" ${_relmapFilterRelOnly?'checked':''} onchange="_relmapFilterRelOnly=this.checked;_relmapFilterUserSet=true;_relmapUpdateVisibility();_relmapReheat()"> 関係ありのみ</label></div>`;
  h += `<div class="rm-fp-row" style="gap:8px"><span style="font-size:10px;white-space:nowrap">表示強度</span><input type="range" min="0" max="100" step="5" value="${_relmapFilterThreshold}" oninput="_relmapFilterThreshold=parseInt(this.value);_relmapFilterUserSet=true;document.getElementById('rmThreshVal').textContent=this.value;document.getElementById('rmThreshLabel').textContent=_relmapFilterThresholdLabel(this.value);_relmapUpdateVisibility();_relmapReheat()"><span class="rm-fp-val" id="rmThreshVal">${_relmapFilterThreshold}</span></div>`;
  h += `<div class="rm-fp-row" style="justify-content:space-between;font-size:9px;color:var(--text-dim);margin-top:-4px"><span>細かく</span><span id="rmThreshLabel" style="color:var(--gold);font-weight:700">${_relmapFilterThresholdLabel(_relmapFilterThreshold)}</span><span>強力のみ</span></div>`;
  h += `</div>`;
  // Org cards
  const orgOrder = ['player', 'org_s', 'org_a', 'org_b', 'fa'];
  orgOrder.forEach(orgId => {
    const color = _RELMAP_ORG_COLORS[orgId] || '#888';
    const orgName = _relmapGetOrgNameById(orgId);
    const emoji = _relmapGetOrgEmoji(orgId);
    const oc = _relmapNodes.filter(n => n.orgId === orgId);
    if (!oc.length) return;
    const avg = Math.round(oc.reduce((s, n) => s + n.ovr, 0) / oc.length);
    const topChars = [...oc].sort((a, b) => b.ovr - a.ovr).slice(0, 6);
    h += `<div class="rm-org-card${_relmapOrgFilter===orgId?' rm-org-active':''}" style="border-left-color:${color}" onclick="_relmapFocusOrg('${orgId}')">`;
    h += `<div class="rm-org-card-name" style="color:${color}">${emoji} ${orgName}</div>`;
    h += `<div class="rm-org-card-stats">所属 ${oc.length}名 \u2500 平均OVR ${avg}</div>`;
    h += `<div class="rm-org-card-roster">`;
    topChars.forEach(n => {
      const pUrl = getPortraitUrl(n.id);
      h += `<div class="rm-org-card-face" style="border-color:${color}">${pUrl ? `<img src="${pUrl}" onerror="this.parentElement.textContent='\uD83D\uDC64'">` : '\uD83D\uDC64'}</div>`;
    });
    if (oc.length > 6) h += `<div class="rm-org-card-face" style="border-color:${color};font-size:8px;color:var(--text-dim)">+${oc.length - 6}</div>`;
    h += `</div></div>`;
  });
  sb.innerHTML = h;
}

// ══════════════════════════════════════════════════════════
// Interaction (drag, click, context menu, tooltip)
// ══════════════════════════════════════════════════════════
function _relmapSetupInteraction(svg, container) {
  let touchStartNodeId = null;
  let suppressTouchClick = false;

  function svgCoords(e) {
    const r = svg.getBoundingClientRect();
    const vw = _relmapW / _relmapZoom, vh = _relmapH / _relmapZoom;
    return { x: _relmapPanX + (e.clientX - r.left) / r.width * vw, y: _relmapPanY + (e.clientY - r.top) / r.height * vh };
  }

  svg.addEventListener('mousedown', e => {
    const g = e.target.closest('.rm-node-group');
    if (g) {
      const id = parseInt(g.dataset.id), n = _relmapNodeMap[id];
      if (!n) return;
      _relmapDragTarget = n; n._dragging = true; _relmapDragMoved = false;
      const p = svgCoords(e);
      const displayPos = _relmapGetDisplayPos(n);
      _relmapDragOffset.x = p.x - displayPos.x; _relmapDragOffset.y = p.y - displayPos.y;
    } else {
      // Empty space drag → pan
      _relmapPanning = true; _relmapDragMoved = false;
      _relmapPanStart = { x: e.clientX, y: e.clientY };
      _relmapPanStartPan = { x: _relmapPanX, y: _relmapPanY };
    }
  });

  svg.addEventListener('mousemove', e => {
    if (_relmapDragTarget) {
      _relmapDragMoved = true;
      const p = svgCoords(e);
      const nextX = p.x - _relmapDragOffset.x;
      const nextY = p.y - _relmapDragOffset.y;
      if (_relmapViewMode === 'power') {
        const key = _relmapPowerLayoutKey();
        _relmapSetPowerPos(_relmapDragTarget, key, nextX, nextY);
        _relmapRenderPowerView();
      } else {
        _relmapDragTarget.x = nextX;
        _relmapDragTarget.y = nextY;
        if (_relmapViewMode === 'focus' && _relmapFocusTargets[_relmapDragTarget.id]) {
          _relmapFocusTargets[_relmapDragTarget.id] = { x: nextX, y: nextY };
        }
        _relmapReheat();
      }
    } else if (_relmapPanning) {
      const r = svg.getBoundingClientRect();
      const vw = _relmapW / _relmapZoom, vh = _relmapH / _relmapZoom;
      const dx = (e.clientX - _relmapPanStart.x) / r.width * vw;
      const dy = (e.clientY - _relmapPanStart.y) / r.height * vh;
      _relmapPanX = _relmapPanStartPan.x - dx;
      _relmapPanY = _relmapPanStartPan.y - dy;
      _relmapDragMoved = true;
      if (_relmapViewMode === 'power') _relmapApplyViewport(svg);
      else _relmapReheat();
    }
    const g = e.target.closest('.rm-node-group');
    const tt = document.getElementById('relmapTooltip');
    if (g && !_relmapDragTarget && !_relmapPanning && tt) {
      const id = parseInt(g.dataset.id), n = _relmapNodeMap[id];
      if (!n) return;
      const cl = _relmapGetLinksFor(id), rv = cl.filter(l => l.rivalTitle);
      const orgName = _relmapGetOrgNameById(n.orgId);
      const emoji = _relmapGetOrgEmoji(n.orgId);
      const rivalRows = cl
        .filter(l => _relmapHasVisibleRivalry(l))
        .sort((a, b) => _relmapRivalryTotal(b) - _relmapRivalryTotal(a))
        .slice(0, 3)
        .map(l => {
          const otherId = l.a === id ? l.b : l.a;
          const other = _relmapNodeMap[otherId];
          const selfToOther = Math.round(l.a === id ? l.rivAB : l.rivBA);
          const otherToSelf = Math.round(l.a === id ? l.rivBA : l.rivAB);
          const selfName = _escapeHtml(n.name);
          const otherName = _escapeHtml(other?.name || '');
          return `<div style="font-size:9px;color:#ffb08a;line-height:1.35">${selfName}→${otherName} ${selfToOther} / ${otherName}→${selfName} ${otherToSelf}</div>`;
        }).join('');
      tt.innerHTML = `<div style="font-weight:700;margin-bottom:3px">${_escapeHtml(n.name)}</div><div style="color:${n.color};font-size:10px;margin-bottom:3px">${emoji} ${_escapeHtml(orgName)}</div><div style="font-family:Oswald;font-size:13px;color:var(--gold)">OVR ${n.ovr} <span style="font-size:10px;color:var(--text-dim);margin-left:4px">${_escapeHtml(n.style)}</span></div><div style="font-size:9px;color:var(--text-dim);margin-top:3px">関係 ${cl.length}件${rv.length?` / ライバル ${rv.length}件`:''}</div>${rivalRows ? `<div style="margin-top:5px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.12)">${rivalRows}</div>` : ''}`;
      tt.classList.add('show'); tt.style.left = (e.clientX + 16) + 'px'; tt.style.top = (e.clientY - 10) + 'px';
    } else if (tt && !_relmapDragTarget) { tt.classList.remove('show'); }
  });

  svg.addEventListener('mouseup', () => {
    if (_relmapDragTarget) { _relmapDragTarget._dragging = false; _relmapDragTarget = null; }
    _relmapPanning = false;
  });

  // Touch/pen support: drag nodes or pan the canvas without relying on mouse events.
  svg.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    e.preventDefault();
    if (typeof svg.setPointerCapture === 'function') {
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    }
    const g = e.target.closest('.rm-node-group');
    if (g) {
      const id = parseInt(g.dataset.id), n = _relmapNodeMap[id];
      if (!n) return;
      touchStartNodeId = id;
      _relmapDragTarget = n;
      n._dragging = true;
      _relmapDragMoved = false;
      const p = svgCoords(e);
      const displayPos = _relmapGetDisplayPos(n);
      _relmapDragOffset.x = p.x - displayPos.x;
      _relmapDragOffset.y = p.y - displayPos.y;
    } else {
      touchStartNodeId = null;
      _relmapPanning = true;
      _relmapDragMoved = false;
      _relmapPanStart = { x: e.clientX, y: e.clientY };
      _relmapPanStartPan = { x: _relmapPanX, y: _relmapPanY };
    }
  });

  svg.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || !e.isPrimary || (!_relmapDragTarget && !_relmapPanning)) return;
    e.preventDefault();
    if (_relmapDragTarget) {
      _relmapDragMoved = true;
      const p = svgCoords(e);
      const nextX = p.x - _relmapDragOffset.x;
      const nextY = p.y - _relmapDragOffset.y;
      if (_relmapViewMode === 'power') {
        const key = _relmapPowerLayoutKey();
        _relmapSetPowerPos(_relmapDragTarget, key, nextX, nextY);
        _relmapRenderPowerView();
      } else {
        _relmapDragTarget.x = nextX;
        _relmapDragTarget.y = nextY;
        if (_relmapViewMode === 'focus' && _relmapFocusTargets[_relmapDragTarget.id]) {
          _relmapFocusTargets[_relmapDragTarget.id] = { x: nextX, y: nextY };
        }
        _relmapReheat();
      }
    } else {
      const r = svg.getBoundingClientRect();
      const vw = _relmapW / _relmapZoom, vh = _relmapH / _relmapZoom;
      const dx = (e.clientX - _relmapPanStart.x) / r.width * vw;
      const dy = (e.clientY - _relmapPanStart.y) / r.height * vh;
      _relmapPanX = _relmapPanStartPan.x - dx;
      _relmapPanY = _relmapPanStartPan.y - dy;
      _relmapDragMoved = true;
      if (_relmapViewMode === 'power') _relmapApplyViewport(svg);
      else _relmapReheat();
    }
  });

  const finishPointer = (e, cancelled = false) => {
    if (e.pointerType === 'mouse') return;
    const wasMoved = _relmapDragMoved;
    const tappedNodeId = touchStartNodeId;
    if (_relmapDragTarget) {
      _relmapDragTarget._dragging = false;
      _relmapDragTarget = null;
    }
    _relmapPanning = false;
    touchStartNodeId = null;
    if (typeof svg.releasePointerCapture === 'function') {
      try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    if (!wasMoved && !cancelled) {
      if (tappedNodeId != null) {
        if (_relmapViewMode === 'power') showFighterPopup(tappedNodeId);
        else _relmapSetCenter(tappedNodeId);
      } else if (_relmapViewMode === 'network') {
        _relmapClearCenter();
      }
      suppressTouchClick = true;
    }
  };
  svg.addEventListener('pointerup', finishPointer);
  svg.addEventListener('pointercancel', e => finishPointer(e, true));

  // Click: close compare popup + set center (or open popup in power mode)
  svg.addEventListener('click', e => {
    if (suppressTouchClick) { suppressTouchClick = false; return; }
    if (_relmapDragMoved) { _relmapDragMoved = false; return; }
    _relmapHideCtxMenu();
    // Close compare popup if open
    const popOver = document.getElementById('relmapPopupOverlay');
    if (popOver && popOver.classList.contains('show')) { _relmapClosePopup(); return; }
    const g = e.target.closest('.rm-node-group');
    if (g) {
      const id = parseInt(g.dataset.id);
      if (_relmapViewMode === 'power') {
        showFighterPopup(id);
      } else {
        _relmapSetCenter(id);
      }
    }
    else { if (_relmapViewMode === 'network') _relmapClearCenter(); }
  });

  svg.addEventListener('contextmenu', e => {
    e.preventDefault();
    const g = e.target.closest('.rm-node-group');
    if (!g) { _relmapHideCtxMenu(); return; }
    _relmapCtxTarget = parseInt(g.dataset.id);
    const cm = document.getElementById('relmapCtxMenu');
    if (cm) { cm.style.left = e.clientX + 'px'; cm.style.top = e.clientY + 'px'; cm.classList.add('show'); }
  });

  // Wheel zoom
  container.addEventListener('wheel', e => {
    e.preventDefault();
    const p = svgCoords(e);
    const oldZoom = _relmapZoom;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    _relmapZoom = Math.max(0.3, Math.min(5, _relmapZoom * factor));
    // Zoom toward mouse cursor position
    _relmapPanX = p.x - (p.x - _relmapPanX) * (oldZoom / _relmapZoom);
    _relmapPanY = p.y - (p.y - _relmapPanY) * (oldZoom / _relmapZoom);
    if (_relmapViewMode === 'power') _relmapApplyViewport(svg);
    else _relmapReheat();
  }, { passive: false });

  // Global close
  document.addEventListener('click', e => { if (!e.target.closest('.rm-ctx-menu')) _relmapHideCtxMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { _relmapClosePopup(); _relmapHideCtxMenu(); } });
}

function _relmapHideCtxMenu() {
  const cm = document.getElementById('relmapCtxMenu');
  if (cm) cm.classList.remove('show');
}

// ══════════════════════════════════════════════════════════
// View mode / center / filter controls
// ══════════════════════════════════════════════════════════

// 決定論的ジッター用Knuth乗算ハッシュ（同一IDで常に同じ0.0~1.0を返す）
function _relmapIdHash(id) {
  let h = ((id * 2654435761) >>> 0);
  return (h & 0xffff) / 0xffff;
}

function _relmapApplyViewport(svg) {
  if (!svg) return;
  const vw = _relmapW / _relmapZoom;
  const vh = _relmapH / _relmapZoom;
  svg.setAttribute('viewBox', `${_relmapPanX} ${_relmapPanY} ${vw} ${vh}`);
}

function _relmapPowerLayoutKey() {
  const base = _relmapOrgFilter && _relmapOrgFilter !== 'fa' ? _relmapOrgFilter : '__overview__';
  return `${base}:elastic-pyramid-v2`;
}

function _relmapGetPowerPos(node, key, fallbackX, fallbackY) {
  if (!node) return { x: fallbackX, y: fallbackY };
  if (key === '__overview__') {
    return {
      x: Number.isFinite(node._powerOverviewX) ? node._powerOverviewX : fallbackX,
      y: Number.isFinite(node._powerOverviewY) ? node._powerOverviewY : fallbackY,
    };
  }
  const saved = node._powerOrgPositions && node._powerOrgPositions[key];
  return {
    x: saved && Number.isFinite(saved.x) ? saved.x : fallbackX,
    y: saved && Number.isFinite(saved.y) ? saved.y : fallbackY,
  };
}

function _relmapSetPowerPos(node, key, x, y) {
  if (!node) return;
  if (key === '__overview__') {
    node._powerOverviewX = x;
    node._powerOverviewY = y;
    return;
  }
  if (!node._powerOrgPositions) node._powerOrgPositions = {};
  node._powerOrgPositions[key] = { x, y };
}

function _relmapGetDisplayPos(node) {
  if (!node) return { x: 0, y: 0 };
  if (_relmapViewMode !== 'power') return { x: node.x, y: node.y };
  const key = _relmapPowerLayoutKey();
  return _relmapGetPowerPos(node, key, node.x, node.y);
}

function _relmapRenderPowerView() {
  if (_relmapViewMode !== 'power') return;
  const svg = document.getElementById('relmapSvg');
  if (!svg) return;
  _drawRelmapPowerView(svg);
  _relmapApplyViewport(svg);
}

function _relmapDedupPowerRoster(roster, takenIds) {
  const seen = new Set();
  const unique = [];
  (roster || []).forEach(f => {
    if (!f || !Number.isFinite(f.id)) return;
    if (seen.has(f.id)) return;
    if (takenIds && takenIds.has(f.id)) return;
    seen.add(f.id);
    if (takenIds) takenIds.add(f.id);
    unique.push(f);
  });
  return unique;
}

function _relmapPowerNodeRadius(ovr) {
  if (ovr <= 55) return 23;
  return Math.min(41, 23 + (ovr - 55) * 0.56);
}

function _relmapPowerOvrBadgeStyle(ovr) {
  if (ovr >= 85) return { fill: '#d6a23a', stroke: 'rgba(255,230,176,0.5)', text: '#16110a' };
  if (ovr >= 78) return { fill: '#d46a4c', stroke: 'rgba(255,202,188,0.42)', text: '#fff7f2' };
  if (ovr >= 70) return { fill: '#8c5bd6', stroke: 'rgba(225,205,255,0.4)', text: '#f8f2ff' };
  if (ovr >= 60) return { fill: '#5677d8', stroke: 'rgba(203,218,255,0.38)', text: '#f6f9ff' };
  return { fill: '#59616d', stroke: 'rgba(232,238,247,0.28)', text: '#f5f7fa' };
}

function _relmapPowerPopularityValue(fighter) {
  const raw = (typeof Engine !== 'undefined' && Engine.util && typeof Engine.util.dispPop === 'function')
    ? Engine.util.dispPop(fighter && fighter.popularity || 0)
    : Math.round((fighter && fighter.popularity) || 0);
  const num = Number(raw);
  return Number.isFinite(num) ? num : Math.round((fighter && fighter.popularity) || 0);
}

function _relmapPowerStatusScore(fighter, championId) {
  const ovr = Engine.util.ov(fighter);
  const pop = _relmapPowerPopularityValue(fighter);
  const champBoost = championId && fighter.id === championId ? 7 : 0;
  return ovr + pop * 0.10 + champBoost;
}

function _relmapBuildElasticPyramidSlots(items, opts) {
  const list = items || [];
  if (!list.length) return [];
  const scores = list.map(item => item.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = Math.max(1, maxScore - minScore);
  const rows = [];
  let rest = list.length;
  [1, 2, 3].forEach(count => {
    if (rest <= 0) return;
    const take = Math.min(count, rest);
    rows.push(take);
    rest -= take;
  });
  while (rest > 0) {
    const take = Math.min(6, rest);
    rows.push(take);
    rest -= take;
  }
  const cx = opts.cx;
  const top = opts.top;
  const bottom = opts.bottom;
  const maxWidth = opts.maxWidth;
  const h = Math.max(1, bottom - top);
  const slots = [];
  rows.forEach((cols, rowIndex) => {
    const rowNorm = rows.length <= 1 ? 0 : rowIndex / (rows.length - 1);
    const rowY = top + rowNorm * h;
    const rowDensity = cols <= 2 ? 0.58 : cols === 3 ? 0.76 : 1;
    const rowWidth = cols <= 1 ? 0 : maxWidth * Math.min(1, 0.24 + rowNorm * 0.76) * rowDensity;
    for (let col = 0; col < cols; col++) {
      const colNorm = cols <= 1 ? 0 : (col / (cols - 1)) * 2 - 1;
      slots.push({ x: cx + colNorm * rowWidth * 0.5, y: rowY });
    }
  });
  return list.map((item, i) => {
    const slot = slots[i] || slots[slots.length - 1];
    const scoreNorm = (item.score - minScore) / range;
    const scoreY = top + (1 - scoreNorm) * h;
    const hash = _relmapIdHash(item.id * 97 + i * 17);
    return {
      x: slot.x + (hash - 0.5) * (opts.jitterX || 0),
      y: slot.y * 0.58 + scoreY * 0.42,
    };
  });
}

function _relmapPowerCompactFrame(count, opts) {
  const topLimit = opts.topLimit;
  const bottomLimit = opts.bottomLimit;
  const spanLimit = Math.max(120, bottomLimit - topLimit);
  const rowCount = count <= 1 ? 1
    : count <= 3 ? 2
      : count <= 6 ? 3
        : count <= 10 ? 4
          : Math.ceil((count + 2) / 4);
  const idealGap = count <= 4 ? 112 : count <= 8 ? 102 : count <= 12 ? 92 : 84;
  const idealSpan = Math.max(120, (rowCount - 1) * idealGap);
  // fillVertical: 利用可能な縦スペース全体を使う（単体団体ビュー用）
  // 通常モードは idealSpan で抑える（4団体並列時のクラスタ間距離確保のため）
  const span = opts.fillVertical
    ? Math.max(idealSpan, spanLimit)
    : Math.min(spanLimit, idealSpan);
  const top = topLimit;
  const bottom = top + span;
  const widthScale = count <= 3 ? 0.42 : count <= 6 ? 0.58 : count <= 8 ? 0.66 : count <= 12 ? 0.78 : 0.9;
  return {
    top,
    bottom,
    maxWidth: opts.maxWidth * widthScale,
    jitterX: Math.min(opts.jitterX || 0, opts.maxWidth * 0.025),
  };
}

function _relmapRelaxPowerNodes(nodes, bounds, passes) {
  for (let pass = 0; pass < (passes || 8); pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = a.r + b.r + (bounds.pad || 18);
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          a.x -= nx * push * 0.86; a.y -= ny * push * 0.38;
          b.x += nx * push * 0.86; b.y += ny * push * 0.38;
        }
      }
      const nd = nodes[i];
      const spring = nd.isAce ? 0.05 : nd.isChamp ? 0.045 : nd.isTop3 ? 0.034 : 0.024;
      nd.x += (nd.homeX - nd.x) * spring;
      nd.y += (nd.homeY - nd.y) * (spring * 0.74);
      nd.x = Math.max(bounds.left + nd.r, Math.min(bounds.right - nd.r, nd.x));
      nd.y = Math.max(bounds.top + nd.r, Math.min(bounds.bottom - nd.r, nd.y));
    }
  }
}

function _relmapPowerMotionStyle() {
  return `<style>
    .rm-power-drift { animation: rmPowerDrift 4.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    .rm-power-drift:nth-of-type(3n) { animation-duration: 5.6s; }
    .rm-power-drift:nth-of-type(4n) { animation-delay: -1.4s; }
    @keyframes rmPowerDrift {
      0%, 100% { transform: translate(0, 0); }
      45% { transform: translate(1.8px, -1.2px); }
      70% { transform: translate(-1.1px, 0.9px); }
    }
  </style>`;
}

// 勢力図 viewMode — 散布型階層SVG
// ══════════════════════════════════════════════════════════
function _drawRelmapPowerView(svg) {
  const W = _relmapW, H = _relmapH;
  if (!W || !H) return;
  // サイドバー幅分オフセット（サイドバーは左に固定200px）
  const sidebar = document.querySelector('.rm-sidebar, .relmap-sidebar');
  const sidebarW = sidebar ? sidebar.offsetWidth : 200;
  _buildOrgColumnSvgContent(svg, W, H, sidebarW);
}

// 勢力図 全体表示 — 散布型レイアウト
// ・4団体を2×2エリアに配置（ランキング順）
// ・ノードサイズ = OVR比例（強い=大きい）
// ・IDハッシュで自然な散らばり + 衝突回避
// ・org filter有効時 = 単体団体ビューに切替
function _buildOrgColumnSvgContent(svg, W, H, leftOffset) {
  leftOffset = leftOffset || 0;
  const drawW = W - leftOffset;
  const layoutKey = _relmapPowerLayoutKey();

  // 単体団体ビュー（orgFilter有効時）
  if (_relmapOrgFilter && _relmapOrgFilter !== 'fa') {
    _buildOrgHorizontalView(svg, W, H, leftOffset);
    return;
  }

  // 団体リスト（ランキング順）
  const rankings = Engine.ranking.updateRankings(G);
  const rankOrder = [...rankings].sort((a, b) => a.rank - b.rank);
  const takenIds = new Set();
  const orgList = rankOrder.map(r => {
    const isPlayer = r.orgId === 'player';
    const aiData = !isPlayer ? ((G.aiOrgs || {})[r.orgId] || {}) : {};
    const rawRoster = isPlayer
      ? (G.roster || []).filter(c => !c.isRental)
      : (aiData.roster || []);
    const roster = _relmapDedupPowerRoster(rawRoster, takenIds);
    return {
      id: r.orgId, name: r.name, rank: r.rank,
      color: _RELMAP_ORG_COLORS[r.orgId] || '#888',
      roster,
    };
  });

  const playerChampId = G.titles && G.titles.world ? G.titles.world.championId : null;
  // 各団体の王者IDマップを構築（プレイヤー+NPC）
  const orgChampMap = { player: playerChampId };
  Object.entries(G.aiOrgs || {}).forEach(([orgId, orgData]) => {
    orgChampMap[orgId] = orgData.titles?.world?.championId || null;
  });
  const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣'];

  // OVRレンジ（全選手）
  const allFighters = orgList.flatMap(org => org.roster);
  const allOVRs = allFighters.map(f => Engine.util.ov(f));
  const globalOVRMin = allOVRs.length ? Math.min(...allOVRs) : 50;
  const globalOVRMax = allOVRs.length ? Math.max(...allOVRs) : 90;
  const globalOVRRange = Math.max(1, globalOVRMax - globalOVRMin);

  // OVR比例ノードサイズ
  const R_MIN = 11, R_MAX = 30;

  // 団体エリア中心（2×2グリッド、ランキング順: 上段→下段、左→右交互）
  const HEADER_H = 16;
  const areaPositions = [
    { cx: 0.28, cy: 0.24 },
    { cx: 0.73, cy: 0.27 },
    { cx: 0.27, cy: 0.74 },
    { cx: 0.72, cy: 0.71 },
  ];
  const areaRadiusX = drawW * 0.23;
  const areaRadiusY = H * 0.23;

  // Pass 1: 各選手の初期位置を計算
  const allNodes = [];
  const fighterOrgMap = {};

  orgList.forEach((org, ci) => {
    const areaPos = areaPositions[ci] || areaPositions[0];
    const areaCX = leftOffset + drawW * areaPos.cx;
    const areaCY = HEADER_H + (H - HEADER_H) * areaPos.cy;
    const champId = orgChampMap[org.id] || null;
    const sorted = [...org.roster].sort((a, b) => _relmapPowerStatusScore(b, champId) - _relmapPowerStatusScore(a, champId));
    const n = sorted.length;
    const frame = _relmapPowerCompactFrame(n, {
      topLimit: areaCY - areaRadiusY * 0.70,
      bottomLimit: areaCY + areaRadiusY * 0.78,
      maxWidth: areaRadiusX * 1.60,
      jitterX: areaRadiusX * 0.06,
    });
    const targets = _relmapBuildElasticPyramidSlots(
      sorted.map(f => ({ id: f.id, score: _relmapPowerStatusScore(f, champId) })),
      {
        cx: areaCX,
        top: frame.top,
        bottom: frame.bottom,
        maxWidth: frame.maxWidth,
        jitterX: frame.jitterX,
      }
    );

    sorted.forEach((f, rank) => {
      const ovr = Engine.util.ov(f);
      const ovrNorm = globalOVRRange > 0 ? (ovr - globalOVRMin) / globalOVRRange : 0.5;
      const r = R_MIN + ovrNorm * (R_MAX - R_MIN);
      const target = targets[rank] || { x: areaCX, y: areaCY };
      const homeX = target.x;
      const homeY = target.y;
      const mapNode = _relmapNodeMap[f.id];
      const savedPos = _relmapGetPowerPos(mapNode, layoutKey, homeX, homeY);

      allNodes.push({
        id: f.id, fighter: f, orgId: org.id, orgColor: org.color,
        orgName: org.name, orgRank: org.rank, inOrgRank: rank,
        x: savedPos.x, y: savedPos.y,
        r, ovr, pop: _relmapPowerPopularityValue(f), isChamp: !!champId && f.id === champId,
        isAce: rank === 0, isTop3: rank < 3,
        homeX, homeY,
      });
      fighterOrgMap[f.id] = org.id;
    });
  });

  // Pass 2: 衝突回避（5パス、水平優先）
  _relmapRelaxPowerNodes(allNodes, {
    left: leftOffset + 10,
    right: W - 54,
    top: HEADER_H + 8,
    bottom: H - 34,
    pad: 24,
  }, 9);

  // 境界クランプ
  allNodes.forEach(n => {
    n.x = Math.max(leftOffset + n.r + 6, Math.min(W - n.r - 56, n.x));
    n.y = Math.max(HEADER_H + n.r + 8, Math.min(H - n.r - 34, n.y));
    _relmapSetPowerPos(_relmapNodeMap[n.id], layoutKey, n.x, n.y);
  });

  // Pass 3: SVG文字列を3層で構築（ライン→背景→ノード）
  let defsSvg = '<defs>' + _relmapPowerMotionStyle();
  let linesSvg = '', bgSvg = '', nodeSvg = '';

  // ── 層2: 団体エリア背景 + ラベル ──
  // 各団体の勢力指数を算出（人数+平均OVR）→背景円の大きさに反映
  const orgStrengths = orgList.map(org => {
    const ovrs = org.roster.map(f => Engine.util.ov(f));
    const avgOvr = ovrs.length ? ovrs.reduce((s, v) => s + v, 0) / ovrs.length : 40;
    return org.roster.length * (avgOvr / 60);
  });
  const maxStrength = Math.max(1, ...orgStrengths);
  const baseAreaR = Math.max(areaRadiusX, areaRadiusY);

  orgList.forEach((org, ci) => {
    const areaPos = areaPositions[ci] || areaPositions[0];
    const areaCX = leftOffset + drawW * areaPos.cx;
    const areaCY = HEADER_H + (H - HEADER_H) * areaPos.cy;
    const n = org.roster.length;
    const rankEmoji = RANK_EMOJIS[org.rank - 1] || `${org.rank}位`;
    // 勢力比例の背景円（弱い団体は小さく、強い団体は大きく）
    const strengthNorm = orgStrengths[ci] / maxStrength; // 0~1
    const bgR = baseAreaR * (0.5 + strengthNorm * 0.7); // 50%~120%
    bgSvg += `<circle cx="${areaCX.toFixed(1)}" cy="${areaCY.toFixed(1)}" r="${bgR.toFixed(1)}" fill="${org.color}" fill-opacity="${(0.02 + strengthNorm * 0.04).toFixed(3)}"/>`;
    // 団体名ラベル（エリア上部）
    const labelY = areaCY - areaRadiusY - 8;
    bgSvg += `<text x="${areaCX.toFixed(1)}" y="${Math.max(14, labelY).toFixed(1)}" text-anchor="middle" font-size="13" font-family="sans-serif">${rankEmoji}</text>`;
    const dispName = org.name.length > 9 ? org.name.slice(0, 8) + '...' : org.name;
    bgSvg += `<text x="${areaCX.toFixed(1)}" y="${Math.max(28, labelY + 14).toFixed(1)}" text-anchor="middle" fill="${org.color}" font-size="11" font-weight="bold" font-family="sans-serif" stroke="rgba(0,0,0,0.55)" stroke-width="2.5" paint-order="stroke">${dispName}</text>`;
    bgSvg += `<text x="${areaCX.toFixed(1)}" y="${Math.max(40, labelY + 26).toFixed(1)}" text-anchor="middle" fill="${org.color}" font-size="9" fill-opacity="0.45" font-family="sans-serif">${n}名在籍</text>`;
  });

  // ── 層3: 選手ノード ──
  // OVR昇順で描画（大きいノードが上に来るよう）
  const drawOrder = [...allNodes].sort((a, b) => a.ovr - b.ovr);
  drawOrder.forEach(node => {
    const { x, y, r, ovr, pop, orgColor, isChamp, isAce, isTop3, fighter: f, inOrgRank } = node;
    const strokeColor = isChamp ? '#d4a843' : orgColor;
    const sw = isChamp ? 2.5 : isAce ? 2.2 : 1.3;
    const pUrl = getPortraitUrl(f.id);
    const ovrStyle = _relmapPowerOvrBadgeStyle(ovr);

    nodeSvg += `<g class="rm-node-group rm-power-drift" data-id="${f.id}" style="cursor:pointer">`;

    // エースのオーラ（大きく強調）
    if (isAce) {
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 7).toFixed(1)}" fill="${orgColor}" fill-opacity="0.15"/>`;
    }
    // 王者リング + 王冠
    if (isChamp) {
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}" fill="none" stroke="#d4a843" stroke-width="2" stroke-opacity="0.85"/>`;
      nodeSvg += `<text x="${x.toFixed(1)}" y="${(y - r - 5).toFixed(1)}" text-anchor="middle" font-size="${Math.max(11, r * 0.5).toFixed(0)}" font-family="sans-serif">👑</text>`;
    }

    // 顔アイコン or 塗り円
    if (pUrl) {
      const patternId = `pmap-face-${f.id}`;
      defsSvg += _relmapBuildInlineFacePattern(patternId, pUrl);
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${patternId})" stroke="${strokeColor}" stroke-width="${sw}"/>`;
    } else {
      const fillOp = isAce ? 0.45 : isTop3 ? 0.28 : 0.18;
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${orgColor}" fill-opacity="${fillOp}" stroke="${strokeColor}" stroke-width="${sw}"/>`;
      nodeSvg += `<text x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="${Math.min(12, r * 0.7).toFixed(1)}" font-weight="bold" font-family="sans-serif">${ovr}</text>`;
    }

    // OVRバッジ
    const ovrBadgeW = Math.max(30, Math.min(42, r * 1.08));
    const ovrBadgeH = Math.max(18, Math.min(24, r * 0.70));
    const ovrBadgeX = x + r * 0.58;
    const ovrBadgeY = y + r * 0.18;
    nodeSvg += `<rect x="${ovrBadgeX.toFixed(1)}" y="${ovrBadgeY.toFixed(1)}" width="${ovrBadgeW.toFixed(1)}" height="${ovrBadgeH.toFixed(1)}" rx="7" fill="${ovrStyle.fill}" stroke="${ovrStyle.stroke}" stroke-width="1.1"/>`;
    nodeSvg += `<text x="${(ovrBadgeX + ovrBadgeW / 2).toFixed(1)}" y="${(ovrBadgeY + ovrBadgeH / 2 + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${ovrStyle.text}" font-size="${Math.max(12, Math.min(17, r * 0.44)).toFixed(1)}" font-weight="bold" font-family="sans-serif">${ovr}</text>`;
    const popBadgeW = Math.max(34, Math.min(48, r * 1.16));
    const popBadgeH = 15;
    const popBadgeX = ovrBadgeX + 1;
    const popBadgeY = ovrBadgeY + ovrBadgeH - 1;
    nodeSvg += `<rect x="${popBadgeX.toFixed(1)}" y="${popBadgeY.toFixed(1)}" width="${popBadgeW.toFixed(1)}" height="${popBadgeH}" rx="6" fill="rgba(32,20,12,0.94)" stroke="rgba(255,196,120,0.38)" stroke-width="1"/>`;
    nodeSvg += `<text x="${(popBadgeX + popBadgeW / 2).toFixed(1)}" y="${(popBadgeY + 10.2).toFixed(1)}" text-anchor="middle" fill="#ffcf91" font-size="${Math.max(8.5, Math.min(10.2, r * 0.23)).toFixed(1)}" font-weight="600" font-family="sans-serif">人気 ${pop}</text>`;

    // 名前ラベル（上位5名 or ロスター少ないとき全員）
    if (inOrgRank < 5 || node.r >= 18) {
      const name = (f.name || '').slice(0, 6);
      const fs = isAce ? 10.5 : isTop3 ? 10 : 9;
      const nameY = y + r + 29;
      nodeSvg += `<text x="${x.toFixed(1)}" y="${nameY.toFixed(1)}" text-anchor="middle" fill="#e8e8e8" font-size="${fs}" font-family="sans-serif" stroke="rgba(0,0,0,0.88)" stroke-width="3" paint-order="stroke">${name}</text>`;
    }

    nodeSvg += `</g>`;
  });

  bgSvg += `<text x="${(leftOffset + drawW / 2).toFixed(1)}" y="${(H - 3).toFixed(1)}" text-anchor="middle" fill="rgba(200,190,170,0.18)" font-size="9.5" font-family="sans-serif">↑ 強い  ● サイズ=OVR  / クリックで詳細 / サイドバーで団体表示</text>`;

  defsSvg += '</defs>';
  svg.innerHTML = defsSvg + linesSvg + bgSvg + nodeSvg;
}

// 単体団体ビュー — 有機的散布型
// ・Y軸 = OVR（高OVR=上、低OVR=下）
// ・X軸 = IDハッシュで自然に散らす + 衝突回避
// ・ノードサイズ = OVR比例（R_MIN=12, R_MAX=35）
// ・全員に名前ラベル表示
function _buildOrgHorizontalView(svg, W, H, leftOffset) {
  const orgId = _relmapOrgFilter;
  const isPlayer = orgId === 'player';
  const aiData = !isPlayer ? ((G.aiOrgs || {})[orgId] || {}) : {};
  const rawRoster = isPlayer
    ? (G.roster || []).filter(c => !c.isRental)
    : (aiData.roster || []);
  const roster = _relmapDedupPowerRoster(rawRoster);
  const drawW = W - leftOffset;
  const color = _RELMAP_ORG_COLORS[orgId] || '#888';
  const orgName = _relmapGetOrgNameById(orgId);
  const orgChampId = isPlayer
    ? (G.titles?.world?.championId || null)
    : (aiData.titles?.world?.championId || null);
  const sorted = [...roster].sort((a, b) => _relmapPowerStatusScore(b, orgChampId) - _relmapPowerStatusScore(a, orgChampId));
  const n = sorted.length;

  if (!n) {
    svg.innerHTML = `<text x="${(leftOffset + drawW / 2).toFixed(1)}" y="${(H / 2).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="14" font-family="sans-serif">選手なし</text>`;
    return;
  }

  // 該当団体の王者ID取得
  const HEADER_H = 40;
  const PAD_TOP = HEADER_H + 28;
  const PAD_BOTTOM = 32;
  const PAD_X = 44;
  const contentH = H - PAD_TOP - PAD_BOTTOM;
  const usableW = drawW - PAD_X * 2;
  const centerXArea = leftOffset + drawW * 0.53;
  const topY = PAD_TOP + 30;
  const layoutKey = _relmapPowerLayoutKey();
  const makeNode = (f, rank, homeX, homeY) => {
    const ovr = Engine.util.ov(f);
    const r = _relmapPowerNodeRadius(ovr);
    const mapNode = _relmapNodeMap[f.id];
    const savedPos = _relmapGetPowerPos(mapNode, layoutKey, homeX, homeY);
    const node = {
      id: f.id, fighter: f, x: savedPos.x, y: savedPos.y, r, ovr,
      pop: _relmapPowerPopularityValue(f),
      isChamp: !!orgChampId && f.id === orgChampId,
      isAce: rank === 0, isTop3: rank < 3, rank,
      homeX, homeY,
    };
    return node;
  };

  const formationRowsFor = (count) => {
    if (count <= 1) return [1];
    if (count === 2) return [1, 1];
    if (count === 3) return [1, 2];
    if (count === 4) return [1, 3];
    if (count === 5) return [1, 2, 2];
    if (count === 6) return [1, 2, 3];
    if (count === 7) return [1, 2, 4];
    if (count === 8) return [1, 3, 4];
    if (count === 9) return [1, 3, 5];
    if (count === 10) return [1, 3, 4, 2];
    if (count === 11) return [1, 3, 4, 3];
    if (count === 12) return [1, 3, 4, 4];
    const rows = [1, 3, 4];
    let rest = count - 8;
    while (rest > 0) {
      const take = Math.min(5, rest);
      rows.push(take);
      rest -= take;
    }
    return rows;
  };
  const buildFormationSlots = (count) => {
    const rows = formationRowsFor(count);
    const rowGap = Math.min(132, Math.max(78, contentH / Math.max(1, rows.length - 0.35)));
    const maxRow = Math.max(...rows);
    const colGap = Math.min(156, Math.max(76, usableW / Math.max(4.4, maxRow + 1.3)));
    const slots = [];
    rows.forEach((cols, rowIndex) => {
      const y = topY + rowIndex * rowGap;
      const rowTaper = rowIndex === 0 ? 0 : rowIndex === 1 ? 0.72 : 1;
      for (let col = 0; col < cols; col++) {
        const centeredCol = col - (cols - 1) / 2;
        const arcLift = cols > 2 ? Math.abs(centeredCol) * 9 : 0;
        const x = centerXArea + centeredCol * colGap * rowTaper;
        slots.push({ x, y: y + arcLift });
      }
    });
    return slots;
  };

  const orderedForLayout = [];
  const placedIds = new Set();
  const ace = sorted[0];
  if (ace) {
    placedIds.add(ace.id);
    orderedForLayout.push(ace);
  }
  const champion = sorted.find(f => !!orgChampId && f.id === orgChampId);
  if (champion && !placedIds.has(champion.id)) {
    placedIds.add(champion.id);
    orderedForLayout.push(champion);
  }
  sorted.forEach(f => {
    if (placedIds.has(f.id)) return;
    placedIds.add(f.id);
    orderedForLayout.push(f);
  });

  const statusScore = (f) => {
    const ovr = Engine.util.ov(f);
    const pop = _relmapPowerPopularityValue(f);
    const champBoost = !!orgChampId && f.id === orgChampId ? 7 : 0;
    return ovr + pop * 0.10 + champBoost;
  };
  const buildDynamicSlots = (items) => {
    const scores = items.map(statusScore);
    const maxScore = Math.max(...scores), minScore = Math.min(...scores);
    const range = Math.max(1, maxScore - minScore);
    const placed = [];
    const xCandidates = [0, -0.15, 0.15, -0.30, 0.30, -0.45, 0.45, -0.08, 0.08]
      .map(v => centerXArea + usableW * v);
    return items.map((f, idx) => {
      const score = scores[idx];
      const norm = (score - minScore) / range;
      const yBase = topY + (1 - norm) * Math.max(70, contentH - 92);
      const best = xCandidates
        .map((x, order) => {
          let penalty = Math.abs(x - centerXArea) * 0.003 + order * 0.02;
          placed.forEach(p => {
            const dy = Math.abs(yBase - p.y);
            if (dy < 92) {
              const dx = Math.abs(x - p.x);
              penalty += Math.max(0, 130 - dx) * (92 - dy) * 0.018;
            }
          });
          return { x, penalty };
        })
        .sort((a, b) => a.penalty - b.penalty)[0];
      const slot = { x: best.x, y: yBase };
      placed.push(slot);
      return slot;
    });
  };
  const frame = _relmapPowerCompactFrame(orderedForLayout.length, {
    topLimit: topY,
    bottomLimit: H - PAD_BOTTOM - 86,
    maxWidth: usableW * 0.84,
    jitterX: Math.min(28, usableW * 0.035),
    fillVertical: true,
  });
  const dynamicSlots = _relmapBuildElasticPyramidSlots(
    orderedForLayout.map(f => ({ id: f.id, score: _relmapPowerStatusScore(f, orgChampId) })),
    {
      cx: centerXArea,
      top: frame.top,
      bottom: frame.bottom,
      maxWidth: frame.maxWidth,
      jitterX: frame.jitterX,
    }
  );
  const nodes = orderedForLayout.map((f, idx) => {
    const slot = dynamicSlots[idx] || dynamicSlots[dynamicSlots.length - 1];
    const rank = sorted.findIndex(it => it.id === f.id);
    return makeNode(f, rank, slot.x, slot.y);
  });

  _relmapRelaxPowerNodes(nodes, {
    left: leftOffset + PAD_X + 10,
    right: leftOffset + drawW - PAD_X - 58,
    top: Math.max(PAD_TOP + 4, frame.top - 28),
    bottom: Math.min(H - PAD_BOTTOM - 38, frame.bottom + 44),
    pad: orderedForLayout.length <= 8 ? 30 : 38,
  }, 10);

  nodes.forEach(nd => {
    nd.x = Math.max(leftOffset + PAD_X + nd.r + 6, Math.min(leftOffset + drawW - PAD_X - nd.r - 58, nd.x));
    nd.y = Math.max(PAD_TOP + nd.r + 6, Math.min(Math.min(H - PAD_BOTTOM - nd.r - 38, frame.bottom + 48), nd.y));
    _relmapSetPowerPos(_relmapNodeMap[nd.id], layoutKey, nd.x, nd.y);
  });

  let defsSvg = '<defs>' + _relmapPowerMotionStyle();
  let svgHtml = '';

  // ヘッダー
  const centerX = (leftOffset + drawW / 2).toFixed(1);
  svgHtml += `<text x="${centerX}" y="26" text-anchor="middle" fill="${color}" font-size="14" font-weight="bold" font-family="sans-serif" stroke="rgba(0,0,0,0.7)" stroke-width="2.5" paint-order="stroke">${orgName}（${n}名）</text>`;
  svgHtml += `<line x1="${(leftOffset + 20).toFixed(1)}" y1="34" x2="${(leftOffset + drawW - 20).toFixed(1)}" y2="34" stroke="${color}" stroke-width="1" stroke-opacity="0.3"/>`;

  // 薄い団体カラー背景のみ。人数差で欠けた形に見えないよう、固定の支柱線は描かない。
  svgHtml += `<circle cx="${centerXArea.toFixed(1)}" cy="${(H / 2).toFixed(1)}" r="${(Math.max(drawW, H) * 0.38).toFixed(1)}" fill="${color}" fill-opacity="0.03"/>`;
  svgHtml += `<circle cx="${centerXArea.toFixed(1)}" cy="${topY.toFixed(1)}" r="${Math.min(96, usableW * 0.12).toFixed(1)}" fill="rgba(212,168,67,0.06)"/>`;

  // OVR昇順で描画（大きいノードが上に来る）
  const drawOrder = [...nodes].sort((a, b) => a.ovr - b.ovr);
  drawOrder.forEach(node => {
    const { x, y, r, ovr, pop, isChamp, isAce, isTop3, fighter: f, rank } = node;
    const strokeColor = isChamp ? '#d4a843' : color;
    const sw = isChamp ? 2.8 : isAce ? 2.4 : 1.5;
    const pUrl = getPortraitUrl(f.id);
    const ovrStyle = _relmapPowerOvrBadgeStyle(ovr);

    svgHtml += `<g class="rm-node-group rm-power-drift" data-id="${f.id}" style="cursor:pointer">`;

    // エースのオーラ
    if (isAce) {
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 8).toFixed(1)}" fill="${color}" fill-opacity="0.12"/>`;
    }

    // 王冠
    if (isChamp) {
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}" fill="none" stroke="#d4a843" stroke-width="2" stroke-opacity="0.85"/>`;
      svgHtml += `<text x="${x.toFixed(1)}" y="${(y - r - 6).toFixed(1)}" text-anchor="middle" font-size="${Math.max(12, r * 0.45).toFixed(0)}" font-family="sans-serif">👑</text>`;
    }

    // 顔アイコン or 塗り円
    if (pUrl) {
      const patternId = `ph-face-${f.id}`;
      defsSvg += _relmapBuildInlineFacePattern(patternId, pUrl);
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${patternId})" stroke="${strokeColor}" stroke-width="${sw}"/>`;
    } else {
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(10,10,20,0.9)" stroke="${strokeColor}" stroke-width="${sw}"/>`;
      svgHtml += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${color}" font-size="${(r * 0.6).toFixed(1)}" font-family="sans-serif">${ovr}</text>`;
    }

    // OVR + 人気バッジ（顔の中心を避けて右下へ逃がす）
    const ovrBadgeW = Math.max(36, Math.min(48, r * 0.96));
    const ovrBadgeH = Math.max(24, Math.min(30, r * 0.62));
    const ovrBadgeX = x + r * 0.70 - ovrBadgeW * 0.18;
    const ovrBadgeY = y + r * 0.36 - ovrBadgeH * 0.40;
    svgHtml += `<rect x="${ovrBadgeX.toFixed(1)}" y="${ovrBadgeY.toFixed(1)}" width="${ovrBadgeW.toFixed(1)}" height="${ovrBadgeH.toFixed(1)}" rx="8" fill="${ovrStyle.fill}" stroke="${ovrStyle.stroke}" stroke-width="1.1"/>`;
    svgHtml += `<text x="${(ovrBadgeX + ovrBadgeW / 2).toFixed(1)}" y="${(ovrBadgeY + ovrBadgeH / 2 + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${ovrStyle.text}" font-size="${Math.max(16, Math.min(20, r * 0.48)).toFixed(1)}" font-weight="bold" font-family="sans-serif">${ovr}</text>`;
    const popBadgeW = Math.max(40, Math.min(54, r * 1.06));
    const popBadgeH = 18;
    const popBadgeX = ovrBadgeX + 1;
    const popBadgeY = ovrBadgeY + ovrBadgeH - 2;
    svgHtml += `<rect x="${popBadgeX.toFixed(1)}" y="${popBadgeY.toFixed(1)}" width="${popBadgeW.toFixed(1)}" height="${popBadgeH}" rx="7" fill="rgba(32,20,12,0.94)" stroke="rgba(255,196,120,0.36)" stroke-width="1"/>`;
    svgHtml += `<text x="${(popBadgeX + popBadgeW / 2).toFixed(1)}" y="${(popBadgeY + 11.7).toFixed(1)}" text-anchor="middle" fill="#ffcf91" font-size="${Math.max(9.5, Math.min(10.8, r * 0.24)).toFixed(1)}" font-weight="600" font-family="sans-serif">人気 ${pop}</text>`;

    // 名前（全員表示）
    const name = (f.name || '').slice(0, 6);
    const fs = isAce ? 11 : isTop3 ? 10.5 : 9.5;
    const nameY = y + r + 30;
    svgHtml += `<text x="${x.toFixed(1)}" y="${nameY.toFixed(1)}" text-anchor="middle" fill="#e8e8e8" font-size="${fs}" font-family="sans-serif" stroke="rgba(0,0,0,0.88)" stroke-width="3" paint-order="stroke">${name}</text>`;

    // 順位ラベル
    svgHtml += `<text x="${x.toFixed(1)}" y="${(y - r - (isChamp ? 18 : 5)).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="8.5" font-family="sans-serif">#${rank + 1}</text>`;

    svgHtml += `</g>`;
  });

  svgHtml += `<text x="${(leftOffset + drawW / 2).toFixed(1)}" y="${(H - 4).toFixed(1)}" text-anchor="middle" fill="rgba(200,190,170,0.18)" font-size="9.5" font-family="sans-serif">王者だけ金リング表示  /  大きい数字=OVR  /  下の小バッジ=人気  /  クリックで詳細</text>`;

  defsSvg += '</defs>';
  svg.innerHTML = defsSvg + svgHtml;
}

// ══════════════════════════════════════════════════════════
function _relmapSetViewMode(mode) {
  _relmapViewMode = mode;
  document.querySelectorAll('.rm-view-toggle .rm-vt-btn').forEach(b => b.classList.remove('active'));
  const btnIdx = mode === 'network' ? 1 : mode === 'focus' ? 2 : 3;
  const btn = document.querySelector(`.rm-vt-btn:nth-child(${btnIdx})`);
  if (btn) btn.classList.add('active');
  const zoneLayer = document.getElementById('relmapZoneLayer');
  if (zoneLayer) zoneLayer.innerHTML = '';

  if (mode === 'power') {
    // 勢力図モード: 物理演算停止・全ノード非表示・SVGに団体ノードを直描画
    if (_relmapAnimId) { cancelAnimationFrame(_relmapAnimId); _relmapAnimId = null; }
    _relmapNodes.forEach(n => { n._hidden = true; });
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    _relmapRenderPowerView();
    return;
  }

  if (mode === 'network') {
    // 勢力図から戻る場合: SVGのdefs+描画レイヤーを完全再構築 + orgFilter解除 + ズームリセット
    const svg = document.getElementById('relmapSvg');
    if (svg) {
      const existingNodeLayer = document.getElementById('relmapNodeLayer');
      if (!existingNodeLayer) {
        // power viewがsvg.innerHTMLを上書きしたため、defs+レイヤーを再構築
        let defsHtml = '<defs>';
        defsHtml += '<filter id="rm-glow-gold" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feFlood flood-color="#d4a843" flood-opacity="0.5"/><feComposite in2="blur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        defsHtml += '<filter id="rm-glow-red" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-color="#e17055" flood-opacity="0.4"/><feComposite in2="blur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        defsHtml += '<marker id="rm-arrow-warm" viewBox="0 0 8 6" refX="8" refY="3" markerWidth="8" markerHeight="6" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#74b9ff" opacity="0.7"/></marker>';
        defsHtml += '<marker id="rm-arrow-cold" viewBox="0 0 8 6" refX="8" refY="3" markerWidth="8" markerHeight="6" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#ff7675" opacity="0.7"/></marker>';
        for (const [orgId, clr] of Object.entries(_RELMAP_ORG_COLORS)) {
          const op = orgId === 'player' ? 0.08 : 0.06;
          defsHtml += `<radialGradient id="rm-zone-${orgId}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${clr}" stop-opacity="${op}"/><stop offset="100%" stop-color="${clr}" stop-opacity="0"/></radialGradient>`;
        }
        defsHtml += '</defs>';
        svg.innerHTML = defsHtml + '<g id="relmapZoneLayer"></g><g id="relmapFactionLayer"></g><g id="relmapLinkLayer"></g><g id="relmapNodeLayer"></g><g id="relmapFactionMarkerLayer"></g>';
        _relmapBuildFacePatterns(svg);
      }
    }
    _relmapOrgFilter = null;
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    // 全ノードを表示に戻す（_relmapUpdateVisibilityで正式に処理される）
    _relmapNodes.forEach(n => { n._hidden = false; });
    const W = _relmapW, H = _relmapH;
    const orgCenters = { player: { x: W * 0.3, y: H * 0.35 }, org_s: { x: W * 0.7, y: H * 0.3 }, org_a: { x: W * 0.25, y: H * 0.7 }, org_b: { x: W * 0.7, y: H * 0.7 }, fa: { x: W * 0.5, y: H * 0.5 } };
    _relmapDrawOrgZones(orgCenters);
    _relmapFactionCenters = {};
    _relmapRenderSidebar(orgCenters);
  }
  // フォーカスモードに切り替える際、中心未設定なら自動でプレイヤー最高OVR選手を設定
  // （全ノード一斉表示によるO(n²)物理演算負荷を防ぐ）
  if (mode === 'focus' && !_relmapCenterId && _relmapNodes.length > 0) {
    const playerNodes = _relmapNodes.filter(n => n.orgId === 'player');
    const candidates = playerNodes.length ? playerNodes : _relmapNodes;
    const top = candidates.reduce((best, n) => n.ovr > best.ovr ? n : best, candidates[0]);
    _relmapCenterId = top.id;
    const ci = document.getElementById('rmCenterIndicator');
    if (ci) ci.style.display = 'flex';
    const cn = document.getElementById('rmCenterName');
    if (cn) cn.textContent = top.name;
  }
  _relmapUpdateVisibility();
  _relmapReheat();
}

// Phase 3c: 派閥オーバーレイ ON/OFF トグル（団体フィルタ ON 時のみ有効）
function _relmapToggleFactionOverlay() {
  if (!_relmapOrgFilter) return;
  if (_relmapGetFilteredFactions().length === 0) return;
  _relmapFactionOverlay = !_relmapFactionOverlay;
  if (_relmapFactionOverlay) {
    // CENTER 選手を退避して団体内フラット表示に
    _relmapSavedCenterId = _relmapCenterId;
    _relmapCenterId = null;
    const ci = document.getElementById('rmCenterIndicator');
    if (ci) ci.style.display = 'none';
    _relmapComputeFactionCenters(_relmapGetFilteredFactions());
  } else {
    // CENTER 選手を復元（退避していた場合）
    if (_relmapSavedCenterId !== null) {
      _relmapCenterId = _relmapSavedCenterId;
      _relmapSavedCenterId = null;
      const n = _relmapNodeMap[_relmapCenterId];
      const ci = document.getElementById('rmCenterIndicator');
      const cn = document.getElementById('rmCenterName');
      if (ci && n) ci.style.display = 'flex';
      if (cn && n) cn.textContent = n.name;
    }
    _relmapFactionCenters = {};
  }
  // ボタン active 状態更新
  const btn = document.querySelector('.rm-view-toggle .rm-vt-faction');
  if (btn) btn.classList.toggle('active', _relmapFactionOverlay);
  _relmapUpdateVisibility();
  _relmapReheat();
}

function _relmapSetCenter(nodeId) {
  _relmapCenterId = nodeId;
  const n = _relmapNodeMap[nodeId];
  const ci = document.getElementById('rmCenterIndicator');
  if (ci) { ci.style.display = 'flex'; }
  const cn = document.getElementById('rmCenterName');
  if (cn) cn.textContent = n ? n.name : '';
  _relmapUpdateVisibility();
  _relmapShowDetailForNode(nodeId);
  _relmapReheat();
}

function _relmapClearCenter() {
  _relmapCenterId = null;
  const ci = document.getElementById('rmCenterIndicator');
  if (ci) ci.style.display = 'none';
  const dp = document.getElementById('relmapDetailPanel');
  if (dp) dp.classList.remove('show');
  _relmapUpdateVisibility();
  _relmapReheat();
}

function _relmapResetAll() {
  _relmapClearCenter();
  _relmapCompareA = null; _relmapCompareB = null;
  _relmapOrgFilter = null;
  const sh = document.getElementById('relmapSelectHint');
  if (sh) sh.classList.remove('show');
  if (_relmapViewMode === 'focus') _relmapSetViewMode('network');
  _relmapRenderSidebar(_relmapOrgCenters);
  _relmapReheat();
}

function _relmapFocusOrg(orgId) {
  // Toggle org filter: show only this org's members and their internal relationships
  if (_relmapOrgFilter === orgId) {
    _relmapOrgFilter = null; // toggle off
  } else {
    _relmapOrgFilter = orgId;
  }
  // Phase 3c: 団体フィルタが解除されたら派閥オーバーレイも解除
  if (!_relmapOrgFilter && _relmapFactionOverlay) {
    _relmapFactionOverlay = false;
    if (_relmapSavedCenterId !== null) { _relmapCenterId = _relmapSavedCenterId; _relmapSavedCenterId = null; }
  }
  // 勢力図モード: 直接SVGを再描画
  if (_relmapViewMode === 'power') {
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    _relmapRenderPowerView();
    _relmapRenderSidebar(_relmapOrgCenters);
    return;
  }
  // Reset zoom/pan to center
  _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
  // Phase 3c: 派閥オーバーレイ ON 時のみ派閥中心を再計算
  if (_relmapOrgFilter && _relmapFactionOverlay) {
    _relmapComputeFactionCenters(_relmapGetFilteredFactions());
  } else {
    _relmapFactionCenters = {};
  }
  // 団体フィルタが他団体に切り替わった場合、それまでの派閥オーバーレイ有効性を再評価
  if (_relmapOrgFilter && _relmapFactionOverlay && _relmapGetFilteredFactions().length === 0) {
    _relmapFactionOverlay = false;
    if (_relmapSavedCenterId !== null) { _relmapCenterId = _relmapSavedCenterId; _relmapSavedCenterId = null; }
  }
  // 🎭 派閥ボタンの disabled / active / title 状態を更新
  const foBtn = document.querySelector('.rm-view-toggle .rm-vt-faction');
  if (foBtn) {
    const disabled = !_relmapOrgFilter || _relmapGetFilteredFactions().length === 0;
    foBtn.disabled = disabled;
    foBtn.classList.toggle('active', _relmapFactionOverlay);
    foBtn.title = disabled ? '団体を選んでください' : '派閥表示の ON/OFF';
  }
  _relmapUpdateVisibility();
  _relmapRenderSidebar(_relmapOrgCenters);
  _relmapReheat();
}

function _relmapSetFilter(f) {
  _relmapFilter = f;
  document.querySelectorAll('.rm-header-controls .rm-ctrl-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('.rm-header-controls .rm-ctrl-btn');
  const idx = f === 'all' ? 0 : f === 'rivalry' ? 1 : 2;
  if (btns[idx]) btns[idx].classList.add('active');
  _relmapUpdateVisibility();
  _relmapReheat();
}

// ══════════════════════════════════════════════════════════
// Detail panel (bottom)
// ══════════════════════════════════════════════════════════
function _relmapShowDetailForNode(nodeId) {
  const panel = document.getElementById('relmapDetailPanel');
  const n = _relmapNodeMap[nodeId];
  if (!panel || !n) { if (panel) panel.classList.remove('show'); return; }
  const nl = _relmapGetLinksFor(nodeId).sort((a, b) => b.strength - a.strength);
  if (!nl.length) { panel.classList.remove('show'); return; }

  const top = nl[0], oid = top.a === nodeId ? top.b : top.a, other = _relmapNodeMap[oid];
  if (!other) { panel.classList.remove('show'); return; }
  const isS = top.a === nodeId;
  const bf = isS ? top.bondAB : top.bondBA, br = isS ? top.bondBA : top.bondAB;
  const rf = isS ? top.rivAB : top.rivBA, rr = isS ? top.rivBA : top.rivAB;
  const bfc = _bondColor(bf).color, brc = _bondColor(br).color;
  const rfc = _rivalryColor(rf).color, rrc = _rivalryColor(rr).color;

  let tb = '';
  if (top.rivalTitle) tb = `<span class="rm-detail-rivalry-badge" style="background:${top.titleColor}22;color:${top.titleColor};border:1px solid ${top.titleColor}44">${top.titleEmoji} ${top.rivalTitle}</span>`;

  panel.innerHTML = `<div class="rm-detail-faces"><div class="rm-detail-face" style="border-color:${n.color}" onclick="showFighterPopup(${n.id})">${_relmapFaceHtml(n.id, 42)}</div><span class="rm-detail-arr">\u21C4</span><div class="rm-detail-face" style="border-color:${other.color}" onclick="showFighterPopup(${other.id})">${_relmapFaceHtml(other.id, 42)}</div></div>
    <div class="rm-detail-info"><div class="rm-detail-names"><span style="cursor:pointer" onclick="showFighterPopup(${n.id})">${n.name}</span><span style="color:var(--text-dim);font-size:11px">\u21C4</span><span style="cursor:pointer" onclick="showFighterPopup(${other.id})">${other.name}</span>${tb}</div>
    <div class="rm-detail-meters"><div><div class="rm-detail-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_BOND)}>${n.name.slice(0,3)}\u2192親</div><div class="rm-detail-meter-val" style="color:${bfc}">${Math.round(bf)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${bf}%;background:${bfc}"></div></div></div><div><div class="rm-detail-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_BOND)}>${other.name.slice(0,3)}\u2192親</div><div class="rm-detail-meter-val" style="color:${brc}">${Math.round(br)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${br}%;background:${brc}"></div></div></div><div><div class="rm-detail-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_RIVALRY)}>${n.name.slice(0,3)}\u2192競</div><div class="rm-detail-meter-val" style="color:${rfc}">${Math.round(rf)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${rf}%;background:${rfc}"></div></div></div><div><div class="rm-detail-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_RIVALRY)}>${other.name.slice(0,3)}\u2192競</div><div class="rm-detail-meter-val" style="color:${rrc}">${Math.round(rr)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${rr}%;background:${rrc}"></div></div></div></div></div>
    <div style="text-align:right;font-size:10px;color:var(--text-dim);flex-shrink:0">他 ${nl.length-1}件<br><span style="cursor:pointer;color:var(--gold)" onclick="showFighterPopup(${n.id})">\uD83D\uDCCB 詳細</span><span style="margin-left:8px;cursor:pointer;color:#74b9ff" onclick="_relmapCompareA=${n.id};_relmapCompareB=${other.id};_relmapShowComparePopup()">\u2696 比較</span></div>`;
  panel.classList.add('show');
}

// ══════════════════════════════════════════════════════════
// Compare popup
// ══════════════════════════════════════════════════════════
function _relmapHandleCompareClick(id) {
  if (_relmapCompareA === id) { _relmapCompareA = _relmapCompareB; _relmapCompareB = null; }
  else if (_relmapCompareB === id) { _relmapCompareB = null; }
  else if (!_relmapCompareA) { _relmapCompareA = id; }
  else if (!_relmapCompareB) { _relmapCompareB = id; }
  else { _relmapCompareA = _relmapCompareB; _relmapCompareB = id; }
  _relmapUpdateCompareHint();
  _relmapReheat();
  if (_relmapCompareA && _relmapCompareB) _relmapShowComparePopup();
}

function _relmapUpdateCompareHint() {
  const h = document.getElementById('relmapSelectHint');
  if (!h) return;
  if (!_relmapCompareA) { h.classList.remove('show'); return; }
  const aN = _relmapNodeMap[_relmapCompareA]?.name || '?';
  if (!_relmapCompareB) { h.textContent = `\u2696 \u2460 ${aN} を選択 \u2192 \u2461右側の選手をクリック`; h.classList.add('show'); }
  else { h.classList.remove('show'); }
}

function _relmapShowComparePopup() {
  const a = _relmapNodeMap[_relmapCompareA], b = _relmapNodeMap[_relmapCompareB];
  if (!a || !b) return;
  const rel = _relmapGetLinkBetween(a.id, b.id);
  const isAS = rel ? rel.a === a.id : true;
  const aUp = getUpperUrl(a.id), bUp = getUpperUrl(b.id);
  const aColor = a.color, bColor = b.color;
  const aOrgName = _relmapGetOrgNameById(a.orgId), bOrgName = _relmapGetOrgNameById(b.orgId);
  const aEmoji = _relmapGetOrgEmoji(a.orgId), bEmoji = _relmapGetOrgEmoji(b.orgId);

  // 関係データ事前取得（ヘッダーに埋め込むため）
  const bAtoB = rel ? (isAS ? rel.bondAB : rel.bondBA) : 0;
  const rAtoB = rel ? (isAS ? rel.rivAB : rel.rivBA) : 0;
  const bBtoA = rel ? (isAS ? rel.bondBA : rel.bondAB) : 0;
  const rBtoA = rel ? (isAS ? rel.rivBA : rel.rivAB) : 0;
  const cAB = bAtoB >= 50 ? '#74b9ff' : '#ff7675', cBA = bBtoA >= 50 ? '#74b9ff' : '#ff7675';

  let h = `<div class="rm-popup-close" onclick="_relmapClosePopup()">\u2715</div>`;

  // ライバル称号バナー（あれば）
  if (rel && rel.rivalTitle) {
    h += `<div style="text-align:center;padding:6px 0 2px;font-size:13px;font-weight:700;color:${rel.titleColor}">${rel.titleEmoji} ${rel.rivalTitle}</div>`;
  }

  // ヘッダー: アイコン+名前+OVR+感情メーターを各キャラの下に配置
  h += `<div class="rm-compare-header"><div class="rm-compare-side">`;
  h += `<div class="rm-compare-upper-img" style="border-color:${aColor}">${aUp?`<img src="${aUp}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="no-img" ${aUp?'style="display:none"':''}>\uD83D\uDC64</div></div>`;
  h += `<div class="rm-compare-name">${a.name}</div><div class="rm-compare-org" style="color:${aColor}">${aEmoji} ${aOrgName} \u2500 ${a.style}</div><div class="rm-compare-ovr-badge">OVR ${a.ovr}</div>`;
  // A→Bへの感情（Aのアイコンの下、右矢印で方向を示す）
  if (rel) {
    h += `<div class="rm-cmp-rel-inline">`;
    h += `<div class="rm-cmp-rel-direction" style="color:${bColor}">→ ${b.name.slice(0,5)} への感情</div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_BOND)}>親密度</div><div class="rm-cmp-rel-meter-val" style="color:${cAB}">${Math.round(bAtoB)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${bAtoB}%;background:${cAB}"></div></div></div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_RIVALRY)}>競争意識</div><div class="rm-cmp-rel-meter-val" style="color:#e17055">${Math.round(rAtoB)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${rAtoB}%;background:#e17055"></div></div></div>`;
    const emotionAtoB = getEmotionText(bAtoB, rAtoB, a.ovr, b.ovr, a._char?.archetype);
    h += `<div class="rm-cmp-emotion-text">\uD83D\uDCAD ${emotionAtoB}</div>`;
    h += `</div>`;
  }
  h += `</div><div class="rm-compare-divider">\u21C4</div><div class="rm-compare-side">`;
  h += `<div class="rm-compare-upper-img" style="border-color:${bColor}">${bUp?`<img src="${bUp}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="no-img" ${bUp?'style="display:none"':''}>\uD83D\uDC64</div></div>`;
  h += `<div class="rm-compare-name">${b.name}</div><div class="rm-compare-org" style="color:${bColor}">${bEmoji} ${bOrgName} \u2500 ${b.style}</div><div class="rm-compare-ovr-badge">OVR ${b.ovr}</div>`;
  // B→Aへの感情（Bのアイコンの下、左矢印で方向を示す）
  if (rel) {
    h += `<div class="rm-cmp-rel-inline">`;
    h += `<div class="rm-cmp-rel-direction" style="color:${aColor}">← ${a.name.slice(0,5)} への感情</div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_BOND)}>親密度</div><div class="rm-cmp-rel-meter-val" style="color:${cBA}">${Math.round(bBtoA)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${bBtoA}%;background:${cBA}"></div></div></div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label" style="cursor:help" ${_tipAttr(_RM_TIP_RIVALRY)}>競争意識</div><div class="rm-cmp-rel-meter-val" style="color:#e17055">${Math.round(rBtoA)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${rBtoA}%;background:#e17055"></div></div></div>`;
    const emotionBtoA = getEmotionText(bBtoA, rBtoA, b.ovr, a.ovr, b._char?.archetype);
    h += `<div class="rm-cmp-emotion-text">\uD83D\uDCAD ${emotionBtoA}</div>`;
    h += `</div>`;
  }
  h += `</div></div>`;

  if (!rel) {
    h += `<div style="text-align:center;padding:6px 0;color:var(--text-dim);font-size:12px">\uD83D\uDD17 直接の関係はありません</div>`;
  }

  // 関係性タグ
  const relTags = [];
  const ageA = a._char?.age || 17, ageB = b._char?.age || 17;
  const ageDiff = Math.abs(ageA - ageB);
  if (ageDiff <= 2) relTags.push('\uD83D\uDC65 同世代');
  const isColleague = Engine.orgTimeline.wereColleagues(a._char || {}, b._char || {});
  if (isColleague) relTags.push('\uD83E\uDD1D 元同僚');
  if (ageDiff >= 3 && (a.orgId === b.orgId || isColleague)) {
    const senior = ageA > ageB ? a.name : b.name;
    const junior = ageA > ageB ? b.name : a.name;
    relTags.push(`\uD83D\uDD30 ${senior}\u2192${junior}`);
  }
  const h2hRec = Engine.h2h.getRecord(G, a.id, b.id);
  if (h2hRec && h2hRec.bestMQ >= 85) relTags.push('\u2728 名勝負あり');
  if (relTags.length > 0) {
    h += `<div class="rm-cmp-tags">${relTags.join('<span class="rm-cmp-tag-sep">\uFF0F</span>')}</div>`;
  }

  h += `<div class="rm-compare-body">`;
  // Stats comparison
  _RELMAP_STAT_META.forEach(s => {
    const va = a[s.key] || 0, vb = b[s.key] || 0;
    const displayVa = Math.round(va), displayVb = Math.round(vb);
    const aW = va > vb, bW = vb > va;
    h += `<div class="rm-cmp-stat-row"><div class="rm-cmp-bar-left"><div class="rm-cmp-val" style="color:${aW?s.color:'var(--text-sub)'}">${displayVa}</div><div class="rm-cmp-bar-track"><div class="rm-cmp-bar-fill" style="width:${va}%;background:${aW?s.color:'rgba(200,190,170,0.15)'}"></div></div></div><div class="rm-cmp-label">${s.label}</div><div class="rm-cmp-bar-right"><div class="rm-cmp-bar-track"><div class="rm-cmp-bar-fill" style="width:${vb}%;background:${bW?s.color:'rgba(200,190,170,0.15)'}"></div></div><div class="rm-cmp-val" style="color:${bW?s.color:'var(--text-sub)'}">${displayVb}</div></div></div>`;
  });
  h += `</div>`;

  const card = document.getElementById('relmapPopupCard');
  if (card) { card.className = 'rm-popup-card rm-compare-card'; card.style.width = '860px'; card.innerHTML = h; }
  const overlay = document.getElementById('relmapPopupOverlay');
  if (overlay) overlay.classList.add('show');
}

function _relmapClosePopup() {
  const overlay = document.getElementById('relmapPopupOverlay');
  if (overlay) overlay.classList.remove('show');
  _relmapCompareA = null; _relmapCompareB = null;
  _relmapUpdateCompareHint();
  _relmapReheat();
}

function _relmapZoomIn() {
  const cx = _relmapPanX + _relmapW / _relmapZoom / 2;
  const cy = _relmapPanY + _relmapH / _relmapZoom / 2;
  const oldZoom = _relmapZoom;
  _relmapZoom = Math.min(5, _relmapZoom * 1.3);
  _relmapPanX = cx - (cx - _relmapPanX) * (oldZoom / _relmapZoom);
  _relmapPanY = cy - (cy - _relmapPanY) * (oldZoom / _relmapZoom);
  _relmapReheat();
}

function _relmapZoomOut() {
  const cx = _relmapPanX + _relmapW / _relmapZoom / 2;
  const cy = _relmapPanY + _relmapH / _relmapZoom / 2;
  const oldZoom = _relmapZoom;
  _relmapZoom = Math.max(0.3, _relmapZoom / 1.3);
  _relmapPanX = cx - (cx - _relmapPanX) * (oldZoom / _relmapZoom);
  _relmapPanY = cy - (cy - _relmapPanY) * (oldZoom / _relmapZoom);
  _relmapReheat();
}

function _relmapZoomFit() {
  if (_relmapViewMode === 'power') {
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    _relmapRenderPowerView();
    return;
  }
  const visible = _relmapNodes.filter(n => !n._hidden && Number.isFinite(n.x) && Number.isFinite(n.y));
  if (!visible.length || !_relmapW || !_relmapH) {
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    _relmapRender(_relmapOrgCenters);
    return;
  }
  const pad = window.matchMedia?.('(max-width: 700px)').matches ? 42 : 64;
  const minX = Math.min(...visible.map(n => n.x - n.r)) - pad;
  const maxX = Math.max(...visible.map(n => n.x + n.r)) + pad;
  const minY = Math.min(...visible.map(n => n.y - n.r)) - pad;
  const maxY = Math.max(...visible.map(n => n.y + n.r)) + pad;
  const boundsW = Math.max(1, maxX - minX);
  const boundsH = Math.max(1, maxY - minY);
  _relmapZoom = Math.max(0.3, Math.min(1.15, _relmapW / boundsW, _relmapH / boundsH));
  const viewW = _relmapW / _relmapZoom;
  const viewH = _relmapH / _relmapZoom;
  _relmapPanX = (minX + maxX) / 2 - viewW / 2;
  _relmapPanY = (minY + maxY) / 2 - viewH / 2;
  _relmapRender(_relmapOrgCenters);
}

// ── ランキング画面: 指標ツールチップを document.body に teleport してクリッピング回避 ──
(function initRankMetricTooltips() {
  if (typeof document === 'undefined') return;
  let _activeTip = null;
  let _activeOrigin = null; // 元の親要素 (mouseout で戻す)
  function showTip(metric) {
    const tip = metric.querySelector(':scope > .rank-metric-tooltip');
    if (!tip) return;
    // 既存表示があれば撤収
    hideTip();
    // body へ teleport (祖先の transform/overflow に影響されないようにする)
    _activeOrigin = tip.parentNode;
    _activeTip = tip;
    document.body.appendChild(tip);
    tip.classList.add('is-floating');
    metric.classList.add('is-tip-active');
    // サイズ確定後に位置決め
    requestAnimationFrame(() => {
      if (!_activeTip) return;
      const r = metric.getBoundingClientRect();
      const tipW = tip.offsetWidth || 320;
      const tipH = tip.offsetHeight || 0;
      const margin = 8;
      let left = r.left + r.width / 2 - tipW / 2;
      left = Math.max(margin, Math.min(window.innerWidth - tipW - margin, left));
      let top = r.top - tipH - margin;
      if (top < margin) top = Math.min(window.innerHeight - tipH - margin, r.bottom + margin);
      if (top < margin) top = margin;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    });
  }
  function hideTip() {
    if (!_activeTip) return;
    _activeTip.classList.remove('is-floating');
    _activeTip.style.left = '';
    _activeTip.style.top = '';
    if (_activeOrigin) _activeOrigin.appendChild(_activeTip);
    document.querySelectorAll('.rank-metric.is-tip-active').forEach(el => el.classList.remove('is-tip-active'));
    _activeTip = null;
    _activeOrigin = null;
  }
  document.addEventListener('mouseover', (e) => {
    const m = e.target.closest && e.target.closest('.rank-metric');
    if (!m || !m.querySelector(':scope > .rank-metric-tooltip')) return;
    showTip(m);
  }, true);
  document.addEventListener('mouseout', (e) => {
    const m = e.target.closest && e.target.closest('.rank-metric');
    if (!m) return;
    const related = e.relatedTarget;
    if (related && m.contains(related)) return;
    hideTip();
  }, true);
  window.addEventListener('scroll', hideTip, true);
})();
