// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 0: AUDIO SYSTEM (SFX + BGM)                     ║
// ║  Web Audio API synthesized sounds — no external files     ║
// ╚══════════════════════════════════════════════════════════╝

// Stage overlays live outside weekPhase, so ordinary state restoration cannot
// infer their BGM from G alone. Keep this resolver pure so every restore path
// (navigation, load, mute/unmute and emergency return) makes the same choice.
// WM-M03「因縁戦」の発動ライン。RIVALRY_THRESHOLDS の tier2「宿敵」(相互 rivalry 50+) 以上で
// 通常試合曲を因縁戦曲に差し替える。tier1「因縁」(30+) は OVR 近接だけでも自然に溜まり
// 大半のカードが該当してしまうため、通常試合曲が鳴らなくなる。MQボーナスが 1→2 に上がる
// 節目でもある 50 を境にした。タイトル戦は従来どおり bigMatch を優先する。
const RIVALRY_BGM_MIN_TIER = 2;
function _isRivalryBgmMatch(match) {
  if (!match || typeof G === 'undefined' || !G) return false;
  if (typeof Engine === 'undefined' || !Engine.title?.getRivalryLevel) return false;
  const idOf = (v) => (v && typeof v === 'object') ? v.id : v;
  const l = idOf(match.left), r = idOf(match.right);
  if (!l || !r) return false;
  try {
    const lvl = Engine.title.getRivalryLevel(G, l, r);
    return !!lvl && (lvl.tier || 0) >= RIVALRY_BGM_MIN_TIER;
  } catch (_e) { return false; }
}

// 特別興行の進行曲 A/B 判定。A=前半、B=決勝・大将戦・ラストマッチに入って以降。
function _stlStageTrack(spring) {
  return (spring.phase === 'finalReady' || spring.phase === 'finalResult') ? 'springB' : 'springA';
}
function _awStageTrack(autumn) {
  // 'reorder' = 大将戦の順番決め。ここから先が大将戦なので B へ。
  return autumn.phase === 'reorder' ? 'autumnB' : 'autumnA';
}
function _ppvStageTrack(ppv) {
  // 残す試合が頂上決戦(ラストマッチ)だけになったら B へ。
  const remaining = (ppv.results || []).filter(r => !r).length;
  return remaining <= 1 ? 'ppvB' : 'ppvA';
}
function _jtBoardTrack(jt) {
  // 決勝ラウンドに入ったら B へ。
  const rounds = jt?.result?.rounds || [];
  return (rounds.length && jt.currentRound >= rounds.length - 1) ? 'juniorB' : 'juniorA';
}

function resolveActiveStageBgm(app) {
  if (!app) return null;
  const show = app._showPreview;
  if (show && show.currentWatching >= 0) {
    const match = show.validMatches?.[show.currentWatching];
    const isTagMatch = !!(match?.teamA || match?.teamB || match?.matchType === 'tag');
    if (match?.isTitle && !isTagMatch) return 'bigMatch';
    if (!isTagMatch && _isRivalryBgmMatch(match)) return 'rivalry';
    return 'battle';
  }
  if (app._b3Preview?.watching || app._b2Preview?.watching) return 'bigMatch';
  if (app._warPreview) return app._warPreview.currentWatching >= 0 ? 'bigMatch' : 'war';
  if (app._ppvPreview) return app._ppvPreview.currentWatching >= 0 ? 'bigMatch' : _ppvStageTrack(app._ppvPreview);

  const spring = app._stlPreview;
  if (spring) return spring.phase === 'champion' ? 'preserve' : _stlStageTrack(spring);

  const autumn = app._awPreview;
  if (autumn) return autumn.phase === 'result' || autumn.phase === 'mvp' ? 'preserve' : _awStageTrack(autumn);

  const junior = app._jtPreview;
  if (junior) {
    if (junior.phase === 'finalResult' || junior.bgmTrack === 'preserve') return 'preserve';
    return junior.bgmTrack || 'juniorA';
  }

  const tenchosen = app._tcPreview;
  if (tenchosen) {
    if (tenchosen.tvMode) return null;
    if (tenchosen.phase === 'finalResult' || tenchosen.bgmTrack === 'preserve') return 'preserve';
    return tenchosen.bgmTrack || 'tencho';
  }
  return null;
}

function migrateLegacySummitPendingEvent(state) {
  if (!state || state.pendingEvent?.type !== 'summit') return state;
  const note = '🏆 旧形式の単独頂上決戦はPPV GRAND FINALへ統合済みのため、予約を解除しました';
  return {
    ...state,
    pendingEvent: null,
    weekPhase: state.weekPhase === 'event' ? 'manage' : state.weekPhase,
    gameLog: [...(state.gameLog || []), note],
  };
}

// A result must only affect the two fighters who were actually booked together.
// This also protects rivalry settlement when a stale result array is recovered.
function _sameSinglesPair(match, result) {
  if (!match || !result || match.matchType === 'tag' || result.matchType === 'tag') return false;
  const idOf = value => (value && typeof value === 'object') ? value.id : value;
  const booked = [idOf(match.left), idOf(match.right)].map(Number).sort((a, b) => a - b);
  const fought = [idOf(result.left), idOf(result.right)].map(Number).sort((a, b) => a - b);
  return booked.length === 2
    && fought.length === 2
    && booked.every((id, index) => Number.isFinite(id) && id === fought[index]);
}

/** 挑戦試合のコーチ要約。モーダルには出さず、同じ文面を週次gameLogへ残す。 */
function _challengeRequestCoachLogLine(state, card, result) {
  if (!state || !card || !result || !Array.isArray(card.teamA) || !Array.isArray(card.teamB)
      || !card.teamA[0] || !card.teamB[0]) return '';
  const isInverse = !!card.isInverse;
  const playerWon = isInverse ? result.teamWin === 'B' : result.teamWin === 'A';
  const playerLost = isInverse ? result.teamWin === 'A' : result.teamWin === 'B';
  const playerScore = isInverse ? result.winsB : result.winsA;
  const aiScore = isInverse ? result.winsA : result.winsB;
  const reqName = card.teamA[0].name;
  const oppName = card.teamB[0].name;
  const otherOrgName = isInverse
    ? (card.requesterOrgName || card.otherOrgName || '相手団体')
    : (card.otherOrgName || card.opponentOrgName || '相手団体');
  if (isInverse) {
    if (playerWon) return `社長、挑戦試合 ${playerScore} — ${aiScore}。${otherOrgName}の${reqName}選手の越境挑戦、退けました。`;
    if (playerLost) return `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqName}選手陣に古巣として星を取られる結果になりました。`;
    return `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqName}選手と${oppName}選手の決着は持ち越しです。`;
  }
  if (playerWon) return `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqName}選手が呼んだ舞台、しっかり制しました。`;
  if (playerLost) return `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqName}選手の直訴…結果が伴いませんでした。`;
  return `社長、挑戦試合 ${playerScore} — ${aiScore}。${reqName}選手と${oppName}選手の決着は持ち越しです。`;
}

/** 宿怨の試合前セリフ用。決着戦の勝者を優先し、旧セーブだけH2Hで補う。 */
function _bitterPrematchSide(state, selfId, opponentId) {
  const key = Engine.title.getRivalryKey(selfId, opponentId);
  const winnerId = (state.rivalries || {})[key]?.bitterResolutionWinnerId;
  if (winnerId === selfId) return 'ahead';
  if (winnerId === opponentId) return 'behind';

  // 旧セーブには決着戦勝者IDが無い。互換性のためだけに通算H2Hをフォールバックする。
  const rec = Engine.h2h?.getRecordFor?.(state, selfId, opponentId);
  return rec && rec.wins > rec.losses ? 'ahead' : 'behind';
}

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let bgmMasterGain = null; // BGMカテゴリ全体のマスター
  let sfxMasterGain = null; // SEカテゴリ全体のマスター
  let sfxGain = null;
  let bgmGain = null;
  let bgmNodes = null;  // active BGM oscillator nodes
  let _muted = false;
  let _sfxVol = 0.5;
  let _bgmVol = 0.04; // ≈ demo preview 15%
  let _bgmMuted = false; // BGM-only mute (jingles/SFX still play)
  let _bgmMasterVol = 0.7;  // BGMマスター（デフォルト70%）
  let _sfxMasterVol = 1.0;  // SEマスター（デフォルト100%）
  // ── Per-track volume targets (bgmGain.gain.value) ──
  const CHIPTUNE_BGM_MIX = { kaimaku:0.19, management:0.35, battle:0.32, season_end:0.46, tension:0.42 };
  // ── SUNO BGM file mapping ──
  // 音響刷新 Phase 2 (2026-07-26): 選定ボード(audio-review)の割当どおりに全枠を配線。
  // 新BGMは -17 LUFS 正規化済みのため vol は一律 0.15 を基準にする。
  // 音響刷新前の tension / season_end は廃止し、台帳の S03「不穏」/ D04「世代交代」へ統一。
  // vol は bgm/audio-mixer.html と同じ値を使う。
  const SUNO_BGM = {
    kaimaku:    { file: '../bgm/production-ogg/wm_bgm_c01_v01.ogg', vol: 0.30 }, // WM-C01 タイトル・オープニング
    management: { file: '../bgm/production-ogg/wm_bgm_s00_v01.ogg', vol: 0.26 }, // WM-S00 メインメニュー
    battle:     { file: '../bgm/production-ogg/wm_bgm_m01_v01.ogg', vol: 0.32 }, // WM-M01 通常試合
    // WM-C07 契約交渉。差し替え曲「Static on the Desk」(2026-07-27 Keisuke 指定)。
    // 元 mp3(48kHz/stereo/約187kbps・アルバムアート付き) を、他の production-ogg と同じ
    // vorbis q6/48kHz/stereo へ変換して収めた（アートは除去）。旧 v01 はファイルだけ残してある。
    contract:   { file: '../bgm/production-ogg/wm_bgm_c07_v02.ogg', vol: 0.16 }, // WM-C07 契約交渉
    draftPick:  { file: '../bgm/production-ogg/wm_bgm_c08_v01.ogg', vol: 0.20 }, // WM-C08 ドラフト選択
    draftBid:   { file: '../bgm/production-ogg/wm_bgm_c09_v01.ogg', vol: 0.16 }, // WM-C09 ドラフト入札
    season_end: { file: '../bgm/production-ogg/wm_bgm_d04_v01.ogg', vol: 0.20 }, // WM-D04 世代交代
    tension:    { file: '../bgm/production-ogg/wm_bgm_s03_v01.ogg', vol: 0.20 }, // WM-S03 不穏
  };
  // WM Audio Mixer file-BGM assignments used by match and tournament screens.
  // 特別興行の進行曲は台帳どおり大会別。A=前半 / B=決勝・大将戦・ラストマッチ以降。
  // vol は bgm/audio-mixer.html で Keisuke が実聴して決めた値（2026-07-27 書き出し）。
  // 書き出しでは「まだ割り当てていない音」として並んでいたが、**実際はここで全部使われていた**
  // ため仮の 0.15 のまま残っていた（2026-07-27 に全ファイルを走査して発覚）。
  const STAGE_BGM = {
    bigMatch:   { file: '../bgm/production-ogg/wm_bgm_m04_v01.ogg', vol: 0.33 }, // WM-M04 ビッグマッチ
    rivalry:    { file: '../bgm/production-ogg/wm_bgm_m03_v01.ogg', vol: 0.30 }, // WM-M03 因縁戦
    springA:    { file: '../bgm/production-ogg/wm_bgm_sp01_v01.ogg', vol: 0.19 }, // WM-SP01 春A・タッグリーグ
    springB:    { file: '../bgm/production-ogg/wm_bgm_sp02_v01.ogg', vol: 0.19 }, // WM-SP02 春B・決勝
    juniorA:    { file: '../bgm/production-ogg/wm_bgm_sp03_v01.ogg', vol: 0.17 }, // WM-SP03 夏A・ジュニアトーナメント
    juniorB:    { file: '../bgm/production-ogg/wm_bgm_sp04_v01.ogg', vol: 0.18 }, // WM-SP04 夏B・ジュニア決勝
    autumnA:    { file: '../bgm/production-ogg/wm_bgm_sp05_v01.ogg', vol: 0.17 }, // WM-SP05 秋A・4団体対抗戦
    autumnB:    { file: '../bgm/production-ogg/wm_bgm_sp06_v01.ogg', vol: 0.17 }, // WM-SP06 秋B・大将戦
    ppvA:       { file: '../bgm/production-ogg/wm_bgm_sp07_v01.ogg', vol: 0.18 }, // WM-SP07 冬A・GRAND FINAL
    ppvB:       { file: '../bgm/production-ogg/wm_bgm_sp08_v01.ogg', vol: 0.18 }, // WM-SP08 冬B・GRAND FINALメイン
    tencho:     { file: '../bgm/production-ogg/wm_bgm_sp09_v01.ogg', vol: 0.18 }, // WM-SP09 天頂戦(A/B分割なし)
    // 他団体抗争イベントは台帳に専用枠がないため、同じ「団体 vs 団体」の秋A(SP05)を共用する
    war:        { file: '../bgm/production-ogg/wm_bgm_sp05_v01.ogg', vol: 0.17 },
    // PPV TV中継(ppvTV)は演出上テレビ音量で鳴らすため一段低い。
    // 2026-07-27の書き出しで grandFinalProgress / grandFinalMain にも実聴値が付いたので、
    // それまでの「元の下げ幅を掛ける」按分はやめて、台帳の値をそのまま使っている。
    grandFinalProgress: { file: '../bgm/production-ogg/wm_bgm_sp07_v01.ogg', vol: 0.18 }, // WM-SP07 冬・GRAND FINAL進行(TV中継)
    grandFinalMain:     { file: '../bgm/production-ogg/wm_bgm_m05_v01.ogg', vol: 0.38 }, // WM-M05 ビッグマッチ2(頂上決戦・TV中継)
  };
  // championship は WM-SE-RS04「最高栄誉」の音源を鳴らす枠。0.29→0.39 はミキサー実聴値（2026-07-27）。
  // victory は台帳に載っていない旧ジングルなので据え置き。
  const JINGLE_MIX = { victory:0.38, championship:0.39 };

  // ── U8: 効果音を本番音源へ ────────────────────────────────────────────────
  // ここに載せたキーだけ**ファイル音源**で鳴る。載っていないキーは従来の合成音のまま。
  // **1本ずつ移せる**ので、載せ替えの途中で音が消える事故が起きない。
  // ファイルが読めなければ黙って合成音へ落ちる(音は演出であり、無ければ困るものではない)。
  // 名前と用途の対応は bgm/audio-mixer.html の台帳が正。
  const SE_DIR = '../bgm/production-ogg/';
  //
  // 秒数は実測値(2026-07-27)。**押した瞬間に返る音は 0.5秒以内**でないと操作が重くなるので、
  // 高頻度のキーには短い音だけを当てている。
  const SE_FILES = {
    // ── 操作に即返る音(0.25〜0.51秒) ──────────────────────────
    click:    'wm_se_ui01_v01.ogg',   // UI01 決定        0.49s  ※92箇所。全体の印象を決める
    select:   'wm_se_ui01_v01.ogg',   // UI01 決定        0.49s  おまかせ・確定。「移動」は合わない(Keisuke)
    deselect: 'wm_se_ui02_v01.ogg',   // UI02 取消        0.50s
    error:    'wm_se_ui07_v01.ogg',   // UI07 軽いエラー  0.50s  ※59箇所
    notify:   'wm_se_ui06_v01.ogg',   // UI06 通常通知    0.49s
    tick:     'wm_se_sh05_v01.ogg',   // SH05 入替・並替  0.25s  進行の刻み
    save:     'wm_se_ui04_v01.ogg',   // UI04 設定切替    0.25s
    switch:   'wm_se_ui03_v01.ogg',   // UI03 移動        0.39s  枠を開く・候補を切り替える
    venue:    'wm_se_sh02_v01.ogg',   // SH02 会場決定    0.38s
    paper:    'wm_se_ui09_v01.ogg',   // UI09 紙          0.51s
    spend:    'wm_se_mg04_v01.ogg',   // MG04 支出        0.36s
    policy:   'wm_se_mg01_v01.ogg',   // MG01 方針選択    0.26s
    link:     'wm_se_hr01_v01.ogg',   // HR01 接続        0.40s
    unlink:   'wm_se_hr02_v01.ogg',   // HR02 解除        0.36s
    discover: 'wm_se_hr04_v01.ogg',   // HR04 発見        0.49s
    // ── 情報が出る・お金が動く(1〜1.4秒) ──────────────────────
    reveal:   'wm_se_ui05_v01.ogg',   // UI05 パネル表示  1.35s
    event:    'wm_se_ui05_v01.ogg',   // UI05 パネル表示  1.35s  汎用イベント。reveal と同じ意味
    coin:     'wm_se_mg03_v01.ogg',   // MG03 収入        1.14s
    transfer: 'wm_se_hr08_v01.ogg',   // HR08 到着・出発  1.36s
    // ── 契約(U8: stamp の呼び分け整理 2026-07-30) ──────────────
    // 台帳の HR05「提示」/ HR06「成立」に素直に割る。契約の入口と成立を別の音にする。
    offer:    'wm_se_hr05_v01.ogg',   // HR05 提示        0.26s  交渉開始・契約送信
    confirm:  'wm_se_hr05_v01.ogg',   // HR05 提示        0.26s  モーダルの確定(カチッと短い音・Keisuke聴感)
    reject:   'wm_se_hr07_v01.ogg',   // HR07 拒否・決裂  1.48s  正常な交渉の不成立
    cardPlace: 'wm_se_sh03_v01.ogg',  // SH03 カード配置  1.04s
    cardRemove: 'wm_se_sh04_v01.ogg', // SH04 カード解除  0.28s
    tagMerge: 'wm_se_sh06_v01.ogg',   // SH06 統合        0.36s
    specialMatch: 'wm_se_sh07_v01.ogg', // SH07 特別条件  0.75s
    cardComplete: 'wm_se_sh08_v01.ogg', // SH08 カード完成 1.04s
    // ── 決着・区切り(2.6〜8.6秒。重ねない) ────────────────────
    contract: 'wm_se_hr06_v01.ogg',   // HR06 成立    実効2.6s  契約成立。ファイルは5.10sだが
                                      //   後半は無音(Keisuke)。実効長は defeat と同じ帯なので solo 扱い
    defeat:   'wm_se_rs06_v01.ogg',   // RS06 失敗        2.68s  イベント敗北
    fanfare:  'wm_se_rs05_v01.ogg',   // RS05 達成        3.08s
    matchVictoryFanfare: 'wm_se_rs05_v01.ogg', // RS05 達成 3.08s
    crowd:    'wm_se_cr03_v01.ogg',   // CR03 歓声        3.32s
    bignews:  'wm_se_ev05_v01.ogg',   // EV05 新時代      8.60s  大ニュース(年に数回)
    showStart: 'wm_se_sh09_v01.ogg',  // SH09 興行開始    4.00s
    // ── 試合結果(A-3b)。**あらゆる試合の試合後**で鳴る ────────
    boutWin:  'wm_se_rs01_v01.ogg',   // RS01 通常勝利    4.64s  自団体の勝ち
    boutLose: 'wm_se_rs02_v01.ogg',   // RS02 敗北        4.70s  自団体の負け・引き分け
    boutOther:'wm_se_cr03_v01.ogg',   // CR03 歓声        3.32s  自団体が絡まない試合
  };
  // **意図的に合成音のまま残しているキー**(消し忘れではない):
  //   hover        ホバーのたびにファイルを鳴らすのは重い。台帳にも相当する音が無い
  //   bell/bellx3  台帳にゴングが無い。BTA01「実音カウント」は3カウントで別物
  //   war          該当なし。EV04「裏切り」EV05「新時代」はどちらも文脈が違う
  //   tension_hit  CR06「驚き」4.80s は試合中の一撃には長すぎる
  //   award        0.6秒の朱印アニメに合わせた短いバーストを意図して使っている
  //   victory      Audio.bgm.playJingle('victory') と紛らわしいので保留
  //   stamp        **社長室の決裁書だけ**が使う。0.6秒の朱印アニメと同時に鳴らす短い
  //                バーストで、award と同じ理由で合成音のまま。
  //                2026-07-30(U8): 以前は「セーブ名変更 / 契約成立 / 団体名決定 / モーダル確定」
  //                まで1つの音で賄っていた。11箇所を contract(HR06 成立) / offer(HR05 提示) /
  //                confirm(HR05) / save(UI04) / select(UI01) へ割り、朱印が要る場面だけ残した
  // 同じ音が連続で鳴る場面(フォール連発など)があるので、キーごとに数枚持つ。
  // ただし**結果音は重ねない** — RS01/RS02/CR03 は3〜5秒あり、秋のフォール連発だと
  // 前の音が鳴り終わる前に次が始まって濁る。同じキーの前の音は止めてから鳴らす。
  const _seFilePool = {};
  const _SE_POOL_SIZE = 3;
  // 2.6秒以上の音は、前のが鳴り終わる前に次が始まると濁る。同じキーは止めてから鳴らす。
  // 0.5秒前後の操作音は重なってよい(連打しても詰まらない)
  const _SE_SOLO = new Set([
    'boutWin', 'boutLose', 'boutOther',        // 4.64 / 4.70 / 3.32s
    'defeat', 'fanfare', 'matchVictoryFanfare', // 2.68 / 3.08 / 3.08s
    'contract',                                 // 実効2.6s(ファイル5.10s・後半無音)
    'crowd', 'bignews', 'showStart',            // 3.32 / 8.60 / 4.00s
  ]);
  function _playFileSe(name, vol) {
    const file = SE_FILES[name];
    if (!file) return false;
    let pool = _seFilePool[name];
    if (!pool) {
      pool = _seFilePool[name] = { els: [], idx: 0, broken: false };
      for (let i = 0; i < _SE_POOL_SIZE; i++) {
        const a = new window.Audio(SE_DIR + file);
        a.preload = 'auto';
        a.addEventListener('error', () => { pool.broken = true; }, { once: true });
        pool.els.push(a);
      }
    }
    if (pool.broken) return false;
    if (_SE_SOLO.has(name)) {
      pool.els.forEach(e => { try { e.pause(); e.currentTime = 0; } catch (_e) {} });
    }
    const el = pool.els[pool.idx];
    pool.idx = (pool.idx + 1) % pool.els.length;
    try {
      el.currentTime = 0;
      el.volume = Math.max(0, Math.min(1, _sfxMasterVol * _sfxVol * (vol != null ? vol : 0.5)));
      const pr = el.play();
      if (pr && pr.catch) pr.catch(() => { pool.broken = true; });
      return true;
    } catch (_e) {
      pool.broken = true;
      return false;
    }
  }
  // Per-SE volume mix (sets sfxGain.gain.value before each SE plays)
  //
  // 2026-07-27 Keisuke: クリック音を少し下げた(.50→.36)。92箇所で鳴るので、
  // 他の音と同じ大きさだと操作のたびに耳につく。
  // ホバー(.40)はクリックより小さくないとおかしいので合わせて下げた。
  // select(.50)は「おまかせ・確定」で、同じ音源でも一段大きいままにしてある。
  // 音量は bgm/audio-mixer.html で Keisuke が実聴して決めた値(2026-07-27 書き出し)。
  // 同じ音源を共有するキーは同じ値が並ぶ(click/select、save/switch、reveal/event、crowd/boutOther、
  // fanfare/matchVictoryFanfare)。片方だけ変えたいときは台帳ではなくここで分ける。
  // ミキサーで未指定のキー(hover/bell/impact/victory/award/因縁系/stamp/boutDraw 等)は従来値のまま。
  const SE_MIX = {
    click:.13, hover:.26, select:.13, deselect:.12, error:.11, save:.14, notify:.14, switch:.14, venue:.46,
    policy:.15, link:.18, unlink:.16, discover:.14, reject:.18,
    cardPlace:.20, cardRemove:.14, tagMerge:.16, specialMatch:.20, cardComplete:.20, showStart:.18,
    tick:.18, event:.04, reveal:.04, paper:.06, bignews:.41,
    fanfare:.33, crowd:.18, bell:.56, bellx3:.76, impact:.61, victory:.70, defeat:.25,
    war:.60, transfer:.24, award:.72, tension_hit:.66,
    rivalry_confrontation:.64, fate_confrontation:.63, rivalry_resolution:.50, fate_resolution:.57,
    coin:.25, spend:.05, stamp:.40, matchVictoryFanfare:.33,
    // 契約(U8)。contract は2.6秒の区切り音なので fanfare より控えめ、offer/confirm は操作音の帯
    contract:.30, offer:.15, confirm:.15,
    // 試合結果。1試合ごとに何度も鳴るので、大会ファンファーレより控えめに保つ
    boutWin:.34, boutLose:.32, boutOther:.18, boutDraw:.30,
  };

  // Lazy-init AudioContext (must be triggered by user gesture)
  function ensure() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(ctx.destination);
    bgmMasterGain = ctx.createGain();
    bgmMasterGain.gain.value = _bgmMasterVol;
    bgmMasterGain.connect(masterGain);
    sfxMasterGain = ctx.createGain();
    sfxMasterGain.gain.value = _sfxMasterVol;
    sfxMasterGain.connect(masterGain);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = _sfxVol;
    sfxGain.connect(sfxMasterGain);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = _bgmVol;
    bgmGain.connect(bgmMasterGain);
    // Load saved prefs
    try {
      const prefs = JSON.parse(localStorage.getItem('wm_audio') || '{}');
      if (prefs.sfxVol !== undefined) { _sfxVol = prefs.sfxVol; sfxGain.gain.value = _sfxVol; }
      if (prefs.bgmVol !== undefined) { _bgmVol = prefs.bgmVol; bgmGain.gain.value = _bgmVol; }
      if (prefs.bgmMasterVol !== undefined) { _bgmMasterVol = prefs.bgmMasterVol; bgmMasterGain.gain.value = _bgmMasterVol; }
      if (prefs.sfxMasterVol !== undefined) { _sfxMasterVol = prefs.sfxMasterVol; sfxMasterGain.gain.value = _sfxMasterVol; }
      if (prefs.muted) { _muted = true; masterGain.gain.value = 0; }
      if (prefs.bgmMuted) { _bgmMuted = true; }
    } catch(e) {}
    return ctx;
  }

  function savePrefs() {
    try { localStorage.setItem('wm_audio', JSON.stringify({sfxVol:_sfxVol, bgmVol:_bgmVol, muted:_muted, bgmMuted:_bgmMuted, bgmMasterVol:_bgmMasterVol, sfxMasterVol:_sfxMasterVol})); } catch(e) {}
  }

  // ── Utility: create a quick envelope oscillator ──
  function osc(freq, type, startTime, duration, gain, dest) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
    return o;
  }

  // ── Utility: white noise burst ──
  function noise(startTime, duration, gain, dest) {
    const c = ensure();
    const bufSize = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    // Bandpass for texture
    const flt = c.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 2000;
    flt.Q.value = 1;
    src.connect(flt);
    flt.connect(g);
    g.connect(dest || sfxGain);
    src.start(startTime);
    src.stop(startTime + duration + 0.05);
  }

  // battle-sfx.js の mkNoise と同じ無加工ホワイトノイズ
  function rawNoise(startTime, duration, gain, dest) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(g);
    g.connect(dest || sfxGain);
    src.start(startTime);
    src.stop(startTime + duration + 0.05);
  }

  // ── Utility: frequency sweep oscillator ──
  function oscSweep(f0, f1, type, startTime, duration, gain, dest) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, startTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), startTime + duration);
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
  }

  // ── Utility: filtered noise variants ──
  function noiseHP(startTime, duration, gain, hpFreq) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
    s.connect(hp); hp.connect(g); g.connect(sfxGain);
    s.start(startTime); s.stop(startTime + duration + 0.05);
  }

  function noiseLP(startTime, duration, gain, lpFreq) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lpFreq;
    s.connect(lp); lp.connect(g); g.connect(sfxGain);
    s.start(startTime); s.stop(startTime + duration + 0.05);
  }

  function noiseBP(startTime, duration, gain, freq, q) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q || 1;
    s.connect(bp); bp.connect(g); g.connect(sfxGain);
    s.start(startTime); s.stop(startTime + duration + 0.05);
  }

  // ── Utility: bell partial with slow decay (for metallic gong) ──
  function bellPartial(freq, startTime, duration, gain) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(gain, startTime);
    g.gain.setTargetAtTime(0.001, startTime, duration * 0.35);
    o.connect(g);
    g.connect(sfxGain);
    o.start(startTime);
    o.stop(startTime + duration * 1.2);
  }

  // ╔══════════════════════════════════════════════════╗
  // ║  SOUND DEFINITIONS                               ║
  // ╚══════════════════════════════════════════════════╝
  const SFX = {
    // ── UI (NEW) ──
    click() {
      const t = ensure().currentTime;
      noiseHP(t, 0.02, 0.08, 4000);
      osc(900, 'sine', t + 0.01, 0.04, 0.12);
      osc(1200, 'sine', t + 0.02, 0.03, 0.06);
    },
    hover() {
      const t = ensure().currentTime;
      osc(3200, 'sine', t, 0.025, 0.04);
      osc(4800, 'sine', t, 0.015, 0.02);
      noiseHP(t, 0.015, 0.02, 6000);
    },
    select() {
      const t = ensure().currentTime;
      osc(659, 'sine', t, 0.08, 0.15);
      osc(784, 'sine', t + 0.05, 0.08, 0.15);
      osc(1047, 'sine', t + 0.10, 0.12, 0.18);
      osc(1047, 'triangle', t + 0.10, 0.2, 0.06);
      noiseHP(t + 0.10, 0.06, 0.02, 8000);
    },
    deselect() {
      const t = ensure().currentTime;
      const c = ensure();
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(800, t);
      o.frequency.exponentialRampToValueAtTime(300, t + 0.1);
      f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.1);
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.15);
    },
    error() {
      const t = ensure().currentTime;
      const c = ensure();
      [0, 0.08].forEach(d => {
        const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        o.type = 'square'; o.frequency.value = 160;
        f.type = 'lowpass'; f.frequency.value = 600;
        g.gain.setValueAtTime(0.07, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.06);
        o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t + d); o.stop(t + d + 0.07);
      });
    },
    save() {
      const t = ensure().currentTime;
      noiseHP(t, 0.03, 0.06, 5000);
      osc(1047, 'sine', t + 0.06, 0.1, 0.1);
      osc(1319, 'sine', t + 0.12, 0.12, 0.1);
      osc(1568, 'sine', t + 0.18, 0.2, 0.08);
      osc(1568, 'triangle', t + 0.18, 0.25, 0.04);
    },
    notify() {
      const t = ensure().currentTime;
      osc(1047, 'sine', t, 0.08, 0.12);
      osc(1047, 'triangle', t, 0.06, 0.04);
      osc(1397, 'sine', t + 0.12, 0.1, 0.12);
      osc(1397, 'triangle', t + 0.12, 0.08, 0.04);
    },
    // MQ再設計P4: 大ニュース専用SE — notify(C6→F6)にベル系スパークルを重ねた合成
    bignews() {
      const t = ensure().currentTime;
      osc(1047, 'sine', t, 0.08, 0.12);
      osc(1047, 'triangle', t, 0.06, 0.04);
      osc(1397, 'sine', t + 0.12, 0.1, 0.12);
      osc(1397, 'triangle', t + 0.12, 0.08, 0.04);
      bellPartial(2093, t + 0.12, 0.5, 0.09);
      bellPartial(3136, t + 0.18, 0.4, 0.06);
      noiseHP(t + 0.12, 0.18, 0.05, 7000);
    },
    tick() {
      const t = ensure().currentTime;
      noiseHP(t, 0.012, 0.06, 6000);
      osc(2400, 'sine', t, 0.02, 0.08);
      osc(1800, 'sine', t + 0.015, 0.025, 0.05);
    },
    // notifyより一段重い「ポォン」— E5→G5 上昇2音
    event() {
      const t = ensure().currentTime;
      osc(659, 'sine', t, 0.09, 0.18);
      osc(659, 'triangle', t, 0.04, 0.08);
      osc(784, 'sine', t + 0.14, 0.12, 0.22);
      osc(784, 'triangle', t + 0.14, 0.05, 0.10);
      noiseHP(t + 0.14, 0.02, 0.06, 5000);
    },
    // ソフトなシンバルブラシ＋高域sine減衰 — アワード式スライド切替
    reveal() {
      const t = ensure().currentTime;
      noiseHP(t, 0.04, 0.05, 5000);
      osc(2093, 'sine', t + 0.02, 0.03, 0.12);
      osc(3136, 'sine', t + 0.04, 0.02, 0.10);
    },

    paper() {
      const t = ensure().currentTime;
      noiseBP(t, 0.11, 0.08, 1800, 0.8);
      noiseHP(t + 0.015, 0.06, 0.05, 4200);
      oscSweep(980, 420, 'triangle', t + 0.01, 0.12, 0.05);
      osc(760, 'sine', t + 0.05, 0.08, 0.04);
    },

    // ── Events (OLD: fanfare / NEW: rest) ──
    fanfare() {
      const t = ensure().currentTime;
      osc(523, 'sine', t, 0.15, 0.2);
      osc(659, 'sine', t + 0.1, 0.15, 0.2);
      osc(784, 'sine', t + 0.2, 0.15, 0.2);
      osc(1047, 'sine', t + 0.35, 0.4, 0.25);
      osc(1047, 'triangle', t + 0.35, 0.5, 0.1);
      noise(t + 0.35, 0.15, 0.04);
    },
    crowd() {
      try {
        const a = new window.Audio('../bgm/e02_crowd_v2.mp3');
        a.volume = Math.min(1, _sfxMasterVol * SE_MIX.crowd);
        a.play().catch(() => {});
      } catch(e) {
        // fallback: Web Audio synth
        const t = ensure().currentTime;
        noiseLP(t, 0.8, 0.08, 400);
        noiseBP(t + 0.05, 0.7, 0.06, 1200, 0.5);
        noiseHP(t + 0.1, 0.5, 0.03, 3000);
        oscSweep(180, 140, 'sawtooth', t, 0.4, 0.02);
      }
    },
    // Bell: metallic gong with rising tail (low partials short, high partials long)
    bell() {
      const t = ensure().currentTime;
      const base = 420;
      bellPartial(base * 1.0,  t, 0.3, 0.16);
      bellPartial(base * 2.32, t, 0.5, 0.11);
      bellPartial(base * 3.8,  t, 0.7, 0.07);
      bellPartial(base * 5.1,  t, 0.9, 0.04);
      bellPartial(base * 6.7,  t, 1.0, 0.025);
      noiseHP(t, 0.025, 0.07, 5000);
    },
    // Bell x3: match-end gong (カンカンカン)
    bellx3() {
      [0, 380, 760].forEach(d => setTimeout(() => { try { SFX.bell(); } catch(e) {} }, d));
    },
    impact() {
      const t = ensure().currentTime;
      oscSweep(100, 30, 'sine', t, 0.2, 0.3);
      oscSweep(80, 20, 'triangle', t, 0.25, 0.15);
      noise(t, 0.06, 0.25);
      noiseLP(t, 0.15, 0.12, 300);
      osc(50, 'sine', t + 0.05, 0.3, 0.1);
    },
    victory() {
      const t = ensure().currentTime;
      [523, 659, 784, 1047].forEach((f, i) => {
        osc(f, 'sine', t + i * 0.07, 0.2, 0.15);
        osc(f * 2, 'sine', t + i * 0.07, 0.15, 0.05);
      });
      osc(1047, 'triangle', t + 0.28, 0.6, 0.08);
      osc(2094, 'sine', t + 0.28, 0.4, 0.04);
      noiseHP(t + 0.28, 0.15, 0.03, 6000);
    },
    // 1試合ぶんの決着音。**小さくても勝利らしい音**(2026-07-26 Keisuke)。
    // **これは仮置きの合成音。** 音のリデザインの回で、用意済みの音源
    // WM-SE-RS01「通常勝利」/ RS02「敗北」に当て直すこと(ロードマップ A-3b)。
    // 合成音は bgm/audio-mixer.html で試聴できないため、良し悪しを判断できない。
    // matchVictoryFanfare は2秒級の大会用ファンファーレで、1フォールごとに鳴らすには重い。
    // 短い上昇3音＋軽い拍手のにじみ。1試合ごとに何度も鳴るので**控えめに**。
    boutWin() {
      const c = ensure();
      const t = c.currentTime;
      [659, 784, 1047].forEach((freq, i) => {
        const at = t + i * 0.07;
        osc(freq, 'sine', at, 0.22, 0.09);
        osc(freq * 2, 'sine', at, 0.14, 0.025);
      });
      noiseHP(t + 0.14, 0.22, 0.02, 4200);
    },
    // 引き分け・決着つかず。勝利音を鳴らすと嘘になるので、短く止める音
    boutDraw() {
      const c = ensure();
      const t = c.currentTime;
      osc(392, 'sine', t, 0.28, 0.08);
      osc(330, 'sine', t + 0.1, 0.3, 0.06);
    },
    // 会場決定。本番音源 SH02 の保険
    venue() {
      const c = ensure();
      const t = c.currentTime;
      osc(523, 'sine', t, 0.18, 0.06);
      osc(784, 'sine', t + 0.05, 0.2, 0.045);
    },
    // 枠・選手の切り替え(カキッ)。本番音源 UI04 の保険
    switch() {
      const c = ensure();
      const t = c.currentTime;
      osc(880, 'square', t, 0.05, 0.035);
      noiseHP(t, 0.05, 0.02, 5200);
    },
    policy() { SFX.switch(); },
    link() { SFX.select(); },
    unlink() { SFX.deselect(); },
    discover() { SFX.notify(); },
    reject() { SFX.defeat(); },
    cardPlace() { SFX.select(); },
    cardRemove() { SFX.deselect(); },
    tagMerge() { SFX.switch(); },
    specialMatch() { SFX.reveal(); },
    cardComplete() { SFX.fanfare(); },
    showStart() { SFX.crowd(); },
    // 以下2つは本番音源(RS02 / CR03)の**保険**。音源が読めなかったときだけ鳴る
    boutLose() {
      const c = ensure();
      const t = c.currentTime;
      osc(392, 'sine', t, 0.34, 0.08);
      osc(294, 'sine', t + 0.12, 0.4, 0.07);
    },
    boutOther() {
      const c = ensure();
      const t = c.currentTime;
      noiseHP(t, 0.5, 0.03, 1800);
    },
    // オーディオミキサー ff04 / battle f10 と同じ試合勝利ファンファーレ
    matchVictoryFanfare() {
      const c = ensure();
      const t = c.currentTime;
      [0, 0.06, 0.12, 0.18].forEach(offset => oscSweep(60, 30, 'sine', t + offset, 0.08, 0.15));
      [523, 659, 784, 1047].forEach((freq, index) => {
        const at = t + 0.4 + index * 0.08;
        osc(freq, 'sawtooth', at, 0.12, 0.05);
        osc(freq, 'sine', at, 0.15, 0.13);
        osc(freq * 2, 'sine', at, 0.1, 0.03);
      });
      [523, 659, 784, 988, 1047, 1319].forEach(freq => osc(freq, 'sine', t + 0.9, 1.2, 0.16));
      rawNoise(t + 0.9, 0.3, 0.03);
      [2093, 2637, 3136].forEach((freq, index) => osc(freq, 'sine', t + 1.5 + index * 0.1, 0.25, 0.07));
      osc(131, 'sine', t + 1.8, 0.6, 0.08);
    },
    defeat() {
      const t = ensure().currentTime;
      osc(392, 'sine', t, 0.35, 0.14);
      osc(349, 'sine', t + 0.2, 0.35, 0.12);
      osc(311, 'sine', t + 0.4, 0.6, 0.10);
      osc(311, 'triangle', t + 0.4, 0.8, 0.04);
      oscSweep(200, 100, 'sine', t + 0.3, 0.7, 0.03);
    },
    war() {
      const t = ensure().currentTime;
      oscSweep(200, 60, 'sine', t, 0.08, 0.15);
      noise(t, 0.04, 0.12);
      osc(147, 'sawtooth', t + 0.1, 0.2, 0.05);
      osc(150, 'sawtooth', t + 0.1, 0.2, 0.05);
      oscSweep(200, 350, 'square', t + 0.25, 0.2, 0.04);
      noiseHP(t + 0.35, 0.15, 0.06, 2000);
    },
    transfer() {
      const t = ensure().currentTime;
      const c = ensure();
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(400, t + 0.3);
      f.type = 'bandpass'; f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(4000, t + 0.15);
      f.frequency.exponentialRampToValueAtTime(800, t + 0.3);
      f.Q.value = 2;
      g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.4);
      noiseHP(t + 0.05, 0.15, 0.04, 3000);
    },
    // C5-E5-G5 ベルハーモニクス＋スパークル — 受賞発表（fanfare代替）
    award() {
      const t = ensure().currentTime;
      bellPartial(523, t,        0.4, 0.15);
      bellPartial(659, t + 0.12, 0.5, 0.12);
      bellPartial(784, t + 0.26, 0.6, 0.09);
      noiseHP(t + 0.26, 0.08, 0.04, 7000);
    },
    // 短いドラムロール → シンバル一打 — ランキング発表等
    tension_hit() {
      const t = ensure().currentTime;
      noiseLP(t,        0.12, 0.15, 200);
      noiseLP(t + 0.04, 0.10, 0.11, 250);
      noiseLP(t + 0.09, 0.08, 0.08, 300);
      noiseHP(t + 0.18, 0.5,  0.12, 4000);
      osc(60, 'sine',   t + 0.18, 0.4, 0.08);
    },

    // ── Money (NEW) ──
    coin() {
      const t = ensure().currentTime;
      osc(1200, 'sine', t, 0.08, 0.1);
      osc(1800, 'sine', t + 0.01, 0.06, 0.08);
      osc(3600, 'sine', t + 0.02, 0.04, 0.06);
      osc(5400, 'sine', t + 0.02, 0.02, 0.03);
      noiseHP(t, 0.015, 0.04, 8000);
    },
    spend() {
      const t = ensure().currentTime;
      oscSweep(600, 200, 'triangle', t, 0.1, 0.08);
      noiseHP(t, 0.06, 0.05, 3000);
      osc(300, 'sine', t + 0.05, 0.08, 0.05);
    },
    stamp() {
      const t = ensure().currentTime;
      oscSweep(200, 60, 'sine', t, 0.06, 0.15);
      noiseLP(t, 0.04, 0.12, 500);
      noiseBP(t + 0.03, 0.08, 0.04, 2000, 2);
      osc(800, 'sine', t + 0.12, 0.08, 0.1);
      osc(1000, 'sine', t + 0.17, 0.1, 0.08);
    },

    // ── 契約(U8: stamp の呼び分け整理 2026-07-30)の合成音保険 ──
    // 本番はファイル(HR06/HR05)を鳴らす。ここは音源が読めない環境で無音にならないための保険。
    // contract は「成立」なので朱印+上向きの和音で締める。offer/confirm は短いカチッだけ。
    contract() {
      const t = ensure().currentTime;
      oscSweep(200, 60, 'sine', t, 0.06, 0.15);
      noiseLP(t, 0.04, 0.12, 500);
      osc(784, 'sine', t + 0.14, 0.12, 0.09);
      osc(1047, 'sine', t + 0.24, 0.14, 0.09);
      osc(1319, 'triangle', t + 0.36, 0.30, 0.07);
    },
    offer() {
      const t = ensure().currentTime;
      noiseHP(t, 0.02, 0.05, 6000);
      osc(1175, 'sine', t + 0.02, 0.07, 0.09);
    },
    confirm() {
      const t = ensure().currentTime;
      noiseHP(t, 0.02, 0.05, 6000);
      osc(1175, 'sine', t + 0.02, 0.07, 0.09);
    },

    // ── Rivalry SFX (NEW) ──
    // 宣戦布告: ドラムロール→ゴング→ブラス上昇→歓声
    rivalry_confrontation() {
      const t = ensure().currentTime;
      // 1. ドラムロール連打（5発、クレッシェンド）
      for (let i = 0; i < 5; i++) {
        const g = 0.04 + i * 0.025;
        noiseLP(t + i * 0.08, 0.06, g, 300);
        osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, g * 0.5);
      }
      // 2. ゴング一打
      osc(90, 'sine', t + 0.4, 1.2, 0.12);
      osc(800, 'sine', t + 0.4, 0.3, 0.06);
      osc(1600, 'sine', t + 0.4, 0.15, 0.03);
      noiseHP(t + 0.4, 0.08, 0.06, 5000);
      // 3. ブラス上昇＋歓声
      oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05);
      noiseHP(t + 0.8, 0.6, 0.04, 2000);
    },
    // 宿命の相手 宣戦布告: より太く長い
    fate_confrontation() {
      const t = ensure().currentTime;
      const vol = 1.2;
      // 1. ドラムロール連打（5発、クレッシェンド、音量1.2倍）
      for (let i = 0; i < 5; i++) {
        const g = (0.04 + i * 0.025) * vol;
        noiseLP(t + i * 0.08, 0.06, g, 300);
        osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, g * 0.5);
      }
      // 2. ゴング一打
      osc(90, 'sine', t + 0.4, 1.2, 0.12 * vol);
      osc(800, 'sine', t + 0.4, 0.3, 0.06 * vol);
      osc(1600, 'sine', t + 0.4, 0.15, 0.03 * vol);
      noiseHP(t + 0.4, 0.08, 0.06 * vol, 5000);
      // 3. ブラス上昇＋歓声（延長）
      oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05 * vol);
      noiseHP(t + 0.8, 0.9, 0.04 * vol, 2000);
      // 4. 太い低音＋追加ブラス
      osc(60, 'sine', t + 0.5, 1.5, 0.08);
      oscSweep(300, 600, 'sawtooth', t + 0.8, 0.5, 0.04);
    },
    // 宿敵決着: インパクト＋ファンファーレ＋歓声
    rivalry_resolution() {
      const t = ensure().currentTime;
      // インパクト
      osc(60, 'sine', t, 0.3, 0.1);
      noise(t, 0.06, 0.1);
      // ファンファーレ（4音）
      bellPartial(523, t + 0.1,  0.5, 0.12);
      bellPartial(659, t + 0.22, 0.6, 0.10);
      bellPartial(784, t + 0.36, 0.7, 0.08);
      bellPartial(1047, t + 0.5, 0.8, 0.06);
      // 歓声
      noiseHP(t + 0.3, 0.8, 0.05, 2000);
      noiseHP(t + 0.5, 0.5, 0.03, 5000);
    },
    // 宿命の相手 最終決着: 壮大版
    fate_resolution() {
      const t = ensure().currentTime;
      // 深いインパクト
      osc(50, 'sine', t, 0.5, 0.12);
      osc(100, 'sine', t, 0.3, 0.08);
      noise(t, 0.08, 0.12);
      // 壮大ファンファーレ（5音）
      bellPartial(523, t + 0.1,  0.7, 0.14);
      bellPartial(659, t + 0.25, 0.8, 0.12);
      bellPartial(784, t + 0.4,  0.9, 0.10);
      bellPartial(1047, t + 0.55, 1.0, 0.08);
      bellPartial(1319, t + 0.7, 0.8, 0.06);
      // 大歓声
      noiseHP(t + 0.3, 1.2, 0.06, 2000);
      noiseHP(t + 0.6, 0.8, 0.04, 5000);
      // 低音の重み
      osc(65, 'sine', t + 0.5, 1.0, 0.06);
      oscSweep(200, 400, 'sawtooth', t + 0.8, 0.5, 0.03);
    },
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  BGM SYSTEM — SFC-style chiptune (v1.0)         ║
  // ╚══════════════════════════════════════════════════╝
  const NT = { // Note frequencies
    C3:130.81,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196.00,A3:220.00,Bb3:233.08,B3:246.94,
    C4:261.63,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,G4:392.00,Ab4:415.30,A4:440.00,Bb4:466.16,B4:493.88,
    C5:523.25,D5:587.33,Eb5:622.25,E5:659.25,F5:698.46,G5:783.99,A5:880.00,Bb5:932.33,B5:987.77,C6:1046.50,D6:1174.66
  };

  // ── Helpers: note + drum synthesis ──
  function bgmNote(freq, type, t0, dur, gain) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const atk = Math.min(0.02, dur * 0.1);
    const rel = Math.min(0.05, dur * 0.2);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + atk);
    g.gain.setValueAtTime(gain, t0 + dur - rel);
    g.gain.linearRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(bgmGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
    bgmNodes.push(o);
  }
  function bgmKick(t, gn) {
    const c = ensure();
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    g.gain.setValueAtTime(gn, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(bgmGain); o.start(t); o.stop(t + 0.15); bgmNodes.push(o);
  }
  function bgmSnare(t, gn) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
    const g = c.createGain(); g.gain.setValueAtTime(gn, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    src.connect(hp); hp.connect(g); g.connect(bgmGain); src.start(t); src.stop(t + 0.1); bgmNodes.push(src);
    const o = c.createOscillator(); const g2 = c.createGain();
    o.type = 'sine'; o.frequency.value = 200;
    g2.gain.setValueAtTime(gn * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g2); g2.connect(bgmGain); o.start(t); o.stop(t + 0.06); bgmNodes.push(o);
  }
  function bgmHH(t, gn, open) {
    const c = ensure();
    const dur = open ? 0.08 : 0.03;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = c.createGain(); g.gain.setValueAtTime(gn, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(g); g.connect(bgmGain); src.start(t); src.stop(t + dur + 0.01); bgmNodes.push(src);
  }

  // タイトル画面・団体設定・難易度選択のいずれかが表示中か。
  // この3枚はゲーム開始前の同一シーケンスとして扱い、WM-C01 を通しで流す。
  function _isTitleFlowVisible() {
    try {
      return ['titleScreen', 'orgSetupScreen', 'difficultyScreen'].some(id => {
        const el = document.getElementById(id);
        return el && el.style.display !== 'none';
      });
    } catch (e) { return false; }
  }

  const BGM = {
    _playing: false,
    _interval: null,
    _current: null, // track name: 'kaimaku','management','battle','season_end'

    // ── Public API ──
    play(trackName) {
      if (_bgmMuted) return; // BGM muted — skip looping tracks
      // SUNO MP3がある曲はFileBGMで再生
      const suno = SUNO_BGM[trackName];
      if (suno) {
        // FileBGM._audio が消えていたら「再生中」と見なさず再生し直す
        if (trackName === BGM._current && BGM._playing && FileBGM._audio) return;
        BGM.stop();
        FileBGM.play(suno.file, { loop: true, volume: suno.vol });
        // FileBGM.play()内部でBGM.stop()が呼ばれるため、状態セットはその後に行う
        BGM._playing = true;
        BGM._current = trackName;
        return;
      }
      // フォールバック: チップチューン
      if (trackName === BGM._current && BGM._playing) return;
      if (FileBGM._audio) FileBGM.stop();
      BGM.stop();
      const c = ensure();
      if (c.state === 'suspended') c.resume();
      bgmNodes = [];
      BGM._playing = true;
      BGM._current = trackName;
      const fn = BGM._tracks[trackName];
      if (bgmGain) bgmGain.gain.value = CHIPTUNE_BGM_MIX[trackName] ?? _bgmVol;
      if (fn) fn();
    },

    playStage(name) {
      if (_bgmMuted) return;
      const stage = STAGE_BGM[name];
      if (!stage) return;
      const activeSrc = FileBGM._audio?.src || '';
      const filename = stage.file.split('/').pop();
      if (FileBGM._audio && activeSrc.includes(filename)) {
        BGM._playing = true;
        BGM._current = `stage:${name}`;
        return;
      }
      FileBGM.play(stage.file, { loop: true, volume: stage.vol });
      BGM._playing = true;
      BGM._current = `stage:${name}`;
    },

    playJingle(name) {
      BGM.stop(); // Stop looping BGM, then play jingle (always plays regardless of bgmMuted)
      // 特別大会結果: オーディオミキサー ff07 のMP3 v5を使用（bgmMuted無視で必ず再生）
      if (name === 'championship') {
        FileBGM.stop();
        // 音響刷新 Phase 1: 最高栄誉ジングルを WM-SE-RS04 (旧J04王座移動採用曲) へ差し替え
        const a = new window.Audio('../bgm/production-ogg/wm_se_rs04_v01.ogg');
        a.volume = Math.min(1.0, JINGLE_MIX.championship);
        a.addEventListener('error', () => {
          console.warn('[Audio] championship jingle failed to load, falling back to synth');
          if (BGM._current === 'jingle_championship' && BGM._playing) {
            const fn = BGM._jingles[name];
            if (bgmGain) bgmGain.gain.value = JINGLE_MIX[name] ?? _bgmVol;
            if (fn) fn();
          }
        }, { once: true });
        a.play().catch(err => {
          console.warn('[Audio] championship jingle failed to play, falling back to synth', err);
          if (BGM._current === 'jingle_championship' && BGM._playing) {
            const fn = BGM._jingles[name];
            if (bgmGain) bgmGain.gain.value = JINGLE_MIX[name] ?? _bgmVol;
            if (fn) fn();
          }
        });
        FileBGM._audio = a;
        BGM._playing = true;
        BGM._current = 'jingle_' + name;
        return;
      }
      const c = ensure();
      if (c.state === 'suspended') c.resume();
      bgmNodes = [];
      BGM._playing = true;
      BGM._current = 'jingle_' + name;
      const fn = BGM._jingles[name];
      if (bgmGain) bgmGain.gain.value = JINGLE_MIX[name] ?? _bgmVol;
      if (fn) fn();
    },

    // 曲を消して無音にする（ファイルBGMは余韻を残してフェード）。
    // オープニング4幕のようにBGMを持たない区間へ入るときに使う。
    fadeOutStop(durationMs = 900) {
      if (BGM._interval) { clearInterval(BGM._interval); BGM._interval = null; }
      BGM._playing = false;
      BGM._current = null;
      if (FileBGM._audio) return FileBGM.fadeOut(durationMs);
      BGM.stop();
      return Promise.resolve();
    },

    stop() {
      const wasSuno = BGM._current && SUNO_BGM[BGM._current];
      const wasStage = typeof BGM._current === 'string' && BGM._current.startsWith('stage:');
      BGM._playing = false;
      BGM._current = null;
      if (BGM._interval) { clearInterval(BGM._interval); BGM._interval = null; }
      if (bgmNodes) {
        bgmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
        bgmNodes = [];
      }
      if ((wasSuno || wasStage) && FileBGM._audio) FileBGM.stop();
    },

    // ── Track implementations ──
    _tracks: {
      // ═══ BGM 1: 開幕 (BPM 115, D minor) — 静かな緊迫感 ═══
      kaimaku() {
        const bpm = 115, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.06, bg = 0.04, dg = 0.025;
        function scheduleLoop() {
          if (BGM._current !== 'kaimaku') return;
          const t0 = ensure().currentTime + 0.005;
          // Riff (square) — tense, syncopated
          const riff = [
            [NT.D4,.5],[0,.25],[NT.F4,.25],[NT.A4,.5],[NT.G4,.5],[NT.F4,.5],[0,.5],
            [NT.E4,.5],[NT.D4,.25],[NT.E4,.25],[NT.F4,1],[0,1],
            [NT.G4,.5],[0,.25],[NT.Bb4,.25],[NT.A4,.5],[NT.G4,.5],[NT.F4,.5],[0,.5],
            [NT.E4,.75],[NT.D4,.25],[NT.E4,1.5],[0,.5],
            [NT.D4,.5],[0,.25],[NT.F4,.25],[NT.A4,.75],[NT.Bb4,.25],[NT.A4,.5],[NT.G4,.5],
            [NT.F4,.5],[NT.E4,.5],[NT.D4,1],[0,1],
            [NT.A4,.5],[NT.G4,.5],[NT.F4,.5],[NT.E4,.5],[NT.D4,.5],[NT.E4,.5],[NT.F4,.5],[0,.5],
            [NT.D4,2],[0,2],
          ];
          let p = 0;
          riff.forEach(([f,d]) => { if (f > 0) bgmNote(f,'square',t0+p*beat,d*beat*0.85,mg); p += d; });
          // Low pad (sawtooth)
          const pads = [[NT.D3,4],[NT.D3,4],[NT.G3,2],[NT.A3,2],[NT.A3,4],
            [NT.D3,4],[NT.D3,4],[NT.Bb3,2],[NT.A3,2],[NT.D3,4]];
          p = 0;
          pads.forEach(([f,d]) => { bgmNote(f,'sawtooth',t0+p*beat,d*beat*0.95,bg*0.5); p += d; });
          // Bass (triangle 8ths)
          const roots = [NT.D3,NT.D3,NT.G3,NT.A3,NT.D3,NT.D3,NT.Bb3,NT.D3];
          roots.forEach((root, bi) => {
            const r = root / 2;
            for (let i = 0; i < 8; i++) {
              if (i % 2 === 0 || i % 3 === 0) {
                const f = (i === 0 || i === 4) ? r : r * (i % 3 === 0 ? 1.5 : 1.25);
                bgmNote(f,'triangle',t0+bi*bar+i*beat*0.5,beat*0.45,bg);
              }
            }
          });
          // Hi-hat 16ths + snare
          for (let b = 0; b < 8; b++) {
            for (let i = 0; i < 16; i++) bgmHH(t0+b*bar+i*(beat/4),dg*(i%4===0?0.8:0.4),false);
            bgmSnare(t0+b*bar+beat,dg*0.6); bgmSnare(t0+b*bar+beat*3,dg*0.6);
          }
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'kaimaku') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // ═══ BGM 2: 団体運営 (BPM 100, F major) ═══
      management() {
        const bpm = 100, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.055, ag = 0.03, bg = 0.04;
        function scheduleLoop() {
          if (BGM._current !== 'management') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (triangle)
          const mel = [
            [NT.F4,2],[NT.A4,1],[NT.G4,1], [NT.F4,1.5],[NT.E4,.5],[NT.D4,1],[0,1],
            [NT.C4,1],[NT.D4,1],[NT.F4,1],[NT.A4,1], [NT.G4,2],[NT.F4,1],[0,1],
            [NT.Bb4,1.5],[NT.A4,.5],[NT.G4,1],[NT.F4,1], [NT.E4,1],[NT.F4,1],[NT.G4,1],[0,1],
            [NT.A4,1],[NT.G4,1],[NT.F4,.5],[NT.E4,.5],[NT.D4,1], [NT.C4,1],[NT.D4,.5],[NT.E4,.5],[NT.F4,2],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'triangle',t0+p*beat,d*beat*0.85,mg); p += d; });
          // Arpeggio (square 16ths)
          const ch = [[NT.F3,NT.A3,NT.C4],[NT.F3,NT.A3,NT.C4],
            [NT.D3,NT.F3,NT.A3],[NT.C3,NT.E3,NT.G3],
            [NT.Bb3,NT.D4,NT.F4],[NT.C4,NT.E4,NT.G4],
            [NT.F3,NT.A3,NT.C4],[NT.F3,NT.A3,NT.C4]];
          ch.forEach((chord, bi) => {
            for (let i = 0; i < 16; i++) bgmNote(chord[i%chord.length],'square',t0+bi*bar+i*(beat/4),beat/4*0.7,ag);
          });
          // Bass (triangle, low octave)
          const bs = [[NT.F3,4],[NT.F3,4],[NT.D3,2],[NT.A3,2],[NT.C3,2],[NT.G3,2],
            [NT.Bb3,4],[NT.C3,4],[NT.F3,2],[NT.E3,2],[NT.F3,4]];
          p = 0;
          bs.forEach(([f,d]) => { bgmNote(f/2,'triangle',t0+p*beat,d*beat*0.9,bg); p += d; });
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'management') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // ═══ BGM 3: 激闘 (BPM 138, A minor) ═══
      battle() {
        const bpm = 138, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.06, hg = 0.03, bg = 0.045, dg = 0.035;
        function scheduleLoop() {
          if (BGM._current !== 'battle') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (sawtooth — brass)
          const mel = [
            [NT.A4,.5],[NT.C5,.5],[NT.D5,.5],[NT.E5,.5],[NT.E5,1],[NT.D5,1],
            [NT.C5,.5],[NT.D5,.5],[NT.C5,.5],[NT.A4,.5],[NT.A4,1.5],[0,.5],
            [NT.A4,.5],[NT.C5,.5],[NT.E5,.5],[NT.G5,.5],[NT.G5,1],[NT.F5,.5],[NT.E5,.5],
            [NT.D5,.5],[NT.C5,.5],[NT.D5,.5],[NT.E5,.5],[NT.A4,2],
            [NT.F5,1],[NT.E5,.5],[NT.D5,.5],[NT.C5,1],[NT.D5,1],
            [NT.E5,1],[NT.D5,.5],[NT.C5,.5],[NT.B4,1.5],[0,.5],
            [NT.C5,.5],[NT.D5,.5],[NT.E5,.5],[NT.F5,.5],[NT.G5,1.5],[NT.F5,.5],
            [NT.E5,.5],[NT.D5,.5],[NT.C5,.5],[NT.B4,.5],[NT.A4,2],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'sawtooth',t0+p*beat,d*beat*0.88,mg); p += d; });
          // Harmony (square)
          const hrm = [
            [NT.A3,2],[NT.C4,2],[NT.D4,2],[NT.E4,2],
            [NT.A3,2],[NT.C4,2],[NT.E4,2],[NT.A3,2],
            [NT.F4,2],[NT.E4,2],[NT.D4,2],[NT.E4,2],
            [NT.C4,2],[NT.D4,2],[NT.E4,2],[NT.A3,2],
          ];
          p = 0;
          hrm.forEach(([f,d]) => { bgmNote(f,'square',t0+p*beat,d*beat*0.85,hg); p += d; });
          // Bass (triangle 8ths)
          const br = [NT.A3,NT.C3,NT.D3,NT.E3,NT.F3,NT.E3,NT.D3,NT.A3];
          br.forEach((root, bi) => {
            const r = root / 2;
            for (let i = 0; i < 8; i++) bgmNote(i%2===0?r:r*1.5,'triangle',t0+bi*bar+i*beat*0.5,beat*0.45,bg);
          });
          // Drums
          for (let b = 0; b < 8; b++) {
            const bt = t0 + b * bar;
            bgmKick(bt,dg); bgmKick(bt+beat*2,dg);
            if (b%2===1) bgmKick(bt+beat*3.5,dg*0.7);
            bgmSnare(bt+beat,dg); bgmSnare(bt+beat*3,dg);
            for (let i = 0; i < 8; i++) bgmHH(bt+i*beat*0.5,dg*(i%2===0?0.5:0.3),i===7);
          }
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'battle') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // ═══ BGM 5: 節目 (BPM 80, Em → G) ═══
      season_end() {
        const bpm = 80, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.055, ag = 0.025, bg = 0.035;
        function scheduleLoop() {
          if (BGM._current !== 'season_end') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (triangle)
          const mel = [
            [NT.E4,2],[NT.G4,1],[NT.A4,1], [NT.B4,2],[NT.A4,1],[NT.G4,1],
            [NT.C5,1.5],[NT.B4,.5],[NT.A4,1],[NT.G4,1], [NT.A4,1],[NT.B4,1],[NT.G4,2],
            [NT.E4,1],[NT.G4,1],[NT.B4,1],[NT.D5,1], [NT.C5,2],[NT.B4,1],[NT.A4,1],
            [NT.G4,1],[NT.A4,1],[NT.B4,1.5],[NT.D5,.5], [NT.G5,3],[0,1],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'triangle',t0+p*beat,d*beat*0.9,mg); p += d; });
          // Arpeggio (square triplets)
          const ch = [[NT.E3,NT.G3,NT.B3],[NT.E3,NT.G3,NT.B3],
            [NT.C3,NT.E3,NT.G3],[NT.D3,NT.F3,NT.A3],
            [NT.E3,NT.G3,NT.B3],[NT.A3,NT.C4,NT.E4],
            [NT.G3,NT.B3,NT.D4],[NT.G3,NT.B3,NT.D4]];
          ch.forEach((chord, bi) => {
            const tb = beat / 3;
            for (let i = 0; i < 12; i++) bgmNote(chord[i%chord.length],'square',t0+bi*bar+i*tb,tb*0.75,ag);
          });
          // Bass (triangle sustained)
          const bs = [[NT.E3,8],[NT.C3,4],[NT.D3,4],[NT.E3,4],[NT.A3,4],[NT.G3,8]];
          p = 0;
          bs.forEach(([f,d]) => { bgmNote(f/2,'triangle',t0+p*beat,d*beat*0.95,bg); p += d; });
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'season_end') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // ═══ BGM 6: 緊張 (BPM 72, Dm — 不穏な対抗戦チャレンジ) ═══
      tension() {
        const bpm = 72, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.045, bg = 0.035, dg = 0.02;
        function scheduleLoop() {
          if (BGM._current !== 'tension') return;
          const t0 = ensure().currentTime + 0.005;
          // Low drone: sustained dissonant bass
          bgmNote(NT.D3/2,'triangle',t0,bar*8*0.95,bg*1.2);
          bgmNote(NT.Eb3/2,'triangle',t0+0.05,bar*8*0.95,bg*0.4); // dissonance
          // Melody (square — sparse, threatening)
          const mel = [
            [0,4],[NT.D4,1],[NT.F4,.5],[NT.E4,.5],[0,2],
            [NT.A4,1.5],[NT.G4,.5],[NT.F4,1],[NT.E4,1],
            [0,2],[NT.D4,.5],[NT.F4,.5],[NT.A4,1],
            [NT.Bb4,2],[NT.A4,1],[0,1],
            [NT.G4,1],[NT.F4,.5],[NT.E4,.5],[NT.D4,2],[0,4],
            [NT.F4,1],[NT.E4,.5],[NT.D4,.5],[0,2],
            [NT.A3,1.5],[NT.D4,.5],[NT.E4,1],[NT.F4,1],
            [0,2],[NT.E4,1],[NT.D4,3],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'square',t0+p*beat,d*beat*0.8,mg*0.7); p += d; });
          // Heartbeat-like kick (sparse)
          for (let b = 0; b < 8; b++) {
            const bt = t0 + b * bar;
            bgmKick(bt, dg * 1.2);
            bgmKick(bt + beat * 0.35, dg * 0.6);
            if (b % 2 === 1) bgmHH(bt + beat * 2, dg * 0.4, false);
          }
          // Stinger accents
          bgmNote(NT.A4,'sawtooth',t0+bar*2,beat*0.3,mg*0.5);
          bgmNote(NT.D5,'sawtooth',t0+bar*5,beat*0.3,mg*0.5);
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'tension') scheduleLoop(); }, bar * 8 * 1000 - 200);
      }
    },

    // ── Jingle implementations ──
    _jingles: {
      victory() {
        const t0 = ensure().currentTime + 0.005;
        const g = 0.06;
        // Build-up: ascending triplet run
        [NT.G4, NT.B4, NT.D5, NT.G5].forEach((f, i) => {
          bgmNote(f, 'square', t0 + i * 0.12, 0.15, g * 0.8);
          bgmSnare(t0 + i * 0.12, 0.02);
        });
        // Main fanfare chord hit
        const t1 = t0 + 0.55;
        bgmNote(NT.G5,'square',t1,0.6,g); bgmNote(NT.D5,'square',t1,0.6,g*0.8);
        bgmNote(NT.B4,'triangle',t1,0.7,g*0.6); bgmNote(NT.G3,'triangle',t1,0.8,g*0.7);
        bgmKick(t1, 0.035);
        // Second phrase: stepping up
        const t2 = t1 + 0.7;
        bgmNote(NT.A5,'square',t2,0.25,g*0.9); bgmNote(NT.B5,'square',t2+0.25,0.25,g*0.9);
        bgmSnare(t2, 0.02); bgmSnare(t2 + 0.25, 0.02);
        // Final sustained chord
        const t3 = t2 + 0.55;
        bgmNote(NT.D6,'square',t3,0.8,g); bgmNote(NT.B5,'square',t3,0.8,g*0.7);
        bgmNote(NT.G5,'triangle',t3,1.0,g*0.6); bgmNote(NT.D5,'triangle',t3,1.0,g*0.5);
        bgmNote(NT.G3,'triangle',t3,1.2,g*0.7);
        bgmKick(t3, 0.04);
        // Sparkle tail
        bgmNote(NT.D6,'square',t3+0.9,0.4,g*0.4); bgmNote(NT.G5,'square',t3+1.0,0.5,g*0.3);
      },
      championship() {
        const t0 = ensure().currentTime + 0.005;
        const g = 0.06;
        [[NT.C4,'sawtooth',0,0.3],[NT.E4,'sawtooth',0.25,0.3],[NT.G4,'sawtooth',0.5,0.3],
         [NT.C5,'sawtooth',0.8,0.6],[NT.E5,'sawtooth',1.4,0.3],[NT.G5,'sawtooth',1.7,0.8],
         [NT.C5,'square',2.5,1.0],[NT.E5,'square',2.5,1.0],[NT.G5,'square',2.5,1.0],
         [NT.C6,'sawtooth',2.5,1.2],[NT.C3,'triangle',0.8,1.5],[NT.C3,'triangle',2.5,1.2],[NT.G3,'triangle',2.5,1.2],
        ].forEach(([f,ty,off,dur]) => {
          const gn = ty==='sawtooth'?g:ty==='triangle'?g*0.8:g*0.6;
          bgmNote(f,ty,t0+off,dur,gn);
        });
        bgmKick(t0+0.8,0.03); bgmSnare(t0+1.4,0.025); bgmKick(t0+2.5,0.035); bgmSnare(t0+2.5,0.025);
      }
    },

    // ── Smart BGM selector based on game state ──
    playForState() {
      // タイトル〜団体設定〜難易度選択は WM-C01 タイトル・オープニング。
      // この区間は G が無い(または gameover 後の残骸)ので weekPhase より先に判定する。
      if (_isTitleFlowVisible()) { BGM.play('kaimaku'); return; }
      if (!G) return;
      const stageBgm = resolveActiveStageBgm(App);
      if (stageBgm === 'preserve') return;
      if (stageBgm === 'battle') { BGM.play('battle'); return; }
      if (stageBgm) { BGM.playStage(stageBgm); return; }
      // オープニング4幕は無音。タイトル曲を引きずらせず、ドラフトのWM-C08で音が戻る
      if (G.weekPhase === 'opening') { BGM.stop(); return; }
      if (G.weekPhase === 'draft') { BGM.play('draftPick'); return; }        // WM-C08 ドラフト選択
      if (G.weekPhase === 'contractNegotiation') { BGM.play('contract'); return; } // WM-C07 契約交渉
      if ((G.offSeason && G.offWeek >= 2) || G.weekPhase === 'offseason') { BGM.play('season_end'); return; }
      if (G.weekPhase === 'showExec') { BGM.play('battle'); return; }
      if (G.weekPhase === 'event') {
        if (G.pendingEvent && G.pendingEvent.type === 'war') {
          BGM.playStage('war');
          return;
        }
        BGM.play('tension'); return;
      }
      // draft-negotiation-spec §8.1: ドラフト速報+交渉は入札曲 WM-C09
      if (G.weekPhase === 'scoutEvent' && (G._draftInterests || G._draftNegotiation)) { BGM.play('draftBid'); return; }
      if (G.weekPhase === 'juniorTournament') {
        BGM.playStage('juniorA');
        return;
      }
      BGM.play('management'); // management + showPrep + draft newspaper all use this
    }
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  FileBGM: HTMLAudioElement ベースのファイルBGM   ║
  // ╚══════════════════════════════════════════════════╝
  const FileBGM = {
    _audio: null,
    _fadeTimer: null,
    _fadeResolve: null,
    _mix: 1,
    _vol: null, // 明示的volume保持（updateVolumeで使用）
    _gestureArmed: false,
    // ブラウザの自動再生ポリシーで play() が蹴られたとき用。
    // タイトル画面はページ読み込み直後に出るのでユーザー操作が一度も無く、
    // 最初のクリック/キー入力を拾って鳴らし直す。
    _armGestureRetry() {
      if (FileBGM._gestureArmed) return;
      FileBGM._gestureArmed = true;
      const retry = () => {
        FileBGM._gestureArmed = false;
        document.removeEventListener('pointerdown', retry);
        document.removeEventListener('keydown', retry);
        const a = FileBGM._audio;
        if (a && a.paused && !_bgmMuted && !_muted) a.play().catch(() => {});
      };
      document.addEventListener('pointerdown', retry, { once: true });
      document.addEventListener('keydown', retry, { once: true });
    },
    _resolveVolume(volume = null, mix = 1) {
      if (volume !== null) return Math.min(1.0, _bgmMasterVol * volume);
      return Math.min(1.0, _bgmMasterVol * _bgmVol * 8 * mix);
    },
    play(src, { loop = false, volume = null, mix = 1 } = {}) {
      if (_bgmMuted) return;
      FileBGM.stop();
      BGM.stop();
      const a = new window.Audio(src);
      a.loop = loop;
      FileBGM._mix = mix;
      FileBGM._vol = volume;
      a.volume = FileBGM._resolveVolume(volume, mix);
      a.play().catch(() => { if (FileBGM._audio === a) FileBGM._armGestureRetry(); });
      FileBGM._audio = a;
    },
    stop() {
      if (FileBGM._fadeTimer) { clearInterval(FileBGM._fadeTimer); FileBGM._fadeTimer = null; }
      // フェード中に止められたときも、待っている側へ必ず知らせる。
      // 以前は setInterval を clear するだけで resolve を呼ばなかったため、
      // フェードの2秒の間に BGM ミュートボタンや別のBGM再生が挟まると
      // fadeOut().then(...) が**永久に来ない**。エンディング/ゲームオーバーは
      // この then で締めを呼んでいるので、画面が固まったまま先へ進めなくなっていた
      // (2026-07-31 監査で検出)。resolve は解決点をここ1つに寄せる。
      if (FileBGM._fadeResolve) {
        const _r = FileBGM._fadeResolve; FileBGM._fadeResolve = null;
        try { _r(); } catch (_e) {}
      }
      if (FileBGM._audio) { FileBGM._audio.pause(); FileBGM._audio.currentTime = 0; FileBGM._audio = null; }
      FileBGM._mix = 1;
      FileBGM._vol = null;
    },
    fadeOut(durationMs = 2000) {
      if (!FileBGM._audio) return Promise.resolve();
      return new Promise(resolve => {
        const a = FileBGM._audio;
        const startVol = a.volume;
        const steps = 20;
        const interval = durationMs / steps;
        let step = 0;
        FileBGM._fadeResolve = resolve;
        FileBGM._fadeTimer = setInterval(() => {
          step++;
          a.volume = Math.max(0, startVol * (1 - step / steps));
          if (step >= steps) {
            clearInterval(FileBGM._fadeTimer);
            FileBGM._fadeTimer = null;
            FileBGM.stop(); // stop() 側が resolve を呼ぶ(解決点を1つに保つ)
          }
        }, interval);
      });
    },
    updateVolume() {
      if (FileBGM._audio) FileBGM._audio.volume = FileBGM._resolveVolume(FileBGM._vol, FileBGM._mix);
    }
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  PUBLIC API                                      ║
  // ╚══════════════════════════════════════════════════╝
  return {
    play(name) {
      if (_muted) return;
      // 本番音源が割り当てられているキーはそちらを優先。読めなければ合成音へ落ちる
      if (SE_FILES[name] && _playFileSe(name, SE_MIX[name])) return;
      if (!SFX[name]) return;
      try {
        ensure();
        if (SE_MIX[name] !== undefined) sfxGain.gain.value = SE_MIX[name];
        SFX[name]();
      } catch (e) {}
    },
    bgm: BGM,
    fileBgm: FileBGM,
    get muted() { return _muted; },
    toggleMute() {
      ensure();
      _muted = !_muted;
      masterGain.gain.value = _muted ? 0 : 1;
      if (_muted) BGM.stop(); else BGM.playForState();
      savePrefs();
    },
    setSfxVol(v) { _sfxVol = v; if (sfxGain) sfxGain.gain.value = v; savePrefs(); },
    setBgmVol(v) { _bgmVol = v; if (bgmGain) bgmGain.gain.value = v; FileBGM.updateVolume(); savePrefs(); },
    get sfxVol() { return _sfxVol; },
    get bgmVol() { return _bgmVol; },
    // BGM/SE マスター音量
    setBgmMasterVol(v) { _bgmMasterVol = v; if (bgmMasterGain) bgmMasterGain.gain.value = v; FileBGM.updateVolume(); savePrefs(); },
    setSfxMasterVol(v) { _sfxMasterVol = v; if (sfxMasterGain) sfxMasterGain.gain.value = v; savePrefs(); },
    get bgmMasterVol() { return _bgmMasterVol; },
    get sfxMasterVol() { return _sfxMasterVol; },
    // BGM-only mute (looping tracks off, jingles/SFX still play)
    get bgmMuted() { return _bgmMuted; },
    toggleBgmMute() {
      _bgmMuted = !_bgmMuted;
      if (_bgmMuted) { BGM.stop(); FileBGM.stop(); } else BGM.playForState();
      savePrefs();
    },
    // ── 派閥イベント演出用: ワンショット stinger（BGM に触れない） ──
    // SE マスターボリューム適用、全体 mute 時は無音
    stinger(src, volume = 0.15) {
      try {
        if (_muted) return;
        const a = new window.Audio(src);
        a.volume = Math.min(1.0, volume * _sfxMasterVol);
        a.play().catch(() => {});
      } catch(e) {}
    },
  };
})();

// ╔══════════════════════════════════════════════════════════╗
// ║  FACTION EVENT AUDIO MAP (v6 §2-1)                       ║
// ║  handoff-v6 の BGM/stinger 登録表をデータ化              ║
// ╚══════════════════════════════════════════════════════════╝
const FACTION_AUDIO = {
  SOFT:    '../bgm/production-ogg/wm_bgm_c07_v02.ogg',
  TENSION: '../bgm/production-ogg/wm_bgm_s03_v01.ogg',
  GONG:    '../bgm/f07_gong_v1.mp3',
  CHIME:   '../bgm/f06_fin_chime_v1.mp3',
};
// 各イベントの { src, volume, openStinger?, closeStinger? }
// closeStinger は結果モーダルの「閉じる」クリック時に fadeOut 直前で再生
const FACTION_AUDIO_MAP = {
  // F01(派閥結成の報告)はBGMを切り替えない(2026-08-02 Keisuke)。中立の「気になる動きの報告」に
  // 祝祭系c07の立ち上がりが「いいことが起きた音」として誤誘導していた。通常BGMのまま開く。
  F02:            { src: FACTION_AUDIO.TENSION, volume: 0.17 },
  F02_IGNITE:     { src: FACTION_AUDIO.TENSION, volume: 0.18, openStinger:  { src: FACTION_AUDIO.GONG,  volume: 0.15 } },
  F02_PEACE:      { src: FACTION_AUDIO.SOFT,    volume: 0.12,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.10 } },
  F02_RESOLUTION: { src: FACTION_AUDIO.TENSION, volume: 0.17 },
  F02_ENDLESS:    { src: FACTION_AUDIO.TENSION, volume: 0.10 },
  F03:            { src: FACTION_AUDIO.SOFT,    volume: 0.10,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  F04:            { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  F05H:           { src: FACTION_AUDIO.SOFT,    volume: 0.10,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  // §2-3 v7 確定（faction-events.md §音響設計 表拡張に準拠）
  F05:            { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  F06:            { src: FACTION_AUDIO.SOFT,    volume: 0.16,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.10 } },
  F07:            { src: FACTION_AUDIO.TENSION, volume: 0.15 },
  F08:            { src: FACTION_AUDIO.TENSION, volume: 0.17, openStinger:  { src: FACTION_AUDIO.GONG,  volume: 0.15 } },
  COMMON_1:       { src: FACTION_AUDIO.TENSION, volume: 0.14 },
  COMMON_4:       { src: FACTION_AUDIO.SOFT,    volume: 0.12,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  COMMON_5:       { src: FACTION_AUDIO.SOFT,    volume: 0.13 },
  COMMON_7:       { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  CHALLENGE_REQUEST: { src: FACTION_AUDIO.TENSION, volume: 0.16, openStinger: { src: FACTION_AUDIO.GONG, volume: 0.14 } },
  B3_CHALLENGE:   { src: FACTION_AUDIO.TENSION, volume: 0.16, openStinger: { src: FACTION_AUDIO.GONG, volume: 0.14 } },
};

// 派閥イベントモーダル開幕時: BGM 切替 + openStinger
// 既存 BGM (management/tension chiptune 等) は FileBGM.play が内部で止める
function _factionAudioOpen(eventId) {
  const cfg = FACTION_AUDIO_MAP[eventId];
  if (!cfg) return;
  try { Audio.fileBgm.play(cfg.src, { loop: true, volume: cfg.volume }); } catch(e) {}
  if (cfg.openStinger) {
    // BGM が立ち上がる気配を見せてから1発鳴らす（fadeOut と重ならないように 150ms 遅延）
    setTimeout(() => { try { Audio.stinger(cfg.openStinger.src, cfg.openStinger.volume); } catch(e) {} }, 150);
  }
}

// 派閥イベント結果モーダル「閉じる」クリック時:
// closeStinger → BGM fadeOut → playForState で通常 BGM を復帰
function _factionAudioClose(eventId) {
  const cfg = FACTION_AUDIO_MAP[eventId];
  // BGMを切り替えなかったイベント(F01等、MAP未登録)は復帰処理も不要。
  // fadeOut+playForStateを走らせると流れ続けている通常BGMが無意味に再始動する
  if (!cfg) return;
  if (cfg && cfg.closeStinger) {
    try { Audio.stinger(cfg.closeStinger.src, cfg.closeStinger.volume); } catch(e) {}
  }
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  setTimeout(() => { try { Audio.bgm.playForState(); } catch(e) {} }, 1600);
}


// ── D層セレモニーイベント BGM制御 ──
// 同じ v01 ファイル名のままミックスを更新したため、旧音源のブラウザキャッシュを避ける。
// Audio's SUNO_BGM map is private to the Audio module, so this independent
// ceremony setting must remain self-contained at top level.
const CEREMONY_ARRIVAL_BGM = {
  file: '../bgm/production-ogg/wm_bgm_c01_v01.ogg',
  vol: 0.30,
};
const YEAR_END_AWARDS_BGM = '../bgm/production-ogg/wm_bgm_h05_v01.ogg?mix=20260727';
function _ceremAudioOpen(visualVariant) {
  // triumph(到達・栄誉)は表彰式枠 WM-H05 を共用する。arrival は開幕曲を継続。
  const isArrival = visualVariant === 'arrival';
  const src = isArrival ? CEREMONY_ARRIVAL_BGM.file : YEAR_END_AWARDS_BGM;
  // triumph uses the awards mix; arrival uses the current title-opening mix.
  const volume = isArrival ? CEREMONY_ARRIVAL_BGM.vol : 0.40;
  try { Audio.fileBgm.play(src, { loop: true, volume }); } catch(e) {}
}
function _ceremAudioClose() {
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  setTimeout(() => { try { Audio.bgm.playForState(); } catch(e) {} }, 1600);
}

// D層セレモニーイベント本体
// evt: MILESTONE_EVENTSエントリ（dialogueKey/narration/narrationGaps/visualVariant/continueLabel）
// speakers: [{fighter, roleLabel}, ...] (_resolveSpotlightFighters の戻り値)
// onContinue: 続けるボタンクリック時のコールバック
function showCeremonyEvent(evt, speakers, onContinue) {
  // タイトルサブ動的生成
  let titleSub = evt.titleSub;
  if (evt.visualVariant === 'arrival') {
    titleSub = evt.titleSub + ' ・ WEEK ' + G.week;
  } else if (evt.visualVariant === 'triumph') {
    const att = (G.lastShowAttendance || 0).toLocaleString();
    titleSub = evt.titleSub + ' ・ ' + att + ' ATTENDED';
  }

  const overlay = document.createElement('div');
  overlay.className = 'cerem-overlay ' + (evt.visualVariant || '');
  // U4(2026-07-26): 画面を覆う枠の重なり順を5階層(100/200/300/400/500)に統一。
  // ドーム到達などの節目セレモニーは式典 → 400(旧920から統一)
  overlay.style.zIndex = '400';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';

  const narrationGaps = evt.narrationGaps || [];

  // Phase 1 HTML
  const narLines = (evt.narration || []).map((line, i) => {
    const gapClass = narrationGaps.includes(i) ? ' gap' : '';
    return `<span class="cerem-nar-line${gapClass}" data-nar-idx="${i}">${line}</span>`;
  }).join('');

  // Phase 2: speakers
  // U3グループA統一(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行(mockup-baseline-v0.1)。
  // 縦順を 吹き出し→画像→名前→役割ラベル の固定順に修正(旧実装は役割ラベルが名前より先だった)。
  // 節目セレモニーの主役なので size:'xl'(172×258、指示書の明示指定)。
  // Ceremony専用のトークン層は未整備(階層4未着手)。この画面の色(#e8e6e0系オフホワイト・ゴールド)は
  // 既存 Stage トークン(--stage-text-*)と数値が一致しているため、そのまま流用する(u3b-theme-stage)。
  // imgUrlではなくimgHtmlで組み立てるのは、画像URLが空でも<img>タグ自体は出す既存の仕様
  // (onerrorで非表示にするだけ)を維持するため
  const speakerHtml = speakers.map(({ fighter, roleLabel }) => {
    const line = typeof evt.lineForFighter === 'function'
      ? evt.lineForFighter(fighter)
      : App.resolveDomeLine(fighter, evt.dialogueKey);
    const portraitSrc = getUpperUrl(fighter.id);
    const isTriumph = evt.visualVariant === 'triumph' ? ' triumph-glow' : '';
    const imgHtml = `<img src="${escHtml(portraitSrc || '')}" alt="${escHtml(fighter.name)}"
            style="width:100%;height:100%;object-fit:cover;object-position:top"
            onerror="this.style.display='none'">`;
    return `<div class="cerem-speaker">${_u3bSideHtml({
      name: fighter.name, line, imgHtml, role: roleLabel, size: 'xl',
      slotClass: 'cerem-bubble-wrap', bubbleClass: 'cerem-bubble',
      portraitClass: 'cerem-portrait' + isTriumph,
    })}</div>`;
  }).join('');
  const speakerCountClass = speakers.length === 1 ? ' is-solo' : speakers.length === 2 ? ' is-duo' : '';

  overlay.innerHTML = `
    <!-- Phase 1: Narration -->
    <div class="cerem-phase active" data-phase="1">
      <div class="cerem-phase-zone top">
        <div class="cerem-title-band">
          <div class="cerem-title-main ${evt.visualVariant || ''}">${evt.titleMain}</div>
          <div class="cerem-title-divider"></div>
          <div class="cerem-title-sub">${titleSub}</div>
        </div>
      </div>
      <div class="cerem-phase-zone mid">
        <div class="cerem-narration">${narLines}</div>
      </div>
      <div class="cerem-phase-zone bottom"></div>
    </div>
    <!-- Phase 2: Characters -->
    <div class="cerem-phase" data-phase="2">
      <div class="cerem-phase-zone top"></div>
      <div class="cerem-phase-zone mid">
        <div class="cerem-trio${speakerCountClass}">${speakerHtml}</div>
      </div>
      <div class="cerem-phase-zone bottom">
        <button class="cerem-continue-btn">${evt.continueLabel || '続ける'}</button>
      </div>
    </div>
    <div class="cerem-hint">▼ クリックで進む</div>
    <button class="cerem-skip" data-cerem-skip>▷ SKIP</button>
  `;

  document.body.appendChild(overlay);
  _ceremAudioOpen(evt.visualVariant);

  // SceneController ロジック
  const phase1El = overlay.querySelector('[data-phase="1"]');
  const phase2El = overlay.querySelector('[data-phase="2"]');
  const narEls = Array.from(overlay.querySelectorAll('.cerem-nar-line'));
  const speakerEls = Array.from(overlay.querySelectorAll('.cerem-speaker'));
  const continueBtn = overlay.querySelector('.cerem-continue-btn');
  const hint = overlay.querySelector('.cerem-hint');
  let phase = 1;
  let step = 0;
  let transitioning = false;

  function closeCeremony() {
    overlay.remove();
    _ceremAudioClose();
    // .cerem-overlay も war-victory-overlay/db-hof-detail-overlay と同じ形の動的オーバーレイ:
    // _isPopupActive()の判定対象だがMutationObserverの監視対象IDには入っていない(生成がid無し・
    // DOMContentLoaded後)。表示中に_enqueuePopupされた分がここで詰まりうるため、他と揃えて流す
    // (2026-07-31監査で検出。詰まる経路は未確認だが同型のため保険として追加)。
    _drainPopupQueue();
    onContinue();
  }

  function skipAll() {
    if (transitioning) return;
    narEls.forEach(el => el.classList.add('shown'));
    phase1El.classList.remove('active');
    setTimeout(() => {
      phase = 2; step = speakerEls.length;
      phase2El.classList.add('active');
      speakerEls.forEach(el => el.classList.add('shown'));
      hint.classList.add('hidden');
      setTimeout(() => continueBtn.classList.add('shown'), 400);
    }, 500);
  }

  function toPhase2() {
    transitioning = true;
    hint.classList.add('hidden');
    phase1El.classList.remove('active');
    setTimeout(() => {
      phase = 2; step = 0;
      phase2El.classList.add('active');
      setTimeout(() => {
        hint.classList.remove('hidden');
        transitioning = false;
      }, 1000);
    }, 1100);
  }

  function advance() {
    if (transitioning) return;
    if (phase === 1) {
      if (step < narEls.length) {
        narEls[step].classList.add('shown');
        step++;
      } else {
        toPhase2();
      }
    } else {
      if (step < speakerEls.length) {
        speakerEls[step].classList.add('shown');
        step++;
        if (step >= speakerEls.length) {
          hint.classList.add('hidden');
          setTimeout(() => continueBtn.classList.add('shown'), 800);
        }
      }
    }
  }

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('.cerem-continue-btn')) { closeCeremony(); return; }
    if (e.target.closest('[data-cerem-skip]')) { skipAll(); return; }
    advance();
  });
}

function hasPlayerHistoricRank1(state) {
  if (!state) return false;
  if ((state.rankings || [])[0]?.orgId === 'player') return true;
  if (state.endingCleared) return true;
  if ((state.endingClearedSeason || 0) > 0) return true;
  return (state.seasonHistory || []).some(season => (season?.rank || 99) === 1);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 6c: SURVIVAL GAUGE (v0.97)                        ║
// ║  Startup deficit tracker — pure functions, no DOM          ║
// ╚══════════════════════════════════════════════════════════╝

const SURVIVAL_MILESTONES = [
  { id:'first_show_rev',  icon:'興', label:'初興行収入', desc:'興行でチケット・グッズ収入を得た',
    check: G => (G.seasonStats?.totalRevenue || 0) > 0 || G.seasonHistory?.some(s => s.totalRevenue > 0) },
  { id:'sponsor_unlock',  icon:'金', label:'スポンサー獲得', desc:'人気20到達でスポンサー収入が発生',
    check: G => G.orgPop >= 20 },
  { id:'first_profit_wk', icon:'▲', label:'初の月次黒字', desc:'直近4週の合計収支がプラスになった',
    check: G => {
      const buf = G.recentWeeklyNet || [0,0,0,0];
      return buf.reduce((a,b) => a+b, 0) >= 0 && (G.weeklyFinance != null);
    }},
  { id:'profit_streak3',  icon:'◆', label:'2ヶ月連続月次黒字', desc:'安定経営が見えてきた',
    check: G => (G.rollingNet4Count || 0) >= 2 },
  { id:'graduation',      icon:'杯', label:'経営安定化', desc:'月次黒字定着＋資金確保！サバイバルクリア',
    check: G => G.survivalCleared === true },
];

const SURVIVAL_PHASES = [
  { id:'red',    label:'赤字地獄',   color:'#e74c3c', emoji:'●', cssClass:'phase-red' },
  { id:'orange', label:'赤字縮小',   color:'#e67e22', emoji:'●', cssClass:'phase-orange' },
  { id:'yellow', label:'損益分岐点', color:'#f1c40f', emoji:'●', cssClass:'phase-yellow' },
  { id:'green',  label:'黒字転換',   color:'#2ecc71', emoji:'●', cssClass:'phase-green' },
];

const Survival = {
  // Calculate estimated weekly net income (expenses - income, without show revenue)
  estimateWeeklyNet(G) {
    const salary = Engine.economy.calcWeeklySalary(G.roster, G.titles);
    const fixed = Engine.economy.calcFixedCosts();
    const coachSalary = Engine.coach.getSalaryTotal(G);
    const totalExpense = salary + fixed + coachSalary;

    const weeklyGoods = Engine.economy.calcWeeklyGoodsRev(G.roster);
    const weeklyMedia = Engine.economy.calcWeeklyMediaRev(G.orgPop);
    const subsidy = G.difficultyMode === 'hard' ? 0 : Engine.economy.getSubsidy(G.orgPop);
    const totalBaseIncome = weeklyGoods + weeklyMedia + subsidy;

    // Estimate average show income per week (shows happen ~every 4 weeks)
    // Use last show's revenue if available, or estimate from orgPop
    let avgShowIncomePerWeek = 0;
    if (G.lastShowResults && G.lastShowResults.length > 0 && G.weeklyFinance) {
      const showIncome = G.weeklyFinance.details
        .filter(d => d.type === 'income' && (d.label.includes('チケット') || d.label.includes('グッズ')))
        .reduce((s, d) => s + d.val, 0);
      const showCost = G.weeklyFinance.details
        .filter(d => d.type === 'expense' && d.label.includes('会場'))
        .reduce((s, d) => s + Math.abs(d.val), 0);
      avgShowIncomePerWeek = Math.round((showIncome - showCost) / 4); // amortized over 4 weeks
    }

    const weeklyNet = (totalBaseIncome + avgShowIncomePerWeek) - totalExpense;
    return { weeklyNet, totalExpense, totalBaseIncome, avgShowIncomePerWeek };
  },

  // Determine current survival phase
  getPhase(G) {
    if (G.survivalCleared) return null; // graduated
    const { weeklyNet } = Survival.estimateWeeklyNet(G);
    if (weeklyNet >= 20) return SURVIVAL_PHASES[3]; // green: solid profit
    if (weeklyNet >= -5) return SURVIVAL_PHASES[2]; // yellow: breakeven
    if (weeklyNet >= -50) return SURVIVAL_PHASES[1]; // orange: improving
    return SURVIVAL_PHASES[0]; // red: deep deficit
  },

  // Estimate weeks until funds reach -1500 (即死ライン / collapse)
  // 危機突入は funds<0、即死は funds<=-1500（bankruptcy-redesign v1.1）
  weeksUntilBankrupt(G) {
    const { weeklyNet } = Survival.estimateWeeklyNet(G);
    if (weeklyNet >= 0) return Infinity;
    const runway = G.funds + 1500; // 0 at collapse line
    return Math.max(0, Math.ceil(runway / Math.abs(weeklyNet)));
  },

  // Calculate fuel gauge percentage (5000 start to -1500 collapse = 6500 range)
  fuelPct(G) {
    const runway = G.funds + 1500; // 0 at collapse, 6500 at full
    return Math.max(0, Math.min(100, Math.round((runway / 6500) * 100)));
  },

  // Evaluate milestones
  getMilestones(G) {
    const cleared = new Set(G.survivalMilestones || []);
    return SURVIVAL_MILESTONES.map(m => ({
      ...m,
      done: cleared.has(m.id) || m.check(G),
    }));
  },

  // Update survival state — called each week. Returns updated state + events.
  updateSurvival(G) {
    if (G.survivalCleared) return { state: G, events: [], graduated: false };

    let s = { ...G };
    const events = [];

    // Update milestones
    const oldMilestones = new Set(s.survivalMilestones || []);
    const newMilestones = [...oldMilestones];
    SURVIVAL_MILESTONES.forEach(m => {
      if (!oldMilestones.has(m.id) && m.check(s)) {
        newMilestones.push(m.id);
      }
    });
    s = { ...s, survivalMilestones: newMilestones };

    // Track rolling 4-week net (ring buffer)
    const wf = s.weeklyFinance;
    if (wf && wf.net !== undefined) {
      const buf = [...(s.recentWeeklyNet || [0,0,0,0])];
      buf.push(wf.net);
      if (buf.length > 4) buf.shift();
      s = { ...s, recentWeeklyNet: buf };

      // Every 4 weeks, check if rolling sum >= 0 → count as "月次黒字"
      if (s.week >= 4 && s.week % 4 === 0) {
        const rollingSum = buf.reduce((a,b) => a+b, 0);
        if (rollingSum >= 0) {
          s = { ...s, rollingNet4Count: (s.rollingNet4Count || 0) + 1 };
        }
      }
    }

    // Check graduation: monthly profit achieved 2+ times AND funds >= 3000
    const graduated = (s.rollingNet4Count || 0) >= 2 && s.funds >= 3000;
    if (graduated && !s.survivalCleared) {
      s = { ...s, survivalCleared: true, survivalClearWeek: s.week, survivalClearSeason: s.season };
      events.push('🎊 経営安定化達成！ サバイバルチャレンジクリア！');
    }

    return { state: s, events, graduated };
  }
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 7: STORAGE (v0.85)                               ║
// ║  Save/Load with v0.8 backward compatibility               ║
// ╚══════════════════════════════════════════════════════════╝

const SAVE_KEY = 'wrestle_manager_save_';
const SAVE_SLOTS = 3;
const AUTOSAVE_KEY = 'wrestle_manager_autosave';
const SAVE_COMPRESS_MARKER = 'WM_LZ|';
const SAVE_NAME_MAX_LEN = 32; // セーブ名の上限文字数（全角考慮、コードポイント基準）

// ─── セーブデータ トリミング定数 ───
const SAVE_TRIM = {
  gameLogMax: 200,       // gameLog上限
  growthLogMax: 100,     // キャラ毎growthLog上限
  financeKeepSeasons: 2, // financeHistory保持シーズン数
  matchupLogMax: 60,     // matchupLog上限（12show窓 + 余裕）
  aiMatchupLogMax: 40,   // AI団体matchupLog上限
  h2hHistoryMax: 50,     // h2h.history[] ペア毎上限
};

const Storage = {
  // ─── セーブ名サニタイズ: ラベル表示用（トリム＋文字数上限のみ、記号は許容） ───
  _sanitizeSaveNameLabel(name) {
    if (name === undefined || name === null) return '';
    // 制御文字を除去してトリム
    let s = String(name).replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (!s) return '';
    // 全角絵文字等のサロゲートペアを考慮し、コードポイント単位で上限を適用
    const chars = Array.from(s);
    if (chars.length > SAVE_NAME_MAX_LEN) s = chars.slice(0, SAVE_NAME_MAX_LEN).join('');
    return s.trim();
  },

  // ─── セーブ名サニタイズ: ファイル名用（OS禁止文字を除去/置換） ───
  _sanitizeFilenamePart(name) {
    const label = Storage._sanitizeSaveNameLabel(name);
    if (!label) return '';
    // Windows/Mac/Linux で使用できない文字を "_" に置換
    const safe = label.replace(/[\/\\:*?"<>|]/g, '_').trim();
    return safe;
  },

  // ─── セーブデータ圧縮: トリミング + LZ-UTF16 ───
  // saveNameOverride を渡すとセーブ名として state._saveName に反映する。
  // 渡さない場合（undefined/空文字）は既存の G._saveName に汚染があっても必ず消去する
  // （別スロットからロードした名前が無関係なスロットに紛れ込むのを防ぐため）。
  serialize(G, saveNameOverride) {
    const state = JSON.parse(JSON.stringify(G));
    // Challenge opponents are injected into the live roster only while their
    // battle UI is open.  Never persist them, even if an autosave is triggered
    // by an unrelated recovery path before the normal result cleanup runs.
    state.roster = (state.roster || []).filter(c =>
      c?.isRental || (!c?.isAwayChallengeGuest && !c?.isCRGuest && !c?.isB3ChallengeGuest && !c?.isUnifiedTitleGuest)
    );
    state.roster.forEach(c => {
      delete c._weekAction; c.intensive = false;
      // growthLog トリミング
      if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
        c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
      }
    });
    // P4-P6: transient Glimpse フィールド除外
    delete state._pendingGlimpseA;
    delete state._pendingGlimpseB;
    delete state._pendingHotStreakEnds;
    delete state._pendingMilestone;
    // gameLog トリミング
    if (state.gameLog && state.gameLog.length > SAVE_TRIM.gameLogMax) {
      state.gameLog = state.gameLog.slice(-SAVE_TRIM.gameLogMax);
    }
    // debugLog は保存不要
    state.debugLog = [];
    // financeHistory: 直近N シーズンのみ
    if (state.financeHistory && state.financeHistory.length > 0) {
      const minSeason = state.season - SAVE_TRIM.financeKeepSeasons + 1;
      state.financeHistory = state.financeHistory.filter(h => h.season >= minSeason);
    }
    // matchupLog トリミング（鮮度計算は直近12showのみ使用、hasEverFoughtはペアSetで代替）
    if (state.matchupLog && state.matchupLog.length > SAVE_TRIM.matchupLogMax) {
      // hasEverFought用のペアセットを構築（全履歴から）
      const everFoughtSet = new Set();
      state.matchupLog.forEach(e => {
        const a = Math.min(e.leftId, e.rightId), b = Math.max(e.leftId, e.rightId);
        everFoughtSet.add(`${a}>${b}`);
      });
      state._everFoughtPairs = [...everFoughtSet];
      state.matchupLog = state.matchupLog.slice(-SAVE_TRIM.matchupLogMax);
    }
    // AI団体 matchupLog トリミング
    if (state.aiOrgs) {
      for (const orgId in state.aiOrgs) {
        const org = state.aiOrgs[orgId];
        if (org.matchupLog && org.matchupLog.length > SAVE_TRIM.aiMatchupLogMax) {
          org.matchupLog = org.matchupLog.slice(-SAVE_TRIM.aiMatchupLogMax);
        }
        // AI選手のgrowthLog トリミング
        if (org.roster) {
          org.roster.forEach(c => {
            if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
              c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
            }
          });
        }
      }
    }
    // h2h.history トリミング (ペア毎最新N件)
    if (state.h2h) {
      for (const key in state.h2h) {
        const entry = state.h2h[key];
        if (entry && entry.history && entry.history.length > SAVE_TRIM.h2hHistoryMax) {
          entry.history = entry.history.slice(-SAVE_TRIM.h2hHistoryMax);
        }
      }
    }
    // freeAgentsのgrowthLog トリミング
    if (state.freeAgents) {
      state.freeAgents.forEach(c => {
        if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
          c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
        }
      });
    }
    state._saveVersion = '1.34';
    state._saveDate = new Date().toISOString();
    const sanitizedName = Storage._sanitizeSaveNameLabel(saveNameOverride);
    if (sanitizedName) state._saveName = sanitizedName; else delete state._saveName;
    // LZ圧縮 + マーカー
    const json = JSON.stringify(state);
    return SAVE_COMPRESS_MARKER + LZString.compressToUTF16(json);
  },

  // ─── 圧縮/非圧縮セーブの自動判定ヘルパー ───
  _parseRaw(raw) {
    // 新マーカー(WM_LZ|) or 旧マーカー(WM_LZ\x00) 両対応
    if (raw.startsWith(SAVE_COMPRESS_MARKER) || raw.startsWith('WM_LZ\x00')) {
      const markerLen = raw.startsWith(SAVE_COMPRESS_MARKER) ? SAVE_COMPRESS_MARKER.length : 6;
      const json = LZString.decompressFromUTF16(raw.slice(markerLen));
      if (!json) throw new Error('LZ decompression returned null');
      return JSON.parse(json);
    }
    return JSON.parse(raw);
  },

  deserialize(json) {
    const prevG = G;
    try {
      const state = Storage._parseRaw(json);
      // Replace G entirely with saved state, preserving any missing defaults
      const base = Engine.createInitialState(state.rngSeed || (Date.now() ^ 0xDEADBEEF));
      G = { ...base, ...state };

      // 旧セーブに残った単独頂上決戦は、現行のPPV内頂上決戦へ統合済み。
      // 旧イベント画面に閉じ込められないよう予約だけ安全に解除する。
      G = migrateLegacySummitPendingEvent(G);

      // 挑戦試合旧予約を開催地別の新フィールドへ移行する。
      if (G._pendingChallengeMatch) {
        const legacyChallenge = G._pendingChallengeMatch;
        const { _pendingChallengeMatch: _legacyChallenge, ...restChallenge } = G;
        G = legacyChallenge.isInverse
          ? { ...restChallenge, _pendingIncomingChallengeMatch: legacyChallenge }
          : { ...restChallenge, _pendingAwayChallengeMatch: legacyChallenge };
      }

      // A saved pre-direct-execution reservation must never keep its members
      // unavailable forever.  This also repairs affected saves immediately on
      // reload, rather than requiring the player to advance another week.
      if (Engine.challengeRequest?.releaseExpiredAwayBooking) {
        G = Engine.challengeRequest.releaseExpiredAwayBooking(G);
      }

      // v0.6 backward compat: coaches
      if (!G.coaches) G = { ...G, coaches: [] };
      if (!G.availableCoaches) G = { ...G, availableCoaches: ALL_COACHES.map(c => c.id).filter(id => !G.coaches.includes(id)) };
      if (!G.seasonGrowth) G = { ...G, seasonGrowth: {} };

      // v3.0: 旧セーブの全ID列挙 availableCoaches → シーズンプールに変換
      if (G.availableCoaches && G.availableCoaches.length > COACH_POOL_CFG.candidatesMax + 5) {
        const poolRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season || 1, 0xC0AC));
        G = { ...G, availableCoaches: Engine.coach.generateSeasonalPool(poolRng, G) };
      }

      // v0.8 backward compat: coach assignments
      if (!G.coachAssign) {
        const ca = {};
        G.coaches.forEach(id => { ca[id] = []; });
        G = { ...G, coachAssign: ca };
      }
      G = { ...G, coachAssign: Engine.coach.sanitizeAssignments(G) };

      // v0.85 backward compat
      if (!G.rngSeed) G = { ...G, rngSeed: Date.now() ^ 0xDEADBEEF };

      // v0.9 backward compat: rival system
      if (!G.aiOrgs) {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0, 909));
        const aiResult = Engine.rival.initAIOrgs(rng);
        G = { ...G, aiOrgs: aiResult.aiOrgs, rivalOrgNames: aiResult.rivalOrgNames };
      }
      // データ整合性: AI団体選手がfreeAgentsに混入している場合は正しい団体ロスターへ移動
      if (G.aiOrgs && G.freeAgents) {
        const aiOrgIds = new Set(RIVAL_ORGS.map(o => o.id));
        const misplaced = G.freeAgents.filter(f => f.orgId && aiOrgIds.has(f.orgId));
        if (misplaced.length > 0) {
          let newFreeAgents = G.freeAgents.filter(f => !f.orgId || !aiOrgIds.has(f.orgId));
          const newAiOrgs = {};
          Object.keys(G.aiOrgs).forEach(orgId => { newAiOrgs[orgId] = { ...G.aiOrgs[orgId], roster: [...G.aiOrgs[orgId].roster] }; });
          misplaced.forEach(f => {
            const org = newAiOrgs[f.orgId];
            if (org && !org.roster.find(r => r.id === f.id)) org.roster.push(f);
          });
          G = { ...G, freeAgents: newFreeAgents, aiOrgs: newAiOrgs };
        }
      }
      if (G.aiOrgs) {
        G = { ...G, aiOrgs: Engine.rival.sanitizeAIOrgs(G.aiOrgs) };
      }
      // データ整合性: プレイヤーロスター選手がfreeAgentsに重複している場合は除去
      if (G.roster && G.freeAgents) {
        const rosterIds = new Set(G.roster.map(c => c.id));
        const dupFA = G.freeAgents.filter(f => rosterIds.has(f.id));
        if (dupFA.length > 0) {
          G = { ...G, freeAgents: G.freeAgents.filter(f => !rosterIds.has(f.id)) };
        }
      }
      // Restore org names from saved state
      Engine.rival.applyOrgNames(G.rivalOrgNames);
      if (!G.rankings) G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      // v1.2: Remove deprecated aceDesignation
      if (G.aceDesignation !== undefined) { const { aceDesignation: _ace, ...rest } = G; G = rest; }
      if (!G.transferLog) G = { ...G, transferLog: [] };
      if (G.transfersThisSeason === undefined) G = { ...G, transfersThisSeason: 0 };
      // v1.0e: poolIds → dormantPool migration
      if (G.poolIds && !G.dormantPool) G = { ...G, dormantPool: G.poolIds };
      if (!G.dormantPool) G = { ...G, dormantPool: Engine.rival.getDormantIds() };
      // FIFO: dormantPool エントリを {id, age} 形式に統一（レガシー文字列ID対応）
      if (G.dormantPool && G.dormantPool.some(e => {
        if (typeof e === 'string' || typeof e === 'number') return true;
        if (!e || e.id === undefined || e.id === null) return false;
        return !Number.isFinite(e.id) || !Number.isFinite(e.age);
      })) {
        G = {
          ...G,
          dormantPool: G.dormantPool.map(e => {
            if (typeof e === 'string' || typeof e === 'number') {
              const id = Number(e);
              return Number.isFinite(id) ? { id, age: 17 } : null;
            }
            if (!e || e.id === undefined || e.id === null) return e;
            const id = Number(e.id);
            if (!Number.isFinite(id)) return null;
            const age = Number.isFinite(Number(e.age)) ? Math.max(16, Math.min(21, Math.round(Number(e.age)))) : 17;
            return { ...e, id, age };
          }).filter(Boolean)
        };
      }
      if (!G.orgName) G = { ...G, orgName: 'プレイヤー団体' };

      // v0.9b backward compat: offseason system
      if (G.offSeason === undefined) G = { ...G, offSeason: false, offWeek: 0 };
      // bankruptcy-redesign v1.1: 危機フェーズ
      if (G.crisisActive === undefined) {
        G = { ...G, crisisActive: false, crisisEnteredWeek: null, crisisWeeksRemaining: 0, crisisHistoryCount: 0 };
      }
      if (G.gameOverReason === undefined) G = { ...G, gameOverReason: null };
      // v0.9c backward compat: transfer
      if (G.pendingPoach === undefined) G = { ...G, pendingPoach: [] };
      // v0.9d backward compat: rental & events
      if (G.rentals === undefined && G.rental === undefined) G = { ...G, rentals: [], warThisSeason: false, challengeTrigger: null, pendingEvent: null };
      if (G.seasonStats === undefined) G = { ...G, seasonStats: { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 }, seasonHistory: [], fundsHistory: [G.funds] };
      // 古いセーブで seasonStats のフィールドが欠落している場合に備えて補完（NaN/undefined→0 防止）
      {
        const _ssDefaults = { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds||0, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 };
        const _fixedSS = { ..._ssDefaults, ...(G.seasonStats || {}) };
        // 数値フィールドが NaN になっているケースを 0 に正規化
        ['wins','losses','draws','showCount','totalRevenue','totalExpense','bestMQ','peakFunds','peakPop','eventsWon','eventsLost'].forEach(k => {
          if (typeof _fixedSS[k] !== 'number' || !Number.isFinite(_fixedSS[k])) _fixedSS[k] = _ssDefaults[k];
        });
        G = { ...G, seasonStats: _fixedSS };
      }

      // v0.97 backward compat: survival gauge
      if (G.survivalCleared === undefined) G = { ...G, survivalCleared: false, survivalProfitStreak: 0, survivalMilestones: [], survivalClearWeek: null, survivalClearSeason: null };
      // v1.0 backward compat: rolling net (replaces profit streak)
      if (!G.recentWeeklyNet) G = { ...G, recentWeeklyNet: [0,0,0,0], rollingNet4Count: 0 };
      // Migrate old profit streak to rolling count estimate
      if (G.survivalProfitStreak && G.survivalProfitStreak >= 4 && !G.rollingNet4Count) {
        G = { ...G, rollingNet4Count: Math.floor(G.survivalProfitStreak / 4) };
      }
      // v1.0 backward compat: title establishment
      if (G.titleEstablished === undefined) {
        // Auto-detect: if champion exists or title conditions met, it's established
        G = { ...G, titleEstablished: !!(G.titles?.world?.championId) || (G.totalShows >= 3 && G.orgPop >= 15 && G.roster.length >= 5) };
      }

      // 安全弁: 王者がロスターに存在しない場合は空位にする（退団パス漏れ修復）
      if (G.titles?.world?.championId && !G.roster.find(c => c.id === G.titles.world.championId)) {
        G = { ...G, titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } } };
        console.log('[Migration] 王者がロスターに不在のため王座を空位に修復しました');
      }

      G = { ...G, version: '1.05' };

      // Sync master-backed fields from ALL_CHARS so save data follows spec updates.
      const syncMasterCharMeta = c => {
        const master = ALL_CHARS.find(t => t.id === c.id);
        if (!master) return c;
        return {
          ...c,
          personality: master.personality || c.personality || 'normal',
          archetype: master.archetype || c.archetype || 'standard',
        };
      };

      // Fix character data (immutable)
      const fixChar = c => {
        const nc = syncMasterCharMeta({ ...c });
        if (!nc.seasonGrowth) nc.seasonGrowth = {pw:0, sp:0, te:0, st:0, mn:0};
        if (nc.careerSeasons === undefined) nc.careerSeasons = 0;
        if (!nc.pot) { const t = ALL_CHARS.find(t => t.id === nc.id); if (t) nc.pot = {...t.pot}; }
        if (nc.intensive === undefined) nc.intensive = false;
        if (nc.intensiveWeeks === undefined) nc.intensiveWeeks = 0;
        // v0.9: add notionValue/trainCap if missing (migrating from v0.85b)
        if (!nc.notionValue) {
          const t = ALL_CHARS.find(t => t.id === nc.id);
          if (t) nc.notionValue = {pw:t.pw, sp:t.sp, te:t.te, st:t.st, mn:t.mn};
          else nc.notionValue = {pw:nc.pw, sp:nc.sp, te:nc.te, st:nc.st, mn:nc.mn};
        }
        if (!nc.trainCap && nc.notionValue && nc.pot) {
          const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, nc.id, 777));
          nc.trainCap = Engine.rival.generateTrainCap(rng, nc.notionValue, nc.pot);
        }
        if (nc.age === undefined) nc.age = 17 + (nc.careerSeasons || 0);
        return nc;
      };
      G = { ...G, roster: G.roster.map(fixChar), freeAgents: G.freeAgents.map(fixChar) };
      if (G.aiOrgs) {
        const syncedAi = {};
        Object.keys(G.aiOrgs).forEach(orgId => {
          const od = G.aiOrgs[orgId];
          syncedAi[orgId] = { ...od, roster: (od.roster || []).map(fixChar) };
        });
        G = { ...G, aiOrgs: syncedAi };
      }

      // v1.0 migration: fix freeAgents that were created with useNotion:true bug
      // Detect: all 4 physical stats exactly match notionValue (statistically impossible from generateStartValues)
      // ※フラグ制御: 成長でnotionValueに到達したFAのステを誤ってリセットしないよう一度きり
      if (!G._migrated_v1_0_fa_notion) {
        G = { ...G, freeAgents: G.freeAgents.map(c => {
          if (!c.notionValue) return c;
          const nv = c.notionValue;
          const isInflated = c.pw === nv.pw && c.sp === nv.sp && c.te === nv.te && c.st === nv.st;
          if (!isInflated) return c;
          // Recalculate with age-appropriate values
          const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 888));
          const startVals = Engine.rival.generateStartValues(rng, nv, c.trainCap, c.age, c.traits || []);
          return { ...c, ...startVals };
        })};
        G = { ...G, _migrated_v1_0_fa_notion: true };
      }

      // v1.2 migration: fix freeAgents stuck at age 16-17 (should be 17-23)
      // ※フラグ制御: 旧セーブへの一度きりの修正。毎ロード実行は年齢変動バグの原因になる
      if (!G._migrated_v1_2_fa_age) {
        G = { ...G, freeAgents: G.freeAgents.map(c => {
          if (c.age > 17) return c; // only fix age ≤17 FAs (legacy: was 16)
          const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1616));
          const newAge = 17 + Engine.rng.int(ageRng, 0, 6);
          const nv = c.notionValue || {pw:c.pw,sp:c.sp,te:c.te,st:c.st,mn:c.mn};
          const startVals = Engine.rival.generateStartValues(ageRng, nv, c.trainCap, newAge, c.traits || []);
          return { ...c, age: newAge, ...startVals };
        })};
        G = { ...G, _migrated_v1_2_fa_age: true };
      }

      // Growth lifecycle v1: 遅咲き is folded into 晩成, and every current
      // fighter receives the fields used by the shared maturity/workload logic.
      if (!G._migrated_growth_lifecycle_v1) {
        const legacySeasonMatches = (G.week || 1) > 1 ? 11 : 0;
        const migrateTraits = fighter => {
          if (!fighter) return fighter;
          const currentTraits = Array.isArray(fighter.traits) ? fighter.traits : [];
          const hasLateStarter = currentTraits.includes('遅咲き');
          const traits = hasLateStarter
            ? [...new Set([...currentTraits.filter(t => t !== '早熟' && t !== '晩成' && t !== '遅咲き'), '晩成'])]
            : currentTraits;
          return {
            ...fighter,
            traits,
            seasonMatchCount: Number.isFinite(fighter.seasonMatchCount) ? fighter.seasonMatchCount : legacySeasonMatches
          };
        };
        const hasActiveCareer = fighter => {
          const totalMatches = (fighter.wins || 0) + (fighter.losses || 0) + (fighter.draws || 0);
          const timeline = fighter.orgTimeline || [];
          const history = fighter.careerRecord?.history || [];
          return totalMatches > 0
            || (fighter.growthLog || []).length > 0
            || timeline.some(e => e && e.orgId && e.orgId !== 'fa')
            || history.some(e => e && (e.type === 'debut' || e.type === 'transfer'))
            || (!!fighter.orgId && fighter.orgId !== 'fa');
        };
        const migrateActive = fighter => ({ ...migrateTraits(fighter), careerStage: 'active' });
        const migrateProspect = fighter => {
          let next = migrateTraits(fighter);
          next.careerStage = next.careerStage || (hasActiveCareer(next) ? 'active' : 'prospect');
          if (next.careerStage === 'prospect' && next.notionValue && next.trainCap) {
            const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, next.id, next.age || 17, 0xFA04));
            next = Engine.rival.syncProspectMaturity(rng, next);
          }
          return next;
        };
        const migrateArchive = fighter => migrateTraits(fighter);
        const aiOrgs = Object.fromEntries(Object.entries(G.aiOrgs || {}).map(([orgId, org]) => [
          orgId, { ...org, roster: (org.roster || []).map(migrateActive) }
        ]));
        G = {
          ...G,
          roster: (G.roster || []).map(migrateActive),
          freeAgents: (G.freeAgents || []).map(migrateProspect),
          scoutCandidates: (G.scoutCandidates || []).map(migrateProspect),
          retiredFighters: (G.retiredFighters || []).map(migrateArchive),
          hallOfFame: (G.hallOfFame || []).map(migrateArchive),
          allHallOfFame: Object.fromEntries(Object.entries(G.allHallOfFame || {}).map(([key, entries]) => [key, (entries || []).map(migrateArchive)])),
          aiOrgs,
          _migrated_growth_lifecycle_v1: true
        };
        if (Array.isArray(G.pendingRetirements)) {
          G = { ...G, pendingRetirements: G.pendingRetirements.map(entry => entry?.fighter ? { ...entry, fighter: migrateArchive(entry.fighter) } : entry) };
        }
      }

      // v0.99 migration: assign assessedValue to all characters (pricing-balance-spec §1)
      const migrateAssessed = (fighters) => fighters.map(f => {
        if (f.assessedValue) return f;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, f.id, 999));
        const av = Engine.scout.calcAssessedValue(f, rng, G.season || 1);
        return { ...f, ...av };
      });
      G = { ...G, roster: migrateAssessed(G.roster), freeAgents: migrateAssessed(G.freeAgents) };
      // Also migrate AI org rosters
      if (G.aiOrgs) {
        const migAi = {};
        Object.keys(G.aiOrgs).forEach(orgId => {
          const od = G.aiOrgs[orgId];
          migAi[orgId] = { ...od, roster: migrateAssessed(od.roster) };
        });
        G = { ...G, aiOrgs: migAi };
      }

      // v1.0b migration: popularity/venue redesign
      if (!G._migrated_v1_0b) {
        // Add new fighter fields
        const migrateV1b = (fighters) => fighters.map(c => {
          const nc = { ...c };
          if (nc.losingStreak === undefined) nc.losingStreak = 0;
          if (nc.preInjuryPop === undefined) nc.preInjuryPop = nc.injury ? nc.popularity : null;
          return nc;
        });
        G = { ...G, roster: migrateV1b(G.roster), freeAgents: migrateV1b(G.freeAgents) };
        // Migrate AI org rosters
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migrateV1b(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        // Rescale popularity (fix "everyone at 100" problem)
        const rescalePop = (fighters) => fighters.map(c => {
          const ovr = Engine.util.ov(c);
          const targetPop = ovr <= 50 ? 15 : ovr <= 65 ? 30 : ovr <= 80 ? 50 : ovr <= 90 ? 65 : 80;
          const newPop = c.popularity * 0.5 + targetPop * 0.5;
          return { ...c, popularity: Engine.util.clamp(newPop, 5, 90) };
        });
        G = { ...G, roster: rescalePop(G.roster) };
        // Rescale AI org fighter popularity too
        if (G.aiOrgs) {
          const migAi2 = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi2[orgId] = { ...od, roster: rescalePop(od.roster) };
          });
          G = { ...G, aiOrgs: migAi2 };
        }
        // Migrate venue index if needed (old 6 venues → new 7 venues)
        if (G.showVenue !== undefined) {
          // Old: 0=公民館,1=小,2=中,3=アリーナ,4=大,5=ドーム
          // New: 0=公民館,1=小,2=市民会館,3=中,4=アリーナ,5=大,6=ドーム
          const venueMap = {0:0, 1:1, 2:3, 3:4, 4:5, 5:6};
          G = { ...G, showVenue: venueMap[G.showVenue] ?? 0 };
        }
        G = { ...G, _migrated_v1_0b: true };
      }

      // v1.3 migration: add careerRecord to all fighters + retiredFighters/hallOfFame to state
      if (!G._migrated_v1_3) {
        const migrateCareer = roster => roster.map(c => c.careerRecord ? c : { ...c, careerRecord: Engine.career.createRecord() });
        G = { ...G, roster: migrateCareer(G.roster), freeAgents: migrateCareer(G.freeAgents) };
        if (!G.retiredFighters) G = { ...G, retiredFighters: [] };
        if (!G.hallOfFame) G = { ...G, hallOfFame: [] };
        // Migrate AI org rosters too
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migrateCareer(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3: true };
      }

      // v1.3-1 migration: add durability and wear to all fighters
      if (!G._migrated_v1_3_1) {
        const migWear = (fighters) => fighters.map(c => {
          if (c.durability !== undefined && c.wear !== undefined) return c;
          const mRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1331));
          const dur = c.durability !== undefined ? c.durability : Engine.career.generateDurability(mRng);
          const decayStart = 23 + dur;
          // 既存ベテランへの配慮: 理論値の70%でwearを後付け
          const wearYears = Math.max(0, (c.age || 17) - decayStart);
          const estimatedWear = c.wear !== undefined ? c.wear : Math.round(wearYears * 8 * 0.7);
          return { ...c, durability: dur, wear: estimatedWear };
        });
        G = { ...G, roster: migWear(G.roster), freeAgents: migWear(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migWear(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3_1: true };
      }

      // v1.3-2 migration: add seasonInjuries, careerHistory, growthPenalty to all fighters
      if (!G._migrated_v1_3_2) {
        const migV132 = (fighters) => fighters.map(c => {
          const updates = {};
          if (!c.hasOwnProperty('seasonInjuries')) updates.seasonInjuries = 0;
          if (!c.hasOwnProperty('careerHistory'))  updates.careerHistory  = [];
          if (!c.hasOwnProperty('growthPenalty'))  updates.growthPenalty  = null;
          return Object.keys(updates).length > 0 ? { ...c, ...updates } : c;
        });
        G = { ...G, roster: migV132(G.roster), freeAgents: migV132(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migV132(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3_2: true };
      }

      // v1.3-3: Fix float stat values from match growth bug
      if (!G._migrated_v1_3_3) {
        const fixFloats = (fighters) => fighters.map(c => {
          const nc = { ...c };
          ['pw','sp','te','st','mn'].forEach(s => {
            if (typeof nc[s] === 'number') nc[s] = Math.round(nc[s]);
          });
          if (nc.seasonGrowth) {
            nc.seasonGrowth = { ...nc.seasonGrowth };
            ['pw','sp','te','st','mn'].forEach(s => {
              if (typeof nc.seasonGrowth[s] === 'number') nc.seasonGrowth[s] = Math.round(nc.seasonGrowth[s]);
            });
          }
          return nc;
        });
        G = { ...G, roster: fixFloats(G.roster), freeAgents: fixFloats(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: fixFloats(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3_3: true };
      }

      // v1.4 migration: AI fighters に careerSeasons 付与 + lastAwards/hallOfFame
      if (!G._migrated_v1_4) {
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = {
              ...od,
              roster: od.roster.map(f => ({
                ...f,
                careerSeasons: f.careerSeasons != null ? f.careerSeasons : Math.max(0, (f.age || 17) - 17)
              }))
            };
          });
          G = { ...G, aiOrgs: migAi };
        }
        if (!G.hasOwnProperty('lastAwards')) G = { ...G, lastAwards: null };
        if (!G.hasOwnProperty('hallOfFame')) G = { ...G, hallOfFame: [] };
        G = { ...G, _migrated_v1_4: true };
      }

      // v1.8: 成長イベントシステム マイグレーション
      if (!G._migrated_growth_events) {
        const addGrowthFields = fighters => fighters.map(c => {
          const updates = {};
          if (!c.hasOwnProperty('hotStreak'))      updates.hotStreak      = null;
          if (!c.hasOwnProperty('slump'))          updates.slump          = null;
          if (!c.hasOwnProperty('motivationLoss')) updates.motivationLoss = null;
          if (!c.hasOwnProperty('careerBestMQ'))   updates.careerBestMQ   = 0;
          return Object.keys(updates).length > 0 ? { ...c, ...updates } : c;
        });
        G = { ...G, roster: addGrowthFields(G.roster || []) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: addGrowthFields(od.roster || []) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_growth_events: true };
      }

      // MQ historical industry record: initialize once from all saved fighter pools.
      G = Engine.mq.migrateRecord(G);

      // MQ再設計P3e(§2.2): シングル/タッグ記録の分離。v1世代も含めて1回限り再移行する。
      G = Engine.mq.migrateRecordV2(G);

      // v1.5: 難易度リバランス — 既存セーブのorgPopをリスケール（×0.7）
      // ※ orgPop < 20 は逓減カーブが×1.0帯のため補正不要（序盤セーブには適用しない）
      if (!G._migrated_v1_5_rebalance) {
        const oldOrgPop = G.orgPop || 0;
        if (oldOrgPop >= 20) {
          const newOrgPop = Math.round(oldOrgPop * 0.7);
          G = { ...G, orgPop: newOrgPop };
          G = { ...G, gameLog: [...(G.gameLog || []), `📢 バランス調整(v1.5): 団体人気を${oldOrgPop}→${newOrgPop}に再調整しました（×0.7 リスケール）`] };
        }
        G = { ...G, _migrated_v1_5_rebalance: true };
      }

      // v1.5s25b: マイルストーンイベントシステム マイグレーション
      if (!G._migrated_milestone) {
        if (!G.milestones) G = { ...G, milestones: {} };
        if (!G.milestoneBuffs) G = { ...G, milestoneBuffs: [] };
        // 既存セーブで条件を満たしているマイルストーンは発動済みとする
        const ms = { ...G.milestones };
        if ((G.totalShows || 0) > 0) ms.first_show = true;
        if (Engine.util.dispOrgPop(G.orgPop) >= 20) ms.orgpop_20 = true;
        if (Object.keys(G.rivalries || {}).length > 0) ms.first_rivalry = true;
        G = { ...G, milestones: ms, _migrated_milestone: true };
      }

      // v2.0: trust パラメータ + lockerRoomMorale マイグレーション
      if (!G._migrated_trust) {
        // 全選手に trust: 50 を付与（初期値）
        const migratedRoster = (G.roster || []).map(f =>
          f.trust != null ? f : { ...f, trust: 50 }
        );
        G = {
          ...G,
          roster: migratedRoster,
          lockerRoomMorale: G.lockerRoomMorale != null ? G.lockerRoomMorale : 60,
          _migrated_trust: true,
        };
        G = { ...G, gameLog: [...(G.gameLog || []), '📢 システム更新(v2.0): 選手の反応表現を更新しました'] };
      }

      if (!G._migrated_npc_traits) {
        // AI団体の全選手に traits を付与（ALL_CHARS のマスタから引く）
        const aiOrgs = { ...(G.aiOrgs || {}) };
        for (const orgId of Object.keys(aiOrgs)) {
          aiOrgs[orgId] = {
            ...aiOrgs[orgId],
            roster: (aiOrgs[orgId].roster || []).map(f => {
              if (f.traits != null) return f;
              const master = ALL_CHARS.find(ch => ch.id === f.id);
              return { ...f, traits: master ? (master.traits || []) : [] };
            })
          };
        }
        G = { ...G, aiOrgs, _migrated_npc_traits: true };
      }

      // v2.1: endingCleared / endingClearedSeason マイグレーション
      if (!G._migrated_ending) {
        const endingCleared = G.endingCleared || hasPlayerHistoricRank1(G);
        const endingClearedSeason = G.endingClearedSeason || ((G.seasonHistory || []).find(s => (s?.rank || 99) === 1)?.season) || null;
        G = { ...G, endingCleared, endingClearedSeason, _migrated_ending: true };
      }
      // v2.0 Phase1-6: 大型イベント マイグレーション
      if (!G._migrated_large_events) {
        G = { ...G, lastLargeEventWeek: G.lastLargeEventWeek || 0, lastB3ChallengeWeek: G.lastB3ChallengeWeek || 0, mediaSpotlight: G.mediaSpotlight || null, _migrated_large_events: true };
      }
      // L1: 会場システム再設計マイグレーション
      if (!G._migrated_venue_redesign) {
        // 旧7段→新10段: 0=公民館→0, 1=小ホール→1, 2=市民会館→3, 3=中ホール→4, 4=アリーナ→7, 5=大会場→8, 6=ドーム→9
        const venueMap = {0:0, 1:1, 2:3, 3:4, 4:7, 5:8, 6:9};
        G = { ...G,
          showVenue: venueMap[G.showVenue] ?? 0,
          attendanceMomentum: 0,
          _migrated_venue_redesign: true
        };
      }

      // Rental system migration: G.rental (single object) → G.rentals (array)
      if (!G._migrated_rental_v2) {
        const rentals = Array.isArray(G.rentals) ? [...G.rentals] : [];
        let roster = [...(G.roster || [])];
        if (G.rental) {
          // Convert old single rental to new contract format
          const old = G.rental;
          if (!rentals.some(r => r.fighterId === old.fighterId)) {
            rentals.push({
              fighterId: old.fighterId,
              fromSource: 'rival',
              fromOrgId: old.fromOrgId,
              seasonsLeft: 1,  // finish at next season end
              fee: 0           // already paid in old system
            });
          }
          roster = roster.map(c => (
            c.id === old.fighterId
              ? { ...c, isRental: true, rentalSource: 'rival', rentalSeasonsLeft: 1 }
              : c
          ));
        }
        G = { ...G, rentals, roster, rental: undefined, _migrated_rental_v2: true };
      }

      // Rental v3: seasonsLeft → weeksLeft (1期=12週の週次減算に移行)
      if (!G._migrated_rental_v3) {
        const rentals = (G.rentals || []).map(r => {
          if (r.weeksLeft != null) return r; // 既に移行済み
          // 旧 seasonsLeft を weeksLeft に変換: seasonsLeft * 12
          const wl = (r.seasonsLeft || 1) * 12;
          const { seasonsLeft, ...rest } = r;
          return { ...rest, weeksLeft: wl };
        });
        // roster上の rentalSeasonsLeft → rentalWeeksLeft
        const roster = (G.roster || []).map(c => {
          if (!c.isRental) return c;
          const ct = rentals.find(r => r.fighterId === c.id);
          const { rentalSeasonsLeft, ...rest } = c;
          return { ...rest, rentalWeeksLeft: ct ? ct.weeksLeft : (rentalSeasonsLeft || 1) * 12 };
        });
        G = { ...G, rentals, roster, _migrated_rental_v3: true };
      } else if ((G.roster || []).some(c => c?.isRental && c.rentalSeasonsLeft !== undefined && c.rentalWeeksLeft === undefined)) {
        const roster = (G.roster || []).map(c => {
          if (!c?.isRental || c.rentalSeasonsLeft === undefined || c.rentalWeeksLeft !== undefined) return c;
          const { rentalSeasonsLeft, ...rest } = c;
          return { ...rest, rentalWeeksLeft: (rentalSeasonsLeft || 1) * 12 };
        });
        G = { ...G, roster };
      }

      // ranking-roster-redesign v1.0 Phase 1: battlePoints + summitBonus廃止
      if (!G._migrated_ranking_v2) {
        const bp = { player: 0, org_s: 0, org_a: 0, org_b: 0 };
        // summitBonusが残っていればplayer battlePointsに移行
        if (G.summitBonus) bp.player = G.summitBonus;
        G = { ...G, battlePoints: bp, _migrated_ranking_v2: true };
        delete G.summitBonus;
        // ランキングを再計算
        G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      }

      // 因縁リデザインv2: resolutionCount + matchupLog
      if (!G._migrated_rivalry_v2) {
        const migratedRivalries = {};
        Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
          migratedRivalries[key] = { ...rv, resolutionCount: rv.resolutionCount || 0 };
        });
        // matchupLog補完: rivalriesから対戦履歴を復元し、初顔合わせ誤判定を防ぐ
        let migratedLog = G.matchupLog || [];
        if (migratedLog.length === 0) {
          const currentShow = G.totalShows || 0;
          Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
            const ids = key.split('-').map(Number);
            if (ids.length !== 2 || !ids[0] || !ids[1]) return;
            const matches = rv.matches || 0;
            for (let j = 0; j < matches; j++) {
              migratedLog.push({
                leftId: ids[0], rightId: ids[1],
                showCount: Math.max(1, currentShow - matches + j + 1)
              });
            }
          });
        }
        G = { ...G, rivalries: migratedRivalries, matchupLog: migratedLog, _migrated_rivalry_v2: true };
      }

      // matchupLog補完v2: 既にrivalry_v2マイグレーション済みだが空logのセーブデータ対応
      if (!G._migrated_matchuplog_v2) {
        if ((G.matchupLog || []).length === 0 && Object.keys(G.rivalries || {}).length > 0) {
          const currentShow = G.totalShows || 0;
          const backfillLog = [];
          Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
            const ids = key.split('-').map(Number);
            if (ids.length !== 2 || !ids[0] || !ids[1]) return;
            const matches = rv.matches || 0;
            for (let j = 0; j < matches; j++) {
              backfillLog.push({
                leftId: ids[0], rightId: ids[1],
                showCount: Math.max(1, currentShow - matches + j + 1)
              });
            }
          });
          if (backfillLog.length > 0) {
            G = { ...G, matchupLog: backfillLog };
          }
        }
        G = { ...G, _migrated_matchuplog_v2: true };
      }

      // PPV GRAND FINAL マイグレーション
      if (!G._migrated_ppv_v2) {
        G = { ...G,
          ppvUnlocked: (G.orgPop || 0) >= PPV_UNLOCK_POP,
          ppvEntries: G.ppvEntries || null,
          ppvPhase: G.ppvPhase || null,
          ppvName: G.ppvName || '',
          _migrated_ppv_v2: true,
        };
      }

      // v0.99b: clean up scoutEvent state if weekPhase isn't scoutEvent
      if (G.weekPhase !== 'scoutEvent') {
        G = { ...G, scoutCandidates: null, scoutPicks: null, scoutMaxPicks: null, scoutPendingPick: null, scoutEventType: null, _draftNegotiationStarted: false };
      }

      // Repair challenge display guests on every load.  The migration marker
      // only records the roster-cap recalculation; it must not disable future
      // cleanup if an interrupted battle polluted a newer save.
      const cleanedRoster = (G.roster || []).filter(f =>
        f?.isRental || (!f?.isAwayChallengeGuest && !f?.isCRGuest && !f?.isB3ChallengeGuest && !f?.isUnifiedTitleGuest)
      );
      const removedChallengeGuests = cleanedRoster.length !== (G.roster || []).length;
      if (removedChallengeGuests) {
        G = { ...G, roster: cleanedRoster };
        if (Engine.ranking?.updateRankings) G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      }
      if (!G._migrated_roster_cap_away_guest_repair_v1 || removedChallengeGuests) {
        const repairedRank1Unlock = App.hasPermanentRosterCap16Unlock(G);
        G = {
          ...G,
          // ラチェット: ロード時の再計算でも既に開いた枠は閉じない(週次側と同じ理由)
          rosterCap: Math.max(G.rosterCap || 8, App.getRosterCapTarget(G)),
          rosterCapRank1Notified: repairedRank1Unlock,
          _migrated_roster_cap_away_guest_repair_v1: true,
        };
      }

      // roster-cap v2.0: popularity-based progression (8 -> 10 -> 12 -> 16)
      if (!G._migrated_roster_cap_pop_v2) {
        const orgPop = G.orgPop || 0;
        const rank1Unlocked = App.hasPermanentRosterCap16Unlock(G);
        let cap = 8;
        if (orgPop >= 25) cap = 10;
        if (orgPop >= 50) cap = 12;
        if (orgPop >= 70) cap = 14;
        if (rank1Unlocked) cap = 16;
        // キャップ制導入前のセーブが移行直後から「超過」扱いにならないよう、
        // 既に抱えている所属数(非レンタル)を下回らない(既得は取り上げない)
        cap = Math.max(cap, (G.roster || []).filter(f => !f.isRental).length);
        G = {
          ...G,
          rosterCap: cap,
          rosterCapPop25Notified: orgPop >= 25,
          rosterCapPop50Notified: orgPop >= 50,
          rosterCapPop70Notified: orgPop >= 70,
          rosterCapRank1Notified: rank1Unlocked,
          _migrated_roster_cap_pop_v2: true,
        };
      } else {
        if (G.rosterCap === undefined) G = { ...G, rosterCap: 8 };
        if (G.rosterCapPop25Notified === undefined) G = { ...G, rosterCapPop25Notified: (G.orgPop || 0) >= 25 };
        if (G.rosterCapPop50Notified === undefined) G = { ...G, rosterCapPop50Notified: (G.orgPop || 0) >= 50 };
        if (G.rosterCapPop70Notified === undefined) G = { ...G, rosterCapPop70Notified: (G.orgPop || 0) >= 70 };
        if (G.rosterCapRank1Notified === undefined) G = { ...G, rosterCapRank1Notified: App.hasPermanentRosterCap16Unlock(G) };
      }

      // scout-pricing v2: assessedValue再計算（TIERS baseMin/Max引き上げ対応）
      if (!G._migrated_scout_pricing_v2) {
        const rng = Engine.rng.create(0xFACE + (G.season || 1));
        const reassess = (fighters) => fighters.map(f => {
          if (!f.assessedValue) return f;
          const av = Engine.scout.calcAssessedValue(f, rng, G.season || 1);
          return { ...f, assessedValue: av.assessedValue, assessedTier: av.assessedTier };
        });
        G = { ...G, freeAgents: reassess(G.freeAgents || []) };
        const aiOrgs = { ...G.aiOrgs };
        Object.keys(aiOrgs).forEach(k => {
          if (aiOrgs[k]?.roster) aiOrgs[k] = { ...aiOrgs[k], roster: reassess(aiOrgs[k].roster) };
        });
        G = { ...G, aiOrgs, _migrated_scout_pricing_v2: true };
      }

      // 契約交渉: salaryBonusフィールド追加
      if (!G._migrated_contract_v1) {
        G.roster.forEach(f => { if (f.salaryBonus === undefined) f.salaryBonus = 0; });
        G = { ...G, _migrated_contract_v1: true };
      }

      // NPC記録統一: AI選手にcareerBestMQ + orgDataにmatchupLog/seasonBreakthroughs/showCount
      if (!G._migrated_npc_record_v1) {
        const aiOrgs = { ...G.aiOrgs };
        Object.keys(aiOrgs).forEach(orgId => {
          const od = aiOrgs[orgId];
          if (!od) return;
          aiOrgs[orgId] = { ...od,
            matchupLog: od.matchupLog || [],
            seasonBreakthroughs: od.seasonBreakthroughs || [],
            showCount: od.showCount || 0
          };
          (od.roster || []).forEach(f => {
            if (f.careerBestMQ === undefined) f.careerBestMQ = 0;
            if (f.losingStreak === undefined) f.losingStreak = 0;
            if (f.noAppearStreak === undefined) f.noAppearStreak = 0;
          });
        });
        G = { ...G, aiOrgs, _migrated_npc_record_v1: true };
      }

      // Phase 1: 人間関係データ基盤 — 既存セーブデータとの互換性
      if (!G._migrated_relationships_v1) {
        if (!G.relationships || Object.keys(G.relationships).length === 0) {
          G = Engine.relationships.initialize(G);
        }
        if (!G.relationshipCounters) {
          G = { ...G, relationshipCounters: {} };
        }
        G = { ...G, _migrated_relationships_v1: true };
      }

      // relationshipHistory の旧配列形式と、裏切り履歴オブジェクト形式を統合する。
      if (!G._migrated_relationship_history_store_v1) {
        G = {
          ...G,
          relationshipHistory: Engine.relationships.normalizeHistoryStore(G.relationshipHistory),
          _migrated_relationship_history_store_v1: true,
        };
      }

      // Phase 5: ライバル称号tierフィールドマイグレーション
      if (!G._migrated_rivalry_tier_v1) {
        const rivalries = { ...G.rivalries };
        for (const key of Object.keys(rivalries)) {
          const entry = rivalries[key];
          if (entry.tier === undefined) {
            let tier = 0;
            if (!entry.resolved) {
              if ((entry.matches || 0) >= 7) tier = 3;
              else if ((entry.matches || 0) >= 4) tier = 2;
              else if ((entry.matches || 0) >= 2) tier = 1;
            }
            rivalries[key] = {
              ...entry,
              tier,
              tierPromotedWeek: 0,
              matchesSinceTier: 0,
              bestMQSinceTier: 0,
              oneSided: null,
            };
          }
        }
        G = { ...G, rivalries, _migrated_rivalry_tier_v1: true };
      }

      if (!G._migrated_retired_rivalry_cleanup_v1) {
        (G.retiredFighters || []).forEach(retiree => {
          G = archiveRetiredRivalryState(G, retiree);
        });
        G = { ...G, _migrated_retired_rivalry_cleanup_v1: true };
      }
      // 社長室 Phase 2: 決裁枠マイグレーション
      if (G.decisionPoints === undefined) {
        G = { ...G, decisionPoints: 6, decisionPointsMax: 6, _migrated_decisionPoints_v1: true };
      }
      // 社長室 Phase 4: _decisionWeekUsed / _decisionDoneThisWeek 初期化
      if (G._decisionWeekUsed === undefined) {
        G = { ...G, _decisionWeekUsed: {} };
      }
      if (G._decisionDoneThisWeek === undefined) {
        G = { ...G, _decisionDoneThisWeek: [] };
      }
      if (G.roster && G.roster.some(f => f._decisionWeekUsed === undefined)) {
        G = { ...G, roster: G.roster.map(f => f._decisionWeekUsed === undefined ? { ...f, _decisionWeekUsed: {} } : f) };
      }
      // 社長室 Phase 5: _careWeekUsed → _decisionWeekUsed に統合
      if (G.roster && G.roster.some(f => f._careWeekUsed)) {
        G = { ...G, roster: G.roster.map(f => {
          if (!f._careWeekUsed) return f;
          const merged = { ...(f._decisionWeekUsed || {}), ...f._careWeekUsed };
          const { _careWeekUsed: _, ...rest } = f;
          return { ...rest, _decisionWeekUsed: merged };
        }) };
      }
      // 社長室 Phase 5: 旧ケアストック / _teamCareWeekUsed / _costumeDebut を削除
      if (G.careStock !== undefined || G.careStockMax !== undefined
          || G.careStockLastRecovery !== undefined || G._teamCareWeekUsed !== undefined) {
        const { careStock: _a, careStockMax: _b, careStockLastRecovery: _c, _teamCareWeekUsed: _d, ...rest } = G;
        G = rest;
      }
      if (G.roster && G.roster.some(f => f._costumeDebut !== undefined)) {
        G = { ...G, roster: G.roster.map(f => {
          if (f._costumeDebut === undefined) return f;
          const { _costumeDebut: _, ...rest } = f;
          return rest;
        }) };
      }
      // 社長室 Phase 7: pendingTrustDeltas 初期化 (trainer/camp の遅延発現トラック)
      if (G.roster && G.roster.some(f => f.pendingTrustDeltas === undefined)) {
        G = { ...G, roster: G.roster.map(f =>
          f.pendingTrustDeltas === undefined ? { ...f, pendingTrustDeltas: [] } : f
        ) };
      }

      // retiredIds永続化マイグレーション: hallOfFame+現retiredFightersのIDを収集
      if (!G._migrated_retiredIds_v1) {
        const ids = new Set(G.retiredIds || []);
        (G.hallOfFame || []).forEach(f => { if (f.id) ids.add(f.id); });
        (G.retiredFighters || []).forEach(f => { if (f.id) ids.add(f.id); });
        G = { ...G, retiredIds: [...ids], _migrated_retiredIds_v1: true };
      }

      // retiredSeasonsマイグレーション: 既存retiredIdsに引退シーズンを割り当て（即リサイクル対象に）
      if (!G._migrated_retiredSeasons_v1) {
        const rs = { ...(G.retiredSeasons || {}) };
        // 現在どのプールにもいないretiredIdsに対して、5シーズン以上前のシーズンを割り当て
        const pastSeason = Math.max(1, (G.season || 1) - 10);
        (G.retiredIds || []).forEach(id => {
          if (!rs[id]) rs[id] = pastSeason;
        });
        G = { ...G, retiredSeasons: rs, _migrated_retiredSeasons_v1: true };
      }

      // MQ表記一掃: 旧セーブの表示用テキスト(ログ/新聞アーカイブ/殿堂ハイライト/年代記
      // キャッシュ等)に焼き込まれた「MQ」表記を、生成側の新表記と同じ日本語へ一度だけ
      // 書き換える。対象サブツリーは表示専用文字列のみで、内部キー('careerBestMQ'等の
      // 値文字列)はどのパターンにも掛からない形にしてある
      if (!G._migrated_mq_text_v1) {
        const mqTextFixes = [
          [/\(MQ avg /g, '(平均試合評価 '],
          [/興行平均MQ: /g, '興行の平均試合評価: '],
          [/（MQ全試合 \+/g, '（全試合の評価+'],
          [/ベストマッチ賞（MQ/g, 'ベストマッチ賞（試合評価'],
          [/（最高MQ/g, '（最高評価'],
          [/MQ(\d+)到達。/g, '試合評価$1到達。'],
          [/自身のMQ最高値/g, '自身の試合評価の最高値'],
          [/自身のベストMQを/g, '自身の最高評価を'],
          [/MQ自己ベスト/g, '試合評価の自己ベスト'],
          [/これだけのMQを/g, 'これだけの試合評価を'],
          [/メインMQ (?=\d)/g, 'メイン試合評価 '],
          [/平均MQ (?=\d)/g, '平均試合評価 '],
          [/。MQ (?=\d)/g, '。試合評価 '],
          [/ MQ (?=\d)/g, ' 試合評価 '],
          [/\(MQ(?=\d)/g, '(試合評価'],
          [/（MQ(?=\d)/g, '（試合評価'],
          [/ MQ(?=\d)/g, ' 試合評価'],
        ];
        const _mqFixStr = (s) => { for (const [re, rep] of mqTextFixes) s = s.replace(re, rep); return s; };
        const _mqFixWalk = (node) => {
          if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
              if (typeof node[i] === 'string') { if (node[i].includes('MQ')) node[i] = _mqFixStr(node[i]); }
              else _mqFixWalk(node[i]);
            }
          } else if (node && typeof node === 'object') {
            for (const k of Object.keys(node)) {
              if (typeof node[k] === 'string') { if (node[k].includes('MQ')) node[k] = _mqFixStr(node[k]); }
              else _mqFixWalk(node[k]);
            }
          }
        };
        ['gameLog', 'newspaperArchive', 'weeklyNewspaper', 'hallOfFame', 'allHallOfFame',
         'lastAwards', 'seasonHistory', 'chronicle', 'prologue'].forEach(key => _mqFixWalk(G[key]));
        G = { ...G, _migrated_mq_text_v1: true };
      }

      if (!G._migrated_factions_v1) {
        if (!Array.isArray(G.factions)) G = { ...G, factions: [] };
        if (!G.factionHostility || typeof G.factionHostility !== 'object') G = { ...G, factionHostility: {} };
        if (!G.factionEventCooldowns || typeof G.factionEventCooldowns !== 'object') G = { ...G, factionEventCooldowns: {} };
        G = { ...G, _migrated_factions_v1: true };
      }
      // 旧セーブを含め、ロードのたびに敵対度の浮動小数誤差を除去する。
      // clean state は同一参照のまま返るため、毎回通して将来の直書き経路にも備える。
      if (Engine.factions && typeof Engine.factions.normalizeFactionHostility === 'function') {
        G = Engine.factions.normalizeFactionHostility(G);
      }
      // 派閥内ポイント制 v1 マイグレーション（spec: faction-internal-rank-spec-v0.2 §2.4）
      if (!G._migrated_factions_internal_points_v1) {
        if (!G.factionInternalPoints || typeof G.factionInternalPoints !== 'object') {
          G = { ...G, factionInternalPoints: {} };
        }
        if (Array.isArray(G.factions)) {
          G = {
            ...G,
            factions: G.factions.map(f =>
              (f && f.internalChallengeCooldownUntilWeek != null)
                ? f
                : { ...f, internalChallengeCooldownUntilWeek: 0 }
            ),
          };
        }
        G = { ...G, _migrated_factions_internal_points_v1: true };
      }
      // v2: 既存派閥への OVR 順位ベース初期割り振り（旧設計: リーダー 0pt / 1位 8pt …）
      // 既存セーブはリーダー就任 52 週猶予を超過していることが多く、Phase 2 のポイント加算が走ると
      // 数興行で差が開いて即発火してしまうため、初期序列を OVR で先に置く（spec §2.4 が本来求めた処理）
      if (!G._migrated_factions_internal_points_v2
          && Array.isArray(G.factions) && G.factions.length > 0
          && Engine.factions && typeof Engine.factions._allocateInternalPointsByOvrRank === 'function') {
        for (const f of G.factions) {
          if (!f || f.status !== 'active') continue;
          if (f.archetypeId === 'BOND' || f.flavor === 'bond_first') continue;
          if (f.leaderId == null) continue;
          G = Engine.factions._allocateInternalPointsByOvrRank(G, f.id, [f.leaderId]);
        }
        G = { ...G, _migrated_factions_internal_points_v2: true };
      }
      // v3: リーダー初期値（最初は派閥最強）+ 非リーダー OVR 順位 [4,2,1,0] への再構成
      // 旧 [8,5,2,0] + リーダー 0pt から、新 [4,2,1,0] + リーダー 12pt にスイッチ
      // ヘルパ _allocateInternalPointsByOvrRank が現リーダーに自動で初期値を入れる
      if (!G._migrated_factions_internal_points_v3
          && Array.isArray(G.factions) && G.factions.length > 0
          && Engine.factions && typeof Engine.factions._allocateInternalPointsByOvrRank === 'function') {
        for (const f of G.factions) {
          if (!f || f.status !== 'active') continue;
          if (f.archetypeId === 'BOND' || f.flavor === 'bond_first') continue;
          if (f.leaderId == null) continue;
          G = Engine.factions._allocateInternalPointsByOvrRank(G, f.id, []);
        }
        G = { ...G, _migrated_factions_internal_points_v3: true };
        if (typeof console !== 'undefined') {
          console.log('[WM Internal Rank] Migration v3: leader initial points + OVR allocation [4,2,1,0]');
        }
      }
      if (Array.isArray(G.factions) && G.factions.some(f => !f.flavor)) {
        G = { ...G, factions: G.factions.map(f => f.flavor ? f : { ...f, flavor: 'bond_first' }) };
      }
      // v0.2 アーキタイプ拡張: 旧 flavor を新 6 種にマイグレーション（一度だけ）
      if (Array.isArray(G.factions) && !G._migrated_archetype_v2) {
        G = {
          ...G,
          factions: G.factions.map(f => {
            // 旧 neutral は再判定 → 結束型 (bond_first) フォールバック
            // 旧 authoritativeTag 持ちの neutral は authoritarian へ
            let newFlavor = f.flavor || 'bond_first';
            if (newFlavor === 'neutral') {
              newFlavor = f.authoritativeTag ? 'authoritarian' : 'bond_first';
            }
            // タグの整合性確保
            return {
              ...f,
              flavor: newFlavor,
              bondTag: f.bondTag || newFlavor === 'bond_first',
              meritTag: f.meritTag || newFlavor === 'meritocratic',
              heelTag: f.heelTag || newFlavor === 'heel',
              faceTag: f.faceTag || newFlavor === 'face',
              combatTag: f.combatTag || newFlavor === 'combat',
              authoritativeTag: f.authoritativeTag || newFlavor === 'authoritarian',
            };
          }),
          _migrated_archetype_v2: true,
        };
      }

      // 派閥の重複所属を修復（Phase 3c セッションで発見された既存セーブのデータ破綻対応）
      if (!G._migrated_faction_dedupe_v1) {
        if (Engine.factions && typeof Engine.factions._dedupeFactionMembers === 'function') {
          G = Engine.factions._dedupeFactionMembers(G);
        }
        G = { ...G, _migrated_faction_dedupe_v1: true };
      }

      if (!G._migrated_h2h_orgTimeline_v1) {
        if (!G.h2h) G = { ...G, h2h: {} };
        // 全ファイターにorgTimeline初期エントリを生成
        const addTimeline = fighters => fighters.map(f => {
          if (f.orgTimeline) return f;
          return { ...f, orgTimeline: [{ orgId: f._orgId || f.orgId || 'fa', fromSeason: 1, fromWeek: 1 }] };
        });
        G = { ...G, roster: addTimeline(G.roster || []), freeAgents: addTimeline(G.freeAgents || []) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: addTimeline(od.roster || []) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_h2h_orgTimeline_v1: true };
      }
      if (!G._migrated_orgTimeline_v3) {
        const normalizeTimeline = (fighters, orgIdResolver) => (fighters || []).map(f => {
          if (!f) return f;
          const orgId = typeof orgIdResolver === 'function' ? orgIdResolver(f) : orgIdResolver;
          if (orgId) return Engine.orgTimeline.syncCurrentEntry(f, orgId, G.season || 1, G.week || 1);
          return f?.orgTimeline ? { ...f, orgTimeline: Engine.orgTimeline.normalize(f.orgTimeline) } : f;
        });
        G = {
          ...G,
          roster: normalizeTimeline(G.roster || [], 'player'),
          freeAgents: normalizeTimeline(G.freeAgents || [], 'fa'),
          retiredFighters: normalizeTimeline(G.retiredFighters || [], null),
          hallOfFame: normalizeTimeline(G.hallOfFame || [], null),
          _migrated_orgTimeline_v3: true,
        };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: normalizeTimeline(od.roster || [], orgId) };
          });
          G = { ...G, aiOrgs: migAi };
        }
      }
      if (!G._migrated_growthLog) {
        G = { ...G, roster: G.roster.map(c => c.growthLog ? c : { ...c, growthLog: [] }), _migrated_growthLog: true };
      }
      if (!G._migrated_junior_hof_v1) {
        // careerRecord に juniorTournamentWins/juniorTournamentAppearances/ppvMainEventWins を補完
        const _addHofFields = (fighters) => (fighters || []).map(f => {
          if (!f.careerRecord) return f;
          const rec = { ...f.careerRecord };
          if (rec.juniorTournamentWins === undefined) rec.juniorTournamentWins = 0;
          if (rec.juniorTournamentAppearances === undefined) rec.juniorTournamentAppearances = 0;
          if (rec.ppvMainEventWins === undefined) rec.ppvMainEventWins = 0;
          return { ...f, careerRecord: rec };
        });
        G = {
          ...G,
          roster: _addHofFields(G.roster),
          freeAgents: _addHofFields(G.freeAgents),
          retiredFighters: _addHofFields(G.retiredFighters),
          _migrated_junior_hof_v1: true,
        };
        // AI団体のrosterにも適用
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: _addHofFields(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
      }

      // v2.0 HOF拡張: allHallOfFame マイグレーション
      if (!G._migrated_allHallOfFame_v1) {
        const existingHof = G.hallOfFame || [];
        const playerHof = existingHof.map(h => ({
          ...h,
          orgId: 'player',
          orgName: h.orgName || G.orgName || 'あなたの団体',
          careerHighlights: h.careerHighlights || Engine.awards.buildCareerHighlights(h, h.orgName || G.orgName || 'あなたの団体', G),
          retireOVR: h.retireOVR || h.ovr || 0,
          retireAge: h.retireAge || 0,
        }));
        G = {
          ...G,
          allHallOfFame: { player: playerHof, org_s: [], org_a: [], org_b: [] },
          hallOfFame: playerHof,
          _migrated_allHallOfFame_v1: true,
        };
      }

      // v2.0 HOF拡張v2: hofPoints/hofLevel 再計算マイグレーション
      if (!G._migrated_allHallOfFame_v2) {
        const _recalcHof = entry => {
          const pts = (entry.titleReigns || 0) + (entry.totalDefenses || 0)
            + (entry.juniorTournamentWins || 0) * 6 + (entry.ppvMainEventWins || 0) * 7;
          const lv = pts >= 35 ? 3 : pts >= 22 ? 2 : pts >= 15 ? 1 : 0;
          return { ...entry, hofPoints: pts, hofLevel: lv };
        };
        const allHof = G.allHallOfFame || { player: [], org_s: [], org_a: [], org_b: [] };
        const fixedHof = {};
        ['player', 'org_s', 'org_a', 'org_b'].forEach(key => {
          fixedHof[key] = (allHof[key] || []).map(_recalcHof);
        });
        G = { ...G, allHallOfFame: fixedHof, hallOfFame: fixedHof.player, _migrated_allHallOfFame_v2: true };
      }

      // 修正D: battleWinsTotal 初期化マイグレーション
      if (!G.battleWinsTotal) {
        G = { ...G, battleWinsTotal: { player: 0, org_s: 0, org_a: 0, org_b: 0 } };
      }

      // 団体年代記 v0.1 マイグレーション (chronicle-system-spec-v0.1.md)
      if (!G._migrated_chronicle_v1) {
        const chEmpty = Engine.chronicle.createEmpty();
        const peakPopularityOf = (f, fallbackSeason) => {
          const cr = f.careerRecord || {};
          const peakPopularity = Math.round(cr.peakPopularity ?? f.peakPopularity ?? f.popularity ?? f.pop ?? 0);
          const peakPopularitySeason = cr.peakPopularitySeason || f.peakPopularitySeason || fallbackSeason || 1;
          return { peakPopularity, peakPopularitySeason };
        };
        const titleStatsOf = (hist, fallbackWins, fallbackDefenses) => {
          const hasTitleHistory = (hist || []).some(e => e && (e.type === 'titleWin' || e.type === 'titleDefense' || e.type === 'titleLoss'));
          if (hasTitleHistory && Engine.career && Engine.career.countTitleStats) {
            return Engine.career.countTitleStats(hist);
          }
          return { titleReigns: fallbackWins || 0, totalDefenses: fallbackDefenses || 0 };
        };
        // HoF player エントリを archive 形式に変換
        const hofToArchive = (h) => {
          const cr = h.careerRecord || {};
          const hist = cr.history || [];
          const titleStats = titleStatsOf(hist, h.titleReigns || cr.totalTitleWins || 0, h.totalDefenses || cr.totalDefenses || 0);
          const debutEv = hist.find(e => e.type === 'debut' || e.type === 'draft' || e.type === 'scout');
          const start = debutEv ? (debutEv.season || 1) : 1;
          const end = h.inductionSeason || G.season || start;
          const pk = cr.peakOVR || h.retireOVR || h.ovr || 0;
          const { peakPopularity, peakPopularitySeason } = peakPopularityOf(h, end);
          return {
            id: h.id,
            name: h.name,
            style: h.style || 'allround',
            personality: h.personality,
            archetype: h.archetype,
            peakOVR: pk,
            peakOVRSeason: cr.peakOVRSeason || end,
            peakPopularity,
            peakPopularitySeason,
            careerSeasonsStart: start,
            careerSeasonsEnd: end,
            titleReigns: titleStats.titleReigns,
            totalDefenses: titleStats.totalDefenses,
            careerRecord: {
              history: hist.map(e => ({ ...e })),
              totalTitleWins: titleStats.titleReigns,
              totalDefenses: titleStats.totalDefenses,
              peakOVR: pk,
              peakOVRSeason: cr.peakOVRSeason || end,
              peakPopularity,
              peakPopularitySeason
            },
            traits: (h.traits || []).filter(t =>
              ['華','ファンサービス','人望','ムードメーカー','熱血','名勝負製造機','ガラスのハート'].includes(t)
            ),
            retiredSeason: end
          };
        };
        // retiredFighter (player想定) を archive 形式に変換 (archiveFighter ロジック相当)
        const retiredToArchive = (f) => {
          const cr = f.careerRecord || {};
          const hist = cr.history || [];
          const titleStats = titleStatsOf(hist, cr.totalTitleWins || 0, cr.totalDefenses || 0);
          const debutEv = hist.find(e => e.type === 'debut' || e.type === 'draft' || e.type === 'scout');
          const start = debutEv ? (debutEv.season || 1) : 1;
          const end = G.season || start;
          const pk = cr.peakOVR || (Engine.util.ov && Engine.util.ov(f)) || 0;
          const { peakPopularity, peakPopularitySeason } = peakPopularityOf(f, end);
          return {
            id: f.id,
            name: f.name,
            style: f.style,
            personality: f.personality,
            archetype: f.archetype,
            peakOVR: pk,
            peakOVRSeason: cr.peakOVRSeason || end,
            peakPopularity,
            peakPopularitySeason,
            careerSeasonsStart: start,
            careerSeasonsEnd: end,
            titleReigns: titleStats.titleReigns,
            totalDefenses: titleStats.totalDefenses,
            careerRecord: {
              history: hist.map(e => ({ ...e })),
              totalTitleWins: titleStats.titleReigns,
              totalDefenses: titleStats.totalDefenses,
              peakOVR: pk,
              peakOVRSeason: cr.peakOVRSeason || end,
              peakPopularity,
              peakPopularitySeason
            },
            traits: (f.traits || []).filter(t =>
              ['華','ファンサービス','人望','ムードメーカー','熱血','名勝負製造機','ガラスのハート'].includes(t)
            ),
            retiredSeason: end
          };
        };
        const archivePlayer = [
          ...((G.allHallOfFame && G.allHallOfFame.player) || []).map(hofToArchive),
          ...((G.retiredFighters) || []).map(retiredToArchive)
        ];
        // 重複排除 (id ベース)
        const seenIds = new Set();
        const uniqueArchive = [];
        archivePlayer.forEach(a => {
          if (!a.id || seenIds.has(a.id)) return;
          seenIds.add(a.id);
          uniqueArchive.push(a);
        });
        // spirit の遡及積算
        const spirit = { striker: 0, grappler: 0, submission: 0, brawler: 0, allround: 0 };
        uniqueArchive.forEach(a => {
          const axis = Engine.chronicle._styleAxis(a.style);
          spirit[axis] = (spirit[axis] || 0) + Engine.chronicle.calcSpiritContribution(a);
        });
        G = {
          ...G,
          chronicle: {
            ...chEmpty,
            spirit,
            fighterArchive: uniqueArchive
          },
          _migrated_chronicle_v1: true
        };
        // 初回章生成
        try {
          G = Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] 初回章生成に失敗:', e);
        }
      }

      // v0.2: coachSlots マイグレーション（既存セーブは雇用済みコーチ数に合わせて枠を初期化）
      // Chronicle v0.2: rebuild old save caches after chapter confirmation rule changes.
      if (!G._migrated_chronicle_status_v2 && G.chronicle && Engine.chronicle) {
        try {
          G = Engine.chronicle.refreshChapters
            ? Engine.chronicle.refreshChapters(G)
            : Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] status v2 rebuild failed', e);
        }
        G = { ...G, _migrated_chronicle_status_v2: true };
      }

      // 序章 — 撤回した遡及マイグレーション (commit 17360df) の残留データ清掃
      // _migrated_prologue_v1 が立っているセーブは B案で作られた擬似序章が入っているため、
      // createEmpty() で初期化し直して既存挙動に戻す。
      // 通常の completeDraft 経路で作られた序章はこのフラグを立てないので無傷。
      if (G._migrated_prologue_v1 && Engine.prologue) {
        G = { ...G, prologue: Engine.prologue.createEmpty() };
        delete G._migrated_prologue_v1;
      }

      // Chronicle v0.3: rebuild old save caches after prime-era segmentation changes.
      if (!G._migrated_chronicle_prime_v3 && G.chronicle && Engine.chronicle) {
        try {
          G = Engine.chronicle.refreshChapters
            ? Engine.chronicle.refreshChapters(G)
            : Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] prime v3 rebuild failed', e);
        }
        G = { ...G, _migrated_chronicle_prime_v3: true };
      }

      if (!G._migrated_coachSlots_v1) {
        const hiredCount = (G.coaches || []).length;
        G = { ...G, coachSlots: Math.max(1, hiredCount), _migrated_coachSlots_v1: true };
      }

      // Speed → Aerial スタイル名マイグレーション
      // 絶対週計算を52週基準→48週基準に統一
      // 旧値の正確な逆算は不可能なため、CD系フィールドをリセットして安全に移行
      if (!G._migrated_absweek48_v1) {
        // GameState直下のCDフィールド: リセット(CDが早く切れる方向=無害)
        const patchState = {};
        if (G.lastIntrusionWeek) patchState.lastIntrusionWeek = 0;
        if (G.lastLargeEventWeek) patchState.lastLargeEventWeek = 0;
        // _snapshotCooldowns: 全リセット(6週CDなので即回復)
        patchState._snapshotCooldowns = {};
        // lastTitleShowWeek: 旧式(season*48)のバグ値→0リセット
        // careStockLastRecovery: 元から48基準だが念のためリセット
        const fixFighter = c => {
          const patch = {};
          if (c.lastTitleShowWeek) patch.lastTitleShowWeek = 0;
          return Object.keys(patch).length ? { ...c, ...patch } : c;
        };
        G = {
          ...G,
          ...patchState,
          roster: G.roster.map(fixFighter),
          _migrated_absweek48_v1: true
        };
      }

      // 暦週を「通常48週+オフ4週=52週」に統一する。
      // 旧 absWeekTotal は誤って53週基準だったため、保存済みの派閥CD等を52週軸へ変換する。
      // 内部挑戦/招聘は旧実装の原点が1シーズン分(+52)ずれていたため、併せて正規化する。
      if (!G._migrated_calendarWeek52_v1) {
        // 旧軸の53番目は実在週ではなく期限値としてのみ生じるため、
        // Engine.util 側で翌シーズン第1週と同じ境界へ畳み込む。
        const from53Week = Engine.util.convertLegacyAbsWeek53To52;
        const removeLegacyOrigin = value => (
          Number.isFinite(value) && value > 0 ? Math.max(0, value - 52) : value
        );
        const mapNumberRecord = (record, convert) => Object.fromEntries(
          Object.entries(record || {}).map(([key, value]) => [key, convert(value)])
        );
        const fixFactionCooldownEntry = value => {
          if (Number.isFinite(value)) return from53Week(value);
          if (!value || typeof value !== 'object') return value;
          return Number.isFinite(value.lastTriggeredWeek)
            ? { ...value, lastTriggeredWeek: from53Week(value.lastTriggeredWeek) }
            : value;
        };
        const fixFaction = f => {
          if (!f) return f;
          const next = { ...f };
          if (Number.isFinite(next.internalChallengeCooldownUntilWeek)) {
            next.internalChallengeCooldownUntilWeek = removeLegacyOrigin(next.internalChallengeCooldownUntilWeek);
          }
          if (next._lastUpset && Number.isFinite(next._lastUpset.absWeek)) {
            next._lastUpset = { ...next._lastUpset, absWeek: removeLegacyOrigin(next._lastUpset.absWeek) };
          }
          for (const key of [
            '_alignDriftStartedAbsWeek', '_commonEventLastWeek',
            '_f07PostRebukeQuietUntil', '_f07DemandQuietUntil', '_f07DemandMoneyQuietUntil'
          ]) {
            if (Number.isFinite(next[key])) next[key] = from53Week(next[key]);
          }
          if (next._commonEventCooldowns) {
            next._commonEventCooldowns = mapNumberRecord(next._commonEventCooldowns, from53Week);
          }
          if (Array.isArray(next._f07RecentIncidents)) {
            next._f07RecentIncidents = next._f07RecentIncidents.map(ev => (
              ev && Number.isFinite(ev.week) ? { ...ev, week: from53Week(ev.week) } : ev
            ));
          }
          return next;
        };
        const fixFighterCalendar = c => {
          if (!c) return c;
          const next = { ...c };
          if (Number.isFinite(next._lastInviteEndWeek)) {
            next._lastInviteEndWeek = removeLegacyOrigin(next._lastInviteEndWeek);
          }
          if (Number.isFinite(next.lastRunWeek)) next.lastRunWeek = from53Week(next.lastRunWeek);
          return next;
        };
        const fixedStateCooldowns = Object.fromEntries(
          Object.entries(G.factionEventCooldowns || {}).map(([key, value]) => [key, fixFactionCooldownEntry(value)])
        );
        const patchCalendar = {
          factionEventCooldowns: fixedStateCooldowns,
          factions: (G.factions || []).map(fixFaction),
          roster: (G.roster || []).map(fixFighterCalendar),
          _migrated_calendarWeek52_v1: true,
        };
        for (const key of ['_f07TeamCooldownUntil', '_commonEventTeamCooldownUntil']) {
          if (Number.isFinite(G[key])) patchCalendar[key] = from53Week(G[key]);
        }
        if (G._commonEvent7PairCooldowns) {
          patchCalendar._commonEvent7PairCooldowns = mapNumberRecord(G._commonEvent7PairCooldowns, from53Week);
        }
        if (G.factionPendingIgnite) {
          patchCalendar.factionPendingIgnite = { ...G.factionPendingIgnite };
          for (const key of ['scheduledFromWeek', 'expireWeek']) {
            if (Number.isFinite(patchCalendar.factionPendingIgnite[key])) {
              patchCalendar.factionPendingIgnite[key] = from53Week(patchCalendar.factionPendingIgnite[key]);
            }
          }
        }
        if (Array.isArray(G.f02MediationWatches)) {
          patchCalendar.f02MediationWatches = G.f02MediationWatches.map(watch => {
            if (!watch) return watch;
            const next = { ...watch };
            for (const key of ['startWeek', 'deadlineWeek']) {
              if (Number.isFinite(next[key])) next[key] = from53Week(next[key]);
            }
            return next;
          });
        }
        G = { ...G, ...patchCalendar };
      }

      if (!G._migrated_style_aerial_v1) {
        const fixStyle = c => c.style === 'Speed' ? { ...c, style: 'Aerial' } : c;
        G = {
          ...G,
          roster: G.roster.map(fixStyle),
          freeAgents: (G.freeAgents || []).map(fixStyle),
          aiOrgs: Object.fromEntries(Object.entries(G.aiOrgs || {}).map(([k, org]) => [k, { ...org, roster: (org.roster || []).map(fixStyle) }])),
          _migrated_style_aerial_v1: true
        };
      }

      // _everFoughtPairs 復元: トリミングで失われた初顔合わせ判定用ペアをmatchupLogに補完
      if (G._everFoughtPairs && G._everFoughtPairs.length > 0) {
        const existing = new Set((G.matchupLog || []).map(e => {
          const a = Math.min(e.leftId, e.rightId), b = Math.max(e.leftId, e.rightId);
          return `${a}>${b}`;
        }));
        const restored = G._everFoughtPairs
          .filter(p => !existing.has(p))
          .map(p => {
            const [a, b] = p.split('>').map(Number);
            return { leftId: a, rightId: b, showCount: 0 }; // showCount=0: 鮮度窓外
          });
        if (restored.length > 0) {
          G = { ...G, matchupLog: [...restored, ...(G.matchupLog || [])] };
        }
        delete G._everFoughtPairs;
      }

      // stat非整数修正: 練習成長の浮動小数点蓄積を一括修正
      if (!G._migrated_stat_round_v1) {
        const STATS = ['pw', 'sp', 'te', 'st', 'mn'];
        const roundStats = c => {
          let changed = false;
          const nc = { ...c };
          STATS.forEach(s => { if (typeof nc[s] === 'number' && !Number.isInteger(nc[s])) { nc[s] = Math.round(nc[s]); changed = true; } });
          return changed ? nc : c;
        };
        G = {
          ...G,
          roster: G.roster.map(roundStats),
          freeAgents: (G.freeAgents || []).map(roundStats),
          aiOrgs: Object.fromEntries(Object.entries(G.aiOrgs || {}).map(([k, org]) => [k, { ...org, roster: (org.roster || []).map(roundStats) }])),
          _migrated_stat_round_v1: true
        };
      }

      // 団体アイコン: playerOrgIcon 未定義時はデフォルト0
      if (G.playerOrgIcon == null) {
        G = { ...G, playerOrgIcon: 0 };
      }

      // 業界底上げ: 既にクリア済みの旧セーブにフラグ補正 + 新セレモニー再発火
      if (G.endingCleared && !G._migrated_leagueElevation_v2) {
        // leagueElevated済みでも新セレモニー未表示なら再発火させる
        G = { ...G, leagueElevated: true, _pendingLeagueElevation: true, endingShown: true, _migrated_leagueElevation_v2: true };
      }

      // dormantPool枯渇救済: 長期プレイでプールが空になったセーブを回復
      // Legacy dormantPool refill migration retired; bounded recovery is handled elsewhere.
      if (!G._migrated_dormantPool_refill_v1) {
        G = { ...G, _migrated_dormantPool_refill_v1: true };
      }
      // FA即時補充: ロード直後にFAが少ないとスカウト画面がほぼ空のまま最大3週待ちになるため、
      // poolからFAへ即座に追加する（毎ロード時チェック、フラグなし）
      {
        const curFA = G.freeAgents || [];
        const FA_MIN = 3; // この人数未満なら補充
        if (curFA.length < FA_MIN) {
          const faPool = G.dormantPool || [];
          const faOccupied = new Set(curFA.map(c => c.id));
          (G.roster || []).forEach(c => faOccupied.add(c.id));
          Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => faOccupied.add(c.id)));
          const eligible = faPool.filter(e => (e.age || 17) < 21 && !faOccupied.has(e.id));
          const needed = FA_MIN - curFA.length; // 不足分だけ補充
          if (eligible.length > 0 && needed > 0) {
            const faRng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season || 1, G.week || 1, 0xFA01));
            const pick = eligible.slice(0, Math.min(needed, eligible.length));
            const pickIds = new Set(pick.map(e => e.id));
            const newFA = pick.map(e => {
              const template = ALL_CHARS.find(c => c.id === e.id);
              if (!template) return null;
              return Engine.rival.makeAIFighter(template, faRng, null, e.age || 17);
            }).filter(Boolean);
            if (newFA.length > 0) {
              G = { ...G,
                freeAgents: [...curFA, ...newFA],
                dormantPool: faPool.filter(e => !pickIds.has(e.id))
              };
              console.log(`[WM Load] FA即時補充: ${newFA.map(f => f.name).join('、')}`);
            }
          }
        }
      }

      // 成長マイルストーン通知 マイグレーション
      if (!G._migrated_milestoneNotified_v1) {
        if (G._lastMilestoneAbsWeek === undefined) {
          G._lastMilestoneAbsWeek = (G.season - 1) * 48 + G.week;
        }
        const _MS_OVR = [65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115];
        const _MS_POP = [50, 60, 70, 80, 90, 95];
        const _initMN = (c) => {
          if (c._milestonesNotified) return c;
          const ovr = Engine.util.ov(c);
          return { ...c, _milestonesNotified: {
            ovr: _MS_OVR.filter(t => ovr >= t),
            pop: _MS_POP.filter(t => (c.popularity || 0) >= t),
            cap: ['pw', 'sp', 'te', 'st', 'mn'].filter(s => c.trainCap && c[s] >= c.trainCap[s]),
          } };
        };
        G.roster = G.roster.map(_initMN);
        if (G.freeAgents) G.freeAgents = G.freeAgents.map(_initMN);
        if (G.aiOrgs) {
          const ao = {};
          for (const [k, v] of Object.entries(G.aiOrgs)) {
            ao[k] = v.roster ? { ...v, roster: v.roster.map(_initMN) } : v;
          }
          G.aiOrgs = ao;
        }
        G._migrated_milestoneNotified_v1 = true;
      }

      // affinityAxis 後付け (relationship-affinity-spec-v1.0 §3.2)
      if (!G._migrated_affinity_v1) {
        G = Engine.relationships.migrateAffinityAxisV1(G);
      }

      // 旧フォーマットの頂上決戦バックナンバー記事を新リッチ版で再生成
      // （fcfd9f4 「PPV頂上決戦の新聞記事をリッチ化」以前の保存データに残る "相手団体" プレースホルダ等を解消）
      if (!G._migrated_summit_news_v1) {
        const rebuildIssue = (wp) => {
          if (!wp || !wp.topStory) return wp;
          const ts = wp.topStory;
          if (ts.type !== 'ppvSummitResult' || !ts.summitData) return wp;
          const P = (Engine.newspaper && Engine.newspaper.PRIORITY) || null;
          const fixed = _buildPpvSummitStory(ts.summitData, wp.season || 1, wp.week || 1, P);
          return { ...wp, topStory: fixed };
        };
        const archive = Array.isArray(G.newspaperArchive)
          ? G.newspaperArchive.map(rebuildIssue)
          : G.newspaperArchive;
        const weeklyNewspaper = rebuildIssue(G.weeklyNewspaper);
        G = { ...G, newspaperArchive: archive, weeklyNewspaper, _migrated_summit_news_v1: true };
      }

      // growth-rebalance v1.0 migration: strainDebt/seasonIntensiveWeeksを全キャラに付与
      // （旧セーブはundefined→各所で`|| 0`フォールバックするため実害はないが、
      // 明示的に0初期化して他のwear系フィールドと同じマイグレーション規約に揃える）
      if (!G._migrated_strainDebt_v1) {
        const migStrainDebt = (fighters) => (fighters || []).map(c => {
          if (c.strainDebt !== undefined && c.seasonIntensiveWeeks !== undefined) return c;
          return { ...c, strainDebt: c.strainDebt || 0, seasonIntensiveWeeks: c.seasonIntensiveWeeks || 0 };
        });
        G = { ...G, roster: migStrainDebt(G.roster), freeAgents: migStrainDebt(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migStrainDebt(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_strainDebt_v1: true };
      }

      {
        const repair = Engine.saveDoctor.repairOnLoad(G);
        if (repair.changed) {
          G = repair.state;
          const note = `セーブデータ自動修復: ${repair.changes.join(', ')}`;
          G = { ...G, gameLog: [...(G.gameLog || []), note] };
          console.log(`[WM Load Repair] ${note}`);
        }
      }

      // repairOnLoad がロスターからキャラを間引くことがあるため、王座在位者を再検証する
      // （安全弁 v1776 は repair 前に走るため、repair で消えたケースを拾えていなかった）
      {
        const vc = Engine.title.validateChampion(G);
        if (vc.msg) {
          G = { ...G, titles: vc.titles };
          console.log(`[WM Load Repair] ${vc.msg}`);
        }
      }

      return true;
    } catch(e) {
      G = prevG;
      console.error('Load failed:', e);
      return false;
    }
  },

  save(slot) {
    try {
      // 上書きセーブでは、そのスロットに既に設定されているセーブ名を引き継ぐ。
      // G自体は複数スロットで共有される単一の状態なので、G側の名前は使わない。
      let existingName;
      try {
        const oldRaw = localStorage.getItem(SAVE_KEY + slot);
        if (oldRaw) existingName = Storage._parseRaw(oldRaw)._saveName;
      } catch (e) { /* 旧データ破損時は名前なし扱いで続行 */ }
      localStorage.setItem(SAVE_KEY + slot, Storage.serialize(G, existingName));
      G = { ...G, gameLog: [...G.gameLog, `💾 スロット${slot}にセーブしました`] };
      refreshAll();
      return true;
    } catch(e) { alert('セーブに失敗しました: ' + e.message); return false; }
  },

  // ─── スロットのセーブ名だけを変更する（ゲーム進行状態には一切触れない） ───
  renameSave(slot, name) {
    try {
      const raw = localStorage.getItem(SAVE_KEY + slot);
      if (!raw) return false;
      const state = Storage._parseRaw(raw);
      const sanitized = Storage._sanitizeSaveNameLabel(name);
      if (sanitized) state._saveName = sanitized; else delete state._saveName;
      const json = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY + slot, SAVE_COMPRESS_MARKER + LZString.compressToUTF16(json));
      return true;
    } catch(e) { console.error('[WM] セーブ名の変更に失敗:', e.message); return false; }
  },

  load(slot) {
    const data = localStorage.getItem(SAVE_KEY + slot);
    if (!data) { alert('セーブデータがありません'); return false; }
    if (Storage.deserialize(data)) {
      G = { ...G, gameLog: [...G.gameLog, `📂 スロット${slot}からロードしました`] };
      // showPrep / showExec はセッション内でのみ意味を持つ過渡状態。ロード時は manage に戻す。
      if (G.weekPhase === 'showPrep' || G.weekPhase === 'showExec') G = { ...G, weekPhase: 'manage' };
      refreshAll();
      // PPVフェーズの復帰: オーバーレイを再初期化
      App.resumeLoadedSpecialPhase();
      return true;
    }
    alert('セーブデータの読み込みに失敗しました。コンソールを確認してください。');
    return false;
  },

  autoSave() {
    if (window.IS_TRIAL) return; // 体験版: オートセーブ無効（手動1スロットのみ）
    if (G.weekPhase === 'gameover') return; // ゲームオーバー時は上書きしない
    try { localStorage.setItem(AUTOSAVE_KEY, Storage.serialize(G)); } catch(e) { console.warn('[WM] オートセーブ失敗:', e.message); }
  },

  loadAutoSave() {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (data && Storage.deserialize(data)) {
      // showPrep / showExec はセッション内でのみ意味を持つ過渡状態。ロード時は manage に戻す。
      if (G.weekPhase === 'showPrep' || G.weekPhase === 'showExec') G = { ...G, weekPhase: 'manage' };
      refreshAll();
      // PPVフェーズの復帰: オーバーレイを再初期化
      App.resumeLoadedSpecialPhase();
      return true;
    }
    return false;
  },

  getAutoSaveInfo() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const s = Storage._parseRaw(raw);
      return { season: s.season, week: s.week, funds: s.funds, date: s._saveDate };
    } catch { return null; }
  },

  getSaveInfo(slot) {
    try {
      const raw = localStorage.getItem(SAVE_KEY + slot);
      if (!raw) return null;
      const s = Storage._parseRaw(raw);
      return { season: s.season, week: s.week, funds: s.funds, date: s._saveDate, version: s._saveVersion, orgPop: s.orgPop || 0, rosterSize: s.roster ? s.roster.length : 0, name: s._saveName || '' };
    } catch { return null; }
  },

  deleteSave(slot) {
    localStorage.removeItem(SAVE_KEY + slot);
  },

  exportToFile(slotOrAuto) {
    const key = slotOrAuto === 'auto' ? AUTOSAVE_KEY : SAVE_KEY + slotOrAuto;
    const raw = localStorage.getItem(key);
    if (!raw) { alert('セーブデータがありません'); return; }

    const parsed = Storage._parseRaw(raw);
    const datePart = new Date().toISOString().slice(0, 10);
    const seasonPart = `S${parsed.season || 1}W${parsed.week || 1}`;
    const slotLabel = slotOrAuto === 'auto' ? 'auto' : `slot${slotOrAuto}`;
    const namedPart = Storage._sanitizeFilenamePart(parsed._saveName);
    const filename = namedPart
      ? `${namedPart}_${seasonPart}_${datePart}.json`
      : `wm_save_${slotLabel}_${seasonPart}_${datePart}.json`;

    const jsonStr = JSON.stringify(parsed);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target.result;

        try {
          const parsed = JSON.parse(raw);
          if (!parsed.season || !parsed.roster || !parsed.rngSeed) {
            alert('有効なセーブデータではありません');
            return;
          }
        } catch {
          alert('ファイルの読み込みに失敗しました');
          return;
        }

        if (Storage.deserialize(raw)) {
          G = { ...G, gameLog: [...G.gameLog, '📂 ファイルからデータを読み込みました'] };
          // showPrep / showExec はセッション内でのみ意味を持つ過渡状態。ロード時は manage に戻す。
      if (G.weekPhase === 'showPrep' || G.weekPhase === 'showExec') G = { ...G, weekPhase: 'manage' };
          refreshAll();
          App.resumeLoadedSpecialPhase();
          if (App._refreshTicker) App._refreshTicker();
          Audio.bgm.playForState();
          Audio.play('save');
        } else {
          alert('データの読み込みに失敗しました。ファイルが破損している可能性があります。');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};

// Alias for backward compat in UI
function saveGame(slot) { Audio.play('save'); return Storage.save(slot); }
function loadGame(slot) {
  Audio.play('select');
  const r = Storage.load(slot);
  if (r && App._refreshTicker) App._refreshTicker();
  Audio.bgm.playForState();
  // 業界底上げセレモニー: ロード直後に未表示なら即表示
  if (r && G._pendingLeagueElevation) {
    refreshAll();
    setTimeout(() => {
      const { _pendingLeagueElevation: _, ...cleanG } = G;
      G = cleanG;
      showLeagueElevationCeremony(G, () => { Storage.autoSave(); refreshAll(); });
    }, 500);
  }
  return r;
}
function deleteSave(slot) { Audio.play('click'); Storage.deleteSave(slot); refreshAll(); }
function renameSaveSlot(slot, name) {
  const ok = Storage.renameSave(slot, name);
  if (ok) { Audio.play('save'); renderSave(); }
  return ok;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 8: APP BRIDGE (v0.85)                            ║
// ║  UI ↔ Engine bridge layer                                 ║
// ╚══════════════════════════════════════════════════════════╝

// Global game state — the single source of truth
let G = Engine.createInitialState();

// Running RNG state for the current session
let sessionRng = Engine.rng.create(G.rngSeed);

// ── Legacy utility aliases (for UI code backward compat) ──
function ov(c) { return Engine.util.ov(c); }
function getSalary(c) { return Engine.util.getSalary(c, G.titles); }
function isShowWeek(w) { return Engine.util.isShowWeek(w); }
function isRegularShowWeek(w) { return Engine.util.isRegularShowWeek(w); }
function getQuarter(w) { return Engine.util.getQuarter(w); }
function isSpecialShow(w) { return Engine.util.isSpecialShow(w); }
function isPPV(w) { return Engine.util.isPPV(w); }
function getHeatLevel() { return Engine.heat.getLevel(G); }
function getWorldChampion() { return Engine.title.getWorldChampion(G); }
function getHiredCoaches() { return Engine.coach.getHiredCoaches(G); }
function getCharCoach(charId) { return Engine.coach.getCharCoach(G, charId); }
function getPotentialPct(c) { return Engine.util.getPotentialPct(c); }
function getPotentialLabel(c) { return Engine.util.getPotentialLabel(c); }
function getRivalryLevel(id1, id2) { return Engine.title.getRivalryLevel(G, id1, id2); }

function archiveRetiredRivalryState(state, fighter) {
  if (!state || !fighter || fighter.id == null) return state;

  const relationships = { ...(state.relationships || {}) };
  const rivalries = { ...(state.rivalries || {}) };
  const historyStore = Engine.relationships.normalizeHistoryStore(state.relationshipHistory);
  const history = [...historyStore.retiredRivalries];
  const fighterId = fighter.id;
  const fighterMap = new Map();
  const register = candidate => {
    if (candidate && candidate.id != null) fighterMap.set(candidate.id, candidate);
  };

  (state.roster || []).forEach(register);
  (state.retiredFighters || []).forEach(register);
  (state.freeAgents || []).forEach(register);
  Object.values(state.aiOrgs || {}).forEach(org => (org.roster || []).forEach(register));
  register(fighter);

  const pairKeys = new Set();
  Object.keys(relationships).forEach(key => {
    const sepIdx = key.indexOf('>');
    const idA = Number(key.substring(0, sepIdx));
    const idB = Number(key.substring(sepIdx + 1));
    if (idA !== fighterId && idB !== fighterId) return;
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
      pairKeys.add(Engine.title.getRivalryKey(idA, idB));
    }
    delete relationships[key];
  });

  Object.keys(rivalries).forEach(pairKey => {
    const ids = pairKey.split('-').map(Number);
    const id1 = ids[0];
    const id2 = ids[1];
    if (id1 !== fighterId && id2 !== fighterId) return;
    pairKeys.add(pairKey);
  });

  pairKeys.forEach(pairKey => {
    const ids = pairKey.split('-').map(Number);
    const id1 = ids[0];
    const id2 = ids[1];
    if (!Number.isFinite(id1) || !Number.isFinite(id2) || id1 === id2) return;

    const rel12 = (state.relationships || {})[String(id1) + '>' + String(id2)] || null;
    const rel21 = (state.relationships || {})[String(id2) + '>' + String(id1)] || null;
    const rivalryEntry = (state.rivalries || {})[pairKey] || null;
    if (!rel12 && !rel21 && !rivalryEntry) return;

    const fighter1 = fighterMap.get(id1) || null;
    const fighter2 = fighterMap.get(id2) || null;
    const archiveEntry = {
      id1,
      id2,
      reason: 'retirement',
      retiredFighterId: fighterId,
      season: state.season || 1,
      week: state.week || 1,
      age1: fighter1?.age ?? null,
      age2: fighter2?.age ?? null,
      bond12: rel12?.bond ?? 50,
      bond21: rel21?.bond ?? 50,
      rivalry12: rel12?.rivalry ?? 0,
      rivalry21: rel21?.rivalry ?? 0,
      rivalryMeta: rivalryEntry ? { ...rivalryEntry } : null,
    };

    const existingIdx = history.findIndex(entry =>
      entry &&
      entry.reason === 'retirement' &&
      entry.retiredFighterId === fighterId &&
      ((entry.id1 === id1 && entry.id2 === id2) || (entry.id1 === id2 && entry.id2 === id1))
    );
    if (existingIdx >= 0) history[existingIdx] = archiveEntry;
    else history.push(archiveEntry);

    delete rivalries[pairKey];
  });

  return {
    ...state,
    relationships,
    rivalries,
    relationshipHistory: { ...historyStore, retiredRivalries: history },
  };
}
// ── App Commands (G mutation ONLY via G = newState) ──
let _pendingOrgName = '';
let _pendingOrgIcon = 0;
let _selectedDifficulty = 'normal';
const App = {
  resumeLoadedSpecialPhase() {
    // A completed Tenchosen save can still carry Week48's ppvShow phase.
    // Resume the tournament before considering the ordinary GRAND FINAL flow.
    if (App._shouldStartTenchosenReplay?.()) {
      App.initTenchosenReplay();
      return true;
    }
    if (G.weekPhase === 'ppvShow') {
      App.initPPVShow();
      return true;
    }
    if (G.weekPhase === 'ppvTV') {
      App.initPPVTV();
      return true;
    }
    if (G.weekPhase === 'juniorTournament') {
      (App.resumeJuniorTournament || App.initJuniorTournament)();
      return true;
    }
    if (App.canEnterJuniorTournamentThisWeek()) {
      return App.enterJuniorTournamentFromWeek();
    }
    // S8 春のタッグリーグ: 結果確定済みでリプレイ未表示のまま保存/リロードされた場合、再開する
    if (G._pendingSpringTagLeagueReplay && App._shouldStartSpringTagLeagueReplay()) {
      App.initSpringTagLeagueReplay();
      return true;
    }
    App._discardStaleSpringTagLeagueReplay();
    if (G._pendingAutumnWarReplay) {
      App.initAutumnWarReplay();
      return true;
    }
    return false;
  },

  canEnterJuniorTournamentThisWeek() {
    return !!(
      G
      && !G.offSeason
      && G.weekPhase === 'manage'
      && G.week === Engine.juniorTournament.WEEK
      && !G._juniorTournamentResult
    );
  },

  _shouldStartSpringTagLeagueReplay() {
    return !!(G && G._pendingSpringTagLeagueReplay
      && Engine.springTagLeague && Engine.springTagLeague.isReplayReady
      && Engine.springTagLeague.isReplayReady(G));
  },

  _discardStaleSpringTagLeagueReplay() {
    if (!G || !G._pendingSpringTagLeagueReplay || App._shouldStartSpringTagLeagueReplay()) return false;
    const { _pendingSpringTagLeagueReplay: _, ...cleanG } = G;
    G = cleanG;
    App._stlPreview = null;
    wmDiag('[WM SpringTag] discarded stale replay outside its scheduled event week');
    try { Storage.autoSave(); } catch (_e) {}
    return true;
  },

  enterJuniorTournamentFromWeek(options = null) {
    if (!App.canEnterJuniorTournamentThisWeek()) {
      Audio.play('error');
      return false;
    }
    const selection = G._juniorTournamentSelection || Engine.juniorTournament.select(G);
    if (!selection || selection.cancelled) {
      App.cancelJuniorTournamentForInsufficientParticipants();
      if (typeof showToast === 'function') showToast('ジュニアトーナメントは出場条件を満たす選手が足りないため開催されませんでした。');
      if (options && options.processWeekOnCancel && typeof App.processWeek === 'function') {
        App.processWeek();
        return true;
      }
      return false;
    }
    G = { ...G, _juniorTournamentSelection: selection, weekPhase: 'juniorTournament' };
    try { Storage.autoSave(); } catch (_e) {}
    App.initJuniorTournament();
    return true;
  },

  // 今週タブなどへ一度移動しても、進行中の大会を初期化し直さずに戻す。
  // 大会の勝敗は _jtPreview.result の事前計算値が正史なので、観戦中だけは
  // iframe を再開せず対戦表へ戻す。これで途中の phase を manage に偽装しない。
  resumeJuniorTournament() {
    if (!G || G.weekPhase !== 'juniorTournament') return false;
    // 旧バージョンでは apply 後の感想チェーン中も juniorTournament のままだった。
    // そのセーブを読み直した場合は再計算せず、確定済みの結果を保ったまま完了させる。
    if (G._juniorTournamentResult && !G._juniorTournamentResult.cancelled) {
      return App.recoverWeekPhase();
    }
    const selection = G._juniorTournamentSelection;
    if (!selection || selection.cancelled || !Array.isArray(selection.participants) || selection.participants.length < 4) {
      App.cancelJuniorTournamentForInsufficientParticipants();
      return false;
    }

    const jt = App._jtPreview;
    if (!jt || jt.selection !== selection || !jt.result) {
      App.initJuniorTournament();
      return true;
    }

    if (jt.phase === 'watching') {
      // タブ移動時にbattle iframeは閉じられるため、同じ試合を安全に選び直せる対戦表へ戻す。
      jt.phase = 'bracket';
      jt.bgmTrack = _jtBoardTrack(jt);
    }
    if (jt.phase === 'summon') renderJuniorTournamentSummon();
    else if (jt.phase === 'matchResult') renderJuniorTournamentMatchResult(jt.currentRound, jt.currentMatch);
    else if (jt.phase === 'finalResult') renderJuniorTournamentResult();
    else renderJuniorTournamentBracket();
    return true;
  },

  cancelJuniorTournamentForInsufficientParticipants() {
    if (!G) return;
    const next = {
      ...G,
      weekPhase: 'manage',
      _juniorTournamentResult: {
        cancelled: true,
        reason: 'insufficientParticipants',
        season: G.season,
        week: G.week,
      },
    };
    delete next._juniorTournamentSelection;
    G = next;
    App._jtPreview = null;
    try { Audio.fileBgm.stop(); } catch (_e) {}
    try { Storage.autoSave(); } catch (_e) {}
    if (typeof showScreen === 'function') showScreen('week');
    if (typeof renderWeekScreen === 'function') renderWeekScreen();
    if (typeof refreshAll === 'function') refreshAll();
  },

  // 汎用の進行復旧口。ジュニア中は manage への強制変更ではなく、
  // 未確定なら大会へ戻し、既に反映済みなら結果を保ったまま完了状態へ着地させる。
  recoverWeekPhase() {
    if (!G) return false;
    if (G.weekPhase === 'juniorTournament') {
      if (!(G._juniorTournamentResult && !G._juniorTournamentResult.cancelled)) {
        return App.resumeJuniorTournament();
      }
      const clean = { ...G, weekPhase: 'manage' };
      delete clean._juniorTournamentSelection;
      G = clean;
      App._jtPreview = null;
    } else {
      G = {
        ...G,
        weekPhase: 'manage',
        lastShowResults: G.lastShowResults || [],
        weeklyFinance: G.weeklyFinance || { income: 0, expense: 0, details: [] },
      };
    }
    try { Storage.autoSave(); } catch (_e) {}
    if (typeof showScreen === 'function') showScreen('week');
    if (typeof refreshAll === 'function') refreshAll();
    return true;
  },

  // ═══ 秋 4団体勝ち残り対抗戦 (autumn-gauntlet-war-spec-v0.1) ═══
  // Week36専用Stage: 導入 → 編成 → 進行 → 決勝采配 → 結果 → MVP

  awBeginEntry() {
    if (!G.autumnWar || G.autumnWar.cancelled || G.autumnWar.session) return;
    const members = Engine.autumnWar._selectMembers(G, 'player');
    if (members.length !== Engine.autumnWar.TEAM_SIZE) {
      G = Engine.autumnWar.startSession(G);
      App.initAutumnWarReplay();
      return;
    }
    App._awEntrySelection = Engine.autumnWar._defaultOrder(G, 'player', members);
    App._awEntryActiveRole = 0;
    if (!App._awPreview) App._awPreview = {};
    App._awPreview.phase = 'entry';
    G = { ...G, autumnWarPhase: 'entry' };
    Audio.play('select');
    renderAutumnWarEntry();
  },

  awSelectEntryRole(index) {
    if (!Array.isArray(App._awEntrySelection) || index < 0 || index >= Engine.autumnWar.TEAM_SIZE) return;
    App._awEntryActiveRole = index;
    Audio.play('click');
    renderAutumnWarEntry();
  },

  awPickFighter(id) {
    const order = App._awEntrySelection;
    if (!Array.isArray(order)) return;
    const role = Math.max(0, Math.min(Engine.autumnWar.TEAM_SIZE - 1, App._awEntryActiveRole || 0));
    const idx = order.indexOf(id);
    if (idx >= 0) {
      if (idx !== role) [order[role], order[idx]] = [order[idx], order[role]];
      App._awEntryActiveRole = role;
    }
    else {
      if (order.length < Engine.autumnWar.TEAM_SIZE) order.push(id);
      else order[role] = id;
    }
    Audio.play('click');
    renderAutumnWarEntry();
  },

  awMoveEntry(index, delta) {
    const order = App._awEntrySelection;
    const next = index + delta;
    if (!Array.isArray(order) || index < 0 || next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    App._awEntryActiveRole = next;
    Audio.play('click');
    renderAutumnWarEntry();
  },

  awAutoEntry() {
    const memberIds = Engine.autumnWar._selectMembers(G, 'player');
    App._awEntrySelection = Engine.autumnWar._defaultOrder(G, 'player', memberIds);
    App._awEntryActiveRole = 0;
    Audio.play('select');
    renderAutumnWarEntry();
  },

  awConfirmEntry() {
    const order = App._awEntrySelection;
    if (!Array.isArray(order) || order.length !== Engine.autumnWar.TEAM_SIZE) return;
    // バスに乗せる顔は、GがEngineで作り替わる前に取っておく
    const party = order.map(id => (G.roster || []).find(f => f && f.id === id)).filter(Boolean);
    G = Engine.autumnWar.confirmPlayerTeam(G, [...order], [...order]);
    G = Engine.autumnWar.startSession(G);
    App._awEntrySelection = null;
    App._awEntryActiveRole = null;
    Audio.play('select');
    try { Storage.autoSave(); } catch (_e) {}
    // 代表を決めたら、会場入りのカットから専用の大会本編へ直接進む。
    // 左右に全身画像を並べる全カード紹介は年度末PPVだけの演出。
    const toBoard = () => App.initAutumnWarReplay();
    if (typeof showSpecialEventTravel === 'function') {
      showSpecialEventTravel('autumnWar', G, party, toBoard);
    } else {
      toBoard();
    }
  },

  // 週36 大会ライブ進行（Stage / P7）
  initAutumnWarReplay() {
    // 逐次化前の短期間に保存された事前生成previewは破棄し、未決着なら大会冒頭から再開する。
    if (!G.autumnWar?.session && G.autumnWar?.previewResult && !G.autumnWar?.champion) {
      const { previewResult: _legacyPreview, ...cleanWar } = G.autumnWar;
      G = Engine.autumnWar.startSession({ ...G, autumnWar: cleanWar });
    }
    if (!G.autumnWar || G.autumnWar.cancelled) {
      App._awPreview = null;
      const { _pendingAutumnWarReplay: _pending, ...cleanG } = G;
      G = cleanG;
      try { Storage.autoSave(); } catch (_e) {}
      if (typeof showScreen === 'function') showScreen('week');
      if (typeof refreshAll === 'function') refreshAll();
      return;
    }
    if (!G.autumnWar.session && !G.autumnWar.champion) {
      App._awPreview = { phase: 'intro', committed: false };
      try { Audio.bgm.playStage('autumnA'); } catch (_e) {}
      Audio.play('notify');
      // 秋大会も他の特別興行と同じく、既存モーダルの
      // **コーチ1人 → 選手1人 → 代表編成**で始める。
      // 旧「今週は4団体勝ち残り対抗戦」全画面は廃止済みなので挟まない。
      const openEntry = () => App.awBeginEntry();
      if (typeof showSpecialEventIntro === 'function') {
        showSpecialEventIntro('autumnWar', G, openEntry);
      } else {
        openEntry();
      }
      return;
    }
    const result = Engine.autumnWar.getProgress(G) || (G.autumnWar?.champion ? G.autumnWar : null);
    if (!result || result.cancelled || !Array.isArray(result.results) || result.results.length === 0) return;
    const livePhase = G.autumnWar?.session?.phase;
    const activeIndex = Math.max(0, result.results.length - 1);
    const activeMatch = result.results[activeIndex];
    App._awPreview = {
      result,
      matchIndex: activeIndex,
      boutIndex: activeMatch?.bouts?.length || 0,
      phase: livePhase === 'finalOrder' ? 'reorder' : (livePhase === 'complete' || (!livePhase && G.autumnWar?.champion)) ? 'result' : 'board',
      // **セーブに残る印を見る。** G.autumnWar.champion はどこからも書かれておらず
      // 常に undefined だったため、この値は必ず false になっていた。結果、結果画面の
      // まま開き直すと精算がもう一度走った(2026-07-31 監査で検出)。
      committed: !!G.autumnWar?.applied,
      finalOrder: livePhase === 'finalOrder' ? Engine.autumnWar.suggestFinalOrder(G, 'player') : null,
    };
    App._awFinalActiveRole = App._awPreview.phase === 'reorder' ? 0 : null;
    try { Audio.bgm.playStage(_awStageTrack(App._awPreview)); } catch (_e) {}
    Audio.play('notify');
    if (App._awPreview.phase === 'reorder') renderAutumnWarReorder();
    else if (App._awPreview.phase === 'result') {
      renderAutumnWarResult();
      App._playAutumnWarChampionFanfare();
    }
    else renderAutumnWarBoard();
  },

  awRevealBout() {
    const p = App._awPreview;
    const match = p?.result?.results?.[p.matchIndex];
    if (!p || !match || match.winnerOrg || p.phase !== 'board') return;
    if (p.boutIndex < match.bouts.length) return;
    const stepped = Engine.autumnWar.simulateNextBout(G);
    if (!stepped.bout) return;
    const resolved = App._awConsumeBoutStep(stepped);
    if (!resolved) return;
    Audio.play('click');
    renderAutumnWarBoard();
    renderAutumnWarBoutResultPopup(resolved.match, resolved.bout);
  },

  awSkipTeamMatch() {
    const p = App._awPreview;
    const match = p?.result?.results?.[p.matchIndex];
    if (!p || !match || match.winnerOrg || p.phase !== 'board') return;
    showConfirm(
      'この団体戦の残り全試合を自動進行し、団体戦の決着画面へ移ります。',
      'まとめてスキップ',
      () => App._awSkipTeamMatchConfirmed()
    );
  },

  _awSkipTeamMatchConfirmed() {
    const p = App._awPreview;
    const match = p?.result?.results?.[p.matchIndex];
    if (!p || !match || match.winnerOrg || p.phase !== 'board') return;
    const maxSteps = Engine.autumnWar.TEAM_SIZE * 2 - 1;
    let steps = 0;
    while (steps < maxSteps) {
      const stepped = Engine.autumnWar.simulateNextBout(G);
      if (!stepped.bout) break;
      G = stepped.state;
      steps += 1;
      if (stepped.matchCompleted) break;
    }
    p.result = Engine.autumnWar.getProgress(G);
    const resolvedMatch = p.result?.results?.[p.matchIndex];
    p.boutIndex = resolvedMatch?.bouts?.length || 0;
    if (!resolvedMatch?.winnerOrg) {
      Audio.play('error');
      return;
    }
    try { Storage.autoSave(); } catch (_e) {}
    Audio.play('click');
    renderAutumnWarBoard();
  },

  _awConsumeBoutStep(stepped) {
    const p = App._awPreview;
    if (!p || !stepped?.bout) return null;
    G = stepped.state;
    p.result = Engine.autumnWar.getProgress(G);
    const revealedMatch = p.result?.results?.[p.matchIndex];
    p.boutIndex = revealedMatch?.bouts?.length || 0;
    try { Storage.autoSave(); } catch (_e) {}
    return {
      match: revealedMatch,
      bout: revealedMatch?.bouts?.[revealedMatch.bouts.length - 1] || stepped.bout,
    };
  },

  awWatchBout() {
    const p = App._awPreview;
    const match = p?.result?.results?.[p.matchIndex];
    if (!p || !match || match.winnerOrg || p.phase !== 'board' || p.watchResolved) return;
    if (p.boutIndex < match.bouts.length) return;
    const stepped = Engine.autumnWar.simulateNextBout(G, { recordFrames: true });
    const replay = stepped.replay;
    if (!stepped.bout || !replay?.result || !Array.isArray(replay.result.frames) || replay.result.frames.length === 0) {
      Audio.play('error');
      return;
    }
    const resolved = App._awConsumeBoutStep(stepped);
    if (!resolved) return;
    const displayReplay = replay;
    const battleOverlay = document.getElementById('battleOverlay');
    const iframe = document.getElementById('battleIframe');
    if (!battleOverlay || !iframe) {
      renderAutumnWarBoard();
      renderAutumnWarBoutResultPopup(resolved.match, resolved.bout);
      return;
    }
    p.phase = 'watching';
    p.watchResolved = { matchIndex: p.matchIndex, boutIndex: p.boutIndex - 1, bout: resolved.bout };
    document.getElementById('autumnWarOverlay')?.classList.add('is-suspended');
    battleOverlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => {
      if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; }
    }, 8000);
    const profile = fighter => ({
      ...fighter,
      portraitUrl: getPortraitUrl(fighter.id),
      profile: CHAR_PROFILES[fighter.id] || '',
      vl: fighter.voiceLines || fighter.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[fighter.id]) || ['…！'],
    });
    const roundLabel = match.round === 'final' ? '決勝' : '準決勝';
    const msg = {
      type: 'START_MATCH',
      left: profile(displayReplay.left),
      right: profile(displayReplay.right),
      result: displayReplay.result,
      matchInfo: {
        header: `⚔️ 4団体勝ち残り対抗戦 ${roundLabel}`,
        subHeader: `第${resolved.bout.index}フォール・勝者はリングに残る`,
        matchNum: resolved.bout.index,
        totalMatches: 5,
        matchTier: Engine.autumnWar.MATCH_TIER,
        leftPersonality: displayReplay.left.personality || 'normal',
        leftArchetype: displayReplay.left.archetype || 'standard',
        rightPersonality: displayReplay.right.personality || 'normal',
        rightArchetype: displayReplay.right.archetype || 'standard',
        preserveParentFileBgm: true,
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
      },
    };
    let sent = false;
    const sendOnce = () => {
      if (sent) return;
      sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  _finishAutumnWarWatch() {
    const p = App._awPreview;
    if (!p || p.phase !== 'watching' || !p.watchResolved) return false;
    const resolved = p.watchResolved;
    delete p.watchResolved;
    p.phase = 'board';
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    const battleOverlay = document.getElementById('battleOverlay');
    if (battleOverlay) battleOverlay.style.display = 'none';
    document.getElementById('autumnWarOverlay')?.classList.remove('is-suspended');
    renderAutumnWarBoard();
    const match = p.result?.results?.[resolved.matchIndex];
    renderAutumnWarBoutResultPopup(match, match?.bouts?.[resolved.boutIndex] || resolved.bout);
    return true;
  },

  awAdvanceMatch() {
    const p = App._awPreview;
    if (!p) return;
    const matches = p.result.results || [];
    const current = matches[p.matchIndex];
    if (!current || !current.winnerOrg || p.boutIndex < current.bouts.length) return;
    const livePhase = G.autumnWar?.session?.phase;
    if (livePhase === 'finalOrder') {
      p.result = Engine.autumnWar.getProgress(G);
      p.finalOrder = Engine.autumnWar.suggestFinalOrder(G, 'player');
      App._awFinalActiveRole = 0;
      p.phase = 'reorder';
      Audio.play('notify');
      renderAutumnWarReorder();
      return;
    }
    if (livePhase === 'complete') {
      p.phase = 'result';
      renderAutumnWarResult();
      App._playAutumnWarChampionFanfare();
      return;
    }
    p.result = Engine.autumnWar.getProgress(G);
    const nextIndex = p.matchIndex + 1;
    const next = p.result?.results?.[nextIndex];
    if (!next) return;
    p.matchIndex = nextIndex;
    p.boutIndex = next.bouts?.length || 0;
    p.phase = 'board';
    renderAutumnWarBoard();
  },

  awMoveFinal(index, delta) {
    const p = App._awPreview;
    const order = p?.finalOrder;
    const next = index + delta;
    if (!Array.isArray(order) || index < 0 || next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    App._awFinalActiveRole = next;
    Audio.play('click');
    renderAutumnWarReorder();
  },

  awSelectFinalRole(index) {
    const order = App._awPreview?.finalOrder;
    if (!Array.isArray(order) || index < 0 || index >= Engine.autumnWar.TEAM_SIZE) return;
    App._awFinalActiveRole = index;
    Audio.play('click');
    renderAutumnWarReorder();
  },

  awPickFinalFighter(id) {
    const order = App._awPreview?.finalOrder;
    if (!Array.isArray(order)) return;
    const fighterIndex = order.indexOf(id);
    const role = Math.max(0, Math.min(Engine.autumnWar.TEAM_SIZE - 1, App._awFinalActiveRole || 0));
    if (fighterIndex < 0 || fighterIndex === role) {
      App._awFinalActiveRole = fighterIndex >= 0 ? fighterIndex : role;
    } else {
      [order[role], order[fighterIndex]] = [order[fighterIndex], order[role]];
    }
    Audio.play('click');
    renderAutumnWarReorder();
  },

  awAutoFinalOrder() {
    const p = App._awPreview;
    if (!p) return;
    p.finalOrder = Engine.autumnWar.suggestFinalOrder(G, 'player');
    App._awFinalActiveRole = 0;
    Audio.play('select');
    renderAutumnWarReorder();
  },

  awConfirmFinalOrder() {
    const p = App._awPreview;
    if (!p || !Array.isArray(p.finalOrder) || p.finalOrder.length !== Engine.autumnWar.TEAM_SIZE) return;
    G = Engine.autumnWar.reorderForFinal(G, p.finalOrder);
    p.result = Engine.autumnWar.getProgress(G);
    const finalIndex = p.result.results.findIndex(m => m.round === 'final');
    p.matchIndex = finalIndex >= 0 ? finalIndex : p.result.results.length - 1;
    p.boutIndex = 0;
    p.phase = 'board';
    App._awFinalActiveRole = null;
    Audio.play('click');
    try { Storage.autoSave(); } catch (_e) {}
    renderAutumnWarBoard();
  },

  _awCommitResult() {
    const p = App._awPreview;
    if (!p || p.committed) return;
    // 一時オブジェクトの印はリロードで消えるので、GameState 側も必ず見る。
    if (G.autumnWar?.applied) { p.committed = true; return; }
    const canonical = Engine.autumnWar.getProgress(G);
    if (!canonical || canonical.livePhase !== 'complete') return;
    const applied = Engine.autumnWar.apply(G, canonical);
    G = {
      ...applied.state,
      _pendingAutumnWarReplay: true,
      gameLog: [...(G.gameLog || []), ...(applied.events || [])],
    };
    // apply()で確定した大会収益分配も、結果画面へそのまま渡す。
    p.result = applied.state.autumnWar;
    p.committed = true;
    try { Storage.autoSave(); } catch (_e) {}
  },

  _playAutumnWarChampionFanfare() {
    const p = App._awPreview;
    if (!p || p._championFanfareStarted) return;
    p._championFanfareStarted = true;
    clearTimeout(App._awChampionFanfareTimer);
    try { Audio.fileBgm.fadeOut(500); } catch (_e) {}
    App._awChampionFanfareTimer = setTimeout(() => {
      App._awChampionFanfareTimer = null;
      if (!App._awPreview || App._awPreview.phase !== 'result') return;
      try { Audio.fileBgm.stop(); } catch (_e) {}
      try { Audio.bgm.playJingle('championship'); } catch (_e) {}
    }, 550);
  },

  awShowMvpScene() {
    const p = App._awPreview;
    if (!p) return;
    if (!p.committed) App._awCommitResult();
    clearTimeout(App._awChampionFanfareTimer);
    App._awChampionFanfareTimer = null;
    p.phase = 'mvp';
    try { Audio.fileBgm.fadeOut(400); } catch (_e) {}
    setTimeout(() => {
      try { Audio.fileBgm.stop(); } catch (_e) {}
      try { Audio.bgm.stop(); } catch (_e) {}
      try { Audio.play('matchVictoryFanfare'); } catch (_e) {}
    }, 450);
    renderAutumnWarMvpScene();
  },

  finalizeAutumnWarReplay() {
    // task-73: 経営画面へ戻る直前にコーチが1枚だけ締める。
    // _awPreview.result は下で捨てる前の正(セッション終了時点の集計)なのでここで渡す
    if (App._tcwGate('autumnWar', { result: (App._awPreview && App._awPreview.result) || G.autumnWar },
        () => App.finalizeAutumnWarReplay())) return;
    clearTimeout(App._awChampionFanfareTimer);
    App._awChampionFanfareTimer = null;
    const { _pendingAutumnWarReplay: _pending, ...cleanG } = G;
    const { session: _session, previewResult: _legacyPreview, ...cleanWar } = cleanG.autumnWar || {};
    G = { ...cleanG, autumnWar: cleanWar, autumnWarPhase: 'result' };
    App._awPreview = null;
    const overlay = document.getElementById('autumnWarOverlay');
    if (overlay) {
      overlay.classList.remove('active', 'is-suspended');
      overlay.removeAttribute('data-phase');
    }
    const screen = document.getElementById('autumnWarScreen');
    if (screen) screen.innerHTML = '';
    try { Audio.fileBgm.stop(); } catch (_e) {}
    try { App.restoreBgmForState(); } catch (_e) {}
    try { Storage.autoSave(); } catch (_e) {}
    if (typeof showScreen === 'function') showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const firstNav = document.querySelectorAll('.nav-btn')[0];
    if (firstNav) firstNav.classList.add('active');
    if (typeof refreshAll === 'function') refreshAll();
  },

  // ═══ S8 春のタッグリーグ (spring-tag-league-spec-v0.1 UI実装 / P2a) ═══
  // spec: docs/ui/03-screens/spring-tag-league.md
  // A. 週11 編成モーダル（Office/Cream, mdl-a-* を流用）

  stlOpenEntryModal() {
    if (!G.springTagLeague || G.springTagLeague.cancelled) return;
    const myTeams = (G.springTagLeague.teams || []).filter(t => t.orgId === 'player')
      .sort((a, b) => (a.slot || 1) - (b.slot || 1));
    App._stlEntrySelection = {
      activeSlot: Math.max(0, myTeams.findIndex(team => !team.confirmed)),
      pairs: myTeams.map(team => ({
        f1Id: team && team.confirmed ? team.f1Id : null,
        f2Id: team && team.confirmed ? team.f2Id : null,
      })),
    };
    if (App._stlEntrySelection.activeSlot < 0) App._stlEntrySelection.activeSlot = 0;
    Audio.play('select');
    // 編成に入る前に導入シーン(コーチ→選手)。出せないときはそのまま編成へ
    const openEntry = () => _mdlAOpen(_stlEntryModalHtml());
    if (typeof showSpecialEventIntro === 'function' && App._stlIntroSeason !== G.season) {
      App._stlIntroSeason = G.season;
      showSpecialEventIntro('springTagLeague', G, openEntry);
    } else {
      openEntry();
    }
  },

  stlPickFighter(id) {
    const sel = App._stlEntrySelection;
    if (!sel) return;
    const pair = sel.pairs[sel.activeSlot] || (sel.pairs[sel.activeSlot] = { f1Id: null, f2Id: null });
    const usedElsewhere = sel.pairs.some((row, index) => index !== sel.activeSlot
      && row && (row.f1Id === id || row.f2Id === id));
    if (usedElsewhere) { Audio.play('error'); return; }
    if (pair.f1Id === id) { pair.f1Id = null; }
    else if (pair.f2Id === id) { pair.f2Id = null; }
    else if (pair.f1Id == null) { pair.f1Id = id; }
    else if (pair.f2Id == null) { pair.f2Id = id; }
    else { return; } // 既に2名選択済み — 先に外してから選び直す
    Audio.play('click');
    const card = document.getElementById('mdlACard');
    if (card) card.innerHTML = _stlEntryModalHtml();
  },

  stlPickSuggestion(f1Id, f2Id) {
    const sel = App._stlEntrySelection;
    if (!sel) return;
    sel.pairs[sel.activeSlot] = { f1Id, f2Id };
    Audio.play('select');
    const card = document.getElementById('mdlACard');
    if (card) card.innerHTML = _stlEntryModalHtml();
  },

  stlSelectEntrySlot(slotIndex) {
    const sel = App._stlEntrySelection;
    if (!sel || !Array.isArray(sel.pairs) || !sel.pairs[slotIndex]) return;
    sel.activeSlot = slotIndex;
    Audio.play('click');
    const card = document.getElementById('mdlACard');
    if (card) card.innerHTML = _stlEntryModalHtml();
  },

  stlConfirmTeam() {
    const sel = App._stlEntrySelection;
    if (!sel || !Array.isArray(sel.pairs)) return;
    const hasHalfPair = sel.pairs.some(pair => !!pair && ((pair.f1Id == null) !== (pair.f2Id == null)));
    if (hasHalfPair || !sel.pairs.some(pair => pair && pair.f1Id != null && pair.f2Id != null)) return;
    const confirmPlayerTeams = Engine.springTagLeague.confirmPlayerTeams || ((current, pairs) => pairs.reduce(
      (next, pair, index) => pair && pair.f1Id != null && pair.f2Id != null
        ? Engine.springTagLeague.confirmPlayerTeam(next, pair.f1Id, pair.f2Id, index) : next,
      current
    ));
    G = confirmPlayerTeams(G, sel.pairs);
    const playerTeams = (G.springTagLeague.teams || []).filter(team => team.orgId === 'player');
    const confirmedCount = playerTeams.filter(team => team.confirmed).length;
    App._stlEntrySelection = null;
    _mdlAClose();
    Audio.play('select');
    try { Storage.autoSave(); } catch (_e) {}
    if (typeof showToast === 'function') showToast(`🌸 春のタッグリーグ ${confirmedCount}/${playerTeams.length}チームを編成しました`);
    if (typeof renderWeekScreen === 'function') renderWeekScreen();
    if (typeof refreshAll === 'function') refreshAll();
  },

  stlCloseEntryModal() {
    App._stlEntrySelection = null;
    _mdlAClose();
  },

  // B. 週12 リーグ興行画面（Stage/P7, showResultOverlayを共用）。
  // 結果はEngine.advanceWeek内(springTagLeague.run/apply)で確定済み。UIは順に再生するのみ。
  initSpringTagLeagueReplay() {
    const stl = G.springTagLeague;
    const clearFlag = () => {
      if (G._pendingSpringTagLeagueReplay) {
        const { _pendingSpringTagLeagueReplay: _, ...cleanG } = G;
        G = cleanG;
      }
    };
    if (!App._shouldStartSpringTagLeagueReplay()) {
      // 開催週を越えた予約や欠員チームの予約は再生しない。結果履歴は保持する。
      App._discardStaleSpringTagLeagueReplay();
      App._stlPreview = null;
      if (typeof showScreen === 'function') showScreen('week');
      if (typeof refreshAll === 'function') refreshAll();
      return;
    }
    if (!stl || stl.cancelled || !Array.isArray(stl.matches) || stl.matches.length === 0 || !stl.champion) {
      // 不開催 or 異常系: 専用画面なしで静かにスキップ（ニュース・ログのみ）
      clearFlag();
      App._stlPreview = null;
      try { Storage.autoSave(); } catch (_e) {}
      if (typeof showScreen === 'function') showScreen('week');
      if (typeof refreshAll === 'function') refreshAll();
      return;
    }
    App._stlAdvanceBusy = false;
    clearTimeout(App._stlAdvanceTimer);
    clearTimeout(App._stlChampionTimer);
    App._stlPreview = { idx: 0, phase: 'table', championQueued: false };
    try { Audio.bgm.playStage('springA'); } catch (e) {}
    // 編成は週11、本編は週12。週をまたぐので会場入りはここで挟む
    const partyIds = (stl.teams || []).filter(team => team && team.orgId === 'player')
      .flatMap(team => [team.f1Id, team.f2Id]);
    const party = partyIds.map(id => (G.roster || []).find(f => f && f.id === id)).filter(Boolean);
    // 春タッグはリーグ表から開始する。PPV型の縦カード紹介は使わない。
    const toBoard = () => renderSpringTagLeagueBoard();
    if (typeof showSpecialEventTravel === 'function' && party.length) {
      showSpecialEventTravel('springTagLeague', G, party, toBoard);
    } else {
      toBoard();
    }
  },

  stlAdvance() {
    const p = App._stlPreview;
    if (!p || App._stlAdvanceBusy) return;
    App._stlAdvanceBusy = true;
    clearTimeout(App._stlAdvanceTimer);
    // 連打は1操作に畳み、UI側の待ちが壊れてもタイムアウトで必ず再操作可能にする。
    App._stlAdvanceTimer = setTimeout(() => {
      App._stlAdvanceBusy = false;
      App._stlAdvanceTimer = null;
    }, 900);
    const stl = G.springTagLeague;
    const matches = (stl && stl.matches) || [];
    if (p.phase === 'table') {
      if (p.idx < matches.length) {
        const revealed = matches[p.idx];
        p.idx++;
        Audio.play('click');
        renderSpringTagLeagueBoard();
        renderSpringTagLeagueMatchResultPopup(revealed, false);
      } else {
        p.phase = 'finalReady';
        try { Audio.bgm.playStage('springB'); } catch (e) {} // 決勝へ: WM-SP01 → SP02
        Audio.play('notify');
        renderSpringTagLeagueBoard();
      }
    } else if (p.phase === 'finalReady') {
      p.phase = 'finalResult';
      Audio.play('click');
      renderSpringTagLeagueMatchResultPopup(stl.finalMatch, true, () => App.stlAdvance());
    } else if (p.phase === 'finalResult') {
      if (p.championQueued) return;
      p.championQueued = true;
      p.phase = 'champion';
      try { Audio.fileBgm.fadeOut(800); } catch (e) {}
      clearTimeout(App._stlChampionTimer);
      App._stlChampionTimer = setTimeout(() => {
        try { Audio.fileBgm.stop(); } catch (e) {}
        try { Audio.bgm.playJingle('championship'); } catch (e) {}
        if (App._stlPreview === p && p.phase === 'champion') renderSpringTagLeagueChampion();
        App._stlChampionTimer = null;
      }, 900);
    } else {
      // 想定外のphase(2026-07-31監査で検出。到達経路は見つかっていないが、
      // 見つからない=絶対に来ない、の証明にはならないための保険)。
      // 無言で何もしないと「押しても反応しない」バグに見えるため、異常を可視化しつつ
      // phaseは書き換えずゲームを進行不能にしない。
      try { Audio.play('error'); } catch (e) {}
      console.warn('[WM] App.stlAdvance: unexpected phase', p.phase);
    }
  },

  stlWatchMatch() {
    const p = App._stlPreview;
    const stl = G.springTagLeague;
    if (!p || !stl || p.phase === 'watching') return;
    const isFinal = p.phase === 'finalReady';
    const matchIndex = isFinal ? (stl.matches || []).length : p.idx;
    const match = isFinal ? stl.finalMatch : (stl.matches || [])[matchIndex];
    if (!match) {
      App.stlAdvance();
      return;
    }
    const replay = Engine.springTagLeague.simulateReplay(G, match, { isFinal, matchIndex });
    if (!replay || !replay.result || !Array.isArray(replay.result.frames) || replay.result.frames.length === 0) {
      Audio.play('error');
      App.stlAdvance();
      return;
    }

    if (replay.result.winner !== match.winner || replay.result.mq !== match.mq || replay.result.turns !== match.turns) {
      try {
        console.warn('[SpringTag] replay result mismatch; canonical league result is preserved', {
          matchIndex,
          isFinal,
          expected: { winner: match.winner, mq: match.mq, turns: match.turns },
          replay: { winner: replay.result.winner, mq: replay.result.mq, turns: replay.result.turns },
        });
      } catch (_e) {}
    }

    const overlay = document.getElementById('battleOverlay');
    const iframe = document.getElementById('battleIframe');
    if (!overlay || !iframe) {
      App.stlAdvance();
      return;
    }
    p.watchReturnPhase = p.phase;
    p.watchCanonical = { winner: match.winner, mq: match.mq, turns: match.turns };
    p.phase = 'watching';
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => {
      if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; }
    }, 8000);

    const profile = fighter => ({
      ...fighter,
      portraitUrl: getPortraitUrl(fighter.id),
      profile: CHAR_PROFILES[fighter.id] || '',
    });
    const { fA1, fA2, fB1, fB2 } = replay.fighters;
    const roundLabel = isFinal ? '優勝決定戦' : `${match.block || ''}ブロック 第${match.blockRound || matchIndex + 1}試合`;
    // 総試合数は実データから数える(8チーム=13、7チーム=10、6チーム=7、旧4チーム形式=7)
    const totalStlMatches = ((G.springTagLeague && G.springTagLeague.matches) || []).length + 1;
    const msg = {
      type: 'START_TAG_MATCH',
      teamA: { fighter1: profile(fA1), fighter2: profile(fA2) },
      teamB: { fighter1: profile(fB1), fighter2: profile(fB2) },
      result: replay.result,
      matchInfo: {
        header: `🌸 春のタッグリーグ ${roundLabel}`,
        matchNum: isFinal ? totalStlMatches : matchIndex + 1,
        totalMatches: totalStlMatches,
        preserveParentFileBgm: true,
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
        chemA: replay.result.chemA,
        chemB: replay.result.chemB,
      },
    };
    let sent = false;
    const sendOnce = () => {
      if (sent) return;
      sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'tag-battle.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  _receiveSpringTagLeagueBattleResult(data) {
    const p = App._stlPreview;
    if (!p || p.phase !== 'watching') return;
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    const overlay = document.getElementById('battleOverlay');
    if (overlay) overlay.style.display = 'none';
    const expected = p.watchCanonical;
    if (expected && data && (data.winner !== expected.winner || data.mq !== expected.mq || data.turns !== expected.turns)) {
      try { console.warn('[SpringTag] iframe replay completion differs from canonical result; ignored'); } catch (_e) {}
    }
    p.phase = p.watchReturnPhase || 'table';
    delete p.watchReturnPhase;
    delete p.watchCanonical;
    App.stlAdvance();
  },

  finalizeSpringTagLeagueReplay() {
    // task-73: 経営画面へ戻る直前にコーチが1枚だけ締める。表示したら resume で戻ってくる
    if (App._tcwGate('springTag', {}, () => App.finalizeSpringTagLeagueReplay())) return;
    if (G._pendingSpringTagLeagueReplay) {
      const { _pendingSpringTagLeagueReplay: _, ...cleanG } = G;
      G = cleanG;
    }
    clearTimeout(App._stlAdvanceTimer);
    clearTimeout(App._stlChampionTimer);
    App._stlAdvanceTimer = null;
    App._stlChampionTimer = null;
    App._stlAdvanceBusy = false;
    App._stlPreview = null;
    const overlay = document.getElementById('showResultOverlay');
    if (overlay) overlay.classList.remove('active');
    const box = document.getElementById('showResultBox');
    if (box) { box.style.maxWidth = ''; box.style.padding = ''; box.style.background = ''; box.style.border = ''; }
    try { Audio.fileBgm.stop(); } catch (e) {}
    try { Audio.bgm.playForState(); } catch (e) {}
    try { Storage.autoSave(); } catch (_e) {}
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
  },

  // ═══ Title Screen (v1.0) ═══

  restoreBgmForState(delayMs = 0) {
    const restore = () => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      try { Audio.bgm.playForState(); } catch(e) {}
    };
    if (delayMs > 0) setTimeout(restore, delayMs);
    else restore();
  },

  repairProgressionState(reason = 'runtime') {
    if (!G || !Engine?.saveDoctor?.repairProgressionState) return false;
    const showResultOverlay = (() => {
      try { return document.getElementById('showResultOverlay'); } catch (_e) { return null; }
    })();
    const showResultActive = !!(showResultOverlay && showResultOverlay.classList.contains('active'));
    if (G.weekPhase === 'showExec' && (showResultActive || App._showPreview || App._closingShowResult)) {
      return false;
    }
    const repair = Engine.saveDoctor.repairProgressionState(G);
    if (!repair.changed) return false;
    G = repair.state;
    try {
      console.warn('[WM] progression state repaired', { reason, changes: repair.changes, phase: G.weekPhase, week: G.week });
    } catch (_e) {}
    try {
      G = {
        ...G,
        gameLog: [...(G.gameLog || []), `セーブデータ自動修復: ${repair.changes.join(', ')}`],
      };
    } catch (_e) {}
    return true;
  },

  // Show the title screen overlay
  showTitleScreen() {
    const titleEl = document.getElementById('titleScreen');
    const orgEl = document.getElementById('orgSetupScreen');
    const diffEl = document.getElementById('difficultyScreen');
    titleEl.style.display = 'flex';
    orgEl.style.display = 'none';
    if (diffEl) diffEl.style.display = 'none';

    // Pick a fresh cast on every visit and duplicate the row for a seamless marquee.
    const titlePool = (Array.isArray(ALL_CHARS) ? ALL_CHARS : [])
      .map(c => ({ id: c.id, url: getPortraitUrl(c.id) }))
      .filter(c => c.url);
    for (let i = titlePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [titlePool[i], titlePool[j]] = [titlePool[j], titlePool[i]];
    }
    const titleCast = titlePool.slice(0, Math.min(18, titlePool.length));
    const portraitsEl = document.getElementById('titlePortraits');
    const portraitRow = titleCast
      .map(c => `<img src="${c.url}" alt="" loading="eager" decoding="async" onerror="this.style.display='none'">`)
      .join('');
    portraitsEl.innerHTML = portraitRow
      ? `<div class="title-portraits-track">
          <div class="title-portraits-group">${portraitRow}</div>
          <div class="title-portraits-group" aria-hidden="true">${portraitRow}</div>
        </div>`
      : '';
    const portraitTrack = portraitsEl.querySelector('.title-portraits-track');
    if (portraitTrack) {
      requestAnimationFrame(() => portraitTrack.classList.add('is-running'));
    }

    // Show CONTINUE button if autosave exists (体験版ではオートセーブ無効)
    const autoInfo = window.IS_TRIAL ? null : Storage.getAutoSaveInfo();
    const contBtn = document.getElementById('titleContinueBtn');
    if (autoInfo) {
      contBtn.style.display = '';
      contBtn.textContent = `CONTINUE — ${Engine.util.formatDate(autoInfo.season, autoInfo.week)}`;
    } else {
      contBtn.style.display = 'none';
    }

    // Show LOAD GAME button: always visible, disabled if no saves
    const loadBtn = document.getElementById('titleLoadBtn');
    if (loadBtn) {
      let hasAnySave = !!autoInfo;
      if (!hasAnySave) { for (let i = 1; i <= SAVE_SLOTS; i++) { if (Storage.getSaveInfo(i)) { hasAnySave = true; break; } } }
      loadBtn.disabled = !hasAnySave;
      loadBtn.style.opacity = hasAnySave ? '' : '0.3';
    }

    // タイトル画面のBGM: WM-C01 タイトル・オープニング。
    // 初回表示は自動再生ポリシーで蹴られるが、FileBGM が最初の操作で拾い直す
    try { Audio.bgm.play('kaimaku'); } catch (e) {}
  },

  // "NEW GAME" button from title
  titleNewGame() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('orgSetupScreen').style.display = 'flex';
    // Populate icon grid
    _pendingOrgIcon = 0;
    const grid = document.getElementById('orgIconGrid');
    if (grid) {
      let gh = '';
      for (let i = 0; i < 10; i++) {
        const sel = i === 0 ? 'border:3px solid var(--gold);box-shadow:0 0 12px rgba(212,168,67,0.4)' : 'border:3px solid transparent';
        gh += `<img src="../image/org/org-player-${i}.png" width="64" height="64" data-idx="${i}" style="cursor:pointer;border-radius:8px;${sel};transition:border 0.2s,box-shadow 0.2s" onclick="App.selectOrgIcon(${i})" alt="">`;
      }
      grid.innerHTML = gh;
    }
    // Focus the input
    setTimeout(() => {
      const input = document.getElementById('orgSetupNameInput');
      if (input) { input.value = ''; input.focus(); }
    }, 100);
  },

  // "CONTINUE" button from title
  titleContinue() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    if (!Storage.loadAutoSave()) {
      Audio.play('error');
      App.showTitleScreen();
      alert('オートセーブの読み込みに失敗しました。');
      return;
    }
    sessionRng = Engine.rng.create(G.rngSeed);
    App._refreshTicker(); // v1.4w
    Audio.bgm.playForState();
    refreshAll();
  },

  // "LOAD GAME" button from title — open save/load screen
  titleLoadGame() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    // Initialize minimal state so save screen can render (skipDraft=true to avoid draft screen)
    G = Engine.createInitialState(undefined, true);
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, _draftPicks: [], _draftFocus: null, gameLog: [] };
    refreshAll();
    showScreen('save');
    Audio.bgm.play('management');
  },

  // Select org icon (called from icon grid)
  selectOrgIcon(idx) {
    _pendingOrgIcon = idx;
    Audio.play('click');
    const grid = document.getElementById('orgIconGrid');
    if (grid) {
      grid.querySelectorAll('img').forEach(img => {
        const isSelected = parseInt(img.dataset.idx) === idx;
        img.style.border = isSelected ? '3px solid var(--gold)' : '3px solid transparent';
        img.style.boxShadow = isSelected ? '0 0 12px rgba(212,168,67,0.4)' : 'none';
      });
    }
  },

  // Confirm org setup → proceed to difficulty selection
  confirmOrgSetup() {
    const input = document.getElementById('orgSetupNameInput');
    _pendingOrgName = (input && input.value.trim()) || 'プレイヤー団体';
    Audio.play('select');
    document.getElementById('orgSetupScreen').style.display = 'none';
    document.getElementById('difficultyScreen').style.display = 'flex';
    App.selectDifficulty('hard');
  },

  // Select difficulty (update radio UI)
  selectDifficulty(mode) {
    _selectedDifficulty = mode;
    const optNormal = document.getElementById('diffOptNormal');
    const optHard = document.getElementById('diffOptHard');
    const radNormal = document.getElementById('diffRadioNormal');
    const radHard = document.getElementById('diffRadioHard');
    if (optNormal) optNormal.classList.toggle('selected', mode === 'normal');
    if (optHard) optHard.classList.toggle('selected', mode === 'hard');
    if (radNormal) radNormal.textContent = mode === 'normal' ? '◉' : '○';
    if (radHard) radHard.textContent = mode === 'hard' ? '◉' : '○';
  },

  // Confirm difficulty and start game
  confirmDifficulty() {
    Audio.play('award');
    document.getElementById('difficultyScreen').style.display = 'none';
    G = Engine.createInitialState();
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, orgName: _pendingOrgName, playerOrgIcon: _pendingOrgIcon, difficultyMode: _selectedDifficulty, weekPhase: 'opening', _draftPicks: [], _draftFocus: null, gameLog: [] };
    // タイトル曲(WM-C01)はここで幕を下ろす。オープニング4幕は無音で読ませ、
    // ドラフト画面に入った瞬間に WM-C08 で音を戻す（_finishOpening）
    try { Audio.bgm.fadeOutStop(1200); } catch (e) {}
    refreshAll();
  },

  // Back from difficulty to org setup
  backFromDifficulty() {
    Audio.play('click');
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('orgSetupScreen').style.display = 'flex';
  },

  // Back to title from org setup
  backToTitle() {
    Audio.play('click');
    document.getElementById('orgSetupScreen').style.display = 'none';
    App.showTitleScreen();
  },

  // Toggle a draft pick on/off
  toggleDraftPick(charId) {
    if (G.weekPhase !== 'draft') return;
    const picks = G._draftPicks || [];
    const idx = picks.indexOf(charId);
    let newPicks;
    if (idx >= 0) {
      newPicks = picks.filter(id => id !== charId);
      Audio.play('deselect');
    } else if (picks.length < DRAFT_CONFIG.pickCount) {
      const nextPicks = [...picks, charId];
      if (!Engine.draft.canAffordSelection(G, nextPicks, G.rngSeed)) {
        Audio.play('error');
        alert('資金不足です。より安い候補を選んでください。');
        return;
      }
      newPicks = nextPicks;
      Audio.play('select');
    } else {
      return;
    }
    G = { ...G, _draftPicks: newPicks };
    renderWeekScreen();
  },

  // Confirm draft and start the game
  completeDraft() {
    if (G.weekPhase !== 'draft') return;
    const picks = G._draftPicks || [];
    if (!Engine.draft.isValidPicks(picks)) return;
    if (!Engine.draft.canAffordSelection(G, picks, G.rngSeed)) {
      Audio.play('error');
      alert('資金不足です。より安い候補を選んでください。');
      return;
    }
    Audio.play('award');
    const rng = Engine.rng.create(G.rngSeed);
    G = Engine.draft.completeDraft(G, picks, rng);
    // NPC記録統一 Part C: 全選手の経歴自動生成（ドラフト完了後・ゲーム本編開始前）
    G = Engine.career.generateAllBackstories(G);
    // Phase 1: 人間関係データ基盤 — 全ペアの初期値生成
    G = Engine.relationships.initialize(G);
    // §C-6 過去対戦成績デッち上げ — AI団体ロスターに h2h/wins/Bond/Rivalry を刻む
    G = Engine.career.generateInheritedRecords(G);
    // v1.3: Record debut event for drafted fighters（経歴生成後に上書き — プレイヤー団体デビューを正式記録）
    G = { ...G, roster: G.roster.map(c => picks.includes(c.id)
      ? Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'draft' })
      : c) };
    // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ(初期ドラフト分)
    G.roster.forEach(c => {
      const reg = Engine.mq.registerBignewsHire(G, c);
      G = reg.state;
      if (reg.fighter !== c) G = { ...G, roster: G.roster.map(r => r.id === c.id ? reg.fighter : r) };
    });
    // 序章 (Phase 2): 旗揚げ5人を確定し org_founded ハイライトを刻む
    G = Engine.prologue.create(G);
    delete G._draftPicks;
    delete G._draftFocus;
    sessionRng = Engine.rng.create(G.rngSeed);

    // ── 完了演出: 5名横並び集合写真 ──
    const orgName = G.orgName || 'プレイヤー団体';
    // 並び順: 固定メンバー左 → 選択3名 → 固定メンバー右
    const fixedIds = DRAFT_CONFIG.fixed;
    const teamOrder = [fixedIds[0], ...picks, fixedIds[1]];
    const teamMembers = teamOrder.map(id => {
      const c = G.roster.find(r => r.id === id) || ALL_CHARS.find(r => r.id === id);
      return { id, name: c ? c.name : '???', isFixed: fixedIds.includes(id) };
    });
    const foundingGreetings = [
      '社長、これからよろしくお願いします！',
      'この団体を、必ず大きくしてみせます。',
      '私たちのリング、ここから始めましょう。',
      '期待には試合で応えます。',
      '全員で一番を目指しましょう、社長。',
    ];

    const overlay = document.createElement('div');
    overlay.className = 'completion-overlay';
    // 挨拶セリフは各選手の頭上に吹き出しで配置(セリフは吹き出しに収めるのが基本形・2026-07-23)
    overlay.innerHTML = `
      <div class="comp-vignette"></div>
      <div class="team-photo">
        ${teamMembers.map((m, i) => {
          const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(m.id) : '';
          return `<div class="team-member${m.isFixed ? ' fixed-mark' : ''}">
            <div class="team-bubble" style="--greeting-index:${i}">${foundingGreetings[i]}</div>
            ${upperUrl ? `<img src="${upperUrl}" alt="${m.name}">` : '<div style="width:100%;aspect-ratio:2/3;background:#222"></div>'}
            <div class="team-member-name">${m.name}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="comp-text">
        <span class="org-name">${orgName}</span>
        <span class="start">始動</span>
      </div>
    `;
    document.body.appendChild(overlay);

    // フェードイン
    requestAnimationFrame(() => { requestAnimationFrame(() => { overlay.classList.add('show'); }); });

    // クリームテーマをクリーンアップ
    const appEl = document.querySelector('.app');
    if (appEl) appEl.classList.remove('draft-cream');

    // クリックで本編へ
    let _leaving = false;
    overlay.addEventListener('click', () => {
      if (_leaving) return;
      _leaving = true;
      // オーバーレイが不透明なうちに背景をメインメニューへ差し替える。
      // こうしないとフェード中に背後の旗揚げメンバー選択画面が透けて見え、
      // 「選ぶ前の画面が一瞬出てからメニューへ移る」引っかかりになる。
      Audio.bgm.play('management');
      Storage.autoSave();
      refreshAll();
      // 背景が本編に差し替わってからフェードアウト → 透けて見えるのはメインメニュー
      overlay.style.transition = 'opacity 1s ease';
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); }, 1000);
    });
  },

  // Initialize a new game (from save/load screen)
  newGame() {
    App.showTitleScreen();
  },

  // Sign a free agent
  signFighter(charId) {
    const idx = G.freeAgents.findIndex(c => c.id === charId);
    if (idx < 0) return;
    const fighter = G.freeAgents[idx];
    // 最終重複チェック（最後の砦）：同一defIdがロスターに既に存在しないか確認
    if (G.roster.some(c => c.id === charId)) {
      Audio.play('error'); alert('この選手はすでに自団体に所属しています'); return;
    }
    // Gate: check orgPop requirement (pricing-balance-spec §2) — FA context with eliteTicket support
    if (!Engine.scout.canNegotiate(G.orgPop || 0, fighter, 'fa', G)) {
      Audio.play('error'); alert('団体の知名度が足りません！'); return;
    }
    const usedEliteTicket = Engine.scout.isEliteTicketRequired(G.orgPop || 0, fighter, G);
    const finalCost = Engine.scout.getSigningCost(fighter, G.orgPop || 0);
    if (G.funds < finalCost) { Audio.play('error'); alert('資金が足りません！'); return; }
    if (G.roster.filter(f => !f.isRental).length >= (G.rosterCap || 8)) {
      App._queueRosterOverflowSigning({
        source: 'fa',
        fighterId: fighter.id,
        fighter: { ...fighter },
        cost: finalCost,
        meta: { usedEliteTicket }
      });
      return;
    }
    // Ensure all roster-required properties exist (FA from dormant pool via makeAIFighter may lack them)
    const normalized = {
      ...fighter,
      orgId: 'player',
      condition: fighter.condition ?? (70 + Math.floor(Math.random() * 19)),
      schedule: fighter.schedule || 'balance',
      wins: fighter.wins || 0,
      losses: fighter.losses || 0,
      draws: fighter.draws || 0,
      injury: fighter.injury || null,
      seasonGrowth: fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
      careerSeasons: fighter.careerSeasons || 0,
      careerStage: 'active',
      seasonMatchCount: fighter.seasonMatchCount || 0,
      intensive: fighter.intensive ?? false,
      intensiveWeeks: fighter.intensiveWeeks || 0,
      lastMatchResult: fighter.lastMatchResult || null,
      losingStreak: fighter.losingStreak || 0,
      preInjuryPop: fighter.preInjuryPop ?? null
    };
    let c = normalized; // FA signing: no popularity reset (transfer reset is for org-to-org moves only)
    c = Engine.chronicle.applySpiritToFighter(c, G.chronicle); // Phase 4: 気風 trainCap 補正
    // Phase 3: orgJoinWeek設定
    c.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
    // v1.3: Record debut event
    c = Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'freeagent' });
    // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
    { const reg = Engine.mq.registerBignewsHire(G, c); G = reg.state; c = reg.fighter; }
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const newFA = G.freeAgents.filter((_, i) => i !== idx);
    const newRoster = [...G.roster, c];
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
    const log = [...G.gameLog, `📝 ${c.name}と契約（契約金: ${finalCost}万 [${tierCfg.label}]${scoutDisc > 0 ? ` / スカウト網割引${scoutDisc}%` : ''}）`];
    if (titleMsg) log.push(titleMsg);
    // v1.9: 逸材特別交渉枠の消費
    const eliteTicketUpdate = usedEliteTicket ? { eliteTicket: false, eliteTicketUsed: true } : {};
    if (usedEliteTicket) log.push('🎫 逸材特別交渉枠を使用しました');
    G = { ...G, funds: G.funds - finalCost, freeAgents: newFA, roster: newRoster, titles, gameLog: log, ...eliteTicketUpdate };
    Audio.play('contract');
    const faSigningLine = getSigningLine(fighter, 'fa_signing');
    showEventPopup({ type:'fighter', id: fighter.id, name: fighter.name,
      tone:'positive', speech: faSigningLine,
      detail:`📝 契約金: ${finalCost}万 [${tierCfg.label}]` });
    refreshAll();
  },

  _normalizeFighterForRoster(fighter) {
    return {
      ...fighter,
      seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0, ...(fighter?.seasonGrowth || {}) },
      wins: fighter?.wins ?? 0,
      losses: fighter?.losses ?? 0,
      draws: fighter?.draws ?? 0,
      injury: fighter?.injury ?? null,
      condition: typeof fighter?.condition === 'number' ? fighter.condition : 80,
      schedule: ['balance', 'practice', 'promo', 'rest'].includes(fighter?.schedule) ? fighter.schedule : 'balance',
      intensive: !!fighter?.intensive,
      intensiveWeeks: fighter?.intensiveWeeks || 0,
      lastMatchResult: fighter?.lastMatchResult || null,
      losingStreak: fighter?.losingStreak || 0,
      preInjuryPop: fighter?.preInjuryPop ?? null,
      careerSeasons: fighter?.careerSeasons || 0,
      careerStage: 'active',
      seasonMatchCount: fighter?.seasonMatchCount || 0,
      promoStack: fighter?.promoStack || 0,
    };
  },

  _removeFighterFromShowCard(showCard, fighterId) {
    return (showCard || []).map(match => {
      if (!match) return match;
      const left = match.left === fighterId ? 0 : match.left;
      const right = match.right === fighterId ? 0 : match.right;
      const isTitle = left > 0 && right > 0 ? !!match.isTitle : false;
      return { ...match, left, right, isTitle };
    });
  },

  _releaseFighterForOverflow(charId) {
    const idx = G.roster.findIndex(c => c.id === charId);
    if (idx < 0) return null;
    const target = G.roster[idx];
    if (G.relationships) {
      const releaseRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE45, G.season, charId));
      const colleagueIds = G.roster.filter(f => f.id !== charId).map(f => f.id);
      G = Engine.relationships.applyToRoster(G, charId, colleagueIds, { min: -15, max: -10 }, { min: 0, max: 0 }, releaseRelRng);
      for (const cid of colleagueIds) {
        const colleague = G.roster.find(f => f.id === cid);
        const p = colleague?.personality || 'normal';
        let bMin, bMax;
        if (p === 'bold' || p === 'emotional') { bMin = 0; bMax = 2; }
        else if (p === 'earnest' || p === 'quiet') { bMin = -2; bMax = 0; }
        else { bMin = -1; bMax = 1; }
        G = Engine.relationships.applyFromRoster(G, [cid], charId, { min: bMin, max: bMax }, { min: 0, max: 0 }, releaseRelRng);
      }
    }
    const newRoster = G.roster.filter((_, i) => i !== idx);
    const newShowCard = App._removeFighterFromShowCard(G.showCard, charId);
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster, showCard: newShowCard });
    const log = [...G.gameLog, `📤 ${target.name}を解雇`];
    if (titleMsg) log.push(titleMsg);
    const claimResult = Engine.rival.claimDepartedStar(
      Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xD75A, G.season, G.week, charId)),
      { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log },
      target,
      { fromOrgName: G.orgName || 'player', via: 'release_claim' }
    );
    if (claimResult.claimed) {
      log.push(`Transfer: ${target.name} -> ${claimResult.orgName}${claimResult.ejected ? ` / out: ${claimResult.ejected.name}` : ''}`);
      G = { ...claimResult.state, gameLog: log };
    } else if (Engine.util.canAddToFA(G)) {
      const releasedFighter = Engine.orgTimeline.transfer(target, 'fa', G.season, G.week);
      G = { ...G, roster: newRoster, showCard: newShowCard, freeAgents: [...G.freeAgents, releasedFighter], coachAssign: newCoachAssign, titles, gameLog: log };
    } else {
      G = { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log };
      G = Engine.util.redirectToDormantPool(G, target);
    }
    return target;
  },

  _queueRosterOverflowSigning(payload) {
    G = { ...G, pendingRosterOverflowSigning: payload };
    Storage.autoSave();
    refreshAll();
    if (typeof showRosterOverflowSigningModal === 'function') {
      setTimeout(() => showRosterOverflowSigningModal(G.pendingRosterOverflowSigning), 50);
    }
  },

  _showRosterOverflowSigningModalIfNeeded(delay = 0) {
    if (!G.pendingRosterOverflowSigning || typeof showRosterOverflowSigningModal !== 'function') return;
    const pending = G.pendingRosterOverflowSigning;
    setTimeout(() => {
      if (!G.pendingRosterOverflowSigning) return;
      if (G.pendingRosterOverflowSigning.source !== pending.source || G.pendingRosterOverflowSigning.fighterId !== pending.fighterId) return;
      showRosterOverflowSigningModal(G.pendingRosterOverflowSigning);
    }, delay);
  },

  cancelRosterOverflowSigning() {
    if (!G.pendingRosterOverflowSigning) return;
    const pending = G.pendingRosterOverflowSigning;
    const update = { pendingRosterOverflowSigning: null };
    if (pending.source === 'negotiation') update.negotiationResult = null;
    G = { ...G, ...update };
    Storage.autoSave();
    refreshAll();
  },

  confirmRosterOverflowSigning(releaseId) {
    const pending = G.pendingRosterOverflowSigning;
    if (!pending) return;
    const releaseTarget = G.roster.find(c => c.id === releaseId && !c.isRental && !c.lastRun);
    if (!releaseTarget) {
      Audio.play('error');
      return;
    }
    if (G.funds < pending.cost) {
      Audio.play('error');
      alert('資金が足りません！');
      return;
    }
    if (pending.source === 'fa' && !G.freeAgents.some(c => c.id === pending.fighterId)) {
      G = { ...G, pendingRosterOverflowSigning: null };
      refreshAll();
      Audio.play('error');
      alert('対象選手が市場に見つかりませんでした。');
      return;
    }
    if (pending.source === 'scout' && !(G.scoutCandidates || []).some(c => c.id === pending.fighterId) && !pending.fighter) {
      G = { ...G, pendingRosterOverflowSigning: null };
      refreshAll();
      Audio.play('error');
      alert('対象選手がスカウト候補に見つかりませんでした。');
      return;
    }
    if (pending.source === 'negotiation') {
      const orgData = pending.meta?.fromOrgId ? G.aiOrgs?.[pending.meta.fromOrgId] : null;
      const fighter = orgData?.roster?.find(f => f.id === pending.fighterId);
      if (!orgData || !fighter) {
        G = { ...G, pendingRosterOverflowSigning: null, negotiationResult: null };
        refreshAll();
        Audio.play('error');
        alert('交渉対象の選手が見つかりませんでした。');
        return;
      }
    }
    const released = App._releaseFighterForOverflow(releaseId);
    if (!released) return;
    let signedFighter = pending.fighter;
    let detail = `解雇: ${released.name}`;
    let speech = '';
    let message = '契約が成立しました';
    if (pending.source === 'fa') {
      const idx = G.freeAgents.findIndex(c => c.id === pending.fighterId);
      const fighter = G.freeAgents[idx];
      const usedEliteTicket = !!pending.meta?.usedEliteTicket;
      let normalized = App._normalizeFighterForRoster({ ...fighter, orgId: 'player' });
      normalized = Engine.chronicle.applySpiritToFighter(normalized, G.chronicle); // Phase 4: 気風 trainCap 補正
      normalized.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      normalized = Engine.career.addEvent(normalized, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'freeagent' });
      // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
      { const reg = Engine.mq.registerBignewsHire(G, normalized); G = reg.state; normalized = reg.fighter; }
      const tierCfg = Engine.scout.getTierConfig(normalized.assessedTier || 'material');
      const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
      const newFA = G.freeAgents.filter((_, i) => i !== idx);
      const newRoster = [...G.roster, normalized];
      const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
      const log = [...G.gameLog, `📝 ${normalized.name}と契約（契約金: ${pending.cost}万）[${tierCfg.label}]${scoutDisc > 0 ? ` / スカウト割引 ${scoutDisc}%` : ''}`];
      if (titleMsg) log.push(titleMsg);
      if (usedEliteTicket) log.push('🎫 逸材特別交渉枠を使用しました');
      G = { ...G, funds: G.funds - pending.cost, freeAgents: newFA, roster: newRoster, titles, gameLog: log, eliteTicket: usedEliteTicket ? false : G.eliteTicket, eliteTicketUsed: usedEliteTicket ? true : G.eliteTicketUsed };
      signedFighter = normalized;
      detail = `解雇: ${released.name} / 契約金: ${pending.cost}万`;
      speech = getSigningLine(fighter, 'fa_signing');
      message = '';
    } else if (pending.source === 'scout') {
      const cand = (G.scoutCandidates || []).find(c => c.id === pending.fighterId) || pending.fighter;
      const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
      const signed = { ...cand };
      delete signed._notion; delete signed._estimate; delete signed._isSeed;
      delete signed._hasCompetition; delete signed._compMultiplier; delete signed._bidWinRate;
      let normalizedSigned = App._normalizeFighterForRoster(signed);
      normalizedSigned = Engine.chronicle.applySpiritToFighter(normalizedSigned, G.chronicle); // Phase 4: 気風 trainCap 補正
      normalizedSigned.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      normalizedSigned = Engine.orgTimeline.transfer(normalizedSigned, 'player', G.season, G.week);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'scout' });
      // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
      { const reg = Engine.mq.registerBignewsHire(G, normalizedSigned); G = reg.state; normalizedSigned = reg.fighter; }
      const candidates = (G.scoutCandidates || []).filter(c => c.id !== pending.fighterId);
      const picks = [...(G.scoutPicks || [])];
      if (!picks.includes(pending.fighterId)) picks.push(pending.fighterId);
      const newRoster = [...G.roster, normalizedSigned];
      const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
      const log = [...G.gameLog, `📝 スカウト獲得 ${normalizedSigned.name} [${tierCfg.label}] 契約金${pending.cost}万`];
      if (titleMsg) log.push(titleMsg);
      G = { ...G, roster: newRoster, scoutCandidates: candidates, scoutPicks: picks, funds: G.funds - pending.cost, titles, gameLog: log };
      signedFighter = normalizedSigned;
      detail = `解雇: ${released.name} / 契約金: ${pending.cost}万`;
      speech = getSigningLine(cand, pending.meta?.choice === 'direct' ? 'direct' : 'competition_won');
      message = '';
    } else if (pending.source === 'negotiation') {
      const fromOrgId = pending.meta?.fromOrgId;
      const fromOrgName = pending.meta?.fromOrgName || '他団体';
      const orgData = G.aiOrgs[fromOrgId];
      const fighter = orgData.roster.find(f => f.id === pending.fighterId);
      let resetFighter = Engine.popularity.applyTransferReset({ ...fighter, orgId: 'player', trust: 50, salaryBonus: 0 });
      resetFighter.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      resetFighter = Engine.orgTimeline.transfer(resetFighter, 'player', G.season, G.week);
      resetFighter = Engine.career.addEvent(resetFighter, { type: 'transfer', season: G.season, week: G.week, fromOrg: fromOrgName, toOrg: 'player', via: 'negotiate' });
      const newAiOrgs = { ...G.aiOrgs, [fromOrgId]: { ...orgData, roster: orgData.roster.filter(f => f.id !== pending.fighterId) } };
      G = { ...G, aiOrgs: newAiOrgs, roster: [...G.roster, resetFighter], funds: G.funds - pending.cost, transferLog: [...(G.transferLog || []), { season: G.season, week: G.week, type: 'negotiate', fighter: fighter.name, from: fromOrgName, cost: pending.cost }], gameLog: [...G.gameLog, `🎉 ${fighter.name}の引き抜き交渉成功！（-${pending.cost}万）`], negotiationResult: null };
      App._pushNewsEvent({ type: 'poachSuccess', characterId: resetFighter.id,
        data: { name: resetFighter.name, toOrg: G.orgName || '\u3042\u306a\u305f\u306e\u56e3\u4f53', fromOrg: fromOrgName, ovr: Engine.util.ov(resetFighter), cost: pending.cost } });
      signedFighter = resetFighter;
      detail = `解雇: ${released.name} / 移籍金: ${pending.cost}万`;
      message = `${resetFighter.name}との契約が成立した`;
    }
    G = { ...G, pendingRosterOverflowSigning: null };
    Storage.autoSave();
    refreshAll();
    Audio.play('contract');
    showEventPopup({
      type: 'fighter', id: signedFighter.id, name: signedFighter.name, tone: 'positive',
      speech: speech || undefined, message: message || undefined, detail,
    });
  },

  // ── Scout Event Methods (scout-spec §2-§5) ──────────────

  /** Pick a candidate: show competition dialog or sign directly */
  scoutEventPick(candidateId) {
    if (!G.scoutCandidates) return;
    const cand = G.scoutCandidates.find(c => c.id === candidateId);
    if (!cand) return;
    const picks = G.scoutPicks || [];
    if (picks.length >= (G.scoutMaxPicks || 3)) {
      Audio.play('error'); alert(`今回の獲得上限（${G.scoutMaxPicks}名）に達しています`); return;
    }
    if (!Engine.scout.canNegotiate(G.orgPop || 0, cand)) {
      Audio.play('error'); alert('団体の知名度が足りません！'); return;
    }
    const baseCost = Engine.scout.getSigningCost(cand, G.orgPop || 0);
    if (G.funds < baseCost) { Audio.play('error'); alert('資金が足りません！'); return; }

    if (cand._hasCompetition) {
      // Show competition resolution modal
      G = { ...G, scoutPendingPick: candidateId };
      renderScoutCompetitionModal(cand, baseCost, Engine.scout.getScoutDiscount(G.orgPop || 0));
    } else {
      // No competition: direct sign
      this.scoutEventResolve(candidateId, 'direct');
    }
  },

  /** Resolve a scout pick with competition choice */
  scoutEventResolve(candidateId, choice) {
    if (!G.scoutCandidates) return;
    const cand = G.scoutCandidates.find(c => c.id === candidateId);
    if (!cand) return;
    const baseCost = Engine.scout.getSigningCost(cand, G.orgPop || 0);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, candidateId));

    let result;
    if (choice === 'direct') {
      result = { result: 'success', cost: baseCost };
    } else {
      result = Engine.scout.resolveCompetition(rng, cand, choice);
      if (result.cost > 0) {
        result.cost = Engine.scout.getSigningCost({ assessedValue: result.cost }, G.orgPop || 0);
      }
    }

    const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
    const log = [...G.gameLog];
    let candidates = [...G.scoutCandidates];
    let picks = [...(G.scoutPicks || [])];
    let newRoster = [...G.roster];
    let newFunds = G.funds;
    let aiOrgs = { ...G.aiOrgs };
    let freeAgents = [...G.freeAgents];

    const normalizeFighterForRoster = (fighter) => ({
      ...fighter,
      seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0, ...(fighter?.seasonGrowth || {}) },
      wins: fighter?.wins ?? 0,
      losses: fighter?.losses ?? 0,
      draws: fighter?.draws ?? 0,
      injury: fighter?.injury ?? null,
      condition: typeof fighter?.condition === 'number' ? fighter.condition : 80,
      schedule: ['balance','practice','promo','rest'].includes(fighter?.schedule) ? fighter.schedule : 'balance',
      intensive: !!fighter?.intensive,
      intensiveWeeks: fighter?.intensiveWeeks || 0,
      lastMatchResult: fighter?.lastMatchResult || null,
    });

    if (result.result === 'success') {
      if (newFunds < result.cost) { Audio.play('error'); alert('資金が足りません！'); return; }
      if (newRoster.filter(f => !f.isRental).length >= (G.rosterCap || 8)) {
        App._queueRosterOverflowSigning({
          source: 'scout',
          fighterId: cand.id,
          fighter: { ...cand },
          cost: result.cost,
          meta: { choice }
        });
        return;
      }
      Audio.play('contract');
      // Clean internal props before adding to roster
      const signed = { ...cand };
      delete signed._notion; delete signed._estimate; delete signed._isSeed;
      delete signed._hasCompetition; delete signed._compMultiplier; delete signed._bidWinRate;
      // v1.3: Record debut event
      let normalizedSigned = normalizeFighterForRoster(signed);
      normalizedSigned = Engine.chronicle.applySpiritToFighter(normalizedSigned, G.chronicle); // Phase 4: 気風 trainCap 補正
      // Phase 3: orgJoinWeek設定
      normalizedSigned.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      // orgTimeline: スカウト獲得で所属変更
      normalizedSigned = Engine.orgTimeline.transfer(normalizedSigned, 'player', G.season, G.week);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'scout' });
      // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ
      { const reg = Engine.mq.registerBignewsHire(G, normalizedSigned); G = reg.state; normalizedSigned = reg.fighter; }
      newRoster.push(normalizedSigned);
      newFunds -= result.cost;
      picks.push(candidateId);
      candidates = candidates.filter(c => c.id !== candidateId);
      log.push(`🔍 スカウト獲得: ${cand.name} [${tierCfg.label}] 契約金${result.cost}万`);
      const signingContext = (choice === 'direct') ? 'direct'
        : (choice === 'pay' || choice === 'gamble') ? 'competition_won'
        : 'direct';
      // ポップアップは showScreen 後に表示（showScreen が dismissAllPopups を呼ぶため）
      var _scoutSigningPopup = { type:'fighter', id: cand.id, name: cand.name,
        tone:'positive', speech: getJoinGreeting(normalizedSigned),
        detail:`${cand.name}が加入しました！(スカウト獲得)` };
      var _scoutSigningFanfare = (signingContext === 'competition_won');
    } else if (result.result === 'lost') {
      Audio.play('error');
      // Lost candidate goes to AI org or freeAgent
      const lostResult = Engine.scout.resolveLostCandidate(rng, { ...cand }, aiOrgs);
      const cleanFighter = { ...lostResult.fighter };
      delete cleanFighter._notion; delete cleanFighter._estimate; delete cleanFighter._isSeed;
      delete cleanFighter._hasCompetition; delete cleanFighter._compMultiplier; delete cleanFighter._bidWinRate;
      if (lostResult.destination === 'aiOrg') {
        const orgData = aiOrgs[lostResult.orgId];
        if (orgData) {
          let aiFighter = normalizeFighterForRoster(cleanFighter);
          // MQ再設計P5 §5.1/§5.4: 大物ルーキー/期待のライバル 判定フラグ(AI団体側スカウト)
          { const reg = Engine.mq.registerBignewsHire(G, { ...aiFighter, orgId: lostResult.orgId }); G = reg.state; aiFighter = reg.fighter; }
          const nextRoster = Engine.rival.dedupeRoster([...(orgData.roster || []), aiFighter]);
          aiOrgs = { ...aiOrgs, [lostResult.orgId]: { ...orgData, roster: nextRoster } };
        }
        const orgInfo = RIVAL_ORGS.find(o => o.id === lostResult.orgId);
        log.push(`🔍 競り負け: ${cand.name}は${orgInfo ? orgInfo.name : '他団体'}へ`);
      } else {
        // 最終重複チェック：同一defIdがFA・ロスターに既に存在しない場合のみ追加
        const alreadyExists = freeAgents.some(f => f.id === cleanFighter.id)
          || newRoster.some(f => f.id === cleanFighter.id);
        if (!alreadyExists) {
          freeAgents.push(normalizeFighterForRoster(cleanFighter));
          log.push(`🔍 競り負け: ${cand.name}はフリーエージェントへ`);
        } else {
          log.push(`🔍 競り負け: ${cand.name}はフリーエージェントへ（重複のため登録省略）`);
        }
      }
      candidates = candidates.filter(c => c.id !== candidateId);
      // ポップアップは showScreen 後に表示（showScreen が dismissAllPopups を呼ぶため）
      var _scoutSigningPopup = { type:'scout', tone:'negative',
        message:`${cand.name}の獲得に失敗…`, detail:'他団体との競合に敗れました' };
    } else if (result.result === 'skipped') {
      // v1.7: 見送り時はリストから削除しない（再検討可能にする）
      log.push(`🔍 スカウト見送り: ${cand.name}`);
    }

    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    if (titleMsg) log.push(titleMsg);
    G = {
      ...G, funds: newFunds, roster: newRoster, freeAgents, aiOrgs, titles,
      scoutCandidates: candidates, scoutPicks: picks, scoutPendingPick: null, gameLog: log,
    };
    // O-02: FA/スカウトで入団 — 既存メンバー全員→新入選手 bond -3〜+3 + 再接触チェック
    if (result.result === 'success' && G.relationships) {
      const previousRelationshipState = { relationships: G.relationships };
      const scoutRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE44, G.season, candidateId));
      const existingIds = G.roster.filter(c => c.id !== candidateId).map(c => c.id);
      G = Engine.relationships.applyFromRoster(G, existingIds, candidateId, { min: -3, max: 3 }, { min: 0, max: 0 }, scoutRelRng);
      const recontactEvents = Engine.relationships.checkRecontact(G, candidateId, existingIds, previousRelationshipState, scoutRelRng);
      if (recontactEvents.length > 0) {
        G = Engine.relationships.applyRecontactEvents(G, recontactEvents);
      }
    }
    refreshAll();
    showScreen('scoutEvent');
    // showScreen が dismissAllPopups を呼ぶ後にポップアップ表示
    if (typeof _scoutSigningPopup !== 'undefined' && _scoutSigningPopup) {
      showEventPopup(_scoutSigningPopup);
      if (_scoutSigningFanfare) Audio.play('fanfare');
    }
  },

  /** 下地(タブ)を今週画面へ戻す。オーバーレイ演出には触れない。
   *  専用フロー(ドラフト/式典/リプレイ)から抜ける出口では必ずこれを通す。
   *  戻し忘れると、状態だけ次へ進んで**画面が前のまま残り**、プレイヤーは同じ
   *  ボタンをもう一度押すことになる(2026-07-31 ドラフト結果で発生)。 */
  returnToWeekScreen() {
    try {
      // showScreen() は使わない。あれは dismissAllPopups() を呼ぶので、
      // 上に載っている演出オーバーレイ(開幕ファンファーレ等)ごと消えてしまう。
      // ここでやりたいのは「下地のタブを今週へ戻す」だけ。
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const weekEl = document.getElementById('screen-week');
      if (weekEl) weekEl.classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const first = document.querySelectorAll('.nav-btn')[0];
      if (first) first.classList.add('active');
      if (typeof renderWeekScreen === 'function') renderWeekScreen();
    } catch (_e) {}
  },

  /** ドラフトが未消化のまま終了処理へ入ろうとしていないか。
   *
   *  他団体の指名は startDraftNegotiation の中の「非選択候補のバックグラウンド処理」
   *  ループにしか無い。scoutEventFinish は候補(scoutCandidates)を捨てて次へ進むので、
   *  **ここを素通りされるとその年は業界全体が新人ゼロ**になる。
   *  実際、週画面の「辞退する →」がこの関数を直接呼んでいたため、
   *  ドラフトへ行かない年は他団体も1人も獲得していなかった(2026-07-31 Keisuke 実機)。
   *
   *  ドラフト終了後の呼び出しでは _finalizeDraft が既に scoutCandidates を畳んでいるので、
   *  この判定には入らない(再帰しない)。
   *  @returns {boolean} 決着処理へ入ったら true(呼び出し側はそこで戻る) */
  _resolveDraftBeforeFinish() {
    if (!G) return false;
    const pending = Array.isArray(G.scoutCandidates) && G.scoutCandidates.length > 0;
    if (!pending) return false;
    if (G._draftNegotiation || G._draftResultPages) return false; // 進行中
    if (!G._draftInterests || typeof startDraftNegotiation !== 'function') return false;
    G = { ...G, _draftSelections: [] };
    startDraftNegotiation();
    return true;
  },

  /** Finish scout event and continue game flow */
  scoutEventFinish() {
    // 自団体が指名しなくても、他団体の指名は行われる。先に決着させてから終了処理へ。
    if (App._resolveDraftBeforeFinish()) return;
    Audio.play('click');
    // ドラフト結果の「▶ 経営画面へ」は onclick から直接呼ばれるので、精算が済んだ後でも
    // もう一度押せてしまう。二度目は scoutsThisSeason を余計に加算し、候補返却を
    // 空振りで回すだけなので、状態には触れず画面だけ戻す(2026-07-31)。
    if (!G.scoutCandidates && !G.scoutPicks && !G._draftResultPages) {
      App.returnToWeekScreen();
      refreshAll();
      return;
    }
    const picksCount = (G.scoutPicks || []).length;
    const log = [...G.gameLog, `🔍 スカウト活動完了: ${picksCount}名獲得`];
    // Clean up any remaining candidates
    let freeAgents = [...G.freeAgents];
    let dormantPool = [...(G.dormantPool || [])];
    // 占有済みIDセット（最終重複チェック用）
    const occupiedIds = Engine.util.collectOccupiedCharacterDefIds(G);
    // scoutCandidates は今から dormantPool に返却する対象なので、ここでは占有扱いから外す
    (G.scoutCandidates || []).forEach(c => occupiedIds.delete(c.id));
    (G.scoutCandidates || []).forEach(c => {
      const clean = { ...c };
      delete clean._notion; delete clean._estimate; delete clean._isSeed;
      delete clean._hasCompetition; delete clean._compMultiplier; delete clean._bidWinRate;
      // 見送り候補は100% dormantPool返却（FA膨張防止）
      if (!occupiedIds.has(clean.id)) {
        if (!dormantPool.some(e => e.id === clean.id)) {
          dormantPool.push({ id: clean.id, age: clean.age || 17 });
        }
        occupiedIds.add(clean.id);
      }
    });
    G = {
      ...G, freeAgents, dormantPool, gameLog: log,
      scoutCandidates: null, scoutPicks: null, scoutMaxPicks: null,
      scoutPendingPick: null, scoutEventType: null,
      scoutsThisSeason: (G.scoutsThisSeason || 0) + 1,
      _draftResultPages: null, _draftResultIdx: 0,
      weekPhase: G.offSeason ? 'offseason' : 'manage',
    };
    // 下地を**先に**今週画面へ戻す。後から戻すと間に合わない —
    // この下の advanceWeek は開幕ファンファーレなどのオーバーレイを出してから帰るので、
    // その後に showScreen を呼ぶと dismissAllPopups が演出ごと消してしまう。
    // 逆に戻さないままだとドラフト結果の画面が残り、オフシーズン最終週では
    // 「経営画面へ」を2回押さないと進まなかった(2026-07-31 実機)。
    App.returnToWeekScreen();
    // If offseason, continue to next offWeek
    if (G.offSeason) {
      App.advanceWeek();
    } else {
      refreshAll();
    }
  },

  // ── 契約更新交渉フロー ───────────────────────────────────────────────────
  handleContractNegotiations() {
    // A contract queue must be single-flight: duplicate UI callbacks otherwise
    // advance separate cursors and can skip negotiations.
    if (App._contractNegotiationSession?.active) {
      // v1.34(§5-D鉄則1の欠落対策): チェーン内で例外が1つ出るとセッションが active の
      // まま死に、以後この入口が全て無言returnして恒久フリーズしていた(リロードでしか
      // 直らない — 2026-08-31プレイヤー報告と一致)。看視は慎重に2段構え:
      //   ・交渉ボタン(.neg-btn)が描画されていれば生存(即return、疑いも解除)
      //   ・DOM不在(ヘッドレス/テスト環境)は常に生存扱い(誤発動ゼロを保証)
      //   ・応答不能が「2回連続の入口到達+1.5秒以上」続いたときだけ死亡と判定し、
      //     セッションを破棄して保存済みカーソル(_contractNegotiationProgress・毎手保存)
      //     から再開する。健全なモーダル遷移の隙間(ms単位)では発動しない。
      // 万一生きたチェーンを誤検知しても、旧セッションのコールバックは isCurrentSession()
      // の同一性検査で無効化され、再開はカーソルから続くため結果の二重適用は起きない。
      const staleSession = App._contractNegotiationSession;
      const hasLiveNegotiationUi = typeof document === 'undefined' || !!document.querySelector('.neg-btn');
      if (hasLiveNegotiationUi) { staleSession._watchdogSuspectAt = 0; return; }
      const now = Date.now();
      if (!staleSession._watchdogSuspectAt) { staleSession._watchdogSuspectAt = now; return; }
      if (now - staleSession._watchdogSuspectAt < 1500) return;
      try { console.warn('[WM] 契約更改チェーンが応答不能と判定されたため、保存済みの進行から再開します'); } catch (_e) {}
      App._contractNegotiationSession = null;
    }
    const negotiations = G.pendingContractNegotiations || [];
    const autoCount = G._contractAutoRenewed || 0;
    if (negotiations.length === 0) {
      // 交渉不要 — transientクリアして次へ
      const {
        pendingContractNegotiations: _,
        _contractAutoRenewed: __,
        _contractNegotiationProgress: ___,
        ...clean
      } = G;
      G = clean;
      try { Storage.autoSave(); } catch (_e) {}
      App.advanceWeek();
      return;
    }

    const session = { active: true };
    App._contractNegotiationSession = session;
    const isCurrentSession = () => App._contractNegotiationSession === session && session.active;
    const finishSession = () => {
      if (!isCurrentSession()) return false;
      session.active = false;
      App._contractNegotiationSession = null;
      return true;
    };

    const season = G.season || 1;
    // 交渉結果とカーソルは画面内のクロージャだけに置かない。途中で再読込・例外終了しても
    // 同じ選手へ同じ昇給/退団処理をもう一度適用せず、次の未処理選手から再開する。
    const savedProgress = G._contractNegotiationProgress;
    const negotiationIds = negotiations.map(neg => neg.fighterId);
    const savedNegotiationIds = Array.isArray(savedProgress?.negotiationIds)
      ? savedProgress.negotiationIds
      : [];
    const sameQueue = savedNegotiationIds.length === negotiationIds.length
      && negotiationIds.every((id, index) => Number(savedNegotiationIds[index]) === Number(id));
    const canResume = savedProgress && Number(savedProgress.season) === Number(season)
      && Number(savedProgress.total) === negotiations.length
      && sameQueue
      && Array.isArray(savedProgress.results)
      && savedProgress.results.length >= (Number(savedProgress.cursor) || 0);
    const salaryBefore = canResume && savedProgress.salaryBefore
      ? { ...savedProgress.salaryBefore }
      : Object.fromEntries(negotiations.map(neg => {
          const fighter = (G.roster || []).find(f => f.id === neg.fighterId);
          return [neg.fighterId, fighter ? Engine.util.getSalary(fighter, G.titles || {}) : null];
        }));
    const results = canResume && Array.isArray(savedProgress.results)
      ? [...savedProgress.results]
      : [];
    const preNegotiationRoster = (G.roster || []).map(f => ({ ...f }));
    const preNegotiationTitles = G.titles || {};
    let idx = canResume
      ? Math.max(0, Math.min(negotiations.length, Number(savedProgress.cursor) || 0))
      : 0;

    const persistProgress = () => {
      if (!isCurrentSession()) return false;
      G = {
        ...G,
        _contractNegotiationProgress: {
          season,
          total: negotiations.length,
          negotiationIds: [...negotiationIds],
          cursor: idx,
          results: [...results],
          salaryBefore,
        },
      };
      try { Storage.autoSave(); } catch (_e) {}
      return true;
    };
    if (!canResume) persistProgress();

    // セッションロックと再開点を確定してから社長室へ移る。画面遷移中の再描画や古い
    // onclick が同じ交渉チェーンをもう一本作る余地を残さない。
    showScreen('shachoshitsu');

    function processNext() {
      if (!isCurrentSession()) return;
      if (idx >= negotiations.length) {
        // 全交渉完了 → 結果サマリー
        const salaryChanges = App._buildContractRenewalSalaryChanges(
          results,
          preNegotiationRoster,
          preNegotiationTitles,
          G,
          salaryBefore
        );
        showContractResultModal(results, salaryChanges, () => {
          if (!finishSession()) return;
          // weekPhase を offseason に戻す（ナビロック解除 + advanceWeek の再ループ防止）
          const {
            pendingContractNegotiations: _,
            _contractAutoRenewed: __,
            _contractNegotiationProgress: ___,
            ...clean
          } = G;
          G = { ...clean, weekPhase: 'offseason', gameLog: [...(G.gameLog || []), `📋 契約更新完了: 残留${results.filter(r => r.type === 'stay').length}名 退団${results.filter(r => r.type === 'depart').length}名`] };
          try { Storage.autoSave(); } catch (_e) {}
          // 今週画面に戻ってから次週へ進める（社長室の交渉カードに留まらないように）
          showScreen('week');
          App.advanceWeek();
        });
        return;
      }

      const neg = negotiations[idx];
      // v2.0 §6.3: 突発退団 — 選択肢なし、即退団
      if (neg.attitude === 'sudden_departure') {
        showContractSuddenDepartureModal(neg, G, () => {
          if (!isCurrentSession()) return;
          const resolveRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 2));
          const result = Engine.contract.resolveNegotiation(resolveRng, G, neg, 0);
          G = result.state;
          App._consumeBetrayalNews(neg);
          results.push(result.result);
          idx++;
          persistProgress();
          processNext();
        });
        return;
      }
      showContractNegotiationModal(neg, idx, negotiations.length, G, (choiceIdx) => {
        if (!isCurrentSession()) return;
        App._resolveContractChoice(neg, choiceIdx, results, () => {
          if (!isCurrentSession()) return;
          processNext();
        }, () => {
          if (!isCurrentSession()) return;
          idx++;
          persistProgress();
        });
      });
    }

    // サマリー画面 → 交渉開始
    showContractSummaryModal(negotiations.slice(idx), autoCount, season, () => processNext());
  },

  _buildContractRenewalSalaryChanges(results, preRoster, preTitles, stateAfterNegotiation, salaryBefore) {
    const changes = [];
    const seen = new Set();
    const afterRoster = stateAfterNegotiation?.roster || [];
    const afterTitles = stateAfterNegotiation?.titles || {};
    const resultByFighterId = new Map(
      (results || [])
        .filter(result => result && result.type === 'stay')
        .map(result => [result.fighterId, result])
    );

    for (const result of results || []) {
      if (!result || result.type !== 'stay' || seen.has(result.fighterId)) continue;
      seen.add(result.fighterId);

      const before = preRoster.find(f => f.id === result.fighterId);
      const after = afterRoster.find(f => f.id === result.fighterId);
      if (!before || !after) continue;

      const persistedOldSalary = salaryBefore && Number(salaryBefore[result.fighterId]);
      const oldSalary = Number.isFinite(persistedOldSalary)
        ? persistedOldSalary
        : Engine.util.getSalary(before, preTitles);
      const newSalary = Engine.util.getSalary(after, afterTitles);
      const actualDelta = newSalary - oldSalary;
      const negotiatedDelta = resultByFighterId.get(result.fighterId)?.salaryDelta || 0;
      const baselineDelta = actualDelta - negotiatedDelta;
      if (actualDelta === 0 && negotiatedDelta === 0 && baselineDelta === 0) continue;

      changes.push({
        fighterId: result.fighterId,
        fighterName: result.fighterName,
        oldSalary,
        newSalary,
        salaryDelta: actualDelta,
        negotiatedDelta,
        baselineDelta,
      });
    }

    return changes;
  },

  _resolveContractChoice(neg, choiceIdx, results, onDone, onResolved) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 2));
    const result = Engine.contract.resolveNegotiation(resolveRng, G, neg, choiceIdx);
    G = result.state;
    App._consumeBetrayalNews(neg);

    if (result.result.type === 'listen') {
      // 理由を聞く → サブ選択
      showContractListenModal(neg, result.reactionDialogue, G, (subChoice) => {
        const subRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 3));
        const subResult = Engine.contract.resolveNegotiation(subRng, G, neg, 1, subChoice);
        G = subResult.state;
        App._consumeBetrayalNews(neg);
        results.push(subResult.result);
        if (onResolved) onResolved(subResult.result);
        if (subResult.result.type === 'stay') Audio.play('notify');
        else if (subResult.result.type === 'depart') Audio.play('defeat');
        showContractReactionModal(neg, subResult.reactionDialogue, onDone);
      });
      return;
    }

    // 結果に応じたSE
    if (result.result.type === 'stay') Audio.play('notify');
    else if (result.result.type === 'depart') Audio.play('defeat');

    // 移籍志願に発展した場合 → 移籍志願として再交渉
    if (result.result.escalated) {
      Audio.play('tension_hit');
      const escNeg = { ...neg, attitude: 'transfer' };
      showContractReactionModal(neg, result.reactionDialogue, () => {
        showContractNegotiationModal(escNeg, results.length, results.length + 1, G, (escChoice) => {
          App._resolveContractChoice(escNeg, escChoice, results, onDone, onResolved);
        });
      });
      return;
    }

    results.push(result.result);
    if (onResolved) onResolved(result.result);
    showContractReactionModal(neg, result.reactionDialogue, onDone);
  },

  // 引退勧告アクション
  doRetireAdvise(fighterId) {
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xAD71, fighterId));
    const result = Engine.retirement.advise(rng, G, fighterId);
    if (!result._pendingRetireAdviseResult) return;
    const { accepted, fighter, line } = result._pendingRetireAdviseResult;
    const { _pendingRetireAdviseResult: _, ...cleanG } = result;
    G = cleanG;
    Storage.autoSave();
    refreshAll();
    // 結果ポップアップ表示
    showRetireAdviseResultPopup(accepted, fighter, line);
  },

  // 引き留めアクション（引退ポップアップから呼ばれる）
  // 引退はまだ commit されていない（roster に居る）— 本人を直接更新する
  doRetainFighter(fighterId) {
    const fighter = (G.roster || []).find(c => c.id === fighterId);
    if (!fighter) { closeRetirementPopup(); return; }
    // 引き留め上限チェック
    if ((fighter.retainCount || 0) >= 2) { closeRetirementPopup(); return; }
    const retainLine = Engine.retirement.selectRetainLine(fighter, G);
    let updatedFighter = {
      ...fighter,
      wear: (fighter.wear || 0) + 10,
      retainCount: (fighter.retainCount || 0) + 1,
      retainInjuryBonus: ((fighter.retainInjuryBonus || 0) + 0.05),
      lastRun: false,
      lastRunWeek: null,
    };
    // Phase E: 引退撤回 history
    updatedFighter = Engine.career.addEvent(updatedFighter, { type: 'retireRetracted', season: G.season, week: G.week, orgName: G.orgName || 'プレイヤー団体' });
    G = { ...G, roster: G.roster.map(c => c.id === fighterId ? updatedFighter : c) };
    // O-13: 引退撤回 — 本人→団体全体 bond +5〜+8, 同僚全員→本人 bond +2〜+3
    if (G.relationships) {
      const retainRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE46, G.season, fighterId));
      const rosterIds = G.roster.filter(c => c.id !== fighterId).map(c => c.id);
      G = Engine.relationships.applyToRoster(G, fighterId, rosterIds, { min: 5, max: 8 }, { min: 0, max: 0 }, retainRelRng);
      G = Engine.relationships.applyFromRoster(G, rosterIds, fighterId, { min: 2, max: 3 }, { min: 0, max: 0 }, retainRelRng);
    }
    // commit フェーズで除外するためのフラグ
    App._retainedIds = App._retainedIds || new Set();
    App._retainedIds.add(fighterId);
    Storage.autoSave();
    refreshAll();
    closeRetirementPopup();
    // 引き留め成功セリフ表示
    showEventPopup({
      type: 'fighter', id: fighter.id, name: fighter.name, tone: 'positive',
      speech: retainLine, detail: `${fighter.name}の引き留めに成功しました（引き留め ${updatedFighter.retainCount}/2回目）`,
    });
  },

  // 社長室統合 Phase B: 解雇面談を開始（選手ポップアップの解雇ボタン → 社長室へ）
  startReleaseInterview(charId) {
    const fighter = G.roster.find(c => c.id === charId);
    if (!fighter) return;

    // カード登録中チェック（releaseFighter と同じ条件）
    const inCard = G.showCard.some(m => m.left === charId || m.right === charId);
    if (inCard) return;

    // 口調アーキタイプ別セリフ選択（決定論的RNG）
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xF1E2, charId));
    const archetype = fighter.archetype || 'standard';
    const lines = RELEASE_INTERVIEW_LINES[archetype] || RELEASE_INTERVIEW_LINES.standard;
    const dialogue = lines[Engine.rng.int(rng, 0, lines.length - 1)];

    // 面談中フラグをセット → 社長室画面に遷移
    G = { ...G, _releaseInterviewTarget: charId };
    showScreen('shachoshitsu');
    renderShachoshitsuReleaseInterview(fighter, dialogue);
    Audio.play('event');
  },

  // 解雇面談: 実行確定
  confirmRelease(charId) {
    G = { ...G, _releaseInterviewTarget: null };
    App.releaseFighter(charId);
    // releaseFighter内でrefreshAll+showEventPopupが呼ばれる
    // 社長室通常モードへ戻る
    renderShachoshitsu();
  },

  // 解雇面談: キャンセル
  cancelReleaseInterview() {
    G = { ...G, _releaseInterviewTarget: null };
    renderShachoshitsu();
    Audio.play('click');
  },

  // 社長室統合 Phase C: 内部タブ切替
  switchShachoshitsuTab(tabId) {
    G._shachoshitsuTab = tabId;
    G._shachoshitsuScoutPage = 0;
    renderShachoshitsu();
    Audio.play('click');
  },

  // 社長室統合 Phase C: スカウトページ送り
  shachoshitsuScoutPage(page) {
    G._shachoshitsuScoutPage = Math.max(0, page);
    renderShachoshitsu();
    Audio.play('click');
  },

  // Release a fighter
  releaseFighter(charId) {
    const idx = G.roster.findIndex(c => c.id === charId);
    if (idx < 0) return;
    Audio.play('spend');
    const c = G.roster[idx];
    const cName = c.name;
    const cId = c.id;
    // O-07: 解雇 — roster除外前に関係値更新（firing-grudge-spec-v0.1）
    let _firingGrudge = null;
    if (G.relationships) {
      const releaseRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE45, G.season, charId));
      const colleagueIds = G.roster.filter(f => f.id !== charId).map(f => f.id);
      // 解雇者 → 残留組: ティア別（親友/元ライバル/一般）+ 解雇者の性格バイアス
      const firingResult = Engine.relationships.applyFiringGrudge(G, c, releaseRelRng);
      G = firingResult.state;
      _firingGrudge = firingResult.grudge;
      // 残留者 → 解雇者: 性格別 bond（同情・複雑な感情、過度に動かさない）
      for (const cid of colleagueIds) {
        const colleague = G.roster.find(f => f.id === cid);
        const p = colleague?.personality || 'normal';
        let bMin, bMax;
        if (p === 'bold' || p === 'emotional') { bMin = 0; bMax = 2; }
        else if (p === 'earnest' || p === 'quiet') { bMin = -2; bMax = 0; }
        else { bMin = -1; bMax = 1; } // easygoing, normal
        G = Engine.relationships.applyFromRoster(G, [cid], charId, { min: bMin, max: bMax }, { min: 0, max: 0 }, releaseRelRng);
      }
    }
    const newRoster = G.roster.filter((_, i) => i !== idx);
    const newShowCard = App._removeFighterFromShowCard(G.showCard, charId);
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster, showCard: newShowCard });
    const log = [...G.gameLog, `📤 ${c.name}を解雇`];
    if (titleMsg) log.push(titleMsg);
    // Phase E: 解雇 history を fighter に push
    let cWithRelease = Engine.career.addEvent(c, { type: 'release', season: G.season, week: G.week, fromOrg: G.orgName || 'プレイヤー団体' });
    // firing-grudge-spec-v0.1: 解雇キャラに遺恨フラグを付与（所属移動後も保持）
    if (_firingGrudge) cWithRelease = { ...cWithRelease, grudge: _firingGrudge };
    const claimResult = Engine.rival.claimDepartedStar(
      Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xD75A, G.season, G.week, charId)),
      { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log },
      cWithRelease,
      { fromOrgName: G.orgName || 'player', via: 'release_claim' }
    );
    if (claimResult.claimed) {
      log.push(`Transfer: ${c.name} -> ${claimResult.orgName}${claimResult.ejected ? ` / out: ${claimResult.ejected.name}` : ''}`);
      G = { ...claimResult.state, gameLog: log };
    } else if (Engine.util.canAddToFA(G)) {
      const releasedFighter = Engine.orgTimeline.transfer(cWithRelease, 'fa', G.season, G.week);
      G = { ...G, roster: newRoster, showCard: newShowCard, freeAgents: [...G.freeAgents, releasedFighter], coachAssign: newCoachAssign, titles, gameLog: log };
    } else {
      G = { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log };
      G = Engine.util.redirectToDormantPool(G, cWithRelease);
    }
    closeFighterPopup();
    refreshAll();
    showEventPopup({ type:'fighter', id:cId, name:cName, tone:'negative',
      speech: getTraitQuote('release', c), detail:`${cName}が団体を去りました` });
  },

  // ── タイトル奪還挑戦状（Phase 4） ─────────────────────────────────────
  openReclaimDialog() {
    if (!G.titles?.world?.externalHolder) return;
    if (!Engine.title.canIssueReclaim(G, 'world')) {
      Audio.play('error'); alert('現在は挑戦状を発行できません。'); return;
    }
    const eligible = G.roster.filter(c => !c.injury && !c.isRental && !c.forcedRest);
    if (eligible.length === 0) {
      Audio.play('error'); alert('挑戦可能な選手がいません。'); return;
    }
    const eh = G.titles.world.externalHolder;
    const heldByOrg = G.aiOrgs?.[eh.orgId];
    const heldByOrgName = heldByOrg?.name || eh.orgId;
    const exChamp = heldByOrg?.roster?.find(c => c.id === eh.fighterId);
    const exChampName = exChamp?.name || `元王者#${eh.fighterId}`;

    let dlg = document.getElementById('reclaimDialog');
    if (dlg) dlg.remove();
    dlg = document.createElement('div');
    dlg.id = 'reclaimDialog';
    dlg.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center';
    const opts = eligible
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
      .map(c => `<option value="${c.id}">${c.name}（OVR ${Engine.util.ov(c)}）</option>`)
      .join('');
    dlg.innerHTML = `
      <div style="background:#1a1a24;border:1px solid #d4607a;border-radius:8px;padding:20px 24px;width:90%;max-width:480px;color:#eee">
        <div style="font-size:16px;font-weight:700;color:#ffb3c1;margin-bottom:10px">⚔ 奪還挑戦状の発行</div>
        <div style="font-size:12px;color:#bbb;line-height:1.7;margin-bottom:14px">
          <strong>${heldByOrgName}</strong> の <strong>${exChampName}</strong> に対して挑戦状を叩きつけます。<br>
          次の興行のメインで決戦。敗北時は12週間再挑戦できません。
        </div>
        <div style="margin-bottom:14px">
          <label style="font-size:12px;color:#aaa;display:block;margin-bottom:6px">挑戦者を選ぶ</label>
          <select id="reclaimChallengerSelect" style="width:100%;padding:8px;background:#0f0f18;border:1px solid #444;border-radius:4px;color:#eee;font-size:13px">${opts}</select>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="App._closeReclaimDialog()" style="padding:8px 16px;background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer">キャンセル</button>
          <button onclick="App.confirmReclaim()" style="padding:8px 16px;background:linear-gradient(135deg,#d4607a,#a8334d);border:none;color:#fff;border-radius:4px;cursor:pointer;font-weight:600">挑戦状を発行</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  },
  _closeReclaimDialog() {
    const dlg = document.getElementById('reclaimDialog');
    if (dlg) dlg.remove();
  },
  confirmReclaim() {
    const sel = document.getElementById('reclaimChallengerSelect');
    if (!sel) return;
    const challengerId = parseInt(sel.value, 10);
    if (!challengerId || isNaN(challengerId)) return;
    if (!Engine.title.canIssueReclaim(G, 'world')) { Audio.play('error'); return; }
    G = Engine.title.recordReclaimAttempt(G, 'world', challengerId);
    G = { ...G, _pendingReclaim: { titleType: 'world', challengerId } };
    Audio.play('select');
    App._closeReclaimDialog();
    refreshAll();
    const c = G.roster.find(f => f.id === challengerId);
    const eh = G.titles.world.externalHolder;
    const orgName = Engine.contract._getOrgName(eh.orgId, G);
    // 業界ニュース: 奪還挑戦状
    App._pushIndustryNews({
      type: 'reclaimChallenge',
      characterId: challengerId,
      data: {
        challengerName: c?.name || '挑戦者',
        fromOrg: G.orgName || 'プレイヤー団体',
        toOrg: orgName,
      },
    });
    showEventPopup({
      type: 'fighter', id: challengerId,
      name: c?.name || '挑戦者', tone: 'positive',
      message: `📜 ${c?.name} が ${orgName} へ挑戦状を叩きつけた！`,
      detail: `次の興行のメインで王座奪還の決戦が行われる。`,
    });
  },
  // Phase 6: 契約裏切り → 新聞ヘッドライン振り分け
  _consumeBetrayalNews(neg) {
    if (!G._lastBetrayalSummary) return;
    const sm = G._lastBetrayalSummary;
    let type;
    if (sm.isChampion && sm.beltCarried) type = 'contractBetrayalChampCarry';
    else if (sm.isChampion) type = 'contractBetrayalChampLeave';
    else if (sm.isRivalOrg) type = 'contractBetrayalRivalOrg';
    else if (sm.isAce) type = 'contractBetrayalAce';
    else type = 'contractBetrayalGeneric';
    const fromOrg = G.orgName || 'プレイヤー団体';
    const toOrg = Engine.contract._getOrgName(sm.toOrgId, G);
    App._pushNewsEvent({
      type, characterId: sm.departingId,
      data: { name: sm.departingName || neg?.fighterName || '選手', fromOrg, toOrg },
    });
    const { _lastBetrayalSummary, _lastBetrayalBeltCarried, ...rest } = G;
    G = rest;
  },

  cancelReclaim() {
    if (!G._pendingReclaim) return;
    if (!confirm('挑戦状を取り下げますか？（今シーズンの挑戦履歴は残ります）')) return;
    // pending challenge を取り下げ：reclaimChallenges から最新の未解決エントリを除去
    const newChallenges = (G.reclaimChallenges || []).filter((c, i, arr) => {
      // 直近の pending を1件だけ削除
      const lastPendingIdx = arr.map((cc, ii) => cc.result == null && cc.titleType === 'world' ? ii : -1)
        .filter(ii => ii >= 0).pop();
      return i !== lastPendingIdx;
    });
    const { _pendingReclaim, ...rest } = G;
    G = { ...rest, reclaimChallenges: newChallenges };
    Audio.play('select');
    refreshAll();
  },

  // Hire coach
  hireCoach(coachId) {
    const coach = ALL_COACHES.find(c => c.id === coachId);
    if (!coach) return;
    // 外部招聘(_inviteBuff)で指導中のコーチは雇用不可(専属と雇用の同時登録・二重支払いの防止)
    if ((G.roster || []).some(f => f._inviteBuff && f._inviteBuff.coachId === coachId)) {
      Audio.play('error'); alert(`${coach.name}は現在、外部コーチとして招聘期間中のため雇用できません`); return;
    }
    const maxCoaches = Engine.coach.getMaxCoaches(G);
    if (G.coaches.length >= maxCoaches) { Audio.play('error'); alert(`コーチは現在最大${maxCoaches}名まで（枠拡張で増加）`); return; }
    // A級雇用条件: 4枠目開放済み
    if (coach.grade === 'A' && (G.coachSlots || 1) < 4) { Audio.play('error'); alert('A級コーチの雇用には4枠目の開放が必要です'); return; }
    const fee = coach.hireFee || COACH_HIRE_FEE;
    if (G.funds < fee) { Audio.play('error'); alert('資金が足りません！'); return; }
    // 社長室 Phase 5: コーチ雇用は「コーチ雇用決裁書」(決裁枠2)を消費する
    const hireDoc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.hireCoach : null;
    const dpCost = (hireDoc && hireDoc.decisionCost) || 2;
    if ((G.decisionPoints || 0) < dpCost) {
      Audio.play('error');
      alert(`コーチ雇用には決裁枠 ⚡${dpCost} が必要です（現在: ⚡${G.decisionPoints || 0}）`);
      return;
    }
    G = {
      ...G,
      funds: G.funds - fee,
      decisionPoints: Math.max(0, (G.decisionPoints || 0) - dpCost),
      coaches: [...G.coaches, coachId],
      availableCoaches: G.availableCoaches.filter(id => id !== coachId),
      coachAssign: { ...G.coachAssign, [coachId]: [] },
      gameLog: [...G.gameLog, `🎓 ${coach.name}をコーチとして雇用（雇用費: ${fee}万、決裁枠 -${dpCost}）`]
    };
    Audio.play('link');
    refreshAll();
    showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'positive',
      speech: pickCoachVoiceQuote('coachHire', coachId), detail:`🎓 ${coach.name}がコーチとして加入！（雇用費: ${fee}万、決裁枠 -${dpCost}）` });
  },

  // Expand coach slot
  expandCoachSlot() {
    const result = Engine.coach.expandSlot(G);
    if (result.error === 'max_slots') { Audio.play('error'); alert('すでに全枠を開放しています'); return; }
    if (result.error === 'funds_insufficient') { Audio.play('error'); alert(`資金が足りません（必要: ${result.cost}万）`); return; }
    G = {
      ...G,
      coachSlots: result.coachSlots,
      funds: result.funds,
      gameLog: [...G.gameLog, `🎓 コーチ枠を${result.coachSlots}枠に拡張（投資: ${result.cost}万）`]
    };
    // 出ていく金なので MG04 支出。ここだけ MG03 収入(coin)が残っていた(2026-07-27)
    Audio.play('spend');
    refreshAll();
    const slotNum = result.coachSlots;
    const msgs = {
      2: '道場に新しいトレーニングスペースを増設した。',
      3: '専用のコーチルームを設置。複数のコーチが同時に指導できる環境が整った。',
      4: '最高級のトレーニング施設を完備。伝説級のコーチを招聘する準備が整った。'
    };
    showEventPopup({ type:'system', tone:'positive',
      message: msgs[slotNum] || 'コーチ枠を拡張しました。',
      detail: `🎓 コーチ枠が${slotNum}枠に拡張されました！（投資: ${result.cost}万）${slotNum >= 4 ? '\n⭐ A級コーチの雇用が解禁されました！' : ''}` });
  },

  // Fire coach
  fireCoach(coachId) {
    const coach = ALL_COACHES.find(c => c.id === coachId);
    const newAssign = { ...G.coachAssign };
    delete newAssign[coachId];
    G = {
      ...G,
      coaches: G.coaches.filter(id => id !== coachId),
      coachAssign: newAssign,
      gameLog: [...G.gameLog, `❌ ${coach?.name}を解雇`]
    };
    Audio.play('unlink');
    refreshAll();
    if (coach) showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'negative',
      speech: pickCoachVoiceQuote('coachFire', coachId), detail:`${coach.name}がチームを去りました` });
  },

  // Assign character to coach
  assignToCoach(coachId, charId) {
    const unassigned = Engine.coach.unassignFromCoach(G, charId);
    const { coachAssign, success } = Engine.coach.assignToCoach({ ...G, coachAssign: unassigned }, coachId, charId);
    if (!success) { Audio.play('error'); alert('このコーチのアサイン枠が満員です'); return; }
    Audio.play('link');
    G = { ...G, coachAssign };
    refreshAll();
  },

  // Unassign character from coach
  unassignFromCoach(charId) {
    G = { ...G, coachAssign: Engine.coach.unassignFromCoach(G, charId) };
    Audio.play('unlink');
    refreshAll();
  },

  // Show preparation
  startShowPrep() {
    if (App.repairProgressionState('startShowPrep')) {
      try { Storage.autoSave(); } catch (_e) {}
      refreshAll();
    }
    if (G.offSeason || G.weekPhase !== 'manage' || !isRegularShowWeek(G.week)) {
      Audio.play('error');
      if (Engine.util.isSeasonSpecialEventWeek(G.week)) {
        showToast('今週は季節の特別興行です。通常興行は行えません。');
      }
      return;
    }
    Audio.play('crowd');
    G = {
      ...G,
      weekPhase: 'showPrep',
      showCard: [],  // renderShowPrep の pad/trim で会場に応じた枠数に自動調整
      showVenue: 0
    };
    refreshAll();
  },

  // Set show venue
  setShowVenue(venueIdx) {
    // orgPop リバランス v1.1 §5: ドーム年1回制限
    if (venueIdx === 9 && (G.domeShowsThisSeason || 0) >= 1) { Audio.play('error'); return; }
    G = { ...G, showVenue: venueIdx, showCard: Engine.util.normalizeShowCardForVenue(G.showCard, G.week, venueIdx) };
    Audio.play('venue');
    renderShowPrep();
  },

  // Set show card slot
  setShowCardSlot(slotIndex, side, newId) {
    if (G.showCard?.[slotIndex]?._unifiedTitleLocked) {
      Audio.play('error'); showToast('🌐 全国統一王座戦の対戦者は固定です', 3000); return;
    }
    if (G.showCard?.[slotIndex]?._crMatchLocked) {
      Audio.play('error'); showToast('⚔ 挑戦試合の上位3枠は固定です', 3000); return;
    }
    newId = +newId;
    const reservedCRIds = typeof getChallengeUnavailableIds === 'function'
      ? getChallengeUnavailableIds()
      : new Set(Engine.challengeRequest?.getScheduledCard?.(G)?.reservedIds || []);
    if (newId > 0 && reservedCRIds.has(newId)) {
      Audio.play('error'); showToast('⚔ この選手は挑戦試合への出場が決まっています', 3000); return;
    }
    const newCard = G.showCard.map(s => ({ ...s }));
    // Swap: if newId is already used in another slot, exchange fighters
    if (newId > 0) {
      for (let i = 0; i < newCard.length; i++) {
        if (i === slotIndex) continue;
        if (newCard[i].left === newId || newCard[i].right === newId) {
          const foundSide = newCard[i].left === newId ? 'left' : 'right';
          newCard[i][foundSide] = newCard[slotIndex][side] || 0;
          // Clear title if swapped-from slot became invalid
          if (newCard[i].isTitle && (!newCard[i].left || !newCard[i].right || newCard[i].left === newCard[i].right)) {
            newCard[i].isTitle = false;
          }
          break;
        }
      }
    }
    newCard[slotIndex][side] = newId;
    if (newId > 0 && newCard[slotIndex].left === newCard[slotIndex].right) {
      newCard[slotIndex][side === 'left' ? 'right' : 'left'] = 0;
    }
    if (newCard[slotIndex].isTitle && (!newCard[slotIndex].left || !newCard[slotIndex].right)) {
      newCard[slotIndex].isTitle = false;
    }
    // タイトルスロットにチャンピオンがいなくなった場合はisTitleをクリア
    // （スワップ等でチャンピオンが移動した後にゴーストisTitleが残るバグを防ぐ）
    const champIdForTitleCheck = G.titles?.world?.championId;
    if (champIdForTitleCheck) {
      for (let i = 0; i < newCard.length; i++) {
        if (newCard[i].isTitle && newCard[i].left !== champIdForTitleCheck && newCard[i].right !== champIdForTitleCheck) {
          newCard[i] = { ...newCard[i], isTitle: false };
        }
      }
    }
    const sanitizedCard = Engine.title.sanitizeShowCardTitles({ ...G, showCard: newCard }, newCard);
    G = { ...G, showCard: sanitizedCard };
    Audio.play('cardPlace');
    renderShowPrep();
  },

  // Clear show card (resets all slots including tag entries to empty singles)
  clearShowCard() {
    const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
    const emptyCard = [];
    for (let i = 0; i < maxMatches; i++) emptyCard.push({left: 0, right: 0, isTitle: false});
    G = { ...G, showCard: emptyCard };
    // 「全クリア」は自由枠だけを空にする。来訪済みの全国統一王座戦まで消すと、
    // 編成画面では枠が空いたように見えて開催時に再び割り込み、別試合を落としてしまう。
    if (typeof stageIncomingUnifiedTitleCard === 'function') stageIncomingUnifiedTitleCard();
    Audio.play('cardRemove');
    renderShowPrep();
  },

  // シングル2枠を合体してタッグ1枠に（選手引き継ぎ）
  mergeToTagSlot(idx) {
    const card = [...G.showCard];
    if (idx < 0 || idx + 1 >= card.length) return;
    if (card[idx]?._crMatchLocked || card[idx + 1]?._crMatchLocked || card[idx]?._unifiedTitleLocked || card[idx + 1]?._unifiedTitleLocked) {
      Audio.play('error'); showToast('⚔ 挑戦試合の固定枠はタッグに変更できません', 3000); return;
    }
    if (idx === 0) { Audio.play('error'); showToast('メインイベントはシングルマッチのみです'); return; }
    if (card[idx].matchType === 'tag' || card[idx + 1].matchType === 'tag') {
      Audio.play('error'); showToast('タッグ枠同士は合体できません'); return;
    }
    const s1 = card[idx], s2 = card[idx + 1];
    // 左コーナー同士→チームA、右コーナー同士→チームB
    const tagSlot = {
      matchType: 'tag',
      teamA: { fighter1: s1.left || 0, fighter2: s2.left || 0 },
      teamB: { fighter1: s1.right || 0, fighter2: s2.right || 0 },
    };
    card.splice(idx, 2, tagSlot);
    G = { ...G, showCard: card };
    Audio.play('tagMerge');
    renderShowPrep();
  },

  removeTagSlot(idx) {
    const card = [...G.showCard];
    if (!card[idx] || card[idx].matchType !== 'tag') return;
    const tag = card[idx];
    // タッグ→シングル2枠に分割（選手を保持）
    const s1 = { left: tag.teamA.fighter1 || 0, right: tag.teamB.fighter1 || 0, isTitle: false };
    const s2 = { left: tag.teamA.fighter2 || 0, right: tag.teamB.fighter2 || 0, isTitle: false };
    card.splice(idx, 1, s1, s2);
    G = { ...G, showCard: card };
    Audio.play('cardRemove');
    renderShowPrep();
  },

  setTagSlotFighter(slotIdx, team, pos, fighterId) {
    fighterId = +fighterId;
    const reservedCRIds = typeof getChallengeUnavailableIds === 'function'
      ? getChallengeUnavailableIds()
      : new Set(Engine.challengeRequest?.getScheduledCard?.(G)?.reservedIds || []);
    if (fighterId > 0 && reservedCRIds.has(fighterId)) {
      Audio.play('error'); showToast('⚔ この選手は挑戦試合への出場が決まっています', 3000); return;
    }
    const newCard = G.showCard.map(s => s.matchType === 'tag'
      ? { ...s, teamA: { ...s.teamA }, teamB: { ...s.teamB } }
      : { ...s });
    const tagSlot = newCard[slotIdx];
    if (!tagSlot || tagSlot.matchType !== 'tag') return;

    // Swap: if fighterId is already used in another slot
    if (fighterId > 0) {
      for (let i = 0; i < newCard.length; i++) {
        if (i === slotIdx) continue;
        const m = newCard[i];
        if (m.matchType === 'tag') {
          for (const t of ['teamA', 'teamB']) {
            for (const p of ['fighter1', 'fighter2']) {
              if (m[t][p] === fighterId) { m[t][p] = tagSlot[team][pos] || 0; }
            }
          }
        } else {
          if (m.left === fighterId) { m.left = tagSlot[team][pos] || 0; }
          if (m.right === fighterId) { m.right = tagSlot[team][pos] || 0; }
        }
      }
      // Also check within the same tag slot for duplicates
      for (const t of ['teamA', 'teamB']) {
        for (const p of ['fighter1', 'fighter2']) {
          if (t === team && p === pos) continue;
          if (tagSlot[t][p] === fighterId) { tagSlot[t][p] = tagSlot[team][pos] || 0; }
        }
      }
    }
    tagSlot[team][pos] = fighterId;
    G = { ...G, showCard: newCard };
    Audio.play('cardPlace');
    renderShowPrep();
  },

  // Toggle title match
  toggleTitleMatch(slotIndex) {
    if (!G.showCard || !G.showCard[slotIndex]) {
      // 呼び出し元(toggleTitle)でも見ているが、ここが最後の砦。落とさない。
      Audio.play('error');
      if (typeof renderShowPrep === 'function') renderShowPrep();
      return;
    }
    if (G.showCard?.[slotIndex]?._crMatchLocked || G.showCard?.[slotIndex]?._unifiedTitleLocked) {
      Audio.play('error'); showToast('⚔ 挑戦試合の固定枠はタイトル戦に変更できません', 3000); return;
    }
    const newVal = !G.showCard[slotIndex].isTitle;
    // ONにするときは必ず他スロットのisTitleをクリア（チャンピオン在籍/空位どちらも）
    const nextCard = G.showCard.map((slot, i) => {
      if (i === slotIndex) return { ...slot, isTitle: newVal };
      if (newVal) return { ...slot, isTitle: false };
      return slot;
    });
    G = { ...G, showCard: Engine.title.sanitizeShowCardTitles({ ...G, showCard: nextCard }, nextCard) };
    Audio.play(newVal ? 'specialMatch' : 'deselect');
    renderShowPrep();
  },

  // ═══ BATTLE ENGINE INTEGRATION (v0.86) ═══
  // Show match preview instead of instant execution
  executeShow() {
    if (App.repairProgressionState('executeShow')) {
      try { Storage.autoSave(); } catch (_e) {}
      refreshAll();
    }
    // v2.0: weekPhase guard — settled/weekSummary等の非興行フェーズでは実行不可
    if (G.offSeason || !['manage', 'showPrep'].includes(G.weekPhase)) { Audio.play('error'); return; }
    // Calendar invariant: weeks 12/24/36/48 belong exclusively to the
    // seasonal special event, regardless of cancellation/completion state.
    if (!isRegularShowWeek(G.week)) {
      Audio.play('error');
      showToast(Engine.util.isSeasonSpecialEventWeek(G.week)
        ? '今週は季節の特別興行です。通常興行は行えません。'
        : '今週は通常興行を開催できる週ではありません。');
      return;
    }
    // An accepted away challenge must be resolved before the local show.  The
    // old post-show branch temporarily mixed opponent guests into a completed
    // local-show state and could persist them if result processing failed.
    // Route both buttons through the same transactional away-show flow.
    // 同一週の挑戦系コンテナは1つまで(2026-08-13): 受け挑戦(果たし状/挑戦状/統一王座迎撃)が
    // 先着の週は遠征を見送る(予約は消さず次の通常興行週へ)。逆に遠征側が先着・消化済みの
    // 週は、下の受け側予約ブロックが持ち越しになる。遠征を1本消化済みの週は2本目の遠征も見送る。
    const weeklyChallengeSide = Engine.challengeRequest?.resolveWeeklyChallengeContainer?.(G) || null;
    const awayRanThisWeek = Engine.challengeRequest?.hasAwayRunThisWeek?.(G) || false;
    if (!awayRanThisWeek && weeklyChallengeSide !== 'incoming' && G._pendingUnifiedAwayMatch && Engine.challengeRequest?.isEligibleHomeShow?.(G)) {
      App.beginUnifiedTitleAwayTravel();
      return;
    }
    if (!awayRanThisWeek && weeklyChallengeSide !== 'incoming' && G._pendingAwayChallengeMatch && Engine.challengeRequest?.isEligibleHomeShow?.(G)) {
      if (App.startAwayChallengeFromPrep()) return;
      // Invalid bookings are cancelled by _startAwayChallengeShow(). Continue
      // the local show only after that reservation has actually been cleared.
      if (G._pendingAwayChallengeMatch) return;
    }
    // Accepted challenge requests reserve the top three slots inside the venue
    // limit. Inject only the visiting fighters needed to render/simulate them.
    const eligibleChallengeShow = !!Engine.challengeRequest?.isEligibleHomeShow?.(G);
    if (eligibleChallengeShow && G._pendingAwayChallengeMatch && Engine.challengeRequest?.removeFightersFromCard) {
      const awayOwnIds = G._pendingAwayChallengeMatch.requesterOrgId === 'player'
        ? G._pendingAwayChallengeMatch.teamAIds
        : G._pendingAwayChallengeMatch.teamBIds;
      G = { ...G, showCard: Engine.challengeRequest.removeFightersFromCard(G.showCard, awayOwnIds) };
    }
    if (eligibleChallengeShow && weeklyChallengeSide !== 'away' && (G._pendingIncomingChallengeMatch || G._pendingChallengeMatch?.isInverse) && Engine.challengeRequest?.reserveScheduledMatches) {
      const reservedCR = Engine.challengeRequest.reserveScheduledMatches(G, G.showCard);
      if (reservedCR) {
        const existingIds = new Set((G.roster || []).map(f => f.id));
        const guests = reservedCR.scheduled.guestTeam
          .filter(f => !existingIds.has(f.id))
          .map(f => ({ ...f, isCRGuest: true, _crGuestOrgId: reservedCR.scheduled.guestOrgId }));
        G = { ...G, showCard: reservedCR.card, roster: [...G.roster, ...guests] };
      } else {
        const clearedCard = Engine.challengeRequest.clearReservedMatches(G, G.showCard);
        const { _pendingIncomingChallengeMatch: _invalidIncomingCR, _pendingChallengeMatch: _legacyIncomingCR, ...rest } = G;
        G = { ...rest, showCard: clearedCard };
        showToast('⚠ 挑戦試合の出場メンバーが揃わないため、予約を解除しました', 5000);
      }
    }
    // task-88: 挑戦シリーズの次、B3より前に統一王座戦をメインへ予約する。
    // 既存予約が同週なら先着の挑戦シリーズを優先し、統一王座戦は次の通常興行へ繰り越す。
    App._unifiedTitleShowData = null;
    if (eligibleChallengeShow && weeklyChallengeSide !== 'away' && !Engine.challengeRequest?.getScheduledCard?.(G) && G._pendingUnifiedIncomingMatch) {
      const reservedUnified = Engine.unifiedTitle.reserveIncomingMatch(G);
      if (reservedUnified.match) {
        const scheduled = reservedUnified.match;
        const participantIds = [scheduled.champion.id, scheduled.challenger.id];
        // 編成画面ですでに見せている予約枠は一度外してから確定枠へ置換する。
        // そのまま先頭追加すると同じ王座戦が2枠になり、会場上限で通常試合が落ちる。
        const withoutStagedUnified = (G.showCard || []).filter(m => !m?._unifiedTitleMatch);
        const cleared = Engine.unifiedTitle.removeParticipantsFromCard(withoutStagedUnified, participantIds);
        const card = Engine.util.normalizeShowCardForVenue(
          [scheduled.slot, ...cleared], G.week, G.showVenue);
        const existingIds = new Set((G.roster || []).map(f => f.id));
        const guests = existingIds.has(scheduled.challenger.id) ? [] : [{
          ...scheduled.challenger,
          isUnifiedTitleGuest: true,
          _unifiedGuestOrgId: scheduled.challengerOrgId,
        }];
        G = { ...reservedUnified.state, showCard: card, roster: [...reservedUnified.state.roster, ...guests] };
        App._unifiedTitleShowData = { ...scheduled, guestIds: guests.map(f => f.id) };
      } else {
        G = reservedUnified.state;
        showToast('⚠ 全国統一王座戦の出場条件が整わないため、予約を解除しました', 5000);
      }
    }
    App._b3ShowData = null;
    // 挑戦状(B3)も同週コンテナ排他に従う。旧・参加者重複チェック(hasAwayParticipantConflict)は
    // 遠征の消化後(予約が消えた後)を見抜けず同週の二重出場を許していたため、週単位の排他へ置換。
    if (eligibleChallengeShow && weeklyChallengeSide !== 'away' && !Engine.challengeRequest?.getScheduledCard?.(G) && !App._unifiedTitleShowData && G._pendingIncomingB3Match && Engine.challengeRequest?.reserveScheduledSingleMatch) {
      const reservedB3 = Engine.challengeRequest.reserveScheduledSingleMatch(G, G.showCard);
      if (reservedB3) {
        const scheduled = reservedB3.scheduled;
        const existingIds = new Set((G.roster || []).map(f => f.id));
        const guest = existingIds.has(scheduled.challenger.id)
          ? []
          : [{ ...scheduled.challenger, isB3ChallengeGuest: true, _b3GuestOrgId: scheduled.orgId }];
        const { _pendingIncomingB3Match: _consumedB3, ...rest } = G;
        G = { ...rest, showCard: reservedB3.card, roster: [...rest.roster, ...guest] };
        App._b3ShowData = { ...scheduled, groupId: reservedB3.groupId, guestIds: guest.map(f => f.id) };
      } else {
        const { _pendingIncomingB3Match: _invalidB3, ...rest } = G;
        G = { ...rest, showCard: Engine.challengeRequest.clearReservedMatches(G, G.showCard) };
        showToast('⚠ 挑戦試合の出場条件が整わないため、予約を解除しました', 5000);
      }
    }
    // I-1保険: 今週すでに遠征で試合した選手が(手動編集や旧セーブ経由で)カードに
    // 残っていても自団体興行には出さない。該当枠は空欄化され、下のsanitizeで除外される。
    const awayUsedThisWeek = G._awayChallengeUsedIds;
    if (awayUsedThisWeek && awayUsedThisWeek.season === G.season && awayUsedThisWeek.week === G.week
        && (awayUsedThisWeek.ids || []).length > 0 && Engine.challengeRequest?.removeFightersFromCard) {
      const strippedCard = Engine.challengeRequest.removeFightersFromCard(G.showCard, awayUsedThisWeek.ids);
      if (JSON.stringify(strippedCard) !== JSON.stringify(G.showCard)) G = { ...G, showCard: strippedCard };
    }
    // Guard: sanitize stale card refs (released/retired/transferred wrestlers)
    const rosterIdSet = new Set(G.roster.map(c => c.id));
    let hadStaleRef = false;
    const _idOk = id => id > 0 && rosterIdSet.has(id);
    const sanitized = G.showCard.map(m => {
      if (m.matchType === 'tag') {
        const teamA = m.teamA || {};
        const teamB = m.teamB || {};
        const a1 = _idOk(teamA.fighter1), a2 = _idOk(teamA.fighter2);
        const b1 = _idOk(teamB.fighter1), b2 = _idOk(teamB.fighter2);
        if ((!a1 && teamA.fighter1 > 0) || (!a2 && teamA.fighter2 > 0) ||
            (!b1 && teamB.fighter1 > 0) || (!b2 && teamB.fighter2 > 0)) hadStaleRef = true;
        return { ...m,
          teamA: { fighter1: a1 ? teamA.fighter1 : 0, fighter2: a2 ? teamA.fighter2 : 0 },
          teamB: { fighter1: b1 ? teamB.fighter1 : 0, fighter2: b2 ? teamB.fighter2 : 0 },
        };
      }
      const leftOk = _idOk(m.left), rightOk = _idOk(m.right);
      if ((m.left > 0 && !leftOk) || (m.right > 0 && !rightOk)) hadStaleRef = true;
      return { ...m, left: leftOk ? m.left : 0, right: rightOk ? m.right : 0,
        isTitle: !!m.isTitle && leftOk && rightOk };
    });
    const titleSanitized = Engine.title.sanitizeShowCardTitles({ ...G, showCard: sanitized }, sanitized);
    const titleSanitizedChanged = JSON.stringify(titleSanitized) !== JSON.stringify(G.showCard);
    const venueLimitedCard = Engine.util.normalizeShowCardForVenue(titleSanitized, G.week, G.showVenue);
    const venueLimitChanged = JSON.stringify(venueLimitedCard) !== JSON.stringify(titleSanitized);
    if (hadStaleRef || titleSanitizedChanged || venueLimitChanged) G = { ...G, showCard: venueLimitedCard };

    const validMatches = venueLimitedCard.filter(m =>
      m.matchType === 'tag'
        ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
        : (m.left > 0 && m.right > 0)
    );
    if (validMatches.length === 0) {
      Audio.play('error');
      if (hadStaleRef) refreshAll();
      alert(hadStaleRef
        ? 'カードに在籍していない選手が含まれていたため自動で解除しました。カードを確認してください。'
        : '少なくとも1試合を組んでください');
      return;
    }

    // v1.2: タイトルマッチクールダウンガード（UIバイパス防止）
    const hasTitleSlot = validMatches.some(m => m.isTitle && !m._unifiedTitleMatch);
    if (hasTitleSlot) {
      const cd = Engine.title.canTitleMatch(G);
      if (!cd.allowed) {
        Audio.play('error');
        // クールダウン中のタイトルフラグを自動で外す
        G = { ...G, showCard: G.showCard.map(m => ({ ...m, isTitle: false })) };
        refreshAll();
        alert(`タイトルマッチは12週に1回のみ開催できます（あと${cd.weeksLeft}週）`);
        return;
      }
    }

    // ── Phase 4: タイトル奪還挑戦の注入 ──
    App._reclaimData = null;
    if (G._pendingReclaim && G.titles?.world?.externalHolder) {
      const pr = G._pendingReclaim;
      const eh = G.titles.world.externalHolder;
      const challenger = G.roster.find(c => c.id === pr.challengerId);
      const aiOrg = G.aiOrgs?.[eh.orgId];
      const defender = aiOrg?.roster?.find(c => c.id === eh.fighterId);
      // 整合性チェック: 挑戦者が脱退/怪我等で参戦不可、または防衛者がAI団体ロスターから消えている → 取り下げ
      if (!challenger || challenger.injury || challenger.forcedRest || !defender) {
        const { _pendingReclaim, ...rest } = G;
        G = rest;
      } else {
        // 防衛者を player roster に isReclaim 印で一時注入
        const defenderForRoster = { ...defender, isReclaim: true, _reclaimOrgId: eh.orgId };
        // 挑戦シリーズの上位3枠は維持し、その直下の通常枠を奪還戦に置き換える。
        const newCard = [...G.showCard];
        const reclaimMatch = {
          left: pr.challengerId, right: defender.id,
          isTitle: true, isReclaim: true,
          _reclaimDefenderId: defender.id, _reclaimOrgId: eh.orgId,
        };
        const reclaimIdx = newCard.findIndex(m => !m?._crMatchLocked && !m?.isCRMatch);
        // 3試合会場では挑戦シリーズだけで満枠。奪還戦は次の興行へ持ち越す。
        if (reclaimIdx >= 0) {
          newCard[reclaimIdx] = reclaimMatch;
          G = { ...G, showCard: newCard, roster: [...G.roster, defenderForRoster] };
          // validMatches も再構築（奪還戦を反映）
          validMatches.length = 0;
          newCard.forEach(m => {
            if (m.matchType === 'tag'
              ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
              : (m.left > 0 && m.right > 0)) validMatches.push(m);
          });
          App._reclaimData = {
            challengerId: pr.challengerId, defenderId: defender.id,
            orgId: eh.orgId, orgName: aiOrg?.name || eh.orgId,
            defenderName: defender.name, challengerName: challenger.name,
          };
          showEventPopup({
            type: 'fighter', id: pr.challengerId,
            name: challenger.name, tone: 'positive',
            message: `⚔ 王座奪還の決戦！ ${challenger.name} vs ${defender.name}`,
            detail: `${aiOrg?.name || eh.orgId} に持ち去られた団体王座を取り戻せ！`,
          });
        }
      }
    }

    // ── challenge-request-spec-v0.1 Phase 3: 予約済み挑戦シリーズを実行 ──
    // 上位3枠は会場上限の内数として興行準備時点で確保済み。
    App._crMatchData = null;
    if (eligibleChallengeShow && weeklyChallengeSide !== 'away' && (G._pendingIncomingChallengeMatch || G._pendingChallengeMatch?.isInverse)) {
      const pcm = G._pendingIncomingChallengeMatch || G._pendingChallengeMatch;
      const isInverseCR = !!pcm.isInverse;
      const _crHealthy = f => f && !f.injury && !f.forcedRest && !f.suspended;
      const _crFindAll = (ids, rosterArr) => ids.map(id => (rosterArr || []).find(f => f.id === id)).filter(Boolean);
      const reqRosterCR = isInverseCR ? (G.aiOrgs?.[pcm.requesterOrgId]?.roster || []) : G.roster;
      const oppRosterCR = isInverseCR ? G.roster : (G.aiOrgs?.[pcm.opponentOrgId]?.roster || []);
      const teamACR = _crFindAll(pcm.teamAIds, reqRosterCR);
      const teamBCR = _crFindAll(pcm.teamBIds, oppRosterCR);
      if (teamACR.length === 3 && teamBCR.length === 3 && teamACR.every(_crHealthy) && teamBCR.every(_crHealthy)) {
        const crMatches = G.showCard
          .filter(m => m && m._crMatchLocked && m.isCRMatch)
          .sort((a, b) => a._crSlot - b._crSlot);
        const crGroupId = crMatches[0]?._crGroupId || `cr_${pcm.requesterId}_${pcm.opponentId}_${G.season}_${G.week}`;
        // ゲスト側 = 他団体所属の陣営（forward: teamB / inverse: teamA）
        const guestIdsCR = (isInverseCR ? teamACR : teamBCR).map(f => f.id);
        App._crMatchData = {
          groupId: crGroupId, isInverse: isInverseCR,
          requesterId: pcm.requesterId, opponentId: pcm.opponentId,
          requesterOrgId: pcm.requesterOrgId, opponentOrgId: pcm.opponentOrgId,
          requesterOrgName: pcm.requesterOrgName, opponentOrgName: pcm.opponentOrgName,
          teamAIds: teamACR.map(f => f.id), teamBIds: teamBCR.map(f => f.id),
          guestIds: guestIdsCR,
          playerRosterIds: (G.roster || []).filter(f => !f.isCRGuest).map(f => f.id),
        };
        const { _pendingIncomingChallengeMatch: _pcm1, _pendingChallengeMatch: _legacyPcm1, ...restGCR } = G;
        G = restGCR;
        showEventPopup({
          type: 'fighter', id: pcm.requesterId,
          name: teamACR[0].name, tone: 'positive',
          message: `⚔ 直訴の一戦、この興行で決着`,
          detail: `${teamACR[0].name} が持ち込んだ舞台が、今日のカードに組み込まれた。`,
        });
      } else {
        // 出場メンバーが揃わない（怪我・離脱等）→ 静かに取り下げ
        const { _pendingIncomingChallengeMatch: _pcm2, _pendingChallengeMatch: _legacyPcm2, ...restGCR2 } = G;
        G = restGCR2;
      }
    }

    // v1.2: 乱入マッチ判定
    App._intrusionData = null;
    const intrusionRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 8888));
    const intrusion = Engine.intrusion.check(G, intrusionRng);
    if (intrusion) {
      // タイトルマッチの挑戦者を差し替え
      const titleIdx = G.showCard.findIndex(m => m.isTitle && !m._unifiedTitleMatch && m.left > 0 && m.right > 0);
      if (titleIdx >= 0) {
        const tm = G.showCard[titleIdx];
        const challengerSide = tm.left === intrusion.champId ? 'right' : 'left';
        const originalChallengerId = tm[challengerSide];
        // showCard更新
        const newCard = G.showCard.map((m, i) => {
          if (i !== titleIdx) return m;
          return { ...m, [challengerSide]: intrusion.intruder.id };
        });
        // 乱入選手を一時的にrosterに追加
        const intruderForRoster = { ...intrusion.intruder, isIntrusion: true };
        G = { ...G, showCard: newCard, roster: [...G.roster, intruderForRoster] };
        // validMatchesも更新
        validMatches.forEach((m, i) => {
          if (m.isTitle) {
            m[challengerSide] = intrusion.intruder.id;
          }
        });
        App._intrusionData = {
          intruder: intrusion.intruder,
          fromOrgName: intrusion.fromOrgName,
          champName: intrusion.champName,
          champId: intrusion.champId,
          originalChallengerId,
          challengerSide
        };
        // 乱入演出ポップアップ
        showEventPopup({
          type: 'fighter',
          id: intrusion.intruder.id,
          name: intrusion.intruder.name,
          tone: 'negative',
          message: `⚡ ${intrusion.fromOrgName}の${intrusion.intruder.name}が乱入！`,
          detail: `タイトルマッチの挑戦者が差し替わった！\nOVR ${Engine.util.ov(intrusion.intruder)} の強敵が王座を狙う！`
        });
      }
    }

    try { Audio.play('showStart'); } catch(e) {}
    try { Audio.bgm.play('battle'); } catch(e) {}

    // rivalry50+ ペアの宣戦布告、および決着済み宿怨の再燃演出を検出（タッグはスキップ）
    // Phase 3e: F08 ロック試合は専用の試合前モーダルが優先するためここでは除外
    const confrontations = [];
    validMatches.forEach((m, i) => {
      if (m.matchType === 'tag') return;
      if (m._f08Locked) return;
      const rivalLvl = Engine.title.getRivalryLevel(G, m.left, m.right);
      if (rivalLvl && rivalLvl.isBitterRival) {
        const bitterPairKey = `bitter:${[String(m.left), String(m.right)].sort().join('-')}`;
        const bitterSeen = (G._rivalryPopupSeen && !Array.isArray(G._rivalryPopupSeen))
          ? G._rivalryPopupSeen : {};
        const seenWeek = bitterSeen[bitterPairKey];
        const currentWeek = Engine.util.absWeek(G.season, G.week);
        if (Number.isFinite(seenWeek) && currentWeek - seenWeek < RIVALRY_POPUP_CONFIG.bitterPairCooldownWeeks) return;
        const _findAny = id => G.roster.find(c => c.id === id)
          || (typeof findFighter === 'function' ? findFighter(id) : null);
        const cl = _findAny(m.left);
        const cr = _findAny(m.right);
        if (cl && cr) {
          confrontations.push({
            phase: 'confrontation', idx: i,
            leftId: m.left, rightId: m.right,
            leftName: cl.name, rightName: cr.name,
            rivalry: rivalLvl.rivalry || 0,
            isBitter: true,
            leftSide: _bitterPrematchSide(G, m.left, m.right),
            rightSide: _bitterPrematchSide(G, m.right, m.left),
            _rivalryPopupPairKey: bitterPairKey,
          });
        }
      } else if (rivalLvl && !rivalLvl.isGoodRival && (rivalLvl.rivalry || 0) >= 50) {
        // 2026-07-26: **両方が自団体のときだけ**という条件だったため、
        // 挑戦試合・遠征・ゲスト参戦などの対外戦では宣戦布告が一度も出たことがなかった。
        // 因縁は選手IDで引けるので、所属を問わず名前が引ければ出す
        const _findAny = id => G.roster.find(c => c.id === id)
          || (typeof findFighter === 'function' ? findFighter(id) : null);
        const cl = _findAny(m.left);
        const cr = _findAny(m.right);
        if (cl && cr) {
          confrontations.push({
            phase: 'confrontation', idx: i,
            leftId: m.left, rightId: m.right,
            leftName: cl.name, rightName: cr.name,
            rivalry: rivalLvl.rivalry || 0,
            isFate: (rivalLvl.rivalry || 0) >= 70,
          });
        }
      }
    });

    // task-41 の興行あたり最大1件ルールに合流させる。宿怨を通常因縁より優先する。
    confrontations.sort((a, b) => {
      if (!!a.isBitter !== !!b.isBitter) return a.isBitter ? -1 : 1;
      return (b.rivalry || 0) - (a.rivalry || 0);
    });
    confrontations.splice(RIVALRY_POPUP_CONFIG.maxNormalPerShow);

    // Initialize preview state
    App._showPreview = {
      validMatches,
      results: new Array(validMatches.length).fill(null),
      currentWatching: -1,
      stateSnapshot: JSON.parse(JSON.stringify(G)),
      confrontationPairs: confrontations.map(c => c.idx),
      confrontationMap: Object.fromEntries(confrontations.map(c => [c.idx, c])),
      _shownConfrontations: new Set(),
      incomingChallenge: App._crMatchData ? { ...App._crMatchData } : null,
    };

    // 宣戦布告ポップアップは各試合がフォーカスされた瞬間に表示（renderMatchPreview内で制御）
    App._checkAndShowPreShowMilestone(function() {
      renderMatchPreview();
    });
  },

  _fillMissingShowPreviewResults() {
    const sp = App._showPreview;
    if (!sp || !Array.isArray(sp.validMatches) || !Array.isArray(sp.results)) return false;
    let filled = false;
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      if (m.matchType === 'tag') {
        const ids = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        if (ids.every(id => G.roster.find(c => c.id === id))) return;
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
        filled = true;
        return;
      } else {
        const charL = G.roster.find(c => c.id === m.left);
        const charR = G.roster.find(c => c.id === m.right);
        if (charL && charR) return;
      }
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      filled = true;
    });
    return filled;
  },

  // 試合確定後の共通フロー: 試合結果ポップアップ → (観戦時のみ)試合後フレーバー → 一覧/興行結果
  // (specs/match-flavor-popup-spec-v0.1.md §4.6)
  // opts.skipFlavor: true は余韻だけを省略する。1試合スキップでも結果ポップアップは表示する。
  // 「残り全試合スキップ」はこの関数を通らず finalizeShow へ進むため、連続ポップアップにはならない。
  _afterMatchSettle(idx, opts) {
    const sp = App._showPreview;
    if (!sp) return;
    const skipFlavor = !!(opts && opts.skipFlavor);
    const result = sp.results[idx];
    App._settleInternalChallengeMatch(idx, result);
    const finalize = () => {
      renderMatchPreview();
      if (sp.results.every(r => r !== null)) App.finalizeShow();
    };
    // 選手不在フォールバックだけは結果画面を出さず静かに進める。
    if (!result || result._stale) { finalize(); return; }
    // バトル開始前から残っている興行画面を、そのまま減彩した背面として使う。
    // 一覧更新と次カードの試合前演出は、結果ポップアップを閉じてから行う。
    renderRegularMatchResultPopup(idx, skipFlavor
      ? finalize
      : () => App._runPostMatchFlavorForMatch(idx, result, finalize));
  },

  // 派閥内序列戦は試合終了直後に pending を消化し、試合後モーダルと次カード強制を同期する。
  _settleInternalChallengeMatch(idx, result) {
    const sp = App._showPreview;
    const m = sp && sp.validMatches ? sp.validMatches[idx] : null;
    if (!m || !m._internalChallengeLocked || m.matchType === 'tag') return;
    if (!result || !G || !G._pendingInternalChallenge || !Engine.factions) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season || 1, G.week || 1, 0xFA21));
    if (result.winner === 'draw') {
      if (typeof Engine.factions.resolveInternalChallengeDraw === 'function') {
        G = Engine.factions.resolveInternalChallengeDraw(G);
      }
      return;
    }
    if (typeof Engine.factions.applyInternalChallengeResult !== 'function') return;
    const winnerId = result.winner === 'left' ? m.left : m.right;
    const loserId  = result.winner === 'left' ? m.right : m.left;
    const winnerHp = (result.winner === 'left' ? result.hpLeft : result.hpRight) || { final: 0, max: 100 };
    const loserHp  = (result.winner === 'left' ? result.hpRight : result.hpLeft) || { final: 0, max: 100 };
    const winnerHpPct = (winnerHp.max > 0) ? (winnerHp.final / winnerHp.max) : 1;
    const loserHpPct  = (loserHp.max > 0) ? (loserHp.final / loserHp.max) : 0;
    G = Engine.factions.applyInternalChallengeResult(G, {
      winnerId, loserId, winnerHpPct, loserHpPct,
    }, rng);
  },

  // MQ再設計P3b: 因縁/タイトル/trust/バフのリング内化(§3.3〜§3.6)。通常興行シングルの
  // simulateMatch呼び出し全箇所(skip/watch/skipAll)で同一の解決を使う。next_match_mqの対象は
  // カード順のみから決まる純関数なので、どの経路から呼んでも同じ結果になる。
  _normalShowRingInOpts(sp, idx, m) {
    const targetIdx = Engine.mq.resolveNextMatchMqTargetIndex(sp.validMatches, G.milestoneBuffs);
    const ringIn = Engine.mq.buildRingInOpts(G, m.left, m.right, {
      roster: G.roster, isTitle: !!m.isTitle, applyNextMatchMq: idx === targetIdx,
      normalShowRingExtras: true, isMainEvent: idx === 0,
      unifiedTitleMatch: !!m._unifiedTitleMatch,
    });
    return ringIn.simOpts;
  },

  // MQ再設計P3c(§3.2b): 通常興行がドーム(venueIdx=9)のとき、メイン(idx=0)のシングル戦は
  // 大一番(ビッグマッチ)ルールでシミュレーションする。タイトル戦は従来通りtier2。
  _normalShowMatchTier(idx, m) {
    if (m.isTitle) return 2;
    if (idx === 0 && G.showVenue === 9) return 2;
    return 1;
  },

  // Skip a single match (instant calculation) — 余韻フレーバーは出さない(省略の意思表示)
  skipMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    // 一度でもスキップを押したら、その興行の残り全試合で pre/post-match フレーバーを抑制する
    sp._suppressFlavor = true;
    const staleFilled = App._fillMissingShowPreviewResults();
    if (sp.results[idx]) { App._afterMatchSettle(idx, { skipFlavor: true }); return; }
    const m = sp.validMatches[idx];
    // ── タッグマッチ ──
    if (m.matchType === 'tag') {
      const f1 = G.roster.find(c => c.id === m.teamA.fighter1);
      const f2 = G.roster.find(c => c.id === m.teamA.fighter2);
      const f3 = G.roster.find(c => c.id === m.teamB.fighter1);
      const f4 = G.roster.find(c => c.id === m.teamB.fighter2);
      if (!f1 || !f2 || !f3 || !f4) {
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
        App._afterMatchSettle(idx, { skipFlavor: true });
        return;
      }
      const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
      const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
      const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
      const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
      const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
      // bond-rivalry plan P-1: bond ≤ 20 不仲ペアは試合中の能力 -3
      const lowBondA = bondA <= 20;
      const lowBondB = bondB <= 20;
      const _penalize = (c) => ({ ...c, power: c.power - 3, speed: c.speed - 3, technique: c.technique - 3, spirit: c.spirit - 3 });
      const f1p = lowBondA ? _penalize(f1) : f1;
      const f2p = lowBondA ? _penalize(f2) : f2;
      const f3p = lowBondB ? _penalize(f3) : f3;
      const f4p = lowBondB ? _penalize(f4) : f4;
      sp.results[idx] = Engine.tagMatch.simulateTagMatch(
        { fighter1: f1p, fighter2: f2p }, { fighter1: f3p, fighter2: f4p },
        tagRng, { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB, lowBondA, lowBondB }
      );
      // P-1: 試合後 trust -1（不仲ペア両者）
      if (lowBondA || lowBondB) {
        const lowIds = [];
        if (lowBondA) lowIds.push(f1.id, f2.id);
        if (lowBondB) lowIds.push(f3.id, f4.id);
        G.roster = G.roster.map(c => lowIds.includes(c.id)
          ? { ...c, trust: Math.max(0, (c.trust != null ? c.trust : 50) - 1) }
          : c);
      }
      try { Audio.play('tick'); } catch(e) {}
      App._afterMatchSettle(idx, { skipFlavor: true });
      return;
    }
    // ── シングルマッチ ──
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) {
      if (!staleFilled) sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      App._afterMatchSettle(idx, { skipFlavor: true });
      return;
    }
    const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng, App._normalShowMatchTier(idx, m),
      App._normalShowRingInOpts(sp, idx, m));
    try { Audio.play('tick'); } catch(e) {}
    App._afterMatchSettle(idx, { skipFlavor: true });
  },

  // Watch match in battle engine iframe
  watchMatch(idx) {
    const sp = App._showPreview;
    if (!sp) return;
    // ── タッグマッチ: tag-battle.html に分岐 ──
    if (sp.validMatches[idx]?.matchType === 'tag') {
      App._watchTagMatch(idx);
      return;
    }
    if (sp.results[idx]) return;
    App._fillMissingShowPreviewResults();
    if (sp.results[idx]) { App._afterMatchSettle(idx); return; }
    const m = sp.validMatches[idx];
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) {
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      App._afterMatchSettle(idx);
      return;
    }
    // エンジン実行（recordFrames=true）— Replay 方式: シミュレート結果＋フレーム列を iframe へ渡して再生
    const matchTier = App._normalShowMatchTier(idx, m);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    const result = Engine.battle.simulateMatch(charL, charR, rng, matchTier,
      { recordFrames: true, ...App._normalShowRingInOpts(sp, idx, m) });
    const h2hForLeft = (Engine.h2h && Engine.h2h.getRecordFor) ? Engine.h2h.getRecordFor(G, charL.id, charR.id) : null;
    sp.results[idx] = result;
    sp.currentWatching = idx;
    // Show iframe
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    // Show escape button after 8 seconds (safety net if iframe gets stuck)
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);
    // Send match data to iframe (avoid contentDocument — causes SecurityError on file://)
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: { ...charL, portraitUrl: getPortraitUrl(charL.id), profile: CHAR_PROFILES[charL.id] || '', vl: App._buildVlVsPlayerForExEmployee(charL, G.season, G.week, charR.orgId), vsExHit: App._buildVsExHitLines(charL, G.season, G.week, charR.orgId) },
      right: { ...charR, portraitUrl: getPortraitUrl(charR.id), profile: CHAR_PROFILES[charR.id] || '', vl: App._buildVlVsPlayerForExEmployee(charR, G.season, G.week, charL.orgId), vsExHit: App._buildVsExHitLines(charR, G.season, G.week, charL.orgId) },
      result,
      matchInfo: {
        header: m._unifiedTitleMatch ? '🌐 全国統一王座戦' : m.isTitle ? (G.titles.world.championId ? '🏆 TITLE MATCH' : '🏆 初代王者決定戦') : (idx === 0 ? 'メインイベント' : `第${sp.validMatches.length - idx}試合`),
        subHeader: `${charL.name} vs ${charR.name}`,
        matchNum: idx === 0 ? sp.validMatches.length : (sp.validMatches.length - idx),
        totalMatches: sp.validMatches.length,
        isTitle: !!m.isTitle,
        isSpecialMatch: false,
        matchTier,
        h2hRecord: h2hForLeft ? {
          leftWins: h2hForLeft.wins || 0,
          rightWins: h2hForLeft.losses || 0,
          draws: h2hForLeft.draws || 0,
          matches: h2hForLeft.matches || 0,
          bestMQ: h2hForLeft.bestMQ || 0,
        } : null,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, charL.id, charR.id); return rl ? rl.tier : 0; })(),
        leftPersonality: charL.personality || 'normal',
        leftArchetype: charL.archetype || 'standard',
        rightPersonality: charR.personality || 'normal',
        rightArchetype: charR.archetype || 'standard',
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
      }
    };
    // BGM切替: タイトル戦はFileBGM、通常試合はチップチューンbattle
    if (m.isTitle) {
      try { Audio.bgm.playStage('bigMatch'); } catch(e) {}
    } else {
      try { Audio.bgm.play('battle'); } catch(e) {}
    }
    let sent = false;
    const sendOnce = () => {
      if (sent) return;
      sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    // Reload iframe with cache-busting param to guarantee fresh load
    // NOTE: singles は必ず battle-engine.html を使う（直前のタッグ試合で tag-battle.html に変わっていても戻す）
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'battle-engine.html?t=' + Date.now();
    // Fallback: retry if onload was missed
    setTimeout(sendOnce, 800);
  },

  // タッグマッチを tag-battle.html で観戦
  _watchTagMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    const m = sp.validMatches[idx];
    const f1 = G.roster.find(c => c.id === m.teamA.fighter1);
    const f2 = G.roster.find(c => c.id === m.teamA.fighter2);
    const f3 = G.roster.find(c => c.id === m.teamB.fighter1);
    const f4 = G.roster.find(c => c.id === m.teamB.fighter2);
    if (!f1 || !f2 || !f3 || !f4) {
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
      renderMatchPreview();
      if (sp.results.every(r => r !== null)) App.finalizeShow();
      return;
    }
    // エンジン実行（recordFrames=true）
    const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
    const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
    const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
    const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
    const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
    // bond-rivalry plan P-1: bond ≤ 20 不仲ペアは試合中の能力 -3
    const lowBondA = bondA <= 20;
    const lowBondB = bondB <= 20;
    const _penalize = (c) => ({ ...c, power: c.power - 3, speed: c.speed - 3, technique: c.technique - 3, spirit: c.spirit - 3 });
    const f1p = lowBondA ? _penalize(f1) : f1;
    const f2p = lowBondA ? _penalize(f2) : f2;
    const f3p = lowBondB ? _penalize(f3) : f3;
    const f4p = lowBondB ? _penalize(f4) : f4;
    const result = Engine.tagMatch.simulateTagMatch(
      { fighter1: f1p, fighter2: f2p }, { fighter1: f3p, fighter2: f4p },
      tagRng, { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB, recordFrames: true, lowBondA, lowBondB }
    );
    // P-1: 試合後 trust -1（不仲ペア両者）
    if (lowBondA || lowBondB) {
      const lowIds = [];
      if (lowBondA) lowIds.push(f1.id, f2.id);
      if (lowBondB) lowIds.push(f3.id, f4.id);
      G.roster = G.roster.map(c => lowIds.includes(c.id)
        ? { ...c, trust: Math.max(0, (c.trust != null ? c.trust : 50) - 1) }
        : c);
    }
    sp.results[idx] = result;
    sp.currentWatching = idx;
    // BGM: 通常 battle
    try { Audio.bgm.play('battle'); } catch(e) {}
    // iframe 表示
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);
    const iframe = document.getElementById('battleIframe');
    const mkProfile = (c) => ({
      ...c,
      portraitUrl: getPortraitUrl(c.id),
      profile: CHAR_PROFILES[c.id] || '',
    });
    const msg = {
      type: 'START_TAG_MATCH',
      teamA: { fighter1: mkProfile(f1), fighter2: mkProfile(f2) },
      teamB: { fighter1: mkProfile(f3), fighter2: mkProfile(f4) },
      result,
      matchInfo: {
        header: idx === 0 ? 'メインイベント(タッグ)' : `第${sp.validMatches.length - idx}試合(タッグ)`,
        matchNum: idx === 0 ? sp.validMatches.length : (sp.validMatches.length - idx),
        totalMatches: sp.validMatches.length,
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
        chemA: result.chemA,
        chemB: result.chemB,
      }
    };
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'tag-battle.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // Receive result from battle engine
  receiveBattleResult(data) {
    // Hide escape button
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    // 秋の勝ち残り対抗戦: 観戦開始時に確定済みの1フォールを再適用せず、画面だけ復帰する
    const awPre = App._awPreview;
    if (awPre && awPre.phase === 'watching') {
      App._finishAutumnWarWatch(data);
      return;
    }
    // 春のタッグリーグ context: 確定済み結果のリプレイ完了として扱う
    const stlPre = App._stlPreview;
    if (stlPre && stlPre.phase === 'watching') {
      App._receiveSpringTagLeagueBattleResult(data);
      return;
    }
    // Junior Tournament context: route to JT handler
    const jtPre = App._jtPreview;
    if (jtPre && jtPre.phase === 'watching') {
      App._receiveJTBattleResult(data);
      return;
    }
    // 天頂戦 context: route to Tenchosen handler
    const tcPre = App._tcPreview;
    if (tcPre && tcPre.phase === 'watching') {
      App._receiveTcBattleResult(data);
      return;
    }
    // PPV context: route to PPV handler
    const pp = App._ppvPreview;
    if (pp && pp.currentWatching >= 0) {
      App._receivePPVBattleResult(data);
      return;
    }
    // War context: route to war handler
    const wp = App._warPreview;
    if (wp && wp.currentWatching >= 0) {
      App._receiveWarBattleResult(data);
      return;
    }
    // B3 context
    const b3 = App._b3Preview;
    if (b3 && b3.watching) {
      App._receiveB3BattleResult(data);
      return;
    }
    // B2 context
    const b2 = App._b2Preview;
    if (b2 && b2.watching) {
      App._receiveB2BattleResult(data);
      return;
    }
    // Show context
    const sp = App._showPreview;
    if (!sp || sp.currentWatching < 0) return;
    const idx = sp.currentWatching;
    const m = sp.validMatches[idx];
    // ── Replay方式: シングル/タッグともに sp.results[idx] に事前計算結果が既に入っている。iframe からは閉じるだけ ──
    if (m && m.matchType === 'tag') {
      try { Audio.bgm.stop(); } catch(e) {}
      document.getElementById('battleOverlay').style.display = 'none';
      const tagIdx = sp.currentWatching;
      sp.currentWatching = -1;
      try { Audio.play('click'); } catch(e) {}
      const allDone = sp.results.every(r => r !== null);
      if (allDone) {
        try { Audio.bgm.play('management'); } catch(e) {}
      } else {
        setTimeout(() => { if (App._showPreview) { try { Audio.bgm.play('battle'); } catch(e) {} } }, 300);
      }
      // タッグは試合後フレーバーは出さない (`_collectPostMatchPopupsForMatch` 側で tag をスキップ)
      App._afterMatchSettle(tagIdx);
      return;
    }
    // Guard: single マッチも事前計算済み。iframe から MATCH_RESULT が来ても結果は上書きしない
    if (!sp.results[idx]) {
      // 想定外: watchMatch を通らず直接 MATCH_RESULT が来た場合のフォールバック
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      sp.results[idx] = {
        left: charL, right: charR,
        winner: data.winner,
        finType: data.finType || '',
        finMove: data.finMove || '',
        turns: data.turns || 0,
        mq: data.mq || 50,
        hpLeft: { final: data.hpLeft ? (data.hpLeft.current != null ? data.hpLeft.current : data.hpLeft.final) : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
        hpRight: { final: data.hpRight ? (data.hpRight.current != null ? data.hpRight.current : data.hpRight.final) : 0, max: data.hpRight ? data.hpRight.max : 100 },
        log: data.log || []
      };
    }
    // BGM: FileBGMフェードアウト + 残試合ありならbattle復帰、全完了ならjingleへ(finalizeShowで遅延再生)
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    if (sp.results.every(r => r !== null)) {
      // 全試合完了: management BGMは流さずjingle待機(finalizeShowで2.5秒後に再生)
    } else {
      // まだ試合が残っている → battleBGMを再開（興行中）
      // fadeOut後にBGM._current='battle'が残るため、stop()でリセットしてから再生
      setTimeout(() => { if (App._showPreview) { try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch(e) {} } }, 1600);
    }
    // Hide iframe
    document.getElementById('battleOverlay').style.display = 'none';
    const watchedIdx = sp.currentWatching;
    sp.currentWatching = -1;
    try { Audio.play('click'); } catch(e) {}
    App._afterMatchSettle(watchedIdx);
  },

  // Emergency escape from battle engine (if iframe gets stuck)
  escapeBattle() {
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    const aw = App._awPreview;
    const stl = App._stlPreview;
    const jt = App._jtPreview;
    const tc = App._tcPreview;
    const preserveTournamentFileBgm = !!(
      (aw && aw.phase === 'watching')
      || (stl && stl.phase === 'watching')
      || (jt && jt.phase === 'watching')
      || (tc && tc.phase === 'watching')
    );
    // 大会観戦は現在の大会曲（決勝専用曲を含む）を保ち、通常試合だけ従来どおり止める。
    if (!preserveTournamentFileBgm) {
      try { Audio.fileBgm.stop(); } catch(e) {}
    }
    document.getElementById('battleOverlay').style.display = 'none';
    // Auto-skip the stuck match
    const sp = App._showPreview;
    const wp = App._warPreview;
    const ppvPrev = App._ppvPreview;
    if (ppvPrev && ppvPrev.currentWatching >= 0) {
      const idx = ppvPrev.currentWatching;
      ppvPrev.currentWatching = -1;
      if (!ppvPrev.results[idx]) App.ppvSkipMatch(idx);
      // PPV BGM復帰
      if (!ppvPrev.results.every(r => r !== null)) {
        setTimeout(() => { if (App._ppvPreview) { try { Audio.bgm.playStage(_ppvStageTrack(App._ppvPreview)); } catch(e) {} } }, 300);
      }
    } else if (sp && sp.currentWatching >= 0) {
      const idx = sp.currentWatching;
      sp.currentWatching = -1;
      if (!sp.results[idx]) App.skipMatch(idx);
      else { renderMatchPreview(); if (sp.results.every(r => r !== null)) App.finalizeShow(); }
      // 興行BGM復帰（興行中はbattle）— stop()でBGM状態リセット後に再生
      if (!sp.results.every(r => r !== null)) {
        setTimeout(() => { if (App._showPreview) { try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch(e) {} } }, 300);
      }
    } else if (wp && wp.currentWatching >= 0) {
      const idx = wp.currentWatching;
      wp.currentWatching = -1;
      if (!wp.results[idx]) {
        // warWatchMatch が結果を先に埋めるので通常ここには来ない(保険)。
        // warSkipMatch 側が勝敗SE・盤面再描画・全消化時の finalizeWar まで行う。
        App.warSkipMatch(idx);
      } else {
        // 中断でも観戦完了(_receiveWarBattleResult)と同じ着地にする:
        // 結果は事前計算済みなので勝敗SE→盤面反映→全消化なら決着処理。
        // 以前は結果を埋めるだけで盤面を再描画しておらず、スコアが古いまま
        // 「試合が未消化」に見えていた(2026-08-13 Keisuke報告)。
        App._playWarMatchResultSe(wp.results[idx]);
        renderWarMatchPreview();
        if (wp.results.every(r => r !== null)) App.finalizeWar();
      }
      // 対抗戦BGM復帰(全消化で決着処理へ進んだ場合はトークンガードで再開しない)
      if (!wp.results.every(r => r !== null)) {
        App._scheduleWarBgmResume(300);
      }
    }
    if (aw && aw.phase === 'watching') {
      App._finishAutumnWarWatch();
      return;
    }
    if (stl && stl.phase === 'watching') {
      stl.phase = stl.watchReturnPhase || 'table';
      delete stl.watchReturnPhase;
      delete stl.watchCanonical;
      App.stlAdvance();
      return;
    }
    if (jt && jt.phase === 'watching') {
      const ri = jt.currentRound;
      const mi = jt.currentMatch;
      jt.phase = 'matchResult';
      App.jtSkipMatch(ri, mi);
      return;
    }
    // 天頂戦
    if (tc && tc.phase === 'watching') {
      App.tcSkipMatch(tc.currentRound, tc.currentMatch);
      return;
    }
    // B3
    const b3 = App._b3Preview;
    if (b3 && b3.watching) {
      b3.watching = false;
      App.b3SkipMatch();
      return;
    }
    // B2
    const b2 = App._b2Preview;
    if (b2 && b2.watching) {
      b2.watching = false;
      App.b2SkipMatch();
      return;
    }
  },

  // Skip all remaining matches
  skipAllMatches() {
    const sp = App._showPreview;
    if (!sp) return;
    App._fillMissingShowPreviewResults();
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      if (m.matchType === 'tag') {
        const f1 = G.roster.find(c => c.id === m.teamA.fighter1);
        const f2 = G.roster.find(c => c.id === m.teamA.fighter2);
        const f3 = G.roster.find(c => c.id === m.teamB.fighter1);
        const f4 = G.roster.find(c => c.id === m.teamB.fighter2);
        if (!f1 || !f2 || !f3 || !f4) {
          sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
          return;
        }
        const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
        const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
        const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
        const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
        const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
        sp.results[idx] = Engine.tagMatch.simulateTagMatch(
          { fighter1: f1, fighter2: f2 },
          { fighter1: f3, fighter2: f4 },
          tagRng,
          { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB }
        );
        return;
      }
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      if (!charL || !charR) {
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
        return;
      }
      const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
      sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng, App._normalShowMatchTier(idx, m),
        App._normalShowRingInOpts(sp, idx, m));
    });
    // 旧: `if (sp.results.some(r => r === null)) { ... if (false) {...} }` は到達不能だったため削除
    // (2026-07-31 監査で検出)。sp.results は `new Array(sp.validMatches.length).fill(null)` で作られ、
    // その後 results.length が変わる代入(push/splice)は無い。上のforEachは
    // sp.validMatches の全indexを走査し、既に埋まっているものだけ`return`でスキップし、
    // 残り全てに(タッグ/シングルいずれも)stale draw か simulateMatch の結果を必ず代入するため、
    // ループ完了時点で sp.results に null は残り得ない。
    try { Audio.play('bellx3'); } catch(e) {}
    App.finalizeShow();
  },

  // Post-processing: apply titles, popularity, injuries (mirrors Engine.executeShow logic)
  finalizeShow() {
    if (App._showPreview?.isUnifiedAwayTitle) {
      App._finalizeUnifiedTitleAwayShow();
      return;
    }
    if (App._showPreview?.isAwayChallenge) {
      try {
        App._finalizeAwayChallengeShow();
      } catch (e) {
        App._recoverAwayChallengeAfterError(e);
      }
      return;
    }
    try {
      App._finalizeShowImpl();
    } catch (e) {
      console.error('[WM] finalizeShow exception:', e);
      // 進行不具合復旧: 例外で weekPhase='showExec' のまま残ると今週タブが
      // 空になり翌週へ進めなくなるため、manage に戻して退避する。
      try {
        if (G && G.weekPhase === 'showExec') {
          G = { ...G, weekPhase: 'manage', lastShowResults: G.lastShowResults || [],
                weeklyFinance: G.weeklyFinance || { income: 0, expense: 0, details: [] } };
          App._showPreview = null;
          try { document.getElementById('showResultOverlay')?.classList.remove('active'); } catch (_e) {}
          try { Audio.bgm.playForState(); } catch (_e) {}
          try { showToast('⚠️ 興行処理中に問題が発生しました。状態を復元しました。', 6000); } catch (_e) {}
          try { Storage.autoSave(); } catch (_e) {}
          try { showScreen('week'); refreshAll(); } catch (_e) {}
        }
      } catch (_recovErr) {
        console.error('[WM] finalizeShow recovery failed:', _recovErr);
      }
    }
  },

  _finalizeShowImpl() {
    const sp = App._showPreview;
    if (!sp) return;
    const results = sp.results;
    const validMatches = sp.validMatches;

    // Guard: ensure all results are resolved
    if (!Array.isArray(results) || results.some(r => r === null)) {
      console.error('finalizeShow: unresolved results', { validMatches, results });
      Audio.play('error');
      renderMatchPreview();
      alert('試合結果の確定に失敗しました。カードに不整合がある可能性があります。');
      return;
    }
    let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
    // forcedRest（S3休養願い）フラグをクリア — この興行後は通常参加可能に戻す
    let roster = s.roster.map(c => c.forcedRest ? { ...c, forcedRest: false } : { ...c });
    let rivalries = { ...s.rivalries };
    let titles = { ...s.titles, world: { ...s.titles.world } };
    const events = [];
    // Phase 4: 興行前の連敗数を記録（C-05/C-06判定用）
    const preShowLosingStreaks = new Map(roster.map(c => [c.id, c.losingStreak || 0]));

    // ── v4 §2-1: F02① ignite 判定（リーダー同士のカードが組まれていれば発火） ──
    if (Engine.factions && typeof Engine.factions.checkF02IgniteTrigger === 'function' && !s._pendingFactionEvent) {
      const ig = Engine.factions.checkF02IgniteTrigger(s, validMatches);
      if (ig.eligible) {
        s = { ...s, _pendingFactionEvent: { eventId: 'F02_IGNITE', payload: ig.payload } };
      }
    }

    // Rivalry/title metadata (MQ is finalized later by Engine.mq.finalize)
    const confrontationPairs = sp.confrontationPairs || [];
    const deferredRivalryIdxs = []; // 因縁決着候補ペアの recordRivalry を MQ確定後まで保留
    results.forEach((result, i) => {
      const m = validMatches[i];
      if (!m || m.matchType === 'tag') return; // タッグ試合は因縁・ケミストリーボーナス対象外
      if (!_sameSinglesPair(m, result)) {
        console.warn('[WM] rivalry processing skipped: card/result participants differ', { index: i, match: m, result });
        return;
      }
      const pairState = Engine.title.getRivalryPairState({ ...s, rivalries }, m.left, m.right);
      const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
      if (rivalLvl) result.rivalryBonus = rivalLvl;
      if (m.isTitle) result.isTitleMatch = true;
      // 因縁決着候補（minRivalry>=60 or resolutionCount>=1）は recordRivalry をMQ確定後まで保留
      const isResolutionCandidate = pairState && !pairState.resolvedType && pairState.minRivalry >= 60;
      const hasPartialResolution = pairState && !pairState.resolvedType && (rivalries[Engine.title.getRivalryKey(m.left, m.right)]?.resolutionCount || 0) >= 1 && pairState.minRivalry >= 80;
      if (isResolutionCandidate || hasPartialResolution) {
        deferredRivalryIdxs.push(i);
      } else {
        const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right, result.mq);
        rivalries = rivalResult.rivalries;
        if (rivalResult.msg) events.push(rivalResult.msg);
      }
      // coachMQBonus — MQ外部ボーナス整理で廃止
    });

    // Fan expectation MQ bonus — MQ外部ボーナス整理で廃止。フラグのみ残す（タッグはスキップ）
    const fanExpects = Engine.fanExpect.generate(s);
    validMatches.forEach((m, i) => {
      const result = results[i]; if (!result || m.matchType === 'tag') return;
      const isFanExpectMatch = fanExpects.some(exp =>
        (exp.leftId === result.left.id && exp.rightId === result.right.id) ||
        (exp.leftId === result.right.id && exp.rightId === result.left.id)
      );
      if (isFanExpectMatch) result.fanExpectMatch = true;
    });

    // Title outcomes
    const titleMatchOutcomes = [];
    validMatches.forEach((m, i) => {
      if (!m.isTitle || m._unifiedTitleMatch || !results[i]) return;
      if (m.isReclaim) return; // Phase 4: 奪還挑戦試合は専用ハンドラで処理
      const r = results[i];
      const champId = titles.world.championId;
      const challengerId = champId === m.left ? m.right : m.left;
      const challengerName = challengerId != null ? (roster.find(f => f.id === challengerId)?.name) : undefined;
      const tempState = { ...s, titles, roster };
      if (r.winner === 'draw') {
        if (champId) { const def = Engine.title.recordDefense(tempState, { challengerName }); titles = def.titles; roster = def.roster; events.push(def.msg); }
        titleMatchOutcomes.push({ outcome: 'defense', champId, challengerId });
      } else {
        const winnerId = r.winner === 'left' ? m.left : m.right;
        if (!champId || winnerId !== champId) {
          const crown = Engine.title.crownChampion(tempState, winnerId); titles = crown.titles; roster = crown.roster; events.push(crown.msg);
          // 王座移動を新聞へ(2026-07-27)。crownChampion が記事を組んで返す
          if (crown.newsEvent) App._pushIndustryNews(crown.newsEvent);
          titleMatchOutcomes.push({ outcome: 'change', newChampId: winnerId, prevChampId: champId, challengerId });
        } else {
          const def = Engine.title.recordDefense(tempState, { challengerName }); titles = def.titles; roster = def.roster; events.push(def.msg);
          titleMatchOutcomes.push({ outcome: 'defense', champId, challengerId });
        }
      }
    });

    // v1.2: 乱入マッチ結果処理
    if (App._intrusionData) {
      const id = App._intrusionData;
      // 乱入選手がタイトルを奪取したか判定
      const intruderId = id.intruder.id;
      const intruderWon = titles.world.championId === intruderId;
      if (intruderWon) {
        // 王座空位 + ヒートダウン
        // v1.x修正: 振れ幅再設計 — 旧 -7〜-20 は値域[-10,+10]に対し過大かつ
        //   旧コード `Math.max(0, (s.heatScore || 50) + penalty)` に二重バグ
        //   (heat=0 が 50 に化ける / 下限0で負側帯を破壊) があり「最高潮→ニュートラル」一撃が発生していた。
        //   基本 -3〜-6、現在Hot/On Fire(hs≥6)帯では追加 -1〜-2。On Fire→ギリWarm までで止める。
        const intRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 8889));
        const basePenalty = -(3 + Engine.rng.int(intRng, 0, 3));
        const hotExtra = (s.heatScore || 0) >= 6 ? -(1 + Engine.rng.int(intRng, 0, 1)) : 0;
        const penalty = basePenalty + hotExtra;
        titles = { ...titles, world: { ...titles.world, championId: null, defenses: 0 } };
        s = { ...s, heatScore: Engine.util.clamp(Math.round(((s.heatScore ?? 0) + penalty) * 10) / 10, -10, 10) };
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) - BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
        events.push(`😱 ${id.fromOrgName}の${id.intruder.name}に王座を奪われた！ 王座は空位に… ヒート${penalty}、対戦pt-${BATTLE_POINT_CFG.intrusion}`);
      } else {
        // チャンピオン勝利 → 団体人気+2
        s = { ...s, orgPop: Math.min(100, (s.orgPop || 0) + 2) };
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) + BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
        events.push(`👑 ${id.champName}が乱入者${id.intruder.name}を退けた！ 団体人気+2、対戦pt+${BATTLE_POINT_CFG.intrusion}`);
      }
      // §4.2: 乱入 rivalry +12〜+18（チャンピオン↔乱入者）
      if (s.relationships) {
        const intRivalRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6F));
        const intruderId = id.intruder.id;
        const champId = id.champId || (intruderWon ? null : titles.world?.championId);
        if (champId && champId !== intruderId) {
          s = Engine.relationships.applyToRoster({ ...s, roster }, intruderId, [champId], { min: 0, max: 0 }, { min: 12, max: 18 }, intRivalRng);
          s = Engine.relationships.applyToRoster({ ...s, roster }, champId, [intruderId], { min: 0, max: 0 }, { min: 12, max: 18 }, intRivalRng);
        }
      }
      // 乱入選手をrosterから除去
      roster = roster.filter(c => !c.isIntrusion);
      // Phase0修正: lastIntrusionWeek更新（クールダウン計算用）
      const intAbsWeek = Engine.util.absWeek(s.season, s.week);
      s = { ...s, lastIntrusionWeek: intAbsWeek };
    }

    // ── Phase 4: 奪還挑戦試合の結果処理 ──
    if (App._reclaimData) {
      const rd = App._reclaimData;
      const reclaimIdx = validMatches.findIndex(m => m.isReclaim);
      const r = reclaimIdx >= 0 ? results[reclaimIdx] : null;
      if (r) {
        const winnerId = r.winner === 'left' ? validMatches[reclaimIdx].left : (r.winner === 'right' ? validMatches[reclaimIdx].right : null);
        if (winnerId === rd.challengerId) {
          // 挑戦者勝利 → タイトル奪還
          const reclaimResult = Engine.title.resolveReclaimWin({ ...s, titles, roster }, 'world', rd.challengerId);
          titles = reclaimResult.titles;
          s = { ...s, aiOrgs: reclaimResult.aiOrgs, reclaimChallenges: reclaimResult.reclaimChallenges };
          // 新王者の人気微増（crownChampion 相当の小さなボーナスのみ。reassess は省略）
          roster = roster.map(c => c.id === rd.challengerId
            ? { ...c, popularity: Math.min(100, (c.popularity || 0) + Engine.popularity.applyDiminishing(5, c.popularity || 0)) }
            : c);
          events.push(`🏆 王座奪還！ ${rd.challengerName} が ${rd.orgName} から団体王座を取り戻した！`);
          titleMatchOutcomes.push({
            outcome: 'change', newChampId: rd.challengerId,
            prevChampId: rd.defenderId, challengerId: rd.challengerId,
            isReclaim: true,
          });
          // 業界ニュース: 奪還成功
          s = Engine.industryNews.push(s, {
            type: 'reclaimSuccess',
            characterId: rd.challengerId,
            data: {
              challengerName: rd.challengerName,
              fromOrg: G.orgName || 'プレイヤー団体',
              toOrg: rd.orgName,
            },
          });
        } else {
          // 挑戦失敗 → 12週CD
          const reclaimResult = Engine.title.resolveReclaimLoss(s, 'world');
          s = { ...s, reclaimChallenges: reclaimResult.reclaimChallenges };
          events.push(`💔 ${rd.challengerName} の奪還挑戦は失敗。${rd.orgName} が団体王座を防衛した。`);
          // 業界ニュース: 奪還失敗
          s = Engine.industryNews.push(s, {
            type: 'reclaimFailure',
            characterId: rd.challengerId,
            data: {
              challengerName: rd.challengerName,
              fromOrg: G.orgName || 'プレイヤー団体',
              toOrg: rd.orgName,
            },
          });
        }
        // firing-grudge-spec-v0.1 タスクc(2026-07-17): 奪還挑戦の結果パスにも firedReturn を接続。
        // 防衛者(rd.orgId所属)が元プレイヤー解雇者なら「古巣から奪ったベルトを防衛/明け渡す」文脈、
        // 挑戦者(player所属)がrd.orgIdの元解雇者ならその逆(古巣に取られたベルトを取り返しに行く)文脈。
        const defenderFighter = roster.find(c => c.id === rd.defenderId);
        const challengerFighter = roster.find(c => c.id === rd.challengerId);
        if (defenderFighter) s = App._maybeEmitFiredReturn(s, defenderFighter, 'player', rd.orgId);
        if (challengerFighter) s = App._maybeEmitFiredReturn(s, challengerFighter, rd.orgId, 'player');
      }
      // 防衛者を player roster から除去
      roster = roster.filter(c => !c.isReclaim);
      // pending クリア
      const { _pendingReclaim, ...rest } = s;
      s = rest;
      App._reclaimData = null;
    }

    // ── challenge-request-spec-v0.1 Phase 3: 直訴試合(3シングル)の結果処理 ──
    // 実際のショーパイプラインで解決済みの results から3枠分を抜き出し、
    // 旧 resolveMatchCard と同じ shape ({matches, winsA, winsB, teamWin}) を組み立てて
    // 既存の _applyChallengeRequestResult(h2h/career/news)にそのまま渡す。
    if (App._crMatchData) {
      const cd = App._crMatchData;
      const crIdxs = validMatches
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m._crGroupId === cd.groupId)
        .sort((a, b) => a.m._crSlot - b.m._crSlot)
        .map(({ i }) => i);
      if (crIdxs.length === 3 && crIdxs.every(i => results[i])) {
        const crMatchResults = crIdxs.map(i => {
          const r = results[i];
          return { fighterA: r.left, fighterB: r.right, winner: r.winner, mq: r.mq, finType: r.finType, finMove: r.finMove };
        });
        const crWinsA = crMatchResults.filter(m => m.winner === 'left').length;
        const crWinsB = crMatchResults.filter(m => m.winner === 'right').length;
        const crTeamWin = crWinsA > crWinsB ? 'A' : (crWinsB > crWinsA ? 'B' : 'draw');
        const crCard = {
          isInverse: cd.isInverse,
          requesterId: cd.requesterId, opponentId: cd.opponentId,
          requesterOrgId: cd.requesterOrgId, opponentOrgId: cd.opponentOrgId,
          requesterOrgName: cd.requesterOrgName, opponentOrgName: cd.opponentOrgName,
          otherOrgId: cd.opponentOrgId, otherOrgName: cd.opponentOrgName,
          teamA: cd.teamAIds.map(id => roster.find(c => c.id === id)).filter(Boolean),
          teamB: cd.teamBIds.map(id => roster.find(c => c.id === id)).filter(Boolean),
        };
        if (crCard.teamA.length === 3 && crCard.teamB.length === 3) {
          const crResult = { matches: crMatchResults, winsA: crWinsA, winsB: crWinsB, teamWin: crTeamWin };
          const appliedCR = App._applyChallengeRequestResult({ ...s, roster }, crCard, crResult);
          s = appliedCR;
          roster = appliedCR.roster;
          // 結果モーダルは結果画面表示前にキューで消化する(F08/F09と同じ「予約→drain」パターン)
          s = { ...s, _pendingChallengeRequestResult: { card: crCard, result: crResult } };
        }
      }
      // ゲストも怪我・成長・関係変化まで通常の興行後処理を通し、最後に所属団体へ戻す。
      App._crGuestSyncData = {
        guestIds: [...cd.guestIds],
        guestOrgId: cd.isInverse ? cd.requesterOrgId : cd.opponentOrgId,
        playerRosterIds: [...(cd.playerRosterIds || [])],
      };
      s = { ...s, roster };
      App._crMatchData = null;
    }

    // 集客v2: matchAppeals→showDraw→attendance算出
    const appFanExpects = Engine.fanExpect.generate(s);
    const appMatchAppeals = validMatches.map((m, matchIndex) => {
      if (m.matchType === 'tag') {
        // タッグ: 4人の平均集客力で簡易計算
        const ids = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        const fighters = ids.map(id => roster.find(c => c.id === id)).filter(Boolean);
        if (fighters.length < 4) return 0;
        return fighters.reduce((sum, f) => sum + Engine.attendanceV2.calcDrawPower(f, s), 0) / 2;
      }
      // 挑戦試合のゲストは結果処理後に一時ロスターから外れるため、
      // 解決済み結果に保持されている選手データをフォールバックに使う。
      const fA = roster.find(c => c.id === m.left) || results[matchIndex]?.left;
      const fB = roster.find(c => c.id === m.right) || results[matchIndex]?.right;
      if (!fA || !fB) return { totalAppeal: 0 };
      const rivalryAB = s.relationships ? (s.relationships[`${m.left}>${m.right}`]?.rivalry || 0) : 0;
      const rivalryBA = s.relationships ? (s.relationships[`${m.right}>${m.left}`]?.rivalry || 0) : 0;
      const isFanExpect = appFanExpects && appFanExpects.some(fe =>
        (fe.leftId === m.left && fe.rightId === m.right) || (fe.leftId === m.right && fe.rightId === m.left));
      const appRivalryLevel = Engine.title.getRivalryLevel(s, m.left, m.right);
      const appPendingClash = appRivalryLevel?.pendingClashBonus || 0;
      const appFr = Engine.freshness.calc(s.matchupLog || [], m.left, m.right, s.totalShows, s.roster.length, null);
      const isF08Match = !!m._f08Locked || (Engine.factions && Engine.factions.isF08DirectiveMatch && Engine.factions.isF08DirectiveMatch(s, m.left, m.right));
      return Engine.attendanceV2.calcMatchAppeal(fA, fB, {
        rivalry: Math.max(rivalryAB, rivalryBA), isTitle: !!m.isTitle, isFanExpect,
        isChallengeRequest: !!(m._crMatchLocked || m.isCRMatch),
        pendingClashBonus: appPendingClash, isFirstMeet: appFr.isFirstMeet, freshnessCount: appFr.countInWindow,
        freshnessRawBonus: appFr.bonus,
        isF08Match,
      }, s);
    });
    const _appUsedIds = new Set();
    validMatches.forEach(m => {
      if (m.matchType === 'tag') { [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2].forEach(id => _appUsedIds.add(id)); }
      else { _appUsedIds.add(m.left); _appUsedIds.add(m.right); }
    });
    const appNonMatchPromo = roster.filter(c => !_appUsedIds.has(c.id)).reduce((sum, c) => sum + (c.promoStack || 0), 0);
    const appShowDraw = Engine.attendanceV2.calcShowDraw(appMatchAppeals, appNonMatchPromo, s.showVenue);
    const attendRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xA77E));
    const appV2Result = Engine.attendanceV2.calcAttendanceV2(s, s.showVenue, appShowDraw, validMatches, attendRng);
    let preAttendance = appV2Result.attendance;
    // MQ再設計P3c(§3.2): fp(fill pressure)算出用の「キャパでクランプする前の需要」。
    let rawDemand = appV2Result.rawDemand;
    if (validMatches.some(m => m && m._unifiedTitleMatch)) {
      preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * 1.25));
      rawDemand = Math.round(rawDemand * 1.25);
    }
    // v1.5s25b: attendance_boost バフ（マイルストーン）
    const attendBoostBuffPre = (s.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
    if (attendBoostBuffPre) {
      preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * attendBoostBuffPre.multiplier));
      rawDemand = Math.round(rawDemand * attendBoostBuffPre.multiplier);
    }
    // mq_boost バフに付随する集客倍率（カードイベント effect 拡張で MQ+ と同時に集客効果を持つようになった）
    const mqBoostWithAttendance = (s.milestoneBuffs || []).find(b => b.type === 'mq_boost' && b.attendanceMultiplier);
    if (mqBoostWithAttendance) {
      preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * mqBoostWithAttendance.attendanceMultiplier));
      rawDemand = Math.round(rawDemand * mqBoostWithAttendance.attendanceMultiplier);
    }
    // next_match_mq バフは特定ペア対象。該当ペアが showCard のいずれかに組まれていれば、その興行の集客倍率を適用
    const nextMatchMqWithAttendance = (s.milestoneBuffs || []).find(b => b.type === 'next_match_mq' && b.attendanceMultiplier && b.pair);
    if (nextMatchMqWithAttendance) {
      const [p1, p2] = nextMatchMqWithAttendance.pair;
      const pairInCard = (s.showCard || []).some(slot => {
        if (!slot) return false;
        if (slot.matchType === 'tag') {
          const ids = [slot.teamA?.fighter1, slot.teamA?.fighter2, slot.teamB?.fighter1, slot.teamB?.fighter2].filter(Boolean);
          return ids.includes(p1) && ids.includes(p2);
        }
        return (slot.left === p1 && slot.right === p2) || (slot.left === p2 && slot.right === p1);
      });
      if (pairInCard) {
        preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * nextMatchMqWithAttendance.attendanceMultiplier));
        rawDemand = Math.round(rawDemand * nextMatchMqWithAttendance.attendanceMultiplier);
      }
    }
    // 興行結果画面で動員数を表示するためにstateに保存
    s = { ...s, lastShowAttendance: preAttendance };
    // D層 first_dome_sellout: postShow トリガー設定
    if (s.showVenue === 9 && !(s.milestones?.first_dome_sellout)) {
      const _domeCap = VENUES[9]?.cap || 22500;
      if (preAttendance / _domeCap >= 0.95) s = { ...s, _pendingDomeSelloutCeremony: true };
    }
    // MQ再設計P3c(§3.2/§3.2b): venueHeat = tierAmp(会場の器) × pressureFactor(fp)。
    const fp = rawDemand / VENUES[s.showVenue].cap;
    const venueHeatResult = Engine.economy.calcVenueHeat(s.showVenue, fp);
    if (venueHeatResult.crowdLabel) {
      const heatText = Math.round(venueHeatResult.total * 10) / 10;
      events.push(`🏟️ ${venueHeatResult.crowdLabel}（観客熱 ${heatText >= 0 ? '+' : ''}${heatText}）`);
    }

    // UI and headless share the same context builder and finalizer.
    // MQ再設計P3b: next_match_mqの対象試合はカード順のみで決まる純関数(シム前の解決と対称)。
    let nextMatchMqConsumed = false;
    const nextMatchMqTargetIdx = Engine.mq.resolveNextMatchMqTargetIndex(validMatches, s.milestoneBuffs);
    results.forEach((r, i) => {
      const m = validMatches[i];
      const profile = r.matchType === 'tag' ? 'normal-tag' : 'normal-single';
      const context = Engine.mq.buildNormalContext(
        { ...s, roster, rivalries },
        r,
        m,
        {
          roster,
          rivalries,
          path: 'App._finalizeShowImpl',
          matchIndex: i,
          venueHeat: venueHeatResult.total,
          fp,
          pressureFactor: venueHeatResult.pressureFactor,
          nextMatchMqApplied: i === nextMatchMqTargetIdx,
        });
      const finalized = Engine.mq.finalize(s, r, context, profile);
      r.mq = finalized.mq;
      r.mqInventory = finalized.mqInventory;
      r.externalMQBonus = finalized.externalMQBonus;
      if (finalized.trustMQPenalty < 0) r.trustMQPenalty = finalized.trustMQPenalty;
      if (finalized.lastRunFighterId != null) {
        r.isLastRunMatch = true;
        r.lastRunFighterId = finalized.lastRunFighterId;
      }
      if (finalized.consumedNextMatchMqBuff) nextMatchMqConsumed = true;

      // Keep freshness labels for future attendance use; do not add them to MQ.
      if (m.matchType !== 'tag') {
        const appFreshnessRng = Engine.rng.create(
          Engine.rng.derive(s.rngSeed, s.season, s.week, 0xF5E5, i));
        const fr = Engine.freshness.calc(
          s.matchupLog || [], m.left, m.right,
          s.totalShows, s.roster.length, appFreshnessRng);
        if (fr.bonus !== 0) {
          r.freshnessBonus = fr.bonus;
          r.freshnessLabel = fr.label;
        }
      }
    });
    if (nextMatchMqConsumed) {
      s = {
        ...s,
        milestoneBuffs: (s.milestoneBuffs || [])
          .filter(buff => buff.type !== 'next_match_mq'),
      };
    }
    results.forEach((result, matchIndex) => {
      const slot = validMatches[matchIndex];
      const holderIds = result.matchType === 'tag'
        ? [
            slot?.teamA?.fighter1, slot?.teamA?.fighter2,
            slot?.teamB?.fighter1, slot?.teamB?.fighter2,
          ]
        : [slot?.left, slot?.right];
      s = Engine.mq.updateRecord(s, result, {
        holderIds,
        orgId: 'player',
        stage: 'normal',
      }).state;
    });

    // 因縁決着判定（MQ確定後、保留ペアのみ）
    // **1興行に出す決着は1件まで**(2026-07-27 Keisuke)。
    // おまかせ編成のように同じ組が繰り返し当たる組み方だと全ペアが同時に条件を満たし、
    // ひとつの興行で6件まとめて決着していた（実測で再現）。6件並ぶと1件の重みが消える。
    // 溢れた分は決着させず recordRivalry に回す＝対戦回数が積み上がったまま次の興行へ持ち越す。
    // 閾値そのもののばらつきは Engine.title._resolutionSpread が担当（同期を崩す側の手当）。
    const rivalryResolutions = [];
    const MAX_RESOLUTIONS_PER_SHOW = 1;
    deferredRivalryIdxs.forEach(idx => {
      const r = results[idx];
      const m = validMatches[idx];
      if (!r || !m) return;
      if (!_sameSinglesPair(m, r)) {
        console.warn('[WM] rivalry settlement skipped: card/result participants differ', { index: idx, match: m, result: r });
        return;
      }
      const charL = roster.find(c => c.id === m.left);
      const charR = roster.find(c => c.id === m.right);
      if (!charL || !charR) return;
      const avgOV = (Engine.util.ov(charL) + Engine.util.ov(charR)) / 2;
      const key = Engine.title.getRivalryKey(m.left, m.right);
      const currentEntry = rivalries[key] || {};
      const pairState = Engine.title.getRivalryPairState({ ...s, rivalries }, m.left, m.right);
      const resolution = rivalryResolutions.length >= MAX_RESOLUTIONS_PER_SHOW
        ? null   // 今夜はもう1件出している。この組は持ち越し
        : Engine.title.checkResolution(pairState, r.mq, avgOV, currentEntry.resolutionCount || 0);
      if (resolution) {
        const isFinalResolution = resolution.newResolutionCount >= 2;
        const resRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, m.left, m.right, 0xBE77));
        const nextRivalry = resolution.rivalryRange[0] + Engine.rng.int(resRng, 0, resolution.rivalryRange[1] - resolution.rivalryRange[0]);
        const winnerId = r.winner === 'left' ? m.left : (r.winner === 'right' ? m.right : m.left);
        const updatedEntry = {
          ...rivalries[key],
          matches: 0,
          lastWeek: s.week,
          lastAbsWeek: Engine.util.absWeek(s.season, s.week),
          lastResolvedWeek: s.week,
          resolutionCount: resolution.newResolutionCount,
          lastBand: 0,
          oneSided: null,
          pendingClashBonus: 0,
          ...(resolution.resolved ? { resolved: resolution.resolved } : {}),
          ...(resolution.resolved === 'bitter' ? { bitterResolutionWinnerId: winnerId } : {}),
        };
        rivalries = { ...rivalries, [key]: updatedEntry };
        if (s.relationships) {
          const rels = { ...(s.relationships || {}) };
          const keyAB = `${m.left}>${m.right}`;
          const keyBA = `${m.right}>${m.left}`;
          const relAB = { ...(rels[keyAB] || { bond: 50, rivalry: 0 }) };
          const relBA = { ...(rels[keyBA] || { bond: 50, rivalry: 0 }) };
          relAB.rivalry = Engine.relationships._clampAxisValue(nextRivalry, 'rivalry');
          relBA.rivalry = Engine.relationships._clampAxisValue(nextRivalry, 'rivalry');
          rels[keyAB] = relAB;
          rels[keyBA] = relBA;
          s = { ...s, relationships: rels };
        }
        roster = roster.map(c => {
          if (c.id === m.left || c.id === m.right) {
            return { ...c, popularity: Math.min(100, (c.popularity || 0) + resolution.popBonus) };
          }
          return c;
        });
        const rivalOrgPopDelta = Engine.orgPop.applyOrgPopChange(resolution.orgPopBonus, s.orgPop, null);
        s = { ...s, orgPop: Engine.util.clamp((s.orgPop || 0) + rivalOrgPopDelta, 0, 100) };
        const loserId = winnerId === m.left ? m.right : m.left;
        const winnerName = charL.id === winnerId ? charL.name : charR.name;
        const loserName = charL.id === loserId ? charL.name : charR.name;
        rivalryResolutions.push({
          phase: 'resolution', winnerId, loserId, winnerName, loserName,
          resolutionType: resolution.resolved || 'first',
          isFate: pairState.minRivalry >= 70,
          isSecondResolution: isFinalResolution,
          popBonus: resolution.popBonus, orgPopBonus: rivalOrgPopDelta,
        });
        r.rivalryResolved = true;
        r.rivalryResolutionValue = nextRivalry;
        r.rivalryResolutionType = resolution.resolved || 'first';
        if (!s._rivalryResolvedThisWeek) s = { ...s, _rivalryResolvedThisWeek: [] };
        s._rivalryResolvedThisWeek.push({ fighterId: m.left, fighter2Id: m.right });
        const emoji = resolution.emoji || '⚡';
        const label = resolution.label || (isFinalResolution ? '最終決着' : '宿敵戦勝利');
        events.push(`${emoji} ${winnerName} vs ${loserName} — ${label}！ 両者人気+${resolution.popBonus} 団体人気+${Math.round(rivalOrgPopDelta * 10) / 10}`);
      } else {
        // 決着不成立: 通常通り recordRivalry
        const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right, r.mq);
        rivalries = rivalResult.rivalries;
        if (rivalResult.msg) events.push(rivalResult.msg);
      }
    });
    App._pendingRivalryResolutions = rivalryResolutions;

    // MQ popularity (タッグ: 4人に分配)
    const mainEventIdx = 0; // index 0 = main event in showCard order
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      const isMainEvent = idx === mainEventIdx;
      if (r.matchType === 'tag') {
        // タッグ: perFighterの全選手にMQ人気を適用（Engine.executeShow L7709パターン）
        const allIds = Object.keys(r.perFighter).map(Number);
        const winIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
          : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
        allIds.forEach(cid => {
          const fighter = roster.find(c => c.id === cid);
          if (!fighter) return;
          const isWin = winIds.includes(cid);
          const fakeSingleResult = { mq: r.mq, winner: isWin ? 'left' : (r.winner === 'draw' ? 'draw' : 'right'),
            left: fighter, right: fighter };
          const mqPop = Engine.applyMQPopularity(roster, fakeSingleResult, isMainEvent, s.orgPop || 0, s);
          roster = mqPop.roster;
        });
      } else {
        const mqPop = Engine.applyMQPopularity(roster, r, isMainEvent, s.orgPop || 0, s);
        roster = mqPop.roster;
      }
    });
    // 集客v2: ★算出
    const avgMQ = Math.round(results.reduce((a, r) => a + r.mq, 0) / results.length);
    const appRatingCtx = {
      hasTitleMatch: validMatches.some(m => m.isTitle),
      titleGreatMQ: validMatches.some(m => m.isTitle) ? results.find((r, i) => validMatches[i]?.isTitle)?.mq || 0 : 0,
      rivalryResolved: results.some(r => r.rivalryResolved),
      rivalryCards: validMatches.filter(m => {
        if (!s.relationships || m.matchType === 'tag') return false;
        const rAB = s.relationships[`${m.left}>${m.right}`]?.rivalry || 0;
        const rBA = s.relationships[`${m.right}>${m.left}`]?.rivalry || 0;
        return Math.max(rAB, rBA) >= 30;
      }).length,
      fanExpectMatches: appFanExpects ? Engine.fanExpect.countMatched(validMatches, appFanExpects) : 0,
    };
    const appRating = Engine.attendanceV2.calcShowRating(results, preAttendance, VENUES[s.showVenue].cap, s.showVenue, appRatingCtx);
    const appStars = appRating.stars;

    const orgPopRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x4F50));
    let popResult = Engine.applyShowPopularity(roster, results, s.orgPop, orgPopRng, appStars);
    roster = popResult.roster;
    const bookedRivalryOrgPopBonus = Engine.title.getBookedRivalryOrgPopBonus(s, validMatches.filter(m => m.matchType !== 'tag').map(m => ({ leftId: m.left, rightId: m.right })));
    if (bookedRivalryOrgPopBonus !== 0) {
      popResult = {
        ...popResult,
        popDelta: Math.round((popResult.popDelta + bookedRivalryOrgPopBonus) * 10) / 10,
        orgPop: Engine.util.clamp((popResult.orgPop || 0) + bookedRivalryOrgPopBonus, 0, 100),
      };
      events.push(`🔥 注目カード効果: 因縁カード編成で団体人気${bookedRivalryOrgPopBonus >= 0 ? '+' : ''}${Math.round(bookedRivalryOrgPopBonus * 10) / 10}`);
    }
    events.push(`📊 ★${appStars} (平均試合評価 ${avgMQ}) → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 100) / 100} (現在: ${Engine.util.dispOrgPop(popResult.orgPop)})`);

    // Heat — ★ベース
    const oldHeat = Engine.heat.getLevel(s);
    const newHeatScore = Engine.heat.calcUpdate(s, appStars);
    const newHeat = Engine.heat.getLevel({ ...s, heatScore: newHeatScore });
    if (oldHeat.id !== newHeat.id) events.push(`${newHeat.emoji} Heat変動: ${oldHeat.label} → ${newHeat.label}（集客倍率 ×${newHeat.mult}）`);

    // Injuries — separate RNG per fighter to avoid correlation (タッグはスキップ — Phase 5対応)
    const injuryResults = [];
    const matchInjuredIds = new Array(results.length).fill(null); // Phase 2: 試合別怪我選手ID
    results.forEach((r, idx) => {
      if (r.matchType === 'tag') return; // タッグ試合の怪我はPhase 5で対応
      const lc = roster.find(c => c.id === r.left.id);
      if (lc && !lc.isIntrusion) { // 乱入選手は怪我判定スキップ
        const injRngL = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.left.id));
        const li = Engine.injury.check(injRngL, lc, r, Engine.coach.getInjuryMult(s, r.left.id), 0, 0, Engine.coach.getInjurySeverityDowngrade(s, r.left.id), Engine.coach.buildInjuryFlavorOpts(s, r.left.id));
        if (li) { if (!matchInjuredIds[idx]) matchInjuredIds[idx] = lc.id; roster = roster.map(c => c.id === lc.id ? li.newFighter : c); injuryResults.push({ id: lc.id, name: lc.name, injury: li.newFighter.injury, retireType: li.retireType || null, farewellKind: li.farewellKind || null }); }
      }
      const rc = roster.find(c => c.id === r.right.id);
      if (rc && !rc.isIntrusion) { // 乱入選手は怪我判定スキップ
        const injRngR = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.right.id));
        const ri = Engine.injury.check(injRngR, rc, r, Engine.coach.getInjuryMult(s, r.right.id), 0, 0, Engine.coach.getInjurySeverityDowngrade(s, r.right.id), Engine.coach.buildInjuryFlavorOpts(s, r.right.id));
        if (ri) { if (!matchInjuredIds[idx]) matchInjuredIds[idx] = rc.id; roster = roster.map(c => c.id === rc.id ? ri.newFighter : c); injuryResults.push({ id: rc.id, name: rc.name, injury: ri.newFighter.injury, retireType: ri.retireType || null, farewellKind: ri.farewellKind || null }); }
      }
    });

    // Phase 2: 試合結果の関係値反映（spec §3.1）
    // losingStreakはMQ popularity更新済み、injuredIdは怪我処理済み、careerBestMQは未更新（後で更新）
    if (s.relationships) {
      const relRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE2A));
      let relState = { ...s, roster, relationshipCounters: s.relationshipCounters };
      results.forEach((r, idx) => {
        const m = validMatches[idx];
        // タッグマッチ: applyTagMatchResult で4者間の関係値を更新
        if (r.matchType === 'tag') {
          const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
          const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
          relState = Engine.relationships.applyTagMatchResult(relState, teamAIds, teamBIds, r, relRng);
          return;
        }
        // シングルマッチ
        const charIdA = r.left.id;
        const charIdB = r.right.id;
        const fA = roster.find(c => c.id === charIdA);
        const fB = roster.find(c => c.id === charIdB);

        let stage = 'normal';
        if (r.isTitleMatch) stage = 'title';

        const champId = m._unifiedTitleMatch ? s.unifiedTitle?.championId : s.titles?.world?.championId;
        const isTitleM = !!r.isTitleMatch;

        const context = {
          mq: r.mq,
          winner: r.winner === 'left' ? 'win' : (r.winner === 'right' ? 'lose' : 'draw'),
          hpA: r.hpLeft, hpB: r.hpRight,
          turns: r.turns,
          stage,
          isTitleMatch: isTitleM,
          isChampionA: isTitleM ? (charIdA === champId) : undefined,
          isChampionB: isTitleM ? (charIdB === champId) : undefined,
          rivalryResolved: !!r.rivalryResolved,
          rivalryResolutionValue: r.rivalryResolutionValue,
          rivalryResolutionType: r.rivalryResolutionType,
          injuredId: matchInjuredIds[idx],
          isCareerBestA: fA ? r.mq > (fA.careerBestMQ || 0) : false,
          isCareerBestB: fB ? r.mq > (fB.careerBestMQ || 0) : false,
          losingStreakA: fA ? (fA.losingStreak || 0) : 0,
          losingStreakB: fB ? (fB.losingStreak || 0) : 0,
          isProveModeA: fA ? (fA.proveMode || 0) > 0 : false,
          isProveModeB: fB ? (fB.proveMode || 0) > 0 : false,
          ovrA: fA ? Engine.util.ov(fA) : 0,
          ovrB: fB ? Engine.util.ov(fB) : 0,
          // 奪還戦と挑戦試合は cross-org。挑戦試合は決着ではなく因縁を増幅する。
          isCrossOrg: !!(m.isReclaim || m.isCRMatch || m._crMatchLocked || m._awayChallengeMatch || m._unifiedTitleMatch),
          isChallengeShowMatch: !!(m.isCRMatch || m._crMatchLocked || m._awayChallengeMatch),
        };
        relState = Engine.relationships.applyMatchResult(relState, charIdA, charIdB, context, relRng);
        if (context._challengeRelationshipDelta) r._challengeRelationshipDelta = context._challengeRelationshipDelta;
      });
      roster = relState.roster || roster;
      s = { ...s, relationships: relState.relationships, relationshipCounters: relState.relationshipCounters };
      if (s._pendingChallengeRequestResult) {
        const pendingResult = s._pendingChallengeRequestResult;
        const matchesWithRelations = pendingResult.result.matches.map(match => {
          const source = results.find(r => r?.left?.id === match.fighterA.id && r?.right?.id === match.fighterB.id);
          return source?._challengeRelationshipDelta
            ? { ...match, relationshipDelta: source._challengeRelationshipDelta }
            : match;
        });
        s = {
          ...s,
          _pendingChallengeRequestResult: {
            ...pendingResult,
            result: { ...pendingResult.result, matches: matchesWithRelations },
          },
        };
      }
      // Phase 4: 興行コンテキストの関係値反映（C-04/C-05/C-06/C-10）
      const showCtxRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE5C));
      s = Engine.relationships.applyShowContextEffects(s, validMatches, results, preShowLosingStreaks, showCtxRng);
    }

    // ── task-79: Common-1 興行予約(bookedCommon1)の清算 ──
    // 枠(メイン/セミ/中盤)は問わない。今週のカードに予約ペアの一致する対戦が
    // 実際に組まれていれば、既存の因縁清算(applyCommon1MatchResult)を適用する。
    // 特別興行週/PPV週や、他の予約試合(CH/B3/F09/派閥内序列戦/奪還戦)と同一興行での
    // 重複はここで弾き、繰り越す(§5-D鉄則: fail-openで例外は握りつぶし進行を止めない)。
    if (s.bookedCommon1 && Engine.factions && typeof Engine.factions.findBookedCommon1CardIndex === 'function') {
      try {
        const eligibleShow = !!(Engine.challengeRequest && Engine.challengeRequest.isEligibleHomeShow
          && Engine.challengeRequest.isEligibleHomeShow(s));
        const noCompeting = eligibleShow && !Engine.factions.hasCompetingBooking(validMatches);
        const c1Idx = noCompeting ? Engine.factions.findBookedCommon1CardIndex(s, validMatches) : -1;
        if (c1Idx >= 0 && results[c1Idx] && Engine.factions.isBookedCommon1Valid(s)) {
          const booking = s.bookedCommon1;
          const m = validMatches[c1Idx];
          const r = results[c1Idx];
          // 通常興行の試合エンジンは時間切れでも判定勝ちを返すため、ここには必ず左右どちらかの勝者が来る。
          const winnerId = r.winner === 'left' ? m.left : m.right;
          const loserId  = r.winner === 'left' ? m.right : m.left;
          const c1Rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xC0B1));
          const c1Result = Engine.factions.applyCommon1MatchResult(s, booking, winnerId, loserId, c1Rng);
          s = c1Result.state;
          const { bookedCommon1: _doneC1, ...restC1 } = s;
          s = {
            ...restC1,
            _pendingCommon1Result: {
              payload: booking, matchResult: r,
              fighterAId: booking.fighterAId, fighterBId: booking.fighterBId,
              applyResult: {
                resultText: c1Result.resultText,
                impactSummary: c1Result.impactSummary,
                winnerId: c1Result.winnerId,
                loserId: c1Result.loserId,
                winnerName: c1Result.winnerName,
                loserName: c1Result.loserName,
                factionName: c1Result.factionName,
                isUpset: c1Result.isUpset,
                upsetTag: c1Result.upsetTag,
              },
            },
          };
          wmDiag(`[WM Faction] Common-1 booking resolved this show (slot ${c1Idx})`);
        }
      } catch (e) {
        console.error('[WM Faction] Common-1 booking resolution failed (fail-open, booking left pending):', e);
      }
    }

    // ── F08 ディレクティブ: 直接対決試合の結果を派閥勢い/対立度に 1.5× で反映
    //    + 両派閥リーダー間 rivalry に +30〜40 の大幅ブースト + ディレクティブクリア ──
    if (s._pendingF08Directive && Engine.factions && typeof Engine.factions.applyMatchResult === 'function') {
      const d = s._pendingF08Directive;
      const f08Rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xFA88));
      let executed = false;
      validMatches.forEach((m, idx) => {
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r) return;
        const hit = (m.left === d.leaderAId && m.right === d.leaderBId) || (m.left === d.leaderBId && m.right === d.leaderAId);
        if (!hit) return;
        const winnerToken = r.winner === 'left' ? (m.left === d.leaderAId ? 'A' : 'B')
          : r.winner === 'right' ? (m.right === d.leaderAId ? 'A' : 'B')
          : 'draw';
        s = Engine.factions.applyMatchResult(s, m.left, m.right, { winner: winnerToken }, f08Rng, { variationMultiplier: (FACTION_CONFIG && FACTION_CONFIG.f08MatchResultMultiplier) || 1.5 });
        // 両リーダー間 rivalry を +30〜40 の大幅ブースト（通常試合 +5〜10 の 4 倍程度）
        // → リーダー同士の因縁が強烈に深まり、次の F02/F03 への発展を加速
        const rivalryBoost = 30 + Math.floor(Engine.rng.float(f08Rng) * 11);
        const keyAB = `${d.leaderAId}|${d.leaderBId}`;
        const keyBA = `${d.leaderBId}|${d.leaderAId}`;
        const rels = { ...(s.relationships || {}) };
        if (rels[keyAB] && rels[keyBA]) {
          const clamp = (v) => Math.max(-100, Math.min(100, v));
          rels[keyAB] = { ...rels[keyAB], rivalry: clamp((rels[keyAB].rivalry || 0) + rivalryBoost) };
          rels[keyBA] = { ...rels[keyBA], rivalry: clamp((rels[keyBA].rivalry || 0) + rivalryBoost) };
          s = { ...s, relationships: rels };
          wmDiag(`[WM Faction] F08 direct bout rivalry boost: leaders ${d.leaderAId}↔${d.leaderBId} rivalry +${rivalryBoost}`);
        }
        executed = true;
      });
      // 該当試合が実行されたかに関わらず、この興行後はディレクティブを落とす
      if (executed) wmDiag('[WM Faction] F08 directive resolved by direct match');
      const { _pendingF08Directive: _, ...rest } = s;
      s = rest;
    }

    // ── Phase C: F07 DEMAND_MAIN ディレクティブ消化（6興行縛り）──
    // 各興行ごとに評価: メインに当該派閥メンバーが入っていれば members trust +1、
    // 入っていなければ leader trust -2。remainingShows をデクリメント、0 で解除。
    if (s._pendingF07Directive && s._pendingF07Directive.type === 'DEMAND_MAIN') {
      const dir = s._pendingF07Directive;
      const fac = (s.factions || []).find(f => f.id === dir.factionId);
      if (fac) {
        const mainMatch = validMatches[0];
        let containsFactionMember = false;
        if (mainMatch) {
          if (mainMatch.matchType === 'tag') {
            const ids = [mainMatch.teamA?.fighter1, mainMatch.teamA?.fighter2, mainMatch.teamB?.fighter1, mainMatch.teamB?.fighter2].filter(Boolean);
            containsFactionMember = ids.some(id => fac.memberIds.includes(id));
          } else {
            containsFactionMember = (mainMatch.left && fac.memberIds.includes(mainMatch.left)) || (mainMatch.right && fac.memberIds.includes(mainMatch.right));
          }
        }
        if (containsFactionMember && Engine.factions._applyTrustToMembers) {
          s = Engine.factions._applyTrustToMembers(s, fac.memberIds, 1);
          wmDiag(`[WM Faction] F07 DEMAND_MAIN fulfilled (this show): ${fac.name} member appeared in main`);
        } else if (Engine.factions._applyTrustToMembers && fac.leaderId) {
          s = Engine.factions._applyTrustToMembers(s, [fac.leaderId], -2);
          wmDiag(`[WM Faction] F07 DEMAND_MAIN unfulfilled (this show): ${fac.name} leader trust -2`);
        }
      }
      // remainingShows をデクリメント、0 で解除
      const remaining = (dir.remainingShows != null ? dir.remainingShows : 1) - 1;
      if (remaining > 0) {
        s = { ...s, _pendingF07Directive: { ...dir, remainingShows: remaining } };
      } else {
        const { _pendingF07Directive: _, ...restF07 } = s;
        s = restF07;
        wmDiag(`[WM Faction] F07 DEMAND_MAIN directive expired`);
      }
    }

    // ── Phase B: F09 派閥対抗戦 — sweep ボーナス適用 + Ending モーダル予約 + pending クリア ──
    if (s._pendingF09 && Engine.factions && typeof Engine.factions.applyF09SweepBonus === 'function') {
      const f09 = s._pendingF09;
      const sweepResults = [];
      validMatches.forEach((m, idx) => {
        if (!m._f09Locked) return;
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r || r.winner === 'draw') return;
        const winnerId = r.winner === 'left' ? m.left : m.right;
        const winnerFaction = Engine.factions.getFactionByFighterId(s, winnerId);
        if (!winnerFaction) return;
        sweepResults.push({ winnerFactionId: winnerFaction.id });
      });
      if (sweepResults.length > 0) {
        s = Engine.factions.applyF09SweepBonus(s, f09.factionAId, f09.factionBId, sweepResults);
      }
      // factionTimeline に F09 完遂エントリ
      if (Array.isArray(s.factionTimeline)) {
        s = { ...s, factionTimeline: [...s.factionTimeline, {
          type: 'F09_RESOLVED',
          season: s.season, week: s.week,
          factionAId: f09.factionAId, factionBId: f09.factionBId,
          matchCount: sweepResults.length,
        }]};
      }
      // Ending モーダル用ペイロードを予約（drainF09Ending で消費）
      const winsA = sweepResults.filter(r => r.winnerFactionId === f09.factionAId).length;
      const winsB = sweepResults.filter(r => r.winnerFactionId === f09.factionBId).length;
      if (winsA !== winsB) {
        const winFid = winsA > winsB ? f09.factionAId : f09.factionBId;
        const losFid = winFid === f09.factionAId ? f09.factionBId : f09.factionAId;
        const winF = (s.factions || []).find(f => f.id === winFid);
        const losF = (s.factions || []).find(f => f.id === losFid);
        if (winF && losF) {
          const winLeader = (s.roster || []).find(c => c.id === winF.leaderId);
          const losLeader = (s.roster || []).find(c => c.id === losF.leaderId);
          // 業界ニュース: 派閥対抗戦決着
          s = Engine.industryNews.push(s, {
            type: 'factionWarSettled',
            characterId: winF.leaderId || null,
            data: {
              org: s.orgName || 'プレイヤー団体',
              winFaction: winF.name,
              loseFaction: losF.name,
              score: `${Math.max(winsA, winsB)}勝${Math.min(winsA, winsB)}敗`,
              winLeader: winLeader ? winLeader.name : '?',
              loseLeader: losLeader ? losLeader.name : '?',
            },
          });
          const pickLine = (table, fighter) => {
            if (!table || !fighter) return '';
            const p = (Engine.contract && Engine.contract.getPersonalityType) ? Engine.contract.getPersonalityType(fighter) : 'normal';
            const arch = fighter.archetype || 'standard';
            // 第一分岐はアーキタイプ(口調)。2026-08-01 に軸を入れ替え
            // (a,p) → (a,normal) → (standard,p) → (standard,normal) の4段
            const byA = table[arch] || {};
            const byStd = table.standard || {};
            const byP = byA[p] || byA.normal || byStd[p] || byStd.normal || {};
            const lines = byP.high || byP.mid || byP.low || [];
            return lines.length ? lines[Math.floor(Math.random() * lines.length)] : '';
          };
          const winTable = (typeof FACTION_F09_ENDING_WIN_LINES !== 'undefined') ? FACTION_F09_ENDING_WIN_LINES : null;
          const losTable = (typeof FACTION_F09_ENDING_LOSE_LINES !== 'undefined') ? FACTION_F09_ENDING_LOSE_LINES : null;
          const winnerScore = winFid === f09.factionAId ? winsA : winsB;
          const loserScore = winFid === f09.factionAId ? winsB : winsA;
          s = { ...s, _pendingF09Ending: {
            winnerFaction: { name: winF.name, leaderId: winF.leaderId, leaderName: winLeader ? winLeader.name : '' },
            loserFaction:  { name: losF.name, leaderId: losF.leaderId, leaderName: losLeader ? losLeader.name : '' },
            winnerLine: pickLine(winTable, winLeader),
            loserLine: pickLine(losTable, losLeader),
            scoreA: winsA, scoreB: winsB,
            winnerScore, loserScore,
            swept: Math.abs(winsA - winsB) >= 2,
            narration: `${winF.name}が${winF.name === winF.name && winsA > winsB ? winsA + '勝' + winsB + '敗' : winsB + '勝' + winsA + '敗'}で${losF.name}を制した――対抗戦は決着した。`,
          }};
        }
      }
      const { _pendingF09: _f9, ...restF9 } = s;
      s = restF9;
      wmDiag('[WM Faction] F09 sweep bonus applied');
    }

    // ── 派閥内序列戦 試合結果反映（spec: faction-internal-rank-spec-v0.2 §4.4）──
    if (Engine.factions && typeof Engine.factions.applyInternalChallengeResult === 'function') {
      validMatches.forEach((m, idx) => {
        if (!m._internalChallengeLocked) return;
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r) return;
        if (r.winner === 'draw') {
          if (typeof Engine.factions.resolveInternalChallengeDraw === 'function') {
            s = Engine.factions.resolveInternalChallengeDraw(s);
          }
          return;
        }
        const winnerId = r.winner === 'left' ? m.left : m.right;
        const loserId  = r.winner === 'left' ? m.right : m.left;
        const winnerHp = (r.winner === 'left' ? r.hpLeft : r.hpRight) || { final: 0, max: 100 };
        const loserHp  = (r.winner === 'left' ? r.hpRight : r.hpLeft) || { final: 0, max: 100 };
        const winnerHpPct = (winnerHp.max > 0) ? (winnerHp.final / winnerHp.max) : 1;
        const loserHpPct  = (loserHp.max > 0) ? (loserHp.final / loserHp.max) : 0;
        const icRng = Engine.rng.create(Engine.rng.derive(s.rngSeed || 1, s.season || 1, s.week || 1, 0xFA21));
        s = Engine.factions.applyInternalChallengeResult(s, {
          winnerId, loserId, winnerHpPct, loserHpPct,
        }, icRng);
      });
    }

    // ── Phase 3e: F08-A 試合後 派閥関係追加変動 + アフターマスモーダル予約 ──
    // _f08Locked がついた試合のうち、勝敗確定したものに対して発火。
    // F02③ resolution が同時発火する試合は extra 効果スキップ（resolution 優先）。
    if (Engine.factions && typeof Engine.factions.applyF08PostMatchExtraEffects === 'function') {
      validMatches.forEach((m, idx) => {
        if (!m._f08Locked) return;
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r || r.winner === 'draw') return;
        const winnerId = r.winner === 'left' ? m.left : m.right;
        const loserId  = r.winner === 'left' ? m.right : m.left;

        // F02③ resolution 同時発火判定（リーダー同士 + 両方向 hostility ≥60）
        let isF02ResolutionFiring = false;
        if (typeof Engine.factions.rollResolutionAfterMatch === 'function') {
          const probe = Engine.factions.rollResolutionAfterMatch(s, { winnerId, loserId, isDraw: false });
          if (probe && probe.pendingEvent && probe.pendingEvent.eventId === 'F02_RESOLUTION') {
            isF02ResolutionFiring = true;
          }
        }

        // HP残量パーセント
        const loserSide = (winnerId === m.left) ? 'right' : 'left';
        const loserHp = (loserSide === 'left' ? r.hpLeft : r.hpRight) || { final: 0, max: 100 };
        const loserHpPct = (loserHp.max > 0) ? (loserHp.final / loserHp.max) : 0;
        const winnerHp = (loserSide === 'left' ? r.hpRight : r.hpLeft) || { final: 0, max: 100 };
        const winnerHpPct = (winnerHp.max > 0) ? (winnerHp.final / winnerHp.max) : 1;

        const matchResult = { winnerId, loserId, winnerHpPct, loserHpPct };

        // 1) 派閥関係追加変動
        s = Engine.factions.applyF08PostMatchExtraEffects(s, matchResult, isF02ResolutionFiring);

        // 2) アフターマスモーダル予約（F02③ 同時発火時はスキップ — resolution 演出が優先）
        if (!isF02ResolutionFiring && typeof Engine.factions.getF08AftermathData === 'function') {
          const matchId = `${s.season}-${s.week}-${idx}`;
          const shown = s._shownF08PostMatchIds || [];
          if (!shown.includes(matchId)) {
            const data = Engine.factions.getF08AftermathData(s, matchResult);
            if (data) {
              const queue = Array.isArray(s._pendingF08Aftermath) ? s._pendingF08Aftermath.slice() : [];
              queue.push({ matchId, data });
              s = { ...s, _pendingF08Aftermath: queue, _shownF08PostMatchIds: [...shown, matchId] };
            }
          }
        }
      });
    }

    // ── v4 §2-1: F02③ 決着 判定（リーダー同士の敵対試合で両方向hostility≥60） ──
    if (Engine.factions && typeof Engine.factions.rollResolutionAfterMatch === 'function' && !s._pendingFactionEvent) {
      for (let i = 0; i < validMatches.length; i++) {
        const m = validMatches[i]; const r = results[i];
        if (!m || !r || m.matchType === 'tag') continue;
        const winnerId = r.winner === 'left' ? m.left : (r.winner === 'right' ? m.right : null);
        const loserId  = r.winner === 'left' ? m.right : (r.winner === 'right' ? m.left : null);
        const isDraw = r.winner === 'draw';
        const res = Engine.factions.rollResolutionAfterMatch(s, { winnerId, loserId, isDraw });
        s = res.state;
        if (res.pendingEvent) { s = { ...s, _pendingFactionEvent: res.pendingEvent }; break; }
      }
    }

    // v1.2: タイトルマッチ実施時に絶対週数を記録(統一王座戦は自団体王座のクールダウンを消費しない)
    const executedTitleMatch = validMatches.some(m => m.isTitle && !m._unifiedTitleMatch);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    // v1.3-2: §2 試合成長 — 怪我処理後、ロスターに残っている出場選手に成長を与える (mirrors Engine.executeShow)
    const matchGrowthRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 1732));
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      // タッグマッチ: 4人に成長配分（Engine.executeShow L8087-8117パターン）
      let growthEntries;
      if (r.matchType === 'tag') {
        const allIds = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        const winTeamIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
          : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
        growthEntries = allIds.map(charId => {
          const isTeamA = charId === m.teamA.fighter1 || charId === m.teamA.fighter2;
          const oppIds = isTeamA ? [m.teamB.fighter1, m.teamB.fighter2] : [m.teamA.fighter1, m.teamA.fighter2];
          const oppOvr = Math.max(...oppIds.map(id => { const f = roster.find(c => c.id === id); return f ? Engine.util.ov(f) : 50; }));
          const partnerId = isTeamA ? (charId === m.teamA.fighter1 ? m.teamA.fighter2 : m.teamA.fighter1) : (charId === m.teamB.fighter1 ? m.teamB.fighter2 : m.teamB.fighter1);
          const partnerName = (roster.find(c => c.id === partnerId) || {}).name || '?';
          const oppNames = oppIds.map(id => (roster.find(c => c.id === id) || {}).name || '?').join('&');
          return { charId, won: winTeamIds.includes(charId), oppOvr, oppLabel: `w/${partnerName} vs ${oppNames}` };
        });
      } else {
        growthEntries = [
          { charId: r.left.id, won: r.winner === 'left', oppOvr: null, oppLabel: null },
          { charId: r.right.id, won: r.winner === 'right', oppOvr: null, oppLabel: null },
        ];
      }
      growthEntries.forEach(({ charId, won, oppOvr: preOppOvr, oppLabel }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter || fighter.isIntrusion) return;
        let oppOvr;
        if (preOppOvr !== null) { oppOvr = preOppOvr; } // タッグ: 事前計算済み
        else {
          const oppId = charId === r.left.id ? r.right.id : r.left.id;
          const oppInRoster = roster.find(c => c.id === oppId);
          const oppRaw = charId === r.left.id ? r.right : r.left;
          oppOvr = oppInRoster ? Engine.util.ov(oppInRoster) : Engine.util.ov(oppRaw);
        }
        const selfOvr = Engine.util.ov(fighter);

        // growth-rebalance v2: 試合成長を適正化
        const matchGrowthBase = GROWTH_CONFIG.matchGrowthBase;
        const opponentBonus = Engine.util.clamp((oppOvr - selfOvr) / 15, -0.2, 0.5);
        const closeMatchBonus = r.mq >= 65 ? 0.3 : 0.0;
        const resultBonus = won ? 0.0 : 0.2;
        const coachMatchBonus = Engine.coach.getMatchGrowthBonus(s, charId);
        let matchGrowth = matchGrowthBase + opponentBonus + closeMatchBonus + resultBonus + coachMatchBonus;

        if (fighter.growthPenalty) {
          const rawMult = fighter.growthPenalty.multiplier;
          matchGrowth *= (rawMult < 1.0 && Traits.has(fighter, '適応力')) ? Math.min(1.0, rawMult + 0.2) : rawMult;
        }

        const allStats = ['pw', 'sp', 'te', 'st', 'mn'];
        const numStats = Engine.rng.float(matchGrowthRng) < 0.5 ? 1 : 2;
        const pool = [...allStats];
        const chosen = [];
        for (let i = 0; i < numStats; i++) {
          const idx = Engine.rng.int(matchGrowthRng, 0, pool.length - 1);
          chosen.push(pool.splice(idx, 1)[0]);
        }
        const growthPerStat = matchGrowth / numStats;

        const _mOpp = oppLabel || (charId === r.left?.id ? (r.right?.name || '?') : (r.left?.name || '?'));
        const _mRes = r.winner === 'draw' ? 'draw' : (won ? 'win' : 'lose');
        roster = roster.map(c => {
          if (c.id !== charId) return c;
          let nc = { ...c, seasonGrowth: { ...(c.seasonGrowth || {pw:0,sp:0,te:0,st:0,mn:0}) } };
          const _mD = {};
          chosen.forEach(stat => {
            const gain = Math.max(0, Math.round(growthPerStat));
            const cap = nc.trainCap?.[stat] || 100;
            const actualGain = Math.max(0, Math.min(gain, cap - (nc[stat] || 0)));
            if (actualGain > 0) {
              nc[stat] = (nc[stat] || 0) + actualGain;
              nc.seasonGrowth[stat] = (nc.seasonGrowth[stat] || 0) + actualGain;
              _mD[stat] = actualGain;
            }
          });
          if (nc.growthLog && !nc.isRental) {
            const _me = { season: s.season, week: s.week, type: 'match', detail: `vs ${_mOpp}`, opponent: _mOpp, result: _mRes };
            if (Object.keys(_mD).length > 0) _me.deltas = _mD;
            nc.growthLog = [...nc.growthLog, _me];
          }
          return nc;
        });
      });
    });

    s = { ...s, roster, rivalries, titles, heatScore: newHeatScore, orgPop: popResult.orgPop, lastShowResults: results, lastTitleMatchWeek };

    // v0.95: Season stats
    const stats = { ...G.seasonStats };
    stats.showCount++;
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      if (r.matchType === 'tag') {
        const tA1 = roster.find(c => c.id === m.teamA.fighter1);
        const tA2 = roster.find(c => c.id === m.teamA.fighter2);
        const tB1 = roster.find(c => c.id === m.teamB.fighter1);
        const tB2 = roster.find(c => c.id === m.teamB.fighter2);
        if (r.mq > stats.bestMQ) { stats.bestMQ = r.mq; stats.bestMQMatch = `${tA1?.name||'?'} & ${tA2?.name||'?'} vs ${tB1?.name||'?'} & ${tB2?.name||'?'}`; }
        if (r.winner === 'teamA' || r.winner === 'teamB') stats.wins++;
        if (r.winner === 'draw') stats.draws++;
      } else {
        if (r.mq > stats.bestMQ) { stats.bestMQ = r.mq; stats.bestMQMatch = `${r.left.name} vs ${r.right.name}`; }
        if (r.winner === 'left' || r.winner === 'right') stats.wins++;
        if (r.winner === 'draw') stats.draws++;
      }
    });

    // v1.8: §2 ブレークスルー判定 & careerBestMQ 更新（試合後）
    const pendingGrowthEvents = [];
    const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB818));
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      // タッグマッチ: 4人にブレークスルー・スランプ判定
      let btEntries;
      if (r.matchType === 'tag') {
        const allIds = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        const winTeamIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
          : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
        btEntries = allIds.map(charId => {
          const isTeamA = charId === m.teamA.fighter1 || charId === m.teamA.fighter2;
          const oppIds = isTeamA ? [m.teamB.fighter1, m.teamB.fighter2] : [m.teamA.fighter1, m.teamA.fighter2];
          const oppOvr = Math.max(...oppIds.map(id => { const f = roster.find(c => c.id === id); return f ? Engine.util.ov(f) : 50; }));
          return { charId, won: winTeamIds.includes(charId), oppOvr };
        });
      } else {
        btEntries = [
          { charId: r.left.id,  won: r.winner === 'left',  oppOvr: null },
          { charId: r.right.id, won: r.winner === 'right', oppOvr: null },
        ];
      }
      btEntries.forEach(({ charId, won, oppOvr: preOppOvr }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter || fighter.isIntrusion) return;
        let oppOvr;
        if (preOppOvr !== null) { oppOvr = preOppOvr; }
        else {
          const oppId = charId === r.left.id ? r.right.id : r.left.id;
          const oppFighter = roster.find(c => c.id === oppId);
          oppOvr = oppFighter ? Engine.util.ov(oppFighter) : (r[charId === r.left.id ? 'right' : 'left']?.pw ?? 50);
        }
        const isTitle = !!r.isTitleMatch;

        // ブレークスルー判定（careerBestMQ更新前に実施 — mq > prevBest 判定のため）
        const btContext = { isTitle, won, isPPV: isPPV(s.week), isRivalryResolution: !!r.rivalryResolved, isWarMatch: false };
        const btResult = Engine.growthEvents.checkAndApplyBreakthrough(
          btRng, fighter, r.mq, oppOvr, btContext, s.season, s.week, Engine.coach.getFlavorBreakthroughMult(s, fighter.id)
        );
        if (btResult) {
          const btFighter = {
            ...btResult.fighter,
            _trustBonus: (btResult.fighter._trustBonus || 0) + 3.5,
            _trustBonusSources: [...(btResult.fighter._trustBonusSources || []), 'breakthrough'],
          };
          roster = roster.map(c => c.id === charId ? btFighter : c);
          const btHintFighter = roster.find(c => c.id === charId) || fighter;
          const btHintLine = pickDialogueLine(BT_HINT_LINES, btHintFighter);
          pendingGrowthEvents.push({
            type: 'breakthrough', fighterId: charId,
            stat: btResult.stat, gain: btResult.gain, hotStreak: btResult.hotStreak,
            btHint: btHintLine
          });
          // Phase 4 G-01: ブレークスルー → OVR近接キャラからrivalry上昇
          if (s.relationships) {
            const btRelRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE57, charId));
            s = Engine.relationships.applyBreakthroughEffect(s, charId, btRelRng);
          }
        }

        // careerBestMQ 更新（ブレークスルー判定後に実施）
        const btUpdatedFighter = roster.find(c => c.id === charId);
        if (r.mq > (btUpdatedFighter.careerBestMQ || 0)) {
          roster = roster.map(c => c.id === charId
            ? { ...c, careerBestMQ: r.mq, _trustBonus: (c._trustBonus || 0) + 1.2,
                _trustBonusSources: [...(c._trustBonusSources || []), 'careerBestMQ'] }
            : c);
        }

        // §4.2 敗北スランプ判定
        if (!won) {
          const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C6, charId));
          const slumpFighter = roster.find(c => c.id === charId);
          if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
            const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
            roster = roster.map(c => c.id === charId ? newF : c);
            pendingGrowthEvents.push({ type: 'slump_start', fighterId: charId, trigger: 'defeat' });
            // Phase 4 G-03: スランプ → bond60+心配、rivalry30+低下
            if (s.relationships) {
              const symRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE58, charId));
              s = Engine.relationships.applySympathyEffect(s, charId, { min: 1, max: 2 }, symRng);
              // N-05: スランプ八つ当たり
              const lashRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6C, charId));
              s = Engine.relationships.applySlumpLashout({ ...s, roster }, charId, lashRng);
            }
          }
        }

        // §4.4/§5.4 試合後 momentum 更新（スランプ/モチベ喪失中）
        const momRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C7, charId));
        const momFighter = roster.find(c => c.id === charId);
        let updatedF = Engine.growthEvents.updateSlumpMomentumAfterMatch(momFighter, r.mq, won, momRng);
        updatedF = Engine.growthEvents.updateMotivationLossMomentumAfterMatch(updatedF, r.mq, won, momRng);

        // §5.2 モチベ喪失 敗北トリガー
        if (!won && updatedF.slump) {
          const mlRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C8, charId));
          if (Engine.growthEvents.checkMotivationLoss(mlRng, updatedF, 'defeat')) {
            updatedF = Engine.growthEvents.applyMotivationLoss(updatedF, s.season, s.week);
            pendingGrowthEvents.push({ type: 'motivation_loss_start', fighterId: charId });
            // Phase 4 G-06: モチベ喪失 → bond60+心配、rivalry30+低下
            if (s.relationships) {
              const symRng2 = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE59, charId));
              s = Engine.relationships.applySympathyEffect(s, charId, { min: 1, max: 1 }, symRng2);
            }
          }
        }
        if (updatedF !== momFighter) {
          roster = roster.map(c => c.id === charId ? updatedF : c);
        }
      });
    });

    // h2h記録: ペア別対戦履歴（タッグ: 対角4ペア + 味方ペア記録）
    let h2h = { ...(s.h2h || {}) };
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      if (m.matchType === 'tag') {
        // タッグ: 対角4ペア（A1vsB1, A1vsB2, A2vsB1, A2vsB2）を記録
        const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
        const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
        for (const aId of teamAIds) {
          for (const bId of teamBIds) {
            const tagWinner = r.winner === 'teamA' ? 'left' : r.winner === 'teamB' ? 'right' : 'draw';
            h2h = Engine.h2h.update(h2h, aId, bId, tagWinner, r.mq, false, false, s.season, s.week, 'show', 'player', 'player');
          }
        }
      } else if (m.isCRMatch) {
        // challenge-request-spec-v0.1 Phase 3: 直訴試合はh2h/betrayal通知を専用処理
        // (_applyChallengeRequestResult内、正しいorg IDで)済みのためここでは二重記録しない
      } else {
        const meta = App._buildMatchMeta(s, m.left, m.right, !!m.isReclaim);
        h2h = Engine.h2h.update(h2h, m.left, m.right, r.winner, r.mq, !!r.isTitleMatch, false, s.season, s.week, 'show', 'player', 'player', meta);
        // 業界ニュース: B-3 元同僚 離脱後初対面（試合カード=単発のみ）
        if (meta.betrayal) {
          const fA = (s.roster || []).find(c => c.id === m.left);
          const fB = (s.roster || []).find(c => c.id === m.right);
          if (fA && fB) {
            s = Engine.industryNews.push(s, {
              type: 'firstMeetSinceDeparture',
              characterId: m.left,
              data: { nameA: fA.name, nameB: fB.name },
            });
          }
        }
      }
    });
    s = { ...s, h2h };

    // recentMatches記録（直近5戦FIFO）
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      if (m.matchType === 'tag') {
        // タッグ: 対角ペアで記録
        const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
        const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
        for (const aId of teamAIds) {
          for (const bId of teamBIds) {
            const tagWinner = r.winner === 'teamA' ? 'left' : r.winner === 'teamB' ? 'right' : 'draw';
            roster = Engine.pushRecentMatch(roster, aId, bId, tagWinner, s.season, s.week);
          }
        }
      } else {
        roster = Engine.pushRecentMatch(roster, m.left, m.right, r.winner, s.season, s.week);
      }
    });

    // matchupLog 記録（鮮度計算の後、最終更新の前）
    const newMatchupEntries = [];
    validMatches.forEach(m => {
      if (m.matchType === 'tag') {
        // タッグ: 対角4ペアのmatchupLogを記録
        const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
        const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
        for (const aId of teamAIds) {
          for (const bId of teamBIds) {
            newMatchupEntries.push({ leftId: aId, rightId: bId, showCount: s.totalShows });
          }
        }
      } else {
        newMatchupEntries.push({ leftId: m.left, rightId: m.right, showCount: s.totalShows });
      }
    });

    // tagExp記録: タッグ試合のチームメイトペアの経験値を蓄積
    let tagExp = { ...(s.tagExp || {}) };
    validMatches.forEach((m, idx) => {
      if (m.matchType !== 'tag') return;
      tagExp = Engine.tagExp.increment(tagExp, m.teamA.fighter1, m.teamA.fighter2);
      tagExp = Engine.tagExp.increment(tagExp, m.teamB.fighter1, m.teamB.fighter2);
    });
    s = { ...s, roster, matchupLog: [...(s.matchupLog || []), ...newMatchupEntries], tagExp };

    // MVPレース v2: MQ85超試合の bigMatch 履歴記録（プレイヤー興行）
    {
      let bigMatchAdded = false;
      validMatches.forEach((m, idx) => {
        const r = results[idx];
        if (!r || typeof r.mq !== 'number' || r.mq < 85) return;
        const participants = m.matchType === 'tag'
          ? [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2]
          : [m.left, m.right];
        participants.forEach(charId => {
          if (charId == null) return;
          roster = roster.map(c => {
            if (c.id !== charId || c.isIntrusion) return c;
            bigMatchAdded = true;
            return Engine.career.addEvent(c, {
              type: 'bigMatch', season: s.season, week: s.week, mq: r.mq
            });
          });
        });
      });
      if (bigMatchAdded) s = { ...s, roster };
    }

    // orgPop リバランス v1.1 §4: ドーム興行 domeMain キャリア記録
    // メインイベント枠(idx=0) or タイトルマッチに出場した選手を記録
    if (s.showVenue === 9) {
      roster = roster.map(c => c); // コピーを維持
      validMatches.forEach((m, idx) => {
        const isMain = idx === 0; // メインイベント枠
        const isTitle = !!m.isTitle;
        if (!isMain && !isTitle) return;
        const r = results[idx];
        if (!r) return;
        const matchType = isTitle ? 'title' : 'main';
        let domeEntries;
        if (m.matchType === 'tag') {
          const allIds = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
          const winTeamIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
            : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
          domeEntries = allIds.map(charId => ({ charId, result: winTeamIds.includes(charId) ? 'win' : (r.winner === 'draw' ? 'draw' : 'lose'), opponentName: undefined }));
        } else {
          const leftName  = roster.find(c => c.id === m.left)?.name;
          const rightName = roster.find(c => c.id === m.right)?.name;
          domeEntries = [
            { charId: m.left,  result: r.winner === 'left'  ? 'win' : (r.winner === 'draw' ? 'draw' : 'lose'), opponentName: rightName },
            { charId: m.right, result: r.winner === 'right' ? 'win' : (r.winner === 'draw' ? 'draw' : 'lose'), opponentName: leftName },
          ];
        }
        domeEntries.forEach(({ charId, result, opponentName }) => {
          roster = roster.map(c => {
            if (c.id !== charId || c.isIntrusion) return c;
            const ev = { type: 'domeMain', season: s.season, week: s.week, result, matchType };
            if (opponentName) ev.opponentName = opponentName;
            const cr = c.careerRecord || { history: [] };
            return { ...c, careerRecord: { ...cr, history: [...(cr.history || []), ev] } };
          });
        });
      });
      // orgPop リバランス v1.1 §5: ドーム興行カウント更新
      s = { ...s, roster, domeShowsThisSeason: (s.domeShowsThisSeason || 0) + 1 };
    }
    // 開眼 Phase 1: 既存の試合後処理を終えたシングル戦だけを純エンジンの共通判定へ渡す。
    // 専用モーダルは作らず、既存の週次ログと新聞キューだけを使う。
    const kaiganResult = Engine.kaigan.processMatchResults(
      { ...s, roster },
      roster,
      results,
      { orgId: 'player', orgName: s.orgName }
    );
    roster = kaiganResult.roster;
    s = { ...s, roster };
    kaiganResult.occurrences.forEach(occurrence => {
      events.push(Engine.kaigan.weeklyLog(occurrence));
      s = Engine.industryNews.push(s, Engine.kaigan.industryEvent(occurrence));
    });

    if (pendingGrowthEvents.length > 0) {
      s = { ...s, _pendingGrowthEvents: pendingGrowthEvents };
    }

    // 全国統一王座戦: 通常興行の共通処理後、ゲストを本来のAI団体へ戻して王座を清算する。
    if (App._unifiedTitleShowData) {
      const unified = App._unifiedTitleShowData;
      const matchIdx = validMatches.findIndex(m => m && m._unifiedTitleMatch);
      const matchResult = matchIdx >= 0 ? results[matchIdx] : null;
      const guestIds = new Set(unified.guestIds || []);
      const updatedGuest = roster.find(f => guestIds.has(f.id));
      const aiOrgs = { ...(s.aiOrgs || {}) };
      const guestOrg = aiOrgs[unified.challengerOrgId];
      if (updatedGuest && guestOrg?.roster) {
        const cleanGuest = { ...updatedGuest };
        delete cleanGuest.isUnifiedTitleGuest;
        delete cleanGuest._unifiedGuestOrgId;
        aiOrgs[unified.challengerOrgId] = {
          ...guestOrg,
          roster: guestOrg.roster.map(f => f.id === cleanGuest.id ? cleanGuest : f),
        };
      }
      roster = roster.filter(f => !guestIds.has(f.id));
      s = { ...s, aiOrgs, roster, titles };
      if (matchResult) {
        const slot = validMatches[matchIdx];
        const winnerId = matchResult.winner === 'left' ? slot.left
          : matchResult.winner === 'right' ? slot.right : null;
        s = Engine.unifiedTitle.resolveMatch(s, {
          championId: unified.championId,
          challengerId: unified.challengerId,
          winnerId,
        });
        roster = s.roster;
        events.push(winnerId === unified.challengerId
          ? `🌐 ${unified.challenger.name}が全国統一王座を奪取！`
          : `🌐 ${unified.champion.name}が全国統一王座を防衛！`);
      }
      App._unifiedTitleShowData = null;
    }

    // 単発の挑戦状(B3)は通常興行のメインとして解決する。
    // 試合そのものの消耗・怪我・成長・関係変化は上の共通処理済みなので、
    // ここでは大型イベント固有の人気・キャリア・ニュースだけを反映する。
    if (App._b3ShowData) {
      const b3 = App._b3ShowData;
      const b3Idx = validMatches.findIndex(m => m._b3ChallengeMatch && m._crGroupId === b3.groupId);
      const matchResult = b3Idx >= 0 ? results[b3Idx] : null;
      if (matchResult) {
        const enrichedEvent = {
          ...b3.event,
          matchResult,
          selectedFighterId: b3.fighterId,
          scheduledInShow: true,
        };
        const b3Rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB1B6));
        const b3Result = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, { ...s, roster }, b3Rng);
        if (b3Result.roster) roster = b3Result.roster;
        const b3Updates = {};
        for (const key of ['funds', 'lockerRoomMorale', 'mediaSpotlight', 'lastLargeEventWeek', 'lastB3ChallengeWeek', 'battlePoints']) {
          if (b3Result[key] !== undefined) b3Updates[key] = b3Result[key];
        }
        if (b3Result.aiOrgs) b3Updates.aiOrgs = b3Result.aiOrgs;
        if (b3Result.orgPopDelta) b3Updates.orgPop = Engine.util.clamp((s.orgPop || 0) + b3Result.orgPopDelta, 0, 100);
        if (b3Result.events?.length) events.push(...b3Result.events);
        const b3H2h = Engine.h2h.update(
          s.h2h || {}, b3.fighterId, b3.challenger.id, matchResult.winner, matchResult.mq,
          false, false, s.season, s.week, 'show', 'player', b3.orgId || b3.challenger.orgId || 'rival', null
        );
        const newsType = matchResult.winner === 'left' ? 'interPromoWin' : (matchResult.winner === 'right' ? 'interPromoLoss' : 'interPromoDraw');
        s = {
          ...s,
          ...b3Updates,
          roster,
          h2h: b3H2h,
          _newsEvents: [...(s._newsEvents || []), {
            type: newsType,
            data: { orgName: b3.orgName, fighterName: b3.playerFighter.name, challengerName: b3.challenger.name },
          }],
        };
      }
      const b3GuestIds = new Set(b3.guestIds || []);
      if (b3GuestIds.size > 0) {
        const updatedGuest = roster.find(f => b3GuestIds.has(f.id));
        const aiOrgs = { ...(s.aiOrgs || {}) };
        const guestOrg = aiOrgs[b3.orgId];
        if (updatedGuest && guestOrg?.roster) {
          aiOrgs[b3.orgId] = {
            ...guestOrg,
            roster: guestOrg.roster.map(f => {
              if (f.id !== updatedGuest.id) return f;
              const baseCareer = f.careerRecord || { history: [] };
              const updatedCareer = updatedGuest.careerRecord || { history: [] };
              const history = [...(baseCareer.history || [])];
              for (const entry of (updatedCareer.history || [])) {
                const signature = `${entry.type}|${entry.season}|${entry.week}|${entry.opponentName || ''}|${entry.mq || ''}`;
                if (!history.some(h => `${h.type}|${h.season}|${h.week}|${h.opponentName || ''}|${h.mq || ''}` === signature)) history.push(entry);
              }
              return { ...f, ...updatedGuest, careerRecord: { ...updatedCareer, ...baseCareer, history } };
            }),
          };
        }
        roster = roster.filter(f => !b3GuestIds.has(f.id));
        s = { ...s, aiOrgs, roster };
      }
      App._b3ShowData = null;
    }

    // 挑戦シリーズの一時ゲストを、興行後に更新済みの状態で本来の所属団体へ戻す。
    // 先に _applyChallengeRequestResult が付けたキャリア履歴は保持しつつ、
    // この興行で発生した消耗・怪我・成長・人気変化を同期する。
    if (App._crGuestSyncData) {
      const sync = App._crGuestSyncData;
      const guestIds = new Set(sync.guestIds || []);
      const playerRosterIds = new Set(sync.playerRosterIds || []);
      const isTemporaryChallengeGuest = fighter => !!fighter && (
        fighter.isCRGuest || (guestIds.has(fighter.id) && !playerRosterIds.has(fighter.id))
      );
      const updatedGuests = new Map(roster.filter(c => isTemporaryChallengeGuest(c)).map(c => [c.id, c]));
      const aiOrgs = { ...(s.aiOrgs || {}) };
      const guestOrg = aiOrgs[sync.guestOrgId];
      if (guestOrg && Array.isArray(guestOrg.roster)) {
        aiOrgs[sync.guestOrgId] = {
          ...guestOrg,
          roster: guestOrg.roster.map(f => {
            const updated = updatedGuests.get(f.id);
            if (!updated) return f;
            const baseCareer = f.careerRecord || { history: [] };
            const updatedCareer = updated.careerRecord || { history: [] };
            const history = [...(baseCareer.history || [])];
            for (const entry of (updatedCareer.history || [])) {
              const signature = `${entry.type}|${entry.season}|${entry.week}|${entry.opponentName || ''}|${entry.mq || ''}`;
              if (!history.some(h => `${h.type}|${h.season}|${h.week}|${h.opponentName || ''}|${h.mq || ''}` === signature)) history.push(entry);
            }
            return { ...f, ...updated, careerRecord: { ...updatedCareer, ...baseCareer, history } };
          }),
        };
      }
      roster = roster.filter(c => !isTemporaryChallengeGuest(c));
      s = { ...s, aiOrgs, roster };
      App._crGuestSyncData = null;
    }

    // s 起点でマージ。{...G, ...s} だと s 側で destructure 削除した
    // _pendingF07Directive / _pendingInternalChallenge / _pendingF08Directive / _pendingF09 / _pendingReclaim
    // などのキーが G の旧値として残り、F07 メイン推薦や派閥内序列戦が永久消化扱いにならない。
    // s は finalizeShow 冒頭で {...G} から派生しているため、s を base にして問題ない。
    G = { ...s, seasonStats: stats, gameLog: [...G.gameLog, ...events] };

    // v2.0 Phase1-6: メディアスポットライトの興行後処理
    if (G.mediaSpotlight) {
      const _spotlightName = G.mediaSpotlight.fighterName || '選手';
      const spotRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4B4));
      const spotResult = Engine.eventSystem.processMediaSpotlight(G, results, validMatches, spotRng);
      if (spotResult) {
        G = { ...G, mediaSpotlight: spotResult.mediaSpotlight, roster: spotResult.roster,
               gameLog: [...G.gameLog, ...spotResult.events] };
        if (spotResult.orgPopDelta) {
          G = { ...G, orgPop: G.orgPop + spotResult.orgPopDelta };
        }
        // Phase 4 E-04: メディアスポットライト終了時の関係値反映
        if (spotResult.relationships) {
          G = { ...G, relationships: spotResult.relationships };
        }
        // P6: メディアスポットライト終了トースト
        if (spotResult.mediaSpotlight === null) {
          setTimeout(() => showToast(`📺 ${_spotlightName}のメディア密着取材が終了した`, 5000), 500);
        }
      }
    }

    // ラストラン試合を行った選手を即座に引退処理（4週待ちバグ修正）
    const lastRunRetireesById = new Map();
    results.forEach((r, idx) => {
      const match = validMatches[idx];
      if (!match) return;
      const participantIds = match.matchType === 'tag'
        ? [match.teamA?.fighter1, match.teamA?.fighter2, match.teamB?.fighter1, match.teamB?.fighter2].filter(id => id > 0)
        : [match.left, match.right].filter(id => id > 0);
      const lastRunFighter = participantIds
        .map(id => G.roster.find(c => c.id === id))
        .find(f => f?.lastRun) || null;
      if (!lastRunFighter) return;
      r.isLastRunMatch = true;
      r.lastRunFighterId = lastRunFighter.id;
      lastRunRetireesById.set(lastRunFighter.id, lastRunFighter);
    });
    const lastRunRetirees = [...lastRunRetireesById.values()];
    try {
      wmDiag('[WM][lastrun-diag] processShowResult:lastRunRetirees',
        { count: lastRunRetirees.length, names: lastRunRetirees.map(c => c?.name), resultsLen: results.length, validMatchesLen: validMatches.length });
    } catch (_e) {}
    if (lastRunRetirees.length > 0) {
      const lrLineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD3));
      const retiredWithRecords = lastRunRetirees.map(c => {
        let f = Engine.career.ensure({ ...c, lastRun: false, lastRunWeek: null });
        f = Engine.career.addEvent(f, { type: 'retire', reason: 'lastrun', season: G.season, week: G.week, age: f.age });
        delete f.growthLog;
        return f;
      });
      const lastRunRetiredIds = new Set(lastRunRetirees.map(c => c.id));
      const survivingRoster = G.roster.filter(c => !lastRunRetiredIds.has(c.id));
      // 関係値凍結 + trust影響 + retiredIds永続記録
      const newRetiredIds = [...(G.retiredIds || []), ...lastRunRetirees.map(c => c.id).filter(id => !(G.retiredIds || []).includes(id))];
      const _lrRetiredSeasons = { ...(G.retiredSeasons || {}) };
      lastRunRetirees.forEach(c => { _lrRetiredSeasons[c.id] = G.season; });
      let updState = { ...G, roster: survivingRoster, retiredFighters: [...(G.retiredFighters || []), ...retiredWithRecords], retiredIds: newRetiredIds, retiredSeasons: _lrRetiredSeasons };
      // 退場者の後始末: 雇用コーチの担当から外す(残すと自己修復 coachAssign_stale_refs_removed が鳴る)
      updState = { ...updState, coachAssign: Engine.coach.sanitizeAssignments(updState) };
      // 団体年代記: アーカイブ登録 + 気風寄与積算 (player ロスター経由なので全件対象)
      retiredWithRecords.forEach(rf => {
        updState = Engine.chronicle.archiveFighter(updState, rf);
        updState = Engine.chronicle.applySpiritContribution(updState, rf);
      });
      updState = Engine.chronicle.refreshChapters(updState);
      // 王者がラストラン引退した場合は王座を空位にする
      const vcLR = Engine.title.validateChampion(updState);
      if (vcLR.msg) { updState = { ...updState, titles: vcLR.titles, gameLog: [...(updState.gameLog || []), vcLR.msg] }; }
      if (updState.relationships) {
        lastRunRetirees.forEach(retiree => {
          updState = Engine.relationships.freezeRelationships(updState, retiree.id);
          updState = { ...updState, roster: Engine.trust.applyDepartureTrustImpact(updState.roster, retiree.id, updState.relationships, { name: retiree.name, reason: '引退試合' }) };
        });
      }
      // O-04: bond 60+の相手→引退者に bond -5〜-10
      const retRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE3B, G.season, G.week));
      for (const retiree of lastRunRetirees) {
        const highBondIds = updState.roster.map(c => c.id).filter(cid => {
          const key = Engine.relationships._key(cid, retiree.id);
          const rel = updState.relationships?.[key];
          return rel && Engine.relationships.isPositiveBond(rel.bond);
        });
        if (highBondIds.length > 0) {
          updState = Engine.relationships.applyFromRoster(updState, highBondIds, retiree.id, { min: -10, max: -5 }, { min: 0, max: 0 }, retRelRng);
        }
      }
      // 引退演出データを保持（pendingRetirements形式）
      const pendingLastRunRetirements = retiredWithRecords.map(f => {
        const { line, category } = Engine.retirement.selectLine(f, 'lastrun', updState, lrLineRng);
        const summary = Engine.retirement.buildCareerSummary(f);
        return { fighter: f, route: 'lastrun', line, category, summary, canRetain: false };
      });
      G = { ...updState, _pendingLastRunRetirements: pendingLastRunRetirements };
    }

    App._showPreview = null;
    App._lastInjuries = injuryResults; // v0.96: store for popup after close
    App._lastTitleOutcomes = titleMatchOutcomes; // タイトルマッチ後リアクション用
    // 結果画面表示直後にBGMを試合用→経営用へ切り替え（ファンファーレは廃止）
    setTimeout(() => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      Audio.bgm.play('management');
    }, 2500);

    // 新聞データをGに保存（データベースタブで閲覧）
    try {
      const paperData = App._buildShowResultNewspaperData();
      if (paperData) {
        G = { ...G, currentNewspaper: { ...paperData, generatedWeek: G.week, generatedSeason: G.season } };
      }
    } catch (e) {
      console.error('[WM] 新聞データ生成エラー:', e);
    }

    // 試合前/試合後フレーバーポップアップは per-match で流れる
    // (renderMatchPreview の nextIdx フォーカス時 + skipMatch/watchMatch 結果反映直後)
    // ため、ここでは結果画面を直接描画する。
    // Phase 3e: F08-A 試合後モーダルが予約されていれば結果画面前に逐次消化
    // F09 Ending モーダル（F08 aftermath より先に出す: 対抗戦の総括が先）
    const drainF09Ending = (then) => {
      if (!G._pendingF09Ending) { if (then) then(); return; }
      const data = G._pendingF09Ending;
      const { _pendingF09Ending: _, ...rest } = G;
      G = rest;
      if (typeof showFactionF09EndingModal === 'function') {
        showFactionF09EndingModal(data, G, () => { if (then) then(); });
      } else {
        if (then) then();
      }
    };
    const drainF08Aftermath = (then) => {
      const queue = G._pendingF08Aftermath;
      if (!Array.isArray(queue) || queue.length === 0) {
        if (G._pendingF08Aftermath !== undefined) {
          const { _pendingF08Aftermath: _, ...rest } = G;
          G = rest;
        }
        if (then) then();
        return;
      }
      const head = queue[0];
      G = { ...G, _pendingF08Aftermath: queue.slice(1) };
      if (typeof showFactionF08AftermathModal === 'function') {
        showFactionF08AftermathModal(head.data, G, () => drainF08Aftermath(then));
      } else {
        drainF08Aftermath(then);
      }
    };
    // challenge-request-spec-v0.1 Phase 3: 直訴試合の結果モーダル(F08/F09と同じdrainパターン)
    const drainCRResult = (then) => {
      if (!G._pendingChallengeRequestResult) { if (then) then(); return; }
      const data = G._pendingChallengeRequestResult;
      const { _pendingChallengeRequestResult: _, ...rest } = G;
      G = rest;
      if (typeof showChallengeRequestResultModal === 'function') {
        showChallengeRequestResultModal(data.card, data.result, G, () => { if (then) then(); });
      } else {
        if (then) then();
      }
    };
    // task-79: Common-1 予約清算の結果表示(即時試合用モーダルの代替。F08/CRと同じdrainパターン)
    const drainCommon1Result = (then) => {
      if (!G._pendingCommon1Result) { if (then) then(); return; }
      const data = G._pendingCommon1Result;
      const { _pendingCommon1Result: _, ...rest } = G;
      G = rest;
      const fA = (G.roster || []).find(c => c.id === data.fighterAId);
      const fB = (G.roster || []).find(c => c.id === data.fighterBId);
      if (fA && fB && typeof _renderCommon1MatchResult === 'function') {
        _renderCommon1MatchResult(data.payload, data.matchResult, fA, fB, data.applyResult, () => { if (then) then(); });
      } else {
        if (then) then();
      }
    };
    drainF09Ending(() => drainF08Aftermath(() => drainCRResult(() => drainCommon1Result(() => renderShowResult(results, injuryResults)))));
  },

  // 試合前フレーバーポップアップの収集（specs/match-flavor-popup-spec-v0.1.md §4.2）
  // 1試合分のポップアップ配列を返す。renderMatchPreview の nextIdx フォーカス時に呼ばれる。
  // 試合シミュレーション結果は不要 — 検出は roster / matchupLog / relationships を試合前に参照する。
  // 段階拡張時はこの中に検出条件 + popups.push ブロックを追加する。
  _collectPreMatchPopupsForMatch(idx) {
    const popups = [];
    const sp = App._showPreview;
    if (!sp || !sp.validMatches) return popups;
    const m = sp.validMatches[idx];
    if (!m || m.matchType === 'tag') return popups; // タッグは現状非対応
    const leftId = m.left, rightId = m.right;
    if (!leftId || !rightId) return popups;
    const leftFighter  = (G.roster || []).find(c => c.id === leftId) || ALL_CHARS.find(c => c.id === leftId);
    const rightFighter = (G.roster || []).find(c => c.id === rightId) || ALL_CHARS.find(c => c.id === rightId);
    if (!leftFighter || !rightFighter) return popups;

    // ── 初顔合わせ（matchupLog に過去対戦が無いかで判定）──
    const log = G.matchupLog || [];
    const hasPriorMatch = log.some(e =>
      (e.left === leftId && e.right === rightId) || (e.left === rightId && e.right === leftId)
    );
    if (!hasPriorMatch) {
      const leftLine  = pickDialogueLine(FIRST_MEET_LINES, leftFighter);
      const rightLine = pickDialogueLine(FIRST_MEET_LINES, rightFighter);
      popups.push({
        type: 'fighter', id: leftId, name: leftFighter.name,
        speech: leftLine, detail: '✨ 初対決', autoCloseMs: 1800, sound: 'event',
      });
      popups.push({
        type: 'fighter', id: rightId, name: rightFighter.name,
        speech: rightLine, detail: '✨ 初対決', autoCloseMs: 1800, sound: 'event',
      });
    }
    // ── 段階拡張ポイント: 他のプラス効果はここに追加 ──
    return popups;
  },

  // 試合後フレーバーポップアップの収集（specs/match-flavor-popup-spec-v0.1.md §4.6）
  // 勝者の一言は試合結果ポップアップ内の吹き出しへ統合。ここでは敗者の余韻だけを返す。
  _collectPostMatchPopupsForMatch(idx, result) {
    const popups = [];
    const sp = App._showPreview;
    if (!sp || !result || result.matchType === 'tag') return popups;
    if (result.winner === 'draw') return popups; // ドローは余韻スキップ（中立)
    const m = sp.validMatches[idx];
    if (!m) return popups;
    const winnerId = result.winner === 'left' ? m.left : m.right;
    const loserId  = result.winner === 'left' ? m.right : m.left;
    const winnerFighter = (G.roster || []).find(c => c.id === winnerId) || ALL_CHARS.find(c => c.id === winnerId);
    const loserFighter  = (G.roster || []).find(c => c.id === loserId)  || ALL_CHARS.find(c => c.id === loserId);
    if (!winnerFighter || !loserFighter) return popups;
    if (typeof POST_MATCH_FLAVOR_LINES === 'undefined') return popups;
    const loseLine = pickDialogueLine(POST_MATCH_FLAVOR_LINES.loser,  loserFighter);
    popups.push({
      type: 'fighter', id: loserId, name: loserFighter.name,
      speech: loseLine, detail: '— 敗者の心 —', autoCloseMs: 1800, sound: 'event',
    });
    return popups;
  },

  // pre-match popup シーケンスを 1試合分流す。renderMatchPreview のフォーカスフックから呼ばれる。
  // 既存の confrontation modal が表示中なら、それが閉じてからフレーバー popup を流す。
  _runPreMatchFlavorForMatch(idx) {
    const sp = App._showPreview;
    if (!sp) return;
    if (sp._suppressFlavor) return; // 一度スキップしたら以降のフレーバーは抑制
    if (!sp._shownPreFlavor) sp._shownPreFlavor = new Set();
    if (sp._shownPreFlavor.has(idx)) return;
    sp._shownPreFlavor.add(idx);

    const m = (sp.validMatches || [])[idx];
    // 派閥内序列戦 試合前モーダル（_internalChallengeLocked 試合）— F08/F09 と並列で最優先
    if (m && m._internalChallengeLocked && typeof Engine !== 'undefined' && Engine.factions
        && typeof Engine.factions.getInternalChallengePreData === 'function'
        && typeof showInternalChallengePreModal === 'function') {
      const matchId = `${G.season}-${G.week}-${idx}`;
      if (!G._shownInternalChallengePreIds) G._shownInternalChallengePreIds = [];
      if (!G._shownInternalChallengePreIds.includes(matchId)) {
        const data = Engine.factions.getInternalChallengePreData(G, m);
        if (data) {
          G._shownInternalChallengePreIds = [...G._shownInternalChallengePreIds, matchId];
          showInternalChallengePreModal(data, G, () => {});
          return;
        }
      }
    }

    // Phase 3e: F08-A 試合前モーダル発火（rivalry/初顔合わせ等より優先、出したら他はスキップ）
    if (m && m._f08Locked && typeof Engine !== 'undefined' && Engine.factions
        && typeof Engine.factions.getF08PreMatchData === 'function'
        && typeof showFactionF08PreMatchModal === 'function') {
      const matchId = `${G.season}-${G.week}-${idx}`;
      if (!G._shownF08PreMatchIds) G._shownF08PreMatchIds = [];
      if (!G._shownF08PreMatchIds.includes(matchId)) {
        const data = Engine.factions.getF08PreMatchData(G, m);
        if (data) {
          G._shownF08PreMatchIds = [...G._shownF08PreMatchIds, matchId];
          showFactionF08PreMatchModal(data, G, () => {});
          return; // 他フレーバーはスキップして試合進行
        }
      }
    }

    // Phase B-2: F09 試合前モーダル発火（_f09Locked 試合）— 初の F09 試合では Opening も連結
    if (m && m._f09Locked && typeof Engine !== 'undefined' && Engine.factions) {
      const matchId = `${G.season}-${G.week}-${idx}`;
      if (!G._shownF09PreMatchIds) G._shownF09PreMatchIds = [];
      if (!G._shownF09PreMatchIds.includes(matchId)) {
        const data = App._buildF09MatchPreData(m, idx);
        if (data) {
          G._shownF09PreMatchIds = [...G._shownF09PreMatchIds, matchId];
          // 興行内最初の _f09Locked 試合 → Opening を先に
          const isFirstF09 = !G._shownF09Opening;
          if (isFirstF09) {
            G._shownF09Opening = true;
            const opening = App._buildF09OpeningData(m);
            if (opening && typeof showFactionF09OpeningModal === 'function') {
              showFactionF09OpeningModal(opening, G, () => {
                if (typeof showFactionF09MatchPreModal === 'function') {
                  showFactionF09MatchPreModal(data, G, () => {});
                }
              });
              return;
            }
          }
          if (typeof showFactionF09MatchPreModal === 'function') {
            showFactionF09MatchPreModal(data, G, () => {});
            return;
          }
        }
      }
    }

    const popups = App._collectPreMatchPopupsForMatch(idx);
    if (popups.length === 0) return;
    popups.forEach(p => showEventPopup(p));
  },

  // post-match popup シーケンスを 1試合分流し、then() を呼ぶ。
  // skipMatch/watchMatch で sp.results[idx] 反映直後に呼ぶ。
  _runPostMatchFlavorForMatch(idx, result, then) {
    // Phase B-2: F09 試合後モーダル（_f09Locked 試合）— popup 群より先に出す
    const sp = App._showPreview;
    const m = sp && sp.validMatches ? sp.validMatches[idx] : null;
    const runPostF09 = (cb) => {
      if (!m || !m._f09Locked || result.winner === 'draw') { cb(); return; }
      const data = App._buildF09MatchPostData(m, idx, result);
      if (!data || typeof showFactionF09MatchPostModal !== 'function') { cb(); return; }
      showFactionF09MatchPostModal(data, G, cb);
    };
    // 派閥内序列戦 試合後モーダル（_internalChallengeLocked 試合・該当 pending あり）
    const runPostInternalChallenge = (cb) => {
      if (!m || !m._internalChallengeLocked) { cb(); return; }
      const pending = G._pendingInternalChallengePostModal;
      if (!pending || typeof Engine === 'undefined' || !Engine.factions
          || typeof Engine.factions.getInternalChallengePostData !== 'function'
          || typeof showInternalChallengePostModal !== 'function') { cb(); return; }
      const data = Engine.factions.getInternalChallengePostData(G, pending);
      // 1試合 1回限り。pending を消費
      const { _pendingInternalChallengePostModal: _, ...rest } = G;
      G = rest;
      if (!data) { cb(); return; }
      showInternalChallengePostModal(data, G, cb);
    };
    runPostInternalChallenge(() => runPostF09(() => {
      const popups = App._collectPostMatchPopupsForMatch(idx, result);
      if (popups.length === 0) { if (then) then(); return; }
      // The shared queue can be extended by another post-show popup. Keep this
      // match's completion local so its timeout cannot cancel that other wait.
      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        if (then) then();
      };
      _chainEventPopupQueueEmpty(finish);
      popups.forEach(p => showEventPopup(p));
      const maxWaitMs = popups.length * 2200 + 1500;
      setTimeout(() => {
        if (!completed) {
          // A queued ceremony may legitimately outlive this flavor popup.
          // Reaching this point means this match itself did not complete.
          console.warn('[WM] postMatchFlavor safety net fired');
          finish();
        }
      }, maxWaitMs);
    }));
  },

  // ── Phase B-2: F09 モーダル用データ構築ヘルパ ──
  _f09PickLine(table, fighter) {
    if (!table || !fighter) return '';
    const p = (Engine.contract && Engine.contract.getPersonalityType) ? Engine.contract.getPersonalityType(fighter) : 'normal';
    const arch = fighter.archetype || 'standard';
    // 第一分岐はアーキタイプ(口調)。2026-08-01 に軸を入れ替え
    // (a,p) → (a,normal) → (standard,p) → (standard,normal) の4段
    const byA = table[arch] || {};
    const byStd = table.standard || {};
    const byP = byA[p] || byA.normal || byStd[p] || byStd.normal || {};
    const lines = byP.high || byP.mid || byP.low || [];
    return lines.length ? lines[Math.floor(Math.random() * lines.length)] : '';
  },
  _buildF09OpeningData(m) {
    if (!G._pendingF09 && !m) return null;
    // _pendingF09 はすでにクリア済みかもしれないので、試合の所属派閥から逆引き
    const fA = Engine.factions.getFactionByFighterId(G, m.left);
    const fB = Engine.factions.getFactionByFighterId(G, m.right);
    if (!fA || !fB || fA.id === fB.id) return null;
    const leaderA = (G.roster || []).find(c => c.id === fA.leaderId);
    const leaderB = (G.roster || []).find(c => c.id === fB.leaderId);
    if (!leaderA || !leaderB) return null;
    const memberMini = (faction) => faction.memberIds.slice(0, 5).map(id => {
      const c = (G.roster || []).find(r => r.id === id);
      return c ? { id: c.id, name: c.name, ovr: Engine.util.ov(c) } : null;
    }).filter(Boolean);
    const linesA = (typeof FACTION_F09_OPENING_LINES_A !== 'undefined') ? FACTION_F09_OPENING_LINES_A : null;
    const linesB = (typeof FACTION_F09_OPENING_LINES_B !== 'undefined') ? FACTION_F09_OPENING_LINES_B : null;
    return {
      factionA: { id: fA.id, name: fA.name, leaderId: leaderA.id, leaderName: leaderA.name, leaderOvr: Engine.util.ov(leaderA), members: memberMini(fA) },
      factionB: { id: fB.id, name: fB.name, leaderId: leaderB.id, leaderName: leaderB.name, leaderOvr: Engine.util.ov(leaderB), members: memberMini(fB) },
      lineA: App._f09PickLine(linesA, leaderA),
      lineB: App._f09PickLine(linesB, leaderB),
      narration: `${fA.name}と${fB.name}――両派閥の積年の抗争が、ついに対抗戦という形で全面決着の夜を迎える。`,
    };
  },
  _buildF09MatchPreData(m, idx) {
    const fA = Engine.factions.getFactionByFighterId(G, m.left);
    const fB = Engine.factions.getFactionByFighterId(G, m.right);
    if (!fA || !fB) return null;
    const cA = (G.roster || []).find(c => c.id === m.left);
    const cB = (G.roster || []).find(c => c.id === m.right);
    if (!cA || !cB) return null;
    // 全F09試合数をカウント
    const sp = App._showPreview;
    const total = (sp && sp.validMatches) ? sp.validMatches.filter(mm => mm._f09Locked).length : 1;
    const f09Idx = (sp && sp.validMatches) ? sp.validMatches.slice(0, idx + 1).filter(mm => mm._f09Locked).length : 1;
    const lines = (typeof FACTION_F09_MATCH_PRE_LINES !== 'undefined') ? FACTION_F09_MATCH_PRE_LINES : null;
    return {
      fighterA: { id: cA.id, name: cA.name, factionName: fA.name },
      fighterB: { id: cB.id, name: cB.name, factionName: fB.name },
      lineA: App._f09PickLine(lines, cA),
      lineB: App._f09PickLine(lines, cB),
      matchIndex: f09Idx, totalMatches: total,
    };
  },
  _buildF09MatchPostData(m, idx, result) {
    const winnerId = result.winner === 'left' ? m.left : m.right;
    const loserId  = result.winner === 'left' ? m.right : m.left;
    const winnerC = (G.roster || []).find(c => c.id === winnerId);
    const loserC  = (G.roster || []).find(c => c.id === loserId);
    if (!winnerC || !loserC) return null;
    const winnerF = Engine.factions.getFactionByFighterId(G, winnerId);
    const loserF  = Engine.factions.getFactionByFighterId(G, loserId);
    if (!winnerF || !loserF) return null;
    const linesW = (typeof FACTION_F09_MATCH_POST_WIN_LINES !== 'undefined') ? FACTION_F09_MATCH_POST_WIN_LINES : null;
    const linesL = (typeof FACTION_F09_MATCH_POST_LOSE_LINES !== 'undefined') ? FACTION_F09_MATCH_POST_LOSE_LINES : null;
    // finalizeShow より前に出すモーダルなので、本体スコアはまだ今回の興行分を含まない。
    // 本番加算と同じ純計算を使い、ここまで終わった F09 試合分を表示値へ積み上げる。
    let scoreA = 0, scoreB = 0;
    let aFid = Math.min(winnerF.id, loserF.id);
    let bFid = Math.max(winnerF.id, loserF.id);
    let aName = winnerF.id === aFid ? winnerF.name : loserF.name;
    let bName = winnerF.id === bFid ? winnerF.name : loserF.name;
    if (G.factionRivalryPoints && Engine.factions._pairKey) {
      const key = Engine.factions._pairKey(winnerF.id, loserF.id);
      const e = G.factionRivalryPoints[key];
      if (e) {
        aFid = e.factionAId;
        bFid = e.factionBId;
        const aFac = (G.factions || []).find(f => f.id === aFid);
        const bFac = (G.factions || []).find(f => f.id === bFid);
        scoreA = e.pointsA; scoreB = e.pointsB;
        aName = aFac ? aFac.name : '';
        bName = bFac ? bFac.name : '';
      }
    }
    const calcPoints = (slot, matchResult) => {
      if (!slot || !slot._f09Locked || !matchResult || matchResult.winner === 'draw') return null;
      if (typeof Engine.factions.calculateRivalryPointsForMatch !== 'function') return null;
      const winner = matchResult.winner === 'left' ? 'A' : (matchResult.winner === 'right' ? 'B' : 'draw');
      return Engine.factions.calculateRivalryPointsForMatch(G, {
        fighterIdA: slot.left,
        fighterIdB: slot.right,
        winner,
        isMain: !!slot.isSummit,
        isTitle: !!slot.isTitle,
        isTag: false,
        isF09: true,
      });
    };
    const currentCalc = calcPoints(m, result);
    const sp = App._showPreview;
    if (sp && Array.isArray(sp.validMatches) && Array.isArray(sp.results)) {
      sp.validMatches.slice(0, idx + 1).forEach((slot, resultIdx) => {
        const calc = calcPoints(slot, sp.results[resultIdx]);
        if (!calc) return;
        if (calc.winnerFactionId === aFid) scoreA += calc.pt;
        else if (calc.winnerFactionId === bFid) scoreB += calc.pt;
      });
    }
    return {
      winner: { id: winnerC.id, name: winnerC.name, factionName: winnerF.name },
      loser:  { id: loserC.id,  name: loserC.name,  factionName: loserF.name },
      winnerLine: App._f09PickLine(linesW, winnerC),
      loserLine:  App._f09PickLine(linesL, loserC),
      ptDelta: currentCalc ? currentCalc.pt : 0,
      currentScore: { a: scoreA, b: scoreB, aName, bName },
    };
  },

  // ─── 新聞記事テキスト生成 ───────────────────────────────────────────────
  _NEWSPAPER_HEADLINES: {
    // タイトル戦勝利
    titleWin: [
      d => `${d.winner.name}、${d.finishLabel}で戴冠！`,
      d => `王座奪取！ ${d.winner.name}が${d.loser.name}を下す`,
      d => `新王者${d.winner.name}誕生——${d.venue.name}が揺れた`,
    ],
    titleDefend: [
      d => `王者${d.winner.name}、${d.loser.name}の挑戦を退ける`,
      d => `${d.winner.name}防衛成功！ 王座の威厳を示す`,
    ],
    // 因縁試合
    rivalry: [
      d => `宿命の対決——${d.winner.name}が${d.rivalLabel}を制す`,
      d => `${d.left.name}vs${d.right.name}、因縁に決着か`,
      d => `${d.rivalLabel}の行方——${d.winner.name}に軍配`,
    ],
    // 圧勝
    dominant: [
      d => `${d.winner.name}、圧巻の${d.turns}ターン決着！`,
      d => `電撃決着！ ${d.winner.name}が${d.loser.name}を一蹴`,
      d => `${d.loser.name}なすすべなし——${d.winner.name}の完勝`,
    ],
    // 僅差の好勝負
    closeMQ: [
      d => `死闘${d.turns}ターン——${d.winner.name}が辛くも勝利`,
      d => `${d.winner.name}と${d.loser.name}、名勝負の果てに`,
      d => `激闘の末に${d.winner.name}！ 試合評価${d.mq}の熱戦`,
    ],
    // 番狂わせ
    upset: [
      d => `大番狂わせ！ ${d.winner.name}が格上${d.loser.name}を撃破`,
      d => `ジャイアントキリング——${d.winner.name}の衝撃勝利`,
      d => `誰が予想した？ ${d.winner.name}が${d.loser.name}を沈める`,
    ],
    // 高MQ
    superMQ: [
      d => `歴史的名勝負！ 試合評価${d.mq}を記録`,
      d => `語り継がれる一戦——${d.winner.name}vs${d.loser.name}`,
    ],
    // ドロー
    draw: [
      d => `${d.left.name}と${d.right.name}、決着つかず`,
      d => `譲らぬ二人——メインは決着つかずに終わる`,
      d => `決着つかず。${d.left.name}も${d.right.name}も一歩も退かず`,
    ],
    // 通常
    normal: [
      d => `${d.winner.name}がメインイベントを制す`,
      d => `${d.winner.name}、${d.finishLabel}で勝利`,
      d => `${d.venue.name}のメイン、${d.winner.name}に軍配`,
    ],
  },

  _NEWSPAPER_ARTICLES: {
    // タイトル戦
    titleWin: [
      d => `${d.venue.name}に詰めかけた${d.attendance.toLocaleString()}人の観衆が見届けたのは、新たな王者の誕生だった。${d.winner.name}は序盤から積極的に攻め込み、${d.finishLabel}で${d.loser.name}から3カウントを奪取。試合後、ベルトを手にした${d.winner.name}の表情には、長い道のりを歩んできた者だけが見せる充足感が浮かんでいた。`,
      d => `${d.loser.name}の牙城がついに崩れた。${d.turns}ターンに及ぶ攻防の末、${d.winner.name}が${d.finishLabel}で王座を奪取。${d.venue.name}のリングに立つ新王者に、${d.attendance.toLocaleString()}人のファンが惜しみない拍手を送った。`,
    ],
    titleDefend: [
      d => `${d.loser.name}の挑戦を受けた王者${d.winner.name}は、${d.turns}ターンの攻防を経て${d.finishLabel}で防衛に成功。${d.attendance.toLocaleString()}人の前で王座の重みを証明した。敗れた${d.loser.name}もリング上で健闘を称えられ、次なる挑戦への期待が膨らむ。`,
    ],
    // 因縁試合
    rivalry: [
      d => `もはや説明不要のカード。${d.left.name}と${d.right.name}による${d.rivalLabel}は今回も期待を裏切らなかった。${d.turns}ターン、互いの手の内を知り尽くした二人の攻防は試合評価${d.mq}を記録。最後は${d.winner.name}の${d.finishLabel}が決着を呼んだ。この因縁に終わりはあるのか——その答えは、まだ誰にも分からない。`,
      d => `${d.rivalLabel}として知られる二人が再びリングで激突。${d.venue.name}の空気は試合前から張り詰めていた。${d.winner.name}が${d.finishLabel}で勝利を収めたが、敗れた${d.loser.name}の闘志は折れていない。次の対戦が、すでに待ち遠しい。`,
    ],
    // 好敵手
    goodRival: [
      d => `互いを高め合う二人の戦いは、今回もファンの心を掴んだ。${d.left.name}と${d.right.name}は${d.turns}ターンにわたり好勝負を展開。${d.winner.name}が${d.finishLabel}で勝利を手にしたが、試合後に交わした視線には敵意ではなく敬意が宿っていた。試合評価${d.mq}。`,
    ],
    // 圧勝
    dominant: [
      d => `わずか${d.turns}ターン。${d.winner.name}は${d.loser.name}に反撃の余地すら与えなかった。${d.finishLabel}が決まった瞬間、${d.venue.name}は静まり返った。実力差を見せつけた${d.winner.name}の強さは本物だ。`,
      d => `${d.loser.name}にとっては厳しい夜となった。${d.winner.name}の猛攻に防戦一方、${d.turns}ターンでの決着に${d.attendance.toLocaleString()}人の観客も言葉を失った。`,
    ],
    // 僅差の好勝負
    closeMQ: [
      d => `${d.turns}ターンの死闘——勝敗を分けたのは、ほんのわずかな差だった。${d.winner.name}と${d.loser.name}は試合評価${d.mq}の名勝負を演じ、${d.venue.name}の${d.attendance.toLocaleString()}人を総立ちにさせた。${d.finishLabel}で辛くも勝利した${d.winner.name}だが、敗れた${d.loser.name}の評価もまた上がったはずだ。`,
      d => `最後の最後まで勝負の行方は分からなかった。${d.loser.name}も見せ場を作り続けたが、${d.winner.name}の${d.finishLabel}が決着を告げた。消耗戦を制した${d.winner.name}のタフネスが光った${d.turns}ターン。試合評価${d.mq}は今シーズン屈指の数字だ。`,
    ],
    // 番狂わせ
    upset: [
      d => `戦前の予想を覆す結果となった。総合力差${d.ovrGap}ポイントの壁を、${d.winner.name}は気迫で打ち破った。${d.finishLabel}が決まった瞬間、${d.venue.name}は驚きと興奮に包まれた。格上${d.loser.name}からの金星は、${d.winner.name}にとって大きな自信になるだろう。`,
    ],
    // 超高MQ
    superMQ: [
      d => `試合評価${d.mq}——今シーズンのベストバウト候補が生まれた。${d.left.name}と${d.right.name}は${d.turns}ターンにわたって技術と闘志をぶつけ合い、${d.venue.name}の${d.attendance.toLocaleString()}人を熱狂の渦に巻き込んだ。${d.winner.name}が${d.finishLabel}で勝利を収めたが、勝敗を超えた価値がこの試合にはあった。`,
    ],
    // ドロー
    draw: [
      d => `${d.left.name}と${d.right.name}、${d.turns}ターンの攻防は決着を見なかった。互いにフォールを返し合い、極めを切り合い、最後まで膝を折らなかった二人。${d.venue.name}の${d.attendance.toLocaleString()}人は、決着つかずの結果にもかかわらず惜しみない拍手を送った。再戦を望む声が、すでにあちこちから聞こえている。`,
      d => `決着つかず。${d.left.name}も${d.right.name}も己の全てを出し尽くした結果がこれだ。試合評価${d.mq}が示す通り、試合内容に不満を持つ者はいないだろう。次はどちらが先に決着をつけるのか——${d.attendance.toLocaleString()}人のファンが次の邂逅を待っている。`,
    ],
    // 通常
    normal: [
      d => `${d.venue.name}で行われた${d.showName}のメインイベントは、${d.winner.name}が${d.finishLabel}で${d.loser.name}を下して幕を閉じた。${d.turns}ターンの試合は${d.attendance.toLocaleString()}人の観客を沸かせ、試合評価${d.mq}を記録した。`,
      d => `${d.winner.name}がメインの大舞台で堂々たる勝利を飾った。${d.loser.name}も要所で見せ場を作ったが、最終的には${d.winner.name}の${d.finishLabel}に沈んだ。${d.attendance.toLocaleString()}人の観客が見守った${d.turns}ターンの一戦。`,
    ],
    // 低MQ
    lowMQ: [
      d => `正直に言えば、メインイベントは物足りなさが残った。${d.winner.name}が${d.finishLabel}で${d.loser.name}を下したものの、試合評価${d.mq}という数字が試合内容を物語っている。${d.attendance.toLocaleString()}人のファンは、次回の興行にこそ期待を寄せるだろう。`,
    ],
  },

  _generateNewspaperTexts(d) {
    // カテゴリ優先度で選択
    let cat;
    if (d.isDraw) cat = 'draw';
    else if (d.isSuperMQ && !d.isDominant) cat = 'superMQ';
    else if (d.isTitleMatch) cat = d.isTitleDefense ? 'titleDefend' : 'titleWin';
    else if (d.isUpset) cat = 'upset';
    else if (d.hasRivalry) cat = 'rivalry';
    else if (d.isDominant) cat = 'dominant';
    else if (d.isCloseMatch && d.isHighMQ) cat = 'closeMQ';
    else if (d.isLowMQ) cat = 'normal';
    else cat = 'normal';

    // タイトルマッチ確定（superMQ/upset は歴史的名勝負/番狂わせ表現を優先）
    if (d.isTitleMatch && !d.isDraw) {
      if (cat !== 'superMQ' && cat !== 'upset') {
        cat = d.isTitleDefense ? 'titleDefend' : 'titleWin';
      }
    }

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const HL = App._NEWSPAPER_HEADLINES;
    const AR = App._NEWSPAPER_ARTICLES;

    const headline = pick(HL[cat] || HL.normal)(d);

    // サブヘッドライン：常にカードと数値情報
    let subheadline;
    if (d.isDraw) {
      subheadline = `${d.showName}・${d.venue.name}。観客${d.attendance.toLocaleString()}人、${d.turns}ターンの攻防は決着を見ず。全${d.totalMatches}試合の平均試合評価${d.avgMQ}`;
    } else if (d.otherHighMQ.length > 0) {
      subheadline = `${d.venue.name}大会、観客${d.attendance.toLocaleString()}人。全${d.totalMatches}試合平均試合評価${d.avgMQ}——好カード続出の${d.showName}`;
    } else {
      subheadline = `${d.showName}・${d.venue.name}。観客${d.attendance.toLocaleString()}人。メイン試合評価${d.mq}、全${d.totalMatches}試合平均試合評価${d.avgMQ}`;
    }

    // 記事本文
    let articleCat = cat;
    if (d.isGoodRival && !d.isDraw && cat !== 'superMQ') articleCat = 'goodRival';
    const articlePool = AR[articleCat] || AR.normal;
    let article = pick(articlePool)(d);

    // 低MQ追記
    if (d.isLowMQ && cat !== 'draw') {
      article = pick(AR.lowMQ)(d);
    }

    return { headline, subheadline, article };
  },
  _buildShowResultNewspaperData() {
    const results = G.lastShowResults || [];
    if (!results.length) return null;
    const rawMain = results[0];
    if (!rawMain) return null;
    const totalMatches = results.length;

    const buildTagNewsMatch = (r, originalIndex) => {
      const tA = r.teamA || {};
      const tB = r.teamB || {};
      const aMembers = [
        { id: tA.f1Id || 0, name: tA.f1Name || '?' },
        { id: tA.f2Id || 0, name: tA.f2Name || '?' },
      ];
      const bMembers = [
        { id: tB.f1Id || 0, name: tB.f1Name || '?' },
        { id: tB.f2Id || 0, name: tB.f2Name || '?' },
      ];
      const aLabel = aMembers.map(f => f.name).join(' & ');
      const bLabel = bMembers.map(f => f.name).join(' & ');
      const isMatchDraw = r.winner === 'draw';
      const winSide = r.winner === 'teamA' ? 'left' : r.winner === 'teamB' ? 'right' : 'draw';
      const winnerName = isMatchDraw ? null : (winSide === 'left' ? aLabel : bLabel);
      const loserName  = isMatchDraw ? null : (winSide === 'left' ? bLabel : aLabel);
      return {
        left: { id: tA.f1Id || 0, name: aLabel, ovr: 0, members: aMembers },
        right: { id: tB.f1Id || 0, name: bLabel, ovr: 0, members: bMembers },
        teamA: { label: aLabel, members: aMembers },
        teamB: { label: bLabel, members: bMembers },
        winner: winSide,
        winnerName,
        loserName,
        mq: r.mq || 0,
        turns: r.turns || 0,
        finishLabel: Engine.formatFinish(r.finType, r.finMove),
        isDraw: isMatchDraw,
        isUpset: false,
        isDominant: !isMatchDraw && (r.turns || 99) <= 6,
        isTitleMatch: false,
        isTag: true,
        matchNumber: originalIndex === 0 ? totalMatches : Math.max(1, totalMatches - originalIndex),
        matchLabel: originalIndex === 0 ? 'メインイベント' : `第${Math.max(1, totalMatches - originalIndex)}試合`,
      };
    };

    // タッグメインの場合: チーム代表名でleft/right/winner/loserを合成
    const isTagMain = rawMain.matchType === 'tag';
    let main;
    if (isTagMain) {
      const tagMain = buildTagNewsMatch(rawMain, 0);
      main = {
        ...rawMain,
        left: tagMain.left,
        right: tagMain.right,
        teamA: tagMain.teamA,
        teamB: tagMain.teamB,
        winner: tagMain.winner,
        isTag: true,
        matchNumber: tagMain.matchNumber,
        matchLabel: tagMain.matchLabel,
        isTitleMatch: false, // タッグはタイトル戦ではない
      };
    } else {
      if (!rawMain.left || !rawMain.right) return null;
      main = rawMain;
    }
    const venue = VENUES[G.showVenue] || { name: 'Arena' };
    const isDraw = main.winner === 'draw';
    const winner = isDraw ? null : (main.winner === 'left' ? main.left : main.right);
    const loser = isDraw ? null : (main.winner === 'left' ? main.right : main.left);
    const avgMQ = Math.round(results.reduce((sum, r) => sum + (r.mq || 0), 0) / results.length);
    const attendance = G.lastShowAttendance || 0;
    const showName = isPPV(G.week) ? 'PPV GRAND FINAL' : (isSpecialShow(G.week) ? '特別興行' : `第${G.totalShows}回 定期興行`);
    const finishLabel = Engine.formatFinish(main.finType, main.finMove);
    const turns = main.turns || 0;
    const mq = main.mq || avgMQ;
    const hpL = main.hpLeft || { final: 0, max: 100 };
    const hpR = main.hpRight || { final: 0, max: 100 };

    // 試合状況フラグ
    const loserHpPct = isDraw ? 50 : (main.winner === 'left'
      ? Math.round((hpR.final / Math.max(1, hpR.max)) * 100)
      : Math.round((hpL.final / Math.max(1, hpL.max)) * 100));
    const winnerHpPct = isDraw ? 50 : (main.winner === 'left'
      ? Math.round((hpL.final / Math.max(1, hpL.max)) * 100)
      : Math.round((hpR.final / Math.max(1, hpR.max)) * 100));
    const isCloseMatch = !isDraw && loserHpPct >= 15;
    const isDominant = !isDraw && turns <= 6;
    const isLongBattle = turns >= 18;
    const isHighMQ = mq >= 80;
    const isSuperMQ = mq >= 90;
    const isLowMQ = mq < 40;
    const isPPVShow = isPPV(G.week);
    const isSpecial = isSpecialShow(G.week);

    // 因縁・関係データ（タッグはチーム単位のため個人因縁は適用しない）
    const rivalLvl = isTagMain ? null : getRivalryLevel(main.left.id, main.right.id);
    const hasRivalry = !!rivalLvl && !rivalLvl.isGoodRival;
    const isGoodRival = !!rivalLvl && rivalLvl.isGoodRival;
    const rivalLabel = rivalLvl ? rivalLvl.label : null;
    let bondAvg = 50;
    if (!isTagMain && G.relationships) {
      const kAB = `${main.left.id}>${main.right.id}`;
      const kBA = `${main.right.id}>${main.left.id}`;
      const bA = G.relationships[kAB]?.bond || 50;
      const bB = G.relationships[kBA]?.bond || 50;
      bondAvg = Math.round((((bA + bB) / 2) + Number.EPSILON) * 10) / 10;
    }
    const isHighBond = bondAvg >= 70;

    // OVR差（タッグは合成代表のOVRが0のためupset判定をスキップ）
    const ovrL = isTagMain ? 0 : Engine.util.ov(main.left);
    const ovrR = isTagMain ? 0 : Engine.util.ov(main.right);
    const ovrGap = Math.abs(ovrL - ovrR);
    const isUpset = !isTagMain && !isDraw && winner && (
      (winner.id === main.left.id && ovrL < ovrR - 8) ||
      (winner.id === main.right.id && ovrR < ovrL - 8)
    );

    // 他の試合のハイライト
    const otherHighMQ = results.slice(1).filter(r => (r.mq || 0) >= 75);
    // タイトルマッチの場合、防衛/奪取を判定（_lastTitleOutcomes は本関数呼び出し直前に設定されている）
    let isTitleDefense = false;
    if (main.isTitleMatch && !isDraw && winner) {
      const outcomes = App._lastTitleOutcomes || [];
      const winnerId = winner.id;
      const mainOutcome = outcomes.find(o =>
        (o.outcome === 'defense' && o.champId === winnerId) ||
        (o.outcome === 'change' && o.newChampId === winnerId)
      );
      isTitleDefense = mainOutcome?.outcome === 'defense';
    }

    // ─── テキスト生成 ───
    const np = App._generateNewspaperTexts({
      isDraw, winner, loser, left: main.left, right: main.right,
      isTitleMatch: !!main.isTitleMatch, isTitleDefense, finishLabel, turns, mq,
      loserHpPct, winnerHpPct, isCloseMatch, isDominant, isLongBattle,
      isHighMQ, isSuperMQ, isLowMQ, isPPVShow, isSpecial,
      hasRivalry, isGoodRival, rivalLabel, isHighBond,
      ovrGap, isUpset, venue, attendance, showName, avgMQ,
      otherHighMQ, totalMatches, orgName: G.orgName
    });

    // ── allMatches: メイン以外の全試合ダイジェスト ──
    const allMatches = results.slice(1).map((r, relIdx) => {
      if (!r) return null;
      const originalIndex = relIdx + 1;
      // タッグ試合: チーム代表名で合成
      if (r.matchType === 'tag') {
        return buildTagNewsMatch(r, originalIndex);
      }
      if (!r.left || !r.right) return null;
      const isMatchDraw = r.winner === 'draw';
      const matchWinner = isMatchDraw ? null : (r.winner === 'left' ? r.left : r.right);
      const matchLoser = isMatchDraw ? null : (r.winner === 'left' ? r.right : r.left);
      const ovrL = Engine.util.ov(r.left);
      const ovrR = Engine.util.ov(r.right);
      return {
        left: { id: r.left.id, name: r.left.name, ovr: ovrL },
        right: { id: r.right.id, name: r.right.name, ovr: ovrR },
        winner: r.winner,
        winnerName: matchWinner?.name || null,
        loserName: matchLoser?.name || null,
        mq: r.mq || 0,
        turns: r.turns || 0,
        finishLabel: Engine.formatFinish(r.finType, r.finMove),
        isDraw: isMatchDraw,
        isUpset: !isMatchDraw && matchWinner && (
          (matchWinner.id === r.left.id && ovrL < ovrR - 8) ||
          (matchWinner.id === r.right.id && ovrR < ovrL - 8)
        ),
        isDominant: !isMatchDraw && (r.turns || 99) <= 6,
        isTitleMatch: !!r.isTitleMatch,
        isTag: false,
        matchNumber: Math.max(1, totalMatches - originalIndex),
        matchLabel: `第${Math.max(1, totalMatches - originalIndex)}試合`,
      };
    }).filter(Boolean);

    // 集客v2: ★評価をv2 calcShowRating で算出
    const npValidMatches = (G.showCard || []).filter(m => m.left > 0 && m.right > 0);
    const npFanExpects = Engine.fanExpect.generate(G);
    const npRatingCtx = {
      hasTitleMatch: npValidMatches.some(m => m.isTitle),
      titleGreatMQ: npValidMatches.some(m => m.isTitle) ? results.find((r, i) => npValidMatches[i]?.isTitle)?.mq || 0 : 0,
      rivalryResolved: results.some(r => r.rivalryResolved),
      rivalryCards: npValidMatches.filter(m => {
        if (!G.relationships) return false;
        const rAB = G.relationships[`${m.left}>${m.right}`]?.rivalry || 0;
        const rBA = G.relationships[`${m.right}>${m.left}`]?.rivalry || 0;
        return Math.max(rAB, rBA) >= 30;
      }).length,
      fanExpectMatches: npFanExpects ? Engine.fanExpect.countMatched(npValidMatches, npFanExpects) : 0,
    };
    const npRating = Engine.attendanceV2.calcShowRating(results, attendance, VENUES[G.showVenue].cap, G.showVenue, npRatingCtx);
    const showRating = { stars: npRating.stars, totalScore: npRating.totalScore, mqScore: npRating.mqScore, occScore: npRating.occScore, bonusScore: npRating.bonusScore, actual: avgMQ };

    // ── preview: 次回展望データ ──
    const preview = { fanExpect: [], rivalry: null, title: null };
    // ファン期待カード（動的生成）
    const pvFanExpects = Engine.fanExpect.generate(G);
    if (pvFanExpects && pvFanExpects.length > 0) {
      pvFanExpects.slice(0, 2).forEach(fe => {
        const feLeft = G.roster.find(f => f.id === fe.leftId) || ALL_CHARS.find(c => c.id === fe.leftId);
        const feRight = G.roster.find(f => f.id === fe.rightId) || ALL_CHARS.find(c => c.id === fe.rightId);
        if (feLeft && feRight) {
          preview.fanExpect.push({ leftId: feLeft.id, leftName: feLeft.name, rightId: feRight.id, rightName: feRight.name });
        }
      });
    }
    // 因縁ペア（tierが最大のもの）
    if (G.rivalries) {
      let maxTier = 0, hotPair = null;
      Object.entries(G.rivalries).forEach(([key, riv]) => {
        const tier = riv.tier || 0;
        const matches = riv.matches || 0;
        if (tier > maxTier || (tier === maxTier && matches > (hotPair?._matches || 0))) {
          maxTier = tier;
          const ids = key.split('>');
          const rLeft = G.roster.find(f => f.id === ids[0]);
          const rRight = G.roster.find(f => f.id === ids[1]);
          if (rLeft && rRight) hotPair = { leftName: rLeft.name, rightName: rRight.name, _matches: matches };
        }
      });
      if (hotPair && maxTier >= 1) {
        preview.rivalry = { leftName: hotPair.leftName, rightName: hotPair.rightName };
      }
    }
    // タイトル戦展望
    const champId = G.titles?.world?.championId;
    if (champId) {
      const champ = G.roster.find(f => f.id === champId);
      const challenger = [...G.roster]
        .filter(f => f.id !== champId)
        .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
      if (champ && challenger) {
        preview.title = { championName: champ.name, challengerName: challenger.name };
      }
    }

    return {
      showName, venueName: venue.name, venueIdx: G.showVenue, attendance, avgMQ,
      headline: np.headline, subheadline: np.subheadline, article: np.article,
      winner, loser, left: main.left, right: main.right, isDraw, finishLabel,
      turns, mq, hpLeft: hpL, hpRight: hpR, isTitleMatch: !!main.isTitleMatch,
      isTag: !!main.isTag, teamA: main.teamA || null, teamB: main.teamB || null,
      matchNumber: main.matchNumber || totalMatches, matchLabel: main.matchLabel || 'メインイベント',
      injuries: (App._lastInjuries || []).filter(ir => ir && ir.injury && !ir.retireType).map(ir => ({
        name: ir.name,
        type: ir.injury.type,
        weeksLeft: ir.injury.weeksLeft,
      })),
      allMatches, showRating, preview,
      generatedWeek: G.week, generatedSeason: G.season,
    };
  },

  _glimpseSignature(glimpse) {
    // 識別に使うのは「どのペアの、どの種類の」glimpseかという安定情報のみ。
    // tone/label は type(=GLIMPSE_A_THRESHOLDS の id)に対して1:1で決まる派生値、
    // dialogue は pickDialogueLine() が Math.random() で選ぶ非決定的なセリフ文字列
    // （プレビューtickと本tickで別々に消費されるため一致しない）。
    // これらを署名に含めると、同一glimpseなのにセリフ違いで signature が変わり、
    // 重複排除が機能しなくなる（SHOW AFTERMATH 二重表示の原因）。
    return [
      glimpse.layer || '',
      glimpse.type || '',
      glimpse.axis || '',
      glimpse.speakerId || '',
      glimpse.targetId || '',
    ].join('|');
  },

  _buildShowResultPreviewState(baseState) {
    let previewState = baseState;
    const pendingInjuryRetirements = previewState._pendingInjuryRetirements || [];
    if (previewState._pendingInjuryRetirements) {
      const { _pendingInjuryRetirements: _, ...cleanPreview } = previewState;
      previewState = cleanPreview;
    }
    pendingInjuryRetirements.forEach(r => {
      previewState = archiveRetiredRivalryState(previewState, r.fighter || null);
    });

    const pendingLastRunRetirements = previewState._pendingLastRunRetirements || [];
    if (previewState._pendingLastRunRetirements) {
      const { _pendingLastRunRetirements: _, ...cleanPreview } = previewState;
      previewState = cleanPreview;
    }
    pendingLastRunRetirements.forEach(r => {
      previewState = archiveRetiredRivalryState(previewState, r.fighter || null);
    });

    return previewState;
  },

  prepareShowResultInlinePopups() {
    if (App._showResultInlinePreviewPrepared) return;
    App._showResultInlinePreviewPrepared = true;
    App._showResultInlinePreview = null;
    // 新しい興行の結果画面が開くたびにリセット。SHOW AFTERMATH カスケードは
    // この興行につき一度しか出さない（プレビュー経路/本tick経路のどちらが
    // 先に発火しても、後発側はここで弾かれる）。
    App._glimpseCascadeShownThisShow = false;

    try {
      const previewBaseState = App._buildShowResultPreviewState(G);
      const previewTick = Engine.tickWeek(previewBaseState);
      const previewState = previewTick?.state || null;
      if (!previewState) return;

      const allGlimpses = [
        ...(previewState._pendingGlimpseA || []),
        ...(previewState._pendingGlimpseB || []),
      ];
      const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
      if (tier1.length === 0) return;

      App._showResultInlinePreview = {
        shownSignatures: new Set(),
      };

      setTimeout(() => {
        const overlay = document.getElementById('showResultOverlay');
        if (!overlay || !overlay.classList.contains('active') || !App._showResultInlinePreview) return;
        tier1.forEach(glimpse => {
          App._showResultInlinePreview.shownSignatures.add(App._glimpseSignature(glimpse));
        });
        if (App._glimpseCascadeShownThisShow) return;
        App._glimpseCascadeShownThisShow = true;
        showGlimpseCascade(tier1, { allowWhileShowResult: true });
      }, 500);
    } catch (e) {
      console.error('[WM] prepareShowResultInlinePopups failed:', e);
      App._showResultInlinePreview = null;
    }
  },

  _startAwayChallengeShow() {
    const booking = G._pendingAwayChallengeMatch;
    if (!booking || App._awayChallengeInProgress) return false;
    // 同週コンテナ排他: 受け挑戦が先着の週、および今週すでに別の遠征を消化済みの週は
    // 遠征を起動しない(予約は持ち越し)。通常導線(startShowPrep/resumeShowPrep/executeShow)は
    // 手前で見送るため、これは直接呼び出しの保険。
    if (Engine.challengeRequest?.hasAwayRunThisWeek?.(G)) return false;
    if (Engine.challengeRequest?.resolveWeeklyChallengeContainer?.(G) === 'incoming') return false;
    const requesterRoster = booking.requesterOrgId === 'player' ? (G.roster || []) : (G.aiOrgs?.[booking.requesterOrgId]?.roster || []);
    const opponentRoster = booking.opponentOrgId === 'player' ? (G.roster || []) : (G.aiOrgs?.[booking.opponentOrgId]?.roster || []);
    const findAll = (ids, roster) => (ids || []).map(id => roster.find(f => f.id === id)).filter(Boolean);
    const healthy = f => f && !f.injury && !f.forcedRest && !f.suspended;
    const teamA = findAll(booking.teamAIds, requesterRoster);
    const teamB = findAll(booking.teamBIds, opponentRoster);
    if (teamA.length !== 3 || teamB.length !== 3 || !teamA.every(healthy) || !teamB.every(healthy)) {
      const { _pendingAwayChallengeMatch: _invalidAway, ...rest } = G;
      G = rest;
      showToast('⚠ 遠征メンバーが揃わないため、挑戦試合は中止になりました', 5000);
      try { Storage.autoSave(); } catch (_e) {}
      return false;
    }
    // Keep the canonical player roster boundary. Opponent wrestlers are only
    // temporary battle guests and must never survive result application.
    const ownIds = new Set((G.roster || []).map(f => f.id));
    const guests = [...teamA, ...teamB].filter(f => !ownIds.has(f.id)).map(f => ({ ...f, isAwayChallengeGuest: true }));
    const groupId = `away_cr_${booking.requesterId}_${booking.opponentId}_${G.season}_${G.week}`;
    const validMatches = [0, 1, 2].map(i => ({
      left: teamA[i].id, right: teamB[i].id, isTitle: false,
      isCRMatch: true, _awayChallengeMatch: true, _crGroupId: groupId, _crSlot: i,
    }));
    // **遠征に出た選手は、その週それ以上出られない。**
    // 予約(_pendingAwayChallengeMatch)は試合が終わると消えるので、それだけを見ていると
    // 遠征のあとの通常興行におまかせ編成で呼び戻され、**同じ週に二重出場**していた
    // (2026-07-27 Keisuke 報告)。出た事実は週が変わるまで残す。
    const ownAwayIds = (booking.requesterOrgId === 'player' ? booking.teamAIds : booking.teamBIds) || [];
    G = { ...G, roster: [...G.roster, ...guests],
      _awayChallengeUsedIds: { season: G.season, week: G.week, ids: [...ownAwayIds] } };
    App._awayChallengeInProgress = true;
    App._showPreview = {
      validMatches, results: new Array(3).fill(null), currentWatching: -1,
      stateSnapshot: JSON.parse(JSON.stringify(G)), confrontationPairs: [], confrontationMap: {},
      _shownConfrontations: new Set(), isAwayChallenge: true, awayBooking: booking,
      awayGuestIds: guests.map(f => f.id),
      awayPlayerRosterIds: [...ownIds],
    };
    try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch (_e) {}
    renderMatchPreview();
    return true;
  },

  _startUnifiedTitleAwayShow() {
    const booking = G._pendingUnifiedAwayMatch;
    if (!booking) return false;
    const champion = Engine.unifiedTitle._findActive(G, booking.championId);
    const challenger = Engine.unifiedTitle._findActive(G, booking.challengerId);
    if (!champion || !challenger || challenger.orgId !== 'player'
        || !Engine.unifiedTitle._available(champion.fighter) || !Engine.unifiedTitle._available(challenger.fighter)) {
      G = { ...G, _pendingUnifiedAwayMatch: null };
      showToast('⚠ 全国統一王座への遠征条件が整わないため、予約を解除しました', 5000);
      return false;
    }
    try { Engine.unifiedTitle.assertEligibleChallenger(G, 'player', challenger.fighter.id, champion.fighter.id); }
    catch (_err) {
      G = { ...G, _pendingUnifiedAwayMatch: null };
      showToast('⚠ 挑戦資格が失われたため、全国統一王座戦を解除しました', 5000);
      return false;
    }
    const guest = { ...champion.fighter, isUnifiedTitleGuest: true, _unifiedGuestOrgId: champion.orgId };
    const slot = { left: challenger.fighter.id, right: champion.fighter.id, isTitle: true,
      _unifiedTitleMatch: true, _unifiedAwayMatch: true, _unifiedTitleLocked: true };
    const ownIds = new Set((G.roster || []).map(f => f.id));
    G = {
      ...G,
      roster: [...G.roster, guest],
      _awayChallengeUsedIds: { season: G.season, week: G.week, ids: [challenger.fighter.id] },
    };
    App._showPreview = {
      validMatches: [slot], results: [null], currentWatching: -1,
      stateSnapshot: JSON.parse(JSON.stringify(G)), confrontationPairs: [], confrontationMap: {},
      _shownConfrontations: new Set(), isUnifiedAwayTitle: true,
      unifiedAwayBooking: booking, unifiedAwayGuestIds: [guest.id], unifiedAwayPlayerRosterIds: [...ownIds],
    };
    try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch (_e) {}
    renderMatchPreview();
    return true;
  },

  beginUnifiedTitleAwayTravel() {
    const booking = G._pendingUnifiedAwayMatch;
    if (!booking) return;
    const champion = Engine.unifiedTitle._findActive(G, booking.championId);
    const challenger = Engine.unifiedTitle._findActive(G, booking.challengerId);
    if (!champion || !challenger) { App._startUnifiedTitleAwayShow(); return; }
    const start = () => App._startUnifiedTitleAwayShow();
    if (typeof showTravelScene !== 'function') { start(); return; }
    showTravelScene({
      heading: '— 全国統一王座へ —',
      from: { label: G.orgName || 'プレイヤー団体', emblemHtml: (typeof orgIconHtml === 'function' ? orgIconHtml('player', 22) : ''), accent: 'var(--c-positive)' },
      to: { label: Engine.unifiedTitle._orgName(G, champion.orgId), emblemHtml: (typeof orgIconHtml === 'function' ? orgIconHtml(champion.orgId, 22) : ''), accent: 'var(--unified)' },
      party: [{ id: challenger.fighter.id, name: challenger.fighter.name }],
      lines: [`${challenger.fighter.name}が、全国統一王者の待つ敵地へ向かっています。`, '業界の頂点を懸けた一戦です。'],
      vehicleIcon: '🚌', durationMs: 5800,
    }, start);
  },

  _finalizeUnifiedTitleAwayShow() {
    const sp = App._showPreview;
    if (!sp?.isUnifiedAwayTitle || !sp.results?.[0]) return;
    const booking = sp.unifiedAwayBooking;
    const result = sp.results[0];
    const slot = sp.validMatches[0];
    const winnerId = result.winner === 'left' ? slot.left : result.winner === 'right' ? slot.right : null;
    const updatedChampion = (G.roster || []).find(f => f.isUnifiedTitleGuest && f.id === booking.championId);
    const aiOrgs = { ...(G.aiOrgs || {}) };
    const championOrg = aiOrgs[booking.championOrgId];
    if (updatedChampion && championOrg?.roster) {
      const { isUnifiedTitleGuest, _unifiedGuestOrgId, ...cleanChampion } = updatedChampion;
      aiOrgs[booking.championOrgId] = {
        ...championOrg,
        roster: championOrg.roster.map(f => f.id === cleanChampion.id ? cleanChampion : f),
      };
    }
    let s = { ...G, aiOrgs, roster: (G.roster || []).filter(f => !f.isUnifiedTitleGuest) };
    s = Engine.mq.updateRecord(s, result, {
      holderIds: [slot.left, slot.right], orgId: null, stage: 'normal', matchType: 'singles', winnerId,
    }).state;
    s = Engine.unifiedTitle.resolveMatch(s, { ...booking, winnerId });
    const won = winnerId === booking.challengerId;
    const consumed = { type: 'playerTurnConsumed', outcome: won ? 'won' : 'lost', season: s.season, week: s.week };
    s = {
      ...s,
      unifiedTitle: s.unifiedTitle ? {
        ...s.unifiedTitle,
        aiHolderCycles: won ? s.unifiedTitle.aiHolderCycles : 0,
        history: [...(s.unifiedTitle.history || []), consumed],
      } : s.unifiedTitle,
      _pendingUnifiedAwayMatch: null,
      weekPhase: 'showPrep',
    };
    G = s;
    App._showPreview = null;
    try { Storage.autoSave(); } catch (_e) {}
    showToast(won ? '🌐 全国統一王座を奪取しました！' : '全国統一王座への挑戦は届きませんでした', 5000);
    showScreen('show');
    refreshAll();
    if (typeof renderShowPrep === 'function') renderShowPrep();
  },

  handleUnifiedTitlePlayerTurn() {
    const turn = G._pendingUnifiedPlayerTurn;
    if (!turn || typeof showUnifiedTitleChallengeModal !== 'function') return;
    showUnifiedTitleChallengeModal(turn, G, fighterId => {
      if (fighterId === 'defer') {
        // タイムアウト保険で閉じただけ。挑戦権は消費せず、翌週の週次通知でもう一度差し出す。
        G = { ...G, _pendingUnifiedNotification: { type: 'playerTurn', championId: turn.championId } };
      } else if (fighterId == null) {
        G = Engine.unifiedTitle.declinePlayerTurn(G, 'skipped');
      } else {
        G = Engine.unifiedTitle.acceptPlayerTurn(G, fighterId);
      }
      try { Storage.autoSave(); } catch (_e) {}
      refreshAll();
    });
  },

  _unifiedTitleReturnFacts(state) {
    const title = state?.unifiedTitle;
    if (!title) return { heldYears: 0, defenses: 0, holderCount: 0, cycleYears: 4 };
    const history = Array.isArray(title.history) ? title.history : [];
    const lastAwardIndex = history.reduce((idx, event, index) =>
      ['creation', 'crown', 'repeat'].includes(event?.type) ? index : idx, -1);
    const holderIds = new Set();
    history.slice(Math.max(0, lastAwardIndex)).forEach(event => {
      if (event?.championId != null) holderIds.add(event.championId);
      if (event?.winnerId != null) holderIds.add(event.winnerId);
    });
    if (title.championId != null) holderIds.add(title.championId);
    const heldWeeks = Math.max(0,
      Engine.util.absWeek(state.season || 1, state.week || 1)
      - Engine.util.absWeek(title.wonSeason || state.season || 1, title.wonWeek || 1));
    const heldYearsValue = Math.round((heldWeeks / 48) * 10) / 10;
    return {
      heldYears: Number.isInteger(heldYearsValue) ? heldYearsValue : heldYearsValue.toFixed(1),
      defenses: Number(title.defenses) || 0,
      holderCount: holderIds.size,
      cycleYears: 4,
    };
  },

  checkUnifiedTitlePresentation() {
    const returnPending = G._pendingUnifiedReturnCeremony || null;
    const arrivalPending = G._pendingUnifiedNotification?.type === 'challengerArrival'
      ? G._pendingUnifiedNotification : null;
    if ((!returnPending && !arrivalPending) || App._unifiedPresentationPending) return;
    App._unifiedPresentationPending = true;
    setTimeout(() => {
      App._unifiedPresentationPending = false;
      const jobs = [];
      let next = G;

      const currentReturn = next._pendingUnifiedReturnCeremony;
      if (currentReturn) {
        if (currentReturn.season === next.season) {
          const found = Engine.unifiedTitle._findActive(next, currentReturn.championId);
          if (found && found.orgId === 'player' && typeof showUnifiedTitleReturnCeremony === 'function') {
            const facts = App._unifiedTitleReturnFacts(next);
            const snapshot = next;
            jobs.push(() => showUnifiedTitleReturnCeremony({
              fighter: found.fighter,
              orgName: Engine.unifiedTitle._orgName(snapshot, found.orgId),
              ...facts,
              safetyTimeoutMs: 30000,
            }, snapshot, () => { try { Storage.autoSave(); } catch (_e) {} }));
          }
        }
        const { _pendingUnifiedReturnCeremony: _shownReturn, ...withoutReturn } = next;
        next = withoutReturn;
      }

      const currentArrival = next._pendingUnifiedNotification?.type === 'challengerArrival'
        ? next._pendingUnifiedNotification : null;
      if (currentArrival && typeof showUnifiedTitleChallengerArrival === 'function') {
        const snapshot = next;
        jobs.push(() => showUnifiedTitleChallengerArrival(currentArrival, snapshot,
          () => { try { Storage.autoSave(); } catch (_e) {} }));
        const { _pendingUnifiedNotification: _shownArrival, ...withoutArrival } = next;
        next = withoutArrival;
      }

      G = next;
      if (jobs.length) {
        try { Storage.autoSave(); } catch (_e) {}
        _enqueuePopup(jobs.shift());
        jobs.forEach(job => _popupQueue.push(job));
      }
    }, 300);
  },

  // Run an accepted away challenge directly from show preparation so its result
  // is not hidden behind the player organization's local-show result screen.
  startAwayChallengeFromPrep() {
    if (!G._pendingAwayChallengeMatch
      || !['manage', 'showPrep'].includes(G.weekPhase)
      || !Engine.challengeRequest?.isEligibleHomeShow?.(G)) {
      Audio.play('error');
      showToast('この週は遠征対抗戦を実行できません。', 3000);
      return false;
    }
    App._awayChallengeManualStart = true;
    if (!App._startAwayChallengeShow()) {
      App._awayChallengeManualStart = false;
      return false;
    }
    return true;
  },

  // away-flow-redesign 実装B(CH-2): 「敵地へ向かう」移動演出を挟んでから遠征試合を開始する。
  // startShowPrep()（ui-common.js）が、興行準備画面(会場選択・カード編集)という寄り道を
  // 見せる前にこれを呼ぶ。演出が終わると _startAwayChallengeShow() が試合前画面を開く。
  // weekPhase は呼び出し側で既に 'showPrep' になっている前提
  // （_finalizeAwayChallengeShow の continueClose が _awayChallengeManualStart 経由で
  // 興行準備画面へ正しく復帰できるようにするため。既存の安全弁 startAwayChallengeFromPrep()
  // /executeShow() 側のフォールバックは変更しない）。
  beginAwayChallengeTravel() {
    const booking = G._pendingAwayChallengeMatch;
    if (!booking) return;
    if (typeof showTravelScene !== 'function') {
      // 演出コンポーネント未読込時のフォールバック: 演出なしで直接開始
      App.startAwayChallengeFromPrep();
      return;
    }
    const ownIsRequester = booking.requesterOrgId === 'player';
    const ownIds = ownIsRequester ? booking.teamAIds : booking.teamBIds;
    const partyFighters = (ownIds || []).map(id => (G.roster || []).find(f => f.id === id)).filter(Boolean);
    const destOrgId = ownIsRequester ? booking.opponentOrgId : booking.requesterOrgId;
    const destOrgName = (ownIsRequester ? booking.opponentOrgName : booking.requesterOrgName) || destOrgId || '相手団体';
    const selfOrgName = (ownIsRequester ? booking.requesterOrgName : booking.opponentOrgName) || G.orgName || 'プレイヤー団体';
    // 名指しされた相手本人の現在の名前（受理から数週経ち、入れ替わっている可能性を考慮して再取得）
    const namedOpponentId = ownIsRequester ? booking.opponentId : booking.requesterId;
    const destRoster = destOrgId === 'player' ? (G.roster || []) : ((G.aiOrgs && G.aiOrgs[destOrgId] && G.aiOrgs[destOrgId].roster) || []);
    const namedOpponentName = (destRoster.find(f => f.id === namedOpponentId) || {}).name || `${destOrgName}の選手`;
    const partyCountLabel = partyFighters.length === 1 ? '一人' : partyFighters.length === 2 ? '二人' : partyFighters.length === 3 ? '三人' : `${partyFighters.length}人`;

    App._awayChallengeManualStart = true;
    showTravelScene({
      heading: '— 移 動 中 —',
      from: { label: selfOrgName, emblemHtml: (typeof orgIconHtml === 'function' ? orgIconHtml('player', 22) : ''), accent: 'var(--c-positive)' },
      to: { label: destOrgName, emblemHtml: (typeof orgIconHtml === 'function' ? orgIconHtml(destOrgId, 22) : ''), accent: 'var(--accent-hostility)' },
      party: partyFighters.map(f => ({ id: f.id, name: f.name })),
      lines: [
        `${partyCountLabel}を乗せた車が、他団体の会場へ向かっています。`,
        `迎えるのは、名指しされた${namedOpponentName}。ここから先は敵地です。`,
      ],
      vehicleIcon: '🚌',
      durationMs: 5800,
    }, () => {
      if (!App._startAwayChallengeShow()) {
        App._awayChallengeManualStart = false;
        // 予約が無効化された場合(メンバーが揃わない等)は通常の興行準備画面へ戻す
        showScreen('show');
        refreshAll();
        if (G.weekPhase === 'showPrep' && typeof renderShowPrep === 'function') renderShowPrep();
      }
    });
  },

  _recoverAwayChallengeAfterError(error) {
    console.error('[WM] away challenge finalization failed:', error);
    const sp = App._showPreview;
    const playerRosterIds = new Set(sp?.awayPlayerRosterIds || []);
    const isTemporaryAwayGuest = fighter => !fighter
      || fighter.isAwayChallengeGuest
      || (playerRosterIds.size > 0 && !playerRosterIds.has(fighter.id));
    const wasManualStart = !!App._awayChallengeManualStart;
    const { _pendingAwayChallengeMatch: _failedAway, ...clean } = G;
    G = { ...clean, roster: (G.roster || []).filter(f => !isTemporaryAwayGuest(f)) };
    App._showPreview = null;
    App._awayChallengeInProgress = false;
    App._awayChallengeManualStart = false;
    App._awayChallengeCompletedForClose = !wasManualStart && G.weekPhase === 'showExec';
    try { Storage.autoSave(); } catch (_e) {}
    try { showToast('⚠️ 遠征対抗戦の処理に問題が発生したため、相手選手を除去して予約を解除しました。', 6000); } catch (_e) {}
    if (wasManualStart || G.weekPhase !== 'showExec') {
      try { Audio.bgm.playForState(); } catch (_e) {}
      try { showScreen('week'); refreshAll(); } catch (_e) {}
      if (G.weekPhase === 'showPrep' && typeof renderShowPrep === 'function') renderShowPrep();
      return;
    }
    App.closeShowResult();
  },

  _finalizeAwayChallengeShow() {
    const sp = App._showPreview;
    if (!sp?.isAwayChallenge || sp.results.some(r => !r)) return;
    const booking = sp.awayBooking;
    const results = sp.results;
    const allById = new Map((G.roster || []).map(f => [f.id, { ...f }]));
    let s = { ...G };
    const relRng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season, G.week, 0xC4A7));
    const growthRng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season, G.week, 0xC4A8));
    const injuryResults = [];
    results.forEach((r, idx) => {
      const match = sp.validMatches[idx];
      const left = allById.get(match.left) || r.left;
      const right = allById.get(match.right) || r.right;
      if (!left || !right) return;
      const context = {
        mq: r.mq, winner: r.winner === 'left' ? 'win' : r.winner === 'right' ? 'lose' : 'draw',
        hpA: r.hpLeft, hpB: r.hpRight, turns: r.turns, stage: 'challenge', isTitleMatch: false,
        rivalryResolved: false, injuredId: null,
        isCareerBestA: r.mq > (left.careerBestMQ || 0), isCareerBestB: r.mq > (right.careerBestMQ || 0),
        losingStreakA: left.losingStreak || 0, losingStreakB: right.losingStreak || 0,
        isProveModeA: (left.proveMode || 0) > 0, isProveModeB: (right.proveMode || 0) > 0,
        ovrA: Engine.util.ov(left), ovrB: Engine.util.ov(right), isCrossOrg: true, isChallengeShowMatch: true,
      };
      s = Engine.relationships.applyMatchResult(s, left.id, right.id, context, relRng);
      r._challengeRelationshipDelta = context._challengeRelationshipDelta;
      [
        { fighter: left, hp: r.hpLeft, opponent: right, won: r.winner === 'left' },
        { fighter: right, hp: r.hpRight, opponent: left, won: r.winner === 'right' },
      ].forEach((entry, sideIdx) => {
        let fighter = allById.get(entry.fighter.id) || entry.fighter;
        const ratio = Engine.wear.hpRatio(entry.hp?.final, entry.hp?.max);
        fighter = { ...fighter, condition: Engine.wear.nextCondition(fighter.condition, Engine.wear.calc(ratio), 0, 30, 100) };
        const stats = ['pw', 'sp', 'te', 'st', 'mn'];
        const stat = stats[Engine.rng.int(growthRng, 0, stats.length - 1)];
        const opponentBonus = Engine.util.ov(entry.opponent) > Engine.util.ov(fighter) ? 1 : 0;
        const gain = Math.max(1, Math.round((GROWTH_CONFIG.matchGrowthBase || 0) + opponentBonus + (entry.won ? 0 : 0.2)));
        const cap = fighter.trainCap?.[stat] || 100;
        if (!fighter.slump && !fighter.motivationLoss && fighter[stat] < cap) {
          const actualGain = Math.max(0, Math.min(gain, cap - (fighter[stat] || 0)));
          fighter = {
            ...fighter,
            [stat]: (fighter[stat] || 0) + actualGain,
            seasonGrowth: { ...(fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 }), [stat]: (fighter.seasonGrowth?.[stat] || 0) + actualGain },
          };
          if (actualGain > 0 && fighter.growthLog && !fighter.isRental) {
            fighter.growthLog = [...fighter.growthLog, {
              season: G.season, week: G.week, type: 'match', detail: `敵地遠征 vs ${entry.opponent.name}`,
              opponent: entry.opponent.name, result: r.winner === 'draw' ? 'draw' : entry.won ? 'win' : 'lose', deltas: { [stat]: actualGain },
            }];
          }
        }
        if (r.mq > (fighter.careerBestMQ || 0)) fighter = { ...fighter, careerBestMQ: r.mq };
        const injRng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season, G.week, 0xC4A9, idx, sideIdx, fighter.id));
        const injury = Engine.injury.check(injRng, fighter, { ...r, left, right }, 1, G.week, G.season, 0, {});
        if (injury) {
          fighter = injury.newFighter;
          injuryResults.push({ id: fighter.id, name: fighter.name, injury: fighter.injury, retireType: injury.retireType || null });
        }
        allById.set(fighter.id, fighter);
      });
    });
    const guestIds = new Set(sp.awayGuestIds || []);
    const playerRosterIds = new Set(sp.awayPlayerRosterIds || []);
    const isTemporaryAwayGuest = fighter => !fighter
      || fighter.isAwayChallengeGuest
      || (guestIds.has(fighter.id) && !playerRosterIds.has(fighter.id))
      || !playerRosterIds.has(fighter.id);
    s = {
      ...s,
      roster: (s.roster || []).filter(f => !isTemporaryAwayGuest(f)).map(f => allById.get(f.id) || f),
      aiOrgs: Object.fromEntries(Object.entries(s.aiOrgs || {}).map(([orgId, org]) => [orgId, { ...org, roster: (org.roster || []).map(f => allById.get(f.id) || f) }])),
      matchupLog: [...(s.matchupLog || []), ...sp.validMatches.map(m => ({ leftId: m.left, rightId: m.right, showCount: s.totalShows, awayChallenge: true }))],
    };
    const card = {
      ...booking, otherOrgId: booking.opponentOrgId, otherOrgName: booking.opponentOrgName,
      teamA: booking.teamAIds.map(id => allById.get(id)).filter(Boolean),
      teamB: booking.teamBIds.map(id => allById.get(id)).filter(Boolean),
    };
    const matches = results.map((r, i) => ({
      fighterA: card.teamA[i], fighterB: card.teamB[i], winner: r.winner, mq: r.mq,
      finType: r.finType, finMove: r.finMove, relationshipDelta: r._challengeRelationshipDelta,
    }));
    const winsA = matches.filter(m => m.winner === 'left').length;
    const winsB = matches.filter(m => m.winner === 'right').length;
    const result = { matches, winsA, winsB, teamWin: winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'draw' };
    s = App._applyChallengeRequestResult(s, card, result);
    // _applyChallengeRequestResult updates career records on both rosters.
    // Reassert the pre-away player roster boundary in case a future result hook
    // copies a guest into the local roster.
    s = { ...s, roster: (s.roster || []).filter(f => !isTemporaryAwayGuest(f)) };
    const { _pendingAwayChallengeMatch: _doneAway, ...clean } = s;
    G = clean;
    App._showPreview = null;
    App._awayChallengeInProgress = false;
    App._awayChallengeCompletedForClose = !App._awayChallengeManualStart;
    App._lastInjuries = [...(App._lastInjuries || []), ...injuryResults.filter(ir => !guestIds.has(ir.id))];
    try { Storage.autoSave(); } catch (_e) {}
    const continueClose = () => {
      if (App._awayChallengeManualStart) {
        App._awayChallengeManualStart = false;
        try { Audio.bgm.playForState(); } catch (_e) {}
        // 遠征試合後は同じ週の自団体興行準備へ戻す(遠征選手はカードから除外済み)。
        // weekPhase は 'showPrep' のままなので着地先は 'week' タブではなく 'show' 画面。
        // 'week' を出すと renderWeekScreen が showPrep を描けず「進行不具合」復旧UIに
        // 落ち、自団体興行が中止されたように見えてしまう。
        showScreen('show');
        refreshAll();
        if (G.weekPhase === 'showPrep' && typeof renderShowPrep === 'function') renderShowPrep();
        return;
      }
      App.closeShowResult();
    };
    if (typeof showChallengeRequestResultModal === 'function') showChallengeRequestResultModal(card, result, G, continueClose);
    else continueClose();
  },

  // Close show result and advance via tickWeek
  closeShowResult() {
    if (App._closingShowResult) return;
    const resultOverlay = document.getElementById('showResultOverlay');
    if (!resultOverlay) return;
    if (G.weekPhase !== 'showExec') {
      // Guard against desynced phase state leaving the show-result overlay stranded.
      if (resultOverlay.classList.contains('active')) {
        console.warn('[WM] closeShowResult fallback: overlay active while weekPhase=', G.weekPhase);
        resultOverlay.classList.remove('active');
        App._showResultInlinePreviewPrepared = false;
        App._showResultInlinePreview = null;
        Audio.play('click');
        Audio.bgm.playForState();
        showScreen('week');
        refreshAll();
      }
      return;
    }
    // D層 postShow: 超満員ドームセレモニー（tickWeek 前に発火）
    if (G._pendingDomeSelloutCeremony) {
      const { _pendingDomeSelloutCeremony: _, ...cleanG } = G;
      G = { ...cleanG, milestones: { ...(cleanG.milestones || {}), first_dome_sellout: true } };
      const domeEvt = MILESTONE_EVENTS.find(e => e.id === 'first_dome_sellout');
      if (domeEvt) {
        resultOverlay.classList.remove('active');
        App._showResultInlinePreviewPrepared = false;
        App._showResultInlinePreview = null;
        const speakers = App._resolveSpotlightFighters(G);
        showCeremonyEvent(domeEvt, speakers, () => { App.closeShowResult(); });
        return;
      }
    }
    if (App._awayChallengeCompletedForClose) App._awayChallengeCompletedForClose = false;
    App._closingShowResult = true;
    try {
      const inlinePreview = App._showResultInlinePreview;
      App._showResultInlinePreviewPrepared = false;
      App._showResultInlinePreview = null;
      Audio.play('click');
      Audio.bgm.play('management');
      resultOverlay.classList.remove('active');

    // 試合後コメントポップアップ（因縁マッチ）
    // **同期で開かない(2026-08-13)。** closeShowResult は同じ tick 内で
    // advanceFromWeekSummary → dismissAllPopups まで進むため、ここで同期表示すると
    // ユーザーが目にする前にオーバーレイもキューも消される(=因縁コメントが出ない)。
    // タイマーに載せて同期本体(週送り+全消去)の後に開く。以降は _enqueuePopup ゲートが直列化する。
    const matchDialogues = [..._pendingMatchDialogues];
    _pendingMatchDialogues = [];
    if (matchDialogues.length > 0) {
      setTimeout(() => showPostMatchDialogues(matchDialogues), 0);
    }

    // v1.3-3: Extract pending injury retirements before state changes
    let pendingInjuryRetirements = G._pendingInjuryRetirements || [];
    if (G._pendingInjuryRetirements) {
      const { _pendingInjuryRetirements: _, ...cleanG } = G;
      G = cleanG;
    }
    try {
      wmDiag('[WM][injury-retire-diag] entry',
        { count: pendingInjuryRetirements.length,
          names: pendingInjuryRetirements.map(r => r?.fighter?.name),
          season: G.season, week: G.week });
    } catch (_e) {}
    // 怪我引退セリフの取りこぼし救済: lookup 失敗・transient 欠落で _pendingInjuryRetirements に
    // 載らなかった「今週の怪我引退者」を retiredFighters の最新 retire イベントから復元する
    {
      const queuedIds = new Set(
        pendingInjuryRetirements.map(r => r?.fighter?.id).filter(id => id != null)
      );
      const orphaned = (G.retiredFighters || []).filter(f => {
        if (!f || queuedIds.has(f.id)) return false;
        const history = f.careerRecord?.history || [];
        const latestRetire = [...history].reverse().find(h => h.type === 'retire');
        if (!latestRetire) return false;
        if (latestRetire.season !== G.season || latestRetire.week !== G.week) return false;
        return latestRetire.reason === 'wearInjury' || latestRetire.reason === 'careerEnding';
      });
      if (orphaned.length > 0) {
        const fbRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD2, 0x9));
        const recovered = orphaned.map(f => {
          const history = f.careerRecord?.history || [];
          const latestRetire = [...history].reverse().find(h => h.type === 'retire');
          const route = latestRetire?.reason === 'careerEnding' ? 'injury_career_ending' : 'injury_wear';
          const { line, category } = Engine.retirement.selectLine(f, route, G, fbRng);
          const summary = Engine.retirement.buildCareerSummary(f);
          console.warn('[WM] injury retirement recovered via fallback', { id: f.id, name: f.name, route });
          return { fighter: f, route, line, category, summary };
        });
        pendingInjuryRetirements = [...pendingInjuryRetirements, ...recovered];
      }
    }
    pendingInjuryRetirements.forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // ラストラン引退（引退試合完了後の即引退）
    let pendingLastRunRetirements = G._pendingLastRunRetirements || [];
    if (G._pendingLastRunRetirements) {
      const { _pendingLastRunRetirements: _, ...cleanG } = G;
      G = cleanG;
    }
    try {
      wmDiag('[WM][lastrun-diag] closeShowResult:entry',
        { pendingLastRunCount: pendingLastRunRetirements.length,
          names: pendingLastRunRetirements.map(r => r?.fighter?.name),
          hasPendingR3: !!G._pendingR3Modal,
          r3Reason: G._pendingR3Modal?.reason });
    } catch (_e) {}
    const existingLastRunRetiredIds = new Set(
      pendingLastRunRetirements
        .map(r => r?.fighter?.id)
        .filter(id => id != null)
    );
    const fallbackLastRunFighters = new Map();
    (G.lastShowResults || []).forEach(r => {
      const participantIds = r?.matchType === 'tag'
        ? Object.keys(r?.perFighter || {}).map(Number)
        : [r?.left?.id, r?.right?.id].filter(id => id != null);
      participantIds.forEach(id => {
        if (existingLastRunRetiredIds.has(id) || fallbackLastRunFighters.has(id)) return;
        const fighter = (G.roster || []).find(c => c.id === id && c.lastRun);
        if (fighter) fallbackLastRunFighters.set(id, fighter);
      });
    });
    if (fallbackLastRunFighters.size > 0) {
      const lrLineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD3, 0x2));
      const synthesizedRetirements = [...fallbackLastRunFighters.values()].map(fighter => {
        let retiredFighter = Engine.career.ensure({ ...fighter, lastRun: false, lastRunWeek: null });
        retiredFighter = Engine.career.addEvent(retiredFighter, {
          type: 'retire', reason: 'lastrun', season: G.season, week: G.week, age: retiredFighter.age
        });
        delete retiredFighter.growthLog;
        const { line, category } = Engine.retirement.selectLine(retiredFighter, 'lastrun', G, lrLineRng);
        const summary = Engine.retirement.buildCareerSummary(retiredFighter);
        return { fighter: retiredFighter, route: 'lastrun', line, category, summary, canRetain: false };
      });
      pendingLastRunRetirements = [...pendingLastRunRetirements, ...synthesizedRetirements];
    }
    // ラストラン引退セリフの取りこぼし救済(第3層): processShowResult / fallback の両方で
    // 拾えなかった場合に、retiredFighters の最新 retire イベント (reason='lastrun', 同週)
    // から復元する。これで本人ポップアップがゼロになる事故を防ぐ。
    {
      const queuedIds = new Set(
        pendingLastRunRetirements.map(r => r?.fighter?.id).filter(id => id != null)
      );
      const orphanedLR = (G.retiredFighters || []).filter(f => {
        if (!f || queuedIds.has(f.id)) return false;
        const history = f.careerRecord?.history || [];
        const latestRetire = [...history].reverse().find(h => h.type === 'retire');
        if (!latestRetire) return false;
        if (latestRetire.season !== G.season || latestRetire.week !== G.week) return false;
        return latestRetire.reason === 'lastrun';
      });
      if (orphanedLR.length > 0) {
        const lrFbRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD3, 0xF));
        const recovered = orphanedLR.map(f => {
          const { line, category } = Engine.retirement.selectLine(f, 'lastrun', G, lrFbRng);
          const summary = Engine.retirement.buildCareerSummary(f);
          console.warn('[WM] lastrun retirement recovered via 3rd-tier fallback', { id: f.id, name: f.name });
          return { fighter: f, route: 'lastrun', line, category, summary, canRetain: false };
        });
        pendingLastRunRetirements = [...pendingLastRunRetirements, ...recovered];
      }
    }
    if (pendingLastRunRetirements.length > 0) {
      const lastRunRetiredIds = new Set(
        pendingLastRunRetirements
          .map(r => r?.fighter?.id)
          .filter(id => id != null)
      );
      if (lastRunRetiredIds.size > 0) {
        const retiredById = new Map((G.retiredFighters || []).map(f => [f.id, f]));
        pendingLastRunRetirements.forEach(r => {
          if (r?.fighter?.id != null && !retiredById.has(r.fighter.id)) retiredById.set(r.fighter.id, r.fighter);
        });
        const retiredIds = new Set(G.retiredIds || []);
        lastRunRetiredIds.forEach(id => retiredIds.add(id));
        const retiredSeasons = { ...(G.retiredSeasons || {}) };
        pendingLastRunRetirements.forEach(r => {
          if (r?.fighter?.id != null) retiredSeasons[r.fighter.id] = G.season;
        });
        G = {
          ...G,
          roster: (G.roster || []).filter(c => !lastRunRetiredIds.has(c.id)),
          retiredFighters: [...retiredById.values()],
          retiredIds: [...retiredIds],
          retiredSeasons,
        };
        // 退場者の後始末: 雇用コーチの担当から外す(残すと自己修復 coachAssign_stale_refs_removed が鳴る)
        G = { ...G, coachAssign: Engine.coach.sanitizeAssignments(G) };
        const validated = Engine.title.validateChampion(G);
        if (validated.msg) {
          G = { ...G, titles: validated.titles, gameLog: [...(G.gameLog || []), validated.msg] };
        }
      }
    }
    pendingLastRunRetirements.forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // R3: ファン期待カード試合後リアクション
    const fanExpectResults = (G.lastShowResults || []).filter(r => r.fanExpectMatch);
    let hasEventPopups = false;
    fanExpectResults.forEach((r, i) => {
      const isGood = r.mq >= 55;
      const crowd = isGood ? FAN_EXPECT_REACTIONS.goodCrowd : FAN_EXPECT_REACTIONS.badCrowd;
      const winnerPool = isGood ? FAN_EXPECT_REACTIONS.goodWinner : FAN_EXPECT_REACTIONS.badWinner;
      const crowdText = crowd[Math.floor(Math.random() * crowd.length)];
      const winnerId = r.winner === 'left' ? r.left.id : r.winner === 'right' ? r.right.id : r.left.id;
      const winnerName = r.winner === 'left' ? r.left.name : r.winner === 'right' ? r.right.name : r.left.name;
      const winnerFighter = (G.roster || []).find(c => c.id === winnerId) || ALL_CHARS.find(c => c.id === winnerId);
      const winnerLine = pickDialogueLine(winnerPool, winnerFighter);
      hasEventPopups = true;
      setTimeout(() => showEventPopup({
        type: 'fighter', id: winnerId, name: winnerName,
        tone: isGood ? 'gold' : 'neutral',
        speech: winnerLine,
        detail: `📣 ${crowdText}`,
        autoCloseMs: 2500,
      }), i * 100);
    });

    // v0.96: Show injury popups (only non-retirement injuries)
    const injuries = App._lastInjuries || [];
    injuries.forEach((ir, i) => {
      // v1.3-3: Skip retirement injuries (they get their own popup)
      if (ir.retireType) return;
      const ch = G.roster.find(c => (ir.id != null && c.id === ir.id) || c.name === ir.name);
      if (!ch || !ir.injury) return;
      hasEventPopups = true;
      setTimeout(() => {
        showEventPopup({
          type: 'fighter', id: ch.id, name: ch.name, tone: 'negative',
          speech: getTraitQuote('injury', ch),
          detail: `🏥 ${injuryLabel(ir.injury.type)} — 全治${ir.injury.weeksLeft}週間`,
        });
      }, i * 100);
    });
    App._lastInjuries = [];
    // v1.2: 乱入マッチ結果ポップアップ
    if (App._intrusionData) {
      const id = App._intrusionData;
      const intruderId = id.intruder.id;
      // 乱入選手が王者になっていたら（＝空位化前のchampionIdだった）、王座奪取
      const wasIntruderCrowned = !G.titles?.world?.championId; // 空位＝乱入選手に奪われた
      const popupDelay = injuries.length * 100 + 50;
      hasEventPopups = true;
      if (wasIntruderCrowned) {
        setTimeout(() => showEventPopup({ type:'fighter', id:intruderId, name:id.intruder.name, tone:'negative',
          message: `${id.fromOrgName}の${id.intruder.name}に王座を奪われた…`,
          detail: `王座は空位に。次のタイトルマッチで新王者を決定してください。` }), popupDelay);
      } else {
        setTimeout(() => showEventPopup({ type:'fighter', id:G.titles.world.championId, name:id.champName, tone:'gold',
          message: `乱入者を退けた！`,
          detail: `👑 ${id.champName}が${id.fromOrgName}の${id.intruder.name}を撃破！ 団体人気+2` }), popupDelay);
      }
      App._intrusionData = null;
    }
    // タイトルマッチ後リアクション（勝敗問わず）
    const titleOutcomes = App._lastTitleOutcomes || [];
    App._lastTitleOutcomes = [];
    // 旧来の簡易通知は残さず、後段で専用セレモニーを表示する。
    const _preDefenses = G.titles?.world?.defenses || 0;
    const _preChampId = G.titles?.world?.championId;

    const result = Engine.tickWeek(G);
    // v0.95: Track finances
    const stats = { ...G.seasonStats };
    if (result.state.weeklyFinance) {
      stats.totalRevenue += result.state.weeklyFinance.income || 0;
      stats.totalExpense += result.state.weeklyFinance.expense || 0;
    }
    if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
    if ((result.state.orgPop || 0) > stats.peakPop) stats.peakPop = result.state.orgPop || 0;
    const fh = [...(G.fundsHistory || []), result.state.funds];
    G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
    App.preloadNewspaperImages(G.weeklyNewspaper);

    // 興行終了後にshowCardをリセット（renderShowPrep の pad/trim で会場に応じた枠数に自動調整）
    G = { ...G, showCard: [] };

    // v1.4w: 防衛マイルストーン検出
    const _postDefenses = G.titles?.world?.defenses || 0;
    if (_postDefenses > _preDefenses) {
      const milestone = Engine.news.checkDefenseMilestone(_postDefenses);
      if (milestone > 0) {
        const champ = G.roster.find(c => c.id === G.titles?.world?.championId);
        if (champ) {
          App._pushNewsEvent({ type: 'defenseRecord', characterId: champ.id,
            data: { name: champ.name, org: G.orgName || 'あなたの団体', count: _postDefenses } });
        }
      }
    }
    // v1.4w: ティッカー更新
    App._refreshTicker();

    // v1.2-9: Flavor event popups after show settlement
    const showFlavorEvents = G._flavorEvents || [];
    if (showFlavorEvents.length > 0) {
      showFlavorEvents.forEach((ev, i) => {
        hasEventPopups = true;
        const detail = ev.type === 'magazine' ? `人気 +${ev.popGain}` : `ヒート +${ev.heatGain}`;
        setTimeout(() => showEventPopup({
          type: 'fighter', id: ev.fighterId, name: ev.fighterName,
          tone: 'positive', message: ev.headline, detail
        }), i * 100 + 50);
      });
      const { _flavorEvents, ...cleanG } = G;
      G = cleanG;
    }
    App.checkSurvivalUpdate();
    App.checkCrisisEnteredPopup();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
    // v1.5s25b: 興行後バフ消費 + 週次バフ消費
    App._tickMilestoneBuffsShow();
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();

    // ポップアップ連鎖: eventPopups → 因縁決着 → ブレークスルー/スランプ → 引退
    const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanG } = G;
      G = cleanG;
    }
    const pendingResolutions = App._pendingRivalryResolutions || [];
    App._pendingRivalryResolutions = [];

    // チェーンを逆順に組み立て（retirement ← growth ← resolution ← eventPopups）
    const popupActions = [];
    // 王座結果は通常の通知ではなく、既存の節目イベントと同じ式典シーケンスで見せる。
    titleOutcomes.forEach(outcome => {
      const championId = outcome?.outcome === 'defense' ? outcome.champId : outcome?.newChampId;
      if (championId == null) return;
      popupActions.push(done => {
        if (typeof showTitleMatchCeremony === 'function') showTitleMatchCeremony(outcome, done);
        else if (done) done();
      });
    });
    if (pendingLastRunRetirements.length > 0) {
      popupActions.push(done => showRetirementPopups(pendingLastRunRetirements, done));
    }
    if (pendingInjuryRetirements.length > 0) {
      popupActions.push(done => showRetirementPopups(pendingInjuryRetirements, done));
    }
    if (pendingGrowthEventsShow.length > 0) {
      popupActions.push(done => showGrowthEventPopups(pendingGrowthEventsShow, done));
    }
    if (pendingResolutions.length > 0) {
      popupActions.push(done => showRivalryPopups(pendingResolutions, done));
    }
    // care-rework2 P2-G: 起用約束の結果(履行/破約)を1枚だけ。
    // 判定は上の tickWeek(エンジン側)で済んでおり、ここは表示のみ。
    // 失効は _pendingPledgeResult に載らないので、静かに消えたまま何も出ない。
    if (G._pendingPledgeResult && G._pendingPledgeResult.fighterId != null) {
      const pr = G._pendingPledgeResult;
      G = { ...G }; delete G._pendingPledgeResult;
      const pf = (G.roster || []).find(f => f.id === pr.fighterId);
      if (pf) {
        popupActions.push(done => {
          const kept = pr.outcome === 'kept';
          showDecisionResultModal({
            fighter: pf,
            text: pickPledgeLine(kept ? 'kept' : 'broken', pf),
            changes: [{
              label: '本人の様子', emoji: '💭',
              text: kept
                ? '約束どおり最後の一戦を任され、応えるだけの顔をしている'
                : '約束された場に立てず、その事実を飲み込めずにいる',
            }],
            cost: 0,
            remainingFunds: G.funds,
            icon: '🤝',
            label: kept ? '約束を果たした' : '約束を破った',
            docId: 'pledge',
            reactionTone: null,
          });
          // showDecisionResultModal は done を持たない単発モーダルなので即座に次へ繋ぐ
          if (done) done();
        });
      }
    }
    // R3反応モーダル（bond 75+ 仲間の別れリアクション）は本人引退ポップアップの後に出す。
    // 旧実装は独立 setTimeout(800) で発火していたため、本人ポップアップが遅延すると
    // R3 が先に開いて本人ポップアップが出ない/見落とされる事故が発生していた。
    let pendingR3Spec = null;
    if (G._pendingR3Modal) {
      pendingR3Spec = G._pendingR3Modal;
      const { _pendingR3Modal: _, ...cleanR3Show } = G;
      G = cleanR3Show;
      const r3Fighter = G.roster.find(f => f.id === pendingR3Spec.fighterId);
      const r3Args = {
        fighterId: pendingR3Spec.fighterId,
        fighterName: r3Fighter ? r3Fighter.name : '???',
        fighterFace: r3Fighter ? getPortraitUrl(r3Fighter.id) : null,
        departedName: pendingR3Spec.departedName || '???',
        reason: pendingR3Spec.reason || 'departed',
        line: pendingR3Spec.text,
      };
      popupActions.push(done => {
        showR3Modal(r3Args);
        // showR3Modal は単発モーダルで done コールバックを持たないため、即座に次へ繋ぐ
        if (done) done();
      });
    }
    try {
      wmDiag('[WM][lastrun-diag] closeShowResult:popupActions',
        { actionCount: popupActions.length,
          pendingLastRun: pendingLastRunRetirements.length,
          pendingInjury: pendingInjuryRetirements.length,
          pendingGrowth: pendingGrowthEventsShow.length,
          pendingResolutions: pendingResolutions.length,
          hasR3: !!pendingR3Spec,
          hasEventPopups });
    } catch (_e) {}
    if (popupActions.length > 0) {
      const runPopupActions = () => {
        let idx = 0;
        const runNext = () => {
          const action = popupActions[idx++];
          if (action) action(runNext);
        };
        runNext();
      };
      // 直列化(2026-08-13): hasEventPopups に関わらず常にキュー連動で開始する。
      // 旧実装の setTimeout(runPopupActions, 200) は、フラグモーダル等が同じ週に
      // イベントキューへ積まれていても 200ms 後に盲目的に発火し、モーダルが重なっていた。
      // _chainEventPopupQueueEmpty はキューが空でも 200ms 後の再検証を挟むので、
      // 空のときの実効タイミングは旧実装と同じ(進行は止まらない)。
      _chainEventPopupQueueEmpty(runPopupActions);
    }

    // relationship-flags-spec-v1.0 §4: 試合発火系の関係性フラグモーダル
    // Common-3 派閥加入通知（興行後に発生したものも消化）
    // §6 アーキタイプ遷移ナレーション（F02 完全敗北など興行後に発生する）
    // **3系統とも同期で開かない(2026-08-13)。** この後の advanceFromWeekSummary →
    // dismissAllPopups が同 tick で走り、同期表示した分(特にフラグモーダルの C3 キュー)は
    // 表示前に消えていた。タイマーに載せて全消去の後で開き、共有ゲートで直列化させる。
    setTimeout(() => {
      if (typeof _drainFlagModalQueue === 'function') _drainFlagModalQueue();
      App._drainFactionJoinNotices();
      App._drainArchetypeTransitions();
    }, 0);

    // スナップショット R3モーダルは popupActions チェーン内（本人引退ポップアップの後）に
    // 組み込み済みのため、ここでは別経路の setTimeout 発火はしない。

    // P4-P6: Glimpse（心の垣間見え）表示（興行後）
    if (G._pendingGlimpseA || G._pendingGlimpseB) {
      const gA = G._pendingGlimpseA || null;
      const gB = G._pendingGlimpseB || null;
      if (G._pendingGlimpseA) { const { _pendingGlimpseA: _, ...c } = G; G = c; }
      if (G._pendingGlimpseB) { const { _pendingGlimpseB: _, ...c } = G; G = c; }
      const allGlimpses = [...(gA || []), ...(gB || [])];
      let tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
      const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
      const shownSignatures = inlinePreview?.shownSignatures;
      if (shownSignatures && shownSignatures.size > 0) {
        tier1 = tier1.filter(g => !shownSignatures.has(App._glimpseSignature(g)));
      }
      if (tier2.length > 0) {
        G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
      }
      if (tier1.length > 0) {
        setTimeout(() => {
          if (App._glimpseCascadeShownThisShow) return;
          App._glimpseCascadeShownThisShow = true;
          showGlimpseCascade(tier1);
        }, 900);
      }
    }

    // MQ再設計P4 §5.3: 大ニュース週頭通知（他のポップアップの後に鳴らす）
    App._maybeShowBigNewsPopup(1200);

    // 週次処理と次週遷移は1クリック内で完結させる(processWeek と同じ形)。
    //
    // **task-48(b33519b)の取りこぼし。** あの修正で _tryAutoAdvance は「常に true を返し、
    // 描画は一切しない」形になり、呼び出し側が続けて advanceFromWeekSummary() を
    // 呼ぶ契約に変わった。processWeek 側だけ直され、ここは旧来の
    // `if (App._tryAutoAdvance()) return;` が残っていたため、**毎週の興行結果を
    // 閉じるたびに状態だけ weekSummary へ進んで画面が前のまま**になっていた。
    // プレイヤーには「閉じても何も起きない」ように見え、別タブへ移って戻る、
    // あるいはもう一度押す、で初めて先へ進めた(2026-07-31 Keisuke 報告)。
    if (App._tryAutoAdvance()) {
      App.advanceFromWeekSummary();
      return;
    }
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
    } catch(e) {
      console.error('closeShowResult error:', e);
      // 進行不具合復旧: weekPhase が 'showExec' のまま残ると 今週/興行準備 タブが
      // 空になり、ユーザーが翌週へ進めなくなる（引退試合後に発生報告あり）。
      // tickWeek を再試行し、ダメなら最低限 manage 相当へ落として復旧させる。
      try {
        if (G && G.weekPhase === 'showExec') {
          try {
            const _recovery = Engine.tickWeek(G);
            G = { ..._recovery.state, gameLog: [...(G.gameLog || []), ...(_recovery.events || [])] };
          } catch (_tickErr) {
            console.error('closeShowResult recovery tickWeek failed:', _tickErr);
            // 最終フォールバック: 興行結果を破棄して manage に戻す
            G = { ...G, weekPhase: 'manage', lastShowResults: [],
                  weeklyFinance: { income: 0, expense: 0, details: [] } };
          }
          try { Storage.autoSave(); } catch (_e) {}
          try { showToast('⚠️ 興行後の処理で問題が発生しました。状態を復元しました。', 6000); } catch (_e) {}
        }
      } catch (_recovErr) {
        console.error('closeShowResult recovery itself failed:', _recovErr);
      }
      try { showScreen('week'); } catch(e2) {}
      try { refreshAll(); } catch(e2) {}
    } finally {
      App._closingShowResult = false;
    }
  },

  // v1.4w: ティッカーニュース再生成（manage画面表示用）
  _refreshTicker() {
    if (!G || G.offSeason) return;
    const tickerRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBEEF));
    G = { ...G, _tickerItems: Engine.news.generateTicker(tickerRng, G) };
  },

  // 業界ニュースを新聞へ積む（2026-07-27 に旧「新聞パネル」から移管）。
  //
  // もとは _newsEvents という独立キューに溜め、小さなポップアップ(showNewspaperPanel)で
  // 1回だけ見せて **state から消していた**。そのため
  //   ・大ニュースも普段の記事も同じ「📰 業界ニュース」の小箱で、見分けがつかない
  //   ・オーバーレイの外側を1回押すと、何枚積まれていても全部まとめて閉じる
  //   ・閉じた記事はどこにも残らない（新聞のバックナンバーにも入らない）
  // という状態だった。実測でシーズン境界に4本がこの経路で消えていた。
  //
  // 新聞側のキュー(_industryNewsEvents)はイベント形状もテンプレート(NEWS_HEADLINE_TEMPLATES)も
  // 同じなので、積み先を替えるだけで紙面に載り、バックナンバーにも残る。
  _pushNewsEvent(ev) {
    if (!ev || !ev.type) return;
    G = Engine.industryNews.push(G, ev);
  },

  // MQ再設計P4 §5.3: 大ニュース週頭通知（号外PU+ピロりん）。
  // weeklyNewspaper.isBigNews な週かつ同週内で未通知の場合のみ1回だけ発火する。
  // _isPopupActive/_popupQueue パターンに乗る showBigNewsPopup 側が他ポップアップとの
  // 順序調整を担うため、ここでは「その週にもう鳴らしたか」だけを見る。
  _maybeShowBigNewsPopup(delay) {
    const wp = G && G.weeklyNewspaper;
    if (!wp || !wp.topStory) return;
    // シーズン開幕号（2026-07-27）。オフシーズン中は新聞が出ないので、引退・殿堂入り・
    // 他団体の動きは溜まったまま翌シーズン第1週の号にまとめて載る。以前はこれを
    // 小さな「業界ニュース」パネルで1回だけ見せて捨てていたため、外側を1回押すだけで
    // 全部消えていた。いまは紙面に載るので、ここでは**1枚あることだけ**を知らせる。
    const isSeasonOpening = !G.offSeason && G.week === 1 && (G.season || 1) > 1;
    if (!wp.isBigNews && !isSeasonOpening) return;
    const weekKey = `${G.season}:${G.week}`;
    if (G._bigNewsNotifiedWeek === weekKey) return;
    G = { ...G, _bigNewsNotifiedWeek: weekKey, _bigNewsUnread: true };
    setTimeout(() => {
      Audio.play('bignews');
      if (typeof showBigNewsPopup !== 'function') return;
      // 大ニュースの週は従来どおりその記事のリードを出す。大ニュースでない開幕号は
      // 開幕号専用の文言にする（同じ号外フレームを使い、見た目は揃える）。
      // 大ニュースは一面トップとは限らない(天頂戦優勝のほうが上に来る週がある)。
      // 号に載っている大ニュース記事を generate が bigNewsStory で指しているのでそれを使う。
      // 旧号は持たないので topStory へ落ちる
      showBigNewsPopup(wp.bigNewsStory || wp.topStory, (!wp.isBigNews && isSeasonOpening) ? 'seasonOpening' : null);
    }, delay != null ? delay : 200);
  },

  // Common-3: 派閥加入通知キューを順次表示
  _drainFactionJoinNotices() {
    if (!G || !G._pendingFactionJoinNotices || !G._pendingFactionJoinNotices.length) return;
    if (typeof showFactionCommon3Modal !== 'function') {
      G = { ...G, _pendingFactionJoinNotices: [] };
      return;
    }
    const queue = [...G._pendingFactionJoinNotices];
    const { _pendingFactionJoinNotices: _, ...rest } = G;
    G = rest;
    const next = () => {
      const head = queue.shift();
      if (!head) return;
      showFactionCommon3Modal(head, G, next);
    };
    next();
  },

  // §6 アーキタイプ遷移ナレーションキューを順次表示
  _drainArchetypeTransitions() {
    if (!G || !G._pendingArchetypeTransitions || !G._pendingArchetypeTransitions.length) return;
    if (typeof showFactionArchetypeTransitionModal !== 'function') {
      G = { ...G, _pendingArchetypeTransitions: [] };
      return;
    }
    const queue = [...G._pendingArchetypeTransitions];
    const { _pendingArchetypeTransitions: _, ...rest } = G;
    G = rest;
    const next = () => {
      const head = queue.shift();
      if (!head) return;
      showFactionArchetypeTransitionModal(head, G, next);
    };
    next();
  },

  // firing-grudge-spec-v0.1 Phase 5: 解雇キャラ vs 元雇用団体専用セリフを iframe に配信。
  // grudge.vsOrgId が opponentOrgId と一致 & intensity ≥ 60 & 解雇から 24 週以内 で発動。
  // opponentOrgId 省略時は player 戦としてフォールバック。
  _vsExEmployeeFires(fighter, season, week, opponentOrgId) {
    if (!fighter || !fighter.grudge) return false;
    const g = fighter.grudge;
    const oppOrg = opponentOrgId != null ? opponentOrgId : 'player';
    if (g.vsOrgId !== oppOrg) return false;
    if (!g.intensity || g.intensity < 60) return false;
    const nowAbs = (season - 1) * 20 + (week || 1);
    const firedAbs = ((g.issuedSeason || 1) - 1) * 20 + (g.issuedWeek || 1);
    if (nowAbs - firedAbs > 24 || nowAbs - firedAbs < 0) return false;
    if (typeof VS_EX_EMPLOYER_LINES === 'undefined') return false;
    return true;
  },

  // 通常の VICTORY_LINES の前段に VS_EX_EMPLOYER_LINES[archetype][personality].win を prepend して引きやすくする。
  _buildVlVsPlayerForExEmployee(fighter, season, week, opponentOrgId) {
    const baseVl = (fighter && (fighter.voiceLines || fighter.vl))
      || (typeof VICTORY_LINES !== 'undefined' && fighter && VICTORY_LINES[fighter.id])
      || ['…！'];
    if (!App._vsExEmployeeFires(fighter, season, week, opponentOrgId)) return baseVl;
    const pers = fighter.personality || 'normal';
    const arch = fighter.archetype || 'standard';
    const byA = VS_EX_EMPLOYER_LINES[arch] || {};
    const byStd = VS_EX_EMPLOYER_LINES.standard || {};
    const byP = byA[pers] || byA.normal || byStd[pers] || byStd.normal || {};
    const winArr = byP.win || [];
    if (winArr.length === 0) return baseVl;
    return [...winArr, ...baseVl];
  },

  // 被弾セリフ（hit）配列を返す。条件不成立なら null を返す。iframe 側 tryDamageLine が拾う。
  _buildVsExHitLines(fighter, season, week, opponentOrgId) {
    if (!App._vsExEmployeeFires(fighter, season, week, opponentOrgId)) return null;
    const pers = fighter.personality || 'normal';
    const arch = fighter.archetype || 'standard';
    const byA = VS_EX_EMPLOYER_LINES[arch] || {};
    const byStd = VS_EX_EMPLOYER_LINES.standard || {};
    const byP = byA[pers] || byA.normal || byStd[pers] || byStd.normal || {};
    const hitArr = byP.hit || [];
    return hitArr.length > 0 ? hitArr : null;
  },

  // 業界ニュースキューに追加（毎週の新聞画面・業界ニュース欄に流れる）
  _pushIndustryNews(ev) {
    if (!ev || !ev.type) return;
    G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ev] };
  },

  // challenge-request-spec-v0.1 Phase 3: 試合結果を h2h / career / 業界ニュースに反映
  // forward: teamA = player roster / teamB = AI org roster
  // inverse: teamA = AI org (grudge保持) roster / teamB = player roster
  // firing-grudge-spec-v0.1 タスクc(2026-07-17): grudge.vsOrgId 保持者が「元雇用主」org と対戦した際に
  // firedReturn ニュースを発信する共有ヘルパー(1名分の純関数、state を返す)。
  // 元は _applyChallengeRequestResult 内の _emitFiredReturn に埋め込まれていたが、
  // B-3元同僚初対戦(通常興行/対抗戦/PPV)・奪還挑戦の結果パスでも使うため独立関数化。
  // fighter: 判定対象キャラ / foeOrgId: 対戦相手側の現在org id / sideOrgId: fighter自身の現在org id
  // 条件: grudge.intensity>=60 かつ 解雇から24週以内(spec §3.2)
  _maybeEmitFiredReturn(state, fighter, foeOrgId, sideOrgId) {
    const g = fighter && fighter.grudge;
    if (!g || !g.vsOrgId || g.vsOrgId !== foeOrgId) return state;
    if (!g.intensity || g.intensity < 60) return state;
    const nowAbs = Engine.util && Engine.util.absWeek
      ? Engine.util.absWeek(state.season, state.week)
      : ((state.season - 1) * 20 + state.week);
    const firedAbs = ((g.issuedSeason || 1) - 1) * 20 + (g.issuedWeek || 1);
    const weeksSinceFired = nowAbs - firedAbs;
    if (weeksSinceFired > 24 || weeksSinceFired < 0) return state;
    const _orgNameOf = (orgId) => {
      if (orgId === 'player') return state.orgName || 'プレイヤー団体';
      const cfg = (typeof RIVAL_ORGS !== 'undefined') ? RIVAL_ORGS.find(o => o.id === orgId) : null;
      return (cfg && cfg.name) || '元所属団体';
    };
    return Engine.industryNews.push(state, {
      type: 'firedReturn',
      characterId: fighter.id,
      data: {
        name: fighter.name,
        ourOrg: _orgNameOf(g.vsOrgId),   // 解雇した側＝grudge対象
        toOrg: _orgNameOf(sideOrgId),     // 現所属
        weeksSinceFired: String(weeksSinceFired),
      },
    });
  },

  _applyChallengeRequestResult(state, card, result) {
    let s = { ...state };
    const isInverse = !!card.isInverse;
    const requesterOrgId = card.requesterOrgId || (isInverse ? card.requesterOrgId : 'player');
    const opponentOrgId = card.opponentOrgId || (isInverse ? 'player' : card.otherOrgId);

    // h2h 更新（3 ペア）
    let h2h = { ...(s.h2h || {}) };
    for (let i = 0; i < 3; i++) {
      const m = result.matches[i];
      h2h = Engine.h2h.update(
        h2h,
        m.fighterA.id, m.fighterB.id,
        m.winner, m.mq,
        false, false,
        s.season, s.week,
        'show',
        requesterOrgId, opponentOrgId,
        null
      );
    }
    s = { ...s, h2h };

    const teamWinSide = result.teamWin; // 'A' | 'B' | 'draw'
    const teamResultForA = teamWinSide === 'A' ? 'win' : (teamWinSide === 'B' ? 'lose' : 'draw');
    const teamResultForB = teamWinSide === 'B' ? 'win' : (teamWinSide === 'A' ? 'lose' : 'draw');

    // helper: ロスターから teamA / teamB のキャラを更新
    const _updateRoster = (rosterArr, teamSide /* 'A' | 'B' */) => rosterArr.map(f => {
      const team = teamSide === 'A' ? card.teamA : card.teamB;
      const oppTeam = teamSide === 'A' ? card.teamB : card.teamA;
      const oppOrg = teamSide === 'A' ? opponentOrgId : requesterOrgId;
      const tr = teamSide === 'A' ? teamResultForA : teamResultForB;
      const score = teamSide === 'A' ? `${result.winsA}-${result.winsB}` : `${result.winsB}-${result.winsA}`;
      for (let i = 0; i < 3; i++) {
        if (team[i].id === f.id) {
          const m = result.matches[i];
          const won = teamSide === 'A' ? m.winner === 'left' : m.winner === 'right';
          return Engine.career.addEvent(f, {
            type: 'challenge_request_match',
            season: s.season, week: s.week,
            opponentName: oppTeam[i].name,
            opponentOrg: oppOrg,
            won,
            matchType: 'team3v3',
            teamResult: tr,
            teamScore: score,
            isRequester: f.id === card.requesterId,
            isInverse,
          });
        }
      }
      return f;
    });

    // 打診者陣ロスター更新
    if (isInverse) {
      // 打診者陣 = AI org
      const aiOrgs = { ...(s.aiOrgs || {}) };
      if (aiOrgs[requesterOrgId] && Array.isArray(aiOrgs[requesterOrgId].roster)) {
        aiOrgs[requesterOrgId] = { ...aiOrgs[requesterOrgId], roster: _updateRoster(aiOrgs[requesterOrgId].roster, 'A') };
        s = { ...s, aiOrgs };
      }
      // 相手陣 = player roster
      s = { ...s, roster: _updateRoster(s.roster || [], 'B') };
    } else {
      // 打診者陣 = player roster
      s = { ...s, roster: _updateRoster(s.roster || [], 'A') };
      // 相手陣 = AI org
      const aiOrgs = { ...(s.aiOrgs || {}) };
      if (aiOrgs[opponentOrgId] && Array.isArray(aiOrgs[opponentOrgId].roster)) {
        aiOrgs[opponentOrgId] = { ...aiOrgs[opponentOrgId], roster: _updateRoster(aiOrgs[opponentOrgId].roster, 'B') };
        s = { ...s, aiOrgs };
      }
    }

    // 業界ニュース（プレイヤー視点で勝/敗/分を判定。score は常に「ourOrg-opponentOrg」表記に揃える）
    const ourOrgLabel = s.orgName || 'プレイヤー団体';
    let newsType, scoreStr;
    if (isInverse) {
      // inverse: 打診者=AI、相手=player。player の勝敗は teamWin === 'B'
      newsType = teamWinSide === 'B' ? 'challengeRequestInverseDefend'
        : teamWinSide === 'A' ? 'challengeRequestInverseFall'
        : 'challengeRequestInverseDraw';
      scoreStr = `${result.winsB}-${result.winsA}`;
    } else {
      newsType = teamWinSide === 'A' ? 'challengeRequestWin'
        : teamWinSide === 'B' ? 'challengeRequestLose'
        : 'challengeRequestDraw';
      scoreStr = `${result.winsA}-${result.winsB}`;
    }
    s = Engine.industryNews.push(s, {
      type: newsType,
      characterId: card.requesterId,
      data: {
        requesterName: card.teamA[0].name,
        opponentName: card.teamB[0].name,
        opponentOrg: isInverse ? card.requesterOrgName : card.otherOrgName,
        ourOrg: ourOrgLabel,
        score: scoreStr,
      },
    });

    // firing-grudge-spec-v0.1 Phase 4: 各陣に grudge.vsOrgId が相手陣 org と一致するキャラが居れば
    // firedReturn ニュースを追加発信（intensity≥60 / 解雇から24週以内）。判定は共有ヘルパー _maybeEmitFiredReturn に集約(タスクc 2026-07-17)。
    const _emitFiredReturnForLineup = (lineupArr, sideOrgId, foeOrgId) => {
      if (!Array.isArray(lineupArr)) return;
      for (const fighter of lineupArr) s = App._maybeEmitFiredReturn(s, fighter, foeOrgId, sideOrgId);
    };
    _emitFiredReturnForLineup(card.teamA, requesterOrgId, opponentOrgId);
    _emitFiredReturnForLineup(card.teamB, opponentOrgId, requesterOrgId);

    const coachLine = _challengeRequestCoachLogLine(s, card, result);
    if (coachLine) s = { ...s, gameLog: [...(s.gameLog || []), coachLine] };

    return s;
  },

  // h2h.history に積む meta フラグを構築（B-3 / 派閥抗争 / ロッカー荒廃 / 奪還）
  _buildMatchMeta(state, idA, idB, isReclaim) {
    const meta = {};
    // betrayal: B-3 元同僚 離脱後初対面
    if (Engine.orgTimeline && typeof Engine.orgTimeline.checkFirstMeetSinceDeparture === 'function') {
      try { if (Engine.orgTimeline.checkFirstMeetSinceDeparture(state, idA, idB)) meta.betrayal = true; } catch (_) {}
    }
    // factionWar: 同団体内で別派閥所属、両派閥が hostility 状態
    if (Engine.factions && typeof Engine.factions.getFactionByFighterId === 'function') {
      try {
        const fA = Engine.factions.getFactionByFighterId(state, idA);
        const fB = Engine.factions.getFactionByFighterId(state, idB);
        if (fA && fB && fA.id !== fB.id && (fA.inHostility || fB.inHostility)) {
          meta.factionWar = true;
        }
      } catch (_) {}
    }
    // lockerStress: _lockerCrisisWeek が直近4週以内
    if (state._lockerCrisisWeek != null && Engine.util && typeof Engine.util.absWeek === 'function') {
      const aw = Engine.util.absWeek(state.season, state.week);
      if (aw - state._lockerCrisisWeek <= 4) meta.lockerStress = true;
    }
    // reclaim: 奪還挑戦試合
    if (isReclaim) meta.reclaim = true;
    return meta;
  },

  // 業界ニュースはポップアップで見せずに新聞へ流す（2026-07-27）。
  // ここでは何も表示しない。溜まった記事は次に発行される号（オフシーズン中は新聞が
  // 出ないので、翌シーズン第1週の号）に載り、バックナンバーにも残る。
  // 旧セーブに残っている _newsEvents は新聞側のキューへ移してから捨てる。
  _showNewsPanelIfNeeded(callback) {
    const legacy = G._newsEvents || [];
    if (legacy.length > 0) {
      const { _newsEvents: _, ...cleanG } = G;
      G = cleanG;
      legacy.forEach(ev => { if (ev && ev.type) G = Engine.industryNews.push(G, ev); });
    }
    callback();
  },

  // 週次精算を記録して、同じクリック内で次週へ遷移するための準備をする。
  // `weekSummary` は advanceFromWeekSummary の入力契約としてだけ使う。一度画面に
  // 描画してから次のクリックを要求すると、1週に2クリック必要になってしまう。
  _tryAutoAdvance() {
    // 財務タブリデザイン: financeHistory に週次決算を永続蓄積
    const newHistory = [...(G.financeHistory || [])];
    newHistory.push({
      season: G.season,
      week: G.week,
      income: G.weeklyFinance.income || 0,
      expense: G.weeklyFinance.expense || 0,
      details: [...(G.weeklyFinance.details || [])],
      funds: G.funds,
    });
    // 月末を含め、tickWeek が完了した週は必ず同じ経路で一度だけ次週へ進める。
    // 決算そのものは tickWeek 内で完了しており、ここで止めるとクリック回数だけが
    // 増えていた。weekSummary は既存セーブ/ボタンとの後方互換のため維持する。
    G = { ...G, financeHistory: newHistory, weekPhase: 'weekSummary' };
    return true;
  },

  // tickWeek 完了後の次週遷移。旧セーブの weekSummary ボタンからもここへ入る。
  advanceFromWeekSummary() {
    if (App._guardAwardsStage?.('advanceFromWeekSummary')) return false;
    // この関数はサマリー完了状態だけを消費する。インライン onclick の重複発火や
    // 二重クリックで、第48週の PPV 専用 phase をもう一度 advanceWeek へ渡さない。
    if (G.weekPhase !== 'weekSummary') {
      console.warn('[WM][week-advance] ignored stale summary handler', {
        season: G.season, week: G.week, weekPhase: G.weekPhase,
      });
      return false;
    }
    const before = { season: G.season, week: G.week, weekPhase: G.weekPhase };
    Audio.play('tick');
    dismissAllPopups(); // 残存ポップアップを強制クリア
    if (App.repairProgressionState('advanceFromWeekSummary')) {
      try { Storage.autoSave(); } catch (_e) {}
    }
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    console.info('[WM][week-advance] summary handler advanced exactly once', {
      from: before,
      to: { season: G.season, week: G.week, weekPhase: G.weekPhase, offSeason: !!G.offSeason },
    });
    // ── 体験版シーズンゲート ──
    if (G._trialEnd) {
      const { _trialEnd: _, ...cleanG } = G;
      G = cleanG;
      Storage.autoSave();
      showTrialEndMessage();
      refreshAll();
      return true;
    }
    // 契約更新交渉フェーズ
    if (G.weekPhase === 'contractNegotiation') {
      Storage.autoSave();
      App.handleContractNegotiations();
      return true;
    }
    if (App._shouldStartTenchosenReplay?.()) {
      Storage.autoSave();
      App.initTenchosenReplay();
      return true;
    }
    // PPVフェーズ
    if (G.weekPhase === 'ppvShow') {
      Storage.autoSave();
      App.initPPVShow();
      return true;
    }
    if (G.weekPhase === 'ppvTV') {
      Storage.autoSave();
      App.initPPVTV();
      return true;
    }
    // 秋4団体戦 Week36: 結果確定前のリプレイを自動起動
    if (G._pendingAutumnWarReplay) {
      Storage.autoSave();
      App.initAutumnWarReplay();
      return true;
    }
    // C-6 天頂戦 Week48: 結果はEngine.advanceWeek内で確定済み。リプレイ演出を自動起動
    if (App._shouldStartTenchosenReplay()) {
      Storage.autoSave();
      App.initTenchosenReplay();
      return true;
    }
    // S8 春のタッグリーグ Week12: 結果はEngine.advanceWeek内で確定済み。リプレイ演出を自動起動
    if (G._pendingSpringTagLeagueReplay && App._shouldStartSpringTagLeagueReplay()) {
      Storage.autoSave();
      App.initSpringTagLeagueReplay();
      return true;
    }
    App._discardStaleSpringTagLeagueReplay();
    App.checkSurvivalUpdate();
    App.checkCrisisEnteredPopup();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
    App.checkTenchosenPreEvent();
    App.checkUnifiedTitlePresentation();
    sessionRng = Engine.rng.create(G.rngSeed);
    App._refreshTicker();
    Storage.autoSave();
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
    // orgPop リバランス v1.1 §7: シーズン開始時のorgPop変動通知
    if (G._pendingSeasonStartNotif) {
      const notif = G._pendingSeasonStartNotif;
      const { _pendingSeasonStartNotif: _, ...cleanG } = G;
      G = cleanG;
      if (notif.decay > 0) {
        const nowPop = Math.round(notif.nowPop * 10) / 10;
        setTimeout(() => showToast(`📣 オフシーズンで団体人気が -${notif.decay} 減衰しました（現在: ${nowPop}）`, 6000), 800);
      }
    }
    return true;
  },

  // Process a week (manage + settle) via tickWeek
  // A-3: おまかせ育成 — 方針を維持しつつ体調80未満を休養に切り替え。強化ON/OFFは触らない
  autoManage() {
    if (G.weekPhase !== 'manage') return;
    Audio.play('select');
    const roster = G.roster.map(c => {
      if (c.injury || c.isRental || c.forcedRest) return c;
      const policy = c.schedule || 'balance';
      if (c.condition < 80) {
        return { ...c, schedule: 'rest', intensive: false };
      }
      // condition >= 80: rest 方針なら balance に切り替え、それ以外は維持。intensive は現状維持
      const nextPolicy = policy === 'rest' ? 'balance' : policy;
      return { ...c, schedule: nextPolicy };
    });
    G = { ...G, roster };
    refreshAll();
  },

  processWeek() {
    if (App._guardAwardsStage?.('processWeek')) return false;
    Audio.play('tick');
    dismissAllPopups(); // 前週の残存ポップアップを強制クリア
    // 今週のログフィードをリセット（前週分クリア）
    G = { ...G, weekLogFeed: [] };
    const oldRoster = G.roster.map(c => ({ id: c.id, injured: !!c.injury }));
    const result = Engine.tickWeek(G);
    const stats = { ...G.seasonStats };
    if (result.state.weeklyFinance) {
      stats.totalRevenue += result.state.weeklyFinance.income || 0;
      stats.totalExpense += result.state.weeklyFinance.expense || 0;
    }
    if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
    if ((result.state.orgPop || 0) > stats.peakPop) stats.peakPop = result.state.orgPop || 0;
    const fh = [...(G.fundsHistory || []), result.state.funds];
    G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
    App.preloadNewspaperImages(G.weeklyNewspaper);
    // bankruptcy-redesign v1.1: ゲームオーバー判定（autoSave せず解散セレモニーへ）
    if (G.weekPhase === 'gameover') {
      const data = Engine.ending.buildGameOverData(G);
      showGameOverCeremony(data, () => { try { App.showTitleScreen(); } catch(e) {} });
      return;
    }
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
    // v1.5s25b: 週次バフ消費（weekly_funds適用含む）
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();
    // v1.4w: ティッカー更新
    App._refreshTicker();
    // relationship-flags-spec-v1.0 §4: 関係性フラグモーダルを順次 popup に流す
    // Common-3 派閥加入通知 / §6 アーキタイプ遷移ナレーション（F07 rebuke 4 累積など）
    // care-rework v0.1 §3.4 P4: 招聘の過程イベント（中間報告/衝突/延長打診/卒業レポート）
    // **4系統とも同期で開かない(2026-08-13)。** processWeek も末尾で
    // advanceFromWeekSummary → dismissAllPopups が同 tick で走るため、同期表示分
    // (特にフラグモーダルの C3 キュー)は表示前に消えていた。closeShowResult と同じ扱い。
    setTimeout(() => {
      if (typeof _drainFlagModalQueue === 'function') _drainFlagModalQueue();
      App._drainFactionJoinNotices();
      App._drainArchetypeTransitions();
      App._drainInviteEvents();
    }, 0);
    // v0.96: Detect new injuries and show popups
    const newInjuries = G.roster.filter(c => c.injury && !oldRoster.find(o => o.id === c.id)?.injured);
    newInjuries.forEach((c, i) => {
      setTimeout(() => showEventPopup({ type:'fighter', id:c.id, name:c.name, tone:'negative',
        speech: getTraitQuote('injury', c), detail:`🏥 ${injuryLabel(c.injury.type)} — 全治${c.injury.weeksLeft}週間` }), i * 100);
    });
    // v1.2-9: Flavor event popups (雑誌取材・TV出演)
    const flavorEvents = G._flavorEvents || [];
    if (flavorEvents.length > 0) {
      const baseDelay = newInjuries.length * 100 + 50;
      flavorEvents.forEach((ev, i) => {
        const tone = ev.type === 'magazine' ? 'positive' : 'positive';
        const detail = ev.type === 'magazine'
          ? `人気 +${ev.popGain}`
          : `ヒート +${ev.heatGain}`;
        setTimeout(() => showEventPopup({
          type: 'fighter', id: ev.fighterId, name: ev.fighterName,
          tone, message: ev.headline, detail
        }), baseDelay + i * 100);
      });
      // Clean up transient field
      const { _flavorEvents, ...cleanState } = G;
      G = cleanState;
    }
    // v1.8: 週次成長イベント（スランプ発生/回復・モチベ喪失）ポップアップ
    const weekGrowthEvents = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanGe } = G;
      G = cleanGe;
    }
    // 自主引退処理（モチベ喪失24週超え）
    let motivRetirements = G._pendingMotivationRetirements || [];
    if (G._pendingMotivationRetirements) {
      const { _pendingMotivationRetirements: _, ...cleanMr } = G;
      G = cleanMr;
    }
    try {
      wmDiag('[WM][motiv-retire-diag] entry',
        { count: motivRetirements.length,
          ids: motivRetirements.map(r => r?.fighterId),
          season: G.season, week: G.week });
    } catch (_e) {}
    // モチベ喪失引退セリフの取りこぼし救済: lookup 失敗・transient 欠落で
    // _pendingMotivationRetirements に載らなかった「今週のモチベ喪失引退者」を
    // retiredFighters の最新 retire イベントから復元する。本人は既に roster から
    // 抜けて retiredFighters に入っているので、_recoveredFighter で直接渡す。
    {
      const queuedIds = new Set(
        motivRetirements.map(r => r?.fighterId).filter(id => id != null)
      );
      const orphanedMR = (G.retiredFighters || []).filter(f => {
        if (!f || queuedIds.has(f.id)) return false;
        const history = f.careerRecord?.history || [];
        const latestRetire = [...history].reverse().find(h => h.type === 'retire');
        if (!latestRetire) return false;
        if (latestRetire.season !== G.season) return false;
        // motivation 引退の history は week が省略されているケースがあるので、
        // week 一致は緩めに扱う（同シーズン+reason一致で同定）
        return latestRetire.reason === 'motivation';
      });
      if (orphanedMR.length > 0) {
        orphanedMR.forEach(f => {
          console.warn('[WM] motivation retirement recovered via fallback', { id: f.id, name: f.name });
          motivRetirements = [...motivRetirements, { fighterId: f.id, _recoveredFighter: f }];
        });
      }
    }
    if (motivRetirements.length > 0) {
      motivRetirements.forEach(r => {
        if (r._recoveredFighter) {
          // フォールバック復元ルート: 既に retiredFighters に入っているので
          // セリフ生成と showRetirementPopups だけ走らせる
          const recF = r._recoveredFighter;
          const lineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xAA18, recF.id));
          const { line } = Engine.retirement.selectLine(recF, 'motivation', G, lineRng);
          const summary = Engine.retirement.buildCareerSummary(recF);
          const delay = (newInjuries.length + flavorEvents.length) * 100 + 200;
          wmDiag('[WM][motiv-retire-diag] firing recovered showRetirementPopups', { id: recF.id, name: recF.name });
          setTimeout(() => showRetirementPopups([{ fighter: recF, route: 'motivation', line, summary }]), delay);
          return;
        }
        const f = G.roster.find(c => c.id === r.fighterId);
        if (!f) return;
        const lineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xAA18, f.id));
        const { line } = Engine.retirement.selectLine(f, 'motivation', G, lineRng);
        const summary = Engine.retirement.buildCareerSummary(f);
        const retiredF = Engine.career.addEvent(Engine.career.ensure(f), { type: 'retire', reason: 'motivation', season: G.season, age: f.age });
        delete retiredF.growthLog;
        G = { ...G,
          roster: G.roster.filter(c => c.id !== f.id),
          retiredFighters: [...(G.retiredFighters || []), retiredF],
          // 退場者の後始末: コーチ担当から外す(engine側モチベ喪失パスと同じ扱い)
          coachAssign: Engine.coach.unassignFromCoach(G, f.id),
        };
        // 団体年代記: アーカイブ + 気風寄与
        G = Engine.chronicle.archiveFighter(G, retiredF);
        G = Engine.chronicle.applySpiritContribution(G, retiredF);
        G = Engine.chronicle.refreshChapters(G);
        // 王者がモチベ喪失引退した場合は王座を空位にする
        const vcMR = Engine.title.validateChampion(G);
        if (vcMR.msg) { G = { ...G, titles: vcMR.titles, gameLog: [...(G.gameLog || []), vcMR.msg] }; }
        G = archiveRetiredRivalryState(G, retiredF);
        // §2.3: 引退者の関係値を凍結
        if (G.relationships) G = Engine.relationships.freezeRelationships(G, f.id);
        const delay = (newInjuries.length + flavorEvents.length) * 100 + 200;
        wmDiag('[WM][motiv-retire-diag] firing showRetirementPopups', { id: retiredF.id, name: retiredF.name });
        setTimeout(() => showRetirementPopups([{ fighter: retiredF, route: 'motivation', line, summary }]), delay);
      });
    }
    if (weekGrowthEvents.length > 0) {
      const baseDelay = (newInjuries.length + flavorEvents.length) * 100 + 100;
      setTimeout(() => showGrowthEventPopups(weekGrowthEvents), baseDelay);
    }

    // 社長室 Phase 7: trainer/camp の信頼度遅延発現ミニ通知 (1件/週)
    // camp は全員分の reveal が同週に発生するため、perWeekDelta 降順で1件だけピック
    // (スポットライトは巡る原則)
    const weekTrustReveals = G._pendingTrustReveals || [];
    if (G._pendingTrustReveals) {
      const { _pendingTrustReveals: _, ...cleanTr } = G;
      G = cleanTr;
    }
    if (weekTrustReveals.length > 0) {
      // care-rework2 P1-5: 合宿は全員に効いているのに週1人分しか出ていなかった(G11)。
      // 人数で束ねて「効いた結果」が見えるようにする。トーストは従来どおり週1枚のまま
      // (通知総量を増やさない原則) — 複数の出どころがある週だけ1枚に併記する。
      // 効果値も発現タイミングも変えていない。束ね方だけの変更。
      const SOURCE_LABELS = {
        camp: { one: (n) => `合宿の手応えで${n}の気持ちが前向きになってきた`,
                many: (c) => `合宿の手応えが出てきた（${c}名）` },
        trainer: { one: (n) => `外部コーチの指導で${n}の気持ちが前向きになってきた`,
                   many: (c) => `外部コーチの指導が実を結び始めた（${c}名）` },
      };
      const bySource = {};
      weekTrustReveals.forEach(r => {
        (bySource[r.source] = bySource[r.source] || new Map()).set(r.fighterId, r.fighterName);
      });
      const parts = [];
      Object.keys(bySource).forEach(src => {
        const names = [...bySource[src].values()];
        const label = SOURCE_LABELS[src];
        if (!label) {
          // 未知の出どころも黙って落とさない(従来はどの source でも1枚出ていた)
          parts.push(`${names[0]}の気持ちが前向きになってきた`);
          return;
        }
        parts.push(names.length >= 2 ? label.many(names.length) : label.one(names[0]));
      });
      if (parts.length > 0) {
        const msg = `🤝 ${parts.join('／')}`;
        const baseDelayTr = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
        setTimeout(() => showToast(msg, 5000), baseDelayTr);
      }
    }

    // ★ 成長マイルストーン通知
    const pendingMilestone = G._pendingMilestone || null;
    if (G._pendingMilestone) {
      const { _pendingMilestone: _, ...cleanMs } = G;
      G = cleanMs;
    }
    if (pendingMilestone) {
      const msF = G.roster.find(c => c.id === pendingMilestone.fighterId);
      if (msF) {
        const msLine = pickDialogueLine(MILESTONE_LINES[pendingMilestone.linePool], msF);
        const STAT_JA = { pw: 'パワー', sp: 'スピード', te: 'テクニック', st: 'スタミナ', mn: 'メンタル' };
        let msLabel;
        if (pendingMilestone.type === 'ovr') msLabel = `総合力${pendingMilestone.value}到達`;
        else if (pendingMilestone.type === 'pop') msLabel = `人気${pendingMilestone.value}到達`;
        else msLabel = `${STAT_JA[pendingMilestone.stat] || pendingMilestone.stat}が限界に到達`;
        // growthLogにマイルストーン記録
        const msRoster = G.roster.map(c => {
          if (c.id !== msF.id) return c;
          return { ...c, growthLog: [...(c.growthLog || []), {
            season: G.season, week: G.week,
            type: 'milestone', detail: msLabel,
          }] };
        });
        G = { ...G, roster: msRoster };
        const msDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 800;
        setTimeout(() => showGrowthEventPopups([{
          type: 'milestone',
          subtype: pendingMilestone.type,
          fighterId: pendingMilestone.fighterId,
          value: pendingMilestone.value,
          stat: pendingMilestone.stat,
          line: msLine,
        }]), msDelay);
      }
    }

    // §13.4: 突然の退団表示
    const pendingSuddenDepartures = G._pendingSuddenDepartures || null;
    if (G._pendingSuddenDepartures) {
      const { _pendingSuddenDepartures: _, ...cleanSd } = G;
      G = cleanSd;
    }
    if (pendingSuddenDepartures && pendingSuddenDepartures.length > 0) {
      const sdDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 150;
      pendingSuddenDepartures.forEach((d, i) => {
        setTimeout(() => showNotifEventToast({
          type: 'N_sudden_departure',
          fighter: d.id,
          name: d.name,
          text: `🚪 ${d.name}が荷物をまとめて団体を去った。誰も止められなかった。`,
          detail: d.destination === 'rival' ? `${d.name}は他団体へ移籍した。` : `${d.name}はフリーとなった。`,
        }), sdDelay + i * 200);
      });
    }

    // P1: スキャンダル通知ポップアップ
    const pendingScandalEvents = G._pendingScandalEvents || null;
    if (G._pendingScandalEvents) {
      const { _pendingScandalEvents: _, ...cleanSc } = G;
      G = cleanSc;
    }
    if (pendingScandalEvents && pendingScandalEvents.length > 0) {
      const scandalDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 150;
      pendingScandalEvents.forEach((sc, i) => {
        setTimeout(() => showNotifEventToast({
          type: 'N_scandal',
          fighter: sc.fighterId,
          text: `📰 ${sc.fighterName}のスキャンダルが週刊誌に掲載された！`,
          detail: `ファンの間に動揺が広がっている（人気${sc.popDelta}）`,
        }), scandalDelay + i * 300);
      });
    }

    // P5: 怪我離脱中の人気低下トースト
    const pendingInjuryPopDecay = G._pendingInjuryPopDecay || null;
    if (G._pendingInjuryPopDecay) {
      const { _pendingInjuryPopDecay: _, ...cleanIpd } = G;
      G = cleanIpd;
    }
    if (pendingInjuryPopDecay && pendingInjuryPopDecay.length > 0) {
      const ipdDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 100;
      pendingInjuryPopDecay.forEach((ipd, i) => {
        setTimeout(() => showToast(`📉 ${ipd.fighterName}の人気がじわじわ下がっている…（離脱中）`, 5000), ipdDelay + i * 200);
      });
    }

    // O2: ガラガラ興行 → 新聞記事
    if (G._pendingEmptyVenue) {
      const { _pendingEmptyVenue: _, ...cleanEv } = G;
      G = cleanEv;
      App._pushNewsEvent({ type: 'emptyVenue',
        data: { org: G.orgName || 'あなたの団体', season: G.season, week: G.week } });
    }

    // v2.0: 週次通知イベント表示（N1〜N5 トースト通知）
    const pendingNotifEvent = G._pendingNotifEvent || null;
    if (G._pendingNotifEvent) {
      const { _pendingNotifEvent: _, ...cleanNe } = G;
      G = cleanNe;
    }
    if (pendingNotifEvent) {
      const notifDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 200;
      setTimeout(() => showNotifEventToast(pendingNotifEvent), notifDelay);
    }

    // v2.0 Phase1-7: 逆境チームスピリットバフ表示
    const pendingTeamSpirit = G._pendingTeamSpirit || null;
    if (G._pendingTeamSpirit) {
      const { _pendingTeamSpirit: _, ...cleanTs } = G;
      G = cleanTs;
    }
    if (pendingTeamSpirit) {
      const spiritDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 350;
      setTimeout(() => showNotifEventToast(pendingTeamSpirit), spiritDelay);
    }

    // §B-2: 移籍ウィンドウ前週の予兆通知
    const pendingPreWindow = G._pendingPreWindowWarning || null;
    if (G._pendingPreWindowWarning) {
      const { _pendingPreWindowWarning: _, ...cleanPw } = G;
      G = cleanPw;
    }
    if (pendingPreWindow && pendingPreWindow.length > 0) {
      const pwDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 500;
      pendingPreWindow.forEach((w, i) => {
        setTimeout(() => showNotifEventToast({
          type: 'N_pre_window',
          fighter: w.fighterId,
          text: w.text,
          detail: w.tone === 'serious'
            ? '⚠️ 来週は移籍ウィンドウです。信頼ケアの最後のチャンスかもしれません。'
            : '👁️ 来週は移籍ウィンドウです。動向を注視しましょう。',
        }), pwDelay + i * 300);
      });
    }

    // §2 観察眼: コーチ報告（育成画面にインライン表示用に保持）
    if (G.currentCoachReport) {
      const { currentCoachReport: _, ...cleanPrev } = G;
      G = cleanPrev;
    }
    const pendingCoachReport = G._pendingCoachReport || null;
    if (G._pendingCoachReport) {
      const { _pendingCoachReport: _, ...cleanCr } = G;
      G = cleanCr;
    }
    if (pendingCoachReport) {
      G = { ...G, currentCoachReport: pendingCoachReport };
    }

    // v2.0: 週次選択型イベント表示（S/E型 モーダル）
    const pendingChoiceEvent = G._pendingChoiceEvent || null;
    if (G._pendingChoiceEvent) {
      const { _pendingChoiceEvent: _, ...cleanCe } = G;
      G = cleanCe;
    }
    if (pendingChoiceEvent) {
      // 他のポップアップが閉じた後に表示するため少し遅延
      const choiceDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 400;
      setTimeout(() => {
        showChoiceEventModal(pendingChoiceEvent, G, (choiceIdx) => {
          if (choiceIdx >= 0) App.applyChoiceEvent(pendingChoiceEvent, choiceIdx);
        });
      }, choiceDelay);
    }

    // v2.0 Phase1-6: 大型イベント表示（B1〜B4 モーダル）
    const pendingLargeEvent = G._pendingLargeEvent || null;
    if (G._pendingLargeEvent) {
      const { _pendingLargeEvent: _, ...cleanLe } = G;
      G = cleanLe;
    }
    if (pendingLargeEvent) {
      const largeDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
      setTimeout(() => App.handleLargeEvent(pendingLargeEvent), largeDelay);
    }

    // Phase 3a: 派閥イベント表示（F01/F02/F03 モーダル）
    // 大型イベント（B1〜B4）と同週に衝突した場合は、派閥モーダルを翌週以降に持ち越す。
    // _pendingFactionEvent を G に残しておけば、次週の tickWeek 派閥パイプラインが
    // pending 検知で新規抽選をスキップし（src/management.js:7456）、次週の表示ループで
    // 自然にモーダル化される。重複トリガーは発生しない。
    const pendingFactionEvent = G._pendingFactionEvent || null;
    if (pendingFactionEvent && !pendingLargeEvent) {
      const { _pendingFactionEvent: _, ...cleanFe } = G;
      G = cleanFe;
      const factionDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 650;
      setTimeout(() => App.handleFactionEvent(pendingFactionEvent), factionDelay);
    }

    // challenge-request-spec-v0.1 Phase 2: 挑戦試合直訴モーダル表示
    // 大型イベント・派閥イベントと衝突した場合は持ち越し（pendingThisWeek を残す）
    const crPending = (G.challengeRequest && G.challengeRequest.pendingThisWeek) || null;
    if (crPending && !pendingLargeEvent && !pendingFactionEvent) {
      const crDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 700;
      setTimeout(() => App.handleChallengeRequest(crPending), crDelay);
    }

    // 「こちらの番」は通知フラグではなく挑戦権の実体(_pendingUnifiedPlayerTurn)で判定する。
    // 通知は最初のドレインで消える一発物のため、モーダルがキュー破棄(dismissAllPopups)や
    // 他モーダルとの衝突に飲まれると、挑戦権が再提示されないまま四半期末失効まで放置されていた
    // (2026-08-14 点火カタログR4で検出)。失効・消費はエンジン側が管理するので毎週再提示してよい
    const unifiedPlayerTurn = G._pendingUnifiedPlayerTurn || null;
    if (unifiedPlayerTurn && !pendingLargeEvent && !pendingFactionEvent && !crPending) {
      G = { ...G, _pendingUnifiedNotification: null };
      const unifiedDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 750;
      setTimeout(() => App.handleUnifiedTitlePlayerTurn(), unifiedDelay);
    }

    // スナップショット R3モーダル表示
    const pendingR3Modal = G._pendingR3Modal || null;
    if (G._pendingR3Modal) {
      const { _pendingR3Modal: _, ...cleanR3 } = G;
      G = cleanR3;
    }
    if (pendingR3Modal) {
      const r3Fighter = G.roster.find(f => f.id === pendingR3Modal.fighterId);
      const r3Delay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 700;
      setTimeout(() => {
        showR3Modal({
          fighterId: pendingR3Modal.fighterId,
          fighterName: r3Fighter ? r3Fighter.name : '???',
          fighterFace: r3Fighter ? getPortraitUrl(r3Fighter.id) : null,
          departedName: pendingR3Modal.departedName || '???',
          reason: pendingR3Modal.reason || 'departed',
          line: pendingR3Modal.text,
        });
      }, r3Delay);
    }

    // P4-P6: Glimpse（心の垣間見え）表示
    const pendingGlimpseA = G._pendingGlimpseA || null;
    if (G._pendingGlimpseA) {
      const { _pendingGlimpseA: _, ...cleanGa } = G;
      G = cleanGa;
    }
    const pendingGlimpseB = G._pendingGlimpseB || null;
    if (G._pendingGlimpseB) {
      const { _pendingGlimpseB: _, ...cleanGb } = G;
      G = cleanGb;
    }
    if (pendingGlimpseA || pendingGlimpseB) {
      const allGlimpses = [...(pendingGlimpseA || []), ...(pendingGlimpseB || [])];
      const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
      const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
      if (tier2.length > 0) {
        G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
      }
      if (tier1.length > 0) {
        const glimpseDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 800;
        setTimeout(() => { showGlimpseCascade(tier1); }, glimpseDelay);
      }
    }

    // v1.9: 逸材特別交渉枠アンロック通知
    const pendingEliteTicket = G._pendingEliteTicket || false;
    if (G._pendingEliteTicket) {
      const { _pendingEliteTicket: _, ...cleanEt } = G;
      G = cleanEt;
    }
    if (pendingEliteTicket) {
      const etDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 500;
      setTimeout(() => {
        Audio.play('fanfare');
        showEventPopup({
          type: 'system', emoji: '🏅', tone: 'gold',
          message: '🎊 逸材特別交渉枠を獲得！ 🎊',
          detail: '団体の名声が業界に轟いた！\n'
                + '逸材クラスの選手たちが、あなたの団体に注目しています。\n\n'
                + '💎 FA市場で逸材ランクの選手1名と特別に交渉可能\n'
                + '⏳ いつでも使用可能（温存OK）\n'
                + '⚠️ 1回限り / 超逸材には使用不可'
        });
      }, etDelay);
    }

    if (G.pendingRosterOverflowSigning) {
      const overflowDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 1100;
      App._showRosterOverflowSigningModalIfNeeded(overflowDelay);
    }

    // MQ再設計P4 §5.3: 大ニュース週頭通知（他のポップアップの後に鳴らす）
    App._maybeShowBigNewsPopup((newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 1300);

    // 週次処理と次週遷移は1クリック内で完結させる。_tryAutoAdvance が
    // weekSummary をセットし、既存の専用大会分岐も持つ入口へ渡す。
    if (App._tryAutoAdvance()) {
      App.advanceFromWeekSummary();
      return;
    }
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
  },

  // Advance to next week via Engine
  _annualAwardsCompletedThrough(state = G) {
    return Math.max(
      Number(state?._annualAwardsCompletedSeason) || 0,
      Number(state?.lastAwards?.season) || 0
    );
  },

  _repairCompletedAnnualAwards(source) {
    const completedThrough = App._annualAwardsCompletedThrough(G);
    const pendingSeason = Number(G?.pendingAwards?.season) || 0;
    const stageSeason = Number(G?._annualAwardsCeremonyPending?.season) || 0;
    const stalePending = pendingSeason > 0 && pendingSeason <= completedThrough;
    const staleStage = stageSeason > 0 && stageSeason <= completedThrough;
    if (!stalePending && !staleStage) return false;
    const clean = { ...G };
    if (stalePending) delete clean.pendingAwards;
    if (staleStage) delete clean._annualAwardsCeremonyPending;
    G = clean;
    App._annualAwardsCeremonyActive = false;
    try {
      console.warn('[WM][awards] cleared an already-completed ceremony state', {
        source, completedThrough, pendingSeason, stageSeason,
      });
      Storage.autoSave();
    } catch (_e) {}
    return true;
  },

  _isAwardsStageActive() {
    // 年間表彰式は Engine.advanceWeek がオフシーズン第1週へ進めた「後」に開く。
    // そのため背面の週送りが連打・Enterキー・古いonclickの再発火で通ると、式典を
    // dismissAllPopups で消したうえで第2週へ進んでしまう。キュー待ち中はDOMがまだ
    // activeにならないので、App側のtransientフラグと実DOMの両方を見る。
    const completedThrough = App._annualAwardsCompletedThrough(G);
    const stageSeason = Number(G?._annualAwardsCeremonyPending?.season) || 0;
    if (App._annualAwardsCeremonyActive || stageSeason > completedThrough) return true;
    try {
      const overlay = document.getElementById('awardsOverlay');
      return !!(overlay && overlay.classList.contains('active')
        && typeof window !== 'undefined' && typeof window._awardsNext === 'function');
    } catch (_e) {
      return false;
    }
  },

  /**
   * 式典途中の再読込、または旧バグでoffWeek 2へ飛んだセーブから表彰式だけを復旧する。
   * 年間処理や週そのものは巻き戻さないため、契約処理などが二重実行されることはない。
   */
  _resumeInterruptedAnnualAwards(source) {
    if (App._annualAwardsCeremonyActive) return false;
    App._repairCompletedAnnualAwards(source);
    try {
      const overlay = document.getElementById('awardsOverlay');
      if (overlay?.classList.contains('active') && typeof window._awardsNext === 'function') return false;
    } catch (_e) {}

    const pendingSeason = Number(G?.pendingAwards?.season) || Number(G?.season) || 0;
    const stageSeason = Number(G?._annualAwardsCeremonyPending?.season) || 0;
    const hasPendingStage = !!(G?.pendingAwards && stageSeason === pendingSeason
      && pendingSeason > App._annualAwardsCompletedThrough(G));
    const completedThisSeason = App._annualAwardsCompletedThrough(G) >= Number(G?.season);
    const skippedIntoWeek2 = !!(G?.offSeason && G?.offWeek === 2 && !completedThisSeason);
    if (!hasPendingStage && !skippedIntoWeek2) return false;

    if (!G.pendingAwards && !App._recoverPendingAwards()) return false;
    G = {
      ...G,
      _annualAwardsCeremonyPending: {
        season: G.pendingAwards?.season || G.season,
        recoveredFrom: source || 'runtime',
      },
    };
    try { Storage.autoSave(); } catch (_e) {}
    App._safeAwardsChain();
    return true;
  },

  _guardAwardsStage(source) {
    App._repairCompletedAnnualAwards?.(source);
    if (App._resumeInterruptedAnnualAwards?.(source)) return true;
    const stageActive = App._isAwardsStageActive();
    const progressionSource = source === 'advanceCurrentFlow'
      || source === 'advanceFromWeekSummary'
      || source === 'advanceWeek'
      || source === 'processWeek';
    // 最終スライドを閉じた直後も、同じダブルクリックやEnter repeatが背面の
    // 「次の週へ」に届く。式典終了後の短い間は週送りだけを遮断する。
    const closeShieldActive = progressionSource
      && Date.now() < (App._annualAwardsAdvanceBlockedUntil || 0);
    if (!stageActive && !closeShieldActive) return false;
    try {
      console.warn('[WM][awards] ignored background navigation while ceremony is active', {
        source, season: G && G.season, offWeek: G && G.offWeek,
        stageActive, closeShieldActive,
      });
    } catch (_e) {}
    // 表彰式開始前に押した背面ボタンへフォーカスが残ると、Enterで同じonclickが
    // 再発火する。操作先を式典の「次へ」へ戻して、以後のキー入力も式典に届ける。
    if (stageActive) {
      try { document.getElementById('aw-btn-next')?.focus({ preventScroll: true }); } catch (_e) {}
    }
    return true;
  },

  advanceCurrentFlow() {
    if (App._guardAwardsStage?.('advanceCurrentFlow')) return;
    if (App.repairProgressionState('advanceCurrentFlow')) {
      try { Storage.autoSave(); } catch (_e) {}
    }
    if (G.weekPhase === 'manage') {
      App.processWeek();
      return;
    }
    if (G.weekPhase === 'weekSummary') {
      App.advanceFromWeekSummary();
      return;
    }
    if (G.weekPhase === 'contractNegotiation') {
      App.handleContractNegotiations();
      return;
    }
    if (G.weekPhase === 'scoutEvent') {
      Audio.play('discover');
      showScreen('scoutEvent');
      refreshAll();
      return;
    }
    if (App._ensureDraftResolvedBeforeAdvance()) return;
    if (G.offSeason || G.weekPhase === 'offseason' || G.weekPhase === 'settled') {
      App.advanceWeek();
      return;
    }
    Audio.play('error');
  },

  /** ドラフト週を「行かないまま」通り過ぎさせないための保険(2026-07-31 Keisuke)。
   *
   *  他団体の指名処理は startDraftNegotiation(ui-common.js)の中の
   *  「非選択候補のバックグラウンド処理」ループにしか無い。つまり**そこを通らずに
   *  週が進むと、その年は業界全体が新人ゼロ**になる。
   *  通常は weekPhase === 'scoutEvent' の間ずっと画面へ押し戻すので通れないが、
   *  セーブの修復・phase の取りこぼし・将来の分岐追加で phase だけ外れることはあり得る。
   *  候補が残ったまま週を進めようとしたら、**指名0名として裏で決着させてから**先へ進む。
   *  @returns {boolean} 決着処理へ入ったら true(呼び出し側はそこで戻る) */
  _ensureDraftResolvedBeforeAdvance() {
    if (!G || !G.offSeason) return false;
    const pending = Array.isArray(G.scoutCandidates) && G.scoutCandidates.length > 0;
    if (!pending) return false;
    if (G.weekPhase === 'scoutEvent') return false;   // 通常経路。画面側で処理する
    if (G._draftNegotiation || G._draftResultPages) return false; // 進行中
    try {
      console.warn('[WM][draft] ドラフト未消化のまま週を進めようとした', {
        season: G.season, offWeek: G.offWeek, weekPhase: G.weekPhase,
        candidates: G.scoutCandidates.length,
      });
    } catch (_e) {}
    if (!G._draftInterests || typeof startDraftNegotiation !== 'function') {
      // 関心マークが無いと誰がどこを狙うか決められない(旧セーブ等)。
      // 決着させられないので、候補を抱えたまま毎週ここへ来ないよう畳んでおく。
      G = { ...G, scoutCandidates: null, _draftSelections: null, _draftInterests: null,
            gameLog: [...(G.gameLog || []), '⚠ ドラフト情報が不完全だったため、今年の指名は行われませんでした'] };
      return false;
    }
    G = { ...G, _draftSelections: [] };
    startDraftNegotiation();
    return true;
  },

  advanceWeek() {
    if (App._guardAwardsStage?.('advanceWeek')) return false;
    if (G.weekPhase === 'scoutEvent') {
      Audio.play('discover');
      showScreen('scoutEvent');
      refreshAll();
      return;
    }
    if (App._ensureDraftResolvedBeforeAdvance()) return;
    Audio.play('tick');
    if (App.repairProgressionState('advanceWeek')) {
      try { Storage.autoSave(); } catch (_e) {}
    }
    dismissAllPopups(); // 残存ポップアップを強制クリア
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    // 週が進んだ時点でヘッダーの日付を直す(2026-07-27)。
    // この下には特別興行(PPV/天頂戦/秋4団体/ジュニア)や交渉フェーズへ**そのまま return する**
    // 分岐が並んでおり、そこへ入ると refreshAll が回らない。結果、週は48(冬第12週)になって
    // いるのに**ヘッダーだけ前の週(冬第11週)のまま**特別興行の画面が開いていた
    // （Keisuke「天頂戦が発火するタイミングが冬の第11週になってる」。定数は 12/24/36/48 で
    //  正しく、ズレていたのは表示だけ）。
    try { refreshTopBar(); } catch (_e) {}
    // ── 体験版シーズンゲート ──
    if (G._trialEnd) {
      const { _trialEnd: _, ...cleanG } = G;
      G = cleanG;
      Storage.autoSave();
      showTrialEndMessage();
      refreshAll();
      return;
    }
    // 契約更新交渉フェーズ
    if (G.weekPhase === 'contractNegotiation') {
      Storage.autoSave();
      App.handleContractNegotiations();
      return;
    }
    if (App._shouldStartTenchosenReplay?.()) {
      Storage.autoSave();
      App.initTenchosenReplay();
      return;
    }
    // PPV Week 48: PPVフェーズに入った場合は専用フローへ
    if (G.weekPhase === 'ppvShow') {
      Storage.autoSave();
      App.initPPVShow();
      return;
    }
    if (G.weekPhase === 'ppvTV') {
      Storage.autoSave();
      App.initPPVTV();
      return;
    }
    // 秋4団体戦 Week36: 結果確定前のリプレイを自動起動
    if (G._pendingAutumnWarReplay) {
      Storage.autoSave();
      App.initAutumnWarReplay();
      return;
    }
    // C-6 天頂戦 Week48: 結果はEngine.advanceWeek内で確定済み。リプレイ演出を自動起動
    if (App._shouldStartTenchosenReplay()) {
      Storage.autoSave();
      App.initTenchosenReplay();
      return;
    }
    // ジュニアトーナメント Week 24（夏の最終興行週）
    if (G.weekPhase === 'juniorTournament') {
      Storage.autoSave();
      App.initJuniorTournament();
      return;
    }
    // v0.97: Update survival gauge
    App.checkSurvivalUpdate();
    App.checkCrisisEnteredPopup();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    App.checkPrologueHighlights();
    App.checkTenchosenPreEvent();
    App.checkUnifiedTitlePresentation();
    sessionRng = Engine.rng.create(G.rngSeed);

    // v1.4w: 交渉成功時の新聞イベント
    if (G.negotiationResult && G.negotiationResult.success && G.negotiationResult.fighter && !(G.pendingRosterOverflowSigning && G.pendingRosterOverflowSigning.source === 'negotiation')) {
      const nf = G.negotiationResult.fighter;
      const fromOrg = (G.transferLog || []).slice(-1)[0];
      App._pushNewsEvent({ type: 'poachSuccess', characterId: nf.id,
        data: { name: nf.name, toOrg: G.orgName || 'あなたの団体',
          fromOrg: fromOrg ? fromOrg.from : '他団体',
          ovr: Engine.util.ov(nf) } });
    }
    // v1.4w: ティッカー更新
    App._refreshTicker();

    // 2026-07-27: ここにあった App._seasonEndChainActive（総括を伏せるフラグ）は廃止した。
    // advanceWeek のたびに立ち、演出チェーンが完走したときにしか下りない作りだったため、
    // チェーンがどこかで待ちに入ると**レポートの週で総括が出てこなくなる**。
    // 総括の出しどころは offWeek 1（レポートの週）で決め打つ方が壊れない。
    // → src/ui-render.js の `if (offW === 1)`

    // v1.3-3: Extract pending retirements before save (transient field)
    const pendingRetirements = G.pendingRetirements || null;
    if (pendingRetirements) {
      const { pendingRetirements: _, ...cleanG } = G;
      G = cleanG;
    }

    Storage.autoSave();
    Audio.bgm.playForState(); // BGM: switch on season transitions

    // task-52: 新年号の大ニュース通知は「第1週に到着した時点」で鳴らす。
    // ここは特別興行(PPV/天頂戦/秋4団体/ジュニア)・契約更新交渉フェーズへ return する
    // 分岐(このメソッド冒頭)より後、かつ引退演出チェーン(このすぐ下)より前 —
    // 引退がある年でも毎年確実に届く位置。isSeasonOpening 条件(既存の
    // App._maybeShowBigNewsPopup 内の判定と同じ)で絞っているので、オフシーズン中の
    // 通常ティック(offWeek 1〜4)では何も起きない(通常週の大ニュース通知の挙動は変えない)。
    if (!G.offSeason && G.week === 1 && (G.season || 1) > 1) {
      App._maybeShowBigNewsPopup(600);
    }

    // v1.3-3: Show retirement popups (season-end)
    // 引退は引き留めダイアログで決断後に commit する（ダイアログ前は roster/titles/HoF を変更しない）
    if (pendingRetirements && pendingRetirements.length > 0) {
      App._retainedIds = new Set();
      refreshAll();
      // 引退は**確定とあいさつを続けて**、表彰式の前に済ませる(2026-07-27 Keisuke)。
      // 一度は「あいさつだけ表彰式の後」に分けたが、分ける必要はなかった。
      // ただし**表彰式より前**であることは動かせない —
      // 殿堂入りは retiredFighters だけを見るので、確定前に表彰式を作ると殿堂が空になる。
      showRetirementPopups(pendingRetirements, () => {
        const retained = App._retainedIds || new Set();
        const confirmed = pendingRetirements
          .filter(r => !retained.has(r.fighter.id))
          .map(r => r.fighter);
        if (confirmed.length > 0) {
          const result = Engine.retirement.commitRetirements(G, confirmed);
          G = result.state;
          if (result.events && result.events.length > 0) {
            G = { ...G, gameLog: [...(G.gameLog || []), ...result.events] };
          }
          confirmed.forEach(f => { G = archiveRetiredRivalryState(G, f); });
          (result.newsItems || []).forEach(n => App._pushNewsEvent(n));
          Storage.autoSave();
          refreshAll();
        }
        App._retainedIds = null;
        App._safeAwardsChain();
      });
      return;
    }

    // v1.8: AI成長イベント脅威/好機アラート（表彰式の前に表示）
    const aiAlerts = G._pendingAIGrowthAlerts || [];
    if (G._pendingAIGrowthAlerts) {
      const { _pendingAIGrowthAlerts: _, ...cleanAI } = G;
      G = cleanAI;
    }

    // v1.4w: AI成長イベントの新聞イベント収集
    aiAlerts.forEach(alert => {
      // エンジンが積む type は 'threat'（ui-common の脅威ポップアップがこの名前を見ている）。
      // ここが 'breakthrough' しか見ていなかったため、**AI団体のブレークスルーは一度も
      // 記事にならなかった**（NEWS_HEADLINE_TEMPLATES.breakthrough の3本が丸ごと死に文）。
      // ポップアップ側の名前は変えられないので、受け取り側で両方を拾う（2026-07-26）。
      if (alert.type === 'breakthrough' || alert.type === 'threat') {
        const orgName = alert.org ? alert.org.name : '他団体';
        // 記事の {detail} は3本の本文すべてに嵌る形にする。
        // 「{name}が{detail}」に入る本文があるので、主語を含まない述語で書く。
        // **数字は新聞に出さない**（内部の刻みが表に出るとスプレッドシートに見える。
        // 2026-07-26 Keisuke）。ブレークスルーの伸びは2〜4なので3段の定性表現に写す。
        const _stat = STAT_LABELS_JP[alert.stat] || (alert.stat || '').toUpperCase();
        const _gain = Math.round(+(alert.gain || 0));
        const _detail = _gain >= 4 ? `${_stat}を大きく伸ばした`
          : _gain === 3 ? `${_stat}をはっきりと伸ばした`
          : `${_stat}に確かな伸びを見せた`;
        App._pushNewsEvent({ type: 'breakthrough', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName, detail: _detail } });
      } else if (alert.type === 'slump') {
        const orgName = alert.org ? alert.org.name : '他団体';
        App._pushNewsEvent({ type: 'slump', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName } });
      } else if (alert.type === 'motivation_loss') {
        const orgName = alert.org ? alert.org.name : '他団体';
        App._pushNewsEvent({ type: 'motivationLoss', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName } });
      }
    });

    // 週が進んだことを先に画面へ反映する(2026-07-27)。
    // ここまで来ると G は次の週になっているのに、描き直しは演出チェーンが完走したときの
    // refreshAll しか無かった。チェーンがどこかで待ちに入ると**前の週の画面が残り**、
    // 年度末ブリッジのステッパーもボタンの文言も1つ前のままになる
    // （実機で offWeek 1 なのに「0/4」「シーズンレポートへ →」が出たままだった）。
    // 演出はこの後オーバーレイで重なるので、先に描き直しても手順は変わらない。
    // 「表彰式より先に総括が背面に見える」問題(2026-07-31)はここを止めて解決しない。
    // 止めると 2026-07-27 に直した**ヘッダーとステッパーが1つ前のまま**が再発する。
    // 総括だけを伏せるのが正しく、その判定は renderWeekScreen 側の pendingAwards で行う。
    refreshAll();

    if (aiAlerts.length > 0) {
      // ポップアップ解消待ちには時限保険を必ず併設する(§5-D 鉄則1)。ただし旧実装のように
      // 保険から式典チェーンを**直接開始**すると、ユーザーが画面移動でアラートを畳んだ後、
      // ログ・ランキング・新聞を閲覧中に無操作で式典が頭上に被さる(v1.31「勝手に始まる」報告)。
      // 保険は「式典待ち」の記帳(_annualAwardsCeremonyPending)までにとどめ、実際に開くのは
      // 既存の復旧機構(_guardAwardsStage → _resumeInterruptedAnnualAwards)が
      // 次のユーザー操作(画面遷移・週送り)のタイミングで行う。進行保証は変わらない。
      let awardsChainStarted = false;
      const startAwardsChain = () => {
        if (awardsChainStarted) return;
        awardsChainStarted = true;
        App._safeAwardsChain();
      };
      showAIGrowthAlerts(aiAlerts, startAwardsChain);
      const armPendingCeremony = () => {
        if (awardsChainStarted) return;
        if (typeof _isPopupActive === 'function' && _isPopupActive()) {
          // アラートをまだ読んでいる(コールバックは生きている)。保険だけ延長する。
          setTimeout(armPendingCeremony, 4000);
          return;
        }
        console.warn('[WM] awards chain callback lost — ceremony pending, resumes on next interaction');
        awardsChainStarted = true; // 遅れて届いた旧コールバックからの二重開始を防ぐ
        G = {
          ...G,
          _annualAwardsCeremonyPending: {
            season: G.pendingAwards?.season || G.season,
            recoveredFrom: 'aiAlertsCallbackLost',
          },
        };
        try { Storage.autoSave(); } catch (_e) {}
      };
      setTimeout(armPendingCeremony, Math.max(8000, aiAlerts.length * 4000));
    } else {
      // v1.4: 引退者なしでも新聞パネル→エンディングチェック→表彰式チェック
      App._safeAwardsChain();
    }
  },

  // 表彰式チェーン安全実行: 中間ステップのエラーで表彰式が消失しないよう防御
  _recoverPendingAwards() {
    const completedThrough = App._annualAwardsCompletedThrough(G);
    const pendingSeason = Number(G?.pendingAwards?.season) || 0;
    if (G.pendingAwards && pendingSeason > completedThrough) return true;
    if (G.pendingAwards && pendingSeason > 0 && pendingSeason <= completedThrough) {
      App._repairCompletedAnnualAwards('_recoverPendingAwards');
      return false;
    }
    // offWeek 2 は、旧バグで表彰式の途中から一週飛んだセーブだけを救う範囲。
    // それより先の週から過去の式典を突然出すことはしない。
    if (!G.offSeason || G.offWeek < 1 || G.offWeek > 2) return false;
    if (completedThrough >= Number(G.season)) return false;
    // 初年度のoffWeek 1ではseasonHistoryはまだ空。ここで復旧を拒むと、保存・演出
    // 切替などでpendingAwardsだけが失われた初年度に限って表彰式が恒久的に消える。
    // offSeason/offWeekという生成時点の条件で十分に絞れているため、履歴の有無は見ない。
    try {
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xA11D));
      const pendingAwards = Engine.awards.generate(rng, G);
      G = { ...G, pendingAwards, gameLog: [...(G.gameLog || []), '🛠 年末表彰データを復旧しました'] };
      Storage.autoSave();
      return true;
    } catch (e) {
      console.error('[WM] pendingAwards recovery failed:', e);
      return false;
    }
  },

  _safeAwardsChain() {
    const awardsCallback = () => {
      try {
        App._recoverPendingAwards();
        App._checkAndShowAwards();
      }
      catch (e) { console.error('[WM] _checkAndShowAwards error:', e); try { refreshAll(); } catch (_) {} }
    };
    const endingCallback = () => {
      try { App._checkAndShowEnding(awardsCallback); }
      catch (e) { console.error('[WM] _checkAndShowEnding error:', e); awardsCallback(); }
    };
    try { App._showNewsPanelIfNeeded(endingCallback); }
    catch (e) { console.error('[WM] _showNewsPanelIfNeeded error:', e); endingCallback(); }
  },

  // v1.9: 新シーズン開幕ファンファーレのトリガー判定
  _maybeShowSeasonFanfare(callback) {
    if (G.week === 1 && !G.offSeason && G.season > 1 && typeof showSeasonFanfare === 'function') {
      showSeasonFanfare(G.season, callback);
    } else {
      callback();
    }
  },

  // v2.1: エンディング演出チェック（初クリア時のみ、1回限り）
  _checkAndShowEnding(onDone) {
    // 業界底上げ演出をチェーンする内部関数
    const checkElevation = () => {
      if (G._pendingLeagueElevation) {
        const { _pendingLeagueElevation: _, ...cleanG } = G;
        G = cleanG;
        showLeagueElevationCeremony(G, onDone);
      } else {
        onDone();
      }
    };
    if (G.endingCleared && G.endingClearedSeason === G.season - 1 && !G.endingShown) {
      G = { ...G, endingShown: true };
      const data = Engine.ending.buildClearData(G);
      showEndingCeremony(data, checkElevation);
    } else {
      checkElevation();
    }
  },

  /** 一連の締めくくり。式典終了後、レポート週の総括を表示する。
   *  `refreshAll()` だけでは背面にしていた別タブを切り替えないため、表彰式を閉じても
   *  offWeek 1 の総括が見えないことがあった。レポート週だけ今週画面へ戻す。 */
  _showFarewellsThenReport() {
    // 表彰式が何らかの中断から offWeek 2 で復旧した場合、式典を閉じた後に
    // 背面の週画面へ戻すだけでは契約更新の開始経路が失われる。通常の第1週では
    // ここに来ないため、第2週かつ未開始の契約更新だけを明示的に再開する。
    if (G.offSeason && G.offWeek === 2 && G.weekPhase === 'contractNegotiation') {
      if (!App._contractNegotiationSession?.active) {
        showScreen('shachoshitsu');
        App.handleContractNegotiations();
      }
      return;
    }
    if (G.offSeason && G.offWeek === 1 && typeof showScreen === 'function') {
      showScreen('week');
    }
    refreshAll();
  },

  // v1.4: 年末表彰式チェック＆表示
  _checkAndShowAwards() {
    // AI成長通知の通常コールバックと時限保険などからチェーンが重なっても、開いている
    // 表彰式をもう一度組み立てたり、背面だけ総括へ進めたりしない。
    if (App._annualAwardsCeremonyActive) return;
    const pendingAwards = G.pendingAwards;
    if (!pendingAwards) {
      App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => App._showFarewellsThenReport()));
      return;
    }
    const awardSeason = Number(pendingAwards.season) || Number(G.season) || 1;
    // 異常終了や旧セーブに完了済みデータが残っても、同じ年の式典を再上映しない。
    if (awardSeason <= App._annualAwardsCompletedThrough(G)) {
      App._repairCompletedAnnualAwards('_checkAndShowAwards');
      App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => App._showFarewellsThenReport()));
      return;
    }
    // 式典完走前に再読込・例外・誤ナビゲーションが起きても再開できるよう、
    // pendingAwards は終了ボタンまで保存に残す。
    G = {
      ...G,
      _annualAwardsCeremonyPending: {
        season: awardSeason,
        startedAtOffWeek: G.offWeek || 1,
      },
    };

    // 式典は中断地点から再表示してよいが、受賞歴・関係値・殿堂ニュースの前処理は
    // 年1回だけ。ここを画面の一時フラグだけで守ると、再読込時に二重加算される。
    const shouldPrepareAwards = Number(G._annualAwardsPreparedSeason) !== awardSeason;
    if (shouldPrepareAwards) {
      // 受賞歴をキャリア記録に追加（プレイヤー団体・NPC団体ともに）
      const aSeason = awardSeason;
      const aWeek = 49; // オフシーズン表彰式

      // 業界の賞と所属団体内の賞で同じ選手が選ばれることがある（団体内MVPは業界MVPと
      // 必然的に一致する）。同一年の同じ賞を二重に記録すると年表が「MVP 2度受賞」になり
      // 殿堂ポイントも二重に乗るため、賞の種類ごとに記録済みIDを覚えて弾く。
      const _awardedIds = {};
      const recordAwardOnce = (ids, ev) => {
        const seen = _awardedIds[ev.type] || (_awardedIds[ev.type] = new Set());
        const fresh = ids.filter(id => id != null && !seen.has(id));
        if (fresh.length === 0) return;
        fresh.forEach(id => seen.add(id));
        // 書き込み先はロスター/AIロスターだけではない。**引退確定は表彰式より前に走る**ので、
        // 引退者(retiredFighters)と年代記アーカイブにも届けないと、その年の受賞が消える。
        G = Engine.awards.recordAwardEvent(G, fresh, ev);
      };

      // ── 業界全体の受賞 ──
      // 新人王はジュニアトーナメント優勝者と同一人物（rookieOfYear が jtChampion を指す）。
      if (pendingAwards.rookieOfYear) {
        const w = pendingAwards.rookieOfYear;
        recordAwardOnce([w.id],
          { type: 'awardRookie', season: aSeason, week: aWeek, orgName: w.orgName });
      }
      if (pendingAwards.mvp) {
        const w = pendingAwards.mvp;
        recordAwardOnce([w.id],
          { type: 'awardMVP', season: aSeason, week: aWeek, orgName: w.orgName });
      }
      if (pendingAwards.mediaAward) {
        const w = pendingAwards.mediaAward;
        recordAwardOnce([w.id],
          { type: 'awardMedia', season: aSeason, week: aWeek, orgName: w.orgName });
      }
      if (pendingAwards.bestMatch) {
        const bm = pendingAwards.bestMatch;
        recordAwardOnce([bm.fighter1 && bm.fighter1.id, bm.fighter2 && bm.fighter2.id],
          { type: 'awardBestMatch', season: aSeason, week: aWeek, mq: bm.mq, orgName: bm.orgName });
      }

      // ── NPC団体ごとの内部表彰（プレイヤーには表示されないが履歴には残る） ──
      const npcAwards = pendingAwards.npcAwards || {};
      Object.keys(npcAwards).forEach(orgId => {
        const a = npcAwards[orgId];
        if (!a) return;
        if (a.rookie && a.rookie.id) {
          recordAwardOnce([a.rookie.id],
            { type: 'awardRookie', season: aSeason, week: aWeek, orgName: a.orgName });
        }
        if (a.mvp && a.mvp.id) {
          recordAwardOnce([a.mvp.id],
            { type: 'awardMVP', season: aSeason, week: aWeek, orgName: a.orgName });
        }
        if (a.bestMatch) {
          recordAwardOnce(
            [a.bestMatch.fighter1 && a.bestMatch.fighter1.id, a.bestMatch.fighter2 && a.bestMatch.fighter2.id],
            { type: 'awardBestMatch', season: aSeason, week: aWeek, mq: a.bestMatch.mq, orgName: a.orgName });
        }
      });

      // 殿堂入りエントリは commitRetirements 時点（受賞を積む前）のスナップショットなので、
      // 今季の受賞を刻んだあとに作り直す。作り直さないと retiredFighters 側だけ直っても
      // 恒久保存される allHallOfFame には届かない（applyHallOfFame はエントリしか見ない）。
      // 加点そのものは Engine.awards.calcHofPoints のまま — 配点も閾値も触っていない。
      if (Array.isArray(pendingAwards.hallOfFame)) {
        pendingAwards.hallOfFame = Engine.awards.checkHallOfFame(G);
      }

      // Phase 4 E-05: 表彰式の関係値反映
      if (G.relationships) {
        const awardRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBE5B));
        let relState = { ...G };
        const rosterIds = (G.roster || []).filter(f => !f.isRental).map(f => f.id);
        // 各賞の受賞者（プレイヤー団体所属のみ）に対して関係値を適用
        const awardWinners = [];
        if (pendingAwards.rookieOfYear && pendingAwards.rookieOfYear.isPlayerOrg) {
          awardWinners.push(pendingAwards.rookieOfYear.id);
        }
        if (pendingAwards.mvp && pendingAwards.mvp.isPlayerOrg) {
          awardWinners.push(pendingAwards.mvp.fighter ? pendingAwards.mvp.fighter.id : pendingAwards.mvp.id);
        }
        for (const winnerId of awardWinners) {
          if (!winnerId || !rosterIds.includes(winnerId)) continue;
          const otherIds = rosterIds.filter(id => id !== winnerId);
          if (otherIds.length === 0) continue;
          // winner→roster: bond +2~+3
          relState = Engine.relationships.applyToRoster(relState, winnerId, otherIds,
            { min: 2, max: 3 }, { min: 0, max: 0 }, awardRelRng);
          // roster→winner: bond +1~+2
          relState = Engine.relationships.applyFromRoster(relState, otherIds, winnerId,
            { min: 1, max: 2 }, { min: 0, max: 0 }, awardRelRng);
          // OVR近接者(diff≤5)→winner: rivalry +2~+4
          const winnerFighter = (G.roster || []).find(f => f.id === winnerId);
          if (winnerFighter) {
            const winnerOvr = Engine.util.ov(winnerFighter);
            const closeIds = (G.roster || []).filter(f =>
              f.id !== winnerId && !f.isRental && Math.abs(Engine.util.ov(f) - winnerOvr) <= 5
            ).map(f => f.id);
            if (closeIds.length > 0) {
              relState = Engine.relationships.applyFromRoster(relState, closeIds, winnerId,
                { min: 0, max: 0 }, { min: 2, max: 4 }, awardRelRng);
            }
          }
        }
        G = { ...G, relationships: relState.relationships };
      }
      // 引き止め成功でrosterに戻った選手を殿堂入り候補から除外
      const rosterIds = new Set(G.roster.map(c => c.id));
      pendingAwards.hallOfFame = (pendingAwards.hallOfFame || []).filter(h => !rosterIds.has(h.id));
      // v1.4w: 殿堂入りの新聞イベント収集
      if (pendingAwards.hallOfFame.length > 0) {
        pendingAwards.hallOfFame.forEach(h => {
          App._pushNewsEvent({ type: 'hallOfFame', characterId: h.id,
            data: { name: h.name, titles: h.titleReigns || 0, defenses: h.totalDefenses || 0 } });
        });
      }
      G = { ...G, _annualAwardsPreparedSeason: awardSeason };
      Storage.autoSave();
    }
    refreshAll();
    // 表彰式ポップアップ開始
    // WM-H05 表彰式（-17 LUFS 正規化済みのため vol は新音源基準へ）
    // WM-H05 表彰式。音量はミキサー実聴値（2026-07-27）
    let awardsCeremonyFinished = false;
    const finishAwardsCeremony = () => {
      // 最終ボタンのダブルクリックや非同期コールバックの競合でも、殿堂反映・新聞・
      // 総括への遷移を一度しか行わない。
      if (awardsCeremonyFinished) return;
      awardsCeremonyFinished = true;
      // 最終クリックの二発目／Enterのrepeatが、直下のオフシーズン週送りを
      // 押さないようにする。画面をレポート週へ戻す内部showScreenは妨げない。
      App._annualAwardsAdvanceBlockedUntil = Date.now() + 1000;
      App._annualAwardsCeremonyActive = false;
      try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
      // 表彰式BGMフェードアウト後に通常BGMを再開
      App.restoreBgmForState(1600);
      // 表彰式完了後: 殿堂入り処理 + retiredFighters 清掃
      try {
        G = Engine.awards.finalizeRetireeBuffer(G);
      } catch (e) {
        // 後処理の一部失敗を「式典未完了」に戻すと、次回起動時に同じ式典と
        // 受賞副作用を再実行してしまう。記録して先へ進み、重複を防ぐ。
        console.error('[WM] finalizeRetireeBuffer failed after awards:', e);
      }
      const {
        pendingAwards: _finishedAwards,
        _annualAwardsCeremonyPending: _finishedStage,
        ...afterAwards
      } = G;
      G = {
        ...afterAwards,
        lastAwards: pendingAwards,
        _annualAwardsCompletedSeason: Math.max(
          Number(afterAwards._annualAwardsCompletedSeason) || 0,
          awardSeason
        ),
      };
      Storage.autoSave();
      App._showNewsPanelIfNeeded(() => App._checkAndShowMilestone(
        () => App._maybeShowSeasonFanfare(() => App._showFarewellsThenReport())));
    };

    // DOM表示前（別ポップアップ待ちのキューに入る場合も含む）から週送りをロックする。
    App._annualAwardsCeremonyActive = true;
    try {
      showAwardsCeremony(pendingAwards, finishAwardsCeremony, () => {
        // 別ポップアップ待機中には鳴らさず、表彰式が実際に開く瞬間から開始する。
        try { Audio.fileBgm.play(YEAR_END_AWARDS_BGM, { loop: true, volume: 0.40 }); } catch(e) {}
      });
    } catch (e) {
      // 描画そのものが失敗した場合に進行ロックだけが残ることは避ける。
      App._annualAwardsCeremonyActive = false;
      throw e;
    }
  },

  // v1.5s25b: マイルストーン検出
  _checkMilestones() {
    const ms = G.milestones || {};
    for (const evt of MILESTONE_EVENTS) {
      if (ms[evt.id]) continue;
      let triggered = false;
      switch (evt.trigger.type) {
        case 'totalShows':
          triggered = (G.totalShows || 0) >= evt.trigger.value;
          break;
        case 'orgPop':
          triggered = Engine.util.dispOrgPop(G.orgPop) >= evt.trigger.value;
          break;
        case 'first_rivalry':
          triggered = Object.keys(G.rivalries || {}).length > 0;
          break;
        case 'venue':
          if (evt.trigger.timing === 'preShow') break; // preShowフックで処理
          triggered = (G.showVenue === evt.trigger.venueIdx);
          break;
        case 'venue_occupancy': {
          if (evt.trigger.timing === 'preShow') break;
          const t = evt.trigger;
          const cap = VENUES[t.venueIdx]?.cap;
          const occ = cap ? (G.lastShowAttendance || 0) / cap : 0;
          triggered = (G.showVenue === t.venueIdx) && (occ >= t.minOccupancy);
          break;
        }
      }
      if (triggered) return evt;
    }
    return null;
  },

  // D層: 興行前マイルストーンチェック（preShow timing のみ対象）
  _checkAndShowPreShowMilestone(onDone) {
    const ms = G.milestones || {};
    for (const evt of MILESTONE_EVENTS) {
      if (evt.trigger.timing !== 'preShow') continue;
      if (ms[evt.id]) continue;
      let triggered = false;
      switch (evt.trigger.type) {
        case 'venue':
          triggered = (G.showVenue === evt.trigger.venueIdx);
          break;
      }
      if (!triggered) continue;
      G = { ...G, milestones: { ...(G.milestones || {}), [evt.id]: true } };
      const speakers = App._resolveSpotlightFighters(G);
      showCeremonyEvent(evt, speakers, onDone);
      return;
    }
    onDone();
  },

  // v1.5s25b: マイルストーンチェック→UI→適用のフロー
  _checkAndShowMilestone(onDone) {
    const evt = App._checkMilestones();
    if (!evt) { onDone(); return; }
    // D層イベント（choices なし）はセレモニー演出
    if (!evt.choices || evt.choices.length === 0) {
      G = { ...G, milestones: { ...(G.milestones || {}), [evt.id]: true } };
      const speakers = App._resolveSpotlightFighters(G);
      showCeremonyEvent(evt, speakers, onDone);
      return;
    }
    // first_rivalry はナレーション動的生成
    let displayEvt = evt;
    if (evt.id === 'first_rivalry' && !evt.narration) {
      const rivalryKeys = Object.keys(G.rivalries || {});
      if (rivalryKeys.length > 0) {
        const key = rivalryKeys[0];
        const [id1, id2] = key.split('-').map(Number);
        const c1 = G.roster.find(c => c.id === id1);
        const c2 = G.roster.find(c => c.id === id2);
        const n1 = c1?.name || '???';
        const n2 = c2?.name || '???';
        displayEvt = { ...evt,
          narration: `${n1}と${n2}——\nリング上で何度も火花を散らしたふたりの間に、\n特別な空気が漂い始めている。\nこの因縁、どう活かしていくか——`,
          choices: evt.choices.map((ch, i) => {
            if (i === 1 && ch.effect.type === 'next_match_mq') {
              return { ...ch, effect: { ...ch.effect, pair: [id1, id2] } };
            }
            return ch;
          })
        };
      }
    }
    Audio.play('event');
    showMilestoneEvent(displayEvt, (choiceIdx) => {
      App._applyMilestoneChoice(displayEvt, choiceIdx);
      onDone();
    });
  },

  // D層: メインイベント2名 + ロスターpop最大のベテラン代表を選出
  _resolveSpotlightFighters(G) {
    const mainCard = G.showCard?.[0];
    if (!mainCard) return [];
    const mainLeftId = mainCard.left;
    const mainRightId = mainCard.right;
    const mainLeft = G.roster.find(f => f.id === mainLeftId);
    const mainRight = G.roster.find(f => f.id === mainRightId);
    const veteran = G.roster
      .filter(f => f.id !== mainLeftId && f.id !== mainRightId
        && f.status !== 'retired' && !f.isRental)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0))[0];
    return [
      mainLeft  ? { fighter: mainLeft,  roleLabel: 'MAIN EVENT ・ 赤コーナー' } : null,
      mainRight ? { fighter: mainRight, roleLabel: 'MAIN EVENT ・ 青コーナー' } : null,
      veteran   ? { fighter: veteran,   roleLabel: 'VETERAN ・ ロッカールーム代表' } : null
    ].filter(Boolean);
  },

  // D層: personality×archetypeからドームセリフを決定論的に選出（RNGシード利用）
  resolveDomeLine(fighter, dialogueKey) {
    const dict = dialogueKey === 'dome_firstshow' ? DOME_FIRSTSHOW_LINES : DOME_SELLOUT_LINES;
    const p = fighter.personality || 'normal';
    const a = fighter.archetype || 'standard';
    // 第一分岐はアーキタイプ(2026-08-01 に軸を入れ替え)。
    // 探索順は getDialoguePool と同じ(アーキタイプを保ったまま性格を落とす → 標準へ)
    const lines = getDialoguePool(dict, { personality: p, archetype: a });
    const seed = Engine.rng.derive(G.rngSeed, G.season, G.week, 0xD03E, fighter.id);
    const rng = Engine.rng.create(seed);
    const idx = Math.floor(Engine.rng.float(rng) * lines.length);
    return lines[idx];
  },

  // v1.5s25b: マイルストーン選択肢の効果適用
  _applyMilestoneChoice(evt, choiceIdx) {
    const choice = evt.choices[choiceIdx];
    const eff = choice.effect;
    const buff = { ...eff, source: evt.id };

    // 週カウント系
    if (eff.weeks) buff.remainingWeeks = eff.weeks;
    // 興行カウント系
    if (eff.shows) buff.remainingShows = eff.shows;

    // 即時効果: rivalry_boost — 因縁カウントを即時+1
    if (eff.type === 'rivalry_boost') {
      const rivalryKeys = Object.keys(G.rivalries || {});
      if (rivalryKeys.length > 0) {
        const key = rivalryKeys[0];
        const oldEntry = G.rivalries[key];
        const newRivalries = { ...G.rivalries, [key]: { ...oldEntry, matches: oldEntry.matches + eff.amount } };
        G = { ...G, rivalries: newRivalries };
      }
    }

    G = {
      ...G,
      milestones: { ...G.milestones, [evt.id]: true },
      milestoneBuffs: [...(G.milestoneBuffs || []), buff]
    };
    Storage.autoSave();
  },

  // v1.5s25b: milestoneBuffs の週カウントダウン（毎週processWeek後に呼ぶ）
  _tickMilestoneBuffsWeekly() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const newBuffs = G.milestoneBuffs
      .map(b => b.remainingWeeks != null ? { ...b, remainingWeeks: b.remainingWeeks - 1 } : b)
      .filter(b => b.remainingWeeks == null || b.remainingWeeks > 0);
    G = { ...G, milestoneBuffs: newBuffs };
  },

  // v1.5s25b: milestoneBuffs の興行カウントダウン（興行後に呼ぶ）
  _tickMilestoneBuffsShow() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const newBuffs = G.milestoneBuffs
      .map(b => b.remainingShows != null ? { ...b, remainingShows: b.remainingShows - 1 } : b)
      .filter(b => b.remainingShows == null || b.remainingShows > 0);
    G = { ...G, milestoneBuffs: newBuffs };
  },

  // v1.5s25b: weekly_funds バフの資金適用（毎週processWeek/closeShowResult後に呼ぶ）
  _applyWeeklyBuffEffects() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const weeklyFundsBuff = G.milestoneBuffs.find(b => b.type === 'weekly_funds');
    if (weeklyFundsBuff) {
      const amount = weeklyFundsBuff.amount || 0;
      G = { ...G, funds: G.funds + amount };
    }
  },

  // v2.0: 選択型イベントの選択結果を適用
  applyChoiceEvent(event, choiceIdx) {
    const choiceRng = Engine.rng.create(Engine.rng.derive(
      G.rngSeed, G.season, G.week, event && event.fighter || 0, 0xE0C1));
    const result = Engine.eventSystem.applyChoiceEffect(event, choiceIdx, G, choiceRng);
    // §13.3: __orgPop: イベントからorgPop変動を抽出して適用
    let orgPopDelta = 0;
    const displayEvents = [];
    (result.events || []).forEach(e => {
      if (typeof e === 'string' && e.startsWith('__orgPop:')) {
        orgPopDelta += parseFloat(e.replace('__orgPop:', ''));
      } else {
        displayEvents.push(e);
      }
    });
    // orgPop変動があればログに記録（__orgPop:はdisplayEventsから除外されるため、ログにも残らなかった）
    if (orgPopDelta !== 0) {
      displayEvents.push(`📉 団体人気${orgPopDelta >= 0 ? '+' : ''}${Math.round(orgPopDelta * 100) / 100}`);
    }
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      orgPop: Engine.util.clamp((G.orgPop || 0) + orgPopDelta, 0, 100),
      gameLog: [...(G.gameLog || []), ...displayEvents]
    };
    // 放出された選手をFA/dormantに振り分け
    if (result.departedFighters && result.departedFighters.length > 0) {
      for (const departed of result.departedFighters) {
        // orgTimeline記録
        const tracked = Engine.orgTimeline.transfer(departed, 'fa', G.season, G.week);
        // 退団bond/rivalry影響
        Engine.relationships.applyDepartureTrustImpact(G, departed.id, 'release', {});
        if (Engine.util.canAddToFA(G)) {
          G = { ...G, freeAgents: [...(G.freeAgents || []), tracked] };
        } else {
          G = Engine.util.redirectToDormantPool(G, tracked);
        }
      }
      // 王者が放出/退団した場合は王座を空位にする
      const vcCE = Engine.title.validateChampion(G);
      if (vcCE.msg) { G = { ...G, titles: vcCE.titles, gameLog: [...(G.gameLog || []), vcCE.msg] }; }
      // 退場者の後始末: コーチ担当から外す(直後の renderWeekScreen が自己修復を鳴らすため)
      G = { ...G, coachAssign: Engine.coach.sanitizeAssignments(G) };
    }
    Storage.autoSave();
    Audio.play('event');
    renderWeekScreen();
    // 結果をモーダルで表示（toastではなく）
    if (displayEvents.length > 0) {
      // 結果リアクション（吹き出し）取得 — E1 などで成功/推薦された選手のセリフを表示
      let resultReaction = null;
      try {
        if (Engine.eventSystem && typeof Engine.eventSystem.getChoiceResultDialogue === 'function') {
          const reactRng = Engine.rng.create(Engine.rng.derive((G.rngSeed || 1), (G.season || 0), (G.week || 0), 0xC401, choiceIdx));
          resultReaction = Engine.eventSystem.getChoiceResultDialogue(
            reactRng, event, choiceIdx, G.roster || [], result.recommendedAltId);
        }
      } catch (_) { /* 失敗時は吹き出しなしで続行 */ }
      showChoiceEventResult(event, displayEvents, G, { reaction: resultReaction });
    }
  },

  // v2.0 Phase1-6: 大型イベントUIフロー制御
  handleLargeEvent(event) {
    const largeEventAudioId = event && event.type === 'B3' ? 'B3_CHALLENGE' : null;
    let largeEventAudioActive = false;
    const openLargeEventAudio = () => {
      if (!largeEventAudioId || largeEventAudioActive) return;
      largeEventAudioActive = true;
      _factionAudioOpen(largeEventAudioId);
    };
    const closeLargeEventAudio = () => {
      if (!largeEventAudioId || !largeEventAudioActive) return;
      largeEventAudioActive = false;
      _factionAudioClose(largeEventAudioId);
    };
    if (largeEventAudioId) {
      App._largeEventAudioFinalize = closeLargeEventAudio;
      openLargeEventAudio();
    }
    // Step 0: 初期表示
    showLargeEventModal(event, G, 0, (choiceIdx) => {
      if (choiceIdx < 0) {
        closeLargeEventAudio();
        if (App._largeEventAudioFinalize === closeLargeEventAudio) App._largeEventAudioFinalize = null;
        return;
      }
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B2));
      const result = Engine.eventSystem.applyLargeEventEffect(event, 0, choiceIdx, G, rng);
      App._applyLargeEventResult(result);

      // B4タレント活動 / メディア密着取材: 選手選択後にセリフポップアップ表示
      // choiceIdx は選んだ選手ID(>0)。getLargeEventDialogue は event.activityType を見て
      // B4_{activityType} キーを内部で解決するため、type 上書きは不要。
      if (event.type === 'B4' && choiceIdx > 0) {
        const selectedFighter = G.roster.find(f => f.id === choiceIdx);
        if (selectedFighter) {
          const dlgRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4D1));
          const dlgEvent = { ...event, fighter: choiceIdx };
          let dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, dlgEvent, G.roster);
          // フォールバック: activityType 別キーで取れなかった場合は素の B4 を試す
          if (!dialogue && event.activityType) {
            dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, { ...event, fighter: choiceIdx, activityType: undefined }, G.roster);
          }
          if (!dialogue) dialogue = '…精一杯やります';
          const activityLabel = (typeof TALENT_ACTIVITY_LABELS !== 'undefined' && event.activityType)
            ? (TALENT_ACTIVITY_LABELS[event.activityType] || 'タレント活動')
            : '密着取材';
          // closeAndChoice 直後の overlay クローズ完了を確実にしてから表示
          setTimeout(() => showEventPopup({
            type: 'fighter', id: selectedFighter.id, name: selectedFighter.name,
            tone: 'gold', speech: dialogue,
            detail: `📺 ${event.outletName || 'メディア'}・${activityLabel}`,
          }), 250);
        }
      }

      if (result.nextStep === 1) {
        // B2: 介入選択 / B3: 代表選手選択
        setTimeout(() => {
          showLargeEventModal(event, G, 1, (choiceIdx2) => {
            if (choiceIdx2 < 0) {
              closeLargeEventAudio();
              if (App._largeEventAudioFinalize === closeLargeEventAudio) App._largeEventAudioFinalize = null;
              return;
            }
            const rng2 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B3));
            const result2 = Engine.eventSystem.applyLargeEventEffect(event, 1, choiceIdx2, G, rng2);
            App._applyLargeEventResult(result2);

            if (result2.nextStep === 2) {
              // B2: 試合シミュレーション / B3: 試合シミュレーション
              setTimeout(() => App._executeLargeEventMatch(event, result2), 300);
            } else {
              closeLargeEventAudio();
              if (App._largeEventAudioFinalize === closeLargeEventAudio) App._largeEventAudioFinalize = null;
            }
          });
        }, 300);
      } else {
        closeLargeEventAudio();
        if (App._largeEventAudioFinalize === closeLargeEventAudio) App._largeEventAudioFinalize = null;
      }
    });
  },

  // challenge-request-spec-v0.1 Phase 2: 挑戦試合打診UIフロー
  // YES → CD/クォータ更新 + 次回自団体興行への挿入予約（Phase 3, 2026-07-17: 即時解決から興行枠内挿入に変更）
  // NO  → CD延長 + 打診者 condition 一時悪化 + ティッカーセリフ
  handleChallengeRequest(payload) {
    if (!payload) return;
    if (typeof showChallengeRequestModal !== 'function') {
      // フォールバック: モーダル未読込時はクリアだけ
      G = Engine.challengeRequest.rejectPending(G);
      return;
    }
    const isInverse = !!payload._inverse;
    // 打診者の lookup helper（forward = player roster / inverse = AI org roster）
    const _findRequester = () => {
      if (isInverse) {
        const reqOrg = G.aiOrgs && G.aiOrgs[payload.requesterOrgId];
        return reqOrg && reqOrg.roster ? (reqOrg.roster.find(c => c.id === payload.selfId) || {}) : {};
      }
      return G.roster.find(c => c.id === payload.selfId) || {};
    };
    _factionAudioOpen('CHALLENGE_REQUEST');
    const finalizeCRAudio = () => _factionAudioClose('CHALLENGE_REQUEST');
    showChallengeRequestModal(payload, G, (choice, pickedIds) => {
      if (choice === 'YES') {
        const requesterFighter = _findRequester();
        const reqName = requesterFighter.name || '';
        if (!isInverse && Array.isArray(pickedIds) && pickedIds.length === 2) {
          G = { ...G, _awayTeamPick: pickedIds };
        }

        const proceedWithCard = () => {
          // 試合カード生成（味方/相手陣が足りなければ却下扱い）
          const card = Engine.challengeRequest.buildMatchCard(G);
          // away-flow-redesign CH-1b: buildMatchCard が消費した一時ピックは即座に破棄する
          // （セーブに残さない。inverse/未指定時はそもそもここで何もしない）
          if (G._awayTeamPick) { const { _awayTeamPick: _pick, ...rest } = G; G = rest; }
          if (!card) {
            G = Engine.challengeRequest.rejectPending(G);
            Storage.autoSave();
            Audio.play('error');
            renderWeekScreen && renderWeekScreen();
            showToast(`${reqName} の直訴を受けたが、メンバー編成が整わず実現できなかった。`);
            finalizeCRAudio();
            return;
          }
          // クォータ・CD更新
          G = Engine.challengeRequest.acceptPending(G);
          // 相手発信(inverse)は次回の自団体興行へ固定編成、
          // 自団体発信(forward)は次回通常興行週、自団体興行より先に敵地遠征として実施する。
          // ID のみ保持し、実際の対戦相手は executeShow 時点の最新roster/aiOrgsから再取得する
          // （数週先の興行になる可能性があり、その間に怪我・離脱で顔ぶれが変わり得るため）。
          const booking = {
            isInverse,
            requesterId: card.requesterId, opponentId: card.opponentId,
            requesterOrgId: card.requesterOrgId, opponentOrgId: card.opponentOrgId,
            requesterOrgName: card.requesterOrgName, opponentOrgName: card.opponentOrgName,
            teamAIds: card.teamA.map(f => f.id), teamBIds: card.teamB.map(f => f.id),
            acceptedSeason: G.season, acceptedWeek: G.week,
          };
          G = isInverse
            ? { ...G, _pendingIncomingChallengeMatch: booking }
            : { ...G, _pendingAwayChallengeMatch: booking };
          Storage.autoSave();

          const finishAccept = () => {
            // task-87: inverse は果たし状そのものが受理演出を兼ねる。重ねて受理通知を出さない。
            if (isInverse) {
              renderWeekScreen && renderWeekScreen();
              finalizeCRAudio();
              return;
            }
            Audio.play('event');
            showEventPopup({
              type: 'fighter', id: payload.selfId,
              name: reqName, tone: 'positive',
              message: `⚔ 直訴を受理。次の通常興行週、まず敵地へ向かう`,
              detail: `${reqName} らは次の自団体興行を組む前に、${card.opponentOrgName}の興行へ遠征する。`,
            });
            renderWeekScreen && renderWeekScreen();
            finalizeCRAudio();
          };

          // challenge-request-spec-v0.1 追加: YES 直後、直訴した本人の返事を頭上吹き出しで見せる
          if (!isInverse && typeof showChallengeSendoffModal === 'function' && Engine.challengeRequest.pickLine) {
            const sendoffRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC4A4, payload.selfId, payload.otherId));
            const sendoffLine = Engine.challengeRequest.pickLine(requesterFighter, 'sendoff', sendoffRng, card.opponentOrgName);
            if (sendoffLine) {
              showChallengeSendoffModal(requesterFighter, sendoffLine, G, card, finishAccept);
            } else {
              finishAccept();
            }
          } else {
            finishAccept();
          }
        };

        proceedWithCard();
      } else if (choice === 'NO') {
        G = Engine.challengeRequest.rejectPending(G);
        // 打診者の condition 一時悪化（次戦のパフォーマンスとセリフに反映）
        // forward: player roster の打診者 / inverse: AI org の打診者（AI 側の condition を悪化）
        if (isInverse) {
          const aiOrgs = { ...(G.aiOrgs || {}) };
          const reqOrg = aiOrgs[payload.requesterOrgId];
          if (reqOrg && Array.isArray(reqOrg.roster)) {
            const newAiRoster = reqOrg.roster.map(f =>
              f.id === payload.selfId
                ? { ...f, condition: Math.max(0, (f.condition != null ? f.condition : 70) - 8) }
                : f
            );
            aiOrgs[payload.requesterOrgId] = { ...reqOrg, roster: newAiRoster };
            G = { ...G, aiOrgs };
          }
        } else {
          const idx = (G.roster || []).findIndex(f => f.id === payload.selfId);
          if (idx >= 0) {
            const f = G.roster[idx];
            const newCondition = Math.max(0, (f.condition != null ? f.condition : 70) - 8);
            const newRoster = [...G.roster];
            newRoster[idx] = { ...f, condition: newCondition };
            G = { ...G, roster: newRoster };
          }
        }
        Storage.autoSave();
        Audio.play('click');
        renderWeekScreen && renderWeekScreen();
        const requester = _findRequester();
        const reqName = requester.name || '';
        // archetype 別ティッカーセリフ（CHALLENGE_REQUEST_NO_LINES から1行抽選）
        let noLine = `${reqName} の直訴を見送った。`;
        if (typeof CHALLENGE_REQUEST_NO_LINES !== 'undefined') {
          const arch = requester.archetype || 'standard';
          const arr = CHALLENGE_REQUEST_NO_LINES[arch] || CHALLENGE_REQUEST_NO_LINES.standard;
          if (arr && arr.length > 0) {
            const lineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, payload.selfId, 0xC4A2));
            const line = arr[Engine.rng.int(lineRng, 0, arr.length - 1)];
            noLine = `${reqName}: 「${line}」`;
          }
        }
        showToast(noLine);
        finalizeCRAudio();
      } else {
        // null = モーダルが表示不能(発起人/相手の不在)。以前は無条件で残置していたが、
        // 孤児化した打診は毎週「表示不能→残置」を繰り返して週次モーダル枠を恒久占有し、
        // 新規直訴と統一王座「こちらの番」を永久に堰き止める(2026-08-14 点火カタログR4で検出)。
        // エンジン側の実効性検査で取り下げる。actor が実在するのに null が来た場合(想定外)は
        // dropStalePending が pending を残すので、従来どおり翌週持ち越しになる(fail-open)
        const hadPending = !!(G.challengeRequest && G.challengeRequest.pendingThisWeek);
        G = Engine.challengeRequest.dropStalePending(G);
        if (hadPending && !(G.challengeRequest && G.challengeRequest.pendingThisWeek)) {
          console.warn('[WM][challenge-request] 表示不能の直訴を取り下げ(発起人/相手が不在)', {
            selfId: payload.selfId, otherId: payload.otherId,
            inverse: isInverse, issuedSeason: payload.issuedSeason, issuedWeek: payload.issuedWeek,
          });
          Storage.autoSave();
        }
        finalizeCRAudio();
      }
    });
  },

  // care-rework v0.1 §3.4 P4: 招聘の過程イベント(中間報告/衝突/延長打診/卒業レポート)を順次表示。
  // G._pendingInviteEvents は tickWeek のたびに積まれる可能性があるため、_drainArchetypeTransitions
  // と同じ「キューを取り出してから1件ずつ next() で消化する」パターンに従う。
  _drainInviteEvents() {
    if (!G || !G._pendingInviteEvents || !G._pendingInviteEvents.length) return;
    const queue = [...G._pendingInviteEvents];
    const { _pendingInviteEvents: _, ...rest } = G;
    G = rest;
    const next = () => {
      const head = queue.shift();
      if (!head) return;
      if (head.type === 'midterm') {
        if (typeof showInviteMidtermPopup !== 'function') { next(); return; }
        showInviteMidtermPopup(head, G, next);
      } else if (head.type === 'conflict') {
        if (typeof showInviteConflictModal !== 'function') { next(); return; }
        showInviteConflictModal(head, G, (choice) => {
          if (choice === 'continue' || choice === 'cancel') {
            const result = Engine.shachoshitsu.resolveInviteConflict(G, head.fighterId, choice);
            if (!result.error) {
              G = { ...G, roster: result.roster };
              if (result.coachAssign) G = { ...G, coachAssign: result.coachAssign };
              if (result.events && result.events.length > 0) {
                G = { ...G, gameLog: [...(G.gameLog || []), ...result.events] };
              }
              Storage.autoSave();
              renderWeekScreen && renderWeekScreen();
            }
          }
          next();
        });
      } else if (head.type === 'extension') {
        if (typeof showInviteExtensionModal !== 'function') { next(); return; }
        showInviteExtensionModal(head, G, (choice) => {
          const accept = choice === 'accept';
          const result = Engine.shachoshitsu.resolveInviteExtension(G, head.fighterId, accept);
          if (!result.error) {
            G = {
              ...G,
              roster: result.roster,
              funds: result.funds,
              decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
            };
            Storage.autoSave();
            renderWeekScreen && renderWeekScreen();
          } else if (result.error === 'funds_insufficient') {
            showToast('資金が足りません');
          } else if (result.error === 'decision_points_insufficient') {
            showToast('決裁枠が足りません');
          }
          next();
        });
      } else if (head.type === 'graduation') {
        if (typeof showInviteGraduationModal !== 'function') { next(); return; }
        showInviteGraduationModal(head, G, next);
      } else {
        next();
      }
    };
    next();
  },

  // Phase 3a: 派閥イベントUIフロー制御（F01/F02/F03）
  handleFactionEvent(event) {
    const { eventId, payload } = event;
    // 結果モーダル「閉じる」時に stinger + BGM fadeOut + 通常 BGM 復帰
    const finalizeAudio = () => _factionAudioClose(eventId);
    if (eventId === 'F01') {
      _factionAudioOpen(eventId);
      showFactionF01Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA13));
        const result = Engine.factions.applyF01Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥成立（A=旗揚げ, C=静観で結成）
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionFormed',
            characterId: payload.leaderId,
            data: { org: G.orgName || 'プレイヤー団体', leaderName: payload.leaderName || '?' },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'F01',
          category: '派閥成立',
          resultText: result.resultText,
          charId: payload.leaderId,
          charName: leader ? leader.name : payload.leaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02') {
      _factionAudioOpen(eventId);
      showFactionF02Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA23));
        const result = Engine.factions.applyF02Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥抗争勃発（A=煽る / C=介入しない で抗争表面化）
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionEscalation',
            characterId: payload.leaderAId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionAName: payload.factionAName || '?',
              factionBName: payload.factionBName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leaderA = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'F02',
          category: '派閥抗争',
          resultText: result.resultText,
          charId: payload.leaderAId,
          charName: leaderA ? leaderA.name : payload.leaderAName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_PEACE') {
      // v4 §2-1: F02② 沈静化（通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionF02PeaceModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA27));
        const result = Engine.factions.applyF02PeaceResult(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 抗争沈静化
        App._pushIndustryNews({
          type: 'factionPeace',
          characterId: null,
          data: {
            org: G.orgName || 'プレイヤー団体',
            factionAName: payload.factionAName || '?',
            factionBName: payload.factionBName || '?',
          },
        });
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        showFactionEventResult({
          eventId: 'F02_PEACE',
          category: '抗争沈静化',
          resultText: result.resultText,
          factionName: payload.factionAName || payload.factionBName || '派閥',
          factionTone: 'allied',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_IGNITE') {
      // v4 §2-1: F02① 発火（興行開始時、通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionF02IgniteModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA26));
        const result = Engine.factions.applyF02IgniteResult(G, payload, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        showFactionEventResult({
          eventId: 'F02_IGNITE',
          category: '抗争発火',
          resultText: result.resultText,
          factionName: payload.factionAName || payload.factionBName || '派閥',
          factionTone: 'hostile',
          factionPair: [
            {
              factionName: payload.factionAName,
              leaderId: payload.leaderAId,
              leaderName: payload.leaderAName,
              sideLabel: '抗争側',
            },
            {
              factionName: payload.factionBName,
              leaderId: payload.leaderBId,
              leaderName: payload.leaderBName,
              sideLabel: '対抗側',
            },
          ],
          reporterText: `${payload.factionAName || '派閥'}と${payload.factionBName || '派閥'}のリーダー対決を、今週のメインイベントとして公式戦に組みました`,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_RESOLUTION') {
      // v4 §2-1: F02③ 決着（試合直後、通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionF02ResolutionModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA24));
        const result = Engine.factions.applyF02ResolutionResult(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥抗争決着
        App._pushIndustryNews({
          type: 'factionResolution',
          characterId: payload.winnerId || null,
          data: {
            org: G.orgName || 'プレイヤー団体',
            winFaction: payload.winnerFactionName || payload.factionAName || '?',
            loseFaction: payload.loserFactionName || payload.factionBName || '?',
            loseLeader: payload.loseLeaderName || payload.leaderBName || '?',
          },
        });
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const winner = (G.roster || []).find(c => c.id === payload.winnerId);
        showFactionEventResult({
          eventId: 'F02_RESOLUTION',
          category: '抗争決着',
          resultText: result.resultText,
          charId: payload.winnerId,
          charName: winner ? winner.name : payload.winnerName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_ENDLESS') {
      // v4 §2-1: F02④ 無限抗争（通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionF02EndlessModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA25));
        const result = Engine.factions.applyF02EndlessResult(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 無限抗争
        App._pushIndustryNews({
          type: 'factionEndless',
          characterId: null,
          data: {
            org: G.orgName || 'プレイヤー団体',
            factionAName: payload.factionAName || '?',
            factionBName: payload.factionBName || '?',
          },
        });
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        showFactionEventResult({
          eventId: 'F02_ENDLESS',
          category: '無限抗争',
          resultText: result.resultText,
          factionName: payload.factionAName || payload.factionBName || '派閥',
          factionTone: 'hostile',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F03') {
      _factionAudioOpen(eventId);
      showFactionF03Modal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA33));
        const result = Engine.factions.applyF03Result(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥消滅 (branch === 'dissolution' / 後継者なし)
        if (payload.branch === 'dissolution') {
          const fac = (G.factions || []).find(f => f.id === payload.factionId);
          App._pushIndustryNews({
            type: 'factionDissolution',
            characterId: null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionName: payload.factionName || (fac && fac.name) || '?',
              leaderName: payload.oldLeaderName || '?',
            },
          });
        } else if (payload.branch === 'succession' || payload.branch === 'turmoil') {
          // 業界ニュース: 後継リーダー就任（動揺含み turmoil も外から見れば代替わり）
          App._pushIndustryNews({
            type: 'factionSuccession',
            characterId: payload.successorId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionName: payload.factionName || '?',
              newLeaderName: payload.successorName || '?',
              oldLeaderName: payload.oldLeaderName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const newLeader = payload.newLeaderId ? (G.roster || []).find(c => c.id === payload.newLeaderId) : null;
        showFactionEventResult({
          eventId: 'F03',
          category: 'リーダー喪失',
          resultText: result.resultText,
          charId: payload.newLeaderId || null,
          charName: newLeader ? newLeader.name : (payload.newLeaderName || ''),
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F04') {
      _factionAudioOpen(eventId);
      showFactionF04Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA14));
        const result = Engine.factions.applyF04Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 寝返り成立（A=転籍のみ。慰留・告げ口の未遂は外から見えないので載せない）
        if (choiceId === 'A') {
          App._pushIndustryNews({
            type: 'factionDefection',
            characterId: payload.targetId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              targetName: payload.targetName || '?',
              fromFaction: payload.fromFactionName || '?',
              toFaction: payload.toFactionName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const target = (G.roster || []).find(c => c.id === payload.targetId);
        showFactionEventResult({
          eventId: 'F04',
          category: '移籍',
          resultText: result.resultText,
          charId: payload.targetId,
          charName: target ? target.name : payload.targetName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F05H') {
      // F05H 活動休止（通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionHiatusModal(payload, G, () => {
        const result = Engine.factions.applyF05HResult(G, payload);
        G = { ...result.state };
        // 業界ニュース: 活動休止
        App._pushIndustryNews({
          type: 'factionHiatus',
          characterId: payload.leaderId || null,
          data: {
            org: G.orgName || 'プレイヤー団体',
            factionName: payload.factionName || '?',
            leaderName: payload.leaderName || '?',
          },
        });
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leaderH = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'F05H',
          category: '活動休止',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leaderH ? leaderH.name : payload.leaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F05') {
      _factionAudioOpen(eventId);
      showFactionF05Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA15));
        const result = Engine.factions.applyF05Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥分裂（A=放任 で natural split が発生する経路想定）
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionSplit',
            characterId: payload.ringleaderId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionName: payload.factionName || '?',
              ringleaderName: payload.ringleaderName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const ringleader = (G.roster || []).find(c => c.id === payload.ringleaderId);
        showFactionEventResult({
          eventId: 'F05',
          category: '派閥分裂',
          resultText: result.resultText,
          charId: payload.ringleaderId || null,
          charName: ringleader ? ringleader.name : payload.ringleaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F06') {
      _factionAudioOpen(eventId);
      showFactionF06Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA16));
        const result = Engine.factions.applyF06Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 和解成立（A=仲裁のみ）
        if (choiceId === 'A') {
          App._pushIndustryNews({
            type: 'factionReconcile',
            characterId: payload.leaderAId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionAName: payload.factionAName || '?',
              factionBName: payload.factionBName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader6 = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'F06',
          category: '同盟締結',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leader6 ? leader6.name : payload.leaderAName,
          factionName: payload.factionAName || payload.factionBName || '',
          factionTone: 'allied',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'F07') {
      _factionAudioOpen(eventId);
      showFactionF07Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA17));
        const result = Engine.factions.applyF07Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        // v0.4 新シグネチャ: incidentType × choice × personality でリーダー反応セリフを構成
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        const target = payload.incidentPayload && payload.incidentPayload.targetId
          ? (G.roster || []).find(c => c.id === payload.incidentPayload.targetId)
          : null;
        const vars = {
          factionName: payload.factionName || '',
          leaderName: payload.leaderName || (leader ? leader.name : ''),
          targetName: target ? target.name : (payload.incidentPayload && payload.incidentPayload.targetName) || '',
        };
        const charLine = (Engine.factions.getF07Line)
          ? Engine.factions.getF07Line('resultLeader', { incidentType: payload.incidentType, choice: choiceId, fighter: leader, vars })
          : '';
        const targetLine = (Engine.factions.getF07Line)
          ? Engine.factions.getF07Line('resultTarget', { incidentType: payload.incidentType, choice: choiceId, vars })
          : '';
        const fullResultText = targetLine ? `${result.resultText}\n${targetLine}` : result.resultText;
        showFactionEventResult({
          eventId: 'F07',
          category: '派閥動向',
          resultText: fullResultText,
          charId: payload.leaderId,
          charName: leader ? leader.name : payload.leaderName,
          charLine,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F08') {
      _factionAudioOpen(eventId);
      showFactionF08Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA18));
        const result = Engine.factions.applyF08Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: リーダー直接対決の決定（A=次興行メインに据える）
        if (choiceId === 'A') {
          App._pushIndustryNews({
            type: 'factionShowdown',
            characterId: payload.leaderAId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionAName: payload.factionAName || '?',
              factionBName: payload.factionBName || '?',
              leaderAName: payload.leaderAName || '?',
              leaderBName: payload.leaderBName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader8 = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'F08',
          category: '直接対決',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leader8 ? leader8.name : payload.leaderAName,
          factionName: payload.factionAName || payload.factionBName || '',
          factionTone: 'hostile',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_1') {
      // 発火後に年替わり・退団などで対象がいなくなった保留イベントは、
      // 名前だけ残った空カードにせず取り消す。
      const common1Fighters = (Engine.factions && Engine.factions.resolveCommon1Fighters)
        ? Engine.factions.resolveCommon1Fighters(G, payload)
        : (() => {
          const roster = G.roster || [];
          const find = id => roster.find(c => c && String(c.id) === String(id)) || null;
          const fighterA = find(payload.fighterAId);
          const fighterB = find(payload.fighterBId);
          return { fighterA, fighterB, valid: !!(fighterA && fighterB) };
        })();
      if (!common1Fighters.valid) {
        wmDiag('[WM Faction] Common-1 cancelled: a deferred opponent is no longer in the roster');
        showToast('派閥内対決は、対象選手の在籍状況が変わったため取り消されました');
        finalizeAudio();
        return;
      }
      _factionAudioOpen(eventId);
      showFactionCommon1Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC1));
        const result = Engine.factions.applyCommon1Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        // task-79: A選択は即時試合ではなく興行予約(G.bookedCommon1)を作るだけ。
        // 「試合を組んだ」ことの案内は通常の派閥イベント結果バナーで済ませ、
        // 実際の試合とその清算(因縁-30〜-50)は予約消化された興行の結果表示側で行う。
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_1',
          category: '派閥内対決',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : '',
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_5') {
      _factionAudioOpen(eventId);
      showFactionCommon5Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC5));
        const result = Engine.factions.applyCommon5Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: メディア特集（A=取材を受けたときのみ）
        if (choiceId === 'A') {
          App._pushIndustryNews({
            type: 'factionMediaFeature',
            characterId: payload.leaderId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionName: payload.factionName || '?',
              leaderName: payload.leaderName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_5',
          category: 'メディア取材',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : payload.leaderName,
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_7') {
      _factionAudioOpen(eventId);
      showFactionCommon7Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC7));
        const result = Engine.factions.applyCommon7Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 業界ニュース: 合同企画の開催（A=乗ったときのみ）
        if (choiceId === 'A') {
          App._pushIndustryNews({
            type: 'factionJointProject',
            characterId: payload.leaderAId || null,
            data: {
              org: G.orgName || 'プレイヤー団体',
              factionAName: payload.factionAName || '?',
              factionBName: payload.factionBName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leaderA = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'COMMON_7',
          category: '派閥合同企画',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leaderA ? leaderA.name : payload.leaderAName,
          factionName: payload.factionAName || payload.factionBName || '',
          factionTone: 'allied',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_4') {
      // 派閥合宿・慰労会（通知のみ・選択肢なし）
      _factionAudioOpen(eventId);
      showFactionCommon4Modal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC4));
        const result = Engine.factions.applyCommon4Result(G, payload, rng);
        G = { ...result.state };
        // 業界ニュース: 派閥合宿
        App._pushIndustryNews({
          type: 'factionCamp',
          characterId: payload.leaderId || null,
          data: {
            org: G.orgName || 'プレイヤー団体',
            factionName: payload.factionName || '?',
          },
        });
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_4',
          category: '派閥合宿',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : payload.leaderName,
          factionName: payload.factionName || '',
          factionTone: 'neutral',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
          state: G,
        }, finalizeAudio);
      });
    }
  },

  // 大型イベント: VS対峙画面表示（試合はまだ実行しない）
  _executeLargeEventMatch(event, prevResult) {
    if (event.type === 'B2') {
      const intervention = prevResult.interventionChoice; // 0=f1, 1=f2, 2=neutral
      let f1 = G.roster.find(f => f.id === event.fighter1);
      let f2 = G.roster.find(f => f.id === event.fighter2);
      if (!f1 || !f2) return;

      // 介入バフの適用（一時的コピー）
      const f1Buffed = { ...f1 };
      const f2Buffed = { ...f2 };
      if (intervention === 0) {
        f1Buffed.pw = (f1.pw || 50) + 5; f1Buffed.sp = (f1.sp || 50) + 5;
        f1Buffed.te = (f1.te || 50) + 5; f1Buffed.st = (f1.st || 50) + 5;
      } else if (intervention === 1) {
        f2Buffed.pw = (f2.pw || 50) + 5; f2Buffed.sp = (f2.sp || 50) + 5;
        f2Buffed.te = (f2.te || 50) + 5; f2Buffed.st = (f2.st || 50) + 5;
      }

      App._b2Preview = {
        event, f1: f1Buffed, f2: f2Buffed, f1Original: f1, f2Original: f2,
        interventionChoice: intervention, watching: false, matchResult: null, prevResult
      };
      _renderB2MatchPreview(event, f1Buffed, f2Buffed, intervention);

    } else if (event.type === 'B3') {
      const fighterId = prevResult.selectedFighterId;
      const playerFighter = G.roster.find(f => f.id === fighterId);
      const finalizeAudio = App._largeEventAudioFinalize;
      if (!playerFighter) {
        if (finalizeAudio) finalizeAudio();
        if (App._largeEventAudioFinalize === finalizeAudio) App._largeEventAudioFinalize = null;
        return;
      }
      const challenger = event.challenger;
      if (!challenger) {
        if (finalizeAudio) finalizeAudio();
        if (App._largeEventAudioFinalize === finalizeAudio) App._largeEventAudioFinalize = null;
        return;
      }

      // 挑戦状を受けた時点では試合を行わず、次の通常興行のメインへ予約する。
      // 特別興行・PPVには割り込ませない。
      G = {
        ...G,
        _pendingIncomingB3Match: {
          event,
          prevResult,
          fighterId,
          challenger: { ...challenger },
          orgId: event.orgId || challenger.orgId || null,
          orgName: event.orgName || challenger.orgName || '相手団体',
          acceptedSeason: G.season,
          acceptedWeek: G.week,
        },
      };
      if (finalizeAudio) finalizeAudio();
      if (App._largeEventAudioFinalize === finalizeAudio) App._largeEventAudioFinalize = null;
      Storage.autoSave();
      showEventPopup({
        type: 'fighter', id: fighterId,
        name: playerFighter.name, tone: 'positive',
        message: '📨 挑戦試合を正式決定',
        detail: `${playerFighter.name} vs ${challenger.name} は、次の通常興行のメインイベントで行われます。`,
      });
      renderWeekScreen();
    }
  },

  // B3: 試合を観る
  b3WatchMatch() {
    const b3 = App._b3Preview;
    if (!b3) return;
    b3.watching = true;

    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const pf = b3.playerFighter;
    const af = b3.challenger;
    // Replay: 結果事前計算 (skip と同 seed: 0xB1B4 + 代表選手ID)
    const b3Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4, pf.id));
    const b3RawResult = Engine.battle.simulateMatch(
      pf, af, b3Rng, 2, { recordFrames: true, popularityInfluence: 0.35 });
    const b3Finalized = Engine.mq.finalize(G, b3RawResult, {
      path: 'App.b3WatchMatch',
      matchType: 'singles',
      participantFighters: [pf, af],
    }, 'raw');
    const b3Result = {
      ...b3RawResult,
      mq: b3Finalized.mq,
      mqInventory: b3Finalized.mqInventory,
    };
    b3._preResult = b3Result;
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...pf,
        portraitUrl: getPortraitUrl(pf.id), profile: CHAR_PROFILES[pf.id] || '',
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['…！']
      },
      right: {
        ...af,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: App._buildVlVsPlayerForExEmployee(af, G.season, G.week, pf.orgId),
        vsExHit: App._buildVsExHitLines(af, G.season, G.week, pf.orgId)
      },
      matchInfo: {
        header: '⚔ 挑戦状',
        subHeader: `${pf.name} vs ${af.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, pf.id, af.id); return rl ? rl.tier : 0; })(),
        leftPersonality: pf.personality || 'normal', leftArchetype: pf.archetype || 'standard',
        rightPersonality: af.personality || 'normal', rightArchetype: af.archetype || 'standard',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: b3Result,
    };
    try { Audio.bgm.playStage('bigMatch'); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles系は必ず battle-engine.html（タッグ観戦で tag-battle.html に切替わっていても戻す）
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // B3: スキップ
  b3SkipMatch() {
    const b3 = App._b3Preview;
    if (!b3) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4, b3.playerFighter.id));
    const rawResult = Engine.battle.simulateMatch(
      b3.playerFighter, b3.challenger, rng, 2, { popularityInfluence: 0.35 });
    const finalized = Engine.mq.finalize(G, rawResult, {
      path: 'App.b3SkipMatch',
      matchType: 'singles',
      participantFighters: [b3.playerFighter, b3.challenger],
    }, 'raw');
    const matchResult = {
      ...rawResult,
      mq: finalized.mq,
      mqInventory: finalized.mqInventory,
    };
    b3.matchResult = matchResult;
    App._finalizeB3Match(matchResult);
  },

  // B3: iframe結果受信
  _receiveB3BattleResult(data) {
    const b3 = App._b3Preview;
    if (!b3) return;
    b3.watching = false;
    // Replay: 事前計算結果を正とする
    const matchResult = b3._preResult || {
      winner: data.winner,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0, mq: data.mq || 50,
      hpLeft: { final: data.hpLeft ? (data.hpLeft.current != null ? data.hpLeft.current : data.hpLeft.final) : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
      hpRight: { final: data.hpRight ? (data.hpRight.current != null ? data.hpRight.current : data.hpRight.final) : 0, max: data.hpRight ? data.hpRight.max : 100 },
      log: data.log || []
    };
    b3.matchResult = matchResult;
    // BGMフェードアウト
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    playMatchResultSe(b3.playerFighter, b3.challenger,
      matchResult.winner === 'right' ? 'right' : matchResult.winner === 'draw' ? 'draw' : 'left');
    App.restoreBgmForState(1600);
    App._finalizeB3Match(matchResult);
  },

  // B3: 結果適用 + 結果画面表示
  _finalizeB3Match(matchResult) {
    const b3 = App._b3Preview;
    if (!b3) return;
    const { event, playerFighter, challenger } = b3;
    const fighterId = playerFighter.id;
    G = Engine.mq.updateRecord(G, matchResult, {
      holderIds: [playerFighter.id, challenger.id],
      orgId: null,
      stage: 'event',
    }).state;

    // 結果をeventに添付して Step 2 を適用
    const enrichedEvent = { ...event, matchResult, selectedFighterId: fighterId };
    const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B6));
    const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
    App._applyLargeEventResult(result3);

    // B3: 他団体戦 applyMatchResult（isCrossOrg=true でrivalryブースト）
    if (G.relationships) {
      const b3RelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE5C));
      const b3Context = {
        mq: matchResult.mq,
        winner: matchResult.winner === 'left' ? 'win' : (matchResult.winner === 'right' ? 'lose' : 'draw'),
        hpA: matchResult.hpLeft, hpB: matchResult.hpRight,
        turns: matchResult.turns,
        stage: 'normal', isTitleMatch: false, rivalryResolved: false, injuredId: null,
        isCareerBestA: matchResult.mq > (playerFighter.careerBestMQ || 0),
        isCareerBestB: false,
        losingStreakA: playerFighter.losingStreak || 0, losingStreakB: 0,
        ovrA: Engine.util.ov(playerFighter), ovrB: Engine.util.ov(challenger),
        isCrossOrg: true, isChallengeShowMatch: true,
      };
      G = Engine.relationships.applyMatchResult(G, fighterId, challenger.id, b3Context, b3RelRng);
    }

    // ブレークスルー判定（挑戦状は isWarMatch=true）
    const btRngB3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB3B8));
    const won = matchResult.winner === 'left';
    const oppOvr = Engine.util.ov(challenger);
    const btCtx = { isTitle: false, won, isPPV: false, isRivalryResolution: false, isWarMatch: true };
    const btResultB3 = Engine.growthEvents.checkAndApplyBreakthrough(
      btRngB3, playerFighter, matchResult.mq, oppOvr, btCtx, G.season, G.week, Engine.coach.getFlavorBreakthroughMult(G, playerFighter.id)
    );
    if (btResultB3) {
      G = { ...G, roster: G.roster.map(c => c.id === fighterId ? btResultB3.fighter : c) };
      const updF = G.roster.find(c => c.id === fighterId);
      if (matchResult.mq > (updF.careerBestMQ || 0)) {
        G = { ...G, roster: G.roster.map(c => c.id === fighterId ? { ...c, careerBestMQ: matchResult.mq } : c) };
      }
      if (G.relationships) {
        const btRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE57, fighterId));
        G = Engine.relationships.applyBreakthroughEffect(G, fighterId, btRelRng);
      }
      const btHintFighterB3 = G.roster.find(c => c.id === fighterId) || playerFighter;
      const btHintLineB3 = pickDialogueLine(BT_HINT_LINES, btHintFighterB3);
      setTimeout(() => showGrowthEventPopups([{
        type: 'breakthrough', fighterId,
        stat: btResultB3.stat, gain: btResultB3.gain, hotStreak: btResultB3.hotStreak,
        btHint: btHintLineB3
      }]), 600);
    } else {
      if (matchResult.mq > (playerFighter.careerBestMQ || 0)) {
        G = { ...G, roster: G.roster.map(c => c.id === fighterId ? { ...c, careerBestMQ: matchResult.mq } : c) };
      }
    }

    // 金銭バランス改善: 挑戦状メディア収入
    const b3VenueIdx = G.showVenue || 0;
    const b3VenueMult = VENUE_MEDIA_MULT[b3VenueIdx] || 1.0;
    const b3MediaRev = Math.round(
      Math.min(matchResult.mq, 100) * MEDIA_CONFIG.eventPerMQ * b3VenueMult * 1.0);
    if (b3MediaRev > 0) {
      const b3MediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
      b3MediaIncomes.push({ amount: b3MediaRev, label: `挑戦状 vs ${event.orgName}` });
      G = { ...G, _pendingMediaIncomes: b3MediaIncomes };
    }

    // 新聞パネルイベント
    const newsType = matchResult.winner === 'left' ? 'interPromoWin' : (matchResult.winner === 'right' ? 'interPromoLoss' : 'interPromoDraw');
    App._pushNewsEvent({ type: newsType, data: { orgName: event.orgName, fighterName: playerFighter.name, challengerName: challenger.name } });

    // 結果画面表示
    setTimeout(() => _renderB3MatchResult(event, matchResult, playerFighter, challenger), 300);
  },

  // B3: 結果画面を閉じる
  closeB3Result() {
    const overlay = document.getElementById('showResultOverlay');
    overlay.classList.remove('active');
    const b3 = App._b3Preview;
    const finalizeClose = () => {
      const finalizeAudio = b3 && b3.finalizeAudio;
      App._b3Preview = null;
      Audio.play('event');
      if (finalizeAudio) finalizeAudio();
      else App.restoreBgmForState();
      renderWeekScreen();
    };
    if (b3 && typeof showB3OpponentAftermath === 'function') {
      showB3OpponentAftermath(b3.event, b3.matchResult, finalizeClose);
      return;
    }
    finalizeClose();
  },

  // B2: 試合を観る
  b2WatchMatch() {
    const b2 = App._b2Preview;
    if (!b2) return;
    b2.watching = true;

    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const f1 = b2.f1, f2 = b2.f2;
    // Replay: 結果事前計算 (skip と同 seed: 0xB1B4)
    const b2Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const b2RawResult = Engine.battle.simulateMatch(
      { ...f1, condition: 80 }, { ...f2, condition: 80 },
      b2Rng, 2, { recordFrames: true });
    const b2Finalized = Engine.mq.finalize(G, b2RawResult, {
      path: 'App.b2WatchMatch',
      matchType: 'singles',
      participantFighters: [f1, f2],
    }, 'raw');
    const b2Result = {
      ...b2RawResult,
      mq: b2Finalized.mq,
      mqInventory: b2Finalized.mqInventory,
    };
    b2._preResult = b2Result;
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...f1, condition: 80,
        portraitUrl: getPortraitUrl(f1.id), profile: CHAR_PROFILES[f1.id] || '',
        vl: f1.voiceLines || f1.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[f1.id]) || ['…！']
      },
      right: {
        ...f2, condition: 80,
        portraitUrl: getPortraitUrl(f2.id), profile: CHAR_PROFILES[f2.id] || '',
        vl: f2.voiceLines || f2.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[f2.id]) || ['…！']
      },
      matchInfo: {
        header: '💥 決着の試合',
        subHeader: `${f1.name} vs ${f2.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, f1.id, f2.id); return rl ? rl.tier : 0; })(),
        leftPersonality: f1.personality || 'normal', leftArchetype: f1.archetype || 'standard',
        rightPersonality: f2.personality || 'normal', rightArchetype: f2.archetype || 'standard',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: b2Result,
    };
    try { Audio.bgm.playStage('bigMatch'); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles系は必ず battle-engine.html（タッグ観戦で tag-battle.html に切替わっていても戻す）
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // B2: スキップ
  b2SkipMatch() {
    const b2 = App._b2Preview;
    if (!b2) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const rawResult = Engine.battle.simulateMatch(b2.f1, b2.f2, rng, 2);
    const finalized = Engine.mq.finalize(G, rawResult, {
      path: 'App.b2SkipMatch',
      matchType: 'singles',
      participantFighters: [b2.f1, b2.f2],
    }, 'raw');
    const matchResult = {
      ...rawResult,
      mq: finalized.mq,
      mqInventory: finalized.mqInventory,
    };
    b2.matchResult = matchResult;
    App._finalizeB2Match(matchResult);
  },

  // B2: iframe結果受信
  _receiveB2BattleResult(data) {
    const b2 = App._b2Preview;
    if (!b2) return;
    b2.watching = false;
    // Replay: 事前計算結果を正とする
    const matchResult = b2._preResult || {
      winner: data.winner,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0, mq: data.mq || 50,
      hpLeft: { final: data.hpLeft ? (data.hpLeft.current != null ? data.hpLeft.current : data.hpLeft.final) : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
      hpRight: { final: data.hpRight ? (data.hpRight.current != null ? data.hpRight.current : data.hpRight.final) : 0, max: data.hpRight ? data.hpRight.max : 100 },
      log: data.log || []
    };
    b2.matchResult = matchResult;
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    playMatchResultSe(b2.f1, b2.f2,
      matchResult.winner === 'right' ? 'right' : matchResult.winner === 'draw' ? 'draw' : 'left');
    App.restoreBgmForState(1600);
    App._finalizeB2Match(matchResult);
  },

  // B2: 結果適用 + 結果画面表示
  _finalizeB2Match(matchResult) {
    const b2 = App._b2Preview;
    if (!b2) return;
    const { event, interventionChoice } = b2;
    const winner = matchResult.winner === 'left' ? 'fighter1' : (matchResult.winner === 'right' ? 'fighter2' : 'draw');
    G = Engine.mq.updateRecord(G, matchResult, {
      holderIds: [b2.f1.id, b2.f2.id],
      orgId: 'player',
      stage: 'event',
    }).state;

    // 結果をeventに添付して Step 2 を適用
    const enrichedEvent = { ...event, matchResult: { ...matchResult, winner }, interventionChoice };
    const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B5));
    const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
    App._applyLargeEventResult(result3);

    // 結果画面表示
    setTimeout(() => _renderB2MatchResult(event, matchResult, b2.f1, b2.f2, interventionChoice), 300);
  },

  // B2: 結果画面を閉じる
  closeB2Result() {
    const overlay = document.getElementById('showResultOverlay');
    overlay.classList.remove('active');
    App._b2Preview = null;
    Audio.play('event');
    App.restoreBgmForState();
    renderWeekScreen();
  },

  // 大型イベント結果をstateに反映するヘルパー
  _applyLargeEventResult(result) {
    const updates = {};
    if (result.roster) updates.roster = result.roster;
    if (result.funds !== undefined) updates.funds = result.funds;
    if (result.lockerRoomMorale !== undefined) updates.lockerRoomMorale = result.lockerRoomMorale;
    if (result.mediaSpotlight !== undefined) updates.mediaSpotlight = result.mediaSpotlight;
    if (result.lastLargeEventWeek !== undefined) updates.lastLargeEventWeek = result.lastLargeEventWeek;
    if (result.lastB3ChallengeWeek !== undefined) updates.lastB3ChallengeWeek = result.lastB3ChallengeWeek;
    if (result.orgPopDelta) updates.orgPop = G.orgPop + result.orgPopDelta;
    if (result.battlePoints) updates.battlePoints = result.battlePoints;
    // Phase 4: E-02/E-03 大型イベントの関係値反映
    if (result.relationships) updates.relationships = result.relationships;
    if (result.relationshipCounters) updates.relationshipCounters = result.relationshipCounters;
    // MVPレース v2: B3 辞退時の AI挑戦者への履歴追加など
    if (result.aiOrgs) updates.aiOrgs = result.aiOrgs;
    if (result.events && result.events.length > 0) {
      updates.gameLog = [...(G.gameLog || []), ...result.events];
    }
    G = { ...G, ...updates };
    Storage.autoSave();
    if (result.events && result.events.length > 0) {
      showToast(result.events[result.events.length - 1]);
    }
  },

  // 社長室 Phase 5: 選手ポップアップから「声をかける」(encourage)
  // 決裁枠も資金も消費しない。社長自らが足を運ぶ自発的行動。
  // 発動条件: slump/motivationLoss 中 OR 信頼が揺らぎ始めた(trust<50)
  // UI 側で 2段階の温度感(is-urgent: slump/motivLoss/trust<40, is-gentle: trust<50)
  encourageFighter(fighterId) {
    const target = G.roster.find(f => f.id === fighterId);
    if (!target) { showToast('選手が見つかりません'); return; }
    if (target.isRental || target.injury) { showToast('今は声をかけられない'); return; }
    const targetTrust = target.trust != null ? target.trust : 50;
    if (!target.slump && !target.motivationLoss && targetTrust >= 50) {
      showToast('この選手には今、声をかける理由がない');
      return;
    }
    // cooldown チェック(選手単位、1週)
    const lastUsed = (target._decisionWeekUsed || {}).encourage || -99;
    if ((G.week - lastUsed) < 1) { showToast('今週はもう声をかけた'); return; }

    // Engine.shachoshitsu.execute を再利用(決裁枠0の書類なので dp 消費なし)
    const result = Engine.shachoshitsu.execute('encourage', fighterId, G);
    if (!result || result.error) {
      const msg = {
        doc_not_found: 'この行動は現在利用できません',
        fighter_not_found: '選手が見つかりません',
        not_needed: 'この選手には今、声をかける理由がない',
        not_slump: 'この選手には今、声をかける理由がない',  // 旧エラーIDの互換
        cooldown: '今週はもう声をかけた',
        condition_not_met: '声をかける状況ではない',
        funds_insufficient: '資金が不足しています',
      }[result?.error] || '失敗しました';
      showToast(msg);
      return;
    }

    // state 更新(encourage は decisionPoints を消費しないが、execute 側で
    // newDp を返すので一応反映。実質 0 引かれている)
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    Storage.autoSave();

    // 選手ポップアップを閉じてから結果モーダルを出す(ドラマ演出)
    if (typeof closeFighterPopup === 'function') closeFighterPopup();

    // displayData を組み立てて既存の豪華モーダルに流す
    const doc = Engine.shachoshitsu.getDoc('encourage');
    const reactionKey = result.reactionKey || 'encourage';
    const fighter = G.roster.find(f => f.id === fighterId);
    const text = fighter ? Engine.shachoshitsu.getReactionText(reactionKey, fighter) : '';
    const displayData = {
      fighter, text,
      changes: result.changes || [],
      cost: result.cost || 0,
      remainingFunds: result.funds,
      icon: doc?.icon || '💬',
      label: doc?.label || '声かけ',
      docId: 'encourage',
      // Phase 8: 不確実性トーンマーカー (encourage も個人書類)
      reactionTone: result.reactionTone || null,
    };
    Audio.play('notify');
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    }
    if (typeof refreshAll === 'function') refreshAll();
  },

  // care-rework2 P2-G: 選手ポップアップから「🤝 起用を約束する」(pledge)
  // 強気(bold)の選手だけに出る。⚡1・費用0・選手単位CD16週・同時1件。
  // ここでは trust を動かさない — 約束を交わすだけで、効くのは次の通常興行で
  // 果たしたとき(履行)/果たさなかったとき(破約)。判定はエンジン側(tickWeek)。
  pledgeFighter(fighterId) {
    const target = G.roster.find(f => f.id === fighterId);
    if (!target) { showToast('選手が見つかりません'); return; }
    if (target.isRental || target.injury) { showToast('今は約束できない'); return; }
    if (String(target.personality || 'normal') !== 'bold') {
      showToast('この選手に響くやり方ではない');
      return;
    }
    if (G.pledge && G.pledge.fighterId != null) {
      const holder = G.roster.find(f => f.id === G.pledge.fighterId);
      showToast(holder ? `すでに${holder.name}と約束がある` : 'すでに約束がある');
      return;
    }
    // cooldown チェック(選手単位・16週)
    const lastUsed = (target._decisionWeekUsed || {}).pledge || -99;
    if ((G.week - lastUsed) < (PLEDGE_COOLDOWN_WEEKS || 16)) {
      showToast('この選手にはしばらく約束できない');
      return;
    }

    const result = Engine.shachoshitsu.execute('pledge', fighterId, G);
    if (!result || result.error) {
      const msg = {
        doc_not_found: 'この行動は現在利用できません',
        fighter_not_found: '選手が見つかりません',
        not_bold: 'この選手に響くやり方ではない',
        pledge_exists: 'すでに約束がある',
        cooldown: 'この選手にはしばらく約束できない',
        on_leave: '休暇中の選手には約束できない',
        offseason_locked: 'オフシーズンには約束できない',
        decision_points_insufficient: '決裁枠が不足しています(必要: ⚡1)',
      }[result?.error] || '失敗しました';
      showToast(msg);
      return;
    }

    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.pledge) G = { ...G, pledge: result.pledge };
    Storage.autoSave();

    // 選手ポップアップを閉じてから結果モーダルを出す(声かけと同じ流れ)
    if (typeof closeFighterPopup === 'function') closeFighterPopup();

    const doc = Engine.shachoshitsu.getDoc('pledge');
    const fighter = G.roster.find(f => f.id === fighterId);
    const text = fighter ? pickPledgeLine('accept', fighter) : '';
    const displayData = {
      fighter, text,
      changes: [{ label: '約束', emoji: '🤝', text: '次の通常興行のメインで使うと伝えた' }],
      cost: 0,
      remainingFunds: G.funds,
      icon: doc?.icon || '🤝',
      label: doc?.label || '起用の約束',
      docId: 'pledge',
      reactionTone: null,
    };
    Audio.play('notify');
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    }
    if (typeof refreshAll === 'function') refreshAll();
  },

  // 社長室 Phase 5: 特別治療(怪我ポップアップの二次アクション)
  // care-rework2 P2-C: 机経路と同じく決裁枠⚡1 + 資金500万を消費する。
  // 対象は長期離脱(総週数10週以上)のみ。残り離脱期間を4〜5割短縮。
  executeSpecialTreatment(fighterId) {
    const result = Engine.shachoshitsu.executeSpecialTreatment(fighterId, G);
    if (!result) { showToast('特別治療に失敗しました'); return; }
    if (result.error === 'decision_points_insufficient') { showToast(`決裁枠が不足しています(必要: ⚡${result.dpCost || 1})`); return; }
    if (result.error === 'funds_insufficient') { showToast(`資金が不足しています(必要: ${result.cost || 500}万)`); return; }
    if (result.error === 'fighter_not_found') { showToast('選手が見つかりません'); return; }
    if (result.error === 'not_injured') { showToast('怪我をしていない選手には使用できません'); return; }
    if (result.error === 'not_longterm_injured') { showToast('長期離脱(10週以上)の重傷にのみ発注できます'); return; }
    // state 更新
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    Storage.autoSave();
    Audio.play('award');
    if (typeof closeEventPopup === 'function') closeEventPopup();
    if (typeof closeCareModal === 'function') closeCareModal();
    if (document.getElementById('careOverlay')) document.getElementById('careOverlay').classList.remove('active');

    // 選手反応モーダル(社長室の通常書類と同じ豪華モーダルに流す)
    const fighter = G.roster.find(f => f.id === fighterId);
    if (fighter && typeof showDecisionResultModal === 'function') {
      const text = Engine.shachoshitsu.getReactionText('special_treatment', fighter);
      const doc = Engine.shachoshitsu.getDoc('special_treatment');
      const displayData = {
        fighter, text,
        changes: result.changes || [],
        cost: result.cost || 0,
        remainingFunds: result.funds,
        icon: doc?.icon || '🏥',
        label: doc?.label || '特別治療指示書',
        docId: 'special_treatment',
      };
      showDecisionResultModal(displayData);
    } else {
      showToast(`🏥 ${result.cur}週 → ${result.reduced}週に短縮（-${result.cost}万）`);
    }
    if (typeof renderWeekScreen === 'function') renderWeekScreen();
  },

  // 社長室 Phase 4: 書類クリックハンドラ(モーダル分岐)
  onShachoshitsuDocClick(docId) {
    Audio.play('click');
    // 決裁済みなら無視
    if ((G._decisionDoneThisWeek || []).includes(docId)) return;
    const doc = Engine.shachoshitsu.getDoc(docId);
    if (!doc) return;
    // 事前チェック(UX: モーダルを開く前にはじく)
    const dpCost = doc.decisionCost || 0;
    if ((G.decisionPoints || 0) < dpCost) {
      showToast(`決裁枠が不足しています(必要: ⚡${dpCost})`);
      return;
    }
    const actualCost = Engine.shachoshitsu.calcCost(doc, G);
    if ((G.funds || 0) < actualCost) {
      showToast(`資金が不足しています(必要: ${actualCost}万)`);
      return;
    }
    // 個人書類 / 団体書類 / ペア書類 で分岐
    if (docId === 'trainer') {
      // care-rework v0.1 §3: 招聘制は「コーチ候補選択→対象選手選択」の2段(bonus/refresh_leaveとは逆順)
      showInviteCoachModal(G);
    } else if (doc.effect && doc.effect.target === 'team') {
      showDecisionConfirmModal(docId, G);
    } else if (doc.effect && doc.effect.target === 'pair') {
      showDecisionPairModal(docId, G);
    } else if (doc.effect && doc.effect.target === 'faction') {
      showFactionDecreeModal(docId, G);
    } else {
      showDecisionTargetModal(docId, G);
    }
  },

  // care-rework2 P3-3: 招聘市場パネルの「頼む」。選択値は "axis:value" の1本。
  requestInviteCoachFromPanel() {
    const sel = document.getElementById('impReqSelect');
    if (!sel || !sel.value) { showToast('何を探すかが選ばれていません'); return; }
    const sep = sel.value.indexOf(':');
    if (sep < 0) { showToast('何を探すかが選ばれていません'); return; }
    App.requestInviteCoach(sel.value.slice(0, sep), sel.value.slice(sep + 1));
  },

  // care-rework2 P3-1: 招聘市場パネルから秘書に「◯◯を探してほしい」と1軸だけ頼む。
  // ⚡0・費用0・同一四半期に1件まで。結果が出るのは翌四半期の入れ替わり時。
  requestInviteCoach(axis, value) {
    Audio.play('click');
    const result = Engine.shachoshitsu.requestCoach(G, axis, value);
    if (result.error === 'offseason_locked') { showToast('オフシーズン中は依頼できません'); return; }
    if (result.error === 'already_requested') { showToast('今期はもう秘書に頼んでいます'); return; }
    if (result.error) { showToast('この依頼は出せませんでした'); return; }
    G = { ...G, coachRequest: result.coachRequest };
    const wanted = Engine.shachoshitsu.formatCoachRequest(result.coachRequest);
    G = { ...G, gameLog: [...(G.gameLog || []), `📇 秘書に${wanted}を探すよう頼んだ`] };
    showToast(`${wanted}を探すよう秘書に頼んだ。次の顔ぶれの入れ替わりで返事が来る`);
    Storage.autoSave();
    if (typeof renderShachoshitsu === 'function') renderShachoshitsu();
  },

  // 社長室 Phase 4: 決裁実行エントリポイント
  // fighterId: 個人書類のとき対象選手ID、team書類のとき null
  // 返り値: { ok: true, displayData } | { ok: false, error? }
  // options: bonus → { presetIndex: 0..3 } / refresh_leave → { weeks: 1..4 }(care-rework v0.1)
  executeDecision(docId, fighterId, options) {
    const result = Engine.shachoshitsu.execute(docId, fighterId, G, options);
    if (!result) { showToast('書類が見つかりません'); return { ok: false }; }
    if (result.error === 'doc_not_found') { showToast('書類が見つかりません'); return { ok: false }; }
    if (result.error === 'decision_points_insufficient') { showToast('決裁枠が不足しています'); return { ok: false }; }
    if (result.error === 'funds_insufficient') { showToast('資金が不足しています'); return { ok: false }; }
    if (result.error === 'fighter_not_found') { showToast('選手が見つかりません'); return { ok: false }; }
    if (result.error === 'not_slump') { showToast('スランプ中の選手ではありません'); return { ok: false }; }
    if (result.error === 'preset_required') { showToast('支給額が選ばれていません'); return { ok: false }; }
    if (result.error === 'weeks_required') { showToast('休暇の週数が選ばれていません'); return { ok: false }; }
    if (result.error === 'on_leave') { showToast('休暇中の選手には使用できません'); return { ok: false }; }
    if (result.error === 'not_injured') { showToast('怪我をしていない選手には使用できません'); return { ok: false }; }
    if (result.error === 'cooldown') { showToast('今週はすでに決裁済みです'); return { ok: false }; }
    if (result.error === 'orgpop_locked') { showToast(`団体の知名度が足りません(${result.required} 必要)`); return { ok: false }; }
    if (result.error === 'condition_not_met') { showToast('この書類の発動条件を満たしていません'); return { ok: false }; }
    // care-rework v0.1 §3: 招聘制の専用エラー
    if (result.error === 'invite_active') { showToast('すでに招聘中のコーチがいます'); return { ok: false }; }
    if (result.error === 'invalid_coach') { showToast('今期の候補にいないコーチです'); return { ok: false }; }
    if (result.error === 'unsupported_doc') { showToast(`未対応の書類です: ${result.docId}`); return { ok: false }; }
    // 派閥解散命令の専用エラー
    if (result.error === 'mode_required') { showToast('処置が選ばれていません'); return { ok: false }; }
    if (result.error === 'no_faction') { showToast('解散させる派閥がありません'); return { ok: false }; }
    if (result.error === 'not_sealed') { showToast('派閥は禁止されていません'); return { ok: false }; }
    if (result.error === 'offseason_locked') { showToast('オフシーズン中は決裁できません'); return { ok: false }; }
    // 未知のエラーコードをここで止める防壁。これがないとエラーオブジェクトを
    // そのまま state に代入して G.roster が undefined になる。
    if (result.error) {
      console.warn('[WM] executeDecision: 未処理のエラーコード', { docId, error: result.error });
      showToast('この決裁は実行できませんでした');
      return { ok: false };
    }

    // 派閥解散命令: factions / 各種CD / 進行中予約の削除を含む state ツリーごと差し替える。
    // 個別フィールドのマージでは「消したキー」を消せないため、下の {...G, ...} より先に置く。
    if (result.factionState) G = result.factionState;

    // state 更新
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      _decisionDoneThisWeek: [...(G._decisionDoneThisWeek || []), docId],
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    if (result.h2h) G = { ...G, h2h: result.h2h };
    // care-rework2 P2-B: 慰労会の余韻(翌週から+1×3週)。消化は tickWeek 側。
    if (result._partyAfterglowWeeks) G = { ...G, _partyAfterglowWeeks: result._partyAfterglowWeeks };
    // care-rework v0.1 §3: 招聘に伴う雇用コーチ退避(coachAssign)と招聘履歴(lastInvitedCoachId)
    if (result.coachAssign) G = { ...G, coachAssign: result.coachAssign };
    if (result.lastInvitedCoachId != null) G = { ...G, lastInvitedCoachId: result.lastInvitedCoachId };
    if (result.orgPopDelta) {
      const newOrgPop = Engine.util.clamp((G.orgPop || 0) + Engine.orgPop.applyOrgPopChange(result.orgPopDelta, G.orgPop, null), 0, 100);
      G = { ...G, orgPop: newOrgPop };
    }
    // 業界ニュース: relationship_repair などが積んだイベントを反映
    if (result._industryNewsEvents && result._industryNewsEvents.length > 0) {
      G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ...result._industryNewsEvents] };
    }
    Storage.autoSave();

    // displayData 構築(結果表示用)
    const doc = Engine.shachoshitsu.getDoc(docId);
    const reactionKey = result.reactionKey || docId;
    let displayData = null;
    if (result.reactionFighterId != null) {
      const fighter = G.roster.find(f => f.id === result.reactionFighterId);
      if (fighter) {
        const text = Engine.shachoshitsu.getReactionText(reactionKey, fighter);
        displayData = {
          fighter, text, changes: result.changes || [],
          cost: result.cost || 0, remainingFunds: result.funds,
          icon: doc?.icon || '', label: doc?.label || '', docId,
          // Phase 8: 不確実性トーンマーカー (個人書類のみ)
          reactionTone: result.reactionTone || null,
        };
      }
    } else {
      // 団体書類(party/camp): 参加者全員 + 代表セリフ + camp フレーバー(休暇中は不参加)
      const participants = (G.roster || []).filter(f => !f.isRental && !f.injury && !f.onLeave);
      const repFighter = participants.length > 0
        ? participants[Math.floor(Math.random() * participants.length)]
        : null;
      const text = repFighter ? Engine.shachoshitsu.getReactionText(reactionKey, repFighter) : '';
      // camp: CAMP_FLAVOR_TEXTS からランダムに1件、参加者2名を差し込み
      let campFlavor = null;
      if (docId === 'camp' && typeof CAMP_FLAVOR_TEXTS !== 'undefined' && participants.length >= 2) {
        const tmpl = CAMP_FLAVOR_TEXTS[Math.floor(Math.random() * CAMP_FLAVOR_TEXTS.length)];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        campFlavor = tmpl
          .replace('{name1}', shuffled[0].name)
          .replace('{name2}', shuffled[1] ? shuffled[1].name : shuffled[0].name);
      }
      displayData = {
        fighter: null, isTeam: true,
        fighters: participants, repFighter, text, campFlavor,
        changes: result.changes || [],
        cost: result.cost || 0, remainingFunds: result.funds,
        icon: doc?.icon || '', label: doc?.label || '', docId,
      };
    }

    // サウンド(コスト別、既存流用)
    // Phase 9: 朱印音を先に鳴らす(0.6秒の朱印アニメと同時開始)
    // 合成音の短いバーストなので、後続のコスト別サウンドとぶつからない
    Audio.play('stamp');
    const soundCost = result.cost || 0;
    if (docId === 'camp') { /* 承認印の音だけで十分。RS05達成音は鳴らさない */ }
    else if (soundCost >= 160) Audio.play('award');
    else if (soundCost >= 80) Audio.play('event');
    else Audio.play('notify');

    // 演出フック: 書類DOMに朱印アニメ(is-approving)を付与 → 0.6秒後に再レンダ(is-approved に切替)
    // HUDの最初の「立っている」hankoに falling クラスを付与
    try {
      const docEl = document.querySelector(`.shachoshitsu-doc[data-doc-id="${docId}"]`);
      if (docEl) docEl.classList.add('is-approving');
      const firstStandingHanko = document.querySelector('.shachoshitsu-hud .hanko.available:not(.falling)');
      if (firstStandingHanko) firstStandingHanko.classList.add('falling');
    } catch (e) {}

    // 結果表示: 個人/team 問わず常に豪華モーダル(話者の顔+セリフ+変化+コスト)
    // spec: 決裁=特別な行為、キャラの反応を覗き見る体験を一貫させる
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    } else if (typeof showDecisionResultToast === 'function') {
      showDecisionResultToast(displayData);
    }

    // 0.6秒後に再レンダリングして決裁済み状態(is-approved)を反映
    setTimeout(() => {
      if (typeof renderShachoshitsu === 'function') renderShachoshitsu();
    }, 600);

    return { ok: true, displayData };
  },

  // bankruptcy-redesign v1.1: 危機突入時の選手不安発言ポップアップ
  // tickWeek/advanceWeek が _crisisJustEntered を立てた場合のみ発火
  checkCrisisEnteredPopup() {
    if (!G || !G._crisisJustEntered) return;
    // フラグを消費
    const { _crisisJustEntered: _consumed, ...rest } = G;
    G = rest;
    const roster = (G.roster || []).filter(f => f && !f.isRental);
    if (roster.length === 0) return;
    // トラスト最上位（同値時は人気最上位）
    const sorted = [...roster].sort((a, b) => {
      const ta = a.trust ?? 50, tb = b.trust ?? 50;
      if (tb !== ta) return tb - ta;
      const pa = a.popularity ?? a.pop ?? 0, pb = b.popularity ?? b.pop ?? 0;
      return pb - pa;
    });
    const speaker = sorted[0];
    if (!speaker) return;
    const archetype = speaker.archetype || 'standard';
    const pool = (typeof CRISIS_DIALOGUE !== 'undefined'
      && CRISIS_DIALOGUE.enter
      && (CRISIS_DIALOGUE.enter[archetype] || CRISIS_DIALOGUE.enter.standard)) || [];
    if (pool.length === 0) return;
    const seed = (G.season || 1) * 1000 + (G.week || 1);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, seed, 0xC715));
    const line = Engine.rng.pick(rng, pool);
    setTimeout(() => showEventPopup({
      type: 'fighter',
      id: speaker.id,
      name: speaker.name,
      tone: 'negative',
      title: '🚨 資金危機',
      speech: line,
      detail: `残り猶予${Math.max(0, G.crisisWeeksRemaining || 0)}週 — 立て直すか、解散か`,
    }), 250);
  },

  // v0.97: Survival gauge
  checkSurvivalUpdate() {
    const sResult = Survival.updateSurvival(G);
    const wasCleared = G.survivalCleared;
    G = sResult.state;
    if (sResult.graduated && !wasCleared) {
      setTimeout(() => showEventPopup({
        type: 'generic', emoji: '\uD83C\uDF8A', name: '\u7D4C\u55B6\u5B89\u5B9A\u5316\u9054\u6210\uFF01',
        message: '\u8D64\u5B57\u5730\u7344\u3092\u4E57\u308A\u8D8A\u3048\u3001\u3064\u3044\u306B\u5B89\u5B9A\u3057\u305F\u9ED2\u5B57\u7D4C\u55B6\u3092\u9054\u6210\u3057\u307E\u3057\u305F\uFF01',
        detail: '\uD83D\uDCAA \u3053\u308C\u304B\u3089\u306F\u6210\u9577\u30D5\u30A7\u30FC\u30BA\u3067\u3059\u3002\u66F4\u306A\u308B\u9AD8\u307F\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046\uFF01',
        tone: 'gold'
      }), 200);
    }
  },

  hasPermanentRosterCap16Unlock(state = G) {
    if (!state) return false;
    return hasPlayerHistoricRank1(state);
  },

  getRosterCapTarget(state = G) {
    const orgPop = state.orgPop || 0;
    if (App.hasPermanentRosterCap16Unlock(state)) return 16;
    if (orgPop >= 70) return 14;
    if (orgPop >= 50) return 12;
    if (orgPop >= 25) return 10;
    return 8;
  },

  _notifyRosterCapUnlock(popups) {
    popups.forEach((popup, idx) => {
      setTimeout(() => showEventPopup({
        type: 'generic',
        emoji: '\uD83C\uDFE2',
        name: '\u5951\u7D04\u67A0\u62E1\u5927\uFF01',
        message: popup.message,
        detail: `\u9078\u624B\u3068\u306E\u5951\u7D04\u67A0\u304C ${popup.cap} \u540D\u306B\u62E1\u5927\u3057\u307E\u3057\u305F\uFF01`,
        tone: 'gold',
        sound: 'fanfare'
      }), 220 + idx * 140);
    });
  },

  checkRosterCapMilestones() {
    const orgPop = G.orgPop || 0;
    const rank1Unlocked = App.hasPermanentRosterCap16Unlock(G);
    const nextUpdates = {};
    const popups = [];

    if (orgPop >= 25 && !G.rosterCapPop25Notified) {
      nextUpdates.rosterCapPop25Notified = true;
      popups.push({ cap: 10, message: '\u56E3\u4F53\u4EBA\u6C17\u304C25\u3092\u7A81\u7834\uFF01 \u56E3\u4F53\u898F\u6A21\u306E\u62E1\u5927\u3067\u5951\u7D04\u67A0\u306B\u4F59\u88D5\u304C\u3067\u304D\u307E\u3057\u305F\u3002' });
    }
    if (orgPop >= 50 && !G.rosterCapPop50Notified) {
      nextUpdates.rosterCapPop50Notified = true;
      popups.push({ cap: 12, message: '\u56E3\u4F53\u4EBA\u6C17\u304C50\u3092\u7A81\u7834\uFF01 \u4E3B\u529B\u3068\u82E5\u624B\u3092\u3088\u308A\u539A\u304F\u62B1\u3048\u3089\u308C\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3057\u305F\u3002' });
    }
    if (orgPop >= 70 && !G.rosterCapPop70Notified) {
      nextUpdates.rosterCapPop70Notified = true;
      popups.push({ cap: 14, message: '団体人気が70を突破！ メジャー団体の規模にふさわしい契約枠が確保されました。' });
    }
    if (rank1Unlocked && !G.rosterCapRank1Notified) {
      nextUpdates.rosterCapRank1Notified = true;
      popups.push({ cap: 16, message: '\u30E9\u30F3\u30AD\u30F3\u30B01\u4F4D\u5230\u9054\uFF01 \u738B\u8005\u306E\u56E3\u4F53\u306B\u3075\u3055\u308F\u3057\u3044\u6700\u5927\u5951\u7D04\u67A0\u304C\u89E3\u653E\u3055\u308C\u307E\u3057\u305F\u3002' });
    }

    // 契約枠はラチェット(拡大のみ)。人気連動のターゲットをそのまま代入すると
    // 人気低下で枠が**無言で縮み**、合法に抱えた所属数が不変条件「キャップ超過」を
    // 毎週鳴らし続ける(2026-08-31 リリース前走破で発覚: 12名/枠16→人気下落で枠10)。
    // プレイヤーへの通知は「拡大!」ポップアップしか存在せず、縮小はそもそも
    // 伝達手段のない挙動だった。一度開いた枠は閉じない。
    const newCap = Math.max(G.rosterCap || 8, App.getRosterCapTarget(G));
    if ((G.rosterCap || 8) !== newCap) nextUpdates.rosterCap = newCap;
    if (Object.keys(nextUpdates).length === 0) return;
    G = { ...G, ...nextUpdates };
    if (popups.length > 0) App._notifyRosterCapUnlock(popups);
  },

  // 序章ハイライト発火チェック (Phase 3)
  // 状態ベース: 既に発火済みのIDは Engine.prologue.addHighlight 内で重複ガードされる。
  // status === 'in_progress' のときのみ刻まれる(addHighlight 側ガード)。
  checkPrologueHighlights() {
    if (!G.prologue || G.prologue.status !== 'in_progress') return;
    const totalShows = G.totalShows || 0;
    const orgPop = G.orgPop || 0;
    const bestMQ = G.seasonStats?.bestMQ || 0;
    const histBest = (G.seasonHistory || []).reduce((m, s) => Math.max(m, s.bestMQ || 0), 0);
    const peakMQ = Math.max(bestMQ, histBest);
    const champId = G.titles?.world?.championId;
    const titleEstablished = !!G.titleEstablished;

    const triggers = [];
    if (totalShows >= 1) triggers.push({ id:'first_show', tier:'gold',
      text:`旗揚げ戦。最初の興行が開かれ、団体は始動した。` });
    if (titleEstablished) triggers.push({ id:'first_title_setup', tier:'normal',
      text:`団体王座の設立が認定された。` });
    if (champId) {
      const ch = G.roster.find(c => c.id === champId);
      const chName = ch?.name || '初代王者';
      triggers.push({ id:'first_title_winner', tier:'red', characterId: champId,
        text:`${chName}が初代王者に。最初の頂が決まった。` });
    }
    if (peakMQ >= 50) triggers.push({ id:'first_mq50', tier:'silver', text:`試合評価50到達。観客の目つきが変わり始めた。` });
    if (peakMQ >= 70) triggers.push({ id:'first_mq70', tier:'silver', text:`試合評価70到達。名勝負と呼ぶに値する試合が出た。` });
    if (peakMQ >= 80) triggers.push({ id:'first_mq80', tier:'gold', text:`試合評価80到達。この章の選手が業界の壁を叩いた瞬間。` });
    if (orgPop >= 25) triggers.push({ id:'pop_25', tier:'normal', text:`団体人気25到達。スポンサー筋に動きが出始めた。` });
    if (orgPop >= 50) triggers.push({ id:'pop_50', tier:'silver', text:`団体人気50到達。大会場での興行が現実的に。` });
    if (G.survivalCleared) triggers.push({ id:'survival_clear', tier:'red',
      text:`経営安定化達成。月次黒字が定着し、団体存続の目処が立った。` });

    // founder の引退検出 (id ベース冪等)
    (G.prologue.founderIds || []).forEach(fid => {
      if (Engine.prologue.founderState(G, fid) !== 'retired') return;
      const archive = (G.chronicle?.fighterArchive || []).find(a => a.id === fid);
      const retired = (G.retiredFighters || []).find(f => f.id === fid);
      const name = archive?.name || retired?.name || '';
      triggers.push({
        id: `founder_first_retire_${fid}`,
        tier: 'red',
        text: `旗揚げメンバー ${name} が引退。`,
      });
    });

    triggers.forEach(t => { G = Engine.prologue.addHighlight(G, t); });

    // 全 founder 引退で序章確定 (idempotent)
    G = Engine.prologue.checkAndConfirm(G);
  },

  // v1.0: Title establishment check
  checkTitleEstablishment() {
    if (G.titleEstablished) return;
    if (Engine.title.checkTitleEstablishment(G)) {
      G = { ...G, titleEstablished: true };
      setTimeout(() => showEventPopup({
        type: 'generic', emoji: '\uD83C\uDFC6', name: '\u56E3\u4F53\u738B\u5EA7 \u8A2D\u7ACB\uFF01',
        message: '\u56E3\u4F53\u306E\u5B9F\u7E3E\u304C\u8A8D\u3081\u3089\u308C\u3001\u56E3\u4F53\u738B\u5EA7\u3092\u8A2D\u7ACB\u3067\u304D\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3057\u305F\uFF01',
        detail: '\uD83C\uDF96\uFE0F \u8208\u884C\u3067\u300C\u521D\u4EE3\u738B\u8005\u6C7A\u5B9A\u6226\u300D\u3092\u7D44\u3093\u3067\u3001\u521D\u4EE3\u30C1\u30E3\u30F3\u30D4\u30AA\u30F3\u3092\u6C7A\u3081\u307E\u3057\u3087\u3046\uFF01',
        tone: 'gold'
      }), 300);
    }
  },

  // C-6 天頂戦: Week42 開催前ミニイベント(数値効果なし・純演出)を1回だけ表示
  //
  // 2026-08-02 バグ修正: このチェックの直後に呼び出し元(advanceFromWeekSummary/advanceWeek)が
  // showScreen('week') を呼ぶが、showScreen は内部で dismissAllPopups() を呼ぶ
  // (checkTitleEstablishment 等、他の check* が軒並み setTimeout で popup を開いているのはこれが理由)。
  // ここだけ _enqueuePopup を同期的に呼んでいたため、Week42 に開いたその場で
  // showScreen の dismissAllPopups に畳まれ、プレイヤーが目にする前に消えていた。
  // seen が立たないので毎週再挑戦しては同じ理由で消え続け、Week48で天頂戦本編に入ると
  // このチェック自体が呼ばれなくなる(_shouldStartTenchosenReplay の早期returnが先に来る)ため、
  // 本編が終わって通常フローに戻った瞬間に初めて生き残り、「大会後に出る」ように見えていた。
  checkTenchosenPreEvent() {
    const tp = G.tenchosenPreEvent;
    if (!tp || tp.seen || tp.season !== G.season) return;
    // 陳腐化の保険: エントリー週(週43)に入ってもまだ見せられていないなら、
    // 本編に飲まれて出しそびれた演出とみなし、静かに既読化する(数値効果はないため無害)。
    // これが無いと、上のsetTimeoutが何らかの理由で不発だった場合に「大会後に出る」症状が再発する。
    if (G.week >= Engine.ppvTournament.ENTRY_WEEK) {
      G = Engine.ppvTournament.markPreEventSeen(G);
      return;
    }
    if (App._tenchosenPreEventPending) return; // 多重enqueueガード: 予約済みなら重ねて積まない
    App._tenchosenPreEventPending = true;
    setTimeout(() => {
      App._tenchosenPreEventPending = false;
      const cur = G.tenchosenPreEvent;
      if (!cur || cur.seen || cur.season !== G.season) return;
      _enqueuePopup(() => {
        if (typeof renderTenchosenPreEvent === 'function') renderTenchosenPreEvent();
      });
    }, 300);
  },

  // 天頂戦 開催前ミニイベントを閉じる: 既読化してオーバーレイを畳む
  closeTenchosenPreEvent() {
    const overlay = document.getElementById('showResultOverlay');
    if (overlay) overlay.classList.remove('active');
    G = Engine.ppvTournament.markPreEventSeen(G);
    Storage.autoSave();
    _drainPopupQueue();
  },

  // ══════════════════════════════════════════════
  //  WAR MATCH PREVIEW SYSTEM (v0.99d)
  // ══════════════════════════════════════════════
  _warEntrySelection: null,
  _warPreview: null,
  _warUiToken: 0,
  _warBgmTimer: null,

  warToggleEntryFighter(id) {
    const ev = G.pendingEvent;
    if (!ev || ev.type !== 'war') return;
    const required = Number(ev.matchCount) === 5 ? 5 : 3;
    const candidates = Engine.event.getWarEntryCandidates(G);
    if (!candidates.some(f => Number(f.id) === Number(id))) return;
    const selected = Array.isArray(App._warEntrySelection) ? [...App._warEntrySelection] : [];
    const index = selected.findIndex(pickedId => Number(pickedId) === Number(id));
    if (index >= 0) selected.splice(index, 1);
    else if (selected.length < required) selected.push(Number(id));
    else { Audio.play('error'); return; }
    App._warEntrySelection = selected;
    Audio.play('click');
    renderWarEntrySelection();
  },

  warAutoSelectEntry() {
    const ev = G.pendingEvent;
    if (!ev || ev.type !== 'war') return;
    const required = Number(ev.matchCount) === 5 ? 5 : 3;
    App._warEntrySelection = Engine.event.getWarEntryCandidates(G)
      .slice(0, required).map(f => Number(f.id));
    Audio.play('select');
    renderWarEntrySelection();
  },

  warReturnToChallenge() {
    App._warEntrySelection = null;
    _mdlAClose();
    showWarChallenge();
  },

  warConfirmEntry() {
    const ev = G.pendingEvent;
    if (!ev || ev.type !== 'war') return;
    const required = Number(ev.matchCount) === 5 ? 5 : 3;
    const selected = Array.isArray(App._warEntrySelection) ? [...App._warEntrySelection] : [];
    if (selected.length !== required) { Audio.play('error'); return; }
    const card = Engine.event.makeWarCard(G, ev.opponentOrgId, selected);
    if (card.length !== required) {
      Audio.play('error');
      if (typeof showToast === 'function') showToast('代表選手の編成を確定できませんでした');
      renderWarEntrySelection();
      return;
    }
    App._warEntrySelection = null;
    _mdlAClose();
    Audio.play('select');
    App.initWarPreview(ev, card);
  },

  _beginWarUiTransition() {
    App._warUiToken += 1;
    if (App._warBgmTimer) {
      clearTimeout(App._warBgmTimer);
      App._warBgmTimer = null;
    }
    return App._warUiToken;
  },

  _isWarUiTokenCurrent(token) {
    return token == null || App._warUiToken === token;
  },

  _scheduleWarBgmResume(delayMs = 1600) {
    const token = App._warUiToken;
    if (App._warBgmTimer) clearTimeout(App._warBgmTimer);
    App._warBgmTimer = setTimeout(() => {
      App._warBgmTimer = null;
      if (!App._isWarUiTokenCurrent(token) || !App._warPreview) return;
      try { Audio.bgm.playStage('war'); } catch(e) {}
    }, delayMs);
  },

  // Start war match preview (called from acceptWarChallenge in ui-common)
  initWarPreview(ev, card) {
    App._beginWarUiTransition();
    App._warPreview = {
      ev,
      card,                         // [{playerFighter, aiFighter}, ...]
      results: card.map(() => null), // null = unresolved
      currentWatching: -1
    };
    try { Audio.bgm.playStage('war'); } catch(e) {}
    renderWarMatchPreview();
  },

  // Watch a war match in battle engine iframe
  warWatchMatch(idx) {
    const wp = App._warPreview;
    if (!wp || wp.results[idx]) return;
    wp.currentWatching = idx;
    const m = wp.card[idx];
    const pf = m.playerFighter;
    const af = m.aiFighter;

    // Replay: 結果事前計算 (skip と一致させるため同じ seed を使う)
    const warRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
    const warResult = Engine.event.resolveEventMatch(warRng, pf, af, 0, { recordFrames: true });
    const warPlayerWon = warResult.winner === 'left';
    const warWinnerFighter = warPlayerWon ? pf : af;
    wp.results[idx] = {
      playerFighter: pf, aiFighter: af,
      winner: warResult.winner, mq: warResult.mq,
      playerWon: warPlayerWon,
      finType: warResult.finType || '', finMove: warResult.finMove || '',
      turns: warResult.turns || 0,
      victoryLine: _getWarVictoryLine(warWinnerFighter, G),
      winnerName: warWinnerFighter.name, winnerId: warWinnerFighter.id
    };

    // Show iframe
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    // Show escape button after delay
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...pf, condition: 80,
        portraitUrl: getPortraitUrl(pf.id), profile: CHAR_PROFILES[pf.id] || '',
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['…！']
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: App._buildVlVsPlayerForExEmployee(af, G.season, G.week, pf.orgId),
        vsExHit: App._buildVsExHitLines(af, G.season, G.week, pf.orgId)
      },
      matchInfo: {
        header: `⚔ 対抗戦 第${idx + 1}試合`,
        subHeader: `${pf.name} vs ${af.name}`,
        matchNum: idx + 1,
        totalMatches: wp.card.length,
        isTitle: false,
        isSpecialMatch: idx + 1 === wp.card.length,
        matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, pf.id, af.id); return rl ? rl.tier : 0; })(),
        leftPersonality: pf.personality || 'normal',
        leftArchetype: pf.archetype || 'standard',
        rightPersonality: af.personality || 'normal',
        rightArchetype: af.archetype || 'standard',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: warResult,
    };
    // ビッグマッチBGM（対抗戦）
    try { Audio.bgm.playStage('bigMatch'); } catch(e) {}
    let sent = false;
    const sendOnce = () => {
      if (sent) return; sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles系は必ず battle-engine.html（タッグ観戦で tag-battle.html に切替わっていても戻す）
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // Skip a war match (auto-resolve)
  // 対抗戦の代表戦も、他のイベント結果と同じ勝敗SEの規則を通す。
  // 対抗戦カードでは自団体側を常に左に置くため、所属を明示してから
  // 共通判定へ渡す（古いセーブの選手データに orgId が無い場合の保険）。
  _playWarMatchResultSe(matchResult) {
    if (!matchResult || typeof playMatchResultSe !== 'function') return;
    const opponentOrgId = App._warPreview?.ev?.opponentOrgId
      || matchResult.aiFighter?.orgId || 'rival';
    playMatchResultSe(
      { ...matchResult.playerFighter, orgId: 'player' },
      { ...matchResult.aiFighter, orgId: opponentOrgId },
      matchResult.playerWon ? 'left' : 'right'
    );
  },

  warSkipMatch(idx) {
    const wp = App._warPreview;
    if (!wp || wp.results[idx]) return;
    const m = wp.card[idx];
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
    const result = Engine.event.resolveEventMatch(rng, m.playerFighter, m.aiFighter, 0);
    const playerWon = result.winner === 'left';
    const winnerFighter = playerWon ? m.playerFighter : m.aiFighter;
    wp.results[idx] = {
      playerFighter: m.playerFighter, aiFighter: m.aiFighter,
      winner: result.winner, mq: result.mq,
      playerWon,
      finType: result.finType || '', finMove: result.finMove || '',
      turns: result.turns || 0,
      victoryLine: _getWarVictoryLine(winnerFighter, G),
      winnerName: winnerFighter.name, winnerId: winnerFighter.id
    };
    App._playWarMatchResultSe(wp.results[idx]);
    renderWarMatchPreview();
    if (wp.results.every(r => r !== null)) App.finalizeWar();
  },

  // Skip all remaining war matches
  warSkipAll() {
    const wp = App._warPreview;
    if (!wp) return;
    wp.card.forEach((m, idx) => {
      if (wp.results[idx]) return;
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
      const result = Engine.event.resolveEventMatch(rng, m.playerFighter, m.aiFighter, 0);
      const playerWon = result.winner === 'left';
      const winnerFighter = playerWon ? m.playerFighter : m.aiFighter;
      wp.results[idx] = {
        playerFighter: m.playerFighter, aiFighter: m.aiFighter,
        winner: result.winner, mq: result.mq,
        playerWon,
        finType: result.finType || '', finMove: result.finMove || '',
        turns: result.turns || 0,
        victoryLine: _getWarVictoryLine(winnerFighter, G),
        winnerName: winnerFighter.name, winnerId: winnerFighter.id
      };
    });
    Audio.play('bellx3');
    App.finalizeWar();
  },

  // Receive battle engine result for war match
  _receiveWarBattleResult(data) {
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    const wp = App._warPreview;
    if (!wp || wp.currentWatching < 0) return;
    const idx = wp.currentWatching;
    // Replay 移行: watchMatch で結果は既に格納済み (整合性確保のため)。overlay を閉じて次へ遷移。
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    wp.currentWatching = -1;
    App._playWarMatchResultSe(wp.results[idx]);
    renderWarMatchPreview();
    if (wp.results.every(r => r !== null)) {
      App.finalizeWar();
    } else {
      App._scheduleWarBgmResume(1600);
    }
  },

  // Finalize war: apply outcome to game state, show result
  finalizeWar() {
    const wp = App._warPreview;
    if (!wp) return;
    App._beginWarUiTransition();
    try { Audio.fileBgm.stop(); } catch(e) {}
    const ev = wp.ev;
    let playerWins = 0, aiWins = 0;
    wp.results.forEach(r => { if (r.playerWon) playerWins++; else aiWins++; });
    wp.results.forEach(result => {
      G = Engine.mq.updateRecord(G, { mq: result.mq }, {
        holderIds: [result.playerFighter.id, result.aiFighter.id],
        orgId: null,
        stage: 'event',
      }).state;
    });

    // Apply outcome to state
    const events = [];
    wp.results.forEach((r, i) => {
      const icon = r.playerWon ? '🔵' : '🔴';
      events.push(`  ${icon} 第${i+1}試合: ${r.playerFighter.name} vs ${r.aiFighter.name} → ${r.playerWon ? r.playerFighter.name : r.aiFighter.name}勝利 (試合評価${r.mq})`);
    });
    const outcome = Engine.event.applyWarOutcome(G, playerWins, aiWins, ev.opponentOrgId);
    const eventWon = playerWins > aiWins;
    G = { ...outcome.state, gameLog: [...G.gameLog, ...events, ...outcome.events] };

    // 新聞用: 対抗戦結果を保存（次週の新聞生成で使用）
    G._newsWarResult = {
      opponentName: ev.opponentName,
      opponentOrgId: ev.opponentOrgId,
      playerWins,
      aiWins,
      won: playerWins > aiWins,
      draw: playerWins === aiWins,
      matches: wp.results.map(r => ({
        playerName: r.playerFighter.name,
        playerId: r.playerFighter.id,
        aiName: r.aiFighter.name,
        aiId: r.aiFighter.id,
        playerWon: r.playerWon,
        mq: r.mq,
      })),
    };

    // Phase 2: 対抗戦勝利選手のtrust bonus
    const winnerPlayerIds = wp.results.filter(r => r.playerWon).map(r => r.playerFighter.id);
    if (winnerPlayerIds.length > 0) {
      G = { ...G, roster: G.roster.map(c =>
        winnerPlayerIds.includes(c.id)
          ? { ...c, _trustBonus: (c._trustBonus || 0) + 2.3,
              _trustBonusSources: [...(c._trustBonusSources || []), 'warVictory'] }
          : c
      )};
    }

    // v1.3: Record war appearances for participating player fighters
    const warFighterIds = new Set(wp.card.map(m => m.playerFighter.id));
    G = { ...G, roster: G.roster.map(c => {
      if (!warFighterIds.has(c.id)) return c;
      const matchResult = wp.results.find(r => r.playerFighter.id === c.id);
      const oppName = matchResult ? matchResult.aiFighter?.name : undefined;
      return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: ev.opponentName, opponentName: oppName, won: matchResult ? matchResult.playerWon : false });
    }) };

    // AI側の対抗戦出場選手にもcareer event記録
    const aiOrgId = ev.opponentOrgId;
    if (G.aiOrgs && G.aiOrgs[aiOrgId]) {
      const aiWarIds = new Set(wp.card.map(m => m.aiFighter.id));
      const updatedAiRoster = G.aiOrgs[aiOrgId].roster.map(c => {
        if (!aiWarIds.has(c.id)) return c;
        const matchResult = wp.results.find(r => r.aiFighter.id === c.id);
        const oppName = matchResult ? matchResult.playerFighter?.name : undefined;
        return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: G.orgName || 'プレイヤー団体', opponentName: oppName, won: matchResult ? !matchResult.playerWon : false });
      });
      G = { ...G, aiOrgs: { ...G.aiOrgs, [aiOrgId]: { ...G.aiOrgs[aiOrgId], roster: updatedAiRoster } } };
    }

    const evStats = { ...(G.seasonStats || {}) };
    if (eventWon) {
      evStats.eventsWon = (evStats.eventsWon || 0) + 1;
      // F2: Track war victories for negotiation bonus
      const wv = [...(G.warVictories || [])];
      if (!wv.includes(ev.opponentOrgId)) wv.push(ev.opponentOrgId);
      // 修正D: 対抗戦通算勝利を記録（レガシーpt計算用）
      const bwt = { ...(G.battleWinsTotal || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
      bwt.player = (bwt.player || 0) + 1;
      G = { ...G, warVictories: wv, battleWinsTotal: bwt };
      // 対抗戦マイルストーン: 5勝ごとに新聞記事+士気ブースト
      if (bwt.player % 5 === 0) {
        const mBoost = 3 + Math.min(2, Math.floor(bwt.player / 10)); // +3〜+5
        G = { ...G,
          _newsWarMilestone: { orgId: 'player', orgName: G.orgName || 'プレイヤー団体', wins: bwt.player },
          lockerRoomMorale: Math.min(100, (G.lockerRoomMorale || 60) + mBoost),
        };
      }
    }
    else {
      evStats.eventsLost = (evStats.eventsLost || 0) + 1;
      // 修正D: AI勝利側も記録
      const bwt = { ...(G.battleWinsTotal || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
      bwt[ev.opponentOrgId] = (bwt[ev.opponentOrgId] || 0) + 1;
      G = { ...G, battleWinsTotal: bwt };
      // AI側の対抗戦マイルストーン: 5勝ごとに新聞記事
      if (bwt[ev.opponentOrgId] % 5 === 0) {
        G = { ...G,
          _newsWarMilestone: { orgId: ev.opponentOrgId, orgName: ev.opponentName, wins: bwt[ev.opponentOrgId] },
        };
      }
    }
    // 金銭バランス改善: 対抗戦メディア収入
    const warMediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
    let warMediaTotal = 0;
    wp.results.forEach(r => {
      const venueIdx = G.showVenue || 0;
      const venueMult = VENUE_MEDIA_MULT[venueIdx] || 1.0;
      warMediaTotal += Math.round(
        Math.min(r.mq, 100) * MEDIA_CONFIG.eventPerMQ * venueMult * 1.5);
    });
    // JT出演料: 出場選手の人気×出場試合数
    let jtMediaTotal = 0;
    wp.results.forEach(r => {
      if (r.playerFighter) {
        const rev = Math.round((r.playerFighter.popularity || 1) * MEDIA_CONFIG.jtPerPop);
        jtMediaTotal += rev;
        // メディア功労賞: 個人別メディア収入累計に加算
        G = { ...G, roster: G.roster.map(c =>
          c.id === r.playerFighter.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
        )};
      }
      // AI団体選手のメディア収入個人トラッキング（対抗戦出場）
      if (r.aiFighter && ev.opponentOrgId && G.aiOrgs && G.aiOrgs[ev.opponentOrgId]) {
        const aiRev = Math.round((r.aiFighter.popularity || 1) * MEDIA_CONFIG.jtPerPop);
        if (aiRev > 0) {
          const aiOrg = G.aiOrgs[ev.opponentOrgId];
          G = { ...G, aiOrgs: { ...G.aiOrgs, [ev.opponentOrgId]: {
            ...aiOrg, roster: aiOrg.roster.map(c =>
              c.id === r.aiFighter.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + aiRev } : c
            )
          }}};
        }
      }
    });
    if (warMediaTotal + jtMediaTotal > 0) {
      if (warMediaTotal > 0) warMediaIncomes.push({ amount: warMediaTotal, label: `対抗戦 vs ${ev.opponentName}` });
      if (jtMediaTotal > 0) warMediaIncomes.push({ amount: jtMediaTotal, label: '対抗戦出演料' });
      G = { ...G, _pendingMediaIncomes: warMediaIncomes };
    }

    G = { ...G, seasonStats: evStats, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } };

    // recentMatches記録（対抗戦）
    let warRoster = [...G.roster];
    wp.results.forEach(r => {
      const winner = r.playerWon ? 'left' : 'right';
      warRoster = Engine.pushRecentMatch(warRoster, r.playerFighter.id, r.aiFighter.id, winner, G.season, G.week);
    });
    G = { ...G, roster: warRoster };

    // h2h記録: 対抗戦
    let warH2h = { ...(G.h2h || {}) };
    wp.results.forEach(r => {
      const winner = r.playerWon ? 'left' : 'right';
      const warMeta = App._buildMatchMeta(G, r.playerFighter.id, r.aiFighter.id, false);
      warH2h = Engine.h2h.update(warH2h, r.playerFighter.id, r.aiFighter.id, winner, r.mq, false, false, G.season, G.week, 'war', 'player', ev.opponentOrgId, warMeta);
      // firing-grudge-spec-v0.1 タスクc(2026-07-17): 対抗戦は元同僚(B-3)が最も出会いやすいクロス団体戦のため firedReturn を接続
      G = App._maybeEmitFiredReturn(G, r.playerFighter, ev.opponentOrgId, 'player');
      G = App._maybeEmitFiredReturn(G, r.aiFighter, 'player', ev.opponentOrgId);
    });
    G = { ...G, h2h: warH2h };

    // Phase 4 E-01: 対抗戦の関係値反映 + applyMatchResult（isCrossOrg=true）
    if (G.relationships) {
      const warRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE5A));
      let relState = { ...G };
      // 対戦した選手間: applyMatchResult で全イベント判定（他団体戦ブースト付き）
      wp.results.forEach(r => {
        const playerId = r.playerFighter.id;
        const aiId = r.aiFighter.id;
        const warContext = {
          mq: r.mq,
          winner: r.playerWon ? 'win' : 'lose',
          hpA: r.hpLeft || { final: 50, max: 100 }, hpB: r.hpRight || { final: 50, max: 100 },
          turns: r.turns || 10,
          stage: 'normal',
          isTitleMatch: false,
          rivalryResolved: false,
          injuredId: null,
          isCareerBestA: r.mq > (r.playerFighter.careerBestMQ || 0),
          isCareerBestB: false,
          losingStreakA: r.playerFighter.losingStreak || 0,
          losingStreakB: 0,
          ovrA: Engine.util.ov(r.playerFighter),
          ovrB: Engine.util.ov(r.aiFighter),
          isCrossOrg: true,
        };
        relState = Engine.relationships.applyMatchResult(relState, playerId, aiId, warContext, warRelRng);
      });
      // チームメイト間: bond +2~+4
      const participantIds = [...warFighterIds];
      if (participantIds.length >= 2) {
        relState = Engine.relationships.applyAllPairs(relState, participantIds,
          { min: 2, max: 4 }, { min: 0, max: 0 }, warRelRng);
      }
      G = { ...G, relationships: relState.relationships };
    }

    // ── v4 §2-1: F02③ 決着 判定（対抗戦） ──
    if (Engine.factions && typeof Engine.factions.rollResolutionAfterMatch === 'function' && !G._pendingFactionEvent) {
      for (let i = 0; i < wp.results.length; i++) {
        const r = wp.results[i];
        if (!r || !r.playerFighter || !r.aiFighter) continue;
        const winnerId = r.playerWon ? r.playerFighter.id : r.aiFighter.id;
        const loserId  = r.playerWon ? r.aiFighter.id : r.playerFighter.id;
        const res = Engine.factions.rollResolutionAfterMatch(G, { winnerId, loserId, isDraw: false });
        G = res.state;
        if (res.pendingEvent) { G = { ...G, _pendingFactionEvent: res.pendingEvent }; break; }
      }
    }

    Storage.autoSave();

    // Swap content directly (no close→reopen gap that would flash event screen)
    renderWarFinalResult(ev, wp.results, playerWins, aiWins, eventWon);
    App._warPreview = null;
  }
};

// ══════════════════════════════════════════════
//  PPV GRAND FINAL: Show Day System (Step 4)
// ══════════════════════════════════════════════
App._ppvPreview = null;

App.initPPVShow = function() {
  const ppvDay = Engine.ppv.preparePPVDay(G);
  App._ppvPreview = {
    card: ppvDay.card,
    substitutions: ppvDay.substitutions,
    summitPair: ppvDay.summitPair,
    results: new Array(ppvDay.card.length).fill(null),
    currentWatching: -1,
  };
  try { Audio.bgm.playStage(_ppvStageTrack(App._ppvPreview)); } catch(e) {}

  // カードが空の場合は即座にfinalize（スタック防止）
  if (ppvDay.card.length === 0) {
    console.warn('[WM Debug] PPV card is empty — entries:', JSON.stringify(G.ppvEntries ? Object.fromEntries(Object.entries(G.ppvEntries).map(([k,v]) => [k, (v||[]).length])) : 'null'));
    showEventPopup({
      type: 'system', tone: 'negative',
      message: 'カード編成不成立',
      detail: '出場可能な選手が不足しており、対戦カードを組めませんでした',
    });
    setTimeout(() => App.finalizePPV(), 1500);
    return;
  }

  // 代替通知ポップアップ
  if (ppvDay.substitutions.length > 0) {
    let popupChain = Promise.resolve();
    ppvDay.substitutions.forEach(sub => {
      const orgName = sub.orgId === 'player' ? (G.orgName || '自団体') : (RIVAL_ORGS.find(o => o.id === sub.orgId)?.name || sub.orgId);
      popupChain = popupChain.then(() => new Promise(resolve => {
        showEventPopup({
          type: 'fighter', id: sub.originalId, name: sub.original,
          tone: 'negative',
          message: `${sub.original}が出場不能！`,
          detail: `${orgName}の${sub.substitute}が緊急出場`,
        });
        setTimeout(resolve, 1500);
      }));
    });
    popupChain.then(() => _ppvOpenWithIntro());
  } else {
    _ppvOpenWithIntro();
  }
};

/** PPV GRAND FINAL の入り口。他の特別興行と同じく **導入(コーチ→選手) → 会場入り** を挟んでから、
 *  従来のカード紹介へ渡す。天頂戦の無い年の Week48 はこちらが年間の締めくくりになる。 */
function _ppvOpenWithIntro() {
  const toCard = () => showPPVMatchCardIntro(() => renderPPVMatchPreview());
  // 自団体のエントリー。喋るのもバスに乗るのもこの人たち
  const party = ((G.ppvEntries && G.ppvEntries.player) || [])
    .map(e => (G.roster || []).find(f => f && f.id === e.id) || e).filter(Boolean);
  const toTravel = () => {
    if (typeof showSpecialEventTravel === 'function' && party.length) {
      showSpecialEventTravel('ppvGrandFinal', G, party, toCard);
    } else {
      toCard();
    }
  };
  if (typeof showSpecialEventIntro === 'function') {
    showSpecialEventIntro('ppvGrandFinal', G, toTravel, { pool: party });
  } else {
    toTravel();
  }
}

// MQ再設計P3b: 因縁のリング内化(§3.3)。PPVは「プレイヤー選手が関与する試合のみ」という
// 既存の因縁判定条件を変えず、シム前に解決してopts化する(applyPPVResultsの判定条件と対称)。
App._ppvRingInOpts = function(match) {
  const pLeft = G.roster.find(c => c.id === match.left.id);
  const pRight = G.roster.find(c => c.id === match.right.id);
  if (!pLeft && !pRight) return undefined;
  const ringIn = Engine.mq.buildRingInOpts(G, match.left.id, match.right.id, { roster: G.roster });
  return ringIn.simOpts;
};

App.ppvWatchMatch = function(idx) {
  const pp = App._ppvPreview;
  if (!pp || pp.results[idx]) return;
  pp.currentWatching = idx;
  const match = pp.card[idx];

  // Replay: 結果事前計算 (skip と同 seed)
  const ppvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
  const ppvResult = Engine.ppv.simulatePPVMatch(match.left, match.right, ppvRng,
    { recordFrames: true, ...App._ppvRingInOpts(match) });
  pp.results[idx] = ppvResult;

  const overlay = document.getElementById('battleOverlay');
  overlay.style.display = 'block';
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  clearTimeout(App._escBtnTimer);
  App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

  const iframe = document.getElementById('battleIframe');
  const total = pp.card.length;
  const matchNum = idx + 1;
  const msg = {
    type: 'START_MATCH',
    left: {
      ...match.left, condition: 80,
      portraitUrl: getPortraitUrl(match.left.id), profile: CHAR_PROFILES[match.left.id] || '',
      vl: App._buildVlVsPlayerForExEmployee(match.left, G.season, G.week, match.right.orgId),
      vsExHit: App._buildVsExHitLines(match.left, G.season, G.week, match.right.orgId)
    },
    right: {
      ...match.right, condition: 80,
      portraitUrl: getPortraitUrl(match.right.id), profile: CHAR_PROFILES[match.right.id] || '',
      vl: App._buildVlVsPlayerForExEmployee(match.right, G.season, G.week, match.left.orgId),
      vsExHit: App._buildVsExHitLines(match.right, G.season, G.week, match.left.orgId)
    },
    matchInfo: {
      header: match.isSummit ? '🏆 頂上決戦' : `PPV 第${matchNum}試合`,
      subHeader: `${match.left.name} vs ${match.right.name}`,
      matchNum,
      totalMatches: total,
      isTitle: false,
      isSpecialMatch: matchNum === total,
      matchTier: 2,
      rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, match.left.id, match.right.id); return rl ? rl.tier : 0; })(),
      leftPersonality: match.left.personality || 'normal',
      leftArchetype: match.left.archetype || 'standard',
      rightPersonality: match.right.personality || 'normal',
      rightArchetype: match.right.archetype || 'standard',
      sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
    },
    result: ppvResult,
  };
  // ビッグマッチBGM（PPV）
  try { Audio.bgm.playStage('bigMatch'); } catch(e) {}
  let sent = false;
  const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
  iframe.onload = () => setTimeout(sendOnce, 200);
  iframe.src = 'battle-engine.html?t=' + Date.now();
  setTimeout(sendOnce, 800);
};

App.ppvSkipMatch = function(idx) {
  const pp = App._ppvPreview;
  if (!pp || pp.results[idx]) return;
  const match = pp.card[idx];
  const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
  pp.results[idx] = Engine.ppv.simulatePPVMatch(match.left, match.right, matchRng, App._ppvRingInOpts(match));
  Audio.play('tick');
  renderPPVMatchPreview();
  renderPPVMatchResultPopup(idx, () => {
    if (pp.results.every(r => r !== null)) App.finalizePPV();
  });
};

App.ppvSkipAll = function() {
  const pp = App._ppvPreview;
  if (!pp) return;
  pp.card.forEach((match, idx) => {
    if (pp.results[idx]) return;
    const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
    pp.results[idx] = Engine.ppv.simulatePPVMatch(match.left, match.right, matchRng, App._ppvRingInOpts(match));
  });
  Audio.play('bellx3');
  App.finalizePPV();
};

App._receivePPVBattleResult = function(data) {
  clearTimeout(App._escBtnTimer);
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  const pp = App._ppvPreview;
  if (!pp || pp.currentWatching < 0) return;
  const idx = pp.currentWatching;
  // Replay 移行: 事前計算済みなら結果を維持し overlay を閉じて次へ
  if (pp.results[idx]) {
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    pp.currentWatching = -1;
    try { Audio.play('click'); } catch(e) {}
    renderPPVMatchPreview();
    renderPPVMatchResultPopup(idx, () => {
      if (pp.results.every(r => r !== null)) App.finalizePPV();
      else setTimeout(() => { if (App._ppvPreview) { try { Audio.bgm.playStage(_ppvStageTrack(App._ppvPreview)); } catch(e) {} } }, 1600);
    });
    return;
  }
  const match = pp.card[idx];
  pp.results[idx] = {
    left: match.left, right: match.right,
    winner: data.winner,
    finType: data.finType || '', finMove: data.finMove || '',
    turns: data.turns || 0,
    mq: data.mq || 50,
    hpLeft: { final: data.hpLeft ? (data.hpLeft.current != null ? data.hpLeft.current : data.hpLeft.final) : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
    hpRight: { final: data.hpRight ? (data.hpRight.current != null ? data.hpRight.current : data.hpRight.final) : 0, max: data.hpRight ? data.hpRight.max : 100 },
    log: data.log || []
  };
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  document.getElementById('battleOverlay').style.display = 'none';
  pp.currentWatching = -1;
  try { Audio.play('click'); } catch(e) {}
  renderPPVMatchPreview();
  renderPPVMatchResultPopup(idx, () => {
    if (pp.results.every(r => r !== null)) App.finalizePPV();
    else setTimeout(() => { if (App._ppvPreview) { try { Audio.bgm.playStage(_ppvStageTrack(App._ppvPreview)); } catch(e) {} } }, 1600);
  });
};

App.finalizePPV = function() {
  const pp = App._ppvPreview;
  if (!pp) return;
  if (pp.results.some(r => r === null)) return;

  // 結果反映
  const result = Engine.ppv.applyPPVResults(G, pp.card, pp.results, pp.summitPair);
  let s = result.state;
  // forcedRest（S3休養願い）フラグをクリア
  let roster = s.roster.map(c => c.forcedRest ? { ...c, forcedRest: false } : { ...c });
  const events = result.events;

  // Step 5-6: ブレークスルー判定 + careerBestMQ + スランプ + モチベ喪失
  const pendingGrowthEvents = [];
  const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF7));
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    [
      { fId: match.left.id, oppF: match.right, won: r.winner === 'left' },
      { fId: match.right.id, oppF: match.left, won: r.winner === 'right' },
    ].forEach(({ fId, oppF, won }) => {
      const fighter = roster.find(c => c.id === fId);
      if (!fighter) return; // プレイヤー所属でない
      const oppOvr = Engine.util.ov(oppF);
      const isRivalryResolution = !!r.rivalryResolved;

      // ブレークスルー判定
      const btContext = { isTitle: false, won, isPPV: true, isRivalryResolution, isWarMatch: false };
      const btResult = Engine.growthEvents.checkAndApplyBreakthrough(
        btRng, fighter, r.mq, oppOvr, btContext, s.season, s.week, Engine.coach.getFlavorBreakthroughMult(s, fighter.id)
      );
      if (btResult) {
        roster = roster.map(c => c.id === fId ? btResult.fighter : c);
        const btHintFighterPPV = roster.find(c => c.id === fId) || fighter;
        const btHintLinePPV = pickDialogueLine(BT_HINT_LINES, btHintFighterPPV);
        pendingGrowthEvents.push({
          type: 'breakthrough', fighterId: fId,
          stat: btResult.stat, gain: btResult.gain, hotStreak: btResult.hotStreak,
          btHint: btHintLinePPV
        });
        // Phase 4 G-01: ブレークスルー → 関係値反映
        if (s.relationships) {
          const btRelRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE57, fId));
          s = Engine.relationships.applyBreakthroughEffect(s, fId, btRelRng);
        }
      }

      // careerBestMQ 更新
      const updatedFighter = roster.find(c => c.id === fId);
      if (r.mq > (updatedFighter.careerBestMQ || 0)) {
        roster = roster.map(c => c.id === fId ? { ...c, careerBestMQ: r.mq } : c);
      }

      // 敗北スランプ判定
      if (!won) {
        const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF8, fId));
        const slumpFighter = roster.find(c => c.id === fId);
        if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
          const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
          roster = roster.map(c => c.id === fId ? newF : c);
          pendingGrowthEvents.push({ type: 'slump_start', fighterId: fId, trigger: 'defeat' });
          // Phase 4 G-03: スランプ → 関係値反映
          if (s.relationships) {
            const symRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE58, fId));
            s = Engine.relationships.applySympathyEffect(s, fId, { min: 1, max: 2 }, symRng);
            // N-05: スランプ八つ当たり
            const lashRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6E, fId));
            s = Engine.relationships.applySlumpLashout({ ...s, roster }, fId, lashRng);
          }
        }
      }

      // momentum更新 + モチベ喪失チェック
      const momRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF9, fId));
      const momFighter = roster.find(c => c.id === fId);
      let updF = Engine.growthEvents.updateSlumpMomentumAfterMatch(momFighter, r.mq, won, momRng);
      updF = Engine.growthEvents.updateMotivationLossMomentumAfterMatch(updF, r.mq, won, momRng);
      if (!won && updF.slump) {
        const mlRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBFA, fId));
        if (Engine.growthEvents.checkMotivationLoss(mlRng, updF, 'defeat')) {
          updF = Engine.growthEvents.applyMotivationLoss(updF, s.season, s.week);
          pendingGrowthEvents.push({ type: 'motivation_loss_start', fighterId: fId });
          // Phase 4 G-06: モチベ喪失 → 関係値反映
          if (s.relationships) {
            const symRng2 = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE59, fId));
            s = Engine.relationships.applySympathyEffect(s, fId, { min: 1, max: 1 }, symRng2);
          }
        }
      }
      if (updF !== momFighter) {
        roster = roster.map(c => c.id === fId ? updF : c);
      }
    });
  });

  s = { ...s, roster };

  // 新聞用: 頂上決戦結果を保存（次週の新聞生成で使用）
  if (pp.summitPair) {
    const summitIdx = pp.card.findIndex(m => m.isSummit);
    if (summitIdx >= 0) {
      const sr = pp.results[summitIdx];
      const sm = pp.card[summitIdx];
      const sp = pp.summitPair;
      // 自団体所属を厳密判定。player不在のTVモードでは playerInvolved=false
      const leftIsPlayer = sm.left._ppvOrgId === 'player';
      const rightIsPlayer = sm.right._ppvOrgId === 'player';
      const playerInvolved = leftIsPlayer || rightIsPlayer;
      const playerF = leftIsPlayer ? sm.left : (rightIsPlayer ? sm.right : sm.left);
      const aiF = (playerF === sm.left) ? sm.right : sm.left;
      const playerWon = playerInvolved && (
        (sr.winner === 'left' && playerF === sm.left) ||
        (sr.winner === 'right' && playerF === sm.right)
      );
      const winnerF = sr.winner === 'left' ? sm.left : (sr.winner === 'right' ? sm.right : null);
      const loserF = winnerF ? (winnerF === sm.left ? sm.right : sm.left) : null;

      // 団体名（プレイヤー側 / 相手側）
      const orgNameOf = (orgId) => orgId === 'player' ? (G.orgName || 'プレイヤー団体') : Engine.contract._getOrgName(orgId, G);
      const playerOrgName = playerInvolved ? (G.orgName || 'プレイヤー団体')
        : orgNameOf(sp.org1Id);
      const aiOrgId = playerInvolved
        ? (sp.org1Id === 'player' ? sp.org2Id : sp.org1Id)
        : sp.org2Id;
      const aiOrgName = orgNameOf(aiOrgId);

      // ランキング
      const rankings = G.rankings || [];
      const playerOrgIdLookup = playerInvolved ? 'player' : sp.org1Id;
      const playerRank = (rankings.find(r => r.orgId === playerOrgIdLookup) || {}).rank || null;
      const aiRank = (rankings.find(r => r.orgId === aiOrgId) || {}).rank || null;

      // h2h（更新前なのでprior）
      const priorH2h = playerF && aiF ? Engine.h2h.getRecordFor(G, playerF.id, aiF.id) : null;

      // HP残量
      const winnerSide = sr.winner;
      const winnerHpFinal = winnerSide === 'left' ? (sr.hpLeft?.final ?? 0) : (sr.hpRight?.final ?? 0);
      const winnerHpMax = winnerSide === 'left' ? (sr.hpLeft?.max ?? 100) : (sr.hpRight?.max ?? 100);
      const loserHpFinal = winnerSide === 'left' ? (sr.hpRight?.final ?? 0) : (sr.hpLeft?.final ?? 0);
      const loserHpMax = winnerSide === 'left' ? (sr.hpRight?.max ?? 100) : (sr.hpLeft?.max ?? 100);

      // 勝者セリフ（自団体勝利時のみ、PPV_SUMMIT_VICTORY_LINESから1本）
      let winnerLine = null;
      if (playerWon && winnerF && typeof PPV_SUMMIT_VICTORY_LINES !== 'undefined' && typeof pickDialogueLine === 'function') {
        try { winnerLine = pickDialogueLine(PPV_SUMMIT_VICTORY_LINES, winnerF); } catch (e) {}
      }
      // task-75: 頂上決戦の**敗者**は、これまで一言も喋らなかった。
      // 年間最大の舞台で負けた側が無言なのは演出として穴なので埋める。
      // 因縁の有無で色が変わる（pickPpvLine が両向きの rivalry を見て決める）。
      let loserLine = null;
      const summitLoserF = winnerSide === 'left' ? sr.right : sr.left;
      const summitWinnerF = winnerSide === 'left' ? sr.left : sr.right;
      if (summitLoserF && typeof pickPpvLine === 'function') {
        try { loserLine = pickPpvLine('summitLose', summitLoserF, summitWinnerF, G) || null; } catch (e) {}
      }

      s._newsSummitResult = {
        loserLine,
        playerInvolved,
        playerName: playerF.name,
        playerId: playerF.id,
        playerOrgName,
        aiName: aiF.name,
        aiId: aiF.id,
        aiOrgName,
        opponentName: aiOrgName, // 後方互換
        won: playerWon,
        winnerName: winnerF ? winnerF.name : null,
        winnerId: winnerF ? winnerF.id : null,
        loserName: loserF ? loserF.name : null,
        loserId: loserF ? loserF.id : null,
        mq: sr.mq,
        finType: sr.finType,
        finMove: sr.finMove,
        finishPhase: sr.finishPhase,
        turns: sr.turns,
        winnerHpFinal, winnerHpMax,
        loserHpFinal, loserHpMax,
        playerRank, aiRank,
        priorH2h: priorH2h ? { wins: priorH2h.wins, losses: priorH2h.losses, draws: priorH2h.draws, matches: priorH2h.matches } : null,
        winnerLine,
      };
    }
  }

  // 新聞用: PPVアンダーカード結果を蓄積（業界ニュース欄用、サミット以外の上位MQ3件）
  {
    // G.aiOrgs[orgId] には .name が無い(実名は rivalOrgNames/RIVAL_ORGS 側)。
    // 直上の頂上決戦ブロックが使っている orgNameOf と同じ解決順に揃える(2026-08-01 修正)。
    const orgNameOfU = (orgId) => orgId === 'player' ? (G.orgName || 'プレイヤー団体') : Engine.contract._getOrgName(orgId, G);
    const undercards = [];
    pp.results.forEach((r, idx) => {
      const match = pp.card[idx];
      if (match.isSummit) return;
      const winnerSide = r.winner;
      if (winnerSide !== 'left' && winnerSide !== 'right') return; // 引き分けは除外
      const winnerF = winnerSide === 'left' ? match.left : match.right;
      const loserF = winnerSide === 'left' ? match.right : match.left;
      undercards.push({
        winnerName: winnerF.name,
        winnerId: winnerF.id,
        winnerOrgName: orgNameOfU(winnerF._ppvOrgId),
        winnerOrgId: winnerF._ppvOrgId,
        loserName: loserF.name,
        loserId: loserF.id,
        loserOrgName: orgNameOfU(loserF._ppvOrgId),
        loserOrgId: loserF._ppvOrgId,
        mq: r.mq || 0,
        finType: r.finType || '',
        finMove: r.finMove || '',
        turns: r.turns || 0,
        isTitleMatch: !!match.isTitleMatch,
      });
    });
    undercards.sort((a, b) => b.mq - a.mq);
    s._newsPpvUndercards = undercards.slice(0, 3);
  }

  // recentMatches記録（PPV）
  let ppvRoster = [...(s.roster || G.roster)];
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    ppvRoster = Engine.pushRecentMatch(ppvRoster, match.left.id, match.right.id, r.winner, s.season, s.week);
  });
  s = { ...s, roster: ppvRoster };

  // h2h記録: PPV（合同興行のため各選手の所属を判定）
  const _findOrgKey = (fid) => {
    if ((s.roster || []).some(c => c.id === fid)) return 'player';
    const aiOrgs = s.aiOrgs || {};
    for (const k in aiOrgs) {
      if ((aiOrgs[k].roster || []).some(c => c.id === fid)) return k;
    }
    return undefined;
  };
  let ppvH2h = { ...(s.h2h || {}) };
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    const lOrg = _findOrgKey(match.left.id);
    const rOrg = _findOrgKey(match.right.id);
    const ppvMeta = App._buildMatchMeta(s, match.left.id, match.right.id, false);
    ppvH2h = Engine.h2h.update(ppvH2h, match.left.id, match.right.id, r.winner, r.mq, false, true, s.season, s.week, 'ppv', lOrg, rOrg, ppvMeta);
    // firing-grudge-spec-v0.1 タスクc(2026-07-17): PPVは合同興行=元同僚(B-3)の再会が起きやすいクロス団体戦のためfiredReturnを接続
    if (lOrg && rOrg && lOrg !== rOrg) {
      s = App._maybeEmitFiredReturn(s, match.left, rOrg, lOrg);
      s = App._maybeEmitFiredReturn(s, match.right, lOrg, rOrg);
    }
  });
  s = { ...s, h2h: ppvH2h };

  // シーズンstats更新
  const stats = { ...(G.seasonStats || {}) };
  stats.showCount = (stats.showCount || 0) + 1;
  pp.results.forEach(r => {
    if (r.mq > (stats.bestMQ || 0)) { stats.bestMQ = r.mq; stats.bestMQMatch = `${r.left?.name || '?'} vs ${r.right?.name || '?'}`; }
  });

  G = { ...G, ...s, seasonStats: stats, weekPhase: 'showExec', gameLog: [...G.gameLog, ...events] };

  // ポップアップ用データを保存
  if (pendingGrowthEvents.length > 0) {
    G = { ...G, _pendingGrowthEvents: pendingGrowthEvents };
  }
  App._pendingRivalryResolutions = result.rivalryResolutions || [];

  const savedCard = pp.card;
  const savedResults = pp.results;
  const savedSummitPair = pp.summitPair;
  const savedHeatChange = result.heatChange;
  const savedMQBonuses = result.mqBonuses;
  // task-73: コーチ総括はこの後の closePPVResult で出す。_ppvPreview を捨てる前に材料を預けておく
  App._tcwPpvArgs = { card: savedCard, results: savedResults };
  App._ppvPreview = null;

  try { Audio.fileBgm.stop(); } catch(e) {}
  Audio.bgm.playJingle('victory');
  renderPPVResult(savedCard, savedResults, savedSummitPair, savedHeatChange, savedMQBonuses);
};

App.closePPVResult = function() {
  // task-73: 週次処理へ入る前にコーチが1枚だけ締める。表示したら resume でここへ戻ってくる
  if (App._tcwGate('ppv', App._tcwPpvArgs || {}, () => App.closePPVResult())) return;
  // 2026-08-31: 二重tickガード(保険)。委譲側の除外(ui-common _handlePatternBResultClose)が
  // 主修正だが、何らかの経路で既に週が進んでいた場合はtickせず後片付けだけで戻る。
  // PPVは常にW48なので「オフシーズン入り or 週が48でない」=処理済みの証拠
  if (G.offSeason || G.week !== 48) {
    console.warn('[WM] closePPVResult: 週が既に進んでいるためtickを省略(二重実行ガード)');
    const staleOverlay = document.getElementById('showResultOverlay');
    if (staleOverlay) staleOverlay.classList.remove('active');
    Audio.play('click');
    Audio.bgm.playForState();
    showScreen('week');
    if (typeof refreshAll === 'function') refreshAll();
    return;
  }
  const resultOverlay = document.getElementById('showResultOverlay');
  resultOverlay.classList.remove('active');
  Audio.play('click');
  Audio.bgm.play('management');

  // 試合後コメントポップアップ（因縁マッチ）— 通常興行の閉じ方と揃える
  // 同期で開かない(2026-08-13): この後の App.advanceWeek → dismissAllPopups が同 tick で
  // 走り、表示前に消される(closeShowResult と同じ理由)。タイマー遅延で全消去の後に開く。
  const ppvMatchDialogues = [..._pendingMatchDialogues];
  _pendingMatchDialogues = [];
  if (ppvMatchDialogues.length > 0) setTimeout(() => showPostMatchDialogues(ppvMatchDialogues), 0);

  // Step 5-6: ポップアップ用データ取得 + Gからクリア
  const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
  if (G._pendingGrowthEvents) {
    const { _pendingGrowthEvents: _, ...cleanG } = G;
    G = cleanG;
  }
  const pendingResolutions = App._pendingRivalryResolutions || [];
  App._pendingRivalryResolutions = [];

  // tickWeek→settlement→week48完了
  const result = Engine.tickWeek(G);
  const stats = { ...G.seasonStats };
  if (result.state.weeklyFinance) {
    stats.totalRevenue += result.state.weeklyFinance.income || 0;
    stats.totalExpense += result.state.weeklyFinance.expense || 0;
  }
  const fh = [...(G.fundsHistory || []), result.state.funds];
  G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
  G = { ...G, showCard: [] };
  App.preloadNewspaperImages(G.weeklyNewspaper);

  App._refreshTicker();
  App.checkSurvivalUpdate();
  // Step 5-6: バフ消費
  App._tickMilestoneBuffsShow();
  App._applyWeeklyBuffEffects();
  App._tickMilestoneBuffsWeekly();
  Storage.autoSave();

  // Step 5-6: ポップアップチェーン（逆順に組み立て: growth ← resolution）
  let nextAction = null;
  if (pendingGrowthEventsShow.length > 0) {
    const after = nextAction;
    nextAction = () => showGrowthEventPopups(pendingGrowthEventsShow, after || (() => {}));
  }
  if (pendingResolutions.length > 0) {
    const after = nextAction;
    nextAction = () => showRivalryPopups(pendingResolutions, after || (() => {}));
  }
  if (nextAction) {
    setTimeout(nextAction, 200);
  }

  // P4-P6: PPV後のGlimpse表示
  if (G._pendingGlimpseA || G._pendingGlimpseB) {
    const gA = G._pendingGlimpseA || null;
    const gB = G._pendingGlimpseB || null;
    if (G._pendingGlimpseA) { const { _pendingGlimpseA: _, ...c } = G; G = c; }
    if (G._pendingGlimpseB) { const { _pendingGlimpseB: _, ...c } = G; G = c; }
    const allGlimpses = [...(gA || []), ...(gB || [])];
    const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
    const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
    if (tier2.length > 0) {
      G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
    }
    if (tier1.length > 0) {
      setTimeout(() => { showGlimpseCascade(tier1); }, 500);
    }
  }

  // PPV参加済み→TV中継フェーズをスキップし直接オフシーズンへ
  G = { ...G, ppvPhase: null };
  Storage.autoSave();
  App.advanceWeek();
};

App.initPPVTV = function() {
  // 先に不透明な中継枠を出す。イベントキューの解消を待つ間も、背面の総括等は見せない。
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  if (overlay && box) {
    box.innerHTML = '<div class="ptv-tv ptv-loading"><div class="ptv-screen"><div class="ptv-loading-label">WRESTLE TV<br><small>GRAND FINAL を準備中…</small></div></div></div>';
    overlay.classList.add('active');
  }

  // 保存→再開や経路の重複呼び出しでも、同じ第48週を再シミュレート／二重記録しない。
  const cached = G._ppvTvBroadcast;
  const isCurrentBroadcast = cached
    && cached.season === G.season
    && cached.week === G.week
    && Array.isArray(cached.card)
    && Array.isArray(cached.results);
  let tvResult;
  if (isCurrentBroadcast) {
    tvResult = cached;
  } else {
    const tvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF5));
    tvResult = Engine.ppv.simulateTVResults(G, tvRng);

    // 実績反映: battlePoints + orgWarRecord + h2h + サミット戦績(AIロスター) + 新聞素材
    G = {
      ...G,
      battlePoints: tvResult.battlePoints,
      orgWarRecord: tvResult.orgWarRecord || G.orgWarRecord,
      h2h: tvResult.h2h || G.h2h,
      aiOrgs: tvResult.aiOrgs || G.aiOrgs,
      _newsSummitResult: tvResult.newsSummitResult || G._newsSummitResult,
      _newsPpvUndercards: (tvResult.newsPpvUndercards && tvResult.newsPpvUndercards.length > 0)
        ? tvResult.newsPpvUndercards : G._newsPpvUndercards,
      ppvTvWatchCount: (G.ppvTvWatchCount || 0) + 1,
      _ppvTvBroadcast: { season: G.season, week: G.week, card: tvResult.card, results: tvResult.results },
      gameLog: [...G.gameLog, ...tvResult.events],
    };
    Storage.autoSave();
  }

  // テレビ中継5場面(放送OP→カード→速報→頂上決戦→放送終了)
  // 「準備中…」で固まらないよう、キュー解消の待ちには必ず保険の時限を掛ける
  // (2026-07-31: ポップアップが1つも無いと待ちが解けず進行不能になった)。
  let _ppvTvStarted = false;
  const _startBroadcast = () => {
    if (_ppvTvStarted) return;
    _ppvTvStarted = true;
    try {
      renderPPVTvBroadcast(tvResult.card, tvResult.results, G.ppvName);
    } catch (e) {
      // 中継の組み立てが転んでも「準備中…」の出口ゼロ画面に置き去りにしない(§5-D 鉄則1)。
      // 二重起動防止フラグは先に立ててあるのでネットは二度と張られない — ここが最後の砦。
      console.warn('[WM] ppvTV broadcast render failed — falling back to the exit card:', e && e.message);
      App._renderPPVTvFallback();
    }
  };
  _chainEventPopupQueueEmpty(_startBroadcast);
  setTimeout(() => {
    if (!_ppvTvStarted) {
      console.warn('[WM] ppvTV safety net fired — starting broadcast without queue drain');
      _startBroadcast();
    }
  }, 3000);
};

// 中継が描けなかったときの最小画面。週送りの出口(事務所へ戻る)だけは必ず届かせる。
App._renderPPVTvFallback = function() {
  const overlay = document.getElementById('showResultOverlay');
  const box = document.getElementById('showResultBox');
  if (!overlay || !box) return;
  box.innerHTML = '<div class="ptv-tv"><div class="ptv-screen">'
    + '<div class="ptv-chrome"><span class="ptv-ch">WRESTLE TV</span><span class="ptv-live is-off">放送終了</span></div>'
    + '<div class="ptv-ending">'
    + '<div class="ptv-end-msg">テレビの明かりを消す。<br><br>今年の年末も、画面の中は他所の景色だった。</div>'
    + '<button type="button" class="ptv-btn" onclick="App.closePPVTV()">事務所へ戻る</button>'
    + '</div></div></div>';
  overlay.classList.add('active');
};

App.closePPVTV = function() {
  // task-73: TV観戦(自団体不出場)の回も、コーチが見ての一言を必ず1枚出す
  if (App._tcwGate('ppv', {}, () => App.closePPVTV())) return;
  // §5-D鉄則2: closePPVResult と同じ再入ガード。本体は tickWeek→advanceWeek を含む。
  // 正規の閉じ時は advanceWeek が立てた 'ppvTV' のまま(initPPVTV は phase を変えない)
  if (G.offSeason || G.weekPhase !== 'ppvTV') {
    console.info('[WM] closePPVTV re-entry ignored — week already advanced', {
      season: G.season, week: G.week, weekPhase: G.weekPhase, offSeason: !!G.offSeason,
    });
    const staleOverlay = document.getElementById('showResultOverlay');
    if (staleOverlay) staleOverlay.classList.remove('active');
    return;
  }
  const overlay = document.getElementById('showResultOverlay');
  overlay.classList.remove('active');
  // 放送終了後も頂上決戦曲を残さない。画面遷移・直接の「事務所へ戻る」の両方で止める。
  try { Audio.bgm.stop(); } catch (e) {}
  try { Audio.fileBgm.stop(); } catch (e) {}
  Audio.play('click');

  // tickWeek: PPV TV観戦中でも週次処理（訓練・給与・関係値）は実行する
  const result = Engine.tickWeek(G);
  const stats = { ...G.seasonStats };
  if (result.state.weeklyFinance) {
    stats.totalRevenue += result.state.weeklyFinance.income || 0;
    stats.totalExpense += result.state.weeklyFinance.expense || 0;
  }
  if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
  if ((result.state.orgPop || 0) > stats.peakPop) stats.peakPop = result.state.orgPop || 0;
  const fh = [...(G.fundsHistory || []), result.state.funds];
  G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
  App.preloadNewspaperImages(G.weeklyNewspaper);

  App._refreshTicker();
  App.checkSurvivalUpdate();
  App._applyWeeklyBuffEffects();
  App._tickMilestoneBuffsWeekly();

  // P4-P6: PPV TV後のGlimpse表示
  if (G._pendingGlimpseA || G._pendingGlimpseB) {
    const gA = G._pendingGlimpseA || null;
    const gB = G._pendingGlimpseB || null;
    if (G._pendingGlimpseA) { const { _pendingGlimpseA: _, ...c } = G; G = c; }
    if (G._pendingGlimpseB) { const { _pendingGlimpseB: _, ...c } = G; G = c; }
    const allGlimpses = [...(gA || []), ...(gB || [])];
    const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
    const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
    if (tier2.length > 0) {
      G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
    }
    if (tier1.length > 0) {
      setTimeout(() => { showGlimpseCascade(tier1); }, 500);
    }
  }

  // ppvPhaseクリア→advanceWeek→オフシーズンへ
  G = { ...G, ppvPhase: null, _ppvTvBroadcast: undefined };
  Storage.autoSave();
  App.advanceWeek();
};

// ══════════════════════════════════════════════════════════
//  task-73 特別興行後のコーチ総括 — 進行への割り込み(5大会共通)
//
//  「大会結果 → コーチ → 経営画面」の連鎖なので、**詰まると週が進まなくなる**。
//  そのため、この関数は次の3点を必ず守る:
//    1) 何が起きてもこの大会では二度と入らない(G.coachWrapup.lastKey を先に立てる)
//    2) 組み立て・描画が失敗したら false を返し、呼び出し元をそのまま通す(fail-open)
//    3) true を返したときは showCoachTournamentWrapup が onDone を必ず1回呼ぶ
//       (クリック / 背景タップ / タイムアウト / 内部例外 のどれでも同じ出口)
//
//  使い方: 大会終了ハンドラの先頭で
//      if (App._tcwGate('kind', args, () => App.同じ関数())) return;
//  と書く。resume は自分自身を呼び直すだけでよい(2回目は lastKey で素通りする)。
// ══════════════════════════════════════════════════════════
App._tcwGate = function(kind, args, resume) {
  let key = String(kind);
  try { key = `${kind}:${G.season}`; } catch (e) {}
  const prev = (G && G.coachWrapup) || {};
  if (prev.lastKey === key) return false; // 二重起動防止(resume の再入・連打)
  G = { ...G, coachWrapup: { ...prev, lastKey: key } };

  let payload = null;
  try {
    if (typeof buildCoachTournamentWrapup === 'function') {
      payload = buildCoachTournamentWrapup(kind, G, args || {});
    }
  } catch (e) {
    console.warn('[WM] coach wrapup build failed:', e && e.message);
    payload = null;
  }
  if (!payload) return false; // コーチが1人もいない等。無人の吹き出しは作らない

  // スポットライトは巡るもの。次回の同点判定で「直近で触れた選手」を後ろへ回すため、
  // 実際に名前を出した選手だけを新しい順で覚えておく(セーブに乗る)。
  try {
    const ids = Array.isArray(payload.mentionedIds) ? payload.mentionedIds : [];
    if (ids.length) {
      const before = Array.isArray(prev.recent) ? prev.recent : [];
      const recent = [...ids, ...before.filter(id => !ids.includes(id))].slice(0, 8);
      G = { ...G, coachWrapup: { ...G.coachWrapup, recent } };
    }
  } catch (e) {}

  if (typeof showCoachTournamentWrapup !== 'function') return false;
  showCoachTournamentWrapup(payload, resume);
  return true;
};

// ══════════════════════════════════════════════════════════
//  U-20 ジュニアトーナメント UI フロー
// ══════════════════════════════════════════════════════════
App._jtPreview = null; // トーナメント進行データ

// 新聞 1面 / 業界ニュース / 興行ダイジェスト で参照される肖像画像を
// あらかじめブラウザキャッシュに乗せる。Cloudflare Pages の CDN コールドスタートや
// 初回 paint タイミングで `background-image: url(...)` が一瞬 404 する事象の予防。
// idempotent: 同じ id をもう一度プリロードしても新規リクエストは飛ばない（ブラウザキャッシュ任せ）。
App._lastPreloadedNewspaperKey = null;
App.preloadNewspaperImages = function(wp) {
  if (!wp || typeof getUpperUrl !== 'function') return;
  const key = `${wp.season || 0}-${wp.week || 0}`;
  if (App._lastPreloadedNewspaperKey === key) return;
  App._lastPreloadedNewspaperKey = key;
  const ids = new Set();
  const add = (id) => { if (id != null && typeof PORTRAIT !== 'undefined' && PORTRAIT[id]) ids.add(id); };
  // 新聞再設計P1: 一面の枠が増え、隊列写真(characterIds)を持つ記事も肩・準トップ・小記事に
  // 回るようになったので、単数の characterId だけでなく隊列のメンバーもプリロードする
  const addStory = (s) => {
    if (!s) return;
    add(s.characterId);
    (Array.isArray(s.characterIds) ? s.characterIds : []).forEach(add);
  };
  addStory(wp.topStory);
  (wp.subStories || []).forEach(addStory);
  const psd = wp.playerShowData;
  if (psd) {
    add(psd.left?.id); add(psd.right?.id);
    add(psd.winner?.id);
    (psd.allMatches || []).forEach(m => { add(m.left?.id); add(m.right?.id); });
  }
  ids.forEach(id => {
    const url = getUpperUrl(id);
    if (!url) return;
    const img = new Image();
    img.src = url; // fire-and-forget; success or 404 どちらでも握り潰す
  });
};

App.initJuniorTournament = function() {
  const sel = G._juniorTournamentSelection;
  if (!sel || sel.cancelled || !Array.isArray(sel.participants) || sel.participants.length < 4) {
    // 不開催 → 通常週に戻す
    if (App.cancelJuniorTournamentForInsufficientParticipants) {
      App.cancelJuniorTournamentForInsufficientParticipants();
    } else {
      G = { ...G, weekPhase: 'manage' };
      delete G._juniorTournamentSelection;
      showScreen('week');
    }
    return;
  }
  const jtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
  const jtResult = Engine.juniorTournament.run(G, sel.participants, jtRng);
  if (!jtResult || !Array.isArray(jtResult.rounds) || !jtResult.rounds[0] || !Array.isArray(jtResult.rounds[0].matches)) {
    if (App.cancelJuniorTournamentForInsufficientParticipants) {
      App.cancelJuniorTournamentForInsufficientParticipants();
    }
    return;
  }

  // 自団体の出場選手を抽出（レンタル選手は元所属団体枠で出場するため除外）
  const playerIds = new Set((G.roster || []).filter(f => !f.isRental).map(f => f.id));
  const myParticipants = jtResult.rounds[0].matches
    .flatMap(m => [m.left, m.right])
    .filter(p => playerIds.has(p.id));

  App._jtPreview = {
    selection: sel,
    result: jtResult,
    currentRound: 0,
    currentMatch: 0,
    phase: myParticipants.length > 0 ? 'summon' : 'bracket',
    bgmTrack: 'juniorA',
    summonIndex: 0,
    myParticipants,
  };
  Audio.bgm.playStage('juniorA');
  // 導入(コーチ→選手) → 招集 → 会場入り → トーナメント表
  const afterIntro = () => {
    if (myParticipants.length > 0) {
      Audio.play('notify');
      renderJuniorTournamentSummon();
    } else {
      // 自団体の出場者ゼロでもトーナメント表は見せる
      renderJuniorTournamentBracket();
    }
  };
  if (typeof showSpecialEventIntro === 'function') {
    // pool を渡さないと、**U-20 の大会に出ないベテラン**が「出ます」と喋る(2026-07-26)。
    // 自団体から出場者ゼロの年は導入ごと省く
    showSpecialEventIntro('juniorTournament', G, afterIntro, { pool: myParticipants });
  } else {
    afterIntro();
  }
};

App.jtNextSummon = function() {
  const jt = App._jtPreview;
  if (!jt) return;
  jt.summonIndex++;
  if (jt.summonIndex >= jt.myParticipants.length) {
    jt.phase = 'bracket';
    Audio.play('tick');
    // 招集が済んだら会場入り → 対戦表。PPV型の全カード紹介は挟まない。
    const toBoard = () => renderJuniorTournamentBracket();
    if (typeof showSpecialEventTravel === 'function') {
      showSpecialEventTravel('juniorTournament', G, jt.myParticipants, toBoard);
    } else {
      toBoard();
    }
  } else {
    Audio.play('notify');
    renderJuniorTournamentSummon();
  }
};

App.jtWatchMatch = function(roundIdx, matchIdx) {
  const jt = App._jtPreview;
  if (!jt) return;
  jt.currentRound = roundIdx;
  jt.currentMatch = matchIdx;
  jt.phase = 'watching';

  const round = jt.result.rounds[roundIdx];
  const match = round.matches[matchIdx];
  const isFinal = roundIdx === jt.result.rounds.length - 1;
  jt.bgmTrack = isFinal ? 'bigMatch' : _jtBoardTrack(jt);

  // battle-engine iframe に試合データを送る（battleOverlay + battleIframe を使用）
  const overlay = document.getElementById('battleOverlay');
  overlay.style.display = 'block';
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  clearTimeout(App._escBtnTimer);
  App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

  const iframe = document.getElementById('battleIframe');
  if (!iframe) return;

  const leftF = (G.roster || []).find(f => f.id === match.left.id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === match.left.id)
    || match.left;
  const rightF = (G.roster || []).find(f => f.id === match.right.id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === match.right.id)
    || match.right;

  const roundLabel = round.name === 'final' ? '決勝' : round.name === 'semiFinal' ? '準決勝' : round.name === 'quarterFinal' ? '準々決勝' : '1回戦';
  // Replay: 事前シミュ済みの match から frames+winner 等を result として組み立てる
  const jtResult = {
    winner: match.winner, mq: match.mq, turns: match.turns,
    finType: match.finType || '', finMove: match.finMove || '',
    hpLeft: match.hpLeft, hpRight: match.hpRight,
    log: match.log || [], frames: match.frames || [],
  };
  const msg = {
    type: 'START_MATCH',
    left: {
      ...Engine.juniorTournament._withTournamentHp({ ...leftF, jtCarryHpPct: match.left.jtCarryHpPct != null ? match.left.jtCarryHpPct : 100 }, isFinal ? 2 : 1),
      portraitUrl: getPortraitUrl(leftF.id), profile: CHAR_PROFILES[leftF.id] || '',
      vl: leftF.voiceLines || leftF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[leftF.id]) || ['…！']
    },
    right: {
      ...Engine.juniorTournament._withTournamentHp({ ...rightF, jtCarryHpPct: match.right.jtCarryHpPct != null ? match.right.jtCarryHpPct : 100 }, isFinal ? 2 : 1),
      portraitUrl: getPortraitUrl(rightF.id), profile: CHAR_PROFILES[rightF.id] || '',
      vl: rightF.voiceLines || rightF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[rightF.id]) || ['…！']
    },
    matchInfo: {
      header: `🏆 ジュニアトーナメント ${roundLabel}`,
      subHeader: `${match.left.name} vs ${match.right.name}`,
      matchNum: matchIdx + 1,
      totalMatches: round.matches.length,
      isSpecialMatch: !!isFinal,
      matchTier: isFinal ? 2 : 1,
      leftPersonality: leftF.personality || 'normal',
      leftArchetype: leftF.archetype || 'standard',
      rightPersonality: rightF.personality || 'normal',
      rightArchetype: rightF.archetype || 'standard',
      preserveParentFileBgm: true,
      sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
    },
    result: jtResult,
  };
  // ビッグマッチBGM（決勝のみ）
  if (isFinal) Audio.bgm.playStage('bigMatch');
  let sent = false;
  const sendOnce = () => {
    if (sent) return; sent = true;
    iframe.contentWindow.postMessage(msg, '*');
  };
  iframe.onload = () => setTimeout(sendOnce, 200);
  iframe.src = 'battle-engine.html?t=' + Date.now();
  setTimeout(sendOnce, 800);
};

App.jtSkipMatch = function(roundIdx, matchIdx) {
  App._jtPreview.bgmTrack = _jtBoardTrack(App._jtPreview);
  // 試合結果画面を表示
  App._jtPreview.phase = 'matchResult';
  Audio.play('click');
  renderJuniorTournamentMatchResult(roundIdx, matchIdx);
};

App.jtSkipAll = function() {
  // 全試合スキップ → 1段ずつ段階的にせり上げてから優勝発表へ(2026-07-17裁定)
  // 準々決勝の勝者たち→準決勝→決勝→頂上、と段単位でテンポよく積み上げる。
  const jt = App._jtPreview;
  if (!jt) return;
  jt.phase = 'bracket';
  jt.bgmTrack = _jtBoardTrack(jt);
  const rounds = jt.result.rounds;
  const stageDelay = 500; // 各段0.4〜0.6秒目安

  const revealRound = (ri) => {
    if (ri >= rounds.length) {
      // 頂上せり上がりを見せてから優勝発表へ
      setTimeout(() => { App.jtGoToFinalResult(); }, stageDelay);
      return;
    }
    jt.currentRound = ri;
    jt.currentMatch = rounds[ri].matches.length; // この段を完了扱いにしてせり上げる
    renderJuniorTournamentBracket();
    Audio.play('tick');
    if (ri === rounds.length - 1) {
      jt.bgmTrack = 'preserve';
      // 決勝決着(頂上出現) → チャンピオンジングル
      try { Audio.fileBgm.fadeOut(800); } catch(e) {}
      setTimeout(() => {
        try { Audio.fileBgm.stop(); } catch(e) {}
        Audio.bgm.playJingle('championship');
      }, 900);
    }
    setTimeout(() => revealRound(ri + 1), stageDelay);
  };
  revealRound(jt.currentRound);
};

// クライムライン頂上(王者枠)タップ → 既存の優勝発表画面(pb形式)へ(棚卸し#9の二段構え)
App.jtGoToFinalResult = function() {
  const jt = App._jtPreview;
  if (!jt) return;
  clearTimeout(App._jtPeakTimer);
  jt.phase = 'finalResult';
  renderJuniorTournamentResult();
};

App._receiveJTBattleResult = function(data) {
  const jt = App._jtPreview;
  if (!jt) return;
  const ri = jt.currentRound;
  const mi = jt.currentMatch;
  const round = jt.result && jt.result.rounds ? jt.result.rounds[ri] : null;
  const match = round && round.matches ? round.matches[mi] : null;
  if (!match) return;
  if (jt.phase !== 'watching') {
    const incomingWinnerId = data.winnerId != null
      ? data.winnerId
      : ((data.winner || 'left') === 'right' ? match.right.id : match.left.id);
    if (jt.phase === 'matchResult' && match.winnerId === incomingWinnerId) return;
    return;
  }
  clearTimeout(App._escBtnTimer);
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  // iframeを閉じる
  document.getElementById('battleOverlay').style.display = 'none';

  // iframe result is only a replay completion signal; the precomputed engine result stays canonical.
  const iframeWinner = data.winner || 'left';
  // Watch mode is replay-only: never let iframe return values rewrite the simulated result.
  const incomingWinnerId = data.winnerId != null
    ? data.winnerId
    : (iframeWinner === 'right' ? match.right.id : match.left.id);
  if (incomingWinnerId !== match.winnerId || (data.mq != null && data.mq !== match.mq)) {
    try {
      console.warn('[JT] replay result mismatch ignored', {
        round: ri,
        match: mi,
        expected: { winnerId: match.winnerId, mq: match.mq },
        incoming: { winnerId: incomingWinnerId, mq: data.mq },
      });
    } catch(e) {}
  }
  // 観戦後 → 試合結果画面を表示
  jt.phase = 'matchResult';
  Audio.play('click');
  renderJuniorTournamentMatchResult(ri, mi);
};

// JT後続ラウンド再計算: 観戦した試合の結果が変わった場合に、以降のラウンドを再シミュレーション
App._jtWinnerAdvanceState = function(match) {
  if (!match || !match.left || !match.right) return null;
  const winnerIsRight = match.winnerId === match.right.id || match.winner === 'right';
  const winner = winnerIsRight ? match.right : match.left;
  const winnerHp = winnerIsRight ? match.hpRight : match.hpLeft;
  const hpFinal = winnerHp && winnerHp.final != null ? winnerHp.final : 50;
  const hpMax = winnerHp && winnerHp.max ? winnerHp.max : 100;
  const postCond = Math.max(20, Math.round((hpFinal / hpMax) * 80));
  return {
    ...winner,
    jtCarryHpPct: Math.min(100, postCond + Engine.juniorTournament.CONDITION_RECOVERY),
  };
};

App._jtSimulateMatch = function(jt, left, right, roundIdx, pairIdx) {
  const leftF = App._jtLookupFighter(left.id) || left;
  const rightF = App._jtLookupFighter(right.id) || right;
  const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB00 + roundIdx * 10 + pairIdx));
  const isFinal = roundIdx === jt.result.rounds.length - 1;
  const matchTier = isFinal ? 2 : 1;
  const leftForMatch = Engine.juniorTournament._withTournamentHp(
    { ...leftF, jtCarryHpPct: left.jtCarryHpPct != null ? left.jtCarryHpPct : 100 },
    matchTier
  );
  const rightForMatch = Engine.juniorTournament._withTournamentHp(
    { ...rightF, jtCarryHpPct: right.jtCarryHpPct != null ? right.jtCarryHpPct : 100 },
    matchTier
  );
  let result = Engine.battle.simulateMatch(
    leftForMatch,
    rightForMatch,
    matchRng,
    matchTier,
    { recordFrames: true }
  );
  const finalized = Engine.mq.finalize(G, result, {
    path: 'App._jtSimulateMatch',
    matchType: 'singles',
    participantFighters: [leftF, rightF],
  }, 'raw');
  result = { ...result, mq: finalized.mq, mqInventory: finalized.mqInventory };
  const winnerId = result.winner === 'right' ? right.id : left.id;
  const loserId = winnerId === left.id ? right.id : left.id;
  return {
    left: { ...left },
    right: { ...right },
    winnerId,
    loserId,
    mq: result.mq,
    turns: result.turns,
    finType: result.finType || '',
    finMove: result.finMove || '',
    hpLeft: result.hpLeft,
    hpRight: result.hpRight,
    log: result.log || [],
    winner: result.winner,
    frames: result.frames || [],
  };
};

App._jtRecomputeSubsequentRounds = function(jt, fromRoundIdx) {
  const rounds = jt.result.rounds;
  if (fromRoundIdx + 1 >= rounds.length) {
    // 最終ラウンドだった場合、champion/runnerUpだけ更新
    App._jtUpdateFinalResults(jt);
    return;
  }

  for (let ri = fromRoundIdx + 1; ri < rounds.length; ri++) {
    const prevRound = rounds[ri - 1];
    const winners = prevRound.matches
      .map(m => App._jtWinnerAdvanceState(m))
      .filter(Boolean);

    const newMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 >= winners.length) break;
      const left = winners[i];
      const right = winners[i + 1];

      // フル選手データを取得してシミュレーション
      newMatches.push(App._jtSimulateMatch(jt, left, right, ri, i));
    }
    rounds[ri] = { ...rounds[ri], matches: newMatches };
  }
  App._jtUpdateFinalResults(jt);
};

App._jtUpdateFinalResults = function(jt) {
  const rounds = jt.result.rounds;
  const allParticipants = (jt.selection && Array.isArray(jt.selection.participants) && jt.selection.participants.length)
    ? jt.selection.participants
    : rounds[0].matches.flatMap(m => [m.left, m.right]);
  const finalMatch = rounds[rounds.length - 1].matches[0];
  if (!finalMatch) return;
  jt.result.champion = allParticipants.find(p => p.id === finalMatch.winnerId)
    || (finalMatch.winnerId === finalMatch.left.id ? finalMatch.left : finalMatch.right);
  jt.result.runnerUp = allParticipants.find(p => p.id === finalMatch.loserId)
    || (finalMatch.loserId === finalMatch.left.id ? finalMatch.left : finalMatch.right);
  if (rounds.length >= 2) {
    const sfRound = rounds[rounds.length - 2];
    jt.result.semiFinalists = sfRound.matches
      .map(m => allParticipants.find(p => p.id === m.loserId) || (m.loserId === m.left.id ? m.left : m.right))
      .filter(Boolean);
  }
};

App._jtLookupFighter = function(id) {
  return (G.roster || []).find(f => f.id === id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === id)
    || null;
};

App.jtAdvanceAfterMatch = function(roundIdx, matchIdx) {
  // 旧互換: 直接ブラケットに戻る場合（内部用）
  App._jtAdvanceInternal(roundIdx, matchIdx);
};

App.jtAdvanceAfterResult = function(roundIdx, matchIdx) {
  // 試合結果画面から次へ進む
  App._jtAdvanceInternal(roundIdx, matchIdx);
};

App._jtAdvanceInternal = function(roundIdx, matchIdx) {
  const jt = App._jtPreview;
  if (!jt) return;
  const round = jt.result.rounds[roundIdx];
  if (matchIdx + 1 < round.matches.length) {
    jt.currentMatch = matchIdx + 1;
    jt.phase = 'bracket';
    jt.bgmTrack = _jtBoardTrack(jt);
    renderJuniorTournamentBracket();
  } else if (roundIdx + 1 < jt.result.rounds.length) {
    jt.currentRound = roundIdx + 1;
    jt.currentMatch = 0;
    jt.phase = 'bracket';
    jt.bgmTrack = _jtBoardTrack(jt);
    renderJuniorTournamentBracket();
  } else {
    // 決勝決着 → 頂上せり上がり(0.5s) → 1.6秒で優勝画面へ自動遷移。
    // タップ待ちで止めない(実機フィードバック: 二段構えの待ちがフリーズに見える。天頂戦と同じ修正)。
    // 頂上タップで即時スキップも可。
    jt.currentRound = roundIdx + 1; // ラウンド範囲外 = 「全段せり上がり済み」を表すポインタ
    jt.currentMatch = 0;
    jt.phase = 'bracket';
    // 決勝後: BGMを止めてチャンピオンジングルを鳴らす(頂上出現の瞬間)
    jt.bgmTrack = 'preserve';
    try { Audio.fileBgm.fadeOut(800); } catch(e) {}
    setTimeout(() => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      Audio.bgm.playJingle('championship');
    }, 900);
    renderJuniorTournamentBracket();
    // 頂上ブロックは画面上部にあるためスクロールを先頭へ戻して見せる
    const jtOverlay = document.getElementById('showResultOverlay');
    if (jtOverlay) jtOverlay.scrollTop = 0;
    clearTimeout(App._jtPeakTimer);
    App._jtPeakTimer = setTimeout(() => {
      const cur = App._jtPreview;
      if (cur && cur.phase === 'bracket') App.jtGoToFinalResult();
    }, 1600);
  }
};

App.finalizeJuniorTournament = function() {
  const jt = App._jtPreview;
  if (!jt) return;

  // Engine.juniorTournament.apply で state 反映
  const applied = Engine.juniorTournament.apply(G, jt.result);
  G = { ...applied.state, gameLog: [...G.gameLog, ...applied.events] };

  // 新聞を再生成（JT結果を反映させる）
  const newsRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xEE57));
  G = { ...G, weeklyNewspaper: Engine.newspaper.generate(G, newsRng) };
  App.preloadNewspaperImages(G.weeklyNewspaper);

  // 自団体出場選手の感想チェーンを構築（レンタル選手は元所属団体枠で出場）
  const playerIds = new Set((G.roster || []).filter(f => !f.isRental).map(f => f.id));
  const { champion, runnerUp, semiFinalists, rounds } = jt.result;
  const allParticipants = rounds[0].matches.flatMap(m => [m.left, m.right]);
  const myParticipants = allParticipants.filter(p => playerIds.has(p.id));

  // 結果に応じたタイミングを判定
  const impressions = myParticipants.map(p => {
    let timing = 'postLose';
    if (champion && champion.id === p.id) timing = 'champion';
    else if (runnerUp && runnerUp.id === p.id) timing = 'postWin';
    else if (semiFinalists && semiFinalists.some(sf => sf && sf.id === p.id)) timing = 'postWin';
    // 準々決勝敗退は postLose
    // 1回戦カード内の p は表示用の要約データなので、OVR計算に必要な能力値を持たない。
    // apply 後の現行ロスターから完全な選手データを戻し、結果タイミングだけ付加する。
    const liveFighter = (G.roster || []).find(f => f && f.id === p.id);
    return { ...(liveFighter || p), _jtTiming: timing };
  });

  // task-73: コーチ総括は _jtPreview を捨てる前に材料だけ取っておく
  const jtWrapupArgs = { result: jt.result };

  // transientクリア（_juniorTournamentResultはtickWeekで新聞が読むので残す）
  delete G._juniorTournamentSelection;
  clearTimeout(App._jtPeakTimer);
  App._jtPreview = null;

  // V6 summon で変更した box スタイルをリセット
  const box = document.getElementById('showResultBox');
  if (box) { box.style.maxWidth = ''; box.style.padding = ''; box.style.background = ''; box.style.border = ''; }

  try { Audio.fileBgm.stop(); } catch(e) {}
  Audio.play('click');

  const finishUp = () => {
    G = { ...G, weekPhase: 'manage' };
    App.restoreBgmForState();
    Storage.autoSave();
    showScreen('week');
    refreshAll();
  };

  // task-73: 選手の感想チェーンの後、経営画面へ戻る直前にコーチが1枚だけ締める。
  // 自団体が1人も出ていない回(impressions が空)でもコーチは喋る。
  const afterImpressions = () => {
    if (!App._tcwGate('junior', jtWrapupArgs, finishUp)) finishUp();
  };

  // 感想チェーン表示（自団体選手がいる場合）
  if (impressions.length > 0) {
    // 結果オーバーレイを閉じる
    document.getElementById('showResultOverlay').classList.remove('active');
    setTimeout(() => {
      _showJTImpressionChain(impressions, 0, afterImpressions);
    }, 500);
  } else {
    document.getElementById('showResultOverlay')?.classList.remove('active');
    afterImpressions();
  }
};

// ══════════════════════════════════════════════════════════
//  C-6 天頂戦 進行フック (quadrennial-ppv-tournament-spec-v0.1)
//  結果は Engine.advanceWeek 内(ppvTournament.run/apply)で確定済み。
//  UIは JT と同じ「どこまで見せるか」ポインタ制御のリプレイのみ。
// ══════════════════════════════════════════════════════════

// advanceWeek 直後の検知: Week48 でトーナメントが done になった瞬間だけ演出を起動する。
// リロード時は再演出しない(結果は新聞・経歴で追える)割り切り(tenchosen.md)。
App._shouldStartTenchosenReplay = function() {
  const t = G.ppvTournament;
  return !!(t && t.phase === 'done' && t.season === G.season
    && G.week === Engine.ppvTournament.SHOW_WEEK
    && Array.isArray(t.rounds) && t.rounds.length > 0 && t.championId != null);
};

App.initTenchosenReplay = function() {
  const t = G.ppvTournament;
  if (!t || !t.rounds || !t.rounds.length) return;
  // TV観戦モード(orgPop<30): フル演出の代わりに簡易リザルト
  if (!G.ppvUnlocked) {
    App._tcPreview = { tvMode: true, rounds: t.rounds };
    Audio.play('notify');
    renderTenchosenTVResult();
    return;
  }
  App._tcPreview = {
    rounds: t.rounds,
    championId: t.championId,
    currentRound: 0,
    currentMatch: 0,
    phase: 'bracket',
    bgmTrack: 'tencho',
    _revealed: {},
  };
  Audio.bgm.playStage('tencho');
  Audio.play('notify');
  // 導入(コーチ→選手) → 会場入り → トーナメント表
  // 天頂戦は専用導入の直後にトーナメント表へ進む。
  // 全身画像が左右に並ぶ全試合カード紹介は通常年末PPVだけで使う。
  const toBracket = () => renderTenchosenBracket();
  // 自団体の出場者。喋るのもバスに乗るのもこの人たち
  const mine = (G.roster || []).filter(f => f && !f.isRental
    && (t.rounds[0]?.matches || []).some(m => m.left?.id === f.id || m.right?.id === f.id));
  const toTravel = () => {
    if (typeof showSpecialEventTravel === 'function' && mine.length) {
      showSpecialEventTravel('tenchosen', G, mine, toBracket);
    } else {
      toBracket();
    }
  };
  if (typeof showSpecialEventIntro === 'function') {
    showSpecialEventIntro('tenchosen', G, toTravel, { pool: mine });
  } else {
    toTravel();
  }
};

App.tcWatchMatch = function(roundIdx, matchIdx) {
  const tc = App._tcPreview;
  if (!tc) return;
  tc.currentRound = roundIdx;
  tc.currentMatch = matchIdx;
  tc.phase = 'watching';

  const round = tc.rounds[roundIdx];
  const match = round.matches[matchIdx];
  const isFinal = round.name === 'final';
  tc.bgmTrack = isFinal ? 'bigMatch' : 'tencho';

  const overlay = document.getElementById('battleOverlay');
  overlay.style.display = 'block';
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  clearTimeout(App._escBtnTimer);
  App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

  const iframe = document.getElementById('battleIframe');
  if (!iframe) return;

  const leftF = App._jtLookupFighter(match.left.id) || match.left;
  const rightF = App._jtLookupFighter(match.right.id) || match.right;
  const roundLabel = isFinal ? '決勝' : round.name === 'semiFinal' ? '準決勝' : round.name === 'quarterFinal' ? '準々決勝' : '1回戦';

  // Replay: 事前シミュ済みの match から frames+winner 等を組み立てる(結果は書き換えない)
  const tcResult = {
    winner: match.winner, mq: match.mq, turns: match.turns,
    finType: match.finType || '', finMove: match.finMove || '',
    hpLeft: match.hpLeft, hpRight: match.hpRight,
    log: match.log || [], frames: match.frames || [],
  };
  const msg = {
    type: 'START_MATCH',
    left: {
      ...Engine.ppvTournament._withCarryHp(leftF, match.carryLeftPct != null ? match.carryLeftPct : 100),
      portraitUrl: getPortraitUrl(leftF.id), profile: CHAR_PROFILES[leftF.id] || '',
      vl: leftF.voiceLines || leftF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[leftF.id]) || ['…！']
    },
    right: {
      ...Engine.ppvTournament._withCarryHp(rightF, match.carryRightPct != null ? match.carryRightPct : 100),
      portraitUrl: getPortraitUrl(rightF.id), profile: CHAR_PROFILES[rightF.id] || '',
      vl: rightF.voiceLines || rightF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[rightF.id]) || ['…！']
    },
    matchInfo: {
      header: `👑 天頂戦 ${roundLabel}`,
      subHeader: `${match.left.name} vs ${match.right.name}`,
      matchNum: matchIdx + 1,
      totalMatches: round.matches.length,
      isSpecialMatch: !!isFinal,
      matchTier: 2,
      leftPersonality: leftF.personality || 'normal',
      leftArchetype: leftF.archetype || 'standard',
      rightPersonality: rightF.personality || 'normal',
      rightArchetype: rightF.archetype || 'standard',
      preserveParentFileBgm: true,
      sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
    },
    result: tcResult,
  };
  if (isFinal) Audio.bgm.playStage('bigMatch');
  let sent = false;
  const sendOnce = () => {
    if (sent) return; sent = true;
    iframe.contentWindow.postMessage(msg, '*');
  };
  iframe.onload = () => setTimeout(sendOnce, 200);
  iframe.src = 'battle-engine.html?t=' + Date.now();
  setTimeout(sendOnce, 800);
};

App._receiveTcBattleResult = function(data) {
  const tc = App._tcPreview;
  if (!tc) return;
  const ri = tc.currentRound;
  const mi = tc.currentMatch;
  const round = tc.rounds[ri];
  const match = round && round.matches ? round.matches[mi] : null;
  if (!match) return;
  clearTimeout(App._escBtnTimer);
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  document.getElementById('battleOverlay').style.display = 'none';
  // Watch mode is replay-only: iframe の返り値で結果を書き換えない(JT流儀)
  const incomingWinnerId = data.winnerId != null
    ? data.winnerId
    : ((data.winner || 'left') === 'right' ? match.right.id : match.left.id);
  if (incomingWinnerId !== match.winnerId || (data.mq != null && data.mq !== match.mq)) {
    try { console.warn('[TC] replay result mismatch ignored', { round: ri, match: mi }); } catch(e) {}
  }
  tc.phase = 'matchResult';
  Audio.play('click');
  renderTenchosenMatchResult(ri, mi);
};

App.tcSkipMatch = function(roundIdx, matchIdx) {
  const tc = App._tcPreview;
  if (!tc) return;
  tc.bgmTrack = 'tencho';
  tc.phase = 'matchResult';
  Audio.play('click');
  renderTenchosenMatchResult(roundIdx, matchIdx);
};

App.tcAdvanceAfterResult = function(roundIdx, matchIdx) {
  const tc = App._tcPreview;
  if (!tc) return;
  const round = tc.rounds[roundIdx];
  if (matchIdx + 1 < round.matches.length) {
    tc.currentMatch = matchIdx + 1;
    tc.phase = 'bracket';
    tc.bgmTrack = 'tencho';
    renderTenchosenBracket();
  } else if (roundIdx + 1 < tc.rounds.length) {
    tc.currentRound = roundIdx + 1;
    tc.currentMatch = 0;
    tc.phase = 'bracket';
    tc.bgmTrack = 'tencho';
    renderTenchosenBracket();
  } else {
    // 1操作=1進行(docs/ui §5-D 鉄則2)。古いクリック・二重クリックで2回進めない
    if (tc._finalAdvanced) {
      try { console.warn('[WM] tcAdvanceAfterResult: final already advanced'); } catch(e) {}
      return;
    }
    tc._finalAdvanced = true;
    // 決勝決着 → (決勝だけ)勝者・敗者のひとこと → 頂上せり上がり(0.5s) →
    // 1.6秒で優勝画面へ自動遷移。
    // タップ待ちで止めない(実機フィードバック: 二段構えの待ちがフリーズに見える)。
    // 頂上タップで即時スキップも可。
    const toPeak = () => {
      tc.currentRound = roundIdx + 1;
      tc.currentMatch = 0;
      tc.phase = 'bracket';
      tc.bgmTrack = 'preserve';
      try { Audio.fileBgm.fadeOut(800); } catch(e) {}
      setTimeout(() => {
        try { Audio.fileBgm.stop(); } catch(e) {}
        Audio.bgm.playJingle('championship');
      }, 900);
      renderTenchosenBracket();
      // 頂上ブロックは画面上部にあるためスクロールを先頭へ戻して見せる
      const tcOverlay = document.getElementById('showResultOverlay');
      if (tcOverlay) tcOverlay.scrollTop = 0;
      clearTimeout(App._tcPeakTimer);
      App._tcPeakTimer = setTimeout(() => {
        const cur = App._tcPreview;
        if (cur && cur.phase === 'bracket') App.tcGoToFinalResult();
      }, 1600);
    };
    App._tcRunFinalAftermath(tc, round.matches[matchIdx], round.name, toPeak);
  }
};

// 天頂戦 決勝の決着後コメント(task-72)。**待ちには必ず時限の保険を掛ける**
// (docs/ui/mockup-baseline-v0.1.md §5-D 鉄則1)。ここが詰まると週が進まなくなる。
//   - 二重起動防止: tc._finalTalkShown(この大会で1度だけ) + done フラグ(進行は1回だけ)
//   - 見張り  : 1秒ごとにオーバーレイがDOMに残っているか確認し、
//               コールバック無しで消えていたら進める(読んでいる最中は横取りしない)
//   - 絶対上限: 180秒。読者を遮らない長さにしつつ、永久に止まらないことを保証する
//   - 保険が作動したら必ず console.warn を残す(黙って救わない)
App._tcRunFinalAftermath = function(tc, match, roundName, proceed) {
  let done = false;
  const once = (reason) => {
    if (done) return;
    done = true;
    clearInterval(App._tcFinalTalkWatch); App._tcFinalTalkWatch = null;
    clearTimeout(App._tcFinalTalkCap); App._tcFinalTalkCap = null;
    if (reason) { try { console.warn('[WM] tenchosen final aftermath safety net fired:', reason); } catch(e) {} }
    proceed();
  };
  // 決勝以外では絶対に出さない(不変条件1)。呼び出し元と合わせて二重に判定する
  if (roundName !== 'final' || !tc || tc._finalTalkShown
      || typeof _showTcFinalAftermath !== 'function') { once(); return; }
  tc._finalTalkShown = true;

  let shown = false;
  try {
    shown = _showTcFinalAftermath(match, roundName, () => once());
  } catch (e) {
    try { console.warn('[WM] tenchosen final aftermath failed', e); } catch(_e) {}
    shown = false;
  }
  if (!shown) { once(); return; }

  clearInterval(App._tcFinalTalkWatch);
  App._tcFinalTalkWatch = setInterval(() => {
    if (done) { clearInterval(App._tcFinalTalkWatch); App._tcFinalTalkWatch = null; return; }
    const el = App._tcFinalTalkEl;
    if (!el || !document.body.contains(el)) once('overlay vanished without a callback');
  }, 1000);
  clearTimeout(App._tcFinalTalkCap);
  App._tcFinalTalkCap = setTimeout(() => once('absolute cap (180s)'), 180000);
};

App.tcSkipAll = function() {
  // 全試合スキップ → 段単位でテンポよくせり上げてから優勝発表へ(JT流儀)
  const tc = App._tcPreview;
  if (!tc) return;
  tc.phase = 'bracket';
  tc.bgmTrack = 'tencho';
  // 全部スキップを選んだ人に決勝の会話(task-72)を差し込まない。
  // このルートは tcAdvanceAfterResult を通らないが、意図を明示して固定しておく
  tc._finalTalkShown = true;
  tc._finalAdvanced = true;
  const rounds = tc.rounds;
  const stageDelay = 500;

  const revealRound = (ri) => {
    if (ri >= rounds.length) {
      setTimeout(() => { App.tcGoToFinalResult(); }, stageDelay);
      return;
    }
    tc.currentRound = ri;
    tc.currentMatch = rounds[ri].matches.length;
    renderTenchosenBracket();
    Audio.play('tick');
    if (ri === rounds.length - 1) {
      tc.bgmTrack = 'preserve';
      try { Audio.fileBgm.fadeOut(800); } catch(e) {}
      setTimeout(() => {
        try { Audio.fileBgm.stop(); } catch(e) {}
        Audio.bgm.playJingle('championship');
      }, 900);
    }
    setTimeout(() => revealRound(ri + 1), stageDelay);
  };
  revealRound(tc.currentRound);
};

App.tcGoToFinalResult = function() {
  const tc = App._tcPreview;
  if (!tc) return;
  clearTimeout(App._tcPeakTimer);
  tc.phase = 'finalResult';
  renderTenchosenResult();
};

// 優勝画面タップ → 関係性ドラマ(0件なら何も出さず終了。不在の説明も出さない)
App.tcAfterWinner = function() {
  const events = (G.ppvTournament && G.ppvTournament.dramaEvents) || [];
  if (events.length > 0) {
    Audio.play('notify');
    renderTenchosenDrama(0);
  } else {
    App.finalizeTenchosen();
  }
};

App.tcNextDrama = function(idx) {
  const events = (G.ppvTournament && G.ppvTournament.dramaEvents) || [];
  if (idx < events.length) {
    Audio.play('notify');
    renderTenchosenDrama(idx);
  } else {
    App.finalizeTenchosen();
  }
};

App.finalizeTenchosen = function() {
  // 2026-08-13 Keisuke実機裁定: 演出の順は 優勝画面 → 戴冠式 → コーチ総括。
  // 祝いの熱が続いているうちにベルトを渡し、コーチは仕様どおり
  // 「経営画面へ戻る直前」の最後尾で締める(task-73)。
  const title = G.unifiedTitle;
  const tournament = G.ppvTournament;
  const awardEvents = (title?.history || []).filter(event =>
    ['creation', 'crown', 'repeat'].includes(event?.type));
  const latestAward = awardEvents[awardEvents.length - 1] || null;
  const champion = tournament?.championId != null
    ? Engine.unifiedTitle._findActive(G, tournament.championId) : null;
  const isCurrentAward = latestAward
    && latestAward.season === G.season
    && latestAward.championId === tournament?.championId;
  const ceremonyKey = isCurrentAward && champion
    ? `${latestAward.season}:${latestAward.edition}:${latestAward.championId}:${latestAward.type}` : '';
  if (ceremonyKey && App._unifiedCoronationKey !== ceremonyKey
      && typeof showUnifiedTitleCoronation === 'function') {
    App._unifiedCoronationKey = ceremonyKey;
    // 「第N代」は政権の数。防衛戦での奪取(move)も1代と数える(記録タブ・実績リストと同じ定義)。
    const generation = (title?.history || []).filter(event =>
      ['creation', 'crown', 'repeat', 'move'].includes(event?.type)).length;
    const repeatLabel = latestAward.type === 'repeat' ? ' ・ 連覇' : '';
    showUnifiedTitleCoronation({
      fighter: champion.fighter,
      orgName: Engine.unifiedTitle._orgName(G, champion.orgId),
      edition: latestAward.edition || tournament.edition || 1,
      beltLabel: generation === 1
        ? '初代 全国統一王者'
        : `第${generation}代 全国統一王者${repeatLabel}`,
      state: G,
      safetyTimeoutMs: 30000,
    }, () => App.finalizeTenchosen());
    return;
  }
  // task-73: 経営画面へ戻る直前にコーチが1枚だけ締める。
  // TV観戦モード(自団体不出場)でもここを通るので、その回も無言にはならない
  if (App._tcwGate('tenchosen', { tournament: G.ppvTournament }, () => App.finalizeTenchosen())) return;
  // 状態は advanceWeek 内で適用済み。ここでは演出を畳むだけ
  clearTimeout(App._tcPeakTimer);
  // 決勝の決着後コメント(task-72)の見張り・保険・残骸を必ず片付ける
  clearInterval(App._tcFinalTalkWatch); App._tcFinalTalkWatch = null;
  clearTimeout(App._tcFinalTalkCap); App._tcFinalTalkCap = null;
  if (App._tcFinalTalkEl) {
    try { App._tcFinalTalkEl.remove(); } catch(e) {}
    App._tcFinalTalkEl = null;
  }
  App._tcPreview = null;
  const overlay = document.getElementById('showResultOverlay');
  if (overlay) overlay.classList.remove('active');
  const box = document.getElementById('showResultBox');
  if (box) { box.style.maxWidth = ''; box.style.padding = ''; box.style.background = ''; box.style.border = ''; }
  try { Audio.fileBgm.stop(); } catch(e) {}
  App.restoreBgmForState();
  try { Storage.autoSave(); } catch(e) {}
  showScreen('week');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn')[0].classList.add('active');
  refreshAll();
};

// ── 天頂戦 エントリー(Week43〜) ──────────────────────

App.tcOpenEntryModal = function() {
  const t = G.ppvTournament;
  if (!t || t.season !== G.season || t.phase !== 'entry'
      || G.week < Engine.ppvTournament.ENTRY_WEEK) return;
  // 初期選択はおまかせ(王者含むOVR上位)。プレイヤーが自由に組み替えられる
  App._tcEntryPicks = Engine.ppvTournament.suggestPlayerEntries(G);
  Audio.play('select');
  _mdlAOpen(_tcEntryModalHtml(), { dark: true, wide: true });
};

App.tcTogglePick = function(id) {
  const picks = App._tcEntryPicks || [];
  const expected = Math.min(
    Engine.ppvTournament.getPlayerSlotCount(G),
    Engine.ppvTournament.getPlayerEntryCandidates(G).length);
  const champId = G.titles && G.titles.world ? G.titles.world.championId : null;
  if (id === champId) return; // 王者は外せない
  if (picks.includes(id)) {
    App._tcEntryPicks = picks.filter(p => p !== id);
  } else {
    if (picks.length >= expected) return;
    App._tcEntryPicks = [...picks, id];
  }
  Audio.play('click');
  const card = document.getElementById('mdlACard');
  if (card) card.innerHTML = _tcEntryModalHtml();
};

App.tcSuggestPicks = function() {
  App._tcEntryPicks = Engine.ppvTournament.suggestPlayerEntries(G);
  Audio.play('select');
  const card = document.getElementById('mdlACard');
  if (card) card.innerHTML = _tcEntryModalHtml();
};

App.tcConfirmEntries = function() {
  const picks = App._tcEntryPicks || [];
  const next = Engine.ppvTournament.confirmPlayerEntries(G, picks);
  if (next === G) {
    // エンジンに弾かれた(王者未選出・重複など)。UI側バリデーション済みなら通常来ない
    Audio.play('error');
    return;
  }
  G = next;
  App._tcEntryPicks = null;
  _mdlAClose();
  Audio.play('select');
  try { Storage.autoSave(); } catch(e) {}
  if (typeof showToast === 'function') showToast('👑 天頂戦 出場選手を確定しました');
  if (typeof renderWeekScreen === 'function') renderWeekScreen();
  if (typeof refreshAll === 'function') refreshAll();
};

// ── task-90: タイトル画面 選手ファイル ────────────────────────────────
// ランタイム状態へ触れず、静的マスタから表示許可字段だけをコピーしたカタログで描画する。
const _FIGHTER_FILE_STATS = Object.freeze([
  Object.freeze({ key: 'pw', label: 'PW' }),
  Object.freeze({ key: 'sp', label: 'SP' }),
  Object.freeze({ key: 'te', label: 'TE' }),
  Object.freeze({ key: 'st', label: 'ST' }),
  Object.freeze({ key: 'mn', label: 'MN' }),
]);
const _FIGHTER_FILE_COLUMNS = Object.freeze([
  // width: ソート矢印(" ▲/▼")の付け外しで列幅が動かないよう、数値系は固定幅(ゲーム内DBと同じ作法)
  Object.freeze({ key: '', label: '', sortable: false }),
  Object.freeze({ key: 'name', label: '名前', sortable: true }),
  Object.freeze({ key: 'style', label: 'スタイル', sortable: true, width: 90 }),
  Object.freeze({ key: 'ovr', label: 'OVR', sortable: true, width: 50 }),
  ..._FIGHTER_FILE_STATS.map(stat => Object.freeze({ ...stat, sortable: true, width: 40 })),
  Object.freeze({ key: 'h', label: '身長', sortable: true, width: 56 }),
]);
const _FIGHTER_FILE_STYLES = Object.freeze([
  'Grappler', 'Striker', 'Submission', 'Aerial', 'Allround', 'Brawler',
]);
const _fighterFileState = { key: 'ovr', asc: false, style: '', query: '' };
let _fighterFileCatalogCache = null;

function _fighterFileBuildCatalog(chars, profiles, portraits) {
  return (Array.isArray(chars) ? chars : []).map(char => {
    const pw = Number(char.pw) || 0;
    const sp = Number(char.sp) || 0;
    const te = Number(char.te) || 0;
    const st = Number(char.st) || 0;
    const mn = Number(char.mn) || 0;
    return {
      id: Number(char.id),
      name: String(char.name || ''),
      h: Number(char.h) || 0,
      style: String(char.style || ''),
      role: String(char.role || ''),
      pw, sp, te, st, mn,
      ovr: Math.round((pw + sp + te + st + mn) / 5),
      traits: Array.isArray(char.traits) ? char.traits.map(String) : [],
      profile: String((profiles && profiles[char.id]) || ''),
      portraitKey: String((portraits && portraits[char.id]) || ''),
    };
  });
}

function _fighterFileCatalog() {
  if (!_fighterFileCatalogCache) {
    _fighterFileCatalogCache = _fighterFileBuildCatalog(ALL_CHARS, CHAR_PROFILES, PORTRAIT);
  }
  return _fighterFileCatalogCache;
}

function _fighterFileNextSort(state, key) {
  const sortable = _FIGHTER_FILE_COLUMNS.some(column => column.sortable && column.key === key);
  if (!sortable) return { key: state.key, asc: state.asc };
  return state.key === key ? { key, asc: !state.asc } : { key, asc: false };
}

function _fighterFileCompare(a, b, key, asc) {
  const av = a[key];
  const bv = b[key];
  const compared = typeof av === 'string'
    ? av.localeCompare(String(bv), 'ja')
    : (Number(av) || 0) - (Number(bv) || 0);
  return asc ? compared : -compared;
}

function _fighterFileStyleBadge(style) {
  const safeStyle = _FIGHTER_FILE_STYLES.includes(style) ? style : '';
  const badgeClass = safeStyle ? ` badge-${safeStyle}` : '';
  return `<span class="fighter-file-style-badge${badgeClass}">${escHtml(style || '—')}</span>`;
}

function _fighterFileFaceHtml(fighter) {
  const initial = escHtml((fighter.name || '?').charAt(0));
  const fallback = `<span class="fighter-file-face-fallback">${initial}</span>`;
  if (!fighter.portraitKey) return `<div class="fighter-file-face-wrap">${fallback}</div>`;
  const url = `../image/face_${fighter.portraitKey}.png`;
  return `<div class="fighter-file-face-wrap"><img class="fighter-file-face" src="${escHtml(url)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fighter-file-face-fallback" hidden>${initial}</span></div>`;
}

function _fighterFileUpperHtml(fighter) {
  const initial = escHtml((fighter.name || '?').charAt(0));
  if (!fighter.portraitKey) return `<div class="fighter-file-upper-fallback">${initial}</div>`;
  const url = `../image/upper/upper_${fighter.portraitKey}.webp`;
  return `<img src="${escHtml(url)}" alt="${escHtml(fighter.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="fighter-file-upper-fallback" hidden>${initial}</div>`;
}

function _fighterFileRadarHtml(fighter) {
  const cx = 100, cy = 104, radius = 72;
  const point = (index, length) => {
    const angle = (-90 + index * 72) * Math.PI / 180;
    return [cx + length * Math.cos(angle), cy + length * Math.sin(angle)];
  };
  const polygon = length => _FIGHTER_FILE_STATS.map((_, index) =>
    point(index, length).map(value => value.toFixed(1)).join(',')).join(' ');
  const grid = [20, 40, 60, 80, 100].map(level =>
    `<polygon points="${polygon(radius * level / 100)}" fill="none" stroke="var(--border-strong)" stroke-width="${level === 100 ? 1 : 0.5}"/>`).join('');
  const axes = _FIGHTER_FILE_STATS.map((_, index) => {
    const [x, y] = point(index, radius);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="0.5"/>`;
  }).join('');
  const values = _FIGHTER_FILE_STATS.map(stat => Math.max(0, Math.min(100, Number(fighter[stat.key]) || 0)));
  const dataPoints = values.map((value, index) =>
    point(index, radius * value / 100).map(coord => coord.toFixed(1)).join(',')).join(' ');
  const labels = _FIGHTER_FILE_STATS.map((stat, index) => {
    const [x, y] = point(index, radius + 15);
    return `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-family="var(--font-label)" font-size="8" letter-spacing="1" fill="var(--stat-${stat.key})">${stat.label}</text>`;
  }).join('');
  return `<svg width="200" height="208" viewBox="0 0 200 208" role="img" aria-label="能力レーダーチャート">${grid}${axes}<polygon points="${dataPoints}" fill="var(--gold)" fill-opacity="0.25" stroke="var(--gold)" stroke-width="1.5"/>${labels}</svg>`;
}

function _fighterFileListHtml(catalog, state) {
  let visible = catalog.slice();
  if (state.style) visible = visible.filter(fighter => fighter.style === state.style);
  if (state.query) visible = visible.filter(fighter => fighter.name.includes(state.query));
  visible.sort((a, b) => _fighterFileCompare(a, b, state.key, state.asc));
  const head = `<tr>${_FIGHTER_FILE_COLUMNS.map(column => {
    if (!column.sortable) return '<th scope="col" style="width:48px"></th>';
    const active = state.key === column.key;
    const arrow = active ? (state.asc ? ' ▲' : ' ▼') : '';
    const width = column.width ? ` style="width:${column.width}px"` : '';
    return `<th scope="col" class="${active ? 'sorted' : ''}"${width} onclick="App.sortFighterFile('${column.key}')">${column.label}${arrow}</th>`;
  }).join('')}</tr>`;
  const body = visible.map(fighter => {
    const stats = _FIGHTER_FILE_STATS.map(stat =>
      `<td class="is-number" style="${statTierStyle(stat.key, fighter[stat.key])}">${fighter[stat.key]}</td>`).join('');
    return `<tr onclick="App.openFighterFileDetail(${fighter.id})">
      <td>${_fighterFileFaceHtml(fighter)}</td>
      <td class="fighter-file-name">${escHtml(fighter.name)}</td>
      <td>${_fighterFileStyleBadge(fighter.style)}</td>
      <td class="fighter-file-ovr" style="${statTierStyle('ovr', fighter.ovr)}">${fighter.ovr}</td>
      ${stats}
      <td class="is-number">${fighter.h}<span class="fighter-file-unit">cm</span></td>
    </tr>`;
  }).join('');
  return { head, body, visibleCount: visible.length };
}

function _fighterFileDetailHtml(fighter, traitDefs) {
  const bars = _FIGHTER_FILE_STATS.map(stat =>
    statOverBarHtml(stat.key, fighter[stat.key], { label: stat.label })).join('');
  const traits = fighter.traits.length ? fighter.traits.map(trait => {
    const def = traitDefs && traitDefs[trait];
    if (!def) return '';
    return `<div class="fighter-file-trait"><span class="fighter-file-trait-icon" style="--fighter-trait-color:${escHtml(def.color || 'var(--gold)')}">${escHtml(def.icon || trait.charAt(0))}</span><span class="fighter-file-trait-name">${escHtml(trait)}</span><span class="fighter-file-trait-desc">${escHtml(def.desc || '')}</span></div>`;
  }).join('') : '<div class="fighter-file-trait-desc">固有特性なし</div>';
  return `<div class="fighter-file-detail-head">
      <span class="fighter-file-kicker">Personnel File</span>
      <button type="button" class="fighter-file-close" onclick="App.closeFighterFileDetail()" title="閉じる（ESC可）" aria-label="選手詳細を閉じる">✕</button>
    </div>
    <div class="fighter-file-detail-main">
      <div class="fighter-file-upper">${_fighterFileUpperHtml(fighter)}</div>
      <div class="fighter-file-detail-info">
        <h3 class="fighter-file-detail-name">${escHtml(fighter.name)}</h3>
        <div class="fighter-file-detail-badges">${_fighterFileStyleBadge(fighter.style)}<span class="fighter-file-role-badge">${escHtml(fighter.role)}</span></div>
        <div class="fighter-file-detail-meta">身長 ${fighter.h}cm</div>
        <div class="fighter-file-detail-ovr"><strong style="${statTierStyle('ovr', fighter.ovr)}">${fighter.ovr}</strong><span>OVR — 基準値</span></div>
        <div class="fighter-file-charts"><div class="fighter-file-radar">${_fighterFileRadarHtml(fighter)}</div><div class="fighter-file-bars">${bars}<div class="fighter-file-bar-note">枠の右端=100。枠を飛び越えた選手は規格外（はみ出しは圧縮表示）</div></div></div>
      </div>
    </div>
    <div class="fighter-file-section"><div class="fighter-file-section-label">Traits — 特性</div>${traits}</div>
    <div class="fighter-file-section"><div class="fighter-file-section-label">Profile — 紹介</div><div class="fighter-file-profile">${escHtml(fighter.profile)}</div></div>
    <div class="fighter-file-footnote">※ 記載の能力値は各選手の能力基準値。潜在能力・成長タイプ・体調・戦績は、本ファイルには記載されない。</div>`;
}

App.renderFighterFile = function() {
  const head = document.getElementById('fighterFileHead');
  const body = document.getElementById('fighterFileBody');
  const count = document.getElementById('fighterFileCount');
  if (!head || !body || !count) return false;
  const view = _fighterFileListHtml(_fighterFileCatalog(), _fighterFileState);
  head.innerHTML = view.head;
  body.innerHTML = view.body;
  count.textContent = `全${_fighterFileCatalog().length}名 / 表示中: ${view.visibleCount}名`;
  return true;
};

App.showFighterFile = function() {
  const overlay = document.getElementById('fighterFileOverlay');
  if (!overlay) return false;
  _fighterFileCatalogCache = _fighterFileBuildCatalog(ALL_CHARS, CHAR_PROFILES, PORTRAIT);
  Object.assign(_fighterFileState, { key: 'ovr', asc: false, style: '', query: '' });
  const style = document.getElementById('fighterFileStyle');
  const search = document.getElementById('fighterFileSearch');
  if (style) style.value = '';
  if (search) search.value = '';
  App.closeFighterFileDetail();
  overlay.classList.add('active');
  return App.renderFighterFile();
};

App.closeFighterFile = function() {
  App.closeFighterFileDetail();
  const overlay = document.getElementById('fighterFileOverlay');
  if (overlay) overlay.classList.remove('active');
};

App.sortFighterFile = function(key) {
  const next = _fighterFileNextSort(_fighterFileState, key);
  _fighterFileState.key = next.key;
  _fighterFileState.asc = next.asc;
  return App.renderFighterFile();
};

App.filterFighterFileStyle = function(style) {
  _fighterFileState.style = _FIGHTER_FILE_STYLES.includes(style) ? style : '';
  return App.renderFighterFile();
};

App.filterFighterFileName = function(query) {
  _fighterFileState.query = String(query || '').trim();
  return App.renderFighterFile();
};

App.openFighterFileDetail = function(id) {
  const fighter = _fighterFileCatalog().find(item => item.id === Number(id));
  const overlay = document.getElementById('fighterFileDetailOverlay');
  const detail = document.getElementById('fighterFileDetail');
  if (!fighter || !overlay || !detail) return false;
  detail.innerHTML = _fighterFileDetailHtml(fighter, TRAIT_DEFS);
  overlay.classList.add('active');
  return true;
};

App.closeFighterFileDetail = function() {
  const overlay = document.getElementById('fighterFileDetailOverlay');
  const detail = document.getElementById('fighterFileDetail');
  if (overlay) overlay.classList.remove('active');
  if (detail) detail.innerHTML = '';
};

function _handleFighterFileEscape(e) {
  if (e.key !== 'Escape') return;
  const detail = document.getElementById('fighterFileDetailOverlay');
  if (detail && detail.classList.contains('active')) { App.closeFighterFileDetail(); return; }
  const overlay = document.getElementById('fighterFileOverlay');
  if (overlay && overlay.classList.contains('active')) App.closeFighterFile();
}
document.addEventListener('keydown', _handleFighterFileEscape);
// ── /task-90: タイトル画面 選手ファイル ───────────────────────────────

// v2.1: クレジット画面
App.showCredits = function() {
  // 楽曲クレジットを動的にレンダリング
  const el = document.getElementById('creditsMusicList');
  // 使用楽曲が0件のときは見出しごと隠す。全曲が自作になったため通常は0件
  // (「使用楽曲」の見出しだけ残って中身が空、という見え方を避ける)。
  const sec = document.getElementById('creditsMusicSection');
  if (sec) sec.style.display = (typeof CREDITS !== 'undefined' && CREDITS.music && CREDITS.music.length) ? '' : 'none';
  if (el && typeof CREDITS !== 'undefined' && CREDITS.music) {
    el.innerHTML = CREDITS.music.map(m => `
      <div class="credits-music-item">
        <div class="credits-music-title">${m.title}</div>
        <div class="credits-music-artist">${m.artist}</div>
        <a class="credits-music-link" href="${m.url}" target="_blank" rel="noopener">${m.source}</a>
        <span style="font-size:10px;color:var(--text-dim);margin-left:6px">${m.license}</span>
      </div>
    `).join('');
  }
  document.getElementById('creditsOverlay').classList.add('active');
};
App.closeCredits = function() { document.getElementById('creditsOverlay').classList.remove('active'); };

App.previewEnding = function() {
  App.closeCredits();
  const data = (typeof G !== 'undefined' && G.season)
    ? Engine.ending.buildClearData(G)
    : { season: 1, orgName: '団体', playerRating: 1000, peakOrgPop: 0, totalShows: 0, bestMQ: 0, hallOfFameCount: 0, top3Fighters: [], coaches: [] };
  setTimeout(() => showEndingCeremony(data, () => {}), 300);
};

// ── DEBUG: 業界底上げテスト用（テスト後削除予定） ──
window.debugWinLeague = function() {
  // エンディングは endingShown:true でスキップし、業界激震セレモニーだけ発火させる
  G = { ...G,
    offSeason: true,
    offWeek: 4,
    weekPhase: 'offseason',
    battlePoints: { ...G.battlePoints, player: 9999 },
    endingCleared: false,
    leagueElevated: false,
    endingShown: true,
    endingClearedSeason: null,
  };
  refreshAll();
  console.log('[debugWinLeague] 状態セット完了:');
  console.log('  offSeason:', G.offSeason, '/ offWeek:', G.offWeek, '/ weekPhase:', G.weekPhase);
  console.log('  endingCleared:', G.endingCleared, '/ leagueElevated:', G.leagueElevated);
  console.log('  endingShown: true (エンディングスキップ→業界激震のみ発火)');
  console.log('→ 「週を進める」を押すとシーズン終了→1位判定→業界底上げセレモニーが発火します');
};
// 業界激震セレモニーを直接テスト（週を進めずに即表示）
window.debugElevationDirect = function() {
  showLeagueElevationCeremony(G, () => { console.log('[debugElevationDirect] onDone called'); refreshAll(); });
};

// Alias for old UI calls
// COACH_MAX_ASSIGN already defined in data section
