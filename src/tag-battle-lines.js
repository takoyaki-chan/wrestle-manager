// tag-battle セリフ類 — タッグ固有のみ
// DAMAGE_SERIF_LINES / DAMAGE_VOICE_LINES / pickDamageLine は battle-lines.js に共通化済み

// タッグ専用: ホットタグ時のカットイン [personality][archetype][3本]
const HOT_TAG_LINES = {
  normal: {
    standard: ["任せて！","交代だよ！","ここからは私が行く！"],
    polite: ["お任せくださいっ！","交代しますっ！","ここからは私が行きます！"],
    seductive: ["任せて…いいわよ","交代よ","ここからはわたしの番ね"],
    delinquent: ["任せときな！","交代だ！","ここからはあたしが行く！"],
    ojousama: ["お任せなさいませ！","交代いたしますわ！","ここからはわたくしが！"],
    cool: ["…任せて","…交代","…ここから、行く"],
    composed: ["…任せて、いいよ","…交代、だね","…ここからは私が行くよ"],
  },
  earnest: {
    standard: ["お疲れ様、あとは任せて！","よく守った、交代だ！","ここからは私が背負う！"],
    polite: ["お疲れ様です、任せてくださいっ！","よく耐えました、交代です！","ここからは私が引き継ぎます！"],
    seductive: ["お疲れさま…あとは任せて","よく耐えたわね…交代よ","ここからはわたしが背負うわ"],
    delinquent: ["お疲れさん、あとは任せろ！","よく守ったな、交代だ！","ここからはあたしが背負うぜ！"],
    ojousama: ["お疲れさまですわ、お任せを！","よく耐えましたわ、交代ですわ！","ここからはわたくしが引き継ぎますわ！"],
    cool: ["…お疲れ、任せて","…よく守った","…ここから、背負う"],
    composed: ["…お疲れさま、あとは任せて","…よく耐えたね、交代だよ","…ここからは私が背負うよ"],
  },
  bold: {
    standard: ["待ってました！","私の番だ！","ようやく回ってきたな！"],
    polite: ["待っていましたっ！","わたしの番ですっ！","ようやく回ってきましたね！"],
    seductive: ["待ちくたびれたわ","わたしの番よ","ようやく回ってきたわね"],
    delinquent: ["待ってたぜ！","あたしの番だ！","ようやく回ってきやがった！"],
    ojousama: ["お待ちかねですわ！","わたくしの番ですわ！","ようやく回ってまいりましたわ！"],
    cool: ["…待ってた","…あたしの番","…ようやく、だ"],
    composed: ["…待ってたよ","…私の番だね","…ようやく回ってきた、かな"],
  },
  easygoing: {
    standard: ["はーい、交代〜！","お疲れさま♪ 私いくね","ここからは私の出番♪"],
    polite: ["はーい、交代しますね〜！","お疲れさまです♪ いきますね","ここからはわたしの出番です♪"],
    seductive: ["はぁい、交代ね♪","お疲れさま…あとは任せて♪","ここからはわたしの時間よ♪"],
    delinquent: ["はいはい、交代な〜！","お疲れさん♪ あたしいくぜ","ここからはあたしの出番だ♪"],
    ojousama: ["はぁい、交代ですわ〜♪","お疲れさま♪ 参りますわ","ここからはわたくしの出番ですわ♪"],
    cool: ["…はい、交代","…お疲れ、いく","…私の出番"],
    composed: ["…はーい、交代〜","…お疲れさま、いくね","…ここからは私の番かな♪"],
  },
  quiet: {
    standard: ["…交代","…来た、私が","…任せて"],
    polite: ["…交代します","…来ました","…任せてください"],
    seductive: ["…交代、よ","…来たわ","…任せて、いい"],
    delinquent: ["…交代だ","…来たぜ","…任せときな"],
    ojousama: ["…交代ですわ","…参りましたわ","…お任せを"],
    cool: ["……交代","……代わる","……任せろ"],
    composed: ["…交代、だよ","…来たよ","…任せて、いい"],
  },
  shy: {
    standard: ["が、頑張ります…！","こ、交代…します…","い、行ってきます…！"],
    polite: ["が、頑張りますっ…！","こ、交代します…っ","い、行ってきますっ…！"],
    seductive: ["が、頑張る…から…","こ、交代…ね…?","い、行ってくる…わ…"],
    delinquent: ["が、頑張るし…！","こ、交代…だ…","い、行ってくる…ぜ…"],
    ojousama: ["が、頑張りますわ…！","こ、交代…ですわ…","い、行ってまいりますわ…！"],
    cool: ["…っ、交代","…こ、ここから","…い、行く"],
    composed: ["…が、頑張る、よ…","…こ、交代…だね…","…い、行ってくるね…"],
  },
  emotional: {
    standard: ["絶対…勝つ…！","お疲れ…ここからは私が…！","任せて…絶対に…！"],
    polite: ["絶対…勝ちますっ…！","お疲れさまっ…あとは私が…！","任せてくださいっ…絶対に…！"],
    seductive: ["絶対…勝つわ…！","お疲れさま…あとはわたしが…！","任せて…絶対に、よ…！"],
    delinquent: ["絶対勝つ…！","お疲れ…あとはあたしが…！","任せろ…絶対だ…！"],
    ojousama: ["絶対…勝ちますわ…！","お疲れさま…あとはわたくしが…！","お任せを…絶対に…！"],
    cool: ["…っ、絶対勝つ","…あとは、私が","…任せろ、絶対"],
    composed: ["…絶対に、勝つよ…！","…お疲れさま…あとは私が…","…任せて、絶対に…"],
  },
};

