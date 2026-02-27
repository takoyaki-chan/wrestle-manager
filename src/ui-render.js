// v1.9: Roster sort state
let _rosterSortKey = 'ovr';
function setRosterSort(key) { _rosterSortKey = key; renderRoster(); }

function refreshTopBar() {
  // Audio mute button sync
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) muteBtn.textContent = Audio.muted ? '🔇' : '🔊';
  const bgmMuteBtn = document.getElementById('bgmMuteBtn');
  if (bgmMuteBtn) bgmMuteBtn.textContent = Audio.bgmMuted ? '🎵❌' : '🎵';
  // Hide nav during draft
  const navBar = document.querySelector('.nav-bar');
  if (navBar) navBar.style.display = (G.weekPhase === 'draft') ? 'none' : '';
  document.getElementById('dispSeason').textContent = `${G.season}年目`;
  if (G.offSeason) {
    document.getElementById('dispWeek').textContent = `OFF`;
    document.getElementById('dispQuarter').textContent = `${G.offWeek || 0}/4`;
  } else {
    document.getElementById('dispWeek').textContent = G.week;
    document.getElementById('dispQuarter').textContent = QUARTER_LABELS[getQuarter(G.week)] || '🌸 春';
  }
  const fundsEl = document.getElementById('dispFunds');
  fundsEl.textContent = `${G.funds.toLocaleString()}万`;
  fundsEl.className = `info-val ${G.funds >= 0 ? 'positive' : 'negative'}`;
  document.getElementById('dispPop').textContent = Engine.util.dispOrgPop(G.orgPop);
  // v1.5s25b: 補助金カウントダウン
  const subsidyEl = document.getElementById('dispSubsidy');
  if (subsidyEl) {
    const popInt = Engine.util.dispOrgPop(G.orgPop);
    if (popInt < 40) { subsidyEl.textContent = `補助金あと${40 - popInt}pt`; subsidyEl.style.display = ''; }
    else { subsidyEl.style.display = 'none'; }
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
  champEl.innerHTML = champ ? `<span style="display:inline-flex;align-items:center;gap:12px">${portraitImg(champ.id, 80)}<span style="font-size:16px">🏆 ${fLink(champ, {source:'roster', bold:false, size:'16px'})} (${G.titles.world.defenses}防衛)</span></span>` : '<span style="color:var(--text-dim)">🏆 空位</span>';
}

