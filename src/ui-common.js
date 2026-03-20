// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9: UI HELPERS & SHOW PREP (v0.85)                ║
// ╚══════════════════════════════════════════════════════════╝

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Popup Queue System ──────────────────────────────────────────────────
// ポップアップの重複表示を防止する。1つのポップアップが表示中は、
// 新しいポップアップをキューに入れて順番待ちさせる。
const _POPUP_OVERLAY_IDS = [
  'growthEventOverlay', 'eventPopupOverlay', 'retirementPopupOverlay',
  'rivalryPopupOverlay', 'newspaperOverlay', 'seasonFanfareOverlay',
  'milestoneOverlay', 'awardsOverlay', 'careModalOverlay', 'notifModalOverlay',
  'careOverlay', 'fighterPopupOverlay', 'coachTooltipOverlay', 'showResultOverlay'
];
let _popupQueue = [];

function _isPopupActive() {
  // 静的オーバーレイ（index.htmlで定義済み）
  const staticActive = _POPUP_OVERLAY_IDS.some(id => {
    const el = document.getElementById(id);
    return el && (el.classList.contains('active') || el.classList.contains('show'));
  });
  if (staticActive) return true;
  // 動的オーバーレイ（R3Modalなど、DOMに直接追加されるもの）
  return !!document.querySelector('.r3-modal-overlay');
}