// タッグ専用: ダブルチーム時のカットイン [personality][archetype][3本]
const DOUBLE_TEAM_LINES = {
  normal: {
    standard: ["合わせて！","いくよ、二人で！","息を合わせよう！"],
    polite: ["合わせてくださいっ！","いきますよ、二人で！","息を合わせましょう！"],
    seductive: ["合わせて…いくわよ","二人で、いきましょ","息を合わせて…ね"],
    delinquent: ["合わせろ！","いくぞ、二人で！","息合わせな！"],
    ojousama: ["合わせてくださいまし！","二人で参りますわ！","息を合わせますわよ！"],
    cool: ["…合わせて","…いく、二人で","…息を、合わせろ"],
    composed: ["…合わせて、いくよ","…二人でいこうか","…息、合わせようね"],
  },
  earnest: {
    standard: ["一緒に…！","タイミング合わせて！","二人で決めよう！"],
    polite: ["一緒にいきますっ！","タイミング合わせてください！","二人で決めましょう！"],
    seductive: ["一緒に…いくわよ","タイミング、合わせて","二人で決めるわ"],
    delinquent: ["一緒にいくぞ！","タイミング合わせろ！","二人で決めるぜ！"],
    ojousama: ["ご一緒に参りますわ！","タイミングを合わせて！","二人で決めますわ！"],
    cool: ["…一緒に","…タイミング","…二人で、決める"],
    composed: ["…一緒にいくよ","…タイミング、合わせて","…二人で決めようね"],
  },
  bold: {
    standard: ["二人で決める！","合わせろ、いくぞ！","逃がさない、そっち頼む！"],
    polite: ["二人で決めますっ！","合わせてください、いきますよ！","逃がしません、そちら頼みますっ！"],
    seductive: ["二人で決めるわよ","合わせなさい","逃がさないわ、そっち任せた"],
    delinquent: ["二人で決めるぞ！","合わせろ、相棒！","逃がさねえ、そっち頼むぜ！"],
    ojousama: ["二人で決めますわよ！","お合わせなさい！","逃がしませんわ、そちらお任せを！"],
    cool: ["…二人で決める","…合わせろ","…逃がさない、頼む"],
    composed: ["…二人で決めるよ","…合わせて、いこうか","…逃がさない、そっち頼むね"],
  },
  easygoing: {
    standard: ["一緒にやろ〜！","合わせて合わせて♪","せーのっ♪"],
    polite: ["一緒にやりましょ〜！","合わせてくださいね♪","せーのっ、です♪"],
    seductive: ["一緒にいきましょ♪","合わせて…ね♪","せーの…よ♪"],
    delinquent: ["一緒にやろうぜ〜！","合わせろ合わせろ♪","せーのっ、だ！"],
    ojousama: ["ご一緒にですわ〜♪","お合わせあそばせ♪","せーの、ですわ♪"],
    cool: ["…一緒に","…合わせて","…せーの"],
    composed: ["…一緒にやろ〜","…合わせて、ね♪","…せーの、かな"],
  },
  quiet: {
    standard: ["…合わせる","…せーの","…いこう"],
    polite: ["…合わせます","…せーの、です","…いきましょう"],
    seductive: ["…合わせて、よ","…せーの…ね","…いくわ"],
    delinquent: ["…合わせろ","…せーの、だ","…いくぜ"],
    ojousama: ["…合わせますわ","…せーの、ですわ","…参りますわ"],
    cool: ["……合わせる","……せーの","……いく"],
    composed: ["…合わせるよ","…せーの、だね","…いこうか"],
  },
  shy: {
    standard: ["あ、合わせます…！","に、二人で…！","い、いっしょに…！"],
    polite: ["あ、合わせますっ…！","に、二人で…お願いします…！","い、いっしょにっ…！"],
    seductive: ["あ、合わせて…ね…?","ふ、二人で…いこ…","い、いっしょに…よ…"],
    delinquent: ["あ、合わせろし…！","ふ、二人で…だ…！","い、いっしょにやるぞ…"],
    ojousama: ["あ、合わせてくださいまし…！","ふ、二人で…ですわ…！","い、いっしょに参りますわ…！"],
    cool: ["…あ、合わせて","…ふ、二人で","…い、いっしょに"],
    composed: ["…あ、合わせるね…","…ふ、二人で、ね…","…い、いっしょに、いこ…"],
  },
  emotional: {
    standard: ["二人でっ…！","合わせるよ…っ！","絶対決めるっ…！"],
    polite: ["二人でっ…いきますっ！","合わせますっ…！","絶対決めますっ…！"],
    seductive: ["二人で…決めるわよっ…！","合わせて…っ！","絶対決めるわ…っ！"],
    delinquent: ["二人でっ…いくぞ！","合わせろっ…！","絶対決めるぜ…っ！"],
    ojousama: ["二人で…決めますわっ…！","合わせなさいっ…！","絶対決めますわ…っ！"],
    cool: ["…っ、二人で","…合わせろ","…絶対、決める"],
    composed: ["…二人で、決めるよ…！","…合わせて…っ","…絶対決める、から…"],
  },
};

