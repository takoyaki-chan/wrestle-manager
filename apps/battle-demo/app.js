(function () {
  'use strict';

  const root = document.getElementById('app');
  const { fighters, opponentByPlayer, statLabels } = window.WMDemoData;
  const config = window.WM_DEMO_CONFIG;
  const { trackEvent } = window.WMDemoAnalytics;

  const state = {
    screen: 'selection',
    selectionPhase: 'player',
    playerId: null,
    opponentId: null,
    result: null,
    enginePromise: null,
    battleFrame: null,
    escapeTimer: null,
    runCount: 0,
    completionTracked: false,
  };

  const BattleMusic = {
    audio: null,
    start() {
      this.stop();
      try {
        const audio = new Audio('./bgm/production-ogg/wm_bgm_m01_v01.ogg');
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0.22;
        this.audio = audio;
        audio.play().catch(() => {});
      } catch (_) {
        this.audio = null;
      }
    },
    stop() {
      if (!this.audio) return;
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (_) {}
      this.audio = null;
    },
  };

  const SelectionSound = {
    play() {
      try {
        const audio = new Audio('./bgm/f11_ready_v1.mp3');
        audio.preload = 'auto';
        audio.volume = 0.42;
        audio.play().catch(() => {});
      } catch (_) {}
    },
  };

  const ResultCrowd = {
    play() {
      try {
        const audio = new Audio('./bgm/e02_crowd_v2.mp3');
        audio.preload = 'auto';
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (_) {}
    },
  };

  function fighterById(id) {
    return fighters.find((fighter) => fighter.id === Number(id)) || null;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function focusApp() {
    window.requestAnimationFrame(() => root.focus({ preventScroll: true }));
  }

  function cleanupBattleFrame() {
    window.clearTimeout(state.escapeTimer);
    state.escapeTimer = null;
    state.battleFrame = null;
    BattleMusic.stop();
    document.body.classList.remove('battle-active');
  }

  function statBars(fighter) {
    return `<div class="demo-ability-bars">${statLabels.map(([key, label]) => `
      <div class="demo-ab-row">
        <span>${escapeHtml(label)}</span>
        <i><b class="${key}" style="width:${Math.max(0, Math.min(100, fighter[key]))}%"></b></i>
        <strong>${fighter[key]}</strong>
      </div>`).join('')}
    </div>`;
  }

  function fighterCard(fighter, selectedRole, locked) {
    const selected = Boolean(selectedRole);
    const roleLabel = selectedRole === 'player' ? 'PLAYER' : selectedRole === 'opponent' ? 'OPPONENT' : '';
    const statusLabel = selectedRole === 'player' ? 'あなたの選手' : selectedRole === 'opponent' ? '対戦相手' : '';
    const canSelect = !locked;
    return `<button class="demo-fighter-card${selected ? ` selected ${selectedRole}-selected` : ''}${locked ? ' locked' : ''}" type="button" role="listitem"
      aria-pressed="${selected}" ${canSelect ? `data-action="select-fighter" data-fighter-id="${fighter.id}"` : 'disabled'}>
      <div class="demo-fighter-art"><img src="${escapeHtml(fighter.image)}" alt="${escapeHtml(fighter.name)}"></div>
      <div class="demo-fighter-info">
        <div class="demo-fighter-head">
          <div><span>${escapeHtml(fighter.type)} / ${escapeHtml(fighter.style)}</span><h2>${escapeHtml(fighter.name)}</h2></div>
          <em><small>OVR</small>${fighter.ovr}</em>
        </div>
        ${statBars(fighter)}
        <p>${escapeHtml(fighter.description)}</p>
      </div>
      ${selected ? `<span class="demo-selected ${selectedRole}"><b>✓ ${roleLabel}</b><small>${statusLabel}</small></span>` : ''}
      ${locked ? '<span class="demo-locked">PLAYER FIXED</span>' : ''}
    </button>`;
  }

  function renderSelection() {
    cleanupBattleFrame();
    state.screen = 'selection';
    state.result = null;
    state.completionTracked = false;
    const player = fighterById(state.playerId);
    const opponent = fighterById(state.opponentId);
    const choosingOpponent = state.selectionPhase === 'opponent';
    const ready = Boolean(player && opponent);
    const heading = !player ? 'まず、あなたの選手を選んでください' : !opponent ? '次に、対戦相手を選んでください' : 'この組み合わせで試合を始めますか？';
    const guide = !player
      ? '選手を1人選ぶと、その選手はPLAYER枠に固定されます。続けて対戦相手を選んでください。'
      : !opponent
        ? 'PLAYER枠は固定されています。青いOPPONENT枠に入れる選手を選んでください。'
        : '選手ごとの能力とスタイルが、技の選択・命中・ダメージ・スタミナ消費・決着までの流れに影響します。';

    root.innerHTML = `<section class="demo-selection" aria-labelledby="selection-title">
      <div class="demo-section-head">
        <div>
          <p>WRESTLE-MANAGER / FREE BATTLE DEMO</p>
          <h1 id="selection-title">${heading}</h1>
          <span class="demo-battle-guide">${guide}</span>
        </div>
        <strong>1 MATCH</strong>
      </div>
      <div class="demo-choice-slots" aria-label="選択状況">
        <div class="demo-choice-slot player${player ? ' filled' : ' active'}">
          <small>STEP 1 · PLAYER</small><strong>${player ? escapeHtml(player.name) : 'あなたの選手を選択'}</strong><span>${player ? '選択済み' : '金色の枠で選択'}</span>
        </div>
        <b>VS</b>
        <div class="demo-choice-slot opponent${opponent ? ' filled' : choosingOpponent ? ' active' : ''}">
          <small>STEP 2 · OPPONENT</small><strong>${opponent ? escapeHtml(opponent.name) : '対戦相手を選択'}</strong><span>${opponent ? '選択済み' : choosingOpponent ? '青色の枠で選択' : 'PLAYER選択後に解放'}</span>
        </div>
      </div>
      <div class="demo-fighter-grid${player ? ' has-player' : ''}${ready ? ' ready' : ''}" role="list" aria-label="デモ選手一覧">
        ${fighters.map((fighter) => fighterCard(
          fighter,
          fighter.id === state.playerId ? 'player' : fighter.id === state.opponentId ? 'opponent' : '',
          choosingOpponent && fighter.id === state.playerId
        )).join('')}
      </div>
      <div class="demo-selection-actions">
        <button class="demo-start-button" type="button" data-action="confirm" ${ready ? '' : 'disabled'}>
          ${ready ? `${escapeHtml(player.name)} vs ${escapeHtml(opponent.name)}で試合を始める` : !player ? 'PLAYERを選択してください' : 'OPPONENTを選択してください'}
        </button>
        ${player ? '<button class="demo-reset-selection" type="button" data-action="reset-selection">PLAYERを選び直す</button>' : ''}
      </div>
    </section>`;
    focusApp();
  }

  function renderLoading() {
    state.screen = 'loading';
    root.innerHTML = `<section class="demo-loading" aria-live="polite">
      <div class="waiting-pulse"></div>
      <p>ONE MATCH BATTLE</p>
      <h1>試合データを準備しています</h1>
      <span>選手の能力とスタイルから試合を組み立てています…</span>
    </section>`;
    focusApp();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-demo-src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve();
        else existing.addEventListener('load', resolve, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.demoSrc = src;
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', () => reject(new Error(`${src} を読み込めませんでした。`)), { once: true });
      document.head.appendChild(script);
    });
  }

  function loadEngine() {
    if (window.WMDemoEngine.isReady()) return Promise.resolve();
    if (!state.enginePromise) {
      state.enginePromise = loadScript('./shared/battle-data.js')
        .then(() => loadScript('./shared/match-engine.js'))
        .then(() => {
          if (!window.WMDemoEngine.isReady()) throw new Error('共有バトルエンジンの初期化に失敗しました。');
        })
        .catch((error) => {
          state.enginePromise = null;
          throw error;
        });
    }
    return state.enginePromise;
  }

  function createSeed(leftId, rightId) {
    const time = Date.now() & 0x7fffffff;
    return (time ^ (leftId * 2654435761) ^ (rightId * 1597334677) ^ state.runCount) | 0 || 1;
  }

  function battleFighter(fighter) {
    return {
      ...fighter,
      portraitUrl: `../image/face_${fighter.assetKey}.png`,
      profile: '',
      vl: Array.isArray(fighter.vl) ? fighter.vl.slice() : ['…！'],
      vsExHit: [],
    };
  }

  function startPayload(player, opponent) {
    return {
      type: 'START_MATCH',
      left: battleFighter(player),
      right: battleFighter(opponent),
      result: state.result,
      matchInfo: {
        header: 'Wrestle-Manager 無料バトルデモ',
        subHeader: `${player.name} vs ${opponent.name}`,
        matchNum: 1,
        totalMatches: 1,
        isTitle: false,
        isSpecialMatch: false,
        matchTier: 1,
        h2hRecord: null,
        rivalryTier: 0,
        leftPersonality: player.personality || 'normal',
        leftArchetype: player.archetype || 'standard',
        rightPersonality: opponent.personality || 'normal',
        rightArchetype: opponent.archetype || 'standard',
        sfxMasterVol: 0.85,
        bgmMasterVol: 0.75,
      },
    };
  }

  async function beginBattle() {
    const player = fighterById(state.playerId);
    const opponent = fighterById(state.opponentId);
    if (!player || !opponent) return;
    BattleMusic.start();
    renderLoading();
    try {
      await loadEngine();
      state.result = window.WMDemoEngine.simulate(player, opponent, createSeed(player.id, opponent.id));
      if (!state.result || !Array.isArray(state.result.frames) || state.result.frames.length === 0) {
        throw new Error('試合フレームが生成されませんでした。');
      }
      state.runCount += 1;
      state.completionTracked = false;
      trackEvent('battle_start', { player: player.name, opponent: opponent.name });
      renderProductBattle(player, opponent);
    } catch (error) {
      renderError(error);
    }
  }

  function renderProductBattle(player, opponent) {
    state.screen = 'battle';
    document.body.classList.add('battle-active');
    root.innerHTML = `<section class="demo-battle-frame" aria-label="${escapeHtml(player.name)}対${escapeHtml(opponent.name)}の試合">
      <iframe title="バトル画面：${escapeHtml(player.name)}対${escapeHtml(opponent.name)}" allow="autoplay"></iframe>
      <button class="demo-battle-exit" type="button" data-action="new-rematch">✕ 選手選択へ戻る</button>
    </section>`;
    const iframe = root.querySelector('iframe');
    state.battleFrame = iframe;
    const payload = startPayload(player, opponent);
    let sent = false;
    const sendOnce = () => {
      if (sent || state.battleFrame !== iframe || !iframe.contentWindow) return;
      sent = true;
      iframe.contentWindow.postMessage(payload, window.location.origin);
    };
    iframe.addEventListener('load', () => window.setTimeout(sendOnce, 150), { once: true });
    iframe.src = `./battle/battle-engine.html?demo=${Date.now()}`;
    window.setTimeout(sendOnce, 850);
    state.escapeTimer = window.setTimeout(() => {
      const escapeButton = root.querySelector('.demo-battle-exit');
      if (escapeButton) escapeButton.classList.add('visible');
    }, 8000);
  }

  function trackBattleComplete() {
    if (state.completionTracked || !state.result) return;
    state.completionTracked = true;
    const player = fighterById(state.playerId);
    const opponent = fighterById(state.opponentId);
    const winner = state.result.winner === 'left' ? player : state.result.winner === 'right' ? opponent : null;
    trackEvent('battle_complete', {
      player: player ? player.name : '',
      opponent: opponent ? opponent.name : '',
      winner: winner ? winner.name : 'draw',
      finish: state.result.finType || '',
      move: state.result.finMove || '',
      turns: state.result.turns || 0,
    });
  }

  function formatFinish(type, move) {
    if (!move) return type || '激闘決着';
    if (type === 'フォール' || type === 'ピン') return `${move} → 3カウント`;
    if (type === 'ギブアップ') return `${move} → ギブアップ`;
    if (type === 'TKO') return `${move} → レフェリーストップ`;
    if (type === '丸め込み') return `${move} → 丸め込み`;
    return `${move} (${type || '決着'})`;
  }

  function formatJapaneseTime(turns) {
    const seconds = Math.max(0, Number(turns || 0) * 18);
    return `${Math.floor(seconds / 60)}分${String(seconds % 60).padStart(2, '0')}秒`;
  }

  function validProductUrl(value) {
    if (!value) return '';
    try {
      const parsed = new URL(value, window.location.href);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
    } catch (_) {
      return '';
    }
  }

  function productLinks() {
    const labels = { booth: 'BOOTHで製品版を見る', dlsite: 'DLsiteで製品版を見る', fanza: 'FANZAで製品版を見る' };
    const links = Object.entries(config.productLinks || {})
      .map(([store, value]) => [store, validProductUrl(value)])
      .filter((entry) => entry[1]);
    if (links.length === 0) return '';
    return `<div class="demo-store-links" aria-label="製品版販売ページ">${links.map(([store, url]) => `
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" data-action="product-link" data-store="${escapeHtml(store)}">${escapeHtml(labels[store] || '製品版を見る')}</a>
    `).join('')}</div>`;
  }

  function promotionLink(name) {
    return validProductUrl((config.promotionLinks || {})[name]);
  }

  function resultDestinations() {
    const freeUrl = promotionLink('trialUrl');
    const products = Object.entries(config.productLinks || {})
      .map(([store, value]) => [store, validProductUrl(value)])
      .filter(([, url]) => url);
    const rows = [];
    if (freeUrl) rows.push(`<div><b>無料版</b><span>BOOTH / takoyakichan.booth.pm/items/8058404</span></div>`);
    for (const [store] of products) {
      const label = store === 'dlsite'
        ? 'DLsite / RJ01592994（ページ内に体験版ダウンロードあり）'
        : store === 'booth'
          ? 'BOOTH / takoyakichan.booth.pm/items/8121734'
          : `${store.toUpperCase()} / 製品版ページ`;
      rows.push(`<div><b>製品版</b><span>${escapeHtml(label)}</span></div>`);
    }
    return rows.length ? `<div class="demo-result-destinations" aria-label="外部リンクの行き先">${rows.join('')}</div>` : '';
  }

  function resultProductOptions() {
    const labels = { booth: 'BOOTHの製品版ページへ', dlsite: 'DLsiteの製品版ページへ', fanza: 'FANZAの製品版ページへ' };
    return Object.entries(config.productLinks || {})
      .map(([store, value]) => [store, validProductUrl(value)])
      .filter(([, url]) => url)
      .map(([store, url]) => `<a class="demo-dialog-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" data-action="product-link" data-store="${escapeHtml(store)}">${escapeHtml(labels[store] || '製品版ページへ')}</a>`)
      .join('');
  }

  function finalHealth(fighter, side) {
    const record = side === 'left' ? state.result.hpLeft : state.result.hpRight;
    const max = Number(record && record.max) || 0;
    const current = Math.max(0, Number(record && (record.final == null ? record.current : record.final)) || 0);
    return { current, max, ratio: max > 0 ? Math.round((current / max) * 100) : 0 };
  }

  function winnerComment(winner) {
    const move = state.result.finMove || state.result.finType || '激闘';
    return `${winner.name}が${move}で勝利。最後まで目が離せない一戦となりました。`;
  }

  function shareResult() {
    const player = fighterById(state.playerId);
    const opponent = fighterById(state.opponentId);
    const winner = state.result.winner === 'left' ? player : state.result.winner === 'right' ? opponent : null;
    const lines = [
      '『Wrestle-Manager』無料バトルデモをプレイ！',
      '',
      `${player ? player.name : ''} vs ${opponent ? opponent.name : ''}`,
      `勝者：${winner ? winner.name : '引き分け'}`,
      `決まり手：${formatFinish(state.result.finType, state.result.finMove)}`,
      `試合時間：${formatJapaneseTime(state.result.turns)}`,
      '',
      'あなたの試合ではどちらが勝つ？',
      window.location.origin + window.location.pathname,
      '#WrestleManager',
    ];
    trackEvent('result_share_click', { player: player ? player.name : '', opponent: opponent ? opponent.name : '', winner: winner ? winner.name : 'draw' });
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  }

  function renderEnd() {
    trackBattleComplete();
    cleanupBattleFrame();
    state.screen = 'end';
    const player = fighterById(state.playerId);
    const opponent = fighterById(state.opponentId);
    const winner = state.result.winner === 'left' ? player : state.result.winner === 'right' ? opponent : null;
    const loser = winner === player ? opponent : player;
    const winnerSide = state.result.winner === 'left' ? 'left' : 'right';
    const loserSide = winnerSide === 'left' ? 'right' : 'left';
    const winnerHealth = winner ? finalHealth(winner, winnerSide) : { ratio: 0 };
    const loserHealth = loser ? finalHealth(loser, loserSide) : { ratio: 0 };
    const followXUrl = promotionLink('followXUrl');
    const freeUrl = promotionLink('trialUrl');
    const productOptions = resultProductOptions();
    root.innerHTML = `<section class="demo-result" aria-labelledby="result-title">
      <div class="demo-result-hero">
        <div class="demo-result-fighter winner"><img src="./image/upper/upper_${escapeHtml(winner ? winner.assetKey : player.assetKey)}.webp" alt="${escapeHtml(winner ? winner.name : player.name)}"></div>
        ${loser ? `<div class="demo-result-fighter loser"><img src="./image/upper/upper_${escapeHtml(loser.assetKey)}.webp" alt="${escapeHtml(loser.name)}"></div>` : ''}
        <div class="demo-result-title">
          <p>MATCH RESULT</p>
          <span>WINNER</span>
          <h1 id="result-title">${winner ? escapeHtml(winner.name) : '時間切れ引き分け'}</h1>
          <strong>決まり手　${escapeHtml(formatFinish(state.result.finType, state.result.finMove))}</strong>
          <em>${winner ? winnerComment(winner) : '最後まで譲らない、拮抗した試合となりました。'}</em>
          <small>ARENA CROWD CHEER / FINISH</small>
        </div>
      </div>
      <div class="demo-result-summary" aria-label="試合結果の詳細">
        <div><small>試合時間</small><strong>${formatJapaneseTime(state.result.turns)}</strong></div>
        <div><small>勝者・残り体力</small><strong>${winnerHealth.ratio}%</strong></div>
        <div class="demo-result-last-move"><small>最後に決まった技</small><strong>${escapeHtml(formatFinish(state.result.finType, state.result.finMove))}</strong></div>
      </div>
      <div class="demo-product-message">
        <strong>この一戦の先に、あなたの団体がある。</strong>
        <span>本編では選手をスカウト・育成し、対戦カードを組み、団体を運営しながら自分だけの女子プロレス史を作っていきます。</span>
      </div>
      <div class="demo-result-cta">
        ${freeUrl ? '<button class="demo-primary-cta" type="button" data-action="open-free-confirm">無料版で団体を始める<small>BOOTH・無料版配布ページを開く</small></button>' : ''}
        ${productOptions ? '<button class="demo-product-cta" type="button" data-action="open-product-options">製品版を見る<small>DLsite または BOOTH の製品版ページへ</small></button>' : ''}
      </div>
      ${resultDestinations()}
      <div class="demo-result-actions">
        <button type="button" data-action="same-rematch">同じ組み合わせでもう一度</button>
        <button type="button" data-action="new-rematch">別の対戦を選ぶ</button>
      </div>
      <div class="demo-result-social">
        <button type="button" data-action="share-result">この試合結果をXで共有</button>
        ${followXUrl ? `<a href="${escapeHtml(followXUrl)}" target="_blank" rel="noopener noreferrer" data-action="follow-x">開発者をXでフォロー</a>` : ''}
      </div>
      <div class="demo-result-dialog" hidden data-result-dialog="free" role="dialog" aria-modal="true" aria-labelledby="free-dialog-title">
        <div class="demo-result-dialog-backdrop" data-action="close-result-dialog"></div>
        <div class="demo-result-dialog-panel"><p>外部ページを開きます</p><h2 id="free-dialog-title">BOOTHの無料版配布ページへ進みますか？</h2><span>新しいタブで BOOTH を開きます。</span><div><a class="demo-dialog-link primary" href="${escapeHtml(freeUrl)}" target="_blank" rel="noopener noreferrer" data-action="primary-cta" data-destination="booth-free">BOOTHへ進む</a><button type="button" data-action="close-result-dialog">この画面に戻る</button></div></div>
      </div>
      <div class="demo-result-dialog" hidden data-result-dialog="products" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <div class="demo-result-dialog-backdrop" data-action="close-result-dialog"></div>
        <div class="demo-result-dialog-panel"><p>製品版ページを選ぶ</p><h2 id="product-dialog-title">どちらの販売ページを開きますか？</h2><span>DLsiteのページには、体験版ダウンロードの案内があります。</span><div>${productOptions}<button type="button" data-action="close-result-dialog">この画面に戻る</button></div></div>
      </div>
    </section>`;
    ResultCrowd.play();
    focusApp();
  }

  function renderError(error) {
    cleanupBattleFrame();
    state.screen = 'error';
    root.innerHTML = `<section class="demo-error" role="alert">
      <p>LOAD ERROR</p>
      <h1>試合を開始できませんでした</h1>
      <span>${escapeHtml(error && error.message ? error.message : 'ページを再読み込みしてください。')}</span>
      <button type="button" data-action="new-rematch">選手選択へ戻る</button>
    </section>`;
    focusApp();
  }

  window.addEventListener('message', (event) => {
    const iframe = state.battleFrame;
    if (!iframe || event.source !== iframe.contentWindow || event.origin !== window.location.origin || !event.data) return;
    if (event.data.type === 'BATTLE_FINISH_CUE') {
      trackBattleComplete();
    } else if (event.data.type === 'MATCH_RESULT') {
      renderEnd();
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'home') {
      event.preventDefault();
      state.playerId = null;
      state.opponentId = null;
      state.selectionPhase = 'player';
      renderSelection();
    } else if (action === 'select-fighter') {
      const selectedId = Number(target.dataset.fighterId);
      SelectionSound.play();
      if (state.selectionPhase === 'player') {
        state.playerId = selectedId;
        state.opponentId = null;
        state.selectionPhase = 'opponent';
      } else {
        state.opponentId = selectedId;
      }
      renderSelection();
    } else if (action === 'reset-selection') {
      state.playerId = null;
      state.opponentId = null;
      state.selectionPhase = 'player';
      SelectionSound.play();
      renderSelection();
    } else if (action === 'confirm') {
      beginBattle();
    } else if (action === 'same-rematch') {
      trackEvent('rematch', { mode: 'same', player: fighterById(state.playerId).name, opponent: fighterById(state.opponentId).name });
      beginBattle();
    } else if (action === 'new-rematch') {
      trackEvent('rematch', { mode: 'different' });
      state.playerId = null;
      state.opponentId = null;
      state.selectionPhase = 'player';
      renderSelection();
    } else if (action === 'product-link') {
      trackEvent('product_link_click', { store: target.dataset.store || 'unknown' });
    } else if (action === 'open-free-confirm') {
      const dialog = root.querySelector('[data-result-dialog="free"]');
      if (dialog) dialog.hidden = false;
    } else if (action === 'open-product-options') {
      const dialog = root.querySelector('[data-result-dialog="products"]');
      if (dialog) dialog.hidden = false;
    } else if (action === 'close-result-dialog') {
      const dialog = target.closest('.demo-result-dialog');
      if (dialog) dialog.hidden = true;
    } else if (action === 'primary-cta') {
      trackEvent('primary_cta_click', { destination: target.dataset.destination || 'unknown' });
    } else if (action === 'share-result') {
      shareResult();
    } else if (action === 'follow-x') {
      trackEvent('follow_x_click', { destination: 'x' });
    }
  });

  window.addEventListener('pagehide', cleanupBattleFrame);
  renderSelection();
  trackEvent('demo_page_view', { path: window.location.pathname });
})();
