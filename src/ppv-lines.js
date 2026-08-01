// ══════════════════════════════════════════════════════════════════════════════
//  PPV GRAND FINAL 会話テーブル (task-75)
//
//  ■ なぜ作ったか
//    PPV は年間最大興行なのに、喋るのは `PPV_SUMMIT_VICTORY_LINES` の
//    「頂上決戦の勝者ひとり」だけで、しかも自団体が勝ったときに限られていた(47本)。
//    天頂戦666本 / 秋対抗戦228+315本 / 春タッグ98+98本 に対して極端に薄く、
//    負けたら誰も何も言わず、アンダーカード6試合は完全に無言だった。
//
//  ■ この表の肝 — **相手選手が喋る**
//    自団体の選手が自分の勝敗を語るのではなく、**対戦相手がこちらへ言葉を投げる**。
//    だから因縁の有無で色が変わる(2026-08-01 Keisuke 指定)。
//
//    summitPre   頂上決戦の直前。両者が1本ずつ
//    summitLose  頂上決戦の敗者。これまで存在しなかった枠
//    oppOnLoss   **自団体が勝った**とき、負けた相手が投げる言葉
//    oppOnWin    **自団体が負けた**とき、勝った相手が投げる言葉
//
//    どれも `grudge`(因縁あり rivalry>=60) と `plain`(因縁なし) に分かれる。
//
//  ■ 侮辱を出してよいのは `oppOnWin.grudge` だけ
//    因縁の相手に勝った側だけが見下す。他の枠へ悪意を混ぜない。
//    ただしここは遠慮しない。**侮るにも品位の差がある**ので、
//    お嬢様の侮りと不良の侮りは別物として書き分けること。
//
//  ■ キー規約(TENCHOSEN_FINAL_LINES と同じ)
//    `${archetype}_${personality}` → `${archetype}_normal` → `standard_normal`
//    **口調の第一分岐は archetype(7種)。personality は第二分岐**。
//    いまは `${archetype}_normal` を基準セルとして全モチーフに揃えてある。
//    性格で言い方を割りたいセルは `${archetype}_${personality}` を足せばよい
//    (picker は無改修。実在34組への展開は tenchosen と同じ手順でできる)。
// ══════════════════════════════════════════════════════════════════════════════