function _enqueuePopup(fn) {
  if (_isPopupActive()) {
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
  const tipW = 250;
  let left = rect.left;
  if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
  if (left < 8) left = 8;
  let top = rect.bottom + 6;
  if (top + 140 > window.innerHeight) top = rect.top - 6 - tip.offsetHeight;
  tip.style.left = left + 'px';
  tip.style.top = Math.max(8, top) + 'px';
}
function hideCustomTooltip() {
  const tip = document.getElementById('customTooltip');
  if (tip) tip.style.display = 'none';
}
// Global tap-outside hides tooltip
document.addEventListener('click', hideCustomTooltip);

// ── War Challenge Dialogue Generator (traits-based) ──
function getWarChallengeDialogue(fighter, orgName) {
  const ch = ALL_CHARS.find(c => c.id === fighter.id);
  const role = ch ? ch.role : 'Neutral';
  const traits = ch ? (ch.traits || []) : [];
  const style = ch ? ch.style : 'Allround';
  const name = fighter.name;

  // Heel lines
  const heelLines = [
    `フン…${orgName}如きが調子に乗りすぎよ。\n格の違い、教えてあげる。`,
    `あなたたちの団体、潰させてもらうわ。\n覚悟はいいかしら？`,
    `弱小団体が目障りなのよ。\nこの${name}が直々に始末してあげる。`,
    `せいぜい足掻いてみなさい。\n結果は最初から決まってるけどね。`,
  ];
  // Babyface lines
  const babyfaceLines = [
    `${orgName}の皆さん、勝負しませんか？\n全力でぶつかり合いましょう！`,
    `うちの選手たちは負けません！\n正々堂々、受けて立ちます！`,
    `いい試合がしたいんです。\nお互い全力で戦いましょう！`,
    `${orgName}の強さ、この目で確かめたい。\n対抗戦、申し込みます！`,
  ];
  // Neutral lines
  const neutralLines = [
    `…対抗戦、やりましょう。\nどちらが上か、はっきりさせたい。`,
    `あなたたちの実力、試させてもらう。\n逃げないでよね。`,
    `団体の看板背負って戦う…\nそういうのも、悪くないわ。`,
    `興味があるの。\n${orgName}がどこまでやれるか。`,
  ];

  // Trait-specific overrides
  if (traits.includes('威圧感')) {
    return `…来い。\n${name}が相手だ。逃げ場はないぞ。`;
  }
  if (traits.includes('破天荒')) {
    return `やっほー！対抗戦だって！\n面白そうじゃん、やろうやろう！`;
  }
  if (traits.includes('リーダー気質')) {
    return `うちの選手たちを信じてる。\n団体の誇りを懸けて、勝負よ。`;
  }
  if (traits.includes('負けず嫌い')) {
    return `負けるわけにはいかない。\nこの対抗戦、絶対に勝つ！`;
  }
  if (traits.includes('闘志')) {
    return `燃えてきた…！\n全力で叩き潰してやる！`;
  }
  if (traits.includes('ファンサービス')) {
    return `ファンの皆さんに最高の試合を見せたい！\n対抗戦、楽しみましょう！`;
  }
  if (traits.includes('反骨心')) {
    return `…売られた喧嘩は買うわよ。\nむしろ望むところ。`;
  }

  // Fall back to role-based
  const pool = role === 'Heel' ? heelLines : role === 'Babyface' ? babyfaceLines : neutralLines;
  const seed = (fighter.id * 7 + (G.season || 1) * 13) % pool.length;
  return pool[seed];
}

// ── War Challenge Popup (F3: president delivers the challenge) ──
function showWarChallenge() {
  const ev = G.pendingEvent;
  if (!ev || ev.type !== 'war') return;
  Audio.play('war');

  // Switch to tension BGM
  Audio.bgm.play('tension');

  const aiOrg = Engine.rival.getOrgInfo(G.aiOrgs, ev.opponentOrgId);
  if (!aiOrg) { skipEvent(); return; }

  // Find enemy ace (highest OVR, non-injured)
  const enemyAce = Engine.event.getAce(aiOrg.roster);
  if (!enemyAce) { skipEvent(); return; }

  const orgCfg = RIVAL_ORGS.find(o => o.id === ev.opponentOrgId) || {color:'#e74c3c'};

  const dialogue = getWarChallengeDialogue(enemyAce, G.orgName || 'あんたの団体');
  const aceOvr = Engine.util.ov(enemyAce);

  const overlay = document.getElementById('confirmOverlay');
  const box = document.getElementById('confirmBox');

  // Build dramatic popup
  let html = '';
  // Dark gradient header with "挑戦状" badge
  html += `<div style="text-align:center;margin:-20px -20px 0 -20px;padding:20px 20px 16px;background:linear-gradient(180deg,${orgCfg.color}30,transparent);border-radius:12px 12px 0 0">`;
  html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:4px;color:${orgCfg.color};margin-bottom:8px;text-transform:uppercase">📜 挑 戦 状 📜</div>`;
  html += `<div style="font-size:18px;font-weight:900;color:var(--text-main)">${ev.opponentName}</div>`;
  html += `<div style="font-size:12px;color:var(--text-sub);margin-top:4px">${ev.matchCount}試合の団体対決</div>`;
  html += `</div>`;

  // Enemy ace portrait (large, central)
  const aceUrl = getPortraitUrl(enemyAce.id);
  html += `<div style="text-align:center;margin:20px 0 12px">`;
  if (aceUrl) {
    html += `<img src="${aceUrl}" style="width:140px;height:140px;border-radius:50%;border:4px solid ${orgCfg.color};box-shadow:0 0 30px ${orgCfg.color}44,0 0 60px ${orgCfg.color}22;object-fit:cover" alt="">`;
  } else {
    const initial = enemyAce.name.charAt(0);
    html += `<div style="width:140px;height:140px;border-radius:50%;border:4px solid ${orgCfg.color};box-shadow:0 0 30px ${orgCfg.color}44;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${orgCfg.color}33,${orgCfg.color}11);font-size:53px;font-weight:900;color:${orgCfg.color}">${initial}</div>`;
  }
  html += `<div style="margin-top:8px;font-size:16px;font-weight:700;color:${orgCfg.color}">${enemyAce.name}</div>`;
  html += `<div style="font-size:11px;color:var(--text-sub)">OVR ${aceOvr} ・ ${enemyAce.style}</div>`;
  html += `</div>`;

  // Dialogue bubble
  const dialogueHtml = dialogue.replace(/\n/g, '<br>');
  html += `<div style="background:var(--panel-bg);border:1px solid ${orgCfg.color}44;border-radius:12px;padding:16px 20px;margin:0 8px 16px;position:relative">`;
  html += `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid ${orgCfg.color}44"></div>`;
  html += `<p style="font-size:14px;line-height:1.7;text-align:center;color:var(--text-main);margin:0">「${dialogueHtml}」</p>`;
  html += `</div>`;

  // Accept / Decline buttons
  html += `<div style="text-align:center;font-size:13px;color:var(--text-sub);margin-bottom:12px">この挑戦を受けますか？</div>`;
  html += `<div class="btn-row" style="justify-content:center;gap:12px">`;
  html += `<button class="btn btn-gold" style="min-width:140px;padding:12px 24px;font-size:15px;font-weight:700" onclick="document.getElementById('confirmOverlay').classList.remove('active');acceptWarChallenge()">⚔ 受けて立つ！</button>`;
  html += `<button class="btn" style="min-width:100px;padding:12px 20px;font-size:13px;background:var(--bg-mid);color:var(--text-sub)" onclick="document.getElementById('confirmOverlay').classList.remove('active');skipEvent()">辞退する</button>`;
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
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
function _warHeader(orgCfg, playerOrgName, enemyOrgName, playerScore, enemyScore, resolved, total, statusCfg) {
  const eColor = orgCfg.color || '#e74c3c';
  const eLight = _lightenColor(eColor);
  const pctFill = total > 0 ? Math.round(resolved / total * 100) : 0;
  return `<div class="war-header">
    <div class="war-header-bg">
      <img src="../image/battle-bg_venue_4.webp" alt="" onerror="this.style.display='none'">
      <div class="split-left" style="background:linear-gradient(90deg,rgba(52,152,219,0.2) 0%,rgba(52,152,219,0.05) 70%,transparent 100%)"></div>
      <div class="split-right" style="background:linear-gradient(-90deg,${_rgba(eColor,0.25)} 0%,${_rgba(eColor,0.05)} 70%,transparent 100%)"></div>
      <div class="vignette"></div>
    </div>
    <div class="war-header-content">
      <div class="war-title-area">
        <div class="war-sup" style="color:${eColor}">${statusCfg.supText || '⚔ Interpromotional War'}</div>
        <div class="war-main-title">${statusCfg.mainTitle || '対 抗 戦'}</div>
      </div>
      <div class="scoreboard">
        <div class="sb-side left">
          <div class="sb-org-name" style="color:#74b9ff">${playerOrgName}</div>
          ${statusCfg.playerSub ? `<div class="sb-org-sub">${statusCfg.playerSub}</div>` : ''}
        </div>
        <div class="sb-center">
          <div class="sb-ring" style="border:3px solid rgba(200,190,170,0.1);box-shadow:0 0 40px ${_rgba(eColor,0.2)},inset 0 0 30px rgba(0,0,0,0.5);background:radial-gradient(circle,rgba(16,16,30,0.95),rgba(10,10,20,0.98))">
            ${statusCfg.scoreHtml || `<div class="sb-score"><span class="s-left" style="color:#74b9ff">${playerScore}</span><span class="s-dash">—</span><span class="s-right" style="color:${eLight}">${enemyScore}</span></div>`}
            ${statusCfg.statusLabel || ''}
          </div>
        </div>
        <div class="sb-side right">
          <div class="sb-org-name" style="color:${eLight}">${orgCfg.emoji || ''} ${enemyOrgName}</div>
          ${statusCfg.enemySub ? `<div class="sb-org-sub">${statusCfg.enemySub}</div>` : ''}
        </div>
      </div>
    </div>
  </div>
  <div class="progress-bar"><div class="progress-fill" style="width:${pctFill}%;background:linear-gradient(90deg,#74b9ff,#3498db)"></div></div>`;
}
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
  const eLight = _lightenColor(eColor);
  const pColor = '#74b9ff';

  const resolved = wp.results.filter(r => r !== null).length;
  const total = wp.card.length;
  let playerWins = 0, aiWins = 0;
  wp.results.forEach(r => { if (r) { if (r.playerWon) playerWins++; else aiWins++; } });

  const statusText = playerWins > aiWins ? '勝ち越し中' : playerWins === aiWins ? (resolved > 0 ? 'タイ' : '試合開始') : '負け越し中';
  const statusColor = playerWins > aiWins ? pColor : playerWins === aiWins ? '#888' : '#e74c3c';

  let nextIdx = -1;
  for (let i = 0; i < total; i++) { if (wp.results[i] === null) { nextIdx = i; break; } }

  let html = _warHeader(orgCfg, G.orgName || 'プレイヤー団体', ev.opponentName, playerWins, aiWins, resolved, total, {
    statusLabel: `<div class="sb-status" style="color:${statusColor}">${statusText}</div>`
  });

  html += `<div class="match-wrap">`;
  // 表示: メイン(上) → 前座(下)
  for (let di = total - 1; di >= 0; di--) {
    const idx = di;
    const m = wp.card[idx];
    const pf = m.playerFighter;
    const af = m.aiFighter;
    const result = wp.results[idx];
    const isResolved = result !== null;
    const isNext = idx === nextIdx;
    const matchNum = idx + 1;

    if (isResolved) {
      // 完了: コンパクト1行
      const wName = result.playerWon ? pf.name : af.name;
      const lName = result.playerWon ? af.name : pf.name;
      const wColor = result.playerWon ? pColor : eLight;
      const mqColor = result.mq >= 70 ? '#daa520' : result.mq >= 50 ? '#888' : '#555';
      html += `<div class="war-md">
        <div class="war-md-n">第${matchNum}試合</div>
        <div class="war-md-c"><div class="war-md-main"><div class="war-md-w"><span class="w" style="color:${wColor}">✓ ${wName}</span> <span style="color:#555">def.</span> ${lName}</div><div class="war-md-r">${Engine.formatFinish(result.finType, result.finMove)}</div></div><div class="war-md-mq" style="color:${mqColor}">MQ ${result.mq}</div></div>
      </div>`;
    } else if (isNext) {
      // 現在の試合: 大カード
      const ovrL = Engine.util.ov(pf), ovrR = Engine.util.ov(af);
      const standL = getStandUrl(pf.id), standR = getStandUrl(af.id);
      const lineL = pickDialogueLine(PPV_OPPONENT_LINES, pf);
      const lineR = pickDialogueLine(PPV_OPPONENT_LINES, af);

      html += `<div class="war-mc" style="border:2px solid transparent;border-image:linear-gradient(90deg,#3498db,#444,${eColor}) 1">
        <div class="mc-split-bg">
          <div class="mc-bg-left" style="background:linear-gradient(135deg,rgba(52,152,219,0.08),rgba(10,10,25,0.98) 60%)"></div>
          <div class="mc-bg-right" style="background:linear-gradient(-135deg,${_rgba(eColor,0.08)},rgba(10,10,25,0.98) 60%)"></div>
          <div class="mc-bg-center"></div>
        </div>
        <div class="mc-inner">
          <div class="mc-mn">第 ${matchNum} 試 合</div>`;

      // セリフ
      if (lineL || lineR) {
        html += `<div class="mc-dl">`;
        if (lineL) html += `<div class="mc-dlc left"><div class="mc-dlb"><div class="mc-dlsp" style="color:#3498db">${pf.name}</div>「${lineL}」</div></div>`;
        if (lineR) html += `<div class="mc-dlc right"><div class="mc-dlb"><div class="mc-dlsp" style="color:${eColor}">${af.name}</div>「${lineR}」</div></div>`;
        html += `</div>`;
      }

      // スタンド画像
      html += `<div class="mc-va">
        <div class="mc-fc left">
          <div class="mc-fi">
            <div class="mc-fn">${pf.name}</div>
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
            <div class="mc-fn">${af.name}</div>
            <div class="mc-fo" style="color:${eLight}">${orgCfg.emoji || ''} ${ev.opponentName}</div>
            <div class="mc-fol">OVR</div>
            <div class="mc-fov" style="background:linear-gradient(180deg,${eLight},${eColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${ovrR}</div>
          </div>
        </div>
      </div>`;

      // ステータスバー
      html += `<div class="mc-stats">`;
      html += _warStatRow('PW', pf.pw||0, af.pw||0, 'pw', pColor, eLight);
      html += _warStatRow('SP', pf.sp||0, af.sp||0, 'sp', pColor, eLight);
      html += _warStatRow('TE', pf.te||0, af.te||0, 'te', pColor, eLight);
      html += _warStatRow('ST', pf.st||0, af.st||0, 'st', pColor, eLight);
      html += _warStatRow('MN', pf.mn||0, af.mn||0, 'mn', pColor, eLight);

      // トレイト
      const pTraits = (pf.traits || []).slice(0, 3);
      const aTraits = (af.traits || []).slice(0, 3);
      if (pTraits.length || aTraits.length) {
        html += `<div class="mc-traits" style="padding-left:0;padding-right:0;margin-top:4px">
          <div class="mc-ts left">${pTraits.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
          <div class="mc-tdiv"></div>
          <div class="mc-ts right">${aTraits.map(t => `<span class="mc-tt">${typeof t === 'string' ? t : t.name || t}</span>`).join('')}</div>
        </div>`;
      }
      html += `</div>`;

      // ボタン
      html += `<div class="mc-act">
        <button class="mc-bw" style="border:2px solid ${eColor};background:linear-gradient(135deg,${_rgba(eColor,0.15)},${_rgba(eColor,0.03)})" onclick="App.warWatchMatch(${idx})">🎬 試合を観る</button>
        <button class="mc-bs" onclick="App.warSkipMatch(${idx})">≫ スキップ</button>
      </div>`;

      html += `</div></div>`;
    } else {
      // 未到達: 霧表示
      html += `<div class="war-mw"><div class="war-mw-h">第${matchNum}試合</div><div class="war-mw-n">${pf.name} vs ${af.name}</div></div>`;
    }
  }
  html += `</div>`;

  // Skip all
  const remaining = wp.results.filter(r => r === null).length;
  if (remaining > 0) {
    html += `<div class="war-skip-all"><button onclick="App.warSkipAll()">残り全試合をスキップ（${remaining}試合）</button></div>`;
  }

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── Post-War Dialogue Generator ──
function getWarPostDialogue(fighter, orgName, eventWon, playerWins, aiWins) {
  const ch = ALL_CHARS.find(c => c.id === fighter.id);
  const role = ch ? ch.role : 'Neutral';
  const traits = ch ? (ch.traits || []) : [];
  const name = fighter.name;

  if (eventWon) {
    // Player won — enemy is frustrated/defeated
    if (traits.includes('威圧感')) return `…馬鹿な。この${name}が負けるだと…？\n覚えてなさい。次は必ず潰す。`;
    if (traits.includes('破天荒')) return `えぇ〜！負けちゃったぁ？\nまぁいいや、次は絶対勝つから！`;
    if (traits.includes('負けず嫌い')) return `くっ…！こんなの認めない…！\n絶対にリベンジしてやるから！`;
    if (traits.includes('闘志')) return `…悔しい。でも、この悔しさは忘れない。\n次こそ叩き潰す…！`;
    if (traits.includes('リーダー気質')) return `完敗ね…。でも、うちの子たちは一生懸命やった。\n次はもっと強くなって戻ってくるわ。`;
    if (traits.includes('ファンサービス')) return `今日は負けちゃいました…。\nでも次は絶対ファンの皆に勝利を届けます！`;
    if (traits.includes('努力家')) return `…まだまだ足りないんだ。\nもっと練習して、もっと強くならなきゃ。`;
    if (traits.includes('反骨心')) return `…ちっ。まさかウチに負けるとは。\n…いい気になってろ。次は潰す。`;
    // Role fallback — loss
    if (role === 'Heel') {
      const pool = [
        `フン…今回は見逃してあげるわ。\n次会った時が、あなたの最後よ。`,
        `こんな結果…認めない。\n必ずこの屈辱は返す！`,
        `たまたまよ、たまたま…！\n調子に乗らないことね。`,
      ];
      return pool[(fighter.id * 11 + (G.season || 1) * 3) % pool.length];
    }
    if (role === 'Babyface') {
      const pool = [
        `負けちゃった…悔しいです。\nでも、この経験を次に活かします！`,
        `あなたたちの団体…強かった。\n認めます。でも、次こそは！`,
        `いい試合でした…本当に。\nまたいつか、勝負してください！`,
      ];
      return pool[(fighter.id * 11 + (G.season || 1) * 3) % pool.length];
    }
    // Neutral loss
    const pool = [
      `…やるじゃない。今日は負けを認めるわ。\nでも、次は分からないわよ？`,
      `ふぅん…。悔しくないって言ったら嘘になるわね。\n…次は覚悟しなさい。`,
      `この結果は受け止める。\n…でも、借りは必ず返す。`,
    ];
    return pool[(fighter.id * 11 + (G.season || 1) * 3) % pool.length];
  } else {
    // Player lost — enemy is victorious/triumphant
    if (traits.includes('威圧感')) return `…当然の結果だ。\n身の程を知りなさい。`;
    if (traits.includes('破天荒')) return `やったぁ！勝っちゃった〜！\nほらほら、${orgName}さんもっと頑張って！`;
    if (traits.includes('負けず嫌い')) return `勝った…！この勝利、絶対に手放さない！\nもっともっと強くなってやる！`;
    if (traits.includes('闘志')) return `燃え尽きた…でも、最高の気分だ。\nこの勝利は団体の誇りだ！`;
    if (traits.includes('リーダー気質')) return `みんな、よく戦ったわ。\nこの勝利はチーム全員のものよ！`;
    if (traits.includes('ファンサービス')) return `ファンの皆さん、勝ちましたよー！\n応援ありがとうございます！`;
    if (traits.includes('努力家')) return `努力は報われるんだ…！\nみんなの練習の成果が出た…嬉しい！`;
    if (traits.includes('反骨心')) return `…当たり前よ。\n舐めた連中には相応の結果を見せてやっただけ。`;
    // Role fallback — win
    if (role === 'Heel') {
      const pool = [
        `ふふふ…予想通りの結果ね。\n${orgName}なんて、この程度よ。`,
        `圧倒的だったでしょ？\nまた挑戦する勇気があるなら、いつでもどうぞ？`,
        `弱い。弱すぎるわ。\nもう二度と歯向かわないことね。`,
      ];
      return pool[(fighter.id * 11 + (G.season || 1) * 3) % pool.length];
    }
    if (role === 'Babyface') {
      const pool = [
        `勝てて嬉しいです！\nでも${orgName}のみなさんも、すごく強かった！`,
        `いい対抗戦でした！\nまたいつか、全力でぶつかり合いましょう！`,
        `この勝利を、応援してくれた皆に捧げます！\n本当にありがとう！`,
      ];
      return pool[(fighter.id * 11 + (G.season || 1) * 3) % pool.length];
    }
    // Neutral win
    const pool = [
      `…まぁ、こんなものね。\n力の差は歴然だったわ。`,
      `いい勝負だった…と言いたいところだけど。\nもう少し頑張ってほしかったわね。`,
      `勝ちは勝ち。\n…次はもっと本気を出させてくれる？`,
    ];
    return pool[(fighter.id * 11 + (G.season || 1) * 3) % pool.length];
  }
}

// ── War Final Result Overlay (with post-match dialogue) ──
function renderWarFinalResult(ev, results, playerWins, aiWins, eventWon) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  const orgCfg = RIVAL_ORGS.find(o => o.id === ev.opponentOrgId) || {color:'#e74c3c', emoji:''};
  const eColor = orgCfg.color;
  const eLight = _lightenColor(eColor);
  const total = results.length;

  // Find enemy ace for dialogue
  const aiOrg = Engine.rival.getOrgInfo(G.aiOrgs, ev.opponentOrgId);
  const enemyAce = aiOrg ? Engine.event.getAce(aiOrg.roster) : (results[0] ? results[0].aiFighter : null);

  // 勝敗ラベル
  const winLabel = playerWins > aiWins ? '🏆 勝 ち 越 し ！' : playerWins === aiWins ? '引 き 分 け' : '負 け 越 し …';
  const scoreLabelHtml = eventWon
    ? `<div class="sb-win-label">${winLabel}</div>`
    : `<div style="margin-top:2px;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:4px;color:${playerWins === aiWins ? '#888' : '#e74c3c'}">${winLabel}</div>`;

  // フレーバーテキスト
  const tierLabel = orgCfg.tier === 'S' ? 'Sランク王者' : orgCfg.tier === 'A' ? 'Aランク挑戦者' : 'Bランク';
  let flavorHtml = '';
  if (eventWon) {
    flavorHtml = `<div class="flavor-text"><em>${tierLabel}・${ev.opponentName}に勝利！</em><br>団体の格が上がった！</div>`;
  } else if (playerWins < aiWins) {
    flavorHtml = `<div class="flavor-text" style="color:var(--text-sub)">${tierLabel}・${ev.opponentName}に敗北…<br>悔しさをバネに這い上がれ</div>`;
  }

  let html = _warHeader(orgCfg, G.orgName || 'プレイヤー団体', ev.opponentName, playerWins, aiWins, total, total, {
    supText: '⚔ Interpromotional War — Result',
    mainTitle: '対 抗 戦 結 果',
    scoreHtml: `<div class="sb-score-grid"><span class="s-num" style="color:#74b9ff">${playerWins}</span><span class="s-dash">—</span><span class="s-num" style="color:${eLight}">${aiWins}</span></div>`,
    statusLabel: scoreLabelHtml
  });

  html += flavorHtml;

  // 各試合結果
  html += `<div class="results-area">`;
  results.forEach((r, i) => {
    const pFace = getPortraitUrl(r.playerFighter.id);
    const aFace = getPortraitUrl(r.aiFighter.id);
    const mqColor = r.mq >= 70 ? 'var(--gold)' : r.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';

    html += `<div class="match-result-card">
      <div class="mr-label">第 ${i+1} 試 合</div>
      <div class="mr-fighters">
        <div class="mr-fighter ${r.playerWon ? 'win' : 'lose'}">
          ${pFace ? `<img src="${pFace}" class="portrait" alt="" onerror="this.style.display='none'">` : `<div class="portrait" style="width:72px;height:72px;background:#222;display:flex;align-items:center;justify-content:center;font-size:24px">${r.playerFighter.name.charAt(0)}</div>`}
          <div class="fname">${r.playerFighter.name}</div>
        </div>
        <div class="mr-vs-area"><div class="mr-vs-text">VS</div></div>
        <div class="mr-fighter ${r.playerWon ? 'lose-enemy' : 'win-enemy'}">
          ${aFace ? `<img src="${aFace}" class="portrait" alt="" onerror="this.style.display='none'"  style="border-color:${r.playerWon ? '' : eColor}">` : `<div class="portrait" style="width:72px;height:72px;background:#222;display:flex;align-items:center;justify-content:center;font-size:24px">${r.aiFighter.name.charAt(0)}</div>`}
          <div class="fname">${r.aiFighter.name}</div>
        </div>
      </div>
      <div class="mr-result-info">
        <span class="mr-result-tag ${r.playerWon ? 'win' : 'lose'}">${r.playerWon ? 'WIN' : 'LOSE'}</span>
        <span class="mr-mq" style="color:${mqColor}">MQ ${r.mq}</span>
        <span class="mr-finish">${Engine.formatFinish(r.finType, r.finMove)}</span>
      </div>
    </div>`;
  });
  html += `</div>`;

  // 報酬
  html += `<div class="war-rewards">`;
  if (eventWon) {
    html += `<div style="display:flex;align-items:center;gap:4px"><span style="color:var(--gold)">⬆</span> 団体人気UP</div>`;
  }
  html += `<div style="display:flex;align-items:center;gap:4px"><span style="color:var(--gold)">⚔</span> 対戦ptボーナス</div>`;
  html += `<div style="display:flex;align-items:center;gap:4px"><span style="color:var(--green)">📈</span> Heat変動</div>`;
  html += `</div>`;

  // 敵エースセリフ
  if (enemyAce) {
    const dialogue = getWarPostDialogue(enemyAce, G.orgName || 'あんたの団体', eventWon, playerWins, aiWins);
    const upperUrl = getUpperUrl(enemyAce.id);
    const dialogueHtml = dialogue.replace(/\n/g, '<br>');

    html += `<div class="ace-area">
      <div class="ace-img-wrap">
        <div class="ace-upper${eventWon ? ' defeated' : ''}">
          ${upperUrl ? `<img src="${upperUrl}" alt="${enemyAce.name}" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="ace-name" style="color:${eColor}">${enemyAce.name}</div>
      </div>
      <div class="ace-speech">
        <div class="ace-bubble">
          <div class="speaker" style="color:${eColor}">${ev.opponentName}エース — ${enemyAce.name}</div>
          <p>「${dialogueHtml}」</p>
        </div>
      </div>
    </div>`;
  }

  // 閉じるボタン
  html += `<div class="war-close-area">
    <button class="war-close-btn" onclick="closeWarFinalResult(${eventWon})">閉じる</button>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

function closeWarFinalResult(eventWon) {
  document.getElementById('showResultOverlay').classList.remove('active');
  if (eventWon) { Audio.bgm.playJingle('victory'); }
  else { Audio.play('defeat'); }
  setTimeout(() => { Audio.bgm.play('management'); refreshAll(); }, eventWon ? 2000 : 500);
}

// ── R3 モーダル: 仲良し退団/引退演出 ──
function showR3Modal({ fighterName, fighterFace, departedName, reason, line }) {
  if (_isPopupActive()) { _popupQueue.push(() => showR3Modal({ fighterName, fighterFace, departedName, reason, line })); return; }
  const overlay = document.createElement('div');
  overlay.className = 'r3-modal-overlay';

  const isRetired = reason && (reason.includes('引退') || reason === 'retired');
  const departureText = isRetired
    ? `${departedName} が引退した。`
    : `${departedName} が去った。`;

  const faceHtml = fighterFace
    ? `<div class="r3-modal-face"><img src="${fighterFace}" alt="${fighterName}" /></div>`
    : '';

  overlay.innerHTML = `
    <div class="r3-modal">
      ${faceHtml}
      <p class="r3-modal-departure">${departureText}</p>
      <p class="r3-modal-name">${fighterName}</p>
      <p class="r3-modal-line">${line}</p>
      <button class="r3-modal-close">閉じる</button>
    </div>
  `;

  overlay.querySelector('.r3-modal-close').addEventListener('click', () => {
    overlay.remove();
    _drainPopupQueue();
  });

  document.body.appendChild(overlay);
}

function showConfirm(msg, yesLabel, onYes) {
  Audio.play('notify');
  const overlay = document.getElementById('confirmOverlay');
  const box = document.getElementById('confirmBox');
  window._confirmYes = onYes;
  box.innerHTML = `<div style="margin-bottom:16px;font-size:14px">${msg}</div>
    <div class="btn-row" style="justify-content:center">
      <button class="btn btn-gold" onclick="document.getElementById('confirmOverlay').classList.remove('active');if(window._confirmYes)window._confirmYes()">${yesLabel}</button>
      <button class="btn btn-blue" onclick="document.getElementById('confirmOverlay').classList.remove('active')">いいえ</button>
    </div>`;
  overlay.classList.add('active');
}

function showRosterOverflowSigningModal(pending) {
  if (!pending) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const fighter = pending.fighter || {};
  const releaseCandidates = (G.roster || []).filter(c => !c.isRental && !c.lastRun);
  const sourceLabel = pending.source === 'negotiation' ? '交渉成立選手' : '加入予定選手';
  let html = '';
  html += `<div style="text-align:center;font-size:20px;font-weight:900;color:var(--gold);margin-bottom:12px">所属上限に達しています</div>`;
  html += `<div style="text-align:center;font-size:13px;color:var(--text-sub);margin-bottom:14px">1名解雇すると、この選手と契約できます。</div>`;
  html += `<div style="padding:12px 14px;margin-bottom:14px;border-radius:10px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.22)">`;
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">${sourceLabel}</div>`;
  html += `<div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px">${fighter.name || '選手'}</div>`;
  html += `<div style="font-size:12px;color:var(--text-sub)">OVR ${Engine.util.ov(fighter || {})} ｜ ${fighter.age || '?'}歳 ｜ 契約金 ${pending.cost || 0}万</div>`;
  html += `</div>`;
  if (releaseCandidates.length === 0) {
    html += `<div style="font-size:13px;color:var(--text-sub);text-align:center;margin-bottom:14px">解雇できる所属選手がいません。</div>`;
  } else {
    html += `<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">解雇する選手を選んでください</div>`;
    html += `<div style="display:grid;gap:8px;max-height:320px;overflow-y:auto;margin-bottom:12px">`;
    releaseCandidates.forEach(c => {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:rgba(200,190,170,0.03);border:1px solid rgba(200,190,170,0.08)">`;
      html += `<div><div style="font-size:14px;font-weight:700;color:var(--text)">${c.name}</div><div style="font-size:12px;color:var(--text-sub)">OVR ${ov(c)} ｜ ${c.age || '?'}歳</div></div>`;
      html += `<button class="btn btn-gold" style="padding:8px 12px;font-size:12px;white-space:nowrap" onclick="confirmRosterOverflowSigning(${c.id})">解雇して契約</button>`;
      html += `</div>`;
    });
    html += `</div>`;
  }
  html += `<div style="display:flex;justify-content:center"><button class="btn" style="min-width:120px;padding:10px 22px;background:var(--bg-mid);color:var(--text-sub)" onclick="cancelRosterOverflowSigning()">やめる</button></div>`;
  box.innerHTML = html;
  overlay.classList.add('active');
  Audio.play('notify');
}

function confirmRosterOverflowSigning(releaseId) {
  document.getElementById('showResultOverlay').classList.remove('active');
  App.confirmRosterOverflowSigning(releaseId);
}

function cancelRosterOverflowSigning() {
  document.getElementById('showResultOverlay').classList.remove('active');
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
  html += `<span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${signingCost.toLocaleString()}万</span>`;
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
  const teachingMult = COACH_RANKS[c.teaching] || 1.0;
  const traitDef = COACH_TRAIT_DEFS[c.trait] || {};
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
        <span class="coach-trait">${c.trait}</span>
        ${isHired ? '<span style="font-size:12px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 6px;border-radius:3px">雇用中</span>' : ''}
      </div>
      <div style="font-size:13px;color:var(--text);line-height:1.8">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <span style="color:var(--text-sub)">指導力 <strong style="color:${color}">${c.teaching}</strong></span>
          <span style="color:var(--text-sub)">観察眼 <strong style="color:${color}">${c.observation}</strong></span>
          <span style="color:var(--text-sub)">得意 <span class="badge badge-${c.style}" style="font-size:12px;padding:1px 6px">${c.style}</span></span>
        </div>
        <div style="margin-top:4px;color:var(--text-sub);font-size:12px">成長倍率 <strong style="color:var(--gold)">×${teachingMult}</strong></div>
      </div>
    </div>`;

  html += `</div>`;

  // Body
  html += '<div class="coach-tooltip-body">';

  // Trait
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">特性: ${c.trait}</div>
    <div style="font-size:13px;color:var(--text);line-height:1.6">${traitDef.desc || ''}</div>
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
const EVENT_QUOTES = {
  coachHire: [
    '一緒に頑張りましょう！期待してください。',
    'お任せください。選手たちを鍛え上げてみせます！',
    'この団体で働けて光栄です。全力でサポートします。',
    '腕が鳴りますね…。素晴らしい選手たちだ。'
  ],
  coachFire: [
    'そうですか…。今までありがとうございました。',
    'お世話になりました。選手たちによろしくお伝えください。',
    '残念ですが…また機会があれば。',
  ],
  draftJoin: [
    'この団体を選んでくれてありがとうございます！全力で戦います！',
    '期待に応えてみせます！最高の選手になります！',
    '夢に一歩近づいた…！精一杯頑張ります！',
    '信じてくれたこの恩、リングで返します！',
    'よろしくお願いします！たくさん試合がしたいです！',
    'この日をずっと待っていました…！'
  ],
  // v1.0: Draft candidate speech (when focused in draft)
  draftInterest: {
    normal: {
      _default: ['よろしくお願いします。精一杯やります', '選んでいただけたら、全力で頑張ります'],
      ojousama: ['お選びいただけるなら、精一杯努めますわ'],
      delinquent: ['選んでくれるなら、全力で暴れるぜ'],
      seductive: ['選んでくれるなら…期待に応えるわよ'],
    },
    bold: {
      _default: ['てっぺんを獲る。それ以外に興味はない', '私を選んでくれるなら、絶対に後悔はさせない！'],
      ojousama: ['頂点に立つために参りますわ。覚悟はよろしくて？'],
      delinquent: ['選ぶなら覚悟しろよ。手加減なんかしねえからな'],
      cool: ['…闘わせてくれ。結果で語る'],
      seductive: ['私を選んで。後悔はさせないわ'],
    },
    quiet: {
      _default: ['………よろしくお願いします'],
      cool: ['…戦わせてくれるなら、応える'],
      polite: ['…選んでいただけたら、精一杯やらせていただきます'],
    },
    shy: {
      _default: ['あ、あの…私なんかで良ければ…が、頑張ります…'],
    },
    easygoing: {
      _default: ['えへへ、一緒に楽しくやりましょうよ！', '退屈なプロレスはしないって約束するよ！'],
      delinquent: ['楽しくやろうぜ！退屈なのは嫌いだからな！'],
      seductive: ['一緒に楽しい団体を作りましょう？'],
    },
    earnest: {
      _default: ['地道にコツコツ…それが私のやり方です。信じてもらえますか？', '誰よりも練習します。見ていてください'],
      polite: ['地道に努力するのが取り柄です。信じていただけますか'],
      ojousama: ['コツコツ積み重ねるのが信条ですの。見ていてくださいませ'],
      seductive: ['地道に頑張るタイプよ。見ていてくれる？'],
    },
    emotional: {
      _default: ['選んでくれたら…全力で…全力で頑張ります…！'],
    },
  },
  injury: [
    'うぅ…痛い…。でも、すぐ戻ります！',
    'すみません…しばらくお休みをいただきます…',
    'くっ…こんなところで…！必ず復帰します！',
    'ごめんなさい…体が言うことを聞かなくて…',
    'あぁっ…！リハビリ、頑張ります…！'
  ],
  titleWin: {
    normal: {
      _default: ['やった…！チャンピオンになれた…！夢みたい！', 'このベルト、絶対に手放しません！', '最高の気分です！応援ありがとうございます！'],
      ojousama: ['チャンピオンですわ…！夢のようですわね…！'],
      delinquent: ['やったぜ！チャンピオンだ！最高！'],
      seductive: ['チャンピオン…最高の気分ね'],
    },
    bold: {
      _default: ['てっぺんに立った。でもまだ足りない…もっと上へ', 'この炎は消えない。ベルトを懸けて、もっと熱い闘いを！'],
      ojousama: ['頂点に立ちましたわ。でもここからが本当の闘いですの'],
      delinquent: ['やっと獲ったぜ！次は誰が来ても負けねえ！'],
      cool: ['…当然だ。この座は私のためにある'],
      seductive: ['これが始まりよ。このベルトで時代を作る'],
    },
    quiet: {
      _default: ['………（ベルトを抱きしめている）'],
      cool: ['…ようやくだ。この座は渡さない'],
      polite: ['…ありがとうございます…（涙をこらえている）'],
    },
    shy: {
      _default: ['え…わ、私が…チャンピオン…？ 夢みたい…'],
    },
    easygoing: {
      _default: ['新チャンピオン誕生！みんな、これからもっと盛り上がるよ！', 'ベルト獲っちゃった！最高！'],
      delinquent: ['チャンピオンだぜー！最高だろ！'],
      seductive: ['ベルトが似合うのは私だけでしょ？ ふふ'],
    },
    earnest: {
      _default: ['コツコツ積み重ねてきて…よかった。本当に、よかった…！', '諦めなくてよかった…このベルト、努力の結晶です'],
      polite: ['積み重ねが報われました…本当に、ありがとうございます'],
      ojousama: ['努力が報われましたわ…！このベルト、大切にしますの'],
      seductive: ['積み重ねてきて…よかった。このベルト、大切にするわ'],
    },
    emotional: {
      _default: ['うわああ…！チャンピオン…！嬉しい…泣いちゃう…！'],
    },
  },
  // タイトル防衛成功（チャンピオン側）
  titleDefense: {
    normal: {
      _default: ['防衛成功…！ほっとした…。でも、もっと強くならないと。', 'このベルトの重さ、守るたびに感じます。'],
      ojousama: ['防衛いたしましたわ。この座、まだまだ譲りませんの'],
      delinquent: ['防衛だ！まだまだ渡さねーぞ！'],
      seductive: ['防衛成功…。このベルト、まだ返す気はないわ'],
    },
    bold: {
      _default: ['まだ誰にもこの座は譲れない。もっと来い！', '防衛は通過点。私が目指すのはもっと先だ'],
      ojousama: ['まだ誰にもお譲りしませんわ。もっと上を目指しますの'],
      delinquent: ['まだまだ負けるわけねーだろ！かかってこい！'],
      cool: ['…格が違う。それだけのことだ'],
      seductive: ['まだ誰も私を超えられないわね。当然でしょう'],
    },
    quiet: {
      _default: ['………（静かにベルトを見つめている）'],
      cool: ['…次も勝つ。それだけだ'],
      polite: ['…守れました。次も、頑張ります'],
    },
    shy: {
      _default: ['よ、よかった…守れた…（ほっとしている）'],
    },
    easygoing: {
      _default: ['チャンピオンは私！また守り切っちゃいました！', 'いい試合だった！また挑戦してきてね！'],
      delinquent: ['まだまだ渡さねーよ！最高！'],
      seductive: ['防衛って地味に見える？ ふふ、そんなことないでしょ？'],
    },
    earnest: {
      _default: ['防衛できた…！でも満足しない。もっと強くなります', '日々の積み重ねが結果に出てくれた'],
      polite: ['防衛できました。でも、まだまだ精進いたします'],
      ojousama: ['防衛できましたわ。でもまだ満足はしませんの'],
      seductive: ['防衛できたわ…でも満足しない。もっと強くなる'],
    },
    emotional: {
      _default: ['守れた…！嬉しい…！次も絶対守る…！'],
    },
  },
  // タイトル挑戦失敗（挑戦者側）
  titleChallengeLoss: {
    normal: {
      _default: ['悔しい…。でも、いい経験になりました。次こそは…！', 'まだ実力が足りなかった…。もっと強くなって帰ってきます。'],
      ojousama: ['悔しゅうございますわ…でも、次こそは…'],
      delinquent: ['くそっ…次は絶対勝つ…！'],
      seductive: ['悔しいわ…でも、次こそはね'],
    },
    bold: {
      _default: ['くっ…！こんなの認めない！もう一回やらせてくれ！', '…今日は認める。でもこの借りは必ず返す'],
      ojousama: ['認めませんわ…！もう一度お願いいたします！'],
      delinquent: ['こんなの認めねえ！もう一回だ！'],
      cool: ['…次はない。次で、終わらせる'],
      seductive: ['…今日は認めるわ。でもこの借り、必ず返す'],
    },
    quiet: {
      _default: ['………（唇を噛んでいる）'],
      cool: ['…次で終わらせる'],
      polite: ['…悔しいです。でも、もう一度挑戦します'],
    },
    shy: {
      _default: ['…ごめんなさい…でも…諦めたくない…です…'],
    },
    easygoing: {
      _default: ['今日は負けちゃったけど…次はもっといい試合するから！', '悔しいけど、下向いてたら応援してくれる人に失礼だもんね'],
      delinquent: ['くそー！悔しい！でも次やってやるからな！'],
      seductive: ['今日は負けちゃったわね。次はもっと輝くから見ていて'],
    },
    earnest: {
      _default: ['…足りなかった。もっと練習して、必ずもう一度挑戦します', '悔しい…でもここで腐っちゃだめだ'],
      polite: ['実力が足りませんでした。もっと精進いたします'],
      ojousama: ['実力が足りませんでしたわ…もっと精進いたしますの'],
      seductive: ['足りなかったわ…でも、もう一度挑戦する'],
    },
    emotional: {
      _default: ['悔しい…！悔しい…！でも…絶対諦めない…！'],
    },
  },
  // タイトル陥落（前王者側）
  titleLoss: {
    normal: {
      _default: ['ベルトを失ってしまった…。でも、この団体で戦い続けます。', '…悔しい。チャンピオンとしてもっとやれたはずなのに。'],
      ojousama: ['ベルトを失いましたわ…でも、ここで終わりではありませんの'],
      delinquent: ['くそ…ベルト取られた…でも終わりじゃねえ'],
      seductive: ['ベルトがない景色なんて…でも、ここで終わらないわ'],
    },
    bold: {
      _default: ['嘘だろ…！私のベルトが…！絶対に取り返す！', 'ベルトを失った…でもこの悔しさが次の炎になる'],
      ojousama: ['認めませんわ…！必ず取り返しますの！'],
      delinquent: ['こんなの認めねえ！絶対取り返す！'],
      cool: ['……次は、容赦しない'],
      seductive: ['…覚えておきなさい。すぐに返してもらうわ'],
    },
    quiet: {
      _default: ['……今は…一人にしてください'],
      cool: ['…認めよう。だが、終わりではない'],
      polite: ['…申し訳ございません。でも…もう一度…'],
    },
    shy: {
      _default: ['…ごめんなさい…ベルト…守れなかった…'],
    },
    easygoing: {
      _default: ['負けちゃった…でもファンが応援してくれる限り、立ち上がるよ', '…ベルトがない自分なんて想像できなかった。でも、私は私だから'],
      delinquent: ['くそー！でもまだ終わってねえから！'],
      seductive: ['負けちゃったわね…でも私は私。立ち上がるわ'],
    },
    earnest: {
      _default: ['…努力が足りなかったんだ。もう一度、一からやり直します', 'ベルトを手放してしまった…でもここで終わりじゃない'],
      polite: ['努力が足りませんでした。一から出直します'],
      ojousama: ['実力が足りませんでしたわ。一から出直しますの'],
      seductive: ['足りなかった…でも、ここで終わりにはしないわ'],
    },
    emotional: {
      _default: ['嘘…嘘だよ…ベルトが…！でも…でも諦めない…！'],
    },
  },
  release: [
    'そう…ですか。ここでの思い出、忘れません。',
    'お世話になりました…。どこかで強くなって戻ります。',
    '悔しいです…でも、ありがとうございました。',
  ],
  // v1.0c: FA signing lines (personality×archetype)
  faSigning: {
    normal: {
      _default: ['よろしくお願いします。力になれるよう頑張ります', '新しい環境…悪くないですね。頑張ります'],
      ojousama: ['よろしくお願いいたしますわ。お力になりますの'],
      delinquent: ['よろしくな。暴れさせてもらうぜ'],
      seductive: ['よろしくね。力になるわ'],
    },
    bold: {
      _default: ['てっぺんを獲るために来た。わかってるよな？', '新しい闘いの場…！燃えてきた！'],
      ojousama: ['頂点を獲るために参りましたわ。ご期待くださいませ'],
      delinquent: ['やってやるぜ！暴れまくるからな！'],
      cool: ['…戦わせてくれ。結果は出す'],
      seductive: ['てっぺん獲りに来たの。一緒に頂点に立ちましょう'],
    },
    quiet: {
      _default: ['…よろしくお願いします'],
      cool: ['…やる。見ていてくれ'],
      polite: ['…お世話になります。精一杯やらせていただきます'],
    },
    shy: {
      _default: ['あ、あの…よろしくお願いします…頑張ります…'],
    },
    easygoing: {
      _default: ['やっほー！新天地だ！暴れまくるよ！', 'ここなら好き放題やれそう！楽しみ！'],
      delinquent: ['よっしゃー！新天地だ！暴れるぞ！'],
      seductive: ['新しい場所ね。楽しみだわ。よろしく'],
    },
    earnest: {
      _default: ['ありがとうございます…毎日練習して、絶対に期待に応えます！', 'この恩は忘れません。ずっとこの団体で戦います'],
      polite: ['ありがとうございます。期待にお応えいたします'],
      ojousama: ['ありがとうございますわ。ご期待に応えてみせますの'],
      seductive: ['ありがとう。期待に応えるわ'],
    },
    emotional: {
      _default: ['ありがとうございます…！嬉しい…！全力で頑張ります…！'],
    },
  },
  faSigningGeneric: [
    'この団体で新しいスタートです。よろしくお願いします！',
    '契約ありがとうございます！全力で戦います！',
    '新しい仲間ができて嬉しいです。頑張ります！',
  ],
  // v2.x: FA welcome lines after signing (personality×archetype)
  faWelcome: {
    normal: {
      _default: ['よろしくお願いします。頑張ります', '力になれるよう、精一杯やります'],
      ojousama: ['よろしくお願いいたしますわ。精一杯務めますの'],
      delinquent: ['よろしくな！ガンガンやるぜ'],
      seductive: ['よろしくね。精一杯やるわ'],
    },
    bold: {
      _default: ['頂点まで一直線だ。邪魔はさせない', '燃えてきた…！早く試合がしたい！'],
      ojousama: ['頂点を目指しますわ。ご期待くださいませ'],
      delinquent: ['大暴れするぞー！覚悟しとけ！'],
      cool: ['…見ていろ。格の違いを証明する'],
      seductive: ['頂点まで一直線よ。見ていてね'],
    },
    quiet: {
      _default: ['…よろしくお願いします'],
      cool: ['…やるべきことをやる'],
      polite: ['…精一杯、頑張らせていただきます'],
    },
    shy: {
      _default: ['よ、よろしくお願いします…が、頑張ります…！'],
    },
    easygoing: {
      _default: ['わーい！今日から仲間だ！よろしく！', 'みんなで楽しくやりましょー！'],
      delinquent: ['よっしゃー！楽しくやろうぜ！'],
      seductive: ['よろしくね。楽しくやりましょう'],
    },
    earnest: {
      _default: ['毎日コツコツ、頑張ります！見ていてください！', 'この団体のために…全てを捧げます'],
      polite: ['毎日精進いたします。見ていてください'],
      ojousama: ['コツコツ頑張りますわ。見ていてくださいませ'],
      seductive: ['毎日頑張るわ。見ていてね'],
    },
    emotional: {
      _default: ['嬉しい…！よろしくお願いします…！頑張ります…！'],
    },
  },
  faWelcomeGeneric: [
    'よろしくお願いします！頑張ります！',
    '精一杯やります！応援してください！',
    '新しい仲間として、全力で頑張ります！',
  ],
  // v1.0c: Rental greeting lines (personality×archetype)
  rentalGreeting: {
    normal: {
      _default: ['レンタルですが、手は抜きませんので。よろしく', '短い間ですがよろしくお願いします'],
      ojousama: ['短い間ですが、よろしくお願いいたしますわ'],
      delinquent: ['よろしくな。手は抜かねーから'],
      seductive: ['短い間だけど、よろしくね'],
    },
    bold: {
      _default: ['レンタルだからって舐めるなよ！全試合全力だ！', 'よその団体でも闘志は変わらない！燃えるぞ！'],
      ojousama: ['レンタルでも手は抜きませんわよ！'],
      delinquent: ['レンタル？ 関係ねえ！暴れるぞ！'],
      cool: ['…手は抜かない。見ていろ'],
      seductive: ['レンタルでも全力よ。見ていてね'],
    },
    quiet: {
      _default: ['…短い間ですが、よろしくお願いします'],
      cool: ['…やるべきことはやる'],
      polite: ['…短い間ですが、精一杯務めさせていただきます'],
    },
    shy: {
      _default: ['あ、あの…短い間ですけど…よろしくお願いします…'],
    },
    easygoing: {
      _default: ['おじゃましまーす！短い間だけど暴れるよー！', '一時的だからこそ思い切り好き放題やるね！'],
      delinquent: ['おじゃまー！暴れさせてもらうぜ！'],
      seductive: ['お邪魔するわね。短い間だけど楽しみましょう'],
    },
    earnest: {
      _default: ['短い期間ですが、精一杯やらせていただきます！', '限られた時間でも成長したい。よろしくお願いします'],
      polite: ['短い間ですが、精一杯務めさせていただきます'],
      ojousama: ['短い間ですが、精一杯お務めいたしますわ'],
      seductive: ['短い間だけど、精一杯やるわ'],
    },
    emotional: {
      _default: ['よろしくお願いします…！短い間だけど…全力で…！'],
    },
  },
  rentalGreetingGeneric: [
    '短い間ですが、よろしくお願いします！',
    'お邪魔します。力になれたら嬉しいです！',
    'レンタルでも全力です。よろしくお願いします！',
  ]
};

// Event popup queue (multiple events can stack)
let _eventPopupQueue = [];
let _autoCloseTimer = null;

function showEventPopup(opts) {
  // opts: { type: 'fighter'|'coach', id, name, emoji?, message, detail?, tone: 'positive'|'negative'|'gold' }
  _eventPopupQueue.push(opts);
  if (_eventPopupQueue.length === 1) {
    _enqueuePopup(() => _renderEventPopup());
  }
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

  box.className = `event-popup ${toneClass}`;
  box.innerHTML = `
    <div class="event-popup-face">${faceHtml}</div>
    <div class="event-popup-name">${o.name || ''}</div>
    <div class="event-popup-msg">${o.message}</div>
    ${o.detail ? `<div class="event-popup-detail">${o.detail}</div>` : ''}
    <button class="event-popup-ok" onclick="closeEventPopup()">OK</button>
  `;
  document.getElementById('eventPopupOverlay').classList.add('active');
  Audio.play(o.sound || (o.tone === 'negative' ? 'error' : o.tone === 'gold' ? 'award' : 'event'));
  if (o.autoCloseMs) _autoCloseTimer = setTimeout(closeEventPopup, o.autoCloseMs);
}

function closeEventPopup() {
  clearTimeout(_autoCloseTimer); _autoCloseTimer = null;
  document.getElementById('eventPopupOverlay').classList.remove('active');
  _eventPopupQueue.shift();
  if (_eventPopupQueue.length > 0) {
    setTimeout(_renderEventPopup, 200);
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
  const box = document.getElementById('retirementPopupBox');
  const isInjury = r.route === 'injury_wear' || r.route === 'injury_career_ending';

  // Face
  let faceHtml = '';
  const url = getPortraitUrl(f.id);
  if (url) faceHtml = `<img src="${url}" alt="">`;
  else {
    const ch = ALL_CHARS.find(c => c.id === f.id);
    faceHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;background:linear-gradient(135deg,rgba(200,200,200,0.1),rgba(0,0,0,0.2))">${ch ? ch.name.charAt(0) : '?'}</div>`;
  }

  // Career years
  const careerYears = f.careerSeasons || Math.max(1, (f.age || 17) - (f.debutAge || 17));
  const dividerText = `━━ ${careerYears}年間の軌跡 ━━`;

  // Career summary
  const summary = r.summary || [];
  const careerHtml = summary.length > 0
    ? summary.map(item => `<div class="retirement-popup-career-item"><span class="retirement-popup-career-icon">${item.icon}</span><span>${item.text}</span></div>`).join('')
    : '<div style="color:var(--text-dim);text-align:center">記録なし</div>';

  // Record
  const wins = f.wins || 0, losses = f.losses || 0, draws = f.draws || 0;
  const recordText = `通算 ${wins}勝 ${losses}敗${draws > 0 ? ` ${draws}分` : ''}`;

  // Injury note
  let injuryNote = '';
  if (isInjury && r.injuryType) {
    injuryNote = `<div class="retirement-popup-injury-note">🏥 ${r.injuryType}</div>`;
  }

  // Vacancy note
  let vacancyNote = '';
  if (r.wasChampion) {
    vacancyNote = `<div class="retirement-popup-vacancy">🏆 王座返上</div>`;
  }

  // Button label
  const btnLabel = isInjury ? '……' : '送り出す';

  // §3: 引き留めボタン（wear 40-79、retainCount < 2、シーズン末のみ）
  const canRetain = r.canRetain && !isInjury;
  const retainCount = f.retainCount || 0;
  const retainBtnHtml = canRetain
    ? `<button class="retirement-popup-btn" onclick="doRetainFighter(${f.id})" style="background:rgba(46,204,113,0.15);border-color:rgba(46,204,113,0.4);color:#2ecc71;margin-top:6px">🤝 引き留める（あと${2 - retainCount}回）</button>`
    : '';

  box.className = `retirement-popup${isInjury ? ' injury' : ''}`;
  box.innerHTML = `
    <div class="retirement-popup-face">${faceHtml}</div>
    <div class="retirement-popup-name">${f.name}</div>
    <div class="retirement-popup-age">${f.age || '?'}歳</div>
    <div class="retirement-popup-divider">${dividerText}</div>
    <div class="retirement-popup-career">${careerHtml}</div>
    <div class="retirement-popup-record">${recordText}</div>
    ${injuryNote}${vacancyNote}
    <div class="retirement-popup-line">${r.line}</div>
    <button class="retirement-popup-btn" onclick="closeRetirementPopup()">${btnLabel}</button>
    ${retainBtnHtml}
  `;
  document.getElementById('retirementPopupOverlay').classList.add('active');
  Audio.play(isInjury ? 'error' : 'event');
}

function closeRetirementPopup() {
  document.getElementById('retirementPopupOverlay').classList.remove('active');
  _retirementPopupQueue.shift();
  if (_retirementPopupQueue.length > 0) {
    setTimeout(_renderRetirementPopup, 300);
  } else if (_retirementPopupCallback) {
    const cb = _retirementPopupCallback; _retirementPopupCallback = null; cb();
    _drainPopupQueue();
  } else {
    _drainPopupQueue();
  }
}

// ── 引退勧告結果ポップアップ ────────────────
function showRetireAdviseResultPopup(accepted, fighter, line) {
  const url = getPortraitUrl(fighter.id);
  const faceHtml = url
    ? `<img src="${url}" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid ${accepted ? 'var(--gold)' : '#e74c3c'}">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:rgba(200,190,170,0.08);display:flex;align-items:center;justify-content:center;font-size:32px">${fighter.name.charAt(0)}</div>`;
  const box = document.getElementById('retirementPopupBox');
  const headerColor = accepted ? 'var(--gold)' : '#e74c3c';
  const headerText  = accepted ? '🌅 引退を受諾' : '💢 引退を拒否';
  const subText     = accepted
    ? `${fighter.name} がラストラン状態に入りました。<br>次の興行で引退試合を組みましょう。`
    : `${fighter.name} に断られました。${fighter.proveMode > 0 ? '🔥 見返しモード（4週間MQ+2）発動！' : 'ロッカールームに影響が出ました。'}`;
  box.innerHTML = `
    <div style="text-align:center;margin-bottom:12px">${faceHtml}</div>
    <div style="text-align:center;font-size:18px;font-weight:700;color:${headerColor};margin-bottom:4px">${headerText}</div>
    <div style="text-align:center;font-size:13px;color:var(--text-sub);margin-bottom:14px">${subText}</div>
    <div style="background:rgba(200,190,170,0.04);border-radius:6px;padding:12px 14px;font-size:14px;color:var(--text);line-height:1.7;text-align:center;border-left:3px solid ${headerColor};margin-bottom:14px">「${line}」</div>
    <button class="retirement-popup-btn" onclick="document.getElementById('retirementPopupOverlay').classList.remove('active')">閉じる</button>
  `;
  document.getElementById('retirementPopupOverlay').classList.add('active');
  Audio.play(accepted ? 'event' : 'error');
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

function _renderRivalryPopup() {
  if (_rivalryPopupQueue.length === 0) {
    if (_rivalryPopupCallback) { const cb = _rivalryPopupCallback; _rivalryPopupCallback = null; cb(); }
    return;
  }
  const o = _rivalryPopupQueue[0];
  const box = document.getElementById('rivalryPopupBox');

  if (o.phase === 'confrontation') {
    // 宣戦布告
    // rivalry帯別のテキストプール選択（personality×archetype対応）
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
    const headerEmoji = rivalryVal >= 70 ? '💥' : '🔥';
    const headerText = rivalryVal >= 70 ? '宿命の対決！' : '宿敵対決！';

    box.className = `rivalry-popup${o.isFate ? ' fate' : ''}`;
    box.innerHTML = `
      <div class="rivalry-popup-header">${headerEmoji} ${headerText}</div>
      <div class="rivalry-popup-stage">
        <div class="rivalry-popup-fighter-l">
          ${_rivalryUpperHtml(o.leftId, null)}
          <div class="rivalry-popup-fighter-name">${o.leftName}</div>
        </div>
        <div class="rivalry-popup-vs-col">
          <div class="rivalry-popup-vs-icon">VS</div>
        </div>
        <div class="rivalry-popup-fighter-r">
          ${_rivalryUpperHtml(o.rightId, 'rivalry-popup-upper-r')}
          <div class="rivalry-popup-fighter-name">${o.rightName}</div>
        </div>
      </div>
      <div class="rivalry-popup-dialogue">
        <div class="rivalry-popup-bubble">
          <div class="rivalry-popup-bubble-speaker">${o.leftName}</div>
          <div class="rivalry-popup-bubble-text">${leftLine}</div>
        </div>
        <div class="rivalry-popup-bubble">
          <div class="rivalry-popup-bubble-speaker">${o.rightName}</div>
          <div class="rivalry-popup-bubble-text">${rightLine}</div>
        </div>
      </div>
      <div class="rivalry-popup-btn-row">
        <button class="rivalry-popup-btn" onclick="closeRivalryPopup()">閉じる</button>
      </div>
    `;
    const overlay = document.getElementById('rivalryPopupOverlay');
    box.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    overlay.classList.add('active');
    setTimeout(() => {
      Audio.play(o.isFate ? 'fate_confrontation' : 'rivalry_confrontation');
      box.style.transition = 'opacity 0.3s, transform 0.3s';
      box.style.opacity = '1';
      box.style.transform = 'scale(1)';
    }, 350);

  } else {
    // 決着
    const isGoodRival = o.resolutionType === 'goodRival';
    const isBitter = o.resolutionType === 'bitter';
    // 好敵手/宿怨は専用セリフプール、それ以外は既存セリフ
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
    const headerEmoji = isBitter ? '💀' : isGoodRival ? '🤝' : (o.isFate ? '💥' : '⚡');
    const headerText = isBitter ? '宿怨決着！' : isGoodRival ? '好敵手誕生！' : (o.isSecondResolution ? '宿命の相手 ── 最終決着！' : (o.isFate ? '宿命の相手決着！' : '宿敵決着！'));

    const useFateLines = o.isFate;
    box.className = `rivalry-popup resolution${useFateLines ? ' fate' : ''}`;
    const goodRivalMsg = isGoodRival
      ? `<div class="rivalry-popup-goodrival">🤝 ふたりは「好敵手」になった</div>`
      : isBitter
        ? `<div class="rivalry-popup-goodrival">💀 ふたりは「宿怨」になった</div>`
        : '';
    box.innerHTML = `
      <div class="rivalry-popup-header">${headerEmoji} ${headerText}</div>
      <div class="rivalry-popup-stage">
        <div class="rivalry-popup-fighter-l">
          ${_rivalryUpperHtml(o.winnerId, null)}
          <div class="rivalry-popup-fighter-name">${o.winnerName}</div>
        </div>
        <div class="rivalry-popup-vs-col">
          <div class="rivalry-popup-vs-icon">VS</div>
        </div>
        <div class="rivalry-popup-fighter-r">
          ${_rivalryUpperHtml(o.loserId, 'rivalry-popup-upper-r')}
          <div class="rivalry-popup-fighter-name">${o.loserName}</div>
        </div>
      </div>
      <div class="rivalry-popup-dialogue">
        <div class="rivalry-popup-bubble">
          <div class="rivalry-popup-bubble-speaker">${o.winnerName}</div>
          <div class="rivalry-popup-bubble-text">${winLine}</div>
        </div>
        <div class="rivalry-popup-bubble">
          <div class="rivalry-popup-bubble-speaker">${o.loserName}</div>
          <div class="rivalry-popup-bubble-text">${loseLine}</div>
        </div>
      </div>
      <div class="rivalry-popup-bonus">
        📈 両選手の人気 +${o.popBonus}　　🏢 団体人気 +${o.orgPopBonus}
      </div>
      ${goodRivalMsg}
      <div class="rivalry-popup-btn-row">
        <button class="rivalry-popup-btn" onclick="closeRivalryPopup()">OK</button>
      </div>
    `;
    const overlay = document.getElementById('rivalryPopupOverlay');
    box.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    overlay.classList.add('active');
    setTimeout(() => {
      Audio.play((o.isFate || o.resolutionType === 'goodRival' || o.resolutionType === 'bitter') ? 'fate_resolution' : 'rivalry_resolution');
      box.style.transition = 'opacity 0.3s, transform 0.3s';
      box.style.opacity = '1';
      box.style.transform = 'scale(1)';
    }, 300);
  }
}

function closeRivalryPopup() {
  document.getElementById('rivalryPopupOverlay').classList.remove('active');
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
function showAwardsCeremony(awards, onDone) {
  if (!awards) { if (onDone) onDone(); return; }
  if (_isPopupActive()) { _popupQueue.push(() => showAwardsCeremony(awards, onDone)); return; }

  const steps = [];

  // 0. タイトル画面
  steps.push(() => _renderAwardsSlide(_buildAwardsTitle(awards.season), 'a'));

  // 1. 新人王（該当者なしでも常に表示）
  steps.push(() => _renderAwardsSlide(_buildRookieAward(awards.rookieOfYear), 'b'));

  // 2. ベストマッチ
  if (awards.bestMatch)
    steps.push(() => _renderAwardsSlide(_buildBestMatchAward(awards.bestMatch), 'c'));

  // 3. MVP
  if (awards.mvp)
    steps.push(() => _renderAwardsSlide(_buildMVPAward(awards.mvp), 'd'));

  // 4. チャンピオン紹介
  if (awards.champions && awards.champions.length > 0)
    steps.push(() => _renderAwardsSlide(_buildChampionsAward(awards.champions), 'e'));

  // 5. 殿堂入り（該当者ごとに1画面）
  if (awards.hallOfFame && awards.hallOfFame.length > 0) {
    awards.hallOfFame.forEach(inductee => {
      steps.push(() => { _renderAwardsSlide(_buildHallOfFame(inductee), 'f'); Audio.play('fanfare'); });
    });
  }

  // 6. 全受賞者一覧
  steps.push(() => _renderAwardsSlide(_buildAwardsSummary(awards), 'g'));

  // キュー実行
  let idx = 0;
  window._awardsNext = () => {
    document.getElementById('awardsOverlay').classList.remove('active');
    idx++;
    if (idx < steps.length) {
      setTimeout(() => { steps[idx](); document.getElementById('awardsOverlay').classList.add('active'); Audio.play('reveal'); }, 280);
    } else {
      window._awardsNext = null;
      if (onDone) onDone();
      _drainPopupQueue();
    }
  };

  // 開始
  steps[0]();
  document.getElementById('awardsOverlay').classList.add('active');
  Audio.play('award');
}

function _renderAwardsSlide(html, frame) {
  const box = document.getElementById('awardsBox');
  box.innerHTML = html;
  box.dataset.frame = frame || '';
  if (html.includes('awards-plaque')) box.classList.add('hall-of-fame');
  else box.classList.remove('hall-of-fame');
}

// セリフをランダム選出（AWARD_LINES[key]からpersonality×archetypeで1つ）
function _awardLine(key, charId) {
  const lineObj = (typeof AWARD_LINES !== 'undefined' && AWARD_LINES[key]);
  if (!lineObj) return '';
  const ch = charId ? ALL_CHARS.find(c => c.id === charId) : null;
  return pickDialogueLine(lineObj, ch);
}

// ベストマッチ用フレーバーテキスト
function _bestMatchFlavor(mq) {
  if (typeof BESTMATCH_FLAVOR === 'undefined') return '';
  const pool = mq >= 80 ? BESTMATCH_FLAVOR.high : mq >= 60 ? BESTMATCH_FLAVOR.mid : BESTMATCH_FLAVOR.low;
  return pool[Math.floor(Math.random() * pool.length)];
}

// スタイル日本語変換
function _styleJa(style) {
  return { Grappler:'グラップラー', Striker:'ストライカー', Submission:'サブミッション',
           Speed:'スピード', Allround:'オールラウンダー', Brawler:'ブロウラー' }[style] || style;
}

function _awardsPortrait(id, size) {
  size = size || 80;
  const url = getPortraitUrl(id);
  if (url) return `<img src="${url}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:3px solid rgba(212,168,67,0.4)">`;
  const ch = ALL_CHARS.find(c => c.id === id);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size/2)}px;border:3px solid rgba(212,168,67,0.3)">${ch ? ch.name.charAt(0) : '?'}</div>`;
}

function _buildAwardsTitle(season) {
  return `<div class="awards-title">━━ シーズン${season} ━━</div>
  <div style="font-size:36px;margin:12px 0">🏆</div>
  <div class="awards-title" style="font-size:16px;letter-spacing:4px;color:var(--gold)">年末表彰式</div>
  <div class="awards-detail" style="margin:14px 0 22px;font-size:13px">受賞者を発表します</div>
  <button class="awards-btn" onclick="window._awardsNext()">開始 ▶</button>`;
}

function _buildRookieAward(d) {
  if (!d) {
    return `<div class="awards-category">🌟 新人王 🌟</div>
  <div style="font-size:48px;margin:20px 0">—</div>
  <div class="awards-name" style="color:var(--text-sub)">今年は該当者なし</div>
  <div class="awards-detail" style="margin-top:8px">キャリア1年目の選手が見つかりませんでした</div>
  <button class="awards-btn" onclick="window._awardsNext()">次へ ▶</button>`;
  }
  const line = _awardLine('rookie', d.id);
  return `<div class="awards-category">🌟 新人王 🌟</div>
  <div style="margin:4px auto 10px">${_awardsPortrait(d.id, 150)}</div>
  <div class="awards-name">${d.name}</div>
  <div class="awards-org ${d.isPlayerOrg ? 'player' : ''}">${d.orgName}</div>
  <div class="awards-detail">OVR ${d.ovr} / ${d.age}歳 / ${_styleJa(d.style)}</div>
  ${line ? `<div class="awards-quote">${line}</div>` : ''}
  <button class="awards-btn" onclick="window._awardsNext()">次へ ▶</button>`;
}

function _buildBestMatchAward(d) {
  // fighter1/fighter2 は {id, name, ovr, style} オブジェクト
  const f1 = typeof d.fighter1 === 'object' ? d.fighter1 : { id: null, name: d.fighter1, ovr: 0, style: 'Allround' };
  const f2 = typeof d.fighter2 === 'object' ? d.fighter2 : { id: null, name: d.fighter2, ovr: 0, style: 'Allround' };
  const flavor = _bestMatchFlavor(d.mq);
  // 各選手のpersonality×archetypeでセリフ選出
  const line1 = _awardLine('bestMatch', f1.id);
  const line2 = _awardLine('bestMatch', f2.id);
  return `<div class="awards-category">🎬 ベストマッチ 🎬</div>
  <div style="display:flex;justify-content:center;align-items:flex-start;gap:10px;margin:6px 0 8px">
    <div style="flex:1;text-align:center">
      <div style="display:flex;justify-content:center">${_awardsPortrait(f1.id, 100)}</div>
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-top:5px">${f1.name}</div>
      <div style="font-size:10px;color:var(--text-dim)">OVR ${f1.ovr} / ${_styleJa(f1.style)}</div>
      ${line1 ? `<div style="font-size:10px;color:var(--text-sub);font-style:italic;margin-top:5px;line-height:1.5">「${line1}」</div>` : ''}
    </div>
    <div style="flex-shrink:0;text-align:center;padding-top:46px">
      <div style="font-size:11px;color:var(--text-dim);font-weight:700">VS</div>
    </div>
    <div style="flex:1;text-align:center">
      <div style="display:flex;justify-content:center">${_awardsPortrait(f2.id, 100)}</div>
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-top:5px">${f2.name}</div>
      <div style="font-size:10px;color:var(--text-dim)">OVR ${f2.ovr} / ${_styleJa(f2.style)}</div>
      ${line2 ? `<div style="font-size:10px;color:var(--text-sub);font-style:italic;margin-top:5px;line-height:1.5">「${line2}」</div>` : ''}
    </div>
  </div>
  <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">${d.orgName}</div>
  <div style="font-size:20px;font-weight:700;color:var(--accent);margin-bottom:2px">MQ ${d.mq}</div>
  ${flavor ? `<div style="font-size:11px;color:var(--text-sub);font-style:italic;margin-bottom:14px">${flavor}</div>` : '<div style="margin-bottom:14px"></div>'}
  <button class="awards-btn" onclick="window._awardsNext()">次へ ▶</button>`;
}

function _buildMVPAward(d) {
  const line = _awardLine('mvp', d.id);
  return `<div class="awards-category">👑 MVP 👑</div>
  <div style="margin:4px auto 10px">${_awardsPortrait(d.id, 170)}</div>
  <div class="awards-name">${d.name}</div>
  <div class="awards-org ${d.isPlayerOrg ? 'player' : ''}">${d.orgName}</div>
  <div class="awards-detail">OVR ${d.ovr} / 人気 ${Engine.util.dispPop(d.popularity)} / ${_styleJa(d.style)}</div>
  ${line ? `<div class="awards-quote">${line}</div>` : ''}
  <button class="awards-btn" onclick="window._awardsNext()">次へ ▶</button>`;
}

function _buildChampionsAward(champions) {
  if (!champions || champions.length === 0) {
    return `<div class="awards-category">🏆 チャンピオン 🏆</div>
  <div class="awards-detail" style="margin:20px 0">チャンピオン情報なし</div>
  <button class="awards-btn" onclick="window._awardsNext()">次へ ▶</button>`;
  }
  // 各チャンピオンのpersonality×archetypeでセリフ選出
  const lines = champions.map(ch => _awardLine('champion', ch.id));
  const [c1, c2, c3] = champions;
  // 1位（大）
  const defText1 = c1.isPlayer && c1.defenses != null ? `<br>防衛 ${c1.defenses}回` : '';
  const first = `<div style="margin-bottom:14px">
    <div style="display:flex;justify-content:center">${_awardsPortrait(c1.id, 160)}</div>
    <div class="awards-name" style="margin-top:8px">${c1.name}</div>
    <div class="awards-org ${c1.isPlayer ? 'player' : ''}">${c1.orgName}</div>
    <div style="font-size:11px;color:var(--text-sub)">OVR ${c1.ovr} / 人気 ${Engine.util.dispPop(c1.popularity)}${defText1}</div>
    ${lines[0] ? `<div style="font-size:12px;color:var(--text-sub);font-style:italic;margin-top:6px">「${lines[0]}」</div>` : ''}
  </div>`;
  // 2位3位（小）
  const makeSmall = (c, lineIdx) => {
    if (!c) return '<div style="flex:1"></div>';
    const defText = c.isPlayer && c.defenses != null ? ` / 防衛${c.defenses}回` : '';
    return `<div style="flex:1;text-align:center">
      <div style="display:flex;justify-content:center">${_awardsPortrait(c.id, 75)}</div>
      <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:5px">${c.name}</div>
      <div style="font-size:9px;color:var(--text-dim)">${c.orgName}</div>
      <div style="font-size:9px;color:var(--text-sub)">OVR ${c.ovr} / 人気 ${Engine.util.dispPop(c.popularity)}${defText}</div>
      ${lines[lineIdx] ? `<div style="font-size:9px;color:var(--text-sub);font-style:italic;margin-top:4px">「${lines[lineIdx]}」</div>` : ''}
    </div>`;
  };
  const rest = (c2 || c3) ? `<div style="display:flex;gap:10px;justify-content:center;padding-top:4px">
    ${makeSmall(c2, 1)}${makeSmall(c3, 2)}
  </div>` : '';
  return `<div class="awards-category">🏆 チャンピオン 🏆</div>
  ${first}${rest}
  <div style="margin-top:16px"><button class="awards-btn" onclick="window._awardsNext()">次へ ▶</button></div>`;
}

function _buildHallOfFame(d) {
  const line = _awardLine('hallOfFame', d.id);
  return `<div class="awards-category" style="color:rgba(255,215,0,0.9)">🏛️ 殿堂入り 🏛️</div>
  <div style="margin:4px auto 10px">${_awardsPortrait(d.id, 130)}</div>
  <div class="awards-name gold">✦ ${d.name} ✦</div>
  <div class="awards-org">${d.orgName} / ${_styleJa(d.style)}</div>
  <div class="awards-plaque">
    現役期間: ${d.activeYears}<br>
    🏆 王座獲得 ${d.titleReigns}回 &nbsp;|&nbsp; 🛡️ 通算防衛 ${d.totalDefenses}回<br>
    📈 最高OVR ${d.peakOVR}（S${d.peakOVRSeason}）
  </div>
  ${line ? `<div class="awards-quote">${line}</div>` : ''}
  <button class="awards-btn" onclick="window._awardsNext()">拍手 👏</button>`;
}

function _buildAwardsSummary(a) {
  const row = (icon, lbl, val) => val
    ? `<div class="awards-summary-row"><span class="awards-summary-label">${icon} ${lbl}</span><span>${val}</span></div>`
    : '';
  const hofText = a.hallOfFame && a.hallOfFame.length > 0
    ? a.hallOfFame.map(h => h.name).join('、') : '該当なし';
  const playerChamp = a.champions && a.champions.find(c => c.isPlayer);
  const topChamp = playerChamp || (a.champions && a.champions[0]);
  const champText = topChamp
    ? (topChamp.isPlayer && topChamp.defenses != null
        ? `${topChamp.name}（防衛${topChamp.defenses}回、${topChamp.orgName}）`
        : `${topChamp.name}（${topChamp.orgName}）`)
    : '（未設立）';
  const mvpText  = a.mvp          ? `${a.mvp.name}（${a.mvp.orgName}）`              : null;
  const rookText = a.rookieOfYear ? `${a.rookieOfYear.name}（${a.rookieOfYear.orgName}）` : null;
  const bm1 = a.bestMatch ? (typeof a.bestMatch.fighter1 === 'object' ? a.bestMatch.fighter1.name : a.bestMatch.fighter1) : null;
  const bm2 = a.bestMatch ? (typeof a.bestMatch.fighter2 === 'object' ? a.bestMatch.fighter2.name : a.bestMatch.fighter2) : null;
  const bmText   = a.bestMatch    ? `${bm1} vs ${bm2}（MQ ${a.bestMatch.mq}）` : null;
  return `<div class="awards-title" style="font-size:13px;margin-bottom:14px">シーズン${a.season} 表彰式 結果</div>
  <div class="awards-summary">
    ${row('🌟','新人王', rookText)}
    ${row('🎬','ベストマッチ', bmText)}
    ${row('👑','MVP', mvpText)}
    ${row('🏆','王者', champText)}
    ${row('🏛️','殿堂入り', hofText)}
  </div>
  <button class="awards-btn" onclick="window._awardsNext()">新シーズンへ ▶</button>`;
}


function pickQuote(category) {
  const pool = EVENT_QUOTES[category] || ['...'];
  // trait-keyed object の場合は _default にフォールバック
  if (pool && typeof pool === 'object' && !Array.isArray(pool)) {
    const arr = pool._default || ['...'];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// personality×archetype セリフ取得（タイトルマッチリアクション等）
function getTraitQuote(category, char) {
  const pool = EVENT_QUOTES[category];
  if (!pool) return '…';
  if (Array.isArray(pool)) return pool[Math.floor(Math.random() * pool.length)];
  return pickDialogueLine(pool, char);
}

// v1.0: Get a draft-context quote for a specific character
function getDraftQuote(char) {
  const pool = EVENT_QUOTES.draftInterest;
  if (!pool) return pickQuote('draftJoin');
  return pickDialogueLine(pool, char);
}

// v1.0c: Get FA signing quote (personality×archetype)
function getSigningQuote(char) {
  const pool = EVENT_QUOTES.faSigning;
  if (!pool) {
    const generic = EVENT_QUOTES.faSigningGeneric || ['よろしくお願いします！'];
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return pickDialogueLine(pool, char);
}

// v2.x: Get FA welcome quote after signing (personality×archetype)
function getWelcomeQuote(char) {
  const pool = EVENT_QUOTES.faWelcome;
  if (!pool) {
    const generic = EVENT_QUOTES.faWelcomeGeneric || ['よろしくお願いします！頑張ります！'];
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return pickDialogueLine(pool, char);
}

// v1.0c: Get rental greeting quote (personality×archetype)
function getRentalQuote(char) {
  const pool = EVENT_QUOTES.rentalGreeting;
  if (!pool) {
    const generic = EVENT_QUOTES.rentalGreetingGeneric || ['よろしくお願いします！'];
    return generic[Math.floor(Math.random() * generic.length)];
  }
  return pickDialogueLine(pool, char);
}

// v1.0: Get a draft "interest" line (when focused, before picking)
function getDraftInterestLine(char) {
  const pool = EVENT_QUOTES.draftInterest;
  if (!pool) return pickQuote('draftJoin');
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
  return null;
}

function showFighterPopup(fighterId, source, _skipQueueCheck) {
  const c = findFighter(fighterId, source);
  if (!c) return;
  // 他のポップアップが表示中ならキューに入れる（自分自身のタブ切り替え時はスキップ）
  if (!_skipQueueCheck && _isPopupActive()) { _popupQueue.push(() => showFighterPopup(fighterId, source)); return; }
  Audio.play('hover');

  const STYLE_META = {
    Grappler:   {color:'#bb8fce',icon:'GRP'},
    Striker:    {color:'#e74c3c',icon:'STK'},
    Submission: {color:'#e67e22',icon:'SUB'},
    Speed:      {color:'#2ecc71',icon:'SPD'},
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
  const isChamp = G.titles?.world?.championId === c.id;

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
            ${c.isRental ? (() => { const ct = (G.rentals || []).find(r => r.fighterId === c.id); const wl = ct ? ((ct.seasonsLeft - 1) * 12 + Math.max(1, 13 - (G.week || 1))) : '?'; const rs = ct ? ((G.season || 1) + (ct.seasonsLeft - 1)) : '?'; return `<span style="font-size:13px;color:#f39c12">🤝 レンタル（残${wl}週／${rs}年目末帰還）</span>`; })() : ''}
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
            ${c.slump ? `<span style="color:#7f8c8d">📉 スランプ中（${c.slump.weeksSinceStart}週目 / 回復確率${(2 + (c.slump.recoveryMomentum || 0)).toFixed(1)}%）</span>` : ''}
            ${c.motivationLoss ? `<span style="color:#95a5a6">😞 モチベ喪失（${c.motivationLoss.weeksSinceStart}週目）</span>` : ''}}
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

    // ── 相関図ボタン（全キャラ共通）──
    html += `<div style="padding:6px 16px;background:rgba(0,0,0,0.15);border-bottom:1px solid rgba(200,190,170,0.08);display:flex;align-items:center;gap:8px">
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
          <span class="fighter-popup-stat-label" title="${s.name}">${s.label}</span>
          <div class="fighter-popup-stat-bar"><div class="fighter-popup-stat-fill" style="width:${w}%;background:${s.color}"></div></div>
          <span class="fighter-popup-stat-val" style="color:${valColor};font-weight:${val>=75?700:400}">${val}${sg > 0 ? `<span style="color:#2ecc71;font-size:11px">+${sg}</span>` : ''}</span>
        </div>`;
      });
      html += `</div></div>`; // end flex row

      // Potential & Condition
      if (isRoster || isFree) {
        const potPct = getPotentialPct(c);
        const potColor = potPct >= 90 ? '#e74c3c' : potPct >= 70 ? '#f39c12' : '#2ecc71';
        const condPct = Math.round(c.condition || 0);
        const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
        html += `<div class="fighter-popup-section" style="display:flex;gap:16px;font-size:13px;margin-bottom:12px">
          <div style="flex:1">
            <span style="color:var(--text-dim)">開発率</span>
            <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <div style="flex:1;height:5px;background:rgba(200,190,170,0.08);border-radius:3px;overflow:hidden">
                <div style="width:${potPct}%;height:100%;background:${potColor};border-radius:3px"></div>
              </div>
              <span style="color:${potColor};font-weight:700">${potPct}%</span>
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
            <strong style="color:var(--text);font-size:16px">${Engine.util.dispPop(c.popularity)}</strong>
          </div>
          <div style="padding:6px 8px;background:rgba(200,190,170,0.03);border-radius:4px">
            <span style="color:var(--text-dim)">給与</span><br>
            <strong style="color:var(--text);font-size:13px">${getSalary(c)}万/週</strong>
          </div>
        </div>`;
      }
      if (isFree) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);margin-bottom:10px">
          <span>人気: <strong style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</strong></span>
          <span style="margin-left:12px">給与見込: <strong style="color:var(--text)">${getSalary(c)}万/週</strong></span>
        </div>`;
      }
      if (!isRoster && !isFree && c.popularity !== undefined) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);margin-bottom:10px">
          <span>人気: <strong style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</strong></span>
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
            <span style="color:var(--text-dim);font-size:12px;margin-left:4px">指導力${coach.teaching} / ${coach.trait}</span>
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
            <span style="font-size:10px;font-weight:700;color:var(--gold);background:rgba(212,168,67,0.15);padding:2px 7px;border-radius:3px;flex-shrink:0">戦績</span>
            <span style="color:#2ecc71;font-weight:700">${wins}勝</span>
            <span style="color:#e74c3c;font-weight:700">${losses}敗</span>
            <span style="color:#b0b8c4;font-weight:700">${draws}分</span>
            <span style="color:var(--text-dim);font-size:11px">(${winRateFmt})</span>
            ${totalMatches > 0 ? `<span style="color:var(--text-dim)">勝率</span><span style="color:var(--gold);font-weight:700">${winRate}%</span>` : ''}
            ${bestMQ ? `<span style="color:var(--text-dim);margin-left:2px">｜ ベストMQ</span><span style="color:#4a8fd4;font-weight:700">${bestMQ}</span>` : ''}
            ${isChamp ? `<span style="color:var(--gold);font-size:12px;font-weight:700">｜ 👑 王者（${G.titles.world.defenses}防衛）</span>` : ''}
            ${summary.peakOVR > 0 && !isChamp ? `<span style="color:var(--text-dim);margin-left:2px">｜ ピーク</span><span style="color:#f39c12;font-weight:700">OVR ${summary.peakOVR}</span><span style="color:var(--text-dim);font-size:11px">(S${summary.peakSeason})</span>` : ''}
          </div>
          ${summary.titleSummary ? `<div style="margin-top:6px;font-size:12px;color:var(--gold)">🏆 ${summary.titleSummary}</div>` : ''}
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
            <span style="background:#3498db;color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">年表</span>
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
              <span style="color:var(--text-dim);font-size:11px;flex-shrink:0;min-width:40px;text-align:right;font-family:'Courier New',monospace">S${s}W${m.week || 0}</span>
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
            <span style="background:#a29bfe;color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">経歴</span>
            怪我・重大事項
          </h5>`;
        [...hist].reverse().forEach(h => {
          const typeColor = h.type === 'injury_retirement' ? '#e74c3c' : '#e17055';
          const typeIcon  = h.type === 'injury_retirement' ? '🏁' : '🩹';
          const seasonStr = h.season ? `Season ${h.season}` : '';
          const weekStr   = h.week   ? `, Week ${h.week}`   : '';
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
          const currentAbsWeek = G.season * 12 + G.week;
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
          <button onclick="closeFighterPopup();releaseFighter(${c.id})" style="font-size:13px;padding:10px 16px;cursor:pointer;background:rgba(196,30,58,0.2);border:1px solid rgba(196,30,58,0.4);color:#f08b9e;border-radius:6px;width:100%" ${inCard ? 'disabled title="カード登録中"' : ''}>🚪 この選手を解雇する</button>
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
          <span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${signingCost.toLocaleString()}万</span>
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
          <span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${signingCost.toLocaleString()}万</span>
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

/** PPV VS比較ポップアップ — 両選手のステータスを並べて表示 */
function showPPVVSDetail(matchIdx) {
  const pp = App._ppvPreview;
  if (!pp || !pp.card[matchIdx]) return;
  const match = pp.card[matchIdx];
  const left = match.left, right = match.right;
  Audio.play('hover');

  const STYLE_META = {
    Grappler:{color:'#bb8fce',icon:'GRP'}, Striker:{color:'#e74c3c',icon:'STK'},
    Submission:{color:'#e67e22',icon:'SUB'}, Speed:{color:'#2ecc71',icon:'SPD'},
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
  return `<span class="flink" style="${cls}${sizeStyle}" onclick="event.stopPropagation();showFighterPopup(${c.id},'${src}')">${c.name}</span>${extra}`;
}

function autoFillCard() {
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  const card = [];
  while (card.length < maxMatches) card.push({left:0, right:0, isTitle:false});
  const sorted = [...G.roster].filter(c => !c.injury && !c.forcedRest).sort((a,b) => ov(b) - ov(a));
  const used = new Set();
  const numMatches = Math.min(maxMatches, Math.floor(sorted.length / 2));
  const champId = G.titles.world.championId;
  for (let i = 0; i < numMatches; i++) {
    const left = sorted.find(c => !used.has(c.id));
    if (!left) break;
    used.add(left.id);
    const right = sorted.find(c => !used.has(c.id));
    if (!right) break;
    used.add(right.id);
    const hasChamp = champId && (left.id === champId || right.id === champId);
    // v1.2: 12週クールダウンチェック — クールダウン中は自動編成でもタイトルマッチにしない
    const cdOk = Engine.title.canTitleMatch(G).allowed;
    card[i] = {left: left.id, right: right.id, isTitle: i === 0 && hasChamp && G.titleEstablished && cdOk};
  }
  G = { ...G, showCard: card };
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
  if (G.showCard.length === 0) autoFillCard();
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

  sp.validMatches.forEach((m, idx) => {
    if (sp.results[idx]) return;
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) {
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', turns: 0, log: [], _stale: true };
    }
  });
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
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) continue;
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
    const bondColor = bondAvg >= 60 ? 'var(--blue)' : bondAvg <= 35 ? '#e74c3c' : 'var(--text-dim)';
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
      const mqColor = result.mq >= 70 ? 'var(--gold)' : result.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';
      html += `<div class="smc-result">
        <span class="winner-tag">🏆 ${wName} 勝利</span>
        <span class="finish">${(result.finType || result.finMove) ? Engine.formatFinish(result.finType, result.finMove) : ''} / ${result.turns}ターン</span>
        <span class="mq" style="color:${mqColor}">MQ ${result.mq}</span>
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
    // フォーカス試合に宣戦布告ポップアップが未表示なら自動表示
    const cMap = sp.confrontationMap;
    if (cMap && cMap[nextIdx] && !sp._shownConfrontations.has(nextIdx)) {
      sp._shownConfrontations.add(nextIdx);
      setTimeout(() => showRivalryPopups([cMap[nextIdx]], () => {}), 400);
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
  const showName = ppv ? '🏆 PPV GRAND FINAL' : special ? '⭐ 特別興行' : `第${G.totalShows}回 定期興行`;
  const avgMQ = Math.round(results.reduce((s,r) => s + r.mq, 0) / results.length);
  const heat = getHeatLevel();

  // ヘッダー
  let html = `<div class="show-header">
    <div class="show-label">Weekly Show</div>
    <div class="show-title">${showName}</div>
  </div>`;

  // サマリーバー
  html += `<div class="show-summary-bar">
    <span style="font-size:13px">
      <span class="mq-stars">${[1,2,3,4,5].map(s => `<span class="mq-star" style="color:${avgMQ >= s*20 ? 'var(--gold)' : 'rgba(200,190,170,0.15)'}">★</span>`).join('')}</span>
      <span style="color:var(--text-sub)">平均MQ: ${avgMQ}</span>
    </span>
    <span style="margin-left:16px;font-size:13px;color:${heat.color}">${heat.emoji} Heat: ${heat.label}（集客×${heat.mult}）</span>
  </div>`;

  // 観客動員バナー
  const venue = VENUES[G.showVenue];
  const attendance = G.lastShowAttendance || 0;
  const cap = venue.cap;
  const occRate = cap > 0 ? attendance / cap : 0;
  const occPct = Math.round(occRate * 100);
  const occEntry = OCCUPANCY_BONUS.find(b => occRate >= b.min) || OCCUPANCY_BONUS[OCCUPANCY_BONUS.length - 1];
  const isSellout = occRate >= 0.95;
  const isGoodCrowd = occRate >= 0.80;
  const attendBorder = isSellout ? 'var(--gold)' : isGoodCrowd ? '#2ecc71' : occRate >= 0.60 ? 'var(--border)' : '#e74c3c';
  const attendBg = isSellout ? 'rgba(212,168,67,0.08)' : isGoodCrowd ? 'rgba(46,204,113,0.08)' : occRate >= 0.60 ? 'rgba(200,190,170,0.03)' : 'rgba(231,76,60,0.08)';
  const barColor = isSellout ? 'linear-gradient(90deg,var(--gold),#f1c40f)' : isGoodCrowd ? 'linear-gradient(90deg,#2ecc71,#27ae60)' : occRate >= 0.60 ? '#3498db' : occRate >= 0.40 ? '#e67e22' : '#e74c3c';

  html += `<div class="show-attend-banner" style="border:1px solid ${attendBorder};background:${attendBg}">
    <div style="font-size:12px;color:var(--text-sub)">${venue.name}</div>
    <div class="show-attend-num" style="color:${isSellout ? 'var(--gold)' : isGoodCrowd ? '#2ecc71' : 'var(--text-main)'}${isSellout ? ';text-shadow:0 0 12px rgba(212,168,67,0.5)' : ''}">
      ${isSellout ? '🎉 ' : ''}${attendance.toLocaleString()}人${isSellout ? ' 🎉' : ''}
    </div>
    <div style="font-size:11px;color:var(--text-dim)">/ ${cap.toLocaleString()}席</div>
    <div class="show-attend-bar-wrap"><div class="show-attend-bar-fill" style="width:${Math.min(occPct,100)}%;background:${barColor}"></div></div>
    <div class="show-attend-pct" style="color:${isSellout ? 'var(--gold)' : isGoodCrowd ? '#2ecc71' : 'var(--text-sub)'}">${occEntry.label}（${occPct}%）</div>
  </div>`;

  // 各試合結果カード
  html += `<div class="show-results-area">`;
  results.forEach((r, i) => {
    const isMain = i === 0;
    const isDraw = r.winner === 'draw';
    const leftIsWinner = r.winner === 'left';
    const rightIsWinner = r.winner === 'right';
    const matchLabel = isMain ? '★ メインイベント' : `第${results.length - i}試合`;
    const cardClass = isMain ? 'card-main' : 'card-sub';
    const cardBorder = isMain ? '1.5px solid rgba(212,168,67,0.4)' : '1px solid rgba(200,190,170,0.08)';
    const cardBg = isMain ? 'linear-gradient(180deg,rgba(212,168,67,0.08),rgba(212,168,67,0.02))' : 'rgba(0,0,0,0.25)';

    const spotlightInMatch = G.mediaSpotlight && (G.mediaSpotlight.fighterId === r.left.id || G.mediaSpotlight.fighterId === r.right.id);

    // タグ行
    const tags = [];
    if (r.isTitleMatch) tags.push(`<span style="color:var(--gold)">🏆 タイトルマッチ</span>`);
    if (r.rivalryBonus) tags.push(`<span style="color:${r.rivalryBonus.color}">${r.rivalryBonus.emoji}${r.rivalryBonus.label}</span>`);
    if (r.freshnessBonus) tags.push(`<span style="color:${r.freshnessBonus > 0 ? '#74b9ff' : '#e17055'}">${r.freshnessBonus > 0 ? '✨' : '😐'}${r.freshnessLabel}</span>`);
    if (spotlightInMatch) tags.push(`<span class="media-spotlight-badge">📺 取材中</span>`);

    html += `<div class="sr-card ${cardClass}" style="border:${cardBorder};background:${cardBg}">`;

    // ラベル行
    html += `<div class="sr-label-row">
      <span class="sr-match-num" ${isMain ? 'style="color:var(--gold);font-size:16px"' : ''}>${matchLabel}</span>
      ${tags.length ? '<br>' + tags.join(' ') : ''}
    </div>`;

    if (isDraw) {
      // DRAW: 簡易表示
      const faceL = getPortraitUrl(r.left.id);
      const faceR = getPortraitUrl(r.right.id);
      html += `<div class="sr-fighters">
        <div class="sr-char" style="width:170px">
          <div class="bubble-slot empty"></div>
          <div class="portrait-wrap" style="width:110px;height:110px;border:2px solid rgba(243,156,18,0.4)">
            ${faceL ? `<img src="${faceL}" alt="" onerror="this.style.display='none'">` : portraitImg(r.left.id, 110)}
          </div>
          <div class="fname">${fLink(r.left, {source:'roster'})}</div>
        </div>
        <div class="sr-vs"><div class="sr-vs-text">VS</div></div>
        <div class="sr-char" style="width:170px">
          <div class="bubble-slot empty"></div>
          <div class="portrait-wrap" style="width:110px;height:110px;border:2px solid rgba(243,156,18,0.4)">
            ${faceR ? `<img src="${faceR}" alt="" onerror="this.style.display='none'">` : portraitImg(r.right.id, 110)}
          </div>
          <div class="fname">${fLink(r.right, {source:'roster'})}</div>
        </div>
      </div>
      <div class="sr-win-badge"><span style="background:rgba(243,156,18,0.2);color:#f39c12">DRAW</span></div>`;
    } else {
      const winF = leftIsWinner ? r.left : r.right;
      const loseF = leftIsWinner ? r.right : r.left;
      const faceL = getPortraitUrl(r.left.id);
      const faceR = getPortraitUrl(r.right.id);

      // セリフ生成（因縁30+）
      const hasRivalryDialogue = !isDraw && r.rivalryBonus && (r.rivalryBonus.rivalry || 0) >= 30;
      let winLine = '', loseLine = '';
      if (hasRivalryDialogue) {
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

      // 左右のキャラHTML
      const makeSrChar = (fighter, isWinner, faceUrl, line) => {
        const cls = isWinner ? 'winner' : 'loser';
        const bubbleCls = line ? '' : ' empty';
        let bubbleHtml = '';
        if (line) {
          const bnameCls = isWinner ? 'win' : 'lose';
          const namePrefix = isWinner ? '🏆 ' : '';
          bubbleHtml = `<div class="sr-bubble">
            <div class="bname ${bnameCls}">${namePrefix}${fighter.name}</div>
            <div class="btext">「${line}」<div class="btail"></div></div>
          </div>`;
        }
        return `<div class="sr-char ${cls}">
          <div class="bubble-slot${bubbleCls}">${bubbleHtml}</div>
          <div class="portrait-wrap">
            ${faceUrl ? `<img src="${faceUrl}" alt="" onerror="this.style.display='none'">` : portraitImg(fighter.id, 110)}
          </div>
          <div class="fname">${fLink(fighter, {source:'roster', bold:isWinner})}</div>
        </div>`;
      };

      html += `<div class="sr-fighters">
        ${makeSrChar(r.left, leftIsWinner, faceL, leftIsWinner ? (hasRivalryDialogue ? winLine : '') : (hasRivalryDialogue ? loseLine : ''))}
        <div class="sr-vs"><div class="sr-vs-text">VS</div></div>
        ${makeSrChar(r.right, rightIsWinner, faceR, rightIsWinner ? (hasRivalryDialogue ? winLine : '') : (hasRivalryDialogue ? loseLine : ''))}
      </div>`;

      html += `<div class="sr-win-badge"><span>🏆 ${winF.name} 勝利</span></div>`;
    }

    // 決まり手
    html += `<div class="sr-finish">${Engine.formatFinish(r.finType, r.finMove)} / ${r.turns}ターン</div>`;

    // MQ行
    const mqBonusTags = [];
    if (r.isTitleMatch) mqBonusTags.push(`<span style="color:var(--gold)">(王座+5)</span>`);
    if (r.titleGapPenalty) mqBonusTags.push(`<span style="color:#e74c3c">(格差${r.titleGapPenalty})</span>`);
    if (r.rivalryBonus) mqBonusTags.push(`<span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>`);
    if (r.coachMQBonus) mqBonusTags.push(`<span style="color:#e67e22">(コーチ+${r.coachMQBonus})</span>`);
    if (r.freshnessBonus) mqBonusTags.push(`<span style="color:${r.freshnessBonus > 0 ? '#74b9ff' : '#e17055'}">(${r.freshnessLabel}${r.freshnessBonus > 0 ? '+' : ''}${r.freshnessBonus})</span>`);

    html += `<div class="sr-mq-row">
      <span class="mq-stars">${[1,2,3,4,5].map(s => `<span class="mq-star" style="color:${r.mq >= s*20 ? 'var(--gold)' : 'rgba(200,190,170,0.15)'}">★</span>`).join('')}</span>
      <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}</span>
      ${mqBonusTags.map(t => `<span style="font-size:11px">${t}</span>`).join(' ')}
    </div>`;

    // HPバー
    html += _hpComparisonBar(r.left.name, r.hpLeft, r.right.name, r.hpRight);

    // 試合ログ
    html += `<details style="margin-top:8px"><summary style="font-size:12px;color:var(--text-dim);cursor:pointer">試合ログを見る</summary>
      <div style="font-size:11px;color:var(--text-sub);margin-top:4px;max-height:200px;overflow-y:auto">
        ${r.log.map(l => `<div style="padding:2px 0">${l}</div>`).join('')}
      </div>
    </details>`;

    html += `</div>`; // sr-card
  });
  html += `</div>`; // show-results-area

  // Heat情報
  html += `<div class="sr-heat-info"><span style="color:${heat.color}">${heat.emoji} Heat: ${heat.label}</span></div>`;

  // 負傷報告
  if (injuryResults.length > 0) {
    html += `<div style="margin:4px 16px 12px;padding:10px 14px;background:rgba(214,48,49,0.1);border:1px solid rgba(214,48,49,0.3);border-radius:6px">
      <div style="font-size:13px;font-weight:700;color:#e17055;margin-bottom:6px">🏥 負傷報告</div>`;
    injuryResults.forEach(ir => {
      html += `<div style="font-size:13px;color:var(--text-sub);padding:3px 0">
        <span style="color:${ir.injury.color}">${ir.injury.type}</span> ${fLink(ir, {source:'roster', size:'13px'})} — 全治${ir.injury.weeksLeft}週間
      </div>`;
    });
    html += '</div>';
  }

  // 閉じるボタン
  html += `<div class="sr-close-area">
    <button class="sr-close-btn" onclick="closeShowResult()">結果を確認 →</button>
  </div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

// Legacy function aliases for onclick handlers in UI
function doRetireAdvise(id) { App.doRetireAdvise(id); }
function doRetainFighter(id) { App.doRetainFighter(id); }
function signFighter(id) { App.signFighter(id); }
function releaseFighter(id) { App.releaseFighter(id); }
function scoutPick(id) { App.scoutEventPick(id); }
function scoutResolve(id, choice) { App.scoutEventResolve(id, choice); }
function scoutFinish() { App.scoutEventFinish(); }
function hireCoach(id) { App.hireCoach(id); }
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

    // z-index: 下の段(前座)ほど高い（上のカードの画像が下のカードの裏に隠れる）
    const zIdx = total - di;

    cardsHtml += `
      <div class="ppvmc-card${mainClass}" style="z-index:${zIdx}">
        <div class="ppvmc-fighter left">
          <img src="${getFullUrl(match.left.id)}" alt="${match.left.name}" onerror="this.style.display='none'">
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
          <img src="${getFullUrl(match.right.id)}" alt="${match.right.name}" onerror="this.style.display='none'">
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
  const rankings = G.rankings || [];
  const pRank = Engine.ranking.getPlayerRank(rankings);
  const reward = PPV_REWARD[pRank] || PPV_REWARD[4];
  const avgMQ = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.mq, 0) / results.length) : 0;

  let html = '';
  // ═══ ヘッダー ═══
  html += `<div style="text-align:center;padding:28px 20px 22px;background:linear-gradient(135deg,rgba(212,168,67,0.2),rgba(180,80,40,0.12));border:1px solid rgba(212,168,67,0.3);border-radius:12px;margin-bottom:18px">`;
  html += `<div style="font-size:12px;letter-spacing:3px;color:rgba(255,255,255,0.3);margin-bottom:4px">PPV GRAND FINAL</div>`;
  html += `<div class="show-result-title" style="font-size:24px;font-weight:900;background:linear-gradient(180deg,#fff 20%,#f0d078);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px">「${ppvName}」結果</div>`;
  html += `<div>${mqStars(avgMQ)} <span style="font-size:14px;color:var(--text-sub)">平均MQ: ${avgMQ}</span></div>`;
  if (heatChange && heatChange.oldId !== heatChange.newId) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-top:6px">${heatChange.newEmoji} Heat: ${heatChange.oldLabel} → ${heatChange.newLabel}（集客×${heatChange.newMult}）</div>`;
  }
  html += `<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(212,168,67,0.1);border:1px solid rgba(212,168,67,0.2);border-radius:16px;font-size:11px;color:var(--text-sub);margin-top:10px">🏆 特設リング</div>`;
  html += `</div>`;

  // ═══ 各試合結果（メインイベント→前座の順） ═══
  const total = card.length;
  let shownMainLabel = false;
  for (let di = total - 1; di >= 0; di--) {
    const match = card[di];
    const r = results[di];
    if (!r) continue;
    const matchNum = di + 1;
    const isMain = match.isSummit;
    const isDraw = r.winner === 'draw';
    const leftIsWinner = r.winner === 'left';
    const rightIsWinner = r.winner === 'right';

    // セクションラベル
    if (isMain && !shownMainLabel) {
      html += `<div style="text-align:center;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.2);margin:16px 0 10px">🏆 MAIN EVENT — 頂上決戦</div>`;
      shownMainLabel = true;
    } else if (!isMain && shownMainLabel && di === total - 2) {
      html += `<div style="text-align:center;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.2);margin:16px 0 10px">UNDERCARD</div>`;
    }

    // カード外枠スタイル
    const cardBorder = isMain
      ? 'border:1.5px solid rgba(212,168,67,0.4);background:linear-gradient(180deg,rgba(212,168,67,0.08),rgba(212,168,67,0.02))'
      : 'border:1px solid var(--border)';

    // ラベル行
    const matchLabel = isMain ? '<span style="color:var(--gold);font-weight:600">🏆 頂上決戦</span>' : `第${matchNum}試合`;
    const rivalryTag = match.isRivalry ? ' <span style="color:#e74c3c">🔥因縁</span>' : '';
    const resolutionTag = r.rivalryResolved ? ' <span style="color:#d63031;font-weight:700">⚡決着！</span>' : '';
    const rivalBonusTag = r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">${r.rivalryBonus.emoji}${r.rivalryBonus.label}</span>` : '';
    const freshTag = r.freshnessBonus ? ` <span style="color:${r.freshnessBonus > 0 ? '#74b9ff' : '#e17055'}">${r.freshnessBonus > 0 ? '✨' : '😐'}${r.freshnessLabel}</span>` : '';
    const titleTag = r.isTitleMatch ? ' <span style="color:var(--gold)">🏆 タイトルマッチ</span>' : '';

    html += `<div style="padding:16px;margin-bottom:10px;border-radius:10px;${cardBorder}">`;
    html += `<div style="font-size:11px;color:rgba(255,255,255,0.25);margin-bottom:10px">${matchLabel}${titleTag}${rivalryTag}${resolutionTag}${rivalBonusTag}${freshTag}</div>`;

    if (isDraw) {
      // ─── 引き分け ───
      html += `<div style="display:flex;align-items:flex-end;justify-content:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          ${portraitImg(r.left.id, isMain ? 180 : 140, 'portrait-match')}
          <div style="margin-top:6px;font-size:14px">${fLink(r.left, {source:'roster'})}</div>
        </div>
        <div style="font-size:16px;font-weight:700;padding:4px 14px;background:rgba(243,156,18,0.2);border:1px solid rgba(243,156,18,0.4);color:#f39c12;border-radius:4px;flex-shrink:0;align-self:center">DRAW</div>
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          ${portraitImg(r.right.id, isMain ? 180 : 140, 'portrait-match')}
          <div style="margin-top:6px;font-size:14px">${fLink(r.right, {source:'roster'})}</div>
        </div>
      </div>`;
      html += `<div style="text-align:center;margin-bottom:8px;font-size:13px;color:var(--text-sub)">${Engine.formatFinish(r.finType, r.finMove)} / ${r.turns}ターン</div>`;
      html += `<div style="text-align:center;margin-bottom:10px">${mqStars(r.mq)} <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}${_ppvBonusTags(r, mqBonuses, di)}</span></div>`;
    } else {
      // ─── 勝敗あり ───
      const winF = leftIsWinner ? r.left : r.right;
      const loseF = leftIsWinner ? r.right : r.left;
      const winnerId = winF.id;
      const loserId = loseF.id;
      // ポートレイトサイズ
      const winSize = isMain ? 180 : 140;
      const loseSize = isMain ? 110 : 80;

      // 吹き出し判定
      let winBubble = '';
      let loseBubble = '';
      // 因縁リアクション（rivalry≥40）
      if (r.rivalryBonus && (r.rivalryBonus.rivalry || 0) >= 30) {
        const winChar = ALL_CHARS.find(c => c.id === winnerId);
        const loseChar = ALL_CHARS.find(c => c.id === loserId);
        const ovrW = Engine.util.ov(winF);
        const ovrL = Engine.util.ov(loseF);
        const isUpsetRivalry = ovrW < ovrL - 8;
        const winPool = isUpsetRivalry && UPSET_RIVALRY_LINES ? UPSET_RIVALRY_LINES.winnerLines : RIVALRY_MATCH_REACTION.winnerLines;
        const losePool = isUpsetRivalry && UPSET_RIVALRY_LINES?.loserLines ? UPSET_RIVALRY_LINES.loserLines : RIVALRY_MATCH_REACTION.loserLines;
        const winLine = pickDialogueLine(winPool, winChar);
        const loseLine = pickDialogueLine(losePool, loseChar);
        winBubble = _ppvBubble(winF.name, winLine, true);
        loseBubble = _ppvBubble(loseF.name, loseLine, false);
      }
      // PPVメインイベント勝利演出（自団体選手が頂上決戦に勝った場合）
      let coachPraiseBubble = '';
      if (isMain && !winBubble) {
        const winOrgId = winF._ppvOrgId || null;
        if (winOrgId === 'player') {
          const winChar = ALL_CHARS.find(c => c.id === winnerId);
          const victoryLine = pickDialogueLine(PPV_SUMMIT_VICTORY_LINES, winChar);
          winBubble = _ppvBubble(winF.name, victoryLine, true);
          // コーチ称賛コメント
          const coach = Engine.coach.getCharCoach(G, winnerId);
          if (coach) {
            const praiseIdx = Math.floor(Math.random() * PPV_COACH_PRAISE_LINES.length);
            coachPraiseBubble = _ppvCoachBubble(coach.name, PPV_COACH_PRAISE_LINES[praiseIdx]);
          }
        }
      }

      // 勝者ポートレイト枠スタイル
      const winPortraitStyle = isMain
        ? `border:2px solid rgba(212,168,67,0.5);box-shadow:0 0 24px rgba(212,168,67,0.15);border-radius:7px`
        : `border:1.5px solid rgba(46,204,113,0.25);border-radius:7px`;
      const losePortraitStyle = `border:1px solid rgba(200,190,170,0.08);border-radius:7px;opacity:0.65`;
      const winNameColor = isMain ? 'color:var(--gold);' : '';

      html += `<div style="display:flex;align-items:flex-end;justify-content:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">`;
      // 勝者列
      html += `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;max-width:55%">`;
      if (winBubble) html += winBubble;
      html += `<div style="${winPortraitStyle};overflow:hidden">${portraitImg(winnerId, winSize, 'portrait-match winner')}</div>`;
      html += `<div style="margin-top:6px;font-size:15px;font-weight:700;${winNameColor}">${fLink(winF, {source:'roster'})}</div>`;
      html += `</div>`;
      // VS
      html += `<div style="font-size:14px;color:rgba(200,190,170,0.12);padding-bottom:${loseSize * 0.5}px;flex-shrink:0;align-self:flex-end">VS</div>`;
      // 敗者列
      html += `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;max-width:38%">`;
      if (loseBubble) html += loseBubble;
      html += `<div style="${losePortraitStyle};overflow:hidden">${portraitImg(loserId, loseSize, 'portrait-match loser')}</div>`;
      html += `<div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.4)">${fLink(loseF, {source:'roster', bold:false})}</div>`;
      html += `</div>`;
      html += `</div>`;

      // 勝利バッジ
      html += `<div style="text-align:center;margin-bottom:8px"><span style="display:inline-block;padding:4px 14px;border-radius:4px;font-size:13px;font-weight:700;background:linear-gradient(135deg,var(--gold),#b8912e);color:var(--bg-dark)">🏆 ${winF.name} 勝利</span></div>`;
      // 決まり手
      html += `<div style="text-align:center;font-size:12px;color:var(--text-sub);margin-bottom:6px">${Engine.formatFinish(r.finType, r.finMove)} / ${r.turns}ターン</div>`;
      // MQ行
      html += `<div style="text-align:center;margin-bottom:10px">${mqStars(r.mq)} <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}${_ppvBonusTags(r, mqBonuses, di)}</span></div>`;
      // コーチ称賛（メインイベント勝利時のみ）
      if (coachPraiseBubble) {
        html += `<div style="margin-top:12px;max-width:320px;margin-left:auto;margin-right:auto">${coachPraiseBubble}</div>`;
      }
    }

    // HPバー (UI共通ルール① center-out symmetric)
    html += _hpComparisonBar(r.left.name, r.hpLeft, r.right.name, r.hpRight);

    // 試合ログ
    html += `<details style="margin-top:8px"><summary style="font-size:10px;color:rgba(255,255,255,0.18);cursor:pointer">試合ログを見る</summary>
      <div style="font-size:10px;color:rgba(255,255,255,0.22);margin-top:4px;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:4px;max-height:160px;overflow-y:auto;line-height:1.6">
        ${r.log.map(l => `<div>${l}</div>`).join('')}
      </div>
    </details>`;

    html += `</div>`;
  }

  // ═══ 報酬 & 対戦pt & ヒート ═══
  html += `<div style="text-align:center;padding:14px 16px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:8px;margin:18px 0 16px">`;
  html += `<div style="font-size:14px;color:var(--gold);font-weight:600">💰 出場報酬: ${reward}万円</div>`;
  const summitIdx = card.findIndex(m => m.isSummit);
  if (summitIdx >= 0 && results[summitIdx]) {
    const sr = results[summitIdx];
    const winnerOrgId = sr.winner === 'left' ? card[summitIdx].left._ppvOrgId : card[summitIdx].right._ppvOrgId;
    const playerInSummit = card[summitIdx].left._ppvOrgId === 'player' || card[summitIdx].right._ppvOrgId === 'player';
    if (playerInSummit) {
      const playerWon = winnerOrgId === 'player';
      html += `<div style="font-size:12px;color:var(--text-sub);margin-top:4px">対戦pt: ${playerWon ? '+' : '-'}${BATTLE_POINT_CFG.summit}（頂上決戦${playerWon ? '勝利' : '敗北'}）</div>`;
    }
  }
  if (heatChange && heatChange.oldId !== heatChange.newId) {
    html += `<div style="font-size:12px;color:var(--text-sub);margin-top:4px">${heatChange.newEmoji} Heat: ${heatChange.oldLabel} → ${heatChange.newLabel}（集客倍率 ×${heatChange.newMult}）</div>`;
  }
  html += `</div>`;

  html += `<div class="btn-row" style="margin-top:16px;justify-content:center">`;
  html += `<button class="btn btn-gold" onclick="App.closePPVResult()">オフシーズンへ →</button>`;
  html += `</div>`;

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
  if (r.titleGapPenalty) tags += ` <span style="color:#e74c3c">(格差${r.titleGapPenalty})</span>`;
  if (r.rivalryBonus) tags += ` <span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>`;
  if (r.coachMQBonus) tags += ` <span style="color:#e67e22">(コーチ+${r.coachMQBonus})</span>`;
  if (r.freshnessBonus) tags += ` <span style="color:${r.freshnessBonus > 0 ? '#74b9ff' : '#e17055'}">(${r.freshnessLabel}${r.freshnessBonus > 0 ? '+' : ''}${r.freshnessBonus})</span>`;
  if (r.friendshipBonus) tags += ` <span style="color:#74b9ff">(相性+${r.friendshipBonus})</span>`;
  return tags;
}

function renderPPVTVResult(card, results, ppvName) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const avgMQ = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.mq, 0) / results.length) : 0;

  let html = '';
  html += `<div style="text-align:center;padding:16px;margin-bottom:16px">`;
  html += `<div class="show-result-title" style="color:var(--text-sub);font-size:18px">📺 PPV GRAND FINAL「${ppvName || 'GRAND FINAL'}」テレビ中継</div>`;
  html += `<div style="font-size:12px;color:var(--text-dim);margin-top:4px">今年は出場できなかった…テレビの前で大会を見届ける</div>`;
  html += `</div>`;

  const total = card.length;
  // メインイベント(末尾)→前座(先頭)の順に表示
  for (let di = total - 1; di >= 0; di--) {
    const match = card[di];
    const r = results[di];
    if (!r) continue;
    const matchNum = di + 1;
    const matchLabel = match.isSummit ? '🏆 頂上決戦' : `第${matchNum}試合`;
    const wName = r.winner === 'draw' ? '引き分け' : r.winner === 'left' ? match.left.name : match.right.name;
    const lName = r.winner === 'left' ? match.right.name : match.left.name;
    const mqColor = r.mq >= 70 ? 'var(--gold)' : r.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';

    html += `<div style="padding:8px 12px;border-bottom:1px solid var(--border)">`;
    html += `<span style="font-size:11px;color:var(--text-dim)">${matchLabel}</span> `;
    html += `<span style="font-size:13px;color:var(--text-main)">○${wName}</span> `;
    html += `<span style="font-size:12px;color:var(--text-dim)">vs</span> `;
    html += `<span style="font-size:13px;color:var(--text-sub);opacity:0.6">×${lName}</span> `;
    html += `<span style="font-size:11px;color:${mqColor}">(MQ ${r.mq})</span>`;
    html += `</div>`;
  }

  html += `<div style="text-align:center;margin-top:16px;padding:12px;font-size:13px;color:var(--text-dim);font-style:italic">`;
  html += `来年こそは、この舞台に…！`;
  html += `</div>`;

  html += `<div class="btn-row" style="margin-top:12px;justify-content:center">`;
  html += `<button class="btn btn-gold" onclick="App.closePPVTV()">オフシーズンへ →</button>`;
  html += `</div>`;

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
    <div style="margin-top:6px;font-size:12px;color:var(--text-sub)">残り資金: ${Math.floor(G.funds)}万 → ${Math.floor(G.funds - parseInt(fee))}万</div>
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
  renderScout();
  // Re-scroll to rental section
  const titles = document.querySelectorAll('.panel-title');
  for (const t of titles) {
    if (t.textContent.includes('レンタル')) { t.scrollIntoView({ behavior: 'instant', block: 'start' }); break; }
  }
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
function getSponsorIncome() { return Engine.economy.getSponsorIncome(G.orgPop); }
function getBroadcastIncome() { return Engine.economy.getBroadcastIncome(G.orgPop); }
function calcAttendance(venueIdx, mainPop, hasTitleMatch, hasChampOnCard) { return Engine.economy.calcAttendance(G, venueIdx, mainPop, hasTitleMatch, hasChampOnCard, null); }
function calcShowRevenue(venueIdx, attendance) { return Engine.economy.calcShowRevenue(G.roster, venueIdx, attendance); }
function showScreen(id, evt) {
  if (id === 'training') id = 'roster'; // Legacy compat: training tab merged into roster
  Audio.play('click');
  // Safety: 残存オーバーレイがタブ操作をブロックしないよう強制解除
  ['careOverlay','careModalOverlay','notifModalOverlay','confirmOverlay','growthEventOverlay',
   'milestoneOverlay','newspaperOverlay','seasonFanfareOverlay','eventPopupOverlay'].forEach(oid => {
    const el = document.getElementById(oid);
    if (el) { el.classList.remove('active'); el.classList.remove('show'); }
  });
  _popupQueue = []; // タブ切替時にキューもクリア
  // v2.0 fix: 通知トーストの残存ブロック防止
  const _toastEl = document.getElementById('notifEventToast');
  if (_toastEl) { _toastEl.classList.remove('show'); _toastEl.onclick = null; }
  clearTimeout(window._notifTimer);
  clearTimeout(window._notifSafetyTimer);
  clearTimeout(window._notifModalTimer);
  clearTimeout(window._careModalTimer);
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
  const overlay = document.getElementById('growthEventOverlay');
  const box = document.getElementById('growthEventBox');
  if (!overlay || !box) {
    // DOM未準備（コンソールに記録して続行）
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

  box.className = `growth-event-box ${tone}`;
  box.innerHTML = `
    <div class="growth-event-face">${faceHtml}</div>
    <div class="growth-event-name">${fighter ? fighter.name : ''}</div>
    ${hintHtml}
    <div class="growth-event-title">${title}</div>
    <div class="growth-event-msg">${message}</div>
    ${detail ? `<div class="growth-event-detail">${detail}</div>` : ''}
    ${snapHtml}
    <button class="growth-event-btn" onclick="closeGrowthEventPopup()">${btnLabel}</button>
  `;
  overlay.classList.add('active');
}

function closeGrowthEventPopup() {
  const overlay = document.getElementById('growthEventOverlay');
  if (overlay) overlay.classList.remove('active');
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
  const overlay = document.getElementById('milestoneOverlay');
  const box = document.getElementById('milestoneBox');
  if (!overlay || !box) { if (onChoice) onChoice(-1); return; }

  // Phase 1: ナレーション + 3択表示
  let html = `<div class="milestone-title">${evt.title}</div>`;
  html += `<div class="milestone-narration">${evt.narration || ''}</div>`;
  evt.choices.forEach((c, i) => {
    html += `<button class="milestone-choice" data-idx="${i}">${c.label}</button>`;
  });
  box.innerHTML = html;

  // 選択肢クリック → Phase 2: 結果表示
  box.querySelectorAll('.milestone-choice').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.idx);
      const choice = evt.choices[idx];
      Audio.play('event');
      box.innerHTML = `<div class="milestone-title">${evt.title}</div>
        <div class="milestone-result">${choice.result}</div>
        <div class="milestone-effect">${choice.effectLabel}</div>
        <button class="milestone-choice" style="text-align:center;border-color:var(--gold)" id="milestoneClose">閉じる</button>`;
      document.getElementById('milestoneClose').addEventListener('click', function() {
        overlay.classList.remove('active');
        if (onChoice) onChoice(idx);
        _drainPopupQueue();
      });
    });
  });

  overlay.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0: 通知型イベント トースト表示 (event-system-spec-v2.md §3-4)
