// v1.9: Roster sort state
let _rosterSortKey = 'ovr';
function setRosterSort(key) { _rosterSortKey = key; renderRoster(); }

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
  // Hide nav during draft
  const navBar = document.querySelector('.nav-bar');
  if (navBar) navBar.style.display = (G.weekPhase === 'draft') ? 'none' : '';
  const dateEl = document.getElementById('dispDate');
  if (dateEl) {
    if (G.offSeason) {
      dateEl.textContent = `${G.season}年目 オフシーズン ${G.offWeek || 0}/4`;
    } else {
      dateEl.textContent = Engine.util.formatDate(G.season, G.week);
    }
  }
  const fundsEl = document.getElementById('dispFunds');
  fundsEl.textContent = `${G.funds.toLocaleString()}万`;
  fundsEl.className = `info-val ${G.funds >= 0 ? 'positive' : 'negative'}`;
  document.getElementById('dispPop').textContent = Engine.util.dispOrgPop(G.orgPop);
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
  document.getElementById('weekTitle').textContent = G.offSeason ? `オフシーズン ${G.offWeek}/4 — ${typeLabel}` : `${Engine.util.formatDate(G.season, G.week)} — ${typeLabel}`;

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
    if (!isPPV(G.week)) {
      if (isSpecialShow(G.week)) upcomingItems.push('⭐ 今週は特別興行！（試合枠+1）');
      else { const spW = (() => { for (let w = G.week+1; w <= 48; w++) if (isSpecialShow(w) && !isPPV(w)) return w; return null; })(); if (spW) upcomingItems.push(`⭐ 特別興行: 第${spW}週`); }
    }
    if (G.pendingNegotiation) {
      const remainW = G.pendingNegotiation.resolveWeek - G.week;
      upcomingItems.push(`🤝 交渉中: ${G.pendingNegotiation.fighterName}（残${remainW}週）`);
    }

    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <!-- Season Progress -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;color:var(--gold);font-weight:700">${Engine.util.formatDate(G.season, G.week)}</span>
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
    const _cycleNum = Math.ceil(G.week / 4);
    const _monthStart = (_cycleNum - 1) * 4 + 1;
    const manageBuf = (G.financeHistory || []).filter(h => h.season === G.season && h.week >= _monthStart && h.week < G.week);
    if (manageBuf.length > 0) {
      let mIncome = 0, mExpense = 0;
      manageBuf.forEach(e => { mIncome += (e.income || 0); mExpense += (e.expense || 0); });
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
          💡 黒字転換達成！ この調子で${4 - (G.survivalProfitStreak || 0)}週間黒字を維持すればクリア！（現在の資金: ${G.funds.toLocaleString()}万${G.funds < 3000 ? ` / 目標3,000万` : ''}）
        </div>`;
      }

      html += '</div></div>'; // .survival-body, .survival-panel
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
    </div>`;
    html += `<p style="margin-bottom:12px;color:var(--text-sub)">選手の週間スケジュールを確認し、${isShow ? '興行準備に進んでください' : '週を進めてください'}。</p>`;

    // v1.0: Primary action buttons — top-left, large, prominent
    html += '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">';
    if (isShow) {
      html += '<button class="btn btn-gold" onclick="startShowPrep()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">🎤 興行準備へ →</button>';
    } else {
      html += '<button class="btn btn-gold" onclick="doProcessWeek()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">⏩ 週を処理</button>';
    }
    html += '<button class="btn" onclick="App.autoManage()" style="font-size:14px;padding:10px 20px;background:rgba(46,204,113,0.12);color:#2ecc71;border:1px solid rgba(46,204,113,0.3);font-weight:600" title="体調に応じてスケジュールを自動設定します（確認後に手動で進めてください）">🤖 おまかせ</button>';
    html += `<button class="btn" onclick="App.openCareModal()" style="font-size:14px;padding:10px 20px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-weight:600" title="選手・団体への資金投入アクション">💝 ケア</button>`;
    html += '</div>';

    // Roster schedule overview
    const canManageWeek = G.weekPhase === 'manage';
    html += '<table class="data-table"><tr><th>名前</th><th>総合</th><th>体調</th><th>状態</th><th>スケジュール</th><th>⚡</th><th>今週の行動</th></tr>';
    G.roster.forEach(c => {
      const condPct = c.condition;
      const condCls = condPct > 66 ? 'high' : condPct > 33 ? 'mid' : 'low';
      const actionLabels = {practice:'練習',promo:'プロモ',rest:'休養',balance:'バランス','療養':'療養',intensive:'⚡強化'};
      const statusHtml = c.injury
        ? `<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(214,48,49,0.15);color:${c.injury.color};border:1px solid ${c.injury.color}40">${c.injury.type} ${c.injury.weeksLeft}週</span>`
        : c.forcedRest
          ? '<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(52,152,219,0.15);color:#3498db;border:1px solid rgba(52,152,219,0.4)">🛌 休養中</span>'
          : '<span style="font-size:12px;color:#2ecc71">健康</span>';
      const schedDisabled = c.injury ? 'disabled' : '';
      const wkChampBadge = G.titles.world.championId === c.id ? ' <span style="color:var(--gold);font-size:12px">👑</span>' : '';
      // Intensive button for week screen
      const isInjured = !!c.injury;
      const isResting = c.condition <= 30;
      const canInt = canManageWeek && !isInjured && !isResting && c.condition >= GROWTH_CONFIG.intensiveMinCond && c.intensiveWeeks < GROWTH_CONFIG.intensiveMaxConsec;
      let intBtnHtml = '';
      if (isInjured || isResting) {
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
      else if (c.intensive) previewAction = 'intensive';
      else {
        previewAction = c.schedule || 'balance';
        if (previewAction === 'balance') previewAction = isShow ? 'promo' : 'practice';
        if (c.condition <= 30) previewAction = 'rest';
      }
      const previewLabel = actionLabels[previewAction] || previewAction;
      html += `<tr${c.injury ? ' style="opacity:0.65"' : ''}>
        <td><strong>${c.name}</strong>${wkChampBadge}</td>
        <td class="num">${ov(c)}</td>
        <td><div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div> ${condPct}</td>
        <td>${statusHtml}</td>
        <td>
          <select onchange="updateSchedulePreview(${c.id},this.value)" style="font-size:15px;padding:8px 12px;border-radius:6px;min-width:120px" ${schedDisabled}>
            <option value="balance" ${c.schedule==='balance'?'selected':''}>バランス</option>
            <option value="practice" ${c.schedule==='practice'?'selected':''}>練習優先</option>
            <option value="promo" ${c.schedule==='promo'?'selected':''}>プロモ優先</option>
            <option value="rest" ${c.schedule==='rest'?'selected':''}>休養重視</option>
          </select>
        </td>
        <td>${intBtnHtml}</td>
        <td id="action-${c.id}"><span class="sched-tag ${previewAction}">${previewLabel}</span></td>
      </tr>`;
    });
    html += '</table>';
  }
  else if (G.weekPhase === 'weekSummary') {
    // v2.0-C3: Brief weekly summary — non-month-end weeks stop here
    const dateStr = G.offSeason ? `オフシーズン ${G.offWeek}/4` : Engine.util.formatDate(G.season, G.week);
    document.getElementById('weekTitle').textContent = `${dateStr} — 完了`;
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
      <span>収入 <span style="color:var(--green);font-weight:600">+${wsIncome.toLocaleString()}万</span></span>
      <span>支出 <span style="color:var(--red);font-weight:600">-${wsExpense.toLocaleString()}万</span></span>
      <span>収支 <span style="color:${netColor};font-weight:600">${wsNet>=0?'+':''}${wsNet.toLocaleString()}万</span></span>
    </div>`;
    html += `<div style="font-size:15px">残高: <strong style="color:${G.funds>=0?'var(--green)':'var(--red)'}">${G.funds.toLocaleString()}万</strong></div>`;
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

    // v1.0: Aggregate monthly finance from financeHistory
    const monthlyDetails = {};
    let monthIncome = 0, monthExpense = 0;
    monthBuf.forEach(entry => {
      if (!entry.details) return;
      entry.details.forEach(d => {
        // 興行固有項目（チケット・会場費）は会場/動員が異なるためラベル全体をキーに保持
        const isShowSpecific = d.label.startsWith('チケット収入') || d.label.startsWith('会場費');
        const key = isShowSpecific ? d.label : d.label.replace(/（.*?）/g, '').replace(/\d+人/g, '').trim();
        if (!monthlyDetails[key]) monthlyDetails[key] = { label: d.label, val: 0, type: d.type, count: 0 };
        monthlyDetails[key].val += d.val;
        monthlyDetails[key].count++;
        monthlyDetails[key].label = d.label;
      });
      monthIncome += (entry.income || 0);
      monthExpense += (entry.expense || 0);
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
    }

    if (G.funds <= -1000) {
      html += '<div style="margin-top:12px;padding:12px;background:rgba(196,30,58,0.2);border:1px solid var(--red);border-radius:4px;text-align:center"><strong style="color:var(--red);font-size:18px">💀 GAME OVER — 倒産</strong></div>';
    } else {
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn btn-gold" style="font-size:16px;padding:12px 28px;font-weight:700" onclick="advanceWeek()">次の月へ →</button></div>';
    }
  }
  // ── C-4: TRANSFER WINDOW UI ──
  else if (G.weekPhase === 'transfer') {
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} — 🔄 移籍ウィンドウ`;
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
      document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} — ⚔ 対抗戦`;
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
      document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} — 🏆 頂上決戦`;
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
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} — 🏟️ PPV GRAND FINAL`;
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
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} — 🏟️ PPV GRAND FINAL`;
    html += `<div style="text-align:center;padding:24px">
      <div style="color:var(--gold);font-size:18px;margin-bottom:16px">PPV GRAND FINAL「${G.ppvName || 'GRAND FINAL'}」開催日！</div>
      <button class="btn btn-gold" style="padding:12px 32px;font-size:15px" onclick="App.initPPVShow()">🏟️ PPV カードを表示</button>
    </div>`;
  }
  // ── PPV TV PHASE ──
  else if (G.weekPhase === 'ppvTV') {
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} — 📺 PPV テレビ中継`;
    html += `<div style="text-align:center;padding:24px">
      <div style="color:var(--text-sub);font-size:16px;margin-bottom:16px">📺 PPV GRAND FINAL テレビ中継中…</div>
      <button class="btn btn-blue" style="padding:10px 24px;font-size:14px" onclick="App.initPPVTV()">📺 テレビ中継を見る</button>
    </div>`;
  }

  // ── SCOUT EVENT PHASE ──
  else if (G.weekPhase === 'scoutEvent') {
    const weekLabel = G.offSeason ? `オフシーズン第${G.offWeek}週` : Engine.util.formatDate(G.season, G.week);
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
    const available = G.roster.filter(c => !c.injury);
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

  html += '</div>'; // .dojo-header 閉じ

  // コーチ特性（バナー外に残す）
  if (hired.length > 0) {
    const traitParts = hired.map(c => c.trait);
    html += `<div class="train-tendency" style="margin-bottom:8px">→ コーチ特性: <strong>${traitParts.join('、')}</strong></div>`;
  }
  el.innerHTML = html;

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

function _renderRosterTrainingPanel(c, hired) {
  const coach = getCharCoach(c.id);
  const isInjured = !!c.injury;
  const canManage = G.weekPhase === 'manage';
  const stats = ['pw','sp','te','st','mn'];
  const statLabels = {pw:'PW',sp:'SP',te:'TE',st:'ST',mn:'MN'};
  let html = `<div class="detail-panel" id="roster-detail-${c.id}">`;
  // Stat bars
  stats.forEach(s => {
    const current = Math.round(c[s]);
    const cap = c.trainCap ? c.trainCap[s] : c.pot[s];
    const pct = Math.round(current / cap * 100);
    const sg = Math.round((c.seasonGrowth && c.seasonGrowth[s]) || 0);
    const atCap = current >= cap;
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
      const effShort = `${h.grade}級 ×${COACH_RANKS[h.teaching]||1.0}`;
      const sm = getCoachStyleMatch(h, c);
      const matchTag = sm.icon ? ` ${sm.icon}${sm.label}` : '';
      html += `<option value="${h.id}"${isCurrent?' selected':''}${isFull?' disabled':''}>${h.emoji} ${h.name} [${effShort}]${matchTag} (${aCount}/${COACH_MAX_ASSIGN})${isFull?' [満]':''}</option>`;
    });
    html += '</select>';
    if (coach) {
      html += `<span onclick="event.stopPropagation();showCoachTooltip(${coach.id})" style="cursor:pointer;font-size:12px;color:var(--text-dim);text-decoration:underline dotted">ℹ️ 詳細</span>`;
    }
    html += '</div>';
    if (coach) {
      const mult = COACH_RANKS[coach.teaching] || 1.0;
      const sm = getCoachStyleMatch(coach, c);
      const matchHtml = sm.icon ? `<span class="coach-match-badge ${sm.cls}">${sm.icon}${sm.label}+${sm.bonus}</span>` : '<span class="coach-match-badge none">不一致</span>';
      const effDesc = `成長×${mult} <span class="badge badge-${coach.style}" style="font-size:10px;padding:1px 5px">${coach.style}</span> ${matchHtml} ${coach.trait}`;
      html += `<div style="margin-top:3px;font-size:12px;color:var(--text-dim)">└ 効果: <span style="color:var(--gold)">${effDesc}</span></div>`;
    }
  } else if (coach) {
    html += `<div style="margin-top:6px;font-size:12px;color:var(--text-dim);display:flex;align-items:center;gap:4px">担当: <span onclick="event.stopPropagation();showCoachTooltip(${coach.id})" style="cursor:pointer;text-decoration:underline dotted;display:inline-flex;align-items:center;gap:3px">${coachPortraitImg(coach, 16)} ${coach.name}</span></div>`;
  }
  html += '</div>';
  return html;
}

function _renderRosterGrowthLog() {
  const el = document.getElementById('rosterGrowthLog');
  if (!el) return;
  const growthEntries = G.roster.filter(c => {
    const sg = c.seasonGrowth || {};
    return sg && Object.values(sg).some(v => v > 0);
  });
  if (growthEntries.length > 0) {
    let html = '<div class="panel" style="margin-top:12px"><div class="train-season-log">';
    html += '<div style="font-weight:700;color:var(--gold);margin-bottom:4px">📈 今シーズン成長</div>';
    growthEntries.forEach(c => {
      const parts = [];
      ['pw','sp','te','st','mn'].forEach(s => {
        const v = Math.round(((c.seasonGrowth && c.seasonGrowth[s]) || 0) * 10) / 10;
        if (v > 0) parts.push(`<span style="color:#2ecc71">${s.toUpperCase()}+${v}</span>`);
      });
      if (parts.length > 0) html += `<div>${fLink(c, {source:'roster', size:'11px'})}: ${parts.join(' ')}</div>`;
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
      const mult = COACH_RANKS[c.teaching] || 1.0;
      return `${c.grade}級 ×${mult} <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>`;
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
            const sm = getCoachStyleMatch(c, ch);
            const matchIcon = sm.icon ? `<span style="font-weight:700;color:${sm.cls==='specialist'?'#2ecc71':'#f1c40f'}">${sm.icon}</span>` : '';
            staffHtml += `<span class="coach-match-chip ${sm.cls}">${portraitImg(ch.id, 20, '', true)} ${ch.name.substring(0,4)}${matchIcon}</span>`;
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
      staffHtml += `<div style="text-align:center;padding:16px;color:var(--text-dim);font-size:12px">コーチ未雇用 — <span style="color:var(--gold);cursor:pointer;text-decoration:underline" onclick="showScreen('coach')">スタッフ募集</span>から雇用できます</div>`;
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
  ].map(s => `<button onclick="setRosterSort('${s.key}')" style="font-size:11px;padding:3px 10px;border-radius:3px;cursor:pointer;border:1px solid ${_rosterSortKey===s.key ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.08)'};background:${_rosterSortKey===s.key ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)'};color:${_rosterSortKey===s.key ? 'var(--gold)' : 'var(--text-dim)'}">${s.label}</button>`).join('');
  let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:11px;color:var(--text-dim)">並び順:</span>${sortBtns}</div>`;
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
  const rosterCap = G.rosterCap || 6;
  const isFull = ownFighters.length >= rosterCap;
  html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">
    <span style="font-size:13px;color:var(--text-sub)">所属選手</span>
    <span style="font-size:15px;font-weight:700;color:var(--text)">${ownFighters.length}/${rosterCap}名</span>
    ${isFull ? '<span style="font-size:12px;color:var(--text-dim)">（上限）</span>' : ''}
  </div>` + html;
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
    // Growth tendency arrows (inline in card)
    const tendency = c.isRental ? null : getGrowthTendency(c.id);
    const coachOfChar = c.isRental ? null : getCharCoach(c.id);
    let tendencyHtml = '';
    if (tendency && !c.injury) {
      tendencyHtml = `<span style="font-size:11px;margin-left:4px;letter-spacing:-1px">${tendency.arrows.map(a =>
        `<span class="train-growth-arrow ${a.cls}" title="${a.label}">${a.arrow}</span>`
      ).join('')}</span>`;
    }
    // Coach badge in card (with style match indicator)
    let coachBadgeHtml = '';
    if (coachOfChar) {
      const sm = getCoachStyleMatch(coachOfChar, c);
      const matchIcon = sm.icon ? `<span style="font-weight:700">${sm.icon}</span>` : '';
      coachBadgeHtml = `<span class="coach-match-badge ${sm.cls}" style="display:inline-flex;align-items:center;gap:2px">${coachPortraitImg(coachOfChar, 12)}${coachOfChar.name.split(' ')[0]}${matchIcon}</span>`;
    }
    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px${c.injury ? ';opacity:0.75' : ''}${!c.isRental ? ';cursor:pointer' : ''}" ${!c.isRental ? `onclick="toggleRosterDetail(${c.id})"` : ''}>
      <div style="display:flex;align-items:center;gap:10px;padding:8px 10px">
        <div onclick="event.stopPropagation();showFighterPopup(${c.id},'roster')" style="cursor:pointer;flex-shrink:0">
          ${portraitImg(c.id, 56, '', true)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
            <span onclick="event.stopPropagation()">${fLink(c, {source:'roster', size:'13px'})}</span>${champBadge}${rentalBadge}
            <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>
            <span class="badge badge-${roleCls}" style="font-size:10px;padding:1px 5px">${c.role}</span>
            ${coachBadgeHtml}
            ${injuryBadge}${wearBadge}${growthPenaltyBadge}${hotStreakBadge}${slumpBadge}${motivLossBadge}
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-sub)">
            <span style="font-size:17px;font-weight:900;color:var(--gold)">${ov(c)}</span>
            <span>PW<b style="color:var(--text)">${Math.round(c.pw)}</b>${statG('pw')}</span>
            <span>SP<b style="color:var(--text)">${Math.round(c.sp)}</b>${statG('sp')}</span>
            <span>TE<b style="color:var(--text)">${Math.round(c.te)}</b>${statG('te')}</span>
            <span>ST<b style="color:var(--text)">${Math.round(c.st)}</b>${statG('st')}</span>
            <span>MN<b style="color:var(--text)">${Math.round(c.mn)}</b>${statG('mn')}</span>
            ${tendencyHtml}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;font-size:11px;color:var(--text-sub)">
          <div>人気 <b style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</b></div>
          <div style="display:flex;align-items:center;gap:3px;margin-top:2px"><div style="width:40px;height:4px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="width:${condPct}%;height:100%;background:${condCls};border-radius:3px"></div></div><span style="font-size:10px">${condPct}</span></div>
          <div style="margin-top:2px;color:var(--text-dim)">${getSalary(c)}万</div>
          ${!c.isRental ? `<span style="font-size:10px;color:var(--text-dim);margin-top:2px;display:block">▼ 育成</span>` : ''}
        </div>
      </div>
      ${!c.isRental ? _renderRosterTrainingPanel(c, hired) : ''}
    </div>`;
  });
  html += '</div>';
  // ── Rental fighters separated section ──
  if (rentalFighters.length > 0) {
    const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownFighters.length);
    html += `<div class="panel-title" style="font-size:14px;margin-top:16px;color:#f39c12">🤝 レンタル枠（${rentalFighters.length}/${maxSlots}）</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:4px">';
    rentalFighters.forEach(c => {
      const condPct = c.condition;
      const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
      const injuryBadge = c.injury ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(214,48,49,0.15);color:#f08b9e;border:1px solid rgba(214,48,49,0.3)">🏥${c.injury.weeksLeft}週</span>` : '';
      const contract = (G.rentals || []).find(r => r.fighterId === c.id);
      const srcLabel = contract ? (contract.fromSource === 'rival'
        ? (Engine.rival.getOrgInfo(G.aiOrgs, contract.fromOrgId)?.name || '他団体')
        : 'FA') : '?';
      html += `<div style="background:var(--bg-card);border:1px solid rgba(243,156,18,0.3);border-radius:8px${c.injury ? ';opacity:0.75' : ''}">
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer" onclick="showFighterPopup(${c.id},'roster')">
          ${portraitImg(c.id, 56, '', true)}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
              ${fLink(c, {source:'roster', size:'13px'})}<span style="color:#f39c12;font-size:12px"> 🤝</span>
              <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>
              ${injuryBadge}
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-sub)">
              <span style="font-size:17px;font-weight:900;color:var(--gold)">${ov(c)}</span>
              <span>PW<b style="color:var(--text)">${Math.round(c.pw)}</b></span>
              <span>SP<b style="color:var(--text)">${Math.round(c.sp)}</b></span>
              <span>TE<b style="color:var(--text)">${Math.round(c.te)}</b></span>
              <span>ST<b style="color:var(--text)">${Math.round(c.st)}</b></span>
              <span>MN<b style="color:var(--text)">${Math.round(c.mn)}</b></span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;font-size:11px;color:var(--text-sub)">
            <div>人気 <b style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</b></div>
            <div style="display:flex;align-items:center;gap:3px;margin-top:2px"><div style="width:40px;height:4px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="width:${condPct}%;height:100%;background:${condCls};border-radius:3px"></div></div><span style="font-size:10px">${condPct}</span></div>
            <div style="margin-top:2px;color:#f39c12;font-size:11px">${srcLabel} ｜ 残${contract ? contract.seasonsLeft : '?'}期(${contract ? contract.seasonsLeft * 12 : '?'}週)</div>
          </div>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  el.innerHTML = html;

  _renderRosterGrowthLog();
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
  // Returns roster members not injured + not on opposite side of same slot
  // Fighters in other slots are included but marked with _usedInOtherSlot for swap UI
  const used = getUsedFighterIds(slotIndex);
  const otherSide = side === 'left' ? G.showCard[slotIndex].right : G.showCard[slotIndex].left;
  return G.roster.filter(c => c.id !== otherSide && !c.injury && !c.forcedRest).map(c => ({
    ...c, _usedInOtherSlot: used.has(c.id)
  }));
}

function renderShowPrep() {
  const el = document.getElementById('showPrepContent');
  // v2.0: 興行準備は manage/showPrep フェーズのみ（settled等の非興行フェーズでは表示しない）
  if (!isShowWeek(G.week) || !['manage', 'showPrep'].includes(G.weekPhase)) {
    el.innerHTML = '<p style="color:var(--text-sub)">興行週ではありません。</p>';
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

  // L1: 会場選択（全会場選択可能・リスク指標付き）
  html += '<div class="panel-title" style="margin-top:0">会場選択</div>';
  const baseAtt = Engine.economy.calcBaseAttendance(G.orgPop);
  html += '<div class="venue-grid">';
  VENUES.forEach((v, i) => {
    const selected = G.showVenue === i;
    const fillRate = baseAtt / v.cap;
    let riskClass = '', riskLabel = '';
    if (fillRate >= 0.7) { riskClass = 'venue-safe'; riskLabel = '◎ 安全'; }
    else if (fillRate >= 0.4) { riskClass = 'venue-risky'; riskLabel = '△ 挑戦'; }
    else { riskClass = 'venue-danger'; riskLabel = '✕ 危険'; }
    html += `<div class="venue-card ${selected ? 'selected' : ''} ${riskClass}"
      onclick="App.setShowVenue(${i});renderShowPrep()">
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
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  // pad up OR trim down to match the venue's limit
  {
    let adjusted = [...G.showCard];
    while (adjusted.length < maxMatches) adjusted.push({left:0, right:0, isTitle:false});
    if (adjusted.length > maxMatches) adjusted = adjusted.slice(0, maxMatches);
    if (adjusted.length !== G.showCard.length) G = { ...G, showCard: adjusted };
  }

  // Sanitize stale IDs (released/retired/transferred wrestlers still in card)
  // forcedRest（S3休養願い承認）の選手も除外
  {
    const rosterMap = new Map(G.roster.map(c => [c.id, c]));
    let dirty = false;
    const cleaned = G.showCard.map(m => {
      const lf = rosterMap.get(m.left), rf = rosterMap.get(m.right);
      const leftOk = m.left > 0 && lf && !lf.forcedRest;
      const rightOk = m.right > 0 && rf && !rf.forcedRest;
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
      const ids = new Set(avail.map(c => c.id));
      if (curVal > 0 && !ids.has(curVal)) {
        const extra = G.roster.find(c => c.id === curVal);
        if (extra) avail = [{ ...extra, _usedInOtherSlot: false }, ...avail];
      }
      // Sort: available first, then used-in-other-slot; within each group by OVR desc
      avail.sort((a, b) => (a._usedInOtherSlot ? 1 : 0) - (b._usedInOtherSlot ? 1 : 0) || ov(b) - ov(a));
      avail.forEach(c => {
        const champMark = G.titles.world.championId === c.id ? '👑 ' : '';
        const lastRunMark = c.lastRun ? '🌅 ' : '';
        const usedMark = c._usedInOtherSlot ? '🔄 ' : '';
        const usedSuffix = c._usedInOtherSlot ? ' [出場中]' : '';
        const lastRunSuffix = c.lastRun ? ' [ラストラン]' : '';
        opts += `<option value="${c.id}" ${curVal===c.id?'selected':''}>${usedMark}${lastRunMark}${champMark}${c.name} (総合:${ov(c)} 体調:${c.condition})${usedSuffix}${lastRunSuffix}</option>`;
      });
      return opts;
    };

    const champId = G.titles.world.championId;
    const hasChamp = champId && (curL === champId || curR === champId);
    const isVacant = !champId;
    // v1.2: 12週クールダウンチェック
    const cdCheck = Engine.title.canTitleMatch(G); // { allowed, weeksLeft }
    const titleEligible = G.titleEstablished && (hasChamp || (isVacant && curL > 0 && curR > 0));
    // Rental restriction: レンタル選手はタイトルマッチ出場不可
    const slotHasRental = [curL, curR].some(id => id > 0 && G.roster.find(c => c.id === id)?.isRental);
    const canTitle = titleEligible && cdCheck.allowed && !slotHasRental;
    const isTitle = G.showCard[i].isTitle || false;
    const titleLabel = isVacant ? '初代王者決定戦' : 'タイトル戦';
    const rivalLvl = (curL > 0 && curR > 0) ? getRivalryLevel(curL, curR) : null;

    // カード鮮度プレビュー
    const freshnessPreview = (curL > 0 && curR > 0)
      ? Engine.freshness.calc(G.matchupLog || [], curL, curR, G.totalShows || 0)
      : null;

    // ラストランチェック
    const lastRunL = curL > 0 ? G.roster.find(c => c.id === curL)?.lastRun : false;
    const lastRunR = curR > 0 ? G.roster.find(c => c.id === curR)?.lastRun : false;
    const isLastRunMatch = lastRunL || lastRunR;

    html += `<div class="match-slot ${isMain ? 'main-event' : ''}" style="margin-top:8px${isLastRunMatch ? ';border-color:rgba(212,168,67,0.4);background:rgba(212,168,67,0.03)' : ''}">
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
        ${titleEligible && cdCheck.allowed && slotHasRental ? `<span style="color:var(--text-dim);font-size:11px" title="レンタル選手はタイトルマッチに出場できません">🤝 レンタル選手はタイトル戦不可</span>` : ''}
        ${(()=>{if(!isTitle||!champId||curL<=0||curR<=0)return'';const cf=champId===curL?G.roster.find(c=>c.id===curL):G.roster.find(c=>c.id===curR);const chf=champId===curL?G.roster.find(c=>c.id===curR):G.roster.find(c=>c.id===curL);if(!cf||!chf)return'';const gap=Engine.util.ov(cf)-Engine.util.ov(chf);if(gap>20)return`<span style="color:#e74c3c;font-size:11px" title="格差が大きいタイトルマッチ(OVR差${gap})はMQ-6">⚠️ 格差大(OVR差${gap}) MQ-6</span>`;if(gap>10)return`<span style="color:#e67e22;font-size:11px" title="格差タイトルマッチ(OVR差${gap})はMQ-3">⚠️ 格差(OVR差${gap}) MQ-3</span>`;return'';})()}
        ${!G.titleEstablished && curL > 0 && curR > 0 ? `<span style="color:var(--text-dim);font-size:11px" title="興行3回・人気15・ロスター5人で設立">🔒 王座未設立</span>` : ''}
        ${rivalLvl ? `<span style="color:${rivalLvl.color}">${rivalLvl.emoji}${rivalLvl.label}(MQ+${rivalLvl.mqBonus})</span>` : ''}
        ${freshnessPreview && freshnessPreview.label ? `<span style="color:${freshnessPreview.bonus > 0 ? '#74b9ff' : '#e17055'};font-size:11px">${freshnessPreview.bonus > 0 ? '✨' : '😐'} ${freshnessPreview.label}(MQ${freshnessPreview.bonus > 0 ? '+' : ''}${freshnessPreview.bonus})</span>` : ''}
        ${isLastRunMatch ? `<span style="color:var(--gold);font-weight:700">🌅 ラストマッチ (MQ+3${i===maxMatches-1?' +メイン+5':''})</span>` : ''}
      </div>
    </div>`;
  }

  // L1: ざっくり集客予測（正確な数字は非表示）
  const validMatches = G.showCard.filter(m => m.left > 0 && m.right > 0 && m.left !== m.right);
  const mainPop = validMatches.length > 0 ?
    Engine.economy.calcCardPop(validMatches.map(m => {
      const l = G.roster.find(c => c.id === m.left);
      const r = G.roster.find(c => c.id === m.right);
      return (l ? l.popularity : 0) + (r ? r.popularity : 0);
    })) : 0;
  const hasTitlePreview = validMatches.some(m => m.isTitle);
  const champIdPreview = G.titles?.world?.championId;
  const hasChampPreview = champIdPreview ? validMatches.some(m => m.left === champIdPreview || m.right === champIdPreview) : false;
  const prediction = Engine.economy.getAttendancePrediction(G, G.showVenue, mainPop, hasTitlePreview, hasChampPreview);
  const estCrowdMQ = Engine.economy.calcCrowdMQBonus(G.showVenue, prediction.estOccRate);
  const v = VENUES[G.showVenue];
  const momentumLabel = (G.attendanceMomentum || 0) > 0.05 ? '📈 勢いあり'
    : (G.attendanceMomentum || 0) < -0.05 ? '📉 勢い低下' : '';

  const heat = getHeatLevel();
  html += `<div style="margin-top:12px;padding:10px;background:rgba(0,0,0,0.3);border-radius:4px;font-size:12px">
    <div style="margin-bottom:6px;font-size:14px;font-weight:700;color:${prediction.color}">${prediction.text}</div>
    <div style="margin-bottom:4px"><span style="color:${heat.color}">${heat.emoji} Heat: ${heat.label}（集客×${heat.mult}）</span>${hasTitlePreview ? ' <span style="color:var(--gold)">🏆 タイトル戦（集客×1.15）</span>' : ''}${hasChampPreview ? ' <span style="color:var(--gold)">👑 王者出場（集客×1.10）</span>' : ''}</div>
    <div><strong>会場:</strong> ${v.name}（${v.cap.toLocaleString()}席） <strong>会場費:</strong> -${v.cost}万${momentumLabel ? ` &nbsp;| ${momentumLabel}` : ''}</div>
    ${estCrowdMQ.total !== 0 ? `<div style="margin-top:4px;color:${estCrowdMQ.total > 0 ? 'var(--green)' : 'var(--red)'}">🏟️ 予想会場熱気: MQ全試合${estCrowdMQ.total >= 0 ? '+' : ''}${estCrowdMQ.total}${estCrowdMQ.crowdLabel ? '（' + estCrowdMQ.crowdLabel + '）' : ''}</div>` : ''}
  </div>`;

  html += '<div class="btn-row" style="margin-top:16px">';
  html += `<button class="btn btn-gold" onclick="executeShow()" ${validMatches.length === 0 ? 'disabled' : ''}>興行開催！ (${validMatches.length}試合)</button>`;
  html += '<button class="btn btn-blue" onclick="G={...G,weekPhase:\'manage\'};showScreen(\'week\');refreshAll()">戻る</button>';
  html += '</div>';

  el.innerHTML = html;
}