const PPV_LINES = {

  // ── 頂上決戦 直前 ────────────────────────────────────────────
  summitPre: {
    // 因縁なし: 年間最大の舞台に立つ重み
    plain: {
      standard_normal: ['ここまで来ました。……この景色を、ずっと見たかった'],
      polite_normal: ['この場所に立てること自体が、もう十分な報酬です。……その上で、勝ちにいきます'],
      cool_normal: ['……一年の終わり。……ここで、決める'],
      composed_normal: ['…一年かけて、ここまで来たわけだ。…悪くない眺めだよ'],
      ojousama_normal: ['一年の締めくくりにふさわしい舞台ですこと。……その主役は、わたくしがいただきます'],
      delinquent_normal: ['一年の総決算だろ。……派手にやろうぜ'],
      seductive_normal: ['一年の最後に、こんないい相手と。……ふふ、贅沢ね'],
    },
    // 因縁あり: よりによって、この舞台で
    grudge: {
      standard_normal: ['よりによって、この舞台であなたと。……願ってました、こうなることを'],
      polite_normal: ['一年の最後に、あなたと向き合えるとは。……これ以上の巡り合わせはありません'],
      cool_normal: ['……最後に、お前か。……ちょうどいい'],
      composed_normal: ['…一年の締めが、あんたとはね。…出来すぎた筋書きだ'],
      ojousama_normal: ['よりによって、あなたと最後に。……ええ、望むところですわ'],
      delinquent_normal: ['最後の最後でテメェかよ。……上等だ、ケリつけようぜ'],
      seductive_normal: ['一年の終わりに、あなたと。……ふふ、運命って悪趣味ね'],
    },
  },

  // ── 頂上決戦 敗者 ────────────────────────────────────────────
  summitLose: {
    plain: {
      standard_normal: ['届きませんでした。……この舞台の一番上は、まだ遠いです'],
      polite_normal: ['一年かけて、ここまで来て。……最後の一歩が、どうしても届きませんでした'],
      cool_normal: ['……終わった。……また、一年かけて戻る'],
      composed_normal: ['…一年の答えが、これか。…受け止めるしかないね'],
      ojousama_normal: ['一年の総まとめが、この結果。……悔しいなんて言葉では足りませんわ'],
      delinquent_normal: ['一年やってきて、これかよ。……クソ、締まらねぇな'],
      seductive_normal: ['一年の最後に、この味。……忘れられそうにないわ'],
    },
    grudge: {
      standard_normal: ['この人にだけは。……この舞台でだけは、負けたくなかった'],
      polite_normal: ['よりによって、あなたに。……この場所で。……一年、忘れられそうにありません'],
      cool_normal: ['……お前に。……ここで。……忘れない'],
      composed_normal: ['…あんたに、この舞台で。…一番きつい負け方だよ'],
      ojousama_normal: ['あなたに、この場所で。……この屈辱、一年かけてお返しいたしますわ'],
      delinquent_normal: ['テメェにここで負けるかよ……！ ……クソが、覚えとけ'],
      seductive_normal: ['あなたに、この舞台で奪られるなんて。……ふふ、悔しくて眠れそうにない'],
    },
  },

  // ── 自団体が勝った → **負けた相手**が投げる言葉 ──────────────
  oppOnLoss: {
    // 因縁なし: 素直に負けを認める / 相手を称える
    plain: {
      standard_normal: ['強かったです。……今日は、完全にあなたの日でした'],
      polite_normal: ['完敗です。……胸を張って勝ったと言ってください'],
      cool_normal: ['……強い。……それだけだ'],
      composed_normal: ['…参ったよ。…今日のあんたには、勝てる気がしなかった'],
      ojousama_normal: ['見事ですわ。……わたくしが言うのですから、間違いありません'],
      delinquent_normal: ['……強ぇな、あんた。悔しいけど、そこは認めるわ'],
      seductive_normal: ['参ったわ。……こんなに気持ちよく負けたのは久しぶり'],
    },
    // 因縁あり: 悔しげ。認めたくない、次はやる
    grudge: {
      standard_normal: ['……今日は、あなたの日でした。それだけです'],
      polite_normal: ['今日は、と申し上げておきます。……次も同じとは限りませんので'],
      cool_normal: ['……今日は。……次は違う'],
      composed_normal: ['…今日は持っていかれたね。…でも、これで終わりじゃない'],
      ojousama_normal: ['今日はお譲りいたしますわ。……たった一度で、勝った気にならないことね'],
      delinquent_normal: ['今日は……今日だけだからな。次は絶対に潰す'],
      seductive_normal: ['今日は譲ってあげる。……次はそんな顔、させないから'],
    },
  },

  // ── 自団体が負けた → **勝った相手**が投げる言葉 ──────────────
  oppOnWin: {
    // 因縁なし: 普通の勝者。過剰に煽らない
    plain: {
      standard_normal: ['いい試合でした。……またやりたいです、この人とは'],
      polite_normal: ['勝たせていただきました。……最後まで、油断のできない相手でした'],
      cool_normal: ['……勝った。……いい相手だった'],
      composed_normal: ['…勝ったよ。…もう少しで、逆だったけどね'],
      ojousama_normal: ['頂きましたわ。……ですが、危ない場面もございました'],
      delinquent_normal: ['勝った。……けど、あんたなかなかやるじゃねぇか'],
      seductive_normal: ['もらったわ。……でも、あなた思ったより手強かったのね'],
    },
    // 因縁あり: **侮辱・侮り。この枠だけが悪意を出す**
    // 侮り方は口調で変える。慇懃無礼(丁寧)/ 冷たい失望(クール)/ 拍子抜け(鷹揚)/
    // 慇懃な侮蔑(お嬢様)/ 直接的な脅し(不良)/ 嘲弄(妖艶)/ 断定的な格付け(標準)
    grudge: {
      standard_normal: ['これで分かったでしょう。……あなたと私では、立っている場所が違う'],
      polite_normal: ['申し上げにくいのですが。……あなたでは、わたしには届きません'],
      cool_normal: ['……この程度か。……期待した私が、間違っていた'],
      composed_normal: ['…そんなものか。…もう少し、楽しませてくれると思ってたよ'],
      ojousama_normal: ['あら、もう終わり？ ……身の程を知るには、ちょうどよい薬でしたわね'],
      delinquent_normal: ['口だけだったな。……二度と俺の前でデカい口叩くなよ'],
      seductive_normal: ['あんなに吠えていたのに。……ふふ、床の上だとずいぶん静かなのね'],
    },
  },
};

/**
 * PPV のセリフを1本引く。
 *
 * @param {string} scene   'summitPre' | 'summitLose' | 'oppOnLoss' | 'oppOnWin'
 * @param {object} speaker 喋る本人（archetype/personality を見る）
 * @param {object} other   相手（因縁の判定に使う）
 * @param {object} state   G
 * @returns {string} 引けなければ ''
 *
 * 因縁は **その2人の間で強いほうの向き** で見る（`_rivalryPreMatchLines` と同じ規約。
 * 非対称2軸なので、片方だけ燃えていても「因縁のある一戦」として扱う）。
 */
function pickPpvLine(scene, speaker, other, state) {
  if (typeof PPV_LINES === 'undefined') return '';
  const table = PPV_LINES[scene];
  if (!table || !speaker) return '';
  let grudge = false;
  if (other && state) {
    const rel = state.relationships || {};
    const r = Math.max(
      (rel[`${speaker.id}>${other.id}`] || {}).rivalry || 0,
      (rel[`${other.id}>${speaker.id}`] || {}).rivalry || 0);
    grudge = r >= 60;
  }
  const cell = table[grudge ? 'grudge' : 'plain'] || table.plain;
  if (!cell) return '';
  const a = speaker.archetype || 'standard';
  const p = speaker.personality || 'normal';
  const pool = cell[`${a}_${p}`] || cell[`${a}_normal`] || cell.standard_normal;
  if (!Array.isArray(pool) || pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)] || '';
}