function renderWeekScreen() {
  const el = document.getElementById('weekContent');
  let html = '';

  // ── DRAFT PHASE ──
  if (G.weekPhase === 'draft') {
    document.getElementById('weekTitle').textContent = '📋 初期ドラフト — チームを編成せよ';
    const fixed = Engine.draft.getFixedInfo();
    const candidates = Engine.draft.getCandidateInfo();
    const picks = G._draftPicks || [];
    const focusId = G._draftFocus || null;

    // ── Helpers ──
    const STYLE_META = {
      Grappler:   {color:'#bb8fce',icon:'GRP',desc:'投げ技と関節技を軸にした正統派。パワーとテクニックに優れる'},
      Striker:    {color:'#e74c3c',icon:'STK',desc:'打撃主体のファイター。パワーとスピードで圧倒する'},
      Submission: {color:'#e67e22',icon:'SUB',desc:'関節技のスペシャリスト。テクニックで相手を仕留める'},
      Speed:      {color:'#2ecc71',icon:'SPD',desc:'スピードで翻弄する。俊敏な動きで試合をコントロール'},
      Allround:   {color:'#f1c40f',icon:'ALL',desc:'万能型。突出した弱点がなく安定した試合運びが可能'},
      Brawler:    {color:'#e88a82',icon:'BRW',desc:'喧嘩殺法。パワーとスタミナでゴリ押す荒くれ者'}
    };
    const ROLE_META = {
      Babyface: {color:'#8bc4f0',label:'ベビーフェイス',icon:'BF'},
      Heel:     {color:'#f08b9e',label:'ヒール',icon:'HL'},
      Neutral:  {color:'#b0b8c4',label:'ニュートラル',icon:'NT'}
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

    function makeStatBars(c, compact) {
      const stats = [
        {key:'pw',label:'パワー',   short:'PW',color:'#e74c3c'},
        {key:'sp',label:'スピード', short:'SP',color:'#3498db'},
        {key:'te',label:'テクニック',short:'TE',color:'#2ecc71'},
        {key:'st',label:'スタミナ', short:'ST',color:'#f39c12'},
        {key:'mn',label:'マインド', short:'MN',color:'#9b59b6'}
      ];
      const h = compact ? 4 : 6;
      return stats.map(s => {
        const val = c[s.key];
        const w = Math.min(100, val);
        const valColor = val >= 75 ? s.color : val >= 50 ? 'var(--text-sub)' : 'var(--text-dim)';
        return `<div style="display:flex;align-items:center;gap:${compact?4:6}px">
          <span style="font-size:${compact?9:10}px;color:var(--text-dim);width:${compact?16:52}px;text-align:right">${compact ? s.short : s.label}</span>
          <div style="flex:1;height:${h}px;background:rgba(255,255,255,0.06);border-radius:${h/2}px;overflow:hidden">
            <div style="width:${w}%;height:100%;background:${s.color};border-radius:${h/2}px;transition:width 0.3s"></div>
          </div>
          <span style="font-size:${compact?10:11}px;color:${valColor};width:24px;text-align:right;font-weight:${val>=75?700:400}">${val}</span>
        </div>`;
      }).join('');
    }

    function analyzeStrengths(c) {
      const stats = {pw:c.pw,sp:c.sp,te:c.te,st:c.st,mn:c.mn};
      const labels = {pw:'パワー',sp:'スピード',te:'テクニック',st:'スタミナ',mn:'マインド'};
      const sorted = Object.entries(stats).sort((a,b) => b[1] - a[1]);
      const best = sorted.slice(0,2).filter(([,v]) => v >= 50);
      const worst = sorted.slice(-1).filter(([,v]) => v < 60);
      let strengths = best.map(([k,v]) => `<span style="color:#2ecc71">${labels[k]}${v}</span>`);
      let weaknesses = worst.map(([k,v]) => `<span style="color:#e74c3c">${labels[k]}${v}</span>`);
      return {strengths, weaknesses};
    }

    // ── Header ──
    html += `<div style="margin-bottom:20px;padding:16px;background:linear-gradient(135deg,rgba(212,168,67,0.12),rgba(0,0,0,0));border:1px solid rgba(212,168,67,0.3);border-radius:10px">
      <p style="color:var(--gold);font-weight:700;margin-bottom:6px;font-size:15px">🏢 ${G.orgName || 'プレイヤー団体'} — 初期ドラフト</p>
      <p style="color:var(--text-sub);font-size:13px;line-height:1.7">
        あなたの団体には2名の所属選手がいます。候補6名の中から<strong style="color:var(--text)">3名</strong>を選んで、5名の所属選手でシーズンを始めましょう。<br>
        <span style="font-size:12px;color:var(--text-dim)">能力値は入団時の推定値です。将来性の評価はコーチ不在のため大きくブレる場合があります。</span>
      </p>
    </div>`;

    // ── Fixed Members ──
    html += `<h4 style="color:var(--gold);margin-bottom:10px;font-size:13px;display:flex;align-items:center;gap:6px">
      <span style="background:var(--gold);color:var(--bg);padding:1px 6px;border-radius:3px;font-size:12px;font-weight:700">確定</span>
      固定メンバー（2名）
    </h4>`;
    for (const c of fixed) {
      const sm = STYLE_META[c.style] || STYLE_META.Allround;
      const rm = ROLE_META[c.role] || ROLE_META.Neutral;
      const {strengths, weaknesses} = analyzeStrengths(c);
      const pUrl = getPortraitUrl(c.id);
      const profileText = CHAR_PROFILES[c.id] || '';
      html += `<div style="margin-bottom:10px;padding:14px;background:var(--bg-card);border-radius:8px;border:1px solid rgba(212,168,67,0.2)">
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:10px">
          ${pUrl
            ? `<img src="${pUrl}" style="width:80px;height:80px;border-radius:10px;object-fit:cover;border:2px solid ${sm.color}66;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.3)" alt="${c.name}">`
            : makeAvatar(c, 80)}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <span style="font-weight:700;font-size:15px">${c.name}</span>
              <span style="font-size:22px;font-weight:900;color:var(--gold)">${c.ovr}</span>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
              <span class="badge badge-${c.style}">${c.style}</span>
              <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}">${rm.label}</span>
              <span style="font-size:12px;color:var(--text-dim);padding:2px 6px">${c.h}cm</span>
              <span style="font-size:12px;color:${c.coachEval.color};padding:2px 6px">${c.coachEval.emoji} ${c.coachEval.text}</span>
            </div>
            ${profileText ? `<div style="font-size:12px;color:var(--text-sub);line-height:1.6">📝 ${profileText}</div>` : ''}
          </div>
        </div>
        <div style="display:grid;gap:4px;margin-bottom:8px">${makeStatBars(c, false)}</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.5">
          ${strengths.length ? '💪 強み: ' + strengths.join(', ') : ''}
          ${weaknesses.length ? (strengths.length ? ' ｜ ' : '') + '⚠️ 課題: ' + weaknesses.join(', ') : ''}
        </div>
      </div>`;
    }

    // ── Candidate Selection ──
    html += `<h4 style="color:#3498db;margin:20px 0 10px;font-size:13px;display:flex;align-items:center;gap:6px">
      <span style="background:#3498db;color:var(--bg);padding:1px 6px;border-radius:3px;font-size:12px;font-weight:700">選択</span>
      候補選手（${picks.length}/${DRAFT_CONFIG.pickCount}名選択済）
    </h4>`;

    for (const c of candidates) {
      const picked = picks.includes(c.id);
      const full = picks.length >= DRAFT_CONFIG.pickCount && !picked;
      const focused = focusId === c.id;
      const sm = STYLE_META[c.style] || STYLE_META.Allround;
      const rm = ROLE_META[c.role] || ROLE_META.Neutral;
      const {strengths, weaknesses} = analyzeStrengths(c);

      const borderCol = picked ? '#2ecc71' : focused ? '#3498db' : 'var(--border)';
      const bgCol = picked ? 'rgba(46,204,113,0.06)' : focused ? 'rgba(52,152,219,0.04)' : 'var(--bg-card)';

      html += `<div style="margin-bottom:8px;border-radius:8px;border:1px solid ${borderCol};background:${bgCol};overflow:hidden;opacity:${full?0.45:1};transition:all 0.2s">`;

      if (!focused) {
        // ── Collapsed summary row ──
        html += `<div style="display:flex;align-items:center;gap:14px;padding:14px;cursor:${full?'not-allowed':'pointer'}"
          onclick="${full ? '' : `App.focusDraftCandidate(${c.id})`}">
          ${portraitImg(c.id, 80)}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-weight:700;font-size:17px">${c.name}</span>
              ${picked ? '<span style="color:#2ecc71;font-size:12px;font-weight:700">✓ 選択中</span>' : ''}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
              <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${rm.label}</span>
            </div>
          </div>
          <div style="text-align:center;min-width:60px">
            <div style="font-size:24px;font-weight:900;color:${picked?'#2ecc71':'var(--text)'}">${c.ovr}</div>
            <div style="font-size:11px;color:var(--text-dim)">OVR</div>
            <div style="font-size:11px;color:${c.coachEval.color};margin-top:2px">${c.coachEval.emoji} ${c.coachEval.text}</div>
          </div>
          <div style="font-size:18px;color:var(--text-dim)">▼</div>
        </div>`;
      } else {
        // ── Expanded detail panel (replaces summary row) ──
        const pUrl = getPortraitUrl(c.id);
        const profileText = CHAR_PROFILES[c.id] || '';
        html += `<div style="padding:14px;cursor:pointer" onclick="App.focusDraftCandidate(${c.id})">
          <!-- 2-column layout: left=profile, right=stats -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px">
            <!-- Left: Portrait + Profile -->
            <div>
              <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px">
                ${pUrl
                  ? `<img src="${pUrl}" style="width:100px;height:100px;border-radius:10px;object-fit:cover;border:2px solid ${sm.color}66;flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,0.4)" alt="${c.name}">`
                  : `<div style="width:100px;height:100px;border-radius:10px;background:linear-gradient(135deg,${sm.color}33,${sm.color}11);border:2px solid ${sm.color}66;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <span style="font-size:40px;font-weight:900;color:${sm.color}">${c.name.charAt(0)}</span>
                    </div>`}
                <div style="min-width:0">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
                    <span style="font-weight:900;font-size:18px">${c.name}</span>
                    ${picked ? '<span style="color:#2ecc71;font-size:12px;font-weight:700">✓ 選択中</span>' : ''}
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                    <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
                    <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${rm.label}</span>
                  </div>
                  <div style="font-size:13px;color:var(--text-dim);line-height:1.6">
                    <div>📏 ${c.h}cm ｜ 📅 ${c.age || 16}歳</div>
                    <div style="color:${c.coachEval.color}">${c.coachEval.emoji} 将来性: ${c.coachEval.text}</div>
                  </div>
                  <div style="margin-top:6px">
                    <span style="font-size:26px;font-weight:900;color:var(--text)">${c.ovr}</span>
                    <span style="font-size:12px;color:var(--text-dim);margin-left:2px">OVR</span>
                  </div>
                </div>
              </div>
              ${profileText ? `<div style="font-size:13px;color:var(--text-sub);line-height:1.7;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${sm.color}44">
                📝 ${profileText}
              </div>` : `<div style="font-size:13px;color:var(--text-sub);line-height:1.5;padding:8px 0">
                ${sm.desc}
              </div>`}
            </div>
            <!-- Right: Stats + Analysis -->
            <div>
              <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;font-weight:700">ABILITY</div>
              <div style="display:grid;gap:5px;margin-bottom:14px;max-width:240px">${makeStatBars(c, false)}</div>
              <div style="font-size:13px;line-height:1.7">
                ${strengths.length ? '💪 <span style="color:var(--text-sub)">強み:</span> ' + strengths.join(', ') : ''}
                ${weaknesses.length ? '<br>⚠️ <span style="color:var(--text-sub)">課題:</span> ' + weaknesses.join(', ') : ''}
              </div>
            </div>
          </div>
          <!-- v1.0: Character speech bubble -->
          <div style="margin-bottom:12px;padding:12px 16px;background:rgba(52,152,219,0.06);border:1px solid rgba(52,152,219,0.2);border-radius:10px;position:relative">
            <div style="position:absolute;top:-6px;left:20px;width:12px;height:12px;background:rgba(52,152,219,0.06);border-top:1px solid rgba(52,152,219,0.2);border-left:1px solid rgba(52,152,219,0.2);transform:rotate(45deg)"></div>
            <div style="font-size:14px;color:var(--text-main);line-height:1.6;font-style:italic">
              「${getDraftInterestLine(c)}」
            </div>
          </div>
          <!-- Action buttons -->
          <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
            <button class="btn ${picked ? '' : 'btn-gold'}" style="flex:1;padding:10px;font-size:13px;font-weight:700"
              onclick="App.toggleDraftPick(${c.id})">
              ${picked ? '✕ 選択を取り消す' : '✓ この選手を獲得する'}
            </button>
            <button class="btn" style="padding:10px 16px;font-size:13px" onclick="App.focusDraftCandidate(${c.id})">▲ 閉じる</button>
          </div>
        </div>`;
      }

      html += `</div>`;
    }

    // ── Team Preview ──
    const PREVIEW_RATIO = 0.60;
    const allIds = [...DRAFT_CONFIG.fixed, ...picks];
    const allChars = allIds.map(id => {
      const t = ALL_CHARS.find(c => c.id === id);
      const entryVals = {pw:Math.round(t.pw*PREVIEW_RATIO),sp:Math.round(t.sp*PREVIEW_RATIO),te:Math.round(t.te*PREVIEW_RATIO),st:Math.round(t.st*PREVIEW_RATIO),mn:t.mn};
      const ovr = Math.round((entryVals.pw+entryVals.sp+entryVals.te+entryVals.st+entryVals.mn)/5);
      const sm = STYLE_META[t.style] || STYLE_META.Allround;
      return { name: t.name, ovr, style: t.style, icon: sm.icon, color: sm.color };
    });
    const avgOvr = allChars.length ? Math.round(allChars.reduce((s,c) => s + c.ovr, 0) / allChars.length) : 0;

    html += `<div style="margin-top:20px;padding:14px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border)">
      <h4 style="margin-bottom:10px;font-size:13px">📊 チームプレビュー</h4>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
        ${allChars.map(c =>
          `<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.04);border:1px solid ${c.color}33;border-radius:5px">
            <span style="font-size:12px">${c.icon}</span>
            <span style="font-size:12px">${c.name}</span>
            <span style="font-size:12px;font-weight:700;color:${c.color}">${c.ovr}</span>
          </div>`
        ).join('')}
        ${picks.length < DRAFT_CONFIG.pickCount ?
          Array(DRAFT_CONFIG.pickCount - picks.length).fill(0).map(() =>
            `<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.02);border:1px dashed var(--border);border-radius:5px">
              <span style="font-size:12px;color:var(--text-dim)">？ 未選択</span>
            </div>`
          ).join('') : ''
        }
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-sub)">平均OVR</span>
        <span style="font-size:20px;font-weight:900;color:var(--gold)">${avgOvr}</span>
      </div>
    </div>`;

    // ── Confirm Button ──
    const canConfirm = picks.length === DRAFT_CONFIG.pickCount;
    html += `<button class="btn ${canConfirm ? 'btn-gold' : ''}" style="width:100%;margin-top:16px;padding:16px;font-size:15px;font-weight:700;border-radius:8px;${canConfirm ? '' : 'opacity:0.35;cursor:not-allowed'}"
      ${canConfirm ? 'onclick="App.completeDraft()"' : 'disabled'}>
      ${canConfirm ? '✅ この5名でシーズン開始！' : `あと${DRAFT_CONFIG.pickCount - picks.length}名選んでください`}
    </button>`;

    el.innerHTML = html;
    return;
  }

  // ── OFFSEASON DISPLAY ──
  if (G.weekPhase === 'offseason') {
    const offW = G.offWeek || 0;
    const offLabels = ['🏁 シーズン終了', '📊 シーズンレポート', '🔍 スカウト活動', '🔄 移籍ウィンドウ', '🎬 新シーズン準備'];
    document.getElementById('weekTitle').textContent = offW === 0
      ? `${G.season}年目 オフシーズン突入`
      : `オフシーズン第${offW}週 — ${offLabels[offW] || ''}`;

    // Progress bar
    html += `<div style="margin-bottom:16px">
      <div style="display:flex;gap:4px;margin-bottom:8px">
        ${[1,2,3,4].map(i => `<div style="flex:1;height:6px;border-radius:3px;background:${i <= offW ? 'var(--gold)' : 'var(--bg-card)'};transition:background 0.3s"></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim)">
        <span>レポート</span><span>スカウト</span><span>移籍</span><span>開幕</span>
      </div>
    </div>`;

    // v0.95: Season Recap Card (show detailed stats from completed season)
    const st = G.seasonStats || {};
    const lastArchive = (G.seasonHistory || []).slice(-1)[0];
    if (offW <= 1 && (st.showCount > 0 || lastArchive)) {
      const src = lastArchive || st;
      const profit = (src.totalRevenue || 0) - (src.totalExpense || 0);
      const recapRank = lastArchive ? lastArchive.rank : (G.rankings ? Engine.ranking.getPlayerRank(G.rankings) : 0);
      const recapRankColor = recapRank===1?'var(--gold)':recapRank===2?'#e74c3c':recapRank===3?'#9b59b6':'#2ecc71';
      html += `<div style="background:linear-gradient(135deg,rgba(212,168,67,0.08),rgba(241,196,15,0.04));border:1px solid rgba(212,168,67,0.2);border-radius:8px;padding:16px;margin-bottom:16px">
        <h4 style="color:var(--gold);margin-bottom:12px;font-size:14px">📊 シーズン${lastArchive ? lastArchive.season : G.season} レポート</h4>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
          <div style="text-align:center;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px">
            <div style="font-size:20px;font-weight:900;color:${recapRankColor}">${recapRank || '-'}位</div>
            <div style="font-size:12px;color:var(--text-dim)">最終ランキング</div>
          </div>
          <div style="text-align:center;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px">
            <div style="font-size:20px;font-weight:900;color:#2ecc71">${src.showCount || 0}</div>
            <div style="font-size:12px;color:var(--text-dim)">興行開催数</div>
          </div>
          <div style="text-align:center;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px">
            <div style="font-size:20px;font-weight:900;color:#3498db">${src.bestMQ || 0}</div>
            <div style="font-size:12px;color:var(--text-dim)">最高MQ</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
          <div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px">
            <span style="color:var(--text-dim)">収支:</span>
            <span style="color:${profit>=0?'#2ecc71':'#e74c3c'};font-weight:700">${profit>=0?'+':''}${profit.toLocaleString()}万</span>
            <span style="color:var(--text-dim);font-size:12px">(収${(src.totalRevenue||0).toLocaleString()} / 支${(src.totalExpense||0).toLocaleString()})</span>
          </div>
          <div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px">
            <span style="color:var(--text-dim)">ピーク資金:</span>
            <span style="color:var(--gold);font-weight:700">${(src.peakFunds||0).toLocaleString()}万</span>
          </div>
          ${src.bestMQMatch ? `<div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px;grid-column:span 2">
            <span style="color:var(--text-dim)">ベストマッチ:</span>
            <span style="color:var(--text-main)">${src.bestMQMatch}</span>
            <span style="color:#3498db;font-weight:700">MQ${src.bestMQ}</span>
          </div>` : ''}
          ${(src.eventsWon || src.eventsLost) ? `<div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px;grid-column:span 2">
            <span style="color:var(--text-dim)">団体抗争:</span>
            <span style="color:#2ecc71">${src.eventsWon||0}勝</span> / <span style="color:#e74c3c">${src.eventsLost||0}敗</span>
          </div>` : ''}
        </div>
      </div>`;
    }

    // Show recent events from game log related to current offseason
    const recentEvents = G.gameLog.filter(e => e.includes('オフシーズン') || e.includes('シーズン') || e.includes('引退') || e.includes('獲得') || e.includes('移籍') || e.includes('衰退') || e.includes('成長'));
    const offEvents = recentEvents.slice(-15);
    if (offEvents.length > 0) {
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px;max-height:300px;overflow-y:auto">';
      html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">📋 オフシーズンレポート</h4>';
      offEvents.forEach(ev => {
        const isHighlight = ev.includes('引退') || ev.includes('獲得') || ev.includes('移籍');
        html += `<div style="font-size:11px;padding:2px 0;color:${isHighlight ? 'var(--text-main)' : 'var(--text-sub)'}">${ev}</div>`;
      });
      html += '</div>';
    }

    // Rankings summary during offseason
    if (G.rankings && G.rankings.length > 0) {
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px">';
      html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">🏆 現在のランキング</h4>';
      G.rankings.forEach((r, i) => {
        const isPlayer = r.orgId === 'player';
        html += `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;${isPlayer ? 'color:var(--gold);font-weight:700' : 'color:var(--text-sub)'}">
          <span>${i+1}位 ${r.name}</span><span>${r.rating}pt</span>
        </div>`;
      });
      html += '</div>';
    }

    const nextLabels = ['シーズンレポートへ →', 'スカウト活動へ →', '移籍ウィンドウへ →', '新シーズン開幕 →'];
    const nextLabel = nextLabels[offW] || `オフシーズン第${offW + 1}週へ →`;
    const btnClass = offW >= 3 ? 'btn-gold' : 'btn-blue';
    html += `<div class="btn-row" style="margin-top:16px"><button class="btn ${btnClass}" onclick="advanceWeek()">${nextLabel}</button></div>`;

    el.innerHTML = html;
    return;
  }

  // ── REGULAR WEEK DISPLAY ──
  const isShow = isShowWeek(G.week);
  const special = isSpecialShow(G.week);
  const ppv = isPPV(G.week);
  let typeLabel = isShow ? (ppv ? '🏆 PPV' : special ? '⭐ 特別興行' : '🎤 興行週') : '📋 非興行週';
  document.getElementById('weekTitle').textContent = `第${G.week}週 — ${typeLabel}`;

  html = '';

  if (G.weekPhase === 'manage') {
    // ── v0.95: Dashboard Panel ──
    const qtr = QUARTER_LABELS[getQuarter(G.week)] || '🌸 春';
    const weekPct = Math.round((G.week / 48) * 100);
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
    if (G.pendingNegotiation) {
      const remainW = G.pendingNegotiation.resolveWeek - G.week;
      upcomingItems.push(`🤝 交渉中: ${G.pendingNegotiation.fighterName}（残${remainW}週）`);
    }

    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <!-- Season Progress -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;color:var(--text-dim)">${G.season}年目 ${qtr}</span>
          <span style="font-size:11px;color:var(--gold);font-weight:700">第${G.week}/48週</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${weekPct}%;background:linear-gradient(90deg,var(--gold),#f1c40f);border-radius:2px;transition:width 0.3s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim)">
          <span style="${G.week<=12?'color:var(--gold)':''}">🌸春</span>
          <span style="${G.week>12&&G.week<=24?'color:var(--gold)':''}">☀️夏</span>
          <span style="${G.week>24&&G.week<=36?'color:var(--gold)':''}">🍂秋</span>
          <span style="${G.week>36?'color:var(--gold)':''}">❄️冬</span>
        </div>
      </div>
      <!-- Mini Ranking + Finance -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;color:var(--text-dim)">ランキング <strong style="color:${pRank===1?'var(--gold)':pRank===2?'#e74c3c':pRank===3?'#9b59b6':'#2ecc71'};font-size:14px">#${pRank}</strong></span>
          <span style="font-size:11px;color:var(--text-dim)">資金 <strong style="color:${G.funds>=0?'#2ecc71':'#e74c3c'};font-size:13px">${G.funds.toLocaleString()}万</strong></span>
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
    const manageBuf = G.monthlyFinanceBuffer || [];
    if (manageBuf.length > 0) {
      let mIncome = 0, mExpense = 0;
      manageBuf.forEach(e => { mIncome += (e.finance?.income || 0); mExpense += (e.finance?.expense || 0); });
      const mNet = mIncome - mExpense;
      const netColor = mNet >= 0 ? '#2ecc71' : '#e74c3c';
      const weekInMonth = manageBuf.length + 1;
      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:6px 12px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);border-radius:5px;font-size:12px">
        <span style="color:var(--text-dim);flex-shrink:0">月${weekInMonth}週目:</span>
        <span style="color:${netColor};font-weight:700">${mNet >= 0 ? '+' : ''}${mNet}万</span>
        <span style="color:var(--text-dim);font-size:11px">収入${mIncome}万 / 支出${mExpense}万</span>
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
      html += `<div class="survival-panel ${sPhase ? sPhase.cssClass : 'phase-red'}${isCritical ? ' critical' : ''}">`;
      html += `<div class="survival-header">
        <span class="survival-title" style="color:${sPhase?.color || '#e74c3c'}">
          <span style="font-size:16px">⛽</span> 経営サバイバル
        </span>
        <span class="survival-phase-badge" style="background:${sPhase?.color || '#e74c3c'}22;color:${sPhase?.color || '#e74c3c'};border:1px solid ${sPhase?.color || '#e74c3c'}44">
          ${sPhase?.emoji || '🔴'} ${sPhase?.label || '赤字地獄'}
        </span>
      </div>`;

      // Fuel gauge
      html += '<div class="survival-body">';
      html += `<div class="survival-gauge-track">
        <div class="survival-gauge-fill ${gaugeColor}" style="width:${sFuel}%">
          <span class="survival-gauge-label">${G.funds.toLocaleString()}万</span>
        </div>
      </div>`;

      // Milestone markers
      html += '<div class="survival-gauge-markers">';
      sMilestones.forEach(m => {
        const cls = m.done ? 'cleared' : (m === sMilestones.find(x => !x.done) ? 'active' : '');
        html += `<span class="survival-gauge-marker ${cls}" title="${m.desc}">${m.done ? '✅' : '⬜'} ${m.label}</span>`;
      });
      html += '</div>';

      // Key stats
      html += '<div class="survival-stats">';
      // Weekly burn rate
      const netColor = sNet.weeklyNet >= 0 ? '#2ecc71' : '#e74c3c';
      const netSign = sNet.weeklyNet >= 0 ? '+' : '';
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${netColor}">${netSign}${sNet.weeklyNet}万</span>
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
        <span class="survival-stat-val" style="color:${rollingSum >= 0 ? '#2ecc71' : r4count > 0 ? '#f1c40f' : 'var(--text-dim)'}">${rollingSum >= 0 ? '+' : ''}${rollingSum}万</span>
        <span class="survival-stat-label">月次収支(4週)</span>
      </div>`;
      // Weekly expense
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:#e74c3c">-${sNet.totalExpense}万</span>
        <span class="survival-stat-label">週間支出</span>
      </div>`;
      // Weekly base income
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${sNet.totalBaseIncome > 0 ? '#2ecc71' : 'var(--text-dim)'}">${sNet.totalBaseIncome > 0 ? '+' : ''}${sNet.totalBaseIncome}万</span>
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
          💡 黒字転換達成！ この調子で${4 - streak}週間黒字を維持すればクリア！（現在の資金: ${G.funds.toLocaleString()}万${G.funds < 3000 ? ` / 目標3,000万` : ''}）
        </div>`;
      }

      html += '</div></div>'; // .survival-body, .survival-panel
    } else if (G.survivalCleared && G.survivalClearSeason) {
      // Compact "CLEARED" badge
      const fresh = G.survivalClearSeason === G.season && Math.abs((G.survivalClearWeek || 0) - G.week) <= 4;
      html += `<div class="survival-cleared-badge${fresh ? ' fresh' : ''}">🏆 経営サバイバル CLEARED！ <span style="font-weight:400;font-size:12px;color:var(--text-dim)">（${G.survivalClearSeason}年目 第${G.survivalClearWeek}週で達成）</span></div>`;
    }

    // ── v0.96: MISSION PANEL ──
    if (G.missionEnabled) {
      const visMissions = Mission.getVisible(G);
      const prog = Mission.progress(G);
      // Group by phase
      const byPhase = {};
      visMissions.forEach(m => { if (!byPhase[m.phase]) byPhase[m.phase] = []; byPhase[m.phase].push(m); });
      // Sort: incomplete first within each phase
      Object.values(byPhase).forEach(arr => arr.sort((a,b) => (a.done?1:0) - (b.done?1:0)));

      html += '<div class="mission-panel">';
      html += `<div class="mission-panel-header">
        <span class="mission-panel-title"><span class="mission-icon">🧭</span> ミッション <span style="font-size:12px;font-weight:400;color:var(--text-dim);font-family:'Noto Sans JP',sans-serif">${prog.done}/${prog.total}</span></span>
        <span class="mission-panel-toggle" onclick="App.toggleMission(false)">✕ 非表示にする</span>
      </div>`;
      // Progress bar
      html += `<div class="mission-progress">
        <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${prog.pct}%"></div></div>
        <span class="mission-progress-label">${prog.pct}%</span>
      </div>`;
      html += '<div class="mission-list">';
      for (const [phase, missions] of Object.entries(byPhase)) {
        html += `<div class="mission-category">${PHASE_LABELS[phase] || ''}</div>`;
        for (const m of missions) {
          const isNew = m.done && !m.wasCompleted;
          const pendingClear = isNew || (G.missionNewClears || []).includes(m.id);
          const itemCls = pendingClear ? 'mission-item new-clear' : 'mission-item';
          const clickHandler = pendingClear ? `onclick="dismissMissionClear('${m.id}',this)"` : '';
          html += `<div class="${itemCls}" ${clickHandler}>
            <div class="mission-check ${m.done ? 'done' : 'pending'}">${m.done ? '✓' : ''}</div>
            <div class="mission-body">
              <div class="mission-name ${m.done ? 'done' : ''}">${m.icon} ${m.name}</div>
              ${!m.done ? `<div class="mission-desc">${m.desc}</div>` : ''}
            </div>
            ${!m.done && m.screen ? `<span class="mission-goto" onclick="event.stopPropagation();gotoScreen('${m.screen}')">→ 開く</span>` : ''}
            ${pendingClear ? '<span class="mission-clear-hint">tap!</span>' : ''}
          </div>`;
        }
      }
      html += '</div></div>';
    } else {
      // Show small re-enable button
      html += `<div style="margin-bottom:10px;text-align:right"><span class="mission-enable-btn" onclick="App.toggleMission(true)">🧭 ミッション表示</span></div>`;
    }

    const heat = getHeatLevel();
    const injuredCount = G.roster.filter(c => c.injury).length;
    html += `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:var(--text-sub)">
      <span>Heat: <span style="color:${heat.color};font-weight:700">${heat.emoji} ${heat.label}（×${heat.mult}）</span></span>
      ${injuredCount > 0 ? `<span style="color:#e17055">🏥 負傷者: ${injuredCount}名</span>` : ''}
      ${G.coaches.length > 0 ? `<span style="color:#2ecc71">🎓 コーチ: ${G.coaches.length}名</span>` : ''}
      ${getFacilityMaintenance() > 0 ? `<span style="color:var(--gold)">🏢 施設: -${getFacilityMaintenance()}万/週</span>` : ''}
    </div>`;
    html += `<p style="margin-bottom:12px;color:var(--text-sub)">選手の週間スケジュールを確認し、${isShow ? '興行準備に進んでください' : '週を進めてください'}。</p>`;

    // v1.0: Primary action buttons — top-left, large, prominent
    html += '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">';
    if (isShow) {
      html += '<button class="btn btn-gold" onclick="startShowPrep()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">🎤 興行準備へ →</button>';
    } else {
      html += '<button class="btn btn-gold" onclick="doProcessWeek()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">⏩ 週を処理</button>';
      html += '<button class="btn" onclick="App.autoManage()" style="font-size:14px;padding:10px 20px;background:rgba(46,204,113,0.12);color:#2ecc71;border:1px solid rgba(46,204,113,0.3);font-weight:600" title="体調60未満の選手を自動で休養させてから週を進めます">🤖 おまかせ</button>';
    }
    // v2.0: ケアアクションボタン
    html += `<button class="btn" onclick="App.openCareModal()" style="font-size:14px;padding:10px 20px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-weight:600" title="選手・団体への資金投入アクション">💝 ケア</button>`;
    html += '</div>';

    // Roster schedule overview
    html += '<table class="data-table"><tr><th>名前</th><th>総合</th><th>体調</th><th>状態</th><th>スケジュール</th><th>今週の行動</th></tr>';
    G.roster.forEach(c => {
      const condPct = c.condition;
      const condCls = condPct > 66 ? 'high' : condPct > 33 ? 'mid' : 'low';
      const actionLabels = {practice:'練習',promo:'プロモ',rest:'休養',balance:'バランス','療養':'療養',intensive:'⚡強化'};
      const statusHtml = c.injury
        ? `<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(214,48,49,0.15);color:${c.injury.color};border:1px solid ${c.injury.color}40">${c.injury.type} ${c.injury.weeksLeft}週</span>`
        : '<span style="font-size:12px;color:#2ecc71">健康</span>';
      const schedDisabled = c.injury ? 'disabled' : '';
      const wkChampBadge = G.titles.world.championId === c.id ? ' <span style="color:var(--gold);font-size:12px">👑</span>' : '';
      // v1.0: Compute predicted action for initial display
      let previewAction = c._weekAction;
      if (!previewAction) {
        if (c.injury) previewAction = '療養';
        else if (c.intensive) previewAction = 'intensive';
        else {
          previewAction = c.schedule || 'balance';
          if (previewAction === 'balance') previewAction = isShow ? 'promo' : 'practice';
          if (c.condition <= 30) previewAction = 'rest';
        }
      }
      const previewLabel = actionLabels[previewAction] || previewAction;
      html += `<tr${c.injury ? ' style="opacity:0.65"' : ''}>
        <td><strong>${c.name}</strong>${wkChampBadge}</td>
        <td class="num">${ov(c)}</td>
        <td><div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div> ${condPct}</td>
        <td>${statusHtml}</td>
        <td>
          <select onchange="updateSchedulePreview(${c.id},this.value)" style="font-size:13px;padding:4px" ${schedDisabled}>
            <option value="balance" ${c.schedule==='balance'?'selected':''}>バランス</option>
            <option value="practice" ${c.schedule==='practice'?'selected':''}>練習優先</option>
            <option value="promo" ${c.schedule==='promo'?'selected':''}>プロモ優先</option>
            <option value="rest" ${c.schedule==='rest'?'selected':''}>休養重視</option>
          </select>
        </td>
        <td id="action-${c.id}"><span class="sched-tag ${previewAction}">${previewLabel}</span></td>
      </tr>`;
    });
    html += '</table>';
  }
  else if (G.weekPhase === 'settled') {
    const heat = getHeatLevel();
    const monthBuf = G.monthlyFinanceBuffer || [];
    const weeksInMonth = monthBuf.length;
    html += `<h3 style="color:var(--gold);margin-bottom:12px">📊 月次収支レポート</h3>`;
    html += `<div style="margin-bottom:8px;font-size:12px">Heat: <span style="color:${heat.color};font-weight:700">${heat.emoji} ${heat.label}（集客×${heat.mult}）</span></div>`;
    const settleChamp = getWorldChampion();
    if (settleChamp) html += `<div style="margin-bottom:8px;font-size:12px">🏆 団体王座: ${fLink(settleChamp, {source:'roster'})}（${G.titles.world.defenses}防衛）</div>`;

    // v1.0: Aggregate monthly finance from buffer
    const monthlyDetails = {};
    let monthIncome = 0, monthExpense = 0;
    monthBuf.forEach(entry => {
      if (!entry.finance || !entry.finance.details) return;
      entry.finance.details.forEach(d => {
        const key = d.label.replace(/（.*?）/g, '').replace(/\d+人/g, '').trim();
        if (!monthlyDetails[key]) monthlyDetails[key] = { label: d.label, val: 0, type: d.type, count: 0 };
        monthlyDetails[key].val += d.val;
        monthlyDetails[key].count++;
        // Use the latest label (may contain dynamic info)
        monthlyDetails[key].label = d.label;
      });
      monthIncome += (entry.finance.income || 0);
      monthExpense += (entry.finance.expense || 0);
    });
    const monthNet = monthIncome - monthExpense;

    // Show week range
    const weekNums = monthBuf.map(e => e.week).filter(Boolean);
    if (weekNums.length > 1) {
      html += `<div style="margin-bottom:8px;font-size:11px;color:var(--text-dim)">第${Math.min(...weekNums)}週〜第${Math.max(...weekNums)}週</div>`;
    }

    // Show aggregated details
    Object.values(monthlyDetails).forEach(d => {
      html += `<div class="finance-row"><span class="f-label">${d.label}${d.count > 1 ? ` ×${d.count}週` : ''}</span><span class="f-val ${d.type}">${d.val >= 0 ? '+' : ''}${d.val}万</span></div>`;
    });
    html += `<div class="finance-row finance-total"><span>月間収支</span><span class="f-val ${monthNet >= 0 ? 'income' : 'expense'}">${monthNet >= 0 ? '+' : ''}${monthNet}万</span></div>`;
    html += `<div style="margin-top:8px;font-size:13px">残高: <strong style="color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${G.funds.toLocaleString()}万</strong></div>`;

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
    } else if (G.survivalCleared) {
      html += `<div style="margin-top:6px;font-size:12px;color:#2ecc71">🏆 経営安定化達成済み</div>`;
    }

    if (G.funds <= -1000) {
      html += '<div style="margin-top:12px;padding:12px;background:rgba(196,30,58,0.2);border:1px solid var(--red);border-radius:4px;text-align:center"><strong style="color:var(--red);font-size:18px">💀 GAME OVER — 倒産</strong></div>';
    } else {
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn btn-gold" style="font-size:16px;padding:12px 28px;font-weight:700" onclick="advanceWeek()">次の月へ →</button></div>';
    }
  }
  // ── C-4: TRANSFER WINDOW UI ──
  else if (G.weekPhase === 'transfer') {
    document.getElementById('weekTitle').textContent = `第${G.week}週 — 🔄 移籍ウィンドウ`;
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
      document.getElementById('weekTitle').textContent = `第${G.week}週 — ⚔ 対抗戦`;
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
      document.getElementById('weekTitle').textContent = `第${G.week}週 — 🏆 頂上決戦`;
      html += `<div style="background:linear-gradient(135deg,rgba(241,196,15,0.2),rgba(255,215,0,0.1));border:1px solid rgba(241,196,15,0.4);border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
        <h3 style="color:var(--gold);margin-bottom:8px">🏆 頂上決戦</h3>
        <p style="font-size:14px;color:var(--text-main);margin-bottom:4px">${ev.orgName}のエースに挑む！</p>
        <p style="font-size:12px;color:var(--text-sub)">勝利で団体人気+${EVENT_CONFIG.summitPopReward}、レーティング+${EVENT_CONFIG.summitRatingReward}</p>
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

  // ── SCOUT EVENT PHASE ──
  else if (G.weekPhase === 'scoutEvent') {
    const weekLabel = G.offSeason ? `オフシーズン第${G.offWeek}週` : `第${G.week}週`;
    const eventLabel = G.scoutEventType === 'midseason' ? '補強スカウト' : 'メインスカウト';
    document.getElementById('weekTitle').textContent = `${weekLabel} — 🔍 ${eventLabel}`;
    html += `<div style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(46,204,113,0.1),rgba(52,152,219,0.05));border:1px solid rgba(46,204,113,0.25);border-radius:8px;margin-bottom:16px">
      <h3 style="color:#2ecc71;margin-bottom:8px">🔍 スカウトレポート到着</h3>
      <p style="font-size:13px;color:var(--text-sub)">候補者の詳細は「スカウトイベント」画面で確認できます</p>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px">獲得枠: ${(G.scoutPicks||[]).length} / ${G.scoutMaxPicks || 3}名</p>
    </div>
    <div class="btn-row">
      <button class="btn btn-gold" onclick="showScreen('scoutEvent')">🔍 候補者を見る</button>
      <button class="btn btn-blue" onclick="scoutFinish()">スカウト終了 →</button>
    </div>`;
  }

  el.innerHTML = html;
}

function renderRoster() {
  // === Staff Section ===
  const staffEl = document.getElementById('rosterStaffSection');
  const staffCountEl = document.getElementById('staffCount');
  const staffMaxEl = document.getElementById('staffMax');
  if (staffEl) {
    const hired = getHiredCoaches();
    if (staffCountEl) staffCountEl.textContent = hired.length;
    if (staffMaxEl) staffMaxEl.textContent = MAX_COACHES;

    const coachEffectShort = (c) => {
      if (c.specialty === 'mq') return `MQ +${c.mqBonus}`;
      if (c.specialty === 'pop') return `人気 +${c.popBonus}`;
      if (c.specialty === 'all') return `全成長 ×${c.growthMult}`;
      if (c.specialty === 'mental') return `回復+${c.condBonus} 怪我-${Math.round((c.injuryReduce||0.5)*100)}%`;
      return `${c.specialty.toUpperCase()} ×${c.growthMult}`;
    };

    let staffHtml = '';
    if (hired.length > 0) {
      staffHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">';
      hired.forEach(c => {
        const assigned = getCoachAssignees(c.id);
        const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);
        staffHtml += `<div onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;transition:border-color 0.2s" onmouseenter="this.style.borderColor='var(--gold)'" onmouseleave="this.style.borderColor='var(--border)'">
          ${coachPortraitImg(c, 48)}
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15px;margin-bottom:3px">${c.name}</div>
            <div style="font-size:13px;color:var(--gold);margin-bottom:4px">${coachEffectShort(c)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">`;
        if (assignedChars.length > 0) {
          assignedChars.forEach(ch => {
            staffHtml += `<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px">${portraitImg(ch.id, 20, '', true)} ${ch.name.substring(0,4)}</span>`;
          });
        } else {
          staffHtml += `<span style="font-size:12px;color:var(--text-dim);font-style:italic">担当なし</span>`;
        }
        staffHtml += `</div>
          </div>
          <span style="font-size:12px;color:var(--text-dim)">ℹ️</span>
        </div>`;
      });
      staffHtml += '</div>';
    } else {
      staffHtml += `<div style="text-align:center;padding:16px;color:var(--text-dim);font-size:12px">コーチ未雇用 — <span style="color:var(--gold);cursor:pointer;text-decoration:underline" onclick="showScreen('coach')">スタッフ室</span>から雇用できます</div>`;
    }
    staffEl.innerHTML = staffHtml;
  }

  // === Roster Section ===
  const el = document.getElementById('rosterTable');


  const sortBtns = [
    {key:'ovr', label:'OVR'},
    {key:'name', label:'名前'},
    {key:'cond', label:'体調'},
    {key:'pop', label:'人気'},
  ].map(s => `<button onclick="setRosterSort('${s.key}')" style="font-size:11px;padding:3px 10px;border-radius:3px;cursor:pointer;border:1px solid ${_rosterSortKey===s.key ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.08)'};background:${_rosterSortKey===s.key ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)'};color:${_rosterSortKey===s.key ? 'var(--gold)' : 'var(--text-dim)'}">${s.label}</button>`).join('');
  let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:11px;color:var(--text-dim)">並び順:</span>${sortBtns}</div>`;
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
  const sorted = [...G.roster].sort((a,b) => {
    switch(_rosterSortKey) {
      case 'name': return a.name.localeCompare(b.name, 'ja');
      case 'cond': return b.condition - a.condition;
      case 'pop': return b.popularity - a.popularity;
      default: return ov(b) - ov(a);
    }
  });
  sorted.forEach(c => {
    const roleCls = c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral';
    const condPct = c.condition;
    const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
    const injuryBadge = c.injury ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(214,48,49,0.15);color:#f08b9e;border:1px solid rgba(214,48,49,0.3)">🏥${c.injury.weeksLeft}週</span>` : '';
    const champBadge = G.titles.world.championId === c.id ? '<span style="color:var(--gold);font-size:12px"> 👑</span>' : '';
    const rentalBadge = c.isRental ? '<span style="color:#f39c12;font-size:12px"> 🤝</span>' : '';
    // v1.3-1: wear状態ラベル (§3)
    const wearBadge = (() => {
      const w = c.wear || 0;
      if (w >= 60) return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">⬇⬇ 限界</span>';
      if (w >= 40) return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(230,126,34,0.12);color:#e67e22;border:1px solid rgba(230,126,34,0.3)">⬇ 衰退期</span>';
      if (w >= 20) return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(241,196,15,0.12);color:#f1c40f;border:1px solid rgba(241,196,15,0.3)">⚠ 衰え</span>';
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
    const statG = (key) => {
      const g = Math.round(c.seasonGrowth ? (c.seasonGrowth[key] || 0) : 0);
      return g > 0 ? `<span class="growth-up">+${g}</span>` : '';
    };
    html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px${c.injury ? ';opacity:0.75' : ''};cursor:pointer" onclick="showFighterPopup(${c.id},'roster')">
      ${portraitImg(c.id, 56, '', true)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
          ${fLink(c, {source:'roster', size:'13px'})}${champBadge}${rentalBadge}
          <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>
          <span class="badge badge-${roleCls}" style="font-size:10px;padding:1px 5px">${c.role}</span>
          ${injuryBadge}${wearBadge}${growthPenaltyBadge}${hotStreakBadge}${slumpBadge}${motivLossBadge}
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-sub)">
          <span style="font-size:17px;font-weight:900;color:var(--gold)">${ov(c)}</span>
          <span>PW<b style="color:var(--text)">${Math.round(c.pw)}</b>${statG('pw')}</span>
          <span>SP<b style="color:var(--text)">${Math.round(c.sp)}</b>${statG('sp')}</span>
          <span>TE<b style="color:var(--text)">${Math.round(c.te)}</b>${statG('te')}</span>
          <span>ST<b style="color:var(--text)">${Math.round(c.st)}</b>${statG('st')}</span>
          <span>MN<b style="color:var(--text)">${Math.round(c.mn)}</b>${statG('mn')}</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;font-size:11px;color:var(--text-sub)">
        <div>人気 <b style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</b></div>
        <div style="display:flex;align-items:center;gap:3px;margin-top:2px"><div style="width:40px;height:4px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="width:${condPct}%;height:100%;background:${condCls};border-radius:3px"></div></div><span style="font-size:10px">${condPct}</span></div>
        <div style="margin-top:2px;color:var(--text-dim)">${getSalary(c)}万</div>
      </div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function getUsedFighterIds(excludeSlot) {
  // Returns Set of fighter IDs already assigned to other match slots
  const used = new Set();
  G.showCard.forEach((m, i) => {
    if (i === excludeSlot) return;
    if (m.left > 0) used.add(m.left);
    if (m.right > 0) used.add(m.right);
  });
  return used;
}

function getAvailableForSlot(slotIndex, side) {
  // Returns roster members not used in other slots, not in other side, and not injured
  const used = getUsedFighterIds(slotIndex);
  const otherSide = side === 'left' ? G.showCard[slotIndex].right : G.showCard[slotIndex].left;
  return G.roster.filter(c => !used.has(c.id) && c.id !== otherSide && !c.injury);
}

function renderShowPrep() {
  const el = document.getElementById('showPrepContent');
  if (!isShowWeek(G.week)) {
    el.innerHTML = '<p style="color:var(--text-sub)">興行週ではありません。</p>';
    return;
  }

  let html = '';

  // Venue selection
  html += '<div class="panel-title" style="margin-top:0">会場選択</div>';
  html += '<div class="venue-grid">';
  VENUES.forEach((v, i) => {
    const locked = Math.round(G.orgPop) < v.popReq;
    const selected = G.showVenue === i;
    html += `<div class="venue-card ${locked ? 'locked' : ''} ${selected ? 'selected' : ''}"
      onclick="${locked ? '' : `App.setShowVenue(${i})`}">
      <div class="venue-name">${v.name}</div>
      <div class="venue-info">キャパ: ${v.cap.toLocaleString()}人</div>
      <div class="venue-info">コスト: ${v.cost}万</div>
      ${locked ? `<div class="venue-info" style="color:var(--red)">人気${v.popReq}必要</div>` : ''}
    </div>`;
  });
  html += '</div>';

  // Match card
  const maxMatches = isSpecialShow(G.week) || isPPV(G.week) ? 6 : 4;
  // v1.9: pad up OR trim down to match the current week's limit
  // （6試合の特別試合後、4試合月に6枠が残るバグ対策）
  {
    let adjusted = [...G.showCard];
    while (adjusted.length < maxMatches) adjusted.push({left:0, right:0, isTitle:false});
    if (adjusted.length > maxMatches) adjusted = adjusted.slice(0, maxMatches);
    if (adjusted.length !== G.showCard.length) G = { ...G, showCard: adjusted };
  }

  // Sanitize stale IDs (released/retired/transferred wrestlers still in card)
  {
    const rosterIds = new Set(G.roster.map(c => c.id));
    let dirty = false;
    const cleaned = G.showCard.map(m => {
      const leftOk = m.left > 0 && rosterIds.has(m.left);
      const rightOk = m.right > 0 && rosterIds.has(m.right);
      if ((m.left > 0 && !leftOk) || (m.right > 0 && !rightOk)) dirty = true;
      return { ...m, left: leftOk ? m.left : 0, right: rightOk ? m.right : 0,
        isTitle: !!m.isTitle && leftOk && rightOk };
    });
    if (dirty) G = { ...G, showCard: cleaned };
  }
  // v2.0: ファン期待度パネル（最大3件表示）
  const fanExpects = Engine.fanExpect.generate(G);
  if (fanExpects.length > 0) {
    const validCurrent = G.showCard.filter(m => m.left > 0 && m.right > 0);
    const matchedCount = Engine.fanExpect.countMatched(validCurrent, fanExpects);
    html += `<div style="margin-bottom:14px;padding:10px 12px;background:rgba(212,168,67,0.07);border:1px solid rgba(212,168,67,0.2);border-radius:6px">`;
    html += `<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:6px">🎤 ファンの声 ${matchedCount > 0 ? `<span style="color:#2ecc71;font-size:11px">（${matchedCount}件反映中 → MQ+5 / 試合）</span>` : ''}</div>`;
    fanExpects.forEach(exp => {
      const isOnCard = validCurrent.some(m =>
        (m.left === exp.leftId && m.right === exp.rightId) ||
        (m.left === exp.rightId && m.right === exp.leftId)
      );
      const checkMark = isOnCard ? '<span style="color:#2ecc71;font-weight:700">✓ </span>' : '• ';
      const color = isOnCard ? 'color:#2ecc71' : 'color:var(--text-sub)';
      html += `<div style="font-size:11px;${color};margin-top:3px">${checkMark}${exp.reason}</div>`;
    });
    html += '</div>';
  }

  html += `<div style="display:flex;align-items:center;gap:12px;margin-top:16px">
    <div class="panel-title" style="margin:0">マッチカード（最大${maxMatches}試合）</div>
    <button class="btn btn-blue btn-sm" onclick="autoFillCard();renderShowPrep()">✨ 自動編成</button>
    <button class="btn btn-sm" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c" onclick="App.clearShowCard()">🗑 全クリア</button>
  </div>`;

  for (let i = 0; i < maxMatches; i++) {
    const isMain = i === 0;
    const availL = getAvailableForSlot(i, 'left');
    const availR = getAvailableForSlot(i, 'right');
    // Include currently selected fighter in their own dropdown even if "used"
    const curL = G.showCard[i].left;
    const curR = G.showCard[i].right;

    const makeOptions = (avail, curVal) => {
      let opts = '<option value="0">-- 選手選択 --</option>';
      // If current value is set but not in available (shouldn't happen with correct logic), include it
      const ids = new Set(avail.map(c => c.id));
      if (curVal > 0 && !ids.has(curVal)) {
        const extra = G.roster.find(c => c.id === curVal);
        if (extra) avail = [extra, ...avail];
      }
      avail.forEach(c => {
        const champMark = G.titles.world.championId === c.id ? '👑 ' : '';
        opts += `<option value="${c.id}" ${curVal===c.id?'selected':''}>${champMark}${c.name} (総合:${ov(c)} 体調:${c.condition})</option>`;
      });
      return opts;
    };

    const champId = G.titles.world.championId;
    const hasChamp = champId && (curL === champId || curR === champId);
    const isVacant = !champId;
    // v1.2: 12週クールダウンチェック
    const cdCheck = Engine.title.canTitleMatch(G); // { allowed, weeksLeft }
    const titleEligible = G.titleEstablished && (hasChamp || (isVacant && curL > 0 && curR > 0));
    const canTitle = titleEligible && cdCheck.allowed;
    const isTitle = G.showCard[i].isTitle || false;
    const titleLabel = isVacant ? '初代王者決定戦' : 'タイトル戦';
    const rivalLvl = (curL > 0 && curR > 0) ? getRivalryLevel(curL, curR) : null;

    html += `<div class="match-slot ${isMain ? 'main-event' : ''}" style="margin-top:8px">
      <div class="match-slot-num">${isMain ? '★' : i+1}</div>
      <div style="display:flex;align-items:center;gap:4px">${curL > 0 ? portraitImg(curL, 80) : ''}</div>
      <div class="match-fighter">
        <select onchange="onCardSelect(${i},'left',this.value)">
          ${makeOptions(availL, curL)}
        </select>
      </div>
      <div class="match-slot-vs">VS</div>
      <div class="match-fighter">
        <select onchange="onCardSelect(${i},'right',this.value)">
          ${makeOptions(availR, curR)}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:4px">${curR > 0 ? portraitImg(curR, 80) : ''}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-left:8px;font-size:12px">
        ${canTitle ? `<label style="color:var(--gold);cursor:pointer"><input type="checkbox" ${isTitle?'checked':''} onchange="toggleTitle(${i});renderShowPrep()"> 🏆${titleLabel}</label>` : ''}
        ${titleEligible && !cdCheck.allowed ? `<span style="color:var(--text-dim);font-size:11px" title="タイトルマッチは12週に1回まで">⏳ 次のタイトルマッチまであと${cdCheck.weeksLeft}週</span>` : ''}
        ${(()=>{if(!isTitle||!champId||curL<=0||curR<=0)return'';const cf=champId===curL?G.roster.find(c=>c.id===curL):G.roster.find(c=>c.id===curR);const chf=champId===curL?G.roster.find(c=>c.id===curR):G.roster.find(c=>c.id===curL);if(!cf||!chf)return'';const gap=Engine.util.ov(cf)-Engine.util.ov(chf);if(gap>20)return`<span style="color:#e74c3c;font-size:11px" title="格差が大きいタイトルマッチ(OVR差${gap})はMQ-6">⚠️ 格差大(OVR差${gap}) MQ-6</span>`;if(gap>10)return`<span style="color:#e67e22;font-size:11px" title="格差タイトルマッチ(OVR差${gap})はMQ-3">⚠️ 格差(OVR差${gap}) MQ-3</span>`;return'';})()}
        ${!G.titleEstablished && curL > 0 && curR > 0 ? `<span style="color:var(--text-dim);font-size:11px" title="興行3回・人気15・ロスター5人で設立">🔒 王座未設立</span>` : ''}
        ${rivalLvl ? `<span style="color:${rivalLvl.color}">${rivalLvl.emoji}${rivalLvl.label}(MQ+${rivalLvl.mqBonus})</span>` : ''}
      </div>
    </div>`;
  }

  // Preview
  const validMatches = G.showCard.filter(m => m.left > 0 && m.right > 0 && m.left !== m.right);
  // v1.0c: 積み上げ方式（平均→calcCardPop）
  const mainPop = validMatches.length > 0 ?
    Engine.economy.calcCardPop(validMatches.map(m => {
      const l = G.roster.find(c => c.id === m.left);
      const r = G.roster.find(c => c.id === m.right);
      return (l ? l.popularity : 0) + (r ? r.popularity : 0);
    })) : 0;
  const hasTitlePreview = validMatches.some(m => m.isTitle);
  const champIdPreview = G.titles?.world?.championId;
  const hasChampPreview = champIdPreview ? validMatches.some(m => m.left === champIdPreview || m.right === champIdPreview) : false;
  const estAttend = calcAttendance(G.showVenue, mainPop, hasTitlePreview, hasChampPreview);
  const estRev = calcShowRevenue(G.showVenue, estAttend);
  const estOccPct = Math.round((estRev.occupancyRate || 0) * 100);
  // v1.0c: 会場熱気MQボーナス予想
  const estCrowdMQ = Engine.economy.calcCrowdMQBonus(G.showVenue, estRev.occupancyRate || 0);

  const heat = getHeatLevel();
  html += `<div style="margin-top:12px;padding:10px;background:rgba(0,0,0,0.3);border-radius:4px;font-size:12px">
    <div style="margin-bottom:4px"><span style="color:${heat.color}">${heat.emoji} Heat: ${heat.label}（集客×${heat.mult}）</span>${hasTitlePreview ? ' <span style="color:var(--gold)">🏆 タイトル戦（集客×1.15）</span>' : ''}${hasChampPreview ? ' <span style="color:var(--gold)">👑 王者出場（集客×1.10）</span>' : ''}</div>
    <strong>予想集客:</strong> ${estAttend.toLocaleString()}人 / ${VENUES[G.showVenue].cap.toLocaleString()}人 (${estOccPct}% ${estRev.occLabel || ''})
    &nbsp;|&nbsp; <strong>予想チケット収入:</strong> ${estRev.ticketRev}万
    &nbsp;|&nbsp; <strong>予想グッズ:</strong> ${estRev.goodsRev}万
    &nbsp;|&nbsp; <strong>会場費:</strong> -${estRev.venueCost}万
    ${estCrowdMQ.total !== 0 ? `<div style="margin-top:4px;color:${estCrowdMQ.total > 0 ? 'var(--green)' : 'var(--red)'}">🏟️ 会場熱気: MQ全試合${estCrowdMQ.total >= 0 ? '+' : ''}${estCrowdMQ.total}${estCrowdMQ.crowdLabel ? '（' + estCrowdMQ.crowdLabel + '）' : ''}</div>` : ''}
  </div>`;

  html += '<div class="btn-row" style="margin-top:16px">';
  html += `<button class="btn btn-gold" onclick="executeShow()" ${validMatches.length === 0 ? 'disabled' : ''}>興行開催！ (${validMatches.length}試合)</button>`;
  html += '<button class="btn btn-blue" onclick="G={...G,weekPhase:\'manage\'};showScreen(\'week\');refreshAll()">戻る</button>';
  html += '</div>';

  el.innerHTML = html;
}

function renderFinance() {
  const el = document.getElementById('financeContent');
  let html = `<div style="font-size:24px;font-weight:900;margin-bottom:8px;color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${G.funds.toLocaleString()}万</div>`;

  // v0.95: Funds history chart
  const fh = G.fundsHistory || [];
  if (fh.length > 1) {
    const chartW = 320, chartH = 60;
    const fMin = Math.min(...fh, 0);
    const fMax = Math.max(...fh, 1);
    const range = fMax - fMin || 1;
    const points = fh.map((v, i) => `${Math.round(i * chartW / Math.max(fh.length - 1, 1))},${chartH - Math.round(((v - fMin) / range) * chartH)}`).join(' ');
    const zeroY = chartH - Math.round(((0 - fMin) / range) * chartH);
    html += `<div style="margin-bottom:16px;padding:8px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">💹 資金推移 (${fh.length}週)</div>
      <svg width="${chartW}" height="${chartH}" style="display:block">
        <line x1="0" y1="${zeroY}" x2="${chartW}" y2="${zeroY}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="3"/>
        <polyline points="${points}" fill="none" stroke="${G.funds>=0?'#2ecc71':'#e74c3c'}" stroke-width="1.5"/>
        <circle cx="${chartW}" cy="${chartH - Math.round(((fh[fh.length-1] - fMin) / range) * chartH)}" r="3" fill="${G.funds>=0?'#2ecc71':'#e74c3c'}"/>
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);margin-top:2px">
        <span>${fMax.toLocaleString()}万</span><span>${fMin.toLocaleString()}万</span>
      </div>
    </div>`;
  }

  // Weekly costs breakdown
  html += '<div class="panel-title">週間コスト内訳</div>';
  html += `<div class="finance-row"><span class="f-label">選手給与合計</span><span class="f-val expense">-${calcWeeklySalary()}万/週</span></div>`;
  html += `<div class="finance-row"><span class="f-label">施設維持費</span><span class="f-val expense">-${FIXED_COSTS.facility}万/週</span></div>`;
  html += `<div class="finance-row"><span class="f-label">事務運営費</span><span class="f-val expense">-${FIXED_COSTS.admin}万/週</span></div>`;
  // v0.6: Coach salaries
  const coachTotal = getCoachSalaryTotal();
  if (coachTotal > 0) html += `<div class="finance-row"><span class="f-label">コーチ給与（${G.coaches.length}名）</span><span class="f-val expense">-${coachTotal}万/週</span></div>`;
  // v0.7: Facility upgrade maintenance
  const facilityMaint = getFacilityMaintenance();
  if (facilityMaint > 0) html += `<div class="finance-row"><span class="f-label">施設アップグレード維持費</span><span class="f-val expense">-${facilityMaint}万/週</span></div>`;
  const totalWeekly = calcWeeklySalary() + calcFixedCosts() + coachTotal + facilityMaint;
  html += `<div class="finance-row finance-total"><span>週間支出合計</span><span class="f-val expense">-${totalWeekly}万</span></div>`;

  html += '<div class="panel-title" style="margin-top:16px">週間収入</div>';
  html += `<div class="finance-row"><span class="f-label">スポンサー</span><span class="f-val income">+${getSponsorIncome()}万/週</span></div>`;
  const broadcastTotal = getBroadcastIncome() + getFacilityBroadcastBonus();
  html += `<div class="finance-row"><span class="f-label">放映権${getFacilityBroadcastBonus() > 0 ? '（メディア施設込）' : ''}</span><span class="f-val income">+${broadcastTotal}万/週</span></div>`;

  // Salary detail
  html += '<div class="panel-title" style="margin-top:16px">選手別給与</div>';
  html += '<table class="data-table"><tr><th>名前</th><th>総合</th><th>給与</th></tr>';
  [...G.roster].sort((a,b) => getSalary(b) - getSalary(a)).forEach(c => {
    html += `<tr><td>${fLink(c, {source:'roster', size:'12px'})}</td><td class="num">${ov(c)}</td><td class="num">${getSalary(c)}万</td></tr>`;
  });
  html += '</table>';

  el.innerHTML = html;
}

function renderLog() {
  const el = document.getElementById('logContent');
  // v0.95: Enhanced log with filter
  const categories = [
    { key: 'all', label: '全て', icon: '全' },
    { key: 'show', label: '興行', icon: '興', match: l => l.includes('興行') || l.includes('MQ') || l.includes('勝利') || l.includes('防衛') },
    { key: 'finance', label: '財務', icon: '金', match: l => l.includes('収入') || l.includes('支出') || l.includes('万') || l.includes('残高') },
    { key: 'event', label: 'イベント', icon: '戦', match: l => l.includes('対抗') || l.includes('挑戦') || l.includes('頂上') || l.includes('移籍') || l.includes('レンタル') || l.includes('引き抜き') },
    { key: 'season', label: 'シーズン', icon: '季', match: l => l.includes('シーズン') || l.includes('オフ') || l.includes('引退') || l.includes('開幕') || l.includes('ランキング') },
  ];
  const currentFilter = el.dataset.filter || 'all';
  let html = '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
  categories.forEach(cat => {
    const active = currentFilter === cat.key;
    html += `<button onclick="document.getElementById('logContent').dataset.filter='${cat.key}';renderLog()" style="font-size:12px;padding:3px 8px;border-radius:3px;cursor:pointer;border:1px solid ${active ? 'var(--gold)' : 'var(--border)'};background:${active ? 'rgba(212,168,67,0.15)' : 'transparent'};color:${active ? 'var(--gold)' : 'var(--text-dim)'}">${cat.icon} ${cat.label}</button>`;
  });
  html += '</div>';

  const filtered = currentFilter === 'all' ? G.gameLog : G.gameLog.filter(categories.find(c => c.key === currentFilter)?.match || (() => true));
  const display = filtered.slice(-100).reverse();
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">${filtered.length}件中 最新${Math.min(display.length, 100)}件</div>`;
  display.forEach(l => {
    html += `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:11px;color:var(--text-sub)">${l}</div>`;
  });
  el.innerHTML = html;
}

// ── Ranking Screen (v0.9) ────────────────────────────────
function renderRanking() {
  const el = document.getElementById('rankingContent');
  // Recalculate live rankings
  const rankings = Engine.ranking.updateRankings(G);
  G = { ...G, rankings };

  let html = '';

  // Rank-based color map: 1=gold, 2=red, 3=purple, 4=green
  const RANK_COLORS = { 1: '#d4a843', 2: '#e74c3c', 3: '#9b59b6', 4: '#2ecc71' };
  const getRankColor = (rank) => RANK_COLORS[rank] || '#888';

  // Victory condition reminder
  const topAI = rankings.find(r => r.orgId !== 'player');
  const playerEntry = rankings.find(r => r.orgId === 'player');
  if (topAI && playerEntry) {
    const gap = topAI.rating - playerEntry.rating;
    if (gap > 0) {
      html += `<div style="margin-bottom:16px;padding:12px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:6px;font-size:12px">
        🎯 <strong>勝利条件</strong>: 1位団体 <strong>${topAI.name}</strong>（${topAI.rating}pt）を超えること — あと <strong style="color:var(--gold)">${gap}pt</strong>
      </div>`;
    } else {
      html += `<div style="margin-bottom:16px;padding:12px;background:rgba(46,204,113,0.12);border:1px solid rgba(46,204,113,0.3);border-radius:6px;font-size:12px">
        👑 <strong style="color:#2ecc71">業界1位！</strong> あなたの団体が頂点に立っています
      </div>`;
    }
  }

  // Ranking table — tooltip texts stored in global to avoid HTML-in-attribute issues
  window._rankTips = {
    rating: '👑 王者ボーナス: 30pt<br>⭐ スター得点 + 👥 人気計<br>の合計がランキング評価値',
    star:   '人気50以上 = 15pt（トップスター）<br>人気35以上 = 8pt（スター）<br>人気20以上 = 3pt（中堅）<br>スターの厚みを示す',
    pop:    '所属選手の人気を全員合計した値（×0.1）<br>団体全体の層の厚さを示す'
  };
  const tt = (key) => `<span class="tt" onmouseenter="showCustomTooltip(this,_rankTips.${key})" onmouseleave="hideCustomTooltip()" onclick="event.stopPropagation();showCustomTooltip(this,_rankTips.${key})">?</span>`;
  html += `<table class="data-table"><tr><th style="width:40px">#</th><th>団体名</th>` +
    `<th style="text-align:right">評価値${tt('rating')}</th>` +
    `<th style="text-align:right">⭐ スター${tt('star')}</th>` +
    `<th style="text-align:right">👥 人気計${tt('pop')}</th>` +
    `<th style="text-align:right">人数</th></tr>`;
  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const emoji = isPlayer ? '🏠' : (org ? org.emoji : '');
    const rc = getRankColor(r.rank);
    const bgStyle = isPlayer ? `background:${rc}10` : '';
    const nameStyle = isPlayer ? `color:${rc};font-weight:700` : `color:${rc}`;
    const tierBadge = org ? `<span style="font-size:11px;padding:2px 6px;border-radius:3px;background:${rc}20;color:${rc};border:1px solid ${rc}40;margin-left:6px">${org.tier}</span>` : '';
    html += `<tr style="${bgStyle}">
      <td style="font-size:18px;font-weight:900;color:${rc}">${r.rank}</td>
      <td>${emoji} <span style="${nameStyle}">${r.name}</span>${tierBadge}</td>
      <td class="num" style="font-size:16px;font-weight:700">${r.rating}</td>
      <td class="num">${r.starPower}</td>
      <td class="num">${r.totalPop}</td>
      <td class="num">${r.rosterSize}</td>
    </tr>`;
  });
  html += '</table>';

  // Org detail cards — unified by ranking order
  const rankFighterCount = { 1: 5, 2: 4, 3: 3, 4: 2 };
  html += '<div style="margin-top:20px;display:grid;gap:12px">';
  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const topCount = rankFighterCount[r.rank] || 2;

    if (isPlayer) {
      // Player org card
      const rc = getRankColor(r.rank);
      const avgOvr = G.roster.length ? Math.round(G.roster.reduce((s,c) => s + ov(c), 0) / G.roster.length) : 0;
      const sorted = [...G.roster].filter(c => !c.injury).sort((a,b) => ov(b) - ov(a));
      // Put champion first if exists
      let topFighters = sorted.slice(0, topCount);
      if (G.titles?.world?.championId) {
        const champIdx = sorted.findIndex(c => c.id === G.titles.world.championId);
        if (champIdx > 0 && champIdx < sorted.length) {
          topFighters = [sorted[champIdx], ...sorted.filter(c => c.id !== G.titles.world.championId)].slice(0, topCount);
        }
      }
      html += `<div style="padding:14px;background:${rc}0a;border:2px solid ${rc}80;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:16px;font-weight:700;color:${rc}">🏠 ${G.orgName || 'プレイヤー団体'} <span style="font-size:12px;background:${rc}20;color:${rc};padding:2px 8px;border-radius:3px;border:1px solid ${rc}40;margin-left:6px">${r.rank}位</span></span>
          <span style="font-size:13px;color:var(--text-sub)">${r.rating}pt ｜ ${G.roster.length}名 ｜ 平均OVR:${avgOvr} ｜ 団体人気:${Engine.util.dispOrgPop(G.orgPop)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">王者: ${G.titles?.world?.championId ? G.roster.find(c=>c.id===G.titles.world.championId)?.name || 'なし' : '<span style="color:var(--text-dim)">不在</span>'}</div>
        <div style="font-size:13px;margin-top:10px">
          <span style="color:var(--text-dim)">主力:</span>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
          ${topFighters.map(f => {
            const isChamp = G.titles?.world?.championId === f.id;
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;width:120px;text-align:center"><div class="monitor-wrap">${portraitImg(f.id, 100)}</div><span style="font-size:12px">${fLink(f, {source:'roster', bold:false, size:'12px'})}</span><span style="color:var(--text-dim);font-size:11px">OVR ${ov(f)}${isChamp ? ' 👑王者' : ''}</span></div>`;
          }).join('')}
          </div>
        </div>
      </div>`;
    } else if (org) {
      // AI org card — use rank color
      const rc = getRankColor(r.rank);
      const aiData = G.aiOrgs && G.aiOrgs[org.id];
      if (!aiData) return;
      const roster = aiData.roster;
      const rEntry = rankings.find(re => re.orgId === org.id);
      const avgOvr = roster.length ? Math.round(roster.reduce((s,f) => s + Engine.util.ov(f), 0) / roster.length) : 0;
      const topFighters = [...roster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, topCount);

      html += `<div style="padding:14px;background:${rc}08;border:1px solid ${rc}30;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:16px;font-weight:700;color:${rc}">${org.emoji} ${org.name} <span style="font-size:12px;opacity:0.7">${org.tier}級</span> <span style="font-size:12px;background:${rc}20;color:${rc};padding:2px 8px;border-radius:3px;border:1px solid ${rc}40;margin-left:6px">${r.rank}位</span></span>
          <span style="font-size:13px;color:var(--text-sub)">${rEntry ? rEntry.rating + 'pt' : ''} ｜ ${roster.length}名 ｜ 平均OVR:${avgOvr} ｜ 団体人気:${Engine.util.dispOrgPop(aiData.orgPop)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">${org.desc}</div>
        <div style="font-size:13px;margin-top:10px">
          <span style="color:var(--text-dim)">主力:</span>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
          ${topFighters.map(f => `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;width:120px;text-align:center"><div class="monitor-wrap">${portraitImg(f.id, 100)}</div><span style="font-size:12px">${fLink(f, {source:'ai:'+org.id, bold:false, size:'12px'})}</span><span style="color:var(--text-dim);font-size:11px">OVR ${Engine.util.ov(f)}</span></div>`).join('')}
          </div>
        </div>
        <details style="margin-top:10px">
          <summary style="font-size:13px;color:${rc};cursor:pointer">📋 選手を引き抜く（${roster.length}名）</summary>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${[...roster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a)).map((f, idx) => {
              const fOvr = Engine.util.ov(f);
              const isTop = idx === 0;
              const canNeg = !G.pendingNegotiation && !(G.negotiatedThisSeason || []).includes(f.id);
              return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid ${rc}20;border-radius:6px;width:calc(50% - 4px);min-width:240px;cursor:pointer" onclick="showNegotiatePopup('${org.id}',${f.id})">
                <div class="monitor-wrap monitor-wrap-sm">${portraitImg(f.id, 48)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;color:var(--text-main)">${f.name}${isTop ? ' <span style="font-size:10px;color:#e74c3c">★看板</span>' : ''}</div>
                  <div style="font-size:11px;color:var(--text-dim)">OVR ${fOvr} ・ ${f.style || '?'}</div>
                </div>
                <div style="font-size:11px;color:${canNeg ? rc : 'var(--text-dim)'};white-space:nowrap">${canNeg ? '交渉→' : G.pendingNegotiation ? (G.pendingNegotiation.fighterId === f.id ? '⏳交渉中' : '—') : (G.negotiatedThisSeason || []).includes(f.id) ? '交渉済' : '交渉→'}</div>
              </div>`;
            }).join('')}
          </div>
        </details>
      </div>`;
    }
  });
  html += '</div>';

  // v0.95: Season History
  if (G.seasonHistory && G.seasonHistory.length > 0) {
    html += '<div style="margin-top:20px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px">';
    html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">📈 シーズン履歴</h4>';
    html += '<table class="data-table"><tr><th>シーズン</th><th style="text-align:right">順位</th><th style="text-align:right">興行数</th><th style="text-align:right">最高MQ</th><th style="text-align:right">収支</th><th style="text-align:right">最終資金</th><th style="text-align:right">人数</th></tr>';
    G.seasonHistory.forEach(h => {
      const profit = (h.totalRevenue || 0) - (h.totalExpense || 0);
      html += `<tr>
        <td>${h.season}年目</td>
        <td class="num" style="font-weight:700;color:${h.rank===1?'var(--gold)':h.rank===2?'#e74c3c':h.rank===3?'#9b59b6':'#2ecc71'}">${h.rank}位</td>
        <td class="num">${h.showCount || 0}</td>
        <td class="num" style="color:#3498db">${h.bestMQ || 0}</td>
        <td class="num" style="color:${profit>=0?'#2ecc71':'#e74c3c'}">${profit>=0?'+':''}${profit.toLocaleString()}万</td>
        <td class="num">${(h.funds||0).toLocaleString()}万</td>
        <td class="num">${h.rosterSize || '-'}</td>
      </tr>`;
    });
    html += '</table></div>';
  }

  el.innerHTML = html;
}

function renderScout() {
  const el = document.getElementById('scoutContent');
  document.getElementById('faCount').textContent = G.freeAgents.length;
  document.getElementById('rosterCount').textContent = G.roster.length;

  const discount = getFacilityScoutDiscount();
  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">
    所属: ${G.roster.length}名 ｜ フリー: ${G.freeAgents.length}名 ｜ 団体人気: ${Engine.util.dispOrgPop(G.orgPop)}${discount > 0 ? ` ｜ 🔍スカウト網割引: ${discount}%` : ''}
  </div>`;

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
      Submission:{color:'#e67e22',icon:'SUB'}, Speed:{color:'#2ecc71',icon:'SPD'},
      Allround:{color:'#f1c40f',icon:'ALL'}, Brawler:{color:'#e88a82',icon:'BRW'}
    };
    const sm = STYLE_META[c.style] || STYLE_META.Allround;
    const roleCls = c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral';
    const roleIcon = c.role === 'Babyface' ? 'BF' : c.role === 'Heel' ? 'HL' : 'NT';
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c);
    const rowOpacity = canNeg ? '' : 'opacity:0.45;';
    html += `<div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;${rowOpacity}cursor:pointer" onclick="showFighterPopup(${c.id},'free')">
      ${portraitImg(c.id, 80, '', true)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <span class="flink" style="font-size:17px;font-weight:700">${c.name}</span>
          <span style="font-size:14px;color:var(--text-dim)">${c.age}歳</span>
          <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;padding:3px 10px;border-radius:4px;background:${tierCfg.color}22;color:${tierCfg.color};border:1px solid ${tierCfg.color}44;font-weight:600">${tierCfg.label}</span>
          ${!canNeg ? '<span style="font-size:13px;color:#e74c3c">⛔ 知名度不足</span>' : ''}
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:28px;font-weight:900;color:var(--gold)">${ov(c)}</div>
        <div style="font-size:11px;color:var(--text-dim)">給与 <b style="color:var(--text)">${getSalary(c)}万</b>/週</div>
        <div style="font-size:11px;color:var(--text-dim)">契約 <b style="color:var(--gold)">${Engine.scout.getSigningCost(c, 0).toLocaleString()}万</b></div>
      </div>
    </div>`;
  });
  if (visibleFA.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:var(--text-dim)">この四半期の紹介枠にフリーエージェントはいません</div>';
  }

  // ── Phase D: Rental Section ──
  const rentalActive = G.rental;
  html += '<div class="panel-title" style="font-size:15px;margin-top:18px">🤝 他団体レンタル</div>';
  if (rentalActive) {
    const rentalF = G.roster.find(c => c.id === rentalActive.fighterId);
    const fromOrg = Engine.rival.getOrgInfo(G.aiOrgs, rentalActive.fromOrgId);
    html += `<div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);border-radius:6px;padding:14px;margin-bottom:12px">
      <div style="font-size:15px;color:var(--gold);font-weight:700;margin-bottom:6px">レンタル中</div>
      <div style="font-size:14px;color:var(--text-main)">${rentalF ? fLink(rentalF, {source:'roster'}) : '不明'} ← ${fromOrg ? fromOrg.name : '不明'}</div>
      <div style="font-size:13px;color:var(--text-sub)">残り${rentalActive.weeksLeft}週 ｜ ${rentalActive.weeklyCost}万/週</div>
    </div>`;
  } else if (G.offSeason) {
    html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">オフシーズン中はレンタルできません</div>';
  } else {
    const rentals = Engine.rental.getAvailableRentals(G);
    const visibleRentalIds = Engine.util.getVisibleRentalIds(G);
    const visibleRentals = rentals.filter(r => visibleRentalIds.includes(r.fighter.id));
    if (visibleRentals.length === 0) {
      html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">レンタル可能な選手がいません</div>';
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">4週間固定 / 同時1名まで / OVR上位2名は対象外 ｜ 紹介枠${visibleRentals.length}名（四半期入替）</div>`;
      html += '<div style="overflow-x:auto"><table class="data-table"><tr><th>名前</th><th>団体</th><th>Style</th><th>総合</th><th>週費用</th><th>合計</th><th>交渉</th></tr>';
      visibleRentals.forEach(r => {
        const canAfford = G.funds >= r.totalFee;
        html += `<tr>
          <td>${fLink(r.fighter, {source:'ai:'+r.org.id})}</td>
          <td style="font-size:13px;color:var(--text-sub)">${r.org.name}</td>
          <td><span class="badge badge-${r.fighter.style}">${r.fighter.style}</span></td>
          <td class="num ov">${Engine.util.ov(r.fighter)}</td>
          <td class="num" style="color:var(--text-sub)">${r.weeklyFee}万</td>
          <td class="num" style="color:#f39c12">${r.totalFee}万</td>
          <td><button onclick="requestRental(${r.fighter.id},'${r.org.id}')" class="btn btn-sm" style="font-size:12px;padding:4px 10px;background:rgba(243,156,18,0.15);border:1px solid rgba(243,156,18,0.3);color:#f39c12" ${canAfford?'':'disabled'}>レンタル</button></td>
        </tr>`;
      });
      html += '</table></div>';
    }
  }

  el.innerHTML = html;
}