// 選手顔アイコン＋一言テキスト。数秒で自動消去
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// v2.0: ケアアクション モーダル (event-system-spec-v2.md §2)
// 選手/団体への資金投入UIを提供。アクション選択 → 選手選択 → フィードバック表示
// ─────────────────────────────────────────────────────────────────────────────
function showCareActionModal(state, onConfirm) {
  if (_isPopupActive()) { _popupQueue.push(() => showCareActionModal(state, onConfirm)); return; }
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) return;

  const actions = typeof CARE_ACTIONS !== 'undefined' ? CARE_ACTIONS : {};
  const funds = state.funds || 0;
  const roster = (state.roster || []).filter(f => !f.isRental);

  function renderMain() {
    const individualActions = Object.values(actions).filter(a => a.category === 'individual' && a.condition !== 'slump_or_motivation_loss');
    const slumpActions = Object.values(actions).filter(a => a.category === 'individual' && a.condition === 'slump_or_motivation_loss');
    const teamActions = Object.values(actions).filter(a => a.category === 'team');
    const anyInSlump = roster.some(f => Engine.careActions && Engine.careActions.isInSlump(f));
    const currentWeek = state.week || 0;
    const teamWeekUsed = state._teamCareWeekUsed || {};

    const careStock = state.careStock != null ? state.careStock : 5;
    const careStockMax = state.careStockMax || 5;
    let html = `<div class="care-title">💝 ケアアクション <span style="font-size:12px;font-weight:400;color:var(--text-dim);margin-left:auto">⚡ <strong style="color:${careStock <= 1 ? '#e74c3c' : '#f1c40f'}">${careStock}/${careStockMax}</strong>&nbsp;&nbsp;資金: <strong style="color:#2ecc71">${funds.toLocaleString()}万</strong></span></div>`;

    html += '<div class="care-section-label">👤 個人向け</div>';
    const orgPop = state.orgPop || 0;
    // v3.0: アクション別ストック消費量
    const getStockCost = (id) => id === 'encourage' ? 0 : id === 'camp' ? 2 : 1;
    individualActions.forEach(a => {
      const canAfford = funds >= a.cost;
      const isInjuredOnly = a.condition === 'injured';
      const anyInjured = roster.some(f => f.injury);
      const orgPopLocked = a.minOrgPop && orgPop < a.minOrgPop;
      const sc = getStockCost(a.id);
      const stockInsufficient = sc > 0 && careStock < sc;
      const disabled = !canAfford || (isInjuredOnly && !anyInjured) || orgPopLocked || stockInsufficient ? 'disabled' : '';
      let extraInfo = '';
      if (orgPopLocked) extraInfo = ` <span style="color:#e74c3c;font-size:10px">（知名度 ${a.minOrgPop} で解放）</span>`;
      else if (stockInsufficient) extraInfo = ' <span style="color:#e74c3c;font-size:10px">（ストック不足）</span>';
      else if (isInjuredOnly) extraInfo = ' <span style="color:#f39c12;font-size:10px">（怪我中のみ）</span>';
      const stockLabel = sc === 0 ? '' : ` <span style="color:#f1c40f;font-size:10px">⚡${sc}</span>`;
      html += `<div class="care-action-row ${disabled}" data-action="${a.id}">
        <span class="care-action-emoji">${a.emoji}</span>
        <div class="care-action-info">
          <div class="care-action-name">${a.label}${stockLabel}</div>
          <div class="care-action-desc">${a.desc}${extraInfo}</div>
        </div>
        <span class="care-action-cost">${a.cost > 0 ? a.cost + '万' : '無料'}</span>
      </div>`;
    });

    // スランプケアセクション（対象者がいるときのみ強調表示）
    if (slumpActions.length > 0) {
      const sectionStyle = anyInSlump ? 'color:#e8439f' : '';
      html += `<div class="care-section-label" style="margin-top:16px;${sectionStyle}">💔 スランプ対応${anyInSlump ? '' : ' <span style="font-size:10px;font-weight:400;opacity:0.5">（対象者なし）</span>'}</div>`;
      slumpActions.forEach(a => {
        const canAfford = funds >= a.cost;
        const sc = getStockCost(a.id);
        const stockInsufficient = sc > 0 && careStock < sc;
        const disabled = !canAfford || !anyInSlump || stockInsufficient ? 'disabled' : '';
        let extraInfo = '';
        if (stockInsufficient && anyInSlump) extraInfo = ' <span style="color:#e74c3c;font-size:10px">（ストック不足）</span>';
        const stockLabel = sc === 0 ? '' : ` <span style="color:#f1c40f;font-size:10px">⚡${sc}</span>`;
        html += `<div class="care-action-row ${disabled}" data-action="${a.id}">
          <span class="care-action-emoji">${a.emoji}</span>
          <div class="care-action-info">
            <div class="care-action-name">${a.label}${stockLabel}</div>
            <div class="care-action-desc">${a.desc}${extraInfo}</div>
          </div>
          <span class="care-action-cost">${a.cost > 0 ? a.cost + '万' : '無料'}</span>
        </div>`;
      });
    }

    html += '<div class="care-section-label" style="margin-top:16px">🏟️ 団体向け</div>';
    teamActions.forEach(a => {
      const teamCost = Engine.careActions.calcCost(a, state);
      const canAfford = funds >= teamCost;
      const usedThisWeek = teamWeekUsed[a.id] === currentWeek;
      const sc = getStockCost(a.id);
      const stockInsufficient = sc > 0 && careStock < sc;
      const disabled = !canAfford || usedThisWeek || stockInsufficient ? 'disabled' : '';
      const headcount = roster.filter(f => !f.injury).length;
      const effectiveHead = Math.max(headcount, a.minHeadcount || 4);
      let statusLabel = '';
      if (usedThisWeek) statusLabel = `<span style="color:var(--text-dim);font-size:11px">今週使用済</span>`;
      else if (stockInsufficient) statusLabel = `<span style="color:#e74c3c;font-size:11px">ストック不足</span>`;
      const costLabel = statusLabel
        ? statusLabel
        : `<span class="care-action-cost">${teamCost}万<span style="font-size:10px;color:var(--text-dim);display:block">${a.unitCost}万×${effectiveHead}人</span></span>`;
      const stockLabel = sc === 0 ? '' : ` <span style="color:#f1c40f;font-size:10px">⚡${sc}</span>`;
      html += `<div class="care-action-row ${disabled}" data-action="${a.id}">
        <span class="care-action-emoji">${a.emoji}</span>
        <div class="care-action-info">
          <div class="care-action-name">${a.label}${stockLabel}</div>
          <div class="care-action-desc">${a.desc}</div>
        </div>
        ${costLabel}
      </div>`;
    });

    html += '<button class="care-close-btn" id="careCloseBtn">閉じる</button>';
    box.innerHTML = html;

    // Bind row clicks
    box.querySelectorAll('.care-action-row:not(.disabled)').forEach(row => {
      row.addEventListener('click', function() {
        const actionId = this.dataset.action;
        const cfg = actions[actionId];
        if (!cfg) return;
        if (cfg.category === 'individual') {
          renderFighterSelect(actionId, cfg);
        } else {
          // A-2: 団体向けは確認画面を挟む（誤操作防止）
          renderTeamConfirm(actionId, cfg);
        }
      });
    });
    document.getElementById('careCloseBtn').addEventListener('click', () => overlay.classList.remove('active'));
  }

  // 期待される効果のHTMLを構築
  function _buildExpectHtml(cfg) {
    const items = [];
    const e = cfg.effects || {};
    if (e.trust) items.push(`🤝 信頼が${e.trust >= 2.5 ? '上がる' : '少し上がる'}`);
    if (e.popularity) items.push(`⭐ 人気 +${e.popularity}`);
    if (e.trust_all) items.push(`🤝 全員の信頼が少し上がる`);
    if (e.morale) items.push(`🏠 ロッカールーム雰囲気 +${e.morale}`);
    if (e.growth_boost) items.push(`📈 成長速度 +${Math.round((e.growth_boost.mult - 1) * 100)}%（${e.growth_boost.weeks}週間）`);
    if (e.growth_all) items.push(`📈 全員の成長速度 +${Math.round((e.growth_all.mult - 1) * 100)}%（${e.growth_all.weeks}週間）`);
    if (cfg.id === 'media') items.push('💪 状態 少し回復');
    if (cfg.id === 'special_treatment') items.push('🏥 離脱期間を1〜4週短縮（長期怪我はさらに+1週）');
    if (items.length === 0) return '';
    return `<div class="care-expect"><div class="care-expect-label">期待される効果</div>${items.map(i => `<div class="care-expect-item">${i}</div>`).join('')}</div>`;
  }

  // ── 結果画面（実行後、モーダル内に直接表示） ─────────────────────────────
  function renderResult(data) {
    if (!data) { overlay.classList.remove('active'); return; }
    const { fighter, fighters, repFighter, text, changes, cost, remainingFunds, emoji, label, actionId, isTeam } = data;
    const themeMap = {
      bonus: '#f39c12', costume: '#9b59b6', trainer: '#e74c3c',
      media: '#3498db', special_treatment: '#1abc9c',
      encourage: '#27ae60', refresh_leave: '#16a085',
      party: '#e8439f', camp: '#2980b9',
    };
    const color = themeMap[actionId] || '#e8439f';
    const isPremium = cost >= 100;

    let html = `<div class="care-result-header" style="border-color:${color}">`;
    html += `<span class="care-result-action-emoji">${emoji}</span>`;
    html += `<span class="care-result-action-label">${label}</span>`;
    html += `</div>`;

    if (isTeam && fighters && fighters.length > 0) {
      // 団体向け表示（camp / party）
      const isCamp = actionId === 'camp';
      const iconSize = isCamp ? 72 : 64;
      const teamCls = isCamp ? 'camp-team' : 'party-team';
      html += `<div class="care-result-team-row ${teamCls}">`;
      fighters.forEach(f => {
        html += `<div class="care-result-team-member">${portraitImg(f.id, iconSize, '')}<div class="care-result-team-name">${f.name.split(/\s/).pop()}</div></div>`;
      });
      html += `</div>`;
      // 代表者セリフ
      if (text && repFighter) {
        html += `<div class="care-result-speech" style="border-left-color:${color}80">「${text}」<span style="font-size:11px;color:var(--text-dim);margin-left:6px">— ${repFighter.name}</span></div>`;
      }
      // camp: フレーバーテキスト
      if (isCamp && typeof CAMP_FLAVOR_TEXTS !== 'undefined' && fighters.length >= 2) {
        const tmpl = CAMP_FLAVOR_TEXTS[Math.floor(Math.random() * CAMP_FLAVOR_TEXTS.length)];
        const shuffled = [...fighters].sort(() => Math.random() - 0.5);
        const flavorText = tmpl.replace('{name1}', shuffled[0].name).replace('{name2}', shuffled[1] ? shuffled[1].name : shuffled[0].name);
        html += `<div class="care-result-camp-flavor">${flavorText}</div>`;
      }
    } else if (fighter) {
      html += `<div class="care-result-portrait-wrap">`;
      html += portraitImg(fighter.id, isPremium ? 150 : 120, 'care-result-portrait');
      html += `<div class="care-result-name">${fighter.name}</div>`;
      html += `</div>`;
      if (text) {
        html += `<div class="care-result-speech">「${text}」</div>`;
      }
    }

    if (changes && changes.length > 0) {
      html += `<div class="care-result-changes">`;
      changes.forEach((c, i) => {
        if (c.text !== undefined) {
          html += `<div class="care-result-change" style="animation-delay:${i * 0.08}s">`;
          html += `<span class="care-rc-label">${c.emoji || ''} ${c.label}</span>`;
          html += `<span class="care-rc-val care-rc-up">${c.text}</span></div>`;
        } else {
          const diff = c.after - c.before;
          const cls = diff >= 0 ? 'care-rc-up' : 'care-rc-down';
          const sign = diff >= 0 ? '+' : '';
          html += `<div class="care-result-change" style="animation-delay:${i * 0.08}s">`;
          html += `<span class="care-rc-label">${c.emoji || ''} ${c.label}</span>`;
          html += `<span class="care-rc-val ${cls}">${c.before}<span class="care-rc-arrow"> → </span><strong>${c.after}</strong> <span class="care-rc-diff">(${sign}${diff})</span></span></div>`;
        }
      });
      html += `</div>`;
    }

    if (cost > 0) {
      const fc = remainingFunds < 200 ? '#e74c3c' : 'var(--text-dim)';
      html += `<div class="care-result-cost">費用 <strong style="color:#e8439f">-${cost}万</strong>｜残金 <strong style="color:${fc}">${remainingFunds.toLocaleString()}万</strong></div>`;
    }

    html += `<button class="btn care-result-close-btn" id="careResultCloseBtn" style="border-color:${color};color:${color}">閉じる ✓</button>`;
    box.innerHTML = html;

    requestAnimationFrame(() => {
      box.querySelectorAll('.care-result-change').forEach(el => el.classList.add('care-rc-animate'));
    });
    document.getElementById('careResultCloseBtn').addEventListener('click', () => overlay.classList.remove('active'));
  }

  // A-2: 団体向けアクション確認画面
  function renderTeamConfirm(actionId, cfg) {
    const teamCost = Engine.careActions.calcCost(cfg, state);
    const remainingFunds = funds - teamCost;
    const fundsColor = remainingFunds < 200 ? '#e74c3c' : '#2ecc71';
    const headcount = roster.filter(f => !f.injury).length;
    const effectiveHead = Math.max(headcount, cfg.minHeadcount || 4);
    let html = `<div class="care-title">${cfg.emoji} ${cfg.label}</div>`;
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:14px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${cfg.desc}</div>`;
    html += _buildExpectHtml(cfg);
    html += `<div style="font-size:13px;text-align:center;margin-bottom:14px">費用: <strong>${teamCost}万</strong><span style="font-size:11px;color:var(--text-dim)">（${cfg.unitCost}万×${effectiveHead}人）</span> → 残: <strong style="color:${fundsColor}">${remainingFunds}万</strong></div>`;
    html += `<button class="btn" style="width:100%;margin-bottom:8px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-size:14px;padding:10px" id="careTeamConfirmBtn">実行する</button>`;
    html += '<button class="care-close-btn" id="careTeamBackBtn">← 戻る</button>';
    box.innerHTML = html;

    document.getElementById('careTeamConfirmBtn').addEventListener('click', () => {
      const displayData = onConfirm ? onConfirm(actionId, null) : null;
      if (displayData) renderResult(displayData);
      else overlay.classList.remove('active');
    });
    document.getElementById('careTeamBackBtn').addEventListener('click', renderMain);
  }

  // S1.2: 個人向けアクション確認画面（cost >= 100 のみ）
  function renderIndividualConfirm(actionId, cfg, fighterId) {
    const fighter = roster.find(f => f.id === fighterId);
    if (!fighter) { renderFighterSelect(actionId, cfg); return; }
    const remainingFunds = funds - cfg.cost;
    const fundsColor = remainingFunds < 200 ? '#e74c3c' : '#2ecc71';

    let html = `<div class="care-title">${cfg.emoji} ${cfg.label}</div>`;
    html += `<div style="text-align:center;margin:12px 0">`;
    html += portraitImg(fighter.id, 88, '');
    html += `<div style="font-weight:700;margin-top:6px">${fighter.name}</div>`;
    html += `</div>`;
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:14px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${cfg.desc}</div>`;
    html += _buildExpectHtml(cfg);
    html += `<div style="font-size:13px;text-align:center;margin-bottom:14px">費用: <strong>${cfg.cost}万</strong> → 残: <strong style="color:${fundsColor}">${remainingFunds}万</strong></div>`;
    html += `<button class="btn" style="width:100%;margin-bottom:8px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-size:14px;padding:10px" id="careIndivConfirmBtn">実行する</button>`;
    html += '<button class="care-close-btn" id="careIndivBackBtn">← 戻る</button>';
    box.innerHTML = html;

    document.getElementById('careIndivConfirmBtn').addEventListener('click', () => {
      const displayData = onConfirm ? onConfirm(actionId, fighterId) : null;
      if (displayData) renderResult(displayData);
      else overlay.classList.remove('active');
    });
    document.getElementById('careIndivBackBtn').addEventListener('click', () => renderFighterSelect(actionId, cfg));
  }

  function renderFighterSelect(actionId, cfg) {
    const isInjuredOnly = cfg.condition === 'injured';
    const isSlumpOnly = cfg.condition === 'slump_or_motivation_loss';
    const selectableRoster = isInjuredOnly
      ? roster.filter(f => f.injury)
      : isSlumpOnly
        ? roster.filter(f => !f.injury && Engine.careActions && Engine.careActions.isInSlump(f))
        : roster.filter(f => !f.injury);

    let html = `<div class="care-title">${cfg.emoji} ${cfg.label}</div>`;
    html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">${cfg.desc}</div>`;
    html += '<div class="care-section-label">対象選手を選択（タップで選択）</div>';

    const currentWeek = state.week || 0;
    const cooldown = cfg.cooldown != null ? cfg.cooldown : 1;

    if (selectableRoster.length === 0) {
      html += '<div style="color:var(--text-dim);font-size:13px;padding:12px 0">対象選手がいません</div>';
      html += '<button class="care-close-btn" id="careBackBtn">← 戻る</button>';
      box.innerHTML = html;
      document.getElementById('careBackBtn').addEventListener('click', renderMain);
      return;
    }

    // クールダウン中でない選手を先に、使用済みを後ろにソート
    const sorted = [...selectableRoster].sort((a, b) => {
      const aUsed = currentWeek - ((a._careWeekUsed || {})[actionId] || -99) < cooldown;
      const bUsed = currentWeek - ((b._careWeekUsed || {})[actionId] || -99) < cooldown;
      return (aUsed ? 1 : 0) - (bUsed ? 1 : 0);
    });

    const availableRoster = selectableRoster.filter(f => {
      const lastUsed = (f._careWeekUsed || {})[actionId] || -99;
      return currentWeek - lastUsed >= cooldown;
    });
    const defaultId = availableRoster.length > 0 ? availableRoster[0].id : null;

    if (availableRoster.length === 0) {
      html += '<div style="color:var(--text-dim);font-size:13px;padding:12px 0">今週は全員使用済みです（来週以降また使えます）</div>';
    } else {
      html += '<div class="care-fighter-grid" id="careFighterGrid">';
      sorted.forEach(f => {
        const lastUsed = (f._careWeekUsed || {})[actionId] || -99;
        const onCooldown = currentWeek - lastUsed < cooldown;
        const isSelected = f.id === defaultId;
        const lastName = f.name.split(/\s/).pop();
        const statusTag = f.injury ? '怪我中' : f.slump ? 'スランプ' : f.motivationLoss ? 'モチベ喪失' : '';
        html += `<div class="care-fighter-card${isSelected ? ' selected' : ''}${onCooldown ? ' on-cooldown' : ''}" data-id="${f.id}">`;
        html += portraitImg(f.id, 56, '');
        html += `<div class="care-fighter-card-name">${lastName}</div>`;
        if (statusTag) html += `<div class="care-fighter-card-status">${statusTag}</div>`;
        if (onCooldown) html += '<div class="care-fighter-card-cd">✓済</div>';
        html += '</div>';
      });
      html += '</div>';
      const costLabel = cfg.cost > 0 ? `${cfg.cost}万` : '無料';
      html += `<button class="btn" style="width:100%;margin-bottom:8px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-size:14px;padding:10px" id="careConfirmBtn">実行（${costLabel}）</button>`;
    }

    html += '<button class="care-close-btn" id="careBackBtn">← 戻る</button>';
    box.innerHTML = html;

    let selectedFighterId = defaultId;
    const grid = document.getElementById('careFighterGrid');
    if (grid) {
      grid.addEventListener('click', e => {
        const card = e.target.closest('.care-fighter-card');
        if (!card || card.classList.contains('on-cooldown')) return;
        selectedFighterId = parseInt(card.dataset.id);
        grid.querySelectorAll('.care-fighter-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    }

    const confirmBtn = document.getElementById('careConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (cfg.cost >= 100) {
          renderIndividualConfirm(actionId, cfg, selectedFighterId);
        } else {
          const displayData = onConfirm ? onConfirm(actionId, selectedFighterId) : null;
          if (displayData) renderResult(displayData);
          else overlay.classList.remove('active');
        }
      });
    }
    document.getElementById('careBackBtn').addEventListener('click', renderMain);
  }

  renderMain();
  overlay.classList.add('active');
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
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onChoice) onChoice(-1); return; }

  const roster = state ? (state.roster || []) : [];
  const fighter = event.fighter != null ? roster.find(f => f.id === event.fighter) : null;

  // イベント種別ラベル
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
  const borderColor = isUrgent ? '#e74c3c' : 'rgba(232,67,147,0.3)';

  let html = `<div class="care-title" style="border-bottom:1px solid ${borderColor};padding-bottom:10px;margin-bottom:12px">${title}</div>`;

  // 選手の顔 + セリフ
  if (fighter) {
    const face = portraitImg(fighter.id, 88, 'care-reaction-portrait');
    const dialogue = event.dialogue || '';
    html += `<div class="care-reaction" style="border-color:${borderColor}">
      ${face}
      <div class="care-reaction-bubble" style="border-color:${isUrgent ? '#e74c3c' : '#e8439f'}">
        <strong style="font-size:12px;color:var(--text-dim)">${fighter.name}</strong><br>
        「${dialogue}」
      </div>
    </div>`;
  } else if (event.type === 'E5') {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">
      📣 近隣エリアの地域イベント実行委員会から営業試合の依頼が届きました。
    </div>`;
  }

  // 選択肢ボタン
  const choices = event.choices || [{ label: '了解', hint: '', idx: 0 }];
  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">';
  choices.forEach(c => {
    const disabled = c.disabled ? 'disabled style="opacity:0.4;cursor:default"' : '';
    const hintHtml = c.hint ? `<span style="font-size:11px;color:var(--text-dim);margin-left:8px">${c.hint}</span>` : '';
    html += `<button class="btn" data-choice="${c.idx}" ${disabled}
      style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
      <span>${c.label}</span>${hintHtml}
    </button>`;
  });
  html += '</div>';

  box.innerHTML = html;

  box.querySelectorAll('.btn[data-choice]').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.choice);
      Audio.play('click');
      if (onChoice) onChoice(idx);
      // 結果ポップアップが表示されなかった場合のみ閉じる
      if (!overlay.classList.contains('active')) return;
      if (!box.querySelector('.choice-result-close-btn')) overlay.classList.remove('active');
    });
  });

  overlay.classList.add('active');
}

/** 選択型イベント結果ポップアップ（careOverlay/careBox 再利用）*/
function showChoiceEventResult(event, resultTexts, state) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) return;

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

  let html = `<div class="care-result-header" style="border-color:rgba(232,67,147,0.3)">`;
  html += `<span class="care-result-action-emoji">${(title.match(/^./) || [''])[0]}</span>`;
  html += `<span class="care-result-action-label">${title.replace(/^.\s*/, '')}</span>`;
  html += `</div>`;

  if (fighter) {
    const upperUrl = getUpperUrl(fighter.id);
    if (upperUrl) {
      html += `<div style="text-align:center;margin:8px 0 4px">`;
      html += `<img src="${upperUrl}" style="max-height:200px;width:auto;object-fit:cover;object-position:top center;border-radius:8px;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.6))" onerror="this.style.display='none'" alt="">`;
      html += `</div>`;
    } else {
      html += portraitImg(fighter.id, 120, 'care-result-portrait');
    }
    html += `<div class="care-result-name">${fighter.name}</div>`;
  }

  if (resultTexts && resultTexts.length > 0) {
    html += `<div style="margin:10px 0 14px">`;
    resultTexts.forEach(t => {
      html += `<div style="font-size:13px;line-height:1.7;color:var(--text);padding:8px 14px;background:rgba(200,190,170,0.05);border:1px solid rgba(200,190,170,0.08);border-radius:8px;margin-bottom:6px;text-align:center">${t}</div>`;
    });
    html += `</div>`;
  }

  html += `<button class="btn choice-result-close-btn" style="width:100%;padding:10px;font-size:13px;font-weight:600;border:1px solid rgba(232,67,147,0.3);color:#e8439f">閉じる ✓</button>`;

  box.innerHTML = html;
  overlay.classList.add('active');

  box.querySelector('.choice-result-close-btn').addEventListener('click', () => {
    overlay.classList.remove('active');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0 Phase1-6: 大型イベント モーダル（B1〜B4）
// careOverlay/careBox を再利用。多段階対応（step パラメータ）
// ─────────────────────────────────────────────────────────────────────────────
function showLargeEventModal(event, state, step, onChoice) {
  if (step === 0 && _isPopupActive()) { _popupQueue.push(() => showLargeEventModal(event, state, step, onChoice)); return; }
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onChoice) onChoice(-1); return; }

  const roster = state ? (state.roster || []) : [];
  let html = '';

  switch (event.type) {
    case 'B1': html = _buildB1Modal(event, state, roster); break;
    case 'B2':
      if (step === 0) html = _buildB2Step1(event, state, roster);
      else if (step === 1) html = _buildB2Step2(event, state, roster);
      else html = _buildB2Step3(event, state, roster);
      break;
    case 'B3':
      if (step === 0) html = _buildB3Step1(event, state);
      else if (step === 1) html = _buildB3Step2(event, state, roster);
      else html = _buildB3Step3(event, state, roster);
      break;
    case 'B4': html = _buildB4Modal(event, state, roster); break;
    default: html = '<div class="care-title">不明なイベント</div><button class="btn" data-choice="0">閉じる</button>';
  }

  box.innerHTML = html;

  // ボタンイベント（通常の選択肢）
  box.querySelectorAll('.btn[data-choice]').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.hasAttribute('disabled')) return;
      overlay.classList.remove('active');
      const idx = parseInt(this.dataset.choice);
      Audio.play('click');
      if (onChoice) onChoice(idx);
    });
  });

  // 選手選択グリッド（B3 Step2, B4）
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
  const face = fighter ? portraitImg(fighter.id, 88, 'care-reaction-portrait') : '';
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
  const face1 = f1 ? portraitImg(f1.id, 88, 'care-reaction-portrait') : '';
  const face2 = f2 ? portraitImg(f2.id, 88, 'care-reaction-portrait') : '';

  let html = `<div class="care-title" style="border-bottom:1px solid #e74c3c;padding-bottom:10px;margin-bottom:12px">💥 選手間の深刻な対立</div>`;

  if (event.detail) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${event.detail}</div>`;
  }

  // 2人の選手のセリフを並べる
  if (f1) {
    html += `<div class="care-reaction" style="border-color:#e74c3c;margin-bottom:8px">
      ${face1}
      <div class="care-reaction-bubble" style="border-color:#e74c3c">
        <strong style="font-size:12px;color:var(--text-dim)">${f1.name}</strong><br>
        「${event.dialogue || '…'}」
      </div>
    </div>`;
  }
  if (f2) {
    html += `<div class="care-reaction" style="border-color:#e74c3c">
      ${face2}
      <div class="care-reaction-bubble" style="border-color:#e74c3c">
        <strong style="font-size:12px;color:var(--text-dim)">${f2.name}</strong><br>
        「${event.dialogue2 || '…'}」
      </div>
    </div>`;
  }

  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">';
  html += `<button class="btn" data-choice="0" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>話し合いで解決</span><span style="font-size:11px;color:var(--text-dim)">両者の信頼が上がる、士気も回復</span></button>`;
  html += `<button class="btn" data-choice="1" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>試合で決着させる</span><span style="font-size:11px;color:var(--text-dim)">勝者の信頼が大きく上がる、敗者は下がる</span></button>`;
  html += `<button class="btn" data-choice="2" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>放置する</span><span style="font-size:11px;color:var(--text-dim)">両者の信頼が大きく下がる、士気も低下</span></button>`;
  html += '</div>';
  return html;
}

