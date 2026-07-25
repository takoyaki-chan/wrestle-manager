# コーチ

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `COACH_INVITE_LINES`

- 出典: `src/coach-lines.js`
- コード内コメント: §7.1〜§7.5 セリフ本体(voiceKey ごと)
- 本数: 40

- `COACH_INVITE_LINES.midterm.sparta_roshi`: 「まだ倒れとらん。見どころはある」
- `COACH_INVITE_LINES.midterm.sparta_tosho`: 「まだ折れていない。目も死んでいない——見どころはある」
- `COACH_INVITE_LINES.midterm.theorist`: 「数値は素直ですよ。フォームの無駄がひとつずつ消えています」
- `COACH_INVITE_LINES.midterm.artisan_bukotsu`: 「……手応えは、ある」
- `COACH_INVITE_LINES.midterm.artisan_seihitsu`: 「……手応えは、あります」
- `COACH_INVITE_LINES.midterm.mentor`: 「あの子、自分で気づき始めましたよ。いい兆しです」
- `COACH_INVITE_LINES.midterm.bigheart_oyaji`: 「いやあ、よく食らいついてくるよ。若いってのはいいねえ」
- `COACH_INVITE_LINES.midterm.bigheart_anego`: 「よく食らいついてくるのよ、あの子。若いっていいわね」
- `COACH_INVITE_LINES.conflict.sparta_roshi`: 「最近、練習に身が入っとらん。あれを甘やかすなら、わしは降りる」
- `COACH_INVITE_LINES.conflict.sparta_tosho`: 「練習に身が入っていない。あれを甘やかすなら、指導はここまでにする」
- `COACH_INVITE_LINES.conflict.theorist`: 「提案したメニューを、彼女は感覚で崩してしまう。これでは計測になりません」
- `COACH_INVITE_LINES.conflict.artisan_bukotsu`: 「……合わん。それだけだ」
- `COACH_INVITE_LINES.conflict.artisan_seihitsu`: 「……合いませんね。どちらが悪いのでも、ないのですが」
- `COACH_INVITE_LINES.conflict.mentor`: 「私の待ち方が、あの子には焦れったいようです。悪いのはどちらでもないのですが」
- `COACH_INVITE_LINES.conflict.bigheart_oyaji`: 「近づこうとするほど、あの子は一歩引くんだよ。参ったね」
- `COACH_INVITE_LINES.conflict.bigheart_anego`: 「近づこうとするほど、一歩引かれちゃってね。……参ったわ」
- `COACH_INVITE_LINES.extension.sparta_roshi`: 「もう2週寄こせ。あれはまだ伸びる」
- `COACH_INVITE_LINES.extension.sparta_tosho`: 「あと2週。あの子には、まだ上がある」
- `COACH_INVITE_LINES.extension.theorist`: 「あと2週あれば、いま作りかけの型が完成します。数字で保証しますよ」
- `COACH_INVITE_LINES.extension.artisan_bukotsu`: 「……もう少し、見たい」
- `COACH_INVITE_LINES.extension.artisan_seihitsu`: 「……もう少しだけ、見せてください」
- `COACH_INVITE_LINES.extension.mentor`: 「芽が出る直前なんです。ここで離れるのは、もったいない」
- `COACH_INVITE_LINES.extension.bigheart_oyaji`: 「なあ社長、もうちょっとだけあの子に付き合わせてくれよ」
- `COACH_INVITE_LINES.extension.bigheart_anego`: 「ねえ社長、もう少しだけあの子に付き合わせてくれない？」
- `COACH_INVITE_LINES.gradGood.sparta_roshi`: 「よく耐えた。あれはもう、わしが居らんでも勝手に強くなる」
- `COACH_INVITE_LINES.gradGood.sparta_tosho`: 「よく耐えた。もう、誰かに追い込まれなくても強くなれる」
- `COACH_INVITE_LINES.gradGood.theorist`: 「教科書に載せたいくらいの吸収曲線でした。データはすべて置いていきます」
- `COACH_INVITE_LINES.gradGood.artisan_bukotsu`: 「……いいものを見た。あとは、あいつのものだ」
- `COACH_INVITE_LINES.gradGood.artisan_seihitsu`: 「……いいものを見ました。あとは、あの子のものです」
- `COACH_INVITE_LINES.gradGood.mentor`: 「私は何も教えていません。あの子が、自分で見つけたんです」
- `COACH_INVITE_LINES.gradGood.bigheart_oyaji`: 「別れが寂しくなっちまった。いい子を預かったよ、社長」
- `COACH_INVITE_LINES.gradGood.bigheart_anego`: 「別れが寂しくなっちゃった。いい子を預かったわ、社長」
- `COACH_INVITE_LINES.gradNormal.sparta_roshi`: 「土台は作った。ここから先は本人の覚悟の問題だ」
- `COACH_INVITE_LINES.gradNormal.sparta_tosho`: 「土台は作った。ここから先は、本人の覚悟の問題」
- `COACH_INVITE_LINES.gradNormal.theorist`: 「伸び幅は想定の範囲内です。継続すれば、もう一段あります」
- `COACH_INVITE_LINES.gradNormal.artisan_bukotsu`: 「……悪くはない」
- `COACH_INVITE_LINES.gradNormal.artisan_seihitsu`: 「……悪くは、ありません」
- `COACH_INVITE_LINES.gradNormal.mentor`: 「ゆっくりな子です。でも、蒔いた種は消えませんよ」
- `COACH_INVITE_LINES.gradNormal.bigheart_oyaji`: 「まあ、こんなもんさ。でも あの子、最後まで笑って走ってたよ」
- `COACH_INVITE_LINES.gradNormal.bigheart_anego`: 「まあ、こんなものよ。でもあの子、最後まで笑って走ってたわよ」

## `FIGHTER_INVITE_GRAD_LINES`

- 出典: `src/coach-lines.js`
- コード内コメント: §7.4 選手の一言 — 手応えあり(アーキタイプ別)
- 本数: 7

### normal

- `FIGHTER_INVITE_GRAD_LINES.normal`: 「自分の身体が変わっていくのが、毎日わかったんです」

### ojousama

- `FIGHTER_INVITE_GRAD_LINES.ojousama`: 「よい師でしたわ。……少しだけ、涙が出ましたけれど」

### delinquent

- `FIGHTER_INVITE_GRAD_LINES.delinquent`: 「べつに。……まあ、アイツの言うことは全部正しかったけどな」

### cool

- `FIGHTER_INVITE_GRAD_LINES.cool`: 「収穫はあった。それ以上でも以下でもない」

### seductive

- `FIGHTER_INVITE_GRAD_LINES.seductive`: 「あんなに汗をかいたの、いつ以来かしら。悪くない4週間だったわ」

### polite

- `FIGHTER_INVITE_GRAD_LINES.polite`: 「最後の日、深く頭を下げました。それしかできることがなくて」

### composed

- `FIGHTER_INVITE_GRAD_LINES.composed`: 「いい時間だったよ。ああいう出会いは、キャリアにそう何度もない」

## `FIGHTER_INVITE_GRAD_NORMAL_LINES`

- 出典: `src/coach-lines.js`
- コード内コメント: §7.4 選手の一言 — 並(共通プール、ランダムに1本)
- 本数: 2

- `FIGHTER_INVITE_GRAD_NORMAL_LINES[1]`: 「……正直、まだ消化しきれてません。でも無駄じゃなかったと思います」
- `FIGHTER_INVITE_GRAD_NORMAL_LINES[2]`: 「合ってたのかどうかは、次の試合で確かめます」

## `INVITE_AWAKENING_LINES`

- 出典: `src/coach-lines.js`
- コード内コメント: §7.5 化ける(trainCap 全stat +1 のご褒美演出)
- 本数: 2

### narration

- `INVITE_AWAKENING_LINES.narration`: 4週間の最終日——彼女の動きに、来たときとは別人の何かが宿っていた。

### coachLine

- `INVITE_AWAKENING_LINES.coachLine`: 「……こういう瞬間に立ち会うために、この仕事をしている」

## `COACH_VOICE_REPORT_LINES`

- 出典: `src/coach-lines.js`
- コード内コメント: E-8 Phase A/B: voice別セリフ展開（本実装） / docs/dialogue-all-coach.xlsx「voice展開草案」248行（Keisuke承認済み）を / スクリプトで機械変換。手打ち転記なし・元台帳と一字一句照合済み。 / 観察レポート/引退アドバイス/雇用/解雇/PPV称賛の5箇所をvoiceKey別に出し分ける。
- 本数: 136

### sparta_roshi.vague[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.vague[1]`: 妙に気合の入っとるのがおる。誰とは言わん
- `COACH_VOICE_REPORT_LINES.sparta_roshi.vague[2]`: 練習場の空気は悪うない。緩んどる者もおらん
- `COACH_VOICE_REPORT_LINES.sparta_roshi.vague[3]`: ここのところ、腰の据わった顔つきが増えとる