// 財務タブリデザイン: ラベル正規化ヘルパー
function _normalizeFinanceLabel(label) {
  if (label.startsWith('チケット収入')) return 'チケット収入';
  if (label.startsWith('グッズ収入')) return 'グッズ収入';
  if (label.startsWith('会場費')) return '会場費';
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
  const tabDefs = [{ k:'summary', l:'📊 総合' }, { k:'income', l:'📈 収入' }, { k:'expense', l:'📉 支出' }, { k:'salary', l:'💰 給与' }];
  html += `<div style="display:flex;gap:4px;margin-bottom:14px">`;
  tabDefs.forEach(t => {
    const a = tab === t.k;
    html += `<button onclick="document.getElementById('financeContent').dataset.financeTab='${t.k}';renderFinance()" style="flex:1;padding:7px 2px;border:1px solid ${a?'var(--gold)':'var(--border)'};background:${a?'rgba(255,200,60,0.1)':'var(--bg-card)'};border-radius:5px;cursor:pointer;font-size:11px;color:${a?'var(--gold)':'var(--text-dim)'};font-weight:${a?700:400}">${t.l}</button>`;
  });
  html += `</div>`;

  // ── 総合タブ ──
  if (tab === 'summary') {
    html += `<div style="font-size:24px;font-weight:900;margin-bottom:12px;color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${G.funds.toLocaleString()}万</div>`;

    // 資金推移チャート
    const fh = G.fundsHistory || [];
    if (fh.length > 1) {
      const leftPad = 55, chartH = 120, chartW = 380;
      const plotW = chartW - leftPad;
      const fMin = Math.min(...fh, 0);
      const fMax = Math.max(...fh, 1);
      const range = fMax - fMin || 1;
      const rawStep = range / 4;
      const niceSteps = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
      const step = niceSteps.find(s => s >= rawStep) || Math.ceil(rawStep / 1000) * 1000;
      const gridLines = [];
      for (let v = Math.ceil(fMin / step) * step; v <= fMax; v += step) gridLines.push(v);
      if (fMin <= 0 && fMax >= 0 && !gridLines.includes(0)) gridLines.push(0);
      gridLines.sort((a, b) => a - b);
      const toY = v => chartH - Math.round(((v - fMin) / range) * chartH);
      const points = fh.map((v, i) => `${leftPad + Math.round(i * plotW / Math.max(fh.length - 1, 1))},${toY(v)}`).join(' ');
      let svg = `<svg width="${chartW}" height="${chartH + 16}" style="display:block;overflow:visible">`;
      gridLines.forEach(val => {
        const y = toY(val);
        const isZero = val === 0;
        svg += `<line x1="${leftPad}" y1="${y}" x2="${chartW}" y2="${y}" stroke="rgba(255,255,255,${isZero?0.2:0.06})" stroke-width="${isZero?1:0.5}"${isZero?' stroke-dasharray="4"':''}/>`;
        svg += `<text x="${leftPad-6}" y="${y+3}" text-anchor="end" fill="rgba(255,255,255,${isZero?0.4:0.2})" font-size="10">${val.toLocaleString()}</text>`;
      });
      const lineColor = G.funds >= 0 ? '#2ecc71' : '#e74c3c';
      svg += `<polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="2"/>`;
      const lastX = leftPad + plotW, lastY = toY(fh[fh.length - 1]);
      svg += `<circle cx="${lastX}" cy="${lastY}" r="3" fill="${lineColor}"/>`;
      svg += `<text x="${lastX}" y="${lastY-8}" text-anchor="end" fill="${lineColor}" font-size="11" font-weight="700">${fh[fh.length-1].toLocaleString()}万</text>`;
      svg += '</svg>';
      html += `<div style="margin-bottom:16px;padding:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px"><div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">💹 資金推移 (${fh.length}週)</div>${svg}</div>`;
    }

    // 期間サマリ
    if (filtered.length > 0) {
      let totalIncome = 0, totalExpense = 0;
      filtered.forEach(h => { totalIncome += h.income || 0; totalExpense += h.expense || 0; });
      const totalNet = totalIncome - totalExpense;
      const periodLabel = period === 'month' ? '今月' : period === 'year' ? '今シーズン' : '全期間';
      html += `<div class="panel-title">期間サマリ — ${periodLabel} <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${filtered.length}週)</span></div>`;
      html += `<div class="finance-row"><span class="f-label">📈 総収入</span><span class="f-val income">+${totalIncome.toLocaleString()}万</span></div>`;
      html += `<div class="finance-row"><span class="f-label">📉 総支出</span><span class="f-val expense">-${totalExpense.toLocaleString()}万</span></div>`;
      html += `<div class="finance-row finance-total"><span>純利益</span><span class="f-val ${totalNet >= 0 ? 'income' : 'expense'}">${totalNet >= 0 ? '+' : ''}${totalNet.toLocaleString()}万</span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">この期間の記録はまだありません</div>`;
      // 推定週間コスト（初回表示用）
      html += '<div class="panel-title" style="margin-top:12px">週間コスト内訳（推定）</div>';
      html += `<div class="finance-row"><span class="f-label">選手給与合計</span><span class="f-val expense">-${calcWeeklySalary()}万/週</span></div>`;
      html += `<div class="finance-row"><span class="f-label">事務運営費</span><span class="f-val expense">-${FIXED_COSTS.admin}万/週</span></div>`;
      const coachTotal = getCoachSalaryTotal();
      if (coachTotal > 0) html += `<div class="finance-row"><span class="f-label">コーチ給与（${G.coaches.length}名）</span><span class="f-val expense">-${coachTotal}万/週</span></div>`;
      html += `<div class="finance-row"><span class="f-label">スポンサー</span><span class="f-val income">+${getSponsorIncome()}万/週</span></div>`;
      html += `<div class="finance-row"><span class="f-label">放映権</span><span class="f-val income">+${getBroadcastIncome()}万/週</span></div>`;
    }
  }

  // ── 収入タブ ──
  else if (tab === 'income') {
    const items = {};
    filtered.forEach(h => {
      (h.details || []).filter(d => d.type === 'income').forEach(d => {
        const key = _normalizeFinanceLabel(d.label);
        if (!items[key]) items[key] = { label: key, val: 0, count: 0 };
        items[key].val += d.val;
        items[key].count++;
      });
    });
    const sorted = Object.values(items).sort((a, b) => b.val - a.val);
    const total = sorted.reduce((s, i) => s + i.val, 0);
    if (sorted.length > 0) {
      sorted.forEach(d => {
        html += `<div class="finance-row"><span class="f-label">${d.label}</span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:10px;color:var(--text-dim)">×${d.count}</span><span class="f-val income">+${d.val.toLocaleString()}万</span></span></div>`;
      });
      html += `<div style="border-top:1px solid var(--border);margin:8px 0"></div>`;
      html += `<div class="finance-row finance-total"><span>総収入</span><span class="f-val income">+${total.toLocaleString()}万</span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">この期間の収入記録はありません</div>`;
    }
  }

  // ── 支出タブ ──
  else if (tab === 'expense') {
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
        html += `<div class="finance-row"><span class="f-label">${d.label}</span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:10px;color:var(--text-dim)">×${d.count}</span><span class="f-val expense">${d.val.toLocaleString()}万</span></span></div>`;
      });
      html += `<div style="border-top:1px solid var(--border);margin:8px 0"></div>`;
      html += `<div class="finance-row finance-total"><span>総支出</span><span class="f-val expense">${total.toLocaleString()}万</span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">この期間の支出記録はありません</div>`;
    }
  }

  // ── 給与タブ ──
  else if (tab === 'salary') {
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
      html += `<div class="finance-row finance-total"><span>給与支払い合計 <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${salaryWeeks}週)</span></span><span class="f-val expense">${salaryTotal.toLocaleString()}万</span></div>`;
      html += `<div style="margin-bottom:14px"></div>`;
    }
    // 選手別給与（現在のスナップショット）
    html += '<div class="panel-title">選手別給与（現在）</div>';
    html += '<table class="data-table"><tr><th>名前</th><th>総合</th><th>給与</th></tr>';
    [...G.roster].sort((a, b) => getSalary(b) - getSalary(a)).forEach(c => {
      html += `<tr><td>${fLink(c, {source:'roster', size:'12px'})}</td><td class="num">${ov(c)}</td><td class="num">${getSalary(c)}万</td></tr>`;
    });
    html += '</table>';
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
    rating: '基礎力 + 対戦ポイントの合計が<br>ランキング評価値',
    base:   'TOP5平均OVR × 1.5 + TOP5平均人気 × 1.0<br>選手の実力と人気で決まる基礎力',
    battle: '対抗戦・頂上決戦・統一トーナメントの<br>勝敗で増減する対戦ポイント<br>毎シーズンリセット'
  };
  const tt = (key) => `<span class="tt" onmouseenter="showCustomTooltip(this,_rankTips.${key})" onmouseleave="hideCustomTooltip()" onclick="event.stopPropagation();showCustomTooltip(this,_rankTips.${key})">?</span>`;
  html += `<table class="data-table"><tr><th style="width:40px">#</th><th>団体名</th>` +
    `<th style="text-align:right">評価値${tt('rating')}</th>` +
    `<th style="text-align:right">基礎力${tt('base')}</th>` +
    `<th style="text-align:right">対戦pt${tt('battle')}</th>` +
    `<th style="text-align:right">人数</th></tr>`;
  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const emoji = isPlayer ? '🏠' : (org ? org.emoji : '');
    const rc = getRankColor(r.rank);
    const bgStyle = isPlayer ? `background:${rc}10` : '';
    const nameStyle = isPlayer ? `color:${rc};font-weight:700` : `color:${rc}`;
    const tierBadge = org ? `<span style="font-size:11px;padding:2px 6px;border-radius:3px;background:${rc}20;color:${rc};border:1px solid ${rc}40;margin-left:6px">${org.tier}</span>` : '';
    const bpColor = r.battlePt > 0 ? '#2ecc71' : r.battlePt < 0 ? '#e74c3c' : 'var(--text-dim)';
    html += `<tr style="${bgStyle}">
      <td style="font-size:18px;font-weight:900;color:${rc}">${r.rank}</td>
      <td>${emoji} <span style="${nameStyle}">${r.name}</span>${tierBadge}</td>
      <td class="num" style="font-size:16px;font-weight:700">${r.rating}</td>
      <td class="num">${r.baseScore}</td>
      <td class="num" style="color:${bpColor}">${r.battlePt >= 0 ? '+' : ''}${r.battlePt}</td>
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
      const sorted = [...G.roster].filter(c => !c.injury && !c.forcedRest).sort((a,b) => ov(b) - ov(a));
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
        <details style="margin-top:10px">
          <summary style="font-size:13px;color:${rc};cursor:pointer">👥 選手を見る（${G.roster.length}名）</summary>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${[...G.roster].sort((a,b) => ov(b) - ov(a)).map(f => {
              const fOvr = ov(f);
              const isChampF = G.titles?.world?.championId === f.id;
              return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid ${rc}20;border-radius:6px;width:calc(50% - 4px);min-width:240px;cursor:pointer" onclick="showFighterPopup(${f.id},'roster')">
                <div class="monitor-wrap monitor-wrap-sm">${portraitImg(f.id, 48)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;color:var(--text-main)">${f.name}${isChampF ? ' 👑' : ''}</div>
                  <div style="font-size:11px;color:var(--text-dim)">OVR ${fOvr} ・ ${f.style || '?'}</div>
                </div>
                <div style="font-size:11px;color:var(--text-dim)">詳細 →</div>
              </div>`;
            }).join('')}
          </div>
        </details>
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
          <summary style="font-size:13px;color:${rc};cursor:pointer">👥 選手を見る（${roster.length}名）</summary>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${[...roster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a)).map((f, idx) => {
              const fOvr = Engine.util.ov(f);
              const isTop = idx === 0;
              return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid ${rc}20;border-radius:6px;width:calc(50% - 4px);min-width:240px;cursor:pointer" onclick="showFighterPopup(${f.id},'ai:${org.id}')">
                <div class="monitor-wrap monitor-wrap-sm">${portraitImg(f.id, 48)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;color:var(--text-main)">${f.name}${isTop ? ' <span style="font-size:10px;color:#e74c3c">★看板</span>' : ''}</div>
                  <div style="font-size:11px;color:var(--text-dim)">OVR ${fOvr} ・ ${f.style || '?'}</div>
                </div>
                <div style="font-size:11px;color:var(--text-dim)">詳細 →</div>
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

  const discount = 0;
  const _ownCount = G.roster.filter(f => !f.isRental).length;
  const _rCap = G.rosterCap || 6;
  const _capFull = _ownCount >= _rCap;
  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">
    所属: <span style="color:var(--text)">${_ownCount}/${_rCap}名${_capFull ? '（上限）' : ''}</span> ｜ フリー: ${G.freeAgents.length}名 ｜ 団体人気: ${Engine.util.dispOrgPop(G.orgPop)}
  </div>
  ${_capFull ? `<div style="padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px;font-size:13px;color:var(--text-sub);margin-bottom:10px">ロスター枠が上限（${_rCap}名）に達しています。新規契約はできません。</div>` : ''}`;

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
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;padding:3px 10px;border-radius:4px;background:${tierCfg.color}22;color:${tierCfg.color};border:1px solid ${tierCfg.color}44;font-weight:600">${tierCfg.label}</span>
          ${viaTicket ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(241,196,15,0.2);color:#f1c40f;border:1px solid rgba(241,196,15,0.4);font-weight:600">🎫 特別交渉枠</span>' : ''}
          ${!canNeg ? '<span style="font-size:13px;color:#e74c3c">⛔ 知名度不足</span>' : ''}
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:28px;font-weight:900;color:var(--gold);line-height:1">${ov(c)}<span style="font-size:10px;font-weight:600;color:var(--text-dim);margin-left:2px">OVR</span></div>
        <div style="font-size:22px;font-weight:800;color:#e8439f;margin-top:6px;line-height:1">${Engine.scout.getSigningCost(c, 0).toLocaleString()}<span style="font-size:11px;font-weight:400;color:var(--text-dim)">万</span></div>
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
          <div style="font-size:13px;color:var(--gold)">残り${contract.seasonsLeft}期(${contract.seasonsLeft * 12}週)</div>
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
          <td class="num ov">${Engine.util.ov(r.fighter)}</td>
          <td><select id="${selectId}" onchange="updateRentalFee(${r.fighter.id})" style="font-size:12px;padding:2px 4px;background:var(--card-bg);color:var(--text);border:1px solid var(--border)">${seasonOpts}</select></td>
          <td class="num" style="color:#f39c12"><span id="rentalFee_${r.fighter.id}">${feeFor1}</span>万</td>
          <td><button id="rentalBtn_${r.fighter.id}" onclick="requestRental(${r.fighter.id},'${r.source}','${r.source === 'rival' ? r.org.id : ''}')" class="btn btn-sm" style="font-size:12px;padding:4px 10px;background:rgba(243,156,18,0.15);border:1px solid rgba(243,156,18,0.3);color:#f39c12" ${G.funds >= feeFor1 ? '' : 'disabled'}>レンタル</button></td>
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
  const discount = 0;
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
  const gradeColors = {C:'#888', B:'#2ecc71', A:'var(--gold)'};
  const coachEffectHtml = (c) => {
    const mult = COACH_RANKS[c.teaching] || 1.0;
    return `<span class="coach-grade coach-grade-${c.grade}">${c.grade}級</span>
      <span style="font-size:12px;color:var(--gold);font-weight:700">指導×${mult}</span>
      <span class="badge badge-${c.style}" style="font-size:11px;padding:1px 6px">${c.style}</span>
      <span class="coach-trait">${c.trait}</span>`;
  };

  // Brief effect explanation
  const coachBrief = (c) => (COACH_TRAIT_DEFS[c.trait] || {}).desc || '';

  const maxCoaches = Engine.coach.getMaxCoaches(G);
  const nextSlot = (G.orgPop||0) < 25 ? '次の枠: 知名度25' : (G.orgPop||0) < 50 ? '次の枠: 知名度50' : '全枠解放';
  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">
    雇用中: ${hired.length}/${maxCoaches}名 ｜ スタッフ給与合計: ${getCoachSalaryTotal()}万/週 ｜ ${nextSlot}
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
    available.forEach(c => {
      const fee = c.hireFee || COACH_HIRE_FEE;
      const canHire = G.coaches.length < maxCoaches && G.funds >= fee;
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
          onclick="hireCoach(${c.id})" ${canHire ? '' : 'disabled'}>${canHire ? `雇用 (${fee}万)` : G.coaches.length >= maxCoaches ? '上限' : '資金不足'}</button>
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
        <div class="save-slot-meta">${Engine.util.formatDate(autoInfo.season, autoInfo.week)} ｜ 資金${autoInfo.funds.toLocaleString()}万 ｜ ${new Date(autoInfo.date).toLocaleString('ja-JP')}</div>
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
          <div class="save-slot-meta">${Engine.util.formatDate(info.season, info.week)} ｜ 資金${info.funds.toLocaleString()}万 ｜ 人気${Engine.util.dispOrgPop(info.orgPop)} ｜ 所属${info.rosterSize}名</div>
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
  panel.classList.toggle('open');
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
  renderScout();
  renderShowPrep();
  renderFinance();
  renderLog();
  renderCoach();
  renderSave();
  renderRanking();
  renderDatabase();
  // F2: Show negotiation result popup if pending
  if (G.negotiationResult) {
    setTimeout(() => showNegotiationResult(), 300);
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  DATABASE SCREEN  (v1.0)                                  ║
// ╚══════════════════════════════════════════════════════════╝

let _dbSubTab = 0; // 0=全選手 1=全コーチ 2=団体比較 3=殿堂 4=相関図
let _dbSortKey = 'ovr';
let _dbSortAsc = false;
let _dbFilterOrg = '';
let _dbFilterStyle = '';
let _dbFilterName = '';
let _dbCoachSortKey = 'grade';
let _dbCoachSortAsc = false;
let _dbCoachFilterGrade = '';
let _dbCoachFilterName = '';
// Phase 6: 相関図 state
let _relmapCenterId = null;
let _relmapFilter = 'all';
let _relmapSelected = null;

function renderDatabase() {
  const el = document.getElementById('databaseContent');
  if (!el) return;
  if (window.IS_TRIAL) {
    el.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);line-height:2">
      🔒 データベースは製品版で解放されます<br>
      <span style="font-size:12px">DLsite / BOOTH で製品版をチェックしてください</span></div>`;
    return;
  }

  const subTabs = [
    { label: '👤 全選手', idx: 0 },
    { label: '🏋️ 全コーチ', idx: 1 },
    { label: '⚔ 団体比較', idx: 2 },
    { label: '🏅 殿堂', idx: 3 },
    { label: '🔗 相関図', idx: 4 },
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
  html += `</div>`;

  el.innerHTML = html;

  // 団体比較ならレーダーチャートを描画
  if (_dbSubTab === 2) _drawOrgCompareChart();
  // 相関図ならマップを描画（DOM挿入後に実行）
  if (_dbSubTab === 4) _drawRelmapAfterRender();
}

function setDbSubTab(idx) {
  _dbSubTab = idx;
  renderDatabase();
}

const _STAT_COLORS = { pw: '#e74c3c', sp: '#3498db', te: '#2ecc71', st: '#f39c12', mn: '#9b59b6' };
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
  const styles = ['Grappler', 'Striker', 'Submission', 'Speed', 'Allround', 'Brawler'];

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

  html += `<table class="db-table">
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

  filtered.forEach(f => {
    const ovr = Engine.util.ov(f);
    const ovrCls = ovr >= 75 ? 'db-ovr-gold' : ovr >= 60 ? 'db-ovr-white' : '';
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
    const source = f._orgTier === 'player' ? 'roster' : f._orgTier === 'fa' ? 'free' : `ai:${f._orgId}`;
    html += `<tr class="clickable" onclick="showFighterPopup(${f.id},'${source}')">
      <td>${portraitImg(f.id, 36, '', false)}</td>
      <td style="font-weight:600">${f.name}</td>
      <td style="font-size:12px">${f._orgName}${tierBadge}${faBadge}${playerBadge}</td>
      <td><span class="badge badge-${f.style}" style="font-size:11px">${f.style || '—'}</span></td>
      <td class="num ${ovrCls}" style="font-weight:700;font-size:15px">${ovr}</td>
      ${_statCell(f.pw, '#e74c3c')}${_statCell(f.sp, '#3498db')}${_statCell(f.te, '#2ecc71')}${_statCell(f.st, '#f39c12')}${_statCell(f.mn, '#9b59b6')}
      <td class="num" style="color:var(--text-sub)">${f.age || '—'}</td>
      <td class="num">${Engine.util.dispPop(f.popularity || 0)}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
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
    else if (_dbCoachSortKey === 'teaching') { va = RANK_ORDER[a.teaching] ?? 9; vb = RANK_ORDER[b.teaching] ?? 9; }
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

  html += `<table class="db-table">
    <thead><tr>
      <th style="width:40px"></th>
      ${th('name', '名前')}
      ${th('grade', 'グレード', '80px')}
      ${th('teaching', '指導力', '65px')}
      ${th('observation', '観察眼', '65px')}
      ${th('style', '得意', '90px')}
      <th style="width:100px">特性</th>
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
      <td class="num" style="font-weight:700;color:${gc}">${c.teaching}</td>
      <td class="num" style="color:${gc}">${c.observation}</td>
      <td><span class="badge badge-${c.style}" style="font-size:11px;padding:1px 6px">${c.style}</span></td>
      <td style="font-size:11px;color:var(--text-sub)">${c.trait}</td>
      <td class="num" style="font-size:12px">${c.salary}万</td>
      <td class="num" style="font-size:12px">${c.hireFee}万</td>
      <td>${isHired ? '<span style="font-size:11px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 5px;border-radius:3px">雇用中</span>' : '<span style="font-size:11px;color:var(--text-dim)">—</span>'}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// ── 殿堂一覧 ──────────────────────────────────────────────
function _renderDbHallOfFame() {
  const hof = G.hallOfFame || [];
  if (hof.length === 0) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--text-dim)">
      <div style="font-size:40px;margin-bottom:12px">🏅</div>
      <div style="font-size:15px;margin-bottom:8px">まだ殿堂入りした選手はいません</div>
      <div style="font-size:13px;color:var(--text-dim)">獲得＋防衛の合計が13回以上の選手が引退時に殿堂入りします</div>
    </div>`;
  }

  let html = `<div class="db-hof-grid">`;
  hof.forEach(h => {
    const pUrl = getPortraitUrl(h.id || 0);
    const imgHtml = pUrl
      ? `<img src="${pUrl}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);flex-shrink:0" alt="">`
      : `<div style="width:60px;height:60px;border-radius:50%;background:rgba(212,168,67,0.15);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🏅</div>`;
    html += `<div class="db-hof-card">
      ${imgHtml}
      <div class="db-hof-info">
        <div class="db-hof-name">${h.name}</div>
        <div class="db-hof-row">
          <span class="badge badge-${h.style || 'Allround'}" style="font-size:11px">${h.style || '—'}</span>
          <span style="margin-left:6px;color:var(--gold);font-weight:700">OVR ${h.ovr || '—'}</span>
        </div>
        <div class="db-hof-row">活動期間: S${h.debutSeason || '?'}〜S${h.retireSeason || '?'}</div>
        ${h.totalTitleWins ? `<div class="db-hof-row">タイトル: ${h.totalTitleWins}回獲得 / ${h.totalDefenses || 0}防衛</div>` : ''}
        ${h.peakOvr ? `<div class="db-hof-row">最高OVR: ${h.peakOvr}</div>` : ''}
        <div class="db-hof-row" style="color:var(--gold)">殿堂入り: S${h.retireSeason || '?'}</div>
      </div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// ── 団体比較 ──────────────────────────────────────────────
let _dbCompareTarget = 'org_s';

function _renderDbOrgCompare() {
  const AXES = ['TOP5実力', '層の厚さ', '団体人気', 'TOP5人気'];
  const playerScores = Engine.database.getOrgCompareScores(G, 'player');
  const targetScores = Engine.database.getOrgCompareScores(G, _dbCompareTarget);

  const targetOrg = RIVAL_ORGS.find(o => o.id === _dbCompareTarget);
  const targetColor = targetOrg ? targetOrg.color : '#888';
  const targetName = targetOrg ? (targetOrg.name || targetOrg.id) : _dbCompareTarget;
  const playerName = G.orgName || 'プレイヤー団体';

  const scoreKeys = ['ace', 'depth', 'popularity', 'starPower'];

  let html = `<div class="db-compare-wrap">
    <div class="db-compare-select">
      <span style="font-size:13px;color:var(--gold);font-weight:700">🏠 ${playerName}</span>
      <span style="color:var(--text-dim)">vs</span>
      <select onchange="_dbCompareTarget=this.value;renderDatabase()">
        ${RIVAL_ORGS.map(o => `<option value="${o.id}" ${_dbCompareTarget === o.id ? 'selected' : ''}>${o.emoji} ${o.name || o.id} (${o.tier})</option>`).join('')}
      </select>
    </div>`;

  // 凡例
  html += `<div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;font-size:12px">
    <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#d4a843;margin-right:4px;vertical-align:middle"></span>${playerName}</span>
    <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${targetColor};margin-right:4px;vertical-align:middle"></span>${targetName}</span>
  </div>`;

  // Canvas（300×300）
  html += `<div class="db-compare-canvas-wrap"><canvas id="dbCompareChart" width="300" height="300"></canvas></div>`;

  // 数値比較テーブル
  html += `<table class="db-compare-table"><tbody>`;
  AXES.forEach((axis, i) => {
    const key = scoreKeys[i];
    const pv = playerScores[key];
    const tv = targetScores[key];
    const diff = pv - tv;
    const diffAbs = Math.abs(diff);
    const diffLabel = diffAbs >= 20 ? (diff > 0 ? ' ★ 圧勝' : ' ★ 大差') : '';
    const diffColor = diff > 0 ? '#2ecc71' : diff < 0 ? '#e74c3c' : 'var(--text-dim)';
    html += `<tr>
      <td>${axis}</td>
      <td style="color:var(--gold);font-weight:700;text-align:right;width:50px">${pv}</td>
      <td style="color:var(--text-dim);text-align:center;width:20px">vs</td>
      <td style="color:${targetColor};font-weight:700;text-align:left;width:50px">${tv}</td>
      <td style="color:${diffColor};font-size:12px">${diff > 0 ? '+' : ''}${diff}<span style="font-size:11px">${diffLabel}</span></td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function _drawOrgCompareChart() {
  const cvs = document.getElementById('dbCompareChart');
  if (!cvs) return;

  const AXES = ['TOP5実力', '層の厚さ', '団体人気', 'TOP5人気'];
  const scoreKeys = ['ace', 'depth', 'popularity', 'starPower'];
  const playerScores = Engine.database.getOrgCompareScores(G, 'player');
  const targetScores = Engine.database.getOrgCompareScores(G, _dbCompareTarget);
  const targetOrg = RIVAL_ORGS.find(o => o.id === _dbCompareTarget);
  const targetColor = targetOrg ? targetOrg.color : '#888';

  const stats = AXES.map((label, i) => ({
    label,
    value: playerScores[scoreKeys[i]],
    color: 'rgba(255,255,255,0.6)',
  }));

  drawRadarChart(cvs, stats, {
    fillColor: '#d4a843',
    fillAlpha: 0.25,
    radius: 110,
    labelSize: 11,
    data2: {
      values: scoreKeys.map(k => targetScores[k]),
      fillColor: targetColor,
      fillAlpha: 0.15,
    },
  });
}

// ╔══════════════════════════════════════════════════════════╗
// ║  RELATIONSHIP MAP (Phase 6)                              ║
// ╚══════════════════════════════════════════════════════════╝

const _RELMAP_ORG_COLORS = { player: '#d4a843', org_s: '#d63031', org_a: '#6c5ce7', org_b: '#00b894', fa: '#8bc4f0' };

function _relmapGetAllChars() {
  return Engine.database.getAllFighters(G);
}

function _relmapGetOrgLabel(f) {
  if (f._orgId === 'player') return G.orgName || 'プレイヤー団体';
  if (f._orgId === 'fa') return 'フリー';
  const org = RIVAL_ORGS.find(o => o.id === f._orgId);
  return org ? (G.rivalOrgNames?.[f._orgId] || org.name || f._orgId) : f._orgName || '?';
}

function _relmapGetOrgColor(f) {
  return _RELMAP_ORG_COLORS[f._orgId] || 'var(--text-dim)';
}

function _relmapGetPairs(centerId) {
  const allChars = _relmapGetAllChars();
  const rels = G.relationships || {};
  const history = G.relationshipHistory || [];
  const pairs = [];

  for (const target of allChars) {
    if (target.id === centerId) continue;
    const keyAB = `${centerId}>${target.id}`;
    const keyBA = `${target.id}>${centerId}`;
    const rAB = rels[keyAB] || { bond: 50, rivalry: 0 };
    const rBA = rels[keyBA] || { bond: 50, rivalry: 0 };
    const bondAB = Math.round(rAB.bond * 10) / 10;
    const bondBA = Math.round(rBA.bond * 10) / 10;
    const rivAB = Math.round(rAB.rivalry * 10) / 10;
    const rivBA = Math.round(rBA.rivalry * 10) / 10;

    // Get rivalry title
    const rivalLvl = Engine.title.getRivalryLevel(G, centerId, target.id);
    const hasTitle = !!rivalLvl && !rivalLvl.isOneSided;
    const isOneSided = rivalLvl?.isOneSided || false;

    // Past rivalry check
    const pastEntries = history.filter(h =>
      (h.id1 === centerId && h.id2 === target.id) || (h.id1 === target.id && h.id2 === centerId)
    );
    const hasPast = pastEntries.length > 0;
    const pastPeakTier = hasPast ? Math.max(...pastEntries.map(e => e.peakTier || e.tier || 1)) : 0;

    // Sort score (spec §5-4)
    const sortScore =
      (hasTitle ? 1000 + rivAB + rivBA : 0) +
      (isOneSided ? 500 : 0) +
      Math.max(rivAB, rivBA) +
      Math.abs(bondAB - 50) + Math.abs(bondBA - 50);

    // Skip if essentially no relationship
    if (sortScore < 3 && !hasPast) continue;

    pairs.push({
      targetId: target.id,
      target,
      bondAB, bondBA, rivAB, rivBA,
      rivalLvl,
      hasTitle, isOneSided,
      hasPast, pastPeakTier,
      sortScore,
    });
  }

  pairs.sort((a, b) => b.sortScore - a.sortScore);
  return pairs;
}

function _relmapFaceHtml(charId, size) {
  const pUrl = getPortraitUrl(charId);
  if (pUrl) return `<img src="${pUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" style="width:${size}px;height:${size}px;object-fit:cover"><span style="display:none;width:${size}px;height:${size}px;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px">👤</span>`;
  return `<span style="display:flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px">👤</span>`;
}

function _relmapBondColor(val) {
  if (val >= 65) return '#74b9ff';
  if (val >= 45) return 'var(--text-sub)';
  return '#ff7675';
}

function _renderDbRelmap() {
  const allChars = _relmapGetAllChars();
  // Default center: first roster member
  if (!_relmapCenterId || !allChars.find(c => c.id === _relmapCenterId)) {
    _relmapCenterId = allChars.length > 0 ? allChars[0].id : null;
  }
  if (!_relmapCenterId) return '<div style="text-align:center;padding:40px;color:var(--text-dim)">選手がいません</div>';

  const centerChar = allChars.find(c => c.id === _relmapCenterId);
  if (!centerChar) return '';

  let pairs = _relmapGetPairs(_relmapCenterId);

  // Apply filter
  if (_relmapFilter === 'team') {
    pairs = pairs.filter(p => p.target._orgId === centerChar._orgId);
  } else if (_relmapFilter === 'rival') {
    pairs = pairs.filter(p => p.hasTitle || p.isOneSided || p.rivAB >= 30 || p.rivBA >= 30);
  } else if (_relmapFilter === 'bond') {
    pairs = [...pairs].sort((a, b) => b.bondAB - a.bondAB);
  }

  // Breadcrumb
  let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:12px;color:var(--text-sub)">
    <span style="cursor:pointer" onclick="setDbSubTab(0)">📊 データベース</span>
    <span style="color:var(--text-dim)">›</span>
    <span style="cursor:pointer" onclick="showFighterPopup(${centerChar.id})">👤 ${centerChar.name}</span>
    <span style="color:var(--text-dim)">›</span>
    <span style="color:var(--gold)">🔗 相関図</span>
  </div>`;

  html += `<div class="rel-layout">`;

  // ── Left sidebar ──
  html += `<div class="rel-sidebar">`;
  html += `<div class="panel" style="padding:12px">`;
  html += `<div class="panel-title">🔗 相関図</div>`;

  // Character selector
  html += `<div class="char-selector" style="margin-bottom:10px"><select onchange="_relmapCenterId=parseInt(this.value);_relmapSelected=null;renderDatabase()">`;
  // Group by org
  const groups = {};
  for (const c of allChars) {
    const orgKey = c._orgId;
    if (!groups[orgKey]) groups[orgKey] = { label: _relmapGetOrgLabel(c), chars: [] };
    groups[orgKey].chars.push(c);
  }
  for (const [orgKey, g] of Object.entries(groups)) {
    html += `<optgroup label="── ${g.label} ──">`;
    g.chars.forEach(c => {
      const ovr = Engine.util.ov(c);
      html += `<option value="${c.id}"${c.id === _relmapCenterId ? ' selected' : ''}>${c.name}（OVR ${ovr}）</option>`;
    });
    html += `</optgroup>`;
  }
  html += `</select></div>`;

  // Filter buttons
  const filters = [
    { key: 'all', label: '全体' },
    { key: 'team', label: '同団体' },
    { key: 'rival', label: 'ライバル' },
    { key: 'bond', label: '親密度順' },
  ];
  html += `<div class="filter-row">`;
  filters.forEach(f => {
    html += `<button class="filter-btn${_relmapFilter === f.key ? ' active' : ''}" onclick="_relmapFilter='${f.key}';renderDatabase()">${f.label}</button>`;
  });
  html += `</div>`;
  html += `</div>`; // end panel

  // Relationship list
  html += `<div class="panel" style="padding:12px;flex:1">`;
  html += `<div class="panel-title">📋 人間関係一覧</div>`;
  html += `<div class="rel-list">`;

  const listPairs = pairs.slice(0, 15);
  listPairs.forEach(p => {
    const orgColor = _relmapGetOrgColor(p.target);
    const orgLabel = _relmapGetOrgLabel(p.target);
    const ovr = Engine.util.ov(p.target);
    const isSelected = _relmapSelected === p.targetId;

    let badges = '';
    if (p.rivalLvl && !p.isOneSided) {
      badges += `<span class="rel-badge title-badge" style="background:${p.rivalLvl.color}22;color:${p.rivalLvl.color};border:1px solid ${p.rivalLvl.color}44">${p.rivalLvl.emoji} ${p.rivalLvl.label}</span>`;
    }
    if (p.isOneSided && p.rivalLvl) {
      const aggId = p.rivalLvl.aggressor;
      const aggChar = allChars.find(c => c.id === aggId);
      const aggName = aggChar ? aggChar.name.split(' ')[0] : '?';
      badges += `<span class="rel-badge" style="background:rgba(253,203,110,0.1);color:#fdcb6e;border:1px solid rgba(253,203,110,0.2)">⚡ 片側因縁（${aggName}→）</span>`;
    }
    if (p.hasPast && !p.hasTitle) {
      badges += `<span class="rel-badge" style="background:rgba(255,255,255,0.04);color:var(--text-dim);border:1px solid rgba(255,255,255,0.08)">💨 過去の因縁</span>`;
    }
    if (p.bondAB >= 75) badges += `<span class="rel-badge bond-high">信頼</span>`;
    if (p.bondAB < 35) badges += `<span class="rel-badge bond-low">不信</span>`;
    if (p.rivAB >= 40 && !p.hasTitle && !p.isOneSided) badges += `<span class="rel-badge rival">🔥 競争意識</span>`;

    html += `<div class="rel-item${isSelected ? ' selected' : ''}" onclick="_relmapCenterId=${p.targetId};_relmapSelected=null;renderDatabase()">
      <div class="rel-item-face" style="border-color:${orgColor}">${_relmapFaceHtml(p.targetId, 32)}</div>
      <div class="rel-item-info">
        <div class="rel-item-name">${p.target.name}</div>
        <div class="rel-item-org" style="color:${orgColor}">${orgLabel} ─ OVR ${ovr}</div>
        <div class="rel-item-badges">${badges}</div>
      </div>
      <div class="rel-item-vals">
        <div style="display:flex;align-items:baseline;gap:2px;justify-content:flex-end">
          <span style="font-size:9px;color:var(--text-dim)">親</span>
          <span class="val-bond" style="color:${_relmapBondColor(p.bondAB)}">${Math.round(p.bondAB)}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:2px;justify-content:flex-end">
          <span style="font-size:9px;color:var(--text-dim)">競</span>
          <span class="val-rivalry">${p.rivAB > 10 ? Math.round(p.rivAB) : '<span style="color:var(--text-dim)">-</span>'}</span>
        </div>
      </div>
    </div>`;
  });

  if (listPairs.length === 0) {
    html += `<div style="text-align:center;padding:20px;color:var(--text-dim);font-size:12px">関係のある選手がいません</div>`;
  }

  html += `</div>`; // end rel-list
  html += `</div>`; // end panel
  html += `</div>`; // end sidebar

  // ── Right: Map ──
  html += `<div class="panel" style="padding:0;position:relative">`;
  html += `<div class="rel-map-container" id="relmapContainer">`;
  html += `<svg class="map-svg" id="relmapSvg"></svg>`;

  // Legend
  html += `<div class="map-legend">
    <div class="legend-line"><div class="legend-swatch" style="background:#74b9ff"></div> 親密度（高）</div>
    <div class="legend-line"><div class="legend-swatch" style="background:#ff7675"></div> 親密度（低）</div>
    <div class="legend-line"><div class="legend-swatch" style="background:#e17055;height:4px"></div> 競争意識 🔥</div>
    <div class="legend-line" style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.06);padding-top:4px">
      <span style="font-size:9px">線の太さ＝感情の強度</span>
    </div>
  </div>`;

  // Detail panel (populated by JS after render)
  html += `<div class="rel-detail-panel" id="relmapDetailPanel"></div>`;

  html += `</div>`; // end map-container
  html += `</div>`; // end panel

  html += `</div>`; // end rel-layout

  return html;
}

// ── Map drawing (called after DOM insertion) ──
function _drawRelmapAfterRender() {
  const container = document.getElementById('relmapContainer');
  const svg = document.getElementById('relmapSvg');
  if (!container || !svg) return;

  const allChars = _relmapGetAllChars();
  const centerChar = allChars.find(c => c.id === _relmapCenterId);
  if (!centerChar) return;

  let pairs = _relmapGetPairs(_relmapCenterId);
  if (_relmapFilter === 'team') pairs = pairs.filter(p => p.target._orgId === centerChar._orgId);
  else if (_relmapFilter === 'rival') pairs = pairs.filter(p => p.hasTitle || p.isOneSided || p.rivAB >= 30 || p.rivBA >= 30);
  else if (_relmapFilter === 'bond') pairs = [...pairs].sort((a, b) => b.bondAB - a.bondAB);

  const w = container.offsetWidth;
  const h = container.offsetHeight;
  const cx = w / 2;
  const cy = h / 2;

  // Clear old nodes
  container.querySelectorAll('.map-center, .map-node').forEach(n => n.remove());
  svg.innerHTML = '<defs></defs>';

  // Center node
  const centerEl = document.createElement('div');
  centerEl.className = 'map-center';
  centerEl.style.left = cx + 'px';
  centerEl.style.top = cy + 'px';
  const centerFaceHtml = _relmapFaceHtml(_relmapCenterId, 58);
  centerEl.innerHTML = `
    <div class="map-center-face">${centerFaceHtml}</div>
    <div class="map-center-name">${centerChar.name}</div>
  `;
  centerEl.style.cursor = 'pointer';
  centerEl.onclick = () => showFighterPopup(_relmapCenterId);
  container.appendChild(centerEl);

  // Peripheral nodes
  const nodeCount = Math.min(pairs.length, 10);
  const radius = Math.min(w, h) * 0.35;
  const startAngle = -Math.PI / 2;

  pairs.slice(0, nodeCount).forEach((p, i) => {
    const angle = startAngle + (2 * Math.PI * i / nodeCount);
    const strength = (Math.abs(p.bondAB - 50) + Math.abs(p.rivAB)) / 100;
    const r = radius * (0.75 + strength * 0.25);
    const nx = cx + Math.cos(angle) * r;
    const ny = cy + Math.sin(angle) * r;

    // Draw connection lines
    _drawRelmapConnection(svg, cx, cy, nx, ny, p, angle, i);

    // Node element
    const nodeEl = document.createElement('div');
    nodeEl.className = 'map-node';
    nodeEl.style.left = nx + 'px';
    nodeEl.style.top = ny + 'px';
    const orgColor = _relmapGetOrgColor(p.target);
    const isSelected = _relmapSelected === p.targetId;
    const borderColor = isSelected ? 'var(--gold)' : (p.rivalLvl ? p.rivalLvl.color : orgColor);

    let titleHtml = '';
    if (p.hasTitle && p.rivalLvl) {
      titleHtml = `<div class="map-node-title" style="background:${p.rivalLvl.color}22;color:${p.rivalLvl.color};border:1px solid ${p.rivalLvl.color}55">${p.rivalLvl.emoji} ${p.rivalLvl.label}</div>`;
    } else if (p.isOneSided) {
      titleHtml = `<div class="map-node-title" style="background:rgba(253,203,110,0.1);color:#fdcb6e;border:1px solid rgba(253,203,110,0.3)">⚡ 片側</div>`;
    } else if (p.hasPast && !p.hasTitle) {
      titleHtml = `<div class="map-node-title" style="background:rgba(255,255,255,0.05);color:var(--text-dim);border:1px solid rgba(255,255,255,0.1)">💨 過去</div>`;
    }

    const faceHtml = _relmapFaceHtml(p.targetId, 40);
    nodeEl.innerHTML = `
      <div class="map-node-face" style="border-color:${borderColor};${isSelected ? 'box-shadow:0 0 12px rgba(212,168,67,0.4)' : ''}">${faceHtml}</div>
      <div class="map-node-name">${p.target.name.split(' ')[0]}</div>
      ${titleHtml}
    `;
    nodeEl.onclick = () => { _relmapCenterId = p.targetId; _relmapSelected = null; renderDatabase(); };
    nodeEl.onmouseenter = () => { _relmapSelected = p.targetId; _updateRelmapDetail(pairs, allChars); };
    nodeEl.onmouseleave = () => { _relmapSelected = null; _updateRelmapDetail(pairs, allChars); };
    container.appendChild(nodeEl);
  });

  // Detail panel (show on hover)
  _updateRelmapDetail(pairs, allChars);
}

function _drawRelmapConnection(svg, cx, cy, nx, ny, p, angle, idx) {
  const defs = svg.querySelector('defs');
  const offset = 7;
  const perpX = Math.cos(angle + Math.PI / 2) * offset;
  const perpY = Math.sin(angle + Math.PI / 2) * offset;

  const dx = nx - cx, dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / dist, uy = dy / dist;
  const startPad = 36;
  const endPad = 26;

  // A→B line (center → node)
  const bondAB = p.bondAB;
  const colorAB = bondAB >= 50 ? `rgba(116,185,255,${0.3 + (bondAB - 50) / 80})` : `rgba(255,118,117,${0.3 + (50 - bondAB) / 80})`;
  const hexAB = bondAB >= 50 ? '#74b9ff' : '#ff7675';
  const widthAB = 1.5 + Math.abs(bondAB - 50) / 18;

  const markIdAB = `arrow_${idx}_ab`;
  const markerAB = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  markerAB.setAttribute('id', markIdAB);
  markerAB.setAttribute('markerWidth', '8');
  markerAB.setAttribute('markerHeight', '6');
  markerAB.setAttribute('refX', '7');
  markerAB.setAttribute('refY', '3');
  markerAB.setAttribute('orient', 'auto');
  markerAB.innerHTML = `<polygon points="0 0, 8 3, 0 6" fill="${hexAB}" opacity="0.8"/>`;
  defs.appendChild(markerAB);

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', cx + ux * startPad + perpX);
  line1.setAttribute('y1', cy + uy * startPad + perpY);
  line1.setAttribute('x2', nx - ux * endPad + perpX);
  line1.setAttribute('y2', ny - uy * endPad + perpY);
  line1.setAttribute('stroke', colorAB);
  line1.setAttribute('stroke-width', widthAB);
  if (bondAB < 40) line1.setAttribute('stroke-dasharray', '4,4');
  line1.setAttribute('marker-end', `url(#${markIdAB})`);
  svg.appendChild(line1);

  // B→A line (node → center)
  const bondBA = p.bondBA;
  const colorBA = bondBA >= 50 ? `rgba(116,185,255,${0.3 + (bondBA - 50) / 80})` : `rgba(255,118,117,${0.3 + (50 - bondBA) / 80})`;
  const hexBA = bondBA >= 50 ? '#74b9ff' : '#ff7675';
  const widthBA = 1.5 + Math.abs(bondBA - 50) / 18;

  const markIdBA = `arrow_${idx}_ba`;
  const markerBA = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  markerBA.setAttribute('id', markIdBA);
  markerBA.setAttribute('markerWidth', '8');
  markerBA.setAttribute('markerHeight', '6');
  markerBA.setAttribute('refX', '7');
  markerBA.setAttribute('refY', '3');
  markerBA.setAttribute('orient', 'auto');
  markerBA.innerHTML = `<polygon points="0 0, 8 3, 0 6" fill="${hexBA}" opacity="0.8"/>`;
  defs.appendChild(markerBA);

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', nx - ux * endPad - perpX);
  line2.setAttribute('y1', ny - uy * endPad - perpY);
  line2.setAttribute('x2', cx + ux * startPad - perpX);
  line2.setAttribute('y2', cy + uy * startPad - perpY);
  line2.setAttribute('stroke', colorBA);
  line2.setAttribute('stroke-width', widthBA);
  if (bondBA < 40) line2.setAttribute('stroke-dasharray', '4,4');
  line2.setAttribute('marker-end', `url(#${markIdBA})`);
  svg.appendChild(line2);

  // Rivalry overlay (center dashed line, orange)
  const maxRiv = Math.max(p.rivAB, p.rivBA);
  if (maxRiv > 20) {
    const rivLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rivLine.setAttribute('x1', cx + ux * startPad);
    rivLine.setAttribute('y1', cy + uy * startPad);
    rivLine.setAttribute('x2', nx - ux * endPad);
    rivLine.setAttribute('y2', ny - uy * endPad);
    rivLine.setAttribute('stroke', `rgba(225,112,85,${0.15 + maxRiv / 200})`);
    rivLine.setAttribute('stroke-width', maxRiv / 20);
    rivLine.setAttribute('stroke-dasharray', '8,4');
    svg.appendChild(rivLine);

    if (maxRiv >= 50) {
      const mx = (cx + nx) / 2;
      const my = (cy + ny) / 2;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', mx);
      text.setAttribute('y', my);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', maxRiv >= 70 ? '16' : '12');
      text.textContent = '\uD83D\uDD25';
      svg.appendChild(text);
    }
  }

  // Past rivalry (gray dashed)
  if (p.hasPast && maxRiv <= 20 && bondAB >= 40 && bondBA >= 40) {
    const grayLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    grayLine.setAttribute('x1', cx + ux * startPad);
    grayLine.setAttribute('y1', cy + uy * startPad);
    grayLine.setAttribute('x2', nx - ux * endPad);
    grayLine.setAttribute('y2', ny - uy * endPad);
    grayLine.setAttribute('stroke', 'rgba(255,255,255,0.08)');
    grayLine.setAttribute('stroke-width', '2');
    grayLine.setAttribute('stroke-dasharray', '2,6');
    svg.appendChild(grayLine);
  }
}

function _updateRelmapDetail(pairs, allChars) {
  const panel = document.getElementById('relmapDetailPanel');
  if (!panel) return;
  if (!_relmapSelected) { panel.classList.remove('show'); return; }

  const p = pairs.find(pp => pp.targetId === _relmapSelected);
  if (!p) { panel.classList.remove('show'); return; }

  panel.classList.add('show');
  const centerChar = allChars.find(c => c.id === _relmapCenterId);
  const cName = centerChar ? centerChar.name.split(' ')[0] : '?';
  const tName = p.target.name.split(' ')[0];

  let titleHtml = '';
  if (p.hasTitle && p.rivalLvl) {
    titleHtml = `<span style="color:${p.rivalLvl.color};font-size:12px;font-weight:700">${p.rivalLvl.emoji} ${p.rivalLvl.label}（${p.rivalLvl.matches}戦）</span>`;
  }
  if (p.isOneSided && p.rivalLvl) {
    const aggChar = allChars.find(c => c.id === p.rivalLvl.aggressor);
    const aggName = aggChar ? aggChar.name.split(' ')[0] : '?';
    titleHtml = `<span style="color:#fdcb6e;font-size:12px;font-weight:700">⚡ 片側因縁（${aggName}→）</span>`;
  }
  if (p.hasPast && !p.hasTitle) {
    titleHtml += ` <span style="color:var(--text-dim);font-size:11px">💨 過去の因縁</span>`;
  }

  const b1Color = _relmapBondColor(p.bondAB);
  const b2Color = _relmapBondColor(p.bondBA);

  panel.innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span style="font-weight:700;font-size:12px">${centerChar ? centerChar.name : ''}</span>
    <span style="color:var(--text-dim);font-size:10px">⇄</span>
    <span style="font-weight:700;font-size:12px">${p.target.name}</span>
    ${titleHtml}
    <span style="color:var(--text-dim);font-size:10px">│</span>
    <span style="font-size:10px;color:var(--text-dim)">${cName}→${tName}</span>
    <span class="rel-compact-label">親</span><span class="rel-compact-val" style="color:${b1Color}">${Math.round(p.bondAB)}</span>
    <span class="rel-compact-label">競</span><span class="rel-compact-val" style="color:#e17055">${Math.round(p.rivAB)}</span>
    <span style="color:var(--text-dim);font-size:10px">│</span>
    <span style="font-size:10px;color:var(--text-dim)">${tName}→${cName}</span>
    <span class="rel-compact-label">親</span><span class="rel-compact-val" style="color:${b2Color}">${Math.round(p.bondBA)}</span>
    <span class="rel-compact-label">競</span><span class="rel-compact-val" style="color:#e17055">${Math.round(p.rivBA)}</span>
  </div>`;
}