// ── B2 Step 2: 介入選択 ───────────────────────────────────────────────────
function _buildB2Step2(event, state, roster) {
  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);

  let html = `<div class="care-title" style="border-bottom:1px solid #9b59b6;padding-bottom:10px;margin-bottom:12px">🤫 試合前の介入</div>`;
  html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:14px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">
    試合の前に、どちらかに声をかけますか？<br>
    <span style="font-size:11px;color:var(--text-dim)">激励された選手は試合でわずかに有利になります</span>
  </div>`;

  html += '<div style="display:flex;flex-direction:column;gap:8px">';
  const n1 = f1 ? f1.name : event.name1;
  const n2 = f2 ? f2.name : event.name2;
  const ovr1 = f1 ? Engine.util.ov(f1) : '?';
  const ovr2 = f2 ? Engine.util.ov(f2) : '?';
  html += `<button class="btn" data-choice="0" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>${n1}を激励する（OVR ${ovr1}）</span><span style="font-size:11px;color:var(--text-dim)">OVR+5バフ</span></button>`;
  html += `<button class="btn" data-choice="1" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>${n2}を激励する（OVR ${ovr2}）</span><span style="font-size:11px;color:var(--text-dim)">OVR+5バフ</span></button>`;
  html += `<button class="btn" data-choice="2" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>介入しない</span><span style="font-size:11px;color:var(--text-dim)">純粋な実力勝負</span></button>`;
  html += '</div>';
  return html;
}

// ── B2 Step 3: 試合結果 ───────────────────────────────────────────────────
function _buildB2Step3(event, state, roster) {
  const result = event.matchResult;
  if (!result) return '<div class="care-title">試合結果</div><button class="btn" data-choice="0">閉じる</button>';

  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);
  const n1 = f1 ? f1.name : event.name1;
  const n2 = f2 ? f2.name : event.name2;

  let resultText = '';
  let emoji = '';
  if (result.winner === 'draw') {
    resultText = `${n1}と${n2}は引き分け。互いの実力を認め合った。`;
    emoji = '🤝';
  } else {
    const winnerName = result.winner === 'fighter1' ? n1 : n2;
    const loserName = result.winner === 'fighter1' ? n2 : n1;
    resultText = `${winnerName}が${loserName}に勝利！ 対立に決着がついた。`;
    emoji = '🏆';
  }

  let html = `<div class="care-title" style="border-bottom:1px solid #27ae60;padding-bottom:10px;margin-bottom:12px">${emoji} 決着の試合 — 結果</div>`;
  html += `<div style="font-size:14px;text-align:center;padding:20px 10px;line-height:1.8">
    <div style="font-size:16px;font-weight:700;margin-bottom:12px">${resultText}</div>
    <div style="font-size:12px;color:var(--text-dim)">MQ: ${result.mq || '?'}</div>
  </div>`;
  html += `<button class="btn" data-choice="0" style="width:100%;padding:10px;font-size:13px;font-weight:600">了解</button>`;
  return html;
}

// ── B3 Step 1: 対抗戦オファー ──────────────────────────────────────────────
function _buildB3Step1(event, state) {
  const challenger = event.challenger || {};
  const orgName = event.orgName || '他団体';
  const cOvr = challenger.pw ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5) : '?';
  const face = portraitImg(challenger.id, 88, 'care-reaction-portrait');

  let html = `<div class="care-title" style="border-bottom:2px solid #e74c3c;padding-bottom:10px;margin-bottom:12px">⚔️ ${orgName}からの対抗戦オファー</div>`;

  if (event.detail) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(200,190,170,0.04);border-radius:6px">${event.detail}</div>`;
  }

  // 挑戦者の挑発的なセリフ
  html += `<div class="care-reaction" style="border-color:#e74c3c">
    ${face}
    <div class="care-reaction-bubble" style="border-color:#e74c3c">
      <strong style="font-size:12px;color:var(--text-dim)">${challenger.name || '???'}（${orgName}・OVR ${cOvr}）</strong><br>
      「${event.challengerDialogue || '…'}」
    </div>
  </div>`;

  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">';
  html += `<button class="btn" data-choice="0" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;border-color:#e74c3c">
    <span>受けて立つ</span><span style="font-size:11px;color:var(--text-dim)">代表選手を選んで対戦</span></button>`;
  html += `<button class="btn" data-choice="1" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>断る</span><span style="font-size:11px;color:var(--text-dim)">ペナルティなし</span></button>`;
  html += '</div>';
  return html;
}

