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

function pickHotTagLine(personality) {
  const lines = HOT_TAG_LINES[personality] || HOT_TAG_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
function pickDoubleTeamLine(personality) {
  const lines = DOUBLE_TEAM_LINES[personality] || DOUBLE_TEAM_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
function pickCutinSaveLine(personality) {
  const lines = CUTIN_SAVE_LINES[personality] || CUTIN_SAVE_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
function pickBetrayalLine(personality) {
  const lines = BETRAYAL_LINES[personality] || BETRAYAL_LINES.normal;
  return lines[Math.floor(Math.random() * lines.length)];
}
