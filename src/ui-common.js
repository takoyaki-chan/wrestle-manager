// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9: UI HELPERS & SHOW PREP (v0.85)                ║
// ╚══════════════════════════════════════════════════════════╝

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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

// ── Coach Tooltip (profile popup) ──
function showCoachTooltip(coachId) {
  const c = ALL_COACHES.find(co => co.id === coachId);
  if (!c) return;
  Audio.play('hover');

  const SPEC_META = {
    pw: {color:'#e74c3c', label:'パワー育成', icon:'PW', detail:`担当選手のパワー成長率が${c.growthMult}倍になります。パワーが高い選手は打撃・投げ技のダメージが増加します。`},
    sp: {color:'#2ecc71', label:'スピード育成', icon:'SP', detail:`担当選手のスピード成長率が${c.growthMult}倍になります。スピードが高い選手は先手を取りやすく、回避率も上がります。`},
    te: {color:'#5dade2', label:'テクニック育成', icon:'野', detail:`担当選手のテクニック成長率が${c.growthMult}倍になります。テクニックが高い選手は技の成功率と関節技のダメージが上がります。`},
    st: {color:'#f1c40f', label:'スタミナ育成', icon:'ST', detail:`担当選手のスタミナ成長率が${c.growthMult}倍になります。スタミナが高い選手はHPが多く、長期戦に強くなります。`},
    mental:{color:'#bb8fce', label:'心身ケア', icon:'MN', detail:`担当選手のコンディション回復が毎週+${c.condBonus||3}され、怪我の発生確率が${Math.round((c.injuryReduce||0.5)*100)}%カットされます。エースや主力の安定稼働に。`},
    all:{color:'var(--gold)', label:'総合育成', icon:'ALL', detail:`担当選手の全ステータスの成長率が${c.growthMult}倍になります。突出した強化はできませんが、バランスよく育てられます。`},
    mq: {color:'#e67e22', label:'試合品質向上', icon:'MQ', detail:`担当選手が出場する試合のMQ（試合クオリティ）基底値に+${c.mqBonus}のボーナス。試合のドラマ性が向上し、観客満足度に直結します。`},
    pop:{color:'#8bc4f0', label:'人気向上', icon:'POP', detail:`担当選手のプロモ活動時に人気上昇量が+${c.popBonus}されます。メディア露出とファン獲得の効率が高まります。`}
  };
  const spec = SPEC_META[c.specialty] || SPEC_META.all;

  // Avatar background color based on specialty
  const avBg = `linear-gradient(135deg, ${spec.color}33, ${spec.color}11)`;
  const avBorder = `${spec.color}88`;

  // Assigned fighters
  const assigned = getCoachAssignees(c.id);
  const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);
  const isHired = G.coaches.includes(c.id);

  let html = '';

  // Header
  html += `<div class="coach-tooltip-header" style="background:${spec.color}0a">
    <div class="coach-tooltip-avatar" style="background:${avBg};border:2px solid ${avBorder};display:flex;align-items:center;justify-content:center;overflow:hidden">
      ${coachPortraitImg(c, 84)}
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:18px;margin-bottom:4px">${c.name}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span class="coach-effect ${c.specialty}" style="margin:0">${spec.icon} ${spec.label}</span>
        ${isHired ? '<span style="font-size:12px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 6px;border-radius:3px">雇用中</span>' : ''}
      </div>
    </div>
    <button onclick="closeCoachTooltip()" style="background:none;border:none;color:var(--text-dim);font-size:20px;cursor:pointer;padding:4px;line-height:1">✕</button>
  </div>`;

  // Body
  html += `<div class="coach-tooltip-body">`;

  // Effect detail
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">効果</div>
    <div style="font-size:13px;color:var(--text);line-height:1.6">${spec.detail}</div>
  </div>`;

  // Cost info
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">コスト</div>
    <div style="display:flex;gap:16px;font-size:12px">
      <span style="color:var(--text-sub)">雇用費: <strong style="color:var(--text)">${c.hireFee}万</strong></span>
      <span style="color:var(--text-sub)">給与: <strong style="color:var(--text)">${c.salary}万/週</strong></span>
      <span style="color:var(--text-sub)">担当上限: <strong style="color:var(--text)">${COACH_MAX_ASSIGN}名</strong></span>
    </div>
  </div>`;

  // Assigned fighters (if hired)
  if (isHired) {
    html += `<div class="coach-tooltip-section">
      <div class="coach-tooltip-label">担当選手 (${assigned.length}/${COACH_MAX_ASSIGN})</div>`;
    if (assignedChars.length > 0) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:4px">`;
      assignedChars.forEach(ch => {
        const o = ov(ch);
        html += `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px">${portraitImg(ch.id, 20, '', true)} ${fLink(ch, {source:'roster', size:'11px'})} <strong style="color:var(--gold)">${o}</strong></span>`;
      });
      html += `</div>`;
    } else {
      html += `<div style="font-size:12px;color:var(--text-dim)">担当選手なし（育成画面でアサインできます）</div>`;
    }
    html += `</div>`;
  }

  // Profile
  html += `<div class="coach-tooltip-section" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
    <div class="coach-tooltip-label">プロフィール</div>
    <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px">
      ${c.age}歳 ｜ ${c.gender}性 ｜ ${c.origin}出身
    </div>
    <div style="font-size:12px;color:var(--text);line-height:1.7">${c.profile}</div>
  </div>`;

  html += `</div>`; // end body

  document.getElementById('coachTooltipBox').innerHTML = html;
  document.getElementById('coachTooltipOverlay').classList.add('active');
}

function closeCoachTooltip() {
  document.getElementById('coachTooltipOverlay').classList.remove('active');
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
  injury: [
    'うぅ…痛い…。でも、すぐ戻ります！',
    'すみません…しばらくお休みをいただきます…',
    'くっ…こんなところで…！必ず復帰します！',
    'ごめんなさい…体が言うことを聞かなくて…',
    'あぁっ…！リハビリ、頑張ります…！'
  ],
  titleWin: [
    'やった…！チャンピオンになれた…！夢みたい！',
    'このベルト、絶対に手放しません！',
    '最高の気分です！応援ありがとうございます！'
  ],
  release: [
    'そう…ですか。ここでの思い出、忘れません。',
    'お世話になりました…。どこかで強くなって戻ります。',
    '悔しいです…でも、ありがとうございました。',
  ]
};

// Event popup queue (multiple events can stack)
let _eventPopupQueue = [];