### sparta_roshi.named_positive[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.named_positive[1]`: {name}、目の光が違うとる。いいぞ
- `COACH_VOICE_REPORT_LINES.sparta_roshi.named_positive[2]`: {name}は今、乗っとる。この波を逃すな

### sparta_roshi.named_negative[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.named_negative[1]`: {name}、足の踏ん張りが甘い。何かある
- `COACH_VOICE_REPORT_LINES.sparta_roshi.named_negative[2]`: {name}、目が泳いどる。様子を見ておけ

### sparta_roshi.named_neutral[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.named_neutral[1]`: {name}は変わらん。変わらんのも力のうちだ
- `COACH_VOICE_REPORT_LINES.sparta_roshi.named_neutral[2]`: {name}、平熱だ。それでいい

### sparta_roshi.stat_growing[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.stat_growing[1]`: {name}の{stat}、確かに上がっとる。追い込んだ甲斐があった
- `COACH_VOICE_REPORT_LINES.sparta_roshi.stat_growing[2]`: {name}、{stat}が乗ってきた。ここが踏ん張り所だ

### sparta_roshi.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.stat_stagnant[1]`: {name}の{stat}、壁にぶつかっとる。ここからが本番だ
- `COACH_VOICE_REPORT_LINES.sparta_roshi.stat_stagnant[2]`: {name}、{stat}が止まった。甘えではない、壁だ

### sparta_roshi.near_cap[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.near_cap[1]`: {name}の{stat}、天井が見えてきた。ここからは一厘の差だ
- `COACH_VOICE_REPORT_LINES.sparta_roshi.near_cap[2]`: {name}、{stat}はもう伸びしろが乏しい。今の形を守れ

### sparta_roshi.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.sparta_roshi.far_from_cap[1]`: {name}の{stat}、まだ底が見えん。追い込めばもっと伸びる
- `COACH_VOICE_REPORT_LINES.sparta_roshi.far_from_cap[2]`: {name}、{stat}には余力がある。今が仕込み時だ

### sparta_tosho.vague[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.vague[1]`: 目の色が変わってきた者が一人いる。名は伏せる
- `COACH_VOICE_REPORT_LINES.sparta_tosho.vague[2]`: 練習場の緊張は保たれている。緩みはない
- `COACH_VOICE_REPORT_LINES.sparta_tosho.vague[3]`: 足の運びが良くなった者がいる。誰かは言わない

### sparta_tosho.named_positive[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.named_positive[1]`: {name}、目の光が違う。悪くない
- `COACH_VOICE_REPORT_LINES.sparta_tosho.named_positive[2]`: {name}は今、波に乗っている。逃す手はない

### sparta_tosho.named_negative[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.named_negative[1]`: {name}、足の踏ん張りが甘くなっている。何かある
- `COACH_VOICE_REPORT_LINES.sparta_tosho.named_negative[2]`: {name}、目が泳いでいる。注意しておいた方がいい

### sparta_tosho.named_neutral[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.named_neutral[1]`: {name}は変わらない。それも力のひとつ
- `COACH_VOICE_REPORT_LINES.sparta_tosho.named_neutral[2]`: {name}、平熱を保っている。それでいい

### sparta_tosho.stat_growing[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.stat_growing[1]`: {name}の{stat}、確かに上がっている。追い込んだ甲斐があった
- `COACH_VOICE_REPORT_LINES.sparta_tosho.stat_growing[2]`: {name}、{stat}が乗ってきている。ここが踏ん張り所

### sparta_tosho.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.stat_stagnant[1]`: {name}の{stat}、壁にぶつかっている。ここからが本番
- `COACH_VOICE_REPORT_LINES.sparta_tosho.stat_stagnant[2]`: {name}、{stat}が止まった。甘えではない、壁

### sparta_tosho.near_cap[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.near_cap[1]`: {name}の{stat}、天井が見えている
- `COACH_VOICE_REPORT_LINES.sparta_tosho.near_cap[2]`: {name}、{stat}はもう伸びしろが乏しい。今の形を守るべき

### sparta_tosho.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.sparta_tosho.far_from_cap[1]`: {name}の{stat}、まだ底が見えない
- `COACH_VOICE_REPORT_LINES.sparta_tosho.far_from_cap[2]`: {name}、{stat}には余力がある。今が仕込み時

### theorist.vague[]

- `COACH_VOICE_REPORT_LINES.theorist.vague[1]`: 全体のフォームのばらつきが、平均してやや小さくなっていますね
- `COACH_VOICE_REPORT_LINES.theorist.vague[2]`: 練習の集中度に、良い傾向が見えるデータがあります
- `COACH_VOICE_REPORT_LINES.theorist.vague[3]`: 一部の選手の反応速度に、伸びの兆候が出ています

### theorist.named_positive[]

- `COACH_VOICE_REPORT_LINES.theorist.named_positive[1]`: {name}選手、練習中の反応がここ数週で明らかに良くなっています
- `COACH_VOICE_REPORT_LINES.theorist.named_positive[2]`: {name}選手、集中の持続時間が延びている傾向が見て取れます

### theorist.named_negative[]

- `COACH_VOICE_REPORT_LINES.theorist.named_negative[1]`: {name}選手、練習の集中指標がここ最近やや下がっています
- `COACH_VOICE_REPORT_LINES.theorist.named_negative[2]`: {name}選手、動きの精度に小さなブレが増えてきています

### theorist.named_neutral[]

- `COACH_VOICE_REPORT_LINES.theorist.named_neutral[1]`: {name}選手の各種指標は横ばい、安定していると言えますね
- `COACH_VOICE_REPORT_LINES.theorist.named_neutral[2]`: {name}選手、特筆すべき変化は観測されていません

### theorist.stat_growing[]

- `COACH_VOICE_REPORT_LINES.theorist.stat_growing[1]`: {name}選手の{stat}、数値上も明確な上昇曲線を描いています
- `COACH_VOICE_REPORT_LINES.theorist.stat_growing[2]`: {name}選手の{stat}、直近の測定でも伸びが継続しています

### theorist.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.theorist.stat_stagnant[1]`: {name}選手の{stat}、ここ最近は数値が横ばいで、伸びが鈍化しています
- `COACH_VOICE_REPORT_LINES.theorist.stat_stagnant[2]`: {name}選手の{stat}、成長曲線が一時的にプラトーに入っているようです

### theorist.near_cap[]

- `COACH_VOICE_REPORT_LINES.theorist.near_cap[1]`: {name}選手の{stat}、成長曲線の傾きから見て、上限にかなり近い水準です
- `COACH_VOICE_REPORT_LINES.theorist.near_cap[2]`: {name}選手の{stat}、これ以上の伸びは統計的にも限定的だと見込まれます

### theorist.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.theorist.far_from_cap[1]`: {name}選手の{stat}、成長曲線を見る限り、まだ十分な伸び代が残っています
- `COACH_VOICE_REPORT_LINES.theorist.far_from_cap[2]`: {name}選手の{stat}、上限との差はまだ大きく、投資に見合う数値です

### artisan_bukotsu.vague[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.vague[1]`: ……誰かの目つきが、変わった
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.vague[2]`: ……音が、いい。誰の足音かは言わん
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.vague[3]`: ……たるんどる奴は、今はいない

### artisan_bukotsu.named_positive[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.named_positive[1]`: ……{name}、いい顔しとる
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.named_positive[2]`: ……{name}、今は乗っとるな

### artisan_bukotsu.named_negative[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.named_negative[1]`: ……{name}、少し落ちとる
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.named_negative[2]`: ……{name}、何かある目だ

### artisan_bukotsu.named_neutral[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.named_neutral[1]`: ……{name}、いつも通りだ
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.named_neutral[2]`: ……{name}、変わらん。それでいい

### artisan_bukotsu.stat_growing[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.stat_growing[1]`: ……{name}の{stat}、上がっとる。地味だが、確かだ
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.stat_growing[2]`: ……{name}、{stat}に手応えがある

### artisan_bukotsu.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.stat_stagnant[1]`: ……{name}の{stat}、止まっとる。焦る段階じゃない
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.stat_stagnant[2]`: ……{name}、{stat}が頭打ちだ。時間がかかる

### artisan_bukotsu.near_cap[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.near_cap[1]`: ……{name}の{stat}、もう天井が近い
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.near_cap[2]`: ……{name}、{stat}は伸びしろが少ない。守りに入る頃合いだ

### artisan_bukotsu.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.far_from_cap[1]`: ……{name}の{stat}、まだ奥がある
- `COACH_VOICE_REPORT_LINES.artisan_bukotsu.far_from_cap[2]`: ……{name}、{stat}はまだ伸びる。今は仕込み時だ

