// battle-lines.js — 観戦画面 (single / tag) 共通セリフデータ層
// 単品の battle-engine.html / tag-battle.html の両方から <script src="battle-lines.js"></script> で読み込む。
// top-level const / function として定義し、グローバル参照で解決される。
// タッグ固有のセリフ (HOT_TAG_LINES / CUTIN_SAVE_LINES / BETRAYAL_LINES など) は tag-battle-lines.js に残す。

// ダメージセリフ（長文、クリティカルで発動）
const DAMAGE_SERIF_LINES = {
  standard: {
    normal: ["くっ…まだ…まだだ…！","効いた…けど…負けない…！","はぁ…はぁ…立てる…まだ…"],
    earnest: ["ぐっ…！ まだ…立てる…！","くぅ…っ！ 効いた…けど…！","はぁ…はぁ…負けるもんか…！"],
    bold: ["はっ…やるじゃん…でもまだだよ！","この程度じゃ…倒れないよ！","あはは…痛い痛い…でもね！"],
    easygoing: ["あたた…でもまだ大丈夫！","う〜ん…効いたかも…でもへーきへーき！","いたた…ちょっと休憩…なんてね！"],
    quiet: ["……まだ","……これくらい","……立てる"],
    shy: ["い、痛い…でも…まだ…","う、うぅ…でも…立てる…から…","ひっ…で、でも…負けたくない…"],
    emotional: ["痛いっ…！ でも…でもっ…！","うぅっ…こんなので…負けないっ…！","泣かない…泣かないよ…まだ…！"],
  },
  polite: {
    normal: ["くっ…まだ…大丈夫です…！","効きました…でも…まだです…！","はぁ…はぁ…立てます…まだ…"],
    earnest: ["ぐっ…！ まだ…立てます…！","くぅ…っ！ でも…まだです…！","はぁ…はぁ…負けません…！"],
    bold: ["はっ…効きますね…でもまだですよ！","この程度では…倒れませんよ！","痛い…ですけど…まだです！"],
    easygoing: ["あたた…でもまだ大丈夫ですよ！","う〜ん…効きましたけど…平気です！","いたた…でもまだいけます！"],
    quiet: ["……まだ、です","……これくらいでは","……立てます"],
    shy: ["い、痛いです…でも…まだ…","う、うぅ…でも…立てます…","ひっ…で、でも…負けたくないです…"],
    emotional: ["痛いです…っ！ でも…でもっ…！","うぅっ…こんなでは…負けませんっ…！","泣いてません…まだ…立てます…！"],
  },
  seductive: {
    normal: ["っ…やるじゃない…","くっ…いい攻撃ね…でもまだよ","はぁ…少し本気になったわ…"],
    earnest: ["んっ…痛い…けど…気持ちいいかも…","くっ…まだまだ…よ？","はぁ…身体が熱くなってきたわ…"],
    bold: ["あら…乱暴ね…でも嫌いじゃないわ","くっ…いいわよ…もっと来なさい","はぁ…痛い…でもまだ足りないわ"],
    easygoing: ["あらら…やるじゃない♪ でもまだよ？","くふふ…やるわね…楽しいわ","んー…効いたかも…でもまだよ♪"],
    quiet: ["……ふふ…まだよ","……その程度…？","……もっと…来なさい"],
    shy: ["あっ…痛い…でも…まだよ…","う、うぅん…負けない…から…","ひっ…で、でも…まだ立てるわ…"],
    emotional: ["あぁ…っ…痛い…でも…まだよ…！","くぅ…っ…こんなので…終わらないわ…！","涙…？ 違うわ…汗よ…！"],
  },
  delinquent: {
    normal: ["くそっ…足にくるぜ…！","てめえ…やるじゃねえか…","はぁ…はぁ…なめんなよ…"],
    earnest: ["ぐっ…！ やるじゃねえか…！","くそ…効いたぜ…でもな…！","はぁ…はぁ…舐めんなよ…！"],
    bold: ["はっ…その程度かよ！","効くじゃねえか…でもまだだ！","痛てぇ…けどな…舐めんな！"],
    easygoing: ["おっと…やるなぁ！ でもまだだ！","がはっ…効いた効いた…けどな！","いてて…でもこの程度でっ！"],
    quiet: ["……なめんな","……その程度か","……まだだ"],
    shy: ["い、痛え…でも…まだだ…","う、うるせえ…まだ立てる…","ひっ…な、なめんな…"],
    emotional: ["くそぉ…っ！ 効きやがった…！","うぅっ…てめえ…覚えてろ…！","泣いてねえっ…泣いてねえよ…！"],
  },
  ojousama: {
    normal: ["くっ…なかなかやるわね…","効いたわ…でもこの程度で…！","はぁ…はぁ…まだ立てますわ…"],
    earnest: ["ぐっ…！ やりますわね…！","くぅ…っ！ でもまだですわ…！","はぁ…はぁ…ここからですわ…！"],
    bold: ["っぐ…やりますわね！ でもまだですわ！","この程度では…倒れませんわよ！","この痛み…ですけど…まだまだっ！"],
    easygoing: ["あらら…効きますわね〜！ でもまだですわ！","うふふ…やりますわね…でも平気ですわ！","いたた…でもまだまだですわよ〜！"],
    quiet: ["……まだですわ","……この程度では","……立てますわ"],
    shy: ["い、痛い…ですけど…まだですわ…","う、うぅ…でも…立てますわ…","ひっ…で、でも…負けませんわ…"],
    emotional: ["痛い…ですわ…っ！ でもっ…！","うぅっ…こんなでは…負けませんわっ…！","泣いてなど…まだ立てますわ…！"],
  },
  cool: {
    normal: ["…っ…まだ","…効いた…けど","…はぁ…まだ…立てる"],
    earnest: ["…っ…まだ、立てる","…効いた…でも","…はぁ…負けない"],
    bold: ["…ふん…その程度","…まだ…足りない","…効くね…でも"],
    easygoing: ["…ん…効いた…けど平気","…あー…痛い。でもまだ","…大丈夫…まだいける"],
    quiet: ["……この程度で！","……まだ","……………"],
    shy: ["…っ…ま、まだ…","…い、痛い…けど…","…た、立てる…"],
    emotional: ["…っ…痛い…でも…","…っ…泣かない…","…まだ…立てる…っ"],
  }};

