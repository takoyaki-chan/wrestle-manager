// tag-battle セリフ類 — タッグ固有のみ
// DAMAGE_SERIF_LINES / DAMAGE_VOICE_LINES / pickDamageLine は battle-lines.js に共通化済み

// タッグ専用: ホットタグ時のカットイン
const HOT_TAG_LINES = {
  normal:     ["任せて！","交代だよ！","ここからは私が行く！"],
  earnest:    ["任せてください！","お疲れ様…ここからは私が！","交代します！"],
  bold:       ["待ってました！","私の番だ！","ようやく回ってきたな！"],
  easygoing:  ["はーい、交代〜！","お疲れさま♪ 私いくね","ここからは私の出番♪"],
  quiet:      ["……交代","……来た","……任せて"],
  shy:        ["が、頑張ります…！","交代…します…","い、行ってきます…"],
  emotional:  ["絶対…勝つ…！","お疲れ…ここからは私が…！","任せて…絶対に…！"]
};

// タッグ専用: ダブルチーム時のカットイン
const DOUBLE_TEAM_LINES = {
  normal:     ["合わせて！","いくよ！","息を合わせよう！"],
  earnest:    ["一緒に…！","合わせてください！","行きましょう！"],
  bold:       ["二人で決める！","合わせろ！","行くぞ相棒！"],
  easygoing:  ["一緒にやろ〜！","合わせて合わせて♪","せーのっ♪"],
  quiet:      ["……合わせる","……せーの","……行こう"],
  shy:        ["あ、合わせます…！","に、二人で…！","い、いっしょに…！"],
  emotional:  ["二人でっ…！","合わせるよ…っ！","絶対決めるっ…！"]
};

// タッグ専用: カットイン救出時のセリフ
const CUTIN_SAVE_LINES = {
  normal:     ["させない！","まだだ！","渡さない！"],
  earnest:    ["させません！","まだ…まだです！","渡しません！"],
  bold:       ["そうはさせるか！","まだまだ！","そうはいかない！"],
  easygoing:  ["させないよ〜！","まだまだ〜！","はい、カット！"],
  quiet:      ["……させない","……まだ","……駄目"],
  shy:        ["さ、させない…！","ま、まだ…です…！","だ、ダメ…！"],
  emotional:  ["絶対させないっ…！","まだっ…！","そんなの…駄目っ…！"]
};

// タッグ専用: 見殺し時のセリフ（動かないパートナー側）
const BETRAYAL_LINES = {
  normal:     ["……動けない","……間に合わない","……"],
  earnest:    ["間に合わない…！","動けない…！","……"],
  bold:       ["くっ…！","ちっ…","間に合わねえ"],
  easygoing:  ["ありゃ…動けない…","うぅ…遠い…","……"],
  quiet:      ["……","……動けない","……"],
  shy:        ["う、動けない…","間に合わない…！","…ごめん…"],
  emotional:  ["嘘…動けないっ","間に合わないっ…！","ごめん…ごめんっ…！"]
};