// ── B3 Step 2: 代表選手選択 ────────────────────────────────────────────────
function _buildB3Step2(event, state, roster) {
  const available = roster.filter(f => !f.injury && !f.isRental);
  const challenger = event.challenger || {};
  const cOvr = challenger.pw ? Math.round((challenger.pw + challenger.sp + challenger.te + challenger.st + challenger.mn) / 5) : '?';

  let html = `<div class="care-title" style="border-bottom:1px solid #e74c3c;padding-bottom:10px;margin-bottom:12px">🥊 代表選手を選べ</div>`;
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px">対戦相手: ${challenger.name || '???'}（OVR ${cOvr}）</div>`;

  html += '<div class="large-evt-roster-grid">';
  available.forEach(f => {
    const ovr = Engine.util.ov(f);
    const face = portraitImg(f.id, 40, '');
    html += `<div class="large-evt-fighter-pick" data-fighter-id="${f.id}">
      ${face}
      <div style="font-size:11px;font-weight:600;margin-top:2px">${f.name}</div>
      <div style="font-size:10px;color:var(--text-dim)">OVR ${ovr}</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// ── B3 Step 3: 対抗戦結果 ──────────────────────────────────────────────────
function _buildB3Step3(event, state, roster) {
  const result = event.matchResult;
  if (!result) return '<div class="care-title">対抗戦結果</div><button class="btn" data-choice="0">閉じる</button>';

  const challenger = event.challenger || {};
  const orgName = event.orgName || '他団体';
  const playerFighter = roster.find(f => f.id === event.selectedFighterId);
  const pName = playerFighter ? playerFighter.name : '代表選手';

  let resultText = '', emoji = '', challengerLine = '';
  const dialogues = typeof LARGE_EVENT_DIALOGUES !== 'undefined' ? LARGE_EVENT_DIALOGUES : {};

  if (result.winner === 'left') {
    resultText = `${pName}が${challenger.name || '???'}に勝利！ ${orgName}を返り討ちにした！`;
    emoji = '🎉';
    const lines = dialogues.B3_result_lose || ['…'];
    challengerLine = lines[Math.floor(Math.random() * lines.length)];
  } else if (result.winner === 'right') {
    resultText = `${pName}が${challenger.name || '???'}に敗北… ${orgName}の前に屈した。`;
    emoji = '😞';
    const lines = dialogues.B3_result_win || ['…'];
    challengerLine = lines[Math.floor(Math.random() * lines.length)];
  } else {
    resultText = `${pName}と${challenger.name || '???'}は引き分け。互角の戦いを見せた。`;
    emoji = '🤼';
    challengerLine = '…次はこうはいかない';
  }

  let html = `<div class="care-title" style="border-bottom:2px solid ${result.winner === 'left' ? '#27ae60' : '#e74c3c'};padding-bottom:10px;margin-bottom:12px">${emoji} 対抗戦 — 結果</div>`;
  html += `<div style="font-size:15px;text-align:center;padding:16px 10px;line-height:1.8;font-weight:700">${resultText}</div>`;
  html += `<div style="font-size:12px;color:var(--text-dim);text-align:center;margin-bottom:12px">MQ: ${result.mq || '?'}</div>`;

  // 挑戦者の反応セリフ
  if (challengerLine) {
    const face = portraitImg(challenger.id, 40, 'care-reaction-portrait');
    html += `<div class="care-reaction" style="border-color:#e74c3c;margin-bottom:14px">
      ${face}
      <div class="care-reaction-bubble" style="border-color:#e74c3c">
        <strong style="font-size:11px;color:var(--text-dim)">${challenger.name || '???'}</strong><br>
        「${challengerLine}」
      </div>
    </div>`;
  }

  html += `<button class="btn" data-choice="0" style="width:100%;padding:10px;font-size:13px;font-weight:600">了解</button>`;
  return html;
}

// ── B4: メディア密着取材 ───────────────────────────────────────────────────
function _buildB4Modal(event, state, roster) {
  const available = roster.filter(f => !f.injury);
  const outletName = event.outletName || 'メディア';

  let html = `<div class="care-title" style="border-bottom:1px solid #3498db;padding-bottom:10px;margin-bottom:12px">📺 ${outletName}からの密着取材オファー</div>`;

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
    const face = portraitImg(f.id, 40, '');
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
        const diff = c.after - c.before;
        const cls = diff >= 0 ? 'care-modal-change-up' : 'care-modal-change-down';
        changesHtml += `<div class="care-modal-change"><span class="care-modal-change-label">${c.emoji || ''} ${c.label}</span><span class="care-modal-change-value ${cls}">${c.before} → ${c.after}</span></div>`;
      }
    });
    changesHtml += '</div>';
  }

  const costHtml = cost > 0 ? `<div class="care-modal-cost">-${cost}万（残金: ${remainingFunds.toLocaleString()}万）</div>` : '';

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
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { showToast(event.text || ''); return; }

  const isWarning = event.type === 'N5'
    || event.type === 'N_isolation'
    || event.type === 'N_coach_report'
    || event.type === 'N_sudden_departure';

  const f1Id = event.fighter;
  const f2Id = event.fighter2;
  let portraitsHtml = '';
  if (f1Id != null && f2Id != null) {
    portraitsHtml = `<div class="notif-modal-portraits">${portraitImg(f1Id, 100, 'notif-modal-face dual')}${portraitImg(f2Id, 100, 'notif-modal-face dual')}</div>`;
  } else if (f1Id != null) {
    portraitsHtml = `<div class="notif-modal-portraits">${portraitImg(f1Id, 120, 'notif-modal-face')}</div>`;
  }

  const textHtml = event.text ? `<div class="notif-modal-text">${event.text}</div>` : '';
  const detailHtml = event.detail ? `<div class="notif-modal-detail">${event.detail}</div>` : '';
  const dialogueHtml = event.dialogue ? `<div class="notif-modal-dialogue">「${event.dialogue}」</div>` : '';

  box.className = 'notif-modal-box' + (isWarning ? ' notif-warning' : '');
  box.innerHTML = `
    ${portraitsHtml}
    ${textHtml}
    ${detailHtml}
    ${dialogueHtml}
    <button class="notif-modal-btn" onclick="closeNotifModal()">OK</button>
  `;
  overlay.classList.add('active');
  Audio.play('event');
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeNotifModal, 60000);
}

function closeNotifModal() {
  const overlay = document.getElementById('notifModalOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(window._notifModalTimer);
  // P4-P6: Glimpseキューの次を表示
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
  const d = _matchDialogueQueue[0];

  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { _matchDialogueQueue.shift(); return; }

  const rb = d.rivalryBonus || {};
  const rivalryColor = rb.color || '#e17055';

  box.className = 'notif-modal-box notif-dramatic';
  box.innerHTML = `
    <div style="font-size:12px;color:var(--text-dim);margin-bottom:10px;letter-spacing:1px">${d.matchLabel || ''} ${rb.emoji || '🔥'}${rb.label || '因縁'}</div>
    <div style="display:flex;align-items:flex-end;justify-content:center;gap:10px;margin-bottom:16px">
      <div style="text-align:center">
        ${portraitImg(d.winnerId, 130, 'notif-modal-face')}
        <div style="margin-top:6px;font-size:14px;font-weight:700;color:var(--gold)">${d.winnerName}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding-bottom:30px">
        <span style="font-size:28px;filter:drop-shadow(0 0 8px ${rivalryColor})">⚔️</span>
      </div>
      <div style="text-align:center">
        ${portraitImg(d.loserId, 100, 'notif-modal-face')}
        <div style="margin-top:6px;font-size:13px;color:var(--text-sub)">${d.loserName}</div>
      </div>
    </div>
    <div style="margin-bottom:12px;padding:12px 16px;background:rgba(212,168,67,0.08);border-left:3px solid var(--gold);border-radius:4px">
      <div style="font-size:11px;color:var(--gold);margin-bottom:4px;font-weight:700">WINNER</div>
      <div style="font-size:15px;color:var(--text-main);line-height:1.6">${d.winnerName}:「${d.winLine}」</div>
    </div>
    <div style="margin-bottom:16px;padding:12px 16px;background:rgba(231,76,60,0.06);border-left:3px solid ${rivalryColor};border-radius:4px">
      <div style="font-size:11px;color:${rivalryColor};margin-bottom:4px;font-weight:700">LOSER</div>
      <div style="font-size:15px;color:var(--text-sub);line-height:1.6">${d.loserName}:「${d.loseLine}」</div>
    </div>
    <button class="notif-modal-btn" onclick="closeMatchDialogue()">OK</button>
  `;
  overlay.classList.add('active');
  Audio.play('event');
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeMatchDialogue, 60000);
}

function closeMatchDialogue() {
  const overlay = document.getElementById('notifModalOverlay');
  if (overlay) overlay.classList.remove('active');
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

function showGlimpseAModal(glimpse) {
  _glimpseQueue.push({ ...glimpse, _renderer: 'A' });
  if (_glimpseQueue.length === 1) {
    _enqueuePopup(() => _renderNextGlimpse());
  }
}

function showGlimpseBModal(glimpse) {
  _glimpseQueue.push({ ...glimpse, _renderer: 'B' });
  if (_glimpseQueue.length === 1) {
    _enqueuePopup(() => _renderNextGlimpse());
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

  const toneClass = glimpse.tone === 'gold' ? 'notif-gold'
    : glimpse.tone === 'warning' || glimpse.tone === 'danger' ? 'notif-warning'
    : glimpse.tone === 'dramatic' ? 'notif-dramatic' : '';

  let portraitsHtml = '';
  if (glimpse.targetId) {
    // 二人表示（bond/rivalry）— 発信者を大きく強調
    const axisIcon = glimpse.axis === 'rivalry' ? '⚡' : glimpse.tone === 'negative' ? '💔' : '💙';
    const axisColor = glimpse.axis === 'rivalry' ? '#e17055' : glimpse.tone === 'negative' ? '#e74c3c' : '#74b9ff';
    portraitsHtml = `<div class="notif-modal-portraits" style="gap:6px;align-items:flex-end">
      ${portraitImg(glimpse.speakerId, 140, 'notif-modal-face dual')}
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding-bottom:24px">
        <span style="font-size:32px;filter:drop-shadow(0 0 8px ${axisColor})">${axisIcon}</span>
        <span style="font-size:22px;font-weight:900;color:${axisColor};letter-spacing:2px;text-shadow:0 0 12px ${axisColor}">→</span>
      </div>
      ${portraitImg(glimpse.targetId, 90, 'notif-modal-face dual')}
    </div>
    <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:8px">
      <span style="font-size:16px;font-weight:700;color:var(--text-main)">${glimpse.speakerName}</span>
      <span style="font-size:14px;color:${axisColor};font-weight:700">→</span>
      <span style="font-size:13px;color:var(--text-dim)">${glimpse.targetName}</span>
    </div>`;
  } else {
    // 一人表示（trust）
    portraitsHtml = `<div class="notif-modal-portraits">
      ${portraitImg(glimpse.speakerId, 120, 'notif-modal-face')}
    </div>
    <div style="font-size:14px;color:var(--text-sub);margin-bottom:8px">${glimpse.speakerName}</div>`;
  }

  box.className = 'notif-modal-box' + (toneClass ? ` ${toneClass}` : '');
  box.innerHTML = `
    ${portraitsHtml}
    <div style="font-size:13px;color:var(--text-dim);margin-bottom:10px">${glimpse.label}</div>
    <div class="notif-modal-dialogue">「${glimpse.dialogue}」</div>
    <button class="notif-modal-btn" onclick="closeNotifModal()">OK</button>
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

  let portraitsHtml = '';
  if (glimpse.targetId) {
    const axisIcon = glimpse.axis === 'rivalry' ? '⚡' : glimpse.tone === 'negative' ? '💔' : '💙';
    const axisColor = glimpse.axis === 'rivalry' ? '#e17055' : glimpse.tone === 'negative' ? '#e74c3c' : '#74b9ff';
    portraitsHtml = `<div class="notif-modal-portraits" style="gap:4px;align-items:flex-end">
      ${portraitImg(glimpse.speakerId, 110, 'notif-modal-face dual')}
      <div style="display:flex;flex-direction:column;align-items:center;gap:1px;padding-bottom:16px">
        <span style="font-size:24px;filter:drop-shadow(0 0 6px ${axisColor})">${axisIcon}</span>
        <span style="font-size:18px;font-weight:900;color:${axisColor}">→</span>
      </div>
      ${portraitImg(glimpse.targetId, 70, 'notif-modal-face dual')}
    </div>`;
  } else {
    portraitsHtml = `<div class="notif-modal-portraits">
      ${portraitImg(glimpse.speakerId, 100, 'notif-modal-face')}
    </div>`;
  }

  box.className = 'notif-modal-box';
  box.innerHTML = `
    ${portraitsHtml}
    <div style="font-size:13px;color:var(--text-sub);margin-bottom:4px">${glimpse.speakerName}</div>
    <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px">${glimpse.label}</div>
    <div class="notif-modal-dialogue">「${glimpse.dialogue}」</div>
    <button class="notif-modal-btn" onclick="closeNotifModal()">OK</button>
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
// v2.1: エンディング演出 — ending-gameover-spec-v1.0.md §1.3
// ─────────────────────────────────────────────────────────────────────────────

/** エンディング演出（5スライド）。awardsOverlay / awardsBox を再利用 */
function showEndingCeremony(data, onDone) {
  const steps = [];

  // ランダムセリフを重複なしで取得するユーティリティ
  function _pickLines(pool, n) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // 選手・コーチのセリフプール
  const fighterLineObj = (typeof ENDING_LINES !== 'undefined' && ENDING_LINES.fighter) || null;
  const coachLines     = (typeof ENDING_LINES !== 'undefined' && ENDING_LINES.coach)   || [];

  // ── スライド1: タイトル（業界制覇） ─────────────────────────────
  steps.push(() => {
    _renderAwardsSlide(
      `<div class="awards-title">━━ シーズン${data.season} ━━</div>
      <div style="font-size:42px;margin:12px 0">🏆</div>
      <div class="awards-title" style="font-size:18px;letter-spacing:5px;color:var(--gold)">業 界 制 覇</div>
      <div class="awards-detail" style="margin:14px 0 22px;font-size:13px">「${data.orgName}」が頂点に立った。</div>
      <button class="awards-btn" onclick="window._endingNext()">開始 ▶</button>`,
      'a'
    );
  });

  // ── スライド2: 道のりサマリー ────────────────────────────────────
  steps.push(() => {
    const peakPop = Math.round(data.peakOrgPop || 0);
    _renderAwardsSlide(
      `<div class="awards-title">━━ 頂点への道のり ━━</div>
      <div style="margin:16px 0 18px">
        <div class="awards-summary-row"><span class="awards-summary-label" style="width:100px">活動期間</span><span>${data.season} シーズン</span></div>
        <div class="awards-summary-row"><span class="awards-summary-label" style="width:100px">最終レーティング</span><span>${data.playerRating}</span></div>
        <div class="awards-summary-row"><span class="awards-summary-label" style="width:100px">最高団体人気</span><span>${peakPop}</span></div>
        <div class="awards-summary-row"><span class="awards-summary-label" style="width:100px">興行回数</span><span>${data.totalShows} 回</span></div>
        <div class="awards-summary-row"><span class="awards-summary-label" style="width:100px">ベストマッチ</span><span>MQ ${data.bestMQ}</span></div>
        <div class="awards-summary-row"><span class="awards-summary-label" style="width:100px">殿堂入り</span><span>${data.hallOfFameCount} 名</span></div>
      </div>
      <button class="awards-btn" onclick="window._endingNext()">次へ ▶</button>`,
      'b'
    );
  });

  // ── スライド3: 選手たちの声 ──────────────────────────────────────
  const fighters = data.top3Fighters || [];
  if (fighters.length > 0) {
    steps.push(() => {
      let fHtml = fighters.map((f) => {
        const ovrRaw = typeof Engine !== 'undefined' && Engine.util ? Engine.util.ov(f) : NaN;
        const ovr = isNaN(ovrRaw) ? (f.ovr || '—') : ovrRaw;
        const line = fighterLineObj ? pickDialogueLine(fighterLineObj, f) : '最高だ！';
        return `<div style="flex:1;text-align:center;min-width:0">
          <div style="display:flex;justify-content:center;margin-bottom:5px">${_awardsPortrait(f.id, 80)}</div>
          <div style="font-size:11px;font-weight:700;color:var(--text)">${f.name}</div>
          <div style="font-size:10px;color:var(--text-dim)">OVR ${ovr}</div>
          <div style="font-size:10px;color:var(--text-sub);font-style:italic;margin-top:5px;line-height:1.5">「${line}」</div>
        </div>`;
      }).join('');
      _renderAwardsSlide(
        `<div class="awards-title">━━ 選手たちの声 ━━</div>
        <div style="display:flex;justify-content:center;gap:8px;margin:12px 0 16px">${fHtml}</div>
        <button class="awards-btn" onclick="window._endingNext()">次へ ▶</button>`,
        'e'
      );
    });
  }

  // ── スライド4: スタッフの声（コーチがいる場合のみ） ──────────────
  const coaches = (data.coaches || []).slice(0, 3);
  if (coaches.length > 0) {
    const cLines = _pickLines(coachLines, coaches.length);
    steps.push(() => {
      let cHtml = coaches.map((c, i) => {
        const ALL_C = (typeof ALL_COACHES !== 'undefined') ? ALL_COACHES : [];
        const master = ALL_C.find(x => x.id === c.id) || c;
        const url = typeof getCoachPortraitUrl === 'function' ? getCoachPortraitUrl(c.id) : '';
        const face = url
          ? `<img src="${url}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(212,168,67,0.4)" alt="">`
          : `<div style="width:72px;height:72px;border-radius:50%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:36px;border:3px solid rgba(212,168,67,0.3)">${master.emoji || '👤'}</div>`;
        return `<div style="flex:1;text-align:center;min-width:0">
          <div style="display:flex;justify-content:center;margin-bottom:5px">${face}</div>
          <div style="font-size:11px;font-weight:700;color:var(--text)">${master.name || c.name || '—'}</div>
          <div style="font-size:10px;color:var(--text-sub);font-style:italic;margin-top:5px;line-height:1.5">「${cLines[i] || 'お疲れ様でした'}」</div>
        </div>`;
      }).join('');
      _renderAwardsSlide(
        `<div class="awards-title">━━ スタッフの声 ━━</div>
        <div style="display:flex;justify-content:center;gap:12px;margin:12px 0 16px">${cHtml}</div>
        <button class="awards-btn" onclick="window._endingNext()">次へ ▶</button>`,
        'd'
      );
    });
  }

  // ── スライド5: 締めくくり ────────────────────────────────────────
  steps.push(() => {
    _renderAwardsSlide(
      `<div class="awards-plaque">🏆</div>
      <div class="awards-title" style="letter-spacing:3px">CONGRATULATIONS</div>
      <div class="awards-detail" style="margin:14px 0;line-height:1.8;font-size:13px">
        「${data.orgName}」は<br>女子プロレス界の頂点に立った。<br><br>
        しかし、戦いはまだ続く——<br>この先に待つのは、新たな伝説の始まり。
      </div>
      <button class="awards-btn" id="endingContinueBtn" onclick="window._endingNext()">続ける ▶</button>`,
      'f'
    );
    document.getElementById('awardsBox').classList.add('hall-of-fame');
  });

  // ── キュー実行 ───────────────────────────────────────────────────
  let idx = 0;
  window._endingNext = () => {
    // 最終スライドの「続ける」: BGMフェードアウト後に閉じる
    if (idx === steps.length - 1) {
      document.getElementById('awardsOverlay').classList.remove('active');
      window._endingNext = null;
      const doClose = () => { if (onDone) onDone(); };
      if (Audio && Audio.fileBgm) Audio.fileBgm.fadeOut(2000).then(doClose);
      else doClose();
      return;
    }
    // スライド1の「開始▶」クリック時にBGM開始（ユーザー操作内で呼ぶ必要があるため）
    if (idx === 0 && Audio && Audio.fileBgm) {
      Audio.fileBgm.play('../bgm/8bit-jo-jokyoku.mp3', { loop: true, volume: 0.05 });
    }
    document.getElementById('awardsOverlay').classList.remove('active');
    idx++;
    setTimeout(() => {
      steps[idx]();
      document.getElementById('awardsOverlay').classList.add('active');
      Audio.play('reveal');
    }, 280);
  };

  steps[0]();
  document.getElementById('awardsOverlay').classList.add('active');
  Audio.play('fanfare');
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
  try { if (typeof Audio !== 'undefined' && Audio.fileBgm) Audio.fileBgm.play('../bgm/iwa_gameover001.mp3', { volume: 0.08 }); } catch(e) {}
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
    alert(`【${featureName}】は製品版で遊べます！\nDLsite / BOOTH で製品版をチェックしてください。`);
    return true;
  }
  box.innerHTML = `
    <div class="panel-title" style="color:var(--gold);margin-bottom:12px">🔒 製品版限定機能</div>
    <p style="line-height:1.8;margin-bottom:20px">
      【${featureName}】は製品版で解放されます！<br>
      DLsite / BOOTH で製品版をチェックしてください。
    </p>
    <button class="btn btn-gold" style="min-width:120px"
      onclick="document.getElementById('confirmOverlay').classList.remove('active')">閉じる</button>`;
  overlay.classList.add('active');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 契約更新交渉UI (contract-negotiation-event-spec v1.0)
// careOverlay/careBox を再利用する3画面構成
// ─────────────────────────────────────────────────────────────────────────────

// 画面1: サマリー — 「シーズンN 契約更新 ／ 意見あり：M名」
function showContractSummaryModal(negotiations, autoCount, season, onStart) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onStart) onStart(); return; }

  let facesHtml = negotiations.map(n => {
    const attBadge = n.attitude === 'sudden_departure'
      ? '<span style="font-size:10px;color:#8e44ad">⚡ 突発退団</span>'
      : n.attitude === 'raise'
        ? '<span style="font-size:10px;color:#f39c12">💰 昇給要求</span>'
        : '<span style="font-size:10px;color:#e74c3c">🚪 移籍志願</span>';
    return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:4px;margin:4px 8px">
      ${portraitImg(n.fighterId, 52)}
      <span style="font-size:11px">${n.fighterName}</span>
      ${attBadge}
    </div>`;
  }).join('');

  box.innerHTML = `
    <div class="care-title" style="border-bottom:1px solid rgba(232,67,147,0.3);padding-bottom:10px;margin-bottom:12px">
      📋 シーズン${season} 契約更新
    </div>
    <div style="font-size:13px;color:var(--text-sub);margin-bottom:14px">
      自動更新: <strong>${autoCount}名</strong>　／　意見あり: <strong style="color:#e74c3c">${negotiations.length}名</strong>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:16px;padding:10px;background:rgba(200,190,170,0.03);border-radius:8px">
      ${facesHtml}
    </div>
    <button class="btn btn-gold" id="contractStartBtn" style="width:100%;padding:12px;font-size:14px;font-weight:700">
      交渉を始める
    </button>`;

  document.getElementById('contractStartBtn').addEventListener('click', () => {
    overlay.classList.remove('active');
    Audio.play('click');
    if (onStart) onStart();
  });
  overlay.classList.add('active');
}