function showEventPopup(opts) {
  // opts: { type: 'fighter'|'coach', id, name, emoji?, message, detail?, tone: 'positive'|'negative'|'gold' }
  _eventPopupQueue.push(opts);
  if (_eventPopupQueue.length === 1) _renderEventPopup();
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
  Audio.play(o.tone === 'negative' ? 'error' : o.tone === 'gold' ? 'fanfare' : 'notify');
}

function closeEventPopup() {
  document.getElementById('eventPopupOverlay').classList.remove('active');
  _eventPopupQueue.shift();
  if (_eventPopupQueue.length > 0) setTimeout(_renderEventPopup, 200);
}

function pickQuote(category) {
  const arr = EVENT_QUOTES[category] || ['...'];
  return arr[Math.floor(Math.random() * arr.length)];
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

function showFighterPopup(fighterId, source) {
  const c = findFighter(fighterId, source);
  if (!c) return;
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
  if (!isRoster && !isFree && G.aiOrgs) {
    for (const [oId, oData] of Object.entries(G.aiOrgs)) {
      if (oData.roster?.some(f => f.id === c.id)) {
        const org = RIVAL_ORGS.find(o => o.id === oId);
        orgLabel = org ? `${org.emoji} ${org.name}` : oId;
        break;
      }
    }
  }

  const initial = c.name.charAt(0);
  const ovrVal = Engine.util.ov(c);
  const isChamp = G.titles?.world?.championId === c.id;
  const isAce = Engine.ace.isAce(G, c.id);

  // Stats
  const STATS = [
    {key:'pw',label:'PW',color:'#e74c3c',name:'パワー'},
    {key:'sp',label:'SP',color:'#3498db',name:'スピード'},
    {key:'te',label:'TE',color:'#2ecc71',name:'テクニック'},
    {key:'st',label:'ST',color:'#f39c12',name:'スタミナ'},
    {key:'mn',label:'MN',color:'#9b59b6',name:'マインド'}
  ];

  // Tab state (stored on window for re-rendering)
  window._fpTab = window._fpTab || 0;

  function buildPopup(tabIdx) {
    let html = '';
    const pUrl = getPortraitUrl(c.id);

    // ── Large portrait header ──
    // Determine portrait border color by status
    const popBorderColor = isChamp ? '#d4a843' : isAce ? '#c0c0c0' : 'rgba(255,255,255,0.15)';
    const popShadow = isChamp ? '0 4px 20px rgba(0,0,0,0.5),0 0 16px rgba(212,168,67,0.5)' : isAce ? '0 4px 20px rgba(0,0,0,0.5),0 0 12px rgba(192,192,192,0.4)' : '0 4px 20px rgba(0,0,0,0.5)';

    html += `<div style="background:${sm.color}0a;border-bottom:1px solid rgba(255,255,255,0.06);padding:20px;text-align:center">
      <div style="display:flex;align-items:flex-start;gap:20px">
        <div style="flex-shrink:0;position:relative">
          ${pUrl
            ? `<img src="${pUrl}" style="width:140px;height:140px;border-radius:14px;object-fit:cover;border:3px solid ${popBorderColor};box-shadow:${popShadow}" alt="${c.name}">`
            : `<div style="width:140px;height:140px;border-radius:14px;background:linear-gradient(135deg,${sm.color}33,${sm.color}11);border:3px solid ${popBorderColor};box-shadow:${popShadow};display:flex;align-items:center;justify-content:center"><span style="font-size:48px;font-weight:900;color:${sm.color}">${initial}</span></div>`}
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
            ${isAce ? '<span style="font-size:14px;color:#f1c40f;font-weight:700">⭐ エース</span>' : ''}
            ${c.isRental ? '<span style="font-size:13px;color:#f39c12">🤝 レンタル</span>' : ''}
          </div>
          ${(c.traits && c.traits.length > 0) ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${c.traits.map(t => {
            const td = TRAIT_DEFS[t]; if (!td) return '';
            return '<span title="' + td.desc + '" style="font-size:12px;padding:2px 7px;border-radius:8px;background:' + td.color + '22;color:' + td.color + ';border:1px solid ' + td.color + '44;white-space:nowrap;cursor:help">' + td.icon + ' ' + t + '</span>';
          }).join('')}</div>` : ''}
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:14px;color:var(--text-sub)">
            ${c.age !== undefined ? `<span>📅 ${c.age}歳</span>` : ''}
            ${c.h ? `<span>📏 ${c.h}cm</span>` : ''}
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

    // ── Tab bar ──
    const tabs = ['📊 能力', '📋 戦績・経歴'];
    if (isRoster) tabs.push('⚙️ 管理');
    html += `<div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.15)">
      ${tabs.map((t, i) => `<button onclick="event.stopPropagation();window._fpTab=${i};showFighterPopup(${c.id},'${source||''}')"
        style="flex:1;padding:10px 6px;font-size:13px;background:${i===tabIdx?'rgba(255,255,255,0.05)':'none'};border:none;border-bottom:2px solid ${i===tabIdx?'var(--gold)':'transparent'};color:${i===tabIdx?'var(--text)':'var(--text-dim)'};cursor:pointer;transition:all 0.2s">${t}</button>`).join('')}
    </div>`;

    html += `<div class="fighter-popup-body" style="padding:12px 16px 16px">`;

    // ══════ TAB 0: Stats & Profile ══════
    if (tabIdx === 0) {
      // Stat bars
      html += `<div class="fighter-popup-section" style="margin-bottom:12px">`;
      STATS.forEach(s => {
        const val = c[s.key] || 0;
        const sg = c.seasonGrowth?.[s.key] || 0;
        const w = Math.min(100, val);
        const valColor = val >= 75 ? s.color : val >= 50 ? 'var(--text)' : 'var(--text-sub)';
        html += `<div class="fighter-popup-stat-row">
          <span class="fighter-popup-stat-label" title="${s.name}">${s.label}</span>
          <div class="fighter-popup-stat-bar"><div class="fighter-popup-stat-fill" style="width:${w}%;background:${s.color}"></div></div>
          <span class="fighter-popup-stat-val" style="color:${valColor};font-weight:${val>=75?700:400}">${val}${sg > 0 ? `<span style="color:#2ecc71;font-size:11px">+${sg}</span>` : ''}</span>
        </div>`;
      });
      html += `</div>`;

      // Potential & Condition
      if (isRoster || isFree) {
        const potPct = getPotentialPct(c);
        const potColor = potPct >= 90 ? '#e74c3c' : potPct >= 70 ? '#f39c12' : '#2ecc71';
        const condPct = c.condition || 0;
        const condCls = condPct > 66 ? '#2ecc71' : condPct > 33 ? '#f39c12' : '#e74c3c';
        html += `<div class="fighter-popup-section" style="display:flex;gap:16px;font-size:13px;margin-bottom:12px">
          <div style="flex:1">
            <span style="color:var(--text-dim)">開発率</span>
            <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
                <div style="width:${potPct}%;height:100%;background:${potColor};border-radius:3px"></div>
              </div>
              <span style="color:${potColor};font-weight:700">${potPct}%</span>
            </div>
          </div>
          <div style="flex:1">
            <span style="color:var(--text-dim)">体調</span>
            <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
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
          <div style="padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:4px">
            <span style="color:var(--text-dim)">人気</span><br>
            <strong style="color:var(--text);font-size:16px">${c.popularity}</strong>
          </div>
          <div style="padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:4px">
            <span style="color:var(--text-dim)">給与</span><br>
            <strong style="color:var(--text);font-size:13px">${getSalary(c)}万/週</strong>
          </div>
        </div>`;
      }
      if (isFree) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);margin-bottom:10px">
          <span>人気: <strong style="color:var(--text)">${c.popularity}</strong></span>
          <span style="margin-left:12px">給与見込: <strong style="color:var(--text)">${getSalary(c)}万/週</strong></span>
        </div>`;
      }
      if (!isRoster && !isFree && c.popularity !== undefined) {
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);margin-bottom:10px">
          <span>人気: <strong style="color:var(--text)">${c.popularity}</strong></span>
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
          html += `<div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:4px">
            🎓 <span style="color:var(--text-dim)">担当コーチ:</span>
            <span class="flink" onclick="event.stopPropagation();closeFighterPopup();setTimeout(()=>showCoachTooltip(${coach.id}),200)" style="display:inline-flex;align-items:center;gap:4px">${coachPortraitImg(coach, 18)} ${coach.name}</span>
            <span style="color:var(--text-dim);font-size:12px;margin-left:6px">(${coach.specialty === 'mental' ? `回復+${coach.condBonus} 怪我-${Math.round((coach.injuryReduce||0.5)*100)}%` : coach.specialty === 'mq' ? `MQ+${coach.mqBonus}` : coach.specialty === 'pop' ? `人気+${coach.popBonus}` : `成長×${coach.growthMult}`})</span>
          </div>`;
        } else {
          html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:4px">
            🎓 担当コーチ: なし
          </div>`;
        }
      }

      // Traits section
      if (c.traits && c.traits.length > 0) {
        html += '<div class="fighter-popup-section" style="margin-bottom:10px"><div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-bottom:8px">固有特性</div>';
        c.traits.forEach(t => {
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
        html += `<div class="fighter-popup-section" style="font-size:13px;color:var(--text-sub);line-height:1.7;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${sm.color}44;margin-top:4px">
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

      html += `<div style="margin-bottom:14px">
        <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:var(--gold);color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">戦績</span>
          通算成績
        </h5>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
          <div style="padding:10px 4px;background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.2);border-radius:6px">
            <div style="font-size:24px;font-weight:900;color:#2ecc71">${wins}</div>
            <div style="font-size:11px;color:var(--text-dim)">勝利</div>
          </div>
          <div style="padding:10px 4px;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:6px">
            <div style="font-size:24px;font-weight:900;color:#e74c3c">${losses}</div>
            <div style="font-size:11px;color:var(--text-dim)">敗北</div>
          </div>
          <div style="padding:10px 4px;background:rgba(176,184,196,0.08);border:1px solid rgba(176,184,196,0.2);border-radius:6px">
            <div style="font-size:24px;font-weight:900;color:#b0b8c4">${draws}</div>
            <div style="font-size:11px;color:var(--text-dim)">引分</div>
          </div>
          <div style="padding:10px 4px;background:rgba(241,196,15,0.08);border:1px solid rgba(241,196,15,0.2);border-radius:6px">
            <div style="font-size:24px;font-weight:900;color:var(--gold)">${winRate}%</div>
            <div style="font-size:11px;color:var(--text-dim)">勝率</div>
          </div>
        </div>
      </div>`;

      // ── Build comprehensive career timeline ──
      const timeline = [];

      // 1) Determine original organization
      const ORIG_ORG_MAP = {};
      ['empress','nova','crescent'].forEach(orgId => {
        (ORG_ASSIGN[orgId] || []).forEach(id => { ORIG_ORG_MAP[id] = orgId; });
      });
      (ORG_ASSIGN.free || []).forEach(id => { ORIG_ORG_MAP[id] = 'free'; });
      // Draft picks → player org
      const draftFixed = DRAFT_CONFIG.fixedIds || [];
      const draftPicks = DRAFT_CONFIG.candidateIds || [];
      draftFixed.forEach(id => { if (!ORIG_ORG_MAP[id]) ORIG_ORG_MAP[id] = 'player_draft'; });

      const origOrg = ORIG_ORG_MAP[c.id];
      const pOrgName = G.orgName || 'プレイヤー団体';
      const orgNames = {
        empress: '👑 エンプレスリング', nova: '⚡ NOVA', crescent: '🌙 クレセント',
        free: '🆓 フリーエージェント', player_draft: `🏠 ${pOrgName}（ドラフト）`
      };

      // Debut entry
      const debutAge = c.age !== undefined ? Math.max(16, c.age - (G.season || 1) + 1) : 16;
      timeline.push({
        sort: 0, season: 1, week: 0,
        icon: 'デ', color: '#3498db',
        text: `デビュー（${debutAge}歳）`,
        detail: origOrg ? `${orgNames[origOrg] || origOrg} 所属として活動開始` : 'プロレスラーとしてキャリア開始'
      });

      // If originally in another org but now in player org, show initial org
      if (origOrg && origOrg !== 'player_draft' && origOrg !== 'free' && isRoster) {
        timeline.push({
          sort: 0.5, season: 1, week: 0,
          icon: '所', color: '#9b59b6',
          text: `${orgNames[origOrg] || origOrg} 所属`,
          detail: 'シーズン1開始時の所属団体'
        });
      }

      // If drafted as initial member
      if (origOrg === 'player_draft') {
        timeline.push({
          sort: 0.5, season: 1, week: 0,
          icon: '指', color: 'var(--gold)',
          text: `${pOrgName}にドラフト指名`,
          detail: '新団体設立時の初期メンバーとして選出'
        });
      }

      // 2) Transfer/event log entries
      const events = (G.transferLog || []).filter(e => e.fighterId === c.id || e.targetId === c.id);
      events.forEach(e => {
        const s = e.season || 0;
        const w = e.week || 0;
        let icon = '●'; let color = 'var(--text-sub)';
        let text = e.text || e.msg || '';
        let detail = '';
        if (e.type === '🤝' || (text && text.includes('引き抜き'))) {
          icon = '移'; color = '#e67e22'; detail = '他団体への移籍';
        } else if (e.type === '📥' || (text && text.includes('契約'))) {
          icon = '契'; color = '#2ecc71'; detail = '新規契約';
        } else if (e.type === '🚪' || (text && text.includes('解雇'))) {
          icon = '解'; color = '#e74c3c'; detail = '契約解除';
        } else if (e.type === '⭐') {
          icon = '★'; color = '#f1c40f'; detail = 'エース指名';
        }
        timeline.push({ sort: s * 100 + w, season: s, week: w, icon, color, text: text || e.type || 'イベント', detail });
      });

      // 3) All match history
      const charMatches = (G.matchHistory || []).filter(m => m.left === c.id || m.right === c.id);

      // Title-related entries
      const titleMatches = charMatches.filter(m => m.isTitle);
      titleMatches.forEach(m => {
        const isWinner = m.winner === c.id;
        const oppId = m.left === c.id ? m.right : m.left;
        const opp = ALL_CHARS.find(ch => ch.id === oppId);
        const opName = opp ? opp.name : '不明';
        const s = m.season || 0;
        const w = m.week || 0;
        timeline.push({
          sort: s * 100 + w, season: s, week: w,
          icon: isWinner ? '勝' : '敗',
          color: isWinner ? 'var(--gold)' : '#e74c3c',
          text: isWinner ? `タイトルマッチ勝利 vs ${opName}` : `タイトルマッチ敗北 vs ${opName}`,
          detail: isWinner ? '王座を獲得！' : 'タイトル挑戦するも敗退',
          isTitle: true
        });
      });

      // Current champion status
      if (isChamp) {
        timeline.push({
          sort: 99999, season: G.season, week: G.week,
          icon: '王', color: 'var(--gold)',
          text: `現世界王者（${G.titles.world.defenses}度防衛中）`,
          detail: '現在進行中',
          isTitle: true
        });
      }

      // Ace designation
      if (isAce) {
        timeline.push({
          sort: 99998, season: G.season, week: G.week,
          icon: '★', color: '#f1c40f',
          text: '団体エース',
          detail: `現在${pOrgName}のエースとして活動中`
        });
      }

      // Current affiliation
      if (isRoster && origOrg !== 'player_draft') {
        timeline.push({
          sort: (c.joinedSeason || 1) * 100, season: c.joinedSeason || G.season, week: 0,
          icon: '団', color: '#2ecc71',
          text: `${pOrgName}に加入`,
          detail: origOrg === 'free' ? 'フリーエージェントから契約' : origOrg ? `${orgNames[origOrg] || origOrg} から移籍` : '入団'
        });
      }
      if (isFree) {
        timeline.push({
          sort: 99997, season: G.season, week: G.week,
          icon: 'FA', color: '#8bc4f0',
          text: 'フリーエージェント',
          detail: '現在どの団体にも所属していない'
        });
      }

      // Sort timeline chronologically
      timeline.sort((a, b) => a.sort - b.sort);

      // ── Render Timeline ──
      html += `<div style="margin-bottom:14px">
        <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:#3498db;color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">経歴</span>
          キャリア年表
        </h5>
        <div style="position:relative;padding-left:28px;border-left:2px solid rgba(255,255,255,0.08);margin-left:10px">`;

      timeline.forEach((t, idx) => {
        const seasonInfo = t.season ? `${t.season}年目${t.week ? ` W${t.week}` : ''}` : '';
        const isLast = idx === timeline.length - 1;
        html += `<div style="position:relative;margin-bottom:${isLast ? 0 : 14}px">
          <div style="position:absolute;left:-37px;top:2px;width:22px;height:22px;border-radius:50%;background:var(--bg-card);border:2px solid ${t.color};display:flex;align-items:center;justify-content:center;font-size:12px">${t.icon}</div>
          <div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${t.color}44">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="font-size:13px;font-weight:700;color:${t.isTitle ? 'var(--gold)' : 'var(--text)'}">${t.text}</span>
              <span style="font-size:11px;color:var(--text-dim);flex-shrink:0;margin-left:8px">${seasonInfo}</span>
            </div>
            ${t.detail ? `<div style="font-size:12px;color:var(--text-sub);line-height:1.5">${t.detail}</div>` : ''}
          </div>
        </div>`;
      });

      html += `</div></div>`;

      // ── Title History Summary ──
      if (titleMatches.length > 0 || isChamp) {
        html += `<div style="margin-bottom:14px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="background:#f39c12;color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">タイトル</span>
            タイトル戦績
          </h5>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center;margin-bottom:8px">
            <div style="padding:8px;background:rgba(241,196,15,0.08);border:1px solid rgba(241,196,15,0.2);border-radius:6px">
              <div style="font-size:22px;font-weight:900;color:var(--gold)">${titleMatches.filter(m => m.winner === c.id).length}</div>
              <div style="font-size:11px;color:var(--text-dim)">タイトル戦 勝利</div>
            </div>
            <div style="padding:8px;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:6px">
              <div style="font-size:22px;font-weight:900;color:#e74c3c">${titleMatches.filter(m => m.winner !== c.id).length}</div>
              <div style="font-size:11px;color:var(--text-dim)">タイトル戦 敗北</div>
            </div>
          </div>
          ${isChamp ? `<div style="padding:10px 14px;background:rgba(212,168,67,0.1);border:1px solid rgba(212,168,67,0.3);border-radius:6px;font-size:14px;color:var(--gold);font-weight:700;text-align:center">👑 現世界王者 — ${G.titles.world.defenses}度防衛中</div>` : ''}
        </div>`;
      }

      // ── Full Match History (all matches, grouped by season) ──
      if (charMatches.length > 0) {
        // Group by season
        const matchesBySeason = {};
        charMatches.forEach(m => {
          const s = m.season || 1;
          if (!matchesBySeason[s]) matchesBySeason[s] = [];
          matchesBySeason[s].push(m);
        });

        html += `<div style="margin-bottom:10px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="background:#9b59b6;color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">全試合</span>
            試合履歴（全${charMatches.length}戦）
          </h5>`;

        // Show seasons in reverse order (latest first)
        const seasons = Object.keys(matchesBySeason).sort((a,b) => b - a);
        seasons.forEach(s => {
          const matches = matchesBySeason[s];
          const sWins = matches.filter(m => m.winner === c.id).length;
          const sLosses = matches.filter(m => m.winner !== c.id && m.winner !== 0 && m.winner !== undefined).length;
          const sDraws = matches.length - sWins - sLosses;

          html += `<details ${s == G.season ? 'open' : ''} style="margin-bottom:8px">
            <summary style="font-size:13px;color:var(--text-sub);cursor:pointer;padding:6px 10px;background:rgba(255,255,255,0.03);border-radius:4px;display:flex;align-items:center;gap:8px;user-select:none">
              <span style="font-weight:700">${s}年目</span>
              <span style="font-size:12px">${matches.length}試合</span>
              <span style="font-size:12px;color:#2ecc71">${sWins}勝</span>
              <span style="font-size:12px;color:#e74c3c">${sLosses}敗</span>
              ${sDraws > 0 ? `<span style="font-size:12px;color:#b0b8c4">${sDraws}分</span>` : ''}
            </summary>
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;padding-left:4px">`;

          matches.reverse().forEach(m => {
            const isWinner = m.winner === c.id;
            const isDraw = m.winner === 0 || m.winner === undefined;
            const oppId = m.left === c.id ? m.right : m.left;
            const opp = ALL_CHARS.find(ch => ch.id === oppId);
            const oppName = opp ? opp.name : '不明';
            const result = isDraw ? '△' : (isWinner ? '○' : '×');
            const resultColor = isDraw ? '#b0b8c4' : (isWinner ? '#2ecc71' : '#e74c3c');
            const weekStr = m.week ? `W${m.week}` : '';
            const finInfo = m.finType ? ` [${m.finType}]` : '';
            const mqInfo = m.mq !== undefined ? ` MQ:${m.mq}` : '';
            html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.02);border-radius:4px;font-size:13px">
              <span style="color:${resultColor};font-weight:900;width:18px;text-align:center">${result}</span>
              <span style="flex:1;color:var(--text-sub)">vs ${oppName}${m.isTitle ? ' 🏆' : ''}${finInfo}</span>
              <span style="color:var(--text-dim);font-size:11px;white-space:nowrap">${weekStr}${mqInfo}</span>
            </div>`;
          });

          html += `</div></details>`;
        });

        html += `</div>`;
      } else {
        html += `<div style="font-size:13px;color:var(--text-dim);padding:14px;text-align:center;background:rgba(255,255,255,0.02);border-radius:6px">まだ試合記録がありません</div>`;
      }

      // ── Detailed Event Log ──
      if (events.length > 0) {
        html += `<div style="margin-bottom:10px">
          <h5 style="font-size:14px;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="background:#e67e22;color:var(--bg);padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700">ログ</span>
            移籍・イベントログ（全${events.length}件）
          </h5>
          <div style="display:flex;flex-direction:column;gap:4px">`;
        events.reverse().forEach(e => {
          const seasonInfo = e.season ? `${e.season}年目${e.week ? ` W${e.week}` : ''}` : '';
          html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:rgba(255,255,255,0.02);border-radius:4px;font-size:12px;color:var(--text-sub)">
            <span>${e.type || '📌'} ${e.text || e.msg || JSON.stringify(e)}</span>
            <span style="color:var(--text-dim);font-size:11px;flex-shrink:0;margin-left:8px">${seasonInfo}</span>
          </div>`;
        });
        html += `</div></div>`;
      }
    }

    // ══════ TAB 2: Management (Roster only) ══════
    if (tabIdx === 2 && isRoster) {
      // Release button
      if (!c.isRental) {
        const inCard = G.showCard.some(m => m.left === c.id || m.right === c.id);
        html += `<div style="margin-top:8px;padding:14px;background:rgba(196,30,58,0.06);border:1px solid rgba(196,30,58,0.15);border-radius:6px">
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
      const discount = getFacilityScoutDiscount();
      const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
      const signingCost = Engine.scout.getSigningCost(c, discount);
      const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c);
      const canAfford = G.funds >= signingCost;
      html += `<div style="margin-top:12px;padding:14px;background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.15);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">
          <span style="color:var(--text-sub)">契約金</span>
          <span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${signingCost.toLocaleString()}万</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;color:var(--text-dim)">
          <span>ランク: <span style="color:${tierCfg.color}">${tierCfg.label}</span></span>
          <span>給与: ${getSalary(c)}万/週</span>
          ${discount > 0 ? `<span style="color:#f39c12">割引${discount}%</span>` : ''}
        </div>
        ${!canNeg
          ? `<div style="text-align:center;font-size:13px;color:#e74c3c;padding:8px">⛔ 知名度不足（団体人気 ${tierCfg.reqPop} 以上で交渉可能）</div>`
          : `<button onclick="closeFighterPopup();signFighter(${c.id})" style="width:100%;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:rgba(46,204,113,0.2);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:6px" ${canAfford?'':'disabled'}>✍ この選手と契約する</button>
          ${!canAfford ? '<div style="font-size:11px;color:#e74c3c;text-align:center;margin-top:6px">💸 資金不足</div>' : ''}`
        }
      </div>`;
    }
    if (isScoutCandidate && tabIdx === 0) {
      const discount = getFacilityScoutDiscount();
      const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
      const signingCost = Engine.scout.getSigningCost(c, discount);
      const canNeg = Engine.scout.canNegotiate(G.orgPop || 0, c);
      const canAfford = G.funds >= signingCost;
      const picks = G.scoutPicks || [];
      const maxPicks = G.scoutMaxPicks || 3;
      const slotsLeft = picks.length < maxPicks;
      html += `<div style="margin-top:12px;padding:14px;background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.15);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">
          <span style="color:var(--text-sub)">契約金</span>
          <span style="color:var(--gold);font-weight:700;font-size:16px">💰 ${signingCost.toLocaleString()}万</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:12px;color:var(--text-dim)">
          <span>ランク: <span style="color:${tierCfg.color}">${tierCfg.label}</span></span>
          <span>獲得枠: ${picks.length}/${maxPicks}</span>
          ${discount > 0 ? `<span style="color:#f39c12">割引${discount}%</span>` : ''}
        </div>
        ${c._hasCompetition ? `<div style="font-size:11px;color:#e74c3c;margin-bottom:8px;padding:4px 8px;background:rgba(231,76,60,0.1);border-radius:4px">⚔ 他団体が注目 — 競合時: ${Math.round(signingCost * (c._compMultiplier || 1.5))}万</div>` : ''}
        ${!canNeg
          ? `<div style="text-align:center;font-size:13px;color:#e74c3c;padding:8px">⛔ 知名度不足（団体人気 ${tierCfg.reqPop} 以上で交渉可能）</div>`
          : !slotsLeft
          ? `<div style="text-align:center;font-size:13px;color:var(--text-dim);padding:8px">獲得枠上限に達しています</div>`
          : `<div style="display:flex;gap:8px">
              <button onclick="closeFighterPopup();scoutPick(${c.id})" style="flex:1;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:rgba(46,204,113,0.2);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:6px" ${canAfford?'':'disabled'}>✍ 獲得指名</button>
              <button onclick="closeFighterPopup();scoutResolve(${c.id},'skip')" style="padding:10px 16px;font-size:13px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);color:var(--text-dim);border-radius:6px">見送り</button>
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
}

function closeFighterPopup() {
  window._fpTab = 0; // Reset to first tab
  document.getElementById('fighterPopupOverlay').classList.remove('active');
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
  const maxMatches = isSpecialShow(G.week) || isPPV(G.week) ? 6 : 4;
  const card = [];
  while (card.length < maxMatches) card.push({left:0, right:0, isTitle:false});
  const sorted = [...G.roster].filter(c => !c.injury).sort((a,b) => ov(b) - ov(a));
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
    card[i] = {left: left.id, right: right.id, isTitle: i === 0 && hasChamp};
  }
  G = { ...G, showCard: card };
}

function onCardSelect(slotIndex, side, newId) {
  App.setShowCardSlot(slotIndex, side, newId);
}

function toggleTitle(slotIndex) {
  const m = G.showCard[slotIndex];
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
  const color = stars >= 4.5 ? '#f0d078' : stars >= 3.5 ? '#2ecc71' : stars >= 2.5 ? '#e7e9ee' : '#999';
  return `<span style="color:${color};font-size:13px;letter-spacing:1px">${s}</span>`;
}

// (applyMQPopularity / applyShowPopularity moved to Engine — no longer needed here)

// Show prep entry point (routes through App for state changes)
function startShowPrep() {
  if (G.offSeason || G.weekPhase !== 'manage' || !isShowWeek(G.week)) { Audio.play('error'); return; }
  // Calculate best venue immutably
  let venueIdx = 0;
  for (let i = VENUES.length - 1; i >= 0; i--) {
    if (G.orgPop >= VENUES[i].popReq) { venueIdx = i; break; }
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
  showScreen('show');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => { if (b.textContent.includes('興行準備')) b.classList.add('active'); });
  renderShowPrep();
}

// Legacy aliases for UI onclick handlers
function executeShow() { App.executeShow(); }
function closeShowResult() { App.closeShowResult(); }
function doProcessWeek() { App.processWeek(); }
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
    if (c.condition <= 30) action = 'rest';
  }
  const actionLabels = {practice:'練習',promo:'プロモ',rest:'休養',balance:'バランス','療養':'療養',intensive:'⚡強化'};
  const label = actionLabels[action] || action;
  // Update the cell in the table
  const cell = document.getElementById('action-' + fighterId);
  if (cell) cell.innerHTML = `<span class="sched-tag ${action}">${label}</span>`;
}
function advanceWeek() { App.advanceWeek(); }

// ═══ Battle Engine postMessage Listener (v0.86) ═══
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'MATCH_RESULT') {
    App.receiveBattleResult(e.data);
  }
});

// ═══ Match Preview Renderer (v0.86) ═══
function renderMatchPreview() {
  const sp = App._showPreview;
  if (!sp) return;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const special = isSpecialShow(G.week);
  const ppv = isPPV(G.week);
  const showName = ppv ? '🏆 PPV GRAND FINAL' : special ? '⭐ 特別興行' : `定期興行 #${G.totalShows + 1}`;
  const resolved = sp.results.filter(r => r !== null).length;
  const total = sp.validMatches.length;

  let html = `<div class="show-result-title">${showName}</div>`;
  html += `<div style="text-align:center;margin-bottom:16px;color:var(--text-sub);font-size:12px">試合カード — ${resolved}/${total} 完了</div>`;

  sp.validMatches.forEach((m, idx) => {
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) return;
    const result = sp.results[idx];
    const isResolved = result !== null;
    const titleTag = m.isTitle ? '<span style="color:var(--gold);font-size:12px;margin-left:6px">🏆 TITLE</span>' : '';

    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:8px;${isResolved ? 'opacity:0.6' : ''}">`;
    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">`;
    html += `<div style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600">`;
    html += `${portraitImg(charL.id, 80)}`;
    html += `<span style="color:var(--blue)">${charL.name}</span>`;
    html += `<span style="color:var(--text-dim);margin:0 8px">vs</span>`;
    html += `<span style="color:var(--red)">${charR.name}</span>${titleTag}`;
    html += `${portraitImg(charR.id, 80)}`;
    html += `</div>`;
    html += `<div style="font-size:12px;color:var(--text-dim)">第${idx + 1}試合</div>`;
    html += `</div>`;

    if (isResolved) {
      const wName = result.winner === 'draw' ? '引き分け' : result.winner === 'left' ? charL.name : charR.name;
      const mqColor = result.mq >= 70 ? 'var(--gold)' : result.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';
      html += `<div style="display:flex;align-items:center;gap:12px;font-size:11px">`;
      html += `<span style="color:var(--green)">✔ ${wName}${result.finType ? ' (' + result.finType + ')' : ''}</span>`;
      html += `<span style="color:${mqColor}">MQ: ${result.mq}</span>`;
      html += `</div>`;
    } else {
      html += `<div style="display:flex;gap:8px;margin-top:4px">`;
      html += `<button class="btn btn-blue" style="flex:1;font-size:12px;padding:6px 0" onclick="App.watchMatch(${idx})">🎬 この試合を観る</button>`;
      html += `<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:var(--bg-mid);color:var(--text-sub)" onclick="App.skipMatch(${idx})">⏭ スキップ</button>`;
      html += `</div>`;
    }
    html += `</div>`;
  });

  // Skip all button (only if there are unresolved matches)
  const remaining = sp.results.filter(r => r === null).length;
  if (remaining > 0) {
    html += `<div style="margin-top:16px;text-align:center">`;
    html += `<button class="btn btn-gold" style="width:100%;padding:12px 0;font-size:14px" onclick="App.skipAllMatches()">⏩ 全試合スキップ（${remaining}試合）</button>`;
    html += `</div>`;
  }

  box.innerHTML = html;
  overlay.classList.add('active');
}

// ── Show Result Renderer ────────────────────────────────
function renderShowResult(results, injuryResults) {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  const special = isSpecialShow(G.week);
  const ppv = isPPV(G.week);
  const showName = ppv ? '🏆 PPV GRAND FINAL' : special ? '⭐ 特別興行' : `定期興行 #${G.totalShows}`;

  let html = `<div class="show-result-title">${showName}</div>`;
  const avgMQ = Math.round(results.reduce((s,r) => s + r.mq, 0) / results.length);
  const heat = getHeatLevel();
  html += `<div style="text-align:center;margin-bottom:18px">
    <div style="font-size:14px;color:var(--text-sub)">${VENUES[G.showVenue].name}</div>
    <div style="margin-top:6px">${mqStars(avgMQ)} <span style="font-size:15px;color:var(--text-sub)">平均MQ: ${avgMQ}</span></div>
    <div style="margin-top:6px;font-size:13px"><span style="color:${heat.color}">${heat.emoji} Heat: ${heat.label}</span> <span style="color:var(--text-dim)">（集客×${heat.mult}）</span></div>
  </div>`;

  results.forEach((r, i) => {
    const isMain = i === 0;
    const isDraw = r.winner === 'draw';
    const leftIsWinner = r.winner === 'left';
    const rightIsWinner = r.winner === 'right';

    html += `<div class="match-result" style="${isMain ? 'border-left-color:var(--gold);background:rgba(212,168,67,0.05)' : ''}">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">${isMain ? '★ メインイベント' : `第${i+1}試合`}${r.isTitleMatch ? ' <span style="color:var(--gold)">🏆 タイトルマッチ</span>' : ''}${r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">${r.rivalryBonus.emoji}${r.rivalryBonus.label}</span>` : ''}${r.coachMQBonus ? ' <span style="color:#e67e22">(コーチ+' + r.coachMQBonus + ')</span>' : ''}</div>`;

    if (isDraw) {
      html += `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        ${portraitImg(r.left.id, 80, 'portrait-match')}
        <span style="font-size:17px">${fLink(r.left, {source:'roster'})}</span>
        <span style="font-size:14px;padding:3px 10px;border-radius:4px;background:rgba(243,156,18,0.2);border:1px solid rgba(243,156,18,0.4);color:#f39c12;font-weight:600">DRAW</span>
        <span style="font-size:17px">${fLink(r.right, {source:'roster'})}</span>
        ${portraitImg(r.right.id, 80, 'portrait-match')}
      </div>
      <div style="margin-top:6px;font-size:13px;color:var(--text-sub)">${r.finType} / ${r.turns}ターン</div>
      <div style="margin-top:4px">${mqStars(r.mq)} <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}${r.isTitleMatch ? ' <span style="color:var(--gold)">(王座+15)</span>' : ''}${r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>` : ''}${r.coachMQBonus ? ' <span style="color:#e67e22">(コーチ+' + r.coachMQBonus + ')</span>' : ''}</span></div>`;
    } else {
      const winnerF = leftIsWinner ? r.left : r.right;
      html += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${portraitImg(r.left.id, leftIsWinner ? 90 : 70, 'portrait-match' + (leftIsWinner ? ' winner' : ' loser'))}
        <span style="font-size:${leftIsWinner?20:14}px;${leftIsWinner?'':'opacity:0.7'}">${fLink(r.left, {source:'roster', bold:leftIsWinner})}</span>
        <span style="font-size:13px;color:var(--text-dim)">vs</span>
        <span style="font-size:${rightIsWinner?20:14}px;${rightIsWinner?'':'opacity:0.7'}">${fLink(r.right, {source:'roster', bold:rightIsWinner})}</span>
        ${portraitImg(r.right.id, rightIsWinner ? 90 : 70, 'portrait-match' + (rightIsWinner ? ' winner' : ' loser'))}
      </div>
      <div style="margin-top:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="display:inline-block;padding:4px 14px;border-radius:4px;font-size:14px;font-weight:700;
          background:linear-gradient(135deg,var(--gold),#b8912e);color:var(--bg-dark)">🏆 ${winnerF.name} 勝利</span>
        <span style="font-size:13px;color:var(--text-sub)">${r.finType}${r.finMove ? `（${r.finMove}）` : ''} / ${r.turns}ターン</span>
      </div>
      <div style="margin-top:4px">${mqStars(r.mq)} <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}${r.isTitleMatch ? ' <span style="color:var(--gold)">(王座+15)</span>' : ''}${r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>` : ''}${r.coachMQBonus ? ' <span style="color:#e67e22">(コーチ+' + r.coachMQBonus + ')</span>' : ''}</span></div>`;
    }

    // HP bars
    const lPct = Math.round(r.hpLeft.final / r.hpLeft.max * 100);
    const rPct = Math.round(r.hpRight.final / r.hpRight.max * 100);
    html += `<div style="display:flex;gap:16px;margin-top:10px;font-size:12px;color:var(--text-sub)">
      <div style="flex:1">${fLink(r.left, {source:'roster', bold:false, size:'12px'})}: HP ${r.hpLeft.final}/${r.hpLeft.max}
        <div style="height:5px;background:rgba(255,255,255,0.08);border-radius:3px;margin-top:3px;overflow:hidden">
          <div style="width:${lPct}%;height:100%;background:${lPct>30?'#2ecc71':lPct>10?'#f39c12':'#e74c3c'};border-radius:3px"></div>
        </div>
      </div>
      <div style="flex:1">${fLink(r.right, {source:'roster', bold:false, size:'12px'})}: HP ${r.hpRight.final}/${r.hpRight.max}
        <div style="height:5px;background:rgba(255,255,255,0.08);border-radius:3px;margin-top:3px;overflow:hidden">
          <div style="width:${rPct}%;height:100%;background:${rPct>30?'#2ecc71':rPct>10?'#f39c12':'#e74c3c'};border-radius:3px"></div>
        </div>
      </div>
    </div>`;

    html += `<details style="margin-top:8px"><summary style="font-size:12px;color:var(--text-dim);cursor:pointer">試合ログを見る</summary>
        <div style="font-size:11px;color:var(--text-sub);margin-top:4px;max-height:200px;overflow-y:auto">
          ${r.log.map(l => `<div style="padding:2px 0">${l}</div>`).join('')}
        </div>
      </details>
    </div>`;
  });

  html += '<div class="btn-row" style="margin-top:16px;justify-content:center">';
  if (injuryResults.length > 0) {
    html += `<div style="width:100%;margin-bottom:12px;padding:10px 14px;background:rgba(214,48,49,0.1);border:1px solid rgba(214,48,49,0.3);border-radius:6px">
      <div style="font-size:13px;font-weight:700;color:#e17055;margin-bottom:6px">🏥 負傷報告</div>`;
    injuryResults.forEach(ir => {
      html += `<div style="font-size:13px;color:var(--text-sub);padding:3px 0">
        <span style="color:${ir.injury.color}">${ir.injury.type}</span> ${fLink(ir, {source:'roster', size:'13px'})} — 全治${ir.injury.weeksLeft}週間
      </div>`;
    });
    html += '</div>';
  }
  html += '<button class="btn btn-gold" onclick="closeShowResult()">結果を確認 →</button>';
  html += '</div>';
  box.innerHTML = html;
  overlay.classList.add('active');
}

