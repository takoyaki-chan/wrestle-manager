// ╔══════════════════════════════════════════════════════════╗
// ║  FACTION DIALOGUE — F01/F02/F03 セリフ叩き台           ║
// ║  spec §11 準拠。性格×アーキタイプ、normalフォールバック  ║
// ╚══════════════════════════════════════════════════════════╝
//
// 形式: { [personality]: { [archetype]: [ lines... ] } }
// 欠けたアーキタイプは normal にフォールバック（Engine.factions.getFactionLine）
// 性格 6種: normal / bold / quiet / easygoing / earnest / emotional
// アーキタイプ: normal / ojousama / delinquent / cool / seductive / polite
// Phase 3a 叩き台: 核4アーキタイプ（normal / ojousama / delinquent / cool）+ normalフォールバック

// ─────────────────────────────────────────────────────────────
// F05: 派閥内不満分子（ringleader）のセリフ（陰口・リーダーへの不満）
// ─────────────────────────────────────────────────────────────
const FACTION_F05_DISSIDENT_LINES = {
  standard: {
    bold: [
      "あの人のやり方、もう付き合いきれないわ。",
      "こっちの声なんて、届いてないんだよ。上は。",
    ],
    earnest: [
      "みんなで一つのはずだったのに……こんなの、違う。",
      "本当に変わってほしい。だから、声を上げなきゃ。",
    ],
    quiet: [
      "……もう、ついていけない。",
      "……息が、できない。",
    ],
    easygoing: [
      "まー、なんていうか、ちょっと合わないんだよね、もう。",
    ],
    emotional: [
      "私、あの人のこと信じてたのに……ひどい！",
      "もう、無理だよ……泣きたい……！",
    ],
    bold_delinquent: [],
    normal: [
      "今のままじゃ、立ち行かない。誰かが、声を上げないと。",
      "上の人には、もう期待できない。",
    ],
  },
  delinquent: {
    bold: [
      "舐めてんじゃねーぞって話だよ。毎回毎回、同じパターンで。",
    ],
    normal: [
      "黙ってたけど、もう限界だっつーの。",
    ],
  },
  cool: {
    bold: [
      "別に文句はない。ただ、道が違うだけ。",
    ],
    quiet: [
      "……静かに、離れたい。",
    ],
  },
  polite: {
    earnest: [
      "申し上げにくいのですが……今のままでは、私たち、息が詰まります。",
    ],
    normal: [
      "失礼ながら、意見を申し上げさせてください。",
    ],
  },
  ojousama: {
    emotional: [
      "わたくし、もう耐えかねますの。このままでは、心が削れてしまいますわ。",
    ],
    normal: [
      "率直に申し上げます。このままでは、わたくしたちは朽ちますわ。",
    ],
  },
  seductive: {
    emotional: [
      "冷めちゃったのよ、すっかりね……。",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// F06: 和解の兆し — 両派閥メンバーの何気ない雑談（1人分のセリフで十分）
// ─────────────────────────────────────────────────────────────
const FACTION_F06_AMBIENT_LINES = {
  standard: {
    bold: [
      "あんた、意外と悪くないじゃん。ちょっと見直したわ。",
      "まあ、あの日のことは、忘れてやるよ。",
    ],
    earnest: [
      "ずっと、こうして話せたらって思ってたんです。",
      "あの頃のこと、お互いに少しずつ……手放せたらいいですね。",
    ],
    quiet: [
      "……意外と、普通に、話せるね。",
    ],
    easygoing: [
      "あはは、もう何で揉めてたんだっけ、私たち。",
    ],
    emotional: [
      "ずっと、気まずかったの……嬉しい……！",
    ],
    normal: [
      "……気づけば、睨み合う理由がどこかに消えてたね。",
      "まあ、お互い、大人になったってことかな。",
    ],
  },
  delinquent: {
    bold: [
      "……ったく、気まずいっての。",
    ],
  },
  polite: {
    earnest: [
      "きっかけがあれば、と思っておりました。今日がその日かもしれません。",
    ],
  },
  cool: {
    quiet: [
      "……まあ、別にいいよ。",
    ],
  },
  ojousama: {
    easygoing: [
      "あら、そんな昔のこと、もう忘れていますわよ。",
    ],
    emotional: [
      "わたくし、あの頃のわだかまりは、もう水に流そうかと存じますの。",
    ],
  },
  seductive: {
    emotional: [
      "ふふ、仲直り……いいものね。",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// F08: 対立ヒートアップ — 両リーダー対峙のセリフ（A側/B側 共用）
// ─────────────────────────────────────────────────────────────
const FACTION_F08_LEADER_LINES = {
  standard: {
    bold: [
      "もう言葉はいらない。リングで片をつけるだけだ。",
      "私が勝つ。それだけの話。",
    ],
    earnest: [
      "これ以上は、話し合いでは済まない。わかってるはず。",
    ],
    quiet: [
      "……もう、逃げない。",
    ],
    easygoing: [
      "はぁ〜あ、こうなると、もうやるしかないよね。",
    ],
    emotional: [
      "もう、我慢できない！　あの子とは、決着をつける！",
    ],
    normal: [
      "話はもう済んだ。後は、リングで示すだけ。",
      "引き下がる理由は、もう、どこにもない。",
    ],
  },
  delinquent: {
    bold: [
      "上等じゃねーか。来いよ、いつでも。",
    ],
  },
  cool: {
    bold: [
      "決着をつける。それ以外の選択肢はない。",
    ],
    quiet: [
      "……リングで、会う。",
    ],
  },
  polite: {
    earnest: [
      "言葉ではもう届きません。リングで、決着をつけましょう。",
    ],
  },
  ojousama: {
    earnest: [
      "ここまで来て、退く理由がございませんわ。",
    ],
    emotional: [
      "あの御方とわたくし、このまま並び立つことはできませんの。",
    ],
  },
  seductive: {
    emotional: [
      "……リングでなら、本音で話せるでしょ？",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Phase 3e: F08-A 直接対決 試合前後演出
// 4テーブル × hostility帯 / HP帯分岐
// 6性格 × 6アーキタイプ、normal フォールバック、cool/delinquent/ojousama は核
// ─────────────────────────────────────────────────────────────

// ── 試合前 リーダー A 側（宣戦） ──
const FACTION_F08_PRE_MATCH_LINES_A = {
  standard: {
    bold: {
      high: [
        "アンタんとこの組、今夜で終わりよ。覚悟しなさい",
        "背中にいる子たちのためにも、今日は退かない",
        "アンタ一人潰せば、組ごと崩れる――遠慮はしないわよ",
      ],
      mid: [
        "今日は決着つけにきた。話はリングの上で",
        "これ以上、あんたんとこに好き勝手はさせない",
      ],
      low: [
        "……来なよ。最後まで付き合ってやる",
      ],
    },
    earnest: {
      high: [
        "あなたたちのやり方は……許せない。今日で決着をつける",
        "私、あなたを倒さないと、後ろのみんなに顔向けできない",
        "うしろにいる子たちのために、今日は逃げない",
      ],
      mid: [
        "今日は、絶対に引きません",
        "あなたの組の流儀には、もう従えない",
      ],
      low: [
        "リングの上で、答えを出しましょう",
      ],
    },
    quiet: {
      high: [
        "……話すことは、もうない",
        "……行こう。リングが、待ってる",
        "……うちの組のこと、悪く言う声は、ぜんぶ今日で消す",
      ],
      mid: [
        "……来なよ",
      ],
      low: [
        "……うん。受けて立つ",
      ],
    },
    easygoing: {
      high: [
        "んー、こうなっちゃったら、もう仕方ないよね。やろっか",
        "私も嫌なんだけど、組のみんなが黙ってないから",
      ],
      mid: [
        "ま、リングで決めようよ。それが一番すっきりする",
      ],
      low: [
        "やれやれ……一回、ぶつかっとくか",
      ],
    },
    emotional: {
      high: [
        "もう、我慢できない！　あなたの組、今夜で終わりにする！",
        "うちのみんなが泣いた分、ぜんぶ返してもらうから",
      ],
      mid: [
        "今日の私、止めても無駄だよ",
      ],
      low: [
        "もう、泣いてる暇なんか、ない",
      ],
    },
    normal: {
      high: [
        "今日のリングは、あなたと私のためにある",
        "言葉ではもう、何も伝わらない。だからリングで",
      ],
      mid: [
        "今日で、片付ける",
      ],
      low: [
        "リングで、会いましょう",
      ],
    },
  },
  delinquent: {
    bold: {
      high: [
        "今夜、あんたの組は終わる。しっかり見とけよ",
        "ヘラヘラしてられんのも今のうちだぜ",
        "舐めた口きいてた連中、ぜんぶ纏めて私が叩く",
      ],
      mid: [
        "黙って来な。話すことなんかねえだろ",
      ],
    },
  },
  cool: {
    bold: {
      high: [
        "リングに上がれば、あとは結果がすべてだ",
        "あんたの組の名前、今夜から軽くなる",
      ],
    },
    quiet: {
      high: [
        "……話すことは、もうない",
        "……決着、つけよう",
      ],
    },
  },
  polite: {
    earnest: {
      high: [
        "今日という日のために、私、ここまで来たんです",
        "御免なさい。今日は手加減できません",
      ],
    },
  },
  ojousama: {
    emotional: {
      high: [
        "ええ、わたくしも引きませんわ。これは戦争です",
        "あなたの組の方々が、わたくしの妹分にしたこと――今夜、お返ししますわ",
      ],
      mid: [
        "わたくし、本気でいきますわよ",
      ],
    },
  },
};

// ── 試合前 リーダー B 側（応戦） ──
const FACTION_F08_PRE_MATCH_LINES_B = {
  standard: {
    bold: {
      high: [
        "面白いじゃない。やってもらおうじゃないの",
        "受けて立つわ。こっちの組も、舐められっぱなしじゃ終われない",
        "そっちが来るなら、こっちも全力で潰しにいく",
      ],
      mid: [
        "いいわよ。かかってきなさい",
        "アンタの覚悟、リングで見せてもらうわよ",
      ],
      low: [
        "……分かった。受けるよ",
      ],
    },
    earnest: {
      high: [
        "……分かりました。今日、あなたの全てを受け止めます",
        "私のうしろの子たちも、もう泣かせない。受けて立ちます",
      ],
      mid: [
        "逃げません。今日は、決着をつけましょう",
      ],
      low: [
        "受けます。リングで、お会いしましょう",
      ],
    },
    quiet: {
      high: [
        "……分かった。リングで",
        "……うん。逃げない",
      ],
      mid: [
        "……いいよ",
      ],
      low: [
        "……分かった",
      ],
    },
    easygoing: {
      high: [
        "あ〜あ、こうなっちゃったか。仕方ない、付き合うよ",
        "断りたいけど、断れる空気じゃないもんね、これ",
      ],
      mid: [
        "ま、いっか。リングで決めようよ",
      ],
      low: [
        "んー、付き合います",
      ],
    },
    emotional: {
      high: [
        "あなたが本気なら、私も本気で受ける！",
        "うちの子たちのこと、もう傷つけさせない！",
      ],
      mid: [
        "受ける…。今日は、今日は引かない…！",
      ],
      low: [
        "……分かった。ぶつかろう",
      ],
    },
    normal: {
      high: [
        "受けます。リングで会いましょう",
        "退きません。今日は、決着のときだ",
      ],
      mid: [
        "分かった。受ける",
      ],
      low: [
        "リングで",
      ],
    },
  },
  delinquent: {
    bold: {
      high: [
        "おう、待ってたぞ。逃がさねえからな",
        "わたしんとこも、舐められたまま終わる気はねえ",
      ],
      mid: [
        "ったく。来るなら来いよ",
      ],
    },
  },
  polite: {
    earnest: {
      high: [
        "ご丁寧に、ありがとうございます。お受けいたします",
      ],
    },
  },
  cool: {
    quiet: {
      high: [
        "……いいだろう。受けて立つ",
      ],
    },
  },
  ojousama: {
    emotional: {
      high: [
        "結構ですわ。お相手いたしましょう",
        "わたくしの組も、あなたに膝を屈する気はございません",
      ],
    },
  },
};

// ── 試合後 勝者セリフ（敗者派閥への一撃） ──
const FACTION_F08_POST_MATCH_WINNER_LINES = {
  standard: {
    bold: {
      high: [
        "これがあんたの組の限界か？　次は誰だ",
        "見た？ これが格の違いってやつよ",
        "もう二度と、こっちに楯突かないことね",
      ],
      mid: [
        "……今日は、私の勝ち",
        "次の番、誰でも構わないわ。来なさいよ",
      ],
      low: [
        "……勝った。それだけだ",
      ],
    },
    earnest: {
      high: [
        "……あなたの組のやり方が、間違ってたって、これで証明された",
        "私、勝ちました。みんなのために",
        "もう、うちの子たちを傷つけないでください",
      ],
      mid: [
        "ありがとう……みんな、見ててくれて",
      ],
      low: [
        "……勝てた。みんなのおかげです",
      ],
    },
    quiet: {
      high: [
        "……勝った",
        "……これで、終わり。じゃない",
      ],
      mid: [
        "……勝てた",
      ],
      low: [
        "……（深く息をつく）",
      ],
    },
    easygoing: {
      high: [
        "あ〜あ、勝っちゃった。次は仲良くやろうよ、本気で",
        "勝つには勝ったけど、あんたんとこも、もう静かにしとこ？",
      ],
      mid: [
        "んー、勝った。それだけ",
      ],
      low: [
        "勝てたみたい。ふぅ",
      ],
    },
    emotional: {
      high: [
        "勝った！　うちのみんなのために、勝った！",
        "あなたたち、もう泣かせないからね、絶対！",
      ],
      mid: [
        "勝てた……みんな、ありがとう",
      ],
      low: [
        "……勝った……",
      ],
    },
    normal: {
      high: [
        "今夜の決着は、これで充分だろう",
        "あんたの組とは、もう距離を置かせてもらう",
      ],
      mid: [
        "勝った。それで充分",
      ],
      low: [
        "……勝てた",
      ],
    },
  },
  delinquent: {
    bold: {
      high: [
        "口ほどにもねえな、あんたの組",
        "次の番、誰だよ？　全員かかってこい",
      ],
      mid: [
        "ふん。私の勝ちだ",
      ],
    },
  },
  polite: {
    earnest: {
      high: [
        "失礼いたしました。今日は、私が勝たせてもらいます",
      ],
    },
  },
  cool: {
    quiet: {
      high: [
        "……結果がすべて、だ",
      ],
    },
  },
  ojousama: {
    emotional: {
      high: [
        "ご覧の通りですわ。わたくしの組に、刃向うものではありませんの",
      ],
    },
  },
};

// ── 試合後 敗者セリフ（HP帯分岐） ──
const FACTION_F08_POST_MATCH_LOSER_LINES = {
  standard: {
    bold: {
      hp_high: [
        "……次は、こうはいかないわよ。覚えておきなさい",
        "今日のところは、私の負け。でも、この組は潰れないわ",
      ],
      hp_mid: [
        "……くそっ……まだ、終わりじゃ……",
        "……次、絶対に……",
      ],
      hp_low: [
        "……っ……",
        "（呻き声）",
      ],
    },
    earnest: {
      hp_high: [
        "……ごめんなさい。私、勝てなかった……",
        "……みんな、ごめん。次は、絶対に",
      ],
      hp_mid: [
        "……うっ……ごめん……みんな……",
      ],
      hp_low: [
        "……（声にならない）",
      ],
    },
    quiet: {
      hp_high: [
        "……負けた、けど……組は、潰れない",
        "……次は、ない、なんて……思ってない",
      ],
      hp_mid: [
        "……っ……",
      ],
      hp_low: [
        "（沈黙）",
      ],
    },
    easygoing: {
      hp_high: [
        "あ〜あ、負けちゃった。ま、こんな日もあるよ",
        "うん、負け。次はもうちょっと頑張る",
      ],
      hp_mid: [
        "……いた……っ……",
      ],
      hp_low: [
        "（うつぶせのまま動かない）",
      ],
    },
    emotional: {
      hp_high: [
        "……悔しい……ぜんぜん、納得いかない……！",
        "……ごめん、みんな……次は、絶対勝つから……",
      ],
      hp_mid: [
        "……うっ……うぅ……",
      ],
      hp_low: [
        "（嗚咽だけが漏れる）",
      ],
    },
    normal: {
      hp_high: [
        "……今日は、負け。だけど、組は終わらない",
        "……次は、こうはいかせない",
      ],
      hp_mid: [
        "……くっ……",
      ],
      hp_low: [
        "……（呼吸だけが響く）",
      ],
    },
  },
  delinquent: {
    bold: {
      hp_high: [
        "チッ……負けた。今日のとこはな",
      ],
      hp_mid: [
        "……うるせえ……",
      ],
      hp_low: [
        "（息も荒い）",
      ],
    },
  },
  polite: {
    earnest: {
      hp_high: [
        "……お見事でした。次は、こうはいきません",
      ],
    },
  },
  cool: {
    quiet: {
      hp_high: [
        "……負け。それだけ",
      ],
      hp_mid: [
        "……っ……",
      ],
    },
  },
  ojousama: {
    emotional: {
      hp_high: [
        "……今日は、お先にどうぞ。次は、こうはいかせませんわ",
      ],
      hp_mid: [
        "……っ……まだ、わたくし……",
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// F09 派閥対抗戦 セリフテーブル群（spec: faction-rivalry-points-spec-v0.1 §3.5）
// hostility帯 (high/mid/low) で分岐する F08 と同じ形式。引きは Engine.factions._getF08LineByBand を流用。
// ─────────────────────────────────────────────────────────────────────────────

// オープニング宣戦：A 派閥リーダーの宣言
const FACTION_F09_OPENING_LINES_A = {
  standard: {
    bold: {
      high: [
        "今夜、アンタの組ごと踏み潰す。覚悟はできてるわね",
        "選手全員、リングに上げなさい。一人残らず叩く",
      ],
      mid: ["今日が、あんたんとこの分水嶺だ"],
    },
    earnest: {
      high: [
        "派閥同士の決着、今夜つけさせていただきます",
        "うちの組のみんなのためにも、今日は引きません",
      ],
      mid: ["この夜が、私たちの答えになります"],
    },
    quiet: {
      high: ["……今夜で、終わらせる"],
    },
    easygoing: {
      high: ["まあ、ここまで来ちゃったしね。今夜決めようよ"],
    },
    emotional: {
      high: [
        "私たち、今日で全部背負って戦います",
        "うちの組の名前、今夜傷つけさせない",
      ],
    },
    shy: {
      high: ["……今夜、組の全員で受けて立ちます"],
    },
  },
  delinquent: {
    bold: {
      high: ["全員揃ってるな？ じゃあ、今夜が最後だ"],
    },
  },
  polite: {
    earnest: {
      high: ["今夜の興行で、すべてを決めさせてください"],
    },
  },
  cool: {
    quiet: {
      high: ["……話すことは、もう何もない"],
    },
  },
  ojousama: {
    emotional: {
      high: ["わたくしたち、今夜こそ決着をつけますわ"],
    },
  },
};

// オープニング宣戦：B 派閥リーダーの応答
const FACTION_F09_OPENING_LINES_B = {
  standard: {
    bold: {
      high: ["上等よ。組ごと潰し合おうじゃない"],
    },
    earnest: {
      high: [
        "わかりました。受けて立たせていただきます",
        "うちの組も、引きません",
      ],
    },
    quiet: {
      high: ["……いいよ。来な"],
    },
    easygoing: {
      high: ["やれやれ……じゃあ、行こうか"],
    },
    emotional: {
      high: ["私たちも、今夜は退きません"],
    },
    shy: { high: ["……はい。受けて、立ちます"] },
  },
  delinquent: {
    bold: {
      high: ["来なよ。全員でかかってこい"],
    },
  },
  polite: {
    earnest: { high: ["お受けいたします。今夜、決着を"] },
  },
  cool: {
    quiet: { high: ["……受ける"] },
  },
  ojousama: {
    emotional: { high: ["わたくしも、引きませんわよ"] },
  },
};

// 各試合前 簡略 confrontation（軽量版・F08 PRE_MATCH より短め）
const FACTION_F09_MATCH_PRE_LINES = {
  standard: {
    bold: {
      high: ["順番が来たね"],
      mid: ["先に来な"],
    },
    earnest: {
      high: ["お願いします"],
      mid: ["全力で行きます"],
    },
    quiet: {
      high: ["……行く"],
    },
    easygoing: {
      high: ["やろっか"],
    },
    emotional: {
      high: ["背負ってるもの、見せます"],
    },
    shy: {
      high: ["……はい"],
    },
  },
};

// 各試合後 勝者の一言（軽量）
const FACTION_F09_MATCH_POST_WIN_LINES = {
  standard: {
    bold: {
      high: ["1勝。あと何回続くかな"],
      mid: ["まだ序章よ"],
    },
    earnest: {
      high: ["……ありがとうございました。次の人に繋ぎます"],
    },
    quiet: { high: ["……次"] },
    easygoing: { high: ["とりあえず一つ、もらった"] },
    emotional: { high: ["みんな、見ててね"] },
    shy: { high: ["……勝てて、よかった"] },
  },
  delinquent: {
    bold: { high: ["次。次出てこい"] },
  },
};

// 各試合後 敗者の一言（軽量・呻き寄り）
const FACTION_F09_MATCH_POST_LOSE_LINES = {
  standard: {
    bold: {
      high: ["……ちっ。次の子、取り返してちょうだい"],
    },
    earnest: { high: ["……ごめんなさい、次に繋いでください"] },
    quiet: { high: ["……ごめん"] },
    easygoing: { high: ["……うわ、負けた。次よろしく"] },
    emotional: { high: ["……ごめん、ごめんね"] },
    shy: { high: ["……ごめんなさい"] },
  },
};

// エンディング 勝ち越し派閥リーダー
const FACTION_F09_ENDING_WIN_LINES = {
  standard: {
    bold: {
      high: [
        "勝ち越した。今夜は、うちの組の夜だ",
        "今の、見えた？ これがうちの組の力よ",
      ],
    },
    earnest: {
      high: [
        "……勝てて、よかった。みんなのおかげです",
        "うちの組、今日のために積み上げてきたんです",
      ],
    },
    quiet: { high: ["……勝った"] },
    easygoing: { high: ["なんとかなったね、よかった"] },
    emotional: {
      high: ["みんな、ありがとう……ありがとう"],
    },
    shy: { high: ["……勝ち越せて、嬉しいです"] },
  },
  delinquent: {
    bold: { high: ["完全勝利だ。文句あるか？"] },
  },
  ojousama: {
    emotional: { high: ["わたくしたち、勝ち越しましたわよ"] },
  },
};

// エンディング 負け越し派閥リーダー
const FACTION_F09_ENDING_LOSE_LINES = {
  standard: {
    bold: {
      high: [
        "……負けた。受け止める。次は必ず取り返す",
        "今夜のは、覚えとく。次に返すから",
      ],
    },
    earnest: {
      high: [
        "……ごめんなさい、みんな。私の責任です",
        "今夜は、私たちが弱かった。立て直します",
      ],
    },
    quiet: { high: ["……負けた。それだけ"] },
    easygoing: { high: ["はー、やられたなあ。組み立て直しだね"] },
    emotional: { high: ["……うちの組、今夜は弱かった。みんな、ごめん"] },
    shy: { high: ["……ごめんなさい、わたしのせいです"] },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 派閥内序列戦（spec: faction-internal-rank-spec-v0.2 §5.3）
// 構造: personality.archetype.band 形式（_getF08LineByBand 流用）
// band は 'high' のみ使用（同派閥内対立なので hostility 帯は単一）。loser のみ HP帯。
// ─────────────────────────────────────────────────────────────────────────────
const INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES = {
  standard: {
    bold: { high: [
      "今夜、あんたの座は降ろさせてもらう",
      "ずっと、あんたの背中ばっか見てきた。今日で終わりにする",
      "リーダー――その肩書、重そうね。譲ってもらうわよ",
    ] },
    earnest: { high: [
      "……失礼を承知で言います。私が、上に立ちます",
      "あなたを尊敬しています。だからこそ、今日、超える",
      "後ろの子たちに、もう待ってと言えない",
    ] },
    quiet: { high: [
      "……時間だ",
      "……席を、もらいに来た",
    ] },
    emotional: { high: [
      "怖いよ。でも、行かなきゃ",
      "ごめん、ごめんね……それでも、譲れないんだ",
    ] },
    easygoing: { high: [
      "やー、こういう日も来るよね。じゃ、行こうか",
    ] },
    shy: { high: [
      "……わたし、勝ちます",
    ] },
    normal: { high: [
      "今日、あなたの座を奪いに来た",
      "ずっとこの日を待っていた",
    ] },
  },
  delinquent: {
    bold: { high: [
      "黙って退け、なんて言わねえ。リングで証明してやる",
      "私が上に立つ。それだけだ",
    ] },
  },
  cool: {
    bold: { high: [
      "順番が回ってきただけだ。受けてもらう",
    ] },
  },
  polite: {
    earnest: { high: [
      "御免なさい。今日だけは、譲れません",
    ] },
  },
};

const INTERNAL_CHALLENGE_PRE_LEADER_LINES = {
  standard: {
    bold: { high: [
      "上等。叩き潰してやる",
      "新人さん、その意気だけは買ってあげる。リングは別だけどね",
    ] },
    earnest: { high: [
      "……来なさい。それが、あなたの覚悟なら",
      "わかった。今日は、本気で迎え撃つ",
    ] },
    quiet: { high: [
      "……いいだろう",
    ] },
    emotional: { high: [
      "そんな顔で来られたら――退けないじゃない",
    ] },
    easygoing: { high: [
      "お、来るんだ。じゃあ行こっか",
    ] },
    shy: { high: [
      "……負けません。今日は",
    ] },
    normal: { high: [
      "受けて立つ。リングで会おう",
    ] },
  },
  cool: {
    bold: { high: [
      "受けてやる。それだけのことだ",
    ] },
  },
  polite: {
    earnest: { high: [
      "光栄です。全力で、お相手します",
    ] },
  },
};

const INTERNAL_CHALLENGE_POST_WINNER_LINES = {
  standard: {
    bold: { high: [
      "これで、私が先頭に立つ。文句ある？",
      "後ろのみんな、ついて来な。ここからだ",
    ] },
    earnest: { high: [
      "……ありがとうございました。この座、必ず守ります",
      "重い……でも、引き受けます",
    ] },
    quiet: { high: [
      "……勝った。それだけ",
    ] },
    emotional: { high: [
      "勝った……勝っちゃった……",
    ] },
    easygoing: { high: [
      "あー、勝っちゃったか。じゃ、やってみるね",
    ] },
    shy: { high: [
      "……ほんとうに、勝てるなんて",
    ] },
    normal: { high: [
      "勝った。これからは私が先頭に立つ",
    ] },
  },
};

const INTERNAL_CHALLENGE_POST_LOSER_LINES = {
  standard: {
    bold: {
      hp_high: [
        "……次はないわ。忘れないことね",
        "ふん、今日は譲ってやる。それだけだ",
      ],
      hp_mid: [
        "……認めるしかないわね、今日は",
      ],
      hp_low: [
        "……強かった",
      ],
    },
    earnest: {
      hp_high: [
        "……あなたの方が、上でした。素直に認めます",
        "あとは、お任せします。立派に、組を率いてください",
      ],
      hp_mid: [
        "……負けました。次は、支える側に回ります",
      ],
      hp_low: [
        "……託します",
      ],
    },
    quiet: {
      hp_high: ["……負けた"],
      hp_mid: ["……ええ"],
      hp_low: ["……"],
    },
    emotional: {
      hp_high: ["……ごめんね、みんな。守れなかった"],
      hp_mid: ["……うちの背中、もう、頼りにならないかな"],
      hp_low: ["……ごめん"],
    },
    easygoing: {
      hp_high: ["はー、抜かれちゃったか。次の子、頑張れよ"],
      hp_mid: ["やられたなあ、参った参った"],
      hp_low: ["……参った"],
    },
    shy: {
      hp_high: ["……ごめんなさい、わたしのせいで"],
      hp_mid: ["……すみません"],
      hp_low: ["……"],
    },
    normal: {
      hp_high: ["負けた。あとは任せる"],
      hp_mid: ["やられた。次は支える側に回る"],
      hp_low: ["……託す"],
    },
  },
};

// window export（ブラウザ参照用、既存テーブルとの整合）
if (typeof window !== 'undefined') {
  window.FACTION_F08_PRE_MATCH_LINES_A = FACTION_F08_PRE_MATCH_LINES_A;
  window.FACTION_F08_PRE_MATCH_LINES_B = FACTION_F08_PRE_MATCH_LINES_B;
  window.FACTION_F08_POST_MATCH_WINNER_LINES = FACTION_F08_POST_MATCH_WINNER_LINES;
  window.FACTION_F08_POST_MATCH_LOSER_LINES = FACTION_F08_POST_MATCH_LOSER_LINES;
  window.FACTION_F09_OPENING_LINES_A = FACTION_F09_OPENING_LINES_A;
  window.FACTION_F09_OPENING_LINES_B = FACTION_F09_OPENING_LINES_B;
  window.FACTION_F09_MATCH_PRE_LINES = FACTION_F09_MATCH_PRE_LINES;
  window.FACTION_F09_MATCH_POST_WIN_LINES = FACTION_F09_MATCH_POST_WIN_LINES;
  window.FACTION_F09_MATCH_POST_LOSE_LINES = FACTION_F09_MATCH_POST_LOSE_LINES;
  window.FACTION_F09_ENDING_WIN_LINES = FACTION_F09_ENDING_WIN_LINES;
  window.FACTION_F09_ENDING_LOSE_LINES = FACTION_F09_ENDING_LOSE_LINES;
  window.INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES = INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES;
  window.INTERNAL_CHALLENGE_PRE_LEADER_LINES = INTERNAL_CHALLENGE_PRE_LEADER_LINES;
  window.INTERNAL_CHALLENGE_POST_WINNER_LINES = INTERNAL_CHALLENGE_POST_WINNER_LINES;
  window.INTERNAL_CHALLENGE_POST_LOSER_LINES = INTERNAL_CHALLENGE_POST_LOSER_LINES;
}

// Node.js export（auto-sim 用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {    FACTION_F05_DISSIDENT_LINES,
    FACTION_F06_AMBIENT_LINES,    FACTION_F08_LEADER_LINES,
    FACTION_F08_PRE_MATCH_LINES_A,
    FACTION_F08_PRE_MATCH_LINES_B,
    FACTION_F08_POST_MATCH_WINNER_LINES,
    FACTION_F08_POST_MATCH_LOSER_LINES,
    FACTION_F09_OPENING_LINES_A,
    FACTION_F09_OPENING_LINES_B,
    FACTION_F09_MATCH_PRE_LINES,
    FACTION_F09_MATCH_POST_WIN_LINES,
    FACTION_F09_MATCH_POST_LOSE_LINES,
    FACTION_F09_ENDING_WIN_LINES,
    FACTION_F09_ENDING_LOSE_LINES,
    INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES,
    INTERNAL_CHALLENGE_PRE_LEADER_LINES,
    INTERNAL_CHALLENGE_POST_WINNER_LINES,
    INTERNAL_CHALLENGE_POST_LOSER_LINES,
  };
}
