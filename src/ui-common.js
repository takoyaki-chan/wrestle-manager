// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9: UI HELPERS & SHOW PREP (v0.85)                ║
// ╚══════════════════════════════════════════════════════════╝

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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
  const baseFee = Engine.negotiate.calcBaseFee(fighter, orgCfg);
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
  const baseFee = Engine.negotiate.calcBaseFee(fighter, orgCfg);
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

      // ── Build career display from milestones ──
      const milestones = Engine.milestone.get(G, c.id);
      const pOrgName = G.orgName || 'プレイヤー団体';
      const winRateFmt = totalMatches > 0 ? (wins / totalMatches).toFixed(3).slice(1) : '.000';

      // ── Career Summary Header ──
      html += `<div style="padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px;margin-bottom:14px;font-family:'Courier New',monospace">`;
      html += `<div style="font-size:14px;font-weight:900;color:var(--text);margin-bottom:6px">■ 通算成績: ${wins}勝${losses}敗${draws}分 (${winRateFmt}) / ベストMQ: ${c.bestMQ || 0}</div>`;
      if (isChamp) html += `<div style="font-size:13px;color:var(--gold);font-weight:700">👑 現団体王者 — ${G.titles.world.defenses}度防衛中</div>`;
      if (isAce) html += `<div style="font-size:13px;color:#f1c40f;font-weight:700">⭐ ${pOrgName} エース</div>`;
      html += `</div>`;

      // ── Milestone Timeline (grouped by season, reverse order) ──
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
    card[i] = {left: left.id, right: right.id, isTitle: i === 0 && hasChamp && G.titleEstablished};
  }
  G = { ...G, showCard: card };
}

function onCardSelect(slotIndex, side, newId) {
  App.setShowCardSlot(slotIndex, side, newId);
}

function toggleTitle(slotIndex) {
  if (!G.titleEstablished) { alert('団体王座はまだ設立されていません（興行3回・人気15・ロスター5人で設立）'); return; }
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

// v1.0: Mission clear celebration — tap to dismiss
function dismissMissionClear(missionId, el) {
  Audio.play('fanfare');
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

  // Display in reverse order: undercard (last) → main event (first)
  for (let di = total - 1; di >= 0; di--) {
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

    html += `<div style="background:var(--bg-card);border:1px solid ${isNext ? 'var(--blue)' : 'var(--border)'};border-radius:6px;padding:12px;margin-bottom:8px;${isResolved ? 'opacity:0.6' : !isNext ? 'opacity:0.4' : ''}">`;
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
  const check = Engine.ace.canDesignate(G);
  if (!check.ok) { Audio.play('error'); alert(check.reason); return; }
  const result = Engine.ace.designate(G, fighterId, check.isFirst);
  if (result.error) { Audio.play('error'); alert(result.error); return; }
  Audio.play('fanfare');
  G = result;
  // Record milestone
  G = Engine.milestone.addAce(G, fighterId);
  const name = G.roster.find(c => c.id === fighterId)?.name || '';
  const costMsg = check.isFirst ? '' : `（費用${check.cost}万 / 団体人気-${Engine.ACE_CONFIG.popPenalty}）`;
  G.gameLog = [...G.gameLog, `⭐ ${name}をエースに認定${costMsg}`];
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
// ── Phase D: Event UI Functions ──
function executeEvent() {
  const ev = G.pendingEvent;
  if (!ev) return;

  // War type: handled by dedicated challenge system
  if (ev.type === 'war') {
    acceptWarChallenge();
    return;
  }

  Audio.play('bell');
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
  // v1.0c: Show rental reaction with portrait + traits quote
  if (result.success) {
    const fighter = G.roster.find(c => c.id === fighterId);
    if (fighter) {
      const quote = getRentalQuote(fighter);
      const orgCfg = RIVAL_ORGS.find(o => o.id === fromOrgId);
      showEventPopup({ type:'fighter', id:fighter.id, name:fighter.name, tone:'positive',
        message: quote, detail:`${orgCfg ? orgCfg.name + 'から' : ''}レンタル加入！` });
    }
  } else {
    // Show rejection popup
    const orgData = G.aiOrgs && G.aiOrgs[fromOrgId];
    const fighter = orgData ? orgData.roster.find(f => f.id === fighterId) : null;
    if (fighter) {
      showEventPopup({ type:'fighter', id:fighter.id, name:fighter.name, tone:'negative',
        message: '…今は移籍する気はないわ。', detail:'レンタル交渉は不成立でした' });
    }
  }
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
  // BGM: Restore appropriate BGM when leaving show screens
  if (id !== 'show' && G.weekPhase !== 'showExec') Audio.bgm.playForState();
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

// v1.0: Help accordion toggle
function toggleHelp(btn) {
  const section = btn.closest('.help-section');
  if (!section) return;
  section.classList.toggle('open');
}