// Legacy function aliases for onclick handlers in UI
function signFighter(id) { App.signFighter(id); }
function releaseFighter(id) { App.releaseFighter(id); }
function scoutPick(id) { App.scoutEventPick(id); }
function scoutResolve(id, choice) { App.scoutEventResolve(id, choice); }
function scoutFinish() { App.scoutEventFinish(); }
function hireCoach(id) { App.hireCoach(id); }
function fireCoach(id) { App.fireCoach(id); }
function upgradeFacility(id) { App.upgradeFacility(id); }
function autoSave() { Storage.autoSave(); }
function loadAutoSave() { Storage.loadAutoSave(); refreshAll(); }
function getAutoSaveInfo() { return Storage.getAutoSaveInfo(); }
function getSaveInfo(slot) { return Storage.getSaveInfo(slot); }

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
function designateAce(fighterId) {
  Audio.play('fanfare');
  G = Engine.ace.designate(G, fighterId);
  G.gameLog = [...G.gameLog, `⭐ ${G.roster.find(c => c.id === fighterId)?.name}をエースに認定`];
  Storage.autoSave();
  refreshAll();
}
function revokeAce() {
  Audio.play('deselect');
  const aceName = G.roster.find(c => c.id === G.aceDesignation)?.name || '不明';
  G = Engine.ace.revoke(G);
  G.gameLog = [...G.gameLog, `エース認定解除: ${aceName}`];
  Storage.autoSave();
  refreshAll();
}
function playerPoachFighter(aiOrgId, fighterId) {
  Audio.play('stamp');
  const result = Engine.transfer.playerPoach(G, aiOrgId, fighterId);
  G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
  Storage.autoSave();
  refreshAll();
}

