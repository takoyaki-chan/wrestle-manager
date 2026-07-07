// ╔══════════════════════════════════════════════════════════╗
// ║  COACH-LINES — 外部コーチ招聘制 過程イベント(P4)セリフデータ ║
// ║  shachoshitsu-care-rework v0.1 §7 準拠。文言は一字一句 spec ║
// ║  のまま(docs/shachoshitsu-care-rework-spec-v0.1.md §7.0〜§7.5)║
// ╚══════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────────────────────────
// §7.0 口調系統の割り付け(コーチID→voiceKey)
// ID は data.js の ALL_COACHES と名前照合して確定させたもの。
// ─────────────────────────────────────────────────────────────
const COACH_VOICE_MAP = {
  1: 'sparta_roshi',    // 鬼塚 剛志(男58)
  32: 'sparta_roshi',   // 巌流 正道(男56)

  18: 'sparta_tosho',   // 赤城 凛(女36)
  22: 'sparta_tosho',   // 安藤 美波(女31)
  31: 'sparta_tosho',   // 神崎 鋼子(女60)
  21: 'sparta_tosho',   // 熊谷 鉄也(男46)
  27: 'sparta_tosho',   // 大河原 剛士(男43)

  2: 'theorist',        // 飛鳥 真琴
  4: 'theorist',        // 岩田 拓海
  8: 'theorist',        // 白川 沙耶
  12: 'theorist',       // 長谷川 美咲
  16: 'theorist',       // 森田 悠子
  19: 'theorist',       // 西岡 学
  25: 'theorist',       // 宮沢 康弘
  35: 'theorist',       // 如月 薫

  3: 'artisan_bukotsu',   // 鶴見 正嗣(男62)
  34: 'artisan_bukotsu',  // 御堂 清四郎(男65)
  17: 'artisan_bukotsu',  // 篠原 隆(男55)
  9: 'artisan_bukotsu',   // 大森 健吾(男32)
  11: 'artisan_bukotsu',  // 真壁 龍太(男37)

  28: 'artisan_seihitsu', // 羽田 小百合(女44)
  30: 'artisan_seihitsu', // 冴島 楓(女39)

  5: 'mentor',   // 沢村 玲子
  10: 'mentor',  // 宮本 花菜
  20: 'mentor',  // 藤原 千春
  23: 'mentor',  // 堀内 義孝
  29: 'mentor',  // 陳 偉明

  6: 'bigheart_oyaji',   // 朝日 義男(男52)
  7: 'bigheart_oyaji',   // 紅林 太一(男48)
  13: 'bigheart_oyaji',  // 黒田 修平(男44)
  15: 'bigheart_oyaji',  // 林 拓海(男30)

  14: 'bigheart_anego',  // 土屋 弘美(女50)
  24: 'bigheart_anego',  // 中村 紗弓(女35)
  26: 'bigheart_anego',  // カルロス 真理(女42)
  33: 'bigheart_anego',  // 葉月 レナ(女45)
};

// coachId → voiceKey。未登録コーチ(将来追加分)は theorist にフォールバック。
function getCoachVoiceKey(coachId) {
  return COACH_VOICE_MAP[coachId] || 'theorist';
}