// 短い悲鳴（archetype別）
const DAMAGE_VOICE_LINES = {
  standard:   ["くっ…！","あっ…！","うぅっ…！","はぁっ…！"],
  polite:     ["きゃっ…！","あっ…！","うぅっ…！","ひっ…！"],
  seductive:  ["あぁんっ…！","んっ…！","くぅ…っ！","はぁ…っ！"],
  delinquent: ["ぐはっ…！","がっ…！","くそっ…！","うあっ…！"],
  ojousama:   ["きゃあっ…！","あっ…！","うぅっ…！","ああっ…！"],
  cool:       ["…っ！","……っ","…くっ","…っ…"],
  composed:   ["…っ","ふ…っ","…くっ","…はぁ…っ"]
};

// ダメージセリフをHP残量ベースで選ぶ
// HP 66%超: serif 40%
// HP 34〜66%: serif 15% / voice 50%
// HP 33%以下: voice 60%
function pickDamageLine(fighter, dmg, hpRatio, rng) {
  if (dmg < 15) return null; // クリティカルヒットのみ
  const r = rng ? rng() : Math.random();
  const personality = fighter.personality || 'normal';
  const archetype = fighter.archetype || 'standard';
  if (hpRatio > 0.66) {
    if (r < 0.4) return { type: 'serif', text: _pickSerif(personality, archetype) };
    return null;
  } else if (hpRatio > 0.34) {
    if (r < 0.15) return { type: 'serif', text: _pickSerif(personality, archetype) };
    if (r < 0.65) return { type: 'voice', text: _pickVoice(archetype) };
    return null;
  } else {
    if (r < 0.60) return { type: 'voice', text: _pickVoice(archetype) };
    return null;
  }
}
function _pickSerif(personality, archetype) {
  // 第一分岐はアーキタイプ(口調)。性格を先に引くと口調が揃ってしまう(2026-08-01 入れ替え)
  // フォールバックは4段: (a,p) → (a,normal) → (standard,p) → (standard,normal)
  const byA = DAMAGE_SERIF_LINES[archetype] || {};
  const byStd = DAMAGE_SERIF_LINES.standard || {};
  const lines = byA[personality] || byA.normal || byStd[personality] || byStd.normal || ["……くっ"];
  return lines[Math.floor(Math.random() * lines.length)];
}
function _pickVoice(archetype) {
  const lines = DAMAGE_VOICE_LINES[archetype] || DAMAGE_VOICE_LINES.standard;
  return lines[Math.floor(Math.random() * lines.length)];
}
