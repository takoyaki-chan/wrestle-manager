// v1.9: Roster sort state
let _rosterSortKey = 'ovr';
function setRosterSort(key) { _rosterSortKey = key; renderRoster(); }

// Coach-fighter style match helper
function getCoachStyleMatch(coach, fighter) {
  if (!coach || !fighter) return { type: 'none', bonus: 0, label: '', icon: '', cls: 'none' };
  if (coach.style === 'Allround') return { type: 'allround', bonus: 0.05, label: '髣包ｽｳ郢晢ｽｻ郢晢ｽｻ', icon: '髫ｨ・ｳ郢晢ｽｻ, cls: 'allround' };
  if (coach.style === fighter.style) return { type: 'specialist', bonus: 0.08, label: '髣包ｽｳ・つ鬮｢・ｾ繝ｻ・ｴ', icon: '髫ｨ・ｨ繝ｻ・ｦ', cls: 'specialist' };
  return { type: 'none', bonus: 0, label: '髣包ｽｳ陜｣・ｺ繝ｻ・ｸ・つ鬮｢・ｾ繝ｻ・ｴ', icon: '', cls: 'none' };
}

function refreshTopBar() {
  // Audio mute button sync
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) muteBtn.textContent = Audio.muted ? '・滓ｨ｣ﾂ繝ｻ : '・滓ｨ呈ｴｫ';
  const bgmMuteBtn = document.getElementById('bgmMuteBtn');
  if (bgmMuteBtn) bgmMuteBtn.textContent = Audio.bgmMuted ? '・滓ｨ費ｽｸ繝ｻ・ｬ・ｶ郢晢ｽｻ : '・滓ｨ費ｽｸ繝ｻ;
  // Hide nav during draft
  const navBar = document.querySelector('.nav-bar');
  if (navBar) navBar.style.display = (G.weekPhase === 'draft') ? 'none' : '';
  const dateEl = document.getElementById('dispDate');
  if (dateEl) {
    if (G.offSeason) {
      dateEl.textContent = `${G.season}髯晢ｽｷ繝ｻ・ｴ鬨ｾ・ｶ繝ｻ・ｮ 驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ ${G.offWeek || 0}/4`;
    } else {
      dateEl.textContent = Engine.util.formatDate(G.season, G.week);
    }
  }
  const fundsEl = document.getElementById('dispFunds');
  fundsEl.textContent = `${G.funds.toLocaleString()}髣包ｽｳ郢ｻ繝ｻ
  fundsEl.className = `info-val ${G.funds >= 0 ? 'positive' : 'negative'}`;
  document.getElementById('dispPop').textContent = Engine.util.dispOrgPop(G.orgPop);
  // v1.5s25b: 鬮ｯ・ｬ隲幢ｽｷ陷搾ｽｧ鬯ｩ・･闔会ｽ｣邵ｺ蜥ｲ・ｹ・ｧ繝ｻ・ｦ驛｢譎｢・ｽ・ｳ驛｢譎冗樟郢晢｣ｰ驛｢・ｧ繝ｻ・ｦ驛｢譎｢・ｽ・ｳ
  const subsidyEl = document.getElementById('dispSubsidy');
  if (subsidyEl) {
    const popInt = Engine.util.dispOrgPop(G.orgPop);
    if (popInt < 40 && G.difficultyMode !== 'hard') {
      const subsidyAmt = Engine.economy.getSubsidy(G.orgPop, G.difficultyMode);
      const remaining = 40 - popInt;
      const tipHtml = `<strong style="color:var(--gold)">・滓ｨ｣蜈ｱ郢晢ｽｻ郢晢ｽｻ髯懶ｽｨ繝ｻ・ｰ髯懈瑳・ｻ鬥ｴ蛹ｱ鬮｣雍具ｽｺ・･陷搾ｽｧ髫ｰ謔滂ｽｮ・｣遶包ｽ｡</strong><br>
髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ髫ｰ・ｾ繝ｻ・ｯ鬩搾ｽｨ繝ｻ・ｦ鬯ｯ蛟･繝ｻ <strong style="color:#2ecc71">+${subsidyAmt}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</strong>郢晢ｽｻ鬩帚・繝ｻ髯ｷ讎頑｡√・・ｼ郢晢ｽｻbr>
<span style="color:#aaa">髣費｣ｰ繝ｻ・ｺ髮取ぁ蟷ｲ遯ｶ・ｲ驍ｵ・ｺ郢ｧ繝ｻ繝ｻ<strong style="color:#fff">${remaining}pt</strong>髣包ｽｳ驗呻ｽｫ遯ｶ・ｲ驛｢・ｧ闕ｵ譏ｶ繝ｻ髫ｰ繝ｻ萓ｭ隨・｣ｰ髯具ｽｻ郢晢ｽｻ繝ｻ繝ｻ/span><br><br>
<span style="color:#aaa;font-size:11px">髫ｰ繝ｻ萓ｭ隨・｣ｰ髯具ｽｻ郢晢ｽｻ繝ｻ鬘假｣ｰ蜍滂ｽｾ蠕後・驛｢・ｧ繝ｻ・ｹ驛｢譎・ｺ｢・趣ｽｦ驛｢・ｧ繝ｻ・ｵ驛｢譎｢・ｽ・ｼ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ驍ｵ・ｺ郢晢ｽｻbr>10髣包ｽｳ郢晢ｽｻ驕ｶ鄙ｫ繝ｻ<strong style="color:#fff">30髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</strong>驍ｵ・ｺ繝ｻ・ｫ髯溘・蟷ｲ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ/span>`;
      subsidyEl.textContent = `鬮ｯ・ｬ隲幢ｽｷ陷搾ｽｧ鬯ｩ・･闔会ｽ｣遶包｣ｰ驍ｵ・ｺ繝ｻ・ｨ${remaining}pt`;
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
    rankEl.innerHTML = `<span style="color:${rColor}">${pRank}髣厄ｽｴ郢晢ｽｻ${rankings.length}</span>`;
  }
  const champEl = document.getElementById('dispChamp');
  const champ = getWorldChampion();
  champEl.innerHTML = champ ? `<span style="display:inline-flex;align-items:center;gap:12px">${portraitImg(champ.id, 80)}<span style="font-size:16px">・滓ｨ｣繝ｻ ${fLink(champ, {source:'roster', bold:false, size:'16px'})} (${G.titles.world.defenses}鬯ｮ・ｦ繝ｻ・ｲ鬮ｯ・ｦ郢晢ｽｻ</span></span>` : '<span style="color:var(--text-dim)">・滓ｨ｣繝ｻ 鬩包ｽｨ繝ｻ・ｺ髣厄ｽｴ郢晢ｽｻ/span>';
}

function renderWeekScreen() {
  const el = document.getElementById('weekContent');
  let html = '';

  // 髫ｨ貂可髫ｨ貂可 DRAFT PHASE 髫ｨ貂可髫ｨ貂可
  if (G.weekPhase === 'draft') {
    document.getElementById('weekTitle').textContent = '初期ドラフト';
    const fixed = Engine.draft.getFixedInfo(G.rngSeed, 0);
    const candidates = Engine.draft.getCandidateInfo(G.rngSeed, 0);
    const picks = G._draftPicks || [];
    const focusId = G._draftFocus || null;
    const selectedCost = Engine.draft.getSelectionCost(G.rngSeed, picks);
    const remainingFunds = Math.max(0, (G.funds || 0) - selectedCost);
    const fmtMoney = (value) => Number(value || 0).toLocaleString('ja-JP') + 'M';
    const candidateById = new Map(candidates.map(c => [c.id, c]));

    html += `<div style="margin-bottom:20px;padding:16px;background:linear-gradient(135deg,rgba(212,168,67,0.12),rgba(0,0,0,0));border:1px solid rgba(212,168,67,0.3);border-radius:10px">
      <p style="color:var(--gold);font-weight:700;margin-bottom:6px;font-size:15px">${G.orgName || 'プレイヤー団体'} - Initial Draft</p>
      <p style="color:var(--text-sub);font-size:13px;line-height:1.8">
        固定メンバー2名に加え、候補6名から3名を選んでシーズンを開始します。<br>
        <span style="font-size:12px;color:var(--text-dim)">能力値は入団時の推定値です。実際の値とは異なる場合があります。</span><br>
        <span style="font-size:12px;color:var(--text-dim)">将来性の評価はコーチ不在のため大きくブレる場合があります。</span><br>
        <span style="font-size:12px;color:var(--gold)">ヒント: 契約金が高い選手には、それだけの理由があるかもしれません。</span>
      </p>
    </div>`;

    const renderCard = (c, picked, disabled, focused, isFixed) => {
      const tierCfg = Engine.scout.getTierConfig(c.assessedTier);
      const borderCol = picked ? '#2ecc71' : focused ? '#3498db' : 'var(--border)';
      const bgCol = picked ? 'rgba(46,204,113,0.06)' : focused ? 'rgba(52,152,219,0.04)' : 'var(--bg-card)';
      const priceText = isFixed ? 'FREE' : `${fmtMoney(c.assessedValue)} [${tierCfg.label}]`;
      if (!focused) {
        return `<div style="margin-bottom:8px;border-radius:8px;border:1px solid ${borderCol};background:${bgCol};overflow:hidden;opacity:${disabled ? 0.45 : 1};transition:all 0.2s">
          <div style="display:flex;align-items:center;gap:14px;padding:14px;cursor:${disabled ? 'not-allowed' : 'pointer'}" ${disabled ? '' : `onclick="App.focusDraftCandidate(${c.id})"`}>
            ${portraitImg(c.id, 80)}
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-weight:700;font-size:17px">${c.name}</span>
                ${picked ? '<span style="color:#2ecc71;font-size:12px;font-weight:700">Picked</span>' : ''}
                ${isFixed ? '<span style="color:var(--gold);font-size:12px;font-weight:700">Fixed</span>' : ''}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;color:var(--text-sub);font-size:12px">
                <span>${c.style}</span>
                <span>${c.role}</span>
                <span>${c.h}cm</span>
                <span>${c.age}y</span>
              </div>
            </div>
            <div style="text-align:right;min-width:140px">
              <div style="font-size:24px;font-weight:900;color:${picked ? '#2ecc71' : 'var(--text)'}">${c.ovr}</div>
              <div style="font-size:11px;color:var(--text-dim)">OVR</div>
              <div style="font-size:12px;color:${isFixed ? 'var(--gold)' : tierCfg.color};margin-top:4px;font-weight:700">$ ${priceText}</div>
              ${!isFixed && disabled && !picked ? '<div style="font-size:11px;color:#e67e22;margin-top:2px">資金不足</div>' : ''}
            </div>
          </div>
        </div>`;
      }
      return `<div style="margin-bottom:8px;border-radius:8px;border:1px solid ${borderCol};background:${bgCol};overflow:hidden;opacity:${disabled ? 0.45 : 1};transition:all 0.2s">
        <div style="padding:14px;cursor:pointer" onclick="App.focusDraftCandidate(${c.id})">
          <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px">
            ${portraitImg(c.id, 100)}
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-weight:900;font-size:18px">${c.name}</span>
                ${picked ? '<span style="color:#2ecc71;font-size:12px;font-weight:700">Picked</span>' : ''}
                ${isFixed ? '<span style="color:var(--gold);font-size:12px;font-weight:700">Fixed</span>' : ''}
              </div>
              <div style="font-size:13px;color:var(--text-dim);line-height:1.7">
                <div>${c.style} / ${c.role}</div>
                <div>${c.h}cm / ${c.age}y</div>
                <div style="color:${c.coachEval.color}">${c.coachEval.emoji} ${c.coachEval.text}</div>
              </div>
              <div style="margin-top:8px;font-size:26px;font-weight:900;color:var(--text)">${c.ovr}<span style="font-size:12px;color:var(--text-dim);margin-left:4px">OVR</span></div>
              <div style="margin-top:8px;font-size:13px;font-weight:700;color:${isFixed ? 'var(--gold)' : tierCfg.color}">$ Contract: ${priceText}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(5, minmax(0, 1fr));gap:8px;margin-bottom:12px">
            ${['pw','sp','te','st','mn'].map(key => `<div style="padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;text-align:center"><div style="font-size:10px;color:var(--text-dim)">${key.toUpperCase()}</div><div style="font-size:16px;font-weight:700">${c[key]}</div></div>`).join('')}
          </div>
          ${isFixed ? '' : `<div style="display:flex;gap:8px" onclick="event.stopPropagation()">
            <button class="btn ${picked ? '' : 'btn-gold'}" style="flex:1;padding:10px;font-size:13px;font-weight:700;${disabled && !picked ? 'opacity:0.5;cursor:not-allowed' : ''}" ${disabled && !picked ? 'disabled' : `onclick="App.toggleDraftPick(${c.id})"`}>
              ${picked ? '選択を解除' : disabled ? '資金不足' : 'この選手を選ぶ'}
            </button>
            <button class="btn" style="padding:10px 16px;font-size:13px" onclick="App.focusDraftCandidate(${c.id})">閉じる</button>
          </div>`}
        </div>
      </div>`;
    };

    html += `<h4 style="color:var(--gold);margin-bottom:10px;font-size:13px">固定メンバー（無料）</h4>`;
    fixed.forEach(c => { html += renderCard(c, false, false, false, true); });

    html += `<h4 style="color:#3498db;margin:20px 0 10px;font-size:13px">候補選手 (${picks.length}/${DRAFT_CONFIG.pickCount})</h4>`;
    candidates.forEach(c => {
      const picked = picks.includes(c.id);
      const unavailableByFunds = !picked && remainingFunds < (c.assessedValue || 0);
      const full = picks.length >= DRAFT_CONFIG.pickCount && !picked;
      const disabled = unavailableByFunds || full;
      const focused = focusId === c.id;
      html += renderCard(c, picked, disabled, focused, false);
    });

    const allChars = [...fixed, ...picks.map(id => candidateById.get(id)).filter(Boolean)].map(c => ({ name: c.name, ovr: c.ovr }));
    const avgOvr = allChars.length ? Math.round(allChars.reduce((sum, c) => sum + c.ovr, 0) / allChars.length) : 0;
    html += `<div style="margin-top:20px;padding:14px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border)">
      <h4 style="margin-bottom:10px;font-size:13px">チームプレビュー</h4>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${allChars.map(c => `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.04);border-radius:5px"><span style="font-size:12px">${c.name}</span><span style="font-size:12px;font-weight:700;color:var(--gold)">${c.ovr}</span></div>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;color:var(--text-sub)">平均OVR</span><span style="font-size:20px;font-weight:900;color:var(--gold)">${avgOvr}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)"><span style="font-size:13px;color:var(--text-sub)">契約金合計</span><span style="font-size:16px;font-weight:700">${fmtMoney(selectedCost)}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span style="font-size:13px;color:var(--text-sub)">残り資金</span><span style="font-size:16px;font-weight:700;color:${remainingFunds > 0 ? 'var(--gold)' : '#e67e22'}">${fmtMoney(remainingFunds)}</span></div>
    </div>`;

    const canConfirm = picks.length === DRAFT_CONFIG.pickCount && selectedCost <= (G.funds || 0);
    const confirmText = picks.length !== DRAFT_CONFIG.pickCount
      ? `あと${DRAFT_CONFIG.pickCount - picks.length}名選んでください`
      : selectedCost > (G.funds || 0)
        ? '資金不足 - より安い候補を選んでください'
        : `この5名でシーズン開始！（契約金: ${fmtMoney(selectedCost)}）`;
    html += `<button class="btn ${canConfirm ? 'btn-gold' : ''}" style="width:100%;margin-top:16px;padding:16px;font-size:15px;font-weight:700;border-radius:8px;${canConfirm ? '' : 'opacity:0.35;cursor:not-allowed'}" ${canConfirm ? 'onclick="App.completeDraft()"' : 'disabled'}>${confirmText}</button>`;

    el.innerHTML = html;
    return;
  }
if (G.weekPhase === 'offseason') {
    const offW = G.offWeek || 0;
    const offLabels = ['・滓ｨ奇ｽｽ・､ 驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬩搾ｽｨ郢ｧ繝ｻ・ｽ・ｺ郢晢ｽｻ, '・滓ｨ雁・ 驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ驛｢譎｢・ｽ・ｬ驛｢譎・ｺ｢郢晢ｽｻ驛｢譏ｴ繝ｻ, '・滓ｧｫ鄙・驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎乗ｲｺ繝ｻ・ｴ繝ｻ・ｻ髯ｷ髦ｪ繝ｻ, '・滓ｧｫ・｣・ｲ 鬩募∞・ｽ・ｻ鬩債鬮ｦ・ｪ邵ｺ閧ｲ・ｹ・ｧ繝ｻ・｣驛｢譎｢・ｽ・ｳ驛｢譎擾ｽｳ・ｨ邵ｺ繝ｻ, '・滓ｨ奇ｽｱ繝ｻ髫ｴ繝ｻ・ｽ・ｰ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ髮九・鞫ｩ繝ｻ繝ｻ];
    document.getElementById('weekTitle').textContent = offW === 0
      ? `${G.season}髯晢ｽｷ繝ｻ・ｴ鬨ｾ・ｶ繝ｻ・ｮ 驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬩包ｽｯ遶乗亢繝ｻ`
      : `驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬮ｫ・ｨ繝ｻ・ｬ${offW}鬯ｨ・ｾ繝ｻ・ｱ 驕ｯ・ｶ郢晢ｽｻ${offLabels[offW] || ''}`;

    // Progress bar
    html += `<div style="margin-bottom:16px">
      <div style="display:flex;gap:4px;margin-bottom:8px">
        ${[1,2,3,4].map(i => `<div style="flex:1;height:6px;border-radius:3px;background:${i <= offW ? 'var(--gold)' : 'var(--bg-card)'};transition:background 0.3s"></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim)">
        <span>驛｢譎｢・ｽ・ｬ驛｢譎・ｺ｢郢晢ｽｻ驛｢譏ｴ繝ｻ/span><span>驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ/span><span>鬩募∞・ｽ・ｻ鬩債郢晢ｽｻ/span><span>鬯ｮ・｢陷ｿ・･繝ｻ・ｹ郢晢ｽｻ/span>
      </div>
    </div>`;

    // v0.95: Season Recap Card (show detailed stats from completed season)
    // 髯晢ｽｶ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｫ髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ陷代・・ｽ・ｽ繝ｻ・ｿ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻastArchive驍ｵ・ｺ繝ｻ・ｯ髯ｷ鮃ｹ莠らｸｺ蜥擾ｽｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ郢ｧ繝ｻ繝ｻ驍ｵ・ｺ繝ｻ・ｧ髮趣ｽｺ繝ｻ・ｷ髯ｷ・ｷ陟暮ｯ会ｽｽ蟶晢ｽｫ・ｦ繝ｻ・ｲ驍ｵ・ｺ隰ｦ・ｰ繝ｻ・ｼ郢晢ｽｻ
    const st = G.seasonStats || {};
    if (offW <= 1) {
      const src = st;
      const profit = (src.totalRevenue || 0) - (src.totalExpense || 0);
      // 髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ驛｢・ｧ髮区ｧｭ繝ｻ鬮ｫ・ｪ髢ｧ・ｲ繝ｻ・ｮ隴会ｽｦ繝ｻ・ｼ郢晢ｽｻ.rankings驍ｵ・ｺ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬯ｮ・｢陷ｿ・･繝ｻ・ｧ陋ｹ・ｺ陷・ｽｾ髴難ｽ､繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｧ髫ｴ蜴・ｽｽ・ｴ髫ｴ繝ｻ・ｽ・ｰ驍ｵ・ｺ隴ｴ・ｧ繝ｻ・ｭ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｾ驛｢・ｧ闕ｵ譏ｶ陞ｺ驛｢・ｧ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
      const _recapRankings = Engine.ranking.updateRankings(G);
      const recapRank = Engine.ranking.getPlayerRank(_recapRankings);
      const recapRankColor = recapRank===1?'var(--gold)':recapRank===2?'#e74c3c':recapRank===3?'#9b59b6':'#2ecc71';
      const _recapSeason = G.season;
      html += `<div style="background:linear-gradient(135deg,rgba(212,168,67,0.08),rgba(241,196,15,0.04));border:1px solid rgba(212,168,67,0.2);border-radius:8px;padding:16px;margin-bottom:16px">
        <h4 style="color:var(--gold);margin-bottom:12px;font-size:14px">・滓ｨ雁・ 驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ${_recapSeason} 驛｢譎｢・ｽ・ｬ驛｢譎・ｺ｢郢晢ｽｻ驛｢譏ｴ繝ｻ/h4>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
          <div style="text-align:center;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px">
            <div style="font-size:20px;font-weight:900;color:${recapRankColor}">${recapRank || '-'}髣厄ｽｴ郢晢ｽｻ/div>
            <div style="font-size:12px;color:var(--text-dim)">髫ｴ蟠｢ﾂ鬩搾ｽｨ郢ｧ繝ｻ蟶ｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ</div>
          </div>
          <div style="text-align:center;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px">
            <div style="font-size:20px;font-weight:900;color:#2ecc71">${src.showCount || 0}</div>
            <div style="font-size:12px;color:var(--text-dim)">鬮｣莨√Γ繝ｻ・｡驕停・・ｹ謌雁ｲｷ繝ｻ・ｬ髫ｰ・ｨ繝ｻ・ｰ</div>
          </div>
          <div style="text-align:center;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px">
            <div style="font-size:20px;font-weight:900;color:#3498db">${src.bestMQ || 0}</div>
            <div style="font-size:12px;color:var(--text-dim)">髫ｴ蟠｢ﾂ鬯ｯ・ｮ陟岱</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
          <div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px">
            <span style="color:var(--text-dim)">髯ｷ・ｿ陷ｿ螟懶ｽｫ・ｪ:</span>
            <span style="color:${profit>=0?'#2ecc71':'#e74c3c'};font-weight:700">${profit>=0?'+':''}${profit.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span>
            <span style="color:var(--text-dim);font-size:12px">(髯ｷ・ｿ郢晢ｽｻ{(src.totalRevenue||0).toLocaleString()} / 髫ｰ・ｾ繝ｻ・ｯ${(src.totalExpense||0).toLocaleString()})</span>
          </div>
          <div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px">
            <span style="color:var(--text-dim)">驛｢譎・ｱ堤ｹ晢ｽｻ驛｢・ｧ繝ｻ・ｯ鬮ｮ蟲ｨ繝ｻ遶包ｽ｡:</span>
            <span style="color:var(--gold);font-weight:700">${(src.peakFunds||0).toLocaleString()}髣包ｽｳ郢晢ｽｻ/span>
          </div>
          ${src.bestMQMatch ? `<div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px;grid-column:span 2">
            <span style="color:var(--text-dim)">驛｢譎冗函邵ｺ蟶ｷ・ｹ譎冗樟郢晢ｽｻ驛｢譏ｴ繝ｻ郢晢ｽ｡:</span>
            <span style="color:var(--text-main)">${src.bestMQMatch}</span>
            <span style="color:#3498db;font-weight:700">MQ${src.bestMQ}</span>
          </div>` : ''}
          ${(src.eventsWon || src.eventsLost) ? `<div style="padding:6px 8px;background:rgba(0,0,0,0.15);border-radius:4px;grid-column:span 2">
            <span style="color:var(--text-dim)">髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ髣･・ｲ髣費｣ｰ郢晢ｽｻ</span>
            <span style="color:#2ecc71">${src.eventsWon||0}髯ｷ髦ｪ繝ｻ/span> / <span style="color:#e74c3c">${src.eventsLost||0}髫ｰ・ｨ郢晢ｽｻ/span>
          </div>` : ''}
        </div>
      </div>`;
    }

    // Show recent events from game log related to current offseason
    const recentEvents = G.gameLog.filter(e => e.includes('驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ') || e.includes('驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ') || e.includes('髯溽ｬｬ蝮ｩ・つ・つ') || e.includes('髴托ｽｯ繝ｻ・ｲ髯溯ｼ斐・) || e.includes('鬩募∞・ｽ・ｻ鬩債郢晢ｽｻ) || e.includes('鬮ｯ・ｦ繝ｻ・ｰ鬯ｨ・ｾ・つ') || e.includes('髫ｰ謔滂ｽｮ・｣髢ｨ繝ｻ));
    const offEvents = recentEvents.slice(-15);
    if (offEvents.length > 0) {
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px;max-height:300px;overflow-y:auto">';
      html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">・滓ｨ頑帆 驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ驛｢譎｢・ｽ・ｬ驛｢譎・ｺ｢郢晢ｽｻ驛｢譏ｴ繝ｻ/h4>';
      offEvents.forEach(ev => {
        const isHighlight = ev.includes('髯溽ｬｬ蝮ｩ・つ・つ') || ev.includes('髴托ｽｯ繝ｻ・ｲ髯溯ｼ斐・) || ev.includes('鬩募∞・ｽ・ｻ鬩債郢晢ｽｻ);
        html += `<div style="font-size:11px;padding:2px 0;color:${isHighlight ? 'var(--text-main)' : 'var(--text-sub)'}">${ev}</div>`;
      });
      html += '</div>';
    }

    // Rankings summary during offseason
    if (G.rankings && G.rankings.length > 0) {
      html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px">';
      html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">・滓ｨ｣繝ｻ 髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ</h4>';
      G.rankings.forEach((r, i) => {
        const isPlayer = r.orgId === 'player';
        html += `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;${isPlayer ? 'color:var(--gold);font-weight:700' : 'color:var(--text-sub)'}">
          <span>${i+1}髣厄ｽｴ郢晢ｽｻ${r.name}</span><span>${r.rating}pt</span>
        </div>`;
      });
      html += '</div>';
    }

    const nextLabels = ['驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ驛｢譎｢・ｽ・ｬ驛｢譎・ｺ｢郢晢ｽｻ驛｢譎冗樟遶上・驕ｶ鄙ｫ繝ｻ, '驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎乗ｲｺ繝ｻ・ｴ繝ｻ・ｻ髯ｷ蟠趣ｽｼ謚ｫ繝ｻ 驕ｶ鄙ｫ繝ｻ, '鬩募∞・ｽ・ｻ鬩債鬮ｦ・ｪ邵ｺ閧ｲ・ｹ・ｧ繝ｻ・｣驛｢譎｢・ｽ・ｳ驛｢譎擾ｽｳ・ｨ邵ｺ閧ｲ・ｸ・ｺ繝ｻ・ｸ 驕ｶ鄙ｫ繝ｻ, '髫ｴ繝ｻ・ｽ・ｰ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬯ｮ・｢陷ｿ・･繝ｻ・ｹ郢晢ｽｻ驕ｶ鄙ｫ繝ｻ];
    const nextLabel = nextLabels[offW] || `驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬮ｫ・ｨ繝ｻ・ｬ${offW + 1}鬯ｨ・ｾ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｸ 驕ｶ鬘伜ｯ・
    const btnClass = offW >= 3 ? 'btn-gold' : 'btn-blue';
    html += `<div class="btn-row" style="margin-top:16px"><button class="btn ${btnClass}" onclick="advanceWeek()">${nextLabel}</button></div>`;

    el.innerHTML = html;
    return;
  }

  // 髫ｨ貂可髫ｨ貂可 REGULAR WEEK DISPLAY 髫ｨ貂可髫ｨ貂可
  const isShow = isShowWeek(G.week);
  const special = isSpecialShow(G.week);
  const ppv = isPPV(G.week);
  let typeLabel = isShow ? (ppv ? '・滓ｨ｣繝ｻ PPV' : special ? '驍よ亢繝ｻ髴大､ｲ・ｽ・ｹ髯具ｽｻ繝ｻ・･鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ : '・滓ｨ呈ｿｫ 鬮｣莨√Γ繝ｻ・｡驕偵・ﾂ繝ｻ・ｱ') : '・滓ｨ頑帆 鬯ｮ・ｱ隶壺・繝ｻ鬮ｯ・ｦ驕偵・ﾂ繝ｻ・ｱ';
  document.getElementById('weekTitle').textContent = G.offSeason ? `驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ ${G.offWeek}/4 驕ｯ・ｶ郢晢ｽｻ${typeLabel}` : `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ${typeLabel}`;

  html = '';

  if (G.weekPhase === 'manage') {
    // 髫ｨ貂可髫ｨ貂可 v0.95: Dashboard Panel 髫ｨ貂可髫ｨ貂可
    const qtr = QUARTER_LABELS[getQuarter(G.week)] || '・滓ｨ奇ｽｸ繝ｻ髫ｴ謫ｾ・ｽ・･';
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
    if (nextShow && nextShow > G.week) upcomingItems.push(`・滓ｨ呈ｿｫ 髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ 鬮ｫ・ｨ繝ｻ・ｬ${nextShow}鬯ｨ・ｾ繝ｻ・ｱ`);
    else if (nextShow === G.week) upcomingItems.push('・滓ｨ呈ｿｫ 髣疲・・ｼ繝ｻﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｯ鬮｣莨√Γ繝ｻ・｡驕偵・ﾂ繝ｻ・ｱ郢晢ｽｻ郢晢ｽｻ);
    if (isPPV(G.week)) upcomingItems.push('・滓ｨ｣繝ｻ PPV鬯ｨ・ｾ繝ｻ・ｱ郢晢ｽｻ郢晢ｽｻ);
    else { const ppvW = (() => { for (let w = G.week+1; w <= 48; w++) if (isPPV(w)) return w; return null; })(); if (ppvW) upcomingItems.push(`・滓ｨ｣繝ｻ PPV: 鬮ｫ・ｨ繝ｻ・ｬ${ppvW}鬯ｨ・ｾ繝ｻ・ｱ`); }
    if (!isPPV(G.week)) {
      if (isSpecialShow(G.week)) upcomingItems.push('驍よ亢繝ｻ髣疲・・ｼ繝ｻﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｯ髴大､ｲ・ｽ・ｹ髯具ｽｻ繝ｻ・･鬮｣莨√Γ繝ｻ・｡鬲・ｼ夲ｽｽ・ｼ郢晢ｽｻ繝ｻ・ｼ鬩帙・・ｽ・ｩ繝ｻ・ｦ髯ｷ・ｷ陜捺ｻ難ｽ｣・ｧ+1郢晢ｽｻ郢晢ｽｻ);
      else { const spW = (() => { for (let w = G.week+1; w <= 48; w++) if (isSpecialShow(w) && !isPPV(w)) return w; return null; })(); if (spW) upcomingItems.push(`驍よ亢繝ｻ髴大､ｲ・ｽ・ｹ髯具ｽｻ繝ｻ・･鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ 鬮ｫ・ｨ繝ｻ・ｬ${spW}鬯ｨ・ｾ繝ｻ・ｱ`); }
    }
    if (G.pendingNegotiation) {
      const remainW = G.pendingNegotiation.resolveWeek - G.week;
      upcomingItems.push(`・滓ｩｸ・ｽ・､郢晢ｽｻ髣費｣ｰ繝ｻ・､髮九ｈ繝ｻ繝ｻ・ｸ繝ｻ・ｭ: ${G.pendingNegotiation.fighterName}郢晢ｽｻ陜捺ｻゑｽｽ・ｮ郢晢ｽｻ{remainW}鬯ｨ・ｾ繝ｻ・ｱ郢晢ｽｻ髣輔・;
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
          <span style="${G.week<=12?'color:var(--gold)':''}">・滓ｨ奇ｽｸ蟷・ｽｭ謫ｾ・ｽ・･</span>
          <span style="${G.week>12&&G.week<=24?'color:var(--gold)':''}">髫ｨ莨可郢晢ｽｻ闕ｳ讖ｸ・ｽ・､郢晢ｽｻ/span>
          <span style="${G.week>24&&G.week<=36?'color:var(--gold)':''}">・滓ｨ｣・ｫ蛟ｬﾂｧ郢晢ｽｻ/span>
          <span style="${G.week>36?'color:var(--gold)':''}">髫ｨ・ｶ郢晢ｽｻ繝ｻ・ｸ闕ｳ讒ｭ繝ｻ</span>
        </div>
      </div>
      <!-- Mini Ranking + Finance -->
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;color:var(--text-dim)">驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ <strong style="color:${pRank===1?'var(--gold)':pRank===2?'#e74c3c':pRank===3?'#9b59b6':'#2ecc71'};font-size:14px">#${pRank}</strong></span>
          <span style="font-size:11px;color:var(--text-dim)">鬮ｮ蟲ｨ繝ｻ遶包ｽ｡ <strong style="color:${G.funds>=0?'#2ecc71':'#e74c3c'};font-size:13px">${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ/strong></span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end">
          <div style="font-size:12px;color:var(--text-dim)">
            鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ{stats.showCount||0}髯懷干繝ｻ郢晢ｽｻ郢晢ｽｻMQ髫ｴ蟠｢ﾂ鬯ｯ・ｮ郢晢ｽｻ{stats.bestMQ||0}${stats.eventsWon ? ` 郢晢ｽｻ郢晢ｽｻ髫ｰ螢ｼ・ｶ・ｺ繝ｻ・ｺ郢晢ｽｻ{stats.eventsWon}髯ｷ閧ｴ莠ｨ : ''}
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
        <span style="color:var(--text-dim);flex-shrink:0">髫ｴ蟶吶・{weekInMonth}鬯ｨ・ｾ繝ｻ・ｱ鬨ｾ・ｶ繝ｻ・ｮ:</span>
        <span style="color:${netColor};font-weight:700">${mNet >= 0 ? '+' : ''}${mNet}髣包ｽｳ郢晢ｽｻ/span>
        <span style="color:var(--text-dim);font-size:11px">髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ${mIncome}髣包ｽｳ郢晢ｽｻ/ 髫ｰ・ｾ繝ｻ・ｯ髯ｷ繝ｻ・ｽ・ｺ${mExpense}髣包ｽｳ郢晢ｽｻ/span>
      </div>`;
    }

    // v1.4w: 驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ譏ｴ繝ｻ邵ｺ蜥ｲ・ｹ譎｢・ｽ・ｼ郢晢ｽｻ陋ｹ・ｻ郢晢ｽｫ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ驛｢譎√・郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ
    const tickerItems = G._tickerItems || [];
    if (tickerItems.length > 0) {
      const tickerText = tickerItems.join('驍ｵ・ｲ・つ驍ｵ・ｲ・つ');
      // 2髯懃軸・ｧ・ｫ郢晢ｽｻ鬩幢ｽ｢繝ｻ・ｰ驛｢・ｧ鬯伜∞・ｽ・ｿ隴∵腸・ｼ・ｰ驍ｵ・ｺ繝ｻ・ｦ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢譎｢・｣・ｰ驛｢譎｢・ｽ・ｬ驛｢・ｧ繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ
      html += `<div class="news-ticker-bar">
        <div class="news-ticker-track">
          <span class="news-ticker-text">${tickerText}驍ｵ・ｲ・つ驍ｵ・ｲ・つ${tickerText}</span>
        </div>
      </div>`;
    }

    // Upcoming events strip
    if (upcomingItems.length > 0) {
      html += `<div style="display:flex;gap:12px;margin-bottom:10px;font-size:12px;color:var(--text-dim);flex-wrap:wrap">${upcomingItems.map(item => `<span style="padding:2px 6px;background:rgba(212,168,67,0.06);border:1px solid rgba(212,168,67,0.12);border-radius:3px">${item}</span>`).join('')}</div>`;
    }

    // 髫ｨ貂可髫ｨ貂可 v0.97: SURVIVAL GAUGE PANEL 髫ｨ貂可髫ｨ貂可
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
          <span style="font-size:16px">髫ｨ・ｵ繝ｻ・ｽ</span> 鬩搾ｽｨ隰疲ｻ・ず驛｢・ｧ繝ｻ・ｵ驛｢譎√・邵ｺ繝ｻ・ｹ譎√・・弱・
        </span>
        <span class="survival-phase-badge" style="background:${sPhase?.color || '#e74c3c'}22;color:${sPhase?.color || '#e74c3c'};border:1px solid ${sPhase?.color || '#e74c3c'}44">
          ${sPhase?.emoji || '・滓ｨ｣邂・} ${sPhase?.label || '髫俶誓・ｽ・､髯昴・ﾂ諛医・髴托ｽｯ郢晢ｽｻ}
        </span>
      </div>`;

      // Fuel gauge
      html += '<div class="survival-body">';
      html += `<div class="survival-gauge-track">
        <div class="survival-gauge-fill ${gaugeColor}" style="width:${sFuel}%">
          <span class="survival-gauge-label">${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span>
        </div>
      </div>`;

      // Milestone markers
      html += '<div class="survival-gauge-markers">';
      sMilestones.forEach(m => {
        const cls = m.done ? 'cleared' : (m === sMilestones.find(x => !x.done) ? 'active' : '');
        html += `<span class="survival-gauge-marker ${cls}" title="${m.desc}">${m.done ? '髫ｨ・ｨ郢晢ｽｻ : '驕ｲ・ｮ郢晢ｽｻ} ${m.label}</span>`;
      });
      html += '</div>';

      // Key stats
      html += '<div class="survival-stats">';
      // Weekly burn rate
      const netColor = sNet.weeklyNet >= 0 ? '#2ecc71' : '#e74c3c';
      const netSign = sNet.weeklyNet >= 0 ? '+' : '';
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${netColor}">${netSign}${sNet.weeklyNet}髣包ｽｳ郢晢ｽｻ/span>
        <span class="survival-stat-label">髫ｰ證ｦ・ｽ・ｨ髯橸ｽｳ陞滄搨ﾂ繝ｻ・ｱ鬯ｮ・｢霓｣莨懶ｽｺ・ｶ髫ｰ・ｾ繝ｻ・ｯ</span>
      </div>`;
      // Weeks until bankrupt
      if (sNet.weeklyNet < 0) {
        const urgency = sWeeks <= 10 ? '#e74c3c' : sWeeks <= 20 ? '#e67e22' : '#f1c40f';
        html += `<div class="survival-stat">
          <span class="survival-stat-val" style="color:${urgency}">髫ｹ・ｿ闕ｵ譎｢・ｽ繝ｻ{sWeeks}鬯ｨ・ｾ繝ｻ・ｱ</span>
          <span class="survival-stat-label">髯区ｺｷ・ｰ・､髢ｧ繝ｻ・ｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｮ髴托ｽｪ繝ｻ・ｶ髣費｣ｰ郢晢ｽｻ/span>
        </div>`;
      } else {
        html += `<div class="survival-stat">
          <span class="survival-stat-val" style="color:#2ecc71">髯橸ｽｳ霑壼生繝ｻ</span>
          <span class="survival-stat-label">鬮ｮ蟲ｨ繝ｻ遶包ｽ｡髴托ｽ･繝ｻ・ｶ髮手ｼ斐・/span>
        </div>`;
      }
      // Rolling 4-week net (monthly profit indicator)
      const buf = G.recentWeeklyNet || [0,0,0,0];
      const rollingSum = buf.reduce((a,b) => a+b, 0);
      const r4count = G.rollingNet4Count || 0;
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${rollingSum >= 0 ? '#2ecc71' : r4count > 0 ? '#f1c40f' : 'var(--text-dim)'}">${rollingSum >= 0 ? '+' : ''}${rollingSum}髣包ｽｳ郢晢ｽｻ/span>
        <span class="survival-stat-label">髫ｴ蟶帶ｲｺ繝ｻ・ｬ繝ｻ・｡髯ｷ・ｿ陷ｿ螟懶ｽｫ・ｪ(4鬯ｨ・ｾ繝ｻ・ｱ)</span>
      </div>`;
      // Weekly expense
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:#e74c3c">-${sNet.totalExpense}髣包ｽｳ郢晢ｽｻ/span>
        <span class="survival-stat-label">鬯ｨ・ｾ繝ｻ・ｱ鬯ｮ・｢隰撰ｽｺ鬯ｮ・ｪ髯ｷ繝ｻ・ｽ・ｺ</span>
      </div>`;
      // Weekly base income
      html += `<div class="survival-stat">
        <span class="survival-stat-val" style="color:${sNet.totalBaseIncome > 0 ? '#2ecc71' : 'var(--text-dim)'}">${sNet.totalBaseIncome > 0 ? '+' : ''}${sNet.totalBaseIncome}髣包ｽｳ郢晢ｽｻ/span>
        <span class="survival-stat-label">髯懈圜・ｽ・ｺ髯橸ｽｳ陞｢・ｼ陟趣ｽｶ髯ｷ闌ｨ・ｽ・･</span>
      </div>`;
      html += '</div>'; // .survival-stats

      // Tip text
      if (sPhase && sPhase.id === 'red') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          ・滓ｧｫ・ｺ繝ｻ<strong style="color:#f1c40f">鬨ｾ・ｶ繝ｻ・ｮ髫ｶ阮吶・</strong> 髯区ｺｷ・ｰ・､髢ｧ繝ｻ・ｸ・ｺ陷ｷ・ｶ繝ｻ邇匁≧鬮ｦ・ｪ遶企ｦｴ・ｮ貅ｯ・ｲ讖ｸ・ｽ・ｭ驕会ｽｼ繝ｻ・ｵ隰疲ｻ・ず驍ｵ・ｺ繝ｻ・ｫ髫ｰ蝠上・隨・ｽｲ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ繝ｻ繝ｻ・ｸ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陞｢・ｹ郢晢ｽｻ鬮｣莨√Γ繝ｻ・｡陟暮ｯ会ｽｽ蟶晢ｽｫ・｢陷ｿ・･邵ｺ螳茨ｽｸ・ｺ陷会ｽｱ遯ｶ・ｻ髣費｣ｰ繝ｻ・ｺ髮取ぁ蟷ｲ繝ｻ螳壼初驗呻ｽｫ繝ｻ・｡驍ｵ・ｲ遶丞｣ｹ笳矩Δ譎・ｺ｢・趣ｽｦ驛｢・ｧ繝ｻ・ｵ驛｢譎｢・ｽ・ｼ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ郢晢ｽｻ闔蛹・ｽｽ・ｺ繝ｻ・ｺ髮主ｾ後・0驍ｵ・ｲ隲幢ｽｶ繝ｻ・ｼ陝ｲ・ｨ繝ｻ螳夲ｽｿ・ｯ繝ｻ・ｲ髯溷供蟷ｲ隨倥・・ｹ・ｧ闕ｵ譏ｴ繝ｻ驍ｵ・ｺ隶呵ｶ｣・ｽ・ｬ繝ｻ・ｬ髣包ｽｳ・つ髮弱・・ｽ・ｩ驍ｵ・ｲ郢晢ｽｻ
        </div>`;
      } else if (sPhase && sPhase.id === 'orange') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          ・滓ｧｫ・ｺ繝ｻ髫俶誓・ｽ・､髯昴・蟷ｲ遯ｶ・ｲ鬩搾ｽｵ繝ｻ・ｮ髯昴・・ｸ螂・ｽｼ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｻ・ｻ繝ｻ・ｼ郢晢ｽｻ髣費｣ｰ繝ｻ・ｺ髮取ぁ蟷ｲ繝ｻ螳壼初驗呻ｽｫ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｦ驛｢・ｧ繝ｻ・ｹ驛｢譎・ｺ｢・趣ｽｦ驛｢・ｧ繝ｻ・ｵ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｻ髫ｰ・ｾ繝ｻ・ｾ髫ｴ謫ｾ・｣・ｰ髫ｶ髮｣・ｽ・ｩ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ驛｢・ｧ髮区ｩｸ・ｽ・｢陷会ｽｱ繝ｻ繝ｻ・ｸ・ｺ陷会ｽｱ・つ遶擾ｽｵ鬪ｭ螳｣ﾂ・ｶ鬮ｮ竏壹・髯晢ｽｯ陷翫・笳矩Δ・ｧ陞ｳ螟ｲ・ｽ・ｶ郢晢ｽｻ遶擾ｽｴ驛｢・ｧ陋ｹ・ｻ遶包ｽｧ驍ｵ・ｲ郢晢ｽｻ
        </div>`;
      } else if (sPhase && sPhase.id === 'yellow') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          ・滓ｧｫ・ｺ繝ｻ驍ｵ・ｺ郢ｧ繝ｻ繝ｻ髯昴・・ｻ・｣繝ｻ・ｰ郢晢ｽｻ郢晢ｽｻ4鬯ｨ・ｾ繝ｻ・ｱ鬯ｨ・ｾ繝ｻ・｣鬩搾ｽｯ陞｢・ｹ邵ｲ蟶晢ｽｮ貅ｯ・ｲ讖ｸ・ｽ・ｭ陷会ｽｱ繝ｻ螳壽弱・・ｺ驍ｵ・ｺ陷会ｽｱ・つ遶擾ｽｬ繝ｻ・ｳ郢晢ｽｻ遶包ｽ｡3,000髣包ｽｳ郢晢ｽｻ繝ｻ・ｻ繝ｻ・･髣包ｽｳ驗呻ｽｫ繝ｻ蟶昴￠繝ｻ・ｭ髫ｰ蝠上・隨倥・・ｹ・ｧ陟募ｾ後・鬩搾ｽｨ隰疲ｻ・ず髯橸ｽｳ霑壼遜・ｽ・ｮ陞｢・ｼ陜滂ｽｧ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢郢晢ｽｻ郢晢ｽｻ
        </div>`;
      } else if (sPhase && sPhase.id === 'green') {
        html += `<div style="margin-top:8px;font-size:12px;color:var(--text-dim);line-height:1.5;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:4px">
          ・滓ｧｫ・ｺ繝ｻ鬲・ｺｯ・ｲ讖ｸ・ｽ・ｭ髣埼屮・ｽ・ｻ繝ｻ・｢髫ｰ・ｰ陝ｷ繝ｻ・ｼ繝ｻ・ｬ譴ｧ閻ｸ繝ｻ・ｼ郢晢ｽｻ驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ鬮ｫ・ｱ繝ｻ・ｿ髯昴・繝ｻ邵ｲ繝ｻ{4 - (G.survivalProfitStreak || 0)}鬯ｨ・ｾ繝ｻ・ｱ鬯ｮ・｢鬯･・ｴ繝ｻ・ｻ髮区ｩｸ・ｽ・ｭ陷会ｽｱ繝ｻ蟶昴￠繝ｻ・ｭ髫ｰ蝠上・隨倥・・ｹ・ｧ陟募ｾ後・驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢郢晢ｽｻ郢晢ｽｻ繝ｻ・ｼ髢ｧ・ｲ隶捺ｺｯ闊峨・・ｨ驍ｵ・ｺ繝ｻ・ｮ鬮ｮ蟲ｨ繝ｻ遶包ｽ｡: ${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ{G.funds < 3000 ? ` / 鬨ｾ・ｶ繝ｻ・ｮ髫ｶ阮吶・,000髣包ｽｳ郢ｻ繝ｻ: ''}郢晢ｽｻ郢晢ｽｻ
        </div>`;
      }

      html += '</div></div>'; // .survival-body, .survival-panel
    }

    // 髫ｨ貂可髫ｨ貂可 v0.96: MISSION PANEL 髫ｨ貂可髫ｨ貂可
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
        <span class="mission-panel-title"><span class="mission-icon">・滓ｩｸ・ｽ・ｧ繝ｻ・ｭ</span> 驛｢譎・ｽｺ蛟･ﾎ暮Δ・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ <span style="font-size:12px;font-weight:400;color:var(--text-dim);font-family:'Noto Sans JP',sans-serif">${prog.done}/${prog.total}</span></span>
        <span class="mission-panel-toggle" onclick="App.toggleMission(false)">髫ｨ・ｨ郢晢ｽｻ鬯ｮ・ｱ隶壹・・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ陷ｷ・ｶ繝ｻ繝ｻ/span>
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
            <div class="mission-check ${m.done ? 'done' : 'pending'}">${m.done ? '髫ｨ・ｨ郢晢ｽｻ : ''}</div>
            <div class="mission-body">
              <div class="mission-name ${m.done ? 'done' : ''}">${m.icon} ${m.name}</div>
              ${!m.done ? `<div class="mission-desc">${m.desc}</div>` : ''}
            </div>
            ${!m.done && m.screen ? `<span class="mission-goto" onclick="event.stopPropagation();gotoScreen('${m.screen}')">驕ｶ鄙ｫ繝ｻ鬯ｮ・｢闕ｵ譎｢・ｿ・･</span>` : ''}
            ${pendingClear ? '<span class="mission-clear-hint">tap!</span>' : ''}
          </div>`;
        }
      }
      html += '</div></div>';
    } else {
      // Show small re-enable button
      html += `<div style="margin-bottom:10px;text-align:right"><span class="mission-enable-btn" onclick="App.toggleMission(true)">・滓ｩｸ・ｽ・ｧ繝ｻ・ｭ 驛｢譎・ｽｺ蛟･ﾎ暮Δ・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ</span></div>`;
    }

    const heat = getHeatLevel();
    const injuredCount = G.roster.filter(c => c.injury).length;
    html += `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:var(--text-sub)">
      <span>Heat: <span style="color:${heat.color};font-weight:700">${heat.emoji} ${heat.label}郢晢ｽｻ隴牙干繝ｻ{heat.mult}郢晢ｽｻ郢晢ｽｻ/span></span>
      ${injuredCount > 0 ? `<span style="color:#e17055">・滓ｧｫ鄂ｰ 鬮ｮ蜈ｷ・｣・ｰ髯具ｽｯ繝ｻ・ｷ鬮｢・ｰ郢晢ｽｻ ${injuredCount}髯ｷ・ｷ郢晢ｽｻ/span>` : ''}
      ${G.coaches.length > 0 ? `<span style="color:#2ecc71">・滓ｨ｣蟇･ 驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ ${G.coaches.length}髯ｷ・ｷ郢晢ｽｻ/span>` : ''}
    </div>`;
    html += `<p style="margin-bottom:12px;color:var(--text-sub)">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ鬯ｨ・ｾ繝ｻ・ｱ鬯ｮ・｢髦ｮ蜷ｶ笳矩Δ・ｧ繝ｻ・ｱ驛｢・ｧ繝ｻ・ｸ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ驛｢・ｧ陜｣・､繝ｻ・｢繝ｻ・ｺ鬮ｫ・ｱ鬮ｦ・ｪ繝ｻ・ｰ驍ｵ・ｲ郢晢ｽｻ{isShow ? '鬮｣莨√Γ繝ｻ・｡隴ｴ・ｧ繝ｻ・ｺ鬮｢ﾂ繝ｻ蜥擾ｽｸ・ｺ繝ｻ・ｫ鬯ｨ・ｾ繝ｻ・ｲ驛｢・ｧ髦ｮ蜷ｶﾂ蝣､・ｸ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｼ繝ｻ : '鬯ｨ・ｾ繝ｻ・ｱ驛｢・ｧ陝ｶ謨鳴繝ｻ・ｲ驛｢・ｧ遶丞｣ｺﾂ・ｻ驍ｵ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｼ繝ｻ}驍ｵ・ｲ郢晢ｽｻ/p>`;

    // v1.0: Primary action buttons 驕ｯ・ｶ郢晢ｽｻtop-left, large, prominent
    html += '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">';
    if (isShow) {
      html += '<button class="btn btn-gold" onclick="startShowPrep()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">・滓ｨ呈ｿｫ 鬮｣莨√Γ繝ｻ・｡隴ｴ・ｧ繝ｻ・ｺ鬮｢ﾂ繝ｻ蜥擾ｽｸ・ｺ繝ｻ・ｸ 驕ｶ鄙ｫ繝ｻ/button>';
    } else {
      html += '<button class="btn btn-gold" onclick="doProcessWeek()" style="font-size:16px;padding:12px 28px;font-weight:700;letter-spacing:0.5px">驕ｶ・｢繝ｻ・ｩ 鬯ｨ・ｾ繝ｻ・ｱ驛｢・ｧ髮区ｧｭ繝ｻ鬨ｾ繝ｻ繝ｻ/button>';
    }
    html += '<button class="btn" onclick="App.autoManage()" style="font-size:14px;padding:10px 20px;background:rgba(46,204,113,0.12);color:#2ecc71;border:1px solid rgba(46,204,113,0.3);font-weight:600" title="髣厄ｽｴ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ驍ｵ・ｺ繝ｻ・ｫ髯滂ｽ｢隲帷腸・ｧ驍ｵ・ｺ繝ｻ・ｦ髯滓汚・ｽ・ｷ髯具ｽｹ鬯滂ｽｽN/OFF驛｢・ｧ陷ｻ蝓淞蜥趣ｽｩ蛹・ｽｽ・ｩ髯具ｽｹ隰費ｽｶ繝ｻ・ｰ驍ｵ・ｲ遶擾ｽｽ繝ｻ・ｽ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ60髫ｴ蟷｢・ｽ・ｪ髮九・ﾂ驍ｵ・ｺ繝ｻ・ｮ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ螳夊ｳ魄・ｽｹ繝ｻ・､驗呻ｽｫ遶企豪・ｸ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ閠ｳ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ髫ｴ繝ｻ・ｽ・ｹ鬯ｩ・･隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｾ鬩搾ｽｯ繝ｻ・ｭ髫ｰ蝠上・繝ｻ繝ｻ・ｹ・ｧ陟募ｨｯ遨宣し・ｺ郢晢ｽｻ>・滓ｩｸ・ｽ・､郢晢ｽｻ驍ｵ・ｺ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ闕ｵ譏ｶ髮ｷ</button>';
    html += `<button class="btn" onclick="App.openCareModal()" style="font-size:14px;padding:10px 20px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-weight:600" title="鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｮ繝ｻ驍ｵ・ｺ繝ｻ・ｮ鬮ｮ蟲ｨ繝ｻ遶包ｽ｡髫ｰ螢ｼ萓帷ｹ晢ｽｻ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ">・滓ｧｫ蟷・驛｢・ｧ繝ｻ・ｱ驛｢・ｧ繝ｻ・｢</button>`;
    html += '</div>';

    // Roster schedule overview
    const canManageWeek = G.weekPhase === 'manage';
    html += '<table class="data-table"><tr><th>髯ｷ・ｷ隶朱｡披・</th><th>鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ/th><th>髣厄ｽｴ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ</th><th>髴托ｽ･繝ｻ・ｶ髫ｲ・ｷ郢晢ｽｻ/th><th>驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｱ驛｢・ｧ繝ｻ・ｸ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ <span class="info-tip" title="鬮｢・ｧ繝ｻ・ｲ髫ｰ謔溘・陝・ｿ鬯ｩ・･隴擾ｽｴ繝ｻ蟶晢ｽｩ蛹・ｽｽ・ｸ髫ｰ螢ｽ・ｧ・ｭ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ・ｽ・ｽ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ60髫ｴ蟷｢・ｽ・ｪ髮九・ﾂ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ闕ｵ譏ｶ繝ｻ髫ｴ繝ｻ・ｽ・ｹ鬯ｩ・･隴擾ｽｴ遶企ｦｴ・ｫ・｢繝ｻ・｢驛｢・ｧ闕ｳ螂・ｽｽ閾･・ｸ・ｺ陞溽ｿｫ繝ｻ髯ｷ蟠趣ｽｼ譁青螳夊ｳ魄・ｽｹ繝ｻ・､驗呻ｽｫ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻ>鬩阪・・ｽ・ｹ郢晢ｽｻ郢晢ｽｻ/span></th><th>髫ｨ讖ｸ・ｽ・｡</th><th>髣疲・・ｼ繝ｻﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｮ鬮ｯ・ｦ隰疲ｺｯ蜉・/th></tr>';
    G.roster.forEach(c => {
      const condPct = c.condition;
      const condCls = condPct > 66 ? 'high' : condPct > 33 ? 'mid' : 'low';
      const actionLabels = {practice:'鬩搾ｽｱ繝ｻ・ｴ鬩怜生繝ｻ,promo:'驛｢譎丞ｹｲ・取ｺｽ・ｹ譎｢・ｽ・｢',rest:'髣費ｽｨ魄・ｽｹ繝ｻ・､郢晢ｽｻ,auto_rest:'・滓ｧｫ・｣・ｲ髣費ｽｨ魄・ｽｹ繝ｻ・､郢晢ｽｻ,balance:'驛｢譎√・・主ｸｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｹ','鬨ｾ荵晢ｽ九・・､郢晢ｽｻ:'鬨ｾ荵晢ｽ九・・､郢晢ｽｻ,intensive:'髫ｨ讖ｸ・ｽ・｡髯滓汚・ｽ・ｷ髯具ｽｹ郢晢ｽｻ};
      const statusHtml = c.injury
        ? `<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(214,48,49,0.15);color:${c.injury.color};border:1px solid ${c.injury.color}40">${c.injury.type} ${c.injury.weeksLeft}鬯ｨ・ｾ繝ｻ・ｱ</span>`
        : c.forcedRest
          ? '<span style="font-size:12px;padding:2px 7px;border-radius:3px;background:rgba(52,152,219,0.15);color:#3498db;border:1px solid rgba(52,152,219,0.4)">・滓ｧｫ・ｯ・･ 髣費ｽｨ魄・ｽｹ繝ｻ・､髮榊・・ｽ・ｸ繝ｻ・ｭ</span>'
          : '<span style="font-size:12px;color:#2ecc71">髯句ｹ｢・ｽ・･髯溯ｶ｣・ｽ・ｷ</span>';
      const schedDisabled = c.injury ? 'disabled' : '';
      const wkChampBadge = G.titles.world.championId === c.id ? ' <span style="color:var(--gold);font-size:12px">・滓ｫ∬・</span>' : '';
      // Intensive button for week screen
      const isInjured = !!c.injury;
      const isResting = c.condition <= 30;
      const canInt = canManageWeek && !isInjured && !isResting && c.condition >= GROWTH_CONFIG.intensiveMinCond && c.intensiveWeeks < GROWTH_CONFIG.intensiveMaxConsec;
      let intBtnHtml = '';
      if (isInjured || isResting) {
        intBtnHtml = '<span style="font-size:12px;color:var(--text-dim)">--</span>';
      } else if (!canManageWeek) {
        intBtnHtml = c.intensive ? '<span style="font-size:12px;color:#ffa500">髫ｨ讖ｸ・ｽ・｡ON</span>' : '';
      } else {
        const warnTitle = c.intensiveWeeks >= GROWTH_CONFIG.intensiveMaxConsec ? '鬯ｨ・ｾ繝ｻ・｣鬩搾ｽｯ陞｢・ｻ繝ｻ・ｸ闔ｨ竏晏ｿ・ : c.condition < GROWTH_CONFIG.intensiveMinCond ? '髣厄ｽｴ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ髣包ｽｳ陝雜｣・ｽ・ｶ繝ｻ・ｳ' : '';
        intBtnHtml = `<button class="btn-intensive${c.intensive?' active':''}" onclick="toggleIntensive(${c.id})" ${canInt || c.intensive ? '' : `disabled title="${warnTitle}"`}>髫ｨ讖ｸ・ｽ・｡</button>`;
      }
      // v1.0: Compute predicted action for initial display
      // 驕ｯ・ｶ繝ｻ・ｻ _weekAction 驍ｵ・ｺ繝ｻ・ｯ髯ｷ螟ｧ豸ｵ・つ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｮ鬮ｫ・ｪ陋滂ｽｬ魄厄ｽｸ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ髯ｷ・ｿ郢ｧ蟲ｨ繝ｻ驍ｵ・ｺ陷会ｽｱ遶企・・ｸ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻ・ｽ・ｸ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｫ髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｱ驛｢・ｧ繝ｻ・ｸ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ驍ｵ・ｺ闕ｵ譎｢・ｽ陋ｾ・りｫ､諛翫・驍ｵ・ｺ陷ｷ・ｶ繝ｻ繝ｻ
      let previewAction;
      if (c.injury) previewAction = '鬨ｾ荵晢ｽ九・・､郢晢ｽｻ;
      else if (c.intensive) previewAction = 'intensive';
      else {
        previewAction = c.schedule || 'balance';
        if (previewAction === 'balance') previewAction = isShow ? 'promo' : 'practice';
        if (c.condition < 60) previewAction = 'auto_rest';
      }
      const previewLabel = actionLabels[previewAction] || previewAction;
      html += `<tr${c.injury ? ' style="opacity:0.65"' : ''}>
        <td><strong>${c.name}</strong>${wkChampBadge}</td>
        <td class="num">${ov(c)}</td>
        <td><div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div> ${condPct}</td>
        <td>${statusHtml}</td>
        <td>
          <select onchange="updateSchedulePreview(${c.id},this.value)" style="font-size:15px;padding:8px 12px;border-radius:6px;min-width:120px" ${schedDisabled}>
            <option value="balance" ${c.schedule==='balance'?'selected':''} title="鬯ｮ・ｱ隶壺・繝ｻ鬮ｯ・ｦ驕偵・ﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｯ鬩搾ｽｱ繝ｻ・ｴ鬩怜雀繝ｻ・つ遶擾ｽｬ郢晢ｽｻ鬮ｯ・ｦ驕偵・ﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｯ驛｢譎丞ｹｲ・取ｺｽ・ｹ譎｢・ｽ・｢驛｢・ｧ陞ｳ螢ｹ繝ｻ髯ｷ閧ｴ蝮ｩ遶城メ・ｬ螢ｽ・ｧ・ｭ・つ郢ｧ螂・ｽｽ・ｿ繝ｻ・ｷ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ雋・∞・ｽ閾･・ｸ・ｺ髦ｮ蜻ｻ・ｽ讙趣ｽｸ・ｲ郢ｧ繝ｻ・ｽ・ｽ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ60髫ｴ蟷｢・ｽ・ｪ髮九・ﾂ驍ｵ・ｺ繝ｻ・ｧ鬮｢・ｾ繝ｻ・ｪ髯ｷ蜥ｲ・ｩ繧托ｽｽ・ｼ魄・ｽｹ繝ｻ・､驗呻ｽｫ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ>驛｢譎√・・主ｸｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｹ</option>
            <option value="practice" ${c.schedule==='practice'?'selected':''} title="髮主沺諢包ｾつ繝ｻ・ｱ鬩搾ｽｱ繝ｻ・ｴ鬩怜雀繝ｻ繝ｻ蟶晏距陟暮ｯ会ｽｼ讓抵ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ笳矩Δ譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・ｹ髫ｰ謔滂ｽｮ・｣髢ｨ讓抵ｽｸ・ｺ繝ｻ・ｫ鬯ｮ・ｮ郢晢ｽｻ繝ｻ・ｸ繝ｻ・ｭ驍ｵ・ｺ陷会ｽｱ隨ｳ繝ｻ・ｸ・ｺ郢晢ｽｻ陷・ｽｾ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｲ郢ｧ繝ｻ・ｽ・ｽ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ60髫ｴ蟷｢・ｽ・ｪ髮九・ﾂ驍ｵ・ｺ繝ｻ・ｧ鬮｢・ｾ繝ｻ・ｪ髯ｷ蜥ｲ・ｩ繧托ｽｽ・ｼ魄・ｽｹ繝ｻ・､驗呻ｽｫ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ>鬩搾ｽｱ繝ｻ・ｴ鬩怜揃・ｲ讓樒・髯ｷ蛹ｻ繝ｻ/option>
            <option value="promo" ${c.schedule==='promo'?'selected':''} title="髮主沺諢包ｾつ繝ｻ・ｱ驛｢譎丞ｹｲ・取ｺｽ・ｹ譎｢・ｽ・｢髮趣ｽ｢繝ｻ・ｻ髯ｷ蟠趣ｽｼ雋ｻ・ｽ蟶晏距陟暮ｯ会ｽｼ讓抵ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ・ｽ・ｺ繝ｻ・ｺ髮取ぁ蟷ｲ繝ｻ螳壼初驗呻ｽｫ繝ｻ・｡驍ｵ・ｺ雋・∞・ｼ讚・ｽｭ蠑ｱ・・ｫ願侭繝ｻ闔蛹・ｽｽ・ｸ闔ｨ竏晏ｿ・0郢晢ｽｻ陝ｲ・ｨ・つ郢ｧ繝ｻ・ｽ・ｽ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ60髫ｴ蟷｢・ｽ・ｪ髮九・ﾂ驍ｵ・ｺ繝ｻ・ｧ鬮｢・ｾ繝ｻ・ｪ髯ｷ蜥ｲ・ｩ繧托ｽｽ・ｼ魄・ｽｹ繝ｻ・､驗呻ｽｫ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ>驛｢譎丞ｹｲ・取ｺｽ・ｹ譎｢・ｽ・｢髯ｷ繝ｻ・ｽ・ｪ髯ｷ蛹ｻ繝ｻ/option>
            <option value="rest" ${c.schedule==='rest'?'selected':''} title="髯滓汚・ｽ・ｷ髯具ｽｻ繝ｻ・ｶ鬨ｾ・ｧ郢晢ｽｻ遶頑･｢閠ｳ魄・ｽｹ繝ｻ・､驗呻ｽｫ繝ｻ繝ｻ・ｸ・ｺ陝ｶ蜷ｮ遨宣し・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ・ｽ・ｽ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ鬩阪ｑ・ｽ・｡鬨ｾ繝ｻ繝ｻ繝ｻ閧ｲ・ｹ・ｧ驗呻ｽｫ繝ｻ繧具ｿ｡繝ｻ・ｺ髯橸ｽｳ雋・ｪ繝ｻ髣費ｽｨ闔会ｽ｣遶擾ｽｪ驍ｵ・ｺ陝ｶ蜷ｮ陞ｺ驍ｵ・ｺ郢晢ｽｻ陷・ｽｾ驍ｵ・ｺ繝ｻ・ｫ">髣費ｽｨ魄・ｽｹ繝ｻ・､闔ｨ竏夊｣滄ｫｫ霈斐・/option>
          </select>
        </td>
        <td>${intBtnHtml}</td>
        <td id="action-${c.id}"><span class="sched-tag ${previewAction}">${previewLabel}</span></td>
      </tr>`;
    });
    html += '</table>';
  }
  else if (G.weekPhase === 'weekSummary') {
    // v2.0-C3: Brief weekly summary 驕ｯ・ｶ郢晢ｽｻnon-month-end weeks stop here
    const dateStr = G.offSeason ? `驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ ${G.offWeek}/4` : Engine.util.formatDate(G.season, G.week);
    document.getElementById('weekTitle').textContent = `${dateStr} 驕ｯ・ｶ郢晢ｽｻ髯橸ｽｳ陟包ｽ｡繝ｻ・ｺ郢晢ｽｻ;
    // 鬨ｾ・ｶ繝ｻ・ｴ鬮ｴ莉｣繝ｻ鬯ｨ・ｾ繝ｻ・ｱ驛｢譎√・郢晢ｽ｣驛｢譎・ｽｼ譁撰ｼ憺Δ・ｧ陝ｶ譎擾ｽｯ遘伜搦髣鯉ｽｨ繝ｻ・ｼ郢晢ｽｻtryAutoAdvance 驍ｵ・ｺ繝ｻ・ｧ髯溷､懶ｽｦ・ｴ・つ繝ｻ・ｱ髯具ｽｻ郢晢ｽｻ遯ｶ・ｲ push 髮九ｇ迴ｾ遶擾ｽｩ郢晢ｽｻ郢晢ｽｻ
    const _wsCycleNum = Math.ceil(G.week / 4);
    const _wsMonthStart = (_wsCycleNum - 1) * 4 + 1;
    const wsBuf = (G.financeHistory || []).filter(h => h.season === G.season && h.week >= _wsMonthStart && h.week <= G.week);
    let wsIncome = 0, wsExpense = 0;
    wsBuf.forEach(e => { wsIncome += e.income || 0; wsExpense += e.expense || 0; });
    const wsNet = wsIncome - wsExpense;
    const netColor = wsNet >= 0 ? 'var(--green)' : 'var(--red)';
    const wsWeeks = wsBuf.map(e => e.week).filter(Boolean);
    const wsRange = wsWeeks.length > 1
      ? `鬮ｫ・ｨ繝ｻ・ｬ${Math.min(...wsWeeks)}鬯ｨ・ｾ繝ｻ・ｱ驍ｵ・ｲ隲帙・・ｽ・ｬ繝ｻ・ｬ${Math.max(...wsWeeks)}鬯ｨ・ｾ繝ｻ・ｱ`
      : `鬮ｫ・ｨ繝ｻ・ｬ${wsWeeks[0] || G.week}鬯ｨ・ｾ繝ｻ・ｱ`;
    html += `<div style="text-align:center;padding:24px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:16px">`;
    html += `<div style="font-size:16px;color:var(--text-main);margin-bottom:6px;font-weight:700">${dateStr} 髯橸ｽｳ陟包ｽ｡繝ｻ・ｺ郢晢ｽｻ/div>`;
    html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:12px">${wsRange} 鬩肴得・ｽ・ｯ鬮ｫ・ｪ郢晢ｽｻ/div>`;
    html += `<div style="display:flex;justify-content:center;gap:18px;font-size:13px;margin-bottom:10px">
      <span>髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ <span style="color:var(--green);font-weight:600">+${wsIncome.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></span>
      <span>髫ｰ・ｾ繝ｻ・ｯ髯ｷ繝ｻ・ｽ・ｺ <span style="color:var(--red);font-weight:600">-${wsExpense.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></span>
      <span>髯ｷ・ｿ陷ｿ螟懶ｽｫ・ｪ <span style="color:${netColor};font-weight:600">${wsNet>=0?'+':''}${wsNet.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></span>
    </div>`;
    html += `<div style="font-size:15px">髫ｹ・ｿ驕擾ｽｩ繝ｻ・ｫ郢晢ｽｻ <strong style="color:${G.funds>=0?'var(--green)':'var(--red)'}">${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ/strong></div>`;
    html += `</div>`;
    html += `<div class="btn-row" style="justify-content:center">
      <button class="btn btn-gold" style="font-size:15px;padding:12px 32px;font-weight:700" onclick="App.advanceFromWeekSummary()">髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ鬯ｨ・ｾ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｸ 驕ｶ鄙ｫ繝ｻ/button>
    </div>`;
  }
  else if (G.weekPhase === 'settled') {
    const heat = getHeatLevel();
    const _sCycleNum = Math.ceil(G.week / 4);
    const _sMonthStart = (_sCycleNum - 1) * 4 + 1;
    const monthBuf = (G.financeHistory || []).filter(h => h.season === G.season && h.week >= _sMonthStart && h.week <= G.week);
    const weeksInMonth = monthBuf.length;
    html += `<h3 style="color:var(--gold);margin-bottom:12px">・滓ｨ雁・ 髫ｴ蟶帶ｲｺ繝ｻ・ｬ繝ｻ・｡髯ｷ・ｿ陷ｿ螟懶ｽｫ・ｪ驛｢譎｢・ｽ・ｬ驛｢譎・ｺ｢郢晢ｽｻ驛｢譏ｴ繝ｻ/h3>`;
    html += `<div style="margin-bottom:8px;font-size:12px">Heat: <span style="color:${heat.color};font-weight:700">${heat.emoji} ${heat.label}郢晢ｽｻ騾趣ｽｯ陝・｢第･懊・・｢繝ｻ繝ｻ繝ｻ{heat.mult}郢晢ｽｻ郢晢ｽｻ/span></div>`;
    const settleChamp = getWorldChampion();
    if (settleChamp) html += `<div style="margin-bottom:8px;font-size:12px">・滓ｨ｣繝ｻ 髯懈圜・ｽ・｣髣厄ｽｴ鬪ｰ邇厄ｽｦ蜀ｶ・ｰ雜｣・ｽ・ｧ: ${fLink(settleChamp, {source:'roster'})}郢晢ｽｻ郢晢ｽｻ{G.titles.world.defenses}鬯ｮ・ｦ繝ｻ・ｲ鬮ｯ・ｦ陝ｷ・｢繝ｻ・ｼ郢晢ｽｻ/div>`;

    // v1.0: Aggregate monthly finance from financeHistory
    const monthlyDetails = {};
    let monthIncome = 0, monthExpense = 0;
    monthBuf.forEach(entry => {
      if (!entry.details) return;
      entry.details.forEach(d => {
        // 鬮｣莨√Γ繝ｻ・｡隰疲ｺｷ・ｴ邇厄ｽｭ蟷・ｴ溘・・ｰ郢晢ｽｻ陝ｯ・ｼ郢晢ｽｻ陋ｹ・ｻ郢晢ｽ｡驛｢・ｧ繝ｻ・ｱ驛｢譏ｴ繝ｻ郢晢ｽｨ驛｢譎｢・ｽ・ｻ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬮ｮ蜈ｷ・ｽ・ｻ郢晢ｽｻ陝ｲ・ｨ郢晢ｽｻ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ/髯ｷ讎贋ｾ幃弍・､驍ｵ・ｺ隶吝ｮ医・驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ闕ｵ譏ｶ陞ｺ驛｢・ｧ遶丞｢・ｸｷ・ｹ譎冗函・取凵諤ｦ繝ｻ・ｨ髣厄ｽｴ髦ｮ蜻ｻ・ｽ蝣､・ｹ・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｫ髣厄ｽｫ隴弱・莠・
        const isShowSpecific = d.label.startsWith('驛｢譏ｶ繝ｻ邵ｺ骰具ｽｹ譏ｴ繝ｻ郢晢ｽｨ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ') || d.label.startsWith('髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬮ｮ蜈ｷ・ｽ・ｻ');
        const key = isShowSpecific ? d.label : d.label.replace(/郢晢ｽｻ郢晢ｽｻ*?郢晢ｽｻ郢晢ｽｻg, '').replace(/\d+髣費｣ｰ繝ｻ・ｺ/g, '').trim();
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
      html += `<div style="margin-bottom:8px;font-size:11px;color:var(--text-dim)">鬮ｫ・ｨ繝ｻ・ｬ${Math.min(...weekNums)}鬯ｨ・ｾ繝ｻ・ｱ驍ｵ・ｲ隲帙・・ｽ・ｬ繝ｻ・ｬ${Math.max(...weekNums)}鬯ｨ・ｾ繝ｻ・ｱ</div>`;
    }

    // Show aggregated details
    Object.values(monthlyDetails).forEach(d => {
      html += `<div class="finance-row"><span class="f-label">${d.label}${d.count > 1 ? ` 繝ｻ繝ｻ繝ｻ{d.count}鬯ｨ・ｾ繝ｻ・ｱ` : ''}</span><span class="f-val ${d.type}">${d.val >= 0 ? '+' : ''}${d.val}髣包ｽｳ郢晢ｽｻ/span></div>`;
    });
    html += `<div class="finance-row finance-total"><span>髫ｴ蟶ｷ・｣・ｯ闖ｫ・｣髯ｷ・ｿ陷ｿ螟懶ｽｫ・ｪ</span><span class="f-val ${monthNet >= 0 ? 'income' : 'expense'}">${monthNet >= 0 ? '+' : ''}${monthNet}髣包ｽｳ郢晢ｽｻ/span></div>`;
    html += `<div style="margin-top:8px;font-size:13px">髫ｹ・ｿ驕擾ｽｩ繝ｻ・ｫ郢晢ｽｻ <strong style="color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ/strong></div>`;

    // v0.97: Survival gauge mini-status in settlement
    const f = G.weeklyFinance;
    if (!G.survivalCleared && f.net !== undefined) {
      const sPhase = Survival.getPhase(G);
      const rollingBuf = G.recentWeeklyNet || [0,0,0,0];
      const rollingNet = rollingBuf.reduce((a,b) => a+b, 0);
      const r4c = G.rollingNet4Count || 0;
      if (monthNet >= 0) {
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.2);font-size:11px;color:#2ecc71">
          髫ｨ・ｵ繝ｻ・ｽ 髫ｴ蟶ｷ・｣・ｯ闖ｫ・｣鬲・ｺｯ・ｲ讖ｸ・ｽ・ｭ隴会ｽｦ繝ｻ・ｼ郢晢ｽｻ{rollingNet >= 0 ? ` 髫ｴ蟶帶ｲｺ繝ｻ・ｬ繝ｻ・｡鬲・ｺｯ・ｲ讖ｸ・ｽ・ｭ郢晢ｽｻ{r4c}髯懃軸・ｨ・｣繝ｻ繝ｻ・ｬ讙趣ｽｧ・ｦ : ''}${r4c >= 1 ? ' ・滓ｨ奇ｽｫ・ｨ' : ''}${r4c >= 2 && G.funds >= 3000 ? ' 驕ｯ・ｶ郢晢ｽｻ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢鬯ｮ・｢隶鯉ｽ｢繝ｻ・ｿ隰・∞・ｽ・ｼ郢晢ｽｻ : ''}
        </div>`;
      } else {
        const sWeeks = Survival.weeksUntilBankrupt(G);
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.2);font-size:11px;color:#e74c3c">
          髫ｨ・ｵ繝ｻ・ｽ ${sPhase?.emoji || '・滓ｨ｣邂・} ${sPhase?.label || '髫俶誓・ｽ・､髯昴・繝ｻ} 驕ｯ・ｶ郢晢ｽｻ髯区ｺｷ・ｰ・､髢ｧ繝ｻ・ｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ髫ｰ證ｦ・ｽ・ｨ髯橸ｽｳ郢晢ｽｻ{sWeeks === Infinity ? '驕ｶ荳翫・ : sWeeks}鬯ｨ・ｾ繝ｻ・ｱ
        </div>`;
      }
    }

    if (G.funds <= -1000) {
      html += '<div style="margin-top:12px;padding:12px;background:rgba(196,30,58,0.2);border:1px solid var(--red);border-radius:4px;text-align:center"><strong style="color:var(--red);font-size:18px">・滓ｨ｣ﾂ繝ｻGAME OVER 驕ｯ・ｶ郢晢ｽｻ髯区ｺｷ・ｰ・､髢ｧ繝ｻ/strong></div>';
    } else {
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn btn-gold" style="font-size:16px;padding:12px 28px;font-weight:700" onclick="advanceWeek()">髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ髫ｴ蟶帷樟遶上・驕ｶ鄙ｫ繝ｻ/button></div>';
    }
  }
  // 髫ｨ貂可髫ｨ貂可 C-4: TRANSFER WINDOW UI 髫ｨ貂可髫ｨ貂可
  else if (G.weekPhase === 'transfer') {
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ・滓ｧｫ・｣・ｲ 鬩募∞・ｽ・ｻ鬩債鬮ｦ・ｪ邵ｺ閧ｲ・ｹ・ｧ繝ｻ・｣驛｢譎｢・ｽ・ｳ驛｢譎擾ｽｳ・ｨ邵ｺ繝ｻ;
    const pending = G.pendingPoach || [];
    if (pending.length > 0) {
      html += '<h3 style="color:#e17055;margin-bottom:12px">髫ｨ讖ｸ・｣・ｰ郢晢ｽｻ郢晢ｽｻ髯滄｡鯉ｽｼ謚ｫﾂ・ｳ髫ｰ螢ｽ繹ｱ遯ｶ・ｳ驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁撰ｼ憺Δ譎｢・ｽ・ｼ</h3>';
      html += '<p style="font-size:12px;color:var(--text-sub);margin-bottom:12px">髣包ｽｳ髮榊・・ｽ・ｽ隶朱宦・ｱ・ｮ髣厄ｽｴ髦ｮ蜊搾ｽｰ驛｢・ｧ髯具ｽｾ遶城メ・ｬ繝ｻ・ｹ譏ｶ繝ｻ驍ｵ・ｺ繝ｻ・ｮ髯滄｡鯉ｽｼ謚ｫﾂ・ｳ髫ｰ螢ｽ繹ｱ遯ｶ・ｳ驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁撰ｼ憺Δ譎｢・ｽ・ｼ驍ｵ・ｺ隰疲ｻゑｽｽ・ｱ驗呻ｽｫ繝ｻ讓抵ｽｸ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ閠ｳ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶ繝ｻ驍ｵ・ｺ繝ｻ・ｮ髯昴・・ｽ・ｾ髯滂ｽ｢隲帛･・ｽｽ蟶晢ｽｩ蛹・ｽｽ・ｸ髫ｰ螢ｽ・ｧ・ｭ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｼ讓抵ｽｸ・ｲ郢晢ｽｻ/p>';
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
                  ${isChampion ? '<span style="color:var(--gold);font-size:12px;margin-left:6px">・滓ｫ∬・鬩阪・莠具ｾつ郢晢ｽｻ/span>' : ''}
                  <span style="font-size:13px;color:var(--text-dim);margin-left:8px">OVR ${Engine.util.ov(f)} / 髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${Engine.util.dispPop(f.popularity)}</span>
                </div>
                <div style="font-size:13px;color:var(--text-sub)">驕ｶ鄙ｫ繝ｻ${p.org.name} (${p.org.tier}鬩堺ｸ翫・</div>
              </div>
          <div style="display:flex;gap:10px;font-size:13px;margin-bottom:10px">
            <span style="color:#2ecc71">・滓ｫ√・ 鬩募∞・ｽ・ｻ鬩債陜難ｽｼ遶包ｽ｡: +${p.fee}髣包ｽｳ郢晢ｽｻ/span>
            <span style="color:#e17055">・滓ｧｫ・ｭ・ｱ郢晢ｽｻ郢晢ｽｻ髯滄｡鯉ｽｼ謚ｫﾂ・ｳ鬨ｾ・｡陷ｷ・ｶ繝ｻ繝ｻ蟇槭・・ｻ: -${retCost}髣包ｽｳ郢晢ｽｻ{isChampion ? ' (鬩墓慣・ｽ・ｺ髯橸ｽｳ陞｢・ｽ郢晢ｽｻ髯ｷ蟲ｨ繝ｻ' : ' (髫ｰ蠕｡・ｻ蜥擾ｽｲ・･鬩阪・繝ｻ0%)'}</span>
          </div>
          <div class="btn-row" style="gap:8px">
            <button class="btn btn-blue" style="font-size:11px;padding:6px 12px" onclick="resolvePoach(${f.id},false)">・滓ｧｫ・ｭ・ｱ郢晢ｽｻ郢晢ｽｻ髯滄｡鯉ｽｼ謚ｫﾂ・ｳ鬨ｾ・｡陷ｷ・ｶ繝ｻ竏ｫ・ｹ・ｧ郢晢ｽｻ/button>
            <button class="btn" style="font-size:11px;padding:6px 12px;background:rgba(196,30,58,0.2);border:1px solid var(--red);color:var(--red)" onclick="resolvePoach(${f.id},true)">・滓ｨ｣・ｰ繝ｻ鬩募∞・ｽ・ｻ鬩債鬮ｦ・ｪ繝ｻ螳夲ｽｬ繝ｻ・ｽ・ｿ鬮ｫ・ｱ郢晢ｽｻ/button>
          </div>
            </div>
          </div>
        </div>`;
      });
    } else {
      html += '<h3 style="color:var(--gold);margin-bottom:12px">鬩募∞・ｽ・ｻ鬩債鬮ｦ・ｪ邵ｺ閧ｲ・ｹ・ｧ繝ｻ・｣驛｢譎｢・ｽ・ｳ驛｢譎擾ｽｳ・ｨ邵ｺ驛∵･懆包ｽ｡繝ｻ・ｺ郢晢ｽｻ/h3>';
      html += '<p style="font-size:12px;color:var(--text-sub);margin-bottom:12px">髯ｷ闌ｨ・ｽ・ｨ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｮ鬩募∞・ｽ・ｻ鬩債鬮ｦ・ｪ邵ｺ讙趣ｽｹ譎・ｽｼ譁撰ｼ憺Δ譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｫ髯昴・・ｽ・ｾ髯滂ｽ｢隲帛･・ｽｼ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷会ｽｱ隨ｳ繝ｻ・ｸ・ｲ郢晢ｽｻ/p>';
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn btn-gold" onclick="finishTransferWindow()">髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｸ鬯ｨ・ｾ繝ｻ・ｲ驛｢・ｧ・つ 驕ｶ鄙ｫ繝ｻ/button></div>';
    }
  }
  // 髫ｨ貂可髫ｨ貂可 EVENT DISPLAY (Phase D) 髫ｨ貂可髫ｨ貂可
  else if (G.weekPhase === 'event') {
    const ev = G.pendingEvent;
    if (!ev) {
      html += '<h3 style="color:var(--text-sub)">驛｢・ｧ繝ｻ・､驛｢譎冗函・趣ｽｦ驛｢譎冗樟郢晢ｽｧ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｿ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ/h3>';
      html += '<div class="btn-row"><button class="btn btn-gold" onclick="skipEvent()">驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｻ 驕ｶ鄙ｫ繝ｻ/button></div>';
    } else if (ev.type === 'war') {
      document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ髫ｨ讒ｭ繝ｻ髯昴・・ｽ・ｾ髫ｰ螟りｻｸ陝具ｽｶ`;
      html += `<div style="background:linear-gradient(135deg,rgba(196,30,58,0.15),rgba(231,76,60,0.1));border:1px solid rgba(231,76,60,0.3);border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
        <h3 style="color:#e74c3c;margin-bottom:8px">髫ｨ讒ｭ繝ｻ髯昴・・ｽ・ｾ髫ｰ螟りｻｸ陝具ｽｶ驍ｵ・ｺ繝ｻ・ｮ鬨ｾ蛹・ｽｽ・ｳ驍ｵ・ｺ隲､諛翫・驛｢・ｧ郢晢ｽｻ/h3>
        <p style="font-size:14px;color:var(--text-main);margin-bottom:4px">${ev.opponentName}驍ｵ・ｺ闕ｵ譎｢・ｽ闃ｽ・ｬ荵滂ｽｬ・ｬ陝具ｽｶ髴托ｽ･繝ｻ・ｶ驍ｵ・ｺ隰疲ｻゑｽｽ・ｱ驗呻ｽｫ繝ｻ讓抵ｽｸ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ/p>
        <p style="font-size:12px;color:var(--text-sub)">${ev.matchCount}鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ陋ｹ・ｻ郢晢ｽｻ髯懈圜・ｽ・｣髣厄ｽｴ霓｣蛛・ｽｽ・ｯ繝ｻ・ｾ髮手ｶ｣・ｽ・ｺ</p>
      </div>`;
      html += `<div class="btn-row" style="margin-top:16px;justify-content:center">
        <button class="btn btn-gold" style="padding:12px 32px;font-size:15px" onclick="showWarChallenge()">髫ｨ讒ｭ繝ｻ髫ｰ荵滂ｽｬ・ｬ陝具ｽｶ髴托ｽ･繝ｻ・ｶ驛｢・ｧ陞ｳ螟ｲ・ｽ・ｦ闕ｵ譎｢・ｽ繝ｻ/button>
      </div>`;
      // Auto-show the challenge popup on first render
      setTimeout(() => showWarChallenge(), 300);
    } else if (ev.type === 'summit') {
      document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ・滓ｨ｣繝ｻ 鬯ｯ繝ｻ・・・・ｸ鬯・汚・ｽ・ｱ繝ｻ・ｺ髫ｰ魃会ｽｽ・ｦ`;
      html += `<div style="background:linear-gradient(135deg,rgba(241,196,15,0.2),rgba(255,215,0,0.1));border:1px solid rgba(241,196,15,0.4);border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
        <h3 style="color:var(--gold);margin-bottom:8px">・滓ｨ｣繝ｻ 鬯ｯ繝ｻ・・・・ｸ鬯・汚・ｽ・ｱ繝ｻ・ｺ髫ｰ魃会ｽｽ・ｦ</h3>
        <p style="font-size:14px;color:var(--text-main);margin-bottom:4px">${ev.orgName}驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｫ髫ｰ邏具ｽｻ・｣郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ/p>
        <p style="font-size:12px;color:var(--text-sub)">髯ｷ閧ｴ蜑碁洛諛・ｽｸ・ｺ繝ｻ・ｧ髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・${EVENT_CONFIG.summitPopReward}驍ｵ・ｲ遶乗劼・ｽ・ｯ繝ｻ・ｾ髫ｰ魃会ｽｽ・ｦpt+${BATTLE_POINT_CFG.summit} / 髫ｰ・ｨ隲､諛ｷ諱滄し・ｺ繝ｻ・ｧ髯昴・・ｽ・ｾ髫ｰ魃会ｽｽ・ｦpt-${BATTLE_POINT_CFG.summit}</p>
      </div>`;
      html += `<div style="display:flex;justify-content:center;align-items:center;gap:24px;margin:16px 0;font-size:16px">
        <span><strong style="color:var(--gold)">${ev.playerFighter.name}</strong> <span style="font-size:11px;color:var(--text-dim)">OVR${Engine.util.ov(ev.playerFighter)}</span></span>
        <span style="color:var(--text-dim)">VS</span>
        <span><strong style="color:#e74c3c">${ev.aiFighter.name}</strong> <span style="font-size:11px;color:var(--text-dim)">OVR${Engine.util.ov(ev.aiFighter)}</span></span>
      </div>`;
      html += `<div class="btn-row" style="margin-top:16px">
        <button class="btn btn-gold" onclick="executeEvent()">・滓ｨ｣繝ｻ 髫ｰ荵滂ｽｬ・ｬ陝具ｽｶ驍ｵ・ｺ陷ｷ・ｶ繝ｻ荵昴・郢晢ｽｻ/button>
        <button class="btn btn-blue" onclick="skipEvent()">鬮ｫ諷墓ｴｸ・つ遶丞､ｲ・ｽ繝ｻ/button>
      </div>`;
    }
  }
  // 髫ｨ貂可髫ｨ貂可 PPV ENTRY PHASE 髫ｨ貂可髫ｨ貂可
  else if (G.weekPhase === 'ppvEntry') {
    const ppvName = G.ppvName || 'GRAND FINAL';
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ・滓ｧｫ莠ｫ郢晢ｽｻ郢晢ｽｻPPV GRAND FINAL`;
    const rankings = G.rankings || [];
    const pRank = Engine.ranking.getPlayerRank(rankings);
    const maxSlots = Engine.ppv.getSlotCount(pRank);
    const champ = getWorldChampion();
    const champAutoEntry = champ && !champ.injury && !champ.isRental;
    const remainingSlots = champAutoEntry ? maxSlots - 1 : maxSlots;
    const picks = G._ppvPicks || [];

    // 驛｢譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ
    html += `<div style="text-align:center;padding:20px 16px;background:linear-gradient(135deg,rgba(241,196,15,0.15),rgba(231,76,60,0.08));border:1px solid rgba(241,196,15,0.35);border-radius:10px;margin-bottom:16px">
      <h2 style="color:var(--gold);margin:0 0 6px 0;font-size:20px">・滓ｧｫ莠ｫ郢晢ｽｻ郢晢ｽｻPPV GRAND FINAL驍ｵ・ｲ郢晢ｽｻ{ppvName}驍ｵ・ｲ郢晢ｽｻ/h2>
      <p style="font-size:14px;color:var(--text-main);margin:0 0 4px 0">髯ｷ繝ｻ・ｽ・ｺ髯懶ｽ｣繝ｻ・ｴ髫ｴ・ｫ繝ｻ・ｰ: <strong>${maxSlots}髯ｷ・ｷ郢晢ｽｻ/strong>郢晢ｽｻ陋ｹ・ｻ・主ｸｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｯ${pRank}髣厄ｽｴ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/p>
      <p style="font-size:12px;color:var(--text-dim);margin:0">髯ｷ繝ｻ・ｽ・ｺ髯懶ｽ｣繝ｻ・ｴ髯懶ｽ｣繝ｻ・ｱ鬯ｩ貊ゑｽｽ・ｬ: ${PPV_REWARD[pRank] || 100}髣包ｽｳ郢晢ｽｻ郢晢ｽｻ</p>
    </div>`;

    // 驛｢譏ｶ繝ｻ・取・・ｹ譎｢・ｽ・ｳ驛｢譎・ｱ堤ｸｺ讙趣ｽｹ譎｢・ｽ・ｳ鬮｢・ｾ繝ｻ・ｪ髯ｷ蟠趣ｽｼ譁絶凰驛｢譎｢・ｽ・ｳ驛｢譎冗樟・取㏍・ｹ譎｢・ｽ・ｼ
    if (champAutoEntry) {
      html += `<div style="padding:10px 14px;background:rgba(241,196,15,0.08);border:1px solid rgba(241,196,15,0.25);border-radius:6px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
        ${portraitImg(champ.id, 40)}
        <span style="font-size:13px;color:var(--text-main)">・滓ｫ∬・ <strong>${champ.name}</strong> 驕ｯ・ｶ郢晢ｽｻ驛｢譏ｶ繝ｻ・取・・ｹ譎｢・ｽ・ｳ驛｢譎・ｱ堤ｸｺ讙趣ｽｹ譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ鬮｢・ｾ繝ｻ・ｪ髯ｷ蟠趣ｽｼ譁絶凰驛｢譎｢・ｽ・ｳ驛｢譎冗樟・取㏍・ｹ譎｢・ｽ・ｼ</span>
      </div>`;
    }

    // 髫ｹ・ｿ闕ｵ譎｢・ｽ鬘假ｽｭ・ｫ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｮ鬯ｩ蛹・ｽｽ・ｸ髫ｰ螢ｹ繝ｻ
    html += `<div style="margin-bottom:12px">
      <h4 style="color:var(--text-main);margin:0 0 8px 0;font-size:14px">髯ｷ繝ｻ・ｽ・ｺ髯懶ｽ｣繝ｻ・ｴ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ蟶晢ｽｩ蛹・ｽｽ・ｸ髫ｰ螢ｽ・ｩ・ｸ繝ｻ・ｼ陜捺ｻゑｽｽ・ｮ闕ｵ譎｢・ｽ繝ｻ{remainingSlots - picks.length}髫ｴ・ｫ繝ｻ・ｰ郢晢ｽｻ郢晢ｽｻ/h4>`;

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
        <span style="font-size:18px;width:24px;text-align:center">${picked ? '髫ｨ・ｨ郢晢ｽｻ : '驕ｲ・ｮ郢晢ｽｻ}</span>
        ${portraitImg(c.id, 36)}
        <span style="flex:1;font-size:13px;color:var(--text-main)">${c.name}</span>
        <span style="font-size:11px;color:var(--text-sub)">OVR ${ovr}</span>
        <span style="font-size:11px;color:var(--text-dim)">髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${Math.round(c.popularity || 0)}</span>
      </div>`;
    });
    html += `</div>`;

    // 髮主桁・ｽ・ｨ髫ｲ・｢闕ｵ諤懶ｽｶ讙趣ｽｸ・ｺ郢晢ｽｻ
    html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:16px;line-height:1.6">
      驕ｯ・ｶ繝ｻ・ｻ 驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｳ驛｢譎冗樟・取㏍・ｹ譎｢・ｽ・ｼ髯溷供・ｾ蠕後・髯樊ｺｽ蛻､陝ｲ・ｩ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻbr>
      驕ｯ・ｶ繝ｻ・ｻ PPV驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｫ鬮ｮ蜈ｷ・｣・ｰ髯具ｽｯ繝ｻ・ｷ驍ｵ・ｺ陷会ｽｱ隨ｳ繝ｻ謦ｻ繝ｻ・ｴ髯ｷ・ｷ陋ｹ・ｻ・つ遶擾ｽｬ郢晢ｽｻ髯ｷ閧ｴ繝ｻ陜趣ｽｪ驍ｵ・ｺ繝ｻ・ｫ髣比ｼ夲ｽｽ・｣鬨ｾ繝ｻ繝ｻ遶城メ・ｬ繝ｻ・ｹ譏ｶﾂ・ｲ髯ｷ繝ｻ・ｽ・ｺ髯懶ｽ｣繝ｻ・ｴ驍ｵ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻbr>
      驕ｯ・ｶ繝ｻ・ｻ 驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｳ驛｢譎冗樟・取㏍・ｹ譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ
    </div>`;

    // 鬩墓慣・ｽ・ｺ髯橸ｽｳ陞｢・ｹ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｳ
    const canConfirm = picks.length === remainingSlots;
    const btnStyle = canConfirm ? '' : 'opacity:0.4;pointer-events:none;';
    html += `<div class="btn-row" style="justify-content:center">
      <button class="btn btn-gold" style="padding:12px 32px;font-size:15px;${btnStyle}" onclick="confirmPPVEntry()">・滓ｧｫ莠ｫ郢晢ｽｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｳ驛｢譎冗樟・取㏍・ｹ譎｢・ｽ・ｼ鬩墓慣・ｽ・ｺ髯橸ｽｳ陞滂ｽｲ繝ｻ・ｼ郢晢ｽｻ{picks.length}/${remainingSlots}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/button>
    </div>`;
  }
  // 髫ｨ貂可髫ｨ貂可 PPV SHOW DAY PHASE 髫ｨ貂可髫ｨ貂可
  else if (G.weekPhase === 'ppvShow') {
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ・滓ｧｫ莠ｫ郢晢ｽｻ郢晢ｽｻPPV GRAND FINAL`;
    html += `<div style="text-align:center;padding:24px">
      <div style="color:var(--gold);font-size:18px;margin-bottom:16px">PPV GRAND FINAL驍ｵ・ｲ郢晢ｽｻ{G.ppvName || 'GRAND FINAL'}驍ｵ・ｲ陜難ｽｼ陝ｷ謌雁ｲｷ繝ｻ・ｬ髫ｴ魃会ｽｽ・･郢晢ｽｻ郢晢ｽｻ/div>
      <button class="btn btn-gold" style="padding:12px 32px;font-size:15px" onclick="App.initPPVShow()">・滓ｧｫ莠ｫ郢晢ｽｻ郢晢ｽｻPPV 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ繝ｻ蟶晏距繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ</button>
    </div>`;
  }
  // 髫ｨ貂可髫ｨ貂可 PPV TV PHASE 髫ｨ貂可髫ｨ貂可
  else if (G.weekPhase === 'ppvTV') {
    document.getElementById('weekTitle').textContent = `${Engine.util.formatDate(G.season, G.week)} 驕ｯ・ｶ郢晢ｽｻ・滓ｨ｣蝟・PPV 驛｢譏ｴ繝ｻ・取ｨ抵ｽｹ譎・ｽｬ雜｣・ｽ・ｸ繝ｻ・ｭ鬩搾ｽｯ陷茨ｽｪ;
    html += `<div style="text-align:center;padding:24px">
      <div style="color:var(--text-sub);font-size:16px;margin-bottom:16px">・滓ｨ｣蝟・PPV GRAND FINAL 驛｢譏ｴ繝ｻ・取ｨ抵ｽｹ譎・ｽｬ雜｣・ｽ・ｸ繝ｻ・ｭ鬩搾ｽｯ陷ｷ・ｩ繝ｻ・ｸ繝ｻ・ｭ驕ｯ・ｶ繝ｻ・ｦ</div>
      <button class="btn btn-blue" style="padding:10px 24px;font-size:14px" onclick="App.initPPVTV()">・滓ｨ｣蝟・驛｢譏ｴ繝ｻ・取ｨ抵ｽｹ譎・ｽｬ雜｣・ｽ・ｸ繝ｻ・ｭ鬩搾ｽｯ陷ｷ・ｶ繝ｻ蟶晏寰闕ｵ譎｢・ｽ繝ｻ/button>
    </div>`;
  }

  // 髫ｨ貂可髫ｨ貂可 SCOUT EVENT PHASE 髫ｨ貂可髫ｨ貂可
  else if (G.weekPhase === 'scoutEvent') {
    const weekLabel = G.offSeason ? `驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ鬮ｫ・ｨ繝ｻ・ｬ${G.offWeek}鬯ｨ・ｾ繝ｻ・ｱ` : Engine.util.formatDate(G.season, G.week);
    const eventLabel = G.scoutEventType === 'midseason' ? '鬮ｯ・ｬ隲幢ｽｷ繝ｻ・ｼ繝ｻ・ｷ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ : '驛｢譎｢・ｽ・｡驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ;
    document.getElementById('weekTitle').textContent = `${weekLabel} 驕ｯ・ｶ郢晢ｽｻ・滓ｧｫ鄙・${eventLabel}`;
    html += `<div style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(46,204,113,0.1),rgba(52,152,219,0.05));border:1px solid rgba(46,204,113,0.25);border-radius:8px;margin-bottom:16px">
      <h3 style="color:#2ecc71;margin-bottom:8px">・滓ｧｫ鄙・驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎冗樟・取ｨ抵ｽｹ譎・ｺ｢郢晢ｽｻ驛｢譏懶ｽｺ・･髣・ｽｦ鬨ｾ・ｹ・つ</h3>
      <p style="font-size:13px;color:var(--text-sub)">髯区ｺｷ謠・・・｣隲帙・ﾂ郢晢ｽｻ郢晢ｽｻ鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｲ陟募ｾ娯雷驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎冗樟邵ｺ繝ｻ・ｹ譎冗函・趣ｽｦ驛｢譎冗樟・つ陷･・ｲ陋ｻ・､鬯ｮ・ｱ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｧ鬩墓慣・ｽ・ｺ鬮ｫ・ｱ鬮ｦ・ｪ邵ｲ蝣､・ｸ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ/p>
      <p style="font-size:12px;color:var(--text-dim);margin-top:4px">髴托ｽｯ繝ｻ・ｲ髯滓・霆ｸ隴ｽ・ｧ: ${(G.scoutPicks||[]).length} / ${G.scoutMaxPicks || 3}髯ｷ・ｷ郢晢ｽｻ/p>
    </div>
    <div class="btn-row">
      <button class="btn btn-gold" onclick="showScreen('scoutEvent')">・滓ｧｫ鄙・髯区ｺｷ謠・・・｣隲帙・ﾂ郢晢ｽｻ繝ｻ蟶晏寰闕ｵ譎｢・ｽ繝ｻ/button>
      <button class="btn btn-blue" onclick="scoutFinish()">驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎√＃繝ｻ・ｵ郢ｧ繝ｻ・ｽ・ｺ郢晢ｽｻ驕ｶ鄙ｫ繝ｻ/button>
    </div>`;
  }

  el.innerHTML = html;
}

function _renderRosterDojoHeader() {
  const el = document.getElementById('rosterDojoHeader');
  if (!el) return;
  const hired = getHiredCoaches();

  // --- 鬯ｮ・ｮ繝ｻ・ｰ髯懈圜・ｽ・ｲ髮取ぁ蟷ｲ郢晢ｽｦ驛｢・ｧ繝ｻ・ｭ驛｢・ｧ繝ｻ・ｹ驛｢譎√＃陷・ｽｽ髫ｰ蠕後・---
  const atmoRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season || 1, G.week || 1, Date.now() & 0xFFFF));
  const atmo = Engine.lockerRoom.getAtmosphereText(atmoRng, G.lockerRoomMorale || 60);

  let html = '<div class="dojo-header">';
  html += '<img src="../image/dojo-header.webp" class="dojo-header-img" onerror="this.style.display=\'none\'" alt="">';
  html += '<div class="dojo-header-overlay"></div>';

  // --- 驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ繝ｻ髢ｨ荵滂ｽｸ・ｺ隶守ｿｫ繝ｻ驍ｵ・ｺ隴会ｽｦ繝ｻ・ｼ闔・･繝ｻ・ｷ繝ｻ・ｦ髣包ｽｳ陷茨ｽｷ繝ｻ・ｼ郢晢ｽｻ---
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
      html += `<div class="coach-name">・滓ｨ剃ｼｴ ${report.coachName}</div>`;
      html += `驍ｵ・ｲ郢晢ｽｻ{report.reportText}驍ｵ・ｲ雋ゑｽｯ;
    } else if (coachForBubble) {
      html += `<div class="coach-name">・滓ｨ剃ｼｴ ${coachForBubble.name}</div>`;
      html += `驍ｵ・ｲ郢晢ｽｻ{atmo.text}驍ｵ・ｲ雋ゑｽｯ;
    } else {
      html += `${atmo.emoji}驍ｵ・ｲ郢晢ｽｻ{atmo.text}驍ｵ・ｲ雋ゑｽｯ;
    }
    html += '</div></div>';
  }

  // --- 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ・樣Δ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ郢晢ｽｻ闔・･隰・ｽｿ髣包ｽｳ陷茨ｽｷ繝ｻ・ｼ郢晢ｽｻ---
  // 鬯ｮ・ｮ繝ｻ・ｰ髯懈圜・ｽ・ｲ髮取ぁ蟷ｲ・取ｨ抵ｽｹ譎冗函・取刮・ｸ・ｺ繝ｻ・ｫ髯滂ｽ｢隲帷腸・ｧ驍ｵ・ｺ雋贋ｼ夲ｽｽ・ｺ繝ｻ・ｺ髫ｰ・ｨ繝ｻ・ｰ: level1=0, level2=0-1, level3=1, level4=1-2, level5=2-3
  const levelMaxMap = [0, 0, 1, 1, 2, 3]; // index = atmo.level (1-5)
  const levelMinMap = [0, 0, 0, 1, 1, 2];
  const maxFighters = levelMaxMap[atmo.level] || 0;
  const minFighters = levelMinMap[atmo.level] || 0;

  if (maxFighters > 0 && G.roster && G.roster.length > 0) {
    const fRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season || 1, G.week || 1, 777));
    const available = G.roster.filter(c => !c.injury);
    // 驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・｣驛｢譏ｴ繝ｻ郢晢ｽｵ驛｢譎｢・ｽ・ｫ
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
        const cycle = 13 + Engine.rng.int(fRng, 0, 6); // 13-19s驍ｵ・ｺ繝ｻ・ｧ驛｢譎√・・主ｸｷ・ｸ・ｺ闔会ｽ｣繝ｻ繝ｻ・ｸ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ
        html += `<div class="dojo-scene-fighter-wrap" style="margin-bottom:${offsetY}px" title="${c.name}" onclick="showFighterPopup(${c.id},'roster')">`;
        html += `<div class="dojo-scene-shout" style="--shout-cycle:${cycle}s;--shout-delay:${delay}s"></div>`;
        html += `<div class="dojo-scene-fighter">${portraitImg(c.id, 40)}</div>`;
        html += '</div>';
      });
      html += '</div>';
    }
  }

  html += '</div>'; // .dojo-header 鬯ｮ・｢陝ｲ・ｨ・ゑｽｧ

  // 驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ謔ｪ鬮ｻ・ｳ髫ｲ・､繝ｻ・ｧ郢晢ｽｻ陋ｹ・ｻ郢晢ｽｰ驛｢譎会ｽｿ・ｫ郢晢ｽｻ髯樊ｻ薙§遶頑･｢・ｰ・ｿ闕ｵ譏ｶ繝ｻ郢晢ｽｻ郢晢ｽｻ
  if (hired.length > 0) {
    const traitParts = hired.map(c => c.trait);
    html += `<div class="train-tendency" style="margin-bottom:8px">驕ｶ鄙ｫ繝ｻ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ謔ｪ鬮ｻ・ｳ髫ｲ・､繝ｻ・ｧ: <strong>${traitParts.join('驍ｵ・ｲ郢晢ｽｻ)}</strong></div>`;
  }
  el.innerHTML = html;

  // 髯ｷ・ｷ繝ｻ・ｹ驍ｵ・ｺ隶守ｿｫ繝ｻ驍ｵ・ｺ陷会ｽｱ郢晢ｽｦ驛｢・ｧ繝ｻ・ｭ驛｢・ｧ繝ｻ・ｹ驛｢譎冗樟繝ｻ螳夲ｽｱ莠･・ｼ・ｱ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｧ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢謨鳴驛｢譎｢・｣・ｰ髯晢ｽｾ繝ｻ・ｮ驍ｵ・ｺ驍・ｽｲ陝蟶ｷ・ｸ・ｺ郢晢ｽｻ
  const DOJO_SHOUTS = [
    '驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ遶丞｣ｺ螟｢驕ｯ・ｶ繝ｻ・ｦ!','驍ｵ・ｺ繝ｻ・ｵ驍ｵ・ｺ繝ｻ・｣!','驍ｵ・ｺ陝ｶ蜻ｻ・ｼ讓抵ｽｸ・ｺ繝ｻ・｣!','驛｢・ｧ陋ｹ・ｻ繝ｻ讓抵ｽｸ・ｺ陷会ｽｱ繝ｻ繝ｻ','驛｢・ｧ郢ｧ繝ｻ魘ｬ髣包ｽｳ・つ髫ｴ蟷｢・ｽ・ｬ!',
    '驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・｣!','驍ｵ・ｺ闕ｳ蟯ｩ螟｢驕ｯ・ｶ繝ｻ・ｦ!','驍ｵ・ｺ雋・∞・ｼ譎会ｽｸ・ｺ繝ｻ・｣!','驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｰ驛｢・ｧ鬩ｫﾂ・つ繝ｻ・ｦ!','驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｰ!',
    '驍ｵ・ｺ驗呻ｽｫ繝ｻ鬘費ｽｹ・ｧ郢晢ｽｻ','驛｢・ｧ陋ｹ・ｻ繝ｻ・ｰ!','驍ｵ・ｺ郢晢ｽｻ遶包ｽｦ驍ｵ・ｺ繝ｻ・｣驕ｯ・ｶ繝ｻ・ｦ','驍ｵ・ｺ繝ｻ・ｩ驛｢・ｧ驗呻ｽｫ繝ｻ繝ｻ','驍ｵ・ｺ隴擾ｽｴ繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｰ!'
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
      : pct >= 85 ? '<span style="color:#e74c3c;font-size:11px">髫ｹ・ｿ陷ｿ・･郢晢ｽ･驍ｵ・ｺ郢晢ｽｻ/span>'
      : pct >= 60 ? '<span style="color:#f39c12;font-size:11px">髫ｰ謔滂ｽｮ・｣髢ｨ讚∝初繝ｻ・ｭ</span>'
      : '<span style="color:#2ecc71;font-size:11px">髣費ｽｨ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｳ驍ｵ・ｺ陷会ｽｱ繝ｻ蟠取｣斐・・ｧ</span>';
    html += `<div class="stat-bar-wrap">
      <span class="stat-bar-label">${statLabels[s]}</span>
      <div class="stat-bar-bg"><div class="stat-bar-fill ${s}" style="width:${Math.min(100,pct)}%"></div></div>
      <span class="stat-bar-val">${current} ${roomLabel}${sg > 0 ? ` <span style="color:#2ecc71;font-weight:700">+${sg}</span>` : ''}${s === 'mn' ? ' <span class="stat-bar-note" title="驛｢譎｢・ｽ・｡驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｯ鬩搾ｽｱ繝ｻ・ｴ鬩怜雀繝ｻ邵ｲ蝣､・ｸ・ｺ繝ｻ・ｯ髫ｰ謔滂ｽｮ・｣髢ｨ讓抵ｽｸ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ郢ｧ螂・ｽｽ・ｩ繝ｻ・ｦ髯ｷ・ｷ髢ｧ・ｲ繝ｻ・ｵ驕偵・・ｽ・ｨ髦ｮ蜷ｮ繝ｻ驛｢・ｧ陋ｹ・ｻ隨・ｽｲ驍ｵ・ｺ繝ｻ・ｦ髫ｰ謔滂ｽｮ・｣髢ｨ讓抵ｽｸ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ>驕ｯ・ｶ繝ｻ・ｻ鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ陋ｹ・ｻ邵ｲ螳夲ｽｬ謔滂ｽｮ・｣髢ｨ繝ｻ/span>' : ''}</span>
    </div>`;
  });
  // Coach assign dropdown
  if (canManage) {
    html += `<div style="margin-top:8px;font-size:11px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <label style="color:var(--text-dim)">髫ｲ・｡郢晢ｽｻ繝ｻ・ｽ髦ｮ蜷ｶ・・Δ譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ </label>
      <select onchange="changeCoachAssign(${c.id}, Number(this.value))" style="font-size:11px;padding:3px"${isInjured?' disabled':''}>
        <option value="0"${!coach?' selected':''}>--- 驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ---</option>`;
    hired.forEach(h => {
      const aCount = getCoachAssignees(h.id).length;
      const isCurrent = coach && coach.id === h.id;
      const isFull = aCount >= COACH_MAX_ASSIGN && !isCurrent;
      const effShort = `${h.grade}鬩堺ｸ翫・繝ｻ繝ｻ繝ｻ{COACH_RANKS[h.teaching]||1.0}`;
      const sm = getCoachStyleMatch(h, c);
      const matchTag = sm.icon ? ` ${sm.icon}${sm.label}` : '';
      html += `<option value="${h.id}"${isCurrent?' selected':''}${isFull?' disabled':''}>${h.emoji} ${h.name} [${effShort}]${matchTag} (${aCount}/${COACH_MAX_ASSIGN})${isFull?' [髮九・ﾂ]':''}</option>`;
    });
    html += '</select>';
    if (coach) {
      html += `<span onclick="event.stopPropagation();showCoachTooltip(${coach.id})" style="cursor:pointer;font-size:12px;color:var(--text-dim);text-decoration:underline dotted">鬩阪・・ｽ・ｹ郢晢ｽｻ郢晢ｽｻ鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ</span>`;
    }
    html += '</div>';
    if (coach) {
      const mult = COACH_RANKS[coach.teaching] || 1.0;
      const sm = getCoachStyleMatch(coach, c);
      const matchHtml = sm.icon ? `<span class="coach-match-badge ${sm.cls}">${sm.icon}${sm.label}+${sm.bonus}</span>` : '<span class="coach-match-badge none">髣包ｽｳ陜｣・ｺ繝ｻ・ｸ・つ鬮｢・ｾ繝ｻ・ｴ</span>';
      const effDesc = `髫ｰ謔滂ｽｮ・｣髢ｨ讖ｸ・ｾ繝ｻ繝ｻ{mult} <span class="badge badge-${coach.style}" style="font-size:10px;padding:1px 5px">${coach.style}</span> ${matchHtml} ${coach.trait}`;
      html += `<div style="margin-top:3px;font-size:12px;color:var(--text-dim)">髫ｨ荳翫・髯ｷ莨夲ｽｽ・ｹ髫ｴ・ｫ郢晢ｽｻ <span style="color:var(--gold)">${effDesc}</span></div>`;
    }
  } else if (coach) {
    html += `<div style="margin-top:6px;font-size:12px;color:var(--text-dim);display:flex;align-items:center;gap:4px">髫ｲ・｡郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ <span onclick="event.stopPropagation();showCoachTooltip(${coach.id})" style="cursor:pointer;text-decoration:underline dotted;display:inline-flex;align-items:center;gap:3px">${coachPortraitImg(coach, 16)} ${coach.name}</span></div>`;
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
    html += '<div style="font-weight:700;color:var(--gold);margin-bottom:4px">・滓ｧｫ・ｶ繝ｻ髣碑・・ｿ・ｫ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ髫ｰ謔滂ｽｮ・｣髢ｨ繝ｻ/div>';
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
      return `${c.grade}鬩堺ｸ翫・繝ｻ繝ｻ繝ｻ{mult} <span class="badge badge-${c.style}" style="font-size:10px;padding:1px 5px">${c.style}</span>`;
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
          staffHtml += `<span style="font-size:12px;color:var(--text-dim);font-style:italic">髫ｲ・｡郢晢ｽｻ繝ｻ・ｽ髦ｮ蜷ｮ繝ｻ驍ｵ・ｺ郢晢ｽｻ/span>`;
        }
        staffHtml += `</div>
          </div>
          <span style="font-size:12px;color:var(--text-dim)">鬩阪・・ｽ・ｹ郢晢ｽｻ郢晢ｽｻ/span>
        </div>`;
      });
      staffHtml += '</div>';
    } else {
      staffHtml += `<div style="text-align:center;padding:16px;color:var(--text-dim);font-size:12px">驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ謇ｱ隰費ｽｴ鬯ｮ・ｮ郢晢ｽｻ騾｡繝ｻ驕ｯ・ｶ郢晢ｽｻ<span style="color:var(--gold);cursor:pointer;text-decoration:underline" onclick="showScreen('coach')">驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢譏ｴ繝ｻ郢晢ｽｵ髯ｷ閧ｴ・ｻ繝ｻ・ｯ繝ｻ/span>驍ｵ・ｺ闕ｵ譎｢・ｽ陋ｾ・ｫ・ｮ郢晢ｽｻ騾｡驢搾ｽｸ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ/div>`;
    }
    staffEl.innerHTML = staffHtml;
  }

  // === Roster Section ===
  const el = document.getElementById('rosterTable');


  const hired = getHiredCoaches();
  const sortBtns = [
    {key:'ovr', label:'OVR'},
    {key:'name', label:'髯ｷ・ｷ隶朱｡披・'},
    {key:'cond', label:'髣厄ｽｴ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ'},
    {key:'pop', label:'髣費｣ｰ繝ｻ・ｺ髮主ｾ後・},
    {key:'schedule', label:'鬮｢・ｧ繝ｻ・ｲ髫ｰ蠕後・},
  ].map(s => `<button onclick="setRosterSort('${s.key}')" style="font-size:11px;padding:3px 10px;border-radius:3px;cursor:pointer;border:1px solid ${_rosterSortKey===s.key ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.08)'};background:${_rosterSortKey===s.key ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)'};color:${_rosterSortKey===s.key ? 'var(--gold)' : 'var(--text-dim)'}">${s.label}</button>`).join('');
  let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:11px;color:var(--text-dim)">髣包ｽｳ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｳ鬯ｯ繝ｻ繝ｻ</span>${sortBtns}</div>`;
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
  // roster-cap v1.0: 髫ｰ繝ｻﾂ髯橸ｽｻ隶馴托ｽ｣・ｧ驛｢譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ驛｢・ｧ隶卍tml驍ｵ・ｺ繝ｻ・ｮ髯ｷ閧ｲ・｣・ｯ繝ｻ・ｰ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｫ鬮ｴ謇假ｽｽ・ｽ髯ｷ莨夲ｽ｣・ｰ
  const rosterCap = G.rosterCap || 6;
  const isFull = ownFighters.length >= rosterCap;
  html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">
    <span style="font-size:13px;color:var(--text-sub)">髫ｰ繝ｻﾂ髯橸ｽｻ隶難ｽ｣遶城メ・ｬ繝ｻ繝ｻ/span>
    <span style="font-size:15px;font-weight:700;color:var(--text)">${ownFighters.length}/${rosterCap}髯ｷ・ｷ郢晢ｽｻ/span>
    ${isFull ? '<span style="font-size:12px;color:var(--text-dim)">郢晢ｽｻ闔蛹・ｽｽ・ｸ闔ｨ竏晏ｿ懃ｹ晢ｽｻ郢晢ｽｻ/span>' : ''}
  </div>` + html;
  sorted.forEach(c => {
    const roleCls = c.role === 'Babyface' ? 'bf' : c.role === 'Heel' ? 'heel' : 'neutral';
    const condPct = c.condition;
    const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
    const injuryBadge = c.injury ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(214,48,49,0.15);color:#f08b9e;border:1px solid rgba(214,48,49,0.3)">・滓ｧｫ鄂ｰ${c.injury.weeksLeft}鬯ｨ・ｾ繝ｻ・ｱ</span>` : '';
    const champBadge = G.titles.world.championId === c.id ? '<span style="color:var(--gold);font-size:12px"> ・滓ｫ∬・</span>' : '';
    const rentalBadge = c.isRental ? '<span style="color:#f39c12;font-size:12px"> ・滓ｩｸ・ｽ・､郢晢ｽｻ/span>' : '';
    // v1.3-1: wear髴托ｽ･繝ｻ・ｶ髫ｲ・ｷ闕ｵ譁溷ｸｷ・ｹ譎冗函・弱・(繝ｻ繧托ｽｽ・ｧ3)
    const wearBadge = (() => {
      const decline = Engine.retirement.getDeclinePresentation(c);
      if (decline.stage === 'terminal') return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(231,76,60,0.12);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">驕ｲ・ｮ郢晢ｽｻ繝ｻ・ｬ郢晢ｽｻ鬯ｮ・ｯ陷翫・繝ｻ</span>';
      if (decline.stage === 'major') return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(230,126,34,0.12);color:#e67e22;border:1px solid rgba(230,126,34,0.3)">驕ｲ・ｮ郢晢ｽｻ鬮ｯ・ｦ繝ｻ・ｰ鬯ｨ・ｾ・つ髫ｴ蟶吶・/span>';
      if (decline.stage === 'early') return '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(241,196,15,0.12);color:#f1c40f;border:1px solid rgba(241,196,15,0.3)">髫ｨ讖ｸ・｣・ｰ 鬮ｯ・ｦ繝ｻ・ｰ驍ｵ・ｺ郢晢ｽｻ/span>';
      return '';
    })();
    // v1.3-2: 繝ｻ繧托ｽｽ・ｧ7.2 growthPenalty髣包ｽｳ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｮ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶ繝ｻ・滓ｩｸ・ｽ・ｩ繝ｻ・ｹ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ
    const growthPenaltyBadge = (!c.injury && c.growthPenalty)
      ? '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(108,92,231,0.12);color:#a29bfe;border:1px solid rgba(108,92,231,0.3)">・滓ｩｸ・ｽ・ｩ繝ｻ・ｹ髫ｰ謔滂ｽｮ・｣髢ｨ讚∵割隲・ｹ繝ｻ・ｸ郢晢ｽｻ/span>'
      : '';
    // v1.8: 髫ｰ謔滂ｽｮ・｣髢ｨ讓抵ｽｹ・ｧ繝ｻ・､驛｢譎冗函・趣ｽｦ驛｢譎冗樟郢晢ｽｰ驛｢譏ｴ繝ｻ邵ｺ繝ｻ
    const hotStreakBadge = c.hotStreak
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(255,165,0,0.15);color:#ff9500;border:1px solid rgba(255,165,0,0.4)">・滓ｨ奇ｽｫ・ｨ鬩搾ｽｨ繝ｻ・ｶ髯槭ｑ・ｽ・ｽ鬮ｫ・ｱ繝ｻ・ｿ</span>`
      : '';
    const slumpBadge = c.slump
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(52,73,94,0.15);color:#7f8c8d;border:1px solid rgba(127,140,141,0.3)">・滓ｨ翫◇驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢譏ｴ繝ｻ/span>`
      : '';
    const motivLossBadge = c.motivationLoss
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(44,62,80,0.15);color:#95a5a6;border:1px solid rgba(149,165,166,0.3)">・滓ｧｭ繝ｻ驛｢譎｢・ｽ・｢驛｢譏ｶ繝ｻ郢晢ｽｻ髯懈ｻゑｽｽ・ｪ髯樊ｻゑｽｽ・ｱ</span>`
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
          <div>髣費｣ｰ繝ｻ・ｺ髮主ｾ後・<b style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</b></div>
          <div style="display:flex;align-items:center;gap:3px;margin-top:2px"><div style="width:40px;height:4px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="width:${condPct}%;height:100%;background:${condCls};border-radius:3px"></div></div><span style="font-size:10px">${condPct}</span></div>
          <div style="margin-top:2px;color:var(--text-dim)">${getSalary(c)}髣包ｽｳ郢晢ｽｻ/div>
          ${!c.isRental ? `<span style="font-size:10px;color:var(--text-dim);margin-top:2px;display:block">髫ｨ繝ｻ・ｽ・ｼ 鬮｢・ｧ繝ｻ・ｲ髫ｰ蠕後・/span>` : ''}
        </div>
      </div>
      ${!c.isRental ? _renderRosterTrainingPanel(c, hired) : ''}
    </div>`;
  });
  html += '</div>';
  // 髫ｨ貂可髫ｨ貂可 Rental fighters separated section 髫ｨ貂可髫ｨ貂可
  if (rentalFighters.length > 0) {
    const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownFighters.length);
    html += `<div class="panel-title" style="font-size:14px;margin-top:16px;color:#f39c12">・滓ｩｸ・ｽ・､郢晢ｽｻ驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ髫ｴ・ｫ繝ｻ・ｰ郢晢ｽｻ郢晢ｽｻ{rentalFighters.length}/${maxSlots}郢晢ｽｻ郢晢ｽｻ/div>`;
    html += '<div style="display:flex;flex-direction:column;gap:4px">';
    rentalFighters.forEach(c => {
      const condPct = c.condition;
      const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
      const injuryBadge = c.injury ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(214,48,49,0.15);color:#f08b9e;border:1px solid rgba(214,48,49,0.3)">・滓ｧｫ鄂ｰ${c.injury.weeksLeft}鬯ｨ・ｾ繝ｻ・ｱ</span>` : '';
      const contract = (G.rentals || []).find(r => r.fighterId === c.id);
      const srcLabel = contract ? (contract.fromSource === 'rival'
        ? (Engine.rival.getOrgInfo(G.aiOrgs, contract.fromOrgId)?.name || '髣碑崟鞫ｩ陞ｻ・ｮ髣厄ｽｴ郢晢ｽｻ)
        : 'FA') : '?';
      html += `<div style="background:var(--bg-card);border:1px solid rgba(243,156,18,0.3);border-radius:8px${c.injury ? ';opacity:0.75' : ''}">
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer" onclick="showFighterPopup(${c.id},'roster')">
          ${portraitImg(c.id, 56, '', true)}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
              ${fLink(c, {source:'roster', size:'13px'})}<span style="color:#f39c12;font-size:12px"> ・滓ｩｸ・ｽ・､郢晢ｽｻ/span>
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
            <div>髣費｣ｰ繝ｻ・ｺ髮主ｾ後・<b style="color:var(--text)">${Engine.util.dispPop(c.popularity)}</b></div>
            <div style="display:flex;align-items:center;gap:3px;margin-top:2px"><div style="width:40px;height:4px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="width:${condPct}%;height:100%;background:${condCls};border-radius:3px"></div></div><span style="font-size:10px">${condPct}</span></div>
            <div style="margin-top:2px;color:#f39c12;font-size:11px">${srcLabel} 郢晢ｽｻ郢晢ｽｻ髫ｹ・ｿ郢晢ｽｻ{contract ? contract.seasonsLeft : '?'}髫ｴ蟶吶・${contract ? contract.seasonsLeft * 12 : '?'}鬯ｨ・ｾ繝ｻ・ｱ)</div>
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
  // v2.0: 鬮｣莨√Γ繝ｻ・｡隴ｴ・ｧ繝ｻ・ｺ鬮｢ﾂ繝ｻ蜥擾ｽｸ・ｺ繝ｻ・ｯ manage/showPrep 驛｢譎・ｽｼ譁絶凾驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｿ郢晢ｽｻ郢晢ｽｻettled鬩包ｽｲ陝ｲ・ｨ郢晢ｽｻ鬯ｮ・ｱ隶壺・繝ｻ鬮ｯ・ｦ陟募ｾ湖ｨ驛｢・ｧ繝ｻ・ｧ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｯ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驍ｵ・ｺ陷会ｽｱ遶企・・ｸ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
  if (!isShowWeek(G.week) || !['manage', 'showPrep'].includes(G.weekPhase)) {
    el.innerHTML = '<p style="color:var(--text-sub)">鬮｣莨√Γ繝ｻ・｡驕偵・ﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ郢晢ｽｻ/p>';
    return;
  }

  let html = '';

  // 鬮｣莨√Γ繝ｻ・｡隴ｴ・ｧ繝ｻ・ｺ鬮｢ﾂ繝ｻ蜥擾ｽｹ譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ驛｢譎√・郢晢ｽｪ驛｢譎｢・ｽ・ｼ
  html += '<div class="arena-header">';
  html += '<img src="../image/arena-header.webp" class="arena-header-img" onerror="this.style.display=\'none\'" alt="">';
  html += '</div>';

  // v2.0 Phase1-6: 驛｢譎｢・ｽ・｡驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ・ｧ繝ｻ・｢髯昴・繝ｻ隰撰ｽｩ髯ｷ・ｿ陋ｹ竏ｵ鬧・Δ譎√・郢晢ｽｪ驛｢譎｢・ｽ・ｼ
  if (G.mediaSpotlight) {
    const sp = G.mediaSpotlight;
    const spFighter = G.roster.find(f => f.id === sp.fighterId);
    const spName = spFighter ? spFighter.name : sp.fighterName;
    html += `<div class="media-spotlight-banner">
      ・滓ｨ｣蝟・<strong>${spName}</strong>驍ｵ・ｺ繝ｻ・ｮ髯昴・繝ｻ隰撰ｽｩ髯ｷ・ｿ陋ｹ竏ｵ鬧・藍・ｳ繝ｻ・ｭ郢晢ｽｻ郢晢ｽｻ{sp.outletName}驛｢譎｢・ｽ・ｻ髫ｹ・ｿ闕ｵ譎｢・ｽ繝ｻ{sp.remainingShows}鬮｣莨√Γ繝ｻ・｡鬲・ｼ夲ｽｽ・ｼ郢晢ｽｻ
      驕ｯ・ｶ郢晢ｽｻ驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶ繝ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ讓｣蝨ｦ繝ｻ・ｦ髯ｷ・ｷ陋ｹ・ｻ繝ｻ蟶昴♀郢晢ｽｻ繝ｻ骰具ｽｸ・ｺ繝ｻ・ｧ驍ｵ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｼ繝ｻ
    </div>`;
  }

  // Special show / PPV banner
  if (isPPV(G.week)) {
    html += `<div style="background:linear-gradient(135deg,#2d1b00,#4a2c00);border:1px solid #f39c12;border-radius:8px;padding:12px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:16px;font-weight:700;color:#f1c40f;letter-spacing:1px">・滓ｨ｣繝ｻ PPV GRAND FINAL</div>
      <div style="font-size:12px;color:#e67e22;margin-top:4px">髯晢ｽｷ繝ｻ・ｴ鬯ｮ・｢隰撰ｽｺ隲､蜻ｵ譽斐・・ｧ驍ｵ・ｺ繝ｻ・ｮ鬮｣鬆托ｽｧ・ｫ陟守ｿｫ繝ｻ遶乗亢繝ｻ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ驍ｵ・ｺ繝ｻ・ｧ鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ陜捺ｻ難ｽ｣・ｧ+1</div>
    </div>`;
  } else if (isSpecialShow(G.week)) {
    html += `<div style="background:linear-gradient(135deg,#1a0033,#2e0055);border:1px solid #9b59b6;border-radius:8px;padding:12px 16px;margin-bottom:14px;text-align:center">
      <div style="font-size:15px;font-weight:700;color:#d4a8ff;letter-spacing:1px">驍よ亢繝ｻ髫ｴ蟶帶ｲｺ陟｢・ｰ髴大､ｲ・ｽ・ｹ髯具ｽｻ繝ｻ・･鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ/div>
      <div style="font-size:12px;color:#a29bfe;margin-top:4px">髴大､ｲ・ｽ・ｹ髯具ｽｻ繝ｻ・･驍ｵ・ｺ繝ｻ・ｪ鬮｣鬆托ｽｧ・ｫ陟守ｿｫ繝ｻ遶乗亢繝ｻ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ驍ｵ・ｺ繝ｻ・ｧ鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ陜捺ｻ難ｽ｣・ｧ+1</div>
    </div>`;
  }

  // L1: 髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬯ｩ蛹・ｽｽ・ｸ髫ｰ螢ｽ・ｩ・ｸ繝ｻ・ｼ闔・･郢晢ｽｻ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬯ｩ蛹・ｽｽ・ｸ髫ｰ螢ｽ・ｧ・ｫ陟弱・螯吶・・ｽ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｯ髫ｰ謔ｶ繝ｻ繝ｻ・ｨ陷ｷ・ｩ繝ｻ・ｻ陋滂ｽ･遯ｶ・ｳ郢晢ｽｻ郢晢ｽｻ
  html += '<div class="panel-title" style="margin-top:0">髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬯ｩ蛹・ｽｽ・ｸ髫ｰ螢ｹ繝ｻ/div>';
  const baseAtt = Engine.economy.calcBaseAttendance(G.orgPop);
  html += '<div class="venue-grid">';
  VENUES.forEach((v, i) => {
    const selected = G.showVenue === i;
    const fillRate = baseAtt / v.cap;
    let riskClass = '', riskLabel = '';
    if (fillRate >= 0.7) { riskClass = 'venue-safe'; riskLabel = '髫ｨ・ｳ郢晢ｽｻ髯橸ｽｳ霑壼生繝ｻ'; }
    else if (fillRate >= 0.4) { riskClass = 'venue-risky'; riskLabel = '髫ｨ繝ｻ・ｽ・ｳ 髫ｰ荵滂ｽｬ・ｬ陝具ｽｶ'; }
    else { riskClass = 'venue-danger'; riskLabel = '髫ｨ・ｨ郢晢ｽｻ髯ｷ螂・ｽｽ・ｱ鬯ｮ・ｯ繝ｻ・ｺ'; }
    html += `<div class="venue-card ${selected ? 'selected' : ''} ${riskClass}"
      onclick="App.setShowVenue(${i});renderShowPrep()">
      ${v.img ? `<img src="${v.img}" style="width:100%;height:80px;object-fit:cover;border-radius:4px 4px 0 0;opacity:0.8" onerror="this.style.display='none'" alt="">` : ''}
      <div class="venue-name">${v.name}</div>
      <div class="venue-info">驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・｣驛｢譏ｴ繝ｻ ${v.cap.toLocaleString()}髣費｣ｰ繝ｻ・ｺ</div>
      <div class="venue-info">驛｢・ｧ繝ｻ・ｳ驛｢・ｧ繝ｻ・ｹ驛｢譏ｴ繝ｻ ${v.cost}髣包ｽｳ郢晢ｽｻ/div>
      <div class="venue-info">鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ陜捺ｻ難ｽ｣・ｧ: ${v.maxMatches}鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ郢晢ｽｻ{(isSpecialShow(G.week) || isPPV(G.week)) ? ' <span style="color:var(--gold)">(+1)</span>' : ''}</div>
      <div class="venue-risk">${riskLabel}</div>
    </div>`;
  });
  html += '</div>';

  // Match card 驕ｯ・ｶ郢晢ｽｻ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬮ｫ遨ゑｽｹ證ｦ・ｽ・ｨ繝ｻ・｡鬯ｨ・ｾ繝ｻ・｣髯ｷ蟠趣ｽｼ譁舌・鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ陜捺ｻ難ｽ｣・ｧ
  const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
  // pad up OR trim down to match the venue's limit
  {
    let adjusted = [...G.showCard];
    while (adjusted.length < maxMatches) adjusted.push({left:0, right:0, isTitle:false});
    if (adjusted.length > maxMatches) adjusted = adjusted.slice(0, maxMatches);
    if (adjusted.length !== G.showCard.length) G = { ...G, showCard: adjusted };
  }

  // Sanitize stale IDs (released/retired/transferred wrestlers still in card)
  // forcedRest郢晢ｽｻ郢晢ｽｻ3髣費ｽｨ魄・ｽｹ繝ｻ・､闔ｨ繝ｻ・ｽ・｡陋滂ｽ･繝ｻ讚・ｽｬ繝ｻ・ｽ・ｿ鬮ｫ・ｱ隰ｳ・ｾ繝ｻ・ｼ陝ｲ・ｨ郢晢ｽｻ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ繧具ｽｫ・ｯ繝ｻ・､髯樊ｺ倥・
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
  // v2.0: 驛｢譎・ｽｼ譁撰ｼ憺Δ譎｢・ｽ・ｳ髫ｴ蟶ｶ・ｺ・ｷ繝ｻ・ｾ郢晢ｽｻ繝ｻ・ｺ繝ｻ・ｦ驛｢譏懶ｽｻ・｣郢晢ｽｭ驛｢譎｢・ｽ・ｫ郢晢ｽｻ陜捺ｻ督蜻ｵ譽斐・・ｧ3髣比ｼ夲ｽｽ・ｶ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ郢晢ｽｻ郢晢ｽｻ
  const fanExpects = Engine.fanExpect.generate(G);
  if (fanExpects.length > 0) {
    const validCurrent = G.showCard.filter(m => m.left > 0 && m.right > 0);
    const matchedCount = Engine.fanExpect.countMatched(validCurrent, fanExpects);
    html += `<div style="margin-bottom:14px;padding:10px 12px;background:rgba(212,168,67,0.07);border:1px solid rgba(212,168,67,0.2);border-radius:6px">`;
    html += `<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:6px">・滓ｨ呈ｿｫ 驛｢譎・ｽｼ譁撰ｼ憺Δ譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｮ髯橸ｽ｢繝ｻ・ｰ ${matchedCount > 0 ? `<span style="color:#2ecc71;font-size:11px">郢晢ｽｻ郢晢ｽｻ{matchedCount}髣比ｼ夲ｽｽ・ｶ髯ｷ・ｿ髢ｧ・ｴ闕ｳ蜊蜿峨・・ｭ 驕ｶ鄙ｫ繝ｻMQ+5 / 鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ髣鯉ｽｨ繝ｻ・ｼ郢晢ｽｻ/span>` : ''}</div>`;
    fanExpects.forEach(exp => {
      const isOnCard = validCurrent.some(m =>
        (m.left === exp.leftId && m.right === exp.rightId) ||
        (m.left === exp.rightId && m.right === exp.leftId)
      );
      const checkMark = isOnCard ? '<span style="color:#2ecc71;font-weight:700">髫ｨ・ｨ郢晢ｽｻ</span>' : '驕ｯ・ｶ繝ｻ・｢ ';
      const color = isOnCard ? 'color:#2ecc71' : 'color:var(--text-sub)';
      html += `<div style="font-size:11px;${color};margin-top:3px">${checkMark}${exp.reason}</div>`;
    });
    html += '</div>';
  }

  html += `<div style="display:flex;align-items:center;gap:12px;margin-top:16px">
    <div class="panel-title" style="margin:0">驛｢譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｶ繝ｻ邵ｺ蜥ｲ・ｹ譎｢・ｽ・ｼ驛｢譏懶ｽｼ螟ｲ・ｽ・ｼ陜捺ｻ督蜻ｵ譽斐・・ｧ${maxMatches}鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ髣鯉ｽｨ繝ｻ・ｼ郢晢ｽｻ/div>
    <button class="btn btn-blue btn-sm" onclick="autoFillCard();renderShowPrep()">髫ｨ・ｨ繝ｻ・ｨ 鬮｢・ｾ繝ｻ・ｪ髯ｷ閧ｴ繝ｻ繝ｻ・ｷ繝ｻ・ｨ髫ｰ蠕後・/button>
    <button class="btn btn-sm" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c" onclick="App.clearShowCard()">・滓ｧｫ蠏ｯ 髯ｷ闌ｨ・ｽ・ｨ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢</button>
  </div>`;

  for (let i = 0; i < maxMatches; i++) {
    const isMain = i === 0;
    const availL = getAvailableForSlot(i, 'left');
    const availR = getAvailableForSlot(i, 'right');
    // Include currently selected fighter in their own dropdown even if "used"
    const curL = G.showCard[i].left;
    const curR = G.showCard[i].right;

    const makeOptions = (avail, curVal) => {
      let opts = '<option value="0">-- 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ豢ｸ遶城メ・ｬ螢ｹ繝ｻ--</option>';
      const ids = new Set(avail.map(c => c.id));
      if (curVal > 0 && !ids.has(curVal)) {
        const extra = G.roster.find(c => c.id === curVal);
        if (extra) avail = [{ ...extra, _usedInOtherSlot: false }, ...avail];
      }
      // Sort: available first, then used-in-other-slot; within each group by OVR desc
      avail.sort((a, b) => (a._usedInOtherSlot ? 1 : 0) - (b._usedInOtherSlot ? 1 : 0) || ov(b) - ov(a));
      avail.forEach(c => {
        const champMark = G.titles.world.championId === c.id ? '・滓ｫ∬・ ' : '';
        const lastRunMark = c.lastRun ? '・滓ｨ奇ｽ｡繝ｻ' : '';
        const usedMark = c._usedInOtherSlot ? '・滓ｧｫ・｣・ｲ ' : '';
        const usedSuffix = c._usedInOtherSlot ? ' [髯ｷ繝ｻ・ｽ・ｺ髯懶ｽ｣繝ｻ・ｴ髣包ｽｳ繝ｻ・ｭ]' : '';
        const lastRunSuffix = c.lastRun ? ' [驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・ｹ驛｢譎冗樟・主ｸｷ・ｹ譎｢・ｽ・ｳ]' : '';
        opts += `<option value="${c.id}" ${curVal===c.id?'selected':''}>${usedMark}${lastRunMark}${champMark}${c.name} (鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ${ov(c)} 髣厄ｽｴ隶鯉ｽ｢繝ｻ・ｪ繝ｻ・ｿ:${c.condition})${usedSuffix}${lastRunSuffix}</option>`;
      });
      return opts;
    };

    const champId = G.titles.world.championId;
    const hasChamp = champId && (curL === champId || curR === champId);
    const isVacant = !champId;
    // v1.2: 12鬯ｨ・ｾ繝ｻ・ｱ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ驛｢謨鳴驛｢・ｧ繝ｻ・ｦ驛｢譎｢・ｽ・ｳ驛｢譏ｶ繝ｻ邵ｺ閾･・ｹ譏ｴ繝ｻ邵ｺ繝ｻ
    const cdCheck = Engine.title.canTitleMatch(G); // { allowed, weeksLeft }
    const titleEligible = G.titleEstablished && (hasChamp || (isVacant && curL > 0 && curR > 0));
    // Rental restriction: 驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取刮・ｹ譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｶ繝ｻ郢晢ｽｻ髯懶ｽ｣繝ｻ・ｴ髣包ｽｳ隶朱宦・ｺ繝ｻ
    const slotHasRental = [curL, curR].some(id => id > 0 && G.roster.find(c => c.id === id)?.isRental);
    const canTitle = titleEligible && cdCheck.allowed && !slotHasRental;
    const isTitle = G.showCard[i].isTitle || false;
    const titleLabel = isVacant ? '髯具ｽｻ隴乗・・ｽ・ｻ繝ｻ・｣鬩阪・莠具ｾつ郢晢ｽｻ繝ｻ・ｱ繝ｻ・ｺ髯橸ｽｳ陞｢・ｽ陝具ｽｶ' : '驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取凵・ｬ魃会ｽｽ・ｦ';
    const rivalLvl = (curL > 0 && curR > 0) ? getRivalryLevel(curL, curR) : null;

    // 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎∝ｴ溘・・ｮ繝ｻ・ｮ髯溯ｶ｣・ｽ・ｦ驛｢譎丞ｹｲ・取ｨ抵ｽｹ譎∽ｾｭ・守､ｼ・ｹ譎｢・ｽ・ｼ
    const freshnessPreview = (curL > 0 && curR > 0)
      ? Engine.freshness.calc(G.matchupLog || [], curL, curR, G.totalShows || 0)
      : null;

    // 驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・ｹ驛｢譎冗樟・主ｸｷ・ｹ譎｢・ｽ・ｳ驛｢譏ｶ繝ｻ邵ｺ閾･・ｹ譏ｴ繝ｻ邵ｺ繝ｻ
    const lastRunL = curL > 0 ? G.roster.find(c => c.id === curL)?.lastRun : false;
    const lastRunR = curR > 0 ? G.roster.find(c => c.id === curR)?.lastRun : false;
    const isLastRunMatch = lastRunL || lastRunR;

    html += `<div class="match-slot ${isMain ? 'main-event' : ''}" style="margin-top:8px${isLastRunMatch ? ';border-color:rgba(212,168,67,0.4);background:rgba(212,168,67,0.03)' : ''}">
      <div class="match-slot-num">${isMain ? '髫ｨ蛟･繝ｻ : i+1}</div>
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
        ${canTitle ? `<label style="color:var(--gold);cursor:pointer"><input type="checkbox" ${isTitle?'checked':''} onchange="toggleTitle(${i});renderShowPrep()"> ・滓ｨ｣繝ｻ${titleLabel}</label>` : ''}
        ${titleEligible && !cdCheck.allowed ? `<span style="color:var(--text-dim);font-size:11px" title="驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取刮・ｹ譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｶ繝ｻ郢晢ｽｻ12鬯ｨ・ｾ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｫ1髯懃軸・ｧ・ｭ遶擾ｽｪ驍ｵ・ｺ繝ｻ・ｧ">驕ｶ・｢繝ｻ・ｳ 髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取刮・ｹ譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｶ繝ｻ遶擾ｽｪ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ郢ｧ繝ｻ繝ｻ${cdCheck.weeksLeft}鬯ｨ・ｾ繝ｻ・ｱ</span>` : ''}
        ${titleEligible && cdCheck.allowed && slotHasRental ? `<span style="color:var(--text-dim);font-size:11px" title="驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取刮・ｹ譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｶ繝ｻ遶頑･｢諤弱・・ｺ髯懶ｽ｣繝ｻ・ｴ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ>・滓ｩｸ・ｽ・､郢晢ｽｻ驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取凵・ｬ魃会ｽｽ・ｦ髣包ｽｳ隶朱宦・ｺ繝ｻ/span>` : ''}
        ${(()=>{if(!isTitle||!champId||curL<=0||curR<=0)return'';const cf=champId===curL?G.roster.find(c=>c.id===curL):G.roster.find(c=>c.id===curR);const chf=champId===curL?G.roster.find(c=>c.id===curR):G.roster.find(c=>c.id===curL);if(!cf||!chf)return'';const gap=Engine.util.ov(cf)-Engine.util.ov(chf);if(gap>20)return`<span style="color:#e74c3c;font-size:11px" title="髫ｴ・ｬ繝ｻ・ｼ髯晢ｽｾ繝ｻ・ｮ驍ｵ・ｺ隰疲ｻゑｽｽ・､繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ讓抵ｽｹ・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取刮・ｹ譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｴ繝ｻOVR髯晢ｽｾ繝ｻ・ｮ${gap})驍ｵ・ｺ繝ｻ・ｯMQ-6">髫ｨ讖ｸ・｣・ｰ郢晢ｽｻ郢晢ｽｻ髫ｴ・ｬ繝ｻ・ｼ髯晢ｽｾ繝ｻ・ｮ髯樊ｻゑｽｽ・ｧ(OVR髯晢ｽｾ繝ｻ・ｮ${gap}) MQ-6</span>`;if(gap>10)return`<span style="color:#e67e22;font-size:11px" title="髫ｴ・ｬ繝ｻ・ｼ髯晢ｽｾ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取刮・ｹ譎・ｽｧ・ｭ郢晢ｽ｣驛｢譏ｴ繝ｻOVR髯晢ｽｾ繝ｻ・ｮ${gap})驍ｵ・ｺ繝ｻ・ｯMQ-3">髫ｨ讖ｸ・｣・ｰ郢晢ｽｻ郢晢ｽｻ髫ｴ・ｬ繝ｻ・ｼ髯晢ｽｾ繝ｻ・ｮ(OVR髯晢ｽｾ繝ｻ・ｮ${gap}) MQ-3</span>`;return'';})()}
        ${!G.titleEstablished && curL > 0 && curR > 0 ? `<span style="color:var(--text-dim);font-size:11px" title="鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ髯懃軸・ｧ・ｭ郢晢ｽｻ髣費｣ｰ繝ｻ・ｺ髮主ｾ後・5驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｼ5髣費｣ｰ繝ｻ・ｺ驍ｵ・ｺ繝ｻ・ｧ鬮ｫ・ｪ繝ｻ・ｭ鬩包ｽｶ郢晢ｽｻ>・滓ｨ貞項 鬩阪・蜚ｱ繝ｻ・ｺ繝ｻ・ｧ髫ｴ蟷｢・ｽ・ｪ鬮ｫ・ｪ繝ｻ・ｭ鬩包ｽｶ郢晢ｽｻ/span>` : ''}
        ${rivalLvl ? `<span style="color:${rivalLvl.color}">${rivalLvl.emoji}${rivalLvl.label}(MQ+${rivalLvl.mqBonus})</span>` : ''}
        ${freshnessPreview && freshnessPreview.label ? `<span style="color:${freshnessPreview.bonus > 0 ? '#74b9ff' : '#e17055'};font-size:11px">${freshnessPreview.bonus > 0 ? '髫ｨ・ｨ繝ｻ・ｨ' : '・滓ｧｭ繝ｻ'} ${freshnessPreview.label}(MQ${freshnessPreview.bonus > 0 ? '+' : ''}${freshnessPreview.bonus})</span>` : ''}
        ${isLastRunMatch ? `<span style="color:var(--gold);font-weight:700">・滓ｨ奇ｽ｡繝ｻ驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・ｹ驛｢譎冗樟郢晢ｽｻ驛｢譏ｴ繝ｻ郢晢ｽ｡ (MQ+3${i===maxMatches-1?' +驛｢譎｢・ｽ・｡驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ+5':''})</span>` : ''}
      </div>
    </div>`;
  }

  // L1: 驍ｵ・ｺ隰費ｽｶ隨・ｽｲ驍ｵ・ｺ闕ｳ螂・ｽｽ莨・ｽｫ・ｮ郢晢ｽｻ繝ｻ・ｮ繝ｻ・｢髣費｣ｰ陜捺ｻゑｽｽ・ｸ繝ｻ・ｬ郢晢ｽｻ陜捺ｻゑｽｽ・ｭ繝ｻ・｣鬩墓慣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｪ髫ｰ・ｨ繝ｻ・ｰ髯昴・蟷ｲ郢晢ｽｻ鬯ｮ・ｱ隶壹・・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ郢晢ｽｻ郢晢ｽｻ
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
  const momentumLabel = (G.attendanceMomentum || 0) > 0.05 ? '・滓ｧｫ・ｶ繝ｻ髯ｷ謳ｾ・ｽ・｢驍ｵ・ｺ郢晢ｽｻ遶包｣ｰ驛｢・ｧ郢晢ｽｻ
    : (G.attendanceMomentum || 0) < -0.05 ? '・滓ｨ翫◇ 髯ｷ謳ｾ・ｽ・｢驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｽ隲・ｹ繝ｻ・ｸ郢晢ｽｻ : '';

  const heat = getHeatLevel();
  html += `<div style="margin-top:12px;padding:10px;background:rgba(0,0,0,0.3);border-radius:4px;font-size:12px">
    <div style="margin-bottom:6px;font-size:14px;font-weight:700;color:${prediction.color}">${prediction.text}</div>
    <div style="margin-bottom:4px"><span style="color:${heat.color}">${heat.emoji} Heat: ${heat.label}郢晢ｽｻ騾趣ｽｯ陝・｢第･懊・・｢繝ｻ繝ｻ繝ｻ{heat.mult}郢晢ｽｻ郢晢ｽｻ/span>${hasTitlePreview ? ' <span style="color:var(--gold)">・滓ｨ｣繝ｻ 驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・取凵・ｬ魃会ｽｽ・ｦ郢晢ｽｻ騾趣ｽｯ陝・｢第･懊・・｢繝ｻ繝ｻ繝ｻ.15郢晢ｽｻ郢晢ｽｻ/span>' : ''}${hasChampPreview ? ' <span style="color:var(--gold)">・滓ｫ∬・ 鬩阪・莠具ｾつ郢晢ｽｻ郢晢ｽｻ髯懶ｽ｣繝ｻ・ｴ郢晢ｽｻ騾趣ｽｯ陝・｢第･懊・・｢繝ｻ繝ｻ繝ｻ.10郢晢ｽｻ郢晢ｽｻ/span>' : ''}</div>
    <div><strong>髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ:</strong> ${v.name}郢晢ｽｻ郢晢ｽｻ{v.cap.toLocaleString()}髯晢ｽｶ繝ｻ・ｭ郢晢ｽｻ郢晢ｽｻ<strong>髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬮ｮ蜈ｷ・ｽ・ｻ:</strong> -${v.cost}髣包ｽｳ郢晢ｽｻ{momentumLabel ? ` &nbsp;| ${momentumLabel}` : ''}</div>
    ${estCrowdMQ.total !== 0 ? `<div style="margin-top:4px;color:${estCrowdMQ.total > 0 ? 'var(--green)' : 'var(--red)'}">・滓ｧｫ莠ｫ郢晢ｽｻ郢晢ｽｻ髣費｣ｰ陜捺ｹｮ・ｦ髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ髴趣ｽｭ繝ｻ・ｱ髮主ｾ後・ MQ髯ｷ闌ｨ・ｽ・ｨ鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ郢晢ｽｻ{estCrowdMQ.total >= 0 ? '+' : ''}${estCrowdMQ.total}${estCrowdMQ.crowdLabel ? '郢晢ｽｻ郢晢ｽｻ + estCrowdMQ.crowdLabel + '郢晢ｽｻ郢晢ｽｻ : ''}</div>` : ''}
  </div>`;

  html += '<div class="btn-row" style="margin-top:16px">';
  html += `<button class="btn btn-gold" onclick="executeShow()" ${validMatches.length === 0 ? 'disabled' : ''}>鬮｣莨√Γ繝ｻ・｡驕停・・ｹ謌雁ｲｷ繝ｻ・ｬ郢晢ｽｻ郢晢ｽｻ(${validMatches.length}鬮ｫ・ｧ繝ｻ・ｦ髯ｷ・ｷ郢晢ｽｻ</button>`;
  html += '<button class="btn btn-blue" onclick="G={...G,weekPhase:\'manage\'};showScreen(\'week\');refreshAll()">髫ｰ魃会ｽｽ・ｻ驛｢・ｧ郢晢ｽｻ/button>';
  html += '</div>';

  el.innerHTML = html;
}

// 鬮ｮ蜈ｷ・ｽ・｡髯ｷ讎顔函邵ｺ・｡驛｢譎・§・取㏍・ｹ譏ｴ繝ｻ邵ｺ蛟｡・ｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ: 驛｢譎｢・ｽ・ｩ驛｢譎冗函・取凵・ｱ繝ｻ・ｽ・｣鬮ｫ遨ゑｽｸ讒ｫ蟇・Δ譎渉・･・取刮・ｹ譏懶ｽｻ・｣郢晢ｽｻ
function _normalizeFinanceLabel(label) {
  if (label.startsWith('驛｢譏ｶ繝ｻ邵ｺ骰具ｽｹ譏ｴ繝ｻ郢晢ｽｨ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ')) return '驛｢譏ｶ繝ｻ邵ｺ骰具ｽｹ譏ｴ繝ｻ郢晢ｽｨ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ';
  if (label.startsWith('驛｢・ｧ繝ｻ・ｰ驛｢譏ｴ繝ｻ邵ｺ諛・╂闕ｳ・ｻ郢晢ｽｻ')) return '驛｢・ｧ繝ｻ・ｰ驛｢譏ｴ繝ｻ邵ｺ諛・╂闕ｳ・ｻ郢晢ｽｻ';
  if (label.startsWith('髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬮ｮ蜈ｷ・ｽ・ｻ')) return '髣費ｽｨ陞｢・ｼ繝ｻ・ｰ繝ｻ・ｴ鬮ｮ蜈ｷ・ｽ・ｻ';
  return label.replace(/郢晢ｽｻ郢晢ｽｻ*?郢晢ｽｻ郢晢ｽｻg, '').replace(/\d+髣費｣ｰ繝ｻ・ｺ/g, '').trim();
}

// 鬮ｮ蜈ｷ・ｽ・｡髯ｷ讎顔函邵ｺ・｡驛｢譎・§・取㏍・ｹ譏ｴ繝ｻ邵ｺ蛟｡・ｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ: 髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ
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

  // 髫ｨ貂可髫ｨ貂可 髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ驛｢譎√・郢晢ｽｻ 髫ｨ貂可髫ｨ貂可
  const periodDefs = [{ k:'month', l:'髣碑崟・ｰ隨ｬﾂ・ｦ' }, { k:'year', l:'髯晢ｽｷ繝ｻ・ｴ鬯ｮ・｢郢晢ｽｻ }, { k:'all', l:'髯ｷ闌ｨ・ｽ・ｨ髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣' }];
  let html = `<div style="display:flex;gap:6px;margin-bottom:10px">`;
  periodDefs.forEach(p => {
    const a = period === p.k;
    html += `<button onclick="document.getElementById('financeContent').dataset.financePeriod='${p.k}';renderFinance()" style="flex:1;padding:6px 4px;border:1px solid ${a?'var(--gold)':'var(--border)'};background:${a?'rgba(255,200,60,0.1)':'var(--bg-card)'};border-radius:5px;cursor:pointer;font-size:12px;color:${a?'var(--gold)':'var(--text-dim)'};font-weight:${a?700:400}">${p.l}</button>`;
  });
  html += `</div>`;

  // 髫ｨ貂可髫ｨ貂可 驛｢・ｧ繝ｻ・ｵ驛｢譎・§邵ｺ・｡驛｢譎・§郢晢ｽｰ驛｢譎｢・ｽ・ｼ 髫ｨ貂可髫ｨ貂可
  const tabDefs = [{ k:'summary', l:'・滓ｨ雁・ 鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ }, { k:'income', l:'・滓ｧｫ・ｶ繝ｻ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ' }, { k:'expense', l:'・滓ｨ翫◇ 髫ｰ・ｾ繝ｻ・ｯ髯ｷ繝ｻ・ｽ・ｺ' }, { k:'salary', l:'・滓ｫ√・ 鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ }];
  html += `<div style="display:flex;gap:4px;margin-bottom:14px">`;
  tabDefs.forEach(t => {
    const a = tab === t.k;
    html += `<button onclick="document.getElementById('financeContent').dataset.financeTab='${t.k}';renderFinance()" style="flex:1;padding:7px 2px;border:1px solid ${a?'var(--gold)':'var(--border)'};background:${a?'rgba(255,200,60,0.1)':'var(--bg-card)'};border-radius:5px;cursor:pointer;font-size:11px;color:${a?'var(--gold)':'var(--text-dim)'};font-weight:${a?700:400}">${t.l}</button>`;
  });
  html += `</div>`;

  // 髫ｨ貂可髫ｨ貂可 鬩搾ｽｱ闕ｳ讓抵ｽｲ迢暦ｽｹ・ｧ繝ｻ・ｿ驛｢譏ｴ繝ｻ髫ｨ貂可髫ｨ貂可
  if (tab === 'summary') {
    html += `<div style="font-size:24px;font-weight:900;margin-bottom:12px;color:${G.funds >= 0 ? 'var(--green)' : 'var(--red)'}">${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ/div>`;

    // 鬮ｮ蟲ｨ繝ｻ遶包ｽ｡髫ｰ證ｦ・ｽ・ｨ鬩募∞・ｽ・ｻ驛｢譏ｶ繝ｻ・取・・ｹ譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ
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
      svg += `<text x="${lastX}" y="${lastY-8}" text-anchor="end" fill="${lineColor}" font-size="11" font-weight="700">${fh[fh.length-1].toLocaleString()}髣包ｽｳ郢晢ｽｻ/text>`;
      svg += '</svg>';
      html += `<div style="margin-bottom:16px;padding:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px"><div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">・滓ｨ｣・ｳ・･ 鬮ｮ蟲ｨ繝ｻ遶包ｽ｡髫ｰ證ｦ・ｽ・ｨ鬩募∞・ｽ・ｻ (${fh.length}鬯ｨ・ｾ繝ｻ・ｱ)</div>${svg}</div>`;
    }

    // 髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驛｢・ｧ繝ｻ・ｵ驛｢譎・ｽｧ・ｭ・弱・
    if (filtered.length > 0) {
      let totalIncome = 0, totalExpense = 0;
      filtered.forEach(h => { totalIncome += h.income || 0; totalExpense += h.expense || 0; });
      const totalNet = totalIncome - totalExpense;
      const periodLabel = period === 'month' ? '髣碑崟・ｰ隨ｬﾂ・ｦ' : period === 'year' ? '髣碑・・ｿ・ｫ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ' : '髯ｷ闌ｨ・ｽ・ｨ髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣';
      html += `<div class="panel-title">髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驛｢・ｧ繝ｻ・ｵ驛｢譎・ｽｧ・ｭ・弱・驕ｯ・ｶ郢晢ｽｻ${periodLabel} <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${filtered.length}鬯ｨ・ｾ繝ｻ・ｱ)</span></div>`;
      html += `<div class="finance-row"><span class="f-label">・滓ｧｫ・ｶ繝ｻ鬩搾ｽｱ闕ｳ讒ｫ・ｺ・ｶ髯ｷ闌ｨ・ｽ・･</span><span class="f-val income">+${totalIncome.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></div>`;
      html += `<div class="finance-row"><span class="f-label">・滓ｨ翫◇ 鬩搾ｽｱ闕ｵ驤ｴ・ｫ・ｪ髯ｷ繝ｻ・ｽ・ｺ</span><span class="f-val expense">-${totalExpense.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></div>`;
      html += `<div class="finance-row finance-total"><span>鬩堺ｹ暦ｽｳ迹壽・鬨ｾ・ｶ郢晢ｽｻ/span><span class="f-val ${totalNet >= 0 ? 'income' : 'expense'}">${totalNet >= 0 ? '+' : ''}${totalNet.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驍ｵ・ｺ繝ｻ・ｮ鬮ｫ・ｪ陋滂ｽｬ魄厄ｽｸ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>`;
      // 髫ｰ證ｦ・ｽ・ｨ髯橸ｽｳ陞滄搨ﾂ繝ｻ・ｱ鬯ｮ・｢髦ｮ蜷ｶ・・Δ・ｧ繝ｻ・ｹ驛｢譎∬か繝ｻ・ｼ闔・･郢晢ｽｻ髯懃軸・ｫ繝ｻ・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ鬨ｾ蛹・ｽｽ・ｨ郢晢ｽｻ郢晢ｽｻ
      html += '<div class="panel-title" style="margin-top:12px">鬯ｨ・ｾ繝ｻ・ｱ鬯ｮ・｢髦ｮ蜷ｶ・・Δ・ｧ繝ｻ・ｹ驛｢譏懶ｽｺ・･郢晢ｽｻ鬮ｫ・ｪ繝ｻ・ｳ郢晢ｽｻ陜捺ｺｯﾂ・ｳ髯橸ｽｳ陞滂ｽｲ繝ｻ・ｼ郢晢ｽｻ/div>';
      html += `<div class="finance-row"><span class="f-label">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ霍昴・・ｵ繝ｻ・ｦ髣包ｽｳ闕ｳ・ｻ驍顔洸蝮守ｹ晢ｽｻ/span><span class="f-val expense">-${calcWeeklySalary()}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</span></div>`;
      html += `<div class="finance-row"><span class="f-label">髣費｣ｰ陷ｿ・･雋阪・・ｩ蜍溷罰鬮ｴ・ｧ鬮ｮ蜈ｷ・ｽ・ｻ</span><span class="f-val expense">-${FIXED_COSTS.admin}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</span></div>`;
      const coachTotal = getCoachSalaryTotal();
      if (coachTotal > 0) html += `<div class="finance-row"><span class="f-label">驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ謔ｪ繝ｻ・ｵ繝ｻ・ｦ髣包ｽｳ髮懶ｽ｣繝ｻ・ｼ郢晢ｽｻ{G.coaches.length}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/span><span class="f-val expense">-${coachTotal}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</span></div>`;
      html += `<div class="finance-row"><span class="f-label">驛｢・ｧ繝ｻ・ｹ驛｢譎・ｺ｢・趣ｽｦ驛｢・ｧ繝ｻ・ｵ驛｢譎｢・ｽ・ｼ</span><span class="f-val income">+${getSponsorIncome()}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</span></div>`;
      html += `<div class="finance-row"><span class="f-label">髫ｰ・ｾ繝ｻ・ｾ髫ｴ謫ｾ・｣・ｰ髫ｶ髮｣・ｽ・ｩ</span><span class="f-val income">+${getBroadcastIncome()}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</span></div>`;
    }
  }

  // 髫ｨ貂可髫ｨ貂可 髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢譏ｴ繝ｻ髫ｨ貂可髫ｨ貂可
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
        html += `<div class="finance-row"><span class="f-label">${d.label}</span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:10px;color:var(--text-dim)">繝ｻ繝ｻ繝ｻ{d.count}</span><span class="f-val income">+${d.val.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></span></div>`;
      });
      html += `<div style="border-top:1px solid var(--border);margin:8px 0"></div>`;
      html += `<div class="finance-row finance-total"><span>鬩搾ｽｱ闕ｳ讒ｫ・ｺ・ｶ髯ｷ闌ｨ・ｽ・･</span><span class="f-val income">+${total.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驍ｵ・ｺ繝ｻ・ｮ髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ鬮ｫ・ｪ陋滂ｽｬ魄厄ｽｸ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>`;
    }
  }

  // 髫ｨ貂可髫ｨ貂可 髫ｰ・ｾ繝ｻ・ｯ髯ｷ繝ｻ・ｽ・ｺ驛｢・ｧ繝ｻ・ｿ驛｢譏ｴ繝ｻ髫ｨ貂可髫ｨ貂可
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
        html += `<div class="finance-row"><span class="f-label">${d.label}</span><span style="display:flex;align-items:center;gap:6px"><span style="font-size:10px;color:var(--text-dim)">繝ｻ繝ｻ繝ｻ{d.count}</span><span class="f-val expense">${d.val.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></span></div>`;
      });
      html += `<div style="border-top:1px solid var(--border);margin:8px 0"></div>`;
      html += `<div class="finance-row finance-total"><span>鬩搾ｽｱ闕ｵ驤ｴ・ｫ・ｪ髯ｷ繝ｻ・ｽ・ｺ</span><span class="f-val expense">${total.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim);padding:8px 0">驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣驍ｵ・ｺ繝ｻ・ｮ髫ｰ・ｾ繝ｻ・ｯ髯ｷ繝ｻ・ｽ・ｺ鬮ｫ・ｪ陋滂ｽｬ魄厄ｽｸ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>`;
    }
  }

  // 髫ｨ貂可髫ｨ貂可 鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ陟托ｽｱ邵ｺ・｡驛｢譏ｴ繝ｻ髫ｨ貂可髫ｨ貂可
  else if (tab === 'salary') {
    // 髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣髣包ｽｳ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｮ鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ陷ｿ螟懶ｽｫ・ｪ髫ｰ繝ｻ・ｼ雋ｻ・ｼ讚∵・鬩帙・・ｽ・ｨ郢晢ｽｻ
    let salaryTotal = 0, salaryWeeks = 0;
    filtered.forEach(h => {
      (h.details || []).filter(d => d.type === 'expense' && _normalizeFinanceLabel(d.label) === '鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ霍昴・・ｵ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ).forEach(d => {
        salaryTotal += d.val;
        salaryWeeks++;
      });
    });
    if (salaryWeeks > 0) {
      const periodLabel = period === 'month' ? '髣碑崟・ｰ隨ｬﾂ・ｦ' : period === 'year' ? '髣碑・・ｿ・ｫ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ' : '髯ｷ闌ｨ・ｽ・ｨ髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣';
      html += `<div class="panel-title">${periodLabel}驍ｵ・ｺ繝ｻ・ｮ鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ陷ｿ螟懶ｽｫ・ｪ髫ｰ繝ｻ・ｼ雋ｻ・ｼ繝ｻ/div>`;
      html += `<div class="finance-row finance-total"><span>鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ陷ｿ螟懶ｽｫ・ｪ髫ｰ繝ｻ・ｼ雋ｻ・ｼ讚∵・鬩帙・・ｽ・ｨ郢晢ｽｻ<span style="font-size:11px;color:var(--text-dim);font-weight:400">(${salaryWeeks}鬯ｨ・ｾ繝ｻ・ｱ)</span></span><span class="f-val expense">${salaryTotal.toLocaleString()}髣包ｽｳ郢晢ｽｻ/span></div>`;
      html += `<div style="margin-bottom:14px"></div>`;
    }
    // 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ隰厄ｽｨ鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ髮懶ｽ｣繝ｻ・ｼ髢ｧ・ｲ隶捺ｺｯ闊峨・・ｨ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｹ驛｢譎会ｽｿ・ｫ郢晢ｽ｣驛｢譎丞ｹｲ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｧ驛｢譏ｴ繝ｻ郢晢ｽｨ郢晢ｽｻ郢晢ｽｻ
    html += '<div class="panel-title">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ隰厄ｽｨ鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ髮懶ｽ｣繝ｻ・ｼ髢ｧ・ｲ隶捺ｺｯ闊峨・・ｨ郢晢ｽｻ郢晢ｽｻ/div>';
    html += '<table class="data-table"><tr><th>髯ｷ・ｷ隶朱｡披・</th><th>鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ/th><th>鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ/th></tr>';
    [...G.roster].sort((a, b) => getSalary(b) - getSalary(a)).forEach(c => {
      html += `<tr><td>${fLink(c, {source:'roster', size:'12px'})}</td><td class="num">${ov(c)}</td><td class="num">${getSalary(c)}髣包ｽｳ郢晢ｽｻ/td></tr>`;
    });
    html += '</table>';
  }

  el.innerHTML = html;
}

function renderLog() {
  const el = document.getElementById('logContent');
  // 驛｢・ｧ繝ｻ・ｲ驛｢譎｢・ｽ・ｼ驛｢譎｢・｣・ｰ鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ陞｢・ｹ郢晢ｽｰ驛｢譏ｴ繝ｻ邵ｺ繝ｻ
  const modeLabel = G.difficultyMode === 'hard' ? '鬯ｨ・ｾ陞｢・ｼ繝ｻ・ｸ繝ｻ・ｸ驛｢譎｢・ｽ・｢驛｢譎｢・ｽ・ｼ驛｢譏懶ｽｼ螟ｲ・ｽ・ｼ鬩帙・・ｽ・｣隲幢ｽｷ陷搾ｽｧ鬯ｩ・･闔会ｽ｣遶企・・ｸ・ｺ隴会ｽｦ繝ｻ・ｼ郢晢ｽｻ : '鬮ｯ・ｬ隲幢ｽｷ陷搾ｽｧ鬯ｩ・･闔会ｽ｣・守坩・ｹ譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ;
  const modeColor = G.difficultyMode === 'hard' ? '#e74c3c' : '#3498db';
  const survivalBadge = G.survivalCleared
    ? '<span style="color:#2ecc71;border:1px solid rgba(46,204,113,0.25);border-radius:3px;padding:1px 6px;font-weight:700;margin-left:6px">・滓ｫ√・ 鬩搾ｽｨ隰疲ｻ・ず髯橸ｽｳ霑壼遜・ｽ・ｮ陞｢・ｼ陜滂ｽｧ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢</span>'
    : '';
  let html = `<div style="margin-bottom:10px;font-size:11px;color:var(--text-dim)">
    <span style="color:${modeColor};border:1px solid ${modeColor}44;border-radius:3px;padding:1px 6px;font-weight:700">${modeLabel}</span>${survivalBadge}
    <span style="margin-left:6px">${G.orgName} 驕ｯ・ｶ郢晢ｽｻ${Engine.util.formatDate(G.season, G.week)}</span>
  </div>`;
  // v0.95: Enhanced log with filter
  const categories = [
    { key: 'all', label: '髯ｷ闌ｨ・ｽ・ｨ驍ｵ・ｺ繝ｻ・ｦ', icon: '髯ｷ闌ｨ・ｽ・ｨ' },
    { key: 'show', label: '鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ, icon: '鬮｣鄙ｫ繝ｻ, match: l => l.includes('鬮｣莨√Γ繝ｻ・｡郢晢ｽｻ) || l.includes('MQ') || l.includes('髯ｷ閧ｴ蜑碁洛繝ｻ) || l.includes('鬯ｮ・ｦ繝ｻ・ｲ鬮ｯ・ｦ郢晢ｽｻ) },
    { key: 'finance', label: '鬮ｮ蜈ｷ・ｽ・｡髯ｷ髦ｪ繝ｻ, icon: '鬯ｩ・･郢晢ｽｻ, match: l => l.includes('髯ｷ・ｿ闕ｳ・ｻ郢晢ｽｻ') || l.includes('髫ｰ・ｾ繝ｻ・ｯ髯ｷ繝ｻ・ｽ・ｺ') || l.includes('髣包ｽｳ郢晢ｽｻ) || l.includes('髫ｹ・ｿ驕擾ｽｩ繝ｻ・ｫ郢晢ｽｻ) },
    { key: 'event', label: '驛｢・ｧ繝ｻ・､驛｢譎冗函・趣ｽｦ驛｢譏ｴ繝ｻ, icon: '髫ｰ魃会ｽｽ・ｦ', match: l => l.includes('髯昴・・ｽ・ｾ髫ｰ螢ｹ繝ｻ) || l.includes('髫ｰ荵滂ｽｬ・ｬ陝具ｽｶ') || l.includes('鬯ｯ繝ｻ・・・・ｸ郢晢ｽｻ) || l.includes('鬩募∞・ｽ・ｻ鬩債郢晢ｽｻ) || l.includes('驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ') || l.includes('髯滄｡鯉ｽｼ謚ｫﾂ・ｳ髫ｰ螢ｽ繹ｱ遯ｶ・ｳ') },
    { key: 'season', label: '驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ', icon: '髯昴・・ｽ・｣', match: l => l.includes('驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ') || l.includes('驛｢・ｧ繝ｻ・ｪ驛｢譏ｴ繝ｻ) || l.includes('髯溽ｬｬ蝮ｩ・つ・つ') || l.includes('鬯ｮ・｢陷ｿ・･繝ｻ・ｹ郢晢ｽｻ) || l.includes('驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ') },
  ];
  const currentFilter = el.dataset.filter || 'all';
  html += '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
  categories.forEach(cat => {
    const active = currentFilter === cat.key;
    html += `<button onclick="document.getElementById('logContent').dataset.filter='${cat.key}';renderLog()" style="font-size:12px;padding:3px 8px;border-radius:3px;cursor:pointer;border:1px solid ${active ? 'var(--gold)' : 'var(--border)'};background:${active ? 'rgba(212,168,67,0.15)' : 'transparent'};color:${active ? 'var(--gold)' : 'var(--text-dim)'}">${cat.icon} ${cat.label}</button>`;
  });
  html += '</div>';

  // 驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｰ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｳ驛｢譎冗樟・取㏍・ｸ・ｺ繝ｻ・ｮ驛｢譏ｴ繝ｻ邵ｺ蜀暦ｽｹ・ｧ繝ｻ・ｹ驛｢譏懶ｽｺ・･陷ｿ蜻ｵ・ｰ蜍溷ｹｲ郢晢ｽｻ驛｢譎｢・ｽ・ｫ驛｢譏懶ｽｻ・｣郢晢ｽｻ郢晢ｽｻ陜捺ｻ捺､｢髯昴・ﾂ諛翫・ or 驛｢・ｧ繝ｻ・ｪ驛｢譎・§邵ｺ螟ゑｽｹ・ｧ繝ｻ・ｧ驛｢・ｧ繝ｻ・ｯ驛｢譏懶ｽｺ蛹・ｽｽ・ｸ繝ｻ・｡髯昴・・ｽ・ｾ髯滂ｽ｢隲幢ｽｶ繝ｻ・ｼ郢晢ｽｻ
  const getLogText = (entry) => typeof entry === 'string' ? entry : (entry && entry.text ? entry.text : '');
  const isSnapshot = (entry) => typeof entry === 'object' && entry && entry.type === 'snapshot';
  const matchFilter = (entry, fn) => fn(getLogText(entry));
  const filtered = currentFilter === 'all' ? G.gameLog : G.gameLog.filter(entry => {
    if (isSnapshot(entry)) return currentFilter === 'all'; // 驛｢・ｧ繝ｻ・ｹ驛｢譎会ｽｿ・ｫ郢晢ｽ｣驛｢譎丞ｹｲ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｧ驛｢譏ｴ繝ｻ郢晢ｽｨ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｲ隰疲ｺ倥・驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｲ鬮ｦ・ｪ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｿ
    const fn = categories.find(c => c.key === currentFilter)?.match;
    return fn ? matchFilter(entry, fn) : true;
  });
  const display = filtered.slice(-100).reverse();
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">${filtered.length}髣比ｼ夲ｽｽ・ｶ髣包ｽｳ繝ｻ・ｭ 髫ｴ蟠｢ﾂ髫ｴ繝ｻ・ｽ・ｰ${Math.min(display.length, 100)}髣比ｼ夲ｽｽ・ｶ</div>`;
  display.forEach(l => {
    if (isSnapshot(l)) {
      html += `<div class="log-snapshot" style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:11px">\u{1F4AD} ${l.text}</div>`;
    } else {
      html += `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:11px;color:var(--text-sub)">${getLogText(l)}</div>`;
    }
  });
  el.innerHTML = html;
}

// 髫ｨ貂可髫ｨ貂可 Ranking Screen (v0.9) 髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
function renderRanking() {
  const el = document.getElementById('rankingContent');
  // Recalculate live rankings
  const rankings = Engine.ranking.updateRankings(G);
  G = { ...G, rankings };

  let html = '';

  // Org-identity-based color map (matches RIVAL_ORGS + relmap)
  const ORG_RANK_COLORS = { player: '#d4a843', org_s: '#d63031', org_a: '#6c5ce7', org_b: '#00b894' };
  const getRankColor = (rank, orgId) => ORG_RANK_COLORS[orgId] || '#888';

  // Victory condition reminder
  const topAI = rankings.find(r => r.orgId !== 'player');
  const playerEntry = rankings.find(r => r.orgId === 'player');
  if (topAI && playerEntry) {
    const gap = topAI.rating - playerEntry.rating;
    if (gap > 0) {
      html += `<div style="margin-bottom:16px;padding:12px;background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:6px;font-size:12px">
        ・滓ｫ・ｽｭ繝ｻ<strong>髯ｷ閧ｴ蜑碁洛諛・ｽｭ螟ｲ・ｽ・｡髣比ｼ夲ｽｽ・ｶ</strong>: 1髣厄ｽｴ隶朱宦・ｱ・ｮ髣厄ｽｴ郢晢ｽｻ<strong>${topAI.name}</strong>郢晢ｽｻ郢晢ｽｻ{topAI.rating}pt郢晢ｽｻ陝ｲ・ｨ繝ｻ蟶晏ｱ・ｹ晢ｽｻ遶擾ｽｴ驛｢・ｧ闕ｵ譎｢・ｼ繝ｻ・ｸ・ｺ繝ｻ・ｨ 驕ｯ・ｶ郢晢ｽｻ驍ｵ・ｺ郢ｧ繝ｻ繝ｻ <strong style="color:var(--gold)">${gap}pt</strong>
      </div>`;
    } else {
      html += `<div style="margin-bottom:16px;padding:12px;background:rgba(46,204,113,0.12);border:1px solid rgba(46,204,113,0.3);border-radius:6px;font-size:12px">
        ・滓ｫ∬・ <strong style="color:#2ecc71">髫ｶ魃会ｽｽ・ｭ鬨ｾ・｡郢晢ｽｻ髣厄ｽｴ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/strong> 驍ｵ・ｺ郢ｧ繝ｻ繝ｻ驍ｵ・ｺ雋・･繝ｻ髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｮﾂ・ｲ鬯ｯ繝ｻ・臥ｸｺ蟶ｷ・ｸ・ｺ繝ｻ・ｫ鬩包ｽｶ闕ｵ譏ｶ螟｢驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ
      </div>`;
    }
  }

  // Ranking table 驕ｯ・ｶ郢晢ｽｻtooltip texts stored in global to avoid HTML-in-attribute issues
  window._rankTips = {
    rating: '髯憺屮・ｽ・ｺ鬩墓・・ｸ・ｻ鬲假ｽｨ + 髯昴・・ｽ・ｾ髫ｰ魃会ｽｽ・ｦ驛｢譎・ｺ｢邵ｺ繝ｻ・ｹ譎｢・ｽ・ｳ驛｢譎冗樟郢晢ｽｻ髯ｷ・ｷ鬩帙・・ｽ・ｨ陋ｹ・ｻ遯ｶ・ｲ<br>驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ鬮ｫ・ｧ驕ｨ繧托ｽｽ・ｾ繝ｻ・｡髯区ｻゑｽｽ・､',
    base:   'TOP5髯晢ｽｷ繝ｻ・ｳ髯懶ｽｮ遶ｭ・ｯVR 繝ｻ繝ｻ繝ｻ1.5 + TOP5髯晢ｽｷ繝ｻ・ｳ髯懶ｽｮ郢晢ｽｻ繝ｻ・ｺ繝ｻ・ｺ髮主ｾ後・繝ｻ繝ｻ繝ｻ1.0<br>鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ髯橸ｽｳ雋・ｽｷ鬲假ｽｨ驍ｵ・ｺ繝ｻ・ｨ髣費｣ｰ繝ｻ・ｺ髮取ぁ蟷ｲ邵ｲ螳夲ｽｱ雜｣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｾ驛｢・ｧ陷ｿ・･雋よ坩笙り叉・ｻ鬲假ｽｨ',
    battle: '髯昴・・ｽ・ｾ髫ｰ螟りｻｸ陝具ｽｶ驛｢譎｢・ｽ・ｻ鬯ｯ繝ｻ・・・・ｸ鬯・汚・ｽ・ｱ繝ｻ・ｺ髫ｰ魃会ｽｽ・ｦ驛｢譎｢・ｽ・ｻ鬩搾ｽｨ繝ｻ・ｱ髣包ｽｳ・つ驛｢譎冗樟郢晢ｽｻ驛｢譎会ｽｿ・ｫ・朱豪・ｹ譎｢・ｽ・ｳ驛｢譎冗樟郢晢ｽｻ<br>髯ｷ閧ｴ蛻矩ｬ夲ｽｨ驍ｵ・ｺ繝ｻ・ｧ髯溘・霆ｸ繝ｻ・ｸ陝ｶ蜷ｮ繝ｻ驛｢・ｧ陷ｿ・･繝ｻ・ｯ繝ｻ・ｾ髫ｰ魃会ｽｽ・ｦ驛｢譎・ｺ｢邵ｺ繝ｻ・ｹ譎｢・ｽ・ｳ驛｢譏ｴ繝ｻbr>髮惹ｺ･・ｼ・ｱ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・ｻ驛｢譏ｴ繝ｻ郢晢ｽｨ'
  };
  const tt = (key) => `<span class="tt" onmouseenter="showCustomTooltip(this,_rankTips.${key})" onmouseleave="hideCustomTooltip()" onclick="event.stopPropagation();showCustomTooltip(this,_rankTips.${key})">?</span>`;
  html += `<table class="data-table"><tr><th style="width:40px">#</th><th>髯懈圜・ｽ・｣髣厄ｽｴ霓｣蛟ｬ蛟ｹ</th>` +
    `<th style="text-align:right">鬮ｫ・ｧ驕ｨ繧托ｽｽ・ｾ繝ｻ・｡髯区ｻゑｽｽ・､${tt('rating')}</th>` +
    `<th style="text-align:right">髯憺屮・ｽ・ｺ鬩墓・・ｸ・ｻ鬲假ｽｨ${tt('base')}</th>` +
    `<th style="text-align:right">髯昴・・ｽ・ｾ髫ｰ魃会ｽｽ・ｦpt${tt('battle')}</th>` +
    `<th style="text-align:right">髣費｣ｰ繝ｻ・ｺ髫ｰ・ｨ繝ｻ・ｰ</th></tr>`;
  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const emoji = isPlayer ? '・滓ｧｫ讓ｩ' : (org ? org.emoji : '');
    const rc = getRankColor(r.rank, r.orgId);
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

  // Org detail cards 驕ｯ・ｶ郢晢ｽｻunified by ranking order
  const rankFighterCount = { 1: 5, 2: 4, 3: 3, 4: 2 };
  html += '<div style="margin-top:20px;display:grid;gap:12px">';
  rankings.forEach(r => {
    const isPlayer = r.orgId === 'player';
    const org = RIVAL_ORGS.find(o => o.id === r.orgId);
    const topCount = rankFighterCount[r.rank] || 2;

    if (isPlayer) {
      // Player org card
      const rc = getRankColor(r.rank, r.orgId);
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
          <span style="font-size:16px;font-weight:700;color:${rc}">・滓ｧｫ讓ｩ ${G.orgName || '驛｢譎丞ｹｲ・取ｨ抵ｽｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ髯懈圜・ｽ・｣髣厄ｽｴ郢晢ｽｻ} <span style="font-size:12px;background:${rc}20;color:${rc};padding:2px 8px;border-radius:3px;border:1px solid ${rc}40;margin-left:6px">${r.rank}髣厄ｽｴ郢晢ｽｻ/span></span>
          <span style="font-size:13px;color:var(--text-sub)">${r.rating}pt 郢晢ｽｻ郢晢ｽｻ${G.roster.length}髯ｷ・ｷ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ髯晢ｽｷ繝ｻ・ｳ髯懶ｽｮ遶ｭ・ｯVR:${avgOvr} 郢晢ｽｻ郢晢ｽｻ髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・${Engine.util.dispOrgPop(G.orgPop)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">鬩阪・莠具ｾつ郢晢ｽｻ ${G.titles?.world?.championId ? G.roster.find(c=>c.id===G.titles.world.championId)?.name || '驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ : '<span style="color:var(--text-dim)">髣包ｽｳ隶朱対・/span>'}</div>
        <div style="font-size:13px;margin-top:10px">
          <span style="color:var(--text-dim)">髣包ｽｳ繝ｻ・ｻ髯ｷ蟲ｨ繝ｻ</span>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
          ${topFighters.map(f => {
            const isChamp = G.titles?.world?.championId === f.id;
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;width:120px;text-align:center"><div class="monitor-wrap">${portraitImg(f.id, 100)}</div><span style="font-size:12px">${fLink(f, {source:'roster', bold:false, size:'12px'})}</span><span style="color:var(--text-dim);font-size:11px">OVR ${ov(f)}${isChamp ? ' ・滓ｫ∬・鬩阪・莠具ｾつ郢晢ｽｻ : ''}</span></div>`;
          }).join('')}
          </div>
        </div>
        <details style="margin-top:10px">
          <summary style="font-size:13px;color:${rc};cursor:pointer">・滓ｧｫ謠ｴ 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ蟶晏寰闕ｵ譎｢・ｽ荵昴・郢晢ｽｻ{G.roster.length}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/summary>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${[...G.roster].sort((a,b) => ov(b) - ov(a)).map(f => {
              const fOvr = ov(f);
              const isChampF = G.titles?.world?.championId === f.id;
              return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid ${rc}20;border-radius:6px;width:calc(50% - 4px);min-width:240px;cursor:pointer" onclick="showFighterPopup(${f.id},'roster')">
                <div class="monitor-wrap monitor-wrap-sm">${portraitImg(f.id, 48)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;color:var(--text-main)">${f.name}${isChampF ? ' ・滓ｫ∬・' : ''}</div>
                  <div style="font-size:11px;color:var(--text-dim)">OVR ${fOvr} 驛｢譎｢・ｽ・ｻ ${f.style || '?'}</div>
                </div>
                <div style="font-size:11px;color:var(--text-dim)">鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ 驕ｶ鄙ｫ繝ｻ/div>
              </div>`;
            }).join('')}
          </div>
        </details>
      </div>`;
    } else if (org) {
      // AI org card 驕ｯ・ｶ郢晢ｽｻuse rank color
      const rc = getRankColor(r.rank, r.orgId);
      const aiData = G.aiOrgs && G.aiOrgs[org.id];
      if (!aiData) return;
      const roster = Engine.rival.dedupeRoster(aiData.roster || []);
      const rEntry = rankings.find(re => re.orgId === org.id);
      const avgOvr = roster.length ? Math.round(roster.reduce((s,f) => s + Engine.util.ov(f), 0) / roster.length) : 0;
      const topFighters = [...roster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, topCount);

      html += `<div style="padding:14px;background:${rc}08;border:1px solid ${rc}30;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:16px;font-weight:700;color:${rc}">${org.emoji} ${org.name} <span style="font-size:12px;opacity:0.7">${org.tier}鬩堺ｸ翫・/span> <span style="font-size:12px;background:${rc}20;color:${rc};padding:2px 8px;border-radius:3px;border:1px solid ${rc}40;margin-left:6px">${r.rank}髣厄ｽｴ郢晢ｽｻ/span></span>
          <span style="font-size:13px;color:var(--text-sub)">${rEntry ? rEntry.rating + 'pt' : ''} 郢晢ｽｻ郢晢ｽｻ${roster.length}髯ｷ・ｷ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ髯晢ｽｷ繝ｻ・ｳ髯懶ｽｮ遶ｭ・ｯVR:${avgOvr} 郢晢ｽｻ郢晢ｽｻ髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・${Engine.util.dispOrgPop(aiData.orgPop)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">${org.desc}</div>
        <div style="font-size:13px;margin-top:10px">
          <span style="color:var(--text-dim)">髣包ｽｳ繝ｻ・ｻ髯ｷ蟲ｨ繝ｻ</span>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
          ${topFighters.map(f => `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;width:120px;text-align:center"><div class="monitor-wrap">${portraitImg(f.id, 100)}</div><span style="font-size:12px">${fLink(f, {source:'ai:'+org.id, bold:false, size:'12px'})}</span><span style="color:var(--text-dim);font-size:11px">OVR ${Engine.util.ov(f)}</span></div>`).join('')}
          </div>
        </div>
        <details style="margin-top:10px">
          <summary style="font-size:13px;color:${rc};cursor:pointer">・滓ｧｫ謠ｴ 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ蟶晏寰闕ｵ譎｢・ｽ荵昴・郢晢ｽｻ{roster.length}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/summary>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${[...roster].sort((a,b) => Engine.util.ov(b) - Engine.util.ov(a)).map((f, idx) => {
              const fOvr = Engine.util.ov(f);
              const isTop = idx === 0;
              return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid ${rc}20;border-radius:6px;width:calc(50% - 4px);min-width:240px;cursor:pointer" onclick="showFighterPopup(${f.id},'ai:${org.id}')">
                <div class="monitor-wrap monitor-wrap-sm">${portraitImg(f.id, 48)}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;color:var(--text-main)">${f.name}${isTop ? ' <span style="font-size:10px;color:#e74c3c">髫ｨ蛟･繝ｻ隲ｱ螟奇ｽｭ螟ｲ・ｽ・ｿ</span>' : ''}</div>
                  <div style="font-size:11px;color:var(--text-dim)">OVR ${fOvr} 驛｢譎｢・ｽ・ｻ ${f.style || '?'}</div>
                </div>
                <div style="font-size:11px;color:var(--text-dim)">鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ 驕ｶ鄙ｫ繝ｻ/div>
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
    html += '<h4 style="color:var(--gold);margin-bottom:8px;font-size:13px">・滓ｧｫ・ｶ繝ｻ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ髯橸ｽｻ繝ｻ・･髮弱・・ｽ・ｴ</h4>';
    html += '<table class="data-table"><tr><th>驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ</th><th style="text-align:right">鬯ｯ繝ｻ繝ｻ繝ｻ・ｽ郢晢ｽｻ/th><th style="text-align:right">鬮｣莨√Γ繝ｻ・｡隴ｴ・ｧ霎溘・/th><th style="text-align:right">髫ｴ蟠｢ﾂ鬯ｯ・ｮ陟岱</th><th style="text-align:right">髯ｷ・ｿ陷ｿ螟懶ｽｫ・ｪ</th><th style="text-align:right">髫ｴ蟠｢ﾂ鬩搾ｽｨ郢ｧ螂・ｽｽ・ｳ郢晢ｽｻ遶包ｽ｡</th><th style="text-align:right">髣費｣ｰ繝ｻ・ｺ髫ｰ・ｨ繝ｻ・ｰ</th></tr>';
    G.seasonHistory.forEach(h => {
      const profit = (h.totalRevenue || 0) - (h.totalExpense || 0);
      html += `<tr>
        <td>${h.season}髯晢ｽｷ繝ｻ・ｴ鬨ｾ・ｶ繝ｻ・ｮ</td>
        <td class="num" style="font-weight:700;color:${h.rank===1?'var(--gold)':h.rank===2?'#e74c3c':h.rank===3?'#9b59b6':'#2ecc71'}">${h.rank}髣厄ｽｴ郢晢ｽｻ/td>
        <td class="num">${h.showCount || 0}</td>
        <td class="num" style="color:#3498db">${h.bestMQ || 0}</td>
        <td class="num" style="color:${profit>=0?'#2ecc71':'#e74c3c'}">${profit>=0?'+':''}${profit.toLocaleString()}髣包ｽｳ郢晢ｽｻ/td>
        <td class="num">${(h.funds||0).toLocaleString()}髣包ｽｳ郢晢ｽｻ/td>
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
    髫ｰ繝ｻﾂ髯橸ｽｻ郢晢ｽｻ <span style="color:var(--text)">${_ownCount}/${_rCap}髯ｷ・ｷ郢晢ｽｻ{_capFull ? '郢晢ｽｻ闔蛹・ｽｽ・ｸ闔ｨ竏晏ｿ懃ｹ晢ｽｻ郢晢ｽｻ : ''}</span> 郢晢ｽｻ郢晢ｽｻ驛｢譎・ｽｼ驥・㏍・ｹ譎｢・ｽ・ｼ: ${G.freeAgents.length}髯ｷ・ｷ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・ ${Engine.util.dispOrgPop(G.orgPop)}
  </div>
  ${_capFull ? `<div style="padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px;font-size:13px;color:var(--text-sub);margin-bottom:10px">驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｼ髫ｴ・ｫ繝ｻ・ｰ驍ｵ・ｺ陟包ｽ｡繝ｻ・ｸ闔ｨ竏晏ｿ懃ｹ晢ｽｻ郢晢ｽｻ{_rCap}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ陝ｲ・ｨ遶企ｦｴ・ｩ蠅馴ｱ偵・・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ閧ｲ謔幃ｫｫ遨ゑｽｸ讖ｸ・ｽ・･鬩｢謳ｾ・ｽ・ｴ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ郢晢ｽｻ/div>` : ''}`;

  // Free agents 驕ｯ・ｶ郢晢ｽｻcompact card list (click name/portrait to open popup with acquire button)
  const visibleFAIds = Engine.util.getVisibleFAIds(G);
  const visibleFA = [...G.freeAgents].filter(c => visibleFAIds.includes(c.id)).sort((a,b) => ov(b) - ov(a));
  const currentQ = getQuarter(G.week);
  const qLabel = QUARTER_LABELS[currentQ] || '';
  html += `<div class="panel-title" style="font-size:13px">驛｢譎・ｽｼ驥・㏍・ｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｸ驛｢・ｧ繝ｻ・ｧ驛｢譎｢・ｽ・ｳ驛｢譏懶ｽｺ蛹・ｽｽ・ｸ・つ鬮ｫ蛹・ｽｽ・ｧ <span style="font-size:11px;color:var(--text-dim);font-weight:400">(${qLabel}驍ｵ・ｺ繝ｻ・ｮ鬩肴得・ｽ・ｹ髣皮甥邇・ｭｽ・ｧ ${visibleFA.length}/${G.freeAgents.length}髯ｷ・ｷ郢晢ｽｻ</span></div>`;
  html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">・滓ｧｫ・ｺ繝ｻ鬩肴得・ｽ・ｹ髣皮甥邇・ｭｽ・ｧ驍ｵ・ｺ繝ｻ・ｯ髯懈懶ｽｸ蟶ｶ・ｿ・ｰ髫ｴ蟶ｶ・ｺ蛛・ｽｼ繝ｻ・ｸ・ｺ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｫ髯ｷ闌ｨ・ｽ・･驛｢・ｧ隴ｴ・ｧ陝蟶ｷ・ｹ・ｧ闕ｳ螂・ｽｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ/div>`;
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
          <span style="font-size:14px;color:var(--text-dim)">${c.age}髮弱・・ｽ・ｳ</span>
          <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;padding:3px 10px;border-radius:4px;background:${tierCfg.color}22;color:${tierCfg.color};border:1px solid ${tierCfg.color}44;font-weight:600">${tierCfg.label}</span>
          ${viaTicket ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(241,196,15,0.2);color:#f1c40f;border:1px solid rgba(241,196,15,0.4);font-weight:600">・滓ｫ・ｽｾ繝ｻ髴大､ｲ・ｽ・ｹ髯具ｽｻ繝ｻ・･髣費｣ｰ繝ｻ・､髮九ｉ蛻､隴ｽ・ｧ</span>' : ''}
          ${!canNeg ? '<span style="font-size:13px;color:#e74c3c">髫ｨ・ｵ郢晢ｽｻ鬩墓得・ｽ・･髯ｷ・ｷ隶主･・ｽｽ・ｺ繝ｻ・ｦ髣包ｽｳ陝雜｣・ｽ・ｶ繝ｻ・ｳ</span>' : ''}
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:28px;font-weight:900;color:var(--gold);line-height:1">${ov(c)}<span style="font-size:10px;font-weight:600;color:var(--text-dim);margin-left:2px">OVR</span></div>
        <div style="font-size:22px;font-weight:800;color:#e8439f;margin-top:6px;line-height:1">${Engine.scout.getSigningCost(c, G.orgPop || 0).toLocaleString()}<span style="font-size:11px;font-weight:400;color:var(--text-dim)">髣包ｽｳ郢晢ｽｻ/span></div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:4px">鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ<b style="color:var(--text)">${getSalary(c)}髣包ｽｳ郢晢ｽｻ/b>/鬯ｨ・ｾ繝ｻ・ｱ</div>
      </div>
    </div>`;
  });
  if (visibleFA.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:var(--text-dim)">驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ髯懈懶ｽｸ蟶ｶ・ｿ・ｰ髫ｴ蟶ｶ・ｺ蛟･繝ｻ鬩肴得・ｽ・ｹ髣皮甥邇・ｭｽ・ｧ驍ｵ・ｺ繝ｻ・ｫ驛｢譎・ｽｼ驥・㏍・ｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｸ驛｢・ｧ繝ｻ・ｧ驛｢譎｢・ｽ・ｳ驛｢譎冗樟郢晢ｽｻ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>';
  }

  // 髫ｨ貂可髫ｨ貂可 Phase D: Rental Section 髫ｨ貂可髫ｨ貂可
  const activeRentals = G.rentals || [];
  const ownRoster = G.roster.filter(c => !c.isRental);
  const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownRoster.length);
  const remainingSlots = Math.max(0, maxSlots - activeRentals.length);
  html += `<div class="panel-title" style="font-size:15px;margin-top:18px">・滓ｩｸ・ｽ・､郢晢ｽｻ驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ郢晢ｽｻ郢晢ｽｻ{activeRentals.length}/${maxSlots}髫ｴ・ｫ繝ｻ・ｰ郢晢ｽｻ郢晢ｽｻ/div>`;
  // Active rentals display
  if (activeRentals.length > 0) {
    activeRentals.forEach(contract => {
      const rentalF = G.roster.find(c => c.id === contract.fighterId);
      const fromLabel = contract.fromSource === 'rival'
        ? (Engine.rival.getOrgInfo(G.aiOrgs, contract.fromOrgId)?.name || contract.fromOrgId)
        : '驛｢譎・ｽｼ驥・㏍・ｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｸ驛｢・ｧ繝ｻ・ｧ驛｢譎｢・ｽ・ｳ驛｢譏ｴ繝ｻ;
      html += `<div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-size:14px;color:var(--text-main)">${rentalF ? fLink(rentalF, {source:'roster'}) : '髣包ｽｳ髢ｧ・ｴ郢晢ｽｻ'}</span>
            <span style="font-size:12px;color:var(--text-sub);margin-left:8px">驕ｶ鄙ｫ繝ｻ${fromLabel}</span>
          </div>
          <div style="font-size:13px;color:var(--gold)">髫ｹ・ｿ闕ｵ譎｢・ｽ繝ｻ{contract.seasonsLeft}髫ｴ蟶吶・${contract.seasonsLeft * 12}鬯ｨ・ｾ繝ｻ・ｱ)</div>
        </div>
      </div>`;
    });
  }
  // Rental market
  if (G.offSeason) {
    html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶・驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｳ髣包ｽｳ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｯ驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>';
  } else if (remainingSlots <= 0) {
    html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ髫ｴ・ｫ繝ｻ・ｰ驍ｵ・ｺ隴ｴ・ｧ繝ｻ・ｺ・つ髯ｷ・ｩ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ郢晢ｽｻ/div>';
  } else {
    const rentals = Engine.rental.getAvailableRentals(G);
    const visibleRentalIds = Engine.util.getVisibleRentalIds(G);
    const visibleRentals = rentals.filter(r => visibleRentalIds.includes(r.fighter.id));
    if (visibleRentals.length === 0) {
      html += '<div style="font-size:13px;color:var(--text-dim);padding:10px">驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ髯ｷ・ｿ繝ｻ・ｯ鬮｢・ｭ繝ｻ・ｽ驍ｵ・ｺ繝ｻ・ｪ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶﾂ・ｲ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>';
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
      const arrow = k => sortKey === k ? (sortAsc ? ' 髫ｨ繝ｻ・ｽ・ｲ' : ' 髫ｨ繝ｻ・ｽ・ｼ') : '';
      const thStyle = 'cursor:pointer;user-select:none';
      html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">1驍ｵ・ｲ郢晢ｽｻ髫ｴ蟶ｶ・ｺ・ｷ繝ｻ・･鬩｢謳ｾ・ｽ・ｴ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ髫ｴ蟶吶・12鬯ｨ・ｾ繝ｻ・ｱ郢晢ｽｻ郢晢ｽｻ/ 髯ｷ鬘後＊鬲伜ｸｷ・ｸ・ｺ郢晢ｽｻ繝ｻ・ｸ・つ髫ｲ・｡繝ｻ・ｬ / OVR髣包ｽｳ髮榊・・ｽ・ｽ郢晢ｽｻ{RENTAL_CONFIG.topExclude}髯ｷ・ｷ鬮ｦ・ｪ郢晢ｽｻ髯昴・・ｽ・ｾ鬮ｮ雜｣・ｽ・｡髯樊ｺｷ遘√・・ｼ闔・･陞ｻ・ｮ髣厄ｽｴ鬮ｮ・｣繝ｻ・ｼ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ鬩肴得・ｽ・ｹ髣皮甥邇・ｭｽ・ｧ${visibleRentals.length}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ闔・･陞ｻ竏ｬ諤ｺ鬯・ｬｬ・・匚闌ｨ・ｽ・･髫ｴ蜴・ｽｽ・ｿ郢晢ｽｻ郢晢ｽｻ/div>`;
      html += `<div style="overflow-x:auto"><table class="data-table"><tr>
        <th style="${thStyle}" onclick="sortRentalTable('name')">髯ｷ・ｷ隶朱｡披・${arrow('name')}</th>
        <th>髣懃§・ｸ・ｷ繝ｻ・ｵ繝ｻ・ｦ髯ｷ蛹ｻ繝ｻ/th><th>Style</th>
        <th style="${thStyle}" onclick="sortRentalTable('ovr')">鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ{arrow('ovr')}</th>
        <th>髫ｴ蟶ｶ・ｻ繝ｻ・ｿ・｣</th>
        <th style="${thStyle}" onclick="sortRentalTable('fee')">鬮ｮ蜈ｷ・ｽ・ｻ鬨ｾ蛹・ｽｽ・ｨ${arrow('fee')}</th>
        <th>髣費｣ｰ繝ｻ・､髮九ｅ繝ｻ/th></tr>`;
      sorted.forEach(r => {
        const srcLabel = r.source === 'rival' ? (r.org?.name || '?') : 'FA';
        const srcLink = r.source === 'rival' ? `ai:${r.org.id}` : 'free';
        const feeFor1 = r.fees[1];
        const selectId = `rentalSeasons_${r.fighter.id}`;
        const seasonOpts = [1,2,3,4].map(n => `<option value="${n}">${n}髫ｴ蟶吶・${n*12}鬯ｨ・ｾ繝ｻ・ｱ)</option>`).join('');
        html += `<tr>
          <td>${fLink(r.fighter, {source:srcLink})}</td>
          <td style="font-size:13px;color:var(--text-sub)">${srcLabel}</td>
          <td><span class="badge badge-${r.fighter.style}">${r.fighter.style}</span></td>
          <td class="num ov">${Engine.util.ov(r.fighter)}</td>
          <td><select id="${selectId}" onchange="updateRentalFee(${r.fighter.id})" style="font-size:12px;padding:2px 4px;background:var(--card-bg);color:var(--text);border:1px solid var(--border)">${seasonOpts}</select></td>
          <td class="num" style="color:#f39c12"><span id="rentalFee_${r.fighter.id}">${feeFor1}</span>髣包ｽｳ郢晢ｽｻ/td>
          <td><button id="rentalBtn_${r.fighter.id}" onclick="requestRental(${r.fighter.id},'${r.source}','${r.source === 'rival' ? r.org.id : ''}')" class="btn btn-sm" style="font-size:12px;padding:4px 10px;background:rgba(243,156,18,0.15);border:1px solid rgba(243,156,18,0.3);color:#f39c12" ${G.funds >= feeFor1 ? '' : 'disabled'}>驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｫ</button></td>
        </tr>`;
      });
      html += '</table></div>';
    }
  }

  el.innerHTML = html;
}

// 髫ｨ貂可髫ｨ貂可 Scout Event Rendering 髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
function renderScoutEvent() {
  const el = document.getElementById('scoutEventContent');
  if (!el) return;
  const candidates = G.scout候補選手 || [];
  const picks = G.scoutPicks || [];
  const maxPicks = G.scoutMaxPicks || 3;
  const discount = 0;
  const orgPop = G.orgPop || 0;
  const eventLabel = G.scoutEventType === 'midseason' ? '鬮ｯ・ｬ隲幢ｽｷ繝ｻ・ｼ繝ｻ・ｷ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ : '驛｢譎｢・ｽ・｡驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ;

  const titleEl = document.getElementById('scoutEventTitle');
  if (titleEl) titleEl.textContent = `・滓ｧｫ鄙・${eventLabel} 驕ｯ・ｶ郢晢ｽｻ髯区ｺｷ謠・・・｣郢晢ｽｻ${candidates.length}髯ｷ・ｷ雋ゑｽｯ;

  const STYLE_META = {
    Grappler:   {color:'#bb8fce',icon:'GRP'}, Striker:    {color:'#e74c3c',icon:'STK'},
    Submission: {color:'#e67e22',icon:'SUB'}, Speed:      {color:'#2ecc71',icon:'SPD'},
    Allround:   {color:'#f1c40f',icon:'ALL'}, Brawler:    {color:'#e88a82',icon:'BRW'}
  };

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px">
    <span style="font-size:14px;color:var(--text-sub)">鬮ｮ蟲ｨ繝ｻ遶包ｽ｡: <strong style="color:var(--gold)">${G.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ/strong></span>
    <span style="font-size:14px;color:var(--text-sub)">髴托ｽｯ繝ｻ・ｲ髯溯ｼ斐・ <strong style="color:#2ecc71">${picks.length} / ${maxPicks}髯ｷ・ｷ郢晢ｽｻ/strong></span>
    <span style="font-size:14px;color:var(--text-sub)">髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・ <strong>${Engine.util.dispOrgPop(orgPop)}</strong></span>
    
  </div>`;

  if (candidates.length === 0) {
    html += '<div style="text-align:center;padding:32px;color:var(--text-dim)">髯ｷ闌ｨ・ｽ・ｨ髯区ｺｷ謠・・・｣隲帷ｿｫ繝ｻ鬩墓慣・ｽ・ｺ鬮ｫ・ｱ鬮ｦ・ｪ遯ｶ・ｲ髯橸ｽｳ陟包ｽ｡繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷会ｽｱ隨ｳ繝ｻ/div>';
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
          <span style="font-size:14px;color:var(--text-dim)">${c.age}髮弱・・ｽ・ｳ</span>
          <span class="badge badge-${c.style}" style="font-size:12px;padding:2px 8px">${c.style}</span>
          <span class="badge badge-${c.role==='Babyface'?'bf':c.role==='Heel'?'heel':'neutral'}" style="font-size:12px;padding:2px 8px">${c.role}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:13px;padding:3px 10px;border-radius:4px;background:${tierCfg.color}22;color:${tierCfg.color};border:1px solid ${tierCfg.color}44;font-weight:600">${tierCfg.label}</span>
          ${c._isSeed ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(241,196,15,0.2);color:#f1c40f;border:1px solid rgba(241,196,15,0.4)">驍よ亢繝ｻ髮主桁・ｽ・ｨ鬨ｾ・ｶ繝ｻ・ｮ</span>' : ''}
          ${c._hasCompetition ? '<span style="font-size:13px;padding:3px 10px;border-radius:4px;background:rgba(231,76,60,0.15);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">髫ｨ讒ｭ繝ｻ鬩包ｽｶ繝ｻ・ｶ髯ｷ・ｷ郢晢ｽｻ/span>' : ''}
          ${!canNeg ? '<span style="font-size:13px;color:#e74c3c">髫ｨ・ｵ郢晢ｽｻ鬩墓得・ｽ・･髯ｷ・ｷ隶主･・ｽｽ・ｺ繝ｻ・ｦ髣包ｽｳ陝雜｣・ｽ・ｶ繝ｻ・ｳ</span>' : ''}
        </div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:28px;font-weight:900;color:var(--gold)">${estAvg}</div>
        <div style="font-size:12px;color:var(--text-dim)">髫ｰ證ｦ・ｽ・ｨ髯橸ｽｳ陷夲ｽｹVR</div>
      </div>
    </div>`;
  });

  html += `<div class="btn-row" style="margin-top:16px">
    <button class="btn btn-gold" onclick="scoutFinish()">・滓ｧｫ鄙・驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎乗ｲｺ繝ｻ・ｴ繝ｻ・ｻ髯ｷ閧ｴ繝ｻ繝ｻ・ｵ郢ｧ繝ｻ・ｽ・ｺ郢晢ｽｻ/button>
    <button class="btn btn-blue" onclick="showScreen('week')">驕ｶ鄙ｫ繝ｻ鬯ｨ・ｾ繝ｻ・ｱ鬨ｾ蛹・ｽｽ・ｻ鬯ｮ・ｱ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｫ髫ｰ魃会ｽｽ・ｻ驛｢・ｧ郢晢ｽｻ/button>
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
    <h3 style="color:#e74c3c;margin-bottom:12px;text-align:center">髫ｨ讒ｭ繝ｻ髣碑崟鞫ｩ陞ｻ・ｮ髣厄ｽｴ髦ｮ蜷ｮ繝ｻ驍ｵ・ｺ繝ｻ・ｮ鬩包ｽｶ繝ｻ・ｶ髯ｷ・ｷ髢ｧ・ｲ陋ｹ・ｱ鬨ｾ蠅難ｽｻ繧托ｽｽ・ｼ郢晢ｽｻ/h3>
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px">${cand.name}</div>
      <div style="font-size:12px;color:var(--text-dim)">${tierCfg.label} / ${cand.style} / ${cand.age}髮弱・・ｽ・ｳ</div>
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px;font-size:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span>鬯ｨ・ｾ陞｢・ｼ繝ｻ・ｸ繝ｻ・ｸ髯槭ｋ繝ｻ繝ｻ・ｴ郢晢ｽｻ遶包ｽ｡:</span><span style="color:var(--gold)">${baseCost}髣包ｽｳ郢晢ｽｻ/span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span>鬩包ｽｶ繝ｻ・ｶ髯ｷ・ｷ闔蛹・ｽｽ・ｸ髮榊・・ｽ・ｹ陷会ｽｱ隨ｳ繝ｻ(繝ｻ繝ｻ繝ｻ{cand._compMultiplier}):</span><span style="color:#e74c3c;font-weight:700">${compCost}髣包ｽｳ郢晢ｽｻ/span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>鬯ｨ・ｾ陞｢・ｼ繝ｻ・ｸ繝ｻ・ｸ鬯ｯ蛟ｬ莠らｸｲ蝣､・ｸ・ｺ繝ｻ・ｮ髯ｷ閧ｴ蛻ｮ驍擾ｽｫ:</span><span style="color:#f39c12">${winRate}%</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button onclick="document.getElementById('scoutCompModal').remove(); scoutResolve(${cand.id},'pay')" class="btn btn-gold" style="width:100%" ${G.funds >= compCost ? '' : 'disabled'}>
        ・滓ｫ√・ 髣包ｽｳ髮榊・・ｽ・ｹ陷会ｽｱ隨ｳ遏ｩ・｡繝ｻ・ｺ髯橸ｽｳ陞溘ｆ・ｽ蜊・ｰ霈斐・(${compCost}髣包ｽｳ郢晢ｽｻ
      </button>
      <button onclick="document.getElementById('scoutCompModal').remove(); scoutResolve(${cand.id},'gamble')" class="btn btn-blue" style="width:100%">
        ・滓ｫ・ｽｻ・ｸ 鬯ｨ・ｾ陞｢・ｼ繝ｻ・ｸ繝ｻ・ｸ鬯ｯ蛟ｬ莠らｸｲ螳壽↑隴弱・・ｽ・ｲ繝ｻ・ｰ (${baseCost}髣包ｽｳ郢晢ｽｻ/ 髯ｷ閧ｴ蛻ｮ驍擾ｽｫ${winRate}%)
      </button>
      <button onclick="document.getElementById('scoutCompModal').remove(); scoutResolve(${cand.id},'skip')" class="btn" style="width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--text-dim)">
        髫ｨ・ｶ郢晢ｽｻ鬮ｫ・ｲ繝ｻ・ｦ驛｢・ｧ遶丞､ｲ・ｽ繝ｻ
      </button>
    </div>
  </div>`;
  // Remove existing modal if any
  const existing = document.getElementById('scoutCompModal');
  if (existing) existing.remove();
  document.body.appendChild(modal);
}

// 髫ｨ鬆大繭雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ鬯夲ｽｨ
// 髫ｨ鄙ｫ繝ｻ SECTION 9B: COACH & SAVE UI (v0.6)                      髫ｨ鄙ｫ繝ｻ
// 髫ｨ髮・ｽ｣・ｺ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ陝ｷ繝ｻ
function renderCoach() {
  const el = document.getElementById('coachContent');
  if (!el) return;
  const hired = getHiredCoaches();

  // Effect label helper
  const gradeColors = {C:'#888', B:'#2ecc71', A:'var(--gold)'};
  const coachEffectHtml = (c) => {
    const mult = COACH_RANKS[c.teaching] || 1.0;
    return `<span class="coach-grade coach-grade-${c.grade}">${c.grade}鬩堺ｸ翫・/span>
      <span style="font-size:12px;color:var(--gold);font-weight:700">髫ｰ謔ｶ繝ｻ繝ｻ・ｰ陋幢ｽｲ郢晢ｽｻ{mult}</span>
      <span class="badge badge-${c.style}" style="font-size:11px;padding:1px 6px">${c.style}</span>
      <span class="coach-trait">${c.trait}</span>`;
  };

  // Brief effect explanation
  const coachBrief = (c) => (COACH_TRAIT_DEFS[c.trait] || {}).desc || '';

  const maxCoaches = Engine.coach.getMaxCoaches(G);
  const nextSlot = (G.orgPop||0) < 25 ? '髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ髫ｴ・ｫ繝ｻ・ｰ: 鬩墓得・ｽ・･髯ｷ・ｷ隶主･・ｽｽ・ｺ繝ｻ・ｦ25' : (G.orgPop||0) < 50 ? '髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ髫ｴ・ｫ繝ｻ・ｰ: 鬩墓得・ｽ・･髯ｷ・ｷ隶主･・ｽｽ・ｺ繝ｻ・ｦ50' : '髯ｷ闌ｨ・ｽ・ｨ髫ｴ・ｫ繝ｻ・ｰ鬮ｫ證ｦ・ｽ・｣髫ｰ・ｾ繝ｻ・ｾ';
  let html = `<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">
    鬯ｮ・ｮ郢晢ｽｻ騾｡鬘悟初繝ｻ・ｭ: ${hired.length}/${maxCoaches}髯ｷ・ｷ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢譏ｴ繝ｻ郢晢ｽｵ鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ闕ｳ・ｻ驍顔洸蝮守ｹ晢ｽｻ ${getCoachSalaryTotal()}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ 郢晢ｽｻ郢晢ｽｻ${nextSlot}
    <br><span style="font-size:12px;color:var(--text-dim)">驕ｯ・ｶ繝ｻ・ｻ 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｲ闔・､雎仙ｸ帙・繝ｻ・ｸ郢晢ｽｻ鬮｢・ｧ繝ｻ・ｲ髫ｰ迹壹・・つ陷･・ｲ陋ｻ・､鬯ｮ・ｱ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｧ鬮ｯ・ｦ陟募ｨｯ譁｡驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ繝ｻ鬪ｭ蜊・ｽｹ・ｧ繝ｻ・ｿ驛｢譏ｴ繝ｻ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｧ鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ</span>
  </div>`;

  // Hired coaches
  if (hired.length > 0) {
    html += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:10px">鬯ｮ・ｮ郢晢ｽｻ騾｡鬘悟初繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/div>';
    hired.forEach(c => {
      const assigned = getCoachAssignees(c.id);
      const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);
      html += `<div class="coach-card hired">
        <div class="coach-avatar" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;justify-content:center">${coachPortraitImg(c, 48)}</div>
        <div class="coach-info">
          <div class="coach-name" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-size:15px">${c.name} <span style="font-size:11px;color:var(--text-dim)">鬩阪・・ｽ・ｹ郢晢ｽｻ郢晢ｽｻ/span></div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${coachEffectHtml(c)}
            <span style="font-size:12px;color:var(--text-sub)">${coachBrief(c)}</span>
          </div>
          <div style="margin-top:6px;font-size:12px;color:var(--text-dim)">
            鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ ${c.salary}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ 郢晢ｽｻ郢晢ｽｻ髫ｲ・｡郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ ${assigned.length}/${COACH_MAX_ASSIGN}髯ｷ・ｷ郢晢ｽｻ
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
        html += `<div style="margin-top:5px;font-size:12px;color:var(--text-dim);font-style:italic">髫ｨ荳翫・髫ｲ・｡郢晢ｽｻ繝ｻ・ｽ鬯･・ｴ遶城メ・ｬ繝ｻ・ｹ譏ｶ繝ｻ驍ｵ・ｺ郢晢ｽｻ/div>`;
      }
      html += `</div>
        <button class="btn btn-red btn-sm" onclick="showConfirm('${c.name}驛｢・ｧ陞ｳ螟ｲ・ｽ・ｧ繝ｻ・｣髣比ｼ夲ｽｽ・ｻ驍ｵ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・ゑｽｰ郢晢ｽｻ雎√たn髫ｲ・｡郢晢ｽｻ繝ｻ・ｽ鬯･・ｴ遶城メ・ｬ繝ｻ・ｹ譏ｴ繝ｻ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驛｢・ｧ郢ｧ螂・ｽｽ・ｧ繝ｻ・｣鬯ｮ・ｯ繝ｻ・､驍ｵ・ｺ髴郁ｲｻ・ｽ讙趣ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ,'鬮ｫ證ｦ・ｽ・｣髣比ｼ夲ｽｽ・ｻ',()=>fireCoach(${c.id}))">鬮ｫ證ｦ・ｽ・｣髣比ｼ夲ｽｽ・ｻ</button>
      </div>`;
    });
  }

  // Available coaches
  const available = G.availableCoaches.map(id => ALL_COACHES.find(c => c.id === id)).filter(Boolean);
  if (available.length > 0) {
    html += '<div style="font-size:14px;font-weight:700;color:var(--text-sub);margin-top:18px;margin-bottom:10px">鬯ｮ・ｮ郢晢ｽｻ騾｡鬘梧╂繝ｻ・ｯ鬮｢・ｭ繝ｻ・ｽ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/div>';
    available.forEach(c => {
      const fee = c.hireFee || COACH_HIRE_FEE;
      const canHire = G.coaches.length < maxCoaches && G.funds >= fee;
      html += `<div class="coach-card">
        <div class="coach-avatar" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;display:flex;align-items:center;justify-content:center">${coachPortraitImg(c, 48)}</div>
        <div class="coach-info">
          <div class="coach-name" onclick="showCoachTooltip(${c.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-size:15px">${c.name} <span style="font-size:11px;color:var(--text-dim)">鬩阪・・ｽ・ｹ郢晢ｽｻ郢晢ｽｻ/span></div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${coachEffectHtml(c)}
            <span style="font-size:12px;color:var(--text-sub)">${coachBrief(c)}</span>
          </div>
          <div style="margin-top:5px;font-size:12px;color:var(--text-dim)">鬯ｮ・ｮ郢晢ｽｻ騾｡鮃ｹ蟇槭・・ｻ: ${fee}髣包ｽｳ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ ${c.salary}髣包ｽｳ郢晢ｽｻ鬯ｨ・ｾ繝ｻ・ｱ</div>
        </div>
        <button class="btn btn-sm" style="background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);color:#2ecc71"
          onclick="hireCoach(${c.id})" ${canHire ? '' : 'disabled'}>${canHire ? `鬯ｮ・ｮ郢晢ｽｻ騾｡繝ｻ(${fee}髣包ｽｳ郢晢ｽｻ` : G.coaches.length >= maxCoaches ? '髣包ｽｳ闔ｨ竏晏ｿ・ : '鬮ｮ蟲ｨ繝ｻ遶包ｽ｡髣包ｽｳ陝雜｣・ｽ・ｶ繝ｻ・ｳ'}</button>
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
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">髫ｨ讖ｸ・ｽ・｡ 驛｢・ｧ繝ｻ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎冗樟邵ｺ譎会ｽｹ譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/div>';
  if (autoInfo) {
    html += `<div class="save-slot has-data">
      <div>
        <div class="save-slot-title">驛｢・ｧ繝ｻ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎冗樟邵ｺ譎会ｽｹ譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/div>
        <div class="save-slot-meta">${Engine.util.formatDate(autoInfo.season, autoInfo.week)} 郢晢ｽｻ郢晢ｽｻ鬮ｮ蟲ｨ繝ｻ遶包ｽ｡${autoInfo.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ${new Date(autoInfo.date).toLocaleString('ja-JP')}</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-blue btn-sm" onclick="showConfirm('驛｢・ｧ繝ｻ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎冗樟邵ｺ譎会ｽｹ譎｢・ｽ・ｼ驛｢譎・§・ゑｽｰ驛｢・ｧ陝ｲ・ｨ・取ｺｽ・ｹ譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・ゑｽｰ郢晢ｽｻ雎√たn髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ鬯ｨ・ｾ繝ｻ・ｲ鬮ｯ・ｦ陟募ｾ後・髯樊ｻゑｽｽ・ｱ驛｢・ｧ闕ｳ螂・ｽｽ讙趣ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻ,'驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ,()=>{loadAutoSave();refreshAll()})">驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/button>
        <button class="btn btn-sm" style="background:rgba(116,185,255,0.08);color:#74b9ff;border:1px solid rgba(116,185,255,0.25)" onclick="exportSave('auto')">・滓ｫ・ｽｸ繝ｻ髫ｴ蜴・ｽｽ・ｸ髯ｷ繝ｻ・ｽ・ｺ</button>
      </div>
    </div>`;
  } else {
    html += '<div class="save-slot"><div class="save-slot-info">驛｢・ｧ繝ｻ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎冗樟邵ｺ譎会ｽｹ譎｢・ｽ・ｼ驛｢譎・§郢晢ｽｧ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｿ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ隴会ｽｦ繝ｻ・ｼ騾趣ｽｯ・つ繝ｻ・ｱ驛｢・ｧ陝ｶ謨鳴繝ｻ・ｲ驛｢・ｧ遶丞､ｲ・ｽ迢暦ｽｸ・ｺ繝ｻ・ｨ鬮｢・ｾ繝ｻ・ｪ髯ｷ蜥ｲ・ｩ繧托ｽｽ・ｿ隴取得・ｽ・ｭ陋滂ｽ･繝ｻ繝ｻ・ｹ・ｧ陟募ｨｯ遨宣し・ｺ陷ｻ・ｻ繝ｻ・ｼ郢晢ｽｻ/div></div>';
  }
  html += '</div>';

  // Manual save slots
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">・滓ｨ奇ｽｲ繝ｻ髫ｰ繝ｻ蜚ｱ髯悟､ゑｽｹ・ｧ繝ｻ・ｻ驛｢譎｢・ｽ・ｼ驛｢譎・§邵ｺ蟶ｷ・ｹ譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ</div>';
  for (let i = 1; i <= SAVE_SLOTS; i++) {
    const info = getSaveInfo(i);
    if (info) {
      html += `<div class="save-slot has-data">
        <div>
          <div class="save-slot-title">驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ ${i}</div>
          <div class="save-slot-meta">${Engine.util.formatDate(info.season, info.week)} 郢晢ｽｻ郢晢ｽｻ鬮ｮ蟲ｨ繝ｻ遶包ｽ｡${info.funds.toLocaleString()}髣包ｽｳ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ髣費｣ｰ繝ｻ・ｺ髮主ｾ後・{Engine.util.dispOrgPop(info.orgPop)} 郢晢ｽｻ郢晢ｽｻ髫ｰ繝ｻﾂ髯橸ｽｻ郢晢ｽｻ{info.rosterSize}髯ｷ・ｷ郢晢ｽｻ/div>
          <div class="save-slot-meta">${new Date(info.date).toLocaleString('ja-JP')} 郢晢ｽｻ郢晢ｽｻv${info.version}</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-gold btn-sm" onclick="showConfirm('驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ${i}驍ｵ・ｺ繝ｻ・ｫ髣包ｽｳ鬯・､ｧ・ｶ讙趣ｽｸ・ｺ鬮ｦ・ｪ邵ｺ譎会ｽｹ譎｢・ｽ・ｼ驛｢譎・§繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・ゑｽｰ郢晢ｽｻ郢晢ｽｻ,'驛｢・ｧ繝ｻ・ｻ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ,()=>saveGame(${i}))">驛｢・ｧ繝ｻ・ｻ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/button>
          <button class="btn btn-blue btn-sm" onclick="showConfirm('驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ${i}驍ｵ・ｺ闕ｵ譎｢・ｽ閾･・ｹ譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・ゑｽｰ郢晢ｽｻ雎√たn髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ鬯ｨ・ｾ繝ｻ・ｲ鬮ｯ・ｦ陟募ｾ後・髯樊ｻゑｽｽ・ｱ驛｢・ｧ闕ｳ螂・ｽｽ讙趣ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻ,'驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ,()=>loadGame(${i}))">驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/button>
          <button class="btn btn-red btn-sm" onclick="showConfirm('驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ${i}驍ｵ・ｺ繝ｻ・ｮ驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ髮区ｨ抵ｽ朱ｬｮ・ｯ繝ｻ・､驍ｵ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・ゑｽｰ郢晢ｽｻ郢晢ｽｻ,'髯ｷ蜿ｰ・ｼ竏晄ｱ・,()=>deleteSave(${i}))">髯ｷ蜿ｰ・ｼ竏晄ｱ・/button>
          <button class="btn btn-sm" style="background:rgba(116,185,255,0.08);color:#74b9ff;border:1px solid rgba(116,185,255,0.25)" onclick="exportSave(${i})">・滓ｫ・ｽｸ繝ｻ髫ｴ蜴・ｽｽ・ｸ髯ｷ繝ｻ・ｽ・ｺ</button>
        </div>
      </div>`;
    } else {
      html += `<div class="save-slot">
        <div>
          <div class="save-slot-title" style="color:var(--text-dim)">驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ ${i}</div>
          <div class="save-slot-meta">鬩包ｽｨ繝ｻ・ｺ驍ｵ・ｺ鬮ｦ・ｪ邵ｺ蟶ｷ・ｹ譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ</div>
        </div>
        <button class="btn btn-gold btn-sm" onclick="saveGame(${i})">驛｢・ｧ繝ｻ・ｻ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ/button>
      </div>`;
    }
  }

  // Data Transfer section
  html += `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
  <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">・滓ｨ｣ﾂ繝ｻ驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ鬩募∞・ｽ・ｻ鬮ｯ・ｦ郢晢ｽｻ/div>
  <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px;line-height:1.6">
    驛｢・ｧ繝ｻ・ｻ驛｢譎｢・ｽ・ｼ驛｢譎・§郢晢ｽｧ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ陋幢ｽｵ郢晢ｽｵ驛｢・ｧ繝ｻ・｡驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ髫ｴ蜴・ｽｽ・ｸ驍ｵ・ｺ隶守ｿｫ繝ｻ驍ｵ・ｺ陷会ｽｱ・つ遶乗刋閧ｩ驍ｵ・ｺ繝ｻ・ｮ驛｢譏ｴ繝ｻ郢晢ｽｰ驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｹ驛｢・ｧ郢晢ｽｻ郢晢ｽｶ驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・ｦ驛｢・ｧ繝ｻ・ｶ驍ｵ・ｺ繝ｻ・ｫ鬩募∞・ｽ・ｻ鬮ｯ・ｦ陟募ｾ個蝣､・ｸ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻbr>
    髣包ｽｳ驗呻ｽｫ郢晢ｽｻ驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｨ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｲ闔・､雎先慣・ｽ・･ 髫ｴ蜴・ｽｽ・ｸ髯ｷ繝ｻ・ｽ・ｺ驍ｵ・ｲ鬮ｦ・ｪ邵ｲ蝣､・ｹ譎・ｽｼ譁撰ｼ憺Δ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ髣厄ｽｫ隴取得・ｽ・ｭ陋滂ｽ･・つ遶擾ｽｽ繝ｻ・ｸ闕ｵ譏ｴ繝ｻ驍ｵ・ｲ霑ｹ螟ｲ・ｽ・ｪ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｿ鬮ｴ雜｣・ｽ・ｼ驛｢・ｧ・つ驍ｵ・ｲ鬮ｦ・ｪ邵ｲ螳夲｣ｰ蛹・ｽｽ・ｩ髯ｷ蛹ｻ繝ｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｼ讓抵ｽｸ・ｲ郢晢ｽｻ
  </div>
  <div class="save-slot" style="border-color:rgba(116,185,255,0.2);background:rgba(116,185,255,0.03)">
    <div>
      <div class="save-slot-title" style="color:#74b9ff">・滓ｫ・ｽｱ繝ｻ驛｢譎・ｽｼ譁撰ｼ憺Δ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ驍ｵ・ｺ闕ｵ譎｢・ｽ陋ｾ蝮｡繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｿ鬮ｴ雜｣・ｽ・ｼ驛｢・ｧ・つ</div>
      <div class="save-slot-meta">JSON驛｢譎・ｽｼ譁撰ｼ憺Δ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ驛｢・ｧ陝ｶ譏ｶ繝ｻ髫ｰ螢ｽ・ｧ・ｭ隨倥・・ｹ・ｧ闕ｵ譏ｶ繝ｻ驍ｵ・ｺ陷ｷ・ｶ繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｫ驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ繝ｻ繝ｻ・ｹ・ｧ陟募ｨｯ遨宣し・ｺ郢晢ｽｻ/div>
    </div>
    <button class="btn btn-blue btn-sm" onclick="importSave()">驛｢譎・ｽｼ譁撰ｼ憺Δ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ驛｢・ｧ陝ｶ譏ｶ繝ｻ髫ｰ螢ｹ繝ｻ/button>
  </div>
</div>`;

  // Settings: Org name change
  html += `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">髫ｨ讒ｫ驕懊・・ｸ郢晢ｽｻ鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ郢晢ｽｻ/div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <label style="color:var(--text-sub);font-size:12px;white-space:nowrap">・滓ｧｫ蟆・髯懈圜・ｽ・｣髣厄ｽｴ霓｣蛟ｬ蛟ｹ:</label>
      <input id="settingsOrgName" type="text" value="${G.orgName || '驛｢譎丞ｹｲ・取ｨ抵ｽｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ髯懈圜・ｽ・｣髣厄ｽｴ郢晢ｽｻ}" maxlength="20"
        style="flex:1;max-width:240px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:13px;font-weight:700"
        placeholder="髯懈圜・ｽ・｣髣厄ｽｴ霓｣蛟ｬ蛟ｹ驛｢・ｧ髮区ｧｭ繝ｻ髯ｷ蟲ｨ繝ｻ>
      <button class="btn btn-gold btn-sm" onclick="const v=document.getElementById('settingsOrgName').value.trim();if(v){G={...G,orgName:v};refreshAll();Audio.play('stamp')}">髯樊ｺｽ蛻､陝ｲ・ｩ</button>
    </div>
  </div>`;

  // New game button
  html += `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
    <button class="btn btn-red" onclick="showConfirm('髫ｴ蟷｢・ｽ・ｬ髯溷・萓ｭ遶企豪・ｹ譏懶ｽｹ譁溽､ｼ・ｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｲ驛｢譎｢・ｽ・ｼ驛｢譎｢・｣・ｰ驛｢・ｧ陝ｶ譎擾ｽｹ謌頑ｲり嵯譎｢・ｼ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・ゑｽｰ郢晢ｽｻ雎√たn髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ鬯ｨ・ｾ繝ｻ・ｲ鬮ｯ・ｦ陟募ｾ後・髯樊ｻゑｽｽ・ｱ驛｢・ｧ闕ｳ螂・ｽｽ讙趣ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻ,'驛｢譏懶ｽｹ譁溽､ｼ・ｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｲ驛｢譎｢・ｽ・ｼ驛｢譎｢・｣・ｰ',()=>{location.reload()})">・滓ｧｫ・｣・ｲ 驛｢譏懶ｽｹ譁溽､ｼ・ｹ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｲ驛｢譎｢・ｽ・ｼ驛｢譎｢・｣・ｰ</button>
  </div>`;

  el.innerHTML = html;
}


// 髫ｨ鬆大繭雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ鬯夲ｽｨ
// 髫ｨ鄙ｫ繝ｻ SECTION 9D: TRAINING HELPERS (roster tab integrated)     髫ｨ鄙ｫ繝ｻ
// 髫ｨ髮・ｽ｣・ｺ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ陝ｷ繝ｻ

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
    if (!success) { Audio.play('error'); alert('驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ髫ｴ・ｫ繝ｻ・ｰ驍ｵ・ｺ隴ｴ・ｧ繝ｻ・ｺ・つ髯ｷ・ｩ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ郢晢ｽｻ); return; }
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
  if (!coach) return {text: '髯懶ｽｮ郢晢ｽｻ繝ｻ・ｭ郢晢ｽｻ, arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'eq', arrow: '驕ｶ鄙ｫ繝ｻ}))};
  return {text: `${coach.grade}鬩堺ｸ橸ｽ｣・ｹ邵ｺ諷包ｽｹ譎｢・ｽ・ｼ驛｢譎｢・ｽ繝ｻ arrows: stats.map(s => ({stat: s, label: labels[s], cls: 'up1', arrow: '驕ｶ鄙ｫ繝ｻ}))};
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

// 髫ｨ鬆大繭雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ鬯夲ｽｨ
// 髫ｨ鄙ｫ繝ｻ DATABASE SCREEN  (v1.0)                                  髫ｨ鄙ｫ繝ｻ
// 髫ｨ髮・ｽ｣・ｺ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ陝ｷ繝ｻ

let _dbSubTab = 0; // 0=髯ｷ闌ｨ・ｽ・ｨ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ繝ｻ1=髯ｷ闌ｨ・ｽ・ｨ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ2=髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ繝ｻ・ｯ驕呈汚・ｽ・ｼ郢晢ｽｻ3=髫ｹ・ｿ繝ｻ・ｿ髯懶ｽ｣郢晢ｽｻ4=鬨ｾ・ｶ繝ｻ・ｸ鬯ｮ・｢繝ｻ・｢髯懈圜・ｽ・ｳ 5=髫ｴ繝ｻ・ｽ・ｰ鬮｢・ｨ郢晢ｽｻ
let _dbSortKey = 'ovr';
let _dbSortAsc = false;
let _dbFilterOrg = '';
let _dbFilterStyle = '';
let _dbFilterName = '';
let _dbCoachSortKey = 'grade';
let _dbCoachSortAsc = false;
let _dbCoachFilterGrade = '';
let _dbCoachFilterName = '';
// Phase 6v2: 鬨ｾ・ｶ繝ｻ・ｸ鬯ｮ・｢繝ｻ・｢髯懈圜・ｽ・ｳ state (force-directed network)
let _relmapCenterId = null;
let _relmapFilter = 'all';
let _relmapSelected = null;
let _relmapViewMode = 'network'; // 'network' | 'focus'
let _relmapFilterRelOnly = true;
let _relmapFilterThreshold = 14;
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
let _relmapOrgFilter = null; // orgId string or null 驕ｯ・ｶ郢晢ｽｻshow only this org's members
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
  if (window.IS_TRIAL) {
    el.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);line-height:2">
      ・滓ｨ貞項 驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢譎冗函郢晢ｽｻ驛｢・ｧ繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｯ鬮ｯ・ｬ繝ｻ・ｽ髯ｷ・ｩ遶擾ｽｫ雎撰ｽｿ驍ｵ・ｺ繝ｻ・ｧ鬮ｫ證ｦ・ｽ・｣髫ｰ・ｾ繝ｻ・ｾ驍ｵ・ｺ髴郁ｲｻ・ｽ讙趣ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻbr>
      <span style="font-size:12px">DLsite / BOOTH 驍ｵ・ｺ繝ｻ・ｧ鬮ｯ・ｬ繝ｻ・ｽ髯ｷ・ｩ遶擾ｽｫ雎撰ｽｿ驛｢・ｧ陋幢ｽｵ郢晢ｽ｡驛｢・ｧ繝ｻ・ｧ驛｢譏ｴ繝ｻ邵ｺ驢搾ｽｸ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｼ繝ｻ/span></div>`;
    return;
  }

  // Toggle relmap-active class on panel
  const panel = el.closest('.panel') || el.parentElement;
  if (panel) panel.classList.toggle('relmap-active', _dbSubTab === 4);

  const subTabs = [
    { label: '・滓ｧｫ繝ｻ 髯ｷ闌ｨ・ｽ・ｨ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ繝ｻ, idx: 0 },
    { label: '・滓ｨ雁宦郢晢ｽｻ郢晢ｽｻ髯ｷ闌ｨ・ｽ・ｨ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ, idx: 1 },
    { label: '・滓ｫ・ｽｿ・ｫ 鬨ｾ・ｶ繝ｻ・ｸ鬯ｮ・｢繝ｻ・｢髯懈圜・ｽ・ｳ', idx: 4 },
    { label: '髫ｨ讒ｭ繝ｻ髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ繝ｻ・ｯ驕呈汚・ｽ・ｼ郢晢ｽｻ, idx: 2 },
    { label: '・滓ｧｫ・ｰ繝ｻ髫ｴ繝ｻ・ｽ・ｰ鬮｢・ｨ郢晢ｽｻ, idx: 5 },
    { label: '・滓ｨ｣繝ｻ 髫ｹ・ｿ繝ｻ・ｿ髯懶ｽ｣郢晢ｽｻ, idx: 3 },
  ];

  let html = `<div class="panel-title">・滓ｨ雁・ 驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢譎冗函郢晢ｽｻ驛｢・ｧ繝ｻ・ｹ</div>`;
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
  html += `</div>`;

  el.innerHTML = html;

  // 鬨ｾ・ｶ繝ｻ・ｸ鬯ｮ・｢繝ｻ・｢髯懈圜・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ陝ｲ・ｨ郢晢ｽｻ驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ陷ｻ閧ｲ・ｷ蟶敖蛹・ｽｽ・ｻ郢晢ｽｻ郢晢ｽｻOM髫ｰ蜴・ｽｽ・ｿ髯ｷ闌ｨ・ｽ・･髯溷供・ｾ螽ｯ繝ｻ髯橸ｽｳ雋・ｽｯ繝ｻ・｡鬲・ｼ夲ｽｽ・ｼ郢晢ｽｻ
  if (_dbSubTab === 4) _drawRelmapAfterRender();
}

function setDbSubTab(idx) {
  _dbSubTab = idx;
  renderDatabase();
}

// 髫ｨ貂可髫ｨ貂可 ・滓ｧｫ・ｰ繝ｻ髫ｴ繝ｻ・ｽ・ｰ鬮｢・ｨ隶抵ｽｭ邵ｺ遉ｼ・ｹ譎・§邵ｺ・｡驛｢譏ｴ繝ｻ髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
function _renderDbNewspaper() {
  const d = G.currentNewspaper;
  if (!d) {
    return `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);line-height:2;">
      ・滓ｧｫ・ｰ繝ｻ髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｮ髫ｴ繝ｻ・ｽ・ｰ鬮｢・ｨ隶抵ｽｭ郢晢ｽｻ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻbr>
      <span style="font-size:12px;color:var(--text-sub);">鬮｣莨√Γ繝ｻ・｡陟暮ｯ会ｽｽ蟶晢ｽｫ・｢陷ｿ・･邵ｺ螳茨ｽｸ・ｺ陷ｷ・ｶ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ驍ｵ・ｲ遶擾ｽｫ繝ｻ・ｿ驕偵・ﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｫ髫ｴ繝ｻ・ｽ・ｰ鬮｢・ｨ隶抵ｽｭ遯ｶ・ｲ髯橸ｽｻ驗呻ｽｫ遯ｶ・ｳ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ/span></div>`;
  }

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
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 10px;border:1px solid rgba(125,95,50,0.24);border-radius:10px;background:rgba(255,255,255,0.22);">
        <div style="font-size:14px;font-weight:900;">${d.isDraw ? 'Time-limit draw' : `${d.winner.name} wins`}</div>
        <div style="font-size:12px;color:#5b4b34;">${d.finishLabel}${d.turns ? ` / ${d.turns}T` : ''}</div>
        <div style="font-size:13px;color:#5b4b34;">MQ <strong style="font-size:20px;color:#15120d;">${d.mq}</strong></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="display:grid;gap:4px;padding:8px 10px;border:1px solid rgba(125,95,50,0.24);border-radius:10px;background:rgba(255,255,255,0.18);">
          <label style="font-size:11px;color:#6a5e4c;">${d.left.name}</label>
          <strong style="font-size:12px;">HP ${d.hpLeft.final}/${d.hpLeft.max}</strong>
          <div style="height:6px;border-radius:999px;background:rgba(38,31,20,0.12);overflow:hidden"><span style="display:block;height:100%;width:${lPct}%;background:${lPct > 30 ? '#44d18e' : lPct > 10 ? '#d9ab45' : '#ef6277'}"></span></div>
        </div>
        <div style="display:grid;gap:4px;padding:8px 10px;border:1px solid rgba(125,95,50,0.24);border-radius:10px;background:rgba(255,255,255,0.18);">
          <label style="font-size:11px;color:#6a5e4c;">${d.right.name}</label>
          <strong style="font-size:12px;">HP ${d.hpRight.final}/${d.hpRight.max}</strong>
          <div style="height:6px;border-radius:999px;background:rgba(38,31,20,0.12);overflow:hidden"><span style="display:block;height:100%;width:${rPct}%;background:${rPct > 30 ? '#44d18e' : rPct > 10 ? '#d9ab45' : '#ef6277'}"></span></div>
        </div>
      </div>
      ${articleHtml}
    </div>`;
}

const _STAT_COLORS = { pw: '#e74c3c', sp: '#2ecc71', te: '#3498db', st: '#f39c12', mn: '#9b59b6' };
function _statCell(val, color) {
  const v = Math.round(val || 0);
  const c = v >= 75 ? (color || '#e74c3c') : v >= 60 ? 'var(--text-main)' : 'var(--text-dim)';
  return `<td class="num" style="font-size:12px;color:${c}">${v}</td>`;
}

// 髫ｨ貂可髫ｨ貂可 髯ｷ闌ｨ・ｽ・ｨ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻﾂ・ｶ繝ｻ・ｸ・つ鬮ｫ蛹・ｽｽ・ｧ 髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
function _renderDbFighters() {
  const RANK_COLORS = { S: '#d63031', A: '#6c5ce7', B: '#00b894', player: '#d4a843', fa: '#8bc4f0' };

  // 髯ｷ闌ｨ・ｽ・ｨ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ陟趣ｽｶ鬯ｮ・ｮ郢晢ｽｻ
  const all = Engine.database.getAllFighters(G);

  // 驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ
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

  // 驛｢・ｧ繝ｻ・ｽ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ
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

  // 驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ驛｢譎√・郢晢ｽｻ
  const orgOptions = [
    { id: '', label: '髯ｷ闌ｨ・ｽ・ｨ驍ｵ・ｺ繝ｻ・ｦ' },
    { id: 'player', label: G.orgName || '驛｢譎丞ｹｲ・取ｨ抵ｽｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ髯懈圜・ｽ・｣髣厄ｽｴ郢晢ｽｻ },
    ...RIVAL_ORGS.map(o => ({ id: o.id, label: `${o.name || o.id} (${o.tier})` })),
    { id: 'fa', label: 'FA' },
  ];
  const styles = ['Grappler', 'Striker', 'Submission', 'Speed', 'Allround', 'Brawler'];

  let html = `<div class="db-filter-bar">
    <select onchange="_dbFilterOrg=this.value;renderDatabase()">
      ${orgOptions.map(o => `<option value="${o.id}" ${_dbFilterOrg === o.id ? 'selected' : ''}>${o.label}</option>`).join('')}
    </select>
    <select onchange="_dbFilterStyle=this.value;renderDatabase()">
      <option value="" ${_dbFilterStyle === '' ? 'selected' : ''}>驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ: 髯ｷ闌ｨ・ｽ・ｨ驍ｵ・ｺ繝ｻ・ｦ</option>
      ${styles.map(s => `<option value="${s}" ${_dbFilterStyle === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select>
    <input type="text" placeholder="・滓ｧｫ鄙・髯ｷ・ｷ隶朱｡披・髫ｶﾂ隲帙・・ｽ・ｴ繝ｻ・｢..." value="${_dbFilterName}"
      oninput="_dbFilterName=this.value;renderDatabase()" style="max-width:160px">
    <span class="db-count">髯ｷ闌ｨ・ｽ・ｨ${all.length}髯ｷ・ｷ郢晢ｽｻ/ 鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ髣包ｽｳ繝ｻ・ｭ: ${filtered.length}髯ｷ・ｷ郢晢ｽｻ/span>
  </div>`;

  // 驛｢・ｧ繝ｻ・ｽ驛｢譎｢・ｽ・ｼ驛｢譎√＃騾｡驢搾ｽｹ譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ鬨ｾ蠅難ｽｻ阮吶・
  const th = (key, label, w) => {
    const active = _dbSortKey === key;
    const ind = active ? (_dbSortAsc ? ' 髫ｨ繝ｻ・ｽ・ｲ' : ' 髫ｨ繝ｻ・ｽ・ｼ') : '';
    return `<th class="${active ? 'sorted' : ''}" style="${w ? `width:${w}` : ''}" onclick="_dbSortKey='${key}';_dbSortAsc=${active ? !_dbSortAsc : false};renderDatabase()">${label}${ind}</th>`;
  };

  html += `<table class="db-table">
    <thead><tr>
      <th style="width:40px"></th>
      ${th('name', '髯ｷ・ｷ隶朱｡披・')}
      ${th('org', '髯懈圜・ｽ・｣髣厄ｽｴ郢晢ｽｻ, '110px')}
      ${th('style', '驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ', '80px')}
      ${th('ovr', 'OVR', '50px')}
      ${th('pw', 'PW', '40px')}
      ${th('sp', 'SP', '40px')}
      ${th('te', 'TE', '40px')}
      ${th('st', 'ST', '40px')}
      ${th('mn', 'MN', '40px')}
      ${th('age', '髯晢ｽｷ繝ｻ・ｴ鬲・ｽｨ繝ｻ・｢', '45px')}
      ${th('pop', '髣費｣ｰ繝ｻ・ｺ髮主ｾ後・, '50px')}
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
      ? `<span style="font-size:10px;padding:1px 5px;border-radius:2px;background:rgba(212,168,67,0.15);color:var(--gold);border:1px solid rgba(212,168,67,0.3)">鬮｢・ｾ繝ｻ・ｪ</span>`
      : '';
    const source = f._orgTier === 'player' ? 'roster' : f._orgTier === 'fa' ? 'free' : `ai:${f._orgId}`;
    html += `<tr class="clickable" onclick="showFighterPopup(${f.id},'${source}')">
      <td>${portraitImg(f.id, 36, '', false)}</td>
      <td style="font-weight:600">${f.name}</td>
      <td style="font-size:12px">${f._orgName}${tierBadge}${faBadge}${playerBadge}</td>
      <td><span class="badge badge-${f.style}" style="font-size:11px">${f.style || '驕ｯ・ｶ郢晢ｽｻ}</span></td>
      <td class="num ${ovrCls}" style="font-weight:700;font-size:15px">${ovr}</td>
      ${_statCell(f.pw, '#e74c3c')}${_statCell(f.sp, '#3498db')}${_statCell(f.te, '#2ecc71')}${_statCell(f.st, '#f39c12')}${_statCell(f.mn, '#9b59b6')}
      <td class="num" style="color:var(--text-sub)">${f.age || '驕ｯ・ｶ郢晢ｽｻ}</td>
      <td class="num">${Engine.util.dispPop(f.popularity || 0)}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// 髫ｨ貂可髫ｨ貂可 髯ｷ闌ｨ・ｽ・ｨ驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｼ驛｢譏ｶ謌悶・・ｸ・つ鬮ｫ蛹・ｽｽ・ｧ 髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
function _renderDbCoaches() {
  const GRADE_COLORS = { C: '#888', B: '#2ecc71', A: 'var(--gold)' };
  const GRADE_ORDER = { A: 0, B: 1, C: 2 };
  const RANK_ORDER = { A: 0, B: 1, C: 2, D: 3, E: 4 };

  let coaches = [...ALL_COACHES];

  // 驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ
  if (_dbCoachFilterGrade) {
    coaches = coaches.filter(c => c.grade === _dbCoachFilterGrade);
  }
  if (_dbCoachFilterName) {
    const q = _dbCoachFilterName.toLowerCase();
    coaches = coaches.filter(c => c.name.toLowerCase().includes(q));
  }

  // 驛｢・ｧ繝ｻ・ｽ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ
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

  // 驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ驛｢譎√・郢晢ｽｻ
  let html = `<div class="db-filter-bar">
    <select onchange="_dbCoachFilterGrade=this.value;renderDatabase()">
      <option value="">驛｢・ｧ繝ｻ・ｰ驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ 髯ｷ闌ｨ・ｽ・ｨ驍ｵ・ｺ繝ｻ・ｦ</option>
      <option value="A" ${_dbCoachFilterGrade === 'A' ? 'selected' : ''}>A鬩堺ｸ翫・/option>
      <option value="B" ${_dbCoachFilterGrade === 'B' ? 'selected' : ''}>B鬩堺ｸ翫・/option>
      <option value="C" ${_dbCoachFilterGrade === 'C' ? 'selected' : ''}>C鬩堺ｸ翫・/option>
    </select>
    <input type="text" placeholder="・滓ｧｫ鄙・髯ｷ・ｷ隶朱｡披・髫ｶﾂ隲帙・・ｽ・ｴ繝ｻ・｢..." value="${_dbCoachFilterName}"
      oninput="_dbCoachFilterName=this.value;renderDatabase()" style="max-width:160px">
    <span class="db-count">髯ｷ闌ｨ・ｽ・ｨ${ALL_COACHES.length}髯ｷ・ｷ郢晢ｽｻ/ 鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ髣包ｽｳ繝ｻ・ｭ: ${coaches.length}髯ｷ・ｷ郢晢ｽｻ/span>
  </div>`;

  // 驛｢・ｧ繝ｻ・ｽ驛｢譎｢・ｽ・ｼ驛｢譎√＃騾｡驢搾ｽｹ譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ
  const th = (key, label, w) => {
    const active = _dbCoachSortKey === key;
    const ind = active ? (_dbCoachSortAsc ? ' 髫ｨ繝ｻ・ｽ・ｲ' : ' 髫ｨ繝ｻ・ｽ・ｼ') : '';
    return `<th class="${active ? 'sorted' : ''}" style="${w ? `width:${w}` : ''}" onclick="_dbCoachSortKey='${key}';_dbCoachSortAsc=${active ? !_dbCoachSortAsc : false};renderDatabase()">${label}${ind}</th>`;
  };

  html += `<table class="db-table">
    <thead><tr>
      <th style="width:40px"></th>
      ${th('name', '髯ｷ・ｷ隶朱｡披・')}
      ${th('grade', '驛｢・ｧ繝ｻ・ｰ驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ, '80px')}
      ${th('teaching', '髫ｰ謔ｶ繝ｻ繝ｻ・ｰ闕ｳ・ｻ鬲假ｽｨ', '65px')}
      ${th('observation', '鬮ｫ蛹・ｽｽ・ｳ髯昴・・ｺ・ｽ隲｢繝ｻ, '65px')}
      ${th('style', '髯滓・霆ｸ・代・, '90px')}
      <th style="width:100px">髴大､ｲ・ｽ・ｹ髫ｲ・､繝ｻ・ｧ</th>
      ${th('salary', '鬩搾ｽｨ繝ｻ・ｦ髣包ｽｳ郢晢ｽｻ, '70px')}
      ${th('hireFee', '鬯ｮ・ｮ郢晢ｽｻ騾｡鮃ｹ蟇槭・・ｻ', '70px')}
      <th style="width:55px">髴托ｽ･繝ｻ・ｶ髫ｲ・ｷ郢晢ｽｻ/th>
    </tr></thead>
    <tbody>`;

  coaches.forEach(c => {
    const gc = GRADE_COLORS[c.grade] || '#888';
    const isHired = G.coaches.includes(c.id);
    html += `<tr class="clickable" onclick="showCoachTooltip(${c.id})">
      <td>${coachPortraitImg(c, 36)}</td>
      <td style="font-weight:600">${c.name}</td>
      <td><span class="coach-grade coach-grade-${c.grade}" style="font-size:12px">${c.grade}鬩堺ｸ翫・/span></td>
      <td class="num" style="font-weight:700;color:${gc}">${c.teaching}</td>
      <td class="num" style="color:${gc}">${c.observation}</td>
      <td><span class="badge badge-${c.style}" style="font-size:11px;padding:1px 6px">${c.style}</span></td>
      <td style="font-size:11px;color:var(--text-sub)">${c.trait}</td>
      <td class="num" style="font-size:12px">${c.salary}髣包ｽｳ郢晢ｽｻ/td>
      <td class="num" style="font-size:12px">${c.hireFee}髣包ｽｳ郢晢ｽｻ/td>
      <td>${isHired ? '<span style="font-size:11px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 5px;border-radius:3px">鬯ｮ・ｮ郢晢ｽｻ騾｡鬘悟初繝ｻ・ｭ</span>' : '<span style="font-size:11px;color:var(--text-dim)">驕ｯ・ｶ郢晢ｽｻ/span>'}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// 髫ｨ貂可髫ｨ貂可 髫ｹ・ｿ繝ｻ・ｿ髯懶ｽ｣郢ｧ繝ｻ・ｽ・ｸ・つ鬮ｫ蛹・ｽｽ・ｧ 髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
function _renderDbHallOfFame() {
  const hof = G.hallOfFame || [];
  if (hof.length === 0) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--text-dim)">
      <div style="font-size:40px;margin-bottom:12px">・滓ｨ｣繝ｻ</div>
      <div style="font-size:15px;margin-bottom:8px">驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｰ髫ｹ・ｿ繝ｻ・ｿ髯懶ｽ｣郢ｧ繝ｻ繝ｻ驛｢・ｧ驗呻ｽｫ繝ｻ・ｰ驍ｵ・ｺ雋翫・繝ｻ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>
      <div style="font-size:13px;color:var(--text-dim)">髴托ｽｯ繝ｻ・ｲ髯溷｢灘惧繝ｻ・ｼ驕擾ｽｩ闔貊・距陝ｶ蜷ｶ繝ｻ髯ｷ・ｷ鬩帙・・ｽ・ｨ陋ｹ・ｻ遯ｶ・ｲ13髯懃軸・ｨ雋ｻ・ｽ・ｻ繝ｻ・･髣包ｽｳ驗呻ｽｫ郢晢ｽｻ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶﾂ・ｲ髯溽ｬｬ蝮ｩ・つ・つ髫ｴ蠑ｱ・・ｫ頑･｢・ｰ・ｿ繝ｻ・ｿ髯懶ｽ｣郢ｧ繝ｻ繝ｻ驛｢・ｧ驗呻ｽｫ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢晢ｽｻ/div>
    </div>`;
  }

  let html = `<div class="db-hof-grid">`;
  hof.forEach(h => {
    const pUrl = getPortraitUrl(h.id || 0);
    const imgHtml = pUrl
      ? `<img src="${pUrl}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);flex-shrink:0" alt="">`
      : `<div style="width:60px;height:60px;border-radius:50%;background:rgba(212,168,67,0.15);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">・滓ｨ｣繝ｻ</div>`;
    html += `<div class="db-hof-card">
      ${imgHtml}
      <div class="db-hof-info">
        <div class="db-hof-name">${h.name}</div>
        <div class="db-hof-row">
          <span class="badge badge-${h.style || 'Allround'}" style="font-size:11px">${h.style || '驕ｯ・ｶ郢晢ｽｻ}</span>
          <span style="margin-left:6px;color:var(--gold);font-weight:700">OVR ${h.ovr || '驕ｯ・ｶ郢晢ｽｻ}</span>
        </div>
        <div class="db-hof-row">髮趣ｽ｢繝ｻ・ｻ髯ｷ讎奇ｽ｢謐ｺ・・ｬｮ・｢郢晢ｽｻ S${h.debutSeason || '?'}驍ｵ・ｲ陟悶・{h.retireSeason || '?'}</div>
        ${h.totalTitleWins ? `<div class="db-hof-row">驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・弱・ ${h.totalTitleWins}髯懃軸・ｨ蜑・ｽｽ蜊・ｰ霈斐・/ ${h.totalDefenses || 0}鬯ｮ・ｦ繝ｻ・ｲ鬮ｯ・ｦ郢晢ｽｻ/div>` : ''}
        ${h.peakOvr ? `<div class="db-hof-row">髫ｴ蟠｢ﾂ鬯ｯ・ｮ隶鯉ｽｼVR: ${h.peakOvr}</div>` : ''}
        <div class="db-hof-row" style="color:var(--gold)">髫ｹ・ｿ繝ｻ・ｿ髯懶ｽ｣郢ｧ繝ｻ繝ｻ驛｢・ｧ郢晢ｽｻ S${h.retireSeason || '?'}</div>
      </div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// 髫ｨ貂可髫ｨ貂可 髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ繝ｻ・ｯ驕呈汚・ｽ・ｼ郢晢ｽｻ髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
let _dbCompareTarget = 'org_s';

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ蜥擾ｽｹ・ｧ繝ｻ・ｵ驛｢譎・§邵ｺ・｡驛｢譎冗ｧ√・・ｼ郢晢ｽｻ髫ｴ・ｯ髣鯉ｽｨ繝ｻ・ｼ闖ｫ繝ｻﾂ郢晢ｽｻSVG驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ驛｢譏ｴ繝ｻ郢晢ｽｪ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｿ鬮ｴ隨ｬ魍堤ｬ倥・・ｸ・ｲ郢ｧ閧ｲ・ｷ蟶敖蛹・ｽｽ・ｻ驍ｵ・ｺ繝ｻ・ｯ_buildOrgColumnSvgContent髯ｷ闌ｨ・ｽ・ｱ鬯ｨ・ｾ陞溷・謔ｴ髫ｰ・ｨ繝ｻ・ｰ
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
function _renderDbOrgCompare() {
  const d = Engine.database.getOrgCompareAnalysis(G, _dbCompareTarget);
  const rc = d.rivalColor;
  // CSS custom property 驍ｵ・ｺ繝ｻ・ｧ rival 雎ｼ・ｶ繝ｻ・ｲ驛｢・ｧ髮区ｫ∝樺鬨ｾ・ｧ郢晢ｽｻ繝ｻ・ｨ繝ｻ・ｭ髯橸ｽｳ郢晢ｽｻ
  const tierCls = d.rivalTier === 'S' ? 's' : d.rivalTier === 'A' ? 'a' : 'b';

  // --- Helper: hex 驕ｶ鄙ｫ繝ｻrgba ---
  function hexDim(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const rivalDim = hexDim(rc, 0.12);
  const rivalGlow = hexDim(rc, 0.06);
  const rivalGrad = `linear-gradient(90deg,${rc},${hexDim(rc, 0.6)})`;

  // --- Section 1: Hero ---
  let html = `<div class="db-cmp-select">
    <label>Compare with</label>
    <select onchange="_dbCompareTarget=this.value;renderDatabase()">
      ${RIVAL_ORGS.map(o => `<option value="${o.id}" ${_dbCompareTarget === o.id ? 'selected' : ''}>${o.emoji} ${G.rivalOrgNames?.[o.id] || o.name || o.id} (Tier ${o.tier})</option>`).join('')}
    </select>
  </div>`;

  html += `<section class="db-cmp-hero" style="--rival-glow:${rivalGlow}">
    <div class="db-cmp-grade">
      <div class="grade-label">Matchup Difficulty</div>
      <div class="grade-value">${d.grade}</div>
      <div class="grade-desc">${d.gradeDesc}</div>
    </div>
    <div class="db-cmp-versus">
      <article class="db-cmp-org-card player">
        <div class="db-cmp-org-head">
          <div class="db-cmp-org-name"><strong>${d.playerName}</strong><span>${d.playerSubtitle}</span></div>
          <div class="db-cmp-tier player">Player</div>
        </div>
        <div class="db-cmp-tags">${(d.playerTags.length ? d.playerTags : ['驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ鬯ｮ・ｮ郢晢ｽｻ繝ｻ・ｨ闔蛹・ｽｽ・ｸ繝ｻ・ｭ']).map(t => `<span class="db-cmp-tag">${t}</span>`).join('')}</div>
        <div class="db-cmp-mini-stats">
          <div class="db-cmp-mini-stat"><label>Top5髯橸ｽｳ雋・ｽｷ鬲假ｽｨ</label><strong>${d.playerScores.ace}</strong></div>
          <div class="db-cmp-mini-stat"><label>Top5髣費｣ｰ繝ｻ・ｺ髮主ｾ後・/label><strong>${d.playerScores.starPower}</strong></div>
          <div class="db-cmp-mini-stat"><label>鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､</label><strong>${d.playerRosterCount}</strong></div>
          <div class="db-cmp-mini-stat"><label>髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・/label><strong>${d.pOrgPop}</strong></div>
        </div>
      </article>
      <div class="db-cmp-vs-mark"><div class="db-cmp-vs-ring">VS</div></div>
      <article class="db-cmp-org-card rival" style="--rival-dim:${rivalDim}">
        <div class="db-cmp-org-head">
          <div class="db-cmp-org-name"><strong>${d.rivalName}</strong><span>${d.rivalSubtitle}</span></div>
          <div class="db-cmp-tier ${tierCls}">Tier ${d.rivalTier}</div>
        </div>
        <div class="db-cmp-tags">${(d.rivalTags.length ? d.rivalTags : ['驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ鬯ｮ・ｮ郢晢ｽｻ繝ｻ・ｨ闔蛹・ｽｽ・ｸ繝ｻ・ｭ']).map(t => `<span class="db-cmp-tag">${t}</span>`).join('')}</div>
        <div class="db-cmp-mini-stats">
          <div class="db-cmp-mini-stat"><label>Top5髯橸ｽｳ雋・ｽｷ鬲假ｽｨ</label><strong>${d.rivalScores.ace}</strong></div>
          <div class="db-cmp-mini-stat"><label>Top5髣費｣ｰ繝ｻ・ｺ髮主ｾ後・/label><strong>${d.rivalScores.starPower}</strong></div>
          <div class="db-cmp-mini-stat"><label>鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､</label><strong>${d.rivalRosterCount}</strong></div>
          <div class="db-cmp-mini-stat"><label>髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・/label><strong>${d.rOrgPop}</strong></div>
        </div>
      </article>
    </div>
  </section>`;

  // --- Section 2+3: Power Snapshot + GM Summary ---
  const AXES = [
    { key: 'ace', label: 'TOP5髯橸ｽｳ雋・ｽｷ鬲假ｽｨ' },
    { key: 'starPower', label: 'TOP5髣費｣ｰ繝ｻ・ｺ髮主ｾ後・ },
    { key: 'popularity', label: '髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・ },
    { key: 'depth', label: '鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､' },
  ];
  // SVG radar (diamond: top=ace, right=starPower, bottom=popularity, left=depth)
  const R = 110, cx = 160, cy = 150;
  const dirs = [[0,-1],[1,0],[0,1],[-1,0]]; // top, right, bottom, left
  function radarPt(scores, keys) {
    return keys.map((k, i) => {
      const v = scores[k] / 100 * R;
      return `${cx + dirs[i][0] * v},${cy + dirs[i][1] * v}`;
    }).join(' ');
  }
  const axisKeys = ['ace','starPower','popularity','depth'];
  const pPts = radarPt(d.playerScores, axisKeys);
  const rPts = radarPt(d.rivalScores, axisKeys);

  // Grid rings
  let gridSvg = '';
  [1, 0.75, 0.5, 0.25].forEach((s, i) => {
    const a = [0, -R*s, R*s, 0, 0, R*s, -R*s, 0].map((v, j) => j % 2 === 0 ? cx + v : cy + v);
    gridSvg += `<polygon points="${a[0]},${a[1]} ${a[2]},${a[3]} ${a[4]},${a[5]} ${a[6]},${a[7]}" fill="none" stroke="rgba(255,255,255,${0.12 - i * 0.02})"/>`;
  });

  const svgChart = `<svg viewBox="0 0 320 300" aria-label="髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ繝ｻ・ｯ驕呈汚・ｽ・ｼ郢晢ｽｻ・取ｨ抵ｽｹ譎｢・ｽ・ｼ驛｢謨鳴驛｢譎｢・ｽ・ｼ">
    <defs>
      <linearGradient id="gP" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#f0d078" stop-opacity="0.35"/><stop offset="100%" stop-color="#d4a843" stop-opacity="0.08"/></linearGradient>
      <linearGradient id="gR" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${rc}" stop-opacity="0.28"/><stop offset="100%" stop-color="${rc}" stop-opacity="0.05"/></linearGradient>
    </defs>
    <g>
      ${gridSvg}
      <line x1="${cx}" y1="${cy - R - 8}" x2="${cx}" y2="${cy + R + 8}" stroke="rgba(255,255,255,0.08)"/>
      <line x1="${cx - R - 8}" y1="${cy}" x2="${cx + R + 8}" y2="${cy}" stroke="rgba(255,255,255,0.08)"/>
      <polygon points="${pPts}" fill="url(#gP)" stroke="#d4a843" stroke-width="2"/>
      <polygon points="${rPts}" fill="url(#gR)" stroke="${rc}" stroke-width="2" opacity="0.7"/>
      ${axisKeys.map((k, i) => {
        const pv = d.playerScores[k] / 100 * R;
        const rv = d.rivalScores[k] / 100 * R;
        return `<circle cx="${cx + dirs[i][0]*pv}" cy="${cy + dirs[i][1]*pv}" r="3.5" fill="#f0d078"/>
                <circle cx="${cx + dirs[i][0]*rv}" cy="${cy + dirs[i][1]*rv}" r="3" fill="${hexDim(rc, 0.7)}"/>`;
      }).join('')}
      <text x="${cx}" y="${cy - R - 14}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="middle">TOP5髯橸ｽｳ雋・ｽｷ鬲假ｽｨ</text>
      <text x="${cx + R + 14}" y="${cy + 4}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="start">TOP5髣費｣ｰ繝ｻ・ｺ髮主ｾ後・/text>
      <text x="${cx}" y="${cy + R + 20}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="middle">髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・/text>
      <text x="${cx - R - 14}" y="${cy + 4}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="end">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､</text>
    </g>
  </svg>`;

  // Axis bars
  let axisBars = '';
  AXES.forEach(ax => {
    const diff = d.diffs[ax.key];
    const cls = diff > 0 ? 'good' : diff < 0 ? 'bad' : '';
    const sign = diff > 0 ? '+' : '';
    axisBars += `<div class="db-cmp-axis-row">
      <header><strong>${ax.label}</strong><span class="db-cmp-diff ${cls}">${sign}${diff}</span></header>
      <div class="db-cmp-meter">
        <span class="bar-player" style="width:${d.playerScores[ax.key]}%"></span>
        <span class="bar-rival" style="width:${d.rivalScores[ax.key]}%;background:${rivalGrad}"></span>
      </div>
    </div>`;
  });

  const briefItems = [
    { title: '髯ｷ閧ｴ莠｢隨・｣ｰ鬩包ｽｲ郢晢ｽｻ, desc: d.opportunity, badge: 'Opportunity', badgeClass: 'good' },
    { title: '髮主桁・ｽ・ｨ髫ｲ・｢陷蜉ｱ笳・, desc: d.risk, badge: 'Risk', badgeClass: 'bad' },
    { title: '鬮ｯ・ｬ隲幢ｽｷ繝ｻ・ｼ繝ｻ・ｷ髫ｰ・ｰ陷郁肩・ｽ・｡郢晢ｽｻ, desc: d.scout, badge: 'Scout', badgeClass: 'warn' },
  ];
  const planHtml = d.actions.slice(0, 2).map(a => `<div class="db-cmp-brief-card">
      <header><strong>${a.title}</strong><span class="db-cmp-badge ${a.badgeClass}">${a.badge}</span></header>
      <p>${a.text}</p>
    </div>`).join('') || `<div class="db-cmp-brief-card"><p>髴托ｽｴ繝ｻ・ｾ髫ｴ蠑ｱ・臥ｸｺ蟶ｷ・ｸ・ｺ繝ｻ・ｧ髯樊ｻゑｽｽ・ｧ驍ｵ・ｺ鬮ｦ・ｪ遶企ｷｹ諱・・・ｽ髯ｷ莨夲ｽ｣・ｰ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ郢晢ｽｻ/p></div>`;
  const roleCopy = {
    '驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ': '鬨ｾ・ｵ陋ｹ・ｺ隰ｾ・ｸ驍ｵ・ｺ繝ｻ・ｮ髯ｷ閧ｴ蜃ｵ繝ｻ・ｲ繝ｻ・ｰ髫ｰ繝ｻﾂ驍ｵ・ｲ郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ髦ｮ蜷ｶﾂ螳壼初繝ｻ・ｻ髯昴・蜿吶・・ｨ繝ｻ・ｩ驛｢・ｧ髮区ｧｫ蠕宣Δ・ｧ陟暮ｯ会ｽｽ迢暦ｽｸ・ｺ闕ｵ譏ｶﾂ・ｲ髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ霓｣蛟･ﾎ｡驛｢・ｧ髮区ｩｸ・ｽ・ｷ繝ｻ・ｦ髯ｷ・ｿ繝ｻ・ｳ驍ｵ・ｺ陷ｷ・ｶ繝ｻ迢暦ｽｸ・ｲ郢晢ｽｻ,
    '髣包ｽｳ繝ｻ・ｻ髯ｷ蟲ｨ繝ｻ: '髣包ｽｳ繝ｻ・ｭ髫ｴ・ｬ繝ｻ・ｸ驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ・つ郢ｧ鄙ｫ繝ｻ鬮ｯ・ｦ陟募ｾ後・髮九ｑ・ｽ・ｩ髯溯ｶ｣・ｽ・ｦ驛｢・ｧ陷ｻ蝓滂ｽｬ・ｾ驍ｵ・ｺ陟搾ｽｺ繝ｻ・ｸ驗呻ｽｫ繝ｻ・｡驛｢・ｧ陷ｿ・･繝ｻ・ｽ繝ｻ・ｹ鬨ｾ・ｶ繝ｻ・ｮ驛｢・ｧ陷ｻ閧ｲ蟶･驍ｵ・ｺ郢晢ｽｻ・つ郢晢ｽｻ,
    '髣包ｽｳ繝ｻ・ｭ髯懶ｽ｣郢晢ｽｻ: '髯橸ｽｻ繝ｻ・､驍ｵ・ｺ繝ｻ・ｮ髯ｷ・ｴ陞｢・ｹ繝ｻ繝ｻ・ｸ・ｺ霑ｹ螟ｲ・ｽ・ｦ闕ｵ譏ｶ譁｡驛｢・ｧ闕ｵ譏ｴ繝ｻ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驛｢譎冗樟・つ郢ｧ繝ｻ・ｱ・ｮ髣厄ｽｴ霓｣蛟ｬ・ｴ・ｨ驍ｵ・ｺ繝ｻ・ｮ髯晢ｽｾ繝ｻ・ｮ驍ｵ・ｺ隴ｴ・ｧ隲､蜥擾ｽｹ・ｧ郢ｧ繝ｻ繝ｻ驛｢・ｧ郢晢ｽｻ隨倥・・ｸ・ｺ郢晢ｽｻ・つ郢晢ｽｻ,
  };
  function buildMatchupCard(m, featured) {
    const pUrl = getPortraitUrl(m.player.id);
    const rUrl = getPortraitUrl(m.rival.id);
    const pAvatar = pUrl ? `<img src="${pUrl}" alt="">` : m.player.name.charAt(0);
    const rAvatar = rUrl ? `<img src="${rUrl}" alt="">` : m.rival.name.charAt(0);
    const ovrDiff = m.player.ovr - m.rival.ovr;
    const popDiff = m.player.pop - m.rival.pop;
    const edgeClass = ovrDiff > 2 ? 'player' : ovrDiff < -2 ? 'rival' : 'even';
    const edgeText = ovrDiff > 2 ? `${d.playerName}髯ｷ繝ｻ・ｽ・ｪ髯ｷ謳ｾ・ｽ・｢` : ovrDiff < -2 ? `${d.rivalName}髯ｷ繝ｻ・ｽ・ｪ髯ｷ謳ｾ・ｽ・｢` : '髣費｣ｰ陞ｳ螟ｲ・ｽ・ｧ郢晢ｽｻ;
    const signValue = n => n > 0 ? `+${n}` : `${n}`;
    return `<article class="${featured ? 'db-cmp-match-featured' : 'db-cmp-match-card'}">
      <div class="db-cmp-match-top">
        <span class="db-cmp-role-chip">${m.role}</span>
        <span class="db-cmp-edge ${edgeClass}">${edgeText}</span>
      </div>
      <div class="db-cmp-match-faceoff">
        <div class="db-cmp-match-side">
          <div class="db-cmp-match-avatar player ${featured ? 'lg' : ''}">${pAvatar}</div>
          <div class="db-cmp-match-meta">
            <strong>${m.player.name}</strong>
            <span>${d.playerName}</span>
            <span>OVR ${m.player.ovr} / 髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${m.player.pop}</span>
          </div>
        </div>
        <div class="db-cmp-match-center">
          <div class="db-cmp-match-vs">${featured ? 'SHOWDOWN' : 'VS'}</div>
          <div class="db-cmp-match-metrics">
            <span>OVR ${signValue(ovrDiff)}</span>
            <span>髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${signValue(popDiff)}</span>
          </div>
        </div>
        <div class="db-cmp-match-side right">
          <div class="db-cmp-match-avatar rival ${featured ? 'lg' : ''}" style="background:linear-gradient(180deg,${rc},${hexDim(rc,0.4)})">${rAvatar}</div>
          <div class="db-cmp-match-meta">
            <strong>${m.rival.name}</strong>
            <span>${d.rivalName}</span>
            <span>OVR ${m.rival.ovr} / 髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${m.rival.pop}</span>
          </div>
        </div>
      </div>
      <p class="db-cmp-match-copy">${roleCopy[m.role] || '驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ遯ｶ・ｲ髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ繝ｻ・ｯ驕呈汚・ｽ・ｼ郢晢ｽｻ郢晢ｽｻ髮九ｑ・ｽ・ｩ髯溯ｶ｣・ｽ・ｦ驛｢・ｧ陷ｻ闌ｨ・ｽ・ｱ繝ｻ・ｺ驛｢・ｧ遶丞､ｲ・ｽ迢暦ｽｸ・ｲ郢晢ｽｻ}</p>
    </article>`;
  }

  if (d.matchups.length) {
    const [featured, ...rest] = d.matchups;
    html += `<section class="db-cmp-spotlight-panel">
      <div class="db-cmp-panel-title">Key Matchups</div>
      ${buildMatchupCard(featured, true)}
      ${rest.length ? `<div class="db-cmp-match-grid">${rest.map(m => buildMatchupCard(m, false)).join('')}</div>` : ''}
    </section>`;
  } else {
    html += `<section class="db-cmp-spotlight-panel">
      <div class="db-cmp-panel-title">Key Matchups</div>
      <div class="db-cmp-recommend"><p>髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ邵ｲ蝣､・ｸ・ｺ鬮ｦ・ｪ繝ｻ邇門初繝ｻ・ｻ髯ｷ迚呻ｽｹ繝ｻ繝ｻ髫ｰ繝ｻ・ｹ譏ｴﾎ咎Δ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｿ驍ｵ・ｺ陟募ｨｯ遨宣し・ｺ繝ｻ・ｰ髣包ｽｳ陝雜｣・ｽ・ｶ繝ｻ・ｳ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻ/p></div>
    </section>`;
  }

  html += `<section class="db-cmp-main-grid">
    <div class="db-cmp-panel">
      <h2 class="db-cmp-panel-title">Power Snapshot</h2>
      <div class="db-cmp-analysis">
        <div class="db-cmp-chart-box">${svgChart}</div>
        <div class="db-cmp-axis-table">${axisBars}</div>
      </div>
    </div>
    <div class="db-cmp-panel">
      <h2 class="db-cmp-panel-title">GM Brief</h2>
      <div class="db-cmp-story"><strong>髴托ｽｴ繝ｻ・ｾ髴托ｽ･繝ｻ・ｶ鬩搾ｽｱ陷托ｽｰ繝ｻ・ｩ郢晢ｽｻ/strong><p>${d.summaryText}</p></div>
      <div class="db-cmp-insight-list">
        ${briefItems.map(item => `<div class="db-cmp-insight"><div><strong>${item.title}</strong><div class="desc">${item.desc}</div></div><span class="db-cmp-badge ${item.badgeClass}">${item.badge}</span></div>`).join('')}
      </div>
      <div class="db-cmp-brief-grid">${planHtml}</div>
    </div>
  </section>`;

  return html;
}

// 髫ｨ鬆大繭雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ鬯夲ｽｨ
// 髫ｨ鄙ｫ繝ｻ RELATIONSHIP MAP (Phase 6)                              髫ｨ鄙ｫ繝ｻ
// 髫ｨ髮・ｽ｣・ｺ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ陝ｷ繝ｻ

function _renderDbOrgCompare() {
  const d = Engine.database.getOrgCompareAnalysis(G, _dbCompareTarget);
  const rc = d.rivalColor;
  const tierCls = d.rivalTier === 'S' ? 's' : d.rivalTier === 'A' ? 'a' : 'b';

  function hexDim(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function signValue(n) {
    return n > 0 ? `+${n}` : `${n}`;
  }

  function getEdgeState(diff) {
    if (diff >= 8) return { cls: 'player', text: `${d.playerName}驍ｵ・ｺ隰疲ｻ薙★髯区ｺｯ蟇・};
    if (diff >= 4) return { cls: 'player', text: `${d.playerName}驍ｵ・ｺ隰疲ｺｪ辣､髯ｷ謳ｾ・ｽ・｢` };
    if (diff >= 2) return { cls: 'player', text: `${d.playerName}驍ｵ・ｺ隰疲ｺ倥・鬮ｯ・ｦ陟厄ｽ｢ };
    if (diff <= -8) return { cls: 'rival', text: `${d.rivalName}驍ｵ・ｺ繝ｻ・ｫ髫ｲ・ｰ繝ｻ・ｨ髫ｰ・ｨ隲､諛遺螺` };
    if (diff <= -4) return { cls: 'rival', text: `${d.rivalName}驍ｵ・ｺ隰疲ｺｪ辣､髯ｷ謳ｾ・ｽ・｢` };
    if (diff <= -2) return { cls: 'rival', text: `${d.rivalName}驍ｵ・ｺ隰疲ｺ倥・鬮ｯ・ｦ陟厄ｽ｢ };
    return { cls: 'even', text: '驍ｵ・ｺ繝ｻ・ｻ驍ｵ・ｺ繝ｻ・ｼ髣費｣ｰ雎募ｾ後・' };
  }

  function getPopularityTail(popDiff) {
    if (popDiff >= 8) return '髣費｣ｰ繝ｻ・ｺ髮守｢∵味隰ｫ繝ｻ・ｸ・ｺ繝ｻ・ｮ髯溷｢難ｽ｢・ｧ隹ｺ・ｾ驍ｵ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・､驍ｵ・ｺ郢晢ｽｻ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｲ郢晢ｽｻ;
    if (popDiff >= 3) return '鬯ｮ・ｮ郢晢ｽｻ繝ｻ・ｮ繝ｻ・｢鬯ｮ・ｱ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｧ驛｢・ｧ郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ繝ｻ・｡驛｢・ｧ陝ｲ・ｨ遶企ｦｴ諱・・・ｽ驍ｵ・ｺ郢晢ｽｻ繝ｻ・｢繝ｻ・ｨ驍ｵ・ｺ陟募ｨｯ譌ｺ驛｢・ｧ闕ｵ謨鳴郢晢ｽｻ;
    if (popDiff <= -8) return '鬩墓得・ｽ・･髯ｷ・ｷ隶主･・ｽｽ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｧ驛｢・ｧ郢ｧ繝ｻ・ｽ・､繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ・･鬩励ｑ・ｽ・ｮ驍ｵ・ｺ郢晢ｽｻ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ・ゑｽｰ驛｢・ｧ陟募ｨｯﾂ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｲ郢晢ｽｻ;
    if (popDiff <= -3) return '髣費｣ｰ繝ｻ・ｺ髮守｢∵味隰ｫ繝ｻ・ｸ・ｺ繝ｻ・ｮ鬮ｫ蜍溷罰闕ｵ・ｾ驛｢・ｧ驗呻ｽｫ繝ｻ繧奇ｽｾ貊ゑｽｽ・｡鬮ｫ蠅薙§邵ｲ蝣､・ｸ・ｺ鬮ｦ・ｪ遶企・・ｸ・ｺ郢晢ｽｻ・つ郢晢ｽｻ;
    return '髣費｣ｰ繝ｻ・ｺ髮取｢ｧﾂ諛会ｽｺ・ｫ鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・ｻ驍ｵ・ｺ繝ｻ・ｼ髣包ｽｳ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｳ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｲ遶擾ｽｫ繝ｻ・ｴ騾ｧ・ｮ繝ｻ・ｲ闕ｵ譏ｶ繝ｻ髫ｴ・ｬ繝ｻ・ｼ驍ｵ・ｺ繝ｻ・ｮ髯ｷ閧ｴ蜃ｵ繝ｻ・ｲ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ闕ｵ謨鳴郢晢ｽｻ;
  }

  function getMatchupSlot(index) {
    return [
      { chip: '驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ, center: 'ACE', key: 'ace' },
      { chip: 'No.2髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ, center: 'No.2', key: 'no2' },
      { chip: 'No.3髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ, center: 'No.3', key: 'no3' },
    ][index] || { chip: '髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ, center: 'VS', key: 'generic' };
  }

  function getMatchupCopy(slot, ovrDiff, popDiff) {
    const popTail = getPopularityTail(popDiff);
    if (slot.key === 'ace') {
      if (ovrDiff <= -8) return `驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｺ闕ｵ譏ｶ繝ｻ驛｢・ｧ鬮ｮ竏晢ｽｮ蜥ｲ・ｸ・ｺ陷会ｽｱ繝ｻ讓抵ｽｸ・ｲ郢ｧ逕ｻ笘・垓螟ｲ・ｽ・ｿ驍ｵ・ｺ繝ｻ・ｫ髫ｰ謦ｰ・ｽ・ｮ驍ｵ・ｺ陋ｹ・ｻ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ鬯ｯ貊ゑｽｽ・ｲ驍ｵ・ｺ繝ｻ・ｾ驛｢・ｧ陟募ｨｯﾂ・ｻ鬩搾ｽｨ郢ｧ繝ｻ・ｽ蜀暦ｽｹ・ｧ闕ｵ謨鳴郢晢ｽｻ{popTail}`;
      if (ovrDiff <= -4) return `驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ髯具ｽｻ郢晢ｽｻ遯ｶ・ｲ髫ｰ雋ｻ・ｽ・ｪ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ逕ｻ・・し・ｺ繝ｻ・｣髯ｷ・ｷ闔会ｽ｣・ゑｽｰ驛｢・ｧ霑壼遜・ｽ・ｽ髦ｮ蜷ｮﾂ・ｻ驛｢・ｧ闕ｵ譏ｶ繝ｻ髣包ｽｳ繝ｻ・ｻ髯昴・蜿吶・・ｨ繝ｻ・ｩ驛｢・ｧ陷ｻ蝓滉ｺ憺し・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ・ゑｽｰ驛｢・ｧ陟暮ｯ会ｽｽ繝ｻ・ｸ・ｺ陷ｷ・ｶ繝ｻ讓抵ｽｸ・ｲ郢晢ｽｻ{popTail}`;
      if (ovrDiff < 3) return `驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ髯ｷ蟯ｩ繝ｻ郢晢ｽｻ髯ｷ閧ｴ蜃ｵ繝ｻ・ｲ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ闕ｵ謨鳴郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ髦ｮ蜻ｻ・ｽ螳壽ｻ玖ｱ募ｾ後・驍ｵ・ｺ繝ｻ・ｧ髫ｰ蝠上・隨・｣ｰ髯晢ｽｶ繝ｻ・ｰ驛｢・ｧ陟暮ｯ会ｽｽ讙趣ｽｸ・ｺ繝ｻ・ｰ鬮｣莨√Γ繝ｻ・｡隰疲ｺ倥・髣厄ｽｴ髦ｮ蜷ｮﾂ・ｲ鬩搾ｽｱ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｾ驛｢・ｧ闕ｵ謨鳴郢晢ｽｻ{popTail}`;
      if (ovrDiff < 8) return `驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｺ髦ｮ蜷ｮ阡馴Δ・ｧ陝ｲ・ｨ遯ｶ・ｲ髯ｷ鮃ｹ莠らｫ頑･｢諤弱・・ｺ驛｢・ｧ陝ｲ・ｨ繝ｻ讙趣ｽｹ・ｧ闕ｵ謨鳴郢ｧ繝ｻ・｣・ｰ郢ｧ繝ｻﾂ郢晢ｽｻ遶雁､・ｹ譎｢・ｽ・｡驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｮ鬯ｯ菫ｶ魍堤ｫ企豪・ｸ・ｺ陷会ｽｱ遯ｶ・ｻ髫ｰ螟ｲ・ｽ・ｼ驍ｵ・ｺ隲､諛翫・驛｢・ｧ驗呻ｽｫ隨ｳ繝ｻ・ｸ・ｺ郢晢ｽｻ・つ郢晢ｽｻ{popTail}`;
      return `驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ髯橸ｽｳ隰疲ｺ倥・驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ髦ｮ蜷ｮ阡馴Δ・ｧ陝ｲ・ｨ郢晢ｽｻ髯懶ｽｨ雋贋ｼ夲ｽｽ・ｿ繝ｻ・ｵ驍ｵ・ｲ郢ｧ迚呻ｽｶ迹夲ｽｬ繝ｻ・ｹ譏ｴ繝ｻ鬨ｾ・ｵ陋ｹ・ｺ隰ｾ・ｸ驍ｵ・ｺ隴∫ｵｶ繝ｻ鬯ｯ貊難ｽｺ蛟ｪ魘ｬ驍ｵ・ｺ繝ｻ・､驛｢・ｧ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｧ髯ｷ螟ｧ豸ｵ隰ｫ繝ｻ・ｸ・ｺ繝ｻ・ｫ髯ｷ繝ｻ・ｽ・ｺ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ讓抵ｽｸ・ｲ郢晢ｽｻ{popTail}`;
    }
    if (slot.key === 'no2') {
      if (ovrDiff <= -8) return `No.2髯昴・・ｽ・ｾ髮手ｶ｣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｯ髮弱・・ｽ・｣鬨ｾ・ｶ繝ｻ・ｴ驍ｵ・ｺ闕ｵ譏ｶ繝ｻ驛｢・ｧ鬯倡夢謳ｦ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ髦ｮ蜷ｮ遨宣し・ｺ繝ｻ・ｧ髯晢｣ｰ繝ｻ・ｩ驛｢・ｧ陟暮ｯ会ｽｽ迢暦ｽｸ・ｺ繝ｻ・ｨ髣包ｽｳ髮榊・・ｽ・ｽ鬮ｦ・ｪ邵ｺ蜥ｲ・ｹ譎｢・ｽ・ｼ驛｢譎臥櫨郢晢ｽｻ髣厄ｽｴ髦ｮ蜷ｮﾂ・ｲ鬩肴得・ｽ・ｰ驍ｵ・ｺ陷托ｽｰ繝ｻ・ｦ闕ｵ譏ｶ譁｡驛｢・ｧ闕ｵ謨鳴郢晢ｽｻ{popTail}`;
      if (ovrDiff <= -4) return `No.2髯昴・・ｽ・ｾ髮手ｶ｣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｯ髫ｰ螟ｲ・ｽ・ｼ驍ｵ・ｺ髴郁ｲｻ・ｽ迹夲ｽｱ譴ｧﾂ諛・ｽ｢荵滂ｽｸ・ｲ郢ｧ繝ｻ・ｭ遉ｼ・ｸ・ｺ繝ｻ・ｿ髯ｷ閧ｴ蜃ｵ繝ｻ・ｲ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ陷ｷ・ｶ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ鬨ｾ・ｶ繝ｻ・ｸ髫ｰ繝ｻ・ｹ譏ｴ繝ｻ髣費｣ｰ隶吩ｸｻ繝ｻ髫ｰ繝ｻ・ｹ譏ｶﾂ・ｲ鬨ｾ・ｶ繝ｻ・ｮ鬩包ｽｶ闕ｵ譏ｶ蜻ｽ驍ｵ・ｲ郢晢ｽｻ{popTail}`;
      if (ovrDiff < 3) return `No.2髯昴・・ｽ・ｾ髮手ｶ｣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｯ髫ｲ・｡繝ｻ・ｮ髫ｰ螢ｼ蟷ｲ・つ郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ髦ｮ蜻ｻ・ｽ螳壽╂隰費ｽｶ繝ｻ鬘伜ｴ慕ｹ晢ｽｻ繝ｻ讙趣ｽｹ・ｧ闕ｵ謨厄ｽｰ驍ｵ・ｺ繝ｻ・ｧ髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｶ繝ｻ髯ｷ・ｴ陞｢・ｹ遶擾ｽｩ鬮ｫ・ｧ驕ｨ繧托ｽｽ・ｾ繝ｻ・｡驍ｵ・ｺ隰疲ｻゑｽｽ・､陝ｲ・ｨ繝ｻ蜀暦ｽｹ・ｧ闕ｵ謨鳴郢晢ｽｻ{popTail}`;
      if (ovrDiff < 8) return `No.2髯昴・・ｽ・ｾ髮手ｶ｣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ陷会ｽｱ隨・ｽｲ驍ｵ・ｺ闕ｵ譎｢・ｽ鬘俶輔・・ｪ髯ｷ謳ｾ・ｽ・｢驍ｵ・ｲ郢ｧ繝ｻ・ｽ・ｸ繝ｻ・ｻ髯ｷ迚呻ｽｸ蟷｢・ｽ・ｱ繝ｻ・､驍ｵ・ｺ繝ｻ・ｮ髯滓汚・ｽ・ｷ驍ｵ・ｺ髴郁ｲｻ・ｽ蟶晏寰闕ｵ譏ｶ髮ｷ驍ｵ・ｺ繝ｻ・､驍ｵ・ｺ闔会ｽ｣繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｯ髯ｷ蟯ｩ繝ｻ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ隨・ｽ｡驍ｵ・ｲ郢晢ｽｻ{popTail}`;
      return `No.2髯昴・・ｽ・ｾ髮手ｶ｣・ｽ・ｺ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ髯ｷ閧ｴ莠｢隨・ｽｲ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｪ驛｢・ｧ陝ｲ・ｨ・ゑｽｰ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ鬮ｮ繝ｻ・ｽ・ｼ繝ｻ・ｷ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ迚呻ｽｶ迹夲ｽｬ繝ｻ・ｹ譏ｴ繝ｻ髣包ｽｳ髮榊・・ｽ・ｽ陜難ｽｼ陷会ｽｵ驛｢・ｧ陋幢ｽｵ遶擾ｽｪ驍ｵ・ｺ繝ｻ・ｨ驛｢・ｧ遶丞｣ｺﾂ・ｻ髣包ｽｳ鬮ｮ竏晢ｽｱ骰具ｽｹ・ｧ陟募ｨｯﾂ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｲ郢晢ｽｻ{popTail}`;
    }
    if (ovrDiff <= -8) return `No.3髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ邵ｲ蝣､・ｹ・ｧ郢ｧ螟ｷ螟奇ｽｬ・ｨ隲､諛ｶ・ｽ・ｯ郢晢ｽｻ繝ｻ鬘費ｽｸ・ｲ郢ｧ繝ｻ・ｽ・ｱ繝ｻ・､驍ｵ・ｺ繝ｻ・ｮ鬮ｦ・ｮ郢晢ｽｻ繝ｻ繝ｻ・ｸ・ｺ陟募ｨｯ關ｽ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｾ鬯ｮ・ｴ繝ｻ・ｲ髯ｷ・ｻ陋ｹ・ｻ隨倥・・ｹ・ｧ闕ｵ譏ｴ繝ｻ驍ｵ・ｺ繝ｻ・ｧ鬩搾ｽｱ繝ｻ・ｨ髫ｰ迹壹・郢晢ｽｻ髫ｰ繝ｻ蜚ｱ繝ｻ・ｽ髦ｮ蜷ｮﾂ・ｻ驍ｵ・ｺ隰疲ｻゑｽｽ・ｿ郢晢ｽｻ繝ｻ・ｦ遶丞｣ｺ蜻ｳ驍ｵ・ｲ郢晢ｽｻ{popTail}`;
    if (ovrDiff <= -4) return `No.3髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ髫ｴ荳橸ｽｮ闌ｨ・ｽ・｢繝ｻ・ｺ驍ｵ・ｺ繝ｻ・ｫ髣包ｽｳ隶朱｡俶・驍ｵ・ｲ郢ｧ繝ｻ・ｽ・ｸ繝ｻ・ｭ髯懶ｽ｣郢晢ｽｻ闔・ｫ鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ陷ｷ・ｶ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ髯懈圜・ｽ・｣髣厄ｽｴ霓｣蛟ｬ・ｴ・ｨ驍ｵ・ｺ繝ｻ・ｮ髯晢ｽｾ繝ｻ・ｮ驛｢・ｧ陞ｳ螟ｲ・ｽ・ｦ闕ｵ譏ｶ髮ｷ驛｢・ｧ陝ｲ・ｨ繝ｻ讙趣ｽｹ・ｧ闕ｵ謨鳴郢晢ｽｻ{popTail}`;
    if (ovrDiff < 3) return `No.3髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ髯ｷ蟯ｩ繝ｻ郢晢ｽｻ鬩包ｽｶ繝ｻ・ｶ驛｢・ｧ陟暮ｯ会ｽｽ迢暦ｽｸ・ｲ郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ髦ｮ蜻ｻ・ｽ螳壽ｻ玖楜螟ｲ・ｽ・ｧ陋幢ｽｵ邵ｲ螳壽綜隶抵ｽｭ隨ｳ迢暦ｽｹ・ｧ陟募ｾ後・髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ髦ｮ蜷ｶ繝ｻ鬮ｫ蜍溽私繝ｻ・ｰ郢晢ｽｻ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｯ鬮｣諛ｶ・ｽ・ｽ驍ｵ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ・つ郢晢ｽｻ{popTail}`;
    if (ovrDiff < 8) return `No.3髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｺ髦ｮ蜷ｮ阡馴Δ・ｧ陝ｲ・ｨ遯ｶ・ｲ髣包ｽｳ驗呻ｽｫ・つ郢ｧ繝ｻ・ｽ・ｸ陋ｹ・ｺ鬯ｮ・ｪ驍ｵ・ｺ陋ｹ・ｻ郢晢ｽｻ髯滓汚・ｽ・ｷ驍ｵ・ｺ髴域喚繝ｻ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ鬩肴得・｣・ｰ鬨ｾ・ｶ繝ｻ・ｴ驍ｵ・ｺ繝ｻ・ｫ驛｢・ｧ繝ｻ・｢驛｢譎・ｱ堤ｹ晢ｽｻ驛｢譎｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ迢暦ｽｸ・ｲ郢晢ｽｻ{popTail}`;
    return `No.3髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ繝ｻ・ｧ髯懶ｽｨ繝ｻ・ｧ髯区ｺｷ繝ｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｲ郢ｧ繝ｻ・ｽ・ｱ繝ｻ・､驍ｵ・ｺ繝ｻ・ｮ髯ｷ・ｴ陞｢・ｹ繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｯ髯橸ｽｳ隰疲ｺ倥・驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ髦ｮ蜷ｮ阡馴Δ・ｧ陝ｲ・ｨ郢晢ｽｻ髯ｷ閧ｴ莠｢隨・｣ｰ驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｲ郢晢ｽｻ{popTail}`;
  }

  const rivalDim = hexDim(rc, 0.12);
  const rivalGrad = `linear-gradient(90deg,${rc},${hexDim(rc, 0.6)})`;
  const fallbackTag = '髯具ｽｻ郢晢ｽｻ隴ｴ・ｵ髣包ｽｳ繝ｻ・ｭ';
  const playerTags = d.playerTags.length ? d.playerTags : [fallbackTag];
  const rivalTags = d.rivalTags.length ? d.rivalTags : [fallbackTag];
  const briefLead = d.actions[0]?.text || d.opportunity || d.summaryText;

  let html = `<div class="db-cmp-select">
    <label>Compare with</label>
    <select onchange="_dbCompareTarget=this.value;renderDatabase()">
      ${RIVAL_ORGS.map(o => `<option value="${o.id}" ${_dbCompareTarget === o.id ? 'selected' : ''}>${o.emoji} ${G.rivalOrgNames?.[o.id] || o.name || o.id} (Tier ${o.tier})</option>`).join('')}
    </select>
  </div>`;

  const AXES = [
    { key: 'ace', label: 'TOP5鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ },
    { key: 'starPower', label: 'TOP5髣費｣ｰ繝ｻ・ｺ髮主ｾ後・ },
    { key: 'popularity', label: '髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・ },
    { key: 'depth', label: '鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､' },
  ];
  const R = 110;
  const cx = 160;
  const cy = 150;
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  function radarPt(scores, keys) {
    return keys.map((k, i) => {
      const v = scores[k] / 100 * R;
      return `${cx + dirs[i][0] * v},${cy + dirs[i][1] * v}`;
    }).join(' ');
  }
  const axisKeys = ['ace', 'starPower', 'popularity', 'depth'];
  const pPts = radarPt(d.playerScores, axisKeys);
  const rPts = radarPt(d.rivalScores, axisKeys);

  let gridSvg = '';
  [1, 0.75, 0.5, 0.25].forEach((s, i) => {
    const a = [0, -R * s, R * s, 0, 0, R * s, -R * s, 0].map((v, j) => j % 2 === 0 ? cx + v : cy + v);
    gridSvg += `<polygon points="${a[0]},${a[1]} ${a[2]},${a[3]} ${a[4]},${a[5]} ${a[6]},${a[7]}" fill="none" stroke="rgba(255,255,255,${0.12 - i * 0.02})"/>`;
  });

  const svgChart = `<svg viewBox="0 0 320 300" aria-label="髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｶﾎ､驛｢譎｢・ｽ・ｯ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ驛｢譎会ｽｿ・ｫ郢晢ｽ｣驛｢譎丞ｹｲ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｧ驛｢譏ｴ繝ｻ郢晢ｽｨ">
    <defs>
      <linearGradient id="gP" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#f0d078" stop-opacity="0.35"/><stop offset="100%" stop-color="#d4a843" stop-opacity="0.08"/></linearGradient>
      <linearGradient id="gR" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${rc}" stop-opacity="0.28"/><stop offset="100%" stop-color="${rc}" stop-opacity="0.05"/></linearGradient>
    </defs>
    <g>
      ${gridSvg}
      <line x1="${cx}" y1="${cy - R - 8}" x2="${cx}" y2="${cy + R + 8}" stroke="rgba(255,255,255,0.08)"/>
      <line x1="${cx - R - 8}" y1="${cy}" x2="${cx + R + 8}" y2="${cy}" stroke="rgba(255,255,255,0.08)"/>
      <polygon points="${pPts}" fill="url(#gP)" stroke="#d4a843" stroke-width="2"/>
      <polygon points="${rPts}" fill="url(#gR)" stroke="${rc}" stroke-width="2" opacity="0.7"/>
      ${axisKeys.map((k, i) => {
        const pv = d.playerScores[k] / 100 * R;
        const rv = d.rivalScores[k] / 100 * R;
        return `<circle cx="${cx + dirs[i][0] * pv}" cy="${cy + dirs[i][1] * pv}" r="3.5" fill="#f0d078"/>
                <circle cx="${cx + dirs[i][0] * rv}" cy="${cy + dirs[i][1] * rv}" r="3" fill="${hexDim(rc, 0.7)}"/>`;
      }).join('')}
      <text x="${cx}" y="${cy - R - 14}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="middle">TOP5鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ/text>
      <text x="${cx + R + 14}" y="${cy + 4}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="start">TOP5髣費｣ｰ繝ｻ・ｺ髮主ｾ後・/text>
      <text x="${cx}" y="${cy + R + 20}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="middle">髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・/text>
      <text x="${cx - R - 14}" y="${cy + 4}" fill="var(--text-sub)" font-family="'Noto Sans JP',sans-serif" font-size="11" text-anchor="end">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､</text>
    </g>
  </svg>`;

  let axisBars = '';
  AXES.forEach(ax => {
    const diff = d.diffs[ax.key];
    const cls = diff > 0 ? 'good' : diff < 0 ? 'bad' : '';
    axisBars += `<div class="db-cmp-axis-row">
      <header><strong>${ax.label}</strong><span class="db-cmp-diff ${cls}">${signValue(diff)}</span></header>
      <div class="db-cmp-meter">
        <span class="bar-player" style="width:${d.playerScores[ax.key]}%"></span>
        <span class="bar-rival" style="width:${d.rivalScores[ax.key]}%;background:${rivalGrad}"></span>
      </div>
    </div>`;
  });

  const briefItems = [
    { title: '髯ｷ閧ｴ莠｢隨・｣ｰ鬩包ｽｲ郢晢ｽｻ, desc: d.opportunity, badge: 'Opportunity', badgeClass: 'good' },
    { title: '髯ｷ螂・ｽｽ・ｱ鬯ｮ・ｯ繝ｻ・ｺ髣厄ｽｫ繝ｻ・｡髯ｷ・ｿ繝ｻ・ｷ', desc: d.risk, badge: 'Risk', badgeClass: 'bad' },
    { title: '驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ', desc: d.scout, badge: 'Scout', badgeClass: 'warn' },
  ];
  const planHtml = d.actions.slice(0, 2).map(a => `<div class="db-cmp-brief-card">
      <header><strong>${a.title}</strong><span class="db-cmp-badge ${a.badgeClass}">${a.badge}</span></header>
      <p>${a.text}</p>
    </div>`).join('') || `<div class="db-cmp-brief-card"><p>髴托ｽｴ繝ｻ・ｾ髫ｴ蠑ｱ・臥ｸｺ蟶ｷ・ｸ・ｺ繝ｻ・ｧ髯樊ｻゑｽｽ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ・･髯ｷ蟠趣ｽｼ譚ｿ・ｰ驍ｵ・ｺ陷ｷ・ｶ遶冗距・ｸ・ｺ鬮ｦ・ｪ邵ｺ繝ｻ・ｹ・ｧ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ郢晢ｽｻ/p></div>`;

  function buildOrgSummaryCard(name, subtitle, sideCls, tierHtml, tags, rosterCount, orgPop, scores, styleAttr = '') {
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
        <span>TOP5鬩搾ｽｱ闕ｳ讓抵ｽｲ繝ｻ<strong>${scores.ace}</strong></span>
        <span>鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､ <strong>${rosterCount}</strong></span>
        <span>髯懈圜・ｽ・｣髣厄ｽｴ髫ｰ雜｣・ｽ・ｺ繝ｻ・ｺ髮主ｾ後・<strong>${orgPop}</strong></span>
      </div>
    </article>`;
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
    return `<article class="${featured ? 'db-cmp-match-featured' : 'db-cmp-match-card'}">
      <div class="db-cmp-match-top">
        <span class="db-cmp-role-chip">${slot.chip}</span>
        <span class="db-cmp-edge ${edge.cls}">${edge.text}</span>
      </div>
      <div class="db-cmp-match-faceoff">
        <div class="db-cmp-match-side">
          <div class="db-cmp-match-avatar player ${featured ? 'lg' : ''}">${pAvatar}</div>
          <div class="db-cmp-match-meta">
            <strong>${m.player.name}</strong>
            <span>${d.playerName}</span>
            <span>OVR ${m.player.ovr} / 髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${m.player.pop}</span>
          </div>
        </div>
        <div class="db-cmp-match-center">
          <div class="db-cmp-match-vs">${slot.center}</div>
          <div class="db-cmp-match-metrics">
            <span>OVR髯晢ｽｾ繝ｻ・ｮ ${signValue(ovrDiff)}</span>
            <span>髣費｣ｰ繝ｻ・ｺ髮取｢ｧﾂ諛ｶ・ｽ・ｷ繝ｻ・ｮ ${signValue(popDiff)}</span>
          </div>
        </div>
        <div class="db-cmp-match-side right">
          <div class="db-cmp-match-avatar rival ${featured ? 'lg' : ''}" style="background:linear-gradient(180deg,${rc},${hexDim(rc, 0.4)})">${rAvatar}</div>
          <div class="db-cmp-match-meta">
            <strong>${m.rival.name}</strong>
            <span>${d.rivalName}</span>
            <span>OVR ${m.rival.ovr} / 髣費｣ｰ繝ｻ・ｺ髮主ｾ後・${m.rival.pop}</span>
          </div>
        </div>
      </div>
      <p class="db-cmp-match-copy">${getMatchupCopy(slot, ovrDiff, popDiff)}</p>
    </article>`;
  }

  const topMatchups = d.matchups.slice(0, 3);
  if (topMatchups.length) {
    html += `<section class="db-cmp-spotlight-panel">
      <div class="db-cmp-panel-title">Top 3 Matchups</div>
      ${buildMatchupCard(topMatchups[0], 0)}
      ${topMatchups.length > 1 ? `<div class="db-cmp-match-grid">${topMatchups.slice(1).map((m, idx) => buildMatchupCard(m, idx + 1)).join('')}</div>` : ''}
    </section>`;
  } else {
    html += `<section class="db-cmp-spotlight-panel">
      <div class="db-cmp-panel-title">Top 3 Matchups</div>
      <div class="db-cmp-recommend"><p>髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ繝ｻ・ｯ繝ｻ・ｾ鬮ｮ雜｣・ｽ・｡驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ陋滂ｽｶ繝ｻ・ｸ繝ｻ・ｻ髯ｷ迚呻ｽｸ蜷ｶ窶ｳ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ遯ｶ・ｲ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｰ髫ｰ・ｰ郢晢ｽｻ隨・ｽｲ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ郢ｧ驫繝ｻ髫ｰ繝ｻ蜚ｱ繝ｻ・ｱ繝ｻ・､驍ｵ・ｺ霑ｹ螟ｲ・ｽ・ｦ闕ｵ譏ｶ譁｡髯晏ｶ・ｹ譎｢・ｽ竏ｫ・ｸ・ｺ雋企屮・ｽ・ｮ繝ｻ・ｵ鬯ｮ・ｫ陟托ｽｱ邵ｲ螳壽呵悋・ｲ繝ｻ・｢繝ｻ・ｺ鬮ｫ・ｱ鬮ｦ・ｪ繝ｻ・ｰ驍ｵ・ｺ雋・∞・ｼ讓抵ｽｸ・ｺ繝ｻ・ｧ驍ｵ・ｺ陷ｷ・ｶ・つ郢晢ｽｻ/p></div>
    </section>`;
  }

  html += `<section class="db-cmp-main-grid">
    <div class="db-cmp-panel">
      <h2 class="db-cmp-panel-title">Power Snapshot</h2>
      <div class="db-cmp-analysis">
        <div class="db-cmp-chart-box">${svgChart}</div>
        <div class="db-cmp-axis-table">${axisBars}</div>
      </div>
      <div class="db-cmp-org-summary">
        <div class="db-cmp-org-summary-row">
          ${buildOrgSummaryCard(d.playerName, d.playerSubtitle, 'player', '<div class="db-cmp-tier player">Player</div>', playerTags, d.playerRosterCount, d.pOrgPop, d.playerScores)}
          <div class="db-cmp-org-summary-grade">
            <span>Matchup</span>
            <strong>${d.grade}</strong>
            <em>${d.gradeDesc}</em>
          </div>
          ${buildOrgSummaryCard(d.rivalName, d.rivalSubtitle, 'rival', `<div class="db-cmp-tier ${tierCls}">Tier ${d.rivalTier}</div>`, rivalTags, d.rivalRosterCount, d.rOrgPop, d.rivalScores, `style="--rival-dim:${rivalDim}"`)}
        </div>
        <div class="db-cmp-org-summary-note">
          <strong>髯懈圜・ｽ・｣髣厄ｽｴ隰撰ｽｺ繝ｻ・ｯ驕呈汚・ｽ・ｼ郢晢ｽｻ・朱豪・ｹ譎｢・ｽ・｢</strong>
          <p>${d.summaryText}</p>
        </div>
      </div>
    </div>
    <div class="db-cmp-panel">
      <h2 class="db-cmp-panel-title">GM Brief</h2>
      <div class="db-cmp-story"><strong>髣疲・・ｼ繝ｻﾂ繝ｻ・ｱ驍ｵ・ｺ繝ｻ・ｮ髯具ｽｻ繝ｻ・､髫ｴ繝ｻ・ｽ・ｭ</strong><p>${briefLead}</p></div>
      <div class="db-cmp-insight-list">
        ${briefItems.map(item => `<div class="db-cmp-insight"><div><strong>${item.title}</strong><div class="desc">${item.desc}</div></div><span class="db-cmp-badge ${item.badgeClass}">${item.badge}</span></div>`).join('')}
      </div>
      <div class="db-cmp-brief-grid">${planHtml}</div>
    </div>
  </section>`;

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

// 髫ｨ貂可髫ｨ貂可 髫ｲ・｢雋願侭ﾎ鈴Δ譏ｴ繝ｻ邵ｺ蜀暦ｽｹ・ｧ繝ｻ・ｹ驛｢譎冗樟邵ｺ蜥擾ｽｹ・ｧ繝ｻ・ｹ驛｢譏ｴ繝ｻ・弱・髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可髫ｨ貂可
const EMOTION_TEXTS = {
  trust: {
    normal:    '驍ｵ・ｺ隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ郢晢ｽｻ遯ｶ・ｻ驍ｵ・ｺ闕ｳ螂・ｽｽ讙趣ｽｹ・ｧ闕ｵ譏ｶ蜻ｳ驍ｵ・ｺ闔会ｽ｣邵ｲ蝣､・ｸ・ｲ遶丞｣ｺ繝ｻ驛｢・ｧ髦ｮ蜷ｮ蜻ｳ驍ｵ・ｺ陷ｿ・･繝ｻ・ｮ霑壼遜・ｽ・ｿ郢晢ｽｻ隨倥・・ｹ・ｧ郢晢ｽｻ,
    ojousama:  '驍ｵ・ｺ闔ｨ竏晄↓驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ郢晢ｽｻ遯ｶ・ｻ驍ｵ・ｺ闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ髴郁ｲｻ・ｽ迢暦ｽｸ・ｺ繝ｻ・ｨ驍ｵ・ｲ遶乗劼・ｽ・ｿ郢晢ｽｻ遯ｶ・ｲ鬩包ｽｨ闕ｳ螂・ｽｽ繝ｻ・ｸ・ｺ闕ｵ譏ｶ繝ｻ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ郢晢ｽｻ',
    delinquent:'髣包ｽｳ・つ鬩搾ｽｱ陋幢ｽｵ遶企豪・ｸ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ髦ｮ蜊搾ｽｰ驍ｵ・ｲ遶擾ｽｬ髫ｱ・ｰ驍ｵ・ｺ繝ｻ・｡鬨ｾ・ｹ・つ驍ｵ・ｺ闕ｳ螂・ｽｽ骰具ｽｸ・ｺ繝ｻ・ｰ驛｢・ｧ陋ｹ・ｻ遶翫・,
    cool:      '髣厄ｽｫ繝ｻ・｡鬯ｯ繝ｻ・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ邇厄ｽｬ・ｨ繝ｻ・ｰ髯昴・・ｻ・｣遶企・・ｸ・ｺ郢晢ｽｻ繝ｻ・ｺ繝ｻ・ｺ鬯ｮ・｢髦ｮ蜊債郢ｧ繝ｻ關ｽ驛｢・ｧ陟募ｨｯ蜻ｳ驍ｵ・ｺ闔会ｽ｣邵ｲ螳壽ｺ遶乗亢繝ｻ',
    seductive: '鬯ｮ・ｫ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ驍ｵ・ｲ遶乗劼・ｽ・ｱ郢晢ｽｻ繝ｻ・ｿ郢晢ｽｻ隲ｷ蜥ｲ・ｸ・ｺ陟暮ｯ会ｽｼ讓抵ｽｸ・ｺ郢晢ｽｻ郢晢ｽｻ驛｢・ｧ陋ｹ・ｻ郢晢ｽｻ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｵ驍ｵ・ｺ繝ｻ・ｵ',
    polite:    '髫ｴ蟷｢・ｽ・ｬ髯溷・萓ｭ遶頑･｢・ｫ・｢雋・ｽｯ繝ｻ・ｬ隴擾ｽｴ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ・ｽ・､繝ｻ・ｧ髯具ｽｻ郢晢ｽｻ遶企｡梧ｰ幄耳諛夷帝し・ｺ繝ｻ・ｧ驍ｵ・ｺ郢晢ｽｻ,
  },
  rival_friend: {
    normal:    '鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣隨ｳ繝ｻ・ｸ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻﾂ蝣､・ｹ・ｧ郢ｧ繝ｻﾂ遶丞｣ｺ蜃ｰ驍ｵ・ｺ闕ｵ譎｢・ｿ・｡驍ｵ・ｺ繝ｻ・ｧ髯滓汚・ｽ・ｷ驍ｵ・ｺ闕ｳ蟯ｩ繝ｻ驛｢・ｧ陟募ｨｯﾂ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ邇厄ｽｱ謔溷ｹｲ遯ｶ・ｲ驍ｵ・ｺ陷ｷ・ｶ繝ｻ繝ｻ,
    ojousama:  '鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣隨ｳ繝ｻ・ｸ・ｺ闕ｳ蟯ｩ譌ｺ驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｺ闔会ｽ｣繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｩ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髯橸ｽｳ雋・ｽｷ鬲假ｽｨ驍ｵ・ｺ繝ｻ・ｯ鬮ｫ・ｱ鬮ｦ・ｪ繝ｻ竏ｫ・ｸ・ｺ隰費ｽｶ繝ｻ迢暦ｽｹ・ｧ髮区ｩｸ・ｽ・ｾ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｹ・ｧ郢晢ｽｻ,
    delinquent:'驍ｵ・ｺ隲帛ｲｩ螟｢驍ｵ・ｺ繝ｻ・ｦ驛｢譎｢・ｽ・ｼ鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣郢晢ｽｻ驍ｵ・ｺ陋ｹ・ｻ・つ郢ｧ繝ｻﾂ蝣､・ｹ・ｧ郢ｧ繝ｻ遨宣し・ｺ郢ｧ繝ｻﾂ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｺ闕ｵ譎｢・ｽ闃ｽ・ｾ・ｯ郢晢ｽｻ遶擾ｽｴ驛｢・ｧ髦ｮ蜷ｮ蜻ｳ驛｢・ｧ郢晢ｽｻ,
    cool:      '髣費｣ｰ陋幢ｽｵ繝ｻ讓抵ｽｸ・ｺ繝ｻ・ｫ鬯ｯ・ｮ陋滂ｽ･繝ｻ竏ｬ諠ｺ陋ｹ・ｻ遶擾ｽｴ驛｢・ｧ驕擾ｽｩ隴幢ｽｪ髣厄ｽｫ郢ｧ繝ｻﾂ郢ｧ繝ｻﾂ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髫ｰ雋ｻ・ｽ・ｪ驍ｵ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ郢晢ｽｻ,
    seductive: '髯ｷ閧ｴ莠｢隨・｣ｰ驍ｵ・ｺ雋・∞・ｼ讓抵ｽｪ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｧ驛｢・ｧ郢ｧ繝ｻﾂ遶擾ｽｬ繝ｻ・ｿ繝ｻ・ｽ驍ｵ・ｺ郢晢ｽｻ・ゑｽｰ驍ｵ・ｺ闔会ｽ｣遯ｶ・ｻ驛｢・ｧ陋ｹ・ｺ陷・ｽｾ鬯ｮ・｢髦ｮ蜻ｻ・ｽ繧句ｰ陟暮ｯ会ｽｼ讓抵ｽｸ・ｺ陋滂ｽ･繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ郢晢ｽｻ',
    polite:    '鬩包ｽｶ繝ｻ・ｶ驍ｵ・ｺ郢晢ｽｻ驍顔距・ｸ・ｺ陋ｹ・ｻ繝ｻ迢暦ｽｸ・ｺ髦ｮ蜷ｮ繝ｻ驍ｵ・ｺ陟募仰遶擾ｽｬ郢晢ｽｻ髯具ｽｻ郢晢ｽｻ郢晢ｽｻ髯ｷ迚呻ｽｸ蜷ｮ繝ｻ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ,
  },
  destined_rival: {
    normal:    '鬮｢・ｰ郢晢ｽｻ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ陟慕距・ｸ・ｺ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ莨夲ｽｽ・ｵ繝ｻ・ｶ髯昴・・ｽ・ｾ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｲ遶擾ｽｬ繝ｻ・ｶ驗呻ｽｫ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ繝ｻ・ｸ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ繝ｻ・｣郢晢ｽｻ,
    ojousama:  '髣厄ｽｴ髴域喚ﾂ・ｲ驍ｵ・ｺ郢ｧ繝ｻ螟｢驍ｵ・ｺ繝ｻ・ｦ驛｢・ｧ郢ｧ繝ｻﾂ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驛｢・ｧ闕ｳ蟯ｩ陞ｺ驍ｵ・ｺ闕ｳ螂・ｽｼ・ｰ驍ｵ・ｺ繝ｻ・ｮ髫ｰ繝ｻ・ｹ譏ｴﾂ蟶晏ｱ・ｹ晢ｽｻ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｿ驍ｵ・ｺ陝ｶ蜷ｮ遨宣し・ｺ陷ｷ・ｶ繝ｻ繝ｻ,
    delinquent:'髯懈懶ｽｸ蟶吶・髫ｴ蠑ｱ・・・・ｸ繝ｻ・ｭ鬯ｯ繝ｻ・ｽ・ｭ驛｢・ｧ髫ｰ雜｣・ｽ・ｸ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ郢晢ｽｻ繝ｻ繝ｻ・ｸ・ｺ陟暮ｯ会ｽｽ迢暦ｽｸ・ｲ郢ｧ莨夲ｽｽ・ｵ繝ｻ・ｶ髯昴・・ｽ・ｾ驍ｵ・ｺ繝ｻ・ｶ驍ｵ・ｺ繝ｻ・｣髯区ｺｷ繝ｻ隨倥・,
    cool:      '驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶企・・ｸ・ｺ闔会ｽ｣繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ驍ｵ・ｲ遶擾ｽｽ繝ｻ・ｻ驗呻ｽｫ郢晢ｽｻ鬮｢・ｾ繝ｻ・ｪ髯具ｽｻ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｺ郢晢ｽｻ遶企・・ｸ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻ蜻ｳ驍ｵ・ｺ闕ｵ譎｢・ｽ閾･・ｸ・ｺ髦ｮ蜷ｮ關ｽ驍ｵ・ｲ遶乗楓ﾂ陋幢ｽｵ隨倥・,
    seductive: '鬯ｯ繝ｻ・ｽ・ｭ驍ｵ・ｺ闕ｵ譎｢・ｽ陋ｾ・ｫ・ｮ繝ｻ・｢驛｢・ｧ陟募ｨｯ繝ｻ驍ｵ・ｺ郢晢ｽｻ・つ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髫ｰ逍ｲ魍偵・・ｰ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｲ遶丞｣ｺ關ｽ驍ｵ・ｺ郢晢ｽｻ繝ｻ讓抵ｽｸ・ｺ郢晢ｽｻ繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ陋ｹ・ｻ郢晢ｽｻ',
    polite:    '驍ｵ・ｺ隴擾ｽｴ郢晢ｽｻ髯昴・・ｼ諛夷帝し・ｺ陟募仰遶擾ｽｫ繝ｻ・ｧ遶丞､ｲ・ｽ蟶昴・遶丞｣ｺﾂ・ｳ髯ｷ蟠趣ｽｼ譚ｿ・ｰ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ・ｽ・ｿ郢晢ｽｻ隨倥・・ｸ・ｲ遶擾ｽｬ繝ｻ・ｶ郢晢ｽｻ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｿ驍ｵ・ｺ陝ｶ蜷ｮ遨宣し・ｺ郢晢ｽｻ,
  },
  acquaintance: {
    normal:    '驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ郢ｧ繝ｻﾂ遶擾ｽｫ髯ｦ蜥ｲ・ｸ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｺ闔会ｽ｣遶雁鴻・ｪ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ隴擾ｽｴ繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ驍ｵ・ｺ闔会ｽ｣・ゑｽｰ驍ｵ・ｺ繝ｻ・ｪ',
    ojousama:  '髯昴・ﾂ・･・ゑｽｧ髣包ｽｳ驗呻ｽｫ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ驗呻ｽｫ繝ｻ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ繝ｻ・ｰ驛｢・ｧ陟募ｨｯ繝ｻ驍ｵ・ｲ遶擾ｽｫ鬮ｻ・ｳ髯具ｽｻ繝ｻ・･驍ｵ・ｺ繝ｻ・ｪ髫ｲ・｢雋願侭ﾎ鈴し・ｺ繝ｻ・ｯ驍ｵ・ｺ隴∵腸・ｼ鬘費ｽｸ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｹ・ｧ郢晢ｽｻ,
    delinquent:'驍ｵ・ｺ郢ｧ繝ｻ繝ｻ驍ｵ・ｲ遶丞､ｲ・ｼ讓抵ｽｸ・ｺ雋・ｪ繝ｻ驍ｵ・ｲ郢ｧ繝ｻ閧ｩ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｺ郢晢ｽｻ邵ｲ蝣､・ｹ・ｧ郢ｧ繝ｻ・ｼ讓抵ｽｸ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｩ',
    cool:      '鬮ｫ・ｱ陝雜｣・ｽ・ｭ陋滂ｽ･郢晢ｽｻ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｲ郢ｧ繝ｻ關ｽ驛｢・ｧ陟包ｽ｡繝ｻ・ｻ繝ｻ・･髣包ｽｳ驗呻ｽｫ邵ｲ蝣､・ｹ・ｧ郢ｧ繝ｻ關ｽ驛｢・ｧ陟包ｽ｡繝ｻ・ｻ繝ｻ・･髣包ｽｳ闕ｵ譏ｴﾂ蝣､・ｹ・ｧ郢ｧ繝ｻ繝ｻ驍ｵ・ｺ郢晢ｽｻ,
    seductive: '鬩墓得・ｽ・･驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ驛｢・ｧ闕ｵ譎｢・ｽ蜀暦ｽｹ・ｧ陋ｹ・ｻ・つ遶擾ｽｽ繝ｻ・ｸ・つ髯滂ｽ｢隲帷ｿｫ繝ｻ驍ｵ・ｲ郢ｧ繝ｻﾂ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ隴擾ｽｴ繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ驍ｵ・ｺ郢晢ｽｻ,
    polite:    '驍ｵ・ｺ鬮ｮ繝ｻ蛟ｹ髯ｷ鮃ｹ莠らｹ晢ｽｻ髯昴・ﾂ・･・ゑｽｧ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ蜃ｰ鬮ｫ・ｧ繝ｻ・ｱ驍ｵ・ｺ陷ｷ・ｶ繝ｻ邇厄ｽｮ蛹・ｽｻ莨夲ｽｽ・ｼ陞｢・ｹ郢晢ｽｻ髯昴・・ｻ・｣遶企・・ｸ・ｺ郢晢ｽｻ邵ｲ蝣､・ｸ・ｺ陷ｷ・ｶ繝ｻ・ｰ驛｢・ｧ陟募ｨｯ繝ｻ',
  },
  intrigued: {
    normal:    '驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ髦ｮ蜷ｮ蜻ｳ驛｢・ｧ鬮ｦ・ｪ遶包ｽｧ驍ｵ・ｲ遶擾ｽｫ陝ｯ・ｼ驍ｵ・ｺ繝ｻ・ｧ鬮ｴ謇假ｽｽ・ｽ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ闌ｨ・ｽ・ｰ陷会ｽｱ遶企豪・ｸ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ遶雁ｸ晏搦・つ驍ｵ・ｺ陋ｹ・ｻ郢晢ｽｻ髯懈ぁﾂ・･遶企豪・ｸ・ｺ繝ｻ・ｪ驛｢・ｧ郢晢ｽｻ,
    ojousama:  '驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ隲帷腸・ｰ驍ｵ・ｺ陷会ｽｱ繝ｻ閾･・ｪ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髮取ぁ蟷ｲ遶企豪・ｸ・ｺ闕ｵ謨厄ｽｰ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ髣皮甥・｢轣假ｽｩ・ｿ驍ｵ・ｺ陟募ｨｯ譌ｺ驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｺ繝ｻ・ｮ',
    delinquent:'驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髯具ｽｻ繝ｻ・･驍ｵ・ｺ繝ｻ・ｫ髮取ぁ蟷ｲ遶企豪・ｸ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ繝ｻ・ｭ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ陷会ｽｱ・つ郢ｧ繝ｻ・ｼ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｭ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ闔会ｽ｣遶雁鴻・ｸ・ｲ遶擾ｽｫ陝ｯ・ｼ驍ｵ・ｺ繝ｻ・ｫ髯ｷ闌ｨ・ｽ・･驛｢・ｧ髦ｮ蜷ｮ蜻ｳ驛｢・ｧ郢晢ｽｻ,
    cool:      '髮取ぁ蟷ｲ遶企豪・ｸ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ遶企・・ｸ・ｺ郢晢ｽｻ隨・ｽｽ驛｢・ｧ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ雋・ｽｪ・つ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ',
    seductive: '驍ｵ・ｺ繝ｻ・｡驛｢・ｧ郢晢ｽｻ隨・ｽｲ驍ｵ・ｺ繝ｻ・ｨ髮取ぁ蟷ｲ遶企豪・ｸ・ｺ繝ｻ・ｪ驛｢・ｧ闕ｵ譏ｴ繝ｻ驛｢・ｧ陋ｹ・ｻ郢晢ｽｻ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髣厄ｽｴ髴域喚ﾂ・ｲ驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｯ鬮ｫ・ｪ・つ驍ｵ・ｺ陋ｹ・ｻ遶企・・ｸ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｩ',
    polite:    '驍ｵ・ｺ繝ｻ・､驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｰ陷会ｽｱ遶企豪・ｸ・ｺ闕ｵ譎｢・ｿ・ｰ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ陷会ｽｱ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ閾･・企ｨｾ蛹・ｽｽ・ｱ驍ｵ・ｺ繝ｻ・ｯ驛｢・ｧ陋ｹ・ｻ繝ｻ・･驛｢・ｧ闕ｳ迺ｰ・ｰ驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｺ郢晢ｽｻ,
  },
  hostile_competitor: {
    normal:    '鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣隨ｳ繝ｻ・ｸ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻ關ｽ驛｢・ｧ陟募ｨｯ蜻ｳ驍ｵ・ｺ闔会ｽ｣郢晢ｽｻ驍ｵ・ｲ遶丞｣ｹ繝ｻ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ鬮ｦ・ｪ繝ｻ鬘費ｽｸ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ繝ｻ,
    ojousama:  '鬩搾ｽｨ繝ｻ・ｶ髯昴・・ｽ・ｾ驍ｵ・ｺ繝ｻ・ｫ鬯ｩ霈斐・繝ｻ讙趣ｽｹ・ｧ髮区ｧｫ蠕宣Δ・ｧ驗呻ｽｫ隨ｳ繝ｻ・ｸ・ｺ闕ｳ蟯ｩ譌ｺ驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｺ繝ｻ・ｮ驍ｵ・ｲ郢ｧ繝ｻ關ｽ驛｢・ｧ陟募ｨｯ蜻ｳ驍ｵ・ｺ闔会ｽ｣邵ｲ蝣､・ｸ・ｺ陷ｷ・ｶ繝ｻ繝ｻ,
    delinquent:'鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣郢晢ｽｻ驍ｵ・ｺ陋ｹ・ｻ・つ郢ｧ闌ｨ・ｽ・ｭ繝ｻ・ｻ驛｢・ｧ髦ｮ蜷ｶﾂ蝣､・ｹ・ｧ郢ｧ螂・ｽｽ・ｲ繝ｻ・ｰ驍ｵ・ｺ闔会ｽ｣郢晢ｽｻ驍ｵ・ｺ郢晢ｽｻ,
    cool:      '鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣繝ｻ迢暦ｽｹ・ｧ闕ｳ螂・ｽｿ・ｰ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｺ郢晢ｽｻ・ゑｽｰ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ閾･・企辨・ｻ陋ｹ・ｻ・ゑｽｧ驛｢・ｧ郢晢ｽｻ遶企・・ｸ・ｺ郢晢ｽｻ,
    seductive: '鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ闔会ｽ｣隨ｳ繝ｻ・ｸ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｲ郢ｧ閾･・企ｨｾ蛹・ｽｽ・ｱ驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ髦ｮ蜷ｮﾂ・ｻ鬩墓得・ｽ・･驛｢・ｧ陝ｲ・ｨ遶企・・ｸ・ｺ郢晢ｽｻ繝ｻ繝ｻ,
    polite:    '驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ驛｢・ｧ郢ｧ螂・ｽｽ・ｲ繝ｻ・ｰ驍ｵ・ｺ闔会ｽ｣隨ｳ繝ｻ・ｸ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ骰具ｽｸ・ｺ繝ｻ・ｧ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ・ｽ・ｼ繝ｻ・ｷ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｰ驍・ｽｲ隰梧ｺｽ・ｸ・ｺ繝ｻ・｡驍ｵ・ｺ陟募ｨｯ譌ｺ驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ,
  },
  indifferent: {
    normal:    '髮弱・・ｽ・｣鬨ｾ・ｶ繝ｻ・ｴ驍ｵ・ｲ遶丞｣ｺ譌ｺ驍ｵ・ｺ繝ｻ・ｾ驛｢・ｧ鬮ｮ繝ｻ・ｭ繧句ｯｰ繝ｻ・｡驍ｵ・ｺ陟募ｨｯ繝ｻ驍ｵ・ｺ郢晢ｽｻ,
    ojousama:  '驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ雋・･ﾂ蝣､・ｸ・ｺ陷会ｽｱ隨ｳ繝ｻ・ｸ・ｺ闕ｵ譎｢・ｼ・ｰ驛｢・ｧ闖ｫ繝ｻﾂ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髯昴・ﾂ・･・ゑｽｧ髣包ｽｳ驗呻ｽｫ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｹ・ｧ郢晢ｽｻ,
    delinquent:'鬮ｫ・ｱ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ闔会ｽ｣・つ郢ｧ闃ｽ・｡蜥ｲ・ｹ・ｧ陝ｲ・ｨ郢晢ｽｻ',
    cool:      '鬮ｫ・ｪ闖ｫ・ｶ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ,
    seductive: '驛｢・ｧ髦ｮ蜷ｶ繝ｻ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ鬮ｫ・ｱ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ雋・ｼ会ｽｰ驍ｵ・ｺ陷会ｽｱ繝ｻ繝ｻ,
    polite:    '鬨ｾ蛹・ｽｽ・ｳ驍ｵ・ｺ髣埼屮・ｽ・ｨ繝ｻ・ｳ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ骰具ｽｸ・ｲ遶丞｣ｺ譌ｺ驍ｵ・ｺ繝ｻ・ｾ驛｢・ｧ鬮ｮ繝ｻ・ｽ・ｭ陋滂ｽ･・ゑｽｧ髣包ｽｳ驗呻ｽｫ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ闕ｳ蟯ｩﾂ・ｻ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ',
  },
  contempt: {
    normal:    '驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髫ｴ・ｬ繝ｻ・ｼ驍ｵ・ｺ驕偵・・ｼ繝ｻ・ｸ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻ繝ｻ驍ｵ・ｺ闔ｨ諛茨ｽ・蘭・ｫ繝ｻ・ｵ驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｯ髫ｲ・､隴擾ｽｴ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ,
    ojousama:  '驛｢・ｧ闕ｳ蟯ｩ陞ｺ驍ｵ・ｺ闕ｳ螂・ｽｼ・ｰ驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｲ遶擾ｽｽ繝ｻ・ｽ闕ｳ鄙ｫ繝ｻ髣包ｽｳ闕ｵ貊・・驍ｵ・ｺ驕偵・・ｼ繝ｻ・ｸ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ繝ｻ繧会ｽｸ・ｺ繝ｻ・ｮ',
    delinquent:'驛｢譏懶ｽｸ鄙ｫﾎ暮し・ｲ郢晢ｽｻ陝・・・ｬ・ｲ陞｢・ｹ遯ｶ・ｲ鬮ｫ遨ゑｽｹ貊・・驍ｵ・ｺ繝ｻ・ｫ髯ｷ闌ｨ・ｽ・･驛｢・ｧ髦ｮ蜷ｮ繝ｻ',
    cool:      '髯橸ｽｳ雋・ｽｷ鬲假ｽｨ髯晢ｽｾ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｯ髫ｴ荳橸ｽｮ莠･鬆・し・ｲ郢ｧ迚呻ｽｶ迹夲ｽｬ繝ｻ・ｹ譏ｶ繝ｻ驍ｵ・ｺ陷ｷ・ｶ繝ｻ邇門ｵｩ繝ｻ・｡髯区ｻゑｽｽ・､驛｢・ｧ陷ｻ驕ｺ讌ｳ驍ｵ・ｺ陋滂ｽ･遶企・・ｸ・ｺ郢晢ｽｻ,
    seductive: '驍ｵ・ｺ郢ｧ繝ｻ繝ｻ鬩墓ｧｫ蜚ｱ繝ｻ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｧ髯ｷ・ｷ陟募具ｽｧ驛｢譎｢・ｽ・ｪ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｫ郢晢ｽｻ雋・ｽｪ・つ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髯ｷ・ｿ繝ｻ・ｯ髫ｲ・｢陝ｶ蜻ｻ・ｼ讓抵ｽｹ・ｧ闕ｳ鄙ｫ繝ｻ',
    polite:    '驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髯橸ｽｳ雋・ｽｷ鬲假ｽｨ驍ｵ・ｺ繝ｻ・ｮ髯晢ｽｾ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｯ驍ｵ・ｲ遶擾ｽｵ繝ｻ・ｭ繝ｻ・｣鬨ｾ・ｶ繝ｻ・ｴ髫ｲ・｢雋・ｼ会ｽｧ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ郢晢ｽｻ,
  },
  irritation: {
    normal:    '鬨ｾ・ｶ繝ｻ・ｮ鬯ｮ・ｫ隲帛･・ｽｽ鬘費ｽｸ・ｲ郢ｧ螂・ｽｽ・ｦ闕ｵ貊・・驍ｵ・ｺ繝ｻ・ｫ髯ｷ闌ｨ・ｽ・･驛｢・ｧ闕ｵ譏ｶ蜻ｳ驍ｵ・ｺ闔会ｽ｣邵ｲ螳夲ｽｱ謔溷ｹｲ遯ｶ・ｲ髫ｰ・ｨ繝ｻ・｣驛｢・ｧ郢晢ｽｻ,
    ojousama:  '驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｺ郢晢ｽｻ遶企豪・ｹ・ｧ郢ｧ繝ｻﾂ遶擾ｽｵ繝ｻ・ｰ陷会ｽｱ遶企ｦｴ・ｫ・ｫ隲帛･・ｽｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陷ｷ・ｶ郢晢ｽｻ',
    delinquent:'鬮ｫ遨ゑｽｹ譎｢・ｽ迢暦ｽｸ・ｺ繝ｻ・ｨ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｩ驍ｵ・ｺ陷ｷ・ｶ繝ｻ骰具ｽｸ・ｺ繝ｻ・ｰ驛｢・ｧ陋ｹ・ｻ・つ郢ｧ螂・ｽｽ・ｿ陞滂ｽｧ繝ｻ・ｯ郢晢ｽｻ繝ｻ骰具ｽｸ・ｺ繝ｻ・ｪ',
    cool:      '驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髣包ｽｳ隶主･・ｽｽ・ｿ繝ｻ・ｫ驍ｵ・ｲ郢ｧ繝ｻ繝ｻ驛｢・ｧ闕ｵ譏ｶ繝ｻ驍ｵ・ｺ陷托ｽｰ繝ｻ・ｦ闕ｵ貊・・驍ｵ・ｺ繝ｻ・ｫ髯ｷ闌ｨ・ｽ・･驛｢・ｧ陟募ｨｯ陞ｺ驍ｵ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ郢晢ｽｻ,
    seductive: '驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ髦ｮ蜊搾ｽｰ鬨ｾ荵昴・遶企ｦｴ・ｫ・ｫ隲帛･・ｽｽ迢暦ｽｸ・ｺ繝ｻ・ｮ驛｢・ｧ陋ｹ・ｻ郢晢ｽｻ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ鬮ｮ髢・ｾ螽ｯ繝ｻ髫ｲ・｢雋・ｼ会ｽｧ',
    polite:    '鬮ｴ蜿ｰ・ｻ・｣繝ｻ・･驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ郢晢ｽｻ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｨ驍ｵ・ｲ遶丞｣ｺ繝ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ繧奇ｽｱ讙手ｻｸ隰梧ｺｽ・ｸ・ｺ繝ｻ・｡驍ｵ・ｺ霑ｹ螟奇ｽｪ・ｰ驍ｵ・ｺ繝ｻ・｡鬨ｾ・ｹ・つ驍ｵ・ｺ闕ｵ譏ｶ繝ｻ驍ｵ・ｺ闕ｳ蟯ｩﾂ・ｻ驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ',
  },
  hatred: {
    normal:    '鬯ｯ菫ｶ魍偵・蟶晏寰闕ｵ譎｢・ｽ迢暦ｽｸ・ｺ繝ｻ・ｨ驍ｵ・ｲ遶擾ｽｬ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｮ髯滓焔・ｼ謚ｫﾂ・ｲ髴趣ｽ｣繝ｻ・ｮ驍ｵ・ｺ陋ｹ・ｻ繝ｻ・･驛｢・ｧ鬯伜∞・ｽ・ｿ隴∵腸・ｽ繝ｻ,
    ojousama:  '髫ｲ・､隴擾ｽｴ繝ｻ讚∵弱・・ｺ驍ｵ・ｺ陷ｷ・ｶ隨・ｽ｡驍ｵ・ｺ闔会ｽ｣邵ｲ蝣､・ｪ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｯ驛｢・ｧ陝ｲ・ｨ繝ｻ蜀暦ｽｸ・ｺ雋・ｪﾂ・ｲ髴趣ｽ｣繝ｻ・ｮ驍ｵ・ｺ陋ｹ・ｻ繝ｻ・･驛｢・ｧ驗呻ｽｫ遶擾ｽｪ驍ｵ・ｺ陷ｷ・ｶ繝ｻ繝ｻ,
    delinquent:'驍ｵ・ｺ繝ｻ・ｶ驍ｵ・ｺ繝ｻ・｣髮玖ｶ｣・ｽ・ｰ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ莨夲ｽｽ・ｵ繝ｻ・ｶ髯昴・・ｽ・ｾ驍ｵ・ｺ繝ｻ・ｫ驍ｵ・ｺ繝ｻ・ｶ驍ｵ・ｺ繝ｻ・｣髮玖ｶ｣・ｽ・ｰ驍ｵ・ｺ陷ｷ・ｶ・つ郢ｧ繝ｻ關ｽ驛｢・ｧ陟暮ｯ会ｽｼ・ｰ驍ｵ・ｺ驍・ｳｴﾂ郢晢ｽｻ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｭ驍ｵ・ｺ郢晢ｽｻ,
    cool:      '驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ髫ｹ・ｿ繝ｻ・ｺ髫ｲ・｢闕ｳ蟯ｩ繝ｻ鬮ｴ蜿ｰ・ｻ・｣繝ｻ讚・ｽｫ・｢雋願侭ﾎ鈴し・ｺ陟募ｨｯ譌ｺ驛｢・ｧ闕ｵ謨鳴郢ｧ鄙ｫ繝ｻ鬮ｫ蜍滂ｽ｣・ｹ郢晢ｽｻ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ繝ｻ,
    seductive: '鬮ｫ・ｪ繝ｻ・ｱ驍ｵ・ｺ陝ｶ蜷ｮ繝ｻ驍ｵ・ｺ郢晢ｽｻ・つ郢ｧ繝ｻ・ｼ繝ｻ・ｸ・ｺ繝ｻ・ｮ髮取ｪ手ｻｸ隰梧ｺｽ・ｸ・ｺ繝ｻ・｡驍ｵ・ｲ遶擾ｽｫ繝ｻ・ｵ繝ｻ・ｶ髯昴・・ｽ・ｾ驍ｵ・ｺ繝ｻ・ｫ髮趣ｽｸ陋ｹ・ｻ遶擾ｽｴ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ,
    polite:    '驕ｯ・ｶ繝ｻ・ｦ驕ｯ・ｶ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ驛｢・ｧ郢ｧ繝ｻﾂ遶擾ｽｬ繝ｻ・ｨ繝ｻ・ｱ驍ｵ・ｺ陷ｷ・ｶ繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｨ驍ｵ・ｺ陟募ｾ個蝣､・ｸ・ｺ鬮ｦ・ｪ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ,
  },
};

function getEmotionCategory(bond, rivalry, selfOvr, targetOvr) {
  const bLvl = bond >= 65 ? 'high' : bond >= 40 ? 'mid' : 'low';
  const rLvl = rivalry >= 50 ? 'high' : rivalry >= 20 ? 'mid' : 'low';
  if (bLvl === 'high' && rLvl === 'low') return 'trust';
  if (bLvl === 'high' && rLvl === 'mid') return 'rival_friend';
  if (bLvl === 'high' && rLvl === 'high') return 'destined_rival';
  if (bLvl === 'mid' && rLvl === 'low') return 'acquaintance';
  if (bLvl === 'mid' && rLvl === 'mid') return 'intrigued';
  if (bLvl === 'mid' && rLvl === 'high') return 'hostile_competitor';
  if (bLvl === 'low' && rLvl === 'low') return (selfOvr - targetOvr >= 10) ? 'contempt' : 'indifferent';
  if (bLvl === 'low' && rLvl === 'mid') return 'irritation';
  return 'hatred'; // low 繝ｻ繝ｻ繝ｻhigh
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
  if (f._orgId === 'player') return G.orgName || '驛｢譎丞ｹｲ・取ｨ抵ｽｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ髯懈圜・ｽ・｣髣厄ｽｴ郢晢ｽｻ;
  if (f._orgId === 'fa') return '驛｢譎・ｽｼ驥・㏍・ｹ譎｢・ｽ・ｼ';
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
  const history = G.relationshipHistory || [];
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

    links.push({
      a: a.id, b: b.id, source: a.id, target: b.id,
      bondAB, bondBA, rivAB, rivBA,
      rivalLvl, hasTitle, isOneSided, hasPast,
      strength, sortScore,
      rivalTitle: hasTitle && rivalLvl ? rivalLvl.label : null,
      titleColor: hasTitle && rivalLvl ? rivalLvl.color : null,
      titleEmoji: hasTitle && rivalLvl ? rivalLvl.emoji : null,
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

function _relmapLinkPassesFilter(link, filter) {
  if (!link) return false;
  if (filter === 'rivalry') return link.rivAB >= 25 || link.rivBA >= 25 || !!link.rivalTitle;
  if (filter === 'bond') return Math.abs(link.bondAB - 50) >= 10 || Math.abs(link.bondBA - 50) >= 10;
  return true;
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

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// _renderDbRelmap 驕ｯ・ｶ郢晢ｽｻHTML skeleton generation
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
function _renderDbRelmap() {
  const allChars = _relmapGetAllChars();
  if (!allChars.length) return '<div style="text-align:center;padding:40px;color:var(--text-dim)">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶﾂ・ｲ驍ｵ・ｺ郢晢ｽｻ遶擾ｽｪ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>';

  // Default center: first roster member
  if (!_relmapCenterId || !allChars.find(c => c.id === _relmapCenterId)) {
    _relmapCenterId = allChars.length > 0 ? allChars[0].id : null;
  }

  const centerChar = _relmapCenterId ? allChars.find(c => c.id === _relmapCenterId) : null;

  let html = `<div id="relmapRoot" class="relmap-root">`;

  // 髫ｨ貂可髫ｨ貂可 Header bar 髫ｨ貂可髫ｨ貂可
  html += `<div class="relmap-header">`;
  html += `<span class="rm-title">\uD83D\uDD17 RELATIONSHIP MAP</span>`;
  html += `<div class="rm-header-sep"></div>`;
  // View mode toggle
  html += `<div class="rm-view-toggle">`;
  html += `<button class="rm-vt-btn${_relmapViewMode==='network'?' active':''}" onclick="_relmapSetViewMode('network')">\uD83C\uDF10 驛｢譎樔ｺらｹ晢ｽ｣驛｢譎冗樟・趣ｽ｡驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｯ</button>`;
  html += `<button class="rm-vt-btn${_relmapViewMode==='focus'?' active':''}" onclick="_relmapSetViewMode('focus')">\uD83C\uDFAF 驛｢譎・ｽｼ譁青ｰ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｹ</button>`;
  html += `<button class="rm-vt-btn${_relmapViewMode==='power'?' active':''}" onclick="_relmapSetViewMode('power')">\uD83D\uDDFA\uFE0F 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ繝ｻ/button>`;
  html += `</div>`;
  // Center indicator
  html += `<div class="rm-center-indicator" id="rmCenterIndicator" style="display:${_relmapCenterId && centerChar?'flex':'none'}">`;
  html += `<span class="ci-label">CENTER</span>`;
  html += `<span class="ci-name" id="rmCenterName">${centerChar ? centerChar.name : ''}</span>`;
  html += `<span class="ci-clear" onclick="_relmapClearCenter()" title="鬮ｫ證ｦ・ｽ・｣鬯ｮ・ｯ繝ｻ・､">\u2715</span>`;
  html += `</div>`;
  // Link filters
  html += `<div class="rm-header-controls">`;
  html += `<button class="rm-ctrl-btn${_relmapFilter==='all'?' active':''}" onclick="_relmapSetFilter('all')">髯ｷ闌ｨ・ｽ・ｨ驛｢譎｢・ｽ・ｪ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｯ</button>`;
  html += `<button class="rm-ctrl-btn${_relmapFilter==='rivalry'?' active':''}" onclick="_relmapSetFilter('rivalry')">驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢譎√・・弱・/button>`;
  html += `<button class="rm-ctrl-btn${_relmapFilter==='bond'?' active':''}" onclick="_relmapSetFilter('bond')">鬮ｫ蛹・ｽｽ・ｪ髯昴・繝ｻ繝ｻ・ｺ繝ｻ・ｦ</button>`;
  html += `</div>`;
  html += `</div>`; // end header

  // 髫ｨ貂可髫ｨ貂可 Main area 髫ｨ貂可髫ｨ貂可
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
  html += `</defs><g id="relmapZoneLayer"></g><g id="relmapLinkLayer"></g><g id="relmapNodeLayer"></g></svg>`;
  html += `</div>`; // end canvas

  // Legend
  html += `<div class="relmap-legend">`;
  html += `<div class="rm-legend-title">LEGEND</div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch" style="background:#74b9ff"></div> 鬮ｫ蛹・ｽｽ・ｪ髯昴・繝ｻ繝ｻ・ｼ騾趣ｽｯ繝ｻ・ｫ陋帙・・ｽ・ｼ郢晢ｽｻ/div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch" style="background:#ff7675"></div> 髣包ｽｳ陜｣・ｺ繝ｻ・ｿ繝ｻ・｡郢晢ｽｻ闔蛹・ｽｽ・ｽ髮懶ｽ｣繝ｻ・ｼ郢晢ｽｻ/div>`;
  html += `<div class="rm-legend-line"><div class="rm-legend-swatch thick" style="background:#e17055"></div> 鬩包ｽｶ繝ｻ・ｶ髣費｣ｰ騾包ｽｻ・大涵蝙鍋ｹ晢ｽｻ/div>`;
  html += `<div style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px;font-size:9px;color:var(--text-dim)">驛｢譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎擾ｽｳ・ｨ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ郢晢ｽｻ隰夲ｼ由<br>驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ莉｣繝ｻ隴乗・・ｽ・ｸ繝ｻ・ｭ髯滂ｽ｢郢晢ｽｻ郢晢ｽｻ髫ｴ蜴・ｽｽ・ｿ<br>髯ｷ・ｿ繝ｻ・ｳ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ莉｣繝ｻ隴擾ｽｴ・朱豪・ｹ譏懶ｽｹ譁溽､ｼ・ｹ譎｢・ｽ・ｼ</div>`;
  html += `</div>`;

  // Zoom controls
  html += `<div class="rm-zoom-controls">`;
  html += `<button class="rm-zoom-btn" onclick="_relmapZoomIn()" title="髫ｲ・｡繝ｻ・｡髯樊ｻゑｽｽ・ｧ">郢晢ｽｻ郢晢ｽｻ/button>`;
  html += `<button class="rm-zoom-btn" onclick="_relmapZoomOut()" title="鬩搾ｽｵ繝ｻ・ｮ髯昴・繝ｻ>驕ｶ荳翫・/button>`;
  html += `<button class="rm-zoom-btn rm-zoom-fit" onclick="_relmapZoomFit()" title="驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・ｻ驛｢譏ｴ繝ｻ郢晢ｽｨ">驕ｶ阮吶・/button>`;
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
  html += `<div class="rm-ctx-item" id="rmCtxCenter"><span class="rm-ctx-icon">\uD83C\uDFAF</span>髣包ｽｳ繝ｻ・ｭ髯滂ｽ｢郢晢ｽｻ遶企ｦｴ蝮弱・・ｭ髯橸ｽｳ郢晢ｽｻ/div>`;
  html += `<div class="rm-ctx-item" id="rmCtxDetail"><span class="rm-ctx-icon">\uD83D\uDCCB</span>鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ驛｢・ｧ陞ｳ螟ｲ・ｽ・ｦ闕ｵ譎｢・ｽ繝ｻ/div>`;
  html += `<div class="rm-ctx-sep"></div>`;
  html += `<div class="rm-ctx-item" id="rmCtxCompare"><span class="rm-ctx-icon">\u2696</span>髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ遶企ｦｴ諱・・・ｽ髯ｷ莨夲ｽ｣・ｰ</div>`;
  html += `</div>`;

  // Compare popup overlay
  html += `<div class="rm-popup-overlay" id="relmapPopupOverlay"><div class="rm-popup-card" id="relmapPopupCard"></div></div>`;

  html += `</div>`; // end relmap-root

  return html;
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Face pattern helper 驕ｯ・ｶ郢晢ｽｻdefs驍ｵ・ｺ繝ｻ・ｫ<pattern>驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ鬯ｯ蛟｡蝮ｩ陋ｻ・､髯ｷ蜑・ｽｸ螂・ｽｽ蟶敖蜈ｷ・ｽ・ｻ鬯ｪ・ｭ繝ｻ・ｲ
// innerHTML驍ｵ・ｺ繝ｻ・ｧnodeLayer驛｢・ｧ陷ｻ莠･・ｶ讙趣ｽｸ・ｺ髢ｧ・ｴ鬩ｪ・､驍ｵ・ｺ陋ｹ・ｻ遯ｶ・ｻ驛｢・ｧ郢ｧ迚呎・髯ｷ蜑・ｽｸ蟯ｩﾂ・ｲ髯ｷﾂ陝雜｣・ｽ・ｪ繝ｻ・ｭ鬮ｴ雜｣・ｽ・ｼ驍ｵ・ｺ髴郁ｲｻ・ｽ讙趣ｽｸ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// _drawRelmapAfterRender 驕ｯ・ｶ郢晢ｽｻphysics sim + event listeners
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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

  // Apply visibility
  _relmapUpdateVisibility();

  // Draw org zones
  _relmapDrawOrgZones(orgCenters);

  // Render sidebar
  _relmapRenderSidebar(orgCenters);

  // Start animation
  _relmapOrgCenters = orgCenters;
  _relmapStartLoop();

  // 髫ｨ貂可髫ｨ貂可 Event listeners 髫ｨ貂可髫ｨ貂可
  _relmapSetupInteraction(svg, container);

  // Context menu items
  const ctxCenter = document.getElementById('rmCtxCenter');
  const ctxDetail = document.getElementById('rmCtxDetail');
  const ctxCompare = document.getElementById('rmCtxCompare');
  if (ctxCenter) ctxCenter.onclick = () => { if (_relmapCtxTarget) _relmapSetCenter(_relmapCtxTarget); _relmapHideCtxMenu(); };
  if (ctxDetail) ctxDetail.onclick = () => { if (_relmapCtxTarget) showFighterPopup(_relmapCtxTarget); _relmapHideCtxMenu(); };
  if (ctxCompare) ctxCompare.onclick = () => { if (_relmapCtxTarget) _relmapHandleCompareClick(_relmapCtxTarget); _relmapHideCtxMenu(); };

  // Popup overlay close
  const popOver = document.getElementById('relmapPopupOverlay');
  if (popOver) popOver.addEventListener('click', e => { if (e.target === e.currentTarget) _relmap閉じるPopup(); });

  // Show detail for initial center if set
  if (_relmapCenterId) _relmapShowDetailForNode(_relmapCenterId);
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Physics tick
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
function _relmapTick(orgCenters) {
  const W = _relmapW, H = _relmapH;
  const nodes = _relmapNodes, links = _relmapVisibleLinks, vel = _relmapVelocities;
  const a = Math.max(_relmapAlpha.value, _relmapAlpha.min);

  if (_relmapViewMode === 'network' || _relmapOrgFilter) {
    // Cluster gravity (centered when org filtered)
    nodes.forEach((n, i) => {
      if (n._hidden) return;
      const c = _relmapOrgFilter ? { x: W / 2, y: H / 2 } : (orgCenters[n.orgId] || { x: W / 2, y: H / 2 });
      vel[i].vx += (c.x - n.x) * 0.008 * a;
      vel[i].vy += (c.y - n.y) * 0.008 * a;
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
    // Light repulsion
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]._hidden) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j]._hidden) continue;
        const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 60) {
          const rf = (60 - dist) * 0.03 * a / dist;
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

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// SVG Render (innerHTML bulk update)
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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

  // 髫ｨ貂可髫ｨ貂可 Links 髫ｨ貂可髫ｨ貂可
  let lh = '';
  links.forEach(l => {
    const s = _relmapNodeMap[l.a], t = _relmapNodeMap[l.b];
    if (!s || !t || s._hidden || t._hidden) return;
    // Focus mode: only show links to/from center (reduce clutter) 驕ｯ・ｶ郢晢ｽｻexcept when org filter shows all intra-org links
    if (vm === 'focus' && focused && !_relmapOrgFilter && s.id !== focused && t.id !== focused) return;
    const dimmed = focused && vm === 'network' && focused !== s.id && focused !== t.id;
    const highlighted = focused && (focused === s.id || focused === t.id);
    if (!highlighted && l.strength < 0.15 && filter === 'all' && vm === 'network') return;
    if (filter === 'rivalry' && l.rivAB < 25 && l.rivBA < 25 && !l.rivalTitle) return;
    if (filter === 'bond' && Math.abs(l.bondAB - 50) < 10 && Math.abs(l.bondBA - 50) < 10) return;

    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist, uy = dy / dist, px = -uy * 4, py = ux * 4;
    const sp = s.r + 4, ep = t.r + 4;
    const baseOp = dimmed ? 0.04 : (highlighted || vm === 'focus' ? 1 : 0.6);

    // Bond A驕ｶ莨・ｼ・/ B驕ｶ雍具ｽｽ繝ｻ(skip when rivalry-only filter)
    if (filter !== 'rivalry') {
      const bAB = l.bondAB, cAB = bAB >= 50 ? `rgba(116,185,255,${0.2+(bAB-50)/100})` : `rgba(255,118,117,${0.2+(50-bAB)/100})`;
      const wAB = Math.min(1.9, 0.85 + Math.abs(bAB - 50) / 40);
      const mAB = bAB >= 50 ? 'url(#rm-arrow-warm)' : 'url(#rm-arrow-cold)';
      lh += `<line x1="${s.x+ux*sp+px}" y1="${s.y+uy*sp+py}" x2="${t.x-ux*ep+px}" y2="${t.y-uy*ep+py}" stroke="${cAB}" stroke-width="${wAB}" ${bAB<40?'stroke-dasharray="4,4"':''} opacity="${baseOp}" stroke-linecap="round" marker-end="${mAB}"/>`;
      const bBA = l.bondBA, cBA = bBA >= 50 ? `rgba(116,185,255,${0.2+(bBA-50)/100})` : `rgba(255,118,117,${0.2+(50-bBA)/100})`;
      const wBA = Math.min(1.9, 0.85 + Math.abs(bBA - 50) / 40);
      const mBA = bBA >= 50 ? 'url(#rm-arrow-warm)' : 'url(#rm-arrow-cold)';
      lh += `<line x1="${t.x-ux*sp-px}" y1="${t.y-uy*sp-py}" x2="${s.x+ux*ep-px}" y2="${s.y+uy*ep-py}" stroke="${cBA}" stroke-width="${wBA}" ${bBA<40?'stroke-dasharray="4,4"':''} opacity="${baseOp}" stroke-linecap="round" marker-end="${mBA}"/>`;
    }

    // Rivalry overlay (skip when bond-only filter)
    if (filter !== 'bond') {
      const mr = Math.max(l.rivAB, l.rivBA);
      if (mr > 20) {
        const ro = dimmed ? 0.02 : (highlighted || vm === 'focus' ? 0.6 : 0.25);
        const rivalryStroke = Math.min(highlighted || vm === 'focus' ? 3.0 : 2.4, 0.9 + mr / 28);
        lh += `<line class="rivalry-line" x1="${s.x+ux*sp}" y1="${s.y+uy*sp}" x2="${t.x-ux*ep}" y2="${t.y-uy*ep}" stroke="rgba(225,112,85,${ro})" stroke-width="${rivalryStroke}" stroke-dasharray="8,5" ${highlighted||vm==='focus'?'filter="url(#rm-glow-red)"':''}/>`;
        if (mr >= 50 && !dimmed) {
          const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
          lh += `<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="${mr>=70?18:13}" opacity="${highlighted||vm==='focus'?1:0.6}">\uD83D\uDD25</text>`;
        }
      }
    }
    // Rivalry title badge
    if (l.rivalTitle && !dimmed) {
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2 - 12;
      const tw = l.rivalTitle.length * 9 + 24;
      lh += `<rect x="${mx-tw/2}" y="${my-9}" width="${tw}" height="18" rx="3" fill="${l.titleColor}22" stroke="${l.titleColor}55" stroke-width="1"/>`;
      lh += `<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans JP,sans-serif" font-size="9" font-weight="700" fill="${l.titleColor}">${l.titleEmoji} ${l.rivalTitle}</text>`;
    }
    // One-sided icon
    if (l.isOneSided && !dimmed) {
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2 + 12;
      lh += `<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#fdcb6e" opacity="0.8">\u26A1</text>`;
    }
    // Filter-specific value labels
    if (!dimmed && (filter === 'bond' || filter === 'rivalry')) {
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      const ox = -uy * 12, oy = ux * 12; // perpendicular offset
      if (filter === 'bond') {
        const bABr = Math.round(l.bondAB), bBAr = Math.round(l.bondBA);
        const cABv = l.bondAB >= 50 ? '#74b9ff' : '#ff7675', cBAv = l.bondBA >= 50 ? '#74b9ff' : '#ff7675';
        lh += `<text x="${mx+ox}" y="${my+oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="600" fill="${cABv}" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="2.5" opacity="${baseOp}">${bABr}</text>`;
        lh += `<text x="${mx-ox}" y="${my-oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="600" fill="${cBAv}" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="2.5" opacity="${baseOp}">${bBAr}</text>`;
      } else {
        const maxRiv = Math.max(l.rivAB, l.rivBA);
        if (maxRiv >= 15) {
          lh += `<text x="${mx+ox}" y="${my+oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="600" fill="#e17055" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="2.5" opacity="${baseOp}">${Math.round(l.rivAB)}</text>`;
          lh += `<text x="${mx-ox}" y="${my-oy}" text-anchor="middle" dominant-baseline="central" font-family="Oswald,sans-serif" font-size="9" font-weight="600" fill="#e17055" paint-order="stroke" stroke="rgba(0,0,0,0.9)" stroke-width="2.5" opacity="${baseOp}">${Math.round(l.rivBA)}</text>`;
        }
      }
    }
  });
  linkLayer.innerHTML = lh;

  // 髫ｨ貂可髫ｨ貂可 Nodes 髫ｨ貂可髫ｨ貂可
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
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Org zone backgrounds
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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
  if (orgId === 'player') return G.orgName || '驛｢譎丞ｹｲ・取ｨ抵ｽｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ髯懈圜・ｽ・｣髣厄ｽｴ郢晢ｽｻ;
  if (orgId === 'fa') return '驛｢譎・ｽｼ驥・㏍・ｹ譎｢・ｽ・ｼ';
  const org = RIVAL_ORGS.find(o => o.id === orgId);
  return org ? (G.rivalOrgNames?.[orgId] || org.name) : orgId;
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Visibility control
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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
      visibleNodeIds.has(l.a) && visibleNodeIds.has(l.b) && _relmapLinkPassesFilter(l, _relmapFilter)
    );

    if (_relmapViewMode === 'focus' && _relmapCenterId && visibleNodeIds.has(_relmapCenterId)) {
      const visible = nodes.filter(n => !n._hidden);
      const cx = _relmapW / 2, cy = _relmapH / 2;
      _relmapFocusTargets = {};
      _relmapFocusTargets[_relmapCenterId] = { x: cx, y: cy };
      const others = visible.filter(n => n.id !== _relmapCenterId);
      const maxR = Math.min(_relmapW, _relmapH) * 0.35;
      others.forEach((n, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i / Math.max(1, others.length));
        _relmapFocusTargets[n.id] = { x: cx + Math.cos(angle) * maxR, y: cy + Math.sin(angle) * maxR };
      });
    }

    _relmapVisibleLinks = _relmapSelectRenderableLinks(candidateLinks, _RELMAP_FILTERED_LINK_BUDGET, _RELMAP_NETWORK_LINKS_PER_NODE + 1, _relmapCenterId);
    _relmapRebuildVisibleLinkState();
    return;
  }

  if (_relmapViewMode === 'focus' && _relmapCenterId) {
    const fl = _relmapGetLinksFor(_relmapCenterId)
      .filter(l => _relmapLinkPassesFilter(l, _relmapFilter));

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

    const shown = intensityLinks.slice(0, _RELMAP_FOCUS_MAX_CONN);
    const shownIds = new Set(shown.map(il => il.oid));
    shownIds.add(_relmapCenterId);
    nodes.forEach(n => { n._hidden = !shownIds.has(n.id); });

    const cx = _relmapW / 2, cy = _relmapH / 2;
    _relmapFocusTargets = {};
    _relmapFocusTargets[_relmapCenterId] = { x: cx, y: cy };
    const maxR = Math.min(_relmapW, _relmapH) * 0.40;
    const minR = maxR * 0.18;
    const topI = shown.length ? shown[0].intensity : 1;
    shown.forEach((il, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i / Math.max(1, shown.length));
      const norm = topI > 0 ? il.intensity / topI : 0;
      const dist = maxR - (maxR - minR) * norm;
      _relmapFocusTargets[il.oid] = { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
    });

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
    candidateLinks = links.filter(l => _relmapLinkPassesFilter(l, _relmapFilter));
    candidateLinks.forEach(l => { visibleNodeIds.add(l.a); visibleNodeIds.add(l.b); });
    nodes.forEach(n => { n._hidden = !visibleNodeIds.has(n.id); });
  } else if (_relmapFilter === 'bond') {
    const visibleNodeIds = new Set();
    candidateLinks = links.filter(l => _relmapLinkPassesFilter(l, _relmapFilter));
    candidateLinks.forEach(l => { visibleNodeIds.add(l.a); visibleNodeIds.add(l.b); });
    nodes.forEach(n => { n._hidden = !visibleNodeIds.has(n.id); });
  } else if (_relmapFilterRelOnly) {
    const visibleNodeIds = new Set();
    candidateLinks = links.filter(l => l.strength >= _relmapFilterThreshold / 100);
    candidateLinks.forEach(l => { visibleNodeIds.add(l.a); visibleNodeIds.add(l.b); });
    nodes.forEach(n => { n._hidden = !visibleNodeIds.has(n.id); });
  } else {
    nodes.forEach(n => { n._hidden = false; });
    candidateLinks = links.filter(l => _relmapLinkPassesFilter(l, _relmapFilter));
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
  // 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ蜥擾ｽｹ譎｢・ｽ・｢驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ邵ｲ螳壽綜繝ｻ・｣髣厄ｽｴ髦ｮ蜷ｶﾎｨ驛｢・ｧ繝ｻ・｣驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ髣包ｽｳ繝ｻ・ｭ: 髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ髦ｮ蜷ｮ繝ｻ髫ｰ魃会ｽｽ・ｻ驛｢・ｧ闕ｵ譏ｴ繝ｻ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｳ
  if (_relmapViewMode === 'power' && _relmapOrgFilter) {
    h += `<div class="rm-sb-btn rm-sb-back" onclick="_relmapFocusOrg('${_relmapOrgFilter}')" style="border:1px solid rgba(212,168,67,0.5);color:#d4a843;font-weight:bold;margin-bottom:8px">\u2190 髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ髦ｮ蜷ｮ繝ｻ髫ｰ魃会ｽｽ・ｻ驛｢・ｧ郢晢ｽｻ/div>`;
  }
  // Reset button
  h += `<div class="rm-sb-btn" onclick="_relmapResetAll()">\uD83D\uDD04 髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ髦ｮ蜻ｻ・ｽ蟶晏距繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ</div>`;
  // Display filter panel
  h += `<div class="rm-filter-panel">`;
  h += `<div class="rm-fp-title">\uD83D\uDCCA 鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驛｢譎・ｽｼ譁絶襖驛｢譎｢・ｽ・ｫ驛｢・ｧ繝ｻ・ｿ</div>`;
  h += `<div class="rm-fp-row"><label><input type="checkbox" id="rmChkRelOnly" ${_relmapFilterRelOnly?'checked':''} onchange="_relmapFilterRelOnly=this.checked;_relmapFilterUserSet=true;_relmapUpdateVisibility();_relmapReheat()"> 鬯ｮ・｢繝ｻ・｢髣厄ｽｫ郢ｧ繝ｻ譌ｺ驛｢・ｧ驗呻ｽｫ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｿ</label></div>`;
  h += `<div class="rm-fp-row"><span style="font-size:10px">髯滓汚・ｽ・ｷ髯溯ｶ｣・ｽ・ｦ</span><input type="range" min="0" max="40" value="${_relmapFilterThreshold}" oninput="_relmapFilterThreshold=parseInt(this.value);_relmapFilterUserSet=true;document.getElementById('rmThreshVal').textContent=this.value;_relmapUpdateVisibility();_relmapReheat()"><span class="rm-fp-val" id="rmThreshVal">${_relmapFilterThreshold}</span></div>`;
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
    h += `<div class="rm-org-card-stats">髫ｰ繝ｻﾂ髯橸ｽｻ郢晢ｽｻ${oc.length}髯ｷ・ｷ郢晢ｽｻ\u2500 髯晢ｽｷ繝ｻ・ｳ髯懶ｽｮ遶ｭ・ｯVR ${avg}</div>`;
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

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Interaction (drag, click, context menu, tooltip)
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
function _relmapSetupInteraction(svg, container) {
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
      // Empty space drag 驕ｶ鄙ｫ繝ｻpan
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
        const key = _relmapOrgFilter && _relmapOrgFilter !== 'fa' ? _relmapOrgFilter : '__overview__';
        _relmapSetPowerPos(_relmapDragTarget, key, nextX, nextY);
        _relmapRenderPowerView();
      } else {
        _relmapDragTarget.x = nextX;
        _relmapDragTarget.y = nextY;
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
      tt.innerHTML = `<div style="font-weight:700;margin-bottom:3px">${n.name}</div><div style="color:${n.color};font-size:10px;margin-bottom:3px">${emoji} ${orgName}</div><div style="font-family:Oswald;font-size:13px;color:var(--gold)">OVR ${n.ovr} <span style="font-size:10px;color:var(--text-dim);margin-left:4px">${n.style}</span></div><div style="font-size:9px;color:var(--text-dim);margin-top:3px">鬯ｮ・｢繝ｻ・｢髣厄ｽｫ郢晢ｽｻ${cl.length}髣比ｼ夲ｽｽ・ｶ${rv.length?` / 驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢譎√・・弱・${rv.length}髣比ｼ夲ｽｽ・ｶ`:''}</div>`;
      tt.classList.add('show'); tt.style.left = (e.clientX + 16) + 'px'; tt.style.top = (e.clientY - 10) + 'px';
    } else if (tt && !_relmapDragTarget) { tt.classList.remove('show'); }
  });

  svg.addEventListener('mouseup', () => {
    if (_relmapDragTarget) { _relmapDragTarget._dragging = false; _relmapDragTarget = null; }
    _relmapPanning = false;
  });

  // Click: close compare popup + set center (or open popup in power mode)
  svg.addEventListener('click', e => {
    if (_relmapDragMoved) { _relmapDragMoved = false; return; }
    _relmapHideCtxMenu();
    // 閉じる compare popup if open
    const popOver = document.getElementById('relmapPopupOverlay');
    if (popOver && popOver.classList.contains('show')) { _relmap閉じるPopup(); return; }
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { _relmap閉じるPopup(); _relmapHideCtxMenu(); } });
}

function _relmapHideCtxMenu() {
  const cm = document.getElementById('relmapCtxMenu');
  if (cm) cm.classList.remove('show');
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// View mode / center / filter controls
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ

// 髮手ｶ｣・ｽ・ｺ髯橸ｽｳ陞溷･・ｽｽ・ｫ闕ｵ貅ｷ鬟ｭ驛｢・ｧ繝ｻ・ｸ驛｢譏ｴ繝ｻ邵ｺ・｡驛｢譎｢・ｽ・ｼ鬨ｾ蛹・ｽｽ・ｨKnuth髣包ｽｵ驕会ｽｼ繝ｻ・ｮ陷会ｽｱ郢晢ｽｯ驛｢譏ｴ繝ｻ邵ｺ蜥擾ｽｹ譎｢・ｽ・･郢晢ｽｻ闔・･鬩溽｢大初・つID驍ｵ・ｺ繝ｻ・ｧ髯晢ｽｶ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｫ髯ｷ・ｷ陟募具ｽｧ0.0~1.0驛｢・ｧ陞ｳ螟ｲ・ｽ・ｿ隴∫ｵｶ繝ｻ郢晢ｽｻ郢晢ｽｻ
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
  const key = _relmapOrgFilter && _relmapOrgFilter !== 'fa' ? _relmapOrgFilter : '__overview__';
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

// 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ繝ｻviewMode 驕ｯ・ｶ郢晢ｽｻ髫ｰ・ｨ繝ｻ・｣髯晢ｽｶ郢晢ｽｻ隴ｴ蟷・ｽｫ・ｫ闕ｳ・ｻ繝ｻ・ｱ繝ｻ・､SVG
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
function _drawRelmapPowerView(svg) {
  const W = _relmapW, H = _relmapH;
  if (!W || !H) return;
  // 驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢譎擾ｽｳ・ｨ郢晢ｽｰ驛｢譎｢・ｽ・ｼ髯晢ｽｷ郢晢ｽｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｪ驛｢譎・ｽｼ譁絶落驛｢譏ｴ繝ｻ郢晢ｽｨ郢晢ｽｻ陋ｹ・ｻ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢譎擾ｽｳ・ｨ郢晢ｽｰ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｯ髯晢ｽｾ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｫ髯懈圜・ｽ・ｺ髯橸ｽｳ郢晢ｽｻ00px郢晢ｽｻ郢晢ｽｻ
  const sidebar = document.querySelector('.rm-sidebar, .relmap-sidebar');
  const sidebarW = sidebar ? sidebar.offsetWidth : 200;
  _buildOrgColumnSvgContent(svg, W, H, sidebarW);
}

// 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ繝ｻ髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ隶鯉ｽ｢繝ｻ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ 驕ｯ・ｶ郢晢ｽｻ髫ｰ・ｨ繝ｻ・｣髯晢ｽｶ郢晢ｽｻ隴ｴ蟶ｷ・ｹ譎｢・ｽ・ｬ驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・ｦ驛｢譏ｴ繝ｻ
// 驛｢譎｢・ｽ・ｻ4髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜻ｻ・ｽ繝ｻ繝ｻ繝ｻ繝ｻ驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｫ鬯ｩ貅ｷ隱ｿ繝ｻ・ｽ繝ｻ・ｮ郢晢ｽｻ陋ｹ・ｻ・主ｸｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ鬯ｯ繝ｻ繝ｻ繝ｻ・ｼ郢晢ｽｻ
// 驛｢譎｢・ｽ・ｻ驛｢譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎擾ｽｳ・ｨ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ = OVR髮主沺・ｯ雋ｻ・ｽ・ｾ陷茨ｽｷ繝ｻ・ｼ闔・･繝ｻ・ｼ繝ｻ・ｷ驍ｵ・ｺ郢晢ｽｻ髯樊ｻゑｽｽ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ讒ｭ繝ｻ郢晢ｽｻ
// 驛｢譎｢・ｽ・ｻID驛｢譏懶ｽｸ鄙ｫﾎ暮Δ・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・･驍ｵ・ｺ繝ｻ・ｧ鬮｢・ｾ繝ｻ・ｪ髴取ｻゑｽｽ・ｶ驍ｵ・ｺ繝ｻ・ｪ髫ｰ・ｨ繝ｻ・｣驛｢・ｧ陝ｲ・ｨ郢晢ｽｻ驛｢・ｧ郢晢ｽｻ+ 鬮ｯ・ｦ隴惹ｼ夲ｽｽ・ｪ遶乗剌・ｱ鬥ｴ・ｩ蛹・ｽｽ・ｿ
// 驛｢譎｢・ｽ・ｻorg filter髫ｴ蟶ｷ逕･隴滄｡鯉ｽｭ蠑ｱ繝ｻ= 髯ｷ髮・繝ｻ・ｽ・ｽ霓｣莨懶ｽｱ・ｮ髣厄ｽｴ髦ｮ蜷ｶﾎｦ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｫ髯具ｽｻ郢晢ｽｻ陝繝ｻ
function _buildOrgColumnSvgContent(svg, W, H, leftOffset) {
  leftOffset = leftOffset || 0;
  const drawW = W - leftOffset;
  const layoutKey = '__overview__';

  // 髯ｷ髮・繝ｻ・ｽ・ｽ霓｣莨懶ｽｱ・ｮ髣厄ｽｴ髦ｮ蜷ｶﾎｦ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ郢晢ｽｻ郢晢ｽｻrgFilter髫ｴ蟶ｷ逕･隴滄｡鯉ｽｭ蠑ｱ・代・・ｼ郢晢ｽｻ
  if (_relmapOrgFilter && _relmapOrgFilter !== 'fa') {
    _buildOrgHorizontalView(svg, W, H, leftOffset);
    return;
  }

  // 髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜴･諛・ｽｹ・ｧ繝ｻ・ｹ驛｢譎∬か繝ｻ・ｼ陋ｹ・ｻ・主ｸｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ鬯ｯ繝ｻ繝ｻ繝ｻ・ｼ郢晢ｽｻ
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

  const champId = G.titles && G.titles.world ? G.titles.world.championId : null;
  const RANK_EMOJIS = ['・滓ｩｸ・ｽ・･郢晢ｽｻ, '・滓ｩｸ・ｽ・･郢晢ｽｻ, '・滓ｩｸ・ｽ・･郢晢ｽｻ, '4郢晢ｽｻ鬮ｷ菴ｩ繝ｻ];

  // OVR驛｢譎｢・ｽ・ｬ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｸ郢晢ｽｻ闔・･郢晢ｽｻ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ繝ｻ繝ｻ・ｼ郢晢ｽｻ
  const allFighters = orgList.flatMap(org => org.roster);
  const allOVRs = allFighters.map(f => Engine.util.ov(f));
  const globalOVRMin = allOVRs.length ? Math.min(...allOVRs) : 50;
  const globalOVRMax = allOVRs.length ? Math.max(...allOVRs) : 90;
  const globalOVRRange = Math.max(1, globalOVRMax - globalOVRMin);

  // OVR髮主沺・ｯ雋ｻ・ｽ・ｾ闕ｵ譏ｴﾎ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ
  const R_MIN = 10, R_MAX = 30;

  // 髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｶ笙驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢髣包ｽｳ繝ｻ・ｭ髯滂ｽ｢郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ繝ｻ繝ｻ繝ｻ驛｢・ｧ繝ｻ・ｰ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ郢晢ｽｩ驍ｵ・ｲ遶丞｢・ｸｷ・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ鬯ｯ繝ｻ繝ｻ 髣包ｽｳ鬯・汚・ｽ・ｮ繝ｻ・ｵ驕ｶ髮∝ｮｴ繝ｻ・ｸ陋ｹ・ｺ繝ｻ・ｮ繝ｻ・ｵ驍ｵ・ｲ遶乗劼・ｽ・ｷ繝ｻ・ｦ驕ｶ鬘假ｽｲ讓贋ｾ｡髣費｣ｰ繝ｻ・､髣費｣ｰ隰夲ｽｵ繝ｻ・ｼ郢晢ｽｻ
  const HEADER_H = 16;
  const areaPositions = [
    { cx: 0.28, cy: 0.24 },
    { cx: 0.73, cy: 0.27 },
    { cx: 0.27, cy: 0.74 },
    { cx: 0.72, cy: 0.71 },
  ];
  const areaRadiusX = drawW * 0.23;
  const areaRadiusY = H * 0.23;

  // Pass 1: 髯ｷ・ｷ郢晢ｽｻ遶城メ・ｬ繝ｻ・ｹ譏ｴ繝ｻ髯具ｽｻ隴弱・・・蘭・ｴ陷･・ｲ繝ｻ・ｽ繝ｻ・ｮ驛｢・ｧ陞ｳ螟ｲ・ｽ・ｨ髢ｧ・ｲ繝ｻ・ｮ郢晢ｽｻ
  const allNodes = [];
  const fighterOrgMap = {};

  orgList.forEach((org, ci) => {
    const areaPos = areaPositions[ci] || areaPositions[0];
    const areaCX = leftOffset + drawW * areaPos.cx;
    const areaCY = HEADER_H + (H - HEADER_H) * areaPos.cy;
    const sorted = [...org.roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
    const n = sorted.length;

    sorted.forEach((f, rank) => {
      const ovr = Engine.util.ov(f);
      const ovrNorm = globalOVRRange > 0 ? (ovr - globalOVRMin) / globalOVRRange : 0.5;
      const r = R_MIN + ovrNorm * (R_MAX - R_MIN);
      const hash = _relmapIdHash(f.id);
      const hash2 = _relmapIdHash(f.id + 9999);
      const hash3 = _relmapIdHash(f.id * 17 + org.rank * 101);
      const rankNorm = n > 1 ? rank / (n - 1) : 0;
      const angle = (-Math.PI * 0.58)
        + rankNorm * Math.PI * (1.18 + hash2 * 0.2)
        + (hash - 0.5) * 0.6;
      const radial = 0.18 + rankNorm * 0.82;
      const spread = _relmapPolarOffset(areaRadiusX, areaRadiusY, angle, radial);
      const xOff = spread.x + (hash2 - 0.5) * areaRadiusX * 0.28;
      const yBase = (1 - ovrNorm) * areaRadiusY * 1.32 - areaRadiusY * 0.52;
      const yOff = yBase + spread.y * 0.42 + (hash3 - 0.5) * areaRadiusY * 0.18;
      const aceLift = rank === 0 ? areaRadiusY * 0.18 : rank < 3 ? areaRadiusY * 0.08 : 0;
      const homeX = areaCX + xOff;
      const homeY = areaCY + yOff - aceLift;
      const mapNode = _relmapNodeMap[f.id];
      const savedPos = _relmapGetPowerPos(mapNode, layoutKey, homeX, homeY);

      allNodes.push({
        id: f.id, fighter: f, orgId: org.id, orgColor: org.color,
        orgName: org.name, orgRank: org.rank, inOrgRank: rank,
        x: savedPos.x, y: savedPos.y,
        r, ovr, isChamp: !!champId && f.id === champId,
        isAce: rank === 0, isTop3: rank < 3,
        homeX, homeY,
      });
      fighterOrgMap[f.id] = org.id;
    });
  });

  // Pass 2: 鬮ｯ・ｦ隴惹ｼ夲ｽｽ・ｪ遶乗剌・ｱ鬥ｴ・ｩ蛹・ｽｽ・ｿ郢晢ｽｻ郢晢ｽｻ驛｢譏懶ｽｻ・｣邵ｺ蟶ｷ・ｸ・ｲ遶擾ｽｵ繝ｻ・ｰ繝ｻ・ｴ髯晢ｽｷ繝ｻ・ｳ髯ｷ繝ｻ・ｽ・ｪ髯ｷ驛∬か繝ｻ・ｼ郢晢ｽｻ
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const a = allNodes[i], b = allNodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 4;
        if (dist < minDist && dist > 0.01) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          a.x -= nx * push * 0.9; a.y -= ny * push * 0.45;
          b.x += nx * push * 0.9; b.y += ny * push * 0.45;
        }
      }
    }
  }

  // 髯溘・繝ｻ鬮ｦ諛・ｽｹ・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢譏ｴ繝ｻ
  allNodes.forEach(n => {
    n.x = Math.max(leftOffset + n.r + 2, Math.min(W - n.r - 2, n.x));
    n.y = Math.max(HEADER_H + n.r + 2, Math.min(H - n.r - 16, n.y));
    _relmapSetPowerPos(_relmapNodeMap[n.id], layoutKey, n.x, n.y);
  });

  // Pass 3: SVG髫ｴ竏壹・繝ｻ・ｭ隲､諛翫・驛｢・ｧ郢晢ｽｻ髯橸ｽｻ繝ｻ・､驍ｵ・ｺ繝ｻ・ｧ髫ｶ蝣､霍昴・・ｯ闔ｨ螟ｲ・ｽ・ｼ陋ｹ・ｻ・主ｸｷ・ｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驕ｶ髮・ｽｮ螢ｹﾎ樣垓雜｣・ｽ・ｯ驕ｶ髮√・郢晢ｽｮ驛｢譎｢・ｽ・ｼ驛｢譏懶ｽｼ螟ｲ・ｽ・ｼ郢晢ｽｻ
  let defsSvg = '<defs>';
  let linesSvg = '', bgSvg = '', nodeSvg = '';

  // 髫ｨ貂可髫ｨ貂可 髯橸ｽｻ繝ｻ・､1: 髯懈圜・ｽ・｣髣厄ｽｴ鬯･・ｴ闖ｫ・｣髯懈圜・｣・ｰ鬩搾ｽｵ遶丞｣ｹ・樣Δ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｯ 髫ｨ貂可髫ｨ貂可
  if (G.relationships) {
    const crossPairs = new Set();
    Object.keys(G.relationships).forEach(key => {
      const sep = key.indexOf('>');
      if (sep < 0) return;
      const aId = key.slice(0, sep), bId = key.slice(sep + 1);
      const orgA = fighterOrgMap[aId], orgB = fighterOrgMap[bId];
      if (!orgA || !orgB || orgA === orgB) return;
      const pairKey = aId < bId ? `${aId}>${bId}` : `${bId}>${aId}`;
      if (crossPairs.has(pairKey)) return;
      crossPairs.add(pairKey);
      const rivAB = (G.relationships[key] || {}).rivalry || 0;
      const rivBA = (G.relationships[`${bId}>${aId}`] || {}).rivalry || 0;
      const maxRiv = Math.max(rivAB, rivBA);
      if (maxRiv < 22) return;
      const posA = allNodes.find(n => n.id == aId);
      const posB = allNodes.find(n => n.id == bId);
      if (!posA || !posB) return;
      const opacity = Math.min(0.55, 0.1 + maxRiv / 130);
      const sw = Math.min(2.5, 0.5 + maxRiv / 55);
      const mx = (posA.x + posB.x) / 2;
      const my = Math.min(posA.y, posB.y) - Math.abs(posA.x - posB.x) * 0.15 - 20;
      linesSvg += `<path d="M${posA.x.toFixed(1)},${posA.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${posB.x.toFixed(1)},${posB.y.toFixed(1)}" fill="none" stroke="#e67e22" stroke-width="${sw.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}" stroke-dasharray="5,3"/>`;
    });
  }

  // 髫ｨ貂可髫ｨ貂可 髯橸ｽｻ繝ｻ・､2: 髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｶ笙驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢鬮｢・ｭ隴ｴ・ｧ陷搾ｽｹ + 驛｢譎｢・ｽ・ｩ驛｢譎冗函・弱・髫ｨ貂可髫ｨ貂可
  // 髯ｷ・ｷ郢晢ｽｻ陞ｻ・ｮ髣厄ｽｴ髦ｮ蜷ｶ繝ｻ髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ・ｶ隹ｺ・ｰ髫ｰ・ｨ繝ｻ・ｰ驛｢・ｧ陜｣・､繝ｻ・ｮ隲､諛翫・郢晢ｽｻ闔蛹・ｽｽ・ｺ繝ｻ・ｺ髫ｰ・ｨ繝ｻ・ｰ+髯晢ｽｷ繝ｻ・ｳ髯懶ｽｮ遶ｭ・ｯVR郢晢ｽｻ闖ｫ繝ｻ繝ｻ鬮｢・ｭ隴ｴ・ｧ陷搾ｽｹ髯ｷﾂ郢晢ｽｻ郢晢ｽｻ髯樊ｻゑｽｽ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ繝ｻ・ｸ・ｺ繝ｻ・ｫ髯ｷ・ｿ髢ｧ・ｴ闕ｳ繝ｻ
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
    const rankEmoji = RANK_EMOJIS[org.rank - 1] || `${org.rank}髣厄ｽｴ雋ゑｽｯ;
    // 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ・ｶ繝ｻ・ｯ雎郁ｲｻ・ｽ・ｾ闕ｵ譏ｴ繝ｻ鬮｢・ｭ隴ｴ・ｧ陷搾ｽｹ髯ｷﾂ郢晢ｽｻ繝ｻ・ｼ闔・･繝ｻ・ｼ繝ｻ・ｱ驍ｵ・ｺ郢晢ｽｻ陞ｻ・ｮ髣厄ｽｴ髦ｮ蜷ｶ繝ｻ髯昴・・ｸ螂・ｽｼ繝ｻ・ｸ・ｺ闕ｳ迺ｰﾂ遶乗劼・ｽ・ｼ繝ｻ・ｷ驍ｵ・ｺ郢晢ｽｻ陞ｻ・ｮ髣厄ｽｴ髦ｮ蜷ｶ繝ｻ髯樊ｻゑｽｽ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ・･郢晢ｽｻ郢晢ｽｻ
    const strengthNorm = orgStrengths[ci] / maxStrength; // 0~1
    const bgR = baseAreaR * (0.5 + strengthNorm * 0.7); // 50%~120%
    bgSvg += `<circle cx="${areaCX.toFixed(1)}" cy="${areaCY.toFixed(1)}" r="${bgR.toFixed(1)}" fill="${org.color}" fill-opacity="${(0.02 + strengthNorm * 0.04).toFixed(3)}"/>`;
    // 髯懈圜・ｽ・｣髣厄ｽｴ霓｣蛟ｬ蛟ｹ驛｢譎｢・ｽ・ｩ驛｢譎冗函・取亢繝ｻ陋ｹ・ｻ邵ｺ鬘費ｽｹ譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・｢髣包ｽｳ闔ｨ竏・｣ｹ繝ｻ郢晢ｽｻ
    const labelY = areaCY - areaRadiusY - 8;
    bgSvg += `<text x="${areaCX.toFixed(1)}" y="${Math.max(14, labelY).toFixed(1)}" text-anchor="middle" font-size="13" font-family="sans-serif">${rankEmoji}</text>`;
    const dispName = org.name.length > 9 ? org.name.slice(0, 8) + '...' : org.name;
    bgSvg += `<text x="${areaCX.toFixed(1)}" y="${Math.max(28, labelY + 14).toFixed(1)}" text-anchor="middle" fill="${org.color}" font-size="11" font-weight="bold" font-family="sans-serif" stroke="rgba(0,0,0,0.55)" stroke-width="2.5" paint-order="stroke">${dispName}</text>`;
    bgSvg += `<text x="${areaCX.toFixed(1)}" y="${Math.max(40, labelY + 26).toFixed(1)}" text-anchor="middle" fill="${org.color}" font-size="9" fill-opacity="0.45" font-family="sans-serif">${n}髯ｷ・ｷ隶朱対帝ｩ債郢晢ｽｻ/text>`;
  });

  // 髫ｨ貂可髫ｨ貂可 髯橸ｽｻ繝ｻ・､3: 鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｴﾎ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ髫ｨ貂可髫ｨ貂可
  // OVR髫ｴ荳翫・繝ｻ・ｰ郢晢ｽｻ邵ｲ螳夲ｽｬ・ｰ陷諤懈・郢晢ｽｻ闔・･繝ｻ・､繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ讓抵ｽｹ譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎擾ｽｳ・ｨ遯ｶ・ｲ髣包ｽｳ驗呻ｽｫ遶頑･｢・ｭ螟ｲ・ｽ・･驛｢・ｧ闕ｵ譎｢・ｽ閧ｲ・ｸ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
  const drawOrder = [...allNodes].sort((a, b) => a.ovr - b.ovr);
  drawOrder.forEach(node => {
    const { x, y, r, ovr, orgColor, isChamp, isAce, isTop3, fighter: f, inOrgRank } = node;
    const strokeColor = isChamp ? '#d4a843' : orgColor;
    const sw = isChamp ? 2.5 : isAce ? 2.2 : 1.3;
    const pUrl = getPortraitUrl(f.id);

    nodeSvg += `<g class="rm-node-group" data-id="${f.id}" style="cursor:pointer">`;

    // 驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｩ郢晢ｽｻ闔・･繝ｻ・､繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ・･髯滓汚・ｽ・ｷ鬮ｫ・ｱ繝ｻ・ｿ郢晢ｽｻ郢晢ｽｻ
    if (isAce) {
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 7).toFixed(1)}" fill="${orgColor}" fill-opacity="0.15"/>`;
    }
    // 鬩阪・莠具ｾつ郢晢ｽｻ・取㏍・ｹ譎｢・ｽ・ｳ驛｢・ｧ繝ｻ・ｰ + 鬩阪・蜚ｱ郢晢ｽｻ
    if (isChamp) {
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}" fill="none" stroke="#d4a843" stroke-width="2" stroke-opacity="0.85"/>`;
      nodeSvg += `<text x="${x.toFixed(1)}" y="${(y - r - 5).toFixed(1)}" text-anchor="middle" font-size="${Math.max(11, r * 0.5).toFixed(0)}" font-family="sans-serif">・滓ｫ∬・</text>`;
    }

    // 鬯ｯ菫ｶ魍堤ｸｺ繝ｻ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ or 髯懶ｽｪ陷会ｽｱ繝ｻ鬘俶咏ｹ晢ｽｻ
    if (pUrl) {
      const patternId = `pmap-face-${f.id}`;
      defsSvg += _relmapBuildInlineFacePattern(patternId, pUrl);
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${patternId})" stroke="${strokeColor}" stroke-width="${sw}"/>`;
    } else {
      const fillOp = isAce ? 0.45 : isTop3 ? 0.28 : 0.18;
      nodeSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${orgColor}" fill-opacity="${fillOp}" stroke="${strokeColor}" stroke-width="${sw}"/>`;
      nodeSvg += `<text x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="${Math.min(12, r * 0.7).toFixed(1)}" font-weight="bold" font-family="sans-serif">${ovr}</text>`;
    }

    // OVR驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｸ
    const badgeW = Math.max(22, r * 0.9);
    const badgeH = Math.max(12, r * 0.45);
    const badgeY = y + r + 6;
    nodeSvg += `<rect x="${(x - badgeW / 2).toFixed(1)}" y="${(badgeY - badgeH / 2).toFixed(1)}" width="${badgeW.toFixed(1)}" height="${badgeH.toFixed(1)}" rx="3" fill="rgba(10,10,20,0.85)" stroke="rgba(255,255,255,${isTop3 ? '0.65' : '0.4'})" stroke-width="1"/>`;
    nodeSvg += `<text x="${x.toFixed(1)}" y="${(badgeY + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="${Math.max(8, r * 0.32).toFixed(1)}" font-weight="bold" font-family="sans-serif">${ovr}</text>`;

    // 髯ｷ・ｷ隶朱｡披・驛｢譎｢・ｽ・ｩ驛｢譎冗函・取亢繝ｻ闔蛹・ｽｽ・ｸ髮榊・・ｽ・ｽ郢晢ｽｻ髯ｷ・ｷ郢晢ｽｻor 驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｼ髯昴・・ｻ・｣遶企・・ｸ・ｺ郢晢ｽｻ遶雁､・ｸ・ｺ隶守ｿｫ繝ｻ髯ｷ・ｩ繝ｻ・｡郢晢ｽｻ郢晢ｽｻ
    if (inOrgRank < 5 || node.r >= 18) {
      const name = (f.name || '').slice(0, 6);
      const fs = isAce ? 10.5 : isTop3 ? 10 : 9;
      nodeSvg += `<text x="${x.toFixed(1)}" y="${(badgeY + badgeH / 2 + 11).toFixed(1)}" text-anchor="middle" fill="#e8e8e8" font-size="${fs}" font-family="sans-serif" stroke="rgba(0,0,0,0.88)" stroke-width="3" paint-order="stroke">${name}</text>`;
    }

    nodeSvg += `</g>`;
  });

  bgSvg += `<text x="${(leftOffset + drawW / 2).toFixed(1)}" y="${(H - 3).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.18)" font-size="9.5" font-family="sans-serif">驕ｶ鄙ｫ繝ｻ髯滓汚・ｽ・ｷ驍ｵ・ｺ郢晢ｽｻ 髫ｨ・ｳ郢晢ｽｻ驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ=OVR  髫ｨ貂可髫ｨ貂可 髯懈圜・｣・ｰ鬩搾ｽｵ郢晢ｽｻ / 驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ驢搾ｽｸ・ｺ繝ｻ・ｧ鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ / 驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢譎擾ｽｳ・ｨ郢晢ｽｰ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｧ髯懈圜・ｽ・｣髣厄ｽｴ隶鯉ｽ｢繝ｻ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ</text>`;

  defsSvg += '</defs>';
  svg.innerHTML = defsSvg + linesSvg + bgSvg + nodeSvg;
}

// 髯ｷ髮・繝ｻ・ｽ・ｽ霓｣莨懶ｽｱ・ｮ髣厄ｽｴ髦ｮ蜷ｶﾎｦ驛｢譎｢・ｽ・･驛｢譎｢・ｽ・ｼ 驕ｯ・ｶ郢晢ｽｻ髫ｴ蟶ｷ蛻､繝ｻ・ｩ雋・ｽｽ陜趣ｽｪ髫ｰ・ｨ繝ｻ・｣髯晢ｽｶ郢晢ｽｻ隴ｴ繝ｻ
// 驛｢譎｢・ｽ・ｻY鬮ｴ繝ｻ・ｽ・ｸ = OVR郢晢ｽｻ騾趣ｽｯ繝ｻ・ｫ隶鯉ｽｼVR=髣包ｽｳ驗呻ｽｫ・つ遶擾ｽｽ繝ｻ・ｽ闕ｳ魏ｻR=髣包ｽｳ陷茨ｽｷ繝ｻ・ｼ郢晢ｽｻ
// 驛｢譎｢・ｽ・ｻX鬮ｴ繝ｻ・ｽ・ｸ = ID驛｢譏懶ｽｸ鄙ｫﾎ暮Δ・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・･驍ｵ・ｺ繝ｻ・ｧ鬮｢・ｾ繝ｻ・ｪ髴取ｻゑｽｽ・ｶ驍ｵ・ｺ繝ｻ・ｫ髫ｰ・ｨ繝ｻ・｣驛｢・ｧ陝ｲ・ｨ隨倥・+ 鬮ｯ・ｦ隴惹ｼ夲ｽｽ・ｪ遶乗剌・ｱ鬥ｴ・ｩ蛹・ｽｽ・ｿ
// 驛｢譎｢・ｽ・ｻ驛｢譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎擾ｽｳ・ｨ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ = OVR髮主沺・ｯ雋ｻ・ｽ・ｾ陷茨ｽｷ繝ｻ・ｼ郢晢ｽｻ_MIN=12, R_MAX=35郢晢ｽｻ郢晢ｽｻ
// 驛｢譎｢・ｽ・ｻ髯ｷ闌ｨ・ｽ・ｨ髯ｷ・ｩ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｫ髯ｷ・ｷ隶朱｡披・驛｢譎｢・ｽ・ｩ驛｢譎冗函・取辨蜍励・・ｨ鬩穂ｼ夲ｽｽ・ｺ
function _buildOrgHorizontalView(svg, W, H, leftOffset) {
  const orgId = _relmapOrgFilter;
  const isPlayer = orgId === 'player';
  const aiData = !isPlayer ? ((G.aiOrgs || {})[orgId] || {}) : {};
  const rawRoster = isPlayer
    ? (G.roster || []).filter(c => !c.isRental)
    : (aiData.roster || []);
  const roster = _relmapDedupPowerRoster(rawRoster);
  const sorted = [...roster].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const n = sorted.length;
  const drawW = W - leftOffset;

  if (!n) {
    svg.innerHTML = `<text x="${(leftOffset + drawW / 2).toFixed(1)}" y="${(H / 2).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="14" font-family="sans-serif">鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譏ｶ繝ｻ驍ｵ・ｺ郢晢ｽｻ/text>`;
    return;
  }

  const color = _RELMAP_ORG_COLORS[orgId] || '#888';
  const orgName = _relmapGetOrgNameById(orgId);
  const champId = G.titles && G.titles.world ? G.titles.world.championId : null;

  const HEADER_H = 40;
  const PAD_TOP = HEADER_H + 20;
  const PAD_BOTTOM = 28;
  const PAD_X = 52;
  const contentH = H - PAD_TOP - PAD_BOTTOM;
  const usableW = drawW - PAD_X * 2;

  // OVR髮主沺・ｯ雋ｻ・ｽ・ｾ闕ｵ譏ｴﾎ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ邵ｺ遉ｼ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ郢晢ｽｻ陋ｹ・ｻ郢晢ｽｩ驛｢譎｢・ｽ・ｩ驛｢譎・ｽｧ・ｭ郢晢ｽ｡驛｢譏ｴ繝ｻ邵ｺ驢搾ｽｸ・ｺ繝ｻ・ｫ郢晢ｽｻ陞｢・ｽ隲､蜻ｵ・ｰ謇假ｽｽ・ｷ=驍ｵ・ｺ闕ｵ譏ｶ繝ｻ驛｢・ｧ鬮ｮ繝ｻ・ｽ・､繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ讒ｭ繝ｻ郢晢ｽｻ
  const R_MIN = 12, R_MAX = 45;
  const ovrs = sorted.map(f => Engine.util.ov(f));
  const ovrMin = Math.min(...ovrs), ovrMax = Math.max(...ovrs);
  const ovrRange = Math.max(1, ovrMax - ovrMin);

  // 髯具ｽｻ隴弱・・・蘭・ｴ陷･・ｲ繝ｻ・ｽ繝ｻ・ｮ鬮ｫ・ｪ髢ｧ・ｲ繝ｻ・ｮ郢晢ｽｻ
  const centerXArea = leftOffset + drawW / 2;
  const nodes = sorted.map((f, i) => {
    const ovr = Engine.util.ov(f);
    const ovrNorm = (ovr - ovrMin) / ovrRange;
    const r = R_MIN + ovrNorm * (R_MAX - R_MIN);
    const y = PAD_TOP + r + (1 - ovrNorm) * (contentH - R_MAX * 2);
    const hash = _relmapIdHash(f.id);
    const hash2 = _relmapIdHash(f.id + 313);
    const rankNorm = n > 1 ? i / (n - 1) : 0;
    const angle = -Math.PI * 0.72 + rankNorm * Math.PI * 1.44 + (hash - 0.5) * 0.5;
    const arc = _relmapPolarOffset(usableW * 0.28, contentH * 0.12, angle, 0.35 + rankNorm * 0.75);
    const homeX = centerXArea + arc.x;
    const aceLift = i === 0 ? r * 0.6 : i < 3 ? r * 0.24 : 0;
    const homeY = y - aceLift;
    const x = homeX + (hash2 - 0.5) * usableW * 0.12;
    const mapNode = _relmapNodeMap[f.id];
    const savedPos = _relmapGetPowerPos(mapNode, orgId, x, homeY);
    return {
      id: f.id, fighter: f, x: savedPos.x, y: savedPos.y, r, ovr, ovrNorm,
      isChamp: !!champId && f.id === champId,
      isAce: i === 0, isTop3: i < 3, rank: i,
      homeX, homeY,
    };
  });

  // 鬮ｯ・ｦ隴惹ｼ夲ｽｽ・ｪ遶乗剌・ｱ鬥ｴ・ｩ蛹・ｽｽ・ｿ郢晢ｽｻ郢晢ｽｻ驛｢譏懶ｽｻ・｣邵ｺ蟶ｷ・ｸ・ｲ遶乗劼・ｽ・､陞｢・ｹ繝ｻ竏ｫ・ｸ・ｺ繝ｻ・ｫ髯懃軸・ｧ・ｭ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ鬩包ｽｶ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・ｫ髮九・・ｽ・｢驛｢・ｧ陟募ｨｯ繝ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ閧ｲ・ｸ・ｺ郢晢ｽｻ遶願侭繝ｻ郢晢ｽｻ
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 6;
        if (dist < minDist && dist > 0.01) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          // 髮朱ｯ会ｽｽ・ｴ髯晢ｽｷ繝ｻ・ｳ髯ｷ繝ｻ・ｽ・ｪ髯ｷ莠･迴ｾ邵ｲ螳夲ｽｬ螟ｲ・ｽ・ｼ驍ｵ・ｺ隲､諛翫・驍ｵ・ｺ隴会ｽｦ繝ｻ・ｼ髢ｧ・ｲ繝ｻ・ｸ繝ｻ・ｦ驍ｵ・ｺ繝ｻ・ｮOVR髯滓・・ｸ讒ｭ繝ｻ驛｢・ｧ陷代・・ｽ・ｿ隴擾ｽｴ隨・ｽｽ郢晢ｽｻ郢晢ｽｻ
          a.x -= nx * push * 0.85; a.y -= ny * push * 0.35;
          b.x += nx * push * 0.85; b.y += ny * push * 0.35;
        }
      }
      // 髯ｷ・ｷ郢晢ｽｻ郢晢ｽｱ驛｢・ｧ繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｮ髯ｷ・ｷ郢晢ｽｻ郢晢ｽｮ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ邵ｲ螳夲｣ｰ繝ｻ繝ｻ鬮ｦ諛・ｽｹ・ｧ陜｣・､繝ｻ・ｶ繝ｻ・ｭ髫ｰ謔ｶ繝ｻ繝ｻ・ｼ鬩帙・・ｽ・｡隴惹ｼ夲ｽｽ・ｪ遶乗剌・ｱ鬥ｴ・ｩ蛹・ｽｽ・ｿ驍ｵ・ｺ繝ｻ・ｧ髯樊ｻ薙§遶頑･｢諤弱・・ｺ驛｢・ｧ闕ｵ譏ｴ繝ｻ驛｢・ｧ陝ｶ譏懶ｽｺ貅ｽ・ｸ・ｺ隰ｦ・ｰ繝ｻ・ｼ郢晢ｽｻ
      const nd = nodes[i];
      const spring = nd.isAce ? 0.045 : nd.isTop3 ? 0.032 : 0.022;
      nd.x += (nd.homeX - nd.x) * spring;
      nd.y += (nd.homeY - nd.y) * (spring * 0.8);
      nd.x = Math.max(leftOffset + PAD_X + nd.r, Math.min(leftOffset + drawW - PAD_X - nd.r, nd.x));
      nd.y = Math.max(PAD_TOP + nd.r, Math.min(H - PAD_BOTTOM - nd.r - 20, nd.y));
    }
  }

  // 髫ｴ蟠｢ﾂ鬩搾ｽｨ郢ｧ繝ｻ・ｽ・｢郢晢ｽｻ鬮ｦ諛・ｽｹ・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｳ驛｢譎・惧繝ｻ・ｼ闔・･鬪ｭ蜊諱・ｹ晢ｽｻ驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｸ髯具ｽｻ郢晢ｽｻ郢晢ｽｻ髣厄ｽｴ陷ｻ・ｵ繝ｻ・｣髴郁ｲｻ・ｽ螳夲ｽｬ蝠上・隨ｳ繝ｻ・ｸ・ｺ陝ｶ蜻ｻ・ｽ荵昴・郢晢ｽｻ
  nodes.forEach(nd => {
    nd.x = Math.max(leftOffset + PAD_X + nd.r, Math.min(leftOffset + drawW - PAD_X - nd.r, nd.x));
    nd.y = Math.max(PAD_TOP + nd.r, Math.min(H - PAD_BOTTOM - nd.r - 20, nd.y));
    _relmapSetPowerPos(_relmapNodeMap[nd.id], orgId, nd.x, nd.y);
  });

  let defsSvg = '<defs>';
  let svgHtml = '';

  // 驛｢譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ
  const centerX = (leftOffset + drawW / 2).toFixed(1);
  svgHtml += `<text x="${centerX}" y="26" text-anchor="middle" fill="${color}" font-size="14" font-weight="bold" font-family="sans-serif" stroke="rgba(0,0,0,0.7)" stroke-width="2.5" paint-order="stroke">${orgName}郢晢ｽｻ郢晢ｽｻ{n}髯ｷ・ｷ隰ｳ・ｾ繝ｻ・ｼ郢晢ｽｻ/text>`;
  svgHtml += `<line x1="${(leftOffset + 20).toFixed(1)}" y1="34" x2="${(leftOffset + drawW - 20).toFixed(1)}" y2="34" stroke="${color}" stroke-width="1" stroke-opacity="0.3"/>`;

  // 鬮ｦ・ｮ郢晢ｽｻ繝ｻ讚∵綜繝ｻ・｣髣厄ｽｴ髦ｮ蜷ｶ窶ｳ驛｢譎｢・ｽ・ｩ驛｢譎｢・ｽ・ｼ鬮｢・ｭ隴ｴ・ｧ陷搾ｽｹ驛｢・ｧ繝ｻ・ｰ驛｢譎｢・ｽ・ｩ驛｢譏ｴ繝ｻ
  svgHtml += `<circle cx="${(leftOffset + drawW / 2).toFixed(1)}" cy="${(H / 2).toFixed(1)}" r="${(Math.max(drawW, H) * 0.4).toFixed(1)}" fill="${color}" fill-opacity="0.03"/>`;

  // OVR髫ｴ荳翫・繝ｻ・ｰ郢晢ｽｻ邵ｲ螳夲ｽｬ・ｰ陷諤懈・郢晢ｽｻ闔・･繝ｻ・､繝ｻ・ｧ驍ｵ・ｺ鬮ｦ・ｪ繝ｻ讓抵ｽｹ譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎擾ｽｳ・ｨ遯ｶ・ｲ髣包ｽｳ驗呻ｽｫ遶頑･｢・ｭ螟ｲ・ｽ・･驛｢・ｧ陷茨ｽｷ繝ｻ・ｼ郢晢ｽｻ
  const drawOrder = [...nodes].sort((a, b) => a.ovr - b.ovr);
  drawOrder.forEach(node => {
    const { x, y, r, ovr, isChamp, isAce, isTop3, fighter: f, rank } = node;
    const strokeColor = isChamp ? '#d4a843' : color;
    const sw = isChamp ? 2.8 : isAce ? 2.4 : 1.5;
    const pUrl = getPortraitUrl(f.id);

    svgHtml += `<g class="rm-node-group" data-id="${f.id}" style="cursor:pointer">`;

    // 驛｢・ｧ繝ｻ・ｨ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｩ
    if (isAce) {
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 8).toFixed(1)}" fill="${color}" fill-opacity="0.12"/>`;
    }

    // 鬩阪・蜚ｱ郢晢ｽｻ
    if (isChamp) {
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}" fill="none" stroke="#d4a843" stroke-width="2" stroke-opacity="0.85"/>`;
      svgHtml += `<text x="${x.toFixed(1)}" y="${(y - r - 6).toFixed(1)}" text-anchor="middle" font-size="${Math.max(12, r * 0.45).toFixed(0)}" font-family="sans-serif">・滓ｫ∬・</text>`;
    }

    // 鬯ｯ菫ｶ魍堤ｸｺ繝ｻ・ｹ・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ or 髯懶ｽｪ陷会ｽｱ繝ｻ鬘俶咏ｹ晢ｽｻ
    if (pUrl) {
      const patternId = `ph-face-${f.id}`;
      defsSvg += _relmapBuildInlineFacePattern(patternId, pUrl);
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${patternId})" stroke="${strokeColor}" stroke-width="${sw}"/>`;
    } else {
      svgHtml += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(10,10,20,0.9)" stroke="${strokeColor}" stroke-width="${sw}"/>`;
      svgHtml += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${color}" font-size="${(r * 0.6).toFixed(1)}" font-family="sans-serif">${ovr}</text>`;
    }

    // OVR驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｸ
    const badgeW = Math.max(24, r * 0.85);
    const badgeH = Math.max(13, r * 0.42);
    const badgeY = y + r + 7;
    svgHtml += `<rect x="${(x - badgeW / 2).toFixed(1)}" y="${(badgeY - badgeH / 2).toFixed(1)}" width="${badgeW.toFixed(1)}" height="${badgeH.toFixed(1)}" rx="3.5" fill="rgba(10,10,20,0.85)" stroke="rgba(255,255,255,${isAce ? '0.7' : '0.45'})" stroke-width="1"/>`;
    svgHtml += `<text x="${x.toFixed(1)}" y="${(badgeY + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="${Math.max(8.5, r * 0.3).toFixed(1)}" font-weight="bold" font-family="sans-serif">${ovr}</text>`;

    // 髯ｷ・ｷ隶朱｡披・郢晢ｽｻ闔・･郢晢ｽｻ髯ｷ・ｩ繝ｻ・｡鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ郢晢ｽｻ郢晢ｽｻ
    const name = (f.name || '').slice(0, 6);
    const fs = isAce ? 11 : isTop3 ? 10.5 : 9.5;
    svgHtml += `<text x="${x.toFixed(1)}" y="${(badgeY + badgeH / 2 + 12).toFixed(1)}" text-anchor="middle" fill="#e8e8e8" font-size="${fs}" font-family="sans-serif" stroke="rgba(0,0,0,0.88)" stroke-width="3" paint-order="stroke">${name}</text>`;

    // 鬯ｯ繝ｻ繝ｻ繝ｻ・ｽ鬮ｦ・ｪ・主ｸｷ・ｹ譎冗函・弱・
    svgHtml += `<text x="${x.toFixed(1)}" y="${(y - r - (isChamp ? 18 : 5)).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="8.5" font-family="sans-serif">#${rank + 1}</text>`;

    svgHtml += `</g>`;
  });

  svgHtml += `<text x="${(leftOffset + drawW / 2).toFixed(1)}" y="${(H - 4).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.18)" font-size="9.5" font-family="sans-serif">驕ｶ鄙ｫ繝ｻ髯滓汚・ｽ・ｷ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻVR鬯ｯ・ｮ陋帙・・ｽ・ｼ郢晢ｽｻ 髫ｨ・ｳ郢晢ｽｻ驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ=OVR  驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ驢搾ｽｸ・ｺ繝ｻ・ｧ鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ</text>`;

  defsSvg += '</defs>';
  svg.innerHTML = defsSvg + svgHtml;
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
function _relmapSetViewMode(mode) {
  _relmapViewMode = mode;
  document.querySelectorAll('.rm-view-toggle .rm-vt-btn').forEach(b => b.classList.remove('active'));
  const btnIdx = mode === 'network' ? 1 : mode === 'focus' ? 2 : 3;
  const btn = document.querySelector(`.rm-vt-btn:nth-child(${btnIdx})`);
  if (btn) btn.classList.add('active');
  const zoneLayer = document.getElementById('relmapZoneLayer');
  if (zoneLayer) zoneLayer.innerHTML = '';

  if (mode === 'power') {
    // 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ蜥擾ｽｹ譎｢・ｽ・｢驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ 髴大､ｲ・ｽ・ｩ鬨ｾ繝ｻ繝ｻ繝ｻ・ｼ騾ｧ・ｮ繝ｻ・ｮ隲､諛碁・髮弱・・ｽ・｢驛｢譎｢・ｽ・ｻ髯ｷ闌ｨ・ｽ・ｨ驛｢譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎∝ｴ溯ｬｦ・ｼ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驛｢譎｢・ｽ・ｻSVG驍ｵ・ｺ繝ｻ・ｫ髯懈圜・ｽ・｣髣厄ｽｴ髦ｮ蜷ｶﾎ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ繝ｻ蟶敖・ｶ繝ｻ・ｴ髫ｰ・ｰ陷諤懈・
    if (_relmapAnimId) { cancelAnimationFrame(_relmapAnimId); _relmapAnimId = null; }
    _relmapNodes.forEach(n => { n._hidden = true; });
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    _relmapRenderPowerView();
    return;
  }

  if (mode === 'network') {
    // 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ蜥擾ｽｸ・ｺ闕ｵ譎｢・ｽ闃ｽ・ｬ魃会ｽｽ・ｻ驛｢・ｧ陷ｿ・･繝ｻ・ｰ繝ｻ・ｴ髯ｷ・ｷ郢晢ｽｻ SVG驍ｵ・ｺ繝ｻ・ｮdefs+髫ｰ・ｰ陷諤懈・驛｢譎｢・ｽ・ｬ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ驛｢・ｧ髮区ｩｸ・ｽ・ｮ隰疲ｺ倥・髯ｷﾂ髢ｧ・ｴ繝ｻ・ｧ霑｢證ｦ・ｽ・ｯ郢晢ｽｻ+ orgFilter鬮ｫ證ｦ・ｽ・｣鬯ｮ・ｯ繝ｻ・､ + 驛｢・ｧ繝ｻ・ｺ驛｢譎｢・ｽ・ｼ驛｢譎｢・｣・ｰ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・ｻ驛｢譏ｴ繝ｻ郢晢ｽｨ
    const svg = document.getElementById('relmapSvg');
    if (svg) {
      const existingNodeLayer = document.getElementById('relmapNodeLayer');
      if (!existingNodeLayer) {
        // power view驍ｵ・ｺ髣梧挌.innerHTML驛｢・ｧ陷代・・ｽ・ｸ鬯・､ｧ・ｶ讙趣ｽｸ・ｺ鬮ｦ・ｪ繝ｻ・ｰ驍ｵ・ｺ雋・ｪ陞ｺ驛｢・ｧ遶丞仰遯ｶ・･efs+驛｢譎｢・ｽ・ｬ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ驛｢・ｧ髮区ｧｭ繝ｻ髫ｶ蝣､霍昴・・ｯ郢晢ｽｻ
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
        svg.innerHTML = defsHtml + '<g id="relmapZoneLayer"></g><g id="relmapLinkLayer"></g><g id="relmapNodeLayer"></g>';
        _relmapBuildFacePatterns(svg);
      }
    }
    _relmapOrgFilter = null;
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    // 髯ｷ闌ｨ・ｽ・ｨ驛｢譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎擾ｽｳ・ｨ繝ｻ蟶晏距繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驍ｵ・ｺ繝ｻ・ｫ髫ｰ魃会ｽｽ・ｻ驍ｵ・ｺ陷ｻ・ｻ繝ｻ・ｼ郢晢ｽｻrelmapUpdateVisibility驍ｵ・ｺ繝ｻ・ｧ髮弱・・ｽ・｣髯溷床・ｸ蟯ｩ繝ｻ髯ｷ繝ｻ・ｽ・ｦ鬨ｾ繝ｻ繝ｻ繝ｻ繝ｻ・ｹ・ｧ陟暮ｯ会ｽｽ荵昴・郢晢ｽｻ
    _relmapNodes.forEach(n => { n._hidden = false; });
    const W = _relmapW, H = _relmapH;
    const orgCenters = { player: { x: W * 0.3, y: H * 0.35 }, org_s: { x: W * 0.7, y: H * 0.3 }, org_a: { x: W * 0.25, y: H * 0.7 }, org_b: { x: W * 0.7, y: H * 0.7 }, fa: { x: W * 0.5, y: H * 0.5 } };
    _relmapDrawOrgZones(orgCenters);
    _relmapRenderSidebar(orgCenters);
  }
  // 驛｢譎・ｽｼ譁青ｰ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｹ驛｢譎｢・ｽ・｢驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ遶頑･｢蟠慕ｹ晢ｽｻ繝ｻ鬘假ｽｭ蜴・ｽｽ・ｿ驍ｵ・ｺ陋ｹ・ｻ繝ｻ遏ｩ・ｫ・ｫ陝ｶ蜊債遶擾ｽｽ繝ｻ・ｸ繝ｻ・ｭ髯滂ｽ｢郢晢ｽｻ隰費ｽｴ鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ陞｢・ｹ遶企・・ｹ・ｧ髣・ｽｽ郢晢ｽｻ髯ｷ蟠趣ｽｼ譁青蝣､・ｹ譎丞ｹｲ・取ｨ抵ｽｹ・ｧ繝ｻ・､驛｢譎｢・ｽ・､驛｢譎｢・ｽ・ｼ髫ｴ蟠｢ﾂ鬯ｯ・ｮ隶鯉ｽｼVR鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ蟶晏搦繝ｻ・ｭ髯橸ｽｳ郢晢ｽｻ
  // 郢晢ｽｻ闔・･郢晢ｽｻ驛｢譎擾ｽｼ・ｱ郢晢ｽｻ驛｢譎・・繝ｻ・ｸ・つ髫ｴ竏ｬ豁薙・・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驍ｵ・ｺ繝ｻ・ｫ驛｢・ｧ陋ｹ・ｻ繝ｻ霆・n繝ｻ繧托ｽｽ・ｲ)髴大､ｲ・ｽ・ｩ鬨ｾ繝ｻ繝ｻ繝ｻ・ｼ騾ｧ・ｮ繝ｻ・ｮ髣埼屮・ｽ・ｲ繝ｻ・ｰ鬮｣蛹・ｽｽ・ｷ驛｢・ｧ陝ｶ譏懶ｽｺ貅ｽ・ｸ・ｺ隰ｦ・ｰ繝ｻ・ｼ郢晢ｽｻ
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
  // 髯ｷ謳ｾ・ｽ・｢髯ｷ迚呻ｽｸ蟶幢ｽｳ蜥擾ｽｹ譎｢・ｽ・｢驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ 鬨ｾ・ｶ繝ｻ・ｴ髫ｰ證ｦ・ｽ・･SVG驛｢・ｧ髮区ｧｭ繝ｻ髫ｰ・ｰ陷諤懈・
  if (_relmapViewMode === 'power') {
    _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
    _relmapRenderPowerView();
    _relmapRenderSidebar(_relmapOrgCenters);
    return;
  }
  // Reset zoom/pan to center
  _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
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

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Detail panel (bottom)
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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
  const bfc = bf >= 50 ? '#74b9ff' : '#ff7675', brc = br >= 50 ? '#74b9ff' : '#ff7675';

  let tb = '';
  if (top.rivalTitle) tb = `<span class="rm-detail-rivalry-badge" style="background:${top.titleColor}22;color:${top.titleColor};border:1px solid ${top.titleColor}44">${top.titleEmoji} ${top.rivalTitle}</span>`;

  panel.innerHTML = `<div class="rm-detail-faces"><div class="rm-detail-face" style="border-color:${n.color}" onclick="showFighterPopup(${n.id})">${_relmapFaceHtml(n.id, 42)}</div><span class="rm-detail-arr">\u21C4</span><div class="rm-detail-face" style="border-color:${other.color}" onclick="showFighterPopup(${other.id})">${_relmapFaceHtml(other.id, 42)}</div></div>
    <div class="rm-detail-info"><div class="rm-detail-names"><span style="cursor:pointer" onclick="showFighterPopup(${n.id})">${n.name}</span><span style="color:var(--text-dim);font-size:11px">\u21C4</span><span style="cursor:pointer" onclick="showFighterPopup(${other.id})">${other.name}</span>${tb}</div>
    <div class="rm-detail-meters"><div><div class="rm-detail-meter-label">${n.name.slice(0,3)}\u2192鬮ｫ蛹・ｽｽ・ｪ</div><div class="rm-detail-meter-val" style="color:${bfc}">${Math.round(bf)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${bf}%;background:${bfc}"></div></div></div><div><div class="rm-detail-meter-label">${other.name.slice(0,3)}\u2192鬮ｫ蛹・ｽｽ・ｪ</div><div class="rm-detail-meter-val" style="color:${brc}">${Math.round(br)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${br}%;background:${brc}"></div></div></div><div><div class="rm-detail-meter-label">${n.name.slice(0,3)}\u2192鬩包ｽｶ繝ｻ・ｶ</div><div class="rm-detail-meter-val" style="color:#e17055">${Math.round(rf)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${rf}%;background:#e17055"></div></div></div><div><div class="rm-detail-meter-label">${other.name.slice(0,3)}\u2192鬩包ｽｶ繝ｻ・ｶ</div><div class="rm-detail-meter-val" style="color:#e17055">${Math.round(rr)}</div><div class="rm-detail-meter-bar"><div class="rm-detail-meter-fill" style="width:${rr}%;background:#e17055"></div></div></div></div></div>
    <div style="text-align:right;font-size:10px;color:var(--text-dim);flex-shrink:0">髣泌ｳｨ繝ｻ${nl.length-1}髣比ｼ夲ｽｽ・ｶ<br><span style="cursor:pointer;color:var(--gold)" onclick="showFighterPopup(${n.id})">\uD83D\uDCCB 鬮ｫ・ｧ繝ｻ・ｳ鬩肴得・ｽ・ｰ</span><span style="margin-left:8px;cursor:pointer;color:#74b9ff" onclick="_relmapCompareA=${n.id};_relmapCompareB=${other.id};_relmapShowComparePopup()">\u2696 髮手ご・｢謇假ｽｽ・ｼ郢晢ｽｻ/span></div>`;
  panel.classList.add('show');
}

// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
// Compare popup
// 髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ髫ｨ鬘費ｽｵ・ｶ雎・ｽｦ
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
  if (!_relmapCompareB) { h.textContent = `\u2696 \u2460 ${aN} 驛｢・ｧ陝ｶ譏ｶ繝ｻ髫ｰ螢ｹ繝ｻ\u2192 \u2461髯ｷ・ｿ繝ｻ・ｳ髯句ｹ｢・ｽ・ｴ驍ｵ・ｺ繝ｻ・ｮ鬯ｩ蛹・ｽｽ・ｸ髫ｰ繝ｻ・ｹ譎｢・ｽ蝣､・ｹ・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ逍・ h.classList.add('show'); }
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

  // 鬯ｮ・｢繝ｻ・｢髣厄ｽｫ郢ｧ繝ｻﾎ咎Δ譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｿ髣費｣ｰ陷ｿ・･霎ｯ謌頑╂鬮｢ﾂ繝ｻ・ｾ隴会ｽｦ繝ｻ・ｼ陋ｹ・ｻ郢晢ｽｻ驛｢譏ｴ繝ｻ郢晢｣ｰ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ繝ｻ・ｫ髯懆ｬ趣ｽｹ譎｢・ｽ繝ｻ諱ｷ繝ｻ・ｼ驛｢・ｧ・つ驍ｵ・ｺ雋・∞・ｽ竏壹・郢晢ｽｻ
  const bAtoB = rel ? (isAS ? rel.bondAB : rel.bondBA) : 0;
  const rAtoB = rel ? (isAS ? rel.rivAB : rel.rivBA) : 0;
  const bBtoA = rel ? (isAS ? rel.bondBA : rel.bondAB) : 0;
  const rBtoA = rel ? (isAS ? rel.rivBA : rel.rivAB) : 0;
  const cAB = bAtoB >= 50 ? '#74b9ff' : '#ff7675', cBA = bBtoA >= 50 ? '#74b9ff' : '#ff7675';

  let h = `<div class="rm-popup-close" onclick="_relmap閉じるPopup()">\u2715</div>`;

  // 驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢譎√・・取辨ﾂｧ繝ｻ・ｰ髯ｷ・ｿ繝ｻ・ｷ驛｢譎√・郢晢ｽｪ驛｢譎｢・ｽ・ｼ郢晢ｽｻ陋ｹ・ｻ遶包｣ｰ驛｢・ｧ陟募ｾ後・郢晢ｽｻ郢晢ｽｻ
  if (rel && rel.rivalTitle) {
    h += `<div style="text-align:center;padding:6px 0 2px;font-size:13px;font-weight:700;color:${rel.titleColor}">${rel.titleEmoji} ${rel.rivalTitle}</div>`;
  }

  // 驛｢譎渉・･郢晢ｽ｣驛｢謨鳴驛｢譎｢・ｽ・ｼ: 驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ+髯ｷ・ｷ隶朱｡披・+OVR+髫ｲ・｢雋願侭ﾎ鈴Δ譎｢・ｽ・｡驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｿ驛｢譎｢・ｽ・ｼ驛｢・ｧ髮区ｨ願ｳ驛｢・ｧ繝ｻ・ｭ驛｢譎｢・ｽ・｣驛｢譎｢・ｽ・ｩ驍ｵ・ｺ繝ｻ・ｮ髣包ｽｳ闕ｵ譏ｶ繝ｻ鬯ｩ貅ｷ隱ｿ繝ｻ・ｽ繝ｻ・ｮ
  h += `<div class="rm-compare-header"><div class="rm-compare-side">`;
  h += `<div class="rm-compare-upper-img" style="border-color:${aColor}">${aUp?`<img src="${aUp}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="no-img" ${aUp?'style="display:none"':''}>\uD83D\uDC64</div></div>`;
  h += `<div class="rm-compare-name">${a.name}</div><div class="rm-compare-org" style="color:${aColor}">${aEmoji} ${aOrgName} \u2500 ${a.style}</div><div class="rm-compare-ovr-badge">OVR ${a.ovr}</div>`;
  // A驕ｶ莨・ｼ・し・ｺ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｮ髫ｲ・｢雋願侭ﾎ礼ｹ晢ｽｻ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｮ髣包ｽｳ闕ｵ謨鳴遶乗刋萓｡鬩墓得・ｽ・｢髯ｷ螂・ｽｽ・ｰ驍ｵ・ｺ繝ｻ・ｧ髫ｴ繝ｻ・ｽ・ｹ髯ｷ・ｷ闔会ｽ｣繝ｻ蟶昶凾繝ｻ・ｺ驍ｵ・ｺ陷ｻ・ｻ繝ｻ・ｼ郢晢ｽｻ
  if (rel) {
    h += `<div class="rm-cmp-rel-inline">`;
    h += `<div class="rm-cmp-rel-direction" style="color:${bColor}">驕ｶ鄙ｫ繝ｻ${b.name.slice(0,5)} 驍ｵ・ｺ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｮ髫ｲ・｢雋願侭ﾎ・/div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label">鬮ｫ蛹・ｽｽ・ｪ髯昴・繝ｻ繝ｻ・ｺ繝ｻ・ｦ</div><div class="rm-cmp-rel-meter-val" style="color:${cAB}">${Math.round(bAtoB)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${bAtoB}%;background:${cAB}"></div></div></div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label">鬩包ｽｶ繝ｻ・ｶ髣費｣ｰ騾包ｽｻ・大涵蝙鍋ｹ晢ｽｻ/div><div class="rm-cmp-rel-meter-val" style="color:#e17055">${Math.round(rAtoB)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${rAtoB}%;background:#e17055"></div></div></div>`;
    const emotionAtoB = getEmotionText(bAtoB, rAtoB, a.ovr, b.ovr, a._char?.archetype);
    h += `<div class="rm-cmp-emotion-text">\uD83D\uDCAD ${emotionAtoB}</div>`;
    h += `</div>`;
  }
  h += `</div><div class="rm-compare-divider">\u21C4</div><div class="rm-compare-side">`;
  h += `<div class="rm-compare-upper-img" style="border-color:${bColor}">${bUp?`<img src="${bUp}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}<div class="no-img" ${bUp?'style="display:none"':''}>\uD83D\uDC64</div></div>`;
  h += `<div class="rm-compare-name">${b.name}</div><div class="rm-compare-org" style="color:${bColor}">${bEmoji} ${bOrgName} \u2500 ${b.style}</div><div class="rm-compare-ovr-badge">OVR ${b.ovr}</div>`;
  // B驕ｶ雍具ｽｽ繝ｻ・ｸ・ｺ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｮ髫ｲ・｢雋願侭ﾎ礼ｹ晢ｽｻ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｮ驛｢・ｧ繝ｻ・｢驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｳ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｮ髣包ｽｳ闕ｵ謨鳴遶乗劼・ｽ・ｷ繝ｻ・ｦ鬩墓得・ｽ・｢髯ｷ螂・ｽｽ・ｰ驍ｵ・ｺ繝ｻ・ｧ髫ｴ繝ｻ・ｽ・ｹ髯ｷ・ｷ闔会ｽ｣繝ｻ蟶昶凾繝ｻ・ｺ驍ｵ・ｺ陷ｻ・ｻ繝ｻ・ｼ郢晢ｽｻ
  if (rel) {
    h += `<div class="rm-cmp-rel-inline">`;
    h += `<div class="rm-cmp-rel-direction" style="color:${aColor}">驕ｶ鄙ｫ繝ｻ${a.name.slice(0,5)} 驍ｵ・ｺ繝ｻ・ｸ驍ｵ・ｺ繝ｻ・ｮ髫ｲ・｢雋願侭ﾎ・/div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label">鬮ｫ蛹・ｽｽ・ｪ髯昴・繝ｻ繝ｻ・ｺ繝ｻ・ｦ</div><div class="rm-cmp-rel-meter-val" style="color:${cBA}">${Math.round(bBtoA)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${bBtoA}%;background:${cBA}"></div></div></div>`;
    h += `<div class="rm-cmp-rel-meter"><div class="rm-cmp-rel-meter-label">鬩包ｽｶ繝ｻ・ｶ髣費｣ｰ騾包ｽｻ・大涵蝙鍋ｹ晢ｽｻ/div><div class="rm-cmp-rel-meter-val" style="color:#e17055">${Math.round(rBtoA)}</div><div class="rm-cmp-rel-meter-bar"><div class="rm-cmp-rel-meter-fill" style="width:${rBtoA}%;background:#e17055"></div></div></div>`;
    const emotionBtoA = getEmotionText(bBtoA, rBtoA, b.ovr, a.ovr, b._char?.archetype);
    h += `<div class="rm-cmp-emotion-text">\uD83D\uDCAD ${emotionBtoA}</div>`;
    h += `</div>`;
  }
  h += `</div></div>`;

  if (!rel) {
    h += `<div style="text-align:center;padding:6px 0;color:var(--text-dim);font-size:12px">\uD83D\uDD17 鬨ｾ・ｶ繝ｻ・ｴ髫ｰ證ｦ・ｽ・･驍ｵ・ｺ繝ｻ・ｮ鬯ｮ・｢繝ｻ・｢髣厄ｽｫ郢ｧ繝ｻ繝ｻ驍ｵ・ｺ郢ｧ繝ｻ・ｽ鬘費ｽｸ・ｺ繝ｻ・ｾ驍ｵ・ｺ陝ｶ蜻ｻ・ｽ繝ｻ/div>`;
  }

  // 鬯ｮ・｢繝ｻ・｢髣厄ｽｫ郢ｧ謖可繝ｻ・ｧ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・ｰ
  const relTags = [];
  const ageA = a._char?.age || 17, ageB = b._char?.age || 17;
  const ageDiff = Math.abs(ageA - ageB);
  if (ageDiff <= 2) relTags.push('\uD83D\uDC65 髯ｷ・ｷ陟包ｽ｡繝ｻ・ｸ驍丞・・ｽ・ｻ繝ｻ・｣');
  const isColleague = Engine.orgTimeline.wereColleagues(a._char || {}, b._char || {});
  if (isColleague) relTags.push('\uD83E\uDD1D 髯ｷ蛹ｻ繝ｻ鬩溽｢第″郢晢ｽｻ);
  if (ageDiff >= 3 && (a.orgId === b.orgId || isColleague)) {
    const senior = ageA > ageB ? a.name : b.name;
    const junior = ageA > ageB ? b.name : a.name;
    relTags.push(`\uD83D\uDD30 ${senior}\u2192${junior}`);
  }
  const h2hRec = Engine.h2h.getRecord(G, a.id, b.id);
  if (h2hRec && h2hRec.bestMQ >= 85) relTags.push('\u2728 髯ｷ・ｷ隶手ｴ具ｽｺ・ｫ鬮ｮ蜈ｷ・｣・ｰ驍ｵ・ｺ郢ｧ繝ｻ・ｽ繝ｻ);
  if (relTags.length > 0) {
    h += `<div class="rm-cmp-tags">${relTags.join('<span class="rm-cmp-tag-sep">\uFF0F</span>')}</div>`;
  }

  h += `<div class="rm-compare-body">`;
  // Stats comparison
  _RELMAP_STAT_META.forEach(s => {
    const va = a[s.key] || 0, vb = b[s.key] || 0;
    const displayVa = Math.round(va), displayVb = Math.round(vb);
    const aW = va > vb, bW = vb > va;
    h += `<div class="rm-cmp-stat-row"><div class="rm-cmp-bar-left"><div class="rm-cmp-val" style="color:${aW?s.color:'var(--text-sub)'}">${displayVa}</div><div class="rm-cmp-bar-track"><div class="rm-cmp-bar-fill" style="width:${va}%;background:${aW?s.color:'rgba(255,255,255,0.15)'}"></div></div></div><div class="rm-cmp-label">${s.label}</div><div class="rm-cmp-bar-right"><div class="rm-cmp-bar-track"><div class="rm-cmp-bar-fill" style="width:${vb}%;background:${bW?s.color:'rgba(255,255,255,0.15)'}"></div></div><div class="rm-cmp-val" style="color:${bW?s.color:'var(--text-sub)'}">${displayVb}</div></div></div>`;
  });
  h += `</div>`;

  const card = document.getElementById('relmapPopupCard');
  if (card) { card.className = 'rm-popup-card rm-compare-card'; card.style.width = '860px'; card.innerHTML = h; }
  const overlay = document.getElementById('relmapPopupOverlay');
  if (overlay) overlay.classList.add('show');
}

function _relmap閉じるPopup() {
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
  _relmapZoom = 1.0; _relmapPanX = 0; _relmapPanY = 0;
  _relmapReheat();
}