// 画面2: 1対1交渉 — 選手の顔+セリフ+選択肢
function showContractNegotiationModal(neg, idx, total, state, onChoice) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onChoice) onChoice(0); return; }

  const fighter = (state.roster || []).find(f => f.id === neg.fighterId);
  const face = portraitImg(neg.fighterId, 88, 'care-reaction-portrait');
  const isTransfer = neg.attitude === 'transfer';
  const borderColor = isTransfer ? '#e74c3c' : '#f39c12';
  const attLabel = isTransfer ? '🚪 移籍志願' : '💰 昇給要求';

  // セリフ生成
  const dialogueRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId, 1));
  const openPhase = isTransfer ? 'transfer_open' : 'raise_open';
  const dialogue = Engine.contract.selectDialogue(dialogueRng, neg, openPhase, neg.context);

  // 選択肢の構築
  let choices;
  if (neg.attitude === 'raise') {
    choices = [
      { label: '昇給を受ける', hint: `信頼↑↑ 給与+${neg.raiseAmount}万/週`, idx: 0 },
      { label: '交渉する', hint: `成功時 給与+${neg.counterOffer}万/週`, idx: 1 },
      { label: '拒否する', hint: '信頼↓↓', idx: 2 },
    ];
  } else {
    choices = [
      { label: '引き留める', hint: `${neg.retentionBonus}万 支出`, idx: 0,
        disabled: (state.funds || 0) < neg.retentionBonus },
      { label: '理由を聞く', hint: '', idx: 1 },
      { label: '送り出す', hint: '退団', idx: 2 },
    ];
  }

  let html = `
    <div class="care-title" style="border-bottom:1px solid ${borderColor};padding-bottom:10px;margin-bottom:12px">
      📋 契約交渉 (${idx + 1}/${total})　<span style="font-size:12px;padding:2px 8px;border-radius:10px;background:${borderColor}22;color:${borderColor}">${attLabel}</span>
    </div>
    <div class="care-reaction" style="border-color:${borderColor}">
      ${face}
      <div class="care-reaction-bubble" style="border-color:${borderColor}">
        <strong style="font-size:12px;color:var(--text-dim)">${neg.fighterName}</strong><br>
        「${dialogue}」
      </div>
    </div>`;

  // 金額情報
  if (neg.attitude === 'raise') {
    const currentSalary = fighter ? Engine.util.getSalary(fighter, state.titles) : 0;
    html += `<div style="font-size:12px;color:var(--text-dim);margin:8px 0;padding:8px;background:rgba(243,156,18,0.08);border-radius:6px">
      現在の週給: ${currentSalary}万 → 要求: ${currentSalary + neg.raiseAmount}万 (+${neg.raiseAmount}万/週)
    </div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-dim);margin:8px 0;padding:8px;background:rgba(231,76,60,0.08);border-radius:6px">
      引き留めボーナス: ${neg.retentionBonus}万（一時金）
    </div>`;
  }

  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">';
  choices.forEach(c => {
    const disabled = c.disabled ? 'disabled style="opacity:0.4;cursor:default"' : '';
    const hintHtml = c.hint ? `<span style="font-size:11px;color:var(--text-dim);margin-left:8px">${c.hint}</span>` : '';
    html += `<button class="btn" data-choice="${c.idx}" ${disabled}
      style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
      <span>${c.label}</span>${hintHtml}
    </button>`;
  });
  html += '</div>';

  box.innerHTML = html;
  box.querySelectorAll('.btn[data-choice]').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.disabled) return;
      overlay.classList.remove('active');
      Audio.play('click');
      if (onChoice) onChoice(parseInt(this.dataset.choice));
    });
  });
  overlay.classList.add('active');
}