// ── Phase D: Event UI Functions ──
function executeEvent() {
  const ev = G.pendingEvent;
  if (!ev) return;
  Audio.play(ev.type === 'war' ? 'war' : 'bell');
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week));
  const events = [];
  let eventWon = false;

  if (ev.type === 'war') {
    const card = Engine.event.makeWarCard(G, ev.opponentOrgId);
    const warResult = Engine.event.resolveWar(rng, G, card);
    warResult.results.forEach((r, i) => {
      const winner = r.playerWon ? r.playerFighter.name : r.aiFighter.name;
      const icon = r.playerWon ? '🔵' : '🔴';
      events.push(`  ${icon} 第${i+1}試合: ${r.playerFighter.name} vs ${r.aiFighter.name} → ${winner}勝利 (MQ${r.mq})`);
    });
    const outcome = Engine.event.applyWarOutcome(G, warResult.playerWins, warResult.aiWins, ev.opponentOrgId);
    eventWon = warResult.playerWins > warResult.aiWins;
    G = { ...outcome.state, gameLog: [...G.gameLog, ...events, ...outcome.events] };

  } else if (ev.type === 'challenge') {
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

// ── Phase D: Rental UI Functions ──
function requestRental(fighterId, fromOrgId) {
  Audio.play('transfer');
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 500 + G.week));
  const result = Engine.rental.requestRental(rng, G, fighterId, fromOrgId);
  G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
  Storage.autoSave();
  refreshAll();
}