// ─────────────────────────────────────────────────────────────
// §7.1〜§7.5 セリフ本体(voiceKey ごと)
// ─────────────────────────────────────────────────────────────
const COACH_INVITE_LINES = {
  // §7.1 中間報告(2週目に50%で1回)
  midterm: {
    sparta_roshi:      '「まだ倒れとらん。見どころはある」',
    sparta_tosho:       '「まだ折れていない。目も死んでいない——見どころはある」',
    theorist:           '「数値は素直ですよ。フォームの無駄がひとつずつ消えています」',
    artisan_bukotsu:    '「……手応えは、ある」',
    artisan_seihitsu:   '「……手応えは、あります」',
    mentor:             '「あの子、自分で気づき始めましたよ。いい兆しです」',
    bigheart_oyaji:     '「いやあ、よく食らいついてくるよ。若いってのはいいねえ」',
    bigheart_anego:     '「よく食らいついてくるのよ、あの子。若いっていいわね」',
  },

  // §7.2 衝突イベント(相性✕のみ・期間中1回20%)
  conflict: {
    sparta_roshi:     '「最近、練習に身が入っとらん。あれを甘やかすなら、わしは降りる」',
    sparta_tosho:      '「練習に身が入っていない。あれを甘やかすなら、指導はここまでにする」',
    theorist:          '「提案したメニューを、彼女は感覚で崩してしまう。これでは計測になりません」',
    artisan_bukotsu:   '「……合わん。それだけだ」',
    artisan_seihitsu:  '「……合いませんね。どちらが悪いのでも、ないのですが」',
    mentor:            '「私の待ち方が、あの子には焦れったいようです。悪いのはどちらでもないのですが」',
    bigheart_oyaji:    '「近づこうとするほど、あの子は一歩引くんだよ。参ったね」',
    bigheart_anego:    '「近づこうとするほど、一歩引かれちゃってね。……参ったわ」',
  },

  // §7.3 延長打診(相性◎のとき25%・+2週・費用=週給×2×1.5)
  extension: {
    sparta_roshi:     '「もう2週寄こせ。あれはまだ伸びる」',
    sparta_tosho:      '「あと2週。あの子には、まだ上がある」',
    theorist:          '「あと2週あれば、いま作りかけの型が完成します。数字で保証しますよ」',
    artisan_bukotsu:   '「……もう少し、見たい」',
    artisan_seihitsu:  '「……もう少しだけ、見せてください」',
    mentor:            '「芽が出る直前なんです。ここで離れるのは、もったいない」',
    bigheart_oyaji:    '「なあ社長、もうちょっとだけあの子に付き合わせてくれよ」',
    bigheart_anego:    '「ねえ社長、もう少しだけあの子に付き合わせてくれない？」',
  },

  // §7.4 卒業レポート — コーチの総評「大」(相性◎や大きく伸びた)
  gradGood: {
    sparta_roshi:     '「よく耐えた。あれはもう、わしが居らんでも勝手に強くなる」',
    sparta_tosho:      '「よく耐えた。もう、誰かに追い込まれなくても強くなれる」',
    theorist:          '「教科書に載せたいくらいの吸収曲線でした。データはすべて置いていきます」',
    artisan_bukotsu:   '「……いいものを見た。あとは、あいつのものだ」',
    artisan_seihitsu:  '「……いいものを見ました。あとは、あの子のものです」',
    mentor:            '「私は何も教えていません。あの子が、自分で見つけたんです」',
    bigheart_oyaji:    '「別れが寂しくなっちまった。いい子を預かったよ、社長」',
    bigheart_anego:    '「別れが寂しくなっちゃった。いい子を預かったわ、社長」',
  },

  // §7.4 卒業レポート — コーチの総評「並」
  gradNormal: {
    sparta_roshi:     '「土台は作った。ここから先は本人の覚悟の問題だ」',
    sparta_tosho:      '「土台は作った。ここから先は、本人の覚悟の問題」',
    theorist:          '「伸び幅は想定の範囲内です。継続すれば、もう一段あります」',
    artisan_bukotsu:   '「……悪くはない」',
    artisan_seihitsu:  '「……悪くは、ありません」',
    mentor:            '「ゆっくりな子です。でも、蒔いた種は消えませんよ」',
    bigheart_oyaji:    '「まあ、こんなもんさ。でも あの子、最後まで笑って走ってたよ」',
    bigheart_anego:    '「まあ、こんなものよ。でもあの子、最後まで笑って走ってたわよ」',
  },
};

// §7.4 選手の一言 — 手応えあり(アーキタイプ別)
const FIGHTER_INVITE_GRAD_LINES = {
  normal:     '「自分の身体が変わっていくのが、毎日わかったんです」',
  ojousama:   '「よい師でしたわ。……少しだけ、涙が出ましたけれど」',
  delinquent: '「べつに。……まあ、アイツの言うことは全部正しかったけどな」',
  cool:       '「収穫はあった。それ以上でも以下でもない」',
  seductive:  '「あんなに汗をかいたの、いつ以来かしら。悪くない4週間だったわ」',
  polite:     '「最後の日、深く頭を下げました。それしかできることがなくて」',
  composed:   '「いい時間だったよ。ああいう出会いは、キャリアにそう何度もない」',
};

// §7.4 選手の一言 — 並(共通プール、ランダムに1本)
const FIGHTER_INVITE_GRAD_NORMAL_LINES = [
  '「……正直、まだ消化しきれてません。でも無駄じゃなかったと思います」',
  '「合ってたのかどうかは、次の試合で確かめます」',
];

// §7.5 化ける(trainCap 全stat +1 のご褒美演出)
const INVITE_AWAKENING_LINES = {
  narration: '4週間の最終日——彼女の動きに、来たときとは別人の何かが宿っていた。',
  coachLine: '「……こういう瞬間に立ち会うために、この仕事をしている」', // 全voice共通・中立形
};