// リアクション表示 — 選択後のセリフを見せてから次へ
function showContractReactionModal(neg, reactionText, onDone) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onDone) onDone(); return; }
  if (!reactionText) { if (onDone) onDone(); return; }

  const face = portraitImg(neg.fighterId, 72, 'care-reaction-portrait');
  box.innerHTML = `
    <div class="care-reaction" style="border-color:rgba(232,67,147,0.3)">
      ${face}
      <div class="care-reaction-bubble">
        <strong style="font-size:12px;color:var(--text-dim)">${neg.fighterName}</strong><br>
        「${reactionText}」
      </div>
    </div>
    <button class="btn" id="contractReactionOk" style="width:100%;margin-top:14px;padding:10px;font-size:13px">次へ</button>`;
  document.getElementById('contractReactionOk').addEventListener('click', () => {
    overlay.classList.remove('active');
    Audio.play('click');
    if (onDone) onDone();
  });
  overlay.classList.add('active');
}

// 理由を聞く → サブ選択（引き留め or 送り出す）
function showContractListenModal(neg, listenText, state, onSubChoice) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onSubChoice) onSubChoice('release'); return; }

  const face = portraitImg(neg.fighterId, 88, 'care-reaction-portrait');
  const canAfford = (state.funds || 0) >= neg.retentionBonus;

  box.innerHTML = `
    <div class="care-title" style="border-bottom:1px solid #e74c3c;padding-bottom:10px;margin-bottom:12px">
      📋 ${neg.fighterName}の話を聞く
    </div>
    <div class="care-reaction" style="border-color:#e74c3c">
      ${face}
      <div class="care-reaction-bubble" style="border-color:#e74c3c">
        <strong style="font-size:12px;color:var(--text-dim)">${neg.fighterName}</strong><br>
        「${listenText}」
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
      <button class="btn" data-sub="retain" ${canAfford ? '' : 'disabled style="opacity:0.4;cursor:default"'}
        style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
        <span>引き留める</span><span style="font-size:11px;color:var(--text-dim)">${neg.retentionBonus}万 支出</span>
      </button>
      <button class="btn" data-sub="release"
        style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600">
        送り出す
      </button>
    </div>`;

  box.querySelectorAll('.btn[data-sub]').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.disabled) return;
      overlay.classList.remove('active');
      Audio.play('click');
      if (onSubChoice) onSubChoice(this.dataset.sub);
    });
  });
  overlay.classList.add('active');
}