// ── Scout Event Rendering ─────────────────────────────────
function renderScoutEvent() {
  const el = document.getElementById('scoutEventContent');
  if (!el) return;
  const candidates = G.scoutCandidates || [];
  const picks = G.scoutPicks || [];
  const maxPicks = G.scoutMaxPicks || 3;
  const discount = getFacilityScoutDiscount();
  const orgPop = G.orgPop || 0;
  const eventLabel = G.scoutEventType === 'midseason' ? '補強スカウト' : 'メインスカウト';

  const titleEl = document.getElementById('scoutEventTitle');
  if (titleEl) titleEl.textContent = `🔍 ${eventLabel} — 候補 ${candidates.length}名`;

  const STYLE_META = {
    Grappler:   {color:'#bb8fce',icon:'GRP'}, Striker:    {color:'#e74c3c',icon:'STK'},
    Submission: {color:'#e67e22',icon:'SUB'}, Speed:      {color:'#2ecc71',icon:'SPD'},
    Allround:   {color:'#f1c40f',icon:'ALL'}, Brawler:    {color:'#e88a82',icon:'BRW'}
  };

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">
    <span style="font-size:14px;color:var(--text-sub)">資金: <strong style="color:var(--gold)">${G.funds.toLocaleString()}万</strong></span>
    <span style="font-size:14px;color:var(--text-sub)">獲得: <strong style="color:#2ecc71">${picks.length} / ${maxPicks}名</strong></span>
    <span style="font-size:14px;color:var(--text-sub)">団体人気: <strong>${Engine.util.dispOrgPop(orgPop)}</strong></span>
    ${discount > 0 ? `<span style="font-size:11px;color:#f39c12">🔍 割引${discount}%</span>` : ''}
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
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role}</span>
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
    <button class="btn btn-gold" onclick="scoutFinish()">🔍 スカウト活動終了</button>
    <button class="btn btn-blue" onclick="showScreen('week')">← 週画面に戻る</button>
  </div>`;

  el.innerHTML = html;
}

function renderScoutCompetitionModal(cand, baseCost, discount) {
  const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
  const compCost = Math.round(baseCost * (cand._compMultiplier || 1.5));
  const winRate = Math.round((cand._bidWinRate || 0.5) * 100);

  const modal = document.createElement('div');
  modal.id = 'scoutCompModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.2s';
  modal.innerHTML = `<div style="background:var(--bg-panel);border:1px solid var(--border);border-radius:12px;padding:24px;max-width:360px;width:90%">
    <h3 style="color:#e74c3c;margin-bottom:12px;text-align:center">⚔ 他団体との競合発生！</h3>
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px">${cand.name}</div>
      <div style="font-size:12px;color:var(--text-dim)">${tierCfg.label} / ${cand.style} / ${cand.age}歳</div>
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px;font-size:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span>通常契約金:</span><span style="color:var(--gold)">${baseCost}万</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span>競合上乗せ (×${cand._compMultiplier}):</span><span style="color:#e74c3c;font-weight:700">${compCost}万</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>通常額での勝率:</span><span style="color:#f39c12">${winRate}%</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button onclick="document.getElementById('scoutCompModal').remove(); scoutResolve(${cand.id},'pay')" class="btn btn-gold" style="width:100%" ${G.funds >= compCost ? '' : 'disabled'}>
        💰 上乗せ確定獲得 (${compCost}万)
      </button>
      <button onclick="document.getElementById('scoutCompModal').remove(); scoutResolve(${cand.id},'gamble')" class="btn btn-blue" style="width:100%">
        🎲 通常額で勝負 (${baseCost}万 / 勝率${winRate}%)
      </button>
      <button onclick="document.getElementById('scoutCompModal').remove(); scoutResolve(${cand.id},'skip')" class="btn" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--text-dim)">
        ❌ 諦める
      </button>
    </div>
  </div>`;
  // Remove existing modal if any
  const existing = document.getElementById('scoutCompModal');
  if (existing) existing.remove();
  document.body.appendChild(modal);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9B: COACH & SAVE UI (v0.6)                      ║
// ╚══════════════════════════════════════════════════════════╝
function renderCoach() {
  const el = document.getElementById('coachContent');
  if (!el) return;
  const hired = getHiredCoaches();

  // Effect label helper
  const coachEffectHtml = (c) => {
    const SPEC = {
      pw:{label:'パワー育成',short:'PW',icon:'PW',color:'#e74c3c'},
      sp:{label:'スピード育成',short:'SP',icon:'SP',color:'#2ecc71'},
      te:{label:'テクニック育成',short:'TE',icon:'野',color:'#5dade2'},
      st:{label:'スタミナ育成',short:'ST',icon:'ST',color:'#f1c40f'},
      mental:{label:'心身ケア',short:'MNT',icon:'MN',color:'#bb8fce'},
      all:{label:'総合育成',short:'ALL',icon:'ALL',color:'var(--gold)'},
      mq:{label:'試合品質',short:'MQ',icon:'MQ',color:'#e67e22'},
      pop:{label:'人気向上',short:'POP',icon:'POP',color:'#8bc4f0'}
    };
    const s = SPEC[c.specialty] || SPEC.all;
    const val = c.specialty === 'mq' ? `MQ +${c.mqBonus}` :
                c.specialty === 'pop' ? `人気 +${c.popBonus}` :
                c.specialty === 'all' ? `全成長 ×${c.growthMult}` :
                c.specialty === 'mental' ? `回復+${c.condBonus} 怪我-${Math.round((c.injuryReduce||0.5)*100)}%` :
                `${s.short}成長 ×${c.growthMult}`;
    return `<span class="coach-effect ${c.specialty}" style="margin:0">${s.icon} ${val}</span>`;
  };

  // Brief effect explanation
  const coachBrief = (c) => {
    if (c.specialty === 'mq') return '担当選手の試合クオリティが上昇';
    if (c.specialty === 'pop') return '担当選手の人気上昇量が増加';
    if (c.specialty === 'all') return '担当選手の全ステータス成長が加速';
    if (c.specialty === 'mental') return '担当選手の回復促進＆怪我予防';
    const names = {pw:'パワー',sp:'スピード',te:'テクニック',st:'スタミナ'};
    return `担当選手の${names[c.specialty]}成長が大幅加速`;
  };

  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">
    雇用中: ${hired.length}/${MAX_COACHES}名 ｜ スタッフ給与合計: ${getCoachSalaryTotal()}万/週
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
          <div style="margin-top:6px;font-size:12px;color:var(--text-dim)">
            給与: ${c.salary}万/週 ｜ 担当: ${assigned.length}/${COACH_MAX_ASSIGN}名
          </div>`;
      if (assignedChars.length > 0) {
        html += `<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px">`;
        assignedChars.forEach(ch => {
          html += `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:3px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px">${portraitImg(ch.id, 22, '', true)} ${fLink(ch, {source:'roster', size:'12px'})} <strong style="color:var(--gold)">${ov(ch)}</strong></span>`;
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
    available.forEach(c => {
      const fee = c.hireFee || COACH_HIRE_FEE;
      const canHire = G.coaches.length < MAX_COACHES && G.funds >= fee;
      html += `<div class="coach-card">
        <div class="coach-avatar" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;justify-content:center">${coachPortraitImg(c, 48)}</div>
        <div class="coach-info">
          <div class="coach-name" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-size:15px">${c.name} <span style="font-size:11px;color:var(--text-dim)">ℹ️</span></div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${coachEffectHtml(c)}
            <span style="font-size:12px;color:var(--text-sub)">${coachBrief(c)}</span>
          </div>
          <div style="margin-top:5px;font-size:12px;color:var(--text-dim)">雇用費: ${fee}万 ｜ 給与: ${c.salary}万/週</div>
        </div>
        <button class="btn btn-sm" style="background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);color:#2ecc71"
          onclick="hireCoach(${c.id})" ${canHire ? '' : 'disabled'}>${canHire ? `雇用 (${fee}万)` : G.coaches.length >= MAX_COACHES ? '上限' : '資金不足'}</button>
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
  const autoInfo = getAutoSaveInfo();
  html += '<div style="margin-bottom:16px">';
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">⚡ オートセーブ</div>';
  if (autoInfo) {
    html += `<div class="save-slot has-data">
      <div>
        <div class="save-slot-title">オートセーブ</div>
        <div class="save-slot-meta">${autoInfo.season}年目 第${autoInfo.week}週 ｜ 資金${autoInfo.funds.toLocaleString()}万 ｜ ${new Date(autoInfo.date).toLocaleString('ja-JP')}</div>
      </div>
      <button class="btn btn-blue btn-sm" onclick="showConfirm('オートセーブからロードしますか？\\n現在の進行は失われます。','ロード',()=>{loadAutoSave();refreshAll()})">ロード</button>
    </div>`;
  } else {
    html += '<div class="save-slot"><div class="save-slot-info">オートセーブデータなし（週を進めると自動保存されます）</div></div>';
  }
  html += '</div>';

  // Manual save slots
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">💾 手動セーブスロット</div>';
  for (let i = 1; i <= SAVE_SLOTS; i++) {
    const info = getSaveInfo(i);
    if (info) {
      html += `<div class="save-slot has-data">
        <div>
          <div class="save-slot-title">スロット ${i}</div>
          <div class="save-slot-meta">${info.season}年目 第${info.week}週 ｜ 資金${info.funds.toLocaleString()}万 ｜ 人気${Engine.util.dispOrgPop(info.orgPop)} ｜ 所属${info.rosterSize}名</div>
          <div class="save-slot-meta">${new Date(info.date).toLocaleString('ja-JP')} ｜ v${info.version}</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-gold btn-sm" onclick="showConfirm('スロット${i}に上書きセーブしますか？','セーブ',()=>saveGame(${i}))">セーブ</button>
          <button class="btn btn-blue btn-sm" onclick="showConfirm('スロット${i}からロードしますか？\\n現在の進行は失われます。','ロード',()=>loadGame(${i}))">ロード</button>
          <button class="btn btn-red btn-sm" onclick="showConfirm('スロット${i}のデータを削除しますか？','削除',()=>deleteSave(${i}))">削除</button>
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

  // Settings: Org name change
  html += `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">⚙️ 設定</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <label style="color:var(--text-sub);font-size:12px;white-space:nowrap">🏢 団体名:</label>
      <input id="settingsOrgName" type="text" value="${G.orgName || 'プレイヤー団体'}" maxlength="20"
        style="flex:1;max-width:240px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:13px;font-weight:700"
        placeholder="団体名を入力">
      <button class="btn btn-gold btn-sm" onclick="const v=document.getElementById('settingsOrgName').value.trim();if(v){G={...G,orgName:v};refreshAll();Audio.play('stamp')}">変更</button>
    </div>
  </div>`;

  // New game button
  html += `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
    <button class="btn btn-red" onclick="showConfirm('本当にニューゲームを開始しますか？\\n現在の進行は失われます。','ニューゲーム',()=>{location.reload()})">🔄 ニューゲーム</button>
  </div>`;

  el.innerHTML = html;
}

function renderFacility() {
  const el = document.getElementById('facilityContent');
  if (!el) return;
  let html = '';

  // Active effects summary
  const effects = [];
  if (getFacilityLevel('training') > 1) effects.push(`🏋️ 成長+${Math.round((getFacilityGrowthMult()-1)*100)}%`);
  if (getFacilityLevel('medical') > 1) effects.push(`🏥 怪我-${getFacilityInjuryReduction()}週`);
  if (getFacilityLevel('media') > 1) effects.push(`📺 プロモ+${getFacilityPromoBonus()}`);
  if (getFacilityLevel('dormitory') > 1) effects.push(`🏠 回復+${getFacilityConditionBonus()}`);
  if (getFacilityLevel('scouting') > 1) effects.push(`🔍 契約金-${getFacilityScoutDiscount()}%`);

  if (effects.length > 0) {
    html += '<div class="facility-summary">';
    effects.forEach(e => html += `<span class="facility-tag">${e}</span>`);
    html += '</div>';
  }

  const totalMaint = getFacilityMaintenance();
  if (totalMaint > 0) {
    html += `<div style="font-size:12px;color:var(--text-sub);margin-bottom:16px">施設維持費合計: <span style="color:var(--red)">-${totalMaint}万/週</span></div>`;
  }

  // Facility cards
  FACILITIES.forEach(f => {
    const currentLv = getFacilityLevel(f.id);
    html += `<div class="facility-card">`;
    html += `<div class="facility-header"><span class="facility-emoji">${f.emoji}</span><span class="facility-name">${f.name}</span><span style="color:var(--gold);font-size:12px;margin-left:auto">Lv.${currentLv}/${f.levels.length}</span></div>`;

    html += '<div class="facility-level-bar">';
    f.levels.forEach((lv, i) => {
      const lvNum = i + 1;
      const isCurrent = lvNum === currentLv;
      const isNext = lvNum === currentLv + 1;
      const isPast = lvNum < currentLv;
      const canAfford = isNext && G.funds >= lv.cost;
      let cls = 'facility-lv';
      if (isCurrent) cls += ' current';
      else if (isNext && canAfford) cls += ' available';
      else if (!isPast) cls += ' locked';
      else cls += ' current'; // past levels also gold

      html += `<div class="${cls}" ${isNext && canAfford ? `onclick="showConfirm('${f.name}をLv${lvNum}【${lv.name}】にアップグレードしますか？\\n費用: ${lv.cost}万 / 維持費: +${lv.maint}万/週','アップグレード',()=>upgradeFacility('${f.id}'))"` : ''}>`;
      html += `<div class="facility-lv-name">${isPast || isCurrent ? '✓ ' : ''}Lv.${lvNum} ${lv.name}</div>`;
      html += `<div class="facility-lv-desc">${lv.desc}</div>`;
      if (lvNum > 1 && !isPast && !isCurrent) {
        html += `<div class="facility-lv-cost">💰 ${lv.cost}万</div>`;
        html += `<div class="facility-lv-maint">維持費 +${lv.maint}万/週</div>`;
      }
      if (isCurrent) html += '<div style="font-size:11px;color:var(--gold);margin-top:2px">◆ 現在</div>';
      html += '</div>';
    });
    html += '</div></div>';
  });

  html += `<div style="font-size:11px;color:var(--text-dim);margin-top:12px">💡 アップグレードは即時反映されます。維持費は毎週発生します。</div>`;
  el.innerHTML = html;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9D: TRAINING SCREEN (v0.8)                      ║
// ╚══════════════════════════════════════════════════════════╝

function toggleIntensive(charId) {
  const c = G.roster.find(r => r.id === charId);
  if (!c) return;
  c.intensive = !c.intensive;
  renderTraining();
}

function changeCoachAssign(charId, newCoachId) {
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

function toggleTrainDetail(charId) {
  const panel = document.getElementById(`train-detail-${charId}`);
  if (!panel) return;
  panel.classList.toggle('open');
}

function getGrowthTendency(charId) {
  const coach = getCharCoach(charId);
  const stats = ['pw','sp','te','st','mn'];
  const labels = {pw:'PW',sp:'SP',te:'TE',st:'ST',mn:'MN'};
  if (!coach) return {text: '均等', arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'eq', arrow: '→'}))};
  if (coach.specialty === 'all') return {text: '全体強化', arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'up1', arrow: '↑'}))};
  if (['mq','pop','mental'].includes(coach.specialty)) return {text: coach.specialty === 'mq' ? 'MQ強化' : coach.specialty === 'pop' ? 'POP強化' : '心身ケア', arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'eq', arrow: '→'}))};
  return {
    text: `${coach.specialty.toUpperCase()}重視`,
    arrows: stats.map(s => s === coach.specialty
      ? {stat: s, label: labels[s], cls: 'up2', arrow: '↑↑'}
      : {stat: s, label: labels[s], cls: 'up1', arrow: '↑'})
  };
}