// T1: ダブルチーム実況文 (カテゴリ別)。固定文「二人がかりの合体攻撃！」を置換するため。
// 命名規則 DOUBLE_TEAM_*_COMMENTARY_LINES でExcel化時に分離しやすく。
const DOUBLE_TEAM_STRIKE_COMMENTARY_LINES = [
  "二人の連打が止まらない！ これがタッグの醍醐味！",
  "連携の打撃ラッシュ！ 息がぴったり合っている！",
  "挟み撃ちの打撃コンビネーション！ 逃げ場がない！",
  "左右から浴びせる打撃！ 二人の攻撃が完全にシンクロしている！",
  "ダブル打撃の嵐！ 相手は防ぎきれない！",
  "コンビの拳とキックが次々に突き刺さる！",
];
const DOUBLE_TEAM_THROW_COMMENTARY_LINES = [
  "息の合ったダブルスロー！ これぞタッグの真骨頂！",
  "二人がかりの豪快な投げ技！ 会場が揺れる！",
  "連係の投げ技が完璧に決まった！",
  "受け渡し式の投げ技！ 相手は空中で何も出来ない！",
  "ダブルパワーで投げ切った！ まるで振り子のようだ！",
  "二人の呼吸が合った一瞬の投げ！ 決まった！",
];
const DOUBLE_TEAM_SUB_COMMENTARY_LINES = [
  "二人がかりの極め技！ もう動けない！",
  "上下から襲いかかる関節技！ これは危険だ！",
  "セットアップから一気に極めた！ 逃げ場がない！",
  "ダブルロック！ 二人分の力で関節を締め上げる！",
  "連係の関節技！ 相手は苦悶の表情を浮かべる！",
  "二人で極めにいった！ これは返せない！",
];
const DOUBLE_TEAM_AERIAL_COMMENTARY_LINES = [
  "空中から二重の衝撃！ 圧巻のダブルフライ！",
  "タワー式のダイビング技！ 会場が沸いている！",
  "シンクロ空中技が炸裂！ これは止められない！",
  "コンビの飛び技が連続で突き刺さる！",
  "空中戦の完璧な連携！ 二人のタイミングは完全一致！",
  "一人が踏み台、もう一人が飛ぶ！ タッグでしか出来ない技！",
];
const DOUBLE_TEAM_FINISH_COMMENTARY_LINES = [
  "これは決まった！ タッグの絆が生んだ一撃！",
  "フィニッシュだ！ 二人の信頼が織りなす必殺技！",
  "息の合った一撃で仕留めた！ これがタッグの勝利！",
  "完璧なダブルチームで決着！ 二人の強さが証明された！",
  "連係の果ての必殺技！ 相手は立てない！",
];

// T2: 試合完了時の勝利者セリフ (パートナー言及必須、{partner} プレースホルダ)。性格7種 × 3件。
const TAG_MATCH_WIN_LINES = {
  normal: [
    "{partner}、ありがとう。二人だから勝てた。",
    "任せてくれてありがとう、{partner}。",
    "私たちのタッグ、やっぱり最強だよ。",
  ],
  earnest: [
    "{partner}さんのおかげです…本当に、ありがとうございました。",
    "{partner}さんを信じてよかった…二人で勝ち取った勝利です。",
    "この勝利、{partner}さんと一緒だから意味があるんです。",
  ],
  bold: [
    "やったな、{partner}！ 二人揃えば負ける気がしねえ！",
    "{partner}、完璧な連携だったぜ！ 最高のタッグだ！",
    "これが私たち最強タッグの実力だ！ 見たか！",
  ],
  easygoing: [
    "{partner}〜お疲れさま♪ 私たち息ぴったりだったね〜",
    "勝っちゃった♪ {partner}と組んでよかった〜！",
    "やっぱり{partner}と組むの楽しい〜！ また組もうね♪",
  ],
  quiet: [
    "……{partner}、ありがとう。",
    "……{partner}と、だから勝てた。",
    "……また、組みたい。{partner}と。",
  ],
  shy: [
    "{partner}さん…本当に…ありがとうございました…！",
    "{partner}さんと組めて…良かったです…！",
    "わ、私、頑張れました…{partner}さんのおかげです…！",
  ],
  emotional: [
    "{partner}っ…！ ありがとうっ…二人でっ、勝ったよ…！",
    "{partner}と…勝てた…！ 本当に…嬉しいっ…！",
    "絶対勝つって、約束してたもんね…{partner}…っ！",
  ],
};

// T2: 敗北者セリフ (パートナーへの詫び/責任/次への意欲)。性格7種 × 3件。
const TAG_MATCH_LOSS_LINES = {
  normal: [
    "{partner}…ごめん。私が決められてたら…",
    "{partner}、悔しい。次は絶対勝とう。",
    "{partner}、ここまで来たのに…ごめん。",
  ],
  earnest: [
    "{partner}さん、申し訳ありませんでした…私の力不足です。",
    "{partner}さんを勝たせてあげられなくて…本当にすみません…！",
    "{partner}さん、次は必ず…必ず勝ちましょう。",
  ],
  bold: [
    "くそっ…{partner}、悪い。私のミスだ。",
    "{partner}、ちっとも勝たせてやれなかったな…次は絶対だ。",
    "負けたままでいられるか…{partner}、次は倍返しだ！",
  ],
  easygoing: [
    "{partner}〜ごめんね…私、決められちゃった…",
    "あちゃ〜負けちゃった…{partner}、ごめん…",
    "{partner}、次は頑張るね…今日はごめんなさい…",
  ],
  quiet: [
    "……{partner}、ごめん。",
    "……悔しい。{partner}にも、申し訳ない。",
    "……次は、絶対。{partner}と、勝つ。",
  ],
  shy: [
    "{partner}さん…ご、ごめんなさい…私のせいで…",
    "{partner}さん…本当に…申し訳ないです…",
    "つ、次は…絶対…{partner}さんを勝たせます…！",
  ],
  emotional: [
    "{partner}っ…ごめんっ…ごめんねっ…！",
    "悔しいっ…{partner}…！ 私のせいで…！",
    "次は絶対…絶対勝つからっ…！ {partner}…！",
  ],
};