// タッグ専用: カットイン救出時のセリフ [personality][archetype][3本]
const CUTIN_SAVE_LINES = {
  normal: {
    standard: ["させない！","まだだ！","渡さないよ！"],
    polite: ["させませんっ！","まだですっ！","渡しませんっ！"],
    seductive: ["させないわ","まだよ","渡さない…わ"],
    delinquent: ["させねえ！","まだだ！","渡さねえよ！"],
    ojousama: ["させませんわ！","まだですわ！","渡しませんわ！"],
    cool: ["…させない","…まだ","…渡さない"],
    composed: ["…させないよ","…まだだよ","…渡さない、から"],
  },
  earnest: {
    standard: ["そうはさせない！","まだ諦めてない！","絶対渡さない！"],
    polite: ["そうはさせませんっ！","まだ諦めていませんっ！","絶対渡しませんっ！"],
    seductive: ["そうはさせないわ","まだ諦めてないの","絶対渡さないわ"],
    delinquent: ["そうはさせねえ！","まだ諦めてねえ！","絶対渡さねえ！"],
    ojousama: ["そうはさせませんわ！","まだ諦めておりませんわ！","絶対渡しませんわ！"],
    cool: ["…させない","…諦めてない","…絶対、渡さない"],
    composed: ["…そうはさせないよ","…まだ諦めてないよ","…絶対、渡さないから"],
  },
  bold: {
    standard: ["そうはさせるか！","まだまだ！","そうはいかない！"],
    polite: ["そうはさせませんよ！","まだまだですっ！","そうはいきませんっ！"],
    seductive: ["そうはさせないわよ","まだまだよ","そうはいかないわ"],
    delinquent: ["そうはさせるかよ！","まだまだだ！","そうはいかねえ！"],
    ojousama: ["そうはさせませんわよ！","まだまだですわ！","そうはいきませんわ！"],
    cool: ["…させるか","…まだまだ","…そうはいかない"],
    composed: ["…させないよ、そう簡単には","…まだまだ、だよ","…そうはいかないかな"],
  },
  easygoing: {
    standard: ["させないよ〜！","まだまだ〜！","はい、カット！"],
    polite: ["させませんよ〜！","まだまだですよ〜！","はい、カットです！"],
    seductive: ["させないわよ〜♪","まだまだ…よ♪","はぁい、カット♪"],
    delinquent: ["させねえよ〜！","まだまだだ〜！","ほい、カットだ！"],
    ojousama: ["させませんわよ〜♪","まだまだですわ〜！","はぁい、カットですわ♪"],
    cool: ["…させない","…まだまだ","…カット"],
    composed: ["…させないよ〜","…まだまだ、かな","…はい、カット"],
  },
  quiet: {
    standard: ["…させない","…まだ","…駄目"],
    polite: ["…させません","…まだです","…駄目です"],
    seductive: ["…させないわ","…まだ、よ","…駄目よ"],
    delinquent: ["…させねえ","…まだだ","…駄目だ"],
    ojousama: ["…させませんわ","…まだですわ","…なりませんわ"],
    cool: ["……させない","……まだ","……駄目"],
    composed: ["…させないよ","…まだ、だよ","…駄目だよ"],
  },
  shy: {
    standard: ["さ、させない…！","ま、まだ…です…！","だ、ダメ…！"],
    polite: ["さ、させませんっ…！","ま、まだですっ…！","だ、ダメですっ…！"],
    seductive: ["さ、させない…わ…!","ま、まだ…よ…!","だ、ダメ…なの…!"],
    delinquent: ["さ、させねえ…！","ま、まだだ…！","だ、ダメだ…！"],
    ojousama: ["さ、させませんわ…！","ま、まだですわ…！","だ、ダメですわ…！"],
    cool: ["…さ、させない","…ま、まだ","…だ、ダメ"],
    composed: ["…さ、させないよ…","…ま、まだ、だよ…","…だ、ダメ、だよ…"],
  },
  emotional: {
    standard: ["絶対させないっ…！","まだっ…！","そんなの…駄目っ…！"],
    polite: ["絶対させませんっ…！","まだですっ…！","そんなの駄目ですっ…！"],
    seductive: ["絶対させないわっ…！","まだよっ…！","そんなの…許さないわっ…！"],
    delinquent: ["絶対させねえっ…！","まだだっ…！","そんなの…させるかっ…！"],
    ojousama: ["絶対させませんわっ…！","まだですわっ…！","そんなの…許しませんわっ…！"],
    cool: ["…っ、させない","…まだ","…駄目だ、絶対"],
    composed: ["…絶対、させないよ…！","…まだ、だよ…！","…そんなの、駄目だから…"],
  },
};