// v2.0 §12.3: 突発退団画面 — 選択肢なし、[……わかった]ボタンのみ
function showContractSuddenDepartureModal(neg, state, onDone) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onDone) onDone(); return; }

  const face = portraitImg(neg.fighterId, 88, 'care-reaction-portrait');
  const dialogueRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xC0E7, neg.fighterId, 1));
  const dialogue = Engine.contract.selectDialogue(dialogueRng, neg, 'sudden_departure', neg.context);

  box.innerHTML = `
    <div class="care-title" style="border-bottom:1px solid #8e44ad;padding-bottom:10px;margin-bottom:12px">
      ⚡ 突発退団
    </div>
    <div class="care-reaction" style="border-color:#8e44ad">
      ${face}
      <div class="care-reaction-bubble" style="border-color:#8e44ad">
        <strong style="font-size:12px;color:var(--text-dim)">${neg.fighterName}</strong><br>
        「${dialogue}」
      </div>
    </div>
    <div style="font-size:12px;color:#8e44ad;margin:12px 0;padding:10px;background:rgba(142,68,173,0.08);border-radius:6px;text-align:center">
      交渉の余地なし — ${neg.fighterName}は退団を決意しています
    </div>
    <button class="btn" id="contractSuddenOk" style="width:100%;padding:12px;font-size:14px;font-weight:600;color:#8e44ad;border-color:#8e44ad">
      ……わかった
    </button>`;

  document.getElementById('contractSuddenOk').addEventListener('click', () => {
    overlay.classList.remove('active');
    Audio.play('click');
    if (onDone) onDone();
  });
  overlay.classList.add('active');
}

// 画面3: 結果サマリー
function showContractResultModal(results, onDone) {
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) { if (onDone) onDone(); return; }

  const stayed = results.filter(r => r.type === 'stay');
  const departed = results.filter(r => r.type === 'depart');
  const raised = results.filter(r => r.salaryDelta > 0);

  let html = `<div class="care-title" style="border-bottom:1px solid rgba(232,67,147,0.3);padding-bottom:10px;margin-bottom:12px">📋 契約更新 完了</div>`;
  html += `<div style="font-size:13px;margin-bottom:14px;line-height:1.8">
    残留: <strong style="color:#2ecc71">${stayed.length}名</strong>`;
  if (raised.length > 0) html += ` (昇給: ${raised.length}名)`;
  html += `<br>退団: <strong style="color:#e74c3c">${departed.length}名</strong></div>`;

  if (departed.length > 0) {
    html += '<div style="padding:10px;background:rgba(231,76,60,0.06);border-radius:8px;margin-bottom:14px">';
    departed.forEach(r => {
      let dest = '';
      if (r.departureInfo) {
        if (r.departureInfo.type === 'retire') dest = '→ 引退';
        else if (r.departureInfo.type === 'rival') dest = `→ ${r.departureInfo.orgName || 'ライバル団体'}`;
        else dest = '→ フリーエージェント';
      }
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
        ${portraitImg(r.fighterId, 32)}
        <span style="font-size:13px">${r.fighterName}</span>
        <span style="font-size:11px;color:var(--text-dim);margin-left:auto">${dest}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (raised.length > 0) {
    html += '<div style="padding:10px;background:rgba(243,156,18,0.06);border-radius:8px;margin-bottom:14px">';
    raised.forEach(r => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
        ${portraitImg(r.fighterId, 32)}
        <span style="font-size:13px">${r.fighterName}</span>
        <span style="font-size:11px;color:#f39c12;margin-left:auto">+${r.salaryDelta}万/週</span>
      </div>`;
    });
    html += '</div>';
  }

  html += `<button class="btn btn-gold" id="contractResultOk" style="width:100%;padding:12px;font-size:14px;font-weight:700">シーズン開幕へ</button>`;

  box.innerHTML = html;
  document.getElementById('contractResultOk').addEventListener('click', () => {
    overlay.classList.remove('active');
    Audio.play('click');
    if (onDone) onDone();
  });
  overlay.classList.add('active');
}