### artisan_seihitsu.vague[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.vague[1]`: ……どなたかの目つきが、変わりました
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.vague[2]`: ……足音が、良いのです。誰かは申しません
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.vague[3]`: ……たるんでいる方は、今はいませんよ

### artisan_seihitsu.named_positive[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.named_positive[1]`: ……{name}さん、いい顔をされています
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.named_positive[2]`: ……{name}さん、今は乗っていますね

### artisan_seihitsu.named_negative[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.named_negative[1]`: ……{name}さん、少し落ちていますね
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.named_negative[2]`: ……{name}さん、何かある目をされています

### artisan_seihitsu.named_neutral[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.named_neutral[1]`: ……{name}さん、いつも通りです
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.named_neutral[2]`: ……{name}さん、変わりません。それでいいのです

### artisan_seihitsu.stat_growing[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.stat_growing[1]`: ……{name}さんの{stat}、上がっています。地味ですが、確かです
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.stat_growing[2]`: ……{name}さん、{stat}に手応えがあります

### artisan_seihitsu.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.stat_stagnant[1]`: ……{name}さんの{stat}、止まっています。焦る段階ではありません
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.stat_stagnant[2]`: ……{name}さん、{stat}が頭打ちです。時間がかかりますね

### artisan_seihitsu.near_cap[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.near_cap[1]`: ……{name}さんの{stat}、もう天井が近いです
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.near_cap[2]`: ……{name}さん、{stat}は伸びしろが少ないです。守りに入る頃合いですね

### artisan_seihitsu.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.far_from_cap[1]`: ……{name}さんの{stat}、まだ奥があります
- `COACH_VOICE_REPORT_LINES.artisan_seihitsu.far_from_cap[2]`: ……{name}さん、{stat}はまだ伸びます。今は仕込み時ですね

### mentor.vague[]

- `COACH_VOICE_REPORT_LINES.mentor.vague[1]`: 誰かの表情が、最近柔らかくなってきましたよ
- `COACH_VOICE_REPORT_LINES.mentor.vague[2]`: あの子かな……まだ誰とは言えませんが、いい変化があります
- `COACH_VOICE_REPORT_LINES.mentor.vague[3]`: 練習場全体の空気が、少し温かくなった気がします

### mentor.named_positive[]

- `COACH_VOICE_REPORT_LINES.mentor.named_positive[1]`: {name}さん、最近すごく前向きな顔をしていますよ
- `COACH_VOICE_REPORT_LINES.mentor.named_positive[2]`: {name}さん、自分でも手応えを感じ始めているみたいです

### mentor.named_negative[]

- `COACH_VOICE_REPORT_LINES.mentor.named_negative[1]`: {name}さん、少し元気がないかもしれません。気にかけてあげてください
- `COACH_VOICE_REPORT_LINES.mentor.named_negative[2]`: {name}さん、練習中に何か考え込んでいる時間が増えました

### mentor.named_neutral[]

- `COACH_VOICE_REPORT_LINES.mentor.named_neutral[1]`: {name}さん、いつものペースでやっていますよ
- `COACH_VOICE_REPORT_LINES.mentor.named_neutral[2]`: {name}さん、落ち着いて過ごせているみたいです

### mentor.stat_growing[]

- `COACH_VOICE_REPORT_LINES.mentor.stat_growing[1]`: {name}さんの{stat}、着実に伸びてきていますよ。本人も気づいているはずです
- `COACH_VOICE_REPORT_LINES.mentor.stat_growing[2]`: {name}さん、{stat}が良くなってきています。焦らず続けましょう

### mentor.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.mentor.stat_stagnant[1]`: {name}さんの{stat}、少し足踏みしていますね。でも悪いことではありませんよ
- `COACH_VOICE_REPORT_LINES.mentor.stat_stagnant[2]`: {name}さん、{stat}が伸び悩んでいます。本人も気づいているみたいです

### mentor.near_cap[]

- `COACH_VOICE_REPORT_LINES.mentor.near_cap[1]`: {name}さんの{stat}、もう十分に高いところまで来ていますよ
- `COACH_VOICE_REPORT_LINES.mentor.near_cap[2]`: {name}さん、{stat}はこの先はゆっくりになると思います。それも成熟の証です

### mentor.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.mentor.far_from_cap[1]`: {name}さんの{stat}、まだまだこれからですよ。楽しみです
- `COACH_VOICE_REPORT_LINES.mentor.far_from_cap[2]`: {name}さん、{stat}には十分な余地が残っています。焦らず育てましょう

### bigheart_oyaji.vague[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.vague[1]`: 誰とは言わないけどよ、目つきが変わった奴がいるんだよ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.vague[2]`: なんかいい空気なんだよなあ、最近の練習場
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.vague[3]`: 飯の食い方見てりゃわかるもんさ。悪くないよ、今は

### bigheart_oyaji.named_positive[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.named_positive[1]`: {name}、最近いい顔して練習に来るんだよなあ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.named_positive[2]`: {name}、乗ってるよ今。声かけたらもっと伸びるかもな

### bigheart_oyaji.named_negative[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.named_negative[1]`: {name}、なんか元気ないんだよなあ最近。声かけといてやってくれよ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.named_negative[2]`: {name}、飯の食いっぷりが落ちてる。心配だねえ

### bigheart_oyaji.named_neutral[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.named_neutral[1]`: {name}は相変わらずマイペースだよ、あれはあれでいいんだよ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.named_neutral[2]`: {name}、特に変わりもなく元気にやってるよ

### bigheart_oyaji.stat_growing[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.stat_growing[1]`: {name}の{stat}、上がってきてるよ。あの子頑張ってるからなあ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.stat_growing[2]`: {name}、{stat}に手応え出てきたよ。見てて嬉しくなるね

### bigheart_oyaji.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.stat_stagnant[1]`: {name}の{stat}、ちょっと足踏みしてるなあ。まあこういう時期もあるさ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.stat_stagnant[2]`: {name}、{stat}が伸びなくて焦ってるみたいだけど、気長にいこうや

### bigheart_oyaji.near_cap[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.near_cap[1]`: {name}の{stat}、もうだいぶ頭打ち近いなあ。ここまで来たらたいしたもんだよ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.near_cap[2]`: {name}、{stat}はこれ以上は厳しいと思うよ。十分やったさ

### bigheart_oyaji.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.far_from_cap[1]`: {name}の{stat}、まだまだ伸びるよこれ。楽しみだねえ
- `COACH_VOICE_REPORT_LINES.bigheart_oyaji.far_from_cap[2]`: {name}、{stat}には余裕あるよ。今のうちにしっかり鍛えとこう

### bigheart_anego.vague[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.vague[1]`: 誰とは言わないけどね、目つきが変わった子がいるのよ
- `COACH_VOICE_REPORT_LINES.bigheart_anego.vague[2]`: なんかいい空気なのよね、最近の練習場
- `COACH_VOICE_REPORT_LINES.bigheart_anego.vague[3]`: 飯の食い方見てりゃわかるものよ。悪くないわ、今は

### bigheart_anego.named_positive[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.named_positive[1]`: {name}、最近いい顔して練習に来るのよ
- `COACH_VOICE_REPORT_LINES.bigheart_anego.named_positive[2]`: {name}、乗ってるわね今。声かけたらもっと伸びるかもよ

### bigheart_anego.named_negative[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.named_negative[1]`: {name}、なんか元気ないのよね最近。声かけてあげて
- `COACH_VOICE_REPORT_LINES.bigheart_anego.named_negative[2]`: {name}、飯の食いっぷりが落ちてるわ。心配ね

### bigheart_anego.named_neutral[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.named_neutral[1]`: {name}は相変わらずマイペースね、あれはあれでいいのよ
- `COACH_VOICE_REPORT_LINES.bigheart_anego.named_neutral[2]`: {name}、特に変わりもなく元気にやってるわよ

### bigheart_anego.stat_growing[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.stat_growing[1]`: {name}の{stat}、上がってきてるわよ。あの子頑張ってるものね
- `COACH_VOICE_REPORT_LINES.bigheart_anego.stat_growing[2]`: {name}、{stat}に手応え出てきたわ。見てて嬉しくなるわね

### bigheart_anego.stat_stagnant[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.stat_stagnant[1]`: {name}の{stat}、ちょっと足踏みしてるわね。まあこういう時期もあるわ
- `COACH_VOICE_REPORT_LINES.bigheart_anego.stat_stagnant[2]`: {name}、{stat}が伸びなくて焦ってるみたいだけど、気長にいきましょ

### bigheart_anego.near_cap[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.near_cap[1]`: {name}の{stat}、もうだいぶ頭打ち近いわね。ここまで来たらたいしたものよ
- `COACH_VOICE_REPORT_LINES.bigheart_anego.near_cap[2]`: {name}、{stat}はこれ以上は厳しいと思うわ。十分やったわよ