// Legacy aliases for Engine functions used in UI rendering
function getCoachSalaryTotal() { return Engine.coach.getSalaryTotal(G); }
function getFacilityScoutDiscount() { return Engine.facility.getScoutDiscount(G); }
function getFacilityGrowthMult() { return Engine.facility.getGrowthMult(G); }
function getFacilityConditionBonus() { return Engine.facility.getConditionBonus(G); }
function getFacilityInjuryReduction() { return Engine.facility.getInjuryReduction(G); }
function getFacilityPromoBonus() { return Engine.facility.getPromoBonus(G); }
function getFacilityBroadcastBonus() { return Engine.facility.getBroadcastBonus(G); }
function getFacilityRestBonus() { return Engine.facility.getRestBonus(G); }
function unassignFromCoach(charId) { G = { ...G, coachAssign: Engine.coach.unassignFromCoach(G, charId) }; }
function assignToCoach(coachId, charId) {
  const unassigned = Engine.coach.unassignFromCoach(G, charId);
  const { coachAssign, success } = Engine.coach.assignToCoach({ ...G, coachAssign: unassigned }, coachId, charId);
  if (success) G = { ...G, coachAssign };
  return { coachAssign, success };
}
function getCoachAssignees(coachId) { return Engine.coach.getCoachAssignees(G, coachId); }
function calcWeeklySalary() { return Engine.economy.calcWeeklySalary(G.roster); }
function calcFixedCosts() { return Engine.economy.calcFixedCosts(); }
function getSponsorIncome() { return Engine.economy.getSponsorIncome(G.orgPop); }
function getBroadcastIncome() { return Engine.economy.getBroadcastIncome(G.orgPop); }
function calcAttendance(venueIdx, mainPop, hasTitleMatch) { return Engine.economy.calcAttendance(G, venueIdx, mainPop, hasTitleMatch); }
function calcShowRevenue(venueIdx, attendance) { return Engine.economy.calcShowRevenue(G.roster, venueIdx, attendance); }
function showScreen(id, evt) {
  Audio.play('click');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screenEl = document.getElementById(`screen-${id}`);
  if (screenEl) screenEl.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const t = evt?.currentTarget || evt?.target || null;
  const btn = t?.closest ? t.closest('.nav-btn') : t;
  if (btn && btn.classList) btn.classList.add('active');
  // v0.9: Auto-render screens that need fresh data
  if (id === 'ranking') renderRanking();
  if (id === 'roster') renderRoster();
  if (id === 'coach') renderCoach();
  if (id === 'scoutEvent') renderScoutEvent();
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

