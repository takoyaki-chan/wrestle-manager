// ╔══════════════════════════════════════════════════════════╗
// ║  TAG MATCH DATA — タッグマッチ専用定数                    ║
// ╚══════════════════════════════════════════════════════════╝

// ── タッグマッチ設定 ──────────────────────────────────
const TAG_MATCH_CONFIG = {
  maxTotalTurns: 50,
  damageScale: 0.55,     // タッグ専用グローバルダメージスケール (通常攻撃・カウンター・タッグ技全て)
  hpBase: 70,            // タッグ用HP基本値 (シングル50より高め: 試合を長くする)
  hpScale: 1.00,         // タッグ用HPスケール (シングル0.90より高め)
  apronRecovery: 1.8,   // エプロンHP回復/ターン (§3.1.2)

  // フェーズ: 試合全体のターン数で判定
  phases: [
    { name: 'Opening', min: 1,  max: 12, mult: 0.90, sCh: 20, counterBonus: 0 },
    { name: 'Mid',     min: 13, max: 22, mult: 1.05, sCh: 40, counterBonus: 3 },
    { name: 'End',     min: 23, max: 32, mult: 1.20, sCh: 55, counterBonus: 5 },
    { name: 'Climax',  min: 33, max: 50, mult: 1.40, sCh: 70, counterBonus: 8 },
  ],

  // 決着関連（既存ENG値を流用しつつ、タッグ用調整）
  kickoutMax: 2,
  guEscapeMax: 2,

  // ── タッチ判定 ──
  touch: {
    wantHpThreshold: 0.60,       // HP割合: これ以下でタッチしたい
    wantHpCritical: 0.35,        // HP割合: これ以下で強制タッチしたい
    wantLossTurns: 3,            // 連続劣勢ターン数でタッチしたい
    tacticalChemThreshold: 65,   // ケミストリー: 戦術タッチ発生条件
    tacticalBaseRate: 0.15,      // 戦術タッチの基本確率

    // canTouch成功率の構成
    canTouchHpWeight: 0.875,     // HP由来: (hp/mhp - 0.2) × weight → 0~70%
    canTouchSpdScale: 0.003,     // SPD由来: (spd - 70) × scale
    canTouchOppScale: 0.002,     // 相手阻止: ((pwr+tec)/2 - 70) × scale
    canTouchMin: 0.15,
    canTouchMax: 0.90,

    // 孤立 & ホットタグ
    isolationThreshold: 4,       // 孤立カウント≥4でホットタグ判定 (3→4: 発生率抑制)
    hotTagBuffChance: 0.22,      // ホットタグ時の気迫バフ確率 (20~25%)
    hotTagBuffTurns: 2,          // バフ持続ターン
    hotTagBuffMult: 1.10,        // バフ中の攻撃力倍率
  },

  // ── カットイン(介入) ──
  cutin: {
    basePinRate: 0.70,            // ピン時の基本成功率
    baseFinisherRate: 0.40,       // フィニッシャー時
    baseCounterRate: 0.60,        // 相手介入への対抗
    hpScale: 0.0076,              // HP補正: (HP-50)×scale → ±38%幅
    bondScale: 0.0046,            // bond補正: (bond-50)×scale → ±23%幅
    countPenalty: 0.08,           // 介入回数ペナルティ
  },

  // ── ドラマイベント ──
  drama: {
    doubleTeamBase: 0.08,         // ダブルチーム基本率 (セグメント単位判定)
    doubleTeamChemScale: 0.0003,  // ケミストリー補正: chem × scale
    friendlyFireBase: 0.03,       // 同士討ち基本率 (セグメント単位判定)
    friendlyFireChemScale: 0.0003,// ケミストリー補正(マイナス方向)
    betrayalBondThreshold: 30,    // 見殺し発生bond閾値
    betrayalBondScale: 0.02,      // (threshold - bond) × scale
  },

  // ── MQ設定 ──
  mq: {
    screenTimeMaxBonus: 8,        // 見せ場分配ボーナス最大
    touchDiversityBonus: [0, 0, 2, 4, 6], // [0種,1種,2種,3種,4種]
    dramaEventBonus: 2,           // ドラマイベント1種あたり
    dramaEventMaxBonus: 8,        // ドラマイベントボーナス上限
    cutinBreakBonus: 3,           // カットイン突破決着ボーナス
    tagMoveFinishBonus: 5,        // タッグ技決着ボーナス
    longSegmentPenaltyThreshold: 0.50, // 最長セグメント比率ペナ閾値
    longSegmentPenaltyScale: 20,  // 超過分×scale
    screenTimePenaltyScale: 15,   // 出番偏りペナ
  },
};