### bigheart_anego.far_from_cap[]

- `COACH_VOICE_REPORT_LINES.bigheart_anego.far_from_cap[1]`: {name}の{stat}、まだまだ伸びるわよこれ。楽しみね
- `COACH_VOICE_REPORT_LINES.bigheart_anego.far_from_cap[2]`: {name}、{stat}には余裕あるわ。今のうちにしっかり鍛えときましょ

## `COACH_VOICE_RETIRE_LINES`

- 出典: `src/coach-lines.js`
- 本数: 72

- `COACH_VOICE_RETIRE_LINES.sparta_roshi.C_positive[1]`: 多分、素直に受け入れるとらん……いや、受け入れるだろう。潮時は本人が一番わかる
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.C_negative[1]`: まだ早いかもしれん。目にまだ光が残っとる
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.B_high[1]`: 本人はもう覚悟を決めとる目だ。通るだろう
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.B_maybe[1]`: 正直、五分と見とる。伝え方一つで転ぶぞ
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.B_hard[1]`: まだ闘志が消えとらん。断られる覚悟はしておけ
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.A_sure[1]`: 間違いない。あれはもう己の中で決着をつけとる
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.A_likely[1]`: 多分、通る。練習終わりの背中に、覚悟が見える
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.A_iffy[1]`: 読めん。あれの中でも、まだ答えが出とらん
- `COACH_VOICE_RETIRE_LINES.sparta_roshi.A_hard[1]`: やめておけ。あの目はまだ、辞める目じゃない
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.C_positive[1]`: 多分、受け入れる。潮時は本人が一番わかっている
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.C_negative[1]`: まだ早いかもしれない。目にまだ光が残っている
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.B_high[1]`: 本人はもう覚悟を決めた目をしている。通るはず
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.B_maybe[1]`: 正直、五分と見ている。伝え方ひとつで転ぶ
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.B_hard[1]`: まだ闘志が消えていない。断られる覚悟はしておくべき
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.A_sure[1]`: 間違いない。もう己の中で決着をつけている
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.A_likely[1]`: 多分、通る。練習終わりの背中に、覚悟が見える
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.A_iffy[1]`: 読めない。まだ本人の中でも答えが出ていない
- `COACH_VOICE_RETIRE_LINES.sparta_tosho.A_hard[1]`: やめておくべき。あの目はまだ、辞める目ではない
- `COACH_VOICE_RETIRE_LINES.theorist.C_positive[1]`: 本人の様子を見る限り、受容の可能性は高いと見立てています
- `COACH_VOICE_RETIRE_LINES.theorist.C_negative[1]`: 現時点のデータからは、時期尚早である可能性が高いと見ています
- `COACH_VOICE_RETIRE_LINES.theorist.B_high[1]`: 練習中の言動から見て、本人の受容度はかなり高いと判断できます
- `COACH_VOICE_RETIRE_LINES.theorist.B_maybe[1]`: 正直なところ、受容と拒否は拮抗しています。判断材料が足りません
- `COACH_VOICE_RETIRE_LINES.theorist.B_hard[1]`: 闘争心の指標がまだ高水準です。拒否の可能性が高いと見ています
- `COACH_VOICE_RETIRE_LINES.theorist.A_sure[1]`: 複数の兆候が揃っています。間違いなく受容すると判断します
- `COACH_VOICE_RETIRE_LINES.theorist.A_likely[1]`: 確度は高いと見ます。行動データの傾向が一致しています
- `COACH_VOICE_RETIRE_LINES.theorist.A_iffy[1]`: データが矛盾しています。正直、予測は困難です
- `COACH_VOICE_RETIRE_LINES.theorist.A_hard[1]`: 断言します。現時点での提案は逆効果になる公算が大きいです
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.C_positive[1]`: ……たぶん、大丈夫だろう
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.C_negative[1]`: ……早い。まだ、やる気だ
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.B_high[1]`: ……あの目は、もう決めとる
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.B_maybe[1]`: ……半々だ。読めん
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.B_hard[1]`: ……目が、死んどらん
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.A_sure[1]`: ……間違いない。もう、決めとる
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.A_likely[1]`: ……たぶん、いい返事が来る
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.A_iffy[1]`: ……読めん。闘志と、体が食い違っとる
- `COACH_VOICE_RETIRE_LINES.artisan_bukotsu.A_hard[1]`: ……よせ。まだ、その時じゃない
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.C_positive[1]`: ……たぶん、大丈夫だと思います
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.C_negative[1]`: ……早いと思います。まだ、やる気ですから
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.B_high[1]`: ……あの目は、もう決めていらっしゃいます
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.B_maybe[1]`: ……半々です。読めません
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.B_hard[1]`: ……目が、死んでいらっしゃいません
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.A_sure[1]`: ……間違いありません。もう、決めていらっしゃいます
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.A_likely[1]`: ……たぶん、いい返事が来ると思います
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.A_iffy[1]`: ……読めません。闘志と、お身体が食い違っています
- `COACH_VOICE_RETIRE_LINES.artisan_seihitsu.A_hard[1]`: ……おやめください。まだ、その時ではありません
- `COACH_VOICE_RETIRE_LINES.mentor.C_positive[1]`: 本人もそろそろかな、という空気を出していますよ
- `COACH_VOICE_RETIRE_LINES.mentor.C_negative[1]`: 本人はまだやる気みたいですよ。難しいかもしれません
- `COACH_VOICE_RETIRE_LINES.mentor.B_high[1]`: 本人も覚悟しているようです。大丈夫だと思いますよ
- `COACH_VOICE_RETIRE_LINES.mentor.B_maybe[1]`: 正直、気持ちは揺れていると思います。タイミング次第ですね
- `COACH_VOICE_RETIRE_LINES.mentor.B_hard[1]`: まだ本人には闘志がありますね。断られる覚悟はしてください
- `COACH_VOICE_RETIRE_LINES.mentor.A_sure[1]`: 間違いなく受け入れます。本人もそのつもりですよ
- `COACH_VOICE_RETIRE_LINES.mentor.A_likely[1]`: 練習後の表情を見ていると……受け入れると思います
- `COACH_VOICE_RETIRE_LINES.mentor.A_iffy[1]`: 正直読めないです。本人の中でも揺れてる感じですね
- `COACH_VOICE_RETIRE_LINES.mentor.A_hard[1]`: 止めた方がいい。あの目はまだ引退する目じゃありませんよ
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.C_positive[1]`: あの子ならすんなり受け入れてくれると思うよ、多分な
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.C_negative[1]`: いやまだ早いんじゃないかなあ。あの子まだやる気満々だよ
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.B_high[1]`: 本人ももう腹くくってる顔してるよ。大丈夫だろうな
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.B_maybe[1]`: 正直五分五分だなあ。あの子の中でも揺れてる感じだよ
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.B_hard[1]`: まだあいつ目が死んでないよ。断られる覚悟はしといた方がいい
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.A_sure[1]`: 間違いないよ。あの子もう次の身の振り方まで考えてるからな
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.A_likely[1]`: 多分通るんじゃないかなあ。あの子薄々わかってる顔してるよ
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.A_iffy[1]`: 読めないんだよなあ、これが。闘志はあるけど体がついてこないみたいでさ
- `COACH_VOICE_RETIRE_LINES.bigheart_oyaji.A_hard[1]`: やめときな、今は。あの目はまだ辞める目じゃないよ、絶対に
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.C_positive[1]`: あの子ならすんなり受け入れてくれると思うわ、多分ね
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.C_negative[1]`: いやまだ早いんじゃないかしら。あの子まだやる気満々よ
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.B_high[1]`: 本人ももう腹くくってる顔してるわよ。大丈夫だと思うわ
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.B_maybe[1]`: 正直五分五分ね。あの子の中でも揺れてる感じよ
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.B_hard[1]`: まだあの子目が死んでないわよ。断られる覚悟はしといた方がいいわ
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.A_sure[1]`: 間違いないわ。あの子もう次の身の振り方まで考えてるもの
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.A_likely[1]`: 多分通るんじゃないかしら。あの子薄々わかってる顔してるわ
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.A_iffy[1]`: 読めないのよねえ、これが。闘志はあるけど体がついてこないみたいでね
- `COACH_VOICE_RETIRE_LINES.bigheart_anego.A_hard[1]`: やめときなさい、今は。あの目はまだ辞める目じゃないわよ、絶対に

## `COACH_VOICE_HIRE_LINES`

- 出典: `src/coach-lines.js`
- 本数: 16

### sparta_roshi[]

- `COACH_VOICE_HIRE_LINES.sparta_roshi[1]`: 「わしを呼んだか。……いいだろう、鍛え直してやる」
- `COACH_VOICE_HIRE_LINES.sparta_roshi[2]`: 「甘い顔はせんぞ。それでもいいなら、任せてもらおう」

### sparta_tosho[]

- `COACH_VOICE_HIRE_LINES.sparta_tosho[1]`: 「呼んだか。ならば、鍛え直す」
- `COACH_VOICE_HIRE_LINES.sparta_tosho[2]`: 「甘い顔はしない。それでも構わないなら、引き受ける」

### theorist[]

- `COACH_VOICE_HIRE_LINES.theorist[1]`: 「お招きいただき光栄です。データに基づいて、着実に成果を出しましょう」
- `COACH_VOICE_HIRE_LINES.theorist[2]`: 「拝見しました、伸びしろのある選手が揃っていますね。楽しみです」

### artisan_bukotsu[]

- `COACH_VOICE_HIRE_LINES.artisan_bukotsu[1]`: 「……よろしく頼む」
- `COACH_VOICE_HIRE_LINES.artisan_bukotsu[2]`: 「……手は抜かん」

### artisan_seihitsu[]

- `COACH_VOICE_HIRE_LINES.artisan_seihitsu[1]`: 「……よろしくお願いします」
- `COACH_VOICE_HIRE_LINES.artisan_seihitsu[2]`: 「……手は抜きません」

### mentor[]

- `COACH_VOICE_HIRE_LINES.mentor[1]`: 「よろしくお願いします。まずは選手一人ひとりを、よく見ることから始めますね」
- `COACH_VOICE_HIRE_LINES.mentor[2]`: 「お力になれるよう、じっくり向き合っていきます」

### bigheart_oyaji[]

- `COACH_VOICE_HIRE_LINES.bigheart_oyaji[1]`: 「いやあ、呼んでくれて嬉しいねえ。よろしく頼むよ」
- `COACH_VOICE_HIRE_LINES.bigheart_oyaji[2]`: 「腕が鳴るなあ。みんなでいい汗かこうぜ」

### bigheart_anego[]

- `COACH_VOICE_HIRE_LINES.bigheart_anego[1]`: 「あら、呼んでくれて嬉しいわ。よろしくね」
- `COACH_VOICE_HIRE_LINES.bigheart_anego[2]`: 「腕が鳴るわねえ。みんなでいい汗かきましょ」

## `COACH_VOICE_FIRE_LINES`

- 出典: `src/coach-lines.js`
- 本数: 8

### sparta_roshi[]

- `COACH_VOICE_FIRE_LINES.sparta_roshi[1]`: 「そうか。……達者でな」

### sparta_tosho[]

- `COACH_VOICE_FIRE_LINES.sparta_tosho[1]`: 「そうか。達者で」

### theorist[]

- `COACH_VOICE_FIRE_LINES.theorist[1]`: 「承知しました。短い間でしたが、良いデータが取れました」

### artisan_bukotsu[]

- `COACH_VOICE_FIRE_LINES.artisan_bukotsu[1]`: 「……そうか。世話になった」

### artisan_seihitsu[]

- `COACH_VOICE_FIRE_LINES.artisan_seihitsu[1]`: 「……そうですか。お世話になりました」

### mentor[]

- `COACH_VOICE_FIRE_LINES.mentor[1]`: 「そうですか……。選手の皆さんによろしくお伝えください」

### bigheart_oyaji[]

- `COACH_VOICE_FIRE_LINES.bigheart_oyaji[1]`: 「そうかい……。世話になったなあ、ありがとよ」

### bigheart_anego[]

- `COACH_VOICE_FIRE_LINES.bigheart_anego[1]`: 「そう……。お世話になったわね、ありがとう」

## `COACH_VOICE_PRAISE_LINES`

- 出典: `src/coach-lines.js`
- 本数: 16

### sparta_roshi[]

- `COACH_VOICE_PRAISE_LINES.sparta_roshi[1]`: 「よくやった。……あそこまで追い込んだ甲斐があったわい」
- `COACH_VOICE_PRAISE_LINES.sparta_roshi[2]`: 「あれが、鍛えた者の顔だ。文句なしだ」

### sparta_tosho[]

- `COACH_VOICE_PRAISE_LINES.sparta_tosho[1]`: 「よくやった。追い込んだ甲斐があった」
- `COACH_VOICE_PRAISE_LINES.sparta_tosho[2]`: 「あれが、鍛え抜いた者の顔。文句なし」

### theorist[]

- `COACH_VOICE_PRAISE_LINES.theorist[1]`: 「素晴らしい結果です。積み上げてきた数値が、そのまま結果に出ましたね」
- `COACH_VOICE_PRAISE_LINES.theorist[2]`: 「あの大舞台での再現性は、本物の実力の証明です」

### artisan_bukotsu[]

- `COACH_VOICE_PRAISE_LINES.artisan_bukotsu[1]`: 「……いい試合だった」
- `COACH_VOICE_PRAISE_LINES.artisan_bukotsu[2]`: 「……よく、やった」

### artisan_seihitsu[]

- `COACH_VOICE_PRAISE_LINES.artisan_seihitsu[1]`: 「……いい試合でした」
- `COACH_VOICE_PRAISE_LINES.artisan_seihitsu[2]`: 「……よく、やりましたね」

### mentor[]

- `COACH_VOICE_PRAISE_LINES.mentor[1]`: 「本人が積み重ねてきたものが、ちゃんと実を結びましたね。嬉しいです」
- `COACH_VOICE_PRAISE_LINES.mentor[2]`: 「見ていて、こちらまで胸が熱くなりました」

### bigheart_oyaji[]

- `COACH_VOICE_PRAISE_LINES.bigheart_oyaji[1]`: 「いやあ最高だったよ！あの舞台であれだけやれるとはなあ」
- `COACH_VOICE_PRAISE_LINES.bigheart_oyaji[2]`: 「見てて泣きそうになったよ。ほんとよく頑張ったなあ」

### bigheart_anego[]

- `COACH_VOICE_PRAISE_LINES.bigheart_anego[1]`: 「もう最高だったわよ！あの舞台であれだけやれるなんてね」
- `COACH_VOICE_PRAISE_LINES.bigheart_anego[2]`: 「見てて泣きそうになったわ。ほんとよく頑張ったわね」

## `COACH_ABILITY_CATALOG`

- 出典: `src/data.js`
- コード内コメント: 特殊能力カタログ（v0.2）— エンジン実装は Phase 2
- 本数: 13

- `COACH_ABILITY_CATALOG.延命術.desc`: wear蓄積 ×0.50
- `COACH_ABILITY_CATALOG.限界突破.desc`: コーチ装着中 全ステtrainCap +4
- `COACH_ABILITY_CATALOG.弱点克服.desc`: 最低ステの trainCap +5
- `COACH_ABILITY_CATALOG.スター製造.desc`: 人気rawGain ×1.2
- `COACH_ABILITY_CATALOG.才能開花.desc`: ペナルティ期ageMul下限 0.90
- `COACH_ABILITY_CATALOG.怪我耐性.desc`: 怪我確率 ×0.6 + 重傷→中傷 40%
- `COACH_ABILITY_CATALOG.人心掌握.desc`: trust低下 ×0.90
- `COACH_ABILITY_CATALOG.闘志注入.desc`: スランプ脱出確率 ×2.0
- `COACH_ABILITY_CATALOG.ステ特化PW.desc`: PW練習選択率 ×1.40
- `COACH_ABILITY_CATALOG.ステ特化SP.desc`: SP練習選択率 ×1.40
- `COACH_ABILITY_CATALOG.ステ特化TE.desc`: TE練習選択率 ×1.40
- `COACH_ABILITY_CATALOG.ステ特化ST.desc`: ST練習選択率 ×1.40
- `COACH_ABILITY_CATALOG.新人育成.desc`: OVR≤50の成長 ×1.5

## `COACH_FLAVOR_DEFS`

- 出典: `src/data.js`
- コード内コメント: フレーバー能力定義（v0.2）— エンジン実装は Phase 2
- 本数: 12

- `COACH_FLAVOR_DEFS.頑健指導.desc`: 重傷→中傷格下げ確率+15%
- `COACH_FLAVOR_DEFS.冷静な分析.desc`: スランプ突入確率 ×0.85
- `COACH_FLAVOR_DEFS.リングの目.desc`: 試合後怪我確率 ×0.90
- `COACH_FLAVOR_DEFS.根性練習.desc`: cond消費+2/週、成長 ×1.05
- `COACH_FLAVOR_DEFS.動作解析.desc`: breakthrough確率 ×1.15
- `COACH_FLAVOR_DEFS.栄養管理.desc`: cond回復 +1/週
- `COACH_FLAVOR_DEFS.話術.desc`: 担当選手trust低下 ×0.95
- `COACH_FLAVOR_DEFS.心の観察.desc`: モチベ喪失回復momentum +0.2/週
- `COACH_FLAVOR_DEFS.癒しのオーラ.desc`: cond回復 +1/週
- `COACH_FLAVOR_DEFS.飲みニケーション.desc`: 担当選手間bond変動 +10%
- `COACH_FLAVOR_DEFS.気の調整.desc`: スランプ脱出確率 ×1.3
- `COACH_FLAVOR_DEFS.理学療法.desc`: 怪我期間 -1週（最低2週）

## `ALL_COACHES`

- 出典: `src/data.js`
- コード内コメント: フォーマット: {id, name, emoji, hasPortrait, grade, gMult, observation, style, abilities:[...], flavor, / salary(万/週), hireFee(万), minOrgPop, desc, [age, gender, origin, profile]}
- 本数: 238

### [].name

- `ALL_COACHES[1].name`: 鬼塚 剛志
- `ALL_COACHES[2].name`: 飛鳥 真琴
- `ALL_COACHES[3].name`: 鶴見 正嗣
- `ALL_COACHES[4].name`: 岩田 拓海
- `ALL_COACHES[5].name`: 沢村 玲子
- `ALL_COACHES[6].name`: 朝日 義男
- `ALL_COACHES[7].name`: 紅林 太一
- `ALL_COACHES[8].name`: 白川 沙耶
- `ALL_COACHES[9].name`: 大森 健吾
- `ALL_COACHES[10].name`: 宮本 花菜
- `ALL_COACHES[11].name`: 真壁 龍太
- `ALL_COACHES[12].name`: 長谷川 美咲
- `ALL_COACHES[13].name`: 黒田 修平
- `ALL_COACHES[14].name`: 土屋 弘美
- `ALL_COACHES[15].name`: 林 拓海
- `ALL_COACHES[16].name`: 森田 悠子
- `ALL_COACHES[17].name`: 篠原 隆
- `ALL_COACHES[18].name`: 赤城 凛
- `ALL_COACHES[19].name`: 西岡 学
- `ALL_COACHES[20].name`: 藤原 千春
- `ALL_COACHES[21].name`: 熊谷 鉄也
- `ALL_COACHES[22].name`: 安藤 美波
- `ALL_COACHES[23].name`: 堀内 義孝
- `ALL_COACHES[24].name`: 中村 紗弓
- `ALL_COACHES[25].name`: 宮沢 康弘
- `ALL_COACHES[26].name`: カルロス 真理
- `ALL_COACHES[27].name`: 大河原 剛士
- `ALL_COACHES[28].name`: 羽田 小百合
- `ALL_COACHES[29].name`: 陳 偉明
- `ALL_COACHES[30].name`: 冴島 楓
- `ALL_COACHES[31].name`: 神崎 鋼子
- `ALL_COACHES[32].name`: 巌流 正道
- `ALL_COACHES[33].name`: 葉月 レナ
- `ALL_COACHES[34].name`: 御堂 清四郎
- `ALL_COACHES[35].name`: 如月 薫

### [].abilities[]

- `ALL_COACHES[1].abilities[1]`: 闘志注入
- `ALL_COACHES[1].abilities[2]`: ステ特化PW
- `ALL_COACHES[1].abilities[3]`: 新人育成
- `ALL_COACHES[2].abilities[1]`: 新人育成
- `ALL_COACHES[2].abilities[2]`: ステ特化SP
- `ALL_COACHES[3].abilities[1]`: 才能開花
- `ALL_COACHES[3].abilities[2]`: ステ特化TE
- `ALL_COACHES[4].abilities[1]`: ステ特化ST
- `ALL_COACHES[4].abilities[2]`: 新人育成
- `ALL_COACHES[5].abilities[1]`: 人心掌握
- `ALL_COACHES[6].abilities[1]`: 人心掌握
- `ALL_COACHES[7].abilities[1]`: 新人育成
- `ALL_COACHES[8].abilities[1]`: スター製造
- `ALL_COACHES[9].abilities[1]`: ステ特化PW
- `ALL_COACHES[10].abilities[1]`: 新人育成
- `ALL_COACHES[11].abilities[1]`: ステ特化ST
- `ALL_COACHES[12].abilities[1]`: 怪我耐性
- `ALL_COACHES[13].abilities[1]`: 新人育成
- `ALL_COACHES[14].abilities[1]`: ステ特化PW
- `ALL_COACHES[15].abilities[1]`: ステ特化SP
- `ALL_COACHES[16].abilities[1]`: 新人育成
- `ALL_COACHES[17].abilities[1]`: ステ特化TE
- `ALL_COACHES[18].abilities[1]`: ステ特化ST
- `ALL_COACHES[19].abilities[1]`: ステ特化TE
- `ALL_COACHES[20].abilities[1]`: 人心掌握
- `ALL_COACHES[21].abilities[1]`: 怪我耐性
- `ALL_COACHES[21].abilities[2]`: ステ特化SP
- `ALL_COACHES[22].abilities[1]`: ステ特化SP
- `ALL_COACHES[23].abilities[1]`: 人心掌握
- `ALL_COACHES[23].abilities[2]`: ステ特化TE
- `ALL_COACHES[24].abilities[1]`: 弱点克服
- `ALL_COACHES[25].abilities[1]`: 怪我耐性
- `ALL_COACHES[25].abilities[2]`: ステ特化ST
- `ALL_COACHES[26].abilities[1]`: スター製造
- `ALL_COACHES[27].abilities[1]`: 新人育成
- `ALL_COACHES[27].abilities[2]`: ステ特化PW
- `ALL_COACHES[28].abilities[1]`: 才能開花
- `ALL_COACHES[28].abilities[2]`: ステ特化SP
- `ALL_COACHES[29].abilities[1]`: 人心掌握
- `ALL_COACHES[30].abilities[1]`: 才能開花
- `ALL_COACHES[30].abilities[2]`: ステ特化TE
- `ALL_COACHES[31].abilities[1]`: 弱点克服
- `ALL_COACHES[31].abilities[2]`: スター製造
- `ALL_COACHES[32].abilities[1]`: 限界突破
- `ALL_COACHES[32].abilities[2]`: ステ特化PW
- `ALL_COACHES[33].abilities[1]`: スター製造
- `ALL_COACHES[33].abilities[2]`: 才能開花
- `ALL_COACHES[34].abilities[1]`: 限界突破
- `ALL_COACHES[34].abilities[2]`: ステ特化TE
- `ALL_COACHES[35].abilities[1]`: 延命術
- `ALL_COACHES[35].abilities[2]`: 怪我耐性

### [].gender

- `ALL_COACHES[1].gender`: 男
- `ALL_COACHES[2].gender`: 女
- `ALL_COACHES[3].gender`: 男
- `ALL_COACHES[4].gender`: 男
- `ALL_COACHES[5].gender`: 女
- `ALL_COACHES[6].gender`: 男
- `ALL_COACHES[7].gender`: 男
- `ALL_COACHES[8].gender`: 女
- `ALL_COACHES[9].gender`: 男
- `ALL_COACHES[10].gender`: 女
- `ALL_COACHES[11].gender`: 男
- `ALL_COACHES[12].gender`: 女
- `ALL_COACHES[13].gender`: 男
- `ALL_COACHES[14].gender`: 女
- `ALL_COACHES[15].gender`: 男
- `ALL_COACHES[16].gender`: 女
- `ALL_COACHES[17].gender`: 男
- `ALL_COACHES[18].gender`: 女
- `ALL_COACHES[19].gender`: 男
- `ALL_COACHES[20].gender`: 女
- `ALL_COACHES[21].gender`: 男
- `ALL_COACHES[22].gender`: 女
- `ALL_COACHES[23].gender`: 男
- `ALL_COACHES[24].gender`: 女
- `ALL_COACHES[25].gender`: 男
- `ALL_COACHES[26].gender`: 女
- `ALL_COACHES[27].gender`: 男
- `ALL_COACHES[28].gender`: 女
- `ALL_COACHES[29].gender`: 男
- `ALL_COACHES[30].gender`: 女
- `ALL_COACHES[31].gender`: 女
- `ALL_COACHES[32].gender`: 男
- `ALL_COACHES[33].gender`: 女
- `ALL_COACHES[34].gender`: 男
- `ALL_COACHES[35].gender`: 女

### [].origin

- `ALL_COACHES[1].origin`: 北海道
- `ALL_COACHES[2].origin`: 大阪
- `ALL_COACHES[3].origin`: 京都
- `ALL_COACHES[4].origin`: 長野
- `ALL_COACHES[5].origin`: 東京
- `ALL_COACHES[6].origin`: 福岡
- `ALL_COACHES[7].origin`: 名古屋
- `ALL_COACHES[8].origin`: 横浜
- `ALL_COACHES[9].origin`: 埼玉
- `ALL_COACHES[10].origin`: 神奈川
- `ALL_COACHES[11].origin`: 沖縄
- `ALL_COACHES[12].origin`: 静岡
- `ALL_COACHES[13].origin`: 広島
- `ALL_COACHES[14].origin`: 新潟
- `ALL_COACHES[15].origin`: 兵庫
- `ALL_COACHES[16].origin`: 岩手
- `ALL_COACHES[17].origin`: 熊本
- `ALL_COACHES[18].origin`: 群馬
- `ALL_COACHES[19].origin`: 奈良
- `ALL_COACHES[20].origin`: 石川
- `ALL_COACHES[21].origin`: 宮城
- `ALL_COACHES[22].origin`: 愛知
- `ALL_COACHES[23].origin`: 山梨
- `ALL_COACHES[24].origin`: 千葉
- `ALL_COACHES[25].origin`: 山形
- `ALL_COACHES[26].origin`: ブラジル
- `ALL_COACHES[27].origin`: 北海道
- `ALL_COACHES[28].origin`: 東京
- `ALL_COACHES[29].origin`: 台湾
- `ALL_COACHES[30].origin`: 大阪
- `ALL_COACHES[31].origin`: 東京
- `ALL_COACHES[32].origin`: 鹿児島
- `ALL_COACHES[33].origin`: 福岡
- `ALL_COACHES[34].origin`: 東京
- `ALL_COACHES[35].origin`: 京都

### [].desc

- `ALL_COACHES[1].desc`: パワー育成の鬼。若手選手を力強く鍛え上げる。
- `ALL_COACHES[2].desc`: スピード強化の専門家。試合で使えるスピードを徹底的に叩き込む。
- `ALL_COACHES[3].desc`: テクニックの匠。選手の潜在能力を引き出す観察眼が鋭い。
- `ALL_COACHES[4].desc`: スタミナとフィジカル強化のプロ。コンディション管理にも定評がある。
- `ALL_COACHES[5].desc`: メンタル強化の専門家。ベテラン選手の長期安定稼働を支える。
- `ALL_COACHES[6].desc`: 万能型の指導者。若手の総合力底上げが得意。
- `ALL_COACHES[7].desc`: 試合構成の達人。担当選手の試合MQを引き上げる。
- `ALL_COACHES[8].desc`: 業界人脈が豊富。スカウト候補に追加選手を引き込む。
- `ALL_COACHES[9].desc`: 元ボディビルダーのトレーナー。地道にフィジカルの土台を作る。
- `ALL_COACHES[10].desc`: 元体操選手の若手コーチ。新人の素質を見抜く直感が鋭い。
- `ALL_COACHES[11].desc`: 元MMA選手。実戦で使えるテクニックだけを叩き込む。
- `ALL_COACHES[12].desc`: 理学療法士。選手の故障予防とリカバリーに特化。
- `ALL_COACHES[13].desc`: 元スポーツ紙記者。業界全体に張り巡らされた情報網を持つ。
- `ALL_COACHES[14].desc`: 元ウエイトリフティング選手。ベテランのパワー維持に長けた姉御肌。
- `ALL_COACHES[15].desc`: 元キックボクサー。実戦形式でスピードと反射神経を鍛える。
- `ALL_COACHES[16].desc`: ヨガと栄養学による地味だが堅実なコンディション管理。
- `ALL_COACHES[17].desc`: 元レフェリー歴30年。リングの中から培った試合眼の持ち主。
- `ALL_COACHES[18].desc`: 元女子レスリング選手。スパルタ式でフィジカルを鍛え上げる。
- `ALL_COACHES[19].desc`: バイオメカニクス研究者。科学的分析で選手の技術を最適化する。
- `ALL_COACHES[20].desc`: 元メンタルトレーナー。ベテラン選手の心を支え闘志を再点火する。
- `ALL_COACHES[21].desc`: 元ラグビー日本代表フィジカルコーチ。瞬発力トレーニングを武器とする異色のコンディショニング指導者。
- `ALL_COACHES[22].desc`: 元女子MMA王者「閃光」。スピードを活かした実戦指導の達人。
- `ALL_COACHES[23].desc`: 元レスリングナショナルコーチ。選手の隠れた才能を見逃さない名伯楽。
- `ALL_COACHES[24].desc`: 元新体操日本代表。基礎の美しさから強い選手を育てる万能型。
- `ALL_COACHES[25].desc`: 元スポーツ整形外科医。医学的知見でベテラン選手の寿命を延ばす。
- `ALL_COACHES[26].desc`: 日系ブラジル人の元エージェント。国内外の格闘技界に太いパイプを持つ。
- `ALL_COACHES[27].desc`: 元グレコローマン全日本王者。若手のパワーを短期間で開花させる。
- `ALL_COACHES[28].desc`: 元プロダンサー。ベテランの動きのキレとしなやかさを維持させる。
- `ALL_COACHES[29].desc`: 東洋医学の専門家。心身を総合的に診て最適なコンディションに導く。
- `ALL_COACHES[30].desc`: 元ブラジリアン柔術黒帯。反復ドリルで関節技と寝技の技術を叩き込む。
- `ALL_COACHES[31].desc`: 「鉄の母」と呼ばれる伝説的指導者。何人もの日本代表選手を輩出した最高峰。
- `ALL_COACHES[32].desc`: 元大相撲力士のパワー系最高峰。実戦で通用する力を最短で身につけさせる。
- `ALL_COACHES[33].desc`: 元ショートトラックスピードスケート五輪銀メダリスト。女子プロレスでも一時代を築いた異色の経歴を持つ。
- `ALL_COACHES[34].desc`: 柔道五輪金メダリスト「技の神」。業界随一の観察眼を持つ生ける伝説。
- `ALL_COACHES[35].desc`: JOC帯同のスポーツ医学博士。コンディション管理の最高権威。

### [].profile

- `ALL_COACHES[1].profile`: 元柔道全日本代表。引退後は独自のパワートレーニング理論を確立し、多くの格闘家を育て上げた。「力なき技は無力」が口癖。厳しいが、弟子想いの熱血指導者。
- `ALL_COACHES[2].profile`: 元陸上短距離選手で、100m走の元ジュニア日本記録保持者。スポーツ科学を専攻し、反応速度と瞬発力の最適化に特化した独自メソッドを持つ。明るく前向きな性格で選手からの信頼が厚い。
- `ALL_COACHES[3].profile`: 伝統派空手の八段師範で、技の精度と美しさを極限まで追求する職人気質。寡黙だが、一言一言に含蓄がある。「技は千回の反復から生まれる」と繰り返し教えている。
- `ALL_COACHES[4].profile`: 元トライアスロン選手。高地トレーニングや心肺機能の強化プログラムに精通。科学的アプローチで選手の持久力を最大限まで引き出す。温厚で計画的な性格。
- `ALL_COACHES[5].profile`: 臨床心理士の資格を持つスポーツ心理学者。試合前のプレッシャー管理、集中力維持、モチベーション管理を得意とする。穏やかな物腰だが、核心を突く洞察力を持つ。
- `ALL_COACHES[6].profile`: 元プロレスラーで、現役時代は「器用貧乏」と呼ばれながらも15年のキャリアを全うした苦労人。全てのポジションを経験した豊富な知識で、若手の総合力底上げを得意とする。面倒見が良い。
- `ALL_COACHES[7].profile`: 元プロレス実況アナウンサーで試合構成を熟知するセコンドマン。リング外から「次の展開」を的確に指示し、試合のドラマ性を引き上げる。話術に長け、社交的な性格。
- `ALL_COACHES[8].profile`: 元芸能事務所マネージャーで、SNSマーケティングとメディア露出戦略のプロ。選手の魅力を引き出すブランディングが得意。行動力があり、常に新しいプロモーション企画を提案する。
- `ALL_COACHES[9].profile`: 元アマチュアボディビル入賞者。筋肉づくりの知識は確かだが、プロレス指導の経験はまだ浅い。地道なフィジカルトレーニングで選手の土台をコツコツ作り上げる。口下手だが、黙々と付き合ってくれる信頼感がある。
- `ALL_COACHES[10].profile`: 体操競技で培った身体能力と空間認識力を持つ若きコーチ。新人の素質を見抜く直感に優れ、荒削りな原石を見つけ出すのが得意。指導経験はまだ浅いが、選手と同じ目線で成長を後押しする姿勢が持ち味。
- `ALL_COACHES[11].profile`: MMAの実戦経験から関節技やグラウンドテクニックに精通。「試合で使えない技術は教えない」がモットーの実戦派。感情を表に出さないクールな指導スタイルだが、試合前のアドバイスは的確で頼りになる。
- `ALL_COACHES[12].profile`: スポーツリハビリの専門家として、選手の故障予防と回復を支える。派手さはないが、コンディション管理において堅実な仕事をする。「壊れてからでは遅い」が口癖で、日々の体調チェックを欠かさない。
- `ALL_COACHES[13].profile`: 長年の取材活動で築いた人脈は業界随一。あらゆる団体の内情や有望選手の情報が集まってくる。コーチとしての指導力はまだまだだが、スカウト情報の質と速さでは右に出る者がいない。おしゃべり好きで団体のムードメーカー。
- `ALL_COACHES[14].profile`: パワー系トレーニングの知識と中高年の体作りの経験を併せ持つベテランコーチ。年齢を重ねた選手の身体を理解し、無理のない方法でパワーを維持させることに長けている。「あんたはまだまだやれる」と選手を鼓舞する頼れる姉御。
- `ALL_COACHES[15].profile`: キックボクシングで磨いたフットワークと反射神経を武器にするスピード系コーチ。「考える前に動け」がモットーで、実戦形式の練習を好む。やや性急なところはあるが、選手と一緒に汗を流す情熱的な指導で慕われている。
- `ALL_COACHES[16].profile`: ヨガと栄養学の知識を組み合わせた独自のコンディショニング指導が持ち味。目立つ成果はすぐには出ないが、長期的に選手の体質を改善する堅実な手腕がある。物静かで存在感は薄いが、選手の小さな変化も見逃さない。
- `ALL_COACHES[17].profile`: レフェリーとして数千試合をリングの中から見てきた試合眼の持ち主。選手の長所を見抜き、それを活かす試合運びを提案するのが得意。自らリングに上がることはないが、技術アドバイスの正確さは折り紙付き。控えめだが、言葉に重みがある。
- `ALL_COACHES[18].profile`: レスリングで鍛えた実戦感覚と圧倒的なフィジカルを持つスパルタコーチ。練習は厳しいが、選手が壁を乗り越えた瞬間に見せる笑顔は本物。「甘やかして強くなった人間はいない」が信条。不器用だが、選手の成長を誰よりも喜ぶ。
- `ALL_COACHES[19].profile`: 身体の動きを科学的に分析するスペシャリスト。映像分析やデータを駆使して選手の技術を最適化する。プロレスの現場経験は少ないが、理論に基づいた的確な改善提案で信頼を得つつある。話し始めると止まらないマニアックな一面も。
- `ALL_COACHES[20].profile`: 数多くのプロアスリートのメンタルケアを手掛けてきたベテラン。長年戦い続けた選手の心の疲労を読み取り、再び闘志を灯す手助けをする。「身体が動かないのは、心が止まっているから」が持論。穏やかな語り口で選手に寄り添う。
- `ALL_COACHES[21].profile`: 元ラグビー日本代表フィジカルコーチ。恵まれた体格に加え、瞬発力トレーニングを武器とする異色のコンディショニング指導者。ラグビー仕込みの爆発的なダッシュとタックルドリルで選手のスピードを底上げする。「デカいだけじゃ意味がない、速く動けるデカさを作れ」が信条。
- `ALL_COACHES[22].profile`: MMAで「閃光」の異名を取ったスピードファイター。現役時代の実戦経験を基に、スピードを活かした攻防の極意を叩き込む。妥協を許さないストイックな指導だが、選手からの信頼は厚い。「速さは才能じゃない、執念だ」と説く。
- `ALL_COACHES[23].profile`: レスリング指導の世界で長年培った観察眼は、選手の隠れた才能を見逃さない。派手な指導はしないが、一人ひとりの特性に合わせた技術指導で着実に選手を伸ばす。「答えは選手の中にある。それを引き出すのが俺の仕事だ」と語る。
- `ALL_COACHES[24].profile`: 新体操の美しさと厳しさの中で培われた万能型の指導力を持つ。新人の基礎作りからメンタル面まで幅広くカバーし、バランスの取れた選手を育成する。「基礎が美しい選手は、必ず強くなる」を信じて疑わない情熱的な指導者。
- `ALL_COACHES[25].profile`: 医師としての深い身体知識を持つ異色のコーチ。ベテラン選手特有の身体の悩みを医学的見地から理解し、適切な調整法を提案する。「選手の寿命を一年でも延ばす」ことに情熱を注ぐ。慎重な性格で、無理は絶対にさせない。
- `ALL_COACHES[26].profile`: 日本とブラジルの格闘技コミュニティに太いパイプを持つ国際派コーチ。海外の有望選手の情報にも精通し、他団体との交渉でも力を発揮する。指導力は発展途上だが、人脈と情報収集力はB格随一。「人を繋ぐことが、私の一番の技術」と語る。
- `ALL_COACHES[27].profile`: グレコローマンで鍛え上げた圧倒的なパワーと、若手を一人前に育てる手腕を兼ね備えた実力派コーチ。基礎体力の徹底と実戦練習を組み合わせた指導で、新人のパワーを短期間で開花させる。「強くなりたいなら、まず自分に負けるな」が口癖。
- `ALL_COACHES[28].profile`: ダンスで培った身体操作と表現力の知見をプロレスに応用する異色のコーチ。ベテラン選手の動きのキレを維持し、年齢を感じさせないしなやかさを引き出す。「身体は楽器。手入れを怠れば音は鈍る」という哲学でスピードを守り続ける。
- `ALL_COACHES[29].profile`: 東洋医学の叡智とスポーツ科学を融合させたコンディショニングの達人。選手の心身の状態を総合的に診て、最適な調整を施す。「気の流れが整えば、身体は自ずと応える」という哲学に基づく独自のアプローチは、多くの選手から絶大な信頼を得ている。
- `ALL_COACHES[30].profile`: ブラジリアン柔術の国際大会で優勝経験を持つ技巧派。一つの技を何百回と反復させるドリル式指導で、選手のテクニックを確実に底上げする。口数は少ないが、マット上での手本は雄弁。「身体が覚えるまで、何度でも」が指導哲学。
- `ALL_COACHES[31].profile`: 女子バレーボール日本代表監督として五輪に4度帯同し、「鉄の母」と呼ばれた伝説的指導者。彼女の元から巣立った日本代表選手は両手では数えきれない。新人の原石を見抜く眼力と、才能を最大限に引き出す指導力は他の追随を許さない。近年は女子プロレス界にもその手腕を発揮し、格闘技未経験の選手を一流のレスラーへ育て上げる実績を次々と打ち立てている。厳しさの奥に深い愛情を秘めた、スポーツ指導界の生きる伝説。
- `ALL_COACHES[32].profile`: 角界で鍛え上げた圧倒的なパワー理論と、格闘技指導で磨いた実戦メソッドを持つ最高峰のパワー系コーチ。その指導を受けた選手は例外なくパワーで試合を支配するようになると言われる。威圧的な風貌だが、弟子思いの人情家。「力とは、覚悟の結晶だ」と説く。
- `ALL_COACHES[33].profile`: ショートトラックスピードスケートでオリンピック銀メダルを獲得した元スプリンター。氷上で培った爆発的な加速力と接触を恐れない勝負度胸を武器に、引退後は女子プロレスに転身して一時代を築いた異色の経歴を持つ。二つの世界で頂点を知る彼女だからこそ、選手の中に眠るスピードの才能を誰よりも的確に見抜き、引き出すことができる。「速さの本質は、一歩目に全てを懸ける覚悟」と語るカリスマ。
- `ALL_COACHES[34].profile`: 柔道でオリンピック金メダルを獲得し「技の神」と称される生ける伝説。世界柔道殿堂入りを果たし、引退後は国際柔道連盟テクニカルアドバイザーとして世界各国の選手を指導。選手の動きを一目見ただけでその強みと弱点を見抜く観察眼は、業界で最も畏怖される能力。多くを語らないが、そのひと言が選手の人生を変えると言われる。
- `ALL_COACHES[35].profile`: オリンピックの舞台で日本のトップアスリートを支え続けてきたスポーツ医学の最高権威。身体のコンディショニングに関して、この人の右に出る者は日本にいないと言われる。科学的根拠に基づく緻密なプログラムで選手の潜在能力を限界まで引き出す。冷静な外見の奥に、選手への深い情熱を秘めている。

### [].flavor

- `ALL_COACHES[5].flavor`: 心の観察
- `ALL_COACHES[6].flavor`: 飲みニケーション
- `ALL_COACHES[7].flavor`: 話術
- `ALL_COACHES[9].flavor`: 頑健指導
- `ALL_COACHES[11].flavor`: 冷静な分析
- `ALL_COACHES[12].flavor`: 理学療法
- `ALL_COACHES[15].flavor`: 根性練習
- `ALL_COACHES[16].flavor`: 栄養管理
- `ALL_COACHES[17].flavor`: リングの目
- `ALL_COACHES[19].flavor`: 動作解析
- `ALL_COACHES[20].flavor`: 癒しのオーラ
- `ALL_COACHES[29].flavor`: 気の調整