// タッグ専用: 見殺し時のセリフ（動かないパートナー側） [personality][archetype][3本]
const BETRAYAL_LINES = {
  normal: {
    standard: ["……動けない","……間に合わない","……"],
    polite: ["……動けません","……間に合いません","……ごめんなさい"],
    seductive: ["……動けないわ","……間に合わない…わ","……ごめんね"],
    delinquent: ["……動けねえ","……間に合わねえ","……くそっ"],
    ojousama: ["……動けませんわ","……間に合いませんわ","……申し訳、ございませんわ"],
    cool: ["……","……動けない","……届かない"],
    composed: ["……動けないよ","……間に合わない、か","……ごめん"],
  },
  earnest: {
    standard: ["間に合わない…！","動けない…！","……守れなかった"],
    polite: ["間に合いません…！","動けません…！","……守れませんでした"],
    seductive: ["間に合わない…わ","動けない…の","……守れなかった、わね"],
    delinquent: ["間に合わねえ…！","動けねえ…！","……守れなかった"],
    ojousama: ["間に合いませんわ…！","動けませんの…！","……守れませんでしたわ"],
    cool: ["…間に合わない","…動けない","……守れなかった"],
    composed: ["…間に合わないか…","…動けないよ…","……守れなかった、な"],
  },
  bold: {
    standard: ["くっ…！","ちっ…間に合わない","届かなかった…"],
    polite: ["くっ…！","くぅっ…間に合いません","届きませんでした…"],
    seductive: ["くっ…！","ちっ…間に合わないわ","届かなかった…わね"],
    delinquent: ["くそっ…！","ちっ…間に合わねえ","届かなかった…"],
    ojousama: ["くっ…！","…っ、間に合いませんわ","届きませんでしたわ…"],
    cool: ["…くっ","…間に合わない","…届かなかった"],
    composed: ["…くっ、間に合わないか","…届かないな","届かなかった…よ"],
  },
  easygoing: {
    standard: ["ありゃ…動けない…","うぅ…遠い…","……"],
    polite: ["あちゃ…動けません…","うぅ…遠いです…","……ごめんなさい"],
    seductive: ["あら…動けないわ…","うぅ…遠い…わ","……ごめんね"],
    delinquent: ["あちゃ…動けねえ…","うぅ…遠えな…","……わりぃ"],
    ojousama: ["あらあら…動けませんわ…","うぅ…遠いですわ…","……ごめんあそばせ"],
    cool: ["…あ、動けない","…遠い","……"],
    composed: ["…ありゃ、動けないや","…うぅ、遠いなあ","……ごめんね"],
  },
  quiet: {
    standard: ["……動けない","……間に合わない","……"],
    polite: ["……動けません","……届きません","……ごめんなさい"],
    seductive: ["……動けない、わ","……届かない","……ごめん"],
    delinquent: ["……動けねえ","……届かねえ","……くそ"],
    ojousama: ["……動けませんわ","……届きませんわ","……申し訳ありません"],
    cool: ["…………動けない","…………届かない","…………"],
    composed: ["……動けないよ","……届かないか","……ごめん"],
  },
  shy: {
    standard: ["う、動けない…","間に合わない…！","…ごめん…"],
    polite: ["う、動けません…","間に合いません…！","…ごめんなさい…"],
    seductive: ["う、動けない…の…","間に合わない…っ","…ごめんね…"],
    delinquent: ["う、動けねえ…","間に合わねえ…！","…わりぃ…"],
    ojousama: ["う、動けませんわ…","間に合いませんの…！","…ごめんなさい…"],
    cool: ["…う、動けない","…間に合わない","…ごめん"],
    composed: ["…う、動けないよ…","…間に合わない、か…","…ごめんね…"],
  },
  emotional: {
    standard: ["嘘…動けないっ","間に合わないっ…！","ごめん…ごめんっ…！"],
    polite: ["嘘…動けませんっ","間に合いませんっ…！","ごめんなさいっ…ごめんっ…！"],
    seductive: ["嘘…動けないっ…！","間に合わないっ…！","ごめん…ごめんねっ…！"],
    delinquent: ["嘘だろ…動けねえっ","間に合わねえっ…！","わりぃ…わりぃっ…！"],
    ojousama: ["嘘…動けませんわっ","間に合いませんわっ…！","ごめんなさいっ…！"],
    cool: ["…っ、動けない","…間に合わない","…ごめん、っ"],
    composed: ["…嘘、動けないよ…っ","…間に合わない…っ","…ごめん、ごめんね…"],
  },
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

// T2: 試合完了時の勝利者セリフ (パートナー言及必須、{partner} プレースホルダ)。[personality][archetype][2本]
const TAG_MATCH_WIN_LINES = {
  normal: {
    standard: [
      "{partner}、ありがとう。二人だから勝てたよ。",
      "やった…{partner}となら勝てるって、信じてた！",
    ],
    polite: [
      "{partner}さん、ありがとうございました。二人で掴んだ勝ちです。",
      "{partner}さんを信じてよかったです…ちゃんと、勝てました！",
    ],
    seductive: [
      "{partner}…ありがとう。二人でつかんだ勝ち、悪くないでしょ？",
      "ふふ、{partner}となら負ける気がしないわ。",
    ],
    delinquent: [
      "{partner}、ありがとな！ 二人だから勝てたんだ！",
      "やったぜ{partner}！ あたしら、いいコンビだろ？",
    ],
    ojousama: [
      "{partner}さん、ありがとうございますわ。二人で掴んだ勝利ですのね。",
      "{partner}さんを信じておりまして、本当によかったですわ。",
    ],
    cool: [
      "…{partner}、ありがとう。二人で、勝った。",
      "…{partner}となら、勝てる。",
    ],
    composed: [
      "…{partner}、ありがとう。二人だから、勝てたね。",
      "…{partner}となら勝てる気がしてた。…当たったよ。",
    ],
  },
  earnest: {
    standard: [
      "{partner}、あなたを信じてよかった。この勝ち、二人のものだよ。",
      "{partner}が繋いでくれたから…最後まで諦めずに済んだ。",
    ],
    polite: [
      "{partner}さんのおかげです。本当に、ありがとうございました。",
      "{partner}さんが繋いでくれたバトン…無駄にせずに済みました。",
    ],
    seductive: [
      "{partner}…あなたを信じてよかった。この勝ちは二人のものよ。",
      "{partner}、あなたが繋いでくれたから…最後まで折れずにいられたの。",
    ],
    delinquent: [
      "{partner}、お前を信じてよかった。この勝ちは二人のもんだ。",
      "{partner}が繋いでくれたから…あたし、最後まで踏ん張れた。",
    ],
    ojousama: [
      "{partner}さんを信じておりまして、本当によかったですわ。",
      "{partner}さんが繋いでくださったからこそ、掴めた勝利ですの。",
    ],
    cool: [
      "…{partner}。信じて、よかった。この勝ちは、二人の。",
      "…{partner}が繋いだ。だから、勝てた。",
    ],
    composed: [
      "…{partner}、信じてよかったよ。この勝ちは、二人のものだね。",
      "…{partner}が繋いでくれたから、最後まで立てた。ありがとう。",
    ],
  },
  bold: {
    standard: [
      "やったな{partner}！ 二人揃えば、負ける気がしないよ！",
      "見たか、これが{partner}と私のタッグの力だ！",
    ],
    polite: [
      "やりましたね{partner}さん！ 二人揃えば負けません！",
      "見ましたか、これが{partner}さんと私のタッグです！",
    ],
    seductive: [
      "やったわね{partner}。二人揃えば、負ける気なんてしないわ。",
      "見た？ これが{partner}とわたしのタッグよ。",
    ],
    delinquent: [
      "やったな{partner}！ あたしらが組みゃ、負ける気がしねえ！",
      "見たかよ！ {partner}とあたしのタッグ、最強だぜ！",
    ],
    ojousama: [
      "おやりになりましたわね{partner}さん！ 二人揃えば負けませんわ！",
      "ご覧になって？ {partner}さんとわたくしのタッグですのよ！",
    ],
    cool: [
      "…やったな、{partner}。二人なら、負けない。",
      "…見たか。{partner}と、あたしのタッグだ。",
    ],
    composed: [
      "…やったね、{partner}。二人なら、負ける気がしないよ。",
      "…見た？ {partner}と組めば、こんなもんさ。",
    ],
  },
  easygoing: {
    standard: [
      "{partner}〜お疲れさま！ 私たち、息ぴったりだったね〜",
      "勝っちゃった。{partner}と組むの、やっぱ楽しい〜",
    ],
    polite: [
      "{partner}さん、お疲れさまです♪ 息ぴったりでしたね〜",
      "勝っちゃいました♪ {partner}さんと組めて、楽しかったです〜",
    ],
    seductive: [
      "{partner}〜お疲れさま♪ 息ぴったりだったでしょ？",
      "勝っちゃった♪ やっぱり{partner}と組むと、楽しいわ〜",
    ],
    delinquent: [
      "{partner}〜お疲れさん！ あたしら息ぴったりだったろ？",
      "勝っちゃったぜ♪ {partner}と組むの、やっぱ楽しいわ〜",
    ],
    ojousama: [
      "{partner}さん、お疲れさまですわ♪ 息ぴったりでしたわね〜",
      "勝ってしまいましたわ♪ {partner}さんと組むの、楽しいですの〜",
    ],
    cool: [
      "…{partner}、お疲れ。息、ぴったりだった。",
      "…勝った。{partner}と組むの、好き。",
    ],
    composed: [
      "…{partner}、お疲れさま。息、ぴったりだったね〜",
      "…勝っちゃった。{partner}と組むの、やっぱいいな〜",
    ],
  },
  quiet: {
    standard: [
      "…{partner}、ありがとう。",
      "…{partner}と、だから勝てた。",
    ],
    polite: [
      "…{partner}さん、ありがとうございました。",
      "…{partner}さんと、だから勝てました。",
    ],
    seductive: [
      "…{partner}、ありがとう。",
      "…{partner}と、だから…ね。",
    ],
    delinquent: [
      "…{partner}、恩に着る。",
      "…{partner}と、だから勝てた。",
    ],
    ojousama: [
      "…{partner}さん、感謝いたしますわ。",
      "…{partner}さんと、だからですの。",
    ],
    cool: [
      "……{partner}、ありがとう。",
      "……{partner}と、だから。",
    ],
    composed: [
      "…{partner}、ありがとう。二人だから、だね。",
      "…{partner}と、だから勝てた。それだけだよ。",
    ],
  },
  shy: {
    standard: [
      "{partner}…ほ、本当に…ありがとう…！",
      "わ、私…頑張れた…{partner}のおかげ…！",
    ],
    polite: [
      "{partner}さん…ほ、本当に…ありがとうございました…！",
      "わ、私…頑張れました…{partner}さんのおかげです…！",
    ],
    seductive: [
      "{partner}…う、嬉しい…二人で、勝てて…わ…",
      "{partner}となら…だ、大丈夫って…信じてた、の…",
    ],
    delinquent: [
      "{partner}…あ、ありがとな…！ あたし、頑張れた…！",
      "ぜ、全部…{partner}のおかげ、だ…！",
    ],
    ojousama: [
      "{partner}さん…あ、ありがとうございますわ…！",
      "わ、私…頑張れましたわ…{partner}さんのおかげで…！",
    ],
    cool: [
      "…っ、{partner}…ありがとう…",
      "…わ、私、頑張れた…{partner}と…",
    ],
    composed: [
      "…{partner}、あ、ありがとう…二人で、勝てたね…",
      "…わ、私、頑張れたよ…{partner}のおかげ…",
    ],
  },
  emotional: {
    standard: [
      "{partner}っ…！ ありがとう…二人で、勝ったよ…！",
      "絶対勝つって、約束したもんね…{partner}…っ！",
    ],
    polite: [
      "{partner}さんっ…！ ありがとうございます…二人で、勝てました…！",
      "絶対勝つって約束…守れましたね、{partner}さん…っ！",
    ],
    seductive: [
      "{partner}っ…！ やったわ…二人で、勝ったのよ…！",
      "約束…守れたわね、{partner}…っ！",
    ],
    delinquent: [
      "{partner}っ…！ やったぜ…二人で、勝ったんだ…！",
      "絶対勝つって言ったろ…！ な、{partner}…っ！",
    ],
    ojousama: [
      "{partner}さんっ…！ やりましたわ…二人で、勝ったのですわ…！",
      "約束、守れましたわね…{partner}さん…っ！",
    ],
    cool: [
      "…っ、{partner}…勝った。二人で。",
      "…約束、守った。{partner}…っ。",
    ],
    composed: [
      "…{partner}。二人で、勝ったよ。…約束、守れたね。",
      "…言葉はいらない。{partner}、ありがとう。…それだけだ。",
    ],
  },
};

// T2: 敗北者セリフ (パートナーへの詫び/責任/次への意欲)。[personality][archetype][2本]
const TAG_MATCH_LOSS_LINES = {
  normal: {
    standard: [
      "{partner}…ごめん。私が決めきれてたら…",
      "{partner}、悔しいね。次は絶対、勝とう。",
    ],
    polite: [
      "{partner}さん…ごめんなさい。私が決めきれていれば…",
      "{partner}さん、次は必ず勝ちましょう。",
    ],
    seductive: [
      "{partner}…ごめんなさい。わたしが決めきれてたら…",
      "悔しいわね、{partner}。次は絶対、勝つわよ。",
    ],
    delinquent: [
      "{partner}…悪い。あたしが決めてりゃな…",
      "{partner}、悔しいな。次は絶対、勝とうぜ。",
    ],
    ojousama: [
      "{partner}さん…ごめんなさいまし。わたくしが決めきれていれば…",
      "{partner}さん、次こそは必ず勝ちましょうね。",
    ],
    cool: [
      "…{partner}、ごめん。決めきれ、なかった。",
      "…{partner}、次は。勝つ。",
    ],
    composed: [
      "…{partner}、ごめん。決めきれなかったね。",
      "…悔しいけど、{partner}。次までに、詰めようか。",
    ],
  },
  earnest: {
    standard: [
      "{partner}…私の力不足だ。あなたを勝たせてあげられなかった…",
      "ここまで繋いでくれたのに…{partner}、ごめん。",
    ],
    polite: [
      "{partner}さん、申し訳ありませんでした…私の力不足です。",
      "{partner}さんを勝たせてあげられなくて…本当にすみません…！",
    ],
    seductive: [
      "{partner}…わたしの力不足よ。あなたを勝たせられなかった…",
      "ここまで繋いでくれたのに…ごめんなさい、{partner}。",
    ],
    delinquent: [
      "{partner}…あたしの力不足だ。お前を勝たせてやれなかった…",
      "ここまで繋いでくれたのに…悪い、{partner}。",
    ],
    ojousama: [
      "{partner}さん、申し訳ございませんでした…わたくしの力不足ですわ。",
      "{partner}さんを勝たせてさしあげられず…本当にごめんなさい…！",
    ],
    cool: [
      "…{partner}、ごめん。あたしの、力不足。",
      "…繋いでくれたのに。{partner}、すまない。",
    ],
    composed: [
      "…{partner}、ごめん。あたしの力不足だ。",
      "…ここまで繋いでくれたのにな。{partner}、すまない。",
    ],
  },
  bold: {
    standard: [
      "くそっ…{partner}、悪い。私のミスだ。次は絶対だ。",
      "負けたままでいられるか…{partner}、次は倍返しだ！",
    ],
    polite: [
      "{partner}さん、私のミスです。ですが…次は絶対に返します。",
      "このままでは終われません。{partner}さん、次は倍返しです！",
    ],
    seductive: [
      "わたしのミスよ、{partner}…悪いわね。でも次は絶対、返すわ。",
      "このままじゃ終わらせない。{partner}、次は倍返しよ。",
    ],
    delinquent: [
      "くそっ…あたしのミスだ、{partner}。次は絶対、返してやる。",
      "このまま終われるかよ…{partner}、次は倍返しだ！",
    ],
    ojousama: [
      "わたくしのミスですわ、{partner}さん。ですが次は必ず返しますの。",
      "このままでは終われませんわ。{partner}さん、次は倍返しですわ！",
    ],
    cool: [
      "…あたしのミスだ、{partner}。次は、返す。",
      "…このまま終わらない。{partner}、倍返しだ。",
    ],
    composed: [
      "…あたしのミスだ、{partner}。でも、次はこうはいかないよ。",
      "…このまま終わる気はない。{partner}、次は返すから。",
    ],
  },
  easygoing: {
    standard: [
      "{partner}〜ごめんね…私、決められちゃった…",
      "あちゃ〜負けちゃった…でも{partner}、次は頑張るね。",
    ],
    polite: [
      "{partner}さん…ごめんなさい、私、決められちゃいました…",
      "あちゃ〜負けちゃいましたね…次は頑張ります、{partner}さん。",
    ],
    seductive: [
      "{partner}〜ごめんね…わたし、決められちゃった…",
      "あーあ、負けちゃった…でも{partner}、次はやるわよ。",
    ],
    delinquent: [
      "{partner}〜わりぃ…あたし、決められちった…",
      "あちゃ〜負けたか…でも{partner}、次は頑張るぜ。",
    ],
    ojousama: [
      "{partner}さん…ごめんなさい、決められてしまいましたわ…",
      "あらら、負けてしまいましたわ…でも次は頑張りますの、{partner}さん。",
    ],
    cool: [
      "…{partner}、ごめん。決められ、ちゃった。",
      "…負けちゃった。{partner}、次は。",
    ],
    composed: [
      "…{partner}、ごめんね。決められちゃった…",
      "…あ〜あ、負けちゃった。まあ、次があるよ、{partner}。",
    ],
  },
  quiet: {
    standard: [
      "…{partner}、ごめん。",
      "…悔しい。{partner}にも、申し訳ない。",
    ],
    polite: [
      "…{partner}さん、ごめんなさい。",
      "…申し訳、ありませんでした。{partner}さん。",
    ],
    seductive: [
      "…{partner}、ごめんなさい。",
      "…悔しい。{partner}にも…ね。",
    ],
    delinquent: [
      "…{partner}、悪い。",
      "…悔しい。{partner}にも、詫びる。",
    ],
    ojousama: [
      "…{partner}さん、ごめんなさい。",
      "…申し訳ありませんわ。{partner}さん。",
    ],
    cool: [
      "……{partner}、ごめん。",
      "……悔しい。{partner}にも。",
    ],
    composed: [
      "…{partner}、ごめん。",
      "…悔しいな。{partner}にも、悪い。",
    ],
  },
  shy: {
    standard: [
      "{partner}…ご、ごめん…私のせいで…",
      "つ、次は…絶対、{partner}を勝たせる…！",
    ],
    polite: [
      "{partner}さん…ご、ごめんなさい…私のせいで…",
      "つ、次は…絶対…{partner}さんを勝たせます…！",
    ],
    seductive: [
      "{partner}…ご、ごめんね…わたしのせいで…",
      "つ、次は…絶対…{partner}を、勝たせるわ…！",
    ],
    delinquent: [
      "{partner}…わ、悪い…あたしのせいで…",
      "つ、次は…絶対…{partner}を勝たせる…！",
    ],
    ojousama: [
      "{partner}さん…ご、ごめんなさいまし…わたくしのせいで…",
      "つ、次は…必ず…{partner}さんを勝たせますわ…！",
    ],
    cool: [
      "…っ、{partner}…ごめん…私の、せいで…",
      "…つ、次は…{partner}を、勝たせる…",
    ],
    composed: [
      "…{partner}、ご、ごめん…私のせいで…",
      "…つ、次は、ちゃんと…{partner}を勝たせるよ…",
    ],
  },
  emotional: {
    standard: [
      "{partner}っ…ごめんっ…ごめんねっ…！",
      "次は絶対…絶対勝つからっ…！ {partner}…！",
    ],
    polite: [
      "{partner}さんっ…ごめんなさいっ…私のせいでっ…！",
      "次は絶対…勝ちますからっ…！ {partner}さん…！",
    ],
    seductive: [
      "{partner}っ…ごめんっ…わたしのせいでっ…！",
      "次は絶対、勝つわっ…！ {partner}…！",
    ],
    delinquent: [
      "{partner}っ…わりぃっ…あたしのせいでっ…！",
      "次は絶対、勝つからっ…！ な、{partner}…！",
    ],
    ojousama: [
      "{partner}さんっ…ごめんなさいっ…わたくしのせいでっ…！",
      "次は絶対、勝ちますわっ…！ {partner}さん…！",
    ],
    cool: [
      "…っ、{partner}…ごめん。",
      "…次は、勝つ。絶対。{partner}…っ。",
    ],
    composed: [
      "…{partner}、悪い。あたしが弱かった。…それだけだ。",
      "…次は、こうはいかない。{partner}、もう一回だけ付き合ってくれ。",
    ],
  },
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
// [personality][archetype] 二軸テーブルからフォールバック連鎖で配列を取り出す。
// _getCutinLines (battle-engine-main.js) と同じ流儀: (T[personality]||T.normal) → (byP[archetype]||byP.standard)
// 性格の既定は 'normal'、アーキタイプの既定は 'standard'(旧 'normal')。同名の別物なので注意。
function _tagLineArrFor(table, fighter) {
  const p = (fighter && fighter.personality) || 'normal';
  const a = (fighter && fighter.archetype) || 'standard';
  const byP = table[p] || table.normal;
  return byP[a] || byP.standard;
}
function pickTagWinLine(fighter, partnerName) {
  const arr = _tagLineArrFor(TAG_MATCH_WIN_LINES, fighter);
  const line = arr[Math.floor(Math.random() * arr.length)];
  return _tplTagLine(line, { partner: partnerName || 'パートナー' });
}
function pickTagLossLine(fighter, partnerName) {
  const arr = _tagLineArrFor(TAG_MATCH_LOSS_LINES, fighter);
  const line = arr[Math.floor(Math.random() * arr.length)];
  return _tplTagLine(line, { partner: partnerName || 'パートナー' });
}
function pickTagWinCommentary(winnerName, partnerName, moveName) {
  const arr = TAG_MATCH_COMMENTARY_WIN_LINES;
  const line = arr[Math.floor(Math.random() * arr.length)];
  return _tplTagLine(line, { winner: winnerName || '勝者', partner: partnerName || 'パートナー', move: moveName || '決め技' });
}

function pickHotTagLine(fighter) {
  const lines = _tagLineArrFor(HOT_TAG_LINES, fighter);
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
function pickCutinSaveLine(fighter) {
  const lines = _tagLineArrFor(CUTIN_SAVE_LINES, fighter);
  return lines[Math.floor(Math.random() * lines.length)];
}
function pickBetrayalLine(fighter) {
  const lines = _tagLineArrFor(BETRAYAL_LINES, fighter);
  return lines[Math.floor(Math.random() * lines.length)];
}