// T2: 実況の締め (勝者名 + 決め技 + タッグ関連言及)。{winner} {partner} {move} プレースホルダ。
const TAG_MATCH_COMMENTARY_WIN_LINES = [
  "{winner}組、見事なコンビネーションで勝利を掴んだ！",
  "息の合ったタッグワークが勝負を決めた！ {winner}&{partner}、完勝！",
  "これがタッグの強さだ！ {winner}組、見事な勝利！",
  "{winner}と{partner}の信頼が生んだ一撃！ 歴史に残る名勝負だ！",
  "タッグの醍醐味を見せつけた！ {winner}組、堂々の勝利！",
  "二人の絆が勝敗を分けた！ {winner}組の勝利！",
  "{move}で決着！ {winner}&{partner}のコンビが頂点に立った！",
];

// T2: 試合完了セリフ picker。{partner} / {winner} / {move} を埋め込む。
function _tplTagLine(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m));
}
function pickTagWinLine(fighter, partnerName) {
  const p = (fighter && fighter.personality) || 'normal';
  const arr = TAG_MATCH_WIN_LINES[p] || TAG_MATCH_WIN_LINES.normal;
  const line = arr[Math.floor(Math.random() * arr.length)];
  return _tplTagLine(line, { partner: partnerName || 'パートナー' });
}
function pickTagLossLine(fighter, partnerName) {
  const p = (fighter && fighter.personality) || 'normal';
  const arr = TAG_MATCH_LOSS_LINES[p] || TAG_MATCH_LOSS_LINES.normal;
  const line = arr[Math.floor(Math.random() * arr.length)];
  return _tplTagLine(line, { partner: partnerName || 'パートナー' });
}
function pickTagWinCommentary(winnerName, partnerName, moveName) {
  const arr = TAG_MATCH_COMMENTARY_WIN_LINES;
  const line = arr[Math.floor(Math.random() * arr.length)];
  return _tplTagLine(line, { winner: winnerName || '勝者', partner: partnerName || 'パートナー', move: moveName || '決め技' });
}

function pickHotTagLine(personality) {
  const lines = HOT_TAG_LINES[personality] || HOT_TAG_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
function pickDoubleTeamLine(personality) {
  const lines = DOUBLE_TEAM_LINES[personality] || DOUBLE_TEAM_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
// T1: 技カテゴリに応じて実況文を返す。isFinish=true の場合は決め台詞プールから選択。
function pickDoubleTeamCommentary(moveCat, isFinish) {
  if (isFinish) {
    const f = DOUBLE_TEAM_FINISH_COMMENTARY_LINES;
    return f[Math.floor(Math.random() * f.length)];
  }
  let pool;
  switch (moveCat) {
    case 'strike':     pool = DOUBLE_TEAM_STRIKE_COMMENTARY_LINES; break;
    case 'throw':      pool = DOUBLE_TEAM_THROW_COMMENTARY_LINES; break;
    case 'submission': pool = DOUBLE_TEAM_SUB_COMMENTARY_LINES; break;
    case 'aerial':     pool = DOUBLE_TEAM_AERIAL_COMMENTARY_LINES; break;
    default:           pool = DOUBLE_TEAM_THROW_COMMENTARY_LINES;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
function pickCutinSaveLine(personality) {
  const lines = CUTIN_SAVE_LINES[personality] || CUTIN_SAVE_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
function pickBetrayalLine(personality) {
  const lines = BETRAYAL_LINES[personality] || BETRAYAL_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