function renderTraining() {
  const el = document.getElementById('trainingContent');
  if (!el) return;
  const hired = getHiredCoaches();
  let html = '';

  // === Coach Summary ===
  if (hired.length > 0) {
    html += '<div class="train-coach-summary">';
    html += '<div style="font-size:11px;font-weight:700;color:#2ecc71;margin-bottom:6px">🎓 コーチ陣</div>';
    hired.forEach(c => {
      const assigned = getCoachAssignees(c.id);
      const effectLabel = c.specialty === 'all' ? `全ステ×${c.growthMult}` :
        c.specialty === 'mq' ? `MQ+${c.mqBonus}` :
        c.specialty === 'pop' ? `人気+${c.popBonus}` :
        c.specialty === 'mental' ? `回復+${c.condBonus} 怪我-${Math.round((c.injuryReduce||0.5)*100)}%` :
        `${c.specialty.toUpperCase()}×${c.growthMult}`;
      html += `<div class="train-coach-row" onclick="event.stopPropagation();showCoachTooltip(${c.id})" style="cursor:pointer">
        <span style="display:inline-flex;align-items:center;gap:6px">${coachPortraitImg(c, 36)} <span style="text-decoration:underline dotted;text-underline-offset:3px">${c.name}</span></span>
        <span style="font-size:12px;color:var(--gold);font-weight:700;margin-left:6px">[${effectLabel}]</span>
        <span class="coach-slots">担当 ${assigned.length}/${COACH_MAX_ASSIGN}</span>
        <span style="font-size:12px;color:var(--text-dim);margin-left:auto">ℹ️</span>
      </div>`;
    });
    // Tendency summary
    const specCoaches = hired.filter(c => ['pw','sp','te','st'].includes(c.specialty));
    if (specCoaches.length > 0) {
      const tendencyParts = specCoaches.map(c => `${c.specialty.toUpperCase()}重視`);
      html += `<div class="train-tendency">→ 育成傾向: <strong>${tendencyParts.join('＋')}</strong></div>`;
    }
    html += '</div>';
  } else {
    html += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.03);border-radius:6px">🎓 コーチ未雇用 — <span style="color:var(--gold);cursor:pointer;text-decoration:underline" onclick="showScreen(\'coach\')">スタッフ室</span>から雇用してください</div>';
  }

  // === Roster Training List ===
  const canManage = G.weekPhase === 'manage';
  html += '<div style="margin-top:8px">';
  html += '<div class="train-row train-row-header"><span>選手</span><span>総合</span><span>体調</span><span>担当コーチ</span><span>成長傾向</span><span>⚡追込</span></div>';

  G.roster.forEach(c => {
    // D-1: Skip rental fighters in training (rental=試合のみ)
    if (c.isRental) return;
    const coach = getCharCoach(c.id);
    const tendency = getGrowthTendency(c.id);
    const condPct = c.condition;
    const condCls = condPct > 66 ? 'high' : condPct > 33 ? 'mid' : 'low';
    const isInjured = !!c.injury;
    const isResting = c.condition <= 30;
    const canIntensive = canManage && !isInjured && !isResting && c.condition >= GROWTH_CONFIG.intensiveMinCond && c.intensiveWeeks < GROWTH_CONFIG.intensiveMaxConsec;
    const champBadge = G.titles.world.championId === c.id ? ' 👑' : '';
    const potPct = getPotentialPct(c);

    // Coach name display
    let coachDisplay = '<span style="color:var(--text-dim);font-size:12px">---</span>';
    if (coach) {
      coachDisplay = `<span style="font-size:12px;cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px;display:inline-flex;align-items:center;gap:2px" onclick="event.stopPropagation();showCoachTooltip(${coach.id})">${coachPortraitImg(coach, 16)}${coach.name.replace(/コーチ|トレーナー|道場長|師範|アドバイザー|セコンド|マネージャー/g,'').substring(0,3)}</span>`;
    }

    // Growth tendency arrows
    let arrowHtml = '';
    if (isInjured) {
      arrowHtml = '<span style="font-size:12px;color:#e17055">療養中</span>';
    } else if (isResting) {
      arrowHtml = '<span style="font-size:12px;color:#3498db">休養中</span>';
    } else {
      arrowHtml = tendency.arrows.map(a =>
        `<span class="train-growth-arrow ${a.cls}" title="${a.label}">${a.arrow}</span>`
      ).join('');
    }

    // Intensive button
    let intBtn = '';
    if (isInjured || isResting) {
      intBtn = '<span style="font-size:12px;color:var(--text-dim)">--</span>';
    } else if (!canManage) {
      intBtn = c.intensive ? '<span style="font-size:12px;color:#ffa500">⚡ON</span>' : '';
    } else {
      const warnTitle = c.intensiveWeeks >= GROWTH_CONFIG.intensiveMaxConsec ? '連続上限' : c.condition < GROWTH_CONFIG.intensiveMinCond ? '体調不足' : '';
      intBtn = `<button class="btn-intensive${c.intensive?' active':''}" onclick="toggleIntensive(${c.id})" ${canIntensive || c.intensive ? '' : `disabled title="${warnTitle}"`}>⚡</button>`;
    }

    const rowOpacity = isInjured ? ' style="opacity:0.55"' : '';
    html += `<div class="train-row"${rowOpacity} onclick="toggleTrainDetail(${c.id})" style="cursor:pointer${isInjured?';opacity:0.55':''}">
      <span style="display:inline-flex;align-items:center;gap:8px">${portraitImg(c.id, 80, '', true)} ${fLink(c, {source:'roster', size:'15px'})}${champBadge}</span>
      <span class="num" style="font-size:15px;font-weight:700">${ov(c)}</span>
      <span><div class="cond-bar" style="width:50px"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div> <span style="font-size:12px">${condPct}</span></span>
      <span>${coachDisplay}</span>
      <span>${arrowHtml}</span>
      <span onclick="event.stopPropagation()">${intBtn}</span>
    </div>`;

    // Detail panel (hidden by default)
    const stats = ['pw','sp','te','st','mn'];
    const statLabels = {pw:'PW',sp:'SP',te:'TE',st:'ST',mn:'MN'};
    html += `<div class="detail-panel" id="train-detail-${c.id}">`;
    // Stat bars - use trainCap for bar width but hide exact values
    stats.forEach(s => {
      const current = Math.round(c[s]);
      const cap = c.trainCap ? c.trainCap[s] : c.pot[s];
      const pct = Math.round(current / cap * 100);
      const sg = Math.round((c.seasonGrowth && c.seasonGrowth[s]) || 0);
      const atCap = current >= cap;
      // Growth room label (vague)
      const roomLabel = atCap ? '<span style="color:var(--gold);font-size:11px">MAX</span>'
        : pct >= 85 ? '<span style="color:#e74c3c;font-size:11px">残僅か</span>'
        : pct >= 60 ? '<span style="color:#f39c12;font-size:11px">成長中</span>'
        : '<span style="color:#2ecc71;font-size:11px">伸びしろ大</span>';
      html += `<div class="stat-bar-wrap">
        <span class="stat-bar-label">${statLabels[s]}</span>
        <div class="stat-bar-bg"><div class="stat-bar-fill ${s}" style="width:${Math.min(100,pct)}%"></div></div>
        <span class="stat-bar-val">${current} ${roomLabel}${sg > 0 ? ` <span style="color:#2ecc71;font-weight:700">+${sg}</span>` : ''}</span>
      </div>`;
    });
    // Coach assign dropdown
    if (canManage) {
      html += `<div style="margin-top:8px;font-size:11px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <label style="color:var(--text-dim)">担当コーチ: </label>
        <select onchange="changeCoachAssign(${c.id}, Number(this.value))" style="font-size:11px;padding:3px"${isInjured?' disabled':''}>
          <option value="0"${!coach?' selected':''}>--- なし ---</option>`;
      hired.forEach(h => {
        const aCount = getCoachAssignees(h.id).length;
        const isCurrent = coach && coach.id === h.id;
        const isFull = aCount >= COACH_MAX_ASSIGN && !isCurrent;
        const effShort = h.specialty === 'all' ? `全×${h.growthMult}` : h.specialty === 'mq' ? `MQ+${h.mqBonus}` : h.specialty === 'pop' ? `人気+${h.popBonus}` : h.specialty === 'mental' ? `回復+${h.condBonus}` : `${h.specialty.toUpperCase()}×${h.growthMult}`;
        html += `<option value="${h.id}"${isCurrent?' selected':''}${isFull?' disabled':''}>${h.emoji} ${h.name} [${effShort}] (${aCount}/${COACH_MAX_ASSIGN})${isFull?' [満]':''}</option>`;
      });
      html += '</select>';
      if (coach) {
        html += `<span onclick="event.stopPropagation();showCoachTooltip(${coach.id})" style="cursor:pointer;font-size:12px;color:var(--text-dim);text-decoration:underline dotted">ℹ️ 詳細</span>`;
      }
      html += '</div>';
      // Show current coach effect hint
      if (coach) {
        const effDesc = coach.specialty === 'mq' ? `試合MQ +${coach.mqBonus}` : coach.specialty === 'pop' ? `人気上昇 +${coach.popBonus}` : coach.specialty === 'all' ? `全成長 ×${coach.growthMult}` : coach.specialty === 'mental' ? `回復+${coach.condBonus} 怪我-${Math.round((coach.injuryReduce||0.5)*100)}%` : `${coach.specialty.toUpperCase()}成長 ×${coach.growthMult}`;
        html += `<div style="margin-top:3px;font-size:12px;color:var(--text-dim)">└ 効果: <span style="color:var(--gold)">${effDesc}</span></div>`;
      }
    } else if (coach) {
      html += `<div style="margin-top:6px;font-size:12px;color:var(--text-dim);display:flex;align-items:center;gap:4px">担当: <span onclick="event.stopPropagation();showCoachTooltip(${coach.id})" style="cursor:pointer;text-decoration:underline dotted;display:inline-flex;align-items:center;gap:3px">${coachPortraitImg(coach, 16)} ${coach.name}</span></div>`;
    }
    html += '</div>';
  });
  html += '</div>';

  // === Season Growth Log ===
  const growthEntries = G.roster.filter(c => {
    const sg = c.seasonGrowth || {};
    return sg && Object.values(sg).some(v => v > 0);
  });
  if (growthEntries.length > 0) {
    html += '<div class="train-season-log">';
    html += '<div style="font-weight:700;color:var(--gold);margin-bottom:4px">📈 今シーズン成長</div>';
    growthEntries.forEach(c => {
      const parts = [];
      ['pw','sp','te','st','mn'].forEach(s => {
        const v = Math.round(((c.seasonGrowth && c.seasonGrowth[s]) || 0) * 10) / 10;
        if (v > 0) parts.push(`<span style="color:#2ecc71">${s.toUpperCase()}+${v}</span>`);
      });
      if (parts.length > 0) html += `<div>${fLink(c, {source:'roster', size:'11px'})}: ${parts.join(' ')}</div>`;
    });
    html += '</div>';
  }

  // Intensive training info
  html += '<div style="font-size:12px;color:var(--text-dim);margin-top:8px">⚡ 強化練習: 成長×1.5 / 体調消耗2倍 / 8%で練習負傷 / 最大2週連続</div>';

  el.innerHTML = html;
}

function refreshAll() {
  refreshTopBar();
  renderWeekScreen();
  renderRoster();
  renderScout();
  renderShowPrep();
  renderFinance();
  renderLog();
  renderCoach();
  renderTraining();
  renderFacility();
  renderSave();
  renderRanking();
  // F2: Show negotiation result popup if pending
  if (G.negotiationResult) {
    setTimeout(() => showNegotiationResult(), 300);
  }
}

