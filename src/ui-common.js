// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9: UI HELPERS & SHOW PREP (v0.85)                ║
// ╚══════════════════════════════════════════════════════════╝

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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
function renderWarMatchPreview() {
  const wp = App._warPreview;
  if (!wp) return;
  const ev = wp.ev;
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');

  const orgCfg = RIVAL_ORGS.find(o => o.id === ev.opponentOrgId) || {color:'#e74c3c'};

  const resolved = wp.results.filter(r => r !== null).length;
  const total = wp.card.length;

  let html = '';
  html += `<div class="show-result-title" style="color:${orgCfg.color}">⚔ 対抗戦</div>`;
  html += `<div style="text-align:center;margin-bottom:16px;color:var(--text-sub);font-size:12px">${G.orgName || 'プレイヤー団体'} vs ${ev.opponentName} — ${resolved}/${total} 完了</div>`;

  wp.card.forEach((m, idx) => {
    const pf = m.playerFighter;
    const af = m.aiFighter;
    const result = wp.results[idx];
    const isResolved = result !== null;

    html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:8px;${isResolved ? 'opacity:0.6' : ''}">`;
    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">`;
    html += `<div style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600">`;
    html += portraitImg(pf.id, 56);
    html += `<span style="color:var(--blue)">${pf.name}</span>`;
    html += `<span style="color:var(--text-dim);margin:0 4px;font-size:12px">vs</span>`;
    html += `<span style="color:${orgCfg.color}">${af.name}</span>`;
    const aiUrl = getPortraitUrl(af.id);
    if (aiUrl) {
      html += `<img src="${aiUrl}" style="width:56px;height:56px;border-radius:50%;border:2px solid ${orgCfg.color}66;object-fit:cover" alt="">`;
    }
    html += `</div>`;
    html += `<div style="font-size:11px;color:var(--text-dim)">第${idx + 1}試合</div>`;
    html += `</div>`;

    if (isResolved) {
      const wName = result.playerWon ? pf.name : af.name;
      const mqColor = result.mq >= 70 ? 'var(--gold)' : result.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';
      const winIcon = result.playerWon ? '🔵' : '🔴';
      html += `<div style="display:flex;align-items:center;gap:12px;font-size:11px">`;
      html += `<span style="color:${result.playerWon ? 'var(--blue)' : orgCfg.color}">${winIcon} ${wName}${result.finType ? ' (' + result.finType + ')' : ''}</span>`;
      html += `<span style="color:${mqColor}">MQ: ${result.mq}</span>`;
      html += `</div>`;
    } else {
      html += `<div style="display:flex;gap:8px;margin-top:4px">`;
      html += `<button class="btn btn-blue" style="flex:1;font-size:12px;padding:6px 0" onclick="App.warWatchMatch(${idx})">🎬 この試合を観る</button>`;
      html += `<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:var(--bg-mid);color:var(--text-sub)" onclick="App.warSkipMatch(${idx})">⏭ スキップ</button>`;
      html += `</div>`;
    }
    html += `</div>`;
  });

  // Skip all button
  const remaining = wp.results.filter(r => r === null).length;
  if (remaining > 0) {
    html += `<div style="margin-top:16px;text-align:center">`;
    html += `<button class="btn btn-gold" style="width:100%;padding:12px 0;font-size:14px" onclick="App.warSkipAll()">⏩ 全試合スキップ（${remaining}試合）</button>`;
    html += `</div>`;
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

  const orgCfg = RIVAL_ORGS.find(o => o.id === ev.opponentOrgId) || {color:'#e74c3c'};

  // Find enemy ace for dialogue
  const aiOrg = Engine.rival.getOrgInfo(G.aiOrgs, ev.opponentOrgId);
  const enemyAce = aiOrg ? Engine.event.getAce(aiOrg.roster) : (results[0] ? results[0].aiFighter : null);

  let html = '';
  html += `<div class="show-result-title" style="color:${orgCfg.color}">⚔ 対抗戦結果</div>`;
  html += `<div style="text-align:center;margin-bottom:16px;color:var(--text-sub);font-size:13px">${G.orgName || 'プレイヤー団体'} vs ${ev.opponentName}</div>`;

  // Match results
  results.forEach((r, i) => {
    const borderColor = r.playerWon ? 'var(--blue)' : 'var(--red)';
    const resultLabel = r.playerWon ? '<span style="color:var(--blue);font-weight:700">WIN</span>' : '<span style="color:var(--red);font-weight:700">LOSE</span>';
    const mqColor = r.mq >= 70 ? 'var(--gold)' : r.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';

    html += `<div style="background:var(--bg-card);border:1px solid ${borderColor}44;border-left:3px solid ${borderColor};border-radius:6px;padding:10px 12px;margin-bottom:6px">`;
    html += `<div style="display:flex;align-items:center;justify-content:space-between">`;
    html += `<div style="display:flex;align-items:center;gap:6px">`;
    html += `<span style="color:var(--text-dim);font-size:11px;min-width:44px">第${i+1}試合</span>`;
    html += portraitImg(r.playerFighter.id, 36);
    html += `<span style="font-size:12px;font-weight:600;color:var(--blue)">${r.playerFighter.name}</span>`;
    html += `<span style="color:var(--text-dim);font-size:10px">vs</span>`;
    html += `<span style="font-size:12px;font-weight:600;color:${orgCfg.color}">${r.aiFighter.name}</span>`;
    const aiUrl = getPortraitUrl(r.aiFighter.id);
    if (aiUrl) html += `<img src="${aiUrl}" style="width:36px;height:36px;border-radius:50%;border:2px solid ${orgCfg.color}44;object-fit:cover" alt="">`;
    html += `</div>`;
    html += `<div style="text-align:right;min-width:60px">`;
    html += `<div style="font-size:12px">${resultLabel}</div>`;
    html += `<div style="font-size:10px;color:${mqColor}">MQ ${r.mq}</div>`;
    html += `</div></div></div>`;
  });

  // Overall score
  const winLabel = playerWins > aiWins ? '勝ち越し！' : playerWins === aiWins ? '引き分け' : '負け越し…';
  const winColor = eventWon ? 'var(--gold)' : playerWins === aiWins ? 'var(--text-sub)' : 'var(--red)';
  html += `<div style="text-align:center;margin:16px 0 8px;padding:14px;background:linear-gradient(135deg,${eventWon ? 'rgba(212,168,67,0.15)' : 'rgba(196,30,58,0.15)'},transparent);border:1px solid ${eventWon ? 'var(--gold)' : 'var(--red)'}33;border-radius:8px">`;
  html += `<div style="font-size:28px;font-weight:900;color:${winColor}">${playerWins} - ${aiWins}</div>`;
  html += `<div style="font-size:15px;font-weight:700;color:${winColor};margin-top:4px">${winLabel}</div>`;
  html += `</div>`;

  // Post-match dialogue from enemy ace
  if (enemyAce) {
    const dialogue = getWarPostDialogue(enemyAce, G.orgName || 'あんたの団体', eventWon, playerWins, aiWins);
    const portraitUrl = getPortraitUrl(enemyAce.id);
    const dialogueHtml = dialogue.replace(/\n/g, '<br>');
    const emotionBorder = eventWon ? 'var(--blue)' : orgCfg.color;
    const emotionGlow = eventWon ? 'rgba(74,143,212,0.3)' : `${orgCfg.color}44`;

    html += `<div style="display:flex;align-items:flex-start;gap:12px;margin:16px 0 12px;padding:14px;background:var(--panel-bg);border:1px solid ${emotionBorder}44;border-radius:10px">`;
    // Portrait
    html += `<div style="flex-shrink:0">`;
    if (portraitUrl) {
      html += `<img src="${portraitUrl}" style="width:72px;height:72px;border-radius:50%;border:3px solid ${emotionBorder};box-shadow:0 0 16px ${emotionGlow};object-fit:cover" alt="">`;
    } else {
      const initial = enemyAce.name.charAt(0);
      html += `<div style="width:72px;height:72px;border-radius:50%;border:3px solid ${emotionBorder};box-shadow:0 0 16px ${emotionGlow};display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${emotionBorder}33,${emotionBorder}11);font-size:28px;font-weight:900;color:${emotionBorder}">${initial}</div>`;
    }
    html += `<div style="text-align:center;font-size:10px;font-weight:700;color:${orgCfg.color};margin-top:4px">${enemyAce.name}</div>`;
    html += `</div>`;
    // Speech bubble
    html += `<div style="flex:1;position:relative;background:var(--bg-card);border:1px solid ${emotionBorder}33;border-radius:10px;padding:12px 14px;margin-top:8px">`;
    html += `<div style="position:absolute;left:-8px;top:20px;width:0;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-right:8px solid ${emotionBorder}33"></div>`;
    html += `<p style="font-size:13px;line-height:1.7;color:var(--text-main);margin:0">「${dialogueHtml}」</p>`;
    html += `</div></div>`;
  }

  // Close button
  html += `<div style="text-align:center;margin-top:12px">`;
  html += `<button class="btn btn-gold" style="min-width:160px;padding:10px 24px" onclick="closeWarFinalResult(${eventWon})">閉じる</button>`;
  html += `</div>`;

  box.innerHTML = html;
  overlay.classList.add('active');
}

function closeWarFinalResult(eventWon) {
  document.getElementById('showResultOverlay').classList.remove('active');
  if (eventWon) { Audio.bgm.playJingle('victory'); }
  else { Audio.play('defeat'); }
  setTimeout(() => { Audio.bgm.play('management'); refreshAll(); }, eventWon ? 2000 : 500);
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

// ── F2: Negotiation Popup ──
function showNegotiatePopup(orgId, fighterId) {
  Audio.play('hover');
  const orgCfg = RIVAL_ORGS.find(o => o.id === orgId);
  const orgData = G.aiOrgs && G.aiOrgs[orgId];
  if (!orgCfg || !orgData) return;
  const fighter = orgData.roster.find(f => f.id === fighterId);
  if (!fighter) return;

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
    html += `<div style="font-size:11px;color:var(--text-dim);margin-top:2px">費用: ${cost}万 ｜ 失敗時損失: ${failCost}万 ｜ 成功率: ${rate}%</div></div>`;
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

  document.getElementById('showResultOverlay').classList.remove('active');
  showConfirm(
    `<div style="text-align:center"><strong>${fighter.name}</strong>への引き抜き交渉を開始します。<br><br>` +
    `プラン: ${planLabels[planIndex]}（費用: ${cost}万）<br>` +
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

// ── Coach Tooltip (profile popup) ──
function showCoachTooltip(coachId) {
  const c = ALL_COACHES.find(co => co.id === coachId);
  if (!c) return;
  Audio.play('hover');

  const gradeColors = {C:'#888', B:'#2ecc71', A:'var(--gold)'};
  const color = gradeColors[c.grade] || '#888';
  const teachingMult = COACH_RANKS[c.teaching] || 1.0;
  const styleName = COACH_STYLE_MAP[c.style] || 'オールラウンド';
  const traitDef = COACH_TRAIT_DEFS[c.trait] || {};
  const isHired = G.coaches.includes(c.id);
  const assigned = getCoachAssignees(c.id);
  const assignedChars = assigned.map(cid => G.roster.find(r => r.id === cid)).filter(Boolean);

  let html = '';

  // Header
  html += `<div class="coach-tooltip-header" style="background:${color}0a">
    <div class="coach-tooltip-avatar" style="background:linear-gradient(135deg, ${color}33, ${color}11);border:2px solid ${color}88;display:flex;align-items:center;justify-content:center;overflow:hidden">
      ${coachPortraitImg(c, 84)}
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:18px;margin-bottom:4px">${c.name}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span class="coach-grade coach-grade-${c.grade}">${c.grade}級</span>
        <span class="coach-trait">${c.trait}</span>
        ${isHired ? '<span style="font-size:12px;color:#2ecc71;border:1px solid rgba(46,204,113,0.3);padding:1px 6px;border-radius:3px">雇用中</span>' : ''}
      </div>
    </div>
    <button onclick="closeCoachTooltip()" style="background:none;border:none;color:var(--text-dim);font-size:20px;cursor:pointer;padding:4px;line-height:1">✕</button>
  </div>`;

  // Body
  html += '<div class="coach-tooltip-body">';

  // Teaching power
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">指導力</div>
    <div style="font-size:13px;color:var(--text);line-height:1.6">
      ランク <strong style="color:${color}">${c.teaching}</strong>（成長倍率 <strong style="color:var(--gold)">×${teachingMult}</strong>）<br>
      <span style="font-size:11px;color:var(--text-sub)">担当選手の練習効率を高めます。スタイルが一致するとさらに+0.05ボーナス。</span>
    </div>
  </div>`;

  // Observation
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">観察眼</div>
    <div style="font-size:13px;color:var(--text);line-height:1.6">
      ランク <strong style="color:${color}">${c.observation}</strong>
      <span style="font-size:11px;color:var(--text-dim)">（将来のコーチ報告の精度に影響）</span>
    </div>
  </div>`;

  // Style
  html += `<div class="coach-tooltip-section">
    <div class="coach-tooltip-label">得意スタイル</div>
    <div style="font-size:13px;color:var(--text)">${styleName}
      <span style="font-size:11px;color:var(--text-sub)">— 選手のスタイルと一致時、指導力+0.05</span>
    </div>
  </div>`;

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
        html += `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px">${portraitImg(ch.id, 20, '', true)} ${fLink(ch, {source:'roster', size:'11px'})} <strong style="color:var(--gold)">${ov(ch)}</strong></span>`;
      });
      html += '</div>';
    } else {
      html += '<div style="font-size:12px;color:var(--text-dim)">担当選手なし（団体画面でアサインできます）</div>';
    }
    html += '</div>';
  }

  // Profile
  if (c.profile) {
    html += `<div class="coach-tooltip-section" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
      <div class="coach-tooltip-label">プロフィール</div>
      <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px">
        ${c.age ? c.age + '歳' : ''} ${c.gender ? '｜ ' + c.gender + '性' : ''} ${c.origin ? '｜ ' + c.origin + '出身' : ''}
      </div>
      <div style="font-size:12px;color:var(--text);line-height:1.7">${c.profile}</div>
    </div>`;
  } else if (c.desc) {
    html += `<div class="coach-tooltip-section" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
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
    'リーダー気質': ['私についてきてくれれば、このチームは絶対に強くなる。', '団体を背負う覚悟はできてるわ。任せなさい。'],
    '努力家': ['地道にコツコツ…それが私のやり方です。信じてもらえますか？', '誰よりも練習します。見ていてください。'],
    '負けず嫌い': ['私を選んでくれるなら、絶対に後悔はさせない！', '負ける気なんて、さらさらないから！'],
    '華': ['私がリングに立てば、お客さんは絶対に盛り上がりますよ♪', 'スター性なら誰にも負けません。選んで損はさせませんよ？'],
    'ヒール適性': ['ふふ…面白そうな団体じゃない。使ってくれるなら、暴れてあげるわよ？', '善人ばかりのチームじゃつまらないでしょ？'],
    'ムードメーカー': ['えへへ、一緒に楽しくやりましょうよ！', '私がいれば道場の雰囲気は最高になりますよ！'],
    '威圧感': ['…選ぶなら、覚悟を決めなさい。私は手加減しないわよ。', '私の前に立てる選手がいるか…それが問題ね。'],
    '遅咲き': ['今はまだ未熟かもしれません…でも、必ず大きく咲いてみせます。', '時間をください。きっと期待を超えてみせますから。'],
    '早熟': ['もう準備はできてます。今すぐ試合に出してください！', '待ちきれない…早くリングに立ちたい！'],
    '闘志': ['闘いたい…誰でもいい、強い相手と闘わせてください！', '心の炎は消えない。どんな逆境だって乗り越えてみせる！'],
    '破天荒': ['ルールとか常識とか、つまんないこと言わないでよね！', '退屈なプロレスはしないって約束するよ！'],
    '忠誠心': ['選んでくださるなら…ずっと、この団体で戦い続けます。', 'この恩は一生忘れません。裏切りは絶対にしません。'],
    '番狂わせ体質': ['格上だって関係ない。私、なぜか大一番で燃えるんです。', '数字じゃ測れない力がある…って信じてくれますか？'],
    '野心': ['てっぺんを獲る。それ以外に興味はないわ。', 'この業界の頂点に立つ。そのために最高の環境を選ぶの。'],
    'ファンサービス': ['お客さんの笑顔が私の原動力です！一緒に楽しい団体を作りましょう！', 'ファンあってのプロレスですから。大切にしますよ♪'],
    '鉄人': ['怪我？そんなの関係ないです。365日戦えます。', '丈夫さだけは誰にも負けません。フル稼働でいきましょう！'],
    '適応力': ['どんなスタイルの相手でも合わせられます。使いやすいですよ？', '環境が変わっても大丈夫。すぐ馴染んでみせます。'],
    '名勝負製造機': ['私の試合を見れば、きっと鳥肌が立ちますよ。', '記憶に残る試合を約束します。それが私の誇りだから。'],
    'ライバル体質': ['ライバルがいるから強くなれる。切磋琢磨しましょう？', '誰かと競い合うのが好きなの。いい環境をください。'],
    '引き出し上手': ['相手の良さも引き出せる…そんな選手になりたいんです。', '試合の中で成長できるタイプです。たくさん組ませてください。'],
    '人望': ['みんなで強くなりたい。一人じゃプロレスはできないから。', 'チームの絆を大切にします。団結力なら負けません。']
  },
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
  ],
  // v1.0c: FA signing lines (trait-keyed)
  faSigning: {
    'リーダー気質': ['ここを最強の団体にしてみせるわ。任せなさい。', 'チームを引っ張る覚悟はできてるわ。よろしくね。'],
    '努力家': ['ありがとうございます…毎日練習して、絶対に期待に応えます！', 'コツコツ頑張るのが取り柄です。よろしくお願いします。'],
    '負けず嫌い': ['待ってました！ここで誰にも負けない選手になってみせる！', '契約してくれたこと、後悔させないから！'],
    '華': ['新しいステージ、ワクワクしますね♪ お客さんを沸かせますよ！', '私の輝き、この団体で見せてあげます♪'],
    'ヒール適性': ['ふふ…拾ってくれたこと、感謝してあげるわ。', '面白い団体ね。好きにやらせてもらうわよ？'],
    'ムードメーカー': ['やったー！よろしくお願いします！楽しくやりましょ！', '盛り上げ役なら任せてください！道場の空気変えますよ！'],
    '威圧感': ['…いいわ。この団体で、格の違いを見せてやる。', '選んだ以上、相応の舞台を用意しなさいよ。'],
    '闘志': ['新しい闘いの場…！燃えてきた！', '強い相手がいるなら、すぐにでも試合を組んでください！'],
    '破天荒': ['やっほー！新天地だ！暴れまくるよ！', 'ここなら好き放題やれそう！楽しみ！'],
    '忠誠心': ['拾ってくださって…ありがとうございます。この恩は忘れません。', 'ここが私の居場所です。ずっとこの団体で戦います。'],
    '野心': ['てっぺんを獲るために来たの。わかってるわよね？', 'ここを踏み台にするつもりはないわ。一緒に頂点に立ちましょう。'],
    'ファンサービス': ['ファンの皆さんに喜んでもらえるよう頑張ります！', 'お客さんとの距離が近い団体、いいですね♪ よろしくです！'],
    _heel: ['…ふん。まあ、使えるだけ使ってちょうだい。', '条件は悪くない。やってあげるわ。'],
    _babyface: ['ありがとうございます！精一杯、頑張りますね！', '夢に一歩近づけた…この団体で花を咲かせます！'],
    _neutral: ['よろしくお願いします。力になれるよう頑張ります。', '新しい環境…悪くないですね。頑張ります。']
  },
  faSigningGeneric: [
    'この団体で新しいスタートです。よろしくお願いします！',
    '契約ありがとうございます！全力で戦います！',
    '新しい仲間ができて嬉しいです。頑張ります！',
  ],
  // v1.0c: Rental greeting lines (trait-keyed)
  rentalGreeting: {
    'リーダー気質': ['短い間だけど、私がいる間はチームを引っ張るわ。', 'レンタルでも手は抜かない。チームのために全力よ。'],
    '努力家': ['短い期間ですが、精一杯やらせていただきます！', '限られた時間でも成長したい。よろしくお願いします。'],
    '負けず嫌い': ['レンタルだからって舐めないでよね！全試合全力よ！', '負けず嫌いは治りません。全部勝ちにいきます！'],
    '華': ['お邪魔しまーす♪ 短い間だけど盛り上げますよ！', 'ゲストとして最高のパフォーマンスを見せますね♪'],
    'ヒール適性': ['…よそ者が来たと思って甘く見ないことね。', 'ふん…まあ、短い間だけ付き合ってあげるわ。'],
    '闘志': ['よその団体でも闘志は変わらない！燃えるぞ！', '新しい相手と闘える…ワクワクするな！'],
    '破天荒': ['おじゃましまーす！短い間だけど暴れるよー！', '一時的だからこそ思い切り好き放題やるね！'],
    _heel: ['…別に、仕事だからやるだけよ。', '短い間の付き合いよ。馴れ合うつもりはないわ。'],
    _babyface: ['短い間ですが、よろしくお願いします！仲良くしてくださいね！', 'お世話になります！力になれるよう頑張ります！'],
    _neutral: ['レンタルですが、手は抜きませんので。よろしく。', '短い間ですがよろしくお願いします。']
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
  Audio.play(o.tone === 'negative' ? 'error' : o.tone === 'gold' ? 'award' : 'event');
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
  _renderRetirementPopup();
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
  const careerYears = f.careerSeasons || Math.max(1, (f.age || 20) - (f.debutAge || 18));
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
  `;
  document.getElementById('retirementPopupOverlay').classList.add('active');
  Audio.play(isInjury ? 'error' : 'event');
}

function closeRetirementPopup() {
  document.getElementById('retirementPopupOverlay').classList.remove('active');
  _retirementPopupQueue.shift();
  if (_retirementPopupQueue.length > 0) {
    setTimeout(_renderRetirementPopup, 300);
  } else {
    if (_retirementPopupCallback) { _retirementPopupCallback(); _retirementPopupCallback = null; }
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

// セリフをランダム選出（AWARD_LINES[key]から1つ）
function _awardLine(key) {
  const pool = (typeof AWARD_LINES !== 'undefined' && AWARD_LINES[key]) || [];
  if (!pool.length) return '';
  return pool[Math.floor(Math.random() * pool.length)];
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
  const line = _awardLine('rookie');
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
  const pool = (typeof AWARD_LINES !== 'undefined' && AWARD_LINES.bestMatch) || [];
  // 2つの異なるセリフを選出
  const i1 = Math.floor(Math.random() * pool.length);
  let i2 = Math.floor(Math.random() * Math.max(pool.length - 1, 1));
  if (pool.length > 1 && i2 >= i1) i2++;
  const line1 = pool[i1] || '';
  const line2 = pool[Math.min(i2, pool.length - 1)] || '';
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
  const line = _awardLine('mvp');
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
  const pool = (typeof AWARD_LINES !== 'undefined' && AWARD_LINES.champion) || [];
  // 3つの異なるセリフを選出
  const indices = [];
  for (let i = 0; i < Math.min(3, pool.length); i++) {
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while (indices.includes(idx));
    indices.push(idx);
  }
  const lines = indices.map(i => pool[i] || '');
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
  const line = _awardLine('hallOfFame');
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
  const arr = EVENT_QUOTES[category] || ['...'];
  return arr[Math.floor(Math.random() * arr.length)];
}

// v1.0: Get a draft-context quote for a specific character
// Uses their traits to pick a personality-appropriate line
function getDraftQuote(char) {
  const traitQuotes = EVENT_QUOTES.draftInterest || {};
  const traits = char.traits || [];
  // Try each trait to find a matching quote pool
  for (const trait of traits) {
    if (traitQuotes[trait]) {
      const arr = traitQuotes[trait];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  // Fallback to generic draftJoin
  return pickQuote('draftJoin');
}

// v1.0c: Get FA signing quote (traits-based)
function getSigningQuote(char) {
  const lines = EVENT_QUOTES.faSigning || {};
  const traits = char.traits || [];
  for (const trait of traits) {
    if (lines[trait]) {
      const arr = lines[trait];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  // Role fallback
  const role = char.role || 'Neutral';
  const roleKey = role === 'Heel' ? '_heel' : role === 'Babyface' ? '_babyface' : '_neutral';
  if (lines[roleKey]) {
    const arr = lines[roleKey];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  const generic = EVENT_QUOTES.faSigningGeneric || ['よろしくお願いします！'];
  return generic[Math.floor(Math.random() * generic.length)];
}

// v1.0c: Get rental greeting quote (traits-based)
function getRentalQuote(char) {
  const lines = EVENT_QUOTES.rentalGreeting || {};
  const traits = char.traits || [];
  for (const trait of traits) {
    if (lines[trait]) {
      const arr = lines[trait];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  const role = char.role || 'Neutral';
  const roleKey = role === 'Heel' ? '_heel' : role === 'Babyface' ? '_babyface' : '_neutral';
  if (lines[roleKey]) {
    const arr = lines[roleKey];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  const generic = EVENT_QUOTES.rentalGreetingGeneric || ['よろしくお願いします！'];
  return generic[Math.floor(Math.random() * generic.length)];
}

// v1.0: Get a draft "interest" line (when focused, before picking)
function getDraftInterestLine(char) {
  const traitQuotes = EVENT_QUOTES.draftInterest || {};
  const traits = char.traits || [];
  for (const trait of traits) {
    if (traitQuotes[trait]) {
      const arr = traitQuotes[trait];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  // Generic interest lines
  const generic = [
    '私を選んでくれるの…？嬉しい！',
    'この団体、面白そう…気になってたんです。',
    'よろしくお願いします…！精一杯やります！',
    '入れてくれるなら、全力で頑張りますよ！'
  ];
  return generic[Math.floor(Math.random() * generic.length)];
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
    const uUrl = getUpperUrl(c.id);

    // ── Header（左: 上半身画像、右: 情報）──
    const popBorderColor = isChamp ? '#d4a843' : 'rgba(255,255,255,0.15)';
    const popShadow = isChamp ? '0 4px 20px rgba(0,0,0,0.5),0 0 16px rgba(212,168,67,0.5)' : '0 4px 20px rgba(0,0,0,0.5)';

    // 上半身画像（onerror時はface画像にフォールバック）
    const imgHtml = uUrl
      ? `<img src="${uUrl}" style="width:200px;height:300px;border-radius:14px;object-fit:cover;object-position:top;border:3px solid ${popBorderColor};box-shadow:${popShadow}" alt="${c.name}" onerror="this.onerror=null;this.src='${pUrl}';this.style.height='140px';this.style.width='140px'">`
      : pUrl
      ? `<img src="${pUrl}" style="width:140px;height:140px;border-radius:14px;object-fit:cover;border:3px solid ${popBorderColor};box-shadow:${popShadow}" alt="${c.name}">`
      : `<div style="width:140px;height:140px;border-radius:14px;background:linear-gradient(135deg,${sm.color}33,${sm.color}11);border:3px solid ${popBorderColor};box-shadow:${popShadow};display:flex;align-items:center;justify-content:center"><span style="font-size:48px;font-weight:900;color:${sm.color}">${initial}</span></div>`;

    html += `<div style="background:${sm.color}0a;border-bottom:1px solid rgba(255,255,255,0.06);padding:20px;text-align:center">
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
            ${c.isRental ? (() => { const ct = (G.rentals || []).find(r => r.fighterId === c.id); return `<span style="font-size:13px;color:#f39c12">🤝 レンタル${ct ? `（残${ct.seasonsLeft}期/${ct.seasonsLeft * 12}週）` : ''}</span>`; })() : ''}
          </div>
          ${(c.traits && c.traits.length > 0) ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${c.traits.map(t => {
            const td = TRAIT_DEFS[t]; if (!td) return '';
            return '<span title="' + td.desc + '" style="font-size:12px;padding:2px 7px;border-radius:8px;background:' + td.color + '22;color:' + td.color + ';border:1px solid ' + td.color + '44;white-space:nowrap;cursor:help">' + td.icon + ' ' + t + '</span>';
          }).join('')}</div>` : ''}
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:14px;color:var(--text-sub)">
            ${c.age !== undefined ? `<span>📅 ${c.age}歳</span>` : ''}
            ${c.h ? `<span>📏 ${c.h}cm</span>` : ''}
            ${(() => { const w = c.wear || 0; if (w >= 60) return '<span style="color:#e74c3c">⬇⬇ 限界</span>'; if (w >= 40) return '<span style="color:#e67e22">⬇ 衰退期</span>'; if (w >= 20) return '<span style="color:#f1c40f">⚠ 衰え</span>'; return ''; })()}
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
      const canNeg = !G.pendingNegotiation && !(G.negotiatedThisSeason || []).includes(c.id);
      const negLabel = G.pendingNegotiation
        ? (G.pendingNegotiation.fighterId === c.id ? '⏳ 交渉中' : '— 他の選手と交渉中')
        : (G.negotiatedThisSeason || []).includes(c.id) ? '✓ 今季交渉済' : null;
      html += `<div style="padding:8px 16px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:10px">`;
      if (canNeg) {
        html += `<button onclick="closeFighterPopup();showNegotiatePopup('${negotiateOrgId}',${c.id})" style="font-size:13px;padding:6px 18px;background:rgba(212,168,67,0.15);color:var(--gold);border:1px solid rgba(212,168,67,0.4);border-radius:4px;cursor:pointer;font-weight:700">🤝 選手を引き抜く</button>`;
      } else {
        html += `<span style="font-size:13px;color:var(--text-dim)">${negLabel}</span>`;
      }
      html += `</div>`;
    }

    // ── Tab bar（NPC は戦績・経歴タブを非表示）──
    const tabs = ['📊 能力'];
    if (orgLabel === '') tabs.push('📋 戦績・経歴');
    if (isRoster) tabs.push('⚙️ 管理');
    if (tabIdx >= tabs.length) tabIdx = 0;
    html += `<div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.15)">
      ${tabs.map((t, i) => `<button onclick="event.stopPropagation();window._fpTab=${i};showFighterPopup(${c.id},'${source||''}')"
        style="flex:1;padding:10px 6px;font-size:13px;background:${i===tabIdx?'rgba(255,255,255,0.05)':'none'};border:none;border-bottom:2px solid ${i===tabIdx?'var(--gold)':'transparent'};color:${i===tabIdx?'var(--text)':'var(--text-dim)'};cursor:pointer;transition:all 0.2s">${t}</button>`).join('')}
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
            <strong style="color:var(--text);font-size:16px">${Engine.util.dispPop(c.popularity)}</strong>
          </div>
          <div style="padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:4px">
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
          html += `<div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:4px">
            🎓 <span style="color:var(--text-dim)">担当コーチ:</span>
            <span class="flink" onclick="event.stopPropagation();closeFighterPopup();setTimeout(()=>showCoachTooltip(${coach.id}),200)" style="display:inline-flex;align-items:center;gap:4px">${coachPortraitImg(coach, 18)} ${coach.name}</span>
            <span style="color:var(--text-dim);font-size:12px;margin-left:6px">(${COACH_STYLE_MAP[coach.style] || 'オールラウンド'} / 指導力${coach.teaching} / ${coach.trait})</span>
          </div>`;
        } else {
          html += `<div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:4px">
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
          let level = null;
          for (const t of RIVALRY_THRESHOLDS) { if (entry.matches >= t.matches) level = t; }
          return level ? { otherId, entry, level } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.entry.matches - a.entry.matches);

      const myExpects = isRoster
        ? Engine.fanExpect.generate(G).filter(e => e.leftId === c.id || e.rightId === c.id)
        : [];

      if (myRivalries.length > 0 || myExpects.length > 0 || isRoster) {
        html += `<div class="fighter-popup-section" style="padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:6px;margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:6px">⚔ 試合情報</div>`;
        if (myRivalries.length > 0) {
          myRivalries.forEach(r => {
            const other = findFighter(r.otherId);
            const lvl = r.level;
            html += `<div style="font-size:12px;margin-bottom:3px">${lvl.emoji} <span style="color:${lvl.color};font-weight:600">${lvl.label}</span>: ${other ? `<span class="flink" onclick="event.stopPropagation();showFighterPopup(${r.otherId},'')">${other.name}</span>` : `ID#${r.otherId}`} <span style="color:var(--text-dim)">(${r.entry.matches}試合)</span></div>`;
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

      // ── Build career display from milestones ──
      const milestones = Engine.milestone.get(G, c.id);
      const pOrgName = G.orgName || 'プレイヤー団体';
      const winRateFmt = totalMatches > 0 ? (wins / totalMatches).toFixed(3).slice(1) : '.000';

      // ── Compact Record Row（NPCは戦績非記録のため非表示）──
      if (orgLabel === '') {
        html += `<div style="margin-bottom:12px;padding:9px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px">
            <span style="font-size:10px;font-weight:700;color:var(--gold);background:rgba(212,168,67,0.15);padding:2px 7px;border-radius:3px;flex-shrink:0">戦績</span>
            <span style="color:#2ecc71;font-weight:700">${wins}勝</span>
            <span style="color:#e74c3c;font-weight:700">${losses}敗</span>
            <span style="color:#b0b8c4;font-weight:700">${draws}分</span>
            <span style="color:var(--text-dim);font-size:11px">(${winRateFmt})</span>
            ${totalMatches > 0 ? `<span style="color:var(--text-dim)">勝率</span><span style="color:var(--gold);font-weight:700">${winRate}%</span>` : ''}
            ${c.bestMQ ? `<span style="color:var(--text-dim);margin-left:2px">｜ ベストMQ</span><span style="color:#4a8fd4;font-weight:700">${c.bestMQ}</span>` : ''}
            ${isChamp ? `<span style="color:var(--gold);font-size:12px;font-weight:700">｜ 👑 王者（${G.titles.world.defenses}防衛）</span>` : ''}
          </div>
        </div>`;
      }

      // ── Milestone Timeline / Career History（NPCは非表示）──
      if (orgLabel !== '') {
        // NPC: 経歴データは記録・公開していないため何も表示しない
      } else if (milestones.length > 0) {
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
            <summary style="font-size:13px;cursor:pointer;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px;user-select:none;display:flex;align-items:center;gap:8px">
              <span style="font-weight:900;color:var(--text);font-size:14px">[${s}年目]</span>
              ${summary ? `<span style="font-size:12px;color:var(--text-sub)">${summary.detail}</span>` :
                isCurrentSeason ? `<span style="font-size:12px;color:var(--blue)">シーズン進行中</span>` : ''}
            </summary>
            <div style="padding:6px 0 2px 8px;border-left:2px solid rgba(255,255,255,0.06);margin-left:6px;margin-top:6px">`;

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
        html += `<div style="font-size:13px;color:var(--text-dim);padding:14px;text-align:center;background:rgba(255,255,255,0.02);border-radius:6px">まだキャリア記録がありません</div>`;
      }

      // v1.3-2: §4.4/§7.1 経歴（怪我記録）セクション（NPCは非表示）
      const hist = (orgLabel === '') ? (c.careerHistory || []) : [];
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
      const discount = 0;
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
      const discount = 0;
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
  const color = stars >= 4.5 ? '#f0d078' : stars >= 3.5 ? '#2ecc71' : stars >= 2.5 ? '#e7e9ee' : '#999';
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

  // Auto-resolve any matches with stale roster refs so they don't block progress
  sp.validMatches.forEach((m, idx) => {
    if (sp.results[idx]) return;
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) {
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', turns: 0, log: [], _stale: true };
    }
  });
  // If all resolved after cleanup, finalize immediately
  if (sp.results.every(r => r !== null)) {
    try { App.finalizeShow(); } catch(e) {
      console.error('finalizeShow error:', e);
      // Show recovery UI instead of freezing
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
  const showName = ppv ? '🏆 PPV GRAND FINAL' : special ? '⭐ 特別興行' : `定期興行 #${G.totalShows + 1}`;
  const resolved = sp.results.filter(r => r !== null).length;
  const total = sp.validMatches.length;

  let html = `<div class="show-result-title">${showName}</div>`;
  html += `<div style="text-align:center;margin-bottom:16px;color:var(--text-sub);font-size:12px">試合カード — ${resolved}/${total} 完了</div>`;

  // Determine next match: highest unresolved index (undercard first, main last)
  let nextIdx = -1;
  for (let i = total - 1; i >= 0; i--) {
    if (sp.results[i] === null) { nextIdx = i; break; }
  }

  // Display: main event (idx 0) at top → opening match (idx total-1) at bottom
  for (let di = 0; di < total; di++) {
    const idx = di;
    const m = sp.validMatches[idx];
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) continue;
    const result = sp.results[idx];
    const isResolved = result !== null;
    const isNext = idx === nextIdx;
    const isMain = idx === 0;
    const titleTag = m.isTitle ? '<span style="color:var(--gold);font-size:12px;margin-left:6px">🏆 TITLE</span>' : '';
    const matchLabel = isMain ? '★ メインイベント' : `第${total - idx}試合`;

    html += `<div data-match-next="${isNext}" style="background:var(--bg-card);border:1px solid ${isNext ? 'var(--blue)' : 'var(--border)'};border-radius:6px;padding:12px;margin-bottom:8px;${isResolved ? 'opacity:0.6' : !isNext ? 'opacity:0.4' : ''}">`;
    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">`;
    html += `<div style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600">`;
    html += `${portraitImg(charL.id, 80)}`;
    html += `<span style="color:var(--blue)">${charL.name}</span>`;
    html += `<span style="color:var(--text-dim);margin:0 8px">vs</span>`;
    html += `<span style="color:var(--red)">${charR.name}</span>${titleTag}`;
    html += `${portraitImg(charR.id, 80)}`;
    html += `</div>`;
    html += `<div style="font-size:12px;color:var(--text-dim)">${matchLabel}</div>`;
    html += `</div>`;

    if (isResolved) {
      const wName = result.winner === 'draw' ? '引き分け' : result.winner === 'left' ? charL.name : charR.name;
      const mqColor = result.mq >= 70 ? 'var(--gold)' : result.mq >= 50 ? 'var(--green)' : 'var(--text-sub)';
      html += `<div style="display:flex;align-items:center;gap:12px;font-size:11px">`;
      html += `<span style="color:var(--green)">✔ ${wName}${result.finType ? ' (' + result.finType + ')' : ''}</span>`;
      html += `<span style="color:${mqColor}">MQ: ${result.mq}</span>`;
      html += `</div>`;
    } else if (isNext) {
      html += `<div style="display:flex;gap:8px;margin-top:4px">`;
      html += `<button class="btn btn-blue" style="flex:1;font-size:12px;padding:6px 0" onclick="App.watchMatch(${idx})">🎬 この試合を観る</button>`;
      html += `<button class="btn" style="flex:1;font-size:12px;padding:6px 0;background:var(--bg-mid);color:var(--text-sub)" onclick="App.skipMatch(${idx})">⏭ スキップ</button>`;
      html += `</div>`;
    } else {
      html += `<div style="text-align:center;font-size:11px;color:var(--text-dim);margin-top:4px">前の試合を先に進めてください</div>`;
    }
    html += `</div>`;
  }

  // Skip all button (only if there are unresolved matches)
  const remaining = sp.results.filter(r => r === null).length;
  if (remaining > 0) {
    html += `<div style="margin-top:16px;text-align:center">`;
    html += `<button class="btn btn-gold" style="width:100%;padding:12px 0;font-size:14px" onclick="App.skipAllMatches()">⏩ 全試合スキップ（${remaining}試合）</button>`;
    html += `</div>`;
  }

  box.innerHTML = html;
  overlay.classList.add('active');
  // Auto-scroll to next match (near bottom for opening matches)
  if (nextIdx >= 0) {
    const nextEl = box.querySelector('[data-match-next="true"]');
    if (nextEl) setTimeout(() => nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }
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
    const matchLabel = isMain ? '★ メインイベント' : `第${results.length - i}試合`;

    const spotlightInMatch = G.mediaSpotlight && (G.mediaSpotlight.fighterId === r.left.id || G.mediaSpotlight.fighterId === r.right.id);
    html += `<div class="match-result" style="${isMain ? 'border-left-color:var(--gold);background:rgba(212,168,67,0.05)' : ''}">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">${matchLabel}${r.isTitleMatch ? ' <span style="color:var(--gold)">🏆 タイトルマッチ</span>' : ''}${r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">${r.rivalryBonus.emoji}${r.rivalryBonus.label}</span>` : ''}${r.coachMQBonus ? ' <span style="color:#e67e22">(コーチ+' + r.coachMQBonus + ')</span>' : ''}${spotlightInMatch ? ' <span class="media-spotlight-badge">📺 取材中</span>' : ''}</div>`;

    if (isDraw) {
      html += `<div style="display:flex;align-items:center;justify-content:center;gap:16px;padding:4px 0 8px;flex-wrap:wrap">
        <div style="text-align:center">
          ${portraitImg(r.left.id, 140, 'portrait-match')}
          <div style="margin-top:6px;font-size:14px">${fLink(r.left, {source:'roster'})}</div>
        </div>
        <span style="font-size:16px;font-weight:700;padding:4px 14px;background:rgba(243,156,18,0.2);border:1px solid rgba(243,156,18,0.4);color:#f39c12;border-radius:4px;flex-shrink:0">DRAW</span>
        <div style="text-align:center">
          ${portraitImg(r.right.id, 140, 'portrait-match')}
          <div style="margin-top:6px;font-size:14px">${fLink(r.right, {source:'roster'})}</div>
        </div>
      </div>
      <div style="margin-top:2px;font-size:13px;color:var(--text-sub)">${r.finType} / ${r.turns}ターン</div>
      <div style="margin-top:4px">${mqStars(r.mq)} <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}${r.isTitleMatch ? ' <span style="color:var(--gold)">(王座+5)</span>' : ''}${r.titleGapPenalty ? ` <span style="color:#e74c3c">(格差${r.titleGapPenalty})</span>` : ''}${r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>` : ''}${r.coachMQBonus ? ' <span style="color:#e67e22">(コーチ+' + r.coachMQBonus + ')</span>' : ''}</span></div>`;
    } else {
      const winnerF = leftIsWinner ? r.left : r.right;
      html += `<div style="display:flex;align-items:flex-end;justify-content:center;gap:12px;padding:4px 0 8px;flex-wrap:wrap">
        <div style="text-align:center;flex-shrink:0">
          ${portraitImg(r.left.id, leftIsWinner ? 180 : 110, 'portrait-match' + (leftIsWinner ? ' winner' : ' loser'))}
          <div style="margin-top:6px;font-size:${leftIsWinner?'15px':'12px'};${leftIsWinner?'':'opacity:0.65'}">${fLink(r.left, {source:'roster', bold:leftIsWinner})}</div>
        </div>
        <div style="font-size:13px;color:var(--text-dim);padding-bottom:44px;flex-shrink:0">vs</div>
        <div style="text-align:center;flex-shrink:0">
          ${portraitImg(r.right.id, rightIsWinner ? 180 : 110, 'portrait-match' + (rightIsWinner ? ' winner' : ' loser'))}
          <div style="margin-top:6px;font-size:${rightIsWinner?'15px':'12px'};${rightIsWinner?'':'opacity:0.65'}">${fLink(r.right, {source:'roster', bold:rightIsWinner})}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:2px">
        <span style="display:inline-block;padding:4px 14px;border-radius:4px;font-size:14px;font-weight:700;
          background:linear-gradient(135deg,var(--gold),#b8912e);color:var(--bg-dark)">🏆 ${winnerF.name} 勝利</span>
        <span style="font-size:13px;color:var(--text-sub)">${r.finType}${r.finMove ? `（${r.finMove}）` : ''} / ${r.turns}ターン</span>
      </div>
      <div style="margin-top:4px">${mqStars(r.mq)} <span style="font-size:13px;color:var(--text-sub)">MQ: ${r.mq}${r.isTitleMatch ? ' <span style="color:var(--gold)">(王座+5)</span>' : ''}${r.titleGapPenalty ? ` <span style="color:#e74c3c">(格差${r.titleGapPenalty})</span>` : ''}${r.rivalryBonus ? ` <span style="color:${r.rivalryBonus.color}">(${r.rivalryBonus.label}+${r.rivalryBonus.mqBonus})</span>` : ''}${r.coachMQBonus ? ' <span style="color:#e67e22">(コーチ+' + r.coachMQBonus + ')</span>' : ''}</span></div>`;
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
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 500 + G.week));
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
  ['careOverlay','confirmOverlay','growthEventOverlay','milestoneOverlay',
   'newspaperOverlay','seasonFanfareOverlay'].forEach(oid => {
    const el = document.getElementById(oid);
    if (el) { el.classList.remove('active'); el.classList.remove('show'); }
  });
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
  _renderNextGrowthPopup();
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
    message = f ? Engine.rng.pick(Engine.rng.create(Date.now()), BREAKTHROUGH_LINES) : 'ブレークスルー！';
    detail  = `${statNames[ev.stat] || ev.stat} <strong>+${parseFloat((+ev.gain).toFixed(1))}</strong>`;
    if (ev.hotStreak) detail += '　🔥 <em>絶好調突入！</em>';
    btnLabel = '素晴らしい';
    tone = 'gold';
    Audio.play('award');
  } else if (ev.type === 'slump_start') {
    const lines = SLUMP_START_LINES[ev.trigger] || SLUMP_START_LINES['defeat'];
    title = '📉 スランプ…';
    message = lines[Math.floor(Math.random() * lines.length)];
    detail = 'しばらく成長が止まるかもしれない';
    btnLabel = '見守る';
    tone = 'negative';
    Audio.play('error');
  } else if (ev.type === 'slump_end') {
    title = '💪 スランプ脱出！';
    message = SLUMP_END_LINES[Math.floor(Math.random() * SLUMP_END_LINES.length)];
    detail = `${ev.duration || '?'}週間のスランプを乗り越えた！`;
    btnLabel = 'おかえり';
    tone = 'positive';
    Audio.play('event');
  } else if (ev.type === 'motivation_loss_start') {
    title = '😞 モチベーション喪失…';
    message = MOTIVATION_LOSS_LINES[Math.floor(Math.random() * MOTIVATION_LOSS_LINES.length)];
    detail = '成長が止まり、能力が低下していく';
    btnLabel = '……';
    tone = 'negative';
    Audio.play('error');
  } else if (ev.type === 'motivation_loss_end') {
    title = '🌅 再起！';
    message = MOTIVATION_RECOVERY_LINES[Math.floor(Math.random() * MOTIVATION_RECOVERY_LINES.length)];
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

  box.className = `growth-event-box ${tone}`;
  box.innerHTML = `
    <div class="growth-event-face">${faceHtml}</div>
    <div class="growth-event-name">${fighter ? fighter.name : ''}</div>
    <div class="growth-event-title">${title}</div>
    <div class="growth-event-msg">${message}</div>
    ${detail ? `<div class="growth-event-detail">${detail}</div>` : ''}
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
  }
}

// ─── AI成長イベント脅威/好機アラート ──────────────────────

let _aiAlertQueue = [];
let _aiAlertCallback = null;

function showAIGrowthAlerts(alerts, onDone) {
  if (!alerts || alerts.length === 0) { if (onDone) onDone(); return; }
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
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration || 1800);
}

// 新シーズン開幕ファンファーレ演出
function showSeasonFanfare(season, onDone) {
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
    window._sfDismiss = null;
    if (onDone) setTimeout(onDone, 100);
  };
  // 4秒後に自動クローズ
  clearTimeout(window._sfTimer);
  window._sfTimer = setTimeout(() => { if (window._sfDismiss) window._sfDismiss(); }, 4000);
}

// ══════════════════════════════════════════════
//  v1.4w: 新聞パネル（業界ニュース）
// ══════════════════════════════════════════════
function showNewspaperPanel(articles, onDone) {
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
  };

  Audio.play('reveal');
  renderArticle(0);
  overlay.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────────────────
// v1.5s25b: Milestone Event Popup — ナレーション形式の3択イベント
// ─────────────────────────────────────────────────────────────────────────────
function showMilestoneEvent(evt, onChoice) {
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
  const overlay = document.getElementById('careOverlay');
  const box = document.getElementById('careBox');
  if (!overlay || !box) return;

  const actions = typeof CARE_ACTIONS !== 'undefined' ? CARE_ACTIONS : {};
  const funds = state.funds || 0;
  const roster = (state.roster || []).filter(f => !f.isRental);

  function renderMain() {
    const individualActions = Object.values(actions).filter(a => a.category === 'individual');
    const teamActions = Object.values(actions).filter(a => a.category === 'team');

    let html = `<div class="care-title">💝 ケアアクション <span style="font-size:12px;font-weight:400;color:var(--text-dim);margin-left:auto">資金: <strong style="color:#2ecc71">${funds.toLocaleString()}万</strong></span></div>`;

    html += '<div class="care-section-label">👤 個人向け</div>';
    const orgPop = state.orgPop || 0;
    individualActions.forEach(a => {
      const canAfford = funds >= a.cost;
      const isInjuredOnly = a.condition === 'injured';
      const anyInjured = roster.some(f => f.injury);
      const orgPopLocked = a.minOrgPop && orgPop < a.minOrgPop;
      const disabled = !canAfford || (isInjuredOnly && !anyInjured) || orgPopLocked ? 'disabled' : '';
      let extraInfo = '';
      if (orgPopLocked) extraInfo = ` <span style="color:#e74c3c;font-size:10px">（知名度 ${a.minOrgPop} で解放）</span>`;
      else if (isInjuredOnly) extraInfo = ' <span style="color:#f39c12;font-size:10px">（怪我中のみ）</span>';
      html += `<div class="care-action-row ${disabled}" data-action="${a.id}">
        <span class="care-action-emoji">${a.emoji}</span>
        <div class="care-action-info">
          <div class="care-action-name">${a.label}</div>
          <div class="care-action-desc">${a.desc}${extraInfo}</div>
        </div>
        <span class="care-action-cost">${a.cost}万</span>
      </div>`;
    });

    html += '<div class="care-section-label" style="margin-top:16px">🏟️ 団体向け</div>';
    teamActions.forEach(a => {
      const canAfford = funds >= a.cost;
      const disabled = !canAfford ? 'disabled' : '';
      html += `<div class="care-action-row ${disabled}" data-action="${a.id}">
        <span class="care-action-emoji">${a.emoji}</span>
        <div class="care-action-info">
          <div class="care-action-name">${a.label}</div>
          <div class="care-action-desc">${a.desc}</div>
        </div>
        <span class="care-action-cost">${a.cost}万</span>
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

  // A-2: 団体向けアクション確認画面
  function renderTeamConfirm(actionId, cfg) {
    let html = `<div class="care-title">${cfg.emoji} ${cfg.label}</div>`;
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:14px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">${cfg.desc}</div>`;
    html += `<div style="font-size:14px;color:#e8439f;font-weight:700;text-align:center;margin-bottom:14px">費用: ${cfg.cost}万</div>`;
    html += `<button class="btn" style="width:100%;margin-bottom:8px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-size:14px;padding:10px" id="careTeamConfirmBtn">実行する</button>`;
    html += '<button class="care-close-btn" id="careTeamBackBtn">← 戻る</button>';
    box.innerHTML = html;

    document.getElementById('careTeamConfirmBtn').addEventListener('click', () => {
      if (onConfirm) onConfirm(actionId, null);
      overlay.classList.remove('active');
    });
    document.getElementById('careTeamBackBtn').addEventListener('click', renderMain);
  }

  function renderFighterSelect(actionId, cfg) {
    const isInjuredOnly = cfg.condition === 'injured';
    const selectableRoster = isInjuredOnly
      ? roster.filter(f => f.injury)
      : roster.filter(f => !f.injury);

    let html = `<div class="care-title">${cfg.emoji} ${cfg.label}</div>`;
    html += `<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">${cfg.desc}</div>`;
    html += '<div class="care-section-label">対象選手を選択</div>';

    if (selectableRoster.length === 0) {
      html += '<div style="color:var(--text-dim);font-size:13px;padding:12px 0">対象選手がいません</div>';
    } else {
      html += '<select class="care-fighter-select" id="careFighterSelect">';
      selectableRoster.forEach(f => {
        const injuryLabel = f.injury ? ` (怪我中 ${f.injury.weeksLeft}週)` : '';
        html += `<option value="${f.id}">${f.name}${injuryLabel}</option>`;
      });
      html += '</select>';
      html += `<button class="btn" style="width:100%;margin-bottom:8px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-size:14px;padding:10px" id="careConfirmBtn">実行（${cfg.cost}万）</button>`;
    }

    html += '<button class="care-close-btn" id="careBackBtn">← 戻る</button>';
    box.innerHTML = html;

    const confirmBtn = document.getElementById('careConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const sel = document.getElementById('careFighterSelect');
        const fighterId = sel ? parseInt(sel.value) : null;
        if (onConfirm) onConfirm(actionId, fighterId);
        overlay.classList.remove('active');
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
  };
  const title = typeLabels[event.type] || event.type;
  const isUrgent = event.type === 'S4' || event.type === 'E6';
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
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">
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
      overlay.classList.remove('active');
      const idx = parseInt(this.dataset.choice);
      Audio.play('click');
      if (onChoice) onChoice(idx);
    });
  });

  overlay.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.0 Phase1-6: 大型イベント モーダル（B1〜B4）
// careOverlay/careBox を再利用。多段階対応（step パラメータ）
// ─────────────────────────────────────────────────────────────────────────────
function showLargeEventModal(event, state, step, onChoice) {
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
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">${event.detail}</div>`;
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
    <span>特別治療（-200万）</span><span style="font-size:11px;color:var(--text-dim)">回復期間半減・信頼度+5</span>
  </button>`;
  html += `<button class="btn" data-choice="1"
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>通常の治療</span><span style="font-size:11px;color:var(--text-dim)">標準回復</span>
  </button>`;
  html += `<button class="btn" data-choice="2"
    style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>無理させる</span><span style="font-size:11px;color:var(--text-dim)">信頼度+3、40%で悪化リスク</span>
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
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">${event.detail}</div>`;
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
    <span>話し合いで解決</span><span style="font-size:11px;color:var(--text-dim)">両者信頼度+5、士気+3</span></button>`;
  html += `<button class="btn" data-choice="1" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>試合で決着させる</span><span style="font-size:11px;color:var(--text-dim)">勝者信頼度+10、敗者-5</span></button>`;
  html += `<button class="btn" data-choice="2" style="text-align:left;padding:10px 14px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between">
    <span>放置する</span><span style="font-size:11px;color:var(--text-dim)">両者信頼度-8、士気-10</span></button>`;
  html += '</div>';
  return html;
}

// ── B2 Step 2: 介入選択 ───────────────────────────────────────────────────
function _buildB2Step2(event, state, roster) {
  const f1 = roster.find(f => f.id === event.fighter1);
  const f2 = roster.find(f => f.id === event.fighter2);

  let html = `<div class="care-title" style="border-bottom:1px solid #9b59b6;padding-bottom:10px;margin-bottom:12px">🤫 試合前の介入</div>`;
  html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:14px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">
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
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">${event.detail}</div>`;
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
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:10px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">${event.detail}</div>`;
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
function _showCareReaction(fighter, text) {
  if (!fighter || !text) return;
  const el = document.getElementById('notifEventToast');
  if (!el) { showToast(text); return; }

  const face = portraitImg(fighter.id, 120, 'notif-face');
  el.className = 'notif-event-toast care-reaction-toast';
  el.innerHTML = `
    <div class="notif-inner">
      ${face}
      <div class="care-r-name">${fighter.name}</div>
      <div class="care-r-speech">「${text}」</div>
    </div>
  `;
  el.classList.add('show');
  Audio.play('notify');

  clearTimeout(window._notifTimer);
  window._notifTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

function showNotifEventToast(event) {
  if (!event) return;
  const el = document.getElementById('notifEventToast');
  if (!el) { showToast(event.text || ''); return; }  // fallback

  const isWarning = event.type === 'N5';

  // 顔画像: 2人(N2)は80px×2、1人は120px
  const f1Id = event.fighter;
  const f2Id = event.fighter2;
  let portraitsHtml = '';
  if (f1Id != null && f2Id != null) {
    portraitsHtml = `<div class="notif-portraits">${portraitImg(f1Id, 80, 'notif-face')}${portraitImg(f2Id, 80, 'notif-face')}</div>`;
  } else if (f1Id != null) {
    portraitsHtml = `<div class="notif-portraits">${portraitImg(f1Id, 120, 'notif-face')}</div>`;
  }

  const detailHtml = event.detail ? `<div class="notif-detail">${event.detail}</div>` : '';
  const dialogueHtml = event.dialogue ? `<div class="notif-dialogue">「${event.dialogue}」</div>` : '';

  el.className = 'notif-event-toast' + (isWarning ? ' notif-warning' : '');
  el.innerHTML = `
    <div class="notif-inner">
      ${portraitsHtml}
      <div class="notif-body">
        <div class="notif-text">${event.text || ''}</div>
        ${detailHtml}
        ${dialogueHtml}
      </div>
    </div>
  `;
  el.classList.add('show');
  Audio.play('event');

  // クリックで早期クローズ
  el.onclick = () => {
    clearTimeout(window._notifTimer);
    el.classList.remove('show');
    el.onclick = null;
  };

  clearTimeout(window._notifTimer);
  // テキスト量に応じて表示時間を動的調整（最低8秒、セリフ付きは10秒〜）
  const textLen = (event.text || '').length + (event.detail || '').length + (event.dialogue || '').length;
  const baseDuration = isWarning ? 8000 : 9000;
  const duration = Math.min(baseDuration + Math.max(0, textLen - 40) * 40, 15000);
  window._notifTimer = setTimeout(() => {
    el.classList.remove('show');
    el.onclick = null;
  }, duration);
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
  const fighterLines = (typeof ENDING_LINES !== 'undefined' && ENDING_LINES.fighter) || [];
  const coachLines   = (typeof ENDING_LINES !== 'undefined' && ENDING_LINES.coach)   || [];

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
    const fLines = _pickLines(fighterLines, fighters.length);
    steps.push(() => {
      let fHtml = fighters.map((f, i) => {
        const ovrRaw = typeof Engine !== 'undefined' && Engine.util ? Engine.util.ov(f) : NaN;
        const ovr = isNaN(ovrRaw) ? (f.ovr || '—') : ovrRaw;
        return `<div style="flex:1;text-align:center;min-width:0">
          <div style="display:flex;justify-content:center;margin-bottom:5px">${_awardsPortrait(f.id, 80)}</div>
          <div style="font-size:11px;font-weight:700;color:var(--text)">${f.name}</div>
          <div style="font-size:10px;color:var(--text-dim)">OVR ${ovr}</div>
          <div style="font-size:10px;color:var(--text-sub);font-style:italic;margin-top:5px;line-height:1.5">「${fLines[i] || '最高だ！'}」</div>
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
      Audio.fileBgm.play('../bgm/ending.mp3', { loop: true });
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
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
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