// ── スタイル相性マトリクス (§4.4.2) ──────────────────
// 補完=100, 共鳴=75, 普通=50, 噛み合わない=20
const STYLE_COMPAT_MATRIX = {
  Grappler:   { Grappler: 75, Aerial: 100, Submission: 75, Allround: 50, Striker: 50, Brawler: 20 },
  Aerial:     { Grappler: 100, Aerial: 75, Submission: 50, Allround: 100, Striker: 50, Brawler: 50 },
  Submission: { Grappler: 75, Aerial: 50, Submission: 50, Allround: 50, Striker: 100, Brawler: 100 },
  Allround:   { Grappler: 50, Aerial: 100, Submission: 50, Allround: 50, Striker: 50, Brawler: 50 },
  Striker:    { Grappler: 50, Aerial: 50, Submission: 100, Allround: 50, Striker: 75, Brawler: 75 },
  Brawler:    { Grappler: 20, Aerial: 50, Submission: 100, Allround: 50, Striker: 75, Brawler: 75 },
};
// Technique → Submission に読み替え（本体はSubmissionスタイルとTechniqueスタイルが別名で同義的に使われている）
STYLE_COMPAT_MATRIX.Technique = STYLE_COMPAT_MATRIX.Submission;

// ── 汎用タッグ技 (§5.1.2) ──────────────────────────
// キーはアルファベット順ソート済み "StyleA+StyleB"
const STYLE_TAG_MOVES = {
  'Aerial+Grappler':    { n: '空中戦からの投げ連携', d: 18, c: 'throw' },
  'Aerial+Aerial':      { n: 'ダブル・ムーンサルト', d: 17, c: 'aerial' },
  'Aerial+Allround':    { n: 'アシスト式ダイビングアタック', d: 17, c: 'aerial' },
  'Aerial+Striker':     { n: 'キック＆飛びつきコンビネーション', d: 16, c: 'strike' },
  'Aerial+Submission':  { n: '空中からの合体関節技', d: 16, c: 'submission' },
  'Aerial+Technique':   { n: '空中からの合体関節技', d: 16, c: 'submission' },
  'Aerial+Brawler':     { n: '放り投げからのダイブ', d: 17, c: 'aerial' },
  'Allround+Grappler':  { n: 'ダブル・スープレックス', d: 17, c: 'throw' },
  'Allround+Allround':  { n: 'コンビネーション・スラム', d: 16, c: 'throw' },
  'Allround+Striker':   { n: '打投コンビネーション', d: 16, c: 'throw' },
  'Allround+Submission':{ n: '崩し＆極め連携', d: 16, c: 'submission' },
  'Allround+Technique': { n: '崩し＆極め連携', d: 16, c: 'submission' },
  'Allround+Brawler':   { n: 'パワー連携スラム', d: 17, c: 'throw' },
  'Brawler+Grappler':   { n: '重量級ダブルパワーボム', d: 18, c: 'throw' },
  'Brawler+Striker':    { n: 'ダブル打撃コンビネーション', d: 17, c: 'strike' },
  'Brawler+Submission': { n: '叩き潰してからの関節技', d: 17, c: 'submission' },
  'Brawler+Technique':  { n: '叩き潰してからの関節技', d: 17, c: 'submission' },
  'Brawler+Brawler':    { n: 'ダブル・パワースラム', d: 18, c: 'throw' },
  'Grappler+Grappler':  { n: 'ダブル・チョークスラム', d: 18, c: 'throw' },
  'Grappler+Striker':   { n: '投げからの追撃打撃', d: 17, c: 'strike' },
  'Grappler+Submission':{ n: '投げからの関節極め', d: 17, c: 'submission' },
  'Grappler+Technique': { n: '投げからの関節極め', d: 17, c: 'submission' },
  'Striker+Striker':     { n: 'ダブル打撃ラッシュ', d: 17, c: 'strike' },
  'Striker+Submission':  { n: '打撃で崩して関節技', d: 17, c: 'submission' },
  'Striker+Technique':   { n: '打撃で崩して関節技', d: 17, c: 'submission' },
  'Submission+Submission':{ n: 'ダブル関節技', d: 17, c: 'submission' },
  'Submission+Technique': { n: 'ダブル関節技', d: 17, c: 'submission' },
  'Technique+Technique':  { n: 'ダブル関節技', d: 17, c: 'submission' },
};

/** 2人のスタイルからタッグ技を取得 */
function getTagMove(styleA, styleB) {
  const sA = styleA || 'Allround';
  const sB = styleB || 'Allround';
  const key = [sA, sB].sort().join('+');
  return STYLE_TAG_MOVES[key] || { n: '合体スラム', d: 16, c: 'throw' };
}

/** スタイル相性値を取得 (0~100) */
function getStyleCompat(styleA, styleB) {
  const sA = styleA || 'Allround';
  const sB = styleB || 'Allround';
  const row = STYLE_COMPAT_MATRIX[sA];
  if (!row) return 50;
  return row[sB] != null ? row[sB] : 50;
}

// Node.js モジュールエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TAG_MATCH_CONFIG, STYLE_COMPAT_MATRIX, STYLE_TAG_MOVES,
    getTagMove, getStyleCompat,
  };
}
