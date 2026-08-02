// Developer-only event and audio catalogue.
// This file is deliberately data-only: opening a catalogue entry must never
// mutate G, consume a pending event, or write any save data.
(function (root) {
  'use strict';

  const BGM = {
    tension: { type: 'file', src: '../bgm/production-ogg/wm_bgm_s03_v01.ogg', volume: 0.20, label: 'WM-S03 不穏' },
    soft: { type: 'file', src: '../bgm/production-ogg/wm_bgm_c07_v02.ogg', volume: 0.16, label: 'WM-C07 契約交渉' },
    opening: { type: 'file', src: '../bgm/production-ogg/wm_bgm_c01_v01.ogg', volume: 0.30, label: 'WM-C01 タイトル・オープニング' },
    retirement: { type: 'file', src: '../bgm/production-ogg/wm_bgm_d03_v01.ogg', volume: 0.41, label: 'WM-D03 引退' },
    awards: { type: 'file', src: '../bgm/production-ogg/wm_bgm_h05_v01.ogg?mix=20260727', volume: 0.40, label: 'WM-H05 年末表彰' },
    draftPick: { type: 'bgm', key: 'draftPick', label: 'WM-C08 ドラフト選択' },
    draftBid: { type: 'bgm', key: 'draftBid', label: 'WM-C09 ドラフト入札' },
    spring: { type: 'stage', key: 'springA', label: 'WM-SP01 春・タッグリーグ' },
    junior: { type: 'stage', key: 'juniorA', label: 'WM-SP03 夏・ジュニア' },
    autumn: { type: 'stage', key: 'autumnA', label: 'WM-SP05 秋・4団体対抗戦' },
    ppv: { type: 'stage', key: 'ppvA', label: 'WM-SP07 冬・GRAND FINAL' },
    tencho: { type: 'stage', key: 'tencho', label: 'WM-SP09 天頂戦' },
    ending: { type: 'file', src: '../bgm/production-ogg/wm_bgm_h04_v01.ogg', volume: 0.45, label: 'WM-H04 エンディング' },
    gameover: { type: 'file', src: '../bgm/production-ogg/wm_bgm_h06_v01.ogg', volume: 0.30, loop: false, label: 'WM-H06 団体解散' },
  };

  const SFX = {
    error: { type: 'named', key: 'error', label: 'WM-SE-UI07 警告SE' },
    event: { type: 'named', key: 'event', label: 'WM-SE-UI05 イベント表示SE' },
    gong: { type: 'stinger', src: '../bgm/f07_gong_v1.mp3', volume: 0.15, label: '旧MP3: F07 ゴング' },
    chime: { type: 'stinger', src: '../bgm/f06_fin_chime_v1.mp3', volume: 0.10, label: '旧MP3: F06 決着チャイム' },
    draftGong: { type: 'stinger', src: '../bgm/f08_gong_start_v2.mp3', volume: 0.15, label: '旧MP3: ドラフト開始ゴング' },
    draftFanfare: { type: 'stinger', src: '../bgm/f10_victory_fanfare_v5.mp3', volume: 0.15, label: '旧MP3: ドラフト勝利ファンファーレ' },
    elevationImpact: { type: 'stinger', src: '../bgm/b07_whiff_v4.mp3', volume: 0.20, label: '旧MP3: リーグ昇格カットイン' },
    elevationCrowd: { type: 'stinger', src: '../bgm/e02_crowd_v2.mp3', volume: 0.20, label: '旧MP3: リーグ昇格歓声' },
  };

  const entry = (id, category, title, options) => Object.freeze({
    id, category, title,
    oneShot: options.oneShot,
    trigger: options.trigger,
    summary: options.summary,
    sources: options.sources,
    audioState: options.audioState || 'current',
    audio: Object.freeze({ bgm: options.bgm || null, sfx: Object.freeze(options.sfx ? (Array.isArray(options.sfx) ? options.sfx : [options.sfx]) : []) }),
  });

  const catalog = [
    entry('ai-breakthrough-s', '他団体・成長', 'S団体のブレークスルー警告', {
      oneShot: '各選手のシーズン末成長ごと。S団体のみ即時表示。',
      trigger: 'AIのシーズン末ブレークスルーかつ S tier。',
      summary: '「ライバルに脅威が生まれた」通知。専用BGMではなく警告SEのみ。',
      sources: ['src/management.js:16276', 'src/app.js:11606', 'src/ui-common.js:7740'],
      sfx: SFX.error,
    }),
    entry('ai-breakthrough-a', '他団体・成長', 'A団体のブレークスルー記事', {
      oneShot: '各選手のシーズン末成長ごと。新聞に1回掲載。',
      trigger: 'AIのシーズン末ブレークスルーかつ A tier。',
      summary: '業界新聞へ掲載するのみ。即時ポップアップ・BGM・SEはない。',
      sources: ['src/management.js:16276', 'src/app.js:11613'],
      audioState: 'silent',
    }),
    entry('ai-breakthrough-b', '他団体・成長', 'B団体のブレークスルー記事', {
      oneShot: '各選手のシーズン末成長ごと。新聞に1回掲載。',
      trigger: 'AIのシーズン末ブレークスルーかつ B tier。',
      summary: '業界新聞へ掲載するのみ。即時ポップアップ・BGM・SEはない。',
      sources: ['src/management.js:16276', 'src/app.js:11613'],
      audioState: 'silent',
    }),
    entry('relationship-awakening', '人間関係', 'クロス非対称・覚醒', {
      oneShot: '選手ごとに生涯1回（_awakened）。',
      trigger: '高敵対・低絆と、低敵対・高絆が交差した状態で週ごとに1.5%。',
      summary: '相手への感情が反転する週報テキスト。ポップアップ・BGM・SEはない。',
      sources: ['src/relationships.js:996', 'src/data.js:5916'],
      audioState: 'silent',
    }),
    entry('invite-awakening', '成長', '招聘卒業・覚醒表示', {
      oneShot: '招聘の卒業結果ごと。',
      trigger: '外部コーチ招聘の卒業結果が awakened。',
      summary: '才能の壁を超えたことを示す卒業画面内の演出。専用音声はない。',
      sources: ['src/ui-common.js:8662'],
      audioState: 'silent',
    }),
    entry('faction-f01', '派閥', 'F01 派閥結成の報告', {
      oneShot: '派閥の初回結成時。',
      trigger: '派閥イベント F01。',
      summary: '中立の報告として通常BGMを継続する。',
      sources: ['src/app.js:1491', 'src/app.js:12456'],
      audioState: 'inherits',
    }),
    entry('faction-f02-ignite', '派閥', 'F02 対立の火種', {
      oneShot: '対立ルートの開始時。',
      trigger: '派閥イベント F02_IGNITE。',
      summary: '不穏BGMに切替え、開始ゴングを鳴らす。',
      sources: ['src/app.js:1493', 'src/ui-common.js:10510'],
      audioState: 'legacy-one-shot', bgm: BGM.tension, sfx: SFX.gong,
    }),
    entry('faction-f02-peace', '派閥', 'F02 和解・終結', {
      oneShot: '対立ルートの和解時。',
      trigger: '派閥イベント F02_PEACE。',
      summary: '契約交渉曲に切替え、閉じる時に決着チャイムを鳴らす。',
      sources: ['src/app.js:1495'],
      audioState: 'legacy-one-shot', bgm: BGM.soft, sfx: SFX.chime,
    }),
    entry('faction-f03', '派閥', 'F03 派閥の調整', {
      oneShot: '派閥イベント発生時。',
      trigger: '派閥イベント F03。',
      summary: '契約交渉曲と決着チャイム。',
      sources: ['src/app.js:1498'],
      audioState: 'legacy-one-shot', bgm: BGM.soft, sfx: SFX.chime,
    }),
    entry('faction-f04', '派閥', 'F04 団結イベント', {
      oneShot: '派閥イベント発生時。',
      trigger: '派閥イベント F04。',
      summary: '契約交渉曲のみ。',
      sources: ['src/app.js:1499'], bgm: BGM.soft,
    }),
    entry('faction-f05h', '派閥', 'F05H 派閥の決着', {
      oneShot: '派閥イベント発生時。',
      trigger: '派閥イベント F05H。',
      summary: '契約交渉曲と決着チャイム。',
      sources: ['src/app.js:1500'],
      audioState: 'legacy-one-shot', bgm: BGM.soft, sfx: SFX.chime,
    }),
    entry('faction-f06', '派閥', 'F06 派閥の転機', {
      oneShot: '派閥イベント発生時。',
      trigger: '派閥イベント F06。',
      summary: '契約交渉曲と決着チャイム。',
      sources: ['src/app.js:1504'],
      audioState: 'legacy-one-shot', bgm: BGM.soft, sfx: SFX.chime,
    }),
    entry('faction-f07', '派閥', 'F07 派閥の衝突', {
      oneShot: '派閥イベント発生時。',
      trigger: '派閥イベント F07。',
      summary: '不穏BGMのみ。',
      sources: ['src/app.js:1505'], bgm: BGM.tension,
    }),
    entry('faction-f08', '派閥', 'F08 内部抗争戦', {
      oneShot: '派閥対立が試合に発展した時。',
      trigger: '派閥イベント F08。',
      summary: '不穏BGM、開始ゴング、決着チャイムを使う。',
      sources: ['src/app.js:1506', 'src/ui-common.js:10510', 'src/ui-common.js:10587'],
      audioState: 'legacy-one-shot', bgm: BGM.tension, sfx: [SFX.gong, SFX.chime],
    }),
    entry('faction-f09', '派閥', 'F09 派閥対抗戦', {
      oneShot: '派閥間の対抗戦が成立した時。',
      trigger: '派閥イベント F09。',
      summary: '不穏BGM、開始ゴング、終了時の決着チャイム。',
      sources: ['src/ui-common.js:10763', 'src/ui-common.js:10836', 'src/ui-common.js:10991'],
      audioState: 'legacy-one-shot', bgm: BGM.tension, sfx: [SFX.gong, SFX.chime],
    }),
    entry('faction-common-1', '派閥', 'COMMON_1 派閥共通・試合', {
      oneShot: '条件成立時。',
      trigger: '派閥共通イベント COMMON_1。',
      summary: '不穏BGMのみ。',
      sources: ['src/app.js:1507'], bgm: BGM.tension,
    }),
    entry('faction-common-4', '派閥', 'COMMON_4 派閥共通・和解', {
      oneShot: '条件成立時。',
      trigger: '派閥共通イベント COMMON_4。',
      summary: '契約交渉曲と決着チャイム。',
      sources: ['src/app.js:1508'],
      audioState: 'legacy-one-shot', bgm: BGM.soft, sfx: SFX.chime,
    }),
    entry('challenge-request', '団体間', '挑戦状・直訴', {
      oneShot: '挑戦状が届いた時。',
      trigger: 'challengeRequest の週次抽選、または開発者モードの既存強制表示。',
      summary: '不穏BGMと開始ゴング。',
      sources: ['src/app.js:1510', 'src/app.js:12255'],
      audioState: 'legacy-one-shot', bgm: BGM.tension, sfx: SFX.gong,
    }),
    entry('b3-challenge', '団体間', 'B3 他団体挑戦試合', {
      oneShot: '大型イベント B3 の挑戦時。',
      trigger: '大型イベント B3。',
      summary: '不穏BGMと開始ゴングからビッグマッチへ移る。',
      sources: ['src/app.js:1511', 'src/app.js:12153'],
      audioState: 'legacy-one-shot', bgm: BGM.tension, sfx: SFX.gong,
    }),
    entry('retirement', '節目', '引退セレモニー', {
      oneShot: '選手の引退ごと。',
      trigger: 'シーズン末または怪我引退。',
      summary: '連続引退中は WM-D03 を継続し、通常BGMへ戻す。',
      sources: ['src/ui-common.js:2194'], bgm: BGM.retirement, sfx: SFX.event,
    }),
    entry('milestone-arrival', '節目', 'マイルストーン到達', {
      oneShot: '各マイルストーン初回到達時。',
      trigger: 'D層セレモニーの arrival 表示。',
      summary: 'タイトル・オープニング曲を使う。',
      sources: ['src/app.js:1545'], bgm: BGM.opening,
    }),
    entry('milestone-triumph', '節目', 'マイルストーン栄誉', {
      oneShot: '各栄誉マイルストーン初回到達時。',
      trigger: 'D層セレモニーの triumph 表示。',
      summary: '年末表彰曲を使う。',
      sources: ['src/app.js:1549'], bgm: BGM.awards,
    }),
    entry('league-elevation', '節目', 'リーグ昇格セレモニー', {
      oneShot: '業界ランクが上昇した時。',
      trigger: '業界底上げ・リーグ昇格の演出。',
      summary: '不穏曲のワンショットに、旧MP3のカットイン音と歓声を重ねる。',
      sources: ['src/ui-common.js:14672', 'src/ui-common.js:14727'],
      audioState: 'legacy-one-shot', bgm: BGM.tension, sfx: [SFX.elevationImpact, SFX.elevationCrowd],
    }),
    entry('draft-selection', 'ドラフト', 'ドラフト選考・指名', {
      oneShot: 'シーズンごとのドラフト。',
      trigger: 'ドラフト候補の選考・指名画面。',
      summary: 'ドラフト選択曲。開始ゴングなどに旧MP3を使う。',
      sources: ['src/ui-common.js:5385', 'src/app.js:1320'],
      audioState: 'legacy-one-shot', bgm: BGM.draftPick, sfx: [SFX.draftGong, SFX.chime],
    }),
    entry('draft-negotiation', 'ドラフト', 'ドラフト入札・交渉', {
      oneShot: '選手ごとの入札・交渉。',
      trigger: 'ドラフト交渉フェーズ。',
      summary: 'ドラフト入札曲と、結果時の旧MP3ファンファーレ。',
      sources: ['src/ui-common.js:5388', 'src/app.js:1331'],
      audioState: 'legacy-one-shot', bgm: BGM.draftBid, sfx: SFX.draftFanfare,
    }),
    entry('spring-tag-league', '季節大会', '春・タッグリーグ', {
      oneShot: '毎シーズンの春大会。',
      trigger: '春タッグリーグ開催週。',
      summary: 'リーグ戦は SP01、決勝は SP02。',
      sources: ['src/app.js:4548', 'src/app.js:4577'], bgm: BGM.spring,
    }),
    entry('junior-tournament', '季節大会', '夏・ジュニアトーナメント', {
      oneShot: '毎シーズンの夏大会。',
      trigger: 'ジュニアトーナメント開催週。',
      summary: '大会進行は SP03、決勝は SP04。',
      sources: ['src/app.js:15378'], bgm: BGM.junior,
    }),
    entry('autumn-war', '季節大会', '秋・4団体対抗戦', {
      oneShot: '毎シーズンの秋大会。',
      trigger: '秋の4団体対抗戦開催週。',
      summary: '進行は SP05、大将戦は SP06。',
      sources: ['src/app.js:4104', 'src/app.js:4133'], bgm: BGM.autumn,
    }),
    entry('grand-final', '季節大会', '冬・GRAND FINAL', {
      oneShot: '毎シーズンの冬大会。',
      trigger: '年末PPV。',
      summary: '進行は SP07、メインは SP08／M05。',
      sources: ['src/app.js:14589', 'src/app.js:14709'], bgm: BGM.ppv,
    }),
    entry('tenchosen', '季節大会', '天頂戦', {
      oneShot: '対象シーズンの年末大会。',
      trigger: '天頂戦シーズン。',
      summary: '天頂戦専用 SP09。',
      sources: ['src/app.js:15878'], bgm: BGM.tencho,
    }),
    entry('year-end-awards', '節目', '年末表彰式', {
      oneShot: 'シーズン末の表彰時。',
      trigger: '年末表彰の開始。',
      summary: '最新版 WM-H05 を使用する。',
      sources: ['src/app.js:11901'], bgm: BGM.awards,
    }),
    entry('ending', 'エンディング', 'エンディング', {
      oneShot: 'ゲームクリア時。',
      trigger: 'エンディングセレモニー。',
      summary: 'WM-H04 をループ再生する。',
      sources: ['src/ui-common.js:14972'], bgm: BGM.ending,
    }),
    entry('gameover', 'エンディング', '団体解散・ゲームオーバー', {
      oneShot: 'ゲームオーバー時。',
      trigger: '資金危機などで団体解散。',
      summary: 'WM-H06 を一度だけ再生する。',
      sources: ['src/ui-common.js:15038', 'src/ui-common.js:15256'], bgm: BGM.gameover,
    }),
  ];

  root.WrestleManagerDevEventCatalog = Object.freeze(catalog);
})(globalThis);
